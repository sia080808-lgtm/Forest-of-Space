// 0.6.33 review: the leaf-shade plant's grass tuft follows depth order (in front of a friend behind it, behind a friend
// in front of it) while its leaves stay over friends. Real scene.js (native Canvas). Output: docs/qa-0.6.33/runtime/shade-layers.png
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.6.33/runtime');fs.mkdirSync(out,{recursive:true});
const F=require(web+'/engine'),Rig=require(web+'/rig');
(async()=>{const A={};for(const n of ['garden','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),ForestSuperbum:require(web+'/superbum'),Forest:F,ForestRig:Rig,ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const shots=[];for(const [dx,dy] of [[-.03,-.012],[-.03,.025],[.035,.02]]){const s=F.create(0,5);s.started=true;s.mode='game';s.environment.tutorialDone=true;const z=s.patches.find(q=>q.id==='shade'),p=s.individuals[0];
  Object.assign(p,{xp:115,visualStage:3,x:z.x+dx,y:z.y+dy,motion:{kind:'idle',distance:0}});const sc=new ctx.Scene(canvas,()=>s);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.dt=.1;sc.phase=2;sc.camera.z=3;sc.camera.cx=z.x;sc.camera.cy=z.y-.04;sc.camera.clamp();sc.draw();
  const c=createCanvas(393,330);c.getContext('2d').drawImage(canvas,0,180,393,330,0,0,393,330);shots.push(c);}
 const sheet=createCanvas(1199,330),g=sheet.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,796,330);shots.forEach((c,i)=>g.drawImage(c,i*403,0));fs.writeFileSync(out+'/shade-layers.png',sheet.toBuffer('image/png'));console.log('ok');})().catch(e=>{console.error(e);process.exit(1);});
