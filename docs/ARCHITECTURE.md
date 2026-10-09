# Host contract and trust boundary

Target: official `@deepseek-ai/*` 0.2.0-rc.2 packages from deepseek-ai/deepseek-harness. Relevant upstream source:

- https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/connection
- https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/ui-sidebar-right
- https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/ui-slots
- https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/client-modules.md

Links are source locations; compatibility was checked against the published rc.2 package files, not assumed from moving master.

## Server

Cordis injects `connection`. The plugin registers one exact POST Fetch route under `/api/dsh-desktop-workflow/snapshot`. DSH owns authentication, trusted origin/host checks, transport and bounded buffering before the route is reached. The route validates a correlated `client-request` envelope and returns `server-response` with `rpcId` and `result`. No additional web server is opened.

Do not use `rpc.intercept('/api', ...)`: the rc.2 gateway is the single owner. Exact Fetch routes are composed before that interceptor and preserve it. Do not use a new RPC channel without independently checking the Desktop physical transport.

Only profile-configured `stateFile` is read. Browser-supplied payload must be empty. File reads are bounded and disallow symbolic links at the selected file, non-regular files, and invalid run JSON. Output is whitelisted and truncated. File-system errors are redacted. This is not a general file browser or arbitrary-path RPC.

## Client

`dsh.client.platform = web`; dependencies include client connection and sidebar-right. `./client` exports `lib/client.js`, a lazy `window.__ModuleLoader__.load` CJS factory. `react` and `react/jsx-runtime` stay external to prevent duplicate React/hook runtimes.

Injected services: `slots`, `sidebarRightTabs`, `connection`. The tab type has unique id/kind `dsh-desktop-workflow`; the view is registered at `sidebar.right.pane.tab` under that id. `ctx.effect` owns registrations and scoped styles. Only the mounted panel polls; cleanup aborts in-flight reads, generation checks discard old results, and serial polling prevents request pileups. Each request has a 15-second deadline; a stuck bridge becomes an error and is retried without aborting the lifetime of future polls. Demo data is never served as a live backend result.

## State contract

Input matches Jev `CliWorkflowStore`: `id`, `goal`, `status`, `routing`, `decision`, `stages[]`, and timestamps. Recognized phases are plan/work/tests/review/done. Recognized states are running/completed/blocked/skipped/failed/pending. Unknown fields are discarded. No token counts or costs are inferred.

The rendered path is the producer's expected phase order, not a dynamically discovered task-dependency graph. Reported tests/evidence are shown as text, never executed or interpreted as instructions.
