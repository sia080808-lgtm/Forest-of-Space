// 0.9.3 review: lake events in the real scene.js — each friend's startle (frog) and slip (ice), watching, fireflies,
// rain rings on the water, the frog's plop. Usage: node tools/lake-events-review.cjs
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.9.3/runtime');fs.mkdirSync(out,{recursive:true});
const F=require(web+'/engine'),Rig=require(web+'/rig');for(const f of fs.readdirSync(web+'/fonts').filter(f=>/\.(ttf|otf|woff2)$/.test(f)))try{GlobalFonts.registerFromPath(web+'/fonts/'+f,'Forest');}catch{}
(async()=>{const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),ForestSuperbum:require(web+'/superbum'),Forest:F,ForestRig:Rig,ForestWorld:require(web+'/world'),ForestEnvironment:require(web+'/environment'),ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},Image:class{},console};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const A={};for(const n of ['garden','ridley','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const [k,v] of Object.entries(ctx.Scene.seasonFiles()))try{A[k]=await loadImage(web+'/'+v);}catch{}
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 A.gardenWide=await loadImage(web+'/assets/forest/garden-wide.png');for(let i=1;i<=6;i++)A['fern'+i]=await loadImage(web+'/assets/forest/ferns/fern-'+i+'.png');
 A.lakeFloor=await loadImage(web+'/assets/forest/lake/lake-floor.png');A.lakeIce=await loadImage(web+'/assets/forest/lake/lake-ice.png');for(const n of ['strider','snail','eggs','tadpole','frog','frogswim','nymph','dragonfly','beetle','medaka','larva'])A['life_'+n]=await loadImage(web+'/assets/forest/lake/life-'+n+'.png');for(const n of ['leaf','bud','half','full','sink','wither'])A['lily_'+n]=await loadImage(web+'/assets/forest/lake/lily-'+n+'.png');
 const SP=['ridley','bonbon','neolbi','bosong','jureong','superbum'];
 const make=({tick,friends,life,weather})=>{const s=F.create(0,4);s.started=true;s.environment.tutorialDone=true;Object.assign(s.weather,{kind:'sun',intensity:0,wind:5},weather||{});
  s.world.regions=['forest','lakeshore'];s.world.lake={ready:true,scents:3,openedAt:0,lilies:[],life:(life||[]).map((q,i)=>({id:'life'+(i+1),kind:q[0],x:q[1],y:q[2],born:tick-10,...(q[3]||{})})),fx:{react:{}}};
  s.worldTick=tick;s.environment.calendar.start=0;const base=JSON.parse(JSON.stringify(s.individuals[0]));
  s.individuals=friends.map((q,i)=>Object.assign(JSON.parse(JSON.stringify(base)),{id:'v'+i,species:q[0],xp:115,visualStage:3,B:60,energy:80,mood:90,x:q[1],y:q[2],V:q[0]==='superbum'?30:0,motion:{kind:q[3]||'idle',distance:0}}));return s;};
 const scene=(s,cx,cy,z)=>{const sc=new ctx.Scene(canvas,()=>s);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.draw();sc.camera.z=z;sc.camera.cx=cx;sc.camera.cy=cy;sc.camera.clamp();sc.visual={};return sc;};
 const seedOf=id=>[...id].reduce((n,x)=>n+x.charCodeAt(0),0)%47/10;
 // reaction sheet: one row a friend; startle at 5 moments, then slip on the ice at 5 moments
 const C=150,sheet=createCanvas(C*10,C*SP.length),g=sheet.getContext('2d');g.fillStyle='#f6ecdf';g.fillRect(0,0,sheet.width,sheet.height);
 for(const [r,sp] of SP.entries()){const K=['neolbi','superbum'].includes(sp)?1.7:1,D=C*K;
  {const s=make({tick:3600+300,friends:[[sp,1.2,.5]]});s.world.lake.fx.react.v0={k:'startle',at:s.worldTick};const before=JSON.stringify(s),sc=scene(s,1.2,.47,2.2),q=sc.camera.screen(s.individuals[0]);sc.phase=10;sc.draw();
   for(let k=0;k<5;k++){sc.phase=10+k*.35;sc.draw();g.drawImage(canvas,q.x-D/2,q.y-D*.78,D,D,k*C,r*C,C,C);}if(JSON.stringify(s)!==before)throw Error('render changed the state');}
  {const s=make({tick:10800+300,friends:[[sp,1.6,.56,'walk']]});const sc=scene(s,1.6,.53,2.2),q=sc.camera.screen(s.individuals[0]),p0=(8-seedOf('v0')*1.7%8+8)%8;
   for(let k=0;k<5;k++){sc.phase=40+p0+k*.3;sc.draw();g.drawImage(canvas,q.x-D/2,q.y-D*.78,D,D,(5+k)*C,r*C,C,C);}}}
 fs.writeFileSync(out+'/reactions.png',sheet.toBuffer('image/png'));
 const shot=async(name,o,cx,cy,z,ph=10)=>{const s=make(o);if(o.fx)Object.assign(s.world.lake.fx,o.fx(s));const before=JSON.stringify(s),sc=scene(s,cx,cy,z);for(let e=0;e<1;e+=.25){sc.phase=ph+e;sc.draw();}if(JSON.stringify(s)!==before)throw Error('render changed the state: '+name);fs.writeFileSync(out+'/'+name+'.png',canvas.toBuffer('image/png'));};
 const fr=[['ridley',1.2,.5],['bosong',1.3,.72],['jureong',1.25,.3]];
 await shot('fireflies',{tick:3600+1200+800,friends:fr,fx:s=>({fire:{night:Math.floor((s.worldTick-620)/1200),on:true,seen:true}})},1.45,.5,1);
 await shot('rain-rings',{tick:3600+300,friends:fr,weather:{kind:'rain',intensity:70}},1.55,.5,1.6);
 await shot('frog-plop',{tick:3600+300,friends:[['ridley',1.42,.52]],life:[['frog',1.47,.52,{dive:3600+300}]]},1.46,.5,3,1.8);
 await shot('ice-play',{tick:10800+300,friends:[['ridley',1.55,.5,'walk'],['bonbon',1.62,.65,'walk'],['superbum',1.5,.3,'walk']]},1.55,.5,1.4);
 console.log('ok');})().catch(e=>{console.error(e);process.exit(1);});
