(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestRecruitment=api;})(globalThis,function(){
'use strict';
const World=typeof module==='object'?require('./world.js'):globalThis.ForestWorld;
const josa=(w,a,b)=>{const c=String(w).charCodeAt(String(w).length-1)-0xac00;return w+(c>=0&&c<11172&&c%28?a:b);};
const ids=['ridley','bonbon','neolbi','bosong','jureong','duri','superbum'],names=['리들리','엘리시','엘레판','베이치','코로나','두리','슈퍼범'];
const needs={ridley:'쉼터와 주울 낙엽 1개',bonbon:'촉촉하고 물이 고이지 않는 이끼와 바위 틈',neolbi:'가까이 이어진 밝은 자리와 넓은 그늘',bosong:'건조하고 고요한 자리, 마실 물',jureong:'주울 낙엽과 마른 정리 자리',duri:'통로가 열린 조용한 쉼터',superbum:'물이 3할 넘게 찬 샘터와 그곳으로 가는 길'};
const goals={ridley:'편안하게 120초 머물고 인사하기',bonbon:'잎틈을 살핀 뒤 편안하게 120초 머물기',neolbi:'햇빛과 그늘을 살핀 뒤 20초 쉬기',bosong:'마실 물을 찾아보기',jureong:'낙엽 한 장을 주워 옮기기',duri:'친구와 20초 또는 혼자 60초 쉬기',superbum:'샘터를 살피고 하늘을 올려다본 뒤 20초 쉬기'};
// 0.6.23: 두리 is retired from visits (no approved design). Ellisii takes its place as the first visitor. Friends who
// already live in the forest stay; a waiting or queued 두리 visit becomes an Ellisii visit (nothing else is created).
const retired=['duri'];
function init(s){s.recruitment??={version:1,serial:0,target:null,visitor:null,progress:{},settled:[],pending:[]};for(const id of ids)s.recruitment.progress[id]??={valid:0,failures:0,comfortable:0,actions:{},rest:0};s.rng.recruitment??=(s.rng.neighbor^0x51f15e5d)>>>0||1;
 const r=s.recruitment,owned=s.individuals.some(p=>p.species==='bonbon');let swap=false;
 if(r.visitor&&retired.includes(r.visitor.species)){r.visitor=null;swap=true;}
 if(r.pending.some(x=>retired.includes(x))){r.pending=r.pending.filter(x=>!retired.includes(x));swap=true;}
 if(retired.includes(r.target))r.target=null;
 if(swap&&!owned&&!r.pending.includes('bonbon'))r.pending.unshift('bonbon');
 return s;}
const routeCache=new Map();
function route(s,Space,a,b){const key=JSON.stringify([s.layoutRevision,s.patches.map(p=>[p.x,p.y]),s.shelters.facilities,s.spring.x,s.spring.y,Space.obstacles(s).map(o=>[o.id,o.x,o.y,o.rx,o.ry]),a,b]);if(routeCache.has(key))return routeCache.get(key);const result=Space.route(s,a,b);if(routeCache.size>128)routeCache.clear();routeCache.set(key,result);return result;}
const rawLeaves=s=>(typeof module==='object'?require('./litter.js'):globalThis.ForestLitter).floor(s,true);
function conditions(s,id,Space,Social){const litter=s.patches.find(p=>p.id==='litter'),shade=s.patches.find(p=>p.id==='shade'),dry=s.patches.find(p=>100*p.S/p.cap<60&&p.W<1),water=s.spring.water>=1||s.patches.some(p=>p.W>=1),start=World.entrance(s);const accessible=q=>q&&route(s,Space,start,Space.socket(s,q.id||'spring'));
 const safe=s.weather.wind<60&&!s.environment?.storm,base=safe&&accessible({id:'shelter'});let habitat=false;
 if(id==='ridley')habitat=rawLeaves(s)>=1&&!!accessible(litter);
 if(id==='duri')habitat=s.shelters.facilities.some(f=>s.individuals.filter(p=>p.shelter?.facilityId===f.id&&p.active).length===0);
 let checks=[];
 if(id==='bonbon'){const moss=s.patches.find(p=>p.id==='moss'),crevice=s.patches.find(p=>p.id==='crevice');if(moss&&crevice){const m=Math.round(100*moss.S/moss.cap),d=Space.distance(moss,crevice);const E=typeof module==='object'?require('./environment.js'):globalThis.ForestEnvironment,heavy=E.precipitation(s,'rain')>=.6;checks=[{label:'이끼 촉촉함 '+m+'%',need:'40% 이상',ok:m>=40},{label:heavy?'지금 큰비가 와요':'큰비 없음',need:'큰비가 그친 뒤',ok:!heavy},{label:'바위틈 고인 물 '+Number(crevice.W.toFixed(1)),need:'5 미만',ok:crevice.W<5},{label:'이끼와 바위틈 사이',need:'가깝게',ok:d<.32},{label:'입구에서 가는 길',need:'열림',ok:!!accessible(moss)&&!!accessible(crevice)}];}habitat=!!moss&&!!crevice&&100*moss.S/moss.cap>=40&&(typeof module==='object'?require('./environment.js'):globalThis.ForestEnvironment).precipitation(s,'rain')<.6&&crevice.W<5&&Space.distance(moss,crevice)<.32&&!!accessible(moss)&&!!accessible(crevice);}
 if(id==='neolbi'){const bright=s.patches.filter(p=>s.climate.L*(1-Social.shadeFactor(s,p))>=50);habitat=!!shade&&Social.shadeFactor(s,shade)>=.35-1e-8&&bright.some(p=>Space.distance(p,shade)<=6*.066667&&route(s,Space,Space.socket(s,p.id),Space.socket(s,'shade')));}
 if(id==='bosong')habitat=!!dry&&water&&!!accessible(dry)&&!!accessible({id:'spring'});
 // 슈퍼범 (0.6.29): a big friend who lives on rain; it comes when the spring really holds water and it can walk there.
 if(id==='superbum'){const cap=s.spring.capacity||100,pct=Math.round(100*s.spring.water/cap),path=!!accessible({id:'spring'});checks=[{label:'샘터 물 '+pct+'%',need:'30% 이상',ok:pct>=30},{label:'입구에서 샘터로 가는 길',need:'열림',ok:path}];habitat=pct>=30&&path;}
 if(id==='jureong')habitat=rawLeaves(s)>=1&&!!dry&&!!accessible(litter)&&!!accessible(dry);
 return {ok:!!base&&!!habitat,safe,habitat:!!habitat,checks,text:needs[id],reason:!safe?'날씨가 잔잔해지면 찾아와요.':!base?'쉼터로 이어지는 길을 비워주세요.':!habitat?josa(needs[id],'을','를')+' 마련해 주세요.':'환경이 준비됐어요.'};}
function makePet(s,species,id,personality){return {id,species,name:names[ids.indexOf(species)],B:50,Q:0,V:0,snowWater:0,energy:75,mood:75,nutrition:50,vit:2,damage:0,burden:0,wetSeconds:0,x:.5,y:.65,xp:0,growthSeconds:0,mounted:false,active:false,action:'wander',actionSeconds:0,target:null,drinkCycle:false,first:{},personality:personality(id),sources:{rain:0,other:0,unknown:0},visualStage:0,shelter:{phase:'outside',since:s.worldTick},gustExposure:0,braceSeconds:0,windCalmSeconds:0,wet85Seconds:0,wetFilm:0,wetRecovery:false,leafRecovery:false};}
function tick(s,{Space,Social,rng,event,personality}){init(s);const r=s.recruitment;if(r.visitor)return;const owned=new Set(s.individuals.map(p=>p.species)),candidates=ids.filter(id=>!owned.has(id)&&!retired.includes(id)&&(r.serial>0||owned.has('bonbon')||id==='bonbon'||s.worldTick>=1200)).sort((a,b)=>(b===r.target)-(a===r.target)||r.progress[b].valid-r.progress[a].valid||ids.indexOf(a)-ids.indexOf(b));for(const id of candidates){const p=r.progress[id],c=conditions(s,id,Space,Social);if(!c.ok)continue;p.valid++;if(id==='bonbon'&&s.worldTick>=240&&r.serial===0){r.pending.push(id);break;}if(p.valid>=180){p.valid-=180;const success=p.failures>=3||rng(s,'recruitment')<.35;if(success){p.failures=0;r.pending.push(id);break;}p.failures++;}}
 if(r.pending.length)arrive(s,r.pending.shift(),personality,event);}
function arrive(s,species,personality,event){const r=s.recruitment,id='visit-'+(++r.serial)+'-'+species;r.visitor={id,species,pet:makePet(s,species,id,personality),seconds:0,open:false,ready:false,water:20,leaves:3,phase:'adapt',x:.5,y:.77,companion:null};event?.(s,'visitor',josa(names[ids.indexOf(species)],'이','가')+' 숲 입구에 찾아왔어요.');return r.visitor;}
function open(s){const v=s.recruitment.visitor;if(!v)throw Error('아직 찾아온 친구가 없어요.');v.open=true;v.companion=s.individuals.find(p=>p.active&&!p.mounted)?.species||null;}
function close(s){if(s.recruitment.visitor)s.recruitment.visitor.open=false;}
function act(s,action){const v=s.recruitment.visitor;if(!v?.open)throw Error('친구를 먼저 만나주세요.');if(action==='greet')s.recruitment.progress[v.species].actions.greet=true;else if(action==='guide')v.guided=true;else throw Error('할 수 없는 행동이에요.');}
function encounterStep(s){const r=s.recruitment,v=r.visitor;if(!v?.open)return false;const p=r.progress[v.species];v.seconds++;v.water=Math.min(20,v.water+4/60);if(v.seconds<30){v.phase='adapt';return true;}
 // A visitor travels to physical prop sockets; actions require arrival, not a timer alone.
 let target={x:.5,y:.72},phase='rest';if(v.species==='bonbon'&&!p.actions.leafNook){target={x:.37,y:.48};phase='leafNook';}else if(v.species==='bosong'&&!p.actions.water){target={x:.23,y:.66};phase='water';}else if(v.species==='neolbi'&&!p.actions.sun){target={x:.72,y:.54};phase='sun';}else if(v.species==='neolbi'&&!p.actions.shade){target={x:.34,y:.46};phase='shade';}else if(v.species==='superbum'&&!p.actions.spring){target={x:.25,y:.64};phase='spring';}else if(v.species==='superbum'&&!p.actions.sky){target={x:.55,y:.62};phase='sky';}else if(v.species==='jureong'&&!p.actions.pick){target={x:.76,y:.76};phase='pick';}else if(v.species==='jureong'&&!p.actions.carry){target={x:.48,y:.48};phase='carry';}
 const d=Math.hypot(target.x-v.x,target.y-v.y),speed=v.guided&&phase==='water'?.018:.012;if(d>speed){v.x+=(target.x-v.x)/d*speed;v.y+=(target.y-v.y)/d*speed;v.phase=phase==='carry'?'carry':'walk';}else{v.x=target.x;v.y=target.y;v.phase=phase;v.actionTicks=(v.lastPhase===phase?v.actionTicks:0)+1;if(phase==='rest')p.rest++;if(v.actionTicks>=5){if(phase==='leafNook')p.actions.leafNook=true;if(phase==='water'&&v.water>=1){v.water-=1;p.actions.water=true;}if(['sun','shade','spring','sky'].includes(phase))p.actions[phase]=true;if(phase==='pick'&&v.leaves>0){v.leaves--;p.actions.pick=true;}if(phase==='carry')p.actions.carry=true;}v.lastPhase=phase;}
 if(v.pet.burden<40)p.comfortable++;
 v.ready=({ridley:p.comfortable>=120&&p.actions.greet,bonbon:p.comfortable>=120&&p.actions.leafNook,neolbi:p.actions.sun&&p.actions.shade&&p.rest>=20,bosong:p.actions.water,jureong:p.actions.carry,duri:p.rest>=(v.companion?20:60),superbum:p.actions.spring&&p.actions.sky&&p.rest>=20})[v.species]===true;
 if(v.seconds>=600&&!v.ready){r.visitor=null;}return true;}
// What the open encounter is waiting for, in order, with live values (read-only; for the visit card).
function steps(s){const r=s.recruitment,v=r?.visitor;if(!v)return null;const p=r.progress[v.species],a=p.actions||{},sec=n=>Math.min(n.max,Math.floor(n.v))+' / '+n.max+'초';
 const list=[{label:'새 자리에 익숙해지기',done:v.seconds>=30,value:sec({v:v.seconds,max:30})}];
 const add=(label,done,value='')=>list.push({label,done:!!done,value});
 if(v.species==='ridley'){add('반갑게 인사하기 (버튼)',a.greet);add('편안하게 머물기',p.comfortable>=120,sec({v:p.comfortable,max:120}));}
 if(v.species==='bonbon'){add('잎틈(이끼·바위틈) 살피기',a.leafNook);add('편안하게 머물기',p.comfortable>=120,sec({v:p.comfortable,max:120}));}
 if(v.species==='neolbi'){add('햇빛 자리 살피기',a.sun);add('그늘 확인하기',a.shade);add('쉬기',p.rest>=20,sec({v:p.rest,max:20}));}
 if(v.species==='bosong'){add('마실 물 찾기 (물 있는 곳 알려주면 빨라요)',a.water);}
 if(v.species==='jureong'){add('낙엽 줍기',a.pick);add('낙엽 옮기기',a.carry);}
 if(v.species==='superbum'){add('샘터 살피기',a.spring);add('하늘 올려다보기 (둥지잎 펼치기)',a.sky);add('쉬기',p.rest>=20,sec({v:p.rest,max:20}));}
 return {list,ready:v.ready,leaveIn:v.ready?null:Math.max(0,600-v.seconds),buttons:{greet:v.species==='ridley',guide:v.species==='bosong'}};}
function settle(s,event){const r=s.recruitment,v=r.visitor;if(!v?.ready)throw Error('조금 더 서로 익숙해질 시간이 필요해요.');if(s.individuals.length>=50)throw Error('함께 지낼 친구 기록이 50명으로 가득해요. 준비된 친구는 기다릴 수 있어요.');if(r.settled.includes(v.id))throw Error('이미 함께 살고 있는 친구예요.');const p=JSON.parse(JSON.stringify(v.pet));s.individuals.push(p);r.settled.push(v.id);r.visitor=null;event?.(s,'welcome',josa(p.name,'이','가')+' 함께 살기로 했어요. 친구 목록에서 정원에 들여주세요.',{individual:p.id,arrivalWater:p.B});return p;}
function validate(s){const r=s.recruitment;if(!r||r.version!==1||!Number.isSafeInteger(r.serial)||r.serial<0||!Array.isArray(r.settled)||new Set(r.settled).size!==r.settled.length||!Array.isArray(r.pending)||r.pending.some(x=>!ids.includes(x))||r.target!==null&&!ids.includes(r.target))throw Error('친구 방문 기록을 확인해 주세요.');for(const id of ids){const p=r.progress[id];if(!p||['valid','failures','comfortable','rest'].some(k=>!Number.isFinite(p[k])||p[k]<0)||!p.actions)throw Error('친구와 함께한 기록을 확인해 주세요.');}const v=r.visitor;if(v&&(!ids.includes(v.species)||typeof v.open!=='boolean'||typeof v.ready!=='boolean'||!Number.isFinite(v.seconds)||v.seconds<0||v.water<0||v.water>20||v.leaves<0||v.leaves>3||!Number.isFinite(v.x)||!Number.isFinite(v.y)))throw Error('방문 중인 친구 기록을 확인해 주세요.');}
return {arrive,steps,retired,josa,init,tick,conditions,open,close,act,encounterStep,settle,validate,ids,names,needs,goals};
});
