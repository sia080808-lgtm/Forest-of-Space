// 0.6.31 review: a friend resting on the sun rock stays visible while another friend passes behind the rock.
// Real engine state, real scene.js (native Canvas, not Android WebView). Output: docs/qa-0.6.31/runtime/rock-rider.png
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.6.31/runtime');fs.mkdirSync(out,{recursive:true});
const F=require(web+'/engine'),Rig=require(web+'/rig');
(async()=>{const A={};for(const n of ['garden','ridley','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),ForestSuperbum:require(web+'/superbum'),Forest:F,ForestRig:Rig,ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const s=F.create(0,5);s.started=true;s.mode='game';s.environment.tutorialDone=true;const rider=s.individuals[0],top=F.Space.rockTop(s),rock=s.patches.find(z=>z.id==='rock');
 Object.assign(rider,{xp:115,visualStage:3,x:top.x,y:top.y,action:'rest',motion:{kind:'rest',distance:0}});
 const passer={...F.clone(rider),id:'passer',x:rock.x+.14,y:rock.y-.035,motion:{kind:'walk',distance:0},action:'wander'};s.individuals.push(passer);
 const sc=new ctx.Scene(canvas,()=>s);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.dt=.1;sc.phase=2;sc.camera.z=3;sc.camera.cx=rock.x;sc.camera.cy=rock.y-.05;sc.camera.clamp();
 for(let i=0;i<5;i++){sc.phase=2+i*.1;sc.draw();}fs.writeFileSync(out+'/rock-rider.png',canvas.toBuffer('image/png'));console.log('ok');})().catch(e=>{console.error(e);process.exit(1);});
