'use strict';
(()=>{
const F=Forest,$=id=>document.getElementById(id),escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={world:'<path d="M4 15c0-6 4-9 8-9s8 3 8 9v4H4z"/><path d="M8 19v-5a4 4 0 0 1 8 0v5M12 6V3m0 2 4-2"/>',friends:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5"/>',book:'<path d="M12 6C8 3 5 4 2 5v15c4-2 7-1 10 0 3-1 6-2 10 0V5c-3-1-6-2-10 1Zm0 0v14"/>',leaf:'<path d="M12 21V10C8 4 3 4 2 4c0 8 5 11 10 8M12 15c1-8 7-10 10-10 0 7-5 11-10 10"/>',gear:'<path d="M19.391 8.939 L19.846 10.439 L21.808 10.049 L21.808 13.951 L19.846 13.561 L19.391 15.061 L19.391 15.061 L18.652 16.445 L20.315 17.556 L17.556 20.315 L16.445 18.652 L15.061 19.391 L15.061 19.391 L13.561 19.846 L13.951 21.808 L10.049 21.808 L10.439 19.846 L8.939 19.391 L8.939 19.391 L7.555 18.652 L6.444 20.315 L3.685 17.556 L5.348 16.445 L4.609 15.061 L4.609 15.061 L4.154 13.561 L2.192 13.951 L2.192 10.049 L4.154 10.439 L4.609 8.939 L4.609 8.939 L5.348 7.555 L3.685 6.444 L6.444 3.685 L7.555 5.348 L8.939 4.609 L8.939 4.609 L10.439 4.154 L10.049 2.192 L13.951 2.192 L13.561 4.154 L15.061 4.609 L15.061 4.609 L16.445 5.348 L17.556 3.685 L20.315 6.444 L18.652 7.555 L19.391 8.939 Z"/><circle cx="12" cy="12" r="3.2"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',tool:'<path d="M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-3-.5-.5-3z"/>',arrow:'<path d="m9 5 7 7-7 7"/>',back:'<path d="m15 5-7 7 7 7"/>',expand:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',home:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>',video:'<path d="M3 8h12v11H3z"/><circle cx="9" cy="13.5" r="3"/><path d="m15 12 6-3.2v9.4L15 15"/><path d="M5.5 8 6.6 5.8h3.8L11.5 8"/>',camera:'<path d="M4 8h3.2l1.8-2.2h6l1.8 2.2H20v11H4z"/><circle cx="12" cy="13.2" r="3.4"/>'};
Object.assign(icons,{sun:'<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',moon:'<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>',horizon:'<path d="M3 18h18m-14 0v-3a5 5 0 0 1 10 0v3m-5-11V5M5 10 3.6 8.6M19 10l1.4-1.4"/>'});
const icon=k=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+icons[k]+'</svg>';
const native=window.RidleyNative,KEY='forest-of-space-v1';let inspector=null,inspectionCamera=null;let adminWho='all',hintMsg='',hintUntil=0,state,tab='world',selected=null,patchSelected=null,dex='species',editor=false,ready=false,storageFailed=false,foreground=!document.hidden,last=performance.now(),acc=0,lastSave=0,toastTimer,returnPage='world',pendingImport=null,facilityDraft=null;
function notice(t){$('toast').textContent=t;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),5500);}
function rawRead(){return native?native.read():localStorage.getItem(KEY)||'';}
function copyForTick(s){const next=window.ForestFriendship.copyForTick(s,F.clone(s));return F.Space.copyForTick(s,next);}
function write(s){try{const next=F.clone(s);next.savedAt=Math.max(next.savedAt,Date.now());const text=JSON.stringify(next);if(native){if(!native.save(text))return false;}else localStorage.setItem(KEY,text);s.savedAt=next.savedAt;return true;}catch{return false;}}
function archive(s){const text=typeof s==='string'?s:JSON.stringify(s);try{if(native)return native.archive(text);const previous=JSON.parse(localStorage.getItem(KEY+'-history')||'[]');previous.unshift({at:Date.now(),text});localStorage.setItem(KEY+'-history',JSON.stringify(previous.slice(0,10)));return true;}catch{return false;}}
function archiveRead(){return native?native.readArchive():(JSON.parse(localStorage.getItem(KEY+'-history')||'[]')[0]?.text||'');}
function commit(fn,after){if(inspector){notice('검수 화면에서는 실제 기록을 바꾸지 않아요.');return false;}try{state=F.transaction(state,fn,write);storageFailed=false;after?.();update();return true;}catch(e){notice(e.message);return false;}}
const portrait=id=>id==='dico'?'assets/forest/species/dico.webp':id==='maria'?'assets/forest/species/maria.webp':id==='bonbon'?'assets/forest/species/ellisii-portrait.png':id==='superbum'?'assets/forest/species/superbum-portrait.png':id==='neolbi'?'assets/forest/neolbi/portrait.png':['bonbon','bosong','jureong','duri'].includes(id)?'assets/forest/species/'+id+'-portrait.png':'assets/forest/ridley.png';
const speciesName=p=>F.SPECIES.find(x=>x[0]===p.species)?.[1]||'친구';
// small neighbours on this friend's leaves (SRS ECO-09: say what they do and why, no raw density)
function leafNote(p){const on=F.Creatures?.onLeaf?.(state,p.id);if(!on)return '';const roots=F.Creatures.rootsNear?.(state,p);const m=on.mite,k=on.keeper;
 if(on.mealy){if(on.lady)return on.lady.stage==='larva'?' · 점박이 유충이 솜깍지를 먹는 중':' · 점박이가 솜깍지 알주머니를 살피는 중';if(on.ant)return ' · 짐꾼개미가 솜깍지의 감로 곁에 머물러요';return on.mealy.density>=30?' · 잎 사이 솜깍지가 늘어 영양이 덜 가요. 잎을 정돈하거나 쉼터에서 쉬면 줄어요':' · 잎 사이에 솜깍지가 붙어 있어요';}
 if(on.lady)return ' · 점박이가 남은 솜깍지를 살피는 중';
 if(!m&&!k&&roots)return (()=>{const S=F.Creatures.inSoil(state,roots.z.id),who=[S.soilmite&&'흙지기',S.rove&&'쏙쏙이'].filter(Boolean).join('·');return who?' · '+who+'가 젖은 낙엽 속 뿌리날파리 유충을 줄이는 중':' · 젖은 낙엽 곁이라 뿌리날파리 유충이 뿌리를 귀찮게 해요';})();
 if(k&&m)return ' · 잎지기가 잎응애를 찾아 먹는 중';if(k)return ' · 잎지기가 남은 잎응애를 살피는 중';if(!m)return '';const l=F.Creatures.leaf(state,p);return m.density>=30?' · 잎응애가 늘어 잎이 지쳐요. 그늘·물가에서 쉬면 줄어요':l.H>55||l.wet||l.inside?' · 잎이 촉촉해져 잎응애가 줄고 있어요':' · 마른 잎에 잎응애가 머물러요';}
// SRS v2.28 species traits: strong and weak points from the motif fern (detail page and the guide)
function traitText(id){const t=globalThis.ForestTraits?.text(id);if(!t||!t.good.length)return '';return '\n\n강한 점\n'+t.good.map(x=>'· '+x).join('\n')+'\n\n약한 점\n'+t.bad.map(x=>'· '+x).join('\n');}
// SRS v2.36 고유 스킬 칸 (친구 자세히 보기 · 도감)
function skillHtml(p){const K=window.ForestSkills,i=K?.INFO[p.species];if(!i)return '';return '<div class="panel traits"><h3>고유 스킬 · '+escape(i.name)+'</h3><p class="sub">'+escape(i.line)+'</p>'+(()=>{const v=K.levelLines?.(p);return v?'<p class="sub">Lv'+v.level+' · '+escape(v.now)+'</p>'+(v.next?'<p class="sub">다음 Lv'+v.next.level+' · '+escape(v.next.line)+'</p>':''):'';})()+'<p class="sub">오늘 '+K.today(state,p)+'번 했어요</p></div>';}
function skillText(id){const K=window.ForestSkills,i=K?.INFO[id];if(!i)return '';const a=K.levelLines?.({species:id,xp:0}),b=K.levelLines?.({species:id,xp:150});return '\n\n고유 스킬 · '+i.name+'\n'+i.line+(a&&b?'\nLv1 · '+a.now+'\nLv10 · '+b.now:'');}
function traitHtml(id){const t=globalThis.ForestTraits?.text(id);if(!t||!t.good.length)return '';const li=a=>a.map(x=>'<li>'+escape(x)+'</li>').join('');return '<div class="panel traits"><h3>타고난 특성</h3><div class="trait-cols"><div><small>강한 점</small><ul>'+li(t.good)+'</ul></div><div><small>약한 점</small><ul>'+li(t.bad)+'</ul></div></div></div>';}
function actionReason(p){const swim=F.Swim.reason(state,p);if(swim)return swim;const boat=F.Boat.reason(state,p);if(boat)return boat;const canopy=F.Social.canopyReason(state,p);if(canopy)return canopy;if(!p.active)return '정원 밖에서 쉬고 있어요 · 친구들 화면에서 정원에 들일 수 있어요';if(p.mounted||(p.shelter?.phase&&p.shelter.phase!=='outside')||p.action==='rest'&&p.target==='shelter'&&!p.protectedBy)return F.Shelter.label(state,p);{const k=window.ForestSkills?.status(state,p);if(k&&(p.skill||p.skillHold||p.guideTo||!F.Objects.reason(state,p)))return k;}if(p.species==='superbum'&&p.restSelf&&p.motion?.kind==='rest')return '둥지잎을 접고 제자리에서 쉬어요';if(F.Objects.reason(state,p))return F.Objects.reason(state,p);if(p.protectedBy)return '엘레판의 잎 아래서 비와 바람을 피하고 있어요';if(p.wetRecovery)return '뿌리가 오래 젖어 마른 자리로 가요';if(p.leafRecovery||p.damage>=10)return '잎이 지쳐 안전한 곳에서 쉬어요';if(p.motion?.kind==='umbrella')return '큰 잎으로 친구의 빗방울을 덜어줘요';if(p.species==='bonbon'&&F.Social.ellisiiHabitat(state,p))return '잎틈에서 작은 이웃이 쉬기 좋은 자리를 살펴요';if(p.motion?.kind==='share')return '모아 둔 물을 친구에게 나눠요';if(p.species==='superbum'&&p.harvestTick>0)return '둥지잎에 빗물을 모으고 있어요';if(p.motion?.kind==='receive')return '친구가 건넨 물을 마셔요';if(p.motion?.kind==='shade')return '큰 잎으로 그늘을 만들어요';if(p.mounted)return '목부작 자리에서 쉬고 있어요';if(p.action==='drink')return p.motion?.water>0?'물가에서 천천히 물을 마시고 있어요':'목이 말라 샘터로 가고 있어요';if(p.motion?.kind==='run')return '바람을 피해 쉼터로 달려가요';if(p.action==='rest')return p.protectedBy?'잎 그늘 아래서 쉬고 있어요':F.Shelter.label(state,p);if(p.action==='groom')return '자기 잎을 살며시 정돈하고 있어요';return '정원의 작은 변화를 살피고 있어요';}
function leafCondition(p){return 100-clampPct(p.damage||0);}
function leafConditionLabel(p){return Math.floor(leafCondition(p)*10)/10+' / 100';}
function leafDamageStat(p){
 const torn=Boolean(F.Leaf.flags(p)&F.Leaf.TORN);
 return '<div class="stat"><span>손상</span><progress max="100" value="'+leafCondition(p)+'" aria-label="손상'+(torn?' · 찢어짐':'')+'" aria-valuetext="'+leafConditionLabel(p)+'"></progress><b>'+leafConditionLabel(p)+'</b></div>';
}
function rangeStat(label,value,band,status,readout,style){
 const position=Math.round(clampPct(value)*10)/10;
 return '<div class="stat two '+style+'"><span>'+label+'</span><div class="track" role="meter" aria-label="'+label+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+position+'" aria-valuetext="'+readout+'"><i class="fit" style="left:'+band.lo+'%;width:'+(band.hi-band.lo)+'%"></i><i class="mark" style="left:'+position+'%"></i></div><b>'+status+'</b></div>';
}
function stats(p){
 const V=window.ForestVitals,band=V.band(p),energy=V.shown(p);
 const care=(label,value,low,high)=>{
  const zone=V.zone(value,band),name=zone==='ok'?'적정':value<band.lo?low:high;
  const readout=Math.round(value)+' · '+name;
  return rangeStat(label,value,band,readout,readout,zone);
 };
 const temp=V.temperature(state,p);
 const temperature=p.active?rangeStat('온도',temp.value,V.TEMPERATURE_BAND,temp.label,temp.label,'temperature'):
  '<div class="stat two temperature"><span>온도</span><div class="track" aria-hidden="true"></div><b>—</b></div>';
 const vigor='<div class="stat"><span>기운</span><progress max="100" value="'+p.energy+'" aria-label="기운"></progress><b>'+energy.now+' / '+energy.max+'</b></div>';
 return '<div class="stats">'+vigor+care('수분',p.B,'마름','과습')+
  leafDamageStat(p)+care('영양',p.nutrition,'결핍','과잉')+growthStat(p)+temperature+'</div>';
}
function refreshStats(container,p){
 const current=container.querySelector('.stats');
 if(!current)return;
 const html=stats(p);
 if(current.outerHTML!==html)current.outerHTML=html;
}
// 1.2.3 (user: "성장 경험도 바 형태로 … 기운 오른쪽 영양 아래 … 성장으로 표시하고 … 총량분에 몇 채워졌다"): progress through the current level
function growthStat(p){const L=F.level(p),lo=F.LEVELS[L-1],hi=F.LEVELS[L],top=hi==null,got=top?1:Math.floor(p.xp)-lo,need=top?1:hi-lo;return '<div class="stat grow"><span>성장</span><progress max="'+need+'" value="'+got+'" aria-label="성장 '+(top?'최대':got+' / '+need)+'"></progress><b>'+(top?'최대':got+' / '+need)+'</b></div>';}
function clampPct(v){return Math.max(0,Math.min(100,v));}
// 육각형 종족값 (SRS v2.34 ST34-04): six stats 1..5 drawn as a small hexagon
function hexHtml(p){const T=window.ForestTraits,h=T.hex(p.species,T.level(p.xp)),K=T.KEYS,c=60,r=44,pt=(i,v)=>{const a=-Math.PI/2+i*Math.PI/3;return [(c+Math.cos(a)*r*v/5).toFixed(1),(c+Math.sin(a)*r*v/5).toFixed(1)];};
 const ring=v=>K.map((k,i)=>pt(i,v).join(',')).join(' '),shape=K.map((k,i)=>pt(i,h[k]).join(',')).join(' ');
 const labels=K.map((k,i)=>{const [x,y]=pt(i,6.3);return '<text x="'+x+'" y="'+y+'" text-anchor="middle" dominant-baseline="middle">'+T.NAMES[k]+' '+h[k]+'</text>';}).join('');
 return '<div class="panel hexstats"><h3>종족값</h3><svg viewBox="-14 -6 148 132" role="img" aria-label="종족값 '+K.map(k=>T.NAMES[k]+' '+h[k]).join(', ')+'"><polygon points="'+ring(5)+'" class="r5"/><polygon points="'+ring(3)+'" class="r3"/><polygon points="'+shape+'" class="me"/>'+labels+'</svg><p class="sub">합계 '+K.reduce((n,k)=>n+h[k],0)+' · 레벨 3·6·9에 가장 낮은 칸이 1씩 올라요.</p></div>';}
const scene=new ForestScene($('garden'),()=>inspector?.state||state),audio=new ForestAudio.Player();
/* 0.8.2: two small see-through icons (user: "작고 투명한 아이콘으로 전체모드, 원래 화면 배율") */
/* 0.8.2: one button (user: "두 개로 나누지 말고 한 개 버튼"): in the overview it brings the default scale back, otherwise it shows the whole forest */
const viewButtons=()=>{const o=!!scene.camera.overview;$('overview').innerHTML=icon(o?'home':'expand');$('overview').setAttribute('aria-label',o?'기본 화면 배율로':'월드 전체 보기');$('overview').title=o?'기본 배율':'전체 보기';};
scene.onCamera=viewButtons;
const carry=new ForestCarry($('world'),scene,()=>state,commit,notice);
$('cancel-carry').onclick=()=>carry.cancel();
scene.onCarry=active=>{if(active){closeCard();if(carry.held){audio.cancelShots(carry.held);audio.marker('pickup:'+performance.now(),'groom',carry.held);}}scene.cameraChanged();targets();};
scene.onMarker=(id,cue,emitter)=>{if(!inspector)audio.marker(id,cue,emitter);};
const landed=scene.landed.bind(scene);scene.landed=id=>{landed(id);audio.marker('land:'+performance.now(),'putdown',id);};
document.addEventListener('pointerdown',()=>audio.unlock(),{passive:true});
// 1.2.1 (user: "관리자 모드에서 스크롤 내릴 때 특정 항목 눌려져서 불편함"): a finger that moved or scrolled the admin panel
// is a scroll, not a tap — swallow the click that some WebViews still send at the end of it
{let sx=0,sy=0,moved=false;const inPanel=e=>e.target?.closest?.('#admin-panel');
 document.addEventListener('pointerdown',e=>{if(inPanel(e)){sx=e.clientX;sy=e.clientY;moved=false;}},{passive:true,capture:true});
 document.addEventListener('pointermove',e=>{if(inPanel(e)&&Math.hypot(e.clientX-sx,e.clientY-sy)>10)moved=true;},{passive:true,capture:true});
 document.addEventListener('scroll',e=>{if(e.target?.closest?.('#admin-panel'))moved=true;},{passive:true,capture:true});
 document.addEventListener('click',e=>{if(moved&&inPanel(e)){e.stopPropagation();e.preventDefault();}moved=false;},true);}
document.addEventListener('keydown',()=>audio.unlock(),{passive:true});
document.addEventListener('click',e=>{if(!inspector&&foreground&&e.target.closest('button'))audio.marker('ui:'+performance.now(),'click','ui');},{passive:true});
scene.onSelect=(kind,id)=>{if(kind==='pet'&&adminOpen&&adminOn){/* 1.2.1: tapping a friend picks it without leaving the open tab (보기 · 스킬 범위 stays put) */adminFriend=id;scene.selected=id;adminFocus(id);renderAdmin();return;}if(kind==='pet'){selected=id;patchSelected=null;scene.selected=id;showCard();}else if(editor&&!facilityDraft&&kind==='facility'){editFacility(id,'move');}else if(editor&&!facilityDraft&&(kind==='patch'||kind==='spring')&&!String(id).startsWith('pile')){scene.selectedPatch=id;renderEditor();}else if(kind==='patch'||kind==='spring'||kind==='facility'){selected=null;scene.selected=null;patchSelected=id;showCard();}else closeCard();};
scene.onMove=(id)=>{scene.selectedPatch=id;renderEditor();};
function targets(){const root=$('targets');root.replaceChildren();for(const p of state.individuals.filter(p=>p.active)){const b=document.createElement('button');b.className='pet-target';b.dataset.pet=p.id;b.setAttribute('aria-label',p.name+' · '+speciesName(p)+' 선택');b.addEventListener('click',()=>scene.onSelect('pet',p.id));const label=document.createElement('span');label.className='pet-label';label.hidden=!state.settings.showName&&!state.settings.showLevel;label.textContent=[state.settings.showName?p.name:'',state.settings.showLevel?'Lv.'+F.level(p):''].filter(Boolean).join(' · ');b.append(label);root.append(b);}}
function closeCard(){delete $('select-card').dataset.key;delete $('select-card').dataset.objectId;delete $('select-card').dataset.objectHtml;$('select-card').classList.remove('object-card');selected=null;patchSelected=null;scene.selected=null;$('select-card').hidden=true;}
function updateObjectCard(card,id){const html=ForestObjectCards.render(state,id,icon('close'));if(!html){closeCard();return;}
 const same=card.dataset.objectId===id;if(same&&card.dataset.objectHtml===html)return;
 const scroll=same?card.scrollTop:0,open=same&&card.querySelector('[data-object-details]')?.open,focused=card.contains(document.activeElement)?document.activeElement?.dataset.action:null,summaryFocused=same&&document.activeElement===card.querySelector('summary');
 card.innerHTML=html;card.dataset.objectId=id;card.dataset.objectHtml=html;card.classList.add('object-card');
 const details=card.querySelector('[data-object-details]');if(details)details.open=!!open;card.scrollTop=scroll;
 if(focused)card.querySelector('[data-action="'+focused+'"]')?.focus({preventScroll:true});else if(summaryFocused)card.querySelector('summary')?.focus({preventScroll:true});
}
function previewObjectUpgrade(id){try{const next=F.Objects.planUpgrade(state,id),u=F.Objects.upgradeStatus(state,id);scene.objectExpansionPreview={id,scale:F.Objects.scale(next,id)};const cancel=()=>{scene.objectExpansionPreview=null;closeDialog();};dialog('자리를 넓힐까요?','보유량 '+u.capacity+' → '+u.nextCapacity+'. 지금 남아 있는 양은 그대로이고 비용은 없어요.',[{label:'취소',fn:cancel},{label:'넓히기',fn:()=>commit(s=>{F.Objects.upgrade(s,id);F.event(s,'object-upgrade','자리를 넓혔어요.',{object:id});},()=>{cancel();showCard();})}]);}catch(e){notice(e.message);}}
function showCard(){if(editor)return;const card=$('select-card');if(!selected&&!patchSelected){card.hidden=true;return;}card.hidden=false;
 if(selected){card.classList.remove('object-card');delete card.dataset.objectId;delete card.dataset.objectHtml;const p=state.individuals.find(x=>x.id===selected);if(!p){closeCard();return;}const key=p.id+'|'+p.name+'|'+state.settings.showState;if(card.dataset.key===key){card.querySelector('.badge').textContent='Lv.'+F.level(p);card.querySelector('.select-head p').textContent=actionReason(p)+leafNote(p);refreshStats(card,p);return;}card.dataset.key=key;card.innerHTML='<div class="select-head"><img class="portrait" src="'+portrait(p.species)+'" alt=""><div><h2>'+escape(p.name)+' <span class="badge">Lv.'+F.level(p)+'</span></h2><p>'+actionReason(p)+escape(leafNote(p))+'</p></div><button class="icon close" data-action="close-card" aria-label="선택 닫기">'+icon('close')+'</button></div>'+(state.settings.showState?stats(p):'<p class="sub">상태 수치는 설정에서 다시 켤 수 있어요.</p>')+'<div class="button-pair"><button class="secondary" data-action="move-pet" data-id="'+escape(p.id)+'">옮기기</button><button class="primary" data-action="detail" data-id="'+escape(p.id)+'">자세히 보기</button></div>';
 }else {delete card.dataset.key;if(patchSelected==='shelter')patchSelected='shelter-0';updateObjectCard(card,patchSelected);}
}

// 1.2.6 (user: "슬라이드가 있는 카드 혹은 창에서 슬라이드를 넘겨 특정 항목 고르면 다시 슬라이드가 원상복구되는 오류 싹 다"): choosing an item
// rebuilds that card or page, and every sideways slide row in it (chips, tabs, portraits, cards) came back scrolled to the start. Each
// slide's sideways position is remembered by where it sits on the screen (tab + the chain of ids/classes up to it) and put back as soon
// as the rebuilt row is in the page, before it is drawn. Changing tab starts fresh.
const slides=new Map(),slideSel=new Set(),slideCls=n=>typeof n.className==='string'?n.className.trim().split(/\s+/).filter(c=>c&&!['on','go','active','selected','sel','show','open'].includes(c)):[];
function slideKey(el){let k='',n=el;while(n&&n!==document.body){if(n.id){k='#'+n.id+k;break;}const c=slideCls(n),par=n.parentElement,i=par?[...par.children].filter(x=>x.tagName===n.tagName&&slideCls(x).join('.')===c.join('.')).indexOf(n):0;k='>'+n.tagName+(c.length?'.'+c.join('.'):'')+':'+i+k;n=par;}return tab+'|'+k;}
document.addEventListener('scroll',e=>{const el=e.target;if(!(el instanceof Element)||el.scrollWidth<=el.clientWidth+1)return;slides.set(slideKey(el),el.scrollLeft);const c=slideCls(el);slideSel.add(el.tagName.toLowerCase()+(c.length?'.'+c.map(x=>CSS.escape(x)).join('.'):''));},true);
new MutationObserver(ms=>{if(!slides.size)return;const sel=[...slideSel].join(',');for(const m of ms)for(const nd of m.addedNodes){if(!(nd instanceof Element))continue;for(const el of [...(nd.matches(sel)?[nd]:[]),...nd.querySelectorAll(sel)]){const v=slides.get(slideKey(el));if(v!=null&&el.scrollLeft!==v&&el.scrollWidth>el.clientWidth+1)el.scrollLeft=v;}}}).observe(document.body,{childList:true,subtree:true});
function switchTab(next){stopMotionPreview();if(next!==tab){slides.clear();slideSel.clear();pageView='';}setTimeout(()=>renderAdmin(),0);if(tab==='visit'&&next!=='visit'&&state.recruitment.visitor?.open)commit(s=>F.Recruitment.close(s));editorReturn=null;scene.inputLocked=false;facilityDraft=null;scene.facilityPreview=null;scene.facilityGrab=null;scene.facilityDrag=null;scene.camera.setBottomOcclusion(0);$('world').classList.remove('editing-layout');carry.cancel();audio.cancelShots();scene.silentTick=state.worldTick;if(editor){editor=false;scene.editing=false;scene.preview={};$('editor').hidden=true;$('targets').hidden=false;}tab=next;closeCard();$('world').hidden=next!=='world';$('page').hidden=next==='world';scene.paused=next!=='world'||!foreground;$('nav').querySelectorAll('button').forEach(b=>{const active=b.dataset.tab===next;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});if(next==='world'){scene.measure();targets();}else renderPage();}
// 1.2.6: choosing an item on a page (a climate card low in 설정, a friend's switch in 자세히 보기, a 도감 entry) rebuilt the page and
// sent it back to the top. The same view keeps its scroll; a different tab, 도감 tab or friend starts at the top.
let pageView='';function renderPage(){const page=$('page'),view=tab+'|'+(tab==='dex'?dex:'')+'|'+(tab==='detail'?selected:''),keep=view===pageView?page.scrollTop:0;renderPageNow();pageView=view;page.scrollTop=keep;}
function renderPageNow(){$('page').classList.remove('st');const page=$('page'),p=state.individuals[0];
 if(tab==='visit'){renderVisit();return;}
 if(tab==='friends'){page.innerHTML='<h2>함께 지내는 친구</h2><p class="sub">각자의 속도로, 같은 정원에서.</p><div class="section-title"><span>정원에서 생활 중</span><span class="badge">'+state.individuals.filter(x=>x.active).length+'명</span></div>'+state.individuals.map(x=>'<button class="friend-card" data-action="detail" data-id="'+escape(x.id)+'"><img src="'+portrait(x.species)+'" alt=""><div><h3>'+escape(x.name)+'</h3><p>'+speciesName(x)+(x.parentId?' · '+x.generation+'세':'')+' · Lv.'+F.level(x)+'</p><p class="sub" data-activity-for="'+escape(x.id)+'">'+escape(actionReason(x))+'</p></div></button>').join('')+recruitmentPanel();}
 else if(tab==='detail'){const x=state.individuals.find(x=>x.id===selected)||p;page.innerHTML='<button class="text-button" data-action="detail-back">‹ 돌아가기</button><div class="detail-hero"><img src="'+portrait(x.species)+'" alt="'+speciesName(x)+'"><h2>'+escape(x.name)+' <span class="badge">Lv.'+F.level(x)+'</span></h2><p class="sub">'+speciesName(x)+' · '+F.SPECIES.find(z=>z[0]===x.species)[3]+'</p></div><div class="panel"><p data-activity-for="'+escape(x.id)+'">'+escape(actionReason(x))+'</p>'+stats(x)+'<div class="data-grid"><div><small>성장 경험</small><strong>'+x.xp+' XP</strong></div><div><small>좋아하는 볕</small><strong>'+window.ForestTraits.ofPet(x).light.join('~')+'</strong></div></div></div>'+'<div id="spore-detail">'+sporeDetails(x)+'</div>'+hexHtml(x)+skillHtml(x)+traitHtml(x.species)+'<p class="sub">낮에 볕을 받아 광합성을 하면 물을 조금 쓰고 기운과 성장 경험을 얻어요. 좋아하는 밝기에서 가장 잘 자라요.</p><button class="secondary" data-action="rename">별명 바꾸기</button><button class="secondary" data-action="roster" data-id="'+escape(x.id)+'">'+(x.active?'대기로 옮기기':'정원에 들이기')+'</button><button class="primary" data-action="find-pet">정원에서 보기</button>';}
 else if(tab==='dex'){page.innerHTML='<h2>숲의 도감</h2><p class="sub">직접 마주친 순간들을 모아요.</p><div class="chips">'+[['species','식물 친구'],['neighbors','작은 이웃'],['regions','지역 발견']].map(([key,label])=>'<button class="chip '+(key===dex?'active':'')+'" data-dex="'+key+'">'+label+'</button>').join('')+'</div>';
  if(dex==='species')page.innerHTML+='<div class="dex-grid">'+F.SPECIES.filter(([id])=>!F.Recruitment.retired.includes(id)||state.individuals.some(p=>p.species===id)).map(([id,name,latin,desc])=>{const owned=state.individuals.some(p=>p.species===id);return '<button class="dex-card '+(owned?'':'locked')+'" data-action="species" data-species="'+id+'">'+(owned?'<img src="'+portrait(id)+'" data-fit="'+portrait(id)+'" alt="'+name+'">':'<div class="unknown">잎</div>')+'<div>'+name+'</div><small>'+(owned?'우리 정원의 친구':'다음 만남을 기다려요')+'</small></button>';}).join('')+'</div>';
  else if(dex==='neighbors'){const seen=state.objects?.creatures?.seen||{};
   // SRS NAM-03: say the current relationship, never 'good/bad bug'; ECO-09: name, class, role, why it is here, food, when it leaves
   const N=[['돌돌이','Armadillidium vulgare · 육상 등각류(갑각류)','비 갠 뒤 촉촉한 이끼 곁, 물이 고이지 않은 바위틈에 쉬러 와요. 머무는 동안 바위틈 근처 낙엽 분해를 조금(×1.1) 도와요. 친구가 가까이 오면 공처럼 말려요.',!!state.discoveries.neighbor],
    ['짐꾼개미','개미 · 곤충','리들리마다 곁 흙더미에 군락을 이뤄(숲에 3군락까지) 낮에 둥지 둘레의 흩어진 낙엽을 낙엽더미로 날라요. 밤이나 비·눈·강풍에는 둥지에서 쉬고, 솜깍지의 감로가 많으면 그 곁을 지켜요.',!!seen.ant],
    ['톡토기','Collembola · 톡토기류','촉촉한 낙엽더미에 머물며 그 더미의 분해를 1.25배 도와요. 엘리시가 가까이 있으면 더 잘 찾아와요.',!!seen.springtail],
    ['잎응애','Tetranychus 계열 · 진드기류','덥고 마른 잎(뜨거운 햇살 바위, 목마름)에 자리를 잡고 늘어나면 잎이 지쳐요. 잎이 촉촉해지거나 친구가 잎을 정돈하면 줄어요.',!!seen.mite],
    ['잎지기','Phytoseiulus persimilis · 진드기류','잎응애가 실제로 있고 잎이 적당히 촉촉할 때 찾아와 잎응애를 먹어요. 먹이가 없으면 떠나요.',!!seen.keeper],
    ['뿌리날파리','Bradysia 계열 · 곤충','젖어서 썩어 가는 낙엽에 알을 낳아요. 유충이 그 자리 친구의 뿌리를 귀찮게 해요. 낙엽이 마르면 줄어요.',!!seen.gnat],
    ['흙지기','Stratiolaelaps scimitus · 진드기류','물이 빠진 촉촉한 흙에서 뿌리날파리 유충과 알을 먹어요. 잎응애는 맡지 않아요.',!!seen.soilmite],
    ['쏙쏙이','Dalotia coriaria · 반날개(곤충)','바위틈이나 햇살 바위를 은신처로 삼아 젖은 낙엽의 뿌리날파리 유충을 찾아요. 가끔 바위 뒤로 쏙 숨어요.',!!seen.rove],
    ['솜깍지','알주머니형 깍지벌레 · 곤충','따뜻한 잎 사이에 붙어 영양을 조금 빼앗고, 많아지면 알주머니와 달콤한 감로를 남겨요.',!!seen.mealy],
    ['점박이','Cryptolaemus montrouzieri · 곤충','솜깍지 알주머니가 있을 때 찾아와 살펴본 뒤 유충이 솜깍지를 먹어요. 개미가 감로를 지키면 느려져요.',!!seen.lady]];
   // 0.6.32: each entry shows its picture once met (a dark silhouette until then) and the page counts the met ones
    const pics={'돌돌이':'pillbug','짐꾼개미':'ant-body','톡토기':'springtail-rest','잎응애':'spidermite','잎지기':'predatory-mite','뿌리날파리':'root-gnat','흙지기':'soil-mite','쏙쏙이':'rove-beetle','솜깍지':'mealybug','점박이':'ladybird'};
    page.innerHTML+='<p class="sub">만난 이웃 '+N.filter(x=>x[3]).length+' / '+N.length+' · 숲에 한 번이라도 찾아오면 채워져요.</p>'+N.map(([n,sci,role,met])=>'<div class="panel neighbour-entry'+(met?'':' unmet')+'"><img src="assets/forest/creatures/'+pics[n]+'.png" data-fit="assets/forest/creatures/'+pics[n]+'.png" alt="'+(met?n:'아직 못 만난 이웃')+'"><div><h3>'+(met?n:n+' <span class="badge">아직 못 만났어요</span>')+'</h3><p>'+role+'</p><p class="sub">'+sci+' · 도감 그림은 확대 표현이에요.</p></div></div>').join('');
    // 0.9.4 물가 이웃 도감: the seven lake neighbours, filled once each has been at the lake (world.lake.seen); the picture
    // is the first frame of its in-game strip
    {const ls=state.world?.lake?.seen||{},open=F.World.lakeOpen(state),L=[['소금쟁이','strider','긴 다리로 물 위를 미끄러지듯 맴돌아요. 큰비와 강풍에는 숨어요.',['strider']],['물달팽이','snail','물가 가까이 기어 다니다가 시든 수련을 먹어 치워요.',['snail']],['개구리','frog','봄 물가의 알이 올챙이를 거쳐 개구리가 돼요. 수련 잎이나 물가에 앉았다가 퐁 뛰어들어요.',['eggs','tadpole','frog']],['잠자리','dragonfly','여름 아침 부들 줄기에서 애벌레가 날개를 말리고 날아올라요. 장구벌레를 먹어요.',['nymph','dragonfly']],['물방개','beetle','여름 물속을 천천히 헤엄쳐요. 가끔 올챙이를 먹어요.',['beetle']],['송사리','medaka','여름 물 위에 작은 떼로 둥글게 헤엄쳐요. 장구벌레를 먹어요.',['medaka']],['장구벌레','larva','잔잔하고 따뜻한 물에 생겨요. 곁에 서 있으면 성가셔서 기운이 조금 떨어져요.',['larva']]].map(([n,pic,role,kinds])=>[n,pic,role,kinds.some(k=>ls[k]!=null)]);
     page.innerHTML+='<h3>물가 이웃</h3><p class="sub">'+(open?'만난 물가 이웃 '+L.filter(x=>x[3]).length+' / '+L.length+' · 호수에 한 번이라도 나타나면 채워져요.':'숲 동쪽 물가가 열리면 만날 수 있어요.')+'</p>'+L.map(([n,pic,role,met])=>'<div class="panel neighbour-entry lake-entry'+(met?'':' unmet')+'"><img src="assets/forest/lake/life-'+pic+'.png" data-fit="assets/forest/lake/life-'+pic+'.png" data-frames="'+(pic==='eggs'?1:6)+'" style="object-fit:cover;object-position:0 50%" alt="'+(met?n:'아직 못 만난 이웃')+'"><div><h3>'+(met?n:n+' <span class="badge">아직 못 만났어요</span>')+'</h3><p>'+role+'</p></div></div>').join('');}}
  else {// 1.2.0 (user: "생활기록은 없애고 … 환경 발견은 호수지역, 이끼의 숲 이런 새로운 지역 발견 도감"): one entry per region of
   // the world; open regions show their painting, regions not reached yet stay blank with a hint
   const open=state.world?.regions||['forest'],ls=state.world?.lake?.seen||{},lakeMet=['strider','snail',['eggs','tadpole','frog'],['nymph','dragonfly'],'beetle','medaka','larva'].filter(k=>[].concat(k).some(x=>ls[x]!=null)).length,nb=Object.values(state.objects?.creatures?.seen||{}).filter(Boolean).length;
   const R=[['forest','이끼의 숲','assets/forest/garden.png','22% 16%;background-size:150%','처음 친구들과 정원을 꾸린 숲이에요. 샘터와 쉼터, 이끼와 바위가 있고, 고사리 덤불 사이로 넓은 빈 땅이 둘러싸고 있어요.','함께 지내는 친구 '+state.individuals.filter(x=>x.active).length+'명 · 만난 작은 이웃 '+Math.min(nb,10)+'종',''],
    ['lakeshore','동쪽 호수','assets/forest/lake/lake-floor.png','50% 50%','숲 동쪽 끝에 펼쳐진 호수와 물가예요. 여름엔 수련이 피고 개구리·잠자리가 지내요. 목마른 친구는 물가에서 물을 마셔요. 추운 겨울엔 얼어서 걸어 다닐 수 있어요.','만난 물가 이웃 '+lakeMet+' / 7','첫 봄이 지나면 숲 동쪽에서 촉촉한 바람이 불어와요.'],
    ['sea','남쪽 바다','','','','','아직 길이 이어지지 않았어요.'],['mountain','서쪽 산','','','','','아직 길이 이어지지 않았어요.'],['snow','북쪽 눈밭','','','','','아직 길이 이어지지 않았어요.']];
   page.innerHTML+='<p class="sub">발견한 지역 '+R.filter(r=>open.includes(r[0])).length+' / '+R.length+' · 숲이 자라면 새로운 곳으로 길이 열려요.</p>'+R.map(([id,name,pic,pos,desc,note,hint])=>open.includes(id)?'<div class="panel region-entry"><div class="region-art" style="background-image:url('+pic+');background-position:'+pos+'"></div><h3>'+name+'</h3><p>'+desc+'</p><p class="sub">'+note+'</p></div>':'<div class="panel region-entry unmet"><div class="region-art"><span>?</span></div><h3>'+name+' <span class="badge">아직 발견하지 못했어요</span></h3><p class="sub">'+hint+'</p></div>').join('');}
 }
 else if(tab==='settings')settingsPage(page);
 fitArt(page);
}
// 1.2.0 (user: "도감 케릭터 및 작은 친구들 크기 제각각인데 동일하게"): guide pictures have very different empty margins,
// so each one is cropped to its painted area (lake strips: the first of 6 frames) and fitted into the same square
const fitCache=new Map();
function fitArt(root){root.querySelectorAll('img[data-fit]').forEach(img=>{const key=img.dataset.fit+'|'+(img.dataset.frames||1);const done=url=>{if(url&&img.isConnected)img.src=url;};if(fitCache.has(key)){done(fitCache.get(key));return;}const src=new Image();src.onload=()=>{try{const fw=Math.floor(src.width/(+img.dataset.frames||1)),h=src.height,c=document.createElement('canvas');c.width=fw;c.height=h;const x=c.getContext('2d');x.drawImage(src,0,0,fw,h,0,0,fw,h);const d=x.getImageData(0,0,fw,h).data;let x0=fw,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let i=0;i<fw;i++)if(d[(y*fw+i)*4+3]>24){if(i<x0)x0=i;if(i>x1)x1=i;if(y<y0)y0=y;if(y>y1)y1=y;}if(x1<0){fitCache.set(key,null);return;}const S=192,pad=12,w=x1-x0+1,hh=y1-y0+1,k=(S-pad*2)/Math.max(w,hh),o=document.createElement('canvas');o.width=o.height=S;o.getContext('2d').drawImage(c,x0,y0,w,hh,(S-w*k)/2,(S-hh*k)/2,w*k,hh*k);const url=o.toDataURL();fitCache.set(key,url);done(url);}catch(e){fitCache.set(key,null);}};src.src=img.dataset.fit;});}
// 0.9.5 설정 정리 (user: "설정창 좀 깨끗하게 카테고라이징"): 화면 / 움직임 / 소리 / 숲 / 기록 / 관리자 / 정보
function settingsPage(page){/* 1.2.0 (user: "설정은 ㄹㅇ 유저가 쓰는 설정창으로 … GUI"): grouped cards with icons; shelter space is managed from the shelter card */
 const I={clock:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',tag:'<path d="M4 12V5h7l9 9-7 7z"/><circle cx="8" cy="8.5" r="1.3"/>',star:'<path d="m12 4 2.3 4.8 5.2.7-3.8 3.6.9 5.2L12 15.8 7.4 18.3l.9-5.2L4.5 9.5l5.2-.7z"/>',card:'<rect x="4" y="5" width="16" height="14" rx="3"/><path d="M8 10h8M8 14h5"/>',chat:'<path d="M5 6h14v9H10l-4 3v-3H5z"/>',fern:'<path d="M12 21V5M12 8l-4-2M12 11l-5-2M12 14l-5-1M12 8l4-2M12 11l5-2M12 14l5-1"/>',wave:'<path d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>',vol:'<path d="M5 10h3l4-3v10l-4-3H5z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',music:'<path d="M9 17V6l10-2v11"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="15" r="2"/>',leaf:'<path d="M5 19c0-8 6-13 14-13 0 8-5 14-13 14M5 19l7-7"/>',spark:'<path d="M12 4v4M12 16v4M4 12h4M16 12h4M7 7l2 2M15 15l2 2M7 17l2-2M15 9l2-2"/>',chev:'<path d="m9 6 6 6-6 6"/>',up:'<path d="M12 16V5M8 9l4-4 4 4M5 15v4h14v-4"/>',down:'<path d="M12 5v11M8 12l4 4 4-4M5 15v4h14v-4"/>',undo:'<path d="M8 8H4V4M4.5 8a8 8 0 1 1-.5 6"/>',tool:icons.tool,info:'<circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 8v.5"/>'};
 const ic=k=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+(I[k]||icons[k])+'</svg>',it=(k,label,ctl,sub)=>'<div class="st-it"><div class="st-ico">'+ic(k)+'</div><div class="st-tx">'+label+(sub?'<small>'+sub+'</small>':'')+'</div>'+ctl+'</div>',tg=k=>toggle(k,state.settings[k]??(k==='showFrame'));
 const th=state.settings.theme,e=state.environment,fixed=e.climateMode==='fixed',sel=e.pendingClimate?.id||e.climate,cal=F.Environment.calendar(state);
 const dots={C01:'radial-gradient(circle at 35% 35%,#cfe3dc,#86b1a6)',C02:'radial-gradient(circle at 35% 35%,#e4ead0,#a8b783)',C03:'radial-gradient(circle at 35% 35%,#e6e9ee,#a7b1bf)',C04:'radial-gradient(circle at 35% 35%,#f2e2c4,#cfa26a)'},blurb={C01:'비가 잦고 여름 장마',C02:'무난하고 겨울엔 추워요',C03:'안개가 잦고 겨울이 혹독',C04:'여름 가뭄, 따뜻한 겨울'};
 page.classList.add('st');
 page.innerHTML='<h2>설정</h2><p class="st-lead">숲을 보는 방식과 소리를 내 취향대로</p>'
 +'<div class="st-cap">화면</div><div class="st-card"><div class="st-seg" role="radiogroup" aria-label="화면 모드">'+[['day','sun','라이트 모드'],['night','moon','다크 모드']].map(([v,k,n])=>{const on=v==='night'?th==='night':th!=='night';return '<button role="radio" aria-checked="'+on+'" class="'+(on?'on':'')+'" data-action="theme-set" data-v="'+v+'">'+ic(k)+n+'</button>';}).join('')+'</div>'+'<p class="st-now">앱 화면 색만 바뀌어요. 월드는 숲의 시간에 따라 낮엔 밝고 밤엔 어두워져요.</p>'
 +it('tag','이름 표시',tg('showName'))+it('star','레벨 표시',tg('showLevel'))+it('card','카드에 상태 보이기',tg('showState'),'친구 카드에 수분·영양·기운')+it('chat','생활 안내',tg('showSpeech'),'손님·비 소식이 아래에 잠깐 떠요')+it('fern','고사리 액자',tg('showFrame'))+it('wave','움직임 줄이기',tg('reducedMotion'),'흔들림·튀어 오름을 줄여요')+'</div>'
 +'<div class="st-cap">소리</div><div class="st-card">'+[['master','vol','전체'],['music','music','배경 음악'],['environment','leaf','정원의 소리'],['effects','spark','행동 효과음']].map(([key,k,label])=>{const v=Math.round(state.settings.audio[key]*100);return '<div class="st-vol"><div class="st-ico">'+ic(k)+'</div><label for="volume-'+key+'">'+label+'</label><input id="volume-'+key+'" data-volume="'+key+'" type="range" min="0" max="100" value="'+v+'" aria-label="'+label+' 음량"><output>'+v+'</output></div>';}).join('')+'</div>'
 +'<div class="st-cap">숲의 기후</div><div class="st-card"><div class="st-cl" role="radiogroup" aria-label="숲의 기후"><button role="radio" aria-checked="'+!fixed+'" class="st-ct wide'+(fixed?'':' on')+'" data-action="climate-set" data-v="season"><i class="dot" style="background:conic-gradient(#9fc3b8,#c9d6a3,#e3c08f,#c7cfd8,#9fc3b8)"></i><span>계절마다 바뀜<small>계절이 바뀔 때마다 그 계절의 날씨 성격이 정해져요</small></span></button>'
 +Object.entries(F.Environment.CLIMATES).map(([id,c])=>'<button role="radio" aria-checked="'+(fixed&&sel===id)+'" class="st-ct'+(fixed&&sel===id?' on':'')+'" data-action="climate-set" data-v="'+id+'"><i class="dot" style="background:'+(dots[id]||'#ccc')+'"></i><span>'+c.name+'<small>'+(blurb[id]||'')+'</small></span></button>').join('')+'</div><p class="st-now">지금: '+F.Environment.SEASON_NAMES[cal.id]+' · '+F.Environment.CLIMATES[e.climate].name+(e.pendingClimate?' → '+F.Environment.CLIMATES[e.pendingClimate.id].name+'(으)로 30초 안에 천천히 바뀌어요':fixed?' (고정)':'')+'</p></div>'
 +'<div class="st-cap">기록</div><div class="st-card"><p class="st-help">이 기기에 저장돼요. 휴대폰을 바꾸기 전에는 백업을 내보내 주세요.</p><div class="st-btns"><button data-action="export">'+ic('up')+'백업 내보내기</button><button data-action="import">'+ic('down')+'백업 가져오기</button></div><button class="st-link" data-action="restore-last">'+ic('undo')+'최근 안전 백업 복원</button>'+(state.legacy?'<button class="st-link" data-action="export-legacy">'+ic('up')+'이전 모바일 기록 내보내기</button>':'')+'</div>'
 +'<div class="st-cap">더 보기</div><div class="st-card">'+it('tool','관리자 모드','<button class="switch" role="switch" aria-label="관리자 모드" aria-checked="'+adminOn+'" data-action="admin-mode"></button>','켜면 월드 오른쪽 위에 공구 버튼이 생겨요')+'<button class="st-it st-go" data-action="home"><div class="st-ico">'+ic('info')+'</div><div class="st-tx">시작 화면 보기</div><span class="st-chev">'+ic('chev')+'</span></button></div>'
 +'<p class="st-foot">여백의 숲 '+F.VERSION+'</p>';
 page.querySelectorAll('[data-volume]').forEach(el=>{el.addEventListener('input',()=>{el.nextElementSibling.value=el.value;audio.volume({...state.settings.audio,[el.dataset.volume]:Number(el.value)/100});});el.addEventListener('change',()=>{if(!commit(s=>s.settings.audio[el.dataset.volume]=Number(el.value)/100)){el.value=state.settings.audio[el.dataset.volume]*100;el.nextElementSibling.value=el.value;audio.volume(state.settings.audio);}});});}
// 0.9.5 관리자 · 창조주 도구 (user: "깨끗하게 테스트 할 수 있는 모든 경우의 수", "특정 해금 푼다던가 하는 것까지 있는 창조주 영역",
// "레벨 … 리셋", "다 관리자 기능으로"). Every button changes the real save through commit (validated, saved, undo by backup).
/* 1.2.0 관리자 모드 (user: "관리자 모드 따로보고 인게임모드 병렬로"): a panel over the running world instead of a settings page.
   The switch lives in settings (per device); the tool button opens a bottom panel with time controls (pause, 1x/4x/16x),
   tabs (friend, time, weather, objects, creatures, lake, unlocks, view) and drawings over the world (paths, what each
   friend is doing, skill reach, shelter room, speed). Every change still goes through the save transaction (ForestAdmin). */
let adminOn=(()=>{try{return localStorage.getItem('forest-admin-mode')==='1';}catch{return false;}})(),adminOpen=false,adminTab='friend',adminSpeed=1,adminLock=false,adminFriend=null,adminView={path:false,task:false,range:false,room:false,perf:false},adminPerf={frames:0,since:0,fps:0,tick:0},adminDrawn=0;
const ADMIN_TABS=[['friend','친구'],['motion','모션 보기'],['time','시간'],['weather','날씨'],['object','사물'],['creature','생물'],['lake','호수'],['unlock','해금'],['view','보기']];
let motionSpecies=null;
function stopMotionPreview(){
 if(!inspector)return;
 Object.assign(scene.camera,inspectionCamera);
 inspectionCamera=null;inspector=null;scene.inspector=null;
 scene.inputLocked=false;scene.tick=null;scene.display={};$('targets').hidden=false;
 last=performance.now();scene.cameraChanged();update();
}
function startMotionPreview(kind,species){
 if(!adminOn||!adminOpen||tab!=='world'||editor||rec)return;
 try{
  const next=window.ForestAdmin.motionPreview(F,kind,species,state.settings.reducedMotion);
  carry.cancel();audio.cancelShots();closeCard();
  inspectionCamera??={...scene.camera};
  inspector=scene.inspector=next;
  scene.inputLocked=true;scene.tick=null;scene.display={};$('targets').hidden=true;
  $('admin-view').innerHTML='';
  scene.camera.setOverview(false);scene.syncWorld(F.World.bounds(next.state));
  scene.camera.z=1.75;scene.camera.cx=next.point.x;scene.camera.cy=next.point.y;
  renderAdmin();scene.camera.cx=next.point.x;scene.camera.cy=next.point.y;scene.camera.clamp();scene.cameraChanged();
 }catch(e){notice(e.message);}
}
function renderMotionPreview(panel){
 const A=window.ForestAdmin,v=inspector,button=(action,label)=>'<button class="pill" data-action="'+action+'">'+label+'</button>';
 panel.innerHTML='<div class="adm-grab"></div><div class="adm-bar"><div class="adm-clock"><b>'+escape(A.MOTIONS[v.kind])+'</b>저장에 반영하지 않는 미리보기</div>'
  +'<button class="adm-x" data-action="admin-motion-close" aria-label="미리보기 닫기">'+icon('close')+'</button></div><div class="adm-body">'
  +'<p id="admin-motion-status" class="adm-note">'+escape(v.status())+'</p><div class="adm-row">'
  +button('admin-motion-replay','다시 보기')+(v.nextLabel()?button('admin-motion-next',v.nextLabel()):'')+'</div></div>';
 scene.camera.setBottomOcclusion(Math.max(0,$('garden').getBoundingClientRect().bottom-panel.getBoundingClientRect().top));
}
function setAdminMode(on){adminOn=on;try{localStorage.setItem('forest-admin-mode',on?'1':'0');}catch{}if(!on){adminOpen=false;adminSpeed=1;adminLock=false;}adminButton();renderAdmin();}
function adminButton(){const b=$('admin-tool');if(!b)return;b.hidden=!adminOn;b.classList.toggle('on',adminOpen);b.setAttribute('aria-pressed',String(adminOpen));}
function adminClock(){const cal=F.Environment.calendar(state),tt=((state.worldTick%1200)+1200)%1200,phase={morning:'이른 햇살',noon:'한낮',dusk:'노을',night:'밤',deep:'깊은 밤',dawn:'새벽'}[F.Environment.timeKey(state)]||'';
 return '<b>'+F.Environment.SEASON_NAMES[cal.id]+' '+(Math.floor(cal.into/1200)+1)+'일째 · '+phase+' <span class="adm-sec">'+tt+'/1200초</span></b>'+F.Environment.NAMES[F.Environment.weatherKey(state)]+' · 바람 '+Math.round(state.weather.wind)+' · '+F.Environment.CLIMATES[state.environment.climate].name+(state.environment.climateMode==='fixed'?'(고정)':'')+(adminLock?' · 날씨 고정':'');}
function adminPick(){const list=state.individuals.filter(p=>p.active);if(!list.some(p=>p.id===adminFriend))adminFriend=null;return adminFriend?list.find(p=>p.id===adminFriend):null;}
function renderAdmin(){const panel=$('admin-panel');if(!panel)return;adminButton();if(!adminOn||!adminOpen||tab!=='world'){panel.hidden=true;$('admin-view').innerHTML='';if(tab==='world'&&!editor&&!inspector)scene.camera.setBottomOcclusion(0);return;}panel.hidden=false;closeCard();
 if(inspector){renderMotionPreview(panel);return;}
 const A=window.ForestAdmin,b=(label,args,cls='')=>'<button class="pill '+cls+'" data-action="admin-run" data-args="'+escape(JSON.stringify(args))+'">'+label+'</button>',row=x=>'<div class="adm-row">'+x.join('')+'</div>',lbl=t=>'<div class="adm-lbl">'+t+'</div>';
 const motionButton=(id,label,species)=>'<button class="pill" data-action="admin-motion-play" data-id="'+id+'" data-species="'+species+'">'+escape(label)+'</button>';
 const p=adminPick(),friends=state.individuals.filter(q=>q.active),others=F.SPECIES.filter(([id])=>!state.individuals.some(q=>q.species===id)&&!F.Recruitment.retired.includes(id));
 const chips=friends.map(q=>'<button class="pill'+(q.id===adminFriend?' go':'')+'" data-action="admin-friend" data-id="'+escape(q.id)+'">'+escape(q.name)+'</button>').join('');
 let body='';
 if(adminTab==='friend'){
  if(!p)body='<p class="adm-note">월드에서 친구를 눌러 고르세요. 고른 친구의 수치를 바로 바꿀 수 있어요.</p>'+row([chips]);
  else{const V=window.ForestVitals,band=V.band(p),e=V.shown(p),sl=(key,name,val,min,max,shown,lo,hi)=>'<label class="adm-sl"><span>'+name+'</span><div class="adm-track">'+(lo!=null?'<i class="band" style="left:'+(lo-min)/(max-min)*100+'%;width:'+(hi-lo)/(max-min)*100+'%"></i>':'')+'<input type="range" min="'+min+'" max="'+max+'" step="1" value="'+val+'" data-admin-set="'+key+'" aria-label="'+name+'"></div><output>'+shown+'</output></label>';
   body='<div class="adm-who"><img src="'+portrait(p.species)+'" alt=""><div><b>'+escape(p.name)+'</b> <small>Lv.'+F.level(p)+'</small><small class="doing">'+actionReason(p)+'</small></div></div>'
    +sl('B','수분',Math.round(p.B),0,100,Math.round(p.B),band.lo,band.hi)+sl('nutrition','영양',Math.round(p.nutrition),0,100,Math.round(p.nutrition),band.lo,band.hi)+sl('energy','기운',Math.round(p.energy),0,100,e.now+' / '+e.max)+'<p class="adm-note" data-admin-leaf-damage>손상 '+leafConditionLabel(p)+'</p>'+sl('level','레벨',F.level(p),1,F.LEVELS.length,'Lv.'+F.level(p))
    +(window.ForestSkills?.INFO[p.species]?lbl('고유 스킬 · '+escape(window.ForestSkills.INFO[p.species].name))+row([p.species==='maria'||p.species==='dico'?motionButton(p.species==='maria'?'swim':'mend','스킬 보기',p.species):b('스킬 보기',['skillShow',p.id])]):'')+row([b('스킬 대기 없애기',['skillReady',p.id]),...Object.entries(A.STATS).map(([k,v])=>b(v[0],['stats',p.id,k]))])
    +lbl('다른 친구')+row([chips])
    +lbl('정원 친구 모두')+row([b('모두 적정하게',['stats','all','full']),b('모두 스킬 대기 없애기',['skillReady','all']),b('모든 친구 레벨 초기화',['resetLevels'],'warn')]);}
  body+=lbl('찾아오는 친구')+(others.length?row(others.map(([id,n])=>b(n+' 부르기',['summon',id])).concat(others.map(([id,n])=>b(n+' 바로 들이기',['welcome',id])))):'<p class="adm-note">모든 친구가 함께 살고 있어요.</p>')+(state.recruitment.visitor?row([b('입구 손님 돌려보내기',['dismiss'])]):'');}
 else if(adminTab==='motion'){
  const species=motionSpecies??p?.species??friends[0]?.species??'ridley';
  body=lbl('미리 볼 친구')+row(F.SPECIES.filter(([id])=>!F.Recruitment.retired.includes(id)).map(([id,name])=>'<button class="pill'+(id===species?' go':'')+'" aria-pressed="'+(id===species)+'" data-action="admin-motion-species" data-id="'+id+'">'+escape(name)+'</button>'))
   +lbl('모션')+row(Object.entries(A.MOTIONS).filter(([id])=>(id!=='willowPerch'||F.Trees.fitsPerch('willow-1',{species}))&&(id!=='mend'||species==='dico')).map(([id,label])=>motionButton(id,label,species)))
   +'<p class="adm-note">포자 심기 후 어린 친구가 목록에 생기는 과정과 정원 입장까지 확인할 수 있어요.</p>';
 }
 else if(adminTab==='time')body=lbl('그 시각으로 (앞으로만)')+row(Object.entries(A.TIMES).map(([k,v])=>b(v[1],['time',k])))+lbl('실제로 진행')+row([b('1분',['advance',60]),b('10분',['advance',600]),b('하루',['advance',1200])])+lbl('계절 첫날로')+row(A.SEASONS.map((n,i)=>b(n,['season',i])))+'<p class="adm-note">위의 ⏸ · 1× · 4× · 16×로 시간을 멈추거나 빨리 감아요. 빨리 감기는 관리자 모드를 끄면 1×로 돌아와요.</p>';
 else if(adminTab==='weather')body=lbl('날씨')+row(Object.entries(A.WEATHER).map(([k,v])=>b(v[3],['weather',k])))+'<div class="adm-tog"><div>날씨 고정<small>켜 두면 지금 날씨가 바뀌지 않아요(이 화면을 닫아도 관리자 모드 동안 유지)</small></div><button class="switch" role="switch" aria-checked="'+adminLock+'" data-action="admin-lock" aria-label="날씨 고정"></button></div>'+lbl('기후')+row([b('계절마다 바뀜',['climateAuto'],state.environment.climateMode==='fixed'?'':'go'),...Object.entries(F.Environment.CLIMATES).map(([id,c])=>b(c.name,['climate',id],state.environment.climateMode==='fixed'&&state.environment.climate===id?'go':''))]);
 else if(adminTab==='object'){/* 1.2.1 (user: "햇살바위 가득채우기 눌러도 … 안 채워지고", "낙엽자리 관리자 기능 직관적이지 않음"): the values changed but the panel never showed them; each tool now sits under its live amount */const L=F.Litter,z=state.patches.find(q=>q.id==='litter'),V=window.ForestVitals,now=(t,v)=>'<div class="adm-lbl">'+t+' <b class="adm-val">'+v+'</b></div>';
 body=now('샘터 물',Math.round(state.spring.water)+' / '+F.Objects.capacity(state,'spring'))+row([b('가득 채우기',['spring',true]),b('비우기',['spring',false])])
 +now('햇살 바위 볕',Math.round(V?.rockSun?.(state)??0)+' / 100')+row([b('가득 채우기',['rockSun',true]),b('비우기',['rockSun',false])])
 +now('숲 바닥 낙엽',L.floor(state)+' / '+L.LCAP+'장 · 더미 '+L.piles(state).length+'개')+row([b('낙엽 10장 떨어뜨리기',['floorLeaves'])])
 +now('낙엽 자리',(z?Math.round(z.O)+'장 · 거름 '+Math.round(z.U):'-')+' / '+F.Objects.capacity(state,'litter'))+row([b('낙엽 +10장',['leaves']),b('거름 +30',['compost'])])
 +'<p class="adm-note">숲 바닥 낙엽은 바람에 날리고, 한 칸에 5장이 모이면 더미가 돼요. 낙엽 자리는 처음부터 있던 사물이에요(낙엽+거름 합쳐 가득 차면 더 넣을 수 없어요).</p>'+'<p class="adm-note">쉼터를 옮기거나 좌우로 뒤집으려면 꾸미기를 열어 주세요.</p>';}
 else if(adminTab==='creature'){const host=p||friends[0],img={mite:'spidermite',mealy:'mealybug',keeper:'predatory-mite',lady:'ladybird',gnat:'root-gnat',soilmite:'soil-mite',spring:'springtail-rest',ant:'ant-body'};
  body=lbl(host?'눌러서 바로 부르기 · 잎에 붙는 이웃은 '+escape(host.name)+'에게':'눌러서 바로 부르기')+'<div class="adm-grid">'+Object.entries(A.CALL).map(([k,n])=>'<button class="adm-cell" data-action="admin-run" data-args="'+escape(JSON.stringify(['creature',k,host?.id||'']))+'"><img src="assets/forest/creatures/'+img[k]+'.png" alt="">'+n+'</button>').join('')+'</div>'+row([b('작은 이웃 돌려보내기(개미는 남김)',['clearCreatures'])])+'<p class="adm-note">해충은 한 번에 두 종류까지 머물러요. 짐꾼개미는 리들리 곁에만 둥지를 틀어요.</p>';}
 else if(adminTab==='lake')body=F.World.lakeOpen(state)?row([b('호수 생명 채우기',['fillLake']),b('여름 밤 반딧불',['fireflies'])])+'<p class="adm-note">반딧불은 여름 밤으로 옮기고 맑게 바꾼 뒤 띄워요.</p>':'<p class="adm-note">호수 물가가 아직 닫혀 있어요.</p>'+row([b('호수 물가 열기',['openLake'],'warn')]);
 else if(adminTab==='unlock')body=row([...(F.World.lakeOpen(state)?[]:[b('호수 물가 열기',['openLake'],'warn')]),...(state.shelters?.unlocked?[]:[b('쉼터 넓히기·추가 열기',['unlockShelter'],'warn')]),b('샘터·이끼·낙엽 자리 3단계까지',['unlockObjects'],'warn')])+'<p class="adm-note">해금은 다시 닫을 수 없어요.</p>';
 else body=[['path','걷는 길','친구가 가려는 곳까지 점선'],['task','할 일 글자','친구 머리 위에 지금 하는 일'],['range','스킬 범위','고른 친구의 고유 스킬이 닿는 곳'],['room','사물 상태','쉼터 빈자리 · 샘터 물 · 햇살 바위 볕 · 이끼·바위틈 물 · 낙엽 자리'],['perf','화면 속도','초당 장수와 엔진 한 번 시간']].map(([k,n,d])=>'<div class="adm-tog"><div>'+n+'<small>'+d+'</small></div><button class="switch" role="switch" aria-checked="'+adminView[k]+'" data-action="admin-view" data-key="'+k+'" aria-label="'+n+'"></button></div>').join('');
 /* 1.2.1 (user: "관리자모드에서 특정 항목 고르면 컨트롤창이 맨 위로"): rebuilding the panel reset its scroll; keep where the body and tab row were */const keep={b:panel.querySelector('.adm-body')?.scrollTop||0,t:panel.querySelector('.adm-tabs')?.scrollLeft||0,tab:panel.dataset.tab};
 panel.innerHTML='<div class="adm-grab"></div><div class="adm-bar"><div class="adm-clock" id="admin-clock">'+adminClock()+'</div>'+[[0,'⏸'],[1,'1×'],[4,'4×'],[16,'16×']].map(([v,t])=>'<button class="adm-speed'+(adminSpeed===v?' on':'')+'" data-action="admin-speed" data-v="'+v+'" aria-label="'+(v?v+'배속':'멈춤')+'">'+t+'</button>').join('')+'<button class="adm-x" data-action="admin-close" aria-label="관리자 패널 닫기">'+icon('close')+'</button></div><div class="adm-tabs" role="tablist">'+ADMIN_TABS.map(([k,n])=>'<button role="tab" class="adm-tab'+(k===adminTab?' on':'')+'" data-action="admin-tab" data-tab-id="'+k+'" aria-selected="'+(k===adminTab)+'">'+n+'</button>').join('')+'</div><div class="adm-body">'+(adminAdvance?'<div class="adm-prog"><span id="admin-progress">'+advanceText()+'</span><button class="pill" data-action="admin-advance-stop">멈추기</button></div>':'')+body+'</div>';
 {const bd=panel.querySelector('.adm-body'),tb=panel.querySelector('.adm-tabs');if(tb)tb.scrollLeft=keep.t;if(bd&&keep.tab===adminTab)bd.scrollTop=keep.b;panel.dataset.tab=adminTab;}
 panel.querySelectorAll('[data-admin-set]').forEach(el=>{el.addEventListener('input',()=>{const k=el.dataset.adminSet,v=Number(el.value),o=el.closest('.adm-sl').querySelector('output');o.textContent=k==='level'?'Lv.'+v:k==='energy'?Math.round(v*window.ForestVitals.band(adminPick()).max/100)+' / '+window.ForestVitals.band(adminPick()).max:v;});el.addEventListener('change',()=>adminRun(['set',adminFriend,el.dataset.adminSet,Number(el.value)]));});
 scene.camera.setBottomOcclusion(Math.max(0,$('garden').getBoundingClientRect().bottom-panel.getBoundingClientRect().top));if(adminFollow){const c=scene.camera,d=scene.display?.[adminFollow.id]||state.individuals.find(q=>q.id===adminFollow.id);if(d){c.cx=d.x;c.cy=d.y;c.clamp();}Object.assign(adminFollow,{cx:c.cx,cy:c.cy,z:c.z});}scene.cameraChanged();}
// 1.2.1 (user: "실제로 진행에서 1분, 10분, 하루 누르면 너무오래걸리면서 해당 시간으로 이동함"): the jump ran every engine
// second in one go and froze the screen until it was done (a day is 1,200 full steps). Now it runs as many seconds as fit
// in ~40 ms per frame while the world keeps drawing, with progress and a stop button in the panel.
let adminAdvance=null;
function adminAdvanceStep(){const a=adminAdvance;if(!a)return false;if(!adminOn){adminAdvance=null;return false;}const next=copyForTick(state),t0=performance.now();
 while(a.left>0&&performance.now()-t0<40){F.step(next,{visible:false});a.left--;}
 const done=a.left<=0||a.stop;if(done)F.event(next,'admin','관리자 · '+Math.round((a.total-a.left)/60)+'분을 실제로 진행했어요.');
 if(!write(next)){adminAdvance=null;saveFailure();return true;}state=next;acc=0;update();
 const el=document.getElementById('admin-progress');if(el)el.textContent=advanceText();
 if(done){adminAdvance=null;notice(Math.round((a.total-a.left)/60)+'분을 실제로 진행했어요.');renderAdmin();targets();}return true;}
function advanceText(){const a=adminAdvance;return a?'실제로 진행하는 중 · '+Math.floor((a.total-a.left)/60)+' / '+a.total/60+'분':'';}
function adminRun(args){let msg='';if(commit(s=>{msg=window.ForestAdmin.run(F,s,...args);},()=>{renderAdmin();targets();})){notice(msg);
 // 1.2.1 (user: "잎에 붙는 이웃 … 붙이면 리들리한테 화면 확대하여 보여주는 기능"): a neighbour placed on a friend's leaves
 // zooms in on that friend and follows it, so the new guest is visible straight away
 if(args[0]==='creature')adminFocusNeighbour(args[1]);}}
// 1.2.1 (user: "관리자 모드에서 이웃들 버튼 클릭했을 때 해당 이웃으로 화면 클로즈업"): after calling a neighbour, close up on
// where it is — the friend it sits on (followed), the litter spot or leaf pile it lives in, or the ant nest
function adminFocusNeighbour(kind){if(kind==='spring')kind='springtail';const g=[...(state.objects?.creatures?.groups||[])].reverse().find(q=>q.kind===kind);if(!g)return;
 if(g.host&&['mite','mealy','keeper','lady'].includes(kind)){adminFriend=g.host;scene.selected=g.host;adminFocus(g.host,3);renderAdmin();return;}
 let pt=g.nest||null;if(!pt&&typeof g.site==='string'){const pile=F.Litter.piles(state).find(p=>p.id===g.site)||null;pt=pile||state.patches.find(p=>p.id===g.site)||null;}
 if(!pt&&typeof g.pile==='string')pt=F.Litter.piles(state).find(p=>p.id===g.pile)||null;
 if(!pt&&g.host){const h=state.individuals.find(p=>p.id===g.host);if(h)pt=h;}
 if(pt)adminFocusPoint(pt);}
function adminFocusPoint(pt){const cam=scene.camera;adminFollow=null;cam.setOverview?.(false);cam.z=Math.max(cam.z,2.4);cam.cx=pt.x;cam.cy=pt.y;cam.clamp();scene.cameraChanged();scene.saveCamera();}
// 1.2.1 (user: "다른친구에서 특정 케릭터 고르면 그 케릭터 위치로 화면이 가지 않는 버그 … 그 케릭터 확대해서 화면이 따라가게"):
// picking a friend zooms in (at least 2x) and keeps the camera on that friend while it walks, in the world area above the
// panel (the camera already treats the panel as covered screen). A drag or pinch by the player, closing the panel or
// picking someone else ends the follow.
let adminFollow=null;
function adminFocus(id,zoom=2){const p=state.individuals.find(q=>q.id===id);if(!p)return;const cam=scene.camera,d=scene.display?.[id]||p;cam.setOverview?.(false);cam.z=Math.max(cam.z,zoom);cam.cx=d.x;cam.cy=d.y;cam.clamp();scene.cameraChanged();adminFollow={id,cx:cam.cx,cy:cam.cy,z:cam.z};}
function adminFollowStep(){const f=adminFollow;if(!f)return;const cam=scene.camera;if(!adminOpen||!adminOn||tab!=='world'){adminFollow=null;scene.saveCamera();return;}
 if(Math.abs(cam.cx-f.cx)>1e-6||Math.abs(cam.cy-f.cy)>1e-6||Math.abs(cam.z-f.z)>1e-6){adminFollow=null;scene.saveCamera();return;}// the player moved the view
 const p=state.individuals.find(q=>q.id===f.id&&q.active);if(!p){adminFollow=null;return;}const d=scene.display?.[f.id]||p;
 cam.cx+=(d.x-cam.cx)*.12;cam.cy+=(d.y-cam.cy)*.12;cam.clamp();scene.cameraChanged();f.cx=cam.cx;f.cy=cam.cy;f.z=cam.z;}
// drawings over the world (render only): paths, what each friend is doing, the picked friend's skill reach, shelter room, speed
function adminOverlay(now){const svg=$('admin-view');if(!svg)return;const any=adminOn&&tab==='world'&&Object.values(adminView).some(Boolean);if(!any){if(svg.innerHTML)svg.innerHTML='';return;}if(now-adminDrawn<100)return;adminDrawn=now;
 const C=scene.camera,sc=q=>C.screen(q),out=[],tw=t=>[...t].reduce((n,c)=>n+(/[\u3131-\uD7A3]/.test(c)?10.6:6.2),0),txt=(x,y,t,cls='')=>{const w=tw(t)+14;out.push('<g class="tag '+cls+'" transform="translate('+x.toFixed(1)+','+y.toFixed(1)+')"><rect x="'+(-w/2).toFixed(1)+'" y="-15" width="'+w.toFixed(1)+'" height="17" rx="8"/><text y="-3">'+escape(t)+'</text></g>');};
 for(const p of state.individuals.filter(q=>q.active)){const s0=sc(p);
  if(adminView.path&&p.walkPlan){const pts=[p,...(p.walkPlan.pts||[]),{x:p.walkPlan.tx,y:p.walkPlan.ty}].map(sc);out.push('<polyline class="path'+(p.id===adminFriend?' sel':'')+'" points="'+pts.map(q=>q.x.toFixed(1)+','+q.y.toFixed(1)).join(' ')+'"/><circle class="goal" cx="'+pts.at(-1).x.toFixed(1)+'" cy="'+pts.at(-1).y.toFixed(1)+'" r="3.5"/>');}
  if(adminView.task)txt(s0.x,s0.y-scene.petSize(p)*C.scale-6,p.name+' · '+actionReason(p).replace(/<[^>]*>/g,'').slice(0,18),p.id===adminFriend?'sel':'');
  if(adminView.range&&p.id===adminFriend){const K=window.ForestSkills,k=Object.keys(K.SK).find(k=>K.SK[k].species===p.species);if(k){const L=K.LEVEL[k]||{},f=L.reach?'reach':L.range?'range':null,r=f?K.lv(p,k,f):(K.SK[k].reach||K.SK[k].range||0);if(r){const rx=r*C.width*C.scale;out.push('<ellipse class="range" cx="'+s0.x.toFixed(1)+'" cy="'+s0.y.toFixed(1)+'" rx="'+rx.toFixed(1)+'" ry="'+(rx*C.height/C.width).toFixed(1)+'"/>');}}}}
 if(adminView.room){for(const f of state.shelters?.facilities||[]){const l=F.Shelter.ledger(state,f),q=sc(F.Shelter.entry(f));txt(q.x,q.y,'쉼터 빈 '+(l.free/4)+' / '+(l.total/4)+' · '+(l.friends??0)+'명','room');}const w=sc(state.spring);txt(w.x,w.y+28,'샘터 물 '+Math.round(state.spring.water)+' / '+Math.round(F.Objects.capacity(state,'spring')),'room');/* 1.2.1 (user: "햇살바위의 햇살 양, 이끼의 물양 등도 표시"): every object's live amount, under the object */
 const V=window.ForestVitals,ob={rock:z=>'햇살 바위 볕 '+Math.round(V?.rockSun?.(state)??0)+' / 100',moss:z=>'이끼 물 '+(Math.round(z.S*10)/10)+' / '+F.Objects.capacity(state,'moss'),crevice:z=>'바위틈 고인 물 '+(Math.round(z.W*10)/10)+' / '+z.pool,litter:z=>'낙엽 자리 낙엽 '+Math.round(z.O)+' · 거름 '+Math.round(z.U),shade:z=>'잎 그늘 흙 물 '+(Math.round(z.S*10)/10)};
 for(const z of state.patches){const f=ob[z.id];if(!f)continue;const q=sc(z);txt(q.x,q.y+26,f(z),'room');}
 for(const pd of (window.ForestSkills?.puddles?.(state)||[])){const q=sc(pd);txt(q.x,q.y+16,'웅덩이 물 '+(Math.round((pd.water??pd.W??0)*10)/10),'room');}}
 if(adminView.perf){adminPerf.frames++;if(now-adminPerf.since>1000){adminPerf.fps=Math.round(adminPerf.frames*1000/(now-adminPerf.since));adminPerf.frames=0;adminPerf.since=now;}out.push((()=>{const t='화면 '+adminPerf.fps+'장/초 · 엔진 '+adminPerf.tick.toFixed(1)+'ms · '+adminSpeed+'×',w=tw(t)+16;return '<g class="tag perf" transform="translate(12,26)"><rect x="0" y="-15" width="'+w.toFixed(1)+'" height="18" rx="8"/><text x="'+(w/2).toFixed(1)+'" y="-2">'+t+'</text></g>';})());}
 svg.innerHTML=out.join('');}
function recruitmentPanel(){const r=state.recruitment,v=r.visitor;return '<div class="panel"><h3>숲에 찾아오는 친구</h3>'+(v?'<p>'+escape(F.Recruitment.josa(v.pet.name,'이','가'))+' 입구에서 기다리고 있어요. 만나기 전까지는 다른 친구의 준비 시간이 멈춰요.</p><button class="primary" data-action="visit">만나러 가기</button>':'<p class="sub">환경을 마련하면 친구가 찾아와요. 한 번에 한 친구를 만나요.</p>')+F.SPECIES.filter(([id])=>!state.individuals.some(p=>p.species===id)&&!F.Recruitment.retired.includes(id)).map(([id,name])=>{const c=F.Recruitment.conditions(state,id,F.Space,F.Social),p=r.progress[id];return '<div class="recruit-row"><strong>'+name+'</strong><p>'+c.reason+'</p>'+(c.checks?.length?'<ul class="recruit-checks">'+c.checks.map(k=>'<li class="'+(k.ok?'ok':'no')+'">'+(k.ok?'✓ ':'· ')+escape(k.label)+' <span>(필요: '+escape(k.need)+')</span></li>').join('')+'</ul>':'')+'<small>조건이 180초 이어지면 35% 확률로 찾아와요(세 번 놓치면 다음엔 꼭). 준비된 시간 '+p.valid+' / 180초 · 기다린 차례 '+p.failures+' / 3</small><button class="text-button" data-action="recruit-target" data-species="'+id+'">'+(r.target===id?'먼저 기다리는 중':'먼저 기다리기')+'</button></div>';}).join('')+'</div>';}
function renderVisit(){const v=state.recruitment.visitor;if(!v){switchTab('friends');return;}$('page').innerHTML='<button class="text-button" data-action="visit-close">‹ 정원으로 돌아가기</button><h2>'+escape(F.Recruitment.josa(v.pet.name,'과','와'))+' 첫 만남</h2><p class="sub">만나는 동안 정원의 생활은 잠시 쉬어요.</p><canvas id="visit-canvas" width="720" height="580" style="width:100%;height:auto;border-radius:24px" aria-label="친구와 만나는 작은 자리"></canvas><div class="panel"><p id="visit-status"></p><p class="sub">'+F.Recruitment.goals[v.species]+'</p><ul id="visit-steps" class="recruit-checks"></ul><p id="visit-leave" class="sub"></p><div class="button-pair">'+(F.Recruitment.steps(state).buttons.greet?'<button class="secondary" data-action="visit-greet">반갑게 인사하기</button>':'')+(F.Recruitment.steps(state).buttons.guide?'<button class="secondary" data-action="visit-guide">물 있는 곳 알려주기</button>':'')+'</div><button id="visit-settle" class="primary" data-action="visit-settle">함께 살기</button></div>';updateVisit();drawVisit(performance.now()/1000);}
function updateVisit(){const v=state.recruitment.visitor;if(!v||!$('visit-status'))return;const p=state.recruitment.progress[v.species];$('visit-status').textContent=v.ready?'함께 살 준비가 됐어요.':v.seconds<30?'새로운 자리에 천천히 익숙해져요.':({walk:'주변을 살펴보며 걸어요.',water:'잎에 물을 모으고 물을 살펴봐요.',sun:'햇빛이 드는 자리를 살펴봐요.',shade:'시원한 그늘을 확인해요.',pick:'낙엽을 조심히 주워요.',carry:'낙엽을 마른 자리로 옮겨요.',rest:'편안하게 쉬고 있어요.',spring:'샘터의 물을 살펴봐요.',sky:'둥지잎을 펼치고 하늘을 올려다봐요.'})[v.phase]||'서로 익숙해지고 있어요.';$('visit-settle').disabled=!v.ready||state.individuals.length>=50;const st=F.Recruitment.steps(state);if(st&&$('visit-steps')){$('visit-steps').innerHTML=st.list.map(k=>'<li class="'+(k.done?'ok':'no')+'">'+(k.done?'✓ ':'· ')+escape(k.label)+(k.value?' <span>'+escape(k.value)+'</span>':'')+'</li>').join('');$('visit-leave').textContent=st.ready?'':'만남 화면을 열어 둔 동안만 시간이 흘러요. 준비가 안 된 채 '+Math.ceil(st.leaveIn/60)+'분이 더 지나면 친구가 잠시 돌아가요.';}}
function drawVisit(t){const canvas=$('visit-canvas'),v=state.recruitment.visitor;if(!canvas||!v)return;const c=canvas.getContext('2d'),A=scene.assets;c.clearRect(0,0,720,580);
 // 0.6.30 card scene: the world's own painted ground with its fern borders, a soft worn path into a lit clearing,
 // the guest's real props on the ground and the characters larger, back to front with contact shadows.
 const g=A.garden;if(v.species==='maria'&&A.lakeFloor){const im=A.lakeFloor;c.drawImage(im,im.width*.05,im.height*.25,im.width*.48,im.height*.50,0,0,720,580);}else if(g){const sh=g.width*580/720;c.drawImage(g,0,g.height-sh,g.width,sh,0,0,720,580);}else{c.fillStyle='#f7f0e2';c.fillRect(0,0,720,580);}
 c.save();c.scale(2,2);
 const soft=(f,b)=>{c.save();c.filter='blur('+b+'px)';f();c.restore();};
 // lit clearing and a gentle darkening toward the corners
 const glow=c.createRadialGradient(180,175,10,180,175,200);glow.addColorStop(0,'rgba(255,248,226,.62)');glow.addColorStop(.6,'rgba(255,248,226,.18)');glow.addColorStop(1,'rgba(255,248,226,0)');c.fillStyle=glow;c.fillRect(0,0,360,290);
 const edge=c.createRadialGradient(180,160,120,180,160,260);edge.addColorStop(0,'rgba(110,88,58,0)');edge.addColorStop(1,'rgba(110,88,58,.16)');c.fillStyle=edge;c.fillRect(0,0,360,290);
 // the worn path from the entrance (bottom) into the clearing
 soft(()=>{c.fillStyle='rgba(150,118,80,.10)';for(const [x,y,rx,ry] of [[184,286,46,14],[178,262,40,12],[172,240,44,12],[178,218,56,14],[180,200,74,18]]){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}},5);
 soft(()=>{c.fillStyle='rgba(255,252,240,.35)';c.beginPath();c.ellipse(180,200,64,13,0,0,Math.PI*2);c.fill();},6);
 // soft morning rays from the upper left, and a few fallen leaves on the ground (fixed places, no randomness)
 soft(()=>{c.globalCompositeOperation='lighter';for(const [x,w,a] of [[40,34,.045],[110,22,.03],[170,40,.04]]){c.fillStyle='rgba(255,236,190,'+a+')';c.beginPath();c.moveTo(x-20,-10);c.lineTo(x-20+w,-10);c.lineTo(x+w+150,300);c.lineTo(x+110,300);c.closePath();c.fill();}},8);
 for(const [x,y,r,col] of [[118,236,.6,'rgba(196,150,86,.55)'],[262,268,-.4,'rgba(176,138,82,.5)'],[214,178,1.2,'rgba(206,170,96,.45)'],[64,250,2.2,'rgba(170,150,90,.45)'],[300,206,.2,'rgba(190,140,80,.4)']]){c.save();c.translate(x,y);c.rotate(r);c.fillStyle=col;c.beginPath();c.ellipse(0,0,5.5,2.4,0,0,Math.PI*2);c.fill();c.strokeStyle='rgba(120,90,50,.35)';c.lineWidth=.5;c.beginPath();c.moveTo(-5,0);c.lineTo(5,0);c.stroke();c.restore();}
 const terr=(ix,x,y,size)=>{const im=A.terrain;if(!im)return;const sw=im.width/3,sh=im.height/2;soft(()=>{c.fillStyle='rgba(90,72,48,.16)';c.beginPath();c.ellipse(x,y+size*.02,size*.38,size*.075,0,0,Math.PI*2);c.fill();},2);c.drawImage(im,(ix%3)*sw,Math.floor(ix/3)*sh,sw,sh,x-size/2,y-size*.75,size,size);};
 const sp=v.species;
 if(sp==='bonbon'){terr(3,166,128,110);terr(1,92,162,104);}
 if(sp==='bosong')scene.springAt(c,{...state,spring:{...state.spring,water:v.water*3,inflow:4/60},individuals:[],weather:{kind:'sun'}},80,184,.82,t);
 if(sp==='neolbi'){c.drawImage(A.shadePlant,52,48,134,134);c.drawImage(A.shadeGround,52,48,134,134);const sun=c.createRadialGradient(262,162,4,262,162,52);sun.addColorStop(0,'rgba(255,238,184,.42)');sun.addColorStop(1,'rgba(255,238,184,0)');c.fillStyle=sun;c.beginPath();c.ellipse(262,162,54,22,0,0,Math.PI*2);c.fill();}
 if(sp==='jureong'){terr(4,276,232,96);terr(0,172,150,92);}
 if(sp==='superbum')scene.springAt(c,{...state,spring:{...state.spring,water:60,inflow:0},individuals:[],weather:{kind:'sun'}},56,200,.72,t);
 // characters drawn back to front, each with a soft contact shadow
 const R=100,draw=(species,x,y,kind,phase)=>{soft(()=>{c.fillStyle='rgba(74,60,40,.22)';c.beginPath();c.ellipse(x,y+1,R*.27,R*.055,0,0,Math.PI*2);c.fill();},1.5);c.save();c.translate(x,y);c.scale(R/1254,R/1254);c.translate(-627,-1065.9);ForestRig.draw(c,A,{species,kind,phase,expression:kind==='rest'?'sleepy':'neutral',reduced:state.settings.reducedMotion});c.restore();};
 const kind=v.phase==='sky'?'collect':v.phase==='water'?'drink':v.phase==='pick'||v.phase==='carry'?'litter':v.phase==='walk'?'walk':v.phase==='rest'?'rest':'idle',actors=[{species:v.species,x:v.x*360,y:v.y*290,kind}];if(v.companion)actors.push({species:v.companion,x:sp==='jureong'?128:250,y:240,kind:'rest'});
 actors.sort((a,b)=>a.y-b.y).forEach(a=>draw(a.species,a.x,a.y,a.kind,t));c.restore();}
function toggle(k,value){return '<button class="switch" role="switch" aria-label="'+({mounted:'목부작으로 쉬기',showName:'이름 표시',showLevel:'레벨 표시',showState:'선택 카드 상태 표시',showSpeech:'생활 안내 표시',showFrame:'고사리 액자',reducedMotion:'움직임 줄이기'}[k])+'" aria-checked="'+value+'" data-toggle="'+k+'"></button>';}
function syncEditorViewport(){const canvas=$('garden').getBoundingClientRect(),panel=editor?$('editor'):null;scene.camera.setBottomOcclusion(panel&&!panel.hidden?Math.max(0,canvas.bottom-panel.getBoundingClientRect().top):0);scene.cameraChanged();}
const editorViewportObserver=new ResizeObserver(syncEditorViewport);editorViewportObserver.observe($('editor'));editorViewportObserver.observe($('garden'));
/* 1.2.6: the 꾸미기 panel keeps its scroll when it is rebuilt for the same object */let editorView='';function renderEditor(){const ed=$('editor'),view=(facilityDraft?'facility':'')+'|'+scene.selectedPatch,keep=view===editorView?ed.scrollTop:0;renderEditorNow();editorView=view;ed.scrollTop=keep;}
// 1.2.6 꾸미기 (user: "꾸미기에서 쉼터도 옮기기 가능하게", "오브젝트들 보관하기(월드에서 없애기)", "꾸미기 창에 보관함", "꾸미기창 gui 직관적이게"):
// one panel — what is in the forest (objects and shelters), the chosen one with its move pad and 보관하기, and the 보관함 with 꺼내기.
// A shelter opens its own move view (drag, flip, 보관하기) and comes back here when done.
const treeAbsorptionPct=Math.round((F.Trees.ABSORPTION-1)*100);
const EDIT_TIP={'stone-shelf':'두 친구가 나란히 앉아 쉬는 자리예요.',spring:'돌과 물, 물 마시는 위치를 함께 옮겨요. 숲에 꼭 있어야 해서 보관할 수 없어요.',moss:'물을 조금 머금고 뿌리 수분 흡수를 '+treeAbsorptionPct+'% 높여요.',rock:'볕을 모아 두는 바위예요. 친구가 위에 올라가 쉬어요.',shade:'주변의 빛을 줄이는 실제 그늘이에요.',crevice:'바람과 비를 피하는 틈이에요. 이끼와 그늘을 가까이 두면 좋아요.',litter:'낙엽이 거름이 되는 자리예요. 숲에 꼭 있어야 해서 보관할 수 없어요.'};
function renderEditorNow(){if(facilityDraft)return renderFacilityEditor();const items=scene.editorItems();if(!items.some(x=>x.id===scene.selectedPatch))scene.selectedPatch=items[0]?.id||'spring';const p=items.find(x=>x.id===scene.selectedPatch);
 const tree=F.Trees.kind(p.id),type=F.Objects.kindOf(p.id),shelf=F.World.SHELF_IDS.includes(p.id);
 const copyId=shelf?F.World.SHELF_IDS.find(id=>!items.some(item=>item.id===id)):F.Objects.nextCopyId(state,p.id,scene.preview);
 let message=(tree==='zelkova'?'이끼 숲과 남쪽 숲에 심을 수 있어요. 강한 볕과 비바람을 줄여요.':tree==='willow'?'호숫가에 심어요. 빗방울을 막고 뿌리 수분 흡수를 '+treeAbsorptionPct+'% 높여요.':tree==='cherry'?'이끼 숲과 남쪽 숲에 심을 수 있어요. 계절마다 모습과 그늘이 달라져요.':null)||EDIT_TIP[shelf?'stone-shelf':type]||'',bad=false;try{F.validateLayout(state,scene.preview);}catch(e){message=e.message;bad=true;}const folded=$('editor').classList.contains('folded'),stored=[...(state.objects?.stored||[]),...F.Trees.stored(state).map(t=>({...t,name:F.Trees.name(t.id)}))],sheds=state.shelters.stored||[],canStore=tree?F.Trees.active(state).some(t=>t.id===p.id):F.STORABLE.includes(type)&&!!F.Objects.patch(state,p.id);
 const flip=scene.preview[p.id]?.flip??p.flip??false;
 const copies=[...items,...stored].filter(x=>shelf?F.World.SHELF_IDS.includes(x.id):F.Objects.kindOf(x.id)===type).length;
 const addButton=shelf||F.Objects.COPY_KINDS.includes(type)
  ?'<button class="secondary ed-store" data-action="'+(shelf?'shelf-copy':'object-add')+'" '+(copyId?'':'disabled')+'>추가 · '+copies+'/3</button>':'';

 const treeButtons=Object.entries(F.Trees.TYPES).map(([id,d])=>{
  const ready=F.Trees.unlocked(state,id),count=F.Trees.count(state,id,scene.preview);
  const label=ready?d.name+' 심기 · '+count+'/'+d.limit:d.name+' · 호수 발견 후';
  return '<button class="chip" data-action="tree-add" data-id="'+id+'" '+(ready&&count<d.limit?'':'disabled')+'>'+escape(label)+'</button>';
 }).join('');
 const shelters=scene.editorShelters().map(f=>
  '<button class="chip ed-shed" data-action="edit-shelter" data-id="'+escape(f.id)+'">'+escape(f.label)+'</button>'
 ).join('');
 const canAdd=F.Shelter.standardRoom(state)&&(state.shelters.unlocked||F.Shelter.storedFor(state,'add'));
 $('editor').innerHTML='<div class="ed-head"><b>꾸미기</b><span>고른 것을 끌거나 화살표로 옮겨요</span><button class="editor-fold" data-action="fold-editor" aria-expanded="'+!folded+'">'+(folded?'펼치기':'접기')+'</button></div>'
  +'<div class="ed-lbl">숲에 놓인 것</div><div class="chips">'+items.map(x=>'<button class="chip '+(p.id===x.id?'active':'')+'" data-patch="'+x.id+'">'+escape(x.name)+'</button>').join('')+'</div>'
  +'<div class="ed-lbl">쉼터</div><div class="chips">'+shelters
  +'<button class="chip" data-action="facility-add" '+(canAdd?'':'disabled')+'>쉼터 추가</button></div>'
  +'<div class="ed-lbl">나무</div><div class="chips">'+treeButtons+'</div>'
  +'<div class="ed-sel"><div class="ed-sel-top"><b>'+escape(p.name)+'</b>'+(canStore?'<button class="secondary ed-store" data-action="store-object" data-id="'+p.id+'">보관하기</button>':'')+(shelf?'<button class="secondary" data-action="shelf-mirror" aria-pressed="'+flip+'">⇋ 좌우 뒤집기</button>':'')+addButton+'</div><p class="'+(bad?'bad':'')+'">'+(bad?'× ':'')+escape(message)+'</p><div class="position-pad" aria-label="선택한 자리 이동">'+[['left','←'],['up','↑'],['down','↓'],['right','→']].map(([id,label])=>'<button data-move="'+id+'" aria-label="'+label+' 이동">'+label+'</button>').join('')+'</div></div>'
  +'<div class="ed-lbl">보관함 <small>'+(stored.length+sheds.length)+'</small></div><div class="ed-box">'+(stored.length+sheds.length?stored.map(x=>'<div class="ed-kept"><span>'+escape(x.name+(F.Objects.isCopy(x.id)?' '+x.id.at(-1):''))+'</span><button class="secondary" data-action="unstore-object" data-id="'+x.id+'">꺼내기</button></div>').join('')+sheds.map(x=>'<div class="ed-kept"><span>⌂ '+escape(F.Shelter.name(x))+' · '+F.Shelter.capacity(x)/4+'공간</span><button class="secondary" data-action="unstore-shelter" data-id="'+escape(x.id)+'">꺼내기</button></div>').join(''):'<p class="ed-empty">보관한 사물이 여기에 모여요. 숲에서 빼 두고 싶은 것을 골라 보관하기를 눌러요.</p>')+'</div>'
  +'<div class="button-pair"><button class="secondary" data-action="cancel-layout">취소</button><button class="primary" data-action="save-layout" '+(bad?'disabled':'')+'>배치 완료</button></div>';
}
function adjacentCopyPosition(subject,tryPlacement){
 for(const [dx,dy] of [[.55,0],[-.55,0],[0,.18],[0,-.18],[.35,.21],[-.35,.21],[.75,0],[-.75,0],[1,0],[-1,0],[0,.32],[0,-.32]]){
  const point={x:subject.x+dx,y:subject.y+dy,flip:!!subject.flip};
  try{tryPlacement(point);return point;}catch{}
 }
 return {x:subject.x,y:subject.y,flip:!!subject.flip};
}
const placeFacility=kind=>['add','move','restore','copy'].includes(kind);
function editFacility(id,kind){
 if(!editor||facilityDraft)return;
 editorReturn={preview:scene.preview,sel:scene.selectedPatch,folded:$('editor').classList.contains('folded')};
 $('editor').classList.remove('folded');
 scene.preview={};
 startFacilityEdit(id,kind);
}
function startFacilityEdit(id,kind){const f=F.Shelter.facility(state,id),stored=F.Shelter.storedFor(state,kind,id),subject=kind==='add'?stored:stored||f;facilityDraft={id,kind,x:subject?.x??.45,y:subject?.y??.70,flip:!!subject?.flip};
 if(kind==='add'&&!stored&&state.shelters.unlocked){
  try{F.Shelter.plan(state,id,kind,facilityDraft);}catch{
   const base=F.Shelter.facility(state,'shelter-0');
   Object.assign(facilityDraft,adjacentCopyPosition(base,p=>F.Shelter.plan(state,id,kind,p)));
  }
 }
 if(kind==='copy'&&subject)Object.assign(facilityDraft,adjacentCopyPosition(subject,p=>F.Shelter.plan(state,id,kind,p)));
 /* 1.2.0 (user: "손가락으로 드래그 앤 드롭으로도 추가"): while adding or moving, the shelter preview can be dragged; elsewhere the map still pans */
 if(placeFacility(kind)){let grab=null,queued=false;scene.facilityGrab=p=>{const pv=scene.facilityPreview||facilityDraft,t=F.Shelter.transform(pv);if(p.x*360<t.x||p.x*360>t.x+220+t.extra||p.y*576<t.y+40||p.y*576>t.y+330*t.sy+30)return false;grab={dx:facilityDraft.x-p.x,dy:facilityDraft.y-p.y};return true;};
  scene.facilityDrag=p=>{if(!grab||!facilityDraft)return;facilityDraft.x=Math.round((p.x+grab.dx)*400)/400;facilityDraft.y=Math.round((p.y+grab.dy)*400)/400;scene.facilityPreview={...scene.facilityPreview,x:facilityDraft.x,y:facilityDraft.y,flip:facilityDraft.flip};if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;if(facilityDraft)renderFacilityEditor();});}};}
 else{scene.facilityGrab=null;scene.facilityDrag=null;}scene.editing=false;scene.inputLocked=true;$('editor').hidden=false;$('targets').hidden=true;renderFacilityEditor();syncEditorViewport();}
