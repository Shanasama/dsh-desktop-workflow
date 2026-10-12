import { createDefaultTeamSettings, type TeamRole, type TeamSnapshot } from './team-types';

/** Static synthetic records matching the implemented controller; never starts an agent. */
export function createTeamDemo(): TeamSnapshot {
  const settings = createDefaultTeamSettings();
  const demoModels: Record<TeamRole, string> = {
    planner: '演示 · 强规划模型', coordinator: '演示 · 主力协调模型', researcher: '演示 · 轻量研究模型',
    explorer: '演示 · 代码探索模型', worker: '演示 · 主力执行模型', reviewer: '演示 · 强审查模型',
  };
  for (const role of Object.keys(demoModels) as (keyof typeof demoModels)[]) {
    settings.roles[role] = { provider: '演示提供方（未连接）', model: demoModels[role], maxTokens: 4096 };
  }
  const at = (minute: number, second = 0) => `2026-10-09T09:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}.000Z`;
  return {
    id: 'demo-cart-branching', sessionId: 'demo-session', demo: true,
    goal: '修复购物车数量更新，并补齐回归测试', status: 'running',
    roles: settings.roles, limits: settings.limits, startedAt: at(41),
    jev: {
      mode: 'fixture', lane: 'medium', round: 1,
      decisions: [
        { phase: 'classify', action: 'classify', lane: 'medium', confidence: .93, reason: '【Fixture】涉及代码修改与回归检查，采用标准团队流程；岗位模型不变。', round: 0, nodeId: 'jev-classify-1' },
        { phase: 'step', action: 'continue', lane: 'medium', confidence: .89, reason: '【Fixture】方案已复核，继续执行。尚无可交付的验证证据。', round: 1, nodeId: 'jev-step-1' },
      ],
      evidence: { checksPassed: false, scopeOk: true, diffAvailable: false, verified: false, reason: '【Fixture】演示仍在执行：范围检查通过，测试与差异证据尚不齐全，不能判定完成。' },
    },
    message: 'Fixture 合成示例：Jev 完成分类并选择继续执行；研究与探索并行，执行有界重试。未调用模型或 TypeSafe。',
    nodes: [
      { id: 'jev-classify-1', role: 'jev', kind: 'jev_classify', title: 'Jev 判定标准任务流程', status: 'completed', attempt: 1, dependsOn: [], startedAt: at(41), finishedAt: at(41, 1), output: '【Fixture】lane: medium；action: classify；confidence: 0.93。独立 TypeSafe 决策的合成记录，未发送网络请求。' },
      { id: 'jev-step-1', role: 'jev', kind: 'jev_step', title: 'Jev 选择继续执行', status: 'completed', attempt: 1, dependsOn: ['plan-review-1'], startedAt: at(41, 40), finishedAt: at(41, 41), output: '【Fixture】action: continue；lane: medium；round: 1。缺少最终测试与差异证据，不允许完成。' },
      { id: 'plan-1', role: 'planner', kind: 'plan', title: '拆解问题与验证目标', status: 'completed', attempt: 1, dependsOn: ['jev-classify-1'], startedAt: at(41, 2), finishedAt: at(41, 18), output: '【合成示例】\n1. 并行确认数量变更规则与状态更新路径。\n2. 执行角色等待两项调查完成后，统一修改代码并补齐测试。\n3. 最终产出交给审查角色。\n未读取或修改真实项目。' },
      { id: 'coord-1', role: 'coordinator', kind: 'coordination', title: '细化任务图与依赖', status: 'completed', attempt: 1, dependsOn: ['plan-1'], startedAt: at(41, 19), finishedAt: at(41, 28), output: '【合成示例】确认三个任务：规则研究、代码探索、统一修复。前两项只读工作可并行；修复任务依赖两项调查完成。' },
      { id: 'plan-review-1', role: 'reviewer', kind: 'review', title: '复核可执行方案', status: 'completed', attempt: 1, dependsOn: ['coord-1'], startedAt: at(41, 29), finishedAt: at(41, 40), output: '【合成示例】方案通过：依赖完整，编辑集中在执行角色，验证目标包含数量、库存与金额一致性。' },
      { id: 'research-1', taskId: 'quantity-rules', role: 'researcher', kind: 'task', title: '确认数量与库存规则', status: 'completed', attempt: 1, dependsOn: [], startedAt: at(41, 41), finishedAt: at(42, 10), output: '【合成示例】数量不得小于 1；不能超出可用库存；变更后需同步更新商品小计和总额。' },
      { id: 'explore-1', taskId: 'trace-state', role: 'explorer', kind: 'task', title: '追踪购物车状态更新', status: 'completed', attempt: 1, dependsOn: [], startedAt: at(41, 41), finishedAt: at(42, 18), output: '【合成示例】数量输入变化后，商品小计仍读取旧状态。建议在统一状态更新中重新计算。\n此文字是示例证据，不代表已读取真实项目。' },
      { id: 'work-1', taskId: 'fix-cart', role: 'worker', kind: 'task', title: '修复数量与金额同步', status: 'failed', attempt: 1, dependsOn: ['research-1', 'explore-1'], startedAt: at(42, 19), finishedAt: at(42, 25), error: '【合成示例】模型服务暂时不可用。适配器将此错误标记为可重试；未产生已确认的代码变更。' },
      { id: 'work-2', taskId: 'fix-cart', role: 'worker', kind: 'task', title: '修复数量与金额同步', status: 'running', attempt: 2, dependsOn: ['research-1', 'explore-1'], startedAt: at(42, 26), output: '【合成示例】正在进行第 2 次执行；首次失败记录保留在独立节点。\n所有任务完成后才会建立最终审查节点。此示例未调用任何模型。' },
    ],
    edges: [
      { id: 'e-jev-classify', from: 'jev-classify-1', to: 'plan-1', kind: 'dispatch' },
      { id: 'e-jev-step', from: 'plan-review-1', to: 'jev-step-1', kind: 'dispatch' },
      { id: 'e-jev-dispatch', from: 'jev-step-1', to: 'work-1', kind: 'dispatch' },
      { id: 'e1', from: 'plan-1', to: 'coord-1', kind: 'dispatch' },
      { id: 'e2', from: 'coord-1', to: 'plan-review-1', kind: 'join' },
      { id: 'e3', from: 'coord-1', to: 'research-1', kind: 'dispatch' },
      { id: 'e4', from: 'plan-review-1', to: 'research-1', kind: 'dispatch' },
      { id: 'e5', from: 'coord-1', to: 'explore-1', kind: 'dispatch' },
      { id: 'e6', from: 'plan-review-1', to: 'explore-1', kind: 'dispatch' },
      { id: 'e7', from: 'coord-1', to: 'work-1', kind: 'dispatch' },
      { id: 'e8', from: 'plan-review-1', to: 'work-1', kind: 'dispatch' },
      { id: 'e9', from: 'research-1', to: 'work-1', kind: 'dependency' },
      { id: 'e10', from: 'explore-1', to: 'work-1', kind: 'dependency' },
      { id: 'e11', from: 'work-1', to: 'work-2', kind: 'retry' },
      { id: 'e12', from: 'research-1', to: 'work-2', kind: 'dependency' },
      { id: 'e13', from: 'explore-1', to: 'work-2', kind: 'dependency' },
    ],
    events: [
      { seq: 1, at: at(41), type: 'node_started', nodeId: 'plan-1', message: '规划角色拆解目标与验证条件' },
      { seq: 2, at: at(41, 28), type: 'node_completed', nodeId: 'coord-1', message: '协调者细化任务图，明确三项任务与依赖' },
      { seq: 3, at: at(41, 40), type: 'node_completed', nodeId: 'plan-review-1', message: '可执行方案通过复核' },
      { seq: 4, at: at(41, 41), type: 'node_started', nodeId: 'research-1', message: '研究与代码探索并行执行，只读调查开始' },
      { seq: 5, at: at(42, 18), type: 'node_completed', nodeId: 'explore-1', message: '两项调查完成，执行任务的依赖已满足' },
      { seq: 6, at: at(42, 25), type: 'node_failed', nodeId: 'work-1', message: '模型服务临时错误，首次执行失败' },
      { seq: 7, at: at(42, 26), type: 'retry_scheduled', nodeId: 'work-2', message: '创建第 2 次执行节点，达到单任务 1 次重试上限' },
    ],
  };
}
export const TEAM_DEMO = createTeamDemo();
export const teamDemoSnapshot = createTeamDemo;

