import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
export function config(kind,baseline,candidate,baselineUrl,candidateUrl){
 if(!['overhead','optimization','optimization-detailed'].includes(kind))throw Error('unknown experiment');
 const detailed=kind==='optimization-detailed',count=kind==='overhead'?6:detailed?3:8;
 const plan={kind,blocks:count,viewport:[1280,900],dpr:1,motion:'no-preference',caches:['cold','reload-partial'],schedule:kind==='overhead'?[['I','A','AD'],['AD','A','I'],['A','AD','I'],['I','AD','A'],['AD','I','A'],['A','I','AD']]:Array.from({length:count},()=>['Apre','B','Apost']),scope:'facility task landscape→inner→walk start/exit→2RAF; initial ready separate; no GPU completion'};
 const v=(dir,url,profile,logger='bounded')=>({dir,url,query:profile?'?profileJ':'',logger,profile});
 return {plan,variants:kind==='overhead'?{I:v(baseline,baselineUrl,false,'none'),A:v(candidate,candidateUrl,false),AD:v(candidate,candidateUrl,true)}:{Apre:v(baseline,baselineUrl,detailed),B:v(candidate,candidateUrl,detailed),Apost:v(baseline,baselineUrl,detailed)}};
}
if(import.meta.url===pathToFileURL(process.argv[1]??'').href){const [kind,b,c,bu,cu,out]=process.argv.slice(2);fs.writeFileSync(out,JSON.stringify(config(kind,b,c,bu,cu),null,2));}
