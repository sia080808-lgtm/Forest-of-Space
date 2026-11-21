// SRS v2.36 친구 고유 스킬 (user: "케릭터별 고유 스킬들 … 잘 구현되어 있나?" → "ㄱㄱ")
const {test}=require('node:test'),a=require('node:assert/strict');
const web='../../app/src/main/assets/web',F=require(web+'/engine'),K=require(web+'/skills'),L=require(web+'/litter'),C=require(web+'/creatures');
const game=()=>{const s=F.create(0,2);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;s.weather.kind='sun';s.weather.precipitation=0;s.weather.wind=10;s.worldTick=300;return s;};
const friend=(s,species,x,y,more={})=>{const q=JSON.parse(JSON.stringify(s.individuals[0]));Object.assign(q,{id:'f-'+species+'-'+s.individuals.length,species,name:species,x,y,B:60,energy:80,nutrition:60,mood:80,damage:0,burden:0,xp:40,active:true,mounted:false,wetRecovery:false,leafRecovery:false,objectTask:null},more);delete q.objectTask;delete q.stroll;s.individuals.push(q);return q;};
const solo=s=>{s.individuals[0].active=false;};
const bal=s=>F.totalWater(s)-s.ledger.rain+s.ledger.evaporation+s.ledger.outflow+s.ledger.physiology-(s.ledger.lake||0)-(s.ledger.admin||0);
const run=(s,n)=>{for(let i=0;i<n;i++){s.worldTick++;K.prepare(s,{});for(const p of s.individuals.filter(p=>p.active))K.act(s,p,{});}};

test('SK-AC01·02 베이치 digs up damp soil water into a puddle (water conserved) that goes back to the soil after 600 s',()=>{const s=game();solo(s);const moss=s.patches.find(z=>z.id==='moss');
 for(const z of s.patches)z.S=0;moss.S=5;s.spring.water=s.spring.capacity*.2;const b=friend(s,'bosong',moss.x+.08,moss.y+.06);const w0=bal(s),S0=moss.S;
 run(s,60);const d=K.puddles(s)[0];a.ok(d,'a puddle was made');a.equal(d.from,'moss');a.ok(Math.abs(S0-moss.S-(d.W+s.ledger.evaporation))<1e-6||moss.S<S0);a.ok(Math.abs(bal(s)-w0)<1e-9,'water balance');
 a.ok(b.skillRest.dig>s.worldTick,'cooldown set');a.equal(K.today(s,b),1);a.ok(s.skills.seen.bosong);
 const S1=moss.S;run(s,K.SK.dig.life+5);a.equal(K.puddles(s).length,0,'gone after its life');a.ok(moss.S>S1,'the rest went back into the soil');a.ok(Math.abs(bal(s)-w0)<1e-9);});

test('SK-AC03 a thirsty friend is shown the puddle and drinks only there; anyone drinks from a nearer puddle',()=>{const s=game();solo(s);const moss=s.patches.find(z=>z.id==='moss');moss.S=5;s.spring.water=s.spring.capacity*.6;
 friend(s,'bosong',moss.x+.08,moss.y+.06);const r=friend(s,'ridley',moss.x+.2,moss.y+.08,{B:20}),w0=bal(s);
 run(s,40);const d=K.puddles(s)[0];a.ok(d);a.equal(r.guideTo?.kind,'puddle');a.equal(r.guideTo.id,d.id);
 for(let i=0;i<200&&!(r.B>40);i++)F.step(s);a.ok(r.B>20,'drank');a.ok(Math.abs(bal(s)-w0)<1e-6,'water balance '+(bal(s)-w0));});

test('SK-AC04 with no damp soil 베이치 shows a thirsty friend the nearest real water',()=>{const s=game();solo(s);for(const z of s.patches)z.S=0;const c=s.patches.find(z=>z.id==='crevice');c.W=5;s.spring.water=0;
 const b=friend(s,'bosong',c.x+.1,c.y+.05),r=friend(s,'ridley',c.x+.18,c.y+.06,{B:20});run(s,2);a.equal(r.guideTo?.kind,'crevice');a.equal(b.skill?.k,'guide');a.ok(b.skillRest.guide>s.worldTick);});

