import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'http://localhost',pretendToBeVisual:true});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,Event:dom.window.Event,IS_REACT_ACT_ENVIRONMENT:true});
HTMLElement.prototype.scrollIntoView=function(){};
const React=await import('react'),{act}=React,{createRoot}=await import('react-dom/client');
const require=createRequire(import.meta.url);let client;
window.__ModuleLoader__={load({factory}){client=factory(require);}};
vm.runInThisContext(await readFile(new URL('../lib/client.js',import.meta.url),'utf8'));
const pause=()=>Promise.resolve();
function fixture(){
 const settings=client.createDefaultTeamSettings();for(const role of Object.keys(settings.roles))settings.roles[role]={provider:'fixture',model:'base'};
 const snapshot={...client.teamDemoSnapshot(),id:'freshness-run',sessionId:'session-a',demo:false,jev:{mode:'live',lane:'medium',round:1,decisions:[]},status:'running',roles:settings.roles,nodes:[{id:'n1',role:'worker',kind:'task',title:'Synthetic running task',status:'running',attempt:1,dependsOn:[]}],edges:[],events:[]};
 let mode='live',cancelResolve,cancels=0;
 const ctx={connection:{rpc:{async call(_channel,endpoint,payload){
  if(endpoint.endsWith('/settings'))return {ok:true,value:{settings,configured:true,keyConfigured:true,disclosureAccepted:true,revision:0}};
  if(endpoint.endsWith('/catalog'))return {ok:true,value:{available:true,providers:[]}};
  if(endpoint.endsWith('/snapshot')){
   if(mode==='error')throw Error('Synthetic offline');
   if(mode==='hanging')return new Promise(()=>{});
   return {ok:true,value:{snapshot,context:{sessionId:payload.sessionId},history:[]}};
  }
  if(endpoint.endsWith('/cancel')){cancels++;return new Promise(resolve=>{cancelResolve=resolve;});}
  throw Error('Unexpected endpoint');
 }}}};
 return {ctx,snapshot,setMode(next){mode=next;},get cancels(){return cancels;},cancelResolve(value){cancelResolve(value);}};
}
async function mounted(h){const root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(client.ConnectedTeam,{ctx:h.ctx,sessionId:'session-a',onOpenSettings(){}})));return {async close(){await act(async()=>root.unmount());}};}
const content=()=>document.body.textContent;

test('polling failure retains snapshot but marks stale, then recovery establishes fresh baseline',async t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval','Date'],now:100000});const h=fixture();const view=await mounted(h);
 try{
  assert.match(content(),/Synthetic running task/);h.setMode('error');await act(async()=>{t.mock.timers.tick(1500);await pause();});
  assert.match(content(),/Synthetic running task/);assert.match(content(),/连接中断|运行状态未确认/);
  h.setMode('live');await act(async()=>{t.mock.timers.tick(1500);await pause();});
  assert.doesNotMatch(content(),/连接中断，保留上次快照/);
 }finally{await view.close();t.mock.timers.reset();}
});

test('a hanging poll cannot leave an old running snapshot looking live after five seconds',async t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval','Date'],now:100000});const h=fixture();const view=await mounted(h);
 try{h.setMode('hanging');await act(async()=>{t.mock.timers.tick(5500);await pause();});assert.match(content(),/快照超过 5 秒未更新/);assert.match(content(),/Synthetic running task/);}
 finally{await view.close();t.mock.timers.reset();}
});

test('repeated cancel clicks dispatch once and reject a cross-session response',async()=>{
 const h=fixture(),view=await mounted(h);
 try{
  const cancel=[...document.querySelectorAll('button')].find(button=>/取消运行|取消团队|停止团队|停止本次运行/.test(button.textContent));assert.ok(cancel,'Cancel control exists');
  await act(async()=>{cancel.click();cancel.click();});assert.equal(h.cancels,1);
  await act(async()=>h.cancelResolve({ok:true,value:{snapshot:{...h.snapshot,id:'other-run',sessionId:'session-b'},context:{sessionId:'session-b'}}}));
  assert.match(content(),/取消响应与当前运行不匹配/);assert.match(content(),/Synthetic running task/);assert.doesNotMatch(content(),/other-run/);
 }finally{await view.close();}
});
