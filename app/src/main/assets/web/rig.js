(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestRig=api;})(globalThis,function(){
'use strict';
const Neolbi=typeof module==='object'?require('./neolbi.js'):globalThis.ForestNeolbi;
const Superbum=typeof module==='object'?require('./superbum.js'):globalThis.ForestSuperbum;
const Species=typeof module==='object'?require('./species-rig.js'):globalThis.ForestSpeciesRig;
const Art=typeof module==='object'?require('./creature-art.js'):globalThis.ForestCreatureArt;
const files=Object.freeze({...Species.files,...Neolbi.files,...Superbum.files,...(Art?.ANT_FILES||{}),rigBody:'assets/forest/rig/body.png',rigLeaves:'assets/forest/rig/leaves.png',rigLegLeft:'assets/forest/rig/leg-left.png',rigLegRight:'assets/forest/rig/leg-right.png',rigPalm:'assets/forest/rig/palm.png',rigFace:'assets/forest/rig/face.png'});
// Species share the intact-body invariant; armless Neolbi uses its dedicated leaf/foot rig.
// Species-specific art may replace these independent layers without replacing the motion renderer.
const definition=Object.freeze({width:1254,height:1254,body:'rigBody',leaves:'rigLeaves',legs:Object.freeze(['rigLegLeft','rigLegRight']),palm:'rigPalm'});
function pose(kind,t,reduced=false,wiggle=0){
 if(reduced)return {left:0,right:0,bob:0,reach:0,stroke:0,swing:0};
 const moving=['walk','slow','hurry','run','duck','step','avoid'].includes(kind),speed=kind==='run'?12:kind==='hurry'?10:kind==='slow'?6:8,wave=moving?Math.sin(t*speed):0;
 const cycle=((t%4)+4)%4,reach=kind==='groom'?(cycle<.8?Math.sin(cycle/.8*Math.PI/2):cycle<2.8?1:cycle<3.6?Math.cos((cycle-2.8)/.8*Math.PI/2):0):0;
 return {left:wave*.32+wiggle*.12,right:-wave*.32-wiggle*.12,bob:-Math.abs(wave)*13,reach,stroke:reach===1?Math.sin(cycle*9)*8:0,swing:wave*.08};
}
function drawCore(c,assets,{kind='idle',phase=0,reduced=false,wiggle=0,bodyAlpha=1,expression,species='ridley',personality,clip,hasProp=false,canopy=0,wind=0,rain=false,deferFront=false,onHood,seed=0,snow=0,restBlend=kind==='rest'?1:0,water=0,side=1,litterUp=0}={}){
 if(species==='superbum')return Superbum.draw(c,assets,{kind,phase,reduced,expression,seed,snow,restBlend,water,side});
 if(species==='neolbi')return Neolbi.draw(c,assets,{kind,phase,reduced,wiggle,expression,canopy,wind,rain,deferFront,onHood,personality,clip,hasProp,snow});
 if(Species.draw(c,assets,{kind,phase,reduced,wiggle,expression,species,snow,litterUp}))return;
 const p=pose(kind,phase,reduced,wiggle);c.save();c.translate(0,p.bob);
 for(const [i,x]of [515,795].entries()){c.save();c.translate(x,930);c.rotate(i?p.right:p.left);c.drawImage(assets[definition.legs[i]],-49,-45,98,202.385);c.restore();}
 c.save();c.globalAlpha*=bodyAlpha;c.drawImage(assets[definition.body],0,0);c.restore();
 if(bodyAlpha===1){
  const e=expression|| (kind==='rest'?'sleepy':kind==='groom'||kind==='drink'?'focused':kind==='held'?'surprised':'neutral');
  const blink=!reduced&&((phase+seed)%4.7)<.16;
  if(e==='neutral'&&!blink&&assets.rigFace)c.drawImage(assets.rigFace,0,0);
  else {c.save();c.strokeStyle='#efe4c7';c.fillStyle='#efe4c7';c.lineWidth=9;c.lineCap='round';
   for(const x of [592,762]){c.beginPath();if(e==='sleepy'||blink){c.moveTo(x-17,793);c.quadraticCurveTo(x,809,x+17,793);}else if(e==='happy'){c.moveTo(x-16,796);c.quadraticCurveTo(x,775,x+16,796);}else if(e==='sad'){c.moveTo(x-15,796);c.lineTo(x+15,803);}else {c.moveTo(x,775);c.lineTo(x,812);}c.stroke();}
   if(e==='surprised'){c.beginPath();c.ellipse(678,849,13,17,0,0,Math.PI*2);c.fill();}else if(e!=='sleepy'){c.beginPath();c.moveTo(664,849);c.lineTo(690,849);c.stroke();}c.restore();}
  c.save();c.translate(640,690);c.rotate(restBlend*.04+(reduced?0:Math.sin(phase*1.4+seed)*.008));c.translate(-640,-690);c.drawImage(assets[definition.leaves],0,restBlend*12);if(snow>0)(typeof module==='object'?require('./world-effects.js'):globalThis.ForestEffects).snow(c,assets[definition.leaves],snow,0,restBlend*12);c.restore();
 }
 const hands=kind==='splash'?[[420,935+Math.sin(phase*7)*16,.2],[930,935-Math.sin(phase*7)*16,-.2]]:kind==='drink'?[[500,870,.2],[930,935,-.2]]:kind==='litter'?litterHands(phase,reduced):null;
 for(const [x,y,angle]of (hands||[[391,906+restBlend*10,['walk','slow','hurry','run','duck','step','avoid'].includes(kind)?p.swing:.2],[968-210*p.reach,898-232*p.reach+p.stroke,-.2-.5*p.reach]])){c.save();c.translate(x,y);c.rotate(angle);c.drawImage(assets[definition.palm],-43,-52,86,104);c.restore();}
 c.restore();
}
// ----- 0.6.33 shared clips: 낙엽 놀이 (scoop and fling leaves over the head) and 머리 정돈 -----------------------------
// All in the 1254-px rig frame with the feet's ground centre at FEET. Heights are each friend's drawn height there.
const FEET=[627,1065.9],H={ridley:1000,bonbon:860,neolbi:1250,bosong:1050,jureong:720,superbum:1700,duri:1000};
const PLAY=3.2,GROOM=4,ease=x=>(x=Math.max(0,Math.min(1,x)),x*x*(3-2*x));
const mod=(t,n)=>((t%n)+n)%n;
// body motion of the leaf-play clip: crouch and scoop, hop while flinging, land and bounce happily
function playBody(t){const u=mod(t,PLAY);if(u<.8){const e=ease(u/.8);return {dy:34*e,sq:1-.07*e};}
 if(u<1.15){const k=(u-.8)/.35;return {dy:34-150*Math.sin(k*Math.PI/2),sq:1+.05};}
 if(u<1.55){const k=(u-1.15)/.4;return {dy:-116*(1-k*k),sq:1+.05*(1-k)};}
 const k=u-1.55;return {dy:-Math.abs(Math.sin(k*5))*16*Math.max(0,1-k/1.2),sq:1};}
// 리들리's hands: down by the feet while scooping, raised beside the body (a little cheer) while flinging, back down
function litterUp(t){const u=mod(t,PLAY);return u<.8?0:u<1.1?ease((u-.8)/.3):u<1.6?1:1-ease((u-1.6)/.5);}
function litterHands(t,reduced){if(reduced)return [[420,960,.2],[860,960,-.2]];const up=litterUp(t);
 return [[420-70*up,960-200*up,.2-.6*up],[860+70*up,960-200*up,-.2+.6*up]];}
// friends groom by shaking their leaves like a wet dog (리들리's hands are too small to reach its head): crouch, a quick shiver that fades, then a satisfied tilt
function shake(t){const u=mod(t,GROOM);if(u<.35)return {rot:0,dx:0,sq:1-.06*ease(u/.35)};if(u<1.35){const k=(u-.35)/1;return {rot:.085*Math.sin(k*2*Math.PI*8)*(1-k),dx:10*Math.sin(k*2*Math.PI*8)*(1-k),sq:.97+.03*k};}
 const k=u-1.35;return {rot:.035*Math.sin(Math.min(1,k/2.4)*Math.PI*2)*(1-Math.min(1,k/2.65)),dx:0,sq:1};}
const LEAF=[['#c99a4c','#8d5a2b'],['#d8b25a','#9a6e2c'],['#b7863f','#7c4e24'],['#cfa55b','#94622e'],['#a97b39','#6d4520']];
function leafShape(c,size,col){c.fillStyle=col[0];c.beginPath();c.moveTo(-size,0);c.quadraticCurveTo(-size*.2,-size*.62,size,0);c.quadraticCurveTo(-size*.2,size*.62,-size,0);c.fill();c.strokeStyle=col[1];c.lineWidth=size*.1;c.beginPath();c.moveTo(-size*.9,0);c.lineTo(size*.95,0);c.stroke();}
// the flung leaves: lie in a little heap by the feet, fly up over the head when flung, then flutter down around the friend
// 0.6.33: the leaves come off the ground. They lie scattered on the ground in front of the friend, are scooped into a
// little heap at its feet while it crouches, flung up over its head as it hops, flutter down and come to rest on the
// ground again, where the next scoop picks them up (no leaf appears from or fades into the air).
function leafToss(c,t,height){const u=mod(t,PLAY),N=5,size=Math.max(62,height*.1);c.save();c.translate(FEET[0],FEET[1]);
 for(let i=0;i<N;i++){const r=(i*37%11)/11,side=(i%2?1:-1),peak=height*(1.08+.28*((i*53%7)/7)),col=LEAF[i%LEAF.length];
  const heap={x:height*.1*(i-2)/2,y:18+6*(i%3)},ground={x:side*height*(.3+.28*r)+(i===2?height*.12:0),y:10+34*((i*29%5)/5)},rest=i*1.3+(i%2?.4:-.4);
  let x,y,rot,lift;
  if(u<.8){const k=ease(u/.8);x=ground.x+(heap.x-ground.x)*k;y=ground.y+(heap.y-ground.y)*k;rot=rest+k*.5;lift=0;}
  else if(u<.95){x=heap.x;y=heap.y;rot=rest+.5;lift=0;}
  else{const τ=u-.95;if(τ<.45){const k=τ/.45,e=1-(1-k)*(1-k);x=heap.x+(ground.x-heap.x)*.45*k;y=heap.y-peak*e;rot=rest+.5+k*6*side;lift=Math.min(1,k*3);}
   else{const k=Math.min(1,(τ-.45)/1.55),sw=Math.sin((τ-.45)*5+i)*height*.08*(1-k);x=heap.x+(ground.x-heap.x)*(.45+.55*k)+sw;y=heap.y-peak*(1-k)+(ground.y-heap.y)*k;rot=k<1?rest+Math.sin((τ-.45)*6+i)*1.1*(1-k):rest;lift=Math.min(1,(1-k)*4);}}
  c.save();c.translate(x,y);c.scale(1,.7+.3*lift);c.rotate(rot);leafShape(c,size,col);c.restore();}
 c.restore();}
// specks shaken off while grooming
function specks(c,t,height){const u=mod(t,GROOM);if(u<.4||u>1.6)return;const k=(u-.4)/1.2;c.save();c.translate(FEET[0],FEET[1]-height*.6);c.fillStyle='rgba(150,124,92,'+(.55*(1-k))+')';
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.4,r=height*(.32+.35*k);c.beginPath();c.arc(Math.cos(a)*r,Math.sin(a)*r*.6+height*.25*k*k,height*.012,0,7);c.fill();}c.restore();}
// 0.6.34: friends with arms (리들리·베이치) keep their hand-on-head grooming; 엘레판·슈퍼범 their own leaf moves
const OWN_GROOM=['neolbi','superbum','ridley','bosong'];
function draw(c,assets,opt={}){const kind=opt.kind||'idle',sp=opt.species||'ridley',t=opt.phase||0,h=H[sp]||1000;
 if(kind==='litter'){
  if(opt.reduced){drawCore(c,assets,{...opt,kind:['ridley','bosong'].includes(sp)?'litter':'idle'});leafToss(c,0,h);return;}
  const b=playBody(t);c.save();c.translate(FEET[0],FEET[1]);c.scale(1/Math.sqrt(b.sq),b.sq);c.translate(0,b.dy);c.translate(-FEET[0],-FEET[1]);
  drawCore(c,assets,{...opt,kind:['ridley','superbum','bosong'].includes(sp)?'litter':'idle',litterUp:litterUp(t),expression:opt.expression==='focused'?'happy':opt.expression});c.restore();leafToss(c,t,h);return;}
 if(kind==='groom'&&!OWN_GROOM.includes(sp)&&!opt.reduced){const m=shake(t);c.save();c.translate(FEET[0]+m.dx,FEET[1]);c.rotate(m.rot);c.scale(1/Math.sqrt(m.sq),m.sq);c.translate(-FEET[0],-FEET[1]);
  drawCore(c,assets,{...opt,kind:'idle'});c.restore();specks(c,t,h);return;}
 return drawCore(c,assets,opt);}
return Object.freeze({files,definition,pose,draw,PLAY,GROOM});
});
