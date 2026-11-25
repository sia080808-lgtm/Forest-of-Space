(function(root,factory){const api=factory(typeof module==='object'?require('./engine.js'):root.Forest);if(typeof module==='object')module.exports=api;else root.ForestObjectCards=api;})(globalThis,function(F){
'use strict';
const O=F.Objects,Sh=F.Shelter,escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>Number(Math.max(0,v).toFixed(2)).toString(),amount=v=>v>0&&v<.1?'0.1 미만':Number(Math.max(0,v).toFixed(1)).toString();
const metric=(id,label,value,note='')=>({id,label,value,note});
function usage(s,id){const ps=s.individuals.filter(p=>p.active&&!p.mounted&&p.objectTask?.object===id),inside=ps.filter(p=>O.at(s,p));return {count:inside.length,moving:ps.length-inside.length,used:inside.reduce((n,p)=>n+Sh.units(p),0)/4,reserved:ps.filter(p=>!inside.includes(p)).reduce((n,p)=>n+Sh.units(p),0)/4};}
const absorptionLabel=F=>'+'+Math.round((F.Trees.ABSORPTION-1)*100)+'%';
function model(s,id){
 if(F.World.SHELF_IDS.includes(id)){
  if(!F.World.stoneShelf(s,id))return null;
  const visitors=O.shelfVisitors(s,id),seated=visitors.filter(p=>O.shelfPose(s,p));
  return {id,name:'돌 선반',description:'두 친구가 나란히 앉아 쉬는 자리예요.',
   status:seated.length===2?'두 친구가 나란히 쉬고 있어요':seated.length?'한 친구가 선반에서 쉬고 있어요':'잔잔한 낮에 친구들이 찾아와요',
   metrics:[metric('visitors','쉬는 친구',seated.length+' / 2명'),metric('reserved','가는 중',visitors.length-seated.length+'명')],
   rows:[],effects:['28초 동안 전망을 즐기면 기운 +1 (기운 80까지).'],actions:[],gauge:null};
 }
 if(F.Trees.kind(id)){
  const tree=F.Trees.active(s).find(t=>t.id===id);if(!tree)return null;
  const type=F.Trees.kind(id),c=F.Trees.protection(s,tree);
  if(type==='cherry'){
   const season=F.Trees.season(s),looks={spring:'연분홍 꽃이 피었어요',summer:'초록 잎이 그늘을 드리워요',autumn:'잎이 붉게 물들어요',winter:'잎이 지고 가지에 눈이 내려요'};
   const owner=F.Trees.perchOwner(s,id);
   const actions=owner?[{action:'cherry-unassign',label:'착생 자리 해제'}]:s.individuals.filter(F.Trees.canAssign).map(p=>({action:'cherry-assign',friend:p.id,label:p.name+' 자리 잡기'}));
   return {id,name:F.Trees.name(id),description:'남쪽 숲에 계절의 변화를 보여주는 나무예요.',status:looks[season],
    metrics:[metric('shade','빛 줄임',Math.round(c.shade*100)+'%')],rows:[['착생 자리',owner?.name||'빈자리'],...(owner?[['포자',F.Recruitment.sporeStatus(owner)]]:[])],
    effects:['잎과 꽃이 무성할수록 그늘이 짙어져요.','성체 친구 한 명의 수태 자리를 정하면 잔잔한 낮에 스스로 찾아와 쉬어요. 쉬는 동안 기운이 분당 1.5씩, 최대 75까지 차요.',...(owner?['가지에서 광합성한 시간이 쌓이면 친구 상세 화면에서 포자를 채집할 수 있어요.']:[])],actions,gauge:null};
  }
  const willow=type==='willow';
  return {id,name:F.Trees.name(id),description:willow?'호숫가를 덮는 부드러운 그늘이에요.':'남쪽 숲에서 친구들이 나란히 머물 수 있는 그늘이에요.',
   status:willow&&F.World.frozen(s)?'호수가 얼어 수분 흡수 보너스가 쉬고 있어요':'계절에 따라 그늘이 달라져요',
   metrics:[metric('shade','빛 줄임',Math.round(c.shade*100)+'%'),metric('rain','빗방울 줄임',Math.round(c.rain*100)+'%')],
   rows:[willow?['뿌리 수분 흡수',F.World.frozen(s)?'휴식 중':absorptionLabel(F)]:['바람 줄임',Math.round(c.wind*100)+'%']],
   effects:[willow?'뿌리에 있는 물을 몸으로 더 빨리 옮겨요. 물가에 송사리가 보이면 친한 친구끼리 같이 봐요.':'강한 볕을 누그러뜨려 광합성에 알맞은 빛을 만들 수 있어요. 친한 친구끼리 함께 앉아 수다를 떨어요.'],actions:[],gauge:null};
 }
 if(id==='lily-boat'){
 const b=s.world?.lake?.boat;if(!b)return null;
 const rider=s.individuals.find(p=>p.id===b.rider);
 return {id,name:'떠다니는 연잎',description:'물결 휴식 · 기운 ↑ 수분 ↑ 잎 해충 ↓',status:rider?F.Boat.reason(s,rider):F.World.frozen(s)?'호수가 얼어 쉬고 있어요':b.drift?'다른 물가로 떠가고 있어요':'물가에 떠 있어요',
 metrics:[metric('rider','탑승자',rider?.name||'없음'),metric('capacity','정원','1명')],rows:[['행선지',b.cross?F.Boat.destination(b):'출발한 물가로 돌아와요']],effects:['기운 최대 +3 · 이슬 수분 최대 +2 · 솜깍지와 잎응애 각각 최대 −2'],actions:[],gauge:null};}
 if(id==='shelter')id='shelter-0';const f=Sh.facility(s,id),type=O.kindOf(id),z=f||O.patch(s,id);if(!z)return null;
 const m={id,name:f?Sh.name(f):(type==='spring'?'샘터':z.name)+(O.isCopy(id)?' '+id.at(-1):''),description:'',status:'',metrics:[],rows:[],effects:[],actions:[],gauge:null,facility:!!f};
 const u=f?null:usage(s,id),meter=(label,value,max,tone='water')=>({label,max,parts:[{label,value,tone}],free:Math.max(0,max-value)});
 const sample=f?f:type==='spring'?z:O.region(s,id,'rest'),light=Math.round(F.light(s,sample)),probe={...s.individuals[0],...sample,mounted:false,shelter:{phase:'outside'}};
 const wind=Math.round(F.Weather.wind(s,probe)),weatherSafe=wind<60;
 if(f){const v=Sh.ledger(s,f),actual=s.individuals.filter(p=>p.active&&!p.mounted&&p.shelter?.facilityId===id&&Sh.inside(s,p)).length;
  m.description=Sh.isRock(f)?'이끼 덮인 바위 아래에서 몸과 잎을 쉬게 하는 자리예요.':'몸과 잎까지 안에 들어와 쉬는 자리예요.';m.status='쉬는 친구 '+actual+'명 · 전체 '+number(v.total/4)+'공간';
  m.metrics=[metric('used','사용 중',number(v.used/4)+'공간','퇴실 중인 공간 포함'),metric('free','빈 공간',number(v.free/4)+'공간'),metric('reserved','예약 중',number(v.reserved/4)+'공간'),metric('recovery','이용 시 기운','+4 / 분','기운 80%까지')];
  m.gauge={label:'쉼터 공간',max:v.total/4,parts:[{label:'사용',value:v.used/4,tone:'moss'},{label:'예약',value:v.reserved/4,tone:'raw'}],free:v.free/4};
  m.rows=[['함께 쉬는 친구',v.seats+'명까지'],['성체 리들리','1공간'],['성체 엘레판','2공간'],['성체가 되면 필요한 공간',number(Sh.projectedNeed(s)/4)+'공간'],['빗방울 차단','90%'],['바람 줄임','80%']];
  m.effects=['쉬기·잠으로 기운 +3/분. 비·바람을 막고, 과습한 친구는 안에서 수분이 −1.5/분씩 말라요. 어두워서 광합성은 안 돼요.','빈 공간이 있어도 몸과 잎이 맞고 입구가 열려 있어야 들어갈 수 있어요.'];
 }else if(type==='litter'||O.isPile(id)){
  // v2.24 step 1: the floor-leaf budget (loose leaves + piles) gates the natural fall; compost has its own cap.
  const L=F.Litter,pile=O.isPile(id),floor=L.floor(s),lcap=L.LCAP,ucap=O.capacity(s,'litter'),compost=L.compost(s),carry=s.individuals.reduce((n,p)=>n+(p.carriedLeaf?.pile===id?p.carriedLeaf.amount:0),0),rates=O.litterRates(s,id),remaining=Math.max(0,s.objects.dayQuota-s.objects.arrivedToday),until=id==='litter'?s.objects.playBoostUntil:z.playBoostUntil;
  if(pile){m.name=z.O<1&&z.U>0?'낮은 부식층':'낙엽더미';m.description='한 구역에 낙엽이 다섯 장 모여 생긴 더미예요. 천천히 거름이 돼요.';}
  else m.description='오래 모인 거름 자리예요. 남은 낙엽으로 놀고, 거름에서 영양을 얻어요.';
  m.metrics=[metric('raw','놀이용 낙엽',amount(z.O),pile?'이 더미의 낙엽':'이 자리에 남은 낙엽'),metric('compost','흡수할 거름',amount(z.U),'영양으로 바뀌는 양'),metric('free','바닥 낙엽 여유',amount(Math.max(0,lcap-floor)),'숲 전체 '+amount(floor)+' / '+number(lcap)),metric('capacity','숲의 거름 용량',amount(compost)+' / '+number(ucap))];
  m.gauge={label:'숲 바닥 낙엽 '+amount(floor)+' / '+number(lcap),max:lcap,parts:[{label:'낱잎',value:L.leaves(s).length,tone:'raw'},{label:'더미',value:L.piles(s).reduce((v,p)=>v+p.O,0),tone:'compost'},{label:'운반',value:Math.max(0,floor-L.leaves(s).length-L.piles(s).reduce((v,p)=>v+p.O,0)),tone:'carry'}],free:Math.max(0,lcap-floor)};
  m.status=z.O<.5?(z.U>0?'놀이할 낙엽은 부족하지만 거름은 흡수할 수 있어요.':'새 낙엽이 모이길 기다려요.'):z.U<=0?'놀이할 낙엽이 있어요. 거름은 천천히 생겨요.':'낙엽 놀이와 영양 보충을 할 수 있어요.';
  m.rows=[['친구가 들고 있는 낙엽',amount(carry)],['거름이 되는 속도',number(Math.min(z.O*60,rates.perMinute))+' / 분'],['놀이 후 분해 촉진',rates.boost>1?number(Math.max(0,until-s.worldTick))+'초 남음':'없음'],['오늘 떨어진 낙엽',number(s.objects.arrivedToday)+' / '+number(s.objects.dayQuota)+'장'],['오늘 더 떨어질 수 있는 양',number(Math.max(0,Math.min(remaining,Math.floor(lcap-floor+1e-9))))+'장'],['숲의 낙엽더미',L.piles(s).length+'개 · 낱잎 '+L.leaves(s).length+'장'],['작은 이웃',(()=>{const I=F.Creatures.info(s,pile?id:null),bits=[];if(pile&&I.springtail)bits.push('톡토기가 분해를 돕는 중(×1.25)');if(I.ant)bits.push(I.ant.tend?'짐꾼개미가 솜깍지 감로 곁에서 쉬는 중':I.ant.carry?'짐꾼개미가 낙엽을 옮기는 중':F.Creatures.antActive&&!F.Creatures.antActive(s)?'짐꾼개미가 둥지 안에서 쉬는 중':'짐꾼개미 둥지가 있어요'+(I.ants&&I.ants.length>1?' (숲에 '+I.ants.length+'군락)':''));const S=F.Creatures.inSoil(s,id);if(S.gnat)bits.push(S.soilmite||S.rove?'젖은 낙엽에 뿌리날파리 유충, '+[S.soilmite&&'흙지기',S.rove&&'쏙쏙이'].filter(Boolean).join('·')+'가 줄이는 중':'젖은 낙엽에 뿌리날파리가 살아요. 말라야 줄어요');else if(S.soilmite)bits.push('흙지기가 남은 먹이를 찾는 중');if(F.Creatures.pillNear?.(s,z))bits.push('돌돌이가 낙엽 분해를 조금 돕는 중');return bits.join(' · ')||'아직 없어요';})()]];
  m.effects=['낙엽 놀이: 기운 +2/분. 거름 흡수: 영양 +1/분(50까지, 영양 종족값에 따라 빨라지거나 느려짐). 거름 곁에 5분 넘게 머물면 뿌리로 저절로 스며들어 영양 과잉이 올 수 있어요.','낙엽은 평균 1분에 한 장씩 숲 곳곳에 떨어지고, 한 구역에 다섯 장이 모이면 더미가 돼요. 낱잎은 분해되지 않고 더미와 이 자리에서만 거름이 돼요.','바닥 낙엽이 '+number(lcap)+'장이면 새 낙엽은 잠시 멈춰요. 거름이 용량을 넘으면 흙으로 스며들어요.'];
 }else if(type==='moss'){
  m.description='수태처럼 물을 머금었다가 천천히 내주고, 기운을 회복해요.';
  m.metrics=[metric('water','저장된 물',amount(z.S)+' / '+O.capacity(s,id),'아주 적은 양만 머금어요'),metric('space','사용 / 전체 공간',number(u.used)+' / '+number(O.spaceCapacity(s,id)/4),'예약 '+number(u.reserved)+'공간'),metric('water2','쉬는 친구의 수분','+3 / 분','55까지 · 과습으로는 올리지 않아요'),metric('energy','이용 시 기운','+2 / 분','기운 80%까지')];
  m.gauge=meter('이끼가 머금은 물',z.S,O.capacity(s,id));m.status=!weatherSafe||F.Environment.precipitation(s,'rain')>=.6?'날씨가 거세면 안전한 곳에서 쉬어요.':z.S<=0?'물은 말랐어도 놀이와 회복은 가능해요.':'수분은 조금 나누고, 회복은 서서히 도와줘요.';
  m.rows=[['뿌리 수분 흡수',absorptionLabel(F)],['쉬는 친구에게 나누는 물','최대 3 / 분'],['현재 이용',u.count+'명'],['이동 중',u.moving+'명']];m.effects=['안전하게 자리에 머문 시간만큼 회복해요. 들어오는 순간 수치가 오르지는 않아요.','물이 부담스러운 친구(물 종족값 1~2)는 샘터보다 이끼를 먼저 찾아요. 물이 없어도 기운 회복은 유지돼요.'];
 }else if(type==='spring'){
  const cap=O.capacity(s,id),inflow=s.started&&s.mode==='game'&&!s.offline?(s.spring.inflow||0)*60:0;
  m.description='비가 모이면 친구들이 찾아와 마시고 놀아요.';
  m.metrics=[metric('water','마실 수 있는 물',amount(z.water)+' / '+number(cap)),metric('flow','현재 물 유입',number(inflow)+' / 분',inflow>0?'비·녹은 눈이 모여요':'지금 들어오는 물은 없어요'),metric('drink','이용 시 음수','최대 10 / 분','몸 수분 65까지'),metric('splash','물장구',z.water>=cap*.2?'물 충분':'물 부족','물 '+number(cap*.2)+' 이상 필요')];
  m.gauge=meter('샘터 잔량',z.water,cap);m.status=z.water<=0?'샘터가 비었어요. 비가 와야 다시 물이 모여요.':!weatherSafe?'바람이 잦아든 뒤 이용할 수 있어요.':'물을 마시면 남아 있는 양이 줄어요.';
  m.rows=[['남아 있는 눈',amount(z.snowWater||0)],['현재 이용',u.count+'명'],['이동 중',u.moving+'명']];m.effects=['보충: 실제 비와 저장된 눈이 녹은 물. 시간만 지나서는 차지 않아요.','마시기: 수분 +10/분(50까지). 물장구: 수분 +6/분(50까지), 기운 +1/분. 마신 만큼 샘물이 줄어요. 물이 적거나 뿌리가 많이 젖으면 가장자리에서 마셔요.'];
 }else if(type==='shade'){
  m.description='넓은 잎 아래에서 햇빛과 빗방울을 덜 맞아요.';
  m.metrics=[metric('shade','빛 줄임','35%','이 잎이 만드는 그늘'),metric('rain','빗방울 차단','50%','잎에 가려진 범위'),metric('light','현재 그늘의 빛',light+' / 100'),metric('energy','이용 시 기운','+1.5 / 분','기운 80%까지')];
  m.status='이용 중 '+u.count+'명 · 이동 중 '+u.moving+'명';m.rows=[['잎 표면의 물기',Math.round((z.film||0)*100)+'%'],['현재 유효 바람',wind+' / 100']];m.effects=['잎 아래에서는 수분이 덜 마르고(기본 소모 절반) 비를 반쯤 막아요. 그늘을 좋아하는 친구(엘리시·코로나)의 볕 자리예요.','강풍이나 침수, 과습 상태에서는 다른 안전한 자리를 찾아요.'];
 }else if(type==='rock'){
  m.description='맑은 날 볕을 모아 두는 바위예요. 위에 오른 친구는 모아 둔 볕으로 광합성하고 몸을 말려요.';
  m.metrics=[metric('wet','바위 표면의 젖음',Math.round(F.moisture(z))+'%'),metric('light','현재 햇빛',light+' / 100'),metric('drain','물 빠짐','최대 '+number(z.drain)+' / 분'),metric('energy','이용 시 기운','+1 / 분','기운 80%까지')];
  m.status=O.dry(s,id)&&wind<50?'표면이 마르고 바람이 잔잔해 쉬기 좋아요.':'표면과 바람이 잔잔해지길 기다려요.';m.rows=[['현재 이용',u.count+'명'],['이동 중',u.moving+'명'],['현재 유효 바람',wind+' / 100']];m.effects=['모아 둔 볕: '+Math.round(globalThis.ForestVitals?.rockSun?.(s,id)??0)+' / 100 (맑은 낮 +2/분, 흐린 낮 +0.5/분, 위의 친구 한 명당 −2/분). 볕이 남아 있으면 흐린 날에도 좋아하는 밝기로 광합성하고, 과습한 몸을 −2/분씩 말려요.'];
 }else if(type==='crevice'){
  m.description='강풍을 피하는 곳이에요. 강풍을 맞으면 잎이 다쳐 기운이 깎여요.';
  m.metrics=[metric('pool','틈에 고인 물',amount(z.W)+' / '+number(z.pool)),metric('wind','현재 유효 바람',wind+' / 100'),metric('reduction','바람 줄임',Math.cos(s.weather.wind_dir||0)<-.5?'50%':'0%','현재 바람 방향 기준'),metric('energy','이용 시 기운','+1 / 분','기운 80%까지')];
  m.gauge=meter('바위틈 고인 물',z.W,z.pool);m.status='이용 중 '+u.count+'명 · 이동 중 '+u.moving+'명';m.rows=[['틈이 머금은 물',amount(z.S)+' / '+number(z.cap)],['고인 물에서 나누는 양','최대 1 / 분']];m.effects=['바위가 막아 주는 방향일 때 바람이 줄어요. 바람 방향이 바뀌면 보호 효과도 달라져요.','남아 있는 물만 보충해요. 물이 많거나 날씨가 위험하면 다른 안전한 자리를 찾아요.'];
 }
 if(!f){const upgrade=O.upgradeStatus(s,id);if(upgrade){if(upgrade.level<3)m.rows.push(['확장까지 실제 이용',Math.floor(upgrade.stageUseSeconds)+' / '+upgrade.requiredSeconds+'초'],['공간·물량 부족 경험',upgrade.pressureEvidence?'충족':'아직 없음']);if(upgrade.level<3)m.actions.push({action:'object-expand',label:upgrade.ready?'넓어질 모습 보기':'확장 조건 확인',disabled:!upgrade.ready});else m.rows.push(['확장 단계','가장 넓은 자리']);}}
 return m;
}
function render(s,id,closeIcon='×'){const m=model(s,id);if(!m)return '';const gauge=m.gauge?'<div class="object-gauge" role="img" aria-label="'+escape(m.gauge.label)+'"><div class="object-meter">'+m.gauge.parts.map(p=>'<i class="tone-'+p.tone+'" style="width:'+Math.max(0,Math.min(100,p.value/m.gauge.max*100))+'%"></i>').join('')+'</div><div class="object-legend">'+m.gauge.parts.filter(p=>p.value>0).map(p=>'<span class="tone-'+p.tone+'">'+escape(p.label)+' '+escape(amount(p.value))+'</span>').join('')+'<span>여유 '+escape(amount(m.gauge.free))+'</span></div></div>':'';
 return '<div class="select-head object-head"><div><h2>'+escape(m.name)+'</h2><p>'+escape(m.description)+'</p></div><button class="icon close" data-action="close-card" aria-label="선택 닫기">'+closeIcon+'</button></div><div class="object-metrics">'+m.metrics.map(v=>'<div data-metric="'+v.id+'"><span>'+escape(v.label)+'</span><strong>'+escape(v.value)+'</strong>'+(v.note?'<small>'+escape(v.note)+'</small>':'')+'</div>').join('')+'</div>'+gauge+'<p class="object-status">'+escape(m.status)+'</p><details data-object-details="conditions"><summary>'+(m.facility?'이용 안내':'이용·보충·확장 조건')+'</summary><dl class="object-facts">'+m.rows.map(([k,v])=>'<div><dt>'+escape(k)+'</dt><dd>'+escape(v)+'</dd></div>').join('')+'</dl>'+m.effects.map(t=>'<p class="sub">'+escape(t)+'</p>').join('')+(m.actions.length?'<div class="button-pair object-actions">'+m.actions.map(a=>'<button class="secondary" data-action="'+a.action+'" data-id="'+escape(m.id)+'" '+(a.friend?'data-friend="'+escape(a.friend)+'" ':'')+(a.disabled?'disabled':'')+'>'+escape(a.label)+'</button>').join('')+'</div>':'')+'</details>';
}
return {model,render,usage,number,amount};
});
