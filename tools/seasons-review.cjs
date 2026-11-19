// 0.8.0 사계절 측정: one game year (14,400 s = 12 game days) per climate (C01~C04) x 3 seeds, a ridley and an 엘레판
// (welcomed at start). Per season: mean temperature, snow time, leaves fallen, small-neighbour arrivals, mean mood and
// energy, share of time with body water < 30, growth. Optional 2nd argument: another web folder (e.g. 0.7.1) to compare;
// that code has no seasons, so its numbers are grouped by the same 3,600 s blocks.
// Usage: node tools/seasons-review.cjs [out.json] [webDir]
const fs=require('node:fs'),path=require('node:path');
const web=process.argv[3]||path.resolve(__dirname,'../app/src/main/assets/web');const F=require(web+'/engine');
const out=process.argv[2]||path.resolve(__dirname,'../docs/qa-0.8.0/seasons.json');
const S=['spring','summer','autumn','winter'],res={};
for(const climate of ['C01','C02','C03','C04']){const rows=[];
 for(const seed of [1,2,3]){const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;s.environment.climate=climate;F.welcomeNeolbi(s);s.individuals.forEach(p=>{p.active=true;});
  const q=S.map(()=>({T:0,snow:0,fell:0,arrive:0,mood:0,energy:0,low:0,xp:0,n:0}));let fell0=s.objects.litter.fallen||0,arr0=s.objects.creatures?.log?.arrived||0,xp0=s.individuals.reduce((a,p)=>a+p.xp+p.growthSeconds/360,0);
  for(let t=0;t<14400;t++){F.step(s);const b=q[Math.floor(t/3600)];b.T+=s.climate.T;b.snow+=s.weather.kind==='snow';b.n++;const ps=s.individuals.filter(p=>p.active);b.mood+=ps.reduce((a,p)=>a+p.mood,0)/ps.length;b.energy+=ps.reduce((a,p)=>a+p.energy,0)/ps.length;b.low+=ps.some(p=>p.B<30);
   if((t+1)%3600===0){const fell=s.objects.litter.fallen||0,arr=s.objects.creatures?.log?.arrived||0,xp=s.individuals.reduce((a,p)=>a+p.xp+p.growthSeconds/360,0);b.fell=fell-fell0;b.arrive=arr-arr0;b.xp=+(xp-xp0).toFixed(2);fell0=fell;arr0=arr;xp0=xp;}}
  F.valid(s);rows.push(q.map((b,i)=>({season:S[i],T:+(b.T/b.n).toFixed(1),snowShare:+(b.snow/b.n).toFixed(2),fell:b.fell,arrivals:b.arrive,mood:+(b.mood/b.n).toFixed(1),energy:+(b.energy/b.n).toFixed(1),lowWaterShare:+(b.low/b.n).toFixed(3),growth:b.xp})));}
 // mean over seeds per season
 res[climate]=S.map((se,i)=>{const r=rows.map(x=>x[i]),m=k=>+(r.reduce((a,x)=>a+x[k],0)/r.length).toFixed(k==='lowWaterShare'?3:1);return {season:se,T:m('T'),snowShare:m('snowShare'),fell:m('fell'),arrivals:m('arrivals'),mood:m('mood'),energy:m('energy'),lowWaterShare:m('lowWaterShare'),growth:m('growth')};});
 console.log(climate,JSON.stringify(res[climate].map(r=>[r.season,r.T,r.snowShare,r.fell,r.arrivals,r.mood,r.energy,r.lowWaterShare,r.growth])));}
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({version:F.VERSION,climates:res},null,1));
