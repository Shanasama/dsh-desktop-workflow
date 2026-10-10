import React, { useEffect, useRef, useState } from 'react';
import { createDefaultTeamSettings, type TeamCatalog, type TeamModelSelection, type TeamRole, type TeamSettings, type TeamSettingsViewProps, type TeamSnapshot } from './team-types';

const ROLE_NAMES: Record<TeamRole, string> = { planner: '规划者', coordinator: '协调者', researcher: '研究者', explorer: '探索者', worker: '执行者', reviewer: '审查者' };
const PINNED_JEV = /^jev-\d+\.\d+\.\d+(?:-[a-z0-9.]+)?$/;
const integerIn = (value: number, min: number, max: number) => Number.isInteger(value) && value >= min && value <= max;

export function productionDefaults(settings: TeamSettings): TeamSettings {
  const defaults = createDefaultTeamSettings();
  return { ...settings, budget: settings.budget || defaults.budget, routing: settings.routing || defaults.routing, jev: settings.jev || defaults.jev };
}

export function productionSettingsErrors(settings: TeamSettings, catalog: TeamCatalog): string[] {
  const normalized = productionDefaults(settings);
  const { budget, routing, jev } = normalized;
  const errors: string[] = [];
  if (!integerIn(budget!.tokenLimit, budget!.enabled ? 1 : 0, 1_000_000_000)) errors.push('Token 预算必须是明确输入的正整数，最大 1,000,000,000；关闭时允许 0。');
  if (jev!.model.length > 64 || !['jev-latest', 'jev-preview'].includes(jev!.model) && !PINNED_JEV.test(jev!.model)) errors.push('Jev 主版本须为 jev-latest、jev-preview 或固定 jev-x.y.z 版本（可含预发布后缀）。');
  if (jev!.shadow.model.length > 64 || (jev!.shadow.enabled || jev!.shadow.model) && !PINNED_JEV.test(jev!.shadow.model)) errors.push('Shadow 必须明确指定固定 jev-x.y.z 版本，不能使用 latest 或 preview 别名。');
  if (!integerIn(jev!.shadow.maxCalls, 0, 20)) errors.push('Shadow 调用上限须为 0–20 的整数。');
  for (const role of Object.keys(ROLE_NAMES) as TeamRole[]) {
    for (const tier of ['weak', 'strong'] as const) {
      const selection = routing!.roles[role]?.[tier];
      if (!selection) continue;
      const model = catalog.providers.find(provider => provider.id === selection.provider)?.models.find(model => model.id === selection.model);
      if (!model || (selection.reasoningEffort && !model.efforts?.some(effort => effort.id === selection.reasoningEffort)) || (selection.maxTokens !== undefined && !integerIn(selection.maxTokens, 128, 32768))) {
        errors.push(`${ROLE_NAMES[role]}的 ${tier} 候选未通过宿主目录验证，请重新选择或清除候选。`);
      }
    }
  }
  return errors;
}

