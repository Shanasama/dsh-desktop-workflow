import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
const id = 'dsh-desktop-workflow';
await mkdir('lib', { recursive: true });
const result = await build({entryPoints:['client/index.tsx'],bundle:true,write:false,outfile:'client.js',format:'cjs',platform:'browser',target:'es2022',jsx:'automatic',external:['react','react/jsx-runtime'],loader:{'.css':'text'}});
const code = result.outputFiles.find(f=>f.path.endsWith('.js')).text;
await writeFile('lib/client.js', `/* Built from client/; React is supplied by the host. */\nwindow.__ModuleLoader__.load({id:${JSON.stringify(id)},factory:function(require){var module={exports:{}};var exports=module.exports;\n${code}\nreturn module.exports;}});\n`);
await build({entryPoints:['preview/main.tsx'],bundle:true,outfile:'preview/app.js',format:'iife',platform:'browser',target:'es2022',jsx:'automatic',loader:{'.css':'text'}});
console.log('Built host client factory and isolated component preview.');
