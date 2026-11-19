const {test}=require('node:test'),a=require('node:assert/strict'),path=require('node:path'),F=require('../../app/src/main/assets/web/engine'),S=F.Social,R=F.Recruitment,Sh=F.Shelter;
const web=path.resolve(__dirname,'../../app/src/main/assets/web'),SB=require(web+'/superbum.js'),Rig=require(web+'/rig.js');
const near=(x,y,e=1e-6)=>a.ok(Math.abs(x-y)<e,`${x} != ${y}`);
const balance=(s,base)=>{const l=s.ledger;return F.totalWater(s)-(base+l.rain+l.snow+l.condensation+l.spring-l.evaporation-l.outflow-l.physiology);};
function game(seed=7,adult=true){const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;
 const p={...F.clone(s.individuals[0]),id:'sb',species:'superbum',name:'슈퍼범',xp:adult?115:0,visualStage:adult?3:0,x:.6,y:.7,active:true,sources:{rain:0,other:0,unknown:0},V:0};s.individuals.push(p);F.valid(s);return {s,p};}
const rain=(s,on)=>{s.weather.kind=on?'rain':'sun';s.weather.intensity=on?80:0;s.weather.transition=0;s.weather.remaining=600;delete s.environment.storm;s.weather.wind=10;};

test('슈퍼범 is a full species: listed, 1.7x, bigger than 엘레판, the same shelter share as 엘레판 (0.6.38), layered art with dry and wet sets, no arms',()=>{
 a.ok(F.SPECIES.some(x=>x[0]==='superbum'&&x[1]==='슈퍼범'));a.ok(S.supported.includes('superbum'));a.ok(R.ids.includes('superbum'));
 a.equal(SB.SIZE,1.7);a.ok(SB.SIZE>require(web+'/neolbi.js').SIZE);
 const {p}=game();a.equal(Sh.units(p),8);p.visualStage=0;p.xp=0;a.equal(Sh.units(p),4);
 for(const st of ['dry','wet'])for(const k of SB.LAYERS){a.ok(Rig.files['superbum_'+st+'_'+k],st+' '+k);a.ok(require('node:fs').existsSync(path.join(web,Rig.files['superbum_'+st+'_'+k])));}
 a.deepEqual(SB.LAYERS,['body','foot-left','foot-right','skirt-left','skirt-right','crown'],'face lowest, then feet, side leaves, head frond on top');
 a.ok(require('node:fs').existsSync(path.join(web,'assets/forest/species/superbum-portrait.png')));
});

test('the nest frond collects real rain into V: ledger-balanced, at most .1/s and 40, never while held, mounted or sheltered',()=>{
 const {s,p}=game(),base=F.totalWater(s);rain(s,true);let max=0;for(let t=0;t<300;t++){const v=p.V;F.step(s);max=Math.max(max,p.V-v);rain(s,true);}
 a.ok(p.V>5,'collected '+p.V);a.ok(max<=.1+1e-9);a.ok(p.sources.rain>0);near(balance(s,base),0,1e-6);
 for(let t=0;t<900;t++){F.step(s);rain(s,true);}a.ok(p.V<=S.NEST+1e-9);near(balance(s,base),0,1e-6);
 const g=game();rain(g.s,true);g.p.mounted=true;for(let t=0;t<60;t++){F.step(g.s);rain(g.s,true);}a.equal(g.p.V,0);
 const h=game();rain(h.s,false);for(let t=0;t<120;t++){F.step(h.s);rain(h.s,false);}a.equal(h.p.V,0,'no rain, no water');
 const e=game();e.p.species='bonbon';e.p.name='엘리시';rain(e.s,true);for(let t=0;t<120;t++){F.step(e.s);rain(e.s,true);}a.equal(e.p.V,0,'Ellisii no longer collects');
});

