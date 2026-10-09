import React, { useEffect, useId, useRef, useState } from 'react';

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'blocked' | 'skipped' | 'failed' | 'waiting' | 'review' | 'approval' | 'stale';
export type StageKey = 'jev-routing' | 'plan' | 'work' | 'tests' | 'review' | 'done';
export interface WorkflowStage {
  stage: string;
  status: WorkflowStatus;
  summary?: string;
  time?: string;
  evidence?: string[];
  model?: string;
  origin?: string;
}
export interface Snapshot {
  mode: 'live' | 'demo' | 'waiting' | 'empty' | 'error' | 'stale';
  title: string;
  status: WorkflowStatus;
  stage: string;
  jev: {
    model: string;
    effectiveRoute: string;
    confidence?: number;
    probabilities?: Partial<Record<'execute' | 'plan_review' | 'clarify', number>>;
  } | null;
  stages: WorkflowStage[];
  updatedAt?: string;
  sourceNotice: string;
  origin?: string;
  stale?: boolean;
  runId?: string;
  executionMode?: 'inspect' | 'edit';
  routingStatus?: 'running' | 'completed' | 'failed' | 'pending';
}
export interface WorkflowViewProps {
  snapshot: Snapshot | null;
  loading?: boolean;
  error?: string;
  onRefresh: () => void;
  onDemo: () => void;
}

