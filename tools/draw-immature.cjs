// 0.6.38: young stages of the small neighbours, drawn in the style of the SRS v2.22 D04.20 'small neighbours' sheet
// (soft watercolor fills, warm-brown outline, paper grain, dark round eyes with a white highlight), like the springtail.
//  spidermite-eggs.png   잎응애 알: a little cluster of round, glossy, pale straw-coloured eggs
//  spidermite-nymph.png  잎응애 어린 개체: rounder, paler body, no dark side spots, short legs
//  root-gnat-eggs.png    뿌리날파리 알: tiny pearly ovals on the litter
//  mealybug-crawler.png  솜깍지 어린 개체(이동기): small flat peach oval, barely any wax yet, six short legs
//  ladybird-larva.png    점박이 유충 (Cryptolaemus larva): covered in long white wax curls, dark legs underneath
// Output: app/src/main/assets/web/assets/forest/creatures/*.png, facing left like the sheet art (drawn facing right, mirrored). Usage: node tools/draw-immature.cjs
const fs=require('node:fs'),path=require('node:path');const {createCanvas}=require('@napi-rs/canvas');
const out=path.resolve(__dirname,'../app/src/main/assets/web/assets/forest/creatures');
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const OUTLINE='rgba(110,82,68,.85)';
function grain(c,W,H,amt=14){const g=c.getImageData(0,0,W,H),d=g.data;for(let i=0;i<d.length;i+=4){if(d[i+3]<10)continue;const n=(rnd()-.5)*amt;d[i]+=n;d[i+1]+=n;d[i+2]+=n;}c.putImageData(g,0,0);}
function blob(c,x,y,rx,ry,rot,inner,outer,alpha=1){c.save();c.translate(x,y);c.rotate(rot);c.scale(1,ry/rx);const g=c.createRadialGradient(-rx*.28,-rx*.36,rx*.08,0,0,rx);g.addColorStop(0,inner);g.addColorStop(.75,outer);g.addColorStop(1,outer);c.globalAlpha=alpha;c.fillStyle=g;c.beginPath();c.arc(0,0,rx,0,Math.PI*2);c.fill();c.restore();}
// a soft warm outline around a set of ellipses (drawn as one silhouette with a blurred dark shadow)
function outlined(c,W,H,shapes,fill,blur=3){const sil=createCanvas(W,H),sc=sil.getContext('2d');sc.fillStyle='#000';for(const [x,y,rx,ry,r=0] of shapes){sc.beginPath();sc.ellipse(x,y,rx,ry,r,0,Math.PI*2);sc.fill();}
 c.save();c.shadowColor=OUTLINE;c.shadowBlur=blur;c.globalAlpha=.9;c.drawImage(sil,0,0);c.restore();c.save();c.filter='blur(.6px)';for(const s of shapes)fill(s);c.restore();}
