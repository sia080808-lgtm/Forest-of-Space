const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine'),C=F.Creatures,O=F.Objects;
// controlled world: arrivals of new groups blocked (cooldowns in the future) unless a test adds groups itself
function game(seed=5){const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;const p=s.individuals[0];p.x=.8;p.y=.8;p.action='wander';C.init(s);const st=s.objects.creatures;st.lastArrival=1e9;st.lastPest=1e9;return s;}
const spot=s=>s.patches.find(z=>z.id==='litter');
function wetSpot(s,M,W=0){const z=spot(s);z.S=z.cap*M/100;z.W=W;z.O=Math.max(z.O,5);z.U=Math.max(z.U,5);return z;}
function tick(s,{T=60,kind='cloud',M,W}={}){s.climate.T=T;s.climate.H=60;s.weather.kind=kind;if(M!=null)wetSpot(s,M,W);s.worldTick++;C.step(s);}
const add=(s,g)=>{const st=s.objects.creatures;g={id:'cr:'+st.nextId++,since:s.worldTick,bad:0,lastWork:s.worldTick,carry:null,...g};st.groups.push(g);return g;};
const gnat=(s,o={})=>add(s,{kind:'gnat',site:'litter',adults:12,eggs:0,larvae:0,low:0,fit:0,...o});

test('AC-05/P01 root flies need wet decaying litter (moisture 70+, organic 4+, T 45~80) for 120 s before they are a candidate',()=>{
 const s=game();const z=wetSpot(s,60);for(let t=0;t<300;t++)tick(s,{M:60});a.equal(s.objects.creatures.gnatReady.litter||0,0);a.equal(C.gnatFit(s,z),false);
 for(let t=0;t<120;t++)tick(s,{M:90});a.ok(s.objects.creatures.gnatReady.litter>=120);z.O=0;z.U=1;a.equal(C.gnatFit(s,z),false,'needs organic matter');z.O=5;s.climate.T=40;a.equal(C.gnatFit(s,z),false);
});

test('ECO-11 adults lay eggs only after 120 s on a fitting site; eggs hatch to larvae, larvae become adults; density moves between stages and stays <= 100',()=>{
 const s=game();const g=gnat(s);for(let t=0;t<119;t++){tick(s,{M:90,W:12});}a.equal(g.eggs+g.larvae,0,'no eggs in the first 120 s');
 for(let t=0;t<200;t++)tick(s,{M:90,W:12});a.ok(g.eggs>0&&g.larvae>0,'eggs and larvae '+g.eggs+' '+g.larvae);
 for(let t=0;t<4000;t++)tick(s,{M:90,W:12});a.ok(g.eggs+g.larvae+g.adults<=100+1e-9);
 const before=g.eggs+g.larvae+g.adults;for(let t=0;t<60;t++)tick(s,{M:30});const after=g.eggs+g.larvae+g.adults;a.ok(before-after>=6-.5,'dry litter: about -6/min plus adult life, got '+(before-after));
});

test('AC-06/07 only larvae burden roots, and only for friends at the site; adults alone do no root harm; dry litter clears them with a 300 s pause',()=>{
 const s=game(),p=s.individuals[0],z=wetSpot(s,90);p.x=z.x;p.y=z.y+.02;p.burden=0;gnat(s,{adults:40});for(let t=0;t<60;t++)tick(s,{M:60});a.equal(p.burden,0,'adults only: no burden');
 const g=C.groups(s).find(g=>g.kind==='gnat');g.larvae=50;for(let t=0;t<60;t++)tick(s,{M:60});a.ok(p.burden>.7&&p.burden<=1+1e-9,'larvae 50 (some become adults): under 1/min, got '+p.burden);
 const q=s.individuals[0];q.x=.1;q.y=.9;const b=q.burden;for(let t=0;t<60;t++)tick(s,{M:60});a.equal(q.burden,b,'away from the site: no burden');
 g.adults=2;g.larvae=1;g.eggs=1;for(let t=0;t<61;t++)tick(s,{M:20});a.equal(C.groups(s).filter(g=>g.kind==='gnat').length,0);a.ok(s.objects.creatures.pause['site:litter']>=s.worldTick+299);
});

