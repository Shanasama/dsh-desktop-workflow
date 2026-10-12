import {test} from 'node:test';import assert from 'node:assert/strict';import {createAutoVerifier} from '../src/auto-verification.js';
const result=payload=>({isError:false,value:{kind:'foreground',exitCode:0,signal:null,timedOut:false,aborted:false,stdout:{text:JSON.stringify({...payload,verified:true,project:{mode:'verified',reason:'Fixture',evidenceDirectory:payload.evidenceDirectory},baselineRef:{path:'fixture-only',digest:'fixture'}})},stderr:{text:''}}});
const payload=spec=>JSON.parse(Buffer.from(spec.arguments.command.match(/'([A-Za-z0-9+/=]+)'(?: \| ForEach-Object \{ \$_ \}; exit \$LASTEXITCODE)?$/)[1],'base64').toString('utf8'));
test('cleanup foreground failure still quarantines the project and reports cleanup, without retaining raw output',async()=>{const poisoned=[],diagnostics=[];const verifier=createAutoVerifier({poison:(id,d)=>poisoned.push({id,d}),onDiagnostic:(_id,d)=>diagnostics.push(d),executeTool:async(_id,spec)=>{const p=payload(spec),r=result(p);if(p.phase==='cleanup'){r.value.exitCode=1;r.value.stdout.text=JSON.stringify({...p,verified:false,reason:'FAKE_PRIVATE_PROJECT_BODY'});}return r;}});await verifier.collect({config:{sessionId:'fixture'},runId:'fixture',round:0,phase:'baseline',signal:new AbortController().signal});assert.equal((await verifier.release('fixture')).settled,false);assert.equal(poisoned.length,1);assert.equal(poisoned[0].d.phase,'cleanup');assert.equal(diagnostics[0].exitCode,1);assert.equal(JSON.stringify({poisoned,diagnostics}).includes('FAKE_PRIVATE'),false);});
test('known not-dispatched tool denial reports its phase without quarantining execution that never started',async()=>{const poisoned=[],diagnostics=[];const verifier=createAutoVerifier({poison:id=>poisoned.push(id),onDiagnostic:(_id,d)=>diagnostics.push(d),executeTool:async()=>({isError:true,verificationNotDispatched:true,error:{code:'UNKNOWN_TOOL',message:'FAKE_SECRET'}})});await assert.rejects(verifier.collect({config:{sessionId:'fixture'},runId:'fixture',round:0,phase:'baseline',signal:new AbortController().signal}),e=>e.code==='VERIFICATION_DENIED');assert.equal(poisoned.length,0);assert.equal(diagnostics[0].notDispatched,true);assert.equal(diagnostics[0].code,'UNKNOWN_TOOL');assert.equal(JSON.stringify(diagnostics).includes('FAKE_SECRET'),false);});

for(const failure of ['truncated','malformed','wrong-nonce','cancelled-result'])test(`unacknowledged persistent baseline ${failure} remains unsettled`,async()=>{
 const poisoned=[],calls=[];
 const verifier=createAutoVerifier({poison:(_id,d)=>poisoned.push(d),executeTool:async(_id,spec)=>{
  const p=payload(spec);calls.push(p);const r=result(p);
  if(failure==='truncated')r.value.stdout.truncated=true;
  if(failure==='malformed')r.value.stdout.text='not JSON';
  if(failure==='wrong-nonce')r.value.stdout.text=JSON.stringify({...p,nonce:'other',verified:true});
  if(failure==='cancelled-result')r.value.aborted=true;
  return r;
 }});
 await assert.rejects(verifier.collect({config:{sessionId:'fixture'},runId:failure,round:0,phase:'baseline',signal:new AbortController().signal}));
 assert.match(calls[0].evidenceDirectory,/^\.dsh-team-evidence-[a-f0-9]{32}$/);
 assert.ok(poisoned.length>0);assert.equal((await verifier.release(failure)).settled,false);
 assert.equal(calls.length,1,'no cleanup command is fabricated without an acknowledged digest');
});
test('known baseline pre-dispatch cancellation retains no artifact intent',async()=>{
 const poisoned=[];const verifier=createAutoVerifier({poison:id=>poisoned.push(id),executeTool:async()=>{throw Object.assign(new Error('cancelled before dispatch'),{code:'CANCELLED'});}});
 await assert.rejects(verifier.collect({config:{sessionId:'fixture'},runId:'not-dispatched',round:0,phase:'baseline',signal:new AbortController().signal}));
 assert.equal((await verifier.release('not-dispatched')).settled,true);assert.equal(poisoned.length,0);
});
