(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestShelter=api;})(globalThis,function(){
'use strict';
const World=typeof module==='object'?require('./world.js'):globalThis.ForestWorld;
const PROFILES={"ridley":[[-16.5,-23],[-15.5,-30.5],[-15,-31.5],[-14.5,-32],[-8.7,-35.5],[5,-35.5],[8.5,-33.5],[14.3,-30],[14.8,-29.5],[15.3,-28.5],[16.3,-21],[16.3,-20],[15.3,-3.5],[15,-3],[14.5,-2.5],[8.8,2.5],[8,3],[5.3,3],[-8.2,1],[-9,0.5],[-14.7,-4.5],[-15.2,-5],[-15.5,-5.5],[-16.5,-22]],"neolbi":[[-31.7,-31],[-31.5,-32.5],[-30,-35.5],[-29.2,-36.5],[-26.7,-39],[-23.7,-41],[-22.7,-41.5],[-21.5,-42],[-1.2,-49.5],[0.5,-50],[2.5,-50],[9.5,-47.5],[10.8,-47],[13,-45.5],[15.5,-43],[24,-33],[25.3,-31.5],[26.5,-29.5],[27,-28.5],[27.8,-26.5],[28,-25.5],[28,-21],[26.5,-14],[22,-4.5],[21.3,-3],[20.3,-2],[12.3,3],[11.8,3],[2,2.5],[-12.5,1],[-13.2,0.5],[-19.7,-4],[-20.7,-5],[-28.2,-18],[-28.7,-19],[-31.2,-26],[-31.7,-29]]};
Object.assign(PROFILES,{"bonbon":[[-12.5,-22.25],[-12.25,-23],[-11.75,-24],[-9.75,-26],[-2.5,-31.75],[-1.5,-32.5],[-1,-32.75],[0.5,-33.25],[3,-33.25],[4.5,-32.5],[5.25,-31.75],[5.5,-31.25],[5.75,-30.5],[8.25,-22],[9.5,-8],[9.5,-6.25],[9,-5.25],[5.25,-0.75],[5,-0.5],[4.25,-0.25],[-4.5,-0.25],[-5.25,-0.5],[-5.5,-0.75],[-9.25,-5.25],[-9.75,-6],[-12,-10.75],[-12.5,-20.25]],"bosong":[[-8.75,-14.5],[-8.25,-33.25],[-7.5,-34],[2.75,-40.25],[3.25,-40.5],[4.25,-40.5],[9.25,-40],[10,-39.25],[10,-37.5],[7.25,-5],[7,-4.5],[5.25,-1.25],[4.75,-0.5],[4.25,0],[-3.5,0.25],[-4.5,0],[-5,-0.5],[-5.5,-1.25],[-7.5,-4.75],[-8.75,-13]],"jureong":[[-26.25,-9],[-25.75,-10.5],[-18.75,-25.25],[-18.5,-25.75],[-17.5,-27.25],[-16,-28.75],[-15,-29.5],[-14.5,-29.75],[-13.25,-30.25],[-4.75,-32.75],[-1,-32.75],[0,-32.5],[2.5,-31.25],[19.75,-20.25],[20.5,-19.75],[22.25,-18],[22.75,-17.25],[23.5,-15.75],[24,-14.25],[24.25,-13.25],[26.25,-5],[26,-4.25],[25.5,-3.75],[10.25,-0.25],[-9.5,0],[-10,0],[-19.75,-2],[-20.25,-2.25],[-25.25,-5.25],[-26,-6],[-26.25,-6.5]],"duri":[[-13.5,-20.75],[-8,-32.25],[-7.5,-32.75],[-0.75,-36.5],[-0.25,-36.75],[7.25,-37.5],[8,-37.5],[13.75,-31.25],[14,-22],[14,-21.25],[13,-14],[10.5,-4.75],[7.25,-1],[6,0.25],[5.5,0.5],[-5.75,0.5],[-6.25,0.25],[-7.5,-1],[-10.75,-4.5],[-11,-5],[-13.5,-18.75]]});
Object.assign(PROFILES,{"superbum":[[-42.5,-42.5],[-42,-43.5],[-34.5,-55.5],[-33,-57],[-30.5,-59],[-29,-60],[-23.5,-63.5],[-21.5,-64.5],[-19,-65.5],[-16.5,-66],[17.5,-65.5],[20,-65],[24,-63],[25.5,-62],[32.5,-55.5],[34,-54],[34.5,-53],[39,-43],[39,-39.5],[35.5,-8],[35,-7],[31.5,-0.5],[30,1],[29,1.5],[27.5,2],[-28,2],[-29.5,1.5],[-30.5,1],[-32,-0.5],[-38.5,-7.5],[-42.5,-40]]});
Object.assign(PROFILES,{"superbumHuddle":[[-35,-37],[-34.5,-40.5],[-34,-41.5],[-27.5,-51.5],[-25,-54],[-19.5,-57.5],[-17.5,-58.5],[-15,-59],[16.5,-58.5],[18,-58],[19,-57.5],[25.5,-52],[26.5,-51],[31.5,-41],[32,-37],[32,-34.5],[31.5,-6],[31,-5],[26,2],[24.5,3.5],[23,4],[-23.5,4],[-25,3.5],[-26,3],[-33.5,-4.5],[-34.5,-6],[-35,-7]]});
const PHASES=['outside','seeking','moving','entering','restingInside','exiting','waitingOutside','rerouting'];
const stage=p=>p.visualStage??(p.xp>=115?3:p.xp>=40?2:p.xp>=8?1:0);
const desiredStage=p=>p.xp>=115?3:p.xp>=40?2:p.xp>=8?1:0;
const growth=p=>[.65,.78,.9,1][stage(p)];
const units=p=>((p.species==='superbum'||p.species==='neolbi')?[4,5,6,8]:[2,3,4,4])[stage(p)];
// SRS v2.24 SH24: the base shelter holds three grown regular friends (12 units) and at most 3 friends; levels 2/3 keep 16/24 units with 4/5 friends.
const ROCK_SITE='south-rock-shelter';
const DISCOVERY='남쪽 숲이 열리고 이끼 덮인 바위쉼터를 발견했어요.';
const isRock=f=>f?.kind==='stone';
const name=f=>isRock(f)?['','바위쉼터','넓은 바위쉼터','큰 바위쉼터'][f.level]:['','기본 쉼터','넓은 쉼터','큰 쉼터'][f.level];
const MAX_PER_TYPE=3;
const ownedCount=(s,f)=>[...s.shelters.facilities,...s.shelters.stored].filter(q=>isRock(q)===isRock(f)).length;
const standardRoom=s=>s.shelters.facilities.filter(f=>!isRock(f)).length<MAX_PER_TYPE;
function canCopy(s,f){
 return !!f&&(isRock(f)||s.shelters.unlocked)&&ownedCount(s,f)<MAX_PER_TYPE;
}
function storedFor(s,kind,id){return s.shelters.stored.find(f=>kind==='restore'?f.id===id:kind==='add'&&!isRock(f));}
const capacity=f=>[12,16,24][f.level-1],seats=f=>[3,4,5][f.level-1];
const shape=[[149,447],[143,396],[171,345],[218,307],[276,292],[326,300],[372,328],[400,364],[410,398],[354,411],[280,432],[205,452]];
// Projected slate and side supports in the same 500 × 330 coordinates as the art.
const ROCK_SURFACE=[[34,248],[54,171],[73,117],[116,68],[161,52],[209,75],[260,103],[317,130],
 [369,158],[421,181],[458,210],[475,248],[435,263],[347,247],[275,250],[173,265],[79,264]].map(([x,y])=>({x,y}));
function init(s){s.shelters??={version:1,nextId:1,unlocked:false,stored:[],facilities:[{id:'shelter-0',level:1,x:.23,y:.29,base:true,revision:0}]};s.shelters.stored??=[];s.shelters.plannedRoster??=[];s.shelters.nextRequest??=1;for(const p of s.individuals){p.visualStage??=desiredStage(p);p.shelter??={phase:'outside',since:s.worldTick};}return s;}
function transform(f){return {x:(f.x-.23)*360-10,y:f.y*576-160,sy:.55+(f.level-1)*.075,extra:(f.level-1)*60};}
// 1.2.0: a mirrored shelter (f.flip) reflects every art-space x across the picture, so the walls, the arch and the
// entrance all follow the flipped drawing
function sourceX(x,f){const k=.44*(1+(f.level-1)*60/220);return (f.flip?500-x:x)*k;}
const polyCache=new Map();
// 0.7.0 (many friends): a per-facility cache without building a string key on every call (not saved: a WeakMap)
const polyFast=new WeakMap();
function polygon(f){const c=polyFast.get(f);if(c&&c.x===f.x&&c.y===f.y&&c.level===f.level&&c.flip===!!f.flip)return c.poly;const poly=polygonSlow(f);polyFast.set(f,{x:f.x,y:f.y,level:f.level,flip:!!f.flip,poly});return poly;}
function polygonSlow(f){const key=[f.x,f.y,f.level,f.flip?1:0].join(':');if(polyCache.has(key))return polyCache.get(key);const t=transform(f),poly=shape.map(([x,y])=>({x:(t.x+sourceX(x,f))/360,y:(t.y+(y-190)*t.sy)/576}));if(polyCache.size>100)polyCache.clear();polyCache.set(key,poly);return poly;}

function inPoly(q,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>q.y)!==(b.y>q.y)&&q.x<(b.x-a.x)*(q.y-a.y)/(b.y-a.y)+a.x)c=!c;}return c;}
function outline(p,q=p){const g=growth(p);return (PROFILES[p.species==="superbum"?"superbumHuddle":p.species]||PROFILES.ridley).map(([x,y])=>({x:q.x+x*g/360,y:q.y+y*g/576}));}
const extents=Object.fromEntries(Object.entries(PROFILES).map(([k,v])=>[k,{l:Math.min(...v.map(a=>a[0])),r:Math.max(...v.map(a=>a[0])),t:Math.min(...v.map(a=>a[1])),b:Math.max(...v.map(a=>a[1]))}]));
function bounds(p,q=p){const b=extents[p.species]||extents.ridley,g=growth(p);return {left:q.x+b.l*g/360,right:q.x+b.r*g/360,top:q.y+b.t*g/576,bottom:q.y+b.b*g/576};}

