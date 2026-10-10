# Current architecture: v0.6.0

See [PRODUCTION-ACCEPTANCE.md](PRODUCTION-ACCEPTANCE.md) for current acceptance and [V04-ARCHITECTURE.md](V04-ARCHITECTURE.md) for the inherited native /team entry,
one-time Config settings, native write-only credentials, automatic verification,
and truthful completed/unverified/blocked states.

Production files:

- `team-setup.js`: native volatile Config, revision-safe setup, per-operation Jev credentials/consent
- `team-runtime.js`: native command, authenticated APIs, session/idempotency/lease and cancellation
- `auto-verification.js`: native project probe, bounded test runners, run-bound manifests and seal
- `host-adapter.js`: actual rc.2 spawn/model binding, file/tool guards, native approval, cleanup
- `jev-controller.js` / `jev-client.js`: mandatory independent Jev loop and pinned policy semantics
- `orchestrator.js` / `team-contracts.js`: bounded DAG primitive and strict data contracts
- `client/*`: native settings section, command acknowledgment, automatic sidebar, results/cancel

The old explicit v0.3 verifier and read-only snapshot contracts remain tested as
legacy components; the normal v0.4 /team flow does not ask users to configure them.
Historical upstream differences remain in [JEV-V03.md](JEV-V03.md).

## v0.6.0 additions

- `production-budget.js`: native exact-generation context reservations and host usage settlement, optional per-run token cap. No API credentials, price table or external transport.
- `host-adapter.js`: budget hook on the real `llm/stream` path, including native retries. Unknown usage stays reserved; no silent refund or fallback.
- `team-contracts.js`: explicit weak/base/strong candidates, validated against current host catalog before first dispatch.
- `orchestrator.js`: selects each actual request model from frozen run settings and the main Jev lane; exposes actual route records.
- `team-setup.js`: native versioned settings for budget, routing, main Jev, pinned shadow and metadata trace. Existing credential service owns secrets.
- `jev-controller.js`: primary and observer status, per-run version pinning, shadow concurrency/time/call bounds and unchanged trusted completion gates.
- `execution-trace.js`: bounded metadata-only decision/model/route events; no raw prompts, project paths, errors or credential fields.

The package declares the exact host `@deepseek-ai/dsh-llm` rc.2 peer to validate native request identity. The old standalone evaluation ledger is intentionally not the production execution adapter. Token budgets are per run and do not claim cross-run persistence or supplier billing equivalence. A small cap may block before the first request because admission reserves the full declared context bound rather than estimating a prompt.
