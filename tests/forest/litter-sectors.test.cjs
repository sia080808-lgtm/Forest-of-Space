const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine'),L=require('../../app/src/main/assets/web/litter.js'),O=F.Objects;
const game=(seed=24)=>{const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;return s;};
const near=(x,y,t=1e-6)=>a.ok(Math.abs(x-y)<t,`${x} != ${y}`);
function legacy(seed){const s=game(seed);for(let i=0;i<50;i++)F.step(s);delete s.objects.litter;delete s.rng.litter;const z=O.patch(s,'litter');z.O=70;z.U=30;return F.migrate(JSON.parse(JSON.stringify(s)));}
const balance=(s,base)=>O.storedLeaf(s)+s.objects.ledger.absorbed+(s.objects.ledger.soil||0)-s.objects.ledger.leafInput-base;

test('ECO24-N03 new game: three real loose leaves on the ground, compost 10 on the old spot, no pile yet',()=>{const s=game();a.equal(L.leaves(s).length,3);a.equal(L.piles(s).length,0);a.equal(O.patch(s,'litter').O,0);a.equal(O.patch(s,'litter').U,10);a.equal(L.floor(s),3);F.valid(s);});

test('ECO24-L01/L03/L05 over three game days leaves fall one at a time, five in a sector become one pile, conservation holds',()=>{
 for(const seed of [1,2,3]){const s=game(seed),base=O.storedLeaf(s);let first=null;
  for(let t=0;t<3600;t++){F.step(s);if(first===null&&L.piles(s).length)first=s.worldTick;if(t%600===0)F.valid(s);}
  near(balance(s,base),0);a.ok(s.objects.litter.fallen>=45&&s.objects.litter.fallen<=60,'fallen '+s.objects.litter.fallen);a.ok(first!==null&&first<2400,'first pile '+first);
  for(let i=0;i<12;i++){a.ok(L.piles(s).filter(p=>p.sector===i).length<=1);if(!L.piles(s).some(p=>p.sector===i))a.ok(L.leaves(s).filter(l=>l.sector===i).length<5);}
  for(const l of L.leaves(s))a.equal(L.sectorOf(l),l.sector);F.valid(s);}
});

test('ECO24-N01/P0-1 loose leaves never decompose; piles and the old spot do, and compost above the cap soaks into the soil',()=>{
 const s=game();s.objects.arrivedToday=s.objects.dayQuota;s.objects.litter.piles.push({id:'pile:50',sector:6,x:.5,y:.55,O:12,U:0,S:50,cap:100,W:0,playBoostUntil:0,born:0});
 const loose=L.leaves(s).map(l=>({...l})),base=O.storedLeaf(s);for(let t=0;t<600;t++){s.worldTick++;O.resources(s);}
 a.deepEqual(L.leaves(s),loose);const p=L.pile(s,'pile:50');a.ok(p.O<12&&p.U>0);near(p.O+p.U,12);near(balance(s,base),0);
 const t=game();t.objects.arrivedToday=t.objects.dayQuota;O.patch(t,'litter').U=100;t.objects.litter.piles.push({id:'pile:51',sector:6,x:.5,y:.55,O:12,U:0,S:50,cap:100,W:0,playBoostUntil:0,born:0});
 const tb=O.storedLeaf(t);for(let k=0;k<600;k++){t.worldTick++;O.resources(t);}a.ok(L.pile(t,'pile:51').O<12,'decomposition continues with full compost');a.ok(L.compost(t)<=O.capacity(t,'litter')+1e-9);a.ok(t.objects.ledger.soil>0);near(balance(t,tb),0);F.valid(t);
});

