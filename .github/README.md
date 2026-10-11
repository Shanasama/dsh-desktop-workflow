# DSH 多模型团队 0.6.1：默认沙箱验证修复

**0.6.1 已修复 0.6.0 在官方 Linux 默认 bwrap 下，跨工具调用丢失 `/tmp` 验收证据的问题。请使用新包验收；旧 0.6.0 包保留用于溯源。**

[DSH 验收说明](../DSH-ACCEPTANCE.zh-CN.md) · [下载 0.6.1 tgz](../dist/dsh-desktop-workflow-0.6.1.tgz) · [安装说明](../INSTALL-ME.md) · [修复原理](../docs/SANDBOX-FIX-0.6.1.md)

## 对 0.6.0 验收的更正

0.6.0 的原生 `/team` 测试使用固定命令 shell 测试 backend，没有覆盖官方默认 bwrap 的每次调用独立 `/tmp`。后续真实默认沙箱复现确认：baseline 可成功，但 check/cleanup 找不到前次证据。此前“原生闭环通过”只适用于已披露的测试 backend，不能据此认为默认 Linux 沙箱也通过。

0.6.1 将随机、摘要锚定的证据保存到任务项目根，保留宿主原有沙箱和权限；严格保护证据内容，清理只删除已确认的状态文件与空目录。丢确认或未知终态继续隔离所属项目。只读工作区不能建立持久证据时降为只读分析/待验证。

## 精确 0.6.1 包已测范围

- 官方宿主测试：305 通过、0 失败、1 个非仓库 fixture 跳过；evaluation 123/123；独立重点审查 91/91。构建、类型检查及重复打包一致性通过。
- 官方 rc.2 默认 bwrap、`workspace-write`、`enforcement=full`，不覆盖临时目录环境变量：真实 baseline/check/seal/cleanup、篡改拒绝、丢确认隔离、独立项目顺序运行，通过执行环境、独立审查和云桌面实测。
- 精确 tgz 经官方 PluginManager 隔离安装，Loader、AgentLoop、文件工具和子代理实际运行：39 子代理、52 模型 fixture 调用、30 Jev fixture 调用、30 真实 verifier 进程、0 外部请求。这里的 shell 仍为固定命令测试 backend，与默认 bwrap 验证器测试分开报告。
- PowerShell 7.6.6 在 Linux 执行 33 个真实进程通过回归。Windows/Electron 原生尚未验收。

## 尚未验证

真实模型和 Jev、真实密钥、付费效果、完整 `/team` 在默认 bwrap 下的端到端执行、宿主项目 lease 并发及 Windows/Electron GUI 尚未验收。官方 Web 在云桌面已安装启动。早先 localhost 页面曾被浏览器阻止；2026-10-11 08:31 UTC，普通打开新实例的原生 URL 已成功进入 DSH，没有改安全设置、网络或域名，先前阻塞的具体原因未证实。截至该时间，真实 API 尚未调用，密钥仍需用户在专用表单亲自输入。冻结报告保留的是较早验收时间点。

预算默认关闭、额度 0，开启后按每次运行生效。1,000 万 token 是此前评估配置，不是永久默认或账单保证。动态路由只选明确配置的 weak/base/strong 候选，不推测价格。请求模型名 `gpt6-luna` 的供应商 alias、tools/usage/context 契约仍未确认。

[发布摘要](../dist/v0.6.1/RELEASE-STATUS.zh-CN.md) · [测试汇总](../dist/v0.6.1/validation-summary-0.6.1.json) · [150 文件源码清单](../dist/v0.6.1/source-manifest-0.6.1.json) · [50 文件包清单](../dist/v0.6.1/package-manifest-0.6.1.json) · [校验值](../dist/v0.6.1/SHA256SUMS)

本轮只更新 `review/jev-evaluation-stage1`，不合并 main、不改 `v0.5.3`。旧包、[0.6.0 验收记录](../review/DSH-ACCEPTANCE-0.6.0-historical.zh-CN.md)及第一阶段离线评估材料均保留，历史结果不能替代当前版本验收。此前用户环境的 cleanup exit 3 原因仍需对应环境证据，不能断言与本次 Linux `/tmp` 问题相同。

0.6.1 tgz SHA-256：`fdbb46851fe29d7709f3af6549f06514c314b3fbccb45656dfd7d13dd7940969`。
