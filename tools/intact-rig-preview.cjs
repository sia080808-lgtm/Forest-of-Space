const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas'),fs=require('fs'),path=require('path');
const root='/workspace/scratch/8dd22e074e8f',web=path.resolve(__dirname,'../app/src/main/assets/web');
(async()=>{GlobalFonts.registerFromPath(web+'/fonts/GowunDodum-Regular.ttf','K');const im=await loadImage(web+'/assets/forest/ridley.png');
const layer=createCanvas(1254,1254),lc=layer.getContext('2d');lc.drawImage(im,0,0);const pix=lc.getImageData(0,0,1254,1254);for(let y=0;y<1254;y++)for(let x=0;x<1254;x++){let i=(y*1254+x)*4,[r,g,b]=pix.data.slice(i,i+3);if(!(y<950&&g>r*.92&&g-b>25))pix.data[i+3]=0;}lc.putImageData(pix,0,0);
const face=createCanvas(1254,1254),fc=face.getContext('2d');fc.drawImage(im,0,0);const fp=fc.getImageData(0,0,1254,1254);for(let y=0;y<1254;y++)for(let x=0;x<1254;x++){let i=(y*1254+x)*4,[r,g,b]=fp.data.slice(i,i+3);if(!(y>740&&y<875&&x>565&&x<800&&r>200&&g>180&&b>150))fp.data[i+3]=0;}fc.putImageData(fp,0,0);
const body=createCanvas(1254,1254),bc=body.getContext('2d');bc.beginPath();bc.moveTo(640,440);bc.bezierCurveTo(865,420,951,658,950,835);bc.bezierCurveTo(965,985,847,1040,660,1040);bc.bezierCurveTo(460,1040,362,1000,359,855);bc.bezierCurveTo(355,675,435,445,640,440);bc.closePath();bc.clip();bc.drawImage(im,460,895,450,130,340,420,640,640);bc.drawImage(face,0,0);
fs.writeFileSync(root+'/rig_preview_frames/intact-body.png',body.toBuffer('image/png'));
const canvas=createCanvas(1080,460),c=canvas.getContext('2d');
function texture(){c.drawImage(im,460,895,450,130,300,400,750,780);}
function leg(x,angle){c.save();c.translate(x,930);c.rotate(angle);c.beginPath();c.roundRect(-49,-45,98,220,49);c.clip();c.translate(-x,-930);texture();c.restore();}
function palm(x,y,angle){c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.ellipse(0,0,43,52,0,0,Math.PI*2);c.clip();c.drawImage(im,929,846,83,104,-43,-52,86,104);c.restore();}
for(let f=0;f<96;f++){let t=f/24;c.fillStyle='#f8f3e9';c.fillRect(0,0,1080,460);for(let j=0;j<3;j++){c.save();c.translate(j*360+180,335);c.scale(.33,.33);c.translate(-650,-1040);let wave=Math.sin(t*12),groom=j===1,cut=j===2; if(j===0)c.translate(0,-Math.abs(wave)*13);
let reach=groom?(t<.8?Math.sin(t/.8*Math.PI/2):t<2.8?1:t<3.6?Math.cos((t-2.8)/.8*Math.PI/2):0):0;
leg(515,j!==1?wave*.32:0);leg(795,j!==1?-wave*.32:0);
if(cut){c.globalAlpha=.32;c.drawImage(body,0,0);c.globalAlpha=1;}else{c.drawImage(body,0,0);c.drawImage(layer,0,0);}
palm(391,906,j===0?wave*.08:.2);palm(968-210*reach,898-232*reach+(reach===1?Math.sin(t*9)*8:0),-.2-.5*reach);
c.restore();c.fillStyle='#42533e';c.textAlign='center';c.font='23px K';c.fillText(['달리기','잎 정리','겹침 구조 확인'][j],j*360+180,39);c.font='16px K';c.fillText(['온전한 몸통 · 뒤쪽 다리','팔 2개 · 몸통은 그대로','몸통 반투명 · 숨겨진 다리 뿌리'][j],j*360+180,418);}fs.writeFileSync(root+'/rig_preview_frames/'+String(f).padStart(3,'0')+'.png',canvas.toBuffer('image/png'));}
})();
