import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', { url: 'http://localhost' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, Event: dom.window.Event, MouseEvent: dom.window.MouseEvent, localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true });
HTMLElement.prototype.scrollIntoView = function () {};
const React = await import('react'); const { act } = React; const { createRoot } = await import('react-dom/client');
const require = createRequire(import.meta.url); let client;
window.__ModuleLoader__ = { load({ factory }) { client = factory(require); } };
vm.runInThisContext(await readFile(new URL('../lib/client.js', import.meta.url), 'utf8'));
const catalog = { available: true, jev: { configured: true, available: true, endpoint: 'https://api.typesafe.ai/jev', disclosure: '有限的目标、公开产出和验证证据。' }, providers: [{ id: 'verified-provider', name: '已配置提供方', models: [{ id: 'real-model', name: '目录模型', efforts: [{ id: 'native-high', name: '高' }] }] }] };
const configured = () => { const settings = client.createDefaultTeamSettings(); for (const role of Object.keys(settings.roles)) settings.roles[role] = { provider: 'verified-provider', model: 'real-model', maxTokens: 4096 }; return settings; };
const stored = (extra = {}) => ({ settings: configured(), configured: true, keyConfigured: true, disclosureAccepted: true, revision: 1, ...extra });
const buttons = () => [...document.querySelectorAll('button')];
const click = async (text) => { const button = buttons().find(item => item.textContent.trim() === text || item.textContent.startsWith(text)); assert.ok(button, 'Button exists: ' + text); await act(async () => button.click()); return button; };
async function setValue(element, value) { assert.ok(element); await act(async () => { const proto = element.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(element, value); element.dispatchEvent(new window.Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); }); }
function mount(Component, initial) { const root = createRoot(document.getElementById('root')); let props = initial; return { get props() { return props; }, async render(change = {}) { props = { ...props, ...change }; await act(async () => root.render(React.createElement(Component, props))); }, async unmount() { await act(async () => root.unmount()); } }; }
const team = (extra = {}) => mount(client.TeamView, { catalog, sessionId: 's-one', sessionContext: { workspace: '/fixture/project', canStart: true }, settings: configured(), configured: true, snapshot: null, onOpenSettings() {}, onCancel: async () => {}, onRefresh() {}, onDemo() {}, ...extra });
const settingsView = (extra = {}) => mount(client.TeamSettingsView, { setup: stored(), catalog, credential: { configured: true, writable: true }, onSave: async () => {}, onClose() {}, onRefresh() {}, ...extra });
const liveSnapshot = () => { const value = client.teamDemoSnapshot(); return { ...value, demo: false, sessionId: 's-one', roles: configured().roles, jev: { ...value.jev, mode: 'live' } }; };

test('normal team view has six roles and native /team guidance, never per-run forms', async () => {
  let opened = 0; const view = team({ onOpenSettings() { opened++; } });
  try { await view.render(); assert.equal(document.querySelectorAll('.tm-role-card').length, 6); assert.match(document.querySelector('.tm-command-guide').textContent, /\/team/); assert.equal(document.querySelectorAll('textarea,input,select:not([aria-label="界面风格"])').length, 0); assert.equal(document.querySelector('.tm-composer,.tm-confirm,.tm-settings'), null); assert.ok(!document.body.textContent.includes('确认并启动')); await click('团队设置'); assert.equal(opened, 1); } finally { await view.unmount(); }
});

test('missing setup and missing automatic verification stay actionable without per-run forms', async () => {
  const view = team({ configured: false, sessionContext: { setupRequired: true, reason: '尚未完成设置' } });
  try { await view.render(); assert.match(document.querySelector('.tm-command-guide').textContent, /先完成一次团队设置/); await view.render({ configured: true, sessionContext: { reason: '未发现可安全运行的项目测试，请检查 package.json 后重试。' } }); assert.match(document.body.textContent, /未发现可安全运行的项目测试/); assert.equal(document.querySelectorAll('textarea,input,select:not([aria-label="界面风格"])').length, 0); } finally { await view.unmount(); }
});

