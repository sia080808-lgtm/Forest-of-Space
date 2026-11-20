// 0.8.7 draft · 산책에서 주워 오는 꾸미기 아이템 (user: "멀리 갔을 때 뭔가 새로운 아이템 같은 거 주워올 수도 있잖아, 꾸미기
// 아이템용", "꾸미기 전용 아이템으로 가고") and the leaf basket they are kept in ("1번으로 ㄱㄱ"). Same ink-wash (수묵 담채)
// manner as tools/draw-season-props.cjs: soft low-saturation washes with a slightly pooled rim, few ink touches, paper grain,
// no hard outlines. Output: app/src/main/assets/web/assets/forest/forage/*.png. Usage: node tools/draw-forage-items.cjs
const fs=require('node:fs'),path=require('node:path');const {createCanvas}=require('@napi-rs/canvas');
const out=path.resolve(__dirname,'../app/src/main/assets/web/assets/forest/forage');fs.mkdirSync(out,{recursive:true});
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const INK='rgba(58,52,44,.8)';
function grain(c,W,H,amt=12){const g=c.getImageData(0,0,W,H),d=g.data;for(let i=0;i<d.length;i+=4){if(d[i+3]<6)continue;const n=(rnd()-.5)*amt;d[i]+=n;d[i+1]+=n;d[i+2]+=n;}c.putImageData(g,0,0);}
function wash(c,shape,light,dark,blur=1.2,rim=6){c.save();c.filter=`blur(${blur}px)`;shape();c.fillStyle=light;c.fill();c.restore();
 c.save();shape();c.clip();c.globalAlpha=.55;c.lineWidth=rim;c.strokeStyle=dark;c.filter='blur(2.5px)';shape();c.stroke();c.restore();}
function stroke(c,pts,w,color=INK){c.save();c.lineCap='round';c.lineJoin='round';c.strokeStyle=color;for(let k=0;k<pts.length-1;k++){c.lineWidth=Math.max(.6,w*(1-k/pts.length*.6));c.beginPath();c.moveTo(...pts[k]);c.lineTo(...pts[k+1]);c.stroke();}c.restore();}
function shadow(c,x,y,rx,ry=rx*.26,a=.22){c.save();c.globalAlpha=a;c.filter='blur(3px)';c.fillStyle='#6b6048';c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();c.restore();}
function save(name,W,H,draw){seed=7+name.length*13;const cv=createCanvas(W,H),c=cv.getContext('2d');draw(c,W,H);grain(c,W,H);
 const d=c.getImageData(0,0,W,H).data;let x0=W,y0=H,x1=0,y1=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>6){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 const pad=2,w=x1-x0+1+pad*2,h=y1-y0+1+pad*2,o=createCanvas(w,h);o.getContext('2d').drawImage(cv,x0-pad,y0-pad,w,h,0,0,w,h);fs.writeFileSync(path.join(out,name+'.png'),o.toBuffer('image/png'));return o;}
const ell=(c,x,y,rx,ry,r=0)=>()=>{c.beginPath();c.ellipse(x,y,rx,ry,r,0,Math.PI*2);};
const leafPath=(c,x,y,len,wid,ang)=>()=>{c.beginPath();c.save();c.translate(x,y);c.rotate(ang);c.moveTo(0,0);c.bezierCurveTo(len*.3,-wid,len*.8,-wid*.8,len,0);c.bezierCurveTo(len*.8,wid*.8,len*.3,wid,0,0);c.restore();};
const blob=(c,cx,cy,r,n=9,j=.18,sx=1,sy=1)=>{const pts=[];for(let k=0;k<n;k++){const a=k/n*Math.PI*2,rr=r*(1+(rnd()-.5)*j*2);pts.push([cx+Math.cos(a)*rr*sx,cy+Math.sin(a)*rr*sy]);}
 return ()=>{c.beginPath();for(let k=0;k<n;k++){const p=pts[k],q=pts[(k+1)%n],m=[(p[0]+q[0])/2,(p[1]+q[1])/2];if(!k)c.moveTo((pts[n-1][0]+p[0])/2,(pts[n-1][1]+p[1])/2);c.quadraticCurveTo(p[0],p[1],m[0],m[1]);}c.closePath();};};

