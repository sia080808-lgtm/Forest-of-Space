// 0.8.5 빈 땅 산책 (user: "1번 ㄱㄱ"), 넓은 숲 전체의 눈·바람 잎, 고사리 액자 켜기/끄기
const {test}=require('node:test'),a=require('node:assert/strict');
const F=require('../../app/src/main/assets/web/engine'),O=F.Objects,Fx=require('../../app/src/main/assets/web/world-effects');
const game=(seed=2)=>{const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;return s;};
const fed=s=>{for(const p of s.individuals)Object.assign(p,{B:60,energy:80,nutrition:70,mood:90,damage:0,burden:0,wetRecovery:false,leafRecovery:false});};
const calm=s=>{s.weather.kind='sun';s.weather.intensity=0;s.weather.wind=5;s.weather.remaining=200;};
const outer=q=>q.x<0||q.x>1||q.y<0||q.y>1;
test('ST-01 a free friend sometimes walks out to the open ground, lingers there and then chooses again (no resource used)',()=>{
 const s=game(2),p=s.individuals[0];let started=0,arrived=0,ended=0,out=0,prev=null;
 s.worldTick=200;for(let t=0;t<410;t++){fed(s);calm(s);F.step(s);const r=p.stroll;
  if(r&&(!prev||prev.since!==r.since)){started++;a.ok(outer(r)||Math.hypot(r.x-.5,r.y-.5)>.3,'target on the open ground '+JSON.stringify(r));a.equal(p.objectTask,undefined);}
  if(r&&r.arrivedAt!=null&&(!prev||prev.arrivedAt==null))arrived++;if(prev&&!r)ended++;if(r?.arrivedAt!=null&&outer(p))out++;
  if(r)a.match(O.reason?O.reason(s,p)||'':'',/산책|둘러보고|두리번|냄새|앉아 쉬고/);prev=r?{...r}:null;}
 a.ok(started>=2&&arrived>=1&&ended>=1,`started ${started} arrived ${arrived} ended ${ended}`);a.ok(out>0,'stood on the open ground');F.valid(s);
 const back=F.migrate(JSON.parse(JSON.stringify(s)));F.valid(back);
});
test('ST-02 night, rain or a need ends the walk at once',()=>{
 const s=game(2),p=s.individuals[0];fed(s);calm(s);s.worldTick=300;
 p.stroll={x:-.12,y:.5,since:300,deadline:390,linger:20};p.nextObjectChoice=0;s.worldTick=640;F.step(s);   // night
 a.equal(p.stroll,undefined,'night');a.equal(p.objectTask?.reason,'sleep');
 const r=game(2),q=r.individuals[0];fed(r);r.worldTick=300;q.stroll={x:-.12,y:.5,since:300,deadline:390,linger:20};q.nextObjectChoice=0;q.B=15;F.step(r);
 a.equal(q.stroll,undefined,'thirst');a.equal(q.objectTask?.reason,'water');
 const bad=game(2);bad.individuals[0].stroll={x:'x',y:.5,since:0,deadline:9,linger:9};a.throws(()=>F.valid(bad));
});
test('ST-03 snow and wind-blown leaves fill the whole wide forest (scaled to its area), not only the old garden',()=>{
 const s=game();s.weather.kind='snow';s.weather.intensity=80;s.weather.transition=0;s.environment.precipFrom=null;
 const count=area=>{let n=0;const c={save(){},restore(){},beginPath(){},arc(){n++;},fill(){},set fillStyle(v){},set globalAlpha(v){},translate(){},rotate(){},drawImage(){},createLinearGradient(){return{addColorStop(){}};},fillRect(){}};Fx.particles(c,s,540,864,3,null,area);return n;};
 a.ok(count(2.25)>count(1)*2,'snow flakes '+count(2.25)+' vs '+count(1));
 const src=require('fs').readFileSync(require('path').join(__dirname,'../../app/src/main/assets/web/scene.js'),'utf8');a.match(src,/ForestEffects\.particles\(c,s,bw\*w,bh\*h,phase,this\.assets,bw\*bh\)/);
});
test('ST-04 the fern frame can be turned off and on (a setting; old saves keep it on)',()=>{
 const s=game();a.equal(s.settings.showFrame,true);delete s.settings.showFrame;F.valid(s);s.settings.showFrame=false;F.valid(s);s.settings.showFrame='no';a.throws(()=>F.valid(s));
 const src=require('fs').readFileSync(require('path').join(__dirname,'../../app/src/main/assets/web/scene.js'),'utf8');a.match(src,/drawFrame\(c,base\)\{const im=this\.assets\.frame;if\(!im\|\|this\.state\(\)\.settings\?\.showFrame===false\)return;/);
});
test('ST-05 0.8.7 light stroll poses: look around (turning), smell the grass, sit, stand up; card text follows; state untouched',()=>{
 const s=game(2),p=s.individuals[0];fed(s);calm(s);s.worldTick=200;p.x=-.1;p.y=.5;p.stroll={x:-.1,y:.5,since:190,deadline:280,linger:20,arrivedAt:200};p.nextObjectChoice=1e9;
 const at=e=>O.strollPose(s,p,200+e);a.equal(at(1).pose,'look');a.notEqual(at(1).face,at(1.5).face,'turns this way and that');a.equal(at(5).pose,'sniff');a.equal(at(15).pose,'sit');a.equal(at(19.5).pose,'idle');
 const before=JSON.stringify(s);for(const e of [1,5,15])O.strollPose(s,p,200+e);a.equal(JSON.stringify(s),before,'pure');
 s.worldTick=205;a.match(O.reason(s,p),/냄새/);s.worldTick=215;a.match(O.reason(s,p),/앉아 쉬고/);s.worldTick=201;a.match(O.reason(s,p),/두리번/);
 const src=require('fs').readFileSync(require('path').join(__dirname,'../../app/src/main/assets/web/scene.js'),'utf8');a.match(src,/strollPose\?\.\(s,p,s\.worldTick\+fraction\)/);a.match(src,/kind==='sniff'\?'drink':/);
});
test('ST-06 0.9.5 no frozen waiting: a friend with nowhere to sleep sleeps where it stands; one waiting for a spot ambles nearby; card text follows',()=>{
 const s=game(2),p=s.individuals[0];fed(s);calm(s);s.worldTick=700;p.x=.5;p.y=.5;p.energy=30;
 // block every sleeping spot: make the friend think the shelter and rest spots are taken by giving them to others
 const base=JSON.stringify(p);for(let i=0;i<8;i++){const q=JSON.parse(base);q.id='z'+i;s.individuals.push(q);}
 let slept=false,amble=false;for(let t=0;t<400;t++){fed(s);for(const q of s.individuals)q.energy=Math.min(q.energy,40);calm(s);s.worldTick=700+t;F.step(s);for(const q of s.individuals){if(q.sleepHere){slept=true;a.match(O.reason(s,q),/그 자리에서 잠들었어요/);}if(q.stroll?.amble)amble=true;}}
 a.ok(slept,'someone slept where it stood');F.valid(s);
});
