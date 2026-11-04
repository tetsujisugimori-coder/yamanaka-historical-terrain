// Local east/north metres. Same horizontal line for both immutable GLBs.
export const SECTIONS=[
 {id:'moat',name:'障子堀を西から東へ',start:[-66,-10],end:[-38,-10],direction:'西 → 東',reason:'保存済みN=-10m標本と同じ線で、複数の堀底・畝と両外縁を横断する。',points:[['西縁',4],['堀底',10.5],['東縁',25]],measurements:[['西縁 − 堀底',0,1],['東縁 − 堀底',2,1]]},
 {id:'rampart',name:'曲輪から西の土塁へ',start:[-15,15],end:[-45,15],direction:'東 → 西',reason:'保存済みN=15m標本の範囲内。曲輪平場から西側土塁の天端・外側を横断する。',points:[['曲輪面',5],['土塁頂部',21],['外側',30]],measurements:[['土塁頂部 − 曲輪面',1,0]]}
];
const EPS=1e-8;
export const sectionLength=s=>Math.hypot(s.end[0]-s.start[0],s.end[1]-s.start[1]);
export function sectionCoordinate(s,d){const l=sectionLength(s);return s.start.map((v,i)=>v+(s.end[i]-v)*d/l);}

/** Exact piecewise-linear intersection of a vertical section plane and GLB faces.
 * Input positions are baked model metres (east/up/south), never scaled by 3D VE.
 * Vertical/degenerate faces do not define a height field. At overlaps select the
 * highest ground face; all callers supply only ground meshes. No extrapolation.
 */
export function intersectSection(meshes,s){
 const length=sectionLength(s),dx=(s.end[0]-s.start[0])/length,dn=(s.end[1]-s.start[1])/length,intervals=[];
 for(const mesh of meshes){const pos=mesh.geometry.attributes.position,idx=mesh.geometry.index,count=idx?idx.count:pos.count;
  for(let i=0;i<count;i+=3){const v=[0,1,2].map(k=>{const j=idx?idx.getX(i+k):i+k,e=pos.getX(j)-s.start[0],n=-pos.getZ(j)-s.start[1];return{d:e*dx+n*dn,q:e*dn-n*dx,h:pos.getY(j)};});
   if(v.every(p=>p.q>EPS)||v.every(p=>p.q<-EPS)||v.every(p=>p.d<-EPS)||v.every(p=>p.d>length+EPS))continue;
   if(Math.abs((v[1].d-v[0].d)*(v[2].q-v[0].q)-(v[2].d-v[0].d)*(v[1].q-v[0].q))<EPS)continue;
   const hits=[];for(let k=0;k<3;k++){const a=v[k],b=v[(k+1)%3];if(Math.abs(a.q)<=EPS)hits.push({d:a.d,h:a.h});if(a.q*b.q<0){const t=a.q/(a.q-b.q);hits.push({d:a.d+t*(b.d-a.d),h:a.h+t*(b.h-a.h)});}}
   hits.sort((a,b)=>a.d-b.d);if(hits.length<2)continue;const a=hits[0],b=hits.at(-1),lo=Math.max(0,a.d),hi=Math.min(length,b.d);if(hi-lo<EPS)continue;
   const at=d=>a.h+(b.h-a.h)*(d-a.d)/(b.d-a.d);intervals.push({from:lo,to:hi,h0:at(lo),h1:at(hi),surface:mesh.userData?.facilityId??mesh.name});
  }
 }
 // Break at face edges and overlap crossings. Lines remain exactly on faces.
 const breaks=intervals.flatMap(p=>[p.from,p.to]);
 for(let i=0;i<intervals.length;i++)for(let j=i+1;j<intervals.length;j++){const a=intervals[i],b=intervals[j],lo=Math.max(a.from,b.from),hi=Math.min(a.to,b.to);if(hi-lo<EPS)continue;const u=height(a,lo)-height(b,lo),v=height(a,hi)-height(b,hi);if(u*v<0)breaks.push(lo+(hi-lo)*u/(u-v));}
 breaks.sort((a,b)=>a-b);const unique=breaks.filter((x,i)=>i===0||x-breaks[i-1]>EPS),segments=[];
 for(let i=1;i<unique.length;i++){const from=unique[i-1],to=unique[i],mid=(from+to)/2;let winner;
  for(const p of intervals)if(mid>=p.from-EPS&&mid<=p.to+EPS&&(!winner||height(p,mid)>height(winner,mid)))winner=p;
  if(winner)segments.push({from,to,h0:height(winner,from),h1:height(winner,to),surface:winner.surface});
 }
 return{length,segments};
}
export function height(p,d){return p.h0+(p.h1-p.h0)*(d-p.from)/(p.to-p.from);}
export function profileHeight(profile,d){const hits=profile.segments.filter(p=>d>=p.from-EPS&&d<=p.to+EPS);return hits.length?Math.max(...hits.map(p=>height(p,d))):null;}
