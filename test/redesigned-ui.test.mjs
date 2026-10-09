import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', { url: 'http://localhost' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, Event: dom.window.Event, MouseEvent: dom.window.MouseEvent, IS_REACT_ACT_ENVIRONMENT: true });
HTMLElement.prototype.scrollIntoView = function () {};
const React = await import('react'); const { act } = React; const { createRoot } = await import('react-dom/client');
const require = createRequire(import.meta.url); let client;
window.__ModuleLoader__ = { load({ factory }) { client = factory(require); } };
vm.runInThisContext(await readFile(new URL('../lib/client.js', import.meta.url), 'utf8'));
const catalog = { available: true, jev: { configured: true, available: true, endpoint: 'https://api.typesafe.ai/jev' }, providers: [{ id: 'fixture-provider', name: 'Fixture Provider', models: [{ id: 'fixture-model-a', name: 'Fixture Model A' }, { id: 'fixture-model-b', name: 'Fixture Model B' }] }] };
function configured() { const settings = client.createDefaultTeamSettings(); for (const role of Object.keys(settings.roles)) settings.roles[role] = { provider: 'fixture-provider', model: 'fixture-model-a', maxTokens: 4096 }; return settings; }
function mount(Component, initial) { const root = createRoot(document.getElementById('root')); let props = initial; return { async render(change = {}) { props = { ...props, ...change }; await act(async () => root.render(React.createElement(Component, props))); }, async unmount() { await act(async () => root.unmount()); } }; }
function settingsView(extra = {}) { return mount(client.TeamSettingsView, { setup: { settings: configured(), configured: true, keyConfigured: true, disclosureAccepted: true, revision: 1 }, catalog, credential: { configured: true, writable: true }, onSave: async () => {}, onClose() {}, onRefresh() {}, ...extra }); }
function team(extra = {}) { return mount(client.TeamView, { catalog, sessionId: 'session-a', settings: configured(), configured: true, snapshot: null, onOpenSettings() {}, onCancel: async () => {}, onRefresh() {}, onDemo() {}, ...extra }); }
async function select(element, value) { assert.ok(element); await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(element, value); element.dispatchEvent(new window.Event('change', { bubbles: true })); }); }
async function click(element) { assert.ok(element); await act(async () => element.click()); }
const saveButton = () => [...document.querySelectorAll('button')].find(button => button.textContent === '保存团队设置');

test('settings role navigation exposes exactly one role while preserving independent edits', async () => {
  let saved; const view = settingsView({ onSave: async input => { saved = input; } });
  try {
    await view.render(); const selectors = [...document.querySelectorAll('.tm-role-selector button')];
    assert.equal(selectors.length, 6); assert.equal(document.querySelectorAll('.tm-model-config:not([hidden])').length, 1);
    assert.equal(selectors.filter(button => button.getAttribute('aria-pressed') === 'true').length, 1);
    await select(document.querySelector('[aria-label="规划者模型"]'), 'fixture-model-b');
    await click(selectors[4]);
    assert.equal(document.querySelector('.tm-model-config:not([hidden]) select').getAttribute('aria-label'), '执行者提供方');
    assert.match(selectors[0].textContent, /Fixture Model B/);
    await select(document.querySelector('[aria-label="执行者模型"]'), 'fixture-model-b');
    await click(selectors[0]);
    assert.equal(document.querySelector('[aria-label="规划者模型"]').value, 'fixture-model-b');
    await click(saveButton());
    assert.equal(saved.settings.roles.planner.model, 'fixture-model-b'); assert.equal(saved.settings.roles.worker.model, 'fixture-model-b');
    assert.equal(saved.settings.roles.researcher.model, 'fixture-model-a');
    assert.equal(window.localStorage.length, 0); assert.equal(window.sessionStorage.length, 0);
  } finally { await view.unmount(); }
});

test('hidden invalid role still blocks save and can be located in role navigation', async () => {
  const settings = configured(); settings.roles.reviewer.model = 'unavailable-fixture-model';
  const view = settingsView({ setup: { settings, configured: true, keyConfigured: true, disclosureAccepted: true, revision: 1 } });
  try { await view.render(); assert.ok(saveButton().disabled); const reviewer = document.querySelectorAll('.tm-role-selector button')[5]; assert.ok(reviewer.querySelector('.tm-config-missing')); await click(reviewer); const field = document.querySelector('.tm-model-config:not([hidden])'); assert.equal(field.querySelector('[aria-label="审查者模型"]').value, 'unavailable-fixture-model'); assert.match(field.textContent, /当前不可用/); await select(field.querySelector('[aria-label="审查者模型"]'), 'fixture-model-a'); assert.equal(saveButton().disabled, false); } finally { await view.unmount(); }
});

