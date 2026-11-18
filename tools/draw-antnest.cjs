// Draws the carrier-ant nest in the SRS v2.22 D04.20 'small neighbours' sheet style: a small dome of loose soil that
// rises out of the ground (feathered base, no outline), with the entrance hole on the top of the dome.
// Output: app/src/main/assets/web/assets/forest/creatures/ant-nest.png (360x200; base centre at 180,150, peak at 180,96).
const fs=require('node:fs'),path=require('node:path');const {createCanvas}=require('@napi-rs/canvas');
const out=path.resolve(__dirname,'../app/src/main/assets/web/assets/forest/creatures');fs.mkdirSync(out,{recursive:true});
const W=360,H=200,cx=180,by=150,peak=96,base=112;let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const cv=createCanvas(W,H),c=cv.getContext('2d');
// dome profile: height above the base line at horizontal offset dx (smooth bell, flat feathered foot)
const top=dx=>{const u=Math.min(1,Math.abs(dx)/base);return (by-peak)*Math.pow(Math.cos(u*Math.PI/2),1.6);};
// 1) feathered ground stain so the mound grows out of the soil
c.save();c.filter='blur(9px)';c.fillStyle='rgba(120,94,64,.28)';c.beginPath();c.ellipse(cx,by,base*1.15,30,0,0,Math.PI*2);c.fill();c.restore();
// 2) dome body: silhouette path, filled with a lit-left / shaded-right gradient, soft edge
const dome=()=>{c.beginPath();c.moveTo(cx-base,by+6);for(let dx=-base;dx<=base;dx+=2)c.lineTo(cx+dx,by-top(dx)+Math.abs(dx)/base*4);c.lineTo(cx+base,by+6);c.quadraticCurveTo(cx,by+22,cx-base,by+6);c.closePath();};
c.save();c.filter='blur(2.2px)';const g=c.createLinearGradient(cx-80,peak,cx+90,by+10);g.addColorStop(0,'#c4a27a');g.addColorStop(.45,'#a9865f');g.addColorStop(1,'#7f6043');c.fillStyle=g;dome();c.fill();c.restore();
// soft shadow on the right flank and a light catch on the left shoulder
c.save();c.filter='blur(7px)';c.globalAlpha=.35;c.fillStyle='#5e4632';c.beginPath();c.ellipse(cx+48,by-14,46,20,.2,0,Math.PI*2);c.fill();c.globalAlpha=.3;c.fillStyle='#e6cfac';c.beginPath();c.ellipse(cx-34,peak+18,34,12,-.3,0,Math.PI*2);c.fill();c.restore();
// 3) loose crumbs following the dome surface (denser and finer near the top)
const tones=['#8d6c4a','#a58260','#7a5c3e','#b99a74','#6f543a','#c2a37d'];
for(let i=0;i<260;i++){const dx=(rnd()*2-1)*base*.98,surf=by-top(dx)+Math.abs(dx)/base*4,depth=rnd()*Math.max(6,top(dx)*1.0+8),y=surf+depth*.9,s=(1.1+rnd()*2.8)*(.7+.5*Math.abs(dx)/base);
 c.save();c.globalAlpha=.5+rnd()*.45;c.fillStyle=tones[Math.floor(rnd()*tones.length)];c.beginPath();c.ellipse(cx+dx,y,s,s*(.6+rnd()*.35),rnd()*3,0,Math.PI*2);c.fill();
 c.globalAlpha*=.55;c.fillStyle='rgba(255,240,215,.75)';c.beginPath();c.arc(cx+dx-s*.3,y-s*.35,s*.32,0,Math.PI*2);c.fill();c.restore();}
// 4) entrance on the peak: a small crater rim, then the dark opening
c.save();c.filter='blur(1px)';c.fillStyle='rgba(176,146,108,.9)';c.beginPath();c.ellipse(cx,peak+4,22,8,0,0,Math.PI*2);c.fill();c.restore();
c.save();c.filter='blur(1.2px)';const hole=c.createRadialGradient(cx+1,peak+5,1,cx+1,peak+5,14);hole.addColorStop(0,'rgba(30,21,14,.97)');hole.addColorStop(.75,'rgba(56,40,26,.85)');hole.addColorStop(1,'rgba(90,68,46,0)');c.fillStyle=hole;c.beginPath();c.ellipse(cx+1,peak+5,14,6,0,0,Math.PI*2);c.fill();c.restore();
c.save();c.globalAlpha=.7;c.strokeStyle='rgba(214,188,150,.9)';c.lineWidth=1.6;c.beginPath();c.ellipse(cx,peak+3.5,17,6.5,0,Math.PI*1.08,Math.PI*1.92);c.stroke();c.restore();
// 5) a few crumbs rolled down onto the ground, pebbles and two sprouts
for(let i=0;i<54;i++){const a=rnd()*Math.PI*2,r=.95+rnd()*.5,x=cx+Math.cos(a)*r*base,y=by+6+Math.sin(a)*r*22,s=.8+rnd()*1.7;c.save();c.globalAlpha=.4+rnd()*.35;c.fillStyle=tones[Math.floor(rnd()*tones.length)];c.beginPath();c.ellipse(x,y,s,s*.7,rnd()*3,0,Math.PI*2);c.fill();c.restore();}
for(const [x,y,s] of [[58,160,7],[300,154,6],[268,170,4.5]]){c.save();c.filter='blur(.4px)';const p=c.createRadialGradient(x-s*.3,y-s*.4,1,x,y,s);p.addColorStop(0,'#cfc8bd');p.addColorStop(1,'#938a7e');c.fillStyle=p;c.beginPath();c.ellipse(x,y,s*1.3,s*.85,.2,0,Math.PI*2);c.fill();c.restore();}
for(const [x,y,k] of [[82,152,1],[284,146,-1]]){c.save();c.strokeStyle='#8fa560';c.lineWidth=1.8;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+2*k,y-10,x+k,y-18);c.stroke();for(const [dx,dy,r] of [[-5,-16,-.6],[5,-20,.6],[0,-24,0]]){c.save();c.translate(x+k+dx*.8,y+dy);c.rotate(r);c.fillStyle='rgba(150,178,98,.85)';c.beginPath();c.ellipse(0,0,3.6,6,0,0,Math.PI*2);c.fill();c.restore();}c.restore();}
fs.writeFileSync(path.join(out,'ant-nest.png'),cv.toBuffer('image/png'));console.log('ant-nest.png');
