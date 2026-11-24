const {test}=require('node:test');
const assert=require('node:assert/strict');
const F=require('../../app/src/main/assets/web/engine');
const Cards=require('../../app/src/main/assets/web/object-cards');
const O=F.Objects;
const second={x:.98,y:.55},third={x:.10,y:.90};
test('each terrain type permits two additional placements and preserves old saves',()=>{
 const old=F.create(0,18);
 for(const kind of O.COPY_KINDS){
  const s=F.migrate(F.clone(old),0);
  const original=F.clone(O.patch(s,kind));
  assert.equal(O.nextCopyId(s,kind),kind+'-2');
  const positions={[kind+'-2']:second,[kind+'-3']:third};
  const water=F.totalWater(s),leaves=O.storedLeaf(s);
  F.validateLayout(s,positions);
  assert.equal(O.patchesOf(s,kind).length,1);
  F.layout(s,positions);F.valid(s);
  assert.equal(F.totalWater(s),water,kind);
  assert.equal(O.storedLeaf(s),leaves,kind);
  assert.deepEqual(O.patch(s,kind),original,kind);
  assert.equal(O.patchesOf(s,kind).length,3);
  assert.equal(O.nextCopyId(s,kind),null);
  assert.throws(()=>F.layout(s,{[kind+'-4']:{x:1,y:1}}),/최대 3/);
  const loaded=F.migrate(F.clone(s),0);
  assert.deepEqual(O.patchesOf(loaded,kind),O.patchesOf(s,kind));
  assert.match(Cards.model(loaded,kind+'-3').name,/3$/);
 }
});
test('storage retains the copy and its water and cannot bypass the limit',()=>{
 const s=F.create(0,18);
 F.layout(s,{'moss-2':second,'moss-3':third});
 O.patch(s,'moss-2').S=3;
 F.storeObject(s,'moss-2');
 assert.equal(O.nextCopyId(s,'moss'),null);
 assert.throws(()=>F.layout(s,{'moss-2':second}),/최대 3/);
 F.unstoreObject(s,'moss-2');F.valid(s);
 assert.equal(O.patch(s,'moss-2').S,3);
});
test('a friend reaches a stocked additional spring when the original is dry',()=>{
 const s=F.create(0,18),p=s.individuals[0];
 F.layout(s,{'spring-2':second});
 const extra=O.patch(s,'spring-2');
 extra.water=28;s.spring.water=0;
 s.started=true;s.environment.tutorialDone=true;s.environment.climateMode='fixed';s.recruitment.nextAttempt=1e9;
 Object.assign(s.weather,{kind:'sun',wind:8,intensity:0,remaining:200,transition:0});
 Object.assign(p,{x:.94,y:.68,B:27,nutrition:54,energy:72});
 let drank=false;
 for(let t=0;t<90;t++){F.step(s);if(p.objectTask?.object==='spring-2'&&p.motion.water>0){drank=true;break;}}
 assert.ok(drank);
 assert.equal(s.spring.water,0);
 assert(extra.water<28);assert(p.B>24);
 F.valid(s);
});
test('additional shade protects its own position and additional litter decomposes under the shared forest budget',()=>{
 const s=F.create(0,18);
 F.layout(s,{'shade-2':second,'litter-2':third});
 const shade=O.patch(s,'shade-2'),bed=O.patch(s,'litter-2');
 assert.equal(F.Weather.rainCover(s,shade),.5);
 assert.ok(F.light(s,shade)<s.climate.L);
 bed.O=3;bed.S=bed.cap/2;
 s.worldTick=100;
 const leaves=O.storedLeaf(s);
 s.objects.arrivedToday=s.objects.dayQuota;
 F.Litter.step(s);
 assert.ok(bed.U>0);assert.ok(bed.O<3);
 assert.ok(Math.abs(O.storedLeaf(s)-leaves)<1e-8);
 F.valid(s);
});
