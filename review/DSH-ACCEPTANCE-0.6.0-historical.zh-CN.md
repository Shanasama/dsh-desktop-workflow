# DSH 验收入口：0.6.0 生产接线候选

## 当前验收对象

请验收 `review/jev-evaluation-stage1` 的 0.6.0 源码和 [dsh-desktop-workflow-0.6.0.tgz](dist/dsh-desktop-workflow-0.6.0.tgz)。生产 `/team` 已接入预算、显式动态路由、主/shadow Jev、设置持久化和运行状态。生产预算入口在 `src/production-budget.js`、`src/host-adapter.js` 及原生运行时，随 tgz 发布；`evaluation/` 继续作为独立历史实验工具，不是生产预算入口。

本轮只更新独立 review 分支，未合并 main、未替换 `v0.5.3`、未安装到用户日常 DSH 配置。

- 包 SHA-256：`d25fa9d992d7b536e41ef71adb95c62939f95902d4fca997635ba24451630a1a`
- [原生包验收方法](docs/PRODUCTION-ACCEPTANCE.md) · [预算契约](docs/PRODUCTION-BUDGET.md) · [版本摘要](dist/RELEASE-STATUS.zh-CN.md)
- [验收汇总](dist/validation-summary-0.6.0.json) · [原始证据 ZIP](dist/validation-evidence-0.6.0.zip) · [发布文件校验值](dist/SHA256SUMS)

## 本轮实际验证

| 范围 | 结果 | 不能据此推断 |
|---|---|---|
| 构建与类型检查 | 通过 | 所有操作系统通过 |
| 插件测试 | 263 项：262 通过、0 失败、1 跳过 | 跳过场景通过；该场景无法构造无外层 Git 标记目录 |
| 独立 evaluation 回归 | 123/123 | 评估工具就是当前生产入口 |
| 官方 PluginManager + Loader | 精确 0.6.0 tgz 隔离安装及实际加载通过 | 新电脑无预置依赖可离线安装 |
| 官方 rc.2 原生 `/team` | 39 子代理创建/清理平衡，52 模型 fixture 调用，30 Jev fixture 调用，30 真实 verifier 进程，0 外部请求 | 真实付费 API、真实密钥或实际节费已通过 |
| 重复 peer 安装布局 | 同版本、不同物理目录 LLM peer，生产预算仍识别宿主原生请求标记 | 任意未经验证宿主版本兼容 |
| PowerShell 7.6.6 | Linux 云端 rc.2 原生工具链通过 baseline/check/seal/cleanup、特殊路径、篡改拒绝与未派发回收 | Windows/Electron 原生通过 |

模型流、Jev 返回和固定命令 shell 后端有明确 fixture。官方 AgentLoop、NativeSubagents、文件工具、设置/凭据服务、认证路由、项目文件变更和独立 verifier 子进程实际运行。测试凭据仅为合成 dummy，未使用真实账户密钥。生产用量守卫按宿主声明的可核验上下文上界预留，再用原生 usage 结算。

## 已接入的功能和约束

- 六岗位保留各自基础模型，可明确配置 weak/strong 候选。small/medium/high 与升级根据候选映射选择模型，缺少候选回到基础模型；不虚构价格、不扩大文件或工具权限。
- 预算按每次运行配置，默认关闭、额度 0。开启时需正整数；未知 usage 不退款，缺少可核验上界时不派发。Jev/shadow 单独统计，不计入岗位模型 token 账本。
- 此前 1,000 万 token、首批 10 万、每任务 2 万、并发 1 是那次评估配置，不是产品永久默认；本版预算不是跨运行项目总账或金额账单保证。
- 主 Jev 请求别名和响应解析版本分别记录，未报告版本显示未知；shadow 固定版本、独立限制，只观察，不改变主流程、路由或验收门禁。
- 设置采用宿主持久化和 revision 冲突检查；运行保留启动时配置。许可撤销取消在途团队并阻止后续 Jev 发送。
- 右侧使用实际运行快照，展示派发模型、版本、预算和脱敏元数据。元数据不含任务正文、源码、项目路径、原始错误或密钥。
- 历史 cleanup exit 3 根因未证实。只验证了不确定清理时保守隔离已知项目、阻止同项目重入、允许独立项目继续，不宣称旧问题根治。

## 仍未运行或不作保证的范围

Windows/Electron 原生、真实提供方及 TypeSafe API、真实密钥授权、费用与节费效果未测。云端 Chromium 因 socket 权限被阻断，没有新版本浏览器视觉交互或截图通过结论。已保留的历史 UI 图片是旧版 fixture，不能当成本轮新 UI 视觉证据。

