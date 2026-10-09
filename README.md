# DSH Desktop Workflow v0.3

Jev 核心调度 + 六岗位真实 DSH 子代理。目标宿主是官方 **DeepSeek Harness 0.2.0-rc.2** 的 Web Client 接口，作为原生右侧栏插件加载。

![v0.3 组件预览：显式合成 fixture，不是真实模型运行](docs/images/component-preview.png)

## 工作方式

1. 用户分别选择规划、协调、研究、探索、执行、审查六个岗位的实际宿主模型。
2. 明确批准本次 TypeSafe 数据传输，选择服务端验证方案与允许修改的相对路径。
3. 宿主采集干净基线，独立 TypeSafe Jev 判断初始 lane。
4. 团队按任务 DAG 执行；只读任务可并行，编辑串行。不会自行扩大权限或创建更多代理。
5. 每轮由原生宿主工具独立采集 tests / diff / scope，Jev 选择 continue、retry、verify、escalate 或 complete。
6. lane 只逐级提升审查策略，**不偷偷替换用户选择的模型或厂商**。到最高 lane、限额或人工决策点就阻塞。
7. 只有任务、独立检查、范围、保护证据及审查全通过，且 Jev 达到完成阈值，并在最后重新确认文件未变化，才能显示完成。

缺 Jev 凭据、缺可信检查配置、权限拒绝、证据不足和服务故障都会明确阻塞。没有普通模型 router 降级，也没有自动转入演示。演示仅在用户明确选择后加载合成 fixture。

## 开始前请确认

- 当前升级的是 **lane / 复核策略**，不是自动切换模型；需要强模型复核时，请由用户明确给「审查者」岗位选择强模型。
- 必须使用**干净 Git 仓库 + 明确验证命令/保护路径 + 明确修改范围**。不是任意已有工程开箱即用。
- 独立检查扫描整个仓库（包括 ignored 文件），上限 **50,000 条目 / 256 MiB**。大型 node_modules 项目可能因此阻塞；应准备经过审阅、满足边界的隔离检出，不要关闭检查来放行。

## 安装与配置

```bash
dsh plugin --profile YOUR_DESKTOP_PROFILE add /path/dsh-desktop-workflow-0.3.0.tgz --ignore-scripts
```

请使用实际 Desktop profile，先退出宿主；保留旧版配置以便自行回退。

- [安装与使用](docs/INSTALL.zh-CN.md)
- [Jev 服务端配置、数据范围、上游适配差异](docs/JEV-V03.md)
- [执行与安全架构](docs/ARCHITECTURE.md)
- [验证记录与未测边界](docs/VERIFICATION.md)

Jev 通过服务端环境变量名称引用凭据，浏览器不接收、输入或存储密钥。验证命令和受保护测试/配置来自服务端固定 profile；用户启动前可看到 argv、超时和保护路径。不要把密钥发到聊天或任务目标里。

本插件不会配置模型服务商、购买额度、自动批准工具权限或修改宿主安全设置。停止会等待活动任务清理，**不会回滚已经发生的修改**；清理无法确认时会锁定新运行。

## 运行边界

分别限制派发次数、每代理步骤、每次请求输出、总时长、重试、Jev 调用次数与轮数。这些不是实际总 token 或美元费用硬上限，付费前还应在提供方设置预算。

验证覆盖当前仓库的文件、ignored 文件、模式、目录和 Git 元数据；不是整个操作系统的事务隔离。宿主仍执行原有 sandbox 和权限规则。验证要求 cwd 与 workspaceRoot 一致；full-access、linked worktree、超出规模限制的工作区均明确阻塞。

## 开发与检查

```bash
npm ci --ignore-scripts
npm run check
DSH_NODE_MODULES=/path/to/official/node_modules npm run test:host
DSH_NODE_MODULES=/path/to/official/node_modules npm run test:team-host
```

离线预览是明确的 fixture，不代表真实模型或 TypeSafe 已调用。原生 rc.2 接口检查与真实 Web 加载是独立验收阶段；本交付未运行付费模型或本机 Electron。

## 参考与许可证

参考 `kerpopule/hermes-jev-skills` 固定 commit
`b22a21f365720cb7cf06f9b229c095176b39cdb9` 的 lane/loop-step 策略。未运行其安装器。保留 MIT 归属（Steve Darlow），见 [NOTICE](NOTICE) 与 [上游许可证](src/vendor/HERMES-JEV-LICENSE)。这是一份独立 DSH 适配，不是原仓库安装器的照搬。

## 历史安装包

dist 保留 v0.1、v0.2 历史归档；新安装或升级请选择 **dsh-desktop-workflow-0.3.0.tgz**。SHA256SUMS 列出三个归档的校验值。

## 本次云端验收

详见[云端验收记录](docs/CLOUD-HOST-QA.zh-CN.md)。111 项测试和隔离安装通过；新版真实宿主界面因云浏览器屏蔽尚未验收，真实 Jev/模型及 Windows/Electron 也未端到端验证。
