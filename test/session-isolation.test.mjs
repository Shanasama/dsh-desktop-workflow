import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {TeamHostError} from '../src/host-adapter.js';
import {createTeamRuntime} from '../src/team-runtime.js';
import {teamHost,fixtureRuntime,fixtureDependencies,settings,waitFor} from './helpers/team-host.mjs';
const KEY=Symbol.for('dsh-desktop-workflow:project-runs:v3');
const reset=()=>{const s=globalThis[KEY];s?.sessions.clear();s?.leases.clear();s?.history.clear();};
const input=(r,id,requestId='fixture-request')=>({sessionId:id,contextKey:r.snapshot(id).context.contextKey,requestId,goal:'Only synthetic fixtures',settings:settings()});
const multi=options=>{const f=teamHost({sessionId:'a',sessionIds:['b','c'],...options});f.parents.get('b').session.header.cwd='/fixture/other-project';return f;};
test('two sessions in independent projects run concurrently; cancellation and snapshots stay session bound',async()=>{
 const f=multi({hold:true}),r=fixtureRuntime(f.ctx);
 try{const [a,b]=await Promise.all([r.start(input(r,'a','request-a')),r.start(input(r,'b','request-b'))]);await waitFor(()=>f.calls.length===2);
  assert.notEqual(a.snapshot.id,b.snapshot.id);assert.equal(r.snapshot('a').snapshot.sessionId,'a');assert.equal(r.snapshot('b').snapshot.sessionId,'b');
  assert.throws(()=>r.snapshot('b',a.snapshot.id),/当前会话没有/);assert.equal(r.snapshot('b').history.some(x=>x.sessionId==='a'),false);
  r.cancel({sessionId:'a',runId:a.snapshot.id});await waitFor(()=>r.snapshot('a').snapshot.status==='cancelled');assert.equal(f.calls.find(c=>c.parent.id==='b').signal.aborted,false);
  assert.equal(r.snapshot('a').context.canStart,true);assert.equal(r.snapshot('b').context.occupancy.sessionId,'b');
 }finally{await r.dispose();reset();}
});
test('same project reserves before metadata preflight and reports owner; switching session cannot bypass',async()=>{
 const f=multi({preflightHold:true,hold:true}),r=fixtureRuntime(f.ctx);f.parents.get('b').session.header.cwd=f.parent.session.header.cwd;
 try{const pending=r.start(input(r,'a','request-a'));await waitFor(()=>r.snapshot('b').context.occupancy?.state==='starting');
  await assert.rejects(r.start(input(r,'b','request-b')),e=>e.code==='PROJECT_BUSY'&&e.message.includes('会话 a'));assert.equal(f.calls.length,0);
  assert.equal(f.globalGuards[0]({agent:f.parents.get('b'),name:'write'}).includes('会话 a'),true);assert.equal(f.globalGuards[0]({agent:f.parents.get('b'),name:'read'}),undefined);
  f.releasePreflight();const a=await pending;r.cancel({sessionId:'a',runId:a.snapshot.id});await waitFor(()=>r.snapshot('a').snapshot.status==='cancelled');await waitFor(()=>r.snapshot('b').context.canStart);
  assert.ok((await r.start(input(r,'b','request-b-new'))).snapshot.id);
 }finally{f.releasePreflight();await r.dispose();reset();}
});
test('cancellation holds project until verifier cleanup acknowledges; independent project continues',async()=>{
 const f=multi({hold:true}),deps=fixtureDependencies();let release,cleaning=false;deps.verifier.release=async()=>{cleaning=true;await new Promise(r=>release=r);};const r=createTeamRuntime(f.ctx,{},deps);
 try{const a=await r.start(input(r,'a'));await waitFor(()=>f.calls.length);r.cancel({sessionId:'a',runId:a.snapshot.id});await waitFor(()=>cleaning);
  assert.equal(r.snapshot('c').context.canStart,false);assert.equal(r.snapshot('c').context.occupancy.state,'cancelling');const b=await r.start(input(r,'b','request-b'));assert.ok(b.snapshot.id);
  release();await waitFor(()=>r.snapshot('c').context.canStart);deps.verifier.release=()=>{};
 }finally{release?.();deps.verifier.release=()=>{};await r.dispose();reset();}
});
test('settled baseline failure releases only its project and does not cancel another session',async()=>{
 const f=multi({hold:true}),deps=fixtureDependencies(),collect=deps.verifier.collect;deps.verifier.collect=spec=>spec.config.sessionId==='a'?Promise.reject(new TeamHostError('VERIFICATION_INVALID','Fixture known settled failure')):collect(spec);const r=createTeamRuntime(f.ctx,{},deps);
 try{await Promise.all([r.start(input(r,'a','request-a')),r.start(input(r,'b','request-b'))]);await waitFor(()=>r.snapshot('a').snapshot.finishedAt);assert.equal(r.snapshot('c').context.canStart,true);await waitFor(()=>f.calls.length);assert.equal(f.calls[0].parent.id,'b');assert.equal(f.calls[0].signal.aborted,false);
 }finally{await r.dispose();reset();}
});
test('failed child cleanup quarantines its project across runtime replacement; another project stays usable',async()=>{
 const f=multi({cleanupFail:(_role,id)=>id==='a'}),r=fixtureRuntime(f.ctx);
 try{await r.start(input(r,'a'));await waitFor(()=>r.snapshot('a').snapshot.message?.includes('清理未确认'));assert.equal(r.snapshot('c').context.canStart,false);assert.equal(r.snapshot('b').context.canStart,true);assert.match(f.globalGuards[0]({agent:f.parent,name:'edit'}),/隔离/);assert.equal(f.globalGuards[0]({agent:f.parent,name:'read'}),undefined);await r.dispose();
  const next=fixtureRuntime(f.ctx);try{await assert.rejects(next.start(input(next,'c')),/隔离/);assert.ok((await next.start(input(next,'b','other-request'))).snapshot.id);assert.equal(next.snapshot('a').snapshot.sessionId,'a');}finally{await next.dispose();}
 }finally{await r.dispose();reset();}
});
test('unknown native tool result keeps project quarantine and exposes only allowlisted error diagnostics',async()=>{
 const f=teamHost({sessionId:'a',workspace:'/fixture/project-a'});f.parent.ctx.on=f.ctx.on;f.parent.ctx.get=()=>({guard:()=>()=>{},async execute(exec){await f.emit('tools/execute',exec,async()=>{});return {isError:true,error:{code:'EPERM',message:'FAKE_PRIVATE_BODY_AND_KEY'},content:[{type:'text',text:'FAKE_PRIVATE_BODY_AND_KEY'}]};}});
 const deps=fixtureDependencies();delete deps.verifier;const r=createTeamRuntime(f.ctx,{},deps);const g=teamHost({sessionId:'b',workspace:'/fixture/project-b'}),other=fixtureRuntime(g.ctx);
 try{const req=input(r,'a');req.settings.verification={profileId:'auto',scope:['workspace']};await r.start(req);await waitFor(()=>r.snapshot('a').snapshot.lifecycle==='quarantined');const state=r.snapshot('a');assert.equal(state.context.diagnostic.phase,'baseline');assert.equal(state.context.diagnostic.code,'EPERM');assert.equal(JSON.stringify(state).includes('FAKE_PRIVATE'),false);assert.ok((await other.start(input(other,'b','request-b'))).snapshot.id);
 }finally{await r.dispose();await other.dispose();reset();}
});
test('duplicate command IDs are independent per session and replays never dispatch twice',async()=>{
 const f=multi({hold:true}),deps=fixtureDependencies();deps.setup={view:()=>({configured:true}),refresh:async()=>({configured:true,settings:settings()})};const r=createTeamRuntime(f.ctx,{},deps);
 const invoke=id=>({agent:f.parents.get(id),rawInput:'Synthetic goal',commandId:'same-command-id',signal:new AbortController().signal});
 try{await Promise.all([r.command(invoke('a')),r.command(invoke('a')),r.command(invoke('b'))]);await waitFor(()=>f.calls.length===2);const a=r.snapshot('a').snapshot.id,b=r.snapshot('b').snapshot.id;assert.notEqual(a,b);await r.command(invoke('a'));assert.equal(f.calls.length,2);assert.equal(r.snapshot('a').context.lastCommand.runId,a);assert.equal(r.snapshot('b').context.lastCommand.runId,b);
 }finally{await r.dispose();reset();}
});
test('session history and request recovery cannot route to another run; verified disposal releases occupancy',async()=>{
 const f=multi(),r=fixtureRuntime(f.ctx);
 try{const first=await r.start(input(r,'a','request-one'));await waitFor(()=>r.snapshot('a').snapshot.finishedAt);await waitFor(()=>r.snapshot('a').context.canStart);const second=await r.start(input(r,'a','request-two'));await waitFor(()=>r.snapshot('a').snapshot.finishedAt);
  assert.equal(r.snapshot('a').history.length,2);assert.equal(r.request({sessionId:'a',requestId:'request-one'}).snapshot.id,first.snapshot.id);assert.notEqual(first.snapshot.id,second.snapshot.id);assert.equal(r.snapshot('b').history.length,0);
  await r.dispose();const next=fixtureRuntime(f.ctx);try{assert.equal(next.snapshot('a').history.length,2);assert.equal(next.snapshot('a',first.snapshot.id).snapshot.id,first.snapshot.id);assert.equal(next.snapshot('c').context.canStart,true);}finally{await next.dispose();}
 }finally{await r.dispose();reset();}
});
test('parent disposal cancels only its own session; host runtime disposal drains its own leases',async()=>{
 const f=multi({hold:true}),r=fixtureRuntime(f.ctx);
 try{const a=await r.start(input(r,'a')),b=await r.start(input(r,'b','request-b'));await waitFor(()=>f.calls.length===2);await f.emit('agent/disposed',{agent:f.parent});await waitFor(()=>r.snapshot('a').snapshot.status==='cancelled');assert.equal(f.calls.find(c=>c.parent.id==='b').signal.aborted,false);await r.dispose();assert.equal(r.snapshot('b').snapshot.id,b.snapshot.id);assert.equal(r.snapshot('b').snapshot.status,'cancelled');assert.equal(globalThis[KEY].leases.size,0);assert.ok(a.snapshot.id);
 }finally{await r.dispose();reset();}
});
test('legacy poisoned lease is retained and scoped when its project can be verified',async()=>{
 const old=globalThis[Symbol.for('dsh-desktop-workflow:exclusive-run:v2')]??(globalThis[Symbol.for('dsh-desktop-workflow:exclusive-run:v2')]={current:null});const previous=old.current;const legacy={sessionId:'a',poisoned:true,poisonSource:'verification'};old.current=legacy;const f=multi(),r=fixtureRuntime(f.ctx);
 try{assert.equal(r.snapshot('c').context.canStart,false);assert.equal(r.snapshot('b').context.canStart,true);assert.equal(old.current,legacy);await r.start(input(r,'b','request-b'));assert.equal(old.current,legacy);}finally{await r.dispose();old.current=previous;reset();}
});


