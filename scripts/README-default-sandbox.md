# Real default-sandbox verifier regression

Run `scripts/verify-default-sandbox.mjs` against the **exact packed candidate** before release. This is separate from `verify-production-host.mjs`, which uses a fixed-command test shell backend with real subprocesses and inert model/Jev transports. Neither suite establishes paid provider/model/Jev support.

The default-sandbox suite mounts the official rc.2 ToolRuntime, bash tool, SandboxBashExecutor, LocalSandboxProvider and LocalSubprocessRuntime. It must use `workspace-write` and the actual bwrap runner, with no runner override. Each verifier invocation gets the normal fresh `/tmp`; do not set TMPDIR, TEMP or TMP to make the test pass.

Prerequisites: already-approved official DSH 0.2.0-rc.2 node_modules, Node 24, bash, git, tar and the normal bwrap environment. No profile, credentials or network are required. Do not relax OS sandbox settings when unavailable.

Example (replace only the approved local paths):

```sh
suite_home=$(mktemp -d /tmp/dsh-default-sandbox-check.XXXXXXXX)
mkdir -p "$suite_home/home" "$suite_home/dsh-home"
env -i \
  HOME="$suite_home/home" DSH_HOME="$suite_home/dsh-home" \
  PATH="/approved/node/bin:/usr/local/bin:/usr/bin:/bin" LANG=C.UTF-8 \
  DSH_NODE_MODULES=/approved/dsh/node_modules \
  DSH_VERIFIER_TGZ=/approved/dsh-desktop-workflow-0.6.1.tgz \
  DSH_VERIFIER_SHA256=fdbb46851fe29d7709f3af6549f06514c314b3fbccb45656dfd7d13dd7940969 \
  node scripts/verify-default-sandbox.mjs
```

A release must record the observed archive hash and summary, not reuse an earlier candidate's result. Expected cases:

1. Real baseline → source edit → independent Node test → seal → cleanup. All four tool exits are 0 and the evidence directory is actually gone.
2. Corrupt the recorded state bytes. Check must reject; original bytes are restored only so the test can clean its own artifact.
3. Execute a real baseline, then inject only `stdout.truncated=true` in its returned result. The host must quarantine, refuse further checking and report `settled:false`; it must not blindly delete unacknowledged evidence.
4. While that independent native context retains lost-ack evidence, another project's separate native context completes successfully. This is sequential context isolation, not concurrent host-lease acceptance.

The lost-ack synthetic fixture is deliberately retained and its location is printed. Do not copy its `.dsh-team-evidence-*` contents into a commit or release. Unit tests separately cover hostile paths, hardlinks, symlinks, extra files, cancellation/error boundaries and multi-session project leases. A 0.6.0 package should fail after baseline under default bwrap; retain that failure as the regression's provenance.

PowerShell compatibility is tested separately with `scripts/verify-verifier-pwsh.mjs`. Linux PowerShell results do not establish Windows/Electron UI or Windows sandbox support.
