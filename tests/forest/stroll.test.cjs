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
 p.stroll={x:-.12,y:.5,since:300,deadline:390,linger:20};p.nextObjectChoice=0;s.worldTick=800;F.step(s);   // deep night (1.0: 750..1050)
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
test('ST-06 0.9.5 no frozen waiting: a friend with nowhere to sleep sleeps where it stands; card text follows',()=>{
 const s=game(2),p=s.individuals[0];fed(s);calm(s);s.worldTick=800;p.x=.5;p.y=.5;p.energy=30;
 // block every sleeping spot: make the friend think the shelter and rest spots are taken by giving them to others
 const base=JSON.stringify(p);for(let i=0;i<12;i++){const q=JSON.parse(base);q.id='z'+i;s.individuals.push(q);}   /* 1.0: more friends than every spot (9 fit now) */
 let slept=false;for(let t=0;t<400;t++){fed(s);for(const q of s.individuals)q.energy=Math.min(q.energy,40);calm(s);s.worldTick=800+t;F.step(s);for(const q of s.individuals){if(q.sleepHere){slept=true;a.match(O.reason(s,q),/그 자리에서 잠들었어요/);}}}
 a.ok(slept,'someone slept where it stood');F.valid(s);
});
test('ST-1.2.18 shore walks in every season (spring 30%, summer 50%, autumn 25%), some in the morning to any shore around the lake',()=>{const W=require('../../app/src/main/assets/web/world');
 const at=(season,tod)=>{const s=game(4);fed(s);calm(s);W.openLake(s);const k={spring:0,summer:1,autumn:2}[season];s.worldTick=Math.ceil(s.worldTick/1200)*1200+tod;s.environment.calendar.start=s.worldTick-k*3600-10;return s;};
 const seq=v=>{let i=0;return ()=>v[Math.min(i++,v.length-1)];};
 a.deepEqual({...O.SHORE_WALK},{spring:.3,summer:.5,autumn:.25,winter:.15});
 const nearWater=(s,q)=>[...Array(21)].some((_,j)=>W.inWater(s,{x:q.x+.15*Math.cos(j*.3),y:q.y+.15*Math.sin(j*.3)}));
 {const s=at('spring',100),p=s.individuals[0];const q=O.strollTarget(s,p,seq([.1,.9,.5]));a.ok(q?.view&&!q.cool&&!q.far,'a spring morning walk to the nearest shore');a.ok(nearWater(s,q));}
 {const s=at('spring',100),p=s.individuals[0];const q=O.strollTarget(s,p,seq([.1,.1,.97,.5]));a.ok(q?.view&&q.far,'a quarter of morning shore walks go anywhere around the lake');a.ok(Math.hypot(q.x-p.x,q.y-p.y)>.6&&nearWater(s,q));}
 {const s=at('spring',500),p=s.individuals[0];const q=O.strollTarget(s,p,seq([.1,.1,.5]));a.ok(q?.view&&!q.far,'no far walks in the afternoon');}
 {const s=at('autumn',100),p=s.individuals[0];a.ok(O.strollTarget(s,p,seq([.24,.9,.5]))?.view);a.ok(!O.strollTarget(s,p,seq([.26,.9,.5]))?.view,'autumn 25%');}
 {const s=at('summer',100),p=s.individuals[0];const q=O.strollTarget(s,p,seq([.4,.9,.5]));a.ok(q?.cool&&!q.view,'summer stays a cool-off walk');}
 {const s=at('spring',100),p=s.individuals[0];p.stroll={x:2,y:.5,view:true,since:s.worldTick,deadline:s.worldTick+90,linger:10};a.match(O.reason(s,p)||'',/호수|물가/);F.validate?.(s);}
});

test('a sunny winter ice walk reaches the lake, glides and stops when wind rises',()=>{
 const s=game(),p=s.individuals[0];fed(s);calm(s);
 s.world.regions.push('lakeshore');s.worldTick=(s.environment.calendar?.start??0)+10900;
 const target=O.strollTarget(s,p,()=>.35);a.ok(target?.ice);
 Object.assign(p,{x:target.x,y:target.y,stroll:{...target,since:s.worldTick,deadline:s.worldTick+225,linger:12}});
 O.stroll(s,p);a.equal(p.stroll.arrivedAt,s.worldTick);
 O.stroll(s,p);a.equal(p.stroll.gliding,true);a.ok(p.stroll.x>target.x);
 s.weather.wind=30;O.stroll(s,p);a.equal(p.stroll,undefined);
});
test('cool winter forest: a healthy friend leaves the garden, reaches ice and completes the return glide',()=>{
 const s=game(4),p=s.individuals[0];fed(s);F.World.openLake(s);s.worldTick=12000;
 s.environment.climate='C03';s.environment.climateMode='fixed';s.climate.T=25;
 let reached=false,turned=false;
 for(let t=0;t<350&&!turned;t++){
  calm(s);F.step(s);
  if(p.stroll?.ice&&F.World.onIce(s,p))reached=true;
  if(p.stroll?.glideLeg===2&&p.stroll.arrivedAt!=null)turned=true;
 }
 a.ok(reached);a.ok(turned);F.valid(s);
});
