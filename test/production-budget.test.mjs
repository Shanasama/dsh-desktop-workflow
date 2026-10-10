import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,mkdir,copyFile,writeFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {ProductionBudget, normalizeBudgetConfig, normalizeHostUsage, nativeRequestBound,resolveNativeBudgetContract} from '../src/production-budget.js';
import {createExecutionAdapter} from '../src/host-adapter.js';
import {TEAM_ROLES} from '../src/team-contracts.js';
import {markAgentLoopRequest} from '@deepseek-ai/dsh-llm';
// Unit tests need only the host LLM peer. Full native cases run whenever the
// optional official host test installation is present, and explicitly skip
// rather than pretending to verify AgentLoop on a lightweight package install.
let nativeHost;
try {
 const names=['cordis','dsh-llm','dsh-agent','dsh-agent-loop','dsh-session','dsh-session-projection','dsh-tools','dsh-system-prompt','dsh-subagent','dsh-subagent-spawn-in-process','dsh-llm-retry'];
 nativeHost=Object.fromEntries(await Promise.all(names.map(async name=>[name,await import('@deepseek-ai/'+name)])));
} catch(error) { if(error.code!=='ERR_MODULE_NOT_FOUND')throw error; }
const hostTest=(name,fn)=>test(name,{skip:nativeHost?false:'Official rc2 host packages are not installed'},fn);
const enabled=tokenLimit=>({enabled:true,tokenLimit});
const collect=async stream=>{const out=[];for await(const chunk of stream)out.push(chunk);return out;};
const usage=(inputTokens=20,outputTokens=10)=>({inputTokens,outputTokens});
const chunks=(u=usage(),kind='stop')=>(async function*(){if(u!==null)yield {type:'usage',usage:u};yield {type:'finish',reason:{kind}};})();

