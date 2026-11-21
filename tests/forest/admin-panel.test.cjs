const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine'),A=require('../../app/src/main/assets/web/admin.js');
// 1.2.0 관리자 모드 패널: the new admin actions change the real save through a transaction and keep it valid
const world=()=>{let s=F.create(5,3);s.started=true;for(let i=0;i<300;i++)F.step(s);return s;};
const run=(s,...args)=>{let msg;const next=F.transaction(s,x=>{msg=A.run(F,x,...args);},()=>true);return [next,msg];};
test('ADM-01 sliders set water (booked in the ledger), nutrition, energy and level for one friend',()=>{let s=world();const id=s.individuals[0].id,w0=F.totalWater?F.totalWater(s):null;
 [s]=run(s,'set',id,'B',80);[s]=run(s,'set',id,'nutrition',20);[s]=run(s,'set',id,'energy',30);[s]=run(s,'set',id,'level',5);const p=s.individuals.find(q=>q.id===id);
 a.equal(p.B,80);a.equal(p.nutrition,20);a.equal(p.energy,30);a.equal(F.level(p),5);a.throws(()=>run(s,'set',id,'xp',3));a.throws(()=>run(s,'set',id,'level',99));
 for(let i=0;i<60;i++)F.step(s);a.doesNotThrow(()=>F.valid(s));});
test('ADM-02 skill rest clears and the friend chooses again',()=>{let s=world();const id=s.individuals[0].id;s.individuals[0].skillRest={brush:s.worldTick+500};[s]=run(s,'skillReady',id);a.deepEqual(s.individuals[0].skillRest,{});});
test('ADM-03 small neighbours called on purpose stay valid; at most two pest kinds',()=>{let s=world();const id=s.individuals[0].id;
 for(const k of ['mite','mealy','keeper','lady','soilmite','ant'])[s]=run(s,'creature',k,id);const kinds=s.objects.creatures.groups.map(g=>g.kind);for(const k of ['mite','mealy','keeper','lady','soilmite','ant'])a.ok(kinds.includes(k),k);
 a.throws(()=>run(s,'creature','gnat',''),/두 종류/);a.throws(()=>run(s,'creature','mite',id),/이미/);for(let i=0;i<120;i++)F.step(s);a.doesNotThrow(()=>F.valid(s));});
test('ADM-04 sun rock, climate back to every season, fireflies need the lake',()=>{let s=world();[s]=run(s,'rockSun',true);a.equal(s.patches.find(p=>p.id==='rock').sun,100);
 [s]=run(s,'climate','C04');a.equal(s.environment.climateMode,'fixed');[s]=run(s,'climateAuto');a.equal(s.environment.climateMode,undefined);a.throws(()=>run(s,'fireflies'),/호수/);
 F.World.openLake(s);[s]=run(s,'fireflies');a.equal(F.Environment.season(s),'summer');a.equal(F.World.fireflies(s),true);});
// 1.2.3 (user: "톡토기 누르니까 작은이웃 기록을 확인해주세요"): the springtail button made a group of kind 'spring' that the save check rejects
test('ADM-05 calling a springtail makes a valid springtail on a leaf pile; at most two',()=>{let s=world();const L=F.Litter,pile=(id,x)=>({id,sector:L.sectorOf({x,y:.5}),x,y:.5,O:12,U:0,S:55,cap:100,W:0,playBoostUntil:0,born:0});
 s.objects.litter.piles=s.objects.litter.piles.filter(p=>![.1,.6,1.1].some(x=>p.sector===L.sectorOf({x,y:.5})));s.objects.litter.leaves=s.objects.litter.leaves.filter(l=>![.1,.6,1.1].some(x=>l.sector===L.sectorOf({x,y:.5})));s.objects.litter.piles.push(pile('pile:90',.1),pile('pile:91',.6),pile('pile:92',1.1));s.objects.creatures.groups=s.objects.creatures.groups.filter(g=>g.kind!=='springtail');
 [s]=run(s,'creature','spring','');[s]=run(s,'creature','spring','');const sp=s.objects.creatures.groups.filter(g=>g.kind==='springtail');a.equal(sp.length,2);a.notEqual(sp[0].pile,sp[1].pile);a.ok(s.objects.creatures.seen.springtail);
 a.throws(()=>run(s,'creature','spring',''),/두 무리/);for(let i=0;i<60;i++)F.step(s);a.doesNotThrow(()=>F.valid(s));});
// 1.2.6 (user: "관리자모드에서 검수실 기능 삭제 · 친구 항목에서 해당 케릭터의 스킬 연출 볼 수 있게 스킬 사용 키"): '스킬 보기' starts each friend's
// real skill on the garden (or walks 엘리시 to the moss), and the save check still passes
test('1.2.6 스킬 보기 runs every friend\'s skill',()=>{const F=require('../../app/src/main/assets/web/engine'),A=require('../../app/src/main/assets/web/admin.js'),S=require('../../app/src/main/assets/web/skills.js'),assert=require('node:assert/strict');
 const s=F.create(5,4);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;for(const [sp,x,y] of [['bonbon',.6,.55],['neolbi',.3,.6],['bosong',.42,.5],['jureong',.5,.7],['superbum',.7,.4]])s.individuals.push({...F.clone(s.individuals[0]),id:'p-'+sp,species:sp,name:sp,x,y,active:true});
 F.valid(s);for(let i=0;i<600;i++)F.step(s);A.run(F,s,'time','morning');A.run(F,s,'weather','sun');for(let i=0;i<5;i++)F.step(s);
 const want={ridley:'brush:do',bosong:'dig:sniff',jureong:'rake:rake',neolbi:'soc:CANOPY',superbum:'soc:A04',bonbon:'mist'};
 for(const p of s.individuals){const t=F.clone(s);A.run(F,t,'skillShow',p.id);F.valid(t);const q=t.individuals.find(z=>z.id===p.id),seen=new Set();
  for(let i=0;i<90;i++){F.step(t);if(q.skill)seen.add(q.skill.k+':'+q.skill.phase);const a=t.social.sessions.find(a=>a.ids[0]===q.id);if(a)seen.add('soc:'+a.type);if(S.misters(t).some(e=>e.id===q.id))seen.add('mist');}
  F.valid(t);assert.ok(seen.has(want[p.species]),p.species+' '+[...seen]);}});
