/** Local deterministic fixture evaluation. Never contacts a model or reads credentials. */
import {readFile} from 'node:fs/promises';
import {parseJevResponse,stepDecision,getJevMetadata} from '../src/jev-client.js';
import {createExecutionTrace,replayExecutionTrace} from '../src/execution-trace.js';
const fixture=JSON.parse(await readFile(new URL('../test/fixtures/jev-evaluation-cases.json',import.meta.url),'utf8'));
const options=['complete','continue','retry_differently','needs_stronger_model','needs_person','other'];
const cases=fixture.cases.map(item=>{
 const answers=parseJevResponse({model:'jev-1.0.0',answers:{next:{type:'choice',choice:item.next,confidence:1,probabilities:Object.fromEntries(options.map(key=>[key,key===item.next?1:0]))},implemented:{type:'noul',noul:item.implemented},in_scope:{type:'noul',noul:1}}},'step',{requestedModel:'jev-1.0.0'});
 const evidence={checksFailed:item.checksFailed,scopeOk:item.scopeOk,checksRun:true,diffEmpty:false,expectsChanges:true},context={lane:'medium',attempts:1,sameFailureRepeated:false};
 const decision=stepDecision(answers,evidence,context),trace=createExecutionTrace();
 trace.record('jev',{phase:'step',round:1,source:'primary',status:'completed',mode:'fixture',metadata:getJevMetadata(answers),answers,evidence,context,decision});trace.record('terminal',{status:'unverified'});
 return {case:item.id,expectedAction:item.expectedAction,actualAction:decision.action,fixturePassed:decision.action===item.expectedAction,replay:replayExecutionTrace(trace.snapshot()),trace:trace.snapshot()};
});
console.log(JSON.stringify({provenance:fixture.provenance,realModelCalls:0,routingEnabled:false,observedProductionAccuracy:null,fixtureChecks:cases.length,fixtureChecksPassed:cases.filter(c=>c.fixturePassed).length,cases},null,2));
if(cases.some(c=>!c.fixturePassed))process.exitCode=1;
