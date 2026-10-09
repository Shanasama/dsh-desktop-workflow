import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
// Optional official-host suite. Ordinary unit tests do not install packages or
// discover credentials; callers must explicitly point to an approved rc.2 tree.
test('v0.4 isolated official host acceptance', {skip:!process.env.DSH_NODE_MODULES,timeout:120000},()=>{
  const result=spawnSync(process.execPath,['--expose-internals',fileURLToPath(new URL('../scripts/verify-v04-host.mjs',import.meta.url))],{
    env:{PATH:process.env.PATH,DSH_NODE_MODULES:process.env.DSH_NODE_MODULES,LANG:'C.UTF-8'},
    encoding:'utf8',timeout:110000,maxBuffer:1024*1024,
  });
  assert.equal(result.error,undefined,result.error?.message);
  assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
  assert.match(result.stdout,/PASS official plugin_manager installs exact attached tgz/);
  assert.match(result.stdout,/PASS native credential controller writes without returning secret/);
  assert.match(result.stdout,/PASS actual native ConfigEditor\/SettingsForms persist/);
  assert.match(result.stdout,/PASS actual \/team through official command HTTP/);
  assert.match(result.stdout,/PASS cancellation during metadata preflight prevents/);
  assert.ok(!result.stdout.includes('synthetic-not-a-real-credential-'));
  assert.ok(!result.stderr.includes('synthetic-not-a-real-credential-'));
});
