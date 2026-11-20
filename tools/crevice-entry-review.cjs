// 0.8.6 review: a friend walking into the crevice gap, cropped frames at 0~3.4 s after it arrives (scene.js + native Canvas, seasonal art).
// Usage: node tools/crevice-entry-review.cjs <outDir> <season> <species> [webDir]   (webDir lets you render an older checkout)
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=require('path').resolve(process.argv[5]||require('path').join(__dirname,'../app/src/main/assets/web')),out=process.argv[2];const season=process.argv[3]||'spring',sp=process.argv[4]||'bonbon';
const F=require(web+'/engine'),Rig=require(web+'/rig');
(async()=>{const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),ForestSuperbum:require(web+'/superbum'),Forest:F,ForestRig:Rig,ForestWorld:require(web+'/world'),ForestEnvironment:require(web+'/environment'),ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},Image:class{},console};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const A={};const files={...ctx.Scene.seasonFiles()};for(const n of ['garden','ridley','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const [k,v] of Object.entries(files))try{A[k]=await loadImage(web+'/'+v);}catch{}
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 A.gardenWide=await loadImage(web+'/assets/forest/garden-wide.png');A.frame=await loadImage(web+'/assets/forest/frame.png');
 const s=F.create(0,5);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;const si=['spring','summer','autumn','winter'].indexOf(season);s.worldTick=300;s.environment.calendar.start=300-si*3600-600;
 s.weather.kind='sun';s.weather.intensity=0;
 const z=s.patches.find(q=>q.id==='crevice');const base=s.individuals[0];Object.assign(base,{xp:115,visualStage:3,energy:30,species:sp,name:sp});
 const o=F.Objects.option(s,base,'crevice','rest','energy');Object.assign(base,{x:o.x,y:o.y,action:'rest',target:'crevice',motion:{kind:'rest',distance:0}});base.objectTask={...o,arrived:true};
 const sc=new ctx.Scene(canvas,()=>s);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.dt=.1;sc.camera.z=3;sc.camera.cx=z.x;sc.camera.cy=z.y;sc.camera.clamp();
 const nook=sc.nookPos.bind(sc);let on=false;sc.nookPos=p=>on?nook(p):null;
 const crop=(name)=>{const c=createCanvas(240,200),g=c.getContext('2d');const q=sc.camera.screen({x:z.x,y:z.y});g.drawImage(canvas,q.x-120,q.y-130,240,200,0,0,240,200);fs.writeFileSync(out+'/'+name+'.png',c.toBuffer('image/png'));};
 for(let i=0;i<5;i++){sc.phase=2+i*.1;sc.draw();}crop(season+'-'+sp+'-before');
 on=true;for(const t of [0,.4,.8,1.2,1.6,2.4,3.4]){while(sc.phase<2.5+t-1e-9){sc.phase=Math.min(2.5+t,sc.phase+.1);sc.draw();}crop(season+'-'+sp+'-t'+t);}
 console.log('ok');})().catch(e=>{console.error(e);process.exit(1);});
