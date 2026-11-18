const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine'),C=F.Creatures;
// controlled leaf: friend far from water/moss, weather and climate fixed each second, creatures stepped alone
function game(seed=5){const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;const p=s.individuals[0];p.x=.8;p.y=.8;p.B=50;p.action='wander';C.init(s);return s;}
function tick(s,{T,H,kind='cloud'}){s.climate.T=T;s.climate.H=H;s.weather.kind=kind;s.worldTick++;C.step(s);}
const mite=(s,host)=>C.onLeaf(s,host).mite,keeper=(s,host)=>C.onLeaf(s,host).keeper;
const addMite=(s,host,density)=>s.objects.creatures.groups.push({id:'cr:'+s.objects.creatures.nextId++,kind:'mite',host,density,low:0,since:s.worldTick,bad:0,lastWork:s.worldTick,carry:null});

test('leaf micro-climate: a hot sun rock and thirst dry the leaves; rain, water and the shelter keep them moist',()=>{
 const s=game(),p=s.individuals[0];s.climate.T=65;s.climate.H=70;s.weather.kind='sun';
 const top=F.Space.rockTop(s);p.x=top.x;p.y=top.y;p.B=30;a.ok(F.Space.onRock(s,p));
 let l=C.leaf(s,p);a.ok(l.T>=65&&l.H<=35,'sun rock + thirst in the default climate: '+JSON.stringify(l));a.equal(C.miteFit(s,p),true);
 s.weather.kind='rain';a.equal(C.miteFit(s,p),false);s.weather.kind='sun';p.B=60;a.ok(C.leaf(s,p).H>l.H);
 p.x=s.spring.x;p.y=s.spring.y+.05;a.ok(C.leaf(s,p).H>=70-10+10-1e-9);
});

test('AC-05/ECO-02 spider mites never appear by themselves on moist leaves (no arrival without a real dry leaf)',()=>{
 const s=game();for(let t=0;t<3600;t++)tick(s,{T:60,H:75,kind:t%400<200?'rain':'cloud'});a.equal(C.groups(s).filter(g=>g.kind==='mite').length,0);F.valid(s);
});

test('P02 arrives only after 120 s of dry leaves, at the common 180 s checks after the 600 s protection, with density 12',()=>{
 const s=game(2),p=s.individuals[0];let at=null;for(let t=0;t<6000&&!at;t++){tick(s,{T:70,H:25,kind:'sun'});if(mite(s,p.id))at=s.worldTick;}
 a.ok(at>=600&&at%180===0,'arrived at '+at);a.ok(Math.abs(mite(s,p.id).density-12)<1e-9);F.valid(s);
});

test('ECO-05/14 density +4/min on dry hot leaves, -6/min on moist leaves, -4/min while tidying or in the shelter; leaf burden 2/min x density/100',()=>{
 const s=game(),p=s.individuals[0];addMite(s,p.id,50);const d0=p.damage;
 for(let t=0;t<60;t++)tick(s,{T:70,H:20,kind:'sun'});a.ok(Math.abs(mite(s,p.id).density-54)<1e-6);a.ok(Math.abs(p.damage-d0-(2*0.5+2*0.54)/2)<.02,'burden '+(p.damage-d0));
 for(let t=0;t<60;t++)tick(s,{T:55,H:75});a.ok(Math.abs(mite(s,p.id).density-48)<1e-6);
 for(let t=0;t<60;t++)tick(s,{T:55,H:50});a.ok(Math.abs(mite(s,p.id).density-48)<1e-6,'steady on mildly dry leaves');
 p.action='groom';for(let t=0;t<60;t++)tick(s,{T:55,H:50});a.ok(Math.abs(mite(s,p.id).density-44)<1e-6);
 for(let t=0;t<3000;t++)tick(s,{T:70,H:20,kind:'sun'});a.ok(mite(s,p.id).density<=100);a.ok(p.damage<=100);
});

test('ECO-14 under 5 for 60 s counts as recovered: the group is removed and that friend gets 300 s before a new arrival',()=>{
 const s=game(),p=s.individuals[0];addMite(s,p.id,4.9);for(let t=0;t<59;t++)tick(s,{T:55,H:75});a.ok(mite(s,p.id));tick(s,{T:55,H:75});a.equal(mite(s,p.id),null);
 a.equal(s.objects.creatures.log.cleared,1);a.ok(s.objects.creatures.pause[p.id]>=s.worldTick+299);
});

test('ECO-07/08/12 잎지기 needs real prey (>=8) and leaf humidity 45~80 for 120 s, comes by 300 s, eats at most 8/min and never below zero',()=>{
 const s=game(3),p=s.individuals[0];for(let t=0;t<400;t++)tick(s,{T:55,H:25,kind:'sun'});a.equal(keeper(s,p.id),null,'no predator without prey');
 addMite(s,p.id,60);for(let t=0;t<400;t++){tick(s,{T:70,H:20,kind:'sun'});mite(s,p.id).density=60;}a.equal(keeper(s,p.id),null,'too dry for 잎지기');
 let at=null;for(let t=0;t<300&&!at;t++){tick(s,{T:55,H:50});if(keeper(s,p.id))at=t+1;}a.ok(at>=120&&at<=300,'arrived after '+at);
 const kg=keeper(s,p.id),before=mite(s,p.id).density;for(let t=0;t<60;t++)tick(s,{T:55,H:50});const eaten=before-mite(s,p.id).density;a.ok(eaten<=8+1e-6&&eaten>=8-1e-6,'ate '+eaten);
 for(let t=0;t<600;t++)tick(s,{T:55,H:50});a.ok(!mite(s,p.id)||mite(s,p.id).density>=0);a.ok(kg.eaten<=60+1e-6,'잎지기 ate only the prey that was there');
});

test('AC-11 잎지기 with no prey left eats nothing more and leaves after 120 s',()=>{
 const s=game(),p=s.individuals[0];s.objects.creatures.groups.push({id:'cr:77',kind:'keeper',host:p.id,since:0,bad:0,eaten:0,lastWork:0,carry:null});
 for(let t=0;t<119;t++)tick(s,{T:55,H:60});a.ok(keeper(s,p.id));a.equal(s.objects.creatures.log.eaten,0);tick(s,{T:55,H:60});a.equal(keeper(s,p.id),null);
});

test('ECO-06 a friend resting in the album keeps its mites frozen; a removed friend takes its leaf neighbours along; saves validate and reload',()=>{
 const s=game(),p=s.individuals[0];addMite(s,p.id,40);p.active=false;for(let t=0;t<120;t++)tick(s,{T:70,H:20,kind:'sun'});a.equal(mite(s,p.id).density,40);p.active=true;
 const m=F.migrate(JSON.parse(JSON.stringify(s)));a.deepEqual(m.objects.creatures,s.objects.creatures);F.valid(s);
 for(const bad of [x=>{x.objects.creatures.groups[0].density=140;},x=>{x.objects.creatures.groups.push({...x.objects.creatures.groups[0],id:'cr:99'});},x=>{delete x.objects.creatures.groups[0].host;}]){const t=JSON.parse(JSON.stringify(s));bad(t);a.throws(()=>F.valid(t));}
 s.objects.creatures.groups[0].host='gone';tick(s,{T:55,H:50});a.equal(C.groups(s).filter(g=>g.kind==='mite').length,0);
});
