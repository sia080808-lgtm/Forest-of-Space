// 0.7.1 review: an ant colony next to its ridley in the real scene.js (native Canvas, not Android WebView), by day (two
// workers patrol) and at night (they stay in the nest). Render must not change the state. Output: docs/qa-0.7.1/runtime/*.png
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.7.1/runtime');fs.mkdirSync(out,{recursive:true});
const F=require(web+'/engine'),Rig=require(web+'/rig');
(async()=>{const A={};for(const n of ['garden','ridley','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 A.gardenWide=await loadImage(web+'/assets/forest/garden-wide.png');A.shelterArt=await loadImage(web+'/assets/forest/shelter-art.png');A.frame=await loadImage(web+'/assets/forest/frame.png');for(let i=1;i<=6;i++)A['fern'+i]=await loadImage(web+'/assets/forest/ferns/fern-'+i+'.png');
 const vw=393,vh=690,canvas=createCanvas(vw*2,vh*2);canvas.getBoundingClientRect=()=>({width:vw,height:vh,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),ForestSuperbum:require(web+'/superbum'),Forest:F,ForestRig:Rig,ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:2,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{},localStorage:{getItem:()=>null,setItem:()=>{}}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const s=F.create(0,5);s.started=true;s.mode='game';s.environment.tutorialDone=true;s.environment.timeOfDay=.5;s.weather.kind='sun';s.weather.intensity=0;s.weather.wind=10;
 const base=s.individuals[0];Object.assign(base,{x:.42,y:.62,xp:115,visualStage:3});
 for(const [sp,x,y] of [['bonbon',.6,.55],['neolbi',.3,.78],['bosong',-.1,.95],['jureong',.52,.42],['superbum',1.1,.4]])s.individuals.push({...F.clone(base),id:sp,species:sp,name:sp,x,y,active:true,sources:{rain:0,other:0,unknown:0},V:0});
 s.objects.creatures.groups.push({id:'cr:1',kind:'ant',since:0,bad:0,lastWork:0,carry:null,nest:{x:.47,y:.66},host:base.id,away:0,hungry:0});
 F.valid(s);const before=JSON.stringify(s);
 const sc=new ctx.Scene(canvas,()=>s);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.dt=.1;
 const shot=(name,set)=>{set(sc.camera);for(let i=0;i<4;i++){sc.phase=2+i*.1;sc.draw();}fs.writeFileSync(out+'/'+name+'.png',canvas.toBuffer('image/png'));};
 const zoom=c=>{c.reset();c.zoom(2.6);c.pan(-120,-150);};shot('ant-day',c=>{s.worldTick=300;zoom(c);});const day=JSON.stringify(s);shot('ant-night',c=>{s.worldTick=900;zoom(c);});const night=JSON.stringify(s);if(JSON.stringify(s)!==night)throw Error();
 s.worldTick=0;if(JSON.stringify(s)!==before)throw Error('render changed state');console.log('ok, state unchanged; zMin',sc.camera.zMin.toFixed(3));})().catch(e=>{console.error(e);process.exit(1);});
