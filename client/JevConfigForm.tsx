import React, { useCallback, useEffect, useState } from 'react';
import { requestWithDeadline } from './request';

/**
 * Fork addition (not upstream). This DSH build renders a bundle row's configuration only
 * when the plugin itself registers into `plugins.row.config`, so the values a run needs
 * had no editable surface at all. This view reads and writes them through the plugin's own
 * endpoint:
 *
 *   models                 which provider/model the six roles use
 *   verificationProfiles   the checks that decide whether work is done
 *   verification           which profile this run uses, and which paths may change
 *   jev.disclosureAccepted the explicit TypeSafe disclosure switch
 *
 * Deliberately narrow: no secret field (the Jev key stays in DSH credentials or the host
 * environment), no endpoint field, no permission control.
 */
const ROW_KEY = 'dsh-desktop-workflow#desktop-workflow';
const ENDPOINT = 'dsh-desktop-workflow/team/server-config';

type Check = { id: string; argv: string[]; timeoutMs: number };
type Profile = { id: string; name: string; checks: Check[]; protectedPaths: string[]; expectsChanges: boolean };
type Catalog = { available: boolean; providers: Array<{ id: string; name: string; models: Array<{ id: string; name: string }> }>; reason?: string };
type RunConfig = {
  available?: boolean; writable: boolean; reason?: string; invalid?: string;
  verificationProfiles: Profile[];
  models: Record<string, string>;
  verification: { profileId: string; scope: string[] };
  disclosureAccepted: boolean;
};
const emptyProfile = (): Profile => ({ id: 'project-checks', name: '', checks: [{ id: 'test', argv: [], timeoutMs: 60000 }], protectedPaths: [], expectsChanges: true });
const ROLES = ['planner', 'coordinator', 'researcher', 'explorer', 'worker', 'reviewer'] as const;

