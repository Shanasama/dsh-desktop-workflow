import React from 'react';

// Structural contracts verified against official DSH 0.2.0-rc.2:
// uiConversation.events and conversation.chat.node / .commandview slots.
const SOURCE = 'dsh-desktop-workflow/team-feedback';
const KIND = 'dsh-desktop-workflow-team-feedback';
type Disposer = () => void | Promise<void>;
type Feedback = { seq: number; text: string; sessionId: string; runId: string; status: string };
type Match = {event: {type: string; seq: number; surfaceOp?: unknown; data: any}; location: unknown};
type Context = {key: string; id: string; state?: Feedback; start?: Match; matches: Match[]};
type Host = {
  uiConversation: {events: {register(definition: object): Disposer}};
  slots: {inject(name: string, callback: () => Disposer): Disposer; register(definition: object, component: React.ComponentType<any>): Disposer};
};
function read(event: Match['event']): Feedback | undefined {
  const message=event.data,source=message?.source;
  if(event.type!=='user/message'||event.surfaceOp!=='append'||message?.role!=='user'||source?.kind!==SOURCE||source.phase!=='terminal')return;
  if(!['completed','unverified','blocked','failed','cancelled'].includes(source.status)||typeof source.runId!=='string'||source.runId.length>128||typeof source.sessionId!=='string'||source.sessionId.length>128)return;
  if(!Array.isArray(message.content)||message.content.length!==1||message.content[0]?.type!=='text'||typeof message.content[0].text!=='string'||message.content[0].text.length>1800)return;
  return {seq:event.seq,text:message.content[0].text,sessionId:source.sessionId,runId:source.runId,status:source.status};
}
export const teamFeedbackDefinition = {
  kind: KIND, target: 'chat',
  match(event: Match['event']) { const data=read(event);return data?{id:data.runId,role:'start' as const}:null; },
  start(_context: Context,match: Match) { return read(match.event); },
  update(context: Context,match: Match) { return read(match.event)||context.state; },
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
  return <section aria-label="多模型团队结果" data-team-feedback="terminal" data-team-status={data.status} style={{margin:'12px 0',padding:'12px 16px',border:'1px solid var(--dsw-alias-border-l1, #64748b)',borderRadius:8}}><strong style={{fontSize:13}}>多模型团队 · 运行结果</strong><div style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',lineHeight:1.75,marginTop:8}}>{data.text}</div></section>;
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
