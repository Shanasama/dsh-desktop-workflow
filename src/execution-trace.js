/** Opt-in, bounded metadata trace. Never stores prompts, source, paths, IDs or raw errors. */
import {classifyDecision, stepDecision} from './jev-client.js';
export const TRACE_SCHEMA = 'dsh-evaluation-trace/v1';
export const DECISION_POLICY = 'hermes-b22a21f+dsh-gates-v1';
const roles = ['planner','coordinator','researcher','explorer','worker','reviewer','router'];
const lanes = ['small','medium','high','escalate'];
const actions = ['blocked','classify','verify','retry','escalate','continue','complete'];
const statuses = ['started','completed','failed','blocked','cancelled','unverified','error','skipped'];
const number = (value, max = Number.MAX_SAFE_INTEGER) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max ? value : null;
const integer = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
const unit = value => number(value, 1);
const one = (value, options) => options.includes(value) ? value : null;
const flag = value => typeof value === 'boolean' ? value : null;
export const traceModel = value => typeof value === 'string' && value.length <= 64 && /^(jev-(?:latest|preview)|jev-\d+\.\d+\.\d+(?:-[a-z0-9.]{1,24})?)$/.test(value) ? value : null;
export function traceUsage(value) {
 return {inputTokens:integer(value?.input_tokens), outputTokens:integer(value?.output_tokens)};
}
function answer(value, keys) {
 return {type:'choice',choice:one(value?.choice,keys),confidence:unit(value?.confidence),probabilities:Object.fromEntries(keys.map(key => [key,unit(value?.probabilities?.[key])]))};
}
export function traceAnswers(value, phase) {
 return phase === 'classify' ? {
  lane:answer(value?.lane,[...lanes,'other']),security_sensitive:{type:'noul',noul:unit(value?.security_sensitive?.noul)},underspecified:{type:'noul',noul:unit(value?.underspecified?.noul)},
 } : {
  next:answer(value?.next,['complete','continue','retry_differently','needs_stronger_model','needs_person','other']),implemented:{type:'noul',noul:unit(value?.implemented?.noul)},in_scope:{type:'noul',noul:unit(value?.in_scope?.noul)},
 };
}
export function traceEvidence(value) {
 return Object.fromEntries(['checksPassed','checksRun','scopeOk','diffAvailable','protectedOk','verified','expectsChanges','diffEmpty','securityChanged','needsVerification','sealed'].map(key => [key,flag(value?.[key])]).concat([['checksFailed',integer(value?.checksFailed)]]));
}
const decision = value => ({action:one(value?.action,actions),lane:one(value?.lane,lanes),confidence:unit(value?.confidence),needsPerson:flag(value?.needsPerson)});
const context = value => ({lane:one(value?.lane,lanes),attempts:integer(value?.attempts),sameFailureRepeated:flag(value?.sameFailureRepeated)});
const metadata = value => ({requestedModel:traceModel(value?.requestedModel),responseModel:traceModel(value?.responseModel),modelPolicy:one(value?.modelPolicy,['alias','pinned','custom']),usage:{inputTokens:integer(value?.usage?.inputTokens),outputTokens:integer(value?.usage?.outputTokens)}});
const branchCodes = ['initial_blocked','task_blocked','unverified','needs_person','completion_gate_rejected','seal_rejected','completed','lane_exhausted','lane_escalated','retry_exhausted','rounds_exhausted'];
function project(type, data) {
 switch(type) {
  case 'plan': return {node:integer(data.node),kind:one(data.kind,['plan','coordination']),tasks:(data.tasks||[]).slice(0,12).map(task=>({task:integer(task.task),role:one(task.role,roles),dependsOn:(task.dependsOn||[]).slice(0,12).map(integer)}))};
  case 'model_call': return {node:integer(data.node),role:one(data.role,roles),modelRef:integer(data.modelRef),maxTokens:integer(data.maxTokens),status:one(data.status,statuses)};
  case 'verification': return {phase:one(data.phase,['baseline','check','seal']),round:integer(data.round),evidence:traceEvidence(data.evidence),checks:(data.checks||[]).slice(0,32).map(check=>({check:integer(check.check),passed:flag(check.passed),exitCode:Number.isSafeInteger(check.exitCode)?check.exitCode:null}))};
  case 'jev': return {phase:one(data.phase,['classify','step']),round:integer(data.round),source:one(data.source,['primary','shadow']),reasonCode:one(data.reasonCode,['call_limit','concurrency_limit','unavailable','cancelled','timeout']),status:one(data.status,statuses),mode:one(data.mode,['live','fixture']),metadata:metadata(data.metadata),answers:data.answers?traceAnswers(data.answers,data.phase):null,evidence:data.evidence?traceEvidence(data.evidence):null,context:data.context?context(data.context):null,decision:data.decision?decision(data.decision):null};
  case 'branch': return {code:one(data.code,branchCodes),round:integer(data.round),lane:one(data.lane,lanes)};
  case 'terminal': return {status:one(data.status,['completed','failed','blocked','cancelled','unverified'])};
  default: throw new TypeError('Unsupported evaluation trace event');
 }
}
export function createExecutionTrace({maxEvents=512}={}) {
 if(!Number.isInteger(maxEvents)||maxEvents<1||maxEvents>2048)throw new TypeError('Trace event bound must be 1–2048');
 const events=[], models=new Map();let truncated=false;
 return {
  // Names are only map keys in this run's memory, never present in the exported record.
  modelRef(model){const key=JSON.stringify([model.provider,model.model]);if(!models.has(key))models.set(key,models.size+1);return models.get(key);},
  record(type,data){if(events.length>=maxEvents){truncated=true;return;}events.push({seq:events.length+1,type,data:project(type,data)});},
  snapshot(){return structuredClone({schema:TRACE_SCHEMA,policy:DECISION_POLICY,privacy:'metadata-only',truncated,events});},
 };
}
/** Replays code decisions only. No model calls, file changes, source or test execution. */
export function replayExecutionTrace(trace) {
 if(trace?.schema!==TRACE_SCHEMA||trace.policy!==DECISION_POLICY||trace.privacy!=='metadata-only'||trace.truncated!==false||!Array.isArray(trace.events)||trace.events.length>2048)throw new TypeError('Unsupported or incomplete evaluation trace');
 if(Object.keys(trace).sort().join()!==['schema','policy','privacy','truncated','events'].sort().join())throw new TypeError('Unexpected trace fields');
 const results=[],pending=new Set();let terminal=null;
 for(const [index,event] of trace.events.entries()) {
  if(event.seq!==index+1||Object.keys(event).sort().join()!=='data,seq,type'||JSON.stringify(project(event.type,event.data))!==JSON.stringify(event.data))throw new TypeError('Invalid or non-redacted trace event');
  const data=event.data;
  if(event.type==='terminal'){if(terminal||!data.status)throw new TypeError('Invalid terminal trace event');terminal=data.status;}
  if(event.type==='jev'){const key=JSON.stringify([data.source,data.phase,data.round]);if(data.status==='started')pending.add(key);else pending.delete(key);}
  if(event.type!=='jev'||data.status!=='completed')continue;
  const choice=data.phase==='classify'?data.answers?.lane:data.answers?.next;
  const nouls=data.phase==='classify'?[data.answers?.security_sensitive?.noul,data.answers?.underspecified?.noul]:[data.answers?.implemented?.noul,data.answers?.in_scope?.noul];
  if(!choice?.choice||choice.confidence===null||nouls.some(v=>typeof v!=='number')||data.phase==='step'&&(!data.evidence||!data.context?.lane||data.context.attempts===null))throw new TypeError('Missing decision replay inputs');
  const actual=data.phase==='classify'?classifyDecision(data.answers):stepDecision(data.answers,data.evidence,data.context);
  results.push({seq:event.seq,source:data.source,phase:data.phase,decision:decision(actual),matches:JSON.stringify(decision(actual))===JSON.stringify(data.decision)});
 }
 if(!terminal||pending.size)throw new TypeError('Evaluation trace is still in progress');
 return {policy:trace.policy,scope:'code-decisions-only',terminal,decisions:results,matches:results.length?results.every(item=>item.matches):null};
}
