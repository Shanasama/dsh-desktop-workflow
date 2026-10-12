import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TeamView, TeamSettingsView } from '../client/TeamView';
import { appendDemoRelation, DEMO_RELATIONS, playingDemoSnapshot, teamDemoSnapshot, terminalDemoSnapshot, type DemoRelationId, type DemoTerminalStatus } from '../client/team-demo';
import { createDefaultTeamSettings, type TeamCatalog, type TeamSnapshot } from '../client/team-types';

const roles = ['planner', 'coordinator', 'researcher', 'explorer', 'worker', 'reviewer'] as const;
const models = [...roles.map(role => `模拟·${role}基础模型`), '模拟·轻量研究模型', '模拟·深度研究模型'];
const catalog: TeamCatalog = { available: true, jev: { configured: true, available: true, mode: 'fixture', endpoint: 'fixture://typesafe/jev（离线演示）', disclosure: '本预览不向任何服务发送数据。' }, providers: [{ id: 'preview-fixture', name: '仅供预览的模拟目录', models: models.map(id => ({ id, name: id, efforts: [{ id: 'fixture-standard', name: '模拟标准' }, { id: 'fixture-deep', name: '模拟深入' }] })) }] };
const stages = ['Jev 分类', '规划', '协调', '同岗位并行 / 不同模型', '依赖交接与执行', '审查', '反馈 / Jev 决策', '独立验证', '完成'];
const terminalModes: Record<string, DemoTerminalStatus> = { '受阻': 'blocked', '待验证': 'unverified', '完成': 'completed', '失败': 'failed', '已取消': 'cancelled' };
const INITIAL_STEP = 3;

