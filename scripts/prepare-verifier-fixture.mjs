/** Prepares a TEST-ONLY command for the external host exec tool. Never executes a shell itself. */
import {writeFile,readFile} from 'node:fs/promises';
import {createVerifier} from '../src/verification.js';
const [dir,phase='baseline']=process.argv.slice(2);if(!dir?.startsWith('/tmp/dsh-jev-verifier-'))throw Error('Explicit /tmp fixture required');
const profile={id:'fixture',checks:[{id:'test',argv:[process.execPath,'test.mjs'],timeoutMs:1000}],protectedPaths:['test.mjs'],expectsChanges:true};
const config={sessionId:'fixture',verification:{profileId:'fixture',scope:['src']}};
let capturePhase='baseline';const v=createVerifier({profiles:[profile],poison:()=>{},executeTool:async(_session,spec)=>{
 if(phase!=='baseline'&&capturePhase==='baseline'){capturePhase='check';const raw=JSON.parse(await readFile(dir+'/baseline.json','utf8'));const command=spec.arguments.command;const match=command.match(/"nonce":"([^"]+)"/);raw.nonce=match[1];return {isError:false,value:{kind:'foreground',exitCode:0,stdout:{text:JSON.stringify(raw),truncated:false},stderr:{text:'',truncated:false}}};}
 await writeFile(dir+'/'+phase+'.sh',spec.arguments.command+'\n');throw Error('Captured only: external sandbox exec must run this fixture command');
}});
try{await v.collect({config,runId:'fixture-run',round:0,phase:'baseline',signal:new AbortController().signal});if(phase!=='baseline')await v.collect({config,runId:'fixture-run',round:1,phase:'check',signal:new AbortController().signal});}catch(e){if(!e.message.startsWith('Captured only'))throw e;}
