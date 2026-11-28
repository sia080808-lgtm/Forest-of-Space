const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine'),O=F.Objects;
const game=()=>{const s=F.create(0,219);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;return s;},near=(a1,b,t=1e-7)=>a.ok(Math.abs(a1-b)<t,`${a1} != ${b}`);
function task(s,id,kind,reason='energy'){const p=s.individuals[0];O.release(s,p);const q=O.region(s,id,kind);Object.assign(p,q);p.objectTask={object:id,kind,reason,...q,serial:s.objects.nextSession++,since:s.worldTick,remaining:30,grade:2};p.objectNeeds=O.needs(p);p.motion={distance:0,kind:'idle',water:0};p.target=id;return p;}
function classic(s){const z=O.patch(s,'litter');z.O=70;z.U=30;s.objects.litter.leaves=[];s.objects.arrivedToday=s.objects.dayQuota;return s;}
function fixed(s,seconds,fn){for(let t=0;t<seconds;t++){s.worldTick++;fn();}}
test('AC219-01/02 empty spring receives only actual precipitation, exact catchment input',()=>{for(const kind of ['sun','cloud','fog']){const s=game();s.spring.water=0;s.weather.kind=kind;s.weather.intensity=100;s.weather.transition=0;fixed(s,120,()=>O.resources(s));near(s.spring.water,0);near(s.ledger.condensation,0);}const s=game();s.spring.water=0;s.weather.kind='rain';s.weather.intensity=60;s.weather.transition=0;fixed(s,60,()=>O.resources(s));near(s.ledger.rain,21.6);near(s.spring.water,21.6-s.ledger.evaporation);near(s.ledger.spring,0);});
test('AC219-03 snow melts from existing stock, no new external input',()=>{const s=game();s.spring.water=0;s.spring.snowWater=10;s.weather.kind='cloud';s.climate.T=70;fixed(s,30,()=>O.resources(s));near(s.spring.snowWater,7);near(s.spring.water,3-s.ledger.evaporation);near(s.ledger.rain+s.ledger.snow,0);});
test('AC219-04 dry active timer queues real rain; offline never advances it',()=>{const s=game();s.environment.dryActiveSeconds=599;s.weather.remaining=240;s.weather.kind='cloud';F.step(s);a.equal(s.environment.rainRescuePending,true);s.weather.remaining=1;F.step(s);a.equal(s.weather.kind,'rain');a.equal(s.weather.intensity,60);const old=s.environment.dryActiveSeconds;F.pause(s,0);F.resume(s,3600000);a.equal(s.environment.dryActiveSeconds,old);});
test('AC219-05/06 dry moss has exact gradual effects without entry bonus or duplication',()=>{// 1.0: 기분 is folded into 기운, moss gives 기운 +2/min
 const s=game(),p=task(s,'moss','moss');p.energy=40;p.mood=40;O.patch(s,'moss').S=0;const before=F.totalWater(s);fixed(s,180,()=>{O.receive(s,p,[]);});near(p.energy,46);near(p.mood,40);near(F.totalWater(s),before);});
test('AC219-07 moss is like sphagnum: a friend resting on it gets water into 수분 at 3 a minute (up to 55), from the moss',()=>{// 1.0 (SRS v2.34 ST34-07)
 const s=game(),p=task(s,'moss','moss');p.B=40;p.Q=5;O.patch(s,'moss').S=5;fixed(s,60,()=>{const requests=[];O.rootRequests(s,p,requests);O.grant(requests);});near(p.B,43);near(p.Q,5);near(O.patch(s,'moss').S,2);});
