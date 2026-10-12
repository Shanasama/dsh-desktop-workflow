import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { JSDOM, ResourceLoader, VirtualConsole } from 'jsdom';

const compiled = await build({ entryPoints: [new URL('../client/team-demo.ts', import.meta.url).pathname], bundle: true, write: false, format: 'esm', platform: 'node', target: 'es2022' });
const { playingDemoSnapshot, appendDemoRelation, DEMO_RELATIONS, terminalDemoSnapshot } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitFor(predicate, description, timeout = 5000) {
  const deadline = performance.now() + timeout;
  do {
    const result = predicate();
    if (result) return result;
    await wait(5);
  } while (performance.now() < deadline);
  assert.fail(`Timed out waiting for ${description}`);
}

async function withPreview(run) {
  const html = await readFile(new URL('../preview/standalone.html', import.meta.url), 'utf8');
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<link[^>]+href=/i);
  let requests = 0;
  const errors = [];
  const forbidden = () => { requests++; throw Error('Preview must be self-contained'); };
  class NoNetwork extends ResourceLoader { fetch() { return forbidden(); } }
  const dom = new JSDOM(html, { url: 'file:///offline-preview.html', runScripts: 'dangerously', resources: new NoNetwork(), pretendToBeVisual: true,
    virtualConsole: new VirtualConsole().on('jsdomError', error => errors.push(error.message)),
    beforeParse(window) {
      window.fetch = async () => forbidden();
      for (const name of ['WebSocket', 'XMLHttpRequest', 'EventSource']) window[name] = class { constructor() { forbidden(); } };
      window.navigator.sendBeacon = forbidden;
      window.HTMLElement.prototype.scrollIntoView = function () {};
      // JSDOM has no layout engine; deterministic boxes exercise measured-pair
      // rendering here. Real responsive geometry is checked separately in a browser.
      const positions = { jev: [350, 25], planner: [40, 240], reviewer: [660, 240], coordinator: [350, 240], researcher: [40, 500], explorer: [350, 500], worker: [660, 500], verification: [350, 760] };
      const rect = (x, y, width, height) => ({ x, y, left: x, top: y, width, height, right: x + width, bottom: y + height, toJSON() { return this; } });
      window.HTMLElement.prototype.getBoundingClientRect = function () {
        if (this.classList.contains('tm-topology-map')) return rect(20, 30, 960, 1010);
        const position = positions[this.dataset.topologyCard];
        return position ? rect(20 + position[0], 30 + position[1], 240, 200) : rect(0, 0, 0, 0);
      };
    },
  });
  const document = dom.window.document;
  const buttonText = text => [...document.querySelectorAll('button')].find(button => button.textContent === text);
  const runId = () => document.querySelector('.preview-shell')?.dataset.previewRunId;
  const interact = async (find, description, ready) => {
    assert.equal(typeof ready, 'function', `${description} needs a concrete post-action condition`);
    const button = await waitFor(() => { const value = find(); return value && !value.disabled && value; }, `${description} enabled`);
    button.click();
    await waitFor(ready, `${description} render`);
    // Yield a task after the concrete DOM commit so passive cursor effects from
    // that commit finish before the next simulated user action.
    await wait(0);
  };
  const click = (selector, ready) => interact(() => document.querySelector(selector), selector, ready);
  const clickText = (text, ready) => interact(() => buttonText(text), text, ready);
  const showcase = async () => {
    const previousId = runId();
    await clickText('同岗位双模型', () => runId() !== previousId && buttonText('继续播放') && document.querySelector('[data-topology-card=researcher]')?.dataset.runningCount === '2');
  };
  const select = async (label, value) => {
    const field = await waitFor(() => document.querySelector(`select[aria-label="${label}"]`), `${label} selector`);
    field.value = value; field.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    await waitFor(() => label === '预览状态' ? document.querySelector('.preview-shell')?.dataset.previewMode === value : label === '界面风格' ? document.querySelector('.tm-root')?.dataset.theme === value : document.querySelector('.preview-shell')?.style.maxWidth === `${value}px`, `${label}=${value} render`);
    await wait(0);
  };
  try {
    await waitFor(() => document.querySelector('.tm-root') && buttonText('同岗位双模型') && buttonText('暂停播放') && document.querySelector('.tm-topology-live-relations')?.getAttribute('width') === '960', 'initial mounted preview and measured topology');
    await wait(0);
    await run({ dom, document, click, clickText, showcase, select, buttonText, runId });
    assert.equal(requests, 0);
    assert.deepEqual(errors, []);
  } finally { dom.window.close(); }
}

