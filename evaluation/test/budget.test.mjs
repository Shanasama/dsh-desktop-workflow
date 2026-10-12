import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {BudgetLedger, JevMeter, normalizeUsage, openProjectLedger, callBudgetedModel} from '../src/budget.mjs';
const contract = {usageFormat: 'chat_completions', reasoningAccounting: 'included_in_output', outputLimitParameter: 'max_completion_tokens', outputLimitIncludesAllBillableOutput: true, verifiedForModelId: 'synthetic-model', inputUpperBoundMethod: 'synthetic-exact-test-count'};
const reservation = {taskId: 'task-a', batchId: 'pilot-a', inputUpperBound: 20, maxOutputTokens: 30, taskLimit: 100, batchLimit: 200};
const newLedger = options => new BudgetLedger({projectId: 'test-project', limit: 200, ...options});
const invoke = (ledger, transport, extra = {}) => callBudgetedModel({ledger, reservation, contract, request: {model: 'synthetic-model', messages: [], max_tokens: 99999}, transport, ...extra});
const usage = (input = 10, output = 15) => ({prompt_tokens: input, completion_tokens: output, total_tokens: input + output});

test('input/output, reasoning and cached details are each counted once', () => {
  assert.deepEqual(normalizeUsage({...usage(100, 80), prompt_tokens_details: {cached_tokens: 70}, completion_tokens_details: {reasoning_tokens: 60}}, contract), {input: 100, output: 80, reasoning: 60, billedOutput: 80, total: 180});
});
test('Responses API fields use the same no-double-count rule', () => {
  const result = normalizeUsage({input_tokens: 100, output_tokens: 80, total_tokens: 180, output_tokens_details: {reasoning_tokens: 60}}, {...contract, usageFormat: 'responses'});
  assert.equal(result.total, 180);
});
test('explicit provider contract can include additional billable reasoning exactly once', () => {
  const result = normalizeUsage({prompt_tokens: 100, completion_tokens: 20, completion_tokens_details: {reasoning_tokens: 60}, total_tokens: 180}, {...contract, reasoningAccounting: 'additional_to_output'});
  assert.equal(result.billedOutput, 80); assert.equal(result.total, 180);
});
for (const [name, value, c = contract] of [
  ['missing usage', undefined], ['missing output', {prompt_tokens: 1}], ['negative', usage(-1, 1)],
  ['fraction', usage(1.1, 2)], ['unsafe integer', usage(Number.MAX_SAFE_INTEGER, 10)],
  ['inconsistent total', {...usage(), total_tokens: 50}], ['reasoning exceeds output', {...usage(), completion_tokens_details: {reasoning_tokens: 20}}],
  ['cached exceeds input', {...usage(), prompt_tokens_details: {cached_tokens: 20}}],
  ['additional reasoning absent', usage(), {...contract, reasoningAccounting: 'additional_to_output'}],
  ['unknown accounting', usage(), {...contract, reasoningAccounting: null}],
]) test(`reject ${name}`, () => assert.throws(() => normalizeUsage(value, c)));