function renderFacilityEditor(){const d=facilityDraft,old=F.Shelter.facility(state,d.id),subject=F.Shelter.storedFor(state,d.kind,d.id)||(d.kind==='add'?null:old);let proposal=null,valid=true,message='미리보기의 입구와 주변 공간을 살펴보고 확정해 주세요.';try{proposal=F.Shelter.plan(state,d.id,d.kind,{x:d.x,y:d.y,flip:d.flip});}catch(e){valid=false;message=e.message;}scene.facilityPreview=proposal||{...subject,id:d.kind==='copy'?'new-preview':subject?.id||'new-preview',level:d.kind==='expand'?Math.min(3,old.level+1):subject?.level||1,x:d.x,y:d.y,flip:d.flip};if(valid&&placeFacility(d.kind))message='쉼터를 손가락으로 끌어 옮기거나 화살표로 조금씩 옮겨요. 입구와 주변 공간을 살펴보고 확정해 주세요.';$('editor').innerHTML='<strong>'+escape(F.Shelter.name(scene.facilityPreview))+' '+({add:'추가',restore:'꺼내기',move:'옮기기',expand:'확장',flip:'좌우 뒤집기',copy:'복사'})[d.kind]+' · '+F.Shelter.capacity(scene.facilityPreview)/4+'공간</strong><p class="'+(valid?'':'bad')+'">'+escape(message)+'</p>'+(placeFacility(d.kind)?'<div class="position-pad">'+[['left','←'],['up','↑'],['down','↓'],['right','→']].map(([k,t])=>'<button data-action="facility-shift" data-dir="'+k+'">'+t+'</button>').join('')+'</div>':'')+(d.kind!=='expand'?'<button class="secondary facility-flip" data-action="facility-mirror" aria-pressed="'+d.flip+'">⇋ 좌우 뒤집기'+(d.flip?' · 뒤집힘':'')+'</button>':'')+(d.kind==='move'&&old&&old.level<3?'<button class="secondary facility-flip" data-action="facility-expand" '+(state.shelters.unlocked?'':'disabled')+'>공간 넓히기</button>':'')+(d.kind==='move'&&old?'<button class="secondary facility-flip" data-action="facility-copy" '+(F.Shelter.canCopy(state,old)?'':'disabled')+'>복사</button>':'')+(d.kind==='move'&&old&&!old.base?'<button class="secondary facility-flip" data-action="facility-store-edit">보관하기</button>':'')+'<div class="button-pair"><button data-action="cancel-layout">'+(editorReturn?'꾸미기로':'취소')+'</button><button class="primary" data-action="facility-save" '+(valid?'':'disabled')+'>배치 확정</button></div>';}
function startEditor(){switchTab('world');$('world').classList.add('editing-layout');editor=true;scene.editing=true;scene.preview={};scene.selectedPatch='moss';$('editor').hidden=false;$('targets').hidden=true;renderEditor();syncEditorViewport();notice('요소를 고른 뒤 중심 점을 끌어보세요. 빈 곳을 밀면 아래쪽도 볼 수 있어요.');}
let editorReturn=null;function resumeEditor(){const r=editorReturn;editorReturn=null;scene.inputLocked=false;facilityDraft=null;scene.facilityPreview=null;scene.facilityGrab=null;scene.facilityDrag=null;editor=true;scene.editing=true;scene.preview=r?.preview||{};scene.selectedPatch=r?.sel||'moss';$('editor').classList.toggle('folded',!!r?.folded);$('world').classList.add('editing-layout');$('editor').hidden=false;$('targets').hidden=true;renderEditor();syncEditorViewport();}
function endEditor(){editorReturn=null;scene.inputLocked=false;facilityDraft=null;scene.facilityPreview=null;scene.facilityGrab=null;scene.facilityDrag=null;$('world').classList.remove('editing-layout');editor=false;scene.editing=false;scene.preview={};$('editor').hidden=true;$('targets').hidden=false;syncEditorViewport();}
function dialog(title,text,buttons,input){carry.cancel();audio.cancelShots();const root=$('dialog-root');root.innerHTML='<div class="dialog-backdrop"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">'+escape(title)+'</h2><p>'+escape(text)+'</p>'+(input?'<input id="dialog-input" maxlength="20" aria-label="친구 별명" value="'+escape(input)+'">':'')+'<div class="button-pair">'+buttons.map((b,i)=>'<button class="'+(i===buttons.length-1?'primary':'secondary')+'" data-dialog="'+i+'">'+escape(b.label)+'</button>').join('')+'</div></section></div>';buttons.forEach((b,i)=>root.querySelector('[data-dialog="'+i+'"]').onclick=()=>b.fn());root.querySelector('input,button').focus();root.onkeydown=e=>{if(e.key==='Escape')closeDialog();if(e.key==='Tab'){const nodes=[...root.querySelectorAll('input,button')];const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};}
function closeDialog(){const clockOpen=$('forest-clock-detail');$('dialog-root').replaceChildren();pendingImport=null;if(clockOpen)$('forest-clock').focus();}

// 1.2.6 (user: "관리자모드에서 검수실 기능 삭제"): the 검수실 (fixture scenes and a motion player) is gone from the app; a friend's skill is now shown
// from the admin 친구 tab with '스킬 보기' on the real garden.
viewButtons();$('photo').innerHTML=icon('camera');
$('overview').onclick=()=>{carry.cancel();if(scene.camera.overview){scene.camera.setOverview(false);scene.camera.reset();}else scene.camera.setOverview(true);viewButtons();scene.cameraChanged();scene.saveCamera();};
/* 0.8.2 사진 (user: "카메라 버튼 … 줌 하거나 줌 아웃 하면 지금 월드 화면 딱 그 구도가 스샷 … 버튼들은 안 찍히는 구조"): only the world
   canvas is saved (buttons, hints and cards are page elements, not part of it); the selection ring is left out of the photo */
function takePhoto(){if(!scene.ready||inspector)return;carry.cancel();const sel=scene.selected;let url='';try{scene.selected=null;scene.draw();url=$('garden').toDataURL('image/png');}catch{url='';}finally{scene.selected=sel;scene.draw();}
 if(!url.startsWith('data:image/png')){notice('사진을 찍지 못했어요.');return;}
 $('world').classList.remove('flash');void $('world').offsetWidth;$('world').classList.add('flash');
 const d=new Date(),p2=n=>String(n).padStart(2,'0'),name='여백의숲-'+d.getFullYear()+p2(d.getMonth()+1)+p2(d.getDate())+'-'+p2(d.getHours())+p2(d.getMinutes())+p2(d.getSeconds())+'.png';
 if(native&&native.savePhoto){notice(native.savePhoto(url,name)?'사진을 갤러리(사진/여백의 숲)에 저장했어요.':'사진을 저장하지 못했어요.');return;}
 const link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();notice('사진을 저장했어요.');}
$('photo').onclick=takePhoto;
/* 1.1.7 영상 (user: "일정시간 월드를 비디오 녹화" → "최대 시간은 1분 … 그 안에서 찍다가 정지"): records the world canvas only, like the photo
   (no buttons, cards or selection ring), with the game's sound when it is on; tap again to stop, it stops by itself at one minute.
   On Android the pieces go straight into the gallery (동영상/여백의 숲) every second, so a minute of video is never held as one string. */
const REC_MAX=60;let rec=null;
function recFormat(){const M=window.MediaRecorder;if(!M||!M.isTypeSupported)return null;for(const t of ['video/mp4;codecs=avc1,mp4a.40.2','video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'])if(M.isTypeSupported(t)){const mime=t.split(';')[0];return {type:t,mime,ext:mime==='video/mp4'?'mp4':'webm'};}return null;}
function recButton(){const b=$('record');if(!rec){b.classList.remove('recording');b.innerHTML=icon('video');b.setAttribute('aria-label','월드 영상 찍기');return;}const left=Math.max(0,REC_MAX-Math.floor((performance.now()-rec.start)/1000));b.classList.add('recording');b.innerHTML='<span class="rec-stop"></span><span class="rec-time">'+Math.floor(left/60)+':'+String(left%60).padStart(2,'0')+'</span>';b.setAttribute('aria-label','영상 멈추기');}
/* 1.1.7.1: the data URL's type can itself hold a comma ("video/mp4;codecs=avc1,mp4a.40.2"), so the data is what follows ";base64," */
function toBase64(blob){return new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>{const t=String(r.result),i=t.indexOf(';base64,');i<0?no(Error('no data')):ok(t.slice(i+8));};r.onerror=no;r.readAsDataURL(blob);});}
function startRecording(){if(rec||!scene.ready||inspector)return;const f=recFormat(),canvas=$('garden');if(!f||!canvas.captureStream){notice('이 기기에서는 영상을 찍을 수 없어요.');return;}
 carry.cancel();let stream;try{stream=canvas.captureStream(30);const sound=audio.stream?.();if(sound)for(const t of sound.getAudioTracks())stream.addTrack(t);}catch{notice('영상을 찍지 못했어요.');return;}
 const d=new Date(),p2=n=>String(n).padStart(2,'0'),name='여백의숲-'+d.getFullYear()+p2(d.getMonth()+1)+p2(d.getDate())+'-'+p2(d.getHours())+p2(d.getMinutes())+p2(d.getSeconds())+'.'+f.ext;
 const toGallery=!!(native&&native.videoBegin);if(toGallery&&!native.videoBegin(name,f.mime)){notice('영상을 저장할 수 없어요.');return;}
 let mr;try{mr=new MediaRecorder(stream,{mimeType:f.type,videoBitsPerSecond:2500000});}catch{if(toGallery)native.videoEnd(false);notice('영상을 찍지 못했어요.');return;}
 const r={mr,f,name,toGallery,parts:[],chain:Promise.resolve(true),start:performance.now(),timer:0,stream};rec=r;scene.recording=true;
 mr.ondataavailable=e=>{if(!e.data||!e.data.size)return;if(!r.toGallery){r.parts.push(e.data);return;}r.chain=r.chain.then(ok=>ok&&toBase64(e.data).then(b=>native.videoChunk(b))).catch(()=>false);};
 mr.onstop=()=>{for(const t of r.stream.getVideoTracks())t.stop();if(r.toGallery)notice('영상을 저장하고 있어요…');r.chain.then(ok=>new Promise(res=>setTimeout(()=>res(ok),60))).then(ok=>{if(r.toGallery){const saved=native.videoEnd(!!ok);notice(saved?'영상을 갤러리(동영상/여백의 숲)에 저장했어요.':'영상을 저장하지 못했어요.');return;}
  if(!r.parts.length){notice('영상을 저장하지 못했어요.');return;}const url=URL.createObjectURL(new Blob(r.parts,{type:r.f.mime})),a=document.createElement('a');a.href=url;a.download=r.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);notice('영상을 저장했어요.');});};
 try{mr.start(1000);}catch{rec=null;scene.recording=false;if(toGallery)native.videoEnd(false);notice('영상을 찍지 못했어요.');return;}
 r.timer=setInterval(()=>{recButton();if(performance.now()-r.start>=REC_MAX*1000)stopRecording();},250);recButton();notice('영상을 찍고 있어요 · 다시 누르면 멈춰요 (최대 1분)');}
