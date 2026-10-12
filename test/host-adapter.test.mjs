import {test} from 'node:test';import assert from 'node:assert/strict';
import {createExecutionAdapter} from '../src/host-adapter.js';
function fixture({attemptTool,steps=0,missingTools=false,counterfeit=false}={}){
 const listeners=new Map(),calls=[];let disposed=0;let current={id:'session-a',status:'idle',session:{header:{cwd:'/fixture/project'}},ctx:{get:()=>({guard:()=>()=>{}})}};let last;
 const on=(name,fn)=>{const list=listeners.get(name)||[];list.push(fn);listeners.set(name,list);return()=>list.splice(list.indexOf(fn),1);};
 const ctx={on,get:name=>name==='sandboxPolicy'?{resolve:()=>({mode:'workspace-write',workspaceRoot:'/fixture/project'})}:undefined,agents:{get:id=>id===current.id?current:undefined,isOwnedBy:(_id,p)=>p===current},llm:{listProviders:()=>[{id:'configured',name:'Configured provider'}],listModels:async()=>[{id:'real-model',name:'Configured model'}],resolveModelInfo:async()=>({reasoning:{efforts:[{id:'actual-effort',name:'Actual effort'}],defaultEffort:'actual-effort'}}),resolveCallConfig:async x=>{if(x.reasoningEffort && x.reasoningEffort!=='actual-effort')throw Error('invalid effort');return x;}},subagents:{getProvider:()=>({capabilities:{agentOptions:true,outputSchema:true,persona:true,depthLimit:true}}),resolveMaxDepth:()=>1,async start(provider,request){calls.push({provider,request});const localListeners=new Map();let guard;const tools={guard(fn){guard=fn;return()=>{};},presentAs(mode){assert.equal(mode,'native');return()=>{};},restrict:()=>()=>{},view:()=>({restrictableNames:new Set()}),get:()=>undefined};const agent={id:'child-'+calls.length,session:{header:{parentSession:current.id}},ctx:{get:name=>name==='tools'&&!missingTools?tools:undefined,on(name,fn){localListeners.set(name,fn);return()=>{};}}};for(const fn of listeners.get('agent/created')||[])await fn({agent});last={agent,guard,localListeners};if(attemptTool)guard({name:attemptTool,agent});for(let n=0;n<steps;n++)await localListeners.get('agent/pre-step')({agent},async()=>({kind:'enter',messages:[]}));return {id:agent.id,localAgent:counterfeit?{...agent}:agent,result:Promise.resolve({stopReason:'completed',output:[{type:'text',text:'reported result'}],structured:{ok:true}}),async dispose(){disposed++;for(const fn of listeners.get('agent/disposed')||[])fn({agent});}};}}};
 return {ctx,calls,get disposed(){return disposed;},get last(){return last;},replace(){current={...current};},emit:async(name,payload)=>{for(const fn of listeners.get(name)||[])await fn(payload);},get parent(){return current;}};
}
function ready(f,options){const a=createExecutionAdapter(f.ctx,options);const c=a.context('session-a');a.beginSession('session-a',c.contextKey);return a;}
const spec=(role='planner')=>({sessionId:'session-a',runId:'r',nodeId:'n',role,goal:'fixture',prompt:'fixture prompt',model:{provider:'configured',model:'real-model',reasoningEffort:'actual-effort',maxTokens:4096},outputSchema:{type:'object',properties:{}},signal:new AbortController().signal,limits:{maxStepsPerAgent:2}});
test('adapter mounting/catalog/context never starts a model and offers only configured IDs',async()=>{const f=fixture();const a=ready(f);assert.equal(a.context('session-a').canStart,true);const c=await a.catalog([{provider:'configured',model:'real-model'}]);assert.equal(c.providers[0].models[0].efforts[0].id,'actual-effort');assert.equal(f.calls.length,0);await assert.rejects(a.validateModels({planner:{provider:'unknown',model:'made-up'}},new AbortController().signal),/目录/);await a.dispose();});
test('exact role model options bind to native spawn with parent, schema, depth and cleanup',async()=>{const f=fixture();const a=ready(f);const result=await a.execute(spec());assert.equal(result.childId,'child-1');assert.equal(f.calls[0].provider,'spawn');assert.deepEqual(f.calls[0].request.agentOptions,spec().model);assert.equal(f.calls[0].request.parent,f.parent);assert.equal(f.calls[0].request.maxDepth,1);assert.equal(f.calls[0].request.outputSchema.type,'object');assert.equal(f.disposed,1);await a.dispose();});
test('readonly scoped guard denies mutation and recursive delegation before execution',async()=>{const f=fixture({attemptTool:'write'});const a=ready(f);const result=await a.execute(spec('researcher'));assert.equal(result.stopReason,'refusal');assert.match(result.output,/阻止/);assert.equal(f.last.guard({name:'read'}),undefined);assert.ok(f.last.guard({name:'spawn_agent'}));assert.ok(f.last.guard({name:'run_code'}));assert.ok(f.last.guard({name:'str_replace_editor'}));await a.dispose();});
test('worker guard permits native edit tools but not security/delegation tool names',async()=>{const f=fixture();const a=ready(f);await a.execute(spec('worker'));assert.equal(f.last.guard({name:'write'}),undefined);assert.equal(f.last.guard({name:'bash'}),undefined);assert.ok(f.last.guard({name:'settings_write'}));await a.dispose();});
test('step cap is a structured recoverable failure, never a permission refusal',async()=>{const f=fixture({steps:3});const a=ready(f);const result=await a.execute(spec());assert.equal(result.stopReason,'error');assert.equal(result.failureCode,'STEP_LIMIT');assert.equal(result.retryable,true);assert.equal(result.blocked,false);assert.match(result.output,/上限/);const decision=await f.last.localListeners.get('tools/pre-execute')({},async()=>({kind:'ask',reason:'extra approval'}));assert.equal(decision.kind,'ask');await a.dispose();});
test('missing guard service and counterfeit child fail closed; accepted child is disposed',async()=>{const f=fixture({missingTools:true});const a=ready(f);await assert.rejects(a.execute(spec()),/保护/);await a.dispose();const g=fixture({counterfeit:true});const b=ready(g);await assert.rejects(b.execute(spec()),/保护验证/);assert.equal(g.disposed,1);await b.dispose();});
test('session generation changes invalidate previous explicit-start context',async()=>{const f=fixture();const a=ready(f);const key=a.context('session-a').contextKey;a.verifyContext('session-a',key);f.replace();assert.throws(()=>a.verifyContext('session-a',key),/会话已变化/);assert.equal(a.context('').canStart,false);await a.dispose();});
test('main-session new work cancels owning team rather than overlap writes',async()=>{const f=fixture();const messages=[];const a=ready(f,{onParentUnavailable:(id,reason)=>messages.push({id,reason})});await a.execute(spec('worker'));await f.emit('agent/status',{agent:f.parent,status:'running'});assert.equal(messages[0].id,'session-a');await a.dispose();});

