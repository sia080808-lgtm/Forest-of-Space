// 0.9.0 동쪽 호수 물가 (SRS v2.33): region, water, unlock by walks after the forest has grown, saves
const {test}=require('node:test'),a=require('node:assert/strict');
const F=require('../../app/src/main/assets/web/engine'),W=F.World,Sp=F.Space;
const game=(seed=2)=>{const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;return s;};
const fed=s=>{for(const p of s.individuals)Object.assign(p,{B:60,energy:80,nutrition:70,mood:90,damage:0,burden:0,wetRecovery:false,leafRecovery:false});};
const calm=s=>{s.weather.kind='sun';s.weather.intensity=0;s.weather.wind=5;s.weather.remaining=200;};
const three=s=>{const b=JSON.stringify(s.individuals[0]);while(s.individuals.filter(p=>p.active).length<3){const q=JSON.parse(b);q.id='lk'+s.individuals.length;q.x=.3+.1*s.individuals.length;q.y=.6;s.individuals.push(q);}};

test('LK-01 a save without the lake keeps the forest only; the shore adds x 1.25..1.75 and walking stops at the water',()=>{
 const s=game();a.equal(W.lakeOpen(s),false);a.deepEqual(W.bounds(s),{x0:-.25,y0:-.25,x1:1.25,y1:1.25});a.equal(W.inWater(s,{x:1.7,y:.56}),false);
 s.world.regions=[...s.world.regions,'lakeshore'];a.equal(W.bounds(s).x1,1.75);
 const id=s.individuals[0].id;a.ok(Sp.walkable(s,{x:1.35,y:.56},id),'the shore');a.equal(Sp.walkable(s,{x:1.65,y:.56},id),false,'the water');
 a.ok(W.inWater(s,{x:1.7,y:.56})&&!W.inWater(s,{x:1.35,y:.56}));F.valid(s);
 const back=F.migrate(JSON.parse(JSON.stringify(s)));F.valid(back);a.equal(W.lakeOpen(back),true);
});
test('LK-02 the shore opens after the forest has grown (3 friends, one season) and three walks smell water at the east edge',()=>{
 const s=game();three(s);fed(s);calm(s);s.worldTick=200;F.step(s);a.equal(s.world.lake?.ready,false,'too early');
 s.worldTick=(s.environment.calendar?.start??0)+3600;
 for(let t=0;t<6000&&!W.lakeOpen(s);t++){fed(s);calm(s);const n=(s.environment.calendar?.start??0)+3600+t;s.worldTick=n;if(n%1200>=600)s.worldTick=n+600;F.step(s);}
 a.ok(s.world.lake.ready,'ready');a.equal(W.lakeOpen(s),true,'opened by walks; scents '+s.world.lake.scents);a.equal(s.world.lake.scents,3);a.ok(Number.isSafeInteger(s.world.lake.openedAt));
 a.ok(s.events.some(e=>e.type==='world'&&/물 냄새/.test(e.text))&&s.events.some(e=>/물가가 열렸어요/.test(e.text)));F.valid(s);
});
test('LK-03 nothing can be placed on the water; a bad lake record is refused',()=>{
 const s=game();s.world.regions=[...s.world.regions,'lakeshore'];
 const moss=s.patches.find(p=>p.id==='moss');a.throws(()=>F.validateLayout(s,{[moss.id]:{x:1.56,y:.56}}),/물가/);
 const bad=game();bad.world.lake={ready:'yes',scents:0};a.throws(()=>F.valid(bad),/호수/);
 const bad2=game();bad2.world.regions=['forest','sea'];a.throws(()=>F.valid(bad2));
});
test('LK-04 water lilies appear at random on open water from late spring, grow through their stages, fade in autumn, clear in winter',()=>{
 const run=seed=>{const s=game(seed);s.world.regions=[...s.world.regions,'lakeshore'];const c0=s.environment.calendar?.start??0;const stages=new Set();
  for(let t=2400;t<7200;t++){s.worldTick=c0+t;W.lakeStep(s);for(const l of s.world.lake.lilies)stages.add(W.lilyStage(s,l));}
  return {s,stages,c0};};
 const {s,stages,c0}=run(2),L=s.world.lake.lilies;
 a.ok(L.length>=1&&L.length<=W.LILY.max,'count '+L.length);
 for(const l of L){a.ok(W.inWater(s,l)&&W.waterD(l.x,l.y)>.55&&W.waterD(l.x,l.y)<.94,'on open water');for(const m of L)if(m!==l)a.ok(Math.hypot(l.x-m.x,(l.y-m.y)*.62)>=W.LILY.gap);}
 for(const st of ['leaf','bud','half','full'])a.ok(stages.has(st),'saw '+st);F.valid(s);
 a.deepEqual(run(2).s.world.lake.lilies,L,'same seed, same lilies');
 for(let t=7200;t<7200+1000;t++){s.worldTick=c0+t;W.lakeStep(s);}a.ok(s.world.lake.lilies.every(l=>['sink','wither'].includes(W.lilyStage(s,l))),'autumn: sinking or withered');
 s.worldTick=c0+10800+5;W.lakeStep(s);a.equal(s.world.lake.lilies.length,0,'winter ice clears them');
 const bad=game();bad.world.regions=['forest','lakeshore'];bad.world.lake={ready:true,scents:3,lilies:[{id:'x',x:'1',y:.5,born:0}]};a.throws(()=>F.valid(bad),/호수/);
});
test('LK-05 the admin switch opens the shore at once (no growth conditions, no walks) and only once',()=>{
 const s=game();a.equal(W.openLake(s),true);a.equal(W.lakeOpen(s),true);a.equal(s.world.lake.scents,3);a.equal(W.openLake(s),false);a.equal(s.world.regions.filter(r=>r==='lakeshore').length,1);F.valid(s);
});
test('LK-06 lake neighbours: spring eggs grow into tadpoles and frogs, summer brings the pest and those that eat it, winter clears them',()=>{
 const s=game(3);s.world.regions=[...s.world.regions,'lakeshore'];const c0=s.environment.calendar?.start??0,kinds=new Set();
 for(let t=0;t<7200;t++){s.worldTick=c0+t;s.weather.wind=5;s.weather.kind='sun';W.lakeStep(s);for(const o of s.world.lake.life)kinds.add(o.kind);}
 for(const k of ['eggs','tadpole','frog','strider','snail','medaka','larva','dragonfly'])a.ok(kinds.has(k),'saw '+k+' ('+[...kinds]+')');
 for(const o of s.world.lake.life){if(['frog','nymph','dragonfly'].includes(o.kind))continue;a.ok(W.inWater(s,o),o.kind+' on the water');}
 for(const [k,n] of Object.entries(W.LIFE.cap))a.ok(s.world.lake.life.filter(o=>o.kind===k).length<=n,k+' cap');F.valid(s);
 // the pest bothers a friend standing next to it
 const p=s.individuals[0];s.world.lake.life.push({id:'lifeX',kind:'larva',x:1.45,y:.5,born:s.worldTick});p.x=1.45;p.y=.5;p.mood=50;p.active=true;W.lakeStep(s);a.ok(p.mood<50);
 s.worldTick=c0+10800+5;s.world.lake.nextLife=0;W.lakeStep(s);a.equal(s.world.lake.life.length,0,'winter clears them');
 const bad=game();bad.world.regions=['forest','lakeshore'];bad.world.lake={ready:true,scents:3,life:[{id:'x',kind:'shark',x:1.5,y:.5,born:0}]};a.throws(()=>F.valid(bad),/호수/);
});
