import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import vm from 'node:vm';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
const require=createRequire(import.meta.url),dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
let client;window.__ModuleLoader__={load({factory}){client=factory(require);}};vm.runInThisContext(readFileSync(new URL('../lib/client.js',import.meta.url),'utf8'));
const event=(runId='run-a',sessionId='session-a',seq=0)=>({type:'user/message',seq,time:123,surfaceOp:'append',data:{id:'notice-'+runId,role:'user',source:{kind:'dsh-desktop-workflow/team-feedback',form:'notice',phase:'terminal',runId,sessionId,status:'completed'},content:[{type:'text',text:'团队已完成。\n已完成：1 项。'}]}});
test('feedback registration uses official conversation and keyed command/node slot contracts',async()=>{
 const definitions=[],slots=[];const dispose=client.registerTeamChatFeedback({uiConversation:{events:{register(def){definitions.push(def);return()=>definitions.pop();}}},slots:{inject:(_name,fn)=>fn(),register(def,C){const row={...def,C};slots.push(row);return()=>slots.splice(slots.indexOf(row),1);}}});
 assert.equal(definitions.length,1);assert.deepEqual(slots.map(slot=>[slot.name,slot.key]),[['conversation.chat.node','dsh-desktop-workflow-team-feedback'],['conversation.chat.commandview','team']]);
 await dispose();assert.equal(definitions.length,0);assert.equal(slots.length,0);
});
test('terminal row is visibly team-attributed, plain text and exact-session scoped',async()=>{
 const root=createRoot(document.getElementById('root')),state=client.teamFeedbackDefinition.start({}, {event:event(),location:{kind:'session'}}),node={data:{...state,text:'团队已完成。<img src=x onerror=alert(1)>'}};
 try{
  await act(async()=>root.render(React.createElement(client.TeamFeedbackMessage,{node,sessionId:'session-a'})));assert.match(document.body.textContent,/多模型团队 · 运行结果/);assert.match(document.body.textContent,/<img/);assert.equal(document.querySelectorAll('img').length,0);
  await act(async()=>root.render(React.createElement(client.TeamFeedbackMessage,{node,sessionId:'session-b'})));assert.equal(document.body.textContent,'');
 }finally{await act(async()=>root.unmount());}
});
test('native team command renders startup and blocked messages without collapsing their text',async()=>{
 const root=createRoot(document.getElementById('root'));try{
  await act(async()=>root.render(React.createElement(client.TeamCommandMessage,{node:{outcome:null}})));assert.match(document.body.textContent,/检查团队启动条件/);
  await act(async()=>root.render(React.createElement(client.TeamCommandMessage,{node:{outcome:{kind:'success',text:'团队已开始；正在自动检查当前项目。'}}})));assert.match(document.body.textContent,/团队已开始/);
  await act(async()=>root.render(React.createElement(client.TeamCommandMessage,{node:{outcome:{kind:'success',text:'当前主会话不可启动。'}}})));assert.match(document.body.textContent,/不可启动/);
 }finally{await act(async()=>root.unmount());}
});
test('terminal definition deduplicates per run and cannot be folded into an unrelated main turn',()=>{
 const definition=client.teamFeedbackDefinition,match={event:event(),location:{kind:'turn',turn:{turn:3}}},state=definition.start({},match),context={key:'stable',id:'run-a',state,start:match,matches:[match]};
 assert.deepEqual(definition.match(event()),{id:'run-a',role:'start'});assert.equal(definition.match({...event(),surfaceOp:{op:'replace',startSeq:0,endSeq:0}}),null);
 const node=definition.buildViewNode(context);assert.deepEqual(node.location,{kind:'session'});assert.equal(node.visibility,'visible');assert.equal(definition.update(context,{event:event('run-a','session-a',4)}).seq,4);
 assert.equal(definition.match({...event(),data:{...event().data,source:{kind:'user'}}}),null);
});
test('official rc.2 Conversation assembler and Chat builder preserve one visible terminal row across replay',{skip:!process.env.DSH_NODE_MODULES},()=>{
 // This verifies the unmodified official registries, assembler, Chat business
 // Definitions and snapshot builder. Presentation atoms / store notification
 // seams are inert because this copied rc.2 tree lacks clsx and zustand.
 const hostRequire=createRequire(pathToFileURL(join(resolve(process.env.DSH_NODE_MODULES),'..','package.json')));
 const atom=()=>null,atoms=new Proxy({}, {get:()=>atom});
 const store={createSnapshotStore(value){return {getSnapshot:()=>value,set:next=>{value=next;},subscribe:()=>()=>{}};},notifySubscribers(listeners,_label,...args){for(const fn of listeners)fn(...args);},defineStore:value=>value};
 const cache=new Map([['@deepseek-ai/dsh-client-ui-primitives',atoms],['@deepseek-ai/dsh-client-store',store]]);
 function load(name){
  if(cache.has(name))return cache.get(name);
  let path;try{path=hostRequire.resolve(name+'/client');}catch{path=hostRequire.resolve(name);}
  const code=readFileSync(path,'utf8');if(!code.includes('window.__ModuleLoader__.load'))return hostRequire(name);
  const previous=window.__ModuleLoader__;let loaded;window.__ModuleLoader__={load({factory}){loaded=factory(id=>id.startsWith('@deepseek-ai/')?load(id):require(id));}};
  try{vm.runInThisContext(code,{filename:path});}finally{window.__ModuleLoader__=previous;}cache.set(name,loaded);return loaded;
 }
 const assembly=load('@deepseek-ai/dsh-client-ui-conversation'),chat=load('@deepseek-ai/dsh-client-ui-chat'),{Context}=hostRequire('@deepseek-ai/cordis'),root=new Context();
 const events=new assembly.ConversationEventRegistry(root),views=new assembly.ConversationViewRegistry(root),groups=[];
 const stop=Error('Native business definitions registered; presentation fixture stops here');
 assert.throws(()=>chat.apply({effect:fn=>fn(),uiConversation:{events,views,groups:{register:definition=>groups.push(definition)}},uiSession:{provide(){throw stop;}}}),error=>error===stop);
 events.register(client.teamFeedbackDefinition);
 const create=()=>new assembly.ConversationNodeAssembler(events,views,{entries:()=>groups,forTarget:target=>groups.find(definition=>definition.target===target)});
 const assembler=create(),unrelated=create(),entries=[{type:'event',event:{type:'turn/start',seq:0,time:120,data:{turn:1}}},{type:'event',event:event('run-a','session-a',1)}];
 assembler.replaceWindow(entries,false);assembler.activateTarget('chat');assembler.flush();
 const rows=()=>assembler.snapshot('chat').nodes.values().filter(node=>node.kind==='dsh-desktop-workflow-team-feedback');
 assert.equal(rows().length,1);assert.equal(rows()[0].visibility,'visible');assert.deepEqual(rows()[0].location,{kind:'session'});
 assert.equal(assembler.snapshot('chat').nodes.processSource(rows()[0].key).getSnapshot(),undefined,'Notice does not join unrelated turn-process folding');
 assembler.append({type:'event',event:event('run-a','session-a',2)});assembler.flush();assert.equal(rows().length,1,'Same run is deduplicated by native assembler');
 assembler.replaceWindow([...entries,{type:'event',event:event('run-a','session-a',2)}],false);assembler.flush();assert.equal(rows().length,1,'Reconnect/replay does not duplicate the terminal');
 unrelated.replaceWindow([],false);unrelated.activateTarget('chat');unrelated.flush();assert.equal(unrelated.snapshot('chat').nodes.values().length,0);
});
