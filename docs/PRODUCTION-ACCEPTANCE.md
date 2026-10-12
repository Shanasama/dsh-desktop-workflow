# Production acceptance, v0.6.0

## What this verifies

`verify-production-host.mjs` runs the real plugin and the official DSH 0.2.0-rc.2 host services in an isolated temporary profile. It is a native runtime integration test, not a controller-only simulation.

The exercised chain is:

1. BrowserAuth and the real command HTTP gateway receive `/team` for a real parent Agent.
2. The plugin reads settings saved by native SettingsForms and ConfigEditor. The native credential service contains only a newly generated dummy value.
3. The production controller selects configured models and dispatches through the official SubagentRuntime, spawn-in-process driver and AgentLoop.
4. An inert LlmAdapter emits real tool-call streams. The official filesystem tools read and edit a real temporary Git repository.
5. The official bash tool dispatches the package's exact fixed verification command through a deliberately narrow shell backend. The command launches a real process; the production verifier independently runs the fixture's unchanged Node tests and validates baseline, diff, protection, seal and cleanup evidence.
6. The plugin's authenticated snapshot and trace routes expose the result.

The fixture intercepts the exact Jev endpoint and returns deterministic JSON. Every other non-loopback fetch is rejected. No live model or TypeSafe API calls are made. Parent environment credentials are not passed to the verifier or package-manager subprocesses.

## Run

Use an approved, already installed official rc.2 dependency tree. This test never installs the host itself.

```sh
DSH_NODE_MODULES=/absolute/path/to/official/node_modules \
  node --expose-internals scripts/verify-production-host.mjs
```

The optional Node test wrapper runs the same acceptance when `DSH_NODE_MODULES` is supplied:

```sh
DSH_NODE_MODULES=/absolute/path/to/official/node_modules \
  node --test test/production-runtime.test.mjs
```

Without that environment variable, the ordinary tests cover production defaults, persisted setting shape, candidate-only routing, alternate-model preflight and `/team` setting propagation. The official-host test is explicitly skipped.

### Verify an actual release archive

```sh
DSH_NODE_MODULES=/absolute/path/to/official/node_modules \
DSH_PNPM_STORE=/absolute/path/to/pnpm-store \
DSH_PNPM_CLI=/absolute/path/to/pnpm/bin/pnpm.cjs \
DSH_PRODUCTION_BUNDLE=/absolute/path/to/dsh-desktop-workflow-0.6.0.tgz \
  node --expose-internals scripts/verify-production-host.mjs
```

Archive mode uses the official PluginManager to install that exact archive into a separate temporary profile with `pnpm --offline` and build scripts disabled. The fixture verifies already-installed official `@deepseek-ai/dsh-llm@0.2.0-rc.2` and `@deepseek-ai/schemastery@3.18.4` dependencies. Schemastery is linked from the approved host. The LLM peer is deliberately copied byte-for-byte to a separate physical directory, with its dependencies linked to the approved host tree; the profile links that separate copy. The test asserts the copied peer and the real host AgentLoop have distinct LLM module identities. This models normal plugin dependency duplication and verifies that enabled-budget request recognition resolves the exact host-native marker through the trusted installation anchor, rather than accepting an unmarked lookalike request. No dependencies are downloaded. It does not modify the archive. This proves an offline install with those exact host dependencies already provisioned, not dependency acquisition on a fresh machine.

The installed entry is compared byte-for-byte with the archive entry. The same native workflow then runs against the installed package, and its archive SHA-256 is included in the result. The test fails if installation fails; it never silently falls back to the checkout. A source-only result does not claim release-archive installation coverage. The pnpm CLI can be specified explicitly; the default is the approved host tree’s sibling `tools/node_modules/pnpm/bin/pnpm.cjs`.

## Scenarios and assertions

- Incomplete setup performs no model dispatch.
- The native settings service persists the base models, explicit weak/strong alternatives, budget and Jev settings. A native Loader remount recreates the plugin runtime and recovers the same saved controls and consent without changing the profile bytes. Settings responses and profile configuration contain no credential value.
- All eight team HTTP routes reject unauthenticated and foreign-Origin requests. Malformed JSON and mismatched RPC envelopes are rejected. Successful responses retain their RPC ID and `Cache-Control: no-store`.
- A real worker edit passes the independent test process, completes final evidence sealing, and removes temporary verification evidence.
- Optimistic review and a Jev `complete` proposal cannot override a genuinely failing independent test.
- Successive live lane escalations dispatch weak, base and strong configured models through native children. No unconfigured provider/model is accepted by the fixture adapter.
- A pinned shadow model deliberately disagrees with the primary model. Its bounded observations do not alter the primary lane, outcome, routing or role token ledger.
- Trace and snapshot retain the primary requested alias and resolved response version. Trace output contains metadata, not project paths or the dummy credential.
- Cancellation and the production deadline abort the actual native provider signal, dispose children and clean baseline evidence.
- Archive mode deliberately duplicates the official LLM peer module; the enabled native budget still recognizes the host AgentLoop request marker.
- An enabled budget accounts for each actual `llm/stream` boundary and returned usage. Jev/shadow calls do not consume the role-model ledger.
- An insufficient budget prevents provider dispatch. Missing usage retains the full native context reservation and prevents later calls.
- An explicit lost-acknowledgement fault is injected after a real verifier process has exited. Production conservatively quarantines that known project, blocks a second session in the same project, and permits an unrelated project's entire native `/team` workflow to complete.
- Native child creation and disposal counts balance. No subprocess remains running at ordinary completion.

## Fixture boundaries and limitations

The external LLM adapter, Jev response transport and fixed-command shell backend are test fixtures. Filesystem tools, model streaming, native Agent construction, subagent lifecycle, settings/credential services, authentication, commands, plugin routes, project filesystem changes and verifier subprocesses are real.

The quarantine test proves handling of an unconfirmed host result; it does not intentionally leave a hostile or orphan process running. Temporary evidence retained by that injected quarantine is removed only by final test teardown. The test does not expose an application feature that clears quarantine.

This does not establish real-provider quality, real credential authorization, billable API behavior, Electron visual correctness, browser interaction or Windows sandbox behavior. Those require separate checks. The official LLM adapter fixture declares a 4096-token native context bound; the test verifies the production bound contract against that metadata rather than guessing a tokenizer count.

The last stdout line beginning `PRODUCTION_HOST_RESULT` contains the verified package/host versions, archive-mode flag, archive SHA-256 and duplicate-peer flag when applicable, and observed native-child/model/Jev/process counts. Exact counts are evidence for that execution, not a fixed production performance guarantee.
