import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// Compile this pure module directly so tests cannot accidentally pass against an old client bundle.
const result = await build({ entryPoints: [new URL('../client/team-live.ts', import.meta.url).pathname], bundle: true, write: false, format: 'esm', platform: 'node', target: 'es2022' });
const { resolveNodeModel, shouldAnimateNode, advanceRelationCursor } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const visible = { visible: true, stale: false };
const node = (overrides = {}) => ({ id: 'work-1', role: 'worker', kind: 'task', status: 'running', title: 'Fixture task', attempt: 1, dependsOn: [], ...overrides });
const edge = (overrides = {}) => ({ id: 'edge-1', from: 'plan-1', to: 'work-1', kind: 'dispatch', ...overrides });
const event = (seq, overrides = {}) => ({ seq, at: '2026-10-11T00:00:00Z', type: 'relation_activated', message: 'Fixture activation', edgeId: 'edge-1', fromNodeId: 'plan-1', toNodeId: 'work-1', kind: 'dispatch', ...overrides });
const snapshot = (events = [], overrides = {}) => ({ id: 'run-a', status: 'running', nodes: [node()], edges: [edge()], events, roles: { worker: { provider: 'base-provider', model: 'startup-model' } }, ...overrides });
const route = (nodeId, model, overrides = {}) => ({ nodeId, role: 'worker', lane: 'high', tier: 'strong', provider: 'route-provider', model, reason: 'Fixture route', ...overrides });
const withRoutes = decisions => snapshot([], { production: { routing: { enabled: true, decisions } } });
const start = (value = snapshot([event(1)]), options = visible) => advanceRelationCursor(null, value, options).cursor;
const seqs = result => result.events.map(event => event.seq);

test('routing uses the latest decision matching the exact node, not the latest role route', () => {
  const value = withRoutes([route('work-1', 'first'), route('work-1', 'actual'), route('work-2', 'unrelated-latest')]);
  const selected = resolveNodeModel(value, node());
  assert.deepEqual(selected.selection, { provider: 'route-provider', model: 'actual' });
  assert.equal(selected.source, 'routing');
  assert.equal(selected.decision.nodeId, 'work-1');
  assert.match(selected.label, /本节点选定模型/);
});

test('unmatched nodes use explicitly labelled startup base, without borrowing another dispatch', () => {
  const selected = resolveNodeModel(withRoutes([route('work-2', 'strong-neighbor')]), node());
  assert.deepEqual(selected.selection, { provider: 'base-provider', model: 'startup-model' });
  assert.equal(selected.source, 'startup-base');
  assert.equal(selected.decision, undefined);
  assert.match(selected.label, /启动时基础配置.*未报告本节点选择/);
  assert.equal(resolveNodeModel(null, node()), undefined);
});

test('routing excludes Jev and host verification even if a node-matching route exists', () => {
  const value = withRoutes([route('work-1', 'wrong-for-service')]);
  for (const changes of [{ role: 'jev', kind: 'jev_classify' }, { role: 'jev', kind: 'jev_step' }, { role: 'jev', kind: 'verification' }, { kind: 'verification' }, { kind: 'jev_step' }]) {
    assert.equal(resolveNodeModel(value, node(changes)), undefined);
  }
});

test('routing preserves the actual per-node dispatch when routing is now disabled', () => {
  const value = withRoutes([route('work-1', 'actual')]); value.production.routing.enabled = false;
  assert.equal(resolveNodeModel(value, node()).selection.model, 'actual');
  assert.equal(resolveNodeModel(value, node({ id: 'retry-node', taskId: 'work-1', attempt: 2 })).source, 'startup-base');
});

test('node animation requires running node, active run, visible view, and fresh snapshot', () => {
  for (const status of ['planning', 'running', 'reviewing']) assert.equal(shouldAnimateNode(node(), status, visible), true);
  for (const status of ['completed', 'unverified', 'blocked', 'failed', 'cancelled']) assert.equal(shouldAnimateNode(node(), status, visible), false);
  for (const status of ['pending', 'completed', 'failed', 'blocked', 'cancelled']) assert.equal(shouldAnimateNode(node({ status }), 'running', visible), false);
  assert.equal(shouldAnimateNode(node(), 'running', { ...visible, visible: false }), false);
  assert.equal(shouldAnimateNode(node(), 'running', { ...visible, stale: true }), false);
});

