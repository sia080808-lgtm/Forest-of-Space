// 0.8.3 쉼터에서 밤 잠·비 피하기, 막힌 자리에서 걸어 나오기 (user: "케릭들 쉼터에 쉬러 잘 안 가던데", "애들 길 못 찾아서 멍하게 있음").
const {test}=require('node:test'),a=require('node:assert/strict');
const F=require('../../app/src/main/assets/web/engine'),Sh=F.Shelter,Sp=require('../../app/src/main/assets/web/spatial');
const game=(seed=6)=>{const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;return s;};
const fed=s=>{for(const p of s.individuals)Object.assign(p,{B:60,energy:70,nutrition:65,mood:70,damage:0,burden:0,wetRecovery:false,leafRecovery:false});};   // no urgent need (a thirsty friend drinks first, even at night)
const friend=(s,sp,x,y)=>{const p={...F.clone(s.individuals[0]),id:'p-'+sp,species:sp,name:sp,x,y,active:true};s.individuals.push(p);return p;};
const calm=s=>{s.weather.kind='sun';s.weather.intensity=0;s.weather.wind=5;s.weather.remaining=600;};
test('SL-01 at night a friend without an urgent need goes to sleep in the shelter and stays until dawn',()=>{
 const s=game();const p=s.individuals[0];fed(s);s.worldTick=600;
 let slept=0,night=0;for(let t=0;t<560;t++){calm(s);F.step(s);const tt=s.worldTick%1200;if(tt>=780&&tt<1050){night++;   /* 1.0 (SRS v2.34 ST34-09): deep night 750..1050 for everyone */if(Sh.inside(s,p)&&p.objectTask?.reason==='sleep')slept++;if(tt===900)a.match(Sh.label(s,p),/자고/);}}
 a.ok(slept/night>.75,'asleep in the shelter '+slept+'/'+night);
 for(let t=0;t<120;t++){calm(s);F.step(s);}a.notEqual(p.objectTask?.reason,'sleep','up at dawn');
});
test('SL-02 a full shelter: the others sleep on moss, in shade or by the stones (nobody waits all night outside)',()=>{
 const s=game();for(const [sp,x,y] of [['bonbon',.6,.55],['bosong',.7,.4],['jureong',.52,.42],['ridley',.45,.62]])friend(s,sp,x,y);fed(s);s.worldTick=700;
 let n=0,asleep=0,inside=0,waiting=0;for(let t=0;t<350;t++){calm(s);F.step(s);if(t<80)continue;   /* 1.0: deep night 750..1050 */n++;for(const p of s.individuals){if(p.objectTask?.reason==='sleep')asleep++;if(Sh.inside(s,p))inside++;if(p.shelter?.phase==='waitingOutside')waiting++;}}
 a.ok(asleep/n>=4,'asleep '+(asleep/n).toFixed(2));a.ok(inside/n>=1.5&&inside/n<=3,'inside '+(inside/n).toFixed(2));a.ok(waiting/n<.25,'waiting '+(waiting/n).toFixed(2));
});
test('SL-03 rain: 베이치 (dislikes rain) takes shelter, a rain lover stays out in light rain, 엘레판 and friends beside it keep the leaf umbrella',()=>{
 const s=game();const r=s.individuals[0];r.x=.6;r.y=.7;const b=friend(s,'bosong',.62,.5),n=friend(s,'neolbi',.15,.85),c=friend(s,'bonbon',.2,.8);fed(s);s.worldTick=100;
 for(let t=0;t<90;t++){s.weather.kind='rain';s.weather.intensity=40;s.weather.remaining=200;s.weather.wind=10;F.step(s);}
 a.equal(b.objectTask?.reason,'shelterRain');a.notEqual(r.objectTask?.reason,'shelterRain','ridley likes light rain');a.notEqual(n.objectTask?.reason,'shelterRain');a.notEqual(c.objectTask?.reason,'shelterRain','near 엘레판');
 for(let t=0;t<30;t++){s.weather.kind='rain';s.weather.intensity=80;s.weather.remaining=200;F.step(s);}a.equal(r.objectTask?.reason,'shelterRain','heavy rain: ridley too');
});
test('SL-04 a friend left inside the spring basin or the shelter walls walks out and finds its way (no frozen "길을 찾고 있어요")',()=>{
 const s=game(3),p=s.individuals[0];
 for(const q of [{x:s.spring.x+.05,y:s.spring.y},{x:.287,y:.066},{x:.449,y:.106}]){Object.assign(p,q);a.ok(Sp.route(s,p,Sp.socket(s,'spring'),p.id)||Sp.route(s,p,{x:.6,y:.6},p.id),JSON.stringify(q));}
 Object.assign(p,{x:.449,y:.106});let stuck=0;for(let t=0;t<120;t++){F.step(s);if(!p.objectTask&&p.objectWait?.reason==='blocked_path')stuck++;}a.ok(stuck<10,'stuck '+stuck);
});
// 1.2.3 (user: "봄에 큰비로 … 아무도 안 들어가", "밤에도 아무도 안 들어감"): with 엘레판's umbrella already over one friend, the
// other friends near it waited for it forever in the rain; and a seat blocked by a friend already sitting was booked again all night
test('1.2.3 heavy rain at noon and a drizzly night both fill the shelter seats',()=>{const F=require('../../app/src/main/assets/web/engine'),A=require('../../app/src/main/assets/web/admin.js'),assert=require('node:assert/strict');
 const make=()=>{const s=F.create(5,4);s.started=true;s.environment.tutorialDone=true;for(const [sp,x,y] of [['bonbon',.6,.55],['neolbi',.3,.6],['bosong',.42,.5],['jureong',.5,.7]])s.individuals.push({...F.clone(s.individuals[0]),id:'p-'+sp,species:sp,name:sp,x,y,active:true});F.valid(s);return s;};
 const inside=s=>s.individuals.filter(p=>p.shelter?.phase==='restingInside').length;
 let s=make();A.run(F,s,'time','noon');A.run(F,s,'weather','rain');for(let t=0;t<60;t++){s.weather.remaining=Math.max(s.weather.remaining,30);F.step(s);}assert.equal(inside(s),3);
 s=make();A.run(F,s,'time','noon');A.run(F,s,'weather','drizzle');for(let t=0;t<450;t++){s.weather.remaining=Math.max(s.weather.remaining,30);F.step(s);}assert.equal(s.worldTick%1200>=800,true);assert.equal(inside(s),3);});
