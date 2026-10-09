import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TeamController} from '../src/orchestrator.js';
import {validateTeamConfig, validatePlan, validateReview, RETENTION_LIMITS} from '../src/team-contracts.js';

const roles = Object.fromEntries(['planner', 'coordinator', 'researcher', 'explorer', 'worker', 'reviewer', 'router'].map(role => [role, {provider: 'fixture', model: `model-${role}`, reasoningEffort: role === 'planner' ? 'high' : 'low', maxTokens: 1024}]));
const task = (id, role = 'worker', dependsOn = []) => ({id, title: `Task ${id}`, instructions: `Perform ${id}`, role, dependsOn});
const plan = tasks => ({summary: 'A bounded execution plan', tasks});
const approved = {verdict: 'approve', summary: 'Evidence checked', issues: []};
const completed = structured => ({stopReason: 'completed', structured});
function config(overrides = {}) { return {sessionId: 'session-1', goal: 'Implement and verify a small change', roles: structuredClone(roles), limits: {concurrency: 3, maxAgents: 24, maxTasks: 12, maxRetries: 1, maxDurationMs: 10000, maxStepsPerAgent: 8}, reviewPlan: true, routeEnabled: false, ...overrides}; }
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return {promise, resolve, reject}; }
async function until(predicate) { for (let i = 0; i < 100; i++) { if (predicate()) return; await new Promise(resolve => setImmediate(resolve)); } assert.fail('Expected asynchronous state was not reached'); }
function adapter(tasks = [task('write')], handle = () => ({stopReason: 'completed', output: 'Actual task evidence'})) {
  const calls = [];
  return {calls, execute: async request => {
    calls.push(request);
    if (request.role === 'router') return completed({route: 'plan', summary: 'Ready to plan'});
    if (request.role === 'planner' || request.role === 'coordinator') return completed(plan(tasks));
    if (request.role === 'reviewer') return completed(approved);
    return handle(request);
  }};
}

test('no execution at construction or before start returns; role models are exact and snapshots detached', async () => {
  const fake = adapter([task('read', 'researcher'), task('inspect', 'explorer'), task('write', 'worker', ['read', 'inspect'])]);
  const controller = new TeamController({execute: fake.execute, now: () => 100000, id: () => 'fixed-run'});
  assert.equal(fake.calls.length, 0);
  const input = config();
  const initial = controller.start(input);
  assert.equal(fake.calls.length, 0);
  assert.equal(initial.status, 'planning');
  initial.goal = 'mutated'; input.roles.worker.model = 'mutated';
  const result = await controller.wait(initial.id);
  assert.equal(result.status, 'completed');
  assert.equal(result.startedAt, '1970-01-01T00:01:40.000Z');
  assert.equal(result.goal, 'Implement and verify a small change');
  assert.equal(fake.calls.length, 7);
  for (const call of fake.calls) {
    assert.deepEqual(call.model, roles[call.role]);
    assert.equal(call.sessionId, 'session-1');
    assert.equal(call.runId, 'fixed-run');
    assert.equal(call.signal, fake.calls[0].signal);
    assert.equal(call.limits.maxStepsPerAgent, 8);
    assert.equal(!!call.outputSchema, !['researcher', 'explorer', 'worker'].includes(call.role));
  }
  const nodes = result.nodes.filter(node => node.kind === 'task');
  assert.equal(nodes.length, 3);
  const work = nodes.find(node => node.taskId === 'write');
  assert.equal(work.dependsOn.length, 2);
  assert.ok(work.dependsOn.every(id => result.edges.some(edge => edge.kind === 'dependency' && edge.from === id && edge.to === work.id)));
  result.nodes.length = 0;
  assert.equal(controller.snapshot('session-1').nodes.length, 7);
  await controller.dispose();
});