function fits(f,p,q=p){const poly=polygon(f),points=outline(p,q);return points.every((a,i)=>{const b=points[(i+1)%points.length],n=Math.ceil(Math.hypot((b.x-a.x)*360,(b.y-a.y)*576));for(let j=0;j<=n;j++)if(!inPoly({x:a.x+(b.x-a.x)*j/Math.max(1,n),y:a.y+(b.y-a.y)*j/Math.max(1,n)},poly))return false;return true;});}
function overlap(p,q,r,z=r){const a=bounds(p,q),b=bounds(r,z),gap=1/360;return a.left<b.right+gap&&a.right+gap>b.left&&a.top<b.bottom&&a.bottom>b.top;}
function facility(s,id){return s.shelters?.facilities.find(f=>f.id===id);}
function inside(s,p){const a=p.shelter,f=facility(s,a?.facilityId);return !!(p.active&&!p.mounted&&a?.phase==='restingInside'&&f&&fits(f,p)&&Math.hypot((p.x-a.x)*360,(p.y-a.y)*576)<.5);}
function cover(s,q){return s.shelters?.facilities.find(f=>inPoly(q,polygon(f)))||null;}
function occupied(a){return ['restingInside','exiting'].includes(a?.phase);}
function ledger(s,f,exclude){let used=0,reserved=0,friends=0;for(const p of s.individuals){const a=p.shelter;if(p.id===exclude||!p.active||p.mounted||a?.facilityId!==f.id)continue;if(occupied(a)){used+=a.units||0;friends++;}else if(['moving','entering','held'].includes(a.phase)){reserved+=a.units||0;friends++;}}return {used,reserved,free:capacity(f)-used-reserved,total:capacity(f),friends,seats:seats(f)};}
function entry(f,seat){const t=transform(f);return {x:seat?.x??(t.x+(f.flip?98:122)+t.extra/2)/360,y:(t.y+330*t.sy+24)/576};}
const seatCache=new Map();
function candidates(f,p){const key=[f.level,f.x,f.y,p.species,stage(p)].join(':');if(seatCache.has(key))return seatCache.get(key);const t=transform(f),qs=[],xs=[];for(let x=t.x+54;x<=t.x+185+t.extra;x+=2)xs.push(x);/* 0.6.17: Elephan no longer prefers the centre of the base shelter; a side seat leaves a contiguous seat for a regular friend (12 units = Elephan 8 + friend 4). */for(const x of xs)for(let y=t.y+145*t.sy/.55;y>=t.y+94*t.sy/.55;y-=2){const q={x:x/360,y:y/576};if(fits(f,p,q))qs.push(q);}if(seatCache.size>100)seatCache.clear();seatCache.set(key,qs);return qs;}
function room(s,f,p,next=p){const v=ledger(s,f,p.id);return v.free>=units(next)&&v.friends<seats(f);}
function seat(s,f,p,reachable=()=>true){if(!room(s,f,p))return null;return candidates(f,p).find(q=>!s.individuals.some(z=>z.id!==p.id&&z.active&&!z.mounted&&(z.shelter?.facilityId===f.id?overlap(p,q,z,z.shelter):overlap(p,q,z)))&&reachable(q))||null;}

