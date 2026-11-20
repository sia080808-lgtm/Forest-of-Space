// 0.8.0 사계절 (SRS v2.31): calendar, climate x season weather, leaves per day, growth, small neighbours in winter,
// old saves, seasonal pictures (render only).
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const F=require('../../app/src/main/assets/web/engine'),E=F.Environment,C=F.Creatures,O=F.Objects,L=F.Litter;
const game=(seed=6)=>{const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;return s;};

test('SE-03 a new game starts on spring day 1; every 3,600 s spring → summer → autumn → winter → spring; climate change keeps the calendar',()=>{
 const s=game();a.deepEqual([E.calendar(s).id,E.calendar(s).day,E.calendar(s).year],['spring',1,1]);
 const seen=[];for(let t=0;t<14400+10;t++){F.step(s);const c=E.calendar(s);if(!seen.length||seen.at(-1)!==c.id)seen.push(c.id);}
 a.deepEqual(seen,['spring','summer','autumn','winter','spring']);a.equal(E.calendar(s).year,2);
 s.worldTick=3600+1200*2+5;a.equal(E.calendar(s).day,3);
 const texts=s.events.filter(e=>e.type==='season').map(e=>e.season);a.ok(texts.includes('spring'),'season change logged');
 const k=game();k.individuals[0].first.drink=true;for(let t=0;t<4000;t++)F.step(k);const before=E.calendar(k).id;E.changeClimate(k,'C04');for(let t=0;t<40;t++)F.step(k);a.equal(k.environment.climate,'C04');a.equal(E.calendar(k).id,before);a.equal(k.environment.calendar.start,0);F.valid(k);
});

test('SE-03 an older save starts its calendar at spring when first loaded; nothing else changes',()=>{
 const s=game();for(let t=0;t<5000;t++)F.step(s);const old=JSON.parse(JSON.stringify(s));delete old.environment.calendar;
 const back=F.migrate(old);a.equal(back.environment.calendar.start,old.worldTick);a.equal(E.calendar(back).id,'spring');
 a.deepEqual(back.individuals.map(p=>[p.id,p.x,p.y,p.xp,p.B]),old.individuals.map(p=>[p.id,p.x,p.y,p.xp,p.B]));F.valid(back);
});

test('SE-04 climate x season: temperature offsets, rain/fog weights and snow follow the table; the first 120 s blend',()=>{
 const s=game();s.environment.calendar={start:0};const at=(id,t)=>{s.environment.climate=id;s.worldTick=t;};
 at('C01',3600+600);a.equal(E.seasonFx(s).T,8);a.equal(E.seasonFx(s).rain,1.6);
 at('C02',10800+600);a.equal(E.seasonFx(s).T,-28);a.ok(E.weights(s)[4]>0);
 at('C03',600);a.equal(E.seasonFx(s).fog,1.3);a.equal(E.weights(s)[4],0);
 at('C04',10800+600);a.equal(E.seasonFx(s).T,-15);a.equal(E.weights(s)[4],0,'dry cold, no snow');
 at('C01',10800+60);const mid=E.seasonFx(s).T;a.ok(mid<-5&&mid>-22,'blending autumn -> winter '+mid);
 // temperature actually follows: a winter day in the cool forest gets cold
 const k=game();k.environment.climate='C03';k.worldTick=10800;k.environment.calendar={start:0};for(let t=0;t<600;t++)F.step(k);a.ok(k.climate.T<25,'winter T '+k.climate.T);
});

test('SE-05 leaves per day follow the season (x0.6 / x0.8 / x2 / x0.3) under the 90-leaf floor cap, and leaves are conserved',()=>{
 const s=game();const quotas={};const base=O.storedLeaf(s);
 for(let t=0;t<14400;t++){F.step(s);if(s.worldTick%1200===5)quotas[E.calendar(s).id]=s.objects.dayQuota;a.ok(L.floor(s)<=L.LCAP+1e-9);if(t%1200===0)F.valid(s);}
 a.deepEqual(quotas,{spring:27,summer:36,autumn:90,winter:14});
 a.ok(Math.abs(O.storedLeaf(s)+s.objects.ledger.absorbed+(s.objects.ledger.soil||0)-s.objects.ledger.leafInput-base)<1e-6);
});

test('SE-07 friends grow x1.25 in spring and x0.75 in winter',()=>{
 const grow=t=>{const s=game();const p=s.individuals[0];s.environment.calendar={start:0};s.worldTick=t;const g0=p.growthSeconds,x0=p.xp;for(let i=0;i<100;i++){s.worldTick++;F.step(s);}return (p.xp-x0)*360+p.growthSeconds-g0;};
 const sp=grow(100),su=grow(3700),wi=grow(10900);a.ok(sp>0&&su>0&&wi>0);a.ok(Math.abs(sp/su-1.25)<.05,'spring '+sp/su);a.ok(Math.abs(wi/su-.75)<.05,'winter '+wi/su);
});