test('config preflight rejects unsafe or unsupported values and returns detached data', () => {
  const input = config(); const validated = validateTeamConfig(input); input.roles.worker.model = 'changed';
  assert.equal(validated.roles.worker.model, 'model-worker');
  for (const limits of [{concurrency: 0}, {concurrency: 5}, {maxAgents: 33}, {maxTasks: 13}, {maxRetries: 3}, {maxDurationMs: 999}, {maxStepsPerAgent: 17}, {maxRetries: 1.5}, {maxAgents: NaN}, {script: 'run'}]) assert.throws(() => validateTeamConfig(config({limits})));
  assert.throws(() => validateTeamConfig(config({goal: ''})));
  assert.throws(() => validateTeamConfig(config({goal: 'x'.repeat(8001)})));
  assert.throws(() => validateTeamConfig(config({goal: 'spoof\u202e'})));
  assert.throws(() => validateTeamConfig({...config(), script: 'arbitrary JS'}));
  assert.throws(() => validateTeamConfig(config({roles: {...roles, security: {model: 'bad'}}})));
  const missing = {...roles}; delete missing.reviewer;
  assert.throws(() => validateTeamConfig(config({roles: missing})));
  const noRouter = {...roles}; delete noRouter.router;
  assert.throws(() => validateTeamConfig(config({roles: noRouter, routeEnabled: true})));
  assert.throws(() => validateTeamConfig(config({reviewPlan: 'false'})));
  assert.throws(() => validateTeamConfig(config({roles: {...roles, worker: {...roles.worker, maxTokens: 0}}})));
  let getterRead = false;
  const getter = {...config()}; Object.defineProperty(getter, 'goal', {get() { getterRead = true; return 'goal'; }, enumerable: true});
  assert.throws(() => validateTeamConfig(getter)); assert.equal(getterRead, false);
});

test('strict DAG rejects cycles, unknown roles/dependencies, duplicates, extra fields, and oversized tasks', () => {
  const invalid = [
    plan([task('a', 'planner')]), plan([task('a', 'worker', ['missing'])]), plan([task('a'), task('a')]),
    plan([task('a', 'worker', ['a'])]), plan([task('a', 'worker', ['b']), task('b', 'worker', ['a'])]),
    plan([{...task('a'), script: 'execute()'}]), plan([{...task('a'), dependsOn: ['b', 'b']}, task('b')]),
    plan([{...task('a'), instructions: 'x'.repeat(8001)}]), plan([]), plan([task('__proto__')]),
  ];
  for (const item of invalid) assert.throws(() => validatePlan(item));
  assert.throws(() => validatePlan(plan([task('a'), task('b')]), 1));
  assert.throws(() => validateReview({verdict: 'approve', summary: 'ok', issues: [{taskId: 'unknown', message: 'unknown task'}]}, ['a']));
});

test('missing planner structured output fails closed; text is never parsed as a plan', async () => {
  const calls = [];
  const controller = new TeamController({execute: async request => { calls.push(request); return {stopReason: 'completed', output: JSON.stringify(plan([task('a')]))}; }});
  const result = await controller.wait(controller.start(config()).id);
  assert.equal(result.status, 'failed'); assert.equal(calls.length, 1);
  assert.equal(result.nodes[0].status, 'failed'); assert.match(result.message, /structured/);
});

test('invalid coordinator DAG is rejected atomically before task graph mutation', async () => {
  const fake = adapter();
  const controller = new TeamController({execute: request => request.role === 'coordinator' ? completed(plan([task('a', 'worker', ['b']), task('b', 'worker', ['a'])])) : fake.execute(request)});
  const result = await controller.wait(controller.start(config()).id);
  assert.equal(result.status, 'failed'); assert.equal(result.nodes.filter(node => node.kind === 'task').length, 0);
});