test('budget defaults disabled, exact configuration validates and no arbitrary ten-million cap exists',()=>{
 assert.deepEqual(normalizeBudgetConfig(),{enabled:false,tokenLimit:0});
 for(const value of [null,{},true,[],{enabled:true,tokenLimit:0},{enabled:true,tokenLimit:1.5},{enabled:true,tokenLimit:NaN},{enabled:true,tokenLimit:-1},{enabled:'true',tokenLimit:10},{enabled:false,tokenLimit:1e9+1},{enabled:true,tokenLimit:100,extra:1}])assert.throws(()=>normalizeBudgetConfig(value),{code:'INVALID_BUDGET'});
 assert.deepEqual(normalizeBudgetConfig(enabled(1e9)),enabled(1e9));
});
test('native usage adds disjoint cache buckets once, excludes reasoning subset and validates exact totals',()=>{
 assert.equal(normalizeHostUsage({inputTokens:10,outputTokens:20,cacheReadTokens:100,cacheWriteTokens:40,reasoningTokens:15,totalTokens:170}),170);
 assert.equal(normalizeHostUsage(usage(0,0)),0);
 for(const u of [undefined,{},usage(-1),usage(Infinity),{...usage(),cacheReadTokens:0.5},{...usage(),reasoningTokens:11},{...usage(),totalTokens:31},{inputTokens:Number.MAX_SAFE_INTEGER,outputTokens:1}])assert.throws(()=>normalizeHostUsage(u),{code:'BUDGET_USAGE_UNKNOWN'});
});
test('reservation happens before dispatch; cumulative usage chunks settle only once',async()=>{
 const budget=new ProductionBudget(enabled(200));let calls=0;
 const next=()=>{calls++;assert.equal(budget.snapshot().reserved,100);assert.equal(budget.snapshot().physicalCalls,1);return(async function*(){yield {type:'usage',usage:usage(10,0)};yield {type:'usage',usage:usage(10,20)};yield {type:'finish',reason:{kind:'stop'}};})();};
 await collect(budget.stream({},next,{bound:100}));
 assert.equal(calls,1);assert.deepEqual(budget.snapshot(),{enabled:true,limit:200,spent:30,reserved:0,remaining:170,halted:null,accounting:'host-usage',unknownUsageCalls:0,physicalCalls:1});
});
test('disabled budget observes missing usage without preventing a second attempt',async()=>{
 const budget=new ProductionBudget();await collect(budget.stream({},()=>chunks(null)));await collect(budget.stream({},()=>chunks()));
 assert.deepEqual(budget.snapshot(),{enabled:false,limit:0,spent:30,reserved:0,remaining:null,halted:null,accounting:'host-usage-incomplete',unknownUsageCalls:1,physicalCalls:2});
});
test('unknown bound, insufficient headroom, cancellation and release all stop before physical dispatch',async()=>{
 for(const [limit,bound,code]of [[100,undefined,'BUDGET_BOUND_UNAVAILABLE'],[99,100,'BUDGET_INSUFFICIENT']]){
  const budget=new ProductionBudget(enabled(limit));let calls=0;await assert.rejects(collect(budget.stream({},()=>{calls++;return chunks();},{bound})),{code});assert.equal(calls,0);assert.equal(budget.snapshot().physicalCalls,0);
 }
 const budget=new ProductionBudget(enabled(100)),abort=new AbortController();abort.abort();
 await assert.rejects(collect(budget.stream({},()=>assert.fail('dispatch'),{bound:100,signal:abort.signal})),{code:'CANCELLED'});
 budget.release();await assert.rejects(collect(budget.stream({},()=>assert.fail('dispatch'),{bound:100})),{code:'BUDGET_RELEASED'});
});
test('concurrent calls reserve synchronously and cannot spend the same remaining tokens',async()=>{
 const budget=new ProductionBudget(enabled(100));let release,started;const gate=new Promise(r=>release=r),entered=new Promise(r=>started=r);
 const first=collect(budget.stream({},async function*(){started();await gate;yield*chunks();},{bound:80}));await entered;
 assert.equal(budget.snapshot().reserved,80);
 await assert.rejects(collect(budget.stream({},()=>assert.fail('second dispatch'),{bound:80})),{code:'BUDGET_INSUFFICIENT'});
 release();await first;assert.equal(budget.snapshot().physicalCalls,1);assert.equal(budget.snapshot().spent,30);
});
test('missing, invalid, decreasing, interrupted and thrown usage preserve the full reservation and veto retry',async()=>{
 const cases=[()=>chunks(null),()=>chunks({...usage(),totalTokens:500}),async function*(){yield {type:'usage',usage:usage(1,1)};},async function*(){throw new Error('inert fixture failure');},async function*(){yield {type:'usage',usage:usage(50,10)};yield*chunks(usage(10,5));}];
 for(const next of cases){const budget=new ProductionBudget(enabled(500));try{await collect(budget.stream({},next,{bound:100}));}catch{}assert.equal(budget.snapshot().reserved,100);assert.equal(budget.snapshot().unknownUsageCalls,1);assert.equal(budget.snapshot().halted,'BUDGET_USAGE_UNKNOWN');await assert.rejects(collect(budget.stream({},()=>assert.fail('retry dispatch'),{bound:100})),{code:'BUDGET_USAGE_UNKNOWN'});const before=budget.snapshot();budget.release();assert.deepEqual(budget.snapshot(),before);}
});
test('reported provider overrun remains visible and halts rather than clamping actual spend',async()=>{
 const budget=new ProductionBudget(enabled(100));await collect(budget.stream({},()=>chunks(usage(90,30)),{bound:100}));assert.equal(budget.snapshot().spent,120);assert.equal(budget.snapshot().remaining,0);assert.equal(budget.snapshot().halted,'BUDGET_BOUND_EXCEEDED');
});
test('only exact native frozen AgentLoop requests use generation-bound request context',()=>{
 const options={provider:'inert',model:'model',reasoningEffort:'chosen',maxTokens:99,sessionId:'child',messages:[]};
 const agent={id:'child',session:{requestContext:()=>({provider:'inert',model:'model',contextWindow:400}),requestHeader:()=>({config:options})}};
 assert.equal(nativeRequestBound(options,agent),undefined);
 const marked=markAgentLoopRequest(Object.freeze({...options}));assert.equal(nativeRequestBound(marked,agent),400);
 assert.equal(nativeRequestBound(markAgentLoopRequest(Object.freeze({...options,purpose:'compaction'})),agent),undefined);
 assert.equal(nativeRequestBound(markAgentLoopRequest(Object.freeze({...options,model:'changed'})),agent),undefined);
 assert.equal(nativeRequestBound(marked,{...agent,session:{...agent.session,requestContext:()=>({provider:'inert',model:'model'})}}),undefined);
});

