import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
import { JevTeamController } from '../src/jev-controller.js';
import { fixtureDependencies, settings as hostSettings } from './helpers/team-host.mjs';

const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', { url: 'http://localhost' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, Event: dom.window.Event, MouseEvent: dom.window.MouseEvent, IS_REACT_ACT_ENVIRONMENT: true });
HTMLElement.prototype.scrollIntoView = function () {};
const React = await import('react'); const { act } = React; const { createRoot } = await import('react-dom/client');
const require = createRequire(import.meta.url); let client;
window.__ModuleLoader__ = { load({ factory }) { client = factory(require); } };
vm.runInThisContext(await readFile(new URL('../lib/client.js', import.meta.url), 'utf8'));
const catalog = { available: true, jev: { configured: true, available: true, endpoint: 'https://api.typesafe.ai/v1/systemone' }, providers: [{ id: 'fixture-provider', name: 'Fixture Provider', models: [{ id: 'fixture-base', name: 'Fixture Base' }, { id: 'fixture-weak', name: 'Fixture Weak' }, { id: 'fixture-strong', name: 'Fixture Strong', efforts: [{ id: 'native-high', name: 'Native High' }], defaultEffort: 'native-high' }] }] };
function configured() { const settings = client.createDefaultTeamSettings(); for (const role of Object.keys(settings.roles)) settings.roles[role] = { provider: 'fixture-provider', model: 'fixture-base', maxTokens: 4096 }; return settings; }
function setup(settings = configured()) { return { settings, configured: true, keyConfigured: true, disclosureAccepted: true, revision: 1 }; }
function mount(Component, initial) { const root = createRoot(document.getElementById('root')); let props = initial; return { async render(change = {}) { props = { ...props, ...change }; await act(async () => root.render(React.createElement(Component, props))); }, async unmount() { await act(async () => root.unmount()); } }; }
const settingsView = (extra = {}) => mount(client.TeamSettingsView, { setup: setup(), catalog, credential: { configured: true, writable: true }, onSave: async () => {}, onClose() {}, onRefresh() {}, ...extra });
const team = (extra = {}) => mount(client.TeamView, { catalog, sessionId: 'session-a', settings: configured(), configured: true, snapshot: null, onOpenSettings() {}, onCancel() {}, onRefresh() {}, onDemo() {}, ...extra });
const field = label => document.querySelector(`[aria-label="${label}"]`);
const toggle = name => document.querySelector(`input[name="${name}"]`);
const button = text => [...document.querySelectorAll('button')].find(item => item.textContent === text);
async function click(element) { assert.ok(element); await act(async () => element.click()); }
async function value(element, next) { assert.ok(element); await act(async () => { const proto = element.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(element, next); element.dispatchEvent(new window.Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); }); }
const save = () => button('保存团队设置');
const model = id => ({ provider: 'fixture-provider', model: id });
function production(overrides = {}) { return { budget: { enabled: true, limit: 200000, spent: 321, reserved: 65536, remaining: 134143, halted: null, accounting: 'host-usage', unknownUsageCalls: 0, physicalCalls: 2 }, routing: { enabled: true, decisions: [{ nodeId: 'worker-node', role: 'worker', lane: 'high', tier: 'strong', provider: 'fixture-provider', model: 'fixture-strong', reason: 'configured_lane_candidate' }] }, jev: { primary: { requestedModel: 'jev-latest', responseModel: 'jev-1.2.3', status: 'completed', calls: 2 }, shadow: { enabled: true, requestedModel: 'jev-1.1.0', status: 'completed', calls: 1, lastDecision: { action: 'continue', lane: 'medium' } }, }, trace: { enabled: true, eventCount: 4, truncated: false }, ...overrides }; }
function snapshot(prod = production(), id = 'run-a', sessionId = 'session-a') { const base = client.teamDemoSnapshot(); return { ...base, id, sessionId, demo: false, status: 'running', roles: configured().roles, nodes: [{ id: 'worker-node', role: 'worker', kind: 'task', title: 'Production worker fixture', status: 'running', attempt: 1, dependsOn: [] }], edges: [], events: [], jev: { ...base.jev, mode: 'live' }, production: prod }; }
function trace(events = [{ seq: 1, type: 'jev', data: { phase: 'classify', source: 'primary', status: 'completed', metadata: { requestedModel: 'jev-latest', responseModel: 'jev-1.2.3', usage: { inputTokens: 12, outputTokens: 7 } }, decision: { action: 'classify', lane: 'small' } } }], truncated = false) { return { schema: 'dsh-evaluation-trace/v1', policy: 'hermes-b22a21f+dsh-gates-v1', privacy: 'metadata-only', truncated, events }; }

