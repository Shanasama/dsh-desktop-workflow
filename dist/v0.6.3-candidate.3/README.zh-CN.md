# 0.6.3-candidate.3 发布候选

2026-10-12 将冻结 candidate.3 同步到 `review/jev-evaluation-stage1`。完整源码与构建产物位于分支根目录，冻结来源为 `b1805ea037936fe8a8c45f763b9a47fba01ac5e8`。仅更新此 review 分支，保留全部历史 dist；没有合并 main 或安装到用户电脑。

## 文件

- [安装包](dsh-desktop-workflow-0.6.3-candidate.3.tgz)
- [单文件离线预览](dsh-desktop-workflow-0.6.3-candidate.3-preview.html)
- [冻结源码 ZIP](dsh-desktop-workflow-0.6.3-candidate.3-source.zip)
- [冻结交付清单](delivery-manifest.json) · [冻结验收摘要](REVIEW-SUMMARY.zh-CN.txt) · [SHA-256](SHA256SUMS)
- [团队拓扑说明](../../docs/V063-CANDIDATE3-TEAM-TOPOLOGY.zh-CN.md) · [工具与会话上下文修复](../../docs/V063-CANDIDATE2-TOOL-CONTRACT.zh-CN.md)

冻结源码、ZIP、包内文档及交付清单中“未发布 GitHub”/`published: false` 是冻结时状态；本文件是之后增加的发布说明，不改变冻结文件和校验值。交付清单还列出未随本目录发布的 patch 与 QA 截图，不能把它当成本目录文件清单。

## 本候选内容

默认团队拓扑呈现真实任务、各节点所选模型和路由原因；同岗并发可展开。固定组织关系保持静态，真实新事件通过独立覆盖层连接正确端点，同岗重试留在本卡，Jev 与宿主验证独立映射。完整保留 candidate.2 的原生 Todo 工具 restrict/官方身份契约和同会话 inject 历史修复；24 个后端 src 文件与 candidate.2 一致。

## 已验证范围与限制

- build、类型检查通过；主测试 454 通过、0 失败、2 环境跳过；离线 evaluation 123/123。
- 官方 rc.2 工具契约 43/43；精确 tgz 经官方安装器离线安装测试，39 个 native child、30 个真实验证进程、0 外部请求。
- 云浏览器覆盖两主题、全宽/420/320px、真实关系端点、重复/乱序、切运行、断连恢复和终态。65 个包文件与冻结源码逐字节一致。
- PowerShell 与真正非仓库 fixture 各有一项环境跳过。云浏览器后台/最小化仍报告 visible，因此真实隐藏事件没有计作通过；隐藏/恢复防护仅有组件回归证据。系统级 reduced-motion 未实际切换，浏览器使用等价预览开关。
- 未进行 Windows/Electron 真机、真实模型/API、付费 Jev 或 TypeSafe 验收；不是生产全验收。离线预览持续标注合成演示并禁止网络连接。

安装包 SHA-256：`a21902128289cabfd499ba95134ddd3cdbcdfa44d974f3c7d1968e14f2f46f41`。
