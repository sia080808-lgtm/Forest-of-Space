(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestObjects=api;})(globalThis,function(){
'use strict';
const dep=n=>typeof module==='object'?require('./'+n+'.js'):globalThis[{spatial:'ForestSpace',shelter:'ForestShelter','weather-care':'ForestWeatherCare',environment:'ForestEnvironment',social:'ForestSocial'}[n]];
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v)),eps=1e-8;
const capacities={moss:[5,7,9],spring:[60,90,120],litter:[100,150,200]},daily=[20,30,40];
const rates={rock:1,moss:2,shade:1.5,crevice:1,shelter:4};
const names={moss:'이끼 자리',spring:'샘터',litter:'낙엽 자리',rock:'햇살 바위',shade:'잎 그늘',crevice:'바위틈',shelter:'쉼터'};
const patch=(s,id)=>id==='spring'?s.spring:s.patches.find(p=>p.id===id);
const level=(s,id)=>s.objects?.upgrades?.[id]?.level||1;
const capacity=(s,id)=>(capacities[id]||[0])[level(s,id)-1];
const scale=(s,id)=>capacities[id]?1+(level(s,id)-1)*.15:1;
const moist=z=>z?.cap?100*z.S/z.cap:0;
function init(s){
 if(!s.objects)s.objects={version:1,nextSession:1,dayIndex:Math.floor(s.worldTick/1200),dayQuota:daily[level(s,'litter')-1],arrivedToday:0,playBoostUntil:0,decomposedTotal:0,upgrades:{},ledger:{leafInput:0,absorbed:0},lastResourceTick:-1};
 for(const id of ['moss','spring','litter'])s.objects.upgrades[id]??={level:1,useSeconds:0,stageUseSeconds:0,pressureSeconds:0,pressureEvidence:false,unlocked:1};
 s.spring.capacity=capacity(s,'spring');s.spring.snowWater??=0;
 const m=patch(s,'moss');m.cap=capacity(s,'moss');m.pool=0;m.drain=0;
 return s;
}
function storedLeaf(s){return s.patches.reduce((v,p)=>v+p.O+p.U,0)+s.individuals.reduce((v,p)=>v+(p.carriedLeaf?.amount||0)+(p.rootLitter||0),0);}
function migrate(s){
 if(s.objects)return s;
 // Only recognized older rules reach here; never convert an unknown save speculatively.
 for(const z of s.patches)for(const k of ['S','W','O','U'])if(!Number.isFinite(z[k])||z[k]<0)throw Error('기존 자원 기록을 읽을 수 없어요. 원본을 유지해요.');
 for(const z of s.patches)if(!Number.isFinite(z.cap)||!Number.isFinite(z.pool)||z.S>z.cap||z.W>z.pool)throw Error('기존 물량이 용량을 벗어났어요.');
 const m=patch(s,'moss'),oldWater=m.S+m.W,allO=s.patches.reduce((v,p)=>v+p.O,0),allU=s.patches.reduce((v,p)=>v+p.U,0);
 init(s);m.S=Math.min(5,oldWater);m.W=0;
 let spill=oldWater-m.S;const into=Math.min(spill,Math.max(0,s.spring.capacity-s.spring.water));s.spring.water+=into;spill-=into;s.ledger.outflow+=spill;
 for(const z of s.patches){z.O=z.id==='litter'?allO:0;z.U=z.id==='litter'?allU:0;}
 s.objects.migration={from:s.rules,tick:s.worldTick,waterMovedToSpring:into,waterOutflow:spill,leafTotal:storedLeaf(s)};
 s.objects.overflow=Math.max(0,storedLeaf(s)-capacity(s,'litter'));
 return s;
}
function release(s,p,reason='complete'){
 if(p.carriedLeaf){const z=patch(s,p.carriedLeaf.pile);if(!z)throw Error('낙엽의 원래 자리를 찾지 못했어요.');z.O+=p.carriedLeaf.amount;p.objectContact={id:p.carriedLeaf.key+':put',cue:'putdown',tick:s.worldTick};delete p.carriedLeaf;}
 if(p.objectTask){p.lastObject={object:p.objectTask.object,kind:p.objectTask.kind,tick:s.worldTick};delete p.objectTask;}
 delete p.objectWait;delete p.objectArrived;delete p.objectDebug;
 if(reason!=='replace'){delete p.nextObjectChoice;p.target=null;p.action='wander';p.actionSeconds=0;}
}
function invalidate(s){for(const p of s.individuals)if(p.objectTask||p.carriedLeaf)release(s,p,'layout');}
function springWater(s){
 const E=dep('environment'),z=s.spring,st=s.objects;if(st.lastResourceTick===s.worldTick)return;
 const rain=12/60*E.precipitation(s,'rain')*3,snow=12/60*E.precipitation(s,'snow')*3;
 s.ledger.rain+=rain;s.ledger.snow+=snow;const snowIn=Math.min(snow,36-z.snowWater);z.snowWater+=snowIn;s.ledger.outflow+=snow-snowIn;
 const melt=s.climate.T>30?Math.min(z.snowWater,3*(.2+1.8*clamp((s.climate.T-30)/40,0,1))/60):0;z.snowWater-=melt;
 const input=rain+melt,stored=Math.min(input,Math.max(0,z.capacity-z.water));z.water+=stored;z.inflow=input;s.ledger.outflow+=input-stored;
 const evap=Math.min(z.water,(.2+.6*s.climate.L/100+.4*s.weather.wind/100)/60);z.water-=evap;s.ledger.evaporation+=evap;
}
function resources(s){
 const st=s.objects;if(st.lastResourceTick===s.worldTick)return;springWater(s);
 const day=Math.floor(s.worldTick/1200);if(day!==st.dayIndex){st.dayIndex=day;st.arrivedToday=0;st.dayQuota=daily[level(s,'litter')-1];}
 const z=patch(s,'litter'),wind=s.weather.wind>=60?2:s.weather.wind>=45?1.5:1;
 const add=Math.max(0,Math.min(st.dayQuota/1200*wind,st.dayQuota-st.arrivedToday,capacity(s,'litter')-storedLeaf(s)));
 z.O+=add;st.arrivedToday+=add;st.ledger.leafInput+=add;
 const amount=Math.min(z.O,litterRates(s).perMinute/60);z.O-=amount;z.U+=amount;st.decomposedTotal+=amount;
 st.overflow=Math.max(0,storedLeaf(s)-capacity(s,'litter'));st.lastResourceTick=s.worldTick;
}
function litterRates(s){const z=patch(s,'litter'),M=moist(z),factor=z.W>1||M>85?.2:M<20?.2:M<35?.5:M<=70?1:.5,boost=s.objects.playBoostUntil>0&&s.objects.playBoostUntil>=s.worldTick?3:1;return {factor,boost,perMinute:.5*factor*boost};}
function footprint(p){const Sh=dep('shelter'),Space=dep('spatial');return {rx:Space.diameter(p)*Sh.growth(p)*.34,ry:.007*Sh.growth(p)};}
function region(s,id,kind='rest'){
 const z=patch(s,id),g=scale(s,id);if(!z)return null;
 if(id==='moss')return {x:z.x,y:z.y-.03,rx:.12*g,ry:.038*g};
 if(id==='litter')return {x:z.x,y:z.y-.035,rx:.10*g,ry:.034*g};
 if(id==='spring')return kind==='edgeDrink'?{x:z.x+.105*g,y:z.y+.038*g,rx:.04*g,ry:.027*g}:{x:z.x,y:z.y+.017*g,rx:.067*g,ry:.027*g};
 if(id==='shade')return {x:z.x-.055,y:z.y+.05,rx:.075,ry:.032};
 if(id==='rock')return dep('spatial').rockTop(s);
 return {x:z.x,y:z.y+.070,rx:.067,ry:.026};
}
function fits(s,p,id,q,kind){
 const r=region(s,id,kind),f=footprint(p);if(!r)return false;
 return [[-f.rx,0],[f.rx,0],[0,-f.ry],[0,f.ry]].every(([x,y])=>((q.x+x-r.x)/r.rx)**2+((q.y+y-r.y)/r.ry)**2<=1+eps);
}
function groundAt(s,p){
 if(dep('shelter').inside(s,p))return patch(s,'shelter');
 return s.patches.filter(z=>z.id!=='shelter'&&fits(s,p,z.id,p,'rest')).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]||null;
}
function spaceCapacity(s,id){return id==='moss'?(level(s,id)+1)*4:id==='spring'?12:8;}
function used(s,id,exclude){const Sh=dep('shelter');return s.individuals.filter(p=>p.id!==exclude&&p.active&&p.objectTask?.object===id).reduce((n,p)=>n+Sh.units(p),0);}
function dry(s,id){const z=patch(s,id);return z&&moist(z)<40&&z.W<=.5;}
function windAt(s,p,q,id){
 const W=dep('weather-care'),probe={...p,...q,shelter:{phase:'outside'}};
 if(id==='shelter')return s.weather.wind*.2;
 let a=W.wind(s,probe);if(id==='crevice'&&Math.cos(s.weather.wind_dir||0)<-.5&&!fits(s,p,'crevice',probe,'rest'))a*=.5;return a;
}
function effectsValid(s,p,t){
 const z=patch(s,t.object),W=dep('weather-care'),a=t.object==='shelter'?s.weather.wind*.2:windAt(s,p,t,t.object);
 if(t.object==='shelter')return true;
 if(t.object==='moss')return a<60&&dep('environment').precipitation(s,'rain')<.6&&p.burden<40&&!p.wetRecovery&&p.wet85Seconds<30&&!s.patches.some(z=>z.id!=='moss'&&z.W>1&&Math.hypot(p.x-z.x,p.y-z.y)<.06);
 if(t.kind==='drink'||t.kind==='edgeDrink')return s.spring.water>eps&&a<60;
 if(t.kind==='splash')return s.spring.water>=s.spring.capacity*.2&&a<60&&p.energy>=30&&p.burden<40&&!p.wetRecovery;
 if(t.kind==='litterPlay')return (z.O>=.5||p.carriedLeaf?.amount>=.5)&&p.energy>=30&&p.burden<40&&!p.wetRecovery&&a<60&&z.W<=1;
 if(t.kind==='nutrition')return z.U>eps&&a<60&&z.W<=1;
 if(t.kind==='rootDrink')return z.W>eps&&a<60&&p.burden<40&&!p.wetRecovery;
 if(t.object==='shade')return a<60&&!p.wetRecovery&&p.burden<40&&z.W<=.5;
 return a<50&&dry(s,t.object);
}
function needs(p){
 const n=p.objectNeeds??{water:false,energy:false,nutrition:false,mood:false};
 for(const [k,v,start,end]of [['water',p.B,35,65],['energy',p.energy,40,75],['nutrition',p.nutrition,40,70],['mood',p.mood,45,80]]){if(v<start)n[k]=true;if(v>=end-eps)n[k]=false;}
 return n;
}
function urgency(s,p){if(dep('weather-care').wind(s,p)>=60||p.burden>=60)return 0;if(p.B<20||p.energy<20||p.nutrition<20)return 1;return 2;}
function goalsDone(s,p,t){const n=needs(p);if(t.complete)return true;if(t.free)return t.remaining<=0;
 if(t.reason==='safety')return dep('weather-care').wind(s,{...p,shelter:{phase:'outside'}})<50&&!p.wetRecovery&&!p.leafRecovery&&p.burden<40&&p.damage<10&&s.weather.wind<50;
 if(t.reason==='water')return !n.water;if(t.reason==='nutrition')return !n.nutrition;
 if(t.object==='moss')return !n.energy&&!n.mood;
 return t.reason==='energy'?!n.energy:t.reason==='mood'?!n.mood:false;
}
function points(s,p,id,kind){
 if(id==='shelter'){if(p.restCooldown>s.worldTick)return [];const Sh=dep('shelter');if(Sh.inside(s,p))return [{x:p.x,y:p.y}];return s.shelters.facilities.filter(f=>Sh.ledger(s,f,p.id).free>=Sh.units(p)).flatMap(f=>{const q=Sh.seat(s,f,p,q=>!!dep('spatial').route(s,p,Sh.entry(f,q),p.id));return q?[Sh.entry(f,q)]:[];});}
 const r=region(s,id,kind),g=scale(s,id),large=dep('shelter').units(p)>4;
 const offsets=kind==='edgeDrink'?[[0,0]]:large?[[0,0],[-.015,0],[.015,0]]:[[0,0],[-.035,0],[.035,0],[-.065,0],[.065,0],[0,.014],[0,-.014]];
 return offsets.map(([x,y])=>({x:r.x+x*g,y:r.y+y*g}));
}
function option(s,p,id,kind,reason,free=false){
 const Space=dep('spatial'),Sh=dep('shelter');if(id!=='shelter'&&used(s,id,p.id)+Sh.units(p)>spaceCapacity(s,id))return {fail:'capacity',object:id,kind};
 let fail='shape';
 for(const q of points(s,p,id,kind)){
  const t={...q,object:id,kind,reason,free};
  if(!effectsValid(s,p,t)){fail=id==='spring'&&s.spring.water<=eps?'empty_water':kind==='litterPlay'&&patch(s,id).O<.5?'no_play_leaves':kind==='nutrition'&&patch(s,id).U<=eps?'no_nutrients':'unsafe_weather';continue;}
  if(id!=='shelter'&&!fits(s,p,id,q,kind))continue;
  if(id!=='shelter'&&s.individuals.some(z=>z.id!==p.id&&z.active&&(z.objectTask?.object===id&&Space.distance(z.objectTask,q)<.4*(Space.diameter(p)+Space.diameter(z))||Space.distance(z,q)<.4*(Space.diameter(p)+Space.diameter(z))))){fail='capacity';continue;}
  if(!Space.walkable(s,q,p.id)){fail='blocked_path';continue;}
  const route=Space.route(s,p,q,p.id);if(!route){fail='blocked_path';continue;}
  const seconds=route.reduce((a,z,i)=>a+Space.distance(i?route[i-1]:p,z),0)/Space.gait(p,s).speed;
  const target={water:65,energy:75,nutrition:70,mood:80},key={water:'B',energy:'energy',nutrition:'nutrition',mood:'mood'};
  let score=reason==='safety'?100:100*clamp(((target[reason]||75)-(p[key[reason]]||0))/(target[reason]||75),0,1);
  if(id==='moss'&&needs(p).energy&&needs(p).mood)score+=20*Math.max((75-p.energy)/75,(80-p.mood)/80);
  if(reason==='energy')score+=(rates[id]||0)*8;if(!p.objectTask&&p.action==='rest'&&p.target==='shelter'&&id==='shelter'&&reason==='energy')score+=35;if(reason==='safety'&&dry(s,id))score+=20;if(reason==='water')score+=id==='spring'?45:-30;
  if(free)score=30+(id==='moss'?(p.personality.c||0)*3:id==='litter'?(p.personality.a||0)*3:0);
  score-=seconds*2+(p.lastObject?.object===id&&s.worldTick-p.lastObject.tick<60?20:0);
  return {...t,score,travelSeconds:seconds};
 }
 return {object:id,kind,fail};
}
function choose(s,p,rng){
 if(!p.active||p.mounted)return;
 const W=dep('weather-care'),Sh=dep('shelter'),n=needs(p);p.objectNeeds=n;
 const current=p.objectTask,danger=(Sh.inside(s,p)?s.weather.wind:W.wind(s,p))>=60||p.burden>=40||p.wetRecovery||((p.leafRecovery||p.damage>=10)&&p.B>=40&&p.nutrition>=40);
 const grade=urgency(s,p),valid=current&&effectsValid(s,p,current)&&!goalsDone(s,p,current);
 const emergencyChange=current&&grade<(current.grade??2);
 if(valid&&!emergencyChange&&s.worldTick<(p.nextObjectChoice||0))return;
 if(valid&&!emergencyChange&&current.reason==='safety'&&danger){p.nextObjectChoice=s.worldTick+5;return;}
 if(!current&&!danger&&!Object.values(n).some(Boolean)&&p.action==='groom'&&p.actionSeconds>0)return;
 if(!current&&s.worldTick<(p.nextObjectChoice||0)&&!danger&&grade>1)return;
 const definitions=[];const add=(id,k,r,free=false)=>definitions.push([id,k,r,free]);
 if(danger){for(const id of ['shelter','rock','crevice'])add(id,'rest','safety');}
 else if(n.water&&(p.B<20||!n.energy&&!n.nutrition||p.B/65<=Math.min(p.energy/75,p.nutrition/70))){add('spring',p.wetRecovery||p.burden>=40||s.spring.water<s.spring.capacity*.2?'edgeDrink':'drink','water');add('spring','edgeDrink','water');if(p.B>=20&&patch(s,'moss').S>=1&&p.Q<12)add('moss','moss','water');if(p.B>=20&&patch(s,'crevice').W>0)add('crevice','rootDrink','water');}
 else if(n.nutrition&&(p.nutrition<20||!n.energy||p.nutrition/70<p.energy/75))add('litter','nutrition','nutrition');
 else if(n.energy){for(const id of ['shelter','moss','shade','rock','crevice'])add(id,id==='moss'?'moss':'rest','energy');}
 else if(n.mood){add('moss','moss','mood');add('litter','litterPlay','mood');add('spring','splash','mood');}
 else if(!current&&p.action==='rest'&&p.target==='shelter'){add('shelter','rest','free',true);}
 else {
  // Free visits preserve species expression without competing with actual needs.
  const roll=rng(s,'behavior');if(roll<.25&&!current){p.action='groom';p.target=null;p.actionSeconds=8;p.nextObjectChoice=s.worldTick+8;return;}
  const free=[['moss','moss'],['litter','litterPlay'],['spring','splash'],['shade','rest'],['rock','rest'],['crevice','rest'],['shelter','rest']];const first=Math.floor(roll*free.length)%free.length;
  for(let j=0;j<free.length;j++){const [id,k]=free[(j+first)%free.length];add(id,k,'free',true);}
 }
 const options=[];for(const d of definitions){const o=option(s,p,...d);options.push(o);if(d[3]&&!o.fail)break;}p.objectDebug=options.map(o=>({object:o.object,kind:o.kind,score:o.score,reason:o.fail||'eligible'}));
 const candidates=options.filter(o=>!o.fail);if(!definitions[0]?.[3])candidates.sort((a,b)=>b.score-a.score||a.object.localeCompare(b.object));
 let next=candidates[0];
 if(valid&&!emergencyChange&&next&&current.reason===next.reason&&((s.worldTick-current.since<3)||next.score<(current.score??-1e3)+15))next=null;
 if(!next&&valid&&!emergencyChange){p.nextObjectChoice=s.worldTick+5;return;}
 if(next){if(current?.object===next.object&&current.kind===next.kind&&valid){current.score=next.score;p.nextObjectChoice=s.worldTick+5;return;}
  const debug=p.objectDebug;release(s,p,'replace');p.objectDebug=debug;const serial=s.objects.nextSession++;
  p.objectTask={...next,serial,since:s.worldTick,grade,remaining:20+Math.floor(rng(s,'behavior')*(next.kind==='splash'?11:21)),stalled:0,deadline:s.worldTick+Math.max(10,Math.min(30,Math.ceil(next.travelSeconds)+5))};p.nextObjectChoice=s.worldTick+5;
  p.action=['drink','edgeDrink','rootDrink'].includes(next.kind)?'drink':next.kind==='rest'||next.kind==='moss'?'rest':next.kind==='nutrition'?'feed':'play';p.target=next.object;p.drinkCycle=next.reason==='water';
 }else {
  const debug=p.objectDebug;release(s,p,'replace');p.objectDebug=debug;p.objectWait={reason:options[0]?.fail||'no_resource',object:definitions[0]?.[0]||null,since:current?.since??s.worldTick};p.action='wander';p.target=null;p.actionSeconds=5;p.nextObjectChoice=s.worldTick+5;

 }
}
function prepare(s,held,rng){
 for(const p of [...s.individuals].sort((a,b)=>urgency(s,a)-urgency(s,b)||(a.objectWait?.since??s.worldTick)-(b.objectWait?.since??s.worldTick)||a.id.localeCompare(b.id))){
  if(!p.active||p.mounted||held===p.id){release(s,p,'interrupt');continue;}
  if(s.social.sessions.some(a=>a.ids.includes(p.id)))continue;
  choose(s,p,rng);
 }
}
function at(s,p){const t=p.objectTask;if(!t)return false;if(t.object==='shelter')return dep('shelter').inside(s,p);return dep('spatial').distance(p,t)<.001&&fits(s,p,t.object,p,t.kind)&&effectsValid(s,p,t);}
function move(s,p){
 const t=p.objectTask;if(!t)return null;const Space=dep('spatial');if(t.object==='shelter')return null;
 const m=Space.travel(s,p,t);if(m.distance>0)t.stalled=0;else if(!m.arrived)t.stalled++;
 if(!m.arrived&&(t.stalled>=3||s.worldTick>t.deadline)){t.replans=(t.replans||0)+1;t.stalled=0;t.deadline=s.worldTick+15;if(t.replans>1){release(s,p,'blocked');p.objectWait={reason:'blocked_path',object:t.object,since:t.since};p.nextObjectChoice=s.worldTick+5;}}
 return m;
}
function grant(requests){
 const groups=new Map();for(const r of requests)if(r.amount>0){const key=r.sourceId;const g=groups.get(key)||[];g.push(r);groups.set(key,g);}
 for(const group of groups.values()){
  const available=Math.max(0,group[0].source[group[0].key]),total=group.reduce((v,r)=>v+r.amount,0),factor=Math.min(1,available/total);let used=0;
  for(const r of group){const n=Math.min(r.amount*factor,Math.max(0,available-used));used+=n;r.apply(n);}
  group[0].source[group[0].key]=Math.max(0,available-used);
 }
}
function receive(s,p,requests){
 const t=p.objectTask;if(!t||!at(s,p))return false;
 const z=patch(s,t.object),Sh=dep('shelter');t.arrived=true;p.objectArrived=true;
 const add=(source,key,amount,apply)=>requests.push({sourceId:(source===s.spring?'spring':source.id)+':'+key,source,key,amount:Math.max(0,amount),apply});
 const recover=(key,rate,max)=>{if(p[key]<max)p[key]=Math.min(max,p[key]+rate/60);};
 if(t.kind==='moss'){recover('energy',2,75);recover('mood',1,80);p.motion.kind='moss';}
 else if(t.kind==='rest'){recover('energy',rates[t.object]||1,75);p.motion.kind='rest';}
 else if(t.kind==='drink'||t.kind==='edgeDrink'){
  add(s.spring,'water',Math.min(10/60,65-p.B),n=>{p.B+=n;p.motion.water=n;p.motion.kind=n>0?'drink':'idle';if(p.B>=65-eps){t.complete=true;p.drinkCycle=false;p.objectNeeds.water=false;p.justDrank=true;}});
 }else if(t.kind==='splash'){
  recover('mood',2,80);p.energy=clamp(p.energy-1/60);p.motion.kind='splash';
  add(s.spring,'water',Math.min(6/60,65-p.B),n=>{p.B+=n;p.motion.water=n;if(n>0&&p.B>=65-eps){p.objectNeeds??=needs(p);p.objectNeeds.water=false;if(!t.hydrationComplete){t.hydrationComplete=true;p.justDrank=true;}}});
 }
 else if(t.kind==='litterPlay'){
  if(!p.carriedLeaf&&z.O>=.5){z.O-=.5;p.carriedLeaf={amount:.5,pile:'litter',key:'leaf:'+p.id+':'+t.serial};p.objectContact={id:p.carriedLeaf.key+':pick',cue:'pickup',tick:s.worldTick};}
  if(p.carriedLeaf){recover('mood',3,80);p.energy=clamp(p.energy-1/60);p.motion.kind='litter';s.objects.playBoostUntil=s.worldTick+120;}
 }else if(t.kind==='nutrition'){
  add(z,'U',Math.min(1/60,70-p.nutrition),n=>{p.nutrition+=n;s.objects.ledger.absorbed+=n;if(p.nutrition>=70-eps){t.complete=true;p.objectNeeds.nutrition=false;}});p.motion.kind='groom';
 }else if(t.kind==='rootDrink')p.motion.kind='drink';
 if(t.object==='spring'&&p.species==='bonbon'&&p.B>=35&&p.V<40)add(s.spring,'water',Math.min(4/60,40-p.V),n=>dep('social').credit(p,n,'other'));
 if(t.free||t.kind==='splash'){t.remaining--;if(t.remaining<=0)t.complete=true;}
 const meta=s.objects.upgrades[t.object];if(meta&&meta.lastUsedTick!==s.worldTick){meta.useSeconds++;meta.stageUseSeconds++;meta.lastUsedTick=s.worldTick;}
 return ['moss','rest'].includes(t.kind);
}
function rootRequests(s,p,requests){
 const z=groundAt(s,p),t=p.objectTask;if(!z||p.mounted||p.motion.distance>0||p.motion.kind==='held'||dep('shelter').inside(s,p))return;
 let amount=0;if(z.id==='moss'){if(z.S>=z.cap*.2&&p.B<45&&p.Q<12)amount=Math.min(.5/60,12-p.Q);}
 else if(t?.kind==='rootDrink'&&at(s,p))amount=Math.min(1/60,20-p.Q);
 else if(moist(z)>=60)amount=Math.min(4/60,20-p.Q);
 if(amount>0){const key=t?.kind==='rootDrink'?'W':z.W>0?'W':'S';requests.push({sourceId:z.id+':'+key,source:z,key,amount,apply:n=>{p.Q+=n;}});}
}
function upgradeStatus(s,id){const m=s.objects.upgrades[id];if(!m)return null;return {...m,capacity:capacity(s,id),nextCapacity:capacities[id][m.level],requiredSeconds:m.level===1?180:360,ready:m.level<3&&m.unlocked>m.level};}
function progress(s){
 for(const id of ['spring','litter','moss']){const m=s.objects.upgrades[id],z=patch(s,id);let pressure=false;
  if(id==='spring')pressure=s.spring.water<=s.spring.capacity*.1&&s.individuals.some(p=>p.active&&p.B<35);
  if(id==='litter')pressure=storedLeaf(s)>=capacity(s,id)*.9&&s.objects.arrivedToday<s.objects.dayQuota;
  if(id==='moss')pressure=s.individuals.some(p=>p.objectWait?.object==='moss'&&p.objectWait.reason==='capacity');
  m.pressureSeconds=pressure?Math.min(10,m.pressureSeconds+1):0;if(m.pressureSeconds>=10)m.pressureEvidence=true;
  if(m.level<3&&m.stageUseSeconds>=(m.level===1?180:360)&&m.pressureEvidence)m.unlocked=Math.max(m.unlocked,m.level+1);
 }
}
function planUpgrade(s,id){
 const meta=upgradeStatus(s,id);if(!meta?.ready)throw Error('실제로 이용하고 공간·잔량 부족을 겪으면 확장할 수 있어요.');
 if(s.individuals.some(p=>p.active&&p.objectTask?.object===id))throw Error('친구들이 이용을 마친 뒤 넓힐 수 있어요.');
 const next=JSON.parse(JSON.stringify(s));next.objects.upgrades[id].level++;init(next);
 const r=region(next,id),Space=dep('spatial');if(r.x-r.rx<.08||r.x+r.rx>.92||r.y-r.ry<.15||r.y+r.ry>.91)throw Error('넓어질 공간을 정원 안에 확보해 주세요.');
 for(const z of [...next.patches.filter(z=>z.id!==id&&z.id!=='shelter'),...(id==='spring'?[]:[next.spring])])if(Math.hypot((z.x-r.x)/(r.rx+.055),(z.y-r.y)/(r.ry+.035))<1)throw Error('주변 오브젝트를 옮겨 넓어질 공간을 비워주세요.');
 for(const p of next.individuals.filter(p=>p.active))if(fits(next,p,id,p,'rest'))throw Error('친구가 있는 자리를 비워주세요.');
 for(const f of next.shelters.facilities)if(!Space.route(next,dep('shelter').entry(f),Space.socket(next,'spring')))throw Error('샘터와 쉼터를 잇는 길을 비워주세요.');
 return next;
}
function upgrade(s,id){planUpgrade(s,id);const m=s.objects.upgrades[id];m.level++;m.stageUseSeconds=0;m.pressureSeconds=0;m.pressureEvidence=false;init(s);s.layoutRevision++;}
function reason(s,p){
 const t=p.objectTask,w=p.objectWait;
 if(w)return ({empty_water:'비가 와서 물이 모이길 기다려요',no_play_leaves:'낙엽이 더 모이길 기다려요',no_nutrients:'낙엽이 천천히 거름이 되고 있어요',capacity:'편히 머물 빈 자리를 찾고 있어요',shape:'몸에 맞는 자리를 찾고 있어요',blocked_path:'오브젝트로 갈 수 있는 길을 찾고 있어요',unsafe_weather:'안전하게 머물 곳을 찾고 있어요'})[w.reason]||'필요한 자원이 있는 자리를 찾고 있어요';
 if(!t)return null;if(t.object==='shelter')return dep('shelter').label(s,p);if(!at(s,p))return names[t.object]+'로 가고 있어요';
 if(t.object==='moss')return patch(s,'moss').S<=eps?'이끼는 말랐지만 포근하게 쉬고 있어요':'포근한 이끼에서 놀며 천천히 쉬고 있어요';
 if(t.kind==='splash')return p.motion?.water>0?'샘터에서 물장구를 치며 물도 마시고 있어요':'샘터에서 살짝 물장구를 치고 있어요';
 return ({nutrition:'분해된 낙엽에서 영양을 얻고 있어요',litterPlay:'낙엽을 가지고 놀고 있어요',splash:'샘터에서 물장구를 치며 물도 마시고 있어요',drink:'물가에서 천천히 물을 마시고 있어요',edgeDrink:'마른 가장자리에서 물을 마시고 있어요',rootDrink:'바위틈에 남은 물기를 느끼고 있어요'})[t.kind]||names[t.object]+'에서 쉬고 있어요';
}
function validate(s){
 const st=s.objects,f=(v,max=1e15)=>Number.isFinite(v)&&v>=0&&v<=max;
 if(s.spring.capacity!==capacity(s,'spring')||patch(s,'moss').cap!==capacity(s,'moss'))throw Error('오브젝트 용량 기록을 확인해 주세요.');
 if(!st||st.version!==1||!Number.isSafeInteger(st.nextSession)||st.nextSession<1||!Number.isInteger(st.dayIndex)||!f(st.dayIndex)||!f(st.arrivedToday,st.dayQuota+eps)||!daily.includes(st.dayQuota)||!f(st.playBoostUntil)||!f(st.decomposedTotal))throw Error('오브젝트 순환 기록을 확인해 주세요.');
 for(const [id,m]of Object.entries(st.upgrades)){if(!capacities[id]||![1,2,3].includes(m.level)||![1,2,3].includes(m.unlocked)||m.unlocked<m.level||!f(m.useSeconds)||!f(m.stageUseSeconds)||!f(m.pressureSeconds,10)||typeof m.pressureEvidence!=='boolean')throw Error('확장 기록을 확인해 주세요.');}
 if(Object.keys(st.upgrades).length!==3||!f(st.ledger.leafInput)||!f(st.ledger.absorbed)||!f(s.spring.water,s.spring.capacity+eps)||!f(s.spring.snowWater,36+eps))throw Error('자원 원장을 확인해 주세요.');
 const total=storedLeaf(s);if(total>capacity(s,'litter')+(st.overflow||0)+1e-6)throw Error('낙엽 저장량이 용량을 초과했어요.');
 for(const p of s.individuals){const t=p.objectTask;if(t&&(!names[t.object]||!['moss','rest','drink','edgeDrink','rootDrink','splash','litterPlay','nutrition'].includes(t.kind)||!Number.isFinite(t.x)||!Number.isFinite(t.y)||!Number.isInteger(t.serial)||t.serial<1||t.serial>=st.nextSession||!f(t.since)||!Number.isFinite(t.remaining)))throw Error('오브젝트 이용 기록을 확인해 주세요.');if(p.carriedLeaf&&(!f(p.carriedLeaf.amount,.5)||p.carriedLeaf.pile!=='litter'||typeof p.carriedLeaf.key!=='string'))throw Error('운반 중인 낙엽을 확인해 주세요.');}
}
return {litterRates,init,migrate,resources,springWater,storedLeaf,patch,level,capacity,scale,rates,region,fits,groundAt,windAt,dry,spaceCapacity,used,option,prepare,choose,at,move,receive,rootRequests,grant,needs,release,invalidate,progress,planUpgrade,upgrade,upgradeStatus,reason,validate};
});
