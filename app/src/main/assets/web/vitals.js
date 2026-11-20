(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestVitals=api;})(globalThis,function(){
'use strict';
// SRS v2.34 능력치: 수분(B) · 영양(nutrition) · 기운(energy), photosynthesis growth, the sun rock's stored sun.
// Saved fields stay the same names so old saves and every rule that reads them keep working:
//  - 수분 = B (0..100, two-sided: dry / fit / over-wet). Rain now lands on the body (engine), root water Q drains into it.
//  - 영양 = nutrition (0..100, two-sided: lacking / fit / too rich).
//  - 기운 = energy, kept as a percentage of the friend's own 피통 (max grows with level: 60 at Lv1 .. 100 at Lv10), so
//    every existing threshold still reads a share of the pool; point changes are scaled by 100/max, so a bigger friend
//    feels the same knock less. The old mood is folded in: any mood change since the last tick becomes 기운 and mood then
//    mirrors 기운. Leaf damage still heals as before, but every new point of damage is taken from 기운.
const dep=name=>typeof module==='object'?require('./'+name+'.js'):({traits:globalThis.ForestTraits,environment:globalThis.ForestEnvironment,shelter:globalThis.ForestShelter,world:globalThis.ForestWorld})[name];
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const T=()=>dep('traits');
function band(p){const L=T().level(p.xp),k=(L-1)*10/9;const lo=Math.round(35-k),hi=Math.round(65+k);return {L,lo,hi,warnLo:lo+5,warnHi:hi-5,mid:50,max:60+Math.round((L-1)*40/9)};}
function zone(v,b){return v<15?'dangerLow':v<b.lo?'low':v<=b.hi?'ok':v<=85?'high':'dangerHigh';}
const bad=z=>z==='low'||z==='high',danger=z=>z==='dangerLow'||z==='dangerHigh';
// 기운 in points (scaled to the friend's pool)
function energyPts(p,pts){p.energy=clamp(p.energy+pts*100/band(p).max);}
function shown(p){const m=band(p).max;return {now:Math.round(p.energy*m/100),max:m};}
const dayTime=s=>((s.worldTick%1200)+1200)%1200;
const isDay=s=>{const t=dayTime(s);return t<620||t>=1150;};
// SRS v2.34 ST34-09: deep night 750..1050 for everyone; dusk 620..750 only when 기운 is under half; the shade lovers
// (엘리시·코로나) wake at 1050, the others at 1100
function sleepTime(s,p){const t=dayTime(s);if(t>=750&&t<1050)return true;if(!p)return t>=620&&t<1150;if(t>=620&&t<750)return p.energy<50;if(t>=1050&&t<1150)return !['bonbon','jureong'].includes(p.species)&&t<1100;return false;}
// the sun rock stores sun on bright days (0..100) and a friend resting on it draws it
const SUN=Object.freeze({clear:2/60,cloud:.5/60,use:2/60});
function rockSun(s){const r=s.patches?.find(z=>z.id==='rock');return r&&Number.isFinite(r.sun)?r.sun:0;}   // read only (cards and the screen call it)
function sunStep(s,light){const r=s.patches?.find(z=>z.id==='rock');if(!r)return;if(!Number.isFinite(r.sun))r.sun=0;if(!isDay(s))return;const k=s.weather.kind;
 if(k==='sun'&&light(s,r)>=60)r.sun=Math.min(100,r.sun+SUN.clear);else if(k==='cloud')r.sun=Math.min(100,r.sun+SUN.cloud);}
// 1.0.1 물가 시원함 (user: "여름 구간에는 물가 가면 기온이 좀 더 낮아질 수 있다"): on a summer day, a friend at the open
// (unfrozen) lake's edge dries half as fast (engine body water use, like the leaf shade) and feels the sun one step softer
// (light −15 for photosynthesis), so a hot dry summer is easier by the water. Pure read; nothing is saved.
const COOL=Object.freeze({reach:1.2,light:15});
function coolAt(s,p){const W=dep('world'),E=dep('environment');return !!(W&&isDay(s)&&E?.season?.(s)==='summer'&&W.lakeOpen(s)&&!W.frozen(s)&&p.x>1.15&&W.waterD(p.x,p.y)<COOL.reach);}
// 1.0.1 새벽 이슬 (dew): on calm nights without rain or snow, dew gathers at dawn (day time 1000..1150, 150 seconds):
// the spring gains 20% of its capacity, the moss fills, and a friend sleeping in the open takes up to 4 수분 through its
// leaves (not past its warning line). Cloud gives half, wind 40+ none. It helps most in a dry season (마른 숲 겨울 건기).
// Dew is water from the air, so it is booked with the rain inflow (ledger.rain) and also counted in ledger.dew.
const DEW=Object.freeze({from:1000,to:1150,spring:.2,moss:1,leaf:4,wind:40});
function dewRate(s){const t=dayTime(s),k=s.weather.kind;if(t<DEW.from||t>=DEW.to||k==='rain'||k==='snow'||s.weather.wind>=DEW.wind)return 0;return k==='cloud'?.5:1;}
function dewStep(s,inside){const r=dewRate(s);if(!r)return;const len=DEW.to-DEW.from,L=s.ledger;let got=0;
 const sp=s.spring;if(sp&&sp.capacity>0){const n=Math.max(0,Math.min(sp.capacity*DEW.spring*r/len,sp.capacity-sp.water));sp.water+=n;got+=n;}
 const m=s.patches?.find(z=>z.id==='moss');if(m&&m.cap>0){const n=Math.max(0,Math.min(m.cap*DEW.moss*r/len,m.cap-m.S));m.S+=n;got+=n;}
 for(const p of s.individuals){if(!p.active||p.mounted||inside(p)||restingAt(p,'crevice'))continue;const n=Math.max(0,Math.min(DEW.leaf*r/len,band(p).warnHi-p.B));p.B+=n;got+=n;}
 L.rain+=got;L.dew=(L.dew||0)+got;}
const restingAt=(p,id)=>p.objectArrived&&p.objectTask?.object===id&&['rest','moss'].includes(p.objectTask.kind);
function migrate(p){if(p.vit===2)return false;const q=Math.max(0,p.Q||0),room=100-p.B,to=Math.min(q,room);p.B+=to;p.Q=q-to;
 p.energy=clamp(((p.energy??70)+(p.mood??p.energy??70))/2-(p.damage||0)*.5);p.mood=p.energy;p.moodSync=p.mood;p.damageSync=p.damage||0;p.vit=2;return true;}
// one tick for an active friend (engine calls it after the weather physiology)
function step(s,p,{light,inside,moving,held,ledger}){const b=band(p),tr=T().ofPet(p),E=dep('environment');migrate(p);
 // fold old mood changes and new leaf damage into 기운
 const dm=p.mood-(p.moodSync??p.mood),dd=(p.damage||0)-(p.damageSync??p.damage??0);if(dm)p.energy=clamp(p.energy+dm);if(dd>0)energyPts(p,-dd);
 const out={grade:'none',xp:0,water:0};
 if(!p.mounted&&!held){
  // outside the fit band costs 기운; both fit gives a little back
  const zb=zone(p.B,b),zn=zone(p.nutrition,b);
  if(zb==='ok'&&zn==='ok')energyPts(p,.3/60);
  for(const [z,w] of [[zb,tr.wet],[zn,tr.nutrWeak]])if(bad(z))energyPts(p,-1/60*w);else if(danger(z))energyPts(p,-2/60*w);
  // photosynthesis (ST34-08): uses water, gives 기운 and growth
  const onRock=restingAt(p,'rock')&&rockSun(s)>0,dark=inside||restingAt(p,'crevice');
  if(isDay(s)&&!dark&&p.B>15&&p.nutrition>15){const [a,c]=tr.light,L=onRock?(a+c)/2:coolAt(s,p)?light-COOL.light:light;
   const g=L>=a&&L<=c?'good':L<a?(L>=a-15?'near':'dark'):(L<=c+15?'near':'strong');
   const R={good:[.3,.6,1/210],near:[.2,.3,1/420],strong:[.6,.2,1/420],dark:[0,0,0]}[g];out.grade=g;
   if(R[0]){const w=Math.min(p.B,R[0]*tr.sun/60);p.B-=w;ledger.physiology+=w;out.water=w;}
   if(R[1])energyPts(p,R[1]/60);if(g==='strong'&&zb==='low'||g==='strong'&&zb==='dangerLow')energyPts(p,-1/60);
   if(R[2]){const fit=danger(zb)||danger(zn)?0:bad(zb)||bad(zn)?.5:1,en=p.energy>=70?1.2:p.energy<30?.5:1,season={spring:1.25,winter:.75}[E?.season?.(s)]??1;
    out.xp=R[2]*fit*en*season;if(p.xp<150){p.growthSeconds+=360*out.xp;while(p.growthSeconds>=360&&p.xp<150){p.growthSeconds-=360;p.xp=Math.min(150,p.xp+1);}if(p.xp>=150)p.growthSeconds=Math.min(p.growthSeconds,359);}}
   if(onRock){const r=s.patches.find(z=>z.id==='rock');r.sun=Math.max(0,r.sun-SUN.use);}}
  // over-wet friends dry out on the sun rock (while it holds sun or the sky is clear), in the shelter, or in the crevice
  if(p.B>b.hi){const rate=restingAt(p,'rock')&&(rockSun(s)>0||s.weather.kind==='sun')?2:inside?1.5:restingAt(p,'crevice')?1:0;if(rate){const w=Math.min(p.B-b.mid,rate/60);p.B-=w;ledger.evaporation+=w;}}
  // 영양 from compost: resting still beside rich compost for 5 minutes soaks it up by the roots (a cause of 과잉)
  const spots=[s.patches.find(z=>z.id==='litter'),...(s.objects?.litter?.piles||[])].filter(z=>z&&z.U>1&&Math.hypot(z.x-p.x,(z.y-p.y)*1.6)<.1);
  if(spots.length&&!moving){p.compostSeconds=(p.compostSeconds||0)+1;if(p.compostSeconds>300){const z=spots[0],n=Math.min(z.U,.5/60*tr.nutr,100-p.nutrition);z.U-=n;p.nutrition+=n;if(s.objects?.ledger)s.objects.ledger.absorbed+=n;}}else p.compostSeconds=0;}
 p.energy=clamp(p.energy);p.mood=p.energy;p.moodSync=p.mood;p.damageSync=p.damage||0;return out;}
// the drink / feed / rest targets the behaviour layer uses
function targets(p){const b=band(p);return {water:{start:b.warnLo,end:b.mid},nutrition:{start:b.warnLo,end:b.mid},energy:{start:40,end:80},band:b};}
function validate(s){for(const p of s.individuals){if(p.vit!==undefined&&p.vit!==2)throw Error('능력치 기록을 확인해 주세요.');for(const k of ['moodSync','damageSync','compostSeconds'])if(p[k]!==undefined&&!(Number.isFinite(p[k])&&p[k]>=0&&p[k]<=1e9))throw Error('능력치 기록을 확인해 주세요.');}
 const r=s.patches?.find(z=>z.id==='rock');if(r&&r.sun!==undefined&&!(Number.isFinite(r.sun)&&r.sun>=0&&r.sun<=100))throw Error('햇살 바위 기록을 확인해 주세요.');}
return Object.freeze({band,zone,energyPts,shown,sleepTime,isDay,coolAt,COOL,dewRate,dewStep,DEW,rockSun,sunStep,migrate,step,targets,validate,SUN});
});
