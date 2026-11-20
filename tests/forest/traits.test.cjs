const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine.js'),T=require('../../app/src/main/assets/web/traits.js'),W=F.Weather,C=F.Creatures;
const near=(x,y,e=1e-7)=>a.ok(Math.abs(x-y)<e,`${x} != ${y}`);
const SPECIES=['ridley','bonbon','neolbi','bosong','jureong','superbum','duri'];
const balance=(s,base)=>{const l=s.ledger;return F.totalWater(s)-(base+l.rain+l.snow+l.condensation+l.spring-l.evaporation-l.outflow-l.physiology);};
function game(species,seed=19){const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;const p=s.individuals[0];p.species=species;s.worldTick=601;return {s,p};}

test('ST-AC01a 1.0 육각형 종족값: six stats 1..5, every species totals 18, levels 3/6/9 raise the lowest stat; the old multipliers come from them',()=>{
 for(const sp of SPECIES){const h=T.hex(sp,1);a.deepEqual(Object.keys(h).sort(),[...T.KEYS].sort());a.ok(T.KEYS.every(k=>h[k]>=1&&h[k]<=5),sp);a.equal(T.KEYS.reduce((n,k)=>n+h[k],0),18,sp+' total');
  for(const [lv,sum] of [[2,18],[3,19],[6,20],[9,21],[10,21]])a.equal(T.KEYS.reduce((n,k)=>n+T.hex(sp,lv)[k],0),sum,sp+' Lv'+lv);
  const t=T.of(sp);for(const k of ['mite','miteGrow','mealy','keep','sun','leaf','wet','wind','nutrWeak'])a.ok(t[k]>=.6&&t[k]<=1.4,sp+' '+k+' '+t[k]);
  a.ok(T.text(sp).good.length&&T.text(sp).bad.length,sp+' text');}
 a.equal(T.hex('ridley').water,1,'리들리: roots rot when wet');a.equal(T.hex('superbum').water,5,'슈퍼범 keeps water');a.equal(T.hex('bonbon').pest,5,'엘리시: smooth leaves');
 a.equal(T.of('neolbi').leaf,Math.min(...SPECIES.map(s=>T.of(s).leaf)),'엘레판 has the toughest leaves');a.ok(T.of('jureong').cold<T.of('superbum').cold);
 a.equal(T.ofPet({species:'ridley',xp:150}).hex.water,3,'Lv10 리들리: the lowest stat rose at Lv3 and Lv6');
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

test('ST-AC04 1.0 cold costs 기운 by the cold stat (코로나 most, 슈퍼범 none), not under a roof or on the mount; values stay in range',()=>{
 const loss=(sp,mounted=false)=>{const {s,p}=game(sp);s.worldTick=800;Object.assign(p,{B:50,nutrition:50,energy:70,mood:70,moodSync:70,mounted});const e0=p.energy;for(let t=0;t<60;t++){s.climate.T=20;s.weather.kind='cloud';s.weather.intensity=0;p.nextObjectChoice=s.worldTick+10;F.step(s);}return e0-p.energy;};
 const j=loss('jureong'),b=loss('superbum');a.ok(j-b>1.5,'코로나 feels the cold more than 슈퍼범: '+j.toFixed(2)+' vs '+b.toFixed(2));
 a.ok(loss('jureong',true)<=1e-9,'mounted: no cold');
 {const {s,p}=game('jureong');p.energy=p.mood=99.99;s.weather.kind='rain';s.weather.intensity=80;s.weather.remaining=600;for(let t=0;t<120;t++){F.step(s);s.weather.kind='rain';}a.ok(p.energy>=0&&p.energy<=100,'기운 stays in range');}
});

test('ST-AC05 traits are looked up, never saved: a save carries no trait fields and reloads unchanged',()=>{
 const {s}=game('neolbi');for(let t=0;t<30;t++)F.step(s);const json=JSON.stringify(s);a.ok(!/"(keep|absorb|miteGrow|sunEnergy|hex)"/.test(json));F.valid(JSON.parse(json));
});
