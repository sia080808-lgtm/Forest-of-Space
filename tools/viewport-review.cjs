const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.4.4');fs.mkdirSync(out,{recursive:true});
GlobalFonts.registerFromPath(web+'/fonts/PretendardVariable.woff2','Pretendard');
const F=require(web+'/engine.js'),Camera=require(web+'/camera.js');
(async()=>{
 const assets={};for(const n of ['garden','ridley','terrain'])assets[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-dry':n)+'.png');
 const state=F.create(1794744000000,88);state.started=true;state.settings.theme='day';state.settings.reducedMotion=true;state.weather.kind='clear';
 const before=JSON.stringify(state),results=[];
 for(const [w,h,name]of [[473,740,'reference'],[320,600,'narrow'],[412,560,'short']]){
  const canvas=createCanvas(w,h);canvas.getBoundingClientRect=()=>({width:w,height:h,left:0,top:0});
  const context={Forest:F,ForestCamera:Camera,ForestSurfaces:require(web+'/surfaces.js'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null},requestAnimationFrame:()=>{}};
  vm.createContext(context);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',context);
  const scene=new context.Scene(canvas,()=>state);scene.assets=assets;scene.ready=true;scene.phase=2;scene.dt=.033;
  const record=label=>{scene.draw();fs.writeFileSync(out+'/'+name+'-'+label+'.png',canvas.toBuffer('image/png'));results.push({viewport:[w,h],view:label,scale:scene.camera.scale,tx:scene.camera.tx,ty:scene.camera.ty,visibleHeight:scene.camera.visibleHeight});};
  record('world');const scale=scene.camera.scale,tx=scene.camera.tx,ty=scene.camera.ty;
  scene.editing=true;scene.camera.setBottomOcclusion(Math.min(300,h*.48));record('editor');
  assert.equal(scene.camera.scale,scale);assert.ok(Math.abs(scene.camera.tx-tx)<1e-9);assert.ok(Math.abs(scene.camera.ty-ty)<1e-9);
  scene.camera.pan(0,-10000);record('editor-bottom');assert.ok(Math.abs(scene.camera.screen({x:.5,y:1}).y-scene.camera.visibleHeight)<1e-9);
  scene.camera.setBottomOcclusion(0);scene.editing=false;scene.camera.zoom(3);record('zoom');
 }
 assert.equal(JSON.stringify(state),before);fs.writeFileSync(out+'/viewport-checks.json',JSON.stringify(results,null,2));
 console.log('PASS: 12 actual scene renders; constant editor scale; bottom edge accessible; no simulation mutation. Editor captures show Canvas only, not HTML panels.');
})().catch(e=>{console.error(e);process.exit(1)});
