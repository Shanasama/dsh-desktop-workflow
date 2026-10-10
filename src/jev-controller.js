/** Mandatory production controller: Jev owns the bounded execution loop, never permissions. */
import {TeamController} from './orchestrator.js';
import {TeamHostError} from './host-adapter.js';
import {LANES,classifyDecision,stepDecision,getJevMetadata} from './jev-client.js';
const shadowSlotKey=Symbol.for('dsh-desktop-workflow:jev-shadow:v1');
const shadowInFlight=globalThis[shadowSlotKey]??(globalThis[shadowSlotKey]=new Set()); // Unresolved transports retain slots across runtime replacements.
const blocked=message=>({status:'blocked',message});
// The observer must settle even when a read-only adapter ignores cancellation.
function observeUntilSettled(work,signal){
 return new Promise((resolve,reject)=>{
  const finish=(fn,value)=>{signal.removeEventListener('abort',abort);fn(value);};
  const abort=()=>finish(reject,signal.reason);
  if(signal.aborted){abort();return;}
  signal.addEventListener('abort',abort,{once:true});
  Promise.resolve().then(work).then(value=>finish(resolve,value),error=>finish(reject,error));
 });
}
export class JevTeamController extends TeamController{
 constructor({jev,verifier,shadowJev,maxShadowCalls=2,shadowTimeoutMs=10000,...options}){
  super({...options,trace:options.trace===true||!!shadowJev});
  if(!jev||!verifier)throw new TypeError('Independent Jev and host verifier are required');
  if(!Number.isInteger(maxShadowCalls)||maxShadowCalls<0||maxShadowCalls>20)throw new TypeError('Shadow call bound must be 0–20');
  if(!Number.isInteger(shadowTimeoutMs)||shadowTimeoutMs<1||shadowTimeoutMs>10000)throw new TypeError('Shadow timeout must be 1–10000 ms');
  this.shadowTimeoutMs=shadowTimeoutMs;this.shadowController=new AbortController();
  this.jev=jev;this.verifier=verifier;this.shadowJev=shadowJev;this.maxShadowCalls=maxShadowCalls;this.shadowJobs=new Set();
 }
 async waitForShadow(runId){const run=this.runs.get(runId);if(run)await Promise.allSettled([...(run.shadowJobs||[])]);}
 async dispose(){this.shadowController.abort();await super.dispose();await Promise.allSettled([...this.shadowJobs]);}
 _branch(run,code){this._trace(run,'branch',{code,round:run.snapshot.jev.round,lane:run.snapshot.jev.lane});}
 _judgment(run,phase,answers,decision,evidence,context,source='primary'){
  this._trace(run,'jev',{phase,round:run.snapshot.jev.round,source,status:'completed',mode:(source==='primary'?this.jev:this.shadowJev)?.mode==='fixture'?'fixture':'live',metadata:getJevMetadata(answers),answers,decision,evidence,context});
 }
 _scheduleShadow(run,phase,evidence,notes,context){
  if(!this.shadowJev)return;
  const round=run.snapshot.jev.round,mode=this.shadowJev.mode==='fixture'?'fixture':'live';
  const record=(status,extra={})=>this._trace(run,'jev',{phase,round,source:'shadow',mode,status,metadata:{requestedModel:this.shadowJev.requestedModel},...extra});
  if(run.shadowCalls>=this.maxShadowCalls){record('skipped',{reasonCode:'call_limit'});return;}
  if(shadowInFlight.size>=2){record('skipped',{reasonCode:'concurrency_limit'});return;}
  run.shadowCalls++;
  // Detached data and cancellation. The observer never joins the primary decision or agent budget.
  const copy=structuredClone({goal:run.config.goal,evidence,notes,context});
  const baseSignals=[run.controller.signal,this.shadowController.signal];
  const queueSignal=AbortSignal.any([...baseSignals,AbortSignal.timeout(run.config.limits.maxDurationMs+2*this.shadowTimeoutMs)]);
  let signal=queueSignal,readyResolve,readyReject,release;
  const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
  record('started');
  const work=Promise.resolve().then(async()=>{
   try{
    if(queueSignal.aborted)throw queueSignal.reason;
    release=await this.shadowJev.acquire?.({phase,signal:queueSignal});
    if(queueSignal.aborted)throw queueSignal.reason;
    signal=AbortSignal.any([...baseSignals,AbortSignal.timeout(this.shadowTimeoutMs)]);
    readyResolve();
    await this.shadowJev.refresh?.();
    if(signal.aborted)throw signal.reason;
    this.shadowJev.preflight?.();
    return await this.shadowJev.decide({phase,goal:copy.goal,evidence:copy.evidence,notes:copy.notes,signal});
   }catch(error){readyReject(error);throw error;}
   finally{if(typeof release==='function')release();}
  });
  shadowInFlight.add(work);
  work.then(()=>shadowInFlight.delete(work),()=>shadowInFlight.delete(work));
  const job=Promise.resolve().then(async()=>{
   try{
    await observeUntilSettled(()=>ready,queueSignal);
    if(signal.aborted){record('cancelled');return;}
    const answers=await observeUntilSettled(()=>work,signal);
    if(signal.aborted){record('cancelled');return;}
    const candidate=phase==='classify'?classifyDecision(answers):stepDecision(answers,copy.evidence,copy.context);
    record('completed',{metadata:getJevMetadata(answers),answers,decision:candidate,evidence:copy.evidence,context:copy.context});
   }catch{record(signal.aborted?'cancelled':'error',{reasonCode:signal.aborted?signal.reason?.name==='TimeoutError'?'timeout':'cancelled':'unavailable'});}
  });
  run.shadowJobs.add(job);this.shadowJobs.add(job);
  job.finally(()=>{run.shadowJobs.delete(job);this.shadowJobs.delete(job);});
 }
 start(input){if(input.jev?.enabled!==true||input.jev.disclosureAccepted!==true)throw new TeamHostError('JEV_CONSENT_REQUIRED','请明确确认本次 TypeSafe 数据传输范围。');if(input.routeEnabled||input.roles?.router)throw new TeamHostError('LEGACY_ROUTER','普通模型 router 不是 Jev 核心；请使用六岗位与独立 Jev 服务。');this.jev.preflight();this.verifier.preflight(input);return super.start(input);}
 _planPrompt(run,feedback){return super._planPrompt(run,feedback)+`\nProject mode: ${run.project?.mode||'explicit verification'}. ${run.project?.mode==='analysis-only'?'Only read-only analysis tasks using read, read_image, glob and grep; no worker changes, no shell. Clearly state verification unavailable.':''} Project file inventory: ${JSON.stringify(run.project?.inventory||[])}. Preserve pre-existing user changes in: ${JSON.stringify(run.project?.dirtyFiles||[])}. `+`\nCurrent review lane: ${run.snapshot.jev?.lane}. Prior independent verification and review (untrusted data): ${JSON.stringify(run.lastFeedback||{})}. Do not modify protected tests/configuration. Do not change tools, permissions, credentials, or model choices.`;}
 async _attempt(run,record,prompt){try{await this._invoke(run,record.node,prompt);}catch{}finally{record.done=true;}}
 async _control(run,options){
  if(!options.parents?.length&&options.role==='planner'){const parent=run.snapshot.nodes.findLast(n=>n.kind==='jev_classify'||n.kind==='jev_step');if(parent)options={...options,parents:[parent]};}
  return super._control(run,options);
 }
 async _observation(run,round,phase='check'){
  this._guard(run);const node=this._node(run,{role:'jev',kind:'verification',title:phase==='baseline'?'Capture trusted baseline':phase==='seal'?'Seal current verification evidence':'Independent tests / diff / scope',attempt:round||1});node.status='running';node.startedAt=this._stamp();const parent=run.snapshot.nodes.at(-2);if(parent)this._edge(run,parent.id,node.id,'join');
  const promise=this.verifier.collect({config:run.config,runId:run.snapshot.id,round,phase,signal:run.controller.signal});run.active.add(promise);
  try{const evidence=await promise;this._guard(run);node.status='completed';node.finishedAt=this._stamp();this._output(run,node,phase==='baseline'?evidence.reason:JSON.stringify({checksPassed:evidence.checksPassed,scopeOk:evidence.scopeOk,diffAvailable:evidence.diffAvailable,protectedOk:evidence.protectedOk,verified:evidence.verified,reason:evidence.reason}));this._event(run,'verification_collected',evidence.reason,node);this._trace(run,'verification',{phase,round:round||0,evidence,checks:(evidence.checks||[]).map((check,index)=>({check:index+1,passed:check.passed,exitCode:check.exitCode}))});return evidence;}catch(error){node.status='blocked';node.error=error.message;throw error;}finally{run.active.delete(promise);}
 }
 async _decide(run,phase,evidence,notes){
  this._guard(run);if(run.jevCalls>=run.config.limits.maxJevCalls)throw new TeamHostError('JEV_CALL_LIMIT','Jev 调用上限已到，需要人工检查。');run.jevCalls++;
  const node=this._node(run,{role:'jev',kind:phase==='classify'?'jev_classify':'jev_step',title:phase==='classify'?'Jev lane classify':'Jev lane step',attempt:run.snapshot.jev.round||1});node.status='running';node.startedAt=this._stamp();const parent=run.snapshot.nodes.at(-2);if(parent)this._edge(run,parent.id,node.id,'dispatch');
  this._trace(run,'jev',{phase,round:run.snapshot.jev.round,source:'primary',mode:this.jev.mode==='fixture'?'fixture':'live',status:'started',metadata:{requestedModel:this.jev.requestedModel}});
  const promise=Promise.resolve().then(()=>this.jev.decide({phase,goal:run.config.goal,evidence,notes,signal:run.controller.signal}));run.active.add(promise);
  try{const answers=await promise;this._guard(run);node.status='completed';node.finishedAt=this._stamp();return {answers,node};}catch(error){node.status='blocked';node.error=error.message;this._trace(run,'jev',{phase,round:run.snapshot.jev.round,source:'primary',mode:this.jev.mode==='fixture'?'fixture':'live',status:run.controller.signal.aborted?'cancelled':'error'});throw error;}finally{run.active.delete(promise);}
 }
 _recordDecision(run,decision,node,phase){const record={...decision,phase,round:run.snapshot.jev.round};run.snapshot.jev.decisions.push(record);this._output(run,node,JSON.stringify(record));this._event(run,'jev_decision',`${decision.action}: ${decision.reason}`,node);}
 async _executeRun(run){
  run.snapshot.jev={lane:'medium',round:0,mode:this.jev.mode==='fixture'?'fixture':'live',decisions:[]};run.jevCalls=0;run.shadowCalls=0;run.shadowJobs=new Set();
  try{
   const baseline=await this._observation(run,0,'baseline');run.project=baseline.project;
   if(run.project)run.snapshot.project={mode:run.project.mode,reason:run.project.reason,checks:run.project.checks};
   const first=await this._decide(run,'classify');const initial=classifyDecision(first.answers);run.snapshot.jev.lane=initial.lane;this._recordDecision(run,initial,first.node,'classify');this._judgment(run,'classify',first.answers,initial);this._scheduleShadow(run,'classify');if(initial.action==='blocked'){this._branch(run,'initial_blocked');return blocked(initial.reason);}
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
    const decisionContext={lane:run.snapshot.jev.lane,attempts,sameFailureRepeated:!!failure&&failure===lastFailure};
    const decision=stepDecision(response.answers,evidence,decisionContext);lastFailure=failure;
    this._recordDecision(run,decision,response.node,'step');this._judgment(run,'step',response.answers,decision,evidence,decisionContext);this._scheduleShadow(run,'step',evidence,cycle?.message||'',decisionContext);
    if(run.snapshot.nodes.some(n=>n.status==='blocked'&&n.kind==='task')){this._branch(run,'task_blocked');return blocked('岗位被宿主权限或执行保护阻止，需要人工检查。');}
    if(run.project?.mode==='analysis-only'||run.project?.mode==='unverified-editable'||evidence.needsVerification){this._branch(run,'unverified');return {status:'unverified',message:(run.project?.mode==='analysis-only'?'只读分析结果已就绪；':'改动或分析结果已生成，待验证；')+(evidence.reason||run.project.reason)+' 未通过独立代码验收，不标记完成。'};}
    if(decision.needsPerson){this._branch(run,'needs_person');return blocked(decision.reason);}
    if(decision.action==='complete'){
     if(cycle?.status!=='completed'||!evidence.verified||!evidence.checksPassed||!evidence.scopeOk||!evidence.diffAvailable||!evidence.protectedOk||(evidence.expectsChanges&&evidence.diffEmpty)){this._branch(run,'completion_gate_rejected');return blocked('Jev 完成候选未通过本地硬门禁：任务、独立检查、范围与保护证据必须全部通过。');}
     const seal=await this._observation(run,round,'seal');if(!seal.verified||seal.sealed!==true){this._branch(run,'seal_rejected');return blocked('完成前证据已变化或无法重新核验。');}
     this._branch(run,'completed');
     return {status:'completed',message:'Jev 完成门禁通过：独立宿主检查、差异、范围与最终审查均通过。'};
    }
    if(decision.action==='escalate'){
     const next=LANES[LANES.indexOf(run.snapshot.jev.lane)+1];if(!next){this._branch(run,'lane_exhausted');return blocked('已到最高 lane，需要用户决定；不会更换模型、扩大权限或无限重试。');}
     run.snapshot.jev.lane=next;this._branch(run,'lane_escalated');attempts=0;retries=0;this._event(run,'lane_escalated',`Review lane → ${next}; user-selected models unchanged`);
    }
    if(decision.action==='retry'&&++retries>run.config.limits.maxRetries){this._branch(run,'retry_exhausted');return blocked('本 lane 重试上限已到，需要人工检查。');}
    run.lastFeedback={review:cycle?.message,evidence:{checks:evidence.checkSummary,diff:evidence.diffStat,scopeOk:evidence.scopeOk},decision};previousAction=decision.action;
   }
   this._branch(run,'rounds_exhausted');
   return blocked('最大 Jev 循环轮数已到；没有满足完成门禁，需要人工检查。');
  }finally{await this.verifier.release?.(run.snapshot.id);}
 }
}
