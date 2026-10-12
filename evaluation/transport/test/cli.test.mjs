import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {readFileSync} from 'node:fs';
import {BudgetLedger, JevMeter, prepareModelRequest} from '../../src/budget.mjs';
import {hiddenInput} from '../terminal.mjs';
import {runOffline, offlineConfigReport, validatePreflightConfig, syntheticRequest, requestHash, runLivePreflight, main} from '../run.mjs';
import {TransportError} from '../http.mjs';
const config = JSON.parse(readFileSync(new URL('../preflight.example.json', import.meta.url)));
function validSyntheticConfig() {
  const c = {...config, endpointPath: '/v1/chat/completions', inputUpperBoundTokens: 100,
    providerContract: {usageFormat: 'chat_completions', reasoningAccounting: 'included_in_output', inputUpperBoundMethod: 'A test-double supplies this attestation; never used with real HTTP.', outputLimitParameter: 'max_completion_tokens', outputLimitIncludesAllBillableOutput: true, verifiedForModelId: 'gpt6-luna', evidence: 'test-double-proof-for-injected-fetch-only'}};
  c.requestSha256 = requestHash(prepareModelRequest(syntheticRequest(c), {maxOutputTokens: c.maxOutputTokens}, c.providerContract));
  return c;
}
class FakeTTY extends EventEmitter {
  isTTY = true; isRaw = false; paused = true;
  setRawMode(raw) { this.isRaw = raw; }
  isPaused() { return this.paused; }
  resume() { this.paused = false; }
  pause() { this.paused = true; }
}
function terminal() { const input = new FakeTTY(), writes = []; return {input, writes, output: {isTTY: true, write: x => writes.push(x)}}; }
test('offline entry performs two mocked posts without network or credentials', async () => {
  const r = await runOffline(); assert.equal(r.networkRequests, 0); assert.equal(r.simulatedHttpPosts, 2); assert.equal(r.simulatedModelUsage.total, 28); assert.equal(r.liveReady, false);
});
test('template blocks live before credentials, prompts, HTTP or durable writes', async () => {
  let touches = 0;
  await assert.rejects(runLivePreflight(config, {readSecret: () => touches++, fetchImpl: () => touches++, openLedger: () => touches++, openMeter: () => touches++, write: () => touches++}), {code: 'preflight-contract-incomplete'});
  assert.equal(touches, 0);
  const report = offlineConfigReport(config); assert.equal(report.liveReady, false); assert.equal(report.configurationAccepted, false); assert.equal(report.credentialsRead, false);
});
test('input-bound attestation is tied to exact final request digest', () => {
  const c = validSyntheticConfig(); assert.equal(validatePreflightConfig(c).max_completion_tokens, 128);
  assert.throws(() => validatePreflightConfig({...c, maxOutputTokens: 127}), {code: 'input-bound-not-tied-to-final-request'});
  assert.throws(() => validatePreflightConfig({...c, providerContract: {...c.providerContract, evidence: 'synthetic fixture only'}}), {code: 'synthetic-evidence-is-not-provider-proof'});
});
test('ambiguous modes and key-like CLI flags fail without echoing arguments', async () => {
  for (const argv of [['--offline', '--live-preflight'], ['--live-preflight', '--offline'], ['--api-key', 'public-synthetic-placeholder']]) await assert.rejects(main(argv), {code: 'invalid-cli-arguments'});
});
test('credential prompt refuses pipes, no echo fallback', () => {
  assert.throws(() => hiddenInput('Key:', {input: {isTTY: false}, output: {isTTY: false}}), {code: 'interactive-terminal-required'});
});
test('hidden TTY entry never echoes input, restores raw state, removes listeners', async () => {
  const tty = terminal(); const pending = hiddenInput('Key:', tty);
  tty.input.emit('data', Buffer.from('public-synthetic-placeholder\r'));
  assert.equal(await pending, 'public-synthetic-placeholder');
  assert.deepEqual(tty.writes, ['Key:', '\n']); assert.equal(tty.input.isRaw, false); assert.equal(tty.input.paused, true); assert.equal(tty.input.listenerCount('data'), 0);
});
test('backspace works without echo and Ctrl-C rejects safely', async () => {
  const tty = terminal(); const pending = hiddenInput('Key:', tty);
  tty.input.emit('data', Buffer.from('xy\x7fz\r')); assert.equal(await pending, 'xz');
  const pending2 = hiddenInput('Key:', tty); tty.input.emit('data', Buffer.from('\x03'));
  await assert.rejects(pending2, {code: 'user-cancelled'}); assert.equal(tty.input.isRaw, false);
});
test('multiline paste cannot answer later confirmation or partially transmit a key', async () => {
  const tty = terminal(); const pending = hiddenInput('Key:', tty);
  tty.input.emit('data', Buffer.from('public-synthetic-placeholder\nSEND\n'));
  await assert.rejects(pending, {code: 'multiline-input-refused'}); assert.deepEqual(tty.writes, ['Key:', '\n']);
});
function fixtureDependencies({confirmation = 'SEND', unknownUsage = false} = {}) {
  let calls = 0; const prompts = [], writes = [];
  const ledger = new BudgetLedger({projectId: config.projectId}), meter = new JevMeter({maxCalls: 30, maxAttempts: 2});
  const deps = {
    write: value => writes.push(value),
    readSecret: async label => { prompts.push(label); return prompts.length === 3 ? confirmation : 'public-synthetic-placeholder'; },
    openLedger: () => ({ledger, close() { ledger.close(); }}),
    openMeter: () => ({meter, close() { meter.close(); }}),
    fetchImpl: async (url, init) => {
      calls++;
      assert.equal(prompts.length, 3); assert.equal(init.redirect, 'error');
      assert.equal(init.headers.Authorization, 'Bearer public-synthetic-placeholder');
      if (url.startsWith('https://api.typesafe.ai/')) return Response.json({model: 'jev-1.13.0', usage: {input_tokens: 10, output_tokens: 2}, answers: {ready: {type: 'noul', noul: 0.99}}});
      assert.equal(url, 'https://api.aiuzh.icu/v1/chat/completions');
      return Response.json({model: 'gpt6-luna', usage: unknownUsage ? undefined : {prompt_tokens: 10, completion_tokens: 8, total_tokens: 18}, choices: [{finish_reason: 'stop', message: {role: 'assistant', content: 'READY'}}]});
    },
  };
  return {deps, ledger, meter, prompts, writes, calls: () => calls};
}
test('fully simulated user-entry path requires SEND before two bounded posts and returns no key/output', async () => {
  const f = fixtureDependencies(); const result = await runLivePreflight(validSyntheticConfig(), f.deps);
  assert.equal(f.calls(), 2); assert.equal(result.outputMatchesFixture, true); assert.equal(result.projectSpentTokens, 18); assert.equal(result.providerContractProvedByThisCall, false);
  assert.equal(JSON.stringify(result).includes('public-synthetic-placeholder'), false);
  assert.equal(f.writes.join('').includes('public-synthetic-placeholder'), false);
});
test('user cancellation never transmits either synthetic credential', async () => {
  const f = fixtureDependencies({confirmation: 'NO'});
  await assert.rejects(runLivePreflight(validSyntheticConfig(), f.deps), {code: 'user-cancelled'}); assert.equal(f.calls(), 0);
});
test('mocked preflight unknown usage retains reservation and halt; no automatic retry', async () => {
  const f = fixtureDependencies({unknownUsage: true});
  await assert.rejects(runLivePreflight(validSyntheticConfig(), f.deps), /^Error: transport-error-usage-unknown$/);
  assert.equal(f.calls(), 2); assert.equal(f.ledger.snapshot().reserved, 228); assert.equal(f.meter.snapshot().calls, 1);
});
test('error constructor never accepts untrusted error text as a public code', () => {
  const error = new TransportError('public-synthetic-placeholder'); assert.equal(error.code, 'http-request-failed');
});

