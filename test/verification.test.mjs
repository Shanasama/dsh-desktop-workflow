import{test}from'node:test';import assert from'node:assert/strict';import{createVerifier,safeRelative,verificationProfiles}from'../src/verification.js';
import{verificationDiagnostic,notStartedCodes}from'../src/verification-diagnostics.js';
import{createAutoVerifier}from'../src/auto-verification.js';
const profile={id:'fixture',name:'Explicit fixture',checks:[{id:'test',argv:['node','--test','test.mjs'],timeoutMs:1000}],protectedPaths:['test.mjs']};
const config={sessionId:'s',verification:{profileId:'fixture',scope:['src']}};const signal=new AbortController().signal;
function setup(value,shell){const calls=[],poisons=[];return {calls,poisons,v:createVerifier({profiles:[profile],executeTool:async(s,spec)=>{calls.push({s,...spec});return typeof value==='function'?value(spec):value;},poison:s=>poisons.push(s),shellName:()=>shell})};}
test('scope and fixed server profiles reject traversal, executable payloads and missing check protection',()=>{for(const s of ['../src','/root','src/../other','src\\x','src/**','.', 'a//b'])assert.equal(safeRelative(s),false);assert.ok(safeRelative('src/file.js'));assert.throws(()=>verificationProfiles([{...profile,checks:[]} ]));assert.throws(()=>verificationProfiles([{...profile,protectedPaths:[]} ]));assert.throws(()=>verificationProfiles([{...profile,checks:[{id:'bad',argv:['node','\0'],timeoutMs:1000}]}]));const {v}=setup({});assert.throws(()=>v.preflight({verification:{profileId:'unknown',scope:['src']}}));});
test('trusted checker calls native bash with original session and fixed foreground args only',async()=>{const {v,calls}=setup({isError:false,value:{kind:'foreground',exitCode:0,stdout:{text:'{}',truncated:false},stderr:{text:'',truncated:false}}});await assert.rejects(v.collect({config,runId:'run',round:0,phase:'baseline',signal}),/验证未通过/);assert.equal(calls[0].s,'s');assert.equal(calls[0].name,'bash');assert.ok(calls[0].arguments.description.trim());assert.equal(calls[0].arguments.run_in_background,false);assert.ok(!('sandbox_permissions'in calls[0].arguments));assert.ok(!('justification'in calls[0].arguments));assert.match(calls[0].arguments.command,/verification-host-runner\.js/);assert.ok(!calls[0].arguments.command.includes('\n'));});
test('background promotion, timeout, aborted result and unknown dispatch all poison lease',async()=>{for(const result of [{isError:true},{},{isError:false,value:{kind:'promoted',jobId:'j'}},{isError:false,value:{kind:'background',jobId:'j'}},{isError:false,value:{kind:'foreground',timedOut:true}},{isError:false,value:{kind:'foreground',aborted:true}}]){const {v,poisons}=setup(result);await assert.rejects(v.collect({config,runId:'run',round:0,phase:'baseline',signal}));assert.deepEqual(poisons,['s']);}});
test('foreign run/round/nonce, malformed output and truncated logs never become evidence',async()=>{for(const text of ['{}','{"clean":true,"runId":"wrong","round":0}', 'not JSON']){const {v}=setup({isError:false,value:{kind:'foreground',exitCode:0,stdout:{text,truncated:false},stderr:{text:'',truncated:false}}});await assert.rejects(v.collect({config,runId:'run',round:0,phase:'baseline',signal}));}const {v}=setup({isError:false,value:{kind:'foreground',exitCode:0,stdout:{text:'{}',truncated:true}}});await assert.rejects(v.collect({config,runId:'run',round:0,phase:'baseline',signal}));});
test('catalog exposes detached actual argv, timeouts and protected paths',()=>{const {v}=setup({});assert.deepEqual(v.profiles[0].checks,profile.checks);v.profiles[0].checks[0].argv.push('bad');assert.deepEqual(v.preflight(config).checks,profile.checks);});
test('host failure codes come from error.info; a check that never started is refused without locking',async()=>{
 assert.equal(verificationDiagnostic('baseline',{isError:true,error:{info:{name:'ToolNotFoundError',code:'UNKNOWN_TOOL'}}},undefined,'宿主工具返回错误').code,'UNKNOWN_TOOL');
 assert.equal(verificationDiagnostic('baseline',{isError:true,error:{message:'raw text only'}},undefined,'y').code,'UNCLASSIFIED');
 assert.equal(verificationDiagnostic('baseline',{isError:true,error:{info:{code:'SOMETHING_UNMAPPED'}}},undefined,'y').code,'UNCLASSIFIED');
 assert.ok(notStartedCodes.has('UNKNOWN_TOOL')&&notStartedCodes.has('INVALID_ARGS')&&!notStartedCodes.has('EPERM'));
 const neverStarted=setup({isError:true,error:{message:'unknown tool "bash"',info:{name:'ToolNotFoundError',code:'UNKNOWN_TOOL'}}});
 await assert.rejects(neverStarted.v.collect({config,runId:'run',round:0,phase:'baseline',signal}),error=>error.code==='VERIFICATION_DENIED'&&/UNKNOWN_TOOL/.test(error.message));
 assert.deepEqual(neverStarted.poisons,[]);
 const maybeStarted=setup({isError:true,error:{info:{name:'Error',code:'EPERM'}}});
 await assert.rejects(maybeStarted.v.collect({config,runId:'run',round:0,phase:'baseline',signal}),error=>error.code==='VERIFICATION_UNSETTLED');
 assert.deepEqual(maybeStarted.poisons,['s']);
});
test('explicit verification builds its command for the resolved shell',async()=>{
 const shellOk={isError:false,value:{kind:'foreground',exitCode:0,stdout:{text:'{}',truncated:false},stderr:{text:'',truncated:false}}};
 const {v,calls}=setup(shellOk,'pwsh');
 await assert.rejects(v.collect({config,runId:'run',round:0,phase:'baseline',signal}));
 assert.match(calls[0].arguments.command,/(^|; )& '/);assert.ok(!calls[0].arguments.command.startsWith('ELECTRON_RUN_AS_NODE=1 '));
 const fallback=setup(shellOk);
 await assert.rejects(fallback.v.collect({config,runId:'run',round:0,phase:'baseline',signal}));
 assert.ok(!fallback.calls[0].arguments.command.startsWith('& '));
});
test('official not-started wire codes release both verifier kinds; invented symbolic names remain fail-closed',async()=>{
 for(const code of ['UNKNOWN_TOOL','INVALID_ARGS','ABORTED_BEFORE_DISPATCH','TOOL_ABORTED_BEFORE_DISPATCH','ABORTED','EPERM']){
  const expected=['UNKNOWN_TOOL','INVALID_ARGS','ABORTED_BEFORE_DISPATCH'].includes(code);
  assert.equal(notStartedCodes.has(code),expected);
  const result={isError:true,error:{info:{code}}};
  const explicit=setup(result),autoPoisons=[];
  const automatic=createAutoVerifier({executeTool:async()=>result,poison:id=>autoPoisons.push(id)});
  for(const verifier of [explicit.v,automatic])await assert.rejects(verifier.collect({config,runId:'not-started-'+code,round:0,phase:'baseline',signal}),error=>error.code===(expected?'VERIFICATION_DENIED':'VERIFICATION_UNSETTLED'));
  assert.deepEqual(explicit.poisons,expected?[]:['s']);assert.deepEqual(autoPoisons,expected?[]:['s']);
  if(expected)assert.equal(verificationDiagnostic('baseline',result,undefined,'fixture').code,code);
 }
});
