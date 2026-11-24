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
 for(let i=0;i<32&&O.affinity(s,first,second)===0;i++)F.step(s);
 assert.equal(O.affinity(s,first,second),1);
 F.valid(s);
});

function visit(s,start,{offset=0,interruptAt}={}){
 const [a,b,c]=s.individuals;
 c.active=false;
 s.worldTick=start;
 for(const p of [a,b]){
  delete p.stroll;delete p.shelfAfter;delete p.walkPlan;
  p.objectTask=null;p.objectWait=null;delete p.skill;p.nextObjectChoice=0;
 }
 const seats=[O.shelfTarget(s,a,()=>0)];
 const place=(p,seat)=>Object.assign(p,{x:seat.x,y:seat.y,action:'wander',
  stroll:{...seat,since:s.worldTick,deadline:s.worldTick+90,linger:28,arrivedAt:s.worldTick}});
 place(a,seats[0]);
 const end=start+(interruptAt??28);
 for(let tick=start+1;tick<=end;tick++){
  s.worldTick=tick;
  if(tick===start+Math.max(1,offset))place(b,O.shelfTarget(s,b,()=>0));
  O.prepare(s,tick===start+interruptAt?b.id:null,()=>.5);
  O.stroll(s,a);O.stroll(s,b);
 }
 return [a,b];
}

test('completed joint rests persist by unordered pair and obey cooldown and the daily cap',()=>{
 const s=garden();
 let [a,b]=visit(s,7260);
 assert.equal(O.affinity(s,a,b),1);
 assert.equal(O.affinity(s,b,a),1);
 visit(s,7340);
 assert.equal(O.affinity(s,a,b),1,'short interval');
 visit(s,7460);
 assert.equal(O.affinity(s,a,b),2);
 visit(s,7620);
 assert.equal(O.affinity(s,a,b),2,'same-day cap');
 visit(s,8460);
 assert.equal(O.affinity(s,a,b),3);
 F.valid(s);
 const restored=F.migrate(JSON.parse(JSON.stringify(s)));
 assert.equal(O.affinity(restored,...restored.individuals.slice(0,2).reverse()),3);
 assert.equal(O.affinity(s,a,s.individuals[2]),0);
 const bad=F.clone(s);
 Object.values(bad.objects.friendships)[0].points=99;
 assert.throws(()=>F.valid(bad),/친밀도/);
});

test('short overlap, an interrupted partner or a clock jump do not award affinity',()=>{
 for(const options of [{offset:17},{interruptAt:24},{interruptAt:28}]){
  const s=garden(),[a,b]=visit(s,7260,options);
  assert.equal(O.affinity(s,a,b),0);
 }
 const s=garden(),[a,b]=visit(s,7260,{interruptAt:12});
 // Keep both reservations but advance the clock with no simulation ticks.
 delete b.shelfAfter;
 const seat=O.shelfTarget(s,b,()=>0);
 Object.assign(b,{x:seat.x,y:seat.y,stroll:{...a.stroll,...seat,arrivedAt:7261}});
 s.worldTick=7310;
 O.prepare(s,null,()=>.5);
 O.stroll(s,a);O.stroll(s,b);
 assert.equal(O.affinity(s,a,b),0);
});

test('a familiar pair greets and a close pair takes the free seat more often',()=>{
 const s=garden(),[a,b]=s.individuals;
 const seat=O.shelfTarget(s,a,()=>0);
 Object.assign(a,{x:seat.x,y:seat.y,stroll:{...seat,since:s.worldTick,arrivedAt:s.worldTick,linger:28,deadline:s.worldTick+90}});
 const ids=[a.id,b.id].sort(),key=JSON.stringify(ids);
 assert.equal(O.shelfGreeting(s,a),0);
 assert.equal(O.shelfTarget(s,b,()=>.72),null);
 s.objects.friendships={[key]:{ids,points:3,today:1,day:Math.floor(s.worldTick/1200),last:s.worldTick}};
 assert.notEqual(O.shelfGreeting(s,a),0);
 assert.match(O.reason(s,a),/옆자리/);
 assert.equal(O.shelfTarget(s,b,()=>.72),null);
 s.objects.friendships[key].points=8;
 assert.equal(O.shelfTarget(s,b,()=>.72).shelf,2);
 assert.equal(O.shelfTarget(s,b,()=>.80),null);
});
