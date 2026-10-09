import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { TeamCatalog, TeamEdge, TeamLimits, TeamModelSelection, TeamNode, TeamNodeStatus, TeamRole, TeamSettings, TeamSnapshot, TeamViewProps } from './team-types';
import teamCss from './team.css';
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
const ROLE: Record<TeamRole, { name: string; subtitle: string; icon: IconName; description: string; access: string }> = {
  planner: { name: '规划者', subtitle: '强模型规划', icon: 'plan', description: '理解目标，提出任务拆分、依赖和验收条件。实际任务随目标生成。', access: '只读分析' },
  coordinator: { name: '协调者', subtitle: '主力协调', icon: 'coordinate', description: '在派发前整合并细化任务图，明确任务依赖与验收要求。后续由有界调度器执行。', access: '只读协调' },
  researcher: { name: '研究者', subtitle: '轻量研究', icon: 'search', description: '收集依据、比较方案，向团队提供简明的研究结论。', access: '可并行 · 只读' },
  explorer: { name: '探索者', subtitle: '代码探索', icon: 'explore', description: '检查项目结构与相关代码，定位实现路径和验证依据。', access: '可并行 · 只读' },
  worker: { name: '执行者', subtitle: '主力执行', icon: 'code', description: '根据明确任务实施代码变更。编辑串行执行，遵循 Desktop 现有权限。', access: '串行编辑' },
  reviewer: { name: '审查者', subtitle: '按需强审查', icon: 'review', description: '审查方案和产出，提出具体反馈。方案重试保留独立记录；最终审查问题会阻塞交付。', access: '只读审查' },
  router: { name: '路由判断', subtitle: '可选前置判断', icon: 'route', description: '使用单独配置的模型判断请求。只有开启并配置后才会参与。', access: '只读判断' },
};
const ROLES: TeamRole[] = ['planner', 'coordinator', 'researcher', 'explorer', 'worker', 'reviewer'];
const STATUS: Record<string, string> = { pending: '待执行', running: '进行中', completed: '已完成', failed: '失败', blocked: '已阻塞', cancelled: '已取消', planning: '规划中', reviewing: '审查中', idle: '未派发' };
const EDGE: Record<TeamEdge['kind'], string> = { dispatch: '派发', dependency: '依赖', feedback: '反馈', retry: '重试', join: '汇总' };
const ACTIVE = new Set(['planning', 'running', 'reviewing']);
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
  const roles = settings.routeEnabled ? [...ROLES, 'router' as TeamRole] : ROLES;
  return roles.filter(role => {
    const selected = settings.roles[role];
    const model = catalog.providers.find(p => p.id === selected?.provider)?.models.find(m => m.id === selected?.model);
    return !model || (!!selected?.reasoningEffort && !(model.efforts || []).some(effort => effort.id === selected.reasoningEffort));
  });
}

function Topology({ snapshot, settings, catalog, selected, onSelect }: { snapshot: TeamSnapshot | null; settings: TeamSettings; catalog: TeamCatalog; selected?: TeamRole; onSelect: (role: TeamRole) => void }) {
  const roles = snapshot?.roles || settings.roles;
  const showRouter = snapshot ? !!snapshot.roles.router : settings.routeEnabled;
  return <div className="tm-topology">
    <div className="tm-topology-map">
      <svg className="tm-topology-wires" viewBox="0 0 840 432" preserveAspectRatio="none" aria-hidden="true"><path d="M142 70H420V216M698 70H420M420 216V362M142 362V292H698V362"/><circle cx="420" cy="146" r="4"/><circle cx="420" cy="292" r="4"/></svg>
      {(['planner', 'reviewer', 'coordinator', 'researcher', 'explorer', 'worker'] as TeamRole[]).map(role => {
        const nodes = snapshot?.nodes.filter(node => node.role === role) || [];
        const status = roleStatus(nodes);
        return <button type="button" key={role} className={`tm-role-card tm-role-card--${role} ${selected === role ? 'is-selected' : ''} ${status === 'running' ? 'is-active' : ''}`} onClick={() => onSelect(role)} aria-pressed={selected === role}>
          <div className="tm-role-top"><span className={`tm-role-icon tm-role-icon--${role}`}><Icon name={ROLE[role].icon}/></span><span className="tm-role-mode">{role === 'coordinator' ? '团队中枢' : role === 'worker' ? '串行编辑' : role === 'researcher' || role === 'explorer' ? '并行只读' : '按需参与'}</span></div>
          <div className="tm-role-title"><strong>{ROLE[role].name}</strong><span>{ROLE[role].subtitle}</span></div>
          <span className="tm-role-model" title={modelName(roles[role], catalog, snapshot?.demo)}>{modelName(roles[role], catalog, snapshot?.demo)}</span>
          <div className="tm-role-bottom"><Status status={status} count={nodes.filter(node => node.status === 'running').length}/><span>{nodes.length ? `${nodes.length} 个节点` : '岗位配置'}<Icon name="chevron"/></span></div>
        </button>;
      })}
    </div>
    {showRouter && <button type="button" className={`tm-router-strip ${selected === 'router' ? 'is-selected' : ''}`} onClick={() => onSelect('router')} aria-pressed={selected === 'router'}><Icon name="route"/><strong>路由判断</strong><span>{modelName(roles.router, catalog, snapshot?.demo)}</span><Status status={roleStatus(snapshot?.nodes.filter(node => node.role === 'router') || [])}/><Icon name="chevron"/></button>}
    <div className="tm-map-footer"><span><i className="tm-dashed-line"/>岗位关系示意，连线不代表已调用</span><span><i className="tm-live-dot"/>状态来自{snapshot?.demo ? '合成示例' : '实际节点'}</span></div>
  </div>;
}

