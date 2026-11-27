// Draw in world-size pixels using the rig's current transform for the leaf and hand anchors.
const ForestMendingArt=(()=>{
 const anchors={
  adult:[[237,207],[264,207],[295,198],[294,440]],
  young:[[128,145],[154,145],[184,137],[190,326]]
 };
 const ease=t=>{const n=Math.max(0,Math.min(1,t));return n*n*(3-2*n);};
 const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
 const at=(a,b,t,start,end)=>mix(a,b,ease((t-start)/(end-start)));
 function project(c,scale,points){
  const m=c.getTransform();
  return points.map(([x,y])=>[(m.a*x+m.c*y+m.e)/scale,(m.b*x+m.d*y+m.f)/scale]);
 }
 function silk(c,points,taut=false){
  c.strokeStyle='#827354';c.lineWidth=.37;c.lineCap='round';c.lineJoin='round';
  c.beginPath();c.moveTo(...points[0]);
  for(let i=1;i<points.length;i++){
   const [x,y]=points[i],a=points[i-1];
   c.quadraticCurveTo((a[0]+x)/2,(a[1]+y)/2+(taut?0:Math.min(2,Math.hypot(x-a[0],y-a[1])*.045)),x,y);
  }
  c.stroke();c.strokeStyle='#fff3d3';c.lineWidth=.14;c.stroke();
 }
 function spider(c,[x,y],from,t,size,reduced){
  c.save();c.translate(x,y);c.rotate(Math.atan2(y-from[1],x-from[0])+Math.PI/2);c.scale(size,size);
  c.strokeStyle='#574433';c.fillStyle='#574433';c.lineWidth=.42;c.lineCap='round';
  for(const side of [-1,1])for(let i=0;i<4;i++){
   const step=reduced?0:Math.sin(t*34+i*Math.PI/2+side)*.33,y=i*.55-.85;
   c.beginPath();c.moveTo(side*.48,y);c.lineTo(side*(1.53+step),y-.65+i*.26);
   c.lineTo(side*(2.24+step),y-.47+i*.42);c.stroke();
  }
  c.beginPath();c.ellipse(0,.39,1.08,1.26,0,0,Math.PI*2);c.ellipse(0,-.77,.67,.67,0,0,Math.PI*2);c.fill();c.restore();
 }
 function behind(c,fx,young){
  const [root,edge,exit,hand]=project(c,fx.scale,anchors[young?'young':'adult']);
  Object.assign(fx,{root,edge,exit,hand,spiderSize:young?.63:.80});
  const t=fx.age;
  if(t<.08||t>=.33&&t<2.83)return;
  const q=t<.33?at(root,edge,t,.08,.33):at(edge,root,t,2.83,3);
  c.save();c.setTransform(fx.scale,0,0,fx.scale,0,0);c.globalAlpha*=.83;
  silk(c,[root,q]);spider(c,q,t<.33?root:edge,t,fx.spiderSize,fx.reduced);c.restore();
 }
 function front(c,fx){
  const {edge,exit,hand,tear,age:t,spiderSize,scale}=fx;
  if(!edge||!tear||t<.33||t>=2.83)return;
  const [a,b]=tear,len=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
  const dx=(b[1]-a[1])/len*1.1,dy=(a[0]-b[0])/len*1.1;
  const stitches=[[a[0]+dx,a[1]+dy],[b[0]+dx,b[1]+dy],[b[0]-dx,b[1]-dy],[a[0]-dx,a[1]-dy]];
  const path=[[.33,edge],[.52,exit],[1.04,stitches[0]],[1.28,stitches[1]],
   [1.54,stitches[2]],[1.81,stitches[3]],[2.08,stitches[3]],[2.45,exit],[2.83,edge]];
  const i=path.findIndex(([time])=>t<time),[start,from]=path[i-1],[end,to]=path[i];
  const q=at(from,to,t,start,end);
  const grip=ease((t-1.62)/.36)*(1-ease((t-2.15)/.30));
  const pull=mix(mix(edge,stitches[0],.48),hand,grip),line=[edge];
  if(t>=1.04&&t<2.45)line.push(pull,...stitches.slice(0,Math.min(4,i-2)));
  c.save();c.setTransform(scale,0,0,scale,0,0);c.globalAlpha*=.83;
  if(t>=2.45){
   c.save();c.globalAlpha*=1-ease((t-2.45)/.38);silk(c,stitches,true);c.restore();
  }
  silk(c,[...line,q],grip>.8);spider(c,q,from===to?edge:from,t,spiderSize,fx.reduced);c.restore();
 }
 function tilt(t){return .055*Math.sin(Math.PI*ease((t-1.76)/.57))-.026*Math.sin(Math.PI*ease((t-.02)/.33));}
 return {project,behind,front,tilt};
})();
