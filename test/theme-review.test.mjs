import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';

// Independent integration coverage: theme changes must never become settings writes
// or disturb the connected workflow's existing component state and request guards.
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'http://localhost' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, Event: dom.window.Event, MouseEvent: dom.window.MouseEvent, IS_REACT_ACT_ENVIRONMENT: true });
HTMLElement.prototype.scrollIntoView = function () {};
const React = await import('react');
const { act } = React;
const { createRoot } = await import('react-dom/client');
const require = createRequire(import.meta.url);
const bundle = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8');
const themeKey = 'dsh-desktop-workflow:ui-theme:v1';
function loadClient() {
  let client;
  window.__ModuleLoader__ = { load({ factory }) { client = factory(require); } };
  vm.runInThisContext(bundle);
  return client;
}
function mount(Component, props) {
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  return {
    container,
    async render() { await act(async () => root.render(React.createElement(Component, props))); },
    async unmount() { await act(async () => root.unmount()); container.remove(); },
  };
}
async function setValue(element, value) {
  assert.ok(element);
  await act(async () => {
    const proto = element.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(element, value);
    element.dispatchEvent(new window.Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
}
async function click(element) { assert.ok(element); await act(async () => element.click()); }
const switchIn = container => container.querySelector('select[aria-label="界面风格"]');
const currentTheme = container => container.querySelector('.tm-root').dataset.theme;
const catalog = { available: true, jev: { configured: true, available: true }, providers: [{ id: 'review-provider', name: 'Review provider', models: [{ id: 'review-model-a', name: 'Review Model A' }, { id: 'review-model-b', name: 'Review Model B' }] }] };
function setupFor(client) {
  const settings = client.createDefaultTeamSettings();
  for (const role of Object.keys(settings.roles)) settings.roles[role] = { provider: 'review-provider', model: 'review-model-a', maxTokens: 4096 };
  return { settings, configured: true, keyConfigured: true, disclosureAccepted: true, revision: 1 };
}
function teamProps(client, extra = {}) {
  return { catalog, sessionId: 'review-session', settings: setupFor(client).settings, configured: true, snapshot: null, onOpenSettings() {}, onCancel: async () => {}, onRefresh() {}, onDemo() {}, ...extra };
}
function settingsProps(client, extra = {}) {
  return { setup: setupFor(client), catalog, credential: { configured: true, writable: true }, onSave: async () => {}, onClose() {}, onRefresh() {}, ...extra };
}
function liveSnapshot(client) {
  const snapshot = client.teamDemoSnapshot();
  return { ...snapshot, id: 'review-run', goal: 'PRIVATE FIXTURE TASK NEVER PERSIST', sessionId: 'review-session', demo: false, status: 'running', roles: setupFor(client).settings.roles, jev: { ...snapshot.jev, mode: 'live' } };
}
function connectedHost(client) {
  const calls = [], keyWrites = [], describeCalls = [];
  const setup = setupFor(client), snapshot = liveSnapshot(client);
  const ctx = {
    connection: { rpc: { async call(_channel, endpoint, payload, signal) {
      calls.push({ endpoint, payload, signal });
      if (endpoint.endsWith('/settings')) return { ok: true, value: setup };
      if (endpoint.endsWith('/catalog')) return { ok: true, value: catalog };
      if (endpoint.endsWith('/snapshot')) return { ok: true, value: { snapshot, context: { sessionId: payload.sessionId } } };
      throw new Error('Unexpected mutation: ' + endpoint);
    } } },
    remote: { credentials: {
      async describe(refs) { describeCalls.push(refs); return { ok: true, value: { DSH_TEAM_JEV_API_KEY: { configured: true, writable: true } } }; },
      async set(ref, value) { keyWrites.push({ ref, value }); throw new Error('Unexpected credential write'); },
    } },
  };
  return { ctx, calls, keyWrites, describeCalls };
}

test('theme review: connected settings and workflow synchronize without RPCs, saving credentials, or resetting drafts', async () => {
  window.localStorage.clear(); window.sessionStorage.clear();
  const client = loadClient(), host = connectedHost(client);
  const workflow = mount(client.ConnectedTeam, { ctx: host.ctx, sessionId: 'review-session', onOpenSettings() {} });
  const settings = mount(client.ConnectedTeamSettings, { ctx: host.ctx, onClose() {} });
  try {
    await workflow.render(); await settings.render();
    for(const view of [workflow,settings])assert.deepEqual([...switchIn(view.container).options].map(option=>[option.value,option.textContent]),[['arknights','泰拉'],['classic','原版 UI']]);
    const password = settings.container.querySelector('input[type=password]');
    await setValue(password, 'fixture-key-must-remain-in-memory');
    await setValue(settings.container.querySelector('[aria-label="规划者模型"]'), 'review-model-b');
    await click(settings.container.querySelectorAll('.tm-role-selector button')[4]);
    const consent = settings.container.querySelector('input[type=checkbox][aria-label]');
    await click(consent);
    await click(workflow.container.querySelector('.tm-role-card--researcher'));
    await click(workflow.container.querySelector('.tm-control-details summary'));
    const root = workflow.container.querySelector('.tm-root');
    const cards = [...workflow.container.querySelectorAll('.tm-role-card')];
    const callsBefore = host.calls.length, describeBefore = host.describeCalls.length;
    await setValue(switchIn(workflow.container), 'classic');
    assert.equal(currentTheme(workflow.container), 'classic'); assert.equal(currentTheme(settings.container), 'classic');
    await setValue(switchIn(settings.container), 'arknights');
    assert.equal(currentTheme(workflow.container), 'arknights'); assert.equal(currentTheme(settings.container), 'arknights');
    assert.equal(workflow.container.querySelector('.tm-root'), root, 'theme does not remount the workflow');
    assert.deepEqual([...workflow.container.querySelectorAll('.tm-role-card')], cards);
    assert.equal(settings.container.querySelector('input[type=password]'), password);
    assert.equal(password.value, 'fixture-key-must-remain-in-memory');
    assert.equal(settings.container.querySelector('[aria-label="规划者模型"]').value, 'review-model-b');
    assert.equal(settings.container.querySelectorAll('.tm-role-selector button')[4].getAttribute('aria-pressed'), 'true');
    assert.equal(consent.checked, false);
    assert.equal(workflow.container.querySelector('.tm-role-card--researcher').getAttribute('aria-pressed'), 'true');
    assert.equal(workflow.container.querySelector('.tm-control-details').open, true);
    assert.equal(host.calls.length, callsBefore); assert.equal(host.describeCalls.length, describeBefore);
    assert.deepEqual(host.keyWrites, []);
    assert.equal(window.localStorage.length, 1); assert.equal(window.localStorage.key(0), themeKey);
    assert.equal(window.localStorage.getItem(themeKey), 'arknights'); assert.equal(window.sessionStorage.length, 0);
    assert.ok(!JSON.stringify(host.calls).includes('fixture-key-must-remain-in-memory'));
  } finally { await settings.unmount(); await workflow.unmount(); window.localStorage.clear(); }
});

test('theme review: pending cancel retains run, selected node, zoom, disclosure, and duplicate guard', async () => {
  window.localStorage.clear();
  const client = loadClient(); let cancelCount = 0, finishCancel;
  const view = mount(client.TeamView, teamProps(client, { snapshot: liveSnapshot(client), onCancel: () => { cancelCount++; return new Promise(resolve => { finishCancel = resolve; }); } }));
  try {
    await view.render(); await click(view.container.querySelectorAll('[role=tab]')[1]);
    const node = view.container.querySelectorAll('.tm-task-node')[2]; await click(node);
    await setValue(view.container.querySelector('.tm-graph-tools select'), '0.75');
    const activity = view.container.querySelector('.tm-activity-toggle'); await click(activity);
    const activityState = activity.getAttribute('aria-expanded');
    const evidence = view.container.querySelector('.tm-inspector').textContent;
    const stop = view.container.querySelector('.tm-running-bar button'); await click(stop);
    await setValue(switchIn(view.container), 'classic'); await setValue(switchIn(view.container), 'arknights');
    assert.equal(view.container.querySelector('.tm-running-bar button'), stop); assert.equal(stop.disabled, true);
    await click(stop); assert.equal(cancelCount, 1);
    assert.equal(node.getAttribute('aria-pressed'), 'true');
    assert.equal(view.container.querySelector('.tm-inspector').textContent, evidence);
    assert.equal(view.container.querySelector('.tm-graph-tools select').value, '0.75');
    assert.equal(activity.getAttribute('aria-expanded'), activityState);
    assert.match(view.container.querySelector('.tm-overview').textContent, /PRIVATE FIXTURE TASK NEVER PERSIST/);
    assert.equal(window.localStorage.getItem(themeKey), 'arknights');
    await act(async () => finishCancel()); assert.equal(stop.disabled, false);
  } finally { await view.unmount(); window.localStorage.clear(); }
});

test('theme review: pending save remains single-shot through repeated switches', async () => {
  window.localStorage.clear();
  const client = loadClient(); let finishSave, saveCount = 0, input;
  const view = mount(client.TeamSettingsView, settingsProps(client, { onSave: value => { input = value; saveCount++; return new Promise(resolve => { finishSave = resolve; }); } }));
  try {
    await view.render(); await setValue(view.container.querySelector('input[type=password]'), 'fixture-save-key');
    const save = [...view.container.querySelectorAll('button')].find(button => button.textContent === '保存团队设置');
    await click(save); assert.equal(save.disabled, true); assert.equal(input.jevKey, 'fixture-save-key');
    await setValue(switchIn(view.container), 'classic'); await setValue(switchIn(view.container), 'arknights');
    assert.equal(save.disabled, true); await click(save); assert.equal(saveCount, 1);
    assert.equal(view.container.querySelector('input[type=password]').value, '');
    assert.equal(window.localStorage.length, 1); assert.equal(window.localStorage.getItem(themeKey), 'arknights');
    await act(async () => finishSave()); assert.equal(save.disabled, false);
  } finally { await view.unmount(); window.localStorage.clear(); }
});

test('theme review: blocked, missing, and null storage keep the switch and multiple mounts usable', async () => {
  const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
  for (const unavailable of [() => { throw new window.DOMException('Storage denied', 'SecurityError'); }, () => undefined, () => null]) {
    Object.defineProperty(window, 'localStorage', { configurable: true, get: unavailable });
    const client = loadClient(), first = mount(client.TeamView, teamProps(client)), second = mount(client.TeamSettingsView, settingsProps(client));
    try {
      await first.render(); await second.render(); assert.equal(currentTheme(first.container), 'arknights');
      await setValue(switchIn(first.container), 'classic'); assert.equal(currentTheme(second.container), 'classic');
      await first.unmount();
      const reopened = mount(client.TeamView, teamProps(client));
      try { await reopened.render(); assert.equal(currentTheme(reopened.container), 'classic'); await setValue(switchIn(second.container), 'arknights'); assert.equal(currentTheme(reopened.container), 'arknights'); }
      finally { await reopened.unmount(); }
    } finally { if (first.container.isConnected) await first.unmount(); await second.unmount(); Object.defineProperty(window, 'localStorage', original); }
  }
});

test('theme review: quota-denied writes retain in-memory choice after every surface unmounts', async () => {
  window.localStorage.clear(); window.localStorage.setItem(themeKey, 'arknights');
  const oldSetItem = window.Storage.prototype.setItem;
  window.Storage.prototype.setItem = function () { throw new window.DOMException('Quota denied', 'QuotaExceededError'); };
  const client = loadClient(); let view = mount(client.TeamView, teamProps(client));
  try {
    await view.render(); await setValue(switchIn(view.container), 'classic'); await view.unmount();
    view = mount(client.TeamSettingsView, settingsProps(client)); await view.render();
    assert.equal(currentTheme(view.container), 'classic'); assert.equal(window.localStorage.getItem(themeKey), 'arknights');
  } finally { await view.unmount(); window.Storage.prototype.setItem = oldSetItem; window.localStorage.clear(); }
});

test('theme review: invalid saved values safely default without rewriting or interpreting old settings', async () => {
  for (const invalid of ['', 'CLASSIC', 'unknown', '{"theme":"classic","apiKey":"fixture-old-secret"}', '<script>theme()</script>']) {
    window.localStorage.clear(); window.localStorage.setItem(themeKey, invalid);
    window.localStorage.setItem('dsh-desktop-workflow:team-settings:v2', '{"apiKey":"fixture-old-secret"}');
    const client = loadClient(), view = mount(client.TeamSettingsView, settingsProps(client));
    try {
      await view.render(); assert.equal(currentTheme(view.container), 'arknights');
      assert.equal(window.localStorage.getItem(themeKey), invalid);
      assert.equal(view.container.querySelector('input[type=password]').value, '');
      assert.ok(!view.container.textContent.includes('fixture-old-secret'));
      await setValue(switchIn(view.container), 'classic'); assert.equal(window.localStorage.getItem(themeKey), 'classic');
    } finally { await view.unmount(); window.localStorage.clear(); }
  }
});

test('theme review: cross-window preference updates synchronize but unrelated/session storage events do not', async () => {
  window.localStorage.clear(); window.sessionStorage.clear();
  const client = loadClient(), view = mount(client.TeamView, teamProps(client));
  const foreignWindow = new JSDOM('', { url: 'https://unrelated.example' }).window;
  const event = async (key, newValue, storageArea = window.localStorage) => act(async () => window.dispatchEvent(new window.StorageEvent('storage', { key, newValue, storageArea })));
  try {
    await view.render(); await setValue(switchIn(view.container), 'classic');
    await event('unrelated:key', 'arknights'); assert.equal(currentTheme(view.container), 'classic');
    await event(themeKey, 'arknights', window.sessionStorage); assert.equal(currentTheme(view.container), 'classic');
    await event(null, null, window.sessionStorage); assert.equal(currentTheme(view.container), 'classic');
    await event(themeKey, 'arknights', foreignWindow.localStorage); assert.equal(currentTheme(view.container), 'classic');
    await event(null, null, foreignWindow.localStorage); assert.equal(currentTheme(view.container), 'classic');
    await event(themeKey, 'arknights', null); assert.equal(currentTheme(view.container), 'arknights');
    await event(themeKey, 'classic', null); assert.equal(currentTheme(view.container), 'classic');
    window.localStorage.setItem(themeKey, 'arknights'); await event(themeKey, 'arknights'); assert.equal(currentTheme(view.container), 'arknights');
    window.localStorage.setItem(themeKey, 'classic'); await event(themeKey, 'classic'); assert.equal(currentTheme(view.container), 'classic');
    window.localStorage.removeItem(themeKey); await event(themeKey, null); assert.equal(currentTheme(view.container), 'arknights');
    await setValue(switchIn(view.container), 'classic'); window.localStorage.clear(); await event(null, null); assert.equal(currentTheme(view.container), 'arknights');
  } finally { await view.unmount(); window.localStorage.clear(); window.sessionStorage.clear(); foreignWindow.close(); }
});

test('theme review: persisted choice survives a fresh bundle instance without writing on initial mount', async () => {
  window.localStorage.clear();
  let client = loadClient(), view = mount(client.TeamView, teamProps(client));
  await view.render(); assert.equal(window.localStorage.length, 0);
  await setValue(switchIn(view.container), 'classic'); await view.unmount();
  client = loadClient(); view = mount(client.TeamSettingsView, settingsProps(client));
  try { await view.render(); assert.equal(currentTheme(view.container), 'classic'); assert.equal(switchIn(view.container).value, 'classic'); assert.equal(window.localStorage.length, 1); }
  finally { await view.unmount(); window.localStorage.clear(); }
});
