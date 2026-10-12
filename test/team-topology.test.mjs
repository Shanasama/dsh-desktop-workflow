import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

// These are component regression tests, not browser automation. Compile source
// in memory so they cannot accidentally pass against an out-of-date lib bundle.
const result = await build({
  stdin: {
    contents: "export * from './client/TeamView'; export { teamDemoSnapshot } from './client/team-demo';",
    resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'tsx',
  },
  bundle: true, write: false, format: 'cjs', platform: 'node', target: 'es2022',
  jsx: 'automatic', external: ['react', 'react/jsx-runtime'], loader: { '.css': 'text' },
});
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost', pretendToBeVisual: true });
Object.assign(globalThis, {
  window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement,
  Node: dom.window.Node, Event: dom.window.Event, MouseEvent: dom.window.MouseEvent,
  IS_REACT_ACT_ENVIRONMENT: true,
});
HTMLElement.prototype.scrollIntoView = function () {};
let visible = true;
Object.defineProperty(document, 'visibilityState', { get: () => visible ? 'visible' : 'hidden' });
const React = await import('react');
const { act } = React;
const { createRoot } = await import('react-dom/client');
const compiled = { exports: {} };
vm.runInThisContext(`(function(require, module, exports) { ${result.outputFiles[0].text}\n})`)(createRequire(import.meta.url), compiled, compiled.exports);
const { TeamView, createDefaultTeamSettings, teamDemoSnapshot, topologyCardForNode, resolveTopologyRelation, routeTopologyPath } = compiled.exports;

