# DSH 验收入口：0.6.1 默认沙箱修复候选

## 请验收这个版本

目标分支仍是 `review/jev-evaluation-stage1`。请使用 [dsh-desktop-workflow-0.6.1.tgz](dist/dsh-desktop-workflow-0.6.1.tgz)，SHA-256：`fdbb46851fe29d7709f3af6549f06514c314b3fbccb45656dfd7d13dd7940969`。

[修复原理](docs/SANDBOX-FIX-0.6.1.md) · [发布摘要](dist/v0.6.1/RELEASE-STATUS.zh-CN.md) · [测试汇总](dist/v0.6.1/validation-summary-0.6.1.json) · [证据 ZIP](dist/v0.6.1/validation-evidence-0.6.1.zip) · [安装说明](INSTALL-ME.md)

## 0.6.0 的真实问题与验收更正

0.6.0 将自动验证的 baseline 写入 `os.tmpdir()`。官方 rc.2 Linux 默认 bwrap 每次 `workspace-write` 工具调用建立新的 `/tmp`：baseline 当次成功，后续 check/cleanup 因找不到前次证据而失败。已保留精确旧包和失败复现。

0.6.0 的原生 `/team` 集成使用真实官方服务与验证子进程，但 shell 是固定命令测试 backend。该测试未覆盖默认 bwrap 临时目录生命周期，不能据此声称默认沙箱也通过。其原始记录没有抹去，见 [0.6.0 历史验收说明](review/DSH-ACCEPTANCE-0.6.0-historical.zh-CN.md)。本轮新证据应优先用于判断这个问题。

0.6.1 修复了上述已复现的 Linux 问题，并修复 baseline 已执行但确认丢失时可能误判清理成功的路径。此前用户 Windows 环境的 cleanup exit 3 仍没有证明与本次故障同源，不宣称一并根治。

## 修复行为和安全边界

- 在实际项目根创建随机 `.dsh-team-evidence-<32hex>/state.json`，跨工具调用保留。只含清单哈希和固定检查元数据，不含源码或凭据；最初的摘要锚点保存在宿主。
- 严格校验目录、唯一状态文件、链接数量、权限、run/root 身份及原摘要。只将这个确切的自有文件排除于项目清单；额外文件、同前缀目录、删改或替换不被静默忽略。
- 六岗位不能读取、搜索或修改证据内容，硬链接别名也被拒绝；目录名称仍可能出现在正常 glob 列表中。
- 清理只删除已验证状态文件和空目录，不递归删除。已派发后丢确认、截断或未知终态保留本项目隔离与证据；明确未派发不隔离。其它独立项目可以继续。
- 不修改宿主沙箱或放宽权限。只读工作区无法创建持久证据时，降为只读分析/待验证。
- 保留生产 `/team`、原生设置、六岗位显式候选路由、主/shadow Jev、右侧实际运行快照、会话隔离及泰拉/原版 UI。

## 0.6.1 实际验收结果

| 验收层 | 结果 | 范围限制 |
|---|---|---|
| 构建 / 类型检查 / 重复打包 | 通过 | 本次云环境 |
| 官方宿主插件测试 | 306 项：305 通过、0 失败、1 跳过 | 非仓库 fixture 受外层 Git 标记限制 |
| evaluation 离线回归 | 123/123 | 独立实验工具，不是生产预算入口 |
| 独立重点审查 | 91/91，0 失败、0 跳过 | 重点场景，不与完整套件拼成一次运行 |
| 精确包安装后原生 `/team` | 39 子代理、52 模型 fixture 调用、30 Jev fixture 调用、30 真实 verifier 进程、0 外部请求 | 固定命令 shell 测试 backend；模型/Jev 为惰性 fixture |
| 精确包真实默认沙箱 verifier | baseline/check/seal/cleanup、篡改拒绝、丢确认隔离、独立项目顺序运行通过 | 官方 rc.2 bwrap，workspace-write，full enforcement；不是完整 `/team` 或并发 lease 验收 |
| 默认沙箱交叉复验 | 执行环境、独立审查、云桌面实测均通过 | TMPDIR/TEMP/TMP 未覆盖；没有放宽沙箱 |
| 真实 PowerShell 7.6.6 | Linux x64，33 个真实进程通过回归 | 不等于 Windows/Electron 原生通过 |

安装测试使用官方 PluginManager/Loader，并覆盖同版本、不同物理副本的 LLM peer。模型、Jev transport 及固定命令 shell backend 有明确 fixture；AgentLoop、子代理、文件工具、设置/凭据服务、认证路由和 verifier 进程实际运行。离线安装依赖已预置，不能代表新电脑可无依赖离线安装。

丢确认测试只在真实 baseline 成功后注入返回截断，验证保留证据和隔离；独立项目测试使用不同原生上下文顺序完成，没有声称并发宿主 lease 通过。

## 尚未完成的验收