test('AC219-08 moss never lowers a value above its recovery ceiling',()=>{const s=game(),p=task(s,'moss','moss');p.energy=p.mood=90;O.receive(s,p,[]);near(p.energy,90);near(p.mood,90);});
test('AC219-09 dangerous conditions interrupt moss on next step, dry stock does not',()=>{const s=game(),p=task(s,'moss','moss');p.B=60;p.energy=35;p.mood=30;O.patch(s,'moss').S=0;F.step(s);a.equal(p.objectTask.object,'moss');p.burden=45;F.step(s);a.notEqual(p.objectTask?.object,'moss');});
test('AC219-10/12 decomposition conserves raw plus compost, boost capped at three',()=>{const s=classic(game()),z=O.patch(s,'litter');z.S=z.cap*.5;s.objects.playBoostUntil=1e6;fixed(s,600,()=>O.resources(s));near(z.O,55);near(z.U,45);near(O.storedLeaf(s),100);near(s.objects.ledger.leafInput,0);});
test('AC219-11/17 absorption consumes compost exactly, not energy',()=>{const s=classic(game()),p=task(s,'litter','nutrition','nutrition'),z=O.patch(s,'litter');p.nutrition=30;const energy=p.energy,k=require('../../app/src/main/assets/web/traits.js').ofPet(p).nutr;const fed=Math.min(20,10*1.5*k);fixed(s,600,()=>{const requests=[];O.receive(s,p,requests);O.grant(requests);});near(p.nutrition,30+fed);near(z.U,30-fed);near(p.energy,energy);near(O.storedLeaf(s),100-fed);});
test('AC219-13/18 raw and compost are separate actions',()=>{const s=game(),p=s.individuals[0],z=O.patch(s,'litter');z.O=0;z.U=100;a.ok(O.option(s,p,'litter','litterPlay','mood').fail);a.ok(!O.option(s,p,'litter','nutrition','nutrition').fail);z.O=100;z.U=0;a.ok(!O.option(s,p,'litter','litterPlay','mood').fail);a.ok(O.option(s,p,'litter','nutrition','nutrition').fail);});
test('AC219-14/15 v2.24 fall: daily quota, floor-leaf cap (90 in the 0.7.0 forest) only (compost does not block), no catch-up',()=>{const L=require('../../app/src/main/assets/web/litter.js');
 const s=game(),z=O.patch(s,'litter');z.O=0;z.U=0;s.objects.litter.leaves=[];s.weather.wind=75;fixed(s,1199,()=>{O.resources(s);a.ok(L.floor(s)<=L.LCAP+1e-9);});a.equal(s.objects.arrivedToday,27);near(s.objects.ledger.leafInput,27);/* 0.8.0: a new game starts in spring (45 x0.6) */
 // A full old compost store (U100) no longer stops leaves from falling (P0-2).
 const t=game(),q=O.patch(t,'litter');q.O=0;q.U=100;fixed(t,1199,()=>O.resources(t));a.ok(t.objects.arrivedToday>=10,'fell '+t.objects.arrivedToday);
 // Floor leaves at the cap stop the fall; missed leaves are not paid later.
 const u=game();u.objects.litter.leaves=[];for(let i=0;i<L.LCAP/10;i++)u.objects.litter.piles.push({id:'pile:'+(90+i),sector:i*3,x:.1+(i%5)*.2,y:.5+.12*Math.floor(i/5),O:10,U:0,S:0,cap:100,W:0,playBoostUntil:0,born:0});// floor at the cap (0.7.0: 90)
 for(const p of u.patches)if(p.id!=='shelter'){p.S=0;}fixed(u,600,()=>{O.resources(u);a.ok(L.floor(u)<=L.LCAP+1e-9);});
 a.ok(u.objects.arrivedToday<=Math.ceil(u.objects.decomposedTotal)+1e-9,'only room freed by decomposition is refilled');});
