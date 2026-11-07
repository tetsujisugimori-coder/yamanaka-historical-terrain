import {Group,Mesh,BoxGeometry,MeshStandardMaterial,Vector3,Raycaster,Box3,Matrix3} from 'three';
export function validatePart(m,d){
 if(m.schemaVersion!==1||!/^([a-f0-9]{40})$/.test(m.commit)||!/^([a-f0-9]{64})$/.test(m.sha256)||m.id!==d.id||m.version!==d.version||m.units!=='metres'||m.axes!=='east,up,south'||m.category!=='C'||m.status!=='procedural-prototype-not-CAD'||m.glb!==null||m.glbSha256!==null)throw Error('部品ID・版・単位・軸・状態が不正');
 const p=d.dimensions_m;if(!p||!Number.isInteger(p.count)||p.count<2||p.count>20||p.rails!==2||![p.height,p.spacing,p.post_width].every(x=>Number.isFinite(x)&&x>0&&x<=10)||p.post_width>=p.spacing)throw Error('部品寸法が不正');
 return p;
}
export function supportPlan(d,placement,exaggeration,sample){
 const {east,north,yawDegrees,scale,embedDepth}=placement;
 if(![east,north,yawDegrees,scale,embedDepth,exaggeration].every(Number.isFinite)||Math.abs(east)>1000||Math.abs(north)>1000||Math.abs(yawDegrees)>360||scale<.5||scale>1.5||embedDepth!==0||![1,2].includes(exaggeration))throw Error('配置・倍率・根入れ設定が不正');
 const p=d.dimensions_m,a=yawDegrees*Math.PI/180,posts=[];
 for(let i=0;i<p.count;i++){const t=(i-(p.count-1)/2)*p.spacing*scale,x=east+Math.cos(a)*t,z=-north-Math.sin(a)*t,hit=sample(x,z);if(!hit||!Number.isFinite(hit.height)||!Number.isFinite(hit.slope)||hit.slope>15)throw Error('柱の支持面なし／試験配置には急傾斜');posts.push({index:i,x,z,ground:hit.height,base:hit.height,height:p.height*scale,face:hit.face});}
 if(Math.max(...posts.map(p=>p.ground))-Math.min(...posts.map(p=>p.ground))>.4*exaggeration)throw Error('柱間の地形段差が大きいため配置拒否');
 return posts;
}
export function triangleSampler(meshes){
 const box=new Box3();for(const m of meshes){m.updateWorldMatrix(true,false);box.expandByObject(m);}const ray=new Raycaster();
 return(x,z)=>{if(box.isEmpty())return null;ray.set(new Vector3(x,box.max.y+1,z),new Vector3(0,-1,0));const hit=ray.intersectObjects(meshes,false)[0];if(!hit)return null;const n=hit.face.normal.clone().applyNormalMatrix(new Matrix3().getNormalMatrix(hit.object.matrixWorld));return {height:hit.point.y,slope:Math.acos(Math.min(1,Math.abs(n.y)))*180/Math.PI,face:hit.faceIndex};};
}
export function buildPalisade(d,posts,placement){
 const group=new Group(),p=d.dimensions_m,s=placement.scale,mat=new MeshStandardMaterial({color:0x94704a,roughness:1});
 const add=(geo,position,name)=>{const mesh=new Mesh(geo,mat);mesh.position.copy(position);mesh.name=name;mesh.userData={evidenceCategory:'C',elementId:'library-palisade',partId:d.id};group.add(mesh);return mesh;};
 for(const post of posts){const m=add(new BoxGeometry(p.post_width*s,post.height,p.post_width*s),new Vector3(post.x,post.base+post.height/2,post.z),'library-post-'+post.index);m.rotation.y=placement.yawDegrees*Math.PI/180;}
 for(let i=1;i<posts.length;i++)for(const fraction of [.35,.7]){const a=posts[i-1],b=posts[i],start=new Vector3(a.x,a.base+a.height*fraction,a.z),end=new Vector3(b.x,b.base+b.height*fraction,b.z),delta=end.clone().sub(start);const mesh=add(new BoxGeometry(delta.length(),.1*s,.1*s),start.add(end).multiplyScalar(.5),'library-rail-'+i+'-'+fraction);mesh.quaternion.setFromUnitVectors(new Vector3(1,0,0),delta.normalize());}
 return group;
}
export function disposePart(group){group.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});group.clear();}
export function createPartsPanel(){const p=document.createElement('section');p.className='inner-observation';p.id='library-parts';p.innerHTML='<h3>城郭部品ライブラリ：試験配置 C</h3><p>木柵v0はThree.js生成の暫定部品。CAD由来GLBではありません。配置・寸法は史実未確認です。</p><label><input id="parts-visible" type="checkbox"> 木柵の試験配置を表示</label><label>向き <select id="parts-yaw"><option value="0">東西 0°</option><option value="45">45°</option><option value="90">南北 90°</option></select></label><label>試験寸法倍率 <select id="parts-size"><option value="0.5">0.5倍</option><option value="1" selected>1倍</option><option value="1.5">1.5倍</option></select></label><button id="parts-select">木柵を選択・接地を読む</button><p id="parts-status" role="status">固定部品の読込待ち</p><pre id="parts-detail" hidden></pre>';document.querySelector('#landscape-toolbar').append(p);return p;}
export async function loadPart(base,fetcher=fetch){const r=await fetcher(base+'parts/manifest.json');if(!r.ok)throw Error('部品manifest未取得');const manifest=await r.json();if(manifest.definition!=='parts/wooden-palisade-v0.json')throw Error('部品定義パス不正');const b=await fetcher(base+manifest.definition);if(!b.ok)throw Error('部品定義未取得');const bytes=await b.arrayBuffer(),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==manifest.sha256)throw Error('部品SHA256不一致');const definition=JSON.parse(new TextDecoder().decode(bytes));validatePart(manifest,definition);return {manifest,definition};}
