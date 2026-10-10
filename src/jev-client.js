/** Independent TypeSafe decision client. Adapted from pinned Hermes Jev policy data (see NOTICE). */
import {readFileSync} from 'node:fs';
import {TeamHostError} from './host-adapter.js';
export const JEV_ENDPOINT='https://api.typesafe.ai/v1/systemone';
export const JEV_DISCLOSURE='向 TypeSafe API 发送脱敏、限长的任务文本（最多 3000 字符）、diff 文件统计（1500 字符）、测试尾部摘要（2500 字符）和审查摘要（1200 字符）。不发送源码全文、完整日志、会话历史、密钥或权限设置。脱敏不能保证移除所有个人/商业信息，请勿在目标或测试输出中放入敏感数据。';
export const LANES=Object.freeze(['small','medium','high','escalate']);
const policies=Object.fromEntries(['lane','loop-step'].map(name=>[name,JSON.parse(readFileSync(new URL(`./vendor/${name}.json`,import.meta.url),'utf8'))]));
const fail=(code,message)=>{throw new TeamHostError(code,message);};
const responseMetadata=new WeakMap();
export const getJevMetadata=answers=>responseMetadata.get(answers);
export function selectJevModel(config={}){
 if(config.model===undefined)return 'jev-latest';
 if(typeof config.model!=='string'||!/^jev-[A-Za-z0-9._-]{1,60}$/.test(config.model))fail('JEV_MODEL','Jev model 必须为明确的版本 ID 或已支持的别名。');
 return config.model;
}
const unit=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1;
export function projectJevText(value,max){
 const text=String(value??'');
 if(/(?:-----BEGIN|\b(?:sk|pk|ghp|gho|github_pat)[-_][A-Za-z0-9_\-]{12,}|\b(?:api[_ -]?key|password|authorization|secret|access[_ -]?token)\s*[:=]\s*\S+)/i.test(text))fail('SENSITIVE_JEV_STATE','决策数据可能含凭据，已阻止发送 TypeSafe；请移除敏感内容后重新启动。');
 return text.slice(0,max).replace(/[\u0000-\u001f\u007f-\u009f]/g,' ').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email]').replace(/\b[a-f0-9]{24,}\b/gi,'[identifier]').replace(/\+?\d[\d ()-]{8,}\d/g,'[number]');
}
export function parseJevResponse(data,phase,{requestedModel}={}){
 const questions=policies[phase==='classify'?'lane':'loop-step'].questions;
 if(!data||typeof data!=='object'||!data.answers||typeof data.answers!=='object')fail('JEV_RESPONSE','Jev 返回无效决策结构；不会降级至普通模型。');
 const answers={};
 for(const[name,q]of Object.entries(questions)){
  const a=data.answers[name];if(!a||a.type!==q.type)fail('JEV_RESPONSE','Jev 返回无效答案类型。');
  if(q.type==='noul'){if(!unit(a.noul))fail('JEV_RESPONSE','Jev 概率无效。');answers[name]={type:'noul',noul:a.noul};}
  else {const keys=Object.keys(q.criteria),p=a.probabilities;
   if(!keys.includes(a.choice)||!unit(a.confidence)||!p||Object.keys(p).length!==keys.length||!keys.every(k=>unit(p[k]))||Math.abs(Object.values(p).reduce((s,v)=>s+v,0)-1)>.03||p[a.choice]+1e-6<Math.max(...Object.values(p)))fail('JEV_RESPONSE','Jev 选项或概率分布无效。');
   answers[name]={type:'choice',choice:a.choice,confidence:a.confidence,probabilities:Object.fromEntries(keys.map(key=>[key,p[key]]))};
  }
 }
 responseMetadata.set(answers,{requestedModel,responseModel:typeof data.model==='string'?data.model:undefined,modelPolicy:requestedModel==='jev-latest'||requestedModel==='jev-preview'?'alias':/^jev-\d+\.\d+\.\d+(?:-[a-z0-9.]+)?$/.test(requestedModel)?'pinned':'custom',usage:{inputTokens:Number.isSafeInteger(data.usage?.input_tokens)&&data.usage.input_tokens>=0?data.usage.input_tokens:null,outputTokens:Number.isSafeInteger(data.usage?.output_tokens)&&data.usage.output_tokens>=0?data.usage.output_tokens:null}});
 return answers;
}
export function classifyDecision(a){
 const lane=a.lane;
 if(a.underspecified.noul>=.7||lane.choice==='other')return {action:'blocked',lane:'medium',confidence:lane.confidence,reason:'需求或访问条件需要人工确认。'};
 let selected='medium';
 if(lane.choice==='escalate'&&lane.confidence>=.6)selected='escalate';
 else if(['high','escalate'].includes(lane.choice)||a.security_sensitive.noul>=.7||lane.choice==='medium'&&lane.confidence<.5)selected='high';
 else if(lane.choice==='small'&&lane.confidence>=.7&&a.security_sensitive.noul<.3&&a.underspecified.noul<.5)selected='small';
 return {action:'classify',lane:selected,confidence:lane.confidence,reason:'Jev 评估任务级别；六岗位已选模型保持不变。'};
}
export function stepDecision(a,e,{lane,attempts,sameFailureRepeated}){
 let action='verify',reason='证据尚不足，需要再次验证。';
 if(e.checksFailed>0){action=attempts>=2||sameFailureRepeated?'escalate':'retry';reason='独立检查失败；禁止完成。';}
 else if(!e.scopeOk){action='retry';reason='实际差异超出批准范围。';}
 else if(e.expectsChanges&&e.diffEmpty){action='continue';reason='未观察到要求的文件变更。';}
 else if(!e.checksRun){action='verify';reason='检查尚未完整执行。';}
 else if(e.securityChanged&&['small','medium'].includes(lane)){action='escalate';reason='安全相关文件需要提高审查级别。';}
 else if(['needs_stronger_model','needs_person'].includes(a.next.choice)&&a.next.confidence>=.6){action='escalate';reason=a.next.choice==='needs_person'?'需要人工决定或权限。':'Jev 要求提升一个审查级别。';}
 else if(a.implemented.noul>=.8&&a.in_scope.noul>=.8&&a.next.choice==='complete'&&a.next.confidence>=.6){action='complete';reason='Jev 完成候选，仍须通过本地硬门禁。';}
 else if(a.next.choice==='retry_differently'&&a.next.confidence>=.6||a.in_scope.noul<.3){action='retry';reason='Jev 要求换一种方法重试。';}
 else if(a.implemented.noul<.5&&a.next.choice==='continue'){action='continue';reason='实现尚未完成，继续当前模型。';}
 return {action,lane,confidence:a.next.confidence,reason,needsPerson:a.next.choice==='needs_person'&&a.next.confidence>=.6};
}
export function createJevClient(config={}, {fetchImpl=fetch,resolveCredential=name=>process.env[name]}={}){
 // Only an environment-variable NAME is accepted in trusted server configuration.
 const ref=typeof config.credentialEnv==='string'&&/^[A-Z][A-Z0-9_]{1,79}$/.test(config.credentialEnv)?config.credentialEnv:null;
 const model=selectJevModel(config);
 const configured=()=>!!ref&&typeof resolveCredential(ref)==='string'&&!!resolveCredential(ref).trim();
 return {mode:'live',requestedModel:model,status:()=>({configured:configured(),available:configured(),endpoint:JEV_ENDPOINT,requestedModel:model,disclosure:JEV_DISCLOSURE,reason:configured()?undefined:'服务端尚未配置 Jev 凭据引用，真实运行已阻止；不会自动进入演示。'}),
 preflight(){if(!configured())fail('JEV_NOT_CONFIGURED','请先由用户在服务端配置 Jev 凭据引用；不要把密钥贴到聊天或浏览器。');},
 async decide({phase,goal,evidence,notes,signal}){
  this.preflight();if(signal.aborted)fail('CANCELLED','运行已取消。');
  const policy=policies[phase==='classify'?'lane':'loop-step'];
  const state=phase==='classify'?{task:projectJevText(goal,3000),context:'The user owns six base role choices and optional explicit lane candidates. Classify review intensity only; the host maps lanes to those configured candidates. Never invent model/provider IDs or grant permission.'}:{task:projectJevText(goal,2000),diff_stat:projectJevText(evidence?.diffStat,1500),checks:projectJevText(evidence?.checkSummary,2500),notes:projectJevText(notes,1200)};
  let response;try{response=await fetchImpl(JEV_ENDPOINT,{method:'POST',redirect:'error',headers:{Authorization:`Bearer ${resolveCredential(ref).trim()}`,'Content-Type':'application/json'},body:JSON.stringify({model,state,questions:policy.questions}),signal:AbortSignal.any([signal,AbortSignal.timeout(10000)])});}catch{fail('JEV_UNAVAILABLE','Jev 请求失败、超时或取消；运行已阻止，不会自动切换模型。');}
  if(!response.ok)fail('JEV_UNAVAILABLE',`Jev 请求失败（HTTP ${response.status}）；未自动重试。`);
  let raw='';try{const reader=response.body.getReader();for(;;){const chunk=await reader.read();if(chunk.done)break;raw+=new TextDecoder().decode(chunk.value);if(raw.length>32768){await reader.cancel();fail('JEV_RESPONSE','Jev 响应超过大小限制。');}}return parseJevResponse(JSON.parse(raw),phase,{requestedModel:model});}catch(error){if(error instanceof TeamHostError)throw error;fail('JEV_RESPONSE','Jev 返回无效响应。');}
 }};
}