// 1.2.4 (user: "폭풍치는데 아무도 안 들어가"): the whole storm counts as heavy rain, and friends who find the shelter full take the crevice instead of waiting outside
test('1.2.4 a summer storm: friends take cover from the first second, the crevice takes one when the shelter is full',()=>{const F=require('../../app/src/main/assets/web/engine'),A=require('../../app/src/main/assets/web/admin.js'),assert=require('node:assert/strict');
 const s=F.create(5,4);s.started=true;s.environment.tutorialDone=true;for(const [sp,x,y] of [['bonbon',.6,.55],['neolbi',.3,.6],['bosong',.42,.5],['jureong',.5,.7],['superbum',.7,.4]])s.individuals.push({...F.clone(s.individuals[0]),id:'p-'+sp,species:sp,name:sp,x,y,active:true});F.valid(s);A.run(F,s,'time','noon');for(let i=0;i<200;i++)F.step(s);
 s.environment.storm={phase:'prelude',remaining:20};Object.assign(s.weather,{kind:'rain',intensity:35,wind:45,transition:0,remaining:240});s.environment.windTarget=45;
 for(let t=0;t<12;t++)F.step(s);const covering=s.individuals.filter(p=>['shelterRain','safety'].includes(p.objectTask?.reason)).length;assert.ok(covering>=3,'prelude cover '+covering);
 for(let t=0;t<38;t++)F.step(s);assert.equal(s.environment.storm.phase,'peak');assert.equal(s.individuals.filter(p=>p.shelter?.phase==='restingInside').length,3);assert.ok(s.individuals.some(p=>p.objectTask?.object==='crevice'),'crevice used');
 assert.ok(!s.individuals.some(p=>p.shelter?.phase==='waitingOutside'),'nobody waits outside a full shelter');});
