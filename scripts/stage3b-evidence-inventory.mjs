import {readdir,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
export async function inventoryEvidence(root){
 const rows=[];
 async function visit(dir,prefix=''){
  for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
   const filename=prefix+entry.name;
   if(entry.isDirectory())await visit(path.join(dir,entry.name),filename+'/');
   else if(entry.isFile()){const bytes=await readFile(path.join(dir,entry.name));rows.push({filename,size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
   else throw Error('Unsupported evidence entry: '+filename);
  }
 }
 await visit(root);return rows;
}
