import { mkdir, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const raw=path.join(root,'data/raw'); await mkdir(raw,{recursive:true});
function xy(lon,lat,z){return [Math.floor((lon+180)/360*2**z),Math.floor((1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*2**z)];}
const jobs=[];
for(const [layer,z,b] of [['dem5a_png',15,[138.968,35.136,139.018,35.176]],['dem1a_png',17,[138.988,35.150,139.000,35.161]],['dem_png',14,[138.968,35.136,139.018,35.176]]]){
 const [x0,y0]=xy(b[0],b[3],z),[x1,y1]=xy(b[2],b[1],z);
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++) jobs.push([layer,z,x,y]);
}
jobs.push(['dem_png',14,...xy(138.99242,35.1564,14)]);
let i=0; await Promise.all(Array.from({length:4},async()=>{while(i<jobs.length){const [l,z,x,y]=jobs[i++],file=path.join(raw,`${l}-${z}-${x}-${y}.png`);try{await access(file);continue;}catch{} const u=`https://cyberjapandata.gsi.go.jp/xyz/${l}/${z}/${x}/${y}.png`;const r=await fetch(u);if(!r.ok)throw Error(`${r.status} ${u}`);await writeFile(file,new Uint8Array(await r.arrayBuffer()));console.log(`${l} ${z}/${x}/${y}`);}}));
const pdf=await fetch('https://www.city.mishima.shizuoka.jp/uploaded/attachment/4805.pdf');if(!pdf.ok)throw Error('Report retrieval failed');await writeFile(path.join(raw,'mishima-preservation-plan.pdf'),new Uint8Array(await pdf.arrayBuffer()));
console.log(`Retrieved ${jobs.length} elevation tiles and private reference PDF`);
