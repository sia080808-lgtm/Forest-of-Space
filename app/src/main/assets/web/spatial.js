(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestSpace=api;})(globalThis,function(){
'use strict';
const World=typeof module==='object'?require('./world.js'):globalThis.ForestWorld;
const Shelter=typeof module==='object'?require('./shelter.js'):globalThis.ForestShelter;
const Neolbi=typeof module==='object'?require('./neolbi.js'):globalThis.ForestNeolbi;
// One adult body diameter, in a fixed world coordinate system, independent of DPI.
const GU=.10*2/3, ASPECT=1.6, distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*ASPECT);
const diameter=p=>GU*(p?.species==='neolbi'?Neolbi.SIZE:p?.species==='superbum'?1.7:1);
const Obj=()=>typeof module==='object'?require('./objects.js'):globalThis.ForestObjects;
function obstacles(s){
 const O=Obj(),g=O.scale(s,'spring');
 const springs=O.springs(s).map(z=>({...z,id:O.objectId(z),type:'spring',rx:.12*g,ry:.065*g}));
 const terrain=s.patches.flatMap(p=>{
  const type=O.kindOf(p.id);
  if(!['rock','crevice','shade'].includes(type))return [];
  const t=STONE[type],shape=t?(LEGACY?{rx:.09,ry:.042}:{x:p.x+t.dx,y:p.y+t.dy,rx:t.rx,ry:t.ry}):{x:p.x-.034,y:p.y+.004,rx:.024,ry:.012};
  return [{...p,...shape,type,...(type==='rock'?{top:rockSurface(p)}:{})}];
 });
 return [...s.individuals.filter(p=>p.active&&p.species==='neolbi'&&p.canopyProgress>0).map(Neolbi.barrier),...springs,...terrain];
}
// Stone footprints follow the drawn art, which sits above the patch anchor (terrain cell drawn at -0.75..+0.25 of its size).
// Routes try these first. If no route exists, the pre-0.6.15 footprint (centred on the anchor) is used so that saved
// layouts, shelter entrances and paths valid before stay valid; nothing becomes stuck or unloadable.
const STONE={rock:{dx:.01,dy:-.028,rx:.10,ry:.032},crevice:{dx:.003,dy:-.026,rx:.095,ry:.03}};
let LEGACY=false;
const DETOUR=.3,NEAR_FRIENDS=10;
// Sun-rock resting happens on the rock's upper face; only a route that starts or ends there may climb over the rock body.
function rockTop(s,id='rock'){const r=Obj().patch(s,id);return r?rockSurface(r):null;}
const rockSurface=r=>({x:r.x+.01,y:r.y-.04,rx:.075,ry:.016});
function onRock(s,p){return !!p&&s.patches.some(r=>Obj().kindOf(r.id)==='rock'&&onRockTop(rockSurface(r),p));}
function onRockTop(t,p){return ((p.x-t.x)/t.rx)**2+((p.y-t.y)/t.ry)**2<=1+1e-9;}
function inside(z,p){return Math.hypot((p.x-z.x)/z.rx,(p.y-z.y)/z.ry)<1;}
// 0.6.29: a friend is not a point. Against the sun rock and the crevice stones the footprint grows by half the friend's
// body width (and a little in depth), so the body never sinks into the side of the stone art.
const STONES=['rock','crevice'];
function pad(s,id){const p=id&&s.individuals?.find(x=>x.id===id);return p?diameter(p)*.55:0;}
function solid(z,p,w){return w&&STONES.includes(z.type||z.id)?Math.hypot((p.x-z.x)/(z.rx+w),(p.y-z.y)/(z.ry+w*.2))<1:inside(z,p);}
function context(s,p){const z=s.patches.find(z=>Obj().kindOf(z.id)==='shade'&&distance(z,p)<.145);if(z)return 'duck';if(s.patches.some(z=>['moss','litter'].includes(Obj().kindOf(z.id))&&distance(z,p)<.13))return 'step';if(obstacles(s).some(z=>distance(z,p)<.18))return 'avoid';return null;}
function socket(s,id,individual){const p=Obj().patch(s,id),type=Obj().kindOf(id);if(!p)return null;if(id==='shelter'&&s.shelters)return Shelter.entry(s.shelters.facilities[0]);const q={x:p.x,y:p.y+(type==='moss'?-.025:type==='litter'?-.033:type==='shelter'?.07:type==='shade'?.09:type==='spring'?.017:['rock','crevice'].includes(type)?.085:0)};
 const active=s.individuals.filter(p=>p.active).sort((a,b)=>a.id.localeCompare(b.id));if(!individual||active.length<2)return q;const i=active.findIndex(p=>p.id===individual),offset=[0,-1,1,-2,2][Math.max(0,i)];
 const candidate={x:q.x+offset*GU*.92,y:q.y+(Math.abs(offset)>1?.035:0)};return walkable(s,candidate)?candidate:q;
}
function walkable(s,p,id,skip,obs,w=pad(s,id),walls=true){
 if(walls&&Shelter.blocked(s,p,id))return false;
 if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||!World.inside(s,p)||World.inWater?.(s,p)&&!World.frozen?.(s))return false;   /* 0.9.3: the frozen lake can be walked on */   // 0.9.0: no walking on the lake
 return !(obs||obstacles(s)).some(z=>skip&&skip.has(z.id)||z.top&&onRockTop(z.top,p)?false:z.type==='spring'&&p.y>=z.y+.008&&Math.abs(p.x-z.x)<z.rx/3?false:solid(z,p,w));
}
function segment(s,a,b,id,obs=obstacles(s)){
 // Climbing on/off the sun rock ignores its body. A start already inside a stone (old save, drop) may walk out of it,
 // but once outside the segment must not enter it again.
 // Obstacles are built once per segment (not per sample point): 0.6.15 rebuilt them for every sample.
 const w=pad(s,id),all=obs   /* 0.8.3: a friend standing inside any footprint (the spring's stones, Elephan's spread leaf, a stone) may walk out of it; before only stones and the shade stem allowed this and a friend left inside the spring basin could not find any route */,skip=new Set(all.filter(z=>z.top&&(onRockTop(z.top,a)||onRockTop(z.top,b))).map(z=>z.id)),escape=all.filter(z=>!skip.has(z.id)&&solid(z,a,w));escape.forEach(z=>skip.add(z.id));
 // 0.8.3: the same for a start inside the shelter's walls (a friend dropped or left there): walk out, never back in.
 const n=Math.ceil(distance(a,b)/.012),out=escape.map(()=>false);let walls=Shelter.blocked(s,a,id);
 for(let i=1;i<=n;i++){const q={x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n};if(walls&&!Shelter.blocked(s,q,id))walls=false;if(!walkable(s,q,id,skip,obs,w,!walls))return false;
  for(let k=0;k<escape.length;k++){const inz=solid(escape[k],q,w);if(inz&&out[k])return false;if(!inz)out[k]=true;}}
 return true;}
