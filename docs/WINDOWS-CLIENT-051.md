# v0.5.1 Windows client injection fix

The v0.5.0 settings page failed on the official Windows DSH 0.2.0-rc.2 host
with `cannot get property "remote" without inject`. The plugin declared
`remote.credentials`, but reading `ctx.remote` also requires the parent
`remote` service. Optional chaining does not bypass Cordis service guards.
The official rc.2 model settings client declares both services.

The patch declares both services and ends the catalog loading state when a
settings read fails. Refresh clears the failure and retries normally. It does
not change backend execution, saved role selections, provider configuration,
credential storage, permissions, or the two UI themes.

## Reproduce the client contract regression

Build first, then point `DSH_NODE_MODULES` at an approved official rc.2 tree:

```sh
npm ci --ignore-scripts
npm run build
npm run typecheck
DSH_NODE_MODULES=/absolute/official/node_modules npm run test:client-host
```

For an installed Windows ASAR, run the script with that installed Electron
executable in Node mode (`ELECTRON_RUN_AS_NODE=1`) and `--expose-internals`;
ordinary Node cannot read ASAR module paths. Use a separate test home and no
provider credentials. The script does not load a host profile or call a model.

`scripts/verify-client-host.mjs` loads the actual Cordis, Typert registry,
API gateway and generated Remote client services. Providers are sibling plugin
fibers, not root-provided services that could mask a missing injection. A
negative control removes `remote` and reproduces the exact error; the actual
plugin settings and sidebar callbacks must load successfully. It also checks
catalog failure/recovery and command acknowledgment opening the setup tab.
RPC replies and presentation slots are read-only fixtures; rendering uses
JSDOM. This is not a claim of Electron visual acceptance or real model/Jev use.

## Windows validation on 2026-10-10

- Build and TypeScript passed.
- The new official rc.2 client contract regression passed, including the
  negative control and failure/recovery checks.
- Full ordinary suite: 146 passed, 4 failed, 2 explicitly skipped (152 total).
  The Windows failures are the intentionally POSIX-only install wrapper test,
  a package inventory test spawning bare `npm` with a Unix cache path, and two
  symlink fixtures denied with EPERM. No system permissions were changed.
  The opt-in client and legacy host suites are skipped without official modules.
- The package is separately packed through the Windows Node/npm CLI and
  checked before official installation. See the local handoff record for its
  exact hash, installation result and protected-file comparisons.

The 151/151 results in VERIFICATION.md describe the earlier cloud v0.5.0 run.
They are not the outcome of this Windows run. Native Electron screenshots
after this patch still require user verification; no paid model or real Jev
service is called during the patch tests.