const rect = (x, y, width, height) => ({ x, y, left: x, top: y, width, height, right: x + width, bottom: y + height, toJSON() { return this; } });
const positions = {
  jev: [350, 25], planner: [40, 240], reviewer: [660, 240], coordinator: [350, 240],
  researcher: [40, 500], explorer: [350, 500], worker: [660, 500], verification: [350, 760],
};
let mapWidth = 960;
let cardPositions = positions;
HTMLElement.prototype.getBoundingClientRect = function () {
  if (this.classList.contains('tm-topology-map')) return rect(20, 30, mapWidth, 1010);
  const position = cardPositions[this.dataset.topologyCard];
  if (position) return rect(20 + position[0] * mapWidth / 960, 30 + position[1], 240 * mapWidth / 960, 200);
  return rect(0, 0, 0, 0);
};
const catalog = {
  available: true, jev: { configured: true, available: true, mode: 'live' },
  providers: [{ id: 'p', name: 'Fixture provider', models: [
    { id: 'startup', name: 'Startup Base' }, { id: 'fast', name: 'Fast Model' },
    { id: 'deep', name: 'Deep Model' }, { id: 'different', name: 'Unrelated Latest Model' },
  ] }],
};
const node = (id, role, overrides = {}) => ({ id, role, kind: 'task', title: `Task ${id}`, attempt: 1, dependsOn: [], status: 'running', ...overrides });
const edge = (id, from, to, kind = 'dispatch') => ({ id, from, to, kind });
function snapshot(overrides = {}) {
  const base = teamDemoSnapshot();
  return {
    ...base, demo: false, id: 'topology-run', sessionId: 's', status: 'running', events: [],
    roles: Object.fromEntries(Object.keys(base.roles).map(role => [role, { provider: 'p', model: 'startup' }])),
    nodes: [
      node('plan-done', 'planner', { kind: 'plan', status: 'completed' }),
      node('coord-run', 'coordinator', { kind: 'coordination' }),
      node('research-a', 'researcher'), node('research-b', 'researcher'),
      node('explorer-run', 'explorer'), node('worker-run', 'worker'),
      node('worker-retry', 'worker', { taskId: 'worker-run', attempt: 2 }),
      node('base-only', 'worker', { status: 'pending' }),
      node('review-run', 'reviewer', { kind: 'review' }),
      node('jev-now', 'jev', { kind: 'jev_step' }),
      node('verify-now', 'jev', { kind: 'verification' }),
    ],
    edges: [
      edge('dispatch', 'coord-run', 'worker-run'),
      edge('cross-dependency', 'research-a', 'explorer-run', 'dependency'),
      edge('feedback', 'review-run', 'plan-done', 'feedback'),
      edge('retry', 'worker-run', 'worker-retry', 'retry'),
      edge('same-role', 'research-a', 'research-b', 'dependency'),
      edge('verification', 'worker-run', 'verify-now'),
      edge('join', 'verify-now', 'coord-run', 'join'),
    ],
    jev: { ...base.jev, mode: 'live' },
    production: {
      routing: { enabled: true, decisions: [
        { nodeId: 'research-a', role: 'researcher', lane: 'medium', tier: 'strong', provider: 'p', model: 'different', reason: 'Superseded route' },
        { nodeId: 'research-a', role: 'researcher', lane: 'small', tier: 'weak', provider: 'p', model: 'fast', reason: 'Bounded lookup fits the small lane' },
        { nodeId: 'research-b', role: 'researcher', lane: 'high', tier: 'strong', provider: 'p', model: 'deep', reason: 'Cross-project reasoning needs the high lane' },
        { nodeId: 'unrelated-node', role: 'researcher', lane: 'high', tier: 'strong', provider: 'p', model: 'different', reason: 'Different task must not overwrite these nodes' },
      ] },
      budget: { enabled: false, limit: 0, spent: 0, reserved: 0, remaining: null, halted: null, physicalCalls: 0, unknownUsageCalls: 0 },
      trace: { enabled: false, eventCount: 0, truncated: false },
    },
    ...overrides,
  };
}
function relation(seq, edgeId = 'dispatch', overrides = {}) {
  const actual = snapshot().edges.find(item => item.id === edgeId);
  assert.ok(actual, `Fixture edge ${edgeId}`);
  return { seq, at: '2026-10-11T09:30:00Z', type: 'relation_activated', message: `Actual ${actual.kind} event`, edgeId, fromNodeId: actual.from, toNodeId: actual.to, kind: actual.kind, ...overrides };
}
const ordinary = seq => ({ seq, at: '2026-10-11T09:30:00Z', type: 'node_started', nodeId: 'worker-run', message: 'Ordinary event advances the same cursor' });
function mount(initial = {}) {
  visible = true; mapWidth = 960; cardPositions = positions;
  const root = createRoot(document.getElementById('root'));
  let props = { snapshot: snapshot(), catalog, sessionId: 's', settings: createDefaultTeamSettings(), configured: true, onOpenSettings() {}, onCancel() {}, onRefresh() {}, onDemo() {}, ...initial };
  return {
    async render(change = {}) { props = { ...props, ...change }; await act(async () => root.render(React.createElement(TeamView, props))); },
    async unmount() { await act(async () => root.unmount()); },
  };
}
const topologyCard = role => document.querySelector(`[data-topology-card="${role}"]`);
const roleTask = id => document.querySelector(`.tm-role-task[data-node-id="${id}"]`);
const overlays = () => [...document.querySelectorAll('.tm-topology-relation')];
const selfEvents = () => [...document.querySelectorAll('.tm-topology-self-event')];
const pulseCount = () => overlays().length + selfEvents().length;
async function click(element) { assert.ok(element); await act(async () => element.click()); }
async function visibility(value) { await act(async () => { visible = value; document.dispatchEvent(new Event('visibilitychange')); }); }
function assertNoStaticAnimation() {
  assert.ok(document.querySelectorAll('.tm-topology-wires').length > 0);
  assert.equal(document.querySelectorAll('.tm-topology-wires .tm-edge-pulse, .tm-topology-wires .tm-topology-relation, .tm-topology-wires [data-event-key]').length, 0);
}
function assertActualNodeVisible(id) {
  const task = roleTask(id);
  assert.ok(task, `${id} has an actual task row`);
  for (let parent = task; parent; parent = parent.parentElement) {
    assert.equal(parent.hidden, false, `${id} must not be hidden`);
    if (parent.tagName === 'DETAILS') assert.equal(parent.open, true, `${id} must not require expanding historical nodes`);
  }
  return task;
}

