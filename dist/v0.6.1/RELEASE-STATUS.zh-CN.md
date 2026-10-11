# DSH 0.6.1 候选交付

已修复 0.6.0 在官方默认 bwrap 下的跨调用 /tmp 证据丢失。原 0.6.0 包与失败复现保留。

安装包：dsh-desktop-workflow-0.6.1.tgz

SHA-256：`fdbb46851fe29d7709f3af6549f06514c314b3fbccb45656dfd7d13dd7940969`

- 同源源码、增量补丁、逐文件清单及测试证据齐全；50 个包文件逐字节匹配源码。
- 官方宿主测试：305 通过、0 失败、1 个非 repo 环境 fixture 跳过。离线 evaluation：123/123。独立重点审查：91/91。
- 精确 tgz 的官方默认 bwrap 四阶段、证据篡改拒绝、丢确认隔离和独立项目顺序运行均已在 exec、独立审查及父线程云桌面实测通过。
- 官方安装后的 /team 集成使用真实 Loader/AgentLoop/子代理/文件工具及验证子进程；模型/Jev 是惰性 fixture，shell 是固定命令测试 backend。该测试与真实默认 bwrap 验证器测试分开记录，不能合称真实付费模型端到端通过。
- 微软官方 PowerShell 7.6.6 在 Linux 上实际执行 33 个进程通过兼容回归。Windows/Electron 原生仍待对应环境验收。

新持久证据目录位于任务项目根，内容受岗位工具保护，原始摘要保存在宿主。严格验证唯一文件、链接、权限、run/root 和摘要；只精确排除自有状态文件，清理不递归删除。丢确认或未知清理维持本项目隔离，其它独立项目不全局锁死。只读工作区无法建立持久证据时降为只读分析/待验证。

长期回归入口：源码 `scripts/verify-default-sandbox.mjs` 和 `scripts/README-default-sandbox.md`。必须锁定待发包 SHA，保持 TMPDIR/TEMP/TMP 未设置，不能通过放宽 sandbox 让测试通过。

真实模型/Jev 未运行：官方 Web 已在云桌面安装启动，但该环境 Chromium 阻止本地页面，未进入用户密钥接手。没有读取、填写或复制真实 API key。请求的模型 ID `gpt6-luna` 保持原样，供应商实际 alias、tool/usage/context 契约尚未确认。

发布仅面向既有 review 分支；不修改 main 或 v0.5.3。本目录所有文件冻结后由 SHA256SUMS 校验。
