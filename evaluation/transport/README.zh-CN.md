# 预算验收 HTTP 传输与用户本地入口

这是一组小型、无第三方依赖的 Node.js 模块，供同目录外的 `evaluation/src/budget.mjs` 和生产 `JevTeamController` 使用。模块适用于本仓库现有 Node.js 版本要求。

## 当前验证范围

- 自动回归只使用公开合成数据、内存占位凭据和注入的 `fetchImpl`；没有实际供应商 API 请求，没有读取环境密钥、聊天密钥、密钥文件或系统凭据库。
- 已覆盖 Chat Completions、Responses、官方 TypeSafe schema、共享预算记账、错误/取消/超时、大小限制、禁止重定向/重试，以及隐藏输入和最终确认。
- 这些结果证明本地实现的模拟行为，不证明 `api.aiuzh.icu` 的兼容性、模型可用性、质量或服务端计费上限。
- `preflight.example.json` 故意保留未知字段。以该模板运行会在询问密钥之前阻断。填上 `true` 或通过一次合成请求，都不能凭空建立供应商的硬预算保证。

## 最短离线用法

在整合仓库根目录：

```sh
node --test evaluation/transport/test/*.test.mjs
node evaluation/transport/run.mjs
node evaluation/transport/run.mjs --offline --config evaluation/transport/preflight.example.json
```

不带参数默认运行两个模拟 HTTP POST，真实网络请求为零，也不读任何用户密钥。离线配置检查会报告阻断原因和两种公开合成请求的 SHA-256；计算摘要本身不是 token 上界证明。

## 用户自行启动真实预检

先由有依据的供应商资料补齐非密钥配置，再由用户在自己的真实终端启动：

```sh
node evaluation/transport/run.mjs --live-preflight --config path/to/verified-preflight.json
```

程序先检查配置和两个共享账本，再依次让用户隐藏输入模型服务密钥、TypeSafe 密钥，最后输入 `SEND`。只有最后确认才发送请求。不要把密钥放入命令参数、配置、聊天、环境变量、管道、远程表单或录屏；这个入口只接受交互式 TTY，没有明文回显降级。Ctrl-C、终止信号和输入错误会恢复终端状态。

成功路径共两次物理请求：先发一个 TypeSafe Noul 公共合成问题，再发一个模型公共合成文本问题。失败就停止；不自动切换模型、API 路径或 provider，不自动重试。不读取或上传用户项目，不执行模型文本，也不据此宣称项目验收通过。报告只有数值、固定错误码和布尔检查结果，没有完整模型输出、原始 HTTP 错误、请求正文或凭据。

密钥只保留在该进程的运行内存中，完成后丢弃引用；JavaScript 字符串和底层 HTTP 栈不提供可保证的物理内存擦除。不要在不可信终端、调试器或开启请求抓包的运行环境中使用。

### 配置需要什么证据

`preflight.example.json` 中已固定用户提供的 origin 和准确外部 model ID：`https://api.aiuzh.icu`、`gpt6-luna`，没有把它改成 `gpt-6-luna`。

以下字段必须有对应供应商、对应模型的可核验证据：

1. `endpointPath` 和 `providerContract.usageFormat`：明确使用 Chat Completions 或 Responses。模块支持这两种已知线格式，但不会据此推定第三方同时支持它们。只允许明确选择 `/v1/chat/completions`、`/chat/completions`、`/v1/responses` 或 `/responses` 中匹配的一项。
2. `outputLimitParameter`：Chat 仅接受 `max_completion_tokens`；Responses 仅接受 `max_output_tokens`。不猜测传统 `max_tokens` 是否覆盖推理。必须确认参数限制该服务所有计费输出，才能填 `outputLimitIncludesAllBillableOutput:true`。
3. `reasoningAccounting`：本 HTTP 实现只接受 `included_in_output`。`prompt_tokens/completion_tokens` 或 `input_tokens/output_tokens` 是总量；推理和缓存明细是子集，不重复相加。其他口径须另行审查，不能勉强映射。
4. `inputUpperBoundMethod`、`inputUpperBoundTokens`：必须覆盖完整最终序列化请求、供应商消息封装和隐藏开销。字数、字符数、经验比例、一次观察值都不算硬上界证明。
5. `requestSha256`：对应离线检查输出中的最终公开请求摘要，把输入上界证据绑定到这一具体请求。改动输出上限或请求字段后应重新检查。
6. `verifiedForModelId` 和 `evidence`：明确模型 ID 及合约证据来源。程序只验证字段存在和请求一致性，不能自动判断文字证据真假。不得复制测试中的模拟合约作为真实证明。

预检默认输出上限 128，允许降低，不允许提高。通用 transport 的独立最大输出限制默认 2048，调用方可以进一步降低。请求不带工具、多候选、后台任务、历史 response ID、provider 任意扩展参数或音视频输入。

截至 2026-10-10，本次公开网页检索没有取得 `api.aiuzh.icu` 的可引用 API/usage/输出上限合约；网页工具无法读取其首页，精确域名检索也未找到相关文档。这不等于服务不可用。缺少资料时继续保持阻断，不能把 OpenAI 自有 API 文档当成第三方服务承诺。