// The mapping is an exact-pair resolver, not a lookup in the illustrative org tree.
test('topology node mapping keeps host verification separate from Jev and respects explicit kinds', () => {
  for (const role of ['planner', 'coordinator', 'researcher', 'explorer', 'worker', 'reviewer']) assert.equal(topologyCardForNode(node('one', role)), role);
  for (const kind of ['jev_classify', 'jev_step']) assert.equal(topologyCardForNode(node('service', 'worker', { kind })), 'jev');
  for (const role of ['jev', 'reviewer', 'worker']) assert.equal(topologyCardForNode(node('gate', role, { kind: 'verification' })), 'verification');
  assert.equal(topologyCardForNode(node('jev', 'jev')), 'jev');
});

test('topology relation mapping resolves all kinds and rejects any mismatched actual endpoint evidence', () => {
  const snap = snapshot();
  for (const [id, fromCard, toCard] of [
    ['dispatch', 'coordinator', 'worker'], ['cross-dependency', 'researcher', 'explorer'],
    ['feedback', 'reviewer', 'planner'], ['retry', 'worker', 'worker'],
    ['same-role', 'researcher', 'researcher'], ['verification', 'worker', 'verification'],
    ['join', 'verification', 'coordinator'],
  ]) {
    const event = relation(1, id);
    const mapped = resolveTopologyRelation(snap, event);
    assert.ok(mapped, id);
    assert.equal(mapped.fromCard, fromCard); assert.equal(mapped.toCard, toCard);
    assert.equal(mapped.fromNode.id, event.fromNodeId); assert.equal(mapped.toNode.id, event.toNodeId);
    assert.equal(mapped.kind, event.kind); assert.equal(mapped.edgeId, id);
    assert.equal(mapped.sameCard, fromCard === toCard);
  }
  for (const mismatch of [
    { type: 'node_started' }, { edgeId: 'missing' }, { fromNodeId: 'research-a' },
    { toNodeId: 'verify-now' }, { kind: 'feedback' }, { runId: 'other-run' },
  ]) assert.ok(!resolveTopologyRelation(snap, relation(1, 'dispatch', mismatch)), JSON.stringify(mismatch));
  assert.ok(!resolveTopologyRelation({ ...snap, edges: [] }, relation(1)));
  assert.ok(!resolveTopologyRelation({ ...snap, nodes: snap.nodes.filter(item => item.id !== 'worker-run') }, relation(1)));
});

test('measured topology routes attach to exact cards and cannot cross an unrelated card', () => {
  const cards = Object.fromEntries(Object.entries(positions).map(([id, [left, top]]) => [id, { left, top, right: left + 240, bottom: top + 200 }]));
  const geometry = { width: 960, height: 1010, cards };
  const onBoundary = (point, box) => ((point.x === box.left || point.x === box.right) && point.y >= box.top && point.y <= box.bottom)
    || ((point.y === box.top || point.y === box.bottom) && point.x >= box.left && point.x <= box.right);
  for (const from of Object.keys(cards)) for (const to of Object.keys(cards)) {
    if (from === to) { assert.equal(routeTopologyPath(from, to, geometry), undefined); continue; }
    const route = routeTopologyPath(from, to, geometry);
    assert.ok(route, `${from} -> ${to} has a direct measured route`);
    assert.ok(onBoundary(route.points[0], cards[from]), `${from} origin is on its own card`);
    assert.ok(onBoundary(route.points.at(-1), cards[to]), `${to} destination is on its own card`);
    for (let index = 1; index < route.points.length; index++) {
      const a = route.points[index - 1], b = route.points[index];
      assert.ok(a.x === b.x || a.y === b.y, 'routes remain orthogonal');
      for (const [id, box] of Object.entries(cards)) {
        if (id === from || id === to) continue;
        const intersects = a.x === b.x
          ? a.x > box.left && a.x < box.right && Math.max(a.y, b.y) > box.top && Math.min(a.y, b.y) < box.bottom
          : a.y > box.top && a.y < box.bottom && Math.max(a.x, b.x) > box.left && Math.min(a.x, b.x) < box.right;
        assert.equal(intersects, false, `${from} -> ${to} must not cross unrelated ${id}`);
      }
    }
  }
  assert.equal(routeTopologyPath('researcher', 'explorer', { ...geometry, cards: {} }), undefined);
});

