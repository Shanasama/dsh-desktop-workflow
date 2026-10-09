/**
 * Fork addition (not upstream). Upstream can only start a team from the browser panel:
 * the six role models live in browser storage and never reach the host, so no chat command
 * or tool could start a run. This module is the server-side start path behind the plugin's
 * `run_team` tool, so a user who configured the panel once can start a run by asking for
 * it in chat, in whatever workspace that chat is already in.
 *
 * Trust shape, unchanged from the panel path:
 * - The goal is the only free text. Model, roles, limits, Jev endpoint and the verification
 *   profile all come from trusted server configuration — a chat message cannot invent them.
 * - The workspace is the caller's own session cwd. A tool call cannot pick another directory.
 * - TypeSafe disclosure stays an explicit server-side switch; the tool reports it instead of
 *   silently deciding it.
 * - The parent session must be idle and root; the host adapter re-checks all of it.
 */
import { TeamHostError } from './host-adapter.js';

const MAX_GOAL = 8000;
const ROLES = ['planner', 'coordinator', 'researcher', 'explorer', 'worker', 'reviewer'];

/** Same defaults the panel uses, so a tool run and a panel run are the same shape. */
export const DEFAULT_LIMITS = {
  concurrency: 2, maxAgents: 12, maxTasks: 8, maxRetries: 1,
  maxDurationMs: 600000, maxStepsPerAgent: 8, maxRounds: 4, maxJevCalls: 10,
};

const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/**
 * A role's model, written as `"provider/model"` in the config form (the legacy
 * `{provider, model}` object is still accepted). Returns undefined when the entry is
 * absent or unusable, so the caller can fall through to its own default.
 */
export function parseModel(value) {
  if (!value) return undefined;
  if (typeof value === 'object') {
    const provider = clean(value.provider, 120);
    const model = clean(value.model, 160);
    if (!provider || !model) return undefined;
    return { provider, model, ...(clean(value.reasoningEffort, 32) ? { reasoningEffort: clean(value.reasoningEffort, 32) } : {}), ...(Number.isInteger(value.maxTokens) ? { maxTokens: value.maxTokens } : {}) };
  }
  const text = clean(value, 300);
  const slash = text.indexOf('/');
  if (slash <= 0 || slash === text.length - 1) return undefined;
  return { provider: text.slice(0, slash), model: text.slice(slash + 1) };
}

/** Resolve every role: its own entry, then `default`, then the caller's own model. */
export function resolveRoles(configured, fallback) {
  const models = configured && typeof configured === 'object' ? configured : {};
  const common = parseModel(models.default) ?? fallback;
  if (!common) throw new TeamHostError('MODEL_UNAVAILABLE', '未配置模型。请在侧栏「插件」→ desktop-workflow 的配置里填 models.default，写成「提供方/模型」。');
  return Object.fromEntries(ROLES.map(role => [role, { ...(parseModel(models[role]) ?? common) }]));
}

/**
 * Resolve the run configuration from trusted server config plus the calling Agent.
 * `fallbackModel` is the model this Agent is already using, so a single `models.default`
 * entry (or none at all) is enough for a first useful run.
 */
export function buildRunConfig({ goal, fallbackModel, verification, serverConfig = {} } = {}) {
  const text = clean(goal, MAX_GOAL);
  if (!text) throw new TeamHostError('GOAL_REQUIRED', '请在指令里说明目标，例如：用团队在当前工作区实现登录页验证码。');
  if (/[\u202A-\u202E\u2066-\u2069]/.test(text)) throw new TeamHostError('GOAL_INVALID', '目标包含不可见的方向控制字符，已拒绝。');
  const roles = resolveRoles(serverConfig.models, fallbackModel);
  if (!verification?.profileId) throw new TeamHostError('VERIFICATION_REQUIRED', '未配置可信宿主验证方案，不能开始或宣称完成。请在侧栏「插件」→ desktop-workflow 的配置里填「完成验证」，并选中一条方案。');
  if (!Array.isArray(verification.scope) || !verification.scope.length) throw new TeamHostError('SCOPE_REQUIRED', '未配置本次允许修改的相对路径，请在配置里指定。');
  if (serverConfig.jev?.disclosureAccepted !== true) throw new TeamHostError('JEV_CONSENT_REQUIRED', '尚未在服务端配置里确认 TypeSafe 数据传输范围；请在配置里明确同意后再用聊天启动。');
  return {
    goal: text,
    roles,
    limits: { ...DEFAULT_LIMITS, ...(serverConfig.limits && typeof serverConfig.limits === 'object' ? serverConfig.limits : {}) },
    reviewPlan: serverConfig.reviewPlan === true,
    routeEnabled: false,
    jev: { enabled: true, disclosureAccepted: true },
    verification: { profileId: verification.profileId, scope: [...verification.scope] },
  };
}

