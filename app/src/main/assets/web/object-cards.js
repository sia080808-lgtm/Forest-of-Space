(function(root,factory){const api=factory(typeof module==='object'?require('./engine.js'):root.Forest);if(typeof module==='object')module.exports=api;else root.ForestObjectCards=api;})(globalThis,function(F){
'use strict';
const O=F.Objects,Sh=F.Shelter,escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>Number(Math.max(0,v).toFixed(2)).toString(),amount=v=>v>0&&v<.1?'0.1 미만':Number(Math.max(0,v).toFixed(1)).toString();
const metric=(id,label,value,note='')=>({id,label,value,note});
function usage(s,id){const ps=s.individuals.filter(p=>p.active&&!p.mounted&&p.objectTask?.object===id),inside=ps.filter(p=>O.at(s,p));return {count:inside.length,moving:ps.length-inside.length,used:inside.reduce((n,p)=>n+Sh.units(p),0)/4,reserved:ps.filter(p=>!inside.includes(p)).reduce((n,p)=>n+Sh.units(p),0)/4};}
function model(s,id){if(id==='shelter')id='shelter-0';const f=Sh.facility(s,id),z=f||O.patch(s,id);if(!z)return null;
 const m={id,name:f?['','기본 쉼터','넓은 쉼터','큰 쉼터'][f.level]:id==='spring'?'샘터':z.name,description:'',status:'',metrics:[],rows:[],effects:[],actions:[],gauge:null};
 const u=f?null:usage(s,id),meter=(label,value,max,tone='water')=>({label,max,parts:[{label,value,tone}],free:Math.max(0,max-value)});
 const sample=f?f:id==='spring'?s.spring:O.region(s,id,'rest'),light=Math.round(F.light(s,sample)),probe={...s.individuals[0],...sample,mounted:false,shelter:{phase:'outside'}};
 const wind=Math.round(F.Weather.wind(s,probe)),weatherSafe=wind<60;
 if(f){const v=Sh.ledger(s,f),actual=s.individuals.filter(p=>p.active&&!p.mounted&&p.shelter?.facilityId===id&&Sh.inside(s,p)).length;
  m.description='몸과 잎까지 안에 들어와 쉬는 자리예요.';m.status='쉬는 친구 '+actual+'명 · 전체 '+number(v.total/4)+'공간';
  m.metrics=[metric('used','사용 중',number(v.used/4)+'공간','퇴실 중인 공간 포함'),metric('free','빈 공간',number(v.free/4)+'공간'),metric('reserved','예약 중',number(v.reserved/4)+'공간'),metric('recovery','이용 시 체력','+4 / 분','체력 75까지')];
  m.gauge={label:'쉼터 공간',max:v.total/4,parts:[{label:'사용',value:v.used/4,tone:'moss'},{label:'예약',value:v.reserved/4,tone:'raw'}],free:v.free/4};
  m.rows=[['함께 쉬는 친구',v.seats+'명까지'],['성체 리들리','1공간'],['성체 엘레판','2공간'],['성체가 되면 필요한 공간',number(Sh.projectedNeed(s)/4)+'공간'],['빗방울 차단','90%'],['바람 줄임','80%']];
  m.effects=['수면과 날씨 대피로 체력을 회복해요. 물·영양은 다른 자리에서 보충해요.','빈 공간이 있어도 몸과 잎이 맞고 입구가 열려 있어야 들어갈 수 있어요.'];
  if(f.level<3)m.actions.push({action:'facility-expand',label:'공간 넓히기',disabled:!s.shelters.unlocked});m.actions.push({action:'facility-add',label:'쉼터 추가',disabled:!s.shelters.unlocked});if(!f.base)m.actions.push({action:'facility-move',label:'옮기기'},{action:'facility-store',label:'보관하기'});
 }else if(id==='litter'){
  const total=O.storedLeaf(s),cap=O.capacity(s,id),carry=s.individuals.reduce((n,p)=>n+(p.carriedLeaf?.amount||0)+(p.rootLitter||0),0),rates=O.litterRates(s),remaining=Math.max(0,s.objects.dayQuota-s.objects.arrivedToday);
  m.description='낙엽으로 놀고, 분해된 거름에서 영양을 얻어요.';
  m.metrics=[metric('raw','놀이용 낙엽',amount(z.O),'가지고 놀 수 있는 양'),metric('compost','흡수할 거름',amount(z.U),'영양으로 바뀌는 양'),metric('free','남은 저장 공간',amount(Math.max(0,cap-total))),metric('capacity','전체 저장 용량',number(cap))];
  m.gauge={label:'낙엽과 거름 합계 '+amount(total)+' / '+number(cap),max:cap,parts:[{label:'낙엽',value:z.O,tone:'raw'},{label:'거름',value:z.U,tone:'compost'},{label:'운반',value:carry,tone:'carry'}],free:Math.max(0,cap-total)};
  m.status=z.O<.5?(z.U>0?'놀이할 낙엽은 부족하지만 거름은 흡수할 수 있어요.':'새 낙엽이 모이길 기다려요.'):z.U<=0?'놀이할 낙엽이 있어요. 거름은 천천히 생겨요.':'낙엽 놀이와 영양 보충을 할 수 있어요.';
  m.rows=[['친구가 들고 있는 낙엽',amount(carry)],['거름이 되는 속도',number(Math.min(z.O*60,rates.perMinute))+' / 분'],['놀이 후 분해 촉진',rates.boost>1?number(Math.max(0,s.objects.playBoostUntil-s.worldTick))+'초 남음':'없음'],['오늘 모인 낙엽',amount(s.objects.arrivedToday)+' / '+number(s.objects.dayQuota)],['오늘 더 들어올 수 있는 양',amount(Math.min(remaining,Math.max(0,cap-total)))] ];
  m.effects=['놀이: 기분 +3/분, 체력 −1/분. 거름 흡수: 영양 최대 +1/분.','분해는 낙엽을 거름으로 바꿔요. 거름을 흡수해야 빈 공간이 생겨요. 오늘 한도는 숲의 하루 기준이에요.'];
 }else if(id==='moss'){
  m.description='포근하게 놀며 기분과 체력을 천천히 회복해요.';
  m.metrics=[metric('water','저장된 물',amount(z.S)+' / '+O.capacity(s,id),'아주 적은 양만 머금어요'),metric('space','사용 / 전체 공간',number(u.used)+' / '+number(O.spaceCapacity(s,id)/4),'예약 '+number(u.reserved)+'공간'),metric('mood','이용 시 기분','+1 / 분','기분 80까지'),metric('energy','이용 시 체력','+2 / 분','체력 75까지')];
  m.gauge=meter('이끼가 머금은 물',z.S,O.capacity(s,id));m.status=!weatherSafe||F.Environment.precipitation(s,'rain')>=.6?'날씨가 거세면 안전한 곳에서 쉬어요.':z.S<=0?'물은 말랐어도 놀이와 회복은 가능해요.':'수분은 조금 나누고, 회복은 서서히 도와줘요.';
  m.rows=[['조금씩 나누는 물','최대 0.5 / 분'],['현재 이용',u.count+'명'],['이동 중',u.moving+'명']];m.effects=['안전하게 자리에 머문 시간만큼 회복해요. 들어오는 순간 수치가 오르지는 않아요.','물이 남아 있고 목마를 때만 조금 나눠줘요. 물이 없어도 기분·체력 회복은 유지돼요.'];
 }else if(id==='spring'){
  const cap=O.capacity(s,id),inflow=s.started&&s.mode==='game'&&!s.offline?(s.spring.inflow||0)*60:0;
  m.description='비가 모이면 친구들이 찾아와 마시고 놀아요.';
  m.metrics=[metric('water','마실 수 있는 물',amount(z.water)+' / '+number(cap)),metric('flow','현재 물 유입',number(inflow)+' / 분',inflow>0?'비·녹은 눈이 모여요':'지금 들어오는 물은 없어요'),metric('drink','이용 시 음수','최대 10 / 분','몸 수분 65까지'),metric('splash','물장구',z.water>=cap*.2?'물 충분':'물 부족','물 '+number(cap*.2)+' 이상 필요')];
  m.gauge=meter('샘터 잔량',z.water,cap);m.status=z.water<=0?'샘터가 비었어요. 비가 와야 다시 물이 모여요.':!weatherSafe?'바람이 잦아든 뒤 이용할 수 있어요.':'물을 마시면 남아 있는 양이 줄어요.';
  m.rows=[['남아 있는 눈',amount(z.snowWater||0)],['현재 이용',u.count+'명'],['이동 중',u.moving+'명']];m.effects=['보충: 실제 비와 저장된 눈이 녹은 물. 시간만 지나서는 차지 않아요.','물장구: 수분 최대 +6/분(65까지), 기분 +2/분, 체력 −1/분. 마신 만큼 샘물이 줄어요. 물이 적거나 뿌리가 많이 젖으면 가장자리에서 마셔요.'];
 }else if(id==='shade'){
  m.description='넓은 잎 아래에서 햇빛과 빗방울을 덜 맞아요.';
  m.metrics=[metric('shade','빛 줄임','35%','이 잎이 만드는 그늘'),metric('rain','빗방울 차단','50%','잎에 가려진 범위'),metric('light','현재 그늘의 빛',light+' / 100'),metric('energy','이용 시 체력','+1.5 / 분','체력 75까지')];
  m.status='이용 중 '+u.count+'명 · 이동 중 '+u.moving+'명';m.rows=[['잎 표면의 물기',Math.round((z.film||0)*100)+'%'],['현재 유효 바람',wind+' / 100']];m.effects=['실제로 잎에 가려지는 자리에서만 보호받아요. 다른 잎과 겹치면 현재 빛은 더 낮아질 수 있어요.','강풍이나 침수, 과습 상태에서는 다른 안전한 자리를 찾아요.'];
 }else if(id==='rock'){
  m.description='물기가 빠지는 바위에서 가볍게 쉬어요.';
  m.metrics=[metric('wet','바위 표면의 젖음',Math.round(F.moisture(z))+'%'),metric('light','현재 햇빛',light+' / 100'),metric('drain','물 빠짐','최대 '+number(z.drain)+' / 분'),metric('energy','이용 시 체력','+1 / 분','체력 75까지')];
  m.status=O.dry(s,id)&&wind<50?'표면이 마르고 바람이 잔잔해 쉬기 좋아요.':'표면과 바람이 잔잔해지길 기다려요.';m.rows=[['현재 이용',u.count+'명'],['이동 중',u.moving+'명'],['현재 유효 바람',wind+' / 100']];m.effects=['마른 표면과 안전한 바람일 때 쉬어요. 물·영양을 채우는 주 공급원은 아니에요.'];
 }else if(id==='crevice'){
  m.description='바위 사이에 몸을 숨기고 남은 물기를 느껴요.';
  m.metrics=[metric('pool','틈에 고인 물',amount(z.W)+' / '+number(z.pool)),metric('wind','현재 유효 바람',wind+' / 100'),metric('reduction','바람 줄임',Math.cos(s.weather.wind_dir||0)<-.5?'50%':'0%','현재 바람 방향 기준'),metric('energy','이용 시 체력','+1 / 분','체력 75까지')];
  m.gauge=meter('바위틈 고인 물',z.W,z.pool);m.status='이용 중 '+u.count+'명 · 이동 중 '+u.moving+'명';m.rows=[['틈이 머금은 물',amount(z.S)+' / '+number(z.cap)],['고인 물에서 나누는 양','최대 1 / 분']];m.effects=['바위가 막아 주는 방향일 때 바람이 줄어요. 바람 방향이 바뀌면 보호 효과도 달라져요.','남아 있는 물만 보충해요. 물이 많거나 날씨가 위험하면 다른 안전한 자리를 찾아요.'];
 }
 if(!f){const upgrade=O.upgradeStatus(s,id);if(upgrade){if(upgrade.level<3)m.rows.push(['확장까지 실제 이용',Math.floor(upgrade.stageUseSeconds)+' / '+upgrade.requiredSeconds+'초'],['공간·물량 부족 경험',upgrade.pressureEvidence?'충족':'아직 없음']);if(upgrade.level<3)m.actions.push({action:'object-expand',label:upgrade.ready?'넓어질 모습 보기':'확장 조건 확인',disabled:!upgrade.ready});else m.rows.push(['확장 단계','가장 넓은 자리']);}}
 return m;
}
function render(s,id,closeIcon='×'){const m=model(s,id);if(!m)return '';const gauge=m.gauge?'<div class="object-gauge" role="img" aria-label="'+escape(m.gauge.label)+'"><div class="object-meter">'+m.gauge.parts.map(p=>'<i class="tone-'+p.tone+'" style="width:'+Math.max(0,Math.min(100,p.value/m.gauge.max*100))+'%"></i>').join('')+'</div><div class="object-legend">'+m.gauge.parts.filter(p=>p.value>0).map(p=>'<span class="tone-'+p.tone+'">'+escape(p.label)+' '+escape(amount(p.value))+'</span>').join('')+'<span>여유 '+escape(amount(m.gauge.free))+'</span></div></div>':'';
 return '<div class="select-head object-head"><div><h2>'+escape(m.name)+'</h2><p>'+escape(m.description)+'</p></div><button class="icon close" data-action="close-card" aria-label="선택 닫기">'+closeIcon+'</button></div><div class="object-metrics">'+m.metrics.map(v=>'<div data-metric="'+v.id+'"><span>'+escape(v.label)+'</span><strong>'+escape(v.value)+'</strong>'+(v.note?'<small>'+escape(v.note)+'</small>':'')+'</div>').join('')+'</div>'+gauge+'<p class="object-status">'+escape(m.status)+'</p><details data-object-details="conditions"><summary>이용·보충·확장 조건</summary><dl class="object-facts">'+m.rows.map(([k,v])=>'<div><dt>'+escape(k)+'</dt><dd>'+escape(v)+'</dd></div>').join('')+'</dl>'+m.effects.map(t=>'<p class="sub">'+escape(t)+'</p>').join('')+(m.actions.length?'<div class="button-pair object-actions">'+m.actions.map(a=>'<button class="secondary" data-action="'+a.action+'" data-id="'+escape(m.id)+'" '+(a.disabled?'disabled':'')+'>'+escape(a.label)+'</button>').join('')+'</div>':'')+'</details>';
}
return {model,render,usage,number,amount};
});