test('every new or historical run opens team topology while task relation navigation remains explicit', async () => {
  const view = mount();
  try {
    for (const status of ['planning', 'running', 'reviewing', 'completed', 'blocked', 'failed', 'cancelled', 'unverified']) {
      await view.render({ snapshot: snapshot({ id: `run-${status}`, status }) });
      assert.equal(document.querySelectorAll('[role=tab]')[0].getAttribute('aria-selected'), 'true', status);
      assert.ok(document.querySelector('.tm-topology'));
      await click(document.querySelectorAll('[role=tab]')[1]);
      assert.equal(document.querySelectorAll('.tm-task-node').length, 11);
    }
    await view.render({ snapshot: null });
    assert.ok(document.querySelector('.tm-topology'));
  } finally { await view.unmount(); }
});

test('default role cards show the active model, lane and reason with expandable distinct concurrent selections', async () => {
  const view = mount();
  try {
    await view.render();
    const research = topologyCard('researcher');
    assert.ok(research.classList.contains('tm-topology-card'));
    const primary = research.querySelector('.tm-role-task');
    assert.ok(primary, 'the main role card carries an actual active node');
    assertActualNodeVisible(primary.dataset.nodeId);
    assert.ok(primary.querySelector('.tm-instance-model')?.textContent);
    assert.ok(primary.querySelector('.tm-instance-source')?.textContent);
    assert.ok(primary.querySelector('.tm-node-route-reason')?.textContent);
    const detail = research.querySelector('details.tm-role-task-list');
    assert.ok(detail, 'concurrent node selections can be expanded');
    await click(detail.querySelector('summary'));
    assert.equal(detail.open, true);
    const first = assertActualNodeVisible('research-a');
    const second = assertActualNodeVisible('research-b');
    assert.ok(research.contains(first)); assert.ok(research.contains(second));
    assert.match(first.querySelector('.tm-instance-model').textContent, /Fast Model/);
    assert.match(first.querySelector('.tm-instance-source').textContent, /small.*weak/);
    assert.match(first.querySelector('.tm-node-route-reason').textContent, /Bounded lookup fits the small lane/);
    assert.match(second.querySelector('.tm-instance-model').textContent, /Deep Model/);
    assert.match(second.querySelector('.tm-instance-source').textContent, /high.*strong/);
    assert.match(second.querySelector('.tm-node-route-reason').textContent, /Cross-project reasoning needs the high lane/);
    assert.doesNotMatch(first.textContent + second.textContent, /Unrelated Latest Model|Superseded route/);
    assert.match(research.querySelector('.tm-role-count').textContent, /2.*并发.*2.*模型/);
    const selectable = detail.querySelector('button.tm-role-task');
    assert.ok(selectable, 'expanded nodes are individually inspectable');
    const selectedModel = selectable.querySelector('.tm-instance-model').textContent;
    await click(selectable);
    assert.ok(document.querySelector('.tm-inspector').textContent.includes(selectedModel));
    assert.ok(document.querySelector('.tm-inspector').textContent.includes(selectable.dataset.nodeId) || document.querySelector('.tm-inspector').textContent.includes('Task ' + selectable.dataset.nodeId));
  } finally { await view.unmount(); }
});

test('unrouted node cards explicitly retain startup provenance rather than borrowing another role dispatch', async () => {
  const snap = snapshot();
  snap.nodes = snap.nodes.map(item => item.id === 'base-only' ? { ...item, status: 'running' } : item);
  snap.production.routing.decisions.push({ nodeId: 'worker-run', role: 'worker', provider: 'p', model: 'deep', lane: 'high', tier: 'strong', reason: 'Only this worker was routed' });
  const view = mount({ snapshot: snap });
  try {
    await view.render();
    const details = topologyCard('worker').querySelector('details.tm-role-task-list');
    if (details && !details.open) await click(details.querySelector('summary'));
    const task = assertActualNodeVisible('base-only');
    assert.match(task.textContent, /Startup Base/);
    assert.match(task.querySelector('.tm-instance-source').textContent, /启动时基础配置.*未报告本节点选择/);
    assert.doesNotMatch(task.textContent, /Deep Model|Only this worker was routed/);
    await view.render({ snapshot: { ...snap, production: { ...snap.production, routing: { ...snap.production.routing, enabled: false } } } });
    assert.match(roleTask('research-a').textContent, /Fast Model/);
    assert.match(roleTask('research-b').textContent, /Deep Model/);
  } finally { await view.unmount(); }
});

