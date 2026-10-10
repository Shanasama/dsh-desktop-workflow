import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preflight} from '../src/preflight.mjs';
const config = JSON.parse(readFileSync(new URL('../config/evaluation.example.json', import.meta.url)));
const fixture = JSON.parse(readFileSync(new URL('../../test/fixtures/jev-evaluation-cases.json', import.meta.url)));
test('default is correct external model ID, accepted budget, no assumed credentials or live readiness', () => {
  const report = preflight(config, fixture);
  assert.equal(report.modelId, 'gpt6-luna');
  assert.equal(report.projectTokenLimit, 10_000_000); assert.equal(report.pilotTokenLimit, 100_000);
  assert.equal(report.liveReady, false); assert.equal(report.realModelCalls, 0);
  assert.equal(report.moneyLimit, null); assert.equal(report.evidence.actualVerification, 'not-run');
  assert.equal(report.evidence.observedProductionAccuracy, null);
  assert.equal(report.evidence.referenceCases, 6);
  assert(report.blockers.some(b => b.includes('fresh credential')));
});
test('even complete contract cannot claim actual API integration or model accuracy', () => {
  const complete = structuredClone(config);
  complete.credentialConfiguredByUser = true;
  complete.providerContract = {usageFormat: 'chat_completions', reasoningAccounting: 'included_in_output', inputUpperBoundMethod: 'verified-contract', outputLimitParameter: 'max_completion_tokens', outputLimitIncludesAllBillableOutput: true, verifiedForModelId: 'gpt6-luna', evidence: 'synthetic-test-only'};
  const report = preflight(complete, fixture);
  assert.equal(report.configurationReady, true); assert.equal(report.liveReady, false);
  assert.equal(report.evidence.falseAcceptRate, null); assert.equal(report.evidence.failureRecoveryRate, null);
});
test('budget overrun and implicit model upgrades are blocked', () => {
  const bad = structuredClone(config); bad.budget.projectTokenLimit = 10_000_001; bad.automaticUpgrade = true;
  const report = preflight(bad, fixture);
  assert(report.blockers.some(b => b.includes('10,000,000')));
  assert(report.blockers.some(b => b.includes('upgrade')));
});
