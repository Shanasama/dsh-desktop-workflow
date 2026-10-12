# DSH 验收入口：Jev 离线源码候选

## 必须先明确的边界

这是源码评估候选，不是包含新 Jev evaluation 生产接线的正式安装版。`liveReady=false`。

- `evaluation/` 的预算控制、双持久账本、主/shadow 串行和 HTTP adapter 已做离线合成验证，但生产 `src/` 未接预算控制器，当前 npm `files` 白名单也不包含 `evaluation/`。
- 动态成本路由未完成；没有真实供应商、真实任务效果、费用金额封顶结论。`gpt6-luna` 是本次选定模型 ID，并非已证明的最省钱路由。
- 供应商对应模型的 usage/reasoning、全部计费输出限制、最终序列化输入硬上界、安全凭据交接和用户真实项目 adapter 尚未验收。
- 本次测试配置为项目 1000 万 token、首批 10 万、每任务 2 万、并发 1；这是本次评估配置，不能写成产品永久运行限制。
- `dist/dsh-desktop-workflow-0.5.4.tgz` 是此前冻结的 0.5.4。SHA-256：`9fb5f59d9ee1d149387eea0e76ddf84a71bf6b1275c8ad471c7fbbf1e050bc12`。它不含本轮 `evaluation/`，不能安装此包后声称新功能已上线。

## 给 DSH 的提示词

请验收当前 `review/jev-evaluation-stage1` 分支。先读 `DSH-ACCEPTANCE.zh-CN.md`、`evaluation/docs/ACCEPTANCE-PLAN.zh-CN.md`、作者和独立验收报告，再审查源码并在独立临时副本运行离线测试。分别报告通过、失败、跳过、未运行和阻塞项，核对 `liveReady=false`、预算 adapter 未接生产 `/team`、动态路由未完成，以及冻结 0.5.4 包不含 evaluation。未经我另行授权，不读取或输出任何真实密钥，不调用付费模型/Jev，不安装到我的日常 DSH 配置，不更改凭据/权限/日常配置，不合并或推送。依赖不足先报告；不要自动联网安装。无需把本次测试预算固化成产品限额。

## 离线运行

在独立 clone/副本中执行，不要在日常工作目录运行带写入的 fixture。Node.js 至少 22.19（项目 engines：`^22.19 || >=24`），需要 Git。

1. 构建前先核对原始源码：在分支根目录执行 `sha256sum -c SHA256SUMS`。Windows 可按 `review/author/source-manifest.json` 对应路径用 SHA-256 核验。该清单是最终 ZIP 原始源文件，不覆盖本次新增的验收文档和历史 dist。
2. 仅评估（无新 npm 依赖）：`npm --offline --prefix evaluation run check`。也可以在 `evaluation/` 直接运行 `node --test test/*.test.mjs transport/test/*.test.mjs`，再依次运行 `node scripts/preflight.mjs`、`node scripts/pilot-offline.mjs`、`node scripts/integrated-offline.mjs`、`node transport/run.mjs`。
3. 完整源码：已有与 lockfile 匹配的项目依赖时执行 `npm --offline run check:integration`。缺依赖时停止该阶段并报告，不把未运行当通过。官方 rc.2 宿主测试需用户批准使用已经安装的对应依赖目录；不要擅自查找日常 DSH 配置。
4. `node evaluation/transport/run.mjs` 默认只用模拟请求。不要为这次离线验收使用真实入口或添加凭据。

建议清空非必要继承环境，使用临时 HOME/DSH_HOME 和网络禁用沙箱。`review/independent/block-network.cjs` 可通过 `NODE_OPTIONS=--require=<该文件绝对路径>` 阻断 Node fetch/http/https/net/tls；它不是操作系统级隔离。npm 同时设 offline 并禁用更新通知。测试会创建临时合成项目和账本。

构建会重写 `preview/app.js`，模块标签受依赖所在路径影响。先核对构建前 SHA，再记录构建后变化，不要把它混作交付包被篡改；冻结安装包不能重打或覆盖。

## 作者和独立复核结果必须分开

| 范围 | 结果 | 限制 |
|---|---|---|
| 作者 build / typecheck | 通过 | Linux 云端 |
| 作者插件 + evaluation/HTTP 测试 | 332 通过、0 失败、1 跳过 | 非仓库目录 fixture 受外层 Git 标记限制 |
| 独立原始完整检查 | 插件 206 通过、0 失败、4 跳过；evaluation 123 通过、0 失败 | 没有执行宿主实际安装/localhost HTTP 套件 |
| 独立额外惰性官方接口检查 | 2/2 通过 | 官方 rc.2，仅惰性接口 |
| 独立包内累计 | 331 通过、0 失败、2 项未覆盖 | 上述安装/localhost HTTP 套件，及非仓库目录场景 |
| 独立新增门禁 | 10/10 通过 | 合成项目、模拟 HTTP；与包内数量分开 |

独立门禁包括：预算不足 0 次 transport；跨角色共享任务预算；未知 usage 不退款、保留预留和锁；主/shadow 最大并发 1；真实本地 Node 测试失败阻断 completed；检查后篡改由 seal 阻断；模拟 HTTP 和双持久账本组合；默认入口不联网；未验证真实模板在凭据/账本/HTTP 前被阻断。

首次直接 npm 运行被网络守卫拦截 1 次 HTTPS 尝试，未实际发出；开启 offline 并关闭更新通知后复跑零守卫触发。这个差异已保留在独立报告，不隐去。

## 文件与溯源

- 最终原 ZIP SHA-256：`5d7f7e9d1129fa29c9635cfa05b638ed05528902cfda544140318354c3183a05`；原 ZIP 未被改写。
- `review/author/`：原始最终集成 evidence 与原始 START-HERE；其中“未写 GitHub”是打包时历史状态，不代表当前分支未发布。
- `review/independent/`：独立验收原报告、summary、日志、详细门禁和 runner。原报告中的云端绝对路径仅描述当时运行环境，不是你本机的运行路径。
- `review/independent/independent-gates.mjs` 保留原样。若重跑，在新的临时验收目录放一个 `source/` 源码副本并复制该 runner，创建空 `reports/` 后执行；不要复用已有锁/账本状态。原 runner 的 10 场景结果见 `reports/independent-gates.json`。
- `review/jev-integrated-offline.patch`：从冻结 0.5.4 到原始最终源码的补丁。
- `dist/`：保留用户基线的历史包，并增加冻结 0.5.4 包、源码 archive、补丁和验收证明。全部为既有冻结物，不是本次 evaluation 新发行包。
- 根目录原始源码共 137 文件，逐字节来自最终 ZIP；新增 `.github/README.md`、本文件和 `review/` 只用于说明验收，未改原源码。

## 验收输出

请给出明确的“离线源码通过/有条件通过/不通过”、每一步实际命令和退出码、日志路径、失败/未覆盖项、生产接线差距。不以 preflight 退出 0 判为 liveReady，也不以高置信 Jev 判断代替独立检查和 seal。真实调用和生产部署需用户另行授权。
