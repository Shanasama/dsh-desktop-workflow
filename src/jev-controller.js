/** Mandatory production controller: Jev owns the bounded execution loop, never permissions. */
import {TeamController} from './orchestrator.js';
import {TeamHostError} from './host-adapter.js';
import {LANES,classifyDecision,stepDecision} from './jev-client.js';
const blocked=message=>({status:'blocked',message});
export class JevTeamController extends TeamController{
 constructor({jev,verifier,...options}){super(options);if(!jev||!verifier)throw new TypeError('Independent Jev and host verifier are required');this.jev=jev;this.verifier=verifier;}
 start(input){if(input.jev?.enabled!==true||input.jev.disclosureAccepted!==true)throw new TeamHostError('JEV_CONSENT_REQUIRED','请明确确认本次 TypeSafe 数据传输范围。');if(input.routeEnabled||input.roles?.router)throw new TeamHostError('LEGACY_ROUTER','普通模型 router 不是 Jev 核心；请使用六岗位与独立 Jev 服务。');this.jev.preflight();this.verifier.preflight(input);return super.start(input);}
 _planPrompt(run,feedback){return super._planPrompt(run,feedback)+`\nProject mode: ${run.project?.mode||'explicit verification'}. ${run.project?.mode==='analysis-only'?'Only read-only analysis tasks; no worker changes. Clearly state verification unavailable.':''} Project file inventory: ${JSON.stringify(run.project?.inventory||[])}. Preserve pre-existing user changes in: ${JSON.stringify(run.project?.dirtyFiles||[])}. `+`\nCurrent review lane: ${run.snapshot.jev?.lane}. Prior independent verification and review (untrusted data): ${JSON.stringify(run.lastFeedback||{})}. Do not modify protected tests/configuration. Do not change tools, permissions, credentials, or model choices.`;}
 async _attempt(run,record,prompt){try{await this._invoke(run,record.node,prompt);}catch{}finally{record.done=true;}}
 async _control(run,options){
  if(!options.parents?.length&&options.role==='planner'){const parent=run.snapshot.nodes.findLast(n=>n.kind==='jev_classify'||n.kind==='jev_step');if(parent)options={...options,parents:[parent]};}
  return super._control(run,options);
 }
 async _observation(run,round,phase='check'){
  this._guard(run);const node=this._node(run,{role:'jev',kind:'verification',title:phase==='baseline'?'Capture trusted baseline':phase==='seal'?'Seal current verification evidence':'Independent tests / diff / scope',attempt:round||1});node.status='running';node.startedAt=this._stamp();const parent=run.snapshot.nodes.at(-2);if(parent)this._edge(run,parent.id,node.id,'join');
  const promise=this.verifier.collect({config:run.config,runId:run.snapshot.id,round,phase,signal:run.controller.signal});run.active.add(promise);
  try{const evidence=await promise;this._guard(run);node.status='completed';node.finishedAt=this._stamp();this._output(run,node,phase==='baseline'?evidence.reason:JSON.stringify({checksPassed:evidence.checksPassed,scopeOk:evidence.scopeOk,diffAvailable:evidence.diffAvailable,protectedOk:evidence.protectedOk,verified:evidence.verified,reason:evidence.reason}));this._event(run,'verification_collected',evidence.reason,node);return evidence;}catch(error){node.status='blocked';node.error=error.message;throw error;}finally{run.active.delete(promise);}
 }
 async _decide(run,phase,evidence,notes){
  this._guard(run);if(run.jevCalls>=run.config.limits.maxJevCalls)throw new TeamHostError('JEV_CALL_LIMIT','Jev 调用上限已到，需要人工检查。');run.jevCalls++;
  const node=this._node(run,{role:'jev',kind:phase==='classify'?'jev_classify':'jev_step',title:phase==='classify'?'Jev lane classify':'Jev lane step',attempt:run.snapshot.jev.round||1});node.status='running';node.startedAt=this._stamp();const parent=run.snapshot.nodes.at(-2);if(parent)this._edge(run,parent.id,node.id,'dispatch');
  const promise=this.jev.decide({phase,goal:run.config.goal,evidence,notes,signal:run.controller.signal});run.active.add(promise);
  try{const answers=await promise;this._guard(run);node.status='completed';node.finishedAt=this._stamp();return {answers,node};}catch(error){node.status='blocked';node.error=error.message;throw error;}finally{run.active.delete(promise);}
 }
 _recordDecision(run,decision,node,phase){const record={...decision,phase,round:run.snapshot.jev.round};run.snapshot.jev.decisions.push(record);this._output(run,node,JSON.stringify(record));this._event(run,'jev_decision',`${decision.action}: ${decision.reason}`,node);}
 async _executeRun(run){
  run.snapshot.jev={lane:'medium',round:0,mode:this.jev.mode==='fixture'?'fixture':'live',decisions:[]};run.jevCalls=0;
  try{
   const baseline=await this._observation(run,0,'baseline');run.project=baseline.project;
   if(run.project)run.snapshot.project={mode:run.project.mode,reason:run.project.reason,checks:run.project.checks};
   const first=await this._decide(run,'classify');const initial=classifyDecision(first.answers);run.snapshot.jev.lane=initial.lane;this._recordDecision(run,initial,first.node,'classify');if(initial.action==='blocked')return blocked(initial.reason);
   let previousAction='continue',cycle,attempts=0,retries=0,lastFailure;
   for(let round=1;round<=run.config.limits.maxRounds;round++){
    this._guard(run);run.snapshot.jev.round=round;
    if(previousAction!=='verify'){
     attempts++;run.snapshot.status='running';
     const originalRetries=run.config.limits.maxRetries;run.config.limits.maxRetries=0;
     try{cycle=await super._executeRun(run);}finally{run.config.limits.maxRetries=originalRetries;}
    }
    this._guard(run);run.snapshot.status='reviewing';
    const evidence=await this._observation(run,round);run.snapshot.jev.evidence={checksPassed:evidence.checksPassed,scopeOk:evidence.scopeOk,diffAvailable:evidence.diffAvailable,protectedOk:evidence.protectedOk,verified:evidence.verified,reason:evidence.reason};
    const response=await this._decide(run,'step',evidence,cycle?.message||'');
    const failure=evidence.checksFailed?JSON.stringify(evidence.checks?.filter(c=>!c.passed).map(c=>[c.id,c.exitCode,c.tail])):null;
    const decision=stepDecision(response.answers,evidence,{lane:run.snapshot.jev.lane,attempts,sameFailureRepeated:!!failure&&failure===lastFailure});lastFailure=failure;
    this._recordDecision(run,decision,response.node,'step');
    if(run.snapshot.nodes.some(n=>n.status==='blocked'&&n.kind==='task'))return blocked('岗位被宿主权限或执行保护阻止，需要人工检查。');
    if(run.project?.mode==='analysis-only'||run.project?.mode==='unverified-editable'||evidence.needsVerification)return {status:'unverified',message:(run.project?.mode==='analysis-only'?'只读分析结果已就绪；':'改动或分析结果已生成，待验证；')+(evidence.reason||run.project.reason)+' 未通过独立代码验收，不标记完成。'};
    if(decision.needsPerson)return blocked(decision.reason);
    if(decision.action==='complete'){
     if(cycle?.status!=='completed'||!evidence.verified||!evidence.checksPassed||!evidence.scopeOk||!evidence.diffAvailable||!evidence.protectedOk||(evidence.expectsChanges&&evidence.diffEmpty))return blocked('Jev 完成候选未通过本地硬门禁：任务、独立检查、范围与保护证据必须全部通过。');
     const seal=await this._observation(run,round,'seal');if(!seal.verified||seal.sealed!==true)return blocked('完成前证据已变化或无法重新核验。');
     return {status:'completed',message:'Jev 完成门禁通过：独立宿主检查、差异、范围与最终审查均通过。'};
    }
    if(decision.action==='escalate'){
     const next=LANES[LANES.indexOf(run.snapshot.jev.lane)+1];if(!next)return blocked('已到最高 lane，需要用户决定；不会更换模型、扩大权限或无限重试。');
     run.snapshot.jev.lane=next;attempts=0;retries=0;this._event(run,'lane_escalated',`Review lane → ${next}; user-selected models unchanged`);
    }
    if(decision.action==='retry'&&++retries>run.config.limits.maxRetries)return blocked('本 lane 重试上限已到，需要人工检查。');
    run.lastFeedback={review:cycle?.message,evidence:{checks:evidence.checkSummary,diff:evidence.diffStat,scopeOk:evidence.scopeOk},decision};previousAction=decision.action;
   }
   return blocked('最大 Jev 循环轮数已到；没有满足完成门禁，需要人工检查。');
  }finally{await this.verifier.release?.(run.snapshot.id);}
 }
}
