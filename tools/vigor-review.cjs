// 1.1.5 review: 기운 높음·평소·낮음·바닥 동작, drawn by the game's own rig (ForestRig.draw with opt.vigor). Output: docs/qa-1.1.5/runtime/vigor.png
const fs=require('node:fs');const R=require('node:path').resolve(__dirname,'..')+'/';const {createCanvas,loadImage,GlobalFonts}=require(R+'node_modules/@napi-rs/canvas');
const web=R+'app/src/main/assets/web',Rig=require(web+'/rig'),F=require(web+'/engine');for(const f of fs.readdirSync(web+'/fonts').filter(f=>/\.(ttf|otf)$/.test(f)))try{GlobalFonts.registerFromPath(web+'/fonts/'+f,'Forest');}catch{}
const H={ridley:1000,bonbon:860,neolbi:1250,bosong:1050,jureong:720,superbum:1700},SP=Object.keys(H);
const COLS=[['high','walk',.25,'높음 · 걷기'],['high','idle',.35,'높음 · 폴짝'],[null,'idle',1,'평소'],['low','walk',.6,'낮음 · 걷기'],['low','idle',3.0,'낮음 · 한숨'],['faint','idle',2.8,'바닥']];
(async()=>{const A={terrain:await loadImage(web+'/assets/forest/terrain.png')};for(const [k,v] of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 const CW=230,CH=250,sheet=createCanvas(90+CW*COLS.length,40+CH*SP.length),g=sheet.getContext('2d');g.fillStyle='#f6ece0';g.fillRect(0,0,sheet.width,sheet.height);g.fillStyle='#4a3c2e';g.font='17px Forest, sans-serif';g.textAlign='center';COLS.forEach((c,i)=>g.fillText(c[3],90+i*CW+CW/2,26));
 for(const [r,sp] of SP.entries()){g.textAlign='left';g.fillText(F.SPECIES.find(x=>x[0]===sp)[1],10,40+r*CH+CH/2);for(const [i,[v,k,t]] of COLS.entries()){const x=90+i*CW+CW/2,y=40+r*CH+CH-25,size=1254*(sp==='superbum'?160:sp==='neolbi'?140:sp==='jureong'?110:135)/H[sp];
  g.save();g.translate(x,y);g.scale(size/1254,size/1254);g.translate(-627,-1065.9);Rig.draw(g,A,{species:sp,kind:k,phase:t,vigor:v,expression:v==='low'||v==='faint'?'sad':'neutral'});g.restore();}}
 fs.writeFileSync(R+'docs/qa-1.1.5/runtime/vigor.png',sheet.toBuffer('image/png'));console.log('ok');})();
