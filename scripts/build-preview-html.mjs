import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
const result=await build({entryPoints:['preview/main.tsx'],bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',jsx:'automatic',minify:true,define:{'process.env.NODE_ENV':'"production"'},loader:{'.css':'text'}});
const script=result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'"><title>DSH 0.6.3 · 合成工作流预览</title></head><body style="margin:0;background:#080c11"><div id="root"></div><noscript>这是离线合成演示，需要浏览器启用 JavaScript。没有真实模型、宿主或 TypeSafe 连接。</noscript><script>${script}</script></body></html>`;
await writeFile('preview/standalone.html',html);
console.log(`Built self-contained offline preview (${Buffer.byteLength(html)} bytes), with all network disabled by CSP.`);