test('legacy lease with unavailable owner keeps unknown scope protected without clearing or reassigning it',async()=>{const old=globalThis[Symbol.for('dsh-desktop-workflow:exclusive-run:v2')]??(globalThis[Symbol.for('dsh-desktop-workflow:exclusive-run:v2')]={current:null});const previous=old.current,unknown={sessionId:'unavailable-owner',poisoned:true};old.current=unknown;const f=multi(),r=fixtureRuntime(f.ctx);try{assert.equal(r.snapshot('a').context.canStart,false);assert.equal(r.snapshot('b').context.canStart,false);assert.equal(r.snapshot('b').context.occupancy.scopeKnown,false);assert.equal(old.current,unknown);await assert.rejects(r.start(input(r,'b','request-b')),/项目范围尚未确认/);}finally{await r.dispose();old.current=previous;reset();}});

test('settled diagnostic is retained with its own historical run after a later run clears current diagnostics',async()=>{const f=teamHost({sessionId:'a'});let first=true;f.parent.ctx.on=f.ctx.on;f.parent.ctx.get=()=>({guard:()=>()=>{},async execute(exec){await f.emit('tools/execute',exec,async()=>{});const p=JSON.parse(Buffer.from(exec.arguments.command.match(/'([A-Za-z0-9+/=]+)'$/)[1],'base64').toString('utf8'));const value={kind:'foreground',exitCode:first?1:0,signal:null,timedOut:false,aborted:false,stdout:{text:first?'not json':JSON.stringify({...p,verified:true,project:{mode:'analysis-only',reason:'Fixture analysis',root:'/fixture/shared-project'}})},stderr:{text:''}};first=false;return {isError:false,value};}});const deps=fixtureDependencies();delete deps.verifier;const r=createTeamRuntime(f.ctx,{},deps);const request=id=>{const v=input(r,'a',id);v.settings.verification={profileId:'auto',scope:['workspace']};return v;};try{const a=await r.start(request('first-request'));await waitFor(()=>r.snapshot('a').context.canStart);const b=await r.start(request('second-request'));await waitFor(()=>r.snapshot('a').snapshot.finishedAt);assert.notEqual(a.snapshot.id,b.snapshot.id);assert.equal(r.snapshot('a').context.diagnostic,undefined);assert.equal(r.snapshot('a',a.snapshot.id).snapshot.diagnostic.runId,a.snapshot.id);assert.equal(r.snapshot('a',a.snapshot.id).snapshot.diagnostic.phase,'baseline');}finally{await r.dispose();reset();}});


