#!/usr/bin/env node
/** Real rc.2 client Cordis fibers, Typert registry and Remote services.
 * Only slot/sidebar presentation and in-memory RPC responses are fixtures.
 * No host profile, credentials, network, models or Jev services are loaded.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';

assert.ok(process.env.DSH_NODE_MODULES, 'Point DSH_NODE_MODULES at an approved official rc.2 installation');
const modules=resolve(process.env.DSH_NODE_MODULES);
const hostRequire=createRequire(pathToFileURL(join(modules,'..','package.json')));
const localRequire=createRequire(import.meta.url);
assert.equal(JSON.parse(await readFile(join(modules,'@deepseek-ai/dsh/package.json'),'utf8')).version,'0.2.0-rc.2');
const {Context}=hostRequire('@deepseek-ai/cordis');
const dom=new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>',{url:'http://localhost'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,Event:dom.window.Event,MouseEvent:dom.window.MouseEvent,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
const React=await import('react');
const {act}=React;
const {createRoot}=await import('react-dom/client');
const originalFetch=globalThis.fetch;
let networkAttempts=0;
globalThis.fetch=async()=>{networkAttempts++;throw Error('Network is forbidden in the client contract regression');};
async function clientModule(file,require) {
  let result;
  window.__ModuleLoader__={load({factory}){result=factory(require);}};
  vm.runInThisContext(await readFile(file,'utf8'),{filename:String(file)});
  assert.ok(result,'Client factory loaded');
  return result;
}
const registry=await clientModule(hostRequire.resolve('@deepseek-ai/dsh-typert-registry/client'),hostRequire);
const gateway=await clientModule(hostRequire.resolve('@deepseek-ai/dsh-api-gateway/client'),hostRequire);
const remotes=await clientModule(hostRequire.resolve('@deepseek-ai/dsh-api-remotes/client'),hostRequire);
const client=await clientModule(new URL('../lib/client.js',import.meta.url),localRequire);
const root=new Context();
const forks=[];
const registrations=[];
const opens=[];
const calls=[];
let catalogFailure=false;
const setup={settings:client.createDefaultTeamSettings(),configured:false,keyConfigured:false,disclosureAccepted:false,revision:0,writable:true};
const catalog={available:true,providers:[]};
// All providers are siblings. root.provide would accidentally allow inherited
// service access and turn this regression into the same false positive as a POJO.
forks.push(root.plugin({name:'client-contract-fixtures',apply(ctx){
  ctx.provide('connection',{
    isLoopback:true,generation:{getSnapshot:()=>undefined,subscribe:()=>()=>{}},
    start:()=>({stop(){}}),registerGenerationSource:()=>()=>{},
    rpc:{
      open(){throw Error('No stream may open in this regression');},
      async call(channel,endpoint,payload){
        assert.equal(channel,'/api');calls.push(endpoint);
        if(endpoint==='credentials/describe'){
          assert.deepEqual(payload.args,[['DSH_TEAM_JEV_API_KEY']]);
          return {ok:true,value:{DSH_TEAM_JEV_API_KEY:{configured:false,writable:false}}};
        }
        if(endpoint==='dsh-desktop-workflow/team/settings')return {ok:true,value:setup};
        if(endpoint==='dsh-desktop-workflow/team/catalog')return catalogFailure?{ok:false,error:{message:'Fixture catalog unavailable'}}:{ok:true,value:catalog};
        if(endpoint==='dsh-desktop-workflow/team/snapshot')return {ok:true,value:{snapshot:null,context:{sessionId:'fixture-session',setupRequired:true}}};
        throw Error('Unexpected RPC (writes and model calls are forbidden): '+endpoint);
      },
    },
  });
  ctx.provide('slots',{inject(_name,fn){return fn();},register(definition,Component){const entry={...definition,Component};registrations.push(entry);return()=>registrations.splice(registrations.indexOf(entry),1);}});
  ctx.provide('sidebarRightTabs',{register:()=>()=>{}});
  ctx.provide('sidebarRight',{mounted:{getSnapshot:()=> 'fixture-session',subscribe:()=>()=>{}},openTab:(...args)=>opens.push(args)});
}}));
await Promise.all(forks);
for(const module of [registry,gateway,remotes]){
  const fork=root.plugin(module);forks.push(fork);await fork;
}
for(let attempt=0;attempt<100 && !root.get('remote.credentials');attempt++)await new Promise(done=>setTimeout(done,10));
assert.ok(root.get('remote.credentials'),'Official credentials namespace finished mounting; states '+forks.map(fork=>fork.state).join(',')+' services '+['connection','typert','remote'].map(name=>name+':'+Boolean(root.get(name))).join(','));

let mounted,plugin;
async function unmount(){if(mounted){await act(async()=>mounted.unmount());mounted=undefined;}}
async function load(inject){
  await unmount();if(plugin)await plugin.dispose();
  plugin=root.plugin({name:'workflow-client-regression',inject,apply:client.apply});
  await plugin;
  for(let attempt=0;attempt<100 && registrations.length!==2;attempt++)await new Promise(done=>setTimeout(done,10));
  assert.equal(registrations.length,2,'Settings and sidebar callbacks were registered');
}
async function render(name,props){
  await unmount();
  const entry=registrations.find(item=>item.name===name);assert.ok(entry);
  mounted=createRoot(document.getElementById('root'));
  await act(async()=>{mounted.render(React.createElement(entry.Component,props));});
}
try{
  await load(client.inject.filter(name=>name!=='remote'));
  await render('settings.section',{close(){}});
  assert.match(document.querySelector('[role=alert]')?.textContent||'',/cannot get property "remote" without inject/);
  assert.equal(calls.filter(name=>name==='credentials/describe').length,0);
  console.log('PASS negative control: rc.2 sibling fibers reject missing remote injection with the exact Windows error');

  calls.length=0;
  await load(client.inject);
  await render('settings.section',{close(){}});
  assert.equal(document.querySelector('[role=alert]')?.textContent??null,null,'Settings callback must retain both Remote service injections');
  assert.equal(calls.filter(name=>name==='credentials/describe').length,1);
  assert.equal(document.querySelectorAll('.tm-model-config').length,6);
  assert.ok(!document.body.textContent.includes('正在读取宿主模型目录'));
  assert.ok(document.querySelector('input[type=password]').disabled,'Read-only fixture credential status reached the form');
  console.log('PASS actual client settings callback: six roles, native credential describe and completed empty catalog');

  catalogFailure=true;
  await render('settings.section',{close(){}});
  assert.match(document.querySelector('[role=alert]')?.textContent||'',/Fixture catalog unavailable/);
  assert.ok(!document.body.textContent.includes('正在读取宿主模型目录'),'Failed catalog must stop claiming to load');
  catalogFailure=false;
  const refresh=[...document.querySelectorAll('button')].find(button=>button.textContent==='刷新设置');
  assert.ok(refresh);assert.equal(refresh.disabled,false);
  await act(async()=>refresh.click());
  assert.equal(document.querySelector('[role=alert]')?.textContent??null,null);
  console.log('PASS failed catalog leaves loading state and refresh recovers through the actual settings callback');

  await act(async()=>{root.emit('command/executed','fixture-session','team',{kind:'success'});});
  assert.deepEqual(opens.at(-1),['dsh-desktop-workflow',{params:{view:'settings'}}]);
  await render('sidebar.right.pane.tab',{sessionId:'fixture-session',useTabInfo:()=>({tab:{navigation:{params:{view:'settings'},revision:1}}})});
  assert.equal(document.querySelector('[role=alert]')?.textContent??null,null);
  assert.equal(document.querySelectorAll('.tm-model-config').length,6);
  console.log('PASS native command acknowledgment opens setup and sidebar callback retains Remote injection');
  assert.equal(networkAttempts,0);
  assert.ok(calls.every(name=>name==='credentials/describe'||/^dsh-desktop-workflow\/team\/(settings|catalog|snapshot)$/.test(name)));
  console.log('Client host contract regression passed. Actual rc.2 Cordis/Typert/Remote; synthetic read-only transport and JSDOM, no Electron visual assertion, credentials, model or Jev calls.');
}finally{
  await unmount();if(plugin)await plugin.dispose();
  for(const fork of forks.reverse())await fork.dispose();
  globalThis.fetch=originalFetch;dom.window.close();
}
