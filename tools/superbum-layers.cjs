// Layer breakdown sheet for 슈퍼범: every rig layer on its own (checker = transparent), dry and wet, in drawing order.
const fs=require('node:fs'),path=require('node:path');const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),S=require(web+'/superbum.js');
for(const f of fs.readdirSync(web+'/fonts').filter(f=>/\.(ttf|otf|woff2)$/.test(f)))try{GlobalFonts.registerFromPath(web+'/fonts/'+f,'Forest');}catch{}
const NAMES={body:'1 얼굴·몸','foot-left':'2 왼발','foot-right':'3 오른발','skirt-left':'4 왼쪽 옆잎','skirt-right':'5 오른쪽 옆잎',crown:'6 둥지잎(머리)'};
(async()=>{const A={};for(const [k,v] of Object.entries(S.files))A[k]=await loadImage(web+'/'+v);
 const CW=240,CH=230,cols=S.LAYERS.length+1,cv=createCanvas(CW*cols,(CH+30)*2+10),g=cv.getContext('2d');g.fillStyle='#f6ece0';g.fillRect(0,0,cv.width,cv.height);
 ['dry','wet'].forEach((st,r)=>{const y0=r*(CH+30)+10;
  [...S.LAYERS,'all'].forEach((k,i)=>{const x0=i*CW;
   for(let yy=0;yy<CH;yy+=10)for(let xx=0;xx<CW-8;xx+=10){g.fillStyle=((xx+yy)/10)%2?'#ddd3c6':'#ece4d9';g.fillRect(x0+xx,y0+yy,10,10);}
   if(k==='all')for(const L of S.LAYERS)g.drawImage(A['superbum_'+st+'_'+L],x0,y0,CW-8,CH*(CW-8)/CW*420/480*480/420);
   else g.drawImage(A['superbum_'+st+'_'+k],x0,y0,CW-8,(CW-8)*420/480);
   g.fillStyle='#4a3b30';g.font='15px Forest, sans-serif';g.textAlign='center';g.fillText((st==='dry'?'마른 · ':'물 · ')+(k==='all'?'합친 모습':NAMES[k]),x0+CW/2-4,y0+CH+18);});});
 fs.writeFileSync(path.resolve(__dirname,'../docs/qa-superbum/superbum-layers.png'),cv.toBuffer('image/png'));console.log('ok');})();
