import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {verifierCommand} from '../src/verifier-command.js';

const runner=fileURLToPath(new URL('../src/verification-project-runner.js',import.meta.url));
const digest=raw=>createHash('sha256').update(raw).digest('hex');
const evidenceName=/^\.dsh-team-evidence-[a-f0-9]{32}$/;

function fixture(t,{testBody='',beforeCommit=()=>{}}={}){
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'dsh-evidence-regression-'));
 const root=path.join(parent,"project space 项目 'quoted'");fs.mkdirSync(root);
 t.after(()=>fs.rmSync(parent,{recursive:true,force:true}));
 const git=(...args)=>{
  const r=spawnSync('git',['-c','core.hooksPath=/dev/null','-c','commit.gpgsign=false','-c','user.name=Evidence Fixture','-c','user.email=evidence@example.invalid',...args],{cwd:root,encoding:'utf8',env:{...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'}});
  assert.equal(r.status,0,r.stderr);return r.stdout;
 };
 fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({private:true,type:'module',scripts:{test:'node --test value.test.mjs'}}));
 fs.writeFileSync(path.join(root,'value.mjs'),'export const answer = 41; // SOURCE_BODY_CANARY\n');
 fs.writeFileSync(path.join(root,'value.test.mjs'),`import test from 'node:test';import assert from 'node:assert/strict';import * as fs from 'node:fs';import path from 'node:path';import {answer} from './value.mjs';test('value is independently accepted',()=>{assert.equal(answer,42);${testBody}});\n`);
 beforeCommit(root);git('init','--quiet');git('add','.');git('commit','--quiet','-m','Initialize independent acceptance fixture');
 const runId=randomUUID();let ref,baseline;
 const invoke=(phase,overrides={},preload)=>{
  // Simulate native sandbox invocations having unrelated ephemeral temp roots.
  const temp=fs.mkdtempSync(path.join(parent,'invocation-tmp-'));
  const payload={phase,runId,round:phase==='baseline'?0:1,nonce:randomUUID(),baselineRef:ref,...overrides};
  const result=spawnSync(process.execPath,[...(preload?['--import',preload]:[]),runner,Buffer.from(JSON.stringify(payload)).toString('base64')],{cwd:root,encoding:'utf8',timeout:10000,maxBuffer:1048576,env:{...process.env,TMPDIR:temp,TEMP:temp,TMP:temp}});
  fs.rmSync(temp,{recursive:true,force:true});
  assert.equal(result.error,undefined,result.error?.message);assert.equal(result.stderr,'');
  const data=JSON.parse(result.stdout);assert.equal(data.nonce,payload.nonce);assert.equal(data.runId,payload.runId);assert.equal(data.round,payload.round);
  return {status:result.status,data,stdout:result.stdout,payload};
 };
 const start=()=>{const result=invoke('baseline');assert.equal(result.status,0);assert.equal(result.data.verified,true);assert.equal(result.data.project.mode,'verified');baseline=result.data;ref=baseline.baselineRef;return baseline;};
 const edit=()=>fs.writeFileSync(path.join(root,'value.mjs'),'export const answer = 42; // SOURCE_BODY_CANARY\n');
 return {parent,root,git,invoke,start,edit,get ref(){return ref;},get baseline(){return baseline;},get dir(){return path.dirname(ref.path);}};
}
function rejected(result){assert.equal(result.status,1);assert.equal(result.data.verified,false);assert.equal(result.data.checksPassed,undefined);assert.equal(result.data.sealed,undefined);assert.ok(result.data.observation.reason);}

test('workspace evidence survives ephemeral temp roots through baseline, edit, check, seal and exact cleanup',t=>{
 const f=fixture(t),b=f.start();
 assert.match(b.project.evidenceDirectory,evidenceName);
 assert.equal(path.relative(fs.realpathSync(f.root),f.dir),b.project.evidenceDirectory);
 assert.deepEqual(fs.readdirSync(f.dir),['state.json']);
 const raw=fs.readFileSync(f.ref.path);assert.equal(digest(raw),f.ref.digest);assert.ok(!raw.includes('SOURCE_BODY_CANARY'));
 assert.equal(b.baseline,undefined);assert.ok(!JSON.stringify(b).includes('gitHash'));
 assert.equal(b.project.inventory.some(name=>name.startsWith(b.project.evidenceDirectory+'/')),false);
 if(process.platform!=='win32'){assert.equal(fs.statSync(f.dir).mode&0o777,0o700);assert.equal(fs.statSync(f.ref.path).mode&0o777,0o600);}
 const command=verifierCommand('project',{phase:'check',runId:'fixture',nonce:'fixture',baselineRef:f.ref},'pwsh');
 assert.ok(command.length<4096);assert.ok(!command.includes('SOURCE_BODY_CANARY'));
 f.edit();const check=f.invoke('check');assert.equal(check.status,0);assert.equal(check.data.checksPassed,true);assert.equal(check.data.protectedOk,true);assert.equal(check.data.diffEmpty,false);assert.match(check.data.diffStat,/value\.mjs changed/);assert.ok(!check.data.diffStat.includes('evidence'));
 const seal=f.invoke('seal',{expectedFingerprint:check.data.fingerprint});assert.equal(seal.status,0);assert.equal(seal.data.sealed,true);
 const cleanup=f.invoke('cleanup');assert.equal(cleanup.status,0);assert.equal(cleanup.data.verified,true);assert.equal(fs.existsSync(f.dir),false);
 rejected(f.invoke('cleanup'));
});

test('evidence does not create a source diff; a later source edit invalidates the seal',t=>{
 const f=fixture(t);f.edit();f.start();const check=f.invoke('check');assert.equal(check.data.checksPassed,true);assert.equal(check.data.diffEmpty,true);
 fs.appendFileSync(path.join(f.root,'value.mjs'),'// after check\n');rejected(f.invoke('seal',{expectedFingerprint:check.data.fingerprint}));assert.equal(f.invoke('cleanup').status,0);
});

test('host-selected evidence directory is exact, validated, and exclusively created',t=>{
 const f=fixture(t),name='.dsh-team-evidence-'+randomUUID().replaceAll('-','');
 const result=f.invoke('baseline',{evidenceDirectory:name});assert.equal(result.status,0);assert.equal(result.data.project.evidenceDirectory,name);assert.equal(path.dirname(result.data.baselineRef.path),path.join(fs.realpathSync(f.root),name));
 const original=fs.readFileSync(result.data.baselineRef.path);
 const collision=f.invoke('baseline',{evidenceDirectory:name});assert.equal(collision.data.project.mode,'analysis-only');assert.deepEqual(fs.readFileSync(result.data.baselineRef.path),original);
 for(const invalid of ['../'+name,name+'/nested','.dsh-team-evidence-short',path.join(f.root,name),null,{}]){const invalidResult=f.invoke('baseline',{evidenceDirectory:invalid});assert.equal(invalidResult.data.project.mode,'analysis-only');assert.equal(invalidResult.data.baselineRef,undefined);}
 assert.deepEqual(fs.readdirSync(f.root).filter(n=>evidenceName.test(n)),[name]);
 assert.equal(f.invoke('cleanup',{baselineRef:result.data.baselineRef}).status,0);
});

for(const fault of ['partial-write','hardlink-after-write','extra-file-after-write'])test(`baseline ${fault} handles only its own artifact and reports uncertain cleanup`,t=>{
 const f=fixture(t),name='.dsh-team-evidence-'+randomUUID().replaceAll('-',''),preload=path.join(f.parent,'fault-injection.mjs');
 const mutation=fault==='partial-write'?'':fault==='hardlink-after-write'?"fs.linkSync(file,path.join(process.cwd(),'evidence-alias.json'));":"fs.writeFileSync(path.join(dir,'other.txt'),'must survive');";
 fs.writeFileSync(preload,`import fs from 'node:fs';import path from 'node:path';import {syncBuiltinESMExports} from 'node:module';const write=fs.writeFileSync;fs.writeFileSync=function(target,data,...rest){if(typeof target==='number'){const stored=JSON.parse(data),dir=path.join(process.cwd(),stored.project.evidenceDirectory),file=path.join(dir,'state.json');write.call(fs,target,${fault==='partial-write'?'data.slice(0,20)':'data'},...rest);${mutation}throw Object.assign(Error('Synthetic write failure'),{code:'EIO'});}return write.call(fs,target,data,...rest);};syncBuiltinESMExports();`);
 const result=f.invoke('baseline',{evidenceDirectory:name},preload);
 if(fault==='partial-write'){assert.equal(result.status,0);assert.equal(result.data.project.mode,'analysis-only');assert.equal(result.data.baselineRef,undefined);assert.equal(fs.existsSync(path.join(f.root,name)),false);}
 else{rejected(result);assert.equal(result.data.unsettled,true);assert.equal(fs.existsSync(path.join(f.root,name,'state.json')),true);if(fault==='extra-file-after-write')assert.equal(fs.readFileSync(path.join(f.root,name,'other.txt'),'utf8'),'must survive');}
});

test('only the registered state is excluded; preexisting and new same-prefix paths remain project inputs',t=>{
 const sibling='.dsh-team-evidence-'+ 'a'.repeat(32),f=fixture(t,{beforeCommit(root){fs.mkdirSync(path.join(root,sibling));fs.writeFileSync(path.join(root,sibling,'state.json'),'unrelated project input');}});
 f.edit();const b=f.start();assert.ok(b.project.inventory.includes(sibling+'/state.json'));
 fs.appendFileSync(path.join(f.root,sibling,'state.json'),' changed');
 const extra='.dsh-team-evidence-'+ 'b'.repeat(32);fs.mkdirSync(path.join(f.root,extra));fs.writeFileSync(path.join(f.root,extra,'state.json'),'new unrelated input');
 const check=f.invoke('check');assert.equal(check.data.checksPassed,true);assert.match(check.data.diffStat,new RegExp(sibling.replaceAll('.','\\.')+'/state\\.json'));assert.ok(check.data.diffStat.includes(extra+'/state.json'));
 assert.equal(f.invoke('cleanup').status,0);assert.equal(fs.existsSync(path.join(f.root,sibling,'state.json')),true);assert.equal(fs.existsSync(path.join(f.root,extra,'state.json')),true);
});

for(const mutation of ['bytes','run','root','registered-directory'])test(`evidence ${mutation} tampering rejects checks and cleanup without deleting state`,t=>{
 const f=fixture(t);f.start();f.edit();const original=fs.readFileSync(f.ref.path),stored=JSON.parse(original);
 if(mutation==='bytes')fs.appendFileSync(f.ref.path,' ');
 else{if(mutation==='run')stored.runId='another-run';if(mutation==='root')stored.project.root=f.parent;if(mutation==='registered-directory')stored.project.evidenceDirectory='.dsh-team-evidence-'+'c'.repeat(32);fs.writeFileSync(f.ref.path,JSON.stringify(stored));}
 rejected(f.invoke('check'));rejected(f.invoke('cleanup'));assert.equal(fs.existsSync(f.ref.path),true);
 // Even a separately recomputed digest cannot waive run/root/directory validation.
 if(mutation!=='bytes'){const forged={...f.ref,digest:digest(fs.readFileSync(f.ref.path))};rejected(f.invoke('check',{baselineRef:forged}));rejected(f.invoke('cleanup',{baselineRef:forged}));}
 fs.writeFileSync(f.ref.path,original);assert.equal(f.invoke('cleanup').status,0);
});

test('foreign runs, invalid ref shape, and evidence outside the canonical root are refused',t=>{
 const f=fixture(t);f.start();f.edit();
 rejected(f.invoke('check',{runId:'foreign-run'}));
 for(const baselineRef of [{...f.ref,digest:'0'.repeat(64)},{...f.ref,digest:'bad'},{...f.ref,path:path.relative(f.root,f.ref.path)},{...f.ref,path:path.join(f.parent,path.basename(f.dir),'state.json')},{...f.ref,path:path.join(f.dir,'other.json')},{...f.ref,path:path.join(f.root,'.dsh-team-evidence-invalid','state.json')}])rejected(f.invoke('check',{baselineRef}));
 const moved=path.join(f.parent,path.basename(f.dir));fs.renameSync(f.dir,moved);
 const escaped={...f.ref,path:path.join(moved,'state.json')};rejected(f.invoke('check',{baselineRef:escaped}));rejected(f.invoke('cleanup',{baselineRef:escaped}));assert.equal(fs.existsSync(escaped.path),true);
});

test('a valid digest cannot move evidence into another workspace',t=>{
 const a=fixture(t),b=fixture(t);a.start();b.start();const target=path.join(b.root,path.basename(a.dir));fs.cpSync(a.dir,target,{recursive:true});
 const ref={...a.ref,path:path.join(target,'state.json')};rejected(b.invoke('check',{runId:a.baseline.runId,baselineRef:ref}));rejected(b.invoke('cleanup',{runId:a.baseline.runId,baselineRef:ref}));assert.equal(fs.existsSync(ref.path),true);
});

for(const kind of ['file-symlink','directory-symlink','hardlink'])test(`evidence ${kind} rejects check, seal and cleanup`,t=>{
 const f=fixture(t);f.edit();f.start();const check=f.invoke('check');assert.equal(check.data.checksPassed,true);
 const target=path.join(f.parent,'preserved-evidence');
 if(kind==='directory-symlink'){fs.renameSync(f.dir,target);fs.symlinkSync(target,f.dir,process.platform==='win32'?'junction':'dir');}
 else if(kind==='file-symlink'){fs.renameSync(f.ref.path,target);fs.symlinkSync(target,f.ref.path,'file');}
 else fs.linkSync(f.ref.path,target);
 rejected(f.invoke('check'));rejected(f.invoke('seal',{expectedFingerprint:check.data.fingerprint}));rejected(f.invoke('cleanup'));assert.equal(fs.existsSync(target),true);assert.equal(fs.lstatSync(f.dir).isDirectory()||fs.lstatSync(f.dir).isSymbolicLink(),true);
});

for(const kind of ['extra-file','extra-directory','deleted-state','deleted-directory','oversized-state'])test(`evidence ${kind} remains fail-closed and cleanup never removes other content`,t=>{
 const f=fixture(t);f.start();f.edit();
 if(kind==='extra-file')fs.writeFileSync(path.join(f.dir,'keep.txt'),'must survive');
 if(kind==='extra-directory')fs.mkdirSync(path.join(f.dir,'keep'));
 if(kind==='deleted-state')fs.unlinkSync(f.ref.path);
 if(kind==='deleted-directory')fs.rmSync(f.dir,{recursive:true});
 if(kind==='oversized-state')fs.truncateSync(f.ref.path,16777217);
 rejected(f.invoke('check'));rejected(f.invoke('cleanup'));
 if(kind==='extra-file')assert.equal(fs.readFileSync(path.join(f.dir,'keep.txt'),'utf8'),'must survive');
 if(kind==='extra-directory')assert.equal(fs.statSync(path.join(f.dir,'keep')).isDirectory(),true);
 if(kind!=='deleted-directory')assert.equal(fs.existsSync(f.dir),true);
});

test('evidence permissions cannot silently become broadly readable', {skip:process.platform==='win32'},t=>{
 const f=fixture(t);f.start();fs.chmodSync(f.ref.path,0o644);rejected(f.invoke('check'));rejected(f.invoke('cleanup'));fs.chmodSync(f.ref.path,0o600);fs.chmodSync(f.dir,0o755);rejected(f.invoke('check'));rejected(f.invoke('cleanup'));fs.chmodSync(f.dir,0o700);assert.equal(f.invoke('cleanup').status,0);
});

for(const kind of ['bytes','extra','delete','hardlink'])test(`tests that mutate evidence (${kind}) cannot yield passing evidence`,t=>{
 const actions={bytes:"fs.appendFileSync(file,' ');",extra:"fs.writeFileSync(path.join(dir,'extra'),'must survive');",delete:'fs.unlinkSync(file);',hardlink:"fs.linkSync(file,path.join(process.cwd(),'evidence-alias.json'));"};
 const testBody=`const dir=fs.readdirSync(process.cwd()).find(n=>/^\\.dsh-team-evidence-[a-f0-9]{32}$/.test(n));assert.ok(dir);const file=path.join(dir,'state.json');${actions[kind]}`;
 const f=fixture(t,{testBody});f.start();f.edit();const result=f.invoke('check');rejected(result);assert.ok(!result.stdout.includes('SOURCE_BODY_CANARY'));rejected(f.invoke('cleanup'));
});

test('tests and configuration remain protected, and Git metadata changes invalidate evidence',t=>{
 const f=fixture(t);f.start();f.edit();const testFile=path.join(f.root,'value.test.mjs'),original=fs.readFileSync(testFile);fs.appendFileSync(testFile,'// changed acceptance\n');
 const changedTest=f.invoke('check');assert.equal(changedTest.status,0);assert.equal(changedTest.data.protectedOk,false);assert.equal(changedTest.data.checksPassed,false);assert.equal(changedTest.data.checksRun,false);
 fs.writeFileSync(testFile,original);fs.appendFileSync(path.join(f.root,'.git','config'),'\n[fixture]\n\tchanged = true\n');rejected(f.invoke('check'));assert.equal(f.invoke('cleanup').status,0);
});
