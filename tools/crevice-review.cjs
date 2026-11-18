// 0.6.35 review: where friends rest at the crevice (user report: "바위틈에 있지 않은데 바위틈에 쉬고있다고 뜸", with the moss
// patch placed just below the crevice). Real engine rest option, real scene.js (native Canvas, not Android WebView).
// Output: docs/qa-0.6.35/runtime/crevice-rest.png (before = the 0.6.34 spot .07 below the anchor, after = the engine's spot)
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.6.35/runtime');fs.mkdirSync(out,{recursive:true});
const F=require(web+'/engine'),Rig=require(web+'/rig');
(async()=>{const A={};for(const n of ['garden','ridley','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),ForestSuperbum:require(web+'/superbum'),Forest:F,ForestRig:Rig,ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const shot=(s,name,cx,cy,z=2.6)=>{const sc=new ctx.Scene(canvas,()=>s);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.dt=.1;sc.phase=2;sc.camera.z=z;sc.camera.cx=cx;sc.camera.cy=cy;sc.camera.clamp();for(let i=0;i<30;i++){sc.phase=2+i*.1;sc.draw();}fs.writeFileSync(out+'/'+name+'.png',canvas.toBuffer('image/png'));};

 const {createCanvas:cc,GlobalFonts}=require('@napi-rs/canvas'),frames=[];for(const f of fs.readdirSync(web+'/fonts').filter(f=>/\.(ttf|otf|woff2)$/.test(f)))try{GlobalFonts.registerFromPath(web+'/fonts/'+f,'Forest');}catch{}
 for(const [label,mode,sp] of [['0.6.34 · 코로나 (기준점 +0.07)','before','jureong'],['0.6.35 · 코로나 (틈에 쏙)','after','jureong'],['0.6.35 · 리들리','after2','ridley'],['0.6.35 · 엘레판','after3','neolbi']]){const s=F.create(0,5);s.started=true;s.mode='game';s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;
  const z=s.patches.find(q=>q.id==='crevice'),m=s.patches.find(q=>q.id==='moss');m.x=z.x;m.y=z.y+.1;
  const base=s.individuals[0];Object.assign(base,{xp:115,visualStage:3,energy:30,species:sp,name:sp});
  const o=F.Objects.option(s,base,'crevice','rest','energy');const spot=mode==='before'?{x:z.x,y:z.y+.07}:{x:o.x,y:o.y};
  Object.assign(base,{x:spot.x,y:spot.y,action:'rest',target:'crevice',motion:{kind:'rest',distance:0}});if(mode!=='before')base.objectTask={...o,arrived:true};
  shot(s,'crevice-'+mode,z.x,z.y);frames.push([label,out+'/crevice-'+mode+'.png']);fs.writeFileSync(out+'/crevice-'+mode+'.json',JSON.stringify({dy:+(spot.y-z.y).toFixed(3)}));}
 const ims=[];for(const [l,f] of frames)ims.push([l,await loadImage(f)]);const W=ims[0][1].width,Hh=ims[0][1].height,c=cc(W*2,(Hh+40)*2),g=c.getContext('2d');g.fillStyle='#f6ece0';g.fillRect(0,0,c.width,c.height);
 ims.forEach(([l,im],i)=>{const X=(i%2)*W,Y=Math.floor(i/2)*(Hh+40);g.drawImage(im,X,Y+40);g.fillStyle='#3d3226';g.font='18px Forest, sans-serif';g.fillText(l,X+12,Y+27);});fs.writeFileSync(out+'/crevice-rest.png',c.toBuffer('image/png'));for(const [,f] of frames)fs.rmSync(f);console.log('ok');})().catch(e=>{console.error(e);process.exit(1);});
