// 0.6.24 review: the visit (first meeting) card scene per visitor species, rendered with the app's drawVisit.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.6.24/runtime');
const F=require(web+'/engine'),Rig=require(web+'/rig');
(async()=>{fs.mkdirSync(out,{recursive:true});const A={};
 for(const n of ['garden','terrain'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');
 for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 const src=fs.readFileSync(web+'/forest-app.js','utf8'),i=src.indexOf('function drawVisit(t){'),j=src.indexOf('\n',src.indexOf('actors.sort',i));
 const sheet=createCanvas(720*3,580*2),sc=sheet.getContext('2d');let k=0;
 for(const [sp,x,y,phase] of [['bonbon',.37,.48,'leafNook'],['bonbon',.5,.72,'rest'],['bosong',.23,.66,'water'],['neolbi',.72,.54,'sun'],['jureong',.76,.76,'pick'],['ridley',.5,.72,'rest']]){
  const s=F.create(0,5);const canvas=createCanvas(720,580);s.recruitment.visitor={id:'v',species:sp,pet:{},seconds:60,open:true,ready:false,water:20,leaves:3,phase,x,y,companion:'ridley'};
  const ctx={$:()=>canvas,state:s,scene:{assets:A},ForestRig:Rig,ForestSurfaces:require(web+'/surfaces'),performance:{now:()=>0}};vm.createContext(ctx);vm.runInContext(src.slice(i,j)+'\ndrawVisit(1.2);',ctx);
  sc.drawImage(canvas,(k%3)*720,Math.floor(k/3)*580);k++;}
 fs.writeFileSync(out+'/visit-cards.png',sheet.toBuffer('image/png'));console.log('ok');})().catch(e=>{console.error(e);process.exit(1)});
