const {test}=require('node:test');
const assert=require('node:assert/strict');
const F=require('../../app/src/main/assets/web/engine');
const Cards=require('../../app/src/main/assets/web/object-cards');
const O=F.Objects;

function garden(){
 const s=F.create(0,18);
 s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;
 F.World.openLake(s);s.worldTick=7199;F.step(s);
 s.worldTick=7380;
 Object.assign(s.weather,{kind:'sun',wind:10,intensity:0,remaining:240,transition:0});
 const shelf=F.World.stoneShelf(s),original=s.individuals[0];
 s.individuals=['neolbi','superbum','ridley'].map((species,i)=>({
  ...F.clone(original),id:'guest-'+i,name:species,species,x:shelf.x-.23+i*.24,y:shelf.y+.16,
  xp:150,visualStage:3,B:58,nutrition:65,energy:58,stroll:null,objectTask:null,nextObjectChoice:0,
  action:'wander',target:null,shelter:{phase:'outside',since:0}
 }));
 return s;
}
test('normal free walks reserve two distinct seats and both adult friends sit facing the lake',()=>{
 const s=garden(),[first,second,third]=s.individuals;
 const freeWalk=()=>{const rolls=[.58,.99,.99,.01];return ()=>rolls.shift()??.5;};
 O.choose(s,first,freeWalk());
 O.choose(s,second,freeWalk());
 assert.deepEqual([first.stroll?.shelf,second.stroll?.shelf],[1,2]);
 assert.equal(O.shelfTarget(s,third,()=>0),null);
 assert.equal(Cards.model(s,'stone-shelf').metrics[1].value,'2명');
 for(let i=0;i<22&&![first,second].every(p=>O.shelfPose(s,p));i++){
  s.worldTick++;
  for(const p of [first,second])O.stroll(s,p);
 }
 assert.ok([first,second].every(p=>O.shelfPose(s,p)?.back));
 assert.match(O.reason(s,first),/나란히/);
 assert.match(Cards.model(s,'stone-shelf').metrics[0].value,/2 \/ 2/);
 F.valid(s);
 const loaded=F.migrate(JSON.parse(JSON.stringify(s)));
 assert.deepEqual(loaded.individuals.slice(0,2).map(p=>p.stroll.shelf),[1,2]);
 for(let i=0;i<28;i++){s.worldTick++;O.stroll(s,first);O.stroll(s,second);}
 for(const p of [first,second]){assert.equal(p.energy,59);assert.equal(p.stroll,undefined);assert.ok(p.shelfAfter>s.worldTick);}
});
test('thirst, rain and pickup interrupt a perch without awarding energy',()=>{
 for(const interrupt of ['water','rain','held']){
  const s=garden(),p=s.individuals[0],seat=O.shelfTarget(s,p,()=>0);
  Object.assign(p,{x:seat.x,y:seat.y,stroll:{...seat,since:s.worldTick,deadline:s.worldTick+90,linger:28,arrivedAt:s.worldTick}});
  if(interrupt==='water')p.B=15;
  if(interrupt==='rain')Object.assign(s.weather,{kind:'rain',intensity:70});
  O.prepare(s,interrupt==='held'?p.id:null,()=>.5);
  assert.equal(p.stroll?.shelf,undefined,interrupt);
  assert.equal(p.energy,58);
  assert.equal(O.shelfPose(s,p),null);
 }
});

test('on a bright day adult Elephan and Superbum can finish the same visit through the normal engine loop',()=>{
 const s=garden(),[first,second]=s.individuals;
 s.worldTick=7560;
 s.climate.L=80;
 for(const p of [first,second]){
  const rolls=[.58,.99,.99,.01];
  O.choose(s,p,()=>rolls.shift()??.5);
 }
 for(let i=0;i<24&&![first,second].every(p=>O.shelfPose(s,p));i++)F.step(s);
 assert.ok([first,second].every(p=>O.shelfPose(s,p)?.back));
 F.valid(s);
});
