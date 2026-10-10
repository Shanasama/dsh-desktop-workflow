/** Automatic project verification. All subprocesses execute INSIDE a native host tool. */
import {randomUUID} from 'node:crypto';
import {TeamHostError} from './host-adapter.js';
import {verifierCommand} from './verifier-command.js';
import {verificationDiagnostic,verificationFailureText,notStartedCodes} from './verification-diagnostics.js';
export function createAutoVerifier({executeTool,poison,shellName=()=>undefined,onPolicy=()=>{},onDiagnostic=()=>{}}){
 const states=new Map();
 return {profiles:[],automatic:true,
 preflight(config){if(config.verification?.profileId!=='auto')throw new TeamHostError('AUTO_PROJECT_REQUIRED','请使用 /team 自动探测当前项目。');},
 async collect({config,runId,round,signal,phase='check'}){
  const fail=(code,reason,result,error,unsettled=false)=>{const diagnostic={...verificationDiagnostic(phase,result,error,reason),runId};onDiagnostic(config.sessionId,diagnostic);if(unsettled)poison(config.sessionId,diagnostic);const failure=new TeamHostError(code,verificationFailureText(diagnostic));failure.diagnostic=diagnostic;throw failure;};
  const state=states.get(runId);if(phase!=='baseline'&&!state)fail('BASELINE_REQUIRED','缺少项目启动快照');
  if(phase==='check'&&state.project.mode==='analysis-only'&&!state.baselineRef)return {verified:false,analysisOnly:true,checksPassed:false,checksFailed:0,checksRun:false,diffAvailable:false,scopeOk:false,protectedOk:false,reason:state.project.reason,diffStat:'Unavailable',checkSummary:'No independent checks'};
  const nonce=randomUUID(),payload={runId,round,nonce,phase,baselineRef:state?.baselineRef,expectedFingerprint:state?.round===round?state.fingerprint:undefined};
  let result;
  try{result=await executeTool(config.sessionId,{name:'bash',arguments:{description:'Verify project evidence within the current workspace',command:verifierCommand('project',payload,shellName(config.sessionId)),timeoutMs:90000,run_in_background:false}},signal,{allowUserApproval:true});}
  catch(error){fail('VERIFICATION_TOOL_FAILURE','宿主工具抛出异常',undefined,error,!['CANCELLED','CONTEXT_CHANGED','VERIFIER_UNAVAILABLE','VERIFIER_SCOPE_UNSAFE'].includes(error?.code));}
  if(result?.verificationNotDispatched)fail('VERIFICATION_DENIED','宿主未派发检查工具',result);
  const v=result?.value;
  if(result?.isError){const code=result?.error?.code||result?.error?.info?.code;if(notStartedCodes.has(code))fail('VERIFICATION_DENIED',`宿主未执行检查工具（${code}）；没有启动任何检查进程，因此不存在待确认的清理。`,result);fail('VERIFICATION_UNSETTLED','宿主工具返回错误，执行终态未确认',result,undefined,true);}
  if(!v||v.kind!=='foreground'||v.timedOut||v.aborted||v.signal||v.stopped||!Number.isInteger(v.exitCode)||!v.stdout||!v.stderr)fail('VERIFICATION_UNSETTLED','前台结束或完整输出未确认',result,undefined,true);
  if(v.stdout.truncated||v.stderr.truncated||v.sandbox?.denied||v.sandbox?.runnerFailed)fail('VERIFICATION_BLOCKED','宿主限制或输出截断',result);
  let data;try{data=JSON.parse(v.stdout.text);}catch{fail('VERIFICATION_INVALID','检查输出不是完整 JSON',result);}
  if(data.unsettled||data.checks?.some(c=>c.unsettled))fail('VERIFICATION_UNSETTLED','检查进程超时或收到信号',result,undefined,true);
  if(data.runId!==runId||data.round!==round||data.nonce!==nonce||v.exitCode!==0||!data.verified)fail('VERIFICATION_INVALID','项目证据校验未通过',result);
  if(phase==='baseline'){states.set(runId,{project:data.project,baselineRef:data.baselineRef,config});onPolicy(runId,data.project);return {verified:true,reason:data.project.reason,project:data.project,analysisOnly:data.project.mode==='analysis-only',observation:data.observation};}
  if(phase==='check'){state.round=round;state.fingerprint=data.fingerprint;}
  return data;
 },
 async release(runId){
  const state=states.get(runId);let settled=true;
  if(state?.baselineRef){try{await this.collect({config:state.config,runId,round:state.round||0,phase:'cleanup',signal:new AbortController().signal});}catch(error){settled=false;poison(state.config.sessionId,error.diagnostic||verificationDiagnostic('cleanup',undefined,error,'证据清理未确认'));}}
  if(settled)states.delete(runId);onPolicy(runId,null);return {settled};
 }};
}
