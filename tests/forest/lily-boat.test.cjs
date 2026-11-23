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
test('dew respects the fit band and shaking removes each pest once',()=>{
 const {s,p,b}=setup();p.B=65;
 const groups=s.objects.creatures.groups;
 groups.push({kind:'mite',host:p.id,density:5},{kind:'mealy',host:p.id,density:1});
 F.Boat.step(s,null,()=>0);assert.equal(b.rider,p.id);
 for(let i=0;i<18;i++){s.worldTick++;F.Boat.step(s,null,()=>0);}
 const leaf=F.Creatures.onLeaf(s,p.id);
 assert.equal(leaf.mite.density,3);assert.equal(leaf.mealy.density,0);assert.equal(p.B,65);
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
test('nightfall ends a saved ride and the ordinary sleep planner takes over',()=>{
 const start=setup();F.Boat.step(start.s,null,()=>0);
 const s=F.migrate(JSON.parse(JSON.stringify(start.s))),p=s.individuals[0];
 s.worldTick=749;s.world.lake.boat.start=745;
 F.step(s);
 assert.equal(s.world.lake.boat.rider,undefined);
 assert.ok(!F.World.inWater(s,p));assert.equal(p.objectTask?.reason,'sleep');
 for(let i=0;i<150&&!F.Shelter.inside(s,p);i++)F.step(s);
 assert.ok(F.Shelter.inside(s,p));F.valid(s);
});
test('thirst, injury and excess water give the tick back to ordinary care',()=>{
 for(const [change,reason] of [[{B:20},'water'],[{damage:12},'safety'],[{B:72},'dry']]){
  const {s,p,b}=setup();F.Boat.step(s,null,()=>0);Object.assign(p,change);
  F.step(s);assert.equal(b.rider,undefined);assert.ok(!F.World.inWater(s,p));
  if(reason==='water')assert.ok(p.objectTask?.reason==='water'||p.stroll?.lake==='drink');
  else assert.equal(p.objectTask?.reason,reason);F.valid(s);
 }
});
test('a manual move between ticks cannot pull the friend back onto the leaf',()=>{
 const {s,p,b}=setup();F.Boat.step(s,null,()=>0);s.worldTick++;F.Boat.step(s,null,()=>0);
 const q=F.Space.placement(s,p.id,{x:.47,y:.38});assert.ok(q.ok);
 F.relocate(s,p.id,q);F.step(s);assert.equal(b.rider,undefined);assert.equal(p.x,q.x);
 assert.equal(p.y,q.y);assert.ok(p.boatAfter>s.worldTick);
});
test('nearby visitors walk to the leaf before boarding; offers use a separate random stream',()=>{
 const {s,p,b}=setup(),x=b.x;p.x-=.12;
 F.Boat.step(s,null,(state,key)=>{assert.equal(key,'boat');return 0;});
 assert.equal(b.rider,undefined);assert.equal(b.x,x);assert.ok(p.stroll.board.loop);
 for(let i=0;i<15&&!b.rider;i++)F.step(s);
 assert.equal(b.rider,p.id);assert.ok(Math.abs(p.x-x)<.025);
});
test('a friend can walk back from the eastern landing to sleep',()=>{
 const {s,p,b}=crossing();
 for(let i=0;i<100&&!p.stroll?.boatChecked;i++)F.step(s);
 assert.ok(!b.rider&&p.x>F.World.LAKE.cx);
 s.worldTick=749;p.nextObjectChoice=0;
 for(let i=0;i<260&&!F.Shelter.inside(s,p);i++)F.step(s);
 assert.ok(F.Shelter.inside(s,p));assert.equal(p.objectTask?.reason,'sleep');
});
test('the first visibly night tick ends the ride before deep-night sleep',()=>{
 const {s,p,b}=setup();s.worldTick=598;p.stroll.arrivedAt=598;F.Boat.step(s,null,()=>0);assert.equal(b.rider,p.id);
 F.step(s);F.step(s);assert.equal(F.Environment.timeKey(s),'night');
 assert.equal(b.rider,undefined);assert.ok(!F.World.inWater(s,p));F.valid(s);
});
test('a leisure walk can aim for a dock, keep it until boarding and release it on timeout',()=>{
 const {s,p,b}=setup();p.x-=.42;delete p.stroll.arrivedAt;
 const original=p.stroll.x;F.Boat.offerLoop(s,p,()=>0);assert.ok(p.stroll.board?.loop);
 b.nextDrift=s.worldTick;F.Boat.step(s,null,()=>0);assert.ok(!b.drift);
 const other={...F.clone(p),id:'second',x:p.x-.3};delete other.stroll.board;s.individuals.push(other);
 F.Boat.offerLoop(s,other,()=>0);assert.equal(other.stroll.board,undefined);
 p.stroll.deadline=s.worldTick;F.Boat.step(s,null,()=>0);assert.ok(b.drift);
 F.Objects.stroll(s,p);assert.equal(p.stroll?.board,undefined);assert.equal(original,b.x);
});

test('ordinary leisure visitors cross in either direction, reload afloat and linger on the opposite shore',()=>{
 for(const direction of [1,-1])for(const approach of [false,true]){
  let {s,p,b}=setup();
  if(direction<0)Object.assign(b,F.World.nearShore(s,{x:3,y:.55}),{dock:2});
  Object.assign(p,{x:b.x,y:b.y});
  Object.assign(p.stroll,{x:p.x,y:p.y});
  if(approach){p.x-=.04;delete p.stroll.arrivedAt;F.Boat.offerLoop(s,p,()=>0);assert.ok(p.stroll.board);}
  // The first draw accepts a shore offer, the route draw chooses a crossing.
  for(let tick=0;tick<6&&!b.rider;tick++){
   const draws=approach?[.7,.4]:[0,.7,.4];
   F.Boat.step(s,null,()=>draws.shift());
   if(!b.rider){F.Objects.stroll(s,p);s.worldTick++;}
  }
  assert.equal(b.rider,p.id);assert.equal(Math.sign(b.cross.landing.x-b.home.x),direction);
  const shore=direction>0?'동쪽 물가':'서쪽 물가';
  assert.equal(cards.model(s,'lily-boat').rows[0][1],shore);assert.ok(F.Boat.reason(s,p).includes(shore));
  F.advance(s,12);assert.ok(F.World.inWater(s,p));
  s=F.migrate(JSON.parse(JSON.stringify(s)));p=s.individuals[0];b=s.world.lake.boat;
  for(let i=0;i<36&&b.rider;i++)F.step(s);
  assert.equal(b.rider,undefined);assert.equal(b.dock,direction>0?2:0);assert.equal(Math.sign(p.x-F.World.LAKE.cx),direction);
  assert.ok(!F.World.inWater(s,p));assert.ok(p.stroll?.boatChecked&&p.stroll.arrivedAt!=null);
  assert.ok(p.boatAfter>s.worldTick);F.valid(s);
 }
});
test('ordinary boarding near nightfall keeps the short outing local',()=>{
 const {s,p,b}=setup();s.worldTick=580;p.stroll.arrivedAt=580;p.stroll.deadline=640;
 F.Boat.step(s,null,()=>.6);assert.equal(b.rider,p.id);assert.equal(b.cross,undefined);
});

test('a newly occupied leisure landing is replaced on the same bank, including its stroll goal',()=>{
 const {s,p,b}=setup();F.Boat.step(s,null,()=>.65);assert.ok(b.cross);
 const reserved=b.cross.landing;
 s.individuals.push({...F.clone(p),id:'watcher',x:reserved.x,y:reserved.y});
 s.worldTick+=b.duration;F.Boat.step(s,null,()=>0);
 assert.equal(b.rider,undefined);assert.equal(b.dock,2);
 assert.ok(F.Space.distance(p,reserved)>=F.Space.diameter(p));
 assert.equal(p.stroll.x,p.x);assert.equal(p.stroll.y,p.y);
 assert.ok(!F.World.inWater(s,p));F.valid(s);
});
