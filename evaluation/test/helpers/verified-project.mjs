/** Authored public synthetic project. No generated command or model output is executed. */
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createVerifier} from '../../../src/verification.js';
import {integrationFixture} from './integration-fixture.mjs';
import {createSyntheticHttpAdapters} from './mock-http.mjs';
import {openProjectLedger,openJevMeter} from '../../src/budget.mjs';
export async function runVerifiedSyntheticProject({broken=false,tamperSeal=false,shadow=true,mockHttp=false}={}) {
  const root=mkdtempSync(join(tmpdir(),'jev-verified-synthetic-'));
  const stateRoot=mkdtempSync(join(tmpdir(),'jev-verified-state-'));
  const modelStore=openProjectLedger(join(stateRoot,'model.json'),{projectId:'synthetic-combination'}),jevStore=openJevMeter(join(stateRoot,'jev.json'));
  const env={PATH:process.env.PATH,HOME:root,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_TERMINAL_PROMPT:'0'};
  const git=(...args)=>execFileSync('git',['-c','core.hooksPath=/dev/null',...args],{cwd:root,env,stdio:'pipe'});
  let h;const observations=[];
  try {
    mkdirSync(join(root,'src'));
    writeFileSync(join(root,'src/value.mjs'),'export const value = 1;\n');
    writeFileSync(join(root,'acceptance.test.mjs'),"import test from 'node:test'; import assert from 'node:assert/strict'; import {value} from './src/value.mjs'; test('authored synthetic expected value',()=>assert.equal(value,2));\n");
    git('init','--quiet');git('add','src/value.mjs','acceptance.test.mjs');git('-c','user.name=OfflineFixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','Synthetic baseline');
    const verifier=createVerifier({profiles:[{id:'fixture',name:'Synthetic subprocess acceptance',checks:[{id:'node-test',argv:[process.execPath,'--test','acceptance.test.mjs'],timeoutMs:5000}],protectedPaths:['acceptance.test.mjs']}],poison(){},executeTool:async(_session,spec)=>{
      // The production verifier generated this command. Extract only its encoded data;
      // execute our fixed entry, never the command string, shell, model or fixture response.
      const encoded=spec.arguments.command.match(/'([A-Za-z0-9+/=]+)'$/)?.[1];
      if(!encoded)throw Error('synthetic-verifier-payload-invalid');
      const payload=JSON.parse(Buffer.from(encoded,'base64').toString());
      if(tamperSeal&&payload.phase==='seal')writeFileSync(join(root,'src/value.mjs'),'export const value = 3;\n');
      const child=spawnSync(process.execPath,[fileURLToPath(new URL('../../../src/verification-host-runner.js',import.meta.url)),encoded],{cwd:root,env,encoding:'utf8',timeout:15000,maxBuffer:1048576});
      if(child.error||child.signal)throw Error('synthetic-verifier-subprocess-unsettled');
      let data;try{data=JSON.parse(child.stdout);}catch{throw Error('synthetic-verifier-output-invalid');}
      observations.push({phase:payload.phase,runnerExit:child.status,verified:data.verified??data.clean,checksPassed:data.checksPassed??null,sealed:data.sealed??null,checkExitCodes:(data.checks??[]).map(c=>c.exitCode)});
      return {isError:false,value:{kind:'foreground',exitCode:child.status,stdout:{text:child.stdout,truncated:false},stderr:{text:child.stderr,truncated:false}}};
    }});
    const adapters=mockHttp?createSyntheticHttpAdapters():{};
    h=integrationFixture({...adapters,shadow,verifier,ledger:modelStore.ledger,jevMeter:jevStore.meter,decode:(_response,spec)=>{if(spec.role==='worker')writeFileSync(join(root,'src/value.mjs'),`export const value = ${broken?3:2};\n`);}});
    const run=await h.run();
    return {case:broken?'test-failure':tamperSeal?'seal-tampering':mockHttp?'mock-http-with-independent-check':'passes-independent-check',mode:'offline-scripted-controller-with-real-local-tests',realModelCalls:0,realJevCalls:0,modelOutputsExecuted:false,
      actualTaskAcceptance:'not-run',observedProductionAccuracy:null,persistentLedgersUsed:true,mockHttpPosts:adapters.posts?.()??null,status:run.result.status,observations,summary:run.summary,trace:run.trace};
  }finally{await h?.controller.dispose();modelStore.close();jevStore.close();rmSync(root,{recursive:true,force:true});rmSync(stateRoot,{recursive:true,force:true});}
}
