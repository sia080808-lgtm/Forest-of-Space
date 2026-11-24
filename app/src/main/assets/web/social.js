(function(root,factory){const api=factory(typeof module==='object'?require('./spatial.js'):root.ForestSpace);if(typeof module==='object')module.exports=api;else root.ForestSocial=api;})(globalThis,function(Space){
'use strict';
const World=typeof module==='object'?require('./world.js'):globalThis.ForestWorld;
const josa=(w,a,b)=>{const c=String(w).charCodeAt(String(w).length-1)-0xac00;return w+(c>=0&&c<11172&&c%28?a:b);};
const Neolbi=typeof module==='object'?require('./neolbi.js'):globalThis.ForestNeolbi;
const Motion=typeof module==='object'?require('./neolbi-motion.js'):globalThis.ForestNeolbiMotion;
const W=typeof module==='object'?require('./weather-care.js'):globalThis.ForestWeatherCare;
const supported=['ridley','bonbon','neolbi','bosong','jureong','duri','superbum'],R=.13;
function init(s){W.init(s);s.social??={version:1,serial:0,sessions:[],cooldowns:{},observations:{}};for(const p of s.individuals)p.sources??={rain:0,other:0,unknown:p.V};return s;}
function credit(p,n,source){const amount=Math.max(0,Math.min(n,SH(p).nest-p.V));p.sources[source]+=amount;p.V+=amount;return amount;}
function debit(p,n){const amount=Math.max(0,Math.min(n,p.V)),parts={};for(const k of ['rain','other','unknown']){parts[k]=p.V>0?p.sources[k]*amount/p.V:0;p.sources[k]=Math.max(0,p.sources[k]-parts[k]);}p.V=Math.max(0,p.V-amount);return {amount,parts};}
// Ground patches keep all the rain that falls on them (Ellisii, legacy 'bonbon', no longer collects).
function rain(s,patch,budget,held){return budget;}
// 슈퍼범's nest frond is a bowl open to the sky: the rain that falls on it (its own catchment, like the snow that settles
// on a friend's head) stays in the nest instead of running off. It is real rain, entered in the rain ledger once; at most
// .1 per second and NEST in total, and not while held, mounted or inside a shelter roof.
const NEST=40,CATCH=10;
// 1.1.3: 슈퍼범's nest size and how much it shares at once grow with its level (skills.js LEVEL.share; Lv1 40 / 10)
const SH=d=>(typeof module==='object'?require('./skills.js'):globalThis.ForestSkills)?.share?.(d)||{total:10,nest:NEST};
function collect(s,held,precipitation,area){for(const p of s.individuals){if(p.species!=='superbum'||!p.active||p.mounted||p.id===held||p.shelter?.facilityId||!(precipitation>0)||p.V>=SH(p).nest)continue;
 const n=credit(p,Math.min(.1,12/60*precipitation*area(p)*CATCH),'rain');p.harvestTick=(p.harvestTick||0)+n;s.ledger.rain+=n;}}
// 0.6.36: the nest water does not stay forever (user: "슈퍼범 머리에 고인 물은 마르나?" -> "증발 + 스스로 마시기").
// Evaporation: like an open water surface at the spring's rate, (0.2 + 0.6 L/100 + 0.4 wind/100)/60 per second, only while it is not raining or foggy and the friend is not under a shelter roof; booked to ledger.evaporation.
// Own use: a thirsty 슈퍼범 (body water below 45) draws its own nest water into its body, up to 3/min, until body water 55;
// the water only moves between V and B, so the total stays the same.
const NEST_EVAP=1,NEST_SIP=.05,SIP_BELOW=45,SIP_TO=55;
function nest(s,held,precipitation){const wet=precipitation>0||['rain','fog','snow'].includes(s.weather.kind);
 for(const p of s.individuals){if(p.species!=='superbum'||!p.active||!(p.V>0))continue;
  if(p.B<SIP_BELOW&&p.id!==held){const n=debit(p,Math.min(NEST_SIP,SIP_TO-p.B)).amount;p.B+=n;}
  if(!wet&&!p.shelter?.facilityId&&p.V>0){const r=(.2+.6*(s.climate.L||0)/100+.4*(s.weather.wind||0)/100)/60*NEST_EVAP,n=debit(p,r).amount;s.ledger.evaporation+=n;}}}
// Ellisii shelters small visitors only when a real compatible microhabitat exists.
function ellisiiHabitat(s,p){if(!p||p.species!=='bonbon'||!p.active||p.mounted||p.B<35||p.energy<40||p.burden>=40||p.damage>=30)return false;const moss=s.patches.find(x=>x.id==='moss'),c=s.patches.find(x=>x.id==='crevice');if(!moss||!c)return false;const moisture=100*moss.S/moss.cap;const E=typeof module==='object'?require('./environment.js'):globalThis.ForestEnvironment;return moisture>=40&&E.precipitation(s,'rain')<.6&&c.W<5&&s.climate.H>=40&&s.climate.H<=85&&s.weather.wind<60&&Space.distance(p,c)<.20;}
// 1.0: 물 나눔 thresholds follow the SRS v2.34 수분 band: a friend below its warning line (Lv1 40) is thirsty, and the
// 슈퍼범 tops it up to the middle of the band (50) instead of the old 35 / 65
const Vit=typeof module==='object'?require('./vitals.js'):globalThis.ForestVitals;
const thirsty=p=>p.B<Vit.band(p).warnLo,full=p=>Vit.band(p).mid;
function safe(p,s){return W.healthy(p)&&s.weather.wind<60;}
function shades(s){return s.individuals.filter(p=>p.species==='neolbi'&&W.live(s,p));}
function shadeAt(p,q){return Neolbi.covers(p,q);}
function shadeFactor(s,q){const fixed=s.patches.find(p=>p.id==='shade');let count=fixed&&Math.hypot(fixed.x-q.x,fixed.y-q.y)<.16?1:0;count+=shades(s).filter(p=>shadeAt(p,q)).length;return Math.min(.7,1-Math.pow(.65,count));}
function unionArea(ps){let count=0;for(let y=.15;y<=.91;y+=.0125)for(let x=.08;x<=.92;x+=.0125)if(ps.some(p=>shadeAt(p,{x,y})))count++;return count;}
function expanded(ps){return ps.length>=2&&unionArea(ps)>Math.max(...ps.map(p=>unionArea([p])))+2;}
function available(s,p){return p.id!==s.world?.lake?.boat?.rider&&!s.social.sessions.some(a=>a.ids.includes(p.id));}
function stop(s,session,reason){s.social.sessions=s.social.sessions.filter(x=>x!==session);s.social.cooldowns[session.key]=s.worldTick+120;for(const id of session.ids){const p=s.individuals.find(x=>x.id===id);if(p){delete p.personalityClip;p.socialUntil=s.worldTick+15;p.canopy=false;delete p.socialRole;delete p.protectedBy;if(reason==='unsafe'||reason==='interrupted'||reason==='layout'){p.canopyProgress=0;p.action='rest';p.target='shelter';}}}session.reason=reason;}
function cancel(s,id){(typeof module==='object'?require('./friendship.js'):globalThis.ForestFriendship)?.cancel(s,id);init(s);for(const a of [...s.social.sessions])if(a.ids.includes(id))stop(s,a,'interrupted');delete s.social.observations.EC03;const p=s.individuals.find(x=>x.id===id);if(p){delete p.personalityClip;if(p.species==='neolbi'){p.canopy=false;p.canopyProgress=0;}delete p.canopyClosing;}}
function invalidate(s){(typeof module==='object'?require('./friendship.js'):globalThis.ForestFriendship)?.cancel(s);init(s);for(const a of [...s.social.sessions])stop(s,a,'layout');s.social.observations={};for(const p of s.individuals){delete p.personalityClip;if(p.species==='neolbi'){p.canopy=false;p.canopyProgress=0;}delete p.canopyClosing;}}
function bedtime(s,p){
 const V=typeof module==='object'?require('./vitals.js'):globalThis.ForestVitals;
 return V.sleepTime(s,p);
}
function canopyReason(s,p){
 const a=s.social?.sessions.find(a=>a.type==='CANOPY'&&a.ids.includes(p.id));
 if(!a)return '';
 if(a.ids[0]===p.id)return s.weather.kind==='rain'?'큰 잎을 펼쳐 친구의 비를 막아 주고 있어요':'큰 잎으로 친구에게 그늘을 내어 주고 있어요';
 if(a.phase==='rest')return '엘레판의 잎 아래에서 쉬고 있어요';
 if(a.phase==='exit')return '엘레판의 잎 아래에서 나오고 있어요';
 return '비와 바람을 피할 잎 아래 자리로 가고 있어요';
}
function start(s,type,ps){const ids=ps.map(p=>p.id),key=type+':'+[...ids].sort().join(':');if((s.social.cooldowns[key]||0)>s.worldTick||ps.some(p=>(p.socialUntil||0)>s.worldTick))return;
 if(s.objects){const O=typeof module==='object'?require('./objects.js'):globalThis.ForestObjects;for(const p of ps){
  O.release(s,p,'replace');
  if(type==='CANOPY'||type==='A12'||p.stroll?.shelf){delete p.stroll;delete p.walkPlan;}
 }}
 const a={id:'social-'+(++s.social.serial),type,ids,key,phase:'signal',elapsed:0,started:s.worldTick,layout:s.layoutRevision,steps:0,total:0,rain:0,lastTick:-1};s.social.sessions.push(a);return a;}
function prepare(s,held){init(s);const participants=new Set();for(const p of s.individuals){p.canopy=false;delete p.protectedBy;}
 for(const a of [...s.social.sessions]){const ps=a.ids.map(id=>s.individuals.find(p=>p.id===id));const canopy=a.type==='CANOPY';let okay=ps.every(p=>p&&p.active&&!p.mounted&&p.id!==held&&!p.shelter?.facilityId&&p.burden<40&&!p.wetRecovery&&!p.leafRecovery)&&a.layout===s.layoutRevision;
  if(okay&&(canopy||a.type==='A12')&&ps.some(p=>bedtime(s,p))){
   stop(s,a,'bedtime');
   for(const p of ps){delete p.stroll;delete p.walkPlan;p.action='wander';p.actionSeconds=0;p.target=null;p.nextObjectChoice=s.worldTick;}
   continue;
  }
  if(canopy){const h=ps[0];okay=okay&&ps.every(p=>W.leafFit(s,p))&&s.weather.wind<W.limit(h)&&(s.weather.wind<W.limit(h)-10||a.phase==='rest'&&h.braceSeconds<10);if(okay&&s.weather.wind>=W.limit(h)-10)h.braceSeconds=Math.min(10,h.braceSeconds+1);}
  else okay=okay&&s.weather.wind<60;
  if(!okay){stop(s,a,'unsafe');continue;}
  if(a.type==='A04'){const[d,r]=ps;if(d.species!=='superbum'){stop(s,a,'retired');continue;}if(!safe(d,s)||(a.phase!=='response'&&(d.V<=10||r.B>=full(r)||s.worldTick-a.started>30))){stop(s,a,'finished');continue;}}
  else if(!canopy&&ps.some(p=>!safe(p,s))){stop(s,a,'unsafe');continue;}
  ps.forEach(p=>participants.add(p.id));if(a.type==='A12')ps.slice(0,2).forEach(p=>p.canopy=true);if(canopy){ps[0].canopy=true;if(a.phase==='rest')ps[1].protectedBy=ps[0].id;}
 }
 const free=s.individuals.filter(p=>(!s.objects||!p.objectTask||p.objectTask.free)&&p.id!==held&&!p.shelter?.facilityId&&available(s,p));
 // 물 나눔 (A04): 슈퍼범 with more than 10 in its nest brings water to the thirstiest friend (below its 수분 warning line) it can reach.
 // Old sessions with an Ellisii donor stay retired.
 for(const d of free.filter(p=>p.species==='superbum'&&safe(p,s)&&p.V>10).sort((a,b)=>a.id.localeCompare(b.id))){if(!available(s,d))continue;const r=s.individuals.filter(p=>p.id!==held&&!p.shelter?.facilityId&&(!p.objectTask||p.objectTask.free||p.objectTask.reason==='water')&&p.id!==d.id&&p.active&&!p.mounted&&thirsty(p)&&p.burden<40&&available(s,p)).sort((a,b)=>a.B-b.B||a.id.localeCompare(b.id))[0];if(r&&Space.route(s,d,r)){const a=start(s,'A04',[d,r]);if(a)a.ids.forEach(id=>participants.add(id));}}
 const shadeFriends=free.filter(p=>!bedtime(s,p)&&!p.stroll?.lake&&!p.stroll?.puddle&&!p.stroll?.shelf);
 const ns=shadeFriends.filter(p=>p.species==='neolbi'&&(safe(p,s)||W.leafFit(s,p)&&s.weather.wind<60)&&available(s,p)).sort((a,b)=>a.id.localeCompare(b.id));
 if(ns.length>=2){const pair=ns.slice(0,2),d=Space.distance(...pair);if(d>.055&&d<R*1.8&&expanded(pair)){const r=shadeFriends.filter(p=>!pair.includes(p)&&safe(p,s)&&available(s,p)).sort((a,b)=>Space.distance(a,pair[0])-Space.distance(b,pair[0]))[0];if(r){const seat=restPoint(s,pair,r);const a=seat&&start(s,'A12',[...pair,r]);if(a){a.seat=seat;a.ids.forEach(id=>participants.add(id));pair.forEach(p=>p.canopy=true);}}}}
 if(['rain','snow'].includes(s.weather.kind)||s.climate.L>=70||s.weather.wind>=50){for(const h of ns.filter(p=>available(s,p)&&!p.canopyClosing)){
  for(const r of shadeFriends.filter(p=>p.id!==h.id&&available(s,p)&&W.leafFit(s,p)&&s.weather.wind<60&&Space.distance(p,h)<.35).sort((a,b)=>Space.distance(a,h)-Space.distance(b,h)||a.id.localeCompare(b.id))){const seat=restPoint(s,[h],r);if(!seat)continue;const wet=s.patches.some(z=>Space.distance(z,seat)<.1&&(z.S/z.cap>=.4||z.W>=1));if(wet)continue;const direct=Space.route(s,r,Space.socket(s,'shelter',r.id));const route=Space.route(s,r,seat);if(!route)continue;const length=path=>path.reduce((v,q,i)=>v+Space.distance(i?path[i-1]:r,q),0);if(direct&&length(route)>length(direct)+.12)continue;const a=start(s,'CANOPY',[h,r]);if(a){a.seat=seat;a.ids.forEach(id=>participants.add(id));h.canopy=true;break;}}
 }}
 for(const p of s.individuals.filter(p=>p.species==='neolbi'))p.canopyProgress=Math.max(0,Math.min(1,(p.canopyProgress||0)+(p.canopy?1:-1)));
 return participants;
}
function move(s,p,target){const from={x:p.x,y:p.y};const m=Space.travel(s,p,target);if(s.individuals.some(q=>q.active&&q.id!==p.id&&Space.distance(q,p)<.4*(Space.diameter(q)+Space.diameter(p)))){p.x=from.x;p.y=from.y;return false;}Object.assign(p.motion,m);return m.arrived;}
function approachStep(s,p,q,a){
 if(a.deadline===undefined){const path=Space.route(s,p,q)||[],points=[p,...path];let length=0;for(let i=1;i<points.length;i++)length+=Space.distance(points[i-1],points[i]);a.deadline=a.started+Math.max(10,Math.min(30,Math.ceil(length/Space.gait(p,s).speed)+5));}
 if(s.worldTick>a.deadline){stop(s,a,'deadline');return false;}
 const arrived=move(s,p,q);a.stalled=!arrived&&p.motion.distance===0?(a.stalled||0)+1:0;
 if(a.stalled>=3){a.replans=(a.replans||0)+1;a.stalled=0;if(a.replans>1)stop(s,a,'blocked');}
 return arrived;
}
function receivePoint(s,d,r){const candidates=[];for(let k=0;k<12;k++){const a=k*Math.PI/6,q={x:r.x+Math.cos(a)*.075,y:r.y+Math.sin(a)*.075/Space.ASPECT};if(Space.walkable(s,q)&&Space.route(s,d,q)&&!s.individuals.some(p=>p.active&&p.id!==d.id&&Space.distance(p,q)<.4*(Space.diameter(p)+Space.diameter(d))))candidates.push(q);}return candidates.sort((a,b)=>Space.distance(d,a)-Space.distance(d,b))[0]||null;}
function restPoint(s,ns,r){const points=[];for(const h of ns){const g=Neolbi.geometry(h);for(const [dx,dy]of [[-.4,-.9],[-.4,-.7],[-.2,-.5],[-.4,-.3],[0,0],[0,.35],[-.15,.35],[.15,.35],[0,.65]])/* 0.6.30: deepest seats under the open leaf first (closer to 엘레판, under the leaf rather than in front of its tip) */points.push({x:g.cx+dx*g.rx,y:g.cy+dy*g.ry});}
 return points.find(q=>ns.some(h=>Neolbi.canFit(h,q,r))&&Space.walkable(s,q)&&!s.individuals.some(p=>p.active&&p.id!==r.id&&Space.distance(p,q)<.4*(Space.diameter(p)+Space.diameter(r)))&&Space.route(s,r,q));}
function seat(s,r){const a=s.social.sessions.find(a=>(a.type==='CANOPY'&&a.ids[1]===r.id||a.type==='A12'&&a.ids[2]===r.id));return a?.seat||null;}
function canopyTick(s,a,ps,visible,event){const[h,r]=ps;if(!ps.every(p=>W.leafFit(s,p))||s.weather.wind>=W.limit(h)||s.weather.wind>=W.limit(h)-10&&h.braceSeconds>=10){stop(s,a,'unsafe');return;}a.elapsed++;h.canopy=true;h.motion.kind=s.weather.kind==='rain'?'umbrella':'shade';r.motion.kind='idle';h.socialRole=r.socialRole='CANOPY';
 if(a.phase==='signal'){a.phase='approach';return;}
 if(!a.seat||!Neolbi.canFit(h,a.seat,r)){stop(s,a,'unsafe');return;}
 if(a.phase==='approach'){if(approachStep(s,r,a.seat,a)){a.phase='rest';a.elapsed=0;event(s,'protect',josa(h.name,'이','가')+' 잎 아래 자리를 내어줬어요.',{individual:h.id,session:a.id});}return;}
 if(a.phase==='exit'){const g=Neolbi.geometry(h),q={x:r.x,y:Math.min(.90,g.cy+g.ry+.04)};if(move(s,r,q)||++a.exitSeconds>=3)stop(s,a,'complete');return;}
 if(!Neolbi.canFit(h,r,r)){stop(s,a,'unsafe');return;}
 r.motion.kind='rest';r.protectedBy=h.id;if(r.energy<75)r.energy=Math.min(75,r.energy+1.5/60);a.steps=Math.min(20,a.steps+1);
 a.clearSeconds=s.weather.kind!=='rain'&&s.climate.L<65&&s.weather.wind<45?(a.clearSeconds||0)+1:0;
 if(a.clearSeconds>=20){a.phase='exit';a.exitSeconds=0;}
}
function tick(s,{visible,record,event}){for(const a of [...s.social.sessions]){if(a.processedTick===s.worldTick)continue;a.processedTick=s.worldTick;const ps=a.ids.map(id=>s.individuals.find(p=>p.id===id));if(a.type==='CANOPY'){canopyTick(s,a,ps,visible,event);continue;}if(ps.some(p=>!p||!p.active||p.mounted||p.burden>=40)||s.weather.wind>=60||!safe(ps[0],s)||(a.type==='A12'&&ps.some(p=>!safe(p,s)))){stop(s,a,'unsafe');continue;}a.elapsed++;ps.forEach(p=>{p.socialRole=a.type;p.motion.kind='idle';});if(a.phase==='signal'){a.phase='approach';continue;}
 if(a.type==='A04'){const[d,r]=ps;if(a.phase==='approach'){const q=receivePoint(s,d,r);if(!q||s.worldTick-a.started>30){stop(s,a,'no-path');continue;}if(approachStep(s,d,q,a)){a.phase='accept';a.elapsed=0;}continue;}
 if(a.phase==='accept'){a.phase='transfer';continue;}
 if(a.phase==='transfer'){if(Space.distance(d,r)>.12){stop(s,a,'separated');continue;}if(a.lastTick===s.worldTick)continue;a.lastTick=s.worldTick;const before={V:d.V,B:r.B,sources:{...d.sources}};const {amount,parts}=debit(d,Math.min(2,d.V-10,full(r)-r.B,SH(d).total-a.total));r.B+=amount;a.steps++;a.total+=amount;a.rain+=parts.rain;d.motion.kind='share';r.motion.kind='receive';d.motion.transfer=amount;r.motion.received=amount;d.motion.recipient=r.id;
 if(amount>0){event(s,'transfer',josa(d.name,'이','가')+' '+r.name+'에게 물을 나눠줬어요.',{session:a.id,step:a.steps,donor:d.id,recipient:r.id,amount,sources:parts,before,after:{V:d.V,B:r.B,sources:{...d.sources}},parent:a.id});if(parts.rain>0&&visible)record(s,'EC02',josa(d.name,'이','가')+' 비에서 모은 물을 친구에게 나눠줬어요.',true,{session:a.id,participants:a.ids,amount,rain:parts.rain});}
 if(a.steps>=Math.ceil(SH(d).total/2)||a.total>=SH(d).total-1e-9||r.B>=full(r)||d.V<=10){a.phase='response';a.elapsed=0;if(ps.some(p=>p.species==='neolbi'))Motion.start(s,'PE04',{parent:'A04',ids:a.ids,session:a.id,valid:true,visible,amount:a.total});}continue;}
 
 if(a.phase==='response'&&a.elapsed>=2)stop(s,a,'complete');
 }else {const ns=ps.slice(0,2),r=ps[2];ns.forEach(p=>{p.canopy=true;p.motion.kind='shade';});if(!expanded(ns)){stop(s,a,'no-expansion');continue;}
 const q=a.seat||restPoint(s,ns,r);if(!q){stop(s,a,'no-seat');continue;}
 if(a.phase==='approach'){if(approachStep(s,r,q,a)){a.phase='rest';a.elapsed=0;}else if(s.worldTick-a.started>30)stop(s,a,'no-path');continue;}
 if(a.phase==='rest'){if(!ns.some(p=>shadeAt(p,r))){stop(s,a,'left-shade');continue;}r.motion.kind='rest';r.energy=Math.min(75,r.energy+1.5/60);a.steps++;if(visible)a.observed=(a.observed||0)+1;else a.observed=0;if(a.observed>=20)record(s,'EC03','엘레판 둘이 넓힌 그늘에서 친구가 편안히 쉬었어요.',true,{participants:a.ids,area:unionArea(ns),individualArea:Math.max(...ns.map(p=>unionArea([p]))),restSeconds:a.observed});if(a.steps>=20)stop(s,a,'complete');}
 }}
 const keys=Object.keys(s.social.cooldowns);for(const k of keys)if(s.social.cooldowns[k]<s.worldTick-120)delete s.social.cooldowns[k];}
function roster(s,id,active){init(s);const p=s.individuals.find(x=>x.id===id);if(!p)throw Error('친구를 찾지 못했어요.');if(p.active===active)return;if(active){if(s.individuals.filter(x=>x.active).length>=50)throw Error('정원에는 쉰 친구까지 함께해요.');p.active=true;const candidates=[p];for(let y=.3;y<.85;y+=.08)for(let x=.13;x<.88;x+=.08)candidates.push({x,y});const q=candidates.map(q=>Space.placement(s,id,q,false)).find(q=>q.ok);if(!q){p.active=false;throw Error('친구가 머물 자리를 비워주세요.');}p.x=q.x;p.y=q.y;}else {if(s.individuals.filter(x=>x.active).length<=1)throw Error('정원에 한 친구는 남겨주세요.');cancel(s,id);if(s.objects)(typeof module==='object'?require('./objects.js'):globalThis.ForestObjects).release(s,p,'inactive');p.active=false;}delete p.motion;}
function validate(s){
 const finite=(v,min=0,max=1e15)=>Number.isFinite(v)&&v>=min&&v<=max;
 const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
 const fail=()=>{throw Error('교감·물 출처 기록을 확인해 주세요.');};
 const v=s.social;
 if(!object(v)||v.version!==1||!Number.isSafeInteger(v.serial)||v.serial<0||!Array.isArray(v.sessions)||v.sessions.length>2||!object(v.cooldowns)||!object(v.observations)||Object.keys(v.cooldowns).length>100||Object.values(v.cooldowns).some(t=>!finite(t)))fail();
 const used=new Set(),sessionIds=new Set();
 for(const a of v.sessions){
  if(!object(a)||!['A04','A12','CANOPY'].includes(a.type)||!Array.isArray(a.ids)||a.ids.length!==(a.type==='A12'?3:2)||new Set(a.ids).size!==a.ids.length||a.ids.some(id=>used.has(id)||!s.individuals.some(p=>p.id===id&&p.active&&!p.mounted)))fail();
  const phases=a.type==='CANOPY'?['signal','approach','rest','exit']:a.type==='A04'?['signal','approach','accept','transfer','response']:['signal','approach','rest'];
  if(!phases.includes(a.phase)||typeof a.id!=='string'||!/^social-\d+$/.test(a.id)||Number(a.id.slice(7))>v.serial||sessionIds.has(a.id)||a.key!==a.type+':'+[...a.ids].sort().join(':')||a.layout!==s.layoutRevision)fail();
  const ps=a.ids.map(id=>s.individuals.find(p=>p.id===id));
  if(a.type==='A04'?!['bonbon','superbum'].includes(ps[0].species):a.type==='CANOPY'?ps[0].species!=='neolbi':ps.slice(0,2).some(p=>p.species!=='neolbi'))fail();if(a.seat&&(!World.inside(s,a.seat,World.bounds(s))))fail();
  for(const k of ['elapsed','started','steps','total','rain'])if(!finite(a[k]))fail();
  if(a.started>s.worldTick||!Number.isInteger(a.steps)||a.steps>(a.type==='A04'?5:20)||a.total>10||a.rain>a.total||!finite(a.lastTick,-1,s.worldTick)||(a.processedTick!==undefined&&!finite(a.processedTick,0,s.worldTick))||(a.observed!==undefined&&!finite(a.observed,0,20)))fail();
  a.ids.forEach(id=>used.add(id));sessionIds.add(a.id);
 }
 for(const p of s.individuals){
  if((p.canopyProgress!==undefined&&!finite(p.canopyProgress,0,1))||(p.canopyClosing!==undefined&&typeof p.canopyClosing!=='boolean')||(p.canopy!==undefined&&typeof p.canopy!=='boolean'))fail();
  if(!object(p.sources)||Object.keys(p.sources).length!==3||['rain','other','unknown'].some(k=>!finite(p.sources[k],0,50))||Math.abs(p.sources.rain+p.sources.other+p.sources.unknown-p.V)>1e-7||(p.socialUntil!==undefined&&!finite(p.socialUntil)))fail();
 }
}
return {NEST,nest,NEST_EVAP,NEST_SIP,collect,init,canopyReason,credit,debit,rain,ellisiiHabitat,prepare,tick,cancel,invalidate,roster,validate,shadeFactor,shades,expanded,unionArea,shadeAt,seat,restPoint,supported,R};
});
