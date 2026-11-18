// Motion sheet for 슈퍼범: each in-game motion drawn with superbum.js (the same renderer the scene uses), dry and wet.
// Output: docs/qa-superbum/superbum-motion.mp4 and superbum-motion.png (one still per panel).
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-superbum'),S=require(web+'/superbum.js');
for(const f of fs.readdirSync(web+'/fonts').filter(f=>/\.(ttf|otf|woff2)$/.test(f)))try{GlobalFonts.registerFromPath(web+'/fonts/'+f,'Forest');}catch{}
const PANELS=[['idle','가만히'],['walk','걷기'],['run','달리기'],['held','들어 올림'],['rest','쉬기·잠'],['groom','잎 정돈'],['drink','물 마시기'],['splash','물장구'],['collect','빗물 모으기'],['share','물 나눔']];
(async()=>{const A={};for(const [k,v] of Object.entries(S.files))A[k]=await loadImage(web+'/'+v);
 const PW=300,PH=300,COLS=PANELS.length/2,frame=createCanvas(PW*COLS,PH*4+40),g=frame.getContext('2d'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sbm-')),FPS=24,SEC=Number(process.env.SEC||8);
 const render=t=>{g.fillStyle='#f6ece0';g.fillRect(0,0,frame.width,frame.height);
  g.fillStyle='#5a4838';g.font='20px Forest, sans-serif';g.textAlign='left';g.fillText('위 두 줄: 마른 둥지 · 아래 두 줄: 물 고인 둥지',12,28);
  for(const [wi,water] of [[0,0],[1,1]])PANELS.forEach(([kind,label],i)=>{const col=i%COLS,row=wi*2+Math.floor(i/COLS),x=col*PW,y=40+row*PH;
   g.save();g.fillStyle='rgba(90,70,50,.14)';g.beginPath();g.ellipse(x+PW/2,y+PH-46,95,12,0,0,7);g.fill();g.restore();
   g.save();g.translate(x+PW/2,y+PH-46);g.scale(.5,.5);S.drawLocal(g,A,{kind,phase:t,water,side:1,restBlend:1});g.restore();
   g.fillStyle='#5a4838';g.font='17px Forest, sans-serif';g.textAlign='center';g.fillText(label,x+PW/2,y+PH-14);});};
 render(1.3);fs.writeFileSync(out+'/superbum-motion.png',frame.toBuffer('image/png'));
 for(let f=0;f<FPS*SEC;f++){render(f/FPS);fs.writeFileSync(path.join(tmp,String(f).padStart(4,'0')+'.png'),frame.toBuffer('image/png'));}
 execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',String(FPS),'-i',path.join(tmp,'%04d.png'),'-pix_fmt','yuv420p','-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2','-c:v','libx264','-crf','22',out+'/superbum-motion.mp4']);
 fs.rmSync(tmp,{recursive:true});console.log('ok');})();