test('setup exposes exactly six native model choices and a masked native credential field', async () => {
  const view = settingsView();
  try { await view.render(); assert.equal(document.querySelectorAll('.tm-model-config').length, 6); assert.equal(document.querySelector('input[aria-label="Jev API 密钥"]').type, 'password'); assert.equal(document.querySelector('input[aria-label="Jev API 密钥"]').value, ''); assert.equal(document.querySelectorAll('textarea').length, 0); assert.equal(document.querySelector('[aria-label="验证配置"]'), null); assert.equal(document.querySelector('.tm-advanced-settings').open, false); assert.match(document.querySelector('.tm-disclosure').textContent, /以后由我主动发起的 \/team/); assert.match(document.querySelector('.tm-disclosure').textContent, /新增权限不会自动批准/); for (const option of document.querySelectorAll('.tm-model-config select option')) assert.ok(['', 'verified-provider', 'real-model', 'native-high'].includes(option.value)); } finally { await view.unmount(); }
});

test('once-only consent is required before saving and first setup never inherits browser storage', async () => {
  localStorage.setItem('dsh-desktop-workflow:team-settings:v2', JSON.stringify({ ...configured(), apiKey: 'old-secret', jev: { disclosureAccepted: true } }));
  let saved; const view = settingsView({ setup: stored({ disclosureAccepted: false }), onSave: async input => { saved = input; } });
  try { await view.render(); const consent = document.querySelector('input[type=checkbox][aria-label]'); assert.equal(consent.checked, false); assert.ok(buttons().find(item => item.textContent === '保存团队设置').disabled); await act(async () => consent.click()); await click('保存团队设置'); assert.equal(saved.disclosureAccepted, true); assert.equal(saved.jevKey, undefined); assert.ok(!document.body.textContent.includes('old-secret')); } finally { await view.unmount(); localStorage.clear(); }
});

test('unavailable saved model identifiers are visible and never replaced automatically', async () => {
  const config = stored(); config.settings.roles.planner = { provider: 'removed-provider', model: 'exact-removed-model', maxTokens: 4096 }; let saves = 0;
  const view = settingsView({ setup: config, onSave: async () => { saves++; } });
  try { await view.render(); assert.equal(document.querySelector('select[aria-label="规划者提供方"]').value, 'removed-provider'); assert.equal(document.querySelector('select[aria-label="规划者模型"]').value, 'exact-removed-model'); assert.match(document.querySelector('.tm-model-grid').textContent, /当前不可用/); assert.ok(buttons().find(item => item.textContent === '保存团队设置').disabled); assert.equal(saves, 0); assert.equal(config.settings.roles.planner.model, 'exact-removed-model'); } finally { await view.unmount(); }
});

test('saving clears user-entered key immediately and repeated clicks do not repeat submission', async () => {
  let received, resolve, count = 0; const view = settingsView({ onSave: input => { received = input; count++; return new Promise(done => { resolve = done; }); } });
  try { await view.render(); const input = document.querySelector('input[type=password]'); await setValue(input, 'fixture-key-never-store'); const save = buttons().find(item => item.textContent === '保存团队设置'); await act(async () => { save.click(); save.click(); }); assert.equal(count, 1); assert.equal(received.jevKey, 'fixture-key-never-store'); assert.equal(input.value, ''); assert.equal(localStorage.length, 0); assert.ok(!document.body.textContent.includes('fixture-key-never-store')); assert.ok(save.disabled); await act(async () => resolve()); } finally { await view.unmount(); }
});

test('unwritable credentials cannot accept a key or silently start a task', async () => {
  const view = settingsView({ setup: stored({ configured: false, keyConfigured: false }), credential: { configured: false, writable: false } });
  try { await view.render(); assert.ok(document.querySelector('input[type=password]').disabled); assert.ok(buttons().find(item => item.textContent === '保存团队设置').disabled); assert.match(document.body.textContent, /原生凭据存储暂不可写/); } finally { await view.unmount(); }
});

