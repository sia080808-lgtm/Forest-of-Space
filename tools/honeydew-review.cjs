// 0.6.33 review: honeydew and ant tending over 8 seeds x 3 game days in three climates (real engine).
const F=require(require('path').resolve(__dirname,'../app/src/main/assets/web/engine')),C=F.Creatures;
const out=[];for(const climate of ['C01','C02','C04'])for(let seed=1;seed<=8;seed++){const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;s.environment.climate=climate;
 let honey=0,tend=0,mealy=0,dens=0;for(let t=0;t<1200*3;t++){F.step(s);for(const g of C.groups(s)){if(g.kind==='mealy'){mealy=1;honey=Math.max(honey,g.honey||0);dens=Math.max(dens,g.density);}if(g.kind==='ant'&&g.tend)tend++;}}
 out.push(climate+' s'+seed+' mealy '+mealy+' maxDens '+dens.toFixed(0)+' maxHoney '+honey.toFixed(1)+' tendSec '+tend);}
console.log(out.join('\n'));
