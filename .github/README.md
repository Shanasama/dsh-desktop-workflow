# Jev 源码评估候选：先验收，不是新正式发行版

**本分支是供 DSH 审查和离线复现的源码候选。`liveReady=false`。预算 adapter 仍在 `evaluation/`，尚未接入生产 `/team`；动态成本路由尚未实现。**

**请先读 [DSH 验收说明](../DSH-ACCEPTANCE.zh-CN.md)。不要按旧安装说明把 `dist/dsh-desktop-workflow-0.5.4.tgz` 当成这一轮 Jev 功能部署。该包是冻结的旧 0.5.4，明确不含 `evaluation/`。**

- 独立分支：`review/jev-evaluation-stage1`，基于用户 `v0.5.3` 的 `6069f73b98b922d9db151e2b8637e250c33bbd4c`，加入冻结 0.5.4，再加入最终 Jev 源码和验收材料。没有合并到 main，也不覆盖用户原分支。
- 原始 137 个最终源码文件逐字节保留；根 README / INSTALL-ME 描述原插件使用，不能作为本轮 evaluation 已部署的证明。
- 作者原始测试：332 通过 / 0 失败 / 1 跳过。
- 独立复核：包内累计 331 通过 / 0 失败 / 2 项未覆盖，另有 10 个新增独立门禁场景通过。两套结果分开报告，不凑成同一次完整通过。
- 所有模型/Jev HTTP 都是注入模拟；真实 API、真实凭据操作为 0。没有真实费用、真实项目效果、Windows/Electron 的新验收结论。

[开始 DSH 验收](../DSH-ACCEPTANCE.zh-CN.md) · [原始最终源码清单](../review/author/source-manifest.json) · [作者结果](../review/author/verification-summary.json) · [独立结果](../review/independent/acceptance-summary.json)
