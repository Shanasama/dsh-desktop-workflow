import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
test('official rc.2 feedback is durable, attributed and never wakes the main model',{skip:!process.env.DSH_NODE_MODULES,timeout:30000},async()=>{
 const child=spawn(process.execPath,['--expose-internals','scripts/verify-team-feedback-host.mjs'],{cwd:new URL('../',import.meta.url),env:process.env,stdio:['ignore','pipe','pipe']});
 let output='';child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>output+=chunk);
 const result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',code=>resolve(code));});assert.equal(result,0,output);assert.match(output,/PASS official rc\.2/);
});
