'use strict';
(()=>{
const F=Forest,$=id=>document.getElementById(id),ctx=$('map').getContext('2d'),names={EC01:'비 뒤 보습과 돌돌이',EC02:'봉봉의 빗물 나눔',EC03:'넓이 둘의 그늘과 쉼',roster:'다섯 친구 편성'};
let s,playing=false,visible=true,acc=0,previous=0,baseline,initialLedger,notice='';
const x=p=>20+p.x*350,y=p=>20+p.y*600;
function reset(){s=ForestFixtures.make($('scenario').value,true);baseline=F.totalWater(s);initialLedger={...s.ledger};playing=false;acc=0;visible=true;notice='';$('history').textContent=$('scenario').value==='EC02'?'시작 조건: 봉봉이 실제 강수 계산으로 160초 동안 모은 물을 보유하고 있어요. 수신자의 갈증은 시험 시작값이에요.':'시작 조건: SRS의 해당 장면을 재현하도록 배치한 시험 정원이에요.';render();}
function advance(n){for(let i=0;i<n;i++)F.step(s,{visible});render();}
function shape(p,rx,ry,fill,stroke){ctx.beginPath();ctx.ellipse(x(p),y(p),rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function render(){ctx.clearRect(0,0,390,640);ctx.fillStyle='#edeadc';ctx.fillRect(0,0,390,640);ctx.font='12px Forest,sans-serif';ctx.textAlign='center';
 for(const p of s.patches){shape(p,27,21,p.id==='moss'?`rgba(83,125,75,${.15+F.moisture(p)/140})`:'#dfd7c8');ctx.fillStyle='#536349';ctx.fillText(p.name,x(p),y(p)-37);ctx.fillText(Math.round(F.moisture(p))+'%',x(p),y(p)+5);}
 shape(s.spring,38,23,'#a6c5bc');ctx.fillStyle='#344535';ctx.fillText('샘터',x(s.spring),y(s.spring));
 for(const p of F.Social.shades(s))shape(p,F.Social.R*350,F.Social.R/F.Space.ASPECT*600,'rgba(74,111,56,.15)','#83a473');
 for(const p of s.individuals.filter(p=>p.active)){const motion=p.motion?.kind,index=s.individuals.indexOf(p)+1;shape(p,15,17,p.species==='ridley'?'#777850':p.species==='bonbon'?'#66746b':'#415845','#f8f5df');ctx.fillStyle='#fff8df';ctx.fillText(index,x(p),y(p)+4);
 if(p.motion?.transfer>0){const r=s.individuals.find(q=>q.id===p.motion.recipient);ctx.beginPath();ctx.moveTo(x(p),y(p));ctx.lineTo(x(r),y(r));ctx.strokeStyle='#518fc1';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#27618e';ctx.fillText(p.motion.transfer.toFixed(1), (x(p)+x(r))/2,(y(p)+y(r))/2-10);}}
 if(s.neighbor.stage==='visiting'){const p=s.patches.find(p=>p.id==='crevice');shape({...p,y:p.y+.05},9,7,'#686359');ctx.fillStyle='#344535';ctx.fillText('돌돌이 · 쉬는 중',x(p),y(p)+52);}
 const key=$('scenario').value,a=s.social.sessions[0],found=s.discoveries[key];$('status').textContent=notice||(found?'발견 확인 · '+found.text: names[key]+' · '+(a?({signal:'신호',approach:'접근',accept:'수락',transfer:'물 전달',response:'마무리',rest:'쉼 '+a.steps+'/20초'})[a.phase]:'현재 조건을 기다려요.'));
 $('play').textContent=playing?'일시정지':'재생';$('visible').textContent=visible?'관찰 중':'다른 탭 상황';$('visible').setAttribute('aria-pressed',visible);
 $('pets').replaceChildren();for(const p of s.individuals){const box=document.createElement('div');box.className='pet';const h=document.createElement('strong');h.textContent=(s.individuals.indexOf(p)+1)+'. '+p.name+' · '+(p.active?'생활 중':'대기');box.append(h);const detail=document.createElement('p');detail.textContent=(({share:'물 전달',receive:'물 받기',shade:'그늘 펼침',rest:'쉼',groom:'잎 정돈',walk:'걷기',slow:'느린 걸음',hurry:'물 찾기',run:'대피'})[p.motion?.kind]||'대기')+' · 수분 '+p.B.toFixed(1)+' / 저장수 '+p.V.toFixed(1)+'\n빗물 '+p.sources.rain.toFixed(1)+' · 기타 '+p.sources.other.toFixed(1);box.append(detail);const b=document.createElement('button');b.textContent=p.active?'대기로 옮기기':'정원에 들이기';b.onclick=()=>{try{F.roster(s,p.id,!p.active);notice='';}catch(e){notice=e.message;}render();};box.append(b);$('pets').append(box);}
 const delta=k=>s.ledger[k]-initialLedger[k],expected=baseline+delta('rain')+delta('spring')-delta('outflow')-delta('evaporation')-delta('physiology');$('water').textContent='정원 시계 '+s.worldTick+'초 · 물 보존 오차 '+Math.abs(F.totalWater(s)-expected).toExponential(1)+' · 환경 발견 보상 XP 0';$('events').replaceChildren();for(const e of s.events.slice(-12).reverse()){const p=document.createElement('p');p.textContent=e.tick+'초 · '+e.text+(e.amount?' ('+e.amount.toFixed(2)+', 빗물 '+e.sources.rain.toFixed(2)+')':'');$('events').append(p);}
}
$('scenario').onchange=reset;$('reset').onclick=reset;$('play').onclick=()=>{playing=!playing;render();};$('step').onclick=()=>advance(1);$('ten').onclick=()=>advance(10);$('visible').onclick=()=>{visible=!visible;render();};$('storm').onclick=()=>{s.weather.wind=75;advance(1);};$('layout').onclick=()=>{F.layout(s,{});render();};
document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;acc=0;render();}});
function frame(t){if(previous&&playing&&!document.hidden){acc+=Math.min(.2,(t-previous)/1000)*Number($('speed').value);const n=Math.floor(acc);if(n){acc-=n;advance(n);}}previous=t;requestAnimationFrame(frame);}reset();requestAnimationFrame(frame);
})();