test('SK-AC05 코로나 carries loose leaves onto a pile; the floor-leaf count stays the same',()=>{const s=game();solo(s);const st=s.objects.litter;st.leaves=[];st.piles=[];
 const pile={id:'pile:'+st.nextPile++,sector:L.sectorOf({x:.5,y:.5}),x:.5,y:.5,O:6,U:0,S:50,cap:100,W:0,playBoostUntil:0,born:0};st.piles.push(pile);
 const sec=L.sectorOf({x:.3,y:.6});a.notEqual(sec,pile.sector);for(let i=0;i<3;i++)st.leaves.push({id:st.nextLeaf++,sector:sec,x:.28+i*.02,y:.6,rot:0,moved:0});
 const co=friend(s,'jureong',.26,.62);const f0=L.floor(s);let seen=false;
 for(let i=0;i<400;i++){run(s,1);a.ok(Math.abs(L.floor(s)-f0)<1e-9,'floor count at '+i);if(co.skill?.phase==='back')seen=true;}
 a.ok(seen,'carried one');a.equal(pile.O,9,'all three on the pile');a.equal(st.leaves.length,0);a.ok(co.skillRest.carry>0,'cooldown was set');a.equal(K.today(s,co),1);});

test('SK-AC06 리들리 brushes 15 off a friend whose leaves carry pests, holding it still for 20 s',()=>{const s=game();solo(s);const r=friend(s,'ridley',.4,.55),e=friend(s,'neolbi',.52,.56);
 const st=s.objects.creatures;st.groups.push({id:'cr:'+st.nextId++,kind:'mite',host:e.id,since:0,bad:0,lastWork:0,carry:null,density:30,low:0});
 let held=0;for(let i=0;i<60;i++){run(s,1);if(e.skillHold===r.id)held++;}a.equal(C.onLeaf(s,e.id).mite.density,15);a.ok(held>=19&&held<=21,'held '+held);a.ok(r.skillRest.brush>s.worldTick);a.equal(K.today(s,r),1);});

test('SK-AC07 beside moss a well 엘리시 moistens the leaves near it and calls natural enemies sooner',()=>{const s=game();solo(s);const moss=s.patches.find(z=>z.id==='moss');const e=friend(s,'bonbon',moss.x+.05,moss.y+.03),q=friend(s,'ridley',e.x+.08,e.y),far=friend(s,'ridley',e.x+.5,e.y);
 a.equal(K.moistLeaf(s,q),15);a.equal(K.moistLeaf(s,far),0);a.ok(K.assist(s,q));a.ok(!K.assist(s,far));e.energy=20;a.equal(K.moistLeaf(s,q),0,'not while tired');});

test('SK-AC08·09 a thirsty, tired or endangered friend does not start (and stops); a cooling-down skill waits',()=>{const s=game();solo(s);const moss=s.patches.find(z=>z.id==='moss');moss.S=5;s.spring.water=s.spring.capacity*.2;
 const b=friend(s,'bosong',moss.x+.08,moss.y+.06,{B:10});run(s,5);a.equal(K.puddles(s).length,0,'thirsty 베이치 does not dig');b.B=60;b.energy=20;run(s,5);a.equal(K.puddles(s).length,0,'tired');
 b.energy=80;s.weather.wind=70;run(s,5);a.equal(K.puddles(s).length,0,'strong wind');s.weather.wind=10;b.skillRest={dig:s.worldTick+100};run(s,30);a.equal(K.puddles(s).length,0,'cooling down');
 b.skillRest={};run(s,2);a.equal(b.skill?.k,'dig');b.B=10;run(s,1);a.equal(b.skill,undefined,'stops when thirsty');});

test('SK-AC10 skill records survive a save round trip and bad ones are refused',()=>{const s=game();const moss=s.patches.find(z=>z.id==='moss');moss.S=5;s.spring.water=s.spring.capacity*.2;friend(s,'bosong',moss.x+.08,moss.y+.06);
 for(let i=0;i<50;i++)F.step(s);const copy=JSON.parse(JSON.stringify(s));F.valid(copy);
 const bad=JSON.parse(JSON.stringify(s));bad.individuals[1].skill={k:'fly',start:0};a.throws(()=>F.valid(bad));
 const bad2=JSON.parse(JSON.stringify(s));bad2.skills={puddles:[{id:'pd:1',x:.5,y:.5,W:99,from:'moss',born:0}],nextId:2,seen:{}};a.throws(()=>F.valid(bad2));
 const old=JSON.parse(JSON.stringify(s));delete old.skills;for(const p of old.individuals){delete p.skill;delete p.skillRest;delete p.skillDay;}F.valid(old);});

test('SK skill info and card lines exist for every friend kind',()=>{for(const sp of ['superbum','bosong','neolbi','jureong','ridley','bonbon'])a.ok(K.INFO[sp]?.name&&K.INFO[sp].line);
 const s=game();const r=friend(s,'ridley',.4,.5);r.skill={k:'brush',target:s.individuals[0].id,phase:'do',start:s.worldTick};a.match(K.status(s,r),/잎을 털어 주고 있어요/);});