export function JevVerificationConfig({ ctx }: { ctx: any }) {
  const [draft, setDraft] = useState<RunConfig>();
  const [catalog, setCatalog] = useState<Catalog>();
  const [note, setNote] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const call = useCallback(async (payload: object) => {
    const controller = new AbortController();
    return requestWithDeadline(
      (signal: AbortSignal) => ctx.connection.rpc.call('/api', ENDPOINT, payload, signal),
      controller.signal,
    );
  }, [ctx]);

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const result: any = await call({ action: 'read' });
        if (!live) return;
        if (!result.ok) { setError(result.error?.message || '无法读取配置。'); return; }
        const value = result.value as RunConfig & { models_catalog?: Catalog };
        setDraft(value);
        setCatalog(value.models_catalog);
        setNote(value.reason ?? value.invalid);
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : '无法读取配置。');
      }
    })();
    return () => { live = false; };
  }, [call]);

  async function save() {
    if (!draft) return;
    setBusy(true); setError(undefined); setNote(undefined);
    try {
      const result: any = await call({
        action: 'save',
        verificationProfiles: draft.verificationProfiles,
        models: draft.models,
        verification: draft.verification,
        jev: { disclosureAccepted: draft.disclosureAccepted },
      });
      if (!result.ok) { setError(result.error?.message || '保存失败。'); return; }
      const current = result.value.current as RunConfig;
      setDraft(current);
      setNote('已保存。聊天里现在可以直接让团队在当前工作区干活了。');
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败。');
    } finally { setBusy(false); }
  }

  const patch = (next: Partial<RunConfig>) => setDraft(d => (d ? { ...d, ...next } : d));
  const updateProfile = (index: number, p: Partial<Profile>) => {
    if (!draft) return;
    patch({ verificationProfiles: draft.verificationProfiles.map((item, i) => (i === index ? { ...item, ...p } : item)) });
  };

  const modelOptions: Array<{ value: string; label: string }> = [];
  for (const provider of catalog?.providers ?? []) {
    for (const model of provider.models) modelOptions.push({ value: `${provider.id}/${model.id}`, label: `${provider.name} · ${model.name}` });
  }

  if (!draft) return <section className="tm-verify-config"><p className="tm-verify-note">{error || '正在读取配置…'}</p></section>;
  const writable = !!draft.writable;

  return <section className="tm-verify-config" aria-label="团队配置">
    <header><h3>团队配置</h3><span>模型 · 验证方案 · 允许修改范围</span></header>
    {note && <p className="tm-verify-note">{note}</p>}
    {error && <p className="tm-verify-error" role="alert">{error}</p>}
    {!writable && <p className="tm-verify-error" role="alert">{draft.reason || '当前宿主未提供配置编辑服务，无法在此保存。'}</p>}

    <fieldset className="tm-verify-profile" disabled={!writable || busy}>
      <legend>模型</legend>
      <label>全部岗位使用
        <select value={draft.models.default ?? ''} onChange={e => patch({ models: { ...draft.models, default: e.target.value } })}>
          <option value="">选择模型</option>
          {modelOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
      {!modelOptions.length && <p className="tm-verify-note">{catalog?.reason || '暂时读不到宿主模型目录；也可以直接在下面手填。'}</p>}
      <label>或手填「提供方/模型」
        <input value={draft.models.default ?? ''} onChange={e => patch({ models: { ...draft.models, default: e.target.value } })} placeholder="deepseek-official/deepseek-flash" />
      </label>
      {ROLES.map(role => <label key={role}>{role}（留空则用上面的默认值）
        <input value={draft.models[role] ?? ''} onChange={e => patch({ models: { ...draft.models, [role]: e.target.value } })} placeholder="留空" />
      </label>)}
    </fieldset>

    <fieldset className="tm-verify-profile" disabled={!writable || busy}>
      <legend>完成验证</legend>
      <label>本次使用的验证方案
        <select value={draft.verification.profileId} onChange={e => patch({ verification: { ...draft.verification, profileId: e.target.value } })}>
          <option value="">选择验证方案</option>
          {draft.verificationProfiles.map(p => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
        </select>
      </label>
      <label>本次允许修改的相对路径（每行一条）
        <textarea rows={3} value={draft.verification.scope.join('\n')} onChange={e => patch({ verification: { ...draft.verification, scope: e.target.value.split(/\r?\n/).map(v => v.trim()).filter(Boolean) } })} placeholder={'src\npackage.json'} />
      </label>
    </fieldset>

    {draft.verificationProfiles.map((profile, index) => <fieldset key={index} className="tm-verify-profile" disabled={!writable || busy}>
      <legend>验证方案 {index + 1}</legend>
      <label>id<input value={profile.id} onChange={e => updateProfile(index, { id: e.target.value })} placeholder="project-checks" /></label>
      <label>显示名<input value={profile.name} onChange={e => updateProfile(index, { name: e.target.value })} placeholder="项目检查" /></label>
      {profile.checks.map((check, ci) => <div key={ci} className="tm-verify-check">
        <label>id<input value={check.id} onChange={e => updateProfile(index, { checks: profile.checks.map((c, i) => i === ci ? { ...c, id: e.target.value } : c) })} /></label>
        <label>argv（每行一项）<textarea rows={3} value={check.argv.join('\n')} onChange={e => updateProfile(index, { checks: profile.checks.map((c, i) => i === ci ? { ...c, argv: e.target.value.split(/\r?\n/).filter(line => line.length) } : c) })} placeholder={'npm\nrun\ncheck'} /></label>
        <label>超时 ms<input type="number" min={1000} max={60000} step={1000} value={check.timeoutMs} onChange={e => updateProfile(index, { checks: profile.checks.map((c, i) => i === ci ? { ...c, timeoutMs: Math.min(60000, Math.max(1000, Math.trunc(Number(e.target.value) || 1000))) } : c) })} /></label>
        {profile.checks.length > 1 && <button type="button" onClick={() => updateProfile(index, { checks: profile.checks.filter((_, i) => i !== ci) })}>删除该检查</button>}
      </div>)}
      {profile.checks.length < 4 && <button type="button" onClick={() => updateProfile(index, { checks: [...profile.checks, { id: `check-${profile.checks.length + 1}`, argv: [], timeoutMs: 60000 }] })}>添加检查</button>}
      <label>受保护的路径（每行一条；被本次改动碰到即判定失败）<textarea rows={2} value={profile.protectedPaths.join('\n')} onChange={e => updateProfile(index, { protectedPaths: e.target.value.split(/\r?\n/).map(v => v.trim()).filter(Boolean) })} placeholder={'test/acceptance.mjs\npackage.json'} /></label>
      <label className="tm-verify-toggle"><input type="checkbox" checked={profile.expectsChanges} onChange={e => updateProfile(index, { expectsChanges: e.target.checked })} />本次预期产生文件变更</label>
      <button type="button" onClick={() => patch({ verificationProfiles: draft.verificationProfiles.filter((_, i) => i !== index) })}>删除这套验证方案</button>
    </fieldset>)}

    <fieldset className="tm-verify-profile" disabled={!writable || busy}>
      <legend>TypeSafe 数据传输</legend>
      <label className="tm-verify-toggle"><input type="checkbox" checked={draft.disclosureAccepted} onChange={e => patch({ disclosureAccepted: e.target.checked })} />我已阅读并同意把脱敏、限长的任务文本、差异统计与检查摘要发送给 TypeSafe 的 Jev 服务</label>
      <p className="tm-verify-foot">Jev 决定任务分档与是否算完成；不发送源码全文、完整日志、会话历史、密钥或权限设置。密钥不进浏览器：只按环境变量名解析（DSH 凭据 → 宿主环境变量）。</p>
    </fieldset>

    <div className="tm-verify-actions">
      <button type="button" disabled={!writable || busy} onClick={() => patch({ verificationProfiles: [...draft.verificationProfiles, emptyProfile()] })}>添加验证方案</button>
      <button type="button" disabled={!writable || busy} onClick={() => void save()}>{busy ? '保存中…' : '保存'}</button>
    </div>
    <p className="tm-verify-foot">检查由宿主原生 bash 以仓库根为工作目录执行，受原有沙箱约束。浏览器不能提供可执行路径、端点或权限覆盖；这里也不接收任何密钥。</p>
  </section>;
}

export { ROW_KEY };
