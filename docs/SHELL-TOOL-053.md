# v0.5.3 修正：验证器为什么锁死项目（shell 工具名解析）

## 结论

真实 Windows 宿主上 `/team` 的自动验收以 `isError` 结束，随后**整个项目被永久隔离**（连只读分析都无法重跑，直到宿主进程退出重开）。根因是验证调用**硬编码了 shell 工具名 `bash`**，而该宿主为模型注册的 shell 工具是 **`pwsh`**。

调用确实进入了派发阶段（`tools/execute` 观察者已触发），失败发生在工具解析：官方 ToolRuntime 在 `dispatchToolBody` 里 `resolveExecution(...)` 返回空即 `throw new ToolNotFoundError(exec.name)`，结果形如：

```json
{"content":[{"type":"text","text":"Error: unknown tool \"bash\""}],
 "isError":true,
 "error":{"message":"unknown tool \"bash\"","info":{"name":"ToolNotFoundError","code":"UNKNOWN_TOOL"}}}
```

旧代码对**任何** `isError` 一律按“执行终态未确认”隔离（`poison`）。于是一次工具名不匹配就变成了项目级死锁。

这是 [WINDOWS-VERIFIER-052.md](WINDOWS-VERIFIER-052.md) 里“没有恢复原始异常文本、不能宣称定位”的同一现象；本次定位到机制并给出可复现证据。

## 证据

1. **错误码位置**（官方 ToolRuntime，0.2.0-rc.2 解包到 `%TEMP%` 的 `*.tmp.js`）：
   - `ToolNotFoundError` / `ToolArgsError` 都是 `HarnessError`，错误码经 `errorInfo()` 只放进 **`result.error.info.code`**（`UNKNOWN_TOOL` / `INVALID_ARGS`），`result.error.code` 从来不存在；
   - 旧 `src/verification-diagnostics.js` 读的是 `error?.code || result?.error?.code` → 永远 `undefined` → 界面固定显示 `UNCLASSIFIED / unknown`，无法区分“工具不存在”“参数不合法”“执行器起不来”“审批被拒”。
   - `tools/execute` 是**派发阶段**的 waterfall：派发观察者已触发、工具名解析失败，所以 `verificationNotDispatched` 为假，走不到 `VERIFICATION_DENIED`，直接落进 `isError` 隔离分支。
2. **平台差异**：该宿主（desktop profile）注册的 shell 工具是 `pwsh`；官方 `dsh-pwsh-local` 自述为 “bash capability seam” 的 Windows 提供方，POSIX 侧才是 `dsh-bash-local` + `dsh-tool-bash`。插件自带的 QA 脚本手工挂载的正是 POSIX 栈（`scripts/verify-verifier-windows.mjs`），因此隔离测试永远复现不出真机故障。
3. **复现（未修复代码，逐文件进程内执行）**：
   - `node test/host-adapter.test.mjs` → `not ok 10 - verifier asks the host which shell tool exists instead of assuming bash`
   - `node test/verification.test.mjs` → `SyntaxError: does not provide an export named 'notStartedCodes'`
   - `node test/verifier-quarantine.test.mjs` → `not ok 2 - a check that provably never started is refused without quarantining the project`

## 修复

- `src/host-adapter.js`：新增 `shellToolName(requested,parent)`，用 `tools.get(name,parent)` 询问宿主实际注册的 shell 工具（先试调用方给的名字，再试 `bash`/`pwsh`）。
  - 宿主 tools 服务无法枚举（老宿主、测试夹具）→ 沿用调用方给的名字，不改变既有行为；
  - 能枚举却都不存在 → 抛 `VERIFIER_UNAVAILABLE`，**未派发任何检查**。
  - 解析后的名字统一用于派发匹配、`verifierCalls` 上下文与 `tools.execute`，因此 `beginSession` 的父会话守卫仍然只放行这一次验证调用。
- `src/verification-diagnostics.js`：错误码增加 `result.error.info.code` 来源；新增 `notStartedCodes`（`UNKNOWN_TOOL`、`INVALID_ARGS`、`TOOL_ABORTED_BEFORE_DISPATCH`）。
- `src/auto-verification.js` / `src/verification.js`：命中 `notStartedCodes` 的失败判为 `VERIFICATION_DENIED`——**可证明没有任何检查进程启动，因此不存在待确认的清理**，项目不再被隔离，租约正常释放，可直接重试 `/team`。其余 `isError`（含 `EPERM` 等可能已经开始执行的失败）**仍按原策略隔离**，保守语义没有被放宽。

## 第二处：命令字符串的 shell 方言

工具名修好后，真机 `baseline` 立刻换了一种方式失败：

```
项目检查受阻：baseline / 检查输出不是完整 JSON（UNCLASSIFIED，foreground，exit 1）。
```

`foreground / exit 1` 说明 shell 工具**确实执行了**（工具名解析已生效），但 `verifierCommand()` 生成的是 POSIX 方言：

```
ELECTRON_RUN_AS_NODE=1 'E:\...\DeepSeek Harness.exe' '...\verification-project-runner.js' 'base64'
```

PowerShell 把 `ELECTRON_RUN_AS_NODE=1` 当成命令名（`CommandNotFoundException`），一条命令都没跑、stdout 为空、退出码 1。复现：