test('graph tabs support roving focus, arrow activation, and correctly labelled panel', async () => {
  const view = team({ snapshot: client.teamDemoSnapshot() });
  try { await view.render(); const tabs = [...document.querySelectorAll('[role=tab]')]; assert.equal(tabs.length, 2); tabs[0].focus(); await act(async () => tabs[0].dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))); assert.equal(document.activeElement, tabs[1]); assert.equal(tabs[1].getAttribute('aria-selected'), 'true'); assert.equal(tabs[0].tabIndex, -1); assert.equal(document.querySelector('[role=tabpanel]').getAttribute('aria-labelledby'), tabs[1].id); assert.ok(document.querySelector('.tm-graph-scroll').hasAttribute('tabindex')); await act(async () => tabs[1].dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))); assert.equal(document.activeElement, tabs[0]); assert.equal(tabs[0].getAttribute('aria-selected'), 'true'); assert.equal(document.querySelectorAll('.tm-role-card').length, 6); } finally { await view.unmount(); }
});

test('compact control details preserve fixture and unverified disclosures', async () => {
  const snapshot = client.teamDemoSnapshot(); const view = team({ snapshot });
  try { await view.render(); const details = document.querySelector('.tm-control-details'); assert.ok(details); assert.equal(details.open, false); assert.ok(details.querySelector('summary')); assert.match(document.querySelector('.tm-jev-connection').textContent, /FIXTURE/); assert.match(document.querySelector('.tm-demo-banner').textContent, /未调用真实模型/); assert.ok(document.querySelector('.tm-controller-node')); await click(details.querySelector('summary')); assert.equal(details.open, true); assert.equal(document.querySelectorAll('.tm-gates li').length, 4); assert.match(document.querySelector('.tm-gates').textContent, /待验证|未通过/); } finally { await view.unmount(); }
});

function liveSnapshot(id, sessionId) { const snapshot = client.teamDemoSnapshot(); return { ...snapshot, id, sessionId, demo: false, status: 'running', roles: configured().roles, jev: { ...snapshot.jev, mode: 'live' } }; }
const cancelButton = () => document.querySelector('.tm-running-bar button');
test('stale cancellation rejection cannot leak into or unlock a newer run cancellation', async () => {
  let rejectA, finishB, callsA = 0, callsB = 0;
  const view = team({ snapshot: liveSnapshot('run-a', 'session-a'), onCancel: () => { callsA++; return new Promise((_resolve, reject) => { rejectA = reject; }); } });
  try {
    await view.render(); await act(async () => { cancelButton().click(); cancelButton().click(); }); assert.equal(callsA, 1); assert.ok(cancelButton().disabled);
    await view.render({ sessionId: 'session-b', snapshot: liveSnapshot('run-b', 'session-b'), onCancel: () => { callsB++; return new Promise(resolve => { finishB = resolve; }); } });
    assert.equal(cancelButton().disabled, false); await act(async () => { cancelButton().click(); cancelButton().click(); }); assert.equal(callsB, 1); assert.ok(cancelButton().disabled);
    await act(async () => rejectA(new Error('STALE CANCELLATION A')));
    assert.ok(!document.body.textContent.includes('STALE CANCELLATION A')); assert.ok(cancelButton().disabled);
    await act(async () => finishB()); assert.equal(cancelButton().disabled, false);
  } finally { await view.unmount(); }
});

test('new run in the same session releases the previous cancel guard without stale error leakage', async () => {
  let rejectA, callsB = 0;
  const view = team({ snapshot: liveSnapshot('run-a', 'session-a'), onCancel: () => new Promise((_resolve, reject) => { rejectA = reject; }) });
  try { await view.render(); await click(cancelButton()); await view.render({ snapshot: liveSnapshot('run-b', 'session-a'), onCancel: async () => { callsB++; } }); await click(cancelButton()); assert.equal(callsB, 1); await act(async () => rejectA(new Error('STALE SAME SESSION'))); assert.ok(!document.body.textContent.includes('STALE SAME SESSION')); } finally { await view.unmount(); }
});

