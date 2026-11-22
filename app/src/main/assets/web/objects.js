(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestObjects=api;})(globalThis,function(){
'use strict';
const World=typeof module==='object'?require('./world.js'):globalThis.ForestWorld;
const dep=n=>typeof module==='object'?require('./'+n+'.js'):globalThis[{spatial:'ForestSpace',shelter:'ForestShelter','weather-care':'ForestWeatherCare',environment:'ForestEnvironment',social:'ForestSocial',litter:'ForestLitter',creatures:'ForestCreatures',traits:'ForestTraits',world:'ForestWorld',vitals:'ForestVitals',skills:'ForestSkills'}[n]];
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v)),eps=1e-8;
const capacities={moss:[5,7,9],spring:[60,90,120],litter:[100,150,200]},BASE_DAILY=[45,68,90],OLD_DAILY=[20,30,40];
// 0.8.0 (SRS v2.31): leaves per day follow the season (spring x0.6, summer x0.8, autumn x2, winter x0.3, rounded up). A day's
// quota is fixed by the season at the start of that day. None of these values is 20/30/40, so the 0.6.x mapping never
// touches them.
const LITTER_SEASON={spring:.6,summer:.8,autumn:2,winter:.3};
const seasonDaily=(base,id)=>Math.ceil(base*(LITTER_SEASON[id]??1)-1e-9);
const daily=[...new Set([...BASE_DAILY,...BASE_DAILY.flatMap(b=>Object.keys(LITTER_SEASON).map(k=>seasonDaily(b,k)))])];
const envSeason=s=>{const E=typeof module==='object'?require('./environment.js'):globalThis.ForestEnvironment;return s.environment&&E?.season?E.season(s):null;};
const quota=s=>seasonDaily(BASE_DAILY[level(s,'litter')-1],envSeason(s));// 0.7.0: leaves per day grow with the forest area (x2.25)
const rates={rock:1,moss:2,shade:1.5,crevice:1,shelter:3};   // SRS v2.34: shelter 4 -> 3 (photosynthesis shares the work of 기운)
const names={moss:'이끼 자리',spring:'샘터',litter:'낙엽 자리',rock:'햇살 바위',shade:'잎 그늘',crevice:'바위틈',shelter:'쉼터'};
const isPile=id=>typeof id==='string'&&id.startsWith('pile:');
const stash=(s,id)=>(s.objects?.stored||[]).find(p=>p.id===id);   // 1.2.6 보관함
const patch=(s,id)=>id==='spring'?s.spring:isPile(id)?dep('litter').pile(s,id):s.patches.find(p=>p.id===id);
const nameOf=id=>isPile(id)?'낙엽더미':names[id];
// Piles share the litter spot's upgrade record and play/nutrition rules.
const kindOf=id=>isPile(id)?'litter':id;
const level=(s,id)=>s.objects?.upgrades?.[id]?.level||1;
const capacity=(s,id)=>(capacities[id]||[0])[level(s,id)-1];
const scale=(s,id)=>capacities[id]?1+(level(s,id)-1)*.15:1;
const moist=z=>z?.cap?100*z.S/z.cap:0;
function init(s){
 if(!s.objects)s.objects={version:1,nextSession:1,dayIndex:Math.floor(s.worldTick/1200),dayQuota:quota(s),arrivedToday:0,playBoostUntil:0,decomposedTotal:0,upgrades:{},ledger:{leafInput:0,absorbed:0},lastResourceTick:-1};
 {const o=s.objects,k=OLD_DAILY.indexOf(o.dayQuota);if(k>=0)o.dayQuota=BASE_DAILY[k];}
 for(const id of ['moss','spring','litter'])s.objects.upgrades[id]??={level:1,useSeconds:0,stageUseSeconds:0,pressureSeconds:0,pressureEvidence:false,unlocked:1};
 s.spring.capacity=capacity(s,'spring');s.spring.snowWater??=0;
 const m=patch(s,'moss')||stash(s,'moss');m.cap=capacity(s,'moss');m.pool=0;m.drain=0;
 if(s.shelters){dep('litter').init(s);(typeof module==='object'?require('./creatures.js'):globalThis.ForestCreatures).init(s);}
 return s;
}
function storedLeaf(s){const L=dep('litter');return s.patches.reduce((v,p)=>v+p.O+p.U,0)+L.leaves(s).length+L.antCarry(s)+L.piles(s).reduce((v,p)=>v+p.O+p.U,0)+s.individuals.reduce((v,p)=>v+(p.carriedLeaf?.amount||0)+(p.rootLitter||0),0);}
function migrate(s){
 if(s.objects)return s;
 // Only recognized older rules reach here; never convert an unknown save speculatively.
 for(const z of s.patches)for(const k of ['S','W','O','U'])if(!Number.isFinite(z[k])||z[k]<0)throw Error('기존 자원 기록을 읽을 수 없어요. 원본을 유지해요.');
 for(const z of s.patches)if(!Number.isFinite(z.cap)||!Number.isFinite(z.pool)||z.S>z.cap||z.W>z.pool)throw Error('기존 물량이 용량을 벗어났어요.');
 const m=patch(s,'moss'),oldWater=m.S+m.W,allO=s.patches.reduce((v,p)=>v+p.O,0),allU=s.patches.reduce((v,p)=>v+p.U,0);
 init(s);m.S=Math.min(5,oldWater);m.W=0;
 let spill=oldWater-m.S;const into=Math.min(spill,Math.max(0,s.spring.capacity-s.spring.water));s.spring.water+=into;spill-=into;s.ledger.outflow+=spill;
 for(const z of s.patches){z.O=z.id==='litter'?allO:0;z.U=z.id==='litter'?allU:0;}
 s.objects.migration={from:s.rules,tick:s.worldTick,waterMovedToSpring:into,waterOutflow:spill,leafTotal:storedLeaf(s)};
 s.objects.overflow=Math.max(0,storedLeaf(s)-capacity(s,'litter'));
 return s;
}
function release(s,p,reason='complete'){
 if(p.carriedLeaf){const z=patch(s,p.carriedLeaf.pile)||patch(s,'litter');if(!z)throw Error('낙엽의 원래 자리를 찾지 못했어요.');z.O+=p.carriedLeaf.amount;p.objectContact={id:p.carriedLeaf.key+':put',cue:'putdown',tick:s.worldTick};delete p.carriedLeaf;}
 if(p.objectTask){p.lastObject={object:p.objectTask.object,kind:p.objectTask.kind,tick:s.worldTick};delete p.objectTask;}
 delete p.objectWait;delete p.objectArrived;delete p.objectDebug;
 if(reason!=='replace'){delete p.nextObjectChoice;p.target=null;p.action='wander';p.actionSeconds=0;}
}
function invalidate(s){for(const p of s.individuals)if(p.objectTask||p.carriedLeaf)release(s,p,'layout');}
function relayout(s){if(s.objects?.litter)dep('litter').relocate(s);if(s.objects?.creatures)(typeof module==='object'?require('./creatures.js'):globalThis.ForestCreatures).relocate(s);}
function springWater(s){
 const E=dep('environment'),z=s.spring,st=s.objects;if(st.lastResourceTick===s.worldTick)return;
 const rain=12/60*E.precipitation(s,'rain')*3,snow=12/60*E.precipitation(s,'snow')*3;
 s.ledger.rain+=rain;s.ledger.snow+=snow;const snowIn=Math.min(snow,36-z.snowWater);z.snowWater+=snowIn;s.ledger.outflow+=snow-snowIn;
 const melt=s.climate.T>30?Math.min(z.snowWater,3*(.2+1.8*clamp((s.climate.T-30)/40,0,1))/60):0;z.snowWater-=melt;
 const input=rain+melt,stored=Math.min(input,Math.max(0,z.capacity-z.water));z.water+=stored;z.inflow=input;s.ledger.outflow+=input-stored;
 const evap=Math.min(z.water,(.2+.6*s.climate.L/100+.4*s.weather.wind/100)/60);z.water-=evap;s.ledger.evaporation+=evap;
}
function resources(s){
 const st=s.objects;if(st.lastResourceTick===s.worldTick)return;springWater(s);
 const day=Math.floor(s.worldTick/1200);if(day!==st.dayIndex){st.dayIndex=day;st.arrivedToday=0;st.dayQuota=quota(s);}
 // v2.24 step 1: leaves fall one at a time into world sectors; only floor leaves gate the fall (not compost).
 if(!st.litter)dep('litter').init(s);dep('litter').step(s);
 st.lastResourceTick=s.worldTick;
}
function litterRates(s,id='litter'){return dep('litter').rates(s,patch(s,id));}
function footprint(p){const Sh=dep('shelter'),Space=dep('spatial');return {rx:Space.diameter(p)*Sh.growth(p)*.34,ry:.007*Sh.growth(p)};}
function region(s,id,kind='rest'){
 const z=patch(s,id),g=scale(s,id);if(!z)return null;
 if(id==='moss')return {x:z.x,y:z.y-.03,rx:.12*g,ry:.038*g};
 if(id==='litter')return {x:z.x,y:z.y-.035,rx:.10*g,ry:.034*g};
 if(isPile(id))return {x:z.x,y:z.y,rx:.06,ry:.026};
 if(id==='spring')return kind==='edgeDrink'?{x:z.x+.105*g,y:z.y+.038*g,rx:.04*g,ry:.027*g}:{x:z.x,y:z.y+.017*g,rx:.067*g,ry:.027*g};
 // 0.6.30: rest under the leaves, just in front of the stem (the drawn leaves span about -.15..+.13 of the anchor);
 // before, the spot was below the plant and mostly inside its own obstacle, so friends rested far out by the side.
 if(id==='shade')return {x:z.x+.035,y:z.y+.02,rx:.075,ry:.018};
 if(id==='rock')return dep('spatial').rockTop(s);
 // 0.6.35: rest right in front of the crevice stones (their footprint ends about .004 below the anchor, plus the friend's
 // body padding). Before, the spot was .07 below the anchor, well away from the stones, so a friend resting "at the
 // crevice" could be standing on whatever was placed below it (a user's layout had the moss patch there).
 if(id==='crevice')return {x:z.x+.003,y:z.y+.03,rx:.07,ry:.015};
 return {x:z.x,y:z.y+.070,rx:.067,ry:.026};
}
function fits(s,p,id,q,kind){
 const r=region(s,id,kind),f=footprint(p);if(!r)return false;
 return [[-f.rx,0],[f.rx,0],[0,-f.ry],[0,f.ry]].every(([x,y])=>((q.x+x-r.x)/r.rx)**2+((q.y+y-r.y)/r.ry)**2<=1+eps);
}
function groundAt(s,p){
 if(dep('shelter').inside(s,p))return patch(s,'shelter');
 return s.patches.filter(z=>z.id!=='shelter'&&fits(s,p,z.id,p,'rest')).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]||null;
}
function spaceCapacity(s,id){return id==='moss'?(level(s,id)+1)*4:id==='spring'?12:isPile(id)?4:8;}
function used(s,id,exclude){const Sh=dep('shelter');return s.individuals.filter(p=>p.id!==exclude&&p.active&&p.objectTask?.object===id).reduce((n,p)=>n+Sh.units(p),0);}
function dry(s,id){const z=patch(s,id);return z&&moist(z)<40&&z.W<=.5;}
function windAt(s,p,q,id){
 const W=dep('weather-care'),probe={...p,...q,shelter:{phase:'outside'}};
 if(id==='shelter')return s.weather.wind*.2;
 let a=W.wind(s,probe);/* 1.2.4: tucked into the crevice a friend is out of the wind from any side (it was only from one wind direction, so in a storm the crevice was never usable) */if(id==='crevice')a*=.5;return a;
}
function effectsValid(s,p,t){
 const z=patch(s,t.object);if(!z)return false;const W=dep('weather-care'),a=t.object==='shelter'?s.weather.wind*.2:windAt(s,p,t,t.object);
 if(t.object==='shelter')return true;
 if(t.object==='moss')return a<60&&dep('environment').precipitation(s,'rain')<.6&&p.burden<40&&!p.wetRecovery&&p.wet85Seconds<30&&!s.patches.some(z=>z.id!=='moss'&&z.W>1&&Math.hypot(p.x-z.x,p.y-z.y)<.06);
 if(t.kind==='drink'||t.kind==='edgeDrink')return (s.spring.water>eps||(s.spring.snowWater||0)>eps)&&a<60;
 if(t.kind==='splash')return s.spring.water>=s.spring.capacity*.2&&a<60&&p.energy>=30&&p.burden<40&&!p.wetRecovery;
 if(t.kind==='litterPlay')return (z.O>=.5||p.carriedLeaf?.amount>=.5)&&p.energy>=30&&p.burden<40&&!p.wetRecovery&&a<60&&z.W<=1;
 if(t.kind==='nutrition')return z.U>eps&&a<60&&z.W<=1;
 if(t.kind==='rootDrink')return z.W>eps&&a<60&&p.burden<40&&!p.wetRecovery;
 if(t.object==='shade')return a<60&&!p.wetRecovery&&p.burden<40&&z.W<=.5;
 /* 1.2.4: in rain or wind the crevice is a refuge even when wet (it was refused once rain soaked it, leaving friends out in the storm) */if(t.object==='crevice'&&['safety','shelterRain'].includes(t.reason))return a<50;
 return a<50&&dry(s,t.object);
}
function needs(p){
 const n=p.objectNeeds??{water:false,energy:false,nutrition:false,mood:false};
 // SRS v2.34: drink / feed before leaving the fit band (warning line 5 inside it), up to the middle; 기운 below 40% of the pool
 // rests to 80%. The old mood is folded into 기운, so there is no separate mood need any more.
 const V=dep('vitals').targets(p);n.mood=false;
 for(const [k,v,start,end]of [['water',p.B,V.water.start,V.water.end],['energy',p.energy,V.energy.start,V.energy.end],['nutrition',p.nutrition,V.nutrition.start,V.nutrition.end]]){if(v<start)n[k]=true;if(v>=end-eps)n[k]=false;}
 return n;
}
function urgency(s,p){if(dep('weather-care').wind(s,p)>=60||p.burden>=60)return 0;if(p.B<20||p.energy<20||p.nutrition<20)return 1;return 2;}
// 0.8.3 (user: "케릭들 쉼터에 쉬러 잘 안 가던데" → 밤 잠·비 피하기): at night (from 'night' to 'dawn' of the game day) a friend
// without an urgent need goes to sleep, in the shelter if there is room, otherwise on moss / in leaf shade / by the stones,
// and stays until dawn; while it rains or snows it shelters there until it stops.
function sleepTime(s,p){return dep('vitals').sleepTime(s,p);}   // SRS v2.34 ST34-09: deep night for all, dusk when tired, shade lovers wake first
function rainCover(s,p){const E=dep('environment');return (stormy(s)||E.precipitation(s,'rain')+E.precipitation(s,'snow')>=.6)&&p.species!=='superbum'&&!(p.species==='neolbi'&&canShield(s,p))&&!dep('shelter').inside(s,p);}
/* 1.2.6: heavy rain for a friend whether it is already in cover or not (rainCover is false inside the shelter, so a hungry friend walked out to feed and straight back in) */function heavyRain(s,p){const E=dep('environment');return (stormy(s)||E.precipitation(s,'rain')+E.precipitation(s,'snow')>=.6)&&p.species!=='superbum';}
function coldCall(s,p){const V=dep('vitals');if(!V.isCold(s)||dep('traits').ofPet(p).cold>=0||p.mounted)return false;if(dep('shelter').inside(s,p)||V.restingAt(p,'rock')&&V.rockSun(s)>0)return false;return true;}
// 1.2.1: a friend waits by 엘레판 for its leaf only when that can really happen (both healthy enough for a leaf umbrella,
// 엘레판 outside and not tied up) or the umbrella is already over it; otherwise it takes cover like everyone else
function underLeaf(s,p){if(s.social?.sessions?.some(a=>a.type==='CANOPY'&&a.ids.includes(p.id)))return true;const W=dep('weather-care');if(!W.leafFit(s,p)||gaveUpLeaf(s,p))return false;/* 1.2.3 (user: "봄에 큰비로 … 아무도 안 들어가"): the umbrella holds one friend; once 엘레판 has opened it over someone else the other friends nearby stopped waiting forever in the rain — now only a 엘레판 whose umbrella is still free counts */return s.individuals.some(z=>z.active&&z.species==='neolbi'&&z.id!==p.id&&!z.mounted&&!dep('shelter').inside(s,z)&&!s.social?.sessions?.some(a=>a.ids.includes(z.id))&&!gaveUpLeaf(s,z)&&W.leafFit(s,z)&&s.weather.wind<W.limit(z)&&Math.hypot(z.x-p.x,z.y-p.y)<.3);}
// 엘레판 stays out in the rain only while a friend it could hold its leaf over is close by and outside
/* 1.2.6 (user: "겨울에도 … 큰 비에도 안들어가"): the wait for 엘레판's leaf umbrella could never end — the umbrella only opens for two friends with nothing else to do (and not beside wet moss), but the waiting friends kept what they were doing (엘리시 asleep on the sun rock, 엘레판 asleep on the moss) and stood in the downpour. A friend that has waited 10 s without the umbrella opening gives up on it for 2 minutes and takes cover */function gaveUpLeaf(s,p){return p.leafGiveUp>s.worldTick;}
function canShield(s,h){const W=dep('weather-care');return !gaveUpLeaf(s,h)&&W.leafFit(s,h)&&s.weather.wind<W.limit(h)&&s.individuals.some(z=>z.active&&z.id!==h.id&&!z.mounted&&!dep('shelter').inside(s,z)&&W.leafFit(s,z)&&Math.hypot(z.x-h.x,z.y-h.y)<.35);}
/* 1.2.4 (user: "폭풍치는데 아무도 안 들어가"): a storm is shown as 폭풍 for its whole 110 s, but its first 20 s and last 30 s are only rain .35 · wind 45 — friends read that as drizzle and stayed out. The whole storm now counts as heavy rain */function stormy(s){return !!s.environment?.storm;}
function rainy(s){const E=dep('environment');return stormy(s)||E.precipitation(s,'rain')+E.precipitation(s,'snow')>=.25;}
function goalsDone(s,p,t){const n=needs(p);if(t.complete)return true;if(t.free)return t.remaining<=0;
 if(t.reason==='safety')return dep('weather-care').wind(s,{...p,shelter:{phase:'outside'}})<50&&!p.wetRecovery&&!p.leafRecovery&&p.burden<40&&p.damage<10&&s.weather.wind<50;
 if(t.reason==='sleep')return !sleepTime(s,p);if(t.reason==='shelterRain')return !rainy(s);if(t.reason==='dry')return p.B<=dep('vitals').band(p).mid+2;if(t.reason==='warm')return !dep('vitals').isCold(s);
 if(t.reason==='water')return !n.water;if(t.reason==='nutrition')return !n.nutrition;
 if(t.object==='moss')return !n.energy&&!n.mood;
 return t.reason==='energy'?!n.energy:t.reason==='mood'?!n.mood:false;
}
function points(s,p,id,kind){
 if(id==='shelter'){if(p.restCooldown>s.worldTick)return [];const Sh=dep('shelter');if(Sh.inside(s,p))return [{x:p.x,y:p.y}];/* 1.2.10 (user: "쉼터 찾으러 가다가 쉼터 차 있으면 … 다시 쉴 곳 찾다가 차 있던 쉼터 갔다가 … 무한 뺑뺑이"): friends that had already picked the shelter but were not seated or booked yet were not counted, so at nightfall or in rain everyone picked it, walked to the door, waited 8 s, gave up and came back two minutes later. A full shelter (seats taken, booked or already chosen by others) is now not picked at all, except when the wind is dangerous, where waiting at the door is still the safest */const danger=dep('weather-care').wind(s,p)>=60,pend=danger?[]:s.individuals.filter(q=>q.id!==p.id&&q.active&&!q.mounted&&q.objectTask?.object==='shelter'&&!q.shelter?.facilityId),open=f=>Sh.room(s,f,p)&&(danger||(()=>{const v=Sh.ledger(s,f,p.id);return v.friends+pend.length<v.seats&&v.free-pend.reduce((n,q)=>n+Sh.units(q),0)>=Sh.units(p);})());
  return s.shelters.facilities.filter(open).flatMap(f=>{const q=Sh.seat(s,f,p,q=>!!dep('spatial').route(s,p,Sh.entry(f,q),p.id));return q?[Sh.entry(f,q)]:[];});}
 const r=region(s,id,kind),g=scale(s,id),large=dep('shelter').units(p)>4;
 const offsets=kind==='edgeDrink'?[[0,0]]:large?[[0,0],[-.015,0],[.015,0]]:[[0,0],[-.035,0],[.035,0],[-.065,0],[.065,0],[0,.014],[0,-.014]];
 return offsets.map(([x,y])=>({x:r.x+x*g,y:r.y+y*g}));
}
function option(s,p,id,kind,reason,free=false){
 const Space=dep('spatial'),Sh=dep('shelter');if(!patch(s,id))return {fail:'stored',object:id,kind};   /* 1.2.6: put away in the 보관함 */
 // 0.6.37: the crevice gap holds one friend at a time (its rest spot is a narrow strip right in front of the stones since
 // 0.6.35, and the friend tucks into the gap). A second friend used to get a spot beside the first, was blocked by its
 // body on the way, gave up and chose the crevice again, so it looked frozen "heading to the crevice".
 if(id==='crevice'&&s.individuals.some(z=>z.id!==p.id&&z.active&&z.objectTask?.object==='crevice'))return {fail:'capacity',object:id,kind};if(id!=='shelter'&&used(s,id,p.id)+(kind==='nutrition'?Math.min(Sh.units(p),spaceCapacity(s,id)):Sh.units(p))>spaceCapacity(s,id))return {fail:'capacity',object:id,kind};   /* 1.0: a big friend may eat at compost alone */
 let fail='shape';
 for(const q of points(s,p,id,kind)){
  const t={...q,object:id,kind,reason,free};
  if(!effectsValid(s,p,t)){fail=id==='spring'&&s.spring.water<=eps&&!((s.spring.snowWater||0)>eps)?'empty_water':kind==='litterPlay'&&patch(s,id).O<.5?'no_play_leaves':kind==='nutrition'&&patch(s,id).U<=eps?'no_nutrients':'unsafe_weather';continue;}
  // 1.0: eating compost only needs the friend beside it, so a big friend (grown 슈퍼범) is not shut out of 영양
  if(id!=='shelter'&&kind!=='nutrition'&&!fits(s,p,id,q,kind))continue;
  if(id!=='shelter'&&s.individuals.some(z=>z.id!==p.id&&z.active&&(z.objectTask?.object===id&&Space.distance(z.objectTask,q)<.4*(Space.diameter(p)+Space.diameter(z))||Space.distance(z,q)<.4*(Space.diameter(p)+Space.diameter(z))))){fail='capacity';continue;}
  if(!Space.walkable(s,q,p.id)){fail='blocked_path';continue;}
  const route=Space.route(s,p,q,p.id);if(!route){fail='blocked_path';continue;}
  const seconds=route.reduce((a,z,i)=>a+Space.distance(i?route[i-1]:p,z),0)/Space.gait(p,s).speed;
  const target={water:50,energy:80,nutrition:50,mood:80},key={water:'B',energy:'energy',nutrition:'nutrition',mood:'mood'};
  let score=reason==='safety'?100:100*clamp(((target[reason]||75)-(p[key[reason]]||0))/(target[reason]||75),0,1);
  if(id==='moss'&&needs(p).energy&&needs(p).mood)score+=20*Math.max((75-p.energy)/75,(80-p.mood)/80);
  if(reason==='energy')score+=(rates[id]||0)*8;/* 1.0.1: a friend that feels the cold rests in the warm shelter on a cold day */if(['energy','sleep','warm'].includes(reason)&&dep('traits').ofPet(p).cold<0&&dep('vitals').isCold(s))score+=id==='shelter'?60:id==='rock'&&dep('vitals').rockSun(s)>5?30+dep('vitals').rockSun(s)*.5:0;/* 1.0.2: a sun rock that holds a lot of sun (over 60) is chosen before the shelter */if(!p.objectTask&&p.action==='rest'&&p.target==='shelter'&&id==='shelter'&&reason==='energy')score+=35;if(reason==='safety'&&dry(s,id))score+=20;if(reason==='water')score+=id==='spring'?45:id==='moss'&&dep('traits').ofPet(p).hex.water<=2&&p.B>=dep('vitals').band(p).lo?60:-30;if((reason==='sleep'||reason==='shelterRain')&&id==='shelter')score+=40;if(reason==='dry')score+=id==='rock'&&dep('vitals').rockSun(s)>5?60:id==='shelter'?40:20;
  if(free)score=30+(id==='moss'?(p.personality.c||0)*3:kindOf(id)==='litter'?(p.personality.a||0)*3:0);
  score-=seconds*2+(p.lastObject?.object===id&&s.worldTick-p.lastObject.tick<60?20:0);
  return {...t,score,travelSeconds:seconds};
 }
 return {object:id,kind,fail};
}
// Piles with something to use come first (nearest to the old spot order is by id for determinism); the old litter spot stays usable.
// Only the two nearest usable piles are routed (routing every pile each choice is costly); the old spot stays a fallback.
function litterSpots(s,key,p){const ps=dep('litter').piles(s).filter(z=>key==='O'?z.O>=.5:z.U>eps).sort((a,b)=>(p?Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y):0)||a.id.localeCompare(b.id)).slice(0,2).map(z=>z.id);return [...ps,'litter'];}
// 0.8.5 빈 땅 산책 (user: "1번 ㄱㄱ"): a free friend sometimes walks out to the open ground of the wide forest (0.7.0 ring
// outside the old garden), lingers there for a while and then chooses again. It only happens on a free choice (no need,
// not night, not rain), keeps no object or resource, and any need, night, rain or danger ends it.
const STROLL=Object.freeze({reach:.9,chance:.4,min:.25,linger:10,lingerSpread:9,deadline:90});
function strollTarget(s,p,rng){const W=dep('world'),Space=dep('spatial'),b=W.walk(s),G=W.GARDEN;
 // 0.9.0: while the lake shore waits to be found, about a third of the walks head for the forest's east edge
 if(W.lakeReady?.(s)&&rng(s,'behavior')<.35){for(let i=0;i<6;i++){const q={x:W.LAKE.east+(b.x1-W.LAKE.east)*rng(s,'behavior'),y:b.y0+(b.y1-b.y0)*rng(s,'behavior')};if(Math.hypot(q.x-p.x,q.y-p.y)>=STROLL.min&&Space.walkable(s,q,p.id))return q;}}
 // 1.0.1 물가 시원함: on a summer day half of the walks go to cool off by the open lake (only when it is reachable)
 {const V=dep('vitals'),E=dep('environment');if(V.isDay(s)&&E.season(s)==='summer'&&W.shorePoint&&rng(s,'behavior')<.5){const q0=W.shorePoint(s,p);if(q0)for(let i=0;i<6;i++){const q={x:q0.x-.06+.12*rng(s,'behavior'),y:q0.y-.06+.12*rng(s,'behavior')};if(!W.inWater(s,q)&&Math.hypot(q.x-p.x,q.y-p.y)>=STROLL.min&&Space.walkable(s,q,p.id))return {...q,cool:true};}}}
 // 0.9.3 겨울 얼음 놀이: when the lake is frozen, some walks go out onto the ice
 if(W.frozen?.(s)&&rng(s,'behavior')<.3){for(let i=0;i<6;i++){const q={x:1.3+(b.x1-1.3)*rng(s,'behavior'),y:b.y0+(b.y1-b.y0)*rng(s,'behavior')};if(W.onIce(s,q)&&Math.hypot(q.x-p.x,q.y-p.y)>=STROLL.min&&Space.walkable(s,q,p.id))return q;}}
 // 1.0.1: a walk ends within 0.9 of where the friend is. Since the shore was widened (0.9.5) a walk could pick a spot at
 // the far east end of the lake, far from every object, and each later choice then searched very long paths.
 const R=STROLL.reach,X0=Math.max(b.x0,p.x-R),X1=Math.min(b.x1,p.x+R),Y0=Math.max(b.y0,p.y-R),Y1=Math.min(b.y1,p.y+R);
 for(let i=0;i<8;i++){const q={x:X0+(X1-X0)*rng(s,'behavior'),y:Y0+(Y1-Y0)*rng(s,'behavior')};const outer=q.x<G.x0+.05||q.x>G.x1-.05||q.y<G.y0+.05||q.y>G.y1-.05;
  if(i<6&&!outer||Math.hypot(q.x-p.x,q.y-p.y)<STROLL.min)continue;if(Space.walkable(s,q,p.id))return q;}return null;}
