(function(root,factory){
 const api=factory(n=>typeof module==='object'?require('./'+n+'.js'):root[{
  objects:'ForestObjects',spatial:'ForestSpace',vitals:'ForestVitals',environment:'ForestEnvironment',world:'ForestWorld',trees:'ForestTrees'
 }[n]]);
 if(typeof module==='object')module.exports=api;else root.ForestFriendship=api;
})(globalThis,function(dep){
'use strict';
// Meetings are transient. Save/load keeps earned pair points, never a half-finished reservation.
const states=new WeakMap();
function state(s){
 let value=states.get(s);
 if(!value){value={sessions:[],after:{},next:0};states.set(s,value);}
 return value;
}
function busy(s,id){return states.get(s)?.sessions.some(a=>a.ids.includes(id))||false;}
function ready(s,p,held){
 const V=dep('vitals'),E=dep('environment'),W=dep('world');
 return p&&p.active&&!p.mounted&&p.id!==held&&!V.sleepTime(s,p)&&V.isDay(s)&&
  !['rain','snow'].includes(s.weather.kind)&&E.precipitation(s,'rain')+E.precipitation(s,'snow')<.05&&s.weather.wind<30&&
  !W.onIce(s,p)&&!W.inWater(s,p)&&p.id!==s.world?.lake?.boat?.rider&&
  p.B>=V.band(p).lo&&p.nutrition>=V.band(p).lo&&p.energy>=50&&p.burden<40&&p.damage<30&&
  !p.wetRecovery&&!p.leafRecovery&&!p.skill&&!p.skillHold&&!p.shelterRequest&&!p.shelter?.facilityId&&
  (!p.shelter?.phase||p.shelter.phase==='outside')&&!p.objectTask&&!p.sleepHere&&!p.restSelf&&
  !p.braceHere&&!(p.settleUntil>=s.worldTick)&&!p.canopyProgress&&
  !s.social.sessions.some(a=>a.ids.includes(p.id));
}
function finish(s,a,completed){
 const st=state(s);st.sessions=st.sessions.filter(q=>q!==a);
 for(const id of a.ids){
  st.after[id]=s.worldTick+180;
  const p=s.individuals.find(q=>q.id===id);
  if(!p)continue;
  delete p.walkPlan;p.nextObjectChoice=s.worldTick;
  p.action='wander';p.target=null;p.actionSeconds=0;
 }
 if(completed){
  const ps=a.ids.map(id=>s.individuals.find(p=>p.id===id));
  dep('objects').awardAffinity(s,...ps);
 }
}
function cancel(s,id){for(const a of [...(states.get(s)?.sessions||[])])if(!id||a.ids.includes(id))finish(s,a,false);}
function validPath(s,ps,paths){
 const S=dep('spatial'),W=dep('world');
 return paths.every((path,i)=>path.every(q=>S.walkable(s,q,ps[i].id)&&!W.inWater(s,q)&&!W.onIce(s,q)&&
  !s.individuals.some(other=>other.active&&!ps.includes(other)&&S.distance(q,other)<.5*(S.diameter(ps[i])+S.diameter(other)))))&&
  paths[0].every((q,i)=>S.distance(q,paths[1][i])>=.5*(S.diameter(ps[0])+S.diameter(ps[1])));
}
function plan(s,ps,type){
 const S=dep('spatial');
 if(type==='watch')return [[],[]];
 if(type==='dance'){
  const center={x:(ps[0].x+ps[1].x)/2,y:(ps[0].y+ps[1].y)/2};
  const radius=S.distance(...ps)/2;
  const angle=Math.atan2((ps[0].y-center.y)*S.ASPECT,ps[0].x-center.x);
  const paths=ps.map((p,i)=>Array.from({length:33},(_,k)=>{
   const a=angle+i*Math.PI+k*Math.PI/16;
   return {x:center.x+radius*Math.cos(a),y:center.y+radius*Math.sin(a)/S.ASPECT};
  }));
  return validPath(s,ps,paths)?paths.map(path=>path.filter((_,k)=>k%4===0).slice(1)):null;
 }
 // Short shared outing with two reachable destinations per friend, including a change of leader.
 for(const direction of [1,-1]){
  const paths=ps.map(p=>[{x:p.x+direction*.12,y:p.y},{x:p.x+direction*.18,y:p.y-.07}]);
  if(validPath(s,ps,paths)&&paths.every((path,i)=>path.every(q=>S.route(s,ps[i],q,ps[i].id))))return paths;
 }
 return null;
}
function nearbyFish(s,t){
 const S=dep('spatial'),W=dep('world');
 if(W.frozen(s))return null;
 return (s.world.lake?.life||[]).find(q=>q.kind==='medaka'&&S.distance(q,t)<.53)||null;
}
function treeMeeting(s,ps,sessions){
 const S=dep('spatial'),W=dep('world'),T=dep('trees');
 for(const tree of T.active(s)){
  const type=T.kind(tree.id);
  if(type!=='zelkova'&&type!=='willow')continue;
  const shade=T.canopy(tree);
  if(sessions.some(a=>a.tree===tree.id)||ps.some(p=>S.distance(p,shade)>.44))continue;
  const willow=type==='willow',fish=willow?nearbyFish(s,tree):null;
  if(willow&&!fish)continue;
  for(const y of [shade.y+.01,shade.y-.017,shade.y+.033]){
   const x=shade.x,gap=Math.max(.13,(S.diameter(ps[0])+S.diameter(ps[1]))*.56);
   const seats=[{x:x-gap/2,y},{x:x+gap/2,y}];
   if(ps[0].x>ps[1].x)seats.reverse();
   const paths=seats.map((q,i)=>S.route(s,ps[i],q,ps[i].id));
   if(paths.every(Boolean)&&validPath(s,ps,seats.map(q=>[q]))&&
     paths.every(path=>path.every(q=>!W.inWater(s,q))))
    return {tree:tree.id,type:willow?'fish':'chat',paths:seats.map(q=>[q]),view:fish};
  }
 }
 return null;
}
function prepare(s,held,rng){
 const st=state(s),O=dep('objects'),S=dep('spatial'),W=dep('world'),T=dep('trees');
 for(const a of [...st.sessions]){
  if(a.type==='fish'){const tree=T.active(s).find(t=>t.id===a.tree);a.view=tree?nearbyFish(s,tree):null;}
  if(a.type==='fish'&&!a.view||a.last!==s.worldTick-1||a.layout!==s.layoutRevision||s.worldTick-a.started>40||
   a.ids.some(id=>!ready(s,s.individuals.find(p=>p.id===id),held)))finish(s,a,false);
 }
 if(s.worldTick>=st.next){
  st.next=s.worldTick+10;
  const free=s.individuals.filter(p=>ready(s,p,held)&&!busy(s,p.id)&&!(st.after[p.id]>s.worldTick)&&
   p.action==='wander'&&!p.stroll?.perch&&!p.stroll?.shelf&&!p.stroll?.board&&!p.stroll?.lake&&!p.stroll?.puddle);
  for(let i=0;i<free.length;i++){
   const a=free[i];if(busy(s,a.id))continue;
   const b=free.slice(i+1).find(p=>!busy(s,p.id)&&O.affinity(s,a,p)>=3&&S.distance(a,p)<.42);
   if(!b)continue;
   const watching=[a,b].some(p=>W.reaction(s,p)?.kind==='startle');
   if(!watching&&rng(s,'behavior')>=.25)continue;
   const meeting=watching?null:treeMeeting(s,[a,b],st.sessions);
   const type=meeting?.type??(watching?'watch':O.affinity(s,a,b)>=8&&rng(s,'behavior')<.35?'dance':'walk');
   const paths=meeting?.paths??plan(s,[a,b],type);if(!paths)continue;
   for(const p of [a,b]){delete p.stroll;delete p.walkPlan;}
   st.sessions.push({ids:[a.id,b.id],type,paths,leg:0,started:s.worldTick,last:s.worldTick-1,
    layout:s.layoutRevision,stalled:0,rest:0,tree:meeting?.tree,
    view:meeting?.view??(type==='watch'?(s.world?.lake?.life||[]).filter(q=>q.kind==='frog').sort((x,y)=>S.distance(a,x)-S.distance(a,y))[0]:null)});
  }
 }
 return new Set(st.sessions.flatMap(a=>a.ids));
}
function tick(s,held){
 const S=dep('spatial');
 for(const a of [...state(s).sessions]){
  if(a.last===s.worldTick)continue;
  const ps=a.ids.map(id=>s.individuals.find(p=>p.id===id));
  if(ps.some(p=>!ready(s,p,held))){finish(s,a,false);continue;}
  a.last=s.worldTick;
  const age=s.worldTick-a.started;
  if(a.type==='watch'){if(age>=6)finish(s,a,true);continue;}
  if(age<2)continue;
  if(a.leg>=a.paths[0].length){
   if(a.tree)for(const p of ps)p.motion.kind='rest';
   if(++a.rest>=(a.type==='chat'?15:a.type==='fish'?8:2))finish(s,a,true);
   continue;
  }
  const before=ps.map(p=>({x:p.x,y:p.y}));
  const motions=ps.map((p,i)=>{
   // The second friend answers one beat later. At the turn it takes the lead.
   const wait=a.type==='walk'&&(a.leg===0&&i===1&&age===2||a.leg===1&&i===0&&!a.turnAnswered);
   return wait?{kind:'idle',distance:0,arrived:false}:S.travel(s,p,a.paths[i][a.leg]);
  });
  a.turnAnswered=a.leg===1;
  const overlap=S.distance(...ps)<.45*(S.diameter(ps[0])+S.diameter(ps[1]));
  if(overlap){
   ps.forEach((p,i)=>{Object.assign(p,before[i]);delete p.walkPlan;});
   finish(s,a,false);continue;
  }
  ps.forEach((p,i)=>{Object.assign(p.motion,motions[i]);if(motions[i].distance>0)p.energy=Math.max(0,p.energy-1/60);});
  if(motions.every(m=>m.arrived)){a.leg++;a.stalled=0;}
  else if(motions.some(m=>m.distance>0))a.stalled=0;
  else if(++a.stalled>=3)finish(s,a,false);
 }
}
function pose(s,p){
 const a=states.get(s)?.sessions.find(a=>a.ids.includes(p.id));
 if(!a)return null;
 const other=s.individuals.find(q=>q.id!==p.id&&a.ids.includes(q.id));
 const age=s.worldTick-a.started;
 const face=other&&other.x<p.x?-1:1;
 const look=a.type==='watch'?age>=1&&age<4:age<2||a.leg>=a.paths[0].length;
 if(a.tree){
  const seated=a.leg>=a.paths[0].length;
  if(a.type==='chat')return {face:seated?face:0,text:seated?'느티나무 그늘에서 친구와 수다를 떨어요':'친구와 느티나무 그늘에 가고 있어요'};
  return {face:seated&&a.view?(a.view.x<p.x?-1:1):0,text:seated?'수양버들 아래서 함께 송사리를 바라봐요':'함께 송사리를 보러 가고 있어요'};
 }
 const viewFace=a.type==='watch'&&a.view?(a.view.x<p.x?-1:1):0;
 return {face:look?face:viewFace,text:a.type==='watch'?'놀란 친구를 돌아보고 함께 물가를 보고 있어요':
  a.type==='dance'?'친한 친구와 빙글빙글 춤추고 있어요':'친구를 기다리며 함께 산책하고 있어요'};
}
return {prepare,tick,cancel,busy,pose};
});
