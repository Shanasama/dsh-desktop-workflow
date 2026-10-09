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
  ConnectedWorkflow: () => ConnectedWorkflow,
  ENDPOINT: () => ENDPOINT,
  PACKAGE: () => PACKAGE,
  apply: () => apply,
  inject: () => inject,
  requestWithDeadline: () => requestWithDeadline
});
module.exports = __toCommonJS(index_exports);
var import_react2 = require("react");

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

// client/workflow.css
var workflow_default = '.dsh-workflow {\n  --wf-bg: #fff;\n  --wf-surface: #fff;\n  --wf-canvas: #fafbfc;\n  --wf-raised: #f5f6f8;\n  --wf-text: var(--dsw-alias-label-primary, #202735);\n  --wf-muted: #737b88;\n  --wf-faint: #a0a7b3;\n  --wf-border: #e7eaf0;\n  --wf-line: #d8dfe7;\n  --wf-green: #397668;\n  --wf-green-soft: #eef6f2;\n  --wf-blue: #506cc7;\n  --wf-blue-soft: #f0f3ff;\n  --wf-amber: #947133;\n  --wf-amber-soft: #fcf7e9;\n  --wf-red: #b45259;\n  --wf-red-soft: #fff1f2;\n  container: dsh-workflow / inline-size;\n  box-sizing: border-box;\n  width: 100%;\n  min-width: 0;\n  color: var(--wf-text);\n  background: var(--wf-bg);\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;\n  font-size: 13px;\n  line-height: 1.5;\n  -webkit-font-smoothing: antialiased;\n  text-align: left;\n  color-scheme: light;\n}\n.dsh-workflow *, .dsh-workflow *::before, .dsh-workflow *::after { box-sizing: border-box; }\n.dsh-workflow button { font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }\n.dsh-workflow button:disabled { cursor: wait; opacity: .55; }\n.dsh-workflow button:focus-visible { outline: 3px solid var(--wf-blue); outline-offset: 4px; }\n.dsh-workflow h1, .dsh-workflow h2, .dsh-workflow h3, .dsh-workflow h4, .dsh-workflow p { margin: 0; }\n.dsh-workflow .wf-icon { width: 18px; height: 18px; display: inline-block; flex: 0 0 auto; vertical-align: middle; }\n.dsh-workflow .wf-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 22px 20px 19px; border-bottom: 1px solid var(--wf-border); }\n.dsh-workflow .wf-heading-group { display: flex; align-items: center; gap: 12px; min-width: 0; }\n.dsh-workflow .wf-appmark { display: none; align-items: center; justify-content: center; width: 42px; height: 42px; border: 1px solid var(--wf-border); background: var(--wf-surface); border-radius: 12px; color: var(--wf-green); box-shadow: 0 2px 3px #1a273406; }\n.dsh-workflow .wf-appmark .wf-icon { width: 23px; height: 23px; }\n.dsh-workflow .wf-eyebrow { font-size: 8px; letter-spacing: 1.15px; font-weight: 650; white-space: nowrap; color: var(--wf-muted); margin-bottom: 3px; }\n.dsh-workflow .wf-eyebrow span { color: var(--wf-line); padding: 0 3px; }\n.dsh-workflow h1 { font-size: 23px; font-weight: 630; line-height: 1.15; letter-spacing: -.8px; }\n.dsh-workflow .wf-header-actions { display: flex; align-items: center; gap: 7px; }\n.dsh-workflow .wf-readonly { display: none; align-items: center; gap: 5px; font-size: 11px; color: var(--wf-muted); margin-right: 8px; }\n.dsh-workflow .wf-readonly .wf-icon { width: 13px; height: 13px; }\n.dsh-workflow .wf-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 34px; padding: 7px 10px; border-radius: 8px; border: 1px solid var(--wf-border); background: var(--wf-surface); font-size: 11px; font-weight: 580; white-space: nowrap; transition: background .16s, border-color .16s, box-shadow .16s; }\n.dsh-workflow .wf-button:hover:not(:disabled) { background: var(--wf-raised); border-color: var(--wf-line); }\n.dsh-workflow .wf-button .wf-icon { width: 14px; height: 14px; }\n.dsh-workflow .wf-demo-button .wf-icon { display: none; }\n.dsh-workflow .wf-demo-button.is-active { color: var(--wf-amber); background: var(--wf-amber-soft); border-color: #d7be853d; }\n.dsh-workflow .wf-refresh-button > span { display: none; }\n.dsh-workflow .wf-refresh-button { width: 34px; padding: 7px; }\n.dsh-workflow .wf-button--primary { background: var(--wf-text); color: var(--wf-surface); border-color: var(--wf-text); }\n.dsh-workflow .wf-button--primary:hover:not(:disabled) { background: var(--wf-green); border-color: var(--wf-green); }\n.dsh-workflow .wf-text-button { display: flex; align-items: center; gap: 5px; background: transparent; border: 0; padding: 5px 0 5px 10px; font-size: 12px; font-weight: 600; }\n.dsh-workflow .wf-text-button .wf-icon { width: 14px; height: 14px; }\n.dsh-workflow .wf-demo-notice { display: flex; align-items: flex-start; gap: 9px; padding: 11px 20px; background: var(--wf-amber-soft); color: var(--wf-amber); border-bottom: 1px solid #b8944426; font-size: 11px; line-height: 1.5; }\n.dsh-workflow .wf-demo-tag { flex-shrink: 0; font-size: 8px; line-height: 17px; font-weight: 750; letter-spacing: .65px; padding: 0 5px; border: 1px solid #b8944466; border-radius: 4px; }\n.dsh-workflow .wf-demo-note { display: none; margin-left: auto; white-space: nowrap; opacity: .85; }\n.dsh-workflow .wf-notice { display: flex; align-items: flex-start; gap: 10px; padding: 14px 18px; margin: 16px 20px 0; border: 1px solid var(--wf-border); border-radius: 9px; font-size: 11px; }\n.dsh-workflow .wf-notice > .wf-icon { margin-top: 1px; width: 16px; height: 16px; }\n.dsh-workflow .wf-notice > div { flex: 1; min-width: 0; }\n.dsh-workflow .wf-notice strong { font-weight: 620; }\n.dsh-workflow .wf-notice p { margin-top: 3px; opacity: .9; overflow-wrap: anywhere; }\n.dsh-workflow .wf-notice--error { color: var(--wf-red); background: var(--wf-red-soft); border-color: #b4525925; }\n.dsh-workflow .wf-notice--warning { color: var(--wf-amber); background: var(--wf-amber-soft); border-color: #b8944426; }\n.dsh-workflow .wf-run-summary { padding: 25px 20px 24px; display: flex; flex-direction: column; gap: 13px; }\n.dsh-workflow .wf-run-title { min-width: 0; }\n.dsh-workflow .wf-section-kicker { display: block; font-size: 9px; font-weight: 650; color: var(--wf-muted); letter-spacing: 1.35px; margin-bottom: 8px; }\n.dsh-workflow .wf-run-title h2 { font-size: 20px; letter-spacing: -.55px; line-height: 1.3; font-weight: 590; overflow-wrap: anywhere; }\n.dsh-workflow .wf-run-title p { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 11px; color: var(--wf-muted); margin-top: 8px; }\n.dsh-workflow .wf-summary-dot { width: 5px; height: 5px; background: var(--wf-green); border-radius: 50%; margin-right: 1px; }\n.dsh-workflow .wf-summary-separator { color: var(--wf-faint); margin: 0 2px; }\n.dsh-workflow .wf-run-title .wf-run-id { font-size: 9px; gap: 7px; margin-top: 5px; color: var(--wf-faint); }\n.dsh-workflow .wf-run-id code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 9px; color: var(--wf-muted); overflow-wrap: anywhere; word-break: break-word; min-width: 0; }\n.dsh-workflow .wf-run-status { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; flex: 0 0 auto; }\n.dsh-workflow .wf-run-status > span:last-child { font-size: 10px; color: var(--wf-muted); }\n.dsh-workflow .wf-status { display: inline-flex; width: fit-content; align-items: center; gap: 6px; color: var(--wf-muted); background: var(--wf-raised); border: 1px solid var(--wf-border); padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 550; white-space: nowrap; line-height: 1.4; }\n.dsh-workflow .wf-status .wf-icon { width: 12px; height: 12px; stroke-width: 2; }\n.dsh-workflow .wf-status-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }\n.dsh-workflow .wf-status--completed { color: var(--wf-green); background: var(--wf-green-soft); border-color: #39766818; }\n.dsh-workflow .wf-status--running { color: var(--wf-blue); background: var(--wf-blue-soft); border-color: #506cc71b; }\n.dsh-workflow .wf-status--review { color: var(--wf-blue); background: var(--wf-blue-soft); border-color: #506cc71b; }\n.dsh-workflow .wf-status--blocked, .dsh-workflow .wf-status--approval, .dsh-workflow .wf-status--stale { color: var(--wf-amber); background: var(--wf-amber-soft); border-color: #9471331c; }\n.dsh-workflow .wf-status--failed { color: var(--wf-red); background: var(--wf-red-soft); border-color: #b452591c; }\n.dsh-workflow .wf-status--subtle { background: transparent; border: 0; padding: 0; font-size: 10px; }\n.dsh-workflow .wf-status--pending, .dsh-workflow .wf-status--waiting, .dsh-workflow .wf-status--skipped { color: var(--wf-muted); }\n.dsh-workflow .wf-status--pending .wf-status-dot { background: transparent; border: 1px solid var(--wf-faint); width: 6px; height: 6px; }\n.dsh-workflow .wf-status--running .wf-status-dot { box-shadow: 0 0 0 3px #506cc713; }\n.dsh-workflow .wf-workspace { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; padding: 0 20px; }\n.dsh-workflow .wf-map-panel { border: 1px solid var(--wf-border); border-radius: 12px; min-width: 0; overflow: hidden; align-self: start; }\n.dsh-workflow .wf-panel-heading { min-height: 69px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 15px 17px; background: var(--wf-surface); border-bottom: 1px solid var(--wf-border); }\n.dsh-workflow .wf-panel-heading h3 { font-size: 12px; font-weight: 620; }\n.dsh-workflow .wf-panel-heading > div > span { display: block; margin-top: 3px; font-size: 10px; color: var(--wf-muted); }\n.dsh-workflow .wf-keyboard-hint { display: none; color: var(--wf-muted); font-size: 10px; align-items: center; gap: 6px; }\n.dsh-workflow .wf-keyboard-hint .wf-icon { width: 13px; height: 13px; }\n.dsh-workflow .wf-canvas { background-color: var(--wf-canvas); background-image: radial-gradient(var(--wf-line) .65px, transparent .65px); background-size: 15px 15px; padding: 19px 16px 15px; }\n.dsh-workflow .wf-map { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }\n.dsh-workflow .wf-node-wrap { position: relative; z-index: 1; min-width: 0; }\n.dsh-workflow .wf-node { display: grid; grid-template-columns: 36px minmax(0, 1fr) auto; grid-template-rows: auto auto; column-gap: 11px; align-items: center; position: relative; width: 100%; min-width: 0; padding: 13px 14px; border: 1px solid var(--wf-line); border-radius: 10px; background: var(--wf-surface); box-shadow: 0 2px 3px #25344a03; text-align: left; transition: border-color .18s, box-shadow .18s, transform .18s, background .18s; }\n.dsh-workflow .wf-node:hover { border-color: var(--wf-muted); box-shadow: 0 3px 9px #25344a0a; transform: translateY(-1px); }\n.dsh-workflow .wf-node.is-selected { border-color: var(--wf-blue); box-shadow: 0 0 0 3px #506cc711, 0 3px 10px #25344a06; }\n.dsh-workflow .wf-node--completed { border-color: #39766835; }\n.dsh-workflow .wf-node--failed { border-color: #b4525955; }\n.dsh-workflow .wf-node--running { border-color: #506cc77a; }\n.dsh-workflow .wf-node-top { display: contents; }\n.dsh-workflow .wf-node-icon { grid-column: 1; grid-row: 1 / 3; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 9px; background: var(--wf-raised); color: var(--wf-muted); }\n.dsh-workflow .wf-node--completed .wf-node-icon { background: var(--wf-green-soft); color: var(--wf-green); }\n.dsh-workflow .wf-node--running .wf-node-icon, .dsh-workflow .wf-node--review .wf-node-icon { background: var(--wf-blue-soft); color: var(--wf-blue); }\n.dsh-workflow .wf-node--approval .wf-node-icon, .dsh-workflow .wf-node--blocked .wf-node-icon { background: var(--wf-amber-soft); color: var(--wf-amber); }\n.dsh-workflow .wf-node--failed .wf-node-icon { background: var(--wf-red-soft); color: var(--wf-red); }\n.dsh-workflow .wf-node-icon .wf-icon { width: 18px; height: 18px; }\n.dsh-workflow .wf-node-number { grid-column: 3; grid-row: 1; color: var(--wf-faint); font-size: 9px; letter-spacing: .5px; font-variant-numeric: tabular-nums; align-self: start; }\n.dsh-workflow .wf-node-title { grid-column: 2; grid-row: 1; font-size: 12px; font-weight: 610; line-height: 1.35; }\n.dsh-workflow .wf-node-description { display: none; color: var(--wf-muted); font-size: 10px; margin-top: 3px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }\n.dsh-workflow .wf-node-bottom { grid-column: 2 / 4; grid-row: 2; display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 5px; }\n.dsh-workflow .wf-evidence-count { display: inline-flex; align-items: center; gap: 3px; font-size: 9px; font-variant-numeric: tabular-nums; color: var(--wf-faint); }\n.dsh-workflow .wf-evidence-count .wf-icon { width: 11px; height: 11px; }\n.dsh-workflow .wf-node-chevron { width: 11px; height: 11px; color: var(--wf-faint); }\n.dsh-workflow .wf-connector { pointer-events: none; position: absolute; display: flex; align-items: center; justify-content: center; width: 16px; height: 17px; left: 50%; top: 100%; transform: translateX(-50%); color: var(--wf-line); }\n.dsh-workflow .wf-connector > span { border-left: 1px dashed currentColor; height: 100%; }\n.dsh-workflow .wf-connector > .wf-icon { position: absolute; bottom: -1px; left: 2px; width: 12px; height: 12px; transform: rotate(90deg); stroke-width: 1.8; background: var(--wf-canvas); }\n.dsh-workflow .wf-node-wrap--completed .wf-connector { color: #8cb4a5; }\n.dsh-workflow .wf-node-wrap--completed .wf-connector > span { border-style: solid; }\n.dsh-workflow .wf-canvas-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding-top: 21px; }\n.dsh-workflow .wf-canvas-caption { display: none; gap: 6px; align-items: center; font-size: 9px; color: var(--wf-muted); }\n.dsh-workflow .wf-canvas-caption .wf-icon { width: 12px; height: 12px; }\n.dsh-workflow .wf-legend { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 5px; width: 100%; font-size: 8px; color: var(--wf-muted); }\n.dsh-workflow .wf-legend i { display: inline-block; width: 5px; height: 5px; border-radius: 50%; margin-left: 10px; }\n.dsh-workflow .wf-legend i:first-child { margin-left: 0; }\n.dsh-workflow .wf-legend-complete { background: var(--wf-green); }\n.dsh-workflow .wf-legend-running { background: var(--wf-blue); }\n.dsh-workflow .wf-legend-pending { border: 1px solid var(--wf-faint); }\n.dsh-workflow .wf-empty-bar { padding: 17px; display: flex; flex-wrap: wrap; align-items: center; gap: 14px; background: var(--wf-surface); border-top: 1px solid var(--wf-border); }\n.dsh-workflow .wf-empty-bar > div { flex: 1 1 180px; }\n.dsh-workflow .wf-empty-bar strong { font-size: 11px; font-weight: 610; }\n.dsh-workflow .wf-empty-bar p { font-size: 10px; line-height: 1.6; color: var(--wf-muted); margin-top: 4px; overflow-wrap: anywhere; }\n.dsh-workflow .wf-inspector { display: flex; flex-direction: column; min-width: 0; border: 1px solid var(--wf-border); border-radius: 12px; background: var(--wf-surface); padding: 20px; }\n.dsh-workflow .wf-inspector-label { display: flex; align-items: center; justify-content: space-between; color: var(--wf-muted); font-size: 8px; font-weight: 620; letter-spacing: 1.15px; margin-bottom: 19px; }\n.dsh-workflow .wf-inspector-label > span:last-child { font-weight: 450; font-variant-numeric: tabular-nums; letter-spacing: .5px; color: var(--wf-faint); }\n.dsh-workflow .wf-inspector-title { display: flex; align-items: center; gap: 11px; }\n.dsh-workflow .wf-detail-icon { display: flex; align-items: center; justify-content: center; width: 41px; height: 41px; border: 1px solid var(--wf-border); background: var(--wf-canvas); border-radius: 11px; }\n.dsh-workflow .wf-detail-icon .wf-icon { width: 22px; height: 22px; }\n.dsh-workflow .wf-inspector-title h3 { font-size: 18px; line-height: 1.4; font-weight: 610; letter-spacing: -.45px; }\n.dsh-workflow .wf-inspector-title .wf-status { margin-top: 2px; }\n.dsh-workflow .wf-inspector-summary { font-size: 11px; color: var(--wf-muted); line-height: 1.75; margin-top: 15px; overflow-wrap: anywhere; white-space: pre-wrap; }\n.dsh-workflow .wf-inspector-section { border-top: 1px solid var(--wf-border); padding-top: 17px; margin-top: 19px; }\n.dsh-workflow .wf-inspector-section h4 { display: flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 620; margin-bottom: 13px; }\n.dsh-workflow .wf-inspector-section h4 > span { display: inline-flex; align-items: center; justify-content: center; min-width: 17px; height: 17px; border-radius: 5px; background: var(--wf-raised); font-size: 9px; font-weight: 450; color: var(--wf-muted); }\n.dsh-workflow .wf-facts { display: flex; flex-direction: column; gap: 10px; margin: 0; font-size: 10px; }\n.dsh-workflow .wf-facts > div { display: grid; grid-template-columns: minmax(75px, .8fr) minmax(0, 1.3fr); gap: 15px; align-items: start; }\n.dsh-workflow .wf-facts dt { color: var(--wf-muted); }\n.dsh-workflow .wf-facts dd { margin: 0; text-align: right; overflow-wrap: anywhere; }\n.dsh-workflow .wf-probabilities { display: grid; gap: 10px; margin-top: 18px; }\n.dsh-workflow .wf-probability > div:first-child { display: flex; align-items: center; justify-content: space-between; font-size: 9px; color: var(--wf-muted); margin-bottom: 5px; }\n.dsh-workflow .wf-probability > div:first-child > span:last-child { font-variant-numeric: tabular-nums; }\n.dsh-workflow .wf-probability-track { height: 4px; border-radius: 3px; background: var(--wf-raised); overflow: hidden; }\n.dsh-workflow .wf-probability-track > span { display: block; height: 100%; border-radius: inherit; background: var(--wf-line); }\n.dsh-workflow .wf-probability.is-chosen > div:first-child { color: var(--wf-green); }\n.dsh-workflow .wf-probability.is-chosen .wf-probability-track > span { background: var(--wf-green); }\n.dsh-workflow .wf-small-print { color: var(--wf-muted); font-size: 9px; line-height: 1.6; margin-top: 12px; }\n.dsh-workflow .wf-evidence-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }\n.dsh-workflow .wf-evidence-list li { display: flex; align-items: flex-start; gap: 8px; padding: 10px; border: 1px solid var(--wf-border); background: var(--wf-canvas); border-radius: 7px; color: var(--wf-muted); font-size: 10px; line-height: 1.65; }\n.dsh-workflow .wf-evidence-list li .wf-icon { width: 13px; height: 13px; margin-top: 2px; color: var(--wf-faint); }\n.dsh-workflow .wf-evidence-list li > span { min-width: 0; overflow-wrap: anywhere; white-space: pre-wrap; }\n.dsh-workflow .wf-no-evidence { display: flex; align-items: flex-start; gap: 9px; padding: 13px; border: 1px dashed var(--wf-line); border-radius: 8px; color: var(--wf-muted); background: var(--wf-canvas); }\n.dsh-workflow .wf-no-evidence .wf-icon { width: 15px; height: 15px; color: var(--wf-faint); margin-top: 1px; }\n.dsh-workflow .wf-no-evidence p { font-size: 10px; line-height: 1.65; }\n.dsh-workflow .wf-inspector-footer { display: flex; align-items: center; gap: 6px; padding-top: 21px; margin-top: auto; font-size: 9px; line-height: 1.5; color: var(--wf-muted); }\n.dsh-workflow .wf-inspector-footer .wf-icon { width: 12px; height: 12px; }\n.dsh-workflow .wf-stage-note { display: flex; align-items: flex-start; gap: 7px; font-size: 10px; color: var(--wf-amber); background: var(--wf-amber-soft); border-radius: 7px; padding: 10px; margin-top: 14px; }\n.dsh-workflow .wf-stage-note .wf-icon { width: 13px; height: 13px; margin-top: 2px; }\n.dsh-workflow .wf-stage-note--failed { color: var(--wf-red); background: var(--wf-red-soft); }\n.dsh-workflow .wf-activity { border: 1px solid var(--wf-border); border-radius: 11px; margin: 18px 20px 0; overflow: hidden; background: var(--wf-surface); }\n.dsh-workflow .wf-activity-toggle { width: 100%; background: transparent; border: 0; padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 15px; text-align: left; }\n.dsh-workflow .wf-activity-toggle > span { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }\n.dsh-workflow .wf-activity-toggle .wf-icon { width: 15px; height: 15px; color: var(--wf-muted); }\n.dsh-workflow .wf-activity-toggle strong { font-size: 11px; font-weight: 610; }\n.dsh-workflow .wf-activity-toggle > .wf-icon { transition: transform .18s; width: 13px; height: 13px; }\n.dsh-workflow .wf-activity-toggle > .wf-icon.is-open { transform: rotate(90deg); }\n.dsh-workflow .wf-activity-description { display: none; font-size: 10px; color: var(--wf-muted); margin-left: 2px; }\n.dsh-workflow .wf-activity-body { padding: 0 16px; }\n.dsh-workflow .wf-activity-list { list-style: none; margin: 0; padding: 0 0 3px; }\n.dsh-workflow .wf-activity-list li { position: relative; display: flex; align-items: flex-start; gap: 10px; padding: 13px 0; border-top: 1px solid var(--wf-border); }\n.dsh-workflow .wf-event-icon { display: flex; align-items: center; justify-content: center; width: 23px; height: 23px; flex-shrink: 0; background: var(--wf-raised); color: var(--wf-muted); border-radius: 7px; margin-top: 1px; }\n.dsh-workflow .wf-event-icon > .wf-icon { width: 12px; height: 12px; }\n.dsh-workflow .wf-event-icon--completed { background: var(--wf-green-soft); color: var(--wf-green); }\n.dsh-workflow .wf-event-icon--running, .dsh-workflow .wf-event-icon--review { background: var(--wf-blue-soft); color: var(--wf-blue); }\n.dsh-workflow .wf-event-icon--failed { background: var(--wf-red-soft); color: var(--wf-red); }\n.dsh-workflow .wf-event-icon--approval, .dsh-workflow .wf-event-icon--blocked { background: var(--wf-amber-soft); color: var(--wf-amber); }\n.dsh-workflow .wf-event-main { flex: 1; min-width: 0; }\n.dsh-workflow .wf-event-label { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 10px; font-weight: 600; }\n.dsh-workflow .wf-event-label .wf-status { font-size: 9px; font-weight: 450; }\n.dsh-workflow .wf-event-main p { color: var(--wf-muted); font-size: 10px; line-height: 1.65; margin-top: 4px; overflow-wrap: anywhere; }\n.dsh-workflow .wf-activity-list time { font-size: 9px; color: var(--wf-faint); font-variant-numeric: tabular-nums; white-space: nowrap; padding-top: 2px; }\n.dsh-workflow .wf-activity-empty { display: flex; align-items: center; gap: 8px; padding: 0 0 17px; font-size: 10px; color: var(--wf-muted); }\n.dsh-workflow .wf-empty-event-dot { flex-shrink: 0; width: 6px; height: 6px; border: 1px solid var(--wf-faint); border-radius: 50%; }\n.dsh-workflow .wf-footer { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 18px 20px 23px; color: var(--wf-muted); font-size: 9px; line-height: 1.6; }\n.dsh-workflow .wf-footer > span:first-child { display: flex; align-items: flex-start; gap: 6px; max-width: 730px; }\n.dsh-workflow .wf-footer > span:first-child > .wf-icon { width: 11px; height: 11px; margin-top: 2px; }\n.dsh-workflow .wf-footer-signature { display: none; font-size: 9px; font-weight: 650; letter-spacing: 1.3px; white-space: nowrap; }\n.dsh-workflow .wf-footer-signature > span { margin-left: 4px; font-size: 8px; font-weight: 450; color: var(--wf-faint); }\n.dsh-workflow .wf-visually-hidden { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }\n.dsh-workflow .wf-spin { animation: wf-spin 1.3s linear infinite; }\n@keyframes wf-spin { to { transform: rotate(360deg); } }\n\n@container dsh-workflow (min-width: 470px) {\n  .dsh-workflow .wf-appmark, .dsh-workflow .wf-demo-button .wf-icon { display: inline-flex; }\n  .dsh-workflow .wf-readonly { display: inline-flex; }\n  .dsh-workflow .wf-eyebrow { font-size: 8px; }\n  .dsh-workflow .wf-node-description { display: block; grid-column: 2; grid-row: 2; margin-top: 3px; }\n  .dsh-workflow .wf-node-bottom { grid-column: 3; grid-row: 1 / 3; flex-direction: column; align-items: flex-end; gap: 8px; margin-top: 0; }\n  .dsh-workflow .wf-node-number { display: none; }\n  .dsh-workflow .wf-canvas-caption { display: flex; }\n  .dsh-workflow .wf-legend { width: auto; }\n  .dsh-workflow .wf-activity-description { display: inline; }\n}\n\n@container dsh-workflow (min-width: 600px) {\n  .dsh-workflow .wf-header { padding: 25px 27px 22px; }\n  .dsh-workflow .wf-eyebrow { font-size: 9px; letter-spacing: 1.2px; }\n  .dsh-workflow h1 { font-size: 25px; }\n  .dsh-workflow .wf-header-actions { gap: 9px; }\n  .dsh-workflow .wf-refresh-button { width: auto; padding: 7px 12px; }\n  .dsh-workflow .wf-refresh-button > span { display: inline; }\n  .dsh-workflow .wf-demo-notice { padding-left: 27px; padding-right: 27px; }\n  .dsh-workflow .wf-run-summary { padding: 27px; flex-direction: row; align-items: center; justify-content: space-between; gap: 25px; }\n  .dsh-workflow .wf-run-title h2 { font-size: 23px; }\n  .dsh-workflow .wf-run-status { flex-direction: column; align-items: flex-end; gap: 6px; }\n  .dsh-workflow .wf-workspace { padding: 0 27px; }\n  .dsh-workflow .wf-notice, .dsh-workflow .wf-activity { margin-left: 27px; margin-right: 27px; }\n  .dsh-workflow .wf-footer { padding-left: 27px; padding-right: 27px; }\n  .dsh-workflow .wf-footer-signature { display: block; }\n  .dsh-workflow .wf-keyboard-hint { display: flex; }\n  .dsh-workflow .wf-inspector { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 25px; }\n  .dsh-workflow .wf-inspector-label { grid-column: 1 / -1; margin-bottom: 15px; }\n  .dsh-workflow .wf-inspector-title { grid-column: 1; }\n  .dsh-workflow .wf-inspector-summary { grid-column: 1; }\n  .dsh-workflow .wf-inspector-section { grid-column: 2; grid-row: 2 / 5; margin-top: 0; border-top: 0; border-left: 1px solid var(--wf-border); padding-top: 0; padding-left: 23px; }\n  .dsh-workflow .wf-evidence-section { grid-column: 1 / -1; grid-row: auto; border-left: 0; border-top: 1px solid var(--wf-border); padding: 17px 0 0; margin-top: 19px; }\n  .dsh-workflow .wf-inspector-footer { grid-column: 1 / -1; }\n  .dsh-workflow .wf-stage-note { grid-column: 1; }\n}\n\n@container dsh-workflow (min-width: 790px) {\n  .dsh-workflow .wf-map { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 43px 27px; }\n  .dsh-workflow .wf-node-wrap--0 { grid-area: 1 / 1; }\n  .dsh-workflow .wf-node-wrap--1 { grid-area: 1 / 2; }\n  .dsh-workflow .wf-node-wrap--2 { grid-area: 1 / 3; }\n  .dsh-workflow .wf-node-wrap--3 { grid-area: 2 / 3; }\n  .dsh-workflow .wf-node-wrap--4 { grid-area: 2 / 2; }\n  .dsh-workflow .wf-node-wrap--5 { grid-area: 2 / 1; }\n  .dsh-workflow .wf-node { display: flex; flex-direction: column; align-items: stretch; min-height: 146px; padding: 15px; border-radius: 11px; }\n  .dsh-workflow .wf-node-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }\n  .dsh-workflow .wf-node-icon { width: 33px; height: 33px; }\n  .dsh-workflow .wf-node-number { display: inline; }\n  .dsh-workflow .wf-node-title { font-size: 13px; letter-spacing: -.1px; }\n  .dsh-workflow .wf-node-description { display: block; }\n  .dsh-workflow .wf-node-bottom { flex-direction: row; align-items: center; margin-top: 17px; }\n  .dsh-workflow .wf-connector { top: 50%; left: 100%; transform: translateY(-50%); width: 28px; height: 16px; }\n  .dsh-workflow .wf-connector > span { height: 0; width: 100%; border-left: 0; border-top: 1px dashed currentColor; }\n  .dsh-workflow .wf-connector > .wf-icon { top: 2px; bottom: auto; left: auto; right: -1px; transform: none; }\n  .dsh-workflow .wf-node-wrap--2 .wf-connector { width: 16px; height: 44px; left: 50%; top: 100%; transform: translateX(-50%); }\n  .dsh-workflow .wf-node-wrap--2 .wf-connector > span { border-top: 0; width: 0; height: 100%; border-left: 1px dashed currentColor; }\n  .dsh-workflow .wf-node-wrap--2 .wf-connector > .wf-icon { top: auto; bottom: -1px; right: 2px; transform: rotate(90deg); }\n  .dsh-workflow .wf-node-wrap--3 .wf-connector, .dsh-workflow .wf-node-wrap--4 .wf-connector { left: auto; right: 100%; }\n  .dsh-workflow .wf-node-wrap--3 .wf-connector > .wf-icon, .dsh-workflow .wf-node-wrap--4 .wf-connector > .wf-icon { left: -1px; right: auto; transform: rotate(180deg); }\n  .dsh-workflow .wf-node-wrap--completed .wf-connector > span { border-style: solid; }\n  .dsh-workflow .wf-canvas { padding: 29px 24px 19px; }\n  .dsh-workflow .wf-canvas-footer { padding-top: 26px; }\n  .dsh-workflow .wf-demo-note { display: inline; }\n}\n\n@container dsh-workflow (min-width: 1040px) {\n  .dsh-workflow .wf-header { padding: 25px 32px; }\n  .dsh-workflow .wf-run-summary { padding: 30px 32px 28px; }\n  .dsh-workflow .wf-run-title h2 { font-size: 25px; }\n  .dsh-workflow .wf-workspace { grid-template-columns: minmax(0, 1fr) 286px; gap: 19px; padding: 0 32px; align-items: start; }\n  .dsh-workflow .wf-inspector { display: flex; padding: 21px; min-height: 472px; }\n  .dsh-workflow .wf-inspector-label { margin-bottom: 19px; }\n  .dsh-workflow .wf-inspector-section { border-left: 0; border-top: 1px solid var(--wf-border); padding: 17px 0 0; margin-top: 19px; }\n  .dsh-workflow .wf-panel-heading { padding: 17px 21px; }\n  .dsh-workflow .wf-panel-heading > div > span { font-size: 10px; }\n  .dsh-workflow .wf-keyboard-hint { font-size: 9px; }\n  .dsh-workflow .wf-canvas { padding: 34px 24px 19px; }\n  .dsh-workflow .wf-node { padding: 15px 13px; }\n  .dsh-workflow .wf-node-title { font-size: 14px; }\n  .dsh-workflow .wf-node-description { font-size: 9px; }\n  .dsh-workflow .wf-canvas-caption { font-size: 8px; }\n  .dsh-workflow .wf-legend { font-size: 8px; }\n  .dsh-workflow .wf-legend i { margin-left: 7px; }\n  .dsh-workflow .wf-demo-notice { padding-left: 32px; padding-right: 32px; }\n  .dsh-workflow .wf-notice, .dsh-workflow .wf-activity { margin-left: 32px; margin-right: 32px; }\n  .dsh-workflow .wf-footer { padding-left: 32px; padding-right: 32px; }\n  .dsh-workflow .wf-activity-toggle { padding: 16px 21px; }\n  .dsh-workflow .wf-activity-body { padding: 0 21px; }\n  .dsh-workflow .wf-event-main { display: flex; align-items: baseline; gap: 18px; }\n  .dsh-workflow .wf-event-label { flex: 0 0 162px; }\n  .dsh-workflow .wf-event-main p { margin-top: 0; }\n}\n\n/* The host owns its resolved theme. An absent DSH dark-theme attribute means\n   light, even when the OS prefers dark. Explicit preview themes also work. */\nbody[data-ds-dark-theme] .dsh-workflow, .dsh-workflow[data-theme="dark"] {\n  --wf-bg: #181b21; --wf-surface: #20242c; --wf-canvas: #1b1f26; --wf-raised: #292e37;\n  --wf-text: #e0e4ec; --wf-muted: #9ca6b6; --wf-faint: #727f92; --wf-border: #303641; --wf-line: #3c4655;\n  --wf-green: #89bda9; --wf-green-soft: #253b34; --wf-blue: #a1b3f5; --wf-blue-soft: #2b334c;\n  --wf-amber: #dbc08d; --wf-amber-soft: #393328; --wf-red: #e3a1a7; --wf-red-soft: #412d34;\n  color-scheme: dark;\n}\n@media (prefers-reduced-motion: reduce) {\n  .dsh-workflow *, .dsh-workflow *::before, .dsh-workflow *::after { animation: none !important; transition: none !important; }\n}\n';

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
    timer = setTimeout(() => finish(new Error("\u5DE5\u4F5C\u6D41\u6865\u63A5\u670D\u52A1\u5728 15 \u79D2\u5185\u672A\u54CD\u5E94\uFF0C\u5C06\u81EA\u52A8\u91CD\u8BD5\u3002")), timeoutMs);
    try {
      call(request.signal).then((value) => finish(void 0, value), (error) => finish(error instanceof Error ? error : new Error("Bridge request failed.")));
    } catch (error) {
      finish(error instanceof Error ? error : new Error("Bridge request failed."));
    }
  });
}

