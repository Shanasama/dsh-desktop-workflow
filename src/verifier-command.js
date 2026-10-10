import {fileURLToPath} from 'node:url';
/** Only fixed package entry URLs may be passed; RPC/model input is serialized as data. */
const entries=Object.freeze({project:new URL('./verification-project-runner.js',import.meta.url),profile:new URL('./verification-host-runner.js',import.meta.url)});
/** Fixed shell flavors only: the host resolves which shell tool it actually mounts. */
const shells=Object.freeze({bash:value=>"'"+value.replace(/'/g,"'\\''")+"'",pwsh:value=>"'"+value.replace(/'/g,"''")+"'"});
export function verifierCommand(entry,payload,shell='bash'){
 if(typeof entry!=='string'||!Object.hasOwn(entries,entry))throw new TypeError('Expected a fixed verifier entry');
 const quote=shells[shell];if(!quote)throw new TypeError('Expected a fixed verifier shell');
 const data=Buffer.from(JSON.stringify(payload),'utf8').toString('base64');
 const argv=quote(process.execPath)+' '+quote(fileURLToPath(entries[entry]))+' '+quote(data);
 // The Electron binary only runs the entry as Node when the environment says so; every shell spells that differently.
 if(shell==='pwsh')return (process.versions.electron?"$env:ELECTRON_RUN_AS_NODE='1'; & ":'& ')+argv;
 return (process.versions.electron?'ELECTRON_RUN_AS_NODE=1 ':'')+argv;
}
