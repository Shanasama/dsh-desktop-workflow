import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { TeamCatalog, TeamEdge, TeamLimits, TeamModelSelection, TeamNode, TeamNodeStatus, TeamNodeRole, TeamRole, TeamSettings, TeamSnapshot, TeamSettingsViewProps, TeamViewProps } from './team-types';
import teamCss from './team.css';
import themeCss from './team-theme.css';
import { TeamThemeSwitch, useTeamTheme } from './team-theme';
export * from './team-types';

type IconName = 'team' | 'plan' | 'coordinate' | 'search' | 'explore' | 'code' | 'review' | 'route' | 'arrow' | 'check' | 'close' | 'refresh' | 'settings' | 'clock' | 'file' | 'chevron' | 'play' | 'stop' | 'lock' | 'activity' | 'branch' | 'alert';
function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    team: <><rect x="8" y="8" width="8" height="8" rx="2"/><circle cx="4" cy="4" r="2"/><circle cx="20" cy="4" r="2"/><circle cx="4" cy="20" r="2"/><circle cx="20" cy="20" r="2"/><path d="m6 6 3 3m6 0 3-3M6 18l3-3m6 0 3 3"/></>,
    plan: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></>,
    coordinate: <><rect x="8" y="8" width="8" height="8" rx="2"/><path d="M12 3v5m0 8v5M3 12h5m8 0h5m-4-8-2 2M7 7 5 5m12 12 2 2M7 17l-2 2"/></>,
    search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M8 10h4m-2-2v4"/></>,
    explore: <><path d="M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="m10 12-3 2 3 2m4-4 3 2-3 2"/></>,
    code: <path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16"/>,
    review: <><path d="M12 3 4 6v5c0 5 4 8 8 10 4-2 8-5 8-10V6Z"/><path d="m8 12 3 3 5-6"/></>,
    route: <><path d="M4 12h5a3 3 0 0 0 3-3V7a2 2 0 0 1 2-2h6M9 12a3 3 0 0 1 3 3v2a2 2 0 0 0 2 2h6m-3-17 3 3-3 3m0 8 3 3-3 3"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>, check: <path d="m5 12 4 4L19 6"/>, close: <path d="m6 6 12 12M6 18 18 6"/>,
    refresh: <><path d="M20 5v6h-6M4 19v-6h6"/><path d="M6 6a8 8 0 0 1 14 5M4 13a8 8 0 0 0 14 5"/></>,
    settings: <><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="8" cy="18" r="2"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>, file: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M8 14h8m-8 3h5"/></>,
    chevron: <path d="m9 5 7 7-7 7"/>, play: <path d="m8 4 12 8-12 8Z"/>, stop: <rect x="6" y="6" width="12" height="12" rx="2"/>,
    lock: <><rect x="6" y="10" width="12" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/></>,
    activity: <path d="M3 12h4l3-8 4 16 3-8h4"/>, branch: <><circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="6" r="2"/><path d="M6 7v10m0-4c6 0 12-1 12-5"/></>,
    alert: <><path d="m10 4-8 14a2 2 0 0 0 2 3h16a2 2 0 0 0 2-3L14 4a2 2 0 0 0-4 0Z"/><path d="M12 9v5m0 3v.1"/></>,
  };
  return <svg className={`tm-icon ${className}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
const ROLE: Record<TeamNodeRole, { name: string; subtitle: string; icon: IconName; description: string; access: string }> = {
  planner: { name: '规划者', subtitle: '强模型规划', icon: 'plan', description: '理解目标，提出任务拆分、依赖和验收条件。实际任务随目标生成。', access: '只读分析' },
  coordinator: { name: '协调者', subtitle: '主力协调', icon: 'coordinate', description: '在派发前整合并细化任务图，明确任务依赖与验收要求。后续由有界调度器执行。', access: '只读协调' },
  researcher: { name: '研究者', subtitle: '轻量研究', icon: 'search', description: '收集依据、比较方案，向团队提供简明的研究结论。', access: '可并行 · 只读' },
  explorer: { name: '探索者', subtitle: '代码探索', icon: 'explore', description: '检查项目结构与相关代码，定位实现路径和验证依据。', access: '可并行 · 只读' },
  worker: { name: '执行者', subtitle: '主力执行', icon: 'code', description: '根据明确任务实施代码变更。编辑串行执行，遵循 Desktop 现有权限。', access: '串行编辑' },
  reviewer: { name: '审查者', subtitle: '按需强审查', icon: 'review', description: '审查方案和产出，提出具体反馈。方案重试保留独立记录；最终审查问题会阻塞交付。', access: '只读审查' },
  jev: { name: 'Jev 核心调度', subtitle: 'TypeSafe 控制面', icon: 'route', description: 'Jev 独立完成任务分档与逐轮决策。六个岗位继续使用你选择的模型；完成仍须通过宿主验证、范围与差异检查。', access: '服务端调度 · 无编辑权限' },
};
const ROLES: TeamRole[] = ['planner', 'coordinator', 'researcher', 'explorer', 'worker', 'reviewer'];
const STATUS: Record<string, string> = { pending: '待执行', running: '进行中', completed: '已完成', failed: '失败', blocked: '已阻塞', cancelled: '已取消', planning: '规划中', reviewing: '审查中', idle: '未派发', unverified: '待验证', completion_unverified: '完成条件未满足' };
const EDGE: Record<TeamEdge['kind'], string> = { dispatch: '派发', dependency: '依赖', feedback: '反馈', retry: '重试', join: '汇总' };
const ACTIVE = new Set(['planning', 'running', 'reviewing']);
function isFixture(snapshot?: TeamSnapshot | null) { return !!snapshot?.demo || snapshot?.jev?.mode === 'fixture'; }
function Status({ status, count }: { status: string; count?: number }) {
  return <span className={`tm-status tm-status--${status}`}>{status === 'completed' ? <Icon name="check"/> : <i/>}{STATUS[status] || status}{count ? ` · ${count}` : ''}</span>;
}
function modelName(selection: TeamModelSelection | undefined, catalog: TeamCatalog, demo = false) {
  if (demo && !selection?.model) return '示例角色 · 未调用模型';
  if (!selection?.model) return '尚未选择模型';
  return catalog.providers.find(p => p.id === selection.provider)?.models.find(m => m.id === selection.model)?.name || selection.model;
}
function providerName(selection: TeamModelSelection | undefined, catalog: TeamCatalog) {
  return catalog.providers.find(p => p.id === selection?.provider)?.name || selection?.provider || '未配置';
}
function roleStatus(nodes: TeamNode[]) {
  const latest = new Map<string, TeamNode>();
  nodes.forEach(node => { const key = node.taskId || node.id; if (!latest.has(key) || latest.get(key)!.attempt <= node.attempt) latest.set(key, node); });
  for (const status of ['running', 'blocked', 'failed', 'pending', 'completed', 'cancelled'] as TeamNodeStatus[]) if ([...latest.values()].some(node => node.status === status)) return status;
  return 'idle';
}
function time(value?: string) {
  if (!value) return '未报告';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function duration(snapshot: TeamSnapshot) {
  if (!snapshot.finishedAt) return '运行中';
  const seconds = Math.round((new Date(snapshot.finishedAt).getTime() - new Date(snapshot.startedAt).getTime()) / 1000);
  return Number.isFinite(seconds) && seconds >= 0 ? `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒` : '未报告';
}
function validateSettings(settings: TeamSettings, catalog: TeamCatalog) {
  return ROLES.filter(role => {
    const selected = settings.roles[role];
    const model = catalog.providers.find(p => p.id === selected?.provider)?.models.find(m => m.id === selected?.model);
    return !model || (!!selected?.reasoningEffort && !(model.efforts || []).some(effort => effort.id === selected.reasoningEffort));
  });
}

const LANE: Record<string, string> = { small: '小型任务', medium: '标准任务', high: '高复杂度', escalate: '升级处理' };
function JevPanel({ catalog, snapshot, settings, onSelectNode }: { catalog: TeamCatalog; snapshot: TeamSnapshot | null; settings: TeamSettings; onSelectNode: (node: TeamNode) => void }) {
  const state = snapshot?.jev;
  const fixture = isFixture(snapshot) || catalog.jev?.mode === 'fixture';
  const ready = !!catalog.jev?.configured && !!catalog.jev.available;
  const evidence = state?.evidence;
  const passed = !!evidence && evidence.checksPassed && evidence.scopeOk && evidence.diffAvailable && evidence.verified;
  const latestDecision = state?.decisions.at(-1);
  const jevNode = snapshot?.nodes.filter(node => node.role === 'jev' && node.kind !== 'verification').at(-1);
  const gates = [
    { label: '验证检查通过', value: evidence?.checksPassed },
    { label: '修改范围合规', value: evidence?.scopeOk },
    { label: '差异证据可用', value: evidence?.diffAvailable },
    { label: '独立验证成立', value: evidence?.verified },
  ];
  return <section className="tm-jev-panel" aria-label="Jev 核心调度与完成门禁">
    <details className="tm-control-details"><summary><span className="tm-control-title"><Icon name="route"/>Jev 核心调度</span><span className={`tm-jev-connection ${fixture ? 'is-fixture' : ready ? 'is-ready' : 'is-blocked'}`}>{fixture ? 'FIXTURE · 未连接服务' : ready ? 'TypeSafe · 已配置' : '真实运行已阻止'}</span><Icon name="chevron"/></summary><p className="tm-jev-description">Jev 决定任务分档与下一步流程。六个岗位始终使用你选择的模型和提供方，不会随分档自动换模。</p>
    {!fixture && !ready && <p className="tm-jev-warning" role="status"><Icon name="alert"/>{catalog.jev?.reason || '尚未完成 Jev 设置。请打开团队设置，连接密钥并选择六个岗位模型。'}</p>}
    <div className="tm-jev-metrics"><div><span>当前分档</span><strong>{state ? `${state.lane} · ${LANE[state.lane] || state.lane}` : '等待 Jev 分类'}</strong></div><div><span>调度轮次</span><strong>{state?.round ?? 0} / {(snapshot?.limits || settings.limits).maxRounds}</strong></div><div><span>Jev 决策记录</span><strong>{state?.decisions.length ?? 0} 条 <small>调用上限 {(snapshot?.limits || settings.limits).maxJevCalls}</small></strong></div></div>
    {latestDecision && <div className="tm-jev-next"><strong>最新决策 · {latestDecision.action}</strong><p>{latestDecision.reason}</p></div>}
    {!!state?.decisions.length && <details className="tm-jev-decisions"><summary>独立 Jev 决策历史 · {state.decisions.length} 条<Icon name="chevron"/></summary><ol>{state.decisions.map((decision, index) => <li key={index}><div><strong>{decision.phase} → {decision.action}</strong><span>第 {decision.round} 轮 · {decision.lane} · 置信度 {Number.isFinite(decision.confidence) ? `${Math.round(decision.confidence * 100)}%` : '未报告'}</span></div><p>{decision.reason}</p></li>)}</ol></details>}
    {jevNode && <button type="button" className="tm-jev-inspect" onClick={() => onSelectNode(jevNode)}>查看最新 Jev 节点<Icon name="arrow"/></button>}
    <div className="tm-gates"><div className="tm-gates-heading"><h4>硬性完成条件</h4><span className={passed ? 'is-passed' : ''}>{passed ? (fixture ? 'Fixture 条件通过' : '全部通过') : snapshot?.status === 'completed' ? '完成条件未满足' : '未全部通过'}</span></div><ul>{gates.map(gate => <li key={gate.label} className={gate.value === true ? 'is-passed' : gate.value === false ? 'is-failed' : 'is-pending'}><Icon name={gate.value === true ? 'check' : gate.value === false ? 'close' : 'clock'}/><span>{gate.label}</span><small>{gate.value === true ? '通过' : gate.value === false ? '未通过' : '待验证'}</small></li>)}</ul><p>{evidence?.reason || '服务端尚未提供完成证据。Jev 或审查者的完成建议不能跳过这些检查。'}</p></div>
    </details>
  </section>;
}

function Topology({ snapshot, settings, catalog, selected, onSelect }: { snapshot: TeamSnapshot | null; settings: TeamSettings; catalog: TeamCatalog; selected?: TeamNodeRole; onSelect: (role: TeamNodeRole) => void }) {
  const roles = snapshot?.roles || settings.roles;
  return <div className="tm-topology">
    <div className="tm-topology-map">
      <svg className="tm-topology-wires tm-topology-wires--wide" viewBox="0 0 840 392" preserveAspectRatio="none" aria-hidden="true"><path d="M140 54H420M420 82V196M560 196H700V54M280 196H140V54M420 250V280H140V312M420 280V312M420 280H700V312"/><circle cx="420" cy="280" r="4"/></svg>
      <svg className="tm-topology-wires tm-topology-wires--narrow" viewBox="0 0 400 430" preserveAspectRatio="none" aria-hidden="true"><path d="M200 60V78H94V92M200 78H306V92M94 186V200H306V186M94 200V214M306 200V214M94 308V322H306V308M94 322V336M306 322V336"/><circle cx="200" cy="78" r="3"/></svg>
      <button type="button" className={`tm-controller-node ${selected === 'jev' ? 'is-selected' : ''}`} onClick={() => onSelect('jev')} aria-pressed={selected === 'jev'} aria-label="查看 Jev 核心调度详情"><span className="tm-controller-symbol"><Icon name="route"/></span><div><strong>Jev</strong><span>独立调度控制面</span></div><Icon name="chevron"/></button>
      {(['planner', 'reviewer', 'coordinator', 'researcher', 'explorer', 'worker'] as TeamRole[]).map(role => {
        const nodes = snapshot?.nodes.filter(node => node.role === role) || [];
        const status = roleStatus(nodes);
        return <button type="button" key={role} className={`tm-role-card tm-role-card--${role} ${selected === role ? 'is-selected' : ''} ${status === 'running' ? 'is-active' : ''}`} onClick={() => onSelect(role)} aria-pressed={selected === role}>
          <div className="tm-role-top"><span className={`tm-role-icon tm-role-icon--${role}`}><Icon name={ROLE[role].icon}/></span><span className="tm-role-mode">{role === 'coordinator' ? '团队中枢' : role === 'worker' ? '串行编辑' : role === 'researcher' || role === 'explorer' ? '并行只读' : '按需参与'}</span></div>
          <div className="tm-role-title"><strong>{ROLE[role].name}</strong><span>{role.toUpperCase()}</span></div>
          <span className="tm-role-model" title={modelName(roles[role], catalog, isFixture(snapshot))}>{modelName(roles[role], catalog, isFixture(snapshot))}</span>
          <div className="tm-role-bottom"><Status status={status} count={nodes.filter(node => node.status === 'running').length}/><span>{nodes.length ? `${nodes.length} 个节点` : '岗位配置'}<Icon name="chevron"/></span></div>
        </button>;
      })}
    </div>
    <div className="tm-map-footer"><span><i className="tm-dashed-line"/>岗位关系示意，连线不代表已调用</span><span><i className="tm-live-dot"/>状态来自{isFixture(snapshot) ? '合成示例' : '实际节点'}</span></div>
  </div>;
}

/** Position only reported nodes. Layout never synthesizes execution edges. */
function taskLayout(nodes: TeamNode[], edges: TeamEdge[], vertical: boolean) {
  const ids = new Set(nodes.map(node => node.id));
  const rank = new Map<string, number>();
  const visiting = new Set<string>();
  const incoming = new Map(nodes.map(node => [node.id, [...new Set([...node.dependsOn, ...edges.filter(edge => edge.to === node.id && edge.kind !== 'feedback').map(edge => edge.from)])].filter(id => ids.has(id) && id !== node.id)]));
  function visit(id: string): number {
    if (rank.has(id)) return rank.get(id)!;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const depth = Math.min(nodes.length, Math.max(0, ...(incoming.get(id) || []).map(parent => visit(parent) + 1)));
    visiting.delete(id); rank.set(id, depth); return depth;
  }
  nodes.forEach(node => visit(node.id));
  const columns = new Map<number, TeamNode[]>();
  nodes.forEach(node => { const depth = rank.get(node.id)!; columns.set(depth, [...columns.get(depth) || [], node]); });
  const rows = Math.max(1, ...Array.from(columns.values()).map(column => column.length));
  const ranks = Math.max(0, ...rank.values()) + 1;
  const height = vertical ? Math.max(320, ranks * 146 + 32) : Math.max(320, rows * 156 + 68);
  const positions = new Map<string, { x: number; y: number }>();
  const width = vertical ? Math.max(360, rows * 186 + 26) : Math.max(490, ranks * 236 + 24);
  columns.forEach((column, depth) => column.forEach((node, index) => positions.set(node.id, vertical ? { x: (width - column.length * 186) / 2 + index * 186 + 13, y: 24 + depth * 146 } : { x: 24 + depth * 236, y: (height - column.length * 156) / 2 + index * 156 + 12 })));
  return { positions, width, height };
}
function TaskGraph({ snapshot, selected, onSelect }: { snapshot: TeamSnapshot | null; selected?: string; onSelect: (node: TeamNode) => void }) {
  const [zoom, setZoom] = useState(1);
  const [viewportWidth, setViewportWidth] = useState(400);
  const graphRef = useRef<HTMLDivElement>(null);
  const vertical = viewportWidth < 650;
  useEffect(() => {
    const element = graphRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => setViewportWidth(entries[0]?.contentRect.width || 400));
    observer.observe(element);
    return () => observer.disconnect();
  }, [snapshot?.id, !!snapshot?.nodes.length]);
  const selectedRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { selectedRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [selected]);
  const marker = useId().replace(/:/g, '');
  const layout = useMemo(() => taskLayout(snapshot?.nodes || [], snapshot?.edges || [], vertical), [snapshot?.nodes, snapshot?.edges, vertical]);
  if (!snapshot?.nodes.length) return <div className="tm-empty-graph"><span className="tm-empty-icon"><Icon name="branch"/></span><strong>任务关系将在派发后出现</strong><p>发起 /team 后，已记录的派发、依赖与反馈会显示在这里。</p></div>;
  return <div className={`tm-task-graph ${vertical ? 'tm-task-graph--vertical' : ''}`} ref={graphRef}>
    <div className="tm-graph-tools"><span>{snapshot.nodes.length} 个节点 · {snapshot.edges.length} 条关系</span><div className="tm-graph-controls"><button type="button" className="tm-fit-button" onClick={() => setZoom(Math.min(1, Math.max(.5, Math.floor((viewportWidth - 12) / layout.width * 100) / 100)))}>适应</button><label>缩放<select aria-label="任务图缩放" value={zoom} onChange={e => setZoom(Number(e.target.value))}>{![.5, .75, 1].includes(zoom) && <option value={zoom}>{Math.round(zoom * 100)}%</option>}<option value={.5}>50%</option><option value={.75}>75%</option><option value={1}>100%</option></select></label></div></div>
    <div className="tm-graph-scroll" tabIndex={0} role="region" aria-label="任务关系图，可横向滚动">
      <div style={{ width: layout.width * zoom, height: layout.height * zoom }}><div className="tm-task-canvas" style={{ width: layout.width, height: layout.height, transform: `scale(${zoom})` }}>
        <svg className="tm-task-wires" width={layout.width} height={layout.height} aria-hidden="true"><defs><marker id={marker} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse"><path d="M0 0 6 3 0 6" fill="none" stroke="currentColor" strokeWidth="1"/></marker></defs>{snapshot.edges.map(edge => {
          const from = layout.positions.get(edge.from), to = layout.positions.get(edge.to);
          if (!from || !to) return null;
          const sx = from.x + 192, sy = from.y + 61, tx = to.x - 4, ty = to.y + 61;
          const skip = tx - sx > 100 || tx < sx;
          const verticalPath = `M${from.x + 80} ${from.y + 108} C${from.x + 80} ${from.y + 128}, ${to.x + 80} ${to.y - 20}, ${to.x + 80} ${to.y - 4}`;
          const d = vertical ? verticalPath : skip ? `M${sx} ${sy} C${sx + 22} ${sy}, ${sx + 22} 24, ${sx + 46} 24 L${tx - 28} 24 Q${tx - 8} 24 ${tx - 8} ${ty - 18} L${tx - 8} ${ty - 8} Q${tx - 8} ${ty} ${tx} ${ty}` : `M${sx} ${sy} C${sx + 22} ${sy}, ${tx - 22} ${ty}, ${tx} ${ty}`;
          return <g key={edge.id} className={`tm-edge tm-edge--${edge.kind}`}><title>{`${EDGE[edge.kind]}：${edge.from} → ${edge.to}`}</title><path d={d} markerEnd={`url(#${marker})`}/></g>;
        })}</svg>
        {snapshot.nodes.map(node => { const position = layout.positions.get(node.id)!; return <button type="button" key={node.id} ref={selected === node.id ? selectedRef : undefined} className={`tm-task-node tm-task-node--${node.status} ${selected === node.id ? 'is-selected' : ''}`} style={{ left: position.x, top: position.y }} onClick={() => onSelect(node)} aria-pressed={selected === node.id}><span className="tm-task-role"><Icon name={node.kind === 'verification' ? 'review' : ROLE[node.role]?.icon || 'file'}/>{node.kind === 'verification' ? '宿主验证' : ROLE[node.role]?.name || node.role}<small>#{node.attempt}</small></span><strong>{node.title}</strong><span className="tm-task-foot"><Status status={node.status}/><span>{node.output ? <Icon name="file"/> : null}<Icon name="chevron"/></span></span></button>; })}
      </div></div>
    </div>
    <div className="tm-map-footer"><span><i className="tm-solid-line"/>派发 / 依赖 / 汇总</span><span><i className="tm-feedback-line"/>反馈</span><span><i className="tm-retry-line"/>重试 · 独立节点</span></div>
  </div>;
}

function Inspector({ role, node, snapshot, settings, catalog, onSelectNode, onConfigure, onBack }: { role: TeamNodeRole; node?: TeamNode; snapshot: TeamSnapshot | null; settings: TeamSettings; catalog: TeamCatalog; onSelectNode: (node: TeamNode) => void; onConfigure: () => void; onBack: () => void }) {
  const verificationNode = node?.kind === 'verification';
  const definition = verificationNode ? { name: '宿主验证', subtitle: '独立完成检查', icon: 'review' as IconName, description: '由宿主运行服务端允许的验证配置，并检查修改范围与差异证据。此节点不是模型自报成功。', access: '固定服务端验证配置' } : ROLE[role] || ROLE.worker;
  const selection = role === 'jev' || verificationNode ? undefined : (snapshot?.roles || settings.roles)[role];
  const nodes = snapshot?.nodes.filter(item => item.role === role) || [];
  const relations = node ? snapshot?.edges.filter(edge => edge.from === node.id || edge.to === node.id) || [] : [];
  return <aside className="tm-inspector" aria-label={node ? '节点详情' : '岗位详情'}>
    <button type="button" className="tm-inspector-back" onClick={onBack}><Icon name="arrow"/>返回图谱</button>
    <div className="tm-section-eyebrow"><span>{node ? '节点详情' : '岗位详情'}</span><span>{node ? `第 ${node.attempt} 次执行` : 'ROLE PROFILE'}</span></div>
    <div className="tm-inspector-heading"><span className={`tm-role-icon tm-role-icon--${role}`}><Icon name={definition.icon}/></span><div><h3>{node?.title || definition.name}</h3><Status status={node?.status || roleStatus(nodes)}/></div></div>
    <p className="tm-role-description">{definition.description}</p>
    <dl className="tm-facts"><div><dt>负责角色</dt><dd>{definition.name}</dd></div><div><dt>{role === 'jev' || verificationNode ? '执行方式' : '模型'}</dt><dd>{verificationNode ? '服务端验证检查' : role === 'jev' ? 'Jev · 独立服务' : modelName(selection, catalog, isFixture(snapshot))}</dd></div><div><dt>提供方</dt><dd>{verificationNode ? (isFixture(snapshot) || snapshot?.jev?.mode === 'fixture' ? 'Fixture · 合成验证' : '当前宿主') : role === 'jev' ? (isFixture(snapshot) || catalog.jev?.mode === 'fixture' ? 'Fixture · 未连接 TypeSafe' : catalog.jev?.configured && catalog.jev.available ? 'TypeSafe · 服务端已配置' : 'TypeSafe · 未连接服务') : isFixture(snapshot) && !selection?.provider ? '合成示例' : providerName(selection, catalog)}</dd></div>{selection?.reasoningEffort && <div><dt>思考强度</dt><dd>{catalog.providers.find(p => p.id === selection.provider)?.models.find(m => m.id === selection.model)?.efforts?.find(e => e.id === selection.reasoningEffort)?.name || selection.reasoningEffort}</dd></div>}<div><dt>工作方式</dt><dd>{definition.access}</dd></div>{node && <><div><dt>开始时间</dt><dd>{time(node.startedAt)}</dd></div><div><dt>结束时间</dt><dd>{time(node.finishedAt)}</dd></div></>}</dl>
    {!snapshot && <button type="button" className="tm-button tm-button--wide" onClick={onConfigure}><Icon name="settings"/>配置角色模型<Icon name="arrow"/></button>}
    {node ? <>
      <section className="tm-evidence"><div className="tm-mini-heading"><h4>输出与证据</h4><span>原文</span></div>{node.output ? <pre>{node.output}</pre> : <div className="tm-inline-empty"><Icon name="file"/>尚无公开输出</div>}{node.error && <div className="tm-node-error" role="status"><strong>错误信息</strong><pre>{node.error}</pre></div>}</section>
      {relations.length > 0 && <section className="tm-relations"><h4>关联记录</h4>{relations.map(edge => { const other = snapshot?.nodes.find(item => item.id === (edge.from === node.id ? edge.to : edge.from)); return <button type="button" key={edge.id} disabled={!other} onClick={() => other && onSelectNode(other)}><span className={`tm-relation-tag tm-relation-tag--${edge.kind}`}>{EDGE[edge.kind]}</span><span>{other?.title || (edge.from === node.id ? edge.to : edge.from)}</span><Icon name="chevron"/></button>; })}</section>}
      <details className="tm-source"><summary>来源标识<Icon name="chevron"/></summary><dl><dt>节点 ID</dt><dd>{node.id}</dd>{node.taskId && <><dt>任务 ID</dt><dd>{node.taskId}</dd></>}{node.childId && <><dt>子会话 ID</dt><dd>{node.childId}</dd></>}<dt>运行 ID</dt><dd>{snapshot?.id}</dd></dl></details>
    </> : <section className="tm-role-work"><div className="tm-mini-heading"><h4>已派发节点</h4><span>{nodes.length}</span></div>{nodes.length ? nodes.map(item => <button type="button" key={item.id} onClick={() => onSelectNode(item)}><span><strong>{item.title}</strong><small>第 {item.attempt} 次执行</small></span><Status status={item.status}/><Icon name="chevron"/></button>) : <div className="tm-inline-empty"><Icon name="branch"/>这个岗位还没有派发记录</div>}</section>}
    <div className="tm-inspector-note"><Icon name="lock"/>{isFixture(snapshot) ? '合成数据 · 仅供体验' : '只展示公开产出与真实记录'}</div>
  </aside>;
}

const LIMIT_FIELDS: { key: keyof TeamLimits; label: string; min: number; max: number; suffix: string; factor?: number }[] = [
  { key: 'concurrency', label: '并发上限', min: 1, max: 4, suffix: '个' }, { key: 'maxAgents', label: '总派发上限', min: 1, max: 32, suffix: '次' },
  { key: 'maxTasks', label: '任务数量上限', min: 1, max: 12, suffix: '项' }, { key: 'maxRetries', label: '单任务最大重试', min: 0, max: 2, suffix: '次' },
  { key: 'maxRounds', label: '调度轮次上限', min: 1, max: 8, suffix: '轮' }, { key: 'maxJevCalls', label: 'Jev 调用上限', min: 1, max: 20, suffix: '次' },
  { key: 'maxDurationMs', label: '运行超时', min: 1, max: 30, suffix: '分钟', factor: 60000 }, { key: 'maxStepsPerAgent', label: '每个智能体最大步数', min: 1, max: 16, suffix: '步' },
];
export function TeamSettingsView({ setup, catalog, credential, loading = false, saving = false, error, notice, onSave, onClose, onRefresh, onModelSelectionChange }: TeamSettingsViewProps) {
  const theme = useTeamTheme();
  const [settings, setSettings] = useState<TeamSettings>(setup.settings);
  const [settingsRole, setSettingsRole] = useState<TeamRole>('planner');
  const [disclosureAccepted, setDisclosureAccepted] = useState(setup.disclosureAccepted);
  const [keyDraft, setKeyDraft] = useState('');
  const [localError, setLocalError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const saveLock = useRef(false);
  useEffect(() => { setSettings(setup.settings); setDisclosureAccepted(setup.disclosureAccepted); setKeyDraft(''); }, [setup.revision, setup.settings, setup.disclosureAccepted]);
  const disabled = loading || saving || submitting || setup.writable === false;
  const missingRoles = validateSettings(settings, catalog);
  const invalidLimits = LIMIT_FIELDS.some(field => !Number.isInteger(settings.limits[field.key]) || settings.limits[field.key] < field.min * (field.factor || 1) || settings.limits[field.key] > field.max * (field.factor || 1));
  const keyReady = !!credential?.configured || setup.keyConfigured || (!!keyDraft.trim() && !!credential?.writable);
  const revokingConsent = setup.disclosureAccepted && !disclosureAccepted;
  const canSave = !disabled && !missingRoles.length && !invalidLimits && (revokingConsent || (catalog.available && disclosureAccepted && keyReady));
  function update(role: TeamRole, selection: TeamModelSelection) {
    const clean: TeamModelSelection = { provider: selection.provider, model: selection.model };
    if (selection.reasoningEffort) clean.reasoningEffort = selection.reasoningEffort;
    if (selection.maxTokens !== undefined) clean.maxTokens = selection.maxTokens;
    const roles = { ...settings.roles, [role]: clean };
    setSettings(current => ({ ...current, roles }));
    onModelSelectionChange?.(roles);
  }
  async function save() {
    if (!canSave || saveLock.current) return;
    saveLock.current = true; setSubmitting(true); setLocalError(undefined);
    // Keep the password only in the user-entry state until this explicit save.
    const enteredKey = keyDraft.trim(); setKeyDraft('');
    try { await onSave({ settings, disclosureAccepted, ...(enteredKey ? { jevKey: enteredKey } : {}) }); }
    catch { setLocalError('保存未完成。请刷新确认已保存的设置，再重试；密钥输入已清空。'); }
    finally { saveLock.current = false; setSubmitting(false); }
  }
  return <div className="tm-root tm-setup-root" data-theme={theme}><style>{teamCss}</style><style>{themeCss}</style><section className="tm-settings" aria-label="团队一次性设置">
    <header><div><span className="tm-section-eyebrow">团队设置 / 原生 Desktop</span><h3>配置一次，以后直接 /team</h3><p>选择六个岗位模型并连接 Jev。保存后，在项目聊天输入 /team 和任务目标即可启动。</p></div><div className="tm-settings-header-actions"><TeamThemeSwitch theme={theme}/><button type="button" className="tm-icon-button" onClick={() => { setKeyDraft(''); onClose(); }} aria-label="关闭团队设置"><Icon name="close"/></button></div></header>
    {(error || localError) && <p className="tm-notice tm-notice--error" role="alert"><Icon name="alert"/>{error || localError}</p>}
    {notice && <p className="tm-notice" role="status"><Icon name="check"/>{notice}</p>}
    {!catalog.available && <p className="tm-notice tm-notice--warning"><Icon name="alert"/>{catalog.reason || '无法读取宿主模型目录，请刷新重试。'}</p>}
    {setup.writable === false && <p className="tm-notice tm-notice--warning" role="status">当前宿主的团队设置不可写，请检查使用的 Desktop profile 后刷新。</p>}
    <section className="tm-key-config" aria-label="Jev 连接"><div><h4>Jev API 密钥</h4><span>{credential?.configured || setup.keyConfigured ? '已保存 · 不回显密钥' : '尚未连接'}</span></div><p>密钥仅通过 Desktop 原生凭据服务保存，不进入模型配置、聊天或运行记录。</p>
      <label>{credential?.configured || setup.keyConfigured ? '替换密钥（可选）' : '输入 Jev API 密钥'}<input type="password" aria-label="Jev API 密钥" autoComplete="new-password" spellCheck={false} maxLength={4096} value={keyDraft} disabled={disabled || !credential?.writable} onChange={event => setKeyDraft(event.target.value)} placeholder={credential?.configured || setup.keyConfigured ? '留空保留当前密钥' : '由你输入，不会显示已保存的密钥'}/></label>
      {!credential?.writable && <p className="tm-config-lock"><Icon name="lock"/>{credential?.configured ? '当前凭据来源不允许在此替换。' : '原生凭据存储暂不可写，请检查 Desktop 的凭据服务后刷新。'}</p>}
      <details className="tm-key-storage"><summary>密钥如何保存<Icon name="chevron"/></summary><p>Desktop 原生凭据存储使用本地明文文件，并设置仅文件所属用户可读写的权限。它不是加密保险库，请勿共享凭据文件。</p></details>
    </section>
    <section className="tm-role-settings" aria-label="六岗位模型配置"><div className="tm-settings-section-title"><h4>岗位模型</h4><span>{6 - missingRoles.length} / 6 已配置</span></div><div className="tm-role-settings-layout"><nav className="tm-role-selector" aria-label="选择要配置的岗位">{ROLES.map(role => <button type="button" key={role} aria-pressed={settingsRole === role} onClick={() => setSettingsRole(role)}><Icon name={ROLE[role].icon}/><span><strong>{ROLE[role].name}</strong><small>{modelName(settings.roles[role], catalog)}</small></span><span className={missingRoles.includes(role) ? 'tm-config-missing' : 'tm-config-ready'}><Icon name={missingRoles.includes(role) ? 'alert' : 'check'}/></span><Icon name="chevron"/></button>)}</nav><div className="tm-model-grid">{ROLES.map(role => {
      const selection = settings.roles[role] || { provider: '', model: '' };
      const provider = catalog.providers.find(item => item.id === selection.provider);
      const model = provider?.models.find(item => item.id === selection.model);
      return <fieldset key={role} hidden={settingsRole !== role} className="tm-model-config" disabled={disabled || !catalog.available}><legend><span className={`tm-role-icon tm-role-icon--${role}`}><Icon name={ROLE[role].icon}/></span><strong>{ROLE[role].name}</strong><span>{ROLE[role].subtitle}</span></legend><div className="tm-config-selects"><label>提供方<select aria-label={`${ROLE[role].name}提供方`} value={selection.provider} onChange={e => update(role, { provider: e.target.value, model: '', maxTokens: selection.maxTokens })}><option value="">选择提供方</option>{selection.provider && !provider && <option value={selection.provider} disabled>{selection.provider} · 当前不可用</option>}{catalog.providers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>模型<select aria-label={`${ROLE[role].name}模型`} value={selection.model} disabled={!provider || disabled || !catalog.available} onChange={e => { const next = provider?.models.find(item => item.id === e.target.value); update(role, { ...selection, model: e.target.value, reasoningEffort: next?.defaultEffort }); }}><option value="">选择模型</option>{selection.model && !model && <option value={selection.model} disabled>{selection.model} · 当前不可用</option>}{provider?.models.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><details className="tm-advanced-model"><summary>请求设置<Icon name="chevron"/></summary><div>{!!model?.efforts?.length && <label>推理强度<select aria-label={`${ROLE[role].name}推理强度`} value={selection.reasoningEffort || ''} onChange={e => update(role, { ...selection, reasoningEffort: e.target.value || undefined })}><option value="">使用模型默认值</option>{model.efforts.map(effort => <option key={effort.id} value={effort.id}>{effort.name}</option>)}</select></label>}<label>每次模型请求输出上限<input aria-label={`${ROLE[role].name}每次模型请求输出上限`} type="number" min={128} max={32768} step={128} value={selection.maxTokens ?? ''} placeholder="默认 4096 tokens" onChange={e => update(role, { ...selection, maxTokens: e.target.value === '' ? undefined : Math.min(32768, Math.max(128, Math.trunc(Number(e.target.value)))) })}/></label></div></details></fieldset>;
    })}</div></div></section>
    <div className="tm-config-switches"><label><input type="checkbox" checked={settings.reviewPlan} disabled={disabled} onChange={e => setSettings({ ...settings, reviewPlan: e.target.checked })}/><span><strong>复核初始方案</strong><small>规划完成后由审查者复核</small></span></label><div><strong>Jev 核心调度 · 必须启用</strong><small>分档只调整执行流程，不更换所选模型或提供方</small></div></div>
    <details className="tm-advanced-settings"><summary>高级运行限制<Icon name="chevron"/></summary>
    <div className="tm-limits-header"><h4>运行边界</h4><span>只读工作可并行，编辑始终串行</span></div><div className="tm-limits">{LIMIT_FIELDS.map(field => <label key={field.key}>{field.label}<span><input aria-label={field.label} type="number" min={field.min} max={field.max} step={1} disabled={disabled} value={settings.limits[field.key] / (field.factor || 1)} onChange={e => { const value = Math.min(field.max, Math.max(field.min, Math.trunc(Number(e.target.value) || field.min))); setSettings({ ...settings, limits: { ...settings.limits, [field.key]: value * (field.factor || 1) } }); }}/><small>{field.suffix}</small></span></label>)}</div>
    </details>
    <section className="tm-disclosure" aria-label="以后 /team 的数据使用与权限"><h4>以后每次 /team 的工作方式</h4><p>你主动发送 /team 时，任务目标及工具读取的项目上下文会发给所选模型提供方；有限的目标、上下文摘要、计划、公开产出、差异和验证证据会发送至 TypeSafe 的 Jev 服务，用于分类和逐轮调度。</p><p>系统会在当前项目内发现并运行适用的测试检查，检查文件差异与修改范围。未识别到可安全运行的验证命令时，仍可在允许范围内修改项目，但结果会标为“待验证”，不会宣称验证通过。执行者仅在宿主已有权限内修改项目；新增权限不会自动批准。</p>{catalog.jev?.disclosure && <p>{catalog.jev.disclosure}</p>}<p className="tm-endpoint">TypeSafe 目标：{catalog.jev?.endpoint || '等待宿主提供服务地址'}</p><label><input type="checkbox" aria-label="同意以后主动发起的 team 任务" checked={disclosureAccepted} disabled={disabled} onChange={event => setDisclosureAccepted(event.target.checked)}/><span>我同意以后由我主动发起的 /team 任务按上述方式使用所选模型、发送有限证据至 TypeSafe，并发现和运行当前项目的验证检查。</span></label></section>
    <div className="tm-setup-actions"><button type="button" className="tm-button" onClick={onRefresh} disabled={loading || saving || submitting}><Icon name="refresh"/>刷新设置</button><button type="button" className="tm-button tm-button--primary" onClick={() => void save()} disabled={!canSave}><Icon name="check"/>{saving || submitting ? '正在保存…' : loading ? '正在读取…' : '保存团队设置'}</button></div>
    {missingRoles.length > 0 && <p className="tm-start-hint">请选择{missingRoles.map(role => ROLE[role].name).join('、')}的有效模型。保存后不会自动替换所选模型。</p>}
  </section></div>;
}

export function TeamView({ catalog, history = [], selectedRunId, onSelectRun, sessionId, sessionContext, snapshot, loading = false, error, onCancel, onRefresh, onDemo, settings, configured = false, onOpenSettings }: TeamViewProps) {
  const diagnostic=snapshot?.diagnostic||(!selectedRunId?sessionContext?.diagnostic:undefined);
  const theme = useTeamTheme();
  const [graph, setGraph] = useState<'team' | 'tasks'>('team');
  const [selectedRole, setSelectedRole] = useState<TeamNodeRole>('coordinator');
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [activityOpen, setActivityOpen] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const cancelLock = useRef(false);
  const cancelGeneration = useRef(0);
  const prefix = useId();
  const inspectorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLElement>(null);
  const demo = isFixture(snapshot);
  const active = !!snapshot && !demo && ACTIVE.has(snapshot.status);
  const selectedNode = snapshot?.nodes.find(node => node.id === selectedNodeId);
  const role = selectedNode?.role || selectedRole;
  const nodes = snapshot?.nodes || [];
  const completed = nodes.filter(node => node.status === 'completed').length;
  const running = nodes.filter(node => node.status === 'running').length;
  const events = [...snapshot?.events || []].slice(-30).reverse();
  const runEvidence = snapshot?.jev?.evidence;
  const completionVerified = !!runEvidence && runEvidence.checksPassed && runEvidence.scopeOk && runEvidence.diffAvailable && runEvidence.verified;
  useEffect(() => { cancelGeneration.current++; cancelLock.current = false; setSelectedNodeId(undefined); setLocalError(undefined); setCancelling(false); }, [snapshot?.id, sessionId]);
  useEffect(() => () => { cancelGeneration.current++; }, []);
  const openSettings = onOpenSettings;
  function selectNode(node: TeamNode) { setSelectedNodeId(node.id); setSelectedRole(node.role); }
  function selectRole(next: TeamNodeRole) { setSelectedRole(next); setSelectedNodeId(undefined); }
  async function cancel() {
    if (!active || cancelling || cancelLock.current) return;
    const generation = cancelGeneration.current;
    cancelLock.current = true; setCancelling(true); setLocalError(undefined);
    try { await onCancel(); } catch (failure) { if (generation === cancelGeneration.current) setLocalError(failure instanceof Error ? failure.message : '无法停止，请刷新确认当前状态。'); } finally { if (generation === cancelGeneration.current) { setCancelling(false); cancelLock.current = false; } }
  }
  return <div className="tm-root" data-theme={theme}><style>{teamCss}</style><style>{themeCss}</style><div className="tm-shell">
    <header className="tm-header"><div className="tm-brand"><span className="tm-brand-mark"><Icon name="team"/></span><div><div className="tm-wordmark">DSH <span>/ WORKSPACE</span></div><h1>智能体团队</h1></div></div><div className="tm-header-actions"><button type="button" className={`tm-button tm-button--quiet ${demo ? 'is-demo' : ''}`} onClick={onDemo} disabled={active}><Icon name="play"/>演示</button><button type="button" className="tm-icon-button" onClick={() => void onRefresh()} disabled={loading} aria-label={demo ? '返回实时视图' : '刷新团队状态'} title={demo ? '返回实时视图' : '刷新团队状态'}><Icon name="refresh" className={loading ? 'is-spinning' : ''}/></button><TeamThemeSwitch theme={theme}/></div></header>
    {demo && <div className="tm-demo-banner"><span>演示</span><p>合成数据 · 未调用真实模型或 TypeSafe，未修改项目。</p><button type="button" onClick={() => void onRefresh()}>返回实时<Icon name="arrow"/></button></div>}
    {(error || localError) && <div className="tm-notice tm-notice--error" role="alert"><Icon name="alert"/><span>{localError || error}</span></div>}
    <main className="tm-main">
      <section className="tm-overview"><div><div className="tm-section-eyebrow"><span>{snapshot ? '当前任务' : '工作台'}</span><span className="tm-session"><i/>{demo ? '示例会话' : sessionId ? '已连接当前会话' : '等待 Desktop 会话'}</span></div><h2>{snapshot?.goal || (configured ? '团队已就位' : '连接你的工作团队')}</h2>{snapshot ? <details className="tm-run-description"><summary>运行说明<Icon name="chevron"/></summary><p>{snapshot.message || '任务按实际需要派发，研究与探索并行，编辑工作串行。'}</p></details> : <p>在聊天中使用 /team 发起任务。</p>}</div>{snapshot && <div className="tm-run-state"><Status status={snapshot.status === 'completed' && !completionVerified ? 'completion_unverified' : snapshot.status}/><span>{snapshot.finishedAt ? duration(snapshot) : `开始于 ${time(snapshot.startedAt)}`}</span></div>}</section>
      <div className="tm-summary-strip"><div><Icon name="team"/><span>岗位</span><strong>6</strong></div><div><Icon name="branch"/><span>节点</span><strong>{nodes.length}</strong></div><div><Icon name="activity"/><span>执行中</span><strong>{running}<small> / {(snapshot?.limits || settings.limits).concurrency}</small></strong></div><div><Icon name="check"/><span>完成</span><strong>{completed}</strong></div></div>
      <JevPanel catalog={catalog} snapshot={snapshot} settings={settings} onSelectNode={node => { setGraph('tasks'); selectNode(node); }}/>
      {history.length>1&&<label className="tm-notice">本会话运行 <select aria-label="本会话运行历史" value={selectedRunId||''} onChange={event=>onSelectRun?.(event.target.value||undefined)}><option value="">最新运行</option>{history.filter(row=>row.sessionId===sessionId).map(row=><option key={row.id} value={row.id}>{row.id} · {row.finishedAt?'历史':'进行中'} · {row.goal.slice(0,60)}</option>)}</select></label>}
      {diagnostic&&<p className="tm-notice" role="status">检查阶段：{diagnostic.phase}；原因：{diagnostic.reason}；宿主分类：{diagnostic.code} / {diagnostic.kind}{diagnostic.exitCode===undefined?'':' / exit '+diagnostic.exitCode}</p>}
      {sessionContext?.occupancy&&<p className="tm-notice" role="status">项目占用：会话 {sessionContext.occupancy.sessionId} · {sessionContext.occupancy.state}{sessionContext.occupancy.runId?' · '+sessionContext.occupancy.runId:''}</p>}
      <div className="tm-workspace"><section className="tm-graph-panel" ref={canvasRef} aria-label="团队与任务可视化"><div className="tm-panel-header"><div className="tm-tabs" role="tablist" aria-label="图表视图"><button type="button" role="tab" id={`${prefix}-team-tab`} aria-controls={`${prefix}-graph`} aria-selected={graph === 'team'} tabIndex={graph === 'team' ? 0 : -1} onClick={() => setGraph('team')} onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setGraph('tasks'); (e.currentTarget.nextElementSibling as HTMLElement)?.focus(); } }}><Icon name="team"/>团队拓扑</button><button type="button" role="tab" id={`${prefix}-tasks-tab`} aria-controls={`${prefix}-graph`} aria-selected={graph === 'tasks'} tabIndex={graph === 'tasks' ? 0 : -1} onClick={() => setGraph('tasks')} onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setGraph('team'); (e.currentTarget.previousElementSibling as HTMLElement)?.focus(); } }}><Icon name="branch"/>任务关系{nodes.length > 0 && <span>{nodes.length}</span>}</button></div><button type="button" className="tm-button tm-button--quiet tm-config-trigger" aria-label="团队设置" onClick={openSettings}><Icon name="settings"/><span>团队设置</span></button></div><div className="tm-graph-caption"><span>{graph === 'team' ? '岗位配置' : '动态任务图'}</span><span className="tm-graph-context">{selectedNode ? selectedNode.title : ROLE[role].name}</span><button type="button" className="tm-inspect-jump" onClick={() => inspectorRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' })}>查看详情<Icon name="arrow"/></button></div><div role="tabpanel" id={`${prefix}-graph`} aria-labelledby={`${prefix}-${graph}-tab`}>{graph === 'team' ? <Topology snapshot={snapshot} settings={settings} catalog={catalog} selected={!selectedNodeId ? role : undefined} onSelect={selectRole}/> : <TaskGraph snapshot={snapshot} selected={selectedNodeId} onSelect={selectNode}/>}</div></section><div className="tm-inspector-wrap" ref={inspectorRef}><Inspector role={role} node={selectedNode} snapshot={snapshot} settings={settings} catalog={catalog} onSelectNode={selectNode} onConfigure={openSettings} onBack={() => canvasRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' })}/></div></div>
      {snapshot && <section className="tm-activity"><button type="button" className="tm-activity-toggle" onClick={() => setActivityOpen(!activityOpen)} aria-expanded={activityOpen} aria-controls={`${prefix}-events`}><Icon name="activity"/><strong>团队动态</strong><span>{demo ? '合成事件' : '最近事件'} · {Math.min(snapshot.events.length, 30)} 条</span><Icon name="chevron"/></button>{activityOpen && <div id={`${prefix}-events`} className="tm-event-list" aria-label="最近团队事件">{events.length ? events.map(event => { const eventNode = nodes.find(node => node.id === event.nodeId); return <button type="button" key={event.seq} className={`tm-event ${/retry|feedback/.test(event.type) ? 'tm-event--feedback' : ''}`} disabled={!eventNode} onClick={() => eventNode && selectNode(eventNode)}><span className="tm-event-icon"><Icon name={/retry|feedback/.test(event.type) ? 'refresh' : eventNode ? eventNode.kind === 'verification' ? 'review' : ROLE[eventNode.role]?.icon || 'activity' : 'activity'}/></span><strong>{eventNode ? eventNode.kind === 'verification' ? '宿主验证' : ROLE[eventNode.role]?.name || eventNode.role : '团队'}</strong><span>{event.message}</span><time dateTime={event.at}>{time(event.at)}</time></button>; }) : <p className="tm-inline-empty">尚无事件记录</p>}{snapshot.events.length > 30 && <p className="tm-event-bound">显示最近 30 条事件，节点详情保留独立产出。</p>}</div>}</section>}
      {active ? <section className="tm-running-bar"><span className="tm-running-indicator"/><div><strong>团队正在处理当前任务</strong><p>停止只影响本次运行；不会回滚已经产生的文件修改。</p></div><button type="button" className="tm-button tm-button--danger" onClick={() => void cancel()} disabled={cancelling}><Icon name="stop"/>{cancelling ? '正在停止…' : '停止本次运行'}</button></section> : <section className="tm-command-guide" aria-label="使用 team 命令"><span className="tm-command-icon"><Icon name="team"/></span><div><h3>{configured ? '在聊天中给团队一个目标' : '先完成一次团队设置'}</h3><p>{configured ? '输入 /team 和任务目标，团队会自动开始，进展显示在这里。' : '选择六个岗位模型、保存 Jev 密钥后，以后直接在聊天中使用 /team。'}</p><code>/team 检查购物车数量更新问题，修复实现并验证</code>{sessionContext?.reason && <p className="tm-start-hint">{sessionContext.reason}</p>}{!sessionId && <p className="tm-start-hint">请先在 Desktop 打开一个项目会话。</p>}</div><button type="button" className="tm-button" onClick={openSettings}><Icon name="settings"/>{configured ? '团队设置' : '完成设置'}<Icon name="arrow"/></button></section>}
      <footer className="tm-footer"><span><Icon name="lock"/>{demo ? '全部为合成示例 · 未派发智能体' : '六岗位独立选型 · Jev 核心调度 · 硬性完成验证'}</span><span>DSH <i/> TEAM WORKFLOW</span></footer>
    </main>
  </div></div>;
}