/**
 * Register the `run_team` tool. The handler takes the calling Agent from the tool
 * execution context, refuses anything but an idle root session, then goes through the same
 * runtime entry the panel uses.
 */
export function registerTeamTool(ctx, getRuntime, { serverConfig = {} } = {}) {
  return ctx.tools.register({
    name: 'run_team',
    description: [
      '在当前工作区按用户设定的模型与验证方案启动一次多岗位团队运行（规划→协调→执行→复核，由 Jev 独立调度）。',
      '只在用户明确要求启动团队时调用。目标写在 goal 里；模型、运行边界、验证方案与工作目录都取自服务端配置和当前会话，不能由这里指定。',
      '返回运行 id 后可以用 team_status 查看进度。同一时间只允许一个团队运行。',
    ].join(' '),
    parameters: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: '这次要让团队完成的目标，写清楚期望结果与范围。' },
      },
      required: ['goal'],
      additionalProperties: false,
    },
    output: { schema: { type: 'object', additionalProperties: true }, render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }] },
    timeoutMs: 40_000,
    isConcurrencySafe: () => false,
    async execute(args, exec) {
      const runtime = getRuntime();
      if (!runtime) throw new TeamHostError('UNSUPPORTED_HOST', '当前宿主未加载团队执行所需的服务，无法启动。');
      const caller = exec?.agent;
      const sessionId = caller?.id ?? caller?.session?.id;
      if (!sessionId) throw new TeamHostError('SESSION_REQUIRED', '无法确定当前会话，无法启动团队。');
      if (caller?.session?.header?.parentSession) throw new TeamHostError('ROOT_SESSION_REQUIRED', '请在主会话中启动团队。');
      const context = runtime.snapshot(sessionId).context;
      if (!context?.available) throw new TeamHostError('SESSION_UNAVAILABLE', context?.reason || '当前会话不可用。');
      if (!context.canStart) throw new TeamHostError('SESSION_BUSY', context.reason || '当前会话正在运行，请等待结束后再启动团队。');
      const model = callerSelection(caller, serverConfig);
      const verification = serverConfig.verification?.profileId
        ? { profileId: serverConfig.verification.profileId, scope: serverConfig.verification.scope ?? [] }
        : undefined;
      const settings = buildRunConfig({ goal: args?.goal, fallbackModel: model, verification, serverConfig });
      const requestId = `team-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      const started = await runtime.start({ sessionId, contextKey: context.contextKey, requestId, goal: settings.goal, settings });
      const snapshot = started?.snapshot ?? runtime.snapshot(sessionId).snapshot;
      return {
        started: true,
        runId: snapshot?.id,
        status: snapshot?.status,
        workspace: context.workspace,
        roles: Object.fromEntries(Object.entries(settings.roles).map(([role, selection]) => [role, `${selection.provider}/${selection.model}`])),
        verification: settings.verification,
        note: '团队已启动。用 team_status 查看进度；停止请用 team_stop。',
      };
    },
  });
}

/** The caller's current model, or the server-configured default. */
function callerSelection(caller, serverConfig) {
  const fromConfig = serverConfig.models?.default;
  if (fromConfig?.provider && fromConfig?.model) return { provider: fromConfig.provider, model: fromConfig.model };
  const current = caller?.modelSelection ?? caller?.selection ?? caller?.session?.header?.model;
  if (current?.provider && current?.model) return { provider: current.provider, model: current.model };
  const fromAgent = caller?.agentOptions;
  if (fromAgent?.provider && fromAgent?.model) return { provider: fromAgent.provider, model: fromAgent.model };
  return undefined;
}

export { ROLES };
