const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine.js'),Q=require('../../app/src/main/assets/web/stage2-fixtures.js'),S=F.Social;
const near=(x,y)=>a.ok(Math.abs(x-y)<1e-7,`${x} != ${y}`);
function transfer(source='rain'){const s=Q.make('EC02'),d=s.individuals[1],r=s.individuals[0];s.weather.kind='sun';s.weather.remaining=240;d.x=.53;d.y=.40;r.x=.60;r.y=.40;S.credit(d,20,source);return s;}
test('ellisii no longer collects rainfall or performs legacy water transfers',()=>{const s=Q.make('EC02'),d=s.individuals[1],r=s.individuals[0];a.equal(S.rain(s,s.patches[0],.2),.2);near(d.V,0);S.credit(d,20,'rain');const before={d:d.V,r:r.B};for(let i=0;i<24;i++)micro(s);near(d.V,before.d);near(r.B,before.r);a.equal(s.events.filter(e=>e.type==='transfer').length,0);a.equal(s.discoveries.EC02,undefined);});
test('ellisii shelter needs real healthy nearby damp habitat and stays inactive off roster',()=>{const s=F.create(),p=Q.pet(s,'ellisii-1','bonbon',.36,.47);s.individuals.push(p);a.equal(S.ellisiiHabitat(s,p),true);s.patches.find(x=>x.id==='moss').S=0;a.equal(S.ellisiiHabitat(s,p),false);s.patches.find(x=>x.id==='moss').S=2;p.active=false;a.equal(S.ellisiiHabitat(s,p),false);});
test('legacy Ellisii store stays conserved but cannot confer any new rain credit',()=>{const s=Q.make('EC02'),p=s.individuals[1];S.credit(p,12,'other');const before=F.totalWater(s),m=F.migrate(s);a.equal(m.individuals[1].V,12);a.equal(F.totalWater(m),before);a.equal(m.social.sessions.length,0);a.equal(S.rain(m,m.patches[0],2),2);});
function micro(s,visible=true){s.worldTick++;for(const p of s.individuals)p.motion={kind:'idle',distance:0};S.prepare(s);S.tick(s,{visible,event:F.event,record:(s,id,text,vis,detail)=>{if(vis&&!s.discoveries[id])s.discoveries[id]={text,tick:s.worldTick,...detail};}});}
test('Superbum rests 10 s and can offer water to another friend while the first pair rests 30 s',()=>{
 const s=transfer(),[first,donor]=s.individuals;
 donor.species='superbum';first.B=20;
 const other=Q.pet(s,'other','ridley',.65,.48,28);
 other.active=false;s.individuals.push(other);micro(s);
 const pair=s.social.sessions.find(a=>a.type==='A04');
 a.deepEqual(pair?.ids,[donor.id,first.id]);
 S.cancel(s,donor.id);
 const stopped=s.worldTick;
 a.equal(s.social.cooldowns[pair.key],stopped+30);
 a.equal(donor.socialUntil,stopped+10);a.equal(first.socialUntil,stopped+10);
 other.active=true;
 s.worldTick=stopped+9;S.prepare(s);a.equal(s.social.sessions.length,0);
 s.worldTick=stopped+10;S.prepare(s);a.deepEqual(s.social.sessions[0]?.ids,[donor.id,other.id]);
 S.cancel(s,donor.id);other.active=false;
 s.worldTick=stopped+29;S.prepare(s);a.equal(s.social.sessions.length,0);
 s.worldTick=stopped+30;S.prepare(s);a.deepEqual(s.social.sessions[0]?.ids,[donor.id,first.id]);
});
test('Elephan umbrella gives the same pair 30 s and both participants 10 s before other interactions',()=>{
 const s=F.create(0,2);s.started=true;s.worldTick=300;
 for(const z of s.patches)z.S=z.W=0;
 Object.assign(s.weather,{kind:'sun',wind:10});s.climate.L=75;
 const r=s.individuals[0],h=Q.pet(s,'elephan','neolbi',.62,.63);
 Object.assign(r,{x:.51,y:.65,B:60,energy:75,nutrition:60});s.individuals.push(h);
 S.prepare(s);
 const umbrella=s.social.sessions.find(a=>a.type==='CANOPY');
 a.deepEqual(umbrella?.ids,[h.id,r.id]);
 S.cancel(s,h.id);
 const stopped=s.worldTick;
 a.equal(s.social.cooldowns[umbrella.key],stopped+30);
 a.equal(h.socialUntil,stopped+10);a.equal(r.socialUntil,stopped+10);
 s.worldTick=stopped+29;S.prepare(s);a.equal(s.social.sessions.length,0);
 s.worldTick=stopped+30;S.prepare(s);a.equal(s.social.sessions[0]?.type,'CANOPY');
});
test('EC03 needs expanded union and a third actual resting participant for twenty visible seconds',()=>{const s=Q.make('EC03');for(let i=0;i<21;i++)micro(s);a.equal(s.discoveries.EC03,undefined);micro(s);a.ok(s.discoveries.EC03);a.ok(s.discoveries.EC03.area>s.discoveries.EC03.individualArea);a.equal(s.discoveries.EC03.restSeconds,20);const overlap=Q.make('EC03');Object.assign(overlap.individuals[2],{x:overlap.individuals[1].x,y:overlap.individuals[1].y});for(let i=0;i<25;i++)micro(overlap);a.equal(overlap.discoveries.EC03,undefined);const two=Q.make('EC03');two.individuals.shift();for(let i=0;i<25;i++)micro(two);a.equal(two.discoveries.EC03,undefined);});
test('hidden interval or layout change breaks EC03 observation rather than joining unrelated time',()=>{for(const changed of ['hidden','layout']){const s=Q.make('EC03');for(let i=0;i<12;i++)micro(s);if(changed==='hidden')micro(s,false);else F.layout(s,{});for(let i=0;i<10;i++)micro(s);a.equal(s.discoveries.EC03,undefined);}});
test('0.6.33 no five-friend cap in the garden (up to the 50-friend record limit); standby physiology remains unchanged',()=>{const s=Q.make('roster'),standby=s.individuals.at(-1),before=s.individuals.filter(x=>x.active).length;S.roster(s,standby.id,true);a.equal(s.individuals.filter(x=>x.active).length,before+1,'a sixth friend may join');F.valid(s);S.roster(s,s.individuals[1].id,false);const dormant=F.clone(s.individuals[1]);F.advance(s,60);for(const k of ['B','Q','V','energy','nutrition','xp','growthSeconds','personality'])a.deepEqual(s.individuals[1][k],dormant[k]);F.valid(s);});
test('legacy storage is unknown, malformed current source/session state is rejected',()=>{const old=F.create();old.rules='SRS-2.8-stage2';delete old.social;delete old.individuals[0].sources;old.individuals[0].V=12;const next=F.migrate(old);a.deepEqual(next.individuals[0].sources,{rain:0,other:0,unknown:12});for(const mutate of [s=>delete s.individuals[0].sources,s=>delete s.individuals[0].sources.rain,s=>s.individuals[0].sources.rain=1,s=>s.social.cooldowns=null,s=>s.social.serial=-1]){const s=F.create();mutate(s);a.throws(()=>F.migrate(s));}});
test('real rain simulation conserves water through collection, social behavior and pause/resume',()=>{const s=Q.make('EC02'),before=F.totalWater(s);for(let i=0;i<600;i++){F.step(s);F.valid(s);}near(F.totalWater(s),before+s.ledger.rain+s.ledger.snow+s.ledger.condensation+s.ledger.spring-s.ledger.outflow-s.ledger.evaporation-s.ledger.physiology);const social=F.clone(s.social);F.pause(s,1000);const tick=s.worldTick;F.resume(s,61000);a.equal(s.worldTick,tick);a.deepEqual(s.social.sessions,[]);F.valid(s);near(F.totalWater(s),before+s.ledger.rain+s.ledger.snow+s.ledger.condensation+s.ledger.spring-s.ledger.outflow-s.ledger.evaporation-s.ledger.physiology);});
test('EC01 requires actual rain in both patches, a resting visitor and twenty uninterrupted visible seconds',()=>{const s=Q.make('EC01');F.advance(s,168);a.equal(s.discoveries.EC01,undefined);F.advance(s,2);a.ok(s.discoveries.EC01);for(const kind of ['hidden','no-rain-source','no-visitor','changed-layout']){const q=Q.make('EC01');F.advance(q,155);if(kind==='hidden')F.step(q,{visible:false});if(kind==='no-rain-source')q.patches.find(p=>p.id==='rock').rainEpoch=0;if(kind==='no-visitor'){q.neighbor.stage='none';q.neighbor.cooldown=600;}if(kind==='changed-layout')F.layout(q,{});F.advance(q,14);a.equal(q.discoveries.EC01,undefined,kind);}});
