(function(root,factory){
 const api=factory();
 if(typeof module==='object')module.exports=api;else root.ForestLilyBoat=api;
})(globalThis,function(){
'use strict';
function dep(file,name){return typeof module==='object'?require('./'+file+'.js'):globalThis[name];}
const world=()=>dep('world','ForestWorld'), vitals=()=>dep('vitals','ForestVitals');
const environment=()=>dep('environment','ForestEnvironment');
function calm(s){
 const e=environment();
 return vitals().isDay(s)&&!['rain','snow','storm','typhoon'].includes(s.weather.kind)&&s.weather.wind<30&&
  e.precipitation(s,'rain')===0&&e.precipitation(s,'snow')===0&&!world().frozen(s)&&e.season(s)!=='winter';
}
function step(s,held,rng){
 const W=world();
 if(!W.lakeOpen(s)||!s.world.lake)return;
 const lake=s.world.lake,center=W.LAKE;
 const west={x:center.cx-center.ru,y:center.cy};
 const b=lake.boat??={...W.nearShore(s,west),nextDrift:s.worldTick+240,dock:0};
 if(b.rider){
  const p=s.individuals.find(q=>q.id===b.rider);
  if(!p){Object.assign(b,b.home);delete b.rider;return;}
  const age=s.worldTick-b.start,n=dep('objects','ForestObjects').needs(p);
  const interrupted=!calm(s)||held===p.id||p.mounted||!p.active||n.water||n.energy||n.nutrition||p.wetRecovery||p.burden>=40;
  if(age>=b.duration||interrupted){
   const space=dep('spatial','ForestSpace');
   const free=q=>space.walkable(s,q,p.id)&&!s.individuals.some(z=>z.active&&z.id!==p.id&&space.distance(q,z)<(space.diameter(p)+space.diameter(z))/2);
   const spot=!interrupted&&free(b.home)?b.home:W.freeLanding(s,p,free);
   if(!spot)return;
   Object.assign(b,{x:spot.x,y:spot.y,nextDrift:s.worldTick+240});
   if(!p.mounted){p.x=b.x;p.y=b.y;}
   delete b.rider;delete b.home;p.boatAfter=s.worldTick+600;p.nextObjectChoice=s.worldTick;return;
  }
  const phase=age/b.duration*Math.PI*2,depth=.13*(1-Math.cos(phase)),dx=center.cx-b.home.x,dy=center.cy-b.home.y;
  b.x=p.x=b.home.x+dx*depth-dy*.10*Math.sin(phase);
  b.y=p.y=b.home.y+dy*depth+dx*.10*Math.sin(phase);
  if(age===5||age===10||age===15)vitals().energyPts(p,1);
  if(age===10){const water=Math.max(0,Math.min(2,vitals().band(p).hi-p.B));p.B+=water;s.ledger.lake=(s.ledger.lake||0)+water;}
  if(age===13){const leaf=dep('creatures','ForestCreatures').onLeaf(s,p.id);
   for(const group of [leaf.mite,leaf.mealy])if(group)group.density=Math.max(0,group.density-2);}
  return;
 }
 if(!calm(s))return;
 if(b.drift){
  const d=b.drift,t=Math.min(1,(s.worldTick-d.start)/60);
  b.x=d.x+(d.to.x-d.x)*t;b.y=d.y+(d.to.y-d.y)*t;
  if(t===1){delete b.drift;b.nextDrift=s.worldTick+240;}return;
 }
 for(const p of s.individuals){
  const r=p.stroll;
  if(!r||!(r.view||r.cool)||r.arrivedAt==null||s.worldTick-r.arrivedAt>1||r.boatChecked)continue;
  r.boatChecked=true;
  if(!p.active||p.mounted||p.id===held||p.skill||p.skillHold||p.objectTask||p.shelter?.facilityId||p.shelterRequest||p.burden>=40||p.wetRecovery||p.leafRecovery||p.damage>=10||s.social.sessions.some(a=>a.ids.includes(p.id))||
   p.boatAfter>s.worldTick||Math.hypot(p.x-b.x,p.y-b.y)>.26)continue;
  const n=dep('objects','ForestObjects').needs(p);if(n.water||n.energy||n.nutrition)continue;
  const leaf=dep('creatures','ForestCreatures').onLeaf(s,p.id);
  const prefersRide=p.energy<65||leaf.mealy?.density>0||leaf.mite?.density>0;
  if(rng(s,'behavior')>=(prefersRide ? .5 : .25))continue;
  b.home={x:p.x,y:p.y};b.x=p.x;b.y=p.y;b.rider=p.id;b.start=s.worldTick;b.duration=30+Math.floor(rng(s,'behavior')*16);
  delete p.stroll;delete p.walkPlan;return;
 }
 if(s.worldTick>=b.nextDrift){
  b.dock=(b.dock+1)%3;
  const to=W.nearShore(s,[west,{x:center.cx,y:center.cy-center.rv},{x:center.cx+center.ru,y:center.cy}][b.dock]);
  b.drift={x:b.x,y:b.y,to,start:s.worldTick};
 }
}
function reason(s,p){const b=s.world?.lake?.boat;if(!b||b.rider!==p.id)return '';
 const age=s.worldTick-b.start;
 return age>=13&&age<16?'몸을 털어 물방울을 떨구고 있어요':age>=10&&age<13?'잎끝에 이슬을 머금고 있어요':'연잎에 앉아 물결에 흔들리고 있어요';
}
function validate(s){
 const b=s.world?.lake?.boat;if(!b)return;
 const point=q=>q&&Number.isFinite(q.x)&&Number.isFinite(q.y)&&world().inside(s,q);
 const tick=Number.isSafeInteger;
 if(!point(b)||!tick(b.nextDrift)||![0,1,2].includes(b.dock)||
    b.drift&&(!point(b.drift)||!point(b.drift.to)||!tick(b.drift.start))||
    b.rider&&(b.drift||!point(b.home)||!tick(b.start)||b.start>s.worldTick||
    !tick(b.duration)||b.duration<30||b.duration>45||!s.individuals.some(p=>p.id===b.rider)))
  throw Error('연잎 배 기록을 확인해 주세요.');
}
return {step,reason,validate};
});
