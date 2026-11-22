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

test('SK-AC04 with no damp soil 베이치 shows a thirsty friend the nearest real water',()=>{const s=game();solo(s);for(const z of s.patches)z.S=0;const c=s.patches.find(z=>z.id==='crevice');c.W=12;s.spring.water=0;
 const b=friend(s,'bosong',c.x+.1,c.y+.05),r=friend(s,'ridley',c.x+.18,c.y+.06,{B:20});run(s,2);a.equal(r.guideTo?.kind,'crevice');a.equal(b.skill?.k,'guide');a.ok(b.skillRest.guide>s.worldTick);});

test('SK-AC05 코로나 Lv1 sweeps one loose leaf onto another so they make a pile; the floor-leaf count stays the same',()=>{const s=game();solo(s);const st=s.objects.litter;st.leaves=[];st.piles=[];
 const sec=L.sectorOf({x:.3,y:.6});for(let i=0;i<3;i++)st.leaves.push({id:st.nextLeaf++,sector:sec,x:.27+i*.03,y:.6+i*.01,rot:0,moved:0});
 const co=friend(s,'jureong',.2,.66,{xp:0});const f0=L.floor(s);let raked=0;
 for(let i=0;i<120;i++){run(s,1);a.ok(Math.abs(L.floor(s)-f0)<1e-9,'floor count at '+i);if(co.skill?.phase==='rake')raked++;}
 const pile=st.piles.find(p=>p.sector===sec);a.ok(pile,'a pile was made in that sector');a.equal(pile.O,2,'one leaf swept onto another');a.equal(st.leaves.length,1);a.equal(raked,2,'2 s a leaf');
 a.ok(co.skillRest.rake>0,'cooldown was set');a.equal(K.today(s,co),1);a.ok(co.energy<80,'cost 기운');
 co.skillRest={};run(s,60);a.equal(pile.O,3,'next time it sweeps the last leaf onto the pile');a.equal(st.leaves.length,0);
 co.skillRest={};st.leaves.push({id:st.nextLeaf++,sector:L.sectorOf({x:.9,y:.2}),x:.9,y:.2,rot:0,moved:0});run(s,5);a.equal(co.skill,undefined,'a lone leaf far from anything is not raked');});

test('SK-LV 1.1.3 skill levels: 코로나 Lv10 sweeps 5 at once, 리들리 Lv10 brushes all, values follow the table',()=>{
 const s=game();solo(s);const st=s.objects.litter;st.leaves=[];st.piles=[];const sec=L.sectorOf({x:.3,y:.6});
 st.piles.push({id:'pile:'+st.nextPile++,sector:sec,x:.3,y:.6,O:2,U:0,S:50,cap:100,W:0,playBoostUntil:0,born:0});
 for(let i=0;i<6;i++)st.leaves.push({id:st.nextLeaf++,sector:L.sectorOf({x:.22+i*.03,y:.66}),x:.22+i*.03,y:.66,rot:0,moved:0});
 friend(s,'jureong',.2,.7,{xp:150});const f0=L.floor(s);for(let i=0;i<60;i++)run(s,1);a.equal(st.piles[0].O,7,'5 swept onto the pile');a.equal(st.leaves.length,1);a.ok(Math.abs(L.floor(s)-f0)<1e-9);
 const r=friend(s,'ridley',.6,.4,{xp:150}),e=friend(s,'neolbi',.7,.41);const cr=s.objects.creatures;cr.groups.push({id:'cr:'+cr.nextId++,kind:'mite',host:e.id,since:0,bad:0,lastWork:0,carry:null,density:90,low:0});
 for(let i=0;i<60;i++)run(s,1);a.equal(C.onLeaf(s,e.id).mite.density,0,'Lv10 brushes them all off');a.ok(r.skillRest.brush-s.worldTick<=120);
 const row=(sp,xp)=>({species:sp,xp});a.equal(K.lv(row('bosong',0),'dig','amount'),8);a.equal(K.lv(row('bosong',8),'dig','amount'),10);a.equal(K.lv(row('bosong',115),'dig','rest'),480);
 a.equal(K.lv(row('jureong',0),'rake','count'),1);a.equal(K.lv(row('jureong',115),'rake','count'),4);a.equal(K.lv(row('ridley',40),'brush','amount'),50);
 a.deepEqual(K.umbrella(row('neolbi',0)),{rain:.5,wind:.4,limit:70});a.deepEqual(K.umbrella(row('neolbi',115)),{rain:.8,wind:.65,limit:80});a.deepEqual(K.share(row('superbum',40)),{total:14,nest:45});
 const v=K.levelLines(row('ridley',115));a.equal(v.level,9);a.equal(v.next.level,10);a.match(v.next.line,/모두/);a.equal(K.levelLines(row('bosong',115)).next,null,'no step left for 베이치 at Lv9');});