function limb(c,pts,w,color,edge='rgba(120,96,70,.55)'){c.save();c.lineCap='round';c.lineJoin='round';for(const [col,add] of [[edge,2.2],[color,0]]){c.strokeStyle=col;for(let k=0;k<pts.length-1;k++){c.lineWidth=w*(1-k*.3)+add;c.beginPath();c.moveTo(...pts[k]);c.lineTo(...pts[k+1]);c.stroke();}}c.fillStyle=color;for(let k=1;k<pts.length-1;k++){c.beginPath();c.arc(...pts[k],w*.55,0,Math.PI*2);c.fill();}c.restore();}
function eye(c,x,y,r){c.fillStyle='#2b2320';c.beginPath();c.ellipse(x,y,r*.85,r,0,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(x+r*.32,y-r*.38,r*.32,0,Math.PI*2);c.fill();}
function glossy(c,x,y,rx,ry,inner,outer){blob(c,x,y,rx,ry,0,inner,outer);c.save();c.globalAlpha=.8;c.fillStyle='#fffaf0';c.beginPath();c.ellipse(x-rx*.32,y-ry*.38,rx*.22,ry*.16,-.5,0,Math.PI*2);c.fill();c.restore();}
function save(name,W,H,draw){seed=7+name.length;const cv=createCanvas(W,H),c=cv.getContext('2d');draw(c,W,H);grain(c,W,H);
 const d=c.getImageData(0,0,W,H).data;let x0=W,y0=H,x1=0,y1=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>8){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 const pad=2,w=x1-x0+1+pad*2,h=y1-y0+1+pad*2,o=createCanvas(w,h),oc=o.getContext('2d');oc.translate(w,0);oc.scale(-1,1);oc.drawImage(cv,x0-pad,y0-pad,w,h,0,0,w,h);fs.writeFileSync(path.join(out,name+'.png'),o.toBuffer('image/png'));console.log(name,w,h);}

// 잎응애 알: six round eggs in a loose cluster, each with a soft shadow and a glossy highlight
save('spidermite-eggs',200,120,(c)=>{const E=[[60,70],[92,62],[124,70],[76,92],[108,90],[140,92]];
 for(const [x,y] of E){c.save();c.globalAlpha=.25;c.filter='blur(3px)';c.fillStyle='#7b6a4a';c.beginPath();c.ellipse(x+3,y+12,16,6,0,0,Math.PI*2);c.fill();c.restore();}
 outlined(c,200,120,E.map(([x,y])=>[x,y,15,15]),([x,y])=>glossy(c,x,y,15,15,'#fbf3d2','#d8c88e'),2.5);});

// 잎응애 어린 개체: like the adult but rounder, paler, smaller legs and no dark spots
save('spidermite-nymph',240,170,(c)=>{const LEG='#e3dcae';
 for(const [x,y,dx,dy] of [[88,96,-44,-26],[80,108,-50,-4],[82,120,-46,20],[94,128,-32,36]]){limb(c,[[x,y],[x+dx*.5,y+dy*.4-10],[x+dx,y+dy]],7,LEG);limb(c,[[240-x,y],[240-x-dx*.5,y+dy*.4-10],[240-x-dx,y+dy]],7,LEG);}
 outlined(c,240,170,[[120,104,46,40]],([x,y,rx,ry])=>blob(c,x,y,rx,ry,0,'#f8f6da','#d5d09a'),3);
 c.save();c.globalAlpha=.3;c.filter='blur(5px)';c.fillStyle='#a9a46a';c.beginPath();c.ellipse(124,128,36,10,0,0,Math.PI*2);c.fill();c.restore();
 c.save();c.globalAlpha=.5;c.filter='blur(4px)';c.fillStyle='#fffcea';c.beginPath();c.ellipse(108,84,22,10,-.3,0,Math.PI*2);c.fill();c.restore();
 eye(c,138,104,4.8);eye(c,158,106,4.4);});

// 뿌리날파리 알: five tiny pearly ovals on the litter
save('root-gnat-eggs',170,90,(c)=>{const E=[[50,50,-.4],[74,44,.3],[98,52,-.1],[64,64,.5],[90,66,-.6]];
 for(const [x,y] of E){c.save();c.globalAlpha=.22;c.filter='blur(2px)';c.fillStyle='#6b5642';c.beginPath();c.ellipse(x+2,y+7,11,4,0,0,Math.PI*2);c.fill();c.restore();}
 outlined(c,170,90,E.map(([x,y,r])=>[x,y,11,7,r]),([x,y,rx,ry,r])=>{c.save();c.translate(x,y);c.rotate(r);glossy(c,0,0,rx,ry,'#fffdf6','#e2d9c8');c.restore();},2);});

// 솜깍지 어린 개체: a flat peach oval with faint segments, a thin dusting of wax, short legs and antennae
save('mealybug-crawler',240,150,(c)=>{const LEG='#b88a6e';
 for(const x of [96,120,144]){limb(c,[[x,96],[x-6,112],[x-10,122]],5,LEG);}
 limb(c,[[172,80],[192,62],[204,56]],4,LEG);limb(c,[[174,86],[198,78],[210,78]],4,LEG);
 outlined(c,240,150,[[118,82,62,30],[168,82,22,22]],([x,y,rx,ry])=>blob(c,x,y,rx,ry,0,'#fde3cf','#e7b49a'),3);
 c.strokeStyle='rgba(170,112,90,.35)';c.lineWidth=2;for(let i=0;i<5;i++){const x=78+i*18;c.beginPath();c.ellipse(x,82,6,25,0,-Math.PI/2,Math.PI/2);c.stroke();}
 c.save();c.globalAlpha=.55;c.filter='blur(1.5px)';c.fillStyle='#fffaf6';for(let i=0;i<18;i++){const x=70+rnd()*100,y=60+rnd()*24;c.beginPath();c.arc(x,y,2+rnd()*2.5,0,Math.PI*2);c.fill();}c.restore();
 eye(c,176,78,4.2);});

// 점박이 유충 (Cryptolaemus larva): a long body hidden under long white wax curls; a dark head peeks out with legs below
save('ladybird-larva',360,220,(c)=>{const LEG='#4a3a34';
 for(const x of [140,178,216]){limb(c,[[x,136],[x-6,156],[x-14,168]],6,LEG,'rgba(40,28,24,.6)');}
 outlined(c,360,220,[[276,122,24,21]],([x,y,rx,ry])=>blob(c,x,y,rx,ry,0,'#7c6658','#4a3a34'),3);eye(c,284,118,5);
 outlined(c,360,220,[[178,116,96,36]],([x,y,rx,ry])=>blob(c,x,y,rx,ry,0,'#fbf7ef','#e3d9c9'),3);
 // wax: soft curling tufts of uneven length, slightly random, over a fluffy back (Cryptolaemus larvae look like big mealybugs)
 const tuft=(x,y,len,ang,curl)=>{c.save();c.translate(x,y);c.rotate(ang);c.lineCap='round';for(let k=0;k<2;k++){c.strokeStyle=k?'#fffdf8':'rgba(150,128,110,.5)';c.lineWidth=k?8:11;c.beginPath();c.moveTo(0,0);c.bezierCurveTo(len*.4,-curl*.6,len*.8,curl*.2,len,curl);c.stroke();}c.restore();};
 for(let i=0;i<11;i++){const x=94+i*16+(rnd()-.5)*6,top=Math.sin(i/10*Math.PI);tuft(x,96-top*8,22+top*12+rnd()*8,-Math.PI/2-.55+i*.1+(rnd()-.5)*.2,(rnd()-.5)*14+6);}
 for(let i=0;i<10;i++){const x=98+i*17+(rnd()-.5)*6;tuft(x,134,16+rnd()*8,Math.PI/2+.5-i*.1,(rnd()-.5)*10);}
 for(let i=0;i<14;i++){const x=96+rnd()*160,y=100+rnd()*26;c.save();c.filter='blur(1px)';blob(c,x,y,10+rnd()*5,8+rnd()*4,0,'#ffffff','#eee6d8');c.restore();}
 tuft(88,112,22,Math.PI+.25,-6);tuft(88,102,20,Math.PI-.35,6);});
