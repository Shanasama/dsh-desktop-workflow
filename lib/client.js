/* Built from client/; React is supplied by the host. */
window.__ModuleLoader__.load({id:"dsh-desktop-workflow",factory:function(require){var module={exports:{}};var exports=module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// client/index.tsx
var index_exports = {};
__export(index_exports, {
  ConnectedTeam: () => ConnectedTeam,
  ConnectedTeamSettings: () => ConnectedTeamSettings,
  ConnectedWorkflow: () => ConnectedWorkflow,
  ENDPOINT: () => ENDPOINT,
  JEV_CREDENTIAL_REF: () => JEV_CREDENTIAL_REF,
  PACKAGE: () => PACKAGE,
  TeamSettingsView: () => TeamSettingsView,
  TeamView: () => TeamView,
  apply: () => apply,
  applyLegacy: () => applyLegacy,
  createDefaultTeamSettings: () => createDefaultTeamSettings,
  inject: () => inject,
  registerTeamCommandListener: () => registerTeamCommandListener,
  requestWithDeadline: () => requestWithDeadline,
  teamDemoSnapshot: () => teamDemoSnapshot
});
module.exports = __toCommonJS(index_exports);
var import_react5 = require("react");

// client/WorkflowView.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
function Icon({ name, className = "" }) {
  const paths = {
    route: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "3", y: "8", width: "5", height: "8", rx: "1.5" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "16", y: "3", width: "5", height: "5", rx: "1.5" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "16", y: "16", width: "5", height: "5", rx: "1.5" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 12h3a2 2 0 0 0 2-2V7a1.5 1.5 0 0 1 1.5-1.5H16M8 12h3a2 2 0 0 1 2 2v3a1.5 1.5 0 0 0 1.5 1.5H16" })
    ] }),
    plan: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "5", y: "3", width: "14", height: "18", rx: "2.5" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9 8h6M9 12h6M9 16h3" })
    ] }),
    code: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16" }) }),
    test: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9 3h6m-5 0v6l-5 8a2.5 2.5 0 0 0 2 4h10a2.5 2.5 0 0 0 2-4l-5-8V3M8 14h8" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m10 17 1 1 3-3" })
    ] }),
    review: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 3 4.5 6v5c0 4.5 2.8 7.7 7.5 10 4.7-2.3 7.5-5.5 7.5-10V6L12 3Z" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m8.5 12 2.5 2.5 4.5-5" })
    ] }),
    flag: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M6 21V4m0 0c4-4 8 4 13 0v10c-5 4-9-4-13 0" }) }),
    refresh: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M20 7v5h-5M4 17v-5h5" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9" })
    ] }),
    lock: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "6", y: "10", width: "12", height: "11", rx: "2.5" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" })
    ] }),
    chevron: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m9 5 7 7-7 7" }),
    check: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m5 12 4.5 4.5L19 7" }),
    clock: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 7v5l3 2" })
    ] }),
    alert: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m10.3 4.1-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-2.9l-8-14a2 2 0 0 0-3.4 0Z" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 9v5m0 3v.1" })
    ] }),
    arrow: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 12h16m-6-6 6 6-6 6" }) }),
    file: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M14 3v6h6M8 14h8m-8 3h5" })
    ] }),
    spark: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" }) }),
    close: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m7 7 10 10M7 17 17 7" })
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { className: `wf-icon ${className}`, width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: paths[name] });
}
var baseStageDefinitions = [
  { key: "jev-routing", label: "Jev \u8DEF\u7531", detail: "\u9009\u62E9\u6267\u884C\u8DEF\u5F84", icon: "route" },
  { key: "plan", label: "\u89C4\u5212", detail: "\u660E\u786E\u5B9E\u73B0\u65B9\u6848", icon: "plan" },
  { key: "work", label: "\u5B9E\u73B0", detail: "\u5B9E\u65BD\u4EE3\u7801\u53D8\u66F4", icon: "code" },
  { key: "tests", label: "\u6D4B\u8BD5", detail: "\u9A8C\u8BC1\u6267\u884C\u7ED3\u679C", icon: "test" },
  { key: "review", label: "\u590D\u6838", detail: "\u590D\u6838\u5B9E\u73B0\u7ED3\u679C", icon: "review" },
  { key: "done", label: "\u5B8C\u6210", detail: "\u6536\u5C3E\u5E76\u6C47\u603B\u7ED3\u679C", icon: "flag" }
];
var statusLabels = {
  pending: "\u5F85\u5F00\u59CB",
  running: "\u8FDB\u884C\u4E2D",
  completed: "\u5DF2\u5B8C\u6210",
  blocked: "\u5DF2\u963B\u585E",
  skipped: "\u5DF2\u8DF3\u8FC7",
  failed: "\u5931\u8D25",
  waiting: "\u7B49\u5F85\u4E2D",
  review: "\u590D\u6838\u4E2D",
  approval: "\u5F85\u6279\u51C6",
  stale: "\u5FEB\u7167\u5DF2\u8FC7\u671F"
};
var routeLabels = { execute: "\u76F4\u63A5\u6267\u884C", plan_review: "\u89C4\u5212\u4E0E\u590D\u6838", clarify: "\u6F84\u6E05\u9700\u6C42" };
var humanRoute = (route) => routeLabels[route] || route || "\u672A\u62A5\u544A";
function formatTime(value) {
  if (!value) return "\u672A\u62A5\u544A\u65F6\u95F4";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function fullTime(value) {
  if (!value) return "\u65E0\u4FDD\u5B58\u65F6\u95F4";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN");
}
function percent(value) {
  return `${Math.round(value * 100)}%`;
}
function Status({ status, subtle = false }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: `wf-status wf-status--${status}${subtle ? " wf-status--subtle" : ""}`, children: [
    status === "completed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "check" }) : status === "failed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "close" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wf-status-dot" }),
    statusLabels[status] || status
  ] });
}
function getNodeStatus(snapshot, key) {
  if (!snapshot || snapshot.mode === "waiting" || snapshot.mode === "empty") return "pending";
  if (key === "jev-routing") {
    if (snapshot.routingStatus === "failed") return "failed";
    if (snapshot.routingStatus === "running") return "running";
    return snapshot.jev ? "completed" : snapshot.routingStatus || (snapshot.stage === "jev-routing" ? "running" : "pending");
  }
  return snapshot.stages.find((item) => item.stage === key)?.status || "pending";
}
function WorkflowView({ snapshot, loading = false, error, onRefresh, onDemo }) {
  const stageDefinitions = baseStageDefinitions.map((definition) => definition.key === "work" && snapshot?.executionMode === "inspect" ? { ...definition, label: "\u68C0\u67E5", detail: "\u68C0\u67E5\u9879\u76EE\u72B6\u6001" } : definition);
  const [selected, setSelected] = (0, import_react.useState)(() => stageDefinitions.some((s) => s.key === snapshot?.stage) ? snapshot.stage : "jev-routing");
  const [activityOpen, setActivityOpen] = (0, import_react.useState)(true);
  const previousRun = (0, import_react.useRef)(snapshot?.runId || snapshot?.title);
  const buttons = (0, import_react.useRef)([]);
  const inspectorId = (0, import_react.useId)();
  const activityId = (0, import_react.useId)();
  const empty = !snapshot || snapshot.mode === "waiting" || snapshot.mode === "empty" || snapshot.mode === "error";
  const isDemo = snapshot?.mode === "demo";
  const stale = Boolean(snapshot?.stale || snapshot?.mode === "stale");
  const selectedDefinition = stageDefinitions.find((item) => item.key === selected);
  const selectedStage = snapshot?.stages.find((item) => item.stage === selected);
  const selectedStatus = getNodeStatus(snapshot, selected);
  const currentDefinition = stageDefinitions.find((item) => item.key === snapshot?.stage);
  const activity = snapshot?.stages.filter((item) => item.status !== "pending" || item.time || item.summary || item.evidence?.length) || [];
  const selectedEvidence = selectedStage?.evidence?.filter(Boolean) || [];
  const pendingDetail = selectedStatus === "pending" ? "\u6B64\u9636\u6BB5\u5C1A\u672A\u62A5\u544A\u52A8\u6001\u3002" : "\u4FDD\u5B58\u7684\u72B6\u6001\u4E2D\u672A\u5305\u542B\u9636\u6BB5\u6458\u8981\u3002";
  (0, import_react.useEffect)(() => {
    const identity = snapshot?.runId || snapshot?.title;
    if (identity !== previousRun.current) {
      setSelected(stageDefinitions.some((s) => s.key === snapshot?.stage) ? snapshot.stage : "jev-routing");
      previousRun.current = identity;
    }
  }, [snapshot?.runId, snapshot?.title, snapshot?.stage]);
  const selectWithKeyboard = (event, index) => {
    let next;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % stageDefinitions.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + stageDefinitions.length) % stageDefinitions.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = stageDefinitions.length - 1;
    if (next !== void 0) {
      event.preventDefault();
      setSelected(stageDefinitions[next].key);
      buttons.current[next]?.focus();
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "dsh-workflow", "aria-label": "\u684C\u9762\u5DE5\u4F5C\u6D41\u67E5\u770B\u5668", "aria-busy": loading, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: "wf-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-heading-group", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wf-appmark", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "route" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-eyebrow", children: [
            "DEEPSEEK HARNESS ",
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "/" }),
            " \u684C\u9762\u7248"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "\u5DE5\u4F5C\u6D41" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-header-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wf-readonly", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "lock" }),
          "\u53EA\u8BFB"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: `wf-button wf-demo-button${isDemo ? " is-active" : ""}`, onClick: onDemo, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "spark" }),
          isDemo ? "\u6F14\u793A\u6A21\u5F0F" : "\u67E5\u770B\u6F14\u793A"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "wf-button wf-refresh-button", onClick: onRefresh, disabled: loading, "aria-label": isDemo ? "\u5237\u65B0\u5DF2\u4FDD\u5B58\u7684\u5DE5\u4F5C\u6D41\u5E76\u9000\u51FA\u6F14\u793A" : "\u5237\u65B0\u5DF2\u4FDD\u5B58\u7684\u5DE5\u4F5C\u6D41", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "refresh", className: loading ? "wf-spin" : "" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: loading ? "\u5237\u65B0\u4E2D" : "\u5237\u65B0" })
        ] })
      ] })
    ] }),
    error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-notice wf-notice--error", role: "alert", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "alert" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u65E0\u6CD5\u8BFB\u53D6\u5DE5\u4F5C\u6D41\u72B6\u6001" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: error }),
        snapshot && !empty && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u4E0B\u65B9\u4ECD\u663E\u793A\u6700\u8FD1\u4E00\u6B21\u53EF\u7528\u7684\u5FEB\u7167\u3002" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { className: "wf-text-button", type: "button", onClick: onRefresh, disabled: loading, children: [
        "\u91CD\u8BD5 ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "arrow" })
      ] })
    ] }),
    isDemo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-demo-notice", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wf-demo-tag", children: "\u6F14\u793A" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u6A21\u62DF\u5DE5\u4F5C\u6D41\uFF0C\u4EC5\u7528\u4E8E\u4F53\u9A8C\u754C\u9762\uFF0C\u4E0D\u4F1A\u6267\u884C\u4EFB\u52A1\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wf-demo-note", children: "\u672A\u8C03\u7528\u6A21\u578B\u6216\u66F4\u6539\u9879\u76EE" })
    ] }),
    stale && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-notice wf-notice--warning", role: "status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "clock" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u6B64\u5FEB\u7167\u53EF\u80FD\u5DF2\u8FC7\u671F" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
          "\u6700\u540E\u4FDD\u5B58\u4E8E ",
          fullTime(snapshot?.updatedAt),
          "\u3002\u5237\u65B0\u4EE5\u68C0\u67E5\u6700\u65B0\u72B6\u6001\u3002"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-run-summary", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-run-title", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wf-section-kicker", children: empty ? "\u51C6\u5907\u5F00\u59CB" : "\u5F53\u524D\u5DE5\u4F5C\u6D41" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: empty ? "\u6BCF\u4E00\u6B65\uFF0C\u6E05\u6670\u53EF\u89C1\u3002" : snapshot?.title }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: empty ? "\u8FDE\u63A5\u5DF2\u4FDD\u5B58\u7684\u5DE5\u4F5C\u6D41\uFF0C\u67E5\u770B\u8DEF\u7531\u3001\u8FDB\u5EA6\u4E0E\u8BC1\u636E\u3002" : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wf-summary-dot" }),
          currentDefinition ? `${currentDefinition.label}\u9636\u6BB5` : "\u5DF2\u4FDD\u5B58\u7684\u5DE5\u4F5C\u6D41\u72B6\u6001",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wf-summary-separator", children: "\xB7" }),
          isDemo ? "\u6F14\u793A\u6570\u636E" : snapshot?.origin || "CLI \u62A5\u544A\u7684\u72B6\u6001"
        ] }) }),
        !empty && !isDemo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "wf-source-context", children: "\u5DF2\u914D\u7F6E\u7684\u8FD0\u884C \xB7 \u72EC\u7ACB\u4E8E\u5F53\u524D\u804A\u5929" }),
        !empty && snapshot?.runId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "wf-run-id", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u8FD0\u884C ID" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: snapshot.runId })
        ] })
      ] }),
      !empty && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-run-status", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Status, { status: snapshot?.status || "pending" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { title: fullTime(snapshot?.updatedAt), children: snapshot?.updatedAt ? `\u4FDD\u5B58\u4E8E ${formatTime(snapshot.updatedAt)}` : "\u672A\u62A5\u544A\u65F6\u95F4" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-workspace", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-map-panel", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-panel-heading", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u5DE5\u4F5C\u6D41\u56FE" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u56FA\u5B9A\u9636\u6BB5\u987A\u5E8F \xB7 \u4EE5\u4FDD\u5B58\u72B6\u6001\u4E3A\u51C6" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wf-keyboard-hint", children: [
            "\u70B9\u51FB\u8282\u70B9\u67E5\u770B\u8BE6\u60C5 ",
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "arrow" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `wf-canvas${empty ? " wf-canvas--empty" : ""}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wf-map", role: "group", "aria-label": "\u6309\u56FA\u5B9A\u987A\u5E8F\u6392\u5217\u7684\u5DE5\u4F5C\u6D41\u9636\u6BB5", children: stageDefinitions.map((definition, index) => {
            const nodeStatus = getNodeStatus(snapshot, definition.key);
            const node = snapshot?.stages.find((item) => item.stage === definition.key);
            const subtitle = definition.key === "jev-routing" && snapshot?.jev ? humanRoute(snapshot.jev.effectiveRoute) : definition.detail;
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `wf-node-wrap wf-node-wrap--${index} wf-node-wrap--${nodeStatus}`, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", ref: (element) => {
                buttons.current[index] = element;
              }, className: `wf-node wf-node--${nodeStatus}${selected === definition.key ? " is-selected" : ""}`, onClick: () => setSelected(definition.key), onKeyDown: (event) => selectWithKeyboard(event, index), "aria-pressed": selected === definition.key, "aria-controls": inspectorId, "aria-label": `${index + 1}. ${definition.label}: ${statusLabels[nodeStatus]}`, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wf-node-top", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `wf-node-icon wf-node-icon--${definition.key}`, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: definition.icon }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wf-node-number", children: [
                    "0",
                    index + 1
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wf-node-title", children: definition.label }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wf-node-description", title: subtitle, children: subtitle }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wf-node-bottom", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Status, { status: nodeStatus, subtle: true }),
                  node?.evidence?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wf-evidence-count", title: `${node.evidence.length} \u6761\u8BC1\u636E`, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "file" }),
                    node.evidence.length
                  ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "chevron", className: "wf-node-chevron" })
                ] })
              ] }),
              index < stageDefinitions.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wf-connector", "aria-hidden": "true", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "chevron" })
              ] })
            ] }, definition.key);
          }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-canvas-footer", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wf-canvas-caption", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "route" }),
              "\u5DF2\u62A5\u544A\u9636\u6BB5"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wf-legend", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "wf-legend-complete" }),
              "\u5DF2\u5B8C\u6210",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "wf-legend-running" }),
              "\u8FDB\u884C\u4E2D",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "wf-legend-pending" }),
              "\u5F85\u5F00\u59CB"
            ] })
          ] })
        ] }),
        empty && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-empty-bar", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: loading ? "\u6B63\u5728\u8BFB\u53D6\u5DE5\u4F5C\u6D41\u72B6\u6001\u2026" : "\u7B49\u5F85\u5DE5\u4F5C\u6D41" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: snapshot?.sourceNotice || "\u5C1A\u672A\u8FDE\u63A5\u5DF2\u4FDD\u5B58\u7684\u8FD0\u884C\u3002\u4E0A\u65B9\u4EC5\u5C55\u793A\u9636\u6BB5\u7ED3\u6784\u3002" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "wf-button wf-button--primary", onClick: onDemo, children: [
            "\u6D4F\u89C8\u6F14\u793A ",
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "arrow" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", { id: inspectorId, className: "wf-inspector", "aria-label": `${selectedDefinition.label}\u8BE6\u60C5`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-inspector-label", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u8282\u70B9\u8BE6\u60C5" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
            "0",
            stageDefinitions.findIndex((s) => s.key === selected) + 1,
            " / 06"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-inspector-title", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wf-detail-icon", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: selectedDefinition.icon }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: selectedDefinition.label }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Status, { status: selectedStatus, subtle: true })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "wf-inspector-summary", children: selected === "jev-routing" ? selectedStatus === "failed" ? "\u6765\u6E90\u62A5\u544A\u8DEF\u7531\u5931\u8D25\u3002\u8BF7\u67E5\u770B\u8FD0\u884C\u7AEF\u7684\u8BCA\u65AD\u4FE1\u606F\u3002" : snapshot?.jev ? `Jev \u4E3A\u6B64\u5DE5\u4F5C\u6D41\u9009\u62E9\u4E86\u300C${humanRoute(snapshot.jev.effectiveRoute)}\u300D\u8DEF\u5F84\u3002` : "Jev \u62A5\u544A\u8DEF\u7531\u51B3\u7B56\u540E\uFF0C\u5C06\u663E\u793A\u5728\u8FD9\u91CC\u3002" : selectedStage?.summary || pendingDetail }),
        selectedStatus === "approval" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-stage-note", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "lock" }),
          "\u8BF7\u5728\u6765\u6E90\u5E94\u7528\u4E2D\u5B8C\u6210\u6279\u51C6\u3002"
        ] }),
        selectedStatus === "blocked" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-stage-note", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "alert" }),
          "\u6B64\u9636\u6BB5\u5DF2\u963B\u585E\uFF0C\u8BF7\u67E5\u770B\u4E0B\u65B9\u62A5\u544A\u7684\u8BC1\u636E\u3002"
        ] }),
        selectedStatus === "failed" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-stage-note wf-stage-note--failed", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "alert" }),
          "\u6765\u6E90\u62A5\u544A\u6B64\u9636\u6BB5\u6267\u884C\u5931\u8D25\u3002"
        ] }),
        selected === "jev-routing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-inspector-section", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "\u8DEF\u7531\u51B3\u7B56" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", { className: "wf-facts", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "\u6A21\u578B" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: snapshot?.jev?.model || "\u672A\u62A5\u544A" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "\u8DEF\u7531" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: snapshot?.jev ? humanRoute(snapshot.jev.effectiveRoute) : "\u672A\u62A5\u544A" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "\u7F6E\u4FE1\u5EA6" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: typeof snapshot?.jev?.confidence === "number" ? percent(snapshot.jev.confidence) : "\u672A\u62A5\u544A" })
            ] })
          ] }),
          snapshot?.jev?.probabilities && Object.keys(snapshot.jev.probabilities).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wf-probabilities", "aria-label": "\u6765\u6E90\u62A5\u544A\u7684\u8DEF\u7531\u6982\u7387", children: Object.entries(snapshot.jev.probabilities).filter((entry) => typeof entry[1] === "number").map(([route, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `wf-probability${route === snapshot.jev?.effectiveRoute ? " is-chosen" : ""}`, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: humanRoute(route) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: percent(value) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wf-probability-track", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: `${Math.max(0, Math.min(1, value)) * 100}%` } }) })
          ] }, route)) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "wf-small-print", children: isDemo ? "\u6B64\u5904\u7684\u8DEF\u7531\u6570\u503C\u5747\u4E3A\u6F14\u793A\u6570\u636E\u3002" : "\u6570\u503C\u6765\u81EA\u8FD0\u884C\u7AEF\uFF1B\u7F6E\u4FE1\u5EA6\u4E0D\u4EE3\u8868\u72EC\u7ACB\u7684\u8D28\u91CF\u8BC4\u5206\u3002" })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-inspector-section", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "\u9636\u6BB5\u4FE1\u606F" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", { className: "wf-facts", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "\u4E0A\u4E00\u6B65" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: stageDefinitions[stageDefinitions.findIndex((s) => s.key === selected) - 1]?.label || "\u5DE5\u4F5C\u6D41\u76EE\u6807" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "\u6A21\u578B" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: selectedStage?.model || "\u672A\u62A5\u544A" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "\u8BB0\u5F55\u65F6\u95F4" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { title: fullTime(selectedStage?.time), children: formatTime(selectedStage?.time) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-inspector-section wf-evidence-section", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", { children: [
            "\u8BC1\u636E ",
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: selectedEvidence.length })
          ] }),
          selectedEvidence.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "wf-evidence-list", children: selectedEvidence.map((evidence, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "file" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: evidence })
          ] }, `${index}-${evidence}`)) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-no-evidence", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: selected === "jev-routing" ? "route" : "file" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: selected === "jev-routing" && snapshot?.jev ? "\u8DEF\u7531\u6570\u503C\u5DF2\u663E\u793A\u5728\u4E0A\u65B9\uFF0C\u6765\u6E90\u672A\u62A5\u544A\u5355\u72EC\u7684\u8BC1\u636E\u6587\u4EF6\u3002" : "\u6B64\u6B65\u9AA4\u5C1A\u672A\u62A5\u544A\u8BC1\u636E\u3002" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-inspector-footer", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "lock" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isDemo ? "\u6A21\u62DF\u6570\u636E \xB7 \u4EC5\u4F9B\u9884\u89C8" : "\u6765\u6E90\u62A5\u544A \xB7 \u672A\u7ECF\u72EC\u7ACB\u9A8C\u8BC1" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "wf-activity", "aria-label": "\u6765\u6E90\u62A5\u544A\u7684\u9636\u6BB5\u52A8\u6001", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "wf-activity-toggle", onClick: () => setActivityOpen((value) => !value), "aria-expanded": activityOpen, "aria-controls": activityId, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "clock" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u9636\u6BB5\u52A8\u6001" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wf-activity-description", children: isDemo ? "\u6A21\u62DF\u4E8B\u4EF6" : "\u6765\u81EA\u5DF2\u4FDD\u5B58\u7684\u5FEB\u7167" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "chevron", className: activityOpen ? "is-open" : "" })
      ] }),
      activityOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { id: activityId, className: "wf-activity-body", children: activity.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", { className: "wf-activity-list", children: activity.map((event, index) => {
        const definition = stageDefinitions.find((item) => item.key === event.stage);
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `wf-event-icon wf-event-icon--${event.status}`, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: event.status === "completed" ? "check" : event.status === "failed" ? "close" : event.status === "running" ? "refresh" : "clock" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-event-main", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wf-event-label", children: [
              definition?.label || event.stage,
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Status, { status: event.status, subtle: true })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: event.summary || "\u672A\u62A5\u544A\u6458\u8981\u3002" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", { title: fullTime(event.time), dateTime: event.time || void 0, children: event.time ? formatTime(event.time) : "\u2014" })
        ] }, `${event.stage}-${index}`);
      }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wf-activity-empty", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wf-empty-event-dot" }),
        "\u6765\u6E90\u62A5\u544A\u8FD0\u884C\u72B6\u6001\u540E\uFF0C\u9636\u6BB5\u52A8\u6001\u5C06\u663E\u793A\u5728\u8FD9\u91CC\u3002"
      ] }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", { className: "wf-footer", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "lock" }),
        snapshot?.sourceNotice || "\u53EA\u8BFB\u67E5\u770B\u5668\uFF0C\u4E0D\u8C03\u7528\u6A21\u578B\u3001\u4E0D\u6267\u884C\u4EFB\u52A1\u3001\u4E0D\u66F4\u6539\u9879\u76EE\u3002"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "wf-footer-signature", children: [
        "DSH ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5DE5\u4F5C\u6D41" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wf-visually-hidden", role: "status", "aria-live": "polite", children: loading ? "\u6B63\u5728\u5237\u65B0\u5DE5\u4F5C\u6D41\u72B6\u6001\u3002" : error ? "\u5DE5\u4F5C\u6D41\u5237\u65B0\u5931\u8D25\u3002" : empty ? "\u7B49\u5F85\u5DE5\u4F5C\u6D41\u3002" : `${isDemo ? "\u6F14\u793A\u6A21\u5F0F\u3002" : ""}${statusLabels[snapshot?.status || "pending"]}\u3002${currentDefinition?.label || "\u5DE5\u4F5C\u6D41"}\u9636\u6BB5\u3002` })
  ] });
}

// client/demo.ts
function demoSnapshot(preset = "running") {
  const presets = ["running", "review", "approval", "completed", "failed", "pending", "waiting", "stale"];
  const selected = typeof preset === "number" ? presets[Math.abs(Math.floor(preset)) % presets.length] : preset;
  const activeStage = selected === "review" || selected === "approval" ? "review" : selected === "completed" ? "done" : selected === "pending" ? "plan" : "tests";
  const keys = ["plan", "work", "tests", "review", "done"];
  const activeIndex = keys.indexOf(activeStage);
  const summaries = {
    plan: "\u5B9A\u4F4D\u8D2D\u7269\u8F66\u6570\u91CF\u66F4\u65B0\u95EE\u9898\uFF0C\u590D\u73B0\u8FB9\u754C\u60C5\u51B5\uFF0C\u5E76\u5236\u5B9A\u56DE\u5F52\u68C0\u67E5\u65B9\u6848\u3002",
    work: "\u66F4\u65B0\u6570\u91CF\u65F6\u540C\u6B65\u8D2D\u7269\u8F66\u72B6\u6001\u4E0E\u5546\u54C1\u5408\u8BA1\uFF0C\u4FDD\u6301\u73B0\u6709\u7ED3\u7B97\u884C\u4E3A\u4E0D\u53D8\u3002",
    tests: "\u6B63\u5728\u4F7F\u7528\u6A21\u62DF\u56DE\u5F52\u6837\u4F8B\u68C0\u67E5\u6570\u91CF\u66F4\u65B0\u4E0E\u8D2D\u7269\u8F66\u5408\u8BA1\u3002",
    review: "\u5BF9\u7167\u65B9\u6848\u3001\u62A5\u544A\u7684\u6D4B\u8BD5\u7ED3\u679C\u548C\u7ED3\u7B97\u8FB9\u754C\u590D\u6838\u53D8\u66F4\u3002",
    done: "\u6A21\u62DF\u5DE5\u4F5C\u6D41\u5DF2\u5230\u8FBE\u6700\u540E\u9636\u6BB5\uFF0C\u53EF\u4EE5\u67E5\u770B\u62A5\u544A\u7684\u7ED3\u679C\u3002"
  };
  const evidence = {
    plan: ["\u6A21\u62DF\u8BC1\u636E \xB7 \u590D\u73B0\uFF1A\u6570\u91CF\u4ECE 1 \u6539\u4E3A 2 \u540E\uFF0C\u5546\u54C1\u5408\u8BA1\u672A\u66F4\u65B0\u3002", "\u6A21\u62DF\u8BC1\u636E \xB7 \u8303\u56F4\uFF1A\u8D2D\u7269\u8F66\u72B6\u6001\u66F4\u65B0\u4E0E\u6570\u91CF\u56DE\u5F52\u6837\u4F8B\u3002"],
    work: ["\u6A21\u62DF\u8BC1\u636E \xB7 \u53D8\u66F4\u6837\u4F8B\uFF1Asrc/cart/updateQuantity.ts", "\u6A21\u62DF\u8BC1\u636E \xB7 \u65B0\u589E\u6837\u4F8B\uFF1Atests/cart-quantity.test.ts", "\u6A21\u62DF\u8BC1\u636E \xB7 \u672A\u4FEE\u6539\u4EFB\u4F55\u771F\u5B9E\u6587\u4EF6\u3002"],
    tests: ["\u6A21\u62DF\u8BC1\u636E \xB7 \u56DE\u5F52\u6837\u4F8B\uFF1A\u66F4\u65B0\u6570\u91CF\u540E\u91CD\u65B0\u8BA1\u7B97\u5546\u54C1\u5408\u8BA1\u3002", "\u6A21\u62DF\u8BC1\u636E \xB7 \u8FB9\u754C\u6837\u4F8B\uFF1A\u6570\u91CF\u4E0D\u5F97\u5C0F\u4E8E 1\u3002", "\u6A21\u62DF\u8BC1\u636E \xB7 \u7ED3\u7B97\u6837\u4F8B\u6B63\u5728\u8FDB\u884C\u4E2D\uFF0C\u4E0D\u4EE3\u8868\u771F\u5B9E\u6267\u884C\u7684\u6D4B\u8BD5\u7ED3\u679C\u3002"],
    review: ["\u6A21\u62DF\u8BC1\u636E \xB7 \u590D\u6838\u6E05\u5355\uFF1A\u53D8\u66F4\u8303\u56F4\u3001\u56DE\u5F52\u8986\u76D6\u4E0E\u7ED3\u7B97\u884C\u4E3A\u3002", "\u6A21\u62DF\u8BC1\u636E \xB7 \u590D\u6838\u610F\u89C1\u4EC5\u4E3A\u6837\u4F8B\u6587\u672C\uFF0C\u672A\u7ECF\u72EC\u7ACB\u590D\u6838\u3002"],
    done: ["\u6A21\u62DF\u8BC1\u636E \xB7 \u4EC5\u5C55\u793A\u5B8C\u6210\u72B6\u6001\uFF0C\u672A\u6267\u884C\u4EFB\u4F55\u771F\u5B9E\u8FD0\u884C\u3002"]
  };
  const stages = keys.map((stage, index) => {
    let status = index < activeIndex ? "completed" : index === activeIndex ? "running" : "pending";
    if (selected === "completed") status = "completed";
    if (selected === "pending" || selected === "waiting") status = "pending";
    if (index === activeIndex && selected === "failed") status = "failed";
    if (index === activeIndex && selected === "review") status = "review";
    if (index === activeIndex && selected === "approval") status = "approval";
    const hasActivity = status !== "pending";
    return {
      stage,
      status,
      summary: hasActivity ? stage === "tests" && selected === "failed" ? "\u6A21\u62DF\u56DE\u5F52\u5931\u8D25\uFF1A\u6570\u91CF\u53D8\u5316\u540E\uFF0C\u8D2D\u7269\u8F66\u5C0F\u8BA1\u672A\u66F4\u65B0\u3002" : stage === "tests" && status === "completed" ? "\u6A21\u62DF\u6D4B\u8BD5\u9636\u6BB5\u5DF2\u5B8C\u6210\uFF0C\u6837\u4F8B\u7ED3\u679C\u4E0D\u4EE3\u8868\u771F\u5B9E\u6267\u884C\u7684\u6D4B\u8BD5\u7ED3\u679C\u3002" : stage === "review" && selected === "approval" ? "\u6A21\u62DF\u590D\u6838\u6B63\u7B49\u5F85\u5728\u6765\u6E90\u5E94\u7528\u4E2D\u6279\u51C6\u3002" : summaries[stage] : "",
      time: hasActivity ? `2026-10-09T11:${String(2 + index * 2).padStart(2, "0")}:18Z` : "",
      evidence: hasActivity ? stage === "tests" && status === "completed" ? evidence[stage].map((item) => item.includes("\u6B63\u5728\u8FDB\u884C\u4E2D") ? "\u6A21\u62DF\u8BC1\u636E \xB7 \u7ED3\u7B97\u6837\u4F8B\u5DF2\u5B8C\u6210\uFF0C\u4E0D\u4EE3\u8868\u771F\u5B9E\u6267\u884C\u7684\u6D4B\u8BD5\u7ED3\u679C\u3002" : item) : stage === "tests" && status === "failed" ? ["\u6A21\u62DF\u8BC1\u636E \xB7 \u56DE\u5F52\u6837\u4F8B\u5931\u8D25\uFF1A\u5C0F\u8BA1\u672A\u66F4\u65B0\u3002", "\u6A21\u62DF\u8BC1\u636E \xB7 \u4EC5\u5C55\u793A\u5931\u8D25\u72B6\u6001\uFF0C\u672A\u6267\u884C\u6D4B\u8BD5\u8FDB\u7A0B\u3002"] : evidence[stage] : [],
      origin: "\u6F14\u793A\u6570\u636E"
    };
  });
  return {
    mode: "demo",
    runId: `synthetic-cart-quantity-${selected}`,
    title: "\u4FEE\u590D\u8D2D\u7269\u8F66\u6570\u91CF\u66F4\u65B0\u95EE\u9898",
    status: selected === "completed" ? "completed" : selected === "failed" ? "failed" : selected === "pending" ? "pending" : selected === "waiting" ? "waiting" : selected === "approval" ? "approval" : selected === "review" ? "review" : "running",
    stage: selected === "waiting" ? "waiting" : activeStage,
    jev: selected === "waiting" ? null : { model: "fixture / synthetic", effectiveRoute: "plan_review", confidence: 0.84, probabilities: { execute: 0.11, plan_review: 0.84, clarify: 0.05 } },
    stages,
    updatedAt: selected === "stale" ? "2026-10-08T11:06:18Z" : `2026-10-09T11:${String(2 + activeIndex * 2).padStart(2, "0")}:18Z`,
    sourceNotice: "\u6F14\u793A \xB7 \u5168\u90E8\u4E3A\u6A21\u62DF\u6570\u636E\u3002\u672A\u4F7F\u7528\u51ED\u636E\u3001\u8C03\u7528\u6A21\u578B\u3001\u6267\u884C\u4EFB\u52A1\u6216\u66F4\u6539\u9879\u76EE\u3002",
    origin: "\u6F14\u793A\u6570\u636E",
    stale: selected === "stale"
  };
}

// client/ConnectedTeam.tsx
var import_react4 = require("react");

// client/TeamView.tsx
var import_react3 = require("react");

// client/team.css
var team_default = '/* Original control-surface design. Component scoped; never changes the host theme. */\n.tm-root{--tm-bg:#0d1117;--tm-panel:#121820;--tm-raised:#19212b;--tm-subtle:#0f151d;--tm-border:#28323e;--tm-line:#435365;--tm-text:#e6edf5;--tm-muted:#9aa9ba;--tm-soft:#8a9aab;--tm-accent:#69d4df;--tm-green:#91c8b0;--tm-green-bg:#142b28;--tm-indigo:#69d4df;--tm-indigo-bg:#183038;--tm-amber:#e8bd7a;--tm-amber-bg:#2b241b;--tm-red:#efa19b;--tm-red-bg:#302022;--tm-mono:ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace;container:team / inline-size;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;font-size:13px;line-height:1.55;color:var(--tm-text);color-scheme:dark;background:var(--tm-bg);width:100%;min-width:0;min-height:0;overflow:auto;isolation:isolate}\n.tm-root{box-sizing:border-box}.tm-root *{box-sizing:border-box}.tm-root h1,.tm-root h2,.tm-root h3,.tm-root h4,.tm-root p{margin:0}.tm-root button,.tm-root input,.tm-root select,.tm-root textarea{font:inherit;color:inherit}.tm-root button{cursor:pointer}.tm-root button:disabled{cursor:not-allowed;opacity:.5}.tm-root button:focus-visible,.tm-root input:focus-visible,.tm-root select:focus-visible,.tm-root textarea:focus-visible,.tm-root summary:focus-visible,.tm-root [tabindex]:focus-visible{outline:2px solid var(--tm-accent);outline-offset:3px}.tm-root button,.tm-root select,.tm-root input{-webkit-tap-highlight-color:transparent}.tm-root .tm-icon{flex:none;vertical-align:middle;width:16px;height:16px}.tm-root summary{cursor:pointer;list-style:none}.tm-root summary::-webkit-details-marker{display:none}.tm-root details>summary>.tm-icon:last-child{width:13px;transition:transform .15s}.tm-root details[open]>summary>.tm-icon:last-child{transform:rotate(90deg)}.tm-root [hidden]{display:none!important}.tm-shell{min-width:0;min-height:0;display:flex;flex-direction:column}.tm-header{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 20px;border-bottom:1px solid var(--tm-border);background:var(--tm-panel)}.tm-brand{display:flex;align-items:center;gap:10px;min-width:0}.tm-brand-mark{display:grid;place-items:center;width:32px;height:32px;color:var(--tm-accent);border:1px solid var(--tm-line);border-radius:7px;background:var(--tm-subtle)}.tm-brand-mark svg{width:19px!important;height:19px!important}.tm-wordmark{font-family:var(--tm-mono);font-size:10px;color:var(--tm-muted);letter-spacing:.2px}.tm-wordmark>span{color:var(--tm-soft)}.tm-brand h1{font-size:16px;line-height:1.45;font-weight:600;letter-spacing:.2px}.tm-header-actions{display:flex;align-items:center;gap:5px}.tm-button,.tm-icon-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:32px;border:1px solid var(--tm-border);border-radius:6px;background:var(--tm-raised);padding:6px 11px;font-size:12px;line-height:1.4;white-space:nowrap;transition:background .15s,border-color .15s}.tm-button:hover:not(:disabled),.tm-icon-button:hover:not(:disabled){background:#22303c;border-color:var(--tm-line)}.tm-icon-button{width:32px;padding:7px}.tm-button--quiet{background:transparent;border-color:transparent;color:var(--tm-muted)!important}.tm-button--primary{background:var(--tm-accent);border-color:var(--tm-accent);color:#0b2025!important;font-weight:600}.tm-button--primary:hover:not(:disabled){background:#94e3eb;border-color:#94e3eb}.tm-button--danger{border-color:#714640;color:var(--tm-red)!important;background:var(--tm-red-bg)}.tm-button--wide{width:100%;justify-content:flex-start}.tm-button--wide>.tm-icon:last-child{margin-left:auto}.tm-button.is-demo{color:var(--tm-amber)!important}.tm-demo-banner{display:flex;gap:9px;align-items:center;padding:8px 20px;background:var(--tm-amber-bg);border-bottom:1px solid #584532;color:var(--tm-amber);font-size:11px}.tm-demo-banner>span{font-family:var(--tm-mono);font-weight:600;flex:none;border:1px solid #655039;padding:1px 5px;border-radius:3px}.tm-demo-banner p{flex:1;line-height:1.6}.tm-demo-banner button{display:flex;gap:4px;align-items:center;border:0;background:transparent;padding:2px;color:var(--tm-amber);white-space:nowrap;font-size:11px}.tm-demo-banner button svg{width:13px}.tm-main{padding:18px 20px 10px;min-width:0}.tm-overview{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.tm-overview>div:first-child{min-width:0;flex:1}.tm-section-eyebrow{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:11px;color:var(--tm-muted)}.tm-session{display:inline-flex;align-items:center;gap:6px;font-size:11px;color:var(--tm-muted);font-weight:400}.tm-session i{width:5px;height:5px;background:var(--tm-soft);border-radius:50%}.tm-overview h2{font-size:20px;font-weight:550;line-height:1.55;letter-spacing:-.3px;margin-top:8px;overflow-wrap:anywhere}.tm-overview p{font-size:12px;color:var(--tm-muted);line-height:1.7;margin-top:5px;max-width:980px}.tm-run-state{display:flex;align-items:flex-end;flex-direction:column;gap:7px;flex:none;padding-top:3px}.tm-run-state>span:last-child{font-family:var(--tm-mono);font-size:11px;color:var(--tm-muted)}.tm-status{display:inline-flex;gap:5px;align-items:center;font-size:11px;font-weight:500;white-space:nowrap;color:var(--tm-muted)}.tm-status i{width:5px;height:5px;background:currentColor;border-radius:50%;flex:none}.tm-status .tm-icon{width:12px;height:12px}.tm-status--completed{color:var(--tm-green)}.tm-status--running,.tm-status--planning,.tm-status--reviewing{color:var(--tm-accent)}.tm-status--failed,.tm-status--blocked{color:var(--tm-red)}.tm-status--unverified,.tm-status--completion_unverified{color:var(--tm-amber)}.tm-summary-strip{display:flex;align-items:center;gap:22px;margin:14px 0 16px;font-size:12px;color:var(--tm-muted)}.tm-summary-strip>div{display:flex;align-items:center;gap:7px;min-width:0}.tm-summary-strip .tm-icon{width:14px;height:14px;color:var(--tm-soft)}.tm-summary-strip strong{font:12px var(--tm-mono);color:var(--tm-text)}.tm-summary-strip small{font:11px var(--tm-mono);color:var(--tm-soft)}\n/* Control plane: always-visible connection state, progressively disclosed evidence. */\n.tm-jev-panel{border:1px solid var(--tm-border);border-radius:7px;background:var(--tm-panel);margin-bottom:14px;min-width:0;overflow:hidden}.tm-jev-panel>header{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 13px}.tm-jev-panel h3{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600}.tm-jev-panel h3>.tm-icon{color:var(--tm-accent)}.tm-jev-connection{font-size:11px;color:var(--tm-muted);text-align:right}.tm-jev-connection.is-fixture,.tm-jev-connection.is-blocked{color:var(--tm-amber)}.tm-jev-connection.is-ready{color:var(--tm-green)}.tm-control-details>summary{display:flex;justify-content:space-between;gap:12px;padding:7px 13px;background:var(--tm-subtle);border-top:1px solid var(--tm-border);font-size:11px;color:var(--tm-muted)}.tm-control-details>summary>span{display:flex;align-items:center;gap:7px}.tm-control-details>summary .tm-icon{width:13px;height:13px}.tm-control-details[open]>summary>span:last-child>.tm-icon{transform:rotate(90deg)}.tm-jev-description,.tm-jev-warning,.tm-jev-metrics,.tm-jev-next,.tm-jev-decisions,.tm-jev-inspect,.tm-gates{margin:13px!important}.tm-jev-description{font-size:12px;color:var(--tm-muted);line-height:1.8}.tm-jev-warning{display:flex;gap:8px;padding:10px;background:var(--tm-amber-bg);border:1px solid #59452d;border-radius:5px;color:var(--tm-amber);font-size:12px}.tm-jev-warning svg{margin-top:2px}.tm-jev-metrics{display:grid;grid-template-columns:1.1fr 1fr 1.2fr;gap:12px;border-block:1px solid var(--tm-border);padding:12px 0}.tm-jev-metrics>div{display:flex;flex-direction:column;gap:4px;min-width:0}.tm-jev-metrics>div>span{font-size:11px;color:var(--tm-muted)}.tm-jev-metrics strong{font:12px var(--tm-mono);overflow-wrap:anywhere}.tm-jev-metrics small{font-size:10px;display:block;color:var(--tm-muted);margin-top:5px}.tm-jev-next{display:flex;flex-direction:column;gap:5px;font-size:12px}.tm-jev-next strong{font-weight:500;color:var(--tm-accent)}.tm-jev-next p{color:var(--tm-muted);overflow-wrap:anywhere}.tm-jev-decisions>summary{display:flex;justify-content:space-between;align-items:center;font-size:12px}.tm-jev-decisions ol{list-style:none;padding:0;max-height:250px;overflow:auto;scrollbar-width:thin}.tm-jev-decisions li{border-left:1px solid var(--tm-line);padding:0 0 13px 12px;margin:0 0 8px}.tm-jev-decisions li>div{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}.tm-jev-decisions li strong{font:12px var(--tm-mono)}.tm-jev-decisions li span{font-size:11px;color:var(--tm-muted)}.tm-jev-decisions li p{font-size:12px;color:var(--tm-muted);margin-top:5px;overflow-wrap:anywhere}.tm-jev-inspect{display:flex;align-items:center;gap:6px;border:0;background:transparent;padding:0;color:var(--tm-accent)!important;font-size:12px!important}.tm-gates{padding:12px;border:1px solid var(--tm-border);border-radius:5px;background:var(--tm-subtle)}.tm-gates-heading{display:flex;justify-content:space-between;align-items:center;gap:10px}.tm-gates-heading h4{font-size:12px;font-weight:500}.tm-gates-heading>span{font-size:11px;color:var(--tm-amber)}.tm-gates .is-passed{color:var(--tm-green)}.tm-gates .is-failed{color:var(--tm-red)}.tm-gates .is-pending{color:var(--tm-muted)}.tm-gates ul{list-style:none;margin:12px 0;padding:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.tm-gates li{display:flex;align-items:center;gap:6px;font-size:11px;flex-wrap:wrap}.tm-gates li .tm-icon{width:13px;height:13px}.tm-gates li small{font-size:10px;margin-left:auto}.tm-gates>p{font-size:11px;color:var(--tm-muted);line-height:1.8;overflow-wrap:anywhere}\n/* Workspace and original, non-editable SVG routing schematic. */\n.tm-workspace{display:grid;grid-template-columns:minmax(0,1fr);align-items:start;border:1px solid var(--tm-border);border-radius:7px;overflow:hidden;background:var(--tm-panel)}.tm-graph-panel{min-width:0}.tm-panel-header{display:flex;justify-content:space-between;align-items:center;gap:8px;border-bottom:1px solid var(--tm-border);padding:0 12px;min-height:45px}.tm-tabs{display:flex;align-items:stretch;gap:16px;align-self:stretch}.tm-tabs button{display:flex;align-items:center;gap:7px;position:relative;border:0;padding:11px 1px;background:none;color:var(--tm-muted);font-size:12px;white-space:nowrap}.tm-tabs button[aria-selected=true]{color:var(--tm-text)}.tm-tabs button[aria-selected=true]:after{content:"";position:absolute;bottom:-1px;left:0;right:0;height:2px;background:var(--tm-accent)}.tm-tabs button>span{font:10px var(--tm-mono);border:1px solid var(--tm-border);padding:0 4px;border-radius:3px;color:var(--tm-muted)}.tm-config-trigger{padding:6px}.tm-graph-caption{display:flex;align-items:center;gap:9px;padding:8px 13px;border-bottom:1px solid var(--tm-border);font-size:11px;color:var(--tm-muted)}.tm-graph-caption>span{font-family:var(--tm-mono);color:var(--tm-soft);font-size:10px;flex:none}.tm-topology,.tm-graph-scroll{background-color:#0d141c;background-image:radial-gradient(#2a3948 .75px,transparent .75px);background-size:18px 18px}.tm-topology-map{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:94px 94px 94px;gap:36px 24px;padding:24px;position:relative}.tm-topology-wires{position:absolute;inset:24px;width:calc(100% - 48px);height:calc(100% - 48px);pointer-events:none;overflow:visible;color:var(--tm-line)}.tm-topology-wires path{fill:none;stroke:currentColor;stroke-width:1.3;stroke-dasharray:4 4;vector-effect:non-scaling-stroke}.tm-topology-wires circle{fill:var(--tm-bg);stroke:currentColor;stroke-width:1.5}.tm-topology-wires--narrow{display:none}.tm-controller-node{grid-column:2;grid-row:1;display:flex;align-items:center;gap:10px;align-self:center;position:relative;min-width:0;border:1px solid #3d6570;border-radius:6px;background:#14252d;padding:12px;color:var(--tm-accent)}.tm-controller-symbol{display:grid;place-items:center;width:28px;height:28px;border:1px solid #325562;border-radius:5px;flex:none}.tm-controller-node>div{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}.tm-controller-node strong{font:600 14px var(--tm-mono)}.tm-controller-node>div>span{font-size:10px;color:#b1c9d3}.tm-controller-node>.tm-icon{width:12px;height:12px;color:#6c99a4}.tm-role-card{display:flex;flex-direction:column;justify-content:space-between;gap:5px;position:relative;min-width:0;text-align:left;padding:10px 11px;border:1px solid var(--tm-line);border-radius:6px;background:var(--tm-raised);transition:border-color .15s,background .15s}.tm-role-card:before,.tm-role-card:after{content:"";position:absolute;width:5px;height:5px;border:1px solid #65778b;background:var(--tm-bg);border-radius:50%;left:calc(50% - 3px)}.tm-role-card:before{top:-4px}.tm-role-card:after{bottom:-4px}.tm-role-card:hover{background:#202c38;border-color:#6b7d8f}.tm-role-card.is-selected{border-color:var(--tm-accent);background:#182b35;box-shadow:0 0 0 1px var(--tm-accent)}.tm-role-card.is-active:not(.is-selected){border-color:#47858f}.tm-role-card--planner{grid-column:1;grid-row:1}.tm-role-card--reviewer{grid-column:3;grid-row:1}.tm-role-card--coordinator{grid-column:2;grid-row:2}.tm-role-card--researcher{grid-column:1;grid-row:3}.tm-role-card--explorer{grid-column:2;grid-row:3}.tm-role-card--worker{grid-column:3;grid-row:3}.tm-role-top{display:flex;align-items:center;justify-content:space-between;gap:6px;position:absolute;top:11px;left:10px;right:10px}.tm-role-icon{display:inline-grid;place-items:center;width:25px;height:25px;flex:none;border:1px solid var(--tm-border);border-radius:5px;background:#1b2732;color:#b4c6d6}.tm-role-icon .tm-icon{width:15px;height:15px}.tm-role-mode{font-size:9px;color:var(--tm-soft);display:none}.tm-role-title{display:flex;align-items:center;gap:7px;padding-left:34px;height:25px;min-width:0}.tm-role-title>strong{font-size:12px;font-weight:550;white-space:nowrap}.tm-role-title>span{font:8px var(--tm-mono);color:var(--tm-soft);overflow:hidden;text-overflow:ellipsis;display:none}.tm-role-model{font-family:var(--tm-mono);font-size:10px;color:var(--tm-muted);overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.tm-role-bottom{display:flex;align-items:center;justify-content:space-between;gap:5px}.tm-role-bottom>span:last-child{display:flex;align-items:center;gap:2px;font-size:9px;color:var(--tm-soft)}.tm-role-bottom>span:last-child>.tm-icon{width:11px;height:11px}.tm-map-footer{display:flex;flex-wrap:wrap;align-items:center;gap:8px 15px;border-top:1px solid var(--tm-border);background:var(--tm-panel);padding:9px 13px;font-size:10px;color:var(--tm-muted)}.tm-map-footer>span{display:flex;align-items:center;gap:6px}.tm-map-footer i{display:inline-block;width:16px;border-top:1px solid var(--tm-line)}.tm-map-footer .tm-dashed-line{border-top-style:dashed}.tm-map-footer .tm-live-dot{width:4px;height:4px;border:0;border-radius:50%;background:var(--tm-muted)}.tm-map-footer .tm-feedback-line{border-color:var(--tm-amber);border-top-style:dashed}.tm-map-footer .tm-retry-line{border-color:var(--tm-red);border-top-style:dashed}\n/* Recorded DAG: fixed readable node sizes, scroll/zoom, no invented activity. */\n.tm-graph-tools{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 13px;font-size:11px;color:var(--tm-muted);border-bottom:1px solid var(--tm-border)}.tm-graph-tools label{display:flex;align-items:center;gap:7px}.tm-graph-tools select{border:1px solid var(--tm-border);background:var(--tm-raised);border-radius:4px;padding:3px;font-size:11px}.tm-graph-scroll{overflow:auto;max-height:480px;min-height:350px;scrollbar-width:thin;scrollbar-color:var(--tm-line) transparent}.tm-task-canvas{position:relative;transform-origin:top left}.tm-task-wires{position:absolute;inset:0;pointer-events:none;color:#78929f;overflow:visible}.tm-edge>path{fill:none;stroke:currentColor;stroke-width:1.3}.tm-edge--feedback{color:var(--tm-amber)}.tm-edge--retry{color:var(--tm-red)}.tm-edge--feedback>path,.tm-edge--retry>path{stroke-dasharray:5 4}.tm-task-node{position:absolute;width:192px;height:122px;display:flex;flex-direction:column;justify-content:space-between;gap:7px;border:1px solid var(--tm-line);border-radius:6px;padding:12px;background:var(--tm-raised);text-align:left}.tm-task-node:hover{border-color:#7b91a2;background:#202c38}.tm-task-node.is-selected{border-color:var(--tm-accent);box-shadow:0 0 0 1px var(--tm-accent);background:#182b35}.tm-task-node--running{border-color:#4c8994}.tm-task-node--failed,.tm-task-node--blocked{border-left:3px solid var(--tm-red)}.tm-task-role{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--tm-muted)}.tm-task-role small{margin-left:auto;font:10px var(--tm-mono);color:var(--tm-soft)}.tm-task-node>strong{font-size:12px;line-height:1.6;font-weight:500;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.tm-task-foot{display:flex;justify-content:space-between;align-items:center}.tm-task-foot>span:last-child{display:flex;gap:5px;color:var(--tm-soft)}.tm-task-foot>.tm-icon,.tm-task-foot>span>.tm-icon{width:12px;height:12px}.tm-empty-graph{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:320px;padding:30px;text-align:center;background:var(--tm-subtle)}.tm-empty-icon{display:grid;place-items:center;width:40px;height:40px;border:1px solid var(--tm-line);border-radius:8px;color:var(--tm-soft);margin-bottom:15px}.tm-empty-graph strong{font-size:14px;font-weight:500}.tm-empty-graph p{font-size:12px;color:var(--tm-muted);line-height:1.8;margin-top:8px;max-width:310px}\n/* Contextual inspector. */\n.tm-inspector{min-width:0;padding:17px;background:var(--tm-panel);border-top:1px solid var(--tm-border)}.tm-inspector>.tm-section-eyebrow{margin-bottom:15px;font-size:11px}.tm-inspector>.tm-section-eyebrow>span:last-child{font:10px var(--tm-mono);color:var(--tm-soft)}.tm-inspector-heading{display:flex;align-items:flex-start;gap:10px}.tm-inspector-heading>.tm-role-icon{width:33px;height:33px}.tm-inspector-heading h3{font-size:15px;font-weight:550;line-height:1.6;overflow-wrap:anywhere}.tm-role-description{font-size:12px;line-height:1.8;color:var(--tm-muted);margin-top:12px!important}.tm-facts{margin:16px 0}.tm-facts>div{display:grid;grid-template-columns:70px minmax(0,1fr);gap:10px;font-size:11px;padding:5px 0}.tm-facts dt{color:var(--tm-muted)}.tm-facts dd{margin:0;overflow-wrap:anywhere;font-family:var(--tm-mono);font-size:11px;color:#c8d5e1}.tm-inspector h4{font-size:12px;font-weight:500}.tm-mini-heading{display:flex;justify-content:space-between;align-items:center;gap:8px}.tm-mini-heading>span{font:10px var(--tm-mono);color:var(--tm-muted)}.tm-evidence,.tm-role-work,.tm-relations{border-top:1px solid var(--tm-border);margin-top:17px;padding-top:14px}.tm-evidence pre,.tm-node-error pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:12px 0 0;padding:12px;border:1px solid var(--tm-border);border-radius:5px;background:var(--tm-bg);font:11px/1.9 var(--tm-mono);max-height:320px;overflow:auto;scrollbar-width:thin;color:#c2d0df}.tm-node-error{margin-top:12px;color:var(--tm-red);font-size:12px}.tm-node-error pre{color:var(--tm-red);background:var(--tm-red-bg)}.tm-inline-empty{display:flex;align-items:center;justify-content:center;gap:7px;padding:20px 8px;font-size:12px;color:var(--tm-soft)}.tm-role-work>button,.tm-relations>button{display:flex;align-items:center;gap:8px;text-align:left;width:100%;border:0;border-bottom:1px solid var(--tm-border);background:none;padding:11px 0;font-size:11px}.tm-role-work>button>span:first-child{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.tm-role-work>button strong{font-weight:500;overflow-wrap:anywhere}.tm-role-work>button small{font:10px var(--tm-mono);color:var(--tm-soft)}.tm-role-work>button>.tm-icon,.tm-relations>button>.tm-icon{width:12px;height:12px;color:var(--tm-soft)}.tm-role-work>button:hover,.tm-relations>button:hover{color:var(--tm-accent)}.tm-relation-tag{font-size:10px;flex:none;color:var(--tm-muted);border:1px solid var(--tm-border);padding:1px 4px;border-radius:3px}.tm-relation-tag--retry,.tm-relation-tag--feedback{color:var(--tm-amber)}.tm-relations>button>span:nth-child(2){flex:1;overflow-wrap:anywhere}.tm-source{margin-top:16px;font-size:11px;color:var(--tm-muted)}.tm-source>summary{display:flex;align-items:center;justify-content:space-between}.tm-source dl{margin:12px 0 0;font:10px/1.7 var(--tm-mono)}.tm-source dd{margin:3px 0 8px;overflow-wrap:anywhere;color:var(--tm-text)}.tm-inspector-note{display:flex;align-items:center;gap:6px;margin-top:20px;font-size:10px;color:var(--tm-soft)}.tm-inspector-note .tm-icon{width:12px;height:12px}\n/* Activity is a trace, not a feed of decorative cards. */\n.tm-activity{margin-top:14px;border:1px solid var(--tm-border);border-radius:7px;overflow:hidden;background:var(--tm-panel)}.tm-activity-toggle{display:flex;align-items:center;gap:9px;padding:11px 13px;width:100%;background:transparent;border:0;text-align:left}.tm-activity-toggle>strong{font-size:12px;font-weight:550}.tm-activity-toggle>span{margin-left:auto;font:10px var(--tm-mono);color:var(--tm-muted)}.tm-activity-toggle>.tm-icon:last-child{width:12px;height:12px;transform:rotate(90deg)}.tm-activity-toggle[aria-expanded=false]>.tm-icon:last-child{transform:none}.tm-event-list{max-height:232px;overflow:auto;border-top:1px solid var(--tm-border);scrollbar-width:thin}.tm-event{display:grid;grid-template-columns:22px 65px minmax(0,1fr) 64px;align-items:start;gap:8px;width:100%;padding:10px 13px;text-align:left;border:0;border-bottom:1px solid #222c37;background:none;font-size:11px!important;line-height:1.75}.tm-event:disabled{opacity:1;cursor:default}.tm-event:hover:not(:disabled){background:var(--tm-raised)}.tm-event-icon{display:grid;place-items:center;width:22px;height:22px;color:var(--tm-muted)}.tm-event--feedback .tm-event-icon{color:var(--tm-amber)}.tm-event>strong{font-size:11px;font-weight:500;color:#c4d0dc}.tm-event>span:nth-last-child(2){color:var(--tm-muted);overflow-wrap:anywhere}.tm-event time{font:10px/1.9 var(--tm-mono);color:var(--tm-soft);text-align:right}.tm-event-bound{padding:8px 13px;color:var(--tm-soft);font-size:10px}.tm-running-bar,.tm-command-guide{display:flex;align-items:center;gap:12px;border:1px solid var(--tm-border);border-radius:7px;padding:14px;margin-top:14px;background:var(--tm-panel)}.tm-running-bar>div,.tm-command-guide>div{min-width:0;flex:1}.tm-running-bar strong,.tm-command-guide h3{font-size:13px;font-weight:500}.tm-running-bar p,.tm-command-guide p{font-size:11px;color:var(--tm-muted);line-height:1.8;margin-top:5px}.tm-running-indicator{width:6px;height:6px;border-radius:50%;background:var(--tm-accent);flex:none}.tm-command-icon{align-self:flex-start;color:var(--tm-muted);padding-top:3px}.tm-command-guide code{display:block;font:11px/1.8 var(--tm-mono);color:var(--tm-accent);white-space:normal;overflow-wrap:anywhere;margin-top:8px}.tm-footer{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:13px 0 2px;font-size:10px;color:var(--tm-soft)}.tm-footer>span{display:flex;align-items:center;gap:5px}.tm-footer>span:last-child{font-family:var(--tm-mono);font-size:9px}.tm-footer .tm-icon{width:11px;height:11px}.tm-footer i{height:9px;border-left:1px solid var(--tm-border);margin:0 4px}.tm-notice{display:flex;align-items:flex-start;gap:8px;border:1px solid var(--tm-border);border-radius:5px;background:var(--tm-raised);padding:11px 12px;font-size:12px;line-height:1.8;overflow-wrap:anywhere;margin:12px 0!important}.tm-notice>.tm-icon{margin-top:3px}.tm-notice--error{color:var(--tm-red);background:var(--tm-red-bg);border-color:#63423f}.tm-notice--warning{color:var(--tm-amber);background:var(--tm-amber-bg);border-color:#5e4d37}.tm-start-hint{font-size:11px!important;color:var(--tm-amber)!important;line-height:1.8;margin-top:10px!important}\n/* One-time native settings: role list + one editor, keys stay write-only. */\n.tm-setup-root{padding:20px}.tm-settings{max-width:1020px;margin:0 auto;min-width:0}.tm-settings>header{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding-bottom:18px;border-bottom:1px solid var(--tm-border)}.tm-settings>header .tm-section-eyebrow{font-size:11px;color:var(--tm-muted);display:block;margin-bottom:7px}.tm-settings h3{font-size:19px;font-weight:550;letter-spacing:-.2px}.tm-settings>header p{font-size:12px;color:var(--tm-muted);line-height:1.8;max-width:700px;margin-top:7px}.tm-key-config{padding:15px;border:1px solid var(--tm-border);border-radius:7px;background:var(--tm-panel);margin:20px 0}.tm-key-config>div{display:flex;align-items:center;justify-content:space-between;gap:10px}.tm-key-config h4{font-size:13px;font-weight:550}.tm-key-config>div>span{font-size:11px;color:var(--tm-green)}.tm-key-config p{font-size:12px;color:var(--tm-muted);line-height:1.8;margin-top:7px}.tm-key-config label{display:flex;flex-direction:column;gap:7px;margin-top:12px;font-size:11px;color:var(--tm-muted)}.tm-key-config input,.tm-model-config input,.tm-model-config select,.tm-limits input{width:100%;min-width:0;min-height:36px;border:1px solid var(--tm-line);border-radius:5px;background:var(--tm-bg);color:var(--tm-text);padding:8px 10px;font-size:12px}.tm-key-config input::placeholder,.tm-model-config input::placeholder{color:var(--tm-soft)}.tm-config-lock{display:flex;align-items:center;gap:7px;font-size:11px!important}.tm-key-storage{margin-top:12px}.tm-key-storage>summary{display:flex;align-items:center;justify-content:space-between;font-size:11px;color:var(--tm-muted)}.tm-key-storage>p{font-size:11px}.tm-settings-section-title{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:11px}.tm-settings-section-title h4{font-size:13px;font-weight:550}.tm-settings-section-title>span{font:11px var(--tm-mono);color:var(--tm-muted)}.tm-role-settings-layout{display:grid;grid-template-columns:240px minmax(0,1fr);border:1px solid var(--tm-border);border-radius:7px;overflow:hidden;background:var(--tm-panel)}.tm-role-selector{border-right:1px solid var(--tm-border);background:var(--tm-subtle)}.tm-role-selector>button{width:100%;display:flex;align-items:center;gap:10px;padding:11px 12px;border:0;border-bottom:1px solid var(--tm-border);background:none;text-align:left;min-width:0}.tm-role-selector>button:last-child{border-bottom:0}.tm-role-selector>button[aria-pressed=true]{background:#1a2c36;box-shadow:inset 2px 0 var(--tm-accent)}.tm-role-selector>button:hover{background:#1b2631}.tm-role-selector>button>span:first-of-type{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}.tm-role-selector strong{font-size:12px;font-weight:500}.tm-role-selector small{font:10px/1.6 var(--tm-mono);color:var(--tm-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tm-role-selector>button>.tm-icon{color:var(--tm-muted);width:15px;height:15px}.tm-role-selector>button>.tm-icon:last-child{width:12px;height:12px}.tm-role-selector .tm-config-ready{color:var(--tm-green)}.tm-role-selector .tm-config-missing{color:var(--tm-amber)}.tm-role-selector>button>span:last-of-type>.tm-icon{width:12px;height:12px}.tm-model-grid{min-width:0;padding:20px}.tm-model-config{border:0;padding:0;min-width:0;margin:0}.tm-model-config legend{display:flex;align-items:center;gap:8px;padding:0;margin-bottom:18px;max-width:100%}.tm-model-config legend strong{font-size:14px;font-weight:550}.tm-model-config legend>span:last-child{font-size:11px;color:var(--tm-muted)}.tm-config-selects{display:flex;flex-direction:column;gap:14px}.tm-model-config label,.tm-limits>label{display:flex;flex-direction:column;gap:7px;min-width:0;color:var(--tm-muted);font-size:12px}.tm-model-config select{font-size:12px}.tm-model-config select:disabled,.tm-model-config input:disabled{opacity:.55}.tm-advanced-model{margin-top:20px;border-top:1px solid var(--tm-border);padding-top:13px}.tm-advanced-model>summary{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--tm-muted)}.tm-advanced-model>div{display:flex;flex-direction:column;gap:13px;padding-top:13px}.tm-config-switches{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-top:20px;padding:16px 0;border-block:1px solid var(--tm-border)}.tm-config-switches>label{display:flex;align-items:flex-start;gap:9px;cursor:pointer}.tm-config-switches strong{font-size:12px;font-weight:500}.tm-config-switches small{display:block;font-size:11px;color:var(--tm-muted);margin-top:4px}.tm-root input[type=checkbox]{width:15px;height:15px;accent-color:var(--tm-accent);flex:none;margin:3px 0 0}.tm-advanced-settings{margin-top:18px}.tm-advanced-settings>summary{display:flex;justify-content:space-between;align-items:center;font-size:12px}.tm-limits-header{display:flex;justify-content:space-between;gap:10px;align-items:center;margin:18px 0 12px}.tm-limits-header h4{font-size:12px;font-weight:500}.tm-limits-header span{font-size:11px;color:var(--tm-muted)}.tm-limits{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.tm-limits>label>span{display:flex;align-items:center;gap:8px}.tm-limits input{font-family:var(--tm-mono)}.tm-limits small{font-size:11px;flex:none}.tm-disclosure{margin-top:20px;border:1px solid #594b37;border-radius:7px;padding:16px;background:#1c1d1c}.tm-disclosure h4{font-size:13px;font-weight:550;color:var(--tm-amber)}.tm-disclosure p{font-size:12px;line-height:1.85;color:var(--tm-muted);margin-top:9px;overflow-wrap:anywhere}.tm-disclosure .tm-endpoint{font-family:var(--tm-mono);font-size:11px;color:#c3b499}.tm-disclosure>label{display:flex;align-items:flex-start;gap:9px;font-size:12px;line-height:1.8;cursor:pointer;margin-top:14px;color:var(--tm-text)}.tm-setup-actions{position:sticky;bottom:0;display:flex;justify-content:flex-end;gap:10px;margin-top:16px;padding:14px 0;background:var(--tm-bg);border-top:1px solid var(--tm-border);z-index:2}.dsh-team-tabs{display:flex;gap:4px;padding:5px;background:#121820;border-bottom:1px solid #28323e}.dsh-team-tabs button{font:12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:7px 12px;border:0;border-radius:5px;background:transparent;color:#9aa9ba;cursor:pointer}.dsh-team-tabs button[aria-pressed=true]{background:#1a2c36;color:#69d4df}.dsh-team-tabs button:focus-visible{outline:2px solid #69d4df;outline-offset:2px}\n@container team (min-width:900px){.tm-workspace{grid-template-columns:minmax(0,1fr) 290px}.tm-inspector{height:100%;border-top:0;border-left:1px solid var(--tm-border);max-height:650px;overflow:auto;scrollbar-width:thin}.tm-role-title>span{display:block}.tm-topology-map{grid-template-rows:106px 106px 106px;gap:38px 32px;padding:28px}.tm-topology-wires{inset:28px;width:calc(100% - 56px);height:calc(100% - 56px)}.tm-role-card{padding:12px}.tm-role-top{top:13px;left:12px}.tm-role-title{padding-left:33px}.tm-role-title strong{font-size:13px}.tm-role-model{font-size:11px}.tm-role-bottom>span:last-child{font-size:10px}}\n@container team (min-width:1200px){.tm-main{padding:20px 24px 12px}.tm-header{padding-inline:24px}.tm-workspace{grid-template-columns:minmax(0,1fr) 310px}.tm-topology-map{column-gap:42px}.tm-graph-scroll{min-height:426px}}\n@container team (max-width:650px){.tm-header{padding:12px 14px}.tm-main{padding:13px 12px 8px}.tm-overview{flex-direction:column;gap:9px}.tm-overview h2{font-size:17px;margin-top:6px}.tm-overview p{font-size:12px}.tm-run-state{flex-direction:row;justify-content:space-between;align-items:center;width:100%;padding:0}.tm-summary-strip{justify-content:space-between;gap:8px;margin:12px 0}.tm-summary-strip>div{gap:5px;font-size:11px}.tm-summary-strip .tm-icon{display:none}.tm-summary-strip strong{font-size:12px}.tm-summary-strip small{font-size:10px}.tm-demo-banner{padding:8px 14px;align-items:flex-start}.tm-demo-banner p{font-size:10px}.tm-demo-banner button{font-size:10px}.tm-demo-banner button>.tm-icon{display:none}.tm-jev-panel>header{padding:9px 11px;gap:5px}.tm-jev-panel h3{font-size:12px}.tm-jev-connection{font-size:10px}.tm-control-details>summary{padding:7px 11px;font-size:10px}.tm-control-details>summary>span:first-child>.tm-icon{display:none}.tm-control-details>summary>span{gap:4px}.tm-jev-metrics{gap:9px}.tm-jev-metrics strong{font-size:11px}.tm-gates ul{grid-template-columns:repeat(2,minmax(0,1fr))}.tm-config-trigger>span{display:none}.tm-tabs{gap:14px}.tm-panel-header{padding:0 10px}.tm-graph-caption{padding:7px 11px;font-size:10px}.tm-graph-caption>span{display:none}.tm-topology-map{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:64px 94px 94px 94px;gap:28px 30px;padding:20px 18px}.tm-controller-node{grid-column:1 / -1;grid-row:1;width:184px;justify-self:center;padding:9px 11px}.tm-topology-wires--wide{display:none}.tm-topology-wires--narrow{display:block;inset:20px 18px;width:calc(100% - 36px);height:calc(100% - 40px)}.tm-role-card--planner{grid-column:1;grid-row:2}.tm-role-card--coordinator{grid-column:2;grid-row:2}.tm-role-card--researcher{grid-column:1;grid-row:3}.tm-role-card--explorer{grid-column:2;grid-row:3}.tm-role-card--worker{grid-column:1;grid-row:4}.tm-role-card--reviewer{grid-column:2;grid-row:4}.tm-role-card{padding:9px}.tm-role-top{top:10px;left:9px}.tm-role-title{padding-left:31px}.tm-role-bottom>span:last-child{font-size:9px}.tm-role-bottom .tm-status{font-size:10px}.tm-map-footer{font-size:9px;gap:6px 10px;padding:8px 11px}.tm-inspector{padding:15px}.tm-activity-toggle{padding:10px 11px}.tm-activity-toggle>span{font-size:9px}.tm-event{grid-template-columns:18px minmax(0,1fr) 60px;gap:3px 7px;padding:10px 11px}.tm-event-icon{grid-row:1 / 3;width:18px}.tm-event>strong{grid-column:2;grid-row:1}.tm-event>span:nth-last-child(2){grid-column:2 / 4;grid-row:2}.tm-event time{grid-column:3;grid-row:1}.tm-command-guide,.tm-running-bar{flex-wrap:wrap;gap:9px;padding:12px}.tm-command-guide>.tm-button,.tm-running-bar>.tm-button{margin-left:25px}.tm-footer{align-items:flex-start;font-size:9px}.tm-footer>span:last-child{display:none}.tm-setup-root{padding:16px 13px}.tm-settings h3{font-size:17px}.tm-settings>header p{font-size:12px}.tm-key-config{padding:13px;margin:16px 0}.tm-key-config>div{flex-wrap:wrap;gap:5px}.tm-key-config>div>span{font-size:10px}.tm-role-settings-layout{grid-template-columns:1fr}.tm-role-selector{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-right:0;border-bottom:1px solid var(--tm-border)}.tm-role-selector>button{gap:7px;padding:9px;min-height:57px;border-right:1px solid var(--tm-border)}.tm-role-selector>button:nth-last-child(-n+2){border-bottom:0}.tm-role-selector>button:nth-child(even){border-right:0}.tm-role-selector>button>.tm-icon:last-child{display:none}.tm-role-selector>button[aria-pressed=true]{box-shadow:inset 0 -2px var(--tm-accent)}.tm-role-selector small{font-size:9px}.tm-role-selector strong{font-size:12px}.tm-role-selector .tm-config-ready,.tm-role-selector .tm-config-missing{display:none}.tm-model-grid{padding:17px 14px}.tm-config-switches{flex-direction:column;gap:15px}.tm-limits{grid-template-columns:repeat(2,minmax(0,1fr))}.tm-limits-header{align-items:flex-start;flex-direction:column;gap:4px}.tm-disclosure{padding:13px}.tm-setup-actions>.tm-button{flex:1}.tm-settings>header{gap:10px}}\n@container team (max-width:340px){.tm-header{padding-inline:10px}.tm-main{padding-inline:8px}.tm-topology-map{padding-inline:11px;column-gap:17px}.tm-topology-wires--narrow{inset-inline:11px;width:calc(100% - 22px)}.tm-role-card{padding:8px}.tm-role-title>strong{font-size:11px}.tm-role-icon{width:23px;height:23px}.tm-role-top{left:8px}.tm-role-title{padding-left:28px}.tm-role-bottom>span:last-child{display:none}.tm-jev-connection{font-size:9px}.tm-controller-node{width:170px}.tm-session{font-size:10px}.tm-tabs{gap:10px}.tm-tabs button{font-size:11px}}\n@keyframes tm-spin{to{transform:rotate(360deg)}}.tm-root .is-spinning{animation:tm-spin 1s linear infinite}@media(prefers-reduced-motion:reduce){.tm-root *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}\n.tm-fit-button{border:1px solid var(--tm-border);border-radius:4px;background:var(--tm-raised);padding:3px 6px;font-size:11px!important;color:var(--tm-muted)!important}.tm-fit-button:hover{border-color:var(--tm-accent);color:var(--tm-accent)!important}.tm-task-graph--vertical .tm-task-node{width:160px;height:108px;padding:10px}.tm-task-graph--vertical .tm-task-node>strong{font-size:11px}.tm-task-graph--vertical .tm-task-role{font-size:10px}.tm-task-graph--vertical .tm-task-foot .tm-status{font-size:10px}\n.tm-control-details>summary{align-items:center;min-height:43px;background:var(--tm-panel);border:0;gap:10px;padding:10px 13px}.tm-control-details>summary .tm-control-title{font-size:12px;font-weight:550;color:var(--tm-text);margin-right:auto;white-space:nowrap}.tm-control-details>summary .tm-control-title>.tm-icon{display:block;width:15px;height:15px;color:var(--tm-accent)}.tm-control-details>summary>.tm-jev-connection{font-size:11px}.tm-control-details>summary>.tm-icon:last-child{width:12px;height:12px;color:var(--tm-muted)}.tm-control-details[open]>summary{border-bottom:1px solid var(--tm-border)}.tm-controller-node{text-align:left;cursor:pointer}.tm-controller-node:hover{background:#1c3440;border-color:var(--tm-accent)}.tm-controller-node.is-selected{border-color:var(--tm-accent);box-shadow:0 0 0 1px var(--tm-accent)}.tm-run-description{margin-top:4px}.tm-run-description>summary{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--tm-muted)}.tm-run-description>summary>.tm-icon{width:11px;height:11px}.tm-run-description p{padding:8px 0}.tm-run-description[open]{margin-bottom:4px}\n@container team (max-width:650px){.tm-main{padding-top:11px}.tm-overview{gap:6px}.tm-overview h2{font-size:16px;margin-top:4px}.tm-summary-strip{margin:10px 0}.tm-control-details>summary{min-height:40px;padding:8px 10px;gap:7px}.tm-control-details>summary>.tm-jev-connection{font-size:10px}.tm-control-details>summary .tm-control-title{font-size:12px}.tm-demo-banner{align-items:center;padding:7px 12px}.tm-demo-banner>span{font-size:10px}.tm-jev-panel{margin-bottom:12px}.tm-overview .tm-section-eyebrow{font-size:10px}.tm-run-description>summary{font-size:10px}}\n\n.tm-graph-controls{display:flex;align-items:center;gap:9px}\n.tm-inspector-wrap{min-width:0;height:100%;scroll-margin:12px}.tm-graph-context{font-family:inherit!important;font-size:11px!important;color:var(--tm-muted)!important;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;flex:1!important;min-width:0}.tm-inspect-jump,.tm-inspector-back{display:flex;align-items:center;gap:5px;border:0;background:transparent;color:var(--tm-accent)!important;font-size:11px!important;padding:1px 0;white-space:nowrap}.tm-inspect-jump .tm-icon{width:12px;height:12px;transform:rotate(90deg)}.tm-inspector-back{margin-bottom:13px;padding:3px 0}.tm-inspector-back .tm-icon{width:12px;height:12px;transform:rotate(-90deg)}\n@container team (min-width:900px){.tm-inspect-jump,.tm-inspector-back{display:none}.tm-graph-context{flex:none!important}.tm-inspector-wrap{align-self:stretch;max-height:650px}}\n@container team (max-width:650px){.tm-graph-caption>.tm-graph-context{display:block}}\n';

// client/team-theme.css
var team_theme_default = '/* Style control is the only addition to the original UI. All visual overrides below\n   require the explicit theme attribute; no host/document theme is changed. */\n.tm-theme-switch{display:inline-flex;align-items:center;gap:6px;flex:none;margin-left:5px;font-size:11px;color:var(--tm-muted)}\n.tm-theme-switch select{max-width:112px;min-height:32px;padding:5px 22px 5px 8px;border:1px solid var(--tm-line);border-radius:5px;background:var(--tm-subtle);color:var(--tm-text);font-size:11px;cursor:pointer}\n.tm-settings-header-actions{display:flex;align-items:center;gap:10px;flex:none}\n@container team (max-width:540px){\n  .tm-header{flex-wrap:wrap;gap:8px}\n  .tm-header-actions{margin-left:auto}\n  .tm-settings>header{flex-wrap:wrap}\n  .tm-settings>header>div:first-child{flex:1 1 100%}\n  .tm-settings-header-actions{width:100%;justify-content:flex-end}\n}\n\n/* Arknights-inspired terminal. Original CSS geometry, no game art or remote fonts.\n   Visual grammar: hard corners, technical grids, black/white dossiers and one\n   yellow selection accent. Cyan is reserved for live execution, never animation. */\n.tm-root[data-theme=arknights]{\n  --tm-bg:#191b1f;--tm-panel:#25282d;--tm-raised:#2d3035;--tm-subtle:#202226;\n  --tm-border:#454a50;--tm-line:#727981;--tm-text:#f2f2ed;--tm-muted:#c7cac9;--tm-soft:#b3b8bb;\n  --tm-accent:#e4e56b;--tm-green:#a4d8bd;--tm-green-bg:#24382f;--tm-indigo:#8ad5df;--tm-indigo-bg:#20383d;\n  --tm-amber:#f0c282;--tm-amber-bg:#393022;--tm-red:#ffafa8;--tm-red-bg:#422a2a;\n  --tm-paper:#eeeee7;--tm-ink:#1b1d20;--tm-active:#8ad5df;\n  font-family:"Arial Narrow","Roboto Condensed","Noto Sans CJK SC","Source Han Sans SC","PingFang SC","Microsoft YaHei",sans-serif;\n  background-image:linear-gradient(135deg,transparent 48%,#ffffff03 48%,#ffffff03 52%,transparent 52%);\n  background-size:8px 8px;\n}\n.tm-root[data-theme=arknights] .tm-header{\n  position:relative;padding-block:17px;background:#111316;border-bottom:3px solid var(--tm-paper);\n}\n.tm-root[data-theme=arknights] .tm-header::after{\n  content:"";position:absolute;bottom:-3px;right:0;width:70px;height:3px;\n  background:repeating-linear-gradient(135deg,var(--tm-accent) 0 4px,#111316 4px 8px);\n}\n.tm-root[data-theme=arknights] .tm-brand{gap:12px}\n.tm-root[data-theme=arknights] .tm-brand-mark{width:40px;height:40px;border:0;border-radius:0;background:var(--tm-paper);color:var(--tm-ink);clip-path:polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)}\n.tm-root[data-theme=arknights] .tm-brand-mark svg{width:25px!important;height:25px!important}\n.tm-root[data-theme=arknights] .tm-wordmark{font:700 25px/1.05 "Arial Narrow",Impact,var(--tm-mono);letter-spacing:-.5px;color:var(--tm-text)}\n.tm-root[data-theme=arknights] .tm-wordmark>span{font:10px var(--tm-mono);letter-spacing:1.2px;color:var(--tm-muted)}\n.tm-root[data-theme=arknights] .tm-brand h1{font-size:11px;letter-spacing:3px;font-weight:500;margin-top:5px}\n.tm-root[data-theme=arknights] :is(.tm-button,.tm-icon-button,.tm-theme-switch select,.tm-graph-tools select,.tm-fit-button){border-radius:0;border-color:var(--tm-line)}\n.tm-root[data-theme=arknights] :is(.tm-button,.tm-icon-button){min-height:34px;background:var(--tm-panel)}\n.tm-root[data-theme=arknights] :is(.tm-button,.tm-icon-button):hover:not(:disabled){background:#393d42;border-color:var(--tm-paper)}\n.tm-root[data-theme=arknights] .tm-button--quiet{border-color:transparent;background:transparent}\n.tm-root[data-theme=arknights] .tm-button--primary{background:var(--tm-accent);border-color:var(--tm-accent);color:var(--tm-ink)!important;font-weight:700}\n.tm-root[data-theme=arknights] .tm-button--primary:hover:not(:disabled){background:#f2f3a1;border-color:#f2f3a1}\n.tm-root[data-theme=arknights] .tm-button--danger{background:var(--tm-red-bg);border-color:#a26863}\n.tm-root[data-theme=arknights] .tm-theme-switch{padding-left:10px;border-left:1px solid var(--tm-border);gap:7px}\n.tm-root[data-theme=arknights] .tm-theme-switch select{background:var(--tm-paper);color:var(--tm-ink);font-weight:700;border-color:var(--tm-paper)}\n.tm-root[data-theme=arknights] .tm-demo-banner{background:#2b2b1e;border-bottom:1px solid #737548;color:#ebeca8}\n.tm-root[data-theme=arknights] .tm-demo-banner>span{border:0;border-radius:0;background:var(--tm-accent);color:var(--tm-ink);padding:2px 6px;letter-spacing:1px}\n.tm-root[data-theme=arknights] .tm-demo-banner button{color:#ebeca8}\n.tm-root[data-theme=arknights] .tm-overview{\n  --tm-text:#1b1d20;--tm-muted:#4f5556;--tm-soft:#565d60;--tm-accent:#245b65;--tm-active:#245b65;\n  --tm-green:#266045;--tm-red:#9f342b;--tm-amber:#7d5214;\n  position:relative;background:var(--tm-paper);color:var(--tm-text);padding:16px 18px;border-left:5px solid #e4e56b;\n}\n.tm-root[data-theme=arknights] .tm-overview::after{content:"";position:absolute;bottom:0;right:0;width:14px;height:14px;background:linear-gradient(135deg,transparent 49%,#191b1f 50%);pointer-events:none}\n.tm-root[data-theme=arknights] .tm-overview h2{font-weight:750;font-size:23px;line-height:1.5;letter-spacing:.1px}\n.tm-root[data-theme=arknights] .tm-section-eyebrow{letter-spacing:1px}\n.tm-root[data-theme=arknights] .tm-overview .tm-section-eyebrow>span:first-child{font-family:var(--tm-mono);font-size:10px;font-weight:700;border-bottom:1px solid #747b76;padding-bottom:3px}\n.tm-root[data-theme=arknights] .tm-summary-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;margin:0 0 16px;border:1px solid var(--tm-border);border-top:0;background:var(--tm-subtle)}\n.tm-root[data-theme=arknights] .tm-summary-strip>div{padding:10px 14px;gap:8px;border-right:1px solid var(--tm-border)}\n.tm-root[data-theme=arknights] .tm-summary-strip>div:last-child{border-right:0}\n.tm-root[data-theme=arknights] .tm-summary-strip strong{font:500 21px/1.1 var(--tm-mono);margin-left:auto}\n.tm-root[data-theme=arknights] .tm-summary-strip>div:nth-child(3) strong{color:var(--tm-active)}\n.tm-root[data-theme=arknights] .tm-summary-strip small{font-size:11px;color:var(--tm-soft)}\n.tm-root[data-theme=arknights] :is(.tm-jev-panel,.tm-workspace,.tm-activity,.tm-command-guide,.tm-running-bar,.tm-key-config,.tm-role-settings-layout,.tm-disclosure,.tm-notice,.tm-gates){border-radius:0}\n.tm-root[data-theme=arknights] .tm-jev-panel{border-left:3px solid var(--tm-active)}\n.tm-root[data-theme=arknights] .tm-control-details>summary{background:#20282c}\n.tm-root[data-theme=arknights] .tm-control-details>summary .tm-control-title>.tm-icon{color:var(--tm-active)}\n.tm-root[data-theme=arknights] .tm-jev-next strong{color:var(--tm-active)}\n.tm-root[data-theme=arknights] .tm-panel-header{background:var(--tm-paper);border-bottom:0;min-height:46px;padding:0 12px}\n.tm-root[data-theme=arknights] .tm-panel-header .tm-tabs{gap:0}\n.tm-root[data-theme=arknights] .tm-panel-header .tm-tabs button{color:#4f5556;padding:12px 15px;font-weight:600}\n.tm-root[data-theme=arknights] .tm-panel-header .tm-tabs button[aria-selected=true]{background:#202226;color:var(--tm-paper)}\n.tm-root[data-theme=arknights] .tm-panel-header .tm-tabs button[aria-selected=true]::after{background:var(--tm-accent);height:3px;bottom:0}\n.tm-root[data-theme=arknights] .tm-panel-header .tm-tabs button>span{border:0;border-radius:0;background:#d2d5cb;color:#282c2c}\n.tm-root[data-theme=arknights] .tm-panel-header .tm-config-trigger{color:#414949!important;background:transparent;border-color:transparent}\n.tm-root[data-theme=arknights] .tm-panel-header .tm-config-trigger:hover{background:#d4d7ce;border-color:#a6aca3}\n.tm-root[data-theme=arknights] .tm-panel-header :is(button:focus-visible,select:focus-visible){outline-color:#235b65;outline-offset:-4px}\n.tm-root[data-theme=arknights] .tm-panel-header .tm-tabs button[aria-selected=true]:focus-visible{outline-color:var(--tm-accent)}\n.tm-root[data-theme=arknights] .tm-graph-caption{background:#25282d;border-bottom:1px solid var(--tm-border);padding-block:10px}\n.tm-root[data-theme=arknights] :is(.tm-topology,.tm-graph-scroll){\n  background-color:#1a1c20;\n  background-image:linear-gradient(#adb7b70b 1px,transparent 1px),linear-gradient(90deg,#adb7b70b 1px,transparent 1px),linear-gradient(#adb7b712 1px,transparent 1px),linear-gradient(90deg,#adb7b712 1px,transparent 1px);\n  background-size:20px 20px,20px 20px,100px 100px,100px 100px;\n}\n.tm-root[data-theme=arknights] .tm-topology-map::before{content:"";position:absolute;inset:11px;pointer-events:none;background:linear-gradient(var(--tm-soft),var(--tm-soft)) left top/12px 1px no-repeat,linear-gradient(var(--tm-soft),var(--tm-soft)) left top/1px 12px no-repeat,linear-gradient(var(--tm-soft),var(--tm-soft)) right bottom/12px 1px no-repeat,linear-gradient(var(--tm-soft),var(--tm-soft)) right bottom/1px 12px no-repeat;opacity:.7}\n.tm-root[data-theme=arknights] .tm-topology-wires{color:#929997}\n.tm-root[data-theme=arknights] .tm-topology-wires path{stroke-dasharray:3 5;stroke-width:1}\n.tm-root[data-theme=arknights] .tm-controller-node{background:var(--tm-paper);border:1px solid var(--tm-paper);border-left:4px solid var(--tm-active);border-radius:0;color:var(--tm-ink)}\n.tm-root[data-theme=arknights] .tm-controller-node:hover{background:#fffef4;border-color:var(--tm-active)}\n.tm-root[data-theme=arknights] .tm-controller-node.is-selected{border-color:var(--tm-accent);box-shadow:0 0 0 2px var(--tm-accent)}\n.tm-root[data-theme=arknights] .tm-controller-symbol{border:0;border-radius:0;background:#24292c;color:var(--tm-paper)}\n.tm-root[data-theme=arknights] .tm-controller-node strong{font:700 19px/1.2 var(--tm-mono);letter-spacing:1px}\n.tm-root[data-theme=arknights] .tm-controller-node>div>span{color:#4f5556}\n.tm-root[data-theme=arknights] .tm-controller-node>.tm-icon{color:#4f5556}\n.tm-root[data-theme=arknights] :is(.tm-role-card,.tm-task-node){border-radius:0;border:1px solid #737b80;background:#2b2e33;box-shadow:inset 3px 0 #757d80}\n.tm-root[data-theme=arknights] .tm-role-card::before{width:9px;height:9px;top:-1px;left:auto;right:-1px;border:0;border-radius:0;background:linear-gradient(45deg,#737b80 0 47%,#1a1c20 49% 100%)}\n.tm-root[data-theme=arknights] .tm-role-card::after{width:16px;height:2px;bottom:-2px;left:calc(50% - 8px);border:0;border-radius:0;background:#acb4b5}\n.tm-root[data-theme=arknights] :is(.tm-role-card,.tm-task-node):hover{background:#393d42;border-color:#bfc5c5}\n.tm-root[data-theme=arknights] :is(.tm-role-card,.tm-task-node).is-selected{background:#373a2a;border-color:var(--tm-accent);box-shadow:inset 4px 0 var(--tm-accent),0 0 0 1px var(--tm-accent)}\n.tm-root[data-theme=arknights] .tm-role-card.is-selected::before{background:linear-gradient(45deg,var(--tm-accent) 0 47%,#1a1c20 49% 100%)}\n.tm-root[data-theme=arknights] .tm-role-card.is-active:not(.is-selected),.tm-root[data-theme=arknights] .tm-task-node--running:not(.is-selected){border-color:var(--tm-active);box-shadow:inset 3px 0 var(--tm-active)}\n.tm-root[data-theme=arknights] :is(.tm-task-node--failed,.tm-task-node--blocked){box-shadow:inset 3px 0 var(--tm-red)}\n.tm-root[data-theme=arknights] .tm-role-icon{background:var(--tm-paper);border:0;border-radius:0;color:var(--tm-ink)}\n.tm-root[data-theme=arknights] .tm-role-title>strong{font-weight:700;letter-spacing:.4px}\n.tm-root[data-theme=arknights] .tm-role-title>span{font-size:9px;letter-spacing:.5px}\n.tm-root[data-theme=arknights] .tm-task-role{border-bottom:1px solid #596064;padding-bottom:5px;font-size:10px;letter-spacing:.3px}\n.tm-root[data-theme=arknights] .tm-task-role small{font-size:11px;color:var(--tm-text)}\n.tm-root[data-theme=arknights] .tm-task-node>strong{font-weight:650}\n.tm-root[data-theme=arknights] .tm-task-wires{color:#afb8b7}\n.tm-root[data-theme=arknights] :is(.tm-status--running,.tm-status--planning,.tm-status--reviewing){color:var(--tm-active)}\n.tm-root[data-theme=arknights] .tm-status i{border-radius:0}\n.tm-root[data-theme=arknights] .tm-map-footer{background:#202226;letter-spacing:.2px}\n/* Light dossier inspector is a separate readable surface, with its own tokens. */\n.tm-root[data-theme=arknights] .tm-inspector{\n  --tm-bg:#f6f6ef;--tm-panel:#eeeee7;--tm-raised:#e0e3da;--tm-subtle:#e3e5dc;\n  --tm-border:#bec4bb;--tm-line:#858e88;--tm-text:#1b1d20;--tm-muted:#4d5554;--tm-soft:#56605c;\n  --tm-accent:#255b65;--tm-active:#255b65;--tm-green:#276047;--tm-red:#a0342b;--tm-red-bg:#f3ddd6;--tm-amber:#805217;\n  color:var(--tm-text);border-top:4px solid #747b72;background:var(--tm-panel);\n}\n.tm-root[data-theme=arknights] .tm-inspector>.tm-section-eyebrow{font-size:10px;border-bottom:2px solid #292e2c;padding-bottom:9px;font-weight:700;letter-spacing:1px}\n.tm-root[data-theme=arknights] .tm-inspector-heading>.tm-role-icon{width:37px;height:37px;background:#252a29;color:#f4f4ed}\n.tm-root[data-theme=arknights] .tm-inspector-heading h3{font-size:18px;font-weight:750}\n.tm-root[data-theme=arknights] .tm-facts>div{padding:7px 0;border-bottom:1px solid var(--tm-border)}\n.tm-root[data-theme=arknights] :is(.tm-facts dd,.tm-evidence pre){color:var(--tm-text)}\n.tm-root[data-theme=arknights] .tm-evidence pre,.tm-root[data-theme=arknights] .tm-node-error pre{border-radius:0}\n.tm-root[data-theme=arknights] .tm-inspector :is(.tm-mini-heading,.tm-source>summary){font-weight:650}\n.tm-root[data-theme=arknights] .tm-inspector .tm-button:hover:not(:disabled){background:#dde1d7;border-color:#65746b}\n.tm-root[data-theme=arknights] .tm-inspector .tm-relation-tag{border-radius:0;background:#dde1d6}\n.tm-root[data-theme=arknights] .tm-activity-toggle{border-left:3px solid var(--tm-paper);background:#202226}\n.tm-root[data-theme=arknights] .tm-activity-toggle>strong{letter-spacing:1px;font-weight:650}\n.tm-root[data-theme=arknights] .tm-event{border-bottom-color:var(--tm-border)}\n.tm-root[data-theme=arknights] .tm-event>strong{color:var(--tm-text)}\n.tm-root[data-theme=arknights] .tm-event-icon{border:1px solid var(--tm-border)}\n.tm-root[data-theme=arknights] .tm-command-guide{border-left:4px solid var(--tm-accent);background:#252721}\n.tm-root[data-theme=arknights] .tm-command-guide code{background:#181b17;border-left:1px solid #7e8548;padding:7px 9px}\n.tm-root[data-theme=arknights] .tm-running-bar{border-left:4px solid var(--tm-active)}\n.tm-root[data-theme=arknights] .tm-running-indicator{border-radius:0;background:var(--tm-active)}\n.tm-root[data-theme=arknights] .tm-footer{font-family:var(--tm-mono);letter-spacing:.2px}\n/* Settings retain the exact disclosure and mounted editors; only their skin changes. */\n.tm-root[data-theme=arknights].tm-setup-root{background-color:#191b1f}\n.tm-root[data-theme=arknights] .tm-settings>header{position:relative;padding:18px;border:1px solid var(--tm-border);border-left:5px solid var(--tm-accent);background:#111316}\n.tm-root[data-theme=arknights] .tm-settings>header .tm-section-eyebrow{font:10px var(--tm-mono);letter-spacing:1px;color:var(--tm-accent)}\n.tm-root[data-theme=arknights] .tm-settings h3{font-size:23px;font-weight:750}\n.tm-root[data-theme=arknights] .tm-key-config{border-top:3px solid var(--tm-paper)}\n.tm-root[data-theme=arknights] :is(.tm-key-config input,.tm-model-config input,.tm-model-config select,.tm-limits input){border-radius:0;border-color:#747c80;background:#1c1e22}\n.tm-root[data-theme=arknights] .tm-settings-section-title{border-bottom:1px solid var(--tm-line);padding-bottom:9px}\n.tm-root[data-theme=arknights] .tm-settings-section-title h4{letter-spacing:1px;font-weight:650}\n.tm-root[data-theme=arknights] .tm-role-selector{background:#1d1f23}\n.tm-root[data-theme=arknights] .tm-role-selector>button[aria-pressed=true]{background:#e4e56b;color:#21251e;box-shadow:inset 4px 0 #f7f7e4}\n.tm-root[data-theme=arknights] .tm-role-selector>button[aria-pressed=true] :is(small,.tm-icon,.tm-config-ready,.tm-config-missing){color:#404c3a}\n.tm-root[data-theme=arknights] .tm-role-selector>button:hover:not([aria-pressed=true]){background:#393d42}\n.tm-root[data-theme=arknights] .tm-role-selector>button:focus-visible{outline-offset:-4px;outline-color:#8ad5df}\n.tm-root[data-theme=arknights] .tm-role-selector>button[aria-pressed=true]:focus-visible{outline-color:#245b65}\n.tm-root[data-theme=arknights] .tm-model-config legend{padding-bottom:12px;border-bottom:1px solid var(--tm-border);width:100%}\n.tm-root[data-theme=arknights] .tm-disclosure{border:1px solid #8b805f;border-top:3px solid var(--tm-amber);background:#292720}\n.tm-root[data-theme=arknights] .tm-disclosure .tm-endpoint{color:#e1d3b2}\n.tm-root[data-theme=arknights] .tm-disclosure>label{border-top:1px solid #766d54;padding-top:12px}\n.tm-root[data-theme=arknights] .tm-setup-actions{background:#191b1f}\n@container team (min-width:900px){\n  .tm-root[data-theme=arknights] .tm-inspector{border-top:0;border-left:1px solid #bec4bb}\n  .tm-root[data-theme=arknights] .tm-main{padding-top:18px}\n}\n@container team (max-width:650px){\n  .tm-root[data-theme=arknights] .tm-header{padding:12px 14px;gap:9px}\n  .tm-root[data-theme=arknights] .tm-wordmark{font-size:22px}\n  .tm-root[data-theme=arknights] .tm-wordmark>span{display:block;font-size:8px;letter-spacing:.8px;margin-top:4px}\n  .tm-root[data-theme=arknights] .tm-brand-mark{width:34px;height:34px}\n  .tm-root[data-theme=arknights] .tm-brand h1{font-size:10px;letter-spacing:1.5px;margin-top:3px}\n  .tm-root[data-theme=arknights] .tm-overview{padding:11px 12px}\n  .tm-root[data-theme=arknights] .tm-overview h2{font-size:17px;line-height:1.6;margin-top:5px}\n  .tm-root[data-theme=arknights] .tm-summary-strip{margin-bottom:12px}\n  .tm-root[data-theme=arknights] .tm-summary-strip>div{padding:9px 8px;gap:4px;flex-wrap:wrap;align-content:center}\n  .tm-root[data-theme=arknights] .tm-summary-strip strong{font-size:17px;margin-left:0;white-space:nowrap}\n  .tm-root[data-theme=arknights] .tm-summary-strip small{font-size:9px}\n  .tm-root[data-theme=arknights] .tm-summary-strip>div>span{font-size:10px}\n  .tm-root[data-theme=arknights] .tm-panel-header{padding:0 6px}\n  .tm-root[data-theme=arknights] .tm-panel-header .tm-tabs button{padding:12px 10px;font-size:11px}\n  .tm-root[data-theme=arknights] .tm-graph-caption{padding-block:8px}\n  .tm-root[data-theme=arknights] .tm-inspector-heading h3{font-size:16px}\n  .tm-root[data-theme=arknights] .tm-settings>header{padding:14px}\n  .tm-root[data-theme=arknights] .tm-settings h3{font-size:19px}\n  .tm-root[data-theme=arknights] .tm-theme-switch{padding-left:8px}\n}\n@container team (max-width:380px){\n  .tm-root[data-theme=arknights] .tm-summary-strip>div{flex-direction:column;align-items:flex-start;gap:5px}\n  .tm-root[data-theme=arknights] .tm-theme-switch>span{display:none}\n  .tm-root[data-theme=arknights] .tm-header-actions{gap:3px}\n}\n@media(prefers-reduced-motion:reduce){.tm-root[data-theme=arknights] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}\n';

// client/team-theme.tsx
var import_react2 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
var TEAM_THEME_STORAGE_KEY = "dsh-desktop-workflow:ui-theme:v1";
var DEFAULT_THEME = "arknights";
var listeners = /* @__PURE__ */ new Set();
var theme = DEFAULT_THEME;
var initialized = false;
var unsavedPreference = false;
var validTheme = (value) => value === "arknights" || value === "classic";
function readStoredTheme() {
  try {
    if (typeof window === "undefined") return void 0;
    const value = window.localStorage.getItem(TEAM_THEME_STORAGE_KEY);
    return validTheme(value) ? value : DEFAULT_THEME;
  } catch {
    return void 0;
  }
}
function getSnapshot() {
  if (!initialized) {
    theme = readStoredTheme() ?? DEFAULT_THEME;
    initialized = true;
  }
  return theme;
}
function publish(next) {
  if (theme === next) return;
  theme = next;
  listeners.forEach((listener) => listener());
}
function onStorage(event) {
  if (event.key !== TEAM_THEME_STORAGE_KEY && event.key !== null) return;
  try {
    if (event.storageArea && event.storageArea !== window.localStorage) return;
  } catch {
    return;
  }
  unsavedPreference = false;
  publish(validTheme(event.newValue) ? event.newValue : DEFAULT_THEME);
}
function subscribe(listener) {
  const first = listeners.size === 0;
  listeners.add(listener);
  if (first && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
    if (!unsavedPreference) publish(readStoredTheme() ?? theme);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}
function setTeamTheme(next) {
  if (!validTheme(next)) return;
  getSnapshot();
  try {
    if (typeof window === "undefined") throw new Error("No browser storage");
    window.localStorage.setItem(TEAM_THEME_STORAGE_KEY, next);
    unsavedPreference = false;
  } catch {
    unsavedPreference = true;
  }
  publish(next);
}
function useTeamTheme() {
  return (0, import_react2.useSyncExternalStore)(subscribe, getSnapshot, () => DEFAULT_THEME);
}
function TeamThemeSwitch({ theme: theme2 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "tm-theme-switch", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u98CE\u683C" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("select", { "aria-label": "\u754C\u9762\u98CE\u683C", value: theme2, onChange: (event) => setTeamTheme(event.target.value), children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "arknights", children: "\u660E\u65E5\u65B9\u821F" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "classic", children: "\u539F\u7248 UI" })
    ] })
  ] });
}

// client/team-types.ts
function createDefaultTeamSettings() {
  return {
    roles: {
      planner: { provider: "", model: "", maxTokens: 4096 },
      coordinator: { provider: "", model: "", maxTokens: 4096 },
      researcher: { provider: "", model: "", maxTokens: 4096 },
      explorer: { provider: "", model: "", maxTokens: 4096 },
      worker: { provider: "", model: "", maxTokens: 4096 },
      reviewer: { provider: "", model: "", maxTokens: 4096 }
    },
    limits: { concurrency: 2, maxAgents: 12, maxTasks: 8, maxRetries: 1, maxDurationMs: 6e5, maxStepsPerAgent: 8, maxRounds: 4, maxJevCalls: 10 },
    reviewPlan: true
  };
}

// client/TeamView.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function Icon2({ name, className = "" }) {
  const paths = {
    team: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "8", y: "8", width: "8", height: "8", rx: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "4", cy: "4", r: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "20", cy: "4", r: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "4", cy: "20", r: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "20", cy: "20", r: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "m6 6 3 3m6 0 3-3M6 18l3-3m6 0 3 3" })
    ] }),
    plan: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "5", y: "3", width: "14", height: "18", rx: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M9 8h6M9 12h6M9 16h3" })
    ] }),
    coordinate: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "8", y: "8", width: "8", height: "8", rx: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M12 3v5m0 8v5M3 12h5m8 0h5m-4-8-2 2M7 7 5 5m12 12 2 2M7 17l-2 2" })
    ] }),
    search: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "10", cy: "10", r: "6" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "m15 15 6 6M8 10h4m-2-2v4" })
    ] }),
    explore: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "m10 12-3 2 3 2m4-4 3 2-3 2" })
    ] }),
    code: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16" }),
    review: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M12 3 4 6v5c0 5 4 8 8 10 4-2 8-5 8-10V6Z" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "m8 12 3 3 5-6" })
    ] }),
    route: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_jsx_runtime3.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M4 12h5a3 3 0 0 0 3-3V7a2 2 0 0 1 2-2h6M9 12a3 3 0 0 1 3 3v2a2 2 0 0 0 2 2h6m-3-17 3 3-3 3m0 8 3 3-3 3" }) }),
    arrow: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M4 12h16m-6-6 6 6-6 6" }),
    check: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "m5 12 4 4L19 6" }),
    close: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "m6 6 12 12M6 18 18 6" }),
    refresh: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M20 5v6h-6M4 19v-6h6" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M6 6a8 8 0 0 1 14 5M4 13a8 8 0 0 0 14 5" })
    ] }),
    settings: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M4 6h16M4 12h16M4 18h16" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "9", cy: "6", r: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "15", cy: "12", r: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "8", cy: "18", r: "2" })
    ] }),
    clock: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M12 7v5l3 2" })
    ] }),
    file: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M14 3v6h6M8 14h8m-8 3h5" })
    ] }),
    chevron: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "m9 5 7 7-7 7" }),
    play: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "m8 4 12 8-12 8Z" }),
    stop: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "6", y: "6", width: "12", height: "12", rx: "2" }),
    lock: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "6", y: "10", width: "12", height: "11", rx: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" })
    ] }),
    activity: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M3 12h4l3-8 4 16 3-8h4" }),
    branch: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "6", cy: "5", r: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "6", cy: "19", r: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "18", cy: "6", r: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M6 7v10m0-4c6 0 12-1 12-5" })
    ] }),
    alert: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "m10 4-8 14a2 2 0 0 0 2 3h16a2 2 0 0 0 2-3L14 4a2 2 0 0 0-4 0Z" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M12 9v5m0 3v.1" })
    ] })
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { className: `tm-icon ${className}`, width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: paths[name] });
}
var ROLE = {
  planner: { name: "\u89C4\u5212\u8005", subtitle: "\u5F3A\u6A21\u578B\u89C4\u5212", icon: "plan", description: "\u7406\u89E3\u76EE\u6807\uFF0C\u63D0\u51FA\u4EFB\u52A1\u62C6\u5206\u3001\u4F9D\u8D56\u548C\u9A8C\u6536\u6761\u4EF6\u3002\u5B9E\u9645\u4EFB\u52A1\u968F\u76EE\u6807\u751F\u6210\u3002", access: "\u53EA\u8BFB\u5206\u6790" },
  coordinator: { name: "\u534F\u8C03\u8005", subtitle: "\u4E3B\u529B\u534F\u8C03", icon: "coordinate", description: "\u5728\u6D3E\u53D1\u524D\u6574\u5408\u5E76\u7EC6\u5316\u4EFB\u52A1\u56FE\uFF0C\u660E\u786E\u4EFB\u52A1\u4F9D\u8D56\u4E0E\u9A8C\u6536\u8981\u6C42\u3002\u540E\u7EED\u7531\u6709\u754C\u8C03\u5EA6\u5668\u6267\u884C\u3002", access: "\u53EA\u8BFB\u534F\u8C03" },
  researcher: { name: "\u7814\u7A76\u8005", subtitle: "\u8F7B\u91CF\u7814\u7A76", icon: "search", description: "\u6536\u96C6\u4F9D\u636E\u3001\u6BD4\u8F83\u65B9\u6848\uFF0C\u5411\u56E2\u961F\u63D0\u4F9B\u7B80\u660E\u7684\u7814\u7A76\u7ED3\u8BBA\u3002", access: "\u53EF\u5E76\u884C \xB7 \u53EA\u8BFB" },
  explorer: { name: "\u63A2\u7D22\u8005", subtitle: "\u4EE3\u7801\u63A2\u7D22", icon: "explore", description: "\u68C0\u67E5\u9879\u76EE\u7ED3\u6784\u4E0E\u76F8\u5173\u4EE3\u7801\uFF0C\u5B9A\u4F4D\u5B9E\u73B0\u8DEF\u5F84\u548C\u9A8C\u8BC1\u4F9D\u636E\u3002", access: "\u53EF\u5E76\u884C \xB7 \u53EA\u8BFB" },
  worker: { name: "\u6267\u884C\u8005", subtitle: "\u4E3B\u529B\u6267\u884C", icon: "code", description: "\u6839\u636E\u660E\u786E\u4EFB\u52A1\u5B9E\u65BD\u4EE3\u7801\u53D8\u66F4\u3002\u7F16\u8F91\u4E32\u884C\u6267\u884C\uFF0C\u9075\u5FAA Desktop \u73B0\u6709\u6743\u9650\u3002", access: "\u4E32\u884C\u7F16\u8F91" },
  reviewer: { name: "\u5BA1\u67E5\u8005", subtitle: "\u6309\u9700\u5F3A\u5BA1\u67E5", icon: "review", description: "\u5BA1\u67E5\u65B9\u6848\u548C\u4EA7\u51FA\uFF0C\u63D0\u51FA\u5177\u4F53\u53CD\u9988\u3002\u65B9\u6848\u91CD\u8BD5\u4FDD\u7559\u72EC\u7ACB\u8BB0\u5F55\uFF1B\u6700\u7EC8\u5BA1\u67E5\u95EE\u9898\u4F1A\u963B\u585E\u4EA4\u4ED8\u3002", access: "\u53EA\u8BFB\u5BA1\u67E5" },
  jev: { name: "Jev \u6838\u5FC3\u8C03\u5EA6", subtitle: "TypeSafe \u63A7\u5236\u9762", icon: "route", description: "Jev \u72EC\u7ACB\u5B8C\u6210\u4EFB\u52A1\u5206\u6863\u4E0E\u9010\u8F6E\u51B3\u7B56\u3002\u516D\u4E2A\u5C97\u4F4D\u7EE7\u7EED\u4F7F\u7528\u4F60\u9009\u62E9\u7684\u6A21\u578B\uFF1B\u5B8C\u6210\u4ECD\u987B\u901A\u8FC7\u5BBF\u4E3B\u9A8C\u8BC1\u3001\u8303\u56F4\u4E0E\u5DEE\u5F02\u68C0\u67E5\u3002", access: "\u670D\u52A1\u7AEF\u8C03\u5EA6 \xB7 \u65E0\u7F16\u8F91\u6743\u9650" }
};
var ROLES = ["planner", "coordinator", "researcher", "explorer", "worker", "reviewer"];
var STATUS = { pending: "\u5F85\u6267\u884C", running: "\u8FDB\u884C\u4E2D", completed: "\u5DF2\u5B8C\u6210", failed: "\u5931\u8D25", blocked: "\u5DF2\u963B\u585E", cancelled: "\u5DF2\u53D6\u6D88", planning: "\u89C4\u5212\u4E2D", reviewing: "\u5BA1\u67E5\u4E2D", idle: "\u672A\u6D3E\u53D1", unverified: "\u5F85\u9A8C\u8BC1", completion_unverified: "\u5B8C\u6210\u6761\u4EF6\u672A\u6EE1\u8DB3" };
var EDGE = { dispatch: "\u6D3E\u53D1", dependency: "\u4F9D\u8D56", feedback: "\u53CD\u9988", retry: "\u91CD\u8BD5", join: "\u6C47\u603B" };
var ACTIVE = /* @__PURE__ */ new Set(["planning", "running", "reviewing"]);
function isFixture(snapshot) {
  return !!snapshot?.demo || snapshot?.jev?.mode === "fixture";
}
function Status2({ status, count }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: `tm-status tm-status--${status}`, children: [
    status === "completed" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "check" }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("i", {}),
    STATUS[status] || status,
    count ? ` \xB7 ${count}` : ""
  ] });
}
function modelName(selection, catalog, demo = false) {
  if (demo && !selection?.model) return "\u793A\u4F8B\u89D2\u8272 \xB7 \u672A\u8C03\u7528\u6A21\u578B";
  if (!selection?.model) return "\u5C1A\u672A\u9009\u62E9\u6A21\u578B";
  return catalog.providers.find((p) => p.id === selection.provider)?.models.find((m) => m.id === selection.model)?.name || selection.model;
}
function providerName(selection, catalog) {
  return catalog.providers.find((p) => p.id === selection?.provider)?.name || selection?.provider || "\u672A\u914D\u7F6E";
}
function roleStatus(nodes) {
  const latest = /* @__PURE__ */ new Map();
  nodes.forEach((node) => {
    const key = node.taskId || node.id;
    if (!latest.has(key) || latest.get(key).attempt <= node.attempt) latest.set(key, node);
  });
  for (const status of ["running", "blocked", "failed", "pending", "completed", "cancelled"]) if ([...latest.values()].some((node) => node.status === status)) return status;
  return "idle";
}
function time(value) {
  if (!value) return "\u672A\u62A5\u544A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function duration(snapshot) {
  if (!snapshot.finishedAt) return "\u8FD0\u884C\u4E2D";
  const seconds = Math.round((new Date(snapshot.finishedAt).getTime() - new Date(snapshot.startedAt).getTime()) / 1e3);
  return Number.isFinite(seconds) && seconds >= 0 ? `${Math.floor(seconds / 60)} \u5206 ${seconds % 60} \u79D2` : "\u672A\u62A5\u544A";
}
function validateSettings(settings, catalog) {
  return ROLES.filter((role) => {
    const selected = settings.roles[role];
    const model = catalog.providers.find((p) => p.id === selected?.provider)?.models.find((m) => m.id === selected?.model);
    return !model || !!selected?.reasoningEffort && !(model.efforts || []).some((effort) => effort.id === selected.reasoningEffort);
  });
}
var LANE = { small: "\u5C0F\u578B\u4EFB\u52A1", medium: "\u6807\u51C6\u4EFB\u52A1", high: "\u9AD8\u590D\u6742\u5EA6", escalate: "\u5347\u7EA7\u5904\u7406" };
function JevPanel({ catalog, snapshot, settings, onSelectNode }) {
  const state = snapshot?.jev;
  const fixture = isFixture(snapshot) || catalog.jev?.mode === "fixture";
  const ready = !!catalog.jev?.configured && !!catalog.jev.available;
  const evidence = state?.evidence;
  const passed = !!evidence && evidence.checksPassed && evidence.scopeOk && evidence.diffAvailable && evidence.verified;
  const latestDecision = state?.decisions.at(-1);
  const jevNode = snapshot?.nodes.filter((node) => node.role === "jev" && node.kind !== "verification").at(-1);
  const gates = [
    { label: "\u9A8C\u8BC1\u68C0\u67E5\u901A\u8FC7", value: evidence?.checksPassed },
    { label: "\u4FEE\u6539\u8303\u56F4\u5408\u89C4", value: evidence?.scopeOk },
    { label: "\u5DEE\u5F02\u8BC1\u636E\u53EF\u7528", value: evidence?.diffAvailable },
    { label: "\u72EC\u7ACB\u9A8C\u8BC1\u6210\u7ACB", value: evidence?.verified }
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("section", { className: "tm-jev-panel", "aria-label": "Jev \u6838\u5FC3\u8C03\u5EA6\u4E0E\u5B8C\u6210\u95E8\u7981", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("details", { className: "tm-control-details", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("summary", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "tm-control-title", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "route" }),
        "Jev \u6838\u5FC3\u8C03\u5EA6"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: `tm-jev-connection ${fixture ? "is-fixture" : ready ? "is-ready" : "is-blocked"}`, children: fixture ? "FIXTURE \xB7 \u672A\u8FDE\u63A5\u670D\u52A1" : ready ? "TypeSafe \xB7 \u5DF2\u914D\u7F6E" : "\u771F\u5B9E\u8FD0\u884C\u5DF2\u963B\u6B62" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "chevron" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "tm-jev-description", children: "Jev \u51B3\u5B9A\u4EFB\u52A1\u5206\u6863\u4E0E\u4E0B\u4E00\u6B65\u6D41\u7A0B\u3002\u516D\u4E2A\u5C97\u4F4D\u59CB\u7EC8\u4F7F\u7528\u4F60\u9009\u62E9\u7684\u6A21\u578B\u548C\u63D0\u4F9B\u65B9\uFF0C\u4E0D\u4F1A\u968F\u5206\u6863\u81EA\u52A8\u6362\u6A21\u3002" }),
    !fixture && !ready && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "tm-jev-warning", role: "status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "alert" }),
      catalog.jev?.reason || "\u5C1A\u672A\u5B8C\u6210 Jev \u8BBE\u7F6E\u3002\u8BF7\u6253\u5F00\u56E2\u961F\u8BBE\u7F6E\uFF0C\u8FDE\u63A5\u5BC6\u94A5\u5E76\u9009\u62E9\u516D\u4E2A\u5C97\u4F4D\u6A21\u578B\u3002"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-jev-metrics", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u5F53\u524D\u5206\u6863" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: state ? `${state.lane} \xB7 ${LANE[state.lane] || state.lane}` : "\u7B49\u5F85 Jev \u5206\u7C7B" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u8C03\u5EA6\u8F6E\u6B21" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("strong", { children: [
          state?.round ?? 0,
          " / ",
          (snapshot?.limits || settings.limits).maxRounds
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "Jev \u51B3\u7B56\u8BB0\u5F55" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("strong", { children: [
          state?.decisions.length ?? 0,
          " \u6761 ",
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("small", { children: [
            "\u8C03\u7528\u4E0A\u9650 ",
            (snapshot?.limits || settings.limits).maxJevCalls
          ] })
        ] })
      ] })
    ] }),
    latestDecision && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-jev-next", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("strong", { children: [
        "\u6700\u65B0\u51B3\u7B56 \xB7 ",
        latestDecision.action
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: latestDecision.reason })
    ] }),
    !!state?.decisions.length && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("details", { className: "tm-jev-decisions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("summary", { children: [
        "\u72EC\u7ACB Jev \u51B3\u7B56\u5386\u53F2 \xB7 ",
        state.decisions.length,
        " \u6761",
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "chevron" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ol", { children: state.decisions.map((decision, index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("strong", { children: [
            decision.phase,
            " \u2192 ",
            decision.action
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
            "\u7B2C ",
            decision.round,
            " \u8F6E \xB7 ",
            decision.lane,
            " \xB7 \u7F6E\u4FE1\u5EA6 ",
            Number.isFinite(decision.confidence) ? `${Math.round(decision.confidence * 100)}%` : "\u672A\u62A5\u544A"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: decision.reason })
      ] }, index)) })
    ] }),
    jevNode && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "tm-jev-inspect", onClick: () => onSelectNode(jevNode), children: [
      "\u67E5\u770B\u6700\u65B0 Jev \u8282\u70B9",
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "arrow" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-gates", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-gates-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h4", { children: "\u786C\u6027\u5B8C\u6210\u6761\u4EF6" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: passed ? "is-passed" : "", children: passed ? fixture ? "Fixture \u6761\u4EF6\u901A\u8FC7" : "\u5168\u90E8\u901A\u8FC7" : snapshot?.status === "completed" ? "\u5B8C\u6210\u6761\u4EF6\u672A\u6EE1\u8DB3" : "\u672A\u5168\u90E8\u901A\u8FC7" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ul", { children: gates.map((gate) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("li", { className: gate.value === true ? "is-passed" : gate.value === false ? "is-failed" : "is-pending", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: gate.value === true ? "check" : gate.value === false ? "close" : "clock" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: gate.label }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("small", { children: gate.value === true ? "\u901A\u8FC7" : gate.value === false ? "\u672A\u901A\u8FC7" : "\u5F85\u9A8C\u8BC1" })
      ] }, gate.label)) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: evidence?.reason || "\u670D\u52A1\u7AEF\u5C1A\u672A\u63D0\u4F9B\u5B8C\u6210\u8BC1\u636E\u3002Jev \u6216\u5BA1\u67E5\u8005\u7684\u5B8C\u6210\u5EFA\u8BAE\u4E0D\u80FD\u8DF3\u8FC7\u8FD9\u4E9B\u68C0\u67E5\u3002" })
    ] })
  ] }) });
}
function Topology({ snapshot, settings, catalog, selected, onSelect }) {
  const roles = snapshot?.roles || settings.roles;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-topology", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-topology-map", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { className: "tm-topology-wires tm-topology-wires--wide", viewBox: "0 0 840 392", preserveAspectRatio: "none", "aria-hidden": "true", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M140 54H420M420 82V196M560 196H700V54M280 196H140V54M420 250V280H140V312M420 280V312M420 280H700V312" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "420", cy: "280", r: "4" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { className: "tm-topology-wires tm-topology-wires--narrow", viewBox: "0 0 400 430", preserveAspectRatio: "none", "aria-hidden": "true", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M200 60V78H94V92M200 78H306V92M94 186V200H306V186M94 200V214M306 200V214M94 308V322H306V308M94 322V336M306 322V336" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "200", cy: "78", r: "3" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: `tm-controller-node ${selected === "jev" ? "is-selected" : ""}`, onClick: () => onSelect("jev"), "aria-pressed": selected === "jev", "aria-label": "\u67E5\u770B Jev \u6838\u5FC3\u8C03\u5EA6\u8BE6\u60C5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "tm-controller-symbol", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "route" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "Jev" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u72EC\u7ACB\u8C03\u5EA6\u63A7\u5236\u9762" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "chevron" })
      ] }),
      ["planner", "reviewer", "coordinator", "researcher", "explorer", "worker"].map((role) => {
        const nodes = snapshot?.nodes.filter((node) => node.role === role) || [];
        const status = roleStatus(nodes);
        return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: `tm-role-card tm-role-card--${role} ${selected === role ? "is-selected" : ""} ${status === "running" ? "is-active" : ""}`, onClick: () => onSelect(role), "aria-pressed": selected === role, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-role-top", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: `tm-role-icon tm-role-icon--${role}`, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: ROLE[role].icon }) }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "tm-role-mode", children: role === "coordinator" ? "\u56E2\u961F\u4E2D\u67A2" : role === "worker" ? "\u4E32\u884C\u7F16\u8F91" : role === "researcher" || role === "explorer" ? "\u5E76\u884C\u53EA\u8BFB" : "\u6309\u9700\u53C2\u4E0E" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-role-title", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: ROLE[role].name }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: role.toUpperCase() })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "tm-role-model", title: modelName(roles[role], catalog, isFixture(snapshot)), children: modelName(roles[role], catalog, isFixture(snapshot)) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-role-bottom", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Status2, { status, count: nodes.filter((node) => node.status === "running").length }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
              nodes.length ? `${nodes.length} \u4E2A\u8282\u70B9` : "\u5C97\u4F4D\u914D\u7F6E",
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "chevron" })
            ] })
          ] })
        ] }, role);
      })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-map-footer", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("i", { className: "tm-dashed-line" }),
        "\u5C97\u4F4D\u5173\u7CFB\u793A\u610F\uFF0C\u8FDE\u7EBF\u4E0D\u4EE3\u8868\u5DF2\u8C03\u7528"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("i", { className: "tm-live-dot" }),
        "\u72B6\u6001\u6765\u81EA",
        isFixture(snapshot) ? "\u5408\u6210\u793A\u4F8B" : "\u5B9E\u9645\u8282\u70B9"
      ] })
    ] })
  ] });
}
function taskLayout(nodes, edges, vertical) {
  const ids = new Set(nodes.map((node) => node.id));
  const rank = /* @__PURE__ */ new Map();
  const visiting = /* @__PURE__ */ new Set();
  const incoming = new Map(nodes.map((node) => [node.id, [.../* @__PURE__ */ new Set([...node.dependsOn, ...edges.filter((edge) => edge.to === node.id && edge.kind !== "feedback").map((edge) => edge.from)])].filter((id) => ids.has(id) && id !== node.id)]));
  function visit(id) {
    if (rank.has(id)) return rank.get(id);
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const depth = Math.min(nodes.length, Math.max(0, ...(incoming.get(id) || []).map((parent) => visit(parent) + 1)));
    visiting.delete(id);
    rank.set(id, depth);
    return depth;
  }
  nodes.forEach((node) => visit(node.id));
  const columns = /* @__PURE__ */ new Map();
  nodes.forEach((node) => {
    const depth = rank.get(node.id);
    columns.set(depth, [...columns.get(depth) || [], node]);
  });
  const rows = Math.max(1, ...Array.from(columns.values()).map((column) => column.length));
  const ranks = Math.max(0, ...rank.values()) + 1;
  const height = vertical ? Math.max(320, ranks * 146 + 32) : Math.max(320, rows * 156 + 68);
  const positions = /* @__PURE__ */ new Map();
  const width = vertical ? Math.max(360, rows * 186 + 26) : Math.max(490, ranks * 236 + 24);
  columns.forEach((column, depth) => column.forEach((node, index) => positions.set(node.id, vertical ? { x: (width - column.length * 186) / 2 + index * 186 + 13, y: 24 + depth * 146 } : { x: 24 + depth * 236, y: (height - column.length * 156) / 2 + index * 156 + 12 })));
  return { positions, width, height };
}
function TaskGraph({ snapshot, selected, onSelect }) {
  const [zoom, setZoom] = (0, import_react3.useState)(1);
  const [viewportWidth, setViewportWidth] = (0, import_react3.useState)(400);
  const graphRef = (0, import_react3.useRef)(null);
  const vertical = viewportWidth < 650;
  (0, import_react3.useEffect)(() => {
    const element = graphRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => setViewportWidth(entries[0]?.contentRect.width || 400));
    observer.observe(element);
    return () => observer.disconnect();
  }, [snapshot?.id, !!snapshot?.nodes.length]);
  const selectedRef = (0, import_react3.useRef)(null);
  (0, import_react3.useEffect)(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [selected]);
  const marker = (0, import_react3.useId)().replace(/:/g, "");
  const layout = (0, import_react3.useMemo)(() => taskLayout(snapshot?.nodes || [], snapshot?.edges || [], vertical), [snapshot?.nodes, snapshot?.edges, vertical]);
  if (!snapshot?.nodes.length) return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-empty-graph", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "tm-empty-icon", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "branch" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "\u4EFB\u52A1\u5173\u7CFB\u5C06\u5728\u6D3E\u53D1\u540E\u51FA\u73B0" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "\u53D1\u8D77 /team \u540E\uFF0C\u5DF2\u8BB0\u5F55\u7684\u6D3E\u53D1\u3001\u4F9D\u8D56\u4E0E\u53CD\u9988\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002" })
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: `tm-task-graph ${vertical ? "tm-task-graph--vertical" : ""}`, ref: graphRef, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-graph-tools", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
        snapshot.nodes.length,
        " \u4E2A\u8282\u70B9 \xB7 ",
        snapshot.edges.length,
        " \u6761\u5173\u7CFB"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-graph-controls", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "tm-fit-button", onClick: () => setZoom(Math.min(1, Math.max(0.5, Math.floor((viewportWidth - 12) / layout.width * 100) / 100))), children: "\u9002\u5E94" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { children: [
          "\u7F29\u653E",
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("select", { "aria-label": "\u4EFB\u52A1\u56FE\u7F29\u653E", value: zoom, onChange: (e) => setZoom(Number(e.target.value)), children: [
            ![0.5, 0.75, 1].includes(zoom) && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("option", { value: zoom, children: [
              Math.round(zoom * 100),
              "%"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: 0.5, children: "50%" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: 0.75, children: "75%" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: 1, children: "100%" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "tm-graph-scroll", tabIndex: 0, role: "region", "aria-label": "\u4EFB\u52A1\u5173\u7CFB\u56FE\uFF0C\u53EF\u6A2A\u5411\u6EDA\u52A8", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { width: layout.width * zoom, height: layout.height * zoom }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-task-canvas", style: { width: layout.width, height: layout.height, transform: `scale(${zoom})` }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { className: "tm-task-wires", width: layout.width, height: layout.height, "aria-hidden": "true", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("marker", { id: marker, markerWidth: "6", markerHeight: "6", refX: "5", refY: "3", orient: "auto-start-reverse", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M0 0 6 3 0 6", fill: "none", stroke: "currentColor", strokeWidth: "1" }) }) }),
        snapshot.edges.map((edge) => {
          const from = layout.positions.get(edge.from), to = layout.positions.get(edge.to);
          if (!from || !to) return null;
          const sx = from.x + 192, sy = from.y + 61, tx = to.x - 4, ty = to.y + 61;
          const skip = tx - sx > 100 || tx < sx;
          const verticalPath = `M${from.x + 80} ${from.y + 108} C${from.x + 80} ${from.y + 128}, ${to.x + 80} ${to.y - 20}, ${to.x + 80} ${to.y - 4}`;
          const d = vertical ? verticalPath : skip ? `M${sx} ${sy} C${sx + 22} ${sy}, ${sx + 22} 24, ${sx + 46} 24 L${tx - 28} 24 Q${tx - 8} 24 ${tx - 8} ${ty - 18} L${tx - 8} ${ty - 8} Q${tx - 8} ${ty} ${tx} ${ty}` : `M${sx} ${sy} C${sx + 22} ${sy}, ${tx - 22} ${ty}, ${tx} ${ty}`;
          return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { className: `tm-edge tm-edge--${edge.kind}`, children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("title", { children: `${EDGE[edge.kind]}\uFF1A${edge.from} \u2192 ${edge.to}` }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d, markerEnd: `url(#${marker})` })
          ] }, edge.id);
        })
      ] }),
      snapshot.nodes.map((node) => {
        const position = layout.positions.get(node.id);
        return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", ref: selected === node.id ? selectedRef : void 0, className: `tm-task-node tm-task-node--${node.status} ${selected === node.id ? "is-selected" : ""}`, style: { left: position.x, top: position.y }, onClick: () => onSelect(node), "aria-pressed": selected === node.id, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "tm-task-role", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: node.kind === "verification" ? "review" : ROLE[node.role]?.icon || "file" }),
            node.kind === "verification" ? "\u5BBF\u4E3B\u9A8C\u8BC1" : ROLE[node.role]?.name || node.role,
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("small", { children: [
              "#",
              node.attempt
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: node.title }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "tm-task-foot", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Status2, { status: node.status }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
              node.output ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "file" }) : null,
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "chevron" })
            ] })
          ] })
        ] }, node.id);
      })
    ] }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-map-footer", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("i", { className: "tm-solid-line" }),
        "\u6D3E\u53D1 / \u4F9D\u8D56 / \u6C47\u603B"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("i", { className: "tm-feedback-line" }),
        "\u53CD\u9988"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("i", { className: "tm-retry-line" }),
        "\u91CD\u8BD5 \xB7 \u72EC\u7ACB\u8282\u70B9"
      ] })
    ] })
  ] });
}
function Inspector({ role, node, snapshot, settings, catalog, onSelectNode, onConfigure, onBack }) {
  const verificationNode = node?.kind === "verification";
  const definition = verificationNode ? { name: "\u5BBF\u4E3B\u9A8C\u8BC1", subtitle: "\u72EC\u7ACB\u5B8C\u6210\u68C0\u67E5", icon: "review", description: "\u7531\u5BBF\u4E3B\u8FD0\u884C\u670D\u52A1\u7AEF\u5141\u8BB8\u7684\u9A8C\u8BC1\u914D\u7F6E\uFF0C\u5E76\u68C0\u67E5\u4FEE\u6539\u8303\u56F4\u4E0E\u5DEE\u5F02\u8BC1\u636E\u3002\u6B64\u8282\u70B9\u4E0D\u662F\u6A21\u578B\u81EA\u62A5\u6210\u529F\u3002", access: "\u56FA\u5B9A\u670D\u52A1\u7AEF\u9A8C\u8BC1\u914D\u7F6E" } : ROLE[role] || ROLE.worker;
  const selection = role === "jev" || verificationNode ? void 0 : (snapshot?.roles || settings.roles)[role];
  const nodes = snapshot?.nodes.filter((item) => item.role === role) || [];
  const relations = node ? snapshot?.edges.filter((edge) => edge.from === node.id || edge.to === node.id) || [] : [];
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("aside", { className: "tm-inspector", "aria-label": node ? "\u8282\u70B9\u8BE6\u60C5" : "\u5C97\u4F4D\u8BE6\u60C5", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "tm-inspector-back", onClick: onBack, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "arrow" }),
      "\u8FD4\u56DE\u56FE\u8C31"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-section-eyebrow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: node ? "\u8282\u70B9\u8BE6\u60C5" : "\u5C97\u4F4D\u8BE6\u60C5" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: node ? `\u7B2C ${node.attempt} \u6B21\u6267\u884C` : "ROLE PROFILE" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-inspector-heading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: `tm-role-icon tm-role-icon--${role}`, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: definition.icon }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { children: node?.title || definition.name }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Status2, { status: node?.status || roleStatus(nodes) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "tm-role-description", children: definition.description }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("dl", { className: "tm-facts", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "\u8D1F\u8D23\u89D2\u8272" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: definition.name })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: role === "jev" || verificationNode ? "\u6267\u884C\u65B9\u5F0F" : "\u6A21\u578B" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: verificationNode ? "\u670D\u52A1\u7AEF\u9A8C\u8BC1\u68C0\u67E5" : role === "jev" ? "Jev \xB7 \u72EC\u7ACB\u670D\u52A1" : modelName(selection, catalog, isFixture(snapshot)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "\u63D0\u4F9B\u65B9" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: verificationNode ? isFixture(snapshot) || snapshot?.jev?.mode === "fixture" ? "Fixture \xB7 \u5408\u6210\u9A8C\u8BC1" : "\u5F53\u524D\u5BBF\u4E3B" : role === "jev" ? isFixture(snapshot) || catalog.jev?.mode === "fixture" ? "Fixture \xB7 \u672A\u8FDE\u63A5 TypeSafe" : catalog.jev?.configured && catalog.jev.available ? "TypeSafe \xB7 \u670D\u52A1\u7AEF\u5DF2\u914D\u7F6E" : "TypeSafe \xB7 \u672A\u8FDE\u63A5\u670D\u52A1" : isFixture(snapshot) && !selection?.provider ? "\u5408\u6210\u793A\u4F8B" : providerName(selection, catalog) })
      ] }),
      selection?.reasoningEffort && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "\u601D\u8003\u5F3A\u5EA6" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: catalog.providers.find((p) => p.id === selection.provider)?.models.find((m) => m.id === selection.model)?.efforts?.find((e) => e.id === selection.reasoningEffort)?.name || selection.reasoningEffort })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "\u5DE5\u4F5C\u65B9\u5F0F" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: definition.access })
      ] }),
      node && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "\u5F00\u59CB\u65F6\u95F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: time(node.startedAt) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "\u7ED3\u675F\u65F6\u95F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: time(node.finishedAt) })
        ] })
      ] })
    ] }),
    !snapshot && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "tm-button tm-button--wide", onClick: onConfigure, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "settings" }),
      "\u914D\u7F6E\u89D2\u8272\u6A21\u578B",
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "arrow" })
    ] }),
    node ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "tm-evidence", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-mini-heading", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h4", { children: "\u8F93\u51FA\u4E0E\u8BC1\u636E" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u539F\u6587" })
        ] }),
        node.output ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("pre", { children: node.output }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-inline-empty", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "file" }),
          "\u5C1A\u65E0\u516C\u5F00\u8F93\u51FA"
        ] }),
        node.error && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-node-error", role: "status", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "\u9519\u8BEF\u4FE1\u606F" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("pre", { children: node.error })
        ] })
      ] }),
      relations.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "tm-relations", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h4", { children: "\u5173\u8054\u8BB0\u5F55" }),
        relations.map((edge) => {
          const other = snapshot?.nodes.find((item) => item.id === (edge.from === node.id ? edge.to : edge.from));
          return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", disabled: !other, onClick: () => other && onSelectNode(other), children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: `tm-relation-tag tm-relation-tag--${edge.kind}`, children: EDGE[edge.kind] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: other?.title || (edge.from === node.id ? edge.to : edge.from) }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "chevron" })
          ] }, edge.id);
        })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("details", { className: "tm-source", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("summary", { children: [
          "\u6765\u6E90\u6807\u8BC6",
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "chevron" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "\u8282\u70B9 ID" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: node.id }),
          node.taskId && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "\u4EFB\u52A1 ID" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: node.taskId })
          ] }),
          node.childId && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "\u5B50\u4F1A\u8BDD ID" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: node.childId })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "\u8FD0\u884C ID" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: snapshot?.id })
        ] })
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "tm-role-work", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-mini-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h4", { children: "\u5DF2\u6D3E\u53D1\u8282\u70B9" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: nodes.length })
      ] }),
      nodes.length ? nodes.map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", onClick: () => onSelectNode(item), children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: item.title }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("small", { children: [
            "\u7B2C ",
            item.attempt,
            " \u6B21\u6267\u884C"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Status2, { status: item.status }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "chevron" })
      ] }, item.id)) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-inline-empty", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "branch" }),
        "\u8FD9\u4E2A\u5C97\u4F4D\u8FD8\u6CA1\u6709\u6D3E\u53D1\u8BB0\u5F55"
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-inspector-note", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "lock" }),
      isFixture(snapshot) ? "\u5408\u6210\u6570\u636E \xB7 \u4EC5\u4F9B\u4F53\u9A8C" : "\u53EA\u5C55\u793A\u516C\u5F00\u4EA7\u51FA\u4E0E\u771F\u5B9E\u8BB0\u5F55"
    ] })
  ] });
}
var LIMIT_FIELDS = [
  { key: "concurrency", label: "\u5E76\u53D1\u4E0A\u9650", min: 1, max: 4, suffix: "\u4E2A" },
  { key: "maxAgents", label: "\u603B\u6D3E\u53D1\u4E0A\u9650", min: 1, max: 32, suffix: "\u6B21" },
  { key: "maxTasks", label: "\u4EFB\u52A1\u6570\u91CF\u4E0A\u9650", min: 1, max: 12, suffix: "\u9879" },
  { key: "maxRetries", label: "\u5355\u4EFB\u52A1\u6700\u5927\u91CD\u8BD5", min: 0, max: 2, suffix: "\u6B21" },
  { key: "maxRounds", label: "\u8C03\u5EA6\u8F6E\u6B21\u4E0A\u9650", min: 1, max: 8, suffix: "\u8F6E" },
  { key: "maxJevCalls", label: "Jev \u8C03\u7528\u4E0A\u9650", min: 1, max: 20, suffix: "\u6B21" },
  { key: "maxDurationMs", label: "\u8FD0\u884C\u8D85\u65F6", min: 1, max: 30, suffix: "\u5206\u949F", factor: 6e4 },
  { key: "maxStepsPerAgent", label: "\u6BCF\u4E2A\u667A\u80FD\u4F53\u6700\u5927\u6B65\u6570", min: 1, max: 16, suffix: "\u6B65" }
];
function TeamSettingsView({ setup, catalog, credential, loading = false, saving = false, error, notice, onSave, onClose, onRefresh, onModelSelectionChange }) {
  const theme2 = useTeamTheme();
  const [settings, setSettings] = (0, import_react3.useState)(setup.settings);
  const [settingsRole, setSettingsRole] = (0, import_react3.useState)("planner");
  const [disclosureAccepted, setDisclosureAccepted] = (0, import_react3.useState)(setup.disclosureAccepted);
  const [keyDraft, setKeyDraft] = (0, import_react3.useState)("");
  const [localError, setLocalError] = (0, import_react3.useState)();
  const [submitting, setSubmitting] = (0, import_react3.useState)(false);
  const saveLock = (0, import_react3.useRef)(false);
  (0, import_react3.useEffect)(() => {
    setSettings(setup.settings);
    setDisclosureAccepted(setup.disclosureAccepted);
    setKeyDraft("");
  }, [setup.revision, setup.settings, setup.disclosureAccepted]);
  const disabled = loading || saving || submitting || setup.writable === false;
  const missingRoles = validateSettings(settings, catalog);
  const invalidLimits = LIMIT_FIELDS.some((field) => !Number.isInteger(settings.limits[field.key]) || settings.limits[field.key] < field.min * (field.factor || 1) || settings.limits[field.key] > field.max * (field.factor || 1));
  const keyReady = !!credential?.configured || setup.keyConfigured || !!keyDraft.trim() && !!credential?.writable;
  const revokingConsent = setup.disclosureAccepted && !disclosureAccepted;
  const canSave = !disabled && !missingRoles.length && !invalidLimits && (revokingConsent || catalog.available && disclosureAccepted && keyReady);
  function update(role, selection) {
    const clean = { provider: selection.provider, model: selection.model };
    if (selection.reasoningEffort) clean.reasoningEffort = selection.reasoningEffort;
    if (selection.maxTokens !== void 0) clean.maxTokens = selection.maxTokens;
    const roles = { ...settings.roles, [role]: clean };
    setSettings((current) => ({ ...current, roles }));
    onModelSelectionChange?.(roles);
  }
  async function save() {
    if (!canSave || saveLock.current) return;
    saveLock.current = true;
    setSubmitting(true);
    setLocalError(void 0);
    const enteredKey = keyDraft.trim();
    setKeyDraft("");
    try {
      await onSave({ settings, disclosureAccepted, ...enteredKey ? { jevKey: enteredKey } : {} });
    } catch {
      setLocalError("\u4FDD\u5B58\u672A\u5B8C\u6210\u3002\u8BF7\u5237\u65B0\u786E\u8BA4\u5DF2\u4FDD\u5B58\u7684\u8BBE\u7F6E\uFF0C\u518D\u91CD\u8BD5\uFF1B\u5BC6\u94A5\u8F93\u5165\u5DF2\u6E05\u7A7A\u3002");
    } finally {
      saveLock.current = false;
      setSubmitting(false);
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-root tm-setup-root", "data-theme": theme2, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("style", { children: team_default }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("style", { children: team_theme_default }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "tm-settings", "aria-label": "\u56E2\u961F\u4E00\u6B21\u6027\u8BBE\u7F6E", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "tm-section-eyebrow", children: "\u56E2\u961F\u8BBE\u7F6E / \u539F\u751F Desktop" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { children: "\u914D\u7F6E\u4E00\u6B21\uFF0C\u4EE5\u540E\u76F4\u63A5 /team" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "\u9009\u62E9\u516D\u4E2A\u5C97\u4F4D\u6A21\u578B\u5E76\u8FDE\u63A5 Jev\u3002\u4FDD\u5B58\u540E\uFF0C\u5728\u9879\u76EE\u804A\u5929\u8F93\u5165 /team \u548C\u4EFB\u52A1\u76EE\u6807\u5373\u53EF\u542F\u52A8\u3002" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-settings-header-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(TeamThemeSwitch, { theme: theme2 }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "tm-icon-button", onClick: () => {
            setKeyDraft("");
            onClose();
          }, "aria-label": "\u5173\u95ED\u56E2\u961F\u8BBE\u7F6E", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "close" }) })
        ] })
      ] }),
      (error || localError) && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "tm-notice tm-notice--error", role: "alert", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "alert" }),
        error || localError
      ] }),
      notice && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "tm-notice", role: "status", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "check" }),
        notice
      ] }),
      !catalog.available && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "tm-notice tm-notice--warning", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "alert" }),
        catalog.reason || "\u65E0\u6CD5\u8BFB\u53D6\u5BBF\u4E3B\u6A21\u578B\u76EE\u5F55\uFF0C\u8BF7\u5237\u65B0\u91CD\u8BD5\u3002"
      ] }),
      setup.writable === false && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "tm-notice tm-notice--warning", role: "status", children: "\u5F53\u524D\u5BBF\u4E3B\u7684\u56E2\u961F\u8BBE\u7F6E\u4E0D\u53EF\u5199\uFF0C\u8BF7\u68C0\u67E5\u4F7F\u7528\u7684 Desktop profile \u540E\u5237\u65B0\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "tm-key-config", "aria-label": "Jev \u8FDE\u63A5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h4", { children: "Jev API \u5BC6\u94A5" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: credential?.configured || setup.keyConfigured ? "\u5DF2\u4FDD\u5B58 \xB7 \u4E0D\u56DE\u663E\u5BC6\u94A5" : "\u5C1A\u672A\u8FDE\u63A5" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "\u5BC6\u94A5\u4EC5\u901A\u8FC7 Desktop \u539F\u751F\u51ED\u636E\u670D\u52A1\u4FDD\u5B58\uFF0C\u4E0D\u8FDB\u5165\u6A21\u578B\u914D\u7F6E\u3001\u804A\u5929\u6216\u8FD0\u884C\u8BB0\u5F55\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { children: [
          credential?.configured || setup.keyConfigured ? "\u66FF\u6362\u5BC6\u94A5\uFF08\u53EF\u9009\uFF09" : "\u8F93\u5165 Jev API \u5BC6\u94A5",
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "password", "aria-label": "Jev API \u5BC6\u94A5", autoComplete: "new-password", spellCheck: false, maxLength: 4096, value: keyDraft, disabled: disabled || !credential?.writable, onChange: (event) => setKeyDraft(event.target.value), placeholder: credential?.configured || setup.keyConfigured ? "\u7559\u7A7A\u4FDD\u7559\u5F53\u524D\u5BC6\u94A5" : "\u7531\u4F60\u8F93\u5165\uFF0C\u4E0D\u4F1A\u663E\u793A\u5DF2\u4FDD\u5B58\u7684\u5BC6\u94A5" })
        ] }),
        !credential?.writable && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "tm-config-lock", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "lock" }),
          credential?.configured ? "\u5F53\u524D\u51ED\u636E\u6765\u6E90\u4E0D\u5141\u8BB8\u5728\u6B64\u66FF\u6362\u3002" : "\u539F\u751F\u51ED\u636E\u5B58\u50A8\u6682\u4E0D\u53EF\u5199\uFF0C\u8BF7\u68C0\u67E5 Desktop \u7684\u51ED\u636E\u670D\u52A1\u540E\u5237\u65B0\u3002"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("details", { className: "tm-key-storage", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("summary", { children: [
            "\u5BC6\u94A5\u5982\u4F55\u4FDD\u5B58",
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "chevron" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "Desktop \u539F\u751F\u51ED\u636E\u5B58\u50A8\u4F7F\u7528\u672C\u5730\u660E\u6587\u6587\u4EF6\uFF0C\u5E76\u8BBE\u7F6E\u4EC5\u6587\u4EF6\u6240\u5C5E\u7528\u6237\u53EF\u8BFB\u5199\u7684\u6743\u9650\u3002\u5B83\u4E0D\u662F\u52A0\u5BC6\u4FDD\u9669\u5E93\uFF0C\u8BF7\u52FF\u5171\u4EAB\u51ED\u636E\u6587\u4EF6\u3002" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "tm-role-settings", "aria-label": "\u516D\u5C97\u4F4D\u6A21\u578B\u914D\u7F6E", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-settings-section-title", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h4", { children: "\u5C97\u4F4D\u6A21\u578B" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
            6 - missingRoles.length,
            " / 6 \u5DF2\u914D\u7F6E"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-role-settings-layout", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("nav", { className: "tm-role-selector", "aria-label": "\u9009\u62E9\u8981\u914D\u7F6E\u7684\u5C97\u4F4D", children: ROLES.map((role) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", "aria-pressed": settingsRole === role, onClick: () => setSettingsRole(role), children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: ROLE[role].icon }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: ROLE[role].name }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("small", { children: modelName(settings.roles[role], catalog) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: missingRoles.includes(role) ? "tm-config-missing" : "tm-config-ready", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: missingRoles.includes(role) ? "alert" : "check" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "chevron" })
          ] }, role)) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "tm-model-grid", children: ROLES.map((role) => {
            const selection = settings.roles[role] || { provider: "", model: "" };
            const provider = catalog.providers.find((item) => item.id === selection.provider);
            const model = provider?.models.find((item) => item.id === selection.model);
            return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("fieldset", { hidden: settingsRole !== role, className: "tm-model-config", disabled: disabled || !catalog.available, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("legend", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: `tm-role-icon tm-role-icon--${role}`, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: ROLE[role].icon }) }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: ROLE[role].name }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: ROLE[role].subtitle })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-config-selects", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { children: [
                  "\u63D0\u4F9B\u65B9",
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("select", { "aria-label": `${ROLE[role].name}\u63D0\u4F9B\u65B9`, value: selection.provider, onChange: (e) => update(role, { provider: e.target.value, model: "", maxTokens: selection.maxTokens }), children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "", children: "\u9009\u62E9\u63D0\u4F9B\u65B9" }),
                    selection.provider && !provider && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("option", { value: selection.provider, disabled: true, children: [
                      selection.provider,
                      " \xB7 \u5F53\u524D\u4E0D\u53EF\u7528"
                    ] }),
                    catalog.providers.map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: item.id, children: item.name }, item.id))
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { children: [
                  "\u6A21\u578B",
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("select", { "aria-label": `${ROLE[role].name}\u6A21\u578B`, value: selection.model, disabled: !provider || disabled || !catalog.available, onChange: (e) => {
                    const next = provider?.models.find((item) => item.id === e.target.value);
                    update(role, { ...selection, model: e.target.value, reasoningEffort: next?.defaultEffort });
                  }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "", children: "\u9009\u62E9\u6A21\u578B" }),
                    selection.model && !model && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("option", { value: selection.model, disabled: true, children: [
                      selection.model,
                      " \xB7 \u5F53\u524D\u4E0D\u53EF\u7528"
                    ] }),
                    provider?.models.map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: item.id, children: item.name }, item.id))
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("details", { className: "tm-advanced-model", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("summary", { children: [
                  "\u8BF7\u6C42\u8BBE\u7F6E",
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "chevron" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
                  !!model?.efforts?.length && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { children: [
                    "\u63A8\u7406\u5F3A\u5EA6",
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("select", { "aria-label": `${ROLE[role].name}\u63A8\u7406\u5F3A\u5EA6`, value: selection.reasoningEffort || "", onChange: (e) => update(role, { ...selection, reasoningEffort: e.target.value || void 0 }), children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "", children: "\u4F7F\u7528\u6A21\u578B\u9ED8\u8BA4\u503C" }),
                      model.efforts.map((effort) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: effort.id, children: effort.name }, effort.id))
                    ] })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { children: [
                    "\u6BCF\u6B21\u6A21\u578B\u8BF7\u6C42\u8F93\u51FA\u4E0A\u9650",
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { "aria-label": `${ROLE[role].name}\u6BCF\u6B21\u6A21\u578B\u8BF7\u6C42\u8F93\u51FA\u4E0A\u9650`, type: "number", min: 128, max: 32768, step: 128, value: selection.maxTokens ?? "", placeholder: "\u9ED8\u8BA4 4096 tokens", onChange: (e) => update(role, { ...selection, maxTokens: e.target.value === "" ? void 0 : Math.min(32768, Math.max(128, Math.trunc(Number(e.target.value)))) }) })
                  ] })
                ] })
              ] })
            ] }, role);
          }) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-config-switches", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "checkbox", checked: settings.reviewPlan, disabled, onChange: (e) => setSettings({ ...settings, reviewPlan: e.target.checked }) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "\u590D\u6838\u521D\u59CB\u65B9\u6848" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("small", { children: "\u89C4\u5212\u5B8C\u6210\u540E\u7531\u5BA1\u67E5\u8005\u590D\u6838" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "Jev \u6838\u5FC3\u8C03\u5EA6 \xB7 \u5FC5\u987B\u542F\u7528" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("small", { children: "\u5206\u6863\u53EA\u8C03\u6574\u6267\u884C\u6D41\u7A0B\uFF0C\u4E0D\u66F4\u6362\u6240\u9009\u6A21\u578B\u6216\u63D0\u4F9B\u65B9" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("details", { className: "tm-advanced-settings", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("summary", { children: [
          "\u9AD8\u7EA7\u8FD0\u884C\u9650\u5236",
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "chevron" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-limits-header", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h4", { children: "\u8FD0\u884C\u8FB9\u754C" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u53EA\u8BFB\u5DE5\u4F5C\u53EF\u5E76\u884C\uFF0C\u7F16\u8F91\u59CB\u7EC8\u4E32\u884C" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "tm-limits", children: LIMIT_FIELDS.map((field) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { children: [
          field.label,
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { "aria-label": field.label, type: "number", min: field.min, max: field.max, step: 1, disabled, value: settings.limits[field.key] / (field.factor || 1), onChange: (e) => {
              const value = Math.min(field.max, Math.max(field.min, Math.trunc(Number(e.target.value) || field.min)));
              setSettings({ ...settings, limits: { ...settings.limits, [field.key]: value * (field.factor || 1) } });
            } }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("small", { children: field.suffix })
          ] })
        ] }, field.key)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "tm-disclosure", "aria-label": "\u4EE5\u540E /team \u7684\u6570\u636E\u4F7F\u7528\u4E0E\u6743\u9650", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h4", { children: "\u4EE5\u540E\u6BCF\u6B21 /team \u7684\u5DE5\u4F5C\u65B9\u5F0F" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "\u4F60\u4E3B\u52A8\u53D1\u9001 /team \u65F6\uFF0C\u4EFB\u52A1\u76EE\u6807\u53CA\u5DE5\u5177\u8BFB\u53D6\u7684\u9879\u76EE\u4E0A\u4E0B\u6587\u4F1A\u53D1\u7ED9\u6240\u9009\u6A21\u578B\u63D0\u4F9B\u65B9\uFF1B\u6709\u9650\u7684\u76EE\u6807\u3001\u4E0A\u4E0B\u6587\u6458\u8981\u3001\u8BA1\u5212\u3001\u516C\u5F00\u4EA7\u51FA\u3001\u5DEE\u5F02\u548C\u9A8C\u8BC1\u8BC1\u636E\u4F1A\u53D1\u9001\u81F3 TypeSafe \u7684 Jev \u670D\u52A1\uFF0C\u7528\u4E8E\u5206\u7C7B\u548C\u9010\u8F6E\u8C03\u5EA6\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "\u7CFB\u7EDF\u4F1A\u5728\u5F53\u524D\u9879\u76EE\u5185\u53D1\u73B0\u5E76\u8FD0\u884C\u9002\u7528\u7684\u6D4B\u8BD5\u68C0\u67E5\uFF0C\u68C0\u67E5\u6587\u4EF6\u5DEE\u5F02\u4E0E\u4FEE\u6539\u8303\u56F4\u3002\u672A\u8BC6\u522B\u5230\u53EF\u5B89\u5168\u8FD0\u884C\u7684\u9A8C\u8BC1\u547D\u4EE4\u65F6\uFF0C\u4ECD\u53EF\u5728\u5141\u8BB8\u8303\u56F4\u5185\u4FEE\u6539\u9879\u76EE\uFF0C\u4F46\u7ED3\u679C\u4F1A\u6807\u4E3A\u201C\u5F85\u9A8C\u8BC1\u201D\uFF0C\u4E0D\u4F1A\u5BA3\u79F0\u9A8C\u8BC1\u901A\u8FC7\u3002\u6267\u884C\u8005\u4EC5\u5728\u5BBF\u4E3B\u5DF2\u6709\u6743\u9650\u5185\u4FEE\u6539\u9879\u76EE\uFF1B\u65B0\u589E\u6743\u9650\u4E0D\u4F1A\u81EA\u52A8\u6279\u51C6\u3002" }),
        catalog.jev?.disclosure && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: catalog.jev.disclosure }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "tm-endpoint", children: [
          "TypeSafe \u76EE\u6807\uFF1A",
          catalog.jev?.endpoint || "\u7B49\u5F85\u5BBF\u4E3B\u63D0\u4F9B\u670D\u52A1\u5730\u5740"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "checkbox", "aria-label": "\u540C\u610F\u4EE5\u540E\u4E3B\u52A8\u53D1\u8D77\u7684 team \u4EFB\u52A1", checked: disclosureAccepted, disabled, onChange: (event) => setDisclosureAccepted(event.target.checked) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u6211\u540C\u610F\u4EE5\u540E\u7531\u6211\u4E3B\u52A8\u53D1\u8D77\u7684 /team \u4EFB\u52A1\u6309\u4E0A\u8FF0\u65B9\u5F0F\u4F7F\u7528\u6240\u9009\u6A21\u578B\u3001\u53D1\u9001\u6709\u9650\u8BC1\u636E\u81F3 TypeSafe\uFF0C\u5E76\u53D1\u73B0\u548C\u8FD0\u884C\u5F53\u524D\u9879\u76EE\u7684\u9A8C\u8BC1\u68C0\u67E5\u3002" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-setup-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "tm-button", onClick: onRefresh, disabled: loading || saving || submitting, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "refresh" }),
          "\u5237\u65B0\u8BBE\u7F6E"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "tm-button tm-button--primary", onClick: () => void save(), disabled: !canSave, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "check" }),
          saving || submitting ? "\u6B63\u5728\u4FDD\u5B58\u2026" : loading ? "\u6B63\u5728\u8BFB\u53D6\u2026" : "\u4FDD\u5B58\u56E2\u961F\u8BBE\u7F6E"
        ] })
      ] }),
      missingRoles.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "tm-start-hint", children: [
        "\u8BF7\u9009\u62E9",
        missingRoles.map((role) => ROLE[role].name).join("\u3001"),
        "\u7684\u6709\u6548\u6A21\u578B\u3002\u4FDD\u5B58\u540E\u4E0D\u4F1A\u81EA\u52A8\u66FF\u6362\u6240\u9009\u6A21\u578B\u3002"
      ] })
    ] })
  ] });
}
function TeamView({ catalog, sessionId, sessionContext, snapshot, loading = false, error, onCancel, onRefresh, onDemo, settings, configured = false, onOpenSettings }) {
  const theme2 = useTeamTheme();
  const [graph, setGraph] = (0, import_react3.useState)("team");
  const [selectedRole, setSelectedRole] = (0, import_react3.useState)("coordinator");
  const [selectedNodeId, setSelectedNodeId] = (0, import_react3.useState)();
  const [activityOpen, setActivityOpen] = (0, import_react3.useState)(true);
  const [cancelling, setCancelling] = (0, import_react3.useState)(false);
  const [localError, setLocalError] = (0, import_react3.useState)();
  const cancelLock = (0, import_react3.useRef)(false);
  const cancelGeneration = (0, import_react3.useRef)(0);
  const prefix = (0, import_react3.useId)();
  const inspectorRef = (0, import_react3.useRef)(null);
  const canvasRef = (0, import_react3.useRef)(null);
  const demo = isFixture(snapshot);
  const active = !!snapshot && !demo && ACTIVE.has(snapshot.status);
  const selectedNode = snapshot?.nodes.find((node) => node.id === selectedNodeId);
  const role = selectedNode?.role || selectedRole;
  const nodes = snapshot?.nodes || [];
  const completed = nodes.filter((node) => node.status === "completed").length;
  const running = nodes.filter((node) => node.status === "running").length;
  const events = [...snapshot?.events || []].slice(-30).reverse();
  const runEvidence = snapshot?.jev?.evidence;
  const completionVerified = !!runEvidence && runEvidence.checksPassed && runEvidence.scopeOk && runEvidence.diffAvailable && runEvidence.verified;
  (0, import_react3.useEffect)(() => {
    cancelGeneration.current++;
    cancelLock.current = false;
    setSelectedNodeId(void 0);
    setLocalError(void 0);
    setCancelling(false);
  }, [snapshot?.id, sessionId]);
  (0, import_react3.useEffect)(() => () => {
    cancelGeneration.current++;
  }, []);
  const openSettings = onOpenSettings;
  function selectNode(node) {
    setSelectedNodeId(node.id);
    setSelectedRole(node.role);
  }
  function selectRole(next) {
    setSelectedRole(next);
    setSelectedNodeId(void 0);
  }
  async function cancel() {
    if (!active || cancelling || cancelLock.current) return;
    const generation = cancelGeneration.current;
    cancelLock.current = true;
    setCancelling(true);
    setLocalError(void 0);
    try {
      await onCancel();
    } catch (failure) {
      if (generation === cancelGeneration.current) setLocalError(failure instanceof Error ? failure.message : "\u65E0\u6CD5\u505C\u6B62\uFF0C\u8BF7\u5237\u65B0\u786E\u8BA4\u5F53\u524D\u72B6\u6001\u3002");
    } finally {
      if (generation === cancelGeneration.current) {
        setCancelling(false);
        cancelLock.current = false;
      }
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-root", "data-theme": theme2, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("style", { children: team_default }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("style", { children: team_theme_default }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-shell", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "tm-header", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-brand", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "tm-brand-mark", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "team" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-wordmark", children: [
              "DSH ",
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "/ WORKSPACE" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h1", { children: "\u667A\u80FD\u4F53\u56E2\u961F" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-header-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: `tm-button tm-button--quiet ${demo ? "is-demo" : ""}`, onClick: onDemo, disabled: active, children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "play" }),
            "\u6F14\u793A"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "tm-icon-button", onClick: () => void onRefresh(), disabled: loading, "aria-label": demo ? "\u8FD4\u56DE\u5B9E\u65F6\u89C6\u56FE" : "\u5237\u65B0\u56E2\u961F\u72B6\u6001", title: demo ? "\u8FD4\u56DE\u5B9E\u65F6\u89C6\u56FE" : "\u5237\u65B0\u56E2\u961F\u72B6\u6001", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "refresh", className: loading ? "is-spinning" : "" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(TeamThemeSwitch, { theme: theme2 })
        ] })
      ] }),
      demo && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-demo-banner", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u6F14\u793A" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "\u5408\u6210\u6570\u636E \xB7 \u672A\u8C03\u7528\u771F\u5B9E\u6A21\u578B\u6216 TypeSafe\uFF0C\u672A\u4FEE\u6539\u9879\u76EE\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", onClick: () => void onRefresh(), children: [
          "\u8FD4\u56DE\u5B9E\u65F6",
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "arrow" })
        ] })
      ] }),
      (error || localError) && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-notice tm-notice--error", role: "alert", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "alert" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: localError || error })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("main", { className: "tm-main", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "tm-overview", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-section-eyebrow", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: snapshot ? "\u5F53\u524D\u4EFB\u52A1" : "\u5DE5\u4F5C\u53F0" }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "tm-session", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("i", {}),
                demo ? "\u793A\u4F8B\u4F1A\u8BDD" : sessionId ? "\u5DF2\u8FDE\u63A5\u5F53\u524D\u4F1A\u8BDD" : "\u7B49\u5F85 Desktop \u4F1A\u8BDD"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: snapshot?.goal || (configured ? "\u56E2\u961F\u5DF2\u5C31\u4F4D" : "\u8FDE\u63A5\u4F60\u7684\u5DE5\u4F5C\u56E2\u961F") }),
            snapshot ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("details", { className: "tm-run-description", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("summary", { children: [
                "\u8FD0\u884C\u8BF4\u660E",
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "chevron" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: snapshot.message || "\u4EFB\u52A1\u6309\u5B9E\u9645\u9700\u8981\u6D3E\u53D1\uFF0C\u7814\u7A76\u4E0E\u63A2\u7D22\u5E76\u884C\uFF0C\u7F16\u8F91\u5DE5\u4F5C\u4E32\u884C\u3002" })
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "\u5728\u804A\u5929\u4E2D\u4F7F\u7528 /team \u53D1\u8D77\u4EFB\u52A1\u3002" })
          ] }),
          snapshot && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-run-state", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Status2, { status: snapshot.status === "completed" && !completionVerified ? "completion_unverified" : snapshot.status }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: snapshot.finishedAt ? duration(snapshot) : `\u5F00\u59CB\u4E8E ${time(snapshot.startedAt)}` })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-summary-strip", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "team" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u5C97\u4F4D" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "6" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "branch" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u8282\u70B9" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: nodes.length })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "activity" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u6267\u884C\u4E2D" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("strong", { children: [
              running,
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("small", { children: [
                " / ",
                (snapshot?.limits || settings.limits).concurrency
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "check" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u5B8C\u6210" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: completed })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(JevPanel, { catalog, snapshot, settings, onSelectNode: (node) => {
          setGraph("tasks");
          selectNode(node);
        } }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-workspace", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "tm-graph-panel", ref: canvasRef, "aria-label": "\u56E2\u961F\u4E0E\u4EFB\u52A1\u53EF\u89C6\u5316", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-panel-header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-tabs", role: "tablist", "aria-label": "\u56FE\u8868\u89C6\u56FE", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", role: "tab", id: `${prefix}-team-tab`, "aria-controls": `${prefix}-graph`, "aria-selected": graph === "team", tabIndex: graph === "team" ? 0 : -1, onClick: () => setGraph("team"), onKeyDown: (e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    setGraph("tasks");
                    e.currentTarget.nextElementSibling?.focus();
                  }
                }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "team" }),
                  "\u56E2\u961F\u62D3\u6251"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", role: "tab", id: `${prefix}-tasks-tab`, "aria-controls": `${prefix}-graph`, "aria-selected": graph === "tasks", tabIndex: graph === "tasks" ? 0 : -1, onClick: () => setGraph("tasks"), onKeyDown: (e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    setGraph("team");
                    e.currentTarget.previousElementSibling?.focus();
                  }
                }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "branch" }),
                  "\u4EFB\u52A1\u5173\u7CFB",
                  nodes.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: nodes.length })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "tm-button tm-button--quiet tm-config-trigger", "aria-label": "\u56E2\u961F\u8BBE\u7F6E", onClick: openSettings, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "settings" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u56E2\u961F\u8BBE\u7F6E" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "tm-graph-caption", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: graph === "team" ? "\u5C97\u4F4D\u914D\u7F6E" : "\u52A8\u6001\u4EFB\u52A1\u56FE" }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "tm-graph-context", children: selectedNode ? selectedNode.title : ROLE[role].name }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "tm-inspect-jump", onClick: () => inspectorRef.current?.scrollIntoView({ block: "start", behavior: "auto" }), children: [
                "\u67E5\u770B\u8BE6\u60C5",
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "arrow" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { role: "tabpanel", id: `${prefix}-graph`, "aria-labelledby": `${prefix}-${graph}-tab`, children: graph === "team" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Topology, { snapshot, settings, catalog, selected: !selectedNodeId ? role : void 0, onSelect: selectRole }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(TaskGraph, { snapshot, selected: selectedNodeId, onSelect: selectNode }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "tm-inspector-wrap", ref: inspectorRef, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Inspector, { role, node: selectedNode, snapshot, settings, catalog, onSelectNode: selectNode, onConfigure: openSettings, onBack: () => canvasRef.current?.scrollIntoView({ block: "start", behavior: "auto" }) }) })
        ] }),
        snapshot && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "tm-activity", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "tm-activity-toggle", onClick: () => setActivityOpen(!activityOpen), "aria-expanded": activityOpen, "aria-controls": `${prefix}-events`, children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "activity" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "\u56E2\u961F\u52A8\u6001" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
              demo ? "\u5408\u6210\u4E8B\u4EF6" : "\u6700\u8FD1\u4E8B\u4EF6",
              " \xB7 ",
              Math.min(snapshot.events.length, 30),
              " \u6761"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "chevron" })
          ] }),
          activityOpen && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { id: `${prefix}-events`, className: "tm-event-list", "aria-label": "\u6700\u8FD1\u56E2\u961F\u4E8B\u4EF6", children: [
            events.length ? events.map((event) => {
              const eventNode = nodes.find((node) => node.id === event.nodeId);
              return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: `tm-event ${/retry|feedback/.test(event.type) ? "tm-event--feedback" : ""}`, disabled: !eventNode, onClick: () => eventNode && selectNode(eventNode), children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "tm-event-icon", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: /retry|feedback/.test(event.type) ? "refresh" : eventNode ? eventNode.kind === "verification" ? "review" : ROLE[eventNode.role]?.icon || "activity" : "activity" }) }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: eventNode ? eventNode.kind === "verification" ? "\u5BBF\u4E3B\u9A8C\u8BC1" : ROLE[eventNode.role]?.name || eventNode.role : "\u56E2\u961F" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: event.message }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("time", { dateTime: event.at, children: time(event.at) })
              ] }, event.seq);
            }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "tm-inline-empty", children: "\u5C1A\u65E0\u4E8B\u4EF6\u8BB0\u5F55" }),
            snapshot.events.length > 30 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "tm-event-bound", children: "\u663E\u793A\u6700\u8FD1 30 \u6761\u4E8B\u4EF6\uFF0C\u8282\u70B9\u8BE6\u60C5\u4FDD\u7559\u72EC\u7ACB\u4EA7\u51FA\u3002" })
          ] })
        ] }),
        active ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "tm-running-bar", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "tm-running-indicator" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "\u56E2\u961F\u6B63\u5728\u5904\u7406\u5F53\u524D\u4EFB\u52A1" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "\u505C\u6B62\u53EA\u5F71\u54CD\u672C\u6B21\u8FD0\u884C\uFF1B\u4E0D\u4F1A\u56DE\u6EDA\u5DF2\u7ECF\u4EA7\u751F\u7684\u6587\u4EF6\u4FEE\u6539\u3002" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "tm-button tm-button--danger", onClick: () => void cancel(), disabled: cancelling, children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "stop" }),
            cancelling ? "\u6B63\u5728\u505C\u6B62\u2026" : "\u505C\u6B62\u672C\u6B21\u8FD0\u884C"
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "tm-command-guide", "aria-label": "\u4F7F\u7528 team \u547D\u4EE4", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "tm-command-icon", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "team" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { children: configured ? "\u5728\u804A\u5929\u4E2D\u7ED9\u56E2\u961F\u4E00\u4E2A\u76EE\u6807" : "\u5148\u5B8C\u6210\u4E00\u6B21\u56E2\u961F\u8BBE\u7F6E" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: configured ? "\u8F93\u5165 /team \u548C\u4EFB\u52A1\u76EE\u6807\uFF0C\u56E2\u961F\u4F1A\u81EA\u52A8\u5F00\u59CB\uFF0C\u8FDB\u5C55\u663E\u793A\u5728\u8FD9\u91CC\u3002" : "\u9009\u62E9\u516D\u4E2A\u5C97\u4F4D\u6A21\u578B\u3001\u4FDD\u5B58 Jev \u5BC6\u94A5\u540E\uFF0C\u4EE5\u540E\u76F4\u63A5\u5728\u804A\u5929\u4E2D\u4F7F\u7528 /team\u3002" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("code", { children: "/team \u68C0\u67E5\u8D2D\u7269\u8F66\u6570\u91CF\u66F4\u65B0\u95EE\u9898\uFF0C\u4FEE\u590D\u5B9E\u73B0\u5E76\u9A8C\u8BC1" }),
            sessionContext?.reason && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "tm-start-hint", children: sessionContext.reason }),
            !sessionId && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "tm-start-hint", children: "\u8BF7\u5148\u5728 Desktop \u6253\u5F00\u4E00\u4E2A\u9879\u76EE\u4F1A\u8BDD\u3002" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "tm-button", onClick: openSettings, children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "settings" }),
            configured ? "\u56E2\u961F\u8BBE\u7F6E" : "\u5B8C\u6210\u8BBE\u7F6E",
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "arrow" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("footer", { className: "tm-footer", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon2, { name: "lock" }),
            demo ? "\u5168\u90E8\u4E3A\u5408\u6210\u793A\u4F8B \xB7 \u672A\u6D3E\u53D1\u667A\u80FD\u4F53" : "\u516D\u5C97\u4F4D\u72EC\u7ACB\u9009\u578B \xB7 Jev \u6838\u5FC3\u8C03\u5EA6 \xB7 \u786C\u6027\u5B8C\u6210\u9A8C\u8BC1"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
            "DSH ",
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("i", {}),
            " TEAM WORKFLOW"
          ] })
        ] })
      ] })
    ] })
  ] });
}

