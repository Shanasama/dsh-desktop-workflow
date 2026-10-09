import { JevTeamController } from './jev-controller.js';
import {createJevClient} from './jev-client.js';
import {createVerifier} from './verification.js';
import {createCredentialBridge} from './credential-bridge.js';
import {readRunConfig, saveRunConfig} from './server-config.js';
import { validateConfig } from './team-contracts.js';
import { createExecutionAdapter, TeamHostError } from './host-adapter.js';

const LEASE_KEY=Symbol.for('dsh-desktop-workflow:exclusive-run:v2');
const leases=globalThis[LEASE_KEY]??(globalThis[LEASE_KEY]={current:null});
const prefix='dsh-desktop-workflow/team/';
const fields=(value,names)=>value && typeof value==='object' && !Array.isArray(value) && Object.keys(value).every(k=>names.includes(k));
const validSession=id=>typeof id==='string' && id.length>0 && id.length<=128;
const unavailable=()=>({available:false,providers:[],reason:'当前宿主未加载 agents、subagents、llm、tools 或 sandboxPolicy 服务，团队执行不可用。'});
export function createTeamRuntime(ctx,serverConfig={}, dependencies={}){
  let controller;const owner={};
  const decorateContext=context=>leases.current?{...context,canStart:false,reason:leases.current.poisoned?'上一次子代理清理未确认，已锁定新运行。请检查残留任务并重启宿主。':'已有团队运行或启动请求；为避免共享工作区冲突，本插件一次只运行一个团队。'}:context;
  const decorateSnapshot=snapshot=>snapshot&&leases.current?.poisoned&&leases.current.owner===owner?{...snapshot,status:'blocked',message:'子代理清理未确认，不能宣称已停止；新运行已锁定。请检查残留任务并重启宿主。'}:snapshot;
  const executor=createExecutionAdapter(ctx,{onCleanupFailed:sessionId=>{if(leases.current?.owner===owner)leases.current.poisoned=true;const snapshot=controller?.snapshot(sessionId);if(snapshot)controller.cancel(sessionId,snapshot.id);},onParentUnavailable:(sessionId)=>{const snapshot=controller?.snapshot(sessionId);if(snapshot)controller.cancel(sessionId,snapshot.id);}});
  // Resolve the Jev key through the host credentials service as well as the environment,
  // so the same variable NAME can be managed in DSH instead of only by exporting it.
  const bridge=createCredentialBridge(dependencies.resolveCredentials ?? (()=>ctx.get?.('credentials')));
  const credentialEnv=serverConfig.jev?.credentialEnv;
  const jev=dependencies.jev??createJevClient(serverConfig.jev,{resolveCredential:name=>bridge.resolve(name)});
  if(!dependencies.jev)void bridge.refresh([credentialEnv]);
  const verifier=dependencies.verifier??createVerifier({profiles:serverConfig.verificationProfiles,executeTool:executor.executeTool,poison:executor.poison});
  controller=new JevTeamController({execute:spec=>executor.execute(spec),jev,verifier});
  const requests=new Map();
  let closed=false;
  return {
    catalog:async selected=>{
      await bridge.refresh([credentialEnv]);
      return {...await executor.catalog(selected),jev:{...jev.status(),credential:bridge.snapshot([credentialEnv])},verificationProfiles:verifier.profiles};
    },
    snapshot(sessionId){
      if(!validSession(sessionId))throw new TeamHostError('SESSION_REQUIRED','请先打开真实 DSH 会话。');
      void bridge.refresh([credentialEnv]);
      return {snapshot:decorateSnapshot(controller.snapshot(sessionId)),context:decorateContext(executor.context(sessionId))};
    },
    async start(input){
      if(!fields(input,['sessionId','contextKey','requestId','goal','settings']) || typeof input.requestId!=='string' || !/^[A-Za-z0-9_-]{8,128}$/.test(input.requestId) || !fields(input.settings,['roles','limits','reviewPlan','routeEnabled','jev','verification']))throw new TeamHostError('INVALID_INPUT','启动参数无效。');
      const config=validateConfig({sessionId:input.sessionId,goal:input.goal,...input.settings});
      if(config.jev?.enabled!==true||config.jev.disclosureAccepted!==true)throw new TeamHostError('JEV_CONSENT_REQUIRED','请确认本次 TypeSafe 数据传输范围。');
      jev.preflight();verifier.preflight(config);
      if(closed)throw new TeamHostError('UNAVAILABLE','团队服务已关闭。');
      executor.verifyContext(config.sessionId,input.contextKey);
      const key=`${config.sessionId}:${input.requestId}`;
      if(requests.has(key))return requests.get(key).promise;
      if(leases.current)throw new TeamHostError('HOST_BUSY',leases.current.poisoned?'上一次子代理清理未确认，已锁定新运行。请检查残留任务并重启宿主。':'已有团队运行或启动请求，请等待结束后再试。');
      const lease={owner,sessionId:config.sessionId,poisoned:false};leases.current=lease;
      const entry={status:'pending',promise:null};
      const pending=(async()=>{
        const abort=new AbortController();let timer;
        try{
          await Promise.race([executor.validateModels(config.roles,abort.signal),new Promise((_,reject)=>{timer=setTimeout(()=>{abort.abort();reject(new TeamHostError('MODEL_PREFLIGHT_TIMEOUT','模型元数据验证超时，尚未启动任何模型调用。'));},15000);})]);
          if(closed)throw new TeamHostError('UNAVAILABLE','团队服务已关闭。');
          executor.verifyContext(config.sessionId,input.contextKey);
          executor.beginSession(config.sessionId,input.contextKey);
          const snapshot=controller.start(config);lease.runId=snapshot.id;
          controller.wait(snapshot.id).finally(()=>{executor.releaseSession(config.sessionId);if(leases.current===lease&&!lease.poisoned)leases.current=null;}).catch(()=>{});
          return {snapshot:decorateSnapshot(snapshot),context:decorateContext(executor.context(config.sessionId))};
        }finally{clearTimeout(timer);abort.abort();}
      })();
      entry.promise=pending;requests.set(key,entry);while(requests.size>32)requests.delete(requests.keys().next().value);
      try{const value=await pending;entry.status='accepted';entry.runId=value.snapshot.id;return value;}catch(error){entry.status='failed';if(!lease.runId)executor.releaseSession(config.sessionId);entry.error=error instanceof TeamHostError?error.message:'启动配置无效，未成功启动团队。';if(leases.current===lease&&!lease.poisoned)leases.current=null;throw error;}
    },
    request(input){if(!fields(input,['sessionId','requestId'])||!validSession(input.sessionId)||typeof input.requestId!=='string')throw new TeamHostError('INVALID_INPUT','启动查询参数无效。');const entry=requests.get(`${input.sessionId}:${input.requestId}`);return {status:entry?.status||'unknown',error:entry?.error,snapshot:decorateSnapshot(controller.snapshot(input.sessionId)),context:decorateContext(executor.context(input.sessionId))};},
    cancel(input){if(!fields(input,['sessionId','runId']) || !validSession(input.sessionId) || typeof input.runId!=='string')throw new TeamHostError('INVALID_INPUT','取消参数无效。');const snapshot=controller.cancel(input.sessionId,input.runId);if(!snapshot)throw new TeamHostError('RUN_NOT_FOUND','当前会话没有这个团队运行。');return {snapshot:decorateSnapshot(snapshot),context:decorateContext(executor.context(input.sessionId))};},
    async dispose(){closed=true;await controller.dispose();await executor.dispose();await bridge.dispose();requests.clear();if(leases.current?.owner===owner&&!leases.current.poisoned)leases.current=null;},
  };
}

