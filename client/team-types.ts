export type TeamRole = 'planner' | 'coordinator' | 'researcher' | 'explorer' | 'worker' | 'reviewer';
export type RequiredTeamRole = TeamRole;
export type TeamNodeRole = TeamRole | 'jev';
export type JevLane = 'small' | 'medium' | 'high' | 'escalate';
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
  maxRounds: number;
  maxJevCalls: number;
}
export interface TeamSettings {
  roles: Record<TeamRole, TeamModelSelection>;
  limits: TeamLimits;
  reviewPlan: boolean;
}
export interface TeamVerificationProfile {
  id: string;
  name: string;
  checks?: { id: string; argv: string[]; timeoutMs: number }[];
  protectedPaths?: string[];
  expectsChanges?: boolean;
}
export interface TeamCatalog {
  jev?: { configured: boolean; available: boolean; mode?: 'live' | 'fixture'; reason?: string; endpoint: string; disclosure: string };
  verificationProfiles?: TeamVerificationProfile[];
  providers: {
    id: string;
    name: string;
    models: { id: string; name: string; efforts?: { id: string; name: string }[]; defaultEffort?: string }[];
  }[];
  available: boolean;
  reason?: string;
}
export type TeamNodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'blocked' | 'cancelled';
export type TeamRunStatus = 'planning' | 'running' | 'reviewing' | 'completed' | 'unverified' | 'blocked' | 'failed' | 'cancelled';
export interface TeamNode {
  id: string;
  taskId?: string;
  role: TeamNodeRole;
  kind: 'plan' | 'coordination' | 'task' | 'review' | 'jev_classify' | 'jev_step' | 'verification';
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
export interface JevState {
  lane: JevLane;
  round: number;
  decisions: { phase: string; action: string; lane: JevLane; confidence: number; reason: string; round: number }[];
  evidence?: { checksPassed: boolean; scopeOk: boolean; diffAvailable: boolean; verified: boolean; reason: string };
  mode: 'live' | 'fixture';
}
export interface TeamSnapshot {
  diagnostic?:TeamDiagnostic;
  lifecycle?:string;
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
  jev?: JevState;
}
export interface TeamDiagnostic {phase:string;reason:string;code:string;kind:string;exitCode?:number;at:string}
export type TeamHistory = Pick<TeamSnapshot,'id'|'sessionId'|'goal'|'status'|'startedAt'|'finishedAt'>;
export interface TeamSessionContext {
  sessionId?:string;
  diagnostic?:TeamDiagnostic;
  occupancy?:{sessionId:string;runId?:string;state:string;workspace?:string;legacy?:boolean;scopeKnown?:boolean;diagnostic?:TeamDiagnostic};
  contextKey?: string;
  workspace?: string;
  permissionNotice?: string;
  canStart?: boolean;
  reason?: string;
  setupRequired?: boolean;
}
export interface TeamSetup {
  settings: TeamSettings;
  configured: boolean;
  keyConfigured: boolean;
  disclosureAccepted: boolean;
  revision: number;
  writable?: boolean;
}
export interface CredentialStatus { configured: boolean; writable: boolean; source?: string }
export interface TeamSettingsInput { settings: TeamSettings; disclosureAccepted: boolean; jevKey?: string }
export interface TeamSettingsViewProps {
  setup: TeamSetup;
  catalog: TeamCatalog;
  credential?: CredentialStatus;
  loading?: boolean;
  saving?: boolean;
  error?: string;
  notice?: string;
  onSave: (input: TeamSettingsInput) => Promise<void>;
  onModelSelectionChange?: (roles: TeamSettings['roles']) => void;
  onClose: () => void;
  onRefresh: () => void;
}
export interface TeamViewProps {
  catalog: TeamCatalog;
  history?:TeamHistory[];
  selectedRunId?:string;
  onSelectRun?:(runId:string|undefined)=>void;
  sessionId: string | undefined;
  sessionContext?: TeamSessionContext;
  snapshot: TeamSnapshot | null;
  loading?: boolean;
  error?: string;
  configured?: boolean;
  onOpenSettings: () => void;
  onCancel: () => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
  onDemo: () => void;
  settings: TeamSettings;
}
export function createDefaultTeamSettings(): TeamSettings {
  return {
    roles: {
      planner: { provider: '', model: '', maxTokens: 4096 }, coordinator: { provider: '', model: '', maxTokens: 4096 },
      researcher: { provider: '', model: '', maxTokens: 4096 }, explorer: { provider: '', model: '', maxTokens: 4096 },
      worker: { provider: '', model: '', maxTokens: 4096 }, reviewer: { provider: '', model: '', maxTokens: 4096 },
    },
    limits: { concurrency: 2, maxAgents: 12, maxTasks: 8, maxRetries: 1, maxDurationMs: 600000, maxStepsPerAgent: 8, maxRounds: 4, maxJevCalls: 10 },
    reviewPlan: true,
  };
}
