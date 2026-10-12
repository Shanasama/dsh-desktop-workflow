const fs=require('node:fs');
const log=process.env.ACCEPTANCE_NETWORK_LOG;
const deny=(kind)=>(...args)=>{if(log)fs.appendFileSync(log,JSON.stringify({pid:process.pid,kind,stack:new Error().stack})+'\n');throw new Error('INDEPENDENT_ACCEPTANCE_NETWORK_FORBIDDEN:'+kind);};
globalThis.fetch=deny('fetch');
for(const mod of ['node:http','node:https']){const m=require(mod);m.request=deny(mod+'.request');m.get=deny(mod+'.get');}
const net=require('node:net');net.connect=deny('net.connect');net.createConnection=deny('net.createConnection');net.Socket.prototype.connect=deny('Socket.connect');
const tls=require('node:tls');tls.connect=deny('tls.connect');
require('node:module').syncBuiltinESMExports();
