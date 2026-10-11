import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TeamController} from '../src/orchestrator.js';
import {JevTeamController} from '../src/jev-controller.js';
import {RETENTION_LIMITS} from '../src/team-contracts.js';
import {fixtureDependencies, settings} from './helpers/team-host.mjs';

const task=(id,role='worker',dependsOn=[])=>({id,role,dependsOn,title:id,instructions:`Perform ${id}`});
const approve={verdict:'approve',summary:'Fixture review',issues:[]};
const config=(limits={})=>({sessionId:'recovery-fixture',goal:'Bounded fixture task',...settings(),limits:{...settings().limits,maxAgents:32,maxRetries:1,...limits}});
const ok=output=>({stopReason:'completed',output:output||'Observed fixture evidence'});
const stepLimit=()=>({stopReason:'error',failureCode:'STEP_LIMIT',error:'Model step cap reached',retryable:true,blocked:false,output:'Partial evidence before the cap'});
function fixture({tasks=[task('read','researcher'),task('write','worker',['read'])],handle=()=>ok(),jev=false,decide,now}={}){
 const calls=[];
 const execute=async request=>{
  calls.push(request);
  if(['planner','coordinator'].includes(request.role))return {stopReason:'completed',structured:{summary:'Fixture DAG',tasks}};
  if(request.role==='reviewer')return {stopReason:'completed',structured:approve};
  return handle(request);
 };
 const deps=fixtureDependencies();if(decide)deps.jev.decide=decide;
 const controller=jev?new JevTeamController({...deps,execute,now}):new TeamController({execute,now});
 return {controller,calls};
}
async function finish(f,limits={}){const started=f.controller.start(config(limits));try{return await f.controller.wait(started.id);}finally{await f.controller.dispose();}}
const classify={lane:{choice:'small',confidence:.9},security_sensitive:{noul:0},underspecified:{noul:0}};
const decision=choice=>({implemented:{noul:choice==='complete'?1:.2},in_scope:{noul:1},next:{choice,confidence:.9}});
async function until(predicate){for(let i=0;i<200;i++){if(predicate())return;await new Promise(setImmediate);}assert.fail('Fixture did not reach expected state');}

test('STEP_LIMIT preserves its code, recovers only the failed task, and activates latest dependencies',async()=>{
 let attempts=0;
 const f=fixture({handle:request=>request.role==='researcher'&&attempts++===0?stepLimit():ok()});
 const result=await finish(f);
 assert.equal(result.status,'completed');assert.equal(result.failureCode,undefined);
 const revisions=result.nodes.filter(node=>node.taskId==='read');
 assert.equal(revisions.length,2);assert.equal(revisions[0].failureCode,'STEP_LIMIT');assert.equal(revisions[0].status,'failed');
 assert.equal(revisions[1].status,'completed');
 const write=result.nodes.find(node=>node.taskId==='write');assert.deepEqual(write.dependsOn,[revisions[1].id]);
 assert.deepEqual(result.currentTaskNodeIds,[revisions[1].id,write.id]);
 const retry=f.calls.filter(call=>call.role==='researcher')[1];
 assert.match(retry.prompt,/Single bounded STEP_LIMIT recovery/);assert.match(retry.prompt,/Partial evidence before the cap/);
 for(const call of f.calls){assert.match(call.prompt,/hard limit of 8 model steps/);assert.match(call.prompt,/Reserve the final step/);assert.equal(call.limits.maxStepsPerAgent,8);}
 const activations=result.events.filter(event=>event.type==='relation_activated');
 assert.equal(new Set(activations.map(event=>event.edgeId)).size,activations.length);
 for(const event of activations){const edge=result.edges.find(edge=>edge.id===event.edgeId);assert.ok(edge);assert.equal(event.fromNodeId,edge.from);assert.equal(event.toNodeId,edge.to);assert.equal(event.kind,edge.kind);}
 const dependencies=activations.filter(event=>event.kind==='dependency');
 assert.deepEqual(dependencies.map(event=>event.fromNodeId),[revisions[1].id]);
 assert.ok(dependencies.every(event=>event.message==='dependency satisfied'));
 assert.ok(activations.some(event=>event.kind==='retry'&&event.toNodeId===revisions[1].id));
});

test('one step-limit recovery is the upper bound even when maxRetries is two',async()=>{
 const f=fixture({handle:()=>stepLimit()});const result=await finish(f,{maxRetries:2});
 assert.equal(result.status,'blocked');assert.equal(result.failureCode,'STEP_LIMIT');
 assert.equal(f.calls.filter(call=>call.role==='researcher').length,2);assert.equal(f.calls.filter(call=>call.role==='worker').length,0);
 assert.equal(result.nodes.find(node=>node.taskId==='write').failureCode,'DEPENDENCY_FAILED');
 assert.equal(result.events.filter(event=>event.kind==='dependency'&&event.type==='relation_activated').length,0);
});