test('production defaults are safe and legacy setup gains optional defaults without opening advanced controls', async () => {
  const defaults = configured(); assert.deepEqual(defaults.budget, { enabled: false, tokenLimit: 0 }); assert.deepEqual(defaults.routing, { enabled: false, roles: {} }); assert.deepEqual(defaults.jev, { model: 'jev-latest', trace: true, shadow: { enabled: false, model: '', maxCalls: 2 } });
  const legacy = configured(); delete legacy.budget; delete legacy.routing; delete legacy.jev; let saved;
  const view = settingsView({ setup: setup(legacy), onSave: async input => { saved = input; } });
  try { await view.render(); assert.equal(document.querySelector('.tm-production-settings').open, false); assert.equal(toggle('budgetEnabled').checked, false); assert.equal(field('每次运行 Token 上限').value, ''); assert.equal(toggle('routingEnabled').checked, false); assert.equal(field('Shadow 固定版本').value, ''); assert.match(document.querySelector('.tm-production-settings').textContent, /完整上下文窗口/); assert.match(document.querySelector('.tm-production-settings').textContent, /不是金额上限/); await click(save()); assert.deepEqual(saved.settings.budget, defaults.budget); assert.deepEqual(saved.settings.jev, defaults.jev); } finally { await view.unmount(); }
});

test('budget opt-in requires an explicit bounded integer and retains the exact saved limit', async () => {
  let saved; const view = settingsView({ onSave: async input => { saved = input; } });
  try { await view.render(); await click(toggle('budgetEnabled')); assert.equal(save().disabled, true); for (const invalid of ['0', '-1', '1.2', '1000000001', '']) { await value(field('每次运行 Token 上限'), invalid); assert.equal(save().disabled, true, invalid); } await value(field('每次运行 Token 上限'), '500000'); assert.equal(save().disabled, false); await click(save()); assert.deepEqual(saved.settings.budget, { enabled: true, tokenLimit: 500000 }); } finally { await view.unmount(); }
});

test('Jev aliases and pinned prereleases validate while shadow always requires an explicit pinned version', async () => {
  let saved; const view = settingsView({ onSave: async input => { saved = input; } });
  try {
    await view.render(); await value(field('Jev 主版本'), 'unknown'); assert.equal(save().disabled, true);
    for (const valid of ['jev-latest', 'jev-preview', 'jev-2.1.0-rc.1']) { await value(field('Jev 主版本'), valid); assert.equal(save().disabled, false); }
    await click(toggle('shadowEnabled')); assert.equal(save().disabled, true); assert.equal(field('Shadow 固定版本').value, '');
    for (const invalid of ['jev-latest', 'jev-preview', 'jev-1.2', 'jev-anything']) { await value(field('Shadow 固定版本'), invalid); assert.equal(save().disabled, true); }
    await value(field('Shadow 固定版本'), 'jev-1.2.3-beta.2');
    for (const invalid of ['21', '-1', '1.1', '']) { await value(field('Shadow 调用上限'), invalid); assert.equal(save().disabled, true); }
    await value(field('Shadow 调用上限'), '0'); assert.equal(save().disabled, false); await click(toggle('traceEnabled')); await click(save());
    assert.deepEqual(saved.settings.jev, { model: 'jev-2.1.0-rc.1', trace: false, shadow: { enabled: true, model: 'jev-1.2.3-beta.2', maxCalls: 0 } });
  } finally { await view.unmount(); }
});

test('all six routing roles preserve base models and use only host catalog candidates', async () => {
  let saved; const requests = []; const view = settingsView({ onSave: async input => { saved = input; }, onModelSelectionChange: (roles, routing) => requests.push({ roles, routing }) });
  try {
    await view.render(); await click(toggle('routingEnabled'));
    const names = { planner: '规划者', coordinator: '协调者', researcher: '研究者', explorer: '探索者', worker: '执行者', reviewer: '审查者' };
    for (const [role, name] of Object.entries(names)) {
      await value(field('路由岗位'), role);
      await value(field(`${name} weak提供方`), 'fixture-provider'); assert.equal(save().disabled, true);
      await value(field(`${name} weak模型`), 'fixture-weak');
      await value(field(`${name} strong提供方`), 'fixture-provider'); await value(field(`${name} strong模型`), 'fixture-strong');
      assert.equal(field(`${name} strong推理强度`).value, 'native-high');
      for (const option of document.querySelectorAll('.tm-routing-candidate select option')) assert.ok(['', 'fixture-provider', 'fixture-base', 'fixture-weak', 'fixture-strong', 'native-high'].includes(option.value));
    }
    await click(save()); assert.equal(saved.settings.routing.enabled, true); assert.equal(Object.keys(saved.settings.routing.roles).length, 6); assert.deepEqual(saved.settings.roles, configured().roles);
    assert.equal(requests.at(-1).routing.roles.reviewer.strong.model, 'fixture-strong');
    await click(button('清除 weak 候选')); await click(button('清除 strong 候选')); await click(save()); assert.equal(saved.settings.routing.roles.reviewer, undefined); assert.match(document.querySelector('.tm-routing-candidates').textContent, /沿用岗位基础模型/);
  } finally { await view.unmount(); }
});