const ITEMS={};const item=(id,W,H,draw)=>{ITEMS[id]=save(id,W,H,draw);};
// --- 사계절 ---------------------------------------------------------------------------------------------------------
item('pebble',110,80,c=>{shadow(c,55,60,34);for(const [x,y,r,t] of [[44,48,22,'rgba(150,146,136,.9)'],[72,52,14,'rgba(170,164,150,.9)']]){const s=blob(c,x,y,r,10,.08,1,.62);wash(c,s,t,'rgba(96,92,84,.7)',1,5);
 c.save();s();c.clip();const g=c.createRadialGradient(x-r*.4,y-r*.4,1,x,y,r);g.addColorStop(0,'rgba(255,252,244,.35)');g.addColorStop(1,'rgba(255,252,244,0)');c.fillStyle=g;c.fillRect(0,0,200,200);c.restore();}});
item('mossy-stone',120,90,c=>{shadow(c,60,70,40);const s=blob(c,60,56,30,11,.1,1,.68);wash(c,s,'rgba(146,140,128,.92)','rgba(92,88,78,.75)',1.2,6);
 c.save();s();c.clip();for(let k=0;k<26;k++){const x=36+rnd()*48,y=34+rnd()*14;c.globalAlpha=.55;c.filter='blur(1.4px)';c.fillStyle=`rgba(${120+rnd()*30},${150+rnd()*20},${92+rnd()*16},1)`;c.beginPath();c.arc(x,y,3+rnd()*4,0,7);c.fill();}c.restore();});
item('twig',140,70,c=>{shadow(c,70,52,50,4,.16);const main=[[16,48],[44,40],[72,36],[100,30],[126,22]];c.save();c.lineCap='round';c.strokeStyle='rgba(150,118,84,.75)';c.lineWidth=6;c.filter='blur(1px)';c.beginPath();main.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();c.restore();
 stroke(c,main,3.2,'rgba(86,64,44,.85)');stroke(c,[[72,36],[86,18],[92,10]],2,'rgba(86,64,44,.8)');stroke(c,[[44,40],[40,26]],1.6,'rgba(86,64,44,.75)');});
item('feather',70,140,c=>{shadow(c,36,124,18,3,.14);const s=()=>{c.beginPath();c.moveTo(35,126);c.bezierCurveTo(14,96,16,40,38,10);c.bezierCurveTo(56,40,54,96,35,126);c.closePath();};
 wash(c,s,'rgba(208,206,200,.85)','rgba(130,128,124,.6)',1.4,7);c.save();s();c.clip();for(let k=0;k<14;k++){const y=24+k*7;c.strokeStyle='rgba(120,118,112,.35)';c.lineWidth=1;c.beginPath();c.moveTo(36,y);c.lineTo(20+rnd()*4,y+10);c.moveTo(36,y);c.lineTo(52-rnd()*4,y+10);c.stroke();}c.restore();
 stroke(c,[[35,132],[36,90],[37,40],[38,14]],1.8,'rgba(80,76,70,.75)');});
item('snail-shell',90,80,c=>{shadow(c,46,64,28);const s=ell(c,46,44,26,22);wash(c,s,'rgba(210,186,150,.9)','rgba(150,116,82,.75)',1.2,6);
 const pts=[];for(let a=0;a<Math.PI*4.2;a+=.12){const r=22*(1-a/(Math.PI*4.6));pts.push([48+Math.cos(a)*r,44+Math.sin(a)*r*.85]);}stroke(c,pts,2.2,'rgba(110,80,56,.7)');});
item('bark',110,80,c=>{shadow(c,55,62,40);const s=()=>{c.beginPath();c.moveTo(14,52);c.quadraticCurveTo(30,24,60,22);c.quadraticCurveTo(94,22,100,40);c.quadraticCurveTo(84,62,54,60);c.quadraticCurveTo(28,60,14,52);c.closePath();};
 wash(c,s,'rgba(150,118,86,.9)','rgba(92,68,48,.8)',1.2,6);c.save();s();c.clip();for(let k=0;k<7;k++){const x=24+k*11;stroke(c,[[x,28],[x+4,40],[x+2,56]],1.3,'rgba(70,50,34,.55)');}c.restore();});
