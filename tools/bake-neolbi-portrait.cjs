// Use the final approved five parts; no alternate portrait artwork.
const fs=require('node:fs'),path=require('node:path'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),N=require(web+'/neolbi.js');
(async()=>{const a={};for(const[k,v]of Object.entries(N.files))a[k]=await loadImage(web+'/'+v);const can=createCanvas(400,400),c=can.getContext('2d');c.translate(8.75,44);c.scale(1.5,1.5);N.drawLocal(c,a,{kind:'portrait',phase:3,reduced:true,canopy:0});fs.writeFileSync(web+'/assets/forest/neolbi/portrait.png',can.toBuffer('image/png'));})();