// 0.8.7 산책 동작 (user: "산책할 때 가벼운 모션들 먼저"): while it lingers at the walk's end the friend looks around (turning
// this way and that), bends to smell the grass, sits down for a little while and gets up again before walking on. Pure
// function of the stroll record and the clock: the scene draws it and the card text follows it; no state or RNG changes.
function strollPose(s,p,t=s.worldTick){const r=p.stroll;if(!r||r.arrivedAt==null||p.objectTask||r.lake)return null;const e=t-r.arrivedAt,L=r.linger,sit=Math.max(7,L-7);
 if(e<0||e>=L-1)return {pose:'idle'};if(e<4)return {pose:'look',face:Math.floor(e/1.3)%2?1:-1};if(e<6.5)return {pose:'sniff'};if(e>=sit)return {pose:'sit'};
 return {pose:'look',face:Math.floor(e/1.8)%2?-1:1};}
function stroll(s,p){const t=p.stroll;if(!t)return null;if(p.objectTask||!p.active||p.mounted){delete p.stroll;return null;}
 if(t.arrivedAt==null){const m=dep('spatial').travel(s,p,t);if(m.distance>0)t.stalled=0;else if(!m.arrived)t.stalled=(t.stalled||0)+1;
  if(m.arrived)t.arrivedAt=s.worldTick;else if(t.stalled>=3||s.worldTick>t.deadline){delete p.stroll;p.nextObjectChoice=s.worldTick;}return m;}
 if(t.lake==='drink'){const W=dep('world');if(!W.lakeOpen(s)||W.frozen(s)){delete p.stroll;p.nextObjectChoice=s.worldTick;return null;}const n=Math.max(0,Math.min(LAKE_DRINK.rate,LAKE_DRINK.target-p.B));p.B+=n;s.ledger.lake=(s.ledger.lake||0)+n;
  if(p.B>=LAKE_DRINK.target-eps||s.worldTick-t.arrivedAt>=LAKE_DRINK.most){delete p.stroll;p.objectNeeds??=needs(p);p.objectNeeds.water=false;p.justDrank=p.B>=LAKE_DRINK.target-eps;p.drinkCycle=false;p.nextObjectChoice=s.worldTick;}return {kind:n>0?'drink':'idle',water:n,distance:0};}
 if(t.puddle){const d=dep('skills').puddles(s).find(x=>x.id===t.puddle),n=d?Math.max(0,Math.min(LAKE_DRINK.rate,LAKE_DRINK.target-p.B,d.W)):0;if(d){d.W-=n;p.B+=n;}
  if(!d||d.W<=eps||p.B>=LAKE_DRINK.target-eps||s.worldTick-t.arrivedAt>=LAKE_DRINK.most){delete p.stroll;if(p.guideTo?.id===t.puddle)delete p.guideTo;p.objectNeeds??=needs(p);p.objectNeeds.water=p.B<LAKE_DRINK.target-eps;p.justDrank=p.B>=LAKE_DRINK.target-eps;p.drinkCycle=false;p.nextObjectChoice=s.worldTick;}return {kind:n>0?'drink':'idle',water:n,distance:0};}
 if(s.worldTick-t.arrivedAt>=t.linger){delete p.stroll;p.nextObjectChoice=s.worldTick;}return null;}
