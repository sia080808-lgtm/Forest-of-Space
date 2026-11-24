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
