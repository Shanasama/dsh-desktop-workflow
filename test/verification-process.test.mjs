import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { runVerificationProcess, createVerificationProcessScope } from '../src/verification-process.js';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-verification-test-'));
  const cwd = path.join(root, 'project');
  const tempRoot = path.join(root, 'capture-root');
  fs.mkdirSync(cwd);
  fs.mkdirSync(tempRoot);
  const sentinel = path.join(tempRoot, 'unrelated.txt');
  fs.writeFileSync(sentinel, 'keep unrelated data');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return {
    root, cwd, tempRoot, sentinel,
    options: { cwd, tempRoot, platform: 'win32', timeoutMs: 4000, testOnlySpawn: process.platform === 'win32' ? undefined : spawn },
    assertClean() {
      assert.deepEqual(fs.readdirSync(tempRoot), ['unrelated.txt']);
      assert.equal(fs.readFileSync(sentinel, 'utf8'), 'keep unrelated data');
    },
    captures() { return fs.readdirSync(tempRoot).filter(name => name.startsWith('dsh-verification-')); },
  };
}

function node(script, args = []) {
  return [process.execPath, '-e', script, ...args];
}

function assertFailure(output, code) {
  assert.equal(output.error?.code, code);
  assert.equal(output.unsettled, true);
  assert.ok(output.status !== 0 || output.error, 'failure must never be a normal successful result');
}

async function waitForFile(file, maxMs = 4000) {
  const until = Date.now() + maxMs;
  while (!fs.existsSync(file)) {
    if (Date.now() >= until) throw new Error(`Timed out waiting for ${path.basename(file)}`);
    await delay(10);
  }
}

// Production callers never pass these overrides from their model-facing payload.
// platform forces the real FD code path on Linux; no fake spawn implementation.
test('FD capture succeeds with UTF-8 on both streams and exact cleanup', async t => {
  const f = fixture(t);
  const output = await runVerificationProcess(node("process.stdout.write('hello 世界 🧪\\n'); process.stderr.write('错误 café\\n')"), f.options);
  assert.equal(output.status, 0);
  assert.equal(output.signal, null);
  assert.equal(output.error, undefined);
  assert.equal(output.stdout, 'hello 世界 🧪\n');
  assert.equal(output.stderr, '错误 café\n');
  assert.equal(output.outputExceeded, false);
  assert.equal(output.unsettled, false);
  assert.equal(output.rootChildClosed, true);
  assert.equal(output.cleanupConfirmed, true);
  f.assertClean();
});

test('FD capture preserves nonzero exit 7 without claiming lifecycle uncertainty', async t => {
  const f = fixture(t);
  const output = await runVerificationProcess(node("console.error('expected failure'); process.exitCode = 7"), f.options);
  assert.equal(output.status, 7);
  assert.equal(output.error, undefined);
  assert.equal(output.stderr, 'expected failure\n');
  assert.equal(output.unsettled, false);
  assert.equal(output.cleanupConfirmed, true);
  f.assertClean();
});

test('FD capture kills a still-running output flood at the soft cap and reads bounded output', async t => {
  const f = fixture(t);
  const output = await runVerificationProcess(node("const fs=require('node:fs'); console.log(process.pid); setInterval(()=>fs.writeSync(1,Buffer.alloc(8192,120)),1)"), { ...f.options, maxBuffer: 32768 });
  assertFailure(output, 'ENOBUFS');
  assert.equal(output.outputExceeded, true);
  assert.ok(output.stdout.length + output.stderr.length <= 32768);
  assert.equal(output.rootChildClosed, true);
  assert.equal(output.cleanupConfirmed, true);
  const pid = Number(output.stdout.split('\n')[0]);
  if (process.platform !== 'win32') assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
  f.assertClean();
});

test('FD cap applies to combined streams and detects a short-lived overflow after exit', async t => {
  const f = fixture(t);
  const output = await runVerificationProcess(node("const fs=require('node:fs'); fs.writeSync(1,'a'.repeat(60)); fs.writeSync(2,'b'.repeat(50))"), { ...f.options, maxBuffer: 100 });
  assertFailure(output, 'ENOBUFS');
  assert.equal(output.outputExceeded, true);
  assert.ok(output.stdout.length + output.stderr.length <= 100);
  assert.equal(output.cleanupConfirmed, true);
  f.assertClean();
});

