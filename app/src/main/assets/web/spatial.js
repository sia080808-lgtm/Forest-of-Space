(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestSpace=api;})(globalThis,function(){
'use strict';
// One adult body diameter, in a fixed world coordinate system, independent of DPI.
const GU=.10, ASPECT=1.6, distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*ASPECT);
function socket(s,id){const p=id==='spring'?s.spring:s.patches.find(p=>p.id===id);return p?{x:p.x,y:p.y+(id==='shelter'?.07:['spring','rock','crevice'].includes(id)?.065:0)}:null;}
function walkable(s,p){
 if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<.08||p.x>.92||p.y<.15||p.y>.91)return false;
 if(Math.hypot((p.x-s.spring.x)/.085,(p.y-s.spring.y)/.048)<1)return false;
 return !s.patches.some(z=>['rock','crevice'].includes(z.id)&&Math.hypot((p.x-z.x)/.070,(p.y-z.y)/.037)<1);
}
function segment(s,a,b){const n=Math.ceil(distance(a,b)/.012);for(let i=1;i<=n;i++)if(!walkable(s,{x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n}))return false;return true;}
function route(s,start,end){
 if(!end||!walkable(s,end))return null;if(segment(s,start,end))return [end];
 const nodes=[{x:start.x,y:start.y},{x:end.x,y:end.y}];
 // Expanded corners around fixed footprints form a small deterministic visibility graph.
 for(const z of [s.spring,...s.patches.filter(p=>['rock','crevice'].includes(p.id))]){
  const spring=z===s.spring,rx=spring?.105:.09,ry=spring?.067:.055;
  for(const [dx,dy]of [[-rx,-ry],[rx,-ry],[-rx,ry],[rx,ry],[0,-ry],[0,ry],[-rx,0],[rx,0]]){const p={x:z.x+dx,y:z.y+dy};if(walkable(s,p))nodes.push(p);}
 }
 const cost=nodes.map(()=>Infinity),prev=[],done=new Set();cost[0]=0;
 while(done.size<nodes.length){let i=-1;for(let j=0;j<nodes.length;j++)if(!done.has(j)&&(i<0||cost[j]<cost[i]))i=j;if(i<0||!Number.isFinite(cost[i]))break;if(i===1){const path=[];for(let k=1;k!==0;k=prev[k])path.unshift(nodes[k]);return path;}done.add(i);
  for(let j=1;j<nodes.length;j++)if(!done.has(j)&&segment(s,nodes[i],nodes[j])){const c=cost[i]+distance(nodes[i],nodes[j]);if(c<cost[j]){cost[j]=c;prev[j]=i;}}
 }return null;
}
function placement(s,id,p,correct=true){
 const pet=s.individuals.find(x=>x.id===id);if(!pet||!pet.active||pet.mounted)return {ok:false,message:'지금은 옮길 수 없어요.'};
 if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return {ok:false,message:'정원 안의 자리를 골라주세요.'};
 const usable=q=>walkable(s,q)&&!s.individuals.some(x=>x.active&&x.id!==id&&distance(x,q)<GU)&&route(s,q,socket(s,'spring'))&&route(s,q,socket(s,'shelter'));
 if(usable(p))return {ok:true,x:p.x,y:p.y,corrected:false};
 if(correct){for(let r=GU/4;r<=GU+1e-9;r+=GU/4)for(let k=0;k<16;k++){const a=k*Math.PI/8,q={x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r/ASPECT};if(usable(q))return {ok:true,...q,corrected:true};}}
 return {ok:false,message:'물가와 바위, 친구가 있는 자리는 피해주세요.'};
}
function gait(p,s){if(s.weather.wind>=60)return {kind:p.energy<40?'walk':'run',speed:GU*(p.energy<40?1:1.6)};
 if(p.Q>=16)p.wetSlow=true;else if(p.Q<12)p.wetSlow=false;
 if(p.wetSlow||p.energy<40||p.action==='rest')return {kind:'slow',speed:GU*.6};
 if(p.drinkCycle)return {kind:'hurry',speed:GU*1.3};return {kind:'walk',speed:GU};}
function travel(s,p,destination){const plan=route(s,p,destination),g=gait(p,s),path=[{x:p.x,y:p.y}];let left=g.speed;
 if(!plan)return {kind:'idle',path,distance:0,arrived:false};
 let moved=0;for(const q of plan){const d=distance(p,q),n=Math.min(d,left);if(d){p.x+=(q.x-p.x)*n/d;p.y+=(q.y-p.y)*n/d;}moved+=n;left-=n;path.push({x:p.x,y:p.y});if(left<=1e-9)break;}
 return {kind:moved>1e-8?g.kind:'idle',path,distance:moved,duration:moved/g.speed,arrived:distance(p,destination)<.001};
}
return {GU,ASPECT,distance,socket,walkable,segment,route,placement,gait,travel};
});
