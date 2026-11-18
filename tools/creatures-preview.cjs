// Draft preview (not wired into the game): carrier ants and springtails over the real scene. Usage: node tools/creatures-preview.cjs <out-dir>
const fs=require('fs'),vm=require('vm'),path=require('path');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=process.argv[2]||path.resolve(__dirname,'../docs/qa-creatures-draft/frames');
const F=require(web+'/engine'),Rig=require(web+'/rig'),Art=require(web+'/creature-art.js');
GlobalFonts.registerFromPath(web+'/fonts/GowunDodum-Regular.ttf','K');
(async()=>{fs.mkdirSync(out,{recursive:true});const assets={};
 for(const n of ['garden','ridley','terrain','basin'])assets[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])assets[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');
 for(const [k,v]of Object.entries(Rig.files))assets[k]=await loadImage(web+'/'+v);
 const s=F.create(0,5);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;Object.assign(s.weather,{kind:'sun',wind:10,intensity:0,transition:0});
 s.objects.litter.leaves=[{id:1,sector:5,x:.36,y:.47,rot:.8,moved:0},{id:2,sector:5,x:.33,y:.53,rot:2.2,moved:0}];
 s.objects.litter.piles=[{id:'pile:1',sector:6,x:.56,y:.52,O:9,U:3,S:50,cap:100,W:0,playBoostUntil:0,born:0}];
 Object.assign(s.individuals[0],{x:.47,y:.60,xp:120,motion:{kind:'idle',distance:0}});
 const W=393,H=690,canvas=createCanvas(W,H);canvas.getBoundingClientRect=()=>({width:W,height:H,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),Forest:F,ForestRig:Rig,ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const sc=new ctx.Scene(canvas,()=>s);sc.assets=assets;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.dt=.1;sc.camera.z=3.2;sc.camera.cx=.47;sc.camera.cy=.53;sc.camera.clamp();
 const nestP={x:.40,y:.585},pileP={x:.56,y:.515};
 const FR=120,fps=20;
 for(let f=0;f<FR;f++){const t=f/fps;sc.phase=t;sc.draw();const c=canvas.getContext('2d');c.save();c.setTransform(1,0,0,1,0,0);c.translate(sc.camera.tx,sc.camera.ty);c.scale(sc.camera.scale,sc.camera.scale);const w=sc.w,h=sc.h;
  Art.nest(c,{x:nestP.x*w,y:nestP.y*h,size:w*.03});
  // three ants on a loop: out to the pile empty-handed (upper lane), back carrying a leaf piece (lower lane)
  for(let i=0;i<3;i++){const u=((t/6)+i/3)%1,out=u<.5,v=out?u/.5:(u-.5)/.5,a=out?nestP:pileP,b=out?pileP:nestP,lane=out?-.006:.006,x=(a.x+(b.x-a.x)*v)*w,y=(a.y+(b.y-a.y)*v+lane+Math.sin(v*Math.PI*2+i)*.003)*h,heading=Math.atan2((b.y-a.y)*h,(b.x-a.x)*w);
   Art.ant(c,{x,y,size:w*.017,heading,phase:t+i*.3,carry:!out});}
  for(let k=0;k<5;k++){const a=k*1.3,r=.016+.008*(k%3);Art.springtail(c,{x:(pileP.x+Math.cos(a)*r)*w,y:(pileP.y+.004+Math.sin(a)*r*.5)*h,size:w*.009,phase:t,seed:k+1});}
  c.restore();fs.writeFileSync(out+'/w'+String(f).padStart(3,'0')+'.png',canvas.toBuffer('image/png'));}
 // design sheet: large creatures on paper
 const sheet=createCanvas(900,420),d=sheet.getContext('2d');d.drawImage(assets.garden,assets.garden.width*.4,assets.garden.height*.04,assets.garden.width*.2,assets.garden.height*.14,0,0,900,420);
 d.fillStyle='#4a4136';d.font='22px K';d.fillText('짐꾼개미',40,40);d.fillText('톡토기',520,40);d.font='15px K';d.fillText('걷기 · 낙엽 조각 운반 · 둥지',40,66);d.fillText('톡 튀어 오르기 (도약기)',520,66);
 Art.ant(d,{x:150,y:170,size:150,heading:0,phase:.1});Art.ant(d,{x:340,y:170,size:150,heading:0,phase:.35,carry:true});Art.nest(d,{x:200,y:330,size:130});
 for(const [i,ph] of [[0,0],[1,.18],[2,.6]])Art.springtail(d,{x:560+i*120,y:250,size:85,phase:ph,seed:5,still:false});
 fs.writeFileSync(out+'/design-sheet.png',sheet.toBuffer('image/png'));console.log('ok');
})().catch(e=>{console.error(e);process.exit(1)});
