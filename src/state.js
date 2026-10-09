import { open, lstat } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

const states = new Set(['running', 'completed', 'blocked', 'skipped', 'failed', 'pending']);
const stages = ['plan', 'work', 'tests', 'review', 'done'];
const text = (value, max = 2000) => typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/g, '').slice(0, max) : '';
export const waiting = (notice = '尚未配置状态文件；不会调用模型或执行任务。') => ({ mode: 'waiting', title: '等待工作流', status: 'pending', stage: 'waiting', jev: null, stages: [], sourceNotice: notice });
export function normalizeRun(run) {
  if (!run || typeof run !== 'object' || Array.isArray(run) || typeof run.id !== 'string' || typeof run.goal !== 'string' || !Array.isArray(run.stages)) throw new Error('Not a CliWorkflowStore run JSON');
  const decision = run.decision;
  const jev = decision && typeof decision === 'object' ? {
    model: text(decision.model, 120), effectiveRoute: text(decision.effectiveRoute, 80),
    confidence: Number.isFinite(decision.confidence) && decision.confidence >= 0 && decision.confidence <= 1 ? decision.confidence : undefined,
    probabilities: Object.fromEntries(['execute','plan_review','clarify'].flatMap(k => Number.isFinite(decision.probabilities?.[k]) && decision.probabilities[k] >= 0 && decision.probabilities[k] <= 1 ? [[k, decision.probabilities[k]]] : [])),
  } : null;
  const normalized = stages.flatMap(stage => {
    const entry = run.stages.find(s => s && s.stage === stage);
    return entry ? [{ stage, status: states.has(entry.status) ? entry.status : 'pending', summary: text(entry.summary), time: text(entry.time, 60), evidence: Array.isArray(entry.evidence) ? entry.evidence.slice(0,20).map(e => text(e)) : [] }] : [];
  });
  return { mode: 'live', routingStatus: ['running','completed','failed'].includes(run.routing) ? run.routing : 'pending', runId: text(run.id, 100), executionMode: run.mode === 'inspect' ? 'inspect' : run.mode === 'edit' ? 'edit' : undefined, title: text(run.goal, 4000), status: states.has(run.status) ? run.status : 'pending', stage: ['running','failed'].includes(run.routing) ? 'jev-routing' : normalized.find(s => s.status === 'running')?.stage || normalized.at(-1)?.stage || 'waiting', jev, stages: normalized, updatedAt: text([run.finishedAt, ...normalized.map(s => s.time), run.routedAt, run.startedAt].filter(t => Number.isFinite(Date.parse(t))).sort((a,b) => Date.parse(b)-Date.parse(a))[0], 60), sourceNotice: '已保存的 Jev/MCP 状态 · 阶段由 CLI 报告，未经本插件独立复验；本插件不调用模型。' };
}
export async function readSnapshot(stateFile) {
  if (!stateFile) return waiting();
  if (!path.isAbsolute(stateFile)) throw new Error('stateFile must be an explicit absolute path');
  // Bound reads even if a producer accidentally writes an oversized file.
  const info = await lstat(stateFile);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error('State file must be a regular JSON file, not a symlink');
  const file = await open(stateFile, constants.O_RDONLY | (constants.O_NONBLOCK || 0) | (constants.O_NOFOLLOW || 0));
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > 1024 * 1024) throw new Error('State file must be a regular JSON file at most 1 MiB');
    const buffer = Buffer.alloc(1024 * 1024 + 1);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    if (bytesRead > 1024 * 1024) throw new Error('State file exceeds 1 MiB');
    return normalizeRun(JSON.parse(buffer.subarray(0, bytesRead).toString('utf8')));
  } finally { await file.close(); }
}
