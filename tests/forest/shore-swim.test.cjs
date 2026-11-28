const {test}=require('node:test');
const assert=require('node:assert/strict');
const F=require('../../app/src/main/assets/web/engine');
const Vit=require('../../app/src/main/assets/web/vitals');
const Tr=require('../../app/src/main/assets/web/traits');

function game(species='ridley'){
 const s=F.create(0,2);
 s.started=true;F.World.openLake(s);s.worldTick=3709;
 Object.assign(s.weather,{kind:'sun',wind:3,intensity:0,remaining:180,transition:0});
 Object.assign(s.climate,{T:60,L:50});
 const shore=F.World.nearShore(s,{x:1.46,y:.67});
 const p=s.individuals[0];
 Object.assign(p,{species,x:shore.x-.032,y:shore.y+.105,B:45,nutrition:65,energy:70,nextObjectChoice:9999});
 const m={...F.clone(p),id:'maria-1',species:'maria',name:'마리아',x:shore.x-.10,y:shore.y-.02,B:46,xp:150,visualStage:3};
 s.individuals.push(m);
 return {s,m,p};
}
function started(s){
 for(let i=0;i<14&&s.world.lake.swim?.started==null;i++)F.step(s);
 const a=s.world.lake.swim;
 assert(a&&a.started!=null,'the invitation and dry approaches must complete');
 return a;
}
test('Maria swims with every existing species and each finishes at its own water limit',()=>{
 for(const [species] of F.SPECIES.filter(([id])=>id!=='maria')){
  const {s,m,p}=game(species),a=started(s);
  assert.equal(a.duration,10);
  const before=p.B;
  const lakeBefore=s.ledger.lake||0;
  const sample=F.Swim.pose(s,m.id,.5);
  assert(sample&&!F.World.inWater(s,m),'physical state remains on the bank');
  const durationEnd=a.started+F.Swim.END;
  while(s.worldTick<durationEnd){
   F.step(s);
   for(const swimmer of [p,m]){
    assert(!F.World.inWater(s,swimmer));
    assert(swimmer.B<=Vit.band(swimmer).hi+1e-8);
    const q=F.Swim.pose(s,swimmer.id,.5);
    if(q?.depth===1)assert(F.World.inWater(s,q));
   }
  }
  assert.equal(p.B,65,species);
  assert.equal(m.B,75);
  assert((s.ledger.lake||0)-lakeBefore>p.B-before);
  assert.equal(s.events.filter(e=>e.type==='swim').length,2);
  F.valid(s);
  F.step(s);
  assert(!F.Swim.busy(s,p.id));
  assert.equal(m.swimAfter,s.worldTick+120);
  assert.equal(p.swimAfter,s.worldTick+120);
 }
});
test('a sudden wind cancels water intake after a save round trip; no completion refill',()=>{
 const {s,p}=game();
 started(s);
 F.advance(s,7);
 const restored=F.migrate(JSON.parse(JSON.stringify(s)));
 const lake=restored.ledger.lake;
 const water=restored.individuals.find(x=>x.id===p.id).B;
 assert(water>45&&water<65);
 Object.assign(restored.weather,{wind:75,remaining:180});
 F.step(restored);
 assert(!restored.world.lake.swim);
 assert.equal(restored.ledger.lake,lake);
 assert(restored.individuals.find(x=>x.id===p.id).B<65);
 F.valid(restored);
});
test('Maria can swim with someone else after two minutes and with the same friend after five',()=>{
 const {s,m,p}=game(),positions=[{x:m.x,y:m.y},{x:p.x,y:p.y}],a=started(s);
 F.advance(s,a.started+F.Swim.END+1-s.worldTick);
 const finished=s.worldTick;
 assert.equal(s.world.lake.swimPairs[m.id+':'+p.id],finished+300);
 const next=F.migrate(F.clone(s)),[buddy,maria]=next.individuals;
 for(const [i,swimmer] of [maria,buddy].entries()){
  F.Objects.release(next,swimmer,'interrupt');F.Shelter.release(swimmer,next.worldTick);
  delete swimmer.shelterRequest;
  Object.assign(swimmer,positions[i],{B:45});
 }
 const other={...F.clone(buddy),id:'other',active:true};
 next.individuals.push(other);buddy.active=false;
 const offerAt=tick=>{next.worldTick=tick;F.Swim.offer(next,null);return next.world.lake.swim;};
 const decision=tick=>Math.ceil(tick/10)*10;
 assert.equal(offerAt(decision(finished+120)-10),undefined);
 assert.deepEqual(offerAt(decision(finished+120))?.ids,[maria.id,other.id]);
 delete next.world.lake.swim;buddy.active=true;other.active=false;
 assert.equal(offerAt(decision(finished+300)-10),undefined);
 assert.deepEqual(offerAt(decision(finished+300))?.ids,[maria.id,buddy.id]);
 F.valid(next);
});

test('canceling at the bank before entry sets only the 30-second retry wait',()=>{
 const {s,m,p}=game();
 started(s);F.Swim.cancel(s);
 assert.equal(m.swimAfter,s.worldTick+30);
 assert.equal(p.swimAfter,s.worldTick+30);
 assert.equal(s.world.lake.swimPairs,undefined);
 F.valid(s);
});

test('a swim saved by the previous build completes its original 20-second swim',()=>{
 const {s,m,p}=game(),a=started(s);
 delete a.duration;
 const restored=F.migrate(F.clone(s));
 F.advance(restored,a.started+27-restored.worldTick);
 assert.equal(restored.individuals.find(q=>q.id===p.id).B,65);
 assert.equal(restored.individuals.find(q=>q.id===m.id).B,75);
 F.step(restored);assert.equal(restored.world.lake.swim,undefined);
 F.valid(restored);
});

test('Maria can be recruited only at the open lake and uses a reserved founding personality',()=>{
 const {s}=game();
 s.individuals.pop();
 assert(F.Recruitment.conditions(s,'maria',F.Space,F.Social).ok);
 const guest=F.Recruitment.arrive(s,'maria',F.personality);
 assert.equal(guest.pet.name,'마리아');
 assert.deepEqual(guest.pet.personality,{version:1,a:-1,c:1,e:-1});
 F.Recruitment.open(s);
 F.Recruitment.act(s,'greet');
 for(let i=0;i<70;i++)F.Recruitment.encounterStep(s);
 assert(guest.ready);
 assert.equal(F.Recruitment.settle(s,F.event).B,50);
 F.valid(s);
 const forest=F.create(0,2);
 assert(!F.Recruitment.conditions(forest,'maria',F.Space,F.Social).ok);
 assert.equal(Object.values(Tr.HEX.maria).reduce((a,b)=>a+b),18);
});
test('friends with urgent thirst keep their normal water task and nobody swims on ice',()=>{
 const {s,p}=game();p.B=26;
 F.Swim.offer(s,null);
 F.step(s);
 assert(!s.world.lake.swim);
 assert(p.B<40);
 p.B=45;s.worldTick=10800;
 assert(F.World.frozen(s));
 F.Swim.offer(s,null);
 assert(!s.world.lake.swim);
});
