# Native production token budget

The production adapter implements an optional **per-run token scheduling budget** using the DSH 0.2.0-rc.2 host. It does not read API keys, send its own model requests, invent prices/model names, change any of the six selected role routes, or replace native permission/cleanup behavior. The evaluation harness remains separate.

## Configuration and UI meaning

- Default: `{ "enabled": false, "tokenLimit": 0 }`.
- Enabled limits must be positive safe integers, at most 1,000,000,000 tokens. There is no arbitrary ten-million-token product cap.
- A disabled budget can retain a nonnegative configured limit but does not enforce it. Usage is still observed; `remaining` is `null` to mean unlimited.
- The limit counts tokens, including cached input. It is not a currency, price, or invoice limit.
- Enabled admission reserves the selected route's **entire declared combined context window** for each in-flight native request. This intentionally conservative bound is usually much larger than the actual usage. A run with insufficient headroom can stop before the first request or while another request is in flight, even if a heuristic prompt estimate looks smaller.
- For parallel requests, each needs its own full-window reservation. Spent usage plus outstanding reservations must fit before a new call is admitted.

## Authoritative native integration

`host-adapter.js` installs a globally received `llm/stream` waterfall listener, limited to exact child identities established by the awaited `agent/created` lifecycle and to the adapter's own asynchronous child-creation context. Other sessions are untouched. Every supported native AgentLoop retry re-enters this listener.

For an ordinary native AgentLoop request, the guard checks:

1. `isAgentLoopRequest(options)` from an exact official host module, the immutable request object, and the exact owned child/session identity. The matching module supplies the paired `callConfigEquals` check.
2. `session.requestHeader().config` matches the request's full call configuration using official `callConfigEquals`.
3. `session.requestContext()` has the same provider/model and a positive safe-integer `contextWindow`.

In official rc2, AgentLoop logs this context from its exact, registration-bound `PreparedLlmCall` immediately before streaming. This avoids the hot-reload race of separately resolving current model metadata. No request rewriting or substituted route, effort, output cap, or tokenizer estimate is used.

Host `tokenMeter` estimates and context-pressure projections are not admission inputs: the official contract explicitly calls them heuristic or potentially mixed-generation display data. Auxiliary compaction/session-title calls do not carry the required prepared AgentLoop contract; when they belong to a budgeted child, an enabled budget refuses them before downstream dispatch. A missing/invalid capacity also fails closed. Disabled budgets allow these calls and observe their usage.

### Profile-installed peer identity

The official request marker is a module-local WeakSet. Matching package versions alone do not share that identity, and rc2 profile resolution deliberately prefers local installed packages before its installation fallback. Therefore this integration does not rely on peer deduplication or test-only host links.

Before publishing an enabled-budget child, the adapter reads the public launcher-owned `profileContext.installAnchor`, resolves `@deepseek-ai/dsh-agent-loop` from that host installation, then resolves `@deepseek-ai/dsh-llm` from the AgentLoop module's own dependency edge. It verifies both discovered package names and exact 0.2.0-rc.2 versions before dynamically importing the contract. The resulting genuine marker/config-check pair is used at admission. The directly imported official peer pair is also eligible only when its exact marker recognizes the request, covering a profile-local official loop override. No structural request heuristic replaces branding. An unavailable/invalid host anchor produces a sanitized `BUDGET_HOST_CONTRACT_UNAVAILABLE` before child creation; absolute paths are not returned in that error.

Direct embedded hosts without `profileContext` use the imported official peer contract; they must compose the matching native loop module. A custom loop with neither recognized official marker fails closed. Disabled budgets do not require this capacity/branding resolver to observe usage.

The regression test installs a byte-for-byte physical second copy of `dsh-llm` beside a copied workflow adapter, proves its WeakSet rejects a host-marked object, then runs the copied adapter against the original real native AgentLoop with the public installation anchor. The enabled budget successfully admits and accounts for that native call without linking the workflow's LLM peer to the host copy.

## Accounting and failure handling

DSH `TokenUsage` buckets are disjoint:

`inputTokens + cacheReadTokens + cacheWriteTokens + outputTokens`

Reasoning is already part of output and is never added twice. Missing optional cache buckets mean zero, as in the official host contract. If supplied, `totalTokens` must agree with the sum and reasoning must be a valid subset of output. Native streaming usage samples are cumulative; the latest valid complete sample is settled once after a successful terminal finish and a normally drained stream, rather than summing every sample. A throw after the finish or early consumer return keeps the reservation because stream cleanup was not confirmed.

