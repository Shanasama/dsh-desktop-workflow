import React, { useEffect, useRef, useState } from 'react';
import { TeamView, TeamSettingsView } from './TeamView';
import { createDefaultTeamSettings, type CredentialStatus, type TeamCatalog, type TeamSettingsInput, type TeamSetup, type TeamSettings, type TeamSnapshot, type TeamSessionContext } from './team-types';
import { teamDemoSnapshot } from './team-demo';
import { requestWithDeadline } from './request';
import type { HostContext } from './index';

export const JEV_CREDENTIAL_REF = 'DSH_TEAM_JEV_API_KEY';
export type StateResponse = { snapshot: TeamSnapshot | null; context: TeamSessionContext & { sessionId?: string; lastCommand?: { kind: string; message: string; runId?: string } } };
const emptySetup = (): TeamSetup => ({ settings: createDefaultTeamSettings(), configured: false, keyConfigured: false, disclosureAccepted: false, revision: 0 });
const emptyCatalog: TeamCatalog = { available: false, providers: [], reason: '正在读取宿主模型目录…' };
export async function teamCall<T>(ctx: HostContext, action: string, payload: object, signal: AbortSignal): Promise<T> {
  const result = await requestWithDeadline(s => ctx.connection.rpc.call('/api', 'dsh-desktop-workflow/team/' + action, payload, s), signal);
  if (!result.ok) throw new Error(result.error.message);
  return result.value as T;
}

export function ConnectedTeamSettings({ ctx, onClose }: { ctx: HostContext; onClose: () => void }) {
  const [setup, setSetup] = useState<TeamSetup>(emptySetup);
  const [catalog, setCatalog] = useState<TeamCatalog>(emptyCatalog);
  const [credential, setCredential] = useState<CredentialStatus>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [revision, setRevision] = useState(0);
  const live = useRef(true);
  const saveLock = useRef(false);
  const modelRequest = useRef<AbortController>();
  useEffect(() => { live.current = true; return () => { live.current = false; modelRequest.current?.abort(); }; }, []);
  useEffect(() => {
    const abort = new AbortController(); setLoading(true); setCatalog(emptyCatalog); setCredential(undefined);
    void (async () => {
      try {
        const stored = await teamCall<TeamSetup>(ctx, 'settings', {}, abort.signal);
        if (abort.signal.aborted) return;
        setSetup(stored);
        const [models, status] = await Promise.all([
          teamCall<TeamCatalog>(ctx, 'catalog', { selected: Object.values(stored.settings.roles).map(({ provider, model }) => ({ provider, model })) }, abort.signal),
          ctx.remote?.credentials?.describe([JEV_CREDENTIAL_REF]),
        ]);
        if (abort.signal.aborted) return;
        setCatalog(models);
        setCredential(status?.ok ? status.value[JEV_CREDENTIAL_REF] : undefined);
      } catch (failure) {
        if (!abort.signal.aborted) {
          setCatalog({ available: false, providers: [], reason: '团队设置读取失败，请刷新重试。' });
          setError(failure instanceof Error ? failure.message : '无法读取团队设置，请刷新重试。');
        }
      }
      finally { if (!abort.signal.aborted) setLoading(false); }
    })();
    return () => abort.abort();
  }, [ctx, revision]);
  function refreshModelSelection(roles: TeamSettings['roles']) {
    modelRequest.current?.abort();
    const abort = new AbortController(); modelRequest.current = abort;
    void teamCall<TeamCatalog>(ctx, 'catalog', { selected: Object.values(roles).map(({ provider, model }) => ({ provider, model })) }, abort.signal).then(models => {
      if (!abort.signal.aborted && live.current) setCatalog(models);
    }).catch(() => {
      if (!abort.signal.aborted && live.current) setError('无法更新所选模型的能力目录，请刷新后重试。');
    });
  }
  async function save(input: TeamSettingsInput) {
    if (saveLock.current) return;
    saveLock.current = true; setSaving(true); setError(undefined); setNotice(undefined);
    let keySaved = false;
    try {
      // The key goes only to the host's native credentials namespace.
      if (input.jevKey) {
        if (!ctx.remote?.credentials || !credential?.writable) throw new Error('原生凭据存储不可写，密钥未保存。');
        const result = await ctx.remote.credentials.set(JEV_CREDENTIAL_REF, input.jevKey).catch(() => { throw new Error('密钥保存结果未确认，请刷新连接状态后检查；不会自动重试。'); });
        input.jevKey = undefined;
        if (!result.ok) throw new Error('原生凭据服务未确认保存密钥，请刷新连接状态后重试。');
        keySaved = true;
      }
      const stored = await teamCall<TeamSetup>(ctx, 'configure', { settings: input.settings, disclosureAccepted: input.disclosureAccepted, expectedRevision: setup.revision }, new AbortController().signal);
      if (live.current) {
        setSetup(stored);
        setNotice(stored.disclosureAccepted ? '设置已保存。回到项目聊天，输入 /team 和任务目标即可开始。' : 'TypeSafe 数据传输已停用。新的 /team 运行会等待你重新启用。');
        setRevision(value => value + 1);
      }
    } catch (failure) {
      if (live.current) {
        // Never render a credential service's raw error, which could contain input.
        const reason = failure instanceof Error ? failure.message : '连接中断，请刷新后确认。';
        setError((keySaved ? 'Jev 密钥已保存，但团队设置未完成。' : '') + reason);
        setRevision(value => value + 1);
      }
    } finally { input.jevKey = undefined; saveLock.current = false; if (live.current) setSaving(false); }
  }
  return <TeamSettingsView setup={setup} catalog={catalog} credential={credential} loading={loading} saving={saving} error={error} notice={notice} onSave={save} onModelSelectionChange={refreshModelSelection} onClose={onClose} onRefresh={() => { setError(undefined); setNotice(undefined); setRevision(value => value + 1); }}/>;
}