// 1.2.6 (user: "겨울에도 안 들어가고 큰 비에도 안들어가고 강풍에도 안 들어가고 … 원인 분석하라고" → "묶어줘 pr")
const play=(seed=4)=>{const s=F.create(5,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;for(const [sp,x,y] of [['bonbon',.6,.55],['neolbi',.3,.6],['bosong',.42,.5],['jureong',.5,.7],['superbum',.7,.4]])s.individuals.push({...F.clone(s.individuals[0]),id:'p-'+sp,species:sp,name:sp,x,y,active:true});F.valid(s);return s;};
test('1.2.6 a garden played for 2 hours, then heavy rain at noon: most friends take cover, nobody waits beside 엘레판 for an umbrella that never opens, no seat is held with nothing to do',()=>{const A=require('../../app/src/main/assets/web/admin.js');
 const s=play();for(let i=0;i<7200;i++)F.step(s);A.run(F,s,'time','noon');A.run(F,s,'weather','rain');let ghost=0,cov=0,n=0;   /* before 1.2.6: covered 12%, 슈퍼범 sat inside with nothing to do 180 of 180 s */
 for(let t=0;t<180;t++){s.weather.remaining=Math.max(s.weather.remaining,30);F.step(s);if(t<20)continue;for(const p of s.individuals){if(p.shelter?.phase==='restingInside'&&!p.objectTask&&p.action!=='rest')ghost++;if(p.species==='superbum')continue;n++;
  if(p.shelter?.phase==='restingInside'||s.social.sessions.some(x=>x.type==='CANOPY'&&x.ids.includes(p.id)&&x.phase==='rest')||p.objectTask&&['crevice','shade'].includes(p.objectTask.object)&&F.Objects.at(s,p))cov++;}}
 a.ok(ghost<30,'seat held with nothing to do '+ghost+'s');a.ok(cov/n>=.6,'covered '+(100*cov/n).toFixed(0)+'%');});
test('1.2.6 heavy rain: a hungry friend takes cover instead of wandering to compost that is closed',()=>{const A=require('../../app/src/main/assets/web/admin.js');const s=play();for(let i=0;i<200;i++)F.step(s);A.run(F,s,'time','noon');A.run(F,s,'weather','rain');
 const p=s.individuals.find(q=>q.species==='bonbon');Object.assign(p,{nutrition:30,B:50,energy:90});F.Objects.release(s,p,'interrupt');p.nextObjectChoice=0;for(let t=0;t<6;t++){s.weather.remaining=Math.max(s.weather.remaining,30);F.step(s);}
 a.notEqual(p.objectTask?.reason,'nutrition');a.ok(['shelterRain','safety'].includes(p.objectTask?.reason)||s.social.sessions.some(x=>x.ids.includes(p.id)),'covering: '+p.objectTask?.reason+' / '+p.objectWait?.reason);});

// 1.2.9 (user: "엘리시 쉼터에 들어갔다 나왔다 … 반복만 하고 있음"): with 리들리 resting by the door, 엘리시 took longer than its booking
// to walk round it, so the booking ran out a tick before it sat down; it walked out and booked the same seat again every 29 s.
test('1.2.9 엘리시 does not walk in and out of the shelter while 리들리 rests at the door', () => {
  const s=F.create(0,2);s.started=true;s.environment.tutorialDone=true;
  const q=JSON.parse(JSON.stringify(s.individuals[0]));Object.assign(q,{id:'ell',species:'bonbon',name:'엘리시',x:.45,y:.55,walkPlan:null,motion:{kind:'idle',distance:0,tick:0}});s.individuals.push(q);
  let prev='',enters=0,rested=false;
  for(let i=0;i<1100;i++){F.step(s,1);if(i<760)continue;const p=s.individuals.find(x=>x.id==='ell'),ph=p.shelter?.phase;if(ph!==prev&&ph==='entering')enters++;if(ph==='restingInside')rested=true;prev=ph;}
  a.ok(rested,'엘리시 sat down in the shelter');a.ok(enters<=3,`entered ${enters} times in 340 s`);a.ok(F.valid(s),'save check');
});

// 1.2.9 (user: "길을 막고 있으면 그 자리에서 두세 번 서성이다가 지나가더라"): a corner of the kept way already walked through
// stayed as the next point, so the friend turned back to it and paced to and fro until the way was searched again.
test('1.2.9 a friend walking round another does not pace back and forth', () => {
  const s=F.create(0,2);s.started=true;s.environment.tutorialDone=true;
  const q=JSON.parse(JSON.stringify(s.individuals[0]));Object.assign(q,{id:'ell',species:'bonbon',name:'엘리시',x:.45,y:.55,walkPlan:null,motion:{kind:'idle',distance:0,tick:0}});s.individuals.push(q);
  let flips=0,last=null;
  for(let i=0;i<1100;i++){const p=s.individuals.find(x=>x.id==='ell'),x=p.x,y=p.y;F.step(s,1);if(i<760)continue;const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy);if(d<1e-5){last=null;continue;}if(last&&dx*last[0]+dy*last[1]<-.8*d*Math.hypot(...last))flips++;last=[dx,dy];}
  a.ok(flips<=1,`turned back ${flips} times`);
});

