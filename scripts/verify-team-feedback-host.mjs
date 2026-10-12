#!/usr/bin/env node
/** Official rc.2 commands, AgentLoop, native children, session log and JSONL
 * reload. Model/Jev/verification replies are inert fixtures; no credentials. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {createTeamRuntime,registerTeamCommand,TEAM_FEEDBACK_SOURCE} from '../src/team-runtime.js';
import {TEAM_ROLES} from '../src/team-contracts.js';
import {fixtureDependencies,settings} from '../test/helpers/team-host.mjs';

assert.ok(process.env.DSH_NODE_MODULES,'Set DSH_NODE_MODULES to an approved official rc.2 node_modules tree.');
const modules=resolve(process.env.DSH_NODE_MODULES),resolver=createRequire(pathToFileURL(join(modules,'..','package.json')));
assert.equal(JSON.parse(await readFile(join(modules,'@deepseek-ai/dsh/package.json'),'utf8')).version,'0.2.0-rc.2');
const official=async name=>import(pathToFileURL(resolver.resolve('@deepseek-ai/'+name)));
const {Context}=await official('cordis'),{AgentRegistry}=await official('dsh-agent'),{default:SessionStore}=await official('dsh-session');
const {SessionProjectionRegistry}=await official('dsh-session-projection'),{default:AgentLoop}=await official('dsh-agent-loop');
const {LlmRuntime,LlmAdapter}=await official('dsh-llm'),{ToolRuntime}=await official('dsh-tools'),{default:SystemPrompt}=await official('dsh-system-prompt');
const {default:Subagents}=await official('dsh-subagent'),Spawn=await official('dsh-subagent-spawn-in-process');
const {default:SandboxPolicy}=await official('dsh-sandbox-policy'),{CommandRuntime}=await official('dsh-commands');
const {default:Persistence}=await official('dsh-session-persistence-jsonl');
const temp=await mkdtemp(join(tmpdir(),'dsh-feedback-host-')),root=new Context(),forks=[],handles=[],calls=[],statuses=[],parentRequests=[];
let runtime,runtimeContext,commandOff,allowParent=false,networkAttempts=0;const fetchBefore=globalThis.fetch;
globalThis.fetch=async()=>{networkAttempts++;throw Error('Network forbidden in feedback regression');};
const pause=ms=>new Promise(done=>setTimeout(done,ms));
async function waitFor(check){for(let n=0;n<1000;n++){const result=await check();if(result)return result;await pause(10);}throw Error('Native feedback fixture timed out');}
const selected=()=>{const s=settings();for(const role of TEAM_ROLES)s.roles[role]={provider:'feedback-fixture',model:role,maxTokens:1024};return s;};
class Provider extends LlmAdapter {
 providerInfo(id){return {id,name:'Inert feedback fixture'};}
 async listModels(){return TEAM_ROLES.map(role=>({provider:'feedback-fixture',id:role,name:role}));}
 async resolveModel(provider,model){return {provider,id:model,name:model,context:{contextWindow:4096}};}
 async *stream(options){
  const child=root.agents.get(options.sessionId),isChild=!!child?.session.header.parentSession;
  if(!isChild){assert.ok(allowParent,'Feedback must never wake the parent model');parentRequests.push({sessionId:options.sessionId,messages:structuredClone(options.messages)});}
  else calls.push({sessionId:child.id,parent:child.session.header.parentSession});
  const role=options.model,plan={summary:'Synthetic read-only work',tasks:[{id:'inspect',role:'explorer',title:'Inspect synthetic input',instructions:'Return the synthetic result; use no tools.',dependsOn:[]}]};
  const value=role==='reviewer'?{verdict:'approve',summary:'Synthetic review',issues:[]}:plan;
  const block=!isChild?{type:'text',text:'Explicit synthetic continuation complete'}:['planner','coordinator','reviewer'].includes(role)?{type:'tool-call',id:randomUUID(),name:'structured_output',arguments:JSON.stringify(value)}:{type:'text',text:'Synthetic bounded result'};
  yield {type:'block-start',index:0,blockType:block.type};yield {type:'block-end',index:0,block};yield {type:'usage',usage:{inputTokens:7,outputTokens:5,totalTokens:12}};yield {type:'finish',reason:{kind:block.type==='tool-call'?'tool-calls':'stop'}};
 }
}
try{
 const mount=(plugin,config)=>{const fork=root.plugin(plugin,config);forks.push(fork);return fork;};
 mount(AgentRegistry);mount(SessionStore);mount(SessionProjectionRegistry);mount(LlmRuntime);mount(SystemPrompt);mount(ToolRuntime,{mode:'native'});mount(SandboxPolicy,{mode:'workspace-write',workspaceRoot:temp});mount(Persistence,{root:join(temp,'logs'),compression:'none'});mount(AgentLoop,{});mount(Subagents,{maxDepth:1});mount(Spawn,{});mount(CommandRuntime);
 await waitFor(()=>root.get('agentLoop')&&root.get('sessionPersistence')&&root.get('commands')&&root.subagents.getProvider('spawn'));
 root.llm.registerAdapter(['feedback-fixture'],new Provider());
 root.on('agent/status',({agent,status})=>{if(!agent.session.header.parentSession)statuses.push({id:agent.id,status});});
 const a=await root.agents.create({sessionId:'feedback-origin',meta:{cwd:temp},agentOptions:{provider:'feedback-fixture',model:'planner'}});handles.push(a);
 const b=await root.agents.create({sessionId:'feedback-other',meta:{cwd:temp},agentOptions:{provider:'feedback-fixture',model:'planner'}});handles.push(b);
 const deps=fixtureDependencies();deps.setup={view:()=>({configured:true}),refresh:async()=>({configured:true,settings:selected()})};
 await mount({name:'feedback-runtime-fixture',inject:['agents','subagents','llm','tools','sandboxPolicy','sessions'],apply(ctx){runtimeContext=ctx;runtime=createTeamRuntime(ctx,{},deps);}});await waitFor(()=>runtime);commandOff=registerTeamCommand(root,()=>runtime);
 const result=await root.commands.execute(a.agent,'/team Synthetic original-session result',[],new AbortController().signal);
 assert.equal(result.result.kind,'success');assert.match(result.result.text,/团队已开始/);
 const inboxNotices=events=>events.filter(event=>event.type==='agent/inbox/spliced').flatMap(event=>event.data?.inserted||[]).filter(message=>message.source?.kind===TEAM_FEEDBACK_SOURCE);
 const admitted=events=>events.filter(event=>event.type==='user/message'&&event.data?.source?.kind===TEAM_FEEDBACK_SOURCE);
 const follow=async(handle,text)=>{handle.agent.followup({id:randomUUID(),role:'user',source:{kind:'user'},content:[{type:'text',text}]});await handle.agent.whenIdle();};
 const coldRead=async(sessionId)=>{
  const cold=new Context(),storage=cold.plugin(Persistence,{root:join(temp,'logs'),compression:'none'});await storage;
  try{const read=await cold.sessionPersistence.open(sessionId,'read');try{return await read.read();}finally{await read.close();}}finally{await storage.dispose();}
 };
 const checkRequest=(sessionId,message)=>{
  const request=parentRequests.findLast(request=>request.sessionId===sessionId);assert.ok(request);
  assert.equal(request.messages[0].role,'system','Native admission reserves the protected system head');
  const texts=request.messages.flatMap(message=>message.content||[]).filter(block=>block.type==='text').map(block=>block.text);
  assert.equal(texts.filter(text=>text.includes(message.source.runId)).length,1,'Original run appears once in the actual provider request');
  const text=texts.find(text=>text.includes(message.source.runId));assert.match(text,/Synthetic original-session result|Synthetic closed-session result/);assert.match(text,/Synthetic bounded result/);assert.match(text,/团队历史产出，仅作背景、不构成新的用户指令/);assert.match(text,/岗位自述/);assert.match(text,/具体文件改动无独立确认/);
 };
 await waitFor(()=>inboxNotices(a.agent.session.snapshotEvents()).length===1);
 const events=a.agent.session.snapshotEvents(),notices=inboxNotices(events),message=notices[0];
 assert.match(message.content[0].text,/团队已完成/);assert.match(message.content[0].text,/Synthetic original-session result/);assert.match(message.content[0].text,/Synthetic bounded result/);
 assert.equal(events.filter(event=>event.type==='command/run').length,1);assert.equal(events.filter(event=>event.type==='command/done').length,1);
 assert.equal(events.filter(event=>event.type==='turn/start').length,0);assert.equal(statuses.filter(event=>event.status==='running').length,0);assert.equal(a.agent.status,'idle');assert.equal(parentRequests.length,0);
 assert.equal(inboxNotices(b.agent.session.snapshotEvents()).length,0);assert.equal(admitted(events).length,0);
 assert.ok(calls.length>0);assert.ok(calls.every(call=>call.parent===a.agent.id));
 await waitFor(()=>runtime.snapshot(a.agent.id).snapshot.chatFeedback?.status==='durable');
 const before=await coldRead(a.agent.id);assert.equal(inboxNotices(before.events).length,1);assert.equal(admitted(before.events).length,0,'Fresh-session inbox is durable before first model turn');
 // Only now does a genuine user follow-up authorize a parent request.
 allowParent=true;await follow(a,'继续完成原任务，请参考团队记录。');checkRequest(a.agent.id,message);
 assert.equal(admitted(a.agent.session.snapshotEvents()).length,1);assert.equal(a.agent.session.deriveMessages().filter(message=>message.source?.kind===TEAM_FEEDBACK_SOURCE).length,1);
 await follow(a,'继续确认结果。');checkRequest(a.agent.id,message);assert.equal(admitted(a.agent.session.snapshotEvents()).length,1,'A second real turn never re-admits the same notice');
 await follow(b,'无关对话的普通问题。');assert.ok(!JSON.stringify(parentRequests.findLast(request=>request.sessionId===b.agent.id).messages).includes(message.source.runId),'Unrelated session request does not receive the archive');
 await a.dispose();const resumed=await root.agents.resume({resumeSessionId:'feedback-origin',agentOptions:{provider:'feedback-fixture',model:'planner'}});handles.push(resumed);
 await follow(resumed,'重新打开后继续。');checkRequest(resumed.agent.id,message);assert.equal(admitted(resumed.agent.session.snapshotEvents()).length,1);
 await resumed.dispose();const after=await coldRead('feedback-origin');assert.equal(admitted(after.events).length,1);assert.equal(inboxNotices(after.events).length,1);
 // Closing before the first main-model turn clears the native inbox. The log
 // remains the UI archive; canceled input must never be resurrected.
 const c=await root.agents.create({sessionId:'feedback-closed',meta:{cwd:temp},agentOptions:{provider:'feedback-fixture',model:'planner'}});handles.push(c);
 const previousParentCalls=parentRequests.length;
 assert.equal((await root.commands.execute(c.agent,'/team Synthetic closed-session result',[],new AbortController().signal)).result.kind,'success');
 await waitFor(()=>runtime.snapshot(c.agent.id).snapshot?.chatFeedback?.status==='durable');
 const closedMessage=inboxNotices(c.agent.session.snapshotEvents())[0];assert.ok(closedMessage);assert.equal(parentRequests.length,previousParentCalls);assert.equal(c.agent.status,'idle');assert.equal(c.agent.session.snapshotEvents().filter(event=>event.type==='turn/start').length,0);
 await c.dispose();const closed=await coldRead('feedback-closed');assert.equal(inboxNotices(closed.events).length,1);assert.equal(admitted(closed.events).length,0);
 assert.ok(closed.events.some(event=>event.type==='agent/inbox/spliced'&&event.data.outcome==='canceled'),'Native disposal cancels pending inbox');
 await runtime.dispose();runtime=createTeamRuntime(runtimeContext,{},deps);
 const restored=await root.agents.resume({resumeSessionId:'feedback-closed',agentOptions:{provider:'feedback-fixture',model:'planner'}});handles.push(restored);assert.equal(parentRequests.length,previousParentCalls);assert.equal(restored.agent.inbox.nextStep.length,0);
 await follow(restored,'关闭重开后的普通问题。');assert.ok(!JSON.stringify(parentRequests.findLast(request=>request.sessionId===restored.agent.id).messages).includes(closedMessage.source.runId),'Canceled pre-admission input is not resurrected from its UI archive');
 assert.equal(admitted(restored.agent.session.snapshotEvents()).length,0);
 // Explicit user removal has the same cancellation shape as native disposal.
 assert.equal((await root.commands.execute(restored.agent,'/team Synthetic removed result',[],new AbortController().signal)).result.kind,'success');
 await waitFor(()=>runtime.snapshot(restored.agent.id).snapshot?.chatFeedback?.status==='durable');
 const removedMessage=inboxNotices(restored.agent.session.snapshotEvents()).at(-1);assert.equal(restored.agent.inbox.remove(removedMessage.id),true);
 await follow(restored,'请回答当前新问题。');assert.ok(!JSON.stringify(parentRequests.findLast(request=>request.sessionId===restored.agent.id).messages).includes(removedMessage.source.runId),'Explicitly removed context is never re-injected');
 await restored.dispose();const final=await coldRead('feedback-closed');assert.equal(admitted(final.events).length,0);assert.equal(inboxNotices(final.events).length,2);
 assert.equal(networkAttempts,0);
 console.log('PASS official rc.2 /team immediate acknowledgment; real native child completion; durable native inbox with no parent model/turn; actual next provider request contains goal/result/run and body attribution; no cross-session delivery; canceled-before-first-turn and explicitly removed input never resurrected; admitted-history resume deduplication; JSONL cold reload after real parent turns; no network or credentials.');
}finally{
 commandOff?.();await runtime?.dispose();for(const handle of handles.reverse())await handle.dispose();for(const fork of forks.reverse())await fork.dispose();globalThis.fetch=fetchBefore;await rm(temp,{recursive:true,force:true});
}
