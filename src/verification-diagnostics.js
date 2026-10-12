/** Closed diagnostic vocabulary. Never retain stdout, stderr, commands or exception text. */
const codes=new Set(['INVALID_ARGS','UNKNOWN_TOOL','ABORTED','ABORTED_BEFORE_DISPATCH','EPERM','EACCES','ENOENT','ETIMEDOUT','VERIFIER_UNAVAILABLE','VERIFIER_SCOPE_UNSAFE','CONTEXT_CHANGED','CANCELLED']);
/** Host failure codes that prove the tool body never ran: no process started, so no cleanup can be pending. */
export const notStartedCodes=new Set(['UNKNOWN_TOOL','INVALID_ARGS','ABORTED_BEFORE_DISPATCH']);
export function verificationDiagnostic(phase,result,error,reason){
 const v=result?.value,code=error?.code||result?.error?.code||result?.error?.info?.code;
 return {phase,reason,at:new Date().toISOString(),code:codes.has(code)?code:'UNCLASSIFIED',kind:['foreground','background','promoted'].includes(v?.kind)?v.kind:'unknown',exitCode:Number.isInteger(v?.exitCode)?v.exitCode:undefined,timedOut:v?.timedOut===true,aborted:v?.aborted===true,signalled:!!v?.signal,hasStdout:!!v?.stdout,hasStderr:!!v?.stderr,notDispatched:result?.verificationNotDispatched===true};
}
export const verificationFailureText=d=>`项目检查受阻：${d.phase} / ${d.reason}（${d.code}，${d.kind}${d.exitCode===undefined?'':', exit '+d.exitCode}）。`;
