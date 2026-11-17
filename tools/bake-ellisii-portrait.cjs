// Bakes the Ellisii UI portrait from the in-game rig so cards/roster match the world sprite.
// Usage: node tools/bake-ellisii-portrait.cjs  -> app/src/main/assets/web/assets/forest/species/ellisii-portrait.png
const fs=require('node:fs'),path=require('node:path');const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),SR=require(web+'/species-rig.js');
(async()=>{const assets={};for(const [k,v] of Object.entries(SR.files))assets[k]=await loadImage(web+'/'+v);
 const cv=createCanvas(1254,1254),c=cv.getContext('2d');SR.draw(c,assets,{species:'bonbon',kind:'idle',phase:0,reduced:true,expression:'neutral'});
 const d=c.getImageData(0,0,1254,1254).data;let x0=1254,y0=1254,x1=0,y1=0;for(let y=0;y<1254;y++)for(let x=0;x<1254;x++)if(d[(y*1254+x)*4+3]>8){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 const side=Math.max(x1-x0,y1-y0)*1.08,cx=(x0+x1)/2,cy=(y0+y1)/2,out=createCanvas(380,380);out.getContext('2d').drawImage(cv,cx-side/2,cy-side/2,side,side,0,0,380,380);
 const file=web+'/assets/forest/species/ellisii-portrait.png';fs.writeFileSync(file,out.toBuffer('image/png'));console.log('baked',file);})().catch(e=>{console.error(e);process.exit(1)});
