#!/usr/bin/env node
/** Opt-in real Windows rc.2 shell verification in new temporary projects.
 * Loads no user profile, credentials, provider, model or Jev implementation. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';

assert.equal(process.platform,'win32','Run this opt-in check on Windows');
assert.ok(process.versions.electron,'Use the installed Electron executable in Node mode');
assert.ok(process.env.DSH_NODE_MODULES,'Set DSH_NODE_MODULES to an approved rc.2 installation');
const modules=path.resolve(process.env.DSH_NODE_MODULES);
const require=createRequire(pathToFileURL(path.join(modules,'..','package.json')));
const official=async name=>import(pathToFileURL(require.resolve('@deepseek-ai/'+name)));
assert.equal(JSON.parse(fs.readFileSync(path.join(modules,'@deepseek-ai/dsh/package.json'),'utf8')).version,'0.2.0-rc.2');
const home=fs.mkdtempSync(path.join(os.tmpdir(),'dsh-052-native-'));
const root=path.join(home,"项目 space '泰拉'"),plugin=path.join(home,"插件 package '泰拉'");
fs.mkdirSync(root);fs.mkdirSync(path.join(plugin,'src'),{recursive:true});
fs.writeFileSync(path.join(plugin,'package.json'),'{"type":"module"}');
// Copy the exact production entry files to exercise spaces, non-ASCII and apostrophes.
const production=path.resolve(fileURLToPath(new URL('../src',import.meta.url)));
for(const file of ['auto-verification.js','verification.js','host-adapter.js','verification-diagnostics.js','verifier-command.js','verification-project-runner.js','verification-host-runner.js'])fs.copyFileSync(path.join(production,file),path.join(plugin,'src',file));
const {createAutoVerifier}=await import(pathToFileURL(path.join(plugin,'src/auto-verification.js')));
const {createVerifier}=await import(pathToFileURL(path.join(plugin,'src/verification.js')));
const {verifierCommand}=await import(pathToFileURL(path.join(plugin,'src/verifier-command.js')));
for(const invalid of ['../arbitrary.js','file:///arbitrary.js','__proto__','constructor',new URL('file:///arbitrary.js'),null])assert.throws(()=>verifierCommand(invalid,{}),/fixed verifier entry/);

const env={};for(const name of ['SystemRoot','WINDIR','ComSpec','PATH','PATHEXT','TEMP','TMP'])if(process.env[name])env[name]=process.env[name];
Object.assign(env,{ELECTRON_RUN_AS_NODE:'1',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'NUL',GIT_TERMINAL_PROMPT:'0',GIT_AUTHOR_NAME:'Test Fixture',GIT_AUTHOR_EMAIL:'fixture@example.invalid',GIT_COMMITTER_NAME:'Test Fixture',GIT_COMMITTER_EMAIL:'fixture@example.invalid'});
function git(...args){const r=spawnSync('git',['-c','core.hooksPath=NUL',...args],{cwd:root,env,encoding:'utf8',windowsHide:true,timeout:10000});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
git('init');fs.mkdirSync(path.join(root,'src'));fs.mkdirSync(path.join(root,'test'));
const packageText=JSON.stringify({name:'isolated-verifier-fixture',type:'module',scripts:{test:'node --test test/fixture.test.mjs'}});
const testText='import {test} from "node:test";import assert from "node:assert/strict";import {value} from "../src/value.js";test("fixture runs under Electron Node",()=>{assert.ok(process.versions.electron);assert.ok(Number.isInteger(value)&&value>0);});\n';
fs.writeFileSync(path.join(root,'package.json'),packageText);
fs.writeFileSync(path.join(root,'test/fixture.test.mjs'),testText);
fs.writeFileSync(path.join(root,'src/value.js'),'export const value=1;\n');git('add','.');git('commit','-m','isolated fixture');

const {Context}=await official('cordis');
const {default:Subprocess}=await official('dsh-subprocess-local');
const {default:Bash}=await official('dsh-bash-local');
const {default:SystemPrompt}=await official('dsh-system-prompt');
const {ToolRuntime}=await official('dsh-tools');
const bashTool=await official('dsh-tool-bash');
const ctx=new Context(),forks=[ctx.plugin(Subprocess),ctx.plugin(Bash,{cwd:root,timeoutMs:30000,maxTimeoutMs:90000}),ctx.plugin(SystemPrompt),ctx.plugin(ToolRuntime,{mode:'native'})];
await Promise.all(forks);ctx.provide('shellEnv',{collect:()=>({})});
bashTool.apply(ctx,{enableRunInBackground:false,promoteOnTimeout:false});
const poisons=[],phases=[],baselineRefs=new Map();
let sequence=0;
const executeTool=async(_id,spec)=>{
  assert.equal(spec.name,'bash');assert.ok(spec.arguments.description.trim());
  assert.ok(spec.arguments.command.startsWith('ELECTRON_RUN_AS_NODE=1 '));
  const payload=JSON.parse(Buffer.from(spec.arguments.command.match(/'([A-Za-z0-9+/=]+)'$/)[1],'base64').toString('utf8'));
  const result=await ctx.tools.execute({callId:'isolated-'+(++sequence),...spec,signal:new AbortController().signal});
  assert.equal(result.isError,false,JSON.stringify(result));
  const value=result.value;
  assert.equal(value.kind,'foreground');assert.equal(value.signal,null);assert.equal(value.timedOut,false);assert.equal(value.aborted,false);
  let data;try{data=JSON.parse(value.stdout.text);}catch{throw Error('No verifier JSON; exit '+value.exitCode+' stderr '+value.stderr.text.slice(0,500));}
  if(data.baselineRef)baselineRefs.set(payload.runId,data.baselineRef);
  phases.push({runId:payload.runId,phase:payload.phase,exitCode:value.exitCode,verified:data.verified,observation:data.observation,checksPassed:data.checksPassed,protectedOk:data.protectedOk,sealed:data.sealed,evidenceExists:baselineRefs.has(payload.runId)?fs.existsSync(baselineRefs.get(payload.runId).path):undefined,hasStderrText:!!value.stderr.text});
  if(value.exitCode!==0)console.log('NATIVE NONZERO '+JSON.stringify(phases.at(-1)));
  return result;
};
const verifier=createAutoVerifier({poison:id=>poisons.push(id),executeTool});
const config={sessionId:'isolated-windows-fixture',verification:{profileId:'auto',scope:['workspace']}},signal=new AbortController().signal;
const collect=(runId,phase)=>verifier.collect({config,runId,round:phase==='baseline'?0:1,phase,signal});
async function release(runId){const ref=baselineRefs.get(runId);assert.ok(ref);await verifier.release(runId);assert.equal(phases.at(-1).phase,'cleanup');assert.equal(phases.at(-1).exitCode,0,JSON.stringify(phases.at(-1)));assert.equal(fs.existsSync(ref.path),false);}
try{
  for(let cycle=1;cycle<=2;cycle++){
    const runId='normal-'+cycle;
    const baseline=await collect(runId,'baseline');assert.equal(baseline.project.mode,'verified');
    fs.writeFileSync(path.join(root,'src/value.js'),'export const value='+(cycle+1)+';\n');
    const check=await collect(runId,'check');assert.equal(check.checksPassed,true);assert.equal(check.protectedOk,true);assert.equal(check.diffEmpty,false);assert.equal(check.checks.length,1);assert.equal(check.checks[0].exitCode,0);
    assert.equal((await collect(runId,'seal')).sealed,true);await release(runId);
  }
  console.log('PASS Windows native baseline/check/seal/cleanup twice; paths contain spaces, non-ASCII and apostrophes; test child confirms Electron Node mode');
  for(const [runId,file,altered]of [['changed-test','test/fixture.test.mjs',testText+'// edited acceptance\n'],['changed-config','package.json',JSON.stringify({scripts:{test:'node -e "process.exit(0)"'}})]]){
    await collect(runId,'baseline');const target=path.join(root,file),original=fs.readFileSync(target);
    try{fs.writeFileSync(target,altered);const result=await collect(runId,'check').catch(error=>{assert.equal(error.code,'VERIFICATION_INVALID');return {verified:false};});assert.notEqual(result.checksPassed,true);if(result.verified){assert.equal(result.protectedOk,false);assert.equal(result.checksRun,false);assert.equal(result.needsVerification,true);}}finally{fs.writeFileSync(target,original);await release(runId);}
  }
  console.log('PASS modified acceptance tests/configuration cannot become passing evidence');
  {
    const runId='changed-baseline';await collect(runId,'baseline');const file=baselineRefs.get(runId).path,original=fs.readFileSync(file);
    try{const tampered=JSON.parse(original);tampered.project.protectedFiles=[];fs.writeFileSync(file,JSON.stringify(tampered));await assert.rejects(collect(runId,'check'),error=>error.code==='VERIFICATION_INVALID');}finally{fs.writeFileSync(file,original);await release(runId);}
  }
  {
    const runId='stale-seal';await collect(runId,'baseline');assert.equal((await collect(runId,'check')).checksPassed,true);fs.appendFileSync(path.join(root,'src/value.js'),'// changed after check\n');await assert.rejects(collect(runId,'seal'),error=>error.code==='VERIFICATION_INVALID');await release(runId);
  }
  console.log('PASS changed baseline digest and stale completion seal are rejected');
  const legacy=createVerifier({profiles:[{id:'legacy',checks:[{id:'test',argv:[process.execPath,'--test','test/fixture.test.mjs'],timeoutMs:10000}],protectedPaths:['test','package.json']}],executeTool,poison:id=>poisons.push(id)});
  const legacyConfig={sessionId:config.sessionId,verification:{profileId:'legacy',scope:['src']}};
  const legacyCollect=phase=>legacy.collect({config:legacyConfig,runId:'legacy',round:phase==='baseline'?0:1,phase,signal});
  // The explicit-profile verifier requires a clean trusted repository at its baseline.
  git('add','.');git('commit','-m','fixture baseline after negative checks');
  await legacyCollect('baseline');fs.appendFileSync(path.join(root,'src/value.js'),'// legacy scoped change\n');
  const legacyCheck=await legacyCollect('check');assert.equal(legacyCheck.checksPassed,true);assert.equal(legacyCheck.protectedOk,true);
  assert.equal((await legacyCollect('seal')).sealed,true);await legacy.release('legacy');
  console.log('PASS legacy verifier baseline/check/seal with real rc.2 Windows native shell');
  assert.equal(poisons.length,0);
  console.log(JSON.stringify({platform:process.platform,electron:process.versions.electron,fixtureRoot:root,pluginRoot:plugin,nativeCalls:phases.length,phases,poisons:0,modelCalls:0,jevCalls:0,profileLoaded:false},null,2));
}finally{for(const fork of forks.reverse())await fork.dispose();}