function exposure(s,p){const W=typeof module==='object'?require('./weather-care.js'):globalThis.ForestWeatherCare;return W.wind(s,p);}
function priority(s,p){return exposure(s,p)>=60||p.burden>=60||p.B<20?0:p.wetRecovery||p.leafRecovery||p.burden>=40||p.damage>=10||p.energy<40||p.nutrition<40?1:2;}
function wants(s,p){if(s.objects)return p.active&&!p.mounted&&!(p.restCooldown>s.worldTick)&&(p.objectTask?p.objectTask.object==='shelter':p.action==='rest'&&p.target==='shelter');const session=s.social?.sessions.find(a=>a.type==='CANOPY'&&a.phase==='rest'&&a.ids.includes(p.id)),host=session&&s.individuals.find(z=>z.id===session.ids[0]);if(session&&host&&s.weather.wind<70&&host.braceSeconds<10&&p.B>=35&&p.energy>=40&&p.nutrition>=40&&p.burden<40&&!p.wetRecovery&&!p.leafRecovery&&p.damage<30)return false;return p.active&&!p.mounted&&(priority(s,p)<2||!(p.restCooldown>s.worldTick)&&p.action==='rest'&&p.target==='shelter');}
function release(p,tick){p.shelter={phase:'outside',since:tick};p.visualStage=desiredStage(p);}
function reserve(s,p,Space){const avoid=(p.shelterAvoid||[]).filter(v=>v.until>s.worldTick);if(avoid.length)p.shelterAvoid=avoid;else delete p.shelterAvoid;const options=s.shelters.facilities.map(f=>({f,q:seat(s,f,p,q=>!avoid.some(v=>Math.hypot(v.x-q.x,v.y-q.y)<.02)&&!!Space.route(s,p,entry(f,q),p.id))})).filter(o=>o.q).sort((a,b)=>Space.distance(p,entry(a.f,a.q))-Space.distance(p,entry(b.f,b.q))||a.f.id.localeCompare(b.f.id));for(const {f,q}of options){const e=entry(f,q);if(!Space.route(s,p,e,p.id))continue;p.shelter={phase:fits(f,p)?'entering':'moving',facilityId:f.id,...q,units:units(p),since:p.shelter?.since??s.worldTick,expires:s.worldTick+Math.min(60,Math.ceil(1.5*(Space.distance(p,e)+Space.distance(e,q))/Space.gait(p,s).speed)+10),revision:f.revision,stalled:0};return true;}
 p.shelter.waitReason=s.shelters.facilities.some(f=>seat(s,f,p))?'path':s.shelters.facilities.every(f=>ledger(s,f,p.id).free<units(p))?'capacity':s.shelters.facilities.every(f=>!room(s,f,p))?'crowd':s.shelters.facilities.every(f=>!candidates(f,p).length)?'shape':'traffic';return false;}