function connectedHost(overrides = {}) {
  const calls = [], keyWrites = []; let setup = stored();
  const ctx = { connection: { rpc: { async call(_channel, endpoint, payload) { calls.push({ endpoint, payload }); if (endpoint.endsWith('/settings')) return { ok: true, value: setup }; if (endpoint.endsWith('/catalog')) return { ok: true, value: catalog }; if (endpoint.endsWith('/configure')) { setup = stored({ settings: payload.settings, revision: 2 }); return { ok: true, value: setup }; } if (endpoint.endsWith('/snapshot')) return { ok: true, value: { snapshot: null, context: { sessionId: payload.sessionId, setupRequired: false } } }; throw new Error('Unexpected endpoint: ' + endpoint); } } }, remote: { credentials: { async describe(refs) { assert.deepEqual(refs, ['DSH_TEAM_JEV_API_KEY']); return { ok: true, value: { DSH_TEAM_JEV_API_KEY: { configured: true, writable: true } } }; }, async set(ref, value) { keyWrites.push({ ref, value }); return { ok: true, value: undefined }; } } }, ...overrides };
  return { ctx, calls, keyWrites };
}

test('connected save uses only native credential namespace; configure stores metadata with revision', async () => {
  const host = connectedHost(); const view = mount(client.ConnectedTeamSettings, { ctx: host.ctx, onClose() {} });
  try { await view.render(); await setValue(document.querySelector('input[type=password]'), 'fixture-native-key'); await click('保存团队设置'); assert.deepEqual(host.keyWrites, [{ ref: 'DSH_TEAM_JEV_API_KEY', value: 'fixture-native-key' }]); const save = host.calls.find(item => item.endpoint.endsWith('/configure')); assert.equal(save.payload.expectedRevision, 1); assert.equal(save.payload.disclosureAccepted, true); assert.deepEqual(save.payload.settings, configured()); assert.ok(!JSON.stringify(host.calls).includes('fixture-native-key')); assert.equal(localStorage.length, 0); assert.equal(document.querySelector('input[type=password]').value, ''); assert.match(document.body.textContent, /设置已保存/); } finally { await view.unmount(); }
});

test('native credential exceptions cannot echo entered keys or retry writes', async () => {
  const host = connectedHost(); let attempts = 0; host.ctx.remote.credentials.set = async () => { attempts++; throw new Error('fixture-secret-echo'); }; const view = mount(client.ConnectedTeamSettings, { ctx: host.ctx, onClose() {} });
  try { await view.render(); await setValue(document.querySelector('input[type=password]'), 'fixture-secret-echo'); await click('保存团队设置'); assert.equal(attempts, 1); assert.ok(!document.body.textContent.includes('fixture-secret-echo')); assert.match(document.body.textContent, /密钥保存结果未确认/); assert.equal(host.calls.filter(item => item.endpoint.endsWith('/configure')).length, 0); assert.equal(document.querySelector('input[type=password]').value, ''); } finally { await view.unmount(); }
});

test('partial save reports key saved and settings conflict, without re-sending the key', async () => {
  const host = connectedHost(); const original = host.ctx.connection.rpc.call; host.ctx.connection.rpc.call = async (...args) => args[1].endsWith('/configure') ? { ok: false, error: { message: '设置已在其他窗口更新，请刷新重试。' } } : original(...args); const view = mount(client.ConnectedTeamSettings, { ctx: host.ctx, onClose() {} });
  try { await view.render(); await setValue(document.querySelector('input[type=password]'), 'fixture-new-key'); await click('保存团队设置'); assert.equal(host.keyWrites.length, 1); assert.match(document.body.textContent, /Jev 密钥已保存，但团队设置未完成/); assert.match(document.body.textContent, /其他窗口更新/); assert.equal(document.querySelector('input[type=password]').value, ''); } finally { await view.unmount(); }
});

test('connected normal view only reads settings/catalog/snapshot and never starts from render or text', async () => {
  const host = connectedHost(); localStorage.setItem('dsh-desktop-workflow:team-settings:v2', 'malformed-old-data'); const view = mount(client.ConnectedTeam, { ctx: host.ctx, sessionId: 's-one', onOpenSettings() {} });
  try { await view.render(); assert.ok(host.calls.every(item => /\/(settings|catalog|snapshot)$/.test(item.endpoint))); assert.equal(document.querySelectorAll('textarea,input,select:not([aria-label="界面风格"])').length, 0); assert.match(document.body.textContent, /目录模型/); } finally { await view.unmount(); localStorage.clear(); }
});