test('Jev animates only actual classify and step calls; verification never animates', () => {
  for (const kind of ['jev_classify', 'jev_step']) assert.equal(shouldAnimateNode(node({ role: 'jev', kind }), 'running', visible), true);
  for (const kind of ['verification', 'task', 'review', 'plan', 'coordination']) assert.equal(shouldAnimateNode(node({ role: 'jev', kind }), 'running', visible), false);
  assert.equal(shouldAnimateNode(node({ role: 'reviewer', kind: 'verification' }), 'running', visible), false);
});

test('first mount baselines history and later polls return only new relation activations once', () => {
  const initial = advanceRelationCursor(null, snapshot([event(1), event(2)]), visible);
  assert.equal(initial.baseline, true); assert.deepEqual(seqs(initial), []); assert.equal(initial.cursor.seq, 2);
  const updated = snapshot([event(1), event(2), event(3)]);
  const next = advanceRelationCursor(initial.cursor, updated, visible);
  assert.equal(next.baseline, false); assert.deepEqual(seqs(next), [3]);
  assert.deepEqual(seqs(advanceRelationCursor(next.cursor, updated, visible)), []);
});

test('empty mount allows the first explicit event, while null snapshots preserve watermarks and require a new baseline', () => {
  const cursor = start(snapshot());
  assert.deepEqual(seqs(advanceRelationCursor(cursor, snapshot([event(1)]), visible)), [1]);
  const cleared = advanceRelationCursor(cursor, null, visible);
  assert.equal(cleared.cursor.seq, cursor.seq); assert.equal(cleared.cursor.visible, false); assert.equal(cleared.baseline, true);
  assert.deepEqual(seqs(advanceRelationCursor(cleared.cursor, snapshot([event(1)]), visible)), []);
});

test('run switches and returning to a former run establish new baselines regardless of sequence', () => {
  const cursor = start(snapshot([event(1), event(2)]));
  const other = advanceRelationCursor(cursor, snapshot([event(1)], { id: 'run-b' }), visible);
  assert.equal(other.baseline, true); assert.deepEqual(seqs(other), []); assert.equal(other.cursor.runId, 'run-b'); assert.equal(other.cursor.seq, 1);
  const returned = advanceRelationCursor(other.cursor, snapshot([event(1), event(2), event(3)]), visible);
  assert.equal(returned.baseline, true); assert.deepEqual(seqs(returned), []);
  assert.deepEqual(seqs(advanceRelationCursor(returned.cursor, snapshot([event(1), event(2), event(3), event(4)]), visible)), [4]);
});

test('explicit refresh revision consumes pending events without replaying them', () => {
  const cursor = start();
  const refreshed = advanceRelationCursor(cursor, snapshot([event(1), event(2)]), { ...visible, revision: 1 });
  assert.equal(refreshed.baseline, true); assert.deepEqual(seqs(refreshed), []);
  const next = advanceRelationCursor(refreshed.cursor, snapshot([event(1), event(2), event(3)]), { ...visible, revision: 1 });
  assert.deepEqual(seqs(next), [3]);
});

for (const suspension of ['hidden', 'stale']) {
  test(`${suspension} intervals and the first recovery snapshot never replay missed events`, () => {
    const paused = suspension === 'hidden' ? { visible: false, stale: false } : { visible: true, stale: true };
    const cursor = start();
    const suspended = advanceRelationCursor(cursor, snapshot([event(1), event(2)]), paused);
    assert.equal(suspended.baseline, true); assert.deepEqual(seqs(suspended), []);
    const recovered = advanceRelationCursor(suspended.cursor, snapshot([event(1), event(2), event(3)]), visible);
    assert.equal(recovered.baseline, true); assert.deepEqual(seqs(recovered), []);
    const after = advanceRelationCursor(recovered.cursor, snapshot([event(1), event(2), event(3), event(4)]), visible);
    assert.deepEqual(seqs(after), [4]);
  });
}

test('relations are never inferred from node status changes, dependency lists, or newly added edges', () => {
  const cursor = start(snapshot());
  const value = snapshot([event(1, { type: 'node_started' }), event(2, { type: 'node_completed' })], { nodes: [node({ status: 'completed', dependsOn: ['plan-1'] })], edges: [edge(), edge({ id: 'new-edge' })] });
  const next = advanceRelationCursor(cursor, value, visible);
  assert.deepEqual(seqs(next), []); assert.equal(next.cursor.seq, 2);
});

test('relation payload must exactly match an actual snapshot edge id, endpoints, and kind', () => {
  const invalid = [
    { edgeId: undefined }, { edgeId: 'unknown' }, { fromNodeId: 'wrong' }, { toNodeId: 'wrong' },
    { kind: 'dependency' }, { kind: undefined }, { kind: 'invented' }, { runId: 'different-run' },
  ];
  const value = snapshot(invalid.map((changes, index) => event(index + 2, changes)).concat(event(invalid.length + 2)));
  const result = advanceRelationCursor(start(), value, visible);
  assert.deepEqual(seqs(result), [invalid.length + 2]);
  assert.equal(result.cursor.seq, invalid.length + 2);
});

