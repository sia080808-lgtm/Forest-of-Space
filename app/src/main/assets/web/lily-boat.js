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
 return vitals().isDay(s)&&!['night','deep'].includes(e.timeKey(s))&&!['rain','snow','storm','typhoon'].includes(s.weather.kind)&&s.weather.wind<30&&
  e.precipitation(s,'rain')===0&&e.precipitation(s,'snow')===0&&!world().frozen(s)&&e.season(s)!=='winter';
}
const eastEdge=()=>world().LAKE.cx+world().LAKE.ru/3;
function landingFree(s,p,q){
 const space=dep('spatial','ForestSpace');
 return space.walkable(s,q,p.id)&&!s.individuals.some(z=>z.active&&z.id!==p.id&&space.distance(q,z)<(space.diameter(p)+space.diameter(z))/2);
}
function eastLanding(s,p,goal){
 return world().freeLanding(s,goal,q=>q.x>=eastEdge()&&landingFree(s,p,q));
}
function roll(s,rng){
 // A boat offer must not consume another friend's next behaviour roll.
 s.rng.boat??=s.rng.behavior||1;
 return rng(s,'boat');
}
function approaching(s,b,except){
 return s.individuals.some(p=>{
  const r=p.stroll;
  return p.id!==except&&p.active&&!p.mounted&&r?.board&&r.deadline>s.worldTick&&
   r.board.x===b.x&&r.board.y===b.y;
 });
}
function offerLoop(s,p,rng){
 const r=p.stroll,b=s.world?.lake?.boat;
 if(!r||r.ice||r.far||!b||b.rider||b.drift||!calm(s)||!canRide(s,p)||approaching(s,b,p.id))return;
 const space=dep('spatial','ForestSpace');
 // Keep the original stroll as the fallback if daylight, the boat or the route changes.
 if(space.distance(p,b)>1.8||roll(s,rng)>=((r.view||r.cool) ? .8 : .35))return;
 if(landingFree(s,p,b)&&space.route(s,p,b,p.id))r.board={x:b.x,y:b.y,loop:true};
}
function offerCrossing(s,p,rng){
 const r=p.stroll,b=s.world?.lake?.boat;
 if(!r||!r.far||!b||b.rider||b.drift||p.boatAfter>s.worldTick||!calm(s)||r.x<eastEdge())return;
 const W=world(),space=dep('spatial','ForestSpace');
 if(p.x>=W.LAKE.cx||b.x>W.LAKE.cx-W.LAKE.ru/3||space.distance(p,b)>=space.distance(p,r))return;
 if(approaching(s,b,p.id)||roll(s,rng)>=.5||!landingFree(s,p,b))return;
 const approach=space.route(s,p,b,p.id);if(!approach)return;
 let from=p,walkLength=0;
 for(const waypoint of approach){walkLength+=space.distance(from,waypoint);from=waypoint;}
 const landing=eastLanding(s,p,r);
 if(landing&&walkLength+space.distance(landing,r)<space.distance(p,r))r.board={x:b.x,y:b.y,landing};
}
// Use the same needs and warmth thresholds as ordinary object selection.
function canRide(s,p,held){
 const objects=dep('objects','ForestObjects');
 if(!p.active||p.mounted||p.id===held||p.skill||p.skillHold||p.objectTask||
    p.shelter?.facilityId||p.shelterRequest||p.sleepHere||p.braceHere||p.restSelf||
    p.settleUntil>=s.worldTick||p.guideTo?.until>s.worldTick||p.wetRecovery||
    p.leafRecovery||p.damage>=10||p.burden>=40||p.B>vitals().band(p).hi||
    objects.coldCall(s,p)||vitals().sleepTime(s,p)||p.boatAfter>s.worldTick||
    s.social.sessions.some(a=>a.ids.includes(p.id)))return false;
 const n=objects.needs(p);
 return !n.water&&!n.energy&&!n.nutrition;
}
function release(s,b,p,spot){
 Object.assign(b,{x:spot.x,y:spot.y,nextDrift:s.worldTick+240});
 delete b.cross;delete b.rider;delete b.home;delete b.start;delete b.duration;
 if(p){p.boatAfter=s.worldTick+600;p.nextObjectChoice=s.worldTick;delete p.walkPlan;}
}
// A successful manual drop owns the friend's position, even between simulation ticks.
function leaveForMove(s,p){
 const b=s.world?.lake?.boat;
 if(b?.rider===p.id)release(s,b,p,b.home);
}
// Sample the same route for the simulation tick and the frames between ticks.
function ridePoint(b,age){
 const t=Math.min(1,Math.max(0,age/b.duration)),home=b.home;
 if(b.cross)return {x:home.x+(b.cross.landing.x-home.x)*t,y:home.y+(b.cross.landing.y-home.y)*t};
 const center=world().LAKE,dx=center.cx-home.x,dy=center.cy-home.y,phase=t*Math.PI*2;
 const depth=.13*(1-Math.cos(phase)),sway=.10*Math.sin(phase);
 return {x:home.x+dx*depth-dy*sway,y:home.y+dy*depth+dx*sway};
}
function step(s,held,rng){
 const W=world();
 if(!W.lakeOpen(s)||!s.world.lake)return;
 const lake=s.world.lake,center=W.LAKE;
 const west={x:center.cx-center.ru,y:center.cy};
 const b=lake.boat??={...W.nearShore(s,west),nextDrift:s.worldTick+240,dock:0};
 if(b.rider){
  const p=s.individuals.find(q=>q.id===b.rider);
  if(!p){release(s,b,null,b.home);return;}
  const age=s.worldTick-b.start,interrupted=!calm(s)||!canRide(s,p,held);
  if(age>=b.duration||interrupted){
   const free=q=>landingFree(s,p,q);
   const cross=b.cross;
   const east=cross&&!interrupted&&(free(cross.landing)?cross.landing:eastLanding(s,p,cross.goal));
   // Prefer an unoccupied landing. In a crowded old save a walkable bank still
   // releases the seat, so the ordinary sleep/safety planner can run this tick.
   const spot=east||(!cross&&!interrupted&&free(b.home)?b.home:W.freeLanding(s,p,free))||
    W.freeLanding(s,p,q=>dep('spatial','ForestSpace').walkable(s,q,p.id))||W.nearShore(s,p);
   release(s,b,p,spot);
   if(p.active&&!p.mounted){p.x=spot.x;p.y=spot.y;}
   if(east){p.stroll={...cross.goal,deadline:s.worldTick+90,boatChecked:true};b.dock=2;}
   return;
  }
  const pos=ridePoint(b,age);
  b.x=p.x=pos.x;b.y=p.y=pos.y;
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
  if(r?.board&&r.board.x===b.x&&r.board.y===b.y&&Math.hypot(p.x-b.x,p.y-b.y)<.025&&canRide(s,p,held)){
   const loop=r.board.loop;
   const landing=!loop&&(landingFree(s,p,r.board.landing)?r.board.landing:eastLanding(s,p,r));
   delete r.board;
   if(loop||landing){
    if(landing)b.cross={goal:{...r,stalled:0},landing};
    b.home={x:p.x,y:p.y};b.rider=p.id;
    b.start=s.worldTick;b.duration=30+Math.floor(roll(s,rng)*(loop?16:6));
    delete p.stroll;delete p.walkPlan;return;
   }
  }
  if(!r||!(r.view||r.cool)||r.arrivedAt==null||s.worldTick-r.arrivedAt>=r.linger||r.boatChecked||r.board)continue;
  if(!canRide(s,p,held)||Math.hypot(p.x-b.x,p.y-b.y)>.38||approaching(s,b,p.id)||!landingFree(s,p,b))continue;
  r.boatChecked=true;
  const leaf=dep('creatures','ForestCreatures').onLeaf(s,p.id);
  const prefersRide=p.energy<65||leaf.mealy?.density>0||leaf.mite?.density>0;
  if(roll(s,rng)>=(prefersRide ? .9 : .7))continue;
  if(Math.hypot(p.x-b.x,p.y-b.y)>=.025){
   r.board={x:b.x,y:b.y,loop:true};continue;
  }
  b.home={x:p.x,y:p.y};b.x=p.x;b.y=p.y;b.rider=p.id;b.start=s.worldTick;b.duration=30+Math.floor(roll(s,rng)*16);
  delete p.stroll;delete p.walkPlan;return;
 }
 if(s.worldTick>=b.nextDrift&&!approaching(s,b)){
  b.dock=(b.dock+1)%3;
  const to=W.nearShore(s,[west,{x:center.cx,y:center.cy-center.rv},{x:center.cx+center.ru,y:center.cy}][b.dock]);
  b.drift={x:b.x,y:b.y,to,start:s.worldTick};
 }
}
function reason(s,p){const b=s.world?.lake?.boat;if(!b||b.rider!==p.id)return '';
 const age=s.worldTick-b.start;
 return age>=13&&age<16?'몸을 털어 물방울을 떨구고 있어요':age>=10&&age<13?'잎끝에 이슬을 머금고 있어요':b.cross?'연잎을 타고 동쪽 물가로 건너가고 있어요':'연잎에 앉아 물결에 흔들리고 있어요';
}
function validate(s){
 const b=s.world?.lake?.boat;if(!b)return;
 const point=q=>q&&Number.isFinite(q.x)&&Number.isFinite(q.y)&&world().inside(s,q);
 const tick=Number.isSafeInteger;
 if(!point(b)||!tick(b.nextDrift)||![0,1,2].includes(b.dock)||
    b.cross&&(!b.rider||!point(b.cross.goal)||!point(b.cross.landing)||b.cross.landing.x<eastEdge())||
    b.drift&&(!point(b.drift)||!point(b.drift.to)||!tick(b.drift.start))||
    b.rider&&(b.drift||!point(b.home)||!tick(b.start)||b.start>s.worldTick||
    !tick(b.duration)||b.duration<30||b.duration>45||!s.individuals.some(p=>p.id===b.rider)))
  throw Error('연잎 배 기록을 확인해 주세요.');
}
return {step,reason,validate,offerCrossing,offerLoop,calm,canRide,leaveForMove,ridePoint};
});
