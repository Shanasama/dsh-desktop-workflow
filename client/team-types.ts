export type TeamRole = 'planner' | 'coordinator' | 'researcher' | 'explorer' | 'worker' | 'reviewer' | 'router';
export type RequiredTeamRole = Exclude<TeamRole, 'router'>;
export interface TeamModelSelection {
  provider: string;
  model: string;
  reasoningEffort?: string;
  maxTokens?: number;
}
export interface TeamLimits {
  concurrency: number;
  maxAgents: number;
  maxTasks: number;
  maxRetries: number;
  maxDurationMs: number;
  maxStepsPerAgent: number;
}
export interface TeamSettings {
  roles: Record<RequiredTeamRole, TeamModelSelection> & { router?: TeamModelSelection };
  limits: TeamLimits;
  reviewPlan: boolean;
  routeEnabled: boolean;
}
export interface TeamCatalog {
  providers: {
    id: string;
    name: string;
    models: { id: string; name: string; efforts?: { id: string; name: string }[]; defaultEffort?: string }[];
  }[];
  available: boolean;
  reason?: string;
}
export type TeamNodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'blocked' | 'cancelled';
export type TeamRunStatus = 'planning' | 'running' | 'reviewing' | 'completed' | 'blocked' | 'failed' | 'cancelled';
export interface TeamNode {
  id: string;
  taskId?: string;
  role: TeamRole;
  kind: 'plan' | 'coordination' | 'task' | 'review' | 'route';
  title: string;
  status: TeamNodeStatus;
  attempt: number;
  dependsOn: string[];
  childId?: string;
  output?: string;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
}
export interface TeamEdge {
  id: string;
  from: string;
  to: string;
  kind: 'dispatch' | 'dependency' | 'feedback' | 'retry' | 'join';
}
export interface TeamEvent {
  seq: number;
  at: string;
  type: string;
  nodeId?: string;
  message: string;
}
export interface TeamSnapshot {
  id: string;
  sessionId: string;
  goal: string;
  status: TeamRunStatus;
  roles: TeamSettings['roles'];
  nodes: TeamNode[];
  edges: TeamEdge[];
  events: TeamEvent[];
  limits: TeamLimits;
  startedAt: string;
  finishedAt?: string;
  message?: string;
  demo?: boolean;
}
export interface TeamSessionContext {
  contextKey?: string;
  workspace?: string;
  permissionNotice?: string;
  canStart?: boolean;
  reason?: string;
}
export interface TeamViewProps {
  catalog: TeamCatalog;
  sessionId: string | undefined;
  sessionContext?: TeamSessionContext;
  snapshot: TeamSnapshot | null;
  loading?: boolean;
  error?: string;
  onStart: (input: { goal: string; settings: TeamSettings }) => void | Promise<void>;
  onCancel: () => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
  onDemo: () => void;
  settings: TeamSettings;
  onSettingsChange: (settings: TeamSettings) => void;
}
export function createDefaultTeamSettings(): TeamSettings {
  return {
    roles: {
      planner: { provider: '', model: '', maxTokens: 4096 }, coordinator: { provider: '', model: '', maxTokens: 4096 },
      researcher: { provider: '', model: '', maxTokens: 4096 }, explorer: { provider: '', model: '', maxTokens: 4096 },
      worker: { provider: '', model: '', maxTokens: 4096 }, reviewer: { provider: '', model: '', maxTokens: 4096 },
    },
    limits: { concurrency: 2, maxAgents: 12, maxTasks: 8, maxRetries: 1, maxDurationMs: 600000, maxStepsPerAgent: 8 },
    reviewPlan: true,
    routeEnabled: false,
  };
}
