(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestEffects=api;})(globalThis,function(){
'use strict';
const masks=new WeakMap();
function canvas(w,h){const c=typeof document!=='undefined'?document.createElement('canvas'):require('@napi-rs/canvas').createCanvas(w,h);c.width=w;c.height=h;return c;}
// Once per immutable source image, never per animation frame. Only exposed upper edges.
function mask(image){if(masks.has(image))return masks.get(image);const c=canvas(image.width,image.height),ctx=c.getContext('2d');ctx.drawImage(image,0,0);const raw=ctx.getImageData(0,0,c.width,c.height),d=raw.data,depth=Math.max(2,Math.round(c.height*.014));for(let x=0;x<c.width;x++){let top=-1;for(let y=0;y<c.height;y++){const i=(y*c.width+x)*4,alpha=d[i+3];if(top<0&&alpha>100)top=y;const a=top>=0&&y-top<depth?alpha*(1-(y-top)/depth):0;d[i]=239;d[i+1]=242;d[i+2]=230;d[i+3]=a;}}ctx.putImageData(raw,0,0);masks.set(image,c);return c;}
function snow(c,im,amount,...args){if(amount<.005||!im)return;c.save();c.globalAlpha*=Math.min(.9,amount);c.drawImage(mask(im),...args);c.restore();}
// Rain uses viewport CSS pixels, before the shared world lighting pass.
function rainProfile(s){const E=typeof module==='object'?require('./environment.js'):globalThis.ForestEnvironment,r=Math.max(0,Math.min(1,E.precipitation(s,'rain')));return {intensity:r,count:Math.round(100*r*(s.settings.reducedMotion?.3:1)),length:9+13*r,width:.8+.8*r,alpha:.38+.24*r,speed:220+160*r};}
function rain(c,s,w,h,t){const p=rainProfile(s);if(!p.count||w<=0||h<=0)return;
 // 0.8.1 (user: "비도 지금 너무 정갈하게 떨어져"): every streak has its own speed, length and ink; each time a streak
 // starts over it comes down at a new place; the slant sways with the gusts. Deterministic from the time (no RNG state).
 const time=s.settings.reducedMotion?0:t,hs=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);},cw=Math.cos(s.weather.wind_dir||0),dx0=(3+s.weather.wind*.08)*cw,drift=(20+s.weather.wind*.6)*cw,gust=1+.35*Math.sin(time*.7)+.2*Math.sin(time*1.9+1.3);
 c.save();c.lineCap='round';
 for(let i=0;i<p.count;i++){const r1=hs(i+1),r2=hs(i+2.5),depth=.74+.26*hs(i+4.2),L=p.length*depth*(.55+.8*hs(i+7.7)),period=h+L+40,pos=hs(i+9.1)*period+time*p.speed*depth*(.78+.44*r1),cyc=Math.floor(pos/period),y=pos-cyc*period-L-20;
  const x=((hs(i*3.7+cyc*17.3)*w+time*drift*(.8+.4*r2))%w+w)%w,dx=dx0*depth*gust*(.75+.5*r2);
  c.beginPath();c.moveTo(x,y);c.lineTo(x-dx,y+L);const a=p.alpha*depth*(.55+.6*hs(i+5.3));
  c.strokeStyle='#527b83';c.lineWidth=p.width*depth+.65;c.globalAlpha=Math.min(1,a)*.32;c.stroke();
  c.strokeStyle='#e8f0eb';c.lineWidth=p.width*depth*(.8+.4*r1);c.globalAlpha=Math.min(1,a);c.stroke();
 }c.restore();
}
function particles(c,s,w,h,t,assets,area=1){const E=typeof module==='object'?require('./environment.js'):globalThis.ForestEnvironment,reduced=s.settings.reducedMotion,factor=reduced?.3:1,rain=E.precipitation(s,'rain'),snowfall=E.precipitation(s,'snow');const nr=Math.round(100*rain*factor),ns=Math.max(0,Math.min(Math.round(70*snowfall*factor*area),Math.round(120*area)-nr));c.save();c.fillStyle='#f7f8ed';for(let i=0;i<ns;i++){const x=((i*79.3+Math.sin(t*.8+i)*8+t*s.weather.wind*.20)%w+w)%w,y=(i*117.7+t*(12+i%13))%h;c.globalAlpha=.5+(i%4)*.1;c.beginPath();c.arc(x,y,.9+(i%3)*.4,0,Math.PI*2);c.fill();}if(s.weather.wind>=40&&assets?.terrain){const count=Math.max(0,Math.min(Math.round((s.weather.wind>=70?12:5)*factor*area),Math.round(120*area)-nr-ns));for(let i=0;i<count;i++){const x=((i*93.7+t*s.weather.wind*.6)%w+w)%w,y=(i*71.3+Math.sin(t+i)*14)%h;c.save();c.translate(x,y);c.rotate(t*(.5+i%3)+i);c.globalAlpha=.35;c.drawImage(assets.terrain,733,689,132,68,-4,-2,8,4);c.restore();}}c.restore();}
// 1.1.4 (렉 줄이기): the whole-frame CSS filter (brightness/saturate) was ~65% of a frame's drawing. The same light is
// now made with plain composites that the GPU does cheaply: brightness below 1 multiplies by a grey, above 1 adds the
// picture again with 'lighter' (x·b exactly), and saturation below 1 lays grey with the 'saturation' blend at 1−s.
// Saturation above 1 (at most 1.05, a summer noon) is left as it is.
function light(c,s,w,h,src){const E=typeof module==='object'?require('./environment.js'):globalThis.ForestEnvironment,p=E.lighting(s),b=p.brightness,sat=p.saturation;c.save();
 if(b<.995){const v=Math.round(255*b);c.globalCompositeOperation='multiply';c.fillStyle=`rgb(${v},${v},${v})`;c.fillRect(0,0,w,h);}
 else if(b>1.005&&src){c.globalCompositeOperation='lighter';c.globalAlpha=Math.min(1,b-1);c.drawImage(src,0,0,w,h);c.globalAlpha=1;}
 if(sat<.995){c.globalCompositeOperation='saturation';c.globalAlpha=1-sat;c.fillStyle='#808080';c.fillRect(0,0,w,h);c.globalAlpha=1;}
 c.globalCompositeOperation='source-over';for(const t of p.tints){if(t.alpha<=0)continue;c.fillStyle=`rgba(${t.color.map(Math.round).join(',')},${t.alpha})`;c.fillRect(0,0,w,h);}c.restore();}