test('reserve whole input and output before sending, release only known unused balance', async () => {
  const ledger = newLedger();
  const result = await invoke(ledger, async (request, options) => {
    assert.equal(ledger.snapshot().reserved, 50);
    assert.equal(request.max_completion_tokens, 30); assert.equal(request.max_tokens, undefined);
    assert.equal(request.stream, false); assert.deepEqual(options, {attempts: 1});
    return {usage: usage()};
  });
  assert.equal(result.counted.total, 25);
  assert.equal(ledger.snapshot().spent, 25); assert.equal(ledger.snapshot().reserved, 0);
});
test('no transport call when project budget cannot reserve the full output', async () => {
  const ledger = newLedger({limit: 40}); let calls = 0;
  await assert.rejects(invoke(ledger, () => { calls++; }, {reservation: {...reservation, taskLimit: 40, batchLimit: 40}}), /project-budget-insufficient/);
  assert.equal(calls, 0); assert.equal(ledger.snapshot().spent, 0);
});
test('concurrent reservations cannot oversubscribe remaining project tokens', async () => {
  const ledger = newLedger({limit: 70, concurrency: 2}); let resolve, calls = 0;
  const first = invoke(ledger, () => { calls++; return new Promise(r => { resolve = r; }); }, {reservation: {...reservation, taskLimit: 70, batchLimit: 70}});
  await assert.rejects(invoke(ledger, () => { calls++; }, {reservation: {...reservation, taskId: 'task-b', taskLimit: 70, batchLimit: 70}}), /project-budget-insufficient/);
  assert.equal(calls, 1); resolve({usage: usage()}); await first;
});
test('configured concurrency prevents an extra physical request', async () => {
  const ledger = newLedger(); let resolve;
  const first = invoke(ledger, () => new Promise(r => { resolve = r; }));
  await assert.rejects(invoke(ledger, () => assert.fail('must not send')), /model-concurrency-limit/);
  resolve({usage: usage()}); await first;
});
test('task and batch budgets span attempts', () => {
  const ledger = newLedger();
  let id = ledger.reserve({...reservation, taskLimit: 50}); ledger.settle(id, usage(20, 30), contract);
  assert.throws(() => ledger.reserve({...reservation, taskLimit: 50}), /taskId-budget-insufficient/);
  const other = newLedger();
  id = other.reserve({...reservation, taskLimit: 50, batchLimit: 50}); other.settle(id, usage(20, 30), contract);
  assert.throws(() => other.reserve({...reservation, taskId: 'task-b', taskLimit: 50, batchLimit: 50}), /batchId-budget-insufficient/);
});
test('model repair attempt cap is separate from disabled transport retries', async () => {
  const ledger = newLedger();
  await invoke(ledger, async () => ({usage: usage(1, 1)}));
  await invoke(ledger, async () => ({usage: usage(1, 1)}));
  await assert.rejects(invoke(ledger, () => assert.fail('must not send')), /model-task-attempt-limit/);
});
test('unknown usage halts all further calls and retains full reservation', async () => {
  const ledger = newLedger();
  await assert.rejects(invoke(ledger, async () => ({})), /missing-usage/);
  assert.equal(ledger.snapshot().reserved, 50); assert.equal(ledger.snapshot().spent, 0);
  await assert.rejects(invoke(ledger, () => assert.fail('must not retry')), /budget-halted/);
});
test('network errors are not retried, and errors never leak transport text', async () => {
  const ledger = newLedger(); let calls = 0;
  await assert.rejects(invoke(ledger, async () => { calls++; throw new Error('DO NOT EXPOSE RAW TRANSPORT'); }), /^Error: transport-error-usage-unknown$/);
  assert.equal(calls, 1); assert.equal(ledger.snapshot().reserved, 50);
});
test('provider errors with known usage are counted, then halt', async () => {
  const ledger = newLedger();
  await assert.rejects(invoke(ledger, async () => ({usage: usage(), error: {message: 'raw'}})), /model-error-response/);
  assert.equal(ledger.snapshot().spent, 25); assert.equal(ledger.snapshot().halted, 'model-error-response');
});
test('provider-bound breach records actual tokens and stops rather than hiding overrun', async () => {
  const ledger = newLedger();
  await assert.rejects(invoke(ledger, async () => ({usage: usage(100, 150)})), /provider-exceeded-reservation/);
  assert.equal(ledger.snapshot().spent, 250); assert.equal(ledger.snapshot().remaining, 0);
});
test('invalid/unverified contract cannot send', async () => {
  const ledger = newLedger();
  for (const bad of [{verifiedForModelId: 'different'}, {inputUpperBoundMethod: null}, {outputLimitIncludesAllBillableOutput: false}, {reasoningAccounting: null}]) {
    await assert.rejects(invoke(ledger, () => assert.fail('must not send'), {contract: {...contract, ...bad}}));
  }
  assert.equal(ledger.snapshot().reserved, 0);
});
test('global hard cap cannot be raised', () => assert.throws(() => newLedger({limit: 10_000_001}), /hard-cap-exceeded/));
test('ledger write failure blocks transport', async () => {
  let writes = 0;
  const ledger = newLedger({save() { if (++writes > 1) throw new Error('disk'); }});
  await assert.rejects(invoke(ledger, () => assert.fail('must not send')), /ledger-write-failed/);
  assert.equal(ledger.snapshot().halted, 'ledger-write-failed');
});
test('durable totals survive a later batch and second process is locked out', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'jev-budget-test-')), path = join(dir, 'budget.json');
  try {
    let store = openProjectLedger(path, {projectId: 'test-project', limit: 200});
    assert.throws(() => openProjectLedger(path, {projectId: 'test-project', limit: 200}), /project-ledger-locked/);
    await invoke(store.ledger, async () => ({usage: usage()})); store.close();
    store = openProjectLedger(path, {projectId: 'test-project', limit: 200});
    assert.equal(store.ledger.snapshot().spent, 25);
    await invoke(store.ledger, async () => ({usage: usage()}), {reservation: {...reservation, batchId: 'pilot-b'}});
    assert.equal(JSON.parse(readFileSync(path, 'utf8')).spent, 50); store.close();
  } finally { rmSync(dir, {recursive: true, force: true}); }
});
test('unresolved prior reservation never becomes free budget after restart', () => {
  const ledger = newLedger(); ledger.reserve(reservation);
  const resumed = newLedger({state: ledger.snapshot()});
  assert.equal(resumed.snapshot().halted, 'unresolved-previous-request');
  assert.equal(resumed.snapshot().reserved, 50);
  assert.throws(() => resumed.reserve(reservation), /budget-halted/);
});
test('corrupt ledger is rejected rather than reset to zero', () => {
  const dir = mkdtempSync(join(tmpdir(), 'jev-budget-test-')), path = join(dir, 'budget.json');
  try {
    writeFileSync(path, '{invalid');
    assert.throws(() => openProjectLedger(path, {projectId: 'test-project', limit: 200}), /invalid-project-ledger/);
  } finally { rmSync(dir, {recursive: true, force: true}); }
});
test('stored negative or inconsistent totals fail closed', () => {
  const state = newLedger().snapshot(); state.spent = -1;
  assert.throws(() => newLedger({state}), /invalid-spent/);
  state.spent = 1;
  assert.throws(() => newLedger({state}), /ledger-totals-mismatch/);
});
test('Jev usage is separate, two attempts maximum, retry counts physical calls', async () => {
  const jev = new JevMeter(); let calls = 0;
  await jev.call(async () => { if (++calls === 1) throw {retryable: true}; return {usage: {input_tokens: 12, output_tokens: 3}}; });
  assert.deepEqual(jev.snapshot(), {calls: 2, failures: 1, retries: 1, inputTokens: 12, outputTokens: 3, unknownUsageCalls: 1, active: 0});
  await assert.rejects(jev.call(async () => { calls++; throw {retryable: true}; }), /jev-request-failed/);
  assert.equal(calls, 4);
});
test('Jev call cap and concurrency are enforced even though its tokens are uncapped', async () => {
  const jev = new JevMeter({maxCalls: 1}); let resolve;
  const pending = jev.call(() => new Promise(r => { resolve = r; }));
  await assert.rejects(jev.call(() => assert.fail('must not send')), /jev-concurrency-limit/);
  resolve({}); await pending;
  await assert.rejects(jev.call(() => assert.fail('must not send')), /jev-call-limit/);
  assert.equal(jev.snapshot().unknownUsageCalls, 1);
});
test('closed handle cannot bypass project lock or send after a new process opens it', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'jev-budget-test-')), path = join(dir, 'budget.json');
  try {
    const first = openProjectLedger(path, {projectId: 'test-project', limit: 200}); first.close();
    const second = openProjectLedger(path, {projectId: 'test-project', limit: 200});
    await assert.rejects(invoke(first.ledger, () => assert.fail('must not send')), /ledger-closed/);
    await invoke(second.ledger, async () => ({usage: usage()})); second.close();
  } finally { rmSync(dir, {recursive: true, force: true}); }
});
test('stop cannot erase a halt and attempt limits cannot grow after a task starts', async () => {
  const ledger = newLedger(); ledger.stop('halted');
  assert.throws(() => ledger.stop(null), /invalid-stop-reason/);
  assert.equal(ledger.snapshot().halted, 'halted');
  const other = newLedger();
  await invoke(other, async () => ({usage: usage()}), {reservation: {...reservation, maxAttemptsPerTask: 1}});
  await assert.rejects(invoke(other, () => assert.fail('must not send')), /task-attempt-limit-change/);
});
test('multi-completion and server-side tool/background features cannot exceed a single-call reservation', async () => {
  const ledger = newLedger();
  for (const fields of [{n: 2}, {best_of: 5}, {tools: []}, {previous_response_id: 'prior'}, {background: true}]) {
    await assert.rejects(invoke(ledger, () => assert.fail('must not send'), {request: {model: 'synthetic-model', messages: [], ...fields}}));
  }
  assert.equal(ledger.snapshot().reserved, 0);
});
test('accounting overflow fails closed and does not free an uncertain reservation', async () => {
  const ledger = newLedger();
  await invoke(ledger, async () => ({usage: usage()}));
  await assert.rejects(invoke(ledger, async () => ({usage: usage(Number.MAX_SAFE_INTEGER, 0)})), /usage-accounting-overflow/);
  assert.equal(ledger.snapshot().halted, 'usage-accounting-overflow');
  assert.equal(ledger.snapshot().reserved, 50); assert.equal(ledger.snapshot().spent, 25);
});
test('asynchronous save callback is rejected because it cannot guarantee durable reservation', () => {
  assert.throws(() => newLedger({save: async () => {}}), /ledger-write-failed/);
});
