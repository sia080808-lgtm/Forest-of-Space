// 슈퍼범 concept in the forest's own style, following the user's chosen design (lobed nest leaves rising around the head
// like a crown that opens into a water bowl after rain, and a skirt of pendant antler leaves with 2~3 rounded tips):
// no outlines, soft muted olive leaves, round brown body, short cream vertical eyes, two small feet. Rough concept only.
const fs=require('node:fs'),path=require('node:path');const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
try{GlobalFonts.registerFromPath(path.resolve(__dirname,'../app/src/main/assets/web/fonts/PretendardVariable.woff2'),'P');}catch{}
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;const R=Math.PI/180;
// one leaf in local space: base at 0,0 pointing up; narrow stalk widening to `w`, tip split into `k` round lobes
function leafPath(c,L,w,k,w0=w*.42,notch=.16){const r=w/(2*k);c.beginPath();c.moveTo(-w0/2,0);
 c.bezierCurveTo(-w0/2,-L*.35,-w/2,-L*.5,-w/2,-L+r);
 for(let i=0;i<k;i++){const cx=-w/2+r*(2*i+1);c.arc(cx,-L+r,r,Math.PI,0,false);if(i<k-1)c.quadraticCurveTo(cx+r,-L+r+L*notch*.6,cx+r,-L+r+L*notch*.25);}
 c.bezierCurveTo(w/2,-L*.5,w0/2,-L*.35,w0/2,0);c.closePath();}
function leaf(c,x,y,ang,L,w,k,tone=0,bend=0){c.save();c.translate(x,y);c.rotate(ang*R);
 const g=c.createLinearGradient(0,0,0,-L);const base=[[148,163,94],[132,148,82],[116,132,70]][tone],tip=[[210,218,160],[192,202,140],[170,182,118]][tone];
 g.addColorStop(0,`rgb(${base})`);g.addColorStop(1,`rgb(${tip})`);c.fillStyle=g;if(bend)c.transform(1,0,bend,1,0,0);leafPath(c,L,w,k);c.fill();
 c.save();leafPath(c,L,w,k);c.clip();for(let i=0;i<120;i++){c.fillStyle=rnd()<.5?'rgba(50,60,24,1)':'rgba(255,250,226,1)';c.globalAlpha=.04+rnd()*.05;c.beginPath();c.arc((rnd()-.5)*w,-rnd()*L,.5+rnd()*1.5,0,7);c.fill();}
 c.globalAlpha=1;c.filter='blur(8px)';c.fillStyle='rgba(255,252,230,.28)';c.beginPath();c.ellipse(-w*.15,-L*.72,w*.22,L*.18,0,0,7);c.fill();c.fillStyle='rgba(60,72,30,.22)';c.beginPath();c.ellipse(0,-L*.05,w*.5,L*.16,0,0,7);c.fill();c.restore();c.restore();}
function body(c,x,y,rx,ry){const g=c.createLinearGradient(x-rx*.6,y-ry,x+rx*.6,y+ry);g.addColorStop(0,'#86705e');g.addColorStop(.6,'#6f5949');g.addColorStop(1,'#5b483b');c.fillStyle=g;
 const sh=()=>{c.beginPath();c.moveTo(x-rx,y+ry*.25);c.bezierCurveTo(x-rx,y-ry*.9,x-rx*.4,y-ry,x+rx*.05,y-ry);c.bezierCurveTo(x+rx*.7,y-ry,x+rx,y-ry*.5,x+rx,y+ry*.2);c.bezierCurveTo(x+rx,y+ry*.85,x+rx*.6,y+ry,x,y+ry);c.bezierCurveTo(x-rx*.6,y+ry,x-rx,y+ry*.8,x-rx,y+ry*.25);c.closePath();};
 sh();c.fill();c.save();sh();c.clip();for(let i=0;i<500;i++){c.fillStyle=rnd()<.5?'rgba(40,28,20,1)':'rgba(180,156,132,1)';c.globalAlpha=.04+rnd()*.06;c.beginPath();c.arc(x+(rnd()-.5)*2*rx,y+(rnd()-.5)*2*ry,.5+rnd()*1.8,0,7);c.fill();}
 c.globalAlpha=1;c.filter='blur(12px)';c.fillStyle='rgba(255,236,214,.14)';c.beginPath();c.ellipse(x-rx*.35,y-ry*.3,rx*.4,ry*.3,-.4,0,7);c.fill();c.restore();}
