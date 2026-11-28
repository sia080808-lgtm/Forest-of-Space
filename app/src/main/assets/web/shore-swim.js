(function(root,factory){
 const api=factory(name=>typeof module==='object'?require('./'+name+'.js'):root[{
  world:'ForestWorld',spatial:'ForestSpace',vitals:'ForestVitals',environment:'ForestEnvironment',
  objects:'ForestObjects',friendship:'ForestFriendship'
 }[name]]);
 if(typeof module==='object')module.exports=api;else root.ForestShoreSwim=api;
})(globalThis,function(dep){
'use strict';
const SWIM_SECONDS=10,COOLDOWN=120,SAME_PAIR=300,PRE_ENTRY=30;
const APPROACH_TIMEOUT=14,DELAY=1,ENTRY=2,EXIT=2,SHAKE=2,LEGACY_SWIM_SECONDS=20;
const finishAt=seconds=>DELAY+ENTRY+seconds+EXIT;
const endAt=seconds=>finishAt(seconds)+SHAKE;
const END=endAt(SWIM_SECONDS);
const swimTime=a=>a.duration??LEGACY_SWIM_SECONDS;
const pairKey=(a,b)=>[a,b].sort().join(':');
const get=s=>s.world?.lake?.swim;
const busy=(s,id)=>get(s)?.ids.includes(id)||false;
const clamp=t=>Math.max(0,Math.min(1,t));
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
function calm(s){
 const W=dep('world'),E=dep('environment');
 return W.lakeOpen(s)&&!W.frozen(s)&&!s.environment?.storm&&s.weather.wind<30&&
  ['morning','noon'].includes(E.timeKey(s))&&
  E.precipitation(s,'rain')===0&&E.precipitation(s,'snow')===0&&
  !['rain','snow'].includes(s.weather.kind);
}
function ready(s,p,held){
 const V=dep('vitals'),O=dep('objects');
 return p?.active&&!p.mounted&&p.id!==held&&p.id!==s.world.lake.boat?.rider&&
  !p.objectTask&&!p.skill&&!p.skillHold&&!p.sleepHere&&!p.braceHere&&!p.restSelf&&
  !p.wetRecovery&&!p.leafRecovery&&!p.shelterRequest&&!p.shelter?.facilityId&&
  p.shelter?.phase==='outside'&&p.damage<30&&p.burden<40&&!(p.canopyProgress>0)&&
  !(p.settleUntil>=s.worldTick)&&!(p.guideTo?.until>s.worldTick)&&
  p.B>=V.band(p).warnLo&&p.nutrition>=V.band(p).warnLo&&p.energy>=50&&
  !V.sleepTime(s,p)&&!O.coldCall(s,p)&&
  !s.social.sessions.some(a=>a.ids.includes(p.id))&&!dep('friendship').busy(s,p.id);
}
function bodyPoint(lane,age,seconds){
 const t=age-lane.delay;
 if(t<ENTRY)return {...mix(lane.bank,lane.water,ease(t/ENTRY)),depth:ease(t/ENTRY)};
 if(t<ENTRY+seconds){
  const a=(t-ENTRY)/seconds*Math.PI*2;
  const x=lane.water.x-lane.tx*.074*Math.sin(a)+lane.nx*.095*(1-Math.cos(a));
  const y=lane.water.y-lane.ty*.074*Math.sin(a)+lane.ny*.095*(1-Math.cos(a));
  return {x,y,depth:1};
 }
 const u=ease((t-ENTRY-seconds)/EXIT);
 return {...mix(lane.water,lane.bank,u),depth:1-u};
}
// The two short loops are checked once, including the gap between companions.
// The engine retains dry bank positions throughout the water animation.
function plan(s,maria,buddy,near){
 const W=dep('world'),S=dep('spatial'),L=W.LAKE;
 const dx=L.cx-near.x,dy=L.cy-near.y,d=Math.hypot(dx,dy*S.ASPECT);
 if(!d)return null;
 const nx=dx/d,ny=dy/d,tx=-ny*S.ASPECT,ty=nx/S.ASPECT;
 for(const sign of [1,-1]){
  const banks=[near,W.nearShore(s,{x:near.x+tx*.17*sign,y:near.y+ty*.17*sign})];
  const free=(q,p)=>q&&!W.inWater(s,q)&&S.walkable(s,q,p.id)&&
   !s.individuals.some(z=>z.active&&z!==p&&z!==maria&&z!==buddy&&S.distance(q,z)<(S.diameter(p)+S.diameter(z))/2);
  if(!free(banks[0],maria)||!free(banks[1],buddy)||S.distance(...banks)<.125||S.distance(...banks)>.32)continue;
  if(S.distance(buddy,banks[1])>.45)continue;
  const lanes=banks.map((bank,i)=>({
   bank,water:{x:bank.x+nx*.13,y:bank.y+ny*.13},
   nx,ny,tx:tx*sign,ty:ty*sign,delay:i*DELAY
  }));
  let valid=true;
  for(let t=0;t<=finishAt(SWIM_SECONDS);t+=.5){
   const [a,b]=lanes.map(lane=>bodyPoint(lane,t,SWIM_SECONDS));
   if(!W.inside(s,a)||!W.inside(s,b)||S.distance(a,b)<(S.diameter(maria)+S.diameter(buddy))/2||
      (a.depth===1&&!W.inWater(s,a))||(b.depth===1&&!W.inWater(s,b))){valid=false;break;}
  }
  if(valid&&S.route(s,maria,banks[0],maria.id)&&S.route(s,buddy,banks[1],buddy.id))return lanes;
 }
 return null;
}
function finish(s,a){
 const lake=s.world.lake;
 delete lake.swim;
 const entered=a.started!==null&&s.worldTick>a.started;
 if(entered){
  const pairs=lake.swimPairs??={};
  for(const [key,until] of Object.entries(pairs))if(until<=s.worldTick)delete pairs[key];
  pairs[pairKey(...a.ids)]=s.worldTick+SAME_PAIR;
 }
 for(const p of s.individuals)if(a.ids.includes(p.id)){
  p.swimAfter=s.worldTick+(entered?COOLDOWN:PRE_ENTRY);
  if(p.active)p.nextObjectChoice=s.worldTick;
  delete p.walkPlan;
 }
}
function cancel(s,id){const a=get(s);if(a&&(!id||a.ids.includes(id)))finish(s,a);}
function check(s,held){
 const a=get(s);
 if(!a)return;
 if(!calm(s)||a.layout!==s.layoutRevision||a.ids.some(id=>!ready(s,s.individuals.find(p=>p.id===id),held))||
    (a.started==null?s.worldTick-a.offered>APPROACH_TIMEOUT:s.worldTick-a.started>endAt(swimTime(a))))finish(s,a);
}
function offer(s,held){
 if(s.worldTick%10!==0||get(s)||s.world?.lake?.boat?.rider||!s.individuals.some(p=>p.active&&p.species==='maria')||!calm(s))return;
 const S=dep('spatial'),W=dep('world'),pairs=s.world.lake.swimPairs;
 for(const maria of s.individuals){
  if(maria.species!=='maria'||maria.swimAfter>s.worldTick||maria.socialUntil>s.worldTick||!ready(s,maria,held)||
     maria.stroll?.perch||maria.stroll?.shelf||maria.stroll?.board||maria.stroll?.lake)continue;
  if(maria.x<W.LAKE.cx-W.LAKE.ru-.35||maria.x>W.LAKE.cx+W.LAKE.ru+.35||
     Math.abs(maria.y-W.LAKE.cy)>W.LAKE.rv+.24||W.inWater(s,maria))continue;
  const near=W.nearShore(s,maria);
  if(!near||S.distance(maria,near)>.22)continue;
  // Prefer a nearby free friend who will benefit, regardless of their species.
  const candidates=s.individuals.filter(p=>p!==maria&&!(p.swimAfter>s.worldTick)&&!(p.socialUntil>s.worldTick)&&
   !(pairs?.[pairKey(maria.id,p.id)]>s.worldTick)&&S.distance(p,near)<.32&&
   (maria.B<50||p.B<50)&&ready(s,p,held)&&!W.inWater(s,p)&&
   !p.stroll?.board&&!p.stroll?.perch&&!p.stroll?.shelf&&!p.stroll?.lake);
  candidates.sort((a,b)=>a.B-b.B||S.distance(a,near)-S.distance(b,near)||a.id.localeCompare(b.id));
  for(const p of candidates.slice(0,3)){
   const lanes=plan(s,maria,p,near);
   if(!lanes)continue;
   for(const q of [maria,p]){delete q.stroll;delete q.walkPlan;}
   s.world.lake.swim={ids:[maria.id,p.id],lanes,offered:s.worldTick,started:null,layout:s.layoutRevision,duration:SWIM_SECONDS};
   return;
  }
 }
}
function begin(s,event){
 const a=get(s);
 if(a?.started!==null)return;
 const S=dep('spatial');
 if(a.ids.every((id,i)=>S.distance(s.individuals.find(p=>p.id===id),a.lanes[i].bank)<.001)){
  a.started=s.worldTick;
  event?.(s,'swim','마리아가 친구를 물가로 이끌었어요.',{individual:a.ids[0]});
 }
}
function act(s,p,event){
 const a=get(s),i=a?.ids.indexOf(p.id)??-1;
 if(i<0)return false;
 if(a.started==null){
  if(dep('spatial').distance(p,a.lanes[i].bank)>.001)Object.assign(p.motion,dep('spatial').travel(s,p,a.lanes[i].bank));
  return true;
 }
 const seconds=swimTime(a),age=s.worldTick-a.started-a.lanes[i].delay,remaining=ENTRY+seconds-age;
 const complete=s.worldTick-a.started===endAt(seconds);
 if(age>=ENTRY&&remaining>0||complete){
  const gap=Math.max(0,dep('vitals').band(p).hi-p.B);
  const amount=gap/(complete?1:remaining);
  p.B+=amount;
  s.ledger.lake=(s.ledger.lake||0)+amount;
 }
 if(complete&&i===0)event?.(s,'swim','마리아와 친구가 수영을 마치고 돌아왔어요.',{individual:p.id});
 return true;
}
function pose(s,id,fraction){
 const a=get(s),i=a?.ids.indexOf(id)??-1;
 if(i<0||a.started==null)return null;
 const seconds=swimTime(a),age=s.worldTick-a.started+fraction-1,lane=a.lanes[i],point=bodyPoint(lane,age,seconds);
 const next=bodyPoint(lane,age+.04,seconds),prev=bodyPoint(lane,age-.04,seconds);
 const dx=next.x-prev.x,dy=next.y-prev.y;
 const speed=Math.hypot(dx*360,dy*576);
 const local=age-lane.delay;
 const glance=i===0&&local>1&&local<2.7;
 const drying=clamp((local-ENTRY-seconds-EXIT)/SHAKE);
 return {...point,i,dx,dy,speed,glance,face:glance?(lane.nx<0?1:-1):speed>.012&&Math.abs(dx)>.00004?(dx<0?-1:1):(local>ENTRY+seconds?-Math.sign(lane.nx):Math.sign(lane.nx))||1,
  shake:drying>0&&drying<1?drying:0};
}
function reason(s,p){
 if(!busy(s,p.id))return '';
 const a=get(s);
 if(a.started==null)return p.id===a.ids[0]?'친구를 데리고 물가로 가고 있어요':'마리아를 따라 물가로 가고 있어요';
 const age=s.worldTick-a.started;
 return age>=finishAt(swimTime(a))?'물가에 올라와 잎을 털고 있어요':age<ENTRY+DELAY?'친구와 함께 물에 들어가고 있어요':'친구와 나란히 헤엄치며 수분을 채워요';
}
function migrate(s){
 for(const p of s.individuals)if(Number.isSafeInteger(p.swimAfter))p.swimAfter=Math.min(p.swimAfter,s.worldTick+COOLDOWN);
}
function validate(s){
 const pairs=s.world?.lake?.swimPairs;
 const validId=id=>/^[-A-Za-z0-9_]{1,100}$/.test(id);
 if(pairs!==undefined&&(!pairs||typeof pairs!=='object'||Array.isArray(pairs)||
  Object.entries(pairs).some(([key,until])=>{
   const [a,b,extra]=key.split(':');
   return extra!==undefined||!validId(a??'')||!validId(b??'')||a>=b||!Number.isSafeInteger(until)||until<0;
  })))throw Error('함께 수영한 친구의 대기 기록을 확인해 주세요.');
 for(const p of s.individuals)if(p.swimAfter!=null&&(!Number.isSafeInteger(p.swimAfter)||p.swimAfter<0))throw Error('수영 대기 기록을 확인해 주세요.');
 const a=get(s);
 if(a==null)return;
 const W=dep('world'),tick=t=>Number.isSafeInteger(t)&&t>=0&&t<=s.worldTick;
 if(!W.lakeOpen(s)||!Array.isArray(a.ids)||a.ids.length!==2||a.ids[0]===a.ids[1]||
    !a.ids.every(id=>s.individuals.some(p=>p.id===id))||s.individuals.find(p=>p.id===a.ids[0])?.species!=='maria'||
    a.duration!==undefined&&a.duration!==SWIM_SECONDS||!tick(a.offered)||a.started!==null&&(!tick(a.started)||a.started<a.offered)||
    !Number.isSafeInteger(a.layout)||a.layout<0||!Array.isArray(a.lanes)||a.lanes.length!==2||
    a.lanes.some((l,i)=>!l||!l.bank||!l.water||!W.inside(s,l.bank)||!W.inside(s,l.water)||l.delay!==i*DELAY||
     ['nx','ny','tx','ty'].some(k=>!Number.isFinite(l[k])||Math.abs(l[k])>1.01)))
  throw Error('수영 기록을 확인해 주세요.');
}
return {SWIM_SECONDS,COOLDOWN,END,busy,check,offer,begin,act,pose,reason,migrate,validate,cancel};
});