test('concurrent adapter disposal shares its pending cleanup and repeats a failure without replaying disposers',async()=>{
 const f=fixture(),originalOn=f.ctx.on;let release,calls=0;const failure=new Error('synthetic disposer failure');
 f.ctx.on=(name,fn)=>{const off=originalOn(name,fn);return async()=>{calls++;await new Promise(r=>release=r);off();throw failure;};};
 const a=createExecutionAdapter(f.ctx),first=a.dispose(),second=a.dispose();assert.equal(second,first);
 await new Promise(setImmediate);assert.equal(calls,1);let settled=false;first.catch(()=>settled=true);await new Promise(setImmediate);assert.equal(settled,false);
 release();await assert.rejects(first,error=>error===failure);await assert.rejects(second,error=>error===failure);assert.equal(a.dispose(),first);await assert.rejects(a.dispose(),error=>error===failure);assert.equal(calls,1);
});

test('verifier asks the host which shell tool exists instead of assuming bash',async()=>{
 const f=fixture(),registry=new Set(['pwsh']),executed=[];
 const tools={get:(name,scope)=>registry.has(name)?{name,scope}:undefined,guard:()=>()=>{},presentAs:()=>()=>{},async execute(exec){executed.push({name:exec.name,args:exec.arguments});return {isError:false,value:{kind:'foreground',exitCode:0,stdout:{text:'{}',truncated:false},stderr:{text:'',truncated:false}}};}};
 f.parent.ctx.on=f.ctx.on;f.parent.ctx.get=name=>name==='tools'?tools:undefined;
 const a=ready(f),signal=new AbortController().signal,verifierSpec={name:'bash',arguments:{command:'node fixture.js',description:'fixture verifier',timeoutMs:1000,run_in_background:false}};
 try{
  const result=await a.executeTool('session-a',verifierSpec,signal);
  assert.equal(result.isError,false);assert.equal(executed.length,1);assert.equal(executed[0].name,'pwsh');assert.match(executed[0].args.command,/fixture\.js/);
  assert.equal(a.shellName('session-a'),'pwsh');
  registry.clear();
  assert.equal(a.shellName('session-a'),undefined);
  await assert.rejects(a.executeTool('session-a',verifierSpec,signal),error=>error.code==='VERIFIER_UNAVAILABLE');
  assert.equal(executed.length,1);
 }finally{await a.dispose();}
});