test('read tasks run concurrently, total concurrency is bounded, and only one writer runs', async () => {
  const tasks = [task('w1'), task('w2'), task('r1', 'researcher'), task('e1', 'explorer'), task('r2', 'researcher')];
  const started = [], pending = new Map(); let live = 0, writers = 0, peak = 0, writerPeak = 0;
  const fake = adapter(tasks, request => {
    const name = request.prompt.match(/Perform (\w+)/)[1]; const hold = deferred(); pending.set(name, hold); started.push(name);
    live++; if (request.role === 'worker') writers++; peak = Math.max(peak, live); writerPeak = Math.max(writerPeak, writers);
    return hold.promise.finally(() => { live--; if (request.role === 'worker') writers--; });
  });
  const controller = new TeamController({execute: fake.execute}); const start = controller.start(config());
  await until(() => started.length === 3);
  assert.deepEqual(started, ['w1', 'r1', 'e1']);
  pending.get('r1').resolve({stopReason: 'completed', output: 'r1 evidence'});
  await until(() => started.includes('r2')); assert.equal(started.includes('w2'), false);
  pending.get('w1').resolve({stopReason: 'completed', output: 'w1 evidence'});
  await until(() => started.includes('w2'));
  for (const hold of pending.values()) hold.resolve({stopReason: 'completed', output: 'Evidence'});
  const result = await controller.wait(start.id);
  assert.equal(result.status, 'completed'); assert.equal(peak, 3); assert.equal(writerPeak, 1);
});

test('dependency failures block descendants while independent work completes and reviewer diagnoses', async () => {
  const tasks = [task('grandchild', 'worker', ['child']), task('child', 'worker', ['bad']), task('bad', 'researcher'), task('independent', 'explorer')];
  const fake = adapter(tasks, request => request.prompt.includes('Perform bad') ? {stopReason: 'error', output: 'Read failed'} : {stopReason: 'completed', output: 'Independent evidence'});
  const controller = new TeamController({execute: fake.execute});
  const result = await controller.wait(controller.start(config({limits: {...config().limits, maxRetries: 0}})).id);
  assert.equal(result.status, 'blocked');
  const nodes = result.nodes.filter(node => node.kind === 'task');
  assert.equal(nodes.find(node => node.taskId === 'bad').status, 'failed');
  assert.equal(nodes.find(node => node.taskId === 'child').status, 'blocked');
  assert.equal(nodes.find(node => node.taskId === 'grandchild').status, 'blocked');
  assert.equal(nodes.find(node => node.taskId === 'independent').status, 'completed');
  assert.equal(fake.calls.filter(call => call.role === 'worker').length, 0);
  assert.equal(result.nodes.at(-1).title, 'Diagnose blocked work');
  assert.ok(result.edges.some(edge => edge.kind === 'feedback'));
});

test('retry creates a distinct revision node and dependants join successful revision', async () => {
  let attempts = 0;
  const fake = adapter([task('read', 'researcher'), task('write', 'worker', ['read'])], request => request.role === 'researcher' && attempts++ === 0 ? {stopReason: 'error'} : {stopReason: 'completed', output: 'Verified evidence', childId: `child-${request.nodeId}`});
  const controller = new TeamController({execute: fake.execute});
  const result = await controller.wait(controller.start(config()).id);
  assert.equal(result.status, 'completed');
  const revisions = result.nodes.filter(node => node.taskId === 'read');
  assert.equal(revisions.length, 2); assert.notEqual(revisions[0].id, revisions[1].id);
  assert.equal(revisions[0].status, 'failed'); assert.equal(revisions[1].attempt, 2);
  assert.ok(result.edges.some(edge => edge.kind === 'retry' && edge.from === revisions[0].id && edge.to === revisions[1].id));
  const write = result.nodes.find(node => node.taskId === 'write');
  assert.deepEqual(write.dependsOn, [revisions[1].id]); assert.ok(write.childId);
});

test('repeated failure stops at maxRetries and diagnostic approval cannot fabricate success', async () => {
  const fake = adapter([task('bad')], () => ({stopReason: 'max-tokens', output: 'Partial result'}));
  const controller = new TeamController({execute: fake.execute});
  const result = await controller.wait(controller.start(config({limits: {...config().limits, maxRetries: 2}})).id);
  assert.equal(result.status, 'blocked'); assert.equal(fake.calls.filter(call => call.role === 'worker').length, 3);
  assert.equal(result.nodes.at(-1).title, 'Diagnose blocked work');
});

