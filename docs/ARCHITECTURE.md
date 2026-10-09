# v0.2 architecture and trust boundaries

Target: the official published `@deepseek-ai/*` **0.2.0-rc.2** contracts. This is an independently installed native Web Client sidebar plugin inside DSH Desktop, not a TUI scene or replacement website.

## Components

- `src/team-contracts.js`: strict detached data validation and the narrow rc.2-supported JSON Schema subset. JS validators separately enforce lengths, roles, IDs, graph acyclicity, dependency existence and all resource bounds.
- `src/orchestrator.js`: deterministic scheduler. Models generate/review structured plans; the scheduler owns dependency admission, bounded concurrency, the single writer lane, finite retry revisions, terminal state and cancellation drain.
- `src/host-adapter.js`: the real rc.2 boundary. Binds each role's exact provider/model/effort/output ceiling to `subagents.start('spawn', request)` and always disposes the returned owned run.
- `src/team-runtime.js`: authenticated action endpoints, session-generation preflight, exact-model validation, idempotent start requests, one process-wide team lease and cleanup quarantine.
- `client/TeamView.tsx`: role topology, observed task DAG, configuration, confirmation and output inspector. Conceptual topology edges are labeled as role relationships; task edges are exactly snapshot edges.
- `client/ConnectedTeam.tsx`: native session binding, bounded local model-reference settings, snapshot polling and unknown-start recovery. No goal, evidence or credentials are saved to local settings.
- `src/state.js` and the old WorkflowView remain a separate, explicitly profile-wide legacy import viewer.

## Actual native APIs

Published contract packages inspected directly:

- `dsh-client-connection`: exact Fetch route registration under the existing authenticated `/api` carrier and the client's correlated RPC envelope.
- `dsh-client-ui-sidebar-right`, `dsh-client-ui-slots`, `dsh-client-ui-session`: native tab registry, body slot and session standard props.
- `dsh-llm`: `listProviders`, `listModels`, `resolveModelInfo`, `resolveCallConfig`. Only active advertised routes are offered; catalog queries do not invoke inference and do not prove credentials work.
- `dsh-subagent`: `start('spawn', { parent, prompt, signal, agentOptions, outputSchema, persona, maxDepth })`; `result` plus mandatory `dispose()`.
- `dsh-agent`: exact live registry identity and serial `agent/created`, which completes before initial prompt admission. A creation listener failure prevents the initial turn.
- `dsh-tools`: monotonic execution guard and scoped native tool presentation.
- `dsh-sandbox-policy`: read-only resolution of the existing session's execution policy.

Source locations are in [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness), notably packages/client, packages/agent, packages/subagent and packages/tools. Verification uses the published rc.2 package files, not an assumption that moving master is equivalent.

## Execution sequence and graph meaning

The optional configured router can ask for clarification. Otherwise a planner produces a strict DAG; the coordinator model refines it once. If enabled, the plan reviewer sees the **coordinator's exact executable DAG**. Revisions rerun planner/coordinator/review under the same finite dispatch budget. Only approved nodes enter scheduling.

Ready research/exploration tasks can overlap; write-capable workers occupy a single lane. Dependencies admit only after success. A retry is a new node and edge, preserving earlier failure evidence. Permission refusal and nonretryable infrastructure errors are never retried. Repeated failure is reviewed diagnostically and stays blocked; a favorable diagnostic cannot convert failed work into success. Final review joins finished task results; a revise/blocked verdict remains actionable feedback rather than automatically creating an unlimited repair loop.

Each model call uses the saved role selection. The coordinator is an actual selected model call, while subsequent scheduling is deterministic. The plugin does not infer a model's capability or claim a particular provider's model exists from an example nickname.

## Permission and lifecycle safety

`toolFilter` alone is insufficient in rc.2 because it does not remove scoped tools. The adapter instead installs a monotonic tool guard during the awaited serial creation hook. AsyncLocalStorage carries the exact role tag across the official creation path; ownership and parent identity are verified before the guard is accepted. The published child must be in the tag's recorded set before its result is trusted.

Readonly roles allow only the official read/search names (research may additionally use web search/fetch) and `structured_output`. Workers allow native read/write/edit/bash/pwsh plus structured output. Native mode removes the PTC transport surface. Unknown tools, recursive DSH delegation and settings tools are denied. This is execution protection for the trusted official tool contracts, not an additional OS sandbox or protection against a malicious third-party tool shadowing a trusted name.

Existing sandbox/preset policy is inherited and never changed. rc.2 pins child approval policy to `never`, meaning additional approval requests are rejected, not approved. The adapter records asks/denials and step-cap exhaustion as refusal rather than successful completion.

A process-global lease admits one team at a time, including metadata preflight. It prevents parallel teams across sessions from sharing write access. The parent session gets a temporary modification-tool guard until children are quiescent. New main-session activity cancels the team; other applications and unrelated host sessions are not transactionally isolated.

Session confirmation keys bind the exact live Agent and the cwd/sandbox/preset/approval fingerprint. Changed permissions invalidate confirmation and cancel active work via session events, checks before child/step admission and a bounded running-context monitor. No session is fabricated, resumed or moved to another project by this plugin.

If child disposal fails, all remaining team work is cancelled, later dispatch is denied, the parent guard is retained and the process-wide lease is poisoned. API/UI reports unconfirmed cleanup, not a successful stop. Quarantine survives plugin/runtime replacement and clears only with host-process restart after the user checks residual tasks.

## Resource bounds

Defaults: concurrency 2, total child dispatches 12, task DAG size 8, retries 1, duration 10 minutes, child steps 8, output ceiling 4096 tokens per conversation-model request. Hard validation bounds are finite. Retained runs/events/nodes/output are also capped.

These are not a total token or currency budget. Host-internal retries and external programs are outside plugin dispatch accounting. Cancellation cannot undo completed file changes or guarantee that a provider does not charge for an already-started request.

## RPC and packaging

One exact `/api/dsh-desktop-workflow/team/{catalog,snapshot,start,cancel,request}` POST route per operation. DSH owns authentication and Host/Origin checks. The plugin never replaces the gateway's single interceptor or opens an unauthenticated server.

Start requests have stable IDs and are replay-safe. A definitive server rejection is different from an unknown network outcome; the client queries the original request instead of silently starting another. Payloads are data only; no arbitrary executable workflow script, project path or credential can be submitted.

`./client` is a lazy `window.__ModuleLoader__.load` CJS factory. React stays external and is supplied by DSH. Native tab/styles and routes are lifecycle-owned. Only metadata and snapshots are read on mount; task execution requires the explicit confirmation action.
