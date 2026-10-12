/** Native DSH request accounting. No tokenizer guesses, prices, network, or credentials. */
import { callConfigEquals, isAgentLoopRequest } from '@deepseek-ai/dsh-llm';
import { createRequire } from 'node:module';
import { isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
const localHostContract=Object.freeze({callConfigEquals,isAgentLoopRequest});

/** Native profile packages can contain a second copy of dsh-llm. Request
 * branding is a module-local WeakSet, so resolve from the launcher-owned
 * installation and then from AgentLoop's own dependency edge, never from the
 * workflow's profile-local peer. No profile files, credentials or env reads. */
export async function resolveNativeBudgetContract(ctx) {
  const profile=ctx.get?.('profileContext');
  if(profile===undefined)return localHostContract; // Direct embedded hosts.
  try {
    if(typeof profile?.installAnchor!=='string'||!isAbsolute(profile.installAnchor))throw new Error('missing host anchor');
    const hostRequire=createRequire(profile.installAnchor);
    const loopFile=hostRequire.resolve('@deepseek-ai/dsh-agent-loop');
    const loopRequire=createRequire(loopFile);
    const llmFile=loopRequire.resolve('@deepseek-ai/dsh-llm');
    for(const [name,resolveFrom]of [['@deepseek-ai/dsh-agent-loop',hostRequire],['@deepseek-ai/dsh-llm',loopRequire]]){
      const manifest=JSON.parse(await readFile(resolveFrom.resolve(name+'/package.json'),'utf8'));
      if(manifest.name!==name||manifest.version!=='0.2.0-rc.2')throw new Error('unsupported native package version');
    }
    const contract=await import(pathToFileURL(llmFile).href);
    if(typeof contract.isAgentLoopRequest!=='function'||typeof contract.callConfigEquals!=='function')throw new Error('unsupported host contract');
    return Object.freeze({contracts:Object.freeze([
      Object.freeze({isAgentLoopRequest:contract.isAgentLoopRequest,callConfigEquals:contract.callConfigEquals}),
      localHostContract,
    ])});
  }catch{throw new ProductionBudgetError('BUDGET_HOST_CONTRACT_UNAVAILABLE','无法从宿主安装位置核验原生预算契约；已在创建子代理前停止。');}
}

export const MAX_TOKEN_LIMIT = 1_000_000_000;
export class ProductionBudgetError extends Error {
  constructor(code, message) {
    super(message); this.name = 'ProductionBudgetError'; this.code = code;
    this.retryable = false; this.blocked = true;
  }
}
const fail = (code, message) => { throw new ProductionBudgetError(code, message); };
const natural = value => Number.isSafeInteger(value) && value >= 0;
const positive = value => natural(value) && value > 0;

export function normalizeBudgetConfig(value = {enabled:false, tokenLimit:0}) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some(key => !['enabled','tokenLimit'].includes(key)) ||
      typeof value.enabled !== 'boolean' || !natural(value.tokenLimit) ||
      value.tokenLimit > MAX_TOKEN_LIMIT || (value.enabled && value.tokenLimit === 0)) {
    fail('INVALID_BUDGET', 'Token 预算必须明确启用，并设置不超过 1,000,000,000 的正整数；关闭时默认额度为 0。');
  }
  return Object.freeze({enabled:value.enabled, tokenLimit:value.tokenLimit});
}

/** DSH's four buckets are disjoint. Reasoning is already included in output. */
export function normalizeHostUsage(usage) {
  if (!usage || typeof usage !== 'object') fail('BUDGET_USAGE_UNKNOWN', '宿主没有报告完整 Token 用量。');
  const fields = ['inputTokens','outputTokens','cacheReadTokens','cacheWriteTokens'];
  const values = fields.map((key, index) => usage[key] === undefined && index > 1 ? 0 : usage[key]);
  if (!values.every(natural)) fail('BUDGET_USAGE_UNKNOWN', '宿主报告的 Token 用量无效。');
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!natural(total) || (usage.totalTokens !== undefined && (!natural(usage.totalTokens) || usage.totalTokens !== total)) ||
      (usage.reasoningTokens !== undefined && (!natural(usage.reasoningTokens) || usage.reasoningTokens > usage.outputTokens))) {
    fail('BUDGET_USAGE_UNKNOWN', '宿主报告的 Token 用量不一致。');
  }
  return total;
}

/**
 * AgentLoop writes request/context from its registration-bound PreparedLlmCall
 * immediately before llm/stream. Do NOT use tokenMeter/contextPressure or a
 * separate resolveModelInfo() query: neither is an exact generation-bound cap.
 * Auxiliary one-shots lack that contract and deliberately have no bound here.
 */