export function ConnectedTeam({ ctx, sessionId, navigationRevision = 0, onOpenSettings }: { ctx: HostContext; sessionId?: string; navigationRevision?: number; onOpenSettings: () => void }) {
  const [setup, setSetup] = useState<TeamSetup>(emptySetup);
  const [catalog, setCatalog] = useState<TeamCatalog>(emptyCatalog);
  const [snapshot, setSnapshot] = useState<TeamSnapshot | null>(null);
  const [sessionContext, setSessionContext] = useState<StateResponse['context']>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [demo, setDemo] = useState(false);
  const generation = useRef(0);
  const current = useRef(sessionId); current.current = sessionId;
  useEffect(() => {
    const abort = new AbortController();
    void (async () => {
      try {
        const stored = await teamCall<TeamSetup>(ctx, 'settings', {}, abort.signal);
        if (abort.signal.aborted) return;
        setSetup(stored);
        const models = await teamCall<TeamCatalog>(ctx, 'catalog', { selected: Object.values(stored.settings.roles).map(({ provider, model }) => ({ provider, model })) }, abort.signal);
        if (!abort.signal.aborted) setCatalog(models);
      } catch { if (!abort.signal.aborted) setCatalog({ available: false, providers: [], reason: '无法读取团队设置或模型目录，请刷新重试。' }); }
    })();
    return () => abort.abort();
  }, [ctx, revision, navigationRevision]);
  useEffect(() => {
    const token = ++generation.current;
    const abort = new AbortController(); let timer: ReturnType<typeof setTimeout>;
    setSnapshot(null); setSessionContext(undefined); setError(undefined); setLoading(true);
    if (demo) { setSnapshot(teamDemoSnapshot()); setLoading(false); return () => abort.abort(); }
    if (!sessionId) { setLoading(false); return () => abort.abort(); }
    const bound = sessionId;
    async function refresh() {
      try {
        const state = await teamCall<StateResponse>(ctx, 'snapshot', { sessionId: bound }, abort.signal);
        if (abort.signal.aborted || current.current !== bound || token !== generation.current) return;
        setSnapshot(state.snapshot); setSessionContext(state.context); setError(undefined);
      } catch (failure) { if (!abort.signal.aborted && token === generation.current) setError(failure instanceof Error ? failure.message : '无法读取团队运行。'); }
      finally { if (!abort.signal.aborted && token === generation.current) { setLoading(false); timer = setTimeout(refresh, 1500); } }
    }
    void refresh(); return () => { abort.abort(); clearTimeout(timer); };
  }, [ctx, sessionId, demo, revision, navigationRevision]);
  useEffect(() => { setDemo(false); }, [sessionId, navigationRevision]);
  async function cancel() {
    if (!sessionId || !snapshot || snapshot.demo || snapshot.sessionId !== sessionId) return;
    const bound = sessionId; const token = generation.current;
    const state = await teamCall<StateResponse>(ctx, 'cancel', { sessionId, runId: snapshot.id }, new AbortController().signal);
    if (current.current === bound && token === generation.current) setSnapshot(state.snapshot);
  }
  return <TeamView catalog={catalog} sessionId={sessionId} sessionContext={sessionContext} snapshot={snapshot} settings={setup.settings} configured={setup.configured} loading={loading} error={error || (sessionContext?.lastCommand?.kind === 'blocked' ? sessionContext.lastCommand.message : undefined)} onOpenSettings={onOpenSettings} onCancel={cancel} onDemo={() => setDemo(value => !value)} onRefresh={() => { setDemo(false); setRevision(value => value + 1); }}/>;
}