function eyes(c,x,y){c.save();c.strokeStyle='#eee2ca';c.lineWidth=8;c.lineCap='round';for(const dx of [-20,20]){c.beginPath();c.moveTo(x+dx,y);c.lineTo(x+dx-1.5,y+18);c.stroke();}c.restore();}
function foot(c,x,y){const g=c.createLinearGradient(0,y-10,0,y+10);g.addColorStop(0,'#6c5545');g.addColorStop(1,'#4f3d33');c.fillStyle=g;c.beginPath();c.ellipse(x,y,22,11,0,0,7);c.fill();}
function shadow(c,x,y,w){c.save();c.filter='blur(8px)';c.fillStyle='rgba(90,70,50,.18)';c.beginPath();c.ellipse(x,y,w,12,0,0,7);c.fill();c.restore();}
function water(c,x,y,rx,ry){c.save();const g=c.createLinearGradient(0,y-ry,0,y+ry);g.addColorStop(0,'#d6ede6');g.addColorStop(1,'#8cbcba');c.fillStyle=g;c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();
 c.filter='blur(1px)';c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=3;c.lineCap='round';c.beginPath();c.ellipse(x-rx*.15,y-ry*.2,rx*.45,ry*.35,0,Math.PI*1.1,Math.PI*1.75);c.stroke();
 c.beginPath();c.ellipse(x+rx*.35,y+ry*.15,rx*.18,ry*.18,0,Math.PI*1.1,Math.PI*1.8);c.stroke();c.restore();}
// the character: open=false dry crown (leaves upright), open=true crown spread into a bowl holding rain
function superbum(c,x,y,open){const sp=open?1.35:1;shadow(c,x,y+6,150);
 // skirt, back row (darker, behind body)
 for(const [dx,a,L,k] of [[-80,-160,150,3],[80,160,150,3]])leaf(c,x+dx,y-176,a,L,64,k,2);
 // crown, back row
 const crownY=y-200;for(const [a,L,k] of [[-44,150,3],[-14,166,3],[16,162,3],[46,146,3]])leaf(c,x+a*1.2,crownY+6,a*sp,L*(open?.86:1),92,k,1);
 if(open)water(c,x,crownY+12,150,30);
 // feet, body, eyes
 foot(c,x-44,y);foot(c,x+44,y);body(c,x,y-96,118,100);eyes(c,x+8,y-84);
 // skirt, front row (hangs down the sides, in front of the body edge)
 for(const [dx,a,L,k] of [[-96,-166,150,3],[100,164,140,3],[-112,-148,128,2],[114,150,122,2]])leaf(c,x+dx,y-150,a,L,70,k,0);
 // crown, front collar (low, wide, over the forehead; holds the water's front edge)
 {c.save();const g=c.createLinearGradient(0,y-200,0,y-132);g.addColorStop(0,'rgb(188,198,136)');g.addColorStop(1,'rgb(140,155,88)');c.fillStyle=g;c.beginPath();c.ellipse(x,y-166,open?128:116,34,0,0,7);c.fill();c.restore();}
 for(const [a,L,k] of [[-64,96,2],[-32,92,3],[0,88,3],[32,92,3],[64,96,2]])leaf(c,x+a*1.5,y-150+Math.abs(a)*.35,a*(open?1.25:1),L*(open?.8:.9),86,k,0);}
const cv=createCanvas(1120,640),c=cv.getContext('2d');c.fillStyle='#f6ece0';c.fillRect(0,0,cv.width,cv.height);
superbum(c,280,560,false);superbum(c,840,560,true);
c.fillStyle='#5a4838';c.font='22px P, sans-serif';c.textAlign='center';c.fillText('기본 (마른 둥지)',280,616);c.fillText('물 저장 (물 고인 둥지)',840,616);
fs.writeFileSync(path.resolve(__dirname,'../docs/qa-superbum-draft/concept-v3.png'),cv.toBuffer('image/png'));console.log('ok');
