(function(root,factory){
 const api=factory(typeof module==='object'?require('./world.js'):root.ForestWorld);
 if(typeof module==='object')module.exports=api;else root.ForestTrees=api;
})(globalThis,function(World){
'use strict';
const TYPES=Object.freeze({
 zelkova:Object.freeze({name:'느티나무',limit:5,shade:.28,rain:.30,wind:.25,rx:.23,ry:.11,width:1.02,height:.38,anchor:.51}),
 willow:Object.freeze({name:'수양버들',limit:20,shade:.22,rain:.55,wind:0,rx:.19,ry:.095,width:.38,height:.25,anchor:.16}),
 cherry:Object.freeze({name:'산벚나무',limit:20,shade:.23,rain:0,wind:0,rx:.205,ry:.10,width:.45,height:.217,anchor:.445})
});
const ABSORPTION=1.25;
const IDS=Object.freeze(Object.fromEntries(Object.entries(TYPES).flatMap(([type,d])=>Array.from({length:d.limit},(_,i)=>[type+'-'+(i+1),type]))));
const LEAVES={spring:.8,summer:1,autumn:.65,winter:.12};
const NO_COVER=Object.freeze({shade:0,rain:0,wind:0,willow:false});
const kind=id=>Object.hasOwn(IDS,id)?IDS[id]:undefined;
const data=t=>TYPES[kind(t.id)];
const all=s=>s.world?.trees||[];
const active=s=>all(s).filter(t=>!t.stored);
const stored=s=>all(s).filter(t=>t.stored);
const number=id=>Number(id.slice(id.lastIndexOf('-')+1));
const name=id=>TYPES[kind(id)].name+' '+number(id);
const region=type=>type==='willow'?'lakeshore':'south';
const unlocked=(s,type)=>Object.hasOwn(TYPES,type)&&(region(type)==='south'?World.southOpen(s):World.lakeOpen(s));
const count=(s,type,positions={})=>new Set([...all(s).map(t=>t.id),...Object.keys(positions)].filter(id=>kind(id)===type)).size;
const nextId=(s,type,positions={})=>Object.keys(IDS).find(id=>kind(id)===type&&!Object.hasOwn(positions,id)&&!all(s).some(t=>t.id===id));
function drafts(s,positions={}){
 const records=all(s).map(t=>!t.stored&&Object.hasOwn(positions,t.id)?{id:t.id,x:positions[t.id].x,y:positions[t.id].y}:t);
 for(const [id,p] of Object.entries(positions))if(kind(id)&&!records.some(t=>t.id===id))records.push({id,x:p.x,y:p.y});
 return records;
}
const direction=t=>kind(t.id)==='willow'&&t.x>World.LAKE.cx?-1:1;
function canopy(t){
 const d=data(t);
 return {x:t.x+(kind(t.id)==='willow'?direction(t)*.047:0),y:t.y+.043,rx:d.rx,ry:d.ry};
}
const inside=(ellipse,p)=>Math.hypot((p.x-ellipse.x)/ellipse.rx,(p.y-ellipse.y)/ellipse.ry)<1;
const trunk=t=>({id:t.id,type:'tree',x:t.x,y:t.y,rx:kind(t.id)==='zelkova'?.05:.035,ry:.022});
const extent=t=>{const k=trunk(t);return {x0:k.x-k.rx,x1:k.x+k.rx,y0:k.y-k.ry,y1:k.y+k.ry};};
function spotError(s,t){
 const type=kind(t.id),r=World.walk(s);
 if(!unlocked(s,type))return (region(type)==='south'?'남쪽 숲이':'호수가')+' 열리면 '+TYPES[type].name+'를 심을 수 있어요.';
 if(!Number.isFinite(t.x)||!Number.isFinite(t.y)||t.x<r.x0+.10||t.x>r.x1-.10||t.y<r.y0+.055||t.y>r.y1-.08)return '나무를 숲 가장자리 안쪽에 심어주세요.';
 if(region(type)==='south')return t.y<World.REGIONS.south.y0+.025?TYPES[type].name+'는 남쪽 숲에 심어주세요.':null;
 const d=World.waterD(t.x,t.y);
 return d<World.LAKE.edge+.07||d>World.LAKE.edge+.32?'수양버들은 호숫가의 땅에 심어주세요.':null;
}
function candidates(s,type){
 if(!unlocked(s,type))return [];
 if(region(type)==='south'){
  const preferred=type==='zelkova'
   ?[[.63,1.55],[1.65,1.58],[2.70,1.48],[.18,1.76],[1.18,1.77],[2.22,1.75],[2.96,1.76]]
   :[[1.65,1.58]];
  const points=preferred.map(([x,y])=>({x,y}));
  for(const y of [1.44,1.72,1.56,1.34,1.78])for(const x of [.05,.36,.67,.98,1.29,1.60,1.91,2.22,2.53,2.84,3.12])points.push({x,y});
  return points;
 }
 const {cx,cy,ru,rv}=World.LAKE,points=[];
 for(const r of [1.21,1.31])for(const degrees of [126,48,170,14,90,212,320,267,148,32,242,296,0,180,68,108]){
  const a=degrees*Math.PI/180;points.push({x:cx+ru*r*Math.cos(a),y:cy+rv*r*Math.sin(a)});
 }
 // Fill gaps along the bank once the original, widely spaced sites are used.
 for(const r of [1.16,1.27,1.34])for(let i=0;i<24;i++){
  const a=(i+.5)*Math.PI/12;points.push({x:cx+ru*r*Math.cos(a),y:cy+rv*r*Math.sin(a)});
 }
 return points;
}
function season(s){const Env=typeof module==='object'?require('./environment.js'):globalThis.ForestEnvironment;return Env?.calendar(s).id||'spring';}
const leafiness=id=>LEAVES[id]??1;
function seasonalCover(s,cover){
 const leaves=leafiness(season(s));
 return {shade:cover.shade*leaves,rain:cover.rain*leaves,wind:cover.wind*(.55+.45*leaves)};
}
const protection=(s,t)=>seasonalCover(s,data(t));
function effects(s,p){
 if(!all(s).length||p.mounted||World.inWater(s,p))return NO_COVER;
 let cover=null;
 for(const t of all(s)){
  if(t.stored||!inside(canopy(t),p))continue;
  cover??={shade:0,rain:0,wind:0,willow:false};
  const d=data(t);
  cover.shade=Math.max(cover.shade,d.shade);
  cover.rain=Math.max(cover.rain,d.rain);
  cover.wind=Math.max(cover.wind,d.wind);
  cover.willow||=kind(t.id)==='willow'&&!World.frozen(s);
 }
 if(!cover)return NO_COVER;
 return Object.assign(cover,seasonalCover(s,cover));
}
const absorption=(s,p,onMoss)=>onMoss||effects(s,p).willow?ABSORPTION:1;
// The friend's physical position stays at the accessible foot of the tree during a visit.
const PERCH_RETURN=240;
function perchEntry(t){
 if(kind(t.id)!=='willow')return {x:t.x,y:t.y+.065};
 const {cx,cy,ru,rv}=World.LAKE;
 const dx=(t.x-cx)/ru**2,dy=(t.y-cy)/rv**2,length=Math.hypot(dx,dy);
 // Approach the trunk from the landward side, including when there is ice.
 return length?{x:t.x+.099*dx/length,y:t.y+.048*dy/length}:{x:t.x,y:t.y+.065};
}
const perchOwner=(s,id)=>s.individuals.find(p=>p.perchTree===id);
const largePerch=p=>p.species==='neolbi'||p.species==='superbum';
function fitsPerch(id,p){
 switch(kind(id)){
  case 'cherry':return !largePerch(p);
  case 'zelkova':return true;
  case 'willow':{
   const traits=typeof module==='object'?require('./traits.js'):globalThis.ForestTraits;
   return traits.HEX[p.species]?.water===5;
  }
  default:return false;
 }
}
const canAssign=(p,id)=>p.active&&!p.mounted&&p.visualStage===3&&!p.perchTree&&fitsPerch(id,p);
const CHERRY_SEATS={ridley:.012,bonbon:-.011,bosong:.024,duri:.007,jureong:.033};
function perchSeat(t,p){
 const type=kind(t.id);
 if(type==='zelkova'){
  if(p.species==='superbum')return {x:t.x-.096,y:t.y-.046};
  if(p.species==='neolbi')return {x:t.x+.062,y:t.y-.072};
  return {x:t.x-.086,y:t.y-.114};
 }
 if(type==='willow'){
  const large=largePerch(p);
  return {x:t.x+direction(t)*(large?.015:.043),y:t.y-(large?.019:.079)};
 }
 return {x:t.x+(CHERRY_SEATS[p.species]??.012),y:t.y-(p.species==='jureong'?.068:.075)};
}
function leavePerch(s,p){
 if(!p.stroll?.perch)return;
 delete p.stroll;delete p.walkPlan;
 p.perchAfter=s.worldTick+PERCH_RETURN;p.nextObjectChoice=s.worldTick;
}
function assignPerch(s,id,friend){
 const t=active(s).find(t=>t.id===id);
 if(!t)throw Error('숲에 심은 나무를 골라주세요.');
 const owner=perchOwner(s,id);
 if(friend==null){
  if(owner){leavePerch(s,owner);delete owner.perchTree;}
  return;
 }
 const p=s.individuals.find(p=>p.id===friend);
 if(owner||!p||!canAssign(p,id))throw Error('이 나무에 맞는 성체 친구 중 착생 자리가 없는 친구를 골라주세요.');
 p.perchTree=id;
}
function migratePerches(s){
 // The first version let large adults claim cherry trees. Detach them on load
 // without moving the friend or discarding the spores they have already grown.
 for(const p of s.individuals)if(kind(p.perchTree)==='cherry'&&!fitsPerch(p.perchTree,p)){
  leavePerch(s,p);delete p.perchTree;
 }
}
function validatePerches(s){
 const used=new Set();
 for(const p of s.individuals){
  if(p.perchAfter!==undefined&&(!Number.isSafeInteger(p.perchAfter)||p.perchAfter<0))throw Error('착생 휴식 시간을 확인해 주세요.');
  if(p.perchTree===undefined&&!p.stroll?.perch)continue;
  const t=all(s).find(t=>t.id===p.perchTree&&!t.stored&&fitsPerch(t.id,p));
  if(!t||used.has(t.id))throw Error('착생 나무 기록을 확인해 주세요.');
  used.add(t.id);
  if(p.stroll?.perch){
   const q=perchEntry(t),v=p.stroll;
   if(v.perch!==t.id||v.x!==q.x||v.y!==q.y||!p.active||p.mounted||p.objectTask||v.arrivedAt!=null&&Math.hypot(p.x-q.x,p.y-q.y)>.004)throw Error('착생 자리 기록을 확인해 주세요.');
  }
 }
}
function validate(s){
 validatePerches(s);
 const records=s.world.trees;
 if(records===undefined)return;
 if(!Array.isArray(records)||records.length>Object.keys(IDS).length)throw Error('나무 기록을 확인해 주세요.');
 const ids=new Set();
 for(const t of records){
  if(!t||!kind(t.id)||ids.has(t.id)||t.stored!==undefined&&typeof t.stored!=='boolean'||spotError(s,t))throw Error('나무 기록을 확인해 주세요.');
  ids.add(t.id);
 }
}
return Object.freeze({PERCH_RETURN,perchEntry,perchSeat,perchOwner,canAssign,fitsPerch,leavePerch,assignPerch,migratePerches,TYPES,ABSORPTION,kind,data,all,active,stored,number,name,region,unlocked,count,nextId,drafts,direction,canopy,inside,trunk,extent,spotError,candidates,season,leafiness,protection,effects,absorption,validate});
});