// 0.9.4 물가에서 물 마시기 (SRS v2.33 LK-07): once the shore is open (not frozen), a thirsty friend walks to the water's edge
// to drink when it is nearer than the spring or the spring is nearly empty. The lake never runs dry; what a friend drinks
// is recorded as lake inflow (ledger.lake) so the water balance still closes. Uses the walk record (p.stroll.lake).
const LAKE_DRINK=Object.freeze({rate:10/60,target:50,deadline:120,linger:60,most:420});   // same pace as the spring (10 a minute), at most 7 minutes at the water
// 1.0: a lake walk is only kept while it can still happen; a friend inside the shelter (whose move runs first) does not start one
function lakeDrink(s,p,current,forced=false){if(p.stroll?.lake&&(p.stroll.arrivedAt!=null||s.worldTick<=p.stroll.deadline))return true;if(p.stroll?.lake)delete p.stroll;/* 1.2.9 (user: "리들리는 영양이랑 수분이 적정치 아래인데 자고 있더라"): a friend in the shelter never went to the lake, so with the spring dry it stayed thirsty all night and on into the morning. A friend really thirsty (under its band) with no water in the spring now walks out to the lake; otherwise the shelter still holds it */if(p.shelter?.phase&&p.shelter.phase!=='outside'&&!(p.shelter.phase==='restingInside'&&p.B<dep('vitals').band(p).lo&&s.spring.water<2))return false;const W=dep('world'),Space=dep('spatial'),q=W.shorePoint?.(s,p);if(!q||!Space.walkable(s,q,p.id))return false;
 const sp=s.spring,dl=Math.hypot(q.x-p.x,q.y-p.y),ds=Math.hypot(sp.x-p.x,sp.y-p.y);if(!forced&&!(sp.water<2||dl<ds*.8))return false;
 if(current)release(s,p,'replace');delete p.objectWait;p.stroll={x:q.x,y:q.y,since:s.worldTick,deadline:s.worldTick+LAKE_DRINK.deadline,linger:LAKE_DRINK.linger,lake:'drink'};p.action='drink';p.target=null;p.nextObjectChoice=s.worldTick+5;return true;}