function clearFriends(s,p,a,b){
 const dx=b.x-a.x,dy=(b.y-a.y)*ASPECT,len=dx*dx+dy*dy;
 return !s.individuals.some(z=>{if(!z.active||z.id===p.id)return false;const r=.4*(diameter(p)+diameter(z)),start=distance(z,a);
  // Old saves or held drops may begin too close. Allow only a continuous escape,
  // never a step through the other character to the far side.
  if(start<r-1e-8)return (a.x-z.x)*dx+(a.y-z.y)*ASPECT*dy<-1e-10||distance(z,b)<start-1e-8;
  const t=len?Math.max(0,Math.min(1,((z.x-a.x)*dx+(z.y-a.y)*ASPECT*dy)/len)):0;
  return distance(z,{x:a.x+t*dx,y:a.y+t*dy/ASPECT})<r-1e-8;
 });
}
// 1.1.4: "can it get there" checks (choosing what to do, the shelter queue) ask the same question again and again
// while a friend stands still. A route that ignores friends depends only on the layout, the friend's size and its
// shelter, and the two points, so the same question gets the same answer from a small cache (no change in behaviour).
const routeMemo=new WeakMap();
function layoutKey(s){const o=obstacles(s);let k=o.map(z=>z.id+':'+z.x+','+z.y+','+z.rx+','+z.ry).join(';')+'|'+(s.world?.regions||[]).join(',')+'|'+(World.frozen?.(s)?1:0);for(const f of s.shelters?.facilities||[])k+='|'+f.id+','+f.level+','+f.x+','+f.y+','+!!f.flip;return k;}
function route(s,start,end,id,avoidFriends=false){
 let memo=null,key=null;if(!avoidFriends&&start&&end&&s&&typeof s==='object'){const p=id&&s.individuals?.find(x=>x.id===id);key=(LEGACY?'L':'P')+'|'+(p?diameter(p)+'|'+(p.shelter?.facilityId||''):'-')+'|'+start.x+','+start.y+'|'+end.x+','+end.y;
  const lk=layoutKey(s);memo=routeMemo.get(s);if(!memo||memo.lk!==lk){memo={lk,map:new Map()};routeMemo.set(s,memo);}if(memo.map.has(key)){const r=memo.map.get(key);return r&&r.map(q=>({...q}));}}
 let out=routeOnce(s,start,end,id,avoidFriends);if(!out&&!LEGACY){LEGACY=true;try{out=routeOnce(s,start,end,id,avoidFriends);}finally{LEGACY=false;}}
 if(memo){if(memo.map.size>4000)memo.map.clear();memo.map.set(key,out&&out.map(q=>({x:q.x,y:q.y})));}return out;
}
function routeOnce(s,start,end,id,avoidFriends){
 const obs=obstacles(s),actor=avoidFriends&&s.individuals.find(p=>p.id===id),clear=(a,b)=>segment(s,a,b,id,obs)&&(!actor||clearFriends(s,actor,a,b));
 if(!end||!walkable(s,end,id,null,obs))return null;if(clear(start,end))return [end];
 const nodes=[{x:start.x,y:start.y},{x:end.x,y:end.y}];
 // Give the visibility graph corners around open water for trips to and from the far bank.
 const lake=World.LAKE;
 if(Math.max(start.x,end.x)>lake.cx&&World.lakeOpen(s)&&!World.frozen(s)){
  for(let k=0;k<16;k++){
   const angle=k*Math.PI/8;
   const q={x:lake.cx+Math.cos(angle)*lake.ru*1.19,y:lake.cy+Math.sin(angle)*lake.rv*1.19};
   if(walkable(s,q,id,null,obs))nodes.push(q);
  }
 }
 // Expanded corners around fixed footprints form a small deterministic visibility graph.
 for(const z of obs){
  const rx=z.rx+.018,ry=z.ry+.018;
  for(const [dx,dy]of [[-rx,-ry],[rx,-ry],[-rx,ry],[rx,ry],[0,-ry],[0,ry],[-rx,0],[rx,0]]){const p={x:z.x+dx,y:z.y+dy};if(walkable(s,p,id,null,obs))nodes.push(p);}
 }
 for(const f of s.shelters?.facilities||[]){const t=Shelter.transform(f);for(const [x,y]of [[15,10],[210+t.extra,10],[15,190],[210+t.extra,190]]){const q={x:(t.x+x)/360,y:(t.y+y)/576};if(walkable(s,q,id,null,obs))nodes.push(q);}}
 // 0.7.0 (many friends): only friends near the way between start and end get detour points. A friend outside this
 // ellipse cannot block the straight way or any short detour; with dozens of friends this keeps the graph small.
 const near=z=>distance(z,start)+distance(z,end)<=distance(start,end)+DETOUR;
 // and at most the NEAR_FRIENDS closest to the way (a crowd around a busy spot otherwise means hundreds of detour points)
 const toLine=z=>{const dx=end.x-start.x,dy=(end.y-start.y)*ASPECT,len=dx*dx+dy*dy,u=len?Math.max(0,Math.min(1,((z.x-start.x)*dx+(z.y-start.y)*ASPECT*dy)/len)):0;return distance(z,{x:start.x+u*dx,y:start.y+u*dy/ASPECT});};
 const crowd=actor?s.individuals.filter(p=>p.active&&p.id!==id&&near(p)).map(z=>[toLine(z),z]).sort((a,b)=>a[0]-b[0]||a[1].id.localeCompare(b[1].id)).slice(0,NEAR_FRIENDS).map(x=>x[1]).sort((a,b)=>a.id.localeCompare(b.id)):[];
 if(actor)for(const z of crowd){const r=.4*(diameter(actor)+diameter(z))+.014;for(let k=0;k<12;k++){const angle=k*Math.PI/6,q={x:z.x+Math.cos(angle)*r,y:z.y+Math.sin(angle)*r/ASPECT};if(walkable(s,q,id,null,obs))nodes.push(q);}}
 // 0.7.0 (many friends): A* instead of plain Dijkstra. The heuristic is the straight distance to the end (never more than
 // the true remaining cost), so the shortest path is the same; far fewer nodes are opened, so far fewer segment checks.
 const cost=nodes.map(()=>Infinity),prev=[],done=new Set(),h=nodes.map(q=>distance(q,end));cost[0]=0;
 while(done.size<nodes.length){let i=-1;for(let j=0;j<nodes.length;j++)if(!done.has(j)&&Number.isFinite(cost[j])&&(i<0||cost[j]+h[j]<cost[i]+h[i]))i=j;if(i<0||!Number.isFinite(cost[i]))break;if(i===1){const path=[];for(let k=1;k!==0;k=prev[k])path.unshift(nodes[k]);return path;}done.add(i);
  for(let j=1;j<nodes.length;j++)if(!done.has(j)&&clear(nodes[i],nodes[j])){const c=cost[i]+distance(nodes[i],nodes[j]);if(c<cost[j]){cost[j]=c;prev[j]=i;}}
 }return null;
}
function placement(s,id,p,correct=true){
 const pet=s.individuals.find(x=>x.id===id);if(!pet||!pet.active||pet.mounted)return {ok:false,message:'지금은 옮길 수 없어요.'};
 if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return {ok:false,message:'정원 안의 자리를 골라주세요.'};
 const usable=q=>{const f=Shelter.cover(s,q);let world=s;if(f){if(!Shelter.fits(f,pet,q)||Shelter.ledger(s,f,id).free<Shelter.units(pet))return false;if(s.individuals.some(z=>z.id!==id&&z.active&&(Shelter.overlap(pet,q,z)||z.shelter?.facilityId===f.id&&Shelter.overlap(pet,q,z,z.shelter))))return false;world={...s,individuals:s.individuals.map(z=>z.id===id?{...z,shelter:{...z.shelter,facilityId:f.id,phase:'entering'}}:z)};}return walkable(world,q,id)&&!s.individuals.some(x=>x.active&&x.id!==id&&distance(x,q)<(diameter(pet)+diameter(x))/2)&&route(world,q,socket(world,'spring'),id)&&route(world,q,socket(world,'shelter'),id);};
 if(usable(p))return {ok:true,x:p.x,y:p.y,corrected:false};
 if(correct){for(let r=GU/4;r<=GU+1e-9;r+=GU/4)for(let k=0;k<16;k++){const a=k*Math.PI/8,q={x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r/ASPECT};if(usable(q))return {ok:true,...q,corrected:true};}}
 return {ok:false,message:'물가와 바위, 친구가 있는 자리는 피해주세요.'};
}
function gait(p,s){if(s.weather.wind>=60)return {kind:p.energy<40?'walk':'run',speed:GU*(p.energy<40?1:1.6)};
 if(p.Q>=16)p.wetSlow=true;else if(p.Q<12)p.wetSlow=false;
 // 1.1.5 기운: below 15% the friend trudges slower still (0.45), at 80% and over its plain walk is a little brisker (1.15)
 if(p.wetSlow||p.energy<40||p.action==='rest')return {kind:'slow',speed:GU*(p.energy<15?.45:.6)};
 if(p.drinkCycle)return {kind:'hurry',speed:GU*1.3};return {kind:'walk',speed:GU*(p.energy>=80?1.15:1)};}
