import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost', pretendToBeVisual: true });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, Event: dom.window.Event, MouseEvent: dom.window.MouseEvent, IS_REACT_ACT_ENVIRONMENT: true });
HTMLElement.prototype.scrollIntoView = function () {};
let visible = true;
Object.defineProperty(document, 'visibilityState', { get: () => visible ? 'visible' : 'hidden' });
const React = await import('react'); const { act } = React; const { createRoot } = await import('react-dom/client');
const require = createRequire(import.meta.url); let client;
window.__ModuleLoader__ = { load({ factory }) { client = factory(require); } };
vm.runInThisContext(await readFile(new URL('../lib/client.js', import.meta.url), 'utf8'));
const catalog = { available: true, jev: { configured: true, available: true }, providers: [{ id: 'p', name: 'Fixture Provider', models: [{ id: 'base', name: 'Startup Base' }, { id: 'fast', name: 'Fast Model' }, { id: 'deep', name: 'Deep Model' }] }] };
function snapshot() {
 const base = client.teamDemoSnapshot();
 const node = (id, role, kind = 'task') => ({ id, role, kind, title: id, attempt: 1, dependsOn: [], status: 'running' });
 return { ...base, demo: false, id: 'motion-run', sessionId: 's', status: 'running', roles: Object.fromEntries(Object.keys(base.roles).map(role => [role, { provider: 'p', model: 'base' }])), nodes: [node('research-a','researcher'), node('research-b','researcher'), node('base-only','worker'), node('jev-now','jev','jev_step'), node('verify-now','jev','verification')], edges: [{ id: 'edge', from: 'research-a', to: 'research-b', kind: 'dependency' }], events: [], jev: { ...base.jev, mode: 'live' }, production: { routing: { enabled: true, decisions: [{ nodeId: 'research-a', role: 'researcher', lane: 'small', tier: 'weak', provider: 'p', model: 'fast', reason: 'simple' }, { nodeId: 'research-b', role: 'researcher', lane: 'high', tier: 'strong', provider: 'p', model: 'deep', reason: 'complex' }] }, budget: { enabled: false, limit: 0, spent: 0, reserved: 0, remaining: null, halted: null, physicalCalls: 0, unknownUsageCalls: 0 }, trace: { enabled: false, eventCount: 0, truncated: false } } };
}
function mount(initial) { visible = true; const root = createRoot(document.getElementById('root')); let props = { catalog, sessionId: 's', settings: client.createDefaultTeamSettings(), configured: true, onOpenSettings() {}, onCancel() {}, onRefresh() {}, onDemo() {}, ...initial }; return { async render(change = {}) { props = { ...props, ...change }; await act(async () => root.render(React.createElement(client.TeamView, props))); }, async unmount() { await act(async () => root.unmount()); } }; }
async function click(element) { assert.ok(element); await act(async () => element.click()); }
const card = id => document.querySelector(`.tm-instance-card[data-node-id="${id}"]`);
const pulses = () => document.querySelectorAll('.tm-edge-pulse');
const relation = seq => ({ seq, at: '2026-10-11T09:30:00Z', type: 'relation_activated', edgeId: 'edge', fromNodeId: 'research-a', toNodeId: 'research-b', kind: 'dependency', message: 'Explicit dependency event' });

test('concurrent same-role instances retain independent models/statuses and explicit startup provenance', async () => {
 const snap = snapshot(); const view = mount({ snapshot: snap });
 try { await view.render(); await click(document.querySelectorAll('[role=tab]')[0]); assert.equal(document.querySelectorAll('.tm-instance-card').length, 5); assert.match(card('research-a').textContent, /Fast Model.*本节点选定模型 · small \/ weak/s); assert.match(card('research-b').textContent, /Deep Model.*本节点选定模型 · high \/ strong/s); assert.match(card('base-only').textContent, /Startup Base.*启动时基础配置/s); assert.equal(card('research-a').dataset.live, 'true'); assert.equal(card('research-b').dataset.live, 'true'); await click(card('research-b')); assert.match(document.querySelector('.tm-inspector').textContent, /本节点选定模型.*Deep Model/s); assert.match(document.querySelector('.tm-inspector').textContent, /high · strong · complex/); await click(card('base-only')); assert.match(document.querySelector('.tm-inspector').textContent, /未报告本节点选择/); assert.equal(document.querySelectorAll('.tm-topology-wires .tm-edge-pulse').length, 0); } finally { await view.unmount(); }
});