test('session changes discard a late snapshot and abort old polling', async () => {
  let resolveA, signalA; const host = connectedHost(); const original = host.ctx.connection.rpc.call; host.ctx.connection.rpc.call = async (...args) => { if (args[1].endsWith('/snapshot') && args[2].sessionId === 'A') { signalA = args[3]; return new Promise(resolve => { resolveA = resolve; }); } return original(...args); }; const view = mount(client.ConnectedTeam, { ctx: host.ctx, sessionId: 'A', onOpenSettings() {} });
  try { await view.render(); await view.render({ sessionId: 'B' }); assert.equal(signalA.aborted, true); await act(async () => resolveA({ ok: true, value: { snapshot: { ...liveSnapshot(), goal: 'STALE A SHOULD NOT APPEAR' }, context: { sessionId: 'A' } } })); assert.ok(!document.body.textContent.includes('STALE A SHOULD NOT APPEAR')); } finally { await view.unmount(); }
});

test('live running results retain cancellation and prevent demo replacement or duplicate cancellation', async () => {
  let cancelled = 0, finish; const view = team({ snapshot: liveSnapshot(), onCancel: () => { cancelled++; return new Promise(resolve => { finish = resolve; }); } });
  try { await view.render(); assert.ok(document.querySelector('.tm-running-bar')); assert.equal(document.querySelector('.tm-command-guide'), null); assert.ok(buttons().find(button => button.textContent === '演示').disabled); const stop = buttons().find(button => button.textContent === '停止本次运行'); await act(async () => { stop.click(); stop.click(); }); assert.equal(cancelled, 1); assert.ok(stop.disabled); await act(async () => finish()); } finally { await view.unmount(); }
});

test('fixture graph renders exactly recorded nodes and edges with escaped public output', async () => {
  const snapshot = client.teamDemoSnapshot(); snapshot.nodes.at(-1).output = '<script>window.compromised=true</script>'; const view = team({ snapshot });
  try { await view.render(); assert.ok(document.querySelector('.tm-demo-banner')); await click('任务关系'); assert.equal(document.querySelectorAll('.tm-task-node').length, snapshot.nodes.length); assert.equal(document.querySelectorAll('.tm-edge').length, snapshot.edges.length); await act(async () => document.querySelectorAll('.tm-task-node')[snapshot.nodes.length - 1].click()); assert.match(document.querySelector('.tm-evidence pre').textContent, /<script>/); assert.equal(document.querySelectorAll('script').length, 0); assert.equal(window.compromised, undefined); } finally { await view.unmount(); }
});

test('Jev lane changes never replace roles and historical decisions default collapsed', async () => {
  const snapshot = liveSnapshot(); const view = team({ snapshot });
  try { await view.render(); assert.equal(document.querySelector('.tm-jev-decisions').open, false); assert.match(document.querySelector('.tm-jev-next').textContent, /continue/); const models = [...document.querySelectorAll('.tm-role-model')].map(item => item.textContent); await view.render({ snapshot: { ...snapshot, jev: { ...snapshot.jev, lane: 'high', round: 2 } } }); assert.match(document.querySelector('.tm-jev-metrics').textContent, /high/); assert.deepEqual([...document.querySelectorAll('.tm-role-model')].map(item => item.textContent), models); await click('查看最新 Jev 节点'); assert.match(document.querySelector('.tm-inspector').textContent, /Jev · 独立服务/); } finally { await view.unmount(); }
});

test('completion requires all independent gates, and fixture evidence remains visibly synthetic', async () => {
  const snapshot = { ...liveSnapshot(), status: 'completed' }; const view = team({ snapshot });
  try { const evidence = { checksPassed: true, scopeOk: true, diffAvailable: true, verified: true, reason: 'Native host checks passed' }; for (const gate of ['checksPassed', 'scopeOk', 'diffAvailable', 'verified']) { await view.render({ snapshot: { ...snapshot, jev: { ...snapshot.jev, evidence: { ...evidence, [gate]: false } } } }); assert.match(document.querySelector('.tm-run-state .tm-status').textContent, /完成条件未满足/); } await view.render({ snapshot: { ...snapshot, jev: { ...snapshot.jev, evidence } } }); assert.match(document.querySelector('.tm-gates-heading').textContent, /全部通过/); const fixture = client.teamDemoSnapshot(); delete fixture.demo; await view.render({ snapshot: fixture }); assert.ok(document.querySelector('.tm-demo-banner')); assert.equal(document.querySelector('.tm-running-bar'), null); assert.match(document.querySelector('.tm-jev-connection').textContent, /FIXTURE/); } finally { await view.unmount(); }
});

