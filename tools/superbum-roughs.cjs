// Rough silhouette studies for 슈퍼범 (not game art): several different ways to deform the plant — where the nest frond
// sits, how the antler fronds hang — each drawn as a few soft closed shapes in the forest's palette.
const fs=require('node:fs'),path=require('node:path');const {createCanvas}=require('@napi-rs/canvas');
const CW=380,CH=440;let seed=5;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
// closed Catmull-Rom through points -> smooth organic outline
function blob(c,pts){c.beginPath();const n=pts.length;for(let i=0;i<n;i++){const p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];if(i===0)c.moveTo(...p1);
 c.bezierCurveTo(p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6,p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6,p2[0],p2[1]);}c.closePath();}
const LEAF=['#cfd79c','#a9b672'],LEAF2=['#bfca88','#94a35f'],BODY=['#806957','#5d4a3d'];
function paint(c,pts,[a,b],tilt=0){const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),y0=Math.min(...ys),y1=Math.max(...ys),x0=Math.min(...xs),x1=Math.max(...xs);
 const g=c.createLinearGradient(x0+tilt,y0,x1-tilt,y1);g.addColorStop(0,a);g.addColorStop(1,b);c.fillStyle=g;blob(c,pts);c.fill();
 c.save();blob(c,pts);c.clip();for(let i=0;i<260;i++){c.fillStyle=rnd()<.5?'rgba(40,40,20,1)':'rgba(255,250,230,1)';c.globalAlpha=.04+rnd()*.05;c.beginPath();c.arc(x0+rnd()*(x1-x0),y0+rnd()*(y1-y0),.5+rnd()*1.6,0,7);c.fill();}
 c.globalAlpha=1;c.filter='blur(10px)';c.fillStyle='rgba(255,250,228,.22)';c.beginPath();c.ellipse(x0+(x1-x0)*.32,y0+(y1-y0)*.3,(x1-x0)*.25,(y1-y0)*.16,-.4,0,7);c.fill();c.restore();}
