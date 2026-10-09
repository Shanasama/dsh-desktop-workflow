/** Automatic project verification. All subprocesses execute INSIDE a native host tool. */
import {randomUUID} from 'node:crypto';
import {TeamHostError} from './host-adapter.js';
const quote=s=>"'"+s.replace(/'/g,"'\\''")+"'";
async function projectRunner(p){
 const fs=await import('node:fs'),path=await import('node:path'),crypto=await import('node:crypto'),cp=await import('node:child_process'),os=await import('node:os');
 const root=fs.realpathSync(process.cwd()),hash=x=>crypto.createHash('sha256').update(x).digest('hex');let unsettled=false;const safeRoot=root!==path.resolve(process.env.HOME||'/impossible')&&!/(^|\/)(?:\.dsh|\.ssh|\.aws|profiles)(?:\/|$)/i.test(root.replaceAll('\\','/'));
 const secret=/(^|\/)(?:\.git|\.dsh|\.ssh|\.aws|\.credentials(?:\.yaml)?|\.env(?:\..*)?|.*\.(?:pem|key)|id_rsa|credentials)(?:\/|$)/i;
 const dependency=/(^|\/)(?:node_modules|vendor|\.venv|venv|\.cache|dist|build|coverage)(?:\/|$)/i;
 const protectedName=/(^|\/)(?:package(?:-lock)?\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|tsconfig[^/]*\.json|Cargo\.(?:toml|lock)|go\.(?:mod|sum)|pyproject\.toml|pytest\.ini|requirements[^/]*\.txt|[^/]*(?:\.config\.[^/]+|\.test\.[^/]+|\.spec\.[^/]+)|test[^/]*|tests?|__tests__)(?:\/|$)/i;
 const env=Object.fromEntries(['PATH','HOME','TMPDIR','TEMP','TMP','SystemRoot','WINDIR','LANG'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));Object.assign(env,{GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_TERMINAL_PROMPT:'0',GOPROXY:'off',GOSUMDB:'off',GOTOOLCHAIN:'local',CARGO_NET_OFFLINE:'true',PIP_NO_INDEX:'1',PYTHONDONTWRITEBYTECODE:'1'});
 const run=(argv,ms)=>{const r=cp.spawnSync(argv[0],argv.slice(1),{cwd:root,encoding:'utf8',timeout:ms,maxBuffer:1048576,env,killSignal:'SIGKILL'});if(r.signal||r.error?.code==='ETIMEDOUT')unsettled=true;return {ok:r.status===0&&!r.error&&!r.signal,code:r.status,infrastructure:r.error?.code==='ENOENT',text:(r.stdout||'')+(r.stderr||''),unsettled};};
 const git=(...a)=>{const r=run(['git','--no-optional-locks','-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null',...a],10000);if(!r.ok)throw Error('Git observation unavailable');return r.text;};
 const safePath=n=>{if(!n||path.isAbsolute(n)||n.split(/[\\/]/).some(s=>s==='..'||s==='.')||secret.test(n)||dependency.test(n))throw Error('Restricted path');let cur=root;for(const part of n.split('/')){cur=path.join(cur,part);try{if(fs.lstatSync(cur).isSymbolicLink())throw Error('Symlink path');}catch(e){if(e.code!=='ENOENT')throw e;}}return cur;};
 const output=x=>process.stdout.write(JSON.stringify({runId:p.runId,round:p.round,nonce:p.nonce,...x}));
 const manifest=()=>{
  const names=[...new Set([...git('ls-files','-z').split('\0'),...git('ls-files','--others','--exclude-standard','-z').split('\0')].filter(Boolean))].filter(n=>!secret.test(n)&&!dependency.test(n)).sort();
  if(names.length>10000)throw Error('Project evidence file limit');let bytes=0;const entries={};for(const n of names){const f=safePath(n);try{const st=fs.lstatSync(f);if(!st.isFile())throw Error('Non-file entry');bytes+=st.size;if(bytes>134217728)throw Error('Project evidence byte limit');entries[n]=st.mode+':'+hash(fs.readFileSync(f));}catch(e){if(e.code==='ENOENT')entries[n]='MISSING';else throw e;}}
  const metadata=[];const gd=path.join(root,'.git');if(!fs.existsSync(gd)||!fs.lstatSync(gd).isDirectory()||fs.lstatSync(gd).isSymbolicLink())throw Error('Linked Git worktree not supported');
  const visit=(d,rel='')=>{for(const n of fs.readdirSync(d).sort()){const name=rel?rel+'/'+n:n;if(name==='objects'||name==='logs')continue;const f=path.join(d,n),s=fs.lstatSync(f);if(s.isSymbolicLink())throw Error('Git metadata symlink');if(s.isDirectory())visit(f,name);else {if(s.size>8388608)throw Error('Git metadata too large');metadata.push([name,s.mode,hash(fs.readFileSync(f))]);}}};visit(gd);
  return {entries,gitHash:hash(JSON.stringify(metadata)),head:git('rev-parse','HEAD').trim()};
 };
 try{
  if(p.baselineRef){const ref=p.baselineRef;const file=ref.path,dir=path.dirname(file);if(path.basename(file)!=='state.json'||!path.basename(dir).startsWith('dsh-team-evidence-')||path.dirname(dir)!==fs.realpathSync(os.tmpdir())||fs.lstatSync(file).isSymbolicLink()||fs.lstatSync(dir).isSymbolicLink())throw Error('Invalid evidence reference');const raw=fs.readFileSync(file);if(hash(raw)!==ref.digest)throw Error('Evidence reference changed');const stored=JSON.parse(raw);if(stored.runId!==p.runId||stored.project?.root!==root)throw Error('Evidence run mismatch');if(p.phase==='cleanup'){fs.unlinkSync(file);fs.rmdirSync(dir);output({verified:true,reason:'Temporary evidence removed'});return;}p.baseline=stored.baseline;p.project=stored.project;}
  if(!safeRoot||root===path.resolve(env.HOME||'/impossible')||secret.test(root.replaceAll('\\','/')))throw Error('Home/profile workspace refused');
  if(git('rev-parse','--show-toplevel').trim()!==root)throw Error('Project root must be repository root');
  if(git('ls-files','-v').split('\n').some(l=>l&&/^[a-zS]/.test(l)))throw Error('Hidden index entries');
  const m=manifest();
  if(p.phase==='baseline'){
   let check=null;try{const pkg=JSON.parse(fs.readFileSync(safePath('package.json'),'utf8'));for(const id of ['test','check','typecheck']){const command=pkg.scripts?.[id];if(typeof command!=='string')continue;
    // Only recognized foreground runners. No shell chaining, installation, lifecycle hooks or arbitrary script discovery.
    if(/^node\s+--test(?:\s+[A-Za-z0-9_./*=-]+)*$/.test(command)){const args=command.trim().split(/\s+/).slice(2);if(args.every(a=>!a.startsWith('/')&&!a.split('/').includes('..')&&(!a.startsWith('-')||/^--test-concurrency=[1-4]$/.test(a))))check={id,kind:'node-test',argv:[process.execPath,'--test',...args],timeoutMs:60000};}
    else if(/^vitest(?:\s+run)?$/.test(command)&&fs.existsSync(path.join(root,'node_modules/vitest/vitest.mjs')))check={id,kind:'vitest',argv:[process.execPath,'node_modules/vitest/vitest.mjs','run'],timeoutMs:60000};
    else if(/^jest(?:\s+--runInBand)?$/.test(command)&&fs.existsSync(path.join(root,'node_modules/jest/bin/jest.js')))check={id,kind:'jest',argv:[process.execPath,'node_modules/jest/bin/jest.js','--runInBand'],timeoutMs:60000};
    else if(/^tsc\s+--noEmit$/.test(command)&&fs.existsSync(path.join(root,'node_modules/typescript/bin/tsc')))check={id,kind:'typecheck',argv:[process.execPath,'node_modules/typescript/bin/tsc','--noEmit'],timeoutMs:60000};
    if(check)break;
   }}catch{}
   if(!check&&fs.existsSync(path.join(root,'Cargo.toml')))check={id:'cargo-test',kind:'cargo',argv:['cargo','test','--offline'],timeoutMs:60000};
   if(!check&&fs.existsSync(path.join(root,'go.mod')))check={id:'go-test',kind:'go',argv:['go','test','./...'],timeoutMs:60000};
   if(!check&&Object.keys(m.entries).some(n=>/(^|\/)(test_[^/]+|[^/]+_test)\.py$/.test(n))){const pytest=fs.existsSync(path.join(root,'pytest.ini'))||fs.existsSync(path.join(root,'pyproject.toml'));check=pytest?{id:'pytest',kind:'pytest',argv:['python3','-m','pytest','-q'],timeoutMs:60000}:{id:'unittest',kind:'unittest',argv:['python3','-m','unittest','discover'],timeoutMs:60000};}
   const explicitEntries=check?.kind==='node-test'?(check.argv.slice(2).filter(a=>!a.startsWith('-')).flatMap(a=>a.includes('*')?fs.globSync(a,{cwd:root}):[a])):[];
   const protectedDirectories=[...new Set(explicitEntries.map(n=>path.posix.dirname(n)).filter(n=>n!=='.'))];
   const protectedFiles=Object.keys(m.entries).filter(n=>protectedName.test(n)||explicitEntries.includes(n)||protectedDirectories.some(d=>n.startsWith(d+'/')));
   const project={safeRoot,mode:check?'verified':'unverified-editable',reason:check?'已自动识别项目检查，无需填写路径表单。':'未识别可自动运行的验收命令；可以生成项目改动，但结果将标为待验证。',checks:check?[check]:[],protectedFiles,dirtyFiles:[...new Set([...git('diff','--name-only','HEAD').split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean))].slice(0,100),inventory:Object.keys(m.entries).slice(0,160),root};
   const dir=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'dsh-team-evidence-'));fs.chmodSync(dir,0o700);const file=path.join(dir,'state.json'),raw=JSON.stringify({runId:p.runId,baseline:m,project});fs.writeFileSync(file,raw,{mode:0o600,flag:'wx'});
   output({verified:true,project:{...project,protectedFiles:explicitEntries,protectedDirectories,protectedPattern:true},baselineRef:{path:file,digest:hash(raw)}});return;
  }
  const baseline=p.baseline,project=p.project;
  if(!baseline||m.head!==baseline.head||m.gitHash!==baseline.gitHash)throw Error('Git baseline changed');
  const changed=[...new Set([...Object.keys(baseline.entries),...Object.keys(m.entries)])].filter(n=>baseline.entries[n]!==m.entries[n]);
  const protectedOk=project.protectedFiles.every(n=>m.entries[n]===baseline.entries[n]);

  const fingerprint=hash(JSON.stringify(m));
  if(p.phase==='seal'){if(fingerprint!==p.expectedFingerprint)throw Error('Stale verification');output({verified:true,sealed:true,reason:'当前文件仍与本轮验收一致。'});return;}
  if(project.mode==='analysis-only'||project.mode==='unverified-editable'||!protectedOk){output({verified:true,checksPassed:false,checksFailed:0,checksRun:false,diffAvailable:true,scopeOk:project.mode==='analysis-only'?changed.length===0:true,protectedOk,diffEmpty:changed.length===0,expectsChanges:false,reason:!protectedOk?'验收测试或配置已按任务修改，原门禁失效；改动保留，结果待验证。':project.reason,checks:[],checkSummary:'No unchanged independent acceptance available',diffStat:changed.map(n=>n+' changed').join('\n').slice(0,1500),fingerprint,analysisOnly:project.mode==='analysis-only',needsVerification:true});return;}
  const checks=project.checks.map(c=>{const r=run(c.argv,c.timeoutMs);const nonempty=c.kind==='typecheck'||c.kind==='node-test'?c.kind==='typecheck'||/(?:#|ℹ) pass [1-9][0-9]*/.test(r.text):c.kind==='vitest'?/Test Files[^\n]*[1-9][0-9]*\s+passed/.test(r.text):c.kind==='jest'?/Tests:[^\n]*[1-9][0-9]*\s+passed/.test(r.text):c.kind==='pytest'?/[1-9][0-9]* passed/.test(r.text):c.kind==='unittest'?Number(r.text.match(/Ran ([0-9]+) tests?/)?.[1]||0)>Number(r.text.match(/skipped=([0-9]+)/)?.[1]||0):c.kind==='cargo'?/test result: ok\. [1-9][0-9]* passed/.test(r.text):c.kind==='go'?r.text.split('\n').some(line=>/^ok\s+\S+/.test(line)&&!line.includes('[no tests to run]')):false;return {id:c.id,exitCode:r.code,passed:r.ok&&nonempty,unsettled:r.unsettled,infrastructure:r.infrastructure||/No module named (?:pytest|unittest)/.test(r.text),tail:r.text.slice(-700)+(nonempty?'':'\nNo nonempty test result observed')};});
  const after=manifest();if(JSON.stringify(after.entries)!==JSON.stringify(m.entries))throw Error('Checks modified project inputs');if(after.head!==baseline.head||after.gitHash!==baseline.gitHash||project.protectedFiles.some(n=>after.entries[n]!==baseline.entries[n]))throw Error('Checks changed protected evidence');
  output({verified:true,checksPassed:checks.length>0&&checks.every(c=>c.passed),checksFailed:checks.filter(c=>!c.passed).length,checksRun:true,needsVerification:checks.some(c=>c.infrastructure),diffAvailable:true,scopeOk:true,protectedOk:true,diffEmpty:changed.length===0,expectsChanges:true,checks,checkSummary:checks.map(c=>c.id+': exit '+c.exitCode+'\n'+c.tail).join('\n').slice(-2500),diffStat:changed.map(n=>n+' changed since task start').join('\n').slice(0,1500),fingerprint:hash(JSON.stringify(after)),securityChanged:changed.some(f=>/(^|\/)(?:auth|permission|credential|secret|payment|migration)/i.test(f)),reason:'基于本次启动快照独立检查；既有未提交变更未计入本次贡献。'});
 }catch{
  if(p.phase==='baseline'&&!unsettled){output({verified:true,project:{safeRoot,mode:'analysis-only',reason:'当前项目无法建立可靠自动验收；先只读分析，不会宣称代码任务完成。',checks:[],protectedFiles:[],inventory:[],root},baseline:null});return;}
  output({verified:false,unsettled,reason:'项目证据不完整或验收文件发生变化，结果待验证。'});process.exitCode=1;
 }
}
export function createAutoVerifier({executeTool,poison,onPolicy=()=>{}}){
 const states=new Map();
 return {profiles:[],automatic:true,
 preflight(config){if(config.verification?.profileId!=='auto')throw new TeamHostError('AUTO_PROJECT_REQUIRED','请使用 /team 自动探测当前项目。');},
 async collect({config,runId,round,signal,phase='check'}){
  const state=states.get(runId);if(phase!=='baseline'&&!state)throw new TeamHostError('BASELINE_REQUIRED','缺少项目启动快照。');
  if(phase==='check'&&state.project.mode==='analysis-only'&&!state.baselineRef)return {verified:false,analysisOnly:true,checksPassed:false,checksFailed:0,checksRun:false,diffAvailable:false,scopeOk:false,protectedOk:false,reason:state.project.reason,diffStat:'Unavailable',checkSummary:'No independent checks'};
  const nonce=randomUUID(),payload={runId,round,nonce,phase,baselineRef:state?.baselineRef,expectedFingerprint:state?.round===round?state.fingerprint:undefined};
  let result;try{result=await executeTool(config.sessionId,{name:'bash',arguments:{command:quote(process.execPath)+' --input-type=module -e '+quote('('+projectRunner.toString()+')('+JSON.stringify(payload)+')'),timeoutMs:90000,run_in_background:false}},signal,{allowUserApproval:true});}catch(error){if(!['CANCELLED','CONTEXT_CHANGED','VERIFIER_UNAVAILABLE','VERIFIER_SCOPE_UNSAFE'].includes(error?.code))poison(config.sessionId);throw error;}
  if(result?.verificationNotDispatched)throw new TeamHostError('VERIFICATION_DENIED','宿主未批准这次项目检查；没有执行检查，也没有自动批准。可在当前会话重新发起 /team。');
  const v=result?.value;if(result?.isError||!v||v.kind!=='foreground'||v.timedOut||v.aborted||v.signal||!Number.isInteger(v.exitCode)){poison(config.sessionId);throw new TeamHostError('VERIFICATION_UNSETTLED','自动项目检查的清理状态不明，已暂停新运行。');}
  if(v.stdout?.truncated||v.stderr?.truncated||v.sandbox?.denied||v.sandbox?.runnerFailed)throw new TeamHostError('VERIFICATION_BLOCKED','项目检查被宿主限制或证据过大，无法验证。');
  let data;try{data=JSON.parse(v.stdout.text);}catch{throw new TeamHostError('VERIFICATION_INVALID','项目检查未返回可验证结果。');}
  if(data.unsettled||data.checks?.some(c=>c.unsettled)){poison(config.sessionId);throw new TeamHostError('VERIFICATION_UNSETTLED','检查进程清理未确认，已暂停新运行。');}
  if(data.runId!==runId||data.round!==round||data.nonce!==nonce||v.exitCode!==0||!data.verified)throw new TeamHostError('VERIFICATION_INVALID','项目证据发生变化或不完整，不能宣称完成。');
  if(phase==='baseline'){states.set(runId,{project:data.project,baselineRef:data.baselineRef,config});onPolicy(runId,data.project);return {verified:true,reason:data.project.reason,project:data.project,analysisOnly:data.project.mode==='analysis-only'};}
  if(phase==='check'){state.round=round;state.fingerprint=data.fingerprint;}
  return data;
 },async release(runId){const state=states.get(runId);if(state?.baselineRef){try{await this.collect({config:state.config,runId,round:state.round||0,phase:'cleanup',signal:new AbortController().signal});}catch{/* Evidence contains only project metadata/hashes. Host restrictions may prevent cleanup; never broaden permissions. */}}states.delete(runId);onPolicy(runId,null);}};
}
