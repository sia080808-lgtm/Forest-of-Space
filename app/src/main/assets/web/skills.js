(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestSkills=api;})(globalThis,function(){
'use strict';
// SRS v2.36 친구 고유 스킬 (user: "케릭터별 고유 스킬들 … 잘 구현되어 있나?" → "이게 시스템적 부분이라서" → "ㄱㄱ").
// Each friend kind takes one worry off the forest, by itself, when it is well enough:
//   슈퍼범 빗물 나눔 (social.js A04) · 엘레판 잎 우산 (social.js CANOPY) — kept, only counted and described here
//   베이치 물 찾기: digs up the water still held in damp soil into a small puddle and shows a thirsty friend where water is
//   코로나 낙엽 모으기: carries loose leaves (which never rot) onto a pile, where they turn into compost
//   리들리 잎 털어 주기: brushes spider mites / mealybugs off a friend's leaves with its hands
//   엘리시 촉촉한 잎 곁: beside moss it keeps nearby leaves moist (no spider mites) and calls natural enemies sooner
// Water and leaves only move (water balance and the floor-leaf count stay the same). The engine calls prepare once a
// tick and act for each active friend; rendering only reads.
const dep=n=>typeof module==='object'?require('./'+n+'.js'):globalThis[{spatial:'ForestSpace',vitals:'ForestVitals',litter:'ForestLitter',creatures:'ForestCreatures',shelter:'ForestShelter',world:'ForestWorld',environment:'ForestEnvironment'}[n]];
const SK=Object.freeze({
 dig:Object.freeze({species:'bosong',rest:600,reach:.6,soil:.8,minS:1.5,amount:8,take:.7,life:600,evap:.1/60,max:2,go:40,sniff:6,cost:1,springLow:.5}),
 guide:Object.freeze({rest:180,go:60,hold:120}),
 carry:Object.freeze({species:'jureong',energy:50,reach:.6,drop:.8,most:5,pick:2,cost:.5,rest:180,go:40}),
 brush:Object.freeze({species:'ridley',reach:.4,min:15,amount:15,time:20,go:30,cost:1,rest:180}),
 mist:Object.freeze({species:'bonbon',moss:.2,range:.15,humid:15,assist:.25})
});
const INFO=Object.freeze({
 superbum:{name:'빗물 나눔',line:'머리 둥지에 모은 빗물을 목마른 친구에게 걸어가 나눠 줘요.'},
 bosong:{name:'물 찾기',line:'비가 없을 때 촉촉한 흙에서 숨은 물을 찾아 웅덩이를 만들고, 목마른 친구에게 물이 있는 곳을 알려 줘요.'},
 neolbi:{name:'잎 우산',line:'비가 오면 넓은 잎을 펴서 곁의 친구를 비에서 지켜 줘요.'},
 jureong:{name:'낙엽 모으기',line:'흩어진 낱잎을 낙엽 더미로 모아 거름이 빨리 쌓이게 해요.'},
 ridley:{name:'잎 털어 주기',line:'잎응애·솜깍지가 붙은 친구의 잎을 손으로 털어 줘요. 짐꾼개미도 리들리를 따라와요.'},
 bonbon:{name:'촉촉한 잎 곁',line:'이끼 곁에 있으면 둘레 친구들의 잎을 촉촉하게 해 잎응애를 막고, 천적을 빨리 불러요.'}
});
const FIRST=Object.freeze({superbum:'슈퍼범이 처음으로 빗물을 나눠 주었어요.',bosong:'베이치가 처음으로 숨은 물을 찾았어요.',neolbi:'엘레판이 처음으로 잎 우산을 펴 주었어요.',jureong:'코로나가 처음으로 낙엽을 모았어요.',ridley:'리들리가 처음으로 친구의 잎을 털어 주었어요.',bonbon:'엘리시 곁의 잎이 촉촉해졌어요.'});
const KINDS=['dig','guide','carry','brush'],eps=1e-9,DAY=1200;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function init(s){s.skills??={puddles:[],nextId:1,seen:{}};s.skills.puddles??=[];s.skills.seen??={};s.skills.nextId??=1;return s.skills;}
const puddles=s=>s.skills?.puddles||[];
function water(s){return puddles(s).reduce((v,p)=>v+p.W,0);}
function precip(s){const E=dep('environment');return E.precipitation(s,'rain')+E.precipitation(s,'snow');}
function band(p){return dep('vitals').band(p);}
function unsafe(s,p){const Sh=dep('shelter');return s.weather.wind>=60||!!p.shelterRequest||!!p.shelter?.facilityId||!!Sh.inside?.(s,p)||dep('vitals').sleepTime(s,p)||precip(s)>=.6;}
// well enough to help others (SK-01 6): not thirsty, hungry or tired, not recovering and not in danger
function well(s,p){const b=band(p);return p.active&&!p.mounted&&p.B>=b.warnLo&&p.nutrition>=b.warnLo&&p.energy>=40&&!p.wetRecovery&&!p.leafRecovery&&p.burden<40&&!unsafe(s,p);}
function free(s,p,held,busy){return p.active&&!p.mounted&&p.id!==held&&!busy.has(p.id)&&!p.objectTask&&!p.skill&&!p.skillHold&&!p.sleepHere&&!p.braceHere&&!p.restSelf&&!(p.stroll&&(p.stroll.lake||p.stroll.puddle))&&!p.guideTo;}
const thirsty=p=>p.active&&!p.mounted&&p.B<band(p).warnLo;
function ready(s,p,k){return !(p.skillRest?.[k]>s.worldTick);}
function rest(s,p,k,secs){(p.skillRest??={})[k]=s.worldTick+secs;}
function bump(s,p,ctx){const d=Math.floor(s.worldTick/DAY);if(!p.skillDay||p.skillDay.d!==d)p.skillDay={d,n:0};p.skillDay.n++;const st=init(s);
 if(!st.seen[p.species]&&FIRST[p.species]){st.seen[p.species]=s.worldTick;ctx?.discovery?.(s,'skill-'+p.species,FIRST[p.species],ctx.visible!==false);}}
function today(s,p){return p.skillDay&&p.skillDay.d===Math.floor(s.worldTick/DAY)?p.skillDay.n:0;}
// ---- 베이치 물 찾기 ----
function soilSpots(s,from){return s.patches.filter(z=>z.id!=='shelter'&&z.cap>0&&z.S>=SK.dig.minS&&dist(z,from)<SK.dig.soil).sort((a,b)=>b.S-a.S||dist(a,from)-dist(b,from)||a.id.localeCompare(b.id));}
function puddleSpot(s,z,p){const Space=dep('spatial'),sock=Space.socket(s,z.id,p.id);for(const q of [sock,{x:z.x+.06,y:z.y+.05},{x:z.x-.06,y:z.y+.05},{x:z.x,y:z.y+.08},{x:z.x+.09,y:z.y},{x:z.x-.09,y:z.y},{x:z.x,y:z.y+.11}])if(q&&Space.walkable(s,q,p.id)&&!puddles(s).some(d=>dist(d,q)<.05))return {x:q.x,y:q.y};return null;}
// the nearest real water a thirsty friend can be shown (SK-03 동료 안내)
function waterFor(s,r){const W=dep('world'),out=[];for(const d of puddles(s))if(d.W>=1)out.push({kind:'puddle',id:d.id,x:d.x,y:d.y});
 const c=s.patches.find(z=>z.id==='crevice');if(c&&c.W>=1)out.push({kind:'crevice',x:c.x,y:c.y});
 if(W.lakeOpen?.(s)&&!W.frozen?.(s)){const q=W.shorePoint?.(s,r);if(q)out.push({kind:'lake',x:q.x,y:q.y});}
 if(s.spring.water>=2)out.push({kind:'spring',x:s.spring.x,y:s.spring.y});
 const order=['puddle','crevice','lake','spring'];return out.sort((a,b)=>dist(a,r)-dist(b,r)||order.indexOf(a.kind)-order.indexOf(b.kind))[0]||null;}
function show(s,r,w,by){if(!w)return;r.guideTo={kind:w.kind,id:w.id,x:w.x,y:w.y,until:s.worldTick+SK.guide.hold,by:by.id};r.nextObjectChoice=s.worldTick;}
function startBosong(s,p,ctx){const D=SK.dig,friends=s.individuals.filter(q=>q.id!==p.id&&thirsty(q)&&dist(q,p)<D.reach&&!q.guideTo).sort((a,b)=>a.B-b.B||a.id.localeCompare(b.id));
 if(ready(s,p,'dig')&&precip(s)<.25&&puddles(s).length<D.max&&(friends.length||s.spring.water<D.springLow*s.spring.capacity)){for(const z of soilSpots(s,p)){const at=puddleSpot(s,z,p);if(at&&dep('spatial').route(s,p,at)){p.skill={k:'dig',from:z.id,x:at.x,y:at.y,phase:'go',start:s.worldTick};rest(s,p,'dig',D.rest);return true;}}}
 if(ready(s,p,'guide')&&friends.length){const r=friends[0],w=waterFor(s,r);if(w){show(s,r,w,p);p.skill={k:'guide',x:w.x,y:w.y,target:r.id,phase:'go',start:s.worldTick};rest(s,p,'guide',SK.guide.rest);bump(s,p,ctx);ctx?.event?.(s,'skill',p.name+' · '+r.name+'에게 물이 있는 곳을 알려 주었어요.',{individual:p.id});return true;}}
 return false;}
// ---- 코로나 낙엽 모으기 ----
function looseFor(s,p){const L=dep('litter'),withPile=new Set(L.piles(s).map(q=>q.sector));return L.leaves(s).filter(l=>!withPile.has(l.sector)&&dist(l,p)<SK.carry.reach).sort((a,b)=>dist(a,p)-dist(b,p)||a.id-b.id)[0]||null;}
function dropFor(s,from,sector){const L=dep('litter'),pile=L.piles(s).filter(q=>L.sectorRaw(s,q.sector)+1<=L.SECTOR&&dist(q,from)<SK.carry.drop).sort((a,b)=>dist(a,from)-dist(b,from)||a.id.localeCompare(b.id))[0];if(pile)return {sector:pile.sector,x:pile.x,y:pile.y+.012,pile:pile.id};
 const count={};for(const l of L.leaves(s))if(l.sector!==sector)count[l.sector]=(count[l.sector]||[]).concat(l);
 const best=Object.values(count).filter(g=>g.length>=2&&L.sectorRaw(s,g[0].sector)+1<=L.SECTOR&&dist(g[0],from)<SK.carry.drop).sort((a,b)=>b.length-a.length||dist(a[0],from)-dist(b[0],from)||a[0].sector-b[0].sector)[0];
 if(!best)return null;const c={x:best.reduce((v,l)=>v+l.x,0)/best.length,y:best.reduce((v,l)=>v+l.y,0)/best.length};return {sector:best[0].sector,x:c.x,y:c.y};}
function startCarry(s,p,ctx){if(!ready(s,p,'carry')||p.energy<SK.carry.energy||!dep('vitals').isDay(s)||precip(s)>=.25)return false;const l=looseFor(s,p);if(!l)return false;const to=dropFor(s,l,l.sector);if(!to)return false;
 p.skill={k:'carry',leaf:l.id,x:l.x,y:l.y,to,phase:'go',start:s.worldTick,n:0};return true;}
// ---- 리들리 잎 털어 주기 ----
function pest(s,q){const o=dep('creatures').onLeaf(s,q.id);return Math.max(o.mite?.density||0,o.mealy?.density||0);}
const ga=n=>{const c=n.charCodeAt(n.length-1)-44032;return c>=0&&c<11172&&c%28?'이':'가';};
function startBrush(s,p,held,busy){if(!ready(s,p,'brush'))return false;const Sh=dep('shelter');
 const r=s.individuals.filter(q=>q.id!==p.id&&q.active&&!q.mounted&&q.id!==held&&!busy.has(q.id)&&!q.skill&&!q.skillHold&&!Sh.inside?.(s,q)&&!q.shelter?.facilityId&&dist(q,p)<SK.brush.reach&&pest(s,q)>=SK.brush.min).sort((a,b)=>pest(s,b)-pest(s,a)||a.id.localeCompare(b.id))[0];
 if(!r||!dep('spatial').route(s,p,side(s,p,r)))return false;p.skill={k:'brush',target:r.id,phase:'go',start:s.worldTick};return true;}
function side(s,p,r){const Space=dep('spatial'),gap=.4*(Space.diameter(p)+Space.diameter(r))+.01;for(const dx of [p.x<=r.x?-1:1,p.x<=r.x?1:-1]){const q={x:r.x+dx*gap,y:r.y+.004};if(Space.walkable(s,q,p.id))return q;}return {x:r.x+(p.x<=r.x?-gap:gap),y:r.y};}
// ---- 엘리시 촉촉한 잎 곁 (always on while it holds) ----
function misters(s){return s.individuals.filter(p=>p.species===SK.mist.species&&p.active&&!p.mounted&&p.energy>=40&&p.B>=band(p).warnLo&&!dep('shelter').inside?.(s,p)&&s.patches.some(z=>z.id==='moss'&&dist(z,p)<SK.mist.moss));}
function moistLeaf(s,q){return misters(s).some(e=>dist(e,q)<SK.mist.range)?SK.mist.humid:0;}
function assist(s,q){return !!q&&misters(s).some(e=>dist(e,q)<SK.mist.assist);}
// ---- puddles (SK-03) ----
function puddleStep(s){const st=init(s);for(const d of [...st.puddles]){const e=Math.min(d.W,SK.dig.evap);d.W-=e;s.ledger.evaporation+=e;
 if(s.worldTick-d.born>=SK.dig.life||d.W<=eps){const z=s.patches.find(z=>z.id===d.from),back=z?Math.min(d.W,Math.max(0,z.cap-z.S)):0;if(z)z.S+=back;s.ledger.outflow+=d.W-back;st.puddles=st.puddles.filter(x=>x!==d);for(const p of s.individuals)if(p.guideTo?.id===d.id)delete p.guideTo;}}}
// ---- one tick: puddles, counting the kept skills, starting new ones ----
function prepare(s,{held=null,busy=new Set(),event,discovery,visible=true}={}){init(s);puddleStep(s);const ctx={event,discovery,visible};
 for(const p of s.individuals){if(p.guideTo&&(p.guideTo.until<=s.worldTick||!p.active||p.B>=band(p).mid))delete p.guideTo;if(p.skill&&!p.active)stop(s,p);if(p.skillHold&&!s.individuals.some(q=>q.skill?.k==='brush'&&q.skill.target===p.id&&q.id===p.skillHold))delete p.skillHold;}
 for(const a of s.social?.sessions||[])if(a.started===s.worldTick&&(a.type==='A04'||a.type==='CANOPY')){const d=s.individuals.find(q=>q.id===a.ids[0]);if(d)bump(s,d,ctx);}
 if(!s.skills.seen.bonbon&&misters(s).some(e=>s.individuals.some(q=>q.id!==e.id&&q.active&&dist(q,e)<SK.mist.range))){const e=misters(s)[0];bump(s,e,ctx);}
 for(const p of [...s.individuals].sort((a,b)=>a.id.localeCompare(b.id))){if(!free(s,p,held,busy)||!well(s,p))continue;
  const go=p.species==='bosong'?startBosong(s,p,ctx):p.species==='jureong'?startCarry(s,p,ctx):p.species==='ridley'?startBrush(s,p,held,busy):false;
  if(go&&p.stroll)delete p.stroll;}}
function stop(s,p,why){const t=p.skill;if(!t)return;if(t.leaf&&t.phase==='back'){const L=dep('litter');L.land(s,L.sectorOf(p),{x:p.x,y:p.y+.01});}
 if(t.k==='brush'){const r=s.individuals.find(q=>q.id===t.target);if(r&&r.skillHold===p.id)delete r.skillHold;}
 if(t.k==='carry'&&(t.n>0||why==='rest'))rest(s,p,'carry',SK.carry.rest);delete p.skill;p.nextObjectChoice=s.worldTick;}
// the engine calls this for every active friend; a returned motion means the friend spent this tick on a skill
function act(s,p,ctx={}){const Space=dep('spatial'),Vit=dep('vitals');
 if(p.skillHold){const h=s.individuals.find(q=>q.id===p.skillHold&&q.skill?.k==='brush'&&q.skill.target===p.id&&q.skill.phase==='do');if(h)return {kind:'idle',distance:0};delete p.skillHold;}
 const t=p.skill;if(!t)return null;
 if(!well(s,p)||p.objectTask){stop(s,p);return null;}
 const age=s.worldTick-t.start,walk=to=>{const m=Space.travel(s,p,to);if(m.distance>0)t.stall=0;else if(!m.arrived)t.stall=(t.stall||0)+1;return m;};
 if(t.k==='dig'){
  if(t.phase==='go'){const m=walk(t);if(m.arrived){t.phase='sniff';t.at=s.worldTick;}else if(age>SK.dig.go||t.stall>=4)stop(s,p);return m;}
  if(s.worldTick-t.at<SK.dig.sniff)return {kind:'sniff',distance:0};
  const z=s.patches.find(q=>q.id===t.from),n=z?Math.min(SK.dig.amount,z.S*SK.dig.take):0;
  if(n>=1&&puddles(s).length<SK.dig.max){z.S-=n;const st=init(s),d={id:'pd:'+st.nextId++,x:t.x,y:t.y,W:n,from:z.id,born:s.worldTick,by:p.id};st.puddles.push(d);Vit.energyPts(p,-SK.dig.cost);bump(s,p,ctx);
   ctx.event?.(s,'skill',p.name+' · 촉촉한 흙에서 숨은 물을 찾아 웅덩이를 만들었어요.',{individual:p.id});
   const r=s.individuals.filter(q=>q.id!==p.id&&thirsty(q)&&dist(q,p)<SK.dig.reach).sort((a,b)=>a.B-b.B||a.id.localeCompare(b.id))[0];if(r)show(s,r,{kind:'puddle',id:d.id,x:d.x,y:d.y},p);}
  stop(s,p);return {kind:'idle',distance:0};}
 if(t.k==='guide'){const m=walk(t);if(m.arrived||age>SK.guide.go||t.stall>=4)stop(s,p);return m;}
 if(t.k==='carry'){const L=dep('litter');
  if(t.phase==='go'){const l=L.leaves(s).find(x=>x.id===t.leaf);if(!l){const n=looseFor(s,p),to=n&&dropFor(s,n,n.sector);if(n&&to&&age<=SK.carry.go*SK.carry.most){Object.assign(t,{leaf:n.id,x:n.x,y:n.y,to});return {kind:'idle',distance:0};}stop(s,p);return null;}
   const m=walk(l);if(m.arrived||dist(p,l)<.03){t.phase='pick';t.at=s.worldTick;}else if(t.stall>=4||s.worldTick-(t.legAt??t.start)>SK.carry.go)stop(s,p);return m;}
  if(t.phase==='pick'){if(s.worldTick-t.at<SK.carry.pick)return {kind:'sniff',distance:0};const st=s.objects.litter,l=st.leaves.find(x=>x.id===t.leaf);if(!l){t.phase='go';return {kind:'idle',distance:0};}
   st.leaves=st.leaves.filter(x=>x!==l);t.rot=l.rot;t.sector=l.sector;t.phase='back';t.legAt=s.worldTick;const to=dropFor(s,p,t.sector);if(to)t.to=to;return {kind:'idle',distance:0};}
  if(t.phase==='back'){const P=t.to.pile&&L.pile(s,t.to.pile);if(t.to.pile&&(!P||L.sectorRaw(s,P.sector)+1>L.SECTOR)){const to=dropFor(s,p,t.sector);if(!to){stop(s,p,'rest');return null;}t.to=to;}
   const m=walk(t.to);if(m.arrived||dist(p,t.to)<.04){L.land(s,t.to.sector,{x:t.to.x,y:t.to.y});t.phase='go';t.n++;Vit.energyPts(p,-SK.carry.cost);if(t.n===1){bump(s,p,ctx);ctx.event?.(s,'skill',p.name+' · 흩어진 낙엽을 모으고 있어요.',{individual:p.id});}
    if(t.n>=SK.carry.most||p.energy<SK.carry.energy){stop(s,p,'rest');return m;}const n=looseFor(s,p),to=n&&dropFor(s,n,n.sector);if(!n||!to){stop(s,p,'rest');return m;}Object.assign(t,{leaf:n.id,x:n.x,y:n.y,to,legAt:s.worldTick});return m;}
   if(t.stall>=4||s.worldTick-t.legAt>SK.carry.go){stop(s,p,'rest');return null;}return m;}}
 if(t.k==='brush'){const r=s.individuals.find(q=>q.id===t.target);if(!r||!r.active||r.mounted||dep('shelter').inside?.(s,r)||r.shelter?.facilityId){stop(s,p);return null;}
  if(t.phase==='go'){const at=side(s,p,r),m=walk(at);if(m.arrived||dist(p,at)<.02){if(r.objectTask&&!r.objectTask.free||r.skill){stop(s,p);return m;}t.phase='do';t.at=s.worldTick;r.skillHold=p.id;if(r.stroll&&!r.stroll.lake&&!r.stroll.puddle)delete r.stroll;}else if(age>SK.brush.go||t.stall>=4){stop(s,p);rest(s,p,'brush',60);}return m;}
  if(s.worldTick-t.at<SK.brush.time)return {kind:'brush',distance:0};
  dep('creatures').brush(s,r.id,SK.brush.amount);Vit.energyPts(p,-SK.brush.cost);rest(s,p,'brush',SK.brush.rest);bump(s,p,ctx);ctx.event?.(s,'skill',p.name+' · '+r.name+'의 잎을 털어 주었어요.',{individual:p.id});stop(s,p);return {kind:'idle',distance:0};}
 stop(s,p);return null;}
// leaves a friend is carrying (counted on the floor, SK-04)
function carried(s){return s.individuals.reduce((v,p)=>v+(p.skill?.k==='carry'&&p.skill.phase==='back'?1:0),0);}
// card line for a friend using or receiving a skill (render / UI only)
function status(s,p){const t=p.skill;if(p.skillHold){const h=s.individuals.find(q=>q.id===p.skillHold);if(h)return h.name+ga(h.name)+' 잎을 털어 주고 있어요';}
 if(p.guideTo){const b=s.individuals.find(q=>q.id===p.guideTo.by);const n=b?b.name:'친구';return n+ga(n)+' 알려 준 물로 가고 있어요';}
 if(!t)return misters(s).some(e=>e.id===p.id)?'촉촉한 잎 곁을 지키고 있어요':null;
 if(t.k==='dig')return t.phase==='go'?'숨은 물을 찾으러 가고 있어요':'촉촉한 흙에서 숨은 물을 찾고 있어요';
 if(t.k==='guide'){const r=s.individuals.find(q=>q.id===t.target);return (r?r.name+'에게 ':'')+'물이 있는 곳을 알려 주고 있어요';}
 if(t.k==='carry')return '흩어진 낙엽을 모으고 있어요';
 if(t.k==='brush'){const r=s.individuals.find(q=>q.id===t.target);return (r?r.name+'의 ':'')+(t.phase==='do'?'잎을 털어 주고 있어요':'잎을 털어 주러 가고 있어요');}
 return null;}
function validate(s){const st=s.skills;if(st!==undefined){if(!st||typeof st!=='object'||!Array.isArray(st.puddles)||st.puddles.length>SK.dig.max||!Number.isInteger(st.nextId)||st.nextId<1||typeof st.seen!=='object')throw Error('고유 스킬 기록을 확인해 주세요.');
  for(const d of st.puddles)if(typeof d.id!=='string'||!Number.isFinite(d.x)||!Number.isFinite(d.y)||!(d.W>=0&&d.W<=SK.dig.amount+eps)||!s.patches.some(z=>z.id===d.from)||!(d.born<=s.worldTick))throw Error('웅덩이 기록을 확인해 주세요.');}
 for(const p of s.individuals){const t=p.skill;if(t!==undefined&&(!t||!KINDS.includes(t.k)||!Number.isFinite(t.start)||t.start>s.worldTick||t.k==='carry'&&!(Number.isInteger(t.n)&&t.n>=0&&t.n<=SK.carry.most)))throw Error('고유 스킬 기록을 확인해 주세요.');
  if(p.skillRest!==undefined&&(typeof p.skillRest!=='object'||Object.entries(p.skillRest).some(([k,v])=>!KINDS.includes(k)||!Number.isFinite(v))))throw Error('고유 스킬 기록을 확인해 주세요.');
  if(p.skillDay!==undefined&&!(Number.isInteger(p.skillDay?.d)&&Number.isInteger(p.skillDay?.n)&&p.skillDay.n>=0))throw Error('고유 스킬 기록을 확인해 주세요.');
  if(p.guideTo!==undefined&&!(p.guideTo&&['puddle','crevice','lake','spring'].includes(p.guideTo.kind)&&Number.isFinite(p.guideTo.until)&&Number.isFinite(p.guideTo.x)&&Number.isFinite(p.guideTo.y)))throw Error('물 안내 기록을 확인해 주세요.');
  if(p.skillHold!==undefined&&typeof p.skillHold!=='string')throw Error('고유 스킬 기록을 확인해 주세요.');}}
return Object.freeze({SK,INFO,init,puddles,water,prepare,act,stop,carried,status,validate,moistLeaf,assist,misters,today,waterFor,well});
});
