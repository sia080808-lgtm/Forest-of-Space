// 0.7.1 짐꾼개미 군락 (SRS v2.30): one colony per healthy 리들리, nests 0.5 apart, range 0.3, 3 per forest region, counted
// apart from the 8-group limit; they rest in the nest at night and in rain, snow and strong wind; they leave after a game
// day without their ridley or without food in range, and nothing settles near that nest for another day.
const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine'),C=F.Creatures,L=F.Litter,O=F.Objects;
const game=(seed=6)=>{const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;s.weather.kind='sun';s.weather.wind=10;s.climate.T=60;return s;};
const ridley=s=>{const r=s.individuals.find(p=>p.species==='ridley');r.B=Math.max(r.B,80);r.energy=Math.max(r.energy,80);return r;};
function addRidley(s,x,y,id){const r=JSON.parse(JSON.stringify(ridley(s)));r.id=id;r.name=id;r.x=x;r.y=y;r.B=80;r.energy=80;r.active=true;s.individuals.push(r);return r;}
function leavesAround(s,q,n=4){for(let i=0;i<n;i++)s.objects.litter.leaves.push({id:9000+s.objects.litter.leaves.length,sector:L.sectorOf(q),x:q.x+.03*(i-1.5),y:q.y+.04,rot:0});}
const colony=(s,host,x,y)=>{const g={id:'cr:'+s.objects.creatures.nextId++,kind:'ant',since:s.worldTick,bad:0,lastWork:s.worldTick,carry:null,nest:{x,y},host,away:0,hungry:0};s.objects.creatures.groups.push(g);return g;};

test('ants work only by day in dry, calm weather; at night, in rain, snow or strong wind they rest in the nest',()=>{
 const s=game();s.worldTick=100;a.equal(C.antActive(s),true);
 s.worldTick=700;a.equal(C.antActive(s),false,'night');s.worldTick=1300;a.equal(C.antActive(s),true);
 for(const k of ['rain','snow']){s.weather.kind=k;a.equal(C.antActive(s),false,k);}s.weather.kind='sun';
 s.weather.wind=60;a.equal(C.antActive(s),false,'wind');s.weather.wind=10;
 // a resting colony picks up no leaf
 const r=ridley(s);r.x=.3;r.y=.5;s.objects.litter.leaves=[];s.objects.litter.piles=[];leavesAround(s,r,2);leavesAround(s,{x:r.x+.2,y:r.y},3);const g=colony(s,r.id,r.x,r.y+.05);g.lastWork=-1e4;s.worldTick=700;C.step(s);a.equal(g.carry,null);
 s.worldTick=1300;C.step(s);a.ok(g.carry,'carries by day');F.valid(s);
});

test('a colony settles only near a healthy ridley on a warm dry day with 3 loose leaves around, one per ridley, nests 0.5 apart',()=>{
 const s=game();s.objects.litter.leaves=[];const r=ridley(s);r.x=.3;r.y=.5;r.B=80;r.energy=80;
 a.equal(C.antSites(s).length,0,'no leaves');leavesAround(s,r,3);a.deepEqual(C.antSites(s).map(p=>p.id),[r.id]);
 s.climate.T=30;a.equal(C.antOk(s),false,'cold');s.climate.T=60;r.B=20;a.equal(C.antSites(s).length,0,'unhappy ridley');r.B=80;
 const g=colony(s,r.id,r.x,r.y+.05);a.equal(C.antSites(s).length,0,'one per ridley');
 const near=addRidley(s,.6,.5,'r-near');leavesAround(s,near,4);a.equal(C.antSites(s).length,0,'0.3 from the nest: shares it');
 const far=addRidley(s,.9,.5,'r-far');leavesAround(s,far,4);a.deepEqual(C.antSites(s).map(p=>p.id),['r-far']);
 const q=C.nestSpot(s,far);a.ok(q&&Math.hypot(q.x-g.nest.x,q.y-g.nest.y)>=C.ANT.SPACING&&Math.hypot(q.x-far.x,q.y-far.y)<=.15);
});

