/** Deterministic combined acceptance harness; performs no HTTP or credential lookup. */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runVerifiedSyntheticProject} from '../test/helpers/verified-project.mjs';
import {replayExecutionTrace} from '../../src/execution-trace.js';
const reports=[];
const fixtureDefinitionSha256=createHash('sha256').update(await readFile(new URL('../test/helpers/verified-project.mjs',import.meta.url))).digest('hex');
for(const options of [{},{broken:true},{tamperSeal:true},{mockHttp:true}]){
 const run=await runVerifiedSyntheticProject(options);
 reports.push({...run,replay:replayExecutionTrace(run.trace)});
}
const expected=['completed','blocked','blocked','completed'];
const matched=reports.every((run,i)=>run.status===expected[i]);
console.log(JSON.stringify({mode:'integrated-offline-synthetic',fixtureDefinitionSha256,realModelCalls:0,realJevCalls:0,costRoutingImplemented:false,actualTaskAcceptance:'not-run',observedProductionAccuracy:null,cases:reports.length,passed:matched,reports},null,2));
if(!matched)process.exitCode=1;
