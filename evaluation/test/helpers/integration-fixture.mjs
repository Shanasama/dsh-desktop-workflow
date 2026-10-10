import {BudgetLedger, JevMeter} from '../../src/budget.mjs';
import {createBudgetedTeamController} from '../../src/integration.mjs';
import {parseJevResponse} from '../../../src/jev-client.js';
import {fixtureDependencies, settings} from '../../../test/helpers/team-host.mjs';
export const contract = {usageFormat:'chat_completions', reasoningAccounting:'included_in_output', outputLimitParameter:'max_completion_tokens', outputLimitIncludesAllBillableOutput:true, verifiedForModelId:'gpt6-luna', inputUpperBoundMethod:'synthetic-response-fixture-only'};
export const budget = {taskTokenLimit:20_000,pilotTokenLimit:100_000,concurrency:1,maxOutputTokens:2048,maxModelAttemptsPerTask:2,maxRequestsPerTask:12,transportRetries:0};
const choice = (selected, keys) => ({type:'choice',choice:selected,confidence:1,probabilities:Object.fromEntries(keys.map(key=>[key,key===selected?1:0]))});
export function fixtureJev({shadow=false,call=()=>{},decide}={}) {
  return {mode:'fixture',requestedModel:shadow?'jev-2.0.0':'jev-1.0.0',preflight(){},async decide(spec){
    call(spec); if (decide) return decide(spec);
    const raw={model:shadow?'jev-2.0.0':'jev-1.0.0',usage:{input_tokens:31,output_tokens:7},answers:spec.phase==='classify'?{
      lane:choice(shadow?'high':'small',['small','medium','high','escalate','other']),security_sensitive:{type:'noul',noul:0},underspecified:{type:'noul',noul:0}
    }:{next:choice(shadow?'needs_person':'complete',['complete','continue','retry_differently','needs_stronger_model','needs_person','other']),implemented:{type:'noul',noul:1},in_scope:{type:'noul',noul:1}}};
    return parseJevResponse(raw,spec.phase,{requestedModel:this.requestedModel});
  }};
}
export function integrationFixture({shadow=false,verifier=fixtureDependencies().verifier,transport,decode,ledger=new BudgetLedger({projectId:'synthetic-combination'}),jevMeter=new JevMeter(),extra={}}={}) {
  const calls=[];
  const model={modelId:'gpt6-luna',contract,buildRequest:spec=>({model:'gpt6-luna',messages:[{role:'user',content:spec.prompt}]}),inputUpperBound:()=>512,
    transport:transport??(async request=>{calls.push(request);return {usage:{prompt_tokens:100,completion_tokens:80,total_tokens:180,completion_tokens_details:{reasoning_tokens:40}},private:'private-response-content'};}),
    decode:async(response,spec)=>{await decode?.(response,spec);return {stopReason:'completed',output:'private-output-content',structured:spec.role==='reviewer'?{verdict:'approve',summary:'private-review-content',issues:[]}:{summary:'private-plan-content',tasks:[{id:'synthetic-task',role:'worker',title:'private-task-content',instructions:'private-instructions-content',dependsOn:[]}]}};}};
  const controller=createBudgetedTeamController({ledger,jevMeter,model,jev:fixtureJev(),...(shadow?{shadowJev:fixtureJev({shadow:true})}:{}),verifier,taskId:'task-1',batchId:'pilot-1',budget,trace:true,...extra});
  const config={...settings(),sessionId:'private-session-content',goal:'private-goal-content',limits:{...settings().limits,concurrency:1,maxRounds:1}};
  for(const value of Object.values(config.roles)){value.model='gpt6-luna';value.maxTokens=2048;}
  return {controller,ledger,jevMeter,calls,config,async run(){const started=controller.start(config),result=await controller.wait(started.id);await controller.waitForShadow(started.id);return {result,trace:controller.trace(config.sessionId,started.id),summary:controller.evaluationSummary()};}};
}
