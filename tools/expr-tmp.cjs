const fs=require('node:fs'),path=require('node:path');const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web');globalThis.ForestEffects=require(web+'/world-effects');const Rig=require(web+'/rig');
(async()=>{const A={};for(const [k,v] of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 const E=(process.argv[3]||'neutral,surprised,happy').split(','),C=360,sh=createCanvas(C*E.length,C*2),g=sh.getContext('2d');g.fillStyle='#f6ecdf';g.fillRect(0,0,sh.width,sh.height);
 [['bosong',.62,.62],['jureong',.42,.5]].forEach(([sp,k,yy],r)=>E.forEach((e,i)=>{g.save();g.translate(i*C+C/2,r*C+C*(sp==='bosong'?1.55:1.15));g.scale(k,k);g.translate(-627,-1066);Rig.draw(g,A,{kind:'idle',phase:2.1,species:sp,expression:e,reduced:true});g.restore();}));
 fs.writeFileSync(process.argv[2],sh.toBuffer('image/png'));})();
