const {test}=require('node:test'),assert=require('node:assert/strict');
const F=require('../../app/src/main/assets/web/engine'),Sh=F.Shelter,Space=F.Space;
const frozen=require('./fixtures/shelter-traffic-066.json');
function stalled(){return F.migrate(frozen);}
function noCrossing(s,p,old){
 let from=old;
 for(const to of p.motion.path.slice(1)){
  const dx=to.x-from.x,dy=(to.y-from.y)*Space.ASPECT,len=dx*dx+dy*dy;
  for(const z of s.individuals.filter(z=>z.active&&z.id!==p.id)){
   const t=len?Math.max(0,Math.min(1,((z.x-from.x)*dx+(z.y-from.y)*Space.ASPECT*dy)/len)):0;
   assert.ok(Space.distance(z,{x:from.x+t*dx,y:from.y+t*dy/Space.ASPECT})>=.4*(Space.diameter(p)+Space.diameter(z))-1e-8);
  }
  from=to;
 }
}
test('066 reproduction: empty shelter recovers both friends from the serialized entrance deadlock',()=>{
 const s=stalled(),f=s.shelters.facilities[0];assert.equal(Sh.ledger(s,f).used,0);
 const initial=s.individuals.map(p=>({id:p.id,xp:p.xp,size:Sh.growth(p),energy:p.energy}));
 for(let i=0;i<45&&!s.individuals.every(p=>Sh.inside(s,p));i++){
  const before=s.individuals.map(p=>({x:p.x,y:p.y}));F.step(s);F.valid(s);
  s.individuals.forEach((p,n)=>assert.ok(Space.distance(before[n],p)<=Space.gait(p,s).speed+1e-8));
  assert.ok(Sh.ledger(s,f).used+Sh.ledger(s,f).reserved<=Sh.capacity(f));
 }
 assert.ok(s.individuals.every(p=>Sh.inside(s,p)));F.advance(s,5);
 s.individuals.forEach((p,n)=>{assert.equal(p.id,initial[n].id);assert.equal(p.xp,initial[n].xp);assert.equal(Sh.growth(p),initial[n].size);assert.ok(p.energy>initial[n].energy);assert.match(Sh.label(s,p),/안에서/);});
});
test('066 entrance route avoids the other character continuously, with no collision bypass',()=>{
 const s=stalled();for(let tick=0;tick<35;tick++){
  Sh.prepare(s,null,Space);
  for(const p of s.individuals){const from={x:p.x,y:p.y},m=Sh.move(s,p,Space);if(m){p.motion=m;noCrossing(s,p,from);}}
  s.worldTick++;
 }
 assert.ok(s.individuals.every(p=>Sh.inside(s,p)));
});
test('066 deadlock save resumes with identity, resources and original positions preserved',()=>{
 const old=stalled(),s=F.migrate(old);
 const stable=p=>[p.id,p.name,p.xp,p.B,p.Q,p.V,p.energy,p.nutrition,p.x,p.y];
 assert.deepEqual(s.individuals.map(stable),old.individuals.map(stable));
 for(let i=0;i<40&&!s.individuals.every(p=>Sh.inside(s,p));i++)F.step(s);
 assert.ok(s.individuals.every(p=>Sh.inside(s,p)));F.valid(s);
});
test('066 repeated shelter departures and arrivals do not leave a vacant shelter deadlocked',()=>{
 const s=stalled();let vacantWaiting=0;
 for(let i=0;i<1500;i++){
  F.step(s);const f=s.shelters.facilities[0];
  if(Sh.ledger(s,f).used===0&&s.individuals.every(p=>Sh.wants(s,p)))vacantWaiting++;else vacantWaiting=0;
  assert.ok(vacantWaiting<90,`empty for ${vacantWaiting}s at ${s.worldTick}`);
 }
 F.valid(s);
});
test('066 actual capacity remains enforced: an adult Elephan cannot share basic shelter with adult Ridley',()=>{
 const s=stalled();for(const p of s.individuals){p.energy=30;p.xp=115;p.visualStage=3;Sh.release(p,s.worldTick);}
 F.advance(s,45);assert.equal(s.individuals.filter(p=>Sh.inside(s,p)).length,1);
 const waiting=s.individuals.find(p=>!Sh.inside(s,p));assert.ok(!Sh.inside(s,waiting));assert.ok(waiting.objectTask?.object!=='shelter'||waiting.objectWait||waiting.shelter.waitReason==='capacity');
 assert.ok(Sh.ledger(s,s.shelters.facilities[0]).free>=0);
});
test('066 no phantom waiting label after rest need ends',()=>{
 const s=F.create(0,67),p=s.individuals[0];Object.assign(p,{B:60,energy:80,action:'groom',target:null});
 p.shelter={phase:'waitingOutside',since:0,waitReason:'capacity'};Sh.prepare(s,null,Space);
 assert.equal(p.shelter.phase,'outside');assert.doesNotMatch(Sh.label(s,p),/기다리고/);
});
test('066 blocked entrance explains the path problem and retains the same queue request',()=>{
 const s=F.create(0,67),p=s.individuals[0];s.started=true;Object.assign(p,{B:55,energy:30,action:'rest',target:'shelter'});
 const rock=s.patches.find(z=>z.id==='rock'),old={x:rock.x,y:rock.y};Object.assign(rock,Sh.entry(s.shelters.facilities[0],Sh.seat(s,s.shelters.facilities[0],p)));
 Sh.prepare(s,null,{...Space,route:()=>null});assert.equal(p.shelter.waitReason,'path');assert.match(Sh.label(s,p),/입구가 막혀/);assert.equal(s.shelters.unlocked,false);
 const request=p.shelterRequest.id;Object.assign(rock,old);Sh.prepare(s,null,Space);assert.equal(p.shelterRequest.id,request);
 F.advance(s,40);assert.ok(Sh.inside(s,p));
});
test('066 too-close saved friends may separate, but cannot walk through each other',()=>{
 const s=F.create(0,67),p=s.individuals[0],q=F.clone(p);q.id='other';Object.assign(p,{x:.5,y:.6});Object.assign(q,{x:.53,y:.6});s.individuals.push(q);
 const before=Space.distance(p,q),m=Space.travel(s,p,{x:.42,y:.6});assert.ok(m.distance>0);assert.ok(Space.distance(p,q)>before);
 Object.assign(p,{x:.5,y:.6});assert.equal(Space.route(s,p,{x:.515,y:.6},p.id,true),null);
});
