import { createDefaultTeamSettings, type TeamRole, type TeamSnapshot } from './team-types';

/** Static synthetic records matching the implemented controller; never starts an agent. */
export function createTeamDemo(): TeamSnapshot {
  const settings = createDefaultTeamSettings();
  const demoModels: Record<Exclude<TeamRole, 'router'>, string> = {
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
    message: '合成示例：方案复核后，研究与代码探索并行；执行遇到临时错误后进行有界重试。',
    nodes: [
      { id: 'plan-1', role: 'planner', kind: 'plan', title: '拆解问题与验证目标', status: 'completed', attempt: 1, dependsOn: [], startedAt: at(41), finishedAt: at(41, 18), output: '【合成示例】\n1. 并行确认数量变更规则与状态更新路径。\n2. 执行角色等待两项调查完成后，统一修改代码并补齐测试。\n3. 最终产出交给审查角色。\n未读取或修改真实项目。' },
      { id: 'coord-1', role: 'coordinator', kind: 'coordination', title: '细化任务图与依赖', status: 'completed', attempt: 1, dependsOn: ['plan-1'], startedAt: at(41, 19), finishedAt: at(41, 28), output: '【合成示例】确认三个任务：规则研究、代码探索、统一修复。前两项只读工作可并行；修复任务依赖两项调查完成。' },
      { id: 'plan-review-1', role: 'reviewer', kind: 'review', title: '复核可执行方案', status: 'completed', attempt: 1, dependsOn: ['coord-1'], startedAt: at(41, 29), finishedAt: at(41, 40), output: '【合成示例】方案通过：依赖完整，编辑集中在执行角色，验证目标包含数量、库存与金额一致性。' },
      { id: 'research-1', taskId: 'quantity-rules', role: 'researcher', kind: 'task', title: '确认数量与库存规则', status: 'completed', attempt: 1, dependsOn: [], startedAt: at(41, 41), finishedAt: at(42, 10), output: '【合成示例】数量不得小于 1；不能超出可用库存；变更后需同步更新商品小计和总额。' },
      { id: 'explore-1', taskId: 'trace-state', role: 'explorer', kind: 'task', title: '追踪购物车状态更新', status: 'completed', attempt: 1, dependsOn: [], startedAt: at(41, 41), finishedAt: at(42, 18), output: '【合成示例】数量输入变化后，商品小计仍读取旧状态。建议在统一状态更新中重新计算。\n此文字是示例证据，不代表已读取真实项目。' },
      { id: 'work-1', taskId: 'fix-cart', role: 'worker', kind: 'task', title: '修复数量与金额同步', status: 'failed', attempt: 1, dependsOn: ['research-1', 'explore-1'], startedAt: at(42, 19), finishedAt: at(42, 25), error: '【合成示例】模型服务暂时不可用。适配器将此错误标记为可重试；未产生已确认的代码变更。' },
      { id: 'work-2', taskId: 'fix-cart', role: 'worker', kind: 'task', title: '修复数量与金额同步', status: 'running', attempt: 2, dependsOn: ['research-1', 'explore-1'], startedAt: at(42, 26), output: '【合成示例】正在进行第 2 次执行；首次失败记录保留在独立节点。\n所有任务完成后才会建立最终审查节点。此示例未调用任何模型。' },
    ],
    edges: [
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