test('ECO-07/08/12 흙지기 needs real larvae (>=5) in drained moist soil for 120 s, comes by 300 s, eats <= 8/min, never eats spider mites, lives on leftover U and leaves without food',()=>{
 const s=game(),p=s.individuals[0];const g=gnat(s,{larvae:60,eggs:0,adults:0});for(let t=0;t<200;t++){tick(s,{M:90,W:12});g.larvae=60;}a.equal(C.inSoil(s,'litter').soilmite,null,'standing water: no soil mite');
 let at=null;for(let t=0;t<300&&!at;t++){tick(s,{M:60,W:0});g.larvae=60;g.adults=0;if(C.inSoil(s,'litter').soilmite)at=t+1;}a.ok(at>=120&&at<=300,'arrived after '+at);
 const sm=C.inSoil(s,'litter').soilmite,l0=g.larvae;for(let t=0;t<60;t++){tick(s,{M:60,W:0});g.adults=0;g.eggs=0;}a.ok(l0-g.larvae<=8+1e-6+l0/180*60,'ate '+(l0-g.larvae));
 s.objects.creatures.groups.push({id:'cr:m1',kind:'mite',host:p.id,density:50,low:0,since:0,bad:0,lastWork:0,carry:null});const md=50;
 g.larvae=0;g.eggs=0;g.adults=0;const z=spot(s);z.U=0.5;const base=O.storedLeaf(s)+s.objects.ledger.absorbed+(s.objects.ledger.soil||0);
 for(let t=0;t<30;t++)tick(s,{});a.ok(Math.abs(O.storedLeaf(s)+s.objects.ledger.absorbed+(s.objects.ledger.soil||0)-base)<1e-9,'U moves to the soil ledger only');a.ok(C.onLeaf(s,p.id).mite.density>=md-6,'spider mites untouched by 흙지기');
 z.U=0;for(let t=0;t<200;t++)tick(s,{});a.equal(C.groups(s).includes(sm),false,'left without food');
});

test('P03/ECO-15 솜깍지: honeydew density/100 x 8/min - 0.6/min (0.6.33: was x4 - 2, so it never built up below density 50; max 100); nutrition burden 2/min x density/100; tidying and the shelter reduce it',()=>{
 const s=game(),p=s.individuals[0];p.nutrition=80;const g=add(s,{kind:'mealy',host:p.id,density:80,honey:0,low:0});
 for(let t=0;t<60;t++)tick(s,{T:60,kind:'rain'});a.ok(Math.abs(g.honey-(8*.8-.6))<.05,'honey '+g.honey);a.ok(Math.abs(80-p.nutrition-1.6)<.05,'nutrition '+p.nutrition);a.equal(g.density,80,'steady in rain');
 p.action='groom';for(let t=0;t<60;t++)tick(s,{T:60,kind:'rain'});a.ok(Math.abs(g.density-76)<1e-6);p.action='wander';
 for(let t=0;t<60;t++)tick(s,{T:60,kind:'sun'});a.ok(Math.abs(g.density-80)<1e-6,'+4/min warm and dry');
 for(let t=0;t<60;t++)tick(s,{T:90,kind:'sun'});a.ok(Math.abs(g.density-74)<1e-6,'-6/min when too hot');
});