test('FD output equal to the cap succeeds without silent truncation', async t => {
  const f = fixture(t);
  const output = await runVerificationProcess(node("const fs=require('node:fs'); fs.writeSync(1,'a'.repeat(60)); fs.writeSync(2,'b'.repeat(40))"), { ...f.options, maxBuffer: 100 });
  assert.equal(output.status, 0);
  assert.equal(output.error, undefined);
  assert.equal(output.stdout.length + output.stderr.length, 100);
  assert.equal(output.cleanupConfirmed, true);
  f.assertClean();
});

test('FD timeout kills the direct child and remains unsettled after observed close', async t => {
  const f = fixture(t);
  const began = Date.now();
  const output = await runVerificationProcess(node("console.log('started'); setInterval(()=>{},1000)"), { ...f.options, timeoutMs: 150 });
  assertFailure(output, 'ETIMEDOUT');
  assert.ok(Date.now() - began < 3000);
  assert.equal(output.outputExceeded, false);
  assert.equal(output.rootChildClosed, true);
  assert.equal(output.cleanupConfirmed, true);
  f.assertClean();
});

test('already-aborted execution never dispatches or creates capture artifacts', async t => {
  const f = fixture(t);
  const controller = new AbortController();
  controller.abort();
  const marker = path.join(f.cwd, 'must-not-run');
  const output = await runVerificationProcess(node("require('node:fs').writeFileSync(process.argv[1],'ran')", [marker]), { ...f.options, signal: controller.signal });
  assert.equal(output.error?.code, 'ABORT_ERR');
  assert.equal(output.status, null);
  assert.equal(fs.existsSync(marker), false);
  assert.equal(output.cleanupConfirmed, true);
  f.assertClean();
});

test('abort after child startup kills and closes before cleaning capture', async t => {
  const f = fixture(t);
  const controller = new AbortController();
  const marker = path.join(f.cwd, 'started');
  const pending = runVerificationProcess(node("require('node:fs').writeFileSync(process.argv[1],'started'); setInterval(()=>{},1000)", [marker]), { ...f.options, signal: controller.signal });
  await waitForFile(marker);
  controller.abort();
  const output = await pending;
  assertFailure(output, 'ABORT_ERR');
  assert.equal(output.rootChildClosed, true);
  assert.equal(output.cleanupConfirmed, true);
  f.assertClean();
});

test('missing executable reports ENOENT and removes owned artifacts', async t => {
  const f = fixture(t);
  const output = await runVerificationProcess([path.join(f.cwd, 'no-such-command')], f.options);
  assert.equal(output.error?.code, 'ENOENT');
  assert.equal(output.status, null);
  assert.equal(output.rootChildClosed, true);
  assert.equal(output.cleanupConfirmed, true);
  f.assertClean();
});

test('refuses a temporary root inside cwd before spawning', async t => {
  const f = fixture(t);
  const unsafe = path.join(f.cwd, 'tmp');
  fs.mkdirSync(unsafe);
  const output = await runVerificationProcess(node("process.exit(0)"), { ...f.options, tempRoot: unsafe });
  assert.equal(output.error?.code, 'EVERIFICATIONCAPTURE');
  assert.equal(output.status, null);
  assert.deepEqual(fs.readdirSync(unsafe), []);
  assert.equal(output.cleanupConfirmed, true);
  f.assertClean();
});

test('refuses a temporary root inside enclosing worktree with a nested cwd', async t => {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.root, '.git'));
  fs.writeFileSync(path.join(f.root, '.git', 'HEAD'), 'ref: refs/heads/main');
  const output = await runVerificationProcess(node("process.exit(0)"), f.options);
  assert.equal(output.error?.code, 'EVERIFICATIONCAPTURE');
  assert.equal(output.status, null);
  assert.equal(output.cleanupConfirmed, true);
  f.assertClean();
});

const findCapture = "const fs=require('node:fs'),path=require('node:path'); const dir=path.join(process.argv[1],fs.readdirSync(process.argv[1]).find(n=>n.startsWith('dsh-verification-')));";

