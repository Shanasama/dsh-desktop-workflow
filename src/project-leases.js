/** Process-wide project exclusion; run state and histories belong to sessions. */
import path from 'node:path';
import {tmpdir} from 'node:os';
import {realpathSync,existsSync,lstatSync,readFileSync} from 'node:fs';
import {TeamHostError} from './host-adapter.js';
const normalize=p=>process.platform==='win32'?p.toLowerCase():p;
const canonical=p=>normalize(realpathSync(p));
export function projectIdentity(cwd){
 if(typeof cwd!=='string'||!path.isAbsolute(cwd))throw new TeamHostError('PROJECT_UNAVAILABLE','无法确认当前项目边界，未启动团队。');
 let root=canonical(cwd);if(!lstatSync(root).isDirectory())throw new TeamHostError('PROJECT_UNAVAILABLE','当前工作区不是目录。');
 for(let dir=root;;dir=path.dirname(dir)){
  const marker=path.join(dir,'.git');
  if(existsSync(marker)){
   let gitDir;
   const stat=lstatSync(marker);if(stat.isSymbolicLink())throw new TeamHostError('PROJECT_UNAVAILABLE','Git 边界包含无法核验的链接。');
   if(stat.isDirectory())gitDir=canonical(marker);
   else if(stat.isFile()&&stat.size<=4096){const match=readFileSync(marker,'utf8').trim().match(/^gitdir: ([^\r\n\0]+)$/);if(!match)throw new TeamHostError('PROJECT_UNAVAILABLE','无法核验 Git 工作区边界。');gitDir=canonical(path.resolve(dir,match[1]));}
   else throw new TeamHostError('PROJECT_UNAVAILABLE','无法核验 Git 工作区边界。');
   const common=path.join(gitDir,'commondir');
   if(existsSync(common)){const stat=lstatSync(common);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>4096)throw new TeamHostError('PROJECT_UNAVAILABLE','无法核验 Git 共用目录。');const value=readFileSync(common,'utf8').trim();if(!value||/[\r\n\0]/.test(value))throw new TeamHostError('PROJECT_UNAVAILABLE','无法核验 Git 共用目录。');gitDir=canonical(path.resolve(gitDir,value));}
   return {root:dir,key:'git:'+gitDir};
  }
  if(path.dirname(dir)===dir)break;
 }
 return {root,key:'directory:'+root};
}
const KEY=Symbol.for('dsh-desktop-workflow:project-runs:v3');
export function mutationProjectIdentity(cwd,filePath,identify=projectIdentity){
 if(typeof cwd!=='string'||!path.isAbsolute(cwd)||typeof filePath!=='string'||!filePath||filePath.includes('\0'))throw new TeamHostError('PROJECT_UNAVAILABLE','无法核验修改目标的项目边界。');
 const target=path.resolve(cwd,filePath);let directory;
 try{const actual=realpathSync(target),stat=lstatSync(actual);if(!stat.isDirectory()&&(!stat.isFile()||stat.nlink>1))throw new TeamHostError('PROJECT_UNAVAILABLE','修改目标包含无法隔离的文件链接。');directory=stat.isDirectory()?actual:path.dirname(actual);}catch(error){if(error.code!=='ENOENT')throw error;directory=path.dirname(target);}
 for(;;){try{if(!lstatSync(directory).isDirectory())throw new TeamHostError('PROJECT_UNAVAILABLE','修改目标的父路径不是目录。');return identify(realpathSync(directory));}catch(error){if(error.code!=='ENOENT')throw error;const parent=path.dirname(directory);if(parent===directory)throw error;directory=parent;}}
}
// rc.2's shared writableRoots contract includes both platform temp and /tmp.
export function shellWriteProjects(workspaceRoot,identify=projectIdentity){
 return [...new Set([workspaceRoot,path.resolve('/tmp'),tmpdir()])].map(root=>{if(typeof root!=='string'||!path.isAbsolute(root))throw new TeamHostError('PROJECT_UNAVAILABLE','无法核验 shell 写入边界。');try{return identify(root);}catch(error){if(error.code!=='ENOENT')throw error;const resolved=normalize(path.resolve(root));return {root:resolved,key:'directory:'+resolved};}});
}
const state=globalThis[KEY]??(globalThis[KEY]={sessions:new Map(),leases:new Set(),history:new Map()});
const inside=(a,b)=>a===b||a.startsWith(b.endsWith(path.sep)?b:b+path.sep);
export const overlaps=(a,b)=>a.key===b.key||inside(a.root,b.root)||inside(b.root,a.root);
export function createProjectLeases(owner,resolveLegacy){
 const legacy=()=>{
  const old=globalThis[Symbol.for('dsh-desktop-workflow:exclusive-run:v2')]?.current;
  if(!old)return null;
  let project;try{project=resolveLegacy(old.sessionId);}catch{}
  return {...old,project,state:old.poisoned?'quarantined':'running',legacy:true};
 };
 const conflict=(sessionId,project,{includeSession=true}={})=>{
  const own=includeSession&&state.sessions.get(sessionId);if(own)return own;
  for(const lease of state.leases)if(!project||overlaps(project,lease.project))return lease;
  const old=legacy();if(old&&(!project||!old.project||overlaps(project,old.project)||old.sessionId===sessionId))return old;
  return null;
 };
 const save=snapshot=>{
  if(!snapshot)return;
  let rows=state.history.get(snapshot.sessionId);if(!rows)state.history.set(snapshot.sessionId,rows=[]);
  const index=rows.findIndex(r=>r.id===snapshot.id);if(index>=0)rows[index]=structuredClone(snapshot);else rows.unshift(structuredClone(snapshot));
  while(rows.length>8){const index=rows.findLastIndex(r=>!!r.finishedAt);if(index<0)break;rows.splice(index,1);}
  while(state.history.size>64){const id=[...state.history.keys()].find(id=>!state.sessions.has(id));if(!id)break;state.history.delete(id);}
 };
 return {
  conflict,
  get:sessionId=>state.sessions.get(sessionId),
  owned:()=>[...state.leases].filter(l=>l.owner===owner),
  acquire(sessionId,project){const occupied=conflict(sessionId,project);if(occupied)return {occupied};const lease={owner,sessionId,project,state:'starting',poisoned:false,startedAt:new Date().toISOString()};state.sessions.set(sessionId,lease);state.leases.add(lease);return {lease};},
  release(lease){if(lease.poisoned)return false;if(state.sessions.get(lease.sessionId)===lease)state.sessions.delete(lease.sessionId);state.leases.delete(lease);return true;},
  poison(sessionId,source,diagnostic){const lease=state.sessions.get(sessionId);if(lease?.owner!==owner)return;lease.poisoned=true;lease.state='quarantined';lease.poisonSource=source;lease.diagnostic=diagnostic||lease.diagnostic;},
  save,
  snapshot(sessionId,runId){return structuredClone(state.history.get(sessionId)?.find(r=>!runId||r.id===runId)||null);},
  history(sessionId){return (state.history.get(sessionId)||[]).map(({id,sessionId,goal,status,startedAt,finishedAt})=>({id,sessionId,goal,status,startedAt,finishedAt}));},
 };
}
export function occupancy(lease){return lease?{sessionId:lease.sessionId,runId:lease.runId,state:lease.state,workspace:lease.project?.root,legacy:!!lease.legacy,scopeKnown:!!lease.project,diagnostic:lease.diagnostic}:undefined;}
export function occupiedMessage(lease){
 const who=`会话 ${lease.sessionId}${lease.runId?' / '+lease.runId:''}`;
 if(lease.legacy&&!lease.project)return `旧运行由${who}占用，项目范围尚未确认；保留保护，请先在宿主确认结束。`;
 if(lease.poisoned)return `此项目由${who}隔离：${lease.poisonSource==='verification'?'项目检查':'子代理'}清理未确认${lease.diagnostic?'（'+lease.diagnostic.phase+' / '+lease.diagnostic.reason+'）':''}。其它独立项目可继续；当前项目须确认执行已结束。`;
 return `此项目由${who}占用（${lease.state==='starting'?'启动检查':lease.state==='cancelling'?'正在取消并清理':'正在运行'}）；请等待可验证结束。`;
}
