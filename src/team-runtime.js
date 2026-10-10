import {JevTeamController} from './jev-controller.js';
import {projectJevText,selectJevModel} from './jev-client.js';
import {createAutoVerifier} from './auto-verification.js';
import {createSetupStore,createHostJevClient} from './team-setup.js';
import {createHash,randomUUID} from 'node:crypto';
import {validateConfig} from './team-contracts.js';
import {createExecutionAdapter,TeamHostError} from './host-adapter.js';
import {projectIdentity,mutationProjectIdentity,shellWriteProjects,createProjectLeases,occupancy,occupiedMessage} from './project-leases.js';
const prefix='dsh-desktop-workflow/team/';
const fields=(value,names)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(k=>names.includes(k));
const validSession=id=>typeof id==='string'&&id.length>0&&id.length<=128;
const unavailable=()=>({available:false,providers:[],reason:'当前宿主未加载 agents、subagents、llm、tools 或 sandboxPolicy 服务，团队执行不可用。'});
export function createTeamRuntime(ctx,serverConfig={},dependencies={}){
 const requestedJevModel=selectJevModel({model:serverConfig.jev?.model}),shadowConfig=serverConfig.jev?.shadow;
 if(shadowConfig?.enabled===true)selectJevModel({model:shadowConfig.model});
 if(shadowConfig?.enabled===true&& !/^jev-\d+\.\d+\.\d+(?:-[a-z0-9.]+)?$/.test(shadowConfig.model))throw new TeamHostError('JEV_SHADOW_MODEL','影子评估需要用户明确配置固定 Jev 版本。');
 const maxShadowCalls=shadowConfig?.enabled===true||dependencies.shadowJev?shadowConfig?.maxCalls??2:2;
 if(!Number.isInteger(maxShadowCalls)||maxShadowCalls<0||maxShadowCalls>20)throw new TeamHostError('JEV_SHADOW_LIMIT','影子评估调用上限必须为 0–20。');
 let controller,closed=false,disposal;const owner={},requests=new Map(),commandPending=new Map(),commandStates=new Map();
 const resolveProject=sessionId=>{const parent=ctx.agents.get(sessionId);if(!parent)throw new TeamHostError('SESSION_UNAVAILABLE','当前会话不可用。');try{return (dependencies.projectIdentity??projectIdentity)(parent.session.header.cwd);}catch{throw new TeamHostError('PROJECT_UNAVAILABLE','无法确认当前项目边界，未启动团队。');}};
 const leases=createProjectLeases(owner,resolveProject);
 const decorateSnapshot=snapshot=>{
  const lease=snapshot&&leases.get(snapshot.sessionId);
  const diagnostic=snapshot&&(diagnostics.get(snapshot.sessionId)?.runId===snapshot.id?diagnostics.get(snapshot.sessionId):snapshot.diagnostic);if(snapshot&&diagnostic)snapshot={...snapshot,diagnostic};
  return snapshot&&lease?.runId===snapshot.id&&lease.poisoned?{...snapshot,status:'blocked',lifecycle:'quarantined',diagnostic:lease.diagnostic,message:`${lease.poisonSource==='verification'?'项目检查':'子代理'}清理未确认，不能宣称已停止。${occupiedMessage(lease)}`} : snapshot;
 };
 const currentSnapshot=(sessionId,runId)=>{
  const current=controller.snapshot(sessionId);const found=current&&(!runId||current.id===runId)?current:leases.snapshot(sessionId,runId);
  if(runId&&!found)throw new TeamHostError('RUN_NOT_FOUND','当前会话没有这个运行记录。');return decorateSnapshot(found);
 };
 const save=sessionId=>leases.save(decorateSnapshot(controller.snapshot(sessionId)));
 const executor=createExecutionAdapter(ctx,{
  guardProject:(agent,exec)=>{
   const sessionId=agent?.session?.header?.parentSession||agent?.id,identify=dependencies.projectIdentity??projectIdentity;
   const denied=project=>{const occupied=leases.conflict(sessionId,project,{includeSession:false});return occupied&&(!project||occupied.poisoned||occupied.legacy&&!occupied.project||occupied.sessionId!==sessionId)?occupiedMessage(occupied):undefined;};
   if(!agent?.session?.header)return denied();
   let project;try{project=identify(agent.session.header.cwd);}catch{return denied();}
   const blocked=denied(project);if(blocked)return blocked;
   if(['write','edit'].includes(exec?.name)){
    try{return denied(mutationProjectIdentity(agent.session.header.cwd,exec.arguments?.file_path,identify));}catch{return denied();}
   }
   if(leases.get(sessionId))return;
   if(['bash','pwsh'].includes(exec?.name)){
    try{const backend=agent.ctx?.get?.(exec.name)??ctx.get?.(exec.name),policy=ctx.get?.('sandboxPolicy')?.resolve({session:agent.session}),mode=exec.arguments?.sandbox_permissions??policy?.mode;if(['workspace-write','read-only'].includes(backend?.sandboxMode)){if(mode==='read-only')return;if(mode==='workspace-write'){for(const writable of shellWriteProjects(policy.workspaceRoot,identify)){const conflict=denied(writable);if(conflict)return conflict;}return;}}}catch{}
   }
   return denied()? '存在项目占用，当前操作的写入范围无法核验，已阻止修改。':undefined;
  },
  onCleanupFailed:(sessionId,source='subagent',diagnostic)=>{leases.poison(sessionId,source,diagnostic);const snapshot=controller?.snapshot(sessionId);if(snapshot)controller.cancel(sessionId,snapshot.id);},
  onParentUnavailable:sessionId=>{const lease=leases.get(sessionId);if(lease?.owner===owner)lease.state='cancelling';const snapshot=controller?.snapshot(sessionId);if(snapshot)controller.cancel(sessionId,snapshot.id);},
 });
 const setup=dependencies.setup??createSetupStore(ctx,serverConfig),jev=dependencies.jev??createHostJevClient(ctx,setup,{model:requestedJevModel});
 const shadowJev=dependencies.shadowJev??(shadowConfig?.enabled===true?createHostJevClient(ctx,setup,{model:shadowConfig.model}):undefined);
 const diagnostics=new Map();
 const verifier=dependencies.verifier??createAutoVerifier({executeTool:executor.executeTool,shellName:executor.shellName,poison:executor.poison,onPolicy:executor.setProjectPolicy,onDiagnostic:(sessionId,diagnostic)=>{diagnostics.set(sessionId,diagnostic);const lease=leases.get(sessionId);if(lease?.owner===owner)lease.diagnostic=diagnostic;}});
 controller=new JevTeamController({execute:spec=>executor.execute(spec),jev,verifier,shadowJev,maxShadowCalls,trace:serverConfig.jev?.trace===true,id:()=>randomUUID()});
 const publicContext=sessionId=>{
  const context=executor.context(sessionId);let occupied;
  if(context.available){try{occupied=leases.conflict(sessionId,resolveProject(sessionId));}catch(error){context.canStart=false;context.reason=error.message;}}
  return {...context,...occupied?{canStart:false,reason:occupiedMessage(occupied),occupancy:occupancy(occupied)}:{},diagnostic:diagnostics.get(sessionId),setupRequired:!setup.view().configured||commandStates.get(sessionId)?.kind==='settings-required',lastCommand:commandStates.get(sessionId)};
 };
 const response=(sessionId,runId)=>({snapshot:currentSnapshot(sessionId,runId),context:publicContext(sessionId),history:leases.history(sessionId)});
 function finish(lease){save(lease.sessionId);executor.releaseSession(lease.sessionId);if(!lease.poisoned){lease.state='settled';leases.release(lease);}}
 const api={
  catalog:async selected=>({...await executor.catalog(selected),jev:await jev.status(),verificationProfiles:verifier.profiles,automaticVerification:!!verifier.automatic}),
  settings:async()=>setup.refresh(),
  async configure(input){if(input?.disclosureAccepted===true){const validated=validateConfig({sessionId:'settings',goal:'settings validation',...input.settings});await executor.validateModels(validated.roles,AbortSignal.timeout(15000));}const saved=await setup.configure(input);for(const[id,state]of commandStates)if(state.kind==='settings-required')commandStates.delete(id);if(!saved.disclosureAccepted)for(const lease of leases.owned()){const snapshot=controller.snapshot(lease.sessionId);if(snapshot)controller.cancel(snapshot.sessionId,snapshot.id);}return saved;},
  snapshot(sessionId,runId){if(!validSession(sessionId)||runId!==undefined&&(typeof runId!=='string'||runId.length>160))throw new TeamHostError('SESSION_REQUIRED','请先打开真实 DSH 会话。');save(sessionId);return response(sessionId,runId);},
  trace(input){if(!fields(input,['sessionId','runId'])||!validSession(input.sessionId)||input.runId!==undefined&&(typeof input.runId!=='string'||input.runId.length>160))throw new TeamHostError('INVALID_INPUT','评估记录查询参数无效。');return controller.trace(input.sessionId,input.runId);},
  async start(input,externalSignal){
   if(!fields(input,['sessionId','contextKey','requestId','goal','settings'])||typeof input.requestId!=='string'||!/^[A-Za-z0-9_-]{8,128}$/.test(input.requestId)||!fields(input.settings,['roles','limits','reviewPlan','routeEnabled','jev','verification']))throw new TeamHostError('INVALID_INPUT','启动参数无效。');
   const config=validateConfig({sessionId:input.sessionId,goal:input.goal,...input.settings});
   if(config.jev?.enabled!==true||config.jev.disclosureAccepted!==true)throw new TeamHostError('JEV_CONSENT_REQUIRED','请确认本次 TypeSafe 数据传输范围。');
   if(closed)throw new TeamHostError('UNAVAILABLE','团队服务已关闭。');
   executor.verifyContext(config.sessionId,input.contextKey);
   await jev.refresh?.();jev.preflight();verifier.preflight(config);
   if(closed)throw new TeamHostError('UNAVAILABLE','团队服务已关闭。');
   const key=`${config.sessionId}:${input.requestId}`;if(requests.has(key))return requests.get(key).promise;
   const {lease,occupied}=leases.acquire(config.sessionId,resolveProject(config.sessionId));
   if(occupied)throw new TeamHostError(occupied.sessionId===config.sessionId?'SESSION_BUSY':'PROJECT_BUSY',occupiedMessage(occupied));
   const entry={status:'pending',promise:null};
   const pending=(async()=>{const abort=new AbortController();let timer;
    try{
     await Promise.race([executor.validateModels(config.roles,abort.signal),new Promise((_,reject)=>{timer=setTimeout(()=>{abort.abort();reject(new TeamHostError('MODEL_PREFLIGHT_TIMEOUT','模型元数据验证超时，尚未启动任何模型调用。'));},15000);})]);
     if(externalSignal?.aborted)throw new TeamHostError('CANCELLED','命令已取消，未启动新的团队。');
     if(closed)throw new TeamHostError('UNAVAILABLE','团队服务已关闭。');
     executor.verifyContext(config.sessionId,input.contextKey);const currentProject=resolveProject(config.sessionId);if(currentProject.key!==lease.project.key||currentProject.root!==lease.project.root)throw new TeamHostError('CONTEXT_CHANGED','项目边界已变化，未启动团队。');executor.beginSession(config.sessionId,input.contextKey);diagnostics.delete(config.sessionId);
     const snapshot=controller.start(config);lease.runId=snapshot.id;lease.state='running';leases.save(snapshot);
     controller.wait(snapshot.id).then(()=>finish(lease),()=>{leases.poison(config.sessionId,'subagent');finish(lease);});
     return response(config.sessionId);
    }finally{clearTimeout(timer);abort.abort();}
   })();
   entry.promise=pending;requests.set(key,entry);
   while(requests.size>256){const evict=[...requests].find(([,r])=>r.status!=='pending');if(!evict)break;requests.delete(evict[0]);}
   try{const value=await pending;entry.status='accepted';entry.runId=value.snapshot.id;return value;}
   catch(error){entry.status='failed';entry.error=error instanceof TeamHostError?error.message:'启动配置无效，未成功启动团队。';if(!lease.runId){executor.releaseSession(config.sessionId);leases.release(lease);}throw error;}
  },
  command(invocation){
   const sessionId=invocation.agent?.id;
   if(!validSession(sessionId)||ctx.agents.get(sessionId)!==invocation.agent)return Promise.resolve({kind:'error',text:'当前主会话不可用。'});
   if(commandPending.has(sessionId))return commandPending.get(sessionId);
   const pending=(async()=>{
    const set=(kind,message,runId)=>{commandStates.set(sessionId,{kind,message,...runId?{runId}:{}});return {kind:'success',text:message};};
    try{
     const goal=typeof invocation.rawInput==='string'?invocation.rawInput.trim():'';
     if(!goal)return set('help','在聊天框输入 /team + 任务正文。首次使用请打开设置 → 多模型团队。');
     if(goal.length>8000)return {kind:'error',text:'任务正文过长，请缩短到 8000 字符以内。'};
     projectJevText(goal,8000);const saved=await setup.refresh();
     if(!saved.configured)return set('settings-required','请先在设置 → 多模型团队选择六个岗位模型、填写 Jev key 并启用服务。');
     if(invocation.signal?.aborted)return {kind:'error',text:'命令已取消，未启动新的团队。'};
     const lease=leases.get(sessionId);if(lease?.owner===owner&&!lease.poisoned&&lease.runId)return set('started','此会话已有团队运行，已打开当前进度；没有重复派发。',lease.runId);
     const context=publicContext(sessionId);if(!context.canStart)return set('blocked',context.reason||'当前会话不可启动。');
     const requestId='command-'+createHash('sha256').update(String(invocation.commandId)).digest('hex').slice(0,40);
     const result=await api.start({sessionId,contextKey:context.contextKey,requestId,goal,settings:{...saved.settings,routeEnabled:false,jev:{enabled:true,disclosureAccepted:true},verification:{profileId:verifier.automatic?'auto':verifier.profiles[0]?.id,scope:['workspace']}}},invocation.signal);
     return set('started','团队已开始；正在自动检查当前项目，进度显示在右侧。',result.snapshot.id);
    }catch(error){return set(error instanceof TeamHostError&&/^(SETUP_|JEV_NOT_CONFIGURED|MODEL_)/.test(error.code)?'settings-required':'blocked',error instanceof TeamHostError?error.message:'团队无法启动，请查看设置或宿主权限；未自动重试。');}
   })();commandPending.set(sessionId,pending);pending.finally(()=>{if(commandPending.get(sessionId)===pending)commandPending.delete(sessionId);});return pending;
  },
  request(input){if(!fields(input,['sessionId','requestId'])||!validSession(input.sessionId)||typeof input.requestId!=='string')throw new TeamHostError('INVALID_INPUT','启动查询参数无效。');const entry=requests.get(`${input.sessionId}:${input.requestId}`);return {status:entry?.status||'unknown',error:entry?.error,...response(input.sessionId,entry?.runId)};},
  cancel(input){if(!fields(input,['sessionId','runId'])||!validSession(input.sessionId)||typeof input.runId!=='string')throw new TeamHostError('INVALID_INPUT','取消参数无效。');const snapshot=controller.cancel(input.sessionId,input.runId);if(!snapshot)throw new TeamHostError('RUN_NOT_FOUND','当前会话没有这个团队运行。');const lease=leases.get(input.sessionId);if(lease?.owner===owner&&!lease.poisoned)lease.state='cancelling';save(input.sessionId);return response(input.sessionId);},
  dispose(){if(disposal)return disposal;closed=true;for(const lease of leases.owned())if(!lease.poisoned)lease.state='cancelling';disposal=Promise.resolve().then(async()=>{await Promise.allSettled([...requests.values()].filter(e=>e.status==='pending').map(e=>e.promise));await controller.dispose();for(const lease of leases.owned())if(lease.runId)finish(lease);await executor.dispose();requests.clear();commandPending.clear();});return disposal;},
 };return api;
}

