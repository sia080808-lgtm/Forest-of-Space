// SRS v2.28 ST-07b: species traits with six friends together (one of each species), 3 seeds x 3 game days per climate.
// Usage: node tools/traits-group-review.cjs <now|off> <days> <climate,...>  ('off' zeroes the cold/rain weather mood to compare).
const R=require('path').resolve(__dirname,'../app/src/main/assets/web')+'/';const F=require(R+'engine.js'),T=require(R+'traits.js'),C=F.Creatures;
const variant=process.argv[2]||'now',DAYS=+(process.argv[3]||3),CL=(process.argv[4]||'C01,C02,C04').split(','),SEEDS=[1,2,3];
if(variant==='off')for(const k in T.TABLE){T.TABLE[k].cold=0;T.TABLE[k].rain=0;}
const SP=['ridley','bonbon','neolbi','bosong','jureong','superbum'],POS=[[.3,.55],[.45,.62],[.55,.5],[.65,.66],[.38,.72],[.6,.4]];
const acc={};for(const sp of SP)acc[sp]={B:0,mood:0,energy:0,damage:0,burden:0,mite:0,mealy:0,low:0,moodMin:100,n:0};
let weather={};
for(const cl of CL)for(const seed of SEEDS){const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;s.environment.climate=cl;
 const base=s.individuals[0];base.species='ridley';base.x=POS[0][0];base.y=POS[0][1];
 SP.slice(1).forEach((sp,i)=>s.individuals.push({...F.clone(base),id:'f'+i,species:sp,name:sp,x:POS[i+1][0],y:POS[i+1][1],active:true,sources:{rain:0,other:0,unknown:0}}));
 for(let t=0;t<1200*DAYS;t++){F.step(s);const k=s.weather.kind+(s.climate.T<35?'-cold':'');weather[k]=(weather[k]||0)+1;
  for(const p of s.individuals){const a=acc[p.species];if(!a)continue;const o=C.onLeaf(s,p.id);a.B+=p.B;a.mood+=p.mood;a.energy+=p.energy;a.damage+=p.damage;a.burden+=p.burden;a.mite+=o.mite?1:0;a.mealy+=o.mealy?1:0;a.low+=(p.energy<40||p.mood<30)?1:0;a.moodMin=Math.min(a.moodMin,p.mood);a.n++;}}}
const out={variant,days:DAYS,climates:CL,seeds:SEEDS,species:{}};
for(const sp of SP){const a=acc[sp];out.species[sp]={B:+(a.B/a.n).toFixed(1),mood:+(a.mood/a.n).toFixed(1),moodMin:+a.moodMin.toFixed(1),energy:+(a.energy/a.n).toFixed(1),damage:+(a.damage/a.n).toFixed(1),burden:+(a.burden/a.n).toFixed(1),mite:+(a.mite/a.n).toFixed(3),mealy:+(a.mealy/a.n).toFixed(3),low:+(a.low/a.n).toFixed(3)};}
const tot=Object.values(weather).reduce((x,y)=>x+y,0);out.weather=Object.fromEntries(Object.entries(weather).map(([k,v])=>[k,+(v/tot).toFixed(3)]));
console.log(JSON.stringify(out));
