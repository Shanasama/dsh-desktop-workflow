import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const allowed = {'/':'index.html','/index.html':'index.html','/app.js':'app.js'};
const port=Number(process.env.PORT||4173);
createServer(async(req,res)=>{const file=allowed[new URL(req.url,'http://localhost').pathname];if(!file){res.writeHead(404).end();return;}try{const body=await readFile(fileURLToPath(new URL('../preview/'+file,import.meta.url)));res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'none'"}).end(body);}catch{res.writeHead(500).end('Run npm run build first.');}}).listen(port,'127.0.0.1',()=>console.log(`Component preview only: http://127.0.0.1:${port}`));
