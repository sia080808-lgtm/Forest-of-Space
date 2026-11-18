// Draws the springtail (톡토기, Collembola) in the style of the SRS v2.22 D04.20 'small neighbours' sheet:
// soft warm-brown outline, layered translucent watercolor fills, paper grain, small dark eye with a white highlight,
// six short legs, short segmented antennae, furcula folded under (rest) or flicked out (jump).
// Output: app/src/main/assets/web/assets/forest/creatures/springtail-rest.png, springtail-jump.png (facing right).
const fs=require('node:fs'),path=require('node:path');const {createCanvas}=require('@napi-rs/canvas');
const out=path.resolve(__dirname,'../app/src/main/assets/web/assets/forest/creatures');fs.mkdirSync(out,{recursive:true});
const W=420,H=260,LINE='rgba(92,72,70,.85)';
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
function wash(c,draw,fill,layers=3,jitter=2.2){for(let i=0;i<layers;i++){c.save();c.translate((rnd()-.5)*jitter,(rnd()-.5)*jitter);c.globalAlpha=.42;c.fillStyle=fill;draw();c.fill();c.restore();}}
function grain(c,mask){const g=c.getImageData(0,0,W,H),d=g.data;for(let i=0;i<d.length;i+=4){if(d[i+3]<10)continue;const n=(rnd()-.5)*16;d[i]+=n;d[i+1]+=n;d[i+2]+=n;}c.putImageData(g,0,0);}
function blob(c,x,y,rx,ry,rot,inner,outer,alpha=1){c.save();c.translate(x,y);c.rotate(rot);c.scale(1,ry/rx);const g=c.createRadialGradient(-rx*.25,-rx*.35,rx*.1,0,0,rx);g.addColorStop(0,inner);g.addColorStop(.72,outer);g.addColorStop(1,outer);c.globalAlpha=alpha;c.fillStyle=g;c.beginPath();c.arc(0,0,rx,0,Math.PI*2);c.fill();c.restore();}
function edge(c,x,y,rx,ry,rot,w=3){c.save();c.translate(x,y);c.rotate(rot);c.scale(1,ry/rx);c.filter='blur(1.2px)';c.strokeStyle='rgba(88,74,86,.55)';c.lineWidth=w*rx/ry*.6;c.beginPath();c.arc(0,0,rx-1,0,Math.PI*2);c.stroke();c.restore();}
// Tapered, jointed limb drawn as two soft segments with a knee bead.
function limb(c,pts,w,color){c.save();c.lineCap='round';c.strokeStyle=color;for(let k=0;k<pts.length-1;k++){c.lineWidth=w*(1-k*.28);c.beginPath();c.moveTo(...pts[k]);c.lineTo(...pts[k+1]);c.stroke();}c.fillStyle=color;for(let k=1;k<pts.length-1;k++){c.beginPath();c.arc(...pts[k],w*.55,0,Math.PI*2);c.fill();}c.restore();}
function body(c,jump){
 const LEG='#6e6470',lift=jump?-6:0;
 // far legs (lighter, behind)
 for(const [x,dx] of [[250,14],[214,6],[178,-6]])limb(c,[[x+6,160],[x+dx+10,182+lift],[x+dx+18,202+lift]],6,'rgba(140,128,140,.8)');
 // furcula
 if(jump){limb(c,[[118,170],[90,194],[60,216]],7,'#857d97');limb(c,[[124,172],[98,200],[72,224]],6,'#958da6');}
 else{limb(c,[[112,172],[150,186],[188,184]],7,'#8a829c');}
 // abdomen: a smooth tapering cylinder (overlapping soft blobs) with a soft warm outline around the whole silhouette,
 // then faint segment rings — not separate balls.
 const segs=[[112,146,50,28],[152,141,54,33],[196,137,55,36],[238,136,50,35],[270,137,38,32]];
 const sil=createCanvas(W,H),sc=sil.getContext('2d');sc.fillStyle='#000';for(const [x,y,rx,ry] of segs){sc.beginPath();sc.ellipse(x,y,rx,ry,0,0,Math.PI*2);sc.fill();}
 c.save();c.shadowColor='rgba(96,74,66,.9)';c.shadowBlur=4;c.globalAlpha=.9;c.drawImage(sil,0,0);c.restore();
 c.save();c.filter='blur(.7px)';for(const [x,y,rx,ry] of segs)blob(c,x,y,rx,ry,0,'#d9d3dc','#a39aa8');c.restore();
 c.strokeStyle='rgba(112,98,112,.38)';c.lineWidth=2;for(const [x,y,rx,ry] of segs.slice(1)){c.beginPath();c.ellipse(x-rx*.62,y+2,rx*.22,ry*.86,0,-Math.PI/2,Math.PI/2);c.stroke();}
 // back highlight wash
 c.save();c.globalAlpha=.45;c.filter='blur(3px)';c.fillStyle='#f1ecf0';c.beginPath();c.ellipse(190,112,70,9,-.03,0,Math.PI*2);c.fill();c.restore();
 // belly shade
 c.save();c.globalAlpha=.35;c.filter='blur(4px)';c.fillStyle='#6f6372';c.beginPath();c.ellipse(180,172,96,10,0,0,Math.PI*2);c.fill();c.restore();
 // fine scale speckles
 c.fillStyle='rgba(104,92,108,.4)';for(let i=0;i<60;i++){const x=80+rnd()*200,y=114+rnd()*48;c.beginPath();c.arc(x,y,.8+rnd()*1.4,0,Math.PI*2);c.fill();}
 // near legs (darker, in front)
 for(const [x,dx] of [[244,10],[208,2],[172,-10]])limb(c,[[x,166],[x+dx+2,188+lift],[x+dx+8,210+lift]],7,LEG);
 // head: round, slightly lighter, with eye and highlight
 c.save();c.filter='blur(.5px)';c.shadowColor='rgba(96,74,66,.9)';c.shadowBlur=4;blob(c,306,128,38,34,-.1,'#e4dfe6','#a69eab');c.restore();
 // antennae: beaded, four segments each, gently curving up and forward
 for(const [ox,oy,a0,curl] of [[322,98,-1.05,.16],[332,104,-.7,.2]]){let x=ox,y=oy,a=a0;for(let k=0;k<4;k++){const L=15-k*1.5;const nx=x+Math.cos(a)*L,ny=y+Math.sin(a)*L;c.save();c.strokeStyle='#6f6879';c.lineCap='round';c.lineWidth=5.5-k*.8;c.beginPath();c.moveTo(x,y);c.lineTo(nx,ny);c.stroke();c.restore();c.fillStyle='#7c7588';c.beginPath();c.arc(nx,ny,3.2-k*.4,0,Math.PI*2);c.fill();x=nx;y=ny;a+=curl;}}
 // eye (sheet style: dark, small white highlight)
 c.fillStyle='#2b2320';c.beginPath();c.ellipse(320,124,8,9.5,0,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(322.8,120,2.8,0,Math.PI*2);c.fill();
 c.save();c.globalAlpha=.22;c.filter='blur(2px)';c.fillStyle='#d8a7ae';c.beginPath();c.ellipse(320,146,10,6,0,0,Math.PI*2);c.fill();c.restore();
}
for(const [name,jump] of [['springtail-rest',false],['springtail-jump',true]]){seed=11;const cv=createCanvas(W,H),c=cv.getContext('2d');body(c,jump);grain(c);
 // crop to content
 const d=c.getImageData(0,0,W,H).data;let x0=W,y0=H,x1=0,y1=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>8){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 const o=createCanvas(W,H);o.getContext('2d').drawImage(cv,0,0);fs.writeFileSync(path.join(out,name+'.png'),o.toBuffer('image/png'));console.log(name,[x0,y0,x1,y1]);}