- 真实供应商模型、Jev、真实密钥授权与付费效果尚未验收。官方 Web 已在云桌面安装启动；早先 localhost 页面曾被浏览器阻止。2026-10-11 08:31 UTC，普通打开新实例的原生 URL 已成功进入 DSH，没有修改安全设置、网络或域名，先前阻塞的具体原因未证实。截至该时间真实 API 尚未调用，密钥仍待用户在专用表单亲自输入。冻结 release 报告描述较早的阻塞时间点，不代表浏览器仍持续被阻止。
- 请求模型 ID `gpt6-luna` 保持原样，供应商实际 alias、tools、usage、context 契约尚未确认。
- 完整 `/team` 在默认 bwrap 下的端到端执行、宿主项目 lease 并发、Windows/Electron GUI 和新版本视觉交互尚未验收。
- 默认沙箱 verifier 通过与固定命令 backend 的原生 `/team` 通过是两层不同证据，不能合称真实付费模型端到端通过。现有 UI 图片仍是历史 fixture。

预算默认关闭、额度 0；开启后按每次运行生效。此前 1,000 万 token 等额度是一次评估配置，不是永久默认、跨运行项目总账或金额账单保证。动态路由只使用明确配置的 weak/base/strong 候选，不推测价格或最省钱模型。Jev/shadow 与岗位模型 token 账本分开；shadow 只观察，不改主流程、路由或完成门禁。相关契约见 [PRODUCTION-BUDGET.md](docs/PRODUCTION-BUDGET.md)。

## 给 DSH 的验收提示词

请验收当前 `review/jev-evaluation-stage1` 的 0.6.1 候选。先读本文件、`docs/SANDBOX-FIX-0.6.1.md`、`scripts/README-default-sandbox.md`、`dist/v0.6.1/validation-summary-0.6.1.json`，核对包 SHA 与150源码/50包文件清单。重点审查持久证据、摘要锚定、链接/权限/内容保护、精确清理和丢确认隔离，在独立临时项目和隔离配置内复跑可用测试。真实默认 bwrap verifier 与使用固定命令测试 backend 的原生 `/team` 结果分开报告；列出每一步通过、失败、跳过、未运行、退出码和阻塞。未经另行授权，不读写真实密钥、不调用付费模型/Jev、不安装到日常配置、不更改凭据或安全权限、不合并或推送。依赖不足列明，不自动联网安装，不通过覆盖临时目录或放宽沙箱让测试通过。

本文件不自行授予任何安装、外部数据传输或凭据权限。日常安装需用户另行明确要求，按 [INSTALL-ME.md](INSTALL-ME.md) 使用官方管理器；密钥由用户在专用表单输入。

## 隔离复跑与文件核验

使用 Node.js `^22.19 || >=24` 和 Git。先核验冻结文件再构建，构建后变化单列，不重打包覆盖交付物。

1. 分支根目录执行 `sha256sum -c SHA256SUMS`；在 `dist/v0.6.1/` 执行同一命令核对全部发布物。按 [150 文件源码清单](dist/v0.6.1/source-manifest-0.6.1.json)核对根源码，包括根 SHA256SUMS。
2. 已有匹配依赖和批准的官方 rc.2 宿主时执行 `npm --offline run check:integration`，需要宿主用例时提供批准的 `DSH_NODE_MODULES`。缺依赖/环境导致跳过必须记录，不能当通过。
3. 精确包安装后原生集成方法见 [PRODUCTION-ACCEPTANCE.md](docs/PRODUCTION-ACCEPTANCE.md)；明确其固定命令 shell backend 边界。
4. 默认沙箱复验使用 [verify-default-sandbox.mjs](scripts/verify-default-sandbox.mjs)，严格按 [长期回归说明](scripts/README-default-sandbox.md)锁定待测 tgz SHA。TMPDIR/TEMP/TMP 必须未设置，保留官方默认 bwrap 和原权限。
5. PowerShell 复验脚本为 `scripts/verify-verifier-pwsh.mjs`。对应平台/工具不可用时报告未运行。使用临时 HOME/DSH_HOME、合成项目和明确网络边界，不继承真实账户凭据。

## 历史与发布溯源

- [同源源码 ZIP](dist/v0.6.1/dsh-desktop-workflow-0.6.1-source.zip)、[0.6.0→0.6.1 补丁](dist/v0.6.1/0.6.0-to-0.6.1.patch)、[50 文件包清单](dist/v0.6.1/package-manifest-0.6.1.json)均冻结，补丁回放与150源码逐字节一致。
- `dist/dsh-desktop-workflow-0.6.1.tgz` 与 `dist/v0.6.1/` 内同名包逐字节一致。旧0.6.0及更早包、清单、证据保留原样；旧 unversioned `dist/RELEASE-STATUS.zh-CN.md` 和 `dist/SHA256SUMS` 是0.6.0历史材料，当前摘要与清单在 `dist/v0.6.1/`。
- 本轮基线 commit：`e1539a05abb35c9cc622a02f68a7b3fcca45ada0`。仅更新 review 分支，不合并 main、不改 `v0.5.3`。
- `review/author/`、`review/independent/` 是第一阶段历史评估材料；旧“只有 evaluation/没有生产接线”边界不代表当前版本。真实 API 未测限制仍然成立。
