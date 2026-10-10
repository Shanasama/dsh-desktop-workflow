/** Injectable fetch only. The function has no native fetch fallback or credential access. */
import {createOpenAITransport,createTypeSafeDecisionClient} from '../../transport/index.mjs';
import {contract} from './integration-fixture.mjs';
export function createSyntheticHttpAdapters(){
 let modelPosts=0,jevPosts=0;
 const key=()=> 'public-synthetic-placeholder';
 const transport=createOpenAITransport({contract:{...contract,evidence:'synthetic-fixture-only'},endpointPath:'/v1/chat/completions',getCredential:key,fetchImpl:async()=>{
  modelPosts++;return Response.json({model:'gpt6-luna',usage:{prompt_tokens:100,completion_tokens:80,total_tokens:180,completion_tokens_details:{reasoning_tokens:40}},choices:[{finish_reason:'stop',message:{role:'assistant',content:'public-scripted-result'}}]});
 }});
 const client=modelId=>({...createTypeSafeDecisionClient({modelId,getCredential:key,fetchImpl:async(_url,init)=>{
  jevPosts++;const body=JSON.parse(init.body),answers=Object.fromEntries(Object.entries(body.questions).map(([name,q])=>{
   if(q.type==='noul')return [name,{type:'noul',noul:['underspecified','security_sensitive'].includes(name)?0:1}];
   const selected=name==='lane'?'small':'complete';return [name,{type:'choice',choice:selected,confidence:1,probabilities:Object.fromEntries(Object.keys(q.criteria).map(k=>[k,k===selected?1:0]))}];
  }));return Response.json({model:modelId,usage:{input_tokens:11,output_tokens:3},answers});
 }}),mode:'fixture'});
 return {transport,extra:{jev:client('jev-1.13.0'),shadowJev:client('jev-1.12.0')},posts:()=>({model:modelPosts,jev:jevPosts})};
}