// 1.2.9 (user: "리들리는 … 수분이 적정치 아래인데 자고 있더라"): a friend asleep in the shelter never went to the lake, so with
// the spring dry it stayed thirsty through the night.
test('1.2.9 a thirsty friend in the shelter walks out to the lake when the spring is dry', () => {
  const W=require('../../app/src/main/assets/web/world'),V=require('../../app/src/main/assets/web/vitals');
  const s=game(3),p=s.individuals[0];p.xp=20;W.openLake(s);const day=()=>((s.worldTick%1200)+1200)%1200;while(day()!==800)F.step(s,1);
  const dry=()=>{s.spring.water=0;s.spring.snowWater=0;for(const z of s.patches)z.S=0;s.weather.kind='sun';s.weather.intensity=0;s.weather.transition=0;s.environment.precipFrom=null;s.weather.until=s.worldTick+999;};
  a.equal(p.shelter.phase,'restingInside');p.B=V.band(p).lo-2;let drank=false;
  for(let i=0;i<300&&!drank;i++){dry();F.step(s,1);if(p.B>=V.band(p).mid-1)drank=true;}
  a.ok(drank,`still thirsty: ${p.B.toFixed(1)}`);a.ok(F.valid(s),'save check');
});

// 1.2.10 (user: "쉼터 찾으러 가다가 쉼터 차 있으면 … 다시 차 있던 쉼터 갔다가 … 무한 뺑뺑이"): friends that had picked the
// shelter but were not booked yet were not counted, so in rain everyone walked to the door, waited 8 s and gave up.
test('1.2.10 friends do not walk to a shelter that others have already filled', () => {
  const A=require('../../app/src/main/assets/web/admin.js');let waits=0;
  for(const seed of [1,2,3]){const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;
   const base=s.individuals[0];for(const [sp,x,y] of [['bonbon',.45,.55],['neolbi',.6,.4],['bosong',.3,.6],['jureong',.7,.7],['superbum',.5,.8],['ridley',.62,.62]]){const q=F.clone(base);Object.assign(q,{id:'k'+sp+String(x).replace('.',''),species:sp,name:sp,x,y,motion:{kind:'idle',distance:0,tick:0}});delete q.walkPlan;s.individuals.push(q);}
   F.valid(s);for(let i=0;i<300;i++)F.step(s,1);A.run(F,s,'time','noon');A.run(F,s,'weather','rain');const prev={};
   for(let i=0;i<900;i++){s.weather.until=s.worldTick+999;F.step(s,1);for(const p of s.individuals){const w=p.shelter?.phase==='waitingOutside'&&p.objectTask?.object==='shelter';if(w&&!prev[p.id])waits++;prev[p.id]=w;}}
   a.ok(F.valid(s));}
  a.ok(waits<=1,`waited at a full shelter door ${waits} times`);
});
test('1.2.19 a shelter door shut by friends standing still (under the leaf umbrella) counts like a full shelter: 8 s, then elsewhere for 5 minutes',()=>{
 const F=require('../../app/src/main/assets/web/engine'),O=F.Objects;const s=F.create(0,4);s.started=true;s.recruitment.nextAttempt=1e9;const p=s.individuals[0];p.B=50;p.nutrition=50;p.energy=100;
 const task=()=>({object:'shelter',reason:'sleep',free:false,since:s.worldTick,deadline:s.worldTick+200});
 p.objectTask=task();p.shelter={phase:'moving',facilityId:'shelter-0',since:s.worldTick};p.walkPlan={tx:.3,ty:.2,at:s.worldTick,legacy:false,pts:[{x:.3,y:.2}]};
 for(let i=0;i<10;i++)(p.nextObjectChoice=s.worldTick+1e6,O.choose(s,p,()=>.99));a.equal(p.objectTask?.object,'shelter','a friend that is still finding its way keeps going');
 p.shelter={phase:'rerouting',since:s.worldTick};for(let i=0;i<7;i++){(p.nextObjectChoice=s.worldTick+1e6,O.choose(s,p,()=>.99));a.equal(p.objectTask?.object,'shelter');}
 (p.nextObjectChoice=s.worldTick+1e6,O.choose(s,p,()=>.99));a.notEqual(p.objectTask?.object,'shelter','given up after 8 s');a.equal(p.restCooldown,s.worldTick+300);
 p.restCooldown=0;p.objectTask=task();p.shelter={phase:'moving',facilityId:'shelter-0',since:s.worldTick};p.walkPlan={tx:.3,ty:.2,at:s.worldTick,legacy:false,pts:[],fx:p.x,fy:p.y};
 for(let i=0;i<9;i++)(p.nextObjectChoice=s.worldTick+1e6,O.choose(s,p,()=>.99));a.notEqual(p.objectTask?.object,'shelter','a search that found no way counts too');
 p.restCooldown=0;p.objectTask=task();p.shelter={phase:'waitingOutside',waitReason:'crowd',since:s.worldTick};for(let i=0;i<9;i++)(p.nextObjectChoice=s.worldTick+1e6,O.choose(s,p,()=>.99));a.equal(p.restCooldown,s.worldTick+120,'a full shelter still waits 2 minutes');
});
test('1.2.19 a failed search also covers a target that drifts a little (no search every second)',()=>{
 const F=require('../../app/src/main/assets/web/engine'),Sp=require('../../app/src/main/assets/web/spatial');const s=F.create(0,4);s.started=true;const p=s.individuals[0];
 p.walkPlan={tx:.5,ty:.5,at:s.worldTick,legacy:false,pts:[],fx:p.x,fy:p.y};
 const x=p.x,y=p.y,r=Sp.travel(s,p,{x:.52,y:.51});a.equal(r.distance,0,'within 0.03 and 3 s: not searched again, stays put');a.equal(p.x,x);a.equal(p.y,y);a.equal(p.walkPlan.tx,.5,'the kept failure is untouched');
});
