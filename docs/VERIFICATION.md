# v0.3 verification record

## Passed without paid inference

- `npm run check`: build + TypeScript + **111 tests**, including legacy bounded
  scheduler regression, mandatory Jev/classify/step contracts, all five loop
  actions, one-lane escalation, unchanged selected models, call/round caps,
  cancellation, trusted-check hard gates, stale seal, process cleanup quarantine,
  credential/disclosure handling, native verifier outcome parsing and UI flows.
- Independent reviewer added `test/review-safety.test.mjs`: hostile native tool
  outcomes, detached profiles, invalid paths/timeouts, stale completion seal and
  cancellation while final evidence remains pending.
- `test:host` against installed official rc.2 packages: HTTP authentication,
  foreign-Origin rejection, team route protection, unload, Loader discovery and
  revisioned native client bundle publication.
- `test:team-host`: actual official registry, scoped tools/pre-step waterfalls,
  exact model options, ALS role isolation, read-only mutation denial, parent guard,
  native verifier dispatch, exact verifier exception and ask→deny without approval.
  Agents, LLM catalog, sandbox policy and transport in this test are explicit inert
  fixtures, not a live AgentLoop/provider execution.
- The fixed verifier interpreter ran via the external host exec tool in its original
  execution sandbox against an explicit `/tmp/dsh-jev-verifier-*` Git fixture.
  Real Node check + in-scope source change passed. Outside files/chmod,
  protected evidence and hidden-index manipulation were independently exercised
  and refused. Preparation script only emits a command; it does not execute a
  server-side substitute shell. This is a separate test of interpreter behavior.
- Cloud-browser fixture UI: mandatory Jev/check blockers, per-run TypeSafe consent,
  consent reset, role model preservation, lane/round/gates and clear fixture labeling.

- Official rc.2 plugin manager installed the v0.3 archive into an isolated temporary profile with `--ignore-scripts`, registered its bundle, then removed it successfully. No user profile was used.

## Separately pending at package freeze

- Installation of the frozen v0.3 archive into an isolated empty-config real Web
  host on port 3086, then authenticated loading and fail-closed UI verification.
  The existing port-3085 v0.2 profile is preserved. Parent acceptance owns this stage.

## Not run / not claimed

- Real paid TypeSafe or six-role model requests, provider credentials or account setup.
- Full production AgentLoop executing project edits through live model providers.
- Native Windows/macOS Electron interaction.
- A total billed-token or dollar spending cap. Dispatch/step/output/Jev-call limits
  are separate and do not include all input/context/provider-internal costs.

Commands:

```bash
npm run check
DSH_NODE_MODULES=/absolute/official/node_modules npm run test:host
DSH_NODE_MODULES=/absolute/official/node_modules npm run test:team-host
DSH_CLI=/absolute/official/dsh/lib/bin.js node scripts/verify-profile.mjs dist/dsh-desktop-workflow-0.3.0.tgz
```

Any post-freeze source change requires a new build/test, new archive/hash, and
reinstallation before attributing Web acceptance to that version.
