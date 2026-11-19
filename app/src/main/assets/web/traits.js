(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestTraits=api;})(globalThis,function(){
'use strict';
// SRS v2.28 (0.6.36): species traits from each friend's motif staghorn fern. Every value multiplies an existing rule
// (1 = the rule as it was), or is a new small weather mood / sun energy rate per minute. No new resource is created and
// nothing here is saved: traits are looked up by species key. See docs/Forest-Species-Traits-SRS-v2.28.md.
//  mite / miteGrow : spider mite arrival chance (20%) / growth on hot dry leaves (+4/min)
//  mealy           : mealybug arrival chance (20%)
//  absorb          : root water -> body water (2/min)
//  keep            : body water use (0.8/min; below 1 = keeps water longer)
//  sun             : extra body water use in strong light (+0.4/min)
//  leaf            : leaf damage from pests and wind
//  wet             : over-wet root burden (+2/min)
//  wind            : wind leaf damage
//  cold / rain     : mood per minute when cold (T < 35 or snow) / while it rains (not in a shelter or mounted)
//  sunEnergy       : energy per minute on a clear bright day while not walking (up to 75)
const BASE={mite:1,miteGrow:1,mealy:1,absorb:1,keep:1,sun:1,leaf:1,wet:1,wind:1,cold:0,rain:0,sunEnergy:0};
const TABLE={
 ridley:{wet:1.3,wind:.9,cold:-1,rain:1},
 bonbon:{mite:.5,miteGrow:.8,mealy:1.1,keep:.85,sun:.9,leaf:.8,wind:.9,cold:-.5,rain:.5},
 neolbi:{miteGrow:.9,keep:.8,sun:.6,leaf:.7,wet:1.2,wind:.8,cold:-1.5,sunEnergy:1},
 bosong:{mite:.6,miteGrow:.8,mealy:1.5,absorb:.9,keep:.75,sun:.5,leaf:.9,wet:1.4,wind:.8,rain:-.5,sunEnergy:1},
 jureong:{mite:1.4,miteGrow:1.3,absorb:1.3,keep:1.15,sun:1.4,leaf:1.1,wet:.6,wind:1.2,cold:-1.5,rain:1.5},
 superbum:{mite:.8,miteGrow:.9,mealy:1.4,absorb:1.1,keep:.85,sun:.8,leaf:.8,wet:.9,wind:1.2,rain:1,sunEnergy:.5},
 duri:{leaf:.9,wet:.9,rain:.5}
};
// 엘레판 the tank: while its open leaf shelters a friend (CANOPY session) its own mood rises 1/min up to 80
const TANK_MOOD=1,TANK_MOOD_MAX=80;
const TEXT={
 ridley:{good:['비 오는 날 기분이 좋아요','개미와 친해요'],bad:['물이 고이면 금방 지쳐요','추위를 타요']},
 bonbon:{good:['매끈한 잎이라 잎응애가 잘 안 붙어요','잎이 두꺼워 덜 상해요'],bad:['잎이 겹친 곳에 솜깍지가 조금 더 숨어요']},
 neolbi:{good:['두껍고 넓은 잎으로 친구에게 그늘과 우산이 되어 줘요','잎이 튼튼해 비바람에도 덜 상해요','햇빛·더위·가뭄에 강해요'],bad:['추위를 많이 타요','서늘할 때 늘 젖어 있으면 힘들어해요']},
 bosong:{good:['은빛 털이 햇빛과 가뭄을 막아 줘요','잎응애가 잘 못 붙어요','쌀쌀해도 괜찮아요'],bad:['털 사이에 솜깍지가 잘 숨어요','늘 젖어 있으면 약해요']},
 jureong:{good:['물을 잘 빨아들이고 과습에 강해요','비를 좋아해요'],bad:['마르면 잎응애가 잘 붙어요','햇빛·추위에 약해요']},
 superbum:{good:['크고 튼튼해 잎이 덜 상해요','추위에 강해요','둥지에 빗물을 모아요'],bad:['깍지벌레류가 잘 붙어요','큰 잎이 바람을 받아요']},
 duri:{good:['무난하고 튼튼해요'],bad:['특별히 약한 곳은 없어요']}
};
function of(species){return {...BASE,...(TABLE[species]||{})};}
function text(species){return TEXT[species]||{good:[],bad:[]};}
return Object.freeze({BASE,TABLE,TEXT,TANK_MOOD,TANK_MOOD_MAX,of,text});
});