test('synthetic fixture relations have complete event fields, exact endpoint models and monotonic sequences', () => {
  let snapshot = playingDemoSnapshot(3, 7);
  assert.equal(snapshot.nodes.filter(node => node.status === 'running').length, 3);
  for (const relation of DEMO_RELATIONS) {
    const prior = snapshot.events.at(-1).seq;
    snapshot = appendDemoRelation(snapshot, relation.id);
    const event = snapshot.events.find(item => item.seq > prior && item.type === 'relation_activated');
    assert.ok(event);
    assert.deepEqual([event.fromNodeId, event.toNodeId, event.kind], [relation.from, relation.to, relation.kind]);
    assert.ok(snapshot.edges.some(edge => edge.id === event.edgeId && edge.from === event.fromNodeId && edge.to === event.toNodeId && edge.kind === event.kind));
    assert.ok(snapshot.nodes.some(node => node.id === event.fromNodeId));
    assert.ok(snapshot.nodes.some(node => node.id === event.toNodeId));
    assert.deepEqual(snapshot.events.map(item => item.seq), Array.from({ length: snapshot.events.length }, (_, index) => index + 1));
    assert.equal(snapshot.id, 'playing-fixture-7');
    assert.equal(snapshot.production.budget.physicalCalls, 0);
  }
  const routes = snapshot.production.routing.decisions;
  assert.match(routes.find(item => item.nodeId === 'research-fast-retry').model, /轻量/);
  assert.match(routes.find(item => item.nodeId === 'research-deep').model, /深度/);
  assert.equal(routes.some(item => ['decide', 'verify'].includes(item.nodeId)), false);
  assert.equal(snapshot.nodes.find(node => node.id === 'decide').status, 'completed');
  assert.equal(snapshot.nodes.find(node => node.id === 'verify').status, 'running');
  assert.equal(snapshot.jev.decisions.at(-1).nodeId, 'decide');
  assert.equal(snapshot.jev.evidence.verified, false);
});

test('synthetic terminal fixtures preserve identity and stop every running node', () => {
  for (const status of ['completed', 'unverified', 'blocked', 'failed', 'cancelled']) {
    const snapshot = terminalDemoSnapshot(status, 19);
    assert.equal(snapshot.status, status);
    assert.equal(snapshot.id, 'playing-fixture-19');
    assert.ok(snapshot.finishedAt);
    assert.equal(snapshot.nodes.some(node => node.status === 'running'), false);
    assert.equal(snapshot.jev.evidence.verified, status === 'completed');
    assert.equal(snapshot.production.budget.physicalCalls, 0);
  }
});

test('self-contained preview opens on populated live topology and stays labeled synthetic', async () => {
  await withPreview(async ({ document, click, buttonText, showcase }) => {
    assert.ok(document.querySelector('.tm-root'));
    assert.match(document.body.textContent, /SYNTHETIC DEMO/);
    assert.match(document.querySelector('.preview-watermark').textContent, /合成演示/);
    assert.equal(document.querySelector('.preview-options').open, false);
    assert.match(document.querySelector('[role=tab][aria-selected=true]').textContent, /团队拓扑/);
    assert.equal(document.querySelectorAll('.tm-topology-card[data-live=true]').length, 2);
    assert.equal(document.querySelector('[data-topology-card=researcher]').dataset.live, 'true');
    assert.equal(document.querySelector('[data-topology-card=explorer]').dataset.live, 'true');
    const researcher = document.querySelector('[data-topology-card=researcher]');
    assert.match(researcher.textContent, /模拟·轻量研究模型/);
    assert.match(researcher.textContent, /模拟·深度研究模型/);
    assert.ok(researcher.querySelector('[data-node-id="research-fast"]'));
    assert.ok(researcher.querySelector('[data-node-id="research-deep"]'));
    assert.equal(document.querySelectorAll('.tm-topology-relation,.tm-topology-self-event').length, 0, 'Initial history must not pulse');
    await click('[data-preview-action=play]', () => buttonText('继续播放'));
    assert.equal(buttonText('继续播放')?.disabled, false);
    await showcase();
    await click('[role=tab]:nth-child(2)', () => document.querySelectorAll('.tm-task-node[data-live=true]').length === 3);
    assert.equal(document.querySelectorAll('.tm-task-node[data-live=true]').length, 3);
    assert.match(document.body.textContent, /本节点选定模型/);
  });
});

test('offline relation controls pulse the real role pair including same-role retry and independent verification', async () => {
  await withPreview(async ({ document, click, showcase }) => {
    const rolePairs = { dispatch: ['coordinator', 'researcher'], dependency: ['researcher', 'worker'], 'cross-role': ['researcher', 'explorer'], join: ['explorer', 'reviewer'], feedback: ['reviewer', 'worker'], jev: ['reviewer', 'jev'], verification: ['jev', 'verification'] };
    for (const relation of DEMO_RELATIONS) {
      await showcase();
      await click(`[data-preview-relation="${relation.id}"]`, () => document.querySelector(`${relation.id === 'retry' ? '.tm-topology-self-event' : '.tm-topology-relation'}[data-kind="${relation.kind}"]`));
      const event = document.querySelector(`${relation.id === 'retry' ? '.tm-topology-self-event' : '.tm-topology-relation'}[data-kind="${relation.kind}"]`);
      assert.ok(event, `Missing fresh ${relation.id} relation`);
      assert.equal(event.dataset.fromNodeId, relation.from);
      assert.equal(event.dataset.toNodeId, relation.to);
      if (relation.id === 'retry') {
        assert.ok(event.closest('[data-topology-card=researcher]'));
        assert.equal(document.querySelectorAll('.tm-topology-relation[data-kind=retry]').length, 0);
        assert.match(document.querySelector('[data-topology-card=researcher] [data-node-id=research-fast-retry]').textContent, /轻量研究模型/);
      } else assert.deepEqual([event.dataset.fromCard, event.dataset.toCard], rolePairs[relation.id]);
      if (relation.id === 'jev') assert.equal(document.querySelector('[data-topology-card=jev]').dataset.live, 'true');
      if (relation.id === 'verification') {
        assert.equal(document.querySelector('[data-topology-card=jev]').dataset.live, 'false');
        assert.equal(document.querySelector('[data-topology-card=verification]').dataset.live, 'false');
        assert.match(document.querySelector('[data-topology-card=verification]').textContent, /宿主|非模型|独立验证/);
        assert.equal(document.querySelector('[data-topology-card=verification] .tm-node-route-reason'), null);
      }
    }
  });
});

