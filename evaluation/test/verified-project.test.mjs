import test from 'node:test';
import assert from 'node:assert/strict';
import {runVerifiedSyntheticProject} from './helpers/verified-project.mjs';
import {replayExecutionTrace} from '../../src/execution-trace.js';
test('combined flow completes only after actual independent test subprocess and final seal',async()=>{
 const result=await runVerifiedSyntheticProject();assert.equal(result.status,'completed');
 assert.deepEqual(result.observations.map(x=>x.phase),['baseline','check','seal']);assert.deepEqual(result.observations[1].checkExitCodes,[0]);assert.equal(result.observations[2].sealed,true);
 assert.equal(result.summary.modelPhysicalCalls,5);assert.equal(result.summary.jev.calls,4);assert.equal(replayExecutionTrace(result.trace).matches,true);
 assert.equal(result.realModelCalls,0);assert.equal(result.actualTaskAcceptance,'not-run');
});
test('actual nonzero check exit defeats confident primary and opposing shadow judgments',async()=>{
 const result=await runVerifiedSyntheticProject({broken:true});assert.notEqual(result.status,'completed');
 assert.deepEqual(result.observations[1].checkExitCodes,[1]);assert(!result.observations.some(x=>x.phase==='seal'));assert.equal(replayExecutionTrace(result.trace).matches,true);
});
test('changing the synthetic project after checks makes final seal reject completion',async()=>{
 const result=await runVerifiedSyntheticProject({tamperSeal:true});assert.notEqual(result.status,'completed');assert.equal(result.observations[1].checksPassed,true);assert.equal(result.observations[2].runnerExit,1);
});

test('full mock HTTP flow uses persistent budgets, real independent subprocess checks and final seal',async()=>{
 const result=await runVerifiedSyntheticProject({mockHttp:true});assert.equal(result.status,'completed');assert.equal(result.persistentLedgersUsed,true);
 assert.deepEqual(result.mockHttpPosts,{model:5,jev:4});assert.deepEqual(result.observations.map(x=>x.phase),['baseline','check','seal']);assert.equal(result.observations[2].sealed,true);assert.equal(result.summary.spentTokens,900);assert.equal(result.realModelCalls,0);assert.equal(replayExecutionTrace(result.trace).matches,true);
});
