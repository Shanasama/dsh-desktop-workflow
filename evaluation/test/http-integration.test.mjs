import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createOpenAITransport,createTypeSafeDecisionClient,createTypeSafeTransport,decodeOpenAIText} from '../transport/index.mjs';
import {JevMeter,openJevMeter} from '../src/budget.mjs';
import {integrationFixture,contract} from './helpers/integration-fixture.mjs';
import {replayExecutionTrace} from '../../src/execution-trace.js';
const proof={...contract,evidence:'synthetic-fixture-only'};
const key=()=> 'public-synthetic-placeholder';
function httpJev(modelId,calls){
 return createTypeSafeDecisionClient({modelId,getCredential:key,fetchImpl:async(_url,init)=>{
  const body=JSON.parse(init.body);calls.push(body.model);
  const answers=Object.fromEntries(Object.entries(body.questions).map(([name,q])=>{
    if(q.type==='noul')return [name,{type:'noul',noul:['underspecified','security_sensitive'].includes(name)?0:1}];
    const selected=name==='lane'?'small':'complete';return [name,{type:'choice',choice:selected,confidence:1,probabilities:Object.fromEntries(Object.keys(q.criteria).map(k=>[k,k===selected?1:0]))}];
  }));
  return Response.json({model:modelId,usage:{input_tokens:11,output_tokens:3},answers});
 }});
}
test('HTTP adapters connect through controller, task budget, both Jev lanes, independent verifier and replay',async()=>{
 let modelPosts=0;const jevPosts=[];
 const transport=createOpenAITransport({contract:proof,endpointPath:'/v1/chat/completions',getCredential:key,fetchImpl:async()=>{
  modelPosts++;return Response.json({model:'gpt6-luna',usage:{prompt_tokens:100,completion_tokens:80,total_tokens:180,completion_tokens_details:{reasoning_tokens:40},prompt_tokens_details:{cached_tokens:10}},choices:[{finish_reason:'stop',message:{role:'assistant',content:'public-scripted-result'}}]});
 }});
 const h=integrationFixture({transport,decode:response=>assert.equal(decodeOpenAIText(response,'chat_completions'),'public-scripted-result'),extra:{jev:httpJev('jev-1.13.0',jevPosts),shadowJev:httpJev('jev-1.12.0',jevPosts)}});
 try{const run=await h.run();assert.equal(run.result.status,'completed');assert.equal(modelPosts,5);assert.deepEqual(jevPosts,['jev-1.13.0','jev-1.13.0','jev-1.12.0','jev-1.12.0']);assert.equal(run.summary.spentTokens,900);assert.equal(run.summary.jev.calls,4);assert.equal(run.summary.jev.inputTokens,44);assert.equal(replayExecutionTrace(run.trace).matches,true);assert(!JSON.stringify({trace:run.trace,summary:run.summary}).includes('private-'));}finally{await h.controller.dispose();}
});
test('HTTP model mismatch with known usage is charged once then blocks controller',async()=>{
 let posts=0,decodes=0;
 const transport=createOpenAITransport({contract:proof,endpointPath:'/v1/chat/completions',getCredential:key,fetchImpl:async()=>{posts++;return Response.json({model:'unapproved-response',usage:{prompt_tokens:100,completion_tokens:80,total_tokens:180}});}});
 const h=integrationFixture({transport,decode:()=>decodes++});try{const run=await h.run();assert.notEqual(run.result.status,'completed');assert.equal(posts,1);assert.equal(decodes,0);assert.equal(run.summary.spentTokens,180);assert.equal(run.summary.halted,'model-error-response');}finally{await h.controller.dispose();}
});
test('unsettled timed-out Jev HTTP keeps persistent active marker and lock; never overlaps another call',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'jev-http-unsettled-')),path=join(dir,'jev.json');let release;
 const store=openJevMeter(path);const transport=createTypeSafeTransport({getCredential:key,timeoutMs:10,fetchImpl:()=>new Promise(resolve=>release=resolve)});
 const payload={model:'jev-1.13.0',state:'public synthetic',questions:{ready:{type:'noul',instructions:'Ready?'}}};
 try{
  await assert.rejects(store.meter.call(()=>transport(payload,{attempts:1})),/jev-transport-unsettled/);
  assert.equal(store.meter.snapshot().active,1);assert.equal(store.meter.snapshot().calls,1);assert.equal(store.meter.snapshot().halted,'jev-transport-unsettled');
  await assert.rejects(store.meter.call(()=>assert.fail('must never overlap')),/halted/);assert.throws(()=>store.close(),/keeps-lock/);
  assert.equal(JSON.parse(readFileSync(path)).active,1);assert.throws(()=>openJevMeter(path),/locked/);
  release(Response.json({model:'jev-1.13.0',answers:{ready:{type:'noul',noul:1}},usage:{input_tokens:1,output_tokens:1}}));
  await new Promise(r=>setImmediate(r));assert.equal(store.meter.snapshot().halted,'jev-transport-unsettled');
 }finally{release?.(Response.json({}));rmSync(dir,{recursive:true,force:true});}
});

test('timed-out body cancellation never certifies cleanup from local read completion',async()=>{
 let cancelStarted=false;
 const stream=new ReadableStream({pull(){return new Promise(()=>{});},cancel(){cancelStarted=true;return new Promise(()=>{});}});
 const transport=createTypeSafeTransport({getCredential:key,timeoutMs:10,fetchImpl:async()=>new Response(stream,{headers:{'content-type':'application/json'}})});
 const meter=new JevMeter();
 await assert.rejects(meter.call(()=>transport({model:'jev-1.13.0',state:'public synthetic',questions:{ready:{type:'noul',instructions:'Ready?'}}},{attempts:1})),/jev-transport-unsettled/);
 assert.equal(cancelStarted,true);assert.equal(meter.snapshot().active,1);assert.equal(meter.snapshot().halted,'jev-transport-unsettled');
 await assert.rejects(meter.call(()=>assert.fail('must not overlap unresolved stream cleanup')),/halted/);
});

test('HTTP rejection before reader acquisition aborts and requests body cleanup without freeing Jev slot',async()=>{
 let cancelStarted=false,requestSignal;
 const stream=new ReadableStream({pull(){return new Promise(()=>{});},cancel(){cancelStarted=true;return new Promise(()=>{});}});
 const transport=createTypeSafeTransport({getCredential:key,fetchImpl:async(_url,init)=>{requestSignal=init.signal;return new Response(stream,{headers:{'content-type':'text/plain'}});}});
 const meter=new JevMeter();
 await assert.rejects(meter.call(()=>transport({model:'jev-1.13.0',state:'public synthetic',questions:{ready:{type:'noul',instructions:'Ready?'}}},{attempts:1})),/jev-transport-unsettled/);
 assert.equal(cancelStarted,true);assert.equal(requestSignal.aborted,true);assert.equal(meter.snapshot().active,1);assert.equal(meter.snapshot().halted,'jev-transport-unsettled');
});
