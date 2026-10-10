# Jev 评估与动态路由项目目标

状态：第一阶段原始补丁基于 v0.5.3 提交 `6069f73b98b922d9db151e2b8637e250c33bbd4c`；当前组合候选已应用于冻结 0.5.4 独立源码副本，并附加 `evaluation/` 预算、HTTP 与独立验证接线。本补丁不修改正式版本、不重新发布既有安装包。

## 目标与不会改变的产品基础

建立「计划结构 → 岗位调用元数据 → Jev 判断 → 代码分支 → 实际检查结果」的可审查证据链。先验证策略，再决定哪些低风险分支值得由成本路由接管。

保留六角色独立配置、多会话历史、同项目写锁、权限审批、独立验证和泰拉/原版 UI。Jev 的建议不能覆盖测试失败、保护文件、项目隔离、权限与完成前 seal。现阶段不增加角色、不重写调度器、不自动替换用户选择的模型。

## 阶段一：可测试基础（本补丁）

### 1. 默认关闭的结构化记录

服务端现有 `jev` 配置增加 `trace: true` 时开启。不开启时不创建 trace、不产生额外模型调用。没有写磁盘、上传、自动持久化或后台采集。

每次运行独立保存，最多 512 条事件，随现有运行保留上限一起回收。只读接口为 `POST /api/dsh-desktop-workflow/team/trace`，沿用宿主认证 RPC envelope；payload 为 `sessionId` 与可选 `runId`。控制器内部可调用 `controller.trace(sessionId, runId)`。跨会话 ID 查询返回 null，返回值是脱离内部状态的副本。

白名单记录：
- 计划：岗位、匿名任务序号、依赖拓扑和计划/协调阶段
- 岗位调用：岗位、匿名模型槽、maxTokens、开始和终止状态。同一 provider/model 在一个运行中对应相同槽；不保存可能含私有名称的 provider/model 字符串
- Jev：主/影子来源，开始/成功/失败/取消/跳过，阶段，轮次，有限选项、完整选项概率、Noul 概率、Choice confidence
- 模型版本：请求的 Jev ID/别名、响应实际 model、版本策略、API返回的 token 数；旧 fixture 缺字段时明确为 null，不编造
- 验证：baseline/check/seal，检查序号、exitCode、passed 及 verified/scope/protected 等实际收集字段
- 分支：完成候选硬门禁拒绝、需人工、待验证、升级、次数耗尽、seal 拒绝和终态

不记录任务正文、提示词、计划描述、代码、源文件名或路径、会话标识、原始错误、测试输出、模型输出、凭据或请求头。仅白名单字段进入新 trace，不依靠事后正则删除整段输出。现有产品运行快照是另一接口，本补丁不会把该快照当作已脱敏 trace 导出。

### 2. 离线重放与参考 fixture

源码工作目录运行：

```sh
node scripts/evaluate-jev-fixtures.mjs > fixture-report.json
node scripts/replay-evaluation-trace.mjs exported-trace.json
node --test test/evaluation-trace.test.mjs
```

fixture 包含完成候选、实际检查失败、范围失败、需人工、未实现、下一步不明确六种合成案例。模型版本数字仅是合成 fixture，不代表真实可用型号或测试过该模型。工具只读取 fixture/trace，不能联网、发模型请求或执行记录中的源代码/命令。

重放重新计算同版本策略的 Jev 分类/步骤决策，并与记录值比较。它不是重新运行代码、测试或模型；也不是对历史终态真实性的认证。`scope` 明确为 `code-decisions-only`，无可重放判断时 `matches: null`；未结束、观察器尚未完成、截断、未知策略、非法字段或非法终态记录被拒绝。branch/verification 是观察证据，不能靠修改 trace 证明真实执行成功。没有签名或防篡改存储保证。

### 3. 独立候选 Jev 影子评估

本阶段是「保留现有主 Jev，旁挂候选 Jev 比较」。不会把现有必需主 Jev 静默改成可跳过，也不将候选结果用于调度。

- 默认关闭。只有服务端明确设置 `jev.shadow.enabled: true` 且指定 `jev.shadow.model` 的固定版本，或测试注入 `shadowJev` 才启用
- 使用现有授权的数据投影与原生凭据客户端；撤销许可仍会阻止新请求。主/候选版本各自独立
- 只提交主判断已经完成的同一阶段输入，使用主流程当时的 evidence/context；不把候选 lane 回写主状态
- 主运行不等待候选。候选相反建议、异常和迟到结果不改变主 lane、完成门禁或六角色选择
- 每运行默认最多 2 次候选请求，`jev.shadow.maxCalls` 可设 0–20；不消耗控制器主 `maxJevCalls` 计数
- 实际候选 work 全局最多 2 个；超时后底层适配器若仍未结束，其槽继续占用，后续候选会跳过，避免反复超时堆积请求
- 原默认观察器最多等 10 秒，包括刷新阶段。预算评估 adapter 可在主流程结束后拿到独占执行槽，单独有界等待队列，然后再开始这 10 秒窗口。取消/卸载独立取消观察器；迟到结果不回写。观察器已结束不代表一个忽略取消的第三方适配器底层已清理
- 影子记录可晚于主终态；应等候选结束或超时后再导出重放