test('unavailable saved routing candidates remain visible and block save until explicitly cleared', async () => {
  const settings = configured(); settings.routing.roles.planner = { weak: { provider: 'removed-provider', model: 'exact-removed-model' } };
  const view = settingsView({ setup: setup(settings) });
  try { await view.render(); assert.equal(toggle('routingEnabled').checked, false); assert.equal(field('规划者 weak提供方').value, 'removed-provider'); assert.equal(field('规划者 weak模型').value, 'exact-removed-model'); assert.match(document.querySelector('.tm-production-errors').textContent, /规划者的 weak 候选/); assert.equal(save().disabled, true); await click(button('清除 weak 候选')); assert.equal(save().disabled, false); assert.equal(settings.routing.roles.planner.weak.model, 'exact-removed-model'); } finally { await view.unmount(); }
});

function host(initial = configured()) {
  const calls = []; let stored = setup(initial);
  const ctx = { connection: { rpc: { async call(_channel, endpoint, payload, signal) { calls.push({ endpoint, payload, signal }); if (endpoint.endsWith('/settings')) return { ok: true, value: stored }; if (endpoint.endsWith('/catalog')) return { ok: true, value: catalog }; if (endpoint.endsWith('/configure')) { stored = { ...stored, settings: payload.settings, revision: stored.revision + 1 }; return { ok: true, value: stored }; } if (endpoint.endsWith('/snapshot')) return { ok: true, value: { snapshot: snapshot(production(), 'run-a', payload.sessionId), context: { sessionId: payload.sessionId } } }; if (endpoint.endsWith('/trace')) return { ok: true, value: trace() }; throw new Error('Unexpected fixture endpoint'); } } }, remote: { credentials: { async describe() { return { ok: true, value: { DSH_TEAM_JEV_API_KEY: { configured: true, writable: true } } }; }, async set() { throw new Error('No credentials needed'); } } } };
  return { calls, ctx };
}

test('native settings and sidebar catalog include configured candidates and save all production settings', async () => {
  const settings = configured(); settings.routing.roles.planner = { weak: model('fixture-weak'), strong: model('fixture-strong') }; settings.jev.model = 'jev-preview'; const h = host(settings);
  let view = mount(client.ConnectedTeamSettings, { ctx: h.ctx, onClose() {} });
  try {
    await view.render(); const initial = h.calls.find(call => call.endpoint.endsWith('/catalog')).payload.selected; assert.deepEqual(initial, [model('fixture-base'), model('fixture-weak'), model('fixture-strong')]);
    await value(field('规划者模型'), 'fixture-weak'); assert.ok(h.calls.filter(call => call.endpoint.endsWith('/catalog')).at(-1).payload.selected.some(item => item.model === 'fixture-strong'));
    await value(field('路由岗位'), 'worker'); await value(field('执行者 strong提供方'), 'fixture-provider'); await value(field('执行者 strong模型'), 'fixture-strong');
    await click(toggle('routingEnabled')); await click(save()); const saved = h.calls.find(call => call.endpoint.endsWith('/configure')); assert.equal(saved.payload.expectedRevision, 1); assert.equal(saved.payload.settings.routing.roles.worker.strong.model, 'fixture-strong'); assert.equal(saved.payload.settings.jev.model, 'jev-preview'); assert.equal(toggle('routingEnabled').checked, true);
  } finally { await view.unmount(); }
  h.calls.length = 0; view = mount(client.ConnectedTeam, { ctx: h.ctx, sessionId: 'session-a', onOpenSettings() {} });
  try { await view.render(); assert.ok(h.calls.find(call => call.endpoint.endsWith('/catalog')).payload.selected.some(item => item.model === 'fixture-strong')); } finally { await view.unmount(); }
});

