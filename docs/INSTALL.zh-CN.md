# v0.2 安装和运行

## 1. 确认已有 Desktop profile

目标为官方 DSH 0.2.0-rc.2 Web Client。不要把旧 TUI profile 当作 Desktop profile；本插件不使用 tuiScenes/tuiShortcuts。先确认发行版实际使用的 profile，并退出 Desktop。

构建源码：

```sh
npm ci --ignore-scripts
npm run check
npm pack --ignore-scripts
```

在 PowerShell 中使用真实 profile 名和归档绝对路径：

```powershell
dsh plugin --profile YOUR_DESKTOP_PROFILE add "C:/path/dsh-desktop-workflow-0.2.0.tgz" --ignore-scripts
```

插件没有安装脚本或生产依赖，不要把开发 node_modules 安装到 profile。macOS/Linux 也可用 `scripts/profile-install.mjs`，但必须明确指定已有 profile。

## 2. 配置团队

重启 Desktop，打开已有主会话，在原生右侧栏新增「多模型团队」。当前 Agent 必须已经存在且空闲；插件不会伪造会话或自行选择项目目录。

展开「模型与限制」，分别选择六个岗位的提供方、模型、该模型支持的推理强度以及每次请求输出上限。模型列表来自宿主目录，不是演示里的模拟名称。可选路由岗位关闭时不会调用它。

默认总派发上限 12、任务上限 8、并发 2、失败重试 1、10 分钟、每个子代理最多 8 步；每次输出默认 4096 tokens。派发上限包含规划、协调、复核和重试。所有上限都不是总费用保证。

## 3. 明确启动

填写任务目标，点击「运行前确认」。检查岗位模型、推理强度、上限、会话、工作目录及当前权限提示，再点击「确认并启动团队」。任务目标与读取的项目上下文会发送给所选提供方，执行岗位可能修改项目。

预览和演示不会执行；无真实会话、模型未配置、宿主缺少 agents/subagents/llm/tools/sandboxPolicy、主会话正忙或已有团队时不能启动。

权限由宿主继承，本插件不会改变安全设置。只读岗位的实际工具执行被白名单约束。rc.2 子代理的额外审批请求会被拒绝；遇到这种受阻，请在主会话处理，不要为了运行此插件把权限改为无限。

停止只取消本次运行，不回滚文件修改。若清理未确认，后续运行会锁定；检查残留任务并重启宿主，不要把提示理解为已经停止。

## 4. 旧状态导入（可选）

v0.1 文件查看器保留在「导入旧状态」。在 profile 的 cordis.patch.yml 追加以下覆盖，保留其它条目：

```yaml
- id: desktop-workflow
  config:
    stateFile: 'C:/project/runtime/cli-workflows/RUN_ID.json'
    staleAfterMs: 120000
```

它只读指定的普通 JSON 文件（非符号链接、最多 1 MiB），不选择最新文件。该配置是 profile 范围，不跟随当前聊天，也不是新团队运行的数据源。

## 5. 卸载

```powershell
dsh plugin --profile YOUR_DESKTOP_PROFILE remove dsh-desktop-workflow --config.ignore-scripts=true
```

删除你自己追加的旧导入配置覆盖，重启 Desktop。原始任务状态文件不会删除。
