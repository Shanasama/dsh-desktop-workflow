import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM,ResourceLoader,VirtualConsole} from 'jsdom';

test('self-contained preview needs no server, imports or live network and stays labeled synthetic',async()=>{
 const html=await readFile(new URL('../preview/standalone.html',import.meta.url),'utf8');
 assert.match(html,/connect-src 'none'/);assert.doesNotMatch(html,/<script[^>]+src=/i);assert.doesNotMatch(html,/<link[^>]+href=/i);
 let requests=0;const errors=[];
 class NoNetwork extends ResourceLoader{fetch(){requests++;throw Error('Preview must be self-contained');}}
 const dom=new JSDOM(html,{url:'file:///offline-preview.html',runScripts:'dangerously',resources:new NoNetwork(),pretendToBeVisual:true,virtualConsole:new VirtualConsole().on('jsdomError',error=>errors.push(error.message)),beforeParse(window){window.fetch=async()=>{requests++;throw Error('No network permitted');};window.WebSocket=class{constructor(){requests++;throw Error('No network permitted');}};window.HTMLElement.prototype.scrollIntoView=function(){};}});
 const wait=()=>new Promise(resolve=>setTimeout(resolve,20));
 try{
  await wait();assert.ok(dom.window.document.querySelector('.tm-root'));assert.match(dom.window.document.body.textContent,/SYNTHETIC DEMO/);assert.match(dom.window.document.querySelector('.preview-watermark').textContent,/合成演示/);
  const dual=[...dom.window.document.querySelectorAll('button')].find(button=>button.textContent==='同岗位双模型');assert.ok(dual);dual.click();await wait();
  assert.equal(dom.window.document.querySelectorAll('.tm-task-node[data-live="true"]').length,3);
  assert.match(dom.window.document.body.textContent,/本节点选定模型/);assert.equal(requests,0);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