export function nativeRequestBound(options, agent, contract=localHostContract) {
  if (!agent || options.sessionId !== agent.id || options.purpose !== undefined || !Object.isFrozen(options)) return undefined;
  // A locally overridden official loop may own the profile peer's marker.
  // Accept only exact native branding, with that same module's config check.
  const recognized=(contract.contracts??[contract]).find(candidate=>candidate.isAgentLoopRequest(options));
  if(!recognized)return undefined;
  const context = agent.session.requestContext?.();
  const header = agent.session.requestHeader?.();
  if (!context || !header?.config || context.provider !== options.provider || context.model !== options.model ||
      !recognized.callConfigEquals(header.config, options) || !positive(context.contextWindow)) return undefined;
  return context.contextWindow;
}

/** Per-run ledger. Reservations mutate synchronously before next() can dispatch. */
export class ProductionBudget {
  #config; #spent=0; #reserved=0; #physicalCalls=0; #unknownUsageCalls=0;
  #halted=null; #released=false; #active=0; #notify;
  constructor(config, onChange=()=>{}) { this.#config=normalizeBudgetConfig(config); this.#notify=onChange; }
  get config() { return this.#config; }
  snapshot() {
    return {enabled:this.#config.enabled, limit:this.#config.tokenLimit,
      spent:this.#spent, reserved:this.#reserved,
      remaining:this.#config.enabled ? Math.max(0,this.#config.tokenLimit-this.#spent-this.#reserved) : null,
      halted:this.#halted, accounting:this.#unknownUsageCalls ? 'host-usage-incomplete' : 'host-usage',
      unknownUsageCalls:this.#unknownUsageCalls, physicalCalls:this.#physicalCalls};
  }
  #changed() { try { this.#notify(this.snapshot()); } catch { /* Observers cannot change budget admission. */ } }
  #stop(code, message) { this.#halted ||= code; this.#changed(); fail(code,message); }
  release() {
    this.#released=true;
    if (this.#active) this.#halted ||= 'BUDGET_RELEASED_WITH_PENDING_CALLS';
    this.#changed(); return this.snapshot();
  }
  /** A closed/uncertain run is never silently reset by reusing the same id. */
  get released() { return this.#released; }
  get activeCalls() { return this.#active; }
  check() {
    if (this.#released) fail('BUDGET_RELEASED','团队运行已结束，已阻止迟到的模型请求。');
    if (this.#config.enabled && this.#halted) fail(this.#halted,'Token 预算已停止新的模型请求。');
  }
  async *stream(options, next, {bound, signal, onBlocked=()=>{}}={}) {
    let reservation=0;
    try {
      this.check();
      if (signal?.aborted || options.signal?.aborted) fail('CANCELLED','运行已取消，未派发模型请求。');
      if (this.#config.enabled) {
        if (!positive(bound)) this.#stop('BUDGET_BOUND_UNAVAILABLE','当前宿主请求没有可核验的完整 Token 上界，已在派发前停止。');
        if (bound > this.#config.tokenLimit-this.#spent-this.#reserved) this.#stop('BUDGET_INSUFFICIENT','剩余额度不足以预留所选模型的完整上下文上界，已在派发前停止。');
        reservation=bound;
      }
    } catch (error) { onBlocked(error); throw error; }
    // This counts admitted native adapter-boundary attempts, not proven HTTP
    // billing transactions: downstream host middleware may reject before I/O.
    this.#reserved+=reservation; this.#physicalCalls++; this.#active++; this.#changed();
    let usage, terminal=false, invalid=false, failed=false, normalDrain=false;
    try {
      for await (const chunk of next()) {
        if (terminal) invalid=true;
        if (chunk.type==='usage') {
          try { const total=normalizeHostUsage(chunk.usage); if (usage!==undefined && total<usage) invalid=true; usage=total; }
          catch { invalid=true; }
        }
        if (chunk.type==='finish') { terminal=true; failed=!['stop','tool-calls','max-tokens'].includes(chunk.reason?.kind); }
        yield chunk;
      }
      normalDrain=true;
    } finally {
      this.#active--;
      if (normalDrain && terminal && usage!==undefined && !invalid && natural(this.#spent+usage) && (!failed || !this.#config.enabled)) {
        this.#spent+=usage; this.#reserved-=reservation;
        if (failed) this.#unknownUsageCalls++;
        if (this.#config.enabled && usage>reservation) this.#halted ||= 'BUDGET_BOUND_EXCEEDED';
      } else {
        this.#unknownUsageCalls++;
        // Keep the full bound reserved after cancellation, error, missing or
        // invalid usage. Native pi-ai error counters can be default zero or
        // partial even when the host emits a syntactically valid usage chunk. No retry may turn an unknown charge into free tokens.
        if (this.#config.enabled) this.#halted ||= 'BUDGET_USAGE_UNKNOWN';
      }
      this.#changed();
      if (this.#config.enabled && this.#halted) onBlocked(new ProductionBudgetError(this.#halted,
        this.#halted==='BUDGET_BOUND_EXCEEDED' ? '宿主报告用量超过其声明上界，预算无法继续保证；已停止后续请求。' : '模型调用用量未能完整核验或预算已停止；不会继续派发。'));
    }
  }
}
