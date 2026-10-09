# Jev core scheduling in v0.3

## What actually runs

The production runtime always constructs `JevTeamController`. The older
`TeamController` is retained as the independently tested bounded DAG scheduler;
it is not exposed as a production fallback. A standard LLM `router` cannot
substitute for Jev and production rejects that configuration.

1. Validate explicit TypeSafe disclosure consent, server Jev credential reference,
   actual six-role host models, trusted verification profile, and explicit scope.
2. Acquire the process-wide lease and original parent permission/context guards.
3. Capture an independent clean Git baseline through the native host tools runtime.
4. Make an independent TypeSafe `/v1/systemone` classify request using the pinned
   `lane.json` typed questions. Classify review intensity, not permission.
5. Execute a bounded planner/coordinator/reviewer/task DAG with exact user-selected
   provider/model/effort options. Read-only jobs may overlap; edits are serial.
6. Independently run fixed checks and inspect repository contents, metadata, diff,
   scope and protected-test integrity through the original host sandbox.
7. Send bounded, redacted evidence to Jev with the pinned `loop-step.json` questions.
   Local code-first rules override semantic completion guesses when facts fail.
8. Continue, retry, verify without another edit cycle, escalate exactly one lane,
   or block for a person. `small → medium → high → escalate → person`.
9. Complete only with a successful final reviewer, completed tasks, passing trusted
   checks, current scope/protection evidence and Jev's completion thresholds.
   A final no-test seal re-hashes the tree after the Jev response; stale evidence
   cannot complete the run.

## Deliberate differences from upstream

- This is a port of the lane policy semantics, not installation of the Hermes CLI.
  Source pinned by `git ls-remote` and a detached checkout at
  `b22a21f365720cb7cf06f9b229c095176b39cdb9`. MIT attribution is in NOTICE.
- User-selected six-role models are always pinned. Upstream `person_named_model`
  keeps its route; here Jev can still classify review intensity while all six
  selected routes remain unchanged. There is no implicit Astra/model/provider swap.
- The current version does not offer a separately authorized per-lane model map.
- Missing key, unavailable API, malformed response, missing tests, unsafe scope,
  or missing evidence BLOCK. Upstream routing's fail-open/keep-current behavior
  is deliberately not a production execution fallback.
- Initial underspecification/`other` blocks for a person. Semantic `needs_person`
  blocks immediately rather than spending through remaining lanes.
- The five step actions and completion thresholds remain: implemented ≥ .8,
  in_scope ≥ .8, next=complete, next confidence ≥ .6. Failed checks require retry,
  and two attempts or a repeated identical failure require escalation. The
  separate upstream `retry.json` policy is not used or conflated with loop-step.
- Model assertions cannot provide tests/scope facts. Independent host observations
  and an after-decision seal are required. Unknown cleanup states poison the lease.
- Scope checks cover the current repository, including ignored files and file
  modes/directories, not the whole operating system. Actual access remains subject
  to the original host sandbox. The verifier requires cwd=workspaceRoot and a
  read-only/workspace-write policy; full-access and linked-worktree configurations
  are unsupported and block rather than relaxing permissions.

## Server configuration and disclosure

Only trusted server configuration supplies `jev.credentialEnv` (an environment
variable NAME, e.g. TYPESAFE_API_KEY), optional `jev.model` (default jev-latest),
and `verificationProfiles`. Never paste a key into this panel, a task goal or chat.
No key field exists in browser settings, API snapshots or localStorage. Jev uses
only the fixed HTTPS TypeSafe endpoint, does not follow redirects, and does not
reuse a normal role model. Do not put secrets in the test environment; the checker
passes only a minimal PATH/home/temp/locale environment to its check subprocesses.
Deploy server secrets under the host's own secret isolation policy; this plugin
cannot remove unrelated credentials already accessible to existing host tools.

Example server verification profile (configure only after reviewing commands):

```json
{
  "jev": {"credentialEnv": "TYPESAFE_API_KEY", "model": "jev-latest"},
  "verificationProfiles": [{
    "id": "project-checks",
    "name": "Reviewed project checks",
    "checks": [{"id": "test", "argv": ["node", "--test", "test/acceptance.mjs"], "timeoutMs": 60000}],
    "protectedPaths": ["test/acceptance.mjs", "package.json"],
    "expectsChanges": true
  }]
}
```

Profiles must protect every acceptance test, runner/script, configuration and
relevant dependency input that can determine a passing check. Indirect commands
such as npm test also require their package scripts/config/lock/runner to be
protected. Checks must be bounded foreground jobs, not daemon-launching commands.
The UI shows actual argv, timeout and protected paths before each start. Browser
requests can select a profile ID and safe relative scope paths; they cannot supply
shell code, executable paths, endpoints, credentials or permission overrides.

TypeSafe receives a redacted task (up to 3000 characters; 2000 for step), diff
statistics/file names (1500), check tails (2500), and reviewer notes (1200).
No whole source files, whole logs, session history or permission settings are sent.
Redaction is not a guarantee against all personal or commercially sensitive data.
A per-run checkbox is required and never restored from storage.

## Limits and conservative blockers

- Concurrency 1–4; total role dispatches 1–32; tasks per DAG 1–12.
- Retries per lane 0–2; per-agent model steps 1–16; duration 1–30 minutes.
- Jev rounds 1–8 (default 4); Jev calls 1–20 (default 10), each timeout 10 seconds.
- Individual role response maxTokens 1–32768 (default 4096).
- These are separate dispatch/step/output/request limits, NOT a total billed-token
  or dollar cap. Input/context tokens and provider-internal behavior may also cost
  money. Configure provider-side spending limits separately before paid work.
- Checks: up to four argv commands, each 1–60 seconds; only original host tools
  and sandbox execute them. Host denial/extra approval is never automatically
  approved. Background promotion, timeout, abort or uncertain execution poisons
  the lease until the user inspects outstanding work and restarts the host.
- Workspace traversal: 50,000 entries/256 MiB; scope at most 256 files; protected
  manifest 20,000 entries/64 MiB. Oversized/truncated evidence blocks. Repositories
  with larger dependencies need a reviewed smaller isolated checkout, not a bypass.
- Clean Git baseline required. Linked worktrees, hidden index entries and symlink
  paths in scope/protection are refused. Git metadata changes, protected acceptance
  changes, outside-scope files/modes/directories and changed verification inputs block.
  Tests that intentionally generate output must use an approved in-scope location.

## Verification labels

`npm run check`: build, typecheck, offline unit/UI/fixture tests; no paid inference.
`test:host`: actual rc.2 HTTP authentication, route lifecycle and module discovery.
`test:team-host`: official rc.2 registries/guards/tool pipeline with inert agents,
LLM catalog, sandbox policy and transport fixtures. No real provider execution.
`scripts/prepare-verifier-fixture.mjs`: prepares explicit test-only commands;
these were executed by the external host exec tool in its original sandbox, not
by a server-side replacement shell. This verifies the checker interpreter, not
an end-to-end native DSH provider loop.

Real Web loading/empty-config blocking and visual QA are separate acceptance
stages. No live TypeSafe/role-model calls or native Electron execution are claimed.