/** Position only reported nodes. Layout never synthesizes execution edges. */
function taskLayout(nodes: TeamNode[], edges: TeamEdge[]) {
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
  const height = Math.max(320, rows * 156 + 68);
  const positions = new Map<string, { x: number; y: number }>();
  columns.forEach((column, depth) => column.forEach((node, index) => positions.set(node.id, { x: 24 + depth * 236, y: (height - column.length * 156) / 2 + index * 156 + 12 })));
  return { positions, width: Math.max(490, (Math.max(0, ...rank.values()) + 1) * 236 + 24), height };
}
function TaskGraph({ snapshot, selected, onSelect }: { snapshot: TeamSnapshot | null; selected?: string; onSelect: (node: TeamNode) => void }) {
  const [zoom, setZoom] = useState(1);
  const marker = useId().replace(/:/g, '');
  const layout = useMemo(() => taskLayout(snapshot?.nodes || [], snapshot?.edges || []), [snapshot?.nodes, snapshot?.edges]);
  if (!snapshot?.nodes.length) return <div className="tm-empty-graph"><span className="tm-empty-icon"><Icon name="branch"/></span><strong>任务关系将在派发后出现</strong><p>规划与协调角色根据目标生成任务。<br/>这里仅显示实际记录的节点、依赖和反馈。</p></div>;
  return <div className="tm-task-graph">
    <div className="tm-graph-tools"><span>{snapshot.nodes.length} 个节点 · {snapshot.edges.length} 条实际关系</span><label>缩放<select value={zoom} onChange={e => setZoom(Number(e.target.value))}><option value={.5}>50%</option><option value={.75}>75%</option><option value={1}>100%</option></select></label></div>
    <div className="tm-graph-scroll" tabIndex={0} role="region" aria-label="任务关系图，可横向滚动">
      <div style={{ width: layout.width * zoom, height: layout.height * zoom }}><div className="tm-task-canvas" style={{ width: layout.width, height: layout.height, transform: `scale(${zoom})` }}>
        <svg className="tm-task-wires" width={layout.width} height={layout.height} aria-hidden="true"><defs><marker id={marker} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse"><path d="M0 0 6 3 0 6" fill="none" stroke="currentColor" strokeWidth="1"/></marker></defs>{snapshot.edges.map(edge => {
          const from = layout.positions.get(edge.from), to = layout.positions.get(edge.to);
          if (!from || !to) return null;
          const sx = from.x + 192, sy = from.y + 61, tx = to.x - 4, ty = to.y + 61;
          const skip = tx - sx > 100 || tx < sx;
          const d = skip ? `M${sx} ${sy} C${sx + 22} ${sy}, ${sx + 22} 24, ${sx + 46} 24 L${tx - 28} 24 Q${tx - 8} 24 ${tx - 8} ${ty - 18} L${tx - 8} ${ty - 8} Q${tx - 8} ${ty} ${tx} ${ty}` : `M${sx} ${sy} C${sx + 22} ${sy}, ${tx - 22} ${ty}, ${tx} ${ty}`;
          return <g key={edge.id} className={`tm-edge tm-edge--${edge.kind}`}><title>{`${EDGE[edge.kind]}：${edge.from} → ${edge.to}`}</title><path d={d} markerEnd={`url(#${marker})`}/></g>;
        })}</svg>
        {snapshot.nodes.map(node => { const position = layout.positions.get(node.id)!; return <button type="button" key={node.id} className={`tm-task-node tm-task-node--${node.status} ${selected === node.id ? 'is-selected' : ''}`} style={{ left: position.x, top: position.y }} onClick={() => onSelect(node)} aria-pressed={selected === node.id}><span className="tm-task-role"><Icon name={ROLE[node.role]?.icon || 'file'}/>{ROLE[node.role]?.name || node.role}<small>#{node.attempt}</small></span><strong>{node.title}</strong><span className="tm-task-foot"><Status status={node.status}/><span>{node.output ? <Icon name="file"/> : null}<Icon name="chevron"/></span></span></button>; })}
      </div></div>
    </div>
    <div className="tm-map-footer"><span><i className="tm-solid-line"/>派发 / 依赖 / 汇总</span><span><i className="tm-feedback-line"/>反馈</span><span><i className="tm-retry-line"/>重试 · 独立节点</span></div>
  </div>;
}

function Inspector({ role, node, snapshot, settings, catalog, onSelectNode, onConfigure }: { role: TeamRole; node?: TeamNode; snapshot: TeamSnapshot | null; settings: TeamSettings; catalog: TeamCatalog; onSelectNode: (node: TeamNode) => void; onConfigure: () => void }) {
  const definition = ROLE[role] || ROLE.worker;
  const selection = (snapshot?.roles || settings.roles)[role];
  const nodes = snapshot?.nodes.filter(item => item.role === role) || [];
  const relations = node ? snapshot?.edges.filter(edge => edge.from === node.id || edge.to === node.id) || [] : [];
  return <aside className="tm-inspector" aria-label={node ? '节点详情' : '岗位详情'}>
    <div className="tm-section-eyebrow"><span>{node ? '节点详情' : '岗位详情'}</span><span>{node ? `第 ${node.attempt} 次执行` : 'ROLE PROFILE'}</span></div>
    <div className="tm-inspector-heading"><span className={`tm-role-icon tm-role-icon--${role}`}><Icon name={definition.icon}/></span><div><h3>{node?.title || definition.name}</h3><Status status={node?.status || roleStatus(nodes)}/></div></div>
    <p className="tm-role-description">{definition.description}</p>
    <dl className="tm-facts"><div><dt>负责角色</dt><dd>{definition.name}</dd></div><div><dt>模型</dt><dd title={modelName(selection, catalog, snapshot?.demo)}>{modelName(selection, catalog, snapshot?.demo)}</dd></div><div><dt>提供方</dt><dd>{snapshot?.demo && !selection?.provider ? '合成示例' : providerName(selection, catalog)}</dd></div>{selection?.reasoningEffort && <div><dt>思考强度</dt><dd>{catalog.providers.find(p => p.id === selection.provider)?.models.find(m => m.id === selection.model)?.efforts?.find(e => e.id === selection.reasoningEffort)?.name || selection.reasoningEffort}</dd></div>}<div><dt>工作方式</dt><dd>{definition.access}</dd></div>{node && <><div><dt>开始时间</dt><dd>{time(node.startedAt)}</dd></div><div><dt>结束时间</dt><dd>{time(node.finishedAt)}</dd></div></>}</dl>
    {!snapshot && <button type="button" className="tm-button tm-button--wide" onClick={onConfigure}><Icon name="settings"/>配置角色模型<Icon name="arrow"/></button>}
    {node ? <>
      <section className="tm-evidence"><div className="tm-mini-heading"><h4>输出与证据</h4><span>原文</span></div>{node.output ? <pre>{node.output}</pre> : <div className="tm-inline-empty"><Icon name="file"/>尚无公开输出</div>}{node.error && <div className="tm-node-error" role="status"><strong>错误信息</strong><pre>{node.error}</pre></div>}</section>
      {relations.length > 0 && <section className="tm-relations"><h4>关联记录</h4>{relations.map(edge => { const other = snapshot?.nodes.find(item => item.id === (edge.from === node.id ? edge.to : edge.from)); return <button type="button" key={edge.id} disabled={!other} onClick={() => other && onSelectNode(other)}><span className={`tm-relation-tag tm-relation-tag--${edge.kind}`}>{EDGE[edge.kind]}</span><span>{other?.title || (edge.from === node.id ? edge.to : edge.from)}</span><Icon name="chevron"/></button>; })}</section>}
      <details className="tm-source"><summary>来源标识<Icon name="chevron"/></summary><dl><dt>节点 ID</dt><dd>{node.id}</dd>{node.taskId && <><dt>任务 ID</dt><dd>{node.taskId}</dd></>}{node.childId && <><dt>子会话 ID</dt><dd>{node.childId}</dd></>}<dt>运行 ID</dt><dd>{snapshot?.id}</dd></dl></details>
    </> : <section className="tm-role-work"><div className="tm-mini-heading"><h4>已派发节点</h4><span>{nodes.length}</span></div>{nodes.length ? nodes.map(item => <button type="button" key={item.id} onClick={() => onSelectNode(item)}><span><strong>{item.title}</strong><small>第 {item.attempt} 次执行</small></span><Status status={item.status}/><Icon name="chevron"/></button>) : <div className="tm-inline-empty"><Icon name="branch"/>这个岗位还没有派发记录</div>}</section>}
    <div className="tm-inspector-note"><Icon name="lock"/>{snapshot?.demo ? '合成数据 · 仅供体验' : '只展示公开产出与真实记录'}</div>
  </aside>;
}

const LIMIT_FIELDS: { key: keyof TeamLimits; label: string; min: number; max: number; suffix: string; factor?: number }[] = [
  { key: 'concurrency', label: '并发上限', min: 1, max: 4, suffix: '个' }, { key: 'maxAgents', label: '总派发上限', min: 1, max: 32, suffix: '次' },
  { key: 'maxTasks', label: '任务数量上限', min: 1, max: 12, suffix: '项' }, { key: 'maxRetries', label: '单任务最大重试', min: 0, max: 2, suffix: '次' },
  { key: 'maxDurationMs', label: '运行超时', min: 1, max: 30, suffix: '分钟', factor: 60000 }, { key: 'maxStepsPerAgent', label: '每个智能体最大步数', min: 1, max: 16, suffix: '步' },
];
function SettingsPanel({ settings, catalog, disabled, onChange, onClose }: { settings: TeamSettings; catalog: TeamCatalog; disabled: boolean; onChange: (settings: TeamSettings) => void; onClose: () => void }) {
  const visibleRoles = settings.routeEnabled ? [...ROLES, 'router' as TeamRole] : ROLES;
  function update(role: TeamRole, selection: TeamModelSelection) {
    const clean: TeamModelSelection = { provider: selection.provider, model: selection.model };
    if (selection.reasoningEffort) clean.reasoningEffort = selection.reasoningEffort;
    if (selection.maxTokens !== undefined) clean.maxTokens = selection.maxTokens;
    onChange({ ...settings, roles: { ...settings.roles, [role]: clean } });
  }
  function toggleRouter(enabled: boolean) {
    const roles = { ...settings.roles };
    if (enabled) roles.router ||= { provider: '', model: '', maxTokens: 4096 };
    else delete roles.router;
    onChange({ ...settings, routeEnabled: enabled, roles });
  }
  return <section className="tm-settings" aria-label="模型与运行限制"><header><div><span className="tm-section-eyebrow">TEAM SETTINGS</span><h3>让合适的模型，做合适的事</h3><p>每个岗位独立选型。模型与思考强度均来自 Desktop 当前目录。</p></div><button type="button" className="tm-icon-button" onClick={onClose} aria-label="收起模型配置"><Icon name="close"/></button></header>
    {!catalog.available && <div className="tm-notice tm-notice--warning"><Icon name="alert"/><span>{catalog.reason || '暂时无法读取 Desktop 模型目录。请刷新后再配置。'}</span></div>}
    {disabled && <p className="tm-config-lock"><Icon name="lock"/>当前运行或演示期间配置只读，结束后可调整下一次运行。</p>}
    <div className="tm-model-grid">{visibleRoles.map(role => {
      const selection = settings.roles[role] || { provider: '', model: '' };
      const provider = catalog.providers.find(item => item.id === selection.provider);
      const model = provider?.models.find(item => item.id === selection.model);
      return <fieldset key={role} className="tm-model-config" disabled={disabled || !catalog.available}><legend><span className={`tm-role-icon tm-role-icon--${role}`}><Icon name={ROLE[role].icon}/></span><strong>{ROLE[role].name}</strong><span>{ROLE[role].subtitle}</span></legend><div className="tm-config-selects"><label>提供方<select aria-label={`${ROLE[role].name}提供方`} value={provider ? selection.provider : ''} onChange={e => update(role, { provider: e.target.value, model: '', maxTokens: selection.maxTokens })}><option value="">选择提供方</option>{catalog.providers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>模型<select aria-label={`${ROLE[role].name}模型`} value={model ? selection.model : ''} disabled={!provider || disabled || !catalog.available} onChange={e => { const next = provider?.models.find(item => item.id === e.target.value); update(role, { ...selection, model: e.target.value, reasoningEffort: next?.defaultEffort }); }}><option value="">选择模型</option>{provider?.models.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><details className="tm-advanced-model"><summary>请求设置<Icon name="chevron"/></summary><div>{!!model?.efforts?.length && <label>推理强度<select aria-label={`${ROLE[role].name}推理强度`} value={selection.reasoningEffort || ''} onChange={e => update(role, { ...selection, reasoningEffort: e.target.value || undefined })}><option value="">使用模型默认值</option>{model.efforts.map(effort => <option key={effort.id} value={effort.id}>{effort.name}</option>)}</select></label>}<label>每次模型请求输出上限<input aria-label={`${ROLE[role].name}每次模型请求输出上限`} type="number" min={128} max={32768} step={128} value={selection.maxTokens ?? ''} placeholder="默认 4096 tokens" onChange={e => update(role, { ...selection, maxTokens: e.target.value === '' ? undefined : Math.min(32768, Math.max(128, Math.trunc(Number(e.target.value)))) })}/></label></div></details></fieldset>;
    })}</div>
    <div className="tm-config-switches"><label><input type="checkbox" checked={settings.reviewPlan} disabled={disabled} onChange={e => onChange({ ...settings, reviewPlan: e.target.checked })}/><span><strong>复核初始方案</strong><small>规划完成后由审查者复核</small></span></label><label><input type="checkbox" checked={settings.routeEnabled} disabled={disabled} onChange={e => toggleRouter(e.target.checked)}/><span><strong>启用路由判断</strong><small>可选角色，需要单独选择模型</small></span></label></div>
    <div className="tm-limits-header"><h4>运行边界</h4><span>只读工作可并行，编辑始终串行</span></div><div className="tm-limits">{LIMIT_FIELDS.map(field => <label key={field.key}>{field.label}<span><input aria-label={field.label} type="number" min={field.min} max={field.max} step={1} disabled={disabled} value={settings.limits[field.key] / (field.factor || 1)} onChange={e => { const value = Math.min(field.max, Math.max(field.min, Math.trunc(Number(e.target.value) || field.min))); onChange({ ...settings, limits: { ...settings.limits, [field.key]: value * (field.factor || 1) } }); }}/><small>{field.suffix}</small></span></label>)}</div>
    <p className="tm-permission-note"><Icon name="lock"/>继承宿主权限。子智能体的新增权限请求会被拒绝，不会自动批准。</p>
  </section>;
}

export function TeamView({ catalog, sessionId, sessionContext, snapshot, loading = false, error, onStart, onCancel, onRefresh, onDemo, settings, onSettingsChange }: TeamViewProps) {
  const [graph, setGraph] = useState<'team' | 'tasks'>('team');
  const [selectedRole, setSelectedRole] = useState<TeamRole>('coordinator');
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(true);
  const [goal, setGoal] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const settingsRef = useRef<HTMLDivElement>(null);
  const goalRef = useRef<HTMLTextAreaElement>(null);
  const startLock = useRef(false);
  const cancelLock = useRef(false);
  const confirmedInput = useRef<string>();
  const confirmRef = useRef<HTMLElement>(null);
  const prefix = useId();
  const active = !!snapshot && !snapshot.demo && ACTIVE.has(snapshot.status);
  const demo = !!snapshot?.demo;
  const missingRoles = validateSettings(settings, catalog);
  const limitInvalid = LIMIT_FIELDS.some(field => !Number.isFinite(settings.limits[field.key]) || settings.limits[field.key] < field.min * (field.factor || 1) || settings.limits[field.key] > field.max * (field.factor || 1));
  const selectedNode = snapshot?.nodes.find(node => node.id === selectedNodeId);
  const role = selectedNode?.role || selectedRole;
  const nodes = snapshot?.nodes || [];
  const completed = nodes.filter(node => node.status === 'completed').length;
  const running = nodes.filter(node => node.status === 'running').length;
  const events = [...snapshot?.events || []].slice(-30).reverse();
  const blocker = demo ? '演示期间不会启动真实任务。返回实时视图后可运行。' : active ? '当前团队仍在运行。' : !sessionId ? '请先在 Desktop 打开一个项目会话。' : sessionContext?.canStart === false ? (sessionContext.reason || '当前会话暂不允许启动团队。') : !catalog.available ? (catalog.reason || '模型目录暂不可用，请刷新后重试。') : missingRoles.length ? `请先配置${missingRoles.map(item => ROLE[item].name).join('、')}的有效模型。` : limitInvalid ? '请检查运行边界是否在允许范围内。' : !goal.trim() ? '写下目标后，先检查本次运行配置。' : '';
  const canStart = !blocker && !submitting && !loading;
  useEffect(() => { setSelectedNodeId(undefined); setConfirming(false); setLocalError(undefined); setCancelling(false); }, [snapshot?.id, sessionId]);
  useEffect(() => { setGoal(''); setConfirming(false); }, [sessionId]);
  useEffect(() => { setConfirming(false); }, [settings, goal, sessionContext?.contextKey, sessionContext?.workspace, sessionContext?.permissionNotice]);
  function openSettings() { setSettingsOpen(true); setTimeout(() => settingsRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 0); }
  function selectNode(node: TeamNode) { setSelectedNodeId(node.id); setSelectedRole(node.role); }
  function selectRole(next: TeamRole) { setSelectedRole(next); setSelectedNodeId(undefined); }
  async function start() {
    if (!canStart || !confirming || startLock.current || confirmedInput.current !== JSON.stringify({ sessionId, contextKey: sessionContext?.contextKey, workspace: sessionContext?.workspace, permissionNotice: sessionContext?.permissionNotice, goal: goal.trim(), settings })) return;
    startLock.current = true; setSubmitting(true); setLocalError(undefined);
    try { await onStart({ goal: goal.trim(), settings }); setConfirming(false); } catch (failure) { setLocalError(failure instanceof Error ? failure.message : '无法启动，请检查连接后重试。'); } finally { setSubmitting(false); startLock.current = false; }
  }
  async function cancel() {
    if (!active || cancelling || cancelLock.current) return;
    cancelLock.current = true; setCancelling(true); setLocalError(undefined);
    try { await onCancel(); } catch (failure) { setLocalError(failure instanceof Error ? failure.message : '无法停止，请刷新确认当前状态。'); } finally { setCancelling(false); cancelLock.current = false; }
  }
  return <div className="tm-root"><style>{teamCss}</style><div className="tm-shell">
    <header className="tm-header"><div className="tm-brand"><span className="tm-brand-mark"><Icon name="team"/></span><div><div className="tm-wordmark">DEEPSEEK HARNESS <span>/ 桌面版</span></div><h1>智能体团队<span>TEAM</span></h1></div></div><div className="tm-header-actions"><button type="button" className={`tm-button tm-button--quiet ${demo ? 'is-demo' : ''}`} onClick={onDemo} disabled={active || submitting}><Icon name="play"/>演示</button><button type="button" className="tm-icon-button" onClick={() => void onRefresh()} disabled={loading} aria-label={demo ? '返回实时视图' : '刷新团队状态'} title={demo ? '返回实时视图' : '刷新团队状态'}><Icon name="refresh" className={loading ? 'is-spinning' : ''}/></button></div></header>
    {demo && <div className="tm-demo-banner"><span>演示</span><p>合成团队与任务记录。未调用模型，也不会修改项目。</p><button type="button" onClick={() => void onRefresh()}>返回实时<Icon name="arrow"/></button></div>}
    {(error || localError) && <div className="tm-notice tm-notice--error" role="alert"><Icon name="alert"/><span>{localError || error}</span></div>}
    <main className="tm-main">
      <section className="tm-overview"><div><div className="tm-section-eyebrow"><span>{snapshot ? '当前任务' : '多模型 · 多智能体'}</span><span className="tm-session"><i/>{demo ? '示例会话' : sessionId ? '已连接当前会话' : '等待 Desktop 会话'}</span></div><h2>{snapshot?.goal || '为复杂任务，组建一支团队。'}</h2><p>{snapshot ? (snapshot.message || '任务按实际需要派发，研究与探索并行，编辑工作串行。') : '独立选型，按需分工。让规划、研究、执行与审查各司其职。'}</p></div>{snapshot && <div className="tm-run-state"><Status status={snapshot.status}/><span>{snapshot.finishedAt ? duration(snapshot) : `开始于 ${time(snapshot.startedAt)}`}</span></div>}</section>
      <div className="tm-summary-strip"><div><Icon name="team"/><span>团队岗位</span><strong>{(snapshot ? !!snapshot.roles.router : settings.routeEnabled) ? 7 : 6}</strong></div><div><Icon name="branch"/><span>已派发节点</span><strong>{nodes.length}</strong></div><div><Icon name="activity"/><span>正在执行</span><strong>{running}<small> / {(snapshot?.limits || settings.limits).concurrency}</small></strong></div><div><Icon name="check"/><span>已完成</span><strong>{completed}</strong></div></div>
      <div className="tm-workspace"><section className="tm-graph-panel" aria-label="团队与任务可视化"><div className="tm-panel-header"><div className="tm-tabs" role="tablist" aria-label="图表视图"><button type="button" role="tab" id={`${prefix}-team-tab`} aria-controls={`${prefix}-graph`} aria-selected={graph === 'team'} tabIndex={graph === 'team' ? 0 : -1} onClick={() => setGraph('team')} onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setGraph('tasks'); (e.currentTarget.nextElementSibling as HTMLElement)?.focus(); } }}><Icon name="team"/>团队拓扑</button><button type="button" role="tab" id={`${prefix}-tasks-tab`} aria-controls={`${prefix}-graph`} aria-selected={graph === 'tasks'} tabIndex={graph === 'tasks' ? 0 : -1} onClick={() => setGraph('tasks')} onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setGraph('team'); (e.currentTarget.previousElementSibling as HTMLElement)?.focus(); } }}><Icon name="branch"/>任务关系{nodes.length > 0 && <span>{nodes.length}</span>}</button></div><button type="button" className={`tm-button tm-button--quiet tm-config-trigger ${settingsOpen ? 'is-current' : ''}`} aria-expanded={settingsOpen} aria-controls={`${prefix}-settings`} onClick={() => settingsOpen ? setSettingsOpen(false) : openSettings()}><Icon name="settings"/><span>模型与限制</span></button></div><div className="tm-graph-caption"><span>{graph === 'team' ? '岗位配置' : '动态任务图'}</span>{graph === 'team' ? '协调者整合方案，其他角色按任务参与' : '仅绘制已记录关系，重试保留独立记录'}</div><div role="tabpanel" id={`${prefix}-graph`} aria-labelledby={`${prefix}-${graph}-tab`}>{graph === 'team' ? <Topology snapshot={snapshot} settings={settings} catalog={catalog} selected={!selectedNodeId ? role : undefined} onSelect={selectRole}/> : <TaskGraph snapshot={snapshot} selected={selectedNodeId} onSelect={selectNode}/>}</div></section><Inspector role={role} node={selectedNode} snapshot={snapshot} settings={settings} catalog={catalog} onSelectNode={selectNode} onConfigure={openSettings}/></div>
      <div ref={settingsRef} id={`${prefix}-settings`} className="tm-settings-anchor">{settingsOpen && <SettingsPanel settings={settings} catalog={catalog} disabled={active || demo || submitting} onChange={onSettingsChange} onClose={() => setSettingsOpen(false)}/>}</div>
      {snapshot && <section className="tm-activity"><button type="button" className="tm-activity-toggle" onClick={() => setActivityOpen(!activityOpen)} aria-expanded={activityOpen} aria-controls={`${prefix}-events`}><Icon name="activity"/><strong>团队动态</strong><span>{demo ? '合成事件' : '最近事件'} · {Math.min(snapshot.events.length, 30)} 条</span><Icon name="chevron"/></button>{activityOpen && <div id={`${prefix}-events`} className="tm-event-list" aria-label="最近团队事件">{events.length ? events.map(event => { const eventNode = nodes.find(node => node.id === event.nodeId); return <button type="button" key={event.seq} className={`tm-event ${/retry|feedback/.test(event.type) ? 'tm-event--feedback' : ''}`} disabled={!eventNode} onClick={() => eventNode && selectNode(eventNode)}><span className="tm-event-icon"><Icon name={/retry|feedback/.test(event.type) ? 'refresh' : eventNode ? ROLE[eventNode.role]?.icon || 'activity' : 'activity'}/></span><strong>{eventNode ? ROLE[eventNode.role]?.name || eventNode.role : '团队'}</strong><span>{event.message}</span><time dateTime={event.at}>{time(event.at)}</time></button>; }) : <p className="tm-inline-empty">尚无事件记录</p>}{snapshot.events.length > 30 && <p className="tm-event-bound">显示最近 30 条事件，节点详情保留独立产出。</p>}</div>}</section>}
      {active ? <section className="tm-running-bar"><span className="tm-running-indicator"/><div><strong>团队正在处理当前任务</strong><p>停止只影响本次运行；不会回滚已经产生的文件修改。</p></div><button type="button" className="tm-button tm-button--danger" onClick={() => void cancel()} disabled={cancelling}><Icon name="stop"/>{cancelling ? '正在停止…' : '停止本次运行'}</button></section> : <section className="tm-composer"><div className="tm-composer-title"><Icon name="plan"/><h3>{snapshot && !demo ? '开启新任务' : '给团队一个目标'}</h3><span>执行前确认配置</span></div><label className="tm-sr-only" htmlFor={`${prefix}-goal`}>任务目标</label><textarea ref={goalRef} id={`${prefix}-goal`} value={goal} maxLength={8000} disabled={demo || submitting} onChange={e => setGoal(e.target.value)} placeholder="例如：检查购物车数量更新问题，修复实现并补齐回归测试。" rows={3}/><div className="tm-composer-footer"><span><Icon name="lock"/>{demo ? '演示不会启动真实任务' : '在当前 Desktop 会话执行'}</span><button type="button" className="tm-button tm-button--primary" disabled={!canStart} onClick={() => { confirmedInput.current = JSON.stringify({ sessionId, contextKey: sessionContext?.contextKey, workspace: sessionContext?.workspace, permissionNotice: sessionContext?.permissionNotice, goal: goal.trim(), settings }); setConfirming(true); setTimeout(() => confirmRef.current?.focus(), 0); }}>运行前确认<Icon name="arrow"/></button></div>{blocker && <p className="tm-start-hint">{blocker}{!demo && !active && catalog.available && missingRoles.length > 0 && <button type="button" onClick={openSettings}>配置模型<Icon name="arrow"/></button>}</p>}</section>}
      {confirming && <section className="tm-confirm" ref={confirmRef} tabIndex={-1} aria-label="运行前确认"><div className="tm-confirm-title"><span className="tm-role-icon"><Icon name="play"/></span><div><h3>确认本次团队运行</h3><p>确认后，任务目标与工具读取的项目上下文将发送给所选模型提供方；执行者可在宿主权限范围内修改项目。</p></div></div><p className="tm-confirm-goal">{goal.trim()}</p><div className="tm-confirm-models">{(settings.routeEnabled ? [...ROLES, 'router' as TeamRole] : ROLES).map(item => <div key={item}><span>{ROLE[item].name}</span><strong>{modelName(settings.roles[item], catalog)}</strong><small>{providerName(settings.roles[item], catalog)} · 推理强度：{settings.roles[item]?.reasoningEffort ? (catalog.providers.find(p=>p.id===settings.roles[item]?.provider)?.models.find(m=>m.id===settings.roles[item]?.model)?.efforts?.find(e=>e.id===settings.roles[item]?.reasoningEffort)?.name || settings.roles[item]?.reasoningEffort) : '模型默认'} · 每次输出 ≤ {settings.roles[item]?.maxTokens ?? 4096}</small></div>)}</div><dl className="tm-confirm-limits">{LIMIT_FIELDS.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{settings.limits[field.key] / (field.factor || 1)} {field.suffix}</dd></div>)}<div><dt>方案复核</dt><dd>{settings.reviewPlan ? '开启' : '关闭'}</dd></div></dl><p className="tm-confirm-session"><span>当前会话</span><code>{sessionId}</code></p>{sessionContext?.workspace && <p className="tm-confirm-session"><span>工作目录</span><code>{sessionContext.workspace}</code></p>}{sessionContext?.permissionNotice && <p className="tm-permission-note"><Icon name="lock"/>{sessionContext.permissionNotice}</p>}<p className="tm-permission-note"><Icon name="lock"/>只读任务可并行，编辑串行；本插件一次只运行一个团队。主会话修改操作暂停至子代理清理完成。新增权限请求不会自动批准。输出上限按每次模型请求计算，并非总费用预算。</p><div className="tm-confirm-actions"><button type="button" className="tm-button" disabled={submitting} onClick={() => { setConfirming(false); goalRef.current?.focus(); }}>返回编辑</button><button type="button" className="tm-button tm-button--primary" disabled={!canStart} onClick={() => void start()}><Icon name="play"/>{submitting ? '正在启动…' : '确认并启动团队'}</button></div></section>}
      <footer className="tm-footer"><span><Icon name="lock"/>{demo ? '全部为合成示例 · 未派发智能体' : '宿主模型目录 · 独立子智能体 · 有界调度'}</span><span>DSH <i/> TEAM WORKFLOW</span></footer>
    </main>
  </div></div>;
}