test('permission refusal and agent abort are not automatically retried', async () => {
  for (const stopReason of ['refusal', 'aborted']) {
    const fake = adapter([task('bad')], () => ({stopReason})); const controller = new TeamController({execute: fake.execute});
    const result = await controller.wait(controller.start(config()).id);
    assert.equal(result.status, 'blocked'); assert.equal(fake.calls.filter(call => call.role === 'worker').length, 1);
  }
});

test('malformed review fails closed at both review checkpoints', async () => {
  for (const reviewPlan of [true, false]) {
    const fake = adapter();
    const controller = new TeamController({execute: request => request.role === 'reviewer' ? completed({verdict: 'approve'}) : fake.execute(request)});
    const result = await controller.wait(controller.start(config({reviewPlan})).id);
    assert.equal(result.status, 'failed');
    assert.equal(fake.calls.some(call => call.role === 'worker'), !reviewPlan);
  }
});

test('plan review revise is bounded and invokes the configured planner again', async () => {
  let reviews = 0;
  const fake = adapter();
  const controller = new TeamController({execute: request => request.role === 'reviewer' && reviews++ === 0 ? completed({verdict: 'revise', summary: 'Clarify scope', issues: [{taskId: 'write', message: 'Narrow scope'}]}) : fake.execute(request)});
  const result = await controller.wait(controller.start(config()).id);
  assert.equal(result.status, 'completed'); assert.equal(result.nodes.filter(node => node.kind === 'plan').length, 2);
  assert.ok(result.edges.some(edge => edge.kind === 'feedback'));
  const revisedPlanner = fake.calls.filter(call => call.role === 'planner')[1]; assert.match(revisedPlanner.prompt, /Clarify scope/);
});

test('final review revise or blocked returns actionable feedback without claiming completion', async () => {
  for (const verdict of ['revise', 'blocked']) {
    const fake = adapter();
    const controller = new TeamController({execute: request => request.role === 'reviewer' ? completed({verdict, summary: 'Need evidence for the change', issues: [{taskId: 'write', message: 'Verify actual output'}]}) : fake.execute(request)});
    const result = await controller.wait(controller.start(config({reviewPlan: false})).id);
    assert.equal(result.status, 'blocked'); assert.equal(result.message, 'Need evidence for the change');
    assert.ok(result.edges.some(edge => edge.kind === 'feedback'));
  }
});

test('optional router clarification blocks before any planner or task execution', async () => {
  const calls = [];
  const controller = new TeamController({execute: async request => { calls.push(request); return completed({route: 'clarify', summary: 'Which repository should be changed?'}); }});
  const result = await controller.wait(controller.start(config({routeEnabled: true})).id);
  assert.equal(result.status, 'blocked'); assert.equal(calls.length, 1); assert.equal(calls[0].role, 'router'); assert.equal(result.nodes[0].kind, 'route');
});

test('maxAgents accounts for planner, review, coordinator, tasks and retries', async () => {
  for (const maxAgents of [1, 3, 4, 5]) {
    const fake = adapter([task('a'), task('b')], () => ({stopReason: 'error'})); const controller = new TeamController({execute: fake.execute});
    const result = await controller.wait(controller.start(config({limits: {...config().limits, maxAgents}})).id);
    assert.ok(fake.calls.length <= maxAgents); assert.equal(result.status, 'blocked'); assert.match(result.message, /budget/i);
  }
});

test('cancellation aborts every active child, prevents retries, and waits for actual cleanup', async () => {
  const pending = [], aborted = [];
  const fake = adapter([task('a', 'researcher'), task('b', 'explorer'), task('c')], request => {
    const hold = deferred(); pending.push(hold); request.signal.addEventListener('abort', () => aborted.push(request.nodeId), {once: true}); return hold.promise;
  });
  const controller = new TeamController({execute: fake.execute}); const initial = controller.start(config());
  await until(() => pending.length === 3);
  assert.equal(controller.cancel('other-session', initial.id), null);
  controller.cancel('session-1', initial.id);
  assert.equal(aborted.length, 3); assert.equal(controller.snapshot('session-1').status, 'running');
  assert.throws(() => controller.start(config()), /already active/);
  let settled = false; const waiting = controller.wait(initial.id).then(value => { settled = true; return value; });
  await new Promise(resolve => setImmediate(resolve)); assert.equal(settled, false);
  for (const hold of pending) hold.resolve({stopReason: 'completed', output: 'late output'});
  const result = await waiting; assert.equal(result.status, 'cancelled'); assert.equal(pending.length, 3);
  assert.ok(result.nodes.filter(node => node.kind === 'task').every(node => node.status === 'cancelled'));
  assert.equal(result.nodes.some(node => node.title === 'Review completed work'), false);
});