function projectedNeed(s){const live=s.individuals.filter(p=>p.active&&!p.mounted),planned=[...new Set([...live,...s.shelters.plannedRoster.map(id=>s.individuals.find(p=>p.id===id)||s.recruitment?.visitor?.pet).filter(Boolean)])].slice(0,50);   /* 0.8.2: every friend in the garden is planned for at adult size (the roster screen is gone) */return Math.max(live.reduce((n,p)=>n+units(p),0),...([live,planned].map(a=>a.reduce((n,p)=>n+((p.species==='superbum'||p.species==='neolbi')?8:4),0))));}
function setPlanned(s,ids){if(!Array.isArray(ids)||ids.length>50||new Set(ids).size!==ids.length||ids.some(id=>!s.individuals.some(p=>p.id===id)&&!(s.recruitment?.visitor?.ready&&s.recruitment.visitor.pet.id===id)))throw Error('함께 지낼 친구를 다시 골라주세요.');s.shelters.plannedRoster=ids.slice();if(projectedNeed(s)>s.shelters.facilities.reduce((n,f)=>n+capacity(f),0))s.shelters.unlocked=true;}
function intersects(f,p,q=p){const poly=polygon(f),out=outline(p,q);if(out.some(a=>inPoly(a,poly))||poly.some(a=>inPoly(a,out)))return true;for(let i=0;i<out.length;i++){const a=out[i],b=out[(i+1)%out.length],n=Math.ceil(Math.hypot((a.x-b.x)*360,(a.y-b.y)*576));for(let j=0;j<=n;j++)if(inPoly({x:a.x+(b.x-a.x)*j/Math.max(1,n),y:a.y+(b.y-a.y)*j/Math.max(1,n)},poly))return true;}return false;}
// 1.2.6: 영양 40 was the old (pre-1.0) line; with the 1.0 band (Lv1 35~65) a friend at 영양 38 is fine but could never leave — after a free
// visit it stayed inside holding a seat for good (seen with 슈퍼범). It now uses the friend's own band, like 수분.
function recovered(p){const lo=(typeof module==='object'?require('./vitals.js'):globalThis.ForestVitals)?.band?.(p)?.lo??35;return p.B>=35&&p.energy>=75&&p.nutrition>=Math.min(40,lo)&&p.burden<40&&p.damage<10&&!p.wetRecovery&&!p.leafRecovery;}
// 1.2.6 (user: "큰 비에도 안들어가"): a friend sheltering from rain, wind or cold, or asleep, no longer gives its seat to the friend waiting
// outside — both need it as much, so they only swapped places and one of them always stood in the rain. Free visits and plain rest still yield.
function holds(p){const t=p.objectTask;return !!t&&!t.free&&t.object==='shelter'&&['shelterRain','safety','warm','sleep'].includes(t.reason);}
function safeExit(s,p,Space){if(!recovered(p)&&(!s.objects||!(p.objectTask&&p.objectTask.object!=='shelter'))&&!p.stroll?.lake)return null;   /* 1.2.9: a thirsty friend heading to the lake may leave */const q=waitPoint(s,p,Space),route=Space.route(s,p,q,p.id);if(!route||s.environment?.storm?.phase==='prelude')return null;const futureWind=Math.max(s.weather.wind,s.environment?.windTarget||0);if(futureWind>=60)return null;for(const z of route){const probe={...p,...z,shelter:{phase:'outside'}};if(exposure(s,probe)>=50||s.patches.some(a=>Math.hypot(a.x-z.x,a.y-z.y)<.08&&100*a.S/a.cap>=60&&p.Q>=12))return null;}if(s.shelters.facilities.some(f=>intersects(f,p,q)))return null;return q;}
function prepare(s,held,Space){init(s);if(projectedNeed(s)>s.shelters.facilities.reduce((n,f)=>n+capacity(f),0)||s.individuals.filter(p=>p.active&&!p.mounted).length>s.shelters.facilities.reduce((n,f)=>n+seats(f),0))s.shelters.unlocked=true;
 for(const p of s.individuals){if(p.id===s.world?.lake?.boat?.rider||s.world?.lake?.swim?.ids.includes(p.id))continue;let a=p.shelter,f=facility(s,a.facilityId);if(!p.active||p.mounted){release(p,s.worldTick);delete p.shelterRequest;continue;}
  p.recoveredSeconds=recovered(p)?(p.recoveredSeconds||0)+1:0;
  if(wants(s,p)&&!inside(s,p)){p.shelterRequest??={id:s.shelters.nextRequest++,start:s.worldTick,waited:0,absent:0};p.shelterRequest.waited++;p.shelterRequest.absent=0;}else if(p.shelterRequest&&++p.shelterRequest.absent>=10)delete p.shelterRequest;
  if(held===p.id){if(f&&a.phase!=='held'){a.beforeHeld=a.phase;a.phase='held';}continue;}if(a.phase==='held'){a.phase=a.beforeHeld||'entering';delete a.beforeHeld;}
  if(!f&&!wants(s,p)&&a.phase!=='outside'){release(p,s.worldTick);a=p.shelter;}
  if(desiredStage(p)!==stage(p)){const next={...p,visualStage:desiredStage(p)};if(!f)p.visualStage=desiredStage(p);else if(room(s,f,p,next)&&fits(f,next)&&!s.individuals.some(z=>z.id!==p.id&&z.active&&overlap(next,p,z))){p.visualStage=desiredStage(p);a.units=units(p);}else{const q=safeExit(s,p,Space);if(q){a.phase='exiting';a.exitPoint=q;}}}
  /* 1.2.9 (user: "엘리시 쉼터에 들어갔다 나왔다 … 반복"): the booking ran out while the friend was still walking round a friend sitting at the door — it walked out and booked the same seat again every 29 s. A booking now runs out only while the friend is stuck (a friend already in the doorway keeps it), and at the latest 60 s later */if(f&&(!wants(s,p)||a.expires<s.worldTick&&!occupied(a)&&((a.stalled||0)>0&&!intersects(f,p)||a.expires+60<s.worldTick)||f.revision!==a.revision)){if(occupied(a)||intersects(f,p)){const q=safeExit(s,p,Space);if(q){a.phase='exiting';a.exitPoint=q;}}else release(p,s.worldTick);}
 }
 const pending=s.individuals.filter(p=>!s.world?.lake?.swim?.ids.includes(p.id)&&wants(s,p)&&p.id!==held&&!p.shelter.facilityId).sort((a,b)=>priority(s,a)-priority(s,b)||(b.shelterRequest?.waited||0)-(a.shelterRequest?.waited||0)||(a.shelterRequest?.id||0)-(b.shelterRequest?.id||0)||a.id.localeCompare(b.id));
 if(s.shelters.nextGuest&&!pending.some(p=>p.id===s.shelters.nextGuest))delete s.shelters.nextGuest;
 const target=pending[0];if(target){for(const p of s.individuals.filter(p=>inside(s,p)&&p.recoveredSeconds>=10&&!holds(p))){const a=p.shelter,emergency=priority(s,target)===0,ordinary=(s.worldTick-(a.entered??s.worldTick)>=30&&(target.shelterRequest?.waited||0)>=60);if(!emergency&&!ordinary)continue;const q=safeExit(s,p,Space);if(q){a.phase='exiting';a.exitPoint=q;a.yielding=true;s.shelters.nextGuest=target.id;break;}}}
 let blockedNormal=false;for(const p of pending){if((blockedNormal||s.shelters.nextGuest&&s.shelters.nextGuest!==p.id)&&priority(s,p)===2){p.shelter.phase='waitingOutside';p.shelter.waitReason='turn';continue;}if(reserve(s,p,Space)){if(s.shelters.nextGuest===p.id)delete s.shelters.nextGuest;p.shapeFailures=0;}else{p.shelter.phase='waitingOutside';const geometric=s.shelters.facilities.every(f=>!candidates(f,p).length);p.shapeFailures=geometric?(p.shapeFailures||0)+1:0;if(p.shapeFailures>=10)s.shelters.unlocked=true;blockedNormal=p.shelter.waitReason!=='path';}}
}
function waitPoint(s,p,Space){
 const home=facility(s,p.shelter?.facilityId);
 if(isRock(home)){
  const e=entry(home,p.shelter);
  for(const dx of [0,-.12,.12,-.24,.24,-.35,.35])for(const dy of [.095,.055,.025,0]){
   const q={x:e.x+dx,y:e.y+dy};
   if(Space.walkable(s,q,p.id)&&!s.shelters.facilities.some(f=>intersects(f,p,q))&&
    !s.individuals.some(z=>z.id!==p.id&&z.active&&overlap(p,q,z))&&Space.route(s,p,q,p.id))return q;
  }
 }
 const f=s.shelters.facilities[0],e=entry(f),idx=s.individuals.filter(z=>z.active).sort((a,b)=>a.id.localeCompare(b.id)).findIndex(z=>z.id===p.id);for(let j=0;j<24;j++){const q={x:.12+((idx+j)%5)*.16,y:e.y+.10+Math.floor(j/5)*.065};if(q.y>World.walk(s).y1)break;if(Space.walkable(s,q,p.id)&&!cover(s,q)&&!s.individuals.some(z=>z.id!==p.id&&z.active&&Space.distance(z,q)<.09)&&Space.route(s,p,q,p.id))return q;}return {x:p.x,y:p.y};}
