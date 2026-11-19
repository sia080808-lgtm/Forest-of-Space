// 0.8.3: how much of the day and night 5 friends spend inside the shelter (4 seeds x 2 game hours). Usage: node tools/shelter-sleep-review.cjs
const F=require(process.cwd()+'/app/src/main/assets/web/engine'),Sh=F.Shelter;
const tally={inside:0,total:0,choice:{},energyChoice:{},nightInside:0,nightTotal:0,energyFail:{}};
for(const seed of [3,7,11,19]){const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;
 for(const [sp,x,y] of [['bonbon',.6,.55],['neolbi',.3,.78],['bosong',.7,.4],['jureong',.52,.42]])s.individuals.push({...F.clone(s.individuals[0]),id:'p-'+sp,species:sp,name:sp,x,y,active:true});
 const last={};
 for(let t=0;t<7200;t++){F.step(s);const tt=s.worldTick%1200,night=tt>=620&&tt<1150;
  for(const p of s.individuals){if(!p.active)continue;const ins=Sh.inside(s,p);tally.total++;if(ins)tally.inside++;if(night){tally.nightTotal++;if(ins)tally.nightInside++;}
   const o=p.objectTask;if(o&&o.serial!==last[p.id]){last[p.id]=o.serial;tally.choice[o.object]=(tally.choice[o.object]||0)+1;if(o.reason==='energy'){tally.energyChoice[o.object]=(tally.energyChoice[o.object]||0)+1;const sh=(p.objectDebug||[]).find(d=>d.object==='shelter');const k=sh?sh.reason+(sh.score!=null?'':''):'none';tally.energyFail[k]=(tally.energyFail[k]||0)+1;}}}}}
tally.insidePct=(tally.inside/tally.total*100).toFixed(1)+'%';tally.nightInsidePct=(tally.nightInside/tally.nightTotal*100).toFixed(1)+'%';
console.log(JSON.stringify(tally,null,1));
