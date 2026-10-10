# DSH 多模型团队 0.6.0 候选

已完成原生 /team 接线、六岗位显式 weak/base/strong 动态路由、每次运行可配置 Token 预算、主 Jev 版本与固定版本 shadow、原生设置持久化、右侧运行/版本/预算/路由/脱敏日志状态。保留泰拉/原版 UI、多会话历史、项目锁和保守清理隔离。

## 交付

- dsh-desktop-workflow-0.6.0.tgz：可安装插件包
- dsh-desktop-workflow-0.6.0-source.zip：同源可测试源码
- integrated-offline-to-0.6.0.patch：从此前精确离线整合源码到本候选的补丁，已回放逐文件核验
- validation-summary-0.6.0.json、validation-evidence-0.6.0.zip：验收摘要与原始日志
- SHA256SUMS：本交付校验值

## 已验证

构建与类型检查通过。插件 263 项中 262 通过、0 失败、1 因环境无法构造非 Git 目录而显式跳过；独立评估回归 123/123。官方 PluginManager 安装精确 tgz 后，由官方 Loader 加载安装后的文件；真实 AgentLoop/NativeSubagents、原生认证 /team、文件工具、设置和凭据服务、独立验证子进程实际运行。最后一次：39 子代理清理平衡、52 惰性模型调用、30 惰性 Jev 调用、30 真实验证进程、0 外部请求。安装测试故意使用同版本但不同物理副本的 LLM peer，预算仍通过宿主真实请求标记核验。

真实 PowerShell 7.6.6 + rc.2 原生工具链在 Linux 云端通过 baseline/check/seal/cleanup、含空格/中文/引号路径、证据篡改拒绝与未派发失败回收。

## 尚未声称完成的环境验收

模型与 Jev 返回为明确 fixture，没有真实付费 API 或真实密钥验收，也未验证节费效果。Windows/Electron 原生未运行；云端 Chromium 被 socket 权限阻止，未生成或声称通过视觉截图验收。离线安装测试预置宿主已有精确依赖，不代表清空缓存后可离线取得依赖。

预算默认关闭、额度 0；开启后按每次运行执行，未将 1,000 万实验预算写成默认。它按宿主准确上下文声明保守预留并用原生 usage 结算，不是金额/账单保证。历史 cleanup exit 3 根因仍未证实；清理不确定时保留该项目隔离，独立项目可继续。