test('hostile symlink replacement is rejected and unrelated target is retained', { skip: process.platform === 'win32' && 'Creating symlinks needs Windows developer/admin privileges.' }, async t => {
  const f = fixture(t);
  const replacement = path.join(f.root, 'replacement-link');
  fs.symlinkSync(f.sentinel, replacement);
  const output = await runVerificationProcess(node(findCapture + "fs.renameSync(process.argv[2],path.join(dir,'stdout'));", [f.tempRoot, replacement]), f.options);
  assertFailure(output, 'EVERIFICATIONCAPTURE');
  assert.equal(output.cleanupConfirmed, false);
  assert.equal(fs.readFileSync(f.sentinel, 'utf8'), 'keep unrelated data');
  assert.equal(f.captures().length, 1);
  assert.equal(fs.lstatSync(path.join(f.tempRoot, f.captures()[0], 'stdout')).isSymbolicLink(), true);
});

test('hostile hardlink is rejected and its unowned alias is not deleted', async t => {
  const f = fixture(t);
  const alias = path.join(f.root, 'unowned-hardlink');
  const output = await runVerificationProcess(node(findCapture + "fs.writeSync(1,'linked output'); fs.linkSync(path.join(dir,'stdout'),process.argv[2]);", [f.tempRoot, alias]), f.options);
  assertFailure(output, 'EVERIFICATIONCAPTURE');
  assert.equal(output.cleanupConfirmed, false);
  assert.equal(fs.readFileSync(alias, 'utf8'), 'linked output');
  assert.equal(fs.statSync(alias).nlink, 2);
  assert.equal(f.captures().length, 1);
  assert.equal(fs.readFileSync(f.sentinel, 'utf8'), 'keep unrelated data');
});

test('hostile regular-file replacement is retained rather than deleted', async t => {
  const f = fixture(t);
  const replacement = path.join(f.root, 'replacement-file');
  fs.writeFileSync(replacement, 'replacement', { mode: 0o600 });
  const output = await runVerificationProcess(node(findCapture + "fs.renameSync(process.argv[2],path.join(dir,'stdout'));", [f.tempRoot, replacement]), f.options);
  assertFailure(output, 'EVERIFICATIONCAPTURE');
  assert.equal(output.cleanupConfirmed, false);
  assert.equal(fs.readFileSync(path.join(f.tempRoot, f.captures()[0], 'stdout'), 'utf8'), 'replacement');
  assert.equal(fs.readFileSync(f.sentinel, 'utf8'), 'keep unrelated data');
});

test('hostile directory replacement is retained rather than traversed or recursively removed', async t => {
  const f = fixture(t);
  const prepared = path.join(f.root, 'prepared-replacement-dir');
  fs.mkdirSync(prepared, { mode: 0o700 });
  fs.writeFileSync(path.join(prepared, 'unowned'), 'keep replacement directory');
  const output = await runVerificationProcess(node(findCapture + "fs.renameSync(dir,dir+'.moved'); fs.renameSync(process.argv[2],dir);", [f.tempRoot, prepared]), f.options);
  assertFailure(output, 'EVERIFICATIONCAPTURE');
  assert.equal(output.cleanupConfirmed, false);
  const replacement = f.captures().find(name => !name.endsWith('.moved'));
  // A poll may stop the child between its two renames. Neither location may be
  // deleted by capture cleanup, regardless of which attack step completed.
  const preserved = replacement ? path.join(f.tempRoot, replacement) : prepared;
  assert.equal(fs.readFileSync(path.join(preserved, 'unowned'), 'utf8'), 'keep replacement directory');
  assert.ok(f.captures().some(name => name.endsWith('.moved')));
  assert.equal(fs.readFileSync(f.sentinel, 'utf8'), 'keep unrelated data');
});

test('unexpected capture entries fail cleanup and are retained', async t => {
  const f = fixture(t);
  const output = await runVerificationProcess(node(findCapture + "fs.writeFileSync(path.join(dir,'unowned'),'keep extra data');", [f.tempRoot]), f.options);
  assertFailure(output, 'EVERIFICATIONCLEANUP');
  assert.equal(output.cleanupConfirmed, false);
  assert.equal(fs.readFileSync(path.join(f.tempRoot, f.captures()[0], 'unowned'), 'utf8'), 'keep extra data');
  assert.equal(fs.readFileSync(f.sentinel, 'utf8'), 'keep unrelated data');
});