/** Real rc2 Cordis + AgentLoop + Session + LlmRuntime + in-process spawn. Only
 * the model adapter and sandbox resolution are inert test doubles. No HTTP,
 * API keys, credential services, user files or persisted profiles are used. */
async function nativeFixture({limit=500,contextWindow=100,replyUsage=usage(),attempts=1,firstAttemptUsage=usage(5,1),adapterFactory=createExecutionAdapter,profileAnchor}={}){
 const {Context}=nativeHost.cordis, {LlmRuntime,LlmAdapter}=nativeHost['dsh-llm'], {AgentRegistry}=nativeHost['dsh-agent'];
 const {AgentLoop}=nativeHost['dsh-agent-loop'], {SessionStore}=nativeHost['dsh-session'], {SessionProjectionRegistry}=nativeHost['dsh-session-projection'];
 const {ToolRuntime}=nativeHost['dsh-tools'], {default:SystemPrompt}=nativeHost['dsh-system-prompt'], {SubagentRuntime}=nativeHost['dsh-subagent'];
 const spawn=nativeHost['dsh-subagent-spawn-in-process'], retry=nativeHost['dsh-llm-retry'];
 const root=new Context(),forks=[];let dispatches=0;
 for(const plugin of [SessionStore,SessionProjectionRegistry,AgentRegistry,LlmRuntime,SystemPrompt])forks.push(root.plugin(plugin));
 forks.push(root.plugin(ToolRuntime,{mode:'native'}));forks.push(root.plugin(AgentLoop,{}));forks.push(root.plugin(SubagentRuntime,{}));forks.push(root.plugin(spawn,{}));forks.push(root.plugin(retry,{}));
 root.provide('sandboxPolicy',{overrideOf:()=>undefined,resolve:()=>({mode:'workspace-write',workspaceRoot:'/inert-project'})});
 for(let i=0;i<100&&!root.get('agentLoop');i++)await new Promise(r=>setTimeout(r,5));
 assert.ok(root.get('agentLoop'),'real native AgentLoop mounted');
 const requests=[];
 class InertAdapter extends LlmAdapter {
  providerRetryPolicy(){return {mode:'normal',maxRetries:2,retryableCodes:['RATE_LIMIT'],initialDelayMs:1,maxDelayMs:1,jitterRatio:0};}
  async resolveModel(provider,id){return {provider,id,name:id,...contextWindow===null?{}:{context:{contextWindow}},defaultMaxTokens:50,reasoning:{efforts:[{id:'chosen',name:'Chosen'}]}};}
  async *stream(options){dispatches++;requests.push(options);if(dispatches<attempts){if(firstAttemptUsage!==null)yield {type:'usage',usage:firstAttemptUsage};yield {type:'finish',reason:{kind:'error',failure:{code:'RATE_LIMIT',message:'Inert retry fixture'}}};return;}yield {type:'block-start',index:0,blockType:'text'};yield {type:'text-delta',index:0,text:'Inert native response'};yield {type:'block-end',index:0,block:{type:'text',text:'Inert native response'}};if(replyUsage!==null)yield {type:'usage',usage:replyUsage};yield {type:'finish',reason:{kind:'stop'}};}
 }
 root.llm.registerAdapter(['inert'],new InertAdapter());
 const parent=await root.agentLoop.create('budget-parent',{provider:'inert',model:'model',reasoningEffort:'chosen'},{cwd:'/inert-project'});
 if(profileAnchor!==undefined)root.provide('profileContext',{installAnchor:profileAnchor});
 const adapter=adapterFactory(root);const context=adapter.context(parent.id);assert.equal(context.canStart,true);
 adapter.beginSession(parent.id,context.contextKey);adapter.beginBudget('native-run',limit===false?undefined:enabled(limit));
 const spec={sessionId:parent.id,runId:'native-run',nodeId:'native-node',role:'planner',model:{provider:'inert',model:'model',reasoningEffort:'chosen'},prompt:'Return the inert fixture response.',signal:new AbortController().signal,limits:{maxStepsPerAgent:3}};
 return {root,adapter,parent,spec,requests,get dispatches(){return dispatches;},async dispose(){adapter.releaseBudget('native-run');adapter.releaseSession(parent.id);await adapter.dispose();for(const fork of forks.reverse())await fork.dispose();}};
}
hostTest('official rc2 native spawn and AgentLoop stream settle actual usage without modifying model choices',async()=>{
 const f=await nativeFixture();try{const result=await f.adapter.execute(f.spec);assert.equal(result.stopReason,'completed');assert.equal(f.dispatches,1);assert.equal(f.requests[0].reasoningEffort,'chosen');assert.equal(f.requests[0].maxTokens,50);assert.equal(f.adapter.budgetSnapshot('native-run').spent,30);assert.equal(f.adapter.budgetSnapshot('native-run').physicalCalls,1);assert.equal(f.root.agents.list().length,1);assert.equal(f.root.sessions.list().length,1);}finally{await f.dispose();}
});
hostTest('official rc2 guard refuses before real adapter dispatch when full context cannot be reserved',async()=>{
 const f=await nativeFixture({limit:99});try{const result=await f.adapter.execute(f.spec);assert.equal(result.stopReason,'refusal');assert.equal(f.dispatches,0);assert.equal(f.adapter.budgetSnapshot('native-run').halted,'BUDGET_INSUFFICIENT');assert.equal(f.root.agents.list().length,1);}finally{await f.dispose();}
});
hostTest('disabled native budget observes each official retry attempt and preserves selected route and effort',async()=>{
 const f=await nativeFixture({attempts:2,limit:false});try{const result=await f.adapter.execute(f.spec);assert.equal(result.stopReason,'completed');assert.equal(f.dispatches,2);assert.equal(f.adapter.budgetSnapshot('native-run').physicalCalls,2);assert.equal(f.adapter.budgetSnapshot('native-run').spent,36);assert.ok(f.requests.every(r=>r.provider==='inert'&&r.model==='model'&&r.reasoningEffort==='chosen'));}finally{await f.dispose();}
});
hostTest('official rc2 missing usage halts enabled budgets while disabled budgets remain observational',async()=>{
 for(const limit of [500,false]){const f=await nativeFixture({limit,replyUsage:null});try{const result=await f.adapter.execute(f.spec);assert.equal(result.stopReason,limit===false?'completed':'refusal');assert.equal(f.adapter.budgetSnapshot('native-run').unknownUsageCalls,1);assert.equal(f.adapter.budgetSnapshot('native-run').reserved,limit===false?0:100);}finally{await f.dispose();}}
});