export function registerTeamCommand(ctx,getRuntime){return ctx.commands.register({name:'team',description:'用已配置的六岗位团队执行任务，自动显示右侧进度',input:{hint:'任务正文'},recordInput:false,handler:invocation=>{const runtime=getRuntime();return runtime?runtime.command(invocation):{kind:'error',text:'团队服务尚未加载，请检查插件与宿主。'};}});}

/** Exact authenticated /api endpoints; never replace the host gateway interceptor. */
export function registerTeamRoutes(ctx,getRuntime){
  const disposers=[];
  for(const action of ['catalog','snapshot','start','cancel','request','settings','configure','trace']){
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
          if(action==='settings'){if(!fields(payload??{},[]))throw new TeamHostError('INVALID_INPUT','设置读取不接受额外参数。');result={ok:true,value:await runtime.settings()};}
          else if(action==='snapshot'){
            if(!fields(payload,['sessionId','runId']))throw new TeamHostError('INVALID_INPUT','状态查询参数无效。');
            result={ok:true,value:runtime.snapshot(payload.sessionId,payload.runId)};
          }else result={ok:true,value:await runtime[action](payload)};
        }
      }catch(error){result={ok:false,error:{code:error instanceof TeamHostError?error.code:'INVALID_INPUT',message:error instanceof TeamHostError?error.message:'团队配置或任务结构无效，请检查输入；不会自动修改宿主权限。',details:{}}};}
      return Response.json({type:'server-response',rpcId:envelope.rpcId,result},{headers:{'Cache-Control':'no-store'}});
    }}));
  }
  return async()=>{for(const dispose of disposers.reverse())await dispose();};
}
