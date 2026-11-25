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
 assert.deepEqual(Object.fromEntries(Object.entries(T.TYPES).map(([type,{limit}])=>[type,limit])),{zelkova:5,willow:20,cherry:20});
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
 assert.equal(T.active(F.migrate(F.clone(s))).length,45);
 assert.equal(T.name('cherry-20'),'산벚나무 20');
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

function alreadyHasSac(s,p){
 const partner={...F.clone(p),id:'pouch-partner',active:false,perchTree:undefined,stroll:undefined};
 s.individuals.push(partner);
 p.sporeSac=partner.id;
}
function cherryVisit(){
 const s=game(),p=s.individuals[0],id='cherry-1';
 F.layout(s,{[id]:zelkova});
 Object.assign(p,{x:1.51,y:1.67,visualStage:3,xp:120,B:50,nutrition:50,energy:70,action:'wander',nextObjectChoice:0});
 s.environment.windTarget=8;
 T.assignPerch(s,id,p.id);
 alreadyHasSac(s,p);
 F.step(s);
 assert.equal(p.stroll?.perch,id);
 assert.ok(p.motion.distance>0);
 assert.equal(p.stroll.arrivedAt,undefined);
 for(let i=0;i<10&&p.stroll?.arrivedAt==null;i++)F.step(s);
 assert.ok(p.stroll?.arrivedAt);
 return {s,p,id};
}
test('an adult walks to its assigned cherry, rests on arrival, and leaves with a return delay',()=>{
 const {s,p,id}=cherryVisit();
 const saved=F.migrate(F.clone(s));
 assert.deepEqual(saved.individuals[0].stroll,p.stroll);
 assert.equal(saved.individuals[0].perchTree,id);
 assert.match(F.Objects.reason(s,p),/낮은 가지/);
 const start=s.worldTick;
 F.advance(s,32);
 assert.equal(s.worldTick-start,32);
 assert.equal(p.stroll?.perch,undefined);
 assert.equal(p.perchAfter,s.worldTick+240);
 F.advance(s,10);assert.equal(p.stroll?.perch,undefined);
 F.valid(s);
});
test('care and weather interrupt a perch on the next tick',()=>{
 const {s}=cherryVisit();
 for(const change of [
  (s,p)=>{p.B=15;},(s,p)=>{p.nutrition=15;},
  s=>{s.worldTick=8000;},s=>{s.weather.kind='rain';},
  s=>{s.weather.wind=45;s.environment.windTarget=45;}
 ]){
  const trial=F.clone(s),p=trial.individuals[0];
  change(trial,p);F.step(trial);
  assert.equal(p.stroll?.perch,undefined);
  assert.equal(p.perchTree,'cherry-1');assert.ok(p.perchAfter>trial.worldTick);
  F.valid(trial);
 }
});
test('moving, storing, releasing and greeting a new friend preserve a valid perch assignment',()=>{
 const {s,p,id}=cherryVisit();
 const other=plantAvailable(s,'cherry');
 assert.throws(()=>T.assignPerch(s,other,p.id));
 assert.throws(()=>T.assignPerch(s,id,p.id));
 F.welcomeNeolbi(s);
 const newcomer=s.individuals.at(-1);
 assert.equal(newcomer.perchTree,undefined);
 assert.equal(newcomer.stroll,undefined);
 assert.throws(()=>T.assignPerch(s,other,newcomer.id));
 const card=require('../../app/src/main/assets/web/object-cards');
 assert.match(card.render(s,id,''),/tree-unassign/);
 const ground={x:p.x,y:p.y};
 F.layout(s,{[id]:{x:2.52,y:1.7}});
 assert.equal(p.stroll?.perch,undefined);
 assert.equal(p.perchTree,id);
 assert.deepEqual({x:p.x,y:p.y},ground);
 F.storeObject(s,id);assert.equal(p.perchTree,undefined);
 F.unstoreObject(s,id);
 assert.match(card.render(s,id,''),/tree-assign/);
 T.assignPerch(s,id,p.id);T.assignPerch(s,id,null);assert.equal(p.perchTree,undefined);
 F.valid(s);
});