/** A deterministic playing fixture. No request, tool dispatch or model execution occurs. */
export function playingDemoSnapshot(step = 0, generation = 0): TeamSnapshot {
  const frame = Math.min(8, Math.max(0, step));
  const seed = createTeamDemo();
  const at = (s: number) => new Date(Date.UTC(2026, 9, 11, 9, 30, s)).toISOString();
  const specs = [
    { id: 'classify', role: 'jev', kind: 'jev_classify', title: '判定任务分档', from: 0, to: 1 },
    { id: 'plan', role: 'planner', kind: 'plan', title: '拆解购物车修复目标', from: 1, to: 2 },
    { id: 'coordinate', role: 'coordinator', kind: 'coordination', title: '安排并行调查与验收', from: 2, to: 3 },
    { id: 'research-fast', role: 'researcher', kind: 'task', title: '确认数量变更规则', from: 3, to: 4 },
    { id: 'research-deep', role: 'researcher', kind: 'task', title: '调查库存边界条件', from: 3, to: 4 },
    { id: 'explore', role: 'explorer', kind: 'task', title: '追踪状态更新路径', from: 3, to: 4 },
    { id: 'implement', role: 'worker', kind: 'task', title: '统一修复状态与金额', from: 4, to: 5 },
    { id: 'review', role: 'reviewer', kind: 'review', title: '检查改动与回归覆盖', from: 5, to: 6 },
    { id: 'decide', role: 'jev', kind: 'jev_step', title: '决定下一步验证', from: 6, to: 7 },
    { id: 'verify', role: 'jev', kind: 'verification', title: '宿主独立验证门禁', from: 7, to: 8 },
  ] as const;
  const relations: { from: string; to: string; kind: TeamSnapshot['edges'][number]['kind']; stage: number }[] = [
    { from: 'classify', to: 'plan', kind: 'dispatch', stage: 1 },
    { from: 'plan', to: 'coordinate', kind: 'dispatch', stage: 2 },
    ...['research-fast', 'research-deep', 'explore'].map(to => ({ from: 'coordinate', to, kind: 'dispatch' as const, stage: 3 })),
    ...['research-fast', 'research-deep', 'explore'].map(from => ({ from, to: 'implement', kind: 'dependency' as const, stage: 4 })),
    { from: 'implement', to: 'review', kind: 'dispatch', stage: 5 },
    { from: 'review', to: 'implement', kind: 'feedback', stage: 6 },
    { from: 'review', to: 'decide', kind: 'dispatch', stage: 6 },
    { from: 'decide', to: 'verify', kind: 'dispatch', stage: 7 },
  ];
  const nodes: TeamSnapshot['nodes'] = specs.filter(spec => spec.from <= frame).map(spec => ({ id: spec.id, taskId: spec.id, role: spec.role, kind: spec.kind, title: spec.title, status: frame >= spec.to ? 'completed' : 'running', attempt: 1, dependsOn: relations.filter(edge => edge.to === spec.id && edge.kind !== 'feedback').map(edge => edge.from), startedAt: at(spec.from * 8), ...(frame >= spec.to ? { finishedAt: at(spec.to * 8), output: '【合成演示】这个实例已经结束。此文本不是模型产出，没有读取或修改项目。' } : {}) }));
  const edges = relations.filter(edge => edge.stage <= frame).map(edge => ({ id: `edge-${edge.from}-${edge.to}`, from: edge.from, to: edge.to, kind: edge.kind }));
  const events: TeamSnapshot['events'] = [];
  for (let stage = 0; stage <= frame; stage++) {
    for (const spec of specs.filter(item => item.to === stage)) events.push({ seq: events.length + 1, at: at(stage * 8), type: 'node_completed', nodeId: spec.id, message: `【合成演示】${spec.title}完成` });
    for (const edge of relations.filter(item => item.stage === stage)) events.push({ seq: events.length + 1, at: at(stage * 8), type: 'relation_activated', edgeId: `edge-${edge.from}-${edge.to}`, fromNodeId: edge.from, toNodeId: edge.to, kind: edge.kind, nodeId: edge.to, message: `【合成事件】${edge.kind === 'feedback' ? '审查反馈已交回' : edge.kind === 'dependency' ? '依赖证据交接' : '任务派发'}` });
    for (const spec of specs.filter(item => item.from === stage)) events.push({ seq: events.length + 1, at: at(stage * 8), type: 'node_started', nodeId: spec.id, message: `【合成演示】${spec.title}开始` });
  }
  const decisions: NonNullable<TeamSnapshot['production']>['routing']['decisions'] = nodes.filter(node => node.role !== 'jev').map(node => ({ nodeId: node.id, role: node.role as TeamRole, lane: node.id === 'research-fast' ? 'small' : node.id === 'research-deep' ? 'high' : 'medium', tier: node.id === 'research-fast' ? 'weak' : node.id === 'research-deep' ? 'strong' : 'base', provider: 'preview-fixture', model: node.id === 'research-fast' ? '模拟·轻量研究模型' : node.id === 'research-deep' ? '模拟·深度研究模型' : `模拟·${node.role}基础模型`, reason: node.id === 'research-fast' ? '合成路由：规则查询使用 weak 候选' : node.id === 'research-deep' ? '合成路由：边界分析使用 strong 候选；同岗位不同实例' : '合成路由：标准任务使用启动基础模型' }));
  return { ...seed, id: `playing-fixture-${generation}`, sessionId: 'preview-session', status: frame === 8 ? 'completed' : 'running', message: '播放中的合成工作流。每次前进追加事件；连线只在新增 relation_activated 事件时亮起一次。未运行模型、Jev 或检查。', nodes, edges, events, roles: Object.fromEntries(Object.keys(seed.roles).map(role => [role, { provider: 'preview-fixture', model: `模拟·${role}基础模型` }])) as TeamSnapshot['roles'], startedAt: at(0), observedAt: at(frame * 8), oldestSeq: 1, eventsTruncated: false, ...(frame === 8 ? { finishedAt: at(64) } : {}), limits: { ...seed.limits, concurrency: 3 }, jev: { mode: 'fixture', lane: 'medium', round: frame >= 6 ? 1 : 0, decisions: [...(frame >= 1 ? [{ phase: 'classify', action: 'classify', lane: 'medium' as const, confidence: .93, reason: '【合成演示】先并行调查，后串行编辑。', round: 0, at: at(8), nodeId: 'classify' }] : []), ...(frame >= 7 ? [{ phase: 'step', action: 'verify', lane: 'medium' as const, confidence: .9, reason: '【合成演示】交给独立宿主验证，不以 Jev 建议替代完成证据。', round: 1, at: at(56), nodeId: 'decide' }] : [])], evidence: { checksPassed: frame === 8, scopeOk: frame >= 7, diffAvailable: frame >= 7, verified: frame === 8, reason: frame === 8 ? '【合成证据】所有门禁通过；没有运行真实检查。' : '【合成证据】门禁尚未全部通过。Jev 状态与验证状态分别展示。' } }, production: { budget: { enabled: false, limit: 0, spent: 0, reserved: 0, remaining: null, halted: null, accounting: 'fixture', unknownUsageCalls: 0, physicalCalls: 0 }, routing: { enabled: true, decisions }, jev: { primary: { requestedModel: 'fixture-jev', responseModel: frame ? 'fixture-jev-v3' : undefined, calls: 0, status: 'fixture' }, shadow: { enabled: false, requestedModel: '', calls: 0 } }, trace: { enabled: false, eventCount: events.length, truncated: false } } };
}