function commandHost() {
  let mounted = 'A', event, mountedListener, commandDisposed = false, mountedDisposed = false;
  const opens = [], calls = [];
  const ctx = { sidebarRight: { mounted: { getSnapshot: () => mounted, subscribe(fn) { mountedListener = fn; return () => { mountedDisposed = true; }; } }, openTab(...args) { opens.push(args); } }, on(name, fn) { assert.equal(name, 'command/executed'); event = fn; return () => { commandDisposed = true; }; }, connection: { rpc: { async call(_channel, endpoint, payload, signal) { calls.push({ endpoint, payload, signal }); return { ok: true, value: { snapshot: null, context: { setupRequired: false } } }; } } } };
  return { ctx, opens, calls, emit(...args) { event(...args); }, navigate(id) { mounted = id; mountedListener(); }, get disposed() { return commandDisposed && mountedDisposed; } };
}
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

test('only official /team execution in the currently mounted session opens results', async () => {
  const host = commandHost(); const dispose = client.registerTeamCommandListener(host.ctx);
  try { host.emit('A', 'other', { kind: 'success', text: '/team spoofed' }); host.emit('B', 'team', { kind: 'success' }); await tick(); assert.equal(host.calls.length, 0); host.emit('A', 'team', { kind: 'success', text: 'arbitrary user-visible host text' }); await tick(); assert.equal(host.calls.length, 1); assert.equal(host.calls[0].endpoint, 'dsh-desktop-workflow/team/snapshot'); assert.deepEqual(host.opens, [['dsh-desktop-workflow', { params: { view: 'results' } }]]); } finally { dispose(); assert.equal(host.disposed, true); }
});

test('native command settings-required opens dedicated setup and blocked commands open results', async () => {
  const host = commandHost(); let setupRequired = true; host.ctx.connection.rpc.call = async () => ({ ok: true, value: { snapshot: null, context: { setupRequired } } }); const dispose = client.registerTeamCommandListener(host.ctx);
  try { host.emit('A', 'team', { kind: 'success' }); await tick(); assert.equal(host.opens[0][1].params.view, 'settings'); setupRequired = false; host.emit('A', 'team', { kind: 'error', text: 'Missing project checks' }); await tick(); assert.equal(host.opens[1][1].params.view, 'results'); } finally { dispose(); }
});

test('late native command responses cannot open after A to B to A navigation or cleanup', async () => {
  const host = commandHost(); let resolve, signal; host.ctx.connection.rpc.call = async (_c, _e, _p, s) => { signal = s; return new Promise(done => { resolve = done; }); }; const dispose = client.registerTeamCommandListener(host.ctx);
  host.emit('A', 'team', { kind: 'success' }); host.navigate('B'); host.navigate('A'); resolve({ ok: true, value: { context: { setupRequired: false } } }); await tick(); assert.equal(host.opens.length, 0); host.emit('A', 'team', { kind: 'success' }); dispose(); assert.equal(signal.aborted, true); resolve({ ok: true, value: { context: { setupRequired: true } } }); await tick(); assert.equal(host.opens.length, 0);
});

test('native plugin registers team panel and global settings section with lifecycle cleanup', async () => {
  const host = commandHost(); const definitions = [], cleanups = []; const ctx = { ...host.ctx, effect(fn) { cleanups.push(fn()); }, sidebarRightTabs: { register(def) { definitions.push(def); return () => {}; } }, slots: { inject(_name, fn) { return fn(); }, register(def, Component) { definitions.push({ ...def, Component }); return () => {}; } } };
  client.apply(ctx); const section = definitions.find(def => def.name === 'settings.section'); assert.equal(section.id, 'dsh-desktop-workflow'); assert.equal(section.label(), '多模型团队'); assert.ok(definitions.find(def => def.key === 'dsh-desktop-workflow')); for (const cleanup of cleanups.reverse()) await cleanup(); assert.equal(host.disposed, true); assert.equal(document.querySelectorAll('style[data-dsh-desktop-workflow]').length, 0);
});

