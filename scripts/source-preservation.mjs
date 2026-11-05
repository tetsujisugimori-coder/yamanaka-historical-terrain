// Additional evidence records may share a URL. Existing records must retain all
// fields and order; a changed or removed old record is never an append-only edit.
export function appendOnlySources(original,current){
 try{const a=JSON.parse(original.toString()),b=JSON.parse(current.toString());
  return Array.isArray(a)&&Array.isArray(b)&&b.length>=a.length&&new Set(b.map(s=>s.id)).size===b.length&&JSON.stringify(b.slice(0,a.length))===JSON.stringify(a);
 }catch{return false;}
}