## 同一项目账本，不另起预算

本地入口固定使用：

- `evaluation/run-state/project-budget.json`：项目 `dsh-jev-project-acceptance`，10,000,000 token 总额；本次任务 `http-preflight`，与后续任务共用 `pilot` 批次，批次 100,000、单任务 20,000。
- `evaluation/run-state/project-jev.json`：Jev 独立计数，`maxCalls:30/maxAttempts:2/concurrency:1`；主调用和影子调用也应共用它。transport 抛出的错误 `retryable:false`，因此不会触发 meter 的条件重试。

这两个路径必须与后续实际评测一致。不要复制整个工具去新目录、换项目 ID、创建新账本或删除锁来获得新的额度。账本是单机、单写入者保护，不是供应商账户级跨设备额度限制。若供应商不遵守已核验合约，本地代码无法强制其计费上限。

模型请求先持久化最大预留，再发 HTTP。超时、取消、无 usage、不可判终态、解析失败等都会保留预留并停止，不能把请求视为零消耗。有效的已知终态 usage 先结算；模型拒绝、已知 HTTP 错误或输出不完整不代表没有费用。未知结果可能已经被服务器计费，客户端取消也不保证服务器停止。

出现未决锁或预留时，先对照供应商请求/计费记录人工核实，不自动清除，也不自动重发。重启不能把已经发生的消耗重置为零。Jev 不计入 10,000,000 大模型 token 预算，但每一次真实尝试仍须被独立持久计数。

## 供整合代码使用的接口

```js
import {
  createOpenAITransport,
  createTypeSafeDecisionClient,
  decodeOpenAIText,
} from './evaluation/transport/index.mjs';

// 所有函数均由调用方明确注入；不会自行发现密钥。
const transport = createOpenAITransport({
  baseUrl, endpointPath, modelId, contract,
  maxOutputTokens: 2048,
  getCredential: () => userEnteredInMemoryModelCredential,
  fetchImpl: globalThis.fetch,
});

// 必须先经 callBudgetedModel 预约、执行和结算，然后才解析输出。
// transport(payload, {attempts: 1, signal}) -> {usage, choices|output, ...}
// 已知 usage 的终态错误 -> {usage, error: {code: 固定值}}
// 未知 usage/终态 -> 抛固定 TransportError，由预算包装器保留预约。

const jev = createTypeSafeDecisionClient({
  modelId: 'jev-1.13.0',
  getCredential: () => userEnteredInMemoryJevCredential,
  fetchImpl: globalThis.fetch,
});
// jev.decide({phase, goal, evidence, notes, signal}) -> parseJevResponse 结果
// getJevMetadata(answers).usage 保留给现有持久 JevMeter 包装器使用。
```

导出的 factory 本身不发请求，`getCredential` 只在发出单次请求前调用。导入时只读取本仓库的已检入策略文件。调用方必须使用受信任的 `fetchImpl`；生产路径使用原生 fetch 的 `redirect:'error'`，在凭据跟随重定向前阻断。事后检查 `response.url` 是额外保护，无法把恶意自定义 fetch 变成安全实现。

默认请求体上限 64 KiB、响应体上限 256 KiB、整次请求（包括响应体）超时 15 秒。按 UTF-8 字节计量；即使注入的 fetch/stream 不遵守 abort，调用方等待也会在截止时结束。所有请求最多一个物理 POST。模块不记录原始正文，错误只允许固定码。

TypeSafe client 使用现有 lane/loop-step 策略和 `projectJevText` 限长/敏感内容检查；公开预检只使用独立合成 Noul。`jev-latest`/`jev-preview` 为可漂移别名，模块允许显式使用并保留响应版本；本预检固定 `jev-1.13.0`。文档确认型号不等于已验证用户账户权限。

## 已核验的公开参考

2026-10-10 查阅：

- [TypeSafe HTTP API](https://docs.typesafe.ai/api)：`POST /v1/systemone`，`model/state/questions`，typed `answers`，usage 的 `input_tokens/output_tokens`。
- [TypeSafe models](https://docs.typesafe.ai/models)：当前列出 `jev-1.13.0`，别名可能漂移。
- [OpenAI Chat Completions](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)：标准 Chat 请求/响应字段。
- [OpenAI token counting](https://developers.openai.com/api/docs/guides/token-counting)：总量与 reasoning/cache 明细关系、标准输出限制语义。

OpenAI 参考仅用于明确实现已知协议，不证明第三方服务的实现符合它。

### 整合后的保守清理边界

HTTP传输一旦已dispatch却异常结束，就向持久JevMeter发出固定的未确认清理标记，并主动abort/尝试取消响应体。Jev保留active与锁，禁止新请求，直到人工核验；不因为本地read已经结束就假定底层cancel或服务端处理已结束。完整成功读取JSON后，独立答案/usage校验失败仍作为已结束的失败调用计数。此处不增加自动重试或自动解除锁。
