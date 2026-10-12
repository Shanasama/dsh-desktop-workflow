/** Explicit opt-in evaluation adapter over the production controller. No built-in network or secrets. */
import {JevTeamController} from '../../src/jev-controller.js';
import {getJevMetadata} from '../../src/jev-client.js';
import {callBudgetedModel, prepareModelRequest} from './budget.mjs';
const check = (value, message) => { if (!value) throw new Error(message); };
const integer = (n, max) => Number.isSafeInteger(n) && n > 0 && n <= max;
const roles = ['planner', 'coordinator', 'researcher', 'explorer', 'worker', 'reviewer'];
function waitFor(promise, signal) {
  return new Promise((resolve, reject) => {
    const end = (fn, value) => { signal?.removeEventListener('abort', abort); fn(value); };
    const abort = () => end(reject, new Error('evaluation-cancelled'));
    if (signal?.aborted) return abort();
    signal?.addEventListener('abort', abort, {once: true});
    promise.then(value => end(resolve, value), error => end(reject, error));
  });
}

export function createBudgetedTeamController({ledger, jevMeter, model, jev, shadowJev, verifier, taskId, batchId, budget, trace = false, maxShadowCalls = 2, shadowTimeoutMs = 10000}) {
  check(ledger && jevMeter, 'evaluation-ledgers-required');
  check(verifier && typeof verifier.preflight === 'function' && typeof verifier.collect === 'function', 'independent-verifier-required');
  check(jev && typeof jev.decide === 'function', 'independent-jev-required');
  check(model && typeof model.modelId === 'string' && typeof model.buildRequest === 'function' && typeof model.inputUpperBound === 'function' && typeof model.transport === 'function' && typeof model.decode === 'function', 'evaluation-model-adapter-required');
  check(/^[a-z0-9][a-z0-9-]{0,79}$/.test(taskId) && /^[a-z0-9][a-z0-9-]{0,79}$/.test(batchId), 'evaluation-opaque-scope-ids-required');
  const b = {...budget};
  check(integer(b.taskTokenLimit, 20_000) && integer(b.pilotTokenLimit, 100_000) && b.taskTokenLimit <= b.pilotTokenLimit, 'evaluation-budget-limit');
  check(b.concurrency === 1 && ledger.snapshot().concurrency === 1, 'evaluation-concurrency-must-be-one');
  check(integer(b.maxOutputTokens, b.taskTokenLimit) && integer(b.maxModelAttemptsPerTask, 2) && integer(b.maxRequestsPerTask ?? 12, 12) && b.transportRetries === 0, 'evaluation-request-bounds');
  let releaseShadow;
  const primarySettled = new Promise(resolve => { releaseShadow = resolve; });
  let shadowQueue = Promise.resolve();
  const meteredJev = (client, shadow = false) => client && ({
    requestedModel: client.requestedModel, mode: client.mode,
    preflight: () => client.preflight?.(), refresh: () => client.refresh?.(),
    ...(shadow ? {async acquire({signal}) {
      // Reserve a bounded observer ticket, without spending the physical request timeout.
      let release;
      const previous = shadowQueue, ticket = new Promise(resolve => { release = resolve; });
      shadowQueue = previous.then(() => ticket);
      try { await waitFor(Promise.all([primarySettled, previous]), signal); return release; }
      catch { release(); throw new Error('evaluation-shadow-queue-cancelled'); }
    }} : {}),
    async decide(spec) {
      const perform = async () => {
        const result = await jevMeter.call(async () => {
          const answers = await client.decide(spec), usage = getJevMetadata(answers)?.usage;
          return {answers, usage: {input_tokens: usage?.inputTokens, output_tokens: usage?.outputTokens}};
        }, {signal: spec.signal});
        return result.answers;
      };
      return perform();
    }
  });
  let callSequence = 0, started = false;
  const controller = new JevTeamController({trace, verifier, jev: meteredJev(jev), shadowJev: meteredJev(shadowJev, true), maxShadowCalls, shadowTimeoutMs,
    execute: async spec => {
      check(spec.model.model === model.modelId, 'evaluation-model-not-allowlisted');
      check(!spec.signal.aborted, 'evaluation-cancelled');
      const reservation = {taskId, batchId, logicalCallId: `call-${++callSequence}`, maxRequestsPerTask: b.maxRequestsPerTask ?? 12, maxAttemptsPerTask: b.maxModelAttemptsPerTask,
        taskLimit: b.taskTokenLimit, batchLimit: b.pilotTokenLimit, maxOutputTokens: Math.min(spec.model.maxTokens, b.maxOutputTokens)};
      let request;
      try {
        request = prepareModelRequest(await model.buildRequest(spec), reservation, model.contract);
        check(request.model === model.modelId, 'evaluation-model-not-allowlisted');
        reservation.inputUpperBound = await model.inputUpperBound(structuredClone(request));
      } catch { throw new Error('evaluation-request-bound-unavailable'); }
      const result = await callBudgetedModel({ledger, reservation, contract: model.contract, request, transport: model.transport, signal: spec.signal});
      check(!spec.signal.aborted, 'evaluation-cancelled');
      // Never accept usage from a decoder, generated test result or model self-assessment.
      try { return await model.decode(result.response, spec); }
      catch { throw new Error('evaluation-model-decode-failed'); }
    }
  });
  const start = controller.start.bind(controller);
  controller.start = input => {
    check(!started, 'evaluation-controller-single-task');
    check(roles.every(role => input.roles?.[role]?.model === model.modelId), 'evaluation-role-models-not-allowlisted');
    check(input.limits?.concurrency === 1 && input.limits?.maxAgents <= (b.maxRequestsPerTask ?? 12), 'evaluation-controller-limits');
    const run = start(input); started = true;
    controller.wait(run.id).then(releaseShadow, releaseShadow);
    return run;
  };
  controller.evaluationSummary = () => {
    const s = ledger.snapshot();
    return {mode: 'injected-evaluation', costRoutingImplemented: false, spentTokens: s.spent, reservedTokens: s.reserved, remainingTokens: s.remaining,
      halted: s.halted, modelPhysicalCalls: s.tasks[taskId]?.attempts ?? 0, jev: jevMeter.snapshot()};
  };
  return controller;
}
