#!/usr/bin/env node
/** Exact generated command, synthetic fixed runner, real installed PowerShell.
 * Linux proves text/exit semantics only; Windows GUI acceptance must run this
 * using the actual packaged Electron executable in Node mode with --windows-native.
 * No DSH profile, credentials, network, model or Jev is loaded.
 */
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, access, rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
if(process.argv.includes('--windows-native')){
 assert.equal(process.platform,'win32');assert.ok(process.versions.electron,'Use the actual packaged Electron runtime');
}
const pwsh=process.env.DSH_PWSH_PATH;
assert.ok(pwsh&&path.isAbsolute(pwsh),'Set DSH_PWSH_PATH to an already-approved installed PowerShell executable.');
const root=await mkdtemp(path.join(tmpdir(),"dsh-pwsh-output '泰拉' "));
const env=Object.fromEntries(['PATH','PATHEXT','SystemRoot','WINDIR','LANG'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
Object.assign(env,{HOME:path.join(root,'home'),USERPROFILE:path.join(root,'home'),TMPDIR:root,TEMP:root,TMP:root,POWERSHELL_TELEMETRY_OPTOUT:'1',POWERSHELL_UPDATECHECK:'Off'});
const results=[];let complete=false;
try{
 await mkdir(env.HOME);await writeFile(path.join(root,'package.json'),'{"type":"module"}\n');
 await writeFile(path.join(root,'verifier-command.js'),await readFile(new URL('../src/verifier-command.js',import.meta.url)));
 await writeFile(path.join(root,'verification-project-runner.js'),`import {writeFileSync} from 'node:fs';
const p=JSON.parse(Buffer.from(process.argv[2],'base64').toString('utf8'));
await new Promise(r=>setTimeout(r,p.delayMs));
process.stdout.write(JSON.stringify({nonce:p.nonce,unicode:p.unicode,long:'x'.repeat(4096),electron:process.versions.electron||null}));
process.stderr.write('synthetic-stderr\\n');
writeFileSync(p.marker,'completed');process.exitCode=p.exitCode;
`);
 const {verifierCommand}=await import(pathToFileURL(path.join(root,'verifier-command.js')));
 const version=spawnSync(pwsh,['-NoLogo','-NoProfile','-NonInteractive','-Command','$PSVersionTable.PSVersion.ToString()'],{env,encoding:'utf8',timeout:10000});
 assert.equal(version.status,0,version.stderr);
 for(const exitCode of [0,7]){
  const payload={nonce:randomUUID(),unicode:"你好 '泰拉' $ \" ;",delayMs:180,exitCode,marker:path.join(root,'completed-'+exitCode)};
  const command=verifierCommand('project',payload,'pwsh'),begin=performance.now();
  const result=spawnSync(pwsh,['-NoLogo','-NoProfile','-NonInteractive','-Command',"[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new($false); $OutputEncoding=[System.Text.UTF8Encoding]::new($false); "+command],{cwd:root,env,encoding:'utf8',timeout:10000});
  assert.ifError(result.error);assert.equal(result.signal,null);assert.equal(result.status,exitCode,result.stderr);
  const data=JSON.parse(result.stdout);assert.equal(data.nonce,payload.nonce);assert.equal(data.unicode,payload.unicode);assert.equal(data.long,'x'.repeat(4096));assert.equal(result.stderr.trim(),'synthetic-stderr');
  const elapsedMs=Math.round(performance.now()-begin);assert.ok(elapsedMs>=payload.delayMs);await access(payload.marker);
  if(process.argv.includes('--windows-native'))assert.ok(data.electron);
  results.push({exitCode,elapsedMs,jsonComplete:true,completionMarker:true,stdoutPreserved:true,stderrSeparate:true});
 }
 complete=true;
 console.log(JSON.stringify({passed:true,platform:process.platform,electron:process.versions.electron||null,pwshVersion:version.stdout.trim(),windowsGuiAcceptance:process.platform==='win32'&&!!process.versions.electron,syntheticRunner:true,results}));
}finally{if(complete)await rm(root,{recursive:true,force:true});}
