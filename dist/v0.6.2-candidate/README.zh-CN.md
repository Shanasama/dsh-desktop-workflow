# 0.6.2 Windows 验收候选

仅供 Windows 本机验收，不是正式完成版。正式 0.6.1 入口和现有包保持不变。

- `dsh-desktop-workflow-0.6.2.tgz`：626993 字节；SHA256 `96121ae49938a59bec3a14e2fd41f21661dfe5ef0cefa272d7d019ebfcb68681`。
- `dsh-v062-nested-job-probe.mjs`：9735 字节；SHA256 `839621c7130f392de3d44f83d247afb27a40086c826b6cd6bb88dcfcb0cb120a`。
- 独立云端测试：344 项，343 通过、0 失败、1 个已知 non-repo fixture 跳过。Windows/Electron 原生尚未验收。
- 先在实际默认受限环境运行独立嵌套 Job 能力探针，再验收此精确候选的 baseline/check/seal/cleanup 与异常边界。不修改权限、ACL 或沙箱配置。
- 真实模型、Jev API 和密钥均未使用。此处只传递候选包和探针；完整源码发布等待真机验证。

候选保持冻结。任何后续代码改动必须产生新候选和新 SHA256。
