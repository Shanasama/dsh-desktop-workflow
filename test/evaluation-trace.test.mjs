import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createExecutionTrace,replayExecutionTrace} from '../src/execution-trace.js';
import {createJevClient,getJevMetadata,parseJevResponse} from '../src/jev-client.js';
import {JevTeamController} from '../src/jev-controller.js';
import {createHostJevClient} from '../src/team-setup.js';
import {createTeamRuntime} from '../src/team-runtime.js';
import {fixtureDependencies,settings,teamHost,waitFor} from './helpers/team-host.mjs';
const config=()=>({sessionId:'private-session',goal:'private-source and user@example.invalid',...settings()});
const choice=(selected,keys)=>({type:'choice',choice:selected,confidence:1,probabilities:Object.fromEntries(keys.map(key=>[key,key===selected?1:0]))});
const response=(phase,{next='complete',lane='small',model='jev-1.0.0'}={})=>({model,usage:{input_tokens:123,output_tokens:45},answers:phase==='classify'?{lane:choice(lane,['small','medium','high','escalate','other']),security_sensitive:{type:'noul',noul:0},underspecified:{type:'noul',noul:0}}:{next:choice(next,['complete','continue','retry_differently','needs_stronger_model','needs_person','other']),implemented:{type:'noul',noul:1},in_scope:{type:'noul',noul:1}}});
function harness(options={}) {
 const dependencies=fixtureDependencies(),calls=[];
 const primary=options.jev||{mode:'fixture',preflight(){},async decide({phase}){return parseJevResponse(response(phase),'classify'===phase?'classify':'step',{requestedModel:'jev-1.0.0'});}};
 const controller=new JevTeamController({...dependencies,jev:primary,trace:true,...options,execute:async spec=>{
  calls.push({role:spec.role,model:spec.model});
  return {stopReason:'completed',output:'private-model-output sk-fixture-secret-0123456789',structured:spec.role==='reviewer'?{verdict:'approve',summary:'private-review',issues:[]}:{summary:'private-plan',tasks:[{id:'private-task',role:'worker',title:'private-title',instructions:'private-code',dependsOn:[]}]}};
 }});
 return {controller,calls,async run(input=config()){const started=controller.start(input);const result=await controller.wait(started.id);return {result,trace:()=>controller.trace(input.sessionId,started.id)};}};
}
test('opt-in trace records structural plan, role metadata, Jev versions, gates and actual check booleans without content',async()=>{
 const h=harness();try{const {result,trace}=await h.run();assert.equal(result.status,'completed');const log=trace(),text=JSON.stringify(log);
 for(const value of ['private-','user@example.invalid','sk-fixture','fixture-session','Fixture baseline'])assert.ok(!text.includes(value),value);
 assert.ok(log.events.some(e=>e.type==='plan'&&e.data.tasks[0].task===1));
 assert.ok(log.events.some(e=>e.type==='model_call'&&e.data.modelRef===1));
 assert.ok(log.events.some(e=>e.type==='verification'&&e.data.phase==='check'&&e.data.evidence.verified));
 const decisions=log.events.filter(e=>e.type==='jev'&&e.data.status==='completed');assert.equal(decisions.length,2);
 assert.equal(decisions[0].data.metadata.requestedModel,'jev-1.0.0');assert.equal(decisions[0].data.metadata.responseModel,'jev-1.0.0');assert.equal(decisions[0].data.metadata.usage.inputTokens,123);
 assert.equal(decisions[0].data.answers.security_sensitive.confidence,undefined);assert.equal(decisions[0].data.answers.lane.probabilities.small,1);
 assert.ok(log.events.some(e=>e.type==='branch'&&e.data.code==='completed'));
 assert.equal(replayExecutionTrace(log).matches,true);assert.equal(replayExecutionTrace(log).decisions.length,2);
 assert.equal(h.controller.trace('different-session',result.id),null);log.events.length=0;assert.ok(trace().events.length>0);
 }finally{await h.controller.dispose();}
});
test('trace disabled by default and no shadow creates no observer calls or changed primary results',async()=>{
 const h=harness({trace:false});try{const {result,trace}=await h.run();assert.equal(result.status,'completed');assert.equal(trace(),null);assert.equal(h.calls.length,5);}finally{await h.controller.dispose();}
});
test('shadow disagreement is recorded without changing main lane, branches, role calls or model choices',async()=>{
 const reference=harness(),shadow=harness({shadowJev:{mode:'fixture',async decide({phase}){return parseJevResponse(response(phase,{lane:'escalate',next:'needs_person',model:'jev-2.0.0'}),phase,{requestedModel:'jev-2.0.0'});}}});
 try{const baseline=await reference.run(),observed=await shadow.run();await shadow.controller.waitForShadow(observed.result.id);
 assert.equal(observed.result.status,baseline.result.status);assert.equal(observed.result.jev.lane,baseline.result.jev.lane);assert.deepEqual(observed.result.jev.decisions,baseline.result.jev.decisions);assert.deepEqual(shadow.calls,reference.calls);
 const replay=replayExecutionTrace(observed.trace());assert.equal(replay.matches,true);assert.equal(replay.decisions.filter(x=>x.source==='shadow').length,2);assert.equal(replay.decisions.find(x=>x.source==='shadow'&&x.phase==='step').decision.needsPerson,true);
 }finally{await reference.controller.dispose();await shadow.controller.dispose();}
});
test('shadow errors and independent call caps never fail or spend the primary budget',async()=>{
 let calls=0;const h=harness({maxShadowCalls:1,shadowJev:{mode:'fixture',async decide(){calls++;throw Error('private-api-token');}}});
 try{const {result,trace}=await h.run();await h.controller.waitForShadow(result.id);assert.equal(result.status,'completed');assert.equal(calls,1);const events=trace().events.filter(e=>e.type==='jev'&&e.data.source==='shadow');assert.ok(events.some(e=>e.data.status==='error'));assert.ok(events.some(e=>e.data.status==='skipped'));assert.ok(!JSON.stringify(events).includes('private-api-token'));assert.equal(replayExecutionTrace(trace()).matches,true);}finally{await h.controller.dispose();}
});
test('slow shadow does not delay primary completion; replay stays incomplete until observer settles',async()=>{
 let release;const h=harness({maxShadowCalls:1,shadowJev:{mode:'fixture',async decide({phase}){await new Promise(r=>release=r);return parseJevResponse(response(phase),phase);}}});
 try{const {result,trace}=await h.run();assert.equal(result.status,'completed');assert.throws(()=>replayExecutionTrace(trace()),/progress/);release();await h.controller.waitForShadow(result.id);assert.equal(replayExecutionTrace(trace()).matches,true);}finally{release?.();await h.controller.dispose();}
});
test('failed checks remain non-complete despite primary and shadow high confidence',async()=>{
 const deps=fixtureDependencies(),collect=deps.verifier.collect;deps.verifier.collect=async s=>s.phase==='check'?{...await collect(s),checksPassed:false,checksFailed:1,checks:[{id:'private-path',tail:'private-failure',passed:false,exitCode:1}]}:collect(s);
 const h=harness({verifier:deps.verifier,shadowJev:{mode:'fixture',async decide({phase}){return parseJevResponse(response(phase),phase);}}});
 try{const {result,trace}=await h.run();await h.controller.waitForShadow(result.id);assert.notEqual(result.status,'completed');const event=trace().events.find(e=>e.type==='verification'&&e.data.phase==='check');assert.equal(event.data.checks[0].exitCode,1);assert.equal(event.data.evidence.checksFailed,1);assert.ok(!JSON.stringify(trace()).includes('private-failure'));assert.equal(replayExecutionTrace(trace()).matches,true);}finally{await h.controller.dispose();}
});
test('replay detects changed decision, unsupported policy, raw fields, truncation and missing metadata inputs',async()=>{
 const h=harness();try{const run=await h.run(),trace=run.trace();const changed=structuredClone(trace);changed.events.find(e=>e.type==='jev'&&e.data.status==='completed').data.decision.lane='high';assert.equal(replayExecutionTrace(changed).matches,false);
 for(const mutate of [t=>t.policy='unknown',t=>t.extra='raw',t=>t.events[0].data.raw='secret',t=>t.events[0].seq=50,t=>t.events.find(e=>e.type==='jev'&&e.data.status==='completed').data.answers.lane.confidence=null]){const bad=structuredClone(trace);mutate(bad);assert.throws(()=>replayExecutionTrace(bad));}
 const bounded=createExecutionTrace({maxEvents:1});bounded.record('terminal',{status:'completed',raw:'secret'});bounded.record('terminal',{status:'completed'});assert.equal(bounded.snapshot().truncated,true);assert.ok(!JSON.stringify(bounded.snapshot()).includes('secret'));assert.throws(()=>replayExecutionTrace(bounded.snapshot()),/incomplete/);
 }finally{await h.controller.dispose();}
});
test('Jev model defaults stay legacy-compatible; explicit version and resolved model survive native adapter',async()=>{
 let requested;const body=response('classify',{model:'jev-1.2.3'}),fetchImpl=async(_url,init)=>{requested=JSON.parse(init.body).model;return Response.json(body);};
 const fake={resolveCredential:()=> 'FIXTURE_ONLY',fetchImpl};const spec={phase:'classify',goal:'synthetic',signal:new AbortController().signal};
 await createJevClient({credentialEnv:'FAKE_KEY'},fake).decide(spec);assert.equal(requested,'jev-latest');
 const pinned=await createJevClient({credentialEnv:'FAKE_KEY',model:'jev-1.2.3'},fake).decide(spec);assert.equal(requested,'jev-1.2.3');assert.equal(getJevMetadata(pinned).modelPolicy,'pinned');
 const setup={refresh:async()=>({keyConfigured:true,disclosureAccepted:true})},ctx={get:()=>({resolve:async()=>({value:'FIXTURE_ONLY'})})};
 const native=createHostJevClient(ctx,setup,{model:'jev-1.2.3',fetchImpl});const answer=await native.decide(spec);assert.equal(requested,'jev-1.2.3');assert.equal(getJevMetadata(answer).responseModel,'jev-1.2.3');assert.equal((await native.status()).requestedModel,'jev-1.2.3');assert.throws(()=>createJevClient({model:'invalid model'}),/版本/);
});
test('legacy response without model remains valid and unknown model telemetry is explicit rather than invented',()=>{
 const body=response('classify');delete body.model;const answers=parseJevResponse(body,'classify');assert.equal(answers.lane.choice,'small');assert.equal(getJevMetadata(answers).responseModel,undefined);
 const trace=createExecutionTrace();trace.record('jev',{phase:'classify',source:'primary',status:'error',metadata:{requestedModel:'jev-sk-PRIVATE-SECRET',responseModel:'private-source'}});const text=JSON.stringify(trace.snapshot());assert.ok(!text.includes('SECRET'));assert.ok(!text.includes('private-source'));
});
test('runtime exposes session-scoped opt-in traces and rejects shadow config before installing guards',async()=>{
 const host=teamHost(),runtime=createTeamRuntime(host.ctx,{jev:{trace:true}},fixtureDependencies());
 try{const context=runtime.snapshot('fixture-session').context;const started=await runtime.start({sessionId:'fixture-session',contextKey:context.contextKey,requestId:'trace-runtime-test',goal:'fixture',settings:settings()});await waitFor(()=>runtime.snapshot('fixture-session').snapshot?.finishedAt);
 assert.ok(runtime.trace({sessionId:'fixture-session',runId:started.snapshot.id}).events.length);assert.equal(runtime.trace({sessionId:'different-session',runId:started.snapshot.id}),null);
 }finally{await runtime.dispose();}
 const bad=teamHost();assert.throws(()=>createTeamRuntime(bad.ctx,{jev:{shadow:{enabled:true,model:'jev-latest'}}},fixtureDependencies()),/固定/);assert.equal(bad.globalGuards.length,0);
});
test('synthetic reference labels exercise six replay outcomes without implying measured accuracy',async()=>{
 const {readFile}=await import('node:fs/promises');const {stepDecision}=await import('../src/jev-client.js');const fixture=JSON.parse(await readFile(new URL('./fixtures/jev-evaluation-cases.json',import.meta.url),'utf8'));
 assert.equal(fixture.provenance,'synthetic-offline-fixture');assert.equal(fixture.realModelCalls,0);
 for(const item of fixture.cases){const data=response('step',{next:item.next});data.answers.implemented.noul=item.implemented;const answers=parseJevResponse(data,'step',{requestedModel:'jev-1.0.0'}),evidence={checksFailed:item.checksFailed,scopeOk:item.scopeOk,checksRun:true,diffEmpty:false,expectsChanges:true},context={lane:'medium',attempts:1,sameFailureRepeated:false};const decision=stepDecision(answers,evidence,context);assert.equal(decision.action,item.expectedAction,item.id);
 const trace=createExecutionTrace();trace.record('jev',{phase:'step',source:'primary',status:'completed',mode:'fixture',metadata:getJevMetadata(answers),answers,evidence,context,decision});trace.record('terminal',{status:'unverified'});assert.equal(replayExecutionTrace(trace.snapshot()).matches,true);}
});
test('shadow timeout includes refresh and ignored cancellation, and late results never rewrite trace',async()=>{
 for(const stage of ['refresh','decide']){let release,entered=false;const pending=()=>{entered=true;return new Promise(r=>release=r);};const shadow={mode:'fixture',...(stage==='refresh'?{refresh:pending}:{decide:pending}),...(stage==='refresh'?{decide:async()=>{throw Error('must not run after timeout');}}:{})};
 const h=harness({shadowTimeoutMs:20,maxShadowCalls:1,shadowJev:shadow});try{const {result,trace}=await h.run();await waitFor(()=>entered);await waitFor(()=>trace().events.some(e=>e.type==='jev'&&e.data.reasonCode==='timeout'));assert.equal(result.status,'completed');const settled=JSON.stringify(trace());release(parseJevResponse(response('classify'),'classify'));await new Promise(r=>setImmediate(r));assert.equal(JSON.stringify(trace()),settled);}finally{release?.();await h.controller.dispose();}}
});
test('dispose cancels observers of already completed runs even when adapter never settles',async()=>{
 let release;const h=harness({maxShadowCalls:1,shadowJev:{mode:'fixture',async decide(){return new Promise(r=>release=r);}}});const {result,trace}=await h.run();assert.equal(result.status,'completed');await h.controller.dispose();assert.equal(h.controller.shadowJobs.size,0);assert.ok(trace().events.some(e=>e.type==='jev'&&e.data.source==='shadow'&&e.data.status==='cancelled'));release();await new Promise(r=>setImmediate(r));
});
test('shadow concurrency is bounded across repeated completed sessions',async()=>{
 const resolvers=[];let calls=0;const h=harness({shadowJev:{mode:'fixture',async decide({phase}){calls++;await new Promise(r=>resolvers.push(r));return parseJevResponse(response(phase),phase);}}});try{
 const first=await h.run();const second=await h.run({...config(),sessionId:'second-session'});assert.equal(first.result.status,'completed');assert.equal(second.result.status,'completed');assert.equal(calls,2);assert.ok(second.trace().events.some(e=>e.type==='jev'&&e.data.reasonCode==='concurrency_limit'));resolvers.forEach(r=>r());await h.controller.waitForShadow(first.result.id);
 }finally{resolvers.forEach(r=>r());await h.controller.dispose();}
});
test('long pinned shadow IDs fail before runtime guard installation, and empty replay never claims agreement',()=>{
 const host=teamHost();assert.throws(()=>createTeamRuntime(host.ctx,{jev:{shadow:{enabled:true,model:`jev-${'1'.repeat(61)}.2.3`}}},fixtureDependencies()),/版本/);assert.equal(host.globalGuards.length,0);
 const trace=createExecutionTrace();trace.record('terminal',{status:'completed'});assert.equal(replayExecutionTrace(trace.snapshot()).matches,null);
});
test('replay rejects duplicate and nonterminal terminal markers',()=>{
 for(const status of ['started','error',null]){const trace=createExecutionTrace();trace.record('terminal',{status});assert.throws(()=>replayExecutionTrace(trace.snapshot()));}
 const duplicate=createExecutionTrace();duplicate.record('terminal',{status:'completed'});duplicate.record('terminal',{status:'completed'});assert.throws(()=>replayExecutionTrace(duplicate.snapshot()));
});
test('timed-out underlying requests retain global slots until settled, including controller replacement',async()=>{
 const release=[];let calls=0;const candidate={mode:'fixture',async decide(){calls++;await new Promise(r=>release.push(r));return {};}};
 const one=harness({shadowTimeoutMs:10,shadowJev:candidate}),two=harness({shadowTimeoutMs:10,shadowJev:candidate});try{
 const first=await one.run();await waitFor(()=>first.trace().events.filter(e=>e.type==='jev'&&e.data.reasonCode==='timeout').length===2);await one.controller.dispose();
 const second=await two.run();assert.equal(calls,2);assert.ok(second.trace().events.some(e=>e.type==='jev'&&e.data.reasonCode==='concurrency_limit'));
 }finally{release.forEach(r=>r());await new Promise(r=>setImmediate(r));await one.controller.dispose();await two.controller.dispose();}
});
test('failed primary Jev attempt is counted without exporting raw failure text',async()=>{
 const h=harness({jev:{mode:'fixture',preflight(){},async decide(){throw Error('private-first-call-error');}}});try{const {result,trace}=await h.run();assert.notEqual(result.status,'completed');const events=trace().events.filter(e=>e.type==='jev'&&e.data.source==='primary');assert.deepEqual(events.map(e=>e.data.status),['started','error']);assert.ok(!JSON.stringify(trace()).includes('private-first-call-error'));assert.equal(replayExecutionTrace(trace()).matches,null);}finally{await h.controller.dispose();}
});
