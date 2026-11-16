(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestSurfaces=api;})(globalThis,function(){
'use strict';
// Presentation only. No simulation RNG, resource writes or persistent visual state.
const clamp=v=>Math.max(0,Math.min(1,v));
function outline(c,x,y,rx,ry,seed=0){
 const pts=[];for(let i=0;i<18;i++){const a=i*Math.PI/9,r=1+.12*Math.sin(a*3+seed)+.07*Math.cos(a*5-seed);pts.push([x+Math.cos(a)*rx*r,y+Math.sin(a)*ry*r]);}
 c.beginPath();c.moveTo((pts[17][0]+pts[0][0])/2,(pts[17][1]+pts[0][1])/2);
 for(let i=0;i<18;i++){const p=pts[i],q=pts[(i+1)%18];c.quadraticCurveTo(p[0],p[1],(p[0]+q[0])/2,(p[1]+q[1])/2);}c.closePath();
}
function wash(c,x,y,rx,ry,color,alpha,seed=0){
 if(alpha<=0)return;c.save();c.translate(x,y);c.scale(rx,ry);outline(c,0,0,1,1,seed);
 const g=c.createRadialGradient(-.12,-.12,0,0,0,1.18);g.addColorStop(0,`rgba(${color},${alpha})`);g.addColorStop(.45,`rgba(${color},${alpha*.62})`);g.addColorStop(.8,`rgba(${color},${alpha*.17})`);g.addColorStop(1,`rgba(${color},0)`);c.fillStyle=g;c.fill();c.restore();
}
function ground(c,p,x,y,size,wet){
 const seed={rock:1.1,moss:2.8,shade:4.2,crevice:5.6,litter:7.1}[p.id]||0;
 const base=y-size*.035;
 // Warm damp soil stains have broad, feathered edges; a wet surface is not a puddle.
 if(wet>0){wash(c,x-size*.10,base,size*.44,size*.105,'116,97,65',wet*.17,seed);wash(c,x+size*.16,base+size*.015,size*.30,size*.075,'127,107,70',wet*.11,seed+2);}
 if(p.id==='shade'){
  // Two dappled leaf footprints, not a uniform disk around the plant.
  wash(c,x-size*.12,base-size*.06,size*.26,size*.105,'72,83,49',.12,seed);
  wash(c,x+size*.17,base-size*.015,size*.28,size*.11,'72,83,49',.10,seed+2);
  wash(c,x+size*.02,base,size*.095,size*.025,'66,61,39',.15,seed);
 }else{
  const spread=p.id==='litter'?.30:p.id==='moss'?.36:.32;
  wash(c,x,base,size*spread,size*.040,'68,61,42',p.id==='litter'?.13:.22,seed);
 }
}
// Match the exposed inner stone boundary in garden-dry.png (not an ellipse).
const rim=[[151,1127],[156,1110],[169,1100],[188,1095],[209,1093],[231,1093],[253,1097],[273,1103],[291,1111],[305,1118],[310,1126],[304,1138],[284,1145],[267,1151],[251,1157],[232,1152],[209,1151],[190,1153],[176,1156],[169,1143],[157,1132]];
function waterShape(amount){const a=clamp(amount),sx=.55+.45*Math.sqrt(a),sy=.35+.65*a;return {sx,sy,drop:(1-a)*12};}
function basin(c,x,y,amount=1){
 const {sx,sy,drop}=waterShape(amount);
 const points=rim.map(([u,v])=>[x+(230+(u-230)*sx-216.17778)*.3515625,y+(1134+(v-1134)*sy+drop-1119.25333)*.375]);
 c.beginPath();const last=points.at(-1),first=points[0];c.moveTo((last[0]+first[0])/2,(last[1]+first[1])/2);for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length];c.quadraticCurveTo(p[0],p[1],(p[0]+q[0])/2,(p[1]+q[1])/2);}c.closePath();
}
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
function drops(s,w,h,t){const count=s.settings.reducedMotion?8:Math.round(28+s.weather.intensity*.5),wind=s.weather.wind;return Array.from({length:count},(_,i)=>{const speed=135+hash(i+2)*180,period=(h+40)/speed,cycle=Math.floor(t/period+hash(i+90)),age=((t/period+hash(i+90))%1+1)%1;return {x:(hash(i*19+cycle*137)*w+(wind-25)*age*.35+w)%w,y:age*(h+40)-20,len:5+hash(i+30)*12,slant:-1-wind*.08-hash(i+55)*3,alpha:.13+hash(i+71)*.32,width:.4+hash(i+23)*.6};});}
function rain(c,s,w,h,t,night){c.save();c.fillStyle='#859ba20d';c.fillRect(0,0,w,h);for(const d of drops(s,w,h,s.settings.reducedMotion?0:t)){const covered=s.patches.some(p=>['shade','shelter'].includes(p.id)&&Math.abs(d.x/w-p.x)<.10&&d.y/h>p.y-.10&&d.y/h<p.y+.02);const leafCovered=s.individuals.some(p=>p.active&&p.species==='neolbi'&&p.canopyProgress>=.95&&s.weather.wind<70&&(()=>{const N=typeof module==='object'?require('./neolbi.js'):globalThis.ForestNeolbi,g=N.geometry(p),x=d.x/w,y=d.y/h;return Math.abs(x-g.cx)<g.rx&&y>p.y-90*g.k/1.6&&y<g.cy+g.ry;})());if(covered||leafCovered)continue;c.strokeStyle=night?'#d4e5e7':'#8aabb2';c.globalAlpha=d.alpha;c.lineWidth=d.width;c.beginPath();c.moveTo(d.x,d.y);c.lineTo(d.x+d.slant,d.y+d.len);c.stroke();}c.restore();}
function glints(c,x,y,rx,ry,phase,alpha){
 c.lineCap='round';
 for(let i=0;i<3;i++){const yy=y+(i-1)*ry*.49,xx=x+Math.sin(i*4.1)*rx*.22,drift=Math.sin(phase*.65+i)*rx*.04;c.strokeStyle=`rgba(235,239,213,${alpha*(.6+.18*Math.sin(phase+i))})`;c.lineWidth=.45;c.beginPath();c.moveTo(xx-rx*.25+drift,yy);c.bezierCurveTo(xx-rx*.12,yy-ry*.09,xx+rx*.13,yy+ry*.08,xx+rx*.34+drift,yy-ry*.02);c.stroke();}
}
function rings(c,x,y,phase,rx=13,ry=4,alpha=.3){
 for(let i=0;i<2;i++){const age=(phase*.9+i*.5)%1;c.lineWidth=.45;c.strokeStyle=`rgba(228,237,221,${(1-age)*alpha})`;c.beginPath();c.ellipse(x,y,1+rx*age,.5+ry*age,-.025,.12,2.6);c.stroke();c.beginPath();c.ellipse(x,y,1+rx*age,.5+ry*age,-.025,3.15,5.6);c.stroke();}
}
function spring(c,s,x,y,phase){
 const water=clamp(s.spring.water/(s.spring.capacity||60)),reduced=s.settings.reducedMotion,t=reduced?0:phase;
 const flowing=s.started&&s.mode==='game'&&!s.offline&&(s.spring.inflow||0)>0;
 if(water>0){
  c.save();basin(c,x,y,1);c.clip();basin(c,x,y,water);c.clip();
  // Translucent depth keeps the painted basin texture visible under the surface.
  const g=c.createLinearGradient(x,y-11,x+6,y+16);g.addColorStop(0,`rgba(60,91,77,${.43+.25*water})`);g.addColorStop(.32,`rgba(97,132,113,${.34+.25*water})`);g.addColorStop(.67,'rgba(140,163,136,.43)');g.addColorStop(1,'rgba(162,170,135,.28)');c.fillStyle=g;c.fillRect(x-40,y-18,80,38);
  c.globalAlpha=.25+.75*Math.sqrt(water);
  wash(c,x-9,y+4,23,6,'213,216,166',.18,2.3);
  if(!reduced){for(let i=0;i<5;i++){const yy=y-8+i*3.6;c.strokeStyle='rgba(198,221,193,.15)';c.lineWidth=1;c.beginPath();c.moveTo(x-32,yy);c.bezierCurveTo(x-15,yy+Math.sin(t*.8+i)*2,x+13,yy-Math.cos(t*.6+i)*1.5,x+32,yy);c.stroke();}}
  glints(c,x+2,y+1,25,9,t,.37);
  if(!reduced){
   if(flowing)rings(c,x-2,y+2+(1-water)*7,t,11,3.5,.36);
   const drinking=s.individuals.some(p=>p.motion?.kind==='drink'&&p.target==='spring'&&p.motion.water>0);
   if(drinking)rings(c,x+12,y+5,t+1.3,7,2.3,.23);
   if(s.weather.kind==='rain')for(let i=0;i<2;i++)rings(c,x-12+i*20,y+1+i*2,t+i*.37,7,2.4,.22);
  }
  c.restore();
 }
 // Source is the gap in the rear stones; no stream when the reservoir is full.
 if(flowing){
  c.save();c.lineCap='round';const strength=Math.min(1,(s.spring.inflow||0)/(10/60));
  const impact=y+2+(1-water)*7;
  const path=()=>{c.beginPath();c.moveTo(x-6,y-23);c.bezierCurveTo(x-7,y-17,x-3,y-8,x-2,impact);};
  c.strokeStyle='rgba(54,79,68,.20)';c.lineWidth=2.5;path();c.stroke();
  const g=c.createLinearGradient(x-6,y-23,x-2,y-3);g.addColorStop(0,'rgba(155,182,165,.60)');g.addColorStop(.4,'rgba(207,224,209,.72)');g.addColorStop(1,'rgba(156,193,183,.25)');c.strokeStyle=g;c.lineWidth=.9+.55*strength;path();c.stroke();
  if(!reduced){for(let i=0;i<3;i++){const f=(t*1.35+i/3)%1,yy=y-22+(impact-y+22)*f,xx=x-6+4*f*f;c.strokeStyle=`rgba(241,246,224,${.4*Math.sin(f*Math.PI)})`;c.lineWidth=.55;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+.2,yy+1.5);c.stroke();}}
  wash(c,x-2,impact,3.3,1.1,'222,234,213',.27,1);c.restore();
 }
}
function puddle(c,p,x,y,size,phase,reduced,raining){
 if(!(p.W>.01))return;const amount=clamp(p.W/Math.max(1,p.pool)),rx=size*(.12+.12*amount),ry=size*(.035+.025*amount);
 c.save();outline(c,x+size*.13,y,rx,ry,3.8);c.clip();
 const g=c.createLinearGradient(x,y-ry,x,y+ry);g.addColorStop(0,'rgba(94,116,91,.07)');g.addColorStop(.7,'rgba(134,155,130,.12)');g.addColorStop(1,'rgba(170,178,143,.025)');c.fillStyle=g;c.fillRect(x-rx,y-ry*1.4,rx*3,ry*3);
 glints(c,x+size*.13,y,rx,ry,reduced?0:phase,.22);if(raining&&!reduced)rings(c,x+size*.13,y,phase,rx*.7,ry*.6,.22);c.restore();
}
return {outline,wash,ground,basin,spring,puddle,rain,drops};
});
