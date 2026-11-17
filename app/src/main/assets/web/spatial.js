(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestSpace=api;})(globalThis,function(){
'use strict';
const Shelter=typeof module==='object'?require('./shelter.js'):globalThis.ForestShelter;
const Neolbi=typeof module==='object'?require('./neolbi.js'):globalThis.ForestNeolbi;
// One adult body diameter, in a fixed world coordinate system, independent of DPI.
const GU=.10*2/3, ASPECT=1.6, distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*ASPECT);
const diameter=p=>GU*(p?.species==='neolbi'?Neolbi.SIZE:1);
function obstacles(s){return [...s.individuals.filter(p=>p.active&&p.species==='neolbi'&&p.canopyProgress>0).map(Neolbi.barrier),{...s.spring,id:'spring',rx:.12*(1+((s.objects?.upgrades.spring.level||1)-1)*.15),ry:.065*(1+((s.objects?.upgrades.spring.level||1)-1)*.15)},...s.patches.filter(p=>['rock','crevice','shade'].includes(p.id)).map(p=>({...p,...STONE[p.id]?(LEGACY?{rx:.09,ry:.042}:{x:p.x+STONE[p.id].dx,y:p.y+STONE[p.id].dy,rx:STONE[p.id].rx,ry:STONE[p.id].ry}):{x:p.x-.01,y:p.y+.015,rx:.075,ry:.045}}))];}
// Stone footprints follow the drawn art, which sits above the patch anchor (terrain cell drawn at -0.75..+0.25 of its size).
// Routes try these first. If no route exists, the pre-0.6.15 footprint (centred on the anchor) is used so that saved
// layouts, shelter entrances and paths valid before stay valid; nothing becomes stuck or unloadable.
const STONE={rock:{dx:.01,dy:-.028,rx:.10,ry:.032},crevice:{dx:.003,dy:-.026,rx:.095,ry:.03}};
let LEGACY=false;
// Sun-rock resting happens on the rock's upper face; only a route that starts or ends there may climb over the rock body.
function rockTop(s){const r=s.patches.find(p=>p.id==='rock');return r?{x:r.x+.01,y:r.y-.04,rx:.075,ry:.016}:null;}
function onRock(s,p){const t=rockTop(s);return !!t&&p&&((p.x-t.x)/t.rx)**2+((p.y-t.y)/t.ry)**2<=1+1e-9;}
function inside(z,p){return Math.hypot((p.x-z.x)/z.rx,(p.y-z.y)/z.ry)<1;}
function context(s,p){const z=s.patches.find(z=>z.id==='shade'&&distance(z,p)<.145);if(z)return 'duck';if(s.patches.some(z=>['moss','litter'].includes(z.id)&&distance(z,p)<.13))return 'step';if(obstacles(s).some(z=>distance(z,p)<.18))return 'avoid';return null;}
function socket(s,id,individual){const p=id==='spring'?s.spring:s.patches.find(p=>p.id===id);if(!p)return null;if(id==='shelter'&&s.shelters)return Shelter.entry(s.shelters.facilities[0]);const q={x:p.x,y:p.y+(id==='moss'?-.025:id==='litter'?-.033:id==='shelter'?.07:id==='shade'?.09:id==='spring'?.017:['rock','crevice'].includes(id)?.085:0)};
 const active=s.individuals.filter(p=>p.active).sort((a,b)=>a.id.localeCompare(b.id));if(!individual||active.length<2)return q;const i=active.findIndex(p=>p.id===individual),offset=[0,-1,1,-2,2][Math.max(0,i)];
 const candidate={x:q.x+offset*GU*.92,y:q.y+(Math.abs(offset)>1?.035:0)};return walkable(s,candidate)?candidate:q;
}
function walkable(s,p,id,skip){
 if(Shelter.blocked(s,p,id))return false;
 if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<.08||p.x>.92||p.y<.15||p.y>.91)return false;
 const top=onRock(s,p);
 return !obstacles(s).some(z=>skip&&skip.has(z.id)||z.id==='rock'&&top?false:z.id==='spring'&&p.y>=z.y+.008&&Math.abs(p.x-z.x)<z.rx/3?false:inside(z,p));
}
function segment(s,a,b,id){
 // Climbing on/off the sun rock ignores its body. A start already inside a stone (old save, drop) may walk out of it,
 // but once outside the segment must not enter it again.
 const all=obstacles(s).filter(z=>['rock','crevice','shade'].includes(z.id)),skip=new Set(onRock(s,a)||onRock(s,b)?['rock']:[]),escape=all.filter(z=>!skip.has(z.id)&&inside(z,a));escape.forEach(z=>skip.add(z.id));
 const n=Math.ceil(distance(a,b)/.012),out=escape.map(()=>false);
 for(let i=1;i<=n;i++){const q={x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n};if(!walkable(s,q,id,skip))return false;
  for(let k=0;k<escape.length;k++){const inz=inside(escape[k],q);if(inz&&out[k])return false;if(!inz)out[k]=true;}}
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
function route(s,start,end,id,avoidFriends=false){
 const precise=routeOnce(s,start,end,id,avoidFriends);if(precise||LEGACY)return precise;
 LEGACY=true;try{return routeOnce(s,start,end,id,avoidFriends);}finally{LEGACY=false;}
}
function routeOnce(s,start,end,id,avoidFriends){
 const actor=avoidFriends&&s.individuals.find(p=>p.id===id),clear=(a,b)=>segment(s,a,b,id)&&(!actor||clearFriends(s,actor,a,b));
 if(!end||!walkable(s,end,id))return null;if(clear(start,end))return [end];
 const nodes=[{x:start.x,y:start.y},{x:end.x,y:end.y}];
 // Expanded corners around fixed footprints form a small deterministic visibility graph.
 for(const z of obstacles(s)){
  const rx=z.rx+.018,ry=z.ry+.018;
  for(const [dx,dy]of [[-rx,-ry],[rx,-ry],[-rx,ry],[rx,ry],[0,-ry],[0,ry],[-rx,0],[rx,0]]){const p={x:z.x+dx,y:z.y+dy};if(walkable(s,p,id))nodes.push(p);}
 }
 for(const f of s.shelters?.facilities||[]){const t=Shelter.transform(f);for(const [x,y]of [[15,10],[210+t.extra,10],[15,190],[210+t.extra,190]]){const q={x:(t.x+x)/360,y:(t.y+y)/576};if(walkable(s,q,id))nodes.push(q);}}
 if(actor)for(const z of s.individuals.filter(p=>p.active&&p.id!==id).sort((a,b)=>a.id.localeCompare(b.id))){const r=.4*(diameter(actor)+diameter(z))+.014;for(let k=0;k<12;k++){const angle=k*Math.PI/6,q={x:z.x+Math.cos(angle)*r,y:z.y+Math.sin(angle)*r/ASPECT};if(walkable(s,q,id))nodes.push(q);}}
 const cost=nodes.map(()=>Infinity),prev=[],done=new Set();cost[0]=0;
 while(done.size<nodes.length){let i=-1;for(let j=0;j<nodes.length;j++)if(!done.has(j)&&(i<0||cost[j]<cost[i]))i=j;if(i<0||!Number.isFinite(cost[i]))break;if(i===1){const path=[];for(let k=1;k!==0;k=prev[k])path.unshift(nodes[k]);return path;}done.add(i);
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
 if(p.wetSlow||p.energy<40||p.action==='rest')return {kind:'slow',speed:GU*.6};
 if(p.drinkCycle)return {kind:'hurry',speed:GU*1.3};return {kind:'walk',speed:GU};}
function travel(s,p,destination){if(p.species==='neolbi'&&(p.canopyProgress||0)>0){p.canopyClosing=true;p.canopy=false;return {kind:'idle',path:[{x:p.x,y:p.y}],distance:0,arrived:false};}delete p.canopyClosing;const plan=route(s,p,destination,p.id,true),g=gait(p,s),path=[{x:p.x,y:p.y}];let left=g.speed;
 if(!plan)return {kind:'idle',path,distance:0,arrived:false};
 let moved=0;for(const q of plan){const d=distance(p,q),n=Math.min(d,left);if(d){const nx=p.x+(q.x-p.x)*n/d,ny=p.y+(q.y-p.y)*n/d;if(!clearFriends(s,p,p,{x:nx,y:ny}))break;p.x=nx;p.y=ny;}moved+=n;left-=n;path.push({x:p.x,y:p.y});if(left<=1e-9)break;}
 return {kind:moved>1e-8?g.kind:'idle',path,distance:moved,duration:moved/g.speed,arrived:distance(p,destination)<.001};
}
return {diameter,obstacles,context,GU,ASPECT,distance,socket,walkable,segment,route,placement,gait,travel,rockTop,onRock};
});
