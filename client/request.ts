/** Deadline and lifecycle cancellation without permanently aborting future polls. */
export function requestWithDeadline<T>(call:(signal:AbortSignal)=>Promise<T>, lifecycle:AbortSignal, timeoutMs=15000):Promise<T> {
  return new Promise<T>((resolve,reject)=>{
    const request = new AbortController();
    let done=false;
    let timer:ReturnType<typeof setTimeout>;
    const finish=(error?:Error,value?:T)=>{
      if(done)return;done=true;clearTimeout(timer);lifecycle.removeEventListener('abort',abort);
      if(error){request.abort();reject(error);}else resolve(value as T);
    };
    const abort=()=>finish(new Error('Request cancelled.'));
    if(lifecycle.aborted){abort();return;}
    lifecycle.addEventListener('abort',abort,{once:true});
    timer=setTimeout(()=>finish(new Error(`工作流桥接服务在 ${Math.round(timeoutMs/1000)} 秒内未响应，请检查连接。`)),timeoutMs);
    try{call(request.signal).then(value=>finish(undefined,value),error=>finish(error instanceof Error?error:new Error('Bridge request failed.')));}catch(error){finish(error instanceof Error?error:new Error('Bridge request failed.'));}
  });
}
