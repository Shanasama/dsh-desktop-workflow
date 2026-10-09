import { readSnapshot, waiting } from './state.js';
import { createTeamRuntime, registerTeamRoutes } from './team-runtime.js';
import { verificationProfiles } from './verification.js';
import { registerTeamTool } from './team-tool.js';
import Schema from '@deepseek-ai/schemastery';

export const name = 'dsh-desktop-workflow';
export const inject = ['connection'];
export const ENDPOINT = 'dsh-desktop-workflow/snapshot';

/**
 * Fork addition (not upstream). Declares the plugin's trusted server configuration:
 * the six role models, the Jev credential reference, the verification scheme and the
 * explicit TypeSafe disclosure switch. This is what lets a run start from chat instead of
 * from browser storage: everything a run needs is readable on the host.
 *
 * The security model is unchanged — the browser still cannot supply shell code,
 * executable paths, endpoints or credentials, and no key field exists anywhere.
 */
export const Config = Schema.object({
  stateFile: Schema.string().default('').description('可选：v0.1 旧状态 JSON 的绝对路径，仅只读查看。'),
  staleAfterMs: Schema.natural().min(1000).default(120000).description('旧状态快照被视为过期的毫秒数。'),
  jev: Schema.object({
    credentialEnv: Schema.string().pattern(/^[A-Z][A-Z0-9_]{1,79}$/).default('TYPESAFE_API_KEY')
      .description('存放 TypeSafe 密钥的环境变量【名字】。解析顺序：DSH 凭据界面的值 → 宿主环境变量。这里只写变量名，绝不写入密钥本身。'),
    model: Schema.string().pattern(/^jev-[A-Za-z0-9._-]{1,60}$/).default('jev-latest')
      .description('Jev 决策模型 id。'),
    disclosureAccepted: Schema.boolean().default(false)
      .description('是否已确认把脱敏、限长的任务文本/差异统计/检查摘要发送给 TypeSafe。开启后聊天里的 run_team 才能启动；这是每台机器的服务端开关，不是每次运行的勾选。'),
  }).description('Jev / TypeSafe 独立决策服务的服务端引用。'),
  models: Schema.dict(Schema.string()).description('各岗位使用的模型，写成 "提供方/模型"。键用 default 作为默认值，也可为 planner/coordinator/researcher/explorer/worker/reviewer 单独指定。'),
  verificationProfiles: Schema.array(Schema.object({
    id: Schema.string().pattern(/^[A-Za-z0-9_-]{1,64}$/).required().description('验证配置 id；面板里选择的就是它。'),
    name: Schema.string().description('显示名。'),
    checks: Schema.array(Schema.object({
      id: Schema.string().pattern(/^[A-Za-z0-9_-]{1,64}$/).required().description('检查 id。'),
      argv: Schema.array(Schema.string()).required().description('实际执行的 argv，最多 24 项；由宿主原生 bash 前台执行。'),
      timeoutMs: Schema.natural().min(1000).max(60000).required().description('单条检查超时（1000–60000 毫秒）。'),
    })).required().description('最多 4 条检查命令。'),
    protectedPaths: Schema.array(Schema.string()).required().description('受保护的验收测试/配置路径，最多 32 条；一旦被本次改动碰到即判定失败。'),
    expectsChanges: Schema.boolean().default(true).description('本次是否预期产生文件变更。'),
  })).default([]).description('可信宿主验证方案。为空时真实运行会被硬门禁阻止（不会静默忽略）。'),
  verification: Schema.object({
    profileId: Schema.string().default('').description('本次运行选用的验证方案 id；留空表示尚未选择，运行会被阻止。'),
    scope: Schema.array(Schema.string()).default([]).description('本次允许修改的相对路径；留空会被拒绝。'),
  }).description('本次运行使用的验证方案与允许修改范围。'),
});

/** Reject an unusable verification config at activation rather than mid-run. */
function assertConfig(config = {}) {
  if (config.verificationProfiles === undefined) return;
  verificationProfiles(config.verificationProfiles);
}

/** Transport/authentication stays owned by DSH. The browser cannot select a file. */
export function createHandler(config = {}, read = readSnapshot, now = () => Date.now()) {
  const stateFile = typeof config.stateFile === 'string' ? config.stateFile : '';
  const staleAfterMs = Number.isFinite(config.staleAfterMs) ? Math.max(1000, config.staleAfterMs) : 120000;
  return async (_endpoint, payload, signal) => {
    if (signal?.aborted) return { ok: false, error: { code: 'ABORTED', message: '请求已取消。', details: {} } };
    if (payload && (typeof payload !== 'object' || Array.isArray(payload) || Object.keys(payload).length)) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: '状态读取不接受额外参数。', details: {} } };
    }
    try {
      const snapshot = stateFile ? await read(stateFile) : waiting();
      const modified = Date.parse(snapshot.updatedAt || '');
      return { ok: true, value: { ...snapshot, stale: snapshot.mode === 'live' && snapshot.status === 'running' && Number.isFinite(modified) && now() - modified > staleAfterMs, readAt: new Date(now()).toISOString() } };
    } catch (error) {
      // Paths and raw parse errors can contain private information; never forward them.
      const missing = error?.code === 'ENOENT';
      return { ok: false, error: { code: missing ? 'STATE_MISSING' : 'STATE_UNREADABLE', message: missing ? '未找到配置的工作流状态文件，请检查 Desktop profile 的 stateFile。' : '无法读取工作流状态。需要有效的普通 JSON 文件，大小不超过 1 MiB。', details: {} } };
    }
  };
}
export function createRoute(config = {}, read = readSnapshot, now) {
  const handle = createHandler(config, read, now);
  return {
    path: '/api/' + ENDPOINT, methods: ['POST'], requestBody: 'buffered',
    async fetch(request) {
      if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
      let envelope;
      try { envelope = await request.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }
      if (!envelope || envelope.type !== 'client-request' || typeof envelope.rpcId !== 'string' || envelope.rpcId.length > 256 || envelope.method !== ENDPOINT) return new Response('Invalid RPC envelope', { status: 400 });
      const result = await handle(ENDPOINT, envelope.payload, request.signal);
      return Response.json({ type: 'server-response', rpcId: envelope.rpcId, result }, { headers: { 'Cache-Control': 'no-store' } });
    }
  };
}
export function apply(ctx, config = {}) {
  assertConfig(config);
  // Exact /api routes compose before the gateway; never replace its single interceptor.
  ctx.effect(() => ctx.connection.fetch.register(createRoute(config)), 'desktop-workflow: legacy read-only snapshot');
  let runtime;
  ctx.effect(() => registerTeamRoutes(ctx,()=>runtime), 'desktop-workflow: explicit team actions');
  ctx.inject(['agents','subagents','llm','tools','sandboxPolicy'], child=>{
    // `credentials` is looked up lazily on the plugin context, where it is an optional
    // service: without it the Jev key still resolves from the process environment.
    const owned=createTeamRuntime(child,config,{resolveCredentials:()=>ctx.get?.('credentials')});runtime=owned;
    child.effect(()=>async()=>{if(runtime===owned)runtime=undefined;await owned.dispose();},'desktop-workflow: owned team runtime');
    // The chat entry point. Registered on the child that owns the team runtime, so the
    // tool and the run share one lifetime and one call surface.
    child.effect(()=>registerTeamTool(child,()=>owned,{serverConfig:config}),'desktop-workflow: run_team tool');
  });
}
