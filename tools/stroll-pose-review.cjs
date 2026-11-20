// 0.8.7 review: the light stroll poses (look around, smell the grass, sit, stand up) as stills from the real scene.js
// (native Canvas, seasonal art). Output: docs/qa-0.8.7/runtime/stroll-poses.png. Usage: node tools/stroll-pose-review.cjs
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.8.7/runtime');fs.mkdirSync(out,{recursive:true});
const F=require(web+'/engine'),Rig=require(web+'/rig');for(const f of fs.readdirSync(web+'/fonts').filter(f=>/\.(ttf|otf|woff2)$/.test(f)))try{GlobalFonts.registerFromPath(web+'/fonts/'+f,'Forest');}catch{}
(async()=>{const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),ForestSuperbum:require(web+'/superbum'),Forest:F,ForestRig:Rig,ForestWorld:require(web+'/world'),ForestEnvironment:require(web+'/environment'),ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},Image:class{},console};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const A={};for(const n of ['garden','ridley','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const [k,v] of Object.entries(ctx.Scene.seasonFiles()))try{A[k]=await loadImage(web+'/'+v);}catch{}
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 A.gardenWide=await loadImage(web+'/assets/forest/garden-wide.png');for(let i=1;i<=6;i++)A['fern'+i]=await loadImage(web+'/assets/forest/ferns/fern-'+i+'.png');
 const SP=['ridley','bonbon','neolbi','bosong','jureong','superbum'],T=[[1,'두리번 (왼쪽)'],[2,'두리번 (오른쪽)'],[5,'냄새 맡기'],[15,'앉아 쉬기'],[19.4,'일어서기']],cw=150,ch=150;
 const sheet=createCanvas(cw*T.length+90,ch*SP.length+40),g=sheet.getContext('2d');g.fillStyle='#f6ece0';g.fillRect(0,0,sheet.width,sheet.height);g.fillStyle='#4a3c2e';g.font='14px Forest, sans-serif';
 T.forEach(([,l],i)=>{g.textAlign='center';g.fillText(l,90+i*cw+cw/2,26);});
 for(const [r,sp] of SP.entries()){const s=F.create(0,4);s.started=true;s.environment.tutorialDone=true;s.weather.kind='sun';s.weather.intensity=0;const p=s.individuals[0];Object.assign(p,{species:sp,xp:115,visualStage:3,B:60,energy:80,mood:90,x:-.12,y:.42,motion:{kind:'idle',distance:0}});
  p.stroll={x:p.x,y:p.y,since:100,deadline:190,linger:20,arrivedAt:300};
  const sc=new ctx.Scene(canvas,()=>s);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.camera.z=sp==='superbum'||sp==='neolbi'?2:3;sc.camera.cx=p.x;sc.camera.cy=p.y-.03;sc.camera.clamp();
  g.textAlign='left';g.fillStyle='#4a3c2e';g.fillText(F.SPECIES.find(x=>x[0]===sp)[1],8,40+r*ch+ch/2);
  for(const [i,[e]] of T.entries()){s.worldTick=300+Math.floor(e);for(let k=0;k<4;k++){sc.phase=10+e+k*.05;sc.tick=s.worldTick;sc.tickAt=sc.phase-(e%1);sc.draw();}
   const q=sc.camera.screen({x:p.x,y:p.y});g.drawImage(canvas,q.x-75,q.y-118,150,140,90+i*cw,34+r*ch,cw-6,ch-14);}}
 fs.writeFileSync(out+'/stroll-poses.png',sheet.toBuffer('image/png'));
 // sitting down and getting up, stepped continuously (the sink eases over 0.6 s)
 const TS=[[12.8,'서 있음'],[13.3,'앉는 중'],[13.8,'앉음'],[19.3,'일어나는 중'],[19.8,'일어섬']],sheet2=createCanvas(cw*TS.length+90,ch*SP.length+40),g2=sheet2.getContext('2d');g2.fillStyle='#f6ece0';g2.fillRect(0,0,sheet2.width,sheet2.height);g2.fillStyle='#4a3c2e';g2.font='14px Forest, sans-serif';
 TS.forEach(([,l],i)=>{g2.textAlign='center';g2.fillText(l,90+i*cw+cw/2,26);});
 for(const [r,sp] of SP.entries()){const s=F.create(0,4);s.started=true;s.environment.tutorialDone=true;s.weather.kind='sun';s.weather.intensity=0;const p=s.individuals[0];Object.assign(p,{species:sp,xp:115,visualStage:3,B:60,energy:80,mood:90,x:-.12,y:.42,motion:{kind:'idle',distance:0}});
  p.stroll={x:p.x,y:p.y,since:100,deadline:190,linger:20,arrivedAt:300};const sc=new ctx.Scene(canvas,()=>s);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.camera.z=sp==='superbum'||sp==='neolbi'?2:3;sc.camera.cx=p.x;sc.camera.cy=p.y-.03;sc.camera.clamp();
  g2.textAlign='left';g2.fillStyle='#4a3c2e';g2.fillText(F.SPECIES.find(x=>x[0]===sp)[1],8,40+r*ch+ch/2);let i=0;
  for(let e=12;e<=20.01&&i<TS.length;e+=.05){s.worldTick=300+Math.floor(e);sc.phase=10+e;sc.tick=s.worldTick;sc.tickAt=sc.phase-(e%1);sc.draw();if(e>=TS[i][0]-1e-6){const q=sc.camera.screen({x:p.x,y:p.y});g2.drawImage(canvas,q.x-75,q.y-118,150,140,90+i*cw,34+r*ch,cw-6,ch-14);i++;}}}
 fs.writeFileSync(out+'/stroll-sit.png',sheet2.toBuffer('image/png'));console.log('ok');})().catch(e=>{console.error(e);process.exit(1);});
