const {test}=require('node:test');
const assert=require('node:assert/strict');
const F=require('../../app/src/main/assets/web/engine');
const Friends=require('../../app/src/main/assets/web/friendship');
const Traits=require('../../app/src/main/assets/web/traits');
const T=F.Trees;
const zelkova={x:1.65,y:1.58},willow={x:1.724,y:1.01};
function game(){
 const s=F.create(0,18);
 s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;
 F.World.openLake(s);s.worldTick=7199;F.step(s);s.worldTick=7400;
 Object.assign(s.weather,{kind:'sun',wind:8,intensity:0,remaining:240,transition:0});
 return s;
}
function plantAvailable(s,type){
 const id=T.nextId(s,type);
 for(const p of T.candidates(s,type)){
  try{F.layout(s,{[id]:p});return id;}catch{}
 }
 assert.fail('No planting position for '+id);
}
test('regional placement, stored copies and old saves share the same layout validation',()=>{
 const old=F.create(0,18);
 assert.throws(()=>F.layout(old,{'zelkova-1':zelkova}),/남쪽 숲/);
 assert.throws(()=>F.layout(old,{'cherry-1':zelkova}),/남쪽 숲/);
 assert.throws(()=>F.layout(old,{'willow-1':willow}),/호수가 열리면/);
 assert.equal(F.migrate(F.clone(old)).world.trees,undefined);
 const s=game();
 assert.throws(()=>F.layout(s,{'willow-1':{x:F.World.LAKE.cx,y:F.World.LAKE.cy}}),/호숫가의 땅/);
 assert.throws(()=>F.layout(s,{'zelkova-1':{x:1.65,y:.55}}),/남쪽 숲/);
 for(const [type,d] of Object.entries(T.TYPES)){
  const first=plantAvailable(s,type);
  const point=T.active(s).find(t=>t.id===first);
  assert(!F.Space.walkable(s,point),'trunk is solid');
  const {x,y}=point;F.storeObject(s,first);
  assert(F.Space.walkable(s,point),'stored trees do not obstruct routes');
  for(let i=1;i<d.limit;i++)plantAvailable(s,type);
  assert.equal(T.count(s,type),d.limit);
  assert.equal(T.nextId(s,type),undefined);
  assert.throws(()=>F.layout(s,{[type+'-'+(d.limit+1)]:{x,y}}));
  assert.throws(()=>F.layout(s,{[first]:{x,y}}),/보관함/);
  const saved=F.migrate(F.clone(s));
  assert.equal(T.stored(saved).length,1);
  assert.equal(T.count(saved,type),d.limit);
  F.unstoreObject(s,first);
  assert.equal(T.stored(s).length,0);
 }
 assert.equal(T.active(F.migrate(F.clone(s))).length,17);
 assert.equal(T.name('cherry-10'),'산벚나무 10');
});
test('moss and willow transfer the same conserved root water with no overlap multiplier',()=>{
 const s=game();
 F.layout(s,{'willow-1':willow});
 const p=s.individuals[0],shade=T.canopy(T.active(s)[0]);
 const expected=2/60*Traits.ofPet(p).absorb*T.ABSORPTION;
 const moss=F.Objects.region(s,'moss','rest');
 let rootSpent=[];
 for(const point of [moss,shade]){
  const copy=F.clone(s),friend=copy.individuals[0];
  if(point===moss)F.Objects.patch(copy,'moss').S=F.Objects.patch(copy,'moss').cap;
  Object.assign(friend,{x:point.x,y:point.y,Q:8,B:52,energy:65,nutrition:65,shelter:{phase:'outside',since:0}});
  // Keep an identical position and suppress other water tasks while the normal engine step runs.
  F.step(copy,{held:friend.id});
  rootSpent.push(8-friend.Q);
 }
 rootSpent.forEach(amount=>assert(Math.abs(amount-expected)<1e-9));
 assert.equal(T.absorption(s,shade,true),T.ABSORPTION);
 F.storeObject(s,'willow-1');
 assert.equal(T.absorption(s,shade,false),1);
 F.unstoreObject(s,'willow-1');
 s.worldTick=11000;
 assert(F.World.frozen(s));
 assert.equal(T.absorption(s,shade,false),1);
 assert.equal(T.absorption(s,shade,true),T.ABSORPTION);
});
test('canopy changes real light, wind and rain exposure with the season',()=>{
 const s=game();
 F.layout(s,{'zelkova-1':zelkova,'willow-1':willow});
 s.worldTick=3800;s.climate.L=80;s.weather.wind=50;
 const [tree,bank]=T.active(s).map(T.canopy);
 const p={...s.individuals[0],...tree,shelter:{phase:'outside'}};
 assert.equal(F.light(s,tree),80*(1-.28));
 assert.equal(F.Weather.wind(s,p),37.5);
 assert.equal(F.Weather.rainCover(s,tree),.30);
 assert.equal(F.Weather.rainCover(s,bank),.55);
 s.worldTick=11000;
 assert(F.light(s,tree)>70);
 assert(F.Weather.rainCover(s,bank)<.10);
});
function nearTree(type){
 const s=game(),id=type+'-1';
 F.layout(s,{[id]:type==='willow'?willow:zelkova});
 const canopy=T.canopy(T.active(s)[0]),first=s.individuals[0];
 s.individuals=['ridley','bosong'].map((species,i)=>({...F.clone(first),id:'pair-'+i,species,
  x:canopy.x+(i===0?-.12:.12),y:canopy.y+.013,xp:145,B:60,nutrition:65,energy:66,
  action:'wander',objectTask:null,target:null,stroll:null,nextObjectChoice:s.worldTick+60,shelter:{phase:'outside',since:0}}));
 const ids=s.individuals.map(p=>p.id);
 s.objects.friendships={[JSON.stringify(ids)]:{ids,points:3,today:1,day:6,last:7200}};
 return s;
}
function playMeeting(s){
 Friends.prepare(s,null,()=>0);Friends.tick(s);
 const texts=[];
 for(let i=0;i<34&&Friends.busy(s,'pair-0');i++){
  texts.push(Friends.pose(s,s.individuals[0]).text);
  F.step(s);
 }
 return texts;
}
test('two friends finish chatting, and willow watching requires fish in the water',()=>{
 const s=nearTree('zelkova');
 assert(playMeeting(s).some(text=>text.includes('수다')));
 assert.equal(F.Objects.affinity(s,...s.individuals),4);
 const quiet=nearTree('willow');
 assert(!playMeeting(quiet).some(text=>text.includes('송사리')));
 const bank=nearTree('willow');
 bank.world.lake.life=[{id:'test-fish',kind:'medaka',x:1.91,y:.84,born:bank.worldTick}];
 assert(playMeeting(bank).some(text=>text.includes('송사리')));
 assert.equal(F.Objects.affinity(bank,...bank.individuals),4);
});

test('cherry shade changes with the season and disappears in storage',()=>{
 const s=game(),id='cherry-1';
 F.layout(s,{[id]:zelkova});
 const point=T.canopy(T.active(s)[0]);
 s.climate.L=80;
 const light=[320,3920,7520,11120].map(t=>{s.worldTick=t;return F.light(s,point);});
 assert(light[1]<light[0]&&light[0]<light[2]&&light[2]<light[3]&&light[3]<80);
 assert.equal(T.effects(s,point).rain,0);
 assert.equal(T.effects(s,point).wind,0);
 F.storeObject(s,id);assert.equal(F.light(s,point),80);
});
