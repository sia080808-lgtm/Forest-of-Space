const {test}=require('node:test');
const assert=require('node:assert/strict');
const F=require('../../app/src/main/assets/web/engine');
const V=require('../../app/src/main/assets/web/vitals');
const cards=require('../../app/src/main/assets/web/object-cards');
function setup(){
 const s=F.create(0,4);s.started=true;s.environment.tutorialDone=true;s.worldTick=200;
 Object.assign(s.weather,{kind:'sun',wind:0,remaining:180,transition:0});
 F.World.openLake(s);F.Boat.step(s,null,()=>0);
 const b=s.world.lake.boat,p=s.individuals[0];
 Object.assign(p,{x:b.x,y:b.y,nutrition:55,B:64,energy:60,stroll:{view:true,x:b.x,y:b.y,arrivedAt:200,since:190,deadline:260,linger:14}});
 return {s,p,b};
}
test('loop, point caps, both parasites, saved milestones and cooldown',()=>{
 let {s,p,b}=setup();
 const origin={x:b.x,y:b.y},startEnergy=p.energy;
 F.Boat.step(s,null,()=>0);assert.equal(b.rider,p.id);
 for(let age=1;age<=30;age++){
  s.worldTick++;F.Boat.step(s,null,()=>0);
  if(age===10){assert.equal(p.B,65);assert.ok(F.World.inWater(s,p));s=F.migrate(JSON.parse(JSON.stringify(s)));b=s.world.lake.boat;p=s.individuals.find(q=>q.id===b.rider);}
  if(age===15)assert.ok(Math.abs(p.energy-startEnergy-300/V.band(p).max)<1e-6);
 }
 assert.equal(b.rider,undefined);assert.equal(p.B,65);assert.deepEqual({x:p.x,y:p.y},origin);
 assert.equal(p.boatAfter,s.worldTick+600);assert.equal(cards.model(s,'lily-boat').name,'떠다니는 연잎');
});
test('failed boarding is checked once and wind aborts before dew',()=>{
 const {s,p,b}=setup();F.Boat.step(s,null,()=>.99);F.Boat.step(s,null,()=>0);assert.equal(b.rider,undefined);
 delete p.stroll.boatChecked;F.Boat.step(s,null,()=>0);assert.equal(b.rider,p.id);
 s.weather.wind=30;s.worldTick++;F.Boat.step(s,null,()=>0);assert.equal(b.rider,undefined);assert.equal(p.B,64);
});
test('engine lets rider stay afloat and disembark once',()=>{
 const {s,p,b}=setup();F.Boat.step(s,null,()=>0);
 for(let i=0;i<30;i++){F.step(s);if(i===10){assert.ok(F.World.inWater(s,p));assert.equal(b.rider,p.id);F.valid(s);}}
 assert.equal(b.rider,undefined);assert.ok(!F.World.inWater(s,p));
});
test('dew never raises an over-wet rider and shaking removes each pest once',()=>{
 const {s,p,b}=setup();p.B=72;
 const groups=s.objects.creatures.groups;
 groups.push({kind:'mite',host:p.id,density:5},{kind:'mealy',host:p.id,density:1});
 F.Boat.step(s,null,()=>0);assert.equal(b.rider,p.id);
 for(let i=0;i<18;i++){s.worldTick++;F.Boat.step(s,null,()=>0);}
 const leaf=F.Creatures.onLeaf(s,p.id);
 assert.equal(leaf.mite.density,3);assert.equal(leaf.mealy.density,0);assert.equal(p.B,72);
});
test('empty leaf drifts to another bank while a thirsty visitor stays ashore',()=>{
 const {s,p,b}=setup();p.B=20;F.Boat.step(s,null,()=>0);assert.equal(b.rider,undefined);
 const x=b.x;s.worldTick=b.nextDrift;F.Boat.step(s,null,()=>0);
 for(let i=0;i<60;i++){s.worldTick++;F.Boat.step(s,null,()=>0);}
 assert.ok(Math.abs(b.x-x)>.3);assert.equal(b.drift,undefined);
});
function crossing(){
 const {s,p,b}=setup(),east=F.World.nearShore(s,{x:3,y:.55});
 p.x=b.x-.35;p.y=b.y;
 p.stroll={...east,far:true,view:true,since:s.worldTick,deadline:s.worldTick+225,linger:12};
 F.Boat.offerCrossing(s,p,()=>0);
 assert.ok(p.stroll.board);
 return {s,p,b,east};
}
test('walk to west boat, save mid-crossing, land east and finish original stroll',()=>{
 let {s,p,b,east}=crossing();
 for(let i=0;i<80&&!b.rider;i++)F.step(s);
 assert.equal(b.rider,p.id);assert.equal(p.stroll,undefined);
 for(let i=0;i<12;i++)F.step(s);
 assert.ok(F.World.inWater(s,p));s=F.migrate(JSON.parse(JSON.stringify(s)));
 b=s.world.lake.boat;p=s.individuals.find(q=>q.id===b.rider);
 assert.equal(b.cross.goal.x,east.x);
 for(let i=0;i<80&&p.stroll?.arrivedAt==null;i++)F.step(s);
 assert.ok(p.stroll?.arrivedAt);assert.equal(p.x,east.x);assert.equal(p.y,east.y);
 assert.equal(b.rider,undefined);assert.equal(b.dock,2);
});
test('boat departure restores walking goal; interrupted crossing never completes east stroll',()=>{
 const {s,p,b,east}=crossing();
 b.drift={x:b.x,y:b.y,to:east,start:s.worldTick};F.Objects.stroll(s,p);
 assert.equal(p.stroll.board,undefined);assert.equal(p.stroll.x,east.x);
 const other=crossing();Object.assign(other.p,{x:other.b.x,y:other.b.y});
 F.Boat.step(other.s,null,()=>0);assert.ok(other.b.cross);
 other.s.weather.wind=30;other.s.worldTick++;F.Boat.step(other.s,null,()=>0);
 assert.equal(other.b.cross,undefined);assert.equal(other.p.stroll,undefined);
 assert.ok(!F.World.inWater(other.s,other.p));assert.ok(other.p.x<2.25);
});
