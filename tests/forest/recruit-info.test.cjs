const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine');
test('Korean particles follow the last syllable: 두리가, 엘리시가, 리들리가, 바위 틈을',()=>{const j=F.Recruitment.josa;a.equal(j('두리','이','가'),'두리가');a.equal(j('엘리시','이','가'),'엘리시가');a.equal(j('엘레판','이','가'),'엘레판이');a.equal(j('바위 틈','을','를'),'바위 틈을');a.equal(j('공간','을','를'),'공간을');});
test('Ellisii recruitment shows each habitat requirement with its live value and blocks on the failing one',()=>{const s=F.create(0,5),R=F.Recruitment,moss=s.patches.find(p=>p.id==='moss');
 let c=R.conditions(s,'bonbon',F.Space,F.Social);a.ok(c.checks.every(k=>k.ok));a.equal(c.ok,true);
 a.equal(c.checks.length,5);
 // A full moss (it holds only 5 water, so rain fills it) is still a fit nook; dry moss or heavy rain is not.
 moss.S=moss.cap;c=R.conditions(s,'bonbon',F.Space,F.Social);a.equal(c.ok,true);
 moss.S=moss.cap*.3;c=R.conditions(s,'bonbon',F.Space,F.Social);a.equal(c.ok,false);a.match(c.checks[0].label,/30%/);a.equal(c.checks[0].ok,false);a.match(c.reason,/바위 틈을 마련해 주세요/);
 moss.S=moss.cap;Object.assign(s.weather,{kind:'rain',intensity:100,transition:0});c=R.conditions(s,'bonbon',F.Space,F.Social);if(F.Environment.precipitation(s,'rain')>=.6){a.equal(c.ok,false);a.equal(c.checks[1].ok,false);}
 const before=JSON.stringify(s);R.conditions(s,'bonbon',F.Space,F.Social);a.equal(JSON.stringify(s),before);});
test('Ellisii can actually arrive: with Ridley and Elephan settled and other visitors met, she visits within one game hour in most worlds',()=>{let arrived=0;
 for(const seed of [1,2,3,4]){const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;F.welcomeNeolbi(s);s.recruitment.target='bonbon';
  for(let t=0;t<3600;t++){F.step(s);const v=s.recruitment.visitor;if(v){if(v.species==='bonbon'){arrived++;break;}s.recruitment.visitor=null;s.recruitment.settled.push(v.id);}}}
 a.ok(arrived>=3,'arrived in '+arrived+'/4');});
test('두리 is retired: Ellisii is the first visitor of a new forest; a waiting or queued 두리 visit becomes an Ellisii visit; a 두리 already living stays',()=>{const R=F.Recruitment;a.deepEqual(R.retired,['duri']);
 for(const seed of [1,2,3,4]){const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;let first=null;for(let t=0;t<600&&!first;t++){F.step(s);if(s.recruitment.visitor)first=s.recruitment.visitor.species;}a.equal(first,'bonbon');}
 const s=F.create(0,9);s.started=true;s.environment.tutorialDone=true;for(let t=0;t<200;t++)F.step(s);s.recruitment.serial=1;s.recruitment.target='duri';
 s.recruitment.visitor={id:'visit-1-duri',species:'duri',pet:{},seconds:5,open:false,ready:false,water:20,leaves:3,phase:'adapt',x:.5,y:.77,companion:null};
 const m=F.migrate(JSON.parse(JSON.stringify(s)));a.equal(m.recruitment.visitor,null);a.deepEqual(m.recruitment.pending,['bonbon']);a.equal(m.recruitment.target,null);F.step(m);a.equal(m.recruitment.visitor.species,'bonbon');
 const q=F.create(0,10);q.recruitment.pending=['duri'];R.init(q);a.deepEqual(q.recruitment.pending,['bonbon']);
 // a 두리 that already lives in the forest is kept as is
 const o=F.create(0,11);o.individuals.push({...o.individuals[0],id:'duri-1',species:'duri',name:'두리'});const om=F.migrate(JSON.parse(JSON.stringify(o)));a.ok(om.individuals.some(p=>p.species==='duri'));
 for(let t=0;t<2000;t++){F.step(om);const v=om.recruitment.visitor;if(v){a.notEqual(v.species,'duri');om.recruitment.visitor=null;}}});
test('first-meeting card lists what the visitor is waiting for, with live values, and only the buttons that visitor needs',()=>{const R=F.Recruitment,s=F.create(0,3);s.started=true;s.environment.tutorialDone=true;
 while(!s.recruitment.visitor)F.step(s);a.equal(s.recruitment.visitor.species,'bonbon');R.open(s);let st=R.steps(s);a.deepEqual(st.list.map(k=>k.done),[false,false,false]);a.deepEqual(st.buttons,{greet:false,guide:false});a.equal(st.leaveIn,600);
 const before=JSON.stringify(s);R.steps(s);a.equal(JSON.stringify(s),before,'read-only');
 let ready=null;for(let i=0;i<300&&ready===null;i++){F.step(s);if(s.recruitment.visitor.ready)ready=s.recruitment.visitor.seconds;}
 st=R.steps(s);a.ok(ready!==null&&ready<=180,'ready at '+ready);a.ok(st.list.every(k=>k.done));a.equal(st.leaveIn,null);a.match(st.list[2].value,/120 \/ 120초/);});
