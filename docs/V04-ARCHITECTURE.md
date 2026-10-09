# v0.4 native UX and execution design

## Native entry and one-time settings

`registerTeamCommand` uses the official `ctx.commands.register` seam. `/team`
executes against the exact receiving root agent without submitting text to the
ordinary model. `recordInput:false` avoids duplicating task text in command logs.
Native command IDs identify calls, not double-click intent: session pending maps,
the process lease and the active-run check prevent duplicate execution. A repeated
command during an active run opens existing progress, not a second job.

The client listens only to the official `command/executed` event for `/team` in
its currently mounted session. Mount and request generations prevent A→B→A late
responses from opening the wrong panel. `sidebarRight.openTab` opens results or
a dedicated setup view. The same setup form is registered in native
`settings.section`; there is no invented settings deep-link API.

`teamSetup` is a volatile native Config field. `createSetupStore` uses the actual
Loader entry's namespace and `ctx.settings.update` with revision checking. Six
model choices, limits and explicit continuing TypeSafe consent persist across
host reloads. No configuration value is stored in browser localStorage.

The password field calls only native `remote.credentials.set` for
`DSH_TEAM_JEV_API_KEY`. Public settings and status use `describe`, never a secret
value. Each real Jev operation uses native server-side `credentials.resolve`,
rechecks consent and does not export the secret to the process environment. The
native local provider stores owner-only plaintext; no OS vault or malicious
same-user-process isolation claim is made. A failed native credential operation
is not automatically retried or echoed verbatim.

## Automatic project checks

`createAutoVerifier` constructs a fixed interpreter command and invokes the
parent-scoped native `tools.execute` path. It does not spawn a replacement server
shell. The original sandbox and approval pipeline remain authoritative. Auto
checks may ask the actual user through the native approval service; there is no
auto-approval, changed permission mode or escalation argument. A cancelled prompt
is observed before dispatch and cannot start the command.

Probe and verification behavior:

- Capture tracked plus nonignored project files; compare against task-start
  hashes so prior dirty changes are not attributed to this run. Dependency/cache
  trees and sensitive files are excluded from enumeration and denied to workers.
- Limit source evidence to 10,000 entries/128 MiB, not the entire ignored dependency
  tree. A native-tool-created owner-only temporary manifest is referenced by path,
  SHA-256, run identity and canonical project root instead of embedded in argv.
  Subsequent checks validate it; final cleanup is awaited under the same lease.
- Native file guards canonicalize paths, reject symlink traversal/dangling links,
  outside-project paths, sensitive files, dependency directories, Git internals,
  nonregular files and hard-linked mutation targets. Existing files require edit,
  not wholesale write. Glob is name listing; grep must target a regular file.
- Recognize bounded foreground Node test/Jest/Vitest/tsc, Python pytest/unittest,
  Go test with module downloads disabled, and Cargo test --offline. No npm
  lifecycle hooks, npx package fetching or automatic dependency installation.
- Preserve safe explicit Node test arguments. Zero-test/all-skipped results cannot
  satisfy a behavioral check. Typecheck is separately labeled, not sold as tests.
- Existing test/config inputs are recorded. Users' tasks can change them, but
  altered acceptance cannot satisfy the original completion gate. Test-generated
  source changes are rejected as stale/incomplete evidence.
- Jev receives short facts only after native observation. Completion requires
  independent successful checks, unchanged acceptance inputs, scope, review,
  semantic thresholds, then a fresh post-Jev seal. Security paths retain the
  upstream lane-escalation rule.

## Honest terminal states

`completed` means the full gate passed. `unverified` means useful analysis/edits
were produced, but independent acceptance is missing or changed. A recognized
safe project without a supported runner is `unverified-editable`: one bounded
work cycle is allowed, then it ends as unverified rather than looping on empty
checks. A project whose baseline/path safety cannot be established is genuinely
analysis-only; write/edit are denied there. Permission or execution failures are
blocked. Unknown active process cleanup still quarantines the process lease.

The auto verifier retains v0.3's restriction that cwd equals workspaceRoot and
sandbox is read-only/workspace-write. It does not silently allow full-access.
No rollback or whole-system transaction isolation is provided.

## Jev policy and outbound data

The pinned upstream policy JSON is unchanged. Classify asks lane,
security_sensitive and underspecified. Step asks implemented, in_scope and next;
code-first facts override unsupported success. User model/provider/effort choices
remain pinned through every lane escalation.

Each request is fixed to `https://api.typesafe.ai/v1/systemone`, redirects disabled.
State contains redacted task text (3000 classify/2000 step characters), diff
statistics (1500), check tail summaries (2500), and review notes (1200). No whole
source files, full logs, credential values or host permission configuration are
sent. Redaction cannot guarantee removal of all private business/personal data;
the user enables this exact ongoing category in setup and can revoke it.

Separate dispatch, step, duration, retry, output and Jev-request bounds are enforced.
These are not total input/context/provider-cost or dollar limits.
