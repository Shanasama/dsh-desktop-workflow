/** Fixed native-tool verifier entry point. Payload is data; no user executable input. */
import {runVerificationProcess,createVerificationProcessScope} from './verification-process.js';
async function projectRunner(p){
 const captureScope=createVerificationProcessScope();
 const fs=await import('node:fs'),path=await import('node:path'),crypto=await import('node:crypto');
 const root=fs.realpathSync(process.cwd()),hash=x=>crypto.createHash('sha256').update(x).digest('hex');let unsettled=false;const safeRoot=root!==path.resolve(process.env.HOME||'/impossible')&&!/(^|\/)(?:\.dsh|\.ssh|\.aws|profiles)(?:\/|$)/i.test(root.replaceAll('\\','/'));
 const secret=/(^|\/)(?:\.git|\.dsh|\.ssh|\.aws|\.credentials(?:\.yaml)?|\.env(?:\..*)?|.*\.(?:pem|key)|id_rsa|credentials)(?:\/|$)/i;
 const dependency=/(^|\/)(?:node_modules|vendor|\.venv|venv|\.cache|dist|build|coverage)(?:\/|$)/i;
 const protectedName=/(^|\/)(?:package(?:-lock)?\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|tsconfig[^/]*\.json|Cargo\.(?:toml|lock)|go\.(?:mod|sum)|pyproject\.toml|pytest\.ini|requirements[^/]*\.txt|[^/]*(?:\.config\.[^/]+|\.test\.[^/]+|\.spec\.[^/]+)|test[^/]*|tests?|__tests__)(?:\/|$)/i;
 const env=Object.fromEntries(['PATH','HOME','TMPDIR','TEMP','TMP','SystemRoot','WINDIR','LANG'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));Object.assign(env,{ELECTRON_RUN_AS_NODE:'1',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_TERMINAL_PROMPT:'0',GOPROXY:'off',GOSUMDB:'off',GOTOOLCHAIN:'local',CARGO_NET_OFFLINE:'true',PIP_NO_INDEX:'1',PYTHONDONTWRITEBYTECODE:'1'});
 const run=async(argv,ms)=>{const r=await runVerificationProcess(argv,{cwd:root,env,timeoutMs:ms,maxBuffer:1048576,captureScope});if(r.unsettled||r.signal||r.error?.code==='ETIMEDOUT'||r.cleanupConfirmed===false)unsettled=true;return {ok:r.status===0&&!r.error&&!r.signal&&!r.unsettled&&r.cleanupConfirmed!==false,code:r.status,infrastructure:r.error?.code==='ENOENT',text:(r.stdout||'')+(r.stderr||''),unsettled};};
 const git=async(...a)=>{const r=await run(['git','--no-optional-locks','-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null',...a],10000);if(!r.ok)throw Error('Git observation unavailable');return r.text;};
 const safePath=n=>{if(!n||path.isAbsolute(n)||n.split(/[\\/]/).some(s=>s==='..'||s==='.')||secret.test(n)||dependency.test(n))throw Error('Restricted path');let cur=root;for(const part of n.split('/')){cur=path.join(cur,part);try{if(fs.lstatSync(cur).isSymbolicLink())throw Error('Symlink path');}catch(e){if(e.code!=='ENOENT')throw e;}}return cur;};
 const output=async x=>{const capture=await captureScope.finalize();if(capture.unsettled||capture.cleanupConfirmed===false){unsettled=true;x={...x,verified:false,unsettled:true,reason:'Verification process output or cleanup could not be confirmed'};process.exitCode=1;}process.stdout.write(JSON.stringify({runId:p.runId,round:p.round,nonce:p.nonce,...x}));};
 // Native sandboxes may replace /tmp for every invocation. Keep only hash evidence
 // in one registered workspace directory; the host retains its original digest.
 const evidenceLimit=16777216,sameObject=(a,b)=>a.dev===b.dev&&a.ino===b.ino&&a.nlink===b.nlink;
 let evidence,createdEvidence;
 const validateEvidence=(ref,previous)=>{
  if(!ref||typeof ref.path!=='string'||typeof ref.digest!=='string'||!/^[a-f0-9]{64}$/.test(ref.digest)||!path.isAbsolute(ref.path)||path.normalize(ref.path)!==ref.path)throw Error('Invalid evidence reference');
  const file=ref.path,dir=path.dirname(file),name=path.basename(dir);
  if(path.basename(file)!=='state.json'||!/^\.dsh-team-evidence-[a-f0-9]{32}$/.test(name)||path.relative(root,dir)!==name)throw Error('Invalid evidence reference');
  const dirStat=fs.lstatSync(dir),fileStat=fs.lstatSync(file);
  if(dirStat.isSymbolicLink()||!dirStat.isDirectory()||fileStat.isSymbolicLink()||!fileStat.isFile()||fileStat.nlink!==1||path.relative(root,fs.realpathSync(dir))!==name||path.relative(dir,fs.realpathSync(file))!=='state.json')throw Error('Invalid evidence object');
  if(process.platform!=='win32'&&((dirStat.mode&0o777)!==0o700||(fileStat.mode&0o777)!==0o600))throw Error('Invalid evidence permissions');
  if(previous&&(!sameObject(previous.dirStat,dirStat)||!sameObject(previous.fileStat,fileStat)))throw Error('Evidence object changed');
  if(JSON.stringify(fs.readdirSync(dir))!==JSON.stringify(['state.json']))throw Error('Unexpected evidence directory contents');
  const fd=fs.openSync(file,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0));let raw;
  try{const opened=fs.fstatSync(fd);if(!opened.isFile()||opened.nlink!==1||!sameObject(opened,fileStat))throw Error('Evidence object changed');if(opened.size>evidenceLimit)throw Error('Evidence state too large');const buffer=Buffer.alloc(opened.size+1);let bytes=0;while(bytes<buffer.length){const count=fs.readSync(fd,buffer,bytes,buffer.length-bytes,null);if(!count)break;bytes+=count;}raw=buffer.subarray(0,bytes);const after=fs.fstatSync(fd);if(raw.length!==opened.size||after.size!==opened.size||after.mtimeMs!==opened.mtimeMs||after.ctimeMs!==opened.ctimeMs||!sameObject(after,opened))throw Error('Evidence changed during read');}finally{fs.closeSync(fd);}
  const currentDir=fs.lstatSync(dir),currentFile=fs.lstatSync(file);
  if(currentDir.isSymbolicLink()||currentFile.isSymbolicLink()||!sameObject(dirStat,currentDir)||!sameObject(fileStat,currentFile)||JSON.stringify(fs.readdirSync(dir))!==JSON.stringify(['state.json']))throw Error('Evidence object changed');
  if(hash(raw)!==ref.digest)throw Error('Evidence reference changed');
  const stored=JSON.parse(raw);
  if(stored.runId!==p.runId||stored.project?.root!==root||stored.project?.evidenceDirectory!==name)throw Error('Evidence run mismatch');
  return {file,dir,name,relative:name+'/state.json',fileStat:currentFile,dirStat:currentDir,stored};
 };
 const removeCreatedEvidence=()=>{
  if(!createdEvidence)return;
  const {dir,file,dirStat,fileStat}=createdEvidence,currentDir=fs.lstatSync(dir);
  if(!dirStat||currentDir.isSymbolicLink()||!currentDir.isDirectory()||!sameObject(dirStat,currentDir)||path.relative(root,fs.realpathSync(dir))!==path.basename(dir))throw Error('Evidence creation cleanup unavailable');
  const names=fs.readdirSync(dir);
  if(fileStat){const currentFile=fs.lstatSync(file);if(names.length!==1||names[0]!=='state.json'||currentFile.isSymbolicLink()||!currentFile.isFile()||currentFile.nlink!==1||!sameObject(fileStat,currentFile))throw Error('Evidence creation cleanup unavailable');fs.unlinkSync(file);}
  else if(names.length)throw Error('Evidence creation cleanup unavailable');
  const emptyDir=fs.lstatSync(dir);if(emptyDir.isSymbolicLink()||!sameObject(dirStat,emptyDir)||fs.readdirSync(dir).length)throw Error('Evidence creation cleanup unavailable');fs.rmdirSync(dir);createdEvidence=undefined;
 };
 const manifest=async()=>{
  if(evidence)evidence=validateEvidence(p.baselineRef,evidence);
  const names=[...new Set([...(await git('ls-files','-z')).split('\0'),...(await git('ls-files','--others','--exclude-standard','-z')).split('\0')].filter(Boolean))].filter(n=>!secret.test(n)&&!dependency.test(n)&&n!==evidence?.relative).sort();
  if(names.length>10000)throw Error('Project evidence file limit');let bytes=0;const entries={};for(const n of names){captureScope.checkpoint();const f=safePath(n);try{const st=fs.lstatSync(f);if(!st.isFile())throw Error('Non-file entry');bytes+=st.size;if(bytes>134217728)throw Error('Project evidence byte limit');entries[n]=st.mode+':'+hash(fs.readFileSync(f));}catch(e){if(e.code==='ENOENT')entries[n]='MISSING';else throw e;}}
  const metadata=[];const gd=path.join(root,'.git');if(!fs.existsSync(gd)||!fs.lstatSync(gd).isDirectory()||fs.lstatSync(gd).isSymbolicLink())throw Error('Linked Git worktree not supported');
  const visit=(d,rel='')=>{for(const n of fs.readdirSync(d).sort()){captureScope.checkpoint();const name=rel?rel+'/'+n:n;if(name==='objects'||name==='logs')continue;const f=path.join(d,n),s=fs.lstatSync(f);if(s.isSymbolicLink())throw Error('Git metadata symlink');if(s.isDirectory())visit(f,name);else {if(s.size>8388608)throw Error('Git metadata too large');metadata.push([name,s.mode,hash(fs.readFileSync(f))]);}}};visit(gd);
  const head=(await git('rev-parse','HEAD')).trim();if(evidence)evidence=validateEvidence(p.baselineRef,evidence);
  return {entries,gitHash:hash(JSON.stringify(metadata)),head};
 };
 try{
  if(!safeRoot||root===path.resolve(env.HOME||'/impossible')||secret.test(root.replaceAll('\\','/')))throw Error('Home/profile workspace refused');
  if(p.baselineRef){evidence=validateEvidence(p.baselineRef);if(p.phase==='cleanup'){evidence=validateEvidence(p.baselineRef,evidence);fs.unlinkSync(evidence.file);const currentDir=fs.lstatSync(evidence.dir);if(currentDir.isSymbolicLink()||!sameObject(evidence.dirStat,currentDir)||fs.readdirSync(evidence.dir).length)throw Error('Evidence cleanup changed');fs.rmdirSync(evidence.dir);await output({verified:true,reason:'Temporary evidence removed'});return;}p.baseline=evidence.stored.baseline;p.project=evidence.stored.project;}
  if(fs.realpathSync((await git('rev-parse','--show-toplevel')).trim())!==root)throw Error('Project root must be repository root');
  if((await git('ls-files','-v')).split('\n').some(l=>l&&/^[a-zS]/.test(l)))throw Error('Hidden index entries');
  const m=await manifest();
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
   const project={safeRoot,mode:check?'verified':'unverified-editable',reason:check?'已自动识别项目检查，无需填写路径表单。':'未识别可自动运行的验收命令；可以生成项目改动，但结果将标为待验证。',checks:check?[check]:[],protectedFiles,dirtyFiles:[...new Set([...(await git('diff','--name-only','HEAD')).split('\n'),...(await git('ls-files','--others','--exclude-standard')).split('\n')].filter(Boolean))].slice(0,100),inventory:Object.keys(m.entries).slice(0,160),root};
   const name=p.evidenceDirectory===undefined?'.dsh-team-evidence-'+crypto.randomBytes(16).toString('hex'):p.evidenceDirectory;
   if(typeof name!=='string'||!/^\.dsh-team-evidence-[a-f0-9]{32}$/.test(name))throw Error('Invalid evidence directory');
   const dir=path.join(root,name);project.evidenceDirectory=name;
   const file=path.join(dir,'state.json'),raw=JSON.stringify({runId:p.runId,baseline:m,project});if(Buffer.byteLength(raw)>evidenceLimit)throw Error('Evidence state too large');fs.mkdirSync(dir,{mode:0o700});createdEvidence={dir,file};createdEvidence.dirStat=fs.lstatSync(dir);fs.chmodSync(dir,0o700);
   const fd=fs.openSync(file,'wx',0o600);try{createdEvidence.fileStat=fs.fstatSync(fd);fs.fchmodSync(fd,0o600);fs.writeFileSync(fd,raw);}finally{fs.closeSync(fd);}
   const baselineRef={path:file,digest:hash(raw)};validateEvidence(baselineRef,createdEvidence);
   await output({verified:true,project:{...project,protectedFiles:explicitEntries,protectedDirectories,protectedPattern:true},baselineRef});return;
  }
  const baseline=p.baseline,project=p.project;
  if(!baseline||m.head!==baseline.head||m.gitHash!==baseline.gitHash)throw Error('Git baseline changed');
  const changed=[...new Set([...Object.keys(baseline.entries),...Object.keys(m.entries)])].filter(n=>baseline.entries[n]!==m.entries[n]);
  const protectedOk=project.protectedFiles.every(n=>m.entries[n]===baseline.entries[n]);

  const fingerprint=hash(JSON.stringify(m));
  if(p.phase==='seal'){if(fingerprint!==p.expectedFingerprint)throw Error('Stale verification');await output({verified:true,sealed:true,reason:'当前文件仍与本轮验收一致。'});return;}
  if(project.mode==='analysis-only'||project.mode==='unverified-editable'||!protectedOk){await output({verified:true,checksPassed:false,checksFailed:0,checksRun:false,diffAvailable:true,scopeOk:project.mode==='analysis-only'?changed.length===0:true,protectedOk,diffEmpty:changed.length===0,expectsChanges:false,reason:!protectedOk?'验收测试或配置已按任务修改，原门禁失效；改动保留，结果待验证。':project.reason,checks:[],checkSummary:'No unchanged independent acceptance available',diffStat:changed.map(n=>n+' changed').join('\n').slice(0,1500),fingerprint,analysisOnly:project.mode==='analysis-only',needsVerification:true});return;}
  const checks=[];for(const c of project.checks){const r=await run(c.argv,c.timeoutMs);const nonempty=c.kind==='typecheck'||c.kind==='node-test'?c.kind==='typecheck'||/(?:#|ℹ) pass [1-9][0-9]*/.test(r.text):c.kind==='vitest'?/Test Files[^\n]*[1-9][0-9]*\s+passed/.test(r.text):c.kind==='jest'?/Tests:[^\n]*[1-9][0-9]*\s+passed/.test(r.text):c.kind==='pytest'?/[1-9][0-9]* passed/.test(r.text):c.kind==='unittest'?Number(r.text.match(/Ran ([0-9]+) tests?/)?.[1]||0)>Number(r.text.match(/skipped=([0-9]+)/)?.[1]||0):c.kind==='cargo'?/test result: ok\. [1-9][0-9]* passed/.test(r.text):c.kind==='go'?r.text.split('\n').some(line=>/^ok\s+\S+/.test(line)&&!line.includes('[no tests to run]')):false;checks.push({id:c.id,exitCode:r.code,passed:r.ok&&nonempty,unsettled:r.unsettled,infrastructure:r.infrastructure||/No module named (?:pytest|unittest)/.test(r.text),tail:r.text.slice(-700)+(nonempty?'':'\nNo nonempty test result observed')});}
  const after=await manifest();if(JSON.stringify(after.entries)!==JSON.stringify(m.entries))throw Error('Checks modified project inputs');if(after.head!==baseline.head||after.gitHash!==baseline.gitHash||project.protectedFiles.some(n=>after.entries[n]!==baseline.entries[n]))throw Error('Checks changed protected evidence');
  await output({verified:true,checksPassed:checks.length>0&&checks.every(c=>c.passed),checksFailed:checks.filter(c=>!c.passed).length,checksRun:true,needsVerification:checks.some(c=>c.infrastructure),diffAvailable:true,scopeOk:true,protectedOk:true,diffEmpty:changed.length===0,expectsChanges:true,checks,checkSummary:checks.map(c=>c.id+': exit '+c.exitCode+'\n'+c.tail).join('\n').slice(-2500),diffStat:changed.map(n=>n+' changed since task start').join('\n').slice(0,1500),fingerprint:hash(JSON.stringify(after)),securityChanged:changed.some(f=>/(^|\/)(?:auth|permission|credential|secret|payment|migration)/i.test(f)),reason:'基于本次启动快照独立检查；既有未提交变更未计入本次贡献。'});
 }catch(error){
  if(error?.unsettled)unsettled=true;
  if(createdEvidence){try{removeCreatedEvidence();}catch{unsettled=true;}}
  const text=String(error?.message||''),reason=['EPERM','EACCES','ENOENT'].includes(error?.code)?'FILE_ACCESS_UNAVAILABLE':text==='Git observation unavailable'?'GIT_UNAVAILABLE':text==='Project root must be repository root'?'NOT_REPOSITORY_ROOT':/limit|too large/.test(text)?'EVIDENCE_LIMIT':text==='Hidden index entries'?'HIDDEN_INDEX':text==='Non-file entry'?'NON_FILE_INPUT':text==='Symlink path'?'SYMLINK_INPUT':text==='Git metadata symlink'?'GIT_METADATA_SYMLINK':text==='Linked Git worktree not supported'?'LINKED_WORKTREE':text.includes('Home/profile')?'UNSAFE_PROJECT_ROOT':'EVIDENCE_INVALID';
  if(p.phase==='baseline'&&!unsettled){await output({verified:true,project:{safeRoot,mode:'analysis-only',reason:'当前项目无法建立可靠自动验收（'+reason+'）；先只读分析，不会宣称代码任务完成。',checks:[],protectedFiles:[],inventory:[],root},baseline:null,observation:{phase:p.phase,reason}});return;}
  await output({verified:false,unsettled,observation:{phase:p.phase,reason},reason:'项目证据不完整或验收文件发生变化（'+reason+'），结果待验证。'});process.exitCode=1;
 }
}
const payload=JSON.parse(Buffer.from(process.argv[2],'base64').toString('utf8'));
await projectRunner(payload);
