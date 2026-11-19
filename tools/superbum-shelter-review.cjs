// 0.6.38 review: a grown 슈퍼범 resting in the base shelter in its folded pose (nest leaf down, side leaves in), next to
// the same 슈퍼범 standing outside. Real engine seat, real scene.js (native Canvas, not Android WebView). Render must not
// change the state. Output: docs/qa-0.6.38/runtime/superbum-shelter.png
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.6.38/runtime');fs.mkdirSync(out,{recursive:true});
const F=require(web+'/engine'),Rig=require(web+'/rig'),Sh=F.Shelter;
(async()=>{const A={};for(const n of ['garden','ridley','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),ForestSuperbum:require(web+'/superbum'),Forest:F,ForestRig:Rig,ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const s=F.create(0,5);s.started=true;s.mode='game';s.environment.tutorialDone=true;const r=s.individuals[0];
 const f=s.shelters.facilities[0];f.level=1;const sb={...F.clone(r),id:'sb',species:'superbum',name:'슈퍼범',xp:115,visualStage:3,V:0,active:true,sources:{rain:0,other:0,unknown:0},action:'rest',motion:{kind:'rest',distance:0}};s.individuals.push(sb);
 const out2={...F.clone(sb),id:'sb2',x:f.x+.2,y:f.y+.12,action:'idle',motion:{kind:'idle',distance:0}};s.individuals.push(out2);Object.assign(r,{x:f.x-.18,y:f.y+.14});
 Sh.prepare(s,null,F.Space);const q=Sh.seat(s,f,sb);if(!q)throw Error('no seat');Object.assign(sb,q);sb.shelter={phase:'restingInside',facilityId:f.id,...q,units:8,since:0,entered:0,revision:f.revision||0};
 const before=JSON.stringify(s);const sc=new ctx.Scene(canvas,()=>s);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.dt=.1;sc.camera.z=2.4;sc.camera.cx=f.x+.02;sc.camera.cy=f.y+.02;sc.camera.clamp();
 for(let i=0;i<20;i++){sc.phase=2+i*.1;sc.draw();}if(JSON.stringify(s)!==before)throw Error('render changed state');
 fs.writeFileSync(out+'/superbum-shelter.png',canvas.toBuffer('image/png'));console.log('ok, seat',q.x.toFixed(3),q.y.toFixed(3),'state unchanged');})().catch(e=>{console.error(e);process.exit(1);});