// --- 봄 ---------------------------------------------------------------------------------------------------------------
const PINK=[234,200,204],PINK_D=[206,150,160],rgba=(k,a)=>`rgba(${k[0]},${k[1]},${k[2]},${a})`;
const petal=(c,cx,cy,R,rot)=>{c.save();c.translate(cx,cy);c.rotate(rot);const s=()=>{c.beginPath();c.moveTo(0,R);c.bezierCurveTo(-R*.95,R*.35,-R*.8,-R*.8,-R*.14,-R*.9);c.quadraticCurveTo(0,-R*.72,R*.14,-R*.9);c.bezierCurveTo(R*.8,-R*.8,R*.95,R*.35,0,R);c.closePath();};
 c.save();c.filter=`blur(${Math.max(.6,R*.08)}px)`;s();c.fillStyle=rgba(PINK,.7);c.fill();c.restore();c.save();s();c.clip();c.filter=`blur(${Math.max(1,R*.12)}px)`;c.lineWidth=R*.22;c.strokeStyle=rgba(PINK_D,.3);s();c.stroke();c.restore();c.restore();};
item('petals',120,80,c=>{shadow(c,60,58,40,7,.12);for(let k=0;k<9;k++)petal(c,30+rnd()*60,34+rnd()*22,8+rnd()*4,rnd()*6.3);});
item('fiddlehead',90,130,c=>{const pts=[];for(let t=0;t<=1;t+=.04){pts.push([42+Math.sin(t*1.4)*6,118-t*70]);}const cx=pts.at(-1)[0]+8,cy=pts.at(-1)[1];for(let a=0;a<=Math.PI*1.8;a+=.15){const r=12*(1-a/(Math.PI*2.3));pts.push([cx-Math.cos(a)*r,cy-Math.sin(a)*r]);}
 shadow(c,42,120,14,4);c.save();c.lineCap='round';c.strokeStyle='rgba(150,176,110,.9)';c.lineWidth=8;c.filter='blur(1px)';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.restore();stroke(c,pts,2.6,'rgba(66,74,46,.85)');});
item('dandelion',90,130,c=>{shadow(c,45,122,12,3,.14);stroke(c,[[45,122],[44,90],[45,52]],1.6,'rgba(110,120,84,.75)');c.save();c.filter='blur(1.6px)';c.fillStyle='rgba(246,244,236,.9)';c.beginPath();c.arc(45,40,26,0,7);c.fill();c.restore();
 for(let k=0;k<34;k++){const a=k/34*Math.PI*2,r=24+rnd()*3;stroke(c,[[45,40],[45+Math.cos(a)*r,40+Math.sin(a)*r]],.7,'rgba(150,146,134,.55)');}c.fillStyle='rgba(150,130,80,.8)';c.beginPath();c.arc(45,40,3,0,7);c.fill();});
// --- 여름 -------------------------------------------------------------------------------------------------------------
item('cicada-shell',90,100,c=>{shadow(c,46,86,24);const body=ell(c,46,54,18,28);wash(c,body,'rgba(196,160,108,.8)','rgba(140,104,62,.75)',1,5);
 c.save();body();c.clip();for(let k=0;k<6;k++)stroke(c,[[30,46+k*7],[62,46+k*7]],1,'rgba(110,80,48,.45)');c.restore();for(const s of [-1,1]){stroke(c,[[46+s*12,44],[46+s*24,34],[46+s*30,40]],1.4,'rgba(110,80,48,.7)');stroke(c,[[46+s*14,62],[46+s*26,70],[46+s*30,82]],1.4,'rgba(110,80,48,.7)');}
 wash(c,ell(c,46,28,12,9),'rgba(206,172,120,.82)','rgba(140,104,62,.7)',1,4);});