/** Explicit fixture payloads for offline UI acceptance, never inferred from an org line. */
export const DEMO_RELATIONS = [
  { id: 'dispatch', label: '派发', from: 'coordinate', to: 'research-fast', kind: 'dispatch' },
  { id: 'dependency', label: '依赖交接', from: 'research-deep', to: 'implement', kind: 'dependency' },
  { id: 'retry', label: '同岗位重试', from: 'research-fast', to: 'research-fast-retry', kind: 'retry' },
  { id: 'cross-role', label: '研究 → 探索', from: 'research-deep', to: 'explore', kind: 'dependency' },
  { id: 'join', label: '探索 → 审查汇合', from: 'explore', to: 'review', kind: 'join' },
  { id: 'feedback', label: '审查反馈', from: 'review', to: 'implement', kind: 'feedback' },
  { id: 'jev', label: 'Jev 决策', from: 'review', to: 'decide', kind: 'dispatch' },
  { id: 'verification', label: '宿主验证', from: 'decide', to: 'verify', kind: 'dispatch' },
] as const;
export type DemoRelationId = typeof DEMO_RELATIONS[number]['id'];

/** Append an actual-shaped event to an already mounted run so it can pulse once. */
export function appendDemoRelation(snapshot: TeamSnapshot, relationId: DemoRelationId): TeamSnapshot {
  const relation = DEMO_RELATIONS.find(item => item.id === relationId)!;
  const complete = playingDemoSnapshot(8);
  const maxSeq = snapshot.events.reduce((highest, event) => Math.max(highest, event.seq), 0);
  const at = new Date(Date.parse(snapshot.observedAt || snapshot.startedAt) + 1000).toISOString();
  const events = [...snapshot.events];
  const nodes = snapshot.nodes.map(node => ({ ...node }));
  const routes = [...(snapshot.production?.routing.decisions || [])];
  const append = (event: Omit<TeamSnapshot['events'][number], 'seq' | 'at'>) => events.push({ ...event, seq: maxSeq + events.length - snapshot.events.length + 1, at });
  for (const nodeId of [relation.from, relation.to]) {
    if (nodes.some(node => node.id === nodeId)) continue;
    const templateId = nodeId === 'research-fast-retry' ? 'research-fast' : nodeId;
    const template = complete.nodes.find(node => node.id === templateId)!;
    const node = { ...template, id: nodeId, dependsOn: [], status: 'pending' as const, startedAt: undefined, finishedAt: undefined, output: undefined, ...(nodeId === 'research-fast-retry' ? { attempt: 2, title: '重新确认数量变更规则', dependsOn: ['research-fast'] } : {}) };
    nodes.push(node);
    const route = complete.production?.routing.decisions.find(item => item.nodeId === templateId);
    if (route) routes.push({ ...route, nodeId, at, reason: nodeId === 'research-fast-retry' ? '合成路由：该重试实例明确沿用轻量研究模型，未借用同岗位的深度模型记录。' : route.reason });
  }
  // A finished Jev decision cannot remain spinning when host verification begins.
  if (relationId === 'jev' || relationId === 'verification') {
    for (const node of nodes) if (node.role === 'jev' && node.status === 'running') {
      node.status = 'completed'; node.finishedAt = at;
      append({ type: 'node_completed', nodeId: node.id, message: `【合成演示】${node.title}完成` });
    }
  }
  const source = nodes.find(node => node.id === relation.from)!;
  source.status = relationId === 'retry' ? 'failed' : 'completed';
  source.startedAt ||= at;
  source.finishedAt = at;
  if (relationId === 'retry') {
    source.failureCode = 'FIXTURE_RETRYABLE'; source.error = '【合成错误】一次性临时错误，创建独立重试实例。';
    append({ type: 'node_failed', nodeId: source.id, failureCode: source.failureCode, message: source.error });
  }
  const target = nodes.find(node => node.id === relation.to)!;
  target.status = 'running'; target.startedAt = at; target.finishedAt = undefined; target.output = undefined;
  if (relation.kind !== 'feedback' && !target.dependsOn.includes(source.id)) target.dependsOn = [...target.dependsOn, source.id];
  target.error = undefined; target.failureCode = undefined;
  const edge = { id: `fixture-${relation.id}-${relation.from}-${relation.to}`, from: relation.from, to: relation.to, kind: relation.kind };
  const edges = [...snapshot.edges.filter(item => item.id !== edge.id), edge];
  append({ type: 'relation_activated', edgeId: edge.id, fromNodeId: edge.from, toNodeId: edge.to, nodeId: edge.to, kind: edge.kind, message: `【合成事件】${relation.label}：${edge.from} → ${edge.to}` });
  append({ type: 'node_started', nodeId: target.id, message: `【合成演示】${target.title}开始` });
  const jev = snapshot.jev && { ...snapshot.jev, decisions: [...snapshot.jev.decisions] };
  if (jev && relationId === 'verification') {
    jev.decisions = [...jev.decisions.filter(item => item.nodeId !== 'decide'), { phase: 'step', action: 'verify', lane: 'medium', confidence: .9, reason: '【合成演示】Jev 决策已经完成；宿主独立验证仍在执行，未报告完成证据。', round: 1, at, nodeId: 'decide' }];
    jev.evidence = { checksPassed: false, scopeOk: true, diffAvailable: true, verified: false, reason: '【合成证据】独立宿主检查进行中，不属于岗位模型或 Jev 决策。' };
  }
  return { ...snapshot, status: 'running', finishedAt: undefined, failureCode: undefined, nodes, edges, events, observedAt: at, jev,
    limits: { ...snapshot.limits, concurrency: Math.max(snapshot.limits.concurrency, nodes.filter(node => node.status === 'running').length) },
    message: `【离线合成事件】${relation.label}。仅追加 fixture 状态，没有调用模型、宿主或 TypeSafe。`,
    production: snapshot.production ? { ...snapshot.production, routing: { ...snapshot.production.routing, decisions: routes }, trace: { ...snapshot.production.trace, eventCount: events.length } } : undefined };
}

