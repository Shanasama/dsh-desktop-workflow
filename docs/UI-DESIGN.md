# Team control surface: visual design and source notes

The v0.4 frontend is an original React, SVG and CSS implementation. It intentionally treats the team as a developer tool, not a marketing dashboard. No remote fonts, new UI libraries, externally hosted assets, copied layouts, third-party screenshots, or fake activity are included in the delivered plugin.

## References consumed before implementation

- **Trigger.dev — Dashboard UI updates**, July 3, 2026: https://trigger.dev/changelog/dashboard-ui-updates . The official task-overview screenshot was downloaded and visually inspected. Source image: https://trigger.dev/changelog/dashboard-ui-updates/task-overview.png . Borrowed principles: quiet graphite surfaces, one-pixel separators, compact navigation, contextual right-hand details. Analytics cards were deliberately omitted because this plugin has no corresponding data. Trigger.dev repository: https://github.com/triggerdotdev/trigger.dev (Apache-2.0 codebase). Its screenshot remains a reference, not a distributed asset.
- **Langflow — Concepts overview**: https://docs.langflow.org/concepts-overview . The official workspace image was downloaded and visually inspected. Source image: https://docs.langflow.org/assets/images/workspace-8fb540f88e4f855d3af89ca3ab15f462.png . Borrowed principles: graph-first hierarchy, restrained dot canvas, small utility controls. The plugin does not suggest that nodes can be rewired. Repository: https://github.com/langflow-ai/langflow (MIT core); no source code or assets copied.
- **React Flow / xyflow**: https://github.com/xyflow/xyflow and https://reactflow.dev/examples/styling/dark-mode . Reference for customizable node styling, dark canvas and edge differentiation. MIT core/free examples; no Pro code, dependency or template included. Documentation was reviewed; this project does not claim an independently captured React Flow screenshot.
- **Kedro Viz**: https://github.com/kedro-org/kedro-viz and https://demo.kedro.org/ . Apache-2.0 repository. Reference research inspected the selected-node outline / graph / metadata-inspector structure. On narrow containers our inspector moves below the graph rather than shrinking three columns.
- **Linear — How we redesigned the Linear UI**: https://linear.app/now/how-we-redesigned-the-linear-ui . First-party rationale for density, hierarchy and quiet surfaces. Typography is implemented with local system fonts instead of importing Linear's font assets.
- **Dribbble — AI Workflow Builder / Dark UI**, Sasha Menscikova: https://dribbble.com/shots/26567993-AI-Workflow-Builder-Dark-UI ; **Visual Workflow Builder / Dark Dashboard UI**, Ryven: https://dribbble.com/shots/26969856-Visual-Workflow-Builder-Dark-Dashboard-UI . Research visually inspected the original imagery for compact nodes, dot canvas and outlined chrome. No reuse license for those design assets was verified. They are inspiration only; none of their artwork or code is shipped.
- **Inngest — Traces**: https://www.inngest.com/docs/platform-and-operations/traces . Interaction reference for selected task plus detail panel. Its current repository licensing is not treated as permission to copy implementation. No source copied.

## Implemented decisions

- The default graphite palette is scoped to `.tm-root`; host theme and document layout remain untouched. Cyan identifies selection/control, amber identifies attention, and red is reserved for errors. Status is always also expressed in text.
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
