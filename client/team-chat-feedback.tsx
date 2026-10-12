import React from 'react';

// Structural contracts verified against official DSH 0.2.0-rc.2:
// uiConversation.events and conversation.chat.node / .commandview slots.
const SOURCE = 'dsh-desktop-workflow/team-feedback';
const KIND = 'dsh-desktop-workflow-team-feedback';
type Disposer = () => void | Promise<void>;
type Feedback = { seq: number; text: string; sessionId: string; runId: string; status: string; admission: 'recorded' | 'admitted' };
type Match = {event: {type: string; seq: number; surfaceOp?: unknown; data: any}; location: unknown};
type Context = {key: string; id: string; state?: Feedback; start?: Match; matches: Match[]};
type Host = {
  uiConversation: {events: {register(definition: object): Disposer}};
  slots: {inject(name: string, callback: () => Disposer): Disposer; register(definition: object, component: React.ComponentType<any>): Disposer};
};
function read(event: Match['event']): Feedback | undefined {
  const message=event.type==='agent/inbox/spliced'&&Array.isArray(event.data?.inserted)&&event.data.inserted.length===1?event.data.inserted[0]:event.type==='user/message'&&event.surfaceOp==='append'?event.data:undefined,source=message?.source;
  if(message?.role!=='user'||source?.kind!==SOURCE||source.form!=='notice'||source.phase!=='terminal')return;
  if(!['completed','unverified','blocked','failed','cancelled'].includes(source.status)||typeof source.runId!=='string'||source.runId.length>160||typeof source.sessionId!=='string'||source.sessionId.length>128)return;
  if(!Array.isArray(message.content)||message.content.length!==1||message.content[0]?.type!=='text'||typeof message.content[0].text!=='string'||message.content[0].text.length>6000)return;
  return {seq:event.seq,text:message.content[0].text,sessionId:source.sessionId,runId:source.runId,status:source.status,admission:event.type==='user/message'?'admitted':'recorded'};
}
export const teamFeedbackDefinition = {
  kind: KIND, target: 'chat',
  match(event: Match['event']) { const data=read(event);return data?{id:data.runId,role:'start' as const}:null; },
  start(_context: Context,match: Match) { return read(match.event); },
  update(context: Context,match: Match) { const data=read(match.event);return data&&context.state?{...data,seq:context.state.seq,admission:context.state.admission==='admitted'?'admitted':data.admission}:data||context.state; },
  buildViewNode(context: Context) {
    if(!context.state)return null;
    // This is a session-level workflow result, even if a newer main-model turn
    // cancelled the run. Never hide it inside that unrelated turn's process fold.
    return {key:context.key,id:context.id,kind:KIND,target:'chat',anchorSeq:context.state.seq,location:{kind:'session'},visibility:'visible',data:context.state};
  },
};
export function TeamFeedbackMessage({node,sessionId}:{node:{data:Feedback};sessionId?:string}) {
  const data=node.data;
  // Forked history must not display another session's notice as this run's result.
  if(sessionId!==data.sessionId)return null;
  return <section aria-label="多模型团队结果" data-team-feedback="terminal" data-team-status={data.status} data-team-context={data.admission} style={{margin:'12px 0',padding:'12px 16px',border:'1px solid var(--dsw-alias-border-l1, #64748b)',borderRadius:8}}><strong style={{fontSize:13}}>多模型团队 · 运行结果</strong><div style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',lineHeight:1.75,marginTop:8}}>{data.text}</div><div style={{fontSize:12,opacity:.8,marginTop:8}}>{data.admission==='admitted'?'已接纳为模型上下文；后续会话压缩可能摘要或裁剪。':'历史已记录。首次主模型读取前关闭或移除此待处理项，会取消其进入模型上下文；记录仍可查看。'}</div></section>;
}
export function TeamCommandMessage({node}:{node:{outcome?:{kind:string;text?:string}|null}}) {
  const pending=!node.outcome;
  return <section aria-label="多模型团队命令" data-team-feedback="command" style={{margin:'10px 0',padding:'10px 14px',borderLeft:'3px solid var(--dsw-alias-state-business-primary, #64748b)'}}><strong style={{fontSize:13}}>多模型团队 · /team</strong><div role={pending?'status':undefined} style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',lineHeight:1.75,marginTop:4}}>{node.outcome?.text||(pending?'正在检查团队启动条件…':'命令已处理。')}</div></section>;
}
export function registerTeamChatFeedback(ctx: Host): Disposer {
  const disposers=[
    ctx.uiConversation.events.register(teamFeedbackDefinition),
    ctx.slots.inject('conversation.chat.node',()=>ctx.slots.register({name:'conversation.chat.node',key:KIND},TeamFeedbackMessage)),
    ctx.slots.inject('conversation.chat.commandview',()=>ctx.slots.register({name:'conversation.chat.commandview',key:'team'},TeamCommandMessage)),
  ];
  return ()=>{for(const dispose of disposers.reverse())void dispose();};
}
