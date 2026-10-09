# Verification

Target API: official published DeepSeek Harness 0.2.0-rc.2. No user desktop, credentials, production model, project, or live profile was changed during development.

## Automated checks

`npm run check` builds both the host lazy client factory and the same-component preview, typechecks the React source, and runs Node tests.

Coverage includes:

- Input whitelist, truncation, control/bidi filtering, unknown statuses and malformed JSON.
- Absolute-path-only regular file reads, symlink rejection and 1 MiB bound.
- Inspect/edit distinction, failed routing and latest chronological update.
- Empty payload requirement, error redaction, stale running state only.
- Correct request/response correlation and exact `/api` route registration/disposal.
- Native tab registration, view rendering, node selection, arrow/Home/End keyboard selection, timeline disclosure.
- Demo-to-live failure without retaining synthetic results, late-response rejection, per-request timeout recovery, cancellation on unmount and style/tab cleanup.
- Adversarial HTML/script-like producer text remains escaped inert text.
- Install/remove command scoping and invalid-profile handling using a mock `dsh` binary; **not a live installation**.
- Package inventory excluding dependencies, previews, credentials and runtime state.

## What these checks do not prove

Mocked services test our integration calls, not a complete installed Electron app. Browser component screenshots are visual QA only. The user's specific Windows Desktop distribution, profile resolution and plugin discovery have not been validated on their computer. No real Jev/model request, tool execution, approval, independent test verification or live workflow producer is exercised by synthetic fixtures.

See any accompanying delivery report for actual browser/host smoke results and their exact scope. Do not infer a successful Desktop installation from a component preview.

## Real CLI package lifecycle (passed)

The built tarball was installed and removed with the official DSH 0.2.0-rc.2 CLI and pnpm 11.25.0 in a temporary, explicitly isolated `DSH_HOME` profile. Installation registered the dependency and `dsh.profile.bundles` layer; removal cleared both and removed the installed dependency. Install scripts were disabled. This validates the real package-manager lifecycle, not Electron rendering.

Reproduce optionally with `DSH_CLI=/absolute/path/to/official/dsh/lib/bin.js node scripts/verify-profile.mjs /absolute/path/to/plugin.tgz`. The script creates and cleans up only its own temporary profile.

## Browser component QA (passed)

The same built component was inspected in the cloud browser: wide map, node/routing inspector interaction, compact 420px sidebar, and dark theme. Visible UI and synthetic-demo explanations are Chinese; technical model names and user-provided evidence retain their original text. This remains component QA rather than proof of the user's Desktop installation.

## Real rc.2 HTTP host smoke (passed)

A credential-free isolated harness activated the plugin using the actual published rc.2 Cordis Context, WebServer, Connection and BrowserAuth implementations. An ephemeral in-memory credential-store fixture supplied only the test host's cookie-signing material; no user credentials or credential files were used.

Observed results:

- Unauthenticated snapshot POST: HTTP 401.
- Host launch-token cookie exchange: HTTP 303.
- Authenticated snapshot POST: HTTP 200, correlated RPC result with waiting state.
- Authenticated request with foreign Origin: HTTP 403.
- After plugin disposal: HTTP 404 for the removed exact route.

This is real HTTP transport/authentication/registration evidence. It does not replace verification of the user's specific Electron distribution, profile path or live producer.

Final aggregate source check: build + strict typecheck + **22 automated tests passed** after the full Chinese UI rebuild.

The real rc.2 Loader and ClientModuleRegistry also discovered the package's Web client and both declared native dependency edges, served its revisioned bundle over HTTP 200, and removed the graph entry when the Loader entry was removed. This checks real discovery/resource delivery; the native sidebar body still needs visual acceptance in the target Desktop distribution.

Reproduce the seven native host checks with an existing official rc.2 package tree:

```sh
DSH_NODE_MODULES=/absolute/path/to/node_modules npm run test:host
```

`--expose-internals` is used only by the opt-in upstream integration harness, not by the plugin at runtime. It does not launch an agent, call a model, or read/write a user profile. Source development was additionally verified from a fresh temporary copy using `npm ci --ignore-scripts` followed by the full 22-test check.

The screenshot in `docs/images/component-preview.png` shows our synthetic component preview, not the user's uploaded Desktop screenshot.
