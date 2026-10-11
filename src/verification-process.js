import { spawnSync } from 'node:child_process';
import { spawnVerificationJob } from './verification-windows-job.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';

const POLL_MS = 5;
const CLOSE_GRACE_MS = 1000;
const DEFAULT_MAX_BUFFER = 1024 * 1024;

function failure(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function result(error = undefined) {
  return { status: null, signal: null, error, stdout: '', stderr: '', unsettled: false, outputExceeded: false, cleanupConfirmed: true, rootChildClosed: true };
}

function inside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function sameFile(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

function privateMode(stat, directory) {
  // POSIX mode bits are not Windows ACLs. Never modify or widen inherited ACLs.
  if (process.platform === 'win32') return true;
  return (Number(stat.mode) & 0o777) === (directory ? 0o700 : 0o600)
    && (typeof process.getuid !== 'function' || stat.uid === BigInt(process.getuid()));
}

function captureFailure(message) {
  return failure('EVERIFICATIONCAPTURE', message);
}

function verifyDirectory(directory, expected, requirePrivate = true) {
  const stat = fs.lstatSync(directory, { bigint: true });
  if (!stat.isDirectory() || stat.isSymbolicLink() || !sameFile(stat, expected) || (requirePrivate && !privateMode(stat, true))
      || fs.realpathSync(directory) !== directory) {
    throw captureFailure('Verification capture directory identity or permissions changed.');
  }
}

function verifyFile(file, descriptor = true) {
  const stat = fs.lstatSync(file.path, { bigint: true });
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1n || !sameFile(stat, file.identity) || !privateMode(stat, false)
      || (file.expectedSize !== undefined && stat.size !== file.expectedSize)) {
    throw captureFailure('Verification capture file identity, link count, or permissions changed.');
  }
  if (descriptor) {
    const opened = fs.fstatSync(file.fd, { bigint: true });
    if (!opened.isFile() || opened.nlink !== 1n || !sameFile(opened, file.identity) || !privateMode(opened, false)
        || (file.expectedSize !== undefined && opened.size !== file.expectedSize)) {
      throw captureFailure('Verification capture descriptor identity, link count, or permissions changed.');
    }
    return opened;
  }
  return stat;
}

function inspectCapture(capture) {
  try {
    verifyDirectory(capture.root, capture.rootIdentity, false);
    verifyDirectory(capture.directory, capture.directoryIdentity);
    return capture.files.map(file => verifyFile(file));
  } catch (error) {
    if (error.code === 'EVERIFICATIONCAPTURE') throw error;
    const unsafe = captureFailure('Verification capture identity could not be checked safely.');
    unsafe.cause = error;
    throw unsafe;
  }
}

function makeCapture(cwd, tempRoot) {
  const capture = { root: null, rootIdentity: null, directory: null, directoryIdentity: null, files: [] };
  try {
    const canonicalCwd = fs.realpathSync(cwd);
    const root = fs.realpathSync(tempRoot ?? os.tmpdir());
    if (inside(canonicalCwd, root)) throw captureFailure('Verification capture must be outside the project working directory.');
    // A nested cwd is still part of its enclosing Git worktree. Do not put
    // capture files there even if TMP/TEMP was configured inside that tree.
    for (let ancestor = canonicalCwd; ; ancestor = path.dirname(ancestor)) {
      const gitPath = path.join(ancestor, '.git');
      const hasGit = fs.existsSync(gitPath) && (fs.lstatSync(gitPath).isFile() || fs.existsSync(path.join(gitPath, 'HEAD')));
      if (hasGit && inside(ancestor, root)) {
        throw captureFailure('Verification capture must be outside the enclosing Git worktree.');
      }
      if (path.dirname(ancestor) === ancestor) break;
    }
    const rootIdentity = fs.lstatSync(root, { bigint: true });
    if (!rootIdentity.isDirectory() || rootIdentity.isSymbolicLink()) throw captureFailure('Verification temporary root is not a real directory.');
    capture.root = root;
    capture.rootIdentity = rootIdentity;
    const directory = path.join(root, `dsh-verification-${randomUUID()}`);
    fs.mkdirSync(directory, { mode: 0o700 });
    capture.directory = directory;
    capture.directoryIdentity = fs.lstatSync(directory, { bigint: true });
    verifyDirectory(directory, capture.directoryIdentity);
    for (const name of ['stdout', 'stderr', 'stdin']) {
      const filePath = path.join(directory, name);
      // wx prevents following a pre-existing symlink and refuses existing files.
      const fd = fs.openSync(filePath, 'wx+', 0o600);
      const file = { path: filePath, fd, identity: null };
      capture.files.push(file);
      file.identity = fs.fstatSync(fd, { bigint: true });
      if (name === 'stdin') {
        file.expectedSize = 0n;
        fs.closeSync(file.fd);
        file.fd = null;
        // The empty stdin carrier is read-only and must still be the exact
        // exclusively created zero-length file. Never pass interactive input.
        file.fd = fs.openSync(filePath, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
      }
      verifyFile(file);
    }
    inspectCapture(capture);
    return { capture };
  } catch (error) {
    return { capture, error };
  }
}

function cleanupCapture(capture, allowRemoval = true) {
  let safe = allowRemoval;
  try {
    if (capture.directory) {
      if (!capture.directoryIdentity) throw captureFailure('Capture directory identity was not established.');
      inspectCapture(capture);
      const expected = new Set(capture.files.map(file => path.basename(file.path)));
      if (fs.readdirSync(capture.directory).some(name => !expected.has(name))) {
        throw captureFailure('Unexpected entries in verification capture directory.');
      }
    }
  } catch {
    safe = false;
  }
  // Close every owned descriptor even if any identity or cleanup check fails.
  for (const file of capture.files) {
    if (file.fd !== null) {
      try { fs.closeSync(file.fd); } catch { safe = false; }
      file.fd = null;
    }
  }
  if (!capture.directory) return true;
  if (!safe) return false;
  try {
    // Never recurse, search for moved files, remove unexpected entries, or
    // delete through a symlink. Recheck the exact identities before each unlink.
    for (const file of capture.files) {
      verifyDirectory(capture.root, capture.rootIdentity, false);
      verifyDirectory(capture.directory, capture.directoryIdentity);
      verifyFile(file, false);
      fs.unlinkSync(file.path);
    }
    verifyDirectory(capture.root, capture.rootIdentity, false);
    verifyDirectory(capture.directory, capture.directoryIdentity);
    fs.rmdirSync(capture.directory);
    try {
      fs.lstatSync(capture.directory);
      return false;
    } catch (error) {
      return error.code === 'ENOENT';
    }
  } catch {
    return false;
  }
}

function readBounded(fd, limit) {
  const chunks = [];
  let offset = 0;
  // No full-file allocation: at most limit bytes are retained across chunks.
  while (offset < limit) {
    const buffer = Buffer.allocUnsafe(Math.min(64 * 1024, limit - offset));
    const length = fs.readSync(fd, buffer, 0, buffer.length, offset);
    if (!length) break;
    chunks.push(buffer.subarray(0, length));
    offset += length;
  }
  return { text: Buffer.concat(chunks, offset).toString('utf8'), bytes: offset };
}

const captureScopes = new WeakMap();

function checkRetained(state) {
  for (const record of state.records) {
    try {
      const stats = inspectCapture(record.capture);
      if (stats.reduce((size, stat) => size + stat.size, 0n) > BigInt(record.maxBuffer)) {
        record.output.outputExceeded = true;
        throw failure('ENOBUFS', 'Verification output exceeded its retained capture limit after direct-child close.');
      }
    } catch (error) {
      if (error.code !== 'ENOBUFS') record.safe = false;
      error.unsettled = true;
      record.output.error ??= error;
      record.output.unsettled = true;
      state.error ??= error;
    }
  }
}

function retainCapture(state, record) {
  state.records.add(record);
  if (record.output.unsettled || record.output.error) {
    // Ordinary nonzero status is not an uncertain lifecycle. Timed out,
    // signaled, aborted, or overflowed execution is a sticky scope failure.
    if (record.output.unsettled) state.error ??= record.output.error || failure('EVERIFICATIONCLOSE', 'Verification child received a signal.');
  }
  checkRetained(state);
  state.timer ??= setInterval(() => checkRetained(state), POLL_MS);
  state.timer.unref();
}

/**
 * Trusted runner-owned lifetime for FD captures across manifest/hash work.
 * Retained handles continue to be checked after direct-child exit. checkpoint()
 * is synchronous so callers can check between synchronous file/hash operations.
 * finalize() MUST run immediately before emitting the runner's final result.
 * It confirms capture cleanup only; outer-host process-tree settlement is still
 * required, including the interval after finalize and before host completion.
 */
export function createVerificationProcessScope() {
  const state = { records: new Set(), error: null, finalized: false, timer: null, finalResult: null, active: 0, cleanupUnconfirmed: false };
  const scope = Object.freeze({
    checkpoint() {
      if (!state.finalized) checkRetained(state);
      if (state.error) {
        state.error.unsettled = true;
        throw state.error;
      }
    },
    async finalize() {
      if (state.finalResult) return state.finalResult;
      checkRetained(state);
      clearInterval(state.timer);
      state.finalized = true;
      if (state.active > 0) state.error ??= failure('EVERIFICATIONCLOSE', 'Verification capture scope was finalized while a child was still active.');
      let cleanupConfirmed = state.active === 0 && !state.cleanupUnconfirmed;
      for (const record of state.records) {
        const cleaned = cleanupCapture(record.capture, record.safe);
        record.output.cleanupConfirmed = cleaned;
        cleanupConfirmed &&= cleaned;
        if (!cleaned) {
          record.output.unsettled = true;
          record.output.error ??= failure('EVERIFICATIONCLEANUP', 'Retained verification capture cleanup could not be safely confirmed.');
          state.error ??= record.output.error;
        }
      }
      state.records.clear();
      state.finalResult = { unsettled: !!state.error || !cleanupConfirmed, cleanupConfirmed, error: state.error || undefined };
      return state.finalResult;
    },
  });
  captureScopes.set(scope, state);
  return scope;
}

/**
 * Run one trusted, already-validated verification argv. On Windows, regular
 * file descriptors avoid the host sandbox's restricted libuv named-pipe path.
 *
 * maxBuffer is a combined retained-output limit on the FD path. The 5 ms size
 * checks are only a SOFT disk-growth boundary (timer scheduling is not a
 * guarantee of a maximum OS check interval): a fast writer, scheduler delay,
 * or descendant can write more before termination. This is not a disk quota.
 * Actual Windows uses the official same-token Job adapter: its close requires
 * direct exit, an empty Job, and closed native handles. The explicit non-Windows
 * test hook observes only root-child close; arbitrary test descendants still
 * need their test supervisor. rootChildClosed is distinct from processTreeSettled.
 * cleanupConfirmed confirms capture cleanup, not process-tree settlement.
 * Unknown close or unsafe
 * cleanup fails closed and leaves uncertain artifacts for that supervisor.
 * Node cannot make path checks and unlink atomic; the private random directory
 * and identity checks reduce races, but are not isolation from a hostile process
 * running as the same OS user. No ACL or sandbox settings are weakened here.
 *
 * platform, tempRoot, testOnlySpawn, and captureScope are trusted caller/test
 * options, never model payload fields. Actual Windows ignores testOnlySpawn and
 * cannot be downgraded by the platform override.
 */
export async function runVerificationProcess(argv, {
  cwd = process.cwd(), env = process.env, timeoutMs = 0,
  maxBuffer = DEFAULT_MAX_BUFFER, signal, platform = process.platform, tempRoot, captureScope, testOnlySpawn,
} = {}) {
  if (!Array.isArray(argv) || argv.length === 0 || argv.some(arg => typeof arg !== 'string')
      || !argv[0] || !Number.isSafeInteger(maxBuffer) || maxBuffer < 1
      || !Number.isSafeInteger(timeoutMs) || timeoutMs < 0) {
    return result(failure('EINVAL', 'Invalid verification command or execution bounds.'));
  }
  if (signal?.aborted) return result(failure('ABORT_ERR', 'Verification was aborted before dispatch.'));
  const scopeState = captureScope ? captureScopes.get(captureScope) : undefined;
  if (captureScope && (!scopeState || scopeState.finalized)) return result(failure('EINVAL', 'Invalid or finalized verification capture scope.'));
  if (scopeState) {
    try { captureScope.checkpoint(); } catch (error) { return { ...result(error), unsettled: true }; }
  }
  if (process.platform !== 'win32' && platform !== 'win32') {
    try {
      const child = spawnSync(argv[0], argv.slice(1), {
        cwd, env, windowsHide: true, encoding: 'utf8', timeout: timeoutMs,
        maxBuffer, killSignal: 'SIGKILL', stdio: ['ignore', 'pipe', 'pipe'],
      });
      return {
        ...result(), status: child.status, signal: child.signal, error: child.error,
        stdout: child.stdout || '', stderr: child.stderr || '',
        outputExceeded: child.error?.code === 'ENOBUFS',
        unsettled: !!child.signal || child.error?.code === 'ETIMEDOUT' || child.error?.code === 'ENOBUFS',
      };
    } catch (error) {
      return result(error);
    }
  }

  if (process.platform !== 'win32' && typeof testOnlySpawn !== 'function') {
    return result(failure('EINVAL', 'Forcing FD capture on a non-Windows host requires an explicit test-only spawn hook.'));
  }
  const output = result();
  const { capture, error: setupError } = makeCapture(cwd, tempRoot);
  if (setupError) {
    output.error = setupError;
    output.cleanupConfirmed = cleanupCapture(capture);
    output.unsettled = !output.cleanupConfirmed;
    if (scopeState && output.unsettled) { scopeState.error ??= setupError; scopeState.cleanupUnconfirmed = true; }
    return output;
  }

  if (scopeState) scopeState.active += 1;
  let child;
  let dispatched = false;
  let closed = false;
  let finished = false;
  let poll;
  let grace;
  let removeAbort;
  let unsafeCapture = false;
  const started = performance.now();
  try {
    try {
      const spawnOptions = { cwd, env, windowsHide: false, shell: false, stdio: [capture.files[2].fd, capture.files[0].fd, capture.files[1].fd] };
      // Actual Windows always uses the official same-token Job adapter. Caller
      // platform/test overrides cannot turn this into unsupervised raw spawn.
      if (process.platform === 'win32') child = await spawnVerificationJob(argv, spawnOptions);
      else child = testOnlySpawn(argv[0], argv.slice(1), spawnOptions);
      dispatched = !!child.pid;
    } catch (error) {
      output.error = error;
      output.unsettled = !!error.unsettled;
      closed = !error.unsettled;
      return output;
    }
    await new Promise(resolve => {
      function finish() {
        if (finished) return;
        finished = true;
        clearInterval(poll);
        clearTimeout(grace);
        removeAbort?.();
        resolve();
      }
      function stop(error) {
        output.error ??= error;
        output.unsettled = true;
        if (closed || finished) return;
        try { child?.kill('SIGKILL'); } catch { /* close still must be observed */ }
        if (grace) return;
        grace = setTimeout(() => {
          output.error ??= failure('EVERIFICATIONCLOSE', 'Verification child close was not confirmed.');
          try { child?.dispose?.(); } catch (disposeError) { output.error ??= disposeError; }
          child?.unref();
          finish();
        }, CLOSE_GRACE_MS);
      }
      function check() {
        if (finished) return;
        try { captureScope?.checkpoint(); } catch (error) { stop(error); }
        try {
          const stats = inspectCapture(capture);
          if (stats.reduce((size, stat) => size + stat.size, 0n) > BigInt(maxBuffer)) {
            output.outputExceeded = true;
            stop(failure('ENOBUFS', 'Verification output exceeded its capture limit (disk growth is polling-bounded, not a hard quota).'));
          }
        } catch (error) {
          unsafeCapture = true;
          stop(error);
        }
        if (timeoutMs > 0 && performance.now() - started >= timeoutMs) {
          stop(failure('ETIMEDOUT', 'Verification command timed out.'));
        }
      }
      child.once('spawn', () => { dispatched = true; });
      child.once('close', (code, childSignal) => {
        if (finished) return;
        closed = true;
        output.status = dispatched ? code : null;
        output.signal = childSignal;
        if (childSignal) output.unsettled = true;
        check();
        finish();
      });
      child.on('error', error => {
        if (finished) return;
        output.error ??= error;
        if (error.unsettled) stop(error);
        // ENOENT normally emits close next. If it does not, do not wait forever.
        grace ??= setTimeout(() => {
          output.unsettled = true;
          try { child.dispose?.(); } catch (disposeError) { output.error ??= disposeError; }
          child.unref();
          finish();
        }, CLOSE_GRACE_MS);
      });
      const abort = () => stop(failure('ABORT_ERR', 'Verification was aborted.'));
      if (signal) {
        signal.addEventListener('abort', abort, { once: true });
        removeAbort = () => signal.removeEventListener('abort', abort);
        if (signal.aborted) abort();
      }
      poll = setInterval(check, POLL_MS);
      check();
    });
    if (!closed) {
      output.unsettled = true;
      output.error ??= failure('EVERIFICATIONCLOSE', 'Verification child close was not confirmed.');
    }
    if (!unsafeCapture) {
      try {
        const stats = inspectCapture(capture);
        if (stats.reduce((size, stat) => size + stat.size, 0n) > BigInt(maxBuffer)) {
          output.outputExceeded = true;
          output.unsettled = true;
          output.error ??= failure('ENOBUFS', 'Verification output exceeded its capture limit.');
        }
        const stdout = readBounded(capture.files[0].fd, maxBuffer);
        const stderr = readBounded(capture.files[1].fd, maxBuffer - stdout.bytes);
        output.stdout = stdout.text;
        output.stderr = stderr.text;
        // Check identities and the cap again after reading.
        const afterRead = inspectCapture(capture);
        if (afterRead.reduce((size, stat) => size + stat.size, 0n) > BigInt(maxBuffer)) {
          output.outputExceeded = true;
          output.unsettled = true;
          output.error ??= failure('ENOBUFS', 'Verification output exceeded its capture limit while reading.');
        }
      } catch (error) {
        unsafeCapture = true;
        output.error ??= error;
        output.unsettled = true;
      }
    }
  } catch (error) {
    output.error ??= error;
    output.unsettled = true;
    try { child?.kill('SIGKILL'); } catch { /* retain uncertain artifacts below */ }
  } finally {
    clearInterval(poll);
    clearTimeout(grace);
    removeAbort?.();
    if (!closed) { try { child?.dispose?.(); } catch (error) { output.error ??= error; } }
    if (scopeState) scopeState.active -= 1;
    output.rootChildClosed = child?.rootChildClosed ?? closed;
    output.processTreeSettled = child?.processTreeSettled === true;
    if (scopeState && closed && !unsafeCapture && !scopeState.finalized) {
      output.cleanupConfirmed = null; // Deferred until the trusted runner finalizes its scope.
      retainCapture(scopeState, { capture, output, maxBuffer, safe: true });
    } else {
      output.cleanupConfirmed = cleanupCapture(capture, closed && !unsafeCapture);
    }
    if (output.cleanupConfirmed === false) {
      if (scopeState) scopeState.cleanupUnconfirmed = true;
      output.error ??= failure('EVERIFICATIONCLEANUP', 'Verification capture cleanup could not be safely confirmed.');
      output.unsettled = true;
    }
    if (scopeState && output.unsettled) scopeState.error ??= output.error || failure('EVERIFICATIONCLOSE', 'Verification lifecycle was not settled.');
  }
  return output;
}
