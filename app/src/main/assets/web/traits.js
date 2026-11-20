(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestTraits=api;})(globalThis,function(){
'use strict';
// SRS v2.34 육각형 종족값 (replaces the v2.28 per-rule table). Six stats of 1..5, every species totals 18 at level 1
// (user: "종족값 총합은 같아야"); at levels 3, 6 and 9 the lowest stat rises by one (ties: water, sun, leaf, pest, cold,
// nutrient), so every friend gains the same. The old multiplier names are derived from the six stats, so the rules that
// read them (water use, rain on the body, wind and pest leaf harm, pest arrival, cold) keep their call sites.
// Nothing here is saved: values come from the species key and the friend's level.
const KEYS=Object.freeze(['water','sun','leaf','pest','cold','nutr']);
const NAMES=Object.freeze({water:'물',sun:'햇빛',leaf:'잎',pest:'해충',cold:'추위',nutr:'영양'});
const HEX=Object.freeze({
 ridley:  {water:1,sun:4,leaf:3,pest:4,cold:2,nutr:4},
 bonbon:  {water:3,sun:3,leaf:3,pest:5,cold:2,nutr:2},
 neolbi:  {water:3,sun:5,leaf:5,pest:2,cold:1,nutr:2},
 bosong:  {water:1,sun:5,leaf:3,pest:3,cold:3,nutr:3},
 jureong: {water:5,sun:2,leaf:3,pest:2,cold:1,nutr:5},
 superbum:{water:5,sun:3,leaf:2,pest:1,cold:5,nutr:2},
 duri:    {water:3,sun:3,leaf:3,pest:3,cold:3,nutr:3}});
const WEAK=[1.4,1.2,1,.8,.6],GAIN=[.6,.8,1,1.2,1.4],COLD=[-2,-1.5,-1,-.5,0];
// favourite light (the sun stat): photosynthesis is best inside this band
const LIGHT=[[25,55],[30,60],[40,70],[45,80],[50,85]];
// rain liking stays apart from the six stats (likes rain = energy +/min while it rains on the friend)
const RAIN=Object.freeze({ridley:1,bonbon:.5,neolbi:0,bosong:-.5,jureong:1.5,superbum:1,duri:.5});
const LEVELS=[0,3,8,15,25,40,60,85,115,150];
function level(xp){let n=1;LEVELS.forEach((x,i)=>{if((xp||0)>=x)n=i+1;});return n;}
function hex(species,lv=1){const h={...(HEX[species]||HEX.duri)};for(const at of [3,6,9])if(lv>=at){const k=KEYS.reduce((a,b)=>h[b]<h[a]?b:a,KEYS[0]);if(h[k]<5)h[k]++;}return h;}
// the old rule multipliers, derived from the six stats
function of(species,lv=1){const h=hex(species,lv),w=k=>WEAK[h[k]-1];
 return {hex:h,keep:w('water'),wet:w('water'),absorb:1,sun:w('sun'),leaf:w('leaf'),wind:w('leaf'),mite:w('pest'),miteGrow:w('pest'),mealy:w('pest'),
  cold:COLD[h.cold-1],rain:RAIN[species]??0,nutr:GAIN[h.nutr-1],nutrWeak:w('nutr'),light:LIGHT[h.sun-1],sunEnergy:0};}
function ofPet(p){return of(p?.species,level(p?.xp));}
// 엘레판 the tank: while its open leaf shelters a friend (CANOPY session) its own energy rises 1/min up to 80
const TANK_MOOD=1,TANK_MOOD_MAX=80;
const TEXT={
 ridley:{good:['높은 나무 위 밝은 볕에 강해요','둥지잎에 개미가 살아 벌레를 쫓고 영양이 돼요','습한 공기를 좋아해요'],bad:['뿌리가 젖으면 금방 상해요(과습에 약함)','추위를 타요']},
 bonbon:{good:['매끈한 잎이라 벌레가 잘 안 붙어요'],bad:['마다가스카르 출신이라 추위에 약한 편이에요','거름을 천천히 빨아들여요']},
 neolbi:{good:['두껍고 큰 잎이라 볕과 바람에 강한 탱커예요','친구에게 그늘과 우산이 되어 줘요'],bad:['추위를 많이 타요','큰 잎이라 벌레가 붙을 자리가 많고 영양이 많이 들어요']},
 bosong:{good:['은빛 털이 강한 볕을 막아 줘요'],bad:['건조한 곳 출신이라 과습에 약해요 · 이끼에서 천천히 물을 마셔요']},
 jureong:{good:['물에 강하고 과습이 잘 안 와요','물과 거름을 아주 잘 빨아들여요'],bad:['추위에 가장 약해요','강한 볕과 벌레에 약해요']},
 superbum:{good:['둥지잎으로 빗물을 모아요 · 물에 강해요','추위에 강해요'],bad:['넓은 잎이 바람을 받아요','둥지잎 안쪽에 깍지벌레가 숨어요','몸이 커서 영양이 많이 들어요']},
 duri:{good:['무난하고 튼튼해요'],bad:['특별히 약한 곳은 없어요']}};
function text(species){return TEXT[species]||{good:[],bad:[]};}
return Object.freeze({KEYS,NAMES,HEX,WEAK,GAIN,COLD,LIGHT,RAIN,LEVELS,level,hex,of,ofPet,TANK_MOOD,TANK_MOOD_MAX,TEXT,text});
});