// client/team-demo.ts
function createTeamDemo() {
  const settings = createDefaultTeamSettings();
  const demoModels = {
    planner: "\u6F14\u793A \xB7 \u5F3A\u89C4\u5212\u6A21\u578B",
    coordinator: "\u6F14\u793A \xB7 \u4E3B\u529B\u534F\u8C03\u6A21\u578B",
    researcher: "\u6F14\u793A \xB7 \u8F7B\u91CF\u7814\u7A76\u6A21\u578B",
    explorer: "\u6F14\u793A \xB7 \u4EE3\u7801\u63A2\u7D22\u6A21\u578B",
    worker: "\u6F14\u793A \xB7 \u4E3B\u529B\u6267\u884C\u6A21\u578B",
    reviewer: "\u6F14\u793A \xB7 \u5F3A\u5BA1\u67E5\u6A21\u578B"
  };
  for (const role of Object.keys(demoModels)) {
    settings.roles[role] = { provider: "\u6F14\u793A\u63D0\u4F9B\u65B9\uFF08\u672A\u8FDE\u63A5\uFF09", model: demoModels[role], maxTokens: 4096 };
  }
  const at = (minute, second = 0) => `2026-10-09T09:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}.000Z`;
  return {
    id: "demo-cart-branching",
    sessionId: "demo-session",
    demo: true,
    goal: "\u4FEE\u590D\u8D2D\u7269\u8F66\u6570\u91CF\u66F4\u65B0\uFF0C\u5E76\u8865\u9F50\u56DE\u5F52\u6D4B\u8BD5",
    status: "running",
    roles: settings.roles,
    limits: settings.limits,
    startedAt: at(41),
    jev: {
      mode: "fixture",
      lane: "medium",
      round: 1,
      decisions: [
        { phase: "classify", action: "classify", lane: "medium", confidence: 0.93, reason: "\u3010Fixture\u3011\u6D89\u53CA\u4EE3\u7801\u4FEE\u6539\u4E0E\u56DE\u5F52\u68C0\u67E5\uFF0C\u91C7\u7528\u6807\u51C6\u56E2\u961F\u6D41\u7A0B\uFF1B\u5C97\u4F4D\u6A21\u578B\u4E0D\u53D8\u3002", round: 0 },
        { phase: "step", action: "continue", lane: "medium", confidence: 0.89, reason: "\u3010Fixture\u3011\u65B9\u6848\u5DF2\u590D\u6838\uFF0C\u7EE7\u7EED\u6267\u884C\u3002\u5C1A\u65E0\u53EF\u4EA4\u4ED8\u7684\u9A8C\u8BC1\u8BC1\u636E\u3002", round: 1 }
      ],
      evidence: { checksPassed: false, scopeOk: true, diffAvailable: false, verified: false, reason: "\u3010Fixture\u3011\u6F14\u793A\u4ECD\u5728\u6267\u884C\uFF1A\u8303\u56F4\u68C0\u67E5\u901A\u8FC7\uFF0C\u6D4B\u8BD5\u4E0E\u5DEE\u5F02\u8BC1\u636E\u5C1A\u4E0D\u9F50\u5168\uFF0C\u4E0D\u80FD\u5224\u5B9A\u5B8C\u6210\u3002" }
    },
    message: "Fixture \u5408\u6210\u793A\u4F8B\uFF1AJev \u5B8C\u6210\u5206\u7C7B\u5E76\u9009\u62E9\u7EE7\u7EED\u6267\u884C\uFF1B\u7814\u7A76\u4E0E\u63A2\u7D22\u5E76\u884C\uFF0C\u6267\u884C\u6709\u754C\u91CD\u8BD5\u3002\u672A\u8C03\u7528\u6A21\u578B\u6216 TypeSafe\u3002",
    nodes: [
      { id: "jev-classify-1", role: "jev", kind: "jev_classify", title: "Jev \u5224\u5B9A\u6807\u51C6\u4EFB\u52A1\u6D41\u7A0B", status: "completed", attempt: 1, dependsOn: [], startedAt: at(41), finishedAt: at(41, 1), output: "\u3010Fixture\u3011lane: medium\uFF1Baction: classify\uFF1Bconfidence: 0.93\u3002\u72EC\u7ACB TypeSafe \u51B3\u7B56\u7684\u5408\u6210\u8BB0\u5F55\uFF0C\u672A\u53D1\u9001\u7F51\u7EDC\u8BF7\u6C42\u3002" },
      { id: "jev-step-1", role: "jev", kind: "jev_step", title: "Jev \u9009\u62E9\u7EE7\u7EED\u6267\u884C", status: "completed", attempt: 1, dependsOn: ["plan-review-1"], startedAt: at(41, 40), finishedAt: at(41, 41), output: "\u3010Fixture\u3011action: continue\uFF1Blane: medium\uFF1Bround: 1\u3002\u7F3A\u5C11\u6700\u7EC8\u6D4B\u8BD5\u4E0E\u5DEE\u5F02\u8BC1\u636E\uFF0C\u4E0D\u5141\u8BB8\u5B8C\u6210\u3002" },
      { id: "plan-1", role: "planner", kind: "plan", title: "\u62C6\u89E3\u95EE\u9898\u4E0E\u9A8C\u8BC1\u76EE\u6807", status: "completed", attempt: 1, dependsOn: ["jev-classify-1"], startedAt: at(41, 2), finishedAt: at(41, 18), output: "\u3010\u5408\u6210\u793A\u4F8B\u3011\n1. \u5E76\u884C\u786E\u8BA4\u6570\u91CF\u53D8\u66F4\u89C4\u5219\u4E0E\u72B6\u6001\u66F4\u65B0\u8DEF\u5F84\u3002\n2. \u6267\u884C\u89D2\u8272\u7B49\u5F85\u4E24\u9879\u8C03\u67E5\u5B8C\u6210\u540E\uFF0C\u7EDF\u4E00\u4FEE\u6539\u4EE3\u7801\u5E76\u8865\u9F50\u6D4B\u8BD5\u3002\n3. \u6700\u7EC8\u4EA7\u51FA\u4EA4\u7ED9\u5BA1\u67E5\u89D2\u8272\u3002\n\u672A\u8BFB\u53D6\u6216\u4FEE\u6539\u771F\u5B9E\u9879\u76EE\u3002" },
      { id: "coord-1", role: "coordinator", kind: "coordination", title: "\u7EC6\u5316\u4EFB\u52A1\u56FE\u4E0E\u4F9D\u8D56", status: "completed", attempt: 1, dependsOn: ["plan-1"], startedAt: at(41, 19), finishedAt: at(41, 28), output: "\u3010\u5408\u6210\u793A\u4F8B\u3011\u786E\u8BA4\u4E09\u4E2A\u4EFB\u52A1\uFF1A\u89C4\u5219\u7814\u7A76\u3001\u4EE3\u7801\u63A2\u7D22\u3001\u7EDF\u4E00\u4FEE\u590D\u3002\u524D\u4E24\u9879\u53EA\u8BFB\u5DE5\u4F5C\u53EF\u5E76\u884C\uFF1B\u4FEE\u590D\u4EFB\u52A1\u4F9D\u8D56\u4E24\u9879\u8C03\u67E5\u5B8C\u6210\u3002" },
      { id: "plan-review-1", role: "reviewer", kind: "review", title: "\u590D\u6838\u53EF\u6267\u884C\u65B9\u6848", status: "completed", attempt: 1, dependsOn: ["coord-1"], startedAt: at(41, 29), finishedAt: at(41, 40), output: "\u3010\u5408\u6210\u793A\u4F8B\u3011\u65B9\u6848\u901A\u8FC7\uFF1A\u4F9D\u8D56\u5B8C\u6574\uFF0C\u7F16\u8F91\u96C6\u4E2D\u5728\u6267\u884C\u89D2\u8272\uFF0C\u9A8C\u8BC1\u76EE\u6807\u5305\u542B\u6570\u91CF\u3001\u5E93\u5B58\u4E0E\u91D1\u989D\u4E00\u81F4\u6027\u3002" },
      { id: "research-1", taskId: "quantity-rules", role: "researcher", kind: "task", title: "\u786E\u8BA4\u6570\u91CF\u4E0E\u5E93\u5B58\u89C4\u5219", status: "completed", attempt: 1, dependsOn: [], startedAt: at(41, 41), finishedAt: at(42, 10), output: "\u3010\u5408\u6210\u793A\u4F8B\u3011\u6570\u91CF\u4E0D\u5F97\u5C0F\u4E8E 1\uFF1B\u4E0D\u80FD\u8D85\u51FA\u53EF\u7528\u5E93\u5B58\uFF1B\u53D8\u66F4\u540E\u9700\u540C\u6B65\u66F4\u65B0\u5546\u54C1\u5C0F\u8BA1\u548C\u603B\u989D\u3002" },
      { id: "explore-1", taskId: "trace-state", role: "explorer", kind: "task", title: "\u8FFD\u8E2A\u8D2D\u7269\u8F66\u72B6\u6001\u66F4\u65B0", status: "completed", attempt: 1, dependsOn: [], startedAt: at(41, 41), finishedAt: at(42, 18), output: "\u3010\u5408\u6210\u793A\u4F8B\u3011\u6570\u91CF\u8F93\u5165\u53D8\u5316\u540E\uFF0C\u5546\u54C1\u5C0F\u8BA1\u4ECD\u8BFB\u53D6\u65E7\u72B6\u6001\u3002\u5EFA\u8BAE\u5728\u7EDF\u4E00\u72B6\u6001\u66F4\u65B0\u4E2D\u91CD\u65B0\u8BA1\u7B97\u3002\n\u6B64\u6587\u5B57\u662F\u793A\u4F8B\u8BC1\u636E\uFF0C\u4E0D\u4EE3\u8868\u5DF2\u8BFB\u53D6\u771F\u5B9E\u9879\u76EE\u3002" },
      { id: "work-1", taskId: "fix-cart", role: "worker", kind: "task", title: "\u4FEE\u590D\u6570\u91CF\u4E0E\u91D1\u989D\u540C\u6B65", status: "failed", attempt: 1, dependsOn: ["research-1", "explore-1"], startedAt: at(42, 19), finishedAt: at(42, 25), error: "\u3010\u5408\u6210\u793A\u4F8B\u3011\u6A21\u578B\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528\u3002\u9002\u914D\u5668\u5C06\u6B64\u9519\u8BEF\u6807\u8BB0\u4E3A\u53EF\u91CD\u8BD5\uFF1B\u672A\u4EA7\u751F\u5DF2\u786E\u8BA4\u7684\u4EE3\u7801\u53D8\u66F4\u3002" },
      { id: "work-2", taskId: "fix-cart", role: "worker", kind: "task", title: "\u4FEE\u590D\u6570\u91CF\u4E0E\u91D1\u989D\u540C\u6B65", status: "running", attempt: 2, dependsOn: ["research-1", "explore-1"], startedAt: at(42, 26), output: "\u3010\u5408\u6210\u793A\u4F8B\u3011\u6B63\u5728\u8FDB\u884C\u7B2C 2 \u6B21\u6267\u884C\uFF1B\u9996\u6B21\u5931\u8D25\u8BB0\u5F55\u4FDD\u7559\u5728\u72EC\u7ACB\u8282\u70B9\u3002\n\u6240\u6709\u4EFB\u52A1\u5B8C\u6210\u540E\u624D\u4F1A\u5EFA\u7ACB\u6700\u7EC8\u5BA1\u67E5\u8282\u70B9\u3002\u6B64\u793A\u4F8B\u672A\u8C03\u7528\u4EFB\u4F55\u6A21\u578B\u3002" }
    ],
    edges: [
      { id: "e-jev-classify", from: "jev-classify-1", to: "plan-1", kind: "dispatch" },
      { id: "e-jev-step", from: "plan-review-1", to: "jev-step-1", kind: "dispatch" },
      { id: "e-jev-dispatch", from: "jev-step-1", to: "work-1", kind: "dispatch" },
      { id: "e1", from: "plan-1", to: "coord-1", kind: "dispatch" },
      { id: "e2", from: "coord-1", to: "plan-review-1", kind: "join" },
      { id: "e3", from: "coord-1", to: "research-1", kind: "dispatch" },
      { id: "e4", from: "plan-review-1", to: "research-1", kind: "dispatch" },
      { id: "e5", from: "coord-1", to: "explore-1", kind: "dispatch" },
      { id: "e6", from: "plan-review-1", to: "explore-1", kind: "dispatch" },
      { id: "e7", from: "coord-1", to: "work-1", kind: "dispatch" },
      { id: "e8", from: "plan-review-1", to: "work-1", kind: "dispatch" },
      { id: "e9", from: "research-1", to: "work-1", kind: "dependency" },
      { id: "e10", from: "explore-1", to: "work-1", kind: "dependency" },
      { id: "e11", from: "work-1", to: "work-2", kind: "retry" },
      { id: "e12", from: "research-1", to: "work-2", kind: "dependency" },
      { id: "e13", from: "explore-1", to: "work-2", kind: "dependency" }
    ],
    events: [
      { seq: 1, at: at(41), type: "node_started", nodeId: "plan-1", message: "\u89C4\u5212\u89D2\u8272\u62C6\u89E3\u76EE\u6807\u4E0E\u9A8C\u8BC1\u6761\u4EF6" },
      { seq: 2, at: at(41, 28), type: "node_completed", nodeId: "coord-1", message: "\u534F\u8C03\u8005\u7EC6\u5316\u4EFB\u52A1\u56FE\uFF0C\u660E\u786E\u4E09\u9879\u4EFB\u52A1\u4E0E\u4F9D\u8D56" },
      { seq: 3, at: at(41, 40), type: "node_completed", nodeId: "plan-review-1", message: "\u53EF\u6267\u884C\u65B9\u6848\u901A\u8FC7\u590D\u6838" },
      { seq: 4, at: at(41, 41), type: "node_started", nodeId: "research-1", message: "\u7814\u7A76\u4E0E\u4EE3\u7801\u63A2\u7D22\u5E76\u884C\u6267\u884C\uFF0C\u53EA\u8BFB\u8C03\u67E5\u5F00\u59CB" },
      { seq: 5, at: at(42, 18), type: "node_completed", nodeId: "explore-1", message: "\u4E24\u9879\u8C03\u67E5\u5B8C\u6210\uFF0C\u6267\u884C\u4EFB\u52A1\u7684\u4F9D\u8D56\u5DF2\u6EE1\u8DB3" },
      { seq: 6, at: at(42, 25), type: "node_failed", nodeId: "work-1", message: "\u6A21\u578B\u670D\u52A1\u4E34\u65F6\u9519\u8BEF\uFF0C\u9996\u6B21\u6267\u884C\u5931\u8D25" },
      { seq: 7, at: at(42, 26), type: "retry_scheduled", nodeId: "work-2", message: "\u521B\u5EFA\u7B2C 2 \u6B21\u6267\u884C\u8282\u70B9\uFF0C\u8FBE\u5230\u5355\u4EFB\u52A1 1 \u6B21\u91CD\u8BD5\u4E0A\u9650" }
    ]
  };
}
var TEAM_DEMO = createTeamDemo();
var teamDemoSnapshot = createTeamDemo;

