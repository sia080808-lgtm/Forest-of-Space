// 0.6.36 review: species traits (SRS v2.28) balance in the real engine. One friend of each species alone in a new
// game, 4 seeds x 3 climates x 2 game days. Averages of body water, mood, energy, leaf damage, wet burden, and how
// often spider mites / mealybugs were on its leaves. Output: docs/qa-0.6.36/traits-balance.json + table on stdout.
const F=require(require('path').resolve(__dirname,'../app/src/main/assets/web/engine')),C=F.Creatures,fs=require('fs'),path=require('path');
const SPECIES=['ridley','bonbon','neolbi','bosong','jureong','superbum'],CLIMATES=['C01','C02','C04'],SEEDS=[1,2,3,4],DAYS=2;
const out={};
for(const sp of SPECIES){const acc={B:0,mood:0,energy:0,damage:0,burden:0,mite:0,mealy:0,low:0,n:0};
 for(const climate of CLIMATES)for(const seed of SEEDS){const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;s.environment.climate=climate;const p=s.individuals[0];p.species=sp;
  for(let t=0;t<1200*DAYS;t++){F.step(s);const o=C.onLeaf(s,p.id);acc.B+=p.B;acc.mood+=p.mood;acc.energy+=p.energy;acc.damage+=p.damage;acc.burden+=p.burden;acc.mite+=o.mite?1:0;acc.mealy+=o.mealy?1:0;acc.low+=p.energy<40||p.mood<30?1:0;acc.n++;}}
 out[sp]=Object.fromEntries(Object.entries(acc).filter(([k])=>k!=='n').map(([k,v])=>[k,+(['mite','mealy','low'].includes(k)?v/acc.n:v/acc.n).toFixed(k==='mite'||k==='mealy'||k==='low'?3:1)]));}
fs.mkdirSync(path.resolve(__dirname,'../docs/qa-0.6.36'),{recursive:true});fs.writeFileSync(path.resolve(__dirname,'../docs/qa-0.6.36/traits-balance.json'),JSON.stringify(out,null,1));
console.log('species | B | mood | energy | damage | burden | mite share | mealy share | low share');for(const [k,v] of Object.entries(out))console.log(k,'|',v.B,'|',v.mood,'|',v.energy,'|',v.damage,'|',v.burden,'|',v.mite,'|',v.mealy,'|',v.low);
