/** Executes only through the native host tools runtime. No server child_process calls. */
import {randomUUID} from 'node:crypto';
import {TeamHostError} from './host-adapter.js';
import {verifierCommand} from './verifier-command.js';
import {notStartedCodes} from './verification-diagnostics.js';
export const safeRelative=value=>typeof value==='string'&&value.length<=240&&value.split('/').every(p=>!!p&&p!=='.'&&p!=='..'&&/^[A-Za-z0-9_.-]+$/.test(p))&&!value.startsWith('/');
const fail=(code,message)=>{throw new TeamHostError(code,message);};
export function verificationProfiles(input=[]){
 if(!Array.isArray(input)||input.length>12)fail('VERIFICATION_CONFIG','验证配置无效。');
 return input.map(p=>{
  if(!p||typeof p.id!=='string'||! /^[A-Za-z0-9_-]{1,64}$/.test(p.id)||!Array.isArray(p.checks)||!p.checks.length||p.checks.length>4||!Array.isArray(p.protectedPaths)||!p.protectedPaths.length||p.protectedPaths.length>32||!p.protectedPaths.every(safeRelative))fail('VERIFICATION_CONFIG','验证配置须声明检查与受保护的测试/配置路径。');
  const checks=p.checks.map(c=>{if(!c||typeof c.id!=='string'||! /^[A-Za-z0-9_-]{1,64}$/.test(c.id)||!Array.isArray(c.argv)||!c.argv.length||c.argv.length>24||!c.argv.every(x=>typeof x==='string'&&x.length<=500&&!/[\x00-\x1f]/.test(x))||!Number.isInteger(c.timeoutMs)||c.timeoutMs<1000||c.timeoutMs>60000)fail('VERIFICATION_CONFIG','验证命令参数或超时无效。');return {id:c.id,argv:[...c.argv],timeoutMs:c.timeoutMs};});
  return {id:p.id,name:typeof p.name==='string'?p.name.slice(0,120):p.id,checks,protectedPaths:[...p.protectedPaths],expectsChanges:p.expectsChanges!==false};
 });
}
// The fixed package entry runs inside the parent's native host sandbox.
// Neither models nor RPC payloads can choose the entry or supply executable code.
export function createVerifier({profiles=[],executeTool,poison,shellName=()=>undefined}){
 const configured=verificationProfiles(profiles),baselines=new Map(),observations=new Map();
 return {profiles:structuredClone(configured),
 preflight(config){const p=configured.find(x=>x.id===config.verification?.profileId);if(!p)fail('VERIFICATION_REQUIRED','未配置可信宿主验证方案，不能开始或宣称完成。');if(!config.verification.scope.length)fail('SCOPE_REQUIRED','必须指定允许变更的相对路径。');return p;},
 async collect({config,runId,round,signal,phase='check'}){
  const profile=this.preflight(config),nonce=randomUUID(),payload={profile,runId,round,nonce,phase,scope:config.verification.scope,baseline:baselines.get(runId),expectedFingerprint:observations.get(runId)?.round===round?observations.get(runId).fingerprint:undefined};
  if(phase==='seal'&&!payload.expectedFingerprint)fail('EVIDENCE_REQUIRED','缺少本轮检查证据。');
  if(phase!=='baseline'&&!payload.baseline)fail('BASELINE_REQUIRED','缺少运行前基线。');
  const command=verifierCommand('profile',payload,shellName(config.sessionId));
  let result;try{result=await executeTool(config.sessionId,{name:'bash',arguments:{command,description:'Verify trusted project checks and protected files',timeoutMs:Math.min(300000,20000+profile.checks.reduce((s,c)=>s+c.timeoutMs,0)),run_in_background:false}},signal);}catch(error){if(!['CANCELLED','CONTEXT_CHANGED','VERIFIER_UNAVAILABLE','VERIFIER_SCOPE_UNSAFE'].includes(error?.code))poison(config.sessionId);throw error;}
  const v=result?.value;
  if(v?.kind==='promoted'||v?.kind==='background'||v?.timedOut||v?.aborted||v?.signal||v?.stopped){poison(config.sessionId);fail('VERIFICATION_UNSETTLED','验证工具未确认前台结束，已隔离此运行；请检查宿主任务后重启。');}
  if(result?.isError||!v){const code=result?.error?.code||result?.error?.info?.code;if(notStartedCodes.has(code))fail('VERIFICATION_DENIED',`宿主未执行检查工具（${code}）；没有启动任何检查进程，因此不存在待确认的清理。`);poison(config.sessionId);fail('VERIFICATION_UNSETTLED','工具异常，无法证明检查未开始或已停止；已锁定后续运行。');}
  if(v.kind!=='foreground'||!Number.isInteger(v.exitCode)||!v.stdout||!v.stderr){poison(config.sessionId);fail('VERIFICATION_UNSETTLED','无法确认原生工具终态；后续运行已锁定。');}
  if(v.sandbox?.denied||v.sandbox?.runnerFailed||v.stdout?.truncated||v.stderr?.truncated)fail('VERIFICATION_BLOCKED','宿主验证被拒绝或证据不完整；不会扩大权限。');
  let data;try{data=JSON.parse(v.stdout.text);}catch{fail('VERIFICATION_INVALID','宿主验证没有返回完整结构化证据。');}
  if(data.unsettled||data.checks?.some(c=>c.unsettled)){poison(config.sessionId);fail('VERIFICATION_UNSETTLED','检查清理未确认；已锁定后续运行。');}
  if(data.runId!==runId||data.round!==round||data.nonce!==nonce||v.exitCode!==0||(phase==='baseline'?!data.clean:!data.verified))fail('VERIFICATION_INVALID','宿主验证未通过，不能接受模型自报检查结果。');
  if(data.checks?.some(c=>c.unsettled)){poison(config.sessionId);fail('VERIFICATION_UNSETTLED','检查进程超时或收到信号，清理未确认；已锁定后续运行。');}
  if(phase==='baseline'){baselines.set(runId,data);return {verified:true,reason:'Clean baseline captured'};}
  if(phase==='check')observations.set(runId,{round,fingerprint:data.fingerprint});
  return data;
 },release:runId=>{baselines.delete(runId);observations.delete(runId);}};
}
