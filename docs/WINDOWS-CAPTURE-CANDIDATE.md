# 0.6.2 Windows capture candidate

This working candidate addresses two observed Windows 0.6.1 failures in the
ordinary workspace-write sandbox. It is not a released or Windows-accepted build.

1. The PowerShell command now pipes the Electron Node-mode output through
   `ForEach-Object { $_ }` and exits with `$LASTEXITCODE`. Real Windows A/B testing
   established that the old last-command GUI invocation returned before output;
   the new command preserves JSON and native exit 7.
2. Git and the recognized project check runners share a bounded output-capture
   helper. Windows uses private regular-file descriptors rather than the libuv
   named pipes that failed with EPERM in the restricted token. Executables run
   using the official current-token child Job API. No token, ACL or sandbox
   policy is broadened. Missing Job support fails closed, without raw spawn.

## Bounds and lifecycle

- Combined stdout/stderr retained output is at most 1 MiB per invocation.
- File size and identity are checked on a 5 ms polling schedule while running.
  This is a soft disk-growth threshold, not an OS disk quota or a guaranteed
  scheduling interval. Fast writes and scheduling delays can overshoot before
  termination. Reads never allocate or return an unbounded file.
- Windows completion requires both direct-child exit and zero active processes
  in the child Job. Timeout, cancellation, overflow, unknown termination, and
  unsafe cleanup never yield a successful verification. The outer native host
  retains final sandbox process-tree and session cleanup responsibility.
- Output captures use an independently randomized private directory beneath the
  existing sandbox temp root, outside the workspace/Git tree. They do not enter
  the project manifest or persistent baseline evidence. No recursive cleanup.
- Exclusive create, path/object identity, regular-file and single-link checks
  precede reads and exact unlink/rmdir. All owned descriptors are closed. An
  unexpected object is retained and makes cleanup unconfirmed. These checks are
  not a claim of complete isolation from another process using the same OS user.
- Hard-killing the verifier can prevent JavaScript cleanup; native cancellation
  and sandbox temp cleanup remain required, and the project stays quarantined
  when completion is unknown.

## Evidence boundaries

Cloud tests can cover forced FD capture with harmless Linux processes, lifecycle
state tests with injected Win32 bindings, default Linux bwrap, and Linux
PowerShell output semantics. None proves Windows ACL/Job interoperability.
The actual Windows restricted-sandbox capability probe and exact candidate
baseline/check/seal/cleanup must pass before this becomes a release candidate.
Real model and Jev API calls are outside these no-credential regressions.
