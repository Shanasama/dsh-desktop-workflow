#!/usr/bin/env node
/** Official rc.2 /team acceptance with inert LLM/Jev transports and real temporary files/processes. */
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,access,cp,symlink,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawn,spawnSync} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
import {TEAM_ROLES,DEFAULT_LIMITS} from '../src/team-contracts.js';
import {JEV_ENDPOINT} from '../src/jev-client.js';
import {verifierCommand} from '../src/verifier-command.js';

assert.ok(process.env.DSH_NODE_MODULES,'Set DSH_NODE_MODULES to an approved official rc.2 node_modules tree.');
const modules=resolve(process.env.DSH_NODE_MODULES);
const resolver=createRequire(pathToFileURL(join(modules,'..','package.json')));
const official=async name=>import(pathToFileURL(resolver.resolve('@deepseek-ai/'+name)));
const anchor=resolver.resolve('@deepseek-ai/dsh/package.json');
assert.equal(JSON.parse(await readFile(anchor,'utf8')).version,'0.2.0-rc.2');
let packageRoot=fileURLToPath(new URL('../',import.meta.url));
let trustedVerifierCommand=verifierCommand;
let installedArchive,duplicatePeer=false;
const temp=await mkdtemp(join(tmpdir(),'dsh-production-acceptance-'));
const cleanEnv={PATH:process.env.PATH,HOME:join(temp,'home'),TMPDIR:tmpdir(),LANG:'C.UTF-8',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_TERMINAL_PROMPT:'0',DSH_TELEMETRY_DISABLED:'1'};
await mkdir(cleanEnv.HOME,{recursive:true});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitFor(fn,label,timeout=15000){const end=Date.now()+timeout;while(Date.now()<end){const value=await fn();if(value)return value;await pause(15);}throw Error('Timed out: '+label);}
const pass=label=>console.log('PASS '+label);
const scenarios=new Map(),modelCalls=[],jevCalls=[],shellCalls=[],toolResults=[],childEvents=[],evidencePaths=new Map(),activeProcesses=new Set();
const fakeSecret='synthetic-production-fixture-'+randomUUID();
const realFetch=globalThis.fetch;
const select=(role,tier='base')=>({provider:'production-fixture',model:role+'-'+tier,maxTokens:1024});
const settings=()=>({roles:Object.fromEntries(TEAM_ROLES.map(role=>[role,select(role)])),limits:{...DEFAULT_LIMITS,maxAgents:32,maxRetries:0,maxDurationMs:30000,maxRounds:4},reviewPlan:true,jev:{model:'jev-latest',trace:true,shadow:{enabled:true,model:'jev-0.3.1',maxCalls:2}},budget:{enabled:false,tokenLimit:0},routing:{enabled:true,roles:Object.fromEntries(TEAM_ROLES.map(role=>[role,{weak:select(role,'weak'),strong:select(role,'strong')}]))}});
const scenarioFromText=text=>[...scenarios.values()].find(s=>text.includes('CASE_'+s.name));
function choice(choice,keys){return {type:'choice',choice,confidence:1,probabilities:Object.fromEntries(keys.map(key=>[key,key===choice?1:0]))};}
function jevAnswers(phase,selected){return phase==='classify'?{lane:choice(selected,['small','medium','high','escalate','other']),security_sensitive:{type:'noul',noul:0},underspecified:{type:'noul',noul:0}}:{next:choice(selected,['complete','continue','retry_differently','needs_stronger_model','needs_person','other']),implemented:{type:'noul',noul:1},in_scope:{type:'noul',noul:1}};}
// Fail closed for every non-loopback request except the exact inert Jev seam.
globalThis.fetch=async(input,init)=>{
 const url=String(input instanceof Request?input.url:input);
 if(url!==JEV_ENDPOINT){assert.match(url,/^http:\/\/127\.0\.0\.1:\d+\//,'Acceptance prohibits external network');return realFetch(input,init);}
 const body=JSON.parse(init.body),scenario=scenarioFromText(body.state.task);
 assert.ok(scenario,'Jev request must belong to an explicit synthetic scenario');
 assert.equal(init.headers.Authorization,'Bearer '+fakeSecret);
 assert.equal(init.redirect,'error');
 const phase=Object.hasOwn(body.questions,'lane')?'classify':'step';
 const shadow=body.model==='jev-0.3.1';
 const primaryStep=jevCalls.filter(c=>c.scenario===scenario.name&&c.phase==='step'&&!c.shadow).length;
 jevCalls.push({scenario:scenario.name,phase,shadow,model:body.model,state:body.state});
 const selected=phase==='classify'?(shadow?'escalate':'small'):(shadow?'needs_person':scenario.escalate&&primaryStep<2?'needs_stronger_model':'complete');
 return Response.json({model:shadow?'jev-0.3.1':'jev-0.3.2',answers:jevAnswers(phase,selected),usage:{input_tokens:17,output_tokens:9}});
};
const {Context}=await official('cordis');
const {AgentRegistry}=await official('dsh-agent');
const {default:AgentLoop}=await official('dsh-agent-loop');
const {default:SessionStore}=await official('dsh-session');
const {SessionProjectionRegistry}=await official('dsh-session-projection');
const {LlmRuntime,LlmAdapter}=await official('dsh-llm');
const {default:NativeSubagents}=await official('dsh-subagent');
const SpawnNative=await official('dsh-subagent-spawn-in-process');
const {default:SystemPrompt}=await official('dsh-system-prompt');
const {ToolRuntime}=await official('dsh-tools');
const {default:LocalFileSystem}=await official('dsh-fs-local');
const NativeFsTools=await official('dsh-tool-fs');
const NativeBashTool=await official('dsh-tool-bash');
const {default:SandboxPolicy}=await official('dsh-sandbox-policy');
const {LocalCredentialProvider}=await official('dsh-credentials-local');
const {CredentialsController}=await official('dsh-api-settings-controller');
const {default:WebServer}=await official('dsh-host-webserver');
const connection=await official('dsh-client-connection');
const {TypertRegistry}=await official('dsh-typert-registry');
const {TypertGatewayService}=await official('dsh-api-gateway');
const {CommandRuntime}=await official('dsh-commands');
const {TYPERT:commandTypes}=await official('dsh-commands/typert');
const {TYPERT:credentialTypes}=await official('dsh-api-settings-controller/typert');
const {Loader}=await official('cordis-plugin-loader');
const {ConfigEditor}=await official('dsh-config-editor');
const {SettingsForms}=await official('dsh-settings');
const {initProfile,mountRootInclude,readProfilePatches}=await official('dsh-app-boot');

let packageInfo;
try{
if(process.env.DSH_PRODUCTION_BUNDLE){
 const archive=resolve(process.env.DSH_PRODUCTION_BUNDLE);await access(archive);
 const archiveHash=createHash('sha256').update(await readFile(archive)).digest('hex');
 const installDir=join(temp,'install-profile');initProfile(installDir,[]);
 // Offline dependencies are exact approved official packages. The LLM peer
 // is intentionally a separate physical copy to exercise native marker identity.
 const hostLlm=join(modules,'@deepseek-ai/dsh-llm'),hostSchema=join(modules,'@deepseek-ai/schemastery');
 const isolatedLlm=join(temp,'separate-official-dsh-llm');
 await cp(hostLlm,isolatedLlm,{recursive:true,dereference:true,filter:source=>!source.includes('/node_modules/@deepseek-ai/dsh-llm/node_modules')});
 await symlink(modules,join(isolatedLlm,'node_modules'),'dir');
 assert.notEqual(await realpath(hostLlm),await realpath(isolatedLlm));
 assert.deepEqual(await readFile(join(isolatedLlm,'lib/index.js')),await readFile(join(hostLlm,'lib/index.js')));
 const separatePeer=await import(pathToFileURL(join(isolatedLlm,'lib/index.js')));
 assert.notEqual(separatePeer.isAgentLoopRequest,(await official('dsh-llm')).isAgentLoopRequest,'Native AgentLoop and plugin peer must have separate module identities');
 duplicatePeer=true;
 assert.equal(JSON.parse(await readFile(join(hostLlm,'package.json'),'utf8')).version,'0.2.0-rc.2');
 assert.equal(JSON.parse(await readFile(join(hostSchema,'package.json'),'utf8')).version,'3.18.4');
 const installManifest=JSON.parse(await readFile(join(installDir,'package.json'),'utf8'));
 installManifest.dependencies['@deepseek-ai/dsh-llm']='link:'+isolatedLlm;
 installManifest.dependencies['@deepseek-ai/schemastery']='link:'+hostSchema;
 installManifest.pnpm={overrides:{'@deepseek-ai/schemastery':'link:'+hostSchema}};
 await writeFile(join(installDir,'package.json'),JSON.stringify(installManifest));
 const installRoot=new Context(),installForks=[];
 const {PluginManager}=await official('dsh-plugin-manager');
 const store=process.env.DSH_PNPM_STORE||join(modules,'..','pnpm-store');
 const pnpmCli=process.env.DSH_PNPM_CLI||join(modules,'..','tools/node_modules/pnpm/bin/pnpm.cjs');await access(pnpmCli);
 const packageEnv={...cleanEnv,PNPM_HOME:join(temp,'pnpm'),XDG_CACHE_HOME:join(temp,'cache'),npm_config_ignore_scripts:'true',npm_config_cache:join(temp,'npm')};
 installRoot.provide('profileContext',{name:'production-package-install',dir:installDir,patchPath:join(installDir,'cordis.patch.yml'),installAnchor:anchor,cwd:temp,home:join(temp,'install-home'),startedBundles:[],overlays:[],telemetryDisabledEnv:'1',packageManager:{command:'/usr/bin/env',args:['-i',...Object.entries(packageEnv).map(([key,value])=>`${key}=${value}`),process.execPath,resolve(pnpmCli),'--offline','--store-dir',resolve(store)],env:{}}});
 try{
  installForks.push(installRoot.plugin(Loader,{baseUrl:pathToFileURL(anchor).href}));installForks.push(installRoot.plugin(PluginManager,{fallbackRegistries:[]}));
  await waitFor(()=>installRoot.get('pluginManager'),'official PluginManager ready');
  const installed=await installRoot.pluginManager.installBundle(archive,{activate:false});
  assert.notEqual(installed.application,'failed','Official package install failed: '+JSON.stringify(installed));
  const manifest=JSON.parse(await readFile(join(installDir,'package.json'),'utf8'));
  assert.ok(manifest.dependencies['dsh-desktop-workflow'],'Exact bundle must be installed into the isolated profile');
  packageRoot=join(installDir,'node_modules','dsh-desktop-workflow');
  const installedManifest=JSON.parse(await readFile(join(packageRoot,'package.json'),'utf8'));assert.equal(installedManifest.version,'0.6.0');
  assert.equal(installedManifest.dsh.bundle.patch,'./cordis.patch.yml');
  trustedVerifierCommand=(await import(pathToFileURL(join(packageRoot,'src/verifier-command.js')))).verifierCommand;
  await import(pathToFileURL(join(packageRoot,'src/index.js')));
  assert.equal(createHash('sha256').update(await readFile(archive)).digest('hex'),archiveHash,'Archive must not change during installation');
  const archivedEntry=spawnSync('tar',['-xOf',archive,'package/src/index.js'],{encoding:'utf8',env:cleanEnv});assert.equal(archivedEntry.status,0);assert.equal(await readFile(join(packageRoot,'src/index.js'),'utf8'),archivedEntry.stdout,'Installed entry must match the exact archive');
  installedArchive={path:archive,sha256:archiveHash};
  pass('official PluginManager installs the exact 0.6.0 tgz offline with an independent byte-identical official LLM peer and no build scripts');
 }finally{for(const fork of installForks.reverse())await fork.dispose();}
}
packageInfo=JSON.parse(await readFile(join(packageRoot,'package.json'),'utf8'));
assert.equal(packageInfo.version,'0.6.0');
}catch(error){globalThis.fetch=realFetch;await rm(temp,{recursive:true,force:true});throw error;}
let root,base,cookie,pluginEntry;
const forks=[],disposers=[],parents=[];
const credentialRef='DSH_TEAM_JEV_API_KEY';
const profileDir=join(temp,'profile');initProfile(profileDir,[]);
const rootConfig=join(profileDir,'root.yml');await writeFile(rootConfig,'[]\n');
const patchPath=join(profileDir,'cordis.patch.yml');
await writeFile(patchPath,JSON.stringify([{insert:[{id:'production-workflow',name:pathToFileURL(join(packageRoot,'src/index.js')).href,config:{jev:{model:'jev-latest',trace:true,shadow:{enabled:true,model:'jev-0.3.1',maxCalls:2}}}}]}]));
const profile={name:'isolated-production-acceptance',dir:profileDir,patchPath,installAnchor:anchor,cwd:temp,home:join(temp,'dsh-home'),startedBundles:[],overlays:[],telemetryDisabledEnv:'1'};

class DeterministicProvider extends LlmAdapter {
 providerInfo(id){return {id,name:'Inert native acceptance provider'};}
 async listModels(){return TEAM_ROLES.flatMap(role=>['base','weak','strong'].map(tier=>({provider:'production-fixture',id:role+'-'+tier,name:'Fixture '+role+' '+tier})));}
 async resolveModel(provider,model){assert.ok((await this.listModels()).some(x=>x.id===model),'Never route to an unconfigured model');return {provider,id:model,name:model,context:{contextWindow:4096}};}
 async *stream(options){
  const agent=root.agents.get(options.sessionId);assert.ok(agent,'Provider must receive a real live native Agent');
  assert.ok(agent.session.header.parentSession,'Provider must never run on the parent');
  const scenario=scenarios.get(agent.session.header.parentSession);assert.ok(scenario);
  const role=options.model.split('-')[0];
  assert.ok(TEAM_ROLES.includes(role));
  assert.equal(options.provider,'production-fixture');
  const call={scenario:scenario.name,role,model:options.model,sessionId:options.sessionId,step:modelCalls.filter(c=>c.sessionId===options.sessionId).length};modelCalls.push(call);
  if(scenario.hold&&role==='planner'){
   await new Promise(resolve=>{if(options.signal.aborted)resolve();else options.signal.addEventListener('abort',resolve,{once:true});});
   yield {type:'finish',reason:{kind:'aborted',failure:{code:'ABORTED',message:'Synthetic cancellation'}}};return;
  }
  let block;
  const plan={summary:'Edit only the fixture implementation',tasks:[{id:'implementation',role:'worker',title:'Implement fixture answer',instructions:'Read src/answer.mjs, then use exact edit to set the answer. Do not change tests or configuration.',dependsOn:[]}]};
  if(role==='planner'||role==='coordinator')block={type:'tool-call',id:'fixture-'+randomUUID(),name:'structured_output',arguments:JSON.stringify(plan)};
  else if(role==='reviewer')block={type:'tool-call',id:'fixture-'+randomUUID(),name:'structured_output',arguments:JSON.stringify({verdict:'approve',summary:'Synthetic review approves; only the independent verifier decides acceptance.',issues:[]})};
  else if(role==='worker'&&call.step===0)block={type:'tool-call',id:'fixture-'+randomUUID(),name:'read',arguments:JSON.stringify({file_path:join(scenario.cwd,'src/answer.mjs')})};
  else if(role==='worker'&&call.step===1){
   const before=await readFile(join(scenario.cwd,'src/answer.mjs'),'utf8');
   const number=scenario.fail?41:42;
   const after=`export const answer = ${number}; // native edit ${scenario.edits++}\n`;
   block={type:'tool-call',id:'fixture-'+randomUUID(),name:'edit',arguments:JSON.stringify({file_path:join(scenario.cwd,'src/answer.mjs'),old_string:before,new_string:after})};
  }else block={type:'text',text:'Synthetic implementation work finished. Await independent host checks.'};
  yield {type:'block-start',index:0,blockType:block.type};
  yield {type:'block-end',index:0,block};
  if(!scenario.missingUsage)yield {type:'usage',usage:{inputTokens:11,outputTokens:7,totalTokens:18}};
  yield {type:'finish',reason:{kind:block.type==='tool-call'?'tool-calls':'stop'}};
 }
}

// Only package-generated fixed verifier commands reach this real subprocess backend.
const shell={resolve:spec=>spec,async execute(spec){
 const encoded=spec.command.match(/'([A-Za-z0-9+/=]+)'$/)?.[1];assert.ok(encoded);
 const payload=JSON.parse(Buffer.from(encoded,'base64').toString('utf8'));
 assert.equal(spec.command,trustedVerifierCommand('project',payload,'bash'));
 const scenario=[...scenarios.values()].find(s=>s.cwd===spec.workdir);assert.ok(scenario,'Verifier cwd must be an owned temporary project');
 assert.equal(spec.runInBackground??false,false);
 shellCalls.push({scenario:scenario.name,phase:payload.phase,runId:payload.runId});
 const child=spawn('/bin/bash',['-c',spec.command],{cwd:spec.workdir,env:cleanEnv,stdio:['ignore','pipe','pipe']});
 activeProcesses.add(child);
 let stdout='',stderr='',aborted=false,timedOut=false;
 child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr+=chunk);
 const abort=()=>{aborted=true;child.kill('SIGKILL');};
 spec.signal?.addEventListener('abort',abort,{once:true});
 const timer=setTimeout(()=>{timedOut=true;child.kill('SIGKILL');},spec.timeoutMs||90000);
 const result=new Promise((resolve,reject)=>{
  child.once('error',reject);
  child.once('close',(exitCode,signal)=>{
   clearTimeout(timer);spec.signal?.removeEventListener('abort',abort);activeProcesses.delete(child);
   let data;try{data=JSON.parse(stdout);}catch{}
   if(data?.baselineRef?.path)evidencePaths.set(data.baselineRef.path,scenario.id);
   resolve({exitCode,signal,timedOut:timedOut||!!scenario.lostAcknowledgement,aborted,timeoutMs:spec.timeoutMs,stdout:{text:stdout,truncated:false},stderr:{text:stderr,truncated:false}});
  });
 });
 return {result:()=>result};
}};
async function rpc(method,payload,headers={cookie},raw){return fetch(base+'/api/'+method,{method:'POST',headers:{'content-type':'application/json',...headers},body:raw??JSON.stringify({type:'client-request',rpcId:'production-acceptance',method,payload})});}
async function team(action,payload={}){const response=await rpc('dsh-desktop-workflow/team/'+action,payload);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');const body=await response.json();assert.equal(body.rpcId,'production-acceptance');assert.equal(body.result.ok,true,JSON.stringify(body));return body.result.value;}
async function createProject(name,options={}){
 const cwd=join(temp,'project-'+name);await mkdir(join(cwd,'src'),{recursive:true});
 await writeFile(join(cwd,'package.json'),JSON.stringify({name:'synthetic-'+name,type:'module',scripts:{test:'node --test acceptance.test.mjs'}}));
 await writeFile(join(cwd,'src/answer.mjs'),'export const answer = 0;\n');
 await writeFile(join(cwd,'acceptance.test.mjs'),"import {test} from 'node:test'; import assert from 'node:assert/strict'; import {answer} from './src/answer.mjs'; test('answer is independently verified',()=>assert.equal(answer,42));\n");
 const git=(...args)=>{const r=spawnSync('git',args,{cwd,env:cleanEnv,encoding:'utf8'});assert.equal(r.status,0,r.stderr);};
 git('init','--quiet');git('add','.');git('-c','user.name=Acceptance Fixture','-c','user.email=fixture@example.invalid','-c','commit.gpgsign=false','commit','--quiet','-m','Synthetic baseline');
 const id='production-'+name;
 const scenario={name,cwd,id,edits:0,...options};scenarios.set(id,scenario);
 const handle=await root.agents.create({sessionId:id,meta:{cwd},agentOptions:select('planner')});parents.push(handle);
 return scenario;
}
async function start(scenario){
 const response=await rpc('commands/execute',{args:{agentId:scenario.id,line:'/team CASE_'+scenario.name+' Set the synthetic answer to 42.',submittedAttachments:[]}});
 const body=await response.json();assert.equal(body.result.ok,true,JSON.stringify(body));
 const state=await team('snapshot',{sessionId:scenario.id});
 assert.equal(state.context.lastCommand.kind,'started',JSON.stringify(state));return state.snapshot;
}
async function settled(scenario,timeout=15000){return waitFor(async()=>{const state=await team('snapshot',{sessionId:scenario.id});return state.snapshot?.finishedAt?state:null;},scenario.name+' terminal state',timeout);}
async function assertClean(scenario){await waitFor(()=>!root.agents.list().some(a=>a.session.header.parentSession===scenario.id),'native children disposed');assert.equal(activeProcesses.size,0);for(const [path,id] of evidencePaths)if(id===scenario.id)await assert.rejects(access(path),{code:'ENOENT'});}

try{
 root=new Context();root.provide('profileContext',profile);root.provide('shell',shell);root.provide('shellEnv',{collect:()=>({})});
 const mount=(plugin,config)=>{const fork=root.plugin(plugin,config);forks.push(fork);return fork;};
 mount(Loader,{baseUrl:pathToFileURL(anchor).href});mount(LocalCredentialProvider,{path:join(temp,'credentials.yaml'),watch:false});
 mount(ConfigEditor);mount(SettingsForms);mount(WebServer,{host:'127.0.0.1',port:0});mount(connection);mount(TypertRegistry);mount(TypertGatewayService);mount(CommandRuntime);mount(CredentialsController);
 mount(AgentRegistry);mount(SessionStore);mount(SessionProjectionRegistry);mount(LlmRuntime);mount(SystemPrompt);mount(ToolRuntime,{mode:'native'});mount(LocalFileSystem,{cwd:temp});mount(NativeFsTools,{});mount(NativeBashTool,{enableRunInBackground:false,promoteOnTimeout:false});mount(SandboxPolicy,{mode:'workspace-write',workspaceRoot:temp});mount(AgentLoop,{});mount(NativeSubagents,{maxDepth:1});mount(SpawnNative,{});
 await waitFor(()=>root.get('agentLoop')&&root.get('commands')&&root.get('settings')&&root.get('connection')&&root.get('webServer')?.port&&root.subagents.getProvider('spawn'),'official services mounted');
 disposers.push(root.llm.registerAdapter(['production-fixture'],new DeterministicProvider()));
 disposers.push(root.typert.register(commandTypes));disposers.push(root.typert.register(credentialTypes));
 disposers.push(root.on('agent/created',({agent})=>{if(agent.session.header.parentSession)childEvents.push({type:'created',id:agent.id,parent:agent.session.header.parentSession});}));
 disposers.push(root.on('agent/disposed',({agent})=>{if(agent.session.header.parentSession)childEvents.push({type:'disposed',id:agent.id});}));
 disposers.push(root.on('tools/result',(exec,result)=>{toolResults.push({name:exec.name,agent:exec.agent.id,isError:result.isError??false});}));
 disposers.push(root.webServer.register({kind:'exact',path:'/',handler(req,res){if(root.connection.authorizeIndex(req,res)){res.writeHead(200);res.end('isolated production acceptance');}}}));
 await mountRootInclude(root,rootConfig,readProfilePatches('dsh',profile),pathToFileURL(anchor).href);await root.loader.await();
 base='http://127.0.0.1:'+root.webServer.port;
 const login=await fetch(root.connection.authenticatedUrl(base+'/'),{redirect:'manual'});assert.equal(login.status,303);cookie=login.headers.get('set-cookie').split(';')[0];
 await waitFor(async()=>{const r=await rpc('dsh-desktop-workflow/team/settings',{});return r.status===200;},'production routes mounted').catch(error=>{console.error('Loader diagnostics',JSON.stringify([...root.loader.entries()].map(e=>({id:e.id,name:e.options.name,status:e.fiber?.status,error:e.fiber?.error?.message}))));throw error;});
 const initial=await team('settings');assert.equal(initial.configured,false);assert.equal(initial.writable,true);
 const scenario=await createProject('pass');
 const beforeSetup=await (await rpc('commands/execute',{args:{agentId:scenario.id,line:'/team CASE_pass Set the answer.',submittedAttachments:[]}})).json();assert.equal(beforeSetup.result.ok,true);
 assert.equal((await team('snapshot',{sessionId:scenario.id})).context.lastCommand.kind,'settings-required');assert.equal(modelCalls.length,0);
 await root.credentialsController.set(credentialRef,fakeSecret);
 const saved=await team('configure',{settings:settings(),disclosureAccepted:true,expectedRevision:initial.revision});
 assert.equal(saved.configured,true);assert.deepEqual(saved.settings.routing,settings().routing);assert.deepEqual(saved.settings.budget,settings().budget);
 const persisted=await readFile(patchPath,'utf8');assert.ok(persisted.includes('tokenLimit'));assert.ok(persisted.includes('worker-strong'));assert.ok(!persisted.includes(fakeSecret));
 pass('native /team requires setup; real SettingsForms and ConfigEditor persist budget and weak/base/strong routes without credentials');
 const entry=[...root.loader.entries()].find(entry=>entry.options.name===pathToFileURL(join(packageRoot,'src/index.js')).href);assert.ok(entry);
 await entry.update({},false,true);await root.loader.await();
 const reloaded=await team('settings');assert.equal(reloaded.configured,true);assert.deepEqual(reloaded.settings,saved.settings);assert.equal(await readFile(patchPath,'utf8'),persisted);
 pass('native Loader remount restores production controls and consent from the persisted settings entry');

 for(const action of ['catalog','snapshot','start','cancel','request','settings','configure','trace']){
  const method='dsh-desktop-workflow/team/'+action;
  assert.equal((await rpc(method,{},{})).status,401);
  assert.equal((await rpc(method,{},{cookie,origin:'https://foreign.example'})).status,403);
 }
 assert.equal((await rpc('dsh-desktop-workflow/team/snapshot',{}, {cookie},'{')).status,400);
 assert.equal((await rpc('dsh-desktop-workflow/team/snapshot',{}, {cookie},JSON.stringify({type:'client-request',rpcId:'bad',method:'mismatch',payload:{}}))).status,400);
 pass('all production HTTP routes enforce real BrowserAuth, Origin, RPC envelope and no-store responses');
 await start(scenario);const good=await settled(scenario);assert.equal(good.snapshot.status,'completed',JSON.stringify(good.snapshot));
 assert.match(await readFile(join(scenario.cwd,'src/answer.mjs'),'utf8'),/answer = 42/);
 assert.ok(toolResults.some(x=>x.name==='edit'&&!x.isError));
 assert.ok(modelCalls.filter(c=>c.scenario==='pass').every(c=>c.model.endsWith('-weak')));
 assert.deepEqual(shellCalls.filter(c=>c.scenario==='pass').map(c=>c.phase),['baseline','check','seal','cleanup']);
 await assertClean(scenario);
 pass('actual native /team reaches AgentLoop, native spawn, official filesystem edit tools and real verifier subprocess completion');
 const trace=await team('trace',{sessionId:scenario.id,runId:good.snapshot.id});
 assert.equal(trace.privacy,'metadata-only');
 assert.ok(trace.events.some(e=>e.type==='jev'&&e.data.source==='primary'&&e.data.metadata?.requestedModel==='jev-latest'&&e.data.metadata?.responseModel==='jev-0.3.2'));
 assert.ok(trace.events.some(e=>e.type==='jev'&&e.data.source==='shadow'&&e.data.metadata?.requestedModel==='jev-0.3.1'));
 assert.equal(jevCalls.filter(c=>c.scenario==='pass'&&c.shadow).length,2);
 assert.equal(good.snapshot.production.budget.spent,modelCalls.filter(c=>c.scenario==='pass').length*18);assert.equal(good.snapshot.production.budget.remaining,null);assert.equal(good.snapshot.production.budget.reserved,0);assert.equal(good.snapshot.production.jev.primary.responseModel,'jev-0.3.2');assert.equal(good.snapshot.production.trace.enabled,true);assert.ok(good.snapshot.production.trace.eventCount>0);assert.equal(good.snapshot.jev.lane,'small');assert.ok(!JSON.stringify(trace).includes(scenario.cwd));assert.ok(!JSON.stringify(trace).includes(fakeSecret));
 pass('pinned shadow disagreements remain observational; primary alias/resolved version metadata is retained without changing the run');
 const failing=await createProject('fail',{fail:true});await start(failing);const failed=await settled(failing);assert.notEqual(failed.snapshot.status,'completed');assert.equal(failed.snapshot.jev.evidence.checksPassed,false);assert.equal(failed.snapshot.jev.evidence.protectedOk,true);await assertClean(failing);
 pass('real failing independent tests override optimistic fixture review and Jev complete proposals');
 const escalating=await createProject('escalate',{escalate:true});await start(escalating);const escalated=await settled(escalating);assert.equal(escalated.snapshot.status,'completed',JSON.stringify(escalated.snapshot));
 const models=modelCalls.filter(c=>c.scenario==='escalate'&&c.role==='worker').map(c=>c.model);
 assert.ok(models.includes('worker-weak'));assert.ok(models.includes('worker-base'));assert.ok(models.includes('worker-strong'));assert.equal(escalated.snapshot.jev.lane,'high');await assertClean(escalating);
 pass('native children follow small weak, medium base and high strong routing after live lane escalation');
 const cancelled=await createProject('cancel',{hold:true});const running=await start(cancelled);await waitFor(()=>modelCalls.some(c=>c.scenario==='cancel'),'native held provider entered');await team('cancel',{sessionId:cancelled.id,runId:running.id});const cancelledState=await settled(cancelled);assert.equal(cancelledState.snapshot.status,'cancelled');await assertClean(cancelled);
 pass('cancellation reaches the real native provider signal, drains children and removes verifier evidence');
 const current=await team('settings');const timedSettings=settings();timedSettings.limits.maxDurationMs=1000;await team('configure',{settings:timedSettings,disclosureAccepted:true,expectedRevision:current.revision});
 const timeout=await createProject('timeout',{hold:true});await start(timeout);const timeoutState=await settled(timeout);assert.notEqual(timeoutState.snapshot.status,'completed');assert.ok(timeoutState.snapshot.events.some(e=>e.type==='deadline_reached'));await assertClean(timeout);
 pass('production deadline aborts native model work and confirms cleanup before releasing the project');

 const enabledSettings=settings();enabledSettings.budget={enabled:true,tokenLimit:10000};
 await team('configure',{settings:enabledSettings,disclosureAccepted:true,expectedRevision:(await team('settings')).revision});
 const budgeted=await createProject('budgeted');await start(budgeted);const budgetedState=await settled(budgeted);assert.equal(budgetedState.snapshot.status,'completed',JSON.stringify(budgetedState.snapshot));
 assert.equal(budgetedState.snapshot.production.budget.physicalCalls,modelCalls.filter(c=>c.scenario==='budgeted').length);assert.equal(budgetedState.snapshot.production.budget.spent,126);assert.equal(budgetedState.snapshot.production.budget.remaining,9874);assert.equal(budgetedState.snapshot.production.budget.reserved,0);await assertClean(budgeted);
 pass('enabled budget observes actual official llm/stream calls and usage; shadow/Jev requests consume no role token budget');
 const shortSettings=settings();shortSettings.budget={enabled:true,tokenLimit:100};
 await team('configure',{settings:shortSettings,disclosureAccepted:true,expectedRevision:(await team('settings')).revision});
 const insufficient=await createProject('insufficient');await start(insufficient);const insufficientState=await settled(insufficient);assert.equal(insufficientState.snapshot.status,'blocked');assert.equal(insufficientState.snapshot.production.budget.halted,'BUDGET_INSUFFICIENT');assert.equal(insufficientState.snapshot.production.budget.physicalCalls,0);assert.equal(modelCalls.filter(c=>c.scenario==='insufficient').length,0);await assertClean(insufficient);
 pass('insufficient production budget refuses the native request before the inert provider receives any call');
 await team('configure',{settings:enabledSettings,disclosureAccepted:true,expectedRevision:(await team('settings')).revision});
 const unknown=await createProject('unknown-usage',{missingUsage:true});await start(unknown);const unknownState=await settled(unknown);assert.equal(unknownState.snapshot.status,'blocked');assert.equal(unknownState.snapshot.production.budget.halted,'BUDGET_USAGE_UNKNOWN');assert.equal(unknownState.snapshot.production.budget.unknownUsageCalls,1);assert.equal(unknownState.snapshot.production.budget.reserved,4096);assert.equal(modelCalls.filter(c=>c.scenario==='unknown-usage').length,1);await assertClean(unknown);
 pass('missing native usage retains the full reservation and blocks all subsequent provider calls');
 await team('configure',{settings:settings(),disclosureAccepted:true,expectedRevision:(await team('settings')).revision});
 const quarantined=await createProject('quarantined',{lostAcknowledgement:true});await start(quarantined);const quarantineState=await settled(quarantined);assert.equal(quarantineState.snapshot.lifecycle,'quarantined');assert.equal(quarantineState.context.canStart,false);assert.equal(modelCalls.filter(c=>c.scenario==='quarantined').length,0);
 const sameId='production-same-project';const sameHandle=await root.agents.create({sessionId:sameId,meta:{cwd:quarantined.cwd},agentOptions:select('planner')});parents.push(sameHandle);
 const sameResult=await (await rpc('commands/execute',{args:{agentId:sameId,line:'/team CASE_quarantined Retry same quarantined project.',submittedAttachments:[]}})).json();assert.equal(sameResult.result.ok,true);const sameState=await team('snapshot',{sessionId:sameId});assert.equal(sameState.context.canStart,false);assert.equal(sameState.snapshot,null);
 const unrelated=await createProject('unrelated');await start(unrelated);const unrelatedState=await settled(unrelated);assert.equal(unrelatedState.snapshot.status,'completed',JSON.stringify(unrelatedState.snapshot));await assertClean(unrelated);assert.equal((await team('snapshot',{sessionId:quarantined.id})).snapshot.lifecycle,'quarantined');
 pass('lost verifier acknowledgement quarantines only the known project; a distinct project completes through native /team');
 assert.equal(childEvents.filter(e=>e.type==='created').length,childEvents.filter(e=>e.type==='disposed').length);
 assert.equal(root.agents.list().length,parents.length);
 assert.ok(!JSON.stringify({modelCalls,toolResults,childEvents}).includes(fakeSecret));
 pass('official child publication and disposal are balanced, with no fake credential in public snapshots or traces');
 console.log('PRODUCTION_HOST_RESULT '+JSON.stringify({packageVersion:packageInfo.version,installedBundle:!!installedArchive,bundleSha256:installedArchive?.sha256||null,duplicatePeer,dshVersion:'0.2.0-rc.2',nativeChildren:childEvents.filter(e=>e.type==='created').length,modelFixtureCalls:modelCalls.length,jevFixtureCalls:jevCalls.length,realVerifierProcesses:shellCalls.length,externalRequests:0}));
 console.log('LIMITS: deterministic provider and Jev replies, fixed-command shell backend, and synthetic projects only. Actual rc.2 core, settings, credentials, HTTP, AgentLoop, spawn, filesystem tools and verifier processes run. No real API credentials, model/API network, Electron visual QA or Windows execution.');
}finally{
 for(const child of activeProcesses)child.kill('SIGKILL');
 for(const handle of parents.reverse())await handle.dispose().catch(()=>{});
 for(const dispose of disposers.reverse())await dispose();
 for(const fork of forks.reverse())await fork.dispose();
 globalThis.fetch=realFetch;
 for(const [path] of evidencePaths)await rm(join(path,'..'),{recursive:true,force:true});
 await rm(temp,{recursive:true,force:true});
}
