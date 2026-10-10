import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {BudgetLedger,openProjectLedger,callBudgetedModel} from './source/evaluation/src/budget.mjs';
import {preflight} from './source/evaluation/src/preflight.mjs';
import {runOffline,offlineConfigReport,runLivePreflight} from './source/evaluation/transport/run.mjs';
import {integrationFixture,fixtureJev,budget,contract} from './source/evaluation/test/helpers/integration-fixture.mjs';
import {runVerifiedSyntheticProject} from './source/evaluation/test/helpers/verified-project.mjs';
import {replayExecutionTrace} from './source/src/execution-trace.js';
const reports=[];
async function check(name,fn){const data=await fn();reports.push({name,passed:true,...data});console.log('PASS '+name);}
await check('delivered-config-and-live-blockers',async()=>{
 const config=JSON.parse(readFileSync(new URL('./source/evaluation/config/evaluation.example.json',import.meta.url)));
 const fixture=JSON.parse(readFileSync(new URL('./source/test/fixtures/jev-evaluation-cases.json',import.meta.url)));
 assert.equal(config.modelId,'gpt6-luna');
 assert.deepEqual([config.budget.projectTokenLimit,config.budget.pilotTokenLimit,config.budget.taskTokenLimit,config.budget.concurrency],[10000000,100000,20000,1]);
 const r=preflight(config,fixture);assert.equal(r.liveReady,false);assert.equal(r.configurationReady,false);assert(r.blockers.length>0);return {config:{modelId:config.modelId,...config.budget},preflight:r};
});
await check('default-offline-and-unverified-live-template',async()=>{
 const config=JSON.parse(readFileSync(new URL('./source/evaluation/transport/preflight.example.json',import.meta.url)));
 const r=await runOffline();assert.equal(r.networkRequests,0);assert.equal(r.simulatedHttpPosts,2);assert.equal(r.liveReady,false);
 const diagnostic=offlineConfigReport(config);assert.equal(diagnostic.configurationAccepted,false);assert.equal(diagnostic.liveReady,false);
 let touched=0;const fail=()=>{touched++;throw Error('MUST_NOT_TOUCH');};
 await assert.rejects(runLivePreflight(config,{readSecret:fail,fetchImpl:fail,openLedger:fail,openMeter:fail,write:fail}),{code:'preflight-contract-incomplete'});
 assert.equal(touched,0);return {offline:r,template:diagnostic,credentialAndTransportTouches:touched};
});
await check('insufficient-project-budget-blocks-before-transport',async()=>{
 const ledger=new BudgetLedger({projectId:'independent-cap',limit:99});let dispatches=0;
 await assert.rejects(callBudgetedModel({ledger,contract,request:{model:'gpt6-luna',messages:[{role:'user',content:'Public synthetic test'}]},reservation:{taskId:'task-1',batchId:'pilot',inputUpperBound:50,maxOutputTokens:50,taskLimit:99,batchLimit:99},transport:async()=>{dispatches++;return {usage:{prompt_tokens:1,completion_tokens:1}}}}),/project-budget-insufficient/);
 assert.equal(dispatches,0);assert.equal(ledger.snapshot().reserved,0);return {dispatches,snapshot:ledger.snapshot()};
});
await check('single-task-cap-is-shared-between-roles',async()=>{
 const h=integrationFixture({extra:{budget:{...budget,taskTokenLimit:2800}}});
 try{const r=await h.run();assert.notEqual(r.result.status,'completed');assert.equal(h.calls.length,2);assert.equal(r.summary.spentTokens,360);assert.equal(h.ledger.snapshot().tasks['task-1'].limit,2800);return {status:r.result.status,summary:r.summary,task:h.ledger.snapshot().tasks['task-1']};}finally{await h.controller.dispose();}
});
await check('unknown-usage-persists-full-reservation-and-lock',async()=>{
 const path=new URL('./reports/independent-unknown-model.json',import.meta.url).pathname;
 const store=openProjectLedger(path,{projectId:'independent-unknown'});let dispatches=0;
 await assert.rejects(callBudgetedModel({ledger:store.ledger,contract,request:{model:'gpt6-luna',messages:[{role:'user',content:'Public synthetic test'}]},reservation:{taskId:'task-1',batchId:'pilot',inputUpperBound:512,maxOutputTokens:2048,taskLimit:20000,batchLimit:100000},transport:async()=>{dispatches++;return {};}}),/missing-usage/);
 assert.equal(dispatches,1);assert.equal(store.ledger.snapshot().reserved,2560);assert.equal(store.ledger.snapshot().halted,'missing-usage');
 assert.throws(()=>store.close(),/unresolved-request-keeps-lock/);assert.throws(()=>openProjectLedger(path,{projectId:'independent-unknown'}),/project-ledger-locked/);
 const disk=JSON.parse(readFileSync(path));assert.equal(disk.reservations['request-1'].amount,2560);assert.equal(disk.halted,'missing-usage');return {dispatches,snapshot:store.ledger.snapshot(),lockRetained:true};
});
await check('main-and-opposing-shadow-stay-isolated-and-serial',async()=>{
 let active=0,maxActive=0;const order=[];
 function observed(client,kind){return {...client,async decide(spec){active++;maxActive=Math.max(maxActive,active);order.push(kind+':'+spec.phase);try{await new Promise(r=>setTimeout(r,5));return await client.decide(spec);}finally{active--;}}};}
 const main=observed(fixtureJev(),'main'),shadow=observed(fixtureJev({shadow:true}),'shadow');
 const h=integrationFixture({extra:{jev:main,shadowJev:shadow}});
 try{const r=await h.run();assert.equal(r.result.status,'completed');assert.equal(maxActive,1);assert.deepEqual(order,['main:classify','main:step','shadow:classify','shadow:step']);assert.equal(r.summary.spentTokens,900);assert.equal(r.summary.jev.calls,4);assert.equal(replayExecutionTrace(r.trace).matches,true);return {status:r.result.status,maxActive,order,summary:r.summary};}finally{await h.controller.dispose();}
});
for(const [name,options,status,checkCode] of [['normal-real-node-test',{},'completed',0],['failed-real-node-test',{broken:true},'blocked',1],['tamper-after-check-before-seal',{tamperSeal:true},'blocked',0],['mock-http-persistent-combination',{mockHttp:true},'completed',0]])await check(name,async()=>{
 const r=await runVerifiedSyntheticProject(options);assert.equal(r.status,status);const check=r.observations.find(x=>x.phase==='check');assert.deepEqual(check.checkExitCodes,[checkCode]);
 if(name==='normal-real-node-test'||options.mockHttp)assert.equal(r.observations.find(x=>x.phase==='seal').sealed,true);
 if(options.broken)assert.equal(r.observations.some(x=>x.phase==='seal'),false);
 if(options.tamperSeal)assert.equal(r.observations.find(x=>x.phase==='seal').runnerExit,1);
 if(options.mockHttp)assert.deepEqual(r.mockHttpPosts,{model:5,jev:4});
 assert.equal(replayExecutionTrace(r.trace).matches,true);assert.equal(r.realModelCalls,0);assert.equal(r.realJevCalls,0);
 return {case:r.case,status:r.status,observations:r.observations,summary:r.summary,mockHttpPosts:r.mockHttpPosts,trace:r.trace};
});
writeFileSync(new URL('./reports/independent-gates.json',import.meta.url),JSON.stringify({passed:reports.length,total:reports.length,realHttpRequests:0,reports},null,2)+'\n');
