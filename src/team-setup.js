/** Native, live DSH settings. No credential values enter these records or responses. */
import z from '@deepseek-ai/schemastery';
import {TEAM_ROLES,DEFAULT_LIMITS,validateConfig,safeText} from './team-contracts.js';
import {TeamHostError} from './host-adapter.js';
import {createJevClient,JEV_ENDPOINT,JEV_DISCLOSURE} from './jev-client.js';
export const JEV_CREDENTIAL_REF='DSH_TEAM_JEV_API_KEY';
export const emptySetup=()=>({roles:Object.fromEntries(TEAM_ROLES.map(role=>[role,{provider:'',model:'',maxTokens:4096}])),limits:{...DEFAULT_LIMITS},reviewPlan:true,disclosureAccepted:false});
const roleSchema=()=>z.object({provider:z.string().default(''),model:z.string().default(''),reasoningEffort:z.string(),maxTokens:z.number().default(4096)});
export const Config=z.object({
 stateFile:z.string().default(''),staleAfterMs:z.number().default(120000),
 jev:z.any(),verificationProfiles:z.any(),
 teamSetup:z.object({roles:z.object(Object.fromEntries(TEAM_ROLES.map(r=>[r,roleSchema()]))).default(emptySetup().roles),limits:z.any().default({...DEFAULT_LIMITS}),reviewPlan:z.boolean().default(true),disclosureAccepted:z.boolean().default(false)}).default(emptySetup()).volatile(),
});
const readValue=config=>typeof config.teamSetup?.get==='function'?config.teamSetup.get():config.teamSetup;
function validated(value){
 const c=validateConfig({sessionId:'settings-validation',goal:'validate settings only',roles:value.roles,limits:value.limits,reviewPlan:value.reviewPlan});
 if(typeof value.disclosureAccepted!=='boolean')throw new TeamHostError('INVALID_SETTINGS','请选择是否持续启用 TypeSafe 数据传输。');
 return {roles:c.roles,limits:c.limits,reviewPlan:c.reviewPlan,disclosureAccepted:value.disclosureAccepted};
}
export function createSetupStore(ctx,config={}, {entryId=ctx.fiber?.entry?.options?.id}={}){
 let keyInfo={configured:false,writable:false},revision=0;
 function current(){try{return validated(readValue(config)||emptySetup());}catch{return emptySetup();}}
 function view(){const s=current();const modelsReady=TEAM_ROLES.every(r=>s.roles[r].provider&&s.roles[r].model);return {settings:{roles:s.roles,limits:s.limits,reviewPlan:s.reviewPlan},disclosureAccepted:s.disclosureAccepted,keyConfigured:keyInfo.configured,keyWritable:keyInfo.writable,keySource:keyInfo.source,credentialRef:JEV_CREDENTIAL_REF,revision,configured:modelsReady&&keyInfo.configured&&s.disclosureAccepted,writable:!!ctx.get?.('settings')?.writable&&!!entryId,disclosure:JEV_DISCLOSURE};}
 return {current,view,
  async refresh(){const credentials=ctx.get?.('credentials');try{keyInfo=credentials?await credentials.describe(JEV_CREDENTIAL_REF):{configured:false,writable:false};}catch{keyInfo={configured:false,writable:false};}let descriptor;try{descriptor=ctx.get?.('settings')?.describe({redactSecrets:true}).find(x=>x.ns===entryId);}catch{throw new TeamHostError('SETTINGS_UNAVAILABLE','宿主设置当前无法读取，请刷新后重试。');}revision=descriptor?.revision??0;return view();},
  async configure(input){
   if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['settings','disclosureAccepted','expectedRevision'].includes(k))||!input.settings||Object.keys(input.settings).some(k=>!['roles','limits','reviewPlan'].includes(k))||!Number.isInteger(input.expectedRevision)||input.expectedRevision<0)throw new TeamHostError('INVALID_SETTINGS','设置参数无效，请刷新后重试。');
   const next=validated({...input.settings,disclosureAccepted:input.disclosureAccepted});
   const settings=ctx.get?.('settings');if(!entryId||!settings?.writable)throw new TeamHostError('SETTINGS_UNAVAILABLE','当前宿主没有可写的原生设置，请检查所使用的 profile。');
   try{await settings.update(entryId,{teamSetup:next},input.expectedRevision);}catch(e){throw new TeamHostError(e?.code==='SETTINGS_CONFLICT'?'SETTINGS_CONFLICT':'SETTINGS_UNAVAILABLE',e?.code==='SETTINGS_CONFLICT'?'设置已在别处变化，请刷新再保存。':'设置未保存，请检查宿主 profile；不会自动重试。');}
   return this.refresh();
  },
 };
}
export function createHostJevClient(ctx,store,{fetchImpl=fetch}={}){
 let available=false;
 return {mode:'live',
  async refresh(){const s=await store.refresh();available=s.keyConfigured&&s.disclosureAccepted;return s;},
  async status(){const s=await this.refresh();return {configured:s.keyConfigured,available,endpoint:JEV_ENDPOINT,disclosure:JEV_DISCLOSURE,reason:!s.keyConfigured?'请在设置 → 多模型团队填写 Jev API key。':!s.disclosureAccepted?'请在团队设置中明确启用 TypeSafe 数据传输。':undefined};},
  preflight(){if(!available)throw new TeamHostError('SETUP_REQUIRED','请先在设置 → 多模型团队完成模型、Jev key 和启用授权。');},
  async decide(spec){
   const state=await this.refresh();if(!state.disclosureAccepted)throw new TeamHostError('CONSENT_REVOKED','TypeSafe 数据传输已停用，后续请求已阻止。');
   if(spec.signal.aborted)throw new TeamHostError('CANCELLED','运行已取消。');
   let secret;try{secret=await ctx.get?.('credentials')?.resolve(JEV_CREDENTIAL_REF);}catch{throw new TeamHostError('JEV_CREDENTIAL_UNAVAILABLE','Jev 凭据当前无法读取，请检查宿主凭据设置。');}
   if(!secret?.value)throw new TeamHostError('JEV_NOT_CONFIGURED','Jev key 已移除或不可用，请打开团队设置。');
   // The native provider owns storage. Resolve per request, never export to env or a model.
   const client=createJevClient({credentialEnv:JEV_CREDENTIAL_REF},{resolveCredential:()=>secret.value,fetchImpl});
   return client.decide(spec);
  },
 };
}