test('production status shows real counters, unknown accounting, fixed run versions and actual node routing', async () => {
  const p = production(); p.budget.unknownUsageCalls = 1; p.budget.accounting = 'host-usage-incomplete'; p.budget.halted = 'reservation_exceeds_budget'; p.trace.truncated = true;
  const settings = configured(); settings.jev.model = 'jev-preview'; const view = team({ settings, snapshot: snapshot(p) });
  try {
    await view.render(); const status = document.querySelector('.tm-production-status'); assert.match(status.textContent, /321/); assert.match(status.textContent, /65,536/); assert.match(status.textContent, /预算已停止派发/); assert.match(status.textContent, /不是完整实际用量/); assert.match(status.textContent, /jev-latest/); assert.match(status.textContent, /响应 jev-1.2.3/); assert.ok(!status.textContent.includes('jev-preview')); assert.match(status.textContent, /已截断/); assert.match(status.textContent, /只观察，不参与执行决策/); assert.ok(!/节省|savings/i.test(status.textContent));
    await click(document.querySelectorAll('[role=tab]')[1]); await click(document.querySelector('.tm-task-node')); assert.match(document.querySelector('.tm-inspector').textContent, /Fixture Strong/); assert.match(document.querySelector('.tm-inspector').textContent, /本节点路由：high · strong/);
  } finally { await view.unmount(); }
});

test('legacy snapshots never borrow current production settings and disabled accounting handles nulls', async () => {
  const old = snapshot(); delete old.production; const view = team({ snapshot: old });
  try { await view.render(); assert.match(document.querySelector('.tm-production-status').textContent, /未提供计量/); assert.match(document.querySelector('.tm-production-status').textContent, /不会用当前设置替代历史记录/); const p = production(); p.budget = { ...p.budget, enabled: false, remaining: null, halted: null }; await view.render({ snapshot: snapshot(p) }); assert.match(document.querySelector('.tm-production-metrics').textContent, /未设置本次运行上限/); assert.ok(!document.querySelector('.tm-production-status').textContent.includes('NaN')); } finally { await view.unmount(); }
});

test('Trace reads only on request, deduplicates clicks and projects metadata without raw fields', async () => {
  let calls = 0, resolve; const view = team({ snapshot: snapshot(), onLoadTrace: (_id, _signal) => { calls++; return new Promise(done => { resolve = done; }); } });
  try {
    await view.render(); assert.equal(calls, 0); await act(async () => { button('查看 Trace').click(); button('查看 Trace').click(); }); assert.equal(calls, 1); assert.equal(button('正在读取…').disabled, true);
    const payload = trace(); payload.secret = 'PRIVATE-TOP-LEVEL'; payload.events[0].data.prompt = 'PRIVATE-PROMPT'; payload.events[0].data.metadata.responseModel = 'PRIVATE-MODEL'; payload.events[0].data.decision.reason = 'PRIVATE-REASON';
    await act(async () => resolve(payload)); const text = field('Trace 元数据摘要').textContent; assert.match(text, /jev-latest/); assert.match(text, /inputTokens/); assert.ok(!document.body.textContent.includes('PRIVATE-')); assert.ok(button('刷新 Trace'));
  } finally { await view.unmount(); }
});

test('Trace summaries are bounded, reject unredacted formats and do not echo raw errors', async () => {
  let payload = trace(Array.from({ length: 75 }, (_, index) => ({ seq: index + 1, type: 'model_call', data: { role: 'worker', modelRef: 1, status: 'completed' } })), true); const view = team({ snapshot: snapshot(), onLoadTrace: async () => payload });
  try {
    await view.render(); await click(button('查看 Trace')); assert.equal(JSON.parse(field('Trace 元数据摘要').textContent).length, 50); assert.match(document.querySelector('.tm-trace-viewer').textContent, /50 \/ 75/); assert.match(document.querySelector('.tm-trace-viewer').textContent, /已截断/);
    payload = { ...payload, privacy: 'raw', secret: 'PRIVATE' }; await click(button('刷新 Trace')); assert.equal(field('Trace 元数据摘要'), null); assert.match(document.querySelector('.tm-trace-viewer').textContent, /无法读取或验证/); assert.ok(!document.body.textContent.includes('PRIVATE'));
    await view.render({ onLoadTrace: async () => { throw new Error('PRIVATE-ERROR'); } }); await click(button('查看 Trace')); assert.ok(!document.body.textContent.includes('PRIVATE-ERROR'));
  } finally { await view.unmount(); }
});

