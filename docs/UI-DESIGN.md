# Team control surface: two visual styles and source notes

The v0.5 frontend retains the complete v0.4 graphite/cyan style and adds an Arknights-inspired alternative. Both are original React, SVG and CSS implementations. It intentionally treats the team as a developer tool, not a marketing dashboard. No remote fonts, new UI libraries, externally hosted assets, copied layouts, third-party screenshots, or fake activity are included in the delivered plugin.

## v0.5: Arknights-inspired style

The user-provided references were read and visually inspected before settling the new visual language:

- **Arknights Visual Design Skills**, ganmayou2333: https://github.com/ganmayou2333/Arknights-Visual-Design-Skills and its UI reference, https://github.com/ganmayou2333/Arknights-Visual-Design-Skills/blob/main/arknights-video-style/references/ui-style.md . The repository describes graphite layers, 1px industrial dividers, 45-degree cuts, a 4px spacing rhythm, condensed English labels and restrained motion. It is MIT-licensed documentation, but explicitly does not license Arknights game imagery or trademarks. No scripts, templates, or source implementation were executed or copied. Its sample contrast claims were not assumed correct; the actual delivered colors are checked independently.
- **LearningProject**, ignoredone: https://www.ignoredone.space/index.php/learningproject/ . The original gallery and its VEC12 composition were visually inspected. The relevant principles are alternating pale dossier/dark surfaces, black-and-white typographic hierarchy, yellow selection blocks, technical grids and registration marks. The gallery is principally poster/thumbnail design work, so oversized decorative codes and dense poster collage were deliberately not translated into operational UI. No image reuse license was verified; none of its downloads or imagery is distributed.
- **Publisher-provided Arknights App Store imagery**: https://apps.apple.com/us/app/arknights/id1464872022 . The actual home-interface promotion was visually inspected to distinguish the game UI from fan posters: white rectangular menu blocks, black condensed headings, narrow separators, cyan selection and limited orange/yellow rules. It is a reference only; no game illustration, operator portrait, game emblem, or official affiliation is included.

### Visual implementation

The new skin is an operations terminal and dossier treatment, rather than a palette swap:

