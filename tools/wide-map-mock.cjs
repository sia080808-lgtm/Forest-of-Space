// 0.7.0 시안 (mock only, not the game): the current garden rendered by the real scene.js (native Canvas) and placed in
// the middle of the 1.5x floor (garden-wide.png), with fern clumps (assets/forest/ferns) on the new ground.
// Output: docs/qa-0.7.0/mock/overview.png (whole forest, zoomed out), default.png (phone view at today's size),
// dragged.png (same size, dragged toward the lower-left edge), zoomed-out.png (whole forest). The fern frame is fixed to
// the screen edges in every view.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.7.0/mock');fs.mkdirSync(out,{recursive:true});
const F=require(web+'/engine'),Rig=require(web+'/rig');
const K=2; // render scale: 1 world px = 2 image px
// fern clumps on the new ground: world coordinates (-0.25..1.25 world, the old garden is 0..1), sprite, scale, mirror
const FERNS=[[-.17,.06,1,.5,0],[1.15,.22,2,.55,1],[-.15,.55,3,.6,0],[1.17,.62,6,.7,1],[.18,-.13,5,.5,0],[.78,-.15,4,.55,1],[.25,1.17,2,.5,1],[.88,1.15,3,.55,0],[-.12,1.05,6,.6,1],[1.12,1.02,1,.45,0],[.5,-.17,6,.55,0]];
(async()=>{const A={};for(const n of ['garden','ridley','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 const wide=await loadImage(web+'/assets/forest/garden-wide.png'),frame=await loadImage(web+'/assets/forest/frame.png'),ferns=[];for(let i=1;i<=6;i++)ferns[i]=await loadImage(web+'/assets/forest/ferns/fern-'+i+'.png');
 // the old garden's floor = the middle of the wide floor (edge ferns removed, baked shelter erased)
 const mid=createCanvas(1024,1536);mid.getContext('2d').drawImage(wide,256,384,1024,1536,0,0,1024,1536);
 const canvas=createCanvas(360*K,576*K);canvas.getBoundingClientRect=()=>({width:360*K,height:576*K,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),ForestSuperbum:require(web+'/superbum'),Forest:F,ForestRig:Rig,ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const s=F.create(0,5);s.started=true;s.mode='game';s.environment.tutorialDone=true;s.environment.timeOfDay=.5;s.weather.kind='sun';s.weather.intensity=0;s.weather.transition=0;s.weather.wind=10;s.climate.L=90;const base=s.individuals[0];Object.assign(base,{x:.42,y:.62,xp:115,visualStage:3});
 for(const [sp,x,y] of [['bonbon',.6,.55],['neolbi',.3,.78],['bosong',.7,.74],['jureong',.52,.42],['superbum',.25,.5]])s.individuals.push({...F.clone(base),id:sp,species:sp,name:sp,x,y,active:true,sources:{rain:0,other:0,unknown:0},V:0});
 const sc=new ctx.Scene(canvas,()=>s);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.dt=.1;sc.shelterPaper=mid;sc.camera.z=1;sc.camera.cx=.5;sc.camera.cy=.5;sc.camera.clamp();
 for(let i=0;i<6;i++){sc.phase=2+i*.1;sc.draw();}
 // compose: wide floor at the same scale, ferns on the new ground, then the rendered garden in the middle
 let light='#fff';const WW=540*K,WH=864*K,o=createCanvas(WW,WH),c=o.getContext('2d');c.drawImage(wide,0,0,WW,WH);
 for(const [x,y,i,sz,flip] of FERNS){const im=ferns[i],w=im.width*sz*K*.55,h=im.height*sz*K*.55,px=(x+.25)*360*K,py=(y+.25)*576*K;c.save();c.translate(px,py);if(flip)c.scale(-1,1);c.drawImage(im,-w/2,-h,w,h);c.restore();}
 // the scene lights the whole world (sky colour, time of day); the mock lights the new ground the same way by matching
 // a plain paper spot of the rendered garden to the same spot of the floor
 {const sx=180*K,sy=60*K,a=canvas.getContext('2d').getImageData(sx,sy,1,1).data,f=createCanvas(1,1),fc=f.getContext('2d');fc.drawImage(wide,(sx/K+90)/540*1536,(sy/K+144)/864*2304,1,1,0,0,1,1);const b=fc.getImageData(0,0,1,1).data;
  light=`rgb(${[0,1,2].map(i=>Math.min(255,Math.round(255*a[i]/b[i]))).join(',')})`;c.save();c.globalCompositeOperation='multiply';c.fillStyle=light;c.fillRect(0,0,WW,WH);c.restore();}
 c.drawImage(canvas,90*K,144*K);
 fs.writeFileSync(out+'/overview.png',o.toBuffer('image/png'));
 // phone view at today's size: today the whole 360x576 garden fills a 393x690 screen (about 1.15 css px per world px)
 const vw=393,vh=690,ps=Math.min(vw/360,vh/576),cw=vw/ps*K,ch=vh/ps*K;
 // phone views: the fern frame is fixed to the screen edges at today's size (in the game it is drawn over the floor and
 // under friends and objects; in this mock it is laid over the finished picture)
 const lit=(q,w,h)=>{q.save();q.globalCompositeOperation='multiply';q.fillStyle=light;q.fillRect(0,0,w,h);q.restore();};
 const view=(cx,cy,name,zoomOut)=>{const v=createCanvas(vw*2,vh*2),q=v.getContext('2d');
  if(zoomOut){const sc2=Math.min(vw*2/WW,vh*2/WH),w=WW*sc2,h=WH*sc2;q.fillStyle='#e8dccd';q.fillRect(0,0,vw*2,vh*2);q.drawImage(o,(vw*2-w)/2,(vh*2-h)/2,w,h);}
  else{const x=Math.max(0,Math.min(WW-cw,cx*K-cw/2)),y=Math.max(0,Math.min(WH-ch,cy*K-ch/2));q.drawImage(o,x,y,cw,ch,0,0,vw*2,vh*2);}
  const fr=createCanvas(vw*2,vh*2),fq=fr.getContext('2d');fq.drawImage(frame,0,0,vw*2,vh*2);lit(fq,vw*2,vh*2);fq.globalCompositeOperation='destination-in';fq.drawImage(frame,0,0,vw*2,vh*2);q.drawImage(fr,0,0);
  fs.writeFileSync(out+'/'+name+'.png',v.toBuffer('image/png'));};
 view(90+180,144+288,'default');view(90+30,144+520,'dragged');view(0,0,'zoomed-out',true);
 console.log('ok');})().catch(e=>{console.error(e);process.exit(1);});
