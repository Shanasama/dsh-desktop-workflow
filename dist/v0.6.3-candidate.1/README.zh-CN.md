# 0.6.3-candidate.1 候选交付

本目录保留 2026-10-11 冻结候选的精确文件。仅上传到 `review/jev-evaluation-stage1`，不是正式版本，也不表示已安装到用户电脑。旧 `dist` 历史与回滚包全部保留。

- 插件包：[dsh-desktop-workflow-0.6.3-candidate.1.tgz](dsh-desktop-workflow-0.6.3-candidate.1.tgz)
- 自包含离线预览：[dsh-workflow-preview-v0.6.3.html](dsh-workflow-preview-v0.6.3.html)，下载后直接打开。全部为合成数据，CSP 禁止网络。
- 冻结源码：[dsh-workflow-source-v0.6.3-candidate.1.zip](dsh-workflow-source-v0.6.3-candidate.1.zip)
- 校验：[SHA256SUMS](SHA256SUMS)
- [安装说明](../../INSTALL-ME.md) · [本版验收范围](../../docs/V063-CLOUD-ACCEPTANCE.zh-CN.md)

源快照 commit：`f9ed3214b285ad35c88e807a97f3f39a4767de8b`，冻结开发分支：`cloud/v063-design-and-runtime`。仓库根源码同步该快照；发布说明额外保留在此目录及仓库首页。`delivery-manifest.json`、冻结文档与测试日志中的“未发布”描述指冻结时状态；它们为保证溯源未做改写。

## 已验证

构建、类型检查通过；主回归 413 通过、8 项环境/平台跳过，evaluation 123 通过；另有独立重点回归 44 通过。官方 rc.2 宿主 fixture、原会话 flush/JSONL 冷重载、云 Chromium 合成界面和事件动画通过。宿主 fixture 中外部请求为 0。

## 尚未验证

真实付费模型和 Jev/TypeSafe、Windows/Electron 端到端仍未验收；完整 native frontend factory 未测。fixture、JSDOM 与浏览器合成预览不代表这些项目通过。部署只发布已冻结候选，不触发真实模型、自动安装或扩大权限。

插件包：1,070,479 字节，SHA-256 `ad818c30b1ee67d5a2d8c682349a114e6a0974b8fa2c3731302731aa315d88df`。
