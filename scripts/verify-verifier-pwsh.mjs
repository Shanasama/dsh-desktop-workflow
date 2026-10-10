#!/usr/bin/env node
/**
 * Real PowerShell acceptance through official rc.2 ToolRuntime, tool-pwsh,
 * pwsh-local and subprocess-local. No shell stub or bash fallback is permitted.
 *
 * DSH_NODE_MODULES must point to an existing approved official installation.
 * DSH_PWSH_PATH optionally selects an existing PowerShell executable. This
 * script does not download or install anything. Use --not-started-only to run
 * the actual ToolRuntime's zero-process negative controls without PowerShell.
 *
 * Linux/macOS results prove PowerShell compatibility only. Windows-native
 * acceptance additionally requires Electron via verify-verifier-windows.mjs.
 * The harness re-executes under an allowlisted environment and an empty home;
 * it never loads a DSH profile, provider, credentials, model or Jev plugin.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';

const self=fileURLToPath(import.meta.url);
const source=path.resolve(fileURLToPath(new URL('../src',import.meta.url)));
const runtimeVersion='0.2.0-rc.2';

export async function runPwshAcceptance({requireWindows=false}={}){
  if(requireWindows){
    assert.equal(process.platform,'win32','Windows-native acceptance must run on Windows');
    assert.ok(process.versions.electron,'Windows-native acceptance requires the installed Electron executable in Node mode');
  }
  assert.ok(process.env.DSH_NODE_MODULES,'Set DSH_NODE_MODULES to an existing approved official rc.2 installation');
  const modules=path.resolve(process.env.DSH_NODE_MODULES);
  const notStartedOnly=process.argv.includes('--not-started-only');
  if(!process.env.DSH_ACCEPTANCE_HOME){
    const home=fs.mkdtempSync(path.join(os.tmpdir(),'dsh-054-pwsh-'));
    const userHome=path.join(home,'empty-home'),temp=path.join(home,'temp');
    fs.mkdirSync(userHome);fs.mkdirSync(temp);
    const env={};
    // NODE_OPTIONS, provider keys, DSH profile paths, git credential settings,
    // and all other inherited variables are intentionally absent in the child.
    for(const key of ['PATH','PATHEXT','SystemRoot','WINDIR','ComSpec','ProgramFiles','ProgramFiles(x86)','LANG','LC_ALL']){
      if(process.env[key])env[key]=process.env[key];
    }
    Object.assign(env,{
      HOME:userHome,USERPROFILE:userHome,XDG_CONFIG_HOME:path.join(userHome,'.config'),
      APPDATA:path.join(userHome,'AppData','Roaming'),LOCALAPPDATA:path.join(userHome,'AppData','Local'),
      TMPDIR:temp,TEMP:temp,TMP:temp,DSH_NODE_MODULES:modules,DSH_ACCEPTANCE_HOME:home,
      ELECTRON_RUN_AS_NODE:'1',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:os.devNull,
      GIT_TERMINAL_PROMPT:'0',GIT_AUTHOR_NAME:'Test Fixture',GIT_AUTHOR_EMAIL:'fixture@example.invalid',
      GIT_COMMITTER_NAME:'Test Fixture',GIT_COMMITTER_EMAIL:'fixture@example.invalid',
      POWERSHELL_TELEMETRY_OPTOUT:'1',POWERSHELL_UPDATECHECK:'Off',DOTNET_CLI_TELEMETRY_OPTOUT:'1',
    });
    if(process.env.DSH_PWSH_PATH)env.DSH_PWSH_PATH=process.env.DSH_PWSH_PATH;
    const result=spawnSync(process.execPath,['--expose-internals',self,...(requireWindows?['--windows-native']:[]),...(notStartedOnly?['--not-started-only']:[])],{
      env,stdio:'inherit',windowsHide:true,timeout:600000,
    });
    // Preserve failed fixtures for diagnosis; successful fixtures contain no
    // user files and can be removed after all provider processes have settled.
    if(result.error)throw result.error;
    if(result.status!==0)throw Error(`PowerShell acceptance failed (exit ${result.status}, signal ${result.signal}); isolated fixture: ${home}`);
    fs.rmSync(home,{recursive:true,force:true});
    return;
  }

  const home=fs.realpathSync(process.env.DSH_ACCEPTANCE_HOME);
  const require=createRequire(pathToFileURL(path.join(modules,'..','package.json')));
  const official=async name=>{
    const full='@deepseek-ai/'+name;
    if(name.startsWith('dsh-'))assert.equal(JSON.parse(fs.readFileSync(require.resolve(full+'/package.json'),'utf8')).version,runtimeVersion,`${full} version`);
    return import(pathToFileURL(require.resolve(full)));
  };
  assert.equal(JSON.parse(fs.readFileSync(path.join(modules,'@deepseek-ai/dsh/package.json'),'utf8')).version,runtimeVersion);
  const {Context}=await official('cordis');
  const {AgentRegistry}=await official('dsh-agent');
  const {createScope}=await official('dsh-scope');
  const {default:Subprocess}=await official('dsh-subprocess-local');
  const {default:Pwsh,resolvePwshPath}=await official('dsh-pwsh-local');
  const {default:SystemPrompt}=await official('dsh-system-prompt');
  const {ToolRuntime,TOOL_ABORTED_BEFORE_DISPATCH}=await official('dsh-tools');
  const pwshTool=await official('dsh-tool-pwsh');
  assert.equal(TOOL_ABORTED_BEFORE_DISPATCH,'ABORTED_BEFORE_DISPATCH');
  const pwshPath=resolvePwshPath(process.env.DSH_PWSH_PATH);
  let pwshVersion;
  if(!notStartedOnly){
    const probe=spawnSync(pwshPath,['-NoLogo','-NoProfile','-NonInteractive','-Command','$PSVersionTable.PSVersion.ToString()'],{
      env:process.env,encoding:'utf8',windowsHide:true,timeout:30000,
    });
    if(probe.error?.code==='ENOENT')throw Error('PowerShell is unavailable. Supply an already installed pwsh through PATH or DSH_PWSH_PATH. No test shell has started; nothing was installed.');
    assert.ifError(probe.error);assert.equal(probe.status,0,probe.stderr);pwshVersion=probe.stdout.trim();assert.match(pwshVersion,/^\d+\.\d+\.\d+/);
  }

  const root=path.join(home,"项目 space '泰拉'"),plugin=path.join(home,"插件 package '泰拉'");
  fs.mkdirSync(root);fs.mkdirSync(path.join(plugin,'src'),{recursive:true});
  fs.writeFileSync(path.join(plugin,'package.json'),' {"type":"module"}\n');
  fs.symlinkSync(modules,path.join(plugin,'node_modules'),process.platform==='win32'?'junction':'dir');
  // Import a byte-identical copy so the production runner entry itself has
  // spaces, non-ASCII characters and an apostrophe in its absolute path.
  for(const name of ['auto-verification.js','verification.js','host-adapter.js','production-budget.js','verification-diagnostics.js','verifier-command.js','verification-project-runner.js','verification-host-runner.js']){
    fs.copyFileSync(path.join(source,name),path.join(plugin,'src',name));
    assert.deepEqual(fs.readFileSync(path.join(source,name)),fs.readFileSync(path.join(plugin,'src',name)));
  }
  const {createAutoVerifier}=await import(pathToFileURL(path.join(plugin,'src/auto-verification.js')));
  const {createVerifier}=await import(pathToFileURL(path.join(plugin,'src/verification.js')));
  const {createExecutionAdapter}=await import(pathToFileURL(path.join(plugin,'src/host-adapter.js')));
  const {verifierCommand}=await import(pathToFileURL(path.join(plugin,'src/verifier-command.js')));
  for(const entry of ['../arbitrary.js','file:///arbitrary.js','__proto__','constructor',new URL('file:///arbitrary.js'),null])assert.throws(()=>verifierCommand(entry,{},'pwsh'),/fixed verifier entry/);
  for(const shell of ['cmd','__proto__','constructor',null,{}])assert.throws(()=>verifierCommand('project',{},shell),/fixed verifier shell/);
  const marker=path.join(home,'PROFILE_MUST_NOT_LOAD');
  const fakeProfile=`[System.IO.File]::WriteAllText('${marker.replaceAll("'","''")}','loaded')\nthrow 'Acceptance must use NoProfile'\n`;
  for(const dir of [path.join(process.env.HOME,'.config','powershell'),path.join(process.env.HOME,'Documents','PowerShell'),path.join(process.env.HOME,'Documents','WindowsPowerShell')]){
    fs.mkdirSync(dir,{recursive:true});
    for(const name of ['profile.ps1','Microsoft.PowerShell_profile.ps1'])fs.writeFileSync(path.join(dir,name),fakeProfile);
  }

  const git=(...args)=>{
    const result=spawnSync('git',['-c','core.hooksPath='+os.devNull,...args],{cwd:root,env:process.env,encoding:'utf8',windowsHide:true,timeout:10000});
    assert.ifError(result.error);assert.equal(result.status,0,result.stderr);return result.stdout.trim();
  };
  git('init');fs.mkdirSync(path.join(root,'src'));fs.mkdirSync(path.join(root,'test'));
  const packageText=JSON.stringify({name:'isolated-verifier-fixture',type:'module',scripts:{test:'node --test test/fixture.test.mjs'}});
  const testText=`import {test} from 'node:test';import assert from 'node:assert/strict';import {value} from '../src/value.js';test('isolated verifier fixture',()=>{assert.ok(Number.isInteger(value)&&value>0);${requireWindows?"assert.ok(process.versions.electron,'child must be Electron in Node mode');":''}assert.equal(process.env.OPENAI_API_KEY,undefined);assert.equal(process.env.DEEPSEEK_API_KEY,undefined);});\n`;
  fs.writeFileSync(path.join(root,'package.json'),packageText);
  fs.writeFileSync(path.join(root,'test/fixture.test.mjs'),testText);
  fs.writeFileSync(path.join(root,'src/value.js'),'export const value=1;\n');git('add','.');git('commit','-m','isolated fixture');

  const ctx=new Context();
  const forks=[ctx.plugin(AgentRegistry),ctx.plugin(Subprocess),ctx.plugin(Pwsh,{cwd:root,pwshPath,timeoutMs:30000,maxTimeoutMs:90000}),ctx.plugin(SystemPrompt),ctx.plugin(ToolRuntime,{mode:'native'})];
  await Promise.all(forks);
  ctx.provide('shellEnv',{collect:()=>({})});
  pwshTool.apply(ctx,{enableRunInBackground:false,promoteOnTimeout:false});
  ctx.provide('sandboxPolicy',{resolve:()=>({mode:'workspace-write',workspaceRoot:root})});
  let modelCalls=0;
  ctx.provide('subagents',{getProvider:()=>({capabilities:{agentOptions:true,outputSchema:true,persona:true,depthLimit:true}}),resolveMaxDepth:()=>1,start(){modelCalls++;throw Error('A model or child must never start in this acceptance harness');}});
  const parent={id:'isolated-pwsh-fixture',status:'idle',session:{id:'isolated-pwsh-fixture',header:{cwd:root}}};
  const scope=createScope(ctx,parent);parent.ctx=scope.ctx;
  const detach=ctx.agents.enter(parent);await ctx.agents.announce(parent,'startup');
  const poisons=[],phases=[],starts=[],notStarted=[];let sequence=0;
  const adapter=createExecutionAdapter(ctx,{onCleanupFailed:(id,source,diagnostic)=>poisons.push({id,source,diagnostic})});
  const originalSpawn=ctx.subprocess.spawn;
  ctx.subprocess.spawn=function(spec){
    assert.equal(spec.argv[0],pwshPath,'The actual subprocess must use the selected PowerShell executable');
    assert.deepEqual(spec.argv.slice(1,5),['-NoLogo','-NoProfile','-NonInteractive','-Command']);
    assert.equal(spec.cwd,root);
    starts.push({executable:spec.argv[0],noProfile:true});
    return originalSpawn.call(this,spec);
  };
  const baselineRefs=new Map();
  const payloadOf=command=>{
    const encoded=command.match(/'([A-Za-z0-9+/=]+)'$/)?.[1];assert.ok(encoded,'Generated verifier payload');
    return JSON.parse(Buffer.from(encoded,'base64').toString('utf8'));
  };
  const executeTool=async(id,spec,signal,options)=>{
    assert.equal(spec.name,'bash','The adapter must resolve the production capability request to pwsh');
    assert.ok(spec.arguments.description.trim());
    assert.match(spec.arguments.command,process.versions.electron?/^\$env:ELECTRON_RUN_AS_NODE='1'; & '/:/^& '/);
    assert.ok(spec.arguments.command.includes("''泰拉''"),'PowerShell apostrophes must be doubled');
    const payload=payloadOf(spec.arguments.command),before=starts.length;
    const result=await adapter.executeTool(id,spec,signal,options);
    assert.equal(result.isError,false,JSON.stringify(result));
    assert.equal(starts.length,before+1,'Exactly one real PowerShell process per verifier phase');
    const value=result.value;
    assert.equal(value.kind,'foreground');assert.equal(value.signal,null);assert.equal(value.timedOut,false);assert.equal(value.aborted,false);
    assert.equal(value.stdout.truncated,false);assert.equal(value.stderr.truncated,false);
    const record={runId:payload.runId,phase:payload.phase,exitCode:value.exitCode,hasStderrText:!!value.stderr.text};
    phases.push(record);
    let data;try{data=JSON.parse(value.stdout.text);}catch{
      record.stdoutParsed=false;console.log('PWSH INVALID OUTPUT '+JSON.stringify(record));
      throw Error(`Missing verifier JSON (exit ${value.exitCode}): ${value.stderr.text.slice(0,500)}`);
    }
    if(data.baselineRef)baselineRefs.set(payload.runId,data.baselineRef);
    Object.assign(record,{stdoutParsed:true,verified:data.verified,observation:data.observation,checksPassed:data.checksPassed,protectedOk:data.protectedOk,sealed:data.sealed,evidenceExists:baselineRefs.has(payload.runId)?fs.existsSync(baselineRefs.get(payload.runId).path):undefined});
    if(value.exitCode!==0)console.log('PWSH NONZERO '+JSON.stringify(record));
    return result;
  };
  const signal=new AbortController().signal;
  const config={sessionId:parent.id,verification:{profileId:'auto',scope:['workspace']}};
  const legacyProfile={id:'legacy',checks:[{id:'test',argv:[process.execPath,'--test','test/fixture.test.mjs'],timeoutMs:10000}],protectedPaths:['test','package.json']};
  const legacyConfig={sessionId:parent.id,verification:{profileId:'legacy',scope:['src']}};
  const shellName=id=>adapter.shellName(id);
  const poison=id=>adapter.poison(id);
  const auto=createAutoVerifier({executeTool,shellName,poison});
  const collect=(runId,phase)=>auto.collect({config,runId,round:phase==='baseline'?0:1,phase,signal});
  const begin=()=>adapter.beginSession(parent.id,adapter.context(parent.id).contextKey);
  const release=async runId=>{
    const ref=baselineRefs.get(runId);assert.ok(ref);
    const result=await auto.release(runId);assert.equal(result.settled,true);
    assert.equal(phases.at(-1).phase,'cleanup');assert.equal(phases.at(-1).exitCode,0);
    assert.equal(fs.existsSync(ref.path),false);assert.equal(fs.existsSync(path.dirname(ref.path)),false);
  };
  try{
    assert.equal(ctx.tools.get('bash',parent),undefined,'No bash tool or fallback may be mounted');
    assert.ok(ctx.tools.get('pwsh',parent));assert.equal(shellName(parent.id),'pwsh');
    // These failures come from the real runtime, not hand-authored error DTOs.
    // Each verifier must remain usable afterward, without poisoning cleanup.
    for(const code of ['INVALID_ARGS','UNKNOWN_TOOL',TOOL_ABORTED_BEFORE_DISPATCH]){
      for(const kind of ['auto','legacy']){
        begin();const before=starts.length;
        const rejectedExecution=async(id,spec,abort,options)=>{
          let result;
          if(code==='INVALID_ARGS'){
            const args={...spec.arguments};delete args.description;
            result=await adapter.executeTool(id,{...spec,arguments:args},abort,options);
            assert.notEqual(result.verificationNotDispatched,true,'INVALID_ARGS is observed after dispatch but still before a shell process');
          }else{
            const controller=new AbortController();if(code===TOOL_ABORTED_BEFORE_DISPATCH)controller.abort();
            result=await ctx.tools.execute({callId:'negative-'+(++sequence),name:code==='UNKNOWN_TOOL'?'missing-verifier-fixture':'pwsh',arguments:spec.arguments,signal:controller.signal});
          }
          assert.equal(result.isError,true);assert.equal(result.error?.code||result.error?.info?.code,code);return result;
        };
        const verifier=kind==='auto'?createAutoVerifier({executeTool:rejectedExecution,shellName,poison}):createVerifier({profiles:[legacyProfile],executeTool:rejectedExecution,shellName,poison});
        await assert.rejects(verifier.collect({config:kind==='auto'?config:legacyConfig,runId:'not-started-'+kind+'-'+code,round:0,phase:'baseline',signal}),error=>error.code==='VERIFICATION_DENIED');
        assert.equal(starts.length,before,'A not-started failure must start zero PowerShell processes');assert.equal(poisons.length,0);
        adapter.releaseSession(parent.id);notStarted.push({verifier:kind,code,processStarts:0});
      }
    }
    console.log('PASS real rc.2 UNKNOWN_TOOL / INVALID_ARGS / ABORTED_BEFORE_DISPATCH for auto and legacy; zero shell starts, no poison, subsequent sessions admitted');
    if(notStartedOnly){
      console.log(JSON.stringify({mode:'not-started-only',runtime:runtimeVersion,platform:process.platform,notStarted,pwshProcesses:starts.length,modelCalls,jevCalls:0,profileLoaded:false},null,2));
      return;
    }
    for(let cycle=1;cycle<=2;cycle++){
      begin();const runId='normal-'+cycle,before=starts.length;
      const baseline=await collect(runId,'baseline');assert.equal(baseline.project.mode,'verified');
      assert.equal(baseline.project.root,fs.realpathSync(root));
      fs.writeFileSync(path.join(root,'src/value.js'),`export const value=${cycle+1};\n`);
      const check=await collect(runId,'check');assert.equal(check.checksPassed,true);assert.equal(check.protectedOk,true);assert.equal(check.diffEmpty,false);assert.equal(check.checks.length,1);assert.equal(check.checks[0].exitCode,0);
      assert.equal((await collect(runId,'seal')).sealed,true);await release(runId);
      assert.equal(starts.length-before,4);assert.equal(poisons.length,0);adapter.releaseSession(parent.id);
    }
    console.log('PASS actual pwsh baseline/check/seal/cleanup twice; project and package paths contain spaces, Unicode and apostrophes');
    begin();
    for(const [runId,file,altered]of [['changed-test','test/fixture.test.mjs',testText+'// edited acceptance\n'],['changed-config','package.json',JSON.stringify({scripts:{test:'node -e "process.exit(0)"'}})]]){
      await collect(runId,'baseline');const target=path.join(root,file),original=fs.readFileSync(target);
      try{
        fs.writeFileSync(target,altered);const result=await collect(runId,'check').catch(error=>{assert.equal(error.code,'VERIFICATION_INVALID');return {verified:false};});
        assert.notEqual(result.checksPassed,true);
        if(result.verified){assert.equal(result.protectedOk,false);assert.equal(result.checksRun,false);assert.equal(result.needsVerification,true);}
      }finally{fs.writeFileSync(target,original);await release(runId);}
    }
    console.log('PASS modified acceptance tests and configuration cannot become passing evidence');
    {
      const runId='changed-baseline';await collect(runId,'baseline');const file=baselineRefs.get(runId).path,original=fs.readFileSync(file);
      try{const tampered=JSON.parse(original);tampered.project.protectedFiles=[];fs.writeFileSync(file,JSON.stringify(tampered));await assert.rejects(collect(runId,'check'),error=>error.code==='VERIFICATION_INVALID');}
      finally{fs.writeFileSync(file,original);await release(runId);}
    }
    {
      const runId='stale-seal';await collect(runId,'baseline');assert.equal((await collect(runId,'check')).checksPassed,true);
      fs.appendFileSync(path.join(root,'src/value.js'),'// changed after check\n');
      await assert.rejects(collect(runId,'seal'),error=>error.code==='VERIFICATION_INVALID');await release(runId);
    }
    console.log('PASS tampered baseline and stale completion seal rejected through real pwsh');
    {
      await collect('isolation-a','baseline');fs.appendFileSync(path.join(root,'src/value.js'),'// between baselines\n');await collect('isolation-b','baseline');
      const a=baselineRefs.get('isolation-a'),b=baselineRefs.get('isolation-b');assert.notEqual(a.path,b.path);assert.notEqual(a.digest,b.digest);
      const mismatch={runId:'isolation-a',round:1,nonce:'cross-run-negative',phase:'check',baselineRef:b};
      const rejected=await executeTool(parent.id,{name:'bash',arguments:{description:'Reject evidence from another isolated run',command:verifierCommand('project',mismatch,'pwsh'),timeoutMs:90000,run_in_background:false}},signal);
      assert.notEqual(rejected.value.exitCode,0);assert.equal(JSON.parse(rejected.value.stdout.text).verified,false);
      assert.equal((await collect('isolation-a','check')).diffEmpty,false);
      assert.equal((await collect('isolation-b','check')).diffEmpty,true);
      assert.equal((await collect('isolation-a','seal')).sealed,true);await release('isolation-a');
      assert.equal(fs.existsSync(b.path),true,'Releasing A must preserve B evidence');
      assert.equal((await collect('isolation-b','seal')).sealed,true);await release('isolation-b');
    }
    console.log('PASS two same-project runs have separate snapshots; foreign evidence rejected and cleanup isolated');
    adapter.releaseSession(parent.id);
    git('add','.');git('commit','-m','clean legacy fixture baseline');
    begin();
    const legacy=createVerifier({profiles:[legacyProfile],executeTool,shellName,poison});
    const legacyCollect=phase=>legacy.collect({config:legacyConfig,runId:'legacy',round:phase==='baseline'?0:1,phase,signal});
    await legacyCollect('baseline');fs.appendFileSync(path.join(root,'src/value.js'),'// legacy scoped change\n');
    const legacyCheck=await legacyCollect('check');assert.equal(legacyCheck.checksPassed,true);assert.equal(legacyCheck.protectedOk,true);
    assert.equal((await legacyCollect('seal')).sealed,true);await legacy.release('legacy');
    await assert.rejects(legacyCollect('check'),error=>error.code==='BASELINE_REQUIRED');
    adapter.releaseSession(parent.id);
    console.log('PASS legacy verifier baseline/check/seal and in-memory release through actual pwsh');
    assert.equal(poisons.length,0);assert.equal(modelCalls,0);assert.equal(fs.existsSync(marker),false);
    for(const ref of baselineRefs.values())assert.equal(fs.existsSync(ref.path),false,'No temporary evidence remains');
    const coverage=requireWindows?'Windows-native Electron + PowerShell':`${process.platform} PowerShell compatibility only; Windows-native acceptance NOT RUN`;
    console.log(JSON.stringify({coverage,runtime:runtimeVersion,platform:process.platform,electron:process.versions.electron||null,pwshVersion,pwshPath,pwshProcesses:starts.length,phases,notStarted,poisons:0,modelCalls,jevCalls:0,profileLoaded:false,credentialsLoaded:false,windowsSandboxTested:false},null,2));
  }finally{
    await adapter.dispose();detach();await scope.dispose();
    ctx.subprocess.spawn=originalSpawn;
    for(const fork of forks.reverse())await fork.dispose();
  }
}

if(process.argv[1]&&path.resolve(process.argv[1])===self)await runPwshAcceptance({requireWindows:process.argv.includes('--windows-native')});
