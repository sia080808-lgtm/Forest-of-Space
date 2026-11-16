// Exact runtime parts: no generated replacement art or hidden cleanup.
const fs=require('node:fs'),path=require('node:path'),{createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),R=require(web+'/rig.js'),N=require(web+'/neolbi.js');
(async()=>{GlobalFonts.registerFromPath(web+'/fonts/GowunDodum-Regular.ttf','Gowun');const a={};for(const[k,v]of Object.entries(R.files))a[k]=await loadImage(web+'/'+v);const c=createCanvas(1320,1510),x=c.getContext('2d');x.fillStyle='#f7f4ec';x.fillRect(0,0,c.width,c.height);x.fillStyle='#35442f';x.font='34px Gowun';x.fillText('현재 실제 렌더 레이어 · 가공 없이 분리 표시',32,53);x.font='21px Gowun';x.fillText('뒤 잎들은 독립 PNG가 아니라 lining.png 한 장으로 합쳐져 있음',32,90);
const titles=['1 · 고정 뒤 레이어 전체','2 · 바깥 앞 챙 — 기본','3 · 바깥 앞 챙 — 연장','4 · 온전한 몸통','5 · 독립 발 두 개 + 코드로 그리는 눈','6 · 실제 합성 결과 — 연장 상태'];
const notes=['뒤 잎·안쪽 잎·앞 챙 일부·보강 조각이 합쳐짐','canopy.png의 0번 프레임','canopy.png의 20번 프레임','body-blank-v2.png에서 몸통 영역 사용','발: parts.png / 눈: 별도 PNG 없음','뒤 레이어 → 발 → 몸통 → 눈 → 앞 챙'];
for(let j=0;j<6;j++){let ox=20+j%2*650,oy=115+Math.floor(j/2)*440;x.save();x.translate(ox,oy);x.fillStyle='#43513b';x.font='24px Gowun';x.fillText(titles[j],14,30);for(let yy=50;yy<375;yy+=18)for(let xx=0;xx<630;xx+=18){x.fillStyle=((xx/18+yy/18)|0)%2?'#e7e8e1':'#f0f0eb';x.fillRect(xx,yy,18,18);}x.save();x.beginPath();x.rect(0,50,630,325);x.clip();x.translate(185,350);x.scale(7,7);
if(j===0)N.front(x,a.neolbiLining,0);
if(j===1||j===2)N.front(x,a.neolbiCanopy,j===2?1:0);
if(j===3)x.drawImage(a.neolbiBody,65,185,529,350,-16,-22.7,32,21.2);
if(j===4){for(let i=0;i<2;i++)x.drawImage(a.neolbiParts,i?985:750,893,i?133:132,90,(i?8:-8)-1.9,-5.2,3.8,5.7);for(const ex of[-.32,5.76]){x.strokeStyle='#f6ebd3';x.lineWidth=.72;x.lineCap='round';x.beginPath();x.moveTo(ex,-14);x.lineTo(ex,-11.5);x.stroke();}}
if(j===5){const s=1254/64*1.5;x.scale(1/s,1/s);x.translate(-627,-1065.9);R.draw(x,a,{species:'neolbi',phase:2,canopy:1});}x.restore();x.fillStyle='#56614f';x.font='19px Gowun';x.fillText(notes[j],12,409);x.restore();}
x.fillStyle='#8b463c';x.font='23px Gowun';x.fillText('문제: 뒤 잎을 앞 챙 모양으로 지운 뒤 덧대어, 경계와 잔여 픽셀이 남음.',32,1460);fs.writeFileSync('/workspace/scratch/8dd22e074e8f/deliverables/Neolbi-Actual-Layers.png',c.toBuffer('image/png'));})();
