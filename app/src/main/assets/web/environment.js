(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestEnvironment=api;})(globalThis,function(){
'use strict';
const clamp=(x,a=0,b=100)=>Math.max(a,Math.min(b,x));
const TIMES={morning:[1.02,1,'#F5DFB5',.05],noon:[1,1,'#FFFFFF',0],dusk:[.94,.94,'#E3B18A',.14],night:[.74,.82,'#708CA5',.18],deep:[.66,.76,'#617D97',.20],dawn:[.90,.88,'#CBD9DF',.08]};
const WEATHER={sun:[1,1,'#FFFFFF',0],cloud:[.94,.90,'#AEBDBB',.08],rain:[.87,.84,'#8EA8B4',.12],fog:[.98,.78,'#CFD8D2',.12],snow:[1.02,.86,'#DFE8E6',.10],wind:[.97,.94,'#A8B4A4',.05],storm:[.80,.74,'#7A919F',.15]};
const NAMES={sun:'맑음',cloud:'흐림',rain:'비',fog:'안개',snow:'눈',wind:'바람',storm:'폭풍'};
const CLIMATES={C01:{name:'촉촉한 숲',T:60,H:75,weights:[20,20,45,15],seasons:['wet','dry']},C02:{name:'온화한 숲',T:55,H:50,weights:[40,25,25,10],seasons:['wet','dry','cool']},C03:{name:'서늘한 숲',T:35,H:70,weights:[20,25,20,35],seasons:['mist','clear','cool']},C04:{name:'마른 숲',T:65,H:30,weights:[60,25,10,5],seasons:['dry','moist']}};
function init(s){s.environment??={version:1,climate:'C01',lastStormEnd:-600,seasonStart:0};const e=s.environment;e.climate??='C01';e.lastStormEnd??=-600;e.seasonStart??=0;e.dryActiveSeconds??=0;e.effectiveRainSeconds??=0;e.rainRescuePending??=false;e.calendar??={start:s.worldTick};if(s.rng&&!s.rng.climate)s.rng.climate=((s.rng.weather^0x9e3779b9)>>>0)||1;s.ledger.snow??=0;s.ledger.condensation??=0;for(const p of s.patches){p.snowWater??=0;p.roofSnow??=0;}for(const p of s.individuals)p.snowWater??=0;return s;}
function timeKey(s){const t=((s.worldTick%1200)+1200)%1200;return t<180?'morning':t<540?'noon':t<600?'dusk':t<900?'night':t<1140?'deep':'dawn';}
// 0.8.0 사계절 (SRS v2.31): spring → summer → autumn → winter, 3,600 s (3 game days) each, a year is 14,400 s. The calendar
// starts at spring day 1 for a new game and, for an older save, at the moment it is first loaded. The climate stays the
// forest's base character; the season adds to it (temperature, rain/fog weight, wind, share of the rain that falls as snow).
// Changing the climate keeps the calendar. The first 120 s of a season blend from the previous season's values.
// The hidden 'wet/dry/cool' phases of each climate (before 0.8.0) are replaced by these seasons.
const SEASON_LEN=3600,YEAR=SEASON_LEN*4,SEASON_BLEND=120,SEASONS=['spring','summer','autumn','winter'],SEASON_NAMES={spring:'봄',summer:'여름',autumn:'가을',winter:'겨울'};
const Z={T:0,rain:1,fog:1,wind:0,snow:0};
const SEASON_FX={
 C01:{spring:{...Z,T:-5,rain:1.2},summer:{...Z,T:8,rain:1.6},autumn:{...Z,T:-5,rain:.8,wind:10},winter:{...Z,T:-22,rain:.8,snow:1}},
 C02:{spring:{...Z,T:-3,rain:1.1},summer:{...Z,T:10},autumn:{...Z,T:-8,wind:10},winter:{...Z,T:-28,snow:1}},
 C03:{spring:{...Z,fog:1.3},summer:{...Z,T:12},autumn:{...Z,T:-8,fog:1.2},winter:{...Z,T:-15,snow:1}},
 C04:{spring:{...Z,T:-5,rain:1.5},summer:{...Z,T:10,rain:.5},autumn:{...Z,T:-5},winter:{...Z,T:-15,rain:0}}};   /* 0.8.1: winter falls as snow; the dry forest has a dry winter (no rain, no snow) */
function calendar(s){const e=s.environment||{},start=e.calendar?.start??0,el=Math.max(0,s.worldTick-start),n=Math.floor(el/SEASON_LEN),i=n%4,into=el-n*SEASON_LEN;
 return {index:i,id:SEASONS[i],name:SEASON_NAMES[SEASONS[i]],day:Math.floor(into/1200)+1,into,year:Math.floor(n/4)+1,prev:SEASONS[(i+3)%4],blend:n===0?1:Math.min(1,into/SEASON_BLEND)};}
function season(s){return calendar(s).id;}
function seasonFx(s){const c=calendar(s),tab=SEASON_FX[s.environment?.climate]||SEASON_FX.C01,a=tab[c.prev],b=tab[c.id],k=c.blend,o={};for(const key of Object.keys(Z))o[key]=a[key]+(b[key]-a[key])*k;return o;}
function weights(s){const c=CLIMATES[s.environment.climate],v=c.weights.slice(),fx=seasonFx(s);v[2]*=fx.rain;v[3]*=fx.fog;const snow=v[2]*fx.snow;v[2]-=snow;return [...v,snow];}
function rgb(h){return [1,3,5].map(i=>parseInt(h.slice(i,i+2),16));}
function profile(a){return {brightness:a[0],saturation:a[1],color:rgb(a[2]),alpha:a[3]};}
function mix(a,b,t){return {brightness:a.brightness+(b.brightness-a.brightness)*t,saturation:a.saturation+(b.saturation-a.saturation)*t,color:a.color.map((x,i)=>x+(b.color[i]-x)*t),alpha:a.alpha+(b.alpha-a.alpha)*t};}
function weatherKey(s){return s.environment?.storm?'storm':s.weather.kind==='sun'&&s.weather.wind>=40?'wind':s.weather.kind;}
function weatherProfile(s){const e=s.environment||{},key=weatherKey(s),to=profile(WEATHER[key]||WEATHER.sun);return e.visualFrom&&s.weather.transition>0?mix(e.visualFrom,to,1-s.weather.transition/10):to;}
function lighting(s){const forced=s.previewTime||(s.settings.theme==='night'?'night':s.settings.theme==='day'?'noon':null);let t;
 if(forced)t=profile(TIMES[forced]);else{const centers=[90,360,570,750,1020,1170],keys=['morning','noon','dusk','night','deep','dawn'],tick=s.worldTick%1200;let idx=centers.findIndex(c=>c>tick);if(idx<0)idx=0;const prev=(idx+5)%6;let a=centers[prev],b=centers[idx],x=tick;if(idx===0){b+=1200;if(x<a)x+=1200;}t=mix(profile(TIMES[keys[prev]]),profile(TIMES[keys[idx]]),clamp((x-a)/(b-a),0,1));}
 const w=weatherProfile(s),se=seasonProfile(s);return {brightness:clamp(t.brightness*w.brightness,.58,1.08),saturation:clamp(t.saturation*w.saturation*se.saturation,.65,1.05),tints:se.alpha>0?[t,w,se]:[t,w]};}
// 0.8.0: a light seasonal colour over the world (render only): fresh green spring, warm summer, amber autumn, cool winter
// 0.8.1 (user: keep the default background colour): no seasonal colour over the world any more; the season shows in the
// plants, the objects and the season props. Kept as neutral values so older callers still get a profile.
const SEASON_TINT={spring:[1,1,'#FFFFFF',0],summer:[1,1,'#FFFFFF',0],autumn:[1,1,'#FFFFFF',0],winter:[1,1,'#FFFFFF',0]};
function seasonProfile(s){if(!s.environment||s.previewTime)return profile([1,1,'#FFFFFF',0]);const c=calendar(s),a=profile(SEASON_TINT[c.prev]),b=profile(SEASON_TINT[c.id]);return c.blend>=1?b:mix(a,b,c.blend);}
function precipitation(s,kind){const e=s.environment||{},w=s.weather,to=w.kind===kind?w.intensity/100:0;return e.precipFrom&&w.transition>0?(e.precipFrom[kind]||0)+(to-(e.precipFrom[kind]||0))*(1-w.transition/10):to;}
function begin(s,kind,intensity,wind,event){const w=s.weather,e=s.environment,prev=w.kind,from=weatherProfile(s),precipFrom={rain:precipitation(s,'rain'),snow:precipitation(s,'snow'),fog:precipitation(s,'fog')};e.visualFrom=from;e.precipFrom=precipFrom;e.windFrom=w.wind;e.windTarget=wind;w.kind=kind;w.intensity=intensity;w.transition=10;w.strongSeconds=0;if(prev!=='rain'&&kind==='rain')w.rainEpoch=(w.rainEpoch||0)+1;if(prev==='rain'&&kind!=='rain'){w.lastRainEnd=s.worldTick;w.lastRainEpoch=w.rainEpoch;}event?.(s,'weather',NAMES[kind]+' 날씨로 천천히 바뀌어요.');}
// 0.8.4: the dry-forest rescue follows the season (user: "겨울엔 비 대신 눈"). Winter rescues with snow, and a season with no
// precipitation at all (the dry forest's winter) never rescues. Snow counts as water for the rescue timer.
function rescueKind(s){const fx=seasonFx(s);return fx.rain<=0?null:fx.snow>=.5?'snow':'rain';}
function choose(s,rng,event,noStorm=false){const w=s.weather,e=s.environment,ks=['sun','cloud','rain','fog','snow'],ws=weights(s),total=ws.reduce((a,b)=>a+b,0);let n=rng(s,'weather')*total,kind=ks[0];for(let i=0;i<ws.length;i++){n-=ws[i];if(n<0){kind=ks[i];break;}}if(w.streak>=2&&kind===w.kind)kind=ks.filter((k,i)=>k!==w.kind&&ws[i]>0)[Math.floor(rng(s,'weather')*ks.filter((k,i)=>k!==w.kind&&ws[i]>0).length)];if(s.worldTick===120)kind='rain';w.streak=kind===w.kind?Math.min(2,w.streak+1):1;w.remaining=120+Math.floor(rng(s,'weather')*121);const windRoll=rng(s,'weather');let wind=Math.min(75,(windRoll<.65?20:windRoll<.95?45:75)+Math.round(seasonFx(s).wind));if(s.worldTick<=600)wind=Math.min(45,wind);w.wind_dir=Math.floor(rng(s,'weather')*4)*Math.PI/2;
 if(!noStorm&&kind==='rain'&&['C01','C02'].includes(e.climate)&&season(s)==='summer'&&s.worldTick>=600&&s.worldTick-e.lastStormEnd>=600&&e.tutorialDone&&rng(s,'weather')<.1){begin(s,'rain',35,45,event);e.storm={phase:'prelude',remaining:20};return;}
 begin(s,kind,s.worldTick===120?35:kind==='fog'?75:rng(s,'weather')<.7?35:60,s.worldTick===120?20:wind,event);}
// 1.0.1 계절마다 바뀌는 기후 (user: "계절마다 바뀌는 기후"): unless the player fixed one (climateMode 'fixed'), each new
// season draws one of the four climate rows as its character, with per-season odds; a hard one (서늘한·마른) never follows
// a hard one. The lake ice already reads the winter's climate, so a 건기 winter keeps open water.
const SEASON_CLIMATE=Object.freeze({spring:{C01:40,C02:35,C03:15,C04:10},summer:{C01:40,C02:25,C03:10,C04:25},autumn:{C01:30,C02:35,C03:20,C04:15},winter:{C01:30,C02:25,C03:30,C04:15}});
const FLAVOR=Object.freeze({
 spring:{C01:'촉촉한 봄이에요',C02:'포근한 봄이에요',C03:'서늘한 봄이에요 · 안개가 잦아요',C04:'메마른 봄이에요 · 물가가 소중해요'},
 summer:{C01:'장마예요 · 비가 잦고 가끔 폭풍이 와요',C02:'맑은 여름이에요',C03:'선선한 여름이에요',C04:'가뭄이에요 · 물가에서 더위를 식혀요'},
 autumn:{C01:'비 잦은 가을이에요',C02:'맑은 가을이에요',C03:'안개 낀 가을이에요',C04:'메마른 가을이에요'},
 winter:{C01:'눈 많은 겨울이에요',C02:'추운 겨울이에요 · 눈이 내려요',C03:'혹독한 겨울이에요 · 춥고 눈이 많아요',C04:'따뜻한 건기예요 · 비도 눈도 없지만 호수는 얼지 않아요'}});
const HARD=['C03','C04'];
function seasonClimate(s,rng,id){const e=s.environment,odds={...SEASON_CLIMATE[id]};if(HARD.includes(e.climate))for(const k of HARD)delete odds[k];
 let total=0;for(const v of Object.values(odds))total+=v;let r=rng(s,'climate')*total;for(const [k,v] of Object.entries(odds)){r-=v;if(r<0)return k;}return Object.keys(odds)[0];}
function changeClimate(s,id){init(s);if(!CLIMATES[id])throw Error('기후를 확인해 주세요.');if(!s.individuals.some(p=>p.first?.drink)&&!s.recruitment?.settled?.length)throw Error('첫 친구가 숲에 익숙해진 뒤 기후를 바꿀 수 있어요.');s.environment.pendingClimate={id,notice:30};}
function step(s,rng,event){init(s);const w=s.weather,e=s.environment;if(w.transition>0){w.transition--;if(e.windTarget!==undefined)w.wind=e.windFrom+(e.windTarget-e.windFrom)*(1-w.transition/10);}if(e.storm){const a=e.storm;if(--a.remaining<=0){if(a.phase==='prelude'){a.phase='peak';a.remaining=60;begin(s,'rain',85,75,event);}else if(a.phase==='peak'){a.phase='tail';a.remaining=30;begin(s,'rain',35,45,event);}else{const previous=weatherProfile(s);delete e.storm;e.lastStormEnd=s.worldTick;choose(s,rng,event,true);e.visualFrom=previous;}}}else if(--w.remaining<=0){if(e.rainRescuePending&&rescueKind(s)){const k=rescueKind(s);w.streak=w.kind===k?Math.min(2,w.streak+1):1;begin(s,k,60,20,event);w.remaining=130;e.rainRescuePending=false;e.rescueActive=true;}else{e.rainRescuePending=false;choose(s,rng,event);}}
 if(!e.storm&&w.wind>=60&&++w.strongSeconds>=90){w.wind=45;e.windTarget=45;}
 if(e.pendingClimate&&!e.storm){if(--e.pendingClimate.notice<=0){e.climateFrom={T:s.climate.T,H:s.climate.H,L:s.climate.L};e.climate=e.pendingClimate.id;e.climateBlend=60;e.seasonStart=s.worldTick;delete e.pendingClimate;choose(s,rng,event,true);}}
 e.dryActiveSeconds++;if(precipitation(s,'rain')+precipitation(s,'snow')>=.35)e.effectiveRainSeconds++;else e.effectiveRainSeconds=0;if(e.effectiveRainSeconds>=120){e.dryActiveSeconds=0;e.rainRescuePending=false;e.rescueActive=false;}if(e.dryActiveSeconds>=(['C01','C02'].includes(e.climate)?600:900)&&rescueKind(s))e.rainRescuePending=true;
 if(s.worldTick>e.calendar.start&&(s.worldTick-e.calendar.start)%SEASON_LEN===0){const cal=calendar(s);if(e.climateMode!=='fixed'&&!e.pendingClimate){const next=seasonClimate(s,rng,cal.id);if(next!==e.climate){e.climateFrom={T:s.climate.T,H:s.climate.H,L:s.climate.L};e.climate=next;e.climateBlend=60;}}const flavor=e.climateMode!=='fixed'?' 이번 '+cal.name+'은 '+FLAVOR[cal.id][e.climate]+'.':'';event?.(s,'season',{spring:'봄이 왔어요. 새 잎이 돋는 철이에요.',summer:'여름이 왔어요. 숲이 무성해져요.',autumn:'가을이 왔어요. 낙엽이 많이 떨어지는 철이에요.',winter:'겨울이 왔어요. 숲이 조용히 쉬는 철이에요.'}[cal.id]+flavor,{season:cal.id,climate:e.climate});}
 const c=CLIMATES[e.climate],kind=w.kind,dayL={sun:80,cloud:50,rain:30,fog:25,snow:45}[kind],t=s.worldTick%1200;
 let L=t>=600&&t<1140?15:t>=1140?15+(dayL-15)*(t-1140)/60:t>=540?dayL+(15-dayL)*(t-540)/60:dayL;
 let targets={T:clamp(c.T+({sun:5,cloud:0,rain:-5,fog:-3,snow:-8}[kind])+seasonFx(s).T),H:clamp(c.H+({sun:-5,cloud:0,rain:15,fog:20,snow:10}[kind])),L};
 if(e.climateBlend>0){const blend=1-(--e.climateBlend)/60;for(const k of ['T','H','L'])targets[k]=e.climateFrom[k]+(targets[k]-e.climateFrom[k])*blend;}for(const k of ['T','H','L'])s.climate[k]+=clamp(targets[k]-s.climate[k],-1,1);
}
// Disjoint ground-area budgets: intercepted snow stays on its cover, not counted twice.
function area(p){return .04*(p.species==='neolbi'?2.25:p.species==='superbum'?2.89:p.species==='jureong'?2:1)*([.65,.78,.9,1][p.visualStage||0]**2);}
function nearest(s,p){return s.patches.reduce((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)<Math.hypot(b.x-p.x,b.y-p.y)?a:b);}
function water(s,p,coverFraction){const W=typeof module==='object'?require('./weather-care.js'):globalThis.ForestWeatherCare,Sh=typeof module==='object'?require('./shelter.js'):globalThis.ForestShelter;
 const snow=12/60*precipitation(s,'snow')*p.exposure,fog=0;s.ledger.snow+=snow;s.ledger.condensation+=fog;
 let roof=snow*clamp(coverFraction,0,1),ground=snow-roof;const cap=12*p.exposure;
 const heads=s.individuals.filter(q=>q.active&&!q.mounted&&!Sh.inside(s,q)&&nearest(s,q).id===p.id).sort((a,b)=>a.id.localeCompare(b.id));
 for(const q of heads){const budget=q.species==='neolbi'&&W.live(s,q)?roof:ground,amount=Math.min(budget,12/60*precipitation(s,'snow')*area(q)*(1-W.rainCover(s,q)),Math.max(0,12*area(q)-q.snowWater));q.snowWater+=amount;if(q.species==='neolbi'&&W.live(s,q))roof-=amount;else ground-=amount;}
 for(const [key,input]of [['roofSnow',roof],['snowWater',ground]]){const stored=Math.min(input,Math.max(0,cap-p[key]));p[key]+=stored;s.ledger.outflow+=input-stored;}
 let melt=0,roofMelt=0;if(s.climate.T>30){const rate=p.exposure*(.2+1.8*clamp((s.climate.T-30)/40,0,1))/60;const total=p.snowWater+p.roofSnow;if(total>0){const amount=Math.min(total,rate);roofMelt=amount*p.roofSnow/total;melt=amount-roofMelt;p.roofSnow=Math.max(0,p.roofSnow-roofMelt);p.snowWater=Math.max(0,p.snowWater-melt);}}
 for(const q of s.individuals.filter(q=>nearest(s,q).id===p.id)){if(s.climate.T>30){const amount=Math.min(q.snowWater,area(q)*(.2+1.8*clamp((s.climate.T-30)/40,0,1))/60);q.snowWater-=amount;melt+=amount;}if(q.active&&q.action==='groom'&&q.snowWater>.001){const shed=Math.min(q.snowWater,area(q)*.25,Math.max(0,cap-p.snowWater));q.snowWater-=shed;p.snowWater+=shed;q.snowShedTick=s.worldTick;}}
 return {ground:fog+melt,roofMelt,rootRain:precipitation(s,'rain')};}

function validate(s){const e=s.environment;if(!e||e.version!==1||!CLIMATES[e.climate]||e.climateMode!==undefined&&!['season','fixed'].includes(e.climateMode)||!Number.isFinite(e.lastStormEnd)||!Number.isFinite(e.seasonStart)||e.calendar!==undefined&&!Number.isFinite(e.calendar?.start))throw Error('환경 기록을 확인해 주세요.');if(e.storm&&(!['prelude','peak','tail'].includes(e.storm.phase)||!Number.isFinite(e.storm.remaining)||e.storm.remaining<0||e.storm.remaining>60))throw Error('폭풍 기록을 확인해 주세요.');for(const p of s.individuals)if(!Number.isFinite(p.snowWater)||p.snowWater<0||p.snowWater>12*area(p)+1e-6)throw Error('친구의 적설 기록을 확인해 주세요.');for(const p of s.patches)for(const key of ['snowWater','roofSnow'])if(!Number.isFinite(p[key])||p[key]<0||p[key]>12*p.exposure+1e-6)throw Error('적설 기록을 확인해 주세요.');for(const k of ['snow','condensation'])if(!Number.isFinite(s.ledger[k])||s.ledger[k]<0)throw Error('환경 물 원장을 확인해 주세요.');}
return {seasonProfile,SEASON_TINT,SEASON_LEN,YEAR,SEASONS,SEASON_NAMES,SEASON_FX,calendar,seasonFx,area,init,step,water,validate,lighting,weatherKey,weatherProfile,timeKey,precipitation,changeClimate,season,weights,SEASON_CLIMATE,FLAVOR,seasonClimate,CLIMATES,TIMES,WEATHER,NAMES};
});
