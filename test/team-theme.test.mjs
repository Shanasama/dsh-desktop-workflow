import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../client/team-theme.css', import.meta.url), 'utf8');
const originalCss = await readFile(new URL('../client/team.css', import.meta.url), 'utf8');
const source = await readFile(new URL('../client/TeamView.tsx', import.meta.url), 'utf8');
const store = await readFile(new URL('../client/team-theme.tsx', import.meta.url), 'utf8');
const preview = await readFile(new URL('../preview/main.tsx', import.meta.url), 'utf8');
const luminance = color => [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16) / 255)
  .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
function assertContrast(foreground, background, label) { assert.ok(contrast(foreground, background) >= 4.5, `${label}: ${foreground} on ${background} is ${contrast(foreground, background).toFixed(2)}:1`); }
function declarations(selector) { const start = css.indexOf(selector + '{'); assert.ok(start >= 0, selector); return css.slice(start + selector.length + 1, css.indexOf('}', start)); }
function tokens(selector) { return Object.fromEntries([...declarations(selector).matchAll(/--tm-([a-z-]+):(#[0-9a-f]{6})/g)].map(match => [match[1], match[2]])); }
const root = tokens('.tm-root[data-theme=arknights]');

test('tactical dark-surface text, selection, and semantic statuses meet normal-text AA contrast', () => {
  for (const foreground of ['text', 'muted', 'soft', 'active', 'green', 'red', 'amber']) {
    for (const background of [root.bg, root.panel, root.raised, '#393d42', '#373a2a']) {
      assertContrast(root[foreground], background, foreground);
    }
  }
  assertContrast(root.ink, root.accent, 'primary action / selected role');
  assertContrast('#404c3a', root.accent, 'selected role metadata');
  assertContrast(root.ink, root.paper, 'controller / style switch');
  assertContrast('#4f5556', root.paper, 'controller metadata / inactive graph tabs');
});

test('both light dossier surfaces provide dark status colors and readable evidence', () => {
  for (const selector of ['.tm-root[data-theme=arknights] .tm-overview', '.tm-root[data-theme=arknights] .tm-inspector']) {
    const local = tokens(selector), background = local.panel || root.paper;
    for (const foreground of ['text', 'muted', 'soft', 'active', 'green', 'red', 'amber']) {
      assert.ok(local[foreground], `${selector} defines ${foreground} locally`);
      assertContrast(local[foreground], background, `${selector} ${foreground}`);
    }
  }
  assert.match(css, /:is\(\.tm-facts dd,\.tm-evidence pre\)\{color:var\(--tm-text\)\}/);
});

test('new appearance is opt-in scoped CSS with no hosted assets, font dependency, or decorative animations', () => {
  const themeRules = css.slice(css.indexOf('/* Arknights-inspired terminal.'));
  // Ignore comments and group wrappers, then check every ordinary selector group.
  for (const block of themeRules.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)) {
    const selector = block[1].trim();
    if (selector.startsWith('@')) continue;
    assert.ok(selector.includes('.tm-root[data-theme=arknights]'), `Unscoped theme selector: ${selector}`);
  }
  assert.doesNotMatch(css, /@font-face|@import|url\(|@keyframes/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(originalCss, /\.tm-root button:focus-visible/);
  assert.match(css, /\.tm-panel-header :is\(button:focus-visible,select:focus-visible\)/);
  assert.match(css, /\.tm-role-selector>button\[aria-pressed=true\]:focus-visible/);
  assert.match(css, /\.tm-panel-header \.tm-tabs button\[aria-selected=true\]:focus-visible\{outline-color:var\(--tm-accent\)\}/);
  assertContrast(root.accent, '#202226', 'selected graph tab focus');
  assertContrast('#235b65', root.paper, 'unselected graph tab focus');
});

test('classic base remains graphite and the theme selector is separate from host settings', () => {
  assert.match(originalCss, /--tm-bg:#0d1117/); assert.match(originalCss, /--tm-accent:#69d4df/);
  assert.doesNotMatch(originalCss, /arknights|ui-theme/);
  assert.equal((source.match(/const theme = useTeamTheme\(\)/g) || []).length, 2);
  assert.equal((source.match(/data-theme=\{theme\}/g) || []).length, 2);
  assert.equal((source.match(/<TeamThemeSwitch theme=\{theme\}\/>/g) || []).length, 2);
  assert.doesNotMatch(source, /key=\{theme\}|key=\{`[^`]*theme/);
  assert.match(store, /select aria-label="界面风格"/);
  assert.match(store, /<option value="arknights">泰拉<\/option><option value="classic">原版 UI<\/option>/);
  assert.doesNotMatch(store, /document\.(body|documentElement)|rpc|fetch\(|window\.sessionStorage/);
});

test('preview exposes explicit 320px and 420px container fixtures independently of visual theme', () => {
  assert.match(preview, /aria-label="预览宽度"/);
  for (const value of ['full', '420', '320']) assert.ok(preview.includes(`<option value="${value}">`));
  assert.match(preview, /Fixture 合成数据/); assert.match(preview, /请勿输入真实密钥/);
  assert.match(preview, /toggleAttribute\('data-ds-dark-theme'/);
});
