import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {WorkflowView,type Snapshot} from '../client/WorkflowView';
import {demoSnapshot} from '../client/demo';
import css from '../client/workflow.css';
const style=document.createElement('style');style.textContent=css;document.head.append(style);
function Preview(){
 const [mode,setMode]=useState('demo');const [dark,setDark]=useState(false);const [narrow,setNarrow]=useState(false);
 let data:Snapshot|null=demoSnapshot();let error:string|undefined;
 if(mode==='empty')data={mode:'waiting',title:'等待工作流',status:'pending',stage:'waiting',jev:null,stages:[],sourceNotice:'尚未配置状态文件；不会调用模型或执行任务。'};
 if(mode==='error'){data=null;error='未找到配置的工作流状态文件，请检查 Desktop profile 的 stateFile。';}
 if(['stale','completed','approval','failed','review'].includes(mode))data=demoSnapshot(mode as 'stale'|'completed'|'approval'|'failed'|'review');
 return <><div style={{font:'12px system-ui',padding:'10px 18px',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',background:dark?'#1b202b':'#fff',color:dark?'#eef1f8':'#475467',borderBottom:'1px solid #dbe1e9'}}><strong>组件预览</strong><span>同一插件组件 · 合成示例 · 非已安装 Desktop 会话</span><select aria-label="预览状态" value={mode} onChange={e=>setMode(e.target.value)}>{['demo','empty','error','stale','completed','approval','failed','review'].map(x=><option key={x}>{x}</option>)}</select><button onClick={()=>{document.body.toggleAttribute('data-ds-dark-theme',!dark);setDark(!dark);}}>主题： {dark?'深色':'浅色'}</button><button onClick={()=>setNarrow(!narrow)}>{narrow?'展开画布':'侧栏宽度'}</button></div><div style={{maxWidth:narrow?420:1440,margin:'24px auto',minHeight:700}}><WorkflowView snapshot={data} error={error} onDemo={()=>setMode(mode==='demo'?'empty':'demo')} onRefresh={()=>setMode('empty')}/></div></>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
