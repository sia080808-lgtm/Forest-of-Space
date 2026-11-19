// 0.8.3 쉼터에서 밤 잠·비 피하기, 막힌 자리에서 걸어 나오기 (user: "케릭들 쉼터에 쉬러 잘 안 가던데", "애들 길 못 찾아서 멍하게 있음").
const {test}=require('node:test'),a=require('node:assert/strict');
const F=require('../../app/src/main/assets/web/engine'),Sh=F.Shelter,Sp=require('../../app/src/main/assets/web/spatial');
const game=(seed=6)=>{const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;return s;};
const fed=s=>{for(const p of s.individuals)Object.assign(p,{B:60,energy:70,nutrition:65,mood:70,damage:0,burden:0,wetRecovery:false,leafRecovery:false});};   // no urgent need (a thirsty friend drinks first, even at night)
const friend=(s,sp,x,y)=>{const p={...F.clone(s.individuals[0]),id:'p-'+sp,species:sp,name:sp,x,y,active:true};s.individuals.push(p);return p;};
const calm=s=>{s.weather.kind='sun';s.weather.intensity=0;s.weather.wind=5;s.weather.remaining=600;};
test('SL-01 at night a friend without an urgent need goes to sleep in the shelter and stays until dawn',()=>{
 const s=game();const p=s.individuals[0];fed(s);s.worldTick=600;
 let slept=0,night=0;for(let t=0;t<560;t++){calm(s);F.step(s);const tt=s.worldTick%1200;if(tt>=700&&tt<1150){night++;if(Sh.inside(s,p)&&p.objectTask?.reason==='sleep')slept++;if(tt===900)a.match(Sh.label(s,p),/자고/);}}
 a.ok(slept/night>.75,'asleep in the shelter '+slept+'/'+night);
 for(let t=0;t<120;t++){calm(s);F.step(s);}a.notEqual(p.objectTask?.reason,'sleep','up at dawn');
});
test('SL-02 a full shelter: the others sleep on moss, in shade or by the stones (nobody waits all night outside)',()=>{
 const s=game();for(const [sp,x,y] of [['bonbon',.6,.55],['bosong',.7,.4],['jureong',.52,.42],['ridley',.45,.62]])friend(s,sp,x,y);fed(s);s.worldTick=600;
 let n=0,asleep=0,inside=0,waiting=0;for(let t=0;t<540;t++){calm(s);F.step(s);if(t<120)continue;n++;for(const p of s.individuals){if(p.objectTask?.reason==='sleep')asleep++;if(Sh.inside(s,p))inside++;if(p.shelter?.phase==='waitingOutside')waiting++;}}
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
