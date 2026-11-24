const {test}=require('node:test');
const assert=require('node:assert/strict');
const F=require('../../app/src/main/assets/web/engine');
const Cards=require('../../app/src/main/assets/web/object-cards');
const Sh=F.Shelter;

function garden(){
 const s=F.create(0,18);
 s.started=true;
 s.environment.tutorialDone=true;
 s.recruitment.nextAttempt=1e9;
 F.World.openLake(s);
 return s;
}
function discover(s){
 s.worldTick=7199;
 F.step(s);
 return s.shelters.facilities.find(Sh.isRock);
}

test('an existing lake save opens the south once and preserves all three ordinary shelters',()=>{
 const old=garden();
 old.shelters.unlocked=true;
 Sh.build(old,null,'add',{x:1.35,y:.03});
 Sh.build(old,null,'add',{x:.45,y:.012});
 old.worldTick=7198;
 const entrance=F.World.entrance(old),s=F.migrate(JSON.parse(JSON.stringify(old)));
 F.step(s);
 assert.equal(F.World.southOpen(s),false);
 assert.equal(F.Space.walkable(s,{x:2,y:1.60}),false);
 F.step(s);
 const f=s.shelters.facilities.find(Sh.isRock);
 assert.equal(s.shelters.facilities.length,4);
 assert.equal(f.level,1);
 assert.deepEqual(s.shelters.facilities.filter(f=>!Sh.isRock(f)),old.shelters.facilities);
 assert.deepEqual(F.World.entrance(s),entrance);
 assert.ok(F.Space.route(s,F.Space.socket(s,'spring'),Sh.entry(f)));
 assert.ok(F.Space.route(s,{x:1.03,y:1.05},{x:2.23,y:1.70}));
 assert.match(s.events.at(-1).text,/남쪽 숲.*바위쉼터/);
 F.advance(s,6);
 assert.equal(s.events.filter(e=>e.discovery==='south-rock-shelter').length,1);
 F.valid(s);
});

test('rock shelter keeps its identity, mirror and upgrades through moving, storage, reload and selected restoration',()=>{
 const s=garden(),f=discover(s),id=f.id;
 assert.equal(Cards.model(s,id).name,'바위쉼터');
 Sh.build(s,id,'move',{x:.92,y:1.61,flip:true});
 Sh.build(s,id,'store');
 assert.equal(Sh.facility(s,id),undefined);
 const loaded=F.migrate(JSON.parse(JSON.stringify(s)));
 F.advance(loaded,2);
 assert.equal(loaded.shelters.facilities.some(Sh.isRock),false);
 assert.equal(loaded.shelters.unlocked,false);
 Sh.build(loaded,id,'restore');
 let live=Sh.facility(loaded,id);
 assert.deepEqual([live.kind,live.x,live.y,live.flip],['stone',.92,1.61,true]);
 loaded.shelters.unlocked=true;
 for(const [level,capacity,seats] of [[1,12,3],[2,16,4],[3,24,5]]){
  if(level>1){
   const before=Sh.transform(live);
   Sh.build(loaded,id,'expand');
   live=Sh.facility(loaded,id);
   assert.ok(Sh.transform(live).extra>before.extra);
   assert.ok(Sh.transform(live).sy>before.sy);
  }
  const standard={...live,kind:undefined};
  assert.equal(live.level,level);
  assert.equal(Sh.capacity(live),capacity);
  assert.equal(Sh.seats(live),seats);
  assert.deepEqual(Sh.polygon(live),Sh.polygon(standard));
 }
 assert.match(Cards.model(loaded,id).name,/큰 바위쉼터/);
 Sh.build(loaded,id,'store');
 Sh.build(loaded,null,'add',{x:1.35,y:.03});
 assert.equal(Sh.storedFor(loaded,'restore',id).level,3);
 Sh.build(loaded,id,'restore');
 assert.equal(Sh.facility(loaded,id).level,3);
 F.valid(loaded);
});

test('all adult species can walk into the level-one rock shelter',()=>{
 for(const species of ['ridley','neolbi','superbum','bonbon','bosong','jureong','duri']){
  const s=garden(),f=discover(s),e=Sh.entry(f),p=s.individuals[0];
  s.worldTick=8200;
  Object.assign(s.weather,{kind:'cloud',wind:10,intensity:0,remaining:240,transition:0});
  Object.assign(p,{species,xp:150,visualStage:3,x:e.x+.01,y:e.y+.07,energy:60,mood:75,B:55,nutrition:60,
   action:'rest',target:'shelter',sleepHere:false,stroll:null,objectTask:null,nextObjectChoice:0,shelter:{phase:'outside',since:0}});
  for(let n=0;n<45&&!Sh.inside(s,p);n++)F.step(s);
  assert.equal(p.shelter.facilityId,f.id,species);
  assert.ok(Sh.inside(s,p),species);
  assert.throws(()=>Sh.build(s,f.id,'store'),/모두 나온 뒤/);
  if(species==='superbum'){
   s.worldTick=8400;
   p.energy=80;
   for(let n=0;n<20&&p.shelter.facilityId===f.id;n++)F.step(s);
   assert.notEqual(p.shelter.facilityId,f.id);
   assert.ok(p.y>1.25,'the exit is near the rock shelter');
  }
 }
});

test('a free morning walk can reach the southern meadow and yields when the friend needs water',()=>{
 const s=garden(),p=s.individuals[0],O=F.Objects;
 discover(s);
 s.worldTick=7300;
 Object.assign(s.weather,{kind:'sun',wind:30,intensity:0,remaining:240,transition:0});
 Object.assign(p,{x:.87,y:.98,B:55,nutrition:65,energy:74,action:'wander',target:null,shelter:{phase:'outside',since:0}});
 O.release(s,p);
 delete p.stroll;
 p.nextObjectChoice=0;
 const rolls=[.6,.9,.01,.75,.5],rng=()=>rolls.shift()??.5;
 O.choose(s,p,rng);
 assert.ok(p.stroll?.south);
 assert.ok(p.stroll.y>1.25);
 assert.equal(p.stroll.board,undefined);
 assert.match(O.reason(s,p),/남쪽 숲/);
 for(let n=0;n<110&&p.stroll?.arrivedAt==null;n++)F.step(s);
 assert.ok(p.stroll?.arrivedAt>=7300);
 assert.ok(p.y>1.25);
 p.B=15;p.nextObjectChoice=0;
 O.choose(s,p,()=>.5);
 assert.equal(p.stroll?.south,undefined);
 assert.equal(p.action,'drink');
});
