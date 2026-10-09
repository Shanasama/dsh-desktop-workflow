import React,{useEffect,useRef,useState} from 'react';
import {TeamView} from './TeamView';
import {createDefaultTeamSettings,type TeamSettings,type TeamCatalog,type TeamSnapshot} from './team-types';
import {teamDemoSnapshot} from './team-demo';
import {requestWithDeadline} from './request';
import type {HostContext} from './index';

class RpcRejected extends Error {}
const KEY='dsh-desktop-workflow:team-settings:v2';
const ROLES=['planner','coordinator','researcher','explorer','worker','reviewer','router'] as const;
type SessionContext={sessionId?:string;contextKey?:string;available?:boolean;canStart?:boolean;workspace?:string;reason?:string;permissionNotice?:string};
type StateResponse={snapshot:TeamSnapshot|null;context:SessionContext};
export function readTeamSettings():TeamSettings{
  const fallback=createDefaultTeamSettings();
  try{
    const raw=localStorage.getItem(KEY);if(!raw||raw.length>10000)return fallback;
    const value=JSON.parse(raw);if(!value||typeof value!=='object')return fallback;
    for(const role of ROLES){const x=value.roles?.[role];if(!x)continue;if(typeof x.provider!=='string'||x.provider.length>120||typeof x.model!=='string'||x.model.length>160)return fallback;
      const selection={provider:x.provider,model:x.model,...typeof x.reasoningEffort==='string'&&x.reasoningEffort.length<=32?{reasoningEffort:x.reasoningEffort}:{},...Number.isInteger(x.maxTokens)&&x.maxTokens>=1&&x.maxTokens<=32768?{maxTokens:x.maxTokens}:{maxTokens:4096}};
      fallback.roles[role]=selection;
    }
    const ranges={concurrency:[1,4],maxAgents:[1,32],maxTasks:[1,12],maxRetries:[0,2],maxDurationMs:[1000,1800000],maxStepsPerAgent:[1,16]};
    for(const key of Object.keys(ranges)as(keyof typeof ranges)[]){const v=value.limits?.[key];const[min,max]=ranges[key];if(Number.isInteger(v)&&v>=min&&v<=max)fallback.limits[key]=v;}
    if(typeof value.reviewPlan==='boolean')fallback.reviewPlan=value.reviewPlan;if(typeof value.routeEnabled==='boolean')fallback.routeEnabled=value.routeEnabled;
    if(!fallback.routeEnabled)delete fallback.roles.router;
    return fallback;
  }catch{return fallback;}
}
export function ConnectedTeam({ctx,sessionId}:{ctx:HostContext;sessionId?:string}){
  const [settings,setSettings]=useState<TeamSettings>(readTeamSettings);
  const [catalog,setCatalog]=useState<TeamCatalog>({available:false,providers:[],reason:'正在读取宿主模型目录…'});
  const [snapshot,setSnapshot]=useState<TeamSnapshot|null>(null);
  const [sessionContext,setSessionContext]=useState<SessionContext>();
  const [error,setError]=useState<string>();const[actionError,setActionError]=useState<string>();const[loading,setLoading]=useState(true);const[revision,setRevision]=useState(0);const[demo,setDemo]=useState(false);
  const current=useRef(sessionId);current.current=sessionId;
  const startBusy=useRef(false);
  const pendingStart=useRef<{sessionId:string;requestId:string}|null>(null);const[uncertainStart,setUncertainStart]=useState(false);
  const selectionKey=JSON.stringify(Object.values(settings.roles).filter(x=>x?.provider&&x?.model).map(x=>({provider:x!.provider,model:x!.model})));
  async function call<T>(action:string,payload:object,signal:AbortSignal):Promise<T>{
    const result=await requestWithDeadline(s=>ctx.connection.rpc.call('/api','dsh-desktop-workflow/team/'+action,payload,s),signal,action==='start'?30000:15000);
    if(!result.ok)throw new RpcRejected(result.error.message);return result.value as unknown as T;
  }
  useEffect(()=>{
    const abort=new AbortController();
    void call<TeamCatalog>('catalog',{selected:JSON.parse(selectionKey)},abort.signal).then(value=>{if(!abort.signal.aborted)setCatalog(value);}).catch(()=>{if(!abort.signal.aborted)setCatalog({available:false,providers:[],reason:'无法读取宿主模型目录。请检查已配置的模型服务。'});});
    return()=>abort.abort();
  },[ctx,selectionKey,revision]);
  useEffect(()=>{
    const abort=new AbortController();let timer:ReturnType<typeof setTimeout>;
    setSnapshot(null);setSessionContext(undefined);setError(undefined);setLoading(true);
    if(demo){setSnapshot(teamDemoSnapshot());setLoading(false);return()=>abort.abort();}
    if(!sessionId){setLoading(false);return()=>abort.abort();}
    const bound=sessionId;
    async function refresh(){try{const state=await call<StateResponse>('snapshot',{sessionId:bound},abort.signal);if(abort.signal.aborted||current.current!==bound)return;setSnapshot(state.snapshot);setSessionContext(state.context);
      const pending=pendingStart.current;if(pending?.sessionId===bound){const recovery=await call<StateResponse&{status:string;error?:string}>('request',pending,abort.signal);if(abort.signal.aborted||current.current!==bound)return;if(recovery.status==='accepted'||recovery.status==='failed'){pendingStart.current=null;setUncertainStart(false);setSnapshot(recovery.snapshot);setSessionContext(recovery.context);setActionError(recovery.error);}else{setUncertainStart(true);setActionError('启动结果尚未确认，正在查询原请求；不会自动再次启动。');}}else setError(undefined);}catch(error){if(!abort.signal.aborted&&current.current===bound)setError(error instanceof Error?error.message:'无法读取团队运行。');}finally{if(!abort.signal.aborted){setLoading(false);timer=setTimeout(refresh,1500);}}}
    void refresh();return()=>{abort.abort();clearTimeout(timer);};
  },[ctx,sessionId,demo,revision]);
  useEffect(()=>{setDemo(false);setUncertainStart(false);setActionError(undefined);},[sessionId]);
  const save=(next:TeamSettings)=>{setSettings(next);try{localStorage.setItem(KEY,JSON.stringify({roles:next.roles,limits:next.limits,reviewPlan:next.reviewPlan,routeEnabled:next.routeEnabled}));}catch{setError('岗位设置可继续使用，但当前浏览器无法持久保存。');}};
  async function start(input:{goal:string;settings:TeamSettings}){
    if(startBusy.current||demo||!sessionId||sessionContext?.sessionId!==sessionId||!sessionContext.contextKey||!sessionContext.canStart){setError('当前会话不可启动，请刷新面板后重新确认。');return;}
    startBusy.current=true;setLoading(true);setActionError(undefined);const bound=sessionId;const abort=new AbortController();const requestId=crypto.randomUUID();pendingStart.current={sessionId:bound,requestId};
    try{const state=await call<StateResponse>('start',{sessionId:bound,contextKey:sessionContext.contextKey,requestId,goal:input.goal,settings:input.settings},abort.signal);if(pendingStart.current?.requestId===requestId)pendingStart.current=null;if(current.current===bound){setUncertainStart(false);setSnapshot(state.snapshot);setSessionContext(state.context);}}
    catch(error){if(error instanceof RpcRejected&&pendingStart.current?.requestId===requestId)pendingStart.current=null;if(current.current===bound){if(error instanceof RpcRejected){setUncertainStart(false);setActionError(error.message);}else{setUncertainStart(true);setActionError('启动响应未确认：'+(error instanceof Error?error.message:'连接中断。')+' 正在查询原请求，不会自动重试启动。');}}}
    finally{startBusy.current=false;setLoading(false);}
  }
  async function cancel(){if(!sessionId||!snapshot||snapshot.demo||snapshot.sessionId!==sessionId)return;const bound=sessionId;try{const state=await call<StateResponse>('cancel',{sessionId,runId:snapshot.id},new AbortController().signal);if(current.current===bound)setSnapshot(state.snapshot);}catch(error){setError(error instanceof Error?error.message:'取消失败。');}}
  return <TeamView catalog={catalog} sessionId={sessionId} sessionContext={uncertainStart?{...sessionContext,canStart:false,reason:'原启动请求的结果尚未确认，请刷新状态；不会重复调用模型。'}:sessionContext} snapshot={snapshot} settings={settings} loading={loading} error={actionError||error} onSettingsChange={save} onStart={start} onCancel={cancel} onDemo={()=>setDemo(v=>!v)} onRefresh={()=>{setActionError(undefined);setDemo(false);setRevision(v=>v+1);}}/>;
}
