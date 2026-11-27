(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestSuperbum=api;})(globalThis,function(){
'use strict';
// 슈퍼범 (Platycerium superbum) is drawn from layers cut out of the user-approved concept art (tools/cut-superbum.py,
// tools/rig-superbum.py), one full set per state: 'dry' (마른 둥지) and 'wet' (물 고인 둥지, the nest frond holds rain).
// Layers share one 480x420 canvas, feet on the ground at ANCHOR. No arms: the pendant antler leaves (skirt) are the limbs.
const SIZE=1.7,ANCHOR=[240,404],HEIGHT=382,RIDLEY_H=38.5;
const HUDDLE={crown:.15,lift:10,skirt:-.15};
const Leaf=typeof module==='object'?require('./leaf-state.js'):globalThis.ForestLeafState;
const LAYERS=['body','foot-left','foot-right','skirt-left','skirt-right','crown'];
const files={};for(const st of ['dry','wet'])for(const k of LAYERS)files['superbum_'+st+'_'+k]='assets/forest/species/superbum-'+st+'-'+k+'.png';
const META={
 dry:{eyes:[[188.1,279.2,35.4,9.6],[260.1,279.2,34.8,9.6]],crown:[240.3,218],skirt:[[150.3,252],[330.3,252]],feet:[[177.9,387.2],[302.1,387.2]],patch:[229.8,328.4],rim:[[30,180],[450,180]]},
 wet:{eyes:[[185.4,279.2,34.8,9.6],[261,279.2,35.4,9.6]],crown:[240,221.6],skirt:[[150,229.5],[330,229.5]],feet:[[175.2,387.8],[304.8,387.8]],patch:[228.1,326.6],rim:[[22,128],[452,140]]}
};
// Water held in the nest: the wet set shows from WET_ON and fully at WET_FULL (fraction of the nest's capacity).
const WET_ON=.12,WET_FULL=.3,STRIP=6;
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>(x=clamp(x))*x*(3-2*x);
// 1.1.6: a gently swaying side leaf (standing, resting: small angle and lift) is drawn from a small cache of bent leaves
// baked once per pose step (angle and lift rounded to BAKE_STEP, resolution to the screen scale), instead of 60-odd clipped
// strips every frame; bigger swings (walking, playing, startle) are still bent live. The cache keeps the newest BAKE_MAX.
const BAKE_STEP=.003,BAKE_SMALL=.035,BAKE_MAX=48,bakes=new Map();
const makeCanvas=(w,h)=>{const c=typeof document!=='undefined'?document.createElement('canvas'):require('@napi-rs/canvas').createCanvas(w,h);c.width=w;c.height=h;return c;};
const MOVING=['walk','slow','hurry','run','duck','step','avoid'];
// Rig-frame scale: the common renderer gives 1254 px for a 48-unit friend; 슈퍼범 stands 1.7x 리들리 (38.5 units tall).
const K=1254/48*RIDLEY_H*SIZE/HEIGHT;
function wetness(opt){return ease(((opt.water??0)-WET_ON)/(WET_FULL-WET_ON));}
// Pose for one moment. t in seconds; full=true when the nest holds water (careful, level carrying).
function pose(kind,t,opt={}){
 const reduced=!!opt.reduced,full=(opt.water??0)>=WET_ON,moving=MOVING.includes(kind),run=kind==='run'||kind==='hurry';
 const speed=(run?11:kind==='slow'?5.5:7.5)*(full?.8:1),step=t*speed,beat=Math.sin(step);
 const p={bob:0,sink:0,tilt:0,squash:1,crown:0,crownLift:0,crownScale:1,skirt:[0,0],skirtLift:[0,0],feet:[{dx:0,dy:0,rot:0},{dx:0,dy:0,rot:0}],eyes:opt.expression||'neutral',look:0,pour:0,drips:0,shimmer:full?1:0};
 if(reduced){if(kind==='rest'||kind==='sleep'||kind==='moss'){p.sink=6;p.eyes='sleepy';}return huddle(p,opt);}
 const breathe=Math.sin(t*1.3);
 p.bob=breathe*1.2;p.skirt=[Math.sin(t*1.1)*.02,-Math.sin(t*1.1+.6)*.02];p.crown=Math.sin(t*.9)*.012;
 if(moving){
  // Feet take turns: one lifts and steps forward, the body rises on each step, the skirt swings against the step.
  p.feet=[0,1].map(i=>{const ph=Math.sin(step+i*Math.PI);return {dx:ph*(run?9:6),dy:-Math.max(0,ph)*(run?16:10)*(full?.7:1),rot:0};});
  p.bob=-Math.abs(beat)*(run?12:8)*(full?.6:1);p.squash=1-Math.abs(beat)*.03;p.tilt=beat*(full?.012:.03);
  p.skirt=[-beat*(run?.1:.06),-beat*(run?.1:.06)];p.skirtLift=[Math.max(0,beat)*.04,Math.max(0,-beat)*.04];
  // A full nest is carried level: the crown counter-tilts and lags a little; a running full nest spills drops.
  p.crown=full?-p.tilt*.8+Math.sin(step-.6)*.01:Math.sin(step-.8)*.035;p.crownLift=full?0:-Math.abs(beat)*1.5;
  if(full)p.drips=run?1:.35;
 }
 if(kind==='held'){p.feet=[0,1].map(i=>({dx:0,dy:6,rot:Math.sin(t*8+i*Math.PI)*.35}));p.skirt=[Math.sin(t*7)*.07,Math.sin(t*7+1.4)*.07];p.skirtLift=[.03,.03];p.tilt=Math.sin(t*4.5)*.05;p.crown=Math.sin(t*5.5)*.05;p.eyes=opt.expression||'surprised';if(full)p.drips=1;}
 if(kind==='rest'||kind==='sleep'||kind==='moss'){const r=opt.restBlend??1;p.sink=10*r;p.bob=breathe*1.6;p.squash=1-.03*r;p.skirt=[.03*r+Math.sin(t*.8)*.01,-.03*r-Math.sin(t*.8)*.01];p.crown=.03*r+Math.sin(t*.7)*.01;p.crownLift=6*r;p.eyes=opt.expression||'sleepy';}
 if(kind==='groom'){const cyc=(t%5)/5,q=ease(cyc/.2)*(1-ease((cyc-.8)/.2));p.skirtLift=[0,q*.35];p.skirt[1]=-q*.18+Math.sin(t*8)*.03*q;p.crown=Math.sin(t*8)*.03*q;p.eyes=opt.expression||'focused';}
 if(kind==='drink'){p.tilt=.06+Math.sin(t*4)*.015;p.sink=5;p.eyes=opt.expression||'focused';}
 if(kind==='splash'){p.bob=-Math.abs(Math.sin(t*6))*10;p.skirt=[Math.sin(t*7)*.08,-Math.sin(t*7)*.08];p.skirtLift=[.04,.04];p.eyes=opt.expression||'happy';}
 if(kind==='litter'){p.skirt[0]=-.25+Math.sin(t*5)*.12;p.skirtLift[0]=.2;p.tilt=-.04;}
 // 빗물 모으기: the nest opens up to the sky and the face looks up, happy.
 if(kind==='collect'){p.crownScale=1.025+Math.sin(t*2)*.008;p.eyes=opt.expression||'happy';p.look=-1;}
 // 물 나눔: the nest tips toward the friend and pours a thin stream from its rim.
 if(kind==='share'){const side=opt.side||1,q=ease(Math.min(1,(t%6)/1.2))*(1-ease(((t%6)-4.8)/1.2));p.crown=side*.12*q;p.tilt=side*.05*q;p.pour=full?q:0;p.skirt=[side*.08*q,side*.08*q];p.eyes=opt.expression||'happy';}
 return huddle(p,opt);
}
// 0.6.38: inside a shelter 슈퍼범 folds its nest leaf down and draws its side leaves in (opt.huddle 0..1), so a grown
// 슈퍼범 takes 엘레판's room. The shelter outline (PROFILES.superbumHuddle) is baked from this real pose, not a shrunk body.
function huddle(p,opt){const h=Math.max(0,Math.min(1,opt.huddle||0));if(!h)return p;p.huddled=h;p.crownScale*=1-HUDDLE.crown*h;p.crownLift+=HUDDLE.lift*h;p.crown*=1-h;p.skirt=[p.skirt[0]+HUDDLE.skirt*h,p.skirt[1]-HUDDLE.skirt*h];return p;}
function eyes(c,set,m,p,a,opt,t){
 const blink=!opt.reduced&&p.eyes==='neutral'&&(t+(opt.seed||0))%5.3<.13,e=blink?'sleepy':p.eyes;
 if(e==='neutral'&&!p.look)return;
 const body=a['superbum_'+set+'_body'];if(!body)return;
 c.save();c.lineCap='round';
 for(const [x,y,w,h] of m.eyes){
  // cover the painted eye with plain body texture from the same layer, then draw the expression in the eyes' cream
  c.save();c.beginPath();c.ellipse(x+w/2,y+h/2,w/2+3,h/2+3,0,0,7);c.clip();c.drawImage(body,m.patch[0],m.patch[1],w+8,h+8,x-4,y-4,w+8,h+8);c.restore();
  const cx=x+w/2,cy=y+h/2;c.strokeStyle='#f5eadb';c.fillStyle='#f5eadb';c.lineWidth=h*.95;c.beginPath();
  if(e==='sleepy'){c.lineWidth=3.2;c.moveTo(cx-w*.42,cy-1);c.quadraticCurveTo(cx,cy+5,cx+w*.42,cy-1);}
  else if(e==='happy'){c.lineWidth=4.2;c.moveTo(cx-w*.4,cy+3);c.quadraticCurveTo(cx,cy-7,cx+w*.4,cy+3);}
  else if(e==='sad'){c.lineWidth=h*.8;c.moveTo(cx-w*.38,cy-2);c.lineTo(cx+w*.38,cy+2);}
  else if(e==='surprised'){c.lineWidth=0;c.ellipse(cx,cy,w*.22,h*.95,0,0,7);c.fill();c.beginPath();}
  else if(e==='focused'){c.lineWidth=h*.75;c.moveTo(cx-w*.36,cy+1);c.lineTo(cx+w*.36,cy+1);}
  else{const dy=p.look*3;c.moveTo(cx-w*.5+h/2,cy+dy);c.lineTo(cx+w*.5-h/2,cy+dy);}
  c.stroke();
 }
 c.restore();
}
// draws one full layer set; alpha for the dry/wet cross-fade
function bodyPose(c,p,sit){
 c.translate(0,p.bob+p.sink+sit*10);
 c.translate(...ANCHOR);c.rotate(p.tilt);c.scale(1/Math.sqrt(p.squash),p.squash);c.translate(-ANCHOR[0],-ANCHOR[1]);
}
function drawSet(c,a,set,p,opt,t,part){
 const m=META[set],L=k=>{
  const im=a['superbum_'+set+'_'+k];
  if(k==='crown')return Leaf.texture(im,set==='wet'?'superbumWetCrown':'superbumCrown',opt.leafState);
  return k.startsWith('skirt')?Leaf.texture(im,k,opt.leafState):im;
 },snow=opt.snow||0,E=snow>0?(typeof module==='object'?require('./world-effects.js'):globalThis.ForestEffects):null;
 const img=(k,snowy)=>{const im=L(k);if(!im)return;c.drawImage(im,0,0,480,420);Leaf.markTear(c,im,0,0,480,420);if(snowy&&E)E.snow(c,im,snow,0,0,480,420);};
 // The pendant leaves hang from the cheeks: their top stays attached and only the lower part swings (drawn in thin
 // horizontal strips, each shifted more the further it hangs), so a leaf bends instead of coming apart from the face.
 const bend=(k,py,ang,lift,snowy)=>{const im=L(k);if(!im)return;if(Math.abs(ang)<1e-4&&Math.abs(lift)<1e-4){img(k,snowy);return;}
  // each strip is clipped on the canvas and the whole layer is drawn shifted inside it: no resampled strip edges
  const top=Math.max(0,Math.floor(py-40)),span=420-py;c.save();c.beginPath();c.rect(-60,-60,600,top+60);c.clip();c.drawImage(im,0,0,480,420);c.restore();
  for(let y=top;y<420;y+=STRIP){const h=Math.min(STRIP,420-y),f=Math.max(0,(y+h/2-py)/span),w=f*f*(3-2*f),dx=-ang*span*w,dy=-lift*span*.35*w;c.save();c.beginPath();c.rect(-60,y+dy-.75,600,h+1.5);c.clip();c.drawImage(im,dx,dy,480,420);c.restore();}
  if(snowy&&E)E.snow(c,im,snow,0,0,480,420);};
 const bentLive=bend;
 const bendCached=(k,py,ang,lift,snowy)=>{const im=L(k);if(!im)return;if(Math.abs(ang)<1e-4&&Math.abs(lift)<1e-4||Math.abs(ang)>BAKE_SMALL||Math.abs(lift)>BAKE_SMALL)return bentLive(k,py,ang,lift,snowy);
  const T=c.getTransform(),scale=Math.min(1,Math.ceil(Math.hypot(T.a,T.b)*1.25*4)/4)||1,qa=Math.round(ang/BAKE_STEP)*BAKE_STEP,ql=Math.round(lift/BAKE_STEP)*BAKE_STEP,key=set+k+'|'+(opt.leafState||0)+'|'+qa.toFixed(3)+'|'+ql.toFixed(3)+'|'+scale;
  let cv=bakes.get(key);if(cv){bakes.delete(key);bakes.set(key,cv);}
  else{cv=makeCanvas(Math.ceil(560*scale),Math.ceil(460*scale));const o=cv.getContext('2d');o.scale(scale,scale);o.translate(40,20);const keep=c;c=o;try{bentLive(k,py,qa,ql,false);}finally{c=keep;}bakes.set(key,cv);if(bakes.size>BAKE_MAX)bakes.delete(bakes.keys().next().value);}
  c.drawImage(cv,-40,-20,560,460);if(snowy&&E)E.snow(c,im,snow,0,0,480,420);};
 // body (round face) first; the feet are attached in front of its lower edge (they move with the body and step on their own); leaves and crown move with the body
 const sit=opt.sit||0,lift=()=>bodyPose(c,p,sit);
 if(part!=='leaves'){
 c.save();lift();img('body');eyes(c,set,m,p,a,opt,t);c.restore();
 for(const i of [0,1]){const f=p.feet[i],[fx,fy]=m.feet[i];c.save();c.translate(f.dx,f.dy+p.bob+p.sink*(1-sit));c.translate(fx,fy);c.rotate(f.rot);c.translate(-fx,-fy);img(i?'foot-right':'foot-left');c.restore();}
 if(part==='base')return;
 }
 c.save();lift();
 // each side's leaves hang over its cheek
 // huddled (0.6.38): the outer tips at the top of the side leaves sit under the nest brim; once the nest folds down they
 // would stick out, so they are clipped away (only the leaf top outside x 90..390 above y 240)
 const hc=p.huddled>.01;if(hc){c.save();c.beginPath();c.rect(-60,240,600,300);c.rect(90,-60,300,300);c.clip();}
 bendCached('skirt-left',m.skirt[0][1],p.skirt[0],p.skirtLift[0],true);
 bendCached('skirt-right',m.skirt[1][1],p.skirt[1],p.skirtLift[1],true);
 if(hc)c.restore();
 const [cx,cy]=m.crown;c.save();c.translate(cx,cy);c.rotate(p.crown);c.scale(p.crownScale,p.crownScale);c.translate(-cx,-cy+p.crownLift);img('crown',true);const M=c.getTransform();c.restore();
 c.restore();return M;
}
// water effects in crown space (after the crown is drawn): shimmer on the surface, drops off the rim, a pouring stream
function water(c,M,set,p,t,opt){
 if(set!=='wet')return;const m=META.wet;c.save();c.setTransform(M);
 if(p.shimmer&&!opt.reduced){c.globalAlpha=.35+.2*Math.sin(t*2.1);c.strokeStyle='#ffffff';c.lineWidth=2;c.lineCap='round';const x=200+Math.sin(t*.8)*26;c.beginPath();c.moveTo(x-18,148);c.quadraticCurveTo(x,145,x+18,148);c.stroke();}
 c.globalAlpha=1;
 if(p.drips>0&&!opt.reduced)for(let i=0;i<2;i++){const ph=(t*(.7+i*.23)+i*.5)%1;if((Math.floor(t*(.7+i*.23)+i*.5)*7919+i*31)%10/10>p.drips)continue;const [rx,ry]=m.rim[i];c.fillStyle='rgba(176,220,214,'+(.85*(1-ph))+')';c.beginPath();c.ellipse(rx,ry+ph*70,2.6,3.8,0,0,7);c.fill();}
 if(p.pour>.02){const side=(opt.side||1)>0?1:0,[rx,ry]=m.rim[side],g=c.createLinearGradient(rx,ry,rx,ry+120);g.addColorStop(0,'rgba(176,220,214,.9)');g.addColorStop(1,'rgba(176,220,214,0)');c.strokeStyle=g;c.lineWidth=5*p.pour;c.lineCap='round';c.beginPath();c.moveTo(rx,ry);c.quadraticCurveTo(rx+(side?14:-14),ry+40,rx+(side?18:-18),ry+120);c.stroke();
  if(!opt.reduced){c.fillStyle='rgba(176,220,214,.8)';for(let i=0;i<3;i++){const ph=(t*1.6+i/3)%1;c.beginPath();c.ellipse(rx+(side?18:-18)+Math.sin(i*2)*4,ry+120+ph*30,2,3,0,0,7);c.fill();}}}
 c.restore();
}
// drawLocal: origin = the feet's ground centre, units = layer px
function drawLocal(c,a,opt={}){
 const t=opt.reduced?0:opt.phase||0,kind=opt.clip||opt.kind||'idle',p=pose(kind,t,{...opt,kind}),w=wetness(opt);
 const dr=opt.droop||0;if(dr){p.sink=(p.sink||0)+14*dr;p.crownScale=(p.crownScale||1)*(1-.05*dr);p.crownLift=(p.crownLift||0)+14*dr;p.skirt=[(p.skirt?.[0]||0)+.14*dr,(p.skirt?.[1]||0)-.14*dr];p.squash=(p.squash||1)*(1-.03*dr);}
 c.save();c.translate(-ANCHOR[0],-ANCHOR[1]);
 const sets=w<=0?[['dry',1]]:w>=1?[['wet',1]]:[['dry',1],['wet',w]];
 const paint=part=>{
  for(const [set,alpha] of sets){
   if(alpha<1){
    const cv=layerBuffer(),cc=cv.getContext('2d');cc.setTransform(1,0,0,1,0,0);cc.clearRect(0,0,cv.width,cv.height);cc.translate(0,60);
    const M=drawSet(cc,a,set,p,{...opt,kind},t,part);
    if(part!=='base')water(cc,M,set,p,t,opt);
    c.save();c.globalAlpha*=alpha;c.drawImage(cv,0,-60);c.restore();
   }else{
    const M=drawSet(c,a,set,p,{...opt,kind},t,part);
    if(part!=='base')water(c,M,set,p,t,opt);
   }
  }
 };
 if(opt.cover){paint('base');opt.cover();paint('leaves');}
 else paint();
 if(opt.crownSprout){
  c.save();bodyPose(c,p,opt.sit||0);c.translate(...ANCHOR);
  const rigUnits=HEIGHT/(RIDLEY_H*SIZE);c.scale(rigUnits,rigUnits);
  opt.crownSprout(c);c.restore();
 }
 c.restore();return p;
}
let buffer=null;function layerBuffer(){if(!buffer){buffer=typeof document!=='undefined'?document.createElement('canvas'):require('@napi-rs/canvas').createCanvas(480,540);buffer.width=480;buffer.height=540;}return buffer;}
// draw in the common 1254-px rig frame (feet at 627,1065.9), the same frame every friend uses
function draw(c,a,opt={}){c.save();c.translate(627,1065.9);c.scale(K,K);drawLocal(c,a,opt);c.restore();}
return {SIZE,K,HUDDLE,files,META,LAYERS,WET_ON,WET_FULL,pose,wetness,draw,drawLocal};
});
