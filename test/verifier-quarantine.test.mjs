const reset=()=>{const s=globalThis[Symbol.for('dsh-desktop-workflow:project-runs:v3')];s?.sessions.clear();s?.leases.clear();s?.history.clear();};
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTeamRuntime} from '../src/team-runtime.js';
import {createAutoVerifier} from '../src/auto-verification.js';
import {teamHost,fixtureDependencies,settings,waitFor} from './helpers/team-host.mjs';

test('unknown baseline tool result still locks the lease before any child, with project-check provenance',async()=>{
  const f=teamHost();
  f.parent.ctx.on=f.ctx.on;
  const parentTools={guard(fn){f.parentGuards.push(fn);return()=>f.parentGuards.splice(f.parentGuards.indexOf(fn),1);},async execute(exec){await f.emit('tools/execute',exec,async()=>{});return {isError:true};}};
  f.parent.ctx.get=()=>parentTools;
  const dependencies=fixtureDependencies();delete dependencies.verifier;
  const runtime=createTeamRuntime(f.ctx,{},dependencies);
  try{
    await runtime.start({sessionId:f.parent.id,contextKey:runtime.snapshot(f.parent.id).context.contextKey,requestId:'baseline-quarantine',goal:'Fixture only',settings:{...settings(),verification:{profileId:'auto',scope:['workspace']}}});
    await waitFor(()=>runtime.snapshot(f.parent.id).snapshot?.status==='blocked');
    const state=runtime.snapshot(f.parent.id);
    assert.equal(f.calls.length,0);
    assert.equal(state.context.canStart,false);
    assert.match(state.context.reason,/项目检查清理未确认/);
    assert.doesNotMatch(state.context.reason,/子代理/);
    assert.match(state.snapshot.message,/项目检查清理未确认/);
    assert.equal(globalThis[Symbol.for('dsh-desktop-workflow:project-runs:v3')].sessions.get(f.parent.id).poisoned,true);
  }finally{await runtime.dispose();reset();}
});

test('automatic verification builds its command for the shell the host mounts',async()=>{
  const f=teamHost();
  f.parent.ctx.on=f.ctx.on;
  const commands=[];
  const parentTools={get:name=>name==='pwsh'?{name}:undefined,guard(fn){f.parentGuards.push(fn);return()=>f.parentGuards.splice(f.parentGuards.indexOf(fn),1);},async execute(exec){commands.push(exec.arguments.command);await f.emit('tools/execute',exec,async()=>{});return {isError:true,error:{message:'unknown tool "bash"',info:{name:'ToolNotFoundError',code:'UNKNOWN_TOOL'}}};}};
  f.parent.ctx.get=()=>parentTools;
  const dependencies=fixtureDependencies();delete dependencies.verifier;
  const runtime=createTeamRuntime(f.ctx,{},dependencies);
  try{
    await runtime.start({sessionId:f.parent.id,contextKey:runtime.snapshot(f.parent.id).context.contextKey,requestId:'baseline-shell-command',goal:'Fixture only',settings:{...settings(),verification:{profileId:'auto',scope:['workspace']}}});
    await waitFor(()=>runtime.snapshot(f.parent.id).snapshot?.status==='blocked');
    assert.equal(commands.length,1);
    assert.match(commands[0],/verification-project-runner\.js/);
    assert.match(commands[0],/(^|; )& '/);
    assert.ok(!commands[0].startsWith('ELECTRON_RUN_AS_NODE=1 '));
  }finally{await runtime.dispose();reset();}
});

test('a check that provably never started is refused without quarantining the project',async()=>{
  const f=teamHost();
  f.parent.ctx.on=f.ctx.on;
  const parentTools={guard(fn){f.parentGuards.push(fn);return()=>f.parentGuards.splice(f.parentGuards.indexOf(fn),1);},async execute(exec){await f.emit('tools/execute',exec,async()=>{});return {isError:true,error:{message:'unknown tool "bash"',info:{name:'ToolNotFoundError',code:'UNKNOWN_TOOL'}}};}};
  f.parent.ctx.get=()=>parentTools;
  const dependencies=fixtureDependencies();delete dependencies.verifier;
  const runtime=createTeamRuntime(f.ctx,{},dependencies);
  try{
    await runtime.start({sessionId:f.parent.id,contextKey:runtime.snapshot(f.parent.id).context.contextKey,requestId:'baseline-not-started',goal:'Fixture only',settings:{...settings(),verification:{profileId:'auto',scope:['workspace']}}});
    await waitFor(()=>runtime.snapshot(f.parent.id).snapshot?.status==='blocked');
    const state=runtime.snapshot(f.parent.id);
    assert.equal(f.calls.length,0);
    assert.equal(state.context.canStart,true);
    assert.match(state.snapshot.message,/UNKNOWN_TOOL/);
    assert.match(state.snapshot.message,/没有启动任何检查进程/);
    assert.doesNotMatch(state.snapshot.message,/清理未确认/);
    assert.equal(globalThis[Symbol.for('dsh-desktop-workflow:project-runs:v3')].sessions.get(f.parent.id),undefined);
  }finally{await runtime.dispose();reset();}
});

test('auto verifier retains quarantine for background, promoted, timed-out and unknown execution outcomes',async()=>{
  for(const result of [undefined,{isError:true},{value:{kind:'background'}},{value:{kind:'promoted'}},{value:{kind:'foreground',timedOut:true}},{value:{kind:'foreground',aborted:true}},{value:{kind:'foreground',stopped:'interrupted',exitCode:0}},{value:{kind:'foreground',exitCode:0}}]){
    const poisoned=[];
    const verifier=createAutoVerifier({executeTool:async()=>result,poison:id=>poisoned.push(id)});
    await assert.rejects(verifier.collect({config:{sessionId:'fixture'},runId:'fixture',round:0,phase:'baseline',signal:new AbortController().signal}),error=>error.code==='VERIFICATION_UNSETTLED');
    assert.deepEqual(poisoned,['fixture']);
  }
});