test('a host without tool enumeration keeps the caller-provided shell name',async()=>{
 const f=fixture(),executed=[];
 const tools={guard:()=>()=>{},async execute(exec){executed.push(exec.name);return {isError:false,value:{kind:'foreground',exitCode:0,stdout:{text:'{}',truncated:false},stderr:{text:'',truncated:false}}};}};
 f.parent.ctx.on=f.ctx.on;f.parent.ctx.get=name=>name==='tools'?tools:undefined;
 const a=ready(f);
 try{
  const result=await a.executeTool('session-a',{name:'bash',arguments:{command:'node fixture.js',description:'fixture verifier'}},new AbortController().signal);
  assert.equal(result.isError,false);assert.deepEqual(executed,['bash']);
 }finally{await a.dispose();}
});

test('an exception named CANCELLED after native verifier dispatch cannot impersonate a pre-dispatch cancellation',async()=>{
 const f=fixture();f.parent.ctx.on=f.ctx.on;
 f.parent.ctx.get=()=>({guard:()=>()=>{},async execute(exec){await f.emit('tools/execute',exec);throw Object.assign(new Error('SYNTHETIC_RAW_ERROR'),{code:'CANCELLED'});}});
 const a=ready(f);
 try{await assert.rejects(a.executeTool('session-a',{name:'bash',arguments:{command:'synthetic',description:'synthetic'}},new AbortController().signal),error=>error.code==='VERIFIER_DISPATCHED_FAILURE'&&!error.message.includes('SYNTHETIC_RAW'));}
 finally{await a.dispose();}
});

test('tool boundary and native approval refusals retain distinct structured reasons',async()=>{
 const f=fixture({attemptTool:'spawn_agent',steps:3});const a=ready(f);
 try{const result=await a.execute(spec());assert.equal(result.failureCode,'TOOL_BOUNDARY');assert.equal(result.stopReason,'refusal');assert.equal(result.retryable,false);assert.equal(result.blocked,true);}finally{await a.dispose();}
 const g=fixture({steps:3}),start=g.ctx.subagents.start;
 g.ctx.subagents.start=async(...args)=>{const child=await start(...args);await g.last.localListeners.get('tools/pre-execute')({},async()=>({kind:'deny',reason:'Fixture permission denial'}));return child;};
 const b=ready(g);
 try{const result=await b.execute(spec());assert.equal(result.failureCode,'PERMISSION_DENIED');assert.equal(result.stopReason,'refusal');assert.equal(result.retryable,false);assert.equal(result.blocked,true);}finally{await b.dispose();}
});

test('step limit preserves partial evidence and rejects all later model steps',async()=>{
 const f=fixture({steps:3}),a=ready(f);
 try{const result=await a.execute(spec());assert.equal(result.failureCode,'STEP_LIMIT');assert.match(result.output,/reported result/);let admitted=false;const decision=await f.last.localListeners.get('agent/pre-step')({},async()=>{admitted=true;return {kind:'enter'};});assert.equal(decision.kind,'reject');assert.equal(admitted,false);}finally{await a.dispose();}
});


test('untagged native refusal is neutral because host pre-step rejection shares that stop reason',async()=>{
 const f=fixture(),start=f.ctx.subagents.start;
 f.ctx.subagents.start=async(...args)=>({...await start(...args),result:Promise.resolve({stopReason:'refusal',output:[]})});
 const adapter=ready(f);
 try{const result=await adapter.execute(spec());assert.equal(result.failureCode,'EXECUTION_REFUSED');assert.equal(result.retryable,false);assert.equal(result.blocked,true);assert.match(result.error,/具体原因未确认/);assert.doesNotMatch(result.error,/模型拒绝|权限拒绝/);}finally{await adapter.dispose();}
});