test('deadline aborts running children and terminal status waits for them to settle', async () => {
  let now = 0; const pending = []; let aborted = 0;
  const fake = adapter([task('a', 'researcher'), task('b', 'explorer')], request => { const hold = deferred(); pending.push(hold); request.signal.addEventListener('abort', () => aborted++); return hold.promise; });
  const controller = new TeamController({execute: fake.execute, now: () => now});
  const initial = controller.start(config({limits: {...config().limits, maxDurationMs: 1000}}));
  await until(() => pending.length === 2);
  now = 1001; pending[0].resolve({stopReason: 'completed', output: 'late'});
  await until(() => aborted === 2);
  assert.equal(controller.snapshot('session-1').finishedAt, undefined);
  pending[1].resolve({stopReason: 'aborted'});
  const result = await controller.wait(initial.id);
  assert.equal(result.status, 'blocked'); assert.match(result.message, /deadline/i);
});

test('wall clock deadline fires even when no execute call completes', async () => {
  const fake = adapter([task('a')], request => new Promise(resolve => request.signal.addEventListener('abort', () => resolve({stopReason: 'aborted'}), {once: true})));
  const controller = new TeamController({execute: fake.execute});
  const result = await controller.wait(controller.start(config({limits: {...config().limits, maxDurationMs: 1000}})).id);
  assert.equal(result.status, 'blocked'); assert.match(result.message, /deadline/i);
});

test('sessions are isolated, duplicate starts are rejected, and disposal drains all sessions', async () => {
  const pending = []; const fake = adapter([task('a')], request => { const hold = deferred(); pending.push(hold); request.signal.addEventListener('abort', () => hold.resolve({stopReason: 'aborted'})); return hold.promise; });
  const controller = new TeamController({execute: fake.execute});
  const one = controller.start(config()), two = controller.start(config({sessionId: 'session-2'}));
  assert.throws(() => controller.start(config()), /already active/);
  await until(() => pending.length === 2);
  controller.cancel('session-1', one.id); const first = await controller.wait(one.id);
  assert.equal(first.status, 'cancelled'); assert.equal(controller.snapshot('session-2').status, 'running');
  await controller.dispose(); assert.equal((await controller.wait(two.id)).status, 'cancelled');
  assert.throws(() => controller.start(config()), /disposed/);
});

test('cancellation before runner starts never calls execute', async () => {
  const fake = adapter(); const controller = new TeamController({execute: fake.execute}); const initial = controller.start(config());
  controller.cancel('session-1', initial.id);
  assert.equal((await controller.wait(initial.id)).status, 'cancelled'); assert.equal(fake.calls.length, 0);
});

test('retained runs, output, graph data and displayed strings are bounded', async () => {
  const fake = adapter(Array.from({length: 12}, (_, index) => task(`t${index}`, 'researcher')), request => ({stopReason: 'completed', childId: 'child'.repeat(100), output: [{type: 'text', text: 'abc\u202e\u0000'.repeat(6000)}]}));
  const controller = new TeamController({execute: fake.execute});
  for (let index = 0; index < RETENTION_LIMITS.runs + 3; index++) await controller.wait(controller.start(config({sessionId: `session-${index}`, reviewPlan: false})).id);
  assert.equal(controller.snapshot('session-0'), null);
  assert.ok(controller.runs.size <= RETENTION_LIMITS.runs);
  const result = controller.snapshot(`session-${RETENTION_LIMITS.runs + 2}`);
  assert.equal(result.status, 'completed');
  assert.ok(result.nodes.reduce((sum, node) => sum + (node.output?.length || 0), 0) <= RETENTION_LIMITS.outputPerRun);
  assert.ok(result.nodes.every(node => (node.output?.length || 0) <= RETENTION_LIMITS.outputPerNode && (node.childId?.length || 0) <= 160));
  assert.ok(result.nodes.length <= RETENTION_LIMITS.nodes); assert.ok(result.edges.length <= RETENTION_LIMITS.edges); assert.ok(result.events.length <= RETENTION_LIMITS.events);
  assert.doesNotMatch(JSON.stringify(result), /\u202e|\u0000/);
  await assert.rejects(controller.wait('unknown'), /Unknown/);
});

