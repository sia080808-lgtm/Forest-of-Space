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
