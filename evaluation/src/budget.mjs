/** Offline-testable scheduling guard. No HTTP client, environment or credential access. */
import {mkdirSync, openSync, closeSync, readFileSync, writeFileSync, renameSync, unlinkSync, fsyncSync, realpathSync, lstatSync} from 'node:fs';
import {dirname, basename, join, resolve} from 'node:path';
export const PROJECT_HARD_CAP = 10_000_000;
const integer = (n, name, min = 0) => {
  if (!Number.isSafeInteger(n) || n < min) throw new Error(`invalid-${name}`);
  return n;
};
const clone = value => structuredClone(value);
const sum = values => values.reduce((n, v) => integer(n + v, 'sum'), 0);
const assert = (condition, message) => { if (!condition) throw new Error(message); };

/** completion/output already includes reasoning in the ordinary OpenAI convention.
 * Any provider-specific additional reasoning requires an explicit, verified contract. */
export function normalizeUsage(usage, {usageFormat, reasoningAccounting}) {
  assert(usage && typeof usage === 'object', 'missing-usage');
  assert(['chat_completions', 'responses'].includes(usageFormat), 'unknown-usage-format');
  assert(['included_in_output', 'additional_to_output'].includes(reasoningAccounting), 'unknown-reasoning-accounting');
  const chat = usageFormat === 'chat_completions';
  const input = integer(usage[chat ? 'prompt_tokens' : 'input_tokens'], 'input-tokens');
  const output = integer(usage[chat ? 'completion_tokens' : 'output_tokens'], 'output-tokens');
  const details = usage[chat ? 'completion_tokens_details' : 'output_tokens_details'];
  const reasoning = details?.reasoning_tokens === undefined ? null : integer(details.reasoning_tokens, 'reasoning-tokens');
  if (reasoningAccounting === 'additional_to_output') assert(reasoning !== null, 'missing-additional-reasoning');
  else if (reasoning !== null) assert(reasoning <= output, 'reasoning-exceeds-output');
  const billedOutput = sum([output, reasoningAccounting === 'additional_to_output' ? reasoning : 0]);
  const total = sum([input, billedOutput]);
  assert(usage.total_tokens === undefined || integer(usage.total_tokens, 'total-tokens') === total, 'inconsistent-total-tokens');
  // Cached input is a subset of input, never added again.
  const cached = usage[chat ? 'prompt_tokens_details' : 'input_tokens_details']?.cached_tokens;
  if (cached !== undefined) assert(integer(cached, 'cached-tokens') <= input, 'cached-exceeds-input');
  return {input, output, reasoning, billedOutput, total};
}

