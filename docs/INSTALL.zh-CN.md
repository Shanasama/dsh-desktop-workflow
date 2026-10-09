# Desktop 安装与边界

这是独立的 DSH Desktop 工作流插件，目标为官方 `0.2.0-rc.2` Web Client 接口。它通过桌面原生右侧栏的 工作流页签显示 Jev 状态，不使用 `tuiScenes` / `tuiShortcuts`，不修改 DSH 主程序。

## 先确认目标 profile

不同 Desktop 发行版可能使用不同的 profile。先确认你当前 Desktop 启动的是哪一个现有 profile；不要直接套用旧 TUI profile。若发行版没有对应的官方插件加载机制，先核对兼容性，不要改权限来绕过。

## 从源码打包

```sh
npm ci --ignore-scripts
npm run check
npm pack --ignore-scripts
```

## 安装

用真实 profile 名替换占位符，并使用归档的绝对路径：

```powershell
dsh plugin --profile YOUR_DESKTOP_PROFILE add "C:/path/dsh-desktop-workflow-0.1.0.tgz" --ignore-scripts
```

重启对应 Desktop profile，打开会话，从右侧栏的新增页签入口选择「工作流」。默认空白等待；「查看演示」显示的是明确标识的合成示例，不调用模型。

## 连接真实状态文件

在对应 profile 的 `cordis.patch.yml` 中追加这一段，保留其它条目：

```yaml
- id: desktop-workflow
  config:
    stateFile: 'C:/project/runtime/cli-workflows/RUN_ID.json'
    staleAfterMs: 120000
```

文件来自原有 `CliWorkflowStore` / Jev 生产端；RUN_ID 由它返回。插件不运行任务、不读取密钥、不初始化 MCP、不扫描最新文件。只读这一份明确指定的 JSON，打开面板时每五秒刷新。新任务需要显式更换路径。该配置属于整个 profile，与当前聊天会话无关。

inspect 任务显示「检查」；edit 任务显示「实现」。测试、复核与完成都只是生产端保存的报告，不代表插件独立执行或复验。运行中的旧快照会标记 stale，不等于进程一定卡住。

## 卸载

```powershell
dsh plugin --profile YOUR_DESKTOP_PROFILE remove dsh-desktop-workflow --config.ignore-scripts=true
```

再删除你自己追加的 `desktop-workflow` 配置条目，重启 Desktop。原始任务状态文件不受影响。

## 验证边界

本仓库有构建、类型、解析器、桥接、交互与生命周期测试。`npm run preview` 只是同一组件的本地预览，不是已经安装到你当前 Desktop 的证据。实际发行版及其 profile 的加载情况需要在目标 Desktop 上确认。插件无需也不会设定无限权限、自动审批或模型密钥。
