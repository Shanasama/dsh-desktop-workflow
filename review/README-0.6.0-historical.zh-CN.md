# DSH 多模型团队 0.6.0：生产接线候选

**这一版已提供可安装的 0.6.0 插件包。原生 `/team`、预算控制、显式动态路由、主/shadow Jev、设置持久化和右侧运行状态已接入生产源码，并包含在 tgz 中。**

[先读 DSH 验收说明](../DSH-ACCEPTANCE.zh-CN.md) · [下载 0.6.0 tgz](../dist/dsh-desktop-workflow-0.6.0.tgz) · [安装说明](../INSTALL-ME.md) · [功能说明](../README.md)

## 已验证到哪一步

- 官方 DSH `0.2.0-rc.2` 在 Linux 云端通过 PluginManager 隔离安装精确 tgz，再由官方 Loader 加载包内文件；同时验证同版本、不同物理副本的 LLM peer。
- 真实原生认证 `/team`、AgentLoop、子代理、文件工具、设置/凭据服务和独立验证进程闭环运行。模型与 Jev transport 使用明确 fixture，外部请求为 0。
- 最终插件检查：262 通过、0 失败、1 个非 Git 环境场景跳过；独立 evaluation 回归 123/123。构建、类型检查通过。PowerShell 7.6.6 在 Linux 云端完成原生验证链复验。
- 最后一次精确包验收：39 个子代理创建/清理平衡、52 次模型 fixture 调用、30 次 Jev fixture 调用、30 个真实验证子进程。

## 仍需分开的边界

Windows/Electron、浏览器视觉交互、真实密钥和付费模型/Jev API 尚未验收，也没有节费效果结论。离线安装依赖已在测试环境预置，不能代表新电脑可凭空离线取得依赖。历史 cleanup exit 3 根因仍未证实；不确定清理会隔离已知项目。

预算默认关闭、额度 0；开启后按每次运行生效。1,000 万 token 是此前评估配置，不是永久默认或金额账单保证。动态路由只使用设置里明确配置的 weak/base/strong 候选，不推测价格，也不宣称自动挑出最便宜模型。

## 当前文件与历史材料

- [0.6.0 摘要与边界](../dist/RELEASE-STATUS.zh-CN.md)、[验收摘要](../dist/validation-summary-0.6.0.json)、[146 文件源码清单](../dist/source-manifest-0.6.0.json)、[49 文件包清单](../dist/package-manifest-0.6.0.json)
- [原生包验收方法](../docs/PRODUCTION-ACCEPTANCE.md)、[预算契约](../docs/PRODUCTION-BUDGET.md)、[校验值](../dist/SHA256SUMS)
- 分支仍为 `review/jev-evaluation-stage1`，未合并 main，保留 `v0.5.3` 与历史包。
- `review/author/`、`review/independent/` 和[第一阶段说明](../review/DSH-ACCEPTANCE-stage1-historical.zh-CN.md)是历史离线评估材料。其中“只有 evaluation、没有生产预算接线/动态路由/新安装包”描述此前阶段，不代表当前 0.6.0。
- `dist/dsh-desktop-workflow-0.5.4.tgz` 保持冻结，只是历史包。验收本轮功能请使用 **0.6.0**。

0.6.0 tgz SHA-256：`d25fa9d992d7b536e41ef71adb95c62939f95902d4fca997635ba24451630a1a`。
