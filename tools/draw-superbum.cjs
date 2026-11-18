// 슈퍼범 (Platycerium superbum) in the forest's character style (wide, low, soft watercolour shapes like 리들리·엘리시·엘레판):
// a wide, slightly lopsided brown body with two short cream eyes and two small feet; behind it a tall nest (shield) frond
// with a softly lobed top that wraps the back of the head and opens into a basket; a lower front rim of the same frond
// curls over the crown so rain held in the basket shows only as a thin glint; and two broad, pendant antler fronds that
// hang from under the rim and divide into rounded lobes (the left one longer — the species hangs unevenly).
// No outlines; paper grain. Rig layers on one 520x640 canvas (feet centre 262,592):
//   superbum-nest.png, superbum-water.png, superbum-foot-left/right.png, superbum-body.png, superbum-rim.png,
//   superbum-antler-left/right.png. superbum.png / superbum-full.png are previews (dry / holding rain).
const fs=require('node:fs'),path=require('node:path');const {createCanvas}=require('@napi-rs/canvas');
const out=path.resolve(__dirname,'../app/src/main/assets/web/assets/forest/species');const W=520,H=640;
let seed=23;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const layer=draw=>{const cv=createCanvas(W,H),c=cv.getContext('2d');draw(c);return cv;};
const soft=(c,f,b)=>{c.save();c.filter=`blur(${b}px)`;f();c.restore();};
function paper(c,dark,light,n){c.save();c.globalCompositeOperation='source-atop';for(let i=0;i<n;i++){const x=rnd()*W,y=rnd()*H,r=.6+rnd()*2.4;c.fillStyle=rnd()<.5?dark:light;c.globalAlpha=.04+rnd()*.08;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}c.restore();}
function shade(c,f){c.save();c.globalCompositeOperation='source-atop';f();c.restore();}
const bez=(p0,p1,p2,p3,n=24)=>Array.from({length:n},(_,i)=>{const t=i/(n-1),u=1-t;return [u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0],u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]];});
// a filled leaf strap along a centre line with width w(t), rounded tip
function strapPath(c,pts,w){const dense=[];for(let i=1;i<pts.length;i++)for(let k=0;k<6;k++){const t=k/6;dense.push([pts[i-1][0]+(pts[i][0]-pts[i-1][0])*t,pts[i-1][1]+(pts[i][1]-pts[i-1][1])*t,(i-1+t)/(pts.length-1)]);}dense.push([...pts[pts.length-1],1]);
 for(const [x,y,t] of dense){c.moveTo(x+w(t)/2,y);c.arc(x,y,w(t)/2,0,Math.PI*2);}}
function strapPathOld(c,pts,w){const L=[],R=[];for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d,ww=w(i/(pts.length-1))/2;L.push([pts[i][0]+nx*ww,pts[i][1]+ny*ww]);R.push([pts[i][0]-nx*ww,pts[i][1]-ny*ww]);}
 c.moveTo(...L[0]);for(const p of L)c.lineTo(...p);const e=pts[pts.length-1],ww=w(1)/2,a=Math.atan2(R[R.length-1][1]-e[1],R[R.length-1][0]-e[0]);c.arc(e[0],e[1],ww,a+Math.PI,a,false);for(const p of R.reverse())c.lineTo(...p);c.closePath();}
// ---------- nest frond: tall, softly lobed, a little asymmetric; dark basket inside at the crown ----------
const nestShape=c=>{c.beginPath();c.moveTo(118,372);c.bezierCurveTo(96,300,104,232,128,196);c.bezierCurveTo(118,156,150,120,186,128);c.bezierCurveTo(190,86,236,60,270,82);
 c.bezierCurveTo(300,52,350,66,356,108);c.bezierCurveTo(392,104,420,140,408,180);c.bezierCurveTo(436,214,430,290,410,372);c.bezierCurveTo(340,394,190,394,118,372);c.closePath();};
