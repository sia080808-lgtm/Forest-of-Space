const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine');
test('Korean particles follow the last syllable: 두리가, 엘리시가, 리들리가, 바위 틈을',()=>{const j=F.Recruitment.josa;a.equal(j('두리','이','가'),'두리가');a.equal(j('엘리시','이','가'),'엘리시가');a.equal(j('엘레판','이','가'),'엘레판이');a.equal(j('바위 틈','을','를'),'바위 틈을');a.equal(j('공간','을','를'),'공간을');});
test('Ellisii recruitment shows each habitat requirement with its live value and blocks on the failing one',()=>{const s=F.create(0,5),R=F.Recruitment,moss=s.patches.find(p=>p.id==='moss');
 let c=R.conditions(s,'bonbon',F.Space,F.Social);a.equal(c.checks.length,4);a.ok(c.checks.every(k=>k.ok));a.equal(c.ok,true);
 moss.S=moss.cap*.9;c=R.conditions(s,'bonbon',F.Space,F.Social);a.equal(c.ok,false);a.match(c.checks[0].label,/90%/);a.equal(c.checks[0].ok,false);a.match(c.reason,/바위 틈을 마련해 주세요/);
 const before=JSON.stringify(s);R.conditions(s,'bonbon',F.Space,F.Social);a.equal(JSON.stringify(s),before);});
