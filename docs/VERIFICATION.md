最新会话隔离回归见 [SESSION-ISOLATION-053.md](SESSION-ISOLATION-053.md)。

> v0.5.2 Windows verifier patch: see [current results and limitations](WINDOWS-VERIFIER-052.md). The aggregate counts below describe the historical cloud v0.5.0 run.

# v0.5 verification record

## Final code checks

Run with official modules to avoid skipping the native-host suite:

```bash
DSH_NODE_MODULES=/absolute/official/node_modules npm run check
DSH_NODE_MODULES=/absolute/official/node_modules npm run test:host
DSH_NODE_MODULES=/absolute/official/node_modules npm run test:team-host
```

Latest aggregate: build + typecheck + **151/151 tests, zero skips**. Without
DSH_NODE_MODULES the dedicated official-host test explicitly skips; it must not
be described as a host pass.

Coverage includes the five Jev actions, exact pinned role models, completion and
freshness seal, limits/cancellation/quarantine, native configuration revision and
credential secrecy, no-runner editable/unverified states, path/symlink/hardlink
boundaries, native-only command handling, repeated command and session-switch
protection, native key input clearing, partial saves, consent revoke and UI states.

## Official rc.2 integration

The isolated host suite uses actual official LocalAttachmentStore, PluginManager,
LocalCredentialProvider, CredentialsController, Loader/ConfigEditor/SettingsForms,
CommandRuntime, AgentRegistry, Gateway, Connection and WebServer components.

- Attachment tgz → read-only attachment handle → plugin_manager install_bundle.
  A denied approval performs zero installs; one explicit fixture approval performs
  actual isolated install, bundle registration and uninstall. This tests plumbing,
  not a real model's interpretation of a dragged attachment.
- Random test-only credential set is write-only, persists across provider reload,
  uses owner-only file permissions and can be removed. No real key is used.
- Actual native settings persist six roles/consent, reject stale revisions and
  unsupported secret fields, and reload correctly.
- Real authenticated HTTP command/credential endpoints reject missing auth and
  foreign Origin. `/team` binds exact sessions; repeats do not duplicate; correct
  cancellation settles; cross-session cancellation fails; cancellation during
  metadata validation creates no model run.
- Native verifier dispatch preserves parent scope, exact ALS guard and original
  tools pipeline. Native approval routes to the exact parent; a cancelled prompt
  performs zero dispatch. No auto-approval is implemented.

Agent outputs, catalog and transport used by these tests are explicit fixtures;
no paid role model or TypeSafe API is contacted.

## Actual interpreter and component checks

The fixed project interpreter was executed by the external host exec tool in its
original sandbox against explicit temporary Git fixtures. Independently checked:

- Existing dirty state + 600 source files + ignored 300 MiB dependency file works
- Explicit custom Node test arguments are retained; failing custom test is failed
- Zero/all-skipped tests do not pass; changed acceptance cannot complete
- Temporary run-bound evidence cleanup executes; source/path tampering is rejected

Python/Go/Rust runner adapters are conservative detections of installed tooling;
a broad multi-language real-project benchmark is not claimed.

Cloud-browser component QA is explicit fixture data: full/narrow settings,
key-save clear-input, consent revoke, settings/result navigation, corrected overflow
and separate unverified state. After redesign: responsive graph/fit, selectable Jev hub, explicit narrow details/return navigation, selected-role draft preservation, and fake-key clearing were visually rechecked. Screenshot: `docs/images/v04-settings-preview.png`.
See [CLOUD-HOST-QA.zh-CN.md](CLOUD-HOST-QA.zh-CN.md) for the parent's layered record.

## Not claimed

No live paid Jev/six-model development run, no real key setup, no user Windows
installation, and no native Electron end-to-end visual acceptance. No total billed
token or dollar budget cap. Old 3085/3086 user/browser environments are untouched.

Frozen archive installation and remote publication are separate final release
steps. Any later production-code change requires new tests, package hash and
reinstallation before attributing acceptance to the new build.

## Visual redesign regression

Eleven dedicated regressions cover role editor preservation and hidden-role validation, keyboard graph tabs, disclosure state, honest Jev service labels, first-node width observation, fit, explicit details/return navigation, stale cancellation isolation, and text contrast. All 14 backend source files remain byte-identical to the previously verified functional v0.4 baseline. New visual references and asset/license boundaries are documented in [UI-DESIGN.md](UI-DESIGN.md).

## v0.5 dual-theme regression

The final aggregate was rerun after the task-zoom accessibility label fix: build,
TypeScript and all 151 tests passed, zero skips. Eight independent integration
tests cover synchronised workflow/settings mounts, unavailable/corrupt/quota
storage, foreign storage events, pending save/cancel and preservation of drafts,
selected tasks and zoom. Only the enumerated nonsecret theme preference is stored;
switching adds no model, credential or settings RPC. All 14 backend source files
remain byte-identical to v0.4.

Cloud-browser component QA verified both styles at full width, 420px and 320px
(no root horizontal overflow), keyboard selection, reload persistence, model
draft preservation, and retained task selection/75% zoom. Initial pale status
contrast and dark selected-tab focus issues were corrected and regression-tested.
Screenshots are labelled offline fixtures, not live host/service execution.

The original graphite stylesheet is unchanged; only the new selector and needed
header wrapping are added to that mode. Arknights-inspired overrides are scoped
to the plugin root, with no host/document theme changes or third-party assets.

Windows/Electron GUI installation and real paid Jev/model calls remain unrun.
