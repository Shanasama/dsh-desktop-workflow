#!/usr/bin/env node
/** Isolated official rc.2 acceptance. No user profile, GUI, provider or model calls. */
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,isAbsolute} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
const modules=process.env.DSH_NODE_MODULES;
if(!modules)throw Error('Set DSH_NODE_MODULES to the approved official rc.2 node_modules directory.');
const resolver=createRequire(pathToFileURL(join(resolve(modules),'..','package.json')));
const official=async name=>import(pathToFileURL(resolver.resolve('@deepseek-ai/'+name)));
const anchor=resolver.resolve('@deepseek-ai/dsh/package.json');
assert.equal(JSON.parse(await readFile(anchor,'utf8')).version,'0.2.0-rc.2');
const {Context}=await official('cordis');
const wait=async fn=>{for(let i=0;i<200;i++){const result=fn();if(result)return result;await new Promise(r=>setTimeout(r,10));}throw Error('Official fixture service did not become ready');};
const temp=await mkdtemp(join(tmpdir(),'dsh-v04-acceptance-'));
const results=[];
const pass=text=>{results.push(text);console.log('PASS '+text);};
try{
  // Browser drag/drop is not simulated: start at the actual attachment-store seam.
  const {LocalAttachmentStore}=await official('dsh-attachment-local');
  const {fileHandleText}=await official('dsh-llm');
  const {PluginManager}=await official('dsh-plugin-manager');
  const {Loader}=await official('cordis-plugin-loader');
  const {initProfile}=await official('dsh-app-boot');
  const pluginTool=await official('dsh-plugin-manager/tools');
  const packageDir=join(temp,'synthetic','package');await mkdir(packageDir,{recursive:true});
  const packageName='dsh-v04-safe-install-fixture';
  await writeFile(join(packageDir,'package.json'),JSON.stringify({name:packageName,version:'0.0.0',private:true,type:'module',dsh:{bundle:{patch:'./cordis.patch.yml'}}}));
  await writeFile(join(packageDir,'cordis.patch.yml'),'[]\n');
  const archive=join(temp,'safe-fixture.tgz');
  const tar=spawnSync('tar',['-czf',archive,'-C',join(temp,'synthetic'),'package']);assert.equal(tar.status,0);
  const root=new Context();const forks=[];
  try{
    forks.push(root.plugin(LocalAttachmentStore,{dshHome:join(temp,'attachment-home')}));
    await wait(()=>root.get('attachments'));
    const bytes=await readFile(archive);
    const ref=await root.attachments.saveFile({data:bytes,name:'safe-fixture.tgz'});
    const hostPath=root.attachments.fileHostPath(ref);
    assert.ok(isAbsolute(hostPath));assert.deepEqual(await readFile(hostPath),bytes);
    const handle=fileHandleText(ref,hostPath);assert.ok(handle.includes(hostPath));assert.match(handle,/read-only/);
    pass('official attachment store preserves tgz bytes and exposes the exact absolute read-only model handle');
    const profileDir=join(temp,'profile');initProfile(profileDir,[]);
    const cleanEnv={PATH:process.env.PATH,HOME:join(temp,'os-home'),DSH_HOME:join(temp,'home'),PNPM_HOME:join(temp,'pnpm'),XDG_CACHE_HOME:join(temp,'cache'),npm_config_ignore_scripts:'true',npm_config_cache:join(temp,'npm'),DSH_TELEMETRY_DISABLED:'1'};
    await mkdir(cleanEnv.HOME,{recursive:true});
    // The package manager subprocess is env -i; no inherited account/model credentials.
    root.provide('profileContext',{name:'v04-safe-install',dir:profileDir,patchPath:join(profileDir,'cordis.patch.yml'),installAnchor:anchor,cwd:temp,home:cleanEnv.DSH_HOME,startedBundles:[],overlays:[],telemetryDisabledEnv:'1',packageManager:{command:'/usr/bin/env',args:['-i',...Object.entries(cleanEnv).map(([k,v])=>`${k}=${v}`),'pnpm'],env:{}}});
    forks.push(root.plugin(Loader,{baseUrl:pathToFileURL(anchor).href}));
    forks.push(root.plugin(PluginManager,{}));
    await wait(()=>root.get('pluginManager'));
    let tool;const approvals=[];let decision='rejected';
    const ctx={tools:{register(value){tool=value;}},sandboxPolicy:{resolve:()=>({mode:'read-only'})},pluginManager:root.pluginManager,get:()=>({request:async req=>{approvals.push(req);return decision;}})};
    pluginTool.apply(ctx);
    const invocation={agent:{id:'synthetic-install-session',session:{}},callId:'explicit-synthetic-install',signal:new AbortController().signal};
    const args={action:'install_bundle',target:hostPath};
    await assert.rejects(tool.execute(args,invocation),/rejected/);
    assert.deepEqual(JSON.parse(await readFile(join(profileDir,'package.json'),'utf8')).dependencies,{});
    pass('official plugin_manager refuses a denied call without installing or changing read-only policy');
    // Explicit synthetic test approval, not a user-account approval or persistent permission change.
    decision='allowed-once';
    const installed=JSON.parse(await tool.execute(args,invocation));
    assert.notEqual(installed.application,'failed',JSON.stringify(installed));
    const manifest=JSON.parse(await readFile(join(profileDir,'package.json'),'utf8'));
    assert.ok(manifest.dependencies[packageName]);assert.ok(manifest.dsh.profile.bundles.includes(packageName));
    assert.equal(approvals.length,2);assert.equal(ctx.sandboxPolicy.resolve().mode,'read-only');
    const workspace=await readFile(join(profileDir,'pnpm-workspace.yaml'),'utf8');assert.ok(!workspace.includes('allowBuilds'));
    pass('official plugin_manager installs exact attached tgz and registers bundle after one-call fixture approval; no build-script grants');
    const removed=await root.pluginManager.removeBundle(packageName);assert.notEqual(removed.application,'failed',JSON.stringify(removed));
    const after=JSON.parse(await readFile(join(profileDir,'package.json'),'utf8'));assert.ok(!after.dependencies?.[packageName]);assert.ok(!after.dsh.profile.bundles.includes(packageName));
    pass('official manager removes the synthetic bundle from the same isolated profile');
  }finally{for(const fork of forks.reverse())await fork.dispose();}

  // Native write-only credentials; generated test value never enters output or settings.
  const {LocalCredentialProvider}=await official('dsh-credentials-local');
  const {CredentialsController}=await official('dsh-api-settings-controller');
  const keyRef='DSH_TEAM_JEV_API_KEY';
  const secret='synthetic-not-a-real-credential-'+crypto.randomUUID();
  const credentialPath=join(temp,'native-credentials.yaml');
  for(let phase=0;phase<2;phase++){
    const root=new Context();const forks=[];
    try{
      forks.push(root.plugin(LocalCredentialProvider,{path:credentialPath,watch:false}));
      forks.push(root.plugin(CredentialsController));await wait(()=>root.get('credentials')&&root.get('credentialsController'));
      const controller=root.credentialsController;
      if(phase===0){const value=await controller.set(keyRef,secret);assert.equal(value,undefined);}
      const publicView=await controller.describe([keyRef]);assert.equal(publicView[keyRef].configured,true);assert.ok(!JSON.stringify(publicView).includes(secret));
      assert.equal((await stat(credentialPath)).mode&0o777,0o600);
      if(phase===1){await controller.unset(keyRef);assert.equal((await controller.describe([keyRef]))[keyRef].configured,false);}
    }finally{for(const fork of forks.reverse())await fork.dispose();}
  }
  pass('native credential controller writes without returning secret, persists across remount, exposes status only, and removes fake value');
  // The real SettingsForms + ConfigEditor + Loader write and reload the profile.
  const {ConfigEditor}=await official('dsh-config-editor');
  const {SettingsForms}=await official('dsh-settings');
  const {mountRootInclude,readProfilePatches}=await official('dsh-app-boot');
  const profileDir=join(temp,'settings-profile');initProfile(profileDir,[]);
  const rootConfig=join(profileDir,'root.yml');await writeFile(rootConfig,'[]\n');
  const settingsModule=join(temp,'settings-plugin.mjs');
  await writeFile(settingsModule,`import {Config,createSetupStore} from ${JSON.stringify(new URL('../src/team-setup.js',import.meta.url).href)};export {Config};export const name='v04-settings-fixture';export function apply(ctx,config){ctx.provide('fixtureSetup',createSetupStore(ctx,config));}`);
  const patchPath=join(profileDir,'cordis.patch.yml');
  await writeFile(patchPath,JSON.stringify([{insert:[{id:'desktop-workflow',name:pathToFileURL(settingsModule).href}]}]));
  const profile={name:'settings-fixture',dir:profileDir,patchPath,installAnchor:anchor,cwd:temp,home:join(temp,'settings-home'),startedBundles:[],overlays:[],telemetryDisabledEnv:'1'};
  const {settings:completeSettings}=await import('../test/helpers/team-host.mjs');
  let persisted;
  for(let phase=0;phase<2;phase++){
    const root=new Context(),forks=[];
    try{
      root.provide('profileContext',profile);
      forks.push(root.plugin(Loader,{baseUrl:pathToFileURL(anchor).href}));await wait(()=>root.get('loader'));
      forks.push(root.plugin(LocalCredentialProvider,{path:join(temp,'settings-credentials.yaml'),watch:false}));
      forks.push(root.plugin(ConfigEditor));forks.push(root.plugin(SettingsForms));
      await wait(()=>root.get('settings')&&root.get('credentials'));
      await mountRootInclude(root,rootConfig,readProfilePatches('dsh',profile),pathToFileURL(anchor).href);
      await root.loader.await();await wait(()=>root.get('fixtureSetup'));
      const store=root.fixtureSetup;const initial=await store.refresh();
      assert.equal(initial.writable,true);assert.equal(initial.credentialRef,keyRef);
      if(phase===0){
        assert.equal(initial.configured,false);assert.equal(initial.keyConfigured,false);
        const {roles,limits,reviewPlan}=completeSettings();
        const saved=await store.configure({settings:{roles,limits,reviewPlan},disclosureAccepted:true,expectedRevision:initial.revision});
        assert.equal(saved.configured,false);assert.equal(saved.keyConfigured,false);assert.deepEqual(saved.settings.roles,roles);
        assert.equal(saved.disclosureAccepted,true);assert.ok(saved.revision>initial.revision);
        await assert.rejects(store.configure({settings:{roles,limits,reviewPlan},disclosureAccepted:true,expectedRevision:initial.revision}),e=>e.code==='SETTINGS_CONFLICT');
        await assert.rejects(store.configure({settings:{roles,limits,reviewPlan},disclosureAccepted:true,expectedRevision:saved.revision,apiKey:secret}),e=>e.code==='INVALID_SETTINGS');
        await root.credentials.set(keyRef,secret);assert.equal((await store.refresh()).configured,true);
        persisted=await readFile(patchPath,'utf8');assert.ok(!persisted.includes(secret));assert.ok(!JSON.stringify(root.settings.describe({redactSecrets:true})).includes(secret));
      }else{
        assert.equal(initial.configured,true);assert.equal(initial.disclosureAccepted,true);assert.deepEqual(initial.settings.roles,completeSettings().roles);
        assert.equal(await readFile(patchPath,'utf8'),persisted);
      }
    }finally{for(const fork of forks.reverse())await fork.dispose();}
  }
  pass('actual native ConfigEditor/SettingsForms persist six roles and consent, reject stale/secret writes, remain incomplete without key, and survive full remount');
  {
  // Actual generated Remote descriptors, Agent lookup, gateway and authenticated HTTP.
  const {default:WebServer}=await official('dsh-host-webserver');
  const connection=await official('dsh-client-connection');
  const {TypertRegistry}=await official('dsh-typert-registry');
  const {TypertGatewayService}=await official('dsh-api-gateway');
  const {CommandRuntime}=await official('dsh-commands');
  const {AgentRegistry}=await official('dsh-agent');
  const {createScope}=await official('dsh-scope');
  const {TYPERT:commandTypes}=await official('dsh-commands/typert');
  const {TYPERT:settingsTypes}=await official('dsh-api-settings-controller/typert');
  const root=new Context(),forks=[],disposers=[],events=[],received=[];
  const {teamHost,fixtureDependencies}=await import('../test/helpers/team-host.mjs');
  const {createTeamRuntime,registerTeamCommand,registerTeamRoutes}=await import('../src/team-runtime.js');
  const {ToolRuntime}=await official('dsh-tools');
  const {default:SystemPrompt}=await official('dsh-system-prompt');
  const fixture=teamHost({sessionId:'session-a',sessionIds:['session-b'],hold:true});let runtime;
  try{
    forks.push(root.plugin(LocalCredentialProvider,{path:join(temp,'http-credentials.yaml'),watch:false}));
    forks.push(root.plugin(WebServer,{host:'127.0.0.1',port:0}));forks.push(root.plugin(connection));
    forks.push(root.plugin(TypertRegistry));forks.push(root.plugin(SystemPrompt));forks.push(root.plugin(ToolRuntime,{mode:'native'}));forks.push(root.plugin(CredentialsController));forks.push(root.plugin(AgentRegistry));forks.push(root.plugin(CommandRuntime));forks.push(root.plugin(TypertGatewayService));
    await wait(()=>root.get('connection')&&root.get('webServer')?.port&&root.get('typertGateway')&&root.get('commands')&&root.get('agents'));
    disposers.push(root.typert.register(commandTypes));disposers.push(root.typert.register(settingsTypes));
    const agents=[];
    for(const id of ['session-a','session-b']){
      const agent=fixture.parents.get(id);
      agent.session.append=(type,data)=>{events.push({id,type,data});return events.length;};
      const scope=createScope(root,agent);agent.ctx=scope.ctx;agents.push(agent);disposers.push(()=>scope.dispose());disposers.push(root.agents.enter(agent));
    }
    disposers.push(root.commands.register({name:'acceptance-probe',recordInput:false,input:{hint:'synthetic task'},description:'Inert scope probe',handler:inv=>{received.push(inv);return {kind:'success',text:inv.agent.id};}}));
    disposers.push(root.webServer.register({kind:'exact',path:'/',handler(req,res){if(root.connection.authorizeIndex(req,res)){res.writeHead(200);res.end('isolated acceptance');}}}));
    const base=`http://127.0.0.1:${root.webServer.port}`;
    const login=await fetch(root.connection.authenticatedUrl(base+'/'),{redirect:'manual'});assert.equal(login.status,303);
    const cookie=login.headers.get('set-cookie').split(';')[0];
    const rpc=(method,args,headers={cookie})=>fetch(base+'/api/'+method,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify({type:'client-request',rpcId:'v04-fixture',method,payload:{args}})});
    const writeArgs={ref:keyRef,value:secret};
    assert.equal((await rpc('credentials/set',writeArgs,{})).status,401);
    assert.equal((await rpc('credentials/set',writeArgs,{cookie,origin:'https://foreign.example'})).status,403);
    assert.equal((await root.credentials.describe(keyRef)).configured,false);
    const written=await (await rpc('credentials/set',writeArgs)).json();assert.equal(written.result.ok,true,JSON.stringify(written));assert.ok(!JSON.stringify(written).includes(secret));
    const described=await (await rpc('credentials/describe',{refs:[keyRef]})).json();assert.equal(described.result.ok,true,JSON.stringify(described));assert.equal(described.result.value[keyRef].configured,true);assert.ok(!JSON.stringify(described).includes(secret));
    const erased=await (await rpc('credentials/unset',{ref:keyRef})).json();assert.equal(erased.result.ok,true);assert.equal((await root.credentials.describe(keyRef)).configured,false);
    pass('actual credential Remote HTTP rejects unauthenticated/foreign writes and never echoes fake secret in set/describe/unset responses');
    const args={agentId:'session-a',line:'/acceptance-probe synthetic-task',submittedAttachments:[]};
    assert.equal((await rpc('commands/execute',args,{})).status,401);
    assert.equal((await rpc('commands/execute',args,{cookie,origin:'https://foreign.example'})).status,403);
    assert.equal(received.length,0);
    const accepted=await rpc('commands/execute',args);assert.equal(accepted.status,200);const first=await accepted.json();assert.equal(first.result.ok,true,JSON.stringify(first));assert.equal(first.result.value.result.text,'session-a');assert.equal(received[0].agent,agents[0]);
    const second=await (await rpc('commands/execute',{...args,agentId:'session-b'})).json();assert.equal(second.result.ok,true);assert.equal(received[1].agent,agents[1]);
    const missing=await (await rpc('commands/execute',{...args,agentId:'missing-session'})).json();assert.equal(missing.result.ok,false);assert.equal(received.length,2);
    assert.ok(events.every(e=>!Object.hasOwn(e.data,'args')));
    pass('official commands Remote HTTP requires authentication/Origin, resolves exact receiving Agent across session changes, rejects missing session, and suppresses raw command logging');
    let configured=false;const stored=completeSettings();
    fixture.ctx.agents.get=id=>agents.find(a=>a.id===id);
    const setup={view:()=>({configured,settings:stored,disclosureAccepted:configured,keyConfigured:configured,revision:0}),refresh:async()=>setup.view(),configure:async input=>{configured=input.disclosureAccepted;return setup.view();}};
    runtime=createTeamRuntime(fixture.ctx,{}, {...fixtureDependencies(),setup});
    disposers.push(registerTeamCommand(root,()=>runtime));disposers.push(registerTeamRoutes(root,()=>runtime));
    const teamRpc=(action,payload,headers={cookie})=>fetch(base+'/api/dsh-desktop-workflow/team/'+action,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify({type:'client-request',rpcId:'team-fixture',method:'dsh-desktop-workflow/team/'+action,payload})});
    for(const action of ['settings','configure','snapshot','cancel']){
      assert.equal((await teamRpc(action,{},{})).status,401);
      assert.equal((await teamRpc(action,{},{cookie,origin:'https://foreign.example'})).status,403);
    }
    const commandArgs={agentId:'session-a',line:'/team Only edit the synthetic fixture',submittedAttachments:[]};
    const incomplete=await (await rpc('commands/execute',commandArgs)).json();assert.equal(incomplete.result.ok,true);assert.equal(fixture.calls.length,0);assert.equal(runtime.snapshot('session-a').context.lastCommand.kind,'settings-required');assert.equal(runtime.snapshot('session-a').context.setupRequired,true);
    configured=true;
    const stopped=new AbortController();stopped.abort();await assert.rejects(root.commands.execute(agents[0],commandArgs.line,[],stopped.signal));assert.equal(fixture.calls.length,0);
    const [one,two]=await Promise.all([rpc('commands/execute',commandArgs).then(r=>r.json()),rpc('commands/execute',commandArgs).then(r=>r.json())]);assert.equal(one.result.ok,true);assert.equal(two.result.ok,true);
    assert.equal(runtime.snapshot('session-a').context.lastCommand.kind,'started',JSON.stringify(runtime.snapshot('session-a')));
    await wait(()=>fixture.calls.length>0);assert.equal(fixture.calls.length,1);
    const active=runtime.snapshot('session-a').snapshot;assert.ok(active.id);assert.equal(runtime.snapshot('session-a').context.lastCommand.kind,'started');
    await rpc('commands/execute',{...commandArgs,line:'/team Do not create a duplicate run'});assert.equal(fixture.calls.length,1);assert.equal(runtime.snapshot('session-a').snapshot.id,active.id);
    await rpc('commands/execute',{...commandArgs,agentId:'session-b'});assert.equal(runtime.snapshot('session-b').snapshot,null);assert.equal(fixture.calls.length,1);
    const wrong=await (await teamRpc('cancel',{sessionId:'session-b',runId:active.id})).json();assert.equal(wrong.result.ok,false);assert.equal(runtime.snapshot('session-a').snapshot.id,active.id);
    const cancelled=await (await teamRpc('cancel',{sessionId:'session-a',runId:active.id})).json();assert.equal(cancelled.result.ok,true);
    await wait(()=>runtime.snapshot('session-a').snapshot.finishedAt);
    const snapshot=await (await teamRpc('snapshot',{sessionId:'session-a'})).json();assert.equal(snapshot.result.ok,true);assert.ok(!JSON.stringify(snapshot).includes(secret));assert.ok(!JSON.stringify(events).includes(secret));assert.ok(events.every(e=>!Object.hasOwn(e.data,'args')));
    assert.equal(runtime.snapshot('session-a').snapshot.status,'cancelled');
    pass('actual /team through official command HTTP blocks incomplete setup, coalesces repeats, preserves session ownership, and cancels the correct run without model transport');
    await runtime.dispose();
    let enteredPreflight=false,release;
    const gate=new Promise(r=>{release=r;});
    fixture.ctx.llm.resolveCallConfig=async selection=>{enteredPreflight=true;await gate;return selection;};
    runtime=createTeamRuntime(fixture.ctx,{}, {...fixtureDependencies(),setup});
    const before=fixture.calls.length,previousRun=runtime.snapshot('session-a').snapshot?.id,cancelSignal=new AbortController();
    const pendingCommand=root.commands.execute(agents[0],'/team Abort during model metadata lookup',[],cancelSignal.signal).catch(()=>undefined);
    await wait(()=>enteredPreflight);cancelSignal.abort();release();await pendingCommand;
    await new Promise(r=>setTimeout(r,30));
    assert.equal(fixture.calls.length,before,'Cancelled command must not dispatch a model after metadata preflight resumes');
    assert.equal(runtime.snapshot('session-a').snapshot?.id,previousRun,'Cancelled pending command must not create a new team or discard existing history');
    pass('cancellation during metadata preflight prevents later command execution');


  }finally{await runtime?.dispose();for(const dispose of disposers.reverse())await dispose();for(const fork of forks.reverse())await fork.dispose();}
  }
  console.log('LIMITS: attachment/storage and official manager layers verified; no model-language dispatch, GUI drag/drop, Electron or Windows validation. Credential value is synthetic. Native command/settings paths use real official core; model transport, setup runtime toggle and verification facts are explicit fixtures.');
}finally{await rm(temp,{recursive:true,force:true});}
