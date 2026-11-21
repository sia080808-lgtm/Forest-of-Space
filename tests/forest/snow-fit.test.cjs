const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine.js'),E=require('../../app/src/main/assets/web/environment.js');
// 1.2.1 phone report: "정원을 열지 못했어요 · 친구의 적설 기록을 확인해 주세요" — a friend that became smaller kept more leaf snow than its
// leaves can hold, so the saved garden failed its check on the next launch
test('SNOW-FIT a save with too much leaf snow for a smaller friend still opens; the extra slides off as runoff',()=>{
 const s=F.create(1,2);s.started=true;const p=s.individuals[0];p.visualStage=3;p.snowWater=10;F.step(s);
 p.visualStage=0;const raw=JSON.stringify(s);
 a.throws(()=>E.validate(JSON.parse(raw)),/적설/,'the raw save is the broken one from the phone');
 const out0=s.ledger.outflow,t=F.migrate(JSON.parse(raw)),cap=12*E.area(t.individuals[0]);
 a.ok(t.individuals[0].snowWater<=cap+1e-9);a.ok(t.ledger.outflow>out0,'the extra snow is booked as runoff');
 F.transaction(t,x=>F.advance(x,5),()=>true);
});