test('dark interface text tokens maintain AA contrast on raised and selected cards', async () => {
  const css = await readFile(new URL('../client/team.css', import.meta.url), 'utf8');
  const token = name => css.match(new RegExp(`--tm-${name}:(#[0-9a-f]{6})`, 'i'))?.[1];
  const luminance = color => { const channels = [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4); return channels.reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0); };
  for (const foreground of ['text', 'muted', 'soft']) {
    for (const background of [token('bg'), token('panel'), token('raised'), '#202c38', '#182b35']) {
      const a = luminance(token(foreground)), b = luminance(background); const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      assert.ok(ratio >= 4.5, `${foreground} on ${background} should meet 4.5:1, got ${ratio.toFixed(2)}`);
    }
  }
  assert.match(css, /prefers-reduced-motion:\s*reduce/); assert.match(css, /focus-visible/); assert.match(css, /\.tm-root \[hidden\]\{display:none!important\}/);
});

test('Jev canvas hub selects an independently labelled controller without adding a model role', async () => {
  const view = team();
  try { await view.render(); const hub = document.querySelector('button[aria-label="查看 Jev 核心调度详情"]'); await click(hub); assert.equal(hub.getAttribute('aria-pressed'), 'true'); assert.match(document.querySelector('.tm-inspector').textContent, /Jev · 独立服务/); assert.equal(document.querySelectorAll('.tm-role-card').length, 6); assert.equal(document.querySelectorAll('.tm-role-card[aria-pressed=true]').length, 0); } finally { await view.unmount(); }
});

test('first reported nodes activate responsive graph observation within the same run', async () => {
  let callback, observed = 0, disconnected = 0;
  globalThis.ResizeObserver = class { constructor(fn) { callback = fn; } observe() { observed++; } disconnect() { disconnected++; } };
  const snapshot = liveSnapshot('same-run', 'session-a'); const view = team({ snapshot: { ...snapshot, nodes: [], edges: [] } });
  try { await view.render(); await click(document.querySelectorAll('[role=tab]')[1]); assert.equal(observed, 0); await view.render({ snapshot }); assert.equal(observed, 1); await act(async () => callback([{ contentRect: { width: 1000 } }])); assert.equal(document.querySelector('.tm-task-graph--vertical'), null); await act(async () => callback([{ contentRect: { width: 420 } }])); assert.ok(document.querySelector('.tm-task-graph--vertical')); assert.equal(document.querySelectorAll('.tm-task-node').length, snapshot.nodes.length); assert.equal(document.querySelectorAll('.tm-edge').length, snapshot.edges.length); await click(document.querySelector('.tm-fit-button')); const zoom = document.querySelector('.tm-graph-tools select'); assert.equal(zoom.getAttribute('aria-label'), '任务图缩放'); assert.ok(Number(zoom.value) >= .5 && Number(zoom.value) <= 1); assert.match(document.querySelector('.tm-task-canvas').style.transform, new RegExp(`scale\\(${zoom.value}\\)`)); } finally { await view.unmount(); delete globalThis.ResizeObserver; }
  assert.equal(disconnected, 1);
});

test('Jev hub inspector never presents unavailable or fixture service as connected', async () => {
  const view = team({ catalog: { ...catalog, jev: { configured: false, available: false } } });
  try { await view.render(); await click(document.querySelector('.tm-controller-node')); const provider = () => [...document.querySelectorAll('.tm-facts > div')].find(item => item.querySelector('dt')?.textContent === '提供方').querySelector('dd').textContent; assert.match(provider(), /未连接|未配置|不可用/); await view.render({ catalog: { ...catalog, jev: { configured: true, available: true, mode: 'fixture' } } }); assert.match(provider(), /Fixture/); assert.ok(!provider().includes('服务端连接')); } finally { await view.unmount(); }
});

test('explicit detail and return controls scroll only on request and reflect selected role', async () => {
  const scrolled = []; const oldScroll = HTMLElement.prototype.scrollIntoView; HTMLElement.prototype.scrollIntoView = function (options) { scrolled.push({ element: this, options }); };
  const view = team();
  try { await view.render(); await click(document.querySelector('.tm-role-card--researcher')); assert.equal(scrolled.length, 0); assert.match(document.querySelector('.tm-graph-context').textContent, /研究者/); await click(document.querySelector('.tm-inspect-jump')); assert.equal(scrolled.at(-1).element, document.querySelector('.tm-inspector-wrap')); assert.equal(scrolled.at(-1).options.behavior, 'auto'); await click(document.querySelector('.tm-inspector-back')); assert.equal(scrolled.at(-1).element, document.querySelector('.tm-graph-panel')); assert.equal(scrolled.length, 2); } finally { await view.unmount(); HTMLElement.prototype.scrollIntoView = oldScroll; }
});
