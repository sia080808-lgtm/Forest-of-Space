const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine'),C=F.Creatures,O=F.Objects,L=F.Litter;
function game(seed=5){const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;const p=s.individuals[0];p.x=.8;p.y=.8;C.init(s);const st=s.objects.creatures;st.lastArrival=1e9;st.lastPest=1e9;return s;}
const spot=s=>s.patches.find(z=>z.id==='litter');
function drained(s,M=60){const z=spot(s);z.S=z.cap*M/100;z.W=0;z.O=Math.max(z.O,5);z.U=Math.max(z.U,5);return z;}
const add=(s,g)=>{const st=s.objects.creatures;g={id:'cr:'+st.nextId++,since:s.worldTick,bad:0,lastWork:s.worldTick,carry:null,...g};st.groups.push(g);return g;};
const tick=s=>{s.climate.T=60;s.weather.kind='cloud';s.worldTick++;C.step(s);};

test('쏙쏙이 needs root-fly larvae (>=5), drained moist soil AND a rock/crevice hideout within 0.3; comes in 120~300 s (ECO-07)',()=>{
 const s=game(),z=drained(s);const g=add(s,{kind:'gnat',site:'litter',adults:0,eggs:0,larvae:40,low:0,fit:0});
 const far=s.patches.filter(q=>['crevice','rock'].includes(q.id));const keep=far.map(q=>({q,x:q.x,y:q.y}));for(const q of far){q.x=.95;q.y=.95;}
 for(let t=0;t<400;t++){tick(s);drained(s);g.larvae=40;}a.equal(C.inSoil(s,'litter').rove,null,'no hideout, no 쏙쏙이');
 keep.forEach(({q,x,y})=>{q.x=x;q.y=y;});const cr=s.patches.find(q=>q.id==='crevice');cr.x=z.x+.1;cr.y=z.y;a.ok(C.roveFit(s,z));
 let at=null;for(let t=0;t<301&&!at;t++){tick(s);drained(s);g.larvae=40;g.adults=0;if(C.inSoil(s,'litter').rove)at=t+1;}a.ok(at>=120&&at<=300,'arrived after '+at);a.ok(['crevice','rock'].includes(C.inSoil(s,'litter').rove.hide));
});

test('ECO-08 at one site 흙지기 + 쏙쏙이 eat at most 12/min together (each at most 8); ECO-12 쏙쏙이 has no substitute food and leaves 120 s after the prey is gone',()=>{
 const s=game();drained(s);const g=add(s,{kind:'gnat',site:'litter',adults:0,eggs:0,larvae:100,low:0,fit:0});const sm=add(s,{kind:'soilmite',site:'litter',eaten:0}),rv=add(s,{kind:'rove',site:'litter',hide:'crevice',eaten:0});
 for(let t=0;t<60;t++){tick(s);drained(s);g.adults=0;}const total=sm.eaten+rv.eaten;a.ok(total<=12+1e-6&&total>=12-1e-6,'together '+total);a.ok(sm.eaten<=8+1e-6&&rv.eaten<=8+1e-6);
 g.larvae=0;g.eggs=0;const z=spot(s);z.U=5;for(let t=0;t<119;t++){tick(s);drained(s);g.larvae=0;g.eggs=0;}a.ok(C.groups(s).includes(rv),'still looking');tick(s);a.ok(!C.groups(s).includes(rv),'left: no substitute food');a.ok(C.groups(s).includes(sm),'흙지기 stays on leftover U');
});

test('돌돌이 (a detritivore) helps decompose litter near the crevice x1.1 only while it is really visiting',()=>{
 const s=game(),cr=s.patches.find(q=>q.id==='crevice'),z=spot(s);cr.x=z.x+.1;cr.y=z.y;const before=L.rates(s,z).perMinute;
 s.neighbor.stage='visiting';a.ok(C.pillNear(s,z));const r=L.rates(s,z);a.ok(Math.abs(r.perMinute-before*1.1)<1e-9,'x1.1');
 s.neighbor.stage='none';a.equal(L.rates(s,z).perMinute,before);cr.x=z.x+.4;s.neighbor.stage='visiting';a.equal(L.rates(s,z).perMinute,before,'too far');
});

test('엘레판’s spread leaf shades the friends under it: their leaves dry like under the shade plant (less spider-mite risk)',()=>{
 const s=game();s.climate.T=70;s.climate.H=60;s.weather.kind='sun';const p=s.individuals[0];
 F.welcomeNeolbi(s);const e=s.individuals.find(q=>q.species==='neolbi');e.active=true;e.x=.42;e.y=.25;const g=require('../../app/src/main/assets/web/neolbi.js').geometry(e);
 p.x=g.cx;p.y=g.cy;e.canopyProgress=0;const folded=C.leaf(s,p).H;e.canopyProgress=1;const under=C.leaf(s,p).H;
 a.ok(under>folded,'under the spread leaf '+under+' vs folded '+folded);a.equal(under-folded,10,'the same as the shade plant (+10)');
});

test('plant side: with pests on its leaves a friend tidies its leaves more and prefers shade/water; it never plays in litter where root-fly larvae live',()=>{
 const run=(mites,gnats)=>{const s=game(7);const p=s.individuals[0];let groom=0,shadeWater=0,playInfested=0;
  for(let t=0;t<2400;t++){p.B=Math.max(p.B,60);p.energy=90;p.nutrition=90;p.mood=90;p.damage=0;
   if(mites){let m=C.onLeaf(s,p.id).mite;if(!m)m=add(s,{kind:'mite',host:p.id,density:50,low:0});m.density=50;}
   if(gnats){let g=C.groups(s).find(x=>x.kind==='gnat');if(!g)g=add(s,{kind:'gnat',site:'litter',adults:0,eggs:0,larvae:30,low:0,fit:0});g.larvae=30;}
   F.step(s);if(p.action==='groom')groom++;if(['shade','spring'].includes(p.objectTask?.object))shadeWater++;if(p.objectTask?.kind==='litterPlay'&&p.objectTask.object==='litter')playInfested++;}
  return {groom,shadeWater,playInfested};};
 const base=run(false,false),mite=run(true,false),gnat=run(false,true);
 a.ok(mite.groom>base.groom,'groom '+mite.groom+' vs '+base.groom);a.ok(mite.shadeWater>base.shadeWater,'shade/water '+mite.shadeWater+' vs '+base.shadeWater);a.equal(gnat.playInfested,0);
});

test('the guide records which small neighbours really came (no entry is unlocked by a rule alone)',()=>{
 const s=game();a.deepEqual(s.objects.creatures.seen,{});add(s,{kind:'soilmite',site:'litter',eaten:0});drained(s);tick(s);a.equal(s.objects.creatures.seen.soilmite,1);a.equal(s.objects.creatures.seen.rove,undefined);
 const m=F.migrate(JSON.parse(JSON.stringify(s)));a.deepEqual(m.objects.creatures.seen,s.objects.creatures.seen);F.valid(s);
});