function move(s,p,Space){const a=p.shelter,f=facility(s,a?.facilityId);if(!wants(s,p)&&!f)return null;if(f&&!wants(s,p)&&!occupied(a)&&!cover(s,p)){release(p,s.worldTick);return null;}let target;if(f){target=a.phase==='exiting'?(a.exitPoint||entry(f,a)):a.phase==='moving'?entry(f,a):{x:a.x,y:a.y};}else target=waitPoint(s,p,Space);
 const m=Space.travel(s,p,target);if(f){if(m.distance>0)a.stalled=0;else if(!m.arrived)a.stalled=(a.stalled||0)+1;
 if(a.phase==='moving'&&m.arrived){a.phase='entering';a.stalled=0;}
 else if(a.phase==='entering'&&m.arrived&&fits(f,p)&&m.distance===0){a.phase='restingInside';a.entered=s.worldTick;delete p.shelterRequest;}
 else if(a.phase==='exiting'&&m.arrived&&!intersects(f,p)){if(a.yielding)p.restCooldown=s.worldTick+60;release(p,s.worldTick);if(!p.objectTask){p.action='wander';p.target=null;p.actionSeconds=20;}}
 if(a.phase==='exiting'&&a.stalled>=3){const q=safeExit(s,p,Space);if(q)a.exitPoint=q;if(a.stalled>=6){if(!intersects(f,p)){if(a.yielding)p.restCooldown=s.worldTick+60;release(p,s.worldTick);if(!p.objectTask){p.action='wander';p.target=null;p.actionSeconds=20;}}else{a.phase='restingInside';a.x=p.x;a.y=p.y;delete a.exitPoint;delete a.yielding;a.stalled=0;}}}
 /* 1.2.3: a seat it could not reach (a friend already sitting in front of it) was booked again and again all night; it is skipped for 90 s so another seat is tried */if(a.stalled>=3&&!occupied(a)){a.replans=(a.replans||0)+1;a.stalled=0;if(a.replans>1){p.shelterAvoid=[...(p.shelterAvoid||[]).filter(v=>v.until>s.worldTick),{x:a.x,y:a.y,until:s.worldTick+90}].slice(-4);release(p,s.worldTick);p.shelter.phase='rerouting';}}
 }return {...m,arrived:inside(s,p),kind:inside(s,p)?'rest':m.kind};}