export type DemoTerminalStatus = 'completed' | 'unverified' | 'blocked' | 'failed' | 'cancelled';
/** All terminal states stop activity, including snapshots that previously had live nodes. */
export function terminalDemoSnapshot(status: DemoTerminalStatus, generation = 0): TeamSnapshot {
  const snapshot = playingDemoSnapshot(status === 'completed' ? 8 : 3, generation);
  if (status === 'completed') return snapshot;
  const finishedAt = '2026-10-11T09:30:40.000Z';
  const failureCode = status === 'blocked' ? 'STEP_LIMIT' : status === 'failed' ? 'FIXTURE_PROVIDER_FAILURE' : undefined;
  const message = status === 'blocked' ? '执行达到步数上限，本次运行已阻塞。' : status === 'failed' ? '模拟提供方不可恢复错误，本次运行失败。' : status === 'cancelled' ? '用户在离线预览中停止本次合成运行。' : '已有合成产出，但缺少独立验证，不能显示完成。';
  const nodes = snapshot.nodes.map(node => node.status !== 'running' ? node : { ...node, status: status === 'unverified' ? 'completed' as const : status, failureCode, finishedAt, ...(failureCode ? { error: `【合成错误】${message}` } : {}) });
  return { ...snapshot, status, nodes, failureCode, finishedAt, observedAt: finishedAt, message: `【合成演示】${message}`, events: [...snapshot.events, { seq: snapshot.events.at(-1)!.seq + 1, at: finishedAt, type: `run_${status}`, message: `【合成演示】${message}`, ...(failureCode ? { failureCode } : {}) }] };
}
