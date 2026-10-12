import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import path from 'node:path';
import {resolveVerificationExecutable,spawnVerificationJob} from '../src/verification-windows-job.js';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function fake(){
 const state={exit:undefined,empty:false,closed:[],terminated:0,options:null};
 const api={};
 const native={loadWin32ProcessBindings:()=>api,spawnCurrentTokenJobProcess(a,o){assert.equal(a,api);state.options=o;return{pid:123,process:1,job:2};},pollProcessExit:()=>state.exit,isJobEmpty:()=>state.empty,terminateJob(){state.terminated++;state.exit??=1;state.empty=true;},closeHandleChecked(a,h){state.closed.push(h);}};
 return{state,native};
}
const opts=native=>({cwd:process.cwd(),env:{PATH:'synthetic',ELECTRON_RUN_AS_NODE:'1'},stdio:[0,1,2],applicationName:'fixed-native-test.exe',native,pollMs:2});
test('Job close waits for direct exit and all descendant processes',async()=>{
 const{state,native}=fake(),child=await spawnVerificationJob(['fixed','argument'],opts(native));let closed=false;child.once('close',()=>closed=true);
 state.exit=7;await sleep(15);assert.equal(child.rootChildClosed,true);assert.equal(child.processTreeSettled,false);assert.equal(closed,false);assert.deepEqual(state.closed,[]);
 const ending=once(child,'close');state.empty=true;assert.deepEqual(await ending,[7,null]);assert.equal(child.processTreeSettled,true);assert.equal(child.nativeHandlesClosed,true);assert.deepEqual(state.closed,[1,2]);
 assert.deepEqual(state.options.args,['argument']);assert.equal(state.options.env.ELECTRON_RUN_AS_NODE,'1');assert.equal(state.options.stdio.stdout,1);assert.ok(state.options.stdio.stdin>=0);
});
test('kill terminates complete Job and confirms empty before close',async()=>{
 const{state,native}=fake(),child=await spawnVerificationJob(['fixed'],opts(native));const ending=once(child,'close');child.kill('SIGKILL');assert.deepEqual(await ending,[1,'SIGKILL']);assert.equal(state.terminated,1);assert.equal(child.processTreeSettled,true);
});
test('poll failure cannot publish a successful close',async()=>{
 const{state,native}=fake();native.isJobEmpty=()=>{throw new Error('synthetic query failure');};const child=await spawnVerificationJob(['fixed'],opts(native));const failed=once(child,'error');state.exit=0;const[e]=await failed;assert.equal(e.unsettled,true);assert.equal(child.processTreeSettled,false);child.dispose();assert.equal(state.terminated,1);
});
test('handle close failure cannot publish successful close',async()=>{
 const{state,native}=fake();native.closeHandleChecked=()=>{throw new Error('synthetic close failure');};const child=await spawnVerificationJob(['fixed'],opts(native));const failed=once(child,'error');state.exit=0;state.empty=true;const[e]=await failed;assert.equal(e.unsettled,true);assert.equal(child.nativeHandlesClosed,false);assert.throws(()=>child.dispose());
});
test('spawn failure is marked uncertain with no raw-spawn fallback',async()=>{
 const{native}=fake();native.spawnCurrentTokenJobProcess=()=>{throw new Error('synthetic nested Job denial');};await assert.rejects(spawnVerificationJob(['fixed'],opts(native)),e=>e.unsettled===true);
});
test('native Job unavailable does not fall back',async()=>{await assert.rejects(spawnVerificationJob(['fixed'],opts({})),{code:'EVERIFICATIONJOB'});});
test('Windows executable resolution uses supplied case-insensitive PATH and fixed exe paths',()=>{
 const files=new Set(['C:\\Tools\\git.exe','C:\\Apps\\Desktop.exe']);const stat=f=>({isFile:()=>files.has(f)}),options={pathApi:path.win32,stat};
 assert.equal(resolveVerificationExecutable('git','C:\\project',{Path:';"C:\\Tools"'},options),'C:\\Tools\\git.exe');
 assert.equal(resolveVerificationExecutable('C:\\Apps\\Desktop.exe','C:\\project',{},options),'C:\\Apps\\Desktop.exe');
 assert.throws(()=>resolveVerificationExecutable('git','C:\\project',{PATH:''},options),{code:'ENOENT'});
 const writable={pathApi:path.win32,stat:()=>({isFile:()=>true})};
 assert.throws(()=>resolveVerificationExecutable('git','C:\\project',{PATH:'.;tools;'},writable),{code:'ENOENT'});
});