/** Exact authenticated /api endpoints; never replace the host gateway interceptor. */
export function registerTeamRoutes(ctx,getRuntime){
  const disposers=[];
  for(const action of ['catalog','snapshot','start','cancel','request']){
    const endpoint=prefix+action;
    disposers.push(ctx.connection.fetch.register({path:'/api/'+endpoint,methods:['POST'],requestBody:'buffered',async fetch(request){
      let envelope;
      try{envelope=await request.json();}catch{return new Response('Invalid JSON',{status:400});}
      if(!envelope || envelope.type!=='client-request' || envelope.method!==endpoint || typeof envelope.rpcId!=='string' || envelope.rpcId.length>256)return new Response('Invalid RPC envelope',{status:400});
      const payload=envelope.payload;
      let result;
      try{
        if(JSON.stringify(payload??{}).length>32768)throw new TeamHostError('INVALID_INPUT','请求过大。');
        const runtime=getRuntime();
        if(action==='catalog'){
          if(!fields(payload??{},['selected']))throw new TeamHostError('INVALID_INPUT','目录查询参数无效。');
          result={ok:true,value:runtime?await runtime.catalog(payload?.selected??[]):unavailable()};
        }else{
          if(!runtime)throw new TeamHostError('UNSUPPORTED_HOST',unavailable().reason);
          if(action==='snapshot'){
            if(!fields(payload,['sessionId']))throw new TeamHostError('INVALID_INPUT','状态查询参数无效。');
            result={ok:true,value:runtime.snapshot(payload.sessionId)};
          }else result={ok:true,value:await runtime[action](payload)};
        }
      }catch(error){result={ok:false,error:{code:error instanceof TeamHostError?error.code:'INVALID_INPUT',message:error instanceof TeamHostError?error.message:'团队配置或任务结构无效，请检查输入；不会自动修改宿主权限。',details:{}}};}
      return Response.json({type:'server-response',rpcId:envelope.rpcId,result},{headers:{'Cache-Control':'no-store'}});
    }}));
  }
  // A configuration endpoint so the plugin's own view can read and save
  // `verificationProfiles`. It carries no secret, no executable path and no endpoint:
  // only an argv list plus timeouts, validated here exactly as the verifier validates it.
  disposers.push(ctx.connection.fetch.register({path:'/api/'+prefix+'server-config',methods:['POST'],requestBody:'buffered',async fetch(request){
    let envelope;
    try{envelope=await request.json();}catch{return new Response('Invalid JSON',{status:400});}
    const endpoint=prefix+'server-config';
    if(!envelope || envelope.type!=='client-request' || envelope.method!==endpoint || typeof envelope.rpcId!=='string' || envelope.rpcId.length>256)return new Response('Invalid RPC envelope',{status:400});
    const payload=envelope.payload;
    let result;
    try{
      if(JSON.stringify(payload??{}).length>32768)throw new TeamHostError('INVALID_INPUT','请求过大。');
      const configEditor=ctx.get?.('configEditor');
      if(!fields(payload??{},['action','verificationProfiles','models','verification','jev']))throw new TeamHostError('INVALID_INPUT','配置参数无效。');
      if(payload.action==='read'){
        // The host model catalog is what lets the form offer a picker instead of making
        // the user hand-type "provider/model".
        let models;
        try{models=await executor.catalog([]);}catch{models={available:false,providers:[],reason:'暂时无法读取宿主模型目录。'};}
        result={ok:true,value:{...readRunConfig(configEditor),models}};
      }
      else if(payload.action==='save'){
        const saved=await saveRunConfig({verificationProfiles:payload.verificationProfiles,models:payload.models,verification:payload.verification,jev:payload.jev},{configEditor,fallbackWrite:undefined});
        result={ok:true,value:{...saved,current:readRunConfig(configEditor)}};
      }else throw new TeamHostError('INVALID_INPUT','未知的配置操作。');
    }catch(error){
      const code=error instanceof TeamHostError?error.code:(error instanceof TypeError?'INVALID_CONFIG':'CONFIG_WRITE_FAILED');
      const message=error instanceof TeamHostError?error.message:(error instanceof TypeError?error.message:'验证配置未能保存，请检查宿主配置编辑服务后重试。');
      result={ok:false,error:{code,message,details:{}}};
    }
    return Response.json({type:'server-response',rpcId:envelope.rpcId,result},{headers:{'Cache-Control':'no-store'}});
  }}));
  return async()=>{for(const dispose of disposers.reverse())await dispose();};
}
