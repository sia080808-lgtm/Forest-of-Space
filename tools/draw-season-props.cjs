// 0.8.1 사계절 풍경: small seasonal props in the ink-wash (수묵 담채) style of the game (soft low-saturation washes, ink
// strokes of varying weight, paper grain). Render only; the game scatters them over the ground and around the objects.
//  sprout-1   two round seed leaves on a short stem (봄 새싹)
//  sprout-2   a fern fiddlehead uncurling (고사리 새순)
//  sprout-3   a tuft of new grass blades
//  blossom    a plum-blossom petal cluster (매화 꽃잎), also used for falling petals
//  maple-1/2  maple leaves (단풍잎), muted vermilion / crimson wash with ink veins
//  ginkgo-1/2 ginkgo leaves (은행잎), ochre-yellow fans
//  snow-1/2   soft snow drifts: paper-white with a pale grey ink-wash shadow (snow is left as paper)
// Output: app/src/main/assets/web/assets/forest/seasons/props/*.png. Usage: node tools/draw-season-props.cjs
const fs=require('node:fs'),path=require('node:path');const {createCanvas}=require('@napi-rs/canvas');
const out=path.resolve(__dirname,'../app/src/main/assets/web/assets/forest/seasons/props');fs.mkdirSync(out,{recursive:true});
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const INK='rgba(58,52,44,.82)';
function grain(c,W,H,amt=12){const g=c.getImageData(0,0,W,H),d=g.data;for(let i=0;i<d.length;i+=4){if(d[i+3]<6)continue;const n=(rnd()-.5)*amt;d[i]+=n;d[i+1]+=n;d[i+2]+=n;}c.putImageData(g,0,0);}
// a wash: the shape filled with a soft gradient, a little bleed (blur) and a slightly darker pooled edge, like watercolour
function wash(c,shape,light,dark,blur=1.2){c.save();c.filter=`blur(${blur}px)`;shape();c.fillStyle=light;c.fill();c.restore();
 c.save();shape();c.clip();c.globalAlpha=.55;c.lineWidth=6;c.strokeStyle=dark;c.filter='blur(2.5px)';shape();c.stroke();c.restore();}
function stroke(c,pts,w,color=INK){c.save();c.lineCap='round';c.lineJoin='round';c.strokeStyle=color;for(let k=0;k<pts.length-1;k++){c.lineWidth=Math.max(.6,w*(1-k/pts.length*.7));c.beginPath();c.moveTo(...pts[k]);c.lineTo(...pts[k+1]);c.stroke();}c.restore();}
function save(name,W,H,draw){seed=11+name.length*7;const cv=createCanvas(W,H),c=cv.getContext('2d');draw(c,W,H);grain(c,W,H);
 const d=c.getImageData(0,0,W,H).data;let x0=W,y0=H,x1=0,y1=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>6){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 const pad=2,w=x1-x0+1+pad*2,h=y1-y0+1+pad*2,o=createCanvas(w,h);o.getContext('2d').drawImage(cv,x0-pad,y0-pad,w,h,0,0,w,h);fs.writeFileSync(path.join(out,name+'.png'),o.toBuffer('image/png'));console.log(name,w,h);}
const leafPath=(c,x,y,len,wid,ang)=>()=>{c.beginPath();c.save();c.translate(x,y);c.rotate(ang);c.moveTo(0,0);c.bezierCurveTo(len*.3,-wid,len*.8,-wid*.8,len,0);c.bezierCurveTo(len*.8,wid*.8,len*.3,wid,0,0);c.restore();};

// 봄 새싹: two seed leaves
save('sprout-1',120,120,c=>{stroke(c,[[60,104],[60,86],[61,68]],3.2,'rgba(84,92,58,.85)');
 for(const ang of [-2.55,-.6]){const s=leafPath(c,61,68,30,11,ang);wash(c,s,'rgba(170,192,128,.92)','rgba(112,140,80,.9)');c.save();c.globalAlpha=.6;s();c.lineWidth=1;c.strokeStyle='rgba(70,80,50,.7)';c.stroke();c.restore();}
 c.save();c.globalAlpha=.25;c.filter='blur(3px)';c.fillStyle='#6b6048';c.beginPath();c.ellipse(60,106,16,4,0,0,Math.PI*2);c.fill();c.restore();});
