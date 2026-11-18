// 0.6.29 review: 슈퍼범 in the real scene.js render (native Canvas, not Android WebView) next to 리들리, 엘리시 and 엘레판,
// dry and holding rain. Checks the render does not change state. Output: docs/qa-superbum/world-*.png
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-superbum');
const F=require(web+'/engine'),Rig=require(web+'/rig');
(async()=>{const A={};for(const n of ['garden','ridley','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),ForestSuperbum:require(web+'/superbum'),Forest:F,ForestRig:Rig,ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 for(const [name,V] of [['world-dry',0],['world-wet',30]]){const s=F.create(0,7);s.started=true;s.environment.tutorialDone=true;
  const base=s.individuals[0];Object.assign(base,{xp:115,visualStage:3,x:.30,y:.47});
  const add=(id,species,x,y)=>{const p={...F.clone(base),id,species,x,y,active:true,sources:{rain:V,other:0,unknown:0},V:species==='superbum'?V:0};s.individuals.push(p);return p;};
  add('e','bonbon',.39,.47);add('n','neolbi',.51,.47);add('sb','superbum',.66,.47);
  for(const p of s.individuals){p.motion=null;p.action='wander';p.target=null;}
  const sc=new ctx.Scene(canvas,()=>s);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.dt=.1;sc.phase=2;sc.camera.z=1.7;sc.camera.cx=.53;sc.camera.cy=.42;sc.camera.clamp();
  const before=JSON.stringify(s);sc.draw();assert.equal(JSON.stringify(s),before,'render must not mutate state');fs.writeFileSync(out+'/'+name+'.png',canvas.toBuffer('image/png'));}
 console.log('ok');})().catch(e=>{console.error(e);process.exit(1);});
