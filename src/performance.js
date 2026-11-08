// Bounded observational timing. CPU submission is not GPU completion.
export function createPerformanceLog(clock=()=>performance.now()){
 const entries=[];let renderRequests=0,renderSubmissions=0;
 const detailed=typeof location!=="undefined"&&new URLSearchParams(location.search).has("profileJ");
 const spans=[];let dropped=0;
 const measure=(stage,fn)=>{if(!detailed)return fn();const start=clock();try{return fn();}finally{if(spans.length<10000)spans.push({stage,start,end:clock()});else dropped++;}};
 const add=entry=>{const end=clock();entries.push({...entry,end,start:end-entry.ms});if(entries.length>128)entries.shift();};
 return {clock,add,measure,request(){renderRequests++;},submitted(ms){renderSubmissions++;add({stage:'renderCPU',ms});},snapshot(){return {detailed,spans:spans.map(x=>({...x})),dropped,entries:entries.map(x=>({...x})),renderRequests,renderSubmissions,gpuCompletion:'NOT_TESTED',scope:'monotonic CPU wall timings; renderCPU includes command submission, not GPU duration'};}};
}
export async function timedGLB(loader,url,log,fetcher=fetch){
 let t=log.clock();const response=await fetcher(url);if(!response.ok)throw new Error(`GLB ${response.status} ${url}`);const bytes=await response.arrayBuffer();log.add({stage:'fetch',url,ms:log.clock()-t,bytes:bytes.byteLength});
 t=log.clock();const value=await loader.parseAsync(bytes,new URL('.',new URL(url,location.href)).href);log.add({stage:'parse',url,ms:log.clock()-t});return value;
}
export function createFrameScheduler(draw,request=requestAnimationFrame){
 let pending=false;
 return ()=>{if(pending)return;pending=true;request(()=>{pending=false;draw();});};
}
