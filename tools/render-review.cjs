const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const F=require('../app/src/main/assets/web/engine.js'),Camera=require('../app/src/main/assets/web/camera.js');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.4.3');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const assets={};for(const n of ['garden','ridley','terrain'])assets[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-dry':n)+'.png');
 const state=F.create(Date.now(),88);state.started=true;
 function make(w,h){const canvas=createCanvas(w,h);canvas.getBoundingClientRect=()=>({width:w,height:h,left:0,top:0});const box={Forest:F,ForestCamera:Camera,ForestSurfaces:require('../app/src/main/assets/web/surfaces.js'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null},requestAnimationFrame:()=>{}};vm.createContext(box);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',box);const s=new box.Scene(canvas,()=>state);s.assets=assets;s.ready=true;s.phase=2;s.dt=.033;return {canvas,s};}
 for(const [w,h,z,name]of [[320,490,1,'narrow'],[360,576,1,'day'],[412,560,2,'zoom'],[360,576,3,'night-rain']]){const {canvas,s}=make(w,h);s.camera.zoom(z);state.settings.theme=name==='night-rain'?'night':'day';state.weather.kind=name==='night-rain'?'rain':'clear';s.dark=name==='night-rain'?1:0;s.draw();fs.writeFileSync(out+'/'+name+'.png',canvas.toBuffer('image/png'));}
 state.settings.theme='day';state.weather.kind='clear';
 const sheet=createCanvas(960,320),c=sheet.getContext('2d');c.fillStyle='#f4f0e5';c.fillRect(0,0,960,320);const {s}=make(360,576);s.ctx=c;s.carry={phaseStart:0};const p=state.individuals[0];p.xp=60;
 for(const [i,t]of [0,.2,.3,.5,.7,1.2].entries()){c.save();c.translate(i*160+80,190);c.scale(2.2,2.2);s.pet(p,{x:0,y:0},'held',t,false,true);c.restore();c.fillStyle='#43513b';c.font='18px sans-serif';c.fillText(t.toFixed(1)+' s',i*160+55,280);}
 fs.writeFileSync(out+'/held-poses.png',sheet.toBuffer('image/png'));console.log('Rendered 4 actual Canvas views and held-pose sheet.');
})().catch(e=>{console.error(e);process.exit(1)});
