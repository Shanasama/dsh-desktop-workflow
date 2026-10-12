# DSH 多模型团队 · 0.6.3-candidate.3

本 review 分支已同步 candidate.3 完整源码、构建产物、精确插件包与单文件离线预览。仍为候选版，尚未通过 Windows/Electron 真机和真实付费模型/API 全链路验收。

[候选文件与 SHA-256](../dist/v0.6.3-candidate.3/README.zh-CN.md) · [安装包](../dist/v0.6.3-candidate.3/dsh-desktop-workflow-0.6.3-candidate.3.tgz) · [离线 HTML 预览](../dist/v0.6.3-candidate.3/dsh-desktop-workflow-0.6.3-candidate.3-preview.html) · [源码 ZIP](../dist/v0.6.3-candidate.3/dsh-desktop-workflow-0.6.3-candidate.3-source.zip)

## 本版内容

默认团队拓扑显示真实任务、逐节点所选模型与路由原因；同岗并发可展开。固定组织关系保持静态，真实新事件精确连接对应端点，同岗重试留在本卡，Jev 与宿主验证分别映射。完整保留 candidate.2 的官方原生 Todo 工具契约和同会话团队聊天上下文修复。

[拓扑与动效说明](../docs/V063-CANDIDATE3-TEAM-TOPOLOGY.zh-CN.md) · [Todo 与上下文修复](../docs/V063-CANDIDATE2-TOOL-CONTRACT.zh-CN.md) · [完整说明](../README.md)

## 验证边界

构建、类型检查通过；主测试 454 通过、0 失败、2 环境跳过；evaluation 123/123；官方工具契约 43/43。精确 tgz 经官方 rc.2 安装器离线安装测试，39 个 native child、30 个真实验证进程、0 外部请求。云浏览器覆盖两主题、三尺寸、真实关系端点、重复/乱序、断连与终态。

PowerShell 与真正非仓库 fixture 各一项跳过。真实后台 visibilitychange 未通过浏览器验收；系统 reduced-motion 未实际切换。没有 Windows/Electron 真机、真实模型/API、付费 Jev 或 TypeSafe 验收，不能视为生产全验收。

本次只更新 `review/jev-evaluation-stage1`，所有旧 `dist` 文件保留。冻结文件中的“未发布”表示冻结时状态，见[发布说明](../dist/v0.6.3-candidate.3/README.zh-CN.md)。历史验收不替代本候选验收。
