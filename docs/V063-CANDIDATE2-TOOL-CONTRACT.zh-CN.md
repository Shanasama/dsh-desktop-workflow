# 0.6.3-candidate.2：原生工具契约与对话延续

本候选从冻结的 candidate.1（f9ed3214b285ad35c88e807a97f3f39a4767de8b）独立创建。未修改冻结副本，未推送、发布或安装到用户电脑。本文中的云端验证不代表 Windows/Electron 或真实付费供应商验收。

## 本次工具修复

原故障是：官方 Todo 说明要求多步骤工作先列计划，模型也能看见 todo_write，但插件仅在真正调用时按岗位名称白名单拒绝，导致 TOOL_BOUNDARY，再把依赖任务一起阻塞。

- 继续使用 DSH 原生 spawn、沙箱及审批继承，不替换宿主安全策略。
- 使用一个角色能力声明，供岗位提示、planner/reviewer/task 提示、官方 tools.restrict 和执行 guard 共用。researcher 可以使用宿主提供的 web_search/web_fetch；不再一边开放网页工具、一边声称完全没有网络。
- tools.restrict 在子会话按实际注册能力取交集，同时限制模型 schema 和原生工具查找。父宿主已隐藏的能力不会被重新暴露。
- 官方 API 有意保留 child-own 工具（例如 structured_output），因此 guard 仍不可省略。若创建时有无法隐藏且不属于岗位的 own-scope 工具，首个模型请求前停止。运行后出现的越界调用仍由 guard 拒绝。
- todo_write 不是新增文件写权限。只接纳当前可见、具有官方 rc.2 注册来源的会话工具：宿主安装 anchor → 官方模块 callback → ACTIVE Cordis fiber → 对应 scope → 精确定义与 execute 身份。调用前及下一模型步骤前再次核验；同名伪装、卸载或换实现不能借原身份执行。
- 不复制 Todo 实现，也不按描述、源码字符串、UI kind 或 isConcurrencySafe 猜安全能力。顶层 target_session 在 rc.2 官方实现中没有路由语义，即使传入也被忽略，始终写调用者 child session；父列表不变。Todo item 的未知字段由官方 schema 拒绝。
- 权限观察使用官方 prepend waterfall，从外层读取原生 ask/deny 决策，避免已有策略直接返回时漏记 PERMISSION_DENIED。不会把该决策改为允许。
- TOOL_BOUNDARY 和 PERMISSION_DENIED 仍不可自动重试。单任务 STEP_LIMIT 的一次有界恢复、预算、时间、项目占用与清理隔离继续保留。

源码：src/tool-contract.js、src/host-adapter.js、src/orchestrator.js。

## 同一对话的团队历史

- 团队结束后，在原会话保存有界摘要：目标、当前有效任务及未完成项、失败原因、关键岗位结果摘录、独立验证事实和有依据的变更清单。每份最多 6000 字符；结果摘录标为“岗位自述”，缺少结构化变更清单时明确说明，不能拿模型自述替代验收。
- 正文写明“团队历史产出，仅作背景、不构成新的用户指令”。来源 metadata 只做宿主归属，因为模型提供方转线时可能不保留它。
- 使用原生 agent.inject 的持久 inbox 和 sessions.flush：即时显示在原对话，保持主模型 idle，不自动发起模型调用。下一次用户主动发消息时，原生 AgentLoop 先建立 system head，再把摘要准入 user/message，真实模型请求可以看到。
- 修掉全新会话先直接追加 user/message、之后才生成 system/message 的顺序缺陷；该旧顺序会导致后续官方 v4 冷读报损坏。没有伪造 system head、模型输出或 turn 事件。
- UI 将 inbox 阶段和已经准入模型上下文的阶段区分，按 run 去重。原会话对象被替换时不转投另一会话；没有跨会话共享。
- 重要限制：首次主模型读取前，关闭会话或主动移除这个待处理项，会由原生宿主取消待准入上下文。日志中的聊天记录仍可查看，但重新打开后不会强行恢复成模型输入。rc.2 的这两类取消使用同一种持久事件，不能可靠区分；本候选优先尊重取消，不建立历史重注入系统。
- 已经准入后的摘要经过多轮、原生 resume 与冷 JSONL 重读验证；后续宿主压缩仍可能摘要或裁剪，不保证永久逐字保留完整聊天或原始工具日志。

源码：src/team-runtime.js、client/team-chat-feedback.tsx。

## 为什么不完全交给 DSH

