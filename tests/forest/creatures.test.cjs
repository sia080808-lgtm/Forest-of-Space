const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine'),C=F.Creatures,L=F.Litter,O=F.Objects;
const game=(seed=6)=>{const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;return s;};
const balance=(s,base)=>O.storedLeaf(s)+s.objects.ledger.absorbed+(s.objects.ledger.soil||0)-s.objects.ledger.leafInput-base;

test('ECO24-B01 nothing arrives in the first 600 s; then helpers and pests each add at most one new group per 600 s at the 180 s checks, 8 groups total',()=>{
 const s=game(8),C2=C;// 0.8.3: seed 3 now has no helper in these two hours (night sleep moved ridley; same rate overall)
for(let t=0;t<599;t++){F.step(s);a.equal(C.groups(s).length,0);}
 const PEST=['mite','gnat','mealy'],PRED=['keeper','soilmite','lady','rove'],seen=new Set(),arr={helper:[],pest:[],ant:[]};
 for(let t=0;t<3600*2;t++){F.step(s);for(const g of C2.groups(s))if(!seen.has(g.id)){seen.add(g.id);if(PRED.includes(g.kind)||g.from)continue;// 0.6.38: a group that spread from another (ECO-13) is not a new arrival
arr[PEST.includes(g.kind)?'pest':g.kind==='ant'?'ant':'helper'].push(s.worldTick);}   /* 0.7.1: ant colonies keep their own 600 s spacing apart from the other neighbours (SRS v2.30) */a.ok(C.groups(s).length<=8);a.ok(C.pestKinds(s).size<=2);}
 a.ok(arr.helper.length+arr.ant.length>=1);for(const k of ['helper','pest','ant']){const v=arr[k];a.ok(v.every(t=>t%180===0),k+' '+v);for(let i=1;i<v.length;i++)a.ok(v[i]-v[i-1]>=600,k+' spacing '+v);}F.valid(s);
});

test('ECO24-A01 a carrier ant moves real loose leaves into piles or gatherings; every leaf is conserved and none is created',()=>{
 for(const seed of [5,7,9]){const s=game(seed),base=O.storedLeaf(s);let carried=0,sawCarry=false;// 0.7.1/0.8.0: colonies settle later (3 leaves near a ridley, fewer leaves in spring); 0.8.3: night sleep shifts which seeds get a colony early (same rate, 6/8 seeds in a year before and after); 0.8.5: walks to the open ground shift them again (a colony in a year: 6/8 -> 8/8 seeds)
  for(let t=0;t<7200;t++){F.step(s);const g=C.groups(s).find(g=>g.kind==='ant');if(g?.carry){sawCarry=true;a.ok(L.floor(s)<=L.LCAP+1e-9);}if(t%300===0){F.valid(s);a.ok(Math.abs(balance(s,base))<1e-6);}}
  carried=s.objects.creatures.log.carried;a.ok(sawCarry&&carried>0,'seed '+seed+' carried '+carried);a.ok(Math.abs(balance(s,base))<1e-6);}
});

test('ECO24-N01/A02 a springtail group speeds only its own pile x1.25 (never stacked); the old litter spot is unaffected',()=>{
 const s=game();s.objects.arrivedToday=s.objects.dayQuota;
 s.objects.litter.piles.push({id:'pile:70',sector:5,x:.42,y:.5,O:12,U:0,S:55,cap:100,W:0,playBoostUntil:0,born:0},{id:'pile:71',sector:7,x:.8,y:.45,O:12,U:0,S:55,cap:100,W:0,playBoostUntil:0,born:0});
 s.objects.creatures.groups.push({id:'cr:90',kind:'springtail',pile:'pile:70',since:0,bad:0,lastWork:0,carry:null});
 const r70=L.rates(s,L.pile(s,'pile:70')),r71=L.rates(s,L.pile(s,'pile:71'));a.equal(r70.spring,1.25);a.equal(r71.spring,1);a.ok(Math.abs(r70.perMinute-r71.perMinute*1.25)<1e-9);
 a.ok((L.rates(s,s.patches.find(p=>p.id==='litter')).spring??1)===1);
 L.pile(s,'pile:70').playBoostUntil=1e9;a.ok(L.rates(s,L.pile(s,'pile:70')).perMinute<=.5*3.75+1e-9);F.valid(s);
});

test('springtails need a real fitting pile (L>=3, 60 s old, moist 35~75, no standing water) for 120 s, and leave 120 s after it stops fitting',()=>{
 const s=game();const p={id:'pile:80',sector:5,x:.42,y:.5,O:6,U:0,S:55,cap:100,W:0,playBoostUntil:0,born:s.worldTick-100};s.objects.litter.piles.push(p);
 a.equal(C.springOk(s,p),true);a.equal(C.springOk(s,{...p,O:2}),false);a.equal(C.springOk(s,{...p,S:90}),false);a.equal(C.springOk(s,{...p,W:2}),false);a.equal(C.springOk(s,{...p,born:s.worldTick}),false);
 s.objects.creatures.groups.push({id:'cr:91',kind:'springtail',pile:'pile:80',since:0,bad:0,lastWork:0,carry:null});
 L.pile(s,'pile:80').O=1;for(let t=0;t<119;t++){s.worldTick++;C.step(s);if(L.pile(s,'pile:80'))L.pile(s,'pile:80').O=1;}a.ok(C.groups(s).some(g=>g.id==='cr:91'));
 s.worldTick++;C.step(s);a.ok(!C.groups(s).some(g=>g.id==='cr:91'));
});

test('an ant that leaves while carrying puts the leaf back where it was taken (nothing is lost)',()=>{
 const s=game(5);let g=null;for(let t=0;t<7200&&!(g&&g.carry);t++){F.step(s);g=C.groups(s).find(x=>x.kind==='ant');}
 a.ok(g&&g.carry);const before=O.storedLeaf(s),from=g.carry.fromSector;s.individuals.forEach(p=>{p.active=false;});
 g.away=C.ANT.ABSENT-1;g.carry.arrive=1e9;// 0.7.1: a colony leaves after a day without its ridleys.worldTick++;C.step(s);a.ok(!C.groups(s).includes(g));a.ok(Math.abs(O.storedLeaf(s)-before)<1e-9);a.ok(L.sectorRaw(s,from)>=1);
});

test('saved small-neighbour records are validated and survive a reload unchanged',()=>{
 const s=game(1);for(let t=0;t<2400;t++)F.step(s);const m=F.migrate(JSON.parse(JSON.stringify(s)));a.deepEqual(m.objects.creatures,s.objects.creatures);
 for(const bad of [x=>x.objects.creatures.groups.push({id:'cr:1',kind:'ant',since:0,bad:0},{id:'cr:2',kind:'ant',since:0,bad:0,nest:{x:.5,y:.5}}),x=>x.objects.creatures.groups.push({id:'cr:3',kind:'beetle',since:0,bad:0})]){const t=JSON.parse(JSON.stringify(s));bad(t);a.throws(()=>F.valid(t));}
});
