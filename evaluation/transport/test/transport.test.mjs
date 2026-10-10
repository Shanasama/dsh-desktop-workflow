import test from 'node:test';
import assert from 'node:assert/strict';
import {BudgetLedger, callBudgetedModel} from '../../src/budget.mjs';
import {getJevMetadata} from '../../../src/jev-client.js';
import {createOpenAITransport, decodeOpenAIText, APPROVED_MODEL_ID, APPROVED_MODEL_ORIGIN} from '../openai.mjs';
import {createTypeSafeTransport, createTypeSafeDecisionClient, DOCUMENTED_JEV_MODEL, TYPESAFE_ENDPOINT} from '../typesafe.mjs';
import {TransportError} from '../http.mjs';
const fixtureCredential = 'public-synthetic-placeholder';
const contract = format => ({usageFormat: format, reasoningAccounting: 'included_in_output', inputUpperBoundMethod: 'public-synthetic-fixture', outputLimitParameter: format === 'chat_completions' ? 'max_completion_tokens' : 'max_output_tokens', outputLimitIncludesAllBillableOutput: true, verifiedForModelId: APPROVED_MODEL_ID, evidence: 'public-synthetic-only'});
const profile = (format = 'chat_completions') => ({baseUrl: APPROVED_MODEL_ORIGIN, endpointPath: format === 'chat_completions' ? '/v1/chat/completions' : '/v1/responses', modelId: APPROVED_MODEL_ID, contract: contract(format), getCredential: () => fixtureCredential});
const usage = {prompt_tokens: 10, completion_tokens: 9, total_tokens: 19, prompt_tokens_details: {cached_tokens: 5}, completion_tokens_details: {reasoning_tokens: 4}};
const chat = overrides => ({model: APPROVED_MODEL_ID, choices: [{message: {role: 'assistant', content: 'READY'}, finish_reason: 'stop'}], usage, ...overrides});
const responses = overrides => ({model: APPROVED_MODEL_ID, status: 'completed', output: [{type: 'reasoning', summary: [{type: 'summary_text', text: 'private synthetic reasoning'}]}, {type: 'message', status: 'completed', role: 'assistant', content: [{type: 'output_text', text: 'READY'}]}], usage: {input_tokens: 10, output_tokens: 9, total_tokens: 19, input_tokens_details: {cached_tokens: 5}, output_tokens_details: {reasoning_tokens: 4}}, ...overrides});
const request = format => ({model: APPROVED_MODEL_ID, ...(format === 'responses' ? {input: 'Public synthetic fixture', max_output_tokens: 16} : {messages: [{role: 'user', content: 'Public synthetic fixture'}], max_completion_tokens: 16}), stream: false});
const reservation = {taskId: 'fixture', batchId: 'pilot', inputUpperBound: 20, maxOutputTokens: 16, taskLimit: 100, batchLimit: 100};
function budgeted(fetchImpl, format = 'chat_completions', options = {}) {
  const ledger = new BudgetLedger({projectId: 'public-synthetic', limit: 100});
  const transport = createOpenAITransport({...profile(format), fetchImpl, ...options});
  return {ledger, invoke: () => callBudgetedModel({ledger, reservation, contract: contract(format), request: request(format), transport})};
}