test('물 나눔 (A04): a 슈퍼범 with more than 10 brings water to a thirsty friend; nothing is created and EC02 is recorded',()=>{
 for(const seed of [7,3]){const {s,p}=game(seed),base=F.totalWater(s);let given=0,prev=p.V,peak=0;
  for(let t=0;t<3600*12;t++){F.step(s);if(p.V<prev-1e-9)given+=prev-p.V;prev=p.V;peak=Math.max(peak,p.V);if(t%1800===0)F.valid(s);}
  a.ok(peak>10);a.ok(given>0,'seed '+seed+' gave '+given);near(balance(s,base),0,1e-6);}
 // 0.6.38: a grown 슈퍼범 now also rests in the shelter, so a 12-hour run meets a thirsty friend outside less often by chance;
 // the sharing itself is checked directly: rain water in the nest, a thirsty friend nearby, both out in the garden
 for(const seed of [7,3,11]){const {s,p}=game(seed);s.worldTick=601;Object.assign(p,{V:30,sources:{rain:30,other:0,unknown:0},energy:80,mood:80,B:60,nutrition:70});
  const r=s.individuals[0];Object.assign(r,{x:.5,y:.7,B:20,energy:80,mood:70});const base=F.totalWater(s),v0=p.V,b0=r.B;
  for(let t=0;t<600&&!s.discoveries.EC02;t++){s.weather.kind='sun';F.step(s);}
  a.ok(s.discoveries.EC02,'seed '+seed+' EC02');a.ok(p.V<v0&&r.B>b0);near(balance(s,base),0,1e-6);}
});

test('when no rest spot fits it, a tired 슈퍼범 folds its nest frond and rests where it stands, back to 75',()=>{
 // 0.6.38: a grown 슈퍼범 now fits the shelter, so 'no rest spot' is made explicit here by holding off its object choice
 const {s,p}=game();Object.assign(p,{energy:30});const none=()=>{p.nextObjectChoice=s.worldTick+10;};for(let t=0;t<300&&!p.restSelf;t++){s.weather.wind=10;none();F.step(s);}a.equal(p.restSelf,true);a.equal(p.motion.kind,'rest');
 const x=p.x,y=p.y,e=p.energy;for(let t=0;t<60;t++){s.weather.wind=10;none();F.step(s);}a.equal(p.x,x);a.equal(p.y,y);a.ok(p.energy>e);
 // (kept watered and fed so only tiredness matters; a real need such as thirst ends the rest early)
 for(let t=0;t<3600&&p.restSelf;t++){s.weather.wind=10;none();p.B=65;p.nutrition=70;p.mood=80;F.step(s);}a.ok(!p.restSelf);a.ok(p.energy>=75-1e-9||s.weather.wind>=60,'rests until 75 unless a strong wind sends it to cover');
 const g=game();let low=0;for(let t=0;t<3600*6;t++){F.step(g.s);if(g.p.energy<35)low++;}a.equal(low,0,'never stuck tired');
});

test('shelter (0.6.38): young and grown 슈퍼범 both fit the base shelter, the grown one in its folded pose',()=>{
 for(const [lv,adult,fits] of [[1,false,true],[1,true,true],[2,true,true],[3,true,true]]){const {s,p}=game(7,adult),f=s.shelters.facilities[0];f.level=lv;Sh.prepare(s,null,F.Space);a.equal(!!Sh.seat(s,f,p),fits,lv+' '+adult);}
});

test('recruitment: comes when the spring holds 30% water and is reachable; checks the spring, looks at the sky, rests 20 s',()=>{
 const s=F.create(1000,218);s.started=true;R.init(s);const c=R.conditions(s,'superbum',F.Space,F.Social);a.equal(c.ok,true);a.equal(c.checks.length,2);
 s.spring.water=s.spring.capacity*.2;a.equal(R.conditions(s,'superbum',F.Space,F.Social).ok,false);s.spring.water=s.spring.capacity*.5;
 s.recruitment.target='superbum';Object.assign(s.recruitment.progress.superbum,{valid:179,failures:3});
 for(const p of s.recruitment.progress.bonbon?[s]:[])void p;s.recruitment.serial=1;
 R.tick(s,{Space:F.Space,Social:F.Social,rng:()=>0,event:F.event,personality:F.personality});a.equal(s.recruitment.visitor?.species,'superbum');
 R.open(s);const v=s.recruitment.visitor;for(let i=0;i<600&&!v.ready;i++)R.encounterStep(s);const pr=s.recruitment.progress.superbum;
 a.equal(v.ready,true);a.ok(pr.actions.spring&&pr.actions.sky&&pr.rest>=20);a.deepEqual(R.steps(s).list.map(x=>x.done),[true,true,true,true]);
 const p=R.settle(s,F.event);a.equal(p.species,'superbum');a.equal(p.name,'슈퍼범');a.equal(p.V,0);F.valid(s);
});