item('grass-blade',70,150,c=>{shadow(c,30,138,12,3,.14);const s=()=>{c.beginPath();c.moveTo(26,140);c.quadraticCurveTo(14,80,40,12);c.quadraticCurveTo(30,80,38,140);c.closePath();};wash(c,s,'rgba(150,176,112,.85)','rgba(96,124,70,.7)',1,5);
 stroke(c,[[32,140],[30,90],[38,20]],1,'rgba(70,90,50,.6)');c.save();c.filter='blur(.5px)';c.fillStyle='rgba(236,244,246,.95)';c.beginPath();c.arc(30,70,3.4,0,7);c.fill();c.fillStyle='rgba(120,140,150,.5)';c.beginPath();c.arc(31,71.5,1.6,0,7);c.fill();c.restore();});
item('mushroom',100,100,c=>{shadow(c,50,86,30);for(const [x,h,r] of [[40,30,20],[66,20,13]]){wash(c,()=>{c.beginPath();c.moveTo(x-5,86);c.lineTo(x-4,86-h);c.lineTo(x+4,86-h);c.lineTo(x+5,86);c.closePath();},'rgba(232,222,200,.92)','rgba(170,156,128,.6)',1,3);
 const cap=()=>{c.beginPath();c.ellipse(x,86-h,r,r*.62,0,Math.PI,0);c.quadraticCurveTo(x,86-h+r*.18,x-r,86-h);c.closePath();};wash(c,cap,'rgba(172,124,86,.9)','rgba(112,76,50,.8)',1,5);}});
// --- 가을 -------------------------------------------------------------------------------------------------------------
item('acorn',90,100,c=>{shadow(c,45,86,22);const nut=()=>{c.beginPath();c.moveTo(28,46);c.bezierCurveTo(26,78,42,90,45,90);c.bezierCurveTo(48,90,64,78,62,46);c.closePath();};wash(c,nut,'rgba(176,128,78,.9)','rgba(118,80,46,.8)',1,5);
 c.save();nut();c.clip();const g=c.createLinearGradient(30,0,60,0);g.addColorStop(0,'rgba(255,240,210,.25)');g.addColorStop(1,'rgba(255,240,210,0)');c.fillStyle=g;c.fillRect(0,0,99,99);c.restore();
 const cup=()=>{c.beginPath();c.ellipse(45,46,20,12,0,Math.PI,0);c.lineTo(65,48);c.quadraticCurveTo(45,56,25,48);c.closePath();};wash(c,cup,'rgba(140,116,82,.9)','rgba(86,68,46,.8)',1,4);
 c.save();cup();c.clip();for(let k=0;k<30;k++){c.fillStyle='rgba(80,62,42,.45)';c.beginPath();c.arc(27+rnd()*36,36+rnd()*16,1.2,0,7);c.fill();}c.restore();stroke(c,[[45,34],[47,24]],2.2,'rgba(86,64,44,.8)');});
item('pinecone',100,120,c=>{shadow(c,50,106,26);for(let row=0;row<7;row++){const y=24+row*11,w=12+Math.sin(row/6*Math.PI)*16;for(let k=-1;k<=1;k++){const x=50+k*w*.62;
 wash(c,()=>{c.beginPath();c.ellipse(x,y,w*.42,6,0,0,Math.PI*2);},row%2?'rgba(150,108,70,.92)':'rgba(166,122,80,.92)','rgba(92,64,40,.8)',.9,3);}}stroke(c,[[50,20],[51,10]],2,'rgba(86,64,44,.8)');});
const fall=(c,shape,light,dark,base,bx,by,R)=>{c.save();c.filter=`blur(${R*.04}px)`;shape();c.fillStyle=light;c.fill();c.restore();
 c.save();shape();c.clip();c.filter=`blur(${R*.07}px)`;c.lineWidth=R*.14;c.strokeStyle=dark;shape();c.stroke();c.filter='none';const g=c.createRadialGradient(bx,by,0,bx,by,R*1.1);g.addColorStop(0,base);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(bx-R*2,by-R*2,R*4,R*4);c.restore();};
