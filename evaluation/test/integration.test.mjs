import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync,symlinkSync,mkdirSync,linkSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {BudgetLedger,JevMeter,openProjectLedger,openJevMeter} from '../src/budget.mjs';
import {replayExecutionTrace} from '../../src/execution-trace.js';
import {fixtureDependencies} from '../../test/helpers/team-host.mjs';
import {integrationFixture,fixtureJev,budget} from './helpers/integration-fixture.mjs';
const storeOptions={projectId:'test-integration'};
const baseReservation={taskId:'task-1',batchId:'batch-1',inputUpperBound:100,maxOutputTokens:100,taskLimit:2000,batchLimit:2000,logicalCallId:'call-1'};

test('real controller uses shared model ledger, independent verifier, trace, replay and separate shadow meter',async()=>{
 const h=integrationFixture({shadow:true});try{
  const {result,trace,summary}=await h.run();
  assert.equal(result.status,'completed');assert.equal(h.calls.length,5);assert.equal(summary.modelPhysicalCalls,5);
  assert.equal(summary.spentTokens,900);assert.equal(h.ledger.snapshot().tasks['task-1'].spent,900);
  assert.equal(summary.jev.calls,4);assert.equal(summary.jev.inputTokens,124);assert.equal(summary.reservedTokens,0);
  assert.equal(replayExecutionTrace(trace).matches,true);assert.equal(summary.costRoutingImplemented,false);
  assert(!JSON.stringify({trace,summary,state:h.ledger.snapshot()}).includes('private-'));
 }finally{await h.controller.dispose();}
});
test('optional shadow runs after primary completion and cannot spend tokens or overwrite primary decision',async()=>{
 let release,entered;const called=new Promise(r=>entered=r);
 const h=integrationFixture({extra:{shadowJev:fixtureJev({decide:async()=>{entered();await new Promise(r=>release=r);return {};}}),maxShadowCalls:1,shadowTimeoutMs:100}});
 try {const id=h.controller.start(h.config).id,result=await h.controller.wait(id);assert.equal(result.status,'completed');await called;assert.equal(h.calls.length,5);
  assert.equal(h.jevMeter.snapshot().active,1);assert.equal(h.ledger.snapshot().spent,900);release();await h.controller.waitForShadow(id);assert.equal(h.controller.snapshot(h.config.sessionId).status,'completed');
 }finally{release?.();await h.controller.dispose();}
});
test('missing model usage halts before decoder and does not release the full reservation',async()=>{
 let decoded=0,calls=0;const h=integrationFixture({transport:async()=>{calls++;return {};},decode:()=>decoded++});try{
  const run=await h.run();assert.notEqual(run.result.status,'completed');assert.equal(calls,1);assert.equal(decoded,0);
  assert.equal(run.summary.halted,'missing-usage');assert.equal(run.summary.reservedTokens,2560);
  assert(!JSON.stringify(run.trace).includes('private-'));
 }finally{await h.controller.dispose();}
});
test('failed independent checks cannot be accepted by confident primary or shadow Jev',async()=>{
 const verifier=fixtureDependencies().verifier,collect=verifier.collect;
 verifier.collect=async spec=>spec.phase==='check'?{...await collect(spec),checksPassed:false,checksFailed:1,checks:[{passed:false,exitCode:1,tail:'private-failure'}]}:collect(spec);
 const h=integrationFixture({shadow:true,verifier});try{const run=await h.run();assert.notEqual(run.result.status,'completed');assert.equal(replayExecutionTrace(run.trace).matches,true);assert(!JSON.stringify(run.trace).includes('private-'));}finally{await h.controller.dispose();}
});
test('one task token cap spans all roles and stops before an over-budget request',async()=>{
 const h=integrationFixture({extra:{budget:{...budget,taskTokenLimit:2800,maxOutputTokens:2048}}});try{const run=await h.run();assert.notEqual(run.result.status,'completed');assert.equal(h.calls.length,2);assert.equal(run.summary.spentTokens,360);assert.equal(h.ledger.snapshot().tasks['task-1'].limit,2800);}finally{await h.controller.dispose();}
});
test('default trace and shadow remain disabled when not explicitly selected',async()=>{
 const h=integrationFixture({extra:{trace:false}});try{const run=await h.run();assert.equal(run.result.status,'completed');assert.equal(run.trace,null);assert.equal(run.summary.jev.calls,2);}finally{await h.controller.dispose();}
});
test('logical attempts and total team requests have separate persisted bounds',()=>{
 const ledger=new BudgetLedger(storeOptions),contract={usageFormat:'chat_completions',reasoningAccounting:'included_in_output'};
 for(let i=0;i<2;i++){const id=ledger.reserve(baseReservation);ledger.settle(id,{prompt_tokens:1,completion_tokens:1},contract);}
 assert.throws(()=>ledger.reserve(baseReservation),/logical-attempt/);
 for(let i=2;i<=11;i++){const id=ledger.reserve({...baseReservation,logicalCallId:`call-${i}`});ledger.settle(id,{prompt_tokens:1,completion_tokens:1},contract);}
 assert.equal(ledger.snapshot().tasks['task-1'].attempts,12);
 assert.throws(()=>ledger.reserve({...baseReservation,logicalCallId:'call-12'}),/task-request/);
 const resumed=new BudgetLedger({...storeOptions,state:ledger.snapshot()});assert.equal(resumed.snapshot().tasks['task-1'].attempts,12);
});
test('model and Jev single-writer locks exclude separate operating-system processes',()=>{
 const dir=mkdtempSync(join(tmpdir(),'jev-cross-process-'));
 try {for(const [name,open,args,lockError] of [['model',openProjectLedger,storeOptions,'project-ledger-locked'],['jev',openJevMeter,{},'jev-meter-locked']]){
  const path=join(dir,name+'.json'),store=open(path,args);
  const child=spawnSync(process.execPath,['--input-type=module','-e',`import {${name==='model'?'openProjectLedger':'openJevMeter'} as open} from ${JSON.stringify(new URL('../src/budget.mjs',import.meta.url).href)};try{open(${JSON.stringify(path)},${JSON.stringify(args)});process.exit(99)}catch(e){if(e.message!==${JSON.stringify(lockError)})process.exit(98)}`],{encoding:'utf8'});
  assert.equal(child.status,0,child.stderr);store.close();
 }}finally{rmSync(dir,{recursive:true,force:true});}
});
test('Jev totals and retries survive reopen; stale holders cannot spend after close',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'jev-persistent-')),path=join(dir,'jev.json');try{
  const first=openJevMeter(path,{maxCalls:3});let count=0;
  await first.meter.call(async()=>{if(++count===1)throw {retryable:true};return {usage:{input_tokens:11,output_tokens:7}};});first.close();
  const second=openJevMeter(path,{maxCalls:3});assert.equal(second.meter.snapshot().calls,2);assert.equal(second.meter.snapshot().retries,1);
  await assert.rejects(first.meter.call(()=>assert.fail()),/closed/);
  await second.meter.call(async()=>({}));await assert.rejects(second.meter.call(()=>assert.fail()),/call-limit/);second.close();
  assert.equal(JSON.parse(readFileSync(path)).stats.calls,3);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('Jev persists active marker before transport and crash state remains fail-closed',async()=>{
 let state;const meter=new JevMeter({save:value=>{state=value;}});let release;
 const request=meter.call(()=>new Promise(r=>release=r));assert.equal(state.stats.calls,1);assert.equal(state.active,1);
 const resumed=new JevMeter({state});await assert.rejects(resumed.call(()=>assert.fail()),/halted/);
 assert.throws(()=>resumed.close(),/keeps-lock/);release({});await request;
});
test('Jev disk failure cannot dispatch; raw provider errors do not enter stored state',async()=>{
 let writes=0;const meter=new JevMeter({save(){if(++writes>1)throw Error('private-disk-error');}});
 await assert.rejects(meter.call(()=>assert.fail('must not dispatch')),/write-failed/);assert(!JSON.stringify(meter.snapshot()).includes('private'));
});
test('directory aliases share a lock and symlink ledger files are refused',()=>{
 const dir=mkdtempSync(join(tmpdir(),'jev-alias-'));try{
  mkdirSync(join(dir,'real'));symlinkSync(join(dir,'real'),join(dir,'alias'));
  const handle=openProjectLedger(join(dir,'real','ledger.json'),storeOptions);
  assert.throws(()=>openProjectLedger(join(dir,'alias','ledger.json'),storeOptions),/locked/);
  symlinkSync(join(dir,'real','ledger.json'),join(dir,'other.json'));
  assert.throws(()=>openProjectLedger(join(dir,'other.json'),storeOptions),/symlink/);handle.close();
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('hard-linked model and Jev ledgers cannot create alternate budget locks',()=>{
 const dir=mkdtempSync(join(tmpdir(),'jev-hardlink-'));try{
  for(const [name,open,options] of [['model',openProjectLedger,storeOptions],['jev',openJevMeter,{}]]){
   const path=join(dir,name+'.json'),alias=join(dir,name+'-alias.json');const initial=open(path,options);initial.close();linkSync(path,alias);
   assert.throws(()=>open(path,options),/linked-ledger-refused/);assert.throws(()=>open(alias,options),/linked-ledger-refused/);
  }
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('slow primary does not spend queued shadow physical-request timeout',async()=>{
 const h=integrationFixture({shadow:true,transport:async()=>{await new Promise(r=>setTimeout(r,30));return {usage:{prompt_tokens:100,completion_tokens:80}};},extra:{shadowTimeoutMs:20}});
 try{const run=await h.run();assert.equal(run.result.status,'completed');assert.equal(run.summary.jev.calls,4);assert.equal(run.trace.events.filter(e=>e.type==='jev'&&e.data.source==='shadow'&&e.data.status==='completed').length,2);}finally{await h.controller.dispose();}
});
test('each serial shadow receives its own physical request timeout after acquiring the slot',async()=>{
 const delegate=fixtureJev({shadow:true});
 const h=integrationFixture({extra:{shadowJev:fixtureJev({shadow:true,decide:async spec=>{await new Promise(r=>setTimeout(r,15));return delegate.decide(spec);}}),shadowTimeoutMs:25}});
 try{const run=await h.run();assert.equal(run.result.status,'completed');assert.equal(run.summary.jev.calls,4);assert.equal(run.trace.events.filter(e=>e.type==='jev'&&e.data.source==='shadow'&&e.data.status==='completed').length,2);}finally{await h.controller.dispose();}
});
test('cancelling primary cancels queued observers without extra physical Jev calls',async()=>{
 let entered,release,decoded=0;const waiting=new Promise(r=>entered=r);
 const h=integrationFixture({shadow:true,decode:()=>decoded++,transport:async()=>{entered();await new Promise(r=>release=r);return {usage:{prompt_tokens:100,completion_tokens:80}};}});
 try{const run=h.controller.start(h.config);await waiting;h.controller.cancel(h.config.sessionId,run.id);release();await h.controller.wait(run.id);await h.controller.waitForShadow(run.id);assert.equal(h.jevMeter.snapshot().calls,1);assert.equal(h.jevMeter.snapshot().active,0);assert.equal(decoded,0);assert.equal(h.ledger.snapshot().spent,180);}finally{release?.();await h.controller.dispose();}
});