function overlapsPathBounds(s,left,top,right,bottom){
 const margin=1e-7;
 for(const f of s.shelters?.facilities||[]){
  const t=transform(f);
  if(right*360+margin>=t.x&&left*360-margin<=t.x+220+t.extra&&bottom*576+margin>=t.y&&top*576-margin<=t.y+280*t.sy)return true;
 }
 return false;
}
function blocked(s,q,id){
 const assigned=s.individuals.find(p=>p.id===id)?.shelter;
 const x=q.x*360,y=q.y*576;
 for(const f of s.shelters?.facilities||[]){
  const t=transform(f);
  // The room, walls and projected rock surface are all inside this art-space box.
  if(x<t.x||x>t.x+220+t.extra||y<t.y||y>t.y+280*t.sy)continue;
  const inRoom=inPoly(q,polygon(f));
  const usesDoor=assigned?.facilityId===f.id&&assigned.phase!=='moving';
  if(isRock(f)&&!usesDoor){
   const artX=(x-t.x)*500/(220+t.extra),artY=(y-t.y)/t.sy;
   if(inPoly({x:f.flip?500-artX:artX,y:artY},ROCK_SURFACE))return true;
   if(inRoom)return true;
  }else if(inRoom&&assigned?.facilityId!==f.id)return true;
  if(x>t.x+25&&x<t.x+200+t.extra&&y>t.y+20&&y<t.y+200*t.sy&&!inRoom)return true;
 }
 return false;
}
function label(s,p){const a=p.shelter;if(p.mounted)return '목부작 자리에서 쉬고 있어요';
 if(isRock(facility(s,a?.facilityId))){
  if(inside(s,p))return ({sleep:'바위쉼터에서 자고 있어요',shelterRain:'바위쉼터에서 비를 피하고 있어요',warm:'바위쉼터에서 몸을 녹이고 있어요'})[p.objectTask?.reason]||'바위쉼터에서 쉬고 있어요';
  const motion={moving:'바위쉼터로 가고 있어요',entering:'바위쉼터로 들어가고 있어요',exiting:'바위쉼터에서 나오고 있어요'}[a.phase];
  if(motion)return motion;
 }
 if(inside(s,p)||a?.phase==='restingInside')return p.burden>=20?'쉼터 안에서 뿌리를 말리고 있어요':p.objectTask?.reason==='sleep'?'포근한 쉼터 안에서 자고 있어요':p.objectTask?.reason==='shelterRain'?'쉼터 안에서 비를 피하고 있어요':p.objectTask?.reason==='warm'?'포근한 쉼터 안에서 몸을 녹이고 있어요':'포근한 쉼터 안에서 쉬고 있어요';if(a?.phase==='waitingOutside')return ({path:'쉼터 입구가 막혀 들어갈 길을 찾고 있어요',traffic:'입구에서 친구와 길을 비켜주고 있어요',shape:'몸이 편히 들어갈 넓은 쉼터가 필요해요',capacity:'쉼터 공간이 모자라 자리를 기다리고 있어요',crowd:'쉼터에 친구가 가득해 자리를 기다리고 있어요',turn:'먼저 기다린 친구가 들어간 뒤 쉬려고 해요'})[a.waitReason]||'쉼터 밖에서 자리를 기다리고 있어요';return ({moving:'쉼터로 가고 있어요',entering:'쉼터 안으로 들어가고 있어요',exiting:'쉼터에서 나오고 있어요',rerouting:'들어갈 길을 찾고 있어요'})[a?.phase]||'쉬어 갈 자리를 찾고 있어요';}
