// 1.0.0 balance check (SRS v2.34 ST34-11): a garden of six friends, how long 수분·영양 stay fit, 기운 by species, water drift.
// Usage: node tools/stats-balance.cjs [climate C01..C04] [seed] [hours]
const F=require(require('path').resolve(__dirname,'../app/src/main/assets/web/engine')),V=require(require('path').resolve(__dirname,'../app/src/main/assets/web/vitals'));
const [clim,seed,hours]=[process.argv[2]||'C01',+process.argv[3]||1,+process.argv[4]||3];
const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;s.environment.climate=clim;
for(const [sp,x,y] of [['bonbon',.6,.55],['neolbi',.3,.78],['bosong',.7,.4],['jureong',.52,.42],['superbum',.25,.6]])s.individuals.push({...F.clone(s.individuals[0]),id:'p-'+sp,species:sp,x,y,active:true,B:50,nutrition:50,xp:8});
const T=()=>F.totalWater(s)-s.ledger.rain+s.ledger.evaporation+s.ledger.outflow+s.ledger.physiology-(s.ledger.lake||0)-(s.ledger.snow||0)-(s.ledger.condensation||0)-(s.ledger.spring||0);const t0=T();
const z={},sp={};let n=0;for(let t=0;t<3600*hours;t++){F.step(s);if(t%20===0)for(const p of s.individuals.filter(p=>p.active)){const b=V.band(p);for(const [k,v] of [['B',p.B],['N',p.nutrition]]){const q=V.zone(v,b);z[k+q]=(z[k+q]||0)+1;}const e=(sp[p.species]??={e:0,n:0,lowE:0});e.e+=p.energy;e.n++;if(p.energy<30)e.lowE++;n++;}}
F.valid(s);const pct=k=>((z[k]||0)/n*100).toFixed(1);
console.log(clim,seed,'water fit',pct('Bok'),'danger',(+pct('BdangerLow')+ +pct('BdangerHigh')).toFixed(1),'low',pct('Blow'),'high',pct('Bhigh'),'| N fit',pct('Nok'),'danger',(+pct('NdangerLow')+ +pct('NdangerHigh')).toFixed(1),'low',pct('Nlow'),'high',pct('Nhigh'),'| E',Object.entries(sp).map(([k,v])=>k[0]+(v.e/v.n).toFixed(0)+(v.lowE?'('+(v.lowE/v.n*100).toFixed(0)+'%<30)':'')).join(' '),'| xp',s.individuals.map(p=>p.xp).join(','),'| drift',(T()-t0).toFixed(3));
