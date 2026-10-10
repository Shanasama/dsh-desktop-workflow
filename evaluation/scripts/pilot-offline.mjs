/** Exercises scheduling with scripted responses only. It cannot make network calls. */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {BudgetLedger, callBudgetedModel, JevMeter} from '../src/budget.mjs';
import {parseJevResponse, stepDecision} from '../../src/jev-client.js';
const raw = await readFile(new URL('../../test/fixtures/jev-evaluation-cases.json', import.meta.url), 'utf8');
const fixture = JSON.parse(raw);
if (fixture.provenance !== 'synthetic-offline-fixture' || fixture.realModelCalls !== 0) throw new Error('not-public-synthetic-fixture');
const ledger = new BudgetLedger({projectId: 'synthetic-budget-demo', limit: 100_000});
const jev = new JevMeter({maxCalls: 30});
const options = ['complete', 'continue', 'retry_differently', 'needs_stronger_model', 'needs_person', 'other'];
const results = [];
for (const item of fixture.cases) {
  const model = await callBudgetedModel({
    ledger,
    reservation: {taskId: item.id, batchId: 'offline-pilot', inputUpperBound: 512, maxOutputTokens: 512, taskLimit: 20_000, batchLimit: 100_000},
    contract: {usageFormat: 'chat_completions', reasoningAccounting: 'included_in_output', outputLimitParameter: 'max_completion_tokens', outputLimitIncludesAllBillableOutput: true, verifiedForModelId: 'scripted-fixture', inputUpperBoundMethod: 'scripted-fixture-count'},
    request: {model: 'scripted-fixture', messages: [{role: 'user', content: `Synthetic case ${item.id}`} ]},
    transport: async () => ({usage: {prompt_tokens: 128, completion_tokens: 128, total_tokens: 256, completion_tokens_details: {reasoning_tokens: 64}}, result: 'scripted-response-only'}),
  });
  const response = await jev.call(async () => ({model: 'jev-synthetic-only', usage: {input_tokens: 128, output_tokens: 64}, answers: {next: {type: 'choice', choice: item.next, confidence: 1, probabilities: Object.fromEntries(options.map(key => [key, key === item.next ? 1 : 0]))}, implemented: {type: 'noul', noul: item.implemented}, in_scope: {type: 'noul', noul: 1}}}));
  const answers = parseJevResponse(response, 'step', {requestedModel: 'jev-synthetic-only'});
  const decision = stepDecision(answers, {checksFailed: item.checksFailed, scopeOk: item.scopeOk, checksRun: true, diffEmpty: false, expectsChanges: true}, {lane: 'medium', attempts: 1, sameFailureRepeated: false});
  results.push({case: item.id, source: 'authored-synthetic-reference', expectedAction: item.expectedAction, actualCodeAction: decision.action, referenceMatched: decision.action === item.expectedAction, simulatedBillableTokens: model.counted.total, actualVerification: 'not-run'});
}
const snapshot = ledger.snapshot();
console.log(JSON.stringify({
  mode: 'scripted-offline-pilot', realModelCalls: 0, realJevCalls: 0,
  fixtureSha256: createHash('sha256').update(raw).digest('hex'),
  syntheticReferenceChecks: results.length, syntheticReferenceMatches: results.filter(r => r.referenceMatched).length,
  simulatedBudget: {spentTokens: snapshot.spent, reservedTokens: snapshot.reserved, remainingTokens: snapshot.remaining},
  simulatedJev: jev.snapshot(),
  actualVerification: 'not-run', observedProductionAccuracy: null,
  effectiveCompletionRate: null, failureRecoveryRate: null, falseAcceptRate: null, unnecessaryReworkRate: null,
  cases: results,
}, null, 2));
if (results.some(r => !r.referenceMatched)) process.exitCode = 1;