test('missing role token ceilings normalize to 4096 and defaults remain conservative', () => {
  const noTokens = Object.fromEntries(Object.entries(roles).map(([role, model]) => [role, {provider: model.provider, model: model.model}]));
  const validated = validateTeamConfig({sessionId: 's', goal: 'Check', roles: noTokens});
  assert.deepEqual(validated.limits, {concurrency: 2, maxAgents: 12, maxTasks: 8, maxRetries: 1, maxDurationMs: 600000, maxStepsPerAgent: 8});
  assert.ok(Object.values(validated.roles).every(model => model.maxTokens === 4096));
  assert.throws(() => validateTeamConfig(config({roles: {...roles, worker: {...roles.worker, maxTokens: 32769}}})));
});

test('nonretryable host guard errors never retry and remain blocked', async () => {
  for (const deniedRole of ['planner', 'worker']) {
    let deniedCalls = 0;
    const fake = adapter();
    const controller = new TeamController({execute: request => {
      if (request.role === deniedRole) { deniedCalls++; const error = new Error('Host permissions prevent this action'); error.retryable = false; error.code = 'HOST_GUARD_DENIED'; throw error; }
      return fake.execute(request);
    }});
    const result = await controller.wait(controller.start(config()).id);
    assert.equal(result.status, 'blocked'); assert.equal(deniedCalls, 1);
    assert.equal(result.nodes.find(node => node.role === deniedRole).status, 'blocked');
    assert.equal(result.edges.some(edge => edge.kind === 'retry'), false);
  }
});

test('plan revision budget and explicit blocked plan verdict stop before task dispatch', async () => {
  for (const verdict of ['revise', 'blocked']) {
    const fake = adapter();
    const controller = new TeamController({execute: request => request.role === 'reviewer' ? completed({verdict, summary: 'Need more scope details', issues: [{taskId: 'write', message: 'Specify scope'}]}) : fake.execute(request)});
    const result = await controller.wait(controller.start(config({limits: {...config().limits, maxRetries: 1}})).id);
    assert.equal(result.status, 'blocked'); assert.equal(fake.calls.filter(call => call.role === 'planner').length, verdict === 'revise' ? 2 : 1);
    assert.equal(fake.calls.filter(call => call.role === 'coordinator').length, verdict === 'revise' ? 2 : 1);
    assert.equal(fake.calls.some(call => call.role === 'worker'), false);
    assert.ok(result.edges.some(edge => edge.kind === 'feedback'));
    if (verdict === 'revise') assert.ok(result.edges.some(edge => edge.kind === 'retry'));
  }
});

test('invalid router response fails closed', async () => {
  let calls = 0;
  const controller = new TeamController({execute: () => { calls++; return completed({route: 'execute', summary: 'Skip the plan'}); }});
  const result = await controller.wait(controller.start(config({routeEnabled: true})).id);
  assert.equal(result.status, 'failed'); assert.equal(calls, 1);
});

test('validation never invokes custom methods attached to untrusted arrays', () => {
  let invoked = false; const tasks = [task('a')]; tasks.map = () => { invoked = true; return []; };
  assert.throws(() => validatePlan(plan(tasks))); assert.equal(invoked, false);
  const sparse = new Array(1); assert.throws(() => validatePlan(plan(sparse)));
});

