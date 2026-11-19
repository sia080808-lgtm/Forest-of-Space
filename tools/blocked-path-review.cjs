// 0.8.3: friends dropped anywhere on the walkable ground every 240 s; share of time stuck with "길을 찾고 있어요" (blocked_path). Usage: node tools/blocked-path-review.cjs
const F=require(process.cwd()+'/app/src/main/assets/web/engine');
let total=0,blocked=0,streak=0,maxLen=0;const ex=[];
for(const seed of [3,7,11,19]){const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;
 for(const [sp,x,y] of [['bonbon',.6,.55],['neolbi',.3,.78],['bosong',.7,.4],['jureong',.52,.42],['superbum',.45,.62]])s.individuals.push({...F.clone(s.individuals[0]),id:'p-'+sp,species:sp,name:sp,x,y,active:true});
 let r=seed*7919;const rnd=()=>((r=(r*16807)%2147483647)/2147483647);const run={};
 for(let t=0;t<7200;t++){
  if(t%240===0)for(const p of s.individuals){if(rnd()<.5){p.x=-.15+rnd()*1.3;p.y=-.08+rnd()*1.22;p.motion&&(p.motion.distance=0);p.objectTask=null;}}  // drops anywhere (like carrying)
  F.step(s);
  for(const p of s.individuals){if(!p.active)continue;total++;const b=!p.objectTask&&p.objectWait?.reason==='blocked_path';if(b){blocked++;run[p.id]=run[p.id]||{t:s.worldTick,x:p.x,y:p.y,sp:p.species,dbg:JSON.stringify(p.objectDebug||[]).slice(0,240)};}else if(run[p.id]){const L=s.worldTick-run[p.id].t;maxLen=Math.max(maxLen,L);if(L>=15){streak++;if(ex.length<6)ex.push({L,...run[p.id]});}delete run[p.id];}}}}
console.log('blocked%',(blocked/total*100).toFixed(2),'streaks>=15',streak,'max',maxLen);for(const e of ex)console.log(JSON.stringify(e));
