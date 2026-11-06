import {parseAst} from 'vite';

const identifier=(node,name)=>node?.type==='Identifier'&&node.name===name;
const adjustCamera=node=>node?.type==='ExpressionStatement'
 &&node.expression.type==='CallExpression'&&!node.expression.optional&&node.expression.arguments.length===0
 &&node.expression.callee.type==='MemberExpression'&&!node.expression.callee.computed&&!node.expression.callee.optional
 &&identifier(node.expression.callee.object,'intents')&&identifier(node.expression.callee.property,'adjustCamera');

/** Recreate the initial-input bug, without depending on the loaded-model branch's formatting. */
export function mutateInitialCamera(source){
 const functions=[],pending=[parseAst(source)];
 while(pending.length){
  const node=pending.pop();
  if(!node||typeof node!=='object')continue;
  if(['FunctionDeclaration','FunctionExpression'].includes(node.type)&&identifier(node.id,'beginCameraIntent'))functions.push(node);
  for(const value of Object.values(node))if(Array.isArray(value))pending.push(...value);else if(value&&typeof value==='object')pending.push(value);
 }
 if(functions.length!==1)throw Error(`Initial-input mutation requires exactly one beginCameraIntent function; found ${functions.length}`);
 const fn=functions[0],[guard,adjust]=fn.body.body;
 const loadedReturn=guard?.consequent?.type==='BlockStatement'?guard.consequent.body.at(-1):guard?.consequent;
 // The initial (no currentModel) path must consist solely of adjustCamera().
 // Parsing, rather than text matching, excludes comments, strings and dead-code lookalikes.
 if(fn.type!=='FunctionDeclaration'||fn.async||fn.generator||fn.params.length!==0||fn.body.body.length!==2
  ||guard?.type!=='IfStatement'||!identifier(guard.test,'currentModel')||guard.alternate
  ||loadedReturn?.type!=='ReturnStatement'||!adjustCamera(adjust)){
  throw Error('Initial-input mutation requires the unmutated initial adjustCamera() path');
 }
 const originalFunction=source.slice(fn.start,fn.end),mutatedFunction='function beginCameraIntent(){return beginIntent();}';
 return{source:source.slice(0,fn.start)+mutatedFunction+source.slice(fn.end),originalFunction,mutatedFunction};
}

/** A negative control passes only when initial completion was actually discarded. */
export function initialCameraResultsAccepted(label,results){
 if(!['legacy','defect','fixed','mutation'].includes(label)||!Array.isArray(results))return false;
 const count=['legacy','defect'].includes(label)?8:72;
 return results.length===count&&Array.from(results).every(row=>{
  if(label!=='mutation')return row?.status===(label==='defect'?'FAIL':'PASS');
  const actual=row?.actual;
  return row?.status==='FAIL'&&row.mutationApplied===true
   &&Array.isArray(row.pageerrors)&&row.pageerrors.length===0
   &&actual?.activeViews===0
   &&Array.isArray(actual.inputs)&&actual.inputs.length>0&&Array.from(actual.inputs).every(input=>input?.trusted===true)
   &&actual.d?.state?.ready===false&&actual.d?.modelBounds===null&&actual.renderState==='loading';
 });
}