// 1.1.4 (user: "렉이 조금씩 걸리는데" → "1,2번 ㄱㄱ"): a walking friend used to search its whole way again every second
// (route was ~75% of the engine and one tick could take 0.3 s). The way is now kept on the friend (saved, so a reloaded
// game walks the same) and reused while the destination is the same and the next stretch is still clear; it is searched
// again when that stretch is blocked, the destination changes, the way runs out, or every REPLAN seconds (so a shorter
// way that opened up is still found). A straight clear line to the destination always wins over the kept way.
const REPLAN=8,NOWAY=3;   // a failed search (the slowest kind) is not repeated for NOWAY seconds
function keptPlan(s,p,destination){const wp=p.walkPlan;if(!wp||!wp.pts||s.worldTick-wp.at>=REPLAN)return null;
 /* 1.2.19 (user: "우산문제도 pr"): a target that drifts a little every second (the spot next to a friend standing under 엘레판's leaf
    umbrella by the shelter door) missed this cache each time, so the slowest kind of search — one that finds no way — ran every
    second (~60 ms a tick for one friend). A failed search now also covers targets within 0.03 of the one that failed. */
 if(!wp.pts.length)return s.worldTick-wp.at<NOWAY&&Math.abs(wp.fx-p.x)<1e-9&&Math.abs(wp.fy-p.y)<1e-9&&Math.hypot(wp.tx-destination.x,wp.ty-destination.y)<.03?false:null;
 if(Math.abs(wp.tx-destination.x)>1e-9||Math.abs(wp.ty-destination.y)>1e-9)return null;
 while(wp.pts.length>1&&distance(p,wp.pts[0])<1e-6)wp.pts.shift();
 const was=LEGACY;LEGACY=!!wp.legacy;try{const obs=obstacles(s),ok=q=>segment(s,p,q,p.id,obs)&&clearFriends(s,p,p,q);
  if(wp.pts.length>1&&ok(destination))return [destination];return ok(wp.pts[0])?wp.pts:null;}finally{LEGACY=was;}}