The reservation is installed synchronously before downstream `next()` can run. Missing, malformed, decreasing, interrupted or nonterminal usage keeps the full reservation, records an unknown-usage call, and halts enabled-budget admission. A failed/aborted finish remains uncertain even if it carries syntactically valid usage: the official pi-ai adapter can emit default zero or partial counters on its error path. An enabled budget keeps the full reservation and refuses a further retry. Disabled budgets retain native retry behavior and count reported failure counters observationally, marking their accounting incomplete. Every admitted native retry passes through the hook independently. Cancellation never refunds an unknown charge. If the provider reports more tokens than its declared bound, the real reported spend remains visible and all further requests stop; the result does not claim that the bound held.

Snapshots contain:

- `enabled`, `limit`, `spent`, `reserved`, `remaining`
- `halted`: `null` or the first blocking error code
- `accounting`: `host-usage` or `host-usage-incomplete`
- `unknownUsageCalls`
- `physicalCalls`: **admitted native request attempts**, not proven HTTP or billable transactions

`spent` is fully settled host-reported usage in enabled mode. Disabled mode also displays native failure counters as observational usage and marks those calls incomplete. Incomplete calls remain represented by `reserved` and `unknownUsageCalls`; they are never silently charged as zero in enabled mode.

## Adapter lifecycle API

- `beginBudget(runId, config)`: validate and establish once, before any child starts. A run ID cannot reset an existing or retired budget.
- `budgetSnapshot(runId)`: return a detached snapshot.
- `releaseBudget(runId)`: close admission and return the final snapshot. Read/save the snapshot at run completion. Unresolved entries are retained until adapter disposal, including unknown reservations. A release during active calls keeps reservations and marks the run halted.
- Optional `onBudgetUpdate(runId, snapshot)` adapter option receives observational changes; callback failure cannot change admission.

The adapter keeps at most 64 settled closed ledger summaries. It drops full child/agent references on release and keeps only tiny identity tombstones so delayed child calls cannot escape accounting. Unresolved summaries are not evicted. Per-adapter ledgers are released on adapter disposal. Every retired owned child ID is retained in a process-wide `Symbol.for` set, including children whose cleanup was confirmed: auxiliary callbacks must not reopen a completed run after a remount. Failed or still-unconfirmed cleanup also has an exact-ID quarantine set. Replacement adapters reject those IDs before native dispatch, without retaining old agents/listeners or blocking unrelated child/project identities. Native child IDs are globally unique; new child identities remain usable. Tombstones have no production reset API and last until process exit. This is in-memory per-run accounting, not a durable cross-restart project ledger; runs are not silently resumed across process restarts.

## Limits of the guarantee

The guard enforces admission at the official host streaming seam, conditional on the host/provider honoring its declared combined context capacity and reporting valid usage. It cannot verify invoices, provider bugs, hidden transport retries, or requests made outside that seam by unrelated/custom plugins. A downstream host checkpoint can refuse before actual I/O, so `physicalCalls` can overcount network sends. Provider internals can also do additional transport work inside one admitted attempt (for example DeepSeek's stale image-file retry). The UI should label the field “native requests” / “宿主请求次数”, not exact HTTP charges. Do not describe this as an unconditional billing guarantee. Cross-runtime quarantine resumes when the replacement adapter mounts: there is no claim of enforcement during a plugin-unloaded interval when no workflow hook exists, or after a process restart. Persistent tombstones intentionally contain only exact retired/unconfirmed child IDs, not a global/project-wide budget lock.

## Verification

`node --test test/production-budget.test.mjs test/host-adapter.test.mjs`

The native tests use official rc2 Cordis, AgentLoop, SessionStore, SessionProjectionRegistry, LlmRuntime, native in-process spawn and retry plugins. Only the model adapter and sandbox-policy resolver are inert fixtures. They exercise real native request marking/preparation, usage chunks, retries, six independently selected role models, zero-dispatch refusal, missing usage, auxiliary calls, unrelated sessions, late child calls, bounded history and agent/session cleanup. Native cases explicitly skip if the optional full host test packages are absent; unit tests remain runnable with the declared LLM peer. All native cases ran in the implementation checkout. No live model endpoint, credential, real user file, or desktop profile was used.

The separate existing `scripts/verify-team-host.mjs` still verifies permission, native tool guard, approval and cleanup regressions. Those tests use deterministic agent fixtures; the budget test above additionally exercises the real AgentLoop.

Official source contracts inspected: `@deepseek-ai/dsh-llm` (`llm/stream`, `PreparedLlmCall`, `TokenUsage`, `LlmModelContext`, request marking/call comparison); `@deepseek-ai/dsh-agent-loop` (`prepareRequest`, `buildRequest`, retry loop); `@deepseek-ai/dsh-session` (`requestHeader`, `requestContext`); `@deepseek-ai/dsh-token-meter` (disjoint accounting and non-gating pressure projection); and `@deepseek-ai/dsh-llm-retry` (native request-error recovery), all version 0.2.0-rc.2.
