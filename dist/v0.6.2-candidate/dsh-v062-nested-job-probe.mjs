#!/usr/bin/env node
/** Read-only capability experiment against the installed official rc.2 library.
 * Windows usage, inside the EXISTING restricted native tool:
 * $env:ELECTRON_RUN_AS_NODE='1'; & 'Desktop.exe' 'this.mjs' '.../dsh-win32-process/lib/index.js' | ForEach-Object { $_ }; exit $LASTEXITCODE
 * No sandbox/ACL/token setting is changed. Creates only its own private TEMP
 * artifacts and finite synthetic children. No credentials or provider calls.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const digest = value => createHash('sha256').update(value).digest('hex');
const same = (a, b) => a.dev === b.dev && a.ino === b.ino;
const LIMIT = 65536;
const report = { probe: 'official-current-token-nested-job', platform: process.platform, node: process.version, electron: process.versions.electron ?? null, officialVersion: null, passed: false, cases: [], noSecuritySettingsChanged: true, noProviderRequests: true };
const owned = [];
let directory, directoryIdentity, lib, api;
const childSource = `import { spawn } from 'node:child_process';
const mode=process.argv[2];
if(mode==='exit7'){process.stdout.write(JSON.stringify({probe:'native-job',value:7})+'\\n');process.stderr.write('SYNTHETIC_STDERR\\n');setTimeout(()=>process.exit(7),80);}
else if(mode==='finite-child'){setTimeout(()=>{process.stdout.write('FINITE_DESCENDANT_DONE\\n');process.exit(0);},450);}
else if(mode==='kill-child'){let n=0;const timer=setInterval(()=>{process.stdout.write('FINITE_TICK_'+(++n)+'\\n');if(n>=40){clearInterval(timer);process.exit(0);}},50);setTimeout(()=>process.exit(0),2500);}
else if(mode==='finite-root'||mode==='kill-root'){const child=spawn(process.execPath,[process.argv[1],mode==='finite-root'?'finite-child':'kill-child'],{env:process.env,stdio:['ignore',1,2],windowsHide:false});child.once('error',()=>process.exit(91));child.once('spawn',()=>{child.unref();process.stdout.write('ROOT_EXITING\\n');process.exit(0);});}
else process.exit(92);
`;

function checkDirectory() {
  const stat = fs.lstatSync(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink() || !same(stat, directoryIdentity) || fs.realpathSync(directory) !== directory) throw new Error('PROBE_DIRECTORY_CHANGED');
}
function checkFile(file) {
  checkDirectory();
  const stat = fs.lstatSync(file.path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || !same(stat, file.identity)) throw new Error('PROBE_FILE_CHANGED');
  if (file.fd !== null) {
    const opened = fs.fstatSync(file.fd);
    if (!same(stat, opened) || opened.nlink !== 1) throw new Error('PROBE_FD_CHANGED');
  }
  return stat;
}
function createFile(name, bytes = '') {
  checkDirectory();
  const file = { path: path.join(directory, name), fd: null, identity: null };
  file.fd = fs.openSync(file.path, 'wx+', 0o600);
  file.identity = fs.fstatSync(file.fd);
  owned.push(file);
  if (bytes) fs.writeFileSync(file.fd, bytes);
  checkFile(file);
  return file;
}
function readOutput(file) {
  const before = checkFile(file);
  if (before.size > LIMIT) throw new Error('PROBE_OUTPUT_LIMIT');
  const buffer = Buffer.alloc(before.size);
  let read = 0;
  while (read < buffer.length) {
    const count = fs.readSync(file.fd, buffer, read, buffer.length - read, read);
    if (!count) break;
    read += count;
  }
  const after = checkFile(file);
  if (read !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs) throw new Error('PROBE_OUTPUT_CHANGED');
  return buffer.toString('utf8');
}
const env = Object.fromEntries(['PATH', 'HOME', 'TMPDIR', 'TEMP', 'TMP', 'SystemRoot', 'WINDIR', 'LANG'].filter(key => process.env[key]).map(key => [key, process.env[key]]));
env.ELECTRON_RUN_AS_NODE = '1';

async function runCase(name, mode, terminateAfterRoot = false) {
  const input = createFile(name + '-stdin');
  const stdout = createFile(name + '-stdout');
  const stderr = createFile(name + '-stderr');
  let job, rootExit, empty = false, observedLiveAfterRoot = false, terminated = false;
  const started = performance.now();
  const item = { case: name, passed: false, rootExit: null, jobEmpty: false, observedLiveAfterRoot: false, terminatedJob: false, handleCleanupConfirmed: false };
  report.cases.push(item);
  try {
    job = lib.spawnCurrentTokenJobProcess(api, {
      applicationName: fs.realpathSync(process.execPath), command: process.execPath,
      args: [path.join(directory, 'child.mjs'), mode], cwd: process.cwd(), env,
      stdio: { stdin: input.fd, stdout: stdout.fd, stderr: stderr.fd },
    });
    while (performance.now() - started < 5000) {
      const total = checkFile(stdout).size + checkFile(stderr).size;
      if (total > LIMIT) throw new Error('PROBE_OUTPUT_LIMIT');
      rootExit = lib.pollProcessExit(api, job.process);
      empty = lib.isJobEmpty(api, job.job);
      if (rootExit !== undefined && !empty) observedLiveAfterRoot = true;
      if (terminateAfterRoot && observedLiveAfterRoot && !terminated) {
        lib.terminateJob(api, job.job, 73);
        terminated = true;
      }
      if (rootExit !== undefined && empty) break;
      await wait(5);
    }
    if (rootExit === undefined || !empty) throw new Error('PROBE_JOB_SETTLEMENT_TIMEOUT');
    const out = readOutput(stdout), err = readOutput(stderr);
    if (mode === 'exit7') {
      if (rootExit !== 7 || out.trim() !== '{"probe":"native-job","value":7}' || err !== 'SYNTHETIC_STDERR\n') throw new Error('PROBE_EXIT_OR_OUTPUT_MISMATCH');
    } else {
      if (rootExit !== 0 || !observedLiveAfterRoot || !out.includes('ROOT_EXITING\n')) throw new Error('PROBE_DESCENDANT_NOT_OBSERVED');
      if (!terminateAfterRoot && !out.includes('FINITE_DESCENDANT_DONE\n')) throw new Error('PROBE_DESCENDANT_OUTPUT_MISSING');
      if (terminateAfterRoot && !terminated) throw new Error('PROBE_JOB_NOT_TERMINATED');
    }
    item.passed = true;
    item.stdoutBytes = Buffer.byteLength(out); item.stderrBytes = Buffer.byteLength(err);
  } finally {
    item.rootExit = rootExit ?? null; item.jobEmpty = empty;
    item.observedLiveAfterRoot = observedLiveAfterRoot; item.terminatedJob = terminated;
    if (job) {
      let terminal = empty;
      try {
        if (!terminal) {
          lib.terminateJob(api, job.job, 74);
          const deadline = performance.now() + 1500;
          while (!(terminal = lib.isJobEmpty(api, job.job)) && performance.now() < deadline) await wait(5);
        }
        item.jobEmpty = terminal;
      } finally {
        let closed = true;
        try { lib.closeHandleChecked(api, job.process, 'probe process'); } catch { closed = false; }
        try { lib.closeHandleChecked(api, job.job, 'probe Job'); } catch { closed = false; }
        item.handleCleanupConfirmed = terminal && closed;
        if (!item.handleCleanupConfirmed) item.passed = false;
      }
    }
    item.durationMs = Math.round(performance.now() - started);
  }
}

try {
  if (process.platform !== 'win32') throw new Error('WINDOWS_REQUIRED_NO_NATIVE_TEST_RUN');
  const entry = process.argv[2];
  if (!entry || !path.isAbsolute(entry) || path.basename(entry) !== 'index.js' || path.basename(path.dirname(entry)) !== 'lib') throw new Error('EXPECTED_OFFICIAL_ABSOLUTE_LIB_ENTRY');
  const manifest = JSON.parse(fs.readFileSync(path.join(path.dirname(entry), '..', 'package.json'), 'utf8'));
  if (manifest.name !== '@deepseek-ai/dsh-win32-process' || manifest.version !== '0.2.0-rc.2') throw new Error('OFFICIAL_RC2_PACKAGE_REQUIRED');
  report.officialVersion = manifest.version;
  lib = await import(pathToFileURL(entry)); api = lib.loadWin32ProcessBindings();
  lib.probeCurrentTokenJobSupport(api);
  directory = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dsh-nested-job-probe-'));
  directory = fs.realpathSync(directory); directoryIdentity = fs.lstatSync(directory);
  createFile('child.mjs', childSource);
  report.childScriptSHA256 = digest(childSource);
  await runCase('exact-output-exit7', 'exit7');
  await runCase('wait-finite-descendant', 'finite-root');
  await runCase('terminate-inherited-descendant', 'kill-root', true);
  report.passed = report.cases.length === 3 && report.cases.every(item => item.passed && item.jobEmpty && item.handleCleanupConfirmed);
} catch (error) {
  report.error = { name: error?.name ?? 'Error', code: error?.code ?? null, win32Code: error?.win32Code ?? null, operation: error?.operation ?? null, message: String(error?.message ?? error).slice(0, 800) };
  report.passed = false;
} finally {
  let cleaned = true;
  for (const file of owned) {
    try { if (file.fd !== null) fs.closeSync(file.fd); } catch { cleaned = false; }
    file.fd = null;
  }
  if (directory) {
    try {
      if (report.cases.some(item => !item.handleCleanupConfirmed)) throw new Error('PROBE_JOB_CLEANUP_UNCONFIRMED');
      checkDirectory();
      const expected = new Set(owned.map(file => path.basename(file.path)));
      if (fs.readdirSync(directory).some(name => !expected.has(name))) throw new Error('UNEXPECTED_PROBE_FILE');
      for (const file of owned) { checkFile(file); fs.unlinkSync(file.path); }
      checkDirectory(); fs.rmdirSync(directory);
    } catch { cleaned = false; }
  }
  report.captureCleanupConfirmed = cleaned;
  if (!cleaned || report.cases.some(item => !item.handleCleanupConfirmed)) report.passed = false;
  if (!cleaned && directory) report.retainedProbeDirectory = directory;
  process.stdout.write(JSON.stringify(report) + '\n');
  process.exitCode = report.passed ? 0 : 1;
}