test('matching activation without its edge is consumed and cannot animate if the edge arrives later', () => {
  const value = snapshot([event(1), event(2)], { edges: [] });
  const noEdge = advanceRelationCursor(start(), value, visible);
  assert.deepEqual(seqs(noEdge), []);
  const laterEdge = advanceRelationCursor(noEdge.cursor, { ...value, edges: [edge()] }, visible);
  assert.deepEqual(seqs(laterEdge), []);
});

test('all supported relation kinds use their real endpoint pair including retries', () => {
  for (const kind of ['dispatch', 'dependency', 'feedback', 'retry', 'join']) {
    const relation = edge({ kind, from: 'work-1', to: 'work-2' });
    const update = snapshot([event(1), event(2, { kind, fromNodeId: 'work-1', toNodeId: 'work-2' })], { edges: [relation] });
    assert.deepEqual(seqs(advanceRelationCursor(start(), update, visible)), [2]);
  }
});

test('duplicate sequences are consumed once and input order does not create fake gaps', () => {
  const value = snapshot([event(3), event(1), event(2), event(3)]);
  const copy = structuredClone(value);
  const next = advanceRelationCursor(start(), value, visible);
  assert.deepEqual(seqs(next), [2, 3]); assert.equal(next.notice, undefined);
  assert.deepEqual(value, copy);
});

test('new sequence gaps rebaseline the whole batch, disclose missing events, and allow future contiguous events', () => {
  const next = advanceRelationCursor(start(), snapshot([event(1), event(3), event(4)]), visible);
  assert.equal(next.baseline, true); assert.deepEqual(seqs(next), []); assert.match(next.notice, /缺失/); assert.equal(next.cursor.seq, 4);
  const recovered = advanceRelationCursor(next.cursor, snapshot([event(1), event(3), event(4), event(5)]), visible);
  assert.deepEqual(seqs(recovered), [5]); assert.match(recovered.notice, /不完整|缺失/);
});

test('sequence regression never lowers the cursor or replays previously consumed sequence numbers', () => {
  const cursor = start(snapshot([event(1), event(2), event(3)]));
  const old = advanceRelationCursor(cursor, snapshot([event(1)]), visible);
  assert.equal(old.baseline, true); assert.equal(old.cursor.seq, 3); assert.match(old.notice, /回退/);
  const restored = advanceRelationCursor(old.cursor, snapshot([event(1), event(2), event(3)]), visible);
  assert.deepEqual(seqs(restored), []);
  const newer = advanceRelationCursor(restored.cursor, snapshot([event(1), event(2), event(3), event(4)]), visible);
  assert.deepEqual(seqs(newer), [4]);
});

test('truncated history and oldest sequence are disclosed without suppressing safely contiguous new events', () => {
  const initial = advanceRelationCursor(null, snapshot([event(40), event(41)], { eventsTruncated: true, oldestSeq: 40 }), visible);
  assert.equal(initial.baseline, true); assert.deepEqual(seqs(initial), []); assert.match(initial.notice, /截断/);
  const next = advanceRelationCursor(initial.cursor, snapshot([event(41), event(42)], { eventsTruncated: true, oldestSeq: 41 }), visible);
  assert.deepEqual(seqs(next), [42]); assert.match(next.notice, /截断/);
  const missing = advanceRelationCursor(next.cursor, snapshot([event(46), event(47)], { oldestSeq: 46 }), visible);
  assert.equal(missing.baseline, true); assert.deepEqual(seqs(missing), []); assert.match(missing.notice, /缺失/);
});

test('truncation and gaps are visible on first mount even without explicit metadata', () => {
  for (const value of [snapshot([event(5), event(6)]), snapshot([event(1), event(3)]), snapshot([], { eventsTruncated: true }), snapshot([], { oldestSeq: 10 })]) {
    const result = advanceRelationCursor(null, value, visible);
    assert.equal(result.baseline, true); assert.deepEqual(seqs(result), []); assert.match(result.notice, /不完整|截断/);
  }
});

test('malformed sequences cannot generate activations and require a fresh baseline', () => {
  for (const seq of [NaN, Infinity, 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '2']) {
    const result = advanceRelationCursor(start(), snapshot([event(1), event(seq), event(2)]), visible);
    assert.equal(result.baseline, true); assert.deepEqual(seqs(result), []); assert.match(result.notice, /缺失/);
  }
});

