(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestObjects=api;})(globalThis,function(){
'use strict';
const World=typeof module==='object'?require('./world.js'):globalThis.ForestWorld;
const dep=n=>typeof module==='object'?require('./'+n+'.js'):globalThis[{spatial:'ForestSpace',shelter:'ForestShelter','weather-care':'ForestWeatherCare',environment:'ForestEnvironment',social:'ForestSocial',litter:'ForestLitter',creatures:'ForestCreatures',traits:'ForestTraits',world:'ForestWorld'}[n]];
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
const rates={rock:1,moss:2,shade:1.5,crevice:1,shelter:4};
const names={moss:'이끼 자리',spring:'샘터',litter:'낙엽 자리',rock:'햇살 바위',shade:'잎 그늘',crevice:'바위틈',shelter:'쉼터'};
const isPile=id=>typeof id==='string'&&id.startsWith('pile:');
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
 const m=patch(s,'moss');m.cap=capacity(s,'moss');m.pool=0;m.drain=0;
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
 let a=W.wind(s,probe);if(id==='crevice'&&Math.cos(s.weather.wind_dir||0)<-.5&&!fits(s,p,'crevice',probe,'rest'))a*=.5;return a;
}
function effectsValid(s,p,t){
 const z=patch(s,t.object),W=dep('weather-care'),a=t.object==='shelter'?s.weather.wind*.2:windAt(s,p,t,t.object);
 if(t.object==='shelter')return true;
 if(t.object==='moss')return a<60&&dep('environment').precipitation(s,'rain')<.6&&p.burden<40&&!p.wetRecovery&&p.wet85Seconds<30&&!s.patches.some(z=>z.id!=='moss'&&z.W>1&&Math.hypot(p.x-z.x,p.y-z.y)<.06);
 if(t.kind==='drink'||t.kind==='edgeDrink')return s.spring.water>eps&&a<60;
 if(t.kind==='splash')return s.spring.water>=s.spring.capacity*.2&&a<60&&p.energy>=30&&p.burden<40&&!p.wetRecovery;
 if(t.kind==='litterPlay')return (z.O>=.5||p.carriedLeaf?.amount>=.5)&&p.energy>=30&&p.burden<40&&!p.wetRecovery&&a<60&&z.W<=1;
 if(t.kind==='nutrition')return z.U>eps&&a<60&&z.W<=1;
 if(t.kind==='rootDrink')return z.W>eps&&a<60&&p.burden<40&&!p.wetRecovery;
 if(t.object==='shade')return a<60&&!p.wetRecovery&&p.burden<40&&z.W<=.5;
 return a<50&&dry(s,t.object);
}
function needs(p){
 const n=p.objectNeeds??{water:false,energy:false,nutrition:false,mood:false};
 for(const [k,v,start,end]of [['water',p.B,35,65],['energy',p.energy,40,75],['nutrition',p.nutrition,40,70],['mood',p.mood,45,80]]){if(v<start)n[k]=true;if(v>=end-eps)n[k]=false;}
 return n;
}
function urgency(s,p){if(dep('weather-care').wind(s,p)>=60||p.burden>=60)return 0;if(p.B<20||p.energy<20||p.nutrition<20)return 1;return 2;}
// 0.8.3 (user: "케릭들 쉼터에 쉬러 잘 안 가던데" → 밤 잠·비 피하기): at night (from 'night' to 'dawn' of the game day) a friend
// without an urgent need goes to sleep, in the shelter if there is room, otherwise on moss / in leaf shade / by the stones,
// and stays until dawn; while it rains or snows it shelters there until it stops.
function sleepTime(s){const t=((s.worldTick%1200)+1200)%1200;return t>=620&&t<1150;}
function rainy(s){const E=dep('environment');return E.precipitation(s,'rain')+E.precipitation(s,'snow')>=.25;}
function goalsDone(s,p,t){const n=needs(p);if(t.complete)return true;if(t.free)return t.remaining<=0;
 if(t.reason==='safety')return dep('weather-care').wind(s,{...p,shelter:{phase:'outside'}})<50&&!p.wetRecovery&&!p.leafRecovery&&p.burden<40&&p.damage<10&&s.weather.wind<50;
 if(t.reason==='sleep')return !sleepTime(s);if(t.reason==='shelterRain')return !rainy(s);
 if(t.reason==='water')return !n.water;if(t.reason==='nutrition')return !n.nutrition;
 if(t.object==='moss')return !n.energy&&!n.mood;
 return t.reason==='energy'?!n.energy:t.reason==='mood'?!n.mood:false;
}
function points(s,p,id,kind){
 if(id==='shelter'){if(p.restCooldown>s.worldTick)return [];const Sh=dep('shelter');if(Sh.inside(s,p))return [{x:p.x,y:p.y}];return s.shelters.facilities.filter(f=>Sh.room(s,f,p)).flatMap(f=>{const q=Sh.seat(s,f,p,q=>!!dep('spatial').route(s,p,Sh.entry(f,q),p.id));return q?[Sh.entry(f,q)]:[];});}
 const r=region(s,id,kind),g=scale(s,id),large=dep('shelter').units(p)>4;
 const offsets=kind==='edgeDrink'?[[0,0]]:large?[[0,0],[-.015,0],[.015,0]]:[[0,0],[-.035,0],[.035,0],[-.065,0],[.065,0],[0,.014],[0,-.014]];
 return offsets.map(([x,y])=>({x:r.x+x*g,y:r.y+y*g}));
}
function option(s,p,id,kind,reason,free=false){
 const Space=dep('spatial'),Sh=dep('shelter');
 // 0.6.37: the crevice gap holds one friend at a time (its rest spot is a narrow strip right in front of the stones since
 // 0.6.35, and the friend tucks into the gap). A second friend used to get a spot beside the first, was blocked by its
 // body on the way, gave up and chose the crevice again, so it looked frozen "heading to the crevice".
 if(id==='crevice'&&s.individuals.some(z=>z.id!==p.id&&z.active&&z.objectTask?.object==='crevice'))return {fail:'capacity',object:id,kind};if(id!=='shelter'&&used(s,id,p.id)+Sh.units(p)>spaceCapacity(s,id))return {fail:'capacity',object:id,kind};
 let fail='shape';
 for(const q of points(s,p,id,kind)){
  const t={...q,object:id,kind,reason,free};
  if(!effectsValid(s,p,t)){fail=id==='spring'&&s.spring.water<=eps?'empty_water':kind==='litterPlay'&&patch(s,id).O<.5?'no_play_leaves':kind==='nutrition'&&patch(s,id).U<=eps?'no_nutrients':'unsafe_weather';continue;}
  if(id!=='shelter'&&!fits(s,p,id,q,kind))continue;
  if(id!=='shelter'&&s.individuals.some(z=>z.id!==p.id&&z.active&&(z.objectTask?.object===id&&Space.distance(z.objectTask,q)<.4*(Space.diameter(p)+Space.diameter(z))||Space.distance(z,q)<.4*(Space.diameter(p)+Space.diameter(z))))){fail='capacity';continue;}
  if(!Space.walkable(s,q,p.id)){fail='blocked_path';continue;}
  const route=Space.route(s,p,q,p.id);if(!route){fail='blocked_path';continue;}
  const seconds=route.reduce((a,z,i)=>a+Space.distance(i?route[i-1]:p,z),0)/Space.gait(p,s).speed;
  const target={water:65,energy:75,nutrition:70,mood:80},key={water:'B',energy:'energy',nutrition:'nutrition',mood:'mood'};
  let score=reason==='safety'?100:100*clamp(((target[reason]||75)-(p[key[reason]]||0))/(target[reason]||75),0,1);
  if(id==='moss'&&needs(p).energy&&needs(p).mood)score+=20*Math.max((75-p.energy)/75,(80-p.mood)/80);
  if(reason==='energy')score+=(rates[id]||0)*8;if(!p.objectTask&&p.action==='rest'&&p.target==='shelter'&&id==='shelter'&&reason==='energy')score+=35;if(reason==='safety'&&dry(s,id))score+=20;if(reason==='water')score+=id==='spring'?45:-30;if((reason==='sleep'||reason==='shelterRain')&&id==='shelter')score+=40;
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
const STROLL=Object.freeze({chance:.3,min:.25,linger:15,lingerSpread:16,deadline:90});
function strollTarget(s,p,rng){const W=dep('world'),Space=dep('spatial'),b=W.walk(s),G=W.GARDEN;
 // 0.9.0: while the lake shore waits to be found, about a third of the walks head for the forest's east edge
 if(W.lakeReady?.(s)&&rng(s,'behavior')<.35){for(let i=0;i<6;i++){const q={x:W.LAKE.east+(b.x1-W.LAKE.east)*rng(s,'behavior'),y:b.y0+(b.y1-b.y0)*rng(s,'behavior')};if(Math.hypot(q.x-p.x,q.y-p.y)>=STROLL.min&&Space.walkable(s,q,p.id))return q;}}
 // 0.9.3 겨울 얼음 놀이: when the lake is frozen, some walks go out onto the ice
 if(W.frozen?.(s)&&rng(s,'behavior')<.3){for(let i=0;i<6;i++){const q={x:1.3+(b.x1-1.3)*rng(s,'behavior'),y:b.y0+(b.y1-b.y0)*rng(s,'behavior')};if(W.onIce(s,q)&&Math.hypot(q.x-p.x,q.y-p.y)>=STROLL.min&&Space.walkable(s,q,p.id))return q;}}
 for(let i=0;i<8;i++){const q={x:b.x0+(b.x1-b.x0)*rng(s,'behavior'),y:b.y0+(b.y1-b.y0)*rng(s,'behavior')};const outer=q.x<G.x0+.05||q.x>G.x1-.05||q.y<G.y0+.05||q.y>G.y1-.05;
  if(i<6&&!outer||Math.hypot(q.x-p.x,q.y-p.y)<STROLL.min)continue;if(Space.walkable(s,q,p.id))return q;}return null;}
// 0.8.7 산책 동작 (user: "산책할 때 가벼운 모션들 먼저"): while it lingers at the walk's end the friend looks around (turning
// this way and that), bends to smell the grass, sits down for a little while and gets up again before walking on. Pure
// function of the stroll record and the clock: the scene draws it and the card text follows it; no state or RNG changes.
function strollPose(s,p,t=s.worldTick){const r=p.stroll;if(!r||r.arrivedAt==null||p.objectTask)return null;const e=t-r.arrivedAt,L=r.linger,sit=Math.max(7,L-7);
 if(e<0||e>=L-1)return {pose:'idle'};if(e<4)return {pose:'look',face:Math.floor(e/1.3)%2?1:-1};if(e<6.5)return {pose:'sniff'};if(e>=sit)return {pose:'sit'};
 return {pose:'look',face:Math.floor(e/1.8)%2?-1:1};}
function stroll(s,p){const t=p.stroll;if(!t)return null;if(p.objectTask||!p.active||p.mounted){delete p.stroll;return null;}
 if(t.arrivedAt==null){const m=dep('spatial').travel(s,p,t);if(m.distance>0)t.stalled=0;else if(!m.arrived)t.stalled=(t.stalled||0)+1;
  if(m.arrived)t.arrivedAt=s.worldTick;else if(t.stalled>=3||s.worldTick>t.deadline){delete p.stroll;p.nextObjectChoice=s.worldTick;}return m;}
 if(s.worldTick-t.arrivedAt>=t.linger){delete p.stroll;p.nextObjectChoice=s.worldTick;}return null;}
function choose(s,p,rng){
 if(!p.active||p.mounted)return;
 const W=dep('weather-care'),Sh=dep('shelter'),n=needs(p);p.objectNeeds=n;
 // 0.8.3: a friend waiting outside a full shelter (seats taken while it walked there) gives it up after 8 s and rests
 // elsewhere instead of waiting all night (sleep, rain, a free visit); a tired friend or one sheltering from a storm keeps waiting.
 {const c=p.objectTask;if(c&&c.object==='shelter'&&['sleep','shelterRain','free'].includes(c.reason)&&p.shelter?.phase==='waitingOutside'&&['crowd','capacity'].includes(p.shelter.waitReason)){c.fullWait=(c.fullWait||0)+1;if(c.fullWait>=8){release(s,p,'full');p.restCooldown=s.worldTick+120;p.nextObjectChoice=0;}}}
 const current=p.objectTask,danger=(Sh.inside(s,p)?s.weather.wind:W.wind(s,p))>=60||p.burden>=40||p.wetRecovery||((p.leafRecovery||p.damage>=10)&&p.B>=40&&p.nutrition>=40);
 const grade=urgency(s,p),valid=current&&effectsValid(s,p,current)&&!goalsDone(s,p,current);
 const emergencyChange=current&&grade<(current.grade??2);
 if(valid&&!emergencyChange&&s.worldTick<(p.nextObjectChoice||0))return;
 if(valid&&!emergencyChange&&current.reason==='safety'&&danger){p.nextObjectChoice=s.worldTick+5;return;}
 if(!current&&!danger&&!Object.values(n).some(Boolean)&&p.action==='groom'&&p.actionSeconds>0)return;
 if(!current&&s.worldTick<(p.nextObjectChoice||0)&&!danger&&grade>1)return;
 const definitions=[];const add=(id,k,r,free=false)=>definitions.push([id,k,r,free]);
 // 0.6.28 plant side of the small-neighbour ecology: a friend with pests on its leaves tidies them more and seeks shade or
 // water (moist leaves slow spider mites), and avoids playing in litter where root-fly larvae live (it still feeds there
 // when nothing else has nutrient). Same RNG draws as before, so choices stay deterministic.
 const P=s.objects?.creatures?dep('creatures').pressure(s,p):{leaf:false,mite:false,gnatSites:[]},clean=ids=>ids.filter(id=>!P.gnatSites.includes(id)),lastInfested=ids=>[...ids.filter(id=>!P.gnatSites.includes(id)),...ids.filter(id=>P.gnatSites.includes(id))];
 if(danger){for(const id of ['shelter','rock','crevice'])add(id,'rest','safety');}
 else if(n.water&&(p.B<20||!n.energy&&!n.nutrition||p.B/65<=Math.min(p.energy/75,p.nutrition/70))){add('spring',p.wetRecovery||p.burden>=40||s.spring.water<s.spring.capacity*.2?'edgeDrink':'drink','water');add('spring','edgeDrink','water');if(p.B>=20&&patch(s,'moss').S>=1&&p.Q<12)add('moss','moss','water');if(p.B>=20&&patch(s,'crevice').W>0)add('crevice','rootDrink','water');}
 else if(n.nutrition&&(p.nutrition<20||!n.energy||p.nutrition/70<p.energy/75)){for(const id of lastInfested(litterSpots(s,'U',p)))add(id,'nutrition','nutrition');}
 else if(sleepTime(s)||rainy(s)&&p.species!=='neolbi'&&p.species!=='superbum'&&(dep('traits').of(p.species).rain<=0||dep('environment').precipitation(s,'rain')+dep('environment').precipitation(s,'snow')>=.6)&&!s.individuals.some(z=>z.active&&z.species==='neolbi'&&z.id!==p.id&&Math.hypot(z.x-p.x,z.y-p.y)<.3)){   /* rain: 엘레판 and the friends near it keep sheltering under its leaf */const r=sleepTime(s)?'sleep':'shelterRain';for(const id of (r==='sleep'?['shelter','moss','shade','crevice','rock']:['shelter','shade','crevice','rock']))add(id,id==='moss'?'moss':'rest',r);}
 else if(n.energy){for(const id of ['shelter','moss','shade','rock','crevice'])add(id,id==='moss'?'moss':'rest','energy');}
 else if(n.mood){add('moss','moss','mood');for(const id of clean(litterSpots(s,'O',p)))add(id,'litterPlay','mood');add('spring','splash','mood');}
 else if(!current&&p.action==='rest'&&p.target==='shelter'){add('shelter','rest','free',true);}
 else {
  // Free visits preserve species expression without competing with actual needs.
  if(p.stroll&&!current){p.nextObjectChoice=s.worldTick+5;return;}
  const roll=rng(s,'behavior'),groomUp=P.leaf?.55:.25;const doneFree=!current||current.free&&!valid;if(roll<groomUp&&doneFree){if(current)release(s,p,'complete');p.action='groom';p.target=null;p.actionSeconds=8;p.nextObjectChoice=s.worldTick+8;return;}
  if(doneFree&&!P.mite&&roll>=groomUp&&roll<groomUp+STROLL.chance){const q=strollTarget(s,p,rng);if(q){if(current)release(s,p,'complete');delete p.objectWait;p.stroll={x:q.x,y:q.y,since:s.worldTick,deadline:s.worldTick+STROLL.deadline,linger:STROLL.linger+Math.floor(rng(s,'behavior')*STROLL.lingerSpread)};p.action='wander';p.target=null;p.nextObjectChoice=s.worldTick+5;return;}}
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
  p.objectTask={...next,serial,since:s.worldTick,grade,remaining:20+Math.floor(rng(s,'behavior')*(next.kind==='splash'?11:21)),stalled:0,deadline:s.worldTick+Math.max(10,Math.min(30,Math.ceil(next.travelSeconds)+5))};p.nextObjectChoice=s.worldTick+5;
  p.action=['drink','edgeDrink','rootDrink'].includes(next.kind)?'drink':next.kind==='rest'||next.kind==='moss'?'rest':next.kind==='nutrition'?'feed':'play';p.target=next.object;p.drinkCycle=next.reason==='water';
 }else {
  delete p.stroll;const debug=p.objectDebug;release(s,p,'replace');p.objectDebug=debug;p.objectWait={reason:options[0]?.fail||'no_resource',object:definitions[0]?.[0]||null,since:current?.since??s.worldTick};p.action='wander';p.target=null;p.actionSeconds=5;p.nextObjectChoice=s.worldTick+5;

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
 if(t.kind==='moss'){recover('energy',2,75);recover('mood',1,80);p.motion.kind='moss';}
 else if(t.kind==='rest'){recover('energy',rates[t.object]||1,75);p.motion.kind='rest';}
 else if(t.kind==='drink'||t.kind==='edgeDrink'){
  add(s.spring,'water',Math.min(10/60,65-p.B),n=>{p.B+=n;p.motion.water=n;p.motion.kind=n>0?'drink':'idle';if(p.B>=65-eps){t.complete=true;p.drinkCycle=false;p.objectNeeds.water=false;p.justDrank=true;}});
 }else if(t.kind==='splash'){
  recover('mood',2,80);p.energy=clamp(p.energy-1/60);p.motion.kind='splash';
  add(s.spring,'water',Math.min(6/60,65-p.B),n=>{p.B+=n;p.motion.water=n;if(n>0&&p.B>=65-eps){p.objectNeeds??=needs(p);p.objectNeeds.water=false;if(!t.hydrationComplete){t.hydrationComplete=true;p.justDrank=true;}}});
 }
 else if(t.kind==='litterPlay'){
  if(!p.carriedLeaf&&z.O>=.5){z.O-=.5;p.carriedLeaf={amount:.5,pile:t.object,key:'leaf:'+p.id+':'+t.serial};p.objectContact={id:p.carriedLeaf.key+':pick',cue:'pickup',tick:s.worldTick};}
  if(p.carriedLeaf){recover('mood',3,80);p.energy=clamp(p.energy-1/60);p.motion.kind='litter';if(isPile(t.object))z.playBoostUntil=s.worldTick+120;else s.objects.playBoostUntil=s.worldTick+120;}
 }else if(t.kind==='nutrition'){
  add(z,'U',Math.min(1/60,70-p.nutrition),n=>{p.nutrition+=n;s.objects.ledger.absorbed+=n;if(p.nutrition>=70-eps){t.complete=true;p.objectNeeds.nutrition=false;}});p.motion.kind='groom';
 }else if(t.kind==='rootDrink')p.motion.kind='drink';
 // ELL-SPC-03: Ellisii (legacy key 'bonbon') no longer stores spring water in V; water sharing (A04) is retired. Existing V is preserved.
 if(t.free||t.kind==='splash'){t.remaining--;if(t.remaining<=0)t.complete=true;}
 const meta=s.objects.upgrades[kindOf(t.object)];if(meta&&meta.lastUsedTick!==s.worldTick){meta.useSeconds++;meta.stageUseSeconds++;meta.lastUsedTick=s.worldTick;}
 return ['moss','rest'].includes(t.kind);
}
function rootRequests(s,p,requests){
 const z=groundAt(s,p),t=p.objectTask;if(!z||p.mounted||p.motion.distance>0||p.motion.kind==='held'||dep('shelter').inside(s,p))return;
 let amount=0;if(z.id==='moss'){if(z.S>=z.cap*.2&&p.B<45&&p.Q<12)amount=Math.min(.5/60,12-p.Q);}
 else if(t?.kind==='rootDrink'&&at(s,p))amount=Math.min(1/60,20-p.Q);
 else if(moist(z)>=60)amount=Math.min(4/60,20-p.Q);
 if(amount>0){const key=t?.kind==='rootDrink'?'W':z.W>0?'W':'S';requests.push({sourceId:z.id+':'+key,source:z,key,amount,apply:n=>{p.Q+=n;}});}
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
 if(p.stroll&&!t){if(p.stroll.arrivedAt==null)return '숲 가장자리로 산책 가고 있어요';if(p.stroll.scent)return '동쪽에서 물 냄새를 맡고 있어요';return ({look:'숲 가장자리를 두리번거리고 있어요',sniff:'고개를 숙여 풀 냄새를 맡고 있어요',sit:'숲 가장자리에 잠깐 앉아 쉬고 있어요'})[strollPose(s,p)?.pose]||'숲 가장자리를 천천히 둘러보고 있어요';}
 if(w)return ({empty_water:'비가 와서 물이 모이길 기다려요',no_play_leaves:'낙엽이 더 모이길 기다려요',no_nutrients:'낙엽이 천천히 거름이 되고 있어요',capacity:'편히 머물 빈 자리를 찾고 있어요',shape:'몸에 맞는 자리를 찾고 있어요',blocked_path:'오브젝트로 갈 수 있는 길을 찾고 있어요',unsafe_weather:'안전하게 머물 곳을 찾고 있어요'})[w.reason]||'필요한 자원이 있는 자리를 찾고 있어요';
 if(!t)return null;if(t.object==='shelter')return dep('shelter').label(s,p);if(!at(s,p))return nameOf(t.object)+'로 가고 있어요';
 if(t.object==='moss')return patch(s,'moss').S<=eps?'이끼는 말랐지만 포근하게 쉬고 있어요':'포근한 이끼에서 놀며 천천히 쉬고 있어요';
 if(t.kind==='splash')return p.motion?.water>0?'샘터에서 물장구를 치며 물도 마시고 있어요':'샘터에서 살짝 물장구를 치고 있어요';
 return ({nutrition:'분해된 낙엽에서 영양을 얻고 있어요',litterPlay:'낙엽을 가지고 놀고 있어요',splash:'샘터에서 물장구를 치며 물도 마시고 있어요',drink:'물가에서 천천히 물을 마시고 있어요',edgeDrink:'마른 가장자리에서 물을 마시고 있어요',rootDrink:'바위틈에 남은 물기를 느끼고 있어요'})[t.kind]||nameOf(t.object)+'에서 쉬고 있어요';
}
function validate(s){
 const st=s.objects,f=(v,max=1e15)=>Number.isFinite(v)&&v>=0&&v<=max;
 if(s.spring.capacity!==capacity(s,'spring')||patch(s,'moss').cap!==capacity(s,'moss'))throw Error('오브젝트 용량 기록을 확인해 주세요.');
 if(!st||st.version!==1||!Number.isSafeInteger(st.nextSession)||st.nextSession<1||!Number.isInteger(st.dayIndex)||!f(st.dayIndex)||!f(st.arrivedToday,st.dayQuota+eps)||!daily.includes(st.dayQuota)||!f(st.playBoostUntil)||!f(st.decomposedTotal))throw Error('오브젝트 순환 기록을 확인해 주세요.');
 for(const [id,m]of Object.entries(st.upgrades)){if(!capacities[id]||![1,2,3].includes(m.level)||![1,2,3].includes(m.unlocked)||m.unlocked<m.level||!f(m.useSeconds)||!f(m.stageUseSeconds)||!f(m.pressureSeconds,10)||typeof m.pressureEvidence!=='boolean')throw Error('확장 기록을 확인해 주세요.');}
 if(Object.keys(st.upgrades).length!==3||!f(st.ledger.leafInput)||!f(st.ledger.absorbed)||!f(s.spring.water,s.spring.capacity+eps)||!f(s.spring.snowWater,36+eps))throw Error('자원 원장을 확인해 주세요.');
 if(st.litter)dep('litter').validate(s);if(st.creatures)(typeof module==='object'?require('./creatures.js'):globalThis.ForestCreatures).validate(s);else{const total=storedLeaf(s);if(total>capacity(s,'litter')+(st.overflow||0)+1e-6)throw Error('낙엽 저장량이 용량을 초과했어요.');}
 for(const p of s.individuals){const r=p.stroll;if(r&&(!Number.isFinite(r.x)||!Number.isFinite(r.y)||!f(r.since)||!f(r.deadline)||!f(r.linger,60)||r.arrivedAt!=null&&!f(r.arrivedAt)||r.stalled!=null&&!f(r.stalled,1e6)))throw Error('산책 기록을 확인해 주세요.');}
 for(const p of s.individuals){const t=p.objectTask;if(t&&(!nameOf(t.object)||isPile(t.object)&&!patch(s,t.object)||!['moss','rest','drink','edgeDrink','rootDrink','splash','litterPlay','nutrition'].includes(t.kind)||!Number.isFinite(t.x)||!Number.isFinite(t.y)||!Number.isInteger(t.serial)||t.serial<1||t.serial>=st.nextSession||!f(t.since)||!Number.isFinite(t.remaining)))throw Error('오브젝트 이용 기록을 확인해 주세요.');if(p.carriedLeaf&&(!f(p.carriedLeaf.amount,.5)||p.carriedLeaf.pile!=='litter'&&!patch(s,p.carriedLeaf.pile)||typeof p.carriedLeaf.key!=='string'))throw Error('운반 중인 낙엽을 확인해 주세요.');}
}
return {litterInit:s=>{if(s.objects&&s.shelters){{const k=OLD_DAILY.indexOf(s.objects.dayQuota);if(k>=0)s.objects.dayQuota=BASE_DAILY[k];}dep('litter').init(s);(typeof module==='object'?require('./creatures.js'):globalThis.ForestCreatures).init(s);}return s;},litterRates,litterSpots,isPile,nameOf,relayout,init,migrate,resources,springWater,storedLeaf,patch,level,capacity,scale,rates,region,fits,groundAt,windAt,dry,spaceCapacity,used,option,prepare,choose,at,move,stroll,strollPose,STROLL,receive,rootRequests,grant,needs,release,invalidate,progress,planUpgrade,upgrade,upgradeStatus,reason,validate};
});
