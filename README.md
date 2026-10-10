# DSH 多模型团队 · v0.6.0

**装一次、设置一次，以后直接在聊天框输入 `/team 任务正文`。**

面向官方 DeepSeek Harness 0.2.0-rc.2 的原生插件，不需要修改宿主源码。

## 开始使用

1. 下载 `dist/dsh-desktop-workflow-0.6.0.tgz`，拖给 DSH，并明确说“请用官方插件管理器安装到当前配置”。详见 [安装说明](INSTALL-ME.md)。这使用 DSH 代理的官方安装工具，不是插件新增的自动拖拽导入器。
2. 在 **设置 → 多模型团队** 选择六岗位模型，输入 Jev Key，阅读并自行启用 TypeSafe 数据许可，保存。
3. 回到项目聊天，输入：

```text
/team 修复购物车数量计算，并补充回归测试
```

右侧自动显示团队进度。配置不全时直接打开团队设置。正常使用不用填写每次的 key、检查 profile 或路径范围表单。

![明日方舟风格：离线 fixture，非真实模型运行](docs/images/v05-arknights-preview.png)

右上角 **风格 → 泰拉 / 原版 UI** 可随时切换；设置页也有同一入口。选择会在当前客户端记住，切换不重启任务、不清空未保存的模型表单或图谱选择。首次使用此功能默认泰拉风格；存储被禁用时仍可切换，但重启后不保证记忆。

方舟风格参考战术终端、档案面板及你提供的社区设计，使用原创 CSS/SVG；没有附带游戏角色、Logo 或第三方海报素材。来源和取舍见 [设计参考与交互说明](docs/UI-DESIGN.md)。

<details><summary>查看保留的原版 UI</summary>

![原版 UI：离线 fixture](docs/images/v05-classic-preview.png)

</details>

![一次设置界面：明确标注为离线 fixture](docs/images/v04-settings-preview.png)

## 会做什么

- 原生 `/team` 命令在送入普通聊天模型之前被消费，不依赖模型猜测命令。
- 六岗位独立选择真实 DSH 模型；Jev 是独立 TypeSafe 决策服务。
- 自动探测项目，支持带既有未提交改动的 Git 基线；不扫描大体积 ignored node_modules。
- Jev 负责 classify → 执行 → 独立检查 → continue / retry / verify / escalate / complete。
- 没有已识别测试时，安全项目仍可产生改动，显示 **待验证**；不会用“无测试”冒充通过。
- 原有测试/构建配置可按任务修改，但修改验收依据后不能自动宣称已完成。
- 重复发送、取消和切会话有绑定保护；运行中重复指令打开已有进度，不重复派发。
- 一次数据许可可撤销；后续 Jev 请求会重新检查许可与原生凭据状态。

## 能力与边界

| 场景 | 当前行为 |
|---|---|
| 读取/搜索/开发 | 项目内读文件、列文件、逐文件搜索、精确编辑和新文件写入 |
| 自动 Node 检查 | 已识别的 Node test、已安装 Jest/Vitest、TypeScript noEmit；保留安全测试参数，零测试或全跳过不算通过 |
| Python / Go / Rust | 检测现有 pytest/unittest、Go test（禁止自动下载）、Cargo test --offline；不自动安装依赖 |
| 未识别 runner / 缺依赖 | 保留可用产出，标为待验证；不让用户回填复杂 profile/scope 表单 |
| 验收依据被修改 | 可以保留开发结果，必须待验证，不能借新测试自证完成 |
| 无可靠项目基线/路径安全无法确认 | 只读分析或明确受阻，不假称完成 |
| 需要额外权限的检查 | 交给 DSH 当前会话的原生审批，插件从不自动批准 |

自动模式不把任意 shell、依赖安装或凭据/权限修改交给岗位模型；常规检查由受控宿主工具运行并反馈结果。验证仍要求 cwd 与 workspaceRoot 一致、原有 read-only/workspace-write sandbox；不自动改权限或支持 full-access 验收。源码证据上限为 10,000 个非敏感、非依赖文件 / 128 MiB，超限不声称完整验收。检查结果不是整个操作系统的事务隔离。