test('AC219-16 pickup, restore, release conserve stock without duplication',()=>{const s=classic(game()),p=task(s,'litter','litterPlay','mood'),before=O.storedLeaf(s);O.receive(s,p,[]);near(p.carriedLeaf.amount,.5);near(O.storedLeaf(s),before);const restored=F.migrate(s),r=restored.individuals[0];O.release(restored,r);O.release(restored,r);near(O.storedLeaf(restored),before);a.equal(r.carriedLeaf,undefined);});
test('AC219-19 real shelter grants energy only, no remote supplies or mood',()=>{const s=game(),p=s.individuals[0],f=s.shelters.facilities[0],q=F.Shelter.seat(s,f,p);Object.assign(p,q);p.energy=40;p.B=50;p.nutrition=50;p.mood=40;p.shelter={phase:'restingInside',facilityId:f.id,...q,units:F.Shelter.units(p),since:0,revision:0};p.objectTask={object:'shelter',kind:'rest',reason:'energy',...q,serial:s.objects.nextSession++,since:0,remaining:30};p.motion={distance:0};const before=F.totalWater(s);fixed(s,60,()=>O.receive(s,p,[]));near(p.energy,43);near(p.B,50);near(p.nutrition,50);near(p.mood,40);   /* 1.0: shelter 4 -> 3 a minute */near(F.totalWater(s),before);});
test('AC219-21 nutrition deficit selects real compost rather than shelter',()=>{const s=game(),p=s.individuals[0];p.B=60;p.energy=70;p.nutrition=30;F.step(s);a.equal(p.objectTask?.object,'litter');a.equal(p.objectTask?.kind,'nutrition');F.advance(s,25);a.ok(p.nutrition>30);});
test('AC219-22 dry moss remains eligible for both energy and mood',()=>{const s=game(),p=s.individuals[0];p.B=60;p.energy=35;p.mood=30;O.patch(s,'moss').S=0;Object.assign(p,O.region(s,'moss'));F.step(s);a.equal(p.objectTask.object,'moss');a.ok(p.energy>35);a.ok(p.mood>30);});
test('AC219-26 upgrade requires real use plus pressure, preserves stocks, no free fill',()=>{const s=game(),m=s.objects.upgrades.spring; m.stageUseSeconds=180;s.spring.water=0;fixed(s,10,()=>O.progress(s));a.equal(m.unlocked,2);a.doesNotThrow(()=>O.planUpgrade(s,'spring'));O.upgrade(s,'spring');near(s.spring.capacity,90);near(s.spring.water,0);F.valid(s);});
test('AC219-25 proportional grants never overdraw shared stock',()=>{const source={water:.1},received=[0,0];O.grant([0,1].map(i=>({sourceId:'spring:water',source,key:'water',amount:1,apply:n=>received[i]+=n})));near(source.water,0);near(received[0],.05);near(received[1],.05);});
test('AC219-29 offline freezes water, resources, nutrition, mood and damage',()=>{const s=game(),p=s.individuals[0];p.energy=40;const before=F.clone(s);F.pause(s,0);F.resume(s,3600000);for(const k of ['B','Q','V','nutrition','mood','damage','burden','x','y'])a.equal(p[k],before.individuals[0][k],k);a.deepEqual(s.spring,before.spring);a.deepEqual(s.patches,before.patches);near(p.energy,75);});
test('AC219-28 legacy stock migration moves excess water once without reinitializing progress',()=>{const old=game();delete old.objects;old.rules='SRS-2.18-environment';const m=O.patch(old,'moss');m.cap=40;m.pool=10;m.drain=1;m.S=22;old.spring.water=50;const water=F.totalWater(old);const s=F.migrate(old);near(O.patch(s,'moss').S,5);near(s.spring.water,60);near(s.ledger.outflow,7);near(F.totalWater(s)+7,water);const again=F.migrate(s);near(F.totalWater(again),F.totalWater(s));a.equal(again.individuals[0].id,old.individuals[0].id);});
test('save write failure rolls back leaf pickup atomically',()=>{const s=game(),p=task(s,'litter','litterPlay','mood'),before=F.clone(s);a.throws(()=>F.transaction(s,x=>O.receive(x,x.individuals[0],[]),()=>false));a.deepEqual(s,before);});
test('AC219-27 current day quota stays unchanged on upgrade; next day uses new cap',()=>{const s=game(),z=O.patch(s,'litter'),m=s.objects.upgrades.litter;z.O=10;z.U=0;s.objects.arrivedToday=27;m.unlocked=2;O.upgrade(s,'litter');a.equal(s.objects.dayQuota,27);s.worldTick=1199;O.resources(s);a.equal(s.objects.dayQuota,27);s.worldTick=1200;O.resources(s);a.equal(s.objects.dayQuota,41);/* 0.8.0 spring: 45/68 x0.6, rounded up */a.ok(s.objects.arrivedToday<=1);});
test('current and future corrupt resource metadata is rejected, never normalized',()=>{for(const mutation of [s=>s.spring.capacity=1000,s=>s.objects.upgrades.moss.level=8,s=>s.rules='future']){const s=game();mutation(s);a.throws(()=>F.migrate(s));}});

