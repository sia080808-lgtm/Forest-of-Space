(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestAdmin=api;})(globalThis,function(){
'use strict';
// 0.9.5 관리자 · 창조주 도구 (user: "관리자 창도. 깨끗하게 테스트 할 수 있는 모든 경우의 수", "특정 해금 푼다던가 하는 것까지
// 있는 창조주 영역", "케릭들 레벨 … 리셋시킬 수 있는 기능", "다 관리자 기능으로").
// Every action changes the real save through the app's transaction (the caller wraps it), so it is validated and saved
// like any other change. Water moved into or out of a friend by a tool is booked in ledger.admin so the water total
// still balances. Each action returns a short Korean message for the notice.
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
// '로' after a vowel or ㄹ, '으로' after other final consonants (numbers read in Korean)
function ro(w){const t=String(w),c=t.charCodeAt(t.length-1);if(/[0-9]$/.test(t))return t+('036'.includes(t.slice(-1))?'으로':'로');if(c<0xac00||c>0xd7a3)return t+'로';const j=(c-0xac00)%28;return t+(j===0||j===8?'로':'으로');}
const TIMES=Object.freeze({morning:[60,'아침'],noon:[400,'한낮'],dusk:[570,'해 질 녘'],night:[1000,'깊은 밤'],dawn:[1170,'새벽']});// 1.2.1: each lands inside its own phase of Environment.timeKey (해 질 녘 540–600, 깊은 밤 900–1140, 새벽 1140–1200)
const SEASONS=Object.freeze(['봄','여름','가을','겨울']);
const WEATHER=Object.freeze({
 sun:['sun',20,15,'맑음'],cloud:['cloud',35,25,'흐림'],drizzle:['rain',30,25,'보슬비'],rain:['rain',80,35,'큰비'],
 fog:['fog',50,10,'안개'],snow:['snow',60,20,'눈'],gale:['cloud',40,75,'강풍']});
const STATS=Object.freeze({
 full:['모두 적정하게',{B:50,energy:90,mood:90,nutrition:50,damage:0,burden:0,Q:0}],
 thirsty:['목마르게',{B:12}],wet:['과습하게',{B:90,Q:18}],tired:['지치게',{energy:12,mood:12}],
 hungry:['배고프게',{nutrition:12}],rich:['영양 과잉으로',{nutrition:90}],hurt:['잎이 다치게',{damage:35}]});
const pick=(F,s,who)=>s.individuals.filter(p=>who==='all'?p.active:p.id===who);
function water(s,p,next){const d=next-p.B;p.B=next;s.ledger.admin=(s.ledger.admin||0)+d;}
function root(s,p,next){const d=next-p.Q;p.Q=next;s.ledger.admin=(s.ledger.admin||0)+d;}
// time: jump forward to the next moment of that time of day (the clock never goes back)
function time(F,s,key){const t=TIMES[key];if(!t)throw Error('시간을 고를 수 없어요.');const now=((s.worldTick%1200)+1200)%1200;let d=t[0]-now;if(d<=0)d+=1200;s.worldTick+=d;/* 1.2.1 (user: "아침 한낮이런거 누르면 해당 시간으로만 가야하는데 계절 앞뒤로 바뀌는 버그"): the jump only moves the time of day — the season calendar moves with it so the season and its day stay put */if(s.environment?.calendar)s.environment.calendar.start+=d;return ro(t[1])+' 시간을 옮겼어요.';}
function advance(F,s,seconds){if(![60,600,1200].includes(seconds))throw Error('진행 시간을 고를 수 없어요.');F.advance(s,seconds);return (seconds/60)+'분을 실제로 진행했어요.';}
// season: move the calendar so that today is the first day of that season (10 seconds in)
function season(F,s,i){if(![0,1,2,3].includes(i))throw Error('계절을 고를 수 없어요.');const E=F.Environment;E.init(s);const len=E.SEASON_LEN;s.environment.calendar={...(s.environment.calendar||{}),start:s.worldTick-i*len-10};return SEASONS[i]+' 첫날로 바꿨어요.';}
// weather: set it now (no 10-second blend) and hold it for 240 seconds; in a snowy season rain falls as snow
function weather(F,s,key){const w=WEATHER[key];if(!w)throw Error('날씨를 고를 수 없어요.');const E=F.Environment;E.init(s);delete s.environment.storm;
 const snowy=w[0]==='rain'&&(E.SEASON_FX[s.environment.climate]?.[E.season(s)]?.snow??0)>=.5,kind=snowy?'snow':w[0],W=s.weather,e=s.environment;
 if(W.kind!=='rain'&&kind==='rain')W.rainEpoch=(W.rainEpoch||0)+1;if(W.kind==='rain'&&kind!=='rain'){W.lastRainEnd=s.worldTick;W.lastRainEpoch=W.rainEpoch;}
 Object.assign(W,{kind,intensity:w[1],wind:w[2],transition:0,strongSeconds:0,remaining:240,streak:1});e.windTarget=w[2];e.windFrom=w[2];delete e.visualFrom;delete e.precipFrom;
 return (snowy?'겨울이라 '+w[3]+' 대신 '+ro('눈'):ro(w[3]))+' 날씨를 바꿨어요.';}
// 1.2.1 (user: "관리자모드에서 기후 바꾸는 기능에서 계속 서늘한 숲으로만 선택되는 버그"): the admin pick only queued a 30 s change
// (like the player setting), so the old climate stayed lit and nothing seemed to happen. The admin switches at once (the
// usual 60 s blend of temperature and humidity still applies).
function climate(F,s,id){const E=F.Environment;E.init(s);if(!E.CLIMATES[id])throw Error('기후를 확인해 주세요.');const e=s.environment;if(e.climate!==id){e.climateFrom={T:s.climate.T,H:s.climate.H,L:s.climate.L};e.climate=id;e.climateBlend=60;e.seasonStart=s.worldTick;}delete e.pendingClimate;e.climateMode='fixed';return '기후를 '+ro(E.CLIMATES[id].name)+' 바꿨어요.';}
// friends
function level(F,s,who,lv){if(!Number.isInteger(lv)||lv<1||lv>F.LEVELS.length)throw Error('레벨을 고를 수 없어요.');const list=pick(F,s,who);if(!list.length)throw Error('친구를 찾지 못했어요.');for(const p of list){p.xp=F.LEVELS[lv-1];p.growthSeconds=0;}return (who==='all'?'정원 친구 모두':list[0].name)+' 레벨을 '+ro(lv)+' 맞췄어요.';}
function resetLevels(F,s){for(const p of s.individuals){p.xp=0;p.growthSeconds=0;}return '모든 친구의 레벨을 1로 되돌렸어요. 성장 경험도 0이에요.';}
function stats(F,s,who,key){const st=STATS[key];if(!st)throw Error('상태를 고를 수 없어요.');const list=pick(F,s,who);if(!list.length)throw Error('친구를 찾지 못했어요.');
 for(const p of list){for(const [k,v]of Object.entries(st[1])){if(k==='B')water(s,p,v);else if(k==='Q')root(s,p,v);else p[k]=clamp(v);}if(key==='full'){p.wetRecovery=false;p.leafRecovery=false;delete p.sleepHere;delete p.braceHere;}if('energy' in st[1])p.mood=p.energy;p.moodSync=p.mood;if(key!=='hurt')p.damageSync=p.damage;p.nextObjectChoice=s.worldTick;}
 return (who==='all'?'정원 친구 모두':list[0].name)+' 상태를 '+st[0]+' 했어요.';}
function summon(F,s,species){const R=F.Recruitment;R.init(s);if(!R.ids.includes(species)||R.retired.includes(species))throw Error('부를 수 없는 친구예요.');if(s.individuals.some(p=>p.species===species))throw Error('이미 함께 사는 친구예요.');s.recruitment.visitor=null;R.arrive(s,species,F.personality,F.event);return R.josa(R.names[R.ids.indexOf(species)],'이','가')+' 숲 입구에 찾아왔어요.';}
function welcome(F,s,species){summon(F,s,species);const v=s.recruitment.visitor;v.ready=true;const p=F.Recruitment.settle(s,F.event);p.active=true;return F.Recruitment.josa(p.name,'이','가')+' 바로 정원에 들어왔어요.';}
function dismiss(F,s){if(!s.recruitment?.visitor)throw Error('기다리는 손님이 없어요.');s.recruitment.visitor=null;return '입구의 손님을 돌려보냈어요.';}
// unlocks
function fillLake(F,s){const n=F.World.fillLake(s);if(n===null)throw Error('호수 물가가 아직 열리지 않았어요.');if(n===0)throw Error('지금은 더 채울 게 없어요(겨울이거나 이미 가득해요).');return '호수에 연꽃과 물가 이웃을 '+n+'개 채웠어요.';}
function openLake(F,s){if(!F.World.openLake(s))throw Error('호수 물가는 이미 열려 있어요.');return '숲 동쪽에 물가가 열렸어요.';}
function unlockShelter(F,s){F.Shelter.init?.(s);s.shelters.unlocked=true;return '쉼터 넓히기·더 짓기를 열었어요.';}
function unlockObjects(F,s){for(const m of Object.values(s.objects.upgrades))m.unlocked=3;return '샘터·이끼·낙엽 자리 넓히기를 3단계까지 열었어요.';}
// objects
function spring(F,s,full){const cap=F.Objects.capacity(s,'spring'),next=full?cap:0,d=next-s.spring.water;s.spring.water=next;s.ledger.admin=(s.ledger.admin||0)+d;return full?'샘터를 가득 채웠어요.':'샘터를 비웠어요.';}
// 1.2.1 (user: "낙엽자리 관리자 기능 직관적이지 않음"): these used to raise the spot only up to 10 leaves / 30 compost, so a
// second press did nothing. They now add, up to the spot's capacity, and floorLeaves drops leaves on the forest floor the
// way the wind does (sector and floor limits kept), which is where friends find most leaves now.
function compost(F,s){const z=s.patches.find(p=>p.id==='litter'),room=Math.max(0,F.Objects.capacity(s,'litter')-z.O-z.U),n=Math.min(30,room);if(n<=0)throw Error('낙엽 자리가 가득 찼어요.');z.U+=n;return '낙엽 자리에 거름을 '+Math.round(n)+'만큼 더했어요.';}
function leaves(F,s){const z=s.patches.find(p=>p.id==='litter'),room=Math.max(0,F.Objects.capacity(s,'litter')-z.O-z.U),n=Math.floor(Math.min(10,room));if(n<=0)throw Error('낙엽 자리가 가득 찼어요.');z.O+=n;return '낙엽 자리에 낙엽 '+n+'장을 더했어요.';}
function floorLeaves(F,s){const L=F.Litter;L.init?.(s);const N=L.COLS*L.ROWS;let n=0;
 for(let k=0;k<60&&n<10;k++){if(L.floor(s)+1>L.LCAP)break;const i=(s.worldTick*7+k*11)%N,inSector=L.leaves(s).filter(l=>l.sector===i).length+L.piles(s).filter(p=>p.sector===i).reduce((v,p)=>v+p.O,0);if(inSector>=L.SECTOR)continue;const pile=L.piles(s).find(p=>p.sector===i),q=pile||L.spot(s,i,16);if(!q)continue;L.land(s,i,q);s.objects.ledger.leafInput+=1;n++;}
 if(!n)throw Error('숲 바닥에 낙엽을 더 놓을 자리가 없어요.');return '숲 바닥에 낙엽 '+n+'장을 떨어뜨렸어요.';}
// small neighbours: send every group home except the porter ants (they may be carrying a real leaf)
function clearCreatures(F,s){const c=s.objects?.creatures;if(!c)throw Error('작은 이웃 기록이 없어요.');const n=c.groups.length;c.groups=c.groups.filter(g=>g.kind==='ant');return '작은 이웃 '+(n-c.groups.length)+'무리를 돌려보냈어요(짐꾼개미는 남겨요).';}
// ----- 1.2.0 관리자 모드 패널 (user: "관리자 모드 따로보고 인게임모드 병렬로") -----
const one=(s,id)=>{const p=s.individuals.find(q=>q.id===id&&q.active);if(!p)throw Error('친구를 찾지 못했어요.');return p;};
// a friend's value straight from a slider: water (B, booked in the water ledger), nutrition, energy (% of the friend's pool), level
function set(F,s,id,key,value){const list=id==='all'?s.individuals.filter(p=>p.active):[one(s,id)];if(!list.length)throw Error('친구를 찾지 못했어요.');const v=Number(value);if(!Number.isFinite(v))throw Error('값을 확인해 주세요.');
 const name={B:'수분',nutrition:'영양',energy:'기운',level:'레벨'}[key];if(!name)throw Error('바꿀 수 없는 값이에요.');
 for(const p of list){if(key==='B')water(s,p,clamp(Math.round(v)));else if(key==='nutrition')p.nutrition=clamp(Math.round(v));else if(key==='energy'){p.energy=clamp(Math.round(v));p.mood=p.energy;p.moodSync=p.mood;}else{const lv=Math.round(v);if(lv<1||lv>F.LEVELS.length)throw Error('레벨을 고를 수 없어요.');p.xp=F.LEVELS[lv-1];p.growthSeconds=0;}p.nextObjectChoice=s.worldTick;}
 return (id==='all'?'정원 친구 모두':list[0].name)+' '+name+'을 '+(key==='level'?'Lv.'+Math.round(v):Math.round(v))+(key==='level'?'로':'')+' 맞췄어요.';}
function skillReady(F,s,id){const list=id==='all'?s.individuals.filter(p=>p.active):[one(s,id)];for(const p of list){p.skillRest={};p.nextObjectChoice=s.worldTick;}return (id==='all'?'정원 친구 모두':list[0].name)+' 고유 스킬 대기 시간을 없앴어요.';}
// small neighbours called on purpose (the arrival conditions are skipped; the creature rules apply from the next second)
const CALL={mite:'잎응애',mealy:'솜깍지',keeper:'잎지기',lady:'점박이',gnat:'뿌리날파리',soilmite:'흙지기',spring:'톡토기',ant:'짐꾼개미'};
function creature(F,s,kind,id){const C=F.Creatures,st=s.objects?.creatures;if(!st||!CALL[kind])throw Error('부를 수 없는 이웃이에요.');const G=st.groups,base={since:s.worldTick,bad:0,lastWork:s.worldTick,carry:null},pests=['mite','gnat','mealy'];
 if(pests.includes(kind)){const on=new Set(G.filter(g=>pests.includes(g.kind)).map(g=>g.kind));if(!on.has(kind)&&on.size>=2)throw Error('해충은 한 번에 두 종류까지만 머물러요. 생물 탭에서 돌려보낸 뒤 불러 주세요.');}
 if(['mite','mealy','keeper','lady'].includes(kind)){const p=one(s,id);if(G.some(g=>g.kind===kind&&g.host===p.id))throw Error(p.name+'에게는 이미 '+CALL[kind]+'가 있어요.');
  if(kind==='mite'||kind==='mealy')C.arrive(s,{kind,host:p.id});else G.push({id:'cr:'+st.nextId++,kind,host:p.id,...base,eaten:0,...(kind==='lady'?{stage:'adult'}:{})});st.seen[kind]=1;return p.name+' 잎에 '+CALL[kind]+'를 불렀어요.';}
 if(kind==='gnat'||kind==='soilmite'){if(G.some(g=>g.kind===kind&&g.site==='litter'))throw Error('낙엽 자리에 이미 '+CALL[kind]+'가 있어요.');if(kind==='gnat')C.arrive(s,{kind,site:'litter'});else G.push({id:'cr:'+st.nextId++,kind,site:'litter',...base,eaten:0});st.seen[kind]=1;return '낙엽 자리에 '+CALL[kind]+'를 불렀어요.';}
 /* 1.2.3: the engine's kind is 'springtail' (the button key is 'spring'); passing 'spring' made the save check fail with "작은 이웃 기록을 확인해 주세요" */if(kind==='spring'){if(G.filter(g=>g.kind==='springtail').length>=2)throw Error('톡토기는 두 무리까지 머물러요. 생물 탭에서 돌려보낸 뒤 불러 주세요.');const L=F.Litter,pile=L?.piles?.(s).find(z=>!G.some(g=>g.kind==='springtail'&&g.pile===z.id));if(!pile)throw Error('톡토기가 머물 낙엽 더미가 없어요.');C.arrive(s,{kind:'springtail',pile:pile.id});return '낙엽 더미에 톡토기를 불렀어요.';}
 const p=one(s,id);if(p.species!=='ridley')throw Error('짐꾼개미는 리들리 곁에만 둥지를 틀어요.');if(G.some(g=>g.kind==='ant'&&g.host===p.id))throw Error(p.name+' 곁에는 이미 개미 둥지가 있어요.');const q=C.nestSpot(s,p);if(!q)throw Error('둥지를 틀 빈자리가 없어요.');
 G.push({id:'cr:'+st.nextId++,kind:'ant',...base,nest:q,host:p.id,away:0,hungry:0});st.antLast=s.worldTick;st.seen.ant=1;return p.name+' 곁에 짐꾼개미 둥지를 불렀어요.';}
// 1.2.6 스킬 보기 (user: "친구 항목에서 해당 케릭터의 스킬 연출 볼 수 있게 스킬 사용 키"): puts in place what the friend's skill works on
// (soil water, loose leaves, pests on a friend nearby, rain, nest water and a thirsty friend) and starts the skill now; it then runs
// as in play. Water a tool adds is booked in ledger.admin, leaves in ledger.leafInput.
function skillShow(F,s,id){const S=typeof module==='object'?require('./skills.js'):globalThis.ForestSkills,V=typeof module==='object'?require('./vitals.js'):globalThis.ForestVitals,p=one(s,id),Sh=F.Shelter,O=F.Objects,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 if(!p||!p.active)throw Error('정원에 있는 친구를 골라 주세요.');if(Sh.inside(s,p)||p.shelter?.facilityId)throw Error(p.name+' — 쉼터 밖에 있을 때 눌러 주세요.');
 const near=r=>s.individuals.filter(q=>q.id!==p.id&&q.active&&!q.mounted&&!Sh.inside(s,q)&&!q.shelter?.facilityId&&dist(q,p)<r).sort((a,b)=>dist(a,p)-dist(b,p))[0];
 const free=q=>{O.release(s,q,'interrupt');q.action='wander';q.target=null;q.actionSeconds=0;delete q.walkPlan;delete q.stroll;delete q.sleepHere;delete q.braceHere;delete q.objectWait;q.nextObjectChoice=s.worldTick+60;};
 const solo=()=>{if(!S.well(s,p))throw Error(p.name+' — 밤·큰비·강풍이거나 수분·영양·기운이 낮으면 스킬을 쓰지 않아요.');free(p);};
 if(p.species==='bosong'){solo();if(!S.soilSpots(s,p).length){const z=s.patches.filter(z=>z.id!=='shelter'&&z.cap>0&&dist(z,p)<S.SK.dig.soil).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(!z)throw Error('베이치 둘레(0.8 안)에 흙이 있는 사물이 없어요.');const add=Math.max(0,Math.min(z.cap,S.SK.dig.minS+2)-z.S);z.S+=add;s.ledger.admin=(s.ledger.admin||0)+add;}
  if(S.puddles(s).length>=S.SK.dig.max)throw Error('웅덩이가 이미 두 개예요. 잠시 뒤 다시 눌러 주세요.');if(!S.force(s,p))throw Error('웅덩이를 만들 자리로 가는 길이 없어요.');return p.name+' · 숨은 물을 찾으러 가요.';}
 if(p.species==='jureong'){solo();const L=F.Litter;if(!S.force(s,p)){for(let k=0;k<3;k++){const q={x:p.x+.07+.035*k,y:p.y+.05};if(L.floor(s)+1>L.LCAP)break;const i=L.sectorOf(q);if(L.sectorRaw(s,i)+1>L.SECTOR||!F.Space.walkable(s,q,p.id))continue;L.land(s,i,q);s.objects.ledger.leafInput+=1;}if(!S.force(s,p))throw Error('코로나 둘레에 긁어모을 낙엽을 놓을 자리가 없어요.');}return p.name+' · 흩어진 낙엽을 긁어모으러 가요.';}
 if(p.species==='ridley'){solo();const reach=S.lv(p,'brush','reach'),r=s.individuals.filter(q=>q.id!==p.id&&q.active&&!q.mounted&&!Sh.inside(s,q)&&!q.shelter?.facilityId&&dist(q,p)<reach&&F.Space.route(s,p,S.side(s,p,q))).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(!r)throw Error('리들리 곁(0.4 안)에 갈 수 있는 친구가 있어야 해요.');const G=s.objects.creatures.groups;let g=G.find(g=>['mite','mealy'].includes(g.kind)&&g.host===r.id);
  if(!g){for(const kind of ['mite','mealy']){try{creature(F,s,kind,r.id);g=G.find(g=>g.kind===kind&&g.host===r.id);break;}catch(e){}}}if(!g)throw Error('해충이 두 종류 머물고 있어 부를 수 없어요. 생물 탭에서 돌려보낸 뒤 눌러 주세요.');g.density=Math.max(g.density,S.SK.brush.min+15);
  free(r);if(!S.force(s,p))throw Error(r.name+' 곁으로 가는 길이 없어요.');return p.name+' · '+r.name+'의 잎을 털어 주러 가요.';}
 if(p.species==='bonbon'){solo();const o=O.option(s,p,'moss','moss','free',true);if(o.fail){/* the moss is taken: stand beside it instead (the skill works within 0.2 of the moss) */const m=s.patches.find(z=>z.id==='moss');const q=m&&[[.12,.03],[-.12,.03],[0,.1],[.1,-.06],[-.1,-.06]].map(([dx,dy])=>({x:m.x+dx,y:m.y+dy})).find(q=>F.Space.walkable(s,q,p.id)&&F.Space.route(s,p,q,p.id));if(!q)throw Error('이끼 곁으로 갈 길이 없어요.');p.stroll={x:q.x,y:q.y,since:s.worldTick,deadline:s.worldTick+60,linger:40};p.action='wander';return p.name+' · 이끼 곁으로 가요. 이끼 곁에 있으면 둘레 친구 잎에 물안개가 퍼져요.';}p.objectTask={...o,serial:s.objects.nextSession++,since:s.worldTick,grade:2,remaining:40,stalled:0,deadline:s.worldTick+Math.max(10,Math.min(240,Math.ceil(o.travelSeconds)+10))};p.action='rest';p.target='moss';return p.name+' · 이끼로 가요. 이끼 곁에 있으면 둘레 친구 잎에 물안개가 퍼져요.';}
 if(p.species==='neolbi'||p.species==='superbum'){/* 1.2.9: 엘레판's umbrella only opens for a friend the social rules accept (measured the way they measure, 0.35 on the world scale, with a seat under the leaf that is reachable and not by wet moss); it used to pick the nearest friend by plain distance and say 'opens the umbrella' when nothing could happen */
  const Sp=F.Space,So=F.Social,ok=q=>{if(Sp.distance(q,p)>=.33)return false;const seat=So.restPoint?.(s,[p],q);return !!seat&&!s.patches.some(z=>Sp.distance(z,seat)<.1&&(z.S/z.cap>=.4||z.W>=1))&&!!Sp.route(s,q,seat);};
  const r=p.species==='neolbi'?s.individuals.filter(q=>q.id!==p.id&&q.active&&!q.mounted&&!Sh.inside(s,q)&&!q.shelter?.facilityId&&ok(q)).sort((a,b)=>dist(a,p)-dist(b,p))[0]:near(.6);if(!r)throw Error(p.species==='neolbi'?p.name+' 곁(0.33 안)에 우산 아래로 갈 수 있는 친구가 있어야 해요. 젖은 이끼 곁이면 우산을 펴지 않아요.':p.name+' 곁에 친구가 있어야 해요.');
  if(p.species==='neolbi'){if(!['rain','snow'].includes(s.weather.kind))weather(F,s,'drizzle');}
  else{const need=Math.max(0,15-p.V);if(need>0){const n=F.Social.credit(p,need,'other');s.ledger.admin=(s.ledger.admin||0)+n;}const lo=V.band(r).warnLo;if(r.B>=lo)water(s,r,Math.max(5,lo-6));}
  for(const q of [p,r]){free(q);delete q.socialUntil;}for(const k of Object.keys(s.social.cooldowns))if(k.includes(p.id))delete s.social.cooldowns[k];
  return p.species==='neolbi'?p.name+' · '+r.name+'에게 잎 우산을 펴요.':p.name+' · 목마른 '+r.name+'에게 둥지 물을 나눠 주러 가요.';}
 throw Error(p.name+'에게는 고유 스킬이 없어요.');}
function rockSun(F,s,full){const z=s.patches.find(p=>p.id==='rock');if(!z)throw Error('햇살 바위가 없어요.');z.sun=full?100:0;return full?'햇살 바위에 볕을 가득 채웠어요.':'햇살 바위의 볕을 비웠어요.';}
function climateAuto(F,s){delete s.environment.climateMode;delete s.environment.pendingClimate;return '기후가 다시 계절마다 바뀌어요.';}
// fireflies right away: the first summer night, clear and calm, and the fireflies out
function fireflies(F,s){if(!F.World.lakeOpen(s))throw Error('호수 물가가 아직 열리지 않았어요.');const E=F.Environment;if(E.season(s)!=='summer')season(F,s,1);time(F,s,'night');weather(F,s,'sun');s.world.lake.fx??={};s.world.lake.fx.fire={night:Math.floor((s.worldTick-620)/1200),on:true,seen:false};return '여름 밤으로 옮기고 반딧불을 띄웠어요.';}
const ACTIONS=Object.freeze({skillShow,time,advance,season,weather,climate,climateAuto,level,resetLevels,stats,set,skillReady,summon,welcome,dismiss,openLake,fillLake,fireflies,unlockShelter,unlockObjects,spring,compost,leaves,floorLeaves,rockSun,creature,clearCreatures});
function run(F,s,name,...args){const fn=ACTIONS[name];if(!fn)throw Error('알 수 없는 관리자 기능이에요.');const msg=fn(F,s,...args);F.event(s,'admin','관리자 · '+msg);return msg;}
return Object.freeze({ro,TIMES,SEASONS,WEATHER,STATS,CALL,ACTIONS,run});
});