test('only running actual roles and Jev calls animate; host verification and completed roles never do', async () => {
  const snap = snapshot(); const view = mount({ snapshot: snap });
  try {
    await view.render();
    assert.equal(topologyCard('researcher').dataset.live, 'true');
    assert.equal(topologyCard('planner').dataset.live, 'false');
    assert.equal(topologyCard('jev').dataset.live, 'true');
    assert.equal(topologyCard('verification').dataset.live, 'false');
    assert.ok(topologyCard('verification').textContent.includes('宿主验证'));
    assert.ok(!topologyCard('jev').contains(document.querySelector('.tm-role-task[data-node-id="verify-now"]')));
    await view.render({ snapshot: { ...snap, nodes: snap.nodes.filter(item => item.id !== 'jev-now') } });
    assert.equal(topologyCard('jev').dataset.live, 'false', 'a running verifier does not light up Jev');
    await view.render({ snapshot: snap, freshness: { stale: true, reason: 'Disconnected fixture' } });
    assert.equal(document.querySelectorAll('[data-topology-card][data-live=true]').length, 0);
    await view.render({ freshness: { stale: false } });
    await visibility(false);
    assert.equal(document.querySelectorAll('[data-topology-card][data-live=true]').length, 0);
    await visibility(true);
    assert.equal(topologyCard('researcher').dataset.live, 'true');
    for (const status of ['completed', 'blocked', 'failed', 'cancelled', 'unverified']) {
      await view.render({ snapshot: { ...snap, status } });
      assert.equal(document.querySelectorAll('[data-topology-card][data-live=true]').length, 0, status);
    }
  } finally { await view.unmount(); }
});

test('fresh actual non-org-tree relation draws only its exact endpoint overlay while static organization wires stay quiet', async () => {
  let snap = snapshot({ events: [ordinary(1)] }); const view = mount({ snapshot: snap });
  try {
    await view.render(); assert.equal(pulseCount(), 0); assertNoStaticAnimation();
    snap = { ...snap, events: [ordinary(1), relation(2, 'cross-dependency')] };
    await view.render({ snapshot: snap });
    assert.equal(overlays().length, 1); assert.equal(selfEvents().length, 0);
    const overlay = overlays()[0];
    assert.equal(overlay.dataset.eventKey, 'topology-run:2');
    assert.equal(overlay.dataset.fromCard, 'researcher'); assert.equal(overlay.dataset.toCard, 'explorer');
    assert.equal(overlay.dataset.kind, 'dependency');
    assert.equal(overlay.dataset.fromNodeId, 'research-a'); assert.equal(overlay.dataset.toNodeId, 'explorer-run');
    assert.match(overlay.textContent, /依赖满足/);
    const path = overlay.querySelector('.tm-topology-relation-line');
    assert.ok(path?.getAttribute('d'), 'actual cards have measured overlay geometry');
    assert.doesNotMatch(path.getAttribute('d'), /NaN|undefined/);
    const initialPath = path.getAttribute('d');
    await act(async () => { mapWidth = 720; window.dispatchEvent(new Event('resize')); });
    const resized = overlays()[0];
    const resizedPath = resized.querySelector('.tm-topology-relation-line');
    assert.notEqual(resizedPath.getAttribute('d'), initialPath, 'responsive overlays remeasure their actual endpoint cards');
    assertNoStaticAnimation();
    await view.render({ snapshot: { ...snap, edges: snap.edges.filter(item => item.id !== 'cross-dependency') } });
    assert.equal(pulseCount(), 0, 'a removed relation cannot remain mapped by role alone');
  } finally { await view.unmount(); }
});