test('run and session changes abort Trace reads and discard a late response', async () => {
  let resolve, signal; const view = team({ snapshot: snapshot(), onLoadTrace: (_id, received) => { signal = received; return new Promise(done => { resolve = done; }); } });
  try { await view.render(); await click(button('查看 Trace')); await view.render({ sessionId: 'session-b', snapshot: snapshot(production(), 'run-b', 'session-b'), onLoadTrace: async () => trace() }); assert.equal(signal.aborted, true); await act(async () => resolve(trace())); assert.equal(field('Trace 元数据摘要'), null); await click(button('查看 Trace')); assert.ok(field('Trace 元数据摘要')); } finally { await view.unmount(); }
});

test('native Trace endpoint always receives the current session and exact selected run', async () => {
  const h = host(); const view = mount(client.ConnectedTeam, { ctx: h.ctx, sessionId: 'session-a', onOpenSettings() {} });
  try { await view.render(); assert.equal(h.calls.filter(call => call.endpoint.endsWith('/trace')).length, 0); await click(button('查看 Trace')); assert.deepEqual(h.calls.find(call => call.endpoint.endsWith('/trace')).payload, { sessionId: 'session-a', runId: 'run-a' }); assert.ok(field('Trace 元数据摘要')); } finally { await view.unmount(); }
});

test('readonly production controls cannot change and scoped themes retain narrow layouts', async () => {
  const view = settingsView({ setup: { ...setup(), writable: false } });
  try { await view.render(); assert.ok(toggle('budgetEnabled').closest('fieldset').disabled); const before = toggle('budgetEnabled').checked; await click(toggle('budgetEnabled')); assert.equal(toggle('budgetEnabled').checked, before); assert.ok(save().disabled); } finally { await view.unmount(); }
  const css = await readFile(new URL('../client/team.css', import.meta.url), 'utf8'); const theme = await readFile(new URL('../client/team-theme.css', import.meta.url), 'utf8');
  assert.match(css, /@container team \(max-width:650px\).*tm-production-fields,.tm-routing-candidates\{grid-template-columns:1fr\}/);
  assert.match(theme, /\.tm-root\[data-theme=arknights\].*tm-production-status/);
});


test('actual JevTeamController snapshot renders the production wire contract without nested trace assumptions', async () => {
  const dependencies = fixtureDependencies();
  const controller = new JevTeamController({ ...dependencies, perRunJev: true, execute: async spec => ({ stopReason: 'completed', output: 'Offline fixture output', structured: spec.role === 'reviewer' ? { verdict: 'approve', summary: 'Fixture review', issues: [] } : { summary: 'Fixture plan', tasks: [{ id: 'fixture-task', role: 'worker', title: 'Offline fixture', instructions: 'Synthetic work only', dependsOn: [] }] } }) });
  let view;
  try {
    const run = controller.start({ sessionId: 'session-a', goal: 'Offline production UI contract', ...hostSettings(), jev: { enabled: true, disclosureAccepted: true, model: 'jev-preview', trace: true, shadow: { enabled: false, model: '', maxCalls: 2 } } });
    assert.ok(run.production.jev, 'start response must contain initial Jev state');
    view = team({ snapshot: run }); await view.render();
    assert.match(document.querySelector('.tm-production-status').textContent, /jev-preview/);
    await controller.wait(run.id);
    const actual = controller.snapshot("session-a", run.id);
    assert.equal(actual.production.jev.trace, undefined); assert.equal(actual.production.trace.enabled, true); assert.ok(actual.production.trace.eventCount > 0);
    await view.render({ snapshot: actual });
    const status = document.querySelector('.tm-production-status'); assert.match(status.textContent, /jev-preview/); assert.match(status.textContent, /宿主请求次数/); assert.match(status.textContent, /元数据/); assert.match(status.textContent, /合成记录/); assert.ok(!status.textContent.includes('undefined'));
  } finally { if (view) await view.unmount(); await controller.dispose(); }
});


test('migration snapshots without production Jev records remain readable without invented versions', async () => {
  const p = production(); delete p.jev; const view = team({ snapshot: snapshot(p) });
  try { await view.render(); const status = document.querySelector('.tm-production-status'); assert.match(status.textContent, /本次运行未提供 Jev 版本记录/); assert.match(status.textContent, /未报告/); assert.ok(!status.textContent.includes('jev-latest')); assert.match(status.textContent, /321/); } finally { await view.unmount(); }
});
