import type { TeamEdge, TeamEvent, TeamModelSelection, TeamNode, TeamRoutingDecision, TeamRunStatus, TeamSnapshot } from './team-types';

export interface NodeModelResolution {
  selection: TeamModelSelection;
  source: 'routing' | 'startup-base';
  label: string;
  decision?: TeamRoutingDecision;
}

/** A role's latest dispatch is not evidence of the model used by a different node. */
export function resolveNodeModel(snapshot: Pick<TeamSnapshot, 'roles' | 'production'> | null | undefined, node: TeamNode): NodeModelResolution | undefined {
  if (!snapshot || node.role === 'jev' || node.kind === 'verification' || node.kind === 'jev_classify' || node.kind === 'jev_step') return undefined;
  const decision = snapshot.production?.routing.decisions.filter(item => item.nodeId === node.id).at(-1);
  if (decision) return { selection: { provider: decision.provider, model: decision.model }, source: 'routing', label: '本节点选定模型', decision };
  const selection = snapshot.roles[node.role];
  return selection ? { selection, source: 'startup-base', label: '启动时基础配置，未报告本节点选择' } : undefined;
}

export interface LiveDisplayState {
  visible: boolean;
  stale: boolean;
}

const ACTIVE_RUNS = new Set<TeamRunStatus>(['planning', 'running', 'reviewing']);

/** Running status alone cannot imply present activity in an old or hidden snapshot. */
export function shouldAnimateNode(node: TeamNode, runStatus: TeamRunStatus, display: LiveDisplayState): boolean {
  return display.visible && !display.stale && ACTIVE_RUNS.has(runStatus) && node.status === 'running'
    && node.kind !== 'verification'
    && (node.role !== 'jev' || node.kind === 'jev_classify' || node.kind === 'jev_step');
}

export interface RelationEvent extends TeamEvent {
  type: 'relation_activated';
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  kind: TeamEdge['kind'];
  runId?: string;
}

export interface RelationCursorOptions extends LiveDisplayState {
  /** Increment for an explicit refresh, not for each successful polling response. */
  revision?: number;
}

export interface RelationCursor extends LiveDisplayState {
  runId: string;
  /** High-water sequence for this run. It never moves backwards on an old response. */
  seq: number;
  revision: number;
  /** Retain watermarks when switching away and back to a run in the same view. */
  highWaterByRun: Readonly<Record<string, number>>;
  /** Keep a discovered history gap visible until the user changes runs. */
  notice?: string;
}

export interface RelationCursorResult {
  cursor: RelationCursor | null;
  events: RelationEvent[];
  baseline: boolean;
  notice?: string;
}

type RelationSnapshot = Pick<TeamSnapshot, 'id' | 'events' | 'edges'> & {
  observedAt?: string;
  eventsTruncated?: boolean;
  oldestSeq?: number;
};

type EventPayload = TeamEvent & Partial<Pick<RelationEvent, 'edgeId' | 'fromNodeId' | 'toNodeId' | 'kind' | 'runId'>>;
const RELATION_KINDS = new Set<TeamEdge['kind']>(['dispatch', 'dependency', 'feedback', 'retry', 'join']);
const INCOMPLETE = '事件历史不完整或已截断；缺失的关系不会补播。';
const DISCONTINUOUS = '事件序列有缺失，已重新建立实时基线；历史关系不会补播。';
const REGRESSED = '事件序列回退，已保留实时基线；旧事件不会重播。';

function isSequence(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function validRelation(event: EventPayload, snapshot: RelationSnapshot): event is RelationEvent {
  return event.type === 'relation_activated'
    && (event.runId === undefined || event.runId === snapshot.id)
    && typeof event.edgeId === 'string' && event.edgeId.length > 0
    && typeof event.fromNodeId === 'string' && typeof event.toNodeId === 'string'
    && event.kind !== undefined && RELATION_KINDS.has(event.kind)
    && snapshot.edges.some(edge => edge.id === event.edgeId && edge.from === event.fromNodeId && edge.to === event.toNodeId && edge.kind === event.kind);
}

/**
 * Consume the complete event stream, returning only new, explicit, edge-validated
 * relation activations. Call even while hidden/stale so those intervals are consumed.
 * Keep the returned cursor outside the render pass and replace it after each call.
 * No status change, dependency, or added edge can manufacture an activation.
 */
export function advanceRelationCursor(previous: RelationCursor | null | undefined, snapshot: RelationSnapshot | null | undefined, options: RelationCursorOptions): RelationCursorResult {
  // Refresh/navigation can temporarily clear the snapshot. Keep every run's
  // watermark, but require a new baseline when a snapshot becomes available.
  if (!snapshot) return { cursor: previous ? { ...previous, visible: false } : null, events: [], baseline: true };

  const sameRun = previous?.runId === snapshot.id;
  const revision = options.revision ?? 0;
  const previousSeq = sameRun ? previous.seq : previous?.highWaterByRun && Object.hasOwn(previous.highWaterByRun, snapshot.id) ? previous.highWaterByRun[snapshot.id] : 0;
  const bySequence = new Map<number, EventPayload>();
  let malformedSequence = false;
  for (const event of snapshot.events) {
    if (!isSequence(event.seq)) { malformedSequence = true; continue; }
    // Deduplicate by run + sequence, irrespective of which event type it carries.
    if (!bySequence.has(event.seq)) bySequence.set(event.seq, event);
  }
  const ordered = [...bySequence.values()].sort((a, b) => a.seq - b.seq);
  const latestSeq = ordered.at(-1)?.seq ?? 0;
  const oldestSeq = isSequence(snapshot.oldestSeq) ? snapshot.oldestSeq : ordered[0]?.seq;
  const historyGap = ordered.some((event, index) => index > 0 && event.seq !== ordered[index - 1].seq + 1);
  const newEvents = ordered.filter(event => event.seq > previousSeq);
  const newGap = newEvents.some((event, index) => event.seq !== (index === 0 ? previousSeq : newEvents[index - 1].seq) + 1);
  const missedWindow = sameRun && oldestSeq !== undefined && oldestSeq > previousSeq + 1;
  const regressed = sameRun && latestSeq < previousSeq;
  let notice = sameRun ? previous.notice : undefined;
  if (snapshot.eventsTruncated || (oldestSeq ?? 1) > 1 || (ordered[0]?.seq ?? 1) > 1 || historyGap) notice = INCOMPLETE;
  if (malformedSequence || (sameRun && newGap) || missedWindow) notice = DISCONTINUOUS;
  if (regressed) notice = REGRESSED;

  const baseline = !sameRun || previous.revision !== revision || !options.visible || options.stale
    || !previous.visible || previous.stale || regressed || malformedSequence || newGap || missedWindow;
  const seq = Math.max(previousSeq, latestSeq, (oldestSeq ?? 1) - 1);
  const cursor: RelationCursor = {
    runId: snapshot.id,
    seq,
    visible: options.visible,
    stale: options.stale,
    revision,
    highWaterByRun: { ...previous?.highWaterByRun, [snapshot.id]: seq },
    ...(notice ? { notice } : {}),
  };
  return { cursor, events: baseline ? [] : newEvents.filter(event => validRelation(event, snapshot)), baseline, ...(notice ? { notice } : {}) };
}