test('chat exact URL, pinned model, cap and no retries; reasoning/cache counted once', async () => {
  let calls = 0;
  const {ledger, invoke} = budgeted(async (url, options) => {
    calls++;
    assert.equal(url, `${APPROVED_MODEL_ORIGIN}/v1/chat/completions`);
    assert.equal(options.redirect, 'error'); assert.equal(options.credentials, 'omit');
    assert.equal(options.headers.Authorization, `Bearer ${fixtureCredential}`);
    assert.equal(options.method, 'POST'); assert.equal(options.signal.aborted, false);
    assert.deepEqual(JSON.parse(options.body), request('chat_completions'));
    return Response.json(chat());
  });
  const result = await invoke();
  assert.equal(calls, 1); assert.equal(result.counted.total, 19); assert.equal(ledger.snapshot().spent, 19);
  assert.equal(decodeOpenAIText(result.response, 'chat_completions'), 'READY');
});
test('Responses wire uses exact max_output_tokens; reasoning output is not returned as commands', async () => {
  const {ledger, invoke} = budgeted(async (url, options) => {
    assert.equal(url, `${APPROVED_MODEL_ORIGIN}/v1/responses`);
    assert.equal(JSON.parse(options.body).max_output_tokens, 16);
    return Response.json(responses());
  }, 'responses');
  const result = await invoke();
  assert.equal(result.counted.total, 19); assert.equal(ledger.snapshot().spent, 19);
  assert.equal(decodeOpenAIText(result.response, 'responses'), 'READY');
  assert.equal(JSON.stringify(result.response).includes('private synthetic'), false);
});
test('HTTP failure with valid contracted usage settles charge then halts; raw error removed', async () => {
  const {ledger, invoke} = budgeted(async () => Response.json({usage, error: {message: `Do not expose ${fixtureCredential}`, code: fixtureCredential}}, {status: 429}));
  await assert.rejects(invoke(), /^Error: model-error-response$/);
  assert.equal(ledger.snapshot().spent, 19); assert.equal(ledger.snapshot().reserved, 0);
  assert.equal(ledger.snapshot().halted, 'model-error-response');
});
test('model mismatch with known usage settles charge and never returns model-selected text', async () => {
  const {ledger, invoke} = budgeted(async () => Response.json(chat({model: 'different-model'})));
  await assert.rejects(invoke(), /^Error: model-error-response$/);
  assert.equal(ledger.snapshot().spent, 19);
});
for (const [name, badUsage] of [
  ['missing', undefined], ['negative', {...usage, prompt_tokens: -1}], ['string count', {...usage, prompt_tokens: '10'}],
  ['fraction', {...usage, completion_tokens: 1.5}], ['inconsistent total', {...usage, total_tokens: 999}],
  ['cache larger than input', {...usage, prompt_tokens_details: {cached_tokens: 11}}],
  ['reasoning larger than output', {...usage, completion_tokens_details: {reasoning_tokens: 10}}],
  ['additional unknown top-level usage', {...usage, extra_billable_tokens: 7}], ['unsafe number', {...usage, prompt_tokens: Number.MAX_SAFE_INTEGER + 1}],
]) test(`unknown usage is fail-closed: ${name}`, async () => {
  let calls = 0;
  const {ledger, invoke} = budgeted(async () => { calls++; return Response.json(chat({usage: badUsage})); });
  await assert.rejects(invoke(), /^Error: transport-error-usage-unknown$/);
  assert.equal(calls, 1); assert.equal(ledger.snapshot().spent, 0); assert.equal(ledger.snapshot().reserved, 36);
  assert.equal(ledger.snapshot().halted, 'transport-error-usage-unknown');
});
test('transport exception cannot leak credential, raw error or cause and does not retry', async () => {
  let calls = 0;
  const transport = createOpenAITransport({...profile(), fetchImpl: async () => { calls++; throw new Error(`Authorization: Bearer ${fixtureCredential}`); }});
  await assert.rejects(transport(request()), error => error.code === 'http-request-failed' && !error.message.includes(fixtureCredential) && error.cause === undefined && error.retryable === false);
  assert.equal(calls, 1);
});
for (const [name, fetchImpl] of [
  ['cross-origin 302', async () => new Response('', {status: 302, headers: {Location: 'https://unrelated.example/steal'}})],
  ['same-origin 307', async () => new Response('', {status: 307, headers: {Location: `${APPROVED_MODEL_ORIGIN}/other`}})],
  ['followed cross-origin', async () => { const r = Response.json(chat()); Object.defineProperty(r, 'url', {value: 'https://unrelated.example/steal'}); Object.defineProperty(r, 'redirected', {value: true}); return r; }],
  ['unexpected final URL', async () => { const r = Response.json(chat()); Object.defineProperty(r, 'url', {value: `${APPROVED_MODEL_ORIGIN}/other`}); return r; }],
]) test(`redirect rejected with one fetch: ${name}`, async () => {
  let calls = 0;
  const t = createOpenAITransport({...profile(), fetchImpl: (...args) => { calls++; assert.equal(args[1].redirect, 'error'); return fetchImpl(...args); }});
  await assert.rejects(t(request()), {code: 'redirect-forbidden'}); assert.equal(calls, 1);
});
test('hanging fetch is bounded even when injected fetch ignores abort', async () => {
  let sentSignal;
  const {ledger, invoke} = budgeted((_url, options) => { sentSignal = options.signal; return new Promise(() => {}); }, 'chat_completions', {timeoutMs: 15});
  await assert.rejects(invoke(), /^Error: transport-error-usage-unknown$/);
  assert.equal(sentSignal.aborted, true); assert.equal(ledger.snapshot().reserved, 36);
});
test('hanging response body is bounded and cancelled by deadline', async () => {
  let cancelled = false;
  const t = createOpenAITransport({...profile(), timeoutMs: 15, fetchImpl: async () => new Response(new ReadableStream({pull() { return new Promise(() => {}); }, cancel() { cancelled = true; }}), {headers: {'Content-Type': 'application/json'}})});
  await assert.rejects(t(request()), {code: 'request-timeout'}); assert.equal(cancelled, true);
});
test('pre-aborted signal never reads credential or performs HTTP', async () => {
  let calls = 0;
  const t = createOpenAITransport({...profile(), getCredential: () => { calls++; return fixtureCredential; }, fetchImpl: () => { calls++; }});
  await assert.rejects(t(request(), {signal: AbortSignal.abort('secret user abort reason')}), {code: 'request-cancelled'});
  assert.equal(calls, 0);
});
test('caller cancellation is propagated while fetching; abort reason is not reflected', async () => {
  const c = new AbortController(); let signal;
  const t = createOpenAITransport({...profile(), timeoutMs: 1000, fetchImpl: (_url, init) => { signal = init.signal; c.abort(`private ${fixtureCredential}`); return new Promise(() => {}); }});
  await assert.rejects(t(request(), {signal: c.signal}), {code: 'request-cancelled'}); assert.equal(signal.aborted, true);
});
test('response bytes rather than characters bounded; UTF-8 split across chunks accepted', async () => {
  const payload = new TextEncoder().encode(JSON.stringify(chat({choices: [{finish_reason: 'stop', message: {role: 'assistant', content: '测'}}]})));
  const factory = () => new Response(new ReadableStream({start(c) { for (const b of payload) c.enqueue(Uint8Array.of(b)); c.close(); }}), {headers: {'Content-Type': 'application/json'}});
  const t = createOpenAITransport({...profile(), maxResponseBytes: payload.length, fetchImpl: async () => factory()});
  assert.equal(decodeOpenAIText(await t(request()), 'chat_completions'), '测');
  const small = createOpenAITransport({...profile(), maxResponseBytes: payload.length - 1, fetchImpl: async () => factory()});
  await assert.rejects(small(request()), {code: 'response-too-large'});
});
for (const [name, response, code] of [
  ['content length', () => new Response('{}', {headers: {'Content-Type': 'application/json', 'Content-Length': '1000001'}}), 'response-too-large'],
  ['non JSON', () => new Response(fixtureCredential, {headers: {'Content-Type': 'text/html'}}), 'non-json-response'],
  ['invalid JSON', () => new Response(`{${fixtureCredential}`, {headers: {'Content-Type': 'application/json'}}), 'invalid-response-json'],
  ['no body', () => new Response(null, {status: 204, headers: {'Content-Type': 'application/json'}}), 'missing-response-body'],
]) test(`bounded parse rejects ${name}`, async () => {
  const t = createOpenAITransport({...profile(), fetchImpl: async () => response()});
  await assert.rejects(t(request()), {code});
});
test('oversized request rejected before credentials or fetch', async () => {
  let calls = 0;
  const t = createOpenAITransport({...profile(), maxRequestBytes: 16, getCredential: () => { calls++; return fixtureCredential; }, fetchImpl: () => { calls++; }});
  await assert.rejects(t(request()), {code: 'request-too-large'}); assert.equal(calls, 0);
});
test('unknown or unbounded request features fail before HTTP', async () => {
  let calls = 0;
  const t = createOpenAITransport({...profile(), fetchImpl: () => { calls++; }});
  for (const patch of [{tools: []}, {stream: true}, {max_tokens: 999}, {n: 2}, {model: 'gpt-6-luna'}, {previous_response_id: 'x'}, {background: true}, {temperature: 0}, {store: true}]) await assert.rejects(t({...request(), ...patch}), TransportError);
  await assert.rejects(t(request(), {attempts: 2}), {code: 'automatic-retries-forbidden'});
  assert.equal(calls, 0);
});
test('contract must explicitly pin origin, path, model and standard output semantics', () => {
  for (const patch of [{baseUrl: 'https://unrelated.example'}, {baseUrl: `${APPROVED_MODEL_ORIGIN}/`}, {endpointPath: '/v1/chat/completions?secret=1'}, {modelId: 'gpt-6-luna'}, {contract: {...contract('chat_completions'), outputLimitIncludesAllBillableOutput: false}}, {contract: {...contract('chat_completions'), outputLimitParameter: 'max_tokens'}}, {contract: {...contract('chat_completions'), reasoningAccounting: 'additional_to_output'}}]) assert.throws(() => createOpenAITransport({...profile(), ...patch, fetchImpl: async () => {}}), TransportError);
});
for (const status of ['queued', 'in_progress', 'future-unknown-status']) test(`Responses ${status} retains full reservation even with numerical usage`, async () => {
  const {ledger, invoke} = budgeted(async () => Response.json(responses({status})), 'responses');
  await assert.rejects(invoke(), /^Error: transport-error-usage-unknown$/); assert.equal(ledger.snapshot().reserved, 36);
});
test('terminal but incomplete response accounts usage and blocks output acceptance', async () => {
  const {ledger, invoke} = budgeted(async () => Response.json(responses({status: 'incomplete'})), 'responses');
  await assert.rejects(invoke(), /^Error: model-error-response$/); assert.equal(ledger.snapshot().spent, 19);
});
test('chat length finish accounts usage but decoder refuses incomplete acceptance', async () => {
  const {ledger, invoke} = budgeted(async () => Response.json(chat({choices: [{message: {role: 'assistant', content: 'PARTIAL'}, finish_reason: 'length'}]})));
  const result = await invoke(); assert.equal(ledger.snapshot().spent, 19);
  assert.throws(() => decodeOpenAIText(result.response, 'chat_completions'), {code: 'model-result-incomplete'});
});
const jevRequest = {model: DOCUMENTED_JEV_MODEL, state: 'Public synthetic state', questions: {ok: {type: 'noul', instructions: 'Is the fixture ready?'}, next: {type: 'choice', instructions: 'Select the right next action.', criteria: {continue: 'Continue work', complete: 'Work is complete'}}, score: {type: 'score', instructions: 'Rate the fixture readiness.', criteria: ['Unready', 'Ready']}}};
const jevResponse = {model: DOCUMENTED_JEV_MODEL, usage: {input_tokens: 30, output_tokens: 8}, answers: {ok: {type: 'noul', noul: 0.99}, next: {type: 'choice', choice: 'complete', probabilities: {continue: 0.1, complete: 0.9}, confidence: 0.8}, score: {type: 'score', score: 0.9, probabilities: {'0': 0.1, '1': 0.9}, legend: {'0': 'Unready', '1': 'Ready'}, confidence: 0.8}}};
test('official TypeSafe request and all three typed answer forms', async () => {
  let calls = 0;
  const t = createTypeSafeTransport({getCredential: () => fixtureCredential, fetchImpl: async (url, init) => {
    calls++; assert.equal(url, TYPESAFE_ENDPOINT); assert.equal(init.redirect, 'error'); assert.deepEqual(JSON.parse(init.body), jevRequest); return Response.json(jevResponse);
  }});
  assert.deepEqual(await t(jevRequest), jevResponse); assert.equal(calls, 1);
});
test('TypeSafe malformed answer, unknown usage, and pinned-model drift fail closed', async () => {
  for (const data of [{...jevResponse, usage: undefined}, {...jevResponse, model: 'jev-99.0.0'}, {...jevResponse, answers: {...jevResponse.answers, ok: {type: 'noul', noul: 1.1}}}, {...jevResponse, answers: {...jevResponse.answers, next: {...jevResponse.answers.next, probabilities: {complete: 1}}}}]) {
    const t = createTypeSafeTransport({getCredential: () => fixtureCredential, fetchImpl: async () => Response.json(data)});
    await assert.rejects(t(jevRequest), TransportError);
  }
});
test('TypeSafe 429 never automatically retries or exposes response text', async () => {
  let calls = 0;
  const t = createTypeSafeTransport({getCredential: () => fixtureCredential, fetchImpl: async () => { calls++; return Response.json({error: fixtureCredential}, {status: 429}); }});
  await assert.rejects(t(jevRequest), error => error.code === 'typesafe-http-error' && error.retryable === false && !error.message.includes(fixtureCredential)); assert.equal(calls, 1);
});
test('TypeSafe controller adapter preserves weak-map usage metadata without resolving environment', async () => {
  let calls = 0;
  const client = createTypeSafeDecisionClient({getCredential: () => fixtureCredential, fetchImpl: async (_url, init) => {
    calls++; const payload = JSON.parse(init.body); assert.equal(payload.model, DOCUMENTED_JEV_MODEL);
    return Response.json({model: DOCUMENTED_JEV_MODEL, usage: {input_tokens: 40, output_tokens: 5}, answers: {lane: {type: 'choice', choice: 'small', probabilities: {small: 0.9, medium: 0.1, high: 0, escalate: 0, other: 0}, confidence: 0.9}, security_sensitive: {type: 'noul', noul: 0.01}, underspecified: {type: 'noul', noul: 0.01}}});
  }});
  const answers = await client.decide({phase: 'classify', goal: 'Public fixture: correct a typo.', signal: new AbortController().signal});
  assert.equal(calls, 1); assert.equal(getJevMetadata(answers).usage.inputTokens, 40);
  assert.equal(getJevMetadata(answers).requestedModel, DOCUMENTED_JEV_MODEL);
});

test('transport output cap is independently bounded to configured maximum', async () => {
  let calls = 0;
  const t = createOpenAITransport({...profile(), maxOutputTokens: 8, fetchImpl: () => { calls++; }});
  await assert.rejects(t(request()), {code: 'invalid-bounded-request'}); assert.equal(calls, 0);
});
test('an injected error cannot mutate a public error into a credential leak', async () => {
  const error = new TransportError('http-request-failed'); error.code = fixtureCredential; error.message = fixtureCredential;
  const t = createOpenAITransport({...profile(), fetchImpl: async () => { throw error; }});
  await assert.rejects(t(request()), err => err.code === 'http-request-failed' && !err.message.includes(fixtureCredential));
});

for (const finish_reason of [null, 'future-unknown']) test(`chat nonterminal finish ${finish_reason} retains reservation`, async () => {
  const {ledger, invoke} = budgeted(async () => Response.json(chat({choices: [{finish_reason, message: {role: 'assistant', content: 'PARTIAL'}}]})));
  await assert.rejects(invoke(), /^Error: transport-error-usage-unknown$/); assert.equal(ledger.snapshot().reserved, 36);
});