// 고사리 새순: a fiddlehead uncurling
save('sprout-2',120,140,c=>{const pts=[];for(let t=0;t<=1;t+=.04){const y=128-t*80,x=58+Math.sin(t*1.4)*6;pts.push([x,y]);}
 const cx=pts.at(-1)[0]+8,cy=pts.at(-1)[1];for(let a=0;a<=Math.PI*1.7;a+=.15){const r=11*(1-a/(Math.PI*2.2));pts.push([cx-Math.cos(a)*r,cy-Math.sin(a)*r]);}
 c.save();c.lineCap='round';c.strokeStyle='rgba(150,176,110,.9)';c.lineWidth=7;c.filter='blur(1px)';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.restore();
 stroke(c,pts,2.6,'rgba(66,74,46,.85)');
 for(const [t,s] of [[.35,1],[.55,-1],[.7,1]]){const p=pts[Math.round(t*20)];const l=leafPath(c,p[0],p[1],14,5,s>0?-.5:-2.6);wash(c,l,'rgba(178,198,136,.85)','rgba(120,146,86,.8)',.8);}
 c.save();c.globalAlpha=.22;c.filter='blur(3px)';c.fillStyle='#6b6048';c.beginPath();c.ellipse(58,130,14,4,0,0,Math.PI*2);c.fill();c.restore();});
// 새 풀
save('sprout-3',140,110,c=>{for(let i=0;i<7;i++){const x=40+i*10+rnd()*4,h=40+rnd()*36,bend=(rnd()-.5)*30;const pts=[[x,100],[x+bend*.3,100-h*.5],[x+bend,100-h]];
 c.save();c.lineCap='round';c.strokeStyle=`rgba(${150+rnd()*20},${178+rnd()*14},${112+rnd()*14},.85)`;c.lineWidth=5;c.filter='blur(.8px)';c.beginPath();c.moveTo(...pts[0]);c.quadraticCurveTo(...pts[1],...pts[2]);c.stroke();c.restore();
 c.save();c.lineCap='round';c.strokeStyle='rgba(74,84,52,.6)';c.lineWidth=1.2;c.beginPath();c.moveTo(...pts[0]);c.quadraticCurveTo(...pts[1],...pts[2]);c.stroke();c.restore();}
 c.save();c.globalAlpha=.2;c.filter='blur(3px)';c.fillStyle='#6b6048';c.beginPath();c.ellipse(70,102,34,5,0,0,Math.PI*2);c.fill();c.restore();});
// 매화 꽃잎
save('blossom',90,90,c=>{for(let k=0;k<5;k++){const a=k/5*Math.PI*2-Math.PI/2,x=45+Math.cos(a)*15,y=45+Math.sin(a)*15;const s=()=>{c.beginPath();c.ellipse(x,y,12,10,a,0,Math.PI*2);};wash(c,s,'rgba(240,206,204,.95)','rgba(214,150,152,.85)',1);}
 c.fillStyle='rgba(150,84,70,.8)';for(let k=0;k<8;k++){const a=k/8*Math.PI*2;c.beginPath();c.arc(45+Math.cos(a)*6,45+Math.sin(a)*6,1.3,0,Math.PI*2);c.fill();}
 c.fillStyle='rgba(206,160,72,.9)';c.beginPath();c.arc(45,45,3.2,0,Math.PI*2);c.fill();});
// 단풍잎: five pointed lobes
const maple=(c,cx,cy,R,light,dark)=>{const pts=[];for(let k=0;k<5;k++){const a=-Math.PI/2+(k-2)*.62,ra=R*(k===2?1:k===1||k===3?.9:.62);
  const tipx=cx+Math.cos(a)*ra,tipy=cy+Math.sin(a)*ra,b1=a-.3,b2=a+.3;pts.push([cx+Math.cos(b1)*ra*.42,cy+Math.sin(b1)*ra*.42],[cx+Math.cos(a-.12)*ra*.8,cy+Math.sin(a-.12)*ra*.8],[tipx,tipy],[cx+Math.cos(a+.12)*ra*.8,cy+Math.sin(a+.12)*ra*.8],[cx+Math.cos(b2)*ra*.42,cy+Math.sin(b2)*ra*.42]);}
 const s=()=>{c.beginPath();c.moveTo(cx,cy+R*.18);pts.forEach(p=>c.lineTo(...p));c.closePath();};wash(c,s,light,dark,1);
 c.save();c.globalAlpha=.55;s();c.lineWidth=1.1;c.strokeStyle='rgba(90,40,30,.75)';c.stroke();c.restore();
 for(let k=0;k<5;k++){const a=-Math.PI/2+(k-2)*.62;stroke(c,[[cx,cy+R*.1],[cx+Math.cos(a)*R*.7,cy+Math.sin(a)*R*.7]],1.4,'rgba(110,46,34,.6)');}
 stroke(c,[[cx,cy+R*.15],[cx+2,cy+R*.55]],2.2,'rgba(96,52,38,.8)');};
