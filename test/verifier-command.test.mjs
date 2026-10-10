import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifierCommand} from '../src/verifier-command.js';

test('native verifier invocation admits only fixed package entry names and keeps payload as data',()=>{
  for(const entry of ['../arbitrary.js','constructor','__proto__',new URL('file:///tmp/arbitrary.js'),null,{}])assert.throws(()=>verifierCommand(entry,{}),/fixed verifier entry/);
  const payload={runId:'quote-\'"; touch SHOULD_NOT_RUN',nonce:'fixture',phase:'baseline'};
  for(const [entry,file]of [['project','verification-project-runner.js'],['profile','verification-host-runner.js']]){
    const command=verifierCommand(entry,payload);
    assert.ok(command.includes(file));assert.ok(!command.includes('\n'));assert.ok(!command.includes('touch SHOULD_NOT_RUN'));
    const encoded=command.match(/'([A-Za-z0-9+/=]+)'$/)?.[1];assert.ok(encoded);
    assert.deepEqual(JSON.parse(Buffer.from(encoded,'base64').toString('utf8')),payload);
  }
});

test('verifier commands are built for the shell the host actually mounts',()=>{
  const payload={runId:'r',nonce:'n',phase:'baseline'};
  const bash=verifierCommand('project',payload,'bash');
  assert.equal(verifierCommand('project',payload),bash);
  assert.ok(bash.includes('verification-project-runner.js'));assert.ok(!bash.startsWith('& '));
  const pwsh=verifierCommand('project',payload,'pwsh');
  assert.ok(pwsh.includes('verification-project-runner.js'));assert.ok(!pwsh.includes('\n'));
  assert.match(pwsh,/(^|; )& '/);
  const encoded=pwsh.match(/'([A-Za-z0-9+/=]+)'$/)?.[1];
  assert.deepEqual(JSON.parse(Buffer.from(encoded,'base64').toString('utf8')),payload);
  for(const shell of ['cmd','constructor','__proto__','toString',{},null,[],{toString:()=> 'pwsh'}])assert.throws(()=>verifierCommand('project',payload,shell),/fixed verifier shell/);
});