function planFor(s,p,destination){const kept=keptPlan(s,p,destination);if(kept)return kept;if(kept===false)return null;
 let legacy=false,plan=routeOnce(s,p,destination,p.id,true);if(!plan&&!LEGACY){LEGACY=true;try{plan=routeOnce(s,p,destination,p.id,true);legacy=!!plan;}finally{LEGACY=false;}}
 p.walkPlan=plan?{tx:destination.x,ty:destination.y,at:s.worldTick,legacy,pts:plan.map(q=>({x:q.x,y:q.y}))}:{tx:destination.x,ty:destination.y,at:s.worldTick,legacy:false,pts:[],fx:p.x,fy:p.y};return plan;}
function travel(s,p,destination){if(p.species==='neolbi'&&(p.canopyProgress||0)>0){p.canopyClosing=true;p.canopy=false;return {kind:'idle',path:[{x:p.x,y:p.y}],distance:0,arrived:false};}delete p.canopyClosing;const plan=planFor(s,p,destination),g=gait(p,s),path=[{x:p.x,y:p.y}];let left=g.speed;
 if(!plan)return {kind:'idle',path,distance:0,arrived:false};
 /* 1.2.9 (user: "길을 막고 있으면 그 자리에서 두세 번 서성이다가 지나가더라"): a corner of the kept way that the friend had already
 walked through was kept as its next point, so the next second it turned back to it and paced to and fro until the way was
 searched again (up to 8 s). A corner it reaches is now dropped from the kept way */const wp=p.walkPlan?.pts;let moved=0;for(const q of plan){const d=distance(p,q),n=Math.min(d,left);if(d){const nx=p.x+(q.x-p.x)*n/d,ny=p.y+(q.y-p.y)*n/d;if(!clearFriends(s,p,p,{x:nx,y:ny}))break;p.x=nx;p.y=ny;}moved+=n;left-=n;path.push({x:p.x,y:p.y});if(n>=d-1e-12&&wp&&wp.length>1&&Math.abs(wp[0].x-q.x)<1e-9&&Math.abs(wp[0].y-q.y)<1e-9)wp.shift();if(left<=1e-9)break;}
 return {kind:moved>1e-8?g.kind:'idle',path,distance:moved,duration:moved/g.speed,arrived:distance(p,destination)<.001};
}
return {diameter,obstacles,context,GU,ASPECT,distance,socket,walkable,segment,route,placement,gait,travel,rockTop,onRock};
});