function Preview() {
  const [mode, setMode] = useState('播放演示');
  const [dark, setDark] = useState(true);
  const [width, setWidth] = useState('full');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [qaNotice, setQaNotice] = useState<string>();
  const [step, setStep] = useState(INITIAL_STEP);
  const [playing, setPlaying] = useState(true);
  const [generation, setGeneration] = useState(0);
  const [manual, setManual] = useState<TeamSnapshot | null>(null);
  const [response, setResponse] = useState<'duplicate' | 'out-of-order' | 'regressed' | null>(null);
  const [previousRun, setPreviousRun] = useState<TeamSnapshot | null>(null);
  const [setup, setSetup] = useState(() => {
    const settings = createDefaultTeamSettings();
    for (const role of roles) settings.roles[role] = { provider: 'preview-fixture', model: `模拟·${role}基础模型`, maxTokens: 4096 };
    settings.routing = { enabled: true, roles: { researcher: { weak: { provider: 'preview-fixture', model: '模拟·轻量研究模型' }, strong: { provider: 'preview-fixture', model: '模拟·深度研究模型' } } } };
    return { settings, configured: true, keyConfigured: true, disclosureAccepted: true, revision: 1 };
  });
  useEffect(() => {
    if (!playing || mode !== '播放演示' || manual) return;
    if (step >= 8) { setPlaying(false); return; }
    const timer = setTimeout(() => setStep(current => current + 1), 3200);
    return () => clearTimeout(timer);
  }, [playing, mode, step, manual]);
  useEffect(() => {
    document.body.toggleAttribute('data-ds-dark-theme', dark);
    // The host HTML starts with an inline fallback background; update it explicitly.
    document.body.style.backgroundColor = dark ? '#080c11' : '#e5e9ec';
  }, [dark]);
  const snapshot = useMemo(() => {
    if (mode === '待命' || mode === '一次性设置') return null;
    if (mode === '静态旧示例') return { ...teamDemoSnapshot(), roles: setup.settings.roles };
    if (terminalModes[mode]) return terminalDemoSnapshot(terminalModes[mode], generation);
    let result = manual || playingDemoSnapshot(step, generation);
    if (response) {
      const last = [...result.events].reverse().find(event => event.type === 'relation_activated');
      const maximum = result.events.reduce((highest, event) => Math.max(highest, event.seq), 0);
      const events = response === 'duplicate' && last ? [...result.events, { ...last }] : response === 'out-of-order' ? [...result.events].reverse() : result.events.filter(event => event.seq <= maximum - 3);
      result = { ...result, events };
    }
    return mode === '日志截断' ? { ...result, events: result.events.slice(-3), oldestSeq: result.events.at(-3)?.seq, eventsTruncated: true } : result;
  }, [mode, step, generation, manual, response, setup.settings.roles]);
  const canEmit = !!snapshot && ['planning', 'running', 'reviewing'].includes(snapshot.status) && mode !== '静态旧示例';
  const canPlay = mode === '播放演示';

  function reset(nextStep = INITIAL_STEP, autoplay = true) {
    setStep(nextStep); setGeneration(current => current + 1); setPlaying(autoplay); setMode('播放演示');
    setManual(null); setResponse(null); setPreviousRun(null); setQaNotice(undefined);
  }
  function changeMode(nextMode: string) {
    setMode(nextMode); setNotice(undefined); setQaNotice(undefined);
    // Stale/recovery and truncated history intentionally keep the same run and cursor.
    if (['播放演示', '连接中断', '日志截断'].includes(nextMode) && ['播放演示', '连接中断', '日志截断'].includes(mode)) return;
    setGeneration(current => current + 1); setManual(null); setResponse(null); setPreviousRun(null);
    setStep(INITIAL_STEP); setPlaying(nextMode === '播放演示');
  }
  function emitRelation(id: DemoRelationId) {
    if (!snapshot || !canEmit) return;
    setPlaying(false);
    setManual(appendDemoRelation(manual || playingDemoSnapshot(step, generation), id)); setResponse(null);
    setQaNotice(`已追加新事件：${DEMO_RELATIONS.find(item => item.id === id)!.label}。播放按钮可重新开始标准流程。`);
  }
  function replayResponse(kind: 'duplicate' | 'out-of-order' | 'regressed') {
    if (!snapshot) return;
    setPlaying(false);
    // Response faults never discard the canonical synthetic journal. The next
    // fresh event resumes its sequence rather than accidentally reusing old IDs.
    setManual(manual || playingDemoSnapshot(step, generation)); setResponse(kind);
    setQaNotice(kind === 'duplicate' ? '重复已有 seq；不应产生第二次传递动画。' : kind === 'out-of-order' ? '只颠倒快照事件顺序；不应重播已消费的事件。' : '较旧响应已送达；应保留高水位并提示回退，不重播历史。');
  }
  function switchRun() {
    if (!snapshot) return;
    const current = manual || playingDemoSnapshot(step, generation);
    setPlaying(false); setPreviousRun(current); setResponse(null);
    setManual({ ...current, id: `playing-fixture-${generation + 1}` });
    setGeneration(current => current + 1);
    setQaNotice('已切换到另一合成运行；首帧历史只建立基线，不补播。');
  }
  function returnRun() {
    if (!previousRun || !snapshot) return;
    setPlaying(false); setManual(previousRun); setPreviousRun(manual || snapshot); setResponse(null);
    setQaNotice('已返回先前运行；已消费事件不补播。');
  }
  return <div data-preview-reduced-motion={reducedMotion}>
    <style>{`
      body{color:#e7eeed;font-family:system-ui;background:#e5e9ec}body[data-ds-dark-theme]{background:#080c11}
      .preview-controls{position:relative;display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:7px 14px;background:#11171ded;border-bottom:1px solid #39434b;font-size:10px}
      .preview-controls strong{color:#e4e56b}.preview-controls select,.preview-controls button{background:#252b32;border:1px solid #58636a;color:#edf1ee;padding:4px 7px;font:inherit;cursor:pointer}
      .preview-controls button:disabled{opacity:.4;cursor:default}.preview-badge{font:700 10px monospace;background:#e4e56b;color:#1b1d20;padding:4px 6px;white-space:nowrap}
      .preview-stage{color:#91dce2}.preview-title{display:flex;align-items:center;gap:8px;flex-basis:100%}.preview-transport{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
      .preview-options{margin-left:auto}.preview-options>summary{cursor:pointer;padding:5px 8px;border:1px solid #58636a;background:#252b32}.preview-options>div{display:flex;align-items:center;flex-wrap:wrap;gap:7px;padding-top:7px}
      .preview-options[open]{flex-basis:100%;margin:0}.preview-options[open]>summary{width:max-content}.preview-qa-label{flex-basis:100%;margin-top:3px;color:#a5b7c4}.preview-qa-notice{margin:0;color:#afc6d4;flex-basis:100%}
      .preview-watermark{position:fixed;bottom:6px;left:6px;z-index:30;pointer-events:none;font:700 9px monospace;padding:3px 5px;border:1px solid #64662c;background:#171b1deb;color:#e4e56b}.preview-shell{margin:8px auto;min-height:700px}
      [data-preview-reduced-motion="true"] .tm-root *,[data-preview-reduced-motion="true"] .tm-root *::before,[data-preview-reduced-motion="true"] .tm-root *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
      [data-preview-reduced-motion="true"] .tm-root [data-live=true]::after,[data-preview-reduced-motion="true"] .tm-root .tm-topology-card::after,[data-preview-reduced-motion="true"] .tm-root .tm-edge-pulse{display:none!important}
      [data-preview-reduced-motion="true"] .tm-root [data-live=true]{outline:1px solid var(--tm-live);outline-offset:-2px}
      @media(max-width:600px){.preview-controls{padding:7px 9px;gap:5px}.preview-shell{margin:0 auto}.preview-title strong,.preview-stage{display:none}.preview-title{gap:6px;font-size:9px}.preview-controls button{font-size:9px;padding:4px 5px}.preview-options>summary{font-size:9px;padding:4px 5px}}
    `}</style>
    <div className="preview-controls">
      <div className="preview-title"><span className="preview-badge">SYNTHETIC DEMO</span><strong>团队实时拓扑预览</strong><span>Fixture 合成数据 · 请勿输入真实密钥</span></div>
      <div className="preview-transport">
        <button data-preview-action="play" onClick={() => manual || step >= 8 ? reset() : setPlaying(!playing)} disabled={!canPlay}>{manual || step >= 8 ? '重播标准流程' : playing ? '暂停播放' : '继续播放'}</button>
        <button data-preview-action="next" onClick={() => { setPlaying(false); setStep(current => Math.min(8, current + 1)); }} disabled={!canPlay || !!manual || step >= 8}>下一步事件</button>
        <button onClick={() => reset()}>重置演示</button>
        <span className="preview-stage" aria-live="polite">{manual ? '手动事件 · 已暂停' : `${step + 1} / 9 · ${stages[step]}`}</span>
      </div>
      <details className="preview-options"><summary>场景与尺寸</summary><div>
        <label>场景 <select aria-label="预览状态" value={mode} onChange={event => changeMode(event.target.value)}>{['播放演示', '待命', '一次性设置', '受阻', '待验证', '完成', '失败', '已取消', '连接中断', '日志截断', '静态旧示例'].map(value => <option key={value}>{value}</option>)}</select></label>
        <button onClick={() => reset(INITIAL_STEP, false)}>同岗位双模型</button>
        <button onClick={() => reset(0, false)}>从 Jev 分类开始</button>
        <button onClick={() => setDark(!dark)} title="仅修改预览宿主背景；组件主题由组件右上角主题菜单切换。">宿主背景：{dark ? '深色' : '浅色'}</button>
        <label>宽度 <select aria-label="预览宽度" value={width} onChange={event => setWidth(event.target.value)}><option value="full">完整画布</option><option value="420">420px 侧栏</option><option value="320">320px 侧栏</option></select></label>
        <button onClick={() => setReducedMotion(!reducedMotion)} aria-pressed={reducedMotion} title="系统减少动效设置始终有效；此项额外在预览中关闭所有动画。">减少动效：{reducedMotion ? '预览开启' : '跟随系统'}</button>
        <span className="preview-qa-label">新关系事件 · 使用真实字段格式，只追加合成事件；不调用服务</span>
        {DEMO_RELATIONS.map(relation => <button key={relation.id} data-preview-relation={relation.id} disabled={!canEmit} onClick={() => emitRelation(relation.id)}>{relation.label}</button>)}
        <span className="preview-qa-label">事件去重 / 乱序 / 运行切换验收</span>
        <button data-preview-response="duplicate" disabled={!canEmit} onClick={() => replayResponse('duplicate')}>重复上个关系 seq</button>
        <button data-preview-response="out-of-order" disabled={!canEmit} onClick={() => replayResponse('out-of-order')}>乱序快照</button>
        <button data-preview-response="regressed" disabled={!canEmit} onClick={() => replayResponse('regressed')}>较旧响应</button>
        <button data-preview-action="switch-run" disabled={!canEmit} onClick={switchRun}>切换合成运行</button>
        <button data-preview-action="return-run" disabled={!previousRun || !canEmit} onClick={returnRun}>返回上一运行</button>
        {qaNotice && <p className="preview-qa-notice" role="status">{qaNotice}</p>}
      </div></details>
    </div>
    <div className="preview-shell" data-preview-run-id={snapshot?.id} data-preview-mode={mode} style={{ maxWidth: width === 'full' ? 1500 : Number(width) }}>
      {mode === '一次性设置' ? <TeamSettingsView setup={setup} catalog={catalog} credential={{ configured: true, writable: true, source: 'fixture' }} notice={notice} onClose={() => changeMode('播放演示')} onRefresh={() => setNotice('Fixture 预览，未读取真实凭据。')} onSave={async input => { setSetup({ settings: input.settings, configured: input.disclosureAccepted, keyConfigured: true, disclosureAccepted: input.disclosureAccepted, revision: setup.revision + 1 }); setNotice('Fixture 设置交互完成，未保存密钥、未发出网络请求。'); }}/>
        : <TeamView catalog={catalog} sessionId="preview-session" sessionContext={{ workspace: '/仅为示例/项目目录', permissionNotice: '离线预览，不产生模型调用。' }} snapshot={snapshot} freshness={{ stale: mode === '连接中断', reason: '合成断连：数据超过时限', observedAt: snapshot?.observedAt, revision: generation }} settings={setup.settings} configured={setup.configured} onOpenSettings={() => changeMode('一次性设置')} onCancel={async () => changeMode('已取消')} onRefresh={() => reset()} onDemo={() => reset()}/>}
    </div>
    <span className="preview-watermark" aria-label="持续合成演示标识">合成演示 · 无真实调用</span>
  </div>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