hostTest('official retry cannot dispatch again after an unaccounted native failure',async()=>{
 const f=await nativeFixture({attempts:2,firstAttemptUsage:null});try{const result=await f.adapter.execute(f.spec);assert.equal(result.stopReason,'refusal');assert.equal(f.dispatches,1);assert.equal(f.adapter.budgetSnapshot('native-run').halted,'BUDGET_USAGE_UNKNOWN');assert.equal(f.adapter.budgetSnapshot('native-run').reserved,100);}finally{await f.dispose();}
});
hostTest('all six real native roles share one ledger and keep distinct user model choices',async()=>{
 const f=await nativeFixture({limit:1000});try{for(const role of TEAM_ROLES){const result=await f.adapter.execute({...f.spec,role,model:{...f.spec.model,model:'model-'+role}});assert.equal(result.stopReason,'completed');}assert.equal(f.dispatches,6);assert.equal(f.adapter.budgetSnapshot('native-run').spent,180);assert.deepEqual(f.requests.map(r=>r.model),TEAM_ROLES.map(role=>'model-'+role));assert.equal(f.root.agents.list().length,1);assert.equal(f.root.sessions.list().length,1);}finally{await f.dispose();}
});
hostTest('official host metadata without context capacity is rejected before dispatch',async()=>{
 const f=await nativeFixture({contextWindow:null});try{const result=await f.adapter.execute(f.spec);assert.equal(result.stopReason,'refusal');assert.equal(f.dispatches,0);assert.equal(f.adapter.budgetSnapshot('native-run').halted,'BUDGET_BOUND_UNAVAILABLE');}finally{await f.dispose();}
});
hostTest('owned native auxiliary streams fail closed, unrelated sessions are untouched, and released child calls cannot escape',async()=>{
 const f=await nativeFixture();try{
  const result=await f.adapter.execute(f.spec);const childId=result.childId;
  await assert.rejects(collect(f.root.llm.stream({provider:'inert',model:'model',messages:[],sessionId:childId,purpose:'compaction'})),{code:'BUDGET_BOUND_UNAVAILABLE'});assert.equal(f.dispatches,1);
  await collect(f.root.llm.stream({provider:'inert',model:'model',messages:[],sessionId:'unrelated-session'}));assert.equal(f.dispatches,2);assert.equal(f.adapter.budgetSnapshot('native-run').physicalCalls,1);
  f.adapter.releaseBudget('native-run');assert.throws(()=>f.root.llm.stream({provider:'inert',model:'model',messages:[],sessionId:childId}),{code:'BUDGET_RELEASED'});assert.equal(f.dispatches,2);
 }finally{await f.dispose();}
});
hostTest('settled native budget history is bounded and retired ids cannot reset, while unknown reservations survive pruning',async()=>{
 const f=await nativeFixture({replyUsage:null});try{
  await f.adapter.execute(f.spec);f.adapter.releaseBudget('native-run');
  for(let i=0;i<100;i++){f.adapter.beginBudget('history-'+i);f.adapter.releaseBudget('history-'+i);}
  assert.equal(f.adapter.budgetSnapshot('history-0'),undefined);assert.equal(f.adapter.budgetSnapshot('history-35'),undefined);assert.ok(f.adapter.budgetSnapshot('history-36'));assert.ok(f.adapter.budgetSnapshot('history-99'));
  assert.equal(f.adapter.budgetSnapshot('native-run').reserved,100);assert.throws(()=>f.adapter.beginBudget('history-0'),{code:'BUDGET_ALREADY_STARTED'});
 }finally{await f.dispose();}
});
test('release during an in-flight request never refunds its reservation',async()=>{
 const budget=new ProductionBudget(enabled(500));let release,started;const gate=new Promise(r=>release=r),entered=new Promise(r=>started=r);
 const run=collect(budget.stream({},async function*(){started();await gate;yield*chunks(null);},{bound:100}));await entered;
 assert.equal(budget.release().reserved,100);assert.equal(budget.snapshot().halted,'BUDGET_RELEASED_WITH_PENDING_CALLS');release();await run;assert.equal(budget.snapshot().reserved,100);assert.equal(budget.snapshot().unknownUsageCalls,1);
});

