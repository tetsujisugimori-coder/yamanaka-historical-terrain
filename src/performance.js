// Bounded observational timing. CPU submission is not GPU completion.
export function createPerformanceLog(clock=()=>performance.now()){
 const entries=[];let renderRequests=0,renderSubmissions=0;
 const add=entry=>{entries.push({...entry});if(entries.length>128)entries.shift();};
 return {clock,add,request(){renderRequests++;},submitted(ms){renderSubmissions++;add({stage:'renderCPU',ms});},snapshot(){return {entries:entries.map(x=>({...x})),renderRequests,renderSubmissions,gpuCompletion:'NOT_TESTED',scope:'monotonic CPU wall timings; renderCPU includes command submission, not GPU duration'};}};
}
export async function timedGLB(loader,url,log,fetcher=fetch){
 let t=log.clock();const response=await fetcher(url);if(!response.ok)throw new Error(`GLB ${response.status} ${url}`);const bytes=await response.arrayBuffer();log.add({stage:'fetch',url,ms:log.clock()-t,bytes:bytes.byteLength});
 t=log.clock();const value=await loader.parseAsync(bytes,new URL('.',new URL(url,location.href)).href);log.add({stage:'parse',url,ms:log.clock()-t});return value;
}
export function createFrameScheduler(draw,request=requestAnimationFrame){
 let pending=false;
 return ()=>{if(pending)return;pending=true;request(()=>{pending=false;draw();});};
}
