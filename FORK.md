# Fork notes — `fork/team-config-and-chat-entry`

This branch starts from upstream `main` @ `111fae3` ("Add Jev-driven team execution and
evidence gates v0.3.0"). It does **not** rewrite upstream history and `main` is untouched.

## Why this fork exists

Two things were not reachable in the installed DeepSeek Harness Desktop build
(`0.2.0-rc.2`, `desktop` profile):

1. **The plugin's server configuration had no editable surface.** Declaring a `Config`
   schema makes the host recognise it (`Config.listConfigs` reports `status: "schema"`),
   but this build renders a bundle row's configuration only when a plugin registers into
   the `plugins.row.config` slot itself. Nothing registered it, so `verificationProfiles`
   could only be edited by hand-editing the profile's `cordis.patch.yml`.
2. **A run could only be started from the browser panel.** The six role models live in
   browser storage and never reach the host, so no chat command or tool could start a run.

## What changed

| File | Change |
| --- | --- |
| `src/index.js` | Declares the trusted server `Config`: role models, the Jev credential reference, the verification profiles, the selected profile + allowed scope, and the explicit TypeSafe disclosure switch. Registers the `run_team` tool. |
| `src/credential-bridge.js` | **New.** Resolves the Jev credential through the host `credentials` service (the layer DSH's own settings cards write) *and* the process environment, while keeping the consumer's synchronous contract: `resolve()` answers from a cache that is refreshed in the background. |
| `src/server-config.js` | **New.** Reads and writes the config slice this plugin owns, through the host `configEditor` so the write is persisted into the profile patch and reconciled by the normal Loader path. Validates every field with the same rules the verifier enforces. |
| `src/team-tool.js` | **New.** The server-side start path: resolves the calling Agent, refuses anything but an idle root session, and builds the run configuration from trusted server config only. |
| `src/jev-client.js` | Uses the injected credential resolver and reports which sources were consulted. |
| `src/team-runtime.js` | Wires the bridge and adds the `/api/dsh-desktop-workflow/team/server-config` endpoint (read/save). |
| `client/JevConfigForm.tsx` | **New.** The configuration view: model picker from the live host catalog, verification profiles, selected profile + allowed paths, disclosure switch. |
| `client/index.tsx` | Registers that view into `plugins.row.config` under `dsh-desktop-workflow#desktop-workflow`. |
| `client/TeamView.tsx`, `client/team.css` | Corrected the pointer to the real configuration surface; fixed the panel being clipped by the host's fixed-height pane (the root now scrolls, the shell is a full-height flex column). |

## What did NOT change (deliberately)

- **No secret ever enters the browser.** There is no key field, in the panel or in this
  configuration view. The Jev key is only ever addressed by environment-variable *name* and
  resolved on the host.
- **The browser still cannot supply executable paths, endpoints or permissions.** A check
  is an argv plus a timeout; the host validates both again, and the command still runs
  under the original host sandbox.
- **TypeSafe disclosure remains an explicit server-side switch.** It is persisted in
  configuration, not inferred, and defaults to withheld.
- **`run_team` cannot start a run from the session it is called in.** The parent session
  must be idle, and a session that is talking to a model is not idle. This is intentional:
  allowing it would either deadlock (the tool waits for a run that waits for the tool to
  release the session) or let a team write to the same workspace another agent is editing.
  Chat-started runs therefore require a *different*, idle session.

## Verification

`npm run check` — build, typecheck and the full suite. 134 cases, 131 pass. The three
failures are Windows-only environment limits in upstream's own tests and predate this
branch: a POSIX mock executable, a `npm pack` test that needs `/tmp` and `npm.ps1`, and a
symlink test that needs Developer Mode.

Fork-only tests added: `test/credential-bridge.test.mjs`, `test/server-config.test.mjs`,
`test/team-tool.test.mjs`.

## Installing this branch

```sh
git clone -b fork/team-config-and-chat-entry https://github.com/Shanasama/dsh-desktop-workflow.git
npm ci --ignore-scripts
npm run build
dsh plugin --profile <your-profile> add /absolute/path/to/the/clone --ignore-scripts
```

`@deepseek-ai/schemastery` is a runtime dependency (the `Config` schema needs it); it is
declared in `package.json` so a package-manager install resolves it.

## Syncing with upstream

The fork is deliberately small and file-scoped. On a new upstream release, re-read
`src/index.js`, `src/jev-client.js` and `src/team-runtime.js` around the touched hunks;
`credential-bridge.js`, `server-config.js`, `team-tool.js` and `JevConfigForm.tsx` are
additive and need no merge.
