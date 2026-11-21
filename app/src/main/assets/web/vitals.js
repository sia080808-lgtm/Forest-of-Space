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
// 1.0.1 (user: "맑은 날은 분당 5, 흐린 날은 분당 2"): the rock fills faster so it still holds some sun in a cloudy winter
const SUN=Object.freeze({clear:5/60,cloud:2/60,use:2/60});
function rockSun(s){const r=s.patches?.find(z=>z.id==='rock');return r&&Number.isFinite(r.sun)?r.sun:0;}   // read only (cards and the screen call it)
function sunStep(s,light){const r=s.patches?.find(z=>z.id==='rock');if(!r)return;if(!Number.isFinite(r.sun))r.sun=0;if(!isDay(s))return;const k=s.weather.kind;
 if(k==='sun'&&light(s,r)>=60)r.sun=Math.min(100,r.sun+SUN.clear);else if(k==='cloud')r.sun=Math.min(100,r.sun+SUN.cloud);}
// 1.0.1 물가 시원함 (user: "여름 구간에는 물가 가면 기온이 좀 더 낮아질 수 있다"): on a summer day, a friend at the open
// (unfrozen) lake's edge dries half as fast (engine body water use, like the leaf shade) and feels the sun one step softer
// (light −15 for photosynthesis), so a hot dry summer is easier by the water. Pure read; nothing is saved.
const COOL=Object.freeze({reach:1.2,light:15});
function coolAt(s,p){const W=dep('world'),E=dep('environment');return !!(W&&isDay(s)&&E?.season?.(s)==='summer'&&W.lakeOpen(s)&&!W.frozen(s)&&p.x>1.15&&W.waterD(p.x,p.y)<COOL.reach);}
const SNOW_EAT=3/60;
// 1.0.1 겨울의 따뜻한 자리 (user: "따듯하게 해주는 오브젝트"): on a cold day (temperature under 35 or snow) the cold costs
// nothing on the sun rock while it still holds stored sun (and the stored sun gives 기운, see step), half beside a litter
// pile or the litter spot rich in compost (rotting leaves are warm), and nothing in the shelter (engine; shelter rest is faster).
const isCold=s=>s.climate.T<35||s.weather.kind==='snow';
function chill(s,p){if(restingAt(p,'rock')&&rockSun(s)>0)return 0;const warm=[s.patches?.find(z=>z.id==='litter'),...(s.objects?.litter?.piles||[])].some(z=>z&&z.U>=5&&Math.hypot(z.x-p.x,(z.y-p.y)*1.6)<.1);return warm?.5:1;}
const restingAt=(p,id)=>p.objectArrived&&p.objectTask?.object===id&&['rest','moss'].includes(p.objectTask.kind);
function migrate(p){if(p.vit===2)return false;const q=Math.max(0,p.Q||0),room=100-p.B,to=Math.min(q,room);p.B+=to;p.Q=q-to;
 p.energy=clamp(((p.energy??70)+(p.mood??p.energy??70))/2-(p.damage||0)*.5);p.mood=p.energy;p.moodSync=p.mood;p.damageSync=p.damage||0;p.vit=2;return true;}