test('SE-06 winter: ants sleep (no work, no leaving, no new colony), no pest or enemy newly arrives, springtails on snow from T 20 at 45%',()=>{
 const s=game();s.environment.calendar={start:0};s.worldTick=10800+300;s.weather.kind='sun';s.weather.wind=10;
 a.equal(C.winter(s),true);a.equal(C.antActive(s),false);
 const r=s.individuals.find(p=>p.species==='ridley');r.active=false;
 const g={id:'cr:w1',kind:'ant',since:0,bad:0,lastWork:-1e4,carry:null,nest:{x:r.x,y:r.y+.04},host:r.id,away:0,hungry:0};s.objects.creatures.groups.push(g);
 for(let t=0;t<1500;t++){s.worldTick++;C.step(s);}a.ok(C.groups(s).includes(g),'asleep, not gone');a.equal(g.away,0);a.equal(g.carry,null);
 // no pest candidates in winter even when ready
 const p=r;p.active=true;s.objects.creatures.miteReady[p.id]=600;s.objects.creatures.mealyReady[p.id]=600;s.worldTick=10800+600;a.equal(C.candidates(s).filter(c=>['mite','mealy','gnat'].includes(c.kind)).length,0);
 s.worldTick=3600+600;a.ok(C.candidates(s).some(c=>c.kind==='mite'),'summer allows them');
 // springtail on snow
 s.worldTick=10800+600;const pile={id:'pile:90',sector:5,x:.42,y:.5,O:6,U:0,S:55,cap:100,W:0,playBoostUntil:0,born:s.worldTick-100};s.objects.litter.piles.push(pile);s.climate.T=25;
 a.equal(C.springOk(s,pile),true);s.objects.creatures.pileReady['pile:90']=200;a.equal(C.candidates(s).find(c=>c.kind==='springtail').chance,.45);
 s.worldTick=3600+600;a.equal(C.springOk(s,pile),false,'T 25 is too cold outside winter');
});

test('SE-06 spring wake-up: the helpers\' 600 s spacing is skipped once on the first tick of spring',()=>{
 const s=game();s.environment.calendar={start:0};s.worldTick=14400-1;s.objects.creatures.lastArrival=14000;s.worldTick++;C.step(s);a.ok(s.objects.creatures.lastArrival<0);
});

test('SE-08 seasonal pictures exist for the frame, the six fern clumps and the leaf-shade plant; the season tint is render only',()=>{
 const dir=path.join(__dirname,'../../app/src/main/assets/web/assets/forest/seasons');
 for(const n of ['frame','shade-plant','terrain','shelter-art','shade-ground',...[1,2,3,4,5,6].map(i=>'fern-'+i)])for(const se of ['spring','autumn','winter'])a.ok(fs.statSync(path.join(dir,n+'-'+se+'.png')).size>1000,n+'-'+se);
 const s=game();for(const t of [600,4200,7800,11400]){s.worldTick=t;const before=JSON.stringify(s),g=E.lighting(s);a.equal(JSON.stringify(s),before);a.equal(g.tints.length,2,'0.8.1: no seasonal colour over the world (the paper background stays)');a.ok(g.saturation>=.65&&g.saturation<=1.05);}
 const html=fs.readFileSync(path.join(__dirname,'../../app/src/main/assets/web/index.html'),'utf8');a.match(html,/id="season"/);
});
test('SE-0.8.4 the dry-forest rescue follows the season: snow in winter, none in the dry forest winter',()=>{
 const win=(clim)=>{const s=game();s.environment.climate=clim;s.worldTick=3*E.SEASON_LEN+600;s.weather.kind='cloud';s.weather.remaining=240;s.environment.dryActiveSeconds=5000;return s;};
 const s=win('C01');F.step(s);a.equal(s.environment.rainRescuePending,true);s.weather.remaining=1;F.step(s);a.equal(s.weather.kind,'snow','C01 winter rescues with snow, not rain');a.equal(s.weather.intensity,60);
 const d=win('C04');F.step(d);a.equal(d.environment.rainRescuePending,false,'the dry forest winter has no precipitation, so no rescue');d.environment.rainRescuePending=true;d.weather.remaining=1;F.step(d);a.notEqual(d.weather.kind,'rain');a.notEqual(d.weather.kind,'snow');a.equal(d.environment.rainRescuePending,false);
 const w=win('C01');w.environment.rainRescuePending=false;w.weather.kind='snow';w.weather.intensity=60;w.weather.transition=0;w.environment.precipFrom=null;w.environment.effectiveRainSeconds=119;w.environment.dryActiveSeconds=10;F.step(w);a.equal(w.environment.dryActiveSeconds,0,'snow counts as water for the rescue timer');
});