test('only photosynthesis during occupied cherry rest ripens a spore, even at the XP cap',()=>{
 const {s,p,id}=cherryVisit(),R=F.Recruitment;
 p.xp=150;
 assert.equal(p.sporeSeconds,undefined);
 s.climate.L=75;F.step(s);
 assert.equal(p.sporeSeconds,1);
 const night=F.clone(s);night.worldTick=8000;F.step(night);
 assert.equal(night.individuals[0].sporeSeconds,1);
 const thirsty=F.clone(s);thirsty.individuals[0].B=15;F.step(thirsty);
 assert.equal(thirsty.individuals[0].sporeSeconds,1);
 const stored=F.clone(s);F.storeObject(stored,id);F.step(stored);
 assert.equal(stored.individuals[0].sporeSeconds,1);
 const dark=F.clone(s);R.growSpore(dark.individuals[0],{xp:0});
 assert.equal(dark.individuals[0].sporeSeconds,1);
 F.pause(s,1000);F.resume(s,121000);assert.equal(p.sporeSeconds,1);
 p.sporeSeconds=R.SPORE_SECONDS-1;F.advance(s,3);assert.equal(p.sporeSeconds,R.SPORE_SECONDS);
 assert.equal(s.events.filter(e=>e.type==='spore'&&e.individual===p.id).length,1);
 F.storeObject(s,id);R.collectSpore(s,p.id);assert.equal(p.sporeStored,true);
 assert.throws(()=>R.collectSpore(s,p.id));
 assert.equal(F.migrate(F.clone(s)).individuals[0].sporeStored,true);
});
test('one saved spore creates one young friend with traceable generations and its own state',()=>{
 const {s,p}=cherryVisit(),R=F.Recruitment;
 p.name='달빛';delete p.sporeSac;p.sporeStored=true;
 const before=F.totalWater(s);
 const child=R.germinate(s,p.id,F.personality,F.event);
 assert.equal(F.totalWater(s)-before,child.B);
 assert.equal(s.events.at(-1).arrivalWater,child.B);
 assert.equal(child.active,false);assert.equal(child.xp,0);assert.equal(child.visualStage,0);
 assert.equal(child.parentId,p.id);assert.equal(child.generation,2);
 assert.equal(child.species,p.species);assert.equal(child.perchTree,undefined);
 assert.notEqual(child.name,p.name);assert.notEqual(child.first,p.first);
 assert.throws(()=>R.germinate(s,p.id,F.personality,F.event));
 F.valid(s);F.roster(s,child.id,true);F.step(s);F.valid(s);
 Object.assign(child,{xp:150,visualStage:3,sporeStored:true});
 const next=R.germinate(s,child.id,F.personality,F.event);
 assert.equal(next.parentId,child.id);assert.equal(next.generation,3);
 F.valid(F.migrate(F.clone(s)));
 const bad=F.clone(s);bad.individuals.at(-1).parentId=next.id;assert.throws(()=>F.valid(bad),/세대/);
});
test('a full roster or a failed save leaves the spore available',()=>{
 const s=game(),p=s.individuals[0],R=F.Recruitment;
 p.sporeStored=true;
 assert.throws(()=>F.transaction(s,w=>R.germinate(w,p.id,F.personality,F.event),()=>false),/저장/);
 assert.equal(s.individuals.length,1);assert.equal(p.sporeStored,true);
 while(s.individuals.length<50)s.individuals.push({...p,id:'full-'+s.individuals.length,active:false});
 assert.throws(()=>R.germinate(s,p.id,F.personality,F.event),/50명/);
 assert.equal(p.sporeStored,true);assert.equal(s.individuals.length,50);
});

test('tree cards and assignments use adult size and base water affinity',()=>{
 const s=game(),p=s.individuals[0],c=plantAvailable(s,'cherry'),z=plantAvailable(s,'zelkova'),w=plantAvailable(s,'willow');
 p.visualStage=3;p.xp=150;
 const card=require('../../app/src/main/assets/web/object-cards');
 for(const [species,allowed] of [
  ['ridley',[c,z]],['bonbon',[c,z]],['bosong',[c,z]],['duri',[c,z]],
  ['neolbi',[z]],['jureong',[c,z,w]],['superbum',[z,w]]
 ]){
  p.species=species;
  for(const id of [c,z,w]){
   const can=allowed.includes(id);
   assert.equal(T.canAssign(p,id),can,species+' '+id);
   assert.equal(card.render(s,id,'').includes('data-action="tree-assign"'),can,species+' card '+id);
   if(can){T.assignPerch(s,id,p.id);T.assignPerch(s,id,null);}
   else assert.throws(()=>T.assignPerch(s,id,p.id),/나무에 맞는/);
  }
 }
});

test('a willow visit starts on dry land and a stored perch releases its adult',()=>{
 const s=game(),p=s.individuals[0],w=plantAvailable(s,'willow');
 const tree=T.active(s).find(t=>t.id===w),entry=T.perchEntry(tree);
 assert.ok(F.World.waterD(entry.x,entry.y)>F.World.waterD(tree.x,tree.y));
 assert.equal(F.World.inWater(s,entry),false);
 Object.assign(p,entry,{species:'superbum',visualStage:3,xp:150,B:50,nutrition:50,energy:70,action:'wander',nextObjectChoice:0});
 delete p.objectTask;delete p.stroll;
 s.environment.windTarget=8;
 T.assignPerch(s,w,p.id);
 alreadyHasSac(s,p);
 for(let i=0;i<5&&p.stroll?.arrivedAt==null;i++)F.step(s);
 assert.equal(p.stroll?.perch,w);
 assert.ok(Number.isFinite(p.stroll?.arrivedAt));
 assert.match(F.Objects.reason(s,p),/수양버들 줄기/);
 F.valid(s);
 assert.equal(F.migrate(F.clone(s)).individuals[0].perchTree,w);
 F.storeObject(s,w);
 assert.equal(p.perchTree,undefined);
 assert.equal(p.stroll,undefined);
 F.valid(s);
});

test('loading a legacy large cherry owner releases the perch and retains its spores',()=>{
 const {s,p}=cherryVisit();
 p.species='superbum';delete p.sporeSac;p.sporeStored=true;
 const loaded=F.migrate(F.clone(s)),adult=loaded.individuals[0];
 assert.equal(adult.perchTree,undefined);assert.equal(adult.stroll,undefined);
 assert.equal(adult.sporeStored,true);
 assert.deepEqual([adult.x,adult.y],[p.x,p.y]);
});

test('a formed spore sac starts an assigned tree visit',()=>{
 const s=game(),p=s.individuals[0],id='cherry-1';
 F.layout(s,{[id]:zelkova});
 Object.assign(p,{x:1.51,y:1.67,visualStage:3,xp:120,B:50,nutrition:50,energy:70,action:'wander',nextObjectChoice:0});
 s.environment.windTarget=8;
 T.assignPerch(s,id,p.id);
 F.step(s);
 assert.notEqual(p.stroll?.perch,id);
 delete p.stroll;delete p.objectTask;p.nextObjectChoice=0;p.action='wander';p.actionSeconds=0;
 alreadyHasSac(s,p);
 F.step(s);
 assert.equal(p.stroll?.perch,id);
});