test('엘레판 only reports walking to the leaf litter while moving, then plays on arrival',()=>{
 const s=game(),p=s.individuals[0];
 Object.assign(p,{species:'neolbi',x:.2,y:.86,canopyProgress:1});O.patch(s,'litter').O=50;
 const q=O.option(s,p,'litter','litterPlay','free',true);
 a.ok(!q.fail);p.objectTask={...q,stalled:0,since:s.worldTick,deadline:s.worldTick+30};
 function step(){s.worldTick++;p.motion={...O.move(s,p),tick:s.worldTick};}
 step();a.equal(p.motion.distance,0);a.equal(p.objectTask.stalled,0);a.match(O.reason(s,p),/큰 잎을 접고/);
 p.canopyProgress=0;
 const blocker={...p,id:'at-the-leaves',x:q.x,y:q.y,objectTask:null};s.individuals.push(blocker);
 step();a.equal(p.motion.distance,0);a.match(O.reason(s,p),/갈 길을 찾고/);
 blocker.active=false;
 let walked=false;
 for(let tick=0;tick<20&&!O.at(s,p);tick++){
  step();
  if(!O.at(s,p)&&p.motion.distance>0){a.match(O.reason(s,p),/낙엽 자리로 가고/);walked=true;}
 }
 a.ok(walked);a.ok(O.at(s,p));a.match(O.reason(s,p),/낙엽을 가지고 놀고/);
});

test('슈퍼범 releases a persistently blocked litter destination even for a saved task missing its stall count',()=>{
 const s=game(),p=s.individuals[0];
 Object.assign(p,{species:'superbum',xp:115,visualStage:3,x:.2,y:.86});O.patch(s,'litter').O=50;
 const q=O.option(s,p,'litter','litterPlay','free',true);a.ok(!q.fail);
 p.objectTask={...q,since:s.worldTick,deadline:s.worldTick+30};
 s.individuals.push({...p,id:'at-the-leaves',x:q.x,y:q.y,objectTask:null});
 for(let tick=0;tick<6;tick++){s.worldTick++;p.motion={...O.move(s,p),tick:s.worldTick};a.equal(p.motion.distance,0);a.doesNotMatch(O.reason(s,p),/가고 있어요/);}
 a.equal(p.objectTask,undefined);a.equal(p.objectWait.reason,'blocked_path');
});

test('a grown 슈퍼범 walks to the open side and takes compost when its original litter spot is blocked',()=>{
 const s=game(),p=s.individuals[0],leaves=O.patch(s,'litter');
 Object.assign(p,{species:'superbum',xp:115,visualStage:3,x:.2,y:.86,nutrition:30});leaves.U=40;
 const q=O.option(s,p,'litter','nutrition','nutrition');a.ok(!q.fail);
 p.objectTask={...q,since:s.worldTick,deadline:s.worldTick+30,stalled:0,serial:1};
 // Just inside the clearance of the original spot, outside that of the western spot.
 const other={...p,id:'neighbour',species:'ridley',x:q.x+.065,y:q.y,objectTask:null};s.individuals.push(other);
 let waiting=false,walking=false;
 for(let i=0;i<25&&!O.at(s,p);i++){
  s.worldTick++;p.motion={...O.move(s,p),tick:s.worldTick};
  if(!p.motion.distance){a.match(O.reason(s,p),/갈 길을 찾고/);waiting=true;}
  else if(!O.at(s,p)){a.match(O.reason(s,p),/낙엽 자리로 가고/);walking=true;}
 }
 a.ok(waiting&&walking);a.ok(O.at(s,p));a.ok(p.x<q.x);a.match(O.reason(s,p),/영양을 얻고/);
 const requests=[];O.receive(s,p,requests);O.grant(requests);a.ok(p.nutrition>30);near(p.nutrition-30,40-leaves.U);
});

