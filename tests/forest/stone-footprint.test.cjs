const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine'),S=F.Space,O=F.Objects,Sh=F.Shelter;
const calm=s=>{s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;Object.assign(s.weather,{kind:'sun',wind:10,intensity:0,remaining:240,transition:0});Object.assign(s.patches.find(z=>z.id==='rock'),{W:0,film:0,S:0});return s;};
test('STONE0615-01 sun-rock rest area is on the rock top, above the stone anchor',()=>{const s=F.create(0,1),r=s.patches.find(p=>p.id==='rock'),z=O.region(s,'rock');a.ok(z.y<r.y,'rest area is above the anchor (on the drawn rock)');a.ok(S.onRock(s,z));a.ok(S.walkable(s,z));});
test('STONE0615-02 a tired friend climbs onto the sun rock, rests there and can leave',()=>{for(const sp of ['ridley','neolbi']){const s=calm(F.create(0,9));let p=s.individuals[0];if(sp==='neolbi'){F.welcomeNeolbi(s);s.individuals[0].active=false;p=s.individuals[1];p.active=true;}
 Object.assign(p,{x:.45,y:.62,energy:30,mood:80,B:60,nutrition:70,xp:120,visualStage:3});p.objectTask=O.option(s,p,'rock','rest','energy');a.ok(!p.objectTask.fail,sp);p.nextObjectChoice=s.worldTick+500;
 for(let n=0;n<60;n++)F.step(s);a.ok(S.onRock(s,p),sp+' on rock');a.ok(p.energy>30);p.energy=80;p.B=30;delete p.objectTask;p.nextObjectChoice=0;for(let n=0;n<40;n++)F.step(s);a.ok(!S.onRock(s,p),sp+' left');F.valid(s);}});
test('STONE0615-03 passers-by do not cross the drawn rock or crevice body',()=>{let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(const id of ['crevice','rock']){const s=F.create(0,5),c=s.patches.find(p=>p.id===id),core={x:c.x+.005,y:c.y-.035,rx:.08,ry:.022};let routes=0;
  for(let i=0;i<120;i++){const p0={x:c.x-.2+rnd()*.4,y:c.y-.17+rnd()*.07},p1={x:c.x-.2+rnd()*.4,y:c.y+.06+rnd()*.08};if(!S.walkable(s,p0)||!S.walkable(s,p1)||S.onRock(s,p0)||S.onRock(s,p1))continue;const r=S.route(s,p0,p1);if(!r)continue;routes++;let q0=p0;
   for(const q of r){for(let k=1;k<=60;k++){const z={x:q0.x+(q.x-q0.x)*k/60,y:q0.y+(q.y-q0.y)*k/60};a.ok(((z.x-core.x)/core.rx)**2+((z.y-core.y)/core.ry)**2>=1,id+' crossed');}q0=q;}}
  a.ok(routes>50,id+' routes');}});
test('STONE0615-04 layouts and shelter doors valid before stay valid (legacy footprint fallback)',()=>{const s=F.create(0,1);s.shelters.unlocked=true;Sh.init(s);s.shelters.facilities[0].level=2;F.valid(s);
 const e=Sh.entry(s.shelters.facilities[0]);for(const id of ['spring','rock','moss','shade','crevice','litter'])a.ok(S.route(s,e,S.socket(s,id)),id);});
test('STONE0615-05 a friend saved inside a stone footprint can walk out, never deeper',()=>{const s=calm(F.create(0,3)),c=s.patches.find(p=>p.id==='crevice'),p=s.individuals[0];Object.assign(p,{x:c.x,y:c.y-.03});
 a.ok(!S.walkable(s,p));a.ok(S.route(s,p,{x:c.x,y:c.y+.08},p.id),'outward route exists');});