test('null and empty idle topology remeasure static wires on container-only resize and release observers', async () => {
  const previousObserver = globalThis.ResizeObserver;
  const observers = [];
  globalThis.ResizeObserver = class {
    constructor(callback) { this.callback = callback; this.targets = []; this.disconnected = false; observers.push(this); }
    observe(target) { this.targets.push(target); }
    disconnect() { this.disconnected = true; }
  };
  try {
    for (const value of [null, snapshot({ nodes: [], edges: [] })]) {
      const view = mount({ snapshot: value });
      try {
        await view.render();
        const map = document.querySelector('.tm-topology-map');
        const observer = observers.findLast(item => !item.disconnected && item.targets.includes(map));
        assert.ok(observer, 'idle cards need ResizeObserver even before any run exists');
        assert.equal(observer.targets.filter(item => item.hasAttribute('data-topology-card')).length, 7);
        const svg = document.querySelector('.tm-topology-org-relations');
        const before = [...svg.querySelectorAll('path')].map(item => item.getAttribute('d'));
        assert.ok(before.length > 0, 'idle topology has measured static organization wires');
        await act(async () => {
          mapWidth = 720;
          observer.callback([{ target: map, contentRect: { width: 720, height: 1010 } }]);
        });
        assert.equal(svg.getAttribute('width'), '720');
        assert.notDeepEqual([...svg.querySelectorAll('path')].map(item => item.getAttribute('d')), before);
        assert.equal(pulseCount(), 0, 'resizing cannot manufacture relation activity');
        assertNoStaticAnimation();
      } finally { await view.unmount(); }
    }
    assert.ok(observers.every(item => item.disconnected), 'all idle observers are released on unmount');
  } finally {
    if (previousObserver === undefined) delete globalThis.ResizeObserver;
    else globalThis.ResizeObserver = previousObserver;
  }
});