export class BudgetLedger {
  #state;
  #save;
  #closed = false;
  constructor({projectId, limit = PROJECT_HARD_CAP, concurrency = 1, state, save = () => {}}) {
    assert(typeof projectId === 'string' && /^[a-z0-9][a-z0-9-]{1,79}$/.test(projectId), 'invalid-project-id');
    integer(limit, 'limit', 1); assert(limit <= PROJECT_HARD_CAP, 'hard-cap-exceeded');
    integer(concurrency, 'concurrency', 1); assert(concurrency <= 16, 'concurrency-too-large');
    this.#save = save;
    this.#state = state ? clone(state) : {schemaVersion: 1, projectId, limit, concurrency, spent: 0, next: 1, reservations: {}, tasks: {}, batches: {}, halted: null};
    const s = this.#state;
    assert(s.schemaVersion === 1 && s.projectId === projectId && s.limit === limit && s.concurrency === concurrency, 'ledger-identity-mismatch');
    integer(s.spent, 'spent'); integer(s.next, 'next', 1);
    assert(s.reservations && s.tasks && s.batches, 'invalid-ledger');
    for (const table of [s.tasks, s.batches]) {
      for (const entry of Object.values(table)) {
        integer(entry.spent, 'scope-spent'); integer(entry.limit, 'scope-limit', 1); integer(entry.attempts, 'scope-attempts');
      }
      assert(sum(Object.values(table).map(v => v.spent)) === s.spent, 'ledger-totals-mismatch');
    }
    for (const task of Object.values(s.tasks)) {
      integer(task.maxAttempts, 'stored-attempt-limit', 1);
      assert(task.maxAttempts <= 2, 'stored-attempt-limit-too-large');
      if (task.logicalCalls) {
        integer(task.maxRequests, 'stored-request-limit', 1);
        assert(task.maxRequests <= 12 && task.attempts <= task.maxRequests, 'invalid-stored-request-limit');
        for (const [key, attempts] of Object.entries(task.logicalCalls)) {
          assert(/^call-[1-9][0-9]{0,5}$/.test(key), 'invalid-stored-call-id');
          integer(attempts, 'stored-call-attempts', 1); assert(attempts <= task.maxAttempts, 'stored-call-attempt-limit');
        }
        assert(sum(Object.values(task.logicalCalls)) === task.attempts, 'stored-call-totals-mismatch');
      } else assert(task.attempts <= task.maxAttempts, 'stored-task-attempt-limit');
    }
    for (const r of Object.values(s.reservations)) {
      integer(r.inputUpperBound, 'stored-input-bound', 1); integer(r.maxOutputTokens, 'stored-output-bound', 1);
      assert(r.amount === sum([r.inputUpperBound, r.maxOutputTokens]) && s.tasks[r.taskId] && s.batches[r.batchId], 'invalid-reservation');
    }
    assert(s.halted === null || typeof s.halted === 'string', 'invalid-halt-state');
    // Never silently recover an uncertain previous physical request after a restart.
    if (state && Object.keys(s.reservations).length) s.halted = 'unresolved-previous-request';
    this.#persist();
  }
  #persist() {
    try {
      const saved = this.#save(clone(this.#state));
      assert(!saved || typeof saved.then !== 'function', 'async-ledger-save-not-supported');
    }
    catch { this.#state.halted = 'ledger-write-failed'; throw new Error('ledger-write-failed'); }
  }
  snapshot() {
    const result = clone(this.#state);
    result.reserved = sum(Object.values(result.reservations).map(r => r.amount));
    result.remaining = Math.max(0, result.limit - result.spent - result.reserved);
    return result;
  }
  reserve({taskId, batchId, inputUpperBound, maxOutputTokens, taskLimit, batchLimit, maxAttemptsPerTask = 2, logicalCallId, maxRequestsPerTask = 12}) {
    const s = this.#state;
    assert(!this.#closed, 'ledger-closed');
    assert(!s.halted, `budget-halted:${s.halted}`);
    assert(Object.keys(s.reservations).length < s.concurrency, 'model-concurrency-limit');
    integer(maxAttemptsPerTask, 'model-attempt-limit', 1);
    assert(maxAttemptsPerTask <= 2, 'model-attempt-limit-too-large');
    const grouped = logicalCallId !== undefined;
    if (grouped) {
      assert(typeof logicalCallId === 'string' && /^call-[1-9][0-9]{0,5}$/.test(logicalCallId), 'invalid-logical-call-id');
      integer(maxRequestsPerTask, 'task-request-limit', 1);
      assert(maxRequestsPerTask <= 12, 'task-request-limit-too-large');
    }
    const entry = s.tasks[taskId];
    assert(!entry || entry.maxAttempts === maxAttemptsPerTask && !!entry.logicalCalls === grouped, 'task-attempt-limit-change');
    if (grouped) {
      assert(!entry || entry.maxRequests === maxRequestsPerTask, 'task-request-limit-change');
      assert((entry?.attempts ?? 0) < maxRequestsPerTask, 'model-task-request-limit');
      assert((entry?.logicalCalls?.[logicalCallId] ?? 0) < maxAttemptsPerTask, 'model-logical-attempt-limit');
    } else assert((entry?.attempts ?? 0) < maxAttemptsPerTask, 'model-task-attempt-limit');
    assert(typeof taskId === 'string' && typeof batchId === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(taskId) && /^[a-z0-9][a-z0-9-]{0,79}$/.test(batchId), 'invalid-scope-id');
    integer(inputUpperBound, 'input-bound', 1); integer(maxOutputTokens, 'output-limit', 1);
    integer(taskLimit, 'task-limit', 1); integer(batchLimit, 'batch-limit', 1);
    assert(taskLimit <= batchLimit && batchLimit <= s.limit, 'invalid-scope-limits');
    const amount = sum([inputUpperBound, maxOutputTokens]);
    const scopes = [[s.tasks, taskId, taskLimit, 'taskId'], [s.batches, batchId, batchLimit, 'batchId']];
    assert(amount <= this.snapshot().remaining, 'project-budget-insufficient');
    for (const [table, id, limit, field] of scopes) {
      const entry = table[id];
      assert(!entry || entry.limit === limit, 'scope-limit-change');
      const reserved = sum(Object.values(s.reservations).filter(r => r[field] === id).map(r => r.amount));
      assert((entry?.spent ?? 0) + reserved + amount <= limit, `${field}-budget-insufficient`);
    }
    for (const [table, id, limit] of scopes) table[id] ??= {limit, spent: 0, attempts: 0};
    s.tasks[taskId].maxAttempts = maxAttemptsPerTask;
    if (grouped) {
      s.tasks[taskId].maxRequests = maxRequestsPerTask;
      s.tasks[taskId].logicalCalls ??= {};
      s.tasks[taskId].logicalCalls[logicalCallId] = (s.tasks[taskId].logicalCalls[logicalCallId] ?? 0) + 1;
    }
    const id = `request-${s.next++}`;
    s.reservations[id] = {taskId, batchId, inputUpperBound, maxOutputTokens, amount};
    s.tasks[taskId].attempts++; s.batches[batchId].attempts++;
    this.#persist(); // Durable reservation completes before any transport can start.
    return id;
  }
  settle(id, usage, contract) {
    assert(!this.#closed, 'ledger-closed');
    const s = this.#state, reservation = s.reservations[id];
    assert(reservation, 'unknown-reservation');
    let counted;
    try { counted = normalizeUsage(usage, contract); }
    catch (error) { this.halt(id, error.message); throw error; }
    const r = reservation;
    let projectSpent, taskSpent, batchSpent;
    try {
      projectSpent = sum([s.spent, counted.total]);
      taskSpent = sum([s.tasks[r.taskId].spent, counted.total]);
      batchSpent = sum([s.batches[r.batchId].spent, counted.total]);
    } catch { this.halt(id, 'usage-accounting-overflow'); throw new Error('usage-accounting-overflow'); }
    s.spent = projectSpent; s.tasks[r.taskId].spent = taskSpent; s.batches[r.batchId].spent = batchSpent;
    delete s.reservations[id];
    if (counted.input > r.inputUpperBound || counted.billedOutput > r.maxOutputTokens) s.halted = 'provider-exceeded-reservation';
    this.#persist();
    assert(s.halted !== 'provider-exceeded-reservation', 'provider-exceeded-reservation');
    return counted;
  }
  close() {
    assert(Object.keys(this.#state.reservations).length === 0, 'unresolved-request-keeps-lock');
    this.#closed = true;
  }
  stop(reason) {
    assert(!this.#closed, 'ledger-closed');
    assert(typeof reason === 'string' && reason.length > 0, 'invalid-stop-reason');
    this.#state.halted ||= reason; this.#persist();
  }
  halt(id, reason = 'uncertain-request') {
    assert(this.#state.reservations[id], 'unknown-reservation');
    // Keep the maximum possible charge reserved. Do not refund an uncertain request.
    this.stop(reason);
  }
}

/** Single-writer durable project ledger. A crash leaves the lock: no automatic reset. */
export function openProjectLedger(path, options) {
  path = canonicalLedgerPath(path);
  const lockPath = `${path}.lock`;
  let lock;
  try { lock = openSync(lockPath, 'wx', 0o600); }
  catch { throw new Error('project-ledger-locked'); }
  let ledger;
  try {
    let state;
    try { state = JSON.parse(readFileSync(path, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw new Error('invalid-project-ledger'); }
    ledger = new BudgetLedger({...options, state, save(value) {
      const temporary = `${path}.pending`;
      const fd = openSync(temporary, 'wx', 0o600);
      try { writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`); fsyncSync(fd); } finally { closeSync(fd); }
      renameSync(temporary, path);
      const directory = openSync(dirname(path), 'r');
      try { fsyncSync(directory); } finally { closeSync(directory); }
    }});
  } catch (error) { closeSync(lock); unlinkSync(lockPath); throw error; }
  let closed = false;
  return {ledger, close() {
    if (closed) return;
    ledger.close();
    closeSync(lock); unlinkSync(lockPath); closed = true;
  }};
}

/** Final serialized request shape used both by the input-bound proof and by transport. */
export function prepareModelRequest(request, reservation, contract) {
  const payload = clone(request);
  delete payload.max_tokens; delete payload.max_completion_tokens; delete payload.max_output_tokens;
  payload[contract.outputLimitParameter] = reservation.maxOutputTokens;
  payload.stream = false;
  return payload;
}

/** Adapter must disable all internal retries and enforce the verified output cap.
 * inputUpperBound must cover the exact final serialized prompt, tools and overhead.
 * Transport is injected; this package does not implement real API access. */
export async function callBudgetedModel({ledger, reservation, contract, request, transport, signal}) {
  assert(typeof transport === 'function', 'missing-authorized-transport');
  assert(contract.verifiedForModelId === request?.model && typeof request?.model === 'string', 'unverified-model-contract');
  assert(typeof contract.inputUpperBoundMethod === 'string' && contract.inputUpperBoundMethod.length > 0, 'unverified-input-bound');
  assert(['included_in_output', 'additional_to_output'].includes(contract.reasoningAccounting), 'unknown-reasoning-accounting');
  assert(['chat_completions', 'responses'].includes(contract.usageFormat), 'unknown-usage-format');
  assert(contract.outputLimitIncludesAllBillableOutput === true, 'unverified-output-cap');
  assert(['max_completion_tokens', 'max_tokens', 'max_output_tokens'].includes(contract.outputLimitParameter), 'unknown-output-limit-parameter');
  assert(request.n === undefined || request.n === 1, 'multiple-completions-not-supported');
  assert(request.best_of === undefined && request.tools === undefined && request.previous_response_id === undefined && request.background !== true, 'unbounded-request-features');
  const payload = prepareModelRequest(request, reservation, contract);
  if (signal?.aborted) throw new Error('model-cancelled-before-dispatch');
  const id = ledger.reserve(reservation);
  let response;
  try { response = await transport(payload, {attempts: 1, ...(signal ? {signal} : {})}); }
  catch { ledger.halt(id, 'transport-error-usage-unknown'); throw new Error('transport-error-usage-unknown'); }
  const counted = ledger.settle(id, response?.usage, contract);
  if (response.error) { ledger.stop('model-error-response'); throw new Error('model-error-response'); }
  return {response, counted, requestId: id};
}

/** Resolve directory aliases and reject a symlink ledger, so aliases cannot get independent locks. */
function canonicalLedgerPath(path) {
  const absolute = resolve(path);
  mkdirSync(dirname(absolute), {recursive: true});
  const result = join(realpathSync(dirname(absolute)), basename(absolute));
  try { const stat = lstatSync(result); assert(!stat.isSymbolicLink(), 'symlink-ledger-refused'); assert(stat.isFile() && stat.nlink === 1, 'linked-ledger-refused'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  return result;
}

/** Jev is outside the LLM token budget. All primary and shadow physical attempts share this cap. */
export class JevMeter {
  #state; #save; #closed = false;
  constructor({maxCalls = 30, maxAttempts = 2, concurrency = 1, state, save = () => {}} = {}) {
    integer(maxCalls, 'jev-call-cap', 1); integer(maxAttempts, 'jev-attempt-cap', 1); integer(concurrency, 'jev-concurrency', 1);
    assert(maxAttempts <= 2 && concurrency <= 2, 'jev-bound-too-large');
    this.#save = save;
    this.#state = state ? clone(state) : {schemaVersion: 1, maxCalls, maxAttempts, concurrency, active: 0, halted: null, stats: {calls: 0, failures: 0, retries: 0, inputTokens: 0, outputTokens: 0, unknownUsageCalls: 0}};
    const s = this.#state;
    assert(s.schemaVersion === 1 && s.maxCalls === maxCalls && s.maxAttempts === maxAttempts && s.concurrency === concurrency, 'jev-meter-identity-mismatch');
    assert(s.halted === null || typeof s.halted === 'string', 'invalid-jev-halt');
    integer(s.active, 'jev-active'); assert(s.active <= concurrency, 'invalid-jev-active');
    for (const name of ['calls', 'failures', 'retries', 'inputTokens', 'outputTokens', 'unknownUsageCalls']) integer(s.stats?.[name], `jev-${name}`);
    assert(s.stats.calls <= maxCalls && s.stats.failures <= s.stats.calls && s.stats.retries <= s.stats.calls && s.stats.unknownUsageCalls <= s.stats.calls, 'invalid-jev-counts');
    if (state && s.active) s.halted = 'unresolved-previous-jev-request';
    this.#persist();
  }
  #persist() {
    try { const result = this.#save(clone(this.#state)); assert(!result || typeof result.then !== 'function', 'async-save'); }
    catch { this.#state.halted = 'jev-meter-write-failed'; throw new Error('jev-meter-write-failed'); }
  }
  snapshot() { const s = this.#state; return {...s.stats, active: s.active, ...(s.halted ? {halted: s.halted} : {})}; }
  close() { assert(this.#state.active === 0, 'unresolved-jev-request-keeps-lock'); this.#closed = true; }
  async call(transport, {signal} = {}) {
    const s = this.#state;
    assert(!this.#closed, 'jev-meter-closed'); assert(!s.halted, `jev-meter-halted:${s.halted}`);
    assert(typeof transport === 'function', 'missing-jev-transport');
    assert(s.active < s.concurrency, 'jev-concurrency-limit');
    if (signal?.aborted) throw new Error('jev-cancelled-before-dispatch');
    s.active++;
    let retainActive = false;
    try {
      for (let attempt = 1; attempt <= s.maxAttempts; attempt++) {
        if (signal?.aborted) throw new Error('jev-cancelled-before-dispatch');
        assert(!s.halted, 'jev-meter-halted'); assert(s.stats.calls < s.maxCalls, 'jev-call-limit');
        s.stats.calls++; if (attempt > 1) s.stats.retries++;
        this.#persist(); // Durable physical-attempt count, including active marker, before transport.
        let response;
        try { response = await transport({attempt, retryInternally: false}); }
        catch (error) {
          s.stats.failures++; s.stats.unknownUsageCalls++;
          if (error?.requestUnsettled === true) { s.halted = 'jev-transport-unsettled'; retainActive = true; }
          this.#persist();
          if (retainActive) throw new Error('jev-transport-unsettled');
          if (error?.retryable !== true || attempt === s.maxAttempts || signal?.aborted) throw new Error('jev-request-failed');
          continue;
        }
        const u = response?.usage;
        if (Number.isSafeInteger(u?.input_tokens) && u.input_tokens >= 0 && Number.isSafeInteger(u?.output_tokens) && u.output_tokens >= 0) {
          try { s.stats.inputTokens = sum([s.stats.inputTokens, u.input_tokens]); s.stats.outputTokens = sum([s.stats.outputTokens, u.output_tokens]); }
          catch { s.halted = 'jev-usage-overflow'; this.#persist(); throw new Error('jev-usage-overflow'); }
        } else s.stats.unknownUsageCalls++;
        this.#persist();
        return response;
      }
    } finally { if (!retainActive) s.active--; this.#persist(); }
  }
}

/** Same fail-closed single-writer policy as model budgets; never deletes a crash lock automatically. */
export function openJevMeter(path, options = {}) {
  path = canonicalLedgerPath(path);
  const lockPath = `${path}.lock`;
  let lock;
  try { lock = openSync(lockPath, 'wx', 0o600); } catch { throw new Error('jev-meter-locked'); }
  let meter;
  try {
    let state;
    try { state = JSON.parse(readFileSync(path, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw new Error('invalid-jev-meter'); }
    meter = new JevMeter({...options, state, save(value) {
      const temporary = `${path}.pending`, fd = openSync(temporary, 'wx', 0o600);
      try { writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`); fsyncSync(fd); } finally { closeSync(fd); }
      renameSync(temporary, path);
      const directory = openSync(dirname(path), 'r'); try { fsyncSync(directory); } finally { closeSync(directory); }
    }});
  } catch (error) { closeSync(lock); unlinkSync(lockPath); throw error; }
  let closed = false;
  return {meter, close() { if (closed) return; meter.close(); closeSync(lock); unlinkSync(lockPath); closed = true; }};
}
