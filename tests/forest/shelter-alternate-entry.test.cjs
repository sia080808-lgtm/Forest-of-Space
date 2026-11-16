const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine'),Sh=F.Shelter;
test('valid moved terrain blocks first seat entrance but reachable alternate admits adult Ridley',()=>{
 const s=F.create(0,68),p=s.individuals[0];s.started=true;
 Object.assign(p,{xp:150,visualStage:3,x:.12,y:.65,B:64,energy:99,action:'rest',target:'shelter',actionSeconds:300});
 F.layout(s,{rock:{x:.12,y:.36}});
 const first=Sh.seat(s,s.shelters.facilities[0],p);
 a.equal(F.Space.route(s,p,Sh.entry(s.shelters.facilities[0],first),p.id),null);
 Sh.prepare(s,null,F.Space);a.equal(p.shelter.phase,'moving');a.notEqual(p.shelter.x,first.x);
 for(let i=0;i<60&&!Sh.inside(s,p);i++){F.step(s);F.valid(s);}
 a.ok(Sh.inside(s,p));a.equal(p.xp,150);a.equal(Sh.growth(p),1);
});
