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
const eastEdge=()=>world().LAKE.cx+world().LAKE.ru/3;
function landingFree(s,p,q){
 const space=dep('spatial','ForestSpace');
 return space.walkable(s,q,p.id)&&!s.individuals.some(z=>z.active&&z.id!==p.id&&space.distance(q,z)<(space.diameter(p)+space.diameter(z))/2);
}
function eastLanding(s,p,goal){
 return world().freeLanding(s,goal,q=>q.x>=eastEdge()&&landingFree(s,p,q));
}
function offerCrossing(s,p,rng){
 const r=p.stroll,b=s.world?.lake?.boat;
 if(!r||!r.far||!b||b.rider||b.drift||p.boatAfter>s.worldTick||!calm(s)||r.x<eastEdge())return;
 const W=world(),space=dep('spatial','ForestSpace');
 if(p.x>=W.LAKE.cx||b.x>W.LAKE.cx-W.LAKE.ru/3||space.distance(p,b)>=space.distance(p,r))return;
 if(rng(s,'behavior')>=.5||!landingFree(s,p,b))return;
 const approach=space.route(s,p,b,p.id);if(!approach)return;
 let from=p,walkLength=0;
 for(const waypoint of approach){walkLength+=space.distance(from,waypoint);from=waypoint;}
 const landing=eastLanding(s,p,r);
 if(landing&&walkLength+space.distance(landing,r)<space.distance(p,r))r.board={x:b.x,y:b.y,landing};
}
function canBoard(s,p,held){
 if(!p.active||p.mounted||p.id===held||p.skill||p.skillHold||p.objectTask||p.shelter?.facilityId||p.shelterRequest||p.burden>=40||p.wetRecovery||p.leafRecovery||p.damage>=10||s.social.sessions.some(a=>a.ids.includes(p.id))||p.boatAfter>s.worldTick)return false;
 const n=dep('objects','ForestObjects').needs(p);
 return !n.water&&!n.energy&&!n.nutrition;
}
function step(s,held,rng){
 const W=world();
 if(!W.lakeOpen(s)||!s.world.lake)return;
 const lake=s.world.lake,center=W.LAKE;
 const west={x:center.cx-center.ru,y:center.cy};
 const b=lake.boat??={...W.nearShore(s,west),nextDrift:s.worldTick+240,dock:0};
 if(b.rider){
  const p=s.individuals.find(q=>q.id===b.rider);
  if(!p){Object.assign(b,b.home);delete b.rider;delete b.home;delete b.cross;return;}
  const age=s.worldTick-b.start,n=dep('objects','ForestObjects').needs(p);
  const interrupted=!calm(s)||held===p.id||p.mounted||!p.active||n.water||n.energy||n.nutrition||p.wetRecovery||p.burden>=40;
  if(age>=b.duration||interrupted){
   const space=dep('spatial','ForestSpace');
   const free=q=>space.walkable(s,q,p.id)&&!s.individuals.some(z=>z.active&&z.id!==p.id&&space.distance(q,z)<(space.diameter(p)+space.diameter(z))/2);
   const cross=b.cross;
   const east=cross&&!interrupted&&(free(cross.landing)?cross.landing:eastLanding(s,p,cross.goal));
   const spot=east||(!cross&&!interrupted&&free(b.home)?b.home:W.freeLanding(s,p,free));
   if(!spot)return;
   Object.assign(b,{x:spot.x,y:spot.y,nextDrift:s.worldTick+240});
   if(!p.mounted){p.x=b.x;p.y=b.y;}
   if(east){p.stroll={...cross.goal,deadline:s.worldTick+90,boatChecked:true};b.dock=2;}
   delete b.cross;delete b.rider;delete b.home;p.boatAfter=s.worldTick+600;p.nextObjectChoice=s.worldTick;return;
  }
  const phase=age/b.duration*Math.PI*2,depth=.13*(1-Math.cos(phase)),dx=center.cx-b.home.x,dy=center.cy-b.home.y;
  const t=age/b.duration;
  b.x=p.x=b.cross?b.home.x+(b.cross.landing.x-b.home.x)*t:b.home.x+dx*depth-dy*.10*Math.sin(phase);
  b.y=p.y=b.cross?b.home.y+(b.cross.landing.y-b.home.y)*t:b.home.y+dy*depth+dx*.10*Math.sin(phase);
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
  if(r?.board&&r.board.x===b.x&&r.board.y===b.y&&Math.hypot(p.x-b.x,p.y-b.y)<.025&&canBoard(s,p,held)){
   const landing=landingFree(s,p,r.board.landing)?r.board.landing:eastLanding(s,p,r);
   delete r.board;
   if(landing){
    b.cross={goal:{...r,stalled:0},landing};b.home={x:p.x,y:p.y};b.rider=p.id;
    b.start=s.worldTick;b.duration=30+Math.floor(rng(s,'behavior')*6);
    delete p.stroll;delete p.walkPlan;return;
   }
  }
  if(!r||!(r.view||r.cool)||r.arrivedAt==null||s.worldTick-r.arrivedAt>1||r.boatChecked)continue;
  r.boatChecked=true;
  if(!canBoard(s,p,held)||Math.hypot(p.x-b.x,p.y-b.y)>.26)continue;
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
return {step,reason,validate,offerCrossing,calm};
});
