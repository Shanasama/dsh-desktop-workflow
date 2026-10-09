# DSH Desktop Workflow

[中文安装说明](docs/INSTALL.zh-CN.md)

A quiet, native **DeepSeek Harness Desktop** panel for understanding a Jev workflow: routing → plan → implementation → tests → review → delivery. Select any phase to inspect its saved evidence.

Built specifically against the official **DSH 0.2.0-rc.2** Web Client contracts. It adds a native **工作流 (Workflow)** right-sidebar tab, not a TUI scene, replacement desktop application, or hosted website. The exact user's desktop distribution is not yet verified; treat other versions/forks as unverified.

![Chinese component preview using synthetic data, not an installed Desktop session](docs/images/component-preview.png)

*Same-component preview with synthetic data. This is not evidence of installation in the user’s Desktop.*

## What it does

- Shows the configured saved workflow, routing confidence when present, phase status, evidence, and timeline.
- Polls the selected file every five seconds while mounted; marks old running state as stale.
- Has explicit empty, error, running, blocked/review, stale, and completed states.
- Offers a clearly labeled synthetic demo. Demo is local UI only.
- Uses the host's shared React and authenticated connection; supports light/dark theme and compact sidebar layouts.

**Read-only.** No model calls, credentials, command execution, project changes, or approval actions. A completed phase is the CLI producer's report, not independent verification. The diagram shows the expected sequence of the producer's five stages, not an inferred execution DAG.

## Build from this repository

Node 22.19+ or Node 24+:

```sh
npm ci --ignore-scripts
npm run check
npm pack --ignore-scripts
```

The package has no lifecycle scripts and no runtime dependencies. React is provided by DSH. Visible plugin chrome is Chinese; user-provided source evidence is preserved verbatim. `npm run preview` serves the same component with synthetic fixtures on localhost for inspection; this is a **component preview, not proof of an installed Desktop plugin**.

## Install in the intended Desktop profile

First identify the existing profile actually used by your Desktop distribution. Do not substitute a TUI profile, change permission defaults, or create an unrestricted profile. Close/restart that profile as its distribution requires. With DSH 0.2.0-rc.2 and pnpm available:

```sh
dsh plugin --profile YOUR_DESKTOP_PROFILE add /absolute/path/dsh-desktop-workflow-0.1.0.tgz --ignore-scripts
```

On Windows, use PowerShell and a quoted archive path. A POSIX helper is available: `node scripts/profile-install.mjs install YOUR_DESKTOP_PROFILE /absolute/path/archive.tgz`. It requires an existing profile and never chooses one automatically.

Reopen Desktop, open a session, and use the right sidebar's new-tab/type picker to choose **工作流**. It starts empty. No shortcut or existing view is overridden.

## Connect an existing workflow

This viewer consumes the existing `CliWorkflowStore` JSON contract. In the selected profile's `cordis.patch.yml`, add the following override while preserving unrelated entries:

```yaml
- id: desktop-workflow
  config:
    stateFile: '/absolute/path/original-project/runtime/cli-workflows/RUN_ID.json'
    staleAfterMs: 120000
```

Windows example: `C:/project/runtime/cli-workflows/RUN_ID.json`. Use the exact run file returned by the existing producer. It must be a regular non-symlink JSON file of at most 1 MiB. Each new run requires a new explicit path. The viewer never scans your home, selects another run, or reads authentication files. A stale badge means an old saved running update; it does not prove a process is stuck. An error retains no claim that the latest state was read successfully.

## Remove

```sh
dsh plugin --profile YOUR_DESKTOP_PROFILE remove dsh-desktop-workflow --config.ignore-scripts=true
```

Remove only the `desktop-workflow` override you added, then restart Desktop. Runtime unload unregisters the tab, route, and styles; component unmount cancels polling. Producer files are untouched.

See [architecture](docs/ARCHITECTURE.md) and [verification](docs/VERIFICATION.md) for exact boundaries and test coverage.

The selected run is **profile-wide and independent of the currently open DSH chat**. Switching conversations does not switch this file. The saved run ID identifies what you are viewing; `inspect` runs display an Inspect phase instead of suggesting edits occurred.