function eyes(c,x,y,gap=26,h=18){c.save();c.strokeStyle='#eee2ca';c.lineWidth=7;c.lineCap='round';for(const dx of [0,gap]){c.beginPath();c.moveTo(x+dx,y);c.lineTo(x+dx-1.5,y+h);c.stroke();}c.restore();}
function feet(c,x1,x2,y){for(const x of [x1,x2])paint(c,[[x-20,y],[x,y-10],[x+20,y],[x,y+10]],BODY);}
function water(c,x,y,rx,ry){const g=c.createLinearGradient(0,y-ry,0,y+ry);g.addColorStop(0,'#d3ebe5');g.addColorStop(1,'#87b9b9');c.fillStyle=g;c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();c.fillStyle='rgba(255,255,255,.8)';c.beginPath();c.ellipse(x-rx*.3,y-ry*.3,rx*.35,ry*.25,0,0,7);c.fill();}
const shadow=(c,x,y,w)=>{c.save();c.filter='blur(6px)';c.fillStyle='rgba(90,70,50,.18)';c.beginPath();c.ellipse(x,y,w,10,0,0,7);c.fill();c.restore();};
const V={
 // A. 둥지잎을 비스듬히 쓴 바구니 모자, 뒤로 늘어진 사슴뿔잎 두 가닥(댕기)
 A(c){shadow(c,190,402,110);paint(c,[[300,250],[338,300],[330,360],[300,396],[296,330]],LEAF2);paint(c,[[96,262],[70,320],[64,380],[86,400],[102,330]],LEAF2);
  paint(c,[[110,300],[130,232],[196,206],[262,224],[290,292],[282,370],[190,396],[118,376]],BODY);eyes(c,208,300);feet(c,160,232,398);
  paint(c,[[90,250],[96,170],[150,136],[230,140],[300,170],[318,236],[270,226],[200,214],[130,236]],LEAF,20);water(c,206,180,74,12);paint(c,[[96,238],[200,222],[316,232],[300,256],[200,248],[110,262]],LEAF2);},
 // B. 넓은 접시 둥지(챙 넓은 모자), 챙 양끝에서 귀처럼 늘어진 사슴뿔잎
 B(c){shadow(c,190,404,100);paint(c,[[38,190],[30,250],[50,320],[70,300],[62,236],[80,206]],LEAF2);paint(c,[[342,190],[350,250],[332,316],[312,298],[318,238],[300,206]],LEAF2);
  paint(c,[[118,310],[132,226],[190,206],[250,226],[266,310],[252,384],[190,398],[128,384]],BODY);eyes(c,186,290);feet(c,160,224,400);
  paint(c,[[34,200],[90,168],[190,154],[292,168],[346,200],[300,222],[190,232],[80,222]],LEAF,30);water(c,190,186,96,13);paint(c,[[52,206],[190,228],[328,206],[296,236],[190,246],[84,236]],LEAF2);},
 // C. 둥지잎이 몸 뒤를 감싸 안은 망토(나무를 감싸는 모습), 머리 위로 컵, 사슴뿔잎은 앞머리처럼 한쪽으로
 C(c){shadow(c,190,404,112);paint(c,[[70,380],[54,280],[70,170],[120,108],[190,84],[262,108],[310,170],[326,280],[310,380],[190,400]],LEAF,10);
  water(c,190,130,60,12);paint(c,[[110,330],[118,236],[190,206],[262,236],[270,330],[258,388],[190,400],[122,388]],BODY);eyes(c,206,300);feet(c,160,222,400);
  paint(c,[[118,236],[176,206],[240,214],[216,240],[200,290],[186,258],[164,300],[150,256]],LEAF2);},
 // D. 위로 솟은 둥근 귀 두 장(둥지잎), 사슴뿔잎은 등 뒤로 바닥까지 늘어진 꼬리
 D(c){shadow(c,190,404,110);paint(c,[[250,300],[310,330],[350,380],[340,404],[300,392],[262,362]],LEAF2);
  paint(c,[[120,330],[130,250],[190,226],[254,248],[264,330],[252,392],[190,402],[128,392]],BODY);eyes(c,180,306);feet(c,162,222,402);
  water(c,190,236,52,10);paint(c,[[128,250],[90,190],[86,110],[120,82],[160,120],[176,226]],LEAF,10);paint(c,[[206,226],[220,120],[260,84],[298,110],[294,190],[254,250]],LEAF,10);},
 // E. 물방울 몸 + 머리 위 큰 부채잎 하나, 사슴뿔잎은 소매처럼 땅까지
 E(c){shadow(c,190,404,96);paint(c,[[120,250],[96,330],[90,396],[116,400],[132,330]],LEAF2);paint(c,[[260,250],[284,330],[290,396],[264,400],[248,330]],LEAF2);
  paint(c,[[190,170],[240,240],[262,320],[246,384],[190,400],[134,384],[118,320],[140,240]],BODY);eyes(c,190,290,24);feet(c,166,216,402);
  paint(c,[[190,206],[120,180],[86,120],[110,70],[160,58],[190,84],[220,58],[270,70],[294,120],[260,180]],LEAF,10);water(c,190,198,40,9);},
 // F. 사슴뿔잎이 주인공: 머리 위 작은 컵에서 버드나무처럼 사방으로 늘어진 잎, 그 아래 작은 몸
 F(c){shadow(c,190,404,120);const strands=[[-1,1],[1,1],[-1,.7],[1,.7]];for(const [s,k] of strands){const X=x=>190+s*x;paint(c,[[X(20),176],[X(110*k),190],[X(150*k),270],[X(150*k+10),360*k+30],[X(130*k),380*k+20],[X(120*k),300],[X(60),210]],LEAF2);}
  paint(c,[[130,340],[140,270],[190,252],[240,270],[250,340],[240,394],[190,402],[140,394]],BODY);eyes(c,180,322,22,15);feet(c,166,214,402);
  paint(c,[[120,190],[130,140],[190,124],[250,140],[260,190],[190,206]],LEAF,10);water(c,190,150,52,10);},

 // G. 얼굴을 둘러싼 둥근 갈기(둥지잎) + 정수리 컵, 턱 아래로 늘어진 짧은 사슴뿔잎 수염
 G(c){shadow(c,190,404,100);paint(c,[[190,110],[262,130],[306,190],[312,270],[290,330],[190,350],[90,330],[68,270],[74,190],[118,130]],LEAF,10);water(c,190,128,56,10);
  paint(c,[[124,300],[132,220],[190,196],[248,220],[256,300],[246,380],[190,398],[134,380]],BODY);eyes(c,178,280);feet(c,162,218,400);
  paint(c,[[150,340],[170,346],[176,388],[160,396],[146,372]],LEAF2);paint(c,[[208,346],[230,340],[236,372],[222,398],[204,388]],LEAF2);},
 // H. 비대칭: 등에 멘 바구니(둥지잎)와 한쪽 어깨로 크게 흘러내린 사슴뿔잎 한 장
 H(c){shadow(c,190,404,110);paint(c,[[200,250],[150,170],[170,90],[240,70],[300,110],[304,190],[270,260]],LEAF,10);water(c,236,108,50,10);
  paint(c,[[106,320],[116,240],[180,214],[250,236],[262,320],[250,388],[180,400],[116,388]],BODY);eyes(c,150,296);feet(c,148,214,400);
  paint(c,[[182,218],[250,226],[300,276],[330,350],[318,396],[296,370],[276,396],[262,340],[236,276],[196,246]],LEAF2);},
};
const names={A:'A 비스듬한 바구니 모자 + 댕기',B:'B 챙 넓은 접시 모자 + 늘어진 귀',C:'C 몸을 감싼 망토 + 앞머리',D:'D 위로 선 둥근 귀 + 땅에 끌리는 꼬리',E:'E 물방울 몸 + 부채잎 + 긴 소매',F:'F 버드나무처럼 늘어진 사슴뿔잎',G:'G 얼굴 둘레 갈기 + 짧은 수염',H:'H 등 바구니 + 한쪽 어깨로 흘러내린 잎'};
const keys=Object.keys(V),cols=4,cv=createCanvas(CW*cols,(CH+40)*Math.ceil(keys.length/cols)),c=cv.getContext('2d');c.fillStyle='#f6ece0';c.fillRect(0,0,cv.width,cv.height);
const {GlobalFonts}=require('@napi-rs/canvas');try{GlobalFonts.registerFromPath(path.resolve(__dirname,'../app/src/main/assets/web/fonts/PretendardVariable.woff2'),'P');}catch{}
keys.forEach((k,i)=>{const x=(i%cols)*CW,y=Math.floor(i/cols)*(CH+40);c.save();c.translate(x,y);V[k](c);c.restore();c.fillStyle='#5a4838';c.font='20px P, sans-serif';c.textAlign='center';c.fillText(names[k],x+CW/2,y+CH+24);});
fs.writeFileSync(path.resolve(__dirname,'../docs/qa-superbum-draft/roughs.png'),cv.toBuffer('image/png'));console.log('ok');
