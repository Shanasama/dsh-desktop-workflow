# v0.5.2 Windows verification startup fix

`/team` could acknowledge a start and immediately lock subsequent runs with a
cleanup warning. Both verification adapters omitted the required `description`
argument of the official rc.2 `bash` tool. Its real schema rejects the call with
`ToolArgsError / INVALID_ARGS` before starting a shell, although the tools dispatch
observer has already fired. The verifier then conservatively quarantines the run.
The warning could therefore appear before a child agent or Jev request existed.

The daily session record observed on 2026-10-10 contains a `team` command at
07:11:57.135 UTC and a success acknowledgment at 07:11:57.172 UTC. It does not
persist the verifier exception. The missing-argument failure and quarantine path
were separately reproduced against the installed official 0.2.0-rc.2 packages;
this is not a claim that the historical exception text was recovered from a log.

## Changes

- Both verifier calls supply a nonempty native tool description.
- Fixed verifier bodies live in two packaged entry files. Native commands carry
  the entry path and encoded JSON data, avoiding the long multiline command that
  failed through the real Windows Bash/CRT path. Only the `project` and `profile`
  entry names are accepted; task data cannot select an executable source file.
- Git roots are normalized through `realpath` before comparison. Electron child
  processes explicitly retain Node mode, including recognized Node test runners.
- Cleanup warnings identify project verification versus child-agent cleanup.
  Unknown, background, promoted, interrupted and unsettled results still lock
  subsequent runs. No production unlock/reset action was added.
- The visible theme label is now **泰拉**. The `arknights` identifier, storage key,
  styling, and truthful Arknights design attribution remain unchanged.

## Verified on Windows, 2026-10-10

- Build and TypeScript: passed.
- Targeted unit/UI/safety suites: **68 passed, 0 failed, 0 skipped**.
- Full ordinary suite: **149 passed, 4 failed, 3 skipped (156 total)**.
  The four failures are the previously recorded POSIX install-wrapper fixture,
  the package test that spawns bare `npm` with a Unix cache path, and two symlink
  fixtures denied with `EPERM`. Permissions were not changed to suppress them.
  The three opt-in host tests skip without `DSH_NODE_MODULES`; the verifier and
  client host contracts were separately run with the actual rc.2 installation.
- Real rc.2 tool schema / ToolRuntime / adapter regression: passed. The old call
  reproduces `ToolArgsError` with zero shell-provider starts. The fixed calls make
  11 inert shell-provider calls across automatic and explicit verification,
  including cleanup and a second automatic run. Actual process execution is
  deliberately replaced only in this contract test.
- Real Windows ToolRuntime, local Bash and managed subprocess services: **24 native
  calls**, including two complete automatic baseline/check/seal/cleanup cycles
  and explicit-profile baseline/check/seal. Workspace and plugin paths contain
  spaces, Chinese characters and apostrophes. The executed Node test asserts that
  it is running in Electron's Node mode. Modified tests/configuration, a changed
  baseline digest and a stale seal are rejected. Normal evidence cleanup is
  verified by absence of the temporary evidence file; no quarantine remains.
- Official client injection and team adapter regressions: passed with synthetic
  transport. The v0.5.1 Remote-injection fix remains covered.

Run the opt-in contracts with `DSH_NODE_MODULES` pointing at the approved rc.2
`node_modules` tree. For an installed ASAR, use its Electron executable with
`ELECTRON_RUN_AS_NODE=1` and `--expose-internals`:

```text
scripts/verify-verifier-host.mjs
scripts/verify-verifier-windows.mjs
scripts/verify-client-host.mjs
scripts/verify-team-host.mjs
```

The Windows script creates isolated temporary repositories and a copied plugin
source tree. It does not load a daily profile or call a model/Jev service. The
tests above do not replace native GUI acceptance or a real paid workflow run.
The existing daily installation remains v0.5.1 until a separately arranged
upgrade. An old poisoned lease lives in the host process; installing new bytes
does not clear it in a running process. A user-approved exit/reopen belongs to
installation acceptance, not to these tests.