// SRS v2.36 SK-03: drink from a puddle 베이치 dug up (same pace as the spring, up to 50) when it was shown to this friend,
// or is nearer than the spring (0.8 of its distance), or the spring is nearly empty. Uses the walk record (p.stroll.puddle).
function puddleDrink(s,p,current,forced){if(p.stroll?.puddle&&(p.stroll.arrivedAt!=null||s.worldTick<=p.stroll.deadline))return true;if(p.stroll?.puddle)delete p.stroll;if(p.shelter?.phase&&p.shelter.phase!=='outside')return false;
 const Space=dep('spatial'),list=dep('skills').puddles(s).filter(d=>d.W>=.5&&(!forced||d.id===forced)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)||a.id.localeCompare(b.id)),d=list[0];if(!d)return false;
 const sp=s.spring,dd=Math.hypot(d.x-p.x,d.y-p.y),ds=Math.hypot(sp.x-p.x,sp.y-p.y);if(!forced&&!(sp.water<2||dd<ds*.8))return false;if(!Space.route(s,p,d))return false;
 if(current)release(s,p,'replace');delete p.objectWait;p.stroll={x:d.x,y:d.y,since:s.worldTick,deadline:s.worldTick+LAKE_DRINK.deadline,linger:LAKE_DRINK.linger,puddle:d.id};p.action='drink';p.target=null;p.nextObjectChoice=s.worldTick+5;return true;}
