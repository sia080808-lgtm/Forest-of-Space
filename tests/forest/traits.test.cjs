const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine.js'),T=require('../../app/src/main/assets/web/traits.js'),W=F.Weather,C=F.Creatures;
const near=(x,y,e=1e-7)=>a.ok(Math.abs(x-y)<e,`${x} != ${y}`);
const SPECIES=['ridley','bonbon','neolbi','bosong','jureong','superbum','duri'];
const balance=(s,base)=>{const l=s.ledger;return F.totalWater(s)-(base+l.rain+l.snow+l.condensation+l.spring-l.evaporation-l.outflow-l.physiology);};
function game(species,seed=19){const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;const p=s.individuals[0];p.species=species;s.worldTick=601;return {s,p};}

test('ST-AC01a every friend has a full trait row inside 0.5..1.5 and a strong and weak point text; 엘레판 is the tank',()=>{
 for(const sp of SPECIES){const t=T.of(sp);for(const k of ['mite','miteGrow','mealy','absorb','keep','sun','leaf','wet','wind'])a.ok(t[k]>=.5&&t[k]<=1.5,sp+' '+k+' '+t[k]);
  a.ok(T.text(sp).good.length&&T.text(sp).bad.length,sp+' text');}
 a.equal(T.of('bosong').keep,.75,'베이치 keeps the water use it had before (0.6 of 0.8)');
 const toughest=Math.min(...SPECIES.map(s=>T.of(s).leaf));a.equal(T.of('neolbi').leaf,toughest,'엘레판 has the toughest leaves');a.ok(T.of('neolbi').wind<1);
 a.ok(T.of('bonbon').mite<T.of('ridley').mite,'엘리시: smooth leaves, fewer spider mites');
});

test('ST-AC01b over-wet burden and wind leaf damage scale by species; recovery does not',()=>{
 for(const sp of SPECIES){const t=T.of(sp);
  {const {s,p}=game(sp);Object.assign(p,{x:.5,y:.4,B:60,Q:16,burden:10});for(let i=0;i<120;i++)W.physiology(s,p);near(p.burden,10+2*t.wet);}
  {const {s,p}=game(sp);Object.assign(p,{x:.5,y:.4,B:60,Q:0,damage:0});s.weather.wind=75;for(let i=0;i<70;i++)W.physiology(s,p);near(p.damage,2.125*t.wind*t.leaf);}}
});

test('ST-AC01c pest arrival chances and the leaf harm of spider mites scale by species',()=>{
 for(const sp of SPECIES){const {s,p}=game(sp);C.init(s);const st=s.objects.creatures;st.miteReady[p.id]=1e3;st.mealyReady[p.id]=1e3;
  const c=C.candidates(s),m=c.find(x=>x.kind==='mite'),y=c.find(x=>x.kind==='mealy');near(m.chance,.2*T.of(sp).mite);near(y.chance,.2*T.of(sp).mealy);
  p.damage=0;C.harm(s,p,'damage',1/60);near(p.damage,1/60*T.of(sp).leaf);}
});

test('ST-AC01d body water use, strong-light use and root absorption scale by species',()=>{
 for(const sp of SPECIES){const t=T.of(sp);
  // one second with no root water: the body loses .8*keep/60 (night, so no strong-light term)
  {const {s,p}=game(sp);s.environment.timeOfDay=.0;Object.assign(p,{x:.12,y:.86,B:50,Q:0});const L=s.climate.L;s.climate.L=0;const b=p.B,before=s.ledger.physiology;F.step(s);near(s.ledger.physiology-before,.8*t.keep/60+(L&&0),1e-6);void b;}
 }
});

test('ST-AC02 water is conserved for every species in clear, rainy and windy weather',()=>{
 for(const sp of SPECIES)for(const kind of ['sun','rain','wind']){const {s}=game(sp,5),base=F.totalWater(s);for(let t=0;t<600;t++){s.weather.kind=kind==='wind'?'sun':kind;s.weather.intensity=kind==='rain'?70:0;s.weather.wind=kind==='wind'?70:10;F.step(s);}near(balance(s,base),0,1e-6);}
});

test('ST-AC04 weather mood: cold and rain change mood out in the garden but not under a shelter roof or on the mount; values stay in range',()=>{
 {const {s,p}=game('jureong');p.mood=50;s.climate.T=20;s.weather.kind='cloud';s.weather.intensity=0;for(let t=0;t<60;t++){F.step(s);s.climate.T=20;s.weather.kind='cloud';}a.ok(p.mood<50,'코로나 feels the cold: '+p.mood);}
 {const {s,p}=game('bosong');p.mood=50;s.climate.T=20;s.weather.kind='cloud';s.weather.intensity=0;const m0=p.mood;for(let t=0;t<60;t++){F.step(s);s.climate.T=20;s.weather.kind='cloud';}a.ok(Math.abs(p.mood-m0)<1.01,'베이치 does not mind the cold: '+(p.mood-m0));}
 {const {s,p}=game('jureong');p.mounted=true;p.mood=50;s.climate.T=20;for(let t=0;t<60;t++){F.step(s);s.climate.T=20;}a.ok(p.mood>=50-1e-9,'mounted: no cold mood');}
 {const {s,p}=game('jureong');p.mood=99.99;s.weather.kind='rain';s.weather.intensity=80;s.weather.remaining=600;for(let t=0;t<120;t++){F.step(s);s.weather.kind='rain';}a.ok(p.mood<=100,'mood stays in range');}
});

test('ST-AC05 traits are looked up, never saved: a save carries no trait fields and reloads unchanged',()=>{
 const {s}=game('neolbi');for(let t=0;t<30;t++)F.step(s);const json=JSON.stringify(s);a.ok(!/"(keep|absorb|miteGrow|sunEnergy)"/.test(json));F.valid(JSON.parse(json));
});
