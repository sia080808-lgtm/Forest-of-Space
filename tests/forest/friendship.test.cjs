const {test}=require('node:test');
const assert=require('node:assert/strict');
const F=require('../../app/src/main/assets/web/engine');
test('shared affinity award preserves pair records and applies one cross-activity daily budget',()=>{
 const s=F.create(0,18),a=s.individuals[0],b={...F.clone(a),id:'other'};
 s.individuals.push(b);s.worldTick=100;
 assert(F.Objects.awardAffinity(s,a,b));
 assert.equal(F.Objects.awardAffinity(s,b,a),false);
 s.worldTick=280;assert(F.Objects.awardAffinity(s,b,a));
 s.worldTick=460;assert.equal(F.Objects.awardAffinity(s,a,b),false);
 s.worldTick=1300;assert(F.Objects.awardAffinity(s,a,b));
 assert.equal(F.Objects.affinity(s,b,a),3);
 const restored=F.migrate(JSON.parse(JSON.stringify(s)));
 assert.equal(F.Objects.affinity(restored,...restored.individuals),3);
});
const Friends=require('../../app/src/main/assets/web/friendship');
function pair(points=3){
 const s=F.create(0,18);
 s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;
 F.World.openLake(s);s.worldTick=7199;F.step(s);s.worldTick=7380;
 Object.assign(s.weather,{kind:'sun',wind:8,intensity:0,remaining:240,transition:0});
 s.climate.L=45;
 const first=s.individuals[0];
 s.individuals=['ridley','bosong'].map((species,i)=>({...F.clone(first),id:'pair-'+i,species,
  x:1.10+i*.30,y:.86,xp:145,B:58,nutrition:65,energy:62,action:'wander',
  objectTask:null,target:null,stroll:null,nextObjectChoice:s.worldTick+60,shelter:{phase:'outside',since:0}}));
 const ids=s.individuals.map(p=>p.id).sort();
 s.objects.friendships={[JSON.stringify(ids)]:{ids,points,today:1,day:6,last:7200}};
 return s;
}
function begin(s,type='walk'){
 const rolls=type==='dance'?[0,0]:[0,.99];
 const ids=Friends.prepare(s,null,()=>rolls.shift()??.99);
 assert.equal(ids.size,2,type);
 Friends.tick(s);
 assert(Friends.pose(s,s.individuals[0]));
}
test('normal engine completes a shared walk once and releases both friends',()=>{
 const s=pair();begin(s);
 for(let i=0;i<35&&Friends.busy(s,'pair-0');i++)F.step(s);
 assert.equal(Friends.busy(s,'pair-0'),false);
 assert.equal(F.Objects.affinity(s,...s.individuals),4);
 assert(!s.individuals.some(p=>/함께 산책/.test(F.Objects.reason(s,p))));
 F.valid(s);
});
test('copying live state for the next tick keeps the meeting without persisting it in the save',()=>{
 let s=pair();
 Object.values(s.objects.friendships)[0].sporeHost='pair-1';
 begin(s,'dance');
 assert.match(Friends.pose(s,s.individuals[0]).text,/춤추고/);
 const original=s,serialized=F.clone(s);
 assert.equal(Friends.busy(serialized,'pair-0'),false);
 const moving=[];
 for(let i=0;i<40&&Friends.busy(s,'pair-0');i++){
  s=Friends.copyForTick(s,F.clone(s));
  F.step(s);
  if(s.individuals[0].motion?.distance>0)moving.push(s.worldTick);
 }
 assert.ok(moving.length>3);
 assert.equal(Friends.busy(s,'pair-0'),false);
 assert.equal(Friends.busy(original,'pair-0'),true);
 assert.equal(F.Objects.affinity(s,...s.individuals),4);
 assert.equal(F.Objects.affinity(original,...original.individuals),3);
});
test('close friends complete an unobstructed dance through the real engine',()=>{
 const s=pair(8);begin(s,'dance');
 const start=s.individuals.map(p=>({x:p.x,y:p.y}));
 for(let i=0;i<38&&Friends.busy(s,'pair-0');i++)F.step(s);
 assert.equal(Friends.busy(s,'pair-0'),false);
 s.individuals.forEach((p,i)=>assert(F.Space.distance(p,start[i])<.01));
 F.valid(s);
});
test('night, thirst, hunger, fatigue, rain, pickup, layout and clock jumps release both reservations without points',()=>{
 const changes=[
  s=>s.worldTick=7800,s=>s.individuals[1].B=20,s=>s.individuals[0].nutrition=20,
  s=>s.individuals[1].energy=20,s=>Object.assign(s.weather,{kind:'rain',intensity:.7}),
  s=>{},s=>s.layoutRevision++,s=>s.worldTick+=100
 ];
 changes.forEach((change,index)=>{
  const s=pair();begin(s);change(s);F.step(s,index===5?{held:'pair-1'}:{});
  assert(!Friends.busy(s,'pair-0'),String(index));assert(!Friends.busy(s,'pair-1'),String(index));
  assert.equal(F.Objects.affinity(s,...s.individuals),3,String(index));F.valid(s);
 });
});
test('loading during a meeting keeps earned affinity and drops transient actions',()=>{
 const s=pair();begin(s);F.step(s);
 const restored=F.migrate(JSON.parse(JSON.stringify(s)));
 assert.equal(F.Objects.affinity(restored,...restored.individuals),3);
 assert(!Friends.busy(restored,'pair-0'));F.valid(restored);F.step(restored);
});
test('a frog reaction invites a familiar friend to watch and shares the affinity budget',()=>{
 const s=pair();s.world.lake.fx={react:{'pair-0':{k:'startle',at:s.worldTick}}};
 begin(s);assert.match(Friends.pose(s,s.individuals[1]).text,/물가/);
 for(let i=0;i<8&&Friends.busy(s,'pair-0');i++)F.step(s);
 assert.equal(F.Objects.affinity(s,...s.individuals),4);
 assert.equal(F.Objects.awardAffinity(s,...s.individuals),false);
});
test('all seven species can take part and pickup cancels synchronously',()=>{
 for(const species of ['ridley','bonbon','neolbi','bosong','jureong','duri','superbum']){
  const s=pair(8);s.individuals[1].species=species;
  begin(s,'dance');
  F.Social.cancel(s,'pair-1');
  assert(!Friends.busy(s,'pair-0'),species);
  assert.equal(F.Objects.affinity(s,...s.individuals),8);
 }
});
test('an occupied circular route does not reserve either friend',()=>{
 const s=pair(8),[a,b]=s.individuals;
 s.individuals.push({...F.clone(a),id:'blocking',x:1.25,y:.86-.15/1.6,action:'rest'});
 assert.equal(Friends.prepare(s,null,()=>0).size,0);
});

