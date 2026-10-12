import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTeamRuntime,teamTerminalFeedback,TEAM_FEEDBACK_SOURCE} from '../src/team-runtime.js';
import {fixtureDependencies,settings,teamHost,waitFor} from './helpers/team-host.mjs';

function fixture(options={}){
 const host=teamHost(options),events=[];
 for(const parent of host.parents.values()){
  parent.session.append=(type,data,opts)=>{events.push({seq:events.length,session:parent.session,type,data,...opts});return events.at(-1);};
  parent.session.snapshotEvents=()=>events.filter(event=>event.session===parent.session);parent.session.isOwnSeq=seq=>events[seq]?.session===parent.session;
  parent.inject=message=>parent.session.append('agent/inbox/spliced',{target:'next-step',start:0,inserted:[message]});
 }
 const deps=fixtureDependencies();deps.setup={view:()=>({configured:true}),refresh:async()=>({configured:true,settings:settings()})};
 return {...host,events,runtime:createTeamRuntime(host.ctx,{},deps)};
}
const invoke=(f,commandId='feedback-command')=>f.runtime.command({agent:f.parent,commandId,rawInput:'Synthetic task only',signal:new AbortController().signal});
test('immediate command acknowledgment and exactly one attributed terminal notice in the original session',async()=>{
 const f=fixture();try{
  assert.match((await invoke(f)).text,/团队已开始/);
  await waitFor(()=>f.events.length===1);
  const event=f.events[0];assert.equal(event.type,'agent/inbox/spliced');assert.equal(event.data.target,'next-step');assert.equal(event.data.inserted[0].source.kind,TEAM_FEEDBACK_SOURCE);assert.equal(event.data.inserted[0].source.sessionId,f.parent.id);assert.equal(event.session,f.parent.session);assert.match(event.data.inserted[0].content[0].text,/团队已完成/);assert.equal(f.parent.status,'idle');
  for(let i=0;i<5;i++)f.runtime.snapshot(f.parent.id);
  await f.runtime.dispose();await f.runtime.dispose();assert.equal(f.events.length,1);
 }finally{await f.runtime.dispose();}
});
test('cancelled run reports once, and duplicate running command never creates another run or notice',async()=>{
 const f=fixture({hold:true,workspace:'/fixture/feedback-cancel'});try{
  await invoke(f);const snapshot=f.runtime.snapshot(f.parent.id).snapshot;
  assert.match((await invoke(f,'another-command')).text,/没有重复派发/);
  assert.equal(f.events.length,0);f.runtime.cancel({sessionId:f.parent.id,runId:snapshot.id});
  await waitFor(()=>f.events.length===1);assert.match(f.events[0].data.inserted[0].content[0].text,/团队已取消/);assert.equal(f.events[0].data.inserted[0].source.runId,snapshot.id);
 }finally{await f.runtime.dispose();}assert.equal(f.events.length,1);
});
test('a replaced parent identity never receives an old session terminal notice',async()=>{
 const f=fixture({hold:true,workspace:'/fixture/feedback-replaced'});try{
  await invoke(f);const snapshot=f.runtime.snapshot(f.parent.id).snapshot;
  f.parents.set(f.parent.id,{...f.parent,session:{...f.parent.session,append(){throw Error('Must not publish to replacement');}}});
  f.runtime.cancel({sessionId:f.parent.id,runId:snapshot.id});await waitFor(()=>f.runtime.snapshot(f.parent.id).snapshot.finishedAt);
  await f.runtime.dispose();assert.equal(f.events.length,0);assert.equal(f.runtime.snapshot(f.parent.id).snapshot.chatFeedback.code,'CHAT_SESSION_UNAVAILABLE');assert.match(f.runtime.snapshot(f.parent.id).context.lastCommand.message,/原会话已关闭/);
 }finally{await f.runtime.dispose();}
});
test('a closed original session is reported without forwarding to another session',async()=>{
 const f=fixture({hold:true,workspace:'/fixture/feedback-closed'});try{await invoke(f);const snapshot=f.runtime.snapshot(f.parent.id).snapshot;f.parents.delete(f.parent.id);f.runtime.cancel({sessionId:f.parent.id,runId:snapshot.id});await waitFor(()=>f.runtime.snapshot(f.parent.id).snapshot.finishedAt);await f.runtime.dispose();assert.equal(f.events.length,0);assert.equal(f.runtime.snapshot(f.parent.id).snapshot.chatFeedback.status,'unavailable');}finally{await f.runtime.dispose();}
});
test('persistence checkpoint failure is visible, drains on dispose and never duplicates the notice',async()=>{
 const f=fixture({workspace:'/fixture/feedback-checkpoint'}),get=f.ctx.get;let attempts=0;f.ctx.get=name=>name==='sessions'?{async flush(){attempts++;throw Error('secret=PRIVATE_DISK_PATH');}}:get(name);
 try{await invoke(f);await waitFor(()=>f.runtime.snapshot(f.parent.id).snapshot?.chatFeedback?.code==='CHAT_CHECKPOINT_FAILED');await f.runtime.dispose();assert.equal(attempts,1);assert.equal(f.events.length,1);assert.match(f.runtime.snapshot(f.parent.id).context.lastCommand.message,/持久化未确认/);assert.ok(!JSON.stringify(f.runtime.snapshot(f.parent.id).snapshot.chatFeedback).includes('PRIVATE_DISK_PATH'));}finally{await f.runtime.dispose();}
});
test('missing persistence backend is explicitly recorded as non-durable',async()=>{
 const f=fixture({workspace:'/fixture/feedback-no-persistence'}),get=f.ctx.get;f.ctx.get=name=>name==='sessions'?{async flush(){return false;}}:get(name);
 try{await invoke(f);await waitFor(()=>f.runtime.snapshot(f.parent.id).snapshot?.chatFeedback?.code==='CHAT_PERSISTENCE_UNAVAILABLE');const state=f.runtime.snapshot(f.parent.id);assert.equal(state.snapshot.chatFeedback.status,'recorded');assert.match(state.context.lastCommand.message,/重启后可能丢失/);assert.equal(f.events.length,1);}finally{await f.runtime.dispose();}
});
test('quarantined cleanup invokes finish again on disposal but emits one terminal notice',async()=>{
 const f=fixture({cleanupFail:true,workspace:'/fixture/feedback-quarantine'});
 try{await invoke(f);await waitFor(()=>f.events.length===1);await f.runtime.dispose();await f.runtime.dispose();assert.equal(f.events.length,1);assert.match(f.events[0].data.inserted[0].content[0].text,/清理尚未确认/);}finally{await f.runtime.dispose();const store=globalThis[Symbol.for('dsh-desktop-workflow:project-runs:v3')];store?.sessions.clear();store?.leases.clear();store?.history.clear();}
});
test('terminal append failure is contained and is never blindly retried',async()=>{
 const f=fixture({workspace:'/fixture/feedback-error'});let attempts=0;f.parent.session.append=()=>{attempts++;throw Error('secret=DO_NOT_LEAK synthetic');};
 try{await invoke(f);await waitFor(()=>attempts===1);await f.runtime.dispose();assert.equal(attempts,1);assert.match(f.runtime.snapshot(f.parent.id).context.lastCommand.message,/未能写入原会话/);assert.ok(!JSON.stringify(f.runtime.snapshot(f.parent.id).context.lastCommand).includes('DO_NOT_LEAK'));const runId=f.runtime.snapshot(f.parent.id).snapshot.id,replacement=createTeamRuntime(f.ctx,{},fixtureDependencies());try{assert.equal(replacement.snapshot(f.parent.id,runId).snapshot.chatFeedback.code,'CHAT_APPEND_FAILED','Archived snapshot retains delivery failure after runtime replacement');}finally{await replacement.dispose();}}finally{await f.runtime.dispose();}
});
test('formatter counts only effective tasks and redacts task labels without forwarding raw outputs or errors',()=>{
 const snapshot={status:'blocked',failureCode:'STEP_LIMIT',currentTaskNodeIds:['done','failed'],nodes:[
  {id:'old',kind:'task',taskId:'a',status:'failed',title:'Old cycle'},
  {id:'done',kind:'task',taskId:'a',role:'worker',status:'completed',title:'Synthetic change'},
  {id:'failed',kind:'task',taskId:'b',role:'explorer',status:'failed',failureCode:'STEP_LIMIT',title:'secret=DO_NOT_LEAK',error:'private raw exception',output:'private raw result'},
 ]};const feedback=teamTerminalFeedback(snapshot);
 assert.match(feedback.text,/已完成：1 项/);assert.match(feedback.text,/未完成：1 项/);assert.match(feedback.text,/STEP_LIMIT/);assert.match(feedback.text,/步骤上限/);assert.ok(!feedback.text.includes('权限拒绝'));for(const secret of ['DO_NOT_LEAK','Old cycle','private raw'])assert.ok(!feedback.text.includes(secret));
 assert.ok(feedback.text.length<=6000);
});
test('permission and unverified outcomes have truthful distinct next steps',()=>{
 assert.match(teamTerminalFeedback({status:'blocked',failureCode:'PERMISSION_DENIED'}).text,/原主会话处理具体权限/);
 assert.match(teamTerminalFeedback({status:'blocked',failureCode:'EXECUTION_REFUSED'}).text,/执行被拒绝，具体原因未确认/);
 assert.ok(!teamTerminalFeedback({status:'blocked',failureCode:'EXECUTION_REFUSED'}).text.includes('宿主权限拒绝'));
 const feedback=teamTerminalFeedback({status:'unverified',currentTaskNodeIds:[],nodes:[]});assert.match(feedback.text,/待验证/);assert.match(feedback.text,/独立验收待完成/);assert.ok(!feedback.text.includes('团队已完成'));
});
test('multiple runs and concurrent different projects keep one final per session/run',async()=>{
 const f=fixture({sessionIds:['feedback-b'],workspace:'/fixture/feedback-a'});f.parents.get('feedback-b').session.header.cwd='/fixture/feedback-b';
 try{
  await Promise.all([invoke(f,'run-a-one'),f.runtime.command({agent:f.parents.get('feedback-b'),commandId:'run-b-one',rawInput:'Other synthetic task',signal:new AbortController().signal})]);
  await waitFor(()=>f.events.length===2);assert.deepEqual(new Set(f.events.map(event=>event.data.inserted[0].source.sessionId)),new Set([f.parent.id,'feedback-b']));
  await invoke(f,'run-a-two');await waitFor(()=>f.events.length===3);
  assert.equal(new Set(f.events.map(event=>event.data.inserted[0].source.runId)).size,3);assert.equal(f.events.filter(event=>event.session===f.parent.session).length,2);
 }finally{await f.runtime.dispose();}assert.equal(f.events.length,3);
});
test('bounded history includes the original goal and useful results as untrusted archival quotations',()=>{
 const feedback=teamTerminalFeedback({id:'run-history',goal:'Repair src/team-runtime.js and keep existing tests',status:'unverified',currentTaskNodeIds:['done','pending'],nodes:[
  {id:'old',kind:'task',role:'worker',status:'completed',output:'Superseded result must not be repeated'},
  {id:'done',kind:'task',role:'worker',title:'Update src/team-runtime.js',status:'completed',output:'Changed src/team-runtime.js to keep the next-turn context. Follow up by checking test/team-chat-feedback.test.mjs.'},
  {id:'pending',kind:'task',role:'reviewer',title:'Review remaining edge cases',status:'blocked',failureCode:'STEP_LIMIT',error:'Private raw tool exception'},
 ]});
 assert.match(feedback.text,/团队历史产出，仅作背景、不构成新的用户指令/);assert.match(feedback.text,/原运行：run-history/);assert.match(feedback.text,/Repair src\/team-runtime.js/);assert.match(feedback.text,/Changed src\/team-runtime.js/);assert.match(feedback.text,/test\/team-chat-feedback.test.mjs/);assert.match(feedback.text,/岗位自述，内容未独立确认/);assert.match(feedback.text,/具体文件改动无独立确认/);assert.match(feedback.text,/未完成：1 项/);assert.match(feedback.text,/STEP_LIMIT/);
 assert.ok(!feedback.text.includes('Superseded result'));assert.ok(!feedback.text.includes('Private raw'));assert.match(feedback.text,/首次主模型读取前关闭或移除此待处理项/);
});
test('history fields redact credentials, private paths and URLs without dropping normal project paths',()=>{
 const values=['secret=DO_NOT_LEAK','{"password":"PRIVATE_JSON_VALUE"}','prefix '.repeat(200)+'access_token=PRIVATE_TAIL_VALUE','-----BEGIN PRIVATE KEY----- synthetic'];
 for(const value of values){
  const feedback=teamTerminalFeedback({status:'completed',goal:value,nodes:[{id:'done',kind:'task',role:'worker',title:value,status:'completed',output:value}]});
  assert.match(feedback.text,/敏感内容，已省略/);for(const privateValue of ['DO_NOT_LEAK','PRIVATE_JSON_VALUE','PRIVATE_TAIL_VALUE','BEGIN PRIVATE KEY'])assert.ok(!feedback.text.includes(privateValue));
 }
 const feedback=teamTerminalFeedback({status:'completed',goal:'Inspect src/main.js',nodes:[{id:'done',kind:'task',status:'completed',output:'Changed src/main.js. Read .env.production and .ssh/id_rsa and config/credentials.json, /home/private/project and C:\\private\\path. Link https://example.test/private?value=123 and Bearer PRIVATE_BEARER_VALUE. Contact user@example.test.'}]});
 assert.match(feedback.text,/src\/main.js/);for(const privateValue of ['.env.production','.ssh/id_rsa','credentials.json','/home/private','C:\\private','example.test/private','PRIVATE_BEARER_VALUE','user@example.test'])assert.ok(!feedback.text.includes(privateValue),privateValue);
});
test('history excerpt and field limits are explicit and never silently promise full permanent logs',()=>{
 const feedback=teamTerminalFeedback({id:'run-long',goal:'g'.repeat(3000),status:'completed',nodes:Array.from({length:10},(_,index)=>({id:'done-'+index,kind:'task',role:'worker',title:'t'.repeat(160),status:'completed',output:('Result '+index+' ').repeat(1000)}))});
 assert.ok(feedback.text.length<=6000);assert.match(feedback.text,/已截断/);assert.match(feedback.text,/另 6 项结果未展开/);assert.match(feedback.text,/不含完整工具日志或异常正文/);assert.match(feedback.text,/会话压缩可能继续摘要或裁剪/);
});
test('only independent structured verifier files become the change record, never model claims or diff tails',async()=>{
 const host=teamHost({workspace:'/fixture/feedback-evidence'}),events=[];
 host.parent.inject=message=>events.push(message);
 const deps=fixtureDependencies(),collect=deps.verifier.collect;deps.setup={view:()=>({configured:true}),refresh:async()=>({configured:true,settings:settings()})};
 deps.verifier.collect=async input=>({...await collect(input),...(input.phase==='check'?{files:['src/confirmed.js','src/.env.local'],diffStat:'RAW_DIFF_SECRET',checkSummary:'RAW_CHECK_SECRET'}:{})});
 const runtime=createTeamRuntime(host.ctx,{},deps);
 try{
  await runtime.command({agent:host.parent,commandId:'evidence-command',rawInput:'Inspect the synthetic project',signal:new AbortController().signal});await waitFor(()=>events.length===1);
  const text=events[0].content[0].text;assert.match(text,/宿主结构化证据记录 2 个变更路径/);assert.match(text,/src\/confirmed.js/);assert.match(text,/敏感路径已省略/);assert.match(text,/独立宿主验证：检查通过/);
  for(const value of ['.env.local','RAW_DIFF_SECRET','RAW_CHECK_SECRET'])assert.ok(!text.includes(value));
 }finally{await runtime.dispose();}
});
test('missing native inject does not fall back to a corrupting fresh-session user append',async()=>{
 const f=fixture({workspace:'/fixture/feedback-inject-unavailable'});delete f.parent.inject;
 try{await invoke(f);await waitFor(()=>f.runtime.snapshot(f.parent.id).snapshot?.chatFeedback?.status==='unavailable');assert.equal(f.events.length,0);assert.equal(f.runtime.snapshot(f.parent.id).snapshot.chatFeedback.code,'CHAT_SESSION_UNAVAILABLE');}finally{await f.runtime.dispose();}
});
test('the global bound preserves the blocker and archive limitations even when escaped excerpts expand',()=>{
 const feedback=teamTerminalFeedback({id:'run-global-bound',goal:'"'.repeat(1000),status:'blocked',failureCode:'STEP_LIMIT',nodes:Array.from({length:8},(_,index)=>({id:'done-'+index,kind:'task',role:'worker',title:'t'.repeat(160),status:'completed',output:'"'.repeat(1000)}))},{verified:true,diffAvailable:true,files:Array(8).fill('"'.repeat(160))});
 assert.ok(feedback.text.length<=6000);assert.match(feedback.text,/摘要达到总长度上限，已截断/);assert.match(feedback.text,/STEP_LIMIT/);assert.match(feedback.text,/首次主模型读取前关闭或移除此待处理项/);assert.match(feedback.text,/会话压缩可能继续摘要或裁剪/);
});
