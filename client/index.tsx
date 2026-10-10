import React, { useEffect, useRef, useState } from 'react';
import { WorkflowView, type Snapshot } from './WorkflowView';
import { demoSnapshot } from './demo';
import { ConnectedTeam, ConnectedTeamSettings, teamCall, type StateResponse } from './ConnectedTeam';
import type { CredentialStatus } from './team-types';
import teamCss from './team.css';
import css from './workflow.css';
import { requestWithDeadline } from './request';
export { requestWithDeadline } from './request';

export const inject = ['slots', 'sidebarRightTabs', 'sidebarRight', 'connection', 'remote', 'remote.credentials'];
export const PACKAGE = 'dsh-desktop-workflow';
export const ENDPOINT = 'dsh-desktop-workflow/snapshot';
// Structural contracts verified against DSH 0.2.0-rc.2; no second React runtime.
type Disposer = () => void | Promise<void>;
export type RpcResult<T = unknown> = {ok:true;value:T}|{ok:false;error:{message:string}};
type TabBodyProps = {sessionId?:string;useTabInfo?:()=>{tab:{navigation:{params?:{view?:string};revision:number}}}};
export interface HostContext {
  effect(fn:()=>Disposer,label:string):unknown;
  on(name:'command/executed',listener:(sessionId:string,name:string,result:{kind:'success'|'error';text?:string})=>void):Disposer;
  connection:{rpc:{call(channel:string,endpoint:string,payload:object,signal:AbortSignal):Promise<RpcResult>}};
  remote?:{credentials?:{describe(refs:string[]):Promise<RpcResult<Record<string,CredentialStatus>>>;set(ref:string,value:string):Promise<RpcResult>}};
  sidebarRight:{mounted:{getSnapshot():string|undefined;subscribe(listener:()=>void):Disposer};openTab(kind:string,options?:{params?:{view?:string}}):void};
  sidebarRightTabs:{register(definition:{id:string;kind:string;title:()=>string;guide:{id:string;order:number;title:()=>string;description:()=>string}[]}):Disposer};
  slots:{inject(name:string,fn:()=>Disposer):Disposer;register(definition:{name:string;key?:string;id?:string;order?:number;label?:()=>string},component:React.ComponentType<any>):Disposer};
}
export function ConnectedWorkflow({ctx}:{ctx:HostContext}) {
  const [snapshot,setSnapshot] = useState<Snapshot|null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string>();
  const [demo,setDemo] = useState(false);
  const [revision,setRevision] = useState(0);
  const generation = useRef(0);
  useEffect(()=>{
    const token=++generation.current;
    if(demo){setSnapshot(demoSnapshot());setLoading(false);setError(undefined);return;}
    setSnapshot(null); setError(undefined);
    const controller=new AbortController();
    let timer:ReturnType<typeof setTimeout>;
    async function refresh(){
      setLoading(true);
      try{
        const result=await requestWithDeadline(signal=>ctx.connection.rpc.call('/api',ENDPOINT,{},signal),controller.signal);
        if(controller.signal.aborted || token!==generation.current)return;
        if(result.ok){setSnapshot(result.value as Snapshot);setError(undefined);}else{setSnapshot(null);setError(result.error.message);}
      }catch(error){if(!controller.signal.aborted && token===generation.current){setSnapshot(null);setError(error instanceof Error && error.message.includes('15 秒内未响应') ? error.message : '无法连接桌面工作流桥接服务，请重新打开面板或加载插件。');}}
      finally{if(!controller.signal.aborted && token===generation.current){setLoading(false);timer=setTimeout(refresh,5000);}}
    }
    void refresh();
    return()=>{controller.abort();clearTimeout(timer);};
  },[ctx,demo,revision]);
  return <WorkflowView snapshot={snapshot} loading={loading} error={error} onRefresh={()=>{setDemo(false);setRevision(r=>r+1);}} onDemo={()=>setDemo(v=>!v)}/>;
}
export function applyLegacy(ctx:HostContext){
  ctx.effect(()=>{const style=document.createElement('style');style.dataset.dshDesktopWorkflow='';style.textContent=css;document.head.append(style);return()=>style.remove();},'desktop-workflow: scoped styles');
  ctx.effect(()=>ctx.sidebarRightTabs.register({id:PACKAGE,kind:'dsh-desktop-workflow',title:()=> '工作流',guide:[{id:'workflow',order:35,title:()=> '工作流',description:()=> '只读查看 Jev 路由、阶段与证据'}]}),'desktop-workflow: native tab');
  const Body=()=> <ConnectedWorkflow ctx={ctx}/>;
  ctx.effect(()=>ctx.slots.inject('sidebar.right.pane.tab',()=>ctx.slots.register({name:'sidebar.right.pane.tab',key:PACKAGE},Body)),'desktop-workflow: native tab body');
}