test('root-child close does not prove inherited-FD descendants have settled', { skip: process.platform === 'win32' }, async t => {
  const f = fixture(t);
  const ready = path.join(f.root, 'descendant-ready');
  const done = path.join(f.root, 'descendant-done');
  // This finite, harmless descendant writes only to our fixtures and exits on its
  // own. The outer host must supervise such descendants in production.
  const grandchild = "const fs=require('node:fs');fs.writeFileSync(process.argv[1],'ready');setTimeout(()=>{fs.writeSync(1,'late descendant output');fs.writeFileSync(process.argv[2],'done')},500);";
  const script = "const fs=require('node:fs');const c=require('node:child_process').spawn(process.execPath,['-e',process.argv[1],process.argv[2],process.argv[3]],{stdio:['ignore',1,2]});c.unref();const timer=setInterval(()=>{if(fs.existsSync(process.argv[2])){clearInterval(timer);process.exit(0)}},5);";
  const output = await runVerificationProcess(node(script, [grandchild, ready, done]), f.options);
  assert.equal(output.status, 0);
  assert.equal(output.rootChildClosed, true);
  assert.equal(fs.existsSync(ready), true);
  assert.equal(fs.existsSync(done), false, 'direct child closes before its inherited-FD descendant finishes');
  // On Windows, an open descendant handle may prevent deletion; either cleanup
  // outcome remains distinct from process-tree settlement.
  if (!output.cleanupConfirmed) assert.equal(output.unsettled, true);
  await waitForFile(done);
  await delay(30);
  assert.equal(fs.readFileSync(done, 'utf8'), 'done');
  if (output.cleanupConfirmed) f.assertClean();
});

test('POSIX path retains spawnSync behavior', { skip: process.platform === 'win32' }, async t => {
  const f = fixture(t);
  const output = await runVerificationProcess(node("console.log('posix')"), { cwd: f.cwd, timeoutMs: 1000 });
  assert.equal(output.status, 0);
  assert.equal(output.stdout, 'posix\n');
  assert.equal(output.cleanupConfirmed, true);
  f.assertClean();
});

test('scope retains independent captures and confirms exact cleanup only at finalization', async t => {
  const f = fixture(t);
  const scope = createVerificationProcessScope();
  t.after(() => scope.finalize());
  const first = await runVerificationProcess(node("console.log('first')"), { ...f.options, captureScope: scope });
  const second = await runVerificationProcess(node("console.log('second')"), { ...f.options, captureScope: scope });
  assert.equal(first.status, 0);
  assert.equal(second.status, 0);
  assert.equal(first.cleanupConfirmed, null);
  assert.equal(second.cleanupConfirmed, null);
  assert.equal(f.captures().length, 2);
  scope.checkpoint();
  const settled = await scope.finalize();
  assert.equal(settled.unsettled, false);
  assert.equal(settled.cleanupConfirmed, true);
  assert.equal(first.cleanupConfirmed, true);
  assert.equal(second.cleanupConfirmed, true);
  assert.deepEqual(await scope.finalize(), settled, 'finalization is idempotent');
  f.assertClean();
});

async function runDelayedDescendant(f, scope, bytes = 2 * 1024 * 1024) {
  const ready = path.join(f.root, 'late-ready');
  const done = path.join(f.root, 'late-done');
  const grandchild = "const fs=require('node:fs');fs.writeFileSync(process.argv[1],'ready');setTimeout(()=>{fs.writeSync(1,Buffer.alloc(Number(process.argv[3]),120));fs.writeFileSync(process.argv[2],'done')},250);";
  const script = "const fs=require('node:fs');const c=require('node:child_process').spawn(process.execPath,['-e',process.argv[1],process.argv[2],process.argv[3],process.argv[4]],{stdio:['ignore',1,2]});c.unref();const timer=setInterval(()=>{if(fs.existsSync(process.argv[2])){clearInterval(timer);process.exit(0)}},5);";
  const output = await runVerificationProcess(node(script, [grandchild, ready, done, String(bytes)]), { ...f.options, maxBuffer: 1024, captureScope: scope });
  return { output, done };
}

