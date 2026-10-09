import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createVerifier,verificationProfiles} from '../src/verification.js';
import {createTeamRuntime} from '../src/team-runtime.js';
import {fixtureDependencies,teamHost,settings,waitFor} from './helpers/team-host.mjs';

const profile=()=>({id:'independent',checks:[{id:'check',argv:['node','--version'],timeoutMs:1000}],protectedPaths:['package.json'],expectsChanges:true});
const spec=()=>({config:{sessionId:'audit-session',verification:{profileId:'independent',scope:['src']}},runId:'audit-run',round:0,phase:'baseline',signal:new AbortController().signal});
function harness(executeTool){const poisoned=[];const verifier=createVerifier({profiles:[profile()],executeTool,poison:id=>poisoned.push(id)});return {verifier,poisoned};}

test('independent audit: ambiguous native tool exceptions quarantine the run',async()=>{
 const h=harness(async()=>{throw Error('Fixture transport failed after possible dispatch');});
 await assert.rejects(h.verifier.collect(spec()));
 assert.deepEqual(h.poisoned,['audit-session']);
});
test('independent audit: native missing/error/promoted/aborted results never release uncertain execution',async()=>{
 for(const result of [undefined,{isError:true},{isError:false,value:{kind:'promoted',jobId:'fixture-job'}},{isError:false,value:{kind:'background',jobId:'fixture-job'}},{isError:false,value:{kind:'foreground',aborted:true}}]){
  const h=harness(async()=>result);await assert.rejects(h.verifier.collect(spec()));assert.deepEqual(h.poisoned,['audit-session']);
 }
});
test('independent audit: profile catalog is complete and detached from trusted configuration',()=>{
 const source=profile();const h=createVerifier({profiles:[source],executeTool:async()=>{},poison:()=>{}});
 source.checks[0].argv[0]='untrusted';
 assert.equal(h.profiles[0].checks[0].argv[0],'node');assert.equal(h.profiles[0].checks[0].timeoutMs,1000);assert.deepEqual(h.profiles[0].protectedPaths,['package.json']);
 h.profiles[0].checks[0].argv[0]='also-untrusted';
 assert.equal(h.preflight(spec().config).checks[0].argv[0],'node');
});
test('independent audit: check profiles reject traversal and unbounded execution',()=>{
 for(const patch of [{protectedPaths:['../tests']},{protectedPaths:['/tests']},{checks:[{id:'check',argv:['node'],timeoutMs:0}]},{checks:[{id:'check',argv:['node'],timeoutMs:60001}]}])assert.throws(()=>verificationProfiles([{...profile(),...patch}]));
});
test('independent audit: stale completion seal overrides passing models and prior checks',async()=>{
 const h=teamHost(),deps=fixtureDependencies(),original=deps.verifier.collect;
 const phases=[];deps.verifier.collect=async spec=>{phases.push(spec.phase);return spec.phase==='seal'?{verified:false,sealed:false,reason:'Fixture changed after Jev request'}:original(spec);};
 const runtime=createTeamRuntime(h.ctx,{},deps);
 try{
  const context=runtime.snapshot('fixture-session').context;
  await runtime.start({sessionId:'fixture-session',contextKey:context.contextKey,requestId:'audit-stale-seal',goal:'Fixture only',settings:settings()});
  const result=await waitFor(()=>{const s=runtime.snapshot('fixture-session').snapshot;return s?.finishedAt&&s;});
  assert.equal(result.status,'blocked');assert.deepEqual(phases,['baseline','check','seal']);
 }finally{await runtime.dispose();}
});
test('independent audit: cancel during final seal waits for verifier settlement and cannot complete',async()=>{
 const h=teamHost(),deps=fixtureDependencies(),original=deps.verifier.collect;let settle,sealSignal;
 deps.verifier.collect=async spec=>{if(spec.phase!=='seal')return original(spec);sealSignal=spec.signal;return new Promise(resolve=>{settle=resolve;});};
 const runtime=createTeamRuntime(h.ctx,{},deps);
 try{
  const context=runtime.snapshot('fixture-session').context;
  const started=await runtime.start({sessionId:'fixture-session',contextKey:context.contextKey,requestId:'audit-cancel-seal',goal:'Fixture only',settings:settings()});
  await waitFor(()=>settle);runtime.cancel({sessionId:'fixture-session',runId:started.snapshot.id});
  assert.equal(sealSignal.aborted,true);assert.equal(runtime.snapshot('fixture-session').context.canStart,false);assert.equal(runtime.snapshot('fixture-session').snapshot.finishedAt,undefined);
  settle({verified:true,sealed:true,reason:'Late fixture result'});
  const result=await waitFor(()=>{const s=runtime.snapshot('fixture-session').snapshot;return s?.finishedAt&&s;});
  assert.equal(result.status,'cancelled');
 }finally{settle?.({verified:false,sealed:false});await runtime.dispose();}
});