test('theme and layout changes remeasure exact live relation endpoints without another snapshot or resize event', async () => {
  const view = mount();
  try {
    await view.render();
    await view.render({ snapshot: snapshot({ events: [relation(1, 'cross-dependency')] }) });
    const initial = overlays()[0].querySelector('.tm-topology-relation-line').getAttribute('d');
    const select = document.querySelector('select[aria-label="界面风格"]');
    const nextTheme = select.value === 'classic' ? 'arknights' : 'classic';
    await act(async () => {
      mapWidth = 720;
      Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(select, nextTheme);
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    assert.equal(document.querySelector('.tm-root').dataset.theme, nextTheme);
    assert.equal(document.querySelector('.tm-topology-live-relations').getAttribute('width'), '720');
    const themed = overlays()[0].querySelector('.tm-topology-relation-line').getAttribute('d');
    assert.notEqual(themed, initial, 'theme-induced dimensions are read in the layout pass');
    mapWidth = 660;
    await click(document.querySelector('.tm-layout-switch'));
    assert.equal(document.querySelector('.tm-topology-live-relations').getAttribute('width'), '660');
    assert.notEqual(overlays()[0].querySelector('.tm-topology-relation-line').getAttribute('d'), themed);
    assert.equal(overlays().length, 1);
    assert.equal(overlays()[0].dataset.eventKey, 'topology-run:1');
    assert.equal(overlays()[0].dataset.fromNodeId, 'research-a');
    assert.equal(overlays()[0].dataset.toNodeId, 'explorer-run');
  } finally { await view.unmount(); }
});

test('active-first card rearrangement preserves relation identities and routes to newly measured positions', async () => {
  const snap = snapshot(); const view = mount({ snapshot: snap });
  try {
    await view.render();
    const active = { ...snap, events: [relation(1, 'cross-dependency')] };
    await view.render({ snapshot: active });
    const before = overlays()[0].querySelector('.tm-topology-relation-line').getAttribute('d');
    // Simulate CSS reflow after research completes and explorer becomes the first
    // active card. The DOM test supplies geometry rather than running a browser.
    cardPositions = { ...positions, researcher: positions.planner, explorer: positions.researcher, planner: positions.explorer };
    await view.render({ snapshot: { ...active, nodes: active.nodes.map(item => item.role === 'researcher' ? { ...item, status: 'completed' } : item) } });
    assert.equal(topologyCard('researcher').dataset.live, 'false');
    assert.equal(topologyCard('explorer').dataset.live, 'true');
    assert.equal(overlays().length, 1);
    const overlay = overlays()[0];
    assert.equal(overlay.dataset.fromCard, 'researcher'); assert.equal(overlay.dataset.toCard, 'explorer');
    assert.equal(overlay.dataset.fromNodeId, 'research-a'); assert.equal(overlay.dataset.toNodeId, 'explorer-run');
    assert.notEqual(overlay.querySelector('.tm-topology-relation-line').getAttribute('d'), before);
    assertNoStaticAnimation();
  } finally { await view.unmount(); }
});

test('same-role dependency and retry activations stay inside only their actual role card', async () => {
  let snap = snapshot(); const view = mount({ snapshot: snap });
  try {
    await view.render();
    snap = { ...snap, events: [relation(1, 'same-role'), relation(2, 'retry')] };
    await view.render({ snapshot: snap });
    assert.equal(overlays().length, 0, 'same-role activity must not animate a different role edge');
    assert.equal(selfEvents().length, 2);
    const research = selfEvents().find(item => item.dataset.eventKey === 'topology-run:1');
    const worker = selfEvents().find(item => item.dataset.eventKey === 'topology-run:2');
    assert.ok(research && topologyCard('researcher').contains(research));
    assert.ok(worker && topologyCard('worker').contains(worker));
    assert.match(research.textContent, /依赖满足/); assert.match(worker.textContent, /重试/);
    for (const role of ['planner', 'reviewer', 'coordinator', 'explorer', 'jev', 'verification']) assert.equal(topologyCard(role).querySelectorAll('.tm-topology-self-event').length, 0, role);
    assertNoStaticAnimation();
  } finally { await view.unmount(); }
});

test('verification dispatch and completion join use the separate host gate card rather than Jev', async () => {
  const snap = snapshot(); const view = mount({ snapshot: snap });
  try {
    await view.render();
    await view.render({ snapshot: { ...snap, events: [relation(1, 'verification'), relation(2, 'join')] } });
    assert.equal(overlays().length, 2);
    const dispatch = overlays().find(item => item.dataset.eventKey === 'topology-run:1');
    const join = overlays().find(item => item.dataset.eventKey === 'topology-run:2');
    assert.equal(dispatch.dataset.fromCard, 'worker'); assert.equal(dispatch.dataset.toCard, 'verification');
    assert.equal(join.dataset.fromCard, 'verification'); assert.equal(join.dataset.toCard, 'coordinator');
    assert.equal(overlays().some(item => item.dataset.fromCard === 'jev' || item.dataset.toCard === 'jev'), false);
  } finally { await view.unmount(); }
});

test('relation overlay expires after one pass and invalid endpoint claims never animate', async () => {
  const snap = snapshot(); const view = mount({ snapshot: snap });
  try {
    await view.render();
    const valid = { ...snap, events: [relation(1)] };
    await view.render({ snapshot: valid }); assert.equal(pulseCount(), 1);
    await act(async () => new Promise(resolve => setTimeout(resolve, 850)));
    assert.equal(pulseCount(), 0);
    await view.render({ snapshot: { ...valid } }); assert.equal(pulseCount(), 0, 'ordinary polls do not replay an expired event');
    const invalid = [
      { edgeId: 'unknown' }, { fromNodeId: 'research-a' }, { toNodeId: 'verify-now' },
      { kind: 'dependency' }, { runId: 'different-run' }, { type: 'node_completed' },
    ];
    await view.render({ snapshot: { ...snap, events: [relation(1), ...invalid.map((changes, index) => relation(index + 2, 'dispatch', changes))] } });
    assert.equal(pulseCount(), 0);
  } finally { await view.unmount(); }
});

test('mixed stream continuity, duplicate and out-of-order records cannot replay or invent topology activity', async () => {
  const snap = snapshot({ events: [ordinary(1)] }); const view = mount({ snapshot: snap });
  try {
    await view.render();
    const update = { ...snap, events: [relation(4, 'feedback'), ordinary(3), relation(2), relation(4, 'feedback'), ordinary(1)] };
    await view.render({ snapshot: update });
    assert.deepEqual(overlays().map(item => item.dataset.eventKey).sort(), ['topology-run:2', 'topology-run:4']);
    assert.equal(document.querySelectorAll('.tm-event-list .tm-event').length, 4, 'duplicate stream sequences are not duplicated in the timeline');
    await view.render({ snapshot: { ...update } }); assert.equal(pulseCount(), 2, 'duplicate sequence does not add another overlay');
    await view.render({ snapshot: { ...snap, events: [ordinary(1)] } }); assert.equal(pulseCount(), 0, 'older responses rebaseline and clear animation');
    await view.render({ snapshot: update }); assert.equal(pulseCount(), 0, 'restoring previously consumed history does not replay');
    await view.render({ snapshot: { ...update, events: [...update.events, ordinary(5), relation(6, 'cross-dependency')] } });
    assert.deepEqual(overlays().map(item => item.dataset.eventKey), ['topology-run:6']);
    await view.render({ snapshot: { ...snap, events: [ordinary(1), relation(8)] } });
    assert.equal(pulseCount(), 0); assert.match(document.querySelector('.tm-event-integrity').textContent, /缺失|截断/);
  } finally { await view.unmount(); }
});

test('mount history, refresh, run navigation, truncation and malformed stream events establish quiet topology baselines', async () => {
  let snap = snapshot({ events: [relation(1)] }); const view = mount({ snapshot: snap, freshness: { stale: false, revision: 0 } });
  try {
    await view.render(); assert.equal(pulseCount(), 0);
    snap = { ...snap, events: [...snap.events, relation(2)] };
    await view.render({ snapshot: snap, freshness: { stale: false, revision: 1 } }); assert.equal(pulseCount(), 0);
    snap = { ...snap, events: [...snap.events, relation(3)] };
    await view.render({ snapshot: snap }); assert.equal(pulseCount(), 1);
    await view.render({ snapshot: { ...snap, id: 'another-run' } }); assert.equal(pulseCount(), 0);
    await view.render({ snapshot: { ...snap, events: [relation(1)] } }); assert.equal(pulseCount(), 0);
    await view.render({ snapshot: snap }); assert.equal(pulseCount(), 0);
    await view.render({ snapshot: { ...snap, events: [relation(50)], oldestSeq: 50, eventsTruncated: true } });
    assert.equal(pulseCount(), 0); assert.match(document.querySelector('.tm-event-integrity').textContent, /缺失|截断/);
    await view.render({ snapshot: { ...snap, events: [relation(50), ordinary('malformed'), relation(51)], oldestSeq: 50 } });
    assert.equal(pulseCount(), 0, 'malformed ordinary telemetry invalidates the same cursor as malformed relations');
    await view.render({ snapshot: null });
    await view.render({ snapshot: snap }); assert.equal(pulseCount(), 0);
  } finally { await view.unmount(); }
});

test('stale, hidden and terminal states clear relation overlays without replay on recovery', async () => {
  let snap = snapshot(); const view = mount({ snapshot: snap });
  const add = () => snap = { ...snap, events: [...snap.events, relation(snap.events.length + 1)] };
  try {
    await view.render(); await view.render({ snapshot: add() }); assert.equal(pulseCount(), 1);
    await view.render({ snapshot: add(), freshness: { stale: true } }); assert.equal(pulseCount(), 0);
    await view.render({ snapshot: add(), freshness: { stale: false } }); assert.equal(pulseCount(), 0);
    await view.render({ snapshot: add() }); assert.equal(pulseCount(), 1);
    await visibility(false); assert.equal(pulseCount(), 0);
    await view.render({ snapshot: add() }); await visibility(true); assert.equal(pulseCount(), 0);
    await view.render({ snapshot: add() }); assert.equal(pulseCount(), 1);
    for (const status of ['completed', 'failed', 'blocked', 'cancelled', 'unverified']) {
      await view.render({ snapshot: { ...add(), status } });
      assert.equal(pulseCount(), 0, status);
      assert.equal(document.querySelectorAll('[data-topology-card][data-live=true]').length, 0, status);
    }
  } finally { await view.unmount(); }
});

test('reduced-motion styles suppress live scans and relation pulses, with no animation rule on static organization wires', async () => {
  const css = await readFile(new URL('../client/team.css', import.meta.url), 'utf8');
  assert.match(css, /prefers-reduced-motion\s*:\s*reduce/);
  assert.match(css, /tm-relation-pass\s+\.8s/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{[^{}]*\.tm-topology-card[^{}]*\{animation:none!important/);
  assert.match(css, /\.tm-topology-relation \.tm-edge-pulse\{animation:none!important;display:none!important/);
  const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  for (const [, selector, body] of blocks) {
    if (selector.split(',').some(part => /^\s*\.tm-topology-wires(?:\s|$|\.|:)/.test(part)) && /animation\s*:/.test(body)) {
      assert.ok(/animation\s*:\s*none/.test(body), `static org wires cannot animate: ${selector}`);
    }
  }
});
