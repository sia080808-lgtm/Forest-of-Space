(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestSkills=api;})(globalThis,function(){
'use strict';
// SRS v2.36 친구 고유 스킬 (user: "케릭터별 고유 스킬들 … 잘 구현되어 있나?" → "이게 시스템적 부분이라서" → "ㄱㄱ").
// Each friend kind takes one worry off the forest, by itself, when it is well enough:
//   슈퍼범 빗물 나눔 (social.js A04) · 엘레판 잎 우산 (social.js CANOPY) — kept, only counted and described here
//   베이치 물 찾기: digs up the water still held in damp soil into a small puddle and shows a thirsty friend where water is
//   코로나 낙엽 모으기: rakes loose leaves (which never rot) together into a pile where they lie, so they turn into compost
//   리들리 잎 털어 주기: brushes spider mites / mealybugs off a friend's leaves with its hands
//   엘리시 촉촉한 잎 곁: beside moss it keeps nearby leaves moist (no spider mites) and calls natural enemies sooner
// Water and leaves only move (water balance and the floor-leaf count stay the same). The engine calls prepare once a
// tick and act for each active friend; rendering only reads.
const dep=n=>typeof module==='object'?require('./'+n+'.js'):globalThis[{spatial:'ForestSpace',vitals:'ForestVitals',litter:'ForestLitter',objects:'ForestObjects',creatures:'ForestCreatures',shelter:'ForestShelter',world:'ForestWorld',environment:'ForestEnvironment','leaf-state':'ForestLeafState'}[n]];
const SK=Object.freeze({
 dig:Object.freeze({species:'bosong',rest:600,reach:.6,soil:.8,minS:1.5,amount:8,take:.7,life:600,evap:.1/60,max:2,go:40,sniff:6,cost:1,springLow:.5}),
 guide:Object.freeze({rest:30,go:60,hold:120}),
 rake:Object.freeze({species:'jureong',energy:50,reach:.6,min:2,per:2,cost:.5,rest:30,go:40}),
 brush:Object.freeze({species:'ridley',reach:.4,min:15,amount:15,time:3,go:30,cost:1,rest:10,repeat:30}),
 mist:Object.freeze({species:'bonbon',moss:.2,range:.15,humid:15,assist:.25})
});
// 1.1.3 스킬 레벨 (SRS v2.37, user: "스킬별은 하나 제대로 수치 테이블 만들어 보자" → "ㄱㄱ 1.1.3"). Each skill grows at
// levels 3, 6 and 9 (like the hexagon stats); 코로나 and 리들리 take one more step at Lv10. Columns: Lv1-2, 3-5, 6-8, 9, 10.
// Lv1 is the 1.1.0 value. Nothing here is saved: values come from the friend's level.
const LEVEL=Object.freeze({
 dig:{amount:[8,10,12,14,14],reach:[.6,.6,.75,.75,.75],rest:[600,600,600,480,480]},
 rake:{count:[1,2,3,4,5],energy:[50,50,40,40,40]},
 brush:{amount:[15,30,50,75,100],reach:[.4,.4,.5,.5,.5]},
 mend:{amount:[10,14,18,22,26]},
 mist:{range:[.15,.18,.21,.25,.25],humid:[15,15,20,20,20],assist:[.25,.25,.25,.3,.3]},
 share:{total:[10,12,14,16,16],nest:[40,40,45,50,50]},
 umbrella:{rain:[.5,.6,.7,.8,.8],wind:[.4,.45,.55,.65,.65],limit:[70,70,75,80,80]}
});
const LEVELS=[0,3,8,15,25,40,60,85,115,150];
function levelOf(p){let n=1;LEVELS.forEach((x,i)=>{if((p?.xp||0)>=x)n=i+1;});return n;}
function tier(p){const L=levelOf(p);return L>=10?4:L>=9?3:L>=6?2:L>=3?1:0;}
function lv(p,k,f){return LEVEL[k][f][tier(p)];}
// 엘레판 잎 우산 and 슈퍼범 빗물 나눔 live in weather-care.js / social.js; they read their numbers here
function umbrella(h){return {rain:lv(h,'umbrella','rain'),wind:lv(h,'umbrella','wind'),limit:lv(h,'umbrella','limit')};}
function share(d){return {total:lv(d,'share','total'),nest:lv(d,'share','nest')};}
const NEXT=[3,6,9,10];
const MEND=Object.freeze({time:3,rest:5,repeat:30,reach:.30,go:30});
const INFO=Object.freeze({
 dico:{name:'잎 수선',line:'작은 거미와 함께 찢어진 친구의 잎을 3초 동안 꿰매요. 수선 시작부터 5초마다 쓸 수 있고, 같은 친구는 수선 성공 후 30초가 지나야 다시 도와줘요.'},
 maria:{name:'같이 수영할래?',line:'잔잔한 낮에 친구를 호수로 이끌어 함께 헤엄쳐요. 10초 동안 각자 수분 적정 상한까지 채워요.'},
 superbum:{name:'빗물 나눔',line:'머리 둥지에 모은 빗물을 목마른 친구에게 걸어가 나눠 줘요. 같은 친구는 30초, 다른 교감은 10초 쉬어요.'},
 bosong:{name:'물 찾기',line:'비가 없을 때 촉촉한 흙에서 숨은 물을 찾아 웅덩이를 만들고, 목마른 친구에게 물이 있는 곳을 알려 줘요. 물 안내는 30초마다 할 수 있어요.'},
 neolbi:{name:'잎 우산',line:'비가 오면 넓은 잎을 펴서 곁의 친구를 비에서 지켜 줘요. 같은 친구는 30초, 다른 교감은 10초 쉬어요.'},
 jureong:{name:'낙엽 모으기',line:'흩어진 낱잎을 늘어진 잎으로 한데 긁어모아 낙엽 더미로 만들어요. 낱잎은 썩지 않지만 더미에서는 거름이 돼요.'},
 ridley:{name:'잎 털어 주기',line:'친구의 잎응애·솜깍지를 3초 동안 털어 줘요. 자기 머리를 3초 동안 정돈할 때도 같은 양을 털어요. 자기 정돈은 별도로 10초 쉬어요. 짐꾼개미도 리들리를 따라와요.'},
 bonbon:{name:'촉촉한 잎 곁',line:'이끼·샘터·웅덩이·호숫가 곁이나 비·안개 오는 날이면 둘레 친구들의 잎을 촉촉하게 해 잎응애를 막고, 천적을 빨리 불러요.'}
});
const FIRST=Object.freeze({dico:'디코가 처음으로 친구의 찢어진 잎을 수선했어요.',superbum:'슈퍼범이 처음으로 빗물을 나눠 주었어요.',bosong:'베이치가 처음으로 숨은 물을 찾았어요.',neolbi:'엘레판이 처음으로 잎 우산을 펴 주었어요.',jureong:'코로나가 처음으로 낙엽을 모았어요.',ridley:'리들리가 처음으로 친구의 잎을 털어 주었어요.',bonbon:'엘리시 곁의 잎이 촉촉해졌어요.'});
const KINDS=['dig','guide','rake','brush','mend'],eps=1e-9,DAY=1200;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function init(s){s.skills??={puddles:[],nextId:1,seen:{}};s.skills.puddles??=[];s.skills.seen??={};s.skills.nextId??=1;return s.skills;}
const puddles=s=>s.skills?.puddles||[];
function water(s){return puddles(s).reduce((v,p)=>v+p.W,0);}
function precip(s){const E=dep('environment');return E.precipitation(s,'rain')+E.precipitation(s,'snow');}
function band(p){return dep('vitals').band(p);}
function unsafeOutside(s,p,postponeShelter=false){
 const Sh=dep('shelter');
 const takingShelter=!postponeShelter&&(p.shelterRequest||p.shelter?.facilityId||Sh.inside?.(s,p));
 return s.weather.wind>=60||takingShelter||precip(s)>=.6;
}
// An energetic Dico can step away from a short outdoor rest, even at night.
function well(s,p,postponeShelter=false){
 const b=band(p),dico=p.species==='dico';
 const needsSleep=dep('vitals').sleepTime(s,p)&&(!dico||p.energy<50);
 return p.active&&!p.mounted&&p.B>=b.warnLo&&p.nutrition>=b.warnLo&&p.energy>=40&&
  !p.wetRecovery&&!p.leafRecovery&&p.burden<40&&!needsSleep&&!unsafeOutside(s,p,postponeShelter);
}
function outdoorRest(task){return task?.reason==='sleep'&&task.object!=='shelter';}
function canPauseForMending(p){
 const task=p.objectTask;
 return !task||task.free||outdoorRest(task)||task.reason==='nutrition'&&p.nutrition>=band(p).warnLo;
}
function free(s,p,held,busy,forMending=false){
 const task=p.objectTask;
 const canSetAsideVisit=p.species===SK.brush.species||p.species===SK.dig.species;
 const canLeave=forMending?canPauseForMending(p):!p.sleepHere&&(!task||canSetAsideVisit&&task.free);
 return p.active&&!p.mounted&&p.id!==held&&!busy.has(p.id)&&!p.skill&&!p.skillHold&&
  canLeave&&
  !p.braceHere&&!p.restSelf&&!(p.stroll&&(p.stroll.lake||p.stroll.puddle))&&!p.guideTo;
}
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
// 1.2.12 (user: "베이치가 무슨 물을 알려준다고 빈 샘터를 가리킴?"): the spring or crevice is shown only while it still holds a
// real drink for this friend (what it needs up to the middle of its band, at most 10 ≈ a minute of drinking) after what the
// friends already heading there will drink; a nearly empty spring used to be shown and was gone before the friend arrived.
// The lake never runs dry; a puddle is the one 베이치 just dug for it.
const DRINK_MIN=10;
function need(q){return Math.max(1,Math.min(DRINK_MIN,band(q).mid-q.B));}
function enough(s,r,id,have){const others=s.individuals.filter(q=>q.id!==r.id&&q.active&&(q.guideTo?(q.guideTo.id??q.guideTo.kind)===id:q.objectTask?.object===id&&q.objectTask.reason==='water'));return have-others.reduce((n,q)=>n+need(q),0)>=need(r);}
function waterFor(s,r){const W=dep('world'),O=dep('objects'),out=[];for(const d of puddles(s))if(d.W>=1)out.push({kind:'puddle',id:d.id,x:d.x,y:d.y});
 for(const c of O.patchesOf(s,'crevice'))if(c.W>=1&&enough(s,r,c.id,c.W))out.push({kind:'crevice',id:O.isCopy(c.id)?c.id:undefined,x:c.x,y:c.y});
 if(W.lakeOpen?.(s)&&!W.frozen?.(s)){const q=W.shorePoint?.(s,r);if(q)out.push({kind:'lake',x:q.x,y:q.y});}
 for(const z of O.springs(s))if(z.water>=2&&enough(s,r,O.objectId(z),z.water))out.push({kind:'spring',id:z.id,x:z.x,y:z.y});
 const order=['puddle','crevice','lake','spring'];return out.sort((a,b)=>dist(a,r)-dist(b,r)||order.indexOf(a.kind)-order.indexOf(b.kind))[0]||null;}
function show(s,r,w,by){if(!w)return;r.guideTo={kind:w.kind,id:w.id,x:w.x,y:w.y,until:s.worldTick+SK.guide.hold,by:by.id};r.nextObjectChoice=s.worldTick;}
function startBosong(s,p,ctx){
 const D=SK.dig,Obj=dep('objects');
 const friends=s.individuals.filter(q=>q.id!==p.id&&thirsty(q)&&dist(q,p)<lv(p,'dig','reach')&&!q.guideTo)
  .sort((a,b)=>a.B-b.B||a.id.localeCompare(b.id));
 if(ready(s,p,'dig')&&precip(s)<.25&&puddles(s).length<D.max&&
  (friends.length||Obj.springs(s).every(z=>z.water<D.springLow*z.capacity))){
  for(const z of soilSpots(s,p)){
   const at=puddleSpot(s,z,p);
   if(!at||!dep('spatial').route(s,p,at))continue;
   if(p.objectTask?.free)Obj.release(s,p,'interrupt');
   p.skill={k:'dig',from:z.id,x:at.x,y:at.y,phase:'go',start:s.worldTick};
   rest(s,p,'dig',lv(p,'dig','rest'));return true;
  }
 }
 if(!ready(s,p,'guide')||!friends.length)return false;
 const r=friends[0],w=waterFor(s,r);
 if(!w)return false;
 if(p.objectTask?.free)Obj.release(s,p,'interrupt');
 show(s,r,w,p);
 p.skill={k:'guide',x:w.x,y:w.y,target:r.id,phase:'go',start:s.worldTick};
 rest(s,p,'guide',SK.guide.rest);bump(s,p,ctx);
 ctx?.event?.(s,'skill',p.name+' · '+r.name+'에게 물이 있는 곳을 알려 주었어요.',{individual:p.id});
 return true;
}
// ---- 코로나 낙엽 모으기 ----
// 1.1.3 (user: "1레벨엔 한개 모아오고 3레벨엔 두개 … 10레벨에 한번에 5개"): one rake sweeps up to 1/2/3/4/5 loose leaves
// (by level) onto the nearest pile within reach, or, with no pile there, onto another loose leaf so they become a
// pile. Leaves come from within GATHER of that spot; the spot's sector must have room for the ones coming in.
const GATHER=.25;
function rakeFor(s,p){const L=dep('litter'),n=lv(p,'rake','count'),leaves=L.leaves(s),piles=L.piles(s),out=[];
 const take=(to,skip)=>leaves.filter(l=>l.id!==skip&&dist(l,to)<GATHER&&!(to.pile&&l.sector===to.sector&&dist(l,to)<.02)).sort((a,b)=>dist(a,to)-dist(b,to)||a.id-b.id).slice(0,n);
 const room=(sec,ids)=>L.sectorRaw(s,sec)+ids.filter(l=>l.sector!==sec).length<=L.SECTOR;
 for(const q of piles)if(dist(q,p)<SK.rake.reach){const ids=take(q,null);if(ids.length&&room(q.sector,ids))out.push({pile:q.id,anchor:null,sector:q.sector,x:q.x,y:q.y,ids});}
 const withPile=new Set(piles.map(q=>q.sector));
 for(const a of leaves)if(!withPile.has(a.sector)&&dist(a,p)<SK.rake.reach){const ids=take(a,a.id);if(ids.length&&room(a.sector,ids))out.push({pile:null,anchor:a.id,sector:a.sector,x:a.x,y:a.y,ids});}
 return out.sort((a,b)=>b.ids.length-a.ids.length||(a.pile?0:1)-(b.pile?0:1)||dist(a,p)-dist(b,p)||a.sector-b.sector)[0]||null;}
function startRake(s,p){if(!ready(s,p,'rake')||p.energy<lv(p,'rake','energy')||!dep('vitals').isDay(s)||precip(s)>=.25)return false;const c=rakeFor(s,p);if(!c)return false;const Space=dep('spatial');
 let at=null;for(const q of [{x:c.x,y:c.y+.03},{x:c.x+.04,y:c.y+.02},{x:c.x-.04,y:c.y+.02},{x:c.x,y:c.y}])if(Space.walkable(s,q,p.id)){at=q;break;}if(!at||!Space.route(s,p,at))return false;
 p.skill={k:'rake',sector:c.sector,ids:c.ids.map(l=>l.id),pile:c.pile,anchor:c.anchor,cx:c.x,cy:c.y,x:at.x,y:at.y,phase:'go',start:s.worldTick};rest(s,p,'rake',SK.rake.rest);return true;}
// ---- 리들리 잎 털어 주기 ----
// Ridley uses the same level amount on itself, with its own cooldown.
function selfBrush(s,p,ctx={}){if(p.species!==SK.brush.species||!p.active||!ready(s,p,'self'))return 0;if(!(pest(s,p)>0))return 0;const n=dep('creatures').brush(s,p.id,lv(p,'brush','amount'));if(!(n>0))return 0;dep('vitals').energyPts(p,-SK.brush.cost);rest(s,p,'self',SK.brush.rest);ctx.event?.(s,'skill',p.name+' · 머리를 쓰다듬어 자기 잎을 털어 냈어요.',{individual:p.id});return n;}
function pest(s,q){const o=dep('creatures').onLeaf(s,q.id);return Math.max(o.mite?.density||0,o.mealy?.density||0);}
const ga=n=>{const c=n.charCodeAt(n.length-1)-44032;return c>=0&&c<11172&&c%28?'이':'가';};
function startBrush(s,p,held,busy,preview=false){
 if(!ready(s,p,'brush'))return false;
 const Sh=dep('shelter'),Space=dep('spatial');
 const candidates=s.individuals.filter(q=>q.id!==p.id&&q.active&&!q.mounted&&q.id!==held&&!busy.has(q.id)&&
  !q.skill&&!q.skillHold&&!(q.objectTask&&!q.objectTask.free)&&!Sh.inside?.(s,q)&&!q.shelter?.facilityId&&
  dist(q,p)<lv(p,'brush','reach')&&pest(s,q)>=SK.brush.min&&
  (preview||s.worldTick-(q.brushedAt??-Infinity)>=SK.brush.repeat)&&
  !s.individuals.some(other=>other.skill?.k==='brush'&&other.skill.target===q.id))
  .sort((a,b)=>pest(s,b)-pest(s,a)||a.id.localeCompare(b.id));
 for(const r of candidates){
  if(!Space.route(s,p,side(s,p,r)))continue;
  if(p.objectTask?.free)dep('objects').release(s,p,'interrupt');
  p.skill={k:'brush',target:r.id,phase:'go',start:s.worldTick};
  return true;
 }
 if(candidates.length)rest(s,p,'brush',SK.brush.rest);
 return false;
}
function runBrush(s,p,t,walk,ctx){
 const r=s.individuals.find(q=>q.id===t.target),Sh=dep('shelter');
 if(!r?.active||r.mounted||r.id===ctx.held||ctx.busy?.has(r.id)||Sh.inside?.(s,r)||r.shelter?.facilityId){
  stop(s,p);return null;
 }
 if(t.phase==='go'){
  const at=side(s,p,r),m=walk(at);
  if(m.arrived||dist(p,at)<.02){
   if(r.objectTask&&!r.objectTask.free||r.skill||r.skillHold){
    if(s.worldTick-t.start>=SK.brush.go)stop(s,p);
    return m;
   }
   t.phase='do';t.at=s.worldTick;r.skillHold=p.id;
   if(r.stroll&&!r.stroll.lake&&!r.stroll.puddle)delete r.stroll;
   rest(s,p,'brush',SK.brush.rest);
   return {...m,kind:'brush'};
  }else if(s.worldTick-t.start>=SK.brush.go||t.stall>=4)stop(s,p);
  return m;
 }
 if(r.skillHold!==p.id){stop(s,p);return null;}
 if(s.worldTick-t.at<SK.brush.time)return {kind:'brush',distance:0};
 dep('creatures').brush(s,r.id,lv(p,'brush','amount'));
 dep('vitals').energyPts(p,-SK.brush.cost);
 r.brushedAt=s.worldTick;
 bump(s,p,ctx);ctx.event?.(s,'skill',p.name+' · '+r.name+'의 잎을 털어 주었어요.',{individual:p.id});
 stop(s,p,true);return {kind:'idle',distance:0};
}
/* 1.2.6: the spot beside the friend must also be clear of the other friends — it could fall inside a third friend's body (a big 슈퍼범 next to it), the walk there never found a way and the brush gave up every time *//* 1.2.7: 리들리 now taps with the curled tip of its front leaf (about 0.69 of its drawn width ahead of its centre), so it stands where that tip just meets the friend's leaves (rig.js tapFx) */function side(s,p,r){const Space=dep('spatial'),Sh=dep('shelter'),sz=q=>Space.diameter(q)/.0666667,gap=Math.max(.4*(Space.diameter(p)+Space.diameter(r))+.01,.046*Sh.growth(p)*sz(p)+.0347*Sh.growth(r)*sz(r)-.005),   /* never closer than the walk lets two friends stand */clear=q=>Space.walkable(s,q,p.id)&&!s.individuals.some(z=>z.id!==p.id&&z.id!==r.id&&z.active&&!z.mounted&&Math.hypot(z.x-q.x,z.y-q.y)<.4*(Space.diameter(p)+Space.diameter(z)));const L=p.x<=r.x?-1:1;for(const [dx,dy] of [[L,.004],[-L,.004],[L*.7,.04],[-L*.7,.04],[0,.06]]){const q={x:r.x+dx*gap,y:r.y+dy};if(clear(q))return q;}for(const dx of [L,-L]){const q={x:r.x+dx*gap,y:r.y+.004};if(Space.walkable(s,q,p.id))return q;}return {x:r.x+(p.x<=r.x?-gap:gap),y:r.y};}
// ---- 엘리시 촉촉한 잎 곁 (always on while it holds) ----
// 1.2.7 (user: "엘리시는 이끼에서만 스킬쓰나" → "1,2로 가고"): besides moss, 엘리시 keeps leaves moist beside other water —
// the spring (with water), a puddle, the open lakeshore — and anywhere on a rain or fog day. Only cheap distance checks.
function wetBy(s,p){const near=SK.mist.moss;if(dep('objects').patchesOf(s,'moss').some(z=>dist(z,p)<near))return true;
 if(dep('objects').springs(s).some(z=>z.water>0&&dist(z,p)<near))return true;if(puddles(s).some(d=>d.W>0&&dist(d,p)<near))return true;
 const W=dep('world');if(W?.lakeOpen?.(s)&&!W.frozen(s)&&W.waterD(p.x,p.y)<SHORE)return true;
 const E=dep('environment');return !!s.environment?.storm||!!E&&(E.precipitation(s,'rain')>=.15||E.precipitation(s,'fog')>=.3);}
const SHORE=1.3;   // lake shape distance: the shore sits at about 1.07, so 1.3 is about 0.2 out on the land
function misters(s){return s.individuals.filter(p=>p.species===SK.mist.species&&p.active&&!p.mounted&&p.energy>=40&&p.B>=band(p).warnLo&&!dep('shelter').inside?.(s,p)&&wetBy(s,p));}
function moistLeaf(s,q){return misters(s).reduce((v,e)=>dist(e,q)<lv(e,'mist','range')?Math.max(v,lv(e,'mist','humid')):v,0);}
function assist(s,q){return !!q&&misters(s).some(e=>dist(e,q)<lv(e,'mist','assist'));}
// ---- puddles (SK-03) ----
function puddleStep(s){const st=init(s);for(const d of [...st.puddles]){const e=Math.min(d.W,SK.dig.evap);d.W-=e;s.ledger.evaporation+=e;
 if(s.worldTick-d.born>=SK.dig.life||d.W<=eps){const z=[...s.patches,...(s.objects?.stored||[])].find(z=>z.id===d.from),back=z?Math.min(d.W,Math.max(0,z.cap-z.S)):0;if(z)z.S+=back;s.ledger.outflow+=d.W-back;st.puddles=st.puddles.filter(x=>x!==d);for(const p of s.individuals)if(p.guideTo?.id===d.id)delete p.guideTo;}}}
function canMend(s,p,r,held,busy){
 if(!r||r.id===p.id||!r.active||r.mounted||r.id===held||busy?.has(r.id)||r.skill||
  r.skillHold&&r.skillHold!==p.id||r.settleUntil>=s.worldTick||r.braceHere||r.stroll?.perch||r.stroll?.shelf)
  return false;
 const Leaf=dep('leaf-state'),Sh=dep('shelter');
 if(!(Leaf.flags(r)&Leaf.TORN)||s.worldTick-(r.mendedAt??-Infinity)<MEND.repeat)return false;
 const task=r.objectTask;
 if((r.sleepHere||outdoorRest(task))&&r.energy<40)return false;
 // An injured friend may already be seeking a resting spot in calm weather.
 // Mend it while it is still outdoors, without taking over urgent care.
 const recovering=task?.reason==='safety'&&r.B>=40&&r.nutrition>=40&&!r.wetRecovery&&r.burden<40;
 if(recovering)return s.weather.wind<60&&precip(s)<.6&&
  !Sh.inside(s,r)&&!['entering','exiting','held'].includes(r.shelter?.phase);
 return !unsafeOutside(s,r)&&(!task||task.free||outdoorRest(task));
}
function canPostponeShelter(s,p){
 if(p.objectTask?.object!=='shelter'||!p.objectTask.free)return false;
 const a=p.shelter;
 if(['outside','waitingOutside','rerouting'].includes(a?.phase))return true;
 const Sh=dep('shelter'),f=Sh.facility(s,a?.facilityId);
 return a?.phase==='moving'&&(!f||!Sh.intersects(f,p));
}
function startMend(s,p,held,busy,postponeShelter=false){
 if(!ready(s,p,'mend')||p.settleUntil>=s.worldTick||!canPauseForMending(p))return false;
 const Space=dep('spatial'),candidates=s.individuals.filter(q=>canMend(s,p,q,held,busy)&&dist(p,q)<MEND.reach&&
  !s.individuals.some(z=>z.skill?.k==='mend'&&z.skill.target===q.id))
  .sort((a,b)=>b.damage-a.damage||dist(a,p)-dist(b,p)||a.id.localeCompare(b.id));
 for(const r of candidates){
  const at=side(s,p,r);
  if(!Space.route(s,p,at))continue;
  if(p.objectTask)dep('objects').release(s,p,'interrupt');
  if(postponeShelter){
   dep('shelter').release(p,s.worldTick);
   delete p.shelterRequest;
   if(s.shelters.nextGuest===p.id)delete s.shelters.nextGuest;
  }
  p.skill={k:'mend',target:r.id,start:s.worldTick,phase:'go'};
  return true;
 }
 if(candidates.length)rest(s,p,'mend',MEND.rest);
 return false;
}
function runMend(s,p,t,walk,ctx){
 const r=s.individuals.find(q=>q.id===t.target);
 if(!canMend(s,p,r,ctx.held,ctx.busy)){stop(s,p);return null;}
 if(t.phase==='go'){
  const at=side(s,p,r),m=walk(at);
  if(m.arrived||dist(p,at)<.02){
   // Fix the two positions just for the stitch, as at a leaf brushing.
   t.phase='do';t.at=s.worldTick;r.skillHold=p.id;
   t.x=r.x;t.y=r.y;
   if(r.stroll)delete r.stroll;
   rest(s,p,'mend',MEND.rest);
  }else if(s.worldTick-t.start>=MEND.go||t.stall>=4)stop(s,p);
  return m;
 }
 if(r.x!==t.x||r.y!==t.y||r.skillHold!==p.id){stop(s,p);return null;}
 if(s.worldTick-t.at<MEND.time)return {kind:'idle',distance:0};
 const Leaf=dep('leaf-state');
 r.damage=Math.max(0,r.damage-lv(p,'mend','amount'));
 Leaf.update(r);if(r.leafRecovery&&r.damage<20)r.leafRecovery=false;
 r.mendedAt=s.worldTick;bump(s,p,ctx);
 ctx.event?.(s,'skill',p.name+' · '+r.name+'의 찢어진 잎을 꿰매 줬어요.',{individual:p.id});
 stop(s,p,true);return {kind:'idle',distance:0};
}
function skillHolder(s,p){
 return s.individuals.find(q=>q.id===p.skillHold&&(q.skill?.k==='brush'||q.skill?.k==='mend')&&
  q.skill.target===p.id&&q.skill.phase==='do');
}
function keepSkill(s,p){
 const key=p.skill?.k;
 if(key==='mend'||key==='brush'||key==='dig'||key==='guide')return !p.objectTask&&well(s,p);
 const holder=p.skillHold&&skillHolder(s,p);
 return holder?.skill?.k==='mend'&&canMend(s,holder,p);
}
function migrate(s){
 for(const p of s.individuals){
  if(p.skill?.k==='repose')stop(s,p);
  if(p.skill?.k==='brush'&&p.skill.phase==='do'&&Number.isSafeInteger(p.skill.at)&&p.skillRest?.brush===undefined){
   (p.skillRest??={}).brush=p.skill.at+SK.brush.rest;
  }
  if(p.species==='ridley'&&p.action==='groom'&&p.actionSeconds>SK.brush.time){
   p.actionSeconds=SK.brush.time;
   p.nextObjectChoice=s.worldTick+SK.brush.time;
  }
  if(p.skillRest){
   delete p.skillRest.repose;
   for(const [key,seconds] of [['brush',SK.brush.rest],['self',SK.brush.rest],['guide',SK.guide.rest],['rake',SK.rake.rest]]){
    if(Number.isFinite(p.skillRest[key]))p.skillRest[key]=Math.min(p.skillRest[key],s.worldTick+seconds);
   }
  }
 }
}
// ---- one tick: puddles, counting the kept skills, starting new ones ----
function prepare(s,{held=null,busy=new Set(),event,discovery,visible=true}={}){init(s);puddleStep(s);const ctx={event,discovery,visible};
 for(const p of s.individuals){
  const t=p.skill;
  if(t?.k==='mend'&&(p.id===held||busy.has(p.id)||p.settleUntil>=s.worldTick||p.objectTask||
   !well(s,p)||!canMend(s,p,s.individuals.find(r=>r.id===t.target),held,busy)))stop(s,p);
  if(p.guideTo&&(p.guideTo.until<=s.worldTick||!p.active||p.B>=band(p).mid))delete p.guideTo;if(p.skill&&!p.active)stop(s,p);if(p.skillHold&&!skillHolder(s,p))delete p.skillHold;}
 for(const a of s.social?.sessions||[])if(a.started===s.worldTick&&(a.type==='A04'||a.type==='CANOPY')){const d=s.individuals.find(q=>q.id===a.ids[0]);if(d)bump(s,d,ctx);}
 if(!s.skills.seen.bonbon&&misters(s).some(e=>s.individuals.some(q=>q.id!==e.id&&q.active&&dist(q,e)<lv(e,'mist','range')))){const e=misters(s)[0];bump(s,e,ctx);}
 for(const p of [...s.individuals].sort((a,b)=>a.id.localeCompare(b.id))){
  const dico=p.species==='dico';
  if(!free(s,p,held,busy,dico))continue;
  const postponeShelter=dico&&canPostponeShelter(s,p);
  if(!well(s,p,postponeShelter))continue;
  const go=dico?startMend(s,p,held,busy,postponeShelter):p.species==='bosong'?startBosong(s,p,ctx):
   p.species==='jureong'?startRake(s,p):p.species==='ridley'?startBrush(s,p,held,busy):false;
  if(go&&p.stroll)delete p.stroll;}}
function stop(s,p,completed=false){const t=p.skill;if(!t)return;
 if(!completed){
  if(t.k==='mend')rest(s,p,'mend',MEND.rest);
  if(t.k==='brush')rest(s,p,'brush',SK.brush.rest);
 }
 if(t.k==='brush'||t.k==='mend'){const r=s.individuals.find(q=>q.id===t.target);if(r&&r.skillHold===p.id)delete r.skillHold;}
 delete p.skill;p.nextObjectChoice=s.worldTick;}
// the engine calls this for every active friend; a returned motion means the friend spent this tick on a skill
function act(s,p,ctx={}){const Space=dep('spatial'),Vit=dep('vitals');
 if(p.skillHold){const h=skillHolder(s,p);if(h)return {kind:'idle',distance:0};delete p.skillHold;}
 const t=p.skill;if(!t)return null;
 if(!well(s,p)||p.objectTask){stop(s,p);return null;}
 const age=s.worldTick-t.start,walk=to=>{const m=Space.travel(s,p,to);if(m.distance>0)t.stall=0;else if(!m.arrived)t.stall=(t.stall||0)+1;return m;};
 if(t.k==='mend')return runMend(s,p,t,walk,ctx);
 if(t.k==='dig'){
  if(t.phase==='go'){const m=walk(t);if(m.arrived){t.phase='sniff';t.at=s.worldTick;}else if(age>SK.dig.go||t.stall>=4)stop(s,p);return m;}
  if(s.worldTick-t.at<SK.dig.sniff)return {kind:'sniff',distance:0};
  const z=s.patches.find(q=>q.id===t.from),n=z?Math.min(lv(p,'dig','amount'),z.S*SK.dig.take):0;
  if(n>=1&&puddles(s).length<SK.dig.max){z.S-=n;const st=init(s),d={id:'pd:'+st.nextId++,x:t.x,y:t.y,W:n,from:z.id,born:s.worldTick,by:p.id};st.puddles.push(d);Vit.energyPts(p,-SK.dig.cost);bump(s,p,ctx);
   ctx.event?.(s,'skill',p.name+' · 촉촉한 흙에서 숨은 물을 찾아 웅덩이를 만들었어요.',{individual:p.id});
   const r=s.individuals.filter(q=>q.id!==p.id&&thirsty(q)&&dist(q,p)<lv(p,'dig','reach')).sort((a,b)=>a.B-b.B||a.id.localeCompare(b.id))[0];if(r)show(s,r,{kind:'puddle',id:d.id,x:d.x,y:d.y},p);}
  stop(s,p);return {kind:'idle',distance:0};}
 if(t.k==='guide'){const m=walk(t);if(m.arrived||age>SK.guide.go||t.stall>=4)stop(s,p);return m;}
 // 코로나 긁어모으기: walks to the spot, sweeps the chosen leaves in (2 s a leaf, they slide to the spot) and adds them to
 // the pile there, or makes a pile with the leaf already there. Leaves only move; the floor-leaf count stays the same.
 if(t.k==='rake'){const L=dep('litter'),st=s.objects.litter,mine=()=>st.leaves.filter(l=>t.ids.includes(l.id)),
   target=()=>t.pile?L.piles(s).find(q=>q.id===t.pile):st.leaves.find(l=>l.id===t.anchor&&!L.piles(s).some(q=>q.sector===l.sector));
  if(t.phase==='go'){const m=walk(t);if(m.arrived||dist(p,t)<.02){if(!mine().length||!target()){stop(s,p);return m;}t.phase='rake';t.at=s.worldTick;t.ids=mine().map(l=>l.id);}else if(age>SK.rake.go||t.stall>=4)stop(s,p);return m;}
  const ls=mine(),to=target(),time=SK.rake.per*t.ids.length,left=Math.max(1,time-(s.worldTick-t.at));if(!ls.length||!to){stop(s,p);return null;}
  for(const l of ls){l.x+=(to.x-l.x)/left;l.y+=(to.y-l.y)/left;}
  if(s.worldTick-t.at<time)return {kind:'rake',distance:0};
  const sec=to.sector,incoming=ls.filter(l=>l.sector!==sec).length;if(L.sectorRaw(s,sec)+incoming>L.SECTOR){stop(s,p);return {kind:'idle',distance:0};}
  for(const l of ls){l.sector=sec;l.x=to.x;l.y=to.y;}const ids=ls.map(l=>l.id);if(!t.pile)ids.push(t.anchor);
  L.gather(s,sec,ids,{x:to.x,y:to.y});const n=ls.length;Vit.energyPts(p,-SK.rake.cost*n);bump(s,p,ctx);ctx.event?.(s,'skill',p.name+' · 흩어진 낙엽 '+n+'장을 '+(t.pile?'낙엽 더미로':'한데')+' 긁어모았어요.',{individual:p.id});stop(s,p);return {kind:'idle',distance:0};}
 if(t.k==='brush')return runBrush(s,p,t,walk,ctx);
 stop(s,p);return null;}
// 1.2.6 관리자 '스킬 보기' (user: "친구 항목에서 해당 케릭터의 스킬 연출 볼 수 있게 스킬 사용 키"): starts the skill now, skipping the
// wait and the "is it needed" check (a thirsty friend, a low spring); the caller has already put the leaves, pests or soil water in place.
// The skill then runs exactly as in play. Returns false when there is nothing to work on.
function force(s,p){init(s);(p.skillRest??={});for(const k of [...KINDS,'self'])delete p.skillRest[k];
 if(p.species==='bosong'){for(const z of soilSpots(s,p)){const at=puddleSpot(s,z,p);if(at&&dep('spatial').route(s,p,at)){p.skill={k:'dig',from:z.id,x:at.x,y:at.y,phase:'go',start:s.worldTick};rest(s,p,'dig',lv(p,'dig','rest'));return true;}}return false;}
 if(p.species==='jureong'){const c=rakeFor(s,p);if(!c)return false;const Space=dep('spatial');let at=null;for(const q of [{x:c.x,y:c.y+.03},{x:c.x+.04,y:c.y+.02},{x:c.x-.04,y:c.y+.02},{x:c.x,y:c.y}])if(Space.walkable(s,q,p.id)){at=q;break;}if(!at||!Space.route(s,p,at))return false;
  p.skill={k:'rake',sector:c.sector,ids:c.ids.map(l=>l.id),pile:c.pile,anchor:c.anchor,cx:c.x,cy:c.y,x:at.x,y:at.y,phase:'go',start:s.worldTick};rest(s,p,'rake',SK.rake.rest);return true;}
 if(p.species==='dico')return startMend(s,p,null,new Set());
 if(p.species==='ridley')return startBrush(s,p,null,new Set(),true);
 return false;}
// leaves held by a friend: none (코로나 rakes leaves where they lie)
function carried(){return 0;}
// card line for a friend using or receiving a skill (render / UI only)
function status(s,p){const t=p.skill;if(p.skillHold){const h=s.individuals.find(q=>q.id===p.skillHold);if(h)return h.name+ga(h.name)+(h.skill?.k==='mend'?' 잎을 꿰매 주고 있어요':' 잎을 털어 주고 있어요');}
 if(p.guideTo){const b=s.individuals.find(q=>q.id===p.guideTo.by);const n=b?b.name:'친구';return n+ga(n)+' 알려 준 물로 가고 있어요';}
 if(!t)return misters(s).some(e=>e.id===p.id)?'촉촉한 잎 곁을 지키고 있어요':null;
 if(t.k==='dig')return t.phase==='go'?'숨은 물을 찾으러 가고 있어요':'촉촉한 흙에서 숨은 물을 찾고 있어요';
 if(t.k==='guide'){const r=s.individuals.find(q=>q.id===t.target);return (r?r.name+'에게 ':'')+'물이 있는 곳을 알려 주고 있어요';}
 if(t.k==='rake')return t.phase==='go'?'흩어진 낙엽을 모으러 가고 있어요':'흩어진 낙엽을 긁어모으고 있어요';
 if(t.k==='mend'){const r=s.individuals.find(q=>q.id===t.target);return (r?r.name+'의 ':'')+(t.phase==='do'?'찢어진 잎을 꿰매고 있어요':'잎을 수선하러 가고 있어요');}
 if(t.k==='brush'){const r=s.individuals.find(q=>q.id===t.target);return (r?r.name+'의 ':'')+(t.phase==='do'?'잎을 털어 주고 있어요':'잎을 털어 주러 가고 있어요');}
 return null;}
// 1.1.3 card text for the 고유 스킬 칸: what this friend's level gives now, and what the next step adds (UI only)
const LINE=Object.freeze({
 dico:p=>'손상 바 +'+lv(p,'mend','amount')+' · 5초마다 · 같은 친구는 30초 뒤',
 maria:p=>'수영 10초 · 수분 '+band(p).hi+'까지 · 동행은 각자 상한 · 대기 2분 / 같은 친구 5분',
 bosong:p=>'웅덩이 물 최대 '+lv(p,'dig','amount')+' · 찾는 범위 '+lv(p,'dig','reach')+' · 대기 '+lv(p,'dig','rest')/60+'분',
 jureong:p=>'한 번에 낱잎 '+lv(p,'rake','count')+'장 · 기운 '+lv(p,'rake','energy')+'% 이상 · 대기 '+SK.rake.rest+'초',
 ridley:p=>'잎응애·솜깍지 합산 최대 '+lv(p,'brush','amount')+' 제거 · 범위 '+lv(p,'brush','reach')+' · 대기 '+SK.brush.rest+'초 / 같은 친구 '+SK.brush.repeat+'초',
 bonbon:p=>'잎 습도 +'+lv(p,'mist','humid')+' (범위 '+lv(p,'mist','range')+') · 천적 부르는 범위 '+lv(p,'mist','assist'),
 superbum:p=>'한 번에 물 '+lv(p,'share','total')+'까지 나눔 · 둥지 최대 '+lv(p,'share','nest'),
 neolbi:p=>'비 '+Math.round(lv(p,'umbrella','rain')*100)+'% · 바람 '+Math.round(lv(p,'umbrella','wind')*100)+'% 막음 · 바람 '+lv(p,'umbrella','limit')+'까지 버팀'});
function levelLines(p){const f=LINE[p?.species];if(!f)return null;const L=levelOf(p),now=f(p),nextL=NEXT.find(n=>n>L&&f({...p,xp:LEVELS[n-1]})!==now);
 return {level:L,now,next:nextL?{level:nextL,line:f({...p,xp:LEVELS[nextL-1]})}:null};}
function validate(s){const st=s.skills;if(st!==undefined){if(!st||typeof st!=='object'||!Array.isArray(st.puddles)||st.puddles.length>SK.dig.max||!Number.isInteger(st.nextId)||st.nextId<1||typeof st.seen!=='object')throw Error('고유 스킬 기록을 확인해 주세요.');
  for(const d of st.puddles)if(typeof d.id!=='string'||!Number.isFinite(d.x)||!Number.isFinite(d.y)||!(d.W>=0&&d.W<=LEVEL.dig.amount.at(-1)+eps)||![...s.patches,...(s.objects?.stored||[])].some(z=>z.id===d.from)||!(d.born<=s.worldTick))throw Error('웅덩이 기록을 확인해 주세요.');}
 for(const p of s.individuals){const t=p.skill;if(t!==undefined&&(!t||!KINDS.includes(t.k)||!Number.isFinite(t.start)||t.start>s.worldTick||t.k==='mend'&&!(typeof t.target==='string'&&(t.phase==='go'||t.phase==='do'&&Number.isSafeInteger(t.at)&&t.at>=t.start&&t.at<=s.worldTick&&Number.isFinite(t.x)&&Number.isFinite(t.y)))||t.k==='rake'&&!(Array.isArray(t.ids)&&t.ids.length<=8&&Number.isInteger(t.sector)&&(t.pile==null||typeof t.pile==='string'))))throw Error('고유 스킬 기록을 확인해 주세요.');
  if(p.skillRest!==undefined&&(typeof p.skillRest!=='object'||Object.entries(p.skillRest).some(([k,v])=>!KINDS.includes(k)&&k!=='self'||!Number.isFinite(v))))throw Error('고유 스킬 기록을 확인해 주세요.');
  if(p.mendedAt!==undefined&&!(Number.isSafeInteger(p.mendedAt)&&p.mendedAt>=0&&p.mendedAt<=s.worldTick))throw Error('잎 수선 기록을 확인해 주세요.');
  if(p.brushedAt!==undefined&&!(Number.isSafeInteger(p.brushedAt)&&p.brushedAt>=0&&p.brushedAt<=s.worldTick))throw Error('잎 털기 기록을 확인해 주세요.');
  if(p.skillDay!==undefined&&!(Number.isInteger(p.skillDay?.d)&&Number.isInteger(p.skillDay?.n)&&p.skillDay.n>=0))throw Error('고유 스킬 기록을 확인해 주세요.');
  if(p.guideTo!==undefined&&!(p.guideTo&&['puddle','crevice','lake','spring'].includes(p.guideTo.kind)&&Number.isFinite(p.guideTo.until)&&Number.isFinite(p.guideTo.x)&&Number.isFinite(p.guideTo.y)))throw Error('물 안내 기록을 확인해 주세요.');
  if(p.skillHold!==undefined&&typeof p.skillHold!=='string')throw Error('고유 스킬 기록을 확인해 주세요.');}}
return Object.freeze({SK,MEND,LEVEL,levelOf,tier,lv,umbrella,share,levelLines,INFO,init,puddles,water,prepare,act,stop,carried,status,validate,moistLeaf,assist,misters,today,waterFor,well,keepSkill,force,soilSpots,pest,side,selfBrush,migrate});
});