function grade(c,buffer,s,w,h){c.drawImage(buffer,0,0,w,h);light(c,s,w,h,buffer);}
// the world was drawn straight onto c: light it in place (no second full-screen copy; brighter than 1 re-adds c itself)
function gradeOver(c,s,w,h){light(c,s,w,h,c.canvas);}
// 1.2.8 안개 (user: "인게임 안개 연출은 안개 느낌이 안듦" → 시안 C(먹빛 안개 덩어리) → "시야가 너무 안나오고 … 번지기" → "섞어봐" →
// "좋네"): a thin haze of a few large, very soft wisps drifting over everything, and thicker wisps gathered at the screen edges,
// with the middle kept clear. Screen space, after the lighting. The wisps are baked once (blur only while baking) and each frame
// is a dozen and a half drawImage calls. Render only; still when motion is reduced.
const frnd=(i,k)=>{const v=Math.sin(i*91.7+k*13.3)*43758.5453;return v-Math.floor(v);};
const WISP=200,wisps=[];
function wisp(n){if(wisps[n])return wisps[n];const W=WISP*1.8,H=WISP*.75,cx=W/2,cy=H/2,raw=canvas(W,H),c=raw.getContext('2d');
 const blob=(x,y,w,h,a,col)=>{const r=w/2,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${col},${a})`);g.addColorStop(.55,`rgba(${col},${a*.55})`);g.addColorStop(1,`rgba(${col},0)`);c.save();c.translate(x,y);c.scale(1,h/w);c.translate(-x,-y);c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.restore();};
 blob(cx,cy+WISP*.08,WISP*1.1,WISP*.26,.1,'124,142,150');
 for(let k=0;k<8;k++){const a=frnd(n*8+k,3)*6.28,d=WISP*.38*frnd(n*8+k,4);blob(cx+Math.cos(a)*d,cy+Math.sin(a)*d*.3,WISP*(.35+.4*frnd(n*8+k,5)),WISP*.17,.3,'252,252,250');}
 const out=canvas(W,H),o=out.getContext('2d');if('filter' in o){o.filter='blur(13px)';}o.drawImage(raw,0,0);wisps[n]=out;return out;}
const HAZE=[...Array(5)].map((_,i)=>({x:frnd(i,1)*1.2-.1,y:.08+frnd(i,2)*.88,v:.004+frnd(i,7)*.006,n:i%3,k:.7+frnd(i,3)*.6}));
const EDGE=[...Array(12)].map((_,i)=>{const sd=i%4,r1=frnd(i+40,1),r2=frnd(i+40,2);const [x,y]=sd===0?[r1,.03+r2*.12]:sd===1?[r1,.88+r2*.1]:sd===2?[-.1+r2*.16,r1]:[.94+r2*.16,r1];return {x,y,a:frnd(i+40,3)*6.28,n:(i+1)%3,k:.7+frnd(i+40,6)*.6};});
function fog(c,s,w,h,t){const E=typeof module==='object'?require('./environment.js'):globalThis.ForestEnvironment,amt=Math.min(1,Math.max(0,E.precipitation(s,'fog'))/.7);if(amt<=.01)return;
 const still=s.settings.reducedMotion,tt=still?0:t;c.save();c.globalCompositeOperation='multiply';c.fillStyle=`rgba(190,200,202,${.22*amt})`;c.fillRect(0,0,w,h);c.restore();
 const put=(p,size,alpha,x,y)=>{const im=wisp(p.n),dw=size*p.k*w*1.8,dh=size*p.k*w*.75;c.globalAlpha=alpha;c.drawImage(im,x*w-dw/2,y*h-dh/2,dw,dh);};
 c.save();for(const p of HAZE){const x=((p.x+tt*p.v+.4)%1.7+1.7)%1.7-.4;put(p,.7,.9*amt,x,p.y);}
 for(const p of EDGE)put(p,.44,amt,p.x+Math.sin(tt*.07+p.a)*.02,p.y+Math.cos(tt*.05+p.a)*.01);c.restore();}
return {canvas,snow,mask,rainProfile,rain,particles,grade,gradeOver,fog};
});
