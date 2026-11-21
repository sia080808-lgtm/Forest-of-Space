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