影子请求仍可能产生费用，并与主 Jev 共用 TypeSafe 账户/服务端速率限制。独立本地计数不等于隔离供应商配额、429、网络、总 token 或美元预算。当前没有真实调用许可，因此本次未开启 live shadow，也未读取或写入任何真实凭据。

### 4. 可明确配置的 Jev 版本

现有服务端 `jev.model` 透传到原生宿主 Jev 客户端。未指定时仍使用原来的 `jev-latest`；不重写已保存角色配置、凭据或许可。候选 shadow 必须明确固定版本，不能自动跟随 latest。无效配置在安装运行时 guard 前拒绝，不残留半初始化保护。

TypeSafe 的模型页说明别名会移动，返回的 `model` 标识实际版本。固定版本与保留响应版本是两件事；如果响应缺失版本，记录 null，不能说已证明版本固定。升级前应用同一组脱敏案例评估新旧版本，批准后再更改配置。

### 本阶段验收标准

1. 原有主分支、角色模型和完成门禁在无 shadow 与相反/失败/超时 shadow 下相同
2. 模型内容、任务/路径、测试尾部、秘密样例不出现在导出 trace 中
3. 重放能匹配正常记录，发现修改的判断，拒绝缺失/截断/未知策略记录；不把匹配度称作模型正确率
4. 记录真实检查失败时，即使模型 confidence 很高，也不得 completed
5. 主/候选请求版本、返回版本与已知 token 数可区分；Noul 不出现伪造的 confidence
6. 取消、已完成后卸载、超时与底层不响应取消均有有界观察与并发测试
7. 多会话和写锁回归保留；本补丁未修改相关生产实现

## 阶段二：领域效果与阈值评估（需要新授权）

建立由用户挑选的代表任务集：简单改动、失败恢复、权限受阻、缺测试、跨文件依赖、中文需求、已有未提交改动。先保存脱敏输入的人工批准版本，防止将源代码和私有原文默认写入评估库。

参考结果来源必须明确：人工标注、独立强模型评审、实际测试结果分别保存，不将强模型意见直接当作真值。强模型和 Jev 分歧进入复核队列。新增真实案例以前，本阶段六个合成标签只检验代码分支。

指标按任务/分支分别统计：误放行、误返工、升级/人工比例、失败恢复、有效完成率、每个成功任务总成本、端到端延迟；区分 missing evidence / model error / code error / service failure。confidence 是概率分布统计，不是端到端正确率；阈值不得从教程示例直接照搬。

验收：用户确认任务集与错误代价；新旧策略对同一批案例有可追溯记录；明确样本量与不确定性；任何高风险误放行先解决，才允许小范围接管。

依赖用户确定：允许发给 TypeSafe/参考模型的数据、准确 provider/model、每轮和总金额上限、停止条件，以及是否允许真实付费调用。未获这些授权前只做离线 fixture。

## 阶段三：动态成本路由（接口计划，默认关闭）

保持当前「岗位 → 用户指定模型」为基准策略。先做纯建议的 cost-routing adapter，再通过小规模 shadow 对比。拟议接口：

```ts
type RoutingRequest = {
  role: 'planner' | 'coordinator' | 'researcher' | 'explorer' | 'worker' | 'reviewer';
  allowedModelRefs: string[];       // 用户事先允许的候选，不从模型输出添加
  currentModelRef: string;
  taskClass: string; riskBand: string;
  budget: {currency: string; runLimit: number; remaining: number};
  priceCatalogRevision: string;    // 用户确认的价格目录与生效日期
  evidenceTraceRef: string;
};
type RoutingProposal = {
  mode: 'observe';                 // 第一版固定 observe，不进入执行
  modelRef: string;
  reasonCode: 'keep-current' | 'candidate-cheaper' | 'insufficient-evidence';
  estimatedCost: number | null;    // 未知时为 null，不捏造零成本
  policyVersion: string;
};
```

价格和型号不写死为「最新」。只在用户允许的 provider/model 中选择，并使用明确版本、确认过的价格目录与上下文限制。执行前由确定性代码核对权限、允许名单、剩余预算与估计不确定性。Jev 无权提高预算、换厂商、扩权限或跳过验证。

验收：在用户认可的质量/风险界限内，与静态六角色方案比较每个完成任务总成本和延迟；先展示建议与真实账单差异，再决定是否启用。影子优胜不自动获得发布或启用许可。

## 阶段四：受控启用与回退

独立版本发布；默认仍保持静态配置。明确可接管的低风险任务类别、预算上限、版本和回退条件。灰度期间保留记录；服务失败、质量退化或价格目录过期回到用户原先模型选择，并报告原因。不能以失败回退为理由偷偷换成未批准的模型。

## 核实的官方资料

核实日期：2026-10-10。没有安装上游 skill 或访问付费课程。

- [官方模型与别名](https://docs.typesafe.ai/models)：版本 ID 与响应 model
- [官方 confidence](https://docs.typesafe.ai/confidence)：Choice/Score 的分布统计；Noul 无独立 confidence
- [官方 HTTP API](https://docs.typesafe.ai/api)：answers、model、usage 合约
- [官方 TypeSafe skill](https://github.com/typesafe-ai/skills)：代码负责流程与约束；领域效果需实际验证
