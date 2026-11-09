// Bounded observational timing. CPU submission is not GPU completion.
export function createPerformanceLog(clock=()=>performance.now()){
 const entries=[];let renderRequests=0,renderSubmissions=0;
 const detailed=typeof location!=="undefined"&&new URLSearchParams(location.search).has("profileJ");
 const spans=[];let dropped=0,entriesDropped=0;
 const measure=(stage,fn)=>{if(!detailed)return fn();const start=clock();try{return fn();}finally{if(spans.length<10000)spans.push({id:spans.length,stage,start,end:clock()});else dropped++;}};
 const add=entry=>{const end=entry.end??clock(),start=entry.start??(end-entry.ms);entries.push({...entry,end,start});if(entries.length>128){entries.shift();entriesDropped++;}};
 const interval=(stage,start,end,extra={})=>add({...extra,stage,start,end,ms:end-start});
 return {clock,add,interval,measure,request(){renderRequests++;},submitted(ms,start){renderSubmissions++;add({stage:'renderCPU',ms,...(start===undefined?{}:{start,end:start+ms})});},snapshot(){return {detailed,entriesDropped,spans:spans.map(x=>({...x})),dropped,entries:entries.map(x=>({...x})),renderRequests,renderSubmissions,gpuCompletion:'NOT_TESTED',scope:'monotonic CPU wall timings; renderCPU includes command submission, not GPU duration'};}};
}
export async function timedGLB(loader,url,log,fetcher=fetch){
 let t=log.clock();const response=await fetcher(url);if(!response.ok)throw new Error(`GLB ${response.status} ${url}`);const bytes=await response.arrayBuffer();log.interval('fetch',t,log.clock(),{url,bytes:bytes.byteLength});
 t=log.clock();const value=await loader.parseAsync(bytes,new URL('.',new URL(url,location.href)).href);log.interval('parse',t,log.clock(),{url});return value;
}
