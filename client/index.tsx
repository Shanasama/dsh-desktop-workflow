import React, { useEffect, useRef, useState } from 'react';
import { WorkflowView, type Snapshot } from './WorkflowView';
import { demoSnapshot } from './demo';
import css from './workflow.css';
import { requestWithDeadline } from './request';
export { requestWithDeadline } from './request';

export const inject = ['slots', 'sidebarRightTabs', 'connection'];
export const PACKAGE = 'dsh-desktop-workflow';
export const ENDPOINT = 'dsh-desktop-workflow/snapshot';
// Structural contracts verified against DSH 0.2.0-rc.2; no second React runtime.
type Disposer = () => void | Promise<void>;
type Result = {ok:true;value:Snapshot}|{ok:false;error:{message:string}};
export interface HostContext {
  effect(fn:()=>Disposer,label:string):unknown;
  connection:{rpc:{call(channel:string,endpoint:string,payload:object,signal:AbortSignal):Promise<Result>}};
  sidebarRightTabs:{register(definition:{id:string;kind:string;title:()=>string;guide:{id:string;order:number;title:()=>string;description:()=>string}[]}):Disposer};
  slots:{inject(name:string,fn:()=>Disposer):Disposer;register(definition:{name:string;key:string},component:React.ComponentType):Disposer};
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
        if(result.ok){setSnapshot(result.value);setError(undefined);}else{setSnapshot(null);setError(result.error.message);}
      }catch(error){if(!controller.signal.aborted && token===generation.current){setSnapshot(null);setError(error instanceof Error && error.message.includes('15 秒内未响应') ? error.message : '无法连接桌面工作流桥接服务，请重新打开面板或加载插件。');}}
      finally{if(!controller.signal.aborted && token===generation.current){setLoading(false);timer=setTimeout(refresh,5000);}}
    }
    void refresh();
    return()=>{controller.abort();clearTimeout(timer);};
  },[ctx,demo,revision]);
  return <WorkflowView snapshot={snapshot} loading={loading} error={error} onRefresh={()=>{setDemo(false);setRevision(r=>r+1);}} onDemo={()=>setDemo(v=>!v)}/>;
}
export function apply(ctx:HostContext){
  ctx.effect(()=>{const style=document.createElement('style');style.dataset.dshDesktopWorkflow='';style.textContent=css;document.head.append(style);return()=>style.remove();},'desktop-workflow: scoped styles');
  ctx.effect(()=>ctx.sidebarRightTabs.register({id:PACKAGE,kind:'dsh-desktop-workflow',title:()=> '工作流',guide:[{id:'workflow',order:35,title:()=> '工作流',description:()=> '只读查看 Jev 路由、阶段与证据'}]}),'desktop-workflow: native tab');
  const Body=()=> <ConnectedWorkflow ctx={ctx}/>;
  ctx.effect(()=>ctx.slots.inject('sidebar.right.pane.tab',()=>ctx.slots.register({name:'sidebar.right.pane.tab',key:PACKAGE},Body)),'desktop-workflow: native tab body');
}
