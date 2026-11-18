const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine');
test('0.6.30 보송 is now 베이치 (Platycerium veitchii): new visitors, the guide, and saved friends without a custom name',()=>{
 a.equal(F.SPECIES.find(x=>x[0]==='bosong')[1],'베이치');a.equal(F.Recruitment.names[F.Recruitment.ids.indexOf('bosong')],'베이치');
 const s=F.create(0,3),base=s.individuals[0];s.individuals.push({...F.clone(base),id:'b1',species:'bosong',name:'보송',active:false},{...F.clone(base),id:'b2',species:'bosong',name:'보송',customName:true,active:false});
 F.Recruitment.init(s);s.recruitment.target='bosong';Object.assign(s.recruitment.progress.bosong,{valid:179,failures:3});s.recruitment.serial=1;s.spring.water=60;
 F.Recruitment.tick(s,{Space:F.Space,Social:F.Social,rng:()=>0,event:F.event,personality:F.personality});if(s.recruitment.visitor)s.recruitment.visitor.pet.name='보송';
 const m=F.migrate(JSON.parse(JSON.stringify(s)));a.deepEqual(m.individuals.map(p=>p.name),['리들리','베이치','보송']);if(m.recruitment.visitor?.species==='bosong')a.equal(m.recruitment.visitor.pet.name,'베이치');F.valid(m);
});
