# v0.3 architecture

Target: official DSH 0.2.0-rc.2 native Web Client sidebar and scoped host services.

- `src/index.js`: authenticated exact `/api` routes and lifecycle injection.
- `src/team-runtime.js`: mandatory production Jev controller, global lease,
  session/context generation, model metadata preflight, idempotent start/query,
  cancellation and cleanup quarantine. No model calls while mounting/cataloging.
- `src/jev-controller.js`: classify → bounded role DAG → independent verification
  → lane step → continue/retry/verify/escalate/complete; final freshness seal.
- `src/orchestrator.js`: reusable bounded DAG execution primitive, strict plan/review
  schemas, serial edits and retained graph/events. Production never exposes its
  legacy router mode as a Jev fallback.
- `src/jev-client.js`: independent TypeSafe HTTPS call, fixed endpoint, server-only
  credential reference, capped/redacted state, strict typed answer validation,
  pinned policy semantics and conservative local completion pre-rules.
- `src/verification.js`: trusted fixed profiles, native host-tool invocation,
  baseline/protection/full-tree/Git metadata hashes, tests, scope and freshness seal.
  The server does not run a replacement child_process/shell. Its fixed verifier
  interpreter executes only inside the parent's native bash tool/sandbox.
- `src/host-adapter.js`: exact six-role model binding through actual rc.2 spawn;
  role-scoped monotonic tool guards, permission/context fingerprint monitoring,
  steps/depth, parent mutation guard and cleanup acknowledgement. Private ALS
  admits only the exact verifier agent/tool/args while preserving host pre-policy;
  extra approval becomes denial, never automatic approval.
- `client/*`: six model selectors, separate Jev control panel, actual task nodes,
  credential/check-profile blockers, per-run data consent and explicit fixture.
  Local storage is whitelisted model/limit configuration, never secrets or consent.

Scope integrity is repository-local, including ignored files and modes/directories.
The original sandbox remains authoritative; this is not whole-system transaction
isolation. Verification requires the repository cwd to equal workspaceRoot and
refuses full-access mode. Protected inputs and Git metadata must not change.

No task can complete from a model's claimed checks. Evidence is tagged with run,
round and an unpredictable invocation nonce. Jev has no capability to supply a
command, endpoint, credential or permission. After a completion candidate, a
second host observation checks the current tree against that round's fingerprint.

Unconfirmed cleanup, unknown native tool outcomes, timeout or promoted/background
work poison the process lease. New runs cannot bypass it by replacing the runtime.
The prior v0.2 frozen release and existing host profiles are not edited by this code.

See [JEV-V03.md](JEV-V03.md) for precise upstream differences, limits and disclosure.
