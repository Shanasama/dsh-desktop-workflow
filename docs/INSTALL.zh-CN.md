# v0.3 安装与使用

目标为官方 DSH 0.2.0-rc.2 Web Client。插件不使用 TUI scene 或独立网页替换宿主。

## 安装

先确认实际 Desktop profile，退出宿主。不要直接把测试 profile 的配置覆盖到用户 profile。

```bash
dsh plugin --profile YOUR_DESKTOP_PROFILE add /absolute/path/dsh-desktop-workflow-0.3.0.tgz --ignore-scripts
```

Windows 使用对应绝对路径。安装器不修改提供方凭据或权限。

重启宿主后，在原生右侧栏打开「多模型团队」。卸载使用：

```bash
dsh plugin --profile YOUR_DESKTOP_PROFILE remove dsh-desktop-workflow --config.ignore-scripts=true
```

## 真实运行前

1. 在宿主中配置实际可用模型；插件只从宿主目录选择，不创造模型 ID。
2. 管理者在插件服务端配置 Jev 的凭据引用和固定验证 profile。详情与示例见 [JEV-V03](JEV-V03.md)。浏览器不提供密钥输入框。
3. 验证 profile 必须包含检查 argv、timeout、受保护的验收测试/runner/config 路径。间接 npm 脚本也要保护相关配置及依赖输入。
4. 打开一个空闲的真实主会话。验证要求仓库根 cwd=workspaceRoot、原有 read-only/workspace-write sandbox、干净 Git 基线；不会要求或自动开启 full-access。
5. 分别配置六岗位模型及运行限制，选择可信验证 profile，并填写允许变更的相对路径。路径不支持绝对路径、..、反斜线、glob 或整个 `.`。
6. 检查目标、模型、argv、超时、保护范围与数据传输说明，再勾选本次 TypeSafe 同意并确认启动。每次启动都重新确认。

缺配置时面板保持阻塞。不要为了演示而加入假生产 key 或放宽权限。可以明确进入标注「fixture/合成示例」的演示。

## 运行与停止

查看 Jev lane、round、最新决策、历史记录、任务图、独立检查和硬门禁。

lane 升级不会更换六岗位模型。完成需要独立 checks/diff/scope 与最终 seal；worker/reviewer 自报通过不够。

停止请求会中止本次运行并等待活动任务。已有修改不会自动回滚。若出现未确认清理、后台提升或超时，新的运行会被锁定；请检查宿主残留任务后重启，不能把不明状态当停止成功。

## 验证边界

真实空配置 Web 的加载/阻塞验收，与 fixture、原生接口测试分别报告。本交付不宣称已运行真实付费 TypeSafe/角色模型，也不宣称本机 Electron 验收通过。