// 1.0.3: how well a friend photosynthesises right now ('good'/'near'/'strong'/'dark', or null at night, inside, in the
// crevice or when too dry/hungry to). Pure read; step uses it and the scene shows the 광합성 pose from it.
function photoGrade(s,p,light,inside){const dark=inside||restingAt(p,'crevice');if(!isDay(s)||dark||!(p.B>15&&p.nutrition>15))return null;
 const [a,c]=T().ofPet(p).light,L=restingAt(p,'rock')&&rockSun(s)>0?(a+c)/2:coolAt(s,p)?light-COOL.light:light;
 return L>=a&&L<=c?'good':L<a?(L>=a-15?'near':'dark'):(L<=c+15?'near':'strong');}
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
  if(isDay(s)&&!dark&&p.B>15&&p.nutrition>15){const g=photoGrade(s,p,light,inside);
   const R={good:[.3,.6,1/210],near:[.2,.3,1/420],strong:[.6,.2,1/420],dark:[0,0,0]}[g];out.grade=g;
   if(R[0]){const w=Math.min(p.B,R[0]*tr.sun/60);p.B-=w;ledger.physiology+=w;out.water=w;}
   if(R[1])energyPts(p,R[1]/60);if(g==='strong'&&zb==='low'||g==='strong'&&zb==='dangerLow')energyPts(p,-1/60);
   if(R[2]){const fit=danger(zb)||danger(zn)?0:bad(zb)||bad(zn)?.5:1,en=p.energy>=70?1.2:p.energy<30?.5:1,season={spring:1.25,winter:.75}[E?.season?.(s)]??1;
    out.xp=R[2]*fit*en*season;if(p.xp<150){p.growthSeconds+=360*out.xp;while(p.growthSeconds>=360&&p.xp<150){p.growthSeconds-=360;p.xp=Math.min(150,p.xp+1);}if(p.xp>=150)p.growthSeconds=Math.min(p.growthSeconds,359);}}
   if(onRock){const r=s.patches.find(z=>z.id==='rock');r.sun=Math.max(0,r.sun-SUN.use);}}
  // 1.0.1 눈 먹기 (user: "혹독한 겨울에도 눈 오지 않나? 눈 먹으면 되잖아"): snow lying on a friend's own leaves melts into
  // its body at any temperature while it is below the middle of its band (3 a minute), so a cold winter with a frozen
  // lake and an unmelted spring still has water. Water only moves from the leaf snow to the body (no new water).
  if(p.snowWater>0&&p.B<b.mid){const n=Math.min(p.snowWater,SNOW_EAT,b.mid-p.B);p.snowWater-=n;p.B+=n;out.snow=n;}
  // over-wet friends dry out on the sun rock (while it holds sun or the sky is clear), in the shelter, or in the crevice
  // the sun rock's stored sun warms a resting friend on a cold day (at night too): 기운 +2/min, drawing the store
  if(isCold(s)&&restingAt(p,'rock')&&rockSun(s)>0&&!out.rockDrawn){energyPts(p,2/60);if(!(isDay(s)&&!dark&&p.B>15&&p.nutrition>15)){const r=s.patches.find(z=>z.id==='rock');r.sun=Math.max(0,r.sun-SUN.use);}}
  if(p.B>b.hi){const rate=restingAt(p,'rock')&&(rockSun(s)>0||s.weather.kind==='sun')?2:inside?1.5:restingAt(p,'crevice')?1:0;if(rate){const w=Math.min(p.B-b.mid,rate/60);p.B-=w;ledger.evaporation+=w;}}
  // 영양 from compost: resting still beside rich compost for 5 minutes soaks it up by the roots (a cause of 과잉)
  const spots=[s.patches.find(z=>z.id==='litter'),...(s.objects?.litter?.piles||[])].filter(z=>z&&z.U>1&&Math.hypot(z.x-p.x,(z.y-p.y)*1.6)<.1);
  if(spots.length&&!moving){p.compostSeconds=(p.compostSeconds||0)+1;if(p.compostSeconds>300){const z=spots[0],n=Math.min(z.U,.5/60*tr.nutr,100-p.nutrition);z.U-=n;p.nutrition+=n;if(s.objects?.ledger)s.objects.ledger.absorbed+=n;}}else p.compostSeconds=0;}
 p.energy=clamp(p.energy);p.mood=p.energy;p.moodSync=p.mood;p.damageSync=p.damage||0;return out;}
// the drink / feed / rest targets the behaviour layer uses
function targets(p){const b=band(p);return {water:{start:b.warnLo,end:b.mid},nutrition:{start:b.warnLo,end:b.mid},energy:{start:40,end:80},band:b};}
function validate(s){for(const p of s.individuals){if(p.vit!==undefined&&p.vit!==2)throw Error('능력치 기록을 확인해 주세요.');for(const k of ['moodSync','damageSync','compostSeconds'])if(p[k]!==undefined&&!(Number.isFinite(p[k])&&p[k]>=0&&p[k]<=1e9))throw Error('능력치 기록을 확인해 주세요.');}
 const r=s.patches?.find(z=>z.id==='rock');if(r&&r.sun!==undefined&&!(Number.isFinite(r.sun)&&r.sun>=0&&r.sun<=100))throw Error('햇살 바위 기록을 확인해 주세요.');}
return Object.freeze({photoGrade,restingAt,band,zone,energyPts,shown,sleepTime,isDay,coolAt,COOL,isCold,chill,rockSun,sunStep,migrate,step,targets,validate,SUN});
});
