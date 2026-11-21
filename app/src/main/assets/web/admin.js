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
const TIMES=Object.freeze({morning:[60,'아침'],noon:[400,'한낮'],dusk:[640,'해 질 녘'],night:[800,'깊은 밤'],dawn:[1100,'새벽']});
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
function time(F,s,key){const t=TIMES[key];if(!t)throw Error('시간을 고를 수 없어요.');const now=((s.worldTick%1200)+1200)%1200;let d=t[0]-now;if(d<=0)d+=1200;s.worldTick+=d;return ro(t[1])+' 시간을 옮겼어요.';}
function advance(F,s,seconds){if(![60,600,1200].includes(seconds))throw Error('진행 시간을 고를 수 없어요.');F.advance(s,seconds);return (seconds/60)+'분을 실제로 진행했어요.';}
// season: move the calendar so that today is the first day of that season (10 seconds in)
function season(F,s,i){if(![0,1,2,3].includes(i))throw Error('계절을 고를 수 없어요.');const E=F.Environment;E.init(s);const len=E.SEASON_LEN;s.environment.calendar={...(s.environment.calendar||{}),start:s.worldTick-i*len-10};return SEASONS[i]+' 첫날로 바꿨어요.';}
// weather: set it now (no 10-second blend) and hold it for 240 seconds; in a snowy season rain falls as snow
function weather(F,s,key){const w=WEATHER[key];if(!w)throw Error('날씨를 고를 수 없어요.');const E=F.Environment;E.init(s);delete s.environment.storm;
 const snowy=w[0]==='rain'&&(E.SEASON_FX[s.environment.climate]?.[E.season(s)]?.snow??0)>=.5,kind=snowy?'snow':w[0],W=s.weather,e=s.environment;
 if(W.kind!=='rain'&&kind==='rain')W.rainEpoch=(W.rainEpoch||0)+1;if(W.kind==='rain'&&kind!=='rain'){W.lastRainEnd=s.worldTick;W.lastRainEpoch=W.rainEpoch;}
 Object.assign(W,{kind,intensity:w[1],wind:w[2],transition:0,strongSeconds:0,remaining:240,streak:1});e.windTarget=w[2];e.windFrom=w[2];delete e.visualFrom;delete e.precipFrom;
 return (snowy?'겨울이라 '+w[3]+' 대신 '+ro('눈'):ro(w[3]))+' 날씨를 바꿨어요.';}
function climate(F,s,id){F.Environment.changeClimate(s,id);s.environment.climateMode='fixed';return ro(F.Environment.CLIMATES[id].name)+' 기후를 바꿔요.';}
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
function compost(F,s){const z=s.patches.find(p=>p.id==='litter');z.U=Math.max(z.U,30);return '낙엽 자리에 거름을 30만큼 채웠어요.';}
function leaves(F,s){const z=s.patches.find(p=>p.id==='litter');z.O=Math.max(z.O,10);return '낙엽 자리에 낙엽 10장을 놓았어요.';}
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
 if(kind==='spring'){const L=F.Litter,pile=L?.piles?.(s).find(z=>!G.some(g=>g.kind==='spring'&&g.pile===z.id));if(!pile)throw Error('톡토기가 머물 낙엽 더미가 없어요.');C.arrive(s,{kind,pile:pile.id});return '낙엽 더미에 톡토기를 불렀어요.';}
 const p=one(s,id);if(p.species!=='ridley')throw Error('짐꾼개미는 리들리 곁에만 둥지를 틀어요.');if(G.some(g=>g.kind==='ant'&&g.host===p.id))throw Error(p.name+' 곁에는 이미 개미 둥지가 있어요.');const q=C.nestSpot(s,p);if(!q)throw Error('둥지를 틀 빈자리가 없어요.');
 G.push({id:'cr:'+st.nextId++,kind:'ant',...base,nest:q,host:p.id,away:0,hungry:0});st.antLast=s.worldTick;st.seen.ant=1;return p.name+' 곁에 짐꾼개미 둥지를 불렀어요.';}
function rockSun(F,s,full){const z=s.patches.find(p=>p.id==='rock');if(!z)throw Error('햇살 바위가 없어요.');z.sun=full?100:0;return full?'햇살 바위에 볕을 가득 채웠어요.':'햇살 바위의 볕을 비웠어요.';}
function climateAuto(F,s){delete s.environment.climateMode;return '기후가 다시 계절마다 바뀌어요.';}
// fireflies right away: the first summer night, clear and calm, and the fireflies out
function fireflies(F,s){if(!F.World.lakeOpen(s))throw Error('호수 물가가 아직 열리지 않았어요.');const E=F.Environment;if(E.season(s)!=='summer')season(F,s,1);time(F,s,'night');weather(F,s,'sun');s.world.lake.fx??={};s.world.lake.fx.fire={night:Math.floor((s.worldTick-620)/1200),on:true,seen:false};return '여름 밤으로 옮기고 반딧불을 띄웠어요.';}
const ACTIONS=Object.freeze({time,advance,season,weather,climate,climateAuto,level,resetLevels,stats,set,skillReady,summon,welcome,dismiss,openLake,fillLake,fireflies,unlockShelter,unlockObjects,spring,compost,leaves,rockSun,creature,clearCreatures});
function run(F,s,name,...args){const fn=ACTIONS[name];if(!fn)throw Error('알 수 없는 관리자 기능이에요.');const msg=fn(F,s,...args);F.event(s,'admin','관리자 · '+msg);return msg;}
return Object.freeze({ro,TIMES,SEASONS,WEATHER,STATS,CALL,ACTIONS,run});
});