test('compost feeds 1.5 nutrition per minute before the 0.12 upkeep and debits the real stock',()=>{
 const s=F.create(0,7),p=s.individuals[0],z=F.Objects.patch(s,'litter');
 s.started=true;s.worldTick=1250;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;
 Object.assign(s.weather,{kind:'sun',remaining:1000,wind:20,transition:0});
 z.U=20;
 Object.assign(p,{species:'maria',B:55,energy:80,mood:80,nutrition:39.9,x:z.x,y:z.y-.035});
 F.advance(s,60,{visible:false});
 near(p.nutrition,41.28);
 near(z.U,18.5);
 near(s.objects.ledger.absorbed,1.5);
});

test('Corona beside a blocked shelter wall stops retrying the same litter route, then resumes eating',()=>{
 const s=game(),p=s.individuals[0],litter=O.patch(s,'litter');
 s.worldTick=1440;Object.assign(s.weather,{kind:'sun',wind:20,transition:0,remaining:1000});
 Object.assign(p,{species:'jureong',xp:15,visualStage:2,energy:90,mood:90,B:56,nutrition:28,x:.12,y:.21});
 litter.U=40;litter.W=0;
 const q=O.option(s,p,'litter','nutrition','nutrition');
 a.ok(!q.fail);
 Object.assign(p,{objectTask:{...q,since:s.worldTick,deadline:s.worldTick+100,serial:s.objects.nextSession++,remaining:15},action:'feed',target:q.object});
 const blocker={...F.clone(p),id:'door-block',species:'superbum',xp:115,visualStage:3,x:.12,y:.24,
  objectTask:null,action:'wander',target:null,settleUntil:1e9};
 s.individuals.push(blocker);
 a.equal(F.Space.route(s,p,q,p.id,true),null);
 F.advance(s,6,{visible:false});
 a.equal(p.objectWait?.reason,'blocked_path');
 for(let i=0;i<17;i++){
  F.step(s,{visible:false});a.notEqual(p.objectTask?.object,'litter');
 }
 blocker.active=false;
 F.advance(s,60,{visible:false});
 a.ok(O.at(s,p));
 a.ok(p.nutrition>28);
});

test('a long meal under dense mealybugs pauses for leaf grooming and can resume',()=>{
 const s=game(),p=s.individuals[0],litter=O.patch(s,'litter'),C=F.Creatures;
 s.worldTick=1440;s.environment.climate='C02';s.environment.climateMode='fixed';
 Object.assign(s.weather,{kind:'sun',wind:20,transition:0,remaining:1000});
 Object.assign(p,{species:'jureong',xp:15,visualStage:2,energy:90,mood:90,B:56,nutrition:28,x:litter.x,y:litter.y-.035});
 litter.U=40;litter.W=0;
 const st=s.objects.creatures;
 st.lastPest=1e9;st.lastArrival=1e9;
 const group={id:'cr:'+st.nextId++,kind:'mealy',host:p.id,density:100,honey:40,low:0,since:s.worldTick,bad:0,lastWork:0,carry:null};
 st.groups.push(group);
 F.advance(s,170,{visible:false});
 a.equal(p.objectTask?.kind,'nutrition');
 let groomed=false;
 for(let i=0;i<20;i++){F.step(s,{visible:false});if(p.action==='groom'){groomed=true;break;}}
 a.ok(groomed);a.equal(p.objectTask,undefined);
 const before=C.onLeaf(s,p.id).mealy.density;
 F.advance(s,6,{visible:false});
 a.equal(p.motion.kind,'groom');a.ok(group.density<before);
 F.advance(s,12,{visible:false});
 a.equal(p.objectTask?.kind,'nutrition');
});