test('ECO24-N03/P0-2 old save: raw leaves move into three real piles (no leaf created or lost), the rest stays on the old spot, and leaves fall again within two minutes',()=>{
 for(const seed of [1,2,3,4]){const s=legacy(seed),m=s.objects.litter.migration;a.equal(m.from,70);a.equal(m.moved,36);a.equal(m.kept,34);a.equal(L.piles(s).length,3);for(const p of L.piles(s)){a.equal(p.O,12);a.equal(p.U,0);}
  a.equal(O.patch(s,'litter').O,34);a.equal(O.patch(s,'litter').U,30);near(O.storedLeaf(s),100);
  const l=s.objects.ledger,base=l.absorbed+(l.soil||0)-l.leafInput;let fall=null;for(let t=0;t<240;t++){F.step(s);if(fall===null&&s.objects.litter.fallen)fall=t+1;}
  a.ok(fall!==null&&fall<=120,'first fall '+fall);near(O.storedLeaf(s)+l.absorbed+(l.soil||0)-l.leafInput-base,100);F.valid(s);
  a.deepEqual(F.migrate(JSON.parse(JSON.stringify(s))).objects.litter,s.objects.litter,'migration runs once');}
});

test('ECO24-A01 friends play with and eat from real piles; carried leaves return to the same pile',()=>{
 const s=game(),p=s.individuals[0];s.objects.litter.piles.push({id:'pile:60',sector:5,x:.42,y:.5,O:8,U:4,S:50,cap:100,W:0,playBoostUntil:0,born:0});F.valid(s);
 a.deepEqual(O.litterSpots(s,'U',p),['pile:60','litter']);const o=O.option(s,p,'pile:60','nutrition','nutrition');a.ok(!o.fail,o.fail);
 const q=O.region(s,'pile:60','litterPlay');Object.assign(p,{x:q.x,y:q.y,mood:40});p.objectTask={object:'pile:60',kind:'litterPlay',reason:'mood',...q,serial:s.objects.nextSession++,since:s.worldTick,remaining:30,grade:2};p.objectNeeds=O.needs(p);p.motion={distance:0,kind:'idle',water:0};p.target='pile:60';
 const before=O.storedLeaf(s);a.ok(O.receive(s,p,[])===false);a.equal(p.carriedLeaf.pile,'pile:60');near(L.pile(s,'pile:60').O,7.5);near(O.storedLeaf(s),before);a.ok(L.pile(s,'pile:60').playBoostUntil>s.worldTick);F.valid(s);
 O.release(s,p);near(L.pile(s,'pile:60').O,8);near(O.storedLeaf(s),before);a.equal(O.reason(s,{...p,objectTask:{object:'pile:60',kind:'nutrition',x:0,y:0}}),'낙엽더미로 가고 있어요');
});

test('ECO24-L06 strong wind moves loose leaves only inside the map, piles stay; no leaf is lost',()=>{
 const s=game();s.objects.arrivedToday=s.objects.dayQuota;s.weather.wind=80;s.weather.wind_dir=0;const n=L.leaves(s).length,base=O.storedLeaf(s);
 for(let t=0;t<300;t++){s.worldTick++;s.weather.wind=80;O.resources(s);}a.ok(s.objects.litter.moves>0);a.equal(L.leaves(s).length+L.piles(s).reduce((v,p)=>v+p.O+p.U,0),n);near(balance(s,base),0);F.valid(s);
});

test('saved litter records are validated: a pile above 12 leaves, a duplicate pile in a sector or five loose leaves without a pile are rejected',()=>{
 for(const bad of [s=>s.objects.litter.piles.push({id:'pile:70',sector:1,x:.3,y:.3,O:13,U:0,S:0,cap:100,W:0,playBoostUntil:0,born:0}),
  s=>{for(const id of [71,72])s.objects.litter.piles.push({id:'pile:'+id,sector:2,x:.5,y:.3,O:5,U:0,S:0,cap:100,W:0,playBoostUntil:0,born:0});},
  s=>{for(let i=0;i<5;i++)s.objects.litter.leaves.push({id:100+i,sector:7,x:.88,y:.45,rot:0,moved:0});}]){const s=game();bad(s);a.throws(()=>F.valid(s));}
});
