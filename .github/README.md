# DSH 多模型团队 · 0.6.3-candidate.1

本分支已同步新版完整源码、构建产物、候选插件包和自包含预览。仍为候选版，尚未通过真实付费模型/Jev 与 Windows/Electron 全链路验收，也没有安装到用户电脑。

[候选文件与 SHA-256](../dist/v0.6.3-candidate.1/README.zh-CN.md) · [安装包](../dist/v0.6.3-candidate.1/dsh-desktop-workflow-0.6.3-candidate.1.tgz) · [离线 HTML 预览](../dist/v0.6.3-candidate.1/dsh-workflow-preview-v0.6.3.html) · [完整说明](../README.md) · [本版验收](../docs/V063-CLOUD-ACCEPTANCE.zh-CN.md)

## 本版内容

运行卡片、工作流布局、独立任务实例、实际事件驱动的交接动效、节点模型信息和过期状态提示；原会话终态反馈不会唤醒主模型。步数耗尽分开诊断，仅允许受原预算约束的一次有界续做。保留两种主题、两种模式与原配置。

## 验证边界

构建、类型检查通过；主回归 413 通过、8 项平台/环境跳过；evaluation 123 通过；独立重点回归 44 通过。官方 rc.2 宿主 fixture、原会话 flush/JSONL 冷重载和云 Chromium 合成界面动画通过。没有付费模型/Jev 请求，Windows/Electron E2E 与完整 native frontend factory 未测。

本次只更新 `review/jev-evaluation-stage1`；所有旧 `dist` 文件保留用于历史与回滚。冻结源码和包内文档的“尚未发布”指冻结时状态，详见候选目录说明。历史 0.6.1 验收见 [原验收记录](../DSH-ACCEPTANCE.zh-CN.md)，历史结果不替代本候选验收。