test('repeated runtime disposal waits for one cleanup while independent runtime stays usable',async()=>{const f=multi({hold:true}),deps=fixtureDependencies();let release,cleaning=false,releases=0;deps.verifier.release=async()=>{releases++;cleaning=true;await new Promise(r=>release=r);};const a=createTeamRuntime(f.ctx,{},deps),b=fixtureRuntime(f.ctx);try{await a.start(input(a,'a'));await waitFor(()=>f.calls.length);const closing=a.dispose();await waitFor(()=>cleaning);const again=a.dispose();assert.equal(again,closing);let completed=false;again.then(()=>completed=true);await new Promise(setImmediate);assert.equal(completed,false);assert.equal(releases,1);assert.equal(b.snapshot('c').context.occupancy.state,'cancelling');assert.equal(b.snapshot('b').context.canStart,true);await b.start(input(b,'b','request-b'));release();await Promise.all([closing,again]);assert.equal(b.snapshot('c').context.canStart,true);assert.equal(a.dispose(),closing);assert.equal(releases,1);}finally{release?.();await a.dispose();await b.dispose();reset();}});

test('cross-session mutation guard checks actual targets and sandbox bounds, including active independent owners',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'dsh-guard-target-053-')),left=path.join(root,'left'),right=path.join(root,'right');fs.mkdirSync(path.join(left,'.git'),{recursive:true});fs.mkdirSync(path.join(right,'.git'),{recursive:true});fs.writeFileSync(path.join(left,'existing.js'),'synthetic');fs.linkSync(path.join(left,'existing.js'),path.join(right,'linked.js'));
 const f=teamHost({sessionId:'a',sessionIds:['b','c'],workspace:left,hold:true});f.parents.get('b').session.header.cwd=right;f.parents.get('c').session.header.cwd=right;
 const deps=fixtureDependencies();delete deps.projectIdentity;const r=createTeamRuntime(f.ctx,{},deps);
 try{await r.start(input(r,'a'));const guard=f.globalGuards[0],b=f.parents.get('b'),c=f.parents.get('c');const call=(agent,name,file_path)=>guard({agent,name,arguments:{file_path}});
  assert.equal(call(c,'edit',path.join(left,'existing.js'))?.includes('会话 a'),true);assert.equal(call(c,'write',path.join(left,'new','file.js'))?.includes('会话 a'),true);
  assert.equal(call(c,'edit',path.join(right,'own.js')),undefined);assert.ok(call(c,'bash'));assert.equal(call(c,'read',path.join(left,'existing.js')),undefined);
  assert.ok(call(c,'edit',path.join(right,'linked.js')));
  const originalGet=f.ctx.get;f.ctx.get=name=>name==='sandboxPolicy'?{resolve:()=>({mode:'danger-full-access',workspaceRoot:right})}:originalGet(name);
  assert.match(call(c,'bash'),/写入范围无法核验/);f.ctx.get=originalGet;
  await r.start(input(r,'b','request-b'));assert.equal(call(b,'edit',path.join(left,'other.js'))?.includes('会话 a'),true);assert.equal(call(f.parent,'edit',path.join(right,'other.js'))?.includes('会话 b'),true);
  c.session.header.cwd=path.join(root,'missing');assert.ok(call(c,'edit',path.join(right,'own.js')));assert.equal(call(c,'read'),undefined);
 }finally{await r.dispose();reset();fs.rmSync(root,{recursive:true,force:true});}
});