function CandidateSelector({ role, tier, selection, catalog, disabled, onChange }: {
  role: TeamRole; tier: 'weak' | 'strong'; selection?: TeamModelSelection; catalog: TeamCatalog; disabled: boolean;
  onChange: (selection?: TeamModelSelection) => void;
}) {
  const provider = catalog.providers.find(item => item.id === selection?.provider);
  const model = provider?.models.find(item => item.id === selection?.model);
  const name = `${ROLE_NAMES[role]} ${tier}`;
  return <fieldset className="tm-routing-candidate" disabled={disabled || !catalog.available}>
    <legend>{tier === 'weak' ? 'weak · small 分档' : 'strong · high / escalate 分档'}</legend>
    <p>{selection ? '仅使用你明确选择的宿主模型' : '未配置 · 沿用岗位基础模型'}</p>
    <div className="tm-production-fields">
      <label>提供方<select aria-label={`${name}提供方`} value={selection?.provider || ''} onChange={event => onChange(event.target.value ? { provider: event.target.value, model: '' } : undefined)}>
        <option value="">不配置候选</option>
        {selection?.provider && !provider && <option value={selection.provider} disabled>{selection.provider} · 当前不可用</option>}
        {catalog.providers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select></label>
      <label>模型<select aria-label={`${name}模型`} value={selection?.model || ''} disabled={disabled || !provider || !catalog.available} onChange={event => { const selected = provider?.models.find(item => item.id === event.target.value); onChange({ ...selection!, model: event.target.value, reasoningEffort: selected?.defaultEffort }); }}>
        <option value="">选择模型</option>
        {selection?.model && !model && <option value={selection.model} disabled>{selection.model} · 当前不可用</option>}
        {provider?.models.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select></label>
    </div>
    {selection && <details className="tm-advanced-model"><summary>候选请求设置<span aria-hidden="true">›</span></summary><div>
      {!!model?.efforts?.length && <label>推理强度<select aria-label={`${name}推理强度`} value={selection.reasoningEffort || ''} onChange={event => onChange({ ...selection, reasoningEffort: event.target.value || undefined })}><option value="">使用模型默认值</option>{model.efforts.map(effort => <option key={effort.id} value={effort.id}>{effort.name}</option>)}</select></label>}
      <label>每次模型请求输出上限<input aria-label={`${name}每次模型请求输出上限`} type="number" min={128} max={32768} step={1} value={Number.isFinite(selection.maxTokens) ? selection.maxTokens : ''} placeholder="默认 4096 tokens" onChange={event => onChange({ ...selection, maxTokens: event.target.value === '' ? undefined : Number(event.target.value) })}/></label>
      <button type="button" className="tm-button tm-button--quiet" onClick={() => onChange(undefined)}>清除 {tier} 候选</button>
    </div></details>}
  </fieldset>;
}

export function ProductionSettings({ settings, catalog, disabled, role, onRoleChange, onChange, onModelSelectionChange }: {
  settings: TeamSettings; catalog: TeamCatalog; disabled: boolean; role: TeamRole; onRoleChange: (role: TeamRole) => void;
  onChange: (settings: TeamSettings) => void; onModelSelectionChange?: TeamSettingsViewProps['onModelSelectionChange'];
}) {
  const normalized = productionDefaults(settings);
  const budget = normalized.budget!, routing = normalized.routing!, jev = normalized.jev!;
  function candidate(tier: 'weak' | 'strong', selection?: TeamModelSelection) {
    const nextRole = { ...routing.roles[role] };
    if (selection) nextRole[tier] = selection; else delete nextRole[tier];
    const roles = { ...routing.roles };
    if (nextRole.weak || nextRole.strong) roles[role] = nextRole; else delete roles[role];
    const next = { ...routing, roles };
    onChange({ ...normalized, routing: next });
    onModelSelectionChange?.(settings.roles, next);
  }
  return <details className="tm-production-settings">
    <summary><span>生产控制 · 预算、路由与 Jev 版本</span><span aria-hidden="true">›</span></summary>
    <p className="tm-production-help">保存后用于新运行。本次运行保持启动时的设置。</p>
    <fieldset className="tm-production-section" disabled={disabled}>
      <legend>Token 预算</legend>
      <label className="tm-production-toggle"><input type="checkbox" name="budgetEnabled" checked={budget.enabled} onChange={event => onChange({ ...normalized, budget: { ...budget, enabled: event.target.checked } })}/><span>启用 Token 预算</span></label>
      <div className="tm-production-fields"><label>每次运行 Token 上限<input aria-label="每次运行 Token 上限" type="number" min={budget.enabled ? 1 : 0} max={1_000_000_000} step={1} value={budget.tokenLimit || ''} disabled={!budget.enabled} placeholder="启用前请明确输入上限" onChange={event => onChange({ ...normalized, budget: { ...budget, tokenLimit: Number(event.target.value) } })}/></label></div>
      <p>默认关闭。每次请求会按所选模型的完整上下文窗口保守预留，较小预算可能在首次调用前被阻止。Token 上限不是金额上限；已记账与未知用量分别显示。</p>
    </fieldset>
    <fieldset className="tm-production-section" disabled={disabled}>
      <legend>动态模型路由</legend>
      <label className="tm-production-toggle"><input type="checkbox" name="routingEnabled" checked={routing.enabled} onChange={event => onChange({ ...normalized, routing: { ...routing, enabled: event.target.checked } })}/><span>启用动态路由</span></label>
      <p>small 使用已配置的 weak 候选；high / escalate 使用 strong 候选；medium 或缺少候选时沿用基础模型。关闭后全部沿用基础模型。</p>
      <div className="tm-production-fields"><label>配置岗位<select aria-label="路由岗位" value={role} onChange={event => onRoleChange(event.target.value as TeamRole)}>{(Object.keys(ROLE_NAMES) as TeamRole[]).map(item => <option key={item} value={item}>{ROLE_NAMES[item]}</option>)}</select></label></div>
      <div className="tm-routing-candidates">{(['weak', 'strong'] as const).map(tier => <CandidateSelector key={`${role}-${tier}`} role={role} tier={tier} selection={routing.roles[role]?.[tier]} catalog={catalog} disabled={disabled} onChange={selection => candidate(tier, selection)}/>)}</div>
    </fieldset>
    <fieldset className="tm-production-section" disabled={disabled}>
      <legend>Jev 主版本与只观察对照</legend>
      <div className="tm-production-fields"><label>Jev 主版本<input aria-label="Jev 主版本" type="text" maxLength={64} autoComplete="off" spellCheck={false} value={jev.model} onChange={event => onChange({ ...normalized, jev: { ...jev, model: event.target.value.trim() } })}/></label></div>
      <p>支持 jev-latest、jev-preview 或固定 jev-x.y.z 版本，可含预发布后缀。请求别名与服务响应版本分别记录。</p>
      <label className="tm-production-toggle"><input type="checkbox" name="shadowEnabled" checked={jev.shadow.enabled} onChange={event => onChange({ ...normalized, jev: { ...jev, shadow: { ...jev.shadow, enabled: event.target.checked } } })}/><span>启用 Shadow 对照（只观察）</span></label>
      <div className="tm-production-fields"><label>Shadow 固定版本<input aria-label="Shadow 固定版本" type="text" maxLength={64} autoComplete="off" spellCheck={false} value={jev.shadow.model} disabled={!jev.shadow.enabled} placeholder="明确输入固定版本" onChange={event => onChange({ ...normalized, jev: { ...jev, shadow: { ...jev.shadow, model: event.target.value.trim() } } })}/></label><label>Shadow 调用上限<input aria-label="Shadow 调用上限" type="number" min={0} max={20} step={1} value={Number.isFinite(jev.shadow.maxCalls) ? jev.shadow.maxCalls : ''} disabled={!jev.shadow.enabled} onChange={event => onChange({ ...normalized, jev: { ...jev, shadow: { ...jev.shadow, maxCalls: event.target.value === '' ? NaN : Number(event.target.value) } } })}/></label></div>
      <p>对照版本必须固定；结果不参与执行决策。0 次表示不发起对照请求。对照也会产生服务调用。</p>
      <label className="tm-production-toggle"><input type="checkbox" name="traceEnabled" checked={jev.trace} onChange={event => onChange({ ...normalized, jev: { ...jev, trace: event.target.checked } })}/><span>记录元数据 Trace</span></label>
      <p>只记录运行元数据，不导出密钥、完整请求或模型原文。</p>
    </fieldset>
  </details>;
}

const number = (value: number | null | undefined) => Number.isFinite(value) ? value!.toLocaleString('zh-CN') : '未报告';
const TIER_NAMES = { base: '基础模型', weak: 'weak 候选', strong: 'strong 候选' };
export function ProductionStatus({ snapshot, settings, onLoadTrace }: { snapshot: TeamSnapshot | null; settings: TeamSettings; onLoadTrace?: (runId: string, signal: AbortSignal) => Promise<unknown> }) {
  const production = snapshot?.production;
  if (!production) return <section className="tm-production-status" aria-label="生产运行状态">
    <div className="tm-production-heading"><h3>生产控制</h3><span>{snapshot ? '本次运行未提供计量' : '下次运行配置'}</span></div>
    {snapshot ? <p className="tm-production-help">无法确认本次运行的预算、路由和 Jev 版本；不会用当前设置替代历史记录。</p> : <div className="tm-production-idle"><span>预算：{settings.budget?.enabled ? `${number(settings.budget.tokenLimit)} tokens` : '未启用'}</span><span>动态路由：{settings.routing?.enabled ? '已启用' : '未启用'}</span><span>Jev：{settings.jev?.model || 'jev-latest'}</span><span>Shadow：{settings.jev?.shadow.enabled ? settings.jev.shadow.model : '未启用'}</span><span>Trace：{settings.jev?.trace === false ? '关闭' : '元数据'}</span></div>}
  </section>;
  const { budget, routing, jev, trace } = production;
  const latest = routing.decisions.at(-1);
  const primary = jev?.primary;
  const shadow = jev?.shadow;
  const shadowDecision = shadow?.lastDecision;
  const shadowText = typeof shadowDecision === 'string' ? shadowDecision : shadowDecision ? [shadowDecision.action, shadowDecision.lane, shadowDecision.reason].filter(Boolean).join(' · ') : '';
  return <section className="tm-production-status" aria-label="生产运行状态">
    <div className="tm-production-heading"><h3>生产控制</h3><span>{snapshot?.demo || snapshot?.jev?.mode === 'fixture' ? '合成记录' : '本次运行记录'}</span></div>
    <div className="tm-production-metrics">
      <div><span>Token 预算</span><strong>{budget.enabled ? budget.halted ? '预算已停止派发' : `剩余 ${number(budget.remaining)}` : '未启用'}</strong><small>{budget.enabled ? `上限 ${number(budget.limit)} tokens` : '未设置本次运行上限'}</small></div>
      <div><span>用量记账</span><strong>{number(budget.spent)} <small>tokens</small></strong><small>预留 {number(budget.reserved)} · 宿主请求次数 {number(budget.physicalCalls)}</small></div>
      <div><span>动态路由</span><strong>{routing.enabled ? '已启用' : '未启用'}</strong><small>{number(routing.decisions.length)} 条选择记录</small></div>
      <div><span>Jev 主版本</span><strong>{primary?.requestedModel || '未报告'}</strong><small>响应 {primary?.responseModel || '未报告'} · {number(primary?.calls)} 次</small></div>
    </div>
    {!jev && <p className="tm-production-help">本次运行未提供 Jev 版本记录。</p>}
    {budget.halted && <p className="tm-production-warning" role="status">预算门禁已停止派发；已发生的调用和文件改动不会回滚。</p>}
    {budget.unknownUsageCalls > 0 && <p className="tm-production-warning" role="status">{number(budget.unknownUsageCalls)} 次调用的用量未知，已记账数字不是完整实际用量。</p>}
    <details className="tm-production-records"><summary><span>路由、Shadow 与 Trace 记录</span><span aria-hidden="true">›</span></summary>
      <dl><div><dt>记账状态</dt><dd>{budget.accounting || '未报告'}</dd></div><div><dt>主版本状态</dt><dd>{primary?.status || '未报告'}</dd></div><div><dt>Shadow</dt><dd>{shadow ? shadow.enabled ? `${shadow.requestedModel || '未报告'} · ${number(shadow.calls)} 次 · ${shadow.status || '尚无状态'}` : '未启用' : '未报告'}<small>只观察，不参与执行决策</small>{shadowText && <small>最新对照：{shadowText}</small>}</dd></div><div><dt>Trace</dt><dd>{trace.enabled ? `元数据 · ${number(trace.eventCount)} 条${trace.truncated ? ' · 已截断' : ''}` : '关闭'}</dd></div></dl>
      {trace.enabled && snapshot && <TraceViewer runId={snapshot.id} fixture={!!snapshot.demo || snapshot.jev?.mode === "fixture"} onLoadTrace={onLoadTrace}/>}
      {latest ? <><p className="tm-production-help">最近 {Math.min(routing.decisions.length, 6)} 条模型选择。岗位卡片显示基础配置。</p><ol className="tm-routing-records">{routing.decisions.slice(-6).reverse().map((decision, index) => <li key={`${decision.nodeId}-${index}`}><strong>{ROLE_NAMES[decision.role] || decision.role} · {decision.lane} · {TIER_NAMES[decision.tier] || decision.tier}</strong><span>{decision.provider} / {decision.model}</span><small>节点 {decision.nodeId}</small><p>{decision.reason}</p></li>)}</ol></> : <p className="tm-production-help">尚无模型选择记录。</p>}
    </details>
  </section>;
}

/** Only a closed set of metadata fields reaches the viewer. Never stringify the raw RPC payload. */
function traceSummary(value: unknown) {
  const trace = value as { schema?: unknown; policy?: unknown; privacy?: unknown; truncated?: unknown; events?: unknown[] } | null;
  if (!trace) return null;
  if (trace.schema !== 'dsh-evaluation-trace/v1' || trace.privacy !== 'metadata-only' || typeof trace.truncated !== 'boolean' || !Array.isArray(trace.events) || trace.events.length > 2048) throw new Error('unsupported trace');
  const enumValue = (value: unknown, allowed: readonly string[]) => typeof value === 'string' && allowed.includes(value) ? value : undefined;
  const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
  const model = (value: unknown) => typeof value === 'string' && value.length <= 64 && (['jev-latest', 'jev-preview'].includes(value) || PINNED_JEV.test(value)) ? value : undefined;
  const events = trace.events.map((item, index) => {
    const event = item as { seq?: unknown; type?: unknown; data?: Record<string, any> };
    if (!event || event.seq !== index + 1 || !enumValue(event.type, ['plan', 'routing', 'model_call', 'verification', 'jev', 'branch', 'terminal']) || !event.data || typeof event.data !== 'object') throw new Error('invalid trace event');
    const data = event.data;
    return { seq: index + 1, type: event.type,
      phase: enumValue(data.phase, ['classify', 'step', 'baseline', 'check', 'seal']),
      source: enumValue(data.source, ['primary', 'shadow']),
      status: enumValue(data.status, ['started', 'completed', 'failed', 'blocked', 'cancelled', 'unverified', 'error', 'skipped']),
      role: enumValue(data.role, [...Object.keys(ROLE_NAMES), 'router']),
      node: count(data.node), modelRef: count(data.modelRef), round: count(data.round),
      tier: enumValue(data.tier, ['base', 'weak', 'strong']),
      lane: enumValue(data.lane || data.decision?.lane, ['small', 'medium', 'high', 'escalate']),
      action: enumValue(data.decision?.action, ['blocked', 'classify', 'verify', 'retry', 'escalate', 'continue', 'complete']),
      requestedModel: model(data.metadata?.requestedModel), responseModel: model(data.metadata?.responseModel),
      inputTokens: count(data.metadata?.usage?.inputTokens), outputTokens: count(data.metadata?.usage?.outputTokens),
      checksPassed: typeof data.evidence?.checksPassed === 'boolean' ? data.evidence.checksPassed : undefined,
      verified: typeof data.evidence?.verified === 'boolean' ? data.evidence.verified : undefined,
    };
  });
  return { schema: 'dsh-evaluation-trace/v1', privacy: 'metadata-only', truncated: trace.truncated, count: events.length, events: events.slice(-50) };
}

function TraceViewer({ runId, fixture, onLoadTrace }: { runId: string; fixture: boolean; onLoadTrace?: (runId: string, signal: AbortSignal) => Promise<unknown> }) {
  const [trace, setTrace] = useState<ReturnType<typeof traceSummary>>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const request = useRef<AbortController>();
  useEffect(() => () => request.current?.abort(), []);
  async function load() {
    if (!onLoadTrace || fixture || request.current) return;
    const abort = new AbortController(); request.current = abort; setLoading(true); setError(undefined);
    try {
      const result = traceSummary(await onLoadTrace(runId, abort.signal));
      if (!abort.signal.aborted) setTrace(result);
    } catch {
      if (!abort.signal.aborted) { setTrace(undefined); setError('无法读取或验证元数据记录，请刷新重试。'); }
    } finally {
      if (!abort.signal.aborted) { request.current = undefined; setLoading(false); }
    }
  }
  return <div className="tm-trace-viewer">
    <div><strong>元数据 Trace 摘要</strong>{onLoadTrace && !fixture && <button type="button" className="tm-button tm-button--quiet" onClick={() => void load()} disabled={loading}>{loading ? '正在读取…' : trace ? '刷新 Trace' : '查看 Trace'}</button>}</div>
    {fixture ? <p>合成演示不读取真实运行记录。</p> : !onLoadTrace ? <p>此视图未提供记录读取入口。</p> : null}
    {error && <p role="alert">{error}</p>}
    {trace === null && <p role="status">此运行没有可用 Trace，可能未启用或记录已不在内存中。</p>}
    {trace && <><p>显示 {trace.events.length} / {trace.count} 条的白名单摘要字段{trace.truncated ? ' · 服务端记录已截断' : ''}。不包含原始内容；不用于完整决策重放。</p><pre aria-label="Trace 元数据摘要">{JSON.stringify(trace.events, null, 2)}</pre></>}
  </div>;
}