离线安装预置准确官方依赖，其中 LLM peer 为逐字节相同的独立物理副本；没有下载依赖或网络 fallback。插件缺席、进程重启之后没有预算策略持续生效保证。禁止将当前结果简写成“全平台、全 API、全功能真实环境验收通过”。

## 给 DSH 的验收提示词

请验收当前 `review/jev-evaluation-stage1` 的 0.6.0 候选。先阅读本文件、`docs/PRODUCTION-ACCEPTANCE.md`、`docs/PRODUCTION-BUDGET.md`、`dist/validation-summary-0.6.0.json`。核对源码和包清单，审查生产 `/team`、原生预算、显式候选路由、设置、主/shadow 版本和真实运行快照接线，再在独立临时副本及隔离配置内复跑可用测试。分别列明通过、失败、跳过、未运行和阻塞，不能把模拟 transport 或 Linux PowerShell 当成真实 API 或 Windows/Electron 验收。未经另行授权，不读取或输出真实密钥，不调用付费模型/Jev，不安装到日常 DSH 配置，不更改凭据/权限/日常配置，不合并或推送。依赖不足报告具体缺项，不自动联网安装，不把本次评估额度固化为产品默认。

本文件是验收说明，不会自行授予安装、凭据或外部数据传输权限。若用户另行要求日常安装，按 [INSTALL-ME.md](INSTALL-ME.md) 使用官方插件管理器；密钥由用户在专用表单输入。

## 在隔离副本复跑

使用 Node.js `^22.19 || >=24` 和 Git。先核验冻结文件，再构建；构建可能重写 `preview/app.js`，必须区分构建后变动与交付字节。

1. 在分支根目录运行 `sha256sum -c SHA256SUMS`；在 `dist/` 内运行 `sha256sum -c SHA256SUMS`。另按 `dist/source-manifest-0.6.0.json` 核验全部 146 源文件；根清单本身包含在该 manifest 中。
2. 已有匹配依赖时，运行 `npm --offline run check:integration`。未提供官方宿主依赖时，原生宿主用例会显式跳过；必须报告，不能记为通过。
3. 仅 evaluation 可运行 `npm --offline --prefix evaluation run check`。这是回归实验，不替代生产集成。
4. 已有批准的 rc.2 依赖、离线 pnpm store/CLI 时，按 `docs/PRODUCTION-ACCEPTANCE.md` 设置 `DSH_NODE_MODULES`、`DSH_PNPM_STORE`、`DSH_PNPM_CLI`、`DSH_PRODUCTION_BUNDLE`，运行 `node --expose-internals scripts/verify-production-host.mjs`，其中 bundle 指向精确 0.6.0 tgz。脚本会隔离安装，失败时不回退到源码假装通过。
5. PowerShell 复验方法见 `scripts/verify-verifier-pwsh.mjs` 和验收证据。未安装对应工具链时记为未运行。

使用临时 HOME/DSH_HOME、合成项目和网络隔离，不传入继承的账户凭据。现有 `review/independent/block-network.cjs` 是第一阶段 Node 网络守卫，不是 OS 隔离；原生测试的 loopback 与 npm offline 需求以本轮方法为准。

## 冻结与历史溯源

- 本轮 146 源文件与 [0.6.0 源码 ZIP](dist/dsh-desktop-workflow-0.6.0-source.zip) 逐字节一致；49 个包文件与对应源码一致。新增首页/验收入口/发布清单不改冻结源码或 tgz。
- [增量补丁](dist/integrated-offline-to-0.6.0.patch) 从此前精确离线整合源码生成，并已回放核对；基线发布 commit 为 `885f7957664763b6352d2eda8c17652010cf11d6`。
- `review/author/`、`review/independent/` 和 [第一阶段验收说明](review/DSH-ACCEPTANCE-stage1-historical.zh-CN.md)保留历史。其 `liveReady=false`、evaluation-only、无新包/未接生产预算/动态路由未完成表述是第一阶段状态；不要套到当前生产代码。其真实 API 未测限制仍然成立。
- 冻结 0.5.4 包 SHA-256 仍为 `9fb5f59d9ee1d149387eea0e76ddf84a71bf6b1275c8ad471c7fbbf1e050bc12`，不含此次生产功能。其他旧包也保留，不作为本轮安装入口。

请输出“0.6.0 已验证的生产接线范围”、实际命令和退出码、日志、未覆盖项及下一步所需环境。外部模型成功与付费账单验证必须单列，不能由原生 fixture 闭环推断。