test('at most 3 colonies in the forest, counted apart from the 8-group limit of the other small neighbours',()=>{
 const s=game();const spots=[[-.1,.0],[.6,.0],[1.1,.4],[.2,.8]];spots.forEach(([x,y],i)=>{const r=addRidley(s,x,y,'r'+i);leavesAround(s,r,4);});
 s.individuals=s.individuals.filter(p=>p.id.startsWith('r')&&p.id.length===2);
 for(let i=0;i<3;i++){const r=s.individuals[i];colony(s,r.id,r.x,r.y+.04);}a.equal(C.antSites(s).length,0,'forest full');
 // 8 other groups (mites and mealybugs on 4 friends each) still leave room for the colonies
 for(let i=0;i<4;i++){const p=addRidley(s,.1+i*.05,1.0,'f'+i);for(const kind of ['mite','mealy'])s.objects.creatures.groups.push({id:'cr:'+kind+i,kind,host:p.id,density:10,low:0,honey:0,since:0,bad:0,lastWork:0,carry:null});}
 C.validate(s);// 3 colonies + 8 other groups is a valid save
 s.objects.creatures.groups.push({id:'cr:a4',kind:'ant',since:0,bad:0,lastWork:0,carry:null,nest:{x:.2,y:.85},host:'r3',away:0,hungry:0});a.throws(()=>C.validate(s));
});

test('real engine with 3 ridleys: colonies settle, never more than 3, nests always 0.5 apart, every leaf conserved',()=>{
 const s=game(4);const base=O.storedLeaf(s);addRidley(s,-.05,.1,'r-west');addRidley(s,1.05,.9,'r-east');
 for(let t=0;t<1200*6;t++){F.step(s);s.climate.T=Math.max(s.climate.T,45);const cs=C.colonies(s);a.ok(cs.length<=3);
  for(let i=0;i<cs.length;i++)for(let j=i+1;j<cs.length;j++)a.ok(Math.hypot(cs[i].nest.x-cs[j].nest.x,cs[i].nest.y-cs[j].nest.y)>=C.ANT.SPACING-1e-9);
  if(t%600===0)F.valid(s);}
 a.ok(s.objects.creatures.log.arrived>=1&&C.colonies(s).length>=1,'colonies '+C.colonies(s).length);
 a.ok(Math.abs(O.storedLeaf(s)+s.objects.ledger.absorbed+(s.objects.ledger.soil||0)-s.objects.ledger.leafInput-base)<1e-6);
});

test('a colony leaves after a game day without its ridley, or without food in range; nothing settles there for a day',()=>{
 const s=game();const r=ridley(s);r.x=.3;r.y=.5;s.objects.litter.leaves=[];leavesAround(s,r,4);const g=colony(s,r.id,r.x,r.y+.04);
 r.active=false;for(let t=0;t<C.ANT.ABSENT-1;t++){s.worldTick++;C.step(s);}a.ok(C.groups(s).includes(g));
 s.worldTick++;C.step(s);a.ok(!C.groups(s).includes(g));r.active=true;
 const pause=s.objects.creatures.antPause;a.equal(pause.length,1);a.equal(C.antSites(s).length,0,'not near the old nest for a day');
 s.worldTick=pause[0].until;C.step(s);a.equal(C.antSites(s).length,1);
 // hunger: no loose leaves in range and nothing to tend
 const g2=colony(s,r.id,r.x,r.y+.04);s.objects.litter.leaves=[];g2.hungry=C.ANT.HUNGRY-2;s.worldTick++;C.step(s);a.ok(C.groups(s).includes(g2));
 s.worldTick++;C.step(s);a.ok(!C.groups(s).includes(g2));
 // food in range resets hunger
 const g3=colony(s,r.id,r.x,r.y+.04);g3.hungry=500;leavesAround(s,r,2);s.worldTick++;C.step(s);a.equal(g3.hungry,0);
});

test('honeydew is tended by the nearest colony; an old single ant group is kept and linked to the nearest ridley',()=>{
 const s=game();const r=ridley(s);r.x=.3;r.y=.5;const far=addRidley(s,1.1,.5,'r-far');
 const g1=colony(s,r.id,.3,.55),g2=colony(s,far.id,1.1,.55);
 s.objects.creatures.groups.push({id:'cr:m1',kind:'mealy',host:far.id,density:60,honey:50,low:0,since:0,bad:0,lastWork:0,carry:null});
 for(let t=0;t<40;t++){s.worldTick++;C.step(s);}a.equal(g2.tend,far.id);a.equal(g1.tend??null,null);a.equal(C.tendedBy(s,far.id),true);
 // migration
 const old=F.create(0,6);old.started=true;const rr=ridley(old);rr.x=.7;rr.y=.6;old.objects.creatures.groups.push({id:'cr:o1',kind:'ant',since:0,bad:0,lastWork:0,carry:null,nest:{x:.72,y:.62}});
 const back=F.migrate(JSON.parse(JSON.stringify(old)));const og=C.colonies(back)[0];a.equal(og.id,'cr:o1');a.equal(og.host,rr.id);a.equal(og.away,0);a.equal(og.hungry,0);F.valid(back);
});