- Near-black header, square industrial chrome, dense typography using local font fallbacks, and original clipped-corner CSS geometry. The DSH identity and real role meanings remain unchanged.
- Off-white current-task and inspector surfaces create the stark dossier contrast seen in the references. These surfaces use separate dark text and status tokens, including a dark operational-status color, so cyan does not become unreadable on white.
- An original fine-line major/minor canvas grid, corner registration marks, flat cards and narrow status/selection rules replace rounded blue cards and a dot canvas. The graph still represents precisely the same reported nodes and edges.
- Pale yellow (#e4e56b) is reserved mainly for selection, primary action, and a few structural accents. Cyan (#8ad5df on dark surfaces) indicates actual running/planning/reviewing state, and the independent Jev controller. There are no decorative activity pulses, invented operation codes, random counts, or new metrics.
- All new skin rules are scoped to `.tm-root[data-theme=arknights]`. The original `client/team.css` is retained unchanged; the only shared additions are the requested native style selector and its narrow-header accommodation. Host appearance and the historical read-only bridge are not reskinned.

### Switching and migration

Both the team workflow header and native team settings have a top-right **风格** selector, with **明日方舟** and **原版 UI** options. It is a labelled native select with keyboard focus treatment, not a hover-only menu. Narrow headers wrap without dropping actions.

The visual preference uses a separate scalar-only browser key, `dsh-desktop-workflow:ui-theme:v1`, accepting only `arknights` or `classic`. An initial render never writes storage. No task text, model selection, consent, key entry, credential, project path, or run data is placed in it. Selecting a style changes no backend or native settings and makes no RPC.

When there is no valid saved style preference, the new **明日方舟** style is the default. This applies to both new installations and upgrades with no saved preference: v0.4 had no theme preference marker, so the plugin does not pretend it can distinguish those cases or mine older settings. Choosing **原版 UI** once explicitly preserves that choice across normal reloads. Missing, invalid, or cleared preferences use the new default; invalid values are not interpreted or rewritten merely by rendering.

A shared React external store synchronizes mounted workflow and settings surfaces immediately. Browser storage events synchronize other same-origin windows; unrelated or session-storage events are ignored. Events received while no surface is open are reconciled on reopening. The storage subscription is cleaned up when the last surface unmounts. If storage access is unavailable or writes are denied, switching still works for the current loaded plugin and newly reopened surfaces in that plugin; persistence across a full reload cannot be guaranteed in that environment.

Switching only changes a root attribute. It does not change component keys or remount editors. Current role/node selection, graph tab and zoom, expanded disclosures, event visibility, running cancellation guards, pending save guards, and unsaved settings/key/consent drafts stay in place. Secret entry still clears on the existing explicit save or close paths. Changing appearance is never acceptance of the TypeSafe disclosure.

### New verification coverage

The focused theme tests check normal-text AA contrast of dark, hover, selected, and light dossier surfaces; context-specific running status; selected/unselected tab focus; CSS scoping; absence of network fonts/assets or decorative animation; and explicit 320px/420px preview fixtures. The independent integration tests exercise simultaneous connected workflow/settings surfaces, no added RPC or credential writes, unsaved drafts, pending cancellation/save and duplicate guards, preference persistence, corrupted values, cross-window events, and denied/missing/quota-limited storage.

The offline preview toolbar separately controls fixture state, host light/dark background, and full/420px/320px container width. The product's own top-right selector controls its style. Fixture data stays visibly labelled, and the preview cannot call a host or TypeSafe service. JSDOM tests do not prove rendered geometry or native OS-select behavior; final browser QA and aggregate/package verification are recorded separately in the release verification notes. This document does not claim paid-model or local Electron end-to-end validation.

## v0.4 original-style references

- **Trigger.dev — Dashboard UI updates**, July 3, 2026: https://trigger.dev/changelog/dashboard-ui-updates . The official task-overview screenshot was downloaded and visually inspected. Source image: https://trigger.dev/changelog/dashboard-ui-updates/task-overview.png . Borrowed principles: quiet graphite surfaces, one-pixel separators, compact navigation, contextual right-hand details. Analytics cards were deliberately omitted because this plugin has no corresponding data. Trigger.dev repository: https://github.com/triggerdotdev/trigger.dev (Apache-2.0 codebase). Its screenshot remains a reference, not a distributed asset.
- **Langflow — Concepts overview**: https://docs.langflow.org/concepts-overview . The official workspace image was downloaded and visually inspected. Source image: https://docs.langflow.org/assets/images/workspace-8fb540f88e4f855d3af89ca3ab15f462.png . Borrowed principles: graph-first hierarchy, restrained dot canvas, small utility controls. The plugin does not suggest that nodes can be rewired. Repository: https://github.com/langflow-ai/langflow (MIT core); no source code or assets copied.
- **React Flow / xyflow**: https://github.com/xyflow/xyflow and https://reactflow.dev/examples/styling/dark-mode . Reference for customizable node styling, dark canvas and edge differentiation. MIT core/free examples; no Pro code, dependency or template included. Documentation was reviewed; this project does not claim an independently captured React Flow screenshot.
- **Kedro Viz**: https://github.com/kedro-org/kedro-viz and https://demo.kedro.org/ . Apache-2.0 repository. Reference research inspected the selected-node outline / graph / metadata-inspector structure. On narrow containers our inspector moves below the graph rather than shrinking three columns.
- **Linear — How we redesigned the Linear UI**: https://linear.app/now/how-we-redesigned-the-linear-ui . First-party rationale for density, hierarchy and quiet surfaces. Typography is implemented with local system fonts instead of importing Linear's font assets.
- **Dribbble — AI Workflow Builder / Dark UI**, Sasha Menscikova: https://dribbble.com/shots/26567993-AI-Workflow-Builder-Dark-UI ; **Visual Workflow Builder / Dark Dashboard UI**, Ryven: https://dribbble.com/shots/26969856-Visual-Workflow-Builder-Dark-Dashboard-UI . Research visually inspected the original imagery for compact nodes, dot canvas and outlined chrome. No reuse license for those design assets was verified. They are inspiration only; none of their artwork or code is shipped.
- **Inngest — Traces**: https://www.inngest.com/docs/platform-and-operations/traces . Interaction reference for selected task plus detail panel. Its current repository licensing is not treated as permission to copy implementation. No source copied.

## Shared behavior retained from v0.4

- The original graphite palette is scoped to `.tm-root`; host theme and document layout remain untouched. Cyan identifies selection/control, amber identifies attention, and red is reserved for errors. Status is always also expressed in text.
- Compact header, goal, true counts and a single-row Jev disclosure keep the graph near the top of a 420px sidebar. Long run messages and Jev evidence remain inspectable through native disclosure controls.
- The Jev hub is a keyboard-operable button. It is a distinct service controller, not a seventh configurable model. Six actual role models remain independent. Team topology is explicitly a schematic, not a claim of executed edges.
- The task graph renders exactly reported nodes and edges. A responsive top-to-bottom narrow layout, horizontal wide layout, scroll region and explicit fit/zoom controls preserve inspection. There are no simulated pulses, invented timings or editable connection ports.
- The selected-node inspector shows model/provider, role semantics, status, output, errors and source identifiers. Narrow mode moves it below the graph; wide mode provides a contextual rail.
- The event trace remains readable and bounded. Synthetic fixtures are always labelled and cannot trigger real work. Terminal fixture states end active worker records and include a terminal Jev decision.
- One-time native settings present a compact six-role selector and one visible editor. All role drafts remain mounted and validated, so switching does not discard edits or hide an invalid role from save validation. Jev secret entry is write-only; the exact data-use disclosure and consent checkbox remain visible.
- No backend or API contracts changed. `/team`, host native settings, consent revocation, scope evidence, cancellation and configured providers preserve their established behavior. Cancellation UI guards now also isolate stale responses across session/run changes.

## Accessibility and verification

Native buttons/details/selects, visible focus rings, roving-focus graph tabs, named icon-only controls, reduced-motion support, non-color status labels, wrapping technical evidence and explicit scroll regions are retained. Muted metadata colors are selected for dark-surface contrast rather than decorative low-opacity text.

Verification: build, TypeScript and the existing team interaction suite plus dedicated redesign regression tests. The root task separately records final browser checks and full regression/package validation; this document does not claim paid-model or Electron end-to-end validation.