save('maple-1',120,120,c=>maple(c,60,58,42,'rgba(212,104,74,.95)','rgba(168,62,46,.9)'));
save('maple-2',120,120,c=>maple(c,60,58,40,'rgba(222,140,70,.95)','rgba(186,92,48,.9)'));
// 은행잎: a fan with a notch, fine parallel veins
const ginkgo=(c,cx,cy,R,light,dark,notch)=>{const s=()=>{c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,R,-Math.PI*.82,-Math.PI*.18);c.closePath();};
 c.save();wash(c,s,light,dark,1);c.restore();if(notch){c.save();c.globalCompositeOperation='destination-out';c.beginPath();c.moveTo(cx,cy-R*.55);c.lineTo(cx-4,cy-R-2);c.lineTo(cx+4,cy-R-2);c.closePath();c.fill();c.restore();}
 for(let k=0;k<11;k++){const a=-Math.PI*.8+k/10*Math.PI*.6;stroke(c,[[cx,cy-2],[cx+Math.cos(a)*R*.92,cy+Math.sin(a)*R*.92]],.7,'rgba(140,110,40,.45)');}
 c.save();c.globalAlpha=.5;s();c.lineWidth=1;c.strokeStyle='rgba(110,86,30,.7)';c.stroke();c.restore();stroke(c,[[cx,cy],[cx-2,cy+22]],2,'rgba(110,86,40,.8)');};
save('ginkgo-1',120,120,c=>ginkgo(c,60,74,46,'rgba(236,200,92,.95)','rgba(196,150,52,.9)',true));
save('ginkgo-2',120,120,c=>ginkgo(c,60,74,42,'rgba(230,186,80,.95)','rgba(182,136,44,.9)',false));
// 눈 더미: paper-white mound with a pale grey wash on its lower side (ink-wash snow)
const drift=(c,W,H,lumps)=>{const s=()=>{c.beginPath();c.moveTo(4,H-14);for(const [x,,r] of lumps)c.ellipse(x,H-14,r,r*.42,0,Math.PI,0);c.lineTo(W-4,H-14);c.quadraticCurveTo(W/2,H-6,4,H-14);c.closePath();};
 c.save();c.filter='blur(2px)';s();c.fillStyle='rgba(250,249,245,.97)';c.fill();c.restore();
 c.save();s();c.clip();const g=c.createLinearGradient(0,H*.3,0,H);g.addColorStop(0,'rgba(170,176,180,0)');g.addColorStop(1,'rgba(150,158,164,.45)');c.fillStyle=g;c.fillRect(0,0,W,H);c.restore();
 c.save();c.globalAlpha=.35;s();c.lineWidth=1.2;c.strokeStyle='rgba(120,124,124,.8)';c.stroke();c.restore();
 c.save();c.globalAlpha=.18;c.filter='blur(4px)';c.fillStyle='#6d7276';c.beginPath();c.ellipse(W/2,H-12,W/2-6,6,0,0,Math.PI*2);c.fill();c.restore();};
save('snow-1',240,70,(c,W,H)=>drift(c,W,H,[[40,0,30],[92,0,42],[150,0,34],[198,0,30]]));
save('snow-2',170,64,(c,W,H)=>drift(c,W,H,[[40,0,30],[88,0,36],[132,0,30]]));
// 벚꽃잎: a single cherry petal with the notch at its tip, pale pink wash, a faint darker base (also used for falling petals)
const cherry=(c,cx,cy,R,rot)=>{c.save();c.translate(cx,cy);c.rotate(rot);const s=()=>{c.beginPath();c.moveTo(0,R*.95);c.bezierCurveTo(-R*.9,R*.4,-R*.75,-R*.75,-R*.18,-R*.95);c.lineTo(0,-R*.68);c.lineTo(R*.18,-R*.95);c.bezierCurveTo(R*.75,-R*.75,R*.9,R*.4,0,R*.95);c.closePath();};
 wash(c,s,'rgba(246,218,224,.96)','rgba(226,170,184,.85)',.8);c.save();s();c.clip();const g=c.createRadialGradient(0,R*.9,0,0,R*.9,R*.8);g.addColorStop(0,'rgba(214,132,152,.55)');g.addColorStop(1,'rgba(214,132,152,0)');c.fillStyle=g;c.fillRect(-R,-R,2*R,2*R);c.restore();
 c.save();c.globalAlpha=.45;s();c.lineWidth=.9;c.strokeStyle='rgba(170,110,120,.8)';c.stroke();c.restore();c.restore();};
save('cherry-1',80,80,c=>cherry(c,40,40,24,.3));
save('cherry-2',80,80,c=>cherry(c,40,40,22,-.5));
// a few petals lying together on the ground
save('cherry-pile',140,90,c=>{cherry(c,46,48,20,1.2);cherry(c,80,40,18,-.7);cherry(c,98,58,17,.4);});
