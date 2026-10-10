import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createTeamRuntime} from '../src/team-runtime.js';
import {createSetupStore} from '../src/team-setup.js';
import {validateConfig,validateProduction,selectRoleModel,DEFAULT_LIMITS} from '../src/team-contracts.js';
import {teamHost,fixtureDependencies,settings as fixtureSettings,waitFor} from './helpers/team-host.mjs';

const productionSettings=()=>{
 const {roles,limits,reviewPlan}=fixtureSettings();
 return {roles,limits:{...DEFAULT_LIMITS,...limits},reviewPlan,budget:{enabled:false,tokenLimit:0},routing:{enabled:true,roles:{worker:{weak:{provider:'fixture',model:'weak',maxTokens:1024},strong:{provider:'fixture',model:'strong',maxTokens:2048}}}},jev:{model:'jev-latest',trace:true,shadow:{enabled:false,model:'',maxCalls:2}}};
};
const fakeStore=()=>{
 const config={},updates=[];let revision=0;
 const ctx={get(name){if(name==='credentials')return {describe:async()=>({configured:true,writable:true})};if(name==='settings')return {writable:true,describe:()=>[{ns:'production-test',revision}],async update(ns,patch,expected){assert.equal(ns,'production-test');if(expected!==revision)throw Object.assign(Error('stale'),{code:'SETTINGS_CONFLICT'});updates.push(structuredClone(patch));config.teamSetup=structuredClone(patch.teamSetup);revision++;}};}};
 return {config,updates,store:createSetupStore(ctx,config,{entryId:'production-test'})};
};

test('production defaults are detached and opt-in budget/routing remain disabled',()=>{
 const first=validateProduction(),second=validateProduction();
 assert.deepEqual(first,{budget:{enabled:false,tokenLimit:0},routing:{enabled:false,roles:{}},jev:{model:'jev-latest',trace:true,shadow:{enabled:false,model:'',maxCalls:2}}});
 first.budget.enabled=true;first.routing.roles.worker={};first.jev.shadow.model='jev-9.9.9';
 assert.equal(second.budget.enabled,false);assert.deepEqual(second.routing.roles,{});assert.equal(second.jev.shadow.model,'');
});

test('production settings preserve all controls across store recreation and stale updates fail',async()=>{
 const {store,config,updates}=fakeStore();const value=productionSettings();value.budget={enabled:true,tokenLimit:9000};
 const initial=await store.refresh();const saved=await store.configure({settings:value,disclosureAccepted:true,expectedRevision:initial.revision});
 assert.equal(saved.configured,true);assert.deepEqual(saved.settings,value);assert.equal(updates.length,1);
 await assert.rejects(store.configure({settings:value,disclosureAccepted:true,expectedRevision:initial.revision}),e=>e.code==='SETTINGS_CONFLICT');
 const remounted=createSetupStore({get:name=>name==='credentials'?{describe:async()=>({configured:true})}:undefined},config,{entryId:'production-test'});
 assert.deepEqual((await remounted.refresh()).settings,value);
 assert.ok(!Object.hasOwn(saved,'apiKey'));assert.ok(!Object.hasOwn(updates[0].teamSetup,'apiKey'));
});

test('routing chooses only explicit candidates and falls back to the configured base',()=>{
 const value=productionSettings();const config=validateConfig({sessionId:'route-session',goal:'Synthetic route',...value,jev:{...value.jev,enabled:true,disclosureAccepted:true}});
 assert.equal(selectRoleModel(config,'worker','small').model.model,'weak');
 assert.equal(selectRoleModel(config,'worker','medium').model.model,'model');
 assert.equal(selectRoleModel(config,'worker','high').model.model,'strong');
 assert.equal(selectRoleModel(config,'worker','escalate').model.model,'strong');
 assert.equal(selectRoleModel(config,'planner','small').model.model,'model');
 config.routing.enabled=false;assert.equal(selectRoleModel(config,'worker','high').model.model,'model');
});

