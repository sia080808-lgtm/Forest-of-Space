// Renders the first-meeting card scene (forest-app.js drawVisit) for each visitor with the real assets and the real
// scene.js spring, on native Canvas (not Android WebView). Output: docs/qa-superbum/visit-cards.png
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),F=require(web+'/engine'),Rig=require(web+'/rig');
(async()=>{const A={};for(const n of ['garden','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 const app=fs.readFileSync(web+'/forest-app.js','utf8'),i0=app.indexOf('function drawVisit'),src=app.slice(i0,app.indexOf('\nfunction ',i0+10));
 const sceneSrc=fs.readFileSync(web+'/scene.js','utf8'),springAt=sceneSrc.slice(sceneSrc.indexOf(' springAt(c,s,x,y,g,phase){'),sceneSrc.indexOf('\n',sceneSrc.indexOf(' springAt(c,s,x,y,g,phase){')));
 const species=['bosong','superbum','bonbon','neolbi','jureong','ridley'],sheet=createCanvas(720*3,580*2),g=sheet.getContext('2d');
 species.forEach((sp,i)=>{const s=F.create(0,5);s.recruitment.visitor={species:sp,x:.5,y:.77,phase:'idle',water:20,companion:sp==='bonbon'?'ridley':'bonbon'};const canvas=createCanvas(720,580);
  const ctx={state:s,scene:{assets:A},ForestRig:Rig,ForestSurfaces:require(web+'/surfaces'),ForestEffects:require(web+'/world-effects'),ForestNeolbi:require(web+'/neolbi'),ForestSuperbum:require(web+'/superbum'),Forest:F,$:()=>canvas,Math};
  vm.createContext(ctx);vm.runInContext('scene.springAt=function'+springAt.trim().slice('springAt'.length)+';'+src+';drawVisit(2.5);',ctx);g.drawImage(canvas,(i%3)*720,Math.floor(i/3)*580);});
 fs.writeFileSync(path.resolve(__dirname,'../docs/qa-superbum/visit-cards.png'),sheet.toBuffer('image/png'));console.log('ok');})().catch(e=>{console.error(e);process.exit(1);});