test('running-only motion stops for stale, hidden, failed and terminal snapshots; verification never animates', async () => {
 const snap = snapshot(); const view = mount({ snapshot: snap });
 try { await view.render(); await click(document.querySelectorAll('[role=tab]')[0]); assert.equal(card('jev-now').dataset.live, 'true'); assert.equal(card('verify-now').dataset.live, 'false'); assert.equal(document.querySelector('.tm-controller-node').dataset.live, 'true'); await view.render({ freshness: { stale: true, reason: 'connection lost' } }); assert.equal(document.querySelectorAll('.tm-instance-card[data-live=true]').length, 0); assert.equal(document.querySelector('.tm-root').dataset.stale, 'true'); assert.match(document.querySelector('.tm-stale-notice').textContent, /已暂停/); await view.render({ freshness: { stale: false } }); await act(async () => { visible = false; document.dispatchEvent(new Event('visibilitychange')); }); assert.equal(document.querySelectorAll('.tm-instance-card[data-live=true]').length, 0); await act(async () => { visible = true; document.dispatchEvent(new Event('visibilitychange')); }); assert.equal(card('research-a').dataset.live, 'true'); for (const status of ['completed', 'blocked', 'failed', 'cancelled', 'unverified']) { await view.render({ snapshot: { ...snap, status } }); assert.equal(document.querySelectorAll('.tm-instance-card[data-live=true]').length, 0, status); } await view.render({ snapshot: { ...snap, nodes: snap.nodes.map(node => ({ ...node, status: 'failed' })) } }); assert.equal(document.querySelectorAll('.tm-instance-card[data-live=true]').length, 0); } finally { await view.unmount(); }
});

test('relation pulses animate only new exact-edge events once, expiring after 800ms', async () => {
 let snap = { ...snapshot(), events: [relation(1)] }; const view = mount({ snapshot: snap });
 try { await view.render(); await click(document.querySelectorAll('[role=tab]')[1]); assert.equal(pulses().length, 0, 'first mount never replays'); snap = { ...snap, events: [...snap.events, relation(2)] }; await view.render({ snapshot: snap }); assert.equal(pulses().length, 1); assert.equal(pulses()[0].dataset.eventKey, 'motion-run:2'); await view.render({ snapshot: { ...snap } }); assert.equal(pulses().length, 1, 'same sequence does not add another pulse'); await act(async () => new Promise(resolve => setTimeout(resolve, 850))); assert.equal(pulses().length, 0); snap = { ...snap, events: [...snap.events, { ...relation(3), edgeId: 'unknown' }] }; await view.render({ snapshot: snap }); assert.equal(pulses().length, 0, 'not a recorded edge'); snap = { ...snap, events: [...snap.events, relation(4)] }; await view.render({ snapshot: snap }); assert.equal(pulses().length, 1); await view.render({ snapshot: { ...snap, status: 'blocked' } }); assert.equal(pulses().length, 0, 'terminal stops even newly emitted pulses'); } finally { await view.unmount(); }
});

test('explicit refresh, visibility resume, freshness recovery and run change baseline historical events', async () => {
 let snap = { ...snapshot(), events: [relation(1)] }; const view = mount({ snapshot: snap, freshness: { stale: false, revision: 0 } });
 try { await view.render(); await click(document.querySelectorAll('[role=tab]')[1]); const add = () => snap = { ...snap, events: [...snap.events, relation(snap.events.length + 1)] }; await view.render({ snapshot: add(), freshness: { stale: false, revision: 1 } }); assert.equal(pulses().length, 0); await view.render({ snapshot: add() }); assert.equal(pulses().length, 1); await act(async () => { visible = false; document.dispatchEvent(new Event('visibilitychange')); }); await view.render({ snapshot: add() }); assert.equal(pulses().length, 0); await act(async () => { visible = true; document.dispatchEvent(new Event('visibilitychange')); }); assert.equal(pulses().length, 0); await view.render({ snapshot: add(), freshness: { stale: true, revision: 1 } }); assert.equal(pulses().length, 0); await view.render({ snapshot: add(), freshness: { stale: false, revision: 1 } }); assert.equal(pulses().length, 0); await view.render({ snapshot: add() }); assert.equal(pulses().length, 1); await view.render({ snapshot: { ...snap, id: 'new-run' } }); assert.equal(pulses().length, 0); } finally { await view.unmount(); }
});