function ambleSpot(s,p,rng){const Space=dep('spatial');for(let k=0;k<6;k++){const a=rng(s,'behavior')*6.283,r=.06+rng(s,'behavior')*.08,q={x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r*.7};if(Space.walkable(s,q,p.id))return q;}return null;}
// 1.0.2: a started task is held at most 5 minutes; after that the friend chooses again (a feed that cannot reach its
// target, e.g. while mealybugs drain 영양 faster than it eats, must not block grooming forever)
const HOLD=300;
function choose(s,p,rng){
 if(!p.active||p.mounted)return;
 const W=dep('weather-care'),Sh=dep('shelter'),n=needs(p);p.objectNeeds=n;
 // 1.0: a walk that has run past its deadline before arriving always ends (it may have been held up by another move)
 if(p.stroll&&p.stroll.arrivedAt==null&&s.worldTick>p.stroll.deadline+5){delete p.stroll;if(p.action==='drink')p.action='wander';}
 // 1.2.4: a friend sheltering from strong wind (safety) also gives up a full shelter after 8 s and takes the crevice, rock or shade instead of standing in the storm.
 // 0.8.3: a friend waiting outside a full shelter (seats taken while it walked there) gives it up after 8 s and rests
 // elsewhere instead of waiting all night (sleep, rain, a free visit); a tired friend or one sheltering from a storm keeps waiting.
 {const c=p.objectTask;if(c&&c.object==='shelter'&&['sleep','shelterRain','free','warm','safety'].includes(c.reason)&&p.shelter?.phase==='waitingOutside'&&['crowd','capacity'].includes(p.shelter.waitReason)){c.fullWait=(c.fullWait||0)+1;if(c.fullWait>=8){release(s,p,'full');p.restCooldown=s.worldTick+120;p.nextObjectChoice=0;}}}
 const current=p.objectTask,danger=(Sh.inside(s,p)?s.weather.wind:W.wind(s,p))>=60||p.burden>=40||p.wetRecovery||((p.leafRecovery||p.damage>=10)&&p.B>=40&&p.nutrition>=40);
 const grade=urgency(s,p),valid=current&&effectsValid(s,p,current)&&!goalsDone(s,p,current);
 const emergencyChange=current&&grade<(current.grade??2);
 if(valid&&!emergencyChange&&s.worldTick<(p.nextObjectChoice||0))return;
 // 1.0.1: finish what was started. Without this a friend whose 수분 and 영양 sit right on the band edge flipped between
 // drinking, feeding and resting every 5 seconds and finished none of them. A drink or feed runs until its target; a rest
 // gives way only when 수분 or 영양 falls 3 below the band (danger and a sharper urgency still interrupt).
 /* 1.2.1: heavy rain or a hard cold ends a drink/feed/rest hold, so the friend can take cover */const weatherCall=rainCover(s,p)||coldCall(s,p);
 if(valid&&!emergencyChange&&!danger&&!weatherCall&&s.worldTick-(current.since??s.worldTick)<HOLD){const lo=dep('vitals').band(p).lo;if(['water','nutrition'].includes(current.reason)||current.reason==='energy'&&p.B>=lo-3&&p.nutrition>=lo-3){p.nextObjectChoice=s.worldTick+5;return;}}
 if(valid&&!emergencyChange&&current.reason==='safety'&&danger){p.nextObjectChoice=s.worldTick+5;return;}
 if(!current&&!danger&&!Object.values(n).some(Boolean)&&p.action==='groom'&&p.actionSeconds>0)return;
 if(!current&&s.worldTick<(p.nextObjectChoice||0)&&!danger&&grade>1)return;
 const definitions=[];const add=(id,k,r,free=false)=>definitions.push([id,k,r,free]);
 // 1.2.1 (user: "폭풍인데도 … 비가 많이 와도 아무도 쉼터로 들어가질 않음"): a thirsty friend went to drink before it took cover,
 // and with the spring busy it just wandered in the downpour. Rain on the body is water, so while it rains (outside, 수분 not
 // critical) the friend skips the drink trip and the rain/cold branches below decide where it goes.
 const rainWaters=dep('environment').precipitation(s,'rain')>=.25&&p.B>=20;
 // 1.2.1: with nothing to drink (empty spring, no snow, dry moss) a thirsty friend no longer stands in the open waiting — it
 // falls through to cover/warmth/rest and comes back when water arrives
 const canDrink=s.spring.water>=1||(s.spring.snowWater||0)>.01||(patch(s,'moss')?.S||0)>=1||(patch(s,'crevice')?.W||0)>0;
 // 0.6.28 plant side of the small-neighbour ecology: a friend with pests on its leaves tidies them more and seeks shade or
 // water (moist leaves slow spider mites), and avoids playing in litter where root-fly larvae live (it still feeds there
 // when nothing else has nutrient). Same RNG draws as before, so choices stay deterministic.
 const P=s.objects?.creatures?dep('creatures').pressure(s,p):{leaf:false,mite:false,gnatSites:[]},clean=ids=>ids.filter(id=>!P.gnatSites.includes(id)),lastInfested=ids=>[...ids.filter(id=>!P.gnatSites.includes(id)),...ids.filter(id=>P.gnatSites.includes(id))];
 if(danger){for(const id of ['shelter','rock','crevice'])add(id,'rest','safety');}
 // SRS v2.36 SK-03: a friend 베이치 showed water to goes only there (no wasted walk to an empty spring)
 else if(n.water&&!rainWaters&&p.guideTo&&p.guideTo.until>s.worldTick&&(p.guideTo.kind==='puddle'?puddleDrink(s,p,current,p.guideTo.id):p.guideTo.kind==='lake'?lakeDrink(s,p,current,true):false))return;
 else if(n.water&&!rainWaters&&p.guideTo&&p.guideTo.until>s.worldTick&&['crevice','spring'].includes(p.guideTo.kind)){if(p.guideTo.kind==='crevice'&&(patch(s,'crevice')?.W||0)>0)add('crevice','rootDrink','water');else if(s.spring.water>=1){add('spring','drink','water');add('spring','edgeDrink','water');}}
 else if(n.water&&!rainWaters&&(p.B<dep('vitals').band(p).lo||!n.energy&&!n.nutrition||p.B/50<=Math.min(p.energy/80,p.nutrition/50))&&puddleDrink(s,p,current,null))return;
 else if(n.water&&!rainWaters&&(p.B<dep('vitals').band(p).lo||!n.energy&&!n.nutrition||p.B/50<=Math.min(p.energy/80,p.nutrition/50))&&lakeDrink(s,p,current))return;
 else if(n.water&&!rainWaters&&canDrink&&(p.B<dep('vitals').band(p).lo||!n.energy&&!n.nutrition||p.B/50<=Math.min(p.energy/80,p.nutrition/50))){add('spring',p.wetRecovery||p.burden>=40||s.spring.water<s.spring.capacity*.2?'edgeDrink':'drink','water');add('spring','edgeDrink','water');if(p.B>=20&&(patch(s,'moss')?.S||0)>=1&&p.Q<12)add('moss','moss','water');if(p.B>=20&&(patch(s,'crevice')?.W||0)>0)add('crevice','rootDrink','water');}
 // SRS v2.34 생존 우선: once 수분 or 영양 is in its bad band it is fixed before resting (a low 기운 caused by hunger must not
 // keep a friend resting while it starves)
 /* 1.2.6: in heavy rain or a storm the compost spots are closed (unsafe_weather), so a hungry friend wandered in the downpour looking for them; it takes cover first unless 영양 is critical */else if(n.nutrition&&!(heavyRain(s,p)&&p.nutrition>=20)&&(p.nutrition<dep('vitals').band(p).lo||!n.energy||p.nutrition/50<p.energy/80)){for(const id of lastInfested(litterSpots(s,'U',p)))add(id,'nutrition','nutrition');}
 // SRS v2.34 선제 행동: a friend dries off when over-wet (sun rock while it holds sun, shelter, crevice); in rain it
 // shelters before 수분 would pass its warning line within a minute (rain lovers wait until the top of the band)
 else if(!rainy(s)&&p.B>dep('vitals').band(p).hi&&!sleepTime(s,p)){for(const id of ['rock','shelter','crevice'])add(id,'rest','dry');}
 else if(sleepTime(s,p)||rainy(s)&&!(p.species==='neolbi'&&canShield(s,p))&&(()=>{const E=dep('environment'),pr=E.precipitation(s,'rain')+E.precipitation(s,'snow'),tr=dep('traits').ofPet(p),b=dep('vitals').band(p),line=tr.rain>0?b.hi:b.warnHi;return (pr>=.6||stormy(s))&&p.species!=='superbum'||p.B+6*E.precipitation(s,'rain')*tr.wet>=line;})()&&!underLeaf(s,p)){   /* rain: 엘레판 and the friends near it keep sheltering under its leaf */const r=sleepTime(s,p)?'sleep':'shelterRain';for(const id of (r==='sleep'?['shelter','moss','shade','crevice','rock']:['shelter','shade','crevice','rock']))add(id,id==='moss'?'moss':'rest',r);}
 // 1.2.1 (user: "날씨 추운 한겨울에도 아무도 쉼터로 들어가질 않음"): a friend that feels the cold used to wait until its 기운 ran low;
 // now on a cold day it goes to warm up first — the shelter, or the sun rock while it still holds sun
 // 1.2.1: in the rain a friend beside 엘레판 (and 엘레판 itself) waits where it is for the leaf umbrella instead of wandering off
 // on a free visit — the umbrella starts only while both stay close and free
 else if(rainy(s)&&(underLeaf(s,p)||p.species==='neolbi'&&canShield(s,p))){if(s.social?.sessions?.some(a=>a.type==='CANOPY'&&a.ids.includes(p.id))){p.nextObjectChoice=s.worldTick+5;return;}   /* 1.2.6: wait with nothing else to do (so the umbrella can open), and for 10 s at most */if(current)release(s,p,'complete');if(!(p.leafWait&&s.worldTick-p.leafWait.last<=6))p.leafWait={since:s.worldTick,last:s.worldTick};p.leafWait.last=s.worldTick;if(s.worldTick-p.leafWait.since>=10){delete p.leafWait;p.leafGiveUp=s.worldTick+120;p.nextObjectChoice=0;return choose(s,p,rng);}p.nextObjectChoice=s.worldTick+2;return;}
 else if(coldCall(s,p)){add('shelter','rest','warm');if(dep('vitals').rockSun(s)>5)add('rock','rest','warm');}
 else if(n.energy){for(const id of ['shelter','moss','shade','rock','crevice'])add(id,id==='moss'?'moss':'rest','energy');}
 else if(n.mood){add('moss','moss','mood');for(const id of clean(litterSpots(s,'O',p)))add(id,'litterPlay','mood');add('spring','splash','mood');}
 else if(!current&&p.action==='rest'&&p.target==='shelter'){add('shelter','rest','free',true);}
 else {
  // Free visits preserve species expression without competing with actual needs.
  if(p.stroll&&!current){p.nextObjectChoice=s.worldTick+5;return;}
  const roll=rng(s,'behavior'),groomUp=P.leaf?.55:.25;const doneFree=!current||current.free&&!valid;if(roll<groomUp&&doneFree){if(current)release(s,p,'complete');p.action='groom';p.target=null;p.actionSeconds=8;p.nextObjectChoice=s.worldTick+8;return;}
  if(doneFree&&!P.mite&&roll>=groomUp&&roll<groomUp+STROLL.chance){const q=strollTarget(s,p,rng);if(q){if(current)release(s,p,'complete');delete p.objectWait;p.stroll={x:q.x,y:q.y,...(q.cool?{cool:true}:{}),since:s.worldTick,deadline:s.worldTick+STROLL.deadline,linger:STROLL.linger+Math.floor(rng(s,'behavior')*STROLL.lingerSpread)};p.action='wander';p.target=null;p.nextObjectChoice=s.worldTick+5;return;}}
  const play=clean(litterSpots(s,'O',p))[0],free=[['moss','moss'],...(play?[[play,'litterPlay']]:[]),['spring','splash'],['shade','rest'],['rock','rest'],['crevice','rest'],...(Math.floor(roll*1000)%2?[]:[['shelter','rest']])];if(P.mite){free.unshift(['shade','rest'],['spring','splash']);}const first=P.mite?0:Math.floor(roll*free.length)%free.length;
  for(let j=0;j<free.length;j++){const [id,k]=free[(j+first)%free.length];add(id,k,'free',true);}
 }
 const options=[];for(const d of definitions){const o=option(s,p,...d);options.push(o);if(d[3]&&!o.fail)break;}p.objectDebug=options.map(o=>({object:o.object,kind:o.kind,...(o.score!=null?{score:o.score}:{}),reason:o.fail||'eligible'}));
 const candidates=options.filter(o=>!o.fail);if(!definitions[0]?.[3])candidates.sort((a,b)=>b.score-a.score||a.object.localeCompare(b.object));
 let next=candidates[0];
 if(valid&&!emergencyChange&&next&&current.reason===next.reason&&((s.worldTick-current.since<3)||next.score<(current.score??-1e3)+15))next=null;
 if(!next&&valid&&!emergencyChange){p.nextObjectChoice=s.worldTick+5;return;}
 if(next){if(current?.object===next.object&&current.kind===next.kind&&valid){current.score=next.score;if(current.reason!==next.reason){current.reason=next.reason;current.free=next.free;current.grade=grade;}   /* 0.8.5: already at the same spot for another reason (a free visit to the shelter when the heavy rain starts) keeps the spot but takes the new reason */p.nextObjectChoice=s.worldTick+5;return;}
  delete p.stroll;const debug=p.objectDebug;release(s,p,'replace');p.objectDebug=debug;const serial=s.objects.nextSession++;
  p.objectTask={...next,serial,since:s.worldTick,grade,remaining:12+Math.floor(rng(s,'behavior')*(next.kind==='splash'?8:12)),stalled:0,deadline:s.worldTick+Math.max(10,Math.min(240,Math.ceil(next.travelSeconds)+10))};   /* 1.1.1: no 30 s cap — from the far lakeshore the walk home takes 60~90 s, and the old cap made friends give up halfway and sleep out in the open */p.nextObjectChoice=s.worldTick+5;
  p.action=['drink','edgeDrink','rootDrink'].includes(next.kind)?'drink':next.kind==='rest'||next.kind==='moss'?'rest':next.kind==='nutrition'?'feed':'play';p.target=next.object;p.drinkCycle=next.reason==='water';
 }else {
  delete p.stroll;const debug=p.objectDebug;release(s,p,'replace');p.objectDebug=debug;p.objectWait={reason:options[0]?.fail||'no_resource',object:definitions[0]?.[0]||null,since:current?.since??s.worldTick};p.action='wander';p.target=null;p.actionSeconds=5;p.nextObjectChoice=s.worldTick+5;
  // 0.9.5 (user: "케릭터들 웰케 정적으로 멈춰만 있냐"): instead of standing still until a spot frees up, a friend with
  // nowhere to sleep sleeps where it stands, and one waiting for a spot (spring busy or empty, shelter full) ambles nearby.
  {const why=definitions[0]?.[2];if(danger&&s.weather.wind>=60&&!p.burden&&!p.wetRecovery){p.braceHere=true;p.objectWait.reason='brace_here';p.action='rest';p.nextObjectChoice=s.worldTick+10;}else if((why==='sleep'||why==='shelterRain')&&!danger){p.sleepHere=true;p.objectWait.reason='sleep_here';p.action='rest';p.nextObjectChoice=s.worldTick+20;}
   else if(!danger){const q=ambleSpot(s,p,rng);if(q){p.stroll={x:q.x,y:q.y,since:s.worldTick,deadline:s.worldTick+30,linger:4+Math.floor(rng(s,'behavior')*5),amble:true};}}}

 }
}
function prepare(s,held,rng){
 for(const p of [...s.individuals].sort((a,b)=>urgency(s,a)-urgency(s,b)||(a.objectWait?.since??s.worldTick)-(b.objectWait?.since??s.worldTick)||a.id.localeCompare(b.id))){
  if(!p.active||p.mounted||held===p.id){release(s,p,'interrupt');continue;}
  if(s.social.sessions.some(a=>a.ids.includes(p.id)))continue;
  choose(s,p,rng);
 }
}
function at(s,p){const t=p.objectTask;if(!t)return false;if(t.object==='shelter')return dep('shelter').inside(s,p);return dep('spatial').distance(p,t)<.001&&fits(s,p,t.object,p,t.kind)&&effectsValid(s,p,t);}
function move(s,p){
 const t=p.objectTask;if(!t)return null;const Space=dep('spatial');if(t.object==='shelter')return null;
 const m=Space.travel(s,p,t);if(m.distance>0)t.stalled=0;else if(!m.arrived)t.stalled++;
 if(!m.arrived&&(t.stalled>=3||s.worldTick>t.deadline)){t.replans=(t.replans||0)+1;t.stalled=0;t.deadline=s.worldTick+15;if(t.replans>1){release(s,p,'blocked');p.objectWait={reason:'blocked_path',object:t.object,since:t.since};p.nextObjectChoice=s.worldTick+5;}}
 // 0.6.37: a friend that reaches its spot while the spot has become unusable (the crevice turned wet or windy, the spring
 // ran dry, ...) used to count as arrived, so the stuck timeout above never fired and it stood there for good, still
 // "heading to" the object. After 5 s it now lets the task go and waits with the real reason, then chooses again.
 if(m.arrived&&p.objectTask===t&&!at(s,p)){t.unfit=(t.unfit||0)+1;if(t.unfit>=5){const why=!effectsValid(s,p,t)?(t.object==='spring'&&s.spring.water<=eps?'empty_water':'unsafe_weather'):'shape';release(s,p,'blocked');p.objectWait={reason:why,object:t.object,since:t.since};p.nextObjectChoice=s.worldTick+5;}}
 else if(t.unfit)t.unfit=0;
 return m;
}
function grant(requests){
 const groups=new Map();for(const r of requests)if(r.amount>0){const key=r.sourceId;const g=groups.get(key)||[];g.push(r);groups.set(key,g);}
 for(const group of groups.values()){
  const available=Math.max(0,group[0].source[group[0].key]),total=group.reduce((v,r)=>v+r.amount,0),factor=Math.min(1,available/total);let used=0;
  for(const r of group){const n=Math.min(r.amount*factor,Math.max(0,available-used));used+=n;r.apply(n);}
  group[0].source[group[0].key]=Math.max(0,available-used);
 }
}
function receive(s,p,requests){
 const t=p.objectTask;if(!t||!at(s,p))return false;
 const z=patch(s,t.object),Sh=dep('shelter');t.arrived=true;p.objectArrived=true;
 const add=(source,key,amount,apply)=>requests.push({sourceId:(source===s.spring?'spring':source.id)+':'+key,source,key,amount:Math.max(0,amount),apply});
 const recover=(key,rate,max)=>{if(p[key]<max)p[key]=Math.min(max,p[key]+rate/60);};
 if(t.kind==='moss'){recover('energy',2,80);p.motion.kind='moss';}
 else if(t.kind==='rest'){recover('energy',(rates[t.object]||1)+(t.object==='shelter'&&dep('vitals').isCold(s)?2:0),80);/* 1.0.1: the warm shelter restores faster on a cold day */p.motion.kind='rest';}
 else if(t.kind==='drink'||t.kind==='edgeDrink'){
  // root water can lift 수분 past the target between ticks: finish the drink then too
  if(p.B>=50-eps){t.complete=true;p.drinkCycle=false;(p.objectNeeds??=needs(p)).water=false;p.justDrank=true;}
  // 1.0.1 눈 먹기: when the spring is empty but snow lies on it (too cold to melt), the friend eats the snow instead
  else add(s.spring,s.spring.water<=eps&&(s.spring.snowWater||0)>eps?'snowWater':'water',Math.min(10/60,50-p.B),n=>{p.B+=n;p.motion.water=n;p.motion.kind=n>0?'drink':'idle';if(p.B>=50-eps){t.complete=true;p.drinkCycle=false;p.objectNeeds.water=false;p.justDrank=true;}});
 }else if(t.kind==='splash'){
  recover('mood',2,80);p.energy=clamp(p.energy-1/60);p.motion.kind='splash';
  add(s.spring,'water',Math.min(6/60,50-p.B),n=>{p.B+=n;p.motion.water=n;if(n>0&&p.B>=50-eps){p.objectNeeds??=needs(p);p.objectNeeds.water=false;if(!t.hydrationComplete){t.hydrationComplete=true;p.justDrank=true;}}});
 }
 else if(t.kind==='litterPlay'){
  if(!p.carriedLeaf&&z.O>=.5){z.O-=.5;p.carriedLeaf={amount:.5,pile:t.object,key:'leaf:'+p.id+':'+t.serial};p.objectContact={id:p.carriedLeaf.key+':pick',cue:'pickup',tick:s.worldTick};}
  if(p.carriedLeaf){recover('mood',3,80);p.energy=clamp(p.energy-1/60);p.motion.kind='litter';if(isPile(t.object))z.playBoostUntil=s.worldTick+120;else s.objects.playBoostUntil=s.worldTick+120;}
 }else if(t.kind==='nutrition'){
  add(z,'U',Math.min(1/60*dep('traits').ofPet(p).nutr,50-p.nutrition),n=>{p.nutrition+=n;s.objects.ledger.absorbed+=n;if(p.nutrition>=50-eps){t.complete=true;p.objectNeeds.nutrition=false;}});p.motion.kind='groom';
 }else if(t.kind==='rootDrink')p.motion.kind='drink';
 // ELL-SPC-03: Ellisii (legacy key 'bonbon') no longer stores spring water in V; water sharing (A04) is retired. Existing V is preserved.
 if(t.free||t.kind==='splash'){t.remaining--;if(t.remaining<=0)t.complete=true;}
 const meta=s.objects.upgrades[kindOf(t.object)];if(meta&&meta.lastUsedTick!==s.worldTick){meta.useSeconds++;meta.stageUseSeconds++;meta.lastUsedTick=s.worldTick;}
 return ['moss','rest'].includes(t.kind);
}
function rootRequests(s,p,requests){
 const z=groundAt(s,p),t=p.objectTask;if(!z||p.mounted||p.motion.distance>0||p.motion.kind==='held'||dep('shelter').inside(s,p))return;
 // SRS v2.34: moss is like sphagnum, it holds water and gives it slowly to a friend resting on it (+3/min up to 55, never
 // into over-wet); a friend weak to water prefers it to the spring
 let amount=0,body=false;if(z.id==='moss'){if(t?.object==='moss'&&at(s,p)&&z.S>0&&p.B<55){amount=Math.min(3/60,55-p.B);body=true;}else if(z.S>=z.cap*.2&&p.B<45&&p.Q<12)amount=Math.min(.5/60,12-p.Q);}
 else if(t?.kind==='rootDrink'&&at(s,p))amount=Math.min(1/60,20-p.Q);
 else if(moist(z)>=60)amount=Math.min(4/60,20-p.Q);
 if(amount>0){const key=t?.kind==='rootDrink'?'W':z.W>0?'W':'S';requests.push({sourceId:z.id+':'+key,source:z,key,amount,apply:n=>{if(body){p.B+=n;p.motion.water=n;if(t?.reason==='water'&&p.B>=50-eps){t.complete=true;(p.objectNeeds??=needs(p)).water=false;if(s.environment)s.environment.tutorialDone=true;}}else p.Q+=n;}});}
}
function upgradeStatus(s,id){const m=s.objects.upgrades[id];if(!m)return null;return {...m,capacity:capacity(s,id),nextCapacity:capacities[id][m.level],requiredSeconds:m.level===1?180:360,ready:m.level<3&&m.unlocked>m.level};}
function progress(s){
 for(const id of ['spring','litter','moss']){const m=s.objects.upgrades[id],z=patch(s,id);let pressure=false;
  if(id==='spring')pressure=s.spring.water<=s.spring.capacity*.1&&s.individuals.some(p=>p.active&&p.B<35);
  if(id==='litter')pressure=dep('litter').floor(s)>=dep('litter').LCAP*.9&&s.objects.arrivedToday<s.objects.dayQuota;
  if(id==='moss')pressure=s.individuals.some(p=>p.objectWait?.object==='moss'&&p.objectWait.reason==='capacity');
  m.pressureSeconds=pressure?Math.min(10,m.pressureSeconds+1):0;if(m.pressureSeconds>=10)m.pressureEvidence=true;
  if(m.level<3&&m.stageUseSeconds>=(m.level===1?180:360)&&m.pressureEvidence)m.unlocked=Math.max(m.unlocked,m.level+1);
 }
}
function planUpgrade(s,id){
 const meta=upgradeStatus(s,id);if(!meta?.ready)throw Error('실제로 이용하고 공간·잔량 부족을 겪으면 확장할 수 있어요.');
 if(s.individuals.some(p=>p.active&&p.objectTask?.object===id))throw Error('친구들이 이용을 마친 뒤 넓힐 수 있어요.');
 const next=JSON.parse(JSON.stringify(s));next.objects.upgrades[id].level++;init(next);
 const r=region(next,id),Space=dep('spatial');{const wb=World.walk(next);if(r.x-r.rx<wb.x0||r.x+r.rx>wb.x1||r.y-r.ry<wb.y0||r.y+r.ry>wb.y1)throw Error('넓어질 공간을 숲 안에 확보해 주세요.');}
 for(const z of [...next.patches.filter(z=>z.id!==id&&z.id!=='shelter'),...(id==='spring'?[]:[next.spring])])if(Math.hypot((z.x-r.x)/(r.rx+.055),(z.y-r.y)/(r.ry+.035))<1)throw Error('주변 오브젝트를 옮겨 넓어질 공간을 비워주세요.');
 for(const p of next.individuals.filter(p=>p.active))if(fits(next,p,id,p,'rest'))throw Error('친구가 있는 자리를 비워주세요.');
 for(const f of next.shelters.facilities)if(!Space.route(next,dep('shelter').entry(f),Space.socket(next,'spring')))throw Error('샘터와 쉼터를 잇는 길을 비워주세요.');
 return next;
}
function upgrade(s,id){planUpgrade(s,id);const m=s.objects.upgrades[id];m.level++;m.stageUseSeconds=0;m.pressureSeconds=0;m.pressureEvidence=false;init(s);s.layoutRevision++;}
function reason(s,p){
 const t=p.objectTask,w=p.objectWait;
 if(p.stroll?.lake&&!t)return p.stroll.arrivedAt==null?'목이 말라 호수 물가로 가고 있어요':'호수 물가에서 물을 마시고 있어요';
 if(p.stroll?.amble&&!t)return w?.reason==='empty_water'?'샘터에 물이 모이길 기다리며 주변을 거닐고 있어요':w?.object==='spring'?'샘터 자리가 나길 기다리며 주변을 거닐고 있어요':'자리가 나길 기다리며 주변을 거닐고 있어요';
 if(p.stroll&&!t){if(p.stroll.cool)return p.stroll.arrivedAt==null?'더위를 식히러 물가로 가고 있어요':'물가에서 더위를 식히고 있어요';if(p.stroll.arrivedAt==null)return '숲 가장자리로 산책 가고 있어요';if(p.stroll.scent)return '동쪽에서 물 냄새를 맡고 있어요';return ({look:'숲 가장자리를 두리번거리고 있어요',sniff:'고개를 숙여 풀 냄새를 맡고 있어요',sit:'숲 가장자리에 잠깐 앉아 쉬고 있어요'})[strollPose(s,p)?.pose]||'숲 가장자리를 천천히 둘러보고 있어요';}
 if(w)return ({empty_water:'비가 와서 물이 모이길 기다려요',no_play_leaves:'낙엽이 더 모이길 기다려요',no_nutrients:'낙엽이 천천히 거름이 되고 있어요',capacity:'편히 머물 빈 자리를 찾고 있어요',shape:'몸에 맞는 자리를 찾고 있어요',blocked_path:'오브젝트로 갈 수 있는 길을 찾고 있어요',sleep_here:'쉴 자리가 없어 그 자리에서 잠들었어요',brace_here:'바람이 세서 그 자리에 몸을 낮추고 있어요',unsafe_weather:'안전하게 머물 곳을 찾고 있어요'})[w.reason]||'필요한 자원이 있는 자리를 찾고 있어요';
 if(!t)return null;if(t.object==='shelter')return dep('shelter').label(s,p);if(!at(s,p))return nameOf(t.object)+'로 가고 있어요';
 if(t.object==='moss')return (patch(s,'moss')?.S||0)<=eps?'이끼는 말랐지만 포근하게 쉬고 있어요':'포근한 이끼에서 놀며 천천히 쉬고 있어요';
 if(t.kind==='splash')return p.motion?.water>0?'샘터에서 물장구를 치며 물도 마시고 있어요':'샘터에서 살짝 물장구를 치고 있어요';
 return ({nutrition:'분해된 낙엽에서 영양을 얻고 있어요',litterPlay:'낙엽을 가지고 놀고 있어요',splash:'샘터에서 물장구를 치며 물도 마시고 있어요',drink:'물가에서 천천히 물을 마시고 있어요',edgeDrink:'마른 가장자리에서 물을 마시고 있어요',rootDrink:'바위틈에 남은 물기를 느끼고 있어요'})[t.kind]||nameOf(t.object)+'에서 쉬고 있어요';
}
function validate(s){
 const st=s.objects,f=(v,max=1e15)=>Number.isFinite(v)&&v>=0&&v<=max;
 if(s.spring.capacity!==capacity(s,'spring')||(patch(s,'moss')||stash(s,'moss')).cap!==capacity(s,'moss'))throw Error('오브젝트 용량 기록을 확인해 주세요.');
 if(!st||st.version!==1||!Number.isSafeInteger(st.nextSession)||st.nextSession<1||!Number.isInteger(st.dayIndex)||!f(st.dayIndex)||!f(st.arrivedToday,st.dayQuota+eps)||!daily.includes(st.dayQuota)||!f(st.playBoostUntil)||!f(st.decomposedTotal))throw Error('오브젝트 순환 기록을 확인해 주세요.');
 for(const [id,m]of Object.entries(st.upgrades)){if(!capacities[id]||![1,2,3].includes(m.level)||![1,2,3].includes(m.unlocked)||m.unlocked<m.level||!f(m.useSeconds)||!f(m.stageUseSeconds)||!f(m.pressureSeconds,10)||typeof m.pressureEvidence!=='boolean')throw Error('확장 기록을 확인해 주세요.');}
 if(Object.keys(st.upgrades).length!==3||!f(st.ledger.leafInput)||!f(st.ledger.absorbed)||!f(s.spring.water,s.spring.capacity+eps)||!f(s.spring.snowWater,36+eps))throw Error('자원 원장을 확인해 주세요.');
 if(st.litter)dep('litter').validate(s);if(st.creatures)(typeof module==='object'?require('./creatures.js'):globalThis.ForestCreatures).validate(s);else{const total=storedLeaf(s);if(total>capacity(s,'litter')+(st.overflow||0)+1e-6)throw Error('낙엽 저장량이 용량을 초과했어요.');}
 for(const p of s.individuals){const w=p.walkPlan;if(w!==undefined&&!(w&&Number.isFinite(w.tx)&&Number.isFinite(w.ty)&&Number.isFinite(w.at)&&typeof w.legacy==='boolean'&&Array.isArray(w.pts)&&w.pts.length<=64&&(w.pts.length||Number.isFinite(w.fx)&&Number.isFinite(w.fy))&&w.pts.every(q=>q&&Number.isFinite(q.x)&&Number.isFinite(q.y))))throw Error('친구 길 기록을 확인해 주세요.');}
 for(const p of s.individuals){const r=p.stroll;if(r&&(!Number.isFinite(r.x)||!Number.isFinite(r.y)||!f(r.since)||!f(r.deadline)||!f(r.linger,60)||r.arrivedAt!=null&&!f(r.arrivedAt)||r.stalled!=null&&!f(r.stalled,1e6)||r.lake!=null&&r.lake!=='drink'||r.amble!=null&&r.amble!==true||r.cool!=null&&r.cool!==true))throw Error('산책 기록을 확인해 주세요.');}
 for(const p of s.individuals){const t=p.objectTask;if(t&&(!nameOf(t.object)||isPile(t.object)&&!patch(s,t.object)||!['moss','rest','drink','edgeDrink','rootDrink','splash','litterPlay','nutrition'].includes(t.kind)||!Number.isFinite(t.x)||!Number.isFinite(t.y)||!Number.isInteger(t.serial)||t.serial<1||t.serial>=st.nextSession||!f(t.since)||!Number.isFinite(t.remaining)))throw Error('오브젝트 이용 기록을 확인해 주세요.');if(p.carriedLeaf&&(!f(p.carriedLeaf.amount,.5)||p.carriedLeaf.pile!=='litter'&&!patch(s,p.carriedLeaf.pile)||typeof p.carriedLeaf.key!=='string'))throw Error('운반 중인 낙엽을 확인해 주세요.');}
}
return {litterInit:s=>{if(s.objects&&s.shelters){{const k=OLD_DAILY.indexOf(s.objects.dayQuota);if(k>=0)s.objects.dayQuota=BASE_DAILY[k];}dep('litter').init(s);(typeof module==='object'?require('./creatures.js'):globalThis.ForestCreatures).init(s);}return s;},litterRates,litterSpots,isPile,nameOf,relayout,init,migrate,resources,springWater,storedLeaf,patch,level,capacity,scale,rates,region,fits,groundAt,windAt,dry,spaceCapacity,used,option,prepare,choose,at,move,stroll,strollPose,STROLL,receive,rootRequests,grant,needs,release,invalidate,progress,planUpgrade,upgrade,upgradeStatus,reason,validate};
});
