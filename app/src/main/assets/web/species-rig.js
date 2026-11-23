(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestSpeciesRig=api;})(globalThis,function(){
'use strict';
let A={},armBuffer;const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>(x=clamp(x))*x*(3-2*x),lerp=(a,b,t)=>a+(b-a)*t;
const createCanvas=(w,h)=>{const c=typeof document!=='undefined'?document.createElement('canvas'):require('@napi-rs/canvas').createCanvas(w,h);c.width=w;c.height=h;return c;};
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
const cfg={duri:{w:.92,h:.98,leaf:[-14.3,-37.2,28.6,27.6],tempo:1.12,amp:1.2}};
let mesh={};
function initMesh(){if(!mesh.duri)mesh.duri=new (typeof Path2D!=='undefined'?Path2D:require('@napi-rs/canvas').Path2D)('M464 784 C464 730 456 700 438 687 C424 722 390 751 379 727 C370 705 400 679 410 666 C363 699 321 693 312 671 C304 651 328 637 370 621 C301 648 244 647 235 621 C228 592 284 567 359 558 C289 570 245 601 223 579 C202 554 261 518 331 499 C388 482 449 501 478 536 C491 552 509 570 518 584 C506 546 471 506 446 484 C406 464 394 431 413 415 C430 403 455 421 481 446 C450 407 457 367 477 364 C507 357 526 412 546 455 C563 489 568 518 571 540 C615 510 649 480 672 445 C697 406 699 377 678 350 C626 337 567 322 514 311 C452 297 407 284 414 261 C418 237 462 232 502 244 C552 262 589 281 614 297 C581 265 548 228 568 209 C590 185 628 220 652 243 C630 206 615 167 640 152 C674 135 706 169 722 206 C744 250 756 306 759 350 C771 306 777 254 792 212 C810 170 836 128 867 121 C909 114 915 144 899 173 C880 206 857 227 849 249 C888 217 929 194 958 207 C994 224 974 255 951 269 C1013 246 1064 252 1080 280 C1092 311 1045 331 996 348 C925 374 858 396 828 416 C812 433 800 462 799 494 C821 463 848 428 877 417 C907 405 921 425 903 448 C924 424 954 397 975 407 C998 423 980 454 962 478 C1008 459 1069 464 1083 488 C1094 517 1047 533 995 538 C953 541 921 555 907 575 C956 554 1022 555 1045 580 C1066 604 1037 624 999 623 C1053 636 1070 664 1052 682 C1036 700 1008 688 979 673 C1005 709 998 733 980 734 C953 738 945 704 934 681 C914 650 884 625 859 608 C817 579 790 554 767 533 C737 558 708 576 673 598 C590 648 516 721 464 784 Z');}
const data={
bonbon:{file:'exec-943eda32-df30-471b-a1df-31dea1a2b879.png',body:[60,140,520,492],leaf:[650,40,580,660],arms:[[98,840,209,350],[326,840,195,350]],legs:[[725,911,170,230],[957,910,172,231]],w:17,h:16.1,fol:[-13,-33,22,25.1],tempo:.72,eyes:[[.67,.37],[.83,.29]]},
neolbi:{file:'exec-61298b59-50e2-4855-8d96-66ee5a637739.png',body:[65,185,529,350],leaf:[619,150,615,338],legs:[[750,893,132,90],[985,893,133,91]],w:32,h:21.2,fol:[-23,-32,46,25.3],tempo:.62,eyes:[[.49,.47],[.68,.47]]},
bosong:{file:'exec-fca40df4-cab5-4d71-9958-52906ecf61a3.png',body:[173,65,330,563],leaf:[770,29,342,617],arms:[[131,835,156,351],[346,835,154,351]],legs:[[748,895,145,269],[952,895,147,269]],w:14,h:23.9,fol:[-9.2,-40.3,20,30.6],tempo:.8,eyes:[[.44,.37],[.74,.37]]},
jureong:{file:'exec-934c2ffe-237d-42c0-9c88-f18cd5ea9a42.png',body:[52,246,541,258],leaf:[626,169,615,367],legs:[[752,906,150,104],[963,904,149,105]],w:38,h:18.1,fol:[-27,-33,54,32.2],tempo:.93,eyes:[[.34,.53],[.57,.53]]}
};
function crown(c,k,t,pose={}){const d=cfg[k],b=d.leaf;const rest=pose.rest||0,ang=pose.leafAngle||0;
 c.save();c.translate(0,-23*d.h*.82);c.rotate(ang+Math.sin(t*d.tempo*1.5-.5)*.012*d.amp+rest*.035);c.scale(pose.spread||1,1-rest*.05);c.translate(0,23*d.h*.82);
 if(k==='ridley')c.drawImage(A.leaves,238,170,793,776,...b);else{const crop=A[k+'Bounds'];c.save();c.translate(b[0],b[1]);c.scale(b[2]/crop[2],b[3]/crop[3]);c.translate(-crop[0],-crop[1]);if(mesh[k])c.clip(mesh[k]);c.drawImage(A[k],0,0);if(A.snow>0)(typeof module==='object'?require('./world-effects.js'):globalThis.ForestEffects).snow(c,A[k],A.snow,0,0);c.restore();}c.restore();}
function limb(c,root,hand,width){const dx=hand.x-root.x,dy=hand.y-root.y,l=Math.hypot(dx,dy);c.save();c.translate(root.x,root.y);c.rotate(Math.atan2(dy,dx)-Math.PI/2);c.drawImage(A.palm,-width/2,-width*.8,width,l+width*1.4);c.restore();}
function duriActor(c,k,x,y,t,pose={}){
 const d=cfg[k],g=pose.growth??.65,bw=22.736*d.w,bh=23.04*d.h,mode=pose.mode||'idle',p=t*d.tempo,walk=['walk','run','slow','evacuate'].includes(mode),beat=Math.sin(p*(mode==='run'?13:mode==='slow'?5:8)),rest=pose.rest??(['rest','sleep','moss'].includes(mode)?1:0);
 const held=mode==='held',bob=walk?-Math.abs(beat)*.52:Math.sin(p*1.6)*.10;const lift=pose.lift??(held?5:0);let tilt=pose.tilt||0;
 if(mode==='look')tilt+=Math.sin(p*1.3)*.08*d.amp;if(mode==='groom')tilt+=Math.sin(p)*.025;if(mode==='thirsty')tilt+=.065;if(held)tilt+=Math.sin(t*8)*.035;
 
 c.save();c.translate(x,y);c.scale(g*(pose.facing||1),g);c.translate(0,bob-lift+rest*.9);c.rotate(tilt);const hands=[];
 for(let i=0;i<2;i++){const side=i?1:-1,root={x:side*bw*.32,y:-bh*.38};let hand={x:side*bw*.46,y:-bh*.24};
  if(walk)hand.y+=side*beat*.7;if(held){hand.x+=side*1;hand.y-=1.2+Math.sin(t*9+i)*.7;}
  if(mode==='groom'&&i===1){let reach=Math.sin(Math.min(1,(t%8)/1.0)*Math.PI/2)*(1-ease(((t%8)-6.8)/1.2));hand={x:bw*.17+Math.sin(t*7)*.3,y:lerp(-bh*.24,-bh*.88,reach)};}
  if(mode==='splash'){hand={x:side*bw*.40,y:-bh*.18+Math.sin(t*7+i*Math.PI)*1.1};}
  if(mode==='drink'&&i===0){hand={x:-bw*.05,y:-bh*.36};}
  if(['carry','pass','wave'].includes(mode)&&i===(pose.handSide??1)){hand={x:side*bw*.43,y:-bh*(mode==='wave'?.7:.55)+Math.sin(t*4)*.35};}
  if(pose.hands?.[i])hand={...pose.hands[i]};limb(c,root,hand,Math.min(2.6,bw*.13));hands.push(hand);
 }
 for(let i=0;i<2;i++){const side=i?1:-1;c.save();c.translate(side*bw*.24,-4.0-(i?pose.footTest||0:0));c.rotate(walk?side*beat*.33:held?side*Math.sin(t*9)*.3:0);c.drawImage(A[i?'leg-right':'leg-left'],-1.85,-2.4,3.7,7.0);c.restore();}
 // Body is a complete, immutable layer. No limb-shaped holes or body cutout masks.
 c.drawImage(A.body,358,438,594,602,-bw/2,-bh-1.2,bw,bh);
 let expr=pose.expr||(['sleep','rest','moss'].includes(mode)?'sleepy':mode==='held'?'surprised':mode==='splash'?'happy':mode==='thirsty'?'sad':'neutral');
 const fy=-bh*.43-1,fx=pose.lookX||0,eyeGap=Math.min(3.25,bw*.18),blink=(t%4.7)<.13;
 c.lineWidth=.32;c.lineCap='round';c.strokeStyle='#f2e6c7';c.fillStyle='#f2e6c7';
 for(const side of [-1,1]){const xx=fx+side*eyeGap;c.beginPath();if(expr==='sleepy'||blink){c.moveTo(xx-.57,fy);c.quadraticCurveTo(xx,fy+.6,xx+.57,fy);}else if(expr==='happy'){c.moveTo(xx-.6,fy);c.quadraticCurveTo(xx,fy-.85,xx+.6,fy);}else if(expr==='sad'){c.moveTo(xx-.5,fy+.1);c.lineTo(xx+.5,fy+.35);}else{c.moveTo(xx,fy-.65);c.lineTo(xx,fy+.55);}c.stroke();}
 if(expr==='surprised')ellipse(c,fx,fy+2.15,.48,.66,'#f2e6c7');else if(expr!=='sleepy'){c.beginPath();c.moveTo(fx-.45,fy+2.1);c.lineTo(fx+.45,fy+2.1);c.stroke();}
 crown(c,k,t,{...pose,rest});
 for(let i=0;i<2;i++){const h=hands[i];c.drawImage(A.palm,h.x-1.35,h.y-1.6,2.7,3.2);}
 if(pose.leafHeld){const h=hands[pose.handSide??1];leaf(c,0,h.x,h.y-1,1.05,Math.sin(t*4)*.3,0,false);}
 if(mode==='drink')ellipse(c,hands[0].x,hands[0].y-.9,.5,.7,'#a8ccd1');
 c.restore();return {hands:hands.map(h=>({x:x+h.x*g,y:y+(h.y+bob-lift+rest*.9)*g})),face:{x:x,y:y+(fy+bob-lift)*g},width:bw*g,height:bh*g};
}
function img(c,d,r,x,y,w,h){c.drawImage(d.im,...r,x,y,w,h);if(r===d.leaf&&d.snow>0){const E=typeof module==='object'?require('./world-effects.js'):globalThis.ForestEffects;if(!d.snowLeaf){d.snowLeaf=createCanvas(r[2],r[3]);d.snowLeaf.getContext('2d').drawImage(d.im,...r,0,0,r[2],r[3]);}E.snow(c,d.snowLeaf,d.snow,x,y,w,h);}}
function hatLayer(c,d,t,p,inside){const held=p.mode==='held',amp=held?.055:.012,phase=0,angle=(p.leafAngle||0)+Math.sin(t*5+phase)*amp;c.save();c.translate(0,-d.h*.83);c.rotate(angle);c.translate(0,d.h*.83);if(inside)c.drawImage(d.hat,243,876,865,338,-14,-22.5,29,12);else c.drawImage(d.hat,85,40,1090,645,-23,-35.5,46,27.2);c.restore();}
function leafLayer(c,d,t,p){const dr=p.droop||0;if(dr&&p.mode!=='groom'){const J=d===data.jureong;c.save();c.translate(0,-d.h*.78);c.rotate(dr*(J?0:.1));c.scale(1+dr*(J?.12:.05),1-dr*(J?.1:.15));c.translate(0,d.h*.78+dr*(J?.8:.9));leafLayer(c,d,t,{...p,droop:0});c.restore();return;}if(d===data.bosong){img(c,d,d.leaf,...d.fol);return;}if(d.hat){hatLayer(c,d,t,p,false);return;}
 // 0.6.34: 코로나 grooms by nodding its many drooping fronds: the leaf is drawn in vertical strips, the outer ends bob quickly,
 // left and right side in turn, while the crown over the head stays put.
 if(d===data.jureong&&p.mode==='groom'&&!p.reduced){const f=d.fol,r=d.leaf,N=72,w=f[2]/N,sw=r[2]/N,env=Math.min(1,(t%6)/.4)*Math.min(1,Math.max(0,(5.6-t%6)/.4));
  for(let i=0;i<N;i++){const u=(i+.5)/N*2-1,side=u<0?0:Math.PI,k=Math.pow(Math.abs(u),1.6),dy=env*k*3.4*Math.max(0,Math.sin(t*10+side)),rot=0;
   c.save();c.translate(f[0]+i*w+w/2,f[1]);c.rotate(rot);c.drawImage(d.im,r[0]+i*sw,r[1],Math.min(sw*1.25,r[2]-i*sw),r[3],-w/2,dy,w*Math.min(1.25,(r[2]-i*sw)/sw),f[3]);c.restore();}
  return;}
 const f=d.fol,held=p.mode==='held',safe=d===data.bosong?.018:.045,ang=(p.leafAngle||0)+Math.sin(t*(held?5:d.tempo*1.5))*(held?safe:.012);c.save();c.translate(0,-d.h*.78);c.rotate(ang);c.translate(0,d.h*.78);img(c,d,d.leaf,...f);c.restore();}
// Ellisii (legacy key 'bonbon') is drawn from layers cut out of the user-approved target art (01_APPROVED_Ellisii_TARGET):
// back fertile fronds (gentle sway) + one body layer (body, draped nest leaf, eyes, tiny feet). No arms, as in the target.
const ELLI={rect:[-10.23,-33,24.63,33],frondRect:[-10.23,-34.574,26.202,34.574],pivot:{x:3.33,y:-21.35},leafPivot:{x:3.59,y:-21.35},feet:[{x:-4.28},{x:3.49}],eyes:[[3.84,-13.54],[6.61,-14.9]],eyeR:[1.15,1.8],patch:[238,450,50,70]};
function ellisiiActor(c,x,y,t,p){const d=data.bonbon,g=p.growth??.65,m=p.mode||'idle',walk=['walk','run','slow'].includes(m),run=m==='run',step=t*d.tempo*(run?12:8),beat=Math.sin(step),rest=Math.max(p.rest??(['sleep','rest','moss'].includes(m)?1:0),(p.droop||0)*.8),bob=walk?-Math.abs(beat)*.5:m==='held'?Math.sin(t*7)*.22:Math.sin(t*1.4)*.09,r=ELLI.rect,still=p.reduced;
 // Snow settles on the exposed upper edges of the fronds and the nest leaf (same mask as other species' leaves).
 const layer=n=>A['ellisii'+n],draw=(im,snowy,rr=r)=>{if(!im)return;c.drawImage(im,...rr);if(snowy&&A.snow>0){const E=typeof module==='object'?require('./world-effects.js'):globalThis.ForestEffects;E.snow(c,im,A.snow,...rr);}};
 c.save();c.translate(x,y);c.scale(g,g);c.translate(0,-(p.lift||0));
 // Feet stay on the ground while walking: each foot lifts in turn and steps forward a little; when held they dangle.
 const footPose=i=>{if(m==='held')return {dx:0,dy:0,rot:Math.sin(t*9+i*Math.PI)*.35};if(walk&&!still){const ph=Math.sin(step+i*Math.PI);return {dx:ph*.35,dy:-Math.max(0,ph)*(run?1.1:.8),rot:0};}return {dx:0,dy:0,rot:0};};
 const bodyY=bob+rest*.7,tilt=(p.tilt||0)+(m==='held'?Math.sin(t*5)*.075:walk?beat*.03:0);
 for(const [i,n] of [[0,'FootLeft'],[1,'FootRight']]){const f=footPose(i),fx=ELLI.feet[i].x;c.save();c.translate(fx+f.dx,(m==='held'?bodyY:0)+f.dy-1.2);c.rotate(f.rot);c.translate(-fx,1.2);draw(layer(n));c.restore();}
 c.translate(0,bodyY);c.rotate(tilt);const squash=walk?1-Math.abs(beat)*.025:rest?.985:1;c.scale(1/Math.sqrt(squash),squash);
 const dr=p.droop||0;if(layer('FrondLeft')&&(m==='groom'&&!still||dr>0)){for(const [i,n,pv] of [[0,'FrondLeft',[3.66,-20.7]],[1,'FrondRight',[5.49,-20.1]]]){
   // 0.6.34: grooming, 엘리시 nods its two fertile fronds (separate layers since 0.6.34) quickly, one after the other
   const a=m==='groom'&&!still?(i?1:-1)*.22*Math.max(0,Math.sin(t*10+i*Math.PI)):(i?1:-1)*.26*dr;c.save();c.translate(pv[0],pv[1]);c.rotate(a);c.translate(-pv[0],-pv[1]);draw(layer(n),true,ELLI.frondRect);c.restore();}}
 else if(layer('Fronds')){const sway=still?0:Math.sin(t*d.tempo*1.5)*(m==='held'?.06:.025)+(walk?beat*.02:0);c.save();c.translate(ELLI.pivot.x,ELLI.pivot.y);c.rotate(sway);c.translate(-ELLI.pivot.x,-ELLI.pivot.y);draw(layer('Fronds'),true,ELLI.frondRect);c.restore();}
 const body=layer('Body');draw(body);
 // Closed eyes: cover each eye with plain body texture from the same layer, then draw a soft lid line. No mouth or cheeks.
 if(body&&(m==='sleep'||m==='rest'||m==='moss'))for(const [ex,ey] of ELLI.eyes){c.save();c.beginPath();c.ellipse(ex,ey,ELLI.eyeR[0]+.25,ELLI.eyeR[1]+.25,0,0,7);c.clip();const q=ELLI.patch;c.drawImage(body,q[0],q[1],q[2],q[3],ex-1.8,ey-2.5,3.6,5);c.restore();c.strokeStyle='#f6ebd3';c.lineWidth=.42;c.lineCap='round';c.beginPath();c.moveTo(ex-.7,ey+.3);c.quadraticCurveTo(ex,ey+.9,ex+.7,ey+.3);c.stroke();}
 // Nest leaf hinges at its top-right attachment: it bounces with each step, flutters when held and settles when resting.
 if(layer('Leaf')){const lift=still?(rest?-.01:0):walk?Math.abs(beat)*(run?.05:.035):m==='held'?Math.sin(t*6)*.06:rest?-.012+Math.sin(t*1.1)*.006:Math.sin(t*1.2)*.012;c.save();c.translate(ELLI.leafPivot.x,ELLI.leafPivot.y);c.rotate(lift);c.translate(-ELLI.leafPivot.x,-ELLI.leafPivot.y);draw(layer('Leaf'),true);c.restore();}
 c.restore();const toWorld=h=>({x:x+h.x*g,y:y+(h.y+bodyY-(p.lift||0))*g}),tip=toWorld({x:r[0]+3,y:-8});return{hands:[],tip,face:{x,y:y-16*g*.55},width:20.5*g,height:33*g};}
// 베이치·코로나 faces (user: "둘다 얼굴 귀엽게"): the same cute face as 리들리 (rig.js) — short upright cream eyes and a tiny
// mouth, with 리들리's expressions (happy arcs, sad slants, surprised 'o', sleepy lids) — sized to each friend's face.
// The painted eyes (and 코로나's painted mouth) are covered with the body texture just below them. 베이치's face sits lower
// on its body, clear of the head leaf (user: "베이치 얼굴을 여기다 이렇게 배치"). (베이치 redraws its body over its hands, so
// this runs after that.)
const FACE={bosong:{eyes:[[.37,.63],[.65,.63]],mouth:[.51,.68],paint:{w:52,h:22},scale:1.35},jureong:{eyes:[[.342,.523],[.567,.523]],mouth:[.457,.6],paint:{w:53,h:21},paintMouth:[.46,.58,34,16]}};
// 코로나: the painted face (thick cream crescents, faint dash mouth) is the base; other expressions are redrawn in the same strokes
function coronaFace(c,d,e,E,M){const u=d.w/d.body[2];c.save();c.lineCap='round';c.strokeStyle='#f1e6cd';c.lineWidth=7*u;
 for(const q of E){const x=q.x,y=q.y,sd=q===E[0]?-1:1;c.beginPath();
  if(e==='neutral'){c.lineWidth=10*u;c.moveTo(x,y-10*u);c.lineTo(x,y+10*u);c.stroke();c.lineWidth=7*u;}   // 기본 얼굴: 짧은 세로 눈 (사용자 지정)
  else if(e==='happy'){c.moveTo(x-20*u,y+4*u);c.quadraticCurveTo(x,y-6*u,x+20*u,y+4*u);c.stroke();}
  else if(e==='sad'){c.moveTo(x-22*u,y);c.lineTo(x+22*u,y);c.stroke();}
  else if(e==='surprised'){c.fillStyle='#f1e6cd';c.ellipse(x,y,10*u,12*u,0,0,7);c.fill();}
  else if(e==='focused'){c.moveTo(x-20*u,y);c.quadraticCurveTo(x,y+8*u,x+20*u,y);c.stroke();}
  else if(e==='sleepy'){c.lineWidth=5*u;c.moveTo(x-20*u,y+4*u);c.quadraticCurveTo(x,y+12*u,x+20*u,y+4*u);c.stroke();c.lineWidth=7*u;}}
 c.strokeStyle='rgba(190,170,150,.75)';c.fillStyle=c.strokeStyle;c.lineWidth=5*u;c.beginPath();
 if(e==='surprised'){c.ellipse(M.x,M.y+2*u,6*u,7*u,0,0,7);c.fill();}
 else if(e==='sad'){c.moveTo(M.x-12*u,M.y+2*u);c.lineTo(M.x+12*u,M.y+2*u);c.stroke();}
 else if(e==='focused'||e==='neutral'){c.moveTo(M.x-10*u,M.y);c.lineTo(M.x+10*u,M.y);c.stroke();}
 c.restore();}
function cover(c,d,cx,cy,rx,ry,tx,ty,tw,th){c.save();c.beginPath();c.ellipse(cx,cy,rx,ry,0,0,7);c.clip();img(c,d,[tx-tw*.8,ty+th*1.1,tw*1.6,th*2],cx-rx*1.1,cy-ry*1.1,rx*2.2,ry*2.2);c.restore();}
function faceExpr(c,d,k,p,m,t=0){const F=FACE[k];if(!F)return;const ex0=p.expr||(['sleep','rest','moss'].includes(m)?'sleepy':['held','startle','slip'].includes(m)?'surprised':m==='splash'?'happy':m==='thirsty'?'sad':'neutral');
 const e0=ex0;
 const P=(e)=>({x:-d.w/2+e[0]*d.w,y:-d.h-1.5+e[1]*d.h});
 // cover what is painted
 const rw=F.paint.w/d.body[2]*d.w/2,rh=F.paint.h/d.body[3]*d.h/2;
 for(const e of d.eyes){const q=P(e);cover(c,d,q.x,q.y,rw*1.4,rh*1.9,d.body[0]+e[0]*d.body[2],d.body[1]+e[1]*d.body[3],F.paint.w,F.paint.h);}
 if(F.paintMouth){const [mx,my,mw,mh]=F.paintMouth,q=P([mx,my]);cover(c,d,q.x,q.y,mw/d.body[2]*d.w*.8,mh/d.body[3]*d.h*.9,d.body[0]+mx*d.body[2],d.body[1]+my*d.body[3],mw,mh);}
 if(k==='jureong'){coronaFace(c,d,e0,d.eyes.map(P),P([.457,.6]));return;}
 // 리들리's face, measured from rig.js: eyes 170 apart, 37 tall, line 9, mouth 26 wide 56 below the eye line
 const E=F.eyes.map(P),S=Math.hypot(E[1].x-E[0].x,E[1].y-E[0].y)*F.scale/170,M=P(F.mouth),blink=!p.reduced&&(t%4.7)<.16;
 c.save();c.strokeStyle='#efe4c7';c.fillStyle='#efe4c7';c.lineWidth=9*S;c.lineCap='round';
 const e=blink&&ex0==='neutral'?'sleepy':ex0;
 for(const q of E){const x=q.x,y=q.y;c.beginPath();
  if(e==='sleepy'){c.moveTo(x-17*S,y);c.quadraticCurveTo(x,y+16*S,x+17*S,y);}
  else if(e==='happy'){c.moveTo(x-16*S,y+3*S);c.quadraticCurveTo(x,y-18*S,x+16*S,y+3*S);}
  else if(e==='sad'&&k!=='bosong'){const sd=q===E[0]?-1:1;c.moveTo(x-15*S,y+(sd<0?-4:4)*S);c.lineTo(x+15*S,y+(sd<0?4:-4)*S);}
  else if(k==='bosong'&&e==='sad'){c.moveTo(x-15*S,y);c.lineTo(x+15*S,y);}   // 베이치 -_- (사용자 "화 났을 때 -_-")
  else if(k==='bosong'){c.stroke();c.beginPath();c.arc(x,y,(e==='surprised'?17:e==='focused'?9:14)*S,0,7);c.fillStyle='#f7f2e8';c.fill();c.fillStyle='#efe4c7';continue;}   // 베이치: round white eyes, as the user drew them ("눈 땡그랗게")
  else {c.moveTo(x,y-(e==='surprised'?22:18)*S);c.lineTo(x,y+(e==='surprised'?20:18)*S);}
  c.stroke();}
 c.beginPath();
 if(e==='surprised'){c.ellipse(M.x,M.y,13*S,17*S,0,0,7);c.fill();}
 else if(e==='sad'&&k==='bosong'){c.moveTo(M.x-12*S,M.y);c.lineTo(M.x+12*S,M.y);c.stroke();}
 else if(e==='sad'){c.moveTo(M.x-12*S,M.y+5*S);c.quadraticCurveTo(M.x,M.y-6*S,M.x+12*S,M.y+5*S);c.stroke();}
 // 웃을 때는 입 없음 (사용자 "웃을 땐 입 없애")
 else if(e!=='sleepy'&&e!=='happy'){c.moveTo(M.x-13*S,M.y);c.lineTo(M.x+13*S,M.y);c.stroke();}
 c.restore();}
function actor(c,k,x,y,t,p={}){if(k==='bonbon')return ellisiiActor(c,x,y,t,p);if(!data[k])return duriActor(c,k,x,y,t,p);const d=data[k],g=p.growth??.65,m=p.mode||'idle',walk=['walk','run','slow'].includes(m),beat=Math.sin(t*d.tempo*(m==='run'?12:8)),rest=p.rest??(['sleep','rest','moss'].includes(m)?1:0),bob=walk?-Math.abs(beat)*.65:m==='held'?Math.sin(t*7)*.22:Math.sin(t*1.4)*.09;
const dr=p.droop||0,sit=p.sit||0,sd=k==='bosong'?1.3:1.4,sink=sit*(rest*.7+sd)+dr*1.1;c.save();c.translate(x,y);c.scale(g,g);c.translate(0,bob+rest*.7+sit*sd+dr*1.1-(p.lift||0));c.rotate((p.tilt||0)+(m==='held'?Math.sin(t*5)*.075:0));if(d.hat)hatLayer(c,d,t,p,true);
for(let i=0;i<2;i++){const s=i?1:-1;c.save();c.translate(s*d.w*.25,(k==='bonbon'?-2.2:-3)-sink);c.rotate(walk?s*beat*.35:m==='held'?s*Math.sin(t*10+i)*.62:m==='splash'?s*Math.sin(t*7)*.25:0);img(c,d,d.legs[i],k==='bonbon'?-1.55:-1.9,k==='bonbon'?-2:-2.2,k==='bonbon'?3.1:3.8,k==='bonbon'?4.2:5.7);c.restore();}
if(k==='bosong'){c.save();c.beginPath();c.ellipse(0,-d.h/2-1.5,d.w/2,d.h/2,0,0,Math.PI*2);c.clip();img(c,d,d.body,-d.w/2,-d.h-1.5,d.w,d.h);c.restore();}else img(c,d,d.body,-d.w/2,-d.h-1.5,d.w,d.h);
// Texture eyelids are a separate animation overlay. The body texture never changes.
if(m==='sleep'||m==='rest'||m==='moss')for(const e of d.eyes){const ex=-d.w/2+e[0]*d.w,ey=-d.h-1.5+e[1]*d.h;if(k==='bonbon'||k==='neolbi'){c.save();c.beginPath();c.ellipse(ex,ey,1.6,2.2,0,0,7);c.clip();img(c,d,k==='bonbon'?[d.body[0]+d.body[2]*.30,d.body[1]+d.body[3]*.30,70,80]:[d.body[0]+d.body[2]*.42,d.body[1]+d.body[3]*.72,70,80],ex-1.7,ey-2.3,3.4,4.6);c.restore();c.strokeStyle='#f6ebd3';c.lineWidth=.42;c.lineCap='round';c.beginPath();c.moveTo(ex-.65,ey);c.quadraticCurveTo(ex,ey+.6,ex+.65,ey);c.stroke();}}

if(k==='jureong')faceExpr(c,d,k,p,m,t);
const hands=[];
// Front arms are composited after the body and head foliage.
// 1.1.6: the 640 px arm buffer was cleared and composited every frame for every species here (about 1.6 ms a friend, even
// for armless 코로나); 베이치's arms go behind its body, so they are drawn straight onto the canvas before the body is drawn
// again over them, and a species without arms skips the buffer altogether
const bodyContext=c,direct=k==='bosong'||!d.arms;let armCanvas=null;if(!direct){armCanvas=armBuffer||(armBuffer=createCanvas(640,640));const armCtx=armCanvas.getContext('2d');armCtx.setTransform(1,0,0,1,0,0);armCtx.clearRect(0,0,640,640);armCtx.translate(320,320);armCtx.scale(10,10);c=armCtx;}
if(d.arms)for(let i=0;i<2;i++){const s=i?1:-1,root={x:s*d.w*.31,y:-d.h*.46};let h={x:s*d.w*.47,y:-d.h*.22};if(walk)h.y+=s*beat*.85;if(m==='held'){h.x=s*d.w*.44;h.y=-d.h*.30+Math.sin(t*9+i*Math.PI)*1.8;}if(m==='splash'){h.x=s*d.w*.49;h.y=-d.h*.35+Math.sin(t*7+i*Math.PI)*1.8;}if(m==='startle')h={x:s*d.w*.52,y:-d.h*.98+Math.sin(t*14+i)*.25};if(m==='slip')h={x:s*d.w*.74,y:-d.h*.6+s*1.4+Math.sin(t*9+i*Math.PI)*.6};if(m==='groom'&&i===1){const q=ease(t%8/.9)*(1-ease(((t%8)-6.7)/1.3));h=k==='bosong'?{x:lerp(h.x,d.w*.42+Math.sin(t*18)*.12,q),y:lerp(h.y,-d.h*.86+Math.sin(t*18+1)*.3,q)}:{x:lerp(h.x,d.w*.30+Math.sin(t*5)*.5,q),y:lerp(h.y,-d.h*.86+Math.cos(t*5)*.45,q)};}if(dr&&!['groom','litter','startle','slip','held','splash'].includes(m)){h.y+=dr*1.4;h.x-=s*dr*.5;}if(m==='carry'||m==='pass'){h.y=-d.h*.48;h.x=s*d.w*.5;}if(m==='litter'){const u=p.litterUp||0;h={x:s*d.w*lerp(.36,.62,u),y:lerp(-d.h*.08,-d.h*.9,u)};}if(p.hands?.[i])h=p.hands[i];
 // 0.6.34: 베이치's arms keep their length (they used to stretch when raised); its arms stay behind the body, so grooming is a scratch at the back of the head
 if(k==='bosong'){const L=Math.hypot(h.x-root.x,h.y-root.y),M=['groom','startle','slip'].includes(m)?10:7.2;if(L>M)h={x:root.x+(h.x-root.x)*M/L,y:root.y+(h.y-root.y)*M/L};}
 if(k==='bonbon'){h.x=s*(d.w*.46+.15*Math.cos(t*7+i));h.y=-d.h*.40+(m==='held'?Math.sin(t*9+i*Math.PI)*1.8:walk?s*beat*.7:0);c.save();c.beginPath();c.arc(h.x,h.y,1.65,0,Math.PI*2);c.clip();img(c,d,[d.body[0]+180,d.body[1]+300,100,100],h.x-1.65,h.y-1.65,3.3,3.3);c.restore();c.strokeStyle='#62513f60';c.lineWidth=.12;c.beginPath();c.arc(h.x,h.y,1.65,0,Math.PI*2);c.stroke();hands.push(h);continue;}const dx=h.x-root.x,dy=h.y-root.y,len=Math.hypot(dx,dy),width=Math.min(3,d.w*.18);c.save();c.translate(root.x,root.y);c.rotate(Math.atan2(dy,dx)-Math.PI/2);img(c,d,d.arms[i],-width/2,-width*.8,width,len+width*1.3);c.restore();hands.push(h);}
c=bodyContext;
if(k==='bosong'){
 c.save();c.beginPath();c.ellipse(0,-d.h/2-1.5,d.w/2,d.h/2,0,0,Math.PI*2);c.clip();img(c,d,d.body,-d.w/2,-d.h-1.5,d.w,d.h);c.restore();
 faceExpr(c,d,k,p,m,t);
 leafLayer(c,d,t,p);
}else{leafLayer(c,d,t,p);if(armCanvas)c.drawImage(armCanvas,-32,-32,64,64);}
// Armless species use the physical leaf-tip contact point, never virtual hands.
const f=d.fol,tip=k==='jureong'?{x:f[0]+2,y:f[1]+f[3]-3}:{x:f[0]+5,y:f[1]+f[3]-2};
const la=(p.leafAngle||0)+Math.sin(t*d.tempo*1.5)*.012, pivot=-d.h*.78, tx=tip.x,ty=tip.y-pivot;tip.x=tx*Math.cos(la)-ty*Math.sin(la);tip.y=pivot+tx*Math.sin(la)+ty*Math.cos(la);
c.restore();const toWorld=h=>({x:x+h.x*g,y:y+(h.y+bob+rest*.7-(p.lift||0))*g});return{hands:hands.map(toWorld),tip:toWorld(tip),face:{x,y:y-d.h*g*.55},width:d.w*g,height:d.h*g};}

const files={ellisiiBody:'assets/forest/species/ellisii-body.png',ellisiiFronds:'assets/forest/species/ellisii-fronds.png',ellisiiFrondLeft:'assets/forest/species/ellisii-frond-left.png',ellisiiFrondRight:'assets/forest/species/ellisii-frond-right.png',ellisiiLeaf:'assets/forest/species/ellisii-leaf.png',ellisiiFootLeft:'assets/forest/species/ellisii-foot-left.png',ellisiiFootRight:'assets/forest/species/ellisii-foot-right.png'};for(const k of ['bonbon','bosong','jureong','duri'])files['species_'+k]='assets/forest/species/'+k+'.png';
function draw(c,assets,opt){const k=opt.species;if(!['bonbon','bosong','jureong','duri'].includes(k))return false;for(const name of Object.keys(data)){data[name].im=assets['species_'+name];data[name].snow=opt.snow||0;}A={snow:opt.snow||0,ellisiiBody:assets.ellisiiBody,ellisiiFronds:assets.ellisiiFronds,ellisiiFrondLeft:assets.ellisiiFrondLeft,ellisiiFrondRight:assets.ellisiiFrondRight,ellisiiLeaf:assets.ellisiiLeaf,ellisiiFootLeft:assets.ellisiiFootLeft,ellisiiFootRight:assets.ellisiiFootRight,body:assets.rigBody,palm:assets.rigPalm,'leg-left':assets.rigLegLeft,'leg-right':assets.rigLegRight,duri:assets.species_duri,duriBounds:[223,121,869,663]};if(k==='duri')initMesh();c.save();c.translate(627,1065.9);c.scale(1254/48,1254/48);actor(c,k,0,0,opt.reduced?1:opt.phase,{mode:opt.kind,growth:1,expr:opt.expression,noShadow:true,reduced:opt.reduced,litterUp:opt.litterUp||0,sit:opt.sit||0,droop:opt.droop||0,...(k==='bonbon'&&opt.sit!=null?{rest:opt.sit}:{})});c.restore();return true;}
return {files,draw};
});