type IconName = 'route' | 'plan' | 'code' | 'test' | 'review' | 'flag' | 'refresh' | 'lock' | 'chevron' | 'check' | 'clock' | 'alert' | 'arrow' | 'file' | 'spark' | 'close';
function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    route: <><rect x="3" y="8" width="5" height="8" rx="1.5"/><rect x="16" y="3" width="5" height="5" rx="1.5"/><rect x="16" y="16" width="5" height="5" rx="1.5"/><path d="M8 12h3a2 2 0 0 0 2-2V7a1.5 1.5 0 0 1 1.5-1.5H16M8 12h3a2 2 0 0 1 2 2v3a1.5 1.5 0 0 0 1.5 1.5H16"/></>,
    plan: <><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h6M9 12h6M9 16h3"/></>,
    code: <><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16"/></>,
    test: <><path d="M9 3h6m-5 0v6l-5 8a2.5 2.5 0 0 0 2 4h10a2.5 2.5 0 0 0 2-4l-5-8V3M8 14h8"/><path d="m10 17 1 1 3-3"/></>,
    review: <><path d="M12 3 4.5 6v5c0 4.5 2.8 7.7 7.5 10 4.7-2.3 7.5-5.5 7.5-10V6L12 3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></>,
    flag: <><path d="M6 21V4m0 0c4-4 8 4 13 0v10c-5 4-9-4-13 0"/></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9"/></>,
    lock: <><rect x="6" y="10" width="12" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/></>,
    chevron: <path d="m9 5 7 7-7 7"/>,
    check: <path d="m5 12 4.5 4.5L19 7"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    alert: <><path d="m10.3 4.1-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-2.9l-8-14a2 2 0 0 0-3.4 0Z"/><path d="M12 9v5m0 3v.1"/></>,
    arrow: <><path d="M4 12h16m-6-6 6 6-6 6"/></>,
    file: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"/><path d="M14 3v6h6M8 14h8m-8 3h5"/></>,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/></>,
    close: <path d="m7 7 10 10M7 17 17 7"/>,
  };
  return <svg className={`wf-icon ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const baseStageDefinitions: { key: StageKey; label: string; detail: string; icon: IconName }[] = [
  { key: 'jev-routing', label: 'Jev 路由', detail: '选择执行路径', icon: 'route' },
  { key: 'plan', label: '规划', detail: '明确实现方案', icon: 'plan' },
  { key: 'work', label: '实现', detail: '实施代码变更', icon: 'code' },
  { key: 'tests', label: '测试', detail: '验证执行结果', icon: 'test' },
  { key: 'review', label: '复核', detail: '复核实现结果', icon: 'review' },
  { key: 'done', label: '完成', detail: '收尾并汇总结果', icon: 'flag' },
];

const statusLabels: Record<WorkflowStatus, string> = {
  pending: '待开始', running: '进行中', completed: '已完成', blocked: '已阻塞', skipped: '已跳过',
  failed: '失败', waiting: '等待中', review: '复核中', approval: '待批准', stale: '快照已过期',
};
const routeLabels: Record<string, string> = { execute: '直接执行', plan_review: '规划与复核', clarify: '澄清需求' };
const humanRoute = (route: string) => routeLabels[route] || route || '未报告';
function formatTime(value?: string) {
  if (!value) return '未报告时间';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function fullTime(value?: string) {
  if (!value) return '无保存时间';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN');
}
function percent(value: number) { return `${Math.round(value * 100)}%`; }
function Status({ status, subtle = false }: { status: WorkflowStatus; subtle?: boolean }) {
  return <span className={`wf-status wf-status--${status}${subtle ? ' wf-status--subtle' : ''}`}>
    {status === 'completed' ? <Icon name="check"/> : status === 'failed' ? <Icon name="close"/> : <span className="wf-status-dot"/>}
    {statusLabels[status] || status}
  </span>;
}
function getNodeStatus(snapshot: Snapshot | null, key: StageKey): WorkflowStatus {
  if (!snapshot || snapshot.mode === 'waiting' || snapshot.mode === 'empty') return 'pending';
  if (key === 'jev-routing') {
    if (snapshot.routingStatus === 'failed') return 'failed';
    if (snapshot.routingStatus === 'running') return 'running';
    return snapshot.jev ? 'completed' : snapshot.routingStatus || (snapshot.stage === 'jev-routing' ? 'running' : 'pending');
  }
  return snapshot.stages.find(item => item.stage === key)?.status || 'pending';
}

export function WorkflowView({ snapshot, loading = false, error, onRefresh, onDemo }: WorkflowViewProps) {
  const stageDefinitions = baseStageDefinitions.map(definition => definition.key === 'work' && snapshot?.executionMode === 'inspect' ? { ...definition, label: '检查', detail: '检查项目状态' } : definition);
  const [selected, setSelected] = useState<StageKey>(() => stageDefinitions.some(s => s.key === snapshot?.stage) ? snapshot!.stage as StageKey : 'jev-routing');
  const [activityOpen, setActivityOpen] = useState(true);
  const previousRun = useRef(snapshot?.runId || snapshot?.title);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const inspectorId = useId();
  const activityId = useId();
  const empty = !snapshot || snapshot.mode === 'waiting' || snapshot.mode === 'empty' || snapshot.mode === 'error';
  const isDemo = snapshot?.mode === 'demo';
  const stale = Boolean(snapshot?.stale || snapshot?.mode === 'stale');
  const selectedDefinition = stageDefinitions.find(item => item.key === selected)!;
  const selectedStage = snapshot?.stages.find(item => item.stage === selected);
  const selectedStatus = getNodeStatus(snapshot, selected);
  const currentDefinition = stageDefinitions.find(item => item.key === snapshot?.stage);
  const activity = snapshot?.stages.filter(item => item.status !== 'pending' || item.time || item.summary || item.evidence?.length) || [];
  const selectedEvidence = selectedStage?.evidence?.filter(Boolean) || [];
  const pendingDetail = selectedStatus === 'pending' ? '此阶段尚未报告动态。' : '保存的状态中未包含阶段摘要。';

  useEffect(() => {
    const identity = snapshot?.runId || snapshot?.title;
    if (identity !== previousRun.current) {
      setSelected(stageDefinitions.some(s => s.key === snapshot?.stage) ? snapshot!.stage as StageKey : 'jev-routing');
      previousRun.current = identity;
    }
  }, [snapshot?.runId, snapshot?.title, snapshot?.stage]);

  const selectWithKeyboard = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number | undefined;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % stageDefinitions.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + stageDefinitions.length) % stageDefinitions.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = stageDefinitions.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      setSelected(stageDefinitions[next].key);
      buttons.current[next]?.focus();
    }
  };

  return <section className="dsh-workflow" aria-label="桌面工作流查看器" aria-busy={loading}>
    <header className="wf-header">
      <div className="wf-heading-group">
        <span className="wf-appmark"><Icon name="route"/></span>
        <div><div className="wf-eyebrow">DEEPSEEK HARNESS <span>/</span> 桌面版</div><h1>工作流</h1></div>
      </div>
      <div className="wf-header-actions">
        <span className="wf-readonly"><Icon name="lock"/>只读</span>
        <button type="button" className={`wf-button wf-demo-button${isDemo ? ' is-active' : ''}`} onClick={onDemo}><Icon name="spark"/>{isDemo ? '演示模式' : '查看演示'}</button>
        <button type="button" className="wf-button wf-refresh-button" onClick={onRefresh} disabled={loading} aria-label={isDemo ? '刷新已保存的工作流并退出演示' : '刷新已保存的工作流'}><Icon name="refresh" className={loading ? 'wf-spin' : ''}/><span>{loading ? '刷新中' : '刷新'}</span></button>
      </div>
    </header>

    {error && <div className="wf-notice wf-notice--error" role="alert"><Icon name="alert"/><div><strong>无法读取工作流状态</strong><p>{error}</p>{snapshot && !empty && <p>下方仍显示最近一次可用的快照。</p>}</div><button className="wf-text-button" type="button" onClick={onRefresh} disabled={loading}>重试 <Icon name="arrow"/></button></div>}
    {isDemo && <div className="wf-demo-notice"><span className="wf-demo-tag">演示</span><span>模拟工作流，仅用于体验界面，不会执行任务。</span><span className="wf-demo-note">未调用模型或更改项目</span></div>}
    {stale && <div className="wf-notice wf-notice--warning" role="status"><Icon name="clock"/><div><strong>此快照可能已过期</strong><p>最后保存于 {fullTime(snapshot?.updatedAt)}。刷新以检查最新状态。</p></div></div>}

    <div className="wf-run-summary">
      <div className="wf-run-title"><span className="wf-section-kicker">{empty ? '准备开始' : '当前工作流'}</span><h2>{empty ? '每一步，清晰可见。' : snapshot?.title}</h2><p>{empty ? '连接已保存的工作流，查看路由、进度与证据。' : <><span className="wf-summary-dot"/>{currentDefinition ? `${currentDefinition.label}阶段` : '已保存的工作流状态'}<span className="wf-summary-separator">·</span>{isDemo ? '演示数据' : snapshot?.origin || 'CLI 报告的状态'}</>}</p>{!empty && !isDemo && <p className="wf-source-context">已配置的运行 · 独立于当前聊天</p>}{!empty && snapshot?.runId && <p className="wf-run-id"><span>运行 ID</span><code>{snapshot.runId}</code></p>}</div>
      {!empty && <div className="wf-run-status"><Status status={snapshot?.status || 'pending'}/><span title={fullTime(snapshot?.updatedAt)}>{snapshot?.updatedAt ? `保存于 ${formatTime(snapshot.updatedAt)}` : '未报告时间'}</span></div>}
    </div>

    <div className="wf-workspace">
      <div className="wf-map-panel">
        <div className="wf-panel-heading"><div><h3>工作流图</h3><span>固定阶段顺序 · 以保存状态为准</span></div><span className="wf-keyboard-hint">点击节点查看详情 <Icon name="arrow"/></span></div>
        <div className={`wf-canvas${empty ? ' wf-canvas--empty' : ''}`}>
          <div className="wf-map" role="group" aria-label="按固定顺序排列的工作流阶段">
            {stageDefinitions.map((definition, index) => {
              const nodeStatus = getNodeStatus(snapshot, definition.key);
              const node = snapshot?.stages.find(item => item.stage === definition.key);
              const subtitle = definition.key === 'jev-routing' && snapshot?.jev ? humanRoute(snapshot.jev.effectiveRoute) : definition.detail;
              return <div key={definition.key} className={`wf-node-wrap wf-node-wrap--${index} wf-node-wrap--${nodeStatus}`}>
                <button type="button" ref={element => { buttons.current[index] = element; }} className={`wf-node wf-node--${nodeStatus}${selected === definition.key ? ' is-selected' : ''}`} onClick={() => setSelected(definition.key)} onKeyDown={event => selectWithKeyboard(event, index)} aria-pressed={selected === definition.key} aria-controls={inspectorId} aria-label={`${index + 1}. ${definition.label}: ${statusLabels[nodeStatus]}`}>
                  <span className="wf-node-top"><span className={`wf-node-icon wf-node-icon--${definition.key}`}><Icon name={definition.icon}/></span><span className="wf-node-number">0{index + 1}</span></span>
                  <span className="wf-node-title">{definition.label}</span><span className="wf-node-description" title={subtitle}>{subtitle}</span>
                  <span className="wf-node-bottom"><Status status={nodeStatus} subtle/>{node?.evidence?.length ? <span className="wf-evidence-count" title={`${node.evidence.length} 条证据`}><Icon name="file"/>{node.evidence.length}</span> : <Icon name="chevron" className="wf-node-chevron"/>}</span>
                </button>
                {index < stageDefinitions.length - 1 && <span className="wf-connector" aria-hidden="true"><span/><Icon name="chevron"/></span>}
              </div>;
            })}
          </div>
          <div className="wf-canvas-footer"><span className="wf-canvas-caption"><Icon name="route"/>已报告阶段</span><span className="wf-legend"><i className="wf-legend-complete"/>已完成<i className="wf-legend-running"/>进行中<i className="wf-legend-pending"/>待开始</span></div>
        </div>
        {empty && <div className="wf-empty-bar"><div><strong>{loading ? '正在读取工作流状态…' : '等待工作流'}</strong><p>{snapshot?.sourceNotice || '尚未连接已保存的运行。上方仅展示阶段结构。'}</p></div><button type="button" className="wf-button wf-button--primary" onClick={onDemo}>浏览演示 <Icon name="arrow"/></button></div>}
      </div>

      <aside id={inspectorId} className="wf-inspector" aria-label={`${selectedDefinition.label}详情`}>
        <div className="wf-inspector-label"><span>节点详情</span><span>0{stageDefinitions.findIndex(s => s.key === selected) + 1} / 06</span></div>
        <div className="wf-inspector-title"><span className="wf-detail-icon"><Icon name={selectedDefinition.icon}/></span><div><h3>{selectedDefinition.label}</h3><Status status={selectedStatus} subtle/></div></div>
        <p className="wf-inspector-summary">{selected === 'jev-routing' ? (selectedStatus === 'failed' ? '来源报告路由失败。请查看运行端的诊断信息。' : snapshot?.jev ? `Jev 为此工作流选择了「${humanRoute(snapshot.jev.effectiveRoute)}」路径。` : 'Jev 报告路由决策后，将显示在这里。') : selectedStage?.summary || pendingDetail}</p>
        {selectedStatus === 'approval' && <div className="wf-stage-note"><Icon name="lock"/>请在来源应用中完成批准。</div>}
        {selectedStatus === 'blocked' && <div className="wf-stage-note"><Icon name="alert"/>此阶段已阻塞，请查看下方报告的证据。</div>}
        {selectedStatus === 'failed' && <div className="wf-stage-note wf-stage-note--failed"><Icon name="alert"/>来源报告此阶段执行失败。</div>}

        {selected === 'jev-routing' ? <div className="wf-inspector-section">
          <h4>路由决策</h4>
          <dl className="wf-facts"><div><dt>模型</dt><dd>{snapshot?.jev?.model || '未报告'}</dd></div><div><dt>路由</dt><dd>{snapshot?.jev ? humanRoute(snapshot.jev.effectiveRoute) : '未报告'}</dd></div><div><dt>置信度</dt><dd>{typeof snapshot?.jev?.confidence === 'number' ? percent(snapshot.jev.confidence) : '未报告'}</dd></div></dl>
          {snapshot?.jev?.probabilities && Object.keys(snapshot.jev.probabilities).length > 0 && <div className="wf-probabilities" aria-label="来源报告的路由概率">{Object.entries(snapshot.jev.probabilities).filter((entry): entry is [string, number] => typeof entry[1] === 'number').map(([route, value]) => <div key={route} className={`wf-probability${route === snapshot.jev?.effectiveRoute ? ' is-chosen' : ''}`}><div><span>{humanRoute(route)}</span><span>{percent(value)}</span></div><div className="wf-probability-track"><span style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}/></div></div>)}</div>}
          <p className="wf-small-print">{isDemo ? '此处的路由数值均为演示数据。' : '数值来自运行端；置信度不代表独立的质量评分。'}</p>
        </div> : <div className="wf-inspector-section"><h4>阶段信息</h4><dl className="wf-facts"><div><dt>上一步</dt><dd>{stageDefinitions[stageDefinitions.findIndex(s => s.key === selected) - 1]?.label || '工作流目标'}</dd></div><div><dt>模型</dt><dd>{selectedStage?.model || '未报告'}</dd></div><div><dt>记录时间</dt><dd title={fullTime(selectedStage?.time)}>{formatTime(selectedStage?.time)}</dd></div></dl></div>}

        <div className="wf-inspector-section wf-evidence-section"><h4>证据 <span>{selectedEvidence.length}</span></h4>{selectedEvidence.length > 0 ? <ul className="wf-evidence-list">{selectedEvidence.map((evidence, index) => <li key={`${index}-${evidence}`}><Icon name="file"/><span>{evidence}</span></li>)}</ul> : <div className="wf-no-evidence"><Icon name={selected === 'jev-routing' ? 'route' : 'file'}/><p>{selected === 'jev-routing' && snapshot?.jev ? '路由数值已显示在上方，来源未报告单独的证据文件。' : '此步骤尚未报告证据。'}</p></div>}</div>
        <div className="wf-inspector-footer"><Icon name="lock"/><span>{isDemo ? '模拟数据 · 仅供预览' : '来源报告 · 未经独立验证'}</span></div>
      </aside>
    </div>

    <section className="wf-activity" aria-label="来源报告的阶段动态"><button type="button" className="wf-activity-toggle" onClick={() => setActivityOpen(value => !value)} aria-expanded={activityOpen} aria-controls={activityId}><span><Icon name="clock"/><strong>阶段动态</strong><span className="wf-activity-description">{isDemo ? '模拟事件' : '来自已保存的快照'}</span></span><Icon name="chevron" className={activityOpen ? 'is-open' : ''}/></button>
      {activityOpen && <div id={activityId} className="wf-activity-body">{activity.length > 0 ? <ol className="wf-activity-list">{activity.map((event, index) => {
        const definition = stageDefinitions.find(item => item.key === event.stage);
        return <li key={`${event.stage}-${index}`}><span className={`wf-event-icon wf-event-icon--${event.status}`}><Icon name={event.status === 'completed' ? 'check' : event.status === 'failed' ? 'close' : event.status === 'running' ? 'refresh' : 'clock'}/></span><div className="wf-event-main"><span className="wf-event-label">{definition?.label || event.stage}<Status status={event.status} subtle/></span><p>{event.summary || '未报告摘要。'}</p></div><time title={fullTime(event.time)} dateTime={event.time || undefined}>{event.time ? formatTime(event.time) : '—'}</time></li>;
      })}</ol> : <div className="wf-activity-empty"><span className="wf-empty-event-dot"/>来源报告运行状态后，阶段动态将显示在这里。</div>}</div>}
    </section>

    <footer className="wf-footer"><span><Icon name="lock"/>{snapshot?.sourceNotice || '只读查看器，不调用模型、不执行任务、不更改项目。'}</span><span className="wf-footer-signature">DSH <span>工作流</span></span></footer>
    <span className="wf-visually-hidden" role="status" aria-live="polite">{loading ? '正在刷新工作流状态。' : error ? '工作流刷新失败。' : empty ? '等待工作流。' : `${isDemo ? '演示模式。' : ''}${statusLabels[snapshot?.status || 'pending']}。${currentDefinition?.label || '工作流'}阶段。`}</span>
  </section>;
}

export default WorkflowView;
