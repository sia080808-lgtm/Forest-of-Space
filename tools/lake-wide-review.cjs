// 0.9.5 review: the whole east lake (overview, centre, far shore, whole lake in summer and winter) in the real scene.js.
// Usage: node tools/lake-wide-review.cjs
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.9.5/runtime');fs.mkdirSync(out,{recursive:true});
const F=require(web+'/engine'),Rig=require(web+'/rig');for(const f of fs.readdirSync(web+'/fonts').filter(f=>/\.(ttf|otf|woff2)$/.test(f)))try{GlobalFonts.registerFromPath(web+'/fonts/'+f,'Forest');}catch{}
(async()=>{const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const B={x0:-.25,y0:-.25,x1:3.3,y1:1.25};const ctx={ForestNeolbi:require(web+'/neolbi'),ForestSuperbum:require(web+'/superbum'),Forest:F,ForestRig:Rig,ForestWorld:require(web+'/world'),ForestEnvironment:require(web+'/environment'),ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},Image:class{},console};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const A={};for(const n of ['garden','ridley','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const [k,v] of Object.entries(ctx.Scene.seasonFiles()))try{A[k]=await loadImage(web+'/'+v);}catch{}
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 A.gardenWide=await loadImage(web+'/assets/forest/garden-wide.png');for(let i=1;i<=6;i++)A['fern'+i]=await loadImage(web+'/assets/forest/ferns/fern-'+i+'.png');
 A.lakeFloor=await loadImage(web+'/assets/forest/lake/lake-floor.png');A.lakeIce=await loadImage(web+'/assets/forest/lake/lake-ice.png');for(const n of ['strider','snail','eggs','tadpole','frog','frogswim','nymph','dragonfly','beetle','medaka','larva'])A['life_'+n]=await loadImage(web+'/assets/forest/lake/life-'+n+'.png');for(const n of ['leaf','bud','half','full','sink','wither'])A['lily_'+n]=await loadImage(web+'/assets/forest/lake/lily-'+n+'.png');
 const shot=async(name,{cx,cy,z,season,friends,overview,lilies,tick,life})=>{const s=F.create(0,4);s.started=true;s.environment.tutorialDone=true;s.weather.kind='sun';s.weather.intensity=0;
  s.world.regions=['forest','lakeshore'];s.world.lake={ready:true,scents:3,openedAt:0};if(season)s.environment.calendar.start=-season*3600-400;
  if(tick!=null){s.worldTick=tick;s.environment.calendar.start=tick-3600-1500;}if(life)s.world.lake.life=life.map((q,i)=>({id:'life'+(i+1),kind:q[0],x:q[1],y:q[2],born:s.worldTick-10,...(q[0]==='tadpole'?{n:4}:{})}));if(lilies)s.world.lake.lilies=lilies.map((q,i)=>({id:'lily'+(i+1),x:q[0],y:q[1],born:s.worldTick-q[2]}));
  const base=JSON.parse(JSON.stringify(s.individuals[0]));s.individuals=friends.map((q,i)=>Object.assign(JSON.parse(JSON.stringify(base)),{id:'v'+i,species:q[0],xp:115,visualStage:3,B:60,energy:80,mood:90,x:q[1],y:q[2],motion:{kind:'idle',distance:0}}));
  const sc=new ctx.Scene(canvas,()=>s);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.draw();sc.camera.bounds={...B};
  if(overview){sc.camera.overview=false;sc.camera.setOverview(true);}else{sc.camera.z=z;sc.camera.cx=cx;sc.camera.cy=cy;sc.camera.clamp();}
  for(let e=0;e<1;e+=.25){sc.phase=10+e;sc.draw();}fs.writeFileSync(out+'/'+name+'.png',canvas.toBuffer('image/png'));};
 const fr=[['ridley',1.32,.55],['bonbon',1.38,.78],['bosong',3.12,.5],['jureong',3.05,.82],['neolbi',2.4,1.12]];
 const LL=[[1.7,.42,1300],[1.85,.62,2000],[2.1,.3,1500],[2.35,.7,1300],[2.55,.45,2000],[2.7,.62,600],[2.25,.82,2500]];
 const LF=[['strider',2.0,.45],['strider',2.6,.78],['medaka',2.3,.32],['frog',2.85,.5],['dragonfly',2.95,.3]];
 await shot('east-overview',{overview:true,friends:fr,tick:6000+300,lilies:LL,life:LF});
 await shot('east-center',{cx:2.25,cy:.55,z:1,tick:6000+300,lilies:LL,life:LF,friends:fr});
 await shot('east-farshore',{cx:2.95,cy:.55,z:1,tick:6000+300,lilies:LL,life:LF,friends:fr});
 await shot('east-lake-whole',{cx:2.3,cy:.5,z:.55,tick:6000+300,lilies:LL,life:LF,friends:fr});
 await shot('east-lake-whole-winter',{cx:2.3,cy:.5,z:.55,season:3,friends:[['ridley',2.25,.45],['bonbon',1.9,.6],['bosong',2.6,.55],...fr.slice(3)]});
 await shot('east-winter',{overview:true,season:3,friends:fr});
 console.log('ok');})().catch(e=>{console.error(e);process.exit(1);});