默认六岗位使用各自基础模型。启用动态路由后，可为每个岗位明确选择 weak / strong 候选；small 使用 weak，medium 使用基础模型，high / escalate 使用 strong，缺少候选时沿用基础模型。只使用宿主目录中已配置的选择，不猜模型 ID、不比较虚构价格，也不扩大工具或文件权限。

可选 Token 预算按**每次运行**设置，默认关闭、额度 0；开启必须明确填写正整数，没有把评估用 1,000 万写成产品默认。每次原生模型派发前预留该准确模型生成上下文声明的完整上界，用宿主原生 usage 结算；小预算可能在第一次调用前就不足。缺少可核验上界/usage 时停止后续派发，未知用量不退款。预算不是金额预算、跨运行项目总账或供应商账单保证。Jev 是单独计数的决策服务，不混入岗位模型 Token 额度。

## 隐私

Jev key 通过 DSH 原生 write-only 凭据接口保存，插件配置、聊天、模型上下文、快照和浏览器 localStorage 不携带它。rc.2 默认本机凭据文件有用户权限保护，**不是加密保险库，也不能隔离同一系统用户的所有程序**。不要把 key 发到聊天。

TypeSafe 会收到限长脱敏任务、差异统计、检查尾部摘要和审查摘要。设置页明确说明一次启用的范围；撤销后阻止后续请求。详见 [v0.4 架构与数据范围](docs/V04-ARCHITECTURE.md)。

## 验证与安装说明

本版是 0.6.0 功能闭环候选。原生 /team、设置、真实子代理、官方文件工具、独立验证子进程在官方 rc.2 Linux 云环境中运行；模型与 Jev transport 使用明确的惰性 fixture，没有读取真实凭据或发送付费 API 请求。Windows/Electron 原生与供应商实际模型能力仍需在对应环境验证。旧 cleanup exit 3 根因未确认；保留局部项目隔离，不把修复兼容性描述成根治。详见 [0.6.0 原生验收](docs/PRODUCTION-ACCEPTANCE.md)。

- [安装、一次设置与日常使用](docs/INSTALL.zh-CN.md)
- [验证记录](docs/VERIFICATION.md)
- [云端分层验收](docs/CLOUD-HOST-QA.zh-CN.md)
- [历史 v0.3 与上游策略适配](docs/JEV-V03.md)

开发检查：

```bash
npm ci --ignore-scripts
DSH_NODE_MODULES=/path/to/official/node_modules npm run check
DSH_NODE_MODULES=/path/to/official/node_modules npm run test:host
DSH_NODE_MODULES=/path/to/official/node_modules npm run test:team-host
DSH_NODE_MODULES=/path/to/official/node_modules npm run test:production-host
```

未运行真实付费 Jev/岗位模型，也不声称本机 Electron 全链路通过。全部原生接口、fixture、浏览器组件和真实模型验收分别报告。

## 归属

保留 `hermes-jev-skills` commit `b22a21f365720cb7cf06f9b229c095176b39cdb9` 的原始 lane/loop-step 策略及 MIT 归属。未运行其安装器；见 [NOTICE](NOTICE)。

## 0.6.0 生产接线

设置中的「运行控制」可配置每次运行预算、显式动态路由、主 Jev 版本、固定版本 shadow 与元数据记录。保存采用宿主原生 revision 冲突检查；已开始运行保留启动时的模型和预算，许可撤销会取消在途团队并阻止后续 Jev 发送。右侧显示实际派发模型、主/shadow 请求与响应版本、预算状态和可展开的脱敏元数据记录。

Shadow 只观察，独立超时、次数和并发上限；其结果不改变主流程、模型选择、权限或完成门禁。版本别名实际解析版本仅以响应为准，未报告时显示未知。元数据日志不含目标、源码、路径、原始错误或密钥。

运行 `npm run check:integration` 检查回归与历史离线评估组件；运行 `DSH_NODE_MODULES=/path/to/official/node_modules npm run test:production-host` 验证真正的原生宿主闭环。`evaluation/` 保留独立实验工具，不是当前生产预算入口。生产实现位于 `src/production-budget.js`、`src/host-adapter.js` 和原生运行时，并包含在安装 tgz 中。