test('scope polling rejects delayed inherited-FD overflow after root exit 0', { skip: process.platform === 'win32' }, async t => {
  const f = fixture(t);
  const scope = createVerificationProcessScope();
  t.after(() => scope.finalize());
  const { output, done } = await runDelayedDescendant(f, scope);
  assert.equal(output.status, 0);
  assert.equal(output.error, undefined);
  assert.equal(output.cleanupConfirmed, null);
  assert.equal(fs.existsSync(done), false);
  assert.equal(f.captures().length, 1, 'FD capture is still owned and monitored after root close');
  await waitForFile(done);
  await delay(20);
  assert.equal(output.outputExceeded, true);
  assert.equal(output.unsettled, true);
  assert.throws(() => scope.checkpoint(), { code: 'ENOBUFS', unsettled: true });
  const settled = await scope.finalize();
  assert.equal(settled.error?.code, 'ENOBUFS');
  assert.equal(settled.unsettled, true);
  assert.equal(settled.cleanupConfirmed, true);
  f.assertClean();
});

test('scope checkpoint detects late overflow even while JavaScript timers were blocked', { skip: process.platform === 'win32' }, async t => {
  const f = fixture(t);
  const scope = createVerificationProcessScope();
  t.after(() => scope.finalize());
  const { output, done } = await runDelayedDescendant(f, scope);
  assert.equal(output.error, undefined);
  const until = Date.now() + 3000;
  // Model a synchronous manifest scan: the child can write while our interval
  // cannot run. The explicit trusted checkpoint must detect it synchronously.
  while (!fs.existsSync(done) && Date.now() < until) { /* bounded test-only wait */ }
  assert.equal(fs.existsSync(done), true);
  assert.throws(() => scope.checkpoint(), { code: 'ENOBUFS', unsettled: true });
  await delay(20);
  const settled = await scope.finalize();
  assert.equal(settled.unsettled, true);
  assert.equal(settled.cleanupConfirmed, true);
  f.assertClean();
});

test('scope finalization itself checks for delayed output and later dispatch stays blocked', { skip: process.platform === 'win32' }, async t => {
  const f = fixture(t);
  const scope = createVerificationProcessScope();
  t.after(() => scope.finalize());
  const { done } = await runDelayedDescendant(f, scope);
  await waitForFile(done);
  const rejected = await runVerificationProcess(node("process.exit(0)"), { ...f.options, captureScope: scope });
  assert.equal(rejected.error?.code, 'ENOBUFS');
  assert.equal(rejected.status, null);
  const settled = await scope.finalize();
  assert.equal(settled.unsettled, true);
  const tooLate = await runVerificationProcess(node("process.exit(0)"), { ...f.options, captureScope: scope });
  assert.equal(tooLate.error?.code, 'EINVAL');
  f.assertClean();
});

test('scope notices a retained file replacement and does not delete the replacement', async t => {
  const f = fixture(t);
  const scope = createVerificationProcessScope();
  t.after(() => scope.finalize());
  const output = await runVerificationProcess(node("console.log('safe')"), { ...f.options, captureScope: scope });
  assert.equal(output.status, 0);
  const captureDir = path.join(f.tempRoot, f.captures()[0]);
  const target = path.join(captureDir, 'stdout');
  fs.renameSync(target, path.join(captureDir, 'original'));
  fs.writeFileSync(target, 'keep replacement', { mode: 0o600 });
  assert.throws(() => scope.checkpoint(), { code: 'EVERIFICATIONCAPTURE', unsettled: true });
  const settled = await scope.finalize();
  assert.equal(settled.unsettled, true);
  assert.equal(settled.cleanupConfirmed, false);
  assert.equal(fs.readFileSync(target, 'utf8'), 'keep replacement');
  assert.equal(fs.readFileSync(f.sentinel, 'utf8'), 'keep unrelated data');
});

test('invalid bounds and forged capture scope cannot spawn', async t => {
  const f = fixture(t);
  for (const extra of [{ maxBuffer: 0 }, { timeoutMs: -1 }, { captureScope: {} }]) {
    const output = await runVerificationProcess(node("process.exit(0)"), { ...f.options, ...extra });
    assert.equal(output.error?.code, 'EINVAL');
    assert.equal(output.status, null);
  }
  f.assertClean();
});

