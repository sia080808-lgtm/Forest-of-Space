// Bakes the 슈퍼범 UI portrait from the in-game layers (dry nest, idle) so cards and the roster match the world sprite.
// Usage: node tools/bake-superbum-portrait.cjs  -> app/src/main/assets/web/assets/forest/species/superbum-portrait.png
const fs=require('node:fs'),path=require('node:path');const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),S=require(web+'/superbum.js');
(async()=>{const assets={};for(const [k,v] of Object.entries(S.files))assets[k]=await loadImage(web+'/'+v);
 const cv=createCanvas(480,440),c=cv.getContext('2d');c.translate(240,420);S.drawLocal(c,assets,{kind:'idle',phase:0,reduced:true,water:0});
 const d=c.getImageData(0,0,480,440).data;let x0=480,y0=440,x1=0,y1=0;for(let y=0;y<440;y++)for(let x=0;x<480;x++)if(d[(y*480+x)*4+3]>8){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 const side=Math.max(x1-x0,y1-y0)*1.06,cx=(x0+x1)/2,cy=(y0+y1)/2,out=createCanvas(380,380);out.getContext('2d').drawImage(cv,cx-side/2,cy-side/2,side,side,0,0,380,380);
 const file=web+'/assets/forest/species/superbum-portrait.png';fs.writeFileSync(file,out.toBuffer('image/png'));console.log('baked',file);})().catch(e=>{console.error(e);process.exit(1)});