// client/request.ts
function requestWithDeadline(call, lifecycle, timeoutMs = 15e3) {
  return new Promise((resolve, reject) => {
    const request = new AbortController();
    let done = false;
    let timer;
    const finish = (error, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      lifecycle.removeEventListener("abort", abort);
      if (error) {
        request.abort();
        reject(error);
      } else resolve(value);
    };
    const abort = () => finish(new Error("Request cancelled."));
    if (lifecycle.aborted) {
      abort();
      return;
    }
    lifecycle.addEventListener("abort", abort, { once: true });
    timer = setTimeout(() => finish(new Error(`\u5DE5\u4F5C\u6D41\u6865\u63A5\u670D\u52A1\u5728 ${Math.round(timeoutMs / 1e3)} \u79D2\u5185\u672A\u54CD\u5E94\uFF0C\u8BF7\u68C0\u67E5\u8FDE\u63A5\u3002`)), timeoutMs);
    try {
      call(request.signal).then((value) => finish(void 0, value), (error) => finish(error instanceof Error ? error : new Error("Bridge request failed.")));
    } catch (error) {
      finish(error instanceof Error ? error : new Error("Bridge request failed."));
    }
  });
}

// client/ConnectedTeam.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var JEV_CREDENTIAL_REF = "DSH_TEAM_JEV_API_KEY";
var emptySetup = () => ({ settings: createDefaultTeamSettings(), configured: false, keyConfigured: false, disclosureAccepted: false, revision: 0 });
var emptyCatalog = { available: false, providers: [], reason: "\u6B63\u5728\u8BFB\u53D6\u5BBF\u4E3B\u6A21\u578B\u76EE\u5F55\u2026" };
async function teamCall(ctx, action, payload, signal) {
  const result = await requestWithDeadline((s) => ctx.connection.rpc.call("/api", "dsh-desktop-workflow/team/" + action, payload, s), signal);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}