test('cross-session shell guard requires enforcing backend, covers shared temp roots, and rejects wider per-call grants',async()=>{
 const f=multi({hold:true}),r=fixtureRuntime(f.ctx),c=f.parents.get('c');c.session.header.cwd='/fixture/shell-project';const originalGet=c.ctx.get,globalGet=f.ctx.get;
 try{await r.start(input(r,'a'));const guard=f.globalGuards[0],call=(sandbox_permissions)=>guard({agent:c,name:'bash',arguments:{sandbox_permissions}});
  assert.match(call(),/写入范围无法核验/);c.ctx.get=name=>name==='bash'?{sandboxMode:'workspace-write'}:originalGet(name);assert.equal(call(),undefined);assert.match(call('danger-full-access'),/写入范围无法核验/);
  f.ctx.get=name=>name==='sandboxPolicy'?{resolve:()=>({mode:'read-only',workspaceRoot:c.session.header.cwd})}:globalGet(name);assert.equal(call(),undefined);assert.match(call('danger-full-access'),/写入范围无法核验/);
 }finally{c.ctx.get=originalGet;f.ctx.get=globalGet;await r.dispose();reset();}
 const g=multi({hold:true}),deps=fixtureDependencies();g.parent.session.header.cwd=os.tmpdir();g.parents.get('c').session.header.cwd='/fixture/shell-project';const h=createTeamRuntime(g.ctx,{},deps),get=g.parents.get('c').ctx.get;g.parents.get('c').ctx.get=name=>name==='bash'?{sandboxMode:'workspace-write'}:get(name);
 try{await h.start(input(h,'a'));assert.match(g.globalGuards[0]({agent:g.parents.get('c'),name:'bash',arguments:{}}),/会话 a/);}finally{await h.dispose();reset();}
});

