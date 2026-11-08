import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseAst} from 'rollup/parseAst';
function walk(node,visit){if(!node||typeof node!=='object')return;visit(node);for(const [key,value] of Object.entries(node))if(key!=='parent'){if(Array.isArray(value))for(const child of value)walk(child,visit);else if(value&&typeof value==='object')walk(value,visit);}}
export function activeTerrainContract(source=readFileSync('src/main.js','utf8')) {
 const ast=parseAst(source),models=[],metadata=[];
 walk(ast,node=>{
  if(node.type==='FunctionDeclaration'&&node.id?.name==='getModel')walk(node.body,n=>{if(n.type==='VariableDeclarator'&&n.id?.name==='file'){if(source.slice(n.init.test.start,n.init.test.end).replace(/\s/g,'')!=="view==='reconstruction'"||source.slice(n.init.consequent.test.start,n.init.consequent.test.end).replace(/\s/g,'')!=="variant==='current'")throw Error('Active model selection contract mismatch');models.push(n.init?.consequent?.alternate?.value);}});
  if(node.type==='FunctionDeclaration'&&node.id?.name==='bootstrap')walk(node.body,n=>{if(n.type==='VariableDeclarator'&&n.id?.type==='ArrayPattern'&&n.id.elements.at(-1)?.name==='refinement'){const call=n.init?.argument,map=call?.arguments?.[0];if(source.slice(call.callee.start,call.callee.end)!=='Promise.all'||map?.callee?.property?.name!=='map'||source.slice(map.arguments[0].start,map.arguments[0].end).replace(/\s/g,'')!=='path=>json(assetPath(path))')throw Error('Active metadata loader contract mismatch');metadata.push(map?.callee?.object?.elements?.at(-1)?.value);}});
 });
 if(models.length!==1||!/^phase3[a-z]+$/.test(models[0]??''))throw Error('Active terrain GLB must be uniquely identified');
 const stem=models[0];
 if(metadata.length!==1||metadata[0]!==`data/${stem}.json`)throw Error('Active metadata and GLB version mismatch');
 for(const ext of ['json','glb'])if(!existsSync(`public/data/${stem}.${ext}`))throw Error('Active terrain asset missing');
 return {stem,glb:`public/data/${stem}.glb`,metadata:`public/data/${stem}.json`,route:`**/data/${stem}.glb`};
}
export const ACTIVE_TERRAIN=activeTerrainContract();

export const ACTIVE_CONTRACT_SHA256=createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex');