test('zero retries disables step-limit recovery, retaining root failure instead of dependency symptom',async()=>{
 const f=fixture({handle:()=>stepLimit()});const result=await finish(f,{maxRetries:0});
 assert.equal(result.failureCode,'STEP_LIMIT');assert.equal(f.calls.filter(call=>call.role==='researcher').length,1);
});

test('Jev permits the same bounded single-task recovery without dispatching a second plan',async()=>{
 let tries=0;
 const f=fixture({jev:true,handle:request=>request.role==='researcher'&&tries++===0?stepLimit():ok()});
 const result=await finish(f);
 assert.equal(result.status,'completed');assert.equal(result.jev.round,1);
 assert.equal(f.calls.filter(call=>call.role==='planner').length,1);assert.equal(f.calls.filter(call=>call.role==='researcher').length,2);
});

test('Jev does not repeatedly replan a step-limited task after the one recovery is exhausted',async()=>{
 const f=fixture({jev:true,handle:()=>stepLimit(),decide:async({phase})=>phase==='classify'?classify:decision('continue')});
 const result=await finish(f,{maxRetries:2});
 assert.equal(result.status,'blocked');assert.equal(result.failureCode,'STEP_LIMIT');assert.equal(result.jev.round,1);
 assert.equal(f.calls.filter(call=>call.role==='researcher').length,2);
});

test('historic dependency-blocked tasks cannot poison a later successful Jev cycle',async()=>{
 let reads=0,steps=0;
 const f=fixture({jev:true,handle:request=>request.role==='researcher'&&reads++===0?{stopReason:'error'}:ok(),decide:async({phase})=>phase==='classify'?classify:decision(++steps===1?'continue':'complete')});
 const result=await finish(f);
 assert.equal(result.status,'completed');assert.equal(result.jev.round,2);
 assert.ok(result.nodes.some(node=>node.failureCode==='DEPENDENCY_FAILED'));
 assert.ok(result.currentTaskNodeIds.every(id=>result.nodes.find(node=>node.id===id).status==='completed'));
 assert.equal(result.currentTaskNodeIds.length,2);
});

test('hard failures preserve exact codes and never retry even if a result claims retryable',async()=>{
 for(const code of ['PERMISSION_DENIED','TOOL_BOUNDARY','AGENT_BUDGET','DEADLINE','CLEANUP_UNCONFIRMED','BUDGET_INSUFFICIENT']){
  for(const thrown of [false,true]){
   const f=fixture({jev:true,handle:()=>{if(thrown)throw Object.assign(new Error(`Fixture ${code}`),{code,retryable:true,blocked:false});return {stopReason:'error',failureCode:code,error:`Fixture ${code}`,retryable:true,blocked:false};}});
   const result=await finish(f,{maxRetries:2});
   assert.equal(result.status,'blocked');assert.equal(result.failureCode,code);assert.equal(f.calls.filter(call=>call.role==='researcher').length,1);
   assert.equal(result.nodes.find(node=>node.taskId==='read').failureCode,code);
  }
 }
});

test('agent budget and real elapsed deadline produce structured run and node failures',async()=>{
 const f=fixture();const result=await finish(f,{maxAgents:1});assert.equal(result.failureCode,'AGENT_BUDGET');assert.ok(result.nodes.some(node=>node.failureCode==='AGENT_BUDGET'));assert.equal(f.calls.length,1);
 let time=10000;
 const g=fixture({now:()=>time,handle:()=>{time+=1001;return ok();}});const deadline=await finish(g,{maxDurationMs:1000});
 assert.equal(deadline.failureCode,'DEADLINE');assert.ok(deadline.nodes.some(node=>node.failureCode==='DEADLINE'));
 assert.equal(g.calls.filter(call=>call.role==='worker').length,0);
});

test('creating dependency edges never fabricates activation before a pending task is dispatched',async()=>{
 let release;
 const f=fixture({handle:request=>request.role==='researcher'?new Promise(resolve=>release=()=>resolve(ok())):ok()});
 const start=f.controller.start(config());
 try{
  await until(()=>!!release);const pending=f.controller.snapshot(start.sessionId);
  const write=pending.nodes.find(node=>node.taskId==='write');assert.equal(write.status,'pending');
  assert.ok(pending.edges.some(edge=>edge.kind==='dependency'&&edge.to===write.id));
  assert.equal(pending.events.filter(event=>event.type==='relation_activated'&&event.toNodeId===write.id).length,0);
  release();const result=await f.controller.wait(start.id);
  assert.ok(result.events.some(event=>event.type==='relation_activated'&&event.kind==='dependency'&&event.toNodeId===write.id));
 }finally{release?.();await f.controller.dispose();}
});

test('snapshot retention exposes observation time, truncation and the oldest retained event sequence',async()=>{
 let now=1000;const f=fixture({now:()=>now});const started=f.controller.start(config());
 try{
  const run=f.controller.runs.get(started.id);for(let i=0;i<RETENTION_LIMITS.events+10;i++){now++;f.controller._event(run,'fixture','Bounded fixture');}
  const snapshot=f.controller.snapshot(started.sessionId);
  assert.equal(snapshot.events.length,RETENTION_LIMITS.events);assert.equal(snapshot.eventsTruncated,true);assert.equal(snapshot.oldestSeq,snapshot.events[0].seq);assert.ok(snapshot.oldestSeq>1);
  assert.equal(snapshot.observedAt,new Date(now).toISOString());
  await f.controller.wait(started.id);
 }finally{await f.controller.dispose();}
});


