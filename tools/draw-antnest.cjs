// Draws the carrier-ant nest entrance in the SRS v2.22 D04.20 'small neighbours' sheet style: a low, irregular mound
// of loose soil crumbs (no outline disc), a shaded entrance hole, scattered crumbs and pebbles, two tiny sprouts.
// Output: app/src/main/assets/web/assets/forest/creatures/ant-nest.png (360x200, mound centre at 180,130).
const fs=require('node:fs'),path=require('node:path');const {createCanvas}=require('@napi-rs/canvas');
const out=path.resolve(__dirname,'../app/src/main/assets/web/assets/forest/creatures');fs.mkdirSync(out,{recursive:true});
const W=360,H=200,cx=180,cy=130;let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const cv=createCanvas(W,H),c=cv.getContext('2d');
// soft ground shadow
c.save();c.filter='blur(6px)';c.fillStyle='rgba(92,74,50,.22)';c.beginPath();c.ellipse(cx,cy+14,118,26,0,0,Math.PI*2);c.fill();c.restore();
// mound body: overlapping soft washes, darker at the base, lighter on top
for(let i=0;i<5;i++){c.save();c.filter='blur(2.5px)';c.globalAlpha=.32;c.fillStyle=i<2?'#9b7a55':'#b8956a';c.beginPath();c.ellipse(cx+(rnd()-.5)*10,cy-4-i*3,98-i*10,30-i*3,0,0,Math.PI*2);c.fill();c.restore();}
// loose crumbs heaped on the mound (irregular sizes and tones, denser near the hole)
const tones=['#8d6c4a','#a58260','#7a5c3e','#b99a74','#6f543a'];
for(let i=0;i<190;i++){const a=rnd()*Math.PI*2,r=Math.sqrt(rnd()),x=cx+Math.cos(a)*r*96,y=cy-6+Math.sin(a)*r*28-(1-r)*14,s=1.2+rnd()*3.4*(1-r*.5);
 c.save();c.globalAlpha=.55+rnd()*.4;c.fillStyle=tones[Math.floor(rnd()*tones.length)];c.beginPath();c.ellipse(x,y,s,s*(.6+rnd()*.4),rnd()*3,0,Math.PI*2);c.fill();
 c.globalAlpha*=.6;c.fillStyle='rgba(255,240,215,.7)';c.beginPath();c.arc(x-s*.3,y-s*.35,s*.35,0,Math.PI*2);c.fill();c.restore();}
// entrance: shaded, slightly off-centre opening with a soft rim
c.save();c.filter='blur(1.5px)';const hole=c.createRadialGradient(cx+6,cy-16,1,cx+6,cy-14,17);hole.addColorStop(0,'rgba(36,26,18,.95)');hole.addColorStop(.7,'rgba(58,42,28,.75)');hole.addColorStop(1,'rgba(90,68,46,0)');c.fillStyle=hole;c.beginPath();c.ellipse(cx+6,cy-14,18,9,-.05,0,Math.PI*2);c.fill();c.restore();
c.save();c.globalAlpha=.6;c.strokeStyle='rgba(196,170,132,.8)';c.lineWidth=1.6;c.beginPath();c.ellipse(cx+6,cy-15,16,7.5,-.05,Math.PI*1.05,Math.PI*1.95);c.stroke();c.restore();
// scattered crumbs and a few pebbles around the mound
for(let i=0;i<46;i++){const a=rnd()*Math.PI*2,r=1.05+rnd()*.45,x=cx+Math.cos(a)*r*100,y=cy+4+Math.sin(a)*r*30,s=.9+rnd()*1.8;c.save();c.globalAlpha=.45+rnd()*.35;c.fillStyle=tones[Math.floor(rnd()*tones.length)];c.beginPath();c.ellipse(x,y,s,s*.7,rnd()*3,0,Math.PI*2);c.fill();c.restore();}
for(const [x,y,s] of [[70,146,7],[292,140,6],[255,156,4.5]]){c.save();c.filter='blur(.4px)';const g=c.createRadialGradient(x-s*.3,y-s*.4,1,x,y,s);g.addColorStop(0,'#cfc8bd');g.addColorStop(1,'#938a7e');c.fillStyle=g;c.beginPath();c.ellipse(x,y,s*1.3,s*.85,.2,0,Math.PI*2);c.fill();c.restore();}
// two tiny sprouts like the sheet's ground plants
for(const [x,y,k] of [[96,128,1],[262,124,-1]]){c.save();c.strokeStyle='#8fa560';c.lineWidth=1.8;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+2*k,y-10,x+k,y-18);c.stroke();for(const [dx,dy,r] of [[-5,-16,-.6],[5,-20,.6],[0,-24,0]]){c.save();c.translate(x+k+dx*.8,y+dy);c.rotate(r);c.fillStyle='rgba(150,178,98,.85)';c.beginPath();c.ellipse(0,0,3.6,6,0,0,Math.PI*2);c.fill();c.restore();}c.restore();}
fs.writeFileSync(path.join(out,'ant-nest.png'),cv.toBuffer('image/png'));console.log('ant-nest.png');