test('SK-AC06 리들리 brushes 15 off a friend whose leaves carry pests, holding it still for 20 s',()=>{const s=game();solo(s);const r=friend(s,'ridley',.4,.55,{xp:0}),e=friend(s,'neolbi',.52,.56);
 const st=s.objects.creatures;st.groups.push({id:'cr:'+st.nextId++,kind:'mite',host:e.id,since:0,bad:0,lastWork:0,carry:null,density:30,low:0});
 let held=0;for(let i=0;i<60;i++){run(s,1);if(e.skillHold===r.id)held++;}a.equal(C.onLeaf(s,e.id).mite.density,15);a.ok(held>=19&&held<=21,'held '+held);a.ok(r.skillRest.brush>s.worldTick);a.equal(K.today(s,r),1);});

test('SK-AC07 beside moss a well 엘리시 moistens the leaves near it and calls natural enemies sooner',()=>{const s=game();solo(s);const moss=s.patches.find(z=>z.id==='moss');const e=friend(s,'bonbon',moss.x+.05,moss.y+.03,{xp:0}),q=friend(s,'ridley',e.x+.08,e.y),far=friend(s,'ridley',e.x+.5,e.y);
 a.equal(K.moistLeaf(s,q),15);a.equal(K.moistLeaf(s,far),0);a.ok(K.assist(s,q));a.ok(!K.assist(s,far));e.energy=20;a.equal(K.moistLeaf(s,q),0,'not while tired');});

test('SK-1.2.7 엘리시 also keeps leaves moist beside the spring, a puddle or the lakeshore, and anywhere on rain or fog days',()=>{const s=game();solo(s);const W=require(web+'/world'),Sh=require(web+'/shelter'),moss=s.patches.find(z=>z.id==='moss');
 let spot=null;for(let x=.1;x<=.9&&!spot;x+=.05)for(let y=.1;y<=.9&&!spot;y+=.05){const q={x,y};if(Math.hypot(x-moss.x,y-moss.y)>.3&&Math.hypot(x-s.spring.x,y-s.spring.y)>.3)spot=q;}
 const e=friend(s,'bonbon',spot.x,spot.y,{xp:0}),on=()=>K.misters(s).some(m=>m.id===e.id);a.ok(!Sh.inside(s,e));
 a.ok(!on(),'dry, sunny and away from water: off');
 e.x=s.spring.x+.1;e.y=s.spring.y+.05;s.spring.water=5;a.ok(on(),'beside the spring');s.spring.water=0;a.ok(!on(),'not by an empty spring');
 e.x=spot.x;e.y=spot.y;s.skills={puddles:[],nextId:2,seen:{}};s.skills.puddles=[{id:'pd:1',x:spot.x+.08,y:spot.y,W:4,from:'moss',born:s.worldTick,by:'x'}];a.ok(on(),'beside a puddle');s.skills.puddles=[];
 s.weather.kind='rain';s.weather.intensity=50;s.weather.transition=0;a.ok(on(),'rain day');s.weather.kind='fog';a.ok(on(),'fog day');s.weather.kind='sun';s.weather.intensity=0;a.ok(!on());
 W.openLake(s);e.x=W.LAKE.cx-W.LAKE.ru*1.15;e.y=W.LAKE.cy;a.ok(!W.inWater(s,e)&&W.waterD(e.x,e.y)<1.3);a.ok(on(),'on the lakeshore');});

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

test('1.2.12 a friend 베이치 showed to a spring that ran dry looks for other water at once instead of idling for the 120 s guide',()=>{const s=game();solo(s);require(web+'/world').openLake(s);const moss=s.patches.find(z=>z.id==='moss');s.spring.water=0;
 const r=friend(s,'ridley',moss.x,moss.y,{B:22});r.guideTo={kind:'spring',id:'spring',x:moss.x,y:moss.y,until:s.worldTick+120,by:'x'};r.nextObjectChoice=s.worldTick;
 for(let i=0;i<60;i++)F.step(s);a.equal(r.guideTo,undefined,'the stale guide is dropped');a.ok(r.B>22,'drank elsewhere within a minute (B '+r.B.toFixed(1)+')');});

test('1.2.12 베이치 does not show a nearly empty spring (or one other friends are already heading to); it shows the lake instead',()=>{const s=game();solo(s);require(web+'/world').openLake(s);for(const z of s.patches)z.S=0;s.patches.find(z=>z.id==='crevice').W=0;
 const sp=s.spring;sp.water=4;const b=friend(s,'bosong',sp.x+.1,sp.y+.05),r=friend(s,'ridley',sp.x+.06,sp.y+.04,{B:20});run(s,2);a.equal(r.guideTo?.kind,'lake','4 water is not a real drink');
 delete r.guideTo;b.skillRest={};b.skill=undefined;sp.water=30;run(s,2);a.equal(r.guideTo?.kind,'spring','enough water: the nearer spring');
 delete r.guideTo;b.skillRest={};b.skill=undefined;sp.water=15;const o=friend(s,'jureong',sp.x+.3,sp.y,{B:20});o.guideTo={kind:'spring',id:undefined,x:sp.x,y:sp.y,until:s.worldTick+100,by:b.id};run(s,2);a.equal(r.guideTo?.kind,'lake','what is left after the other friend is not enough');});