test('interrupt while entering a key restores terminal and removes listeners', async () => {
  const tty = terminal(), c = new AbortController();
  const pending = hiddenInput('Key:', {...tty, signal: c.signal});
  tty.input.emit('data', Buffer.from('public-synthetic-placeholder')); c.abort();
  await assert.rejects(pending, {code: 'user-cancelled'});
  assert.equal(tty.input.isRaw, false); assert.equal(tty.input.listenerCount('data'), 0);
  assert.deepEqual(tty.writes, ['Key:', '\n']);
});

test('missing pinned fields are not filled silently in a live configuration', () => {
  const c = validSyntheticConfig();
  for (const name of ['baseUrl', 'modelId']) { const incomplete = {...c}; delete incomplete[name]; assert.throws(() => validatePreflightConfig(incomplete), {code: 'preflight-contract-incomplete'}); }
  assert.throws(() => validatePreflightConfig({...c, providerContract: {...c.providerContract, apiKey: 'public-synthetic-placeholder'}}), {code: 'invalid-preflight-config'});
});
test('exhausted preflight attempt cap blocks before asking for keys or a TypeSafe call', async () => {
  const f = fixtureDependencies(), c = validSyntheticConfig();
  for (let i = 0; i < 2; i++) {
    const id = f.ledger.reserve({taskId: 'http-preflight', batchId: 'pilot', inputUpperBound: 100, maxOutputTokens: 128, taskLimit: 20_000, batchLimit: 100_000, maxAttemptsPerTask: 2});
    f.ledger.settle(id, {prompt_tokens: 10, completion_tokens: 8, total_tokens: 18}, c.providerContract);
  }
  await assert.rejects(runLivePreflight(c, f.deps), {code: 'shared-ledger-preflight-blocked'});
  assert.equal(f.prompts.length, 0); assert.equal(f.calls(), 0);
});