test('missing relation telemetry, truncated logs and reduced motion are explicit and safe', async () => {
 const snap = snapshot(); const view = mount({ snapshot: { ...snap, events: [{ seq: 1, type: 'node_started', at: '2026-10-11T09:30:00Z', message: 'legacy event' }] } });
 try { await view.render(); assert.match(document.querySelector('.tm-event-integrity').textContent, /未包含关系激活事件/); await view.render({ snapshot: { ...snap, events: [relation(100)], oldestSeq: 100, eventsTruncated: true } }); assert.match(document.querySelector('.tm-event-integrity').textContent, /截断|缺失/); assert.equal(pulses().length, 0); const css = await readFile(new URL('../client/team.css', import.meta.url), 'utf8'); assert.match(css, /tm-live-scan 1\.8s/); assert.match(css, /tm-relation-pass \.8s/); assert.match(css, /prefers-reduced-motion:reduce\)\{\.tm-root \[data-live=true\]::after\{animation:none!important;display:none!important/); } finally { await view.unmount(); }
});

test('active run starts on actual task relations; blockers expose failure code and reason above the graph', async () => {
 const snap = snapshot(); const view = mount({ snapshot: snap });
 try { await view.render(); assert.equal(document.querySelectorAll('[role=tab]')[1].getAttribute('aria-selected'), 'true'); assert.equal(document.querySelectorAll('.tm-task-node').length, snap.nodes.length); await view.render({ snapshot: { ...snap, status: 'blocked', failureCode: 'STEP_LIMIT', message: 'Bounded recovery exhausted, inspect this failure.' } }); const blocker = document.querySelector('.tm-run-blocker'); assert.match(blocker.textContent, /STEP_LIMIT/); assert.match(blocker.textContent, /Bounded recovery exhausted/); assert.equal(blocker.closest('details'), null); } finally { await view.unmount(); }
});

test('narrow graph centers the first or selected card on resize and preserves manual pan during polls', async () => {
 let resize;
 globalThis.ResizeObserver = class { constructor(callback) { resize = callback; } observe() {} disconnect() {} };
 const snap = snapshot();
 const nodes = ['root', 'left', 'middle', 'right'].map((id, index) => ({ id, role: 'researcher', kind: 'task', title: id, attempt: 1, dependsOn: index ? ['root'] : [], status: index ? 'running' : 'completed' }));
 const graph = { ...snap, nodes, edges: nodes.slice(1).map(node => ({ id: `root-${node.id}`, from: 'root', to: node.id, kind: 'dispatch' })) };
 const view = mount({ snapshot: graph });
 try {
  await view.render(); await act(async () => resize([{ contentRect: { width: 320 } }]));
  const viewport = document.querySelector('.tm-graph-scroll'); const root = document.querySelector('.tm-task-node[data-node-id=root]');
  const left = () => Number.parseFloat(root.style.left) - viewport.scrollLeft;
  assert.ok(viewport.scrollLeft > 0, 'the wide branching canvas is centered initially');
  assert.ok(left() >= 0 && left() + 160 <= 320, 'the first card is wholly in the narrow viewport');
  viewport.scrollLeft = 17;
  await view.render({ snapshot: { ...graph, nodes: graph.nodes.map(node => ({ ...node })) } });
  assert.equal(viewport.scrollLeft, 17, 'ordinary polls never reset manual panning');
  await act(async () => resize([{ contentRect: { width: 420 } }]));
  assert.ok(left() >= 0 && left() + 160 <= 420, 'viewport resizing restores full first-card visibility');
  await click(document.querySelector('.tm-task-node[data-node-id=right]'));
  await act(async () => resize([{ contentRect: { width: 360 } }]));
  const selected = document.querySelector('.tm-task-node[data-node-id=right]'); const selectedLeft = Number.parseFloat(selected.style.left) - viewport.scrollLeft;
  assert.ok(selectedLeft >= 0 && selectedLeft + 160 <= 360, 'resizing honors the selected node');
 } finally { await view.unmount(); delete globalThis.ResizeObserver; }
});