test('runtime validates alternate configured model candidates before native settings are written',async()=>{
 const host=teamHost({workspace:'/fixture/production-validation'}),setup=fakeStore();
 const runtime=createTeamRuntime(host.ctx,{}, {...fixtureDependencies(),setup:setup.store});
 try{
  const value=productionSettings();
  await assert.rejects(runtime.configure({settings:value,disclosureAccepted:true,expectedRevision:0}),error=>error.code==='MODEL_NOT_CONFIGURED');
  assert.equal(setup.updates.length,0);assert.equal(host.calls.length,0);
  host.ctx.llm.listModels=async()=>['model','weak','strong'].map(id=>({id,name:id}));
  const saved=await runtime.configure({settings:value,disclosureAccepted:true,expectedRevision:0});
  assert.equal(saved.configured,true);assert.deepEqual(saved.settings.routing,value.routing);assert.equal(setup.updates.length,1);assert.equal(host.calls.length,0);
 }finally{await runtime.dispose();}
});

test('native command forwards saved production settings and public run summary',async()=>{
 const host=teamHost({sessionId:'production-command',workspace:'/fixture/production-command'}),value=productionSettings();
 host.ctx.llm.listModels=async()=>['model','weak','strong'].map(id=>({id,name:id}));
 const setup={current:()=>value,view:()=>({configured:true,settings:value,disclosureAccepted:true}),refresh:async()=>setup.view()};
 const runtime=createTeamRuntime(host.ctx,{}, {...fixtureDependencies(),setup});
 try{
  const result=await runtime.command({agent:host.parent,commandId:'production-command-1',rawInput:'Only the synthetic fixture',signal:new AbortController().signal});
  assert.equal(result.kind,'success');
  await waitFor(()=>runtime.snapshot(host.parent.id).snapshot?.finishedAt);
  const snapshot=runtime.snapshot(host.parent.id).snapshot;
  assert.equal(snapshot.status,'completed');assert.equal(snapshot.production.budget.enabled,false);assert.equal(snapshot.production.routing.enabled,true);assert.equal(snapshot.production.trace.enabled,true);
  assert.ok(snapshot.production.routing.decisions.length>0);assert.equal(snapshot.production.jev.primary.requestedModel,'jev-latest');
  assert.equal(snapshot.production.jev.shadow.enabled,false);
 }finally{await runtime.dispose();}
});

test('official production /team acceptance uses native runtime and inert external transports',{
 skip:!process.env.DSH_NODE_MODULES,
 timeout:120000,
},()=>{
 const result=spawnSync(process.execPath,['--expose-internals',fileURLToPath(new URL('../scripts/verify-production-host.mjs',import.meta.url))],{
  env:{PATH:process.env.PATH,DSH_NODE_MODULES:process.env.DSH_NODE_MODULES,LANG:'C.UTF-8',...Object.fromEntries(['DSH_PRODUCTION_BUNDLE','DSH_PNPM_STORE','DSH_PNPM_CLI'].filter(key=>process.env[key]).map(key=>[key,process.env[key]]))},
  encoding:'utf8',timeout:110000,maxBuffer:2*1024*1024,
 });
 assert.equal(result.error,undefined,result.error?.message);
 assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
 for(const finding of [
  'real SettingsForms and ConfigEditor persist budget',
  'native Loader remount restores production controls',
  'all production HTTP routes enforce real BrowserAuth',
  'actual native /team reaches AgentLoop',
  'pinned shadow disagreements remain observational',
  'real failing independent tests override',
  'native children follow small weak, medium base and high strong',
  'cancellation reaches the real native provider signal',
  'production deadline aborts native model work',
  'enabled budget observes actual official llm/stream',
  'insufficient production budget refuses the native request',
  'missing native usage retains the full reservation',
  'lost verifier acknowledgement quarantines only the known project',
 ])assert.ok(result.stdout.includes(finding),'Missing acceptance result: '+finding);
 const summary=JSON.parse(result.stdout.split('\n').find(line=>line.startsWith('PRODUCTION_HOST_RESULT ')).slice('PRODUCTION_HOST_RESULT '.length));
 if(process.env.DSH_PRODUCTION_BUNDLE){assert.equal(summary.installedBundle,true);assert.equal(summary.duplicatePeer,true);assert.match(summary.bundleSha256,/^[a-f0-9]{64}$/);}
 assert.equal(summary.packageVersion,'0.6.0');assert.equal(summary.dshVersion,'0.2.0-rc.2');assert.equal(summary.externalRequests,0);
 assert.ok(summary.nativeChildren>=30);assert.ok(summary.realVerifierProcesses>=25);
 assert.ok(!result.stdout.includes('synthetic-production-fixture-'));assert.ok(!result.stderr.includes('synthetic-production-fixture-'));
});
