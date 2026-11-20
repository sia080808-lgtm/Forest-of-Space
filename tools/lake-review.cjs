// 0.9.0 review: the lake shore region in the real scene.js (default view at the forest's east edge, the shore, overview, winter ice).
// (native Canvas, seasonal art). Usage: node tools/lake-review.cjs
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.9.0/runtime');fs.mkdirSync(out,{recursive:true});
const F=require(web+'/engine'),Rig=require(web+'/rig');for(const f of fs.readdirSync(web+'/fonts').filter(f=>/\.(ttf|otf|woff2)$/.test(f)))try{GlobalFonts.registerFromPath(web+'/fonts/'+f,'Forest');}catch{}
(async()=>{const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),ForestSuperbum:require(web+'/superbum'),Forest:F,ForestRig:Rig,ForestWorld:require(web+'/world'),ForestEnvironment:require(web+'/environment'),ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},Image:class{},console};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const A={};for(const n of ['garden','ridley','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const [k,v] of Object.entries(ctx.Scene.seasonFiles()))try{A[k]=await loadImage(web+'/'+v);}catch{}
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 A.gardenWide=await loadImage(web+'/assets/forest/garden-wide.png');for(let i=1;i<=6;i++)A['fern'+i]=await loadImage(web+'/assets/forest/ferns/fern-'+i+'.png');
 A.lakeFloor=await loadImage(web+'/assets/forest/lake/lake-floor.png');A.lakeIce=await loadImage(web+'/assets/forest/lake/lake-ice.png');
 const shot=async(name,{cx,cy,z,season,friends,overview})=>{const s=F.create(0,4);s.started=true;s.environment.tutorialDone=true;s.weather.kind='sun';s.weather.intensity=0;
  s.world.regions=['forest','lakeshore'];s.world.lake={ready:true,scents:3,openedAt:0};
  if(season){s.environment.calendar.start=-season*3600-400;}
  const base=JSON.parse(JSON.stringify(s.individuals[0]));s.individuals=friends.map((q,i)=>Object.assign(JSON.parse(JSON.stringify(base)),{id:'v'+i,species:q[0],xp:115,visualStage:3,B:60,energy:80,mood:90,x:q[1],y:q[2],motion:{kind:'idle',distance:0}}));
  const before=JSON.stringify(s);const sc=new ctx.Scene(canvas,()=>s);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.draw();
  if(overview){sc.camera.setOverview(true);}else{sc.camera.z=z;sc.camera.cx=cx;sc.camera.cy=cy;sc.camera.clamp();}
  for(let e=0;e<1;e+=.1){sc.phase=10+e;sc.draw();}
  if(JSON.stringify(s)!==before)throw Error('render changed the state: '+name);
  fs.writeFileSync(out+'/'+name+'.png',canvas.toBuffer('image/png'));};
 const fr=[['ridley',1.12,.55],['bonbon',1.38,.72],['bosong',.98,.4],['neolbi',1.4,1.0]];
 await shot('lake-edge',{cx:1.3,cy:.52,z:1,friends:fr});
 await shot('lake-shore',{cx:1.55,cy:.5,z:1,friends:fr});
 await shot('lake-overview',{overview:true,friends:fr});
 await shot('lake-winter',{cx:1.5,cy:.5,z:1,season:3,friends:fr});
 console.log('ok');})().catch(e=>{console.error(e);process.exit(1);});
