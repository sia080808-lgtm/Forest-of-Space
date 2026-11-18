// 슈퍼범 (Platycerium superbum), deformed to the forest's chibi style: a few large, clean silhouettes and no line detail,
// like 리들리·엘리시·엘레판. A soft brown mound body with two short cream eyes and two small feet; behind it one big nest
// frond with three rounded lobes that opens into a basket over the head; a smooth front rim of that frond over the crown
// (rain in the basket shows between frond and rim); and two pendant antler fronds, each a single leaf with a forked,
// two-lobed tip (the left one longer). Rig layers on one 520x640 canvas (feet centre 262,594):
//   superbum-nest, -water, -foot-left/right, -body, -rim, -antler-left/right (.png). superbum.png / superbum-full.png = previews.
const fs=require('node:fs'),path=require('node:path');const {createCanvas}=require('@napi-rs/canvas');
const out=path.resolve(__dirname,'../app/src/main/assets/web/assets/forest/species');const W=520,H=640;
let seed=23;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const layer=draw=>{const cv=createCanvas(W,H),c=cv.getContext('2d');draw(c);return cv;};
const soft=(c,f,b)=>{c.save();c.filter=`blur(${b}px)`;f();c.restore();};
const atop=(c,f)=>{c.save();c.globalCompositeOperation='source-atop';f();c.restore();};
function paper(c,dark,light,n){atop(c,()=>{for(let i=0;i<n;i++){const x=rnd()*W,y=rnd()*H,r=.5+rnd()*1.8;c.fillStyle=rnd()<.5?dark:light;c.globalAlpha=.03+rnd()*.06;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}});}
function fill(c,shape,x0,y0,x1,y1,stops){const g=c.createLinearGradient(x0,y0,x1,y1);stops.forEach(([o,col])=>g.addColorStop(o,col));c.fillStyle=g;shape(c);c.fill();}
const blob=(c,x,y,rx,ry,col,b,rot=0)=>soft(c,()=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,rot,0,Math.PI*2);c.fill();},b);
const LEAF=[[0,'#cbd497'],[.6,'#b0bc78'],[1,'#98a663']];
// ---------- nest frond: three big rounded lobes, a clean fan ----------
const nestShape=c=>{c.beginPath();c.moveTo(150,384);
 c.bezierCurveTo(96,360,70,286,104,236);c.bezierCurveTo(98,186,150,158,190,176);        // left lobe, low and wide
 c.bezierCurveTo(200,120,262,104,292,136);                                              // middle lobe, the highest
 c.bezierCurveTo(334,116,392,138,398,186);c.bezierCurveTo(446,204,452,290,410,346);     // right lobe
 c.bezierCurveTo(396,370,380,384,360,388);c.bezierCurveTo(290,396,210,396,150,384);c.closePath();};
const nest=layer(c=>{fill(c,nestShape,200,110,300,390,LEAF);paper(c,'rgba(92,108,54,1)','rgba(248,246,216,1)',1400);
 atop(c,()=>{blob(c,200,200,84,44,'rgba(255,252,228,.30)',16,-.45);blob(c,410,290,40,90,'rgba(84,98,48,.16)',16);blob(c,262,360,130,30,'rgba(62,72,34,.30)',10);});});
const water=layer(c=>{soft(c,()=>{fill(c,c2=>{c2.beginPath();c2.ellipse(262,352,118,15,-.06,0,Math.PI*2);},0,330,0,362,[[0,'#cde7e1'],[1,'#86b8b8']]);},1.2);
 blob(c,232,349,44,3.2,'rgba(255,255,255,.85)',1.2);});
// ---------- body: soft mound, crown a little higher on the left ----------
const bodyShape=c=>{c.beginPath();c.moveTo(132,520);c.bezierCurveTo(120,430,172,356,262,354);c.bezierCurveTo(350,352,404,416,400,500);
 c.bezierCurveTo(398,560,360,588,262,588);c.bezierCurveTo(170,588,136,566,132,520);c.closePath();};