const nest=layer(c=>{soft(c,()=>{const g=c.createLinearGradient(220,60,300,390);g.addColorStop(0,'#d3d9a2');g.addColorStop(.5,'#b7c27f');g.addColorStop(1,'#98a663');c.fillStyle=g;nestShape(c);c.fill();},1.4);
 paper(c,'rgba(92,108,54,1)','rgba(248,246,216,1)',1600);
 shade(c,()=>{soft(c,()=>{c.fillStyle='rgba(255,252,226,.30)';c.beginPath();c.ellipse(208,150,70,40,-.5,0,Math.PI*2);c.fill();c.fillStyle='rgba(84,98,48,.22)';c.beginPath();c.ellipse(388,250,40,120,.1,0,Math.PI*2);c.fill();},10);
  soft(c,()=>{c.strokeStyle='rgba(246,246,214,.5)';c.lineWidth=2.6;c.lineCap='round';for(const [x,y] of [[140,210],[186,140],[262,96],[330,96],[386,170],[404,250]]){c.beginPath();c.moveTo(262,336);c.quadraticCurveTo((262+x)/2+(x<262?14:-14),(336+y)/2+20,x+(262-x)*.12,y+26);c.stroke();}},.7);
  soft(c,()=>{c.fillStyle='rgba(64,74,36,.42)';c.beginPath();c.ellipse(266,336,124,30,0,0,Math.PI*2);c.fill();},6);});});
// rain in the basket: a flat sheet whose front edge sits just above the rim; only shown while the nest really holds water
const water=layer(c=>{soft(c,()=>{const g=c.createLinearGradient(262,318,262,346);g.addColorStop(0,'rgba(198,228,222,.96)');g.addColorStop(1,'rgba(118,170,172,.94)');c.fillStyle=g;c.beginPath();c.ellipse(266,334,116,17,0,0,Math.PI*2);c.fill();},1.2);
 c.save();c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=2.6;c.lineCap='round';c.beginPath();c.ellipse(246,330,60,6,0,Math.PI*1.1,Math.PI*1.7);c.stroke();c.restore();});
// ---------- body: wide and low, crown higher on the left, flat-ish base ----------
const bodyShape=c=>{c.beginPath();c.moveTo(126,512);c.bezierCurveTo(116,420,170,350,258,348);c.bezierCurveTo(346,346,404,400,404,482);c.bezierCurveTo(406,548,372,580,300,584);c.lineTo(218,584);c.bezierCurveTo(152,582,130,560,126,512);c.closePath();};
const body=layer(c=>{soft(c,()=>{const g=c.createLinearGradient(190,350,330,584);g.addColorStop(0,'#81695a');g.addColorStop(.6,'#6f5949');g.addColorStop(1,'#5b483b');c.fillStyle=g;bodyShape(c);c.fill();},1.1);
 paper(c,'rgba(50,36,28,1)','rgba(176,152,128,1)',2000);
 shade(c,()=>soft(c,()=>{c.fillStyle='rgba(255,236,214,.12)';c.beginPath();c.ellipse(208,420,64,44,-.5,0,Math.PI*2);c.fill();c.fillStyle='rgba(36,26,20,.22)';c.beginPath();c.ellipse(320,570,120,40,0,0,Math.PI*2);c.fill();},12));
 c.save();c.lineCap='round';c.strokeStyle='#eee2ca';c.lineWidth=8.5;for(const [x,y] of [[282,452],[324,450]]){c.beginPath();c.moveTo(x,y);c.lineTo(x-2,y+22);c.stroke();}c.restore();});
// ---------- front rim of the nest frond: a soft leaf band draped over the crown, lower on the right ----------
const rimShape=c=>{c.beginPath();c.moveTo(122,360);c.bezierCurveTo(170,334,230,344,270,346);c.bezierCurveTo(320,348,370,330,414,352);c.bezierCurveTo(424,370,414,392,396,394);
 c.bezierCurveTo(352,380,318,398,270,398);c.bezierCurveTo(222,398,180,384,140,392);c.bezierCurveTo(118,390,110,372,122,360);c.closePath();};
