const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.6.11/runtime');
const F=require(web+'/engine'),Rig=require(web+'/rig'),V=require(web+'/surfaces'),Effects=require(web+'/world-effects');
(async()=>{
 fs.mkdirSync(out,{recursive:true});GlobalFonts.registerFromPath(web+'/fonts/GowunDodum-Regular.ttf','K');const assets={};
 for(const n of ['garden','ridley','terrain','basin'])assets[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])assets[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');
 for(const [k,v]of Object.entries(Rig.files))assets[k]=await loadImage(web+'/'+v);
 let state=F.create(0,221);state.started=true;state.environment.tutorialDone=true;state.recruitment.nextAttempt=1e9;
 const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const context={ForestNeolbi:require(web+'/neolbi'),Forest:F,ForestRig:Rig,ForestEffects:Effects,ForestCamera:require(web+'/camera'),ForestSurfaces:V,ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',context);
 const scene=new context.Scene(canvas,()=>state);scene.assets=assets;scene.prepareLitter();scene.ready=true;scene.dt=.1;scene.phase=12.3;
 const board=createCanvas(1179,1460),bc=board.getContext('2d');bc.fillStyle='#f8f4eb';bc.fillRect(0,0,1179,1460);const report=[];
 for(const [row,time] of ['noon','night'].entries())for(const [col,intensity]of [35,60,100].entries()){
  state.previewTime=time;Object.assign(state.weather,{kind:'rain',intensity,wind:20,transition:0,remaining:240});delete state.environment.visualFrom;delete state.environment.precipFrom;
  state.individuals[0].B=60;const before=JSON.stringify(state);scene.draw();assert.equal(JSON.stringify(state),before);
  const name=`rain-${time}-${intensity}`;fs.writeFileSync(out+'/'+name+'.png',canvas.toBuffer('image/png'));
  bc.drawImage(canvas,col*393,row*730+40);bc.font='20px K';bc.fillStyle='#354532';bc.fillText((time==='noon'?'낮':'밤')+' · 비 '+intensity,col*393+18,row*730+29);report.push({time,intensity,profile:Effects.rainProfile(state),renderPure:true});
 }
 fs.writeFileSync(out+'/rain-visibility-0.6.11.png',board.toBuffer('image/png'));
 for(const z of [1,2.5]){scene.camera.z=z;scene.camera.clamp();scene.draw();fs.writeFileSync(out+'/rain-zoom-'+z+'.png',canvas.toBuffer('image/png'));}
 state.settings.reducedMotion=true;scene.phase=10;scene.draw();const still=canvas.toBuffer('image/png');scene.phase=20;scene.draw();assert.deepEqual(canvas.toBuffer('image/png'),still);state.settings.reducedMotion=false;
 state=F.create(0,221);state.started=true;state.environment.tutorialDone=true;state.recruitment.nextAttempt=1e9;state.previewTime='noon';Object.assign(state.weather,{kind:'cloud',wind:20,transition:0,remaining:240});
 const p=state.individuals[0],q=F.Objects.region(state,'spring','splash');Object.assign(p,q,{B:40,Q:0,mood:30,energy:70});p.objectNeeds={water:false,energy:false,nutrition:false,mood:true};p.objectTask={...q,object:'spring',kind:'splash',reason:'mood',serial:state.objects.nextSession++,since:state.worldTick,remaining:30,grade:2};p.target='spring';
 scene.camera.z=2.5;scene.camera.cx=p.x;scene.camera.cy=p.y-.04;scene.camera.clamp();scene.display={};const b=p.B,stock=state.spring.water;
 const markers=[];scene.onMarker=(id,cue)=>markers.push({id,cue});
 const sb=createCanvas(1179,730),sc=sb.getContext('2d');sc.fillStyle='#f8f4eb';sc.fillRect(0,0,1179,730);
 for(const [col,seconds]of [1,10,20].entries()){
  while(state.worldTick<seconds)F.step(state);F.valid(state);assert.equal(p.motion.kind,'splash');assert.ok(p.B>b);scene.phase=state.worldTick+.8;scene.tick=state.worldTick;scene.tickAt=scene.phase-1;const before=JSON.stringify(state);scene.draw();assert.equal(JSON.stringify(state),before);sc.drawImage(canvas,col*393,40);sc.font='17px K';sc.fillStyle='#354532';sc.fillText(seconds+'초 · 수분 '+p.B.toFixed(2)+' · 샘물 '+state.spring.water.toFixed(2),col*393+8,27);
 }
 assert.ok(markers.some(x=>x.cue==='drink'));
 fs.writeFileSync(out+'/splash-hydration-0.6.11.png',sb.toBuffer('image/png'));report.push({splash:{seconds:20,Bstart:b,Bend:p.B,springStart:stock,springEnd:state.spring.water,actualMotion:p.motion.kind,actualWater:p.motion.water}});
 p.B=80;p.Q=0;F.step(state);assert.equal(p.motion.water,0);const markerCount=markers.length;scene.phase=state.worldTick+.8;scene.tick=state.worldTick;scene.tickAt=scene.phase-1;scene.draw();assert.equal(markers.length,markerCount,'no drink marker above target');
 fs.writeFileSync(out+'/review.json',JSON.stringify({environment:'native Canvas actual scene renderer, not Android WebView',report,stateImmutable:true,reducedRainStatic:true},null,2));
 console.log('PASS: actual scene 6 rain states, two zoom levels, reduced-motion static frame, splash1/10/20s with real hydration, renderer leaves state unchanged');
})().catch(e=>{console.error(e);process.exit(1)});