function stopRecording(){const r=rec;if(!r)return;rec=null;clearInterval(r.timer);scene.recording=false;recButton();try{if(r.mr.state!=='inactive')r.mr.stop();}catch{if(r.toGallery)native.videoEnd(false);}}
$('admin-tool').innerHTML=icon('tool');adminButton();recButton();$('record').onclick=()=>rec?stopRecording():startRecording();
function exportData(data){if(!write(state)){notice('저장 실패로 내보내기를 멈췄어요. 다시 시도해 주세요.');return;}const text=JSON.stringify(data,null,2);if(native)native.exportBackup(text);else{const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='Forest-of-Space-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}}
function offerImport(text){carry.cancel();try{if(text.length>16*1024*1024)throw Error('백업 파일이 너무 커요.');pendingImport=F.migrate(JSON.parse(text));dialog('백업을 불러올까요?','현재 기록을 먼저 안전 백업으로 보관한 뒤 선택한 파일로 바꿔요.',[{label:'취소',fn:closeDialog},{label:'불러오기',fn:()=>{const beforeRestore=F.clone(state);if(!beforeRestore.offline)F.pause(beforeRestore,Date.now());if(!write(beforeRestore)||!archive(beforeRestore)){notice('현재 기록을 백업하지 못해 복원을 멈췄어요.');return;}const next=F.clone(pendingImport);if(next.offline)F.resume(next);if(!write(next)){notice('저장하지 못했어요. 원래 기록을 유지해요.');return;}state=next;storageFailed=false;closeDialog();switchTab('world');targets();update();notice('기록을 불러왔어요.');}}]);}catch(e){notice('복원하지 않았어요. '+e.message);}}
function sporeDetails(p){
 const r=F.Recruitment,parent=state.individuals.find(other=>other.id===p.parentId);
 const lineage=parent?'<p>부모 · '+escape(parent.name)+'</p>':'';
 if(!p.perchTree&&!r.hasSporeSac(p)&&!p.sporeStored&&!parent)return '';
 let button='';
 if(p.sporeStored)button='<button class="secondary" data-action="spore-plant" data-id="'+escape(p.id)+'" '+(state.individuals.length>=50?'disabled':'')+'>포자 심기 · '+(r.generation(p)+1)+'세 맞이하기</button>';
 else if(p.sporeSeconds===r.SPORE_SECONDS)button='<button class="secondary" data-action="spore-collect" data-id="'+escape(p.id)+'">포자 채집</button>';
 const source=state.individuals.find(other=>other.id===p.sporeSac);
 const bond=source?'<p class="sub">'+escape(F.Recruitment.josa(source.name,'과','와'))+' 쌓은 친밀도로 포자낭이 맺혔어요.</p>':'';
 const progress=p.perchTree||r.hasSporeSac(p)||p.sporeStored?'<p>'+r.sporeStatus(p)+'</p><p class="sub">'+(p.sporeStored?(state.individuals.length>=50?'친구 기록이 가득 찼어요. 포자는 보관 중이에요.':'심으면 어린 친구가 대기 목록에 들어와요.'):r.hasSporeSac(p)?(p.perchTree?'착생한 나무에서 광합성한 시간이 누적돼요.':'나무 카드에서 착생 자리를 지정해 주세요.'):'친구 한 명과 친밀도가 최대가 되면 포자낭이 맺혀요.')+'</p>':'';
 return '<section class="panel"><h3>착생과 세대 · '+r.generation(p)+'세</h3>' +lineage+bond+progress+button+'</section>';
}
function updateFriendActivities(){
 if(tab!=='friends'&&tab!=='detail')return;
 const box=$('spore-detail');
 if(box){
  const p=state.individuals.find(p=>p.id===selected);
  if(p){const html=sporeDetails(p);if(box.dataset.content!==html){box.innerHTML=html;box.dataset.content=html;}}
 }
 for(const label of $('page').querySelectorAll('[data-activity-for]')){
  const pet=state.individuals.find(p=>p.id===label.dataset.activityFor);
  if(pet){const text=actionReason(pet);if(label.textContent!==text)label.textContent=text;}
 }
}
const CLOCK_PHASES={
 morning:['아침','이른 햇살','horizon'],noon:['낮','햇살이 드는 낮','sun'],
 dusk:['해질녘','노을이 드는 숲','horizon'],night:['밤','달빛이 드는 밤','moon'],
 deep:['깊은 밤','고요한 깊은 밤','moon'],dawn:['새벽','이슬 맺힌 새벽','horizon']
};
const clockKeys=Object.keys(F.Environment.TIME_START);
function clockDetail(){
 const E=F.Environment,t=E.dayTime(state),key=E.timeKey(state);
 const next=clockKeys[clockKeys.indexOf(key)+1]||'morning';
 const left=(next==='morning'?E.DAY_SECONDS:E.TIME_START[next])-t;
 const minutes=Math.floor(left/60),seconds=left%60;
 const remaining=[minutes&&minutes+'분',seconds&&seconds+'초'].filter(Boolean).join(' ');
 return '지금은 '+CLOCK_PHASES[key][0]+'이에요. '+remaining+' 후 '+CLOCK_PHASES[next][0]+' 시간대가 시작돼요.';
}
function updateClock(){
 const E=F.Environment,key=E.timeKey(state),[label,,symbol]=CLOCK_PHASES[key],clock=$('forest-clock');
 const status=$('clock-phase').parentElement;
 const weather=E.NAMES[E.weatherKey(state)]+' · '+window.ForestVitals.temperature(state).label;
 if(clock.dataset.phase!==key||!$('clock-icon').firstElementChild){
  clock.dataset.phase=status.dataset.phase=key;
  $('clock-icon').innerHTML=icon(symbol);
  $('clock-phase').textContent=label;
  clock.setAttribute('aria-label','숲의 시간, '+label+' · 자세히 보기');
 }
 if($('weather').textContent!==weather)$('weather').textContent=weather;
 clock.style.setProperty('--clock-progress',(100*E.dayTime(state)/E.DAY_SECONDS)+'%');
 const details=$('forest-clock-detail');
 if(details)details.textContent=clockDetail();
}
function update(){if(!state)return;updateFriendActivities();
 if(tab==='detail'){
  const p=state.individuals.find(x=>x.id===selected)||state.individuals[0];
  refreshStats($('page'),p);
 }
 if(adminOpen){const c=$('admin-clock');if(c)c.innerHTML=adminClock();const d=document.querySelector('#admin-panel .doing');const ap=adminPick();if(d&&ap)d.innerHTML=actionReason(ap);const damage=document.querySelector('#admin-panel [data-admin-leaf-damage]');if(damage&&ap){const label='손상 '+leafConditionLabel(ap);if(damage.textContent!==label)damage.textContent=label;}}const night=state.settings.theme==='night';$('shell').classList.toggle('night',night);$('shell').classList.toggle('reduced',state.settings.reducedMotion);{const c=F.Environment.calendar(state);$('season').textContent=c.name+' '+c.day+'일째';$('season').dataset.season=c.id;}updateClock();
 /* 0.8.2 (user: "안내 문구는 해당 안내가 필요할 때만 5초 정도 떴다가 사라지게 … 월드 하단 중간"): a hint appears only when
    something new needs saying (a guest, rain starting, a small neighbour by the rocks; 1.1.1: no thirst notices, the friend card shows that) and fades after 5 s */
 {const lakeEv=[...state.events].reverse().find(e=>(e.type==='world'||e.type==='season'&&e.climate)&&state.worldTick-e.tick<=6),msg=lakeEv?lakeEv.text:state.recruitment.visitor?F.Recruitment.josa(state.recruitment.visitor.pet.name,'이','가')+' 찾아왔어요 · 눌러서 만나기':state.weather.kind==='rain'?'비가 내리면, 자리마다 물기가 달라져요.':state.neighbor.stage==='visiting'?'바위 틈에 작은 이웃이 쉬고 있어요.':'',now=performance.now();
  if(msg!==hintMsg){hintMsg=msg;hintUntil=msg?now+5000:0;if(msg)$('hint').textContent=msg;}
  $('hint').hidden=!!inspector;$('hint').classList.toggle('show',!!msg&&now<hintUntil&&state.settings.showSpeech&&!editor&&!carry.session);}
 $('world-note').textContent=editor?'배치를 살펴보는 동안에도 게임 시간은 흘러요.':'';if(tab==='visit'){if(state.recruitment.visitor)updateVisit();else{switchTab('friends');notice('친구가 잠시 돌아갔어요. 함께한 기록은 이어져요.');}}showCard();if(native)native.theme(night);}
function handle(e){const b=e.target.closest('button');if(!b)return;const a=b.dataset.action;
 if(inspector){
  if(a==='admin-motion-close'||a==='admin-toggle'){stopMotionPreview();renderAdmin();}
  if(a==='admin-motion-replay')startMotionPreview(inspector.kind,inspector.species);
  if(a==='admin-motion-next'){try{inspector.next();renderAdmin();}catch(error){notice(error.message);}}
  if(b.dataset.tab){stopMotionPreview();if(b.dataset.tab==='decorate')startEditor();else switchTab(b.dataset.tab);}
  return;
 }
 if(a==='admin-motion-species'&&adminOpen){motionSpecies=b.dataset.id;renderAdmin();return;}
 if(a==='admin-motion-play'){startMotionPreview(b.dataset.id,b.dataset.species);return;}
 if(a==='spore-collect'){commit(s=>F.Recruitment.collectSpore(s,b.dataset.id),()=>notice('포자를 채집했어요.'));return;}
 if(a==='spore-plant'){
  let child;
  commit(s=>{child=F.Recruitment.germinate(s,b.dataset.id,F.personality,F.event);},()=>{
   selected=child.id;renderPage();targets();notice(child.generation+'세 친구가 자라났어요.');
  });return;
 }
 if(a==='tree-assign'||a==='tree-unassign'){commit(s=>{F.Trees.assignPerch(s,b.dataset.id,b.dataset.friend);},showCard);return;}
 if(a==='object-expand'){previewObjectUpgrade(b.dataset.id);return;}
 if(a==='facility-add'){editFacility(null,'add');return;}
 if(a==='facility-expand'&&facilityDraft?.kind==='move'){startFacilityEdit(facilityDraft.id,'expand');return;}
 if(a==='facility-mirror'&&facilityDraft&&facilityDraft.kind!=='expand'){facilityDraft.flip=!facilityDraft.flip;renderFacilityEditor();return;}
 if(a==='facility-copy'&&editorReturn&&facilityDraft?.kind==='move'){
  const f=F.Shelter.facility(state,facilityDraft.id);
  if(F.Shelter.canCopy(state,f))startFacilityEdit(f.id,'copy');
  return;
 }
 if(a==='facility-shift'&&facilityDraft){const d=facilityDraft,v={left:[-.025,0],right:[.025,0],up:[0,-.025],down:[0,.025]}[b.dataset.dir];d.x+=v[0];d.y+=v[1];renderFacilityEditor();return;}
 if(a==='facility-save'&&facilityDraft){const d=facilityDraft;commit(s=>F.Shelter.build(s,d.id,d.kind,{x:d.x,y:d.y,flip:d.flip}),()=>{if(editorReturn)resumeEditor();else endEditor();notice('쉼터 공간을 바꿨어요.');});return;}
 if(a==='edit-shelter'){editFacility(b.dataset.id,'move');return;}
 if(a==='unstore-shelter'){editFacility(b.dataset.id,'restore');return;}
 if(a==='store-object'){const id=b.dataset.id;commit(s=>F.storeObject(s,id),()=>{delete scene.preview[id];renderEditor();notice('보관함에 넣었어요. 꺼내기를 누르면 다시 숲에 놓여요.');});return;}
 if(a==='unstore-object'){const id=b.dataset.id;commit(s=>{F.unstoreObject(s,id);},()=>{scene.selectedPatch=id;renderEditor();notice('숲에 다시 놓았어요. 끌어서 자리를 잡아 주세요.');});return;}
 if(a==='facility-store-edit'&&facilityDraft?.kind==='move'){const id=facilityDraft.id;commit(s=>F.Shelter.build(s,id,'store'),()=>{if(editorReturn)resumeEditor();else endEditor();notice('쉼터를 보관함에 넣었어요.');});return;}
 if(b.dataset.tab){if(b.dataset.tab==='decorate')startEditor();else switchTab(b.dataset.tab);return;}
 if(b.dataset.dex){dex=b.dataset.dex;renderPage();return;}
 if(b.dataset.patch){scene.selectedPatch=b.dataset.patch;renderEditor();return;}
 if(a==='tree-add'&&scene.editing){
  const type=b.dataset.id,id=F.Trees.nextId(state,type,scene.preview);
  if(!id)return;
  for(const point of F.Trees.candidates(state,type,{x:scene.camera.cx,y:scene.camera.cy})){
   try{F.validateLayout(state,{...scene.preview,[id]:point});}catch{continue;}
   scene.preview[id]=point;scene.selectedPatch=id;renderEditor();return;
  }
  notice('나무를 심을 자리가 부족해요. 주변 사물을 옮겨주세요.');return;
 }
 if(a==='object-add'&&scene.editing){
  const source=scene.editorItems().find(p=>p.id===scene.selectedPatch);
  const id=source&&F.Objects.nextCopyId(state,source.id,scene.preview);
  if(id){
   scene.preview[id]=adjacentCopyPosition(source,p=>F.validateLayout(state,{...scene.preview,[id]:p}));
   scene.selectedPatch=id;renderEditor();
  }
  return;
 }
 if((a==='shelf-mirror'||a==='shelf-copy')&&scene.editing){
  const item=scene.editorItems().find(p=>p.id===scene.selectedPatch&&F.World.SHELF_IDS.includes(p.id));
  if(!item)return;
  if(a==='shelf-mirror')scene.preview[item.id]={x:item.x,y:item.y,flip:!item.flip};
  else{
   const id=F.World.SHELF_IDS.find(id=>!F.World.stoneShelf(state,id)&&!scene.preview[id]);
   if(!id)return;
   scene.preview[id]=adjacentCopyPosition(item,p=>F.validateLayout(state,{...scene.preview,[id]:p}));
   scene.selectedPatch=id;
  }
  renderEditor();return;
 }
 if(b.dataset.move&&scene.editing){
  const id=scene.selectedPatch,item=scene.editorItems().find(p=>p.id===id);
  if(!item)return;
  const p={...item,...scene.preview[id]},delta={left:[-.025,0],right:[.025,0],up:[0,-.025],down:[0,.025]}[b.dataset.move];
  scene.preview[id]={...scene.preview[id],x:p.x+delta[0],y:p.y+delta[1]};renderEditor();return;
 }
 if(b.dataset.toggle){const k=b.dataset.toggle;commit(s=>{if(k==='mounted'){const p=s.individuals.find(p=>p.id===selected)||s.individuals[0];F.Social.cancel(s,p.id);F.Objects.release(s,p,'mounted');p.mounted=!p.mounted;}else s.settings[k]=!(s.settings[k]??(k==='showFrame'));},()=>{renderPage();targets();});return;}
 if(a==='roster'){commit(s=>F.roster(s,b.dataset.id,!s.individuals.find(p=>p.id===b.dataset.id).active),()=>{renderPage();targets();});return;}
 
 if(a==='theme-set'){commit(s=>s.settings.theme=b.dataset.v,renderPage);return;}
 // 1.2.1 (user: "설정에 온화한 숲 촉촉한 숲 이런거 선택이 안됨"): the pick only queued a 30 s change, so no card lit up and it looked like nothing happened. The queued climate now shows as picked.
 if(a==='climate-set'){const v=b.dataset.v;commit(s=>{const e=s.environment;if(v==='season'){delete e.climateMode;delete e.pendingClimate;}else{if(v===e.climate)delete e.pendingClimate;else F.Environment.changeClimate(s,v);e.climateMode='fixed';}},renderPage);return;}
 if(a==='admin-mode'){setAdminMode(!adminOn);renderPage();notice(adminOn?'관리자 모드를 켰어요. 월드 오른쪽 위 공구 버튼으로 패널을 열어요.':'관리자 모드를 껐어요.');return;}
 if(a==='admin-toggle'){adminOpen=!adminOpen;if(adminOpen&&tab!=='world')switchTab('world');renderAdmin();return;}if(a==='admin-close'){adminOpen=false;renderAdmin();return;}if(a==='admin-advance-stop'){if(adminAdvance)adminAdvance.stop=true;return;}
 if(a==='admin-speed'){adminSpeed=Number(b.dataset.v);acc=Math.min(acc,1);renderAdmin();return;}if(a==='admin-tab'){adminTab=b.dataset.tabId;renderAdmin();return;}
 if(a==='admin-lock'){adminLock=!adminLock;renderAdmin();return;}if(a==='admin-view'){adminView[b.dataset.key]=!adminView[b.dataset.key];adminDrawn=0;renderAdmin();return;}
 if(a==='admin-friend'){adminFriend=b.dataset.id;scene.selected=adminFriend;adminFocus(adminFriend);renderAdmin();return;}
 if(a==='admin-run'){const args=JSON.parse(b.dataset.args),run=()=>adminRun(args);if(args[0]==='advance'){if(!adminAdvance){adminAdvance={left:args[1],total:args[1]};renderAdmin();}return;}if(args[0]==='resetLevels'||args[0]==='openLake'||args[0].startsWith('unlock'))dialog('정말 할까요?',{resetLevels:'모든 친구의 레벨과 성장 경험이 처음으로 돌아가요.',openLake:'숲 성장 조건과 동쪽 산책을 건너뛰고 물가를 열어요. 다시 닫을 수 없어요.'}[args[0]]||'해금은 다시 닫을 수 없어요.',[{label:'취소',fn:closeDialog},{label:'하기',fn:()=>{closeDialog();run();}}]);else run();return;}if(a==='open-lake'){dialog('호수 물가를 바로 열까요?','관리자 기능이에요. 숲 성장 조건과 동쪽 산책을 건너뛰고 지금 물가를 열어요. 다시 닫을 수는 없어요.',[{label:'취소',fn:closeDialog},{label:'열기',fn:()=>{closeDialog();commit(s=>{F.World.openLake(s);},()=>{renderPage();notice('숲 동쪽에 물가가 열렸어요. 화면을 오른쪽으로 끌어 보세요.');});}}]);return;}
 if(a==='fold-editor'){$('editor').classList.toggle('folded');renderEditor();syncEditorViewport();return;}
 if(a==='move-pet'){const id=b.dataset.id;carry.begin(id);return;}
 if(a==='close-card')closeCard();
 if(a==='detail'){returnPage=tab;const id=b.dataset.id;switchTab('detail');selected=id;renderPage();}
 if(a==='detail-back'){const id=selected;switchTab(returnPage==='friends'?'friends':'world');if(tab==='world')scene.onSelect('pet',id);}
 if(a==='find-pet'){const id=selected||state.individuals[0].id;if(!state.individuals.find(p=>p.id===id)?.active){notice('대기 중인 친구예요. 먼저 정원에 들여주세요.');return;}switchTab('world');scene.onSelect('pet',id);}
 if(a==='visit'){commit(s=>F.Recruitment.open(s),()=>switchTab('visit'));return;}
 if(a==='visit-close'){commit(s=>F.Recruitment.close(s),()=>switchTab('friends'));return;}
 if(a==='visit-greet'||a==='visit-guide'){commit(s=>F.Recruitment.act(s,a==='visit-greet'?'greet':'guide'));return;}
 if(a==='visit-settle'){commit(s=>F.Recruitment.settle(s,F.event),()=>{switchTab('friends');targets();notice('새 친구가 함께 살기로 했어요. 정원에 들여주세요.');});return;}
 if(a==='recruit-target'){commit(s=>s.recruitment.target=b.dataset.species,renderPage);return;}

 if(a==='rename'){const p=state.individuals.find(x=>x.id===selected)||state.individuals[0];dialog('어떻게 부를까요?','종 이름은 '+speciesName(p)+'로 유지돼요.',[{label:'취소',fn:closeDialog},{label:'이름 저장',fn:()=>{const name=$('dialog-input').value.trim();if(!name){notice('별명을 한 글자 이상 적어주세요.');return;}commit(s=>{const pet=s.individuals.find(x=>x.id===p.id);pet.name=name;pet.customName=true;},()=>{closeDialog();renderPage();targets();});}}],p.name);}
 if(a==='save-layout')commit(s=>F.layout(s,scene.preview),()=>{endEditor();notice('자리를 바꿨어요. 실제 변화를 지켜봐 주세요.');});
 if(a==='cancel-layout'){if(facilityDraft&&editorReturn)resumeEditor();else endEditor();}
 if(a==='species'){const species=F.SPECIES.find(x=>x[0]===b.dataset.species);dialog(species[1],species[2]+'\n\n'+species[3]+skillText(species[0])+traitText(species[0])+(!state.individuals.some(p=>p.species===species[0])?'\n\n'+F.Recruitment.conditions(state,species[0],F.Space,F.Social).reason+'\n'+F.Recruitment.goals[species[0]]:''),[{label:'닫기',fn:closeDialog}]);}
 if(a==='export')exportData(state);
 if(a==='export-legacy')exportData(state.legacy);
 if(a==='import'){if(native)native.importBackup();else $('import-file').click();}
 if(a==='restore-last'){try{const text=archiveRead();if(text)offerImport(text);else notice('아직 안전 백업이 없어요.');}catch{notice('최근 백업을 읽지 못했어요.');}}
 if(a==='home'){const w=$('welcome');w.hidden=false;w.classList.remove('w-play');void w.offsetWidth;w.classList.add('w-play');welcomeStart();scene.paused=true;pause();}
}
function pause(){if(inspector){stopMotionPreview();renderAdmin();}stopRecording();if(!state||!ready)return;carry.cancel();audio.pause();foreground=false;scene.paused=true;F.pause(state);if(!write(state))saveFailure();last=performance.now();acc=0;}
function nativeResume(){if(!ready)return;foreground=true;audio.unlock();scene.tick=null;const next=F.clone(state),summary=F.resume(next);if(!write(next)){saveFailure();return;}state=next;for(const p of state.individuals)delete p.motion;last=performance.now();acc=0;scene.paused=tab!=='world'||!$('welcome').hidden;if(summary.seconds>60)notice('쉬는 동안 기운을 천천히 회복했어요.'+(summary.xp?' 성장 +'+summary.xp+' XP':''));update();}
function saveFailure(){carry.cancel();audio.pause();storageFailed=true;notice('저장 공간을 확인해 주세요. 기록을 지키기 위해 생활을 잠시 멈췄어요.');dialog('저장하지 못했어요','기존 저장은 유지돼요. 저장 공간을 확보한 뒤 다시 시도해 주세요.',[{label:'다시 저장',fn:()=>{if(write(state)){storageFailed=false;closeDialog();notice('기록을 저장했어요.');}}}]);}
function back(){if(carry.session){carry.cancel();return true;}if($('dialog-root').children.length){closeDialog();return true;}if(inspector){stopMotionPreview();renderAdmin();return true;}if(adminOpen&&tab==='world'){adminOpen=false;renderAdmin();return true;}if(editor){endEditor();return true;}if(selected||patchSelected){closeCard();if(tab==='detail')switchTab('friends');return true;}if(tab==='admin'){switchTab('settings');return true;}if(tab!=='world'){switchTab('world');return true;}return false;}
window.RidleyApp={nativePause:pause,nativeResume,back,notice,offerImport};
function tick(now){requestAnimationFrame(tick);if(inspector){const label=$('admin-motion-status'),value=inspector.status();if(label&&label.textContent!==value)label.textContent=value;last=now;return;}if(!ready||!foreground||storageFailed||!$('welcome').hidden){last=now;return;}const elapsed=(now-last)/1000;last=now;if(tab==='visit')drawVisit(now/1000);if(elapsed>5){F.pause(state,state.savedAt);nativeResume();return;}if(adminAdvanceStep()){adminOverlay(now);return;}acc=Math.min(24,acc+elapsed*(adminOn?adminSpeed:1));
 // If a frame falls behind, spread the remaining simulation ticks across frames.
 const start=performance.now();let steps=0;while(acc>=1&&(!steps||performance.now()-start<8)){acc--;steps++;const next=copyForTick(state);if(adminOn&&adminLock){next.weather.remaining=Math.max(next.weather.remaining||0,30);next.weather.strongSeconds=0;}   /* 1.2.11: a locked strong wind keeps blowing (the natural 90 s fade to 45 is skipped) */
 const t0=performance.now();F.step(next,{visible:tab==='world',held:carry.held});adminPerf.tick=adminPerf.tick*.8+(performance.now()-t0)*.2;if(carry.held&&(next.weather.wind>=60||next.individuals.find(p=>p.id===carry.held)?.B<20)){carry.cancel();carry.suppressUntil=performance.now()+700;notice('안전을 위해 원래 자리에서 대피해요.');}lastSave++;const important=next.events.some(e=>['transfer','object-upgrade','spore'].includes(e.type)&&e.tick===next.worldTick)||JSON.stringify(next.discoveries)!==JSON.stringify(state.discoveries)||next.individuals.some((p,i)=>JSON.stringify(p.carriedLeaf)!==JSON.stringify(state.individuals[i]?.carriedLeaf)||p.xp!==state.individuals[i].xp||p.sporeSac!==state.individuals[i].sporeSac||JSON.stringify(p.first)!==JSON.stringify(state.individuals[i].first));if(lastSave>=5||important){lastSave=0;if(!write(next)){saveFailure();break;}}state=next;update();}adminFollowStep();adminOverlay(now);audio.sync(state,tab==='world'&&foreground&&$('welcome').hidden,scene.springVisible());}
/* 1.2.8 entry screen: the art layer starts once the game art is loaded; the season line shows today's forest; a tap skips the intro */
function welcomeStart(){$('welcome-when').textContent=$('season').textContent+' · '+CLOCK_PHASES[F.Environment.timeKey(state)][1]+' · '+$('weather').textContent;globalThis.ForestWelcome?.start({assets:scene.assets,reduced:!!state?.settings?.reducedMotion});}
function welcomeSkip(e){if(e.target.closest('#enter'))return;$('welcome').classList.remove('w-play');globalThis.ForestWelcome?.skip();}
async function boot(){try{const raw=rawRead();if(raw){const parsed=JSON.parse(raw);state=F.migrate(parsed);/* 1.2.3: 목부작으로 쉬기 is gone from the screen, so a friend left mounted is brought back */for(const p of state.individuals)if(p.mounted)p.mounted=false;if((parsed.app!=='ForestOfSpace'||parsed.rules!==F.RULES)&&!archive(raw))throw Error('이전 기록을 백업하지 못했어요.');if(state.started){if(!state.offline)F.pause(state,state.savedAt);F.resume(state);}}else state=F.create();if(state.mode==='landscape')state.mode='game';   /* 0.8.2: the landscape mode is gone (user: "조경모드 자체를 삭제") */
F.valid(state);if(!write(state))throw Error('첫 저장을 완료하지 못했어요.');
 $('settings').innerHTML=icon('gear');$('settings').onclick=()=>switchTab('settings');$('nav').innerHTML=[['world','월드','world'],['friends','친구들','friends'],['dex','도감','book'],['decorate','꾸미기','leaf']].map(([key,name,ic])=>'<button data-tab="'+key+'" class="'+(key==='world'?'active':'')+'">'+icon(ic)+'<span>'+name+'</span></button>').join('');document.addEventListener('click',handle);
 $('forest-clock').onclick=()=>{
  dialog('숲의 시간',clockDetail(),[{label:'닫기',fn:closeDialog}]);
  $('dialog-root').querySelector('.dialog p').id='forest-clock-detail';
 };
 $('season').onclick=()=>{if(!state)return;const E=F.Environment,c=E.calendar(state),fx=E.seasonFx(state),daily={spring:'적게(×0.6)',summer:'조금 적게(×0.8)',autumn:'아주 많이(×2)',winter:'거의 안(×0.3)'}[c.id];
  const notes={spring:'새 잎이 돋는 철이에요. 친구들이 1.25배 빨리 자라고, 겨울을 난 개미와 톡토기가 일찍 돌아와요.',summer:'숲이 무성한 철이에요. 촉촉한 숲에는 장마와 폭풍이, 마른 숲에는 가뭄이 와요.',autumn:'낙엽이 쏟아지는 철이에요. 개미가 바쁘게 나르고 톡토기가 낙엽더미를 거름으로 바꿔요.',winter:'숲이 쉬는 철이에요. 개미는 둥지에서 겨울잠을 자고 해충은 새로 오지 않아요. 눈 위의 톡토기는 찾아와요. 친구들은 0.75배로 천천히 자라요.'}[c.id];
  dialog(c.name+' '+c.day+'일째 · '+c.year+'년',notes+' 기온 '+(fx.T>=0?'+':'')+Math.round(fx.T)+', 낙엽은 '+daily+' 떨어져요. 계절은 3일마다 바뀌어요.',[{label:'닫기',fn:closeDialog}]);};
 $('hint').onclick=()=>state.recruitment.visitor?commit(s=>F.Recruitment.open(s),()=>switchTab('visit')):scene.onSelect('pet',state.individuals[0].id);
 $('enter').onclick=e=>{e.stopPropagation();if(!commit(s=>{s.started=true;if(s.offline)F.resume(s);}))return;$('welcome').hidden=true;globalThis.ForestWelcome?.stop();foreground=true;scene.paused=false;last=performance.now();acc=0;scene.measure();};
 $('import-file').addEventListener('change',async e=>{const file=e.target.files[0];if(file)offerImport(await file.text());e.target.value='';});
 /* 1.2.1 (user: "첨 켤 때 여백의 숲 시작하며 들어가야 하는데 그냥 들어가짐"): the title screen opens on every launch, not only for a new game */$('welcome').hidden=false;$('welcome').addEventListener('click',welcomeSkip);targets();await scene.load();ready=true;update();scene.paused=true;welcomeStart();requestAnimationFrame(tick);
 document.addEventListener('visibilitychange',()=>document.hidden?pause():nativeResume());window.addEventListener('pagehide',pause);window.addEventListener('pageshow',e=>{if(e.persisted)nativeResume();});
 }catch(e){$('welcome').hidden=true;$('page').hidden=false;$('world').hidden=true;$('page').innerHTML='<h2>정원을 열지 못했어요</h2><p>원래 기록은 지우지 않았어요. 앱을 다시 열거나 안전 백업으로 복구해 주세요.</p><p class="save-error">'+escape(e.message)+'</p><button class="primary" id="retry">다시 열기</button><button class="secondary" id="recover">최근 안전 백업 복구</button>';$('retry').onclick=()=>location.reload();$('recover').onclick=()=>{try{const previous=archiveRead();if(!previous)throw Error('사용할 안전 백업이 없어요.');const candidate=F.migrate(JSON.parse(previous));if(!write(candidate))throw Error('저장하지 못했어요.');location.reload();}catch(error){notice(error.message);}};}
}
boot();
})();
