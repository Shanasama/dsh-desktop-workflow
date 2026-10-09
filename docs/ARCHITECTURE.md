# Current architecture: v0.4

See [V04-ARCHITECTURE.md](V04-ARCHITECTURE.md) for the current native /team entry,
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