item('maple-leaf',110,110,c=>{const cx=55,cy=54,R=40,pts=[];for(let k=0;k<5;k++){const a=-Math.PI/2+(k-2)*.62,ra=R*(k===2?1:k===1||k===3?.9:.62),b1=a-.3,b2=a+.3;
 pts.push([cx+Math.cos(b1)*ra*.45,cy+Math.sin(b1)*ra*.45],[cx+Math.cos(a-.1)*ra*.8,cy+Math.sin(a-.1)*ra*.8],[cx+Math.cos(a)*ra,cy+Math.sin(a)*ra],[cx+Math.cos(a+.1)*ra*.8,cy+Math.sin(a+.1)*ra*.8],[cx+Math.cos(b2)*ra*.45,cy+Math.sin(b2)*ra*.45]);}
 shadow(c,55,92,26,4,.12);fall(c,()=>{c.beginPath();c.moveTo(cx,cy+R*.18);pts.forEach(p=>c.lineTo(...p));c.closePath();},'rgba(196,118,86,.82)','rgba(160,82,60,.35)','rgba(150,70,52,.4)',cx,cy+R*.1,R);stroke(c,[[cx,cy+R*.15],[cx+2,cy+R*.55]],1.6,'rgba(96,60,44,.6)');});
item('chestnut-burr',110,100,c=>{shadow(c,55,84,32);const s=blob(c,55,56,28,12,.08,1,.8);wash(c,s,'rgba(170,150,96,.9)','rgba(110,92,56,.8)',1.2,6);for(let k=0;k<70;k++){const a=rnd()*7,r=20+rnd()*12;const x=55+Math.cos(a)*r,y=56+Math.sin(a)*r*.8;stroke(c,[[x,y],[x+Math.cos(a)*7,y+Math.sin(a)*6]],.8,'rgba(96,82,50,.55)');}
 wash(c,ell(c,55,48,14,10),'rgba(110,70,44,.9)','rgba(70,44,28,.8)',1,4);});
// --- 겨울 -------------------------------------------------------------------------------------------------------------
item('berry-twig',130,100,c=>{shadow(c,64,86,40,4,.12);stroke(c,[[14,84],[50,64],[86,46],[118,24]],2.6,'rgba(70,58,46,.85)');stroke(c,[[50,64],[58,40]],1.6,'rgba(70,58,46,.8)');stroke(c,[[86,46],[100,58]],1.4,'rgba(70,58,46,.8)');
 c.save();c.filter='blur(1.6px)';c.fillStyle='rgba(250,250,247,.95)';for(const [x,y,w] of [[40,66,16],[78,48,14],[110,26,10]]){c.beginPath();c.ellipse(x,y-4,w,4,-.5,0,7);c.fill();}c.restore();
 for(const [x,y] of [[58,38],[62,44],[54,44],[100,60],[106,56],[96,64]]){wash(c,ell(c,x,y,4.6,4.6),'rgba(184,64,56,.92)','rgba(120,30,28,.8)',.6,2);c.fillStyle='rgba(255,240,230,.7)';c.beginPath();c.arc(x-1.4,y-1.4,1.1,0,7);c.fill();}});
item('ice-shard',110,90,c=>{shadow(c,55,74,34,5,.12);const s=()=>{c.beginPath();c.moveTo(18,64);c.lineTo(36,22);c.lineTo(70,14);c.lineTo(94,40);c.lineTo(80,68);c.lineTo(40,72);c.closePath();};wash(c,s,'rgba(214,230,236,.75)','rgba(130,158,170,.6)',1,5);
 stroke(c,[[36,22],[52,46],[80,68]],1,'rgba(150,176,186,.6)');stroke(c,[[52,46],[94,40]],1,'rgba(150,176,186,.55)');c.save();s();c.clip();c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.moveTo(40,26);c.lineTo(66,18);c.lineTo(50,40);c.closePath();c.fill();c.restore();});
// --- 드물게 -----------------------------------------------------------------------------------------------------------
item('spore-leaf',110,120,c=>{shadow(c,56,104,28,4,.12);const s=leafPath(c,26,102,90,24,-1.1);wash(c,s,'rgba(140,150,96,.85)','rgba(88,98,58,.7)',1.2,6);
 c.save();s();c.clip();for(let k=0;k<40;k++){const t=.35+rnd()*.6;const x=26+Math.cos(-1.1)*90*t+(rnd()-.5)*14,y=102+Math.sin(-1.1)*90*t+(rnd()-.5)*14;c.globalAlpha=.6;c.filter='blur(1px)';c.fillStyle='rgba(120,72,40,1)';c.beginPath();c.arc(x,y,2+rnd()*2.4,0,7);c.fill();}c.restore();
 stroke(c,[[26,102],[50,62],[66,30]],1.4,'rgba(70,74,44,.65)');});