test('duplicate, out-of-order, regressed and switched run snapshots never replay consumed relations', async () => {
  await withPreview(async ({ document, click, showcase, runId }) => {
    await showcase();
    await click('[data-preview-relation=cross-role]', () => document.querySelector('.tm-topology-relation[data-from-card=researcher][data-to-card=explorer]'));
    assert.equal(document.querySelectorAll('.tm-topology-relation').length, 1);
    await waitFor(() => !document.querySelector('.tm-topology-relation'), 'one-shot relation expiration');
    assert.equal(document.querySelectorAll('.tm-topology-relation').length, 0);
    for (const response of ['duplicate', 'out-of-order']) {
      await click(`[data-preview-response="${response}"]`, () => document.querySelector('.preview-qa-notice')?.textContent.includes(response === 'duplicate' ? '重复已有' : '颠倒快照'));
      assert.equal(document.querySelectorAll('.tm-topology-relation').length, 0);
    }
    let previousId = runId();
    await click('[data-preview-action=switch-run]', () => runId() !== previousId);
    assert.equal(document.querySelectorAll('.tm-topology-relation').length, 0);
    previousId = runId();
    await click('[data-preview-action=return-run]', () => runId() !== previousId);
    assert.equal(document.querySelectorAll('.tm-topology-relation').length, 0);
    await click('[data-preview-relation=feedback]', () => document.querySelector('.tm-topology-relation[data-kind=feedback]'));
    assert.equal(document.querySelectorAll('.tm-topology-relation[data-kind=feedback]').length, 1);
    await click('[data-preview-response=regressed]', () => document.querySelector('.tm-event-integrity')?.textContent.includes('回退'));
    assert.equal(document.querySelectorAll('.tm-topology-relation').length, 0);
    assert.match(document.body.textContent, /回退|高水位/);
    await click('[data-preview-relation=join]', () => document.querySelector('.tm-topology-relation[data-kind=join]'));
    assert.equal(document.querySelectorAll('.tm-topology-relation[data-kind=join]').length, 1, 'A fresh event must recover the canonical sequence after an old response');
  });
});

test('terminal and stale scenes stop activity while tabs, widths, theme and host background remain independent', async () => {
  await withPreview(async ({ document, click, clickText, select, showcase }) => {
    await showcase();
    const originalTheme = document.querySelector('.tm-root').dataset.theme;
    const hostBefore = document.body.style.backgroundColor;
    await clickText('宿主背景：深色', () => document.body.style.backgroundColor !== hostBefore);
    assert.notEqual(document.body.style.backgroundColor, hostBefore);
    assert.equal(document.querySelector('.tm-root').dataset.theme, originalTheme);
    await select('界面风格', 'classic');
    assert.equal(document.querySelector('.tm-root').dataset.theme, 'classic');
    await select('预览宽度', '320'); assert.equal(document.querySelector('.preview-shell').style.maxWidth, '320px');
    await select('预览宽度', '420'); assert.equal(document.querySelector('.preview-shell').style.maxWidth, '420px');
    await clickText('减少动效：跟随系统', () => document.querySelector('[data-preview-reduced-motion=true]'));
    assert.ok(document.querySelector('[data-preview-reduced-motion=true]'));
    await select('预览状态', '连接中断');
    assert.equal(document.querySelectorAll('.tm-topology-card[data-live=true]').length, 0);
    await click('[data-preview-relation=feedback]', () => document.querySelector('.preview-qa-notice')?.textContent.includes('审查反馈'));
    assert.equal(document.querySelectorAll('.tm-topology-relation').length, 0);
    await select('预览状态', '播放演示');
    assert.equal(document.querySelectorAll('.tm-topology-relation').length, 0);
    for (const status of ['受阻', '待验证', '完成', '失败', '已取消']) {
      await select('预览状态', status);
      assert.equal(document.querySelectorAll('.tm-topology-card[data-live=true]').length, 0, status);
      assert.equal(document.querySelectorAll('.tm-topology-relation,.tm-topology-self-event').length, 0, status);
      assert.equal(document.querySelector('[data-preview-relation=dispatch]').disabled, true);
      assert.ok(document.querySelector('.preview-watermark'));
    }
  });
});
