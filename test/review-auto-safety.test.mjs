import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,symlinkSync,linkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createExecutionAdapter} from '../src/host-adapter.js';
import {createHostJevClient} from '../src/team-setup.js';
import {JevTeamController} from '../src/jev-controller.js';
import {fixtureDependencies,settings} from './helpers/team-host.mjs';

async function guardedProject(mode='verified'){
 const root=mkdtempSync(path.join(tmpdir(),'dsh-auto-guard-audit-'));mkdirSync(path.join(root,'src'));mkdirSync(path.join(root,'node_modules'));
 writeFileSync(path.join(root,'src/existing.js'),'export const a=1;');writeFileSync(path.join(root,'package.json'),'{}');
 const listeners=new Map();let guard;
 const parent={id:'audit-parent',status:'idle',session:{header:{cwd:root}},ctx:{get:()=>({guard:()=>()=>{}})}};
 const ctx={on(name,fn){const list=listeners.get(name)||[];list.push(fn);listeners.set(name,list);return()=>{};},get:name=>name==='sandboxPolicy'?{resolve:()=>({mode:'workspace-write',workspaceRoot:root})}:undefined,agents:{get:()=>parent,isOwnedBy:()=>true},subagents:{getProvider:()=>({capabilities:{agentOptions:true,outputSchema:true,persona:true,depthLimit:true}}),resolveMaxDepth:()=>1,async start(){
  const agent={id:'audit-child',session:{header:{parentSession:parent.id}},ctx:{get:()=>({guard(fn){guard=fn;return()=>{};},presentAs:()=>()=>{}}),on:()=>()=>{}}};
  for(const fn of listeners.get('agent/created')||[])await fn({agent});
  return {id:agent.id,localAgent:agent,result:Promise.resolve({stopReason:'completed',output:[]}),dispose:async()=>{}};
 }}};
 const adapter=createExecutionAdapter(ctx);adapter.beginSession(parent.id,adapter.context(parent.id).contextKey);adapter.setProjectPolicy('audit-run',{mode,root,protectedFiles:['package.json']});
 await adapter.execute({sessionId:parent.id,runId:'audit-run',nodeId:'audit-node',role:'worker',model:{provider:'fixture',model:'fixture'},prompt:'Fixture only',signal:new AbortController().signal,limits:{maxStepsPerAgent:2}});
 return {root,adapter,check:(name,args)=>guard({name,arguments:args})};
}

test('independent auto audit: native worker edits source and config while secret/dependency/shell paths remain denied',async()=>{
 const f=await guardedProject();try{
  assert.equal(f.check('edit',{file_path:'src/existing.js'}),undefined);assert.equal(f.check('write',{file_path:'src/new.js'}),undefined);
  assert.equal(f.check('edit',{file_path:'package.json'}),undefined);
  for(const [name,args]of [['bash',{command:'echo fixture'}],['write',{file_path:'node_modules/new.js'}],['write',{file_path:'../outside.js'}],['read',{file_path:'.credentials.yaml'}],['grep',{path:'.',pattern:'.'}]])assert.ok(f.check(name,args));
  assert.equal(f.check('grep',{path:'src/existing.js',pattern:'a'}),undefined);
 }finally{await f.adapter.dispose();}
});
test('independent auto audit: dangling links and hardlinks cannot bypass dependency isolation',async()=>{
 const f=await guardedProject();try{
  symlinkSync('../node_modules/missing.js',path.join(f.root,'src/dangling.js'));
  assert.ok(f.check('write',{file_path:'src/dangling.js'}));
  writeFileSync(path.join(f.root,'node_modules/runner.js'),'original');linkSync(path.join(f.root,'node_modules/runner.js'),path.join(f.root,'src/linked.js'));
  assert.ok(f.check('edit',{file_path:'src/linked.js'}));
 }finally{await f.adapter.dispose();}
});
test('independent auto audit: analysis-only mode is actually read-only',async()=>{
 const f=await guardedProject('analysis-only');try{assert.ok(f.check('edit',{file_path:'src/existing.js'}));assert.ok(f.check('write',{file_path:'src/new.js'}));assert.equal(f.check('read',{file_path:'src/existing.js'}),undefined);}finally{await f.adapter.dispose();}
});
test('independent auto audit: a project without a supported test runner can still receive safe edits',async()=>{
 const f=await guardedProject('unverified-editable');try{assert.equal(f.check('edit',{file_path:'src/existing.js'}),undefined);assert.equal(f.check('write',{file_path:'src/new.js'}),undefined);assert.ok(f.check('bash',{command:'echo fixture'}));}finally{await f.adapter.dispose();}
});
test('independent auto audit: credential provider diagnostics never become public errors or model requests',async()=>{
 let fetches=0;const client=createHostJevClient({get:()=>({resolve:async()=>{throw Error('FAKE_PRIVATE_KEY_AND_PATH');}})},{refresh:async()=>({disclosureAccepted:true,keyConfigured:true})},{fetchImpl:async()=>{fetches++;throw Error('unexpected');}});
 await assert.rejects(client.decide({phase:'classify',goal:'fixture',signal:new AbortController().signal}),e=>e.code==='JEV_CREDENTIAL_UNAVAILABLE'&&!e.message.includes('FAKE_PRIVATE'));
 assert.equal(fetches,0);
});
test('independent auto audit: no runner or changed acceptance ends after one editable cycle as unverified',async()=>{
 for(const mode of ['unverified-editable','changed-acceptance']){
  const deps=fixtureDependencies(),original=deps.verifier.collect;let workerCalls=0,checks=0,seals=0;
  deps.verifier.collect=async spec=>{
   if(spec.phase==='baseline')return {verified:true,reason:'Fixture baseline',project:{mode:mode==='unverified-editable'?mode:'verified',reason:'Fixture project',checks:[]}};
   if(spec.phase==='seal')seals++;
   const facts=await original(spec);checks++;return {...facts,needsVerification:true,checksPassed:false,checksRun:false,protectedOk:mode!=='changed-acceptance',reason:'Fixture pending verification'};
  };
  const plan={summary:'Fixture plan',tasks:[{id:'source',title:'Edit fixture source',instructions:'Synthetic task',role:'worker',dependsOn:[]}]};
  const controller=new JevTeamController({...deps,execute:async spec=>{if(spec.role==='worker')workerCalls++;return {stopReason:'completed',output:'Fixture changes produced',structured:spec.role==='reviewer'?{verdict:'approve',summary:'Fixture approval',issues:[]}:plan};}});
  try{const started=controller.start({sessionId:'audit',goal:'Fixture only',...settings()});const result=await controller.wait(started.id);assert.equal(result.status,'unverified');assert.equal(workerCalls,1);assert.equal(checks,1);assert.equal(seals,0);}finally{await controller.dispose();}
 }
});
