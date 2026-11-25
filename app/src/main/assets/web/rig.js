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
function drawCore(c,assets,{kind='idle',phase=0,reduced=false,wiggle=0,bodyAlpha=1,expression,species='ridley',personality,clip,hasProp=false,canopy=0,wind=0,rain=false,deferFront=false,onHood,seed=0,snow=0,restBlend=kind==='rest'?1:0,water=0,side=1,litterUp=0,huddle=0,sit=0,droop=0,leafTilt=0,bodyCover,crownSprout}={}){
 const origin=bodyCover&&c.getTransform();
 const cover=bodyCover&&(()=>{
  c.save();c.setTransform(origin);bodyCover(c);c.restore();
 });
 if(species==='superbum')return Superbum.draw(c,assets,{kind,phase,reduced,expression,seed,snow,restBlend,water,side,huddle,sit,droop,cover,crownSprout});
 if(species==='neolbi')return Neolbi.draw(c,assets,{kind,phase,reduced,wiggle,expression,canopy,wind,rain,deferFront,onHood,personality,clip,hasProp,snow,sit,droop,cover});
 if(Species.draw(c,assets,{kind,phase,reduced,wiggle,expression,species,snow,litterUp,sit,droop,cover,crownSprout}))return;
 const p=pose(kind,phase,reduced,wiggle);c.save();c.translate(0,p.bob);
 for(const [i,x]of [515,795].entries()){c.save();c.translate(x,930);c.rotate(i?p.right:p.left);c.drawImage(assets[definition.legs[i]],-49,-45,98,202.385);c.restore();}
 // 0.8.7 sit (stroll rest): the legs stay on the ground, everything above settles over them like 엘리시
 c.translate(0,sit*70+droop*30);
 c.save();c.globalAlpha*=bodyAlpha;c.drawImage(assets[definition.body],0,0);c.restore();
 const paintHands=()=>{
 const hands=kind==='splash'?[[420,935+Math.sin(phase*7)*16,.2],[930,935-Math.sin(phase*7)*16,-.2]]:kind==='drink'?[[500,870,.2],[930,935,-.2]]:kind==='litter'?litterHands(phase,reduced):kind==='brush'?brushHands(phase,reduced):null;
 for(const [x,y,angle]of (hands||[[391,906+restBlend*10+droop*34,['walk','slow','hurry','run','duck','step','avoid'].includes(kind)?p.swing:.2],[968-210*p.reach,898-232*p.reach+p.stroke+droop*34,-.2-.5*p.reach]])){c.save();c.translate(x,y);c.rotate(angle);c.drawImage(assets[definition.palm],-43,-52,86,104);c.restore();}
 };
 if(cover)paintHands();
 if(bodyAlpha===1){
  const e=expression|| (kind==='rest'?'sleepy':kind==='groom'||kind==='drink'?'focused':kind==='held'?'surprised':'neutral');
  const blink=!reduced&&((phase+seed)%4.7)<.16;
  if(e==='neutral'&&!blink&&assets.rigFace)c.drawImage(assets.rigFace,0,0);
  else {c.save();c.strokeStyle='#efe4c7';c.fillStyle='#efe4c7';c.lineWidth=9;c.lineCap='round';
   for(const x of [592,762]){c.beginPath();if(e==='sleepy'||blink){c.moveTo(x-17,793);c.quadraticCurveTo(x,809,x+17,793);}else if(e==='happy'){c.moveTo(x-16,796);c.quadraticCurveTo(x,775,x+16,796);}else if(e==='sad'){c.moveTo(x-15,796);c.lineTo(x+15,803);}else {c.moveTo(x,775);c.lineTo(x,812);}c.stroke();}
   if(e==='surprised'){c.beginPath();c.ellipse(678,849,13,17,0,0,Math.PI*2);c.fill();}else if(e!=='sleepy'){c.beginPath();c.moveTo(664,849);c.lineTo(690,849);c.stroke();}c.restore();}
  cover?.();
  c.save();c.translate(640,690);c.rotate(leafTilt+restBlend*.04+droop*.07+(reduced?0:Math.sin(phase*1.4+seed)*.008));c.scale(1+droop*.05,1-droop*.06);c.translate(-640,-690);c.drawImage(assets[definition.leaves],0,restBlend*12+droop*34);if(snow>0)(typeof module==='object'?require('./world-effects.js'):globalThis.ForestEffects).snow(c,assets[definition.leaves],snow,0,restBlend*12);c.restore();
 }
 if(!cover)paintHands();
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
// 1.2.7 리들리 잎 털어 주기 (user: "공중에서 손 두기 왔다 갔다 거리는 거 짜침" → 시안 E "머리 잎 끝으로 톡톡"): the hands stay by the body; 리들리 leans
// toward the friend and taps its leaves three times with the curled, hand-like tip of its front leaf, then rests (1.6 s). Each tap knocks a mite off.
const TAP=1.6;function brushHands(){return [[400,920,.25],[930,925,-.1]];}
function tapAmount(t,reduced){if(reduced)return 0;const u=mod(t,TAP);return u<.9?Math.max(0,Math.sin(u/.3*Math.PI)):0;}
// where the curled leaf tip (leaves.png about (965,445)) is when the leaves tilt by lr around (640,690)
function leafTip(lr){const x=325,y=-245,c=Math.cos(lr),s=Math.sin(lr);return [640+x*c-y*s,690+x*s+y*c];}
function tapFx(c,t,reduced){if(reduced)return;const u=mod(t,TAP);if(u>=.9)return;const k=(u%.3)/.3,tap=tapAmount(t,false),p=leafTip(.14+.1*tap);
 if(tap>.8){c.save();c.strokeStyle='rgba(224,178,79,.9)';c.lineWidth=7;c.lineCap='round';for(let i=0;i<4;i++){const a=-1.5+i*.55;c.beginPath();c.moveTo(p[0]+Math.cos(a)*50,p[1]+Math.sin(a)*50);c.lineTo(p[0]+Math.cos(a)*85,p[1]+Math.sin(a)*85);c.stroke();}c.restore();}
 if(k>.45){const q=(k-.45)/.55,x=p[0]+40+q*150,y=p[1]-70*Math.sin(q*Math.PI)+q*90;c.save();c.globalAlpha=1-q;c.fillStyle='#fff6e2';c.beginPath();c.arc(x,y,15,0,Math.PI*2);c.fill();c.fillStyle='#8a5a2c';c.beginPath();c.ellipse(x,y,9,7,q*4,0,Math.PI*2);c.fill();c.restore();}}
// shiver (0.6.34: the common motion of a friend with spider mites on its leaves; 0.6.33 used it for grooming): crouch, a quick shiver that fades, then a satisfied tilt
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
// ----- 1.0.3 광합성 (photo) and 볕 쬐기 (bask), render only ---------------------------------------------------------------
// 광합성: standing in good light, the friend stretches a little taller toward the sun (top left, like the world light),
// breathes slowly with its eyes closed happily, and small light motes drift up off its leaves.
// 볕 쬐기 (on the sun rock): it sits low and spreads out, eyes sleepily closed, breathing deep and slow, wrapped in a warm
// glow with a faint heat shimmer rising (only on a cold day: the rock warming it). 슈퍼 광합성 on the rock (opt.photo)
// draws the light motes 1.8x bigger than on the ground, in either pose (user).
const PHOTO=5,BASK=6;
function motes(c,t,height,reduced,big=1){c.save();c.translate(FEET[0],FEET[1]);
 const beam=c.createLinearGradient(-height*.9,-height*1.9,height*.2,-height*.2);beam.addColorStop(0,'rgba(255,246,200,0)');beam.addColorStop(.55,'rgba(255,246,200,.30)');beam.addColorStop(1,'rgba(255,246,200,0)');c.fillStyle=beam;c.beginPath();c.moveTo(-height*1.1,-height*2);c.lineTo(-height*.35,-height*2);c.lineTo(height*.62,-height*.05);c.lineTo(-height*.62,-height*.05);c.closePath();c.fill();
 for(let i=0;i<9;i++){const u=reduced?.3+i*.07:mod(t*.45+i/9,1),x=height*(-.4+.8*((i*37%11)/11))+Math.sin(t*1.3+i)*height*.03,y=-height*(.5+.8*u),a=Math.sin(u*Math.PI),r=height*(.024+.012*(i%3))*big;
  const g=c.createRadialGradient(x,y,0,x,y,r*3);g.addColorStop(0,'rgba(255,252,214,'+a+')');g.addColorStop(.3,'rgba(236,240,150,'+a*.7+')');g.addColorStop(1,'rgba(228,236,150,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r*3,0,7);c.fill();}
 c.restore();}
function warmth(c,t,height,reduced,over){c.save();c.translate(FEET[0],FEET[1]);
 if(!over){const g=c.createRadialGradient(0,-height*.25,height*.1,0,-height*.25,height*.85);g.addColorStop(0,'rgba(255,180,96,.45)');g.addColorStop(1,'rgba(255,190,110,0)');c.fillStyle=g;c.beginPath();c.ellipse(0,-height*.25,height*.85,height*.62,0,0,7);c.fill();c.restore();return;}
 c.strokeStyle='rgba(236,170,96,.75)';c.lineWidth=height*.014;c.lineCap='round';
 for(let i=0;i<3;i++){const u=reduced?.5:mod(t*.35+i/3,1),x0=height*(-.22+.22*i),y0=-height*(.78+.4*u);c.globalAlpha=Math.sin(u*Math.PI);c.beginPath();
  for(let k=0;k<=8;k++){const yy=y0-k*height*.035,xx=x0+Math.sin(k*1.1+t*3+i)*height*.025;k?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.stroke();}
 c.restore();}
function photoBody(t,reduced){if(reduced)return {sy:1.05,rot:-.06};const b=Math.sin(mod(t,PHOTO)/PHOTO*Math.PI*2);return {sy:1.05+.02*b,rot:-.06-.012*b};}
function baskBody(t,reduced){if(reduced)return {sx:1.08,sy:.93};const b=Math.sin(mod(t,BASK)/BASK*Math.PI*2);return {sx:1.08+.015*b,sy:.93+.02*b};}
// ----- 1.1.5 기운 높음·낮음 (opt.vigor: 'high' 80% 이상 · 'low' 40% 아래 · 'faint' 15% 아래), render only -------------
// high: bouncy steps and a little hop in place every 3 s, happy eyes, three sparkles drifting up.
// low: the friend's own leaves/hood/arms sag (rig option droop), sad eyes, grey gloom lines over the head; standing, it
// breathes in (straightens a little) and sighs out every 4 s with a curl of breath. faint: sags most, sways, a sweat drop.
const VIGOR_KINDS=['idle','walk','slow','hurry'],SIGH=4;
// per species (fractions of the drawn height): gloom/sparkle base over the head, and the mouth the sigh leaves from
const VTOP={ridley:.82,bonbon:1.12,neolbi:1.08,bosong:.86,jureong:1.22,superbum:.84,duri:.82},VMOUTH={ridley:[.28,.38],bonbon:[.3,.42],neolbi:[.32,.32],bosong:[.16,.34],jureong:[.36,.26],superbum:[.24,.3],duri:[.28,.38]};
function sparkle(c,x,y,r,a){c.save();c.globalAlpha=a;c.fillStyle='#ffe9a0';c.strokeStyle='rgba(214,170,70,.8)';c.lineWidth=r*.15;c.beginPath();for(let i=0;i<8;i++){const q=i*Math.PI/4,rr=i%2?r*.35:r;c.lineTo(x+Math.cos(q)*rr,y+Math.sin(q)*rr);}c.closePath();c.fill();c.stroke();c.restore();}
function gloom(c,x,y,h,a,t,reduced){c.save();c.globalAlpha=a;c.strokeStyle='rgba(70,70,90,.55)';c.lineWidth=h*.012;c.lineCap='round';
 for(let i=0;i<3;i++){const x0=x+h*(-.12+.12*i);c.beginPath();for(let k=0;k<=6;k++){const yy=y-k*h*.022,xx=x0+Math.sin(k*1.4+(reduced?0:t*1.5)+i)*h*.012;k?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.stroke();}c.restore();}
function sigh(c,x,y,h,a,k){c.save();c.globalAlpha=a;c.lineCap='round';c.translate(x,y);c.scale(k,k);
 for(const [w,col] of [[h*.05,'rgba(255,255,255,.9)'],[h*.018,'rgba(150,160,170,.55)']]){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(0,0);c.bezierCurveTo(h*.12,-h*.02,h*.2,h*.06,h*.17,h*.12);c.bezierCurveTo(h*.15,h*.17,h*.09,h*.15,h*.11,h*.11);c.stroke();}c.restore();}
function sweat(c,x,y,r){c.save();c.fillStyle='rgba(170,210,235,.95)';c.strokeStyle='rgba(80,120,150,.7)';c.lineWidth=r*.15;c.beginPath();c.moveTo(x,y-r*1.6);c.quadraticCurveTo(x+r,y-r*.2,x,y+r*.6);c.quadraticCurveTo(x-r,y-r*.2,x,y-r*1.6);c.fill();c.stroke();c.restore();}
function vigor(c,assets,opt,kind,sp,t,h){const v=opt.vigor,red=opt.reduced,walk=kind!=='idle',top=FEET[1]-h*(VTOP[sp]||.82),mouth=VMOUTH[sp]||[.28,.38];
 let dy=0,sq=1,rot=0,dx=0,droop=0,expr=opt.expression,u=mod(t+(opt.seed||0)*1.3,SIGH)/SIGH,br=0;
 if(v==='high'){if(!expr||expr==='neutral')expr='happy';if(!red){if(walk){const b=Math.abs(Math.sin(t*Math.PI*2.4));dy=-b*h*.1;sq=b<.15?.94:1.03;}else{const q=mod(t+(opt.seed||0),3);if(q<.7){const b=Math.sin(q/.7*Math.PI);dy=-b*h*.1;sq=1+.04*b;}}}}
 else{if(!expr||['neutral','happy'].includes(expr))expr='sad';
  if(v==='low'){br=walk||red?0:u<.45?Math.sin(u/.45*Math.PI/2):Math.cos((u-.45)/.55*Math.PI/2);droop=walk?.75:.85-.3*br;}
  else {droop=1;if(!red){const w=Math.sin(t*1.4);rot=w*.06;dx=w*h*.035;}}}
 c.save();c.translate(FEET[0]+dx,FEET[1]);c.rotate(rot);c.scale(1/Math.sqrt(sq),sq);c.translate(0,dy);c.translate(-FEET[0],-FEET[1]);
 draw(c,assets,{...opt,vigorDone:true,droop,expression:expr});c.restore();
 if(v==='high'){if(!red)for(let i=0;i<3;i++){const q=mod(t*.8+i/3,1);sparkle(c,FEET[0]+h*(-.35+.35*i),top-h*.1-q*h*.25+dy,h*.05,Math.sin(q*Math.PI));}return;}
 const gt=top+h*(v==='faint'?.06:.04);gloom(c,FEET[0]-h*.05+dx,gt-h*.02,h,v==='faint'?.85:.6,t,red);
 if(v==='low'&&!walk&&!red&&u>.45&&u<.9){const q=(u-.45)/.45;sigh(c,FEET[0]+h*mouth[0],FEET[1]-h*mouth[1]-q*h*.05,h,Math.sin(q*Math.PI),.8+.5*q);}
 if(v==='faint')sweat(c,FEET[0]+h*mouth[0]+dx,gt+h*.2,h*.06);}
// 0.6.34: friends with arms (리들리·베이치) keep their hand-on-head grooming; 엘레판·슈퍼범 their own leaf moves
const ITCH=7,NO_ITCH=['held','rest','sleep','nightrest','moss','land','bask'];
const OWN_GROOM=['neolbi','superbum','ridley','bosong','bonbon','jureong'];
function draw(c,assets,opt={}){const kind=opt.kind||'idle',sp=opt.species||'ridley',t=opt.phase||0,h=H[sp]||1000;
 if(opt.vigor&&!opt.vigorDone&&VIGOR_KINDS.includes(kind))return vigor(c,assets,opt,kind,sp,t,h);
 if(kind==='litter'){
  if(opt.reduced){drawCore(c,assets,{...opt,kind:['ridley','bosong'].includes(sp)?'litter':'idle'});leafToss(c,0,h);return;}
  const b=playBody(t);c.save();c.translate(FEET[0],FEET[1]);c.scale(1/Math.sqrt(b.sq),b.sq);c.translate(0,b.dy);c.translate(-FEET[0],-FEET[1]);
  drawCore(c,assets,{...opt,kind:['ridley','superbum','bosong'].includes(sp)?'litter':'idle',litterUp:litterUp(t),expression:opt.expression==='focused'?'happy':opt.expression});c.restore();leafToss(c,t,h);return;}
 // SRS v2.36 코로나 긁어모으기: the body sweeps side to side over the feet (its long leaves sweep the ground)
 if(kind==='rake'){const u=opt.reduced?0:Math.sin(t*4.2);c.save();c.translate(FEET[0],FEET[1]);c.rotate(.09*u);c.translate(-FEET[0]+u*24,-FEET[1]);drawCore(c,assets,{...opt,kind:'idle',expression:opt.expression||'focused'});c.restore();return;}
 if(kind==='photo'){const b=photoBody(t,opt.reduced);c.save();c.translate(FEET[0],FEET[1]);c.rotate(b.rot);c.scale(1/Math.sqrt(b.sy),b.sy);c.translate(-FEET[0],-FEET[1]);
  drawCore(c,assets,{...opt,kind:'idle',expression:opt.expression||'happy'});c.restore();motes(c,t,h,opt.reduced,opt.photo?1.8:1);return;}
 if(kind==='bask'){const b=baskBody(t,opt.reduced);warmth(c,t,h,opt.reduced,false);c.save();c.translate(FEET[0],FEET[1]);c.scale(b.sx,b.sy);c.translate(-FEET[0],-FEET[1]);
  drawCore(c,assets,{...opt,kind:'idle',sit:.5,expression:opt.expression||'sleepy'});c.restore();warmth(c,t,h,opt.reduced,true);if(opt.photo)motes(c,t,h,opt.reduced,1.8);return;}
 if(kind==='groom'&&!OWN_GROOM.includes(sp)&&!opt.reduced){const m=shake(t);c.save();c.translate(FEET[0]+m.dx,FEET[1]);c.rotate(m.rot);c.scale(1/Math.sqrt(m.sq),m.sq);c.translate(-FEET[0],-FEET[1]);
  drawCore(c,assets,{...opt,kind:'idle'});c.restore();specks(c,t,h);return;}
 // 0.6.34: a friend whose leaves carry spider mites (the leaf-damaging pest) shivers now and then, every species alike:
 // every ITCH seconds a short crouch-and-shiver plays over whatever it is doing (not while held, resting or asleep).
 if(kind==='brush'&&sp==='ridley'){const tap=tapAmount(t,opt.reduced);c.save();c.translate(FEET[0],FEET[1]);c.rotate(.07);c.translate(-FEET[0],-FEET[1]);drawCore(c,assets,{...opt,kind:'brush',leafTilt:.14+.1*tap,expression:opt.expression||'focused'});tapFx(c,t,opt.reduced);c.restore();return;}
 if(opt.itch&&!opt.reduced&&!NO_ITCH.includes(kind)){const u=mod(t+(opt.seed||0)*1.7,ITCH);if(u<1.35){const m=shake(u);c.save();c.translate(FEET[0]+m.dx,FEET[1]);c.rotate(m.rot);c.scale(1/Math.sqrt(m.sq),m.sq);c.translate(-FEET[0],-FEET[1]);drawCore(c,assets,opt);c.restore();specks(c,u,h);return;}}
 // 0.6.34: while 베이치 scratches the back of its head (hand hidden behind it, fingertips at the crown) it leans its head into the hand
 if(kind==='groom'&&sp==='bosong'&&!opt.reduced){const u=mod(t,8),q=ease(u/.9)*(1-ease((u-6.7)/1.3));c.save();c.translate(FEET[0],FEET[1]);c.rotate(.07*q);c.translate(-FEET[0],-FEET[1]);drawCore(c,assets,opt);c.restore();return;}
 return drawCore(c,assets,opt);}
return Object.freeze({files,definition,pose,draw,PLAY,GROOM,ITCH,PHOTO,BASK});
});
