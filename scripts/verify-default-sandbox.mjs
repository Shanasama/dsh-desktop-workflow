#!/usr/bin/env node
/** Linux verifier integration against an explicitly hash-approved package.
 * Run in env -i with HOME, DSH_HOME, PATH, LANG, DSH_NODE_MODULES,
 * DSH_VERIFIER_TGZ and DSH_VERIFIER_SHA256. TMPDIR/TEMP/TMP stay unset.
 * All shell/subprocess/sandbox services are the official rc.2 implementations.
 * Only the lost-ack case changes a returned stdout.truncated flag, after a
 * real baseline process completed. It never replaces a shell or verifier.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, symlink, mkdtemp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

const hash = (data) => createHash('sha256').update(data).digest('hex');
const modules = process.env.DSH_NODE_MODULES;
const archive = process.env.DSH_VERIFIER_TGZ;
const archiveHash = process.env.DSH_VERIFIER_SHA256;
const contexts = [];
const cases = [];
let suiteRoot;
const summary = {
  boundary: 'production verifier unit integration with official native tools; not /team, model, Jev, or host-lease concurrency acceptance',
  packageVersion: '0.6.1', officialVersion: '0.2.0-rc.2',
  defaultTempRoot: '/tmp', retainedEvidenceDirectories: [],
};
const emit = (value) => console.log(JSON.stringify(value));

function runSetup(argv, cwd) {
  const result = spawnSync(argv[0], argv.slice(1), {
    cwd, encoding: 'utf8', timeout: 10000,
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_TERMINAL_PROMPT: '0' },
  });
  if (result.error || result.status !== 0) throw new Error('Fixture setup failed: ' + argv[0] + ': ' + String(result.error?.message ?? result.stderr).slice(0, 800));
}

function dataSummary(data) {
  if (!data) return null;
  return {
    verified: data.verified, mode: data.project?.mode,
    checks: data.checks?.map(({ id, exitCode, passed, unsettled }) => ({ id, exitCode, passed, unsettled })) ?? data.project?.checks?.map(({ id, kind }) => ({ id, kind })),
    checksPassed: data.checksPassed, checksRun: data.checksRun,
    protectedOk: data.protectedOk, scopeOk: data.scopeOk,
    sealed: data.sealed, unsettled: data.unsettled,
    observation: data.observation,
  };
}

async function createFixture(name, official) {
  const root = path.join(suiteRoot, name);
  const packageDir = path.join(root, 'node_modules/dsh-desktop-workflow');
  await mkdir(packageDir, { recursive: true });
  runSetup(['tar', '-xzf', archive, '-C', packageDir, '--strip-components=1'], root);
  await mkdir(path.join(packageDir, 'node_modules'), { recursive: true });
  await symlink(path.join(modules, '@deepseek-ai'), path.join(packageDir, 'node_modules/@deepseek-ai'));
  assert.equal(JSON.parse(await readFile(path.join(packageDir, 'package.json'), 'utf8')).version, '0.6.1');
  const { createAutoVerifier } = await import(pathToFileURL(path.join(packageDir, 'src/auto-verification.js')));
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'isolated-verifier-' + name, private: true, type: 'module', scripts: { test: 'node --test value.test.mjs' } }) + '\n');
  await writeFile(path.join(root, '.gitignore'), 'node_modules/\n');
  await writeFile(path.join(root, 'value.mjs'), 'export const answer = 41;\n');
  await writeFile(path.join(root, 'value.test.mjs'), "import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { answer } from './value.mjs';\ntest('answer is forty-two', () => assert.equal(answer, 42));\n");
  runSetup(['git', 'init', '--quiet'], root);
  runSetup(['git', '-c', 'core.hooksPath=/dev/null', 'add', '--', '.gitignore', 'package.json', 'value.mjs', 'value.test.mjs'], root);
  runSetup(['git', '-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', '-c', 'user.name=Sandbox Probe', '-c', 'user.email=probe@example.invalid', 'commit', '--quiet', '-m', 'Initialize isolated native verifier integration'], root);

  const { Context } = await official('cordis');
  const ctx = new Context();
  const forks = [];
  contexts.push({ name, forks });
  async function add(packageName, config) {
    const mod = await official(packageName);
    const fork = ctx.plugin(mod.default ?? mod, config);
    forks.push(fork);
    await fork;
  }
  await add('dsh-system-prompt');
  await add('dsh-session-projection');
  await add('dsh-sandbox-policy', { mode: 'workspace-write', workspaceRoot: root });
  await add('dsh-subprocess-local');
  await add('dsh-sandbox-local');
  await add('dsh-bash-sandbox', { timeoutMs: 60000 });
  await add('dsh-shell-env');
  await add('dsh-tools', { mode: 'native' });
  await add('dsh-tool-bash');
  assert.equal(ctx.shell.constructor.name, 'SandboxBashExecutor');
  assert.deepEqual(ctx.sandbox.internals, {});
  assert.deepEqual(ctx.subprocess.internals, {});
  assert.equal(ctx.sandbox.runnerCommand, undefined);
  const fixture = {
    name, root, ctx, phase: 'setup', rows: [], poisonSignals: [],
    baselineRef: null, lostAck: false,
    runId: name + '-' + randomUUID(),
    config: { sessionId: 'native-' + name, verification: { profileId: 'auto', scope: ['workspace'] } },
    protectedTestHash: hash(await readFile(path.join(root, 'value.test.mjs'))),
  };
  fixture.verifier = createAutoVerifier({
    shellName: () => 'bash',
    poison: (sessionId, diagnostic) => { fixture.poisonSignals.push({ sessionId, phase: diagnostic?.phase, code: diagnostic?.code }); },
    onDiagnostic: (_id, diagnostic) => emit({ case: name, diagnostic: { phase: diagnostic.phase, code: diagnostic.code, exitCode: diagnostic.exitCode } }),
    executeTool: async (_id, spec, signal) => {
      // No rewritten command, custom execution backend, or sandbox override.
      const result = await ctx.tools.execute({ name: spec.name, arguments: spec.arguments, callId: fixture.runId + '-' + fixture.phase, signal });
      let data;
      try { data = JSON.parse(result.value?.stdout?.text ?? ''); } catch {}
      if (data?.baselineRef) fixture.baselineRef = data.baselineRef;
      const row = { case: name, phase: fixture.phase, isError: result.isError, exitCode: result.value?.exitCode, sandbox: result.value?.sandbox, selectedRunner: ctx.sandbox.selectedRunner, evidence: dataSummary(data) };
      if (result.isError || result.value?.stderr?.text) row.error = result.error?.message ?? result.value?.stderr?.text?.slice(0, 1000);
      fixture.rows.push(row);
      emit(row);
      assert.equal(result.isError, false, name + ': native tool infrastructure failure');
      assert.equal(result.value?.sandbox?.mode, 'workspace-write');
      assert.equal(result.value?.sandbox?.denied, false);
      assert.deepEqual(ctx.sandbox.selectedRunner, { runner: 'bwrap', enforcement: 'full' });
      if (fixture.lostAck && fixture.phase === 'baseline') {
        assert.equal(result.value?.exitCode, 0);
        assert.equal(data?.verified, true);
        assert.equal(data?.project?.mode, 'verified');
        assert.ok(fixture.baselineRef && existsSync(fixture.baselineRef.path));
        const changed = structuredClone(result);
        changed.value.stdout.truncated = true;
        emit({ case: name, injection: 'Only value.stdout.truncated=true after successful real baseline execution', evidenceExists: true });
        return changed;
      }
      return result;
    },
  });
  return fixture;
}

async function collect(fixture, phase, round) {
  fixture.phase = phase;
  return fixture.verifier.collect({ config: fixture.config, runId: fixture.runId, round, phase, signal: AbortSignal.timeout(100000) });
}

async function baseline(fixture) {
  const result = await collect(fixture, 'baseline', 0);
  assert.equal(result.project?.mode, 'verified');
  assert.ok(fixture.baselineRef);
  const evidenceDir = path.dirname(fixture.baselineRef.path);
  assert.equal(path.dirname(evidenceDir), fixture.root);
  assert.match(path.basename(evidenceDir), /^\.dsh-team-evidence-[a-f0-9]{32}$/);
  assert.equal(hash(await readFile(fixture.baselineRef.path)), fixture.baselineRef.digest);
  return result;
}

async function cleanup(fixture) {
  fixture.phase = 'cleanup';
  const released = await fixture.verifier.release(fixture.runId);
  return released;
}

async function successfulCycle(fixture) {
  await baseline(fixture);
  await writeFile(path.join(fixture.root, 'value.mjs'), 'export const answer = 42;\n');
  assert.equal(hash(await readFile(path.join(fixture.root, 'value.test.mjs'))), fixture.protectedTestHash);
  const check = await collect(fixture, 'check', 1);
  assert.equal(check.checksRun, true);
  assert.equal(check.checksPassed, true);
  assert.equal(check.protectedOk, true);
  assert.equal(check.scopeOk, true);
  assert.ok(check.checks.length > 0 && check.checks.every(item => item.exitCode === 0 && item.passed && !item.unsettled));
  const seal = await collect(fixture, 'seal', 1);
  assert.equal(seal.sealed, true);
  const released = await cleanup(fixture);
  assert.equal(released.settled, true);
  const evidenceRemoved = !existsSync(path.dirname(fixture.baselineRef.path));
  assert.equal(evidenceRemoved, true);
  assert.equal(fixture.poisonSignals.length, 0);
  const result = { case: fixture.name, passed: true, checksPassed: true, protectedOk: true, scopeOk: true, sealed: true, settled: true, evidenceDirectoryRemoved: evidenceRemoved };
  cases.push(result); emit(result);
}

try {
  assert.equal(process.platform, 'linux', 'This acceptance script is specifically for official Linux bwrap');
  const allowed = new Set(['HOME', 'DSH_HOME', 'PATH', 'LANG', 'DSH_NODE_MODULES', 'DSH_VERIFIER_TGZ', 'DSH_VERIFIER_SHA256']);
  assert.ok(Object.keys(process.env).every(key => allowed.has(key)), 'Use the documented clean env; no inherited profile, credentials, or TMPDIR/TEMP/TMP');
  assert.equal(tmpdir(), '/tmp');
  for (const value of [modules, archive]) assert.ok(typeof value === 'string' && path.isAbsolute(value), 'An approved absolute modules/archive path is required');
  assert.match(archiveHash ?? '', /^[a-f0-9]{64}$/, 'A separately approved artifact SHA256 is required');
  assert.equal(hash(await readFile(archive)), archiveHash, 'Candidate archive hash differs from the approved pin');
  summary.archiveSHA256 = archiveHash;
  const req = createRequire(path.join(modules, '..', 'package.json'));
  const official = async (name) => import(pathToFileURL(req.resolve('@deepseek-ai/' + name)));
  for (const name of ['dsh', 'dsh-tools', 'dsh-tool-bash', 'dsh-bash-sandbox', 'dsh-sandbox-local', 'dsh-sandbox-policy', 'dsh-subprocess-local']) {
    assert.equal(JSON.parse(await readFile(path.join(modules, '@deepseek-ai', name, 'package.json'), 'utf8')).version, '0.2.0-rc.2');
  }
  suiteRoot = await mkdtemp('/tmp/dsh-v061-native-suite-');
  emit({ stage: 'ready', ...summary, node: process.version });
  const success = await createFixture('successful-cycle', official);
  await successfulCycle(success);

  const tamper = await createFixture('tampered-evidence', official);
  await baseline(tamper);
  const original = await readFile(tamper.baselineRef.path);
  await writeFile(tamper.baselineRef.path, Buffer.concat([original, Buffer.from('\n')]));
  await assert.rejects(collect(tamper, 'check', 1), error => error.code === 'VERIFICATION_INVALID');
  const rejected = tamper.rows.at(-1);
  assert.equal(rejected.exitCode, 1);
  assert.equal(rejected.evidence?.verified, false);
  assert.equal(existsSync(tamper.baselineRef.path), true);
  // Restore only this controlled fixture's exact original bytes for cleanup.
  // A tampered state never passed verification and is not being accepted.
  await writeFile(tamper.baselineRef.path, original);
  assert.equal(hash(await readFile(tamper.baselineRef.path)), tamper.baselineRef.digest);
  assert.equal((await cleanup(tamper)).settled, true);
  assert.equal(existsSync(path.dirname(tamper.baselineRef.path)), false);
  const tamperResult = { case: tamper.name, passed: true, tamperingRejected: true, originalBytesRestoredForCleanupOnly: true, settled: true, evidenceDirectoryRemoved: true };
  cases.push(tamperResult); emit(tamperResult);

  const lost = await createFixture('lost-acknowledgement', official);
  lost.lostAck = true;
  await assert.rejects(collect(lost, 'baseline', 0), error => error.code === 'VERIFICATION_BLOCKED');
  assert.ok(lost.baselineRef && existsSync(lost.baselineRef.path));
  assert.ok(lost.poisonSignals.length > 0, 'Baseline uncertainty must signal host quarantine');
  const originalLostDigest = hash(await readFile(lost.baselineRef.path));
  const callsBeforeRejectedContinuation = lost.rows.length;
  await assert.rejects(collect(lost, 'check', 1), error => error.code === 'BASELINE_UNACKNOWLEDGED');
  assert.equal(lost.rows.length, callsBeforeRejectedContinuation, 'Unacknowledged baseline must block check before native dispatch');
  assert.equal((await cleanup(lost)).settled, false);
  assert.equal(lost.rows.length, callsBeforeRejectedContinuation, 'Unacknowledged baseline must not blindly dispatch deletion');
  assert.equal(hash(await readFile(lost.baselineRef.path)), originalLostDigest);
  assert.equal(existsSync(path.dirname(lost.baselineRef.path)), true);
  summary.retainedEvidenceDirectories.push(path.dirname(lost.baselineRef.path));
  const lostResult = { case: lost.name, passed: true, injectedReturnTruncationOnly: true, realBaselineSucceeded: true, quarantineSignal: true, continuationDispatchBlocked: true, settled: false, noBlindDeletion: true, evidenceRetained: true };
  cases.push(lostResult); emit(lostResult);

  // Keep the lost-ack context and its orphan alive while an independent
  // project's actual native context completes. This is sequential project
  // isolation, not an assertion about the full host's lease scheduler.
  const independent = await createFixture('independent-project', official);
  assert.notEqual(independent.ctx, lost.ctx);
  await successfulCycle(independent);
  assert.equal(hash(await readFile(lost.baselineRef.path)), originalLostDigest);
  const isolation = { case: 'independent-project-isolation', passed: true, distinctNativeContexts: true, sequential: true, otherProjectFinishedDespiteRetainedLostAckEvidence: true, concurrentHostLeaseAcceptance: 'not run' };
  cases.push(isolation); emit(isolation);
  summary.passed = true;
} catch (error) {
  summary.passed = false;
  summary.error = { name: error?.name, code: error?.code, message: String(error?.message ?? error).slice(0, 1800) };
  process.exitCode = 1;
  emit({ stage: 'blocked', ...summary.error });
} finally {
  for (const context of contexts.reverse()) {
    for (const fork of context.forks.reverse()) {
      try { await fork.dispose(); }
      catch (error) { summary.passed = false; process.exitCode = 1; emit({ case: context.name, stage: 'runtime-disposal-failed', message: String(error?.message ?? error).slice(0, 800) }); }
    }
  }
  summary.cases = cases;
  if (suiteRoot) {
    summary.suiteRoot = suiteRoot;
    await writeFile(path.join(suiteRoot, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  }
  emit({ summary });
}