// client/index.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var inject = ["slots", "sidebarRightTabs", "connection"];
var PACKAGE = "dsh-desktop-workflow";
var ENDPOINT = "dsh-desktop-workflow/snapshot";
function ConnectedWorkflow({ ctx }) {
  const [snapshot, setSnapshot] = (0, import_react2.useState)(null);
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [error, setError] = (0, import_react2.useState)();
  const [demo, setDemo] = (0, import_react2.useState)(false);
  const [revision, setRevision] = (0, import_react2.useState)(0);
  const generation = (0, import_react2.useRef)(0);
  (0, import_react2.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(WorkflowView, { snapshot, loading, error, onRefresh: () => {
    setDemo(false);
    setRevision((r) => r + 1);
  }, onDemo: () => setDemo((v) => !v) });
}
function apply(ctx) {
  ctx.effect(() => {
    const style = document.createElement("style");
    style.dataset.dshDesktopWorkflow = "";
    style.textContent = workflow_default;
    document.head.append(style);
    return () => style.remove();
  }, "desktop-workflow: scoped styles");
  ctx.effect(() => ctx.sidebarRightTabs.register({ id: PACKAGE, kind: "dsh-desktop-workflow", title: () => "\u5DE5\u4F5C\u6D41", guide: [{ id: "workflow", order: 35, title: () => "\u5DE5\u4F5C\u6D41", description: () => "\u53EA\u8BFB\u67E5\u770B Jev \u8DEF\u7531\u3001\u9636\u6BB5\u4E0E\u8BC1\u636E" }] }), "desktop-workflow: native tab");
  const Body = () => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ConnectedWorkflow, { ctx });
  ctx.effect(() => ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({ name: "sidebar.right.pane.tab", key: PACKAGE }, Body)), "desktop-workflow: native tab body");
}

return module.exports;}});