test('rendering is pure and the water state is visible: dry set when the nest is empty, wet set when it holds water',async()=>{
 const {createCanvas,loadImage}=require('@napi-rs/canvas'),A={};for(const [k,v] of Object.entries(SB.files))A[k]=await loadImage(path.join(web,v));
 const used=water=>{const seen=new Set(),c=createCanvas(600,600).getContext('2d'),orig=c.drawImage.bind(c);c.drawImage=(im,...r)=>{for(const [k,v] of Object.entries(A))if(v===im)seen.add(k);return orig(im,...r);};c.translate(300,500);SB.drawLocal(c,A,{kind:'walk',phase:1.2,water});return seen;};
 const dry=used(0),wet=used(1);a.ok(dry.has('superbum_dry_crown')&&!dry.has('superbum_wet_crown'));a.ok(wet.has('superbum_wet_crown')&&!wet.has('superbum_dry_crown'));
 a.equal(SB.wetness({water:0}),0);a.equal(SB.wetness({water:.5}),1);
 for(const kind of ['idle','walk','run','held','rest','groom','drink','splash','collect','share']){const p=SB.pose(kind,2.3,{water:1});a.ok(Number.isFinite(p.bob)&&Number.isFinite(p.crown));}
 const {s}=game(),before=JSON.stringify(s),c=createCanvas(600,600).getContext('2d');Rig.draw(c,A,{species:'superbum',kind:'walk',phase:3,water:.5});a.equal(JSON.stringify(s),before);
});

test('0.6.35 the nest water dries in clear weather (the spring rate, booked as evaporation) and a thirsty 슈퍼범 drinks its own nest water; water is conserved',()=>{
 // evaporation: sunny, not thirsty
 {const {s,p}=game(),base=F.totalWater(s);p.V=30;p.sources={rain:30,other:0,unknown:0};for(const q of s.individuals)q.B=60;const base2=F.totalWater(s);rain(s,false);s.climate.L=80;
  for(let t=0;t<600;t++){F.step(s);rain(s,false);s.climate.L=80;}
  a.ok(p.V<26&&p.V>18,'10 minutes of sun: '+p.V.toFixed(2));near(balance(s,base2),0,1e-6);void base;
  // no drying in rain (rain adds instead), under fog either
  const v=p.V;s.weather.kind='fog';s.weather.intensity=0;for(let t=0;t<60;t++){F.step(s);s.weather.kind='fog';}a.ok(p.V>=v-1e-9,'fog: no drying');}
 // own use: body water below 45 is topped up from the nest, up to 55, at most 3/min
 {const {s,p}=game();p.V=20;p.sources={rain:20,other:0,unknown:0};rain(s,false);p.B=30;for(const q of s.individuals)if(q!==p)q.B=60;const base=F.totalWater(s);const v0=p.V;F.step(s);
  a.ok(v0-p.V>=S.NEST_SIP-1e-9,'drinks from the nest when thirsty');for(let t=0;t<600;t++){F.step(s);rain(s,false);}a.ok(p.B>=50,'body water topped up: '+p.B.toFixed(1));near(balance(s,base),0,1e-6);}
});

test('0.6.38 shelter: a grown 슈퍼범 takes 엘레판\'s points and fits the base shelter in its folded pose, baked from the real render',()=>{
 const {s,p}=game(),f=s.shelters.facilities[0];f.level=1;Sh.prepare(s,null,F.Space);
 const n={...p,species:'neolbi'};a.equal(Sh.units(p),Sh.units(n));
 const q=Sh.seat(s,f,p);a.ok(q,'grown 슈퍼범 seats in the base shelter');a.ok(Sh.fits(f,p,q));
 // the shelter outline is the folded pose: narrower and lower than the standing 슈퍼범, still wider than 엘레판
 const src=require('fs').readFileSync(web+'/shelter.js','utf8'),prof=k=>JSON.parse(src.match(new RegExp('"'+k+'":(\\[\\[.*?\\]\\])'))[1]),w=a=>Math.max(...a.map(v=>v[0]))-Math.min(...a.map(v=>v[0])),h=a=>-Math.min(...a.map(v=>v[1]));
 const stand=prof('superbum'),fold=prof('superbumHuddle');a.ok(w(fold)<w(stand)&&h(fold)<h(stand));
 // huddle only changes the drawing pose, never the state
 const pose=SB.pose('rest',0,{huddle:1}),plain=SB.pose('rest',0,{});a.ok(pose.crownScale<plain.crownScale);a.ok(pose.skirt[0]<plain.skirt[0]&&pose.skirt[1]>plain.skirt[1]);
});