/** Native acknowledgment only: ordinary text and another session never open this panel. */
export function registerTeamCommandListener(ctx: HostContext): Disposer {
  let mountedGeneration = 0; let requestGeneration = 0;
  const lifecycle = new AbortController();
  const offMounted = ctx.sidebarRight.mounted.subscribe(() => { mountedGeneration++; });
  const offCommand = ctx.on('command/executed', (sessionId, name) => {
    if (name !== 'team' || ctx.sidebarRight.mounted.getSnapshot() !== sessionId) return;
    const mountedToken = mountedGeneration; const requestToken = ++requestGeneration;
    void teamCall<StateResponse>(ctx, 'snapshot', { sessionId }, lifecycle.signal).then(state => {
      if (lifecycle.signal.aborted || requestToken !== requestGeneration || mountedToken !== mountedGeneration || ctx.sidebarRight.mounted.getSnapshot() !== sessionId) return;
      ctx.sidebarRight.openTab(PACKAGE, { params: { view: state.context.setupRequired ? 'settings' : 'results' } });
    }).catch(() => {
      if (!lifecycle.signal.aborted && requestToken === requestGeneration && mountedToken === mountedGeneration && ctx.sidebarRight.mounted.getSnapshot() === sessionId) ctx.sidebarRight.openTab(PACKAGE, { params: { view: 'results' } });
    });
  });
  return () => { lifecycle.abort(); offCommand(); offMounted(); };
}

export function apply(ctx:HostContext){
  ctx.effect(()=>{const style=document.createElement('style');style.dataset.dshDesktopWorkflow='';style.textContent=css+'\n'+teamCss;document.head.append(style);return()=>style.remove();},'desktop-workflow: scoped team styles');
  ctx.effect(()=>ctx.sidebarRightTabs.register({id:PACKAGE,kind:PACKAGE,title:()=> '多模型团队',guide:[{id:'workflow',order:35,title:()=> '多模型团队',description:()=> '设置一次，在聊天输入 /team 即可开始'}]}),'desktop-workflow: native team tab');
  function Body({sessionId,useTabInfo}:TabBodyProps){
    const info=useTabInfo?.();
    const navigation=info?.tab.navigation;
    const [view,setView]=useState('results');
    useEffect(()=>{setView(navigation?.params?.view==='settings'?'settings':'results');},[sessionId,navigation?.revision]);
    return view==='settings'?<ConnectedTeamSettings ctx={ctx} onClose={()=>setView('results')}/>:<ConnectedTeam key={sessionId||"no-session"} ctx={ctx} sessionId={sessionId} navigationRevision={navigation?.revision} onOpenSettings={()=>setView('settings')}/>;
  }
  const Settings=({close}:{close:()=>void})=><ConnectedTeamSettings ctx={ctx} onClose={close}/>;
  ctx.effect(()=>ctx.slots.inject('sidebar.right.pane.tab',()=>ctx.slots.register({name:'sidebar.right.pane.tab',key:PACKAGE},Body)),'desktop-workflow: native team body');
  ctx.effect(()=>ctx.slots.inject('settings.section',()=>ctx.slots.register({name:'settings.section',id:PACKAGE,order:36,label:()=> '多模型团队'},Settings)),'desktop-workflow: native team settings');
  ctx.effect(()=>registerTeamCommandListener(ctx),'desktop-workflow: native team command acknowledgment');
}

export {TeamView,TeamSettingsView} from './TeamView';
export {createDefaultTeamSettings} from './team-types';
export {teamDemoSnapshot} from './team-demo';

export {ConnectedTeam,ConnectedTeamSettings,JEV_CREDENTIAL_REF} from './ConnectedTeam';
