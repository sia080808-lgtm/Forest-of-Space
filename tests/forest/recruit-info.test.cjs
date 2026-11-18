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