test('a stream throwing after usage and finish is not a normal drain and keeps the full reservation',async()=>{
 const budget=new ProductionBudget(enabled(100));
 await assert.rejects(collect(budget.stream({},async function*(){yield*chunks(usage(1,1));throw new Error('post-finish fixture failure');},{bound:100})),/post-finish/);
 assert.equal(budget.snapshot().spent,0);assert.equal(budget.snapshot().reserved,100);assert.equal(budget.snapshot().halted,'BUDGET_USAGE_UNKNOWN');assert.equal(budget.snapshot().unknownUsageCalls,1);
});
test('early consumer return after finish cannot settle before downstream cleanup is confirmed',async()=>{
 const budget=new ProductionBudget(enabled(100)),stream=budget.stream({},()=>chunks(usage(1,1)),{bound:100});
 await stream.next();assert.equal((await stream.next()).value.type,'finish');await stream.return();
 assert.equal(budget.snapshot().spent,0);assert.equal(budget.snapshot().reserved,100);assert.equal(budget.snapshot().halted,'BUDGET_USAGE_UNKNOWN');
});
hostTest('enabled native budget refuses retry of failed calls with even valid zero or partial usage counters',async()=>{
 for(const firstAttemptUsage of [usage(0,0),{...usage(0,0),totalTokens:0},usage(5,1)]){const f=await nativeFixture({attempts:2,firstAttemptUsage});try{
  const result=await f.adapter.execute(f.spec);assert.equal(result.stopReason,'refusal');assert.equal(f.dispatches,1);assert.equal(f.adapter.budgetSnapshot('native-run').spent,0);assert.equal(f.adapter.budgetSnapshot('native-run').reserved,100);assert.equal(f.adapter.budgetSnapshot('native-run').halted,'BUDGET_USAGE_UNKNOWN');
 }finally{await f.dispose();}}
});