test('saved TypeSafe consent can be explicitly revoked without re-entering a key', async () => {
  let saved; const view = settingsView({ onSave: async input => { saved = input; } });
  try { await view.render(); await act(async () => document.querySelector('input[type=checkbox][aria-label]').click()); const save = buttons().find(item => item.textContent === '保存团队设置'); assert.equal(save.disabled, false); await click('保存团队设置'); assert.equal(saved.disclosureAccepted, false); assert.equal(saved.jevKey, undefined); } finally { await view.unmount(); }
});

test('read-only host settings disable key edits and save, while retaining explicit refresh', async () => {
  const view = settingsView({ setup: stored({ writable: false }) });
  try { await view.render(); assert.ok(document.querySelector('input[type=password]').disabled); assert.ok(buttons().find(item => item.textContent === '保存团队设置').disabled); assert.equal(buttons().find(item => item.textContent === '刷新设置').disabled, false); assert.match(document.body.textContent, /团队设置不可写/); } finally { await view.unmount(); }
});

test('selecting a different role model requests its actual host capabilities without saving', async () => {
  const host = connectedHost(); const second = { ...catalog, providers: [{ ...catalog.providers[0], models: [...catalog.providers[0].models, { id: 'second-native-model', name: '第二模型' }] }] }; const original = host.ctx.connection.rpc.call; host.ctx.connection.rpc.call = async (...args) => { const response = await original(...args); if (args[1].endsWith('/catalog')) response.value = second; return response; }; const view = mount(client.ConnectedTeamSettings, { ctx: host.ctx, onClose() {} });
  try { await view.render(); await setValue(document.querySelector('select[aria-label="规划者模型"]'), 'second-native-model'); assert.ok(host.calls.filter(item => item.endpoint.endsWith('/catalog')).at(-1).payload.selected.some(item => item.model === 'second-native-model')); assert.equal(host.calls.filter(item => item.endpoint.endsWith('/configure')).length, 0); assert.equal(document.querySelector('select[aria-label="规划者模型"]').value, 'second-native-model'); } finally { await view.unmount(); }
});

test('settings disclose native plaintext credential storage and missing-runner pending verification', async () => {
  const view = settingsView();
  try { await view.render(); const storage = document.querySelector('.tm-key-storage'); assert.ok(storage); assert.equal(storage.open, false); assert.match(storage.textContent, /本地明文文件/); assert.match(storage.textContent, /仅文件所属用户可读写/); assert.match(storage.textContent, /不是加密保险库/); assert.match(document.querySelector('.tm-disclosure').textContent, /仍可在允许范围内修改项目/); assert.match(document.querySelector('.tm-disclosure').textContent, /待验证/); assert.ok(document.querySelector('style').textContent.includes('.tm-root{box-sizing:border-box}')); } finally { await view.unmount(); }
});

test('icon-only narrow team settings control retains an explicit accessible name', async () => {
  const view = team();
  try { await view.render(); assert.equal(document.querySelector('.tm-config-trigger').getAttribute('aria-label'), '团队设置'); } finally { await view.unmount(); }
});

test('pending verification is a distinct terminal result, with no active cancel or false success', async () => {
  const view = team({ snapshot: { ...liveSnapshot(), status: 'unverified', message: '已产生允许范围内的改动，结果待验证。' } });
  try { await view.render(); assert.match(document.querySelector('.tm-run-state .tm-status').textContent, /待验证/); assert.equal(document.querySelector('.tm-running-bar'), null); assert.ok(document.querySelector('.tm-command-guide')); assert.equal(document.querySelector('.tm-gates-heading>.is-passed'), null); assert.match(document.querySelector('.tm-overview').textContent, /结果待验证/); } finally { await view.unmount(); }
});