const body=layer(c=>{fill(c,bodyShape,200,354,320,588,[[0,'#7f6857'],[.6,'#6e5848'],[1,'#5c493c']]);paper(c,'rgba(50,36,28,1)','rgba(176,152,128,1)',1800);
 atop(c,()=>{blob(c,206,420,66,44,'rgba(255,236,214,.12)',14,-.5);blob(c,322,578,130,40,'rgba(36,26,20,.2)',14);});
 c.save();c.lineCap='round';c.strokeStyle='#eee2ca';c.lineWidth=9;for(const x of [282,322]){c.beginPath();c.moveTo(x,456);c.lineTo(x-2,478);c.stroke();}c.restore();});
// ---------- front rim: one smooth leaf band over the crown ----------
const rimShape=c=>{c.beginPath();c.moveTo(124,388);c.bezierCurveTo(170,350,300,350,372,356);c.bezierCurveTo(410,360,432,382,420,410);  // drapes lower on the right
 c.bezierCurveTo(412,432,396,436,388,422);c.bezierCurveTo(372,396,320,386,262,390);c.bezierCurveTo(206,394,168,404,140,412);c.bezierCurveTo(118,416,110,398,124,388);c.closePath();};
const rim=layer(c=>{fill(c,rimShape,0,346,0,402,[[0,'#cdd59a'],[1,'#a3b06d']]);paper(c,'rgba(92,108,54,1)','rgba(248,246,216,1)',500);
 atop(c,()=>{blob(c,200,368,70,10,'rgba(255,252,228,.3)',6);blob(c,300,404,140,8,'rgba(64,76,36,.22)',5);});});
// ---------- antler frond: one pendant leaf, widening, tip forked into two round lobes ----------
function antler(s,long){const X=x=>262+s*x;return layer(c=>{const shape=c2=>{c2.beginPath();
  c2.moveTo(X(116),384);                                                                   // tucked under the rim
  c2.bezierCurveTo(X(172),384,X(206),430,X(214),470+long*.4);                               // outer edge
  c2.bezierCurveTo(X(222),510+long*.6,X(222),540+long,X(196),546+long);                     // outer lobe
  c2.bezierCurveTo(X(180),548+long,X(176),530+long,X(170),518+long*.8);                     // into the notch
  c2.bezierCurveTo(X(166),532+long,X(156),552+long,X(138),548+long);                         // inner lobe
  c2.bezierCurveTo(X(116),542+long,X(126),500+long*.6,X(132),470+long*.3);                   // inner edge
  c2.bezierCurveTo(X(138),446,X(132),418,X(108),406);c2.closePath();};
 fill(c,shape,0,370,0,560+long,[[0,'#b8c27f'],[1,'#93a25e']]);paper(c,'rgba(76,90,44,1)','rgba(240,242,204,1)',700);
 atop(c,()=>{blob(c,X(124),396,36,14,'rgba(62,74,36,.3)',7);blob(c,X(150),470,18,60,'rgba(255,252,228,.18)',10);});});}
const antlerL=antler(-1,12),antlerR=antler(1,-10);
const foot=x=>layer(c=>{fill(c,c2=>{c2.beginPath();c2.ellipse(x,594,26,13,0,0,Math.PI*2);},0,582,0,606,[[0,'#6c5545'],[1,'#4f3d33']]);paper(c,'rgba(40,28,22,1)','rgba(160,136,116,1)',150);});
const footL=foot(214),footR=foot(312);
const files={nest,water,'foot-left':footL,'foot-right':footR,body,rim,'antler-left':antlerL,'antler-right':antlerR};
for(const [k,cv] of Object.entries(files))fs.writeFileSync(path.join(out,'superbum-'+k+'.png'),cv.toBuffer('image/png'));
const ORDER=['foot-left','foot-right','body','rim','antler-left','antler-right'];
const comp=withWater=>{const cv=createCanvas(W,H),c=cv.getContext('2d');c.drawImage(nest,0,0);if(withWater)c.drawImage(water,0,0);for(const k of ORDER)c.drawImage(files[k],0,0);return cv;};
fs.writeFileSync(path.join(out,'superbum.png'),comp(false).toBuffer('image/png'));fs.writeFileSync(path.join(out,'superbum-full.png'),comp(true).toBuffer('image/png'));console.log('ok');
