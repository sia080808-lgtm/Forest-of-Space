(function(root){'use strict';
// 1.2.8 입장 화면 (user: "브랜드 컨셉 잘 드러나고 … 입장화면" → 시안 A·B·C → 낮 조합 시안 → "리들리, 엘리시, 슈퍼범만 화면 좌측에서
// 화면 중앙으로 걸어오는 거지. 주변에 반딧불이 떠 있고. 낮인데 밤연출" → "안개가 천천히 걷히고 이 연출 좋은 듯" → "이걸로 일단 하고").
// The paper, frame, fog veil, title and button are plain HTML/CSS so they are on screen at the very first paint (no blank screen
// while the scripts load). This module only paints the moving layer on #welcome-art once the game art has loaded: three friends
// walking in from the left with the game's own rig, fireflies, and the drifting fog that slowly clears. Render only: it never
// reads or changes the game state.
const FRIENDS=[{sp:'ridley',to:.656,lag:0,h:1},{sp:'bonbon',to:.494,lag:.35,h:1},{sp:'superbum',to:.265,lag:.7,h:0}];
const WALK=6.5,DONE=WALK+1.2;
const rnd=(i,k)=>{const v=Math.sin(i*91.7+k*13.3)*43758.5453;return v-Math.floor(v);};
const FLIES=[...Array(16)].map((_,i)=>({x:.05+rnd(i,1)*.9,y:.35+rnd(i,2)*.5,a:rnd(i,3)*6.3,s:.5+rnd(i,4)*.7,sp:.3+rnd(i,5)*.5}));
const FOG=[...Array(9)].map((_,i)=>({x:-.3+rnd(i,6)*1.1,y:.14+rnd(i,7)*.76,w:.66+rnd(i,8)*.66,h:.14+rnd(i,9)*.13,dir:rnd(i,10)<.5?-1:1,v:6+rnd(i,11)*10}));
const ease=x=>x<=0?0:x>=1?1:1-Math.pow(1-x,2.2);
const sm=(a,b,x)=>{x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x);};
let cv=null,assets=null,reduced=false,raf=0,t0=0;
function size(id){return id==='superbum'?.78:1;}   // superbum's rig art is already drawn larger; this keeps it about 1.6× 리들리 as in the game
function frame(t){const c=cv.getContext&&cv.getContext('2d');if(!c||!c.setTransform)return;const dpr=Math.min(2,root.devicePixelRatio||1),W=cv.clientWidth,H=cv.clientHeight;if(!W||!H)return;
 if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
 c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
 const k=Math.max(.75,Math.min(W/393,H/852,1.35)),gy=Math.min(H-204*k,H*.78),R=112*k,tt=reduced?30:t;
 // a warm pool of light on the ground the friends walk into
 const g=c.createRadialGradient(W*.42,gy,0,W*.42,gy,W*.62);g.addColorStop(0,'rgba(139,154,103,.24)');g.addColorStop(1,'rgba(139,154,103,0)');c.save();c.translate(0,gy);c.scale(1,.12);c.translate(0,-gy);c.fillStyle=g;c.fillRect(-W,gy-W,W*3,W*2);c.restore();
 for(const f of [...FRIENDS].reverse()){const u=ease((tt-f.lag)/WALK),walking=u<.998&&!reduced,x=W*f.to-(430*k)*(1-u),r=R*size(f.sp);if(x<-r)continue;
  c.save();c.globalAlpha=.22;c.fillStyle='rgb(74,60,40)';c.beginPath();c.ellipse(x,gy+1,r*.27,r*.05,0,0,Math.PI*2);c.fill();c.restore();
  c.save();c.translate(x,gy);c.scale(r/1254,r/1254);c.translate(-627,-1065.9);try{root.ForestRig.draw(c,assets,{species:f.sp,kind:walking?'walk':'idle',phase:tt,expression:'neutral',reduced});}catch(e){}c.restore();}
 if(assets.fern5){c.save();c.globalAlpha=.8;c.drawImage(assets.fern5,W*.73,gy-14*k,62*k,62*k*assets.fern5.height/assets.fern5.width);c.restore();}
 // fog drifting away; a thin band stays and keeps moving
 const clear=reduced?1:sm(.6,6.5,tt);for(const [i,p] of FOG.entries()){const o=(1-clear)*.95+.16*(1-Math.abs((i%3)-1)*.5);if(o<.02)continue;
  const fx=(p.x+p.dir*(tt*p.v+clear*120)/393)*W,fy=p.y*H,fw=p.w*W,fh=p.h*H,cx=fx+fw/2,cy=fy+fh/2,gr=c.createRadialGradient(cx,cy,0,cx,cy,fw/2);
  gr.addColorStop(0,'rgba(251,246,236,.92)');gr.addColorStop(.45,'rgba(251,246,236,.65)');gr.addColorStop(1,'rgba(251,246,236,0)');c.save();c.globalAlpha=o;c.translate(cx,cy);c.scale(1,fh/fw);c.translate(-cx,-cy);c.fillStyle=gr;c.beginPath();c.arc(cx,cy,fw/2,0,Math.PI*2);c.fill();c.restore();}
 // fireflies in the daylight
 const show=reduced?1:sm(1.5,4,tt);for(const p of FLIES){const x=p.x*W+(reduced?0:Math.sin(tt*p.sp+p.a)*22*k),y=p.y*H+(reduced?0:Math.cos(tt*p.sp*.8+p.a)*16*k),o=show*(reduced?.8:.35+.65*Math.max(0,Math.sin(tt*1.3*p.sp+p.a*2)));if(o<.02)continue;
  const rr=18*p.s*k,gr=c.createRadialGradient(x,y,0,x,y,rr);gr.addColorStop(0,'rgba(255,246,200,'+o+')');gr.addColorStop(.18,'rgba(255,214,96,'+o*.85+')');gr.addColorStop(.45,'rgba(255,201,74,'+o*.28+')');gr.addColorStop(1,'rgba(255,207,90,0)');c.fillStyle=gr;c.beginPath();c.arc(x,y,rr,0,Math.PI*2);c.fill();}
}
function loop(){raf=root.requestAnimationFrame(loop);const t=root.performance.now()/1000-t0;frame(t);if(reduced&&t>.2){root.cancelAnimationFrame(raf);raf=0;}}
function start(opt){cv=root.document.getElementById('welcome-art');if(!cv||!opt?.assets||!root.ForestRig)return;assets=opt.assets;reduced=!!opt.reduced;stop();t0=root.performance.now()/1000;loop();}
// a tap on the screen skips the walk to its end (the button never waits for it)
function skip(){t0=root.performance.now()/1000-DONE*2;}
function stop(){if(raf)root.cancelAnimationFrame(raf);raf=0;}
root.ForestWelcome=Object.freeze({start,skip,stop,FRIENDS,WALK});
})(globalThis);