test('X04/AC-10 ants tend honeydew >= 10 for 30 s and stop carrying (0.6.33: was 20); 점박이 eats at half speed while tended; ants return after honeydew < 5 for 60 s',()=>{
 const s=game(),p=s.individuals[0];p.B=50;p.energy=70;const ant=add(s,{kind:'ant',nest:{x:.5,y:.6}});a.ok(C.antOk(s));const m=add(s,{kind:'mealy',host:p.id,density:60,honey:25,low:0});
 for(let t=0;t<29;t++){tick(s,{T:60,kind:'rain'});m.honey=25;}a.equal(ant.tend??null,null);tick(s,{T:60,kind:'rain'});a.equal(ant.tend,p.id);a.ok(C.tendedBy(s,p.id));
 const L=add(s,{kind:'lady',host:p.id,stage:'larva',eaten:0});m.density=60;for(let t=0;t<60;t++){tick(s,{T:60,kind:'rain'});m.honey=25;}a.ok(Math.abs(L.eaten-4)<.05,'tended: 4/min, ate '+L.eaten);
 for(let t=0;t<61;t++){tick(s,{T:60,kind:'rain'});m.honey=3;}a.equal(ant.tend,null,'back to carrying');const e=L.eaten;for(let t=0;t<60;t++){tick(s,{T:60,kind:'rain'});m.honey=3;}a.ok(Math.abs(L.eaten-e-8)<.05,'untended: 8/min');
});

test('점박이 comes only to egg sacs (density >= 20) on a reachable friend within 120~300 s, looks around 120 s as an adult, then the larva eats',()=>{
 const s=game(),p=s.individuals[0];const m=add(s,{kind:'mealy',host:p.id,density:15,honey:0,low:0});for(let t=0;t<400;t++){tick(s,{T:60,kind:'rain'});m.density=15;}a.equal(C.onLeaf(s,p.id).lady,null,'no egg sacs, no 점박이');
 let at=null;for(let t=0;t<301&&!at;t++){tick(s,{T:60,kind:'rain'});m.density=40;if(C.onLeaf(s,p.id).lady)at=t;}a.ok(at>=120&&at<=300,'arrived after '+at);
 const L=C.onLeaf(s,p.id).lady;a.equal(L.stage,'adult');for(let t=0;t<119;t++){tick(s,{T:60,kind:'rain'});m.density=40;}a.equal(L.eaten,0,'adult only looks');for(let t=0;t<61;t++)tick(s,{T:60,kind:'rain'});a.equal(L.stage,'larva');a.ok(L.eaten>0);
});

test('ECO-05 one friend\'s pest harm is capped at 2/min in total; at most two pest types are active; saves validate and reload',()=>{
 const s=game(),p=s.individuals[0],z=wetSpot(s,90);p.x=z.x;p.y=z.y+.02;p.damage=0;p.burden=0;p.nutrition=90;
 add(s,{kind:'mite',host:p.id,density:100,low:0});add(s,{kind:'mealy',host:p.id,density:100,honey:0,low:0});
 for(let t=0;t<60;t++)tick(s,{T:60,kind:'rain',M:90});const total=p.damage+p.burden+(90-p.nutrition);a.ok(total<=2+1e-6,'total pest harm per minute '+total);
 a.equal(C.pestKinds(s).size,2);const t2=JSON.parse(JSON.stringify(s));t2.objects.creatures.groups.push({id:'cr:x',kind:'gnat',site:'litter',adults:12,eggs:0,larvae:0,low:0,fit:0,since:0,bad:0});a.throws(()=>F.valid(t2));
 s.objects.creatures.lastPest=-1e9;s.objects.creatures.gnatReady.litter=300;s.worldTick=1800-1;for(let t=0;t<1;t++)tick(s,{T:60,kind:'rain',M:90});a.equal(C.groups(s).filter(g=>g.kind==='gnat').length,0,'no third pest type');
 F.valid(s);const m=F.migrate(JSON.parse(JSON.stringify(s)));a.deepEqual(m.objects.creatures,s.objects.creatures);
 for(const bad of [x=>{x.objects.creatures.groups.find(g=>g.kind==='mealy').honey=140;},x=>{x.objects.creatures.groups.push({id:'cr:y',kind:'lady',host:p.id,stage:'pupa',since:0,bad:0});}]){const t=JSON.parse(JSON.stringify(s));bad(t);a.throws(()=>F.valid(t));}
});