function remountFixture(){
 const listeners=new Map();let childId='budget-remount-unconfirmed-child',cleanupFails=true,dispatches=0;
 const on=(event,listener)=>{const list=listeners.get(event)||[];list.push(listener);listeners.set(event,list);return()=>{const index=list.indexOf(listener);if(index>=0)list.splice(index,1);};};
 const tools={guard:()=>()=>{},presentAs:()=>()=>{}};
 const parent={id:'budget-remount-parent',status:'idle',session:{header:{cwd:'/inert-remount'}},ctx:{get:()=>tools}};
 const ctx={on,get:name=>name==='sandboxPolicy'?{resolve:()=>({mode:'workspace-write',workspaceRoot:'/inert-remount'})}:undefined,
  agents:{get:id=>id===parent.id?parent:undefined,isOwnedBy:(_id,candidate)=>candidate===parent},
  llm:{stream(options){const hooks=[...(listeners.get('llm/stream')||[])];const next=()=>{const hook=hooks.shift();if(hook)return hook(options,next);dispatches++;return chunks();};return next();}},
  subagents:{getProvider:()=>({capabilities:{agentOptions:true,outputSchema:true,persona:true,depthLimit:true}}),resolveMaxDepth:()=>1,async start(){
   const child={id:childId,session:{header:{parentSession:parent.id}},ctx:{get:()=>tools,on:()=>()=>{}}};
   for(const listener of [...(listeners.get('agent/created')||[])])await listener({agent:child});
   return {id:child.id,localAgent:child,result:Promise.resolve({stopReason:'completed',output:[]}),async dispose(){if(cleanupFails)throw new Error('Inert cleanup failure');for(const listener of [...(listeners.get('agent/disposed')||[])])await listener({agent:child});}};
  }}
 };
 return {ctx,parent,get childId(){return childId;},get dispatches(){return dispatches;},confirmedId(id){childId=id;cleanupFails=false;},mount(){const adapter=createExecutionAdapter(ctx),context=adapter.context(parent.id);adapter.beginSession(parent.id,context.contextKey);return adapter;},spec(runId){return {sessionId:parent.id,runId,nodeId:'inert',role:'planner',model:{provider:'inert',model:'model'},prompt:'Inert remount fixture',signal:new AbortController().signal,limits:{maxStepsPerAgent:1}};}};
}
test('runtime replacement rejects exact unconfirmed old child streams without blocking unrelated sessions',async()=>{
 const f=remountFixture(),old=f.mount();let replacement;
 try{
  await assert.rejects(old.execute(f.spec('cleanup-failed-run')),{code:'CLEANUP_FAILED'});
  assert.throws(()=>f.ctx.llm.stream({sessionId:f.childId,purpose:'compaction'}),{code:'CLEANUP_UNCONFIRMED'});assert.equal(f.dispatches,0);
  await old.dispose();replacement=f.mount();
  assert.throws(()=>f.ctx.llm.stream({sessionId:f.childId,purpose:'compaction'}),{code:'CLEANUP_UNCONFIRMED'});
  assert.throws(()=>f.ctx.llm.stream({sessionId:f.childId}),{code:'CLEANUP_UNCONFIRMED'});assert.equal(f.dispatches,0);
  await collect(f.ctx.llm.stream({sessionId:'unrelated-clean-child',purpose:'compaction'}));assert.equal(f.dispatches,1);
 }finally{await replacement?.dispose();await old.dispose();}
});
test('confirmed cleanup retires exact old child ids across remount while distinct new children remain usable',async()=>{
 const f=remountFixture();f.confirmedId('budget-remount-confirmed-child');const old=f.mount();let replacement;
 try{assert.equal((await old.execute(f.spec('confirmed-before-remount'))).stopReason,'completed');old.releaseBudget('confirmed-before-remount');await old.dispose();replacement=f.mount();
  assert.throws(()=>f.ctx.llm.stream({sessionId:'budget-remount-confirmed-child',purpose:'compaction'}),{code:'BUDGET_RELEASED'});
  f.confirmedId('budget-remount-distinct-new-child');assert.equal((await replacement.execute(f.spec('confirmed-after-remount'))).stopReason,'completed');
  await collect(f.ctx.llm.stream({sessionId:'budget-remount-distinct-new-child'}));assert.equal(f.dispatches,1);
  await collect(f.ctx.llm.stream({sessionId:'unrelated-confirmed-parent'}));assert.equal(f.dispatches,2);
 }finally{await replacement?.dispose();await old.dispose();}
});
hostTest('official native confirmed child cannot reopen auxiliary dispatch after adapter replacement',async()=>{
 const f=await nativeFixture();let replacement;
 try{const result=await f.adapter.execute(f.spec);assert.equal(f.dispatches,1);f.adapter.releaseBudget('native-run');f.adapter.releaseSession(f.parent.id);await f.adapter.dispose();replacement=createExecutionAdapter(f.root);
  assert.throws(()=>f.root.llm.stream({provider:'inert',model:'model',messages:[],sessionId:result.childId,purpose:'compaction'}),{code:'BUDGET_RELEASED'});assert.equal(f.dispatches,1);
  await collect(f.root.llm.stream({provider:'inert',model:'model',messages:[],sessionId:'brand-new-unrelated-session'}));assert.equal(f.dispatches,2);
 }finally{await replacement?.dispose();await f.dispose();}
});

