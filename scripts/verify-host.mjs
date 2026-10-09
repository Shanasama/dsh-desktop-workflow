#!/usr/bin/env node
/** Opt-in integration smoke against installed official DSH packages; no user profile is read or written. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as plugin from '../src/index.js';

const target = '0.2.0-rc.2';
const modules = process.env.DSH_NODE_MODULES;
const resolver = createRequire(modules ? pathToFileURL(join(resolve(modules), '..', 'package.json')) : import.meta.url);
function packagePath(name) { return resolver.resolve(name); }
async function official(name) { return import(pathToFileURL(packagePath('@deepseek-ai/' + name))); }
const dshManifestPath = modules ? join(resolve(modules), '@deepseek-ai/dsh/package.json') : resolver.resolve('@deepseek-ai/dsh/package.json');
const manifest = JSON.parse(await readFile(dshManifestPath, 'utf8'));
assert.equal(manifest.version, target, `This smoke requires official DSH ${target}`);
const { Context } = await official('cordis');
const { default: WebServer } = await official('dsh-host-webserver');
const connection = await official('dsh-client-connection');
const { Loader } = await official('cordis-plugin-loader');
const { ClientModuleRegistry } = await official('dsh-client-modules');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitFor(condition) {
  for (let i = 0; i < 150; i++) { if (condition()) return; await pause(20); }
  throw new Error('Official host service did not become ready within three seconds.');
}

// Real Connection and BrowserAuth; only credential persistence is replaced by an
// ephemeral in-memory fixture. No account/model credential or home directory is used.
{
  const root = new Context();
  let ephemeralRecord;
  root.provide('credentials', { async modifyRecord(_key, update) {
    ephemeralRecord = (await update(ephemeralRecord)) ?? ephemeralRecord;
    return ephemeralRecord;
  } });
  const server = root.plugin(WebServer, { host: '127.0.0.1', port: 0 });
  const conn = root.plugin(connection);
  let fork, indexDispose;
  try {
    await waitFor(() => root.get('connection') && root.get('webServer')?.port);
    const base = `http://127.0.0.1:${root.webServer.port}`;
    indexDispose = root.effect(() => root.webServer.register({ kind: 'exact', path: '/', handler(req, res) {
      if (root.connection.authorizeIndex(req, res)) { res.writeHead(200); res.end('DSH integration fixture'); }
    } }));
    fork = root.plugin(plugin, {});
    await pause(50);
    const envelope = JSON.stringify({ type: 'client-request', rpcId: 'integration-smoke', method: plugin.ENDPOINT, payload: {} });
    const call = (headers = {}) => fetch(base + '/api/' + plugin.ENDPOINT, {
      method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: envelope,
    });
    assert.equal((await call()).status, 401);
    console.log('PASS real host rejects unauthenticated snapshot request');
    const login = await fetch(root.connection.authenticatedUrl(base + '/'), { redirect: 'manual' });
    assert.equal(login.status, 303);
    const cookie = login.headers.get('set-cookie')?.split(';')[0];
    assert.ok(cookie, 'Official authentication must issue a browser cookie');
    const accepted = await call({ cookie });
    assert.equal(accepted.status, 200);
    const body = await accepted.json();
    assert.equal(body.rpcId, 'integration-smoke');
    assert.equal(body.result.ok, true);
    assert.equal(body.result.value.mode, 'waiting');
    assert.equal(accepted.headers.get('cache-control'), 'no-store');
    console.log('PASS real authenticated HTTP route returns waiting snapshot');
    assert.equal((await call({ cookie, origin: 'https://invalid-origin.example' })).status, 403);
    console.log('PASS real host rejects foreign-origin request');
    for(const action of ['start','cancel']){const endpoint='dsh-desktop-workflow/team/'+action;const request=(headers)=>fetch(base+'/api/'+endpoint,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify({type:'client-request',rpcId:'mutating-endpoint',method:endpoint,payload:{}})});assert.equal((await request({})).status,401);assert.equal((await request({cookie,origin:'https://invalid-origin.example'})).status,403);}
    console.log('PASS real host protects team start/cancel with authentication and Origin fences');
    await fork.dispose(); fork = undefined;
    assert.equal((await call({ cookie })).status, 404);
    console.log('PASS plugin unload removes API route');
  } finally {
    if (fork) await fork.dispose();
    if (indexDispose) await indexDispose();
    await conn.dispose(); await server.dispose();
    ephemeralRecord = undefined;
  }
}

// Real Loader and ClientModuleRegistry, not a mocked package/slot registration.
// The host plugin's connection dependency intentionally remains pending here;
// client-module discovery owns the package manifest independently of activation.
{
  const root = new Context();
  const server = root.plugin(WebServer, { host: '127.0.0.1', port: 0 });
  const loaderFork = root.plugin(Loader, { baseUrl: pathToFileURL(dshManifestPath).href });
  let moduleFork;
  try {
    await waitFor(() => root.get('loader') && root.get('webServer')?.port);
    const id = await root.loader.create({ name: new URL('../src/index.js', import.meta.url).href });
    moduleFork = root.plugin(ClientModuleRegistry);
    await root.loader.await();
    await waitFor(() => root.get('clientModules'));
    const row = root.clientModules.graph().entries.find(row => row.id === 'dsh-desktop-workflow');
    assert.ok(row, 'Official module graph must include this package');
    assert.deepEqual(row.inject, ['@deepseek-ai/dsh-client-connection', '@deepseek-ai/dsh-client-ui-sidebar-right', '@deepseek-ai/dsh-client-ui-session', '@deepseek-ai/dsh-api-remotes', '@deepseek-ai/dsh-client-ui-commands', '@deepseek-ai/dsh-client-ui-settings-general']);
    console.log('PASS real Loader discovers Web client and native sidebar dependencies');
    const response = await fetch(new URL(row.url, `http://127.0.0.1:${root.webServer.port}/`));
    assert.equal(response.status, 200);
    const script = await response.text();
    assert.ok(script.includes('__ModuleLoader__.load'));
    assert.ok(script.includes('dsh-desktop-workflow'));
    console.log('PASS official ClientModuleRegistry serves revisioned client bundle');
    root.loader.remove(id); await root.loader.await(); await pause(50);
    assert.ok(!root.clientModules.graph().entries.some(row => row.id === 'dsh-desktop-workflow'));
    console.log('PASS Loader removal withdraws client module graph entry');
  } finally {
    if (moduleFork) await moduleFork.dispose();
    await loaderFork.dispose(); await server.dispose();
  }
}
console.log(`Official DSH ${target} host integration smoke passed. Native Electron visual verification is separate.`);
