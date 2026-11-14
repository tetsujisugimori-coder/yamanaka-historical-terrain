/** Preserve HTTP entity bytes, not hashes alone. No GLB/source-map duplication. */
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export function deliveryPath(url,base){
 const u=new URL(url),b=new URL(base);
 if(u.origin!==b.origin)return null;
 if(u.pathname==='/')return 'index.html';
 if(!/\.(?:js|css|json)$/.test(u.pathname))return null;
 const decoded=decodeURIComponent(u.pathname).replace(/^\//,'');
 if(decoded.split('/').some(p=>p==='..'||p==='.')||decoded.includes('\\'))throw Error('Unsafe delivery path');
 return decoded;
}
export async function preserveEntity({body,url,status,headers,base,out,dist='dist'}){
 const relative=deliveryPath(url,base);if(!relative)return null;
 const sha256=digest(body),rawFile=`http-bodies/${sha256}.bin`;
 await mkdir(path.join(out,'http-bodies'),{recursive:true});
 // Content-addressed duplicates have identical bytes; existing evidence remains immutable.
 try{await writeFile(path.join(out,rawFile),body,{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;if(digest(await readFile(path.join(out,rawFile)))!==sha256)throw Error('Existing HTTP evidence mismatch');}
 const row={url,status,headers,bytes:body.length,sha256,rawFile,buildPath:`dist/${relative}`,capturedAt:new Date().toISOString(),bodySemantics:'Playwright response.body: decoded HTTP entity bytes (not compressed wire packets)'};
 try{
  const built=await readFile(path.join(dist,relative));row.buildBytes=built.length;row.buildSha256=digest(built);row.matchesBuild=row.sha256===row.buildSha256;
  row.buildFile=`build-bodies/${row.buildSha256}.bin`;await mkdir(path.join(out,'build-bodies'),{recursive:true});
  try{await writeFile(path.join(out,row.buildFile),built,{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;if(digest(await readFile(path.join(out,row.buildFile)))!==row.buildSha256)throw Error('Existing build evidence mismatch');}
 }catch(e){if(e.code==='ENOENT'){row.matchesBuild=false;row.buildError='Build file missing';}else throw e;}
 return row;
}
