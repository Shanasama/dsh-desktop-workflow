import { readSnapshot, waiting } from './state.js';

export const name = 'dsh-desktop-workflow';
export const inject = ['connection'];
export const ENDPOINT = 'dsh-desktop-workflow/snapshot';

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
  // Exact /api routes compose before the gateway; never replace its single interceptor.
  ctx.effect(() => ctx.connection.fetch.register(createRoute(config)), 'desktop-workflow: read-only snapshot');
}
