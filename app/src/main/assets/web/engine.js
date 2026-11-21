(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.Forest=api;})(globalThis,function(){
'use strict';
// SRS 2.5: the one-second world is independent of rendering, UI, and wall clock.
const Space=typeof module==='object'?require('./spatial.js'):globalThis.ForestSpace;
const Social=typeof module==='object'?require('./social.js'):globalThis.ForestSocial;
const Motion=typeof module==='object'?require('./neolbi-motion.js'):globalThis.ForestNeolbiMotion;
const W=typeof module==='object'?require('./weather-care.js'):globalThis.ForestWeatherCare;
const Sh=typeof module==='object'?require('./shelter.js'):globalThis.ForestShelter;
const Env=typeof module==='object'?require('./environment.js'):globalThis.ForestEnvironment;
const Rec=typeof module==='object'?require('./recruitment.js'):globalThis.ForestRecruitment;
const Obj=typeof module==='object'?require('./objects.js'):globalThis.ForestObjects;
const Creatures=typeof module==='object'?require('./creatures.js'):globalThis.ForestCreatures;
const Traits=typeof module==='object'?require('./traits.js'):globalThis.ForestTraits;
const World=typeof module==='object'?require('./world.js'):globalThis.ForestWorld;
const Vit=typeof module==='object'?require('./vitals.js'):globalThis.ForestVitals;
const Skills=typeof module==='object'?require('./skills.js'):globalThis.ForestSkills;
// SRS v2.34: 영양 now matters (out of band costs 기운), so the base use is set to what the litter can feed: 0.08 a minute
const NUTR_USE=.08/60;
const VERSION='1.2.0', RULES='SRS-2.19-objects', SCHEMA=1;
const LEVELS=[0,3,8,15,25,40,60,85,115,150];
const PATCHES=[
 {id:'rock',name:'햇살 바위',cap:2,pool:12,infiltration:4,drain:6,exposure:1,x:.73,y:.32},
 {id:'moss',name:'이끼 자리',cap:5,pool:0,infiltration:12,drain:0,exposure:.8,x:.64,y:.52},
 {id:'shade',name:'잎 그늘',cap:20,pool:12,infiltration:8,drain:2,exposure:.6,x:.78,y:.73},
 {id:'crevice',name:'바위 틈',cap:10,pool:20,infiltration:5,drain:1,exposure:.5,x:.37,y:.48},
 {id:'shelter',name:'기본 쉼터',cap:10,pool:6,infiltration:6,drain:3,exposure:.1,x:.23,y:.22},
 {id:'litter',name:'낙엽 자리',cap:30,pool:10,infiltration:8,drain:1.5,exposure:.8,x:.54,y:.83}
];
const SPECIES=[['ridley','리들리','Platycerium ridleyi','호기심 많은 작은 관찰자'],['bonbon','엘리시','Platycerium ellisii','둥근 잎틈에 작은 이웃이 머물 자리를 내어줘요'],['neolbi','엘레판','Platycerium elephantotis','큰 잎 아래 그늘을 만들어요'],['bosong','베이치','Platycerium veitchii','마른 날 물이 있는 곳을 찾아요'],['jureong','코로나','Platycerium coronarium','바람에 날린 낙엽을 모아요'],['duri','두리','Platycerium bifurcatum','친구와 나란히 쉬는 걸 좋아해요'],['superbum','슈퍼범','Platycerium superbum','둥지잎에 빗물을 모아 목마른 친구에게 나눠줘요']];
const clone=x=>JSON.parse(JSON.stringify(x));
const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const uid=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'forest-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
function seedInt(str){let h=2166136261;for(const c of str)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0||1;}
function rng(s,key){let x=s.rng[key]>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng[key]=x>>>0;return (x>>>0)/4294967296;}
function personality(id){let h=seedInt(id);return {version:1,a:h%3-1,c:Math.floor(h/3)%3-1,e:Math.floor(h/9)%3-1};}
function create(now=Date.now(),seed=3172026){const id='ridley-'+seed;
 return World.init(Obj.init(Env.init(Rec.init(Sh.init(Social.init({schema:SCHEMA,app:'ForestOfSpace',version:VERSION,rules:RULES,createdAt:now,savedAt:now,deviceId:uid(),mode:'game',started:false,worldTick:0,layoutRevision:0,
  rng:{weather:seedInt(seed+'weather'),behavior:seedInt(seed+'behavior'),neighbor:seedInt(seed+'neighbor')},
  weather:{kind:'sun',remaining:120,streak:1,intensity:35,wind:20,strongSeconds:0,transition:0,lastRainEnd:-9999,rainEpoch:0,lastRainEpoch:0},climate:{T:65,H:70,L:80},
  patches:PATCHES.map(p=>({...p,S:({moss:2,rock:1,shade:4,crevice:2,shelter:3,litter:6})[p.id],W:0,O:0,U:p.id==='litter'?10:0,rainTotal:0,film:0})),spring:{x:.20,y:.72,water:60},
  individuals:[{id,species:'ridley',name:'리들리',B:30,Q:0,V:0,energy:70,mood:70,nutrition:50,vit:2,damage:0,burden:0,wetSeconds:0,x:.47,y:.38,xp:0,growthSeconds:0,mounted:false,active:true,action:'wander',actionSeconds:0,target:null,drinkCycle:false,first:{},personality:personality(id)}],
  settings:{audio:{master:.65,music:.35,environment:.45,effects:.55},reducedMotion:false,showName:false,showLevel:false,showState:true,showSpeech:true,showFrame:true,theme:'auto'},
  ledger:{rain:0,spring:0,evaporation:0,outflow:0,physiology:0},events:[],discoveries:{},neighbor:{observed:0,validSeconds:0,visitSeconds:0,absentSeconds:0,cooldown:0,visits:0,stage:'none'},offline:null,legacy:null}))))));
}
function level(p){let n=1;LEVELS.forEach((x,i)=>{if(p.xp>=x)n=i+1;});return n;}
function health(p){return p.active&&!p.mounted&&p.B>=35&&p.B<=80&&p.energy>=40&&p.nutrition>=40&&p.burden<60&&p.damage<30;}
// 0.8.0: growth time runs x1.25 in spring (new fronds) and x0.75 in winter
const GROWTH_SEASON={spring:1.25,winter:.75};
function growth(p,s){if(health(p)&&p.xp<150){p.growthSeconds+=s?.environment?GROWTH_SEASON[Env.season(s)]??1:1;if(p.growthSeconds>=360){p.growthSeconds-=360;p.xp=Math.min(150,p.xp+1);}}}
function moisture(p){return 100*p.S/p.cap;}
function totalWater(s){return Skills.water(s)+s.spring.water+(s.spring.snowWater||0)+s.patches.reduce((n,p)=>n+p.S+p.W+(p.snowWater||0)+(p.roofSnow||0),0)+s.individuals.reduce((n,p)=>n+p.B+p.Q+p.V+(p.snowWater||0),0);}
function event(s,type,text,detail={}){s.events.push({id:s.worldTick+'-'+s.events.length,type,text,tick:s.worldTick,layout:s.layoutRevision,...detail});s.events=s.events.filter(e=>s.worldTick-e.tick<=600).slice(-256);}
function discovery(s,id,text,visible,detail={}){if(visible&&!s.discoveries[id]){s.discoveries[id]={tick:s.worldTick,text,layout:s.layoutRevision,...detail};event(s,'discovery',text,{discovery:id});}}
function light(s,p){return s.climate.L*(1-Social.shadeFactor(s,p));}
function safe(p){return p.B>=35&&p.energy>=40&&p.burden<60;}
function take(p,amount){const a=Math.min(p.W,amount);p.W-=a;const b=Math.min(p.S,amount-a);p.S-=b;return a+b;}
function put(s,p,amount){const a=Math.min(amount,p.cap-p.S);p.S+=a;const b=Math.min(amount-a,p.pool-p.W);p.W+=b;s.ledger.outflow+=amount-a-b;}
function approach(p,t,speed=.009){const d=dist(p,t);if(d<=speed){p.x=t.x;p.y=t.y;return true;}p.x+=(t.x-p.x)/d*speed;p.y+=(t.y-p.y)/d*speed;return false;}
function rotate(items,tick){if(!items.length)return items;const n=tick%items.length;return items.slice(n).concat(items.slice(0,n));}
function step(s,{visible=true,held=null}={}){
 if(s.mode!=='game'||!s.started||s.offline)return s;
 if(Rec.encounterStep(s))return s;
 s.worldTick++;Env.step(s,rng,event);const w=s.weather;if(held&&(w.wind>=60||s.individuals.find(p=>p.id===held)?.B<20))held=null;
 Obj.resources(s);Creatures.step(s,event);
 // Conservative transfer: each patch debits one pool, and every external loss is ledgered.
 Obj.prepare(s,held,rng);Sh.prepare(s,held,Space);const participants=Social.prepare(s,held);Skills.prepare(s,{held,busy:participants,event,discovery,visible});const transfers=[];for(const p of s.individuals)p.harvestTick=0;Social.collect(s,held,Env.precipitation(s,'rain'),Env.area);Social.nest(s,held,Env.precipitation(s,'rain'));
 for(const p of s.patches){
  const weatherWater=Env.water(s,p,W.rainFraction(s,p));let rain=12/60*Env.precipitation(s,'rain')*p.exposure;
  // Movable leaf canopy physically shields patches within its radius; intercepted water
  // is routed once to the nearest lower patch, never counted as a second rainfall input.
  s.ledger.rain+=rain;p.rainTotal+=rain;if(rain>0){if(!w.rainEpoch)w.rainEpoch=1;p.lastRainTick=s.worldTick;p.rainEpoch=w.rainEpoch;}
  p.film=clamp(p.film+(rain>0?rain*.20:-(.002+.004*light(s,p)/100+.003*w.wind/100)),0,1);
  let receiving=rain;const redirected=rain>0?rain*W.rainFraction(s,p):0;receiving-=redirected;
  const edge=s.patches.filter(z=>z.id!==p.id&&z.y>p.y&&dist(z,p)<.42).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(redirected+weatherWater.roofMelt>0){if(edge)transfers.push([edge,redirected+weatherWater.roofMelt]);else s.ledger.outflow+=redirected+weatherWater.roofMelt;}
  receiving=Social.rain(s,p,receiving,held);
  // SRS v2.34: rain lands on the friend's body (수분) at up to 6/min in heavy rain, faster for friends weak to water;
  // shelters, leaf shade and 엘레판's leaf cut it (rainCover). Taken from this patch's real rainfall (conserved).
  const roots=s.individuals.filter(q=>q.active&&!q.mounted&&q.B<100&&s.patches.reduce((a,b)=>dist(a,q)<=dist(b,q)?a:b).id===p.id);
  const requests=roots.map(q=>Math.min(100-q.B,6/60*Env.precipitation(s,'rain')*(1-W.rainCover(s,q))*Traits.ofPet(q).wet));const demand=requests.reduce((a,b)=>a+b,0),fraction=demand>0?Math.min(1,receiving/demand):0;
  roots.forEach((q,i)=>{const n=requests[i]*fraction;q.B+=n;receiving-=n;});
  receiving+=weatherWater.ground+p.W;p.W=0;const infiltration=Math.min(receiving,p.infiltration/60,p.cap-p.S);p.S+=infiltration;receiving-=infiltration;
  const pool=Math.min(receiving,p.pool);p.W=pool;s.ledger.outflow+=receiving-pool;
  const drain=take(p,Math.min(p.S+p.W,p.drain/60));const lower=s.patches.filter(z=>z.id!==p.id&&z.y>p.y+.015&&dist(z,p)<.32).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(lower)transfers.push([lower,drain]);else s.ledger.outflow+=drain;
  const evaporation=take(p,Math.min(p.S+p.W,(p.id==='moss'?(.05+.1*light(s,p)/100+.1*w.wind/100):(.2+.6*light(s,p)/100+.4*w.wind/100))/60));s.ledger.evaporation+=evaporation;
 }
 for(const [to,amount]of transfers)put(s,to,amount);
 const active=rotate(s.individuals.filter(p=>p.active),s.worldTick),requests=[];Vit.sunStep(s,light);
 for(const p of active){
  p.motion={kind:'idle',path:[{x:p.x,y:p.y}],distance:0,water:0,tick:s.worldTick};
  // species traits (SRS v2.28): water use, strong-light use and root absorption scale by the motif fern's traits
  // SRS v2.34: basic water use by the water stat; strong light now costs water through photosynthesis (vitals.js)
  const tr=Traits.ofPet(p),vb=Vit.band(p),bodyUse=Math.min(p.B,(.8*tr.keep*(Social.shadeFactor(s,p)>0||Vit.coolAt(s,p)?.5:1))/60);p.B-=bodyUse;s.ledger.physiology+=bodyUse;
  const absorb=Math.min(p.Q,2/60*tr.absorb,Math.max(0,vb.warnHi-p.B));p.Q-=absorb;p.B+=absorb;
  const ground=Obj.groundAt(s,p),safeDry=Sh.inside(s,p)||p.mounted||ground&&Obj.dry(s,ground.id);
  if(safeDry&&p.Q>0){const q=Math.min(p.Q,3/60);p.Q-=q;if(Sh.inside(s,p)||p.mounted)s.ledger.outflow+=q;else put(s,ground,q);}
  const weatherDamage=W.physiology(s,p,{safeCare:p.mounted});
  // SRS v2.28 species traits: weather mood (cold or snow / rain on the friend), and 엘레판's tank bonus while its open
  // leaf shelters a friend. Not under a shelter roof or on the mount, where the weather does not reach the friend.
  if(!Sh.inside(s,p)&&!p.mounted){if(tr.cold&&Vit.isCold(s))p.mood=clamp(p.mood+tr.cold*Vit.chill(s,p)/60);if(tr.rain&&(p.weatherExposure?.rain||0)>0)p.mood=clamp(p.mood+tr.rain/60);
   if(p.species==='neolbi'&&p.mood<Traits.TANK_MOOD_MAX&&s.social?.sessions?.some(a=>a.type==='CANOPY'&&a.ids[0]===p.id&&a.phase==='rest'))p.mood=Math.min(Traits.TANK_MOOD_MAX,p.mood+Traits.TANK_MOOD/60);}
  // SRS v2.34 능력치: bands, photosynthesis growth, drying, compost, mood and leaf damage folded into 기운 (vitals.js)
  Vit.step(s,p,{light:light(s,p),inside:Sh.inside(s,p),moving:!!(p.objectTask&&!p.objectArrived||p.stroll&&!p.stroll.arrivedAt),held:held===p.id||participants.has(p.id),ledger:s.ledger});
  if((p.wetRecovery||p.leafRecovery||p.burden>=40||p.damage>=30)&&participants.has(p.id)){Social.cancel(s,p.id);participants.delete(p.id);}
  if(held===p.id||p.settleUntil>=s.worldTick&&w.wind<60&&p.B>=20){p.motion.kind=held===p.id?'held':'land';p.nutrition=clamp(p.nutrition-NUTR_USE);continue;}
  if(participants.has(p.id)){p.nutrition=clamp(p.nutrition-NUTR_USE);continue;}
  if(p.mounted){p.motion.kind='rest';if(p.energy<75)p.energy=Math.min(75,p.energy+4/60);continue;}
  // SRS v2.36 고유 스킬: a friend busy with its skill (or held still while its leaves are brushed) spends the tick on it
  {const sm=Skills.act(s,p,{event,discovery,visible});if(sm){Object.assign(p.motion,sm);if(sm.distance>0)p.energy=clamp(p.energy-1/60);p.nutrition=clamp(p.nutrition-NUTR_USE);continue;}}
  // 슈퍼범 is too large for most rest spots: when tired and nothing else holds it (no object task, no shelter request
  // or seat), it folds its nest frond and rests where it stands (1.5/min up to 75), like other friends on a rest spot.
  // 0.9.5 (user: "오브젝트로 가는 길을 찾고 있는 버그"): a friend with nowhere to sleep at night or to shelter from the rain
  // (shelter full, every rest spot taken or too small) sleeps where it stands instead of standing frozen.
  if(p.sleepHere){const still=Vit.sleepTime(s,p)||Env.precipitation(s,'rain')+Env.precipitation(s,'snow')>=.25;
   // 1.1.1: every 20 s it looks again for a real spot (a shelter seat held by a friend still walking frees up, the rain stops),
   // instead of sleeping out in the open for the rest of the night
   if(!still||s.worldTick>=p.nextObjectChoice||p.B<Vit.band(p).warnLo||p.nutrition<Vit.band(p).warnLo||p.objectTask||p.shelterRequest||p.shelter?.facilityId||s.weather.wind>=60||p.mounted||!p.active){delete p.sleepHere;if(p.objectWait?.reason==='sleep_here')delete p.objectWait;p.nextObjectChoice=s.worldTick;}
   else{p.motion.kind='sleep';p.motion.distance=0;p.action='rest';p.energy=Math.min(80,p.energy+1.5/60);p.nutrition=clamp(p.nutrition-NUTR_USE);continue;}}
  if(p.braceHere){if(s.weather.wind<60||p.objectTask||p.shelterRequest||p.shelter?.facilityId||p.mounted||!p.active){delete p.braceHere;if(p.objectWait?.reason==='brace_here')delete p.objectWait;p.nextObjectChoice=s.worldTick;}
   else{p.motion.kind='rest';p.motion.distance=0;p.action='rest';continue;}}
  // SRS v2.34: resting where it stands never hides thirst or hunger (water or 영양 under the warning line ends it)
  const vNeed=p.B<Vit.band(p).warnLo||p.nutrition<Vit.band(p).warnLo;
  if(p.species==='superbum'){if(p.energy<40&&!vNeed&&!p.objectTask&&!p.shelterRequest&&!p.shelter?.facilityId&&s.weather.wind<60)p.restSelf=true;if(p.restSelf&&(p.energy>=75||vNeed||p.objectTask||p.shelterRequest||s.weather.wind>=60))delete p.restSelf;
   if(p.restSelf){p.motion.kind='rest';p.motion.distance=0;p.action='rest';p.energy=Math.min(80,p.energy+1.5/60);p.nutrition=clamp(p.nutrition-NUTR_USE);continue;}}
  const shMotion=Sh.move(s,p,Space),motion=shMotion||Obj.move(s,p)||Obj.stroll(s,p);
  if(motion){Object.assign(p.motion,motion);if(motion.distance>0)p.energy=clamp(p.energy-1/60);}
  // Nutrition is metabolism, never a remotely supplied shelter service.
  p.nutrition=clamp(p.nutrition-NUTR_USE);
  const resting=Obj.receive(s,p,requests);
  Obj.rootRequests(s,p,requests);
  if(resting&&p.B>=40&&p.energy>=40&&p.nutrition>=40&&p.burden<40&&!weatherDamage)p.damage=clamp(p.damage-1/60);
  if(!p.objectTask&&p.action==='groom'){p.motion.kind='groom';p.actionSeconds=Math.max(0,p.actionSeconds-1);}
  if(p.species==='neolbi'&&p.action==='groom'&&p.actionSeconds===7)Motion.start(s,'PE05',{parent:'A02',ids:[p.id],session:p.id+':groom:'+s.worldTick,valid:true,visible,carrying:false});
  if(p.personalityClip&&(!Motion.active(s,p)||held===p.id||p.motion.distance>0||p.action!=='groom'&&p.personalityClip.parent==='A02'))delete p.personalityClip;
 }
 Obj.grant(requests);Obj.progress(s);
 for(const p of active){
  if(p.justDrank){delete p.justDrank;s.environment.tutorialDone=true;p.actionSeconds=0;event(s,'drink',p.name+' · 스스로 샘터에서 물을 마셨어요.',{individual:p.id});if(!p.first.drink){p.first.drink=true;p.xp=Math.min(150,p.xp+2);}discovery(s,'first-drink','샘터에서 처음 물을 마셨어요.',visible);}
  if(p.motion.water>0)p.motion.contact=p.id+':'+Math.floor(s.worldTick/3)+':water';
 }
 Social.tick(s,{visible,record:discovery,event});neighborStep(s,visible);Rec.tick(s,{Space,Social,rng,event,personality});World.lakeStep(s,event);
 return s;
}
function neighborStep(s,visible){
 const n=s.neighbor,c=s.patches.find(p=>p.id==='crevice'),m=s.patches.find(p=>p.id==='moss');
 const habitat=dist(c,m)<.32&&moisture(m)>=40&&moisture(m)<=100&&light(s,c)<=45&&c.W<5&&s.weather.wind<60;
 if(n.cooldown>0){n.cooldown--;return;}
 if(n.stage==='visiting'){
  n.visitSeconds++;n.absentSeconds=habitat?0:n.absentSeconds+1;
  if(n.visitSeconds>=180||n.absentSeconds>=30){n.stage='none';n.observed=0;n.cooldown=600;n.visitSeconds=0;n.absentSeconds=0;event(s,'neighbor','돌돌이가 바위 틈 너머로 돌아갔어요.');}
  else if(visible){discovery(s,'neighbor','작은 이웃, 돌돌이를 만났어요.',true);const r=s.patches.find(p=>p.id==='rock');if(Env.precipitation(s,'rain')===0&&s.weather.lastRainEnd>=0&&s.worldTick-s.weather.lastRainEnd<=600&&s.weather.lastRainEpoch>0&&m.rainEpoch===s.weather.lastRainEpoch&&r.rainEpoch===s.weather.lastRainEpoch&&habitat&&moisture(m)-moisture(r)>=15){n.observed=(n.observed||0)+1;if(n.observed>=20)discovery(s,'EC01','비가 그친 뒤에도 이끼에는 물기가 남아 있었어요.',true,{moss:moisture(m),rock:moisture(r),neighbor:'돌돌이'});}else n.observed=0;}else n.observed=0;
  return;
 }
 if(habitat){n.validSeconds++;if(n.validSeconds>=60)n.stage='trace';if(n.validSeconds>=120){const nook=s.individuals.some(p=>Social.ellisiiHabitat(s,p));const success=n.visits===0||rng(s,'neighbor')<(nook?.45:.3)||(n.failures||0)>=2;if(success){n.stage='visiting';n.visits++;n.validSeconds=0;n.failures=0;event(s,'neighbor','돌돌이가 촉촉한 바위 틈에서 쉬고 있어요.');}else{n.validSeconds-=60;n.failures=(n.failures||0)+1;}}}
}
function advance(s,seconds,options){for(let i=0;i<seconds;i++)step(s,options);return s;}
function pause(s,now=Date.now()){if(!s.offline){Social.invalidate(s);s.neighbor.observed=0;s.offline={at:now,mode:s.recruitment?.visitor?.open?'landscape':s.mode,processed:0};}s.savedAt=Math.max(s.savedAt,now);return s;}
function offlineStep(s){
 for(const p of s.individuals.filter(p=>p.active)){
  if(p.energy<75)p.energy=Math.min(75,p.energy+4/60);growth(p,s);
 }
 s.offline.processed++;
}
function resume(s,now=Date.now()){
 if(!s.offline)return {seconds:0,xp:0};
 const start=s.individuals.reduce((n,p)=>n+p.xp,0);const seconds=Math.max(0,Math.min(28800,Math.floor((now-s.offline.at)/1000)));
 if(s.offline.mode==='game'&&s.started)while(s.offline.processed<seconds)offlineStep(s);
 const result={seconds:s.offline.mode==='game'&&s.started?seconds:0,xp:s.individuals.reduce((n,p)=>n+p.xp,0)-start};s.offline=null;Sh.rebuild(s);s.savedAt=Math.max(s.savedAt,now);return result;
}
function validateLayout(s,positions){const next=s.patches.map(p=>({...p,...positions[p.id]})),spring={...s.spring,...positions.spring};
 if(!Number.isFinite(spring.x)||!Number.isFinite(spring.y)||!World.inside(s,spring,World.inner(s,.14,.18,.14,.16)))throw Error('샘터를 정원 안쪽에 놓아주세요.');if(World.lakeOpen(s)&&spring.x>1.2&&World.waterD(spring.x,spring.y)<1.2)throw Error('물가에서 조금 떨어진 땅에 놓아주세요.');
 for(const p of next){if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||!World.inside(s,p,World.inner(s,.12,.16,.12,.12)))throw Error('숲 가장자리 안쪽에 놓아주세요.');if(World.lakeOpen(s)&&p.x>1.2&&World.waterD(p.x,p.y)<1.2)throw Error('물가에서 조금 떨어진 땅에 놓아주세요.');if(p.id==='shelter'&&(p.x!==.23||p.y!==.22))throw Error('기본 쉼터는 옮길 수 없어요.');if(dist(p,spring)<.15)throw Error('샘터로 가는 길을 비워주세요.');}
 for(let i=0;i<next.length;i++)for(let j=i+1;j<next.length;j++)if(dist(next[i],next[j])<.135)throw Error('다른 자리와 겹쳐요. 조금 떨어뜨려 주세요.');
 const world={...s,patches:next,spring};
 for(const id of ['spring','shelter',...next.map(p=>p.id)])if(!Space.route(world,Space.socket(world,'shelter'),Space.socket(world,id)))throw Error('샘터와 쉼터로 이어지는 길을 비워주세요.');
 for(const pet of s.individuals)if(pet.active&&Space.walkable(s,pet)&&!Space.walkable(world,pet))throw Error('친구가 있는 자리를 비워주세요.');
 return next;
}
function layout(s,positions){const next=validateLayout(s,positions);Social.invalidate(s);Obj.invalidate(s);s.neighbor.observed=0;s.patches=next;if(positions.spring){s.spring.x=positions.spring.x;s.spring.y=positions.spring.y;}for(const p of s.individuals)delete p.motion;s.layoutRevision++;Obj.relayout(s);event(s,'layout','정원의 자리를 바꿨어요. 물과 생활 기록은 그대로예요.');return s;}
function relocate(s,id,point){const result=Space.placement(s,id,point,false);if(!result.ok)throw Error(result.message);Social.cancel(s,id);const p=s.individuals.find(x=>x.id===id);Obj.release(s,p,'move');Sh.release(p,s.worldTick);p.x=result.x;p.y=result.y;const f=Sh.cover(s,p);if(f)p.shelter={phase:'entering',facilityId:f.id,x:p.x,y:p.y,units:Sh.units(p),since:s.worldTick,expires:s.worldTick+10,revision:f.revision,stalled:0};p.settleUntil=s.worldTick+1;p.motion={kind:'land',path:[{x:p.x,y:p.y}],distance:0,water:0,tick:s.worldTick};event(s,'move',p.name+' · 새로운 자리를 살펴봐요.',{individual:id});return s;}
function valid(s){
 if(!s||s.schema!==1||s.app!=='ForestOfSpace'||s.rules!==RULES)throw Error('이 버전에서 읽을 수 있는 여백의 숲 백업이 아니에요.');
 const finite=(v,min=0,max=1e15)=>Number.isFinite(v)&&v>=min&&v<=max;
 World.validate(s);const wb=World.bounds(s);
 if(!finite(s.savedAt)||!finite(s.worldTick)||!Number.isInteger(s.worldTick)||!finite(s.layoutRevision)||!['game','landscape'].includes(s.mode)||typeof s.started!=='boolean')throw Error('시계 또는 모드 기록이 올바르지 않아요.');
 if(!s.weather||!['sun','cloud','rain','fog','snow'].includes(s.weather.kind)||!finite(s.weather.remaining,0,240)||!finite(s.weather.streak,1,2)||!finite(s.weather.intensity,0,100)||!finite(s.weather.wind,0,100)||!finite(s.weather.strongSeconds)||!finite(s.weather.transition,0,10)||!Number.isFinite(s.weather.lastRainEnd))throw Error('날씨 기록을 확인해 주세요.');
 if(!s.climate||['T','H','L'].some(k=>!finite(s.climate[k],0,100)))throw Error('기후 기록을 확인해 주세요.');
 if(!s.rng||['weather','behavior','neighbor'].some(k=>!finite(s.rng[k],0,4294967295)||!Number.isInteger(s.rng[k])))throw Error('난수 기록을 확인해 주세요.');
 if(!s.patches||s.patches.length!==6||new Set(s.patches.map(p=>p.id)).size!==6)throw Error('정원 구역이 누락되었어요.');
 for(const p of s.patches){const def=PATCHES.find(x=>x.id===p.id);if(!def||Object.keys(def).filter(k=>!['x','y','name'].includes(k)).some(k=>p[k]!==((p.id==='moss'&&k==='cap')?Obj.capacity(s,'moss'):def[k]))||!finite(p.S,0,p.cap)||!finite(p.W,0,p.pool)||!finite(p.O)||!finite(p.U)||!finite(p.rainTotal)||!finite(p.film,0,1))throw Error('정원 자원 기록이 올바르지 않아요.');}
 if(!s.spring||!finite(s.spring.x,.14,.86)||!finite(s.spring.y,.18,.84)||!finite(s.spring.water,0,Obj.capacity(s,'spring')))throw Error('샘터 기록을 확인해 주세요.');
 validateLayout(s,{});
 if(!Array.isArray(s.individuals)||s.individuals.length<1||s.individuals.length>50||s.individuals.filter(p=>p.active).length>50||new Set(s.individuals.map(p=>p.id)).size!==s.individuals.length)throw Error('친구의 식별 기록이 올바르지 않아요.');
 for(const p of s.individuals){if(typeof p.id!=='string'||!/^[-A-Za-z0-9_]{1,100}$/.test(p.id)||typeof p.name!=='string'||p.name.length>40||!Social.supported.includes(p.species)||typeof p.active!=='boolean'||typeof p.mounted!=='boolean'||typeof p.drinkCycle!=='boolean'||!['wander','drink','rest','groom','feed','play'].includes(p.action)||!finite(p.x,wb.x0,wb.x1)||!finite(p.y,wb.y0,wb.y1)||!finite(p.actionSeconds,-10,1000)||!finite(p.wetSeconds)||!p.first)throw Error('친구 기록을 확인해 주세요.');
  if(p.target!==null&&p.target!=='spring'&&!PATCHES.some(z=>z.id===p.target)&&!(Obj.isPile(p.target)&&Obj.patch(s,p.target)))throw Error('이동 목적지가 올바르지 않아요.');
  for(const k of ['B','energy','mood','nutrition','damage','burden'])if(!finite(p[k],0,100))throw Error('생활 상태가 범위를 벗어났어요.');
  if(p.next_personality_tick!==undefined&&!finite(p.next_personality_tick))throw Error('성격 연출 대기 기록을 확인해 주세요.');
  if(!finite(p.Q,0,20)||!finite(p.V,0,50)||!finite(p.xp,0,150)||!finite(p.growthSeconds,0,360)||!p.personality||['a','c','e'].some(k=>![-1,0,1].includes(p.personality[k])))throw Error('성장 또는 성격 기록을 확인해 주세요.');
 }
 Obj.validate(s);W.validate(s);Vit.validate(s);Skills.validate(s);Social.validate(s);Sh.validate(s);Env.validate(s);Rec.validate(s);
 if(!s.settings||!['auto','day','night'].includes(s.settings.theme)||['reducedMotion','showName','showLevel','showState','showSpeech'].some(k=>typeof s.settings[k]!=='boolean')||s.settings.showFrame!==undefined&&typeof s.settings.showFrame!=='boolean')throw Error('설정 기록을 확인해 주세요.');
 if(!s.settings.audio||['master','music','environment','effects'].some(k=>!finite(s.settings.audio[k],0,1)))throw Error('소리 설정을 확인해 주세요.');
 if(!s.ledger||['rain','spring','evaporation','outflow','physiology'].some(k=>!finite(s.ledger[k]))||s.ledger.lake!=null&&!finite(s.ledger.lake)||s.ledger.admin!=null&&!Number.isFinite(s.ledger.admin))throw Error('물 원장이 올바르지 않아요.');
 if(!Array.isArray(s.events)||s.events.length>256||s.events.some(e=>typeof e.text!=='string'||!finite(e.tick))||!s.discoveries||Object.values(s.discoveries).some(d=>typeof d.text!=='string'||!finite(d.tick)))throw Error('관찰 기록이 올바르지 않아요.');
 if(!s.neighbor||!['none','trace','visiting'].includes(s.neighbor.stage)||['validSeconds','visitSeconds','absentSeconds','cooldown','visits'].some(k=>!finite(s.neighbor[k])))throw Error('작은 이웃 기록을 확인해 주세요.');
 if(s.offline&&(!finite(s.offline.at)||!finite(s.offline.processed,0,28800)||!['game','landscape'].includes(s.offline.mode)))throw Error('휴식 기록을 확인해 주세요.');
 return s;
}
function migrate(old,now=Date.now()){
 if(old.app==='ForestOfSpace'){const s=clone(old);if(![RULES,'SRS-2.5-stage1','SRS-2.8-stage2','SRS-2.9-stage2','SRS-2.16-weather','SRS-2.17-shelter','SRS-2.18-environment'].includes(s.rules))throw Error('지원하지 않는 규칙 버전이에요. 원본을 유지해요.');Obj.migrate(s);if(s.rules==='SRS-2.18-environment')s.rules=RULES;Env.init(Rec.init(s));if(s.rules!==RULES)Sh.rebuild(s);if(s.rules!==RULES&&['SRS-2.5-stage1','SRS-2.8-stage2','SRS-2.9-stage2','SRS-2.16-weather','SRS-2.17-shelter'].includes(s.rules)){if(['SRS-2.9-stage2','SRS-2.16-weather','SRS-2.17-shelter'].includes(s.rules))s.rules=RULES;W.init(s);}if(s.rules==='SRS-2.5-stage1'){s.rules=RULES;s.version=VERSION;s.settings.audio={master:.65,music:.35,environment:.45,effects:.55};for(const p of s.patches)p.film=0;}if(s.rules==='SRS-2.8-stage2'){s.rules=RULES;Social.init(s);}if(!s.social&&old.rules==='SRS-2.5-stage1')Social.init(s);s.version=VERSION;for(const p of s.individuals){delete p.personalityClip;delete p.motion;if(p.species==='neolbi'){p.canopy=false;p.canopyProgress=0;}delete p.canopyClosing;if(p.active&&!p.mounted&&!Space.walkable(s,p,p.id)&&!Space.onRock?.(s,p)&&!['rock','crevice'].includes(p.objectTask?.object)){/* 1.0: a friend on top of the sun rock, or climbing onto it / into the crevice, stays there (it walks out of a stone by itself) */const q=Space.placement(s,p.id,p);if(!q.ok)throw Error('기존 위치를 안전하게 복구하지 못했어요. 원본 기록을 유지해요.');p.x=q.x;p.y=q.y;}}World.init(s);Obj.litterInit(s);valid(s);Social.invalidate(s);s.neighbor.observed=0;for(const p of s.individuals){if(p.name==='새싹이'&&!p.customName)p.name='리들리';if(p.species==='neolbi'&&p.name==='넓이'&&!p.customName)p.name='엘레판';if(p.species==='bonbon'&&p.name==='봉봉'&&!p.customName)p.name='엘리시';if(p.species==='bosong'&&p.name==='보송'&&!p.customName)p.name='베이치';if(p.species==='jureong'&&p.name==='주렁'&&!p.customName)p.name='코로나';}if(s.recruitment?.visitor?.pet?.species==='bosong'&&s.recruitment.visitor.pet.name==='보송')s.recruitment.visitor.pet.name='베이치';if(s.recruitment?.visitor?.pet?.species==='jureong'&&s.recruitment.visitor.pet.name==='주렁')s.recruitment.visitor.pet.name='코로나';return s;}
 if(old.schema!==1||old.app!=='RidleyDeskMobile'||!old.pets?.deully||!Number.isFinite(old.savedAt))throw Error('지원하지 않는 이전 기록이에요. 원본은 바꾸지 않았어요.');
 const s=create(now,seedInt(old.deviceId||'old-ridley')),p=s.individuals[0],o=old.pets.deully;
 for(const [a,b]of [['B','water'],['energy','energy'],['mood','mood'],['nutrition','nutrition'],['damage','damage']]){if(!Number.isFinite(o[b]))throw Error('이전 생활 기록을 읽을 수 없어요.');p[a]=clamp(o[b]);}
 p.id=o.id||old.deviceId+'-deully';p.name=typeof o.name==='string'?o.name.slice(0,40):'리들리';p.personality=personality(p.id);p.Q=10;p.action='wander';s.legacy=clone(old);
 // Old XP semantics are incompatible: preserve every original field, do not invent growth history.
 event(s,'migration','이전 수분·체력·기분·영양을 이어왔어요. 구버전 성장·다크리·업무 기록은 원본 보관 중이에요.');return valid(s);
}

function welcomeNeolbi(s){
 if(s.individuals.some(p=>p.species==='neolbi'))return false;
 const id='neolbi-welcome-'+s.deviceId;
 const p={...clone(s.individuals[0]),id,species:'neolbi',name:'엘레판',B:45,Q:0,V:0,energy:70,mood:70,nutrition:50,vit:2,damage:0,burden:0,wetSeconds:0,x:.5,y:.55,xp:0,growthSeconds:0,mounted:false,active:false,action:'wander',actionSeconds:0,target:null,drinkCycle:false,first:{},personality:personality(id),sources:{rain:0,other:0,unknown:0}};
 for(const k of ['motion','canopy','canopyProgress','canopyClosing','socialUntil','socialRole','customName','objectTask','objectWait','objectNeeds','objectContact','carriedLeaf','rootLitter','nextObjectChoice','lastObject','objectDebug','objectArrived','skill','skillRest','skillDay','skillHold','guideTo'])delete p[k];
 s.individuals.push(p);for(const k of ['gustExposure','braceSeconds','windCalmSeconds','wet85Seconds','wetFilm'])p[k]=0;p.wetRecovery=p.leafRecovery=false;delete p.weatherExposure;delete p.protectedBy;event(s,'welcome','엘레판이 숲에 찾아왔어요. 친구 목록에서 정원에 들일 수 있어요.',{individual:id,arrivalWater:35});return true;
}

function transaction(s,change,write){const next=clone(s);change(next);valid(next);if(!write(next))throw Error('저장하지 못했어요. 변경은 적용되지 않았어요.');return next;}
return {World,Creatures,Litter:typeof module==='object'?require('./litter.js'):globalThis.ForestLitter,Objects:Obj,Environment:Env,Recruitment:Rec,Shelter:Sh,welcomeNeolbi,VERSION,RULES,PATCHES,SPECIES,LEVELS,create,step,advance,pause,resume,offlineStep,level,health,moisture,totalWater,light,layout,relocate,Space,Social,Weather:W,roster:Social.roster,validateLayout,valid,migrate,transaction,clone,personality,event,dist};
});
