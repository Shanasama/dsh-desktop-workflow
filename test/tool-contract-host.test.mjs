import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const resolver=createRequire(process.env.DSH_NODE_MODULES
  ?pathToFileURL(join(resolve(process.env.DSH_NODE_MODULES),'..','package.json')):import.meta.url);
let unavailable;
try{
  resolver.resolve('@deepseek-ai/dsh/package.json');
  for(const name of ['dsh-agent-loop','dsh-tool-todo','dsh-tool-fs','dsh-tool-fs-search','dsh-fs-local','dsh-subprocess-local'])resolver.resolve('@deepseek-ai/'+name);
}catch(error){
  if(error.code!=='MODULE_NOT_FOUND'&&error.code!=='ERR_MODULE_NOT_FOUND')throw error;
  unavailable='Optional official rc.2 host packages are not installed';
  if(process.env.DSH_NODE_MODULES)throw error;
}

test('official rc.2 tool contract admits scoped Todo and preserves every native safety boundary',
  {skip:unavailable??false,timeout:60000},async()=>{
    const child=spawn(process.execPath,['--expose-internals','scripts/verify-tool-contract-host.mjs'],{
      cwd:new URL('../',import.meta.url),env:process.env,stdio:['ignore','pipe','pipe'],timeout:55000,
    });
    let output='';
    child.stdout.on('data',chunk=>output+=chunk);
    child.stderr.on('data',chunk=>output+=chunk);
    const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});
    assert.equal(code,0,output);
    assert.match(output,/Tool contract host regression passed\./);
    const line=output.split('\n').find(line=>line.startsWith('{"suite":"official-rc2-tool-contract"'));
    assert.ok(line,'A machine-readable acceptance summary must be emitted');
    const summary=JSON.parse(line);
    assert.equal(summary.failed,0);
    assert.ok(summary.passed>=42,'The safety and profile-anchor cases must not silently disappear');
    assert.ok(summary.realReadSuccesses>=9,'Use actual official reads, not name-only stubs');
    assert.ok(summary.realGlobSuccesses>=9,'Use actual official ripgrep glob calls, not name-only stubs');
    assert.equal(summary.networkAttempts,0);assert.equal(summary.paidApiCalls,0);
  });
