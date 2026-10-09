/** Fork-only test: reading and saving the verification profiles the plugin owns. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readServerConfig, readRunConfig, validateProfiles, validateRunConfig, saveRunConfig, saveProfiles, ENTRY_ID } from '../src/server-config.js';

const good = () => ({
  id: 'project-checks',
  name: '项目检查',
  checks: [{ id: 'test', argv: ['node', '--test', 'test/acceptance.mjs'], timeoutMs: 60000 }],
  protectedPaths: ['test/acceptance.mjs', 'package.json'],
  expectsChanges: true,
});

test('a well-formed profile list survives validation unchanged', () => {
  assert.deepEqual(validateProfiles([good()]), [good()]);
});

test('an unnamed profile falls back to its id and expectsChanges defaults to true', () => {
  const [profile] = validateProfiles([{ ...good(), name: undefined, expectsChanges: undefined }]);
  assert.equal(profile.name, 'project-checks');
  assert.equal(profile.expectsChanges, true);
});

test('invalid ids, argv, timeouts and protected paths are refused', () => {
  const cases = [
    { ...good(), id: 'bad id' },
    { ...good(), id: 'x'.repeat(65) },
    { ...good(), checks: [] },
    { ...good(), checks: [1, 2, 3, 4, 5].map(index => ({ id: `c${index}`, argv: ['node'], timeoutMs: 1000 })) },
    { ...good(), checks: [{ id: 'test', argv: [], timeoutMs: 60000 }] },
    { ...good(), checks: [{ id: 'test', argv: ['node'], timeoutMs: 999 }] },
    { ...good(), checks: [{ id: 'test', argv: ['node'], timeoutMs: 60001 }] },
    { ...good(), checks: [{ id: 'test', argv: ['node'], timeoutMs: 60000.5 }] },
    { ...good(), checks: [{ id: 'test', argv: ['no\u0000de'], timeoutMs: 60000 }] },
    { ...good(), protectedPaths: [] },
    { ...good(), protectedPaths: ['../secrets'] },
    { ...good(), protectedPaths: ['/etc/passwd'] },
    { ...good(), protectedPaths: ['test/*.mjs'] },
    { ...good(), protectedPaths: ['a\\b'] },
  ];
  for (const [index, input] of cases.entries()) {
    assert.throws(() => validateProfiles([input]), TypeError, `case ${index} must be refused`);
  }
  assert.throws(() => validateProfiles('nope'), TypeError);
  assert.throws(() => validateProfiles(Array.from({ length: 13 }, () => good())), TypeError);
});

test('the reader reports no editor service instead of pretending to be writable', () => {
  const view = readServerConfig(undefined);
  assert.equal(view.available, false);
  assert.equal(view.writable, false);
  assert.deepEqual(view.verificationProfiles, []);
  assert.ok(view.reason.includes('cordis.patch.yml'));
});

test('the reader prefers the override layer and survives an invalid stored value', () => {
  const entry = { id: ENTRY_ID, name: 'dsh-desktop-workflow' };
  const editor = {
    entries: () => [entry],
    configuration: () => [{ entry, inherited: { verificationProfiles: [good()] }, override: { verificationProfiles: [{ ...good(), id: 'from-override' }] } }],
  };
  assert.deepEqual(readServerConfig(editor).verificationProfiles.map(p => p.id), ['from-override']);

  const broken = { entries: () => [entry], configuration: () => [{ entry, override: { verificationProfiles: [{ id: 'x', checks: [], protectedPaths: ['a'] }] } }] };
  const view = readServerConfig(broken);
  assert.deepEqual(view.verificationProfiles, []);
  assert.ok(typeof view.invalid === 'string' && view.invalid.length > 0);
});

test('saving edits only this plugin row and only its own key', async () => {
  const entry = { id: ENTRY_ID, name: 'dsh-desktop-workflow' };
  let seen;
  const editor = {
    entries: () => [{ id: 'some-other-plugin' }, entry],
    configuration: () => [],
    edit: async (target, change) => { seen = { target, result: change({ stateFile: '', staleAfterMs: 120000, jev: { credentialEnv: 'TYPESAFE_API_KEY' } }, {}) }; },
  };
  await saveProfiles([good()], { configEditor: editor });
  assert.equal(seen.target, entry, 'must target the desktop-workflow row');
  assert.deepEqual(seen.result, {
    stateFile: '', staleAfterMs: 120000,
    jev: { credentialEnv: 'TYPESAFE_API_KEY', disclosureAccepted: false },
    verificationProfiles: [good()], models: {}, verification: { profileId: '', scope: [] },
  });
});

test('saving without an editor service or a fallback writer fails loudly', async () => {
  await assert.rejects(() => saveProfiles([good()], {}), /无法保存/);
});

test('saving an invalid list never reaches the editor', async () => {
  let called = false;
  const editor = { entries: () => [{ id: ENTRY_ID }], edit: async () => { called = true; } };
  await assert.rejects(() => saveProfiles([{ ...good(), checks: [] }], { configEditor: editor }), TypeError);
  assert.equal(called, false, 'the editor must not be touched for an invalid payload');
});

test('the run configuration validates models, the selected profile and the scope', () => {
  const input = { verificationProfiles: [good()], models: { default: 'p/m', worker: 'q/w' }, verification: { profileId: 'project-checks', scope: ['src'] }, jev: { disclosureAccepted: true } };
  const out = validateRunConfig(input);
  assert.deepEqual(out.models, { default: 'p/m', worker: 'q/w' });
  assert.deepEqual(out.verification, { profileId: 'project-checks', scope: ['src'] });
  assert.equal(out.jev.disclosureAccepted, true);

  assert.throws(() => validateRunConfig({ ...input, models: { nope: 'p/m' } }), /未知的岗位/);
  assert.throws(() => validateRunConfig({ ...input, models: { default: 'nomodel' } }), /提供方\/模型/);
  assert.throws(() => validateRunConfig({ ...input, verification: { profileId: 'ghost', scope: ['src'] } }), /不在已配置/);
  assert.throws(() => validateRunConfig({ ...input, verification: { profileId: '', scope: ['../x'] } }), /相对仓库根/);
  assert.throws(() => validateRunConfig({ ...input, jev: { disclosureAccepted: 'yes' } }), /布尔值/);
  assert.equal(validateRunConfig({ ...input, jev: undefined }).jev.disclosureAccepted, false, 'consent defaults to withheld');
});

test('the run configuration reads back what was written, and consent defaults to withheld', () => {
  const entry = { id: ENTRY_ID };
  const editor = { entries: () => [entry], configuration: () => [{ entry, override: { verificationProfiles: [good()], models: { default: 'p/m' }, verification: { profileId: 'project-checks', scope: ['src'] }, jev: { disclosureAccepted: true } } }] };
  const view = readRunConfig(editor);
  assert.deepEqual(view.models, { default: 'p/m' });
  assert.equal(view.disclosureAccepted, true);
  assert.deepEqual(readRunConfig(undefined).models, {});
  assert.equal(readRunConfig(undefined).disclosureAccepted, false);
});

test('saving the run configuration writes every owned key at once', async () => {
  const entry = { id: ENTRY_ID };
  let seen;
  const editor = { entries: () => [entry], configuration: () => [], edit: async (_t, change) => { seen = change({ stateFile: '' }, {}); } };
  await saveRunConfig({ verificationProfiles: [good()], models: { default: 'p/m' }, verification: { profileId: 'project-checks', scope: ['src'] }, jev: { disclosureAccepted: true } }, { configEditor: editor });
  assert.deepEqual(seen, { stateFile: '', verificationProfiles: [good()], models: { default: 'p/m' }, verification: { profileId: 'project-checks', scope: ['src'] }, jev: { disclosureAccepted: true } });
});
