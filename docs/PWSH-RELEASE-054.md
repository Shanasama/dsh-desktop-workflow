# v0.5.4 · PowerShell 验收与同源发布

## 基线与范围

基线为 GitHub `v0.5.3` 的 `6069f73b98b922d9db151e2b8637e250c33bbd4c`。保留该提交的项目/会话隔离、工具名解析、PowerShell 命令方言，以及 planner、task、reviewer 工具边界提示。未合入尚在独立评估的 Jev trace/shadow/策略实验。

修补两个小缺口：

- 官方 `TOOL_ABORTED_BEFORE_DISPATCH` 常量的 wire 值是 `ABORTED_BEFORE_DISPATCH`。它与 `UNKNOWN_TOOL`、`INVALID_ARGS` 一样，只有明确证明未启动的失败才可释放；未知错误、运行后 `ABORTED`、后台/提升/超时仍隔离。
- verifier 命令方言同时验证字符串类型和自有属性，拒绝 `constructor`、`__proto__` 及对象转换等输入；只接受固定 `bash` / `pwsh`。

未添加强制解锁、重置、权限扩大、普通岗位 shell、自动模型切换或新的外部服务调用。

## 真实 PowerShell 进程验收

2026-10-10，Linux x64 / Node 24.19.0 / 官方 DSH 0.2.0-rc.2 / PowerShell 7.6.6。

PowerShell 来自 Microsoft 官方仓库发布页：
https://github.com/PowerShell/PowerShell/releases/tag/v7.6.6

便携包 `powershell-7.6.6-linux-x64.tar.gz` 的 SHA-256：
`ddbc4a2d113bbd46d283cfedcbcd117a70caefd7673f41f2b4e0000badf103bc`

与官方 `hashes.sha256` 和 GitHub release asset digest 均一致；仅解包至云端临时目录，没有系统安装。

新脚本加载真实 `dsh-tool-pwsh`、`dsh-pwsh-local`、`dsh-subprocess-local`、`ToolRuntime` 和生产 adapter。明确断言无 Bash 工具，通过 subprocess 入口统计进程，每阶段确有一个 PowerShell 进程，未替换 shell 执行结果。环境为 allowlist + 空 HOME，使用 `-NoProfile`，不开启模型/Jev/provider，不加载用户 DSH profile 或凭据。

通过内容：

- 33 次真实 PowerShell verifier 进程调用。
- 两轮完整 baseline → check → seal → cleanup；项目和插件路径含空格、中文及单引号。
- 修改原测试/配置不能自证通过；baseline digest 篡改与检查后变动的 seal 均被拒绝。
- 同项目两份不同 runId 证据隔离，跨 run 证据被拒，清理 A 不删除 B。
- 显式 profile verifier 的 baseline/check/seal 和内存 release。
- 自动/显式 verifier 各自经真实 ToolRuntime 返回 UNKNOWN_TOOL、INVALID_ARGS、ABORTED_BEFORE_DISPATCH，六项均零 shell 启动、零 poison，之后可再次建立会话。
- 所有正常 cleanup 均 exit 0，证据文件及目录消失；零模型/Jev 调用。

这是 Linux PowerShell 兼容测试。Windows-native / Electron Node mode / Windows sandbox / 日常真实 `/team` 完整流程均未测试。`verify-verifier-windows.mjs` 现在强制检查 Windows + Electron，再使用同一个真实 pwsh harness；它在 Linux 必须拒绝执行，不能把 Linux 结果标成 Windows 通过。

## 其它检查

- build / TypeScript：通过。
- 完整普通及 opt-in 官方宿主测试：192 项，191 pass / 0 fail / 1 skip。
- skip 为非 Git 临时目录的文件系统 fixture：本云环境 `/tmp` 外层存在保护性 `.git` 标记，无法构造该特定前提。没有移除环境保护标记；纯目录边界 overlap 回归及真实独立 Git 项目隔离均通过。
- 原先两个测试 fixture 假定临时目录无外层 Git、一个 v0.4 宿主 fixture 假定全局单任务/不保留历史，已调整夹具适应现有按项目并发和历史行为，没有放松生产边界。
- `test:host`、`test:team-host`、`test:client-host`、`test:verifier-host`：通过。涉及模型、Jev、目录、传输或验收 facts 的模拟均保留标注。`test:verifier-host` 仍是 11 次 inert shell 合约调用，与 33 次真实 pwsh 验收分别报告。
- 安装包官方 CLI 在独立空配置中的安装/注册/卸载：通过；没有触及用户机器或日常配置。首次环境 allowlist 未保留云网络代理和已有 CA 路径导致联网失败，保留既有代理/信任配置后正常通过；没有禁用 TLS 校验或更改系统信任。

## 已知问题与不作出的结论

历史 Windows cleanup 首轮曾出现前台 exit 3，且未保存足以定位原因的 runner JSON。此次真实 PowerShell 通过不会证明那个间歇错误已根治；清理未确认仍保留隔离。既有进程中的历史锁不会由安装新字节自动解除。

首次新版 pwsh 脚本执行时，修改 package.json 的负例实际被安全拒为 `VERIFICATION_INVALID`，而夹具起初只接受 `protectedOk:false`，导致测试断言失败。现接受这两种安全失败；原始失败日志保留在发布验收证据中。不是跳过失败，也不把非零退出当通过。

## 重跑与发布物

```text
DSH_NODE_MODULES=/approved/official/node_modules npm run check
DSH_NODE_MODULES=/approved/official/node_modules DSH_PWSH_PATH=/approved/pwsh npm run test:verifier-pwsh
```

Windows 只在原生 Windows + Electron Node mode、已批准的官方 rc.2 依赖下运行 `scripts/verify-verifier-windows.mjs`。脚本不会自行安装 PowerShell。

交付包含安装 tgz、source.tar.gz、从上述提交到 0.5.4 的 source-only 增量 patch、逐文件清单及 SHA256SUMS。源码归档排除历史 dist、依赖目录、Git 元数据、日志、凭据和运行状态。安装包中的每个文件必须与冻结源码字节一致，补丁必须在基线回放后逐文件一致；生成的 `lib/client.js` / `preview/app.js` 与源 TSX 同次 build。

source-only patch 不更新历史 dist；新安装包/归档/SHA 是同次生成的独立交付。没有自动 push、merge、发布 GitHub release 或安装用户机器。