function plan(s,id,kind,point){
 if(!['add','restore','move','expand','store','flip','copy'].includes(kind))throw Error('쉼터 배치를 확인해 주세요.');
 const copying=kind==='copy',adding=kind==='add'||kind==='restore',stored=adding?storedFor(s,kind,id):null,old=adding?null:facility(s,id);
 if(!adding&&!old||kind==='restore'&&!stored)throw Error('쉼터를 찾지 못했어요.');
 if(adding&&!isRock(stored)&&!standardRoom(s))throw Error('일반 쉼터는 최대 3동까지 놓을 수 있어요.');
 if((kind==='expand'||kind==='add'&&!stored)&&!s.shelters.unlocked)throw Error('공간이 부족해지면 확장과 추가 쉼터가 열려요.');
 if(copying&&!canCopy(s,old))throw Error(ownedCount(s,old)>=MAX_PER_TYPE?'같은 쉼터는 최대 3개까지 만들 수 있어요.':'쉼터 추가를 열면 복사할 수 있어요.');
 if(old&&!copying&&ledger(s,old).used+ledger(s,old).reserved>0)throw Error('친구들이 모두 나온 뒤 변경할 수 있어요.');
 if(old?.base&&kind==='store')throw Error('처음 쉼터는 숲에 하나 남겨 두어요.');
 if(kind==='store')return null;
 if(kind==='expand'&&old.level===3)throw Error('가장 넓은 쉼터예요.');
 const f={...(stored||old||{id:'shelter-'+s.shelters.nextId,level:1,x:.45,y:.70,base:false,revision:0})};
 if(kind==='expand')f.level++;
 if(copying)Object.assign(f,{id:'shelter-'+s.shelters.nextId,base:false,revision:0});
 if(kind!=='flip'&&point&&Number.isFinite(point.x)){f.x=point.x;f.y=point.y;}
 if(point&&'flip' in point){if(point.flip)f.flip=true;else delete f.flip;}
 const error=placementError(s,f,copying?undefined:old?.id);
 if(error)throw Error(error);
 return f;
}
function setupBounds(f){
 const t=transform(f);
 return {x0:(t.x+20)/360,x1:(t.x+210+t.extra)/360,y0:(t.y+20)/576,y1:entry(f).y+.045};
}
function placementError(s,f,replaceId){
 const Trees=typeof module==='object'?require('./trees.js'):globalThis.ForestTrees;
 if(Trees.active(s).some(t=>World.boxesOverlap(setupBounds(f),Trees.extent(t))))return '나무 줄기와 쉼터 입구를 떨어뜨려 놓아주세요.';
 if(![f.x,f.y].every(Number.isFinite))return '쉼터 배치를 확인해 주세요.';
 const t=transform(f),box={l:t.x+20,r:t.x+210+t.extra,t:t.y+20,b:t.y+300*t.sy};/* 1.2.0: the whole open forest (0.7.0 wide map) is allowed, not just the old 0..1 garden; never on the lake */const WB=World.bounds(s);if(box.l<WB.x0*360||box.r>WB.x1*360-5||box.t<WB.y0*576||box.b>WB.y1*576-26||!World.inside(s,f,World.inner(s,.08,.23,.15,.15)))return '쉼터가 숲 안에 들어오게 놓아주세요.';if(World.inWater&&(polygon(f).some(q=>World.inWater(s,q))||World.inWater(s,entry(f))))return '물 위에는 쉼터를 놓을 수 없어요.';
 if(World.stoneShelves(s).some(shelf=>World.boxesOverlap(setupBounds(f),World.shelfBounds(shelf))))return '돌 선반과 쉼터 입구가 겹쳐요.';
 /* 1.2.0: when adding, the id passed is the shelter whose card was used; every existing shelter still counts */
 for(const z of s.shelters.facilities.filter(z=>z.id!==replaceId)){const q=transform(z);if(box.l<q.x+210+q.extra&&box.r>q.x+20&&box.t<q.y+318*q.sy&&box.b>q.y+20)return '다른 쉼터와 입구가 겹쳐요.';}
 const O=typeof module==='object'?require('./objects.js'):globalThis.ForestObjects;
 for(const z of [...s.patches.filter(z=>z.id!=='shelter'),...O.springs(s)]){const x=z.x*360,y=z.y*576;if(x>box.l-20&&x<box.r+20&&y>box.t-5&&y<box.b+18)return '주변 지형을 조금 옮겨 쉼터와 출입 공간을 비워주세요.';}
 if(s.individuals.some(p=>p.active&&p.x*360>box.l&&p.x*360<box.r&&p.y*576>box.t&&p.y*576<box.b))return '친구가 있는 자리를 비워주세요.';const candidate={...s,shelters:{...s.shelters,facilities:s.shelters.facilities.filter(z=>z.id!==replaceId).concat(f)}};const Space=typeof module==='object'?require('./spatial.js'):globalThis.ForestSpace;for(const z of candidate.shelters.facilities)if(!Space.route(candidate,entry(z),Space.socket(candidate,'spring')))return '입구에서 샘터까지 이어지는 통로를 비워주세요.';return null;}
