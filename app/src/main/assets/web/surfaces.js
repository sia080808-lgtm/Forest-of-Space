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
function basin(c,x,y,amount){
 // Traced inside the rear/side/front stones in garden-dry.png, 360×576 design units.
 const f=.46+.54*Math.sqrt(clamp(amount)),cy=y+4*(1-f);
 c.beginPath();c.moveTo(x-25*f,cy+1*f);
 c.bezierCurveTo(x-24*f,cy-3*f,x-20*f,cy-6*f,x-16*f,cy-7*f);
 c.bezierCurveTo(x-10*f,cy-11*f,x-3*f,cy-10*f,x+3*f,cy-10*f);
 c.bezierCurveTo(x+11*f,cy-9*f,x+16*f,cy-7*f,x+21*f,cy-5*f);
 c.bezierCurveTo(x+29*f,cy-2*f,x+29*f,cy+3*f,x+24*f,cy+5*f);
 c.bezierCurveTo(x+19*f,cy+9*f,x+10*f,cy+11*f,x+2*f,cy+11*f);
 c.bezierCurveTo(x-7*f,cy+12*f,x-15*f,cy+9*f,x-20*f,cy+7*f);
 c.bezierCurveTo(x-23*f,cy+6*f,x-26*f,cy+4*f,x-25*f,cy+1*f);c.closePath();
}
function glints(c,x,y,rx,ry,phase,alpha){
 c.lineCap='round';
 for(let i=0;i<3;i++){const yy=y+(i-1)*ry*.49,xx=x+Math.sin(i*4.1)*rx*.22,drift=Math.sin(phase*.65+i)*rx*.04;c.strokeStyle=`rgba(235,239,213,${alpha*(.6+.18*Math.sin(phase+i))})`;c.lineWidth=.45;c.beginPath();c.moveTo(xx-rx*.25+drift,yy);c.bezierCurveTo(xx-rx*.12,yy-ry*.09,xx+rx*.13,yy+ry*.08,xx+rx*.34+drift,yy-ry*.02);c.stroke();}
}
function rings(c,x,y,phase,rx=13,ry=4,alpha=.3){
 for(let i=0;i<2;i++){const age=(phase*.9+i*.5)%1;c.lineWidth=.45;c.strokeStyle=`rgba(228,237,221,${(1-age)*alpha})`;c.beginPath();c.ellipse(x,y,1+rx*age,.5+ry*age,-.025,.12,2.6);c.stroke();c.beginPath();c.ellipse(x,y,1+rx*age,.5+ry*age,-.025,3.15,5.6);c.stroke();}
}
function spring(c,s,x,y,phase){
 const water=clamp(s.spring.water/60),reduced=s.settings.reducedMotion,t=reduced?0:phase;
 const flowing=s.started&&s.mode==='game'&&!s.offline&&(s.spring.inflow||0)>0;
 if(water>0){
  c.save();basin(c,x,y,water);c.clip();
  // Translucent depth keeps the painted basin texture visible under the surface.
  const g=c.createLinearGradient(x,y-11,x+6,y+12);g.addColorStop(0,'rgba(60,91,77,.68)');g.addColorStop(.32,'rgba(97,132,113,.59)');g.addColorStop(.67,'rgba(140,163,136,.49)');g.addColorStop(1,'rgba(162,170,135,.32)');c.fillStyle=g;c.fillRect(x-33,y-15,66,32);
  wash(c,x-9,y+4,23,6,'213,216,166',.23,2.3);
  glints(c,x+2,y+1,25,9,t,.37);
  if(!reduced){
   if(flowing)rings(c,x-2,y-3,t,11,3.5,.36);
   const drinking=s.individuals.some(p=>p.motion?.kind==='drink'&&p.target==='spring'&&p.motion.water>0);
   if(drinking)rings(c,x+12,y+5,t+1.3,7,2.3,.23);
   if(s.weather.kind==='rain')for(let i=0;i<2;i++)rings(c,x-12+i*20,y+1+i*2,t+i*.37,7,2.4,.22);
  }
  c.restore();
 }
 // Source is the gap in the rear stones; no stream when the reservoir is full.
 if(flowing){
  c.save();c.lineCap='round';const strength=Math.min(1,(s.spring.inflow||0)/(10/60));
  const path=()=>{c.beginPath();c.moveTo(x-6,y-23);c.bezierCurveTo(x-7,y-17,x-3,y-13,x-2,y-3);};
  c.strokeStyle='rgba(54,79,68,.20)';c.lineWidth=2.5;path();c.stroke();
  const g=c.createLinearGradient(x-6,y-23,x-2,y-3);g.addColorStop(0,'rgba(155,182,165,.60)');g.addColorStop(.4,'rgba(207,224,209,.72)');g.addColorStop(1,'rgba(156,193,183,.25)');c.strokeStyle=g;c.lineWidth=.9+.55*strength;path();c.stroke();
  if(!reduced){for(let i=0;i<3;i++){const f=(t*1.35+i/3)%1,yy=y-22+18*f,xx=x-6+4*f*f;c.strokeStyle=`rgba(241,246,224,${.4*Math.sin(f*Math.PI)})`;c.lineWidth=.55;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+.2,yy+1.5);c.stroke();}}
  wash(c,x-2,y-3,3.3,1.1,'222,234,213',.27,1);c.restore();
 }
}
function puddle(c,p,x,y,size,phase,reduced,raining){
 if(!(p.W>.01))return;const amount=clamp(p.W/Math.max(1,p.pool)),rx=size*(.12+.12*amount),ry=size*(.035+.025*amount);
 c.save();outline(c,x+size*.13,y,rx,ry,3.8);c.clip();
 const g=c.createLinearGradient(x,y-ry,x,y+ry);g.addColorStop(0,'rgba(94,116,91,.07)');g.addColorStop(.7,'rgba(134,155,130,.12)');g.addColorStop(1,'rgba(170,178,143,.025)');c.fillStyle=g;c.fillRect(x-rx,y-ry*1.4,rx*3,ry*3);
 glints(c,x+size*.13,y,rx,ry,reduced?0:phase,.22);if(raining&&!reduced)rings(c,x+size*.13,y,phase,rx*.7,ry*.6,.22);c.restore();
}
return {outline,wash,ground,basin,spring,puddle};
});