function ConnectedTeamSettings({ ctx, onClose }) {
  const [setup, setSetup] = (0, import_react4.useState)(emptySetup);
  const [catalog, setCatalog] = (0, import_react4.useState)(emptyCatalog);
  const [credential, setCredential] = (0, import_react4.useState)();
  const [loading, setLoading] = (0, import_react4.useState)(true);
  const [saving, setSaving] = (0, import_react4.useState)(false);
  const [error, setError] = (0, import_react4.useState)();
  const [notice, setNotice] = (0, import_react4.useState)();
  const [revision, setRevision] = (0, import_react4.useState)(0);
  const live = (0, import_react4.useRef)(true);
  const saveLock = (0, import_react4.useRef)(false);
  const modelRequest = (0, import_react4.useRef)();
  (0, import_react4.useEffect)(() => {
    live.current = true;
    return () => {
      live.current = false;
      modelRequest.current?.abort();
    };
  }, []);
  (0, import_react4.useEffect)(() => {
    const abort = new AbortController();
    setLoading(true);
    setCatalog(emptyCatalog);
    setCredential(void 0);
    void (async () => {
      try {
        const stored = await teamCall(ctx, "settings", {}, abort.signal);
        if (abort.signal.aborted) return;
        setSetup(stored);
        const [models, status] = await Promise.all([
          teamCall(ctx, "catalog", { selected: Object.values(stored.settings.roles).map(({ provider, model }) => ({ provider, model })) }, abort.signal),
          ctx.remote?.credentials?.describe([JEV_CREDENTIAL_REF])
        ]);
        if (abort.signal.aborted) return;
        setCatalog(models);
        setCredential(status?.ok ? status.value[JEV_CREDENTIAL_REF] : void 0);
      } catch (failure) {
        if (!abort.signal.aborted) {
          setCatalog({ available: false, providers: [], reason: "\u56E2\u961F\u8BBE\u7F6E\u8BFB\u53D6\u5931\u8D25\uFF0C\u8BF7\u5237\u65B0\u91CD\u8BD5\u3002" });
          setError(failure instanceof Error ? failure.message : "\u65E0\u6CD5\u8BFB\u53D6\u56E2\u961F\u8BBE\u7F6E\uFF0C\u8BF7\u5237\u65B0\u91CD\u8BD5\u3002");
        }
      } finally {
        if (!abort.signal.aborted) setLoading(false);
      }
    })();
    return () => abort.abort();
  }, [ctx, revision]);
  function refreshModelSelection(roles) {
    modelRequest.current?.abort();
    const abort = new AbortController();
    modelRequest.current = abort;
    void teamCall(ctx, "catalog", { selected: Object.values(roles).map(({ provider, model }) => ({ provider, model })) }, abort.signal).then((models) => {
      if (!abort.signal.aborted && live.current) setCatalog(models);
    }).catch(() => {
      if (!abort.signal.aborted && live.current) setError("\u65E0\u6CD5\u66F4\u65B0\u6240\u9009\u6A21\u578B\u7684\u80FD\u529B\u76EE\u5F55\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5\u3002");
    });
  }
  async function save(input) {
    if (saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    setError(void 0);
    setNotice(void 0);
    let keySaved = false;
    try {
      if (input.jevKey) {
        if (!ctx.remote?.credentials || !credential?.writable) throw new Error("\u539F\u751F\u51ED\u636E\u5B58\u50A8\u4E0D\u53EF\u5199\uFF0C\u5BC6\u94A5\u672A\u4FDD\u5B58\u3002");
        const result = await ctx.remote.credentials.set(JEV_CREDENTIAL_REF, input.jevKey).catch(() => {
          throw new Error("\u5BC6\u94A5\u4FDD\u5B58\u7ED3\u679C\u672A\u786E\u8BA4\uFF0C\u8BF7\u5237\u65B0\u8FDE\u63A5\u72B6\u6001\u540E\u68C0\u67E5\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u91CD\u8BD5\u3002");
        });
        input.jevKey = void 0;
        if (!result.ok) throw new Error("\u539F\u751F\u51ED\u636E\u670D\u52A1\u672A\u786E\u8BA4\u4FDD\u5B58\u5BC6\u94A5\uFF0C\u8BF7\u5237\u65B0\u8FDE\u63A5\u72B6\u6001\u540E\u91CD\u8BD5\u3002");
        keySaved = true;
      }
      const stored = await teamCall(ctx, "configure", { settings: input.settings, disclosureAccepted: input.disclosureAccepted, expectedRevision: setup.revision }, new AbortController().signal);
      if (live.current) {
        setSetup(stored);
        setNotice(stored.disclosureAccepted ? "\u8BBE\u7F6E\u5DF2\u4FDD\u5B58\u3002\u56DE\u5230\u9879\u76EE\u804A\u5929\uFF0C\u8F93\u5165 /team \u548C\u4EFB\u52A1\u76EE\u6807\u5373\u53EF\u5F00\u59CB\u3002" : "TypeSafe \u6570\u636E\u4F20\u8F93\u5DF2\u505C\u7528\u3002\u65B0\u7684 /team \u8FD0\u884C\u4F1A\u7B49\u5F85\u4F60\u91CD\u65B0\u542F\u7528\u3002");
        setRevision((value) => value + 1);
      }
    } catch (failure) {
      if (live.current) {
        const reason = failure instanceof Error ? failure.message : "\u8FDE\u63A5\u4E2D\u65AD\uFF0C\u8BF7\u5237\u65B0\u540E\u786E\u8BA4\u3002";
        setError((keySaved ? "Jev \u5BC6\u94A5\u5DF2\u4FDD\u5B58\uFF0C\u4F46\u56E2\u961F\u8BBE\u7F6E\u672A\u5B8C\u6210\u3002" : "") + reason);
        setRevision((value) => value + 1);
      }
    } finally {
      input.jevKey = void 0;
      saveLock.current = false;
      if (live.current) setSaving(false);
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(TeamSettingsView, { setup, catalog, credential, loading, saving, error, notice, onSave: save, onModelSelectionChange: refreshModelSelection, onClose, onRefresh: () => {
    setError(void 0);
    setNotice(void 0);
    setRevision((value) => value + 1);
  } });
}
function ConnectedTeam({ ctx, sessionId, navigationRevision = 0, onOpenSettings }) {
  const [setup, setSetup] = (0, import_react4.useState)(emptySetup);
  const [catalog, setCatalog] = (0, import_react4.useState)(emptyCatalog);
  const [snapshot, setSnapshot] = (0, import_react4.useState)(null);
  const [sessionContext, setSessionContext] = (0, import_react4.useState)();
  const [error, setError] = (0, import_react4.useState)();
  const [loading, setLoading] = (0, import_react4.useState)(true);
  const [revision, setRevision] = (0, import_react4.useState)(0);
  const [demo, setDemo] = (0, import_react4.useState)(false);
  const generation = (0, import_react4.useRef)(0);
  const current = (0, import_react4.useRef)(sessionId);
  current.current = sessionId;
  (0, import_react4.useEffect)(() => {
    const abort = new AbortController();
    void (async () => {
      try {
        const stored = await teamCall(ctx, "settings", {}, abort.signal);
        if (abort.signal.aborted) return;
        setSetup(stored);
        const models = await teamCall(ctx, "catalog", { selected: Object.values(stored.settings.roles).map(({ provider, model }) => ({ provider, model })) }, abort.signal);
        if (!abort.signal.aborted) setCatalog(models);
      } catch {
        if (!abort.signal.aborted) setCatalog({ available: false, providers: [], reason: "\u65E0\u6CD5\u8BFB\u53D6\u56E2\u961F\u8BBE\u7F6E\u6216\u6A21\u578B\u76EE\u5F55\uFF0C\u8BF7\u5237\u65B0\u91CD\u8BD5\u3002" });
      }
    })();
    return () => abort.abort();
  }, [ctx, revision, navigationRevision]);
  (0, import_react4.useEffect)(() => {
    const token = ++generation.current;
    const abort = new AbortController();
    let timer;
    setSnapshot(null);
    setSessionContext(void 0);
    setError(void 0);
    setLoading(true);
    if (demo) {
      setSnapshot(teamDemoSnapshot());
      setLoading(false);
      return () => abort.abort();
    }
    if (!sessionId) {
      setLoading(false);
      return () => abort.abort();
    }
    const bound = sessionId;
    async function refresh() {
      try {
        const state = await teamCall(ctx, "snapshot", { sessionId: bound }, abort.signal);
        if (abort.signal.aborted || current.current !== bound || token !== generation.current) return;
        setSnapshot(state.snapshot);
        setSessionContext(state.context);
        setError(void 0);
      } catch (failure) {
        if (!abort.signal.aborted && token === generation.current) setError(failure instanceof Error ? failure.message : "\u65E0\u6CD5\u8BFB\u53D6\u56E2\u961F\u8FD0\u884C\u3002");
      } finally {
        if (!abort.signal.aborted && token === generation.current) {
          setLoading(false);
          timer = setTimeout(refresh, 1500);
        }
      }
    }
    void refresh();
    return () => {
      abort.abort();
      clearTimeout(timer);
    };
  }, [ctx, sessionId, demo, revision, navigationRevision]);
  (0, import_react4.useEffect)(() => {
    setDemo(false);
  }, [sessionId, navigationRevision]);
  async function cancel() {
    if (!sessionId || !snapshot || snapshot.demo || snapshot.sessionId !== sessionId) return;
    const bound = sessionId;
    const token = generation.current;
    const state = await teamCall(ctx, "cancel", { sessionId, runId: snapshot.id }, new AbortController().signal);
    if (current.current === bound && token === generation.current) setSnapshot(state.snapshot);
  }
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(TeamView, { catalog, sessionId, sessionContext, snapshot, settings: setup.settings, configured: setup.configured, loading, error: error || (sessionContext?.lastCommand?.kind === "blocked" ? sessionContext.lastCommand.message : void 0), onOpenSettings, onCancel: cancel, onDemo: () => setDemo((value) => !value), onRefresh: () => {
    setDemo(false);
    setRevision((value) => value + 1);
  } });
}

// client/workflow.css
var workflow_default = '.dsh-workflow {\n  --wf-bg: #fff;\n  --wf-surface: #fff;\n  --wf-canvas: #fafbfc;\n  --wf-raised: #f5f6f8;\n  --wf-text: var(--dsw-alias-label-primary, #202735);\n  --wf-muted: #737b88;\n  --wf-faint: #a0a7b3;\n  --wf-border: #e7eaf0;\n  --wf-line: #d8dfe7;\n  --wf-green: #397668;\n  --wf-green-soft: #eef6f2;\n  --wf-blue: #506cc7;\n  --wf-blue-soft: #f0f3ff;\n  --wf-amber: #947133;\n  --wf-amber-soft: #fcf7e9;\n  --wf-red: #b45259;\n  --wf-red-soft: #fff1f2;\n  container: dsh-workflow / inline-size;\n  box-sizing: border-box;\n  width: 100%;\n  min-width: 0;\n  color: var(--wf-text);\n  background: var(--wf-bg);\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;\n  font-size: 13px;\n  line-height: 1.5;\n  -webkit-font-smoothing: antialiased;\n  text-align: left;\n  color-scheme: light;\n}\n.dsh-workflow *, .dsh-workflow *::before, .dsh-workflow *::after { box-sizing: border-box; }\n.dsh-workflow button { font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }\n.dsh-workflow button:disabled { cursor: wait; opacity: .55; }\n.dsh-workflow button:focus-visible { outline: 3px solid var(--wf-blue); outline-offset: 4px; }\n.dsh-workflow h1, .dsh-workflow h2, .dsh-workflow h3, .dsh-workflow h4, .dsh-workflow p { margin: 0; }\n.dsh-workflow .wf-icon { width: 18px; height: 18px; display: inline-block; flex: 0 0 auto; vertical-align: middle; }\n.dsh-workflow .wf-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 22px 20px 19px; border-bottom: 1px solid var(--wf-border); }\n.dsh-workflow .wf-heading-group { display: flex; align-items: center; gap: 12px; min-width: 0; }\n.dsh-workflow .wf-appmark { display: none; align-items: center; justify-content: center; width: 42px; height: 42px; border: 1px solid var(--wf-border); background: var(--wf-surface); border-radius: 12px; color: var(--wf-green); box-shadow: 0 2px 3px #1a273406; }\n.dsh-workflow .wf-appmark .wf-icon { width: 23px; height: 23px; }\n.dsh-workflow .wf-eyebrow { font-size: 8px; letter-spacing: 1.15px; font-weight: 650; white-space: nowrap; color: var(--wf-muted); margin-bottom: 3px; }\n.dsh-workflow .wf-eyebrow span { color: var(--wf-line); padding: 0 3px; }\n.dsh-workflow h1 { font-size: 23px; font-weight: 630; line-height: 1.15; letter-spacing: -.8px; }\n.dsh-workflow .wf-header-actions { display: flex; align-items: center; gap: 7px; }\n.dsh-workflow .wf-readonly { display: none; align-items: center; gap: 5px; font-size: 11px; color: var(--wf-muted); margin-right: 8px; }\n.dsh-workflow .wf-readonly .wf-icon { width: 13px; height: 13px; }\n.dsh-workflow .wf-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 34px; padding: 7px 10px; border-radius: 8px; border: 1px solid var(--wf-border); background: var(--wf-surface); font-size: 11px; font-weight: 580; white-space: nowrap; transition: background .16s, border-color .16s, box-shadow .16s; }\n.dsh-workflow .wf-button:hover:not(:disabled) { background: var(--wf-raised); border-color: var(--wf-line); }\n.dsh-workflow .wf-button .wf-icon { width: 14px; height: 14px; }\n.dsh-workflow .wf-demo-button .wf-icon { display: none; }\n.dsh-workflow .wf-demo-button.is-active { color: var(--wf-amber); background: var(--wf-amber-soft); border-color: #d7be853d; }\n.dsh-workflow .wf-refresh-button > span { display: none; }\n.dsh-workflow .wf-refresh-button { width: 34px; padding: 7px; }\n.dsh-workflow .wf-button--primary { background: var(--wf-text); color: var(--wf-surface); border-color: var(--wf-text); }\n.dsh-workflow .wf-button--primary:hover:not(:disabled) { background: var(--wf-green); border-color: var(--wf-green); }\n.dsh-workflow .wf-text-button { display: flex; align-items: center; gap: 5px; background: transparent; border: 0; padding: 5px 0 5px 10px; font-size: 12px; font-weight: 600; }\n.dsh-workflow .wf-text-button .wf-icon { width: 14px; height: 14px; }\n.dsh-workflow .wf-demo-notice { display: flex; align-items: flex-start; gap: 9px; padding: 11px 20px; background: var(--wf-amber-soft); color: var(--wf-amber); border-bottom: 1px solid #b8944426; font-size: 11px; line-height: 1.5; }\n.dsh-workflow .wf-demo-tag { flex-shrink: 0; font-size: 8px; line-height: 17px; font-weight: 750; letter-spacing: .65px; padding: 0 5px; border: 1px solid #b8944466; border-radius: 4px; }\n.dsh-workflow .wf-demo-note { display: none; margin-left: auto; white-space: nowrap; opacity: .85; }\n.dsh-workflow .wf-notice { display: flex; align-items: flex-start; gap: 10px; padding: 14px 18px; margin: 16px 20px 0; border: 1px solid var(--wf-border); border-radius: 9px; font-size: 11px; }\n.dsh-workflow .wf-notice > .wf-icon { margin-top: 1px; width: 16px; height: 16px; }\n.dsh-workflow .wf-notice > div { flex: 1; min-width: 0; }\n.dsh-workflow .wf-notice strong { font-weight: 620; }\n.dsh-workflow .wf-notice p { margin-top: 3px; opacity: .9; overflow-wrap: anywhere; }\n.dsh-workflow .wf-notice--error { color: var(--wf-red); background: var(--wf-red-soft); border-color: #b4525925; }\n.dsh-workflow .wf-notice--warning { color: var(--wf-amber); background: var(--wf-amber-soft); border-color: #b8944426; }\n.dsh-workflow .wf-run-summary { padding: 25px 20px 24px; display: flex; flex-direction: column; gap: 13px; }\n.dsh-workflow .wf-run-title { min-width: 0; }\n.dsh-workflow .wf-section-kicker { display: block; font-size: 9px; font-weight: 650; color: var(--wf-muted); letter-spacing: 1.35px; margin-bottom: 8px; }\n.dsh-workflow .wf-run-title h2 { font-size: 20px; letter-spacing: -.55px; line-height: 1.3; font-weight: 590; overflow-wrap: anywhere; }\n.dsh-workflow .wf-run-title p { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 11px; color: var(--wf-muted); margin-top: 8px; }\n.dsh-workflow .wf-summary-dot { width: 5px; height: 5px; background: var(--wf-green); border-radius: 50%; margin-right: 1px; }\n.dsh-workflow .wf-summary-separator { color: var(--wf-faint); margin: 0 2px; }\n.dsh-workflow .wf-run-title .wf-run-id { font-size: 9px; gap: 7px; margin-top: 5px; color: var(--wf-faint); }\n.dsh-workflow .wf-run-id code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 9px; color: var(--wf-muted); overflow-wrap: anywhere; word-break: break-word; min-width: 0; }\n.dsh-workflow .wf-run-status { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; flex: 0 0 auto; }\n.dsh-workflow .wf-run-status > span:last-child { font-size: 10px; color: var(--wf-muted); }\n.dsh-workflow .wf-status { display: inline-flex; width: fit-content; align-items: center; gap: 6px; color: var(--wf-muted); background: var(--wf-raised); border: 1px solid var(--wf-border); padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 550; white-space: nowrap; line-height: 1.4; }\n.dsh-workflow .wf-status .wf-icon { width: 12px; height: 12px; stroke-width: 2; }\n.dsh-workflow .wf-status-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }\n.dsh-workflow .wf-status--completed { color: var(--wf-green); background: var(--wf-green-soft); border-color: #39766818; }\n.dsh-workflow .wf-status--running { color: var(--wf-blue); background: var(--wf-blue-soft); border-color: #506cc71b; }\n.dsh-workflow .wf-status--review { color: var(--wf-blue); background: var(--wf-blue-soft); border-color: #506cc71b; }\n.dsh-workflow .wf-status--blocked, .dsh-workflow .wf-status--approval, .dsh-workflow .wf-status--stale { color: var(--wf-amber); background: var(--wf-amber-soft); border-color: #9471331c; }\n.dsh-workflow .wf-status--failed { color: var(--wf-red); background: var(--wf-red-soft); border-color: #b452591c; }\n.dsh-workflow .wf-status--subtle { background: transparent; border: 0; padding: 0; font-size: 10px; }\n.dsh-workflow .wf-status--pending, .dsh-workflow .wf-status--waiting, .dsh-workflow .wf-status--skipped { color: var(--wf-muted); }\n.dsh-workflow .wf-status--pending .wf-status-dot { background: transparent; border: 1px solid var(--wf-faint); width: 6px; height: 6px; }\n.dsh-workflow .wf-status--running .wf-status-dot { box-shadow: 0 0 0 3px #506cc713; }\n.dsh-workflow .wf-workspace { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; padding: 0 20px; }\n.dsh-workflow .wf-map-panel { border: 1px solid var(--wf-border); border-radius: 12px; min-width: 0; overflow: hidden; align-self: start; }\n.dsh-workflow .wf-panel-heading { min-height: 69px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 15px 17px; background: var(--wf-surface); border-bottom: 1px solid var(--wf-border); }\n.dsh-workflow .wf-panel-heading h3 { font-size: 12px; font-weight: 620; }\n.dsh-workflow .wf-panel-heading > div > span { display: block; margin-top: 3px; font-size: 10px; color: var(--wf-muted); }\n.dsh-workflow .wf-keyboard-hint { display: none; color: var(--wf-muted); font-size: 10px; align-items: center; gap: 6px; }\n.dsh-workflow .wf-keyboard-hint .wf-icon { width: 13px; height: 13px; }\n.dsh-workflow .wf-canvas { background-color: var(--wf-canvas); background-image: radial-gradient(var(--wf-line) .65px, transparent .65px); background-size: 15px 15px; padding: 19px 16px 15px; }\n.dsh-workflow .wf-map { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }\n.dsh-workflow .wf-node-wrap { position: relative; z-index: 1; min-width: 0; }\n.dsh-workflow .wf-node { display: grid; grid-template-columns: 36px minmax(0, 1fr) auto; grid-template-rows: auto auto; column-gap: 11px; align-items: center; position: relative; width: 100%; min-width: 0; padding: 13px 14px; border: 1px solid var(--wf-line); border-radius: 10px; background: var(--wf-surface); box-shadow: 0 2px 3px #25344a03; text-align: left; transition: border-color .18s, box-shadow .18s, transform .18s, background .18s; }\n.dsh-workflow .wf-node:hover { border-color: var(--wf-muted); box-shadow: 0 3px 9px #25344a0a; transform: translateY(-1px); }\n.dsh-workflow .wf-node.is-selected { border-color: var(--wf-blue); box-shadow: 0 0 0 3px #506cc711, 0 3px 10px #25344a06; }\n.dsh-workflow .wf-node--completed { border-color: #39766835; }\n.dsh-workflow .wf-node--failed { border-color: #b4525955; }\n.dsh-workflow .wf-node--running { border-color: #506cc77a; }\n.dsh-workflow .wf-node-top { display: contents; }\n.dsh-workflow .wf-node-icon { grid-column: 1; grid-row: 1 / 3; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 9px; background: var(--wf-raised); color: var(--wf-muted); }\n.dsh-workflow .wf-node--completed .wf-node-icon { background: var(--wf-green-soft); color: var(--wf-green); }\n.dsh-workflow .wf-node--running .wf-node-icon, .dsh-workflow .wf-node--review .wf-node-icon { background: var(--wf-blue-soft); color: var(--wf-blue); }\n.dsh-workflow .wf-node--approval .wf-node-icon, .dsh-workflow .wf-node--blocked .wf-node-icon { background: var(--wf-amber-soft); color: var(--wf-amber); }\n.dsh-workflow .wf-node--failed .wf-node-icon { background: var(--wf-red-soft); color: var(--wf-red); }\n.dsh-workflow .wf-node-icon .wf-icon { width: 18px; height: 18px; }\n.dsh-workflow .wf-node-number { grid-column: 3; grid-row: 1; color: var(--wf-faint); font-size: 9px; letter-spacing: .5px; font-variant-numeric: tabular-nums; align-self: start; }\n.dsh-workflow .wf-node-title { grid-column: 2; grid-row: 1; font-size: 12px; font-weight: 610; line-height: 1.35; }\n.dsh-workflow .wf-node-description { display: none; color: var(--wf-muted); font-size: 10px; margin-top: 3px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }\n.dsh-workflow .wf-node-bottom { grid-column: 2 / 4; grid-row: 2; display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 5px; }\n.dsh-workflow .wf-evidence-count { display: inline-flex; align-items: center; gap: 3px; font-size: 9px; font-variant-numeric: tabular-nums; color: var(--wf-faint); }\n.dsh-workflow .wf-evidence-count .wf-icon { width: 11px; height: 11px; }\n.dsh-workflow .wf-node-chevron { width: 11px; height: 11px; color: var(--wf-faint); }\n.dsh-workflow .wf-connector { pointer-events: none; position: absolute; display: flex; align-items: center; justify-content: center; width: 16px; height: 17px; left: 50%; top: 100%; transform: translateX(-50%); color: var(--wf-line); }\n.dsh-workflow .wf-connector > span { border-left: 1px dashed currentColor; height: 100%; }\n.dsh-workflow .wf-connector > .wf-icon { position: absolute; bottom: -1px; left: 2px; width: 12px; height: 12px; transform: rotate(90deg); stroke-width: 1.8; background: var(--wf-canvas); }\n.dsh-workflow .wf-node-wrap--completed .wf-connector { color: #8cb4a5; }\n.dsh-workflow .wf-node-wrap--completed .wf-connector > span { border-style: solid; }\n.dsh-workflow .wf-canvas-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding-top: 21px; }\n.dsh-workflow .wf-canvas-caption { display: none; gap: 6px; align-items: center; font-size: 9px; color: var(--wf-muted); }\n.dsh-workflow .wf-canvas-caption .wf-icon { width: 12px; height: 12px; }\n.dsh-workflow .wf-legend { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 5px; width: 100%; font-size: 8px; color: var(--wf-muted); }\n.dsh-workflow .wf-legend i { display: inline-block; width: 5px; height: 5px; border-radius: 50%; margin-left: 10px; }\n.dsh-workflow .wf-legend i:first-child { margin-left: 0; }\n.dsh-workflow .wf-legend-complete { background: var(--wf-green); }\n.dsh-workflow .wf-legend-running { background: var(--wf-blue); }\n.dsh-workflow .wf-legend-pending { border: 1px solid var(--wf-faint); }\n.dsh-workflow .wf-empty-bar { padding: 17px; display: flex; flex-wrap: wrap; align-items: center; gap: 14px; background: var(--wf-surface); border-top: 1px solid var(--wf-border); }\n.dsh-workflow .wf-empty-bar > div { flex: 1 1 180px; }\n.dsh-workflow .wf-empty-bar strong { font-size: 11px; font-weight: 610; }\n.dsh-workflow .wf-empty-bar p { font-size: 10px; line-height: 1.6; color: var(--wf-muted); margin-top: 4px; overflow-wrap: anywhere; }\n.dsh-workflow .wf-inspector { display: flex; flex-direction: column; min-width: 0; border: 1px solid var(--wf-border); border-radius: 12px; background: var(--wf-surface); padding: 20px; }\n.dsh-workflow .wf-inspector-label { display: flex; align-items: center; justify-content: space-between; color: var(--wf-muted); font-size: 8px; font-weight: 620; letter-spacing: 1.15px; margin-bottom: 19px; }\n.dsh-workflow .wf-inspector-label > span:last-child { font-weight: 450; font-variant-numeric: tabular-nums; letter-spacing: .5px; color: var(--wf-faint); }\n.dsh-workflow .wf-inspector-title { display: flex; align-items: center; gap: 11px; }\n.dsh-workflow .wf-detail-icon { display: flex; align-items: center; justify-content: center; width: 41px; height: 41px; border: 1px solid var(--wf-border); background: var(--wf-canvas); border-radius: 11px; }\n.dsh-workflow .wf-detail-icon .wf-icon { width: 22px; height: 22px; }\n.dsh-workflow .wf-inspector-title h3 { font-size: 18px; line-height: 1.4; font-weight: 610; letter-spacing: -.45px; }\n.dsh-workflow .wf-inspector-title .wf-status { margin-top: 2px; }\n.dsh-workflow .wf-inspector-summary { font-size: 11px; color: var(--wf-muted); line-height: 1.75; margin-top: 15px; overflow-wrap: anywhere; white-space: pre-wrap; }\n.dsh-workflow .wf-inspector-section { border-top: 1px solid var(--wf-border); padding-top: 17px; margin-top: 19px; }\n.dsh-workflow .wf-inspector-section h4 { display: flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 620; margin-bottom: 13px; }\n.dsh-workflow .wf-inspector-section h4 > span { display: inline-flex; align-items: center; justify-content: center; min-width: 17px; height: 17px; border-radius: 5px; background: var(--wf-raised); font-size: 9px; font-weight: 450; color: var(--wf-muted); }\n.dsh-workflow .wf-facts { display: flex; flex-direction: column; gap: 10px; margin: 0; font-size: 10px; }\n.dsh-workflow .wf-facts > div { display: grid; grid-template-columns: minmax(75px, .8fr) minmax(0, 1.3fr); gap: 15px; align-items: start; }\n.dsh-workflow .wf-facts dt { color: var(--wf-muted); }\n.dsh-workflow .wf-facts dd { margin: 0; text-align: right; overflow-wrap: anywhere; }\n.dsh-workflow .wf-probabilities { display: grid; gap: 10px; margin-top: 18px; }\n.dsh-workflow .wf-probability > div:first-child { display: flex; align-items: center; justify-content: space-between; font-size: 9px; color: var(--wf-muted); margin-bottom: 5px; }\n.dsh-workflow .wf-probability > div:first-child > span:last-child { font-variant-numeric: tabular-nums; }\n.dsh-workflow .wf-probability-track { height: 4px; border-radius: 3px; background: var(--wf-raised); overflow: hidden; }\n.dsh-workflow .wf-probability-track > span { display: block; height: 100%; border-radius: inherit; background: var(--wf-line); }\n.dsh-workflow .wf-probability.is-chosen > div:first-child { color: var(--wf-green); }\n.dsh-workflow .wf-probability.is-chosen .wf-probability-track > span { background: var(--wf-green); }\n.dsh-workflow .wf-small-print { color: var(--wf-muted); font-size: 9px; line-height: 1.6; margin-top: 12px; }\n.dsh-workflow .wf-evidence-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }\n.dsh-workflow .wf-evidence-list li { display: flex; align-items: flex-start; gap: 8px; padding: 10px; border: 1px solid var(--wf-border); background: var(--wf-canvas); border-radius: 7px; color: var(--wf-muted); font-size: 10px; line-height: 1.65; }\n.dsh-workflow .wf-evidence-list li .wf-icon { width: 13px; height: 13px; margin-top: 2px; color: var(--wf-faint); }\n.dsh-workflow .wf-evidence-list li > span { min-width: 0; overflow-wrap: anywhere; white-space: pre-wrap; }\n.dsh-workflow .wf-no-evidence { display: flex; align-items: flex-start; gap: 9px; padding: 13px; border: 1px dashed var(--wf-line); border-radius: 8px; color: var(--wf-muted); background: var(--wf-canvas); }\n.dsh-workflow .wf-no-evidence .wf-icon { width: 15px; height: 15px; color: var(--wf-faint); margin-top: 1px; }\n.dsh-workflow .wf-no-evidence p { font-size: 10px; line-height: 1.65; }\n.dsh-workflow .wf-inspector-footer { display: flex; align-items: center; gap: 6px; padding-top: 21px; margin-top: auto; font-size: 9px; line-height: 1.5; color: var(--wf-muted); }\n.dsh-workflow .wf-inspector-footer .wf-icon { width: 12px; height: 12px; }\n.dsh-workflow .wf-stage-note { display: flex; align-items: flex-start; gap: 7px; font-size: 10px; color: var(--wf-amber); background: var(--wf-amber-soft); border-radius: 7px; padding: 10px; margin-top: 14px; }\n.dsh-workflow .wf-stage-note .wf-icon { width: 13px; height: 13px; margin-top: 2px; }\n.dsh-workflow .wf-stage-note--failed { color: var(--wf-red); background: var(--wf-red-soft); }\n.dsh-workflow .wf-activity { border: 1px solid var(--wf-border); border-radius: 11px; margin: 18px 20px 0; overflow: hidden; background: var(--wf-surface); }\n.dsh-workflow .wf-activity-toggle { width: 100%; background: transparent; border: 0; padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 15px; text-align: left; }\n.dsh-workflow .wf-activity-toggle > span { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }\n.dsh-workflow .wf-activity-toggle .wf-icon { width: 15px; height: 15px; color: var(--wf-muted); }\n.dsh-workflow .wf-activity-toggle strong { font-size: 11px; font-weight: 610; }\n.dsh-workflow .wf-activity-toggle > .wf-icon { transition: transform .18s; width: 13px; height: 13px; }\n.dsh-workflow .wf-activity-toggle > .wf-icon.is-open { transform: rotate(90deg); }\n.dsh-workflow .wf-activity-description { display: none; font-size: 10px; color: var(--wf-muted); margin-left: 2px; }\n.dsh-workflow .wf-activity-body { padding: 0 16px; }\n.dsh-workflow .wf-activity-list { list-style: none; margin: 0; padding: 0 0 3px; }\n.dsh-workflow .wf-activity-list li { position: relative; display: flex; align-items: flex-start; gap: 10px; padding: 13px 0; border-top: 1px solid var(--wf-border); }\n.dsh-workflow .wf-event-icon { display: flex; align-items: center; justify-content: center; width: 23px; height: 23px; flex-shrink: 0; background: var(--wf-raised); color: var(--wf-muted); border-radius: 7px; margin-top: 1px; }\n.dsh-workflow .wf-event-icon > .wf-icon { width: 12px; height: 12px; }\n.dsh-workflow .wf-event-icon--completed { background: var(--wf-green-soft); color: var(--wf-green); }\n.dsh-workflow .wf-event-icon--running, .dsh-workflow .wf-event-icon--review { background: var(--wf-blue-soft); color: var(--wf-blue); }\n.dsh-workflow .wf-event-icon--failed { background: var(--wf-red-soft); color: var(--wf-red); }\n.dsh-workflow .wf-event-icon--approval, .dsh-workflow .wf-event-icon--blocked { background: var(--wf-amber-soft); color: var(--wf-amber); }\n.dsh-workflow .wf-event-main { flex: 1; min-width: 0; }\n.dsh-workflow .wf-event-label { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 10px; font-weight: 600; }\n.dsh-workflow .wf-event-label .wf-status { font-size: 9px; font-weight: 450; }\n.dsh-workflow .wf-event-main p { color: var(--wf-muted); font-size: 10px; line-height: 1.65; margin-top: 4px; overflow-wrap: anywhere; }\n.dsh-workflow .wf-activity-list time { font-size: 9px; color: var(--wf-faint); font-variant-numeric: tabular-nums; white-space: nowrap; padding-top: 2px; }\n.dsh-workflow .wf-activity-empty { display: flex; align-items: center; gap: 8px; padding: 0 0 17px; font-size: 10px; color: var(--wf-muted); }\n.dsh-workflow .wf-empty-event-dot { flex-shrink: 0; width: 6px; height: 6px; border: 1px solid var(--wf-faint); border-radius: 50%; }\n.dsh-workflow .wf-footer { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 18px 20px 23px; color: var(--wf-muted); font-size: 9px; line-height: 1.6; }\n.dsh-workflow .wf-footer > span:first-child { display: flex; align-items: flex-start; gap: 6px; max-width: 730px; }\n.dsh-workflow .wf-footer > span:first-child > .wf-icon { width: 11px; height: 11px; margin-top: 2px; }\n.dsh-workflow .wf-footer-signature { display: none; font-size: 9px; font-weight: 650; letter-spacing: 1.3px; white-space: nowrap; }\n.dsh-workflow .wf-footer-signature > span { margin-left: 4px; font-size: 8px; font-weight: 450; color: var(--wf-faint); }\n.dsh-workflow .wf-visually-hidden { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }\n.dsh-workflow .wf-spin { animation: wf-spin 1.3s linear infinite; }\n@keyframes wf-spin { to { transform: rotate(360deg); } }\n\n@container dsh-workflow (min-width: 470px) {\n  .dsh-workflow .wf-appmark, .dsh-workflow .wf-demo-button .wf-icon { display: inline-flex; }\n  .dsh-workflow .wf-readonly { display: inline-flex; }\n  .dsh-workflow .wf-eyebrow { font-size: 8px; }\n  .dsh-workflow .wf-node-description { display: block; grid-column: 2; grid-row: 2; margin-top: 3px; }\n  .dsh-workflow .wf-node-bottom { grid-column: 3; grid-row: 1 / 3; flex-direction: column; align-items: flex-end; gap: 8px; margin-top: 0; }\n  .dsh-workflow .wf-node-number { display: none; }\n  .dsh-workflow .wf-canvas-caption { display: flex; }\n  .dsh-workflow .wf-legend { width: auto; }\n  .dsh-workflow .wf-activity-description { display: inline; }\n}\n\n@container dsh-workflow (min-width: 600px) {\n  .dsh-workflow .wf-header { padding: 25px 27px 22px; }\n  .dsh-workflow .wf-eyebrow { font-size: 9px; letter-spacing: 1.2px; }\n  .dsh-workflow h1 { font-size: 25px; }\n  .dsh-workflow .wf-header-actions { gap: 9px; }\n  .dsh-workflow .wf-refresh-button { width: auto; padding: 7px 12px; }\n  .dsh-workflow .wf-refresh-button > span { display: inline; }\n  .dsh-workflow .wf-demo-notice { padding-left: 27px; padding-right: 27px; }\n  .dsh-workflow .wf-run-summary { padding: 27px; flex-direction: row; align-items: center; justify-content: space-between; gap: 25px; }\n  .dsh-workflow .wf-run-title h2 { font-size: 23px; }\n  .dsh-workflow .wf-run-status { flex-direction: column; align-items: flex-end; gap: 6px; }\n  .dsh-workflow .wf-workspace { padding: 0 27px; }\n  .dsh-workflow .wf-notice, .dsh-workflow .wf-activity { margin-left: 27px; margin-right: 27px; }\n  .dsh-workflow .wf-footer { padding-left: 27px; padding-right: 27px; }\n  .dsh-workflow .wf-footer-signature { display: block; }\n  .dsh-workflow .wf-keyboard-hint { display: flex; }\n  .dsh-workflow .wf-inspector { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 25px; }\n  .dsh-workflow .wf-inspector-label { grid-column: 1 / -1; margin-bottom: 15px; }\n  .dsh-workflow .wf-inspector-title { grid-column: 1; }\n  .dsh-workflow .wf-inspector-summary { grid-column: 1; }\n  .dsh-workflow .wf-inspector-section { grid-column: 2; grid-row: 2 / 5; margin-top: 0; border-top: 0; border-left: 1px solid var(--wf-border); padding-top: 0; padding-left: 23px; }\n  .dsh-workflow .wf-evidence-section { grid-column: 1 / -1; grid-row: auto; border-left: 0; border-top: 1px solid var(--wf-border); padding: 17px 0 0; margin-top: 19px; }\n  .dsh-workflow .wf-inspector-footer { grid-column: 1 / -1; }\n  .dsh-workflow .wf-stage-note { grid-column: 1; }\n}\n\n@container dsh-workflow (min-width: 790px) {\n  .dsh-workflow .wf-map { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 43px 27px; }\n  .dsh-workflow .wf-node-wrap--0 { grid-area: 1 / 1; }\n  .dsh-workflow .wf-node-wrap--1 { grid-area: 1 / 2; }\n  .dsh-workflow .wf-node-wrap--2 { grid-area: 1 / 3; }\n  .dsh-workflow .wf-node-wrap--3 { grid-area: 2 / 3; }\n  .dsh-workflow .wf-node-wrap--4 { grid-area: 2 / 2; }\n  .dsh-workflow .wf-node-wrap--5 { grid-area: 2 / 1; }\n  .dsh-workflow .wf-node { display: flex; flex-direction: column; align-items: stretch; min-height: 146px; padding: 15px; border-radius: 11px; }\n  .dsh-workflow .wf-node-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }\n  .dsh-workflow .wf-node-icon { width: 33px; height: 33px; }\n  .dsh-workflow .wf-node-number { display: inline; }\n  .dsh-workflow .wf-node-title { font-size: 13px; letter-spacing: -.1px; }\n  .dsh-workflow .wf-node-description { display: block; }\n  .dsh-workflow .wf-node-bottom { flex-direction: row; align-items: center; margin-top: 17px; }\n  .dsh-workflow .wf-connector { top: 50%; left: 100%; transform: translateY(-50%); width: 28px; height: 16px; }\n  .dsh-workflow .wf-connector > span { height: 0; width: 100%; border-left: 0; border-top: 1px dashed currentColor; }\n  .dsh-workflow .wf-connector > .wf-icon { top: 2px; bottom: auto; left: auto; right: -1px; transform: none; }\n  .dsh-workflow .wf-node-wrap--2 .wf-connector { width: 16px; height: 44px; left: 50%; top: 100%; transform: translateX(-50%); }\n  .dsh-workflow .wf-node-wrap--2 .wf-connector > span { border-top: 0; width: 0; height: 100%; border-left: 1px dashed currentColor; }\n  .dsh-workflow .wf-node-wrap--2 .wf-connector > .wf-icon { top: auto; bottom: -1px; right: 2px; transform: rotate(90deg); }\n  .dsh-workflow .wf-node-wrap--3 .wf-connector, .dsh-workflow .wf-node-wrap--4 .wf-connector { left: auto; right: 100%; }\n  .dsh-workflow .wf-node-wrap--3 .wf-connector > .wf-icon, .dsh-workflow .wf-node-wrap--4 .wf-connector > .wf-icon { left: -1px; right: auto; transform: rotate(180deg); }\n  .dsh-workflow .wf-node-wrap--completed .wf-connector > span { border-style: solid; }\n  .dsh-workflow .wf-canvas { padding: 29px 24px 19px; }\n  .dsh-workflow .wf-canvas-footer { padding-top: 26px; }\n  .dsh-workflow .wf-demo-note { display: inline; }\n}\n\n@container dsh-workflow (min-width: 1040px) {\n  .dsh-workflow .wf-header { padding: 25px 32px; }\n  .dsh-workflow .wf-run-summary { padding: 30px 32px 28px; }\n  .dsh-workflow .wf-run-title h2 { font-size: 25px; }\n  .dsh-workflow .wf-workspace { grid-template-columns: minmax(0, 1fr) 286px; gap: 19px; padding: 0 32px; align-items: start; }\n  .dsh-workflow .wf-inspector { display: flex; padding: 21px; min-height: 472px; }\n  .dsh-workflow .wf-inspector-label { margin-bottom: 19px; }\n  .dsh-workflow .wf-inspector-section { border-left: 0; border-top: 1px solid var(--wf-border); padding: 17px 0 0; margin-top: 19px; }\n  .dsh-workflow .wf-panel-heading { padding: 17px 21px; }\n  .dsh-workflow .wf-panel-heading > div > span { font-size: 10px; }\n  .dsh-workflow .wf-keyboard-hint { font-size: 9px; }\n  .dsh-workflow .wf-canvas { padding: 34px 24px 19px; }\n  .dsh-workflow .wf-node { padding: 15px 13px; }\n  .dsh-workflow .wf-node-title { font-size: 14px; }\n  .dsh-workflow .wf-node-description { font-size: 9px; }\n  .dsh-workflow .wf-canvas-caption { font-size: 8px; }\n  .dsh-workflow .wf-legend { font-size: 8px; }\n  .dsh-workflow .wf-legend i { margin-left: 7px; }\n  .dsh-workflow .wf-demo-notice { padding-left: 32px; padding-right: 32px; }\n  .dsh-workflow .wf-notice, .dsh-workflow .wf-activity { margin-left: 32px; margin-right: 32px; }\n  .dsh-workflow .wf-footer { padding-left: 32px; padding-right: 32px; }\n  .dsh-workflow .wf-activity-toggle { padding: 16px 21px; }\n  .dsh-workflow .wf-activity-body { padding: 0 21px; }\n  .dsh-workflow .wf-event-main { display: flex; align-items: baseline; gap: 18px; }\n  .dsh-workflow .wf-event-label { flex: 0 0 162px; }\n  .dsh-workflow .wf-event-main p { margin-top: 0; }\n}\n\n/* The host owns its resolved theme. An absent DSH dark-theme attribute means\n   light, even when the OS prefers dark. Explicit preview themes also work. */\nbody[data-ds-dark-theme] .dsh-workflow, .dsh-workflow[data-theme="dark"] {\n  --wf-bg: #181b21; --wf-surface: #20242c; --wf-canvas: #1b1f26; --wf-raised: #292e37;\n  --wf-text: #e0e4ec; --wf-muted: #9ca6b6; --wf-faint: #727f92; --wf-border: #303641; --wf-line: #3c4655;\n  --wf-green: #89bda9; --wf-green-soft: #253b34; --wf-blue: #a1b3f5; --wf-blue-soft: #2b334c;\n  --wf-amber: #dbc08d; --wf-amber-soft: #393328; --wf-red: #e3a1a7; --wf-red-soft: #412d34;\n  color-scheme: dark;\n}\n@media (prefers-reduced-motion: reduce) {\n  .dsh-workflow *, .dsh-workflow *::before, .dsh-workflow *::after { animation: none !important; transition: none !important; }\n}\n';

// client/index.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var inject = ["slots", "sidebarRightTabs", "sidebarRight", "connection", "remote", "remote.credentials"];
var PACKAGE = "dsh-desktop-workflow";
var ENDPOINT = "dsh-desktop-workflow/snapshot";
function ConnectedWorkflow({ ctx }) {
  const [snapshot, setSnapshot] = (0, import_react5.useState)(null);
  const [loading, setLoading] = (0, import_react5.useState)(true);
  const [error, setError] = (0, import_react5.useState)();
  const [demo, setDemo] = (0, import_react5.useState)(false);
  const [revision, setRevision] = (0, import_react5.useState)(0);
  const generation = (0, import_react5.useRef)(0);
  (0, import_react5.useEffect)(() => {
    const token = ++generation.current;
    if (demo) {
      setSnapshot(demoSnapshot());
      setLoading(false);
      setError(void 0);
      return;
    }
    setSnapshot(null);
    setError(void 0);
    const controller = new AbortController();
    let timer;
    async function refresh() {
      setLoading(true);
      try {
        const result = await requestWithDeadline((signal) => ctx.connection.rpc.call("/api", ENDPOINT, {}, signal), controller.signal);
        if (controller.signal.aborted || token !== generation.current) return;
        if (result.ok) {
          setSnapshot(result.value);
          setError(void 0);
        } else {
          setSnapshot(null);
          setError(result.error.message);
        }
      } catch (error2) {
        if (!controller.signal.aborted && token === generation.current) {
          setSnapshot(null);
          setError(error2 instanceof Error && error2.message.includes("15 \u79D2\u5185\u672A\u54CD\u5E94") ? error2.message : "\u65E0\u6CD5\u8FDE\u63A5\u684C\u9762\u5DE5\u4F5C\u6D41\u6865\u63A5\u670D\u52A1\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u9762\u677F\u6216\u52A0\u8F7D\u63D2\u4EF6\u3002");
        }
      } finally {
        if (!controller.signal.aborted && token === generation.current) {
          setLoading(false);
          timer = setTimeout(refresh, 5e3);
        }
      }
    }
    void refresh();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [ctx, demo, revision]);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(WorkflowView, { snapshot, loading, error, onRefresh: () => {
    setDemo(false);
    setRevision((r) => r + 1);
  }, onDemo: () => setDemo((v) => !v) });
}
function applyLegacy(ctx) {
  ctx.effect(() => {
    const style = document.createElement("style");
    style.dataset.dshDesktopWorkflow = "";
    style.textContent = workflow_default;
    document.head.append(style);
    return () => style.remove();
  }, "desktop-workflow: scoped styles");
  ctx.effect(() => ctx.sidebarRightTabs.register({ id: PACKAGE, kind: "dsh-desktop-workflow", title: () => "\u5DE5\u4F5C\u6D41", guide: [{ id: "workflow", order: 35, title: () => "\u5DE5\u4F5C\u6D41", description: () => "\u53EA\u8BFB\u67E5\u770B Jev \u8DEF\u7531\u3001\u9636\u6BB5\u4E0E\u8BC1\u636E" }] }), "desktop-workflow: native tab");
  const Body = () => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ConnectedWorkflow, { ctx });
  ctx.effect(() => ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({ name: "sidebar.right.pane.tab", key: PACKAGE }, Body)), "desktop-workflow: native tab body");
}
function registerTeamCommandListener(ctx) {
  let mountedGeneration = 0;
  let requestGeneration = 0;
  const lifecycle = new AbortController();
  const offMounted = ctx.sidebarRight.mounted.subscribe(() => {
    mountedGeneration++;
  });
  const offCommand = ctx.on("command/executed", (sessionId, name) => {
    if (name !== "team" || ctx.sidebarRight.mounted.getSnapshot() !== sessionId) return;
    const mountedToken = mountedGeneration;
    const requestToken = ++requestGeneration;
    void teamCall(ctx, "snapshot", { sessionId }, lifecycle.signal).then((state) => {
      if (lifecycle.signal.aborted || requestToken !== requestGeneration || mountedToken !== mountedGeneration || ctx.sidebarRight.mounted.getSnapshot() !== sessionId) return;
      ctx.sidebarRight.openTab(PACKAGE, { params: { view: state.context.setupRequired ? "settings" : "results" } });
    }).catch(() => {
      if (!lifecycle.signal.aborted && requestToken === requestGeneration && mountedToken === mountedGeneration && ctx.sidebarRight.mounted.getSnapshot() === sessionId) ctx.sidebarRight.openTab(PACKAGE, { params: { view: "results" } });
    });
  });
  return () => {
    lifecycle.abort();
    offCommand();
    offMounted();
  };
}
function apply(ctx) {
  ctx.effect(() => {
    const style = document.createElement("style");
    style.dataset.dshDesktopWorkflow = "";
    style.textContent = workflow_default + "\n" + team_default;
    document.head.append(style);
    return () => style.remove();
  }, "desktop-workflow: scoped team styles");
  ctx.effect(() => ctx.sidebarRightTabs.register({ id: PACKAGE, kind: PACKAGE, title: () => "\u591A\u6A21\u578B\u56E2\u961F", guide: [{ id: "workflow", order: 35, title: () => "\u591A\u6A21\u578B\u56E2\u961F", description: () => "\u8BBE\u7F6E\u4E00\u6B21\uFF0C\u5728\u804A\u5929\u8F93\u5165 /team \u5373\u53EF\u5F00\u59CB" }] }), "desktop-workflow: native team tab");
  function Body({ sessionId, useTabInfo }) {
    const info = useTabInfo?.();
    const navigation = info?.tab.navigation;
    const [view, setView] = (0, import_react5.useState)("results");
    (0, import_react5.useEffect)(() => {
      setView(navigation?.params?.view === "settings" ? "settings" : "results");
    }, [sessionId, navigation?.revision]);
    return view === "settings" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ConnectedTeamSettings, { ctx, onClose: () => setView("results") }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ConnectedTeam, { ctx, sessionId, navigationRevision: navigation?.revision, onOpenSettings: () => setView("settings") });
  }
  const Settings = ({ close }) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ConnectedTeamSettings, { ctx, onClose: close });
  ctx.effect(() => ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({ name: "sidebar.right.pane.tab", key: PACKAGE }, Body)), "desktop-workflow: native team body");
  ctx.effect(() => ctx.slots.inject("settings.section", () => ctx.slots.register({ name: "settings.section", id: PACKAGE, order: 36, label: () => "\u591A\u6A21\u578B\u56E2\u961F" }, Settings)), "desktop-workflow: native team settings");
  ctx.effect(() => registerTeamCommandListener(ctx), "desktop-workflow: native team command acknowledgment");
}

return module.exports;}});
