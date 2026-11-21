// 1.2.6 보관함 (user: "꾸미기에서 쉼터도 옮기기 가능하게", "꾸미공간 오브젝트들 보관하기(월드에서 없애기)", "꾸미기 창에 보관함")
const {test}=require('node:test'),a=require('node:assert/strict');
const F=require('../../app/src/main/assets/web/engine'),A=require('../../app/src/main/assets/web/admin.js');
const game=()=>{const s=F.create(5,2);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;for(const [sp,x,y] of [['bonbon',.6,.55],['neolbi',.3,.6],['bosong',.42,.5],['jureong',.5,.7],['superbum',.7,.4]])s.individuals.push({...F.clone(s.individuals[0]),id:'p-'+sp,species:sp,name:sp,x,y,active:true});F.valid(s);for(let i=0;i<300;i++)F.step(s);return s;};
test('ST-01 moss, rock, shade and crevice go into the 보관함 and come back; the water stays with them; spring and litter stay',()=>{const s=game();
 for(const id of ['spring','litter'])a.throws(()=>F.storeObject(s,id));
 const water=F.totalWater(s),mossWater=s.patches.find(p=>p.id==='moss').S;for(const id of F.STORABLE)F.storeObject(s,id);F.valid(s);
 a.deepEqual(s.patches.map(p=>p.id).sort(),['litter','shelter']);a.equal(s.objects.stored.length,4);a.ok(Math.abs(F.totalWater(s)-water)<1e-9);a.equal(s.objects.stored.find(p=>p.id==='moss').S,mossWater);
 const back=F.unstoreObject(s,'moss');a.ok(Number.isFinite(back.x));F.valid(s);a.ok(s.patches.some(p=>p.id==='moss'));
 for(const id of ['rock','shade','crevice'])F.unstoreObject(s,id);F.valid(s);a.equal(s.objects.stored,undefined);a.equal(s.patches.length,6);});
test('ST-02 with everything put away the garden keeps running through rain, gale and snow; nobody uses a stored object',()=>{const s=game();for(const id of F.STORABLE)F.storeObject(s,id);
 for(let i=0;i<1500;i++){if(i===100)A.run(F,s,'weather','rain');if(i===600)A.run(F,s,'weather','gale');if(i===1000){A.run(F,s,'season',3);A.run(F,s,'weather','snow');}F.step(s);for(const p of s.individuals)a.ok(!F.STORABLE.includes(p.objectTask?.object),p.name+' uses '+p.objectTask?.object);if(i%300===0)F.valid(s);}
 const j=JSON.parse(JSON.stringify(s));F.valid(j);for(const id of F.STORABLE)F.unstoreObject(s,id);F.valid(s);});
test('ST-03 the first shelter can be moved (it still cannot be put away)',()=>{const s=F.create(5,2);s.started=true;F.valid(s);const f=s.shelters.facilities[0];
 a.throws(()=>F.Shelter.build(s,f.id,'store'),/하나 남겨/);
 let moved=false;for(const [dx,dy] of [[.03,.03],[.05,0],[0,.05],[-.03,.04]]){try{F.Shelter.build(s,f.id,'move',{x:f.x+dx,y:f.y+dy});moved=true;break;}catch(e){}}a.ok(moved,'moved');F.valid(s);});
test('ST-04 a rounding crumb below zero in a patch is set to zero (the save check passes)',()=>{const s=game();s.patches.find(p=>p.id==='shade').S=-6.9e-18;F.step(s);F.valid(s);const t=JSON.parse(JSON.stringify(s));t.patches.find(p=>p.id==='moss').S=-1e-17;F.valid(F.migrate(t));});
