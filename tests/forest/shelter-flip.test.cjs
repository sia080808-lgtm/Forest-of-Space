const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine'),Sh=F.Shelter;
// 1.2.0: shelters can be mirrored left-right, and adding a shelter checks the base shelter too
function world(spec){const s=F.create(0,1);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;s.shelters.unlocked=true;Sh.init(s);Object.assign(s.weather,{kind:'cloud',wind:10,intensity:0,remaining:240,transition:0});
 const base=s.individuals[0];s.individuals=spec.map((sp,i)=>({...F.clone(base),id:'c'+i,species:sp.species,xp:sp.xp,visualStage:Sh.desiredStage({...base,...sp}),x:.45+.08*i,y:.62,energy:25,mood:80,B:60,nutrition:70,action:'rest',target:'shelter',shelter:{phase:'outside',since:0}}));Sh.init(s);return s;}
const R={species:'ridley',xp:150};
test('SHF-01 a mirrored shelter reflects its walls and entrance across the picture',()=>{const f={id:'x',level:1,x:.5,y:.6},g={...f,flip:true},t=Sh.transform(f),mid=(t.x+(220+t.extra)/2)/360;
 const p=Sh.polygon(f),q=Sh.polygon(g);a.equal(p.length,q.length);p.forEach((v,i)=>{a.ok(Math.abs((v.x+q[i].x)/2-mid)<1e-9);a.equal(v.y,q[i].y);});
 a.ok(Math.abs((Sh.entry(f).x+Sh.entry(g).x)/2-mid)<1e-9);a.equal(Sh.entry(f).y,Sh.entry(g).y);});
test('SHF-02 adding a shelter on top of the base shelter is refused (the base shelter is no longer skipped)',()=>{const s=world([]);a.throws(()=>Sh.plan(s,'shelter-0','add',{x:.23,y:.29}),/겹쳐/);});
test('SHF-03 a mirrored added shelter is saved, validated and kept after a save round trip',()=>{const s=world([R]);s.individuals[0].x=1.1;s.individuals[0].y=-.1;let spot=null;
 for(let y=.5;y<=1.1&&!spot;y+=.025)for(let x=-.1;x<=1.1&&!spot;x+=.025){try{Sh.plan(s,'shelter-0','add',{x,y,flip:true});spot={x,y};}catch{}}
 a.ok(spot,'a free spot exists');Sh.build(s,'shelter-0','add',{...spot,flip:true});const f=s.shelters.facilities.find(f=>!f.base);a.equal(f.flip,true);a.doesNotThrow(()=>Sh.validate(s));
 const back=F.migrate(JSON.parse(JSON.stringify(s)));a.equal(back.shelters.facilities.find(f=>!f.base).flip,true);
 Sh.build(s,f.id,'flip',{flip:false});a.equal('flip' in f,false);a.equal(f.x,spot.x);});
test('SHF-04 the base shelter can be mirrored in place (not moved) and friends still rest inside it',()=>{const s=world([R,R,R]);a.throws(()=>Sh.plan(s,'shelter-0','move',{x:.3,y:.3}));
 Sh.build(s,'shelter-0','flip',{flip:true,x:.5,y:.5});const b=s.shelters.facilities[0];a.equal(b.flip,true);a.equal(b.x,.23);a.equal(b.y,.29);a.doesNotThrow(()=>Sh.validate(s));
 for(let t=0;t<60;t++)F.step(s);a.equal(s.individuals.filter(p=>Sh.inside(s,p)).length,3);});
test('SHF-05 a shelter record with a non-boolean flip is rejected',()=>{const s=world([]);s.shelters.facilities[0].flip='yes';a.throws(()=>Sh.validate(s));});