test('routing and Jev decisions link to the exact timestamped decision event',async()=>{
 const f=fixture({jev:true});const result=await finish(f);
 for(const record of [...result.production.routing.decisions,...result.jev.decisions]){
  assert.ok(record.decisionId);assert.ok(record.nodeId);
  const event=result.events.find(event=>event.seq===record.eventSeq);
  assert.ok(event);assert.ok(['model_routed','jev_decision'].includes(event.type));
  assert.equal(record.at,event.at);assert.equal(record.nodeId,event.nodeId);
 }
});


test('cleanup failure survives the cancellation issued by the runtime quarantine callback',async()=>{
 let f;
 f=fixture({handle:request=>{f.controller.cancel(request.sessionId,request.runId);throw Object.assign(new Error('Fixture cleanup unconfirmed'),{code:'CLEANUP_UNCONFIRMED',blocked:true,retryable:false});}});
 const result=await finish(f);
 assert.equal(result.status,'blocked');assert.equal(result.failureCode,'CLEANUP_UNCONFIRMED');
 assert.equal(result.nodes.find(node=>node.taskId==='read').failureCode,'CLEANUP_UNCONFIRMED');
 assert.equal(result.events.at(-1).failureCode,'CLEANUP_UNCONFIRMED');
 assert.equal(f.calls.filter(call=>call.role==='worker').length,0);
});

test('an unclassified refusal does not invent a model or native permission cause',async()=>{
 const f=fixture({handle:()=>({stopReason:'refusal'})});const result=await finish(f);
 assert.equal(result.status,'blocked');assert.equal(result.failureCode,'EXECUTION_REFUSED');assert.equal(f.calls.filter(call=>call.role==='researcher').length,1);
});

test('a structured cleanup result cannot be masked by concurrent runtime cancellation',async()=>{
 let f;
 f=fixture({handle:request=>{f.controller.cancel(request.sessionId,request.runId);return {stopReason:'error',failureCode:'CLEANUP_UNCONFIRMED',error:'Fixture cleanup result',retryable:false,blocked:true};}});
 const result=await finish(f);
 assert.equal(result.status,'blocked');assert.equal(result.failureCode,'CLEANUP_UNCONFIRMED');
 assert.equal(result.nodes.find(node=>node.taskId==='read').failureCode,'CLEANUP_UNCONFIRMED');
});

test('retention exhaustion keeps the partially created current task set visible',async()=>{
 const tasks=[task('root','researcher'),...Array.from({length:11},(_,i)=>task(`dependent-${i}`,'worker',['root']))];
 const f=fixture({jev:true,tasks,handle:()=>({stopReason:'error'}),decide:async({phase})=>phase==='classify'?classify:decision('continue')});
 const result=await finish(f,{maxRounds:8,maxTasks:12,maxRetries:0});
 assert.equal(result.failureCode,'RETENTION_LIMIT');
 const finalTasks=result.nodes.filter(node=>node.kind==='task'&&node.failureCode==='RETENTION_LIMIT');
 assert.ok(finalTasks.length>0);assert.deepEqual(result.currentTaskNodeIds,finalTasks.map(node=>node.id));
 assert.ok(result.nodes.length<=RETENTION_LIMITS.nodes);
});

for(const mode of ['analysis-only','unverified-editable','needsVerification']){
 test(`${mode} cannot describe a failed task graph as ready for verification`,async()=>{
  const f=fixture({jev:true,tasks:[task('explore','explorer'),task('dependent','researcher',['explore'])],handle:()=>({stopReason:'error'})});
  const collect=f.controller.verifier.collect;
  f.controller.verifier.collect=async spec=>{
   const evidence=await collect(spec);
   if(spec.phase==='baseline')return {...evidence,project:{mode:mode==='needsVerification'?'verified':mode,reason:'Fixture verification limitation'}};
   return {...evidence,...(mode==='needsVerification'?{needsVerification:true}:{}),reason:'Fixture verification limitation'};
  };
  const result=await finish(f);
  assert.equal(result.status,'blocked');assert.equal(result.failureCode,'DEPENDENCY_FAILED');
  assert.match(result.message,/Agent stopped: error/);
  assert.doesNotMatch(result.message,/结果已就绪|结果已生成/);
  const current=result.nodes.filter(node=>result.currentTaskNodeIds.includes(node.id));
  assert.equal(current.find(node=>node.taskId==='explore').status,'failed');
  assert.equal(current.find(node=>node.taskId==='dependent').failureCode,'DEPENDENCY_FAILED');
  assert.equal(f.calls.filter(call=>call.role==='explorer').length,1);
 });
}
