/** Fork-only test: the server-side start path behind the chat `run_team` tool. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRunConfig, parseModel, resolveRoles, DEFAULT_LIMITS, ROLES } from '../src/team-tool.js';

const profile = { profileId: 'project-checks', scope: ['src/a.ts'] };
const consent = { jev: { disclosureAccepted: true } };

test('models are written as provider/model and fall through role → default → caller', () => {
  assert.deepEqual(parseModel('deepseek-official/deepseek-flash'), { provider: 'deepseek-official', model: 'deepseek-flash' });
  assert.deepEqual(parseModel({ provider: 'p', model: 'm' }), { provider: 'p', model: 'm' });
  assert.equal(parseModel(''), undefined);
  assert.equal(parseModel('noslash'), undefined);
  assert.equal(parseModel('/model'), undefined);
  assert.equal(parseModel('provider/'), undefined);

  const roles = resolveRoles({ default: 'p/m', worker: 'q/w' }, undefined);
  assert.deepEqual(roles.worker, { provider: 'q', model: 'w' });
  assert.deepEqual(roles.planner, { provider: 'p', model: 'm' });
  assert.equal(Object.keys(roles).length, ROLES.length);

  const caller = resolveRoles({}, { provider: 'caller', model: 'own' });
  assert.deepEqual(caller.reviewer, { provider: 'caller', model: 'own' });
  assert.throws(() => resolveRoles({}, undefined), /未配置模型/);
});

test('a complete configuration produces the same run shape the panel produces', () => {
  const settings = buildRunConfig({ goal: '  实现登录页  ', fallbackModel: { provider: 'p', model: 'm' }, verification: profile, serverConfig: { ...consent, models: { default: 'p/m' } } });
  assert.equal(settings.goal, '实现登录页');
  assert.equal(settings.routeEnabled, false);
  assert.deepEqual(settings.jev, { enabled: true, disclosureAccepted: true });
  assert.deepEqual(settings.verification, profile);
  assert.deepEqual(settings.limits, DEFAULT_LIMITS);
  assert.deepEqual(Object.keys(settings.roles).sort(), [...ROLES].sort());
});

test('each blocker is reported by name instead of starting an unusable run', () => {
  const base = { goal: 'do it', fallbackModel: { provider: 'p', model: 'm' }, verification: profile, serverConfig: { ...consent, models: { default: 'p/m' } } };
  assert.throws(() => buildRunConfig({ ...base, goal: '   ' }), /目标/);
  assert.throws(() => buildRunConfig({ ...base, goal: 'a\u202Eb' }), /方向控制字符/);
  assert.throws(() => buildRunConfig({ ...base, verification: undefined }), /验证方案/);
  assert.throws(() => buildRunConfig({ ...base, verification: { profileId: 'x', scope: [] } }), /允许修改/);
  assert.throws(() => buildRunConfig({ ...base, serverConfig: { models: { default: 'p/m' } } }), /TypeSafe/);
});

test('the calling Agent model is the fallback when config names none', () => {
  const settings = buildRunConfig({ goal: 'x', fallbackModel: { provider: 'p', model: 'm' }, verification: profile, serverConfig: { ...consent } });
  assert.deepEqual(settings.roles.worker, { provider: 'p', model: 'm' });
  assert.throws(() => buildRunConfig({ goal: 'x', verification: profile, serverConfig: { ...consent } }), /未配置模型/);
});

test('a chat message cannot widen the run: unknown keys are ignored, scope stays server-side', () => {
  const settings = buildRunConfig({
    goal: 'x',
    fallbackModel: { provider: 'p', model: 'm' },
    verification: profile,
    serverConfig: { ...consent, models: { default: 'p/m' }, limits: { maxAgents: 4 } },
    // a hostile caller trying to inject run-shaping fields
    roles: { worker: { provider: 'evil', model: 'evil' } },
    limits: { maxAgents: 99 },
    jev: { enabled: false },
  });
  assert.equal(settings.limits.maxAgents, 4, 'the goal argument cannot raise limits');
  assert.deepEqual(settings.roles.worker, { provider: 'p', model: 'm' });
  assert.equal(settings.jev.enabled, true);
});
