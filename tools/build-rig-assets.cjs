const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas'),fs=require('fs'),path=require('path');
const root='/workspace/scratch/8dd22e074e8f',web=path.resolve(__dirname,'../app/src/main/assets/web');
(async()=>{GlobalFonts.registerFromPath(web+'/fonts/GowunDodum-Regular.ttf','K');const im=await loadImage(web+'/assets/forest/ridley.png');
const layer=createCanvas(1254,1254),lc=layer.getContext('2d');lc.drawImage(im,0,0);const pix=lc.getImageData(0,0,1254,1254);for(let y=0;y<1254;y++)for(let x=0;x<1254;x++){let i=(y*1254+x)*4,[r,g,b]=pix.data.slice(i,i+3);if(!(y<950&&g>r*.92&&g-b>25))pix.data[i+3]=0;}lc.putImageData(pix,0,0);
const face=createCanvas(1254,1254),fc=face.getContext('2d');fc.drawImage(im,0,0);const fp=fc.getImageData(0,0,1254,1254);for(let y=0;y<1254;y++)for(let x=0;x<1254;x++){let i=(y*1254+x)*4,[r,g,b]=fp.data.slice(i,i+3);if(!(y>740&&y<875&&x>565&&x<800&&r>200&&g>180&&b>150))fp.data[i+3]=0;}fc.putImageData(fp,0,0);for(let i=0;i<pix.data.length;i+=4)if(fp.data[i+3])pix.data[i+3]=0;lc.putImageData(pix,0,0);
const body=createCanvas(1254,1254),bc=body.getContext('2d');bc.beginPath();bc.moveTo(640,440);bc.bezierCurveTo(865,420,951,658,950,835);bc.bezierCurveTo(965,985,847,1040,660,1040);bc.bezierCurveTo(460,1040,362,1000,359,855);bc.bezierCurveTo(355,675,435,445,640,440);bc.closePath();bc.clip();bc.drawImage(im,460,895,450,130,340,420,640,640);
fs.writeFileSync(root+'/rig_preview_frames/intact-body.png',body.toBuffer('image/png'));
const out=web+'/assets/forest/rig';fs.mkdirSync(out,{recursive:true});
for(const [name,can] of [['body',body],['leaves',layer],['face',face]])fs.writeFileSync(out+'/'+name+'.png',can.toBuffer('image/png'));
for(const [name,x]of [['leg-left',515],['leg-right',795]]){const can=createCanvas(98,220),c=can.getContext('2d');c.beginPath();c.roundRect(0,0,98,220,49);c.clip();c.translate(-(x-49),-885);c.drawImage(im,460,895,450,130,300,400,750,780);fs.writeFileSync(out+'/'+name+'.png',can.toBuffer('image/png'));}
const palm=createCanvas(86,104),c=palm.getContext('2d');c.beginPath();c.ellipse(43,52,43,52,0,0,Math.PI*2);c.clip();c.drawImage(im,929,846,83,104,0,0,86,104);fs.writeFileSync(out+'/palm.png',palm.toBuffer('image/png'));
})();
