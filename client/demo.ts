import type { Snapshot, WorkflowStage, WorkflowStatus } from './WorkflowView';

export type DemoPreset = 'running' | 'review' | 'approval' | 'completed' | 'failed' | 'pending' | 'waiting' | 'stale';

/** Deterministic fixture only. These events never describe a real project or model call. */
export function demoSnapshot(preset: DemoPreset | number = 'running'): Snapshot {
  const presets: DemoPreset[] = ['running', 'review', 'approval', 'completed', 'failed', 'pending', 'waiting', 'stale'];
  const selected = typeof preset === 'number' ? presets[Math.abs(Math.floor(preset)) % presets.length] : preset;
  const activeStage = selected === 'review' || selected === 'approval' ? 'review' : selected === 'completed' ? 'done' : selected === 'pending' ? 'plan' : 'tests';
  const keys = ['plan', 'work', 'tests', 'review', 'done'];
  const activeIndex = keys.indexOf(activeStage);
  const summaries: Record<string, string> = {
    plan: '定位购物车数量更新问题，复现边界情况，并制定回归检查方案。',
    work: '更新数量时同步购物车状态与商品合计，保持现有结算行为不变。',
    tests: '正在使用模拟回归样例检查数量更新与购物车合计。',
    review: '对照方案、报告的测试结果和结算边界复核变更。',
    done: '模拟工作流已到达最后阶段，可以查看报告的结果。',
  };
  const evidence: Record<string, string[]> = {
    plan: ['模拟证据 · 复现：数量从 1 改为 2 后，商品合计未更新。', '模拟证据 · 范围：购物车状态更新与数量回归样例。'],
    work: ['模拟证据 · 变更样例：src/cart/updateQuantity.ts', '模拟证据 · 新增样例：tests/cart-quantity.test.ts', '模拟证据 · 未修改任何真实文件。'],
    tests: ['模拟证据 · 回归样例：更新数量后重新计算商品合计。', '模拟证据 · 边界样例：数量不得小于 1。', '模拟证据 · 结算样例正在进行中，不代表真实执行的测试结果。'],
    review: ['模拟证据 · 复核清单：变更范围、回归覆盖与结算行为。', '模拟证据 · 复核意见仅为样例文本，未经独立复核。'],
    done: ['模拟证据 · 仅展示完成状态，未执行任何真实运行。'],
  };
  const stages: WorkflowStage[] = keys.map((stage, index) => {
    let status: WorkflowStatus = index < activeIndex ? 'completed' : index === activeIndex ? 'running' : 'pending';
    if (selected === 'completed') status = 'completed';
    if (selected === 'pending' || selected === 'waiting') status = 'pending';
    if (index === activeIndex && selected === 'failed') status = 'failed';
    if (index === activeIndex && selected === 'review') status = 'review';
    if (index === activeIndex && selected === 'approval') status = 'approval';
    const hasActivity = status !== 'pending';
    return {
      stage, status,
      summary: hasActivity ? (stage === 'tests' && selected === 'failed' ? '模拟回归失败：数量变化后，购物车小计未更新。' : stage === 'tests' && status === 'completed' ? '模拟测试阶段已完成，样例结果不代表真实执行的测试结果。' : stage === 'review' && selected === 'approval' ? '模拟复核正等待在来源应用中批准。' : summaries[stage]) : '',
      time: hasActivity ? `2026-10-09T11:${String(2 + index * 2).padStart(2, '0')}:18Z` : '',
      evidence: hasActivity ? (stage === 'tests' && status === 'completed' ? evidence[stage].map(item => item.includes('正在进行中') ? '模拟证据 · 结算样例已完成，不代表真实执行的测试结果。' : item) : stage === 'tests' && status === 'failed' ? ['模拟证据 · 回归样例失败：小计未更新。', '模拟证据 · 仅展示失败状态，未执行测试进程。'] : evidence[stage]) : [],
      origin: '演示数据',
    };
  });
  return {
    mode: 'demo',
    runId: `synthetic-cart-quantity-${selected}`,
    title: '修复购物车数量更新问题',
    status: selected === 'completed' ? 'completed' : selected === 'failed' ? 'failed' : selected === 'pending' ? 'pending' : selected === 'waiting' ? 'waiting' : selected === 'approval' ? 'approval' : selected === 'review' ? 'review' : 'running',
    stage: selected === 'waiting' ? 'waiting' : activeStage,
    jev: selected === 'waiting' ? null : { model: 'fixture / synthetic', effectiveRoute: 'plan_review', confidence: 0.84, probabilities: { execute: 0.11, plan_review: 0.84, clarify: 0.05 } },
    stages,
    updatedAt: selected === 'stale' ? '2026-10-08T11:06:18Z' : `2026-10-09T11:${String(2 + activeIndex * 2).padStart(2, '0')}:18Z`,
    sourceNotice: '演示 · 全部为模拟数据。未使用凭据、调用模型、执行任务或更改项目。',
    origin: '演示数据',
    stale: selected === 'stale',
  };
}