```powershell
ELECTRON_RUN_AS_NODE=1 'E:\deepseek-harness\DeepSeek Harness.exe' 'x' 'y'
# ELECTRON_RUN_AS_NODE=1 : 无法将“ELECTRON_RUN_AS_NODE=1”项识别为 cmdlet、函数、脚本文件或可运行程序的名称。
```

修复：`verifierCommand(entry,payload,shell='bash')` 只接受固定方言集合，其它一律抛错：

- `bash`：`ELECTRON_RUN_AS_NODE=1 '<exe>' '<entry>' '<base64>'`（原样保留）
- `pwsh`：`$env:ELECTRON_RUN_AS_NODE='1'; & '<exe>' '<entry>' '<base64>'`

shell 由 `host-adapter.shellName(sessionId)` 提供（复用同一套 `tools.get` 解析），经 `team-runtime` 注入自动验证器，显式验证器同样支持；Electron 环境前缀只在 `process.versions.electron` 时生成。

真机等价验证（在本仓库内实际执行生成的命令）：

```
COMMAND=& 'E:\Node.js\node.exe' '...\src\verification-project-runner.js' 'eyJydW5JZCI6...'
EXIT=0  verified=True mode=verified reason=已自动识别项目检查，无需填写路径表单。
带上 $env:ELECTRON_RUN_AS_NODE='1'; 前缀的形式：同样 verified=True mode=verified
```

## 第三处：规划提示词没有声明工具边界

shell 修复生效后真机 `/team` 已经能建立 baseline、完成 Jev 分类和规划，然后在任务阶段阻塞。审查者节点的原话：

> 当前 DAG 未完成项目查看：inventory 因通用 shell 不开放而受阻，其余三个任务均因依赖未完成而阻塞，没有实际文件观察或项目分析结果。应修订发现任务，去除必须使用 shell 执行 pwd 的前置要求，在既定工作区内使用获准的只读文件工具开展有限发现……

也就是说：宿主守卫按设计拒绝岗位调用 `bash`/`pwsh`（`自动团队不开放通用 shell`），但**规划提示词从未告诉 planner 这条边界**，于是它派出了 `pwd`/shell 盘点类任务，任务被拒 → 依赖它的任务连带阻塞 → 运行按 fail-closed 结束。这不是宿主问题，是提示词与强制边界不一致。

修复（不改守卫，边界是产品设计）：

- `orchestrator._planPrompt`：显式写出宿主强制的工具边界——**没有通用 shell、没有网络**（`pwd`/`ls`/`cat`/`git`/`npm`/`node` 都不能跑）；所有角色可用 `read`/`read_image`/`glob`/`grep`，`researcher` 另有 `web_search`/`web_fetch`，`worker` 仅在可编辑模式下另有 `write`/`edit`；发现、盘点、验证都必须用这些工具完成，不得让任务依赖命令输出；无法观察到的事实用"限制"明确记录。
- `orchestrator` 任务提示词：同样一句边界，避免岗位在拿到含命令的任务时直接撞守卫。
- `jev-controller._planPrompt`：analysis-only 模式下明确"只用 read/read_image/glob/grep，不改文件、不用 shell"。

回归：`test/orchestrator.test.mjs` 新增用例断言 planner 提示词与任务提示词都包含该边界（32/32 通过）。

## 回归

- `test/orchestrator.test.mjs`：规划与任务提示词都声明强制性工具边界，任务不会等待 shell 结果。
- `test/host-adapter.test.mjs`：只注册 `pwsh` 时 `bash` 请求被解析为 `pwsh`；两者皆无时抛 `VERIFIER_UNAVAILABLE` 且不派发；宿主无法枚举时沿用调用方名字；`shellName()` 与实际解析一致。
- `test/verification.test.mjs`：诊断码只从封闭来源（含 `error.info.code`）读取，未映射的一律 `UNCLASSIFIED`；`UNKNOWN_TOOL` → `VERIFICATION_DENIED` 且不 poison；`EPERM` → 仍 `VERIFICATION_UNSETTLED` 且 poison；按解析出的 shell 生成命令。
- `test/verifier-quarantine.test.mjs`：未启动的检查失败后 `context.canStart` 恢复为 `true`、消息含 `UNKNOWN_TOOL`、租约从 `project-runs:v3` 移除、不含“清理未确认”；宿主只挂 `pwsh` 时自动验收生成的命令是 PowerShell 方言。
- `test/verifier-command.test.mjs`：两种方言的固定形状、payload 仍为数据、非法方言被拒绝。

## 边界

- 隔离仍是进程内状态且没有解锁接口：本修复保证“不再因为工具名/参数类失败而隔离”，**不清理历史遗留的毒锁**（那需要宿主退出重开）。
- `verificationNotDispatched`（宿主守卫或审批拒绝）本来就是不隔离路径，本修复不改变它。
- 真实宿主端到端仍需一次实际 `/team` 验收；本仓库环境无法加载 rc.2 的 `node_modules`，故真实 shell 执行仍由 `scripts/verify-verifier-*.mjs` 在具备 `DSH_NODE_MODULES` 的机器上执行。
