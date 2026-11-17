// Selection ring review: actual scene.js render via native Canvas (not Android WebView).
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-selection-ring');
const F=require(web+'/engine'),Rig=require(web+'/rig'),V=require(web+'/surfaces'),Effects=require(web+'/world-effects');
(async()=>{
 fs.mkdirSync(out,{recursive:true});GlobalFonts.registerFromPath(web+'/fonts/GowunDodum-Regular.ttf','K');const assets={};
 for(const n of ['garden','ridley','terrain','basin'])assets[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])assets[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');
 for(const [k,v]of Object.entries(Rig.files))assets[k]=await loadImage(web+'/'+v);
 const state=F.create(0,88);state.started=true;state.environment.tutorialDone=true;state.recruitment.nextAttempt=1e9;
 F.welcomeNeolbi(state);const r=state.individuals[0],n=state.individuals.find(p=>p.species==='neolbi');
 Object.assign(r,{x:.40,y:.56,xp:120,motion:{kind:'idle',distance:0}});Object.assign(n,{active:true,x:.62,y:.56,xp:120,canopy:false,canopyProgress:0,motion:{kind:'idle',distance:0}});
 const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const context={ForestNeolbi:require(web+'/neolbi'),Forest:F,ForestRig:Rig,ForestEffects:Effects,ForestCamera:require(web+'/camera'),ForestSurfaces:V,ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',context);
 const scene=new context.Scene(canvas,()=>state);scene.assets=assets;scene.prepareLitter();scene.ready=true;scene.inspector=null;scene.dt=.1;scene.phase=12.3;
 const board=createCanvas(786*2,1000),bc=board.getContext('2d');bc.fillStyle='#f8f4eb';bc.fillRect(0,0,board.width,board.height);const report=[];
 const shots=[['noon',r.id,'낮 · 리들리 선택'],['noon',n.id,'낮 · 엘레판 선택'],['night',r.id,'밤 · 리들리 선택'],['night',null,'밤 · 선택 없음(비교)']];
 for(const [i,[time,sel,label]] of shots.entries()){
  state.previewTime=time;scene.selected=sel;scene.camera.z=2.2;scene.camera.cx=.51;scene.camera.cy=.54;scene.camera.clamp();
  const before=JSON.stringify(state);scene.draw();assert.equal(JSON.stringify(state),before,'render must not mutate state');
  const name="ring-"+time+"-"+(sel===r.id?"ridley":sel?"elephan":"none"),png=canvas.toBuffer("image/png");fs.writeFileSync(out+"/"+name+".png",png);const shot=await loadImage(png);
  const col=i%2,row=Math.floor(i/2);bc.drawImage(shot,0,260,393,200,col*786,row*500+40,786,400);bc.font='22px K';bc.fillStyle='#354532';bc.fillText(label,col*786+16,row*500+30);report.push({name,time,selected:sel,renderPure:true});
 }
 state.previewTime='noon';scene.selected=r.id;state.settings.reducedMotion=true;scene.phase=3;scene.draw();const a=canvas.toBuffer('image/png');scene.phase=9;scene.draw();const b=canvas.toBuffer('image/png');
 state.settings.reducedMotion=false;report.push({reducedMotionStatic:a.equals(b)});
 fs.writeFileSync(out+'/selection-ring-board.png',board.toBuffer('image/png'));fs.writeFileSync(out+'/verification.json',JSON.stringify({renderer:'scene.js + @napi-rs/canvas (not Android WebView)',report},null,1));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});
