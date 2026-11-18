const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const web=path.resolve(__dirname,'../../app/src/main/assets/web'),F=require(web+'/engine'),Rig=require(web+'/rig');
test('0.6.31 a friend resting on the sun rock is not covered by the rock when another friend passes behind it',async()=>{
 const {createCanvas,loadImage}=require('@napi-rs/canvas'),A={};for(const n of ['garden','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),ForestSuperbum:require(web+'/superbum'),Forest:F,ForestRig:Rig,ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const shot=withPasser=>{const s=F.create(0,5);s.started=true;s.mode='game';s.environment.tutorialDone=true;const r=s.individuals[0],top=F.Space.rockTop(s),rock=s.patches.find(z=>z.id==='rock');
  Object.assign(r,{xp:115,visualStage:3,x:top.x,y:top.y,action:'rest',motion:{kind:'rest',distance:0}});if(withPasser)s.individuals.push({...F.clone(r),id:'passer',x:rock.x+.14,y:rock.y-.035,motion:{kind:'walk',distance:0},action:'wander'});
  const sc=new ctx.Scene(canvas,()=>s);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.dt=.1;sc.phase=2;sc.camera.z=3;sc.camera.cx=rock.x;sc.camera.cy=rock.y-.05;sc.camera.clamp();sc.draw();
  // the rider's body area on screen
  const p=sc.camera.screen({x:top.x,y:top.y}),d=canvas.getContext('2d').getImageData(Math.round(p.x)-12,Math.round(p.y)-30,24,22).data;return d;};
 const alone=shot(false),passed=shot(true);let diff=0;for(let i=0;i<alone.length;i+=4)diff+=Math.abs(alone[i]-passed[i])+Math.abs(alone[i+1]-passed[i+1])+Math.abs(alone[i+2]-passed[i+2]);
 a.ok(diff/(alone.length/4)<8,'rider area changed by '+(diff/(alone.length/4)).toFixed(1)+' per pixel');
});
