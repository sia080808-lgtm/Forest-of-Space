// Motion sheet: every friend's 'groom' (머리 정돈) and 'litter' (낙엽 놀이) clip, drawn by the game's own renderer
// (rig.js ForestRig.draw, the same call scene.js makes). Output: docs/qa-0.6.33/runtime/groom-litter.mp4 (+ .png still)
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.6.33/runtime'),Rig=require(web+'/rig'),F=require(web+'/engine');
for(const f of fs.readdirSync(web+'/fonts').filter(f=>/\.(ttf|otf|woff2)$/.test(f)))try{GlobalFonts.registerFromPath(web+'/fonts/'+f,'Forest');}catch{}
const SPECIES=['ridley','bonbon','neolbi','bosong','jureong','superbum'],name=id=>F.SPECIES.find(x=>x[0]===id)[1],KINDS=[['groom','머리 정돈'],['litter','낙엽 놀이'],['itch','잎응애 떨기']];
(async()=>{fs.mkdirSync(out,{recursive:true});const A={terrain:await loadImage(web+'/assets/forest/terrain.png')};for(const [k,v] of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 const CW=250,CH=300,frame=createCanvas(CW*SPECIES.length,CH*KINDS.length+40),g=frame.getContext('2d'),FPS=24,SEC=Number(process.env.SEC??10),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gl-'));
 const render=t=>{g.fillStyle='#f6ece0';g.fillRect(0,0,frame.width,frame.height);g.fillStyle='#5a4838';g.font='19px Forest, sans-serif';g.textAlign='left';g.fillText('위: 머리 정돈(groom) · 가운데: 낙엽 놀이(litter) · 아래: 잎응애가 붙었을 때 떨기(공통)',12,27);
  KINDS.forEach(([kind,label],r)=>SPECIES.forEach((sp,i)=>{const x=i*CW+CW/2,y=40+r*CH+CH-52,size=sp==='superbum'?120:sp==='neolbi'?118:140;
   g.save();g.fillStyle='rgba(90,70,50,.15)';g.beginPath();g.ellipse(x,y,size*.34,size*.07,0,0,7);g.fill();g.restore();
   g.save();g.translate(x,y);g.scale(size/1254,size/1254);g.translate(-627,-1065.9);Rig.draw(g,A,kind==='itch'?{species:sp,kind:'idle',phase:t,itch:true}:{species:sp,kind,phase:t,expression:'focused'});g.restore();
   g.fillStyle='#5a4838';g.font='17px Forest, sans-serif';g.textAlign='center';g.fillText(name(sp)+' · '+label,x,40+r*CH+CH-14);}));};
 render(2.2);fs.writeFileSync(out+'/groom-litter.png',frame.toBuffer('image/png'));if(!SEC){console.log('still only');return;}
 for(let f=0;f<FPS*SEC;f++){render(f/FPS);fs.writeFileSync(path.join(tmp,String(f).padStart(4,'0')+'.png'),frame.toBuffer('image/png'));}
 execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',String(FPS),'-i',path.join(tmp,'%04d.png'),'-pix_fmt','yuv420p','-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2','-c:v','libx264','-crf','22',out+'/groom-litter.mp4']);fs.rmSync(tmp,{recursive:true});console.log('ok');})();