test('a missing close event is bounded, disposes the adapter, and retains uncertain artifacts', { skip: process.platform === 'win32' }, async t => {
  const f = fixture(t);
  let child;
  let disposed = 0;
  const testOnlySpawn = (...args) => {
    child = spawn(...args);
    const emit = child.emit;
    child.emit = function (event, ...data) {
      // Real harmless child still runs and is reaped; hide only its close event
      // to exercise the adapter's uncertain-close handling deterministically.
      if (event === 'close') return false;
      return emit.call(this, event, ...data);
    };
    child.dispose = () => { disposed += 1; child.kill('SIGKILL'); };
    return child;
  };
  const began = Date.now();
  const output = await runVerificationProcess(node("setInterval(()=>{},1000)"), { ...f.options, testOnlySpawn, timeoutMs: 100 });
  assertFailure(output, 'ETIMEDOUT');
  assert.equal(output.rootChildClosed, false);
  assert.equal(output.processTreeSettled, false);
  assert.equal(output.cleanupConfirmed, false);
  assert.ok(disposed >= 1);
  assert.ok(Date.now() - began < 3000);
  assert.equal(f.captures().length, 1);
  assert.throws(() => process.kill(child.pid, 0), { code: 'ESRCH' });
  assert.equal(fs.readFileSync(f.sentinel, 'utf8'), 'keep unrelated data');
});

test('uncertain adapter setup failure cannot become normal cleanup or scope success', { skip: process.platform === 'win32' }, async t => {
  const f = fixture(t);
  const scope = createVerificationProcessScope();
  t.after(() => scope.finalize());
  const error = Object.assign(new Error('native setup failed after an uncertain spawn attempt'), { code: 'EVERIFICATIONJOB', unsettled: true });
  const output = await runVerificationProcess(node("process.exit(0)"), { ...f.options, captureScope: scope, testOnlySpawn: () => { throw error; } });
  assertFailure(output, 'EVERIFICATIONJOB');
  assert.equal(output.rootChildClosed, false);
  assert.equal(output.cleanupConfirmed, false);
  const settled = await scope.finalize();
  assert.equal(settled.unsettled, true);
  assert.equal(settled.cleanupConfirmed, false);
  assert.equal(f.captures().length, 1);
  assert.equal(fs.readFileSync(f.sentinel, 'utf8'), 'keep unrelated data');
});

test('finalizing a scope with an active child fails closed and stops that child', async t => {
  const f = fixture(t);
  const scope = createVerificationProcessScope();
  const ready = path.join(f.root, 'active-ready');
  const pending = runVerificationProcess(node("require('node:fs').writeFileSync(process.argv[1],'ready');setInterval(()=>{},1000)", [ready]), { ...f.options, captureScope: scope });
  await waitForFile(ready);
  const settled = await scope.finalize();
  assert.equal(settled.unsettled, true);
  assert.equal(settled.cleanupConfirmed, false);
  const output = await pending;
  assert.equal(output.unsettled, true);
  assert.equal(output.rootChildClosed, true);
  assert.equal(output.cleanupConfirmed, true);
  f.assertClean();
});

test('forcing FD capture without an explicit test hook is rejected outside Windows', { skip: process.platform === 'win32' }, async t => {
  const f = fixture(t);
  const output = await runVerificationProcess(node("process.exit(0)"), { ...f.options, testOnlySpawn: undefined });
  assert.equal(output.error?.code, 'EINVAL');
  assert.equal(output.status, null);
  f.assertClean();
});

test('FD stdin is an empty read-only file and produces immediate EOF', async t => {
  const f = fixture(t);
  const output = await runVerificationProcess(node("const fs=require('node:fs');const input=fs.readFileSync(0);let denied=false;try{fs.writeSync(0,'must not write')}catch{denied=true}process.stdout.write(JSON.stringify({bytes:input.length,denied}));"), f.options);
  assert.equal(output.status, 0);
  assert.equal(output.error, undefined);
  assert.deepEqual(JSON.parse(output.stdout), { bytes: 0, denied: true });
  assert.equal(output.cleanupConfirmed, true);
  f.assertClean();
});

test('changed stdin carrier fails identity/size checks and retains the uncertain capture', async t => {
  const f = fixture(t);
  const output = await runVerificationProcess(node(findCapture + "fs.writeFileSync(path.join(dir,'stdin'),'unexpected input');", [f.tempRoot]), f.options);
  assertFailure(output, 'EVERIFICATIONCAPTURE');
  assert.equal(output.cleanupConfirmed, false);
  assert.equal(f.captures().length, 1);
  assert.equal(fs.readFileSync(f.sentinel, 'utf8'), 'keep unrelated data');
});
