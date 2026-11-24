(function(root,factory){const api=factory(typeof module==='object'?require('./neolbi.js'):root.ForestNeolbi);if(typeof module==='object')module.exports=api;else root.ForestWeatherCare=api;})(globalThis,function(N){
'use strict';
const Sh=typeof module==='object'?require('./shelter.js'):globalThis.ForestShelter;
const Obj=()=>typeof module==='object'?require('./objects.js'):globalThis.ForestObjects;
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const trait=p=>(typeof module==='object'?require('./traits.js'):globalThis.ForestTraits).ofPet(p);
// 1.1.3: 엘레판's umbrella numbers grow with its level (skills.js LEVEL.umbrella); Lv1 = 50% rain, 40% wind, wind 70
const U=h=>(typeof module==='object'?require('./skills.js'):globalThis.ForestSkills)?.umbrella?.(h)||{rain:.5,wind:.4,limit:70};
const fields={gustExposure:0,braceSeconds:0,windCalmSeconds:0,wet85Seconds:0,wetFilm:0,wetRecovery:false,leafRecovery:false};
function init(s){s.weather.wind_dir??=0;for(const p of s.individuals)for(const[k,v]of Object.entries(fields))p[k]??=v;return s;}
function healthy(p){return p&&p.active&&!p.mounted&&p.B>=35&&p.energy>=40&&p.nutrition>=40&&p.burden<40&&p.damage<30&&!p.wetRecovery&&!p.leafRecovery;}
// 1.2.1: under 엘레판's leaf in rain, low 수분 is no reason to refuse the umbrella — the rain itself waters the friend
function leafFit(s,p){return healthy(p)||!!p&&['rain','snow'].includes(s.weather.kind)&&healthy({...p,B:Math.max(p.B,35)});}
function live(s,h){return healthy(h)&&h.canopy&&!h.canopyClosing&&(h.canopyProgress??1)>=.95&&s.weather.wind<U(h).limit&&(s.weather.wind<U(h).limit-10||h.braceSeconds<=10)&&(!h.motion||!h.motion.distance);}
function covered(s,q){return s.individuals.filter(h=>h.species==='neolbi'&&live(s,h)&&N.covers(h,q));}
function host(s,p){const a=s.social?.sessions.find(a=>a.type==='CANOPY'&&a.phase==='rest'&&a.ids[1]===p.id);const h=a&&s.individuals.find(h=>h.id===a.ids[0]);return h&&live(s,h)&&N.canFit(h,p,p)?h:null;}
function rainCover(s,q){if(q.species?Sh.inside(s,q):Sh.cover(s,q))return .9;return Math.max(covered(s,q).reduce((v,h)=>Math.max(v,U(h).rain),0),Obj().patchesOf(s,'shade').some(z=>Math.hypot(z.x-q.x,z.y-q.y)<.16)?.5:0);}
function wind(s,p){const inside=p.mounted||Sh.inside(s,p);let a=s.weather.wind*(inside?.2:1);const h=host(s,p);if(h){const g=N.geometry(h),dir=s.weather.wind_dir||0,dx=p.x-h.x,dy=(p.y-h.y)*1.6;const downstream=dx*Math.cos(dir)+dy*Math.sin(dir)>0; if(downstream&&N.covers(h,p)&&g.rx>0)a*=1-U(h).wind;}if(s.objects&&!inside){const O=Obj();if(Math.cos(s.weather.wind_dir||0)<-.5&&O.patchesOf(s,'crevice').some(z=>O.fits(s,p,z.id,p,'rest')))a*=.5;}return clamp(a);}
// Midpoint quadrature over each fixed logical patch footprint, independent of camera/FPS.
const coverCache=new WeakMap();
function rainFraction(s,patch){const hosts=s.individuals.filter(h=>h.species==='neolbi'&&live(s,h));const key=[...(s.shelters?.facilities||[]).flatMap(f=>[f.id,f.level,f.x,f.y]),...hosts.flatMap(h=>[h.id,h.x,h.y,h.xp]),...s.patches.flatMap(z=>[z.x,z.y])].join(':');let cache=coverCache.get(s);if(!cache||cache.key!==key){cache={key,values:{}};coverCache.set(s,cache);}if(cache.values[patch.id]!==undefined)return cache.values[patch.id];let sum=0;const n=12;for(let j=0;j<n;j++)for(let i=0;i<n;i++)sum+=rainCover(s,{x:patch.x+((i+.5)/n-.5)*.18,y:patch.y+((j+.5)/n-.5)*.18/1.6});return cache.values[patch.id]=sum/(n*n);}
function counters(s,p,a){const before=p.gustExposure;p.gustExposure=a>=60?Math.min(10,before+1):a<50?Math.max(0,before-2):before;p.windCalmSeconds=s.weather.wind<50?Math.min(20,p.windCalmSeconds+1):0;if(p.windCalmSeconds>=20)p.braceSeconds=0;return before;}
function physiology(s,p,{safeCare=false}={}){const r=Math.max(p.Q*5,p.B),   /* SRS v2.34: 수분 includes root wetness */wet=p.wetSeconds||0;
 p.wetSeconds=r>=80?wet+1:0;p.wet85Seconds=r>=85?p.wet85Seconds+1:0;
 if(r<60)p.burden=clamp(p.burden-4/60);else if(!safeCare&&r>=80&&wet>=60)p.burden=clamp(p.burden+2/60*trait(p).wet);
 if(p.burden>=40||p.wet85Seconds>=30)p.wetRecovery=true;
 if(p.wetRecovery&&p.burden<30&&r<60)p.wetRecovery=false;
 if(p.damage>=30)p.leafRecovery=true;if(p.leafRecovery&&p.damage<20)p.leafRecovery=false;
 const a=wind(s,p),before=counters(s,p,a);let damage=0;
 if(!safeCare&&s.worldTick>600&&a>=60&&before>=10){damage=Math.min(4,1+3*(a-60)/40)/60*trait(p).wind*trait(p).leaf;p.damage=clamp(p.damage+damage);}
 const rain=((typeof module==='object'?require('./environment.js'):globalThis.ForestEnvironment).precipitation(s,'rain')>0)?s.weather.intensity/100*(1-rainCover(s,p)):0;
 p.wetFilm=clamp(p.wetFilm+(rain>0?.012*rain:-.003),0,1);
 p.weatherExposure={wind:a,rain,damage,protectedBy:host(s,p)?.id||null};
 return damage;
}
function offline(p){p.gustExposure=Math.max(0,p.gustExposure-2);p.windCalmSeconds=Math.min(20,p.windCalmSeconds+1);if(p.windCalmSeconds>=20)p.braceSeconds=0;if(p.Q<16)p.wetSeconds=0;if(p.Q<17)p.wet85Seconds=0;if(p.Q<12&&p.burden<30)p.wetRecovery=false;if(p.damage<20)p.leafRecovery=false;p.wetFilm=Math.max(0,p.wetFilm-.003);delete p.weatherExposure;}
function validate(s){if(!Number.isFinite(s.weather.wind_dir)||Math.abs(s.weather.wind_dir)>Math.PI*2)throw Error('바람 방향 기록을 확인해 주세요.');for(const p of s.individuals){for(const k of ['gustExposure','braceSeconds','windCalmSeconds','wet85Seconds','wetFilm'])if(!Number.isFinite(p[k])||p[k]<0||p[k]>(k==='gustExposure'||k==='braceSeconds'?10:k==='windCalmSeconds'?20:k==='wetFilm'?1:1e15))throw Error('날씨 노출 기록을 확인해 주세요.');for(const k of ['wetRecovery','leafRecovery'])if(typeof p[k]!=='boolean')throw Error('회복 기록을 확인해 주세요.');}}
const limit=h=>U(h).limit;
return {limit,init,healthy,leafFit,live,host,covered,rainCover,rainFraction,wind,physiology,offline,validate};
});