test('a history warning does not leak between runs and helper leaves prior cursor immutable', () => {
  const cursor = advanceRelationCursor(start(), snapshot([event(1), event(3)]), visible).cursor;
  const copy = structuredClone(cursor);
  const next = advanceRelationCursor(cursor, snapshot([event(1)], { id: 'other-run' }), visible);
  assert.equal(next.notice, undefined); assert.deepEqual(cursor, copy);
});


test('returning to a previously observed run preserves its watermark even if the return snapshot is older', () => {
  const original = start(snapshot([event(1), event(2), event(3)]));
  const other = advanceRelationCursor(original, snapshot([event(1)], { id: 'run-b' }), visible);
  const returned = advanceRelationCursor(other.cursor, snapshot([event(1)]), visible);
  assert.equal(returned.baseline, true); assert.equal(returned.cursor.seq, 3);
  const catchingUp = advanceRelationCursor(returned.cursor, snapshot([event(1), event(2), event(3)]), visible);
  assert.deepEqual(seqs(catchingUp), []);
  assert.deepEqual(seqs(advanceRelationCursor(catchingUp.cursor, snapshot([event(1), event(2), event(3), event(4)]), visible)), [4]);
});

test('run IDs cannot collide with inherited object keys in the sequence ledger', () => {
  const original = start(snapshot([event(1)], { id: '__proto__' }));
  const other = advanceRelationCursor(original, snapshot([event(1)], { id: 'constructor' }), visible);
  assert.equal(other.cursor.seq, 1);
  assert.deepEqual(seqs(advanceRelationCursor(other.cursor, snapshot([event(1), event(2)], { id: 'constructor' }), visible)), [2]);
  const returned = advanceRelationCursor(other.cursor, snapshot([event(1)], { id: '__proto__' }), visible);
  assert.equal(returned.cursor.seq, 1);
});

test('an oldestSeq claim cannot hide missing initial events in the visible stream', () => {
  const result = advanceRelationCursor(null, snapshot([event(5), event(6)], { oldestSeq: 1 }), visible);
  assert.deepEqual(seqs(result), []); assert.match(result.notice, /不完整|截断/);
});


test('initial null has no cursor and a null refresh cannot replay an older same-run snapshot', () => {
  assert.equal(advanceRelationCursor(null, null, visible).cursor, null);
  assert.equal(advanceRelationCursor(undefined, undefined, visible).cursor, null);
  const initial = start(snapshot([event(1)]));
  const latest = advanceRelationCursor(initial, snapshot([event(1), event(2), event(3)]), visible);
  assert.deepEqual(seqs(latest), [2, 3]);
  const saved = structuredClone(latest.cursor);
  const cleared = advanceRelationCursor(latest.cursor, null, { ...visible, revision: 1 });
  const stillEmpty = advanceRelationCursor(cleared.cursor, null, { ...visible, revision: 1 });
  assert.equal(stillEmpty.cursor.seq, 3); assert.deepEqual(stillEmpty.cursor.highWaterByRun, saved.highWaterByRun);
  assert.equal(stillEmpty.cursor.visible, false); assert.deepEqual(latest.cursor, saved);
  const older = advanceRelationCursor(stillEmpty.cursor, snapshot([event(1)]), { ...visible, revision: 1 });
  assert.equal(older.baseline, true); assert.deepEqual(seqs(older), []); assert.equal(older.cursor.seq, 3);
  const caughtUp = advanceRelationCursor(older.cursor, snapshot([event(1), event(2), event(3)]), { ...visible, revision: 1 });
  assert.deepEqual(seqs(caughtUp), []);
  const newer = advanceRelationCursor(caughtUp.cursor, snapshot([event(1), event(2), event(3), event(4)]), { ...visible, revision: 1 });
  assert.deepEqual(seqs(newer), [4]);
});

test('null navigation preserves watermarks for other previously viewed runs', () => {
  const original = start(snapshot([event(1), event(2), event(3)]));
  const other = advanceRelationCursor(original, snapshot([event(1)], { id: 'run-b' }), visible);
  const cleared = advanceRelationCursor(other.cursor, null, visible);
  const returned = advanceRelationCursor(cleared.cursor, snapshot([event(1)]), visible);
  assert.equal(returned.baseline, true); assert.equal(returned.cursor.seq, 3);
  assert.deepEqual(seqs(advanceRelationCursor(returned.cursor, snapshot([event(1), event(2), event(3)]), visible)), []);
});
