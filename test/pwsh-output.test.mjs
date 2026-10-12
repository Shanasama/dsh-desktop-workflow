import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('generated PowerShell command preserves delayed JSON, stderr and native exit 7', {skip:!process.env.DSH_PWSH_PATH},()=>{
 const result=spawnSync(process.execPath,[fileURLToPath(new URL('../scripts/verify-pwsh-output.mjs',import.meta.url))],{env:{PATH:process.env.PATH,DSH_PWSH_PATH:process.env.DSH_PWSH_PATH,LANG:'C.UTF-8'},encoding:'utf8',timeout:30000});
 assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
 const output=JSON.parse(result.stdout);assert.equal(output.passed,true);assert.deepEqual(output.results.map(x=>x.exitCode),[0,7]);
});
