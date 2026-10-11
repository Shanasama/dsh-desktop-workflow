/** Current restricted-token child Job; no token, ACL, or sandbox policy changes. */
import {EventEmitter} from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

function error(code,message){return Object.assign(new Error(message),{code});}

/** Resolve fixed verifier executables through their supplied environment, never a shell. */
export function resolveVerificationExecutable(command,cwd,env,{pathApi=path,stat=fs.statSync}={}){
 const isFile=file=>{try{return stat(file).isFile();}catch{return false;}};
 if(pathApi.isAbsolute(command)||/[\\/]/.test(command)){
  const file=pathApi.resolve(cwd,command);if(isFile(file))return file;
  if(!pathApi.extname(file)&&isFile(file+'.exe'))return file+'.exe';
 }else{
  const key=Object.keys(env).find(k=>k.toLowerCase()==='path');
  for(const entry of (env[key]||'').split(';')){
   // Empty PATH entries must not silently search writable cwd.
   if(!entry)continue;const directory=entry.replace(/^"(.*)"$/,'$1');
   if(!pathApi.isAbsolute(directory))continue;
   const file=pathApi.resolve(cwd,directory,command);
   const candidates=pathApi.extname(command)?[file]:[file+'.exe',file];
   for(const candidate of candidates)if(isFile(candidate))return candidate;
  }
 }
 throw error('ENOENT','Verification executable was not found in the supplied PATH.');
}

/**
 * ChildProcess-shaped lifecycle backed by the official kill-on-close Job API.
 * close means both direct exit and zero ActiveProcesses, then all native handles
 * closed. The caller owns all descriptors; stdin is a private empty read-only
 * file descriptor which supplies immediate EOF. No raw-spawn fallback exists. native/applicationName are test-only
 * injection options and never come from model or RPC payloads.
 */
export async function spawnVerificationJob(argv,{cwd,env,stdio,native,applicationName,pollMs=5}={}){
 if(!native){
  if(process.platform!=='win32')throw error('EVERIFICATIONJOB','Native verification Jobs require Windows.');
  const require=createRequire(import.meta.url);
  const meta=JSON.parse(fs.readFileSync(require.resolve('@deepseek-ai/dsh-win32-process/package.json'),'utf8'));
  if(meta.name!=='@deepseek-ai/dsh-win32-process'||meta.version!=='0.2.0-rc.2')throw error('EVERIFICATIONJOB','Unsupported official Windows Job package version.');
  native=await import(pathToFileURL(require.resolve('@deepseek-ai/dsh-win32-process')).href);
 }
 const required=['loadWin32ProcessBindings','spawnCurrentTokenJobProcess','pollProcessExit','isJobEmpty','terminateJob','closeHandleChecked'];
 if(required.some(key=>typeof native[key]!=='function'))throw error('EVERIFICATIONJOB','Official Windows Job API is unavailable.');
 const api=native.loadWin32ProcessBindings();
 const resolved=applicationName||resolveVerificationExecutable(argv[0],cwd,env);
 const child=new EventEmitter();let owned,timer,completed=false,termination=false,rootCode,handleCloseFailure;
 child.processTreeSettled=false;child.rootChildClosed=false;child.nativeHandlesClosed=false;
 child.unref=()=>{timer?.unref();return child;};
 const closeOwned=()=>{
  let first;
  for(const key of ['process','job'])if(owned?.[key]){
   const handle=owned[key];owned[key]=null;
   try{native.closeHandleChecked(api,handle,'verification '+key);}catch(e){first??=e;}
  }
  handleCloseFailure??=first;child.nativeHandlesClosed=!handleCloseFailure;if(handleCloseFailure)throw handleCloseFailure;
 };
 child.kill=()=>{
  if(completed)return false;
  if(!termination){termination=true;native.terminateJob(api,owned.job,1);}
  return true;
 };
 // Called on an unconfirmed outer close: kill-on-close releases owned handles,
 // but the caller must retain unsettled=true; this is not settlement evidence.
 child.dispose=()=>{
  clearInterval(timer);if(completed)return;
  completed=true;let first;
  try{if(owned?.job)native.terminateJob(api,owned.job,1);}catch(e){first=e;}
  try{closeOwned();}catch(e){first??=e;}
  if(first)throw first;
 };
 if(!Array.isArray(stdio)||stdio.length!==3||stdio.some(fd=>!Number.isSafeInteger(fd)||fd<0))throw error('EINVAL','Verification Job requires three owned file descriptors.');
 let spawnAttempted=false;
 try{
  spawnAttempted=true;
  owned=native.spawnCurrentTokenJobProcess(api,{command:argv[0],args:argv.slice(1),applicationName:resolved,cwd,env,stdio:{stdin:stdio[0],stdout:stdio[1],stderr:stdio[2]}});
  child.pid=owned.pid;
 }catch(e){if(spawnAttempted)e.unsettled=true;throw e;}
 const poll=()=>{
  if(completed)return;
  try{
   rootCode??=native.pollProcessExit(api,owned.process);
   child.rootChildClosed=rootCode!==undefined;
   if(rootCode===undefined||!native.isJobEmpty(api,owned.job))return;
   child.processTreeSettled=true;
   closeOwned();completed=true;clearInterval(timer);
   child.emit('close',rootCode,termination?'SIGKILL':null);
  }catch(e){
   // Consumers install error listeners synchronously after awaiting this factory.
   // A native poll/close failure is never normal completion.
   clearInterval(timer);child.emit('error',Object.assign(e,{code:e.code||'EVERIFICATIONJOB',unsettled:true}));
  }
 };
 timer=setInterval(poll,pollMs);
 return child;
}