function build(s,id,kind,point){const f=plan(s,id,kind,point);/* 1.2.13 (user: "쉼터 옮길 때 교감, 물 … 확인 필요하면서 안되는 거임?"): moving, flipping, storing or adding a shelter changes the layout, so running friend-to-friend sessions (엘레판 그늘·물 나눔) and object tasks are ended first, the same as moving any other object; otherwise the save check refused the change with "교감·물 출처 기록을 확인해 주세요" */const dep=n=>typeof module==='object'?require('./'+n+'.js'):globalThis[{social:'ForestSocial',objects:'ForestObjects'}[n]];if(s.social)dep('social').invalidate(s);if(s.objects)dep('objects').invalidate(s);if(kind==='store'){s.shelters.stored.push({...facility(s,id)});s.shelters.facilities=s.shelters.facilities.filter(f=>f.id!==id);}else if(kind==='add'||kind==='restore'||kind==='copy'){s.shelters.facilities.push(f);const kept=s.shelters.stored.findIndex(z=>z.id===f.id);if(kept>=0)s.shelters.stored.splice(kept,1);else s.shelters.nextId++;}else{const t=facility(s,id);Object.assign(t,f,{revision:f.revision+1});if(!f.flip)delete t.flip;}s.layoutRevision++;return s;}
function discoverSouth(s,event){
 if(!World.southReady(s))return false;
 const world={...s.world,regions:[...s.world.regions,'south']},candidate={...s,world};
 // This is newly accessible ground. No existing object, reservation or path is edited.
 const f=[.73,.10,1.50,2.40].map(x=>({id:'shelter-'+s.shelters.nextId,kind:'stone',level:1,x,y:1.62,base:false,revision:0}))
  .find(f=>!placementError(candidate,f));
 if(!f)return false;
 s.world=world;s.shelters.facilities.push(f);s.shelters.nextId++;
 s.discoveries[ROCK_SITE]={tick:s.worldTick,text:DISCOVERY,layout:s.layoutRevision};
 event?.(s,'world',DISCOVERY,{discovery:ROCK_SITE});
 return true;
}
function validate(s){const sh=s.shelters;if(!sh||sh.version!==1||!Number.isSafeInteger(sh.nextId)||sh.nextId<1||typeof sh.unlocked!=='boolean'||!Array.isArray(sh.facilities)||sh.facilities.length<1||!Array.isArray(sh.stored)||sh.facilities.length+sh.stored.length>2*MAX_PER_TYPE)throw Error('쉼터 기록을 확인해 주세요.');const all=[...sh.facilities,...sh.stored],rocks=all.filter(isRock).length;
 if((World.southOpen(s)?rocks<1||rocks>MAX_PER_TYPE:rocks!==0)||all.length-rocks>MAX_PER_TYPE)throw Error('쉼터 기록을 확인해 주세요.');
 const ids=new Set();for(const f of all){if(f.kind!==undefined&&(!isRock(f)||f.base)||ids.has(f.id)||(f.flip!==undefined&&typeof f.flip!=='boolean')||!/^shelter-\d+$/.test(f.id)||![1,2,3].includes(f.level)||!Number.isInteger(f.revision)||f.revision<0||!Number.isFinite(f.x)||!Number.isFinite(f.y)||!World.inside(s,f,World.inner(s,.08,.23,.15,.15))||Number(f.id.slice(8))>=sh.nextId)throw Error('쉼터 위치와 크기를 확인해 주세요.');ids.add(f.id);if(ledger(s,f).free<0)throw Error('쉼터 공간이 겹쳐요.');}if(sh.facilities.filter(f=>f.base).length!==1||!sh.facilities.some(f=>f.base&&f.id==='shelter-0'&&Number.isFinite(f.x)&&Number.isFinite(f.y)))   /* 1.2.6: the base shelter can be moved in 꾸미기 */throw Error('기본 쉼터 기록을 확인해 주세요.');for(const p of s.individuals){const a=p.shelter;if(!a||!PHASES.concat('held').includes(a.phase)||![0,1,2,3].includes(p.visualStage)||!Number.isFinite(a.since))throw Error('쉼터 상태를 확인해 주세요.');if(a.facilityId&&(!facility(s,a.facilityId)||![a.x,a.y,a.units].every(Number.isFinite)||a.units!==units(p)||!Number.isInteger(a.revision)))throw Error('쉼터 예약을 확인해 주세요.');}}
function rebuild(s){init(s);const old=new Map(s.individuals.map(p=>[p.id,{...p.shelter}]));for(const p of s.individuals)p.shelter={phase:'outside',since:old.get(p.id)?.since??s.worldTick};for(const p of s.individuals.filter(p=>p.active&&!p.mounted).sort((a,b)=>a.id.localeCompare(b.id)))for(const f of s.shelters.facilities){if(fits(f,p)&&room(s,f,p)&&!s.individuals.some(z=>z.id!==p.id&&inside(s,z)&&overlap(p,p,z))){p.shelter={phase:'restingInside',facilityId:f.id,x:p.x,y:p.y,units:units(p),since:old.get(p.id)?.since??s.worldTick,revision:f.revision};break;}}return s;}
return {canCopy,setupBounds,discoverSouth,isRock,name,standardRoom,storedFor,projectedNeed,seats,room,setPlanned,intersects,safeExit,recovered,outline,plan,build,init,stage,desiredStage,growth,units,capacity,shape,transform,sourceX,polygon,inPoly,bounds,fits,overlap,facility,inside,cover,ledger,entry,seat,priority,wants,release,reserve,prepare,move,overlapsPathBounds,blocked,label,validate,rebuild};
});
