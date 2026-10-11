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
const temp=await mkdtemp(join(tmpdir(),'dsh-feedback-host-')),root=new Context(),forks=[],handles=[],calls=[],statuses=[];
let runtime,commandOff,networkAttempts=0;const fetchBefore=globalThis.fetch;
globalThis.fetch=async()=>{networkAttempts++;throw Error('Network forbidden in feedback regression');};
const pause=ms=>new Promise(done=>setTimeout(done,ms));
async function waitFor(check){for(let n=0;n<1000;n++){const result=await check();if(result)return result;await pause(10);}throw Error('Native feedback fixture timed out');}
const selected=()=>{const s=settings();for(const role of TEAM_ROLES)s.roles[role]={provider:'feedback-fixture',model:role,maxTokens:1024};return s;};
class Provider extends LlmAdapter {
 providerInfo(id){return {id,name:'Inert feedback fixture'};}
 async listModels(){return TEAM_ROLES.map(role=>({provider:'feedback-fixture',id:role,name:role}));}
 async resolveModel(provider,model){return {provider,id:model,name:model,context:{contextWindow:4096}};}
 async *stream(options){
  const child=root.agents.get(options.sessionId);assert.ok(child?.session.header.parentSession,'Feedback must never run the parent model');
  calls.push({sessionId:child.id,parent:child.session.header.parentSession});
  const role=options.model,plan={summary:'Synthetic read-only work',tasks:[{id:'inspect',role:'explorer',title:'Inspect synthetic input',instructions:'Return the synthetic result; use no tools.',dependsOn:[]}]};
  const value=role==='reviewer'?{verdict:'approve',summary:'Synthetic review',issues:[]}:plan;
  const block=['planner','coordinator','reviewer'].includes(role)?{type:'tool-call',id:randomUUID(),name:'structured_output',arguments:JSON.stringify(value)}:{type:'text',text:'Synthetic bounded result'};
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
 await mount({name:'feedback-runtime-fixture',inject:['agents','subagents','llm','tools','sandboxPolicy','sessions'],apply(ctx){runtime=createTeamRuntime(ctx,{},deps);}});await waitFor(()=>runtime);commandOff=registerTeamCommand(root,()=>runtime);
 const result=await root.commands.execute(a.agent,'/team Synthetic original-session result',[],new AbortController().signal);
 assert.equal(result.result.kind,'success');assert.match(result.result.text,/团队已开始/);
 await waitFor(()=>a.agent.session.snapshotEvents().some(event=>event.data?.source?.kind===TEAM_FEEDBACK_SOURCE));
 const events=a.agent.session.snapshotEvents(),notices=events.filter(event=>event.data?.source?.kind===TEAM_FEEDBACK_SOURCE);
 assert.equal(notices.length,1);assert.match(notices[0].data.content[0].text,/团队已完成/);
 assert.equal(events.filter(event=>event.type==='command/run').length,1);assert.equal(events.filter(event=>event.type==='command/done').length,1);
 assert.equal(events.filter(event=>event.type==='turn/start').length,0);assert.equal(statuses.filter(event=>event.status==='running').length,0);assert.equal(a.agent.status,'idle');
 assert.equal(b.agent.session.snapshotEvents().filter(event=>event.data?.source?.kind===TEAM_FEEDBACK_SOURCE).length,0);
 assert.ok(calls.length>0);assert.ok(calls.every(call=>call.parent===a.agent.id));
 assert.equal(a.agent.session.deriveMessages().filter(message=>message.source.kind===TEAM_FEEDBACK_SOURCE).length,1,'Bounded notice is future model context, without waking the model');
 await waitFor(()=>runtime.snapshot(a.agent.id).snapshot.chatFeedback?.status==='durable');
 await runtime.dispose();assert.equal(a.agent.session.snapshotEvents().filter(event=>event.data?.source?.kind===TEAM_FEEDBACK_SOURCE).length,1);
 await a.dispose();
 const handle=await root.sessionPersistence.open('feedback-origin','read');try{const loaded=await handle.read();assert.equal(loaded.events.filter(event=>event.data?.source?.kind===TEAM_FEEDBACK_SOURCE).length,1);}finally{await handle.close();}
 // Fresh backend ensures the result was decoded from disk, not only an in-memory memo.
 const cold=new Context(),storage=cold.plugin(Persistence,{root:join(temp,'logs'),compression:'none'});await storage;
 try{const read=await cold.sessionPersistence.open('feedback-origin','read');try{const loaded=await read.read();assert.equal(loaded.events.filter(event=>event.data?.source?.kind===TEAM_FEEDBACK_SOURCE).length,1);}finally{await read.close();}}finally{await storage.dispose();}
 assert.equal(networkAttempts,0);
 console.log('PASS official rc.2 /team immediate acknowledgment; real native child completion; one original-session attributed notice; no parent model/turn; no cross-session delivery; JSONL cold reload; no network or credentials.');
}finally{
 commandOff?.();await runtime?.dispose();for(const handle of handles.reverse())await handle.dispose();for(const fork of forks.reverse())await fork.dispose();globalThis.fetch=fetchBefore;await rm(temp,{recursive:true,force:true});
}