test('repeated disposal waits for reserved metadata preflight without dispatching children',async()=>{
 const f=multi({preflightHold:true}),r=fixtureRuntime(f.ctx);const pending=r.start(input(r,'a')).catch(error=>error);
 try{await waitFor(()=>r.snapshot('c').context.occupancy?.state==='starting');const closing=r.dispose();assert.equal(r.dispose(),closing);let completed=false;closing.then(()=>completed=true);await new Promise(setImmediate);assert.equal(completed,false);assert.equal(r.snapshot('c').context.occupancy.state,'cancelling');f.releasePreflight();assert.equal((await pending).code,'UNAVAILABLE');await closing;assert.equal(f.calls.length,0);assert.equal(globalThis[KEY].leases.size,0);}finally{f.releasePreflight();await r.dispose();reset();}
});

test('legacy unknown scope also protects mutations with an unavailable session cwd',async()=>{
 const old=globalThis[Symbol.for('dsh-desktop-workflow:exclusive-run:v2')]??(globalThis[Symbol.for('dsh-desktop-workflow:exclusive-run:v2')]={current:null}),previous=old.current,unknown={sessionId:'unavailable-owner',poisoned:true};old.current=unknown;
 const f=multi(),deps=fixtureDependencies();deps.projectIdentity=()=>{throw Error('fixture unavailable cwd');};const r=createTeamRuntime(f.ctx,{},deps);
 try{assert.match(f.globalGuards[0]({agent:f.parents.get('b'),name:'edit'}),/项目范围尚未确认/);assert.equal(f.globalGuards[0]({agent:f.parents.get('b'),name:'read'}),undefined);assert.equal(old.current,unknown);}finally{await r.dispose();old.current=previous;reset();}
});
