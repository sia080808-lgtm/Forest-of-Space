(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.Forest=api;})(globalThis,function(){
'use strict';
// SRS 2.5: the one-second world is independent of rendering, UI, and wall clock.
const VERSION='0.3.1', RULES='SRS-2.5-stage1', SCHEMA=1;
const LEVELS=[0,3,8,15,25,40,60,85,115,150];
const PATCHES=[
 {id:'rock',name:'햇살 바위',cap:2,pool:12,infiltration:4,drain:6,exposure:1,x:.73,y:.32},
 {id:'moss',name:'이끼 자리',cap:40,pool:10,infiltration:12,drain:1,exposure:.8,x:.64,y:.52},
 {id:'shade',name:'잎 그늘',cap:20,pool:12,infiltration:8,drain:2,exposure:.6,x:.78,y:.73},
 {id:'crevice',name:'바위 틈',cap:10,pool:20,infiltration:5,drain:1,exposure:.5,x:.37,y:.48},
 {id:'shelter',name:'기본 쉼터',cap:10,pool:6,infiltration:6,drain:3,exposure:.1,x:.23,y:.22},
 {id:'litter',name:'낙엽 자리',cap:30,pool:10,infiltration:8,drain:1.5,exposure:.8,x:.54,y:.83}
];
const SPECIES=[['ridley','리들리','Platycerium ridleyi','호기심 많은 작은 관찰자'],['bonbon','봉봉','Platycerium superbum','빗물을 모아 친구에게 나눠요'],['neolbi','넓이','Platycerium elephantotis','큰 잎 아래 그늘을 만들어요'],['bosong','보송','Platycerium veitchii','마른 날 물이 있는 곳을 찾아요'],['jureong','주렁','Platycerium coronarium','바람에 날린 낙엽을 모아요'],['duri','두리','Platycerium bifurcatum','친구와 나란히 쉬는 걸 좋아해요']];
const clone=x=>JSON.parse(JSON.stringify(x));
const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const uid=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'forest-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
function seedInt(str){let h=2166136261;for(const c of str)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0||1;}
function rng(s,key){let x=s.rng[key]>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng[key]=x>>>0;return (x>>>0)/4294967296;}
function personality(id){let h=seedInt(id);return {version:1,a:h%3-1,c:Math.floor(h/3)%3-1,e:Math.floor(h/9)%3-1};}
function create(now=Date.now(),seed=3172026){const id='ridley-'+seed;
 return {schema:SCHEMA,app:'ForestOfSpace',version:VERSION,rules:RULES,createdAt:now,savedAt:now,deviceId:uid(),mode:'game',started:false,worldTick:0,layoutRevision:0,
  rng:{weather:seedInt(seed+'weather'),behavior:seedInt(seed+'behavior'),neighbor:seedInt(seed+'neighbor')},
  weather:{kind:'sun',remaining:120,streak:1,intensity:35,wind:20,strongSeconds:0,transition:0,lastRainEnd:-9999},climate:{T:65,H:70,L:80},
  patches:PATCHES.map(p=>({...p,S:({moss:22,rock:1,shade:4,crevice:2,shelter:3,litter:6})[p.id],W:0,O:p.id==='litter'?3:0,U:p.id==='shelter'?20:3,rainTotal:0})),spring:{x:.20,y:.72,water:60},
  individuals:[{id,species:'ridley',name:'리들리',B:30,Q:5,V:0,energy:70,mood:70,nutrition:70,damage:0,burden:0,wetSeconds:0,x:.47,y:.38,xp:0,growthSeconds:0,mounted:false,active:true,action:'wander',actionSeconds:0,target:null,drinkCycle:false,first:{},personality:personality(id)}],
  settings:{reducedMotion:false,showName:false,showLevel:false,showState:true,showSpeech:true,theme:'auto'},
  ledger:{rain:0,spring:0,evaporation:0,outflow:0,physiology:0},events:[],discoveries:{},neighbor:{validSeconds:0,visitSeconds:0,absentSeconds:0,cooldown:0,visits:0,stage:'none'},offline:null,legacy:null};
}
function level(p){let n=1;LEVELS.forEach((x,i)=>{if(p.xp>=x)n=i+1;});return n;}
function health(p){return p.active&&!p.mounted&&p.B>=35&&p.B<=80&&p.energy>=40&&p.nutrition>=40&&p.burden<60&&p.damage<30;}
function growth(p){if(health(p)&&p.xp<150){p.growthSeconds++;if(p.growthSeconds>=360){p.growthSeconds-=360;p.xp=Math.min(150,p.xp+1);}}}
function moisture(p){return 100*p.S/p.cap;}
function totalWater(s){return s.spring.water+s.patches.reduce((n,p)=>n+p.S+p.W,0)+s.individuals.reduce((n,p)=>n+p.B+p.Q+p.V,0);}
function event(s,type,text,detail={}){s.events.push({id:s.worldTick+'-'+s.events.length,type,text,tick:s.worldTick,layout:s.layoutRevision,...detail});s.events=s.events.filter(e=>s.worldTick-e.tick<=600).slice(-256);}
function discovery(s,id,text,visible,detail={}){if(visible&&!s.discoveries[id]){s.discoveries[id]={tick:s.worldTick,text,layout:s.layoutRevision,...detail};event(s,'discovery',text,{discovery:id});}}
function light(s,p){const shade=s.patches.find(x=>x.id==='shade');return s.climate.L*(dist(p,shade)<.16?.65:1);}
function safe(p){return p.B>=35&&p.energy>=40&&p.burden<60;}
function take(p,amount){const a=Math.min(p.W,amount);p.W-=a;const b=Math.min(p.S,amount-a);p.S-=b;return a+b;}
function put(s,p,amount){const a=Math.min(amount,p.cap-p.S);p.S+=a;const b=Math.min(amount-a,p.pool-p.W);p.W+=b;s.ledger.outflow+=amount-a-b;}
function approach(p,t,speed=.009){const d=dist(p,t);if(d<=speed){p.x=t.x;p.y=t.y;return true;}p.x+=(t.x-p.x)/d*speed;p.y+=(t.y-p.y)/d*speed;return false;}
function rotate(items,tick){if(!items.length)return items;const n=tick%items.length;return items.slice(n).concat(items.slice(0,n));}
function step(s,{visible=true}={}){
 if(s.mode!=='game'||!s.started||s.offline)return s;
 s.worldTick++;const w=s.weather;w.remaining--;
 if(w.transition>0)w.transition--;
 if(w.remaining<=0){const previous=w.kind;let next=rng(s,'weather')<.6923?'rain':'sun';if(w.streak>=2)next=previous==='rain'?'sun':'rain';if(s.worldTick===120)next='rain';
  w.kind=next;w.streak=next===previous?w.streak+1:1;w.remaining=120+Math.floor(rng(s,'weather')*121);w.intensity=rng(s,'weather')<.7?35:60;
  const windRoll=rng(s,'weather');w.wind=windRoll<.65?20:windRoll<.95?45:75;w.strongSeconds=0;w.transition=10;if(s.worldTick===120){w.intensity=35;w.wind=20;}if(s.worldTick<=600&&w.wind===75)w.wind=45;
  if(previous==='rain'&&next!=='rain')w.lastRainEnd=s.worldTick;
  event(s,'weather',next==='rain'?'작은 빗방울이 정원에 내려요.':'비가 그치고 정원이 천천히 말라가요.');
 }
 if(w.wind===75&&++w.strongSeconds>=90)w.wind=45;
 const night=Math.floor(s.worldTick/600)%2===1;
 const targets={T:w.kind==='rain'?55:65,H:w.kind==='rain'?90:70,L:night?15:w.kind==='rain'?30:80};
 for(const k of ['T','H','L'])s.climate[k]+=clamp(targets[k]-s.climate[k],-1,1);
 const inflow=Math.min(10/60,60-s.spring.water);s.spring.water+=inflow;s.ledger.spring+=inflow;
 const shelter=s.patches.find(p=>p.id==='shelter');shelter.U=Math.min(20,shelter.U+1/60);
 // Conservative transfer: each patch debits one pool, and every external loss is ledgered.
 for(const p of s.patches){
  let rain=w.kind==='rain'?12/60*w.intensity/100*p.exposure:0;
  // Movable leaf canopy physically shields patches within its radius; intercepted water
  // is routed once to the nearest lower patch, never counted as a second rainfall input.
  s.ledger.rain+=rain;p.rainTotal+=rain;
  let receiving=rain;const canopy=s.patches.find(z=>z.id==='shade');
  if(p.id!=='shade'&&dist(p,canopy)<.16&&rain>0){const redirected=rain*.35;receiving-=redirected;const lower=s.patches.filter(z=>z.id!==p.id&&z.y>p.y&&dist(z,p)<.42).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(lower)put(s,lower,redirected);else s.ledger.outflow+=redirected;}
  receiving+=p.W;p.W=0;const infiltration=Math.min(receiving,p.infiltration/60,p.cap-p.S);p.S+=infiltration;receiving-=infiltration;
  const pool=Math.min(receiving,p.pool);p.W=pool;s.ledger.outflow+=receiving-pool;
  const drain=take(p,Math.min(p.S+p.W,p.drain/60));s.ledger.outflow+=drain;
  const evaporation=take(p,Math.min(p.S+p.W,(.2+.6*light(s,p)/100+.4*w.wind/100)/60));s.ledger.evaporation+=evaporation;
 }
 const active=rotate(s.individuals.filter(p=>p.active),s.worldTick);
 for(const p of active){
  growth(p);const patch=s.patches.filter(z=>dist(z,p)<.1).sort((a,b)=>dist(a,p)-dist(b,p))[0];
  const bodyUse=Math.min(p.B,(.8+(light(s,p)>=70?.4:0))/60);p.B-=bodyUse;s.ledger.physiology+=bodyUse;
  const absorb=Math.min(p.Q,2/60,Math.max(0,65-p.B));p.Q-=absorb;p.B+=absorb;
  if(patch&&moisture(patch)>=60&&!p.mounted){const q=take(patch,Math.min(4/60,20-p.Q));p.Q+=q;}
  if((patch?.id==='shelter'||p.mounted)&&p.Q>0){const q=Math.min(p.Q,3/60);p.Q-=q;put(s,shelter,q);}
  if(p.Q>16){p.wetSeconds++;if(p.wetSeconds>=60)p.burden=clamp(p.burden+2/60);}else {p.wetSeconds=0;if(p.Q<12)p.burden=clamp(p.burden-4/60);}
  // Root rain supply is taken from actual terrain, not created on the plant.
  if(w.kind==='rain'&&patch&&patch.id!=='shelter'&&!p.mounted)p.Q+=take(patch,Math.min(2/60,20-p.Q));
  const needsRecovery=p.burden>=40||p.energy<40||p.nutrition<40||w.wind>=60||p.mounted;
  if(needsRecovery){p.action='rest';p.target='shelter';}
  else if(p.B<35||p.drinkCycle){p.action='drink';p.target='spring';p.drinkCycle=true;}
  else if(p.action==='rest'&&p.energy<75){p.target='shelter';}
  else if(p.actionSeconds<=0||p.action==='drink'){
   const choice=rng(s,'behavior');p.action=choice<.4?'groom':choice<.68?'rest':'wander';
   p.actionSeconds=p.action==='groom'?8:20+Math.floor(rng(s,'behavior')*25);
   p.target=p.action==='groom'?null:p.action==='rest'?'shelter':PATCHES[Math.floor(rng(s,'behavior')*PATCHES.length)].id;
  }
  const target=p.target==='spring'?s.spring:s.patches.find(z=>z.id===p.target);
  let arrived=!target||dist(p,target)<.025;
  if(target&&!arrived&&!p.mounted){arrived=approach(p,target);p.energy=clamp(p.energy-1/60);}
  if(p.mounted)arrived=true;
  const resting=(p.action==='rest'||p.mounted)&&arrived;
  if(resting){p.energy=clamp(p.energy+4/60);p.damage=clamp(p.damage-1/60);p.mood=clamp(p.mood+.5/60);}
  else p.nutrition=clamp(p.nutrition-.2/60);
  if(arrived&&(p.action==='drink'||resting)&&p.B<65){const water=Math.min(s.spring.water,10/60,65-p.B);s.spring.water-=water;p.B+=water;}
  if(p.drinkCycle&&p.B>=65-1e-8){p.drinkCycle=false;p.actionSeconds=0;event(s,'drink',p.name+' · 스스로 샘터에서 물을 마셨어요.',{individual:p.id});if(visible&&!p.first.drink){p.first.drink=true;p.xp=Math.min(150,p.xp+2);discovery(s,'first-drink','샘터에서 처음 물을 마셨어요.',true);}}
  if(resting&&p.nutrition<70){const n=Math.min(1/60,shelter.U,70-p.nutrition);shelter.U-=n;p.nutrition+=n;}
  if(safe(p))p.mood=clamp(p.mood+.5/60);
  if(arrived)p.actionSeconds=Math.max(0,p.actionSeconds-1);
 }
 neighborStep(s,visible);
 return s;
}
function neighborStep(s,visible){
 const n=s.neighbor,c=s.patches.find(p=>p.id==='crevice'),m=s.patches.find(p=>p.id==='moss');
 const habitat=dist(c,m)<.32&&moisture(m)>=40&&moisture(m)<=70&&light(s,c)<=45&&c.W<5&&s.weather.wind<60;
 if(n.cooldown>0){n.cooldown--;return;}
 if(n.stage==='visiting'){
  n.visitSeconds++;n.absentSeconds=habitat?0:n.absentSeconds+1;
  if(n.visitSeconds>=180||n.absentSeconds>=30){n.stage='none';n.cooldown=600;n.visitSeconds=0;n.absentSeconds=0;event(s,'neighbor','돌돌이가 바위 틈 너머로 돌아갔어요.');}
  else if(visible){discovery(s,'neighbor','작은 이웃, 돌돌이를 만났어요.',true);const r=s.patches.find(p=>p.id==='rock');if(s.worldTick-s.weather.lastRainEnd<=600&&m.rainTotal>0&&r.rainTotal>0&&moisture(m)-moisture(r)>=15){n.observed=(n.observed||0)+1;if(n.observed>=20)discovery(s,'EC01','비가 그친 뒤에도 이끼에는 물기가 남아 있었어요.',true,{moss:moisture(m),rock:moisture(r),neighbor:'돌돌이'});}else n.observed=0;}
  return;
 }
 if(habitat){n.validSeconds++;if(n.validSeconds>=60)n.stage='trace';if(n.validSeconds>=120){const success=n.visits===0||rng(s,'neighbor')<.3||(n.failures||0)>=2;if(success){n.stage='visiting';n.visits++;n.validSeconds=0;n.failures=0;event(s,'neighbor','돌돌이가 촉촉한 바위 틈에서 쉬고 있어요.');}else{n.validSeconds-=60;n.failures=(n.failures||0)+1;}}}
}
function advance(s,seconds,options){for(let i=0;i<seconds;i++)step(s,options);return s;}
function pause(s,now=Date.now()){if(!s.offline)s.offline={at:now,mode:s.mode,processed:0};s.savedAt=Math.max(s.savedAt,now);return s;}
function offlineStep(s){
 const shelter=s.patches.find(p=>p.id==='shelter');const input=Math.min(10/60,60-s.spring.water);s.spring.water+=input;s.ledger.spring+=input;shelter.U=Math.min(20,shelter.U+1/60);
 const active=rotate(s.individuals.filter(p=>p.active),s.offline.processed);
 for(const p of active){growth(p);const used=Math.min(p.B,.8/60);p.B-=used;s.ledger.physiology+=used;
  if(p.Q>10){const d=Math.min(3/60,p.Q-10);p.Q-=d;s.ledger.outflow+=d;}
  const q=Math.min(p.Q,2/60,Math.max(0,65-p.B));p.Q-=q;p.B+=q;
  const water=Math.min(s.spring.water,10/60,Math.max(0,65-p.B));s.spring.water-=water;p.B+=water;
  const food=Math.min(shelter.U,1/60,Math.max(0,70-p.nutrition));shelter.U-=food;p.nutrition+=food;
  if(p.energy<75)p.energy=Math.min(75,p.energy+4/60);p.mood=clamp(p.mood+.5/60);p.damage=clamp(p.damage-1/60);if(p.Q<12)p.burden=clamp(p.burden-4/60);
 }
 s.offline.processed++;
}
function resume(s,now=Date.now()){
 if(!s.offline)return {seconds:0,xp:0};
 const start=s.individuals.reduce((n,p)=>n+p.xp,0);const seconds=Math.max(0,Math.min(28800,Math.floor((now-s.offline.at)/1000)));
 if(s.offline.mode==='game'&&s.started)while(s.offline.processed<seconds)offlineStep(s);
 const result={seconds:s.offline.mode==='game'&&s.started?seconds:0,xp:s.individuals.reduce((n,p)=>n+p.xp,0)-start};s.offline=null;s.savedAt=Math.max(s.savedAt,now);return result;
}
function validateLayout(s,positions){const next=s.patches.map(p=>({...p,...positions[p.id]}));
 for(const p of next){if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<.12||p.x>.88||p.y<.16||p.y>.88)throw Error('정원 가장자리 안쪽에 놓아주세요.');if(p.id==='shelter'&&(p.x!==.23||p.y!==.22))throw Error('기본 쉼터는 옮길 수 없어요.');if(dist(p,s.spring)<.15)throw Error('샘터로 가는 길을 비워주세요.');}
 for(let i=0;i<next.length;i++)for(let j=i+1;j<next.length;j++)if(dist(next[i],next[j])<.135)throw Error('다른 자리와 겹쳐요. 조금 떨어뜨려 주세요.');
 return next;
}
function layout(s,positions){const next=validateLayout(s,positions);s.patches=next;s.layoutRevision++;event(s,'layout','정원의 자리를 바꿨어요. 물과 생활 기록은 그대로예요.');return s;}
function valid(s){
 if(!s||s.schema!==1||s.app!=='ForestOfSpace'||s.rules!==RULES)throw Error('이 버전에서 읽을 수 있는 여백의 숲 백업이 아니에요.');
 const finite=(v,min=0,max=1e15)=>Number.isFinite(v)&&v>=min&&v<=max;
 if(!finite(s.savedAt)||!finite(s.worldTick)||!Number.isInteger(s.worldTick)||!finite(s.layoutRevision)||!['game','landscape'].includes(s.mode)||typeof s.started!=='boolean')throw Error('시계 또는 모드 기록이 올바르지 않아요.');
 if(!s.weather||!['sun','rain'].includes(s.weather.kind)||!finite(s.weather.remaining,0,240)||!finite(s.weather.streak,1,2)||!finite(s.weather.intensity,0,100)||!finite(s.weather.wind,0,100)||!finite(s.weather.strongSeconds)||!finite(s.weather.transition,0,10)||!Number.isFinite(s.weather.lastRainEnd))throw Error('날씨 기록을 확인해 주세요.');
 if(!s.climate||['T','H','L'].some(k=>!finite(s.climate[k],0,100)))throw Error('기후 기록을 확인해 주세요.');
 if(!s.rng||['weather','behavior','neighbor'].some(k=>!finite(s.rng[k],0,4294967295)||!Number.isInteger(s.rng[k])))throw Error('난수 기록을 확인해 주세요.');
 if(!s.patches||s.patches.length!==6||new Set(s.patches.map(p=>p.id)).size!==6)throw Error('정원 구역이 누락되었어요.');
 for(const p of s.patches){const def=PATCHES.find(x=>x.id===p.id);if(!def||Object.keys(def).filter(k=>!['x','y','name'].includes(k)).some(k=>p[k]!==def[k])||!finite(p.S,0,p.cap)||!finite(p.W,0,p.pool)||!finite(p.O)||!finite(p.U)||!finite(p.rainTotal))throw Error('정원 자원 기록이 올바르지 않아요.');}
 if(!s.spring||s.spring.x!==.20||s.spring.y!==.72||!finite(s.spring.water,0,60))throw Error('샘터 기록을 확인해 주세요.');
 validateLayout(s,{});
 if(!Array.isArray(s.individuals)||s.individuals.length<1||s.individuals.length>50||s.individuals.filter(p=>p.active).length>5||new Set(s.individuals.map(p=>p.id)).size!==s.individuals.length)throw Error('친구의 식별 기록이 올바르지 않아요.');
 for(const p of s.individuals){if(typeof p.id!=='string'||!/^[-A-Za-z0-9_]{1,100}$/.test(p.id)||typeof p.name!=='string'||p.name.length>40||p.species!=='ridley'||typeof p.active!=='boolean'||typeof p.mounted!=='boolean'||typeof p.drinkCycle!=='boolean'||!['wander','drink','rest','groom'].includes(p.action)||!finite(p.x,0,1)||!finite(p.y,0,1)||!finite(p.actionSeconds,-10,1000)||!finite(p.wetSeconds)||!p.first)throw Error('친구 기록을 확인해 주세요.');
  if(p.target!==null&&p.target!=='spring'&&!PATCHES.some(z=>z.id===p.target))throw Error('이동 목적지가 올바르지 않아요.');
  for(const k of ['B','energy','mood','nutrition','damage','burden'])if(!finite(p[k],0,100))throw Error('생활 상태가 범위를 벗어났어요.');
  if(!finite(p.Q,0,20)||!finite(p.V,0,40)||!finite(p.xp,0,150)||!finite(p.growthSeconds,0,360)||!p.personality||['a','c','e'].some(k=>![-1,0,1].includes(p.personality[k])))throw Error('성장 또는 성격 기록을 확인해 주세요.');
 }
 if(!s.settings||!['auto','day','night'].includes(s.settings.theme)||['reducedMotion','showName','showLevel','showState','showSpeech'].some(k=>typeof s.settings[k]!=='boolean'))throw Error('설정 기록을 확인해 주세요.');
 if(!s.ledger||['rain','spring','evaporation','outflow','physiology'].some(k=>!finite(s.ledger[k])))throw Error('물 원장이 올바르지 않아요.');
 if(!Array.isArray(s.events)||s.events.length>256||s.events.some(e=>typeof e.text!=='string'||!finite(e.tick))||!s.discoveries||Object.values(s.discoveries).some(d=>typeof d.text!=='string'||!finite(d.tick)))throw Error('관찰 기록이 올바르지 않아요.');
 if(!s.neighbor||!['none','trace','visiting'].includes(s.neighbor.stage)||['validSeconds','visitSeconds','absentSeconds','cooldown','visits'].some(k=>!finite(s.neighbor[k])))throw Error('작은 이웃 기록을 확인해 주세요.');
 if(s.offline&&(!finite(s.offline.at)||!finite(s.offline.processed,0,28800)||!['game','landscape'].includes(s.offline.mode)))throw Error('휴식 기록을 확인해 주세요.');
 return s;
}
function migrate(old,now=Date.now()){
 if(old.app==='ForestOfSpace'){const s=valid(clone(old));for(const p of s.individuals)if(p.name==='새싹이'&&!p.customName)p.name='리들리';return s;}
 if(old.schema!==1||old.app!=='RidleyDeskMobile'||!old.pets?.deully||!Number.isFinite(old.savedAt))throw Error('지원하지 않는 이전 기록이에요. 원본은 바꾸지 않았어요.');
 const s=create(now,seedInt(old.deviceId||'old-ridley')),p=s.individuals[0],o=old.pets.deully;
 for(const [a,b]of [['B','water'],['energy','energy'],['mood','mood'],['nutrition','nutrition'],['damage','damage']]){if(!Number.isFinite(o[b]))throw Error('이전 생활 기록을 읽을 수 없어요.');p[a]=clamp(o[b]);}
 p.id=o.id||old.deviceId+'-deully';p.name=typeof o.name==='string'?o.name.slice(0,40):'리들리';p.personality=personality(p.id);p.Q=10;p.action='wander';s.legacy=clone(old);
 // Old XP semantics are incompatible: preserve every original field, do not invent growth history.
 event(s,'migration','이전 수분·체력·기분·영양을 이어왔어요. 구버전 성장·다크리·업무 기록은 원본 보관 중이에요.');return valid(s);
}
function transaction(s,change,write){const next=clone(s);change(next);valid(next);if(!write(next))throw Error('저장하지 못했어요. 변경은 적용되지 않았어요.');return next;}
return {VERSION,RULES,PATCHES,SPECIES,LEVELS,create,step,advance,pause,resume,offlineStep,level,health,moisture,totalWater,light,layout,validateLayout,valid,migrate,transaction,clone,personality,event,dist};
});