const rim=layer(c=>{soft(c,()=>{const g=c.createLinearGradient(262,336,262,398);g.addColorStop(0,'#cbd396');g.addColorStop(1,'#a0ad6a');c.fillStyle=g;rimShape(c);c.fill();},1.1);paper(c,'rgba(92,108,54,1)','rgba(248,246,216,1)',600);
 shade(c,()=>soft(c,()=>{c.strokeStyle='rgba(252,252,226,.75)';c.lineWidth=3;c.beginPath();c.moveTo(136,364);c.bezierCurveTo(200,342,330,342,404,358);c.stroke();c.fillStyle='rgba(70,82,40,.22)';c.beginPath();c.ellipse(270,398,150,10,0,0,Math.PI*2);c.fill();},1.4));});
// ---------- antler fronds: broad pendant straps that divide into rounded lobes ----------
function antler(s,long){const X=x=>262+s*x;return layer(c=>{
 const main=bez([X(100),368],[X(156),374],[X(176),410],[X(172),462+long*.4]),fork=main[main.length-1];
 const a=bez(fork,[X(172),500+long*.6],[X(162),530+long],[X(158),556+long]),b=bez(fork,[X(194),484+long*.5],[X(208),498+long*.6],[X(212),512+long*.7]),bb=b[b.length-1];
 const b1=bez(bb,[X(214),526+long*.7],[X(212),538+long*.8],[X(208),550+long*.8]),b2=bez(bb,[X(224),522+long*.7],[X(232),528+long*.7],[X(238),536+long*.7]);
 const g=c.createLinearGradient(0,360,0,620);g.addColorStop(0,'#b4bf7c');g.addColorStop(1,'#93a25e');
 soft(c,()=>{c.fillStyle=g;c.beginPath();strapPath(c,main,t=>62-10*t);strapPath(c,a,t=>48-8*t);strapPath(c,b,t=>42-6*t);strapPath(c,b1,t=>32-4*t);strapPath(c,b2,t=>28-4*t);c.fill('nonzero');},1);
 paper(c,'rgba(76,90,44,1)','rgba(240,242,204,1)',900);
 shade(c,()=>{soft(c,()=>{c.fillStyle='rgba(66,78,38,.25)';c.beginPath();c.ellipse(X(118),382,40,14,0,0,Math.PI*2);c.fill();},6);
  soft(c,()=>{c.strokeStyle='rgba(244,246,212,.5)';c.lineWidth=2.2;c.lineCap='round';for(const p of [main.slice(3).concat(a.slice(1,-3))]){c.beginPath();c.moveTo(...p[0]);for(const q of p.slice(1,-2))c.lineTo(...q);c.stroke();}},.6);});});}
const antlerL=antler(-1,10),antlerR=antler(1,-14);
const foot=x=>layer(c=>{soft(c,()=>{const g=c.createLinearGradient(x,580,x,604);g.addColorStop(0,'#6c5545');g.addColorStop(1,'#4f3d33');c.fillStyle=g;c.beginPath();c.ellipse(x,592,26,13,0,0,Math.PI*2);c.fill();},1);paper(c,'rgba(40,28,22,1)','rgba(160,136,116,1)',200);});
const footL=foot(216),footR=foot(312);
const files={nest,water,'foot-left':footL,'foot-right':footR,body,rim,'antler-left':antlerL,'antler-right':antlerR};
for(const f of fs.readdirSync(out))if(/^superbum-(lip)\.png$/.test(f))fs.unlinkSync(path.join(out,f));
for(const [k,cv] of Object.entries(files))fs.writeFileSync(path.join(out,'superbum-'+k+'.png'),cv.toBuffer('image/png'));
const ORDER=['foot-left','foot-right','body','rim','antler-left','antler-right'];
const comp=withWater=>{const cv=createCanvas(W,H),c=cv.getContext('2d');c.drawImage(nest,0,0);if(withWater)c.drawImage(water,0,0);for(const k of ORDER)c.drawImage(files[k],0,0);return cv;};
fs.writeFileSync(path.join(out,'superbum.png'),comp(false).toBuffer('image/png'));fs.writeFileSync(path.join(out,'superbum-full.png'),comp(true).toBuffer('image/png'));console.log('ok');