item('river-stone',110,80,c=>{shadow(c,55,62,36);const s=ell(c,55,44,34,20,-.12);wash(c,s,'rgba(120,138,146,.92)','rgba(70,86,94,.8)',1,6);
 c.save();s();c.clip();const g=c.createRadialGradient(42,34,1,55,44,36);g.addColorStop(0,'rgba(255,255,255,.45)');g.addColorStop(.4,'rgba(255,255,255,.08)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,120,90);stroke(c,[[26,50],[56,40],[86,36]],1.4,'rgba(230,236,236,.5)');c.restore();});
item('bird-nest',130,90,c=>{shadow(c,65,74,48);const bowl=()=>{c.beginPath();c.ellipse(65,48,48,22,0,0,Math.PI);c.lineTo(113,44);c.quadraticCurveTo(65,30,17,44);c.closePath();};wash(c,bowl,'rgba(168,140,98,.9)','rgba(106,84,56,.8)',1.2,6);
 c.save();bowl();c.clip();for(let k=0;k<60;k++){const a=rnd()*Math.PI,x=65+Math.cos(a)*44*rnd(),y=50+Math.sin(a)*18*rnd();stroke(c,[[x-10,y+rnd()*3],[x+10,y-rnd()*3]],.9,'rgba(90,70,46,.5)');}c.restore();
 wash(c,ell(c,65,44,38,9),'rgba(96,76,52,.85)','rgba(70,54,36,.8)',1,4);for(let k=0;k<22;k++){const a=rnd()*Math.PI*2;stroke(c,[[65+Math.cos(a)*40,44+Math.sin(a)*10],[65+Math.cos(a+.4)*48,44+Math.sin(a+.4)*13]],.9,'rgba(110,88,58,.6)');}});

// --- 나뭇잎 바구니: empty / a few / full (items peek out over the rim) ---------------------------------------------------
const basket=(c,fill)=>{const cx=110,top=70,bw=78,bh=62;shadow(c,cx,top+bh+10,bw*1.02,10,.24);
 const back=()=>{c.beginPath();c.ellipse(cx,top,bw,18,0,Math.PI,0);c.closePath();};wash(c,back,'rgba(120,100,70,.85)','rgba(80,62,40,.8)',1,4);
 const peek=[[['acorn',.55,-28,-18,-.3],['petals',.5,22,-12,0]],[['pinecone',.5,-40,-30,-.2],['acorn',.55,-8,-22,.2],['feather',.55,36,-52,.5],['maple-leaf',.5,12,-22,.4],['pebble',.5,-60,-10,0],['mushroom',.42,50,-18,0]]][fill-1]||[];
 for(const [id,s,dx,dy,r] of peek){const im=ITEMS[id];c.save();c.translate(cx+dx,top+dy);c.rotate(r);c.drawImage(im,-im.width*s/2,-im.height*s/2,im.width*s,im.height*s);c.restore();}
 const body=()=>{c.beginPath();c.moveTo(cx-bw,top);c.quadraticCurveTo(cx-bw+6,top+bh,cx-bw*.62,top+bh+6);c.lineTo(cx+bw*.62,top+bh+6);c.quadraticCurveTo(cx+bw-6,top+bh,cx+bw,top);c.ellipse(cx,top,bw,18,0,0,Math.PI);c.closePath();};
 wash(c,body,'rgba(182,154,108,.95)','rgba(118,92,58,.85)',1.2,7);
 c.save();body();c.clip();for(let k=0;k<7;k++){const y=top+8+k*8.6;c.globalAlpha=.6;stroke(c,[[cx-bw,y],[cx-bw*.5,y+3],[cx,y+4],[cx+bw*.5,y+3],[cx+bw,y]],1.2,'rgba(100,78,48,.55)');}
 for(let k=-7;k<=7;k++){c.globalAlpha=.4;stroke(c,[[cx+k*11,top+12],[cx+k*8.4,top+bh+6]],.9,'rgba(100,78,48,.5)');}c.restore();
 for(let k=0;k<9;k++){const a=Math.PI*(k/8),x=cx-Math.cos(a)*bw*.98,y=top+Math.sin(a)*17;const l=leafPath(c,x,y+2,18,6,-Math.PI/2+(k-4)*.18);wash(c,l,'rgba(150,140,96,.85)','rgba(100,92,58,.7)',.8,3);}
 c.save();c.lineWidth=3;c.strokeStyle='rgba(98,76,48,.75)';c.filter='blur(.6px)';c.beginPath();c.ellipse(cx,top,bw,18,0,0,Math.PI);c.stroke();c.restore();};
for(const f of [0,1,2])save('basket-'+f,220,170,c=>basket(c,f));

// draft sheet
const ids=Object.keys(ITEMS),SEASON={pebble:'사계절',  'mossy-stone':'사계절',twig:'사계절',feather:'사계절','snail-shell':'사계절',bark:'사계절',petals:'봄',fiddlehead:'봄',dandelion:'봄','cicada-shell':'여름','grass-blade':'여름',mushroom:'여름',acorn:'가을',pinecone:'가을','maple-leaf':'가을','chestnut-burr':'가을','berry-twig':'겨울','ice-shard':'겨울','spore-leaf':'드묾','river-stone':'드묾','bird-nest':'드묾'};
const NAME={pebble:'조약돌','mossy-stone':'이끼 낀 돌',twig:'마른 나뭇가지',feather:'새 깃털','snail-shell':'달팽이 껍데기',bark:'나무껍질 조각',petals:'벚꽃잎 한 줌',fiddlehead:'고사리 순',dandelion:'민들레 홀씨','cicada-shell':'매미 허물','grass-blade':'이슬 맺힌 풀잎',mushroom:'작은 버섯',acorn:'도토리',pinecone:'솔방울','maple-leaf':'단풍잎','chestnut-burr':'밤송이','berry-twig':'붉은 열매 가지','ice-shard':'얼음 조각','spore-leaf':'박쥐란 포자 잎','river-stone':'매끈한 강돌','bird-nest':'빈 새 둥지'};
module.exports={ids,SEASON,NAME};
if(require.main===module){const {GlobalFonts,loadImage}=require('@napi-rs/canvas');const web=path.resolve(__dirname,'../app/src/main/assets/web');for(const f of fs.readdirSync(web+'/fonts').filter(f=>/\.(ttf|otf|woff2)$/.test(f)))try{GlobalFonts.registerFromPath(web+'/fonts/'+f,'Forest');}catch{}
 (async()=>{const cols=7,cw=150,ch=150,rows=Math.ceil(ids.length/cols),sheet=createCanvas(cols*cw,rows*ch+230),g=sheet.getContext('2d');g.fillStyle='#f6ece0';g.fillRect(0,0,sheet.width,sheet.height);
  ids.forEach((id,i)=>{const im=ITEMS[id],x=(i%cols)*cw+cw/2,y=Math.floor(i/cols)*ch+70,s=Math.min(1,90/Math.max(im.width,im.height));g.drawImage(im,x-im.width*s/2,y-im.height*s/2,im.width*s,im.height*s);g.fillStyle='#4a3c2e';g.font='15px Forest, sans-serif';g.textAlign='center';g.fillText(NAME[id],x,y+64);g.fillStyle='#8a7a66';g.font='12px Forest, sans-serif';g.fillText(SEASON[id],x,y+80);});
  for(const f of [0,1,2]){const im=await loadImage(path.join(out,'basket-'+f+'.png'));const x=180+f*340,y=rows*ch+20;g.drawImage(im,x-im.width/2,y);g.fillStyle='#4a3c2e';g.font='15px Forest, sans-serif';g.textAlign='center';g.fillText(['바구니 · 비어 있음','바구니 · 조금','바구니 · 가득'][f],x,y+200);}
  const dir=path.resolve(__dirname,'../docs/qa-0.8.7-draft');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/forage-items.png',sheet.toBuffer('image/png'));console.log('sheet');})();}
