#!/usr/bin/env node
/** Offline acceptance against official rc.2 Cordis, AgentLoop, native spawn,
 * ToolRuntime, Session event log/projections, Todo, filesystem and ripgrep tools.
 * Only the model adapter and sandbox-policy lookup are deterministic fixtures.
 * Real glob/read operate exclusively on this script's disposable directory.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp, mkdir, readFile, writeFile, rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {createExecutionAdapter,TeamHostError} from '../src/host-adapter.js';

const modules=process.env.DSH_NODE_MODULES;
const resolver=createRequire(modules?pathToFileURL(join(resolve(modules),'..','package.json')):import.meta.url);
const official=async name=>import(pathToFileURL(resolver.resolve('@deepseek-ai/'+name)));
const officialManifest=resolver.resolve('@deepseek-ai/dsh/package.json');
assert.equal(JSON.parse(await readFile(officialManifest,'utf8')).version,'0.2.0-rc.2');
const {Context}=await official('cordis');
const {AgentRegistry}=await official('dsh-agent');
const {AgentLoop}=await official('dsh-agent-loop');
const {SessionStore}=await official('dsh-session');
const {SessionProjectionRegistry}=await official('dsh-session-projection');
const {LlmRuntime,LlmAdapter}=await official('dsh-llm');
const {ToolRuntime,defineTool}=await official('dsh-tools');
const {default:SystemPrompt}=await official('dsh-system-prompt');
const {SubagentRuntime}=await official('dsh-subagent');
const Spawn=await official('dsh-subagent-spawn-in-process');
const Todo=await official('dsh-tool-todo');
const FsTools=await official('dsh-tool-fs');
const SearchTools=await official('dsh-tool-fs-search');
const {default:LocalFileSystem}=await official('dsh-fs-local');
const {default:LocalSubprocessRuntime}=await official('dsh-subprocess-local');
const {scopeOf,bindScopeParent}=await official('dsh-scope');

const roles=['planner','explorer','reviewer','researcher','worker'];
const outputSchema={type:'object',properties:{ok:{type:'boolean'}},required:['ok'],additionalProperties:false};
const failures=[];
let passed=0,networkAttempts=0,modelCalls=0,realReadSuccesses=0,realGlobSuccesses=0;
const fetchBefore=globalThis.fetch;
globalThis.fetch=async()=>{networkAttempts++;throw new Error('Network is forbidden in the offline tool-contract fixture');};
const cases=[];
const check=async(name,fn)=>{
  try{await fn();passed++;cases.push({name,passed:true});console.log('PASS '+name);}
  catch(error){failures.push({name,error});cases.push({name,passed:false});console.error('FAIL '+name+'\n'+error.stack);}
};
const textOf=result=>(result?.content??[]).filter(item=>item.type==='text').map(item=>item.text).join('\n');
const todoArgs=(status='in_progress')=>({todos:[{content:'Inspect the disposable fixture',status}]});
const call=(name,args)=>({name,args});
const finish=()=>call('structured_output',{ok:true});
const inertTool=(name,onExecute=()=>{})=>defineTool({
  name,description:'Offline negative-control capability',parameters:{},
  output:{schema:{type:'object',properties:{ok:{type:'boolean',required:true}},additionalProperties:false},render:()=>[{type:'text',text:'offline control'}]},
  execute:async()=>{onExecute();return {ok:true};},
});

async function fixture({todoScope='root',profileAnchor}={}){
  const temp=await mkdtemp(join(tmpdir(),'dsh-tool-contract-'));
  const workspace=join(temp,'project');
  await mkdir(workspace);
  const sample=join(workspace,'sample.txt'),secret=join(workspace,'.env.fixture'),outside=join(temp,'outside.txt');
  await writeFile(sample,'official read fixture: forty-two\n');
  await writeFile(secret,'SYNTHETIC_CREDENTIAL_MUST_NOT_LEAK\n');
  await writeFile(outside,'SYNTHETIC_OUTSIDE_MUST_NOT_LEAK\n');
  const root=new Context(),forks=[],children=new Map(),events=[],dispatches=[],runs=[];
  let parent,adapter,current,todoFork,hostSequence=0,forbiddenExecutions=0;
  const mount=async(plugin,config,ctx=root)=>{const fork=ctx.plugin(plugin,config);forks.push(fork);await fork;return fork;};
  try{
    for(const plugin of [SessionStore,SessionProjectionRegistry,AgentRegistry,LlmRuntime,SystemPrompt])await mount(plugin);
    await mount(ToolRuntime,{mode:'native'});
    await mount(LocalFileSystem,{cwd:workspace});
    await mount(LocalSubprocessRuntime);
    await mount(FsTools,{});
    await mount(SearchTools,{sampleOverCapGlobResults:false});
    await mount(AgentLoop,{});
    await mount(SubagentRuntime,{});
    await mount(Spawn,{});
    root.provide('sandboxPolicy',{overrideOf:()=>undefined,resolve:()=>({mode:'workspace-write',workspaceRoot:workspace})});
    for(const name of ['bash','pwsh','spawn_agent','subagent','settings_write','web_search','web_fetch']){
      root.tools.register(inertTool(name,()=>forbiddenExecutions++));
    }
    if(todoScope==='root')todoFork=await mount(Todo,{allowParallelInProgress:false});

    // This runs before the workflow's creation hook, just like host preset
    // composition. The native spawn driver installs real structured_output.
    root.on('agent/created',async({agent})=>{
      if(!agent.session.header.parentSession)return;
      children.set(agent.id,agent);
      current.agent=agent;
      // The lightweight host does not mount AgentPresetRegistry. Explicitly
      // use the official ancestry API for the ancestor-composition case.
      if(todoScope==='parent')bindScopeParent(agent,parent);
      if(todoScope==='child')current.todoFork=await mount(Todo,{allowParallelInProgress:false},agent.ctx);
      await current.beforeCreated?.(agent);
    });
    root.on('tools/execute',async(exec,next)=>{dispatches.push({agent:exec.agent?.id,name:exec.name});return next();});
    root.on('tools/result',(exec,result)=>{
      events.push({agent:exec.agent?.id,name:exec.name,result});
      if(exec.agent?.session.header.parentSession){
        if(exec.name==='read'&&!result.isError)realReadSuccesses++;
        if(exec.name==='glob'&&!result.isError)realGlobSuccesses++;
      }
    });
    class OfflineModel extends LlmAdapter{
      async resolveModel(provider,id){return {provider,id,name:id,context:{contextWindow:8192},defaultMaxTokens:512};}
      async *stream(options){
        assert.ok(current,'No model call is allowed outside an explicitly executing case');
        assert.notEqual(options.sessionId,parent.id,'The parent model must remain idle');
        const agent=children.get(options.sessionId);
        assert.ok(agent,'The real native child must be published before model dispatch');
        modelCalls++;
        const index=current.requests.length;
        current.requests.push({options,schemas:root.tools.schemas(agent)});
        await current.beforeStream?.(agent,index);
        const action=current.actions[index]??finish();
        const block={type:'tool-call',id:randomUUID(),name:action.name,arguments:JSON.stringify(action.args)};
        yield {type:'block-start',index:0,blockType:'tool-call'};
        yield {type:'block-end',index:0,block};
        yield {type:'usage',usage:{inputTokens:4,outputTokens:3,totalTokens:7}};
        yield {type:'finish',reason:{kind:'tool-calls'}};
      }
    }
    root.llm.registerAdapter(['offline-tool-contract'],new OfflineModel());
    parent=await root.agentLoop.create('tool-contract-parent-'+randomUUID(),{provider:'offline-tool-contract',model:'parent-fixture'},{cwd:workspace});
    if(todoScope==='parent')todoFork=await mount(Todo,{allowParallelInProgress:false},parent.ctx);
    // Seed the parent's real event log with unrelated work. Every case verifies
    // that native child Todo writes leave the entire parent Todo history intact.
    parent.session.append('todo/write',{todos:[{content:'Parent work stays unchanged',status:'pending'}]});
    const parentTodos=structuredClone(parent.session.snapshotEvents().filter(event=>event.type==='todo/write'));
    if(profileAnchor!==undefined)root.provide('profileContext',{
      installAnchor:typeof profileAnchor==='function'?profileAnchor(temp):profileAnchor,
    });
    adapter=createExecutionAdapter(root);
    adapter.beginSession(parent.id,adapter.context(parent.id).contextKey);
    const f={root,parent,adapter,workspace,sample,secret,outside,children,events,dispatches,mount,
      get todoFork(){return todoFork;},set todoFork(value){todoFork=value;},
      get forbiddenExecutions(){return forbiddenExecutions;},
      bumpForbidden(){forbiddenExecutions++;},
      async run(role,{actions=[call('todo_write',todoArgs()),call('glob',{pattern:'*.txt',path:workspace}),call('read',{file_path:sample}),call('todo_write',todoArgs('completed')),finish()],projectMode='verified',beforeCreated,beforeStream}={}){
        const runId='tool-contract-run-'+randomUUID();
        current={role,actions,beforeCreated,beforeStream,requests:[],runId};
        const record=current;runs.push(record);
        adapter.setProjectPolicy(runId,{root:workspace,safeRoot:true,mode:projectMode});
        const eventStart=events.length,dispatchStart=dispatches.length;
        try{
          record.result=await adapter.execute({sessionId:parent.id,runId,nodeId:role+'-'+(++hostSequence),role,
            prompt:'Execute only the deterministic offline fixture sequence.',model:{provider:'offline-tool-contract',model:role},
            outputSchema,signal:new AbortController().signal,limits:{maxStepsPerAgent:8}});
        }catch(error){
          if(!(error instanceof TeamHostError))throw error;
          record.startupError=error;
          record.result={stopReason:'refusal',failureCode:error.code,retryable:error.retryable,blocked:error.blocked,error:error.message};
        }finally{
          adapter.releaseBudget(runId);
          adapter.setProjectPolicy(runId,null);
          record.events=events.slice(eventStart);record.dispatches=dispatches.slice(dispatchStart);
          record.todoEvents=record.agent?.session.snapshotEvents().filter(event=>event.type==='todo/write')??[];
          record.todos=record.agent?root.sessionProjections.stateOf(record.agent.session,'todos'):undefined;
          assert.deepEqual(parent.session.snapshotEvents().filter(event=>event.type==='todo/write'),parentTodos,'Child Todo must not write or replace the parent list');
          assert.equal(root.agents.list().length,1,'Native spawn must dispose its child');
          assert.equal(root.sessions.list().length,1,'Native spawn must detach its child session');
          current=undefined;
        }
        return record;
      },
      async dispose(){
        adapter.releaseSession(parent.id);await adapter.dispose();
        for(const fork of forks.reverse())await fork.dispose();
        await rm(temp,{recursive:true,force:true});
      },
    };
    return f;
  }catch(error){
    await adapter?.dispose();for(const fork of forks.reverse())await fork.dispose();await rm(temp,{recursive:true,force:true});throw error;
  }
}

function assertCompleted(record){
  assert.equal(record.result.stopReason,'completed',JSON.stringify(record.result));
  assert.deepEqual(record.result.structured,{ok:true});
  assert.ok(record.events.every(event=>!event.result.isError),JSON.stringify(record.events));
}
function assertBoundary(record,name){
  assert.equal(record.result.stopReason,'refusal',JSON.stringify(record.result));
  assert.equal(record.result.failureCode,'TOOL_BOUNDARY',JSON.stringify(record.result));
  assert.equal(record.result.retryable,false,'TOOL_BOUNDARY must never become a recoverable STEP_LIMIT');
  assert.equal(record.result.blocked,true);
  if(name){
    assert.ok(record.events.some(event=>event.name===name&&event.result.isError),'Forbidden call must return a native tool error');
    assert.equal(record.dispatches.filter(event=>event.name===name).length,0,'Forbidden body must never dispatch');
  }
}
function assertSurface(record,role,{readonly=false}={}){
  const schemas=record.requests[0]?.schemas;
  assert.ok(schemas,'The actual model request must have a native schema snapshot');
  const names=new Set(schemas.map(schema=>schema.name));
  assert.deepEqual(record.requests[0].options.tools.map(schema=>schema.name).sort(),[...names].sort(),'Native LLM request schemas must equal the admitted registry surface');
  for(const name of ['todo_write','glob','read','structured_output'])assert.ok(names.has(name),role+' must retain '+name);
  for(const name of ['bash','pwsh','spawn_agent','subagent','settings_write'])assert.equal(names.has(name),false,role+' must hide inherited '+name);
  for(const name of ['write','edit'])assert.equal(names.has(name),role==='worker'&&!readonly,role+' mutation schema must match its execution boundary');
  for(const name of ['web_search','web_fetch'])assert.equal(names.has(name),role==='researcher',role+' research schema must match its execution boundary');
  const todo=schemas.find(schema=>schema.name==='todo_write');
  assert.deepEqual(todo.parameters.required,['todos']);
  assert.equal(todo.parameters.properties.todos.items.additionalProperties,false);
  assert.deepEqual(todo.parameters.properties.todos.items.properties.status.enum,['pending','in_progress','completed']);
}

try{
  const f=await fixture();
  try{
    for(const role of roles)await check('official rc.2 '+role+' completes real Todo → glob/read → structured_output in child session',async()=>{
      const record=await f.run(role);
      assertCompleted(record);
      assert.deepEqual(record.events.map(event=>event.name),['todo_write','glob','read','todo_write','structured_output']);
      assert.equal(record.todoEvents.length,2);
      assert.deepEqual(record.todos,todoArgs('completed').todos);
      assert.equal(record.events.find(event=>event.name==='glob').result.value.paths.includes('sample.txt'),true);
      assert.match(textOf(record.events.find(event=>event.name==='read').result),/official read fixture: forty-two/);
      assertSurface(record,role);
    });
    await check('official rc.2 readonly worker schema hides filesystem mutations while retaining official Todo',async()=>{
      const record=await f.run('worker',{projectMode:'readonly'});assertCompleted(record);assertSurface(record,'worker',{readonly:true});
    });
    await check('official rc.2 Todo ignores top-level target_session and only writes the calling child',async()=>{
      const record=await f.run('explorer',{actions:[call('todo_write',{...todoArgs(),target_session:f.parent.id}),finish()]});
      assertCompleted(record);
      assert.equal(record.todoEvents.length,1);assert.deepEqual(record.todoEvents[0].data,{todos:todoArgs().todos});
      // rc.2 deliberately closes each item, but its parameter root does not
      // declare additionalProperties:false. An extra root key cannot select
      // a session: the genuine implementation uses exec.agent.session only.
      assert.equal(record.requests[0].schemas.find(schema=>schema.name==='todo_write').parameters.additionalProperties,undefined);
    });
    await check('official rc.2 Todo item schema rejects target_session without writing any session',async()=>{
      const record=await f.run('explorer',{actions:[call('todo_write',{todos:[{...todoArgs().todos[0],target_session:f.parent.id}]}),finish()]});
      const rejected=record.events.find(event=>event.name==='todo_write');
      assert.equal(rejected.result.isError,true);assert.equal(rejected.result.error?.info?.code,'INVALID_ARGS');
      assert.match(rejected.result.error.message,/target_session/);
      assert.equal(record.todoEvents.length,0);
      assert.equal(record.result.stopReason,'completed','Ordinary schema errors must not be misclassified as permission refusal');
    });
    await check('official rc.2 ancestor restriction hiding Todo is intersected and never re-exposed',async()=>{
      const lift=f.parent.ctx.tools.restrict({deny:['todo_write']});
      try{
        assert.equal(f.root.tools.get('todo_write',f.parent),undefined);
        const record=await f.run('explorer',{actions:[call('todo_write',todoArgs())],beforeCreated:agent=>bindScopeParent(agent,f.parent)});
        assertBoundary(record,'todo_write');assert.equal(record.todoEvents.length,0);
        assert.equal(record.requests[0].schemas.some(schema=>schema.name==='todo_write'),false);
        assert.equal(record.requests[0].options.tools.some(schema=>schema.name==='todo_write'),false);
      }finally{lift();}
    });
    for(const role of roles)await check('official rc.2 readonly '+role+' rejects real write without creating a file',async()=>{
      const target=join(f.workspace,'forbidden-'+role+'.txt');
      const record=await f.run(role,{projectMode:'readonly',actions:[call('write',{file_path:target,content:'MUST NOT BE WRITTEN'})]});
      assertBoundary(record,'write');assert.equal(existsSync(target),false);
    });
    for(const kind of ['deny','ask'])await check('official rc.2 '+kind+' permission decision is never bypassed for official Todo',async()=>{
      const record=await f.run('explorer',{actions:[call('todo_write',todoArgs())],beforeCreated:agent=>{
        agent.ctx.on('tools/pre-execute',async(exec,next)=>exec.name==='todo_write'?{kind,reason:'Offline permission policy requires the parent'}:next());
      }});
      assert.equal(record.result.stopReason,'refusal',JSON.stringify({result:record.result,events:record.events}));assert.equal(record.result.failureCode,'PERMISSION_DENIED');
      assert.equal(record.result.retryable,false);assert.equal(record.todoEvents.length,0);
      assert.equal(record.dispatches.length,0);
    });
    for(const name of ['spawn_agent','subagent','settings_write','bash','pwsh'])await check('official rc.2 inherited '+name+' stays hidden and cannot dispatch',async()=>{
      const record=await f.run('worker',{actions:[call(name,{})]});assertBoundary(record,name);
      assert.equal(record.requests[0].schemas.some(schema=>schema.name===name),false);
      assert.equal(f.forbiddenExecutions,0);
    });
    for(const [label,args] of [
      ['credential path',{file_path:f.secret}],['outside absolute path',{file_path:f.outside}],
      ['outside relative path',{file_path:'../outside.txt'}],
    ])await check('official rc.2 read rejects '+label+' before filesystem dispatch',async()=>{
      const record=await f.run('explorer',{actions:[call('read',args)]});assertBoundary(record,'read');
      assert.doesNotMatch(JSON.stringify(record.events),/SYNTHETIC_(?:CREDENTIAL|OUTSIDE)_MUST_NOT_LEAK/);
    });
    await check('official rc.2 glob rejects traversal outside the project',async()=>{
      const record=await f.run('explorer',{actions:[call('glob',{path:f.workspace,pattern:'../*.txt'})]});assertBoundary(record,'glob');
    });
    for(const name of ['spawn_agent','write'])await check('official rc.2 forbidden same-scope '+name+' is rejected before the first model request',async()=>{
      const record=await f.run('planner',{actions:[call(name,{})],beforeCreated:agent=>agent.ctx.tools.register(inertTool(name,()=>f.bumpForbidden()))});
      assertBoundary(record);assert.ok(record.startupError);assert.equal(record.requests.length,0);assert.equal(record.dispatches.length,0);assert.equal(f.forbiddenExecutions,0);
    });
    for(const name of ['spawn_agent','write'])await check('official rc.2 late same-scope '+name+' bypasses restrict visibility but cannot bypass the monotonic guard',async()=>{
      let visibleAfterAttack=false;
      const record=await f.run('planner',{actions:[call(name,{})],beforeStream:agent=>{
        agent.ctx.tools.register(inertTool(name,()=>f.bumpForbidden()));
        visibleAfterAttack=f.root.tools.schemas(agent).some(schema=>schema.name===name);
      }});
      assert.equal(visibleAfterAttack,true,'Negative control must exercise the official same-scope restriction exemption');
      assertBoundary(record,name);assert.equal(f.forbiddenExecutions,0);
    });
    await check('official rc.2 child-scoped counterfeit Todo cannot borrow the global official fiber identity',async()=>{
      const record=await f.run('explorer',{actions:[call('todo_write',todoArgs())],beforeCreated:agent=>{
        const genuine=f.root.tools.get('todo_write',agent);
        agent.ctx.tools.register({...genuine,execute:async()=>{f.bumpForbidden();return {}}});
      }});
      assertBoundary(record);assert.ok(record.startupError);assert.equal(record.requests.length,0);assert.equal(f.forbiddenExecutions,0);assert.equal(record.todoEvents.length,0);
    });
    await check('official rc.2 late child-scoped counterfeit Todo cannot borrow the official fiber identity',async()=>{
      const record=await f.run('explorer',{actions:[call('todo_write',todoArgs())],beforeStream:agent=>{
        const genuine=f.root.tools.get('todo_write',agent);
        agent.ctx.tools.register({...genuine,execute:async()=>{f.bumpForbidden();return {}}});
      }});
      assertBoundary(record,'todo_write');assert.equal(f.forbiddenExecutions,0);assert.equal(record.todoEvents.length,0);
    });
    await check('official rc.2 replacing the official execute implementation after publication fails closed',async()=>{
      const definition=f.root.tools.get('todo_write');const execute=definition.execute;
      try{
        const record=await f.run('explorer',{actions:[call('todo_write',todoArgs())],beforeStream:()=>{
          definition.execute=async()=>{f.bumpForbidden();return {}};
        }});
        assertBoundary(record,'todo_write');assert.equal(f.forbiddenExecutions,0);assert.equal(record.todoEvents.length,0);
      }finally{definition.execute=execute;}
    });
    await check('official rc.2 pre-step identity recheck halts before a second model request after Todo changes',async()=>{
      const definition=f.root.tools.get('todo_write');const execute=definition.execute;
      try{
        const record=await f.run('explorer',{actions:[call('todo_write',todoArgs()),finish()],beforeCreated:agent=>{
          let steps=0;
          agent.ctx.on('agent/pre-step',async(_payload,next)=>{
            if(++steps===2)definition.execute=async()=>{f.bumpForbidden();return {}};
            return next();
          });
        }});
        assertBoundary(record);assert.equal(record.requests.length,1);assert.equal(record.todoEvents.length,1);assert.equal(f.forbiddenExecutions,0);
      }finally{definition.execute=execute;}
    });
    await check('official rc.2 unloading Todo after child publication denies the formerly authorized call',async()=>{
      const record=await f.run('explorer',{actions:[call('todo_write',todoArgs())],beforeStream:async()=>{await f.todoFork.dispose();}});
      assertBoundary(record,'todo_write');assert.equal(record.todoEvents.length,0);
    });
  }finally{await f.dispose();}

  for(const todoScope of ['parent','child']){
    const f=await fixture({todoScope});
    try{
      await check('official rc.2 '+todoScope+'-scoped ACTIVE Todo fiber is admitted by definition identity',async()=>{
        const record=await f.run('explorer');assertCompleted(record);
        assert.equal(record.todoEvents.length,2);
        const runtime=f.root.registry.get(Todo);
        if(todoScope==='parent')assert.ok([...runtime.fibers].some(fiber=>fiber.state===2&&scopeOf(fiber.ctx)===f.parent));
        // Native child disposal unloads its plugin and projection registration.
        // The retained canonical session events remain independently inspectable.
        assert.deepEqual(record.todoEvents.at(-1).data.todos,todoArgs('completed').todos);
      });
    }finally{await f.dispose();}
  }

  for(const install of ['lookalike','direct-apply','unloaded-official']){
    const f=await fixture({todoScope:'none'});
    try{
      await check('official rc.2 '+install+' Todo registration without an ACTIVE official fiber is rejected',async()=>{
        if(install==='direct-apply')Todo.apply(f.root,{allowParallelInProgress:false});
        else if(install==='unloaded-official'){
          const fork=await f.mount(Todo,{allowParallelInProgress:false});
          const oldDefinition=f.root.tools.get('todo_write');
          await fork.dispose();f.root.tools.register(oldDefinition);
        }else{
          // Obtain the real canonical schema from an isolated official mount,
          // then register an indistinguishable schema with a different body.
          const fork=await f.mount(Todo,{allowParallelInProgress:false});
          const genuine=f.root.tools.get('todo_write');
          await fork.dispose();
          f.root.tools.register({...genuine,execute:async()=>{f.bumpForbidden();return {}}});
        }
        const record=await f.run('explorer',{actions:[call('todo_write',todoArgs())]});
        assertBoundary(record,'todo_write');assert.equal(record.todoEvents.length,0);assert.equal(f.forbiddenExecutions,0);
        assert.equal(record.requests[0].schemas.some(schema=>schema.name==='todo_write'),false,'Untrusted inherited Todo must also be hidden from the model');
      });
    }finally{await f.dispose();}
  }
  {
    const f=await fixture({profileAnchor:officialManifest});
    try{
      await check('official rc.2 launcher installAnchor resolves and admits the real host Todo implementation',async()=>{
        assert.equal(f.root.get('profileContext').installAnchor,officialManifest);
        const launcherRequire=createRequire(officialManifest);
        const launcherTodo=await import(pathToFileURL(launcherRequire.resolve('@deepseek-ai/dsh-tool-todo')));
        assert.equal(launcherTodo,Todo,'The fixture and identity check must use the official launcher module instance');
        assert.ok([...f.root.registry.get(launcherTodo).fibers].some(fiber=>fiber.state===2));
        const record=await f.run('explorer');assertCompleted(record);assertSurface(record,'explorer');
        assert.equal(record.todoEvents.length,2);assert.deepEqual(record.todos,todoArgs('completed').todos);
      });
    }finally{await f.dispose();}
  }
  for(const [label,profileAnchor]of [
    ['relative invalid','relative-untrusted-anchor/package.json'],
    ['absolute unsupported',temp=>join(temp,'unsupported-profile','package.json')],
  ]){
    const f=await fixture({profileAnchor});
    try{
      await check('official rc.2 '+label+' installAnchor cannot fall back to a same-named local Todo',async()=>{
        assert.ok(f.root.tools.get('todo_write'),'The negative control must have a genuinely mounted Todo to accidentally fall back to');
        assert.ok([...f.root.registry.get(Todo).fibers].some(fiber=>fiber.state===2));
        if(label==='absolute unsupported')assert.throws(()=>createRequire(f.root.get('profileContext').installAnchor).resolve('@deepseek-ai/dsh-tools'),{code:'MODULE_NOT_FOUND'});
        const record=await f.run('explorer',{actions:[call('todo_write',todoArgs())]});
        assertBoundary(record,'todo_write');assert.equal(record.todoEvents.length,0);
        assert.equal(record.requests[0].schemas.some(schema=>schema.name==='todo_write'),false);
        assert.equal(record.requests[0].options.tools.some(schema=>schema.name==='todo_write'),false);
      });
    }finally{await f.dispose();}
  }
  {
    // A fresh adapter resolves official identity asynchronously on its first
    // child. Teardown must not let that suspended creation resume after its
    // global budget/project listeners have already been removed.
    const f=await fixture();
    try{
      await check('official rc.2 adapter disposal during Todo identity resolution rolls back before model dispatch',async()=>{
        let teardown,disposed=false;
        const record=await f.run('explorer',{beforeCreated:()=>{
          teardown=new Promise((resolve,reject)=>{
            setImmediate(()=>{f.adapter.dispose().then(()=>{disposed=true;resolve();},reject);});
          });
        },beforeStream:()=>{
          assert.fail('An unpublished child must never dispatch after adapter teardown');
        }});
        await teardown;
        assert.equal(disposed,true);
        assert.ok(record.startupError instanceof TeamHostError);
        assert.equal(record.result.failureCode,'UNAVAILABLE');
        assert.equal(record.result.retryable,false);
        assert.equal(record.requests.length,0);
        assert.equal(record.dispatches.length,0);
        assert.equal(record.todoEvents.length,0);
        assert.deepEqual(f.root.agents.list(),[f.parent]);
        assert.equal(f.root.sessions.list().length,1,'Failed native startup must detach its child session');
      });
    }finally{await f.dispose();}
  }
  assert.equal(networkAttempts,0);
  console.log(JSON.stringify({suite:'official-rc2-tool-contract',passed,failed:failures.length,modelFixtureCalls:modelCalls,
    realReadSuccesses,realGlobSuccesses,networkAttempts,paidApiCalls:0,
    boundary:'Real official native spawn/AgentLoop/tools/session/projections/filesystem; deterministic model and sandbox-policy fixture; no Electron UI or OS sandbox acceptance'}));
  if(failures.length)throw new AggregateError(failures.map(item=>item.error),failures.length+' tool-contract host case(s) failed');
  console.log('Tool contract host regression passed.');
}finally{globalThis.fetch=fetchBefore;}
