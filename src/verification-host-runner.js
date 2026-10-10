/** Fixed native-tool verifier entry point. Payload is data; no user executable input. */
async function hostVerifier(payload){
 const fs=await import('node:fs'),path=await import('node:path'),crypto=await import('node:crypto'),cp=await import('node:child_process');
 const root=fs.realpathSync(process.cwd());
 const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
 const relative=x=>typeof x==='string'&&x.split('/').every(p=>!!p&&p!=='.'&&p!=='..'&&/^[A-Za-z0-9_.-]+$/.test(p));
 const inside=(x,scope)=>scope.some(s=>x===s||x.startsWith(s+'/'));
 const env=Object.fromEntries(['PATH','HOME','TMPDIR','TEMP','TMP','SystemRoot','WINDIR','LANG'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));env.ELECTRON_RUN_AS_NODE='1';env.GIT_CONFIG_NOSYSTEM='1';env.GIT_TERMINAL_PROMPT='0';env.GIT_CONFIG_GLOBAL='/dev/null';let unsettled=false;
 const run=(argv,timeoutMs)=>{const p=cp.spawnSync(argv[0],argv.slice(1),{cwd:root,windowsHide:true,encoding:'utf8',timeout:timeoutMs,maxBuffer:1024*1024,env,killSignal:'SIGKILL'});if(p.signal||p.error?.code==='ETIMEDOUT')unsettled=true;return {code:p.status,signal:p.signal,error:!!p.error,timeout:p.error?.code==='ETIMEDOUT',text:(p.stdout||'')+(p.stderr||'')};};
 const git=(...args)=>{const p=run(['git','--no-optional-locks','-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null',...args],10000);if(p.code!==0||p.error||p.signal)throw Error('Git evidence unavailable');return p.text;};
 const checkedPath=name=>{if(!relative(name))throw Error('Unsafe repository path');let cur=root;for(const part of name.split('/')){cur=path.join(cur,part);try{if(fs.lstatSync(cur).isSymbolicLink())throw Error('Symlink path refused');}catch(e){if(e.code!=='ENOENT')throw e;}}return cur;};
 const protectedManifest=()=>{const manifest={};let count=0,total=0;const visit=(name)=>{const full=checkedPath(name);let s;try{s=fs.lstatSync(full);}catch(e){if(e.code==='ENOENT'){manifest[name]='MISSING';return;}throw e;}if(++count>20000)throw Error('Protection manifest exceeds limit');if(s.isDirectory()){for(const n of fs.readdirSync(full).sort())visit(name+'/'+n);}else if(s.isFile()){total+=s.size;if(total>67108864)throw Error('Protection manifest exceeds byte limit');manifest[name]=hash(fs.readFileSync(full));}else throw Error('Unsupported protected file');};for(const name of payload.profile.protectedPaths)visit(name);return manifest;};
 const tree=()=>{const insideHashes={},outside=[],meta=[];let count=0,bytes=0;const walk=(dir,rel='')=>{for(const n of fs.readdirSync(dir).sort()){const name=rel?rel+'/'+n:n;if(name==='.git')continue;const full=path.join(dir,n),st=fs.lstatSync(full);if(++count>50000)throw Error('Workspace file limit');if(st.isDirectory()){const v='directory:'+st.mode;if(inside(name,payload.scope))insideHashes[name]=v;else outside.push([name,v]);walk(full,name);continue;}let value;if(st.isSymbolicLink())value='link:'+fs.readlinkSync(full);else if(st.isFile()){bytes+=st.size;if(bytes>268435456)throw Error('Workspace byte limit');value=hash(fs.readFileSync(full));}else throw Error('Special file');value=st.mode+':'+value;if(inside(name,payload.scope)){if(!relative(name)||Object.keys(insideHashes).length>=256)throw Error('Scope file limit');insideHashes[name]=value;}else outside.push([name,value]);}};walk(root);
 const gitRoot=path.join(root,'.git');if(!fs.lstatSync(gitRoot).isDirectory()||fs.lstatSync(gitRoot).isSymbolicLink())throw Error('Linked worktree unsupported');
 const walkGit=(dir,rel='')=>{for(const n of fs.readdirSync(dir).sort()){const name=rel?rel+'/'+n:n;if(name==='objects'||name==='logs')continue;const full=path.join(dir,n),st=fs.lstatSync(full);if(st.isSymbolicLink())throw Error('Git symlink refused');if(st.isDirectory()){meta.push([name,'directory:'+st.mode]);walkGit(full,name);}else if(st.isFile()){if(st.size>8388608)throw Error('Git metadata too large');meta.push([name,st.mode+':'+hash(fs.readFileSync(full))]);}else throw Error('Git metadata type');}};walkGit(gitRoot);
 return {inside:insideHashes,outsideHash:hash(JSON.stringify(outside)),gitIntegrity:hash(JSON.stringify(meta))};};
 try{
  if(fs.realpathSync(git('rev-parse','--show-toplevel').trim())!==root)throw Error('Run from repository root only');
  for(const s of payload.scope)checkedPath(s);
  const head=git('rev-parse','HEAD').trim();
  if(git('ls-files','-v').split('\n').some(line=>line&&(/^[a-zS]/.test(line))))throw Error('Hidden index entries refused');
  const names=()=>[...new Set([...git('diff','--no-ext-diff','--no-textconv','--name-only','--no-renames','-z',head).split('\0'),...git('ls-files','--others','--exclude-standard','-z').split('\0')].filter(Boolean))].sort();
  let files=names();for(const f of files)checkedPath(f);
  let protection=protectedManifest();const currentTree=tree();
  if(payload.phase==='baseline'){
   if(files.length)throw Error('Workspace must have a clean Git baseline before running');
   process.stdout.write(JSON.stringify({runId:payload.runId,round:0,nonce:payload.nonce,head,protection:hash(JSON.stringify(protection)),tree:currentTree,clean:true}));return;
  }
  if(payload.baseline.head!==head)throw Error('Repository HEAD changed during run');
  const protectedOk=hash(JSON.stringify(protection))===payload.baseline.protection;
  if(currentTree.gitIntegrity!==payload.baseline.tree.gitIntegrity)throw Error('Git metadata changed');
  if(currentTree.outsideHash!==payload.baseline.tree.outsideHash)throw Error('Files outside approved scope changed');
  if(!protectedOk)throw Error('Protected tests or configuration changed; human review required');
  if(payload.phase==='seal'){if(hash(JSON.stringify(currentTree))!==payload.expectedFingerprint)throw Error('Evidence became stale');process.stdout.write(JSON.stringify({runId:payload.runId,round:payload.round,nonce:payload.nonce,verified:true,sealed:true,reason:'Current tree still matches verified round'}));return;}
  const checks=payload.profile.checks.map(c=>{const r=run(c.argv,c.timeoutMs);return {id:c.id,exitCode:r.code,passed:r.code===0&&!r.signal&&!r.error,timeout:r.timeout,unsettled:!!r.signal||r.timeout,tail:r.text.slice(-700)};});
  const finalTree=tree();if(finalTree.outsideHash!==payload.baseline.tree.outsideHash||finalTree.gitIntegrity!==payload.baseline.tree.gitIntegrity)throw Error('Verification changed out-of-scope evidence');
  files=[...new Set([...Object.keys(payload.baseline.tree.inside),...Object.keys(finalTree.inside)])].filter(f=>payload.baseline.tree.inside[f]!==finalTree.inside[f]);for(const f of files)checkedPath(f);
  if(git('rev-parse','HEAD').trim()!==head||JSON.stringify(protectedManifest())!==JSON.stringify(protection))throw Error('Verification changed protected evidence');
  const outside=files.filter(f=>!inside(f,payload.scope));
  const diff=git('diff','--no-ext-diff','--no-textconv','--stat',head);
  const fingerprint=hash(JSON.stringify(finalTree));
  process.stdout.write(JSON.stringify({runId:payload.runId,round:payload.round,nonce:payload.nonce,head,checks,files,outside,protectedOk,scopeOk:outside.length===0,checksRun:checks.length>0,checksFailed:checks.filter(c=>!c.passed).length,checksPassed:checks.length>0&&checks.every(c=>c.passed),diffAvailable:true,diffEmpty:files.length===0,expectsChanges:payload.profile.expectsChanges,securityChanged:files.some(f=>/(^|\/)(auth|permission|credential|secret|payment|migration|\.env)/i.test(f)),diffStat:(diff+'\n'+files.filter(f=>!diff.includes(f)).map(f=>f+' (changed/new)').join('\n')).slice(0,1500),checkSummary:checks.map(c=>c.id+': exit '+c.exitCode+'\n'+c.tail).join('\n').slice(-2500),fingerprint,verified:true,reason:'Independent native host checks, diff and scope collected'}));
 }catch{process.stdout.write(JSON.stringify({runId:payload.runId,round:payload.round,nonce:payload.nonce,verified:false,unsettled,reason:'独立验证无法确认：需要干净 Git 基线、有效路径及未变动的受保护测试/配置。'}));process.exitCode=1;}
}
const payload=JSON.parse(Buffer.from(process.argv[2],'base64').toString('utf8'));
await hostVerifier(payload);