test('a friend pacing in place on the way to a litter pile releases the reservation and tries somewhere else',()=>{
 const s=game(),p=s.individuals[0],L=F.Litter,S=F.Space;
 s.worldTick=3700;Object.assign(s.weather,{kind:'sun',remaining:200,wind:10,transition:0});
 Object.assign(p,{x:.46,y:.49,B:60,energy:90,mood:90,nutrition:25,action:'feed'});
 const pile={id:'pile:60',x:.52,y:.67,O:8,U:10,S:20,cap:100,W:0,playBoostUntil:0,born:0};
 pile.sector=L.sectorOf(pile);s.objects.litter.piles.push(pile);
 const q=O.option(s,p,pile.id,'nutrition','nutrition');
 a.ok(!q.fail,q.fail);
 p.objectTask={...q,serial:s.objects.nextSession++,since:s.worldTick,remaining:25,grade:2,deadline:s.worldTick+240};
 p.nextObjectChoice=s.worldTick+100;p.target=pile.id;
 const x=p.x,travel=S.travel;
 try{
  // A changing obstruction makes each reported walking step cancel out the previous one.
  S.travel=(garden,actor,destination)=>{
   if(actor!==p||destination!==p.objectTask||destination.object!==pile.id)return travel(garden,actor,destination);
   const before={x:p.x,y:p.y};p.x=p.x===x?x+.009:x;
   return {kind:'walk',path:[before,{x:p.x,y:p.y}],distance:.009,duration:.2,arrived:false};
  };
  F.step(s);a.match(O.reason(s,p),/낙엽더미로 가고 있어요/);
  F.advance(s,16);
  a.notEqual(p.objectTask?.object,pile.id);
  a.equal(p.objectWait?.reason,'blocked_path');
  a.ok(p.litterRouteRetry.some(r=>r.object===pile.id&&r.until>s.worldTick));
  a.doesNotMatch(O.reason(s,p),/낙엽더미로 가고 있어요/);
  a.ok(F.valid(s));
 }finally{S.travel=travel;}
 F.advance(s,20);
 a.ok(p.nutrition>25,'another reachable compost spot is available');
});

function compostVisit(species,stock){
 const s=game(),p=s.individuals[0];
 s.worldTick=3700;
 Object.assign(s.weather,{kind:'sun',remaining:220,wind:10,transition:0});
 Object.assign(p,{species,x:.52,y:.64,B:58,energy:85,mood:85,nutrition:32,xp:23,visualStage:2});
 const bed=O.patch(s,'litter');
 bed.U=stock;bed.O=0;bed.S=15;
 const pile={id:'pile:60',x:p.x,y:p.y,O:8,U:.01,S:50,cap:100,W:0,playBoostUntil:0,born:0};
 pile.sector=F.Litter.sectorOf(pile);s.objects.litter.piles.push(pile);
 const spot=O.option(s,p,pile.id,'nutrition','nutrition');
 a.ok(!spot.fail,spot.fail);
 p.objectTask={...spot,serial:s.objects.nextSession++,since:s.worldTick,remaining:25,grade:2,deadline:s.worldTick+30};
 p.nextObjectChoice=s.worldTick+5;p.action='feed';p.target=pile.id;
 return {s,p,pile,bed};
}

test('a feeding tick that uses the last compost never reports that the friend is preparing to go',()=>{
 for(const species of ['superbum','neolbi','ridley']){
  const {s,p,pile}=compostVisit(species,0);
  F.step(s,{visible:false});
  a.equal(p.objectTask?.arrived,true,species);
  a.equal(p.motion.distance,0,species);
  a.equal(pile.U,0,species);
  a.ok(s.objects.ledger.absorbed>0,species);
  a.match(O.reason(s,p),/분해된 낙엽에서 영양을 얻고/,species);
  a.doesNotMatch(O.reason(s,p),/갈 준비/,species);
  F.advance(s,8,{visible:false});
  a.equal(p.objectTask?.object,pile.id,'trace compost can still be eaten when it is the only reachable supply');
  a.ok(F.valid(s));
 }
});

test('an existing saved feeding task leaves trickle compost for a reachable stocked litter bed',()=>{
 const {s,p,pile,bed}=compostVisit('superbum',20);
 F.step(s,{visible:false});
 a.equal(p.objectTask?.arrived,true);
 a.equal(pile.U,0);
 const loaded=F.migrate(JSON.parse(JSON.stringify(s))),friend=loaded.individuals[0],initial=friend.nutrition;
 F.advance(loaded,60,{visible:false});
 a.equal(friend.objectTask?.object,bed.id);
 a.ok(loaded.objects.ledger.absorbed>.6);
 a.ok(friend.nutrition>initial+.6,'the friend takes compost at the stocked site');
 a.doesNotMatch(O.reason(loaded,friend),/갈 준비/);
 a.ok(F.valid(loaded));
});