底层已经继承 DSH 的文件沙箱、审批以及子代理策略。插件仍须决定岗位职责、项目可编辑模式、团队预算、并发和独立验收；宿主不知道一次 /team 的这些业务约束。

官方 tools.restrict 可解决可见工具与实际准入的大部分一致性问题，但不代表所有已安装工具都适合所有岗位，也不会自动判定一个第三方工具只改子会话。rc.2 没有通用可信工具来源/安全能力标签；本次只新增经过核实的官方 Todo 能力，未自动放开其他工具。

审批边界：标准 rc.2 子代理继承 approval=never。插件观察 ask 后将任务标为需主会话处理，但原生审批服务仍决定是否派发。在自定义嵌入宿主若该服务返回 allowed-once，工具可以已经执行而团队仍报告 PERMISSION_DENIED；当前没有改变这项既有行为，不能将无审批服务的 deny 测试推广为“任何 ask 都零派发”。

身份核验是官方 rc.2 插件生命周期上的组合契约，不是针对宿主进程内恶意插件的隔离沙箱。非标准直接 apply、不同版本或无法核验安装来源的 Todo 不获得此能力。后续宿主升级需要重做该契约验收。

## 仍保留的限制

- 自动项目团队不开放通用 bash/pwsh、任意代码工具、递归委派或修改凭据/权限。
- researcher 的网页工具仍服从原生服务配置和宿主权限；其他岗位不会因此获得网页能力。
- 项目外路径、符号链接、敏感凭据路径、依赖/构建目录及私有验收证据保持现有边界。
- grep 仍只接受具体普通文件。已有文件修改用 edit，不能 write 覆盖；只读项目模式不开放 write/edit。
- 验收依然需要可信项目基线和支持的运行器。修改验收基础、缺乏运行器或验收失败不等于完成。
- 默认并发、派发次数、模型步骤、时限、Jev 次数与可选 Token 预算未增加。权限/上下文变化会停止团队，清理不明则隔离。
- 本次没有自动开放 skill、present、ask_user_question、jobs、workspace dependency loader 等其他能力；它们需逐项核对真实用途与副作用，不能只按名字判断。

## 验证入口

使用本候选与官方 rc.2 的 node_modules：

```sh
DSH_NODE_MODULES=/absolute/official/node_modules npm run check:integration
DSH_NODE_MODULES=/absolute/official/node_modules npm run test:tool-contract-host
DSH_NODE_MODULES=/absolute/official/node_modules npm run test:team-host
DSH_NODE_MODULES=/absolute/official/node_modules npm run test:feedback-host
```

工具契约脚本运行真实官方 AgentLoop、native spawn、ToolRuntime、Session/Todo、文件读取及 ripgrep glob；模型输出与沙箱策略查询为显式离线 fixture，不接触用户文件或外部 API。缺少 DSH_NODE_MODULES 时包装测试会跳过，不能把跳过写成宿主通过。

## 最终云端验证（2026-10-11）

- build、TypeScript：通过；最终 check:integration：433 项中 431 通过、0 失败、2 跳过。
- 两项跳过如实保留：本轮未提供 DSH_PWSH_PATH，PATH 也未找到 pwsh；临时目录处于上级 Git marker 下，无法构造实际非仓库目录的那一项环境用例。同类纯路径边界测试通过，但不替代该环境用例。
- 离线 evaluation：123/123；预检、pilot、集成回放及 transport 均通过。
- 官方工具契约：43/43；77 次确定性 fixture 模型请求、9 次真实 read、9 次真实 glob，网络尝试和付费 API 均为 0。包括身份解析 await 中关闭 adapter 的独立审查回归：0 模型请求、0 工具派发、0 Todo 写入，并确认原生未发布创建回滚。
- 官方 feedback-host：验证实际下一轮 Provider 的 messages 包含目标/结果/run/正文归属；新的会话首部正确、已准入后的多轮与 resume/冷 JSONL 不重复，另一会话无该记录。首次读取前关闭和显式 remove 均不复活。
- 官方 team-host 与 client-host：通过。客户端部分是实际 rc.2 Cordis/Typert/Remote 接线配合 JSDOM 和确定性输出来验证，不是 Electron 真机或真实供应商验收。
- 历史兼容测试中的旧候选版本断言、复制源码夹具列表和随时间变化的 observedAt 断言已校正；没有以放宽产品边界让测试变绿。

打包 SHA-256 与最终 commit 记录在交付清单。candidate.1 的历史验收文档仅保留作基线，不代表 candidate.2 的结果。