test('active sessions are bounded and invalid starts never invoke the adapter', async () => {
  const fake = adapter(); const controller = new TeamController({execute: fake.execute});
  assert.throws(() => controller.start(config({limits: {maxAgents: 99}})));
  for (let i = 0; i < RETENTION_LIMITS.runs; i++) controller.start(config({sessionId: `active-${i}`}));
  assert.throws(() => controller.start(config({sessionId: 'overflow'})), /Too many active/);
  assert.equal(fake.calls.length, 0); await controller.dispose(); assert.equal(fake.calls.length, 0);
});

test('non-Error adapter throws are handled without orphaning a run', async () => {
  const controller = new TeamController({execute: () => { throw null; }});
  const result = await controller.wait(controller.start(config()).id);
  assert.equal(result.status, 'failed'); assert.equal(result.nodes[0].status, 'failed');
});

test('host child binding is visible during execution and late callbacks cannot mutate terminal snapshots', async () => {
  const hold = deferred(); let liveRequest;
  const fake = adapter([task('a')], request => { liveRequest = request; request.onChildStart('verified-host-child'); return hold.promise; });
  const controller = new TeamController({execute: fake.execute}); const initial = controller.start(config());
  await until(() => !!liveRequest);
  const live = controller.snapshot('session-1'); const work = live.nodes.find(node => node.kind === 'task');
  assert.equal(work.status, 'running'); assert.equal(work.childId, 'verified-host-child');
  assert.ok(live.events.some(event => event.type === 'child_started' && event.nodeId === work.id));
  liveRequest.onChildStart('second-id');
  assert.equal(controller.snapshot('session-1').nodes.find(node => node.kind === 'task').childId, 'verified-host-child');
  hold.resolve({stopReason: 'completed', output: 'Verified work'});
  await controller.wait(initial.id); const terminal = controller.snapshot('session-1');
  liveRequest.onChildStart('late-id'); assert.deepEqual(controller.snapshot('session-1'), terminal);
});

test('plan reviewer sees the coordinator final DAG and blocks introduced work before any dispatch', async () => {
  const calls = [];
  const initialPlan = plan([task('original', 'researcher')]);
  const changedPlan = plan([task('introduced', 'worker')]);
  const controller = new TeamController({execute: async request => {
    calls.push(request);
    if (request.role === 'planner') return completed(initialPlan);
    if (request.role === 'coordinator') return completed(changedPlan);
    if (request.role === 'reviewer') {
      assert.match(request.prompt, /final executable plan/);
      assert.match(request.prompt, /"id":"introduced"/);
      assert.doesNotMatch(request.prompt, /"id":"original"/);
      return completed({verdict: 'blocked', summary: 'The introduced change is outside scope', issues: [{taskId: 'introduced', message: 'Do not dispatch this change'}]});
    }
    assert.fail('Task must not execute before final-plan approval');
  }});
  const result = await controller.wait(controller.start(config()).id);
  assert.deepEqual(calls.map(call => call.role), ['planner', 'coordinator', 'reviewer']);
  assert.equal(result.status, 'blocked'); assert.equal(result.nodes.some(node => node.kind === 'task'), false);
  const coordinated = result.nodes.find(node => node.kind === 'coordination'), reviewed = result.nodes.find(node => node.kind === 'review');
  assert.deepEqual(reviewed.dependsOn, [coordinated.id]);
});

test('every task and task retry receives the original goal verbatim', async () => {
  const goal = 'Keep exact context:\nDo not change billing.  Preserve these spaces.';
  let workerAttempts = 0;
  const fake = adapter([task('r', 'researcher'), task('e', 'explorer'), task('w', 'worker')], request => {
    assert.ok(request.prompt.includes(`Original goal:\n${goal}\nTask:\n`));
    return request.role === 'worker' && workerAttempts++ === 0 ? {stopReason: 'error'} : {stopReason: 'completed', output: 'Actual evidence'};
  });
  const controller = new TeamController({execute: fake.execute});
  const result = await controller.wait(controller.start(config({goal})).id);
  assert.equal(result.status, 'completed'); assert.equal(workerAttempts, 2);
  assert.equal(fake.calls.filter(call => ['worker', 'explorer', 'researcher'].includes(call.role)).length, 4);
});