test('at maximum affinity only one adult receives a pouch and only that pair resets',()=>{
 const s=pair(7),[a,b]=s.individuals,O=F.Objects;
 const other={...F.clone(a),id:'pair-2',active:true};
 s.individuals.push(other);
 for(const p of [a,b])p.visualStage=3;
 assert.ok(O.awardAffinity(s,a,other));
 assert.ok(O.awardAffinity(s,b,a));
 assert.equal(a.sporeSac,b.id);
 assert.equal(b.sporeSac,undefined);
 assert.equal(O.affinity(s,a,b),0);
 assert.equal(O.affinity(s,a,other),1);
 assert.equal(O.learnedDance(s,a,b),true);
 assert.equal(O.awardAffinity(s,b,a),false);
 const saved=F.migrate(F.clone(s));
 assert.equal(saved.individuals[0].sporeSac,b.id);
 assert.equal(O.affinity(saved,...saved.individuals),0);
});

test('a full pair can award its pouch once an eligible adult is available',()=>{
 const s=pair(7),[a,b]=s.individuals,O=F.Objects;
 a.visualStage=0;b.visualStage=0;
 assert.ok(O.awardAffinity(s,a,b));
 assert.equal(O.affinity(s,a,b),8);
 assert.equal(a.sporeSac,undefined);
 assert.equal(b.sporeSac,undefined);
 b.visualStage=3;
 s.worldTick+=180;
 assert.ok(O.awardAffinity(s,a,b));
 assert.equal(b.sporeSac,a.id);
 assert.equal(O.affinity(s,a,b),0);
});
