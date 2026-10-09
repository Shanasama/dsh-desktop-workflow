# v0.2 verification and remaining boundaries

All development and tests were credential-free. No paid model call, real project edit, user profile change, global permission change or full live AgentLoop task was performed.

## Reproducible source checks

```sh
npm ci --ignore-scripts
npm run check
```

The aggregate command builds the actual lazy host client and component preview, strictly typechecks, and runs tests covering:

- Strict plan/config/output validation; unknown roles, duplicate IDs, cycles, missing dependencies, unsafe data and oversized payloads.
- Exact per-role model binding, structured-output failure, post-coordinator plan review, task-goal preservation, parallel reads and one writer.
- Dispatch/step/task/retry/deadline limits, revision identity, dependency failure, diagnostic/final review, cancellation drain and output retention.
- Session generation, permission changes, process-wide team lease including preflight, persistent cleanup quarantine and prohibition on the next worker after uncertain cleanup.
- No inference on mount/catalog/settings, explicit-start idempotency, typed server rejection versus unknown-start recovery.
- Actual built-client topology/DAG rendering, model catalogs, confirmation, current-session changes, demo execution block, escaped evidence and cancellation controls.
- Legacy file reader, bounded regular-file access, redacted errors and scoped install commands.

Most orchestration tests use deterministic service fixtures. Passing them proves scheduling and adapter contract behavior, not a paid model's quality or a complete real provider turn.

## Published rc.2 HTTP/module integration

```sh
DSH_NODE_MODULES=/path/to/official/node_modules npm run test:host
```

Uses the real Cordis Context, WebServer, Connection, BrowserAuth, Loader and ClientModuleRegistry. Only cookie persistence is an ephemeral in-memory fixture. Passed:

- Unauthenticated request: HTTP 401; launch-token cookie exchange: 303.
- Authenticated legacy snapshot: HTTP 200 with matching RPC ID and no-store.
- Foreign Origin: HTTP 403.
- Team **start/cancel** endpoints also reject unauthenticated and foreign-origin requests.
- Disposal removes the exact route (404).
- Loader discovers the package, Web client and three declared dependency edges; revisioned client bundle is served over HTTP 200.
- Removing the Loader entry withdraws its client graph row.

## Published rc.2 execution-protection integration

```sh
DSH_NODE_MODULES=/path/to/official/node_modules npm run test:team-host
```

Uses the **actual src/host-adapter.js** with real rc.2 AgentRegistry, ToolRuntime, Context and scopes. Agent objects, policy, catalog and subagent transport are explicit deterministic fixtures. Passed:

- PLAN/REVIEW/ROUTE schemas accepted by the actual narrow rc.2 schema validator.
- Parent modification guard is active before child work.
- Concurrent planner/worker role tags remain isolated across async creation; planner write is denied before the real tool body, worker fixture write executes once.
- Real serial creation rejects unsafe scope before result publication.
- Per-step cap produces enter/enter/reject.
- Confirmed cleanup releases the parent guard.

This does not run a full real AgentLoop, paid provider, shell command or filesystem mutation. `--expose-internals` belongs only to opt-in upstream integration tests, not plugin runtime requirements.

## Real package-manager lifecycle

The built archive is exercised with the official rc.2 CLI and pnpm, using a newly created temporary DSH_HOME/profile only. Install uses `--ignore-scripts`; dependency plus bundle registration are verified; removal clears both. Reproduce with:

```sh
DSH_CLI=/absolute/path/to/official/dsh/lib/bin.js node scripts/verify-profile.mjs dist/dsh-desktop-workflow-0.2.0.tgz
```

No live Desktop profile is modified by this smoke test.

## Browser visual/interaction QA

The cloud browser inspected the same component: team topology and task DAG switching, role/node inspector, model selection, reasoning/output controls, preflight summary and Back, explicitly refused offline start, compact sidebar, light/dark rendering. Preview catalogs and events are synthetic. The included screenshot is our v0.2 component preview, not the user's uploaded Desktop screenshot or an installed Electron session.

## Unverified

- The user's exact Windows/Electron distribution, initialized profile path and native window mounting.
- Real configured provider authentication, billing, model behavior and a complete live AgentLoop task.
- Real project edits/tests, external-editor conflict isolation, and platform-specific child-process cancellation.
- A post-restart continuation: the plugin deliberately does not auto-resume previous runs.

Do not turn component QA or deterministic fixtures into claims of successful real execution. Actual use requires the user's configured host/session and explicit task confirmation.

## Final v0.2 result

The final localized source passed build, strict typecheck and **76 automated tests**. Both optional native integration scripts passed all **8 + 8 reported checks**. This includes late definite-start rejection after navigating away and back; it no longer leaves the UI locked as an unknown request. The native start/cancel authentication fences are covered explicitly.
