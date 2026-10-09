#!/usr/bin/env node
/** Actual adapter + official rc2 registries/guards; deterministic transport, policy, and Agent fixtures only. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createExecutionAdapter } from '../src/host-adapter.js';
import { PLAN_SCHEMA, REVIEW_SCHEMA, ROUTE_SCHEMA } from '../src/team-contracts.js';
const modules=process.env.DSH_NODE_MODULES;
const resolver=createRequire(modules?pathToFileURL(join(resolve(modules),'..','package.json')):import.meta.url);
const official=async name=>import(pathToFileURL(resolver.resolve('@deepseek-ai/'+name)));
const manifestPath=modules?join(resolve(modules),'@deepseek-ai/dsh/package.json'):resolver.resolve('@deepseek-ai/dsh/package.json');
assert.equal(JSON.parse(await readFile(manifestPath,'utf8')).version,'0.2.0-rc.2');
const {Context}=await official('cordis');
const {AgentRegistry}=await official('dsh-agent');
const {createScope,scopeTarget}=await official('dsh-scope');
const {default:SystemPrompt}=await official('dsh-system-prompt');
const {ToolRuntime,defineTool,assertObjectJsonSchema}=await official('dsh-tools');
for(const [name,schema]of Object.entries({PLAN_SCHEMA,REVIEW_SCHEMA,ROUTE_SCHEMA})){
  assertObjectJsonSchema(schema);console.log('PASS official rc2 accepts '+name);
}
const root=new Context();
const registryFork=root.plugin(AgentRegistry),promptFork=root.plugin(SystemPrompt),toolsFork=root.plugin(ToolRuntime,{mode:'native'});
await new Promise(r=>setTimeout(r,30));
let readCount=0,writeCount=0,sequence=0,disposedRuns=0;
const calls=[],created=[],stepDecisions=[];
const define=(name,count)=>defineTool({name,description:'Inert integration fixture',parameters:{},output:{schema:{type:'object',properties:{ok:{type:'boolean',required:true}},additionalProperties:false},render:()=>[{type:'text',text:'fixture result'}]},execute:async()=>{count();return {ok:true};}});
root.tools.register(define('read',()=>readCount++));root.tools.register(define('write',()=>writeCount++));
const parent={id:'team-host-fixture-parent',status:'idle',session:{id:'team-host-fixture-parent',header:{cwd:'/fixture/project'}}};
const parentScope=createScope(root,parent);parent.ctx=parentScope.ctx;
const detachParent=root.agents.enter(parent);await root.agents.announce(parent,'startup');
root.provide('sandboxPolicy',{resolve:()=>({mode:'workspace-write',workspaceRoot:'/fixture/project'})});
root.provide('llm',{
 listProviders:()=>[{id:'fixture-provider',name:'Deterministic fixture'}],
 listModels:async()=>[{id:'fixture-model',name:'No real model'}],
 resolveModelInfo:async()=>({reasoning:{efforts:[{id:'fixture-effort',name:'Fixture effort'}]}}),
 resolveCallConfig:async selection=>({...selection}),
});
const invoke=(agent,name)=>root.tools.execute({callId:`fixture-${++sequence}`,name,arguments:{},agent,signal:new AbortController().signal});
let mode='read';
root.provide('subagents',{
 getProvider:()=>({capabilities:{agentOptions:true,outputSchema:true,persona:true,depthLimit:true}}),
 resolveMaxDepth:()=>1,
 async start(provider,request){
  calls.push({provider,request});
  const caseMode=mode;
  const id=`fixture-child-${++sequence}`;
  const agent={id,status:'idle',session:{id,header:{parentSession:request.parent.id,cwd:'/fixture/project'}}};
  const scope=createScope(root,agent,{parent:request.parent});agent.ctx=scope.ctx;
  if(caseMode==='unsafe') agent.ctx={...scope.ctx,get:()=>undefined};
  const detach=root.agents.enter(agent,request.parent);
  let installed=false;
  try{
    await new Promise(r=>setTimeout(r,caseMode==='write'?8:3));
    await root.agents.announce(agent,'startup');installed=true;created.push(agent);
    const result=(async()=>{
      await new Promise(r=>setTimeout(r,2));
      if(caseMode==='steps')for(let step=1;step<=3;step++)stepDecisions.push(await agent.ctx.waterfall(scopeTarget(agent,agent),'agent/pre-step',{agent,messages:[],turn:1,step,signal:request.signal},async()=>({kind:'enter',messages:[]})));
      else await invoke(agent,caseMode==='write'?'write':'read');
      return {stopReason:'completed',output:[{type:'text',text:'Deterministic fixture output'}],structured:{fixture:true}};
    })();
    return {id,localAgent:agent,result,async dispose(){await result;detach();await scope.dispose();disposedRuns++;}};
  }catch(error){detach();await scope.dispose();assert.equal(installed,false);throw error;}
 },
});
const notices=[];
const adapter=createExecutionAdapter(root,{onParentUnavailable:(...args)=>notices.push(args)});
const context=adapter.context(parent.id);assert.equal(context.canStart,true);
const spec=role=>({sessionId:parent.id,runId:'fixture-run',nodeId:role,role,prompt:'No model is called by this test',model:{provider:'fixture-provider',model:'fixture-model',reasoningEffort:'fixture-effort'},signal:new AbortController().signal,limits:{maxStepsPerAgent:2}});
try{
 const catalog=await adapter.catalog([{provider:'fixture-provider',model:'fixture-model'}]);assert.equal(catalog.providers[0].models[0].efforts[0].id,'fixture-effort');assert.equal(calls.length,0);
 adapter.beginSession(parent.id,context.contextKey);
 assert.equal((await invoke(parent,'write')).isError,true);assert.equal(writeCount,0);
 console.log('PASS actual adapter installs native parent mutation guard before dispatch');
 // Both attempts call an inert write tool; concurrent role tags must remain distinct.
 mode='write';
 const [readonlyResult,workerResult]=await Promise.all([adapter.execute(spec('planner')),adapter.execute(spec('worker'))]);
 assert.equal(readonlyResult.stopReason,'refusal');assert.equal(workerResult.stopReason,'completed');assert.equal(writeCount,1);assert.equal(disposedRuns,2);
 assert.equal(calls[0].request.agentOptions.reasoningEffort,'fixture-effort');
 console.log('PASS actual adapter ALS isolates concurrent roles; native readonly guard denies write, worker permits one write');
 assert.equal(root.agents.list().length,1);
 mode='steps';const limited=await adapter.execute(spec('reviewer'));assert.equal(limited.stopReason,'refusal');assert.deepEqual(stepDecisions.map(x=>x.kind),['enter','enter','reject']);
 console.log('PASS actual scoped pre-step waterfall enforces adapter request cap');
 mode='unsafe';await assert.rejects(adapter.execute(spec('explorer')),error=>error.code==='UNSAFE_TOOLS');assert.equal(root.agents.list().length,1);
 console.log('PASS real serial announce propagates unsafe-scope rejection before transport result');
 let bashCalls=0;
 root.tools.register(define('bash',()=>bashCalls++));
 const native=await adapter.executeTool(parent.id,{name:'bash',arguments:{}},new AbortController().signal);
 assert.equal(native.isError,false);assert.equal(bashCalls,1);
 assert.equal((await invoke(parent,'bash')).isError,true);assert.equal(bashCalls,1);
 const ask=parent.ctx.on('tools/pre-execute',async(exec,next)=>exec.name==='bash'?{kind:'ask',reason:'Fixture permission prompt',request:{}}:next());
 const denied=await adapter.executeTool(parent.id,{name:'bash',arguments:{}},new AbortController().signal);
 assert.equal(denied.isError,true);assert.equal(bashCalls,1);ask();
 console.log('PASS native verifier tool path keeps original parent scope; exact ALS guard permits only owned call; ask is denied without approval');
 let approvalCalls=0;const approvalAbort=new AbortController();
 root.provide('approval',{overrideOf:()=>undefined,async request(request){approvalCalls++;assert.equal(request.agent,parent);assert.equal(request.toolName,'bash');approvalAbort.abort();return 'cancelled';}});
 const nativeAsk=parent.ctx.on('tools/pre-execute',async(exec,next)=>exec.name==='bash'?{kind:'ask',reason:'Explicit native user approval fixture'}:next());
 const cancelledApproval=await adapter.executeTool(parent.id,{name:'bash',arguments:{}},approvalAbort.signal,{allowUserApproval:true});
 assert.equal(approvalCalls,1);assert.equal(cancelledApproval.isError,true);assert.equal(cancelledApproval.verificationNotDispatched,true);assert.equal(bashCalls,1);nativeAsk();
 console.log('PASS auto verifier native approval routes to exact parent; cancelled prompt performs zero dispatch and does not fake approval');

 adapter.releaseSession(parent.id);assert.equal((await invoke(parent,'write')).isError,false);assert.equal(writeCount,2);
 console.log('PASS releaseSession withdraws native parent guard');
 assert.equal(notices.length,0);
 console.log('Team host integration passed. Agent objects, sandbox policy, LLM catalog and subagent transport are fixtures. Full AgentLoop/provider/Electron execution remains untested; no model calls or user credentials/profile changes.');
}finally{
 await adapter.dispose();detachParent();await parentScope.dispose();await toolsFork.dispose();await promptFork.dispose();await registryFork.dispose();
}