test('invalid launcher contract fails closed instead of falling back to the workflow peer module',async()=>{
 await assert.rejects(resolveNativeBudgetContract({get:()=>({installAnchor:'relative-untrusted-anchor'})}),{code:'BUDGET_HOST_CONTRACT_UNAVAILABLE'});
});
hostTest('physical duplicate profile LLM peer still admits real host requests through the installed AgentLoop contract',async()=>{
 const require=createRequire(import.meta.url),anchor=require.resolve('@deepseek-ai/dsh/package.json');
 const hostLlm=createRequire(createRequire(anchor).resolve('@deepseek-ai/dsh-agent-loop')).resolve('@deepseek-ai/dsh-llm');
 const hostModules=dirname(dirname(dirname(hostLlm))); // @deepseek-ai scope directory
 const root=await mkdtemp(join(tmpdir(),'dsh-budget-peer-'));let f;
 try{
  // The workflow's nested LLM is a separate physical copy. Other existing
  // official dependencies are shared only to keep this fixture offline.
  await mkdir(join(root,'node_modules','@deepseek-ai'),{recursive:true});
  const llmManifest=JSON.parse(await (await import('node:fs/promises')).readFile(join(dirname(dirname(hostLlm)),'package.json'),'utf8'));
  for(const name of [...Object.keys(llmManifest.dependencies),...Object.keys(llmManifest.peerDependencies)]){
   const target=join(root,'node_modules',name);await mkdir(dirname(target),{recursive:true});
   let packageRoot;try{packageRoot=dirname(require.resolve(name+'/package.json'));}catch{packageRoot=join(hostModules,'..',name);}
   await symlink(packageRoot,target,'dir');
  }
  const plugin=join(root,'profile','node_modules','dsh-desktop-workflow'),duplicate=join(plugin,'node_modules','@deepseek-ai','dsh-llm');
  await mkdir(join(plugin,'src'),{recursive:true});await mkdir(join(duplicate,'lib'),{recursive:true});
  await writeFile(join(plugin,'package.json'),JSON.stringify({name:'dsh-desktop-workflow',type:'module',peerDependencies:{'@deepseek-ai/dsh-llm':'0.2.0-rc.2'}}));
  await copyFile(hostLlm,join(duplicate,'lib','index.js'));await writeFile(join(duplicate,'package.json'),JSON.stringify(llmManifest));
  for(const name of ['host-adapter.js','production-budget.js'])await copyFile(new URL('../src/'+name,import.meta.url),join(plugin,'src',name));
  const duplicateBudget=await import(pathToFileURL(join(plugin,'src','production-budget.js')).href);
  const peer=await import(pathToFileURL(join(duplicate,'lib','index.js')).href),workflow=await import(pathToFileURL(join(plugin,'src','host-adapter.js')).href);
  const branded=markAgentLoopRequest(Object.freeze({}));assert.equal(peer.isAgentLoopRequest(branded),false,'physical duplicate must have a different marker WeakSet');
  const resolved=await duplicateBudget.resolveNativeBudgetContract({get:()=>({installAnchor:anchor})});
  const localOptions=peer.markAgentLoopRequest(Object.freeze({sessionId:'local-native',provider:'inert',model:'local',messages:[]}));
  assert.equal(duplicateBudget.nativeRequestBound(localOptions,{id:'local-native',session:{requestContext:()=>({provider:'inert',model:'local',contextWindow:100}),requestHeader:()=>({config:localOptions})}},resolved),100,'an exact official local marker remains supported');
  f=await nativeFixture({profileAnchor:anchor,adapterFactory:workflow.createExecutionAdapter});
  const result=await f.adapter.execute(f.spec);assert.equal(result.stopReason,'completed');assert.equal(f.dispatches,1);assert.equal(f.adapter.budgetSnapshot('native-run').spent,30);
 }finally{await f?.dispose();await rm(root,{recursive:true,force:true});}
});
