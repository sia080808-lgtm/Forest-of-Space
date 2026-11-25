(function(root,factory){
 const api=factory(typeof module==='object'?require('./world.js'):root.ForestWorld);
 if(typeof module==='object')module.exports=api;else root.ForestTrees=api;
})(globalThis,function(World){
'use strict';
const TYPES=Object.freeze({
 zelkova:Object.freeze({name:'느티나무',limit:2,shade:.28,rain:.30,wind:.25,rx:.23,ry:.11,width:.51,height:.19,anchor:.51}),
 willow:Object.freeze({name:'수양버들',limit:5,shade:.22,rain:.55,wind:0,rx:.19,ry:.095,width:.38,height:.25,anchor:.16}),
 cherry:Object.freeze({name:'산벚나무',limit:10,shade:.23,rain:0,wind:0,rx:.205,ry:.10,width:.45,height:.217,anchor:.445})
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
 if(type==='cherry'){
  const points=[{x:1.65,y:1.58}];
  for(const y of [1.44,1.72,1.85])for(const x of [.05,.36,.67,.98,1.29,1.60,1.91,2.22,2.53,2.84,3.12])points.push({x,y});
  return points;
 }
 if(type==='zelkova'){
  const points=[[.63,1.55],[1.65,1.58],[2.70,1.48],[.18,1.76],[1.18,1.77],[2.22,1.75],[2.96,1.76]];
  return points.map(([x,y])=>({x,y}));
 }
 const {cx,cy,ru,rv}=World.LAKE,points=[];
 for(const r of [1.21,1.31])for(const degrees of [126,48,170,14,90,212,320,267,148,32,242,296,0,180,68,108]){
  const a=degrees*Math.PI/180;points.push({x:cx+ru*r*Math.cos(a),y:cy+rv*r*Math.sin(a)});
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
function validate(s){
 const records=s.world.trees;
 if(records===undefined)return;
 if(!Array.isArray(records)||records.length>Object.keys(IDS).length)throw Error('나무 기록을 확인해 주세요.');
 const ids=new Set();
 for(const t of records){
  if(!t||!kind(t.id)||ids.has(t.id)||t.stored!==undefined&&typeof t.stored!=='boolean'||spotError(s,t))throw Error('나무 기록을 확인해 주세요.');
  ids.add(t.id);
 }
}
return Object.freeze({TYPES,ABSORPTION,kind,data,all,active,stored,number,name,region,unlocked,count,nextId,drafts,direction,canopy,inside,trunk,extent,spotError,candidates,season,leafiness,protection,effects,absorption,validate});
});
