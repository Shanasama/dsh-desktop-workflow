/** Fork-only test: the credential bridge and its wiring into the Jev client. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCredentialBridge } from '../src/credential-bridge.js';
import { createJevClient } from '../src/jev-client.js';

const NAME = 'TYPESAFE_API_KEY';
// The environment layer is injected, so cases never touch the shared process.env and can run concurrently.
const env = value => (value === undefined ? {} : { [NAME]: value });
const service = value => ({ resolve: async () => value });

test('a stored credential wins over the environment', async () => {
  const bridge = createCredentialBridge(() => service({ value: 'from-store' }), env('from-env'));
  await bridge.refresh([NAME]);
  assert.equal(bridge.resolve(NAME), 'from-store');
});

test('an empty or missing stored value falls back to the environment', async () => {
  for (const stored of [undefined, { value: '' }, { value: '   ' }]) {
    const bridge = createCredentialBridge(() => service(stored), env('from-env'));
    await bridge.refresh([NAME]);
    assert.equal(bridge.resolve(NAME), 'from-env', `stored ${JSON.stringify(stored)} must not shadow the environment`);
  }
});

test('without a credentials service only the environment answers', async () => {
  const bridge = createCredentialBridge(() => undefined, env('env-only'));
  void bridge.refresh([NAME]);
  assert.equal(bridge.resolve(NAME), 'env-only');
  assert.equal(bridge.snapshot([NAME]).fromCredentialsService, false);
});

test('a throwing credentials service is contained and never leaks its message', async () => {
  const throwing = createCredentialBridge(() => ({ resolve: async () => { throw new Error('secret leaked here'); } }), {});
  await throwing.refresh([NAME]);
  assert.equal(throwing.resolve(NAME), undefined);
  assert.doesNotThrow(() => createCredentialBridge(() => { throw new Error('reflector exploded'); }, {}).resolve(NAME));
  await throwing.dispose();
});

test('the Jev client reports configured only for a non-empty resolved value', async () => {
  const bridge = createCredentialBridge(() => service({ value: 'live-key' }), {});
  const jev = createJevClient({ credentialEnv: NAME }, { resolveCredential: name => bridge.resolve(name) });
  assert.equal(jev.status().configured, false, 'nothing resolved yet');
  await bridge.refresh([NAME]);
  assert.equal(jev.status().configured, true);
  await bridge.dispose();
});

test('a blank environment value never counts as configured', () => {
  const bridge = createCredentialBridge(() => service({ value: '  ' }), env('   '));
  const jev = createJevClient({ credentialEnv: NAME }, { resolveCredential: name => bridge.resolve(name) });
  assert.equal(jev.status().configured, false);
});

test('the diagnostics snapshot reports layers without exposing a value', async () => {
  const bridge = createCredentialBridge(() => service({ value: 'from-store' }), env('from-env'));
  await bridge.refresh([NAME]);
  const view = bridge.snapshot([NAME]);
  assert.deepEqual(view, { fromCredentialsService: true, names: [{ name: NAME, stored: true, environment: true }] });
  const text = JSON.stringify(view);
  assert.ok(!text.includes('from-store') && !text.includes('from-env'));
});
