/** Actual DSH 0.2.0-rc.2 adapter. Never calls a model until execute() is explicitly used. */
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

const readTools = new Set(['read', 'read_image', 'glob', 'grep', 'structured_output']);
const researchTools = new Set([...readTools, 'web_search', 'web_fetch']);
const workerTools = new Set([...readTools, 'write', 'edit', 'bash', 'pwsh']);
const clean = (value, length=500) => typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,'').slice(0,length) : '';
export class TeamHostError extends Error { constructor(code,message){super(message);this.code=code;this.retryable=false;} }
function need(condition,code,message){if(!condition)throw new TeamHostError(code,message);}

export function createExecutionAdapter(ctx, { onParentUnavailable = () => {}, onCleanupFailed = () => {} } = {}) {
  const creation = new AsyncLocalStorage();
  const contexts = new WeakMap();
  const activeParents = new Set();
  const activeFingerprints = new Map();
  const parentGuards=new Map();const quarantined=new Set();
  let monitor;
  const owned = new Map();
  const disposers = [];
  let closed=false;
  function requireSpawn(){const provider=ctx.subagents.getProvider('spawn');need(provider?.capabilities?.agentOptions && provider.capabilities.outputSchema && provider.capabilities.persona && provider.capabilities.depthLimit,'UNSUPPORTED_HOST','当前宿主缺少支持独立模型和结构化输出的 spawn 子代理。');}

  function permissionState(parent){
    const policy=ctx.get?.('sandboxPolicy');
    need(policy && typeof policy.resolve==='function','POLICY_UNAVAILABLE','无法核验宿主的文件权限策略，已阻止团队执行。');
    const sandbox=policy.resolve({session:parent.session});
    const preset=ctx.get?.('permissionPresets')?.current(parent.session)||'';
    const approval=ctx.get?.('approval')?.overrideOf(parent.session);
    return {cwd:parent.session.header.cwd,sandboxMode:sandbox.mode,workspaceRoot:sandbox.workspaceRoot,preset,approval};
  }
  function fingerprint(parent){return JSON.stringify(permissionState(parent));}
  function checkActive(){for(const id of activeParents){const parent=ctx.agents.get(id);try{if(!parent||parent.status!=='idle'||fingerprint(parent)!==activeFingerprints.get(id))onParentUnavailable(id,'执行上下文或权限已变化，团队运行已取消。');}catch{onParentUnavailable(id,'无法核验执行权限，团队运行已取消。');}}}
  disposers.push(ctx.on('session/event',(session,event)=>{if(activeParents.has(session.id)&&['sandbox/mode','approval/policy','permission/preset'].includes(event.type))onParentUnavailable(session.id,'宿主权限设置已变化，团队运行已取消。');}));

  // Serial agent/created listeners are awaited before AgentLoop admits the initial prompt.
  // Guarding actual execution also covers scoped tools that toolFilter cannot hide.
  disposers.push(ctx.on('agent/created', async ({agent})=>{
    const tag=creation.getStore();if(!tag)return;
    need(agent.session.header.parentSession===tag.parent.id && ctx.agents.isOwnedBy(agent.id,tag.parent),'CHILD_IDENTITY','子代理归属无法验证，已阻止执行。');
    const tools=agent.ctx.get('tools');
    need(tools && typeof tools.guard==='function' && typeof tools.presentAs==='function','UNSAFE_TOOLS','无法安装子代理工具执行保护，已阻止执行。');
    const allowed=tag.role==='worker'?workerTools:tag.role==='researcher'?researchTools:readTools;
    const guard=tools.guard(exec=>{if(allowed.has(exec.name))return;tag.blockedReason='岗位尝试了不允许的工具，已阻止执行；不会扩大权限或递归派发。';return tag.blockedReason;});
    agent.ctx.on('tools/pre-execute',async (_exec,next)=>{const decision=await next();if(decision.kind==='ask'||decision.kind==='deny')tag.blockedReason='宿主权限拒绝或要求额外批准。子代理不能代替用户批准，请在主会话处理。';return decision;});
    const presentation=tools.presentAs('native');
    let steps=0;
    const cap=agent.ctx.on('agent/pre-step', async (_payload,next)=>{
      if(tag.signal.aborted)return {kind:'reject'};
      if(fingerprint(tag.parent)!==tag.fingerprint){tag.blockedReason='宿主权限已变化，已停止新的模型请求。';onParentUnavailable(tag.parent.id,tag.blockedReason);return {kind:'reject'};}
      if(++steps>tag.limits.maxStepsPerAgent){tag.blockedReason='子代理达到模型请求步骤上限，已停止；不会继续重试。';return {kind:'reject'};}
      return next();
    });
    tag.created.add(agent);owned.set(agent.id,{agent,tag,guard,presentation,cap});
  }));
  disposers.push(ctx.on('agent/disposed',({agent})=>{
    owned.delete(agent.id);
    if(activeParents.has(agent.id))onParentUnavailable(agent.id,'当前会话已关闭，团队运行已取消。');
  }));
  disposers.push(ctx.on('agent/status',({agent,status})=>{
    if(status==='running' && activeParents.has(agent.id))onParentUnavailable(agent.id,'当前主会话开始了新任务，团队运行已取消以避免并发修改。');
  }));

  function parentFor(sessionId,{idle=false}={}){
    need(!closed,'UNAVAILABLE','工作流服务已关闭。');requireSpawn();
    need(typeof sessionId==='string' && sessionId.length>0 && sessionId.length<=128,'SESSION_REQUIRED','请先打开一个真实 DSH 会话。');
    const parent=ctx.agents.get(sessionId);
    need(parent && parent.id===sessionId,'SESSION_UNAVAILABLE','当前会话没有可用的 Agent，请打开会话后重试。');
    need(!parent.session.header.parentSession,'ROOT_SESSION_REQUIRED','请在主会话中启动团队，不能从子代理递归派发。');
    if(idle)need(parent.status==='idle','SESSION_BUSY','当前主会话仍在运行，请等待它结束后再启动团队。');
    return parent;
  }
  function context(sessionId){
    try{const parent=parentFor(sessionId);const currentFingerprint=fingerprint(parent);let entry=contexts.get(parent);if(!entry||entry.fingerprint!==currentFingerprint){entry={key:randomUUID(),fingerprint:currentFingerprint};contexts.set(parent,entry);}const key=entry.key;let preset='';try{preset=clean(ctx.get?.('permissionPresets')?.current(parent.session),100);}catch{}return {sessionId,contextKey:key,available:true,canStart:parent.status==='idle',workspace:clean(parent.session.header.cwd,1000),reason:parent.status==='idle'?undefined:'当前主会话正在运行。',permissionNotice:`继承当前会话权限${preset?'（'+preset+'）':''}，不提升权限。${preset==='danger-full-access'?'注意：当前宿主会话已启用完全访问。':''}子代理需要额外批准时会被宿主拒绝。`};}
    catch(error){return {sessionId,available:false,canStart:false,reason:error.message};}
  }
  function verifyContext(sessionId,key){const parent=parentFor(sessionId,{idle:true});need(typeof key==='string' && contexts.get(parent)?.key===key && contexts.get(parent)?.fingerprint===fingerprint(parent),'STALE_SESSION','会话已变化，请刷新面板后重新确认运行。');return parent;}
  async function catalog(selected=[]){
    need(Array.isArray(selected)&&selected.length<=7,'INVALID_INPUT','模型查询数量无效。');
    const providers=[];
    for(const provider of ctx.llm.listProviders().slice(0,20)){
      const id=provider.id;if(typeof id!=='string'||!id||id.length>120||clean(id,120)!==id)continue;
      try{
        const models=(await ctx.llm.listModels(id)).slice(0,100).filter(m=>typeof m.id==='string'&&m.id.length>0&&m.id.length<=160&&clean(m.id,160)===m.id).map(m=>({id:m.id,name:clean(m.name,250)||m.id}));
        for(const model of models){if(!selected.some(s=>s?.provider===id && s?.model===model.id))continue;
          try{const info=await ctx.llm.resolveModelInfo(id,model.id);if(info.reasoning){model.efforts=(info.reasoning.efforts||[]).slice(0,20).filter(e=>typeof e.id==='string'&&e.id.length>0&&e.id.length<=32&&clean(e.id,32)===e.id).map(e=>({id:e.id,name:clean(e.name,100)||e.id}));model.defaultEffort=model.efforts.some(e=>e.id===info.reasoning.defaultEffort)?info.reasoning.defaultEffort:undefined;}}
          catch{/* A unavailable metadata row never creates an invented effort option. */}
        }
        providers.push({id,name:clean(provider.name,200)||id,models});
      }catch{/* Keep other configured providers available without forwarding credential diagnostics. */}
    }
    return {available:providers.some(p=>p.models.length),providers,reason:providers.some(p=>p.models.length)?undefined:'宿主尚未提供可用的已配置模型目录。请先在 DSH 中配置模型。'};
  }
  async function validateModels(roles,signal){
    const available=await catalog();const seen=new Map();
    for(const [role,selection]of Object.entries(roles)){
      const route=available.providers.find(p=>p.id===selection.provider)?.models.find(m=>m.id===selection.model);
      need(route,'MODEL_NOT_CONFIGURED',`岗位 ${role} 选择的模型不在当前宿主目录中。`);
      const key=JSON.stringify(selection);if(seen.has(key))continue;
      const validated=await ctx.llm.resolveCallConfig({...selection},signal);
      need(validated.provider===selection.provider && validated.model===selection.model,'MODEL_ROUTE_CHANGED','宿主返回的模型路由与已选择路由不同。');seen.set(key,true);
    }
  }
  async function execute(spec){
    need(!quarantined.has(spec.sessionId),'CLEANUP_UNCONFIRMED','子代理清理未确认，禁止继续派发。');
    const parent=parentFor(spec.sessionId,{idle:true});
    need(!spec.signal.aborted,'CANCELLED','运行已取消。');
    const currentFingerprint=fingerprint(parent);need(activeFingerprints.get(parent.id)===currentFingerprint,'CONTEXT_CHANGED','执行上下文或权限已变化，请重新确认。');
    const tag={parent,role:spec.role,limits:spec.limits,signal:spec.signal,created:new Set(),fingerprint:currentFingerprint};
    const maxDepth=ctx.subagents.resolveMaxDepth();
    need(Number.isSafeInteger(maxDepth)&&maxDepth>=1,'DEPTH_UNAVAILABLE','宿主未允许当前会话派发子代理。');
    let run;
    activeParents.add(parent.id);if(!monitor)monitor=setInterval(checkActive,500);
    try{
      run=await creation.run(tag,()=>ctx.subagents.start('spawn',{
        label:`工作流 ${spec.role} · ${clean(spec.nodeId,80)}`,
        parent,prompt:[{type:'text',text:spec.prompt}],signal:spec.signal,
        agentOptions:{...spec.model},outputSchema:spec.outputSchema,maxDepth,
        persona:'你是软件开发团队中的受限岗位。只完成派发的任务，使用已提供的工具。不要修改安全设置、凭据或权限，不要创建其它代理。所有证据必须来自实际观察；遇到权限拒绝应报告受阻，不得绕过。',
      }));
      need(run.localAgent && tag.created.has(run.localAgent),'GUARD_NOT_INSTALLED','子代理未通过执行保护验证，已取消。');
      spec.onChildStart?.(run.id);
      const result=await run.result;
      return {stopReason:tag.blockedReason?'refusal':result.stopReason,structured:tag.blockedReason?undefined:result.structured,output:tag.blockedReason||(result.output||[]).filter(b=>b.type==='text').map(b=>clean(b.text,16000)).join('\n').slice(0,24000),childId:run.id};
    }catch(error){
      if(error instanceof TeamHostError)throw error;
      throw new TeamHostError('CHILD_FAILED','子代理运行失败；请在宿主会话检查模型连接或权限。不会自动放宽权限。');
    }finally{if(run){try{await run.dispose();}catch{quarantined.add(spec.sessionId);onCleanupFailed(spec.sessionId);throw new TeamHostError('CLEANUP_FAILED','子代理未能确认清理完成，已停止继续派发；请检查宿主会话。');}}}
  }
  return {context,verifyContext,catalog,validateModels,execute,
    beginSession(sessionId,key){need(!quarantined.has(sessionId),'CLEANUP_UNCONFIRMED','子代理清理未确认，禁止新运行。');const parent=verifyContext(sessionId,key);const tools=parent.ctx?.get('tools');need(tools&&typeof tools.guard==='function','PARENT_GUARD_UNAVAILABLE','无法保护主会话与子代理的并发写入，已阻止执行。');const cleanup=tools.guard(exec=>exec.agent===parent&&!researchTools.has(exec.name)?'团队运行或清理期间，主会话的修改操作已暂停。请先取消团队并等待清理完成。':undefined);parentGuards.set(sessionId,cleanup);activeFingerprints.set(sessionId,fingerprint(parent));},
    releaseSession(sessionId){if(quarantined.has(sessionId))return;parentGuards.get(sessionId)?.();parentGuards.delete(sessionId);activeParents.delete(sessionId);activeFingerprints.delete(sessionId);if(!activeParents.size){clearInterval(monitor);monitor=undefined;}},
    async dispose(){closed=true;clearInterval(monitor);for(const dispose of disposers.reverse())await dispose();owned.clear();for(const[id,cleanup]of parentGuards)if(!quarantined.has(id))cleanup();activeParents.clear();},
  };
}
