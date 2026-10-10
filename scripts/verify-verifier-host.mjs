#!/usr/bin/env node
/** Actual rc.2 tool schemas, ToolRuntime and adapter; inert shell provider only.
 * No shell process, profile, credential, model, network or Jev request is used. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createExecutionAdapter} from '../src/host-adapter.js';
import {createAutoVerifier} from '../src/auto-verification.js';
import {createVerifier} from '../src/verification.js';

assert.ok(process.env.DSH_NODE_MODULES,'Set DSH_NODE_MODULES to an approved official rc.2 tree');
const modules=resolve(process.env.DSH_NODE_MODULES);
const require=createRequire(pathToFileURL(join(modules,'..','package.json')));
const official=async name=>import(pathToFileURL(require.resolve('@deepseek-ai/'+name)));
assert.equal(JSON.parse(await readFile(join(modules,'@deepseek-ai/dsh/package.json'),'utf8')).version,'0.2.0-rc.2');
const {Context}=await official('cordis');
const {AgentRegistry}=await official('dsh-agent');
const {createScope}=await official('dsh-scope');
const {default:SystemPrompt}=await official('dsh-system-prompt');
const {ToolRuntime,ToolArgsError}=await official('dsh-tools');
const bash=await official('dsh-tool-bash');
const root=new Context();
const forks=[root.plugin(AgentRegistry),root.plugin(SystemPrompt),root.plugin(ToolRuntime,{mode:'native'})];
await Promise.all(forks);
let shellCalls=0,dispatches=0,sequence=0;
let currentPayload;
const phases=[],poisoned=[];
const shell={resolve:spec=>spec,async execute(spec){
  shellCalls++;
  assert.match(spec.command,/verification-(?:project|host)-runner\.js/);
  const payload=currentPayload;
  assert.ok(payload,'Only generated verification invocations may reach the inert shell');
  phases.push(payload.phase);
  const data={runId:payload.runId,round:payload.round,nonce:payload.nonce,verified:true,clean:true,sealed:true,fingerprint:'fixture-fingerprint',project:{mode:'verified',root:'/fixture/project',checks:[]},baselineRef:{path:'/fixture/evidence/state.json',digest:'fixture-digest'}};
  return {result:async()=>({exitCode:0,signal:null,timedOut:false,aborted:false,timeoutMs:spec.timeoutMs,stdout:{text:JSON.stringify(data),truncated:false},stderr:{text:'',truncated:false}})};
}};
root.provide('shell',shell);
root.provide('shellEnv',{collect:()=>({})});
bash.apply(root,{enableRunInBackground:false,promoteOnTimeout:false});
root.provide('sandboxPolicy',{resolve:()=>({mode:'workspace-write',workspaceRoot:'/fixture/project'})});
root.provide('subagents',{getProvider:()=>({capabilities:{agentOptions:true,outputSchema:true,persona:true,depthLimit:true}}),resolveMaxDepth:()=>1,start(){throw Error('A model/child must never start in this test');}});
const parent={id:'verifier-host-fixture',status:'idle',session:{id:'verifier-host-fixture',header:{cwd:'/fixture/project'}}};
const scope=createScope(root,parent);parent.ctx=scope.ctx;
const detach=root.agents.enter(parent);await root.agents.announce(parent,'startup');
const offDispatch=parent.ctx.on('tools/execute',async(_exec,next)=>{dispatches++;return next();});
const adapter=createExecutionAdapter(root,{onCleanupFailed:(id,source)=>poisoned.push({id,source})});
const signal=new AbortController().signal;
const captured=root.tools.resolveExecution("bash",parent,false);
const legacyProfile={id:'fixture',checks:[{id:'test',argv:['node','--test','fixture.test.mjs'],timeoutMs:1000}],protectedPaths:['fixture.test.mjs']};
const setPayload=command=>{
 const encoded=command.match(/'([A-Za-z0-9+/=]+)'$/)?.[1];
 assert.ok(encoded);
 currentPayload=JSON.parse(Buffer.from(encoded,'base64').toString('utf8'));
};
const executeTool=(id,spec,abort,options)=>{
  assert.equal(spec.name,'bash');assert.ok(spec.arguments.description.trim());
  setPayload(spec.arguments.command);
  return adapter.executeTool(id,spec,abort,options);
};
try{
  await assert.rejects(captured.execute({command:'never execute this',timeoutMs:1000,run_in_background:false},{signal}),error=>error instanceof ToolArgsError&&error.code==='INVALID_ARGS'&&/missing required property "description"/.test(error.message));
  assert.equal(shellCalls,0);
  adapter.beginSession(parent.id,adapter.context(parent.id).contextKey);
  const invalid=await adapter.executeTool(parent.id,{name:'bash',arguments:{command:'never execute this',timeoutMs:1000,run_in_background:false}},signal);
  assert.equal(invalid.isError,true);assert.notEqual(invalid.verificationNotDispatched,true);
  assert.equal(dispatches,1);assert.equal(shellCalls,0);
  assert.match(JSON.stringify(invalid),/missing required property.*description/);
  adapter.releaseSession(parent.id);
  console.log('PASS old invocation: real ToolArgsError INVALID_ARGS after dispatch observer; zero shell starts');

  for(let cycle=0;cycle<2;cycle++){
    adapter.beginSession(parent.id,adapter.context(parent.id).contextKey);
    const auto=createAutoVerifier({executeTool,poison:id=>adapter.poison(id)});
    const config={sessionId:parent.id,verification:{profileId:'auto',scope:['workspace']}};
    const runId='auto-fixture-'+cycle;
    const atStart=shellCalls;
    for(const phase of ['baseline','check','seal'])await auto.collect({config,runId,round:phase==='baseline'?0:1,signal,phase});
    await auto.release(runId);
    assert.equal(shellCalls-atStart,4);
    assert.deepEqual(phases.slice(-4),['baseline','check','seal','cleanup']);
    assert.equal(poisoned.length,0);
    adapter.releaseSession(parent.id);
  }
  console.log('PASS actual auto verifier baseline/check/seal/cleanup twice through rc.2 ToolRuntime; eight inert calls, no poison, second run admitted');
  adapter.beginSession(parent.id,adapter.context(parent.id).contextKey);
  const legacy=createVerifier({profiles:[legacyProfile],executeTool,poison:id=>adapter.poison(id)});
  const config={sessionId:parent.id,verification:{profileId:'fixture',scope:['src']}};
  const atStart=shellCalls;
  for(const phase of ['baseline','check','seal'])await legacy.collect({config,runId:'legacy-fixture',round:phase==='baseline'?0:1,signal,phase});
  await legacy.release('legacy-fixture');
  assert.equal(shellCalls-atStart,3);assert.equal(poisoned.length,0);
  adapter.releaseSession(parent.id);
  assert.equal(shellCalls,11);assert.equal(dispatches,12);
  console.log('PASS legacy verifier baseline/check/seal through real rc.2 schema; three inert calls');
  console.log('Verifier host regression passed: 11 inert shell-provider calls, 12 native dispatches including one rejected negative control; zero OS shell/model/Jev calls.');
}finally{
  await adapter.dispose();offDispatch();detach();await scope.dispose();
  for(const fork of forks.reverse())await fork.dispose();
}
