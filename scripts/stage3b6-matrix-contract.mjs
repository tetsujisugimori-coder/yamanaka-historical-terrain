/** B6a fixed execution set. This only audits coverage, not the truth of observations. */
export function matrixPlan(filter=null,smoke=false){
 if(filter!==null&&!['chromium','webkit'].includes(filter))throw Error('UNKNOWN_ENGINE');
 const engines=filter?[filter]:['chromium','webkit'],widths=smoke?[375]:[375,390,765,1280],motions=smoke?['no-preference']:['no-preference','reduce'],rows=[];
 for(const engine of engines){
  for(const width of widths)for(const motion of motions){
   const key=`${engine}-${width}-${motion}`;rows.push({key,kind:'PRODUCTION'});
   for(const action of ['region','model','overview','return'])for(const order of ['normal','delayed'])rows.push({key:`${key}-race-${action}-${order}`,kind:'CONTROLLED_RACE'});
  }
  for(const fault of ['503','invalid','empty'])rows.push({key:`${engine}-${fault}`,kind:'INJECTED'});
 }
 return {engines,widths,motions,rows};
}
export function assertMatrix(rows,plan){
 const expected=new Map(plan.rows.map(r=>[r.key,r.kind])),seen=new Set();
 for(const row of rows){
  if(seen.has(row.key))throw Error(`DUPLICATE_ROW:${row.key}`);seen.add(row.key);
  if(!expected.has(row.key))throw Error(`EXTRA_ROW:${row.key}`);
  if(row.kind!==expected.get(row.key))throw Error(`WRONG_KIND:${row.key}`);
 }
 const missing=[...expected.keys()].filter(key=>!seen.has(key));if(missing.length)throw Error(`MISSING_ROWS:${missing.join(',')}`);
 return {status:'PASS',rows:rows.length,scope:'exact key/kind coverage only; product success is separate'};
}
