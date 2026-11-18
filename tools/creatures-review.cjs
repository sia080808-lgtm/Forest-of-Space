// 0.6.25 review: carrier ants and springtails in the real engine (arrival, carrying, decomposition help, conservation)
// and in the real scene.js render (native Canvas, not Android WebView).
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.6.25/runtime');
const F=require(web+'/engine'),Rig=require(web+'/rig'),C=F.Creatures,L=F.Litter,O=F.Objects;
const game=seed=>{const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;return s;};
(async()=>{fs.mkdirSync(out,{recursive:true});const report=[];let shot=null;
 for(let seed=1;seed<=Number(process.env.SEEDS||8);seed++){const s=game(seed),base=O.storedLeaf(s);let ant=null,spring=null;
  for(let t=0;t<3600*3;t++){F.step(s);for(const g of C.groups(s)){if(g.kind==='ant'&&ant===null)ant=s.worldTick;if(g.kind==='springtail'&&spring===null)spring=s.worldTick;}
   if(!shot&&C.groups(s).some(g=>g.kind==='ant'&&g.carry&&g.carry.start===s.worldTick)&&C.groups(s).some(g=>g.kind==='springtail'))shot=JSON.parse(JSON.stringify(s));if(t%900===0)F.valid(s);}
  const l=s.objects.ledger;assert.ok(Math.abs(O.storedLeaf(s)+l.absorbed+(l.soil||0)-l.leafInput-base)<1e-6,'conservation');
  report.push({seed,firstAnt:ant,firstSpringtail:spring,...s.objects.creatures.log});}
 const A={};for(const n of ['garden','ridley','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 const st=shot||game(1);const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),Forest:F,ForestRig:Rig,ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const draw=(name,z,focus)=>{const sc=new ctx.Scene(canvas,()=>st);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.dt=.1;sc.phase=3;sc.camera.z=z;if(focus){sc.camera.cx=focus.x;sc.camera.cy=focus.y;}sc.camera.clamp();const before=JSON.stringify(st);sc.draw();assert.equal(JSON.stringify(st),before,'render must not mutate state');fs.writeFileSync(out+'/'+name+'.png',canvas.toBuffer('image/png'));};
 const ant=C.groups(st).find(g=>g.kind==='ant'),sp=C.groups(st).find(g=>g.kind==='springtail');
 draw('world-overview',1);if(sp){const p=L.pile(st,sp.pile);draw('springtail-pile-zoom',3,p);}
 if(ant){draw('ant-nest-zoom',3.2,ant.nest);
  // the whole trip: nest -> leaf -> destination, one frame per game second (render is pure; the engine advances)
  const q=ant.carry,xs=q?[ant.nest.x,q.fromX,q.to.x]:[ant.nest.x],ys=q?[ant.nest.y,q.fromY,q.to.y]:[ant.nest.y],fx=(Math.min(...xs)+Math.max(...xs))/2,fy=(Math.min(...ys)+Math.max(...ys))/2,span=Math.max(Math.max(...xs)-Math.min(...xs),(Math.max(...ys)-Math.min(...ys))*.57,.12);
  const z=Math.min(2.2,Math.max(1.1,.55/span)),dir=out+'/trip';fs.mkdirSync(dir,{recursive:true});const sc=new ctx.Scene(canvas,()=>st);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.camera.z=z;sc.camera.cx=fx;sc.camera.cy=fy;sc.camera.clamp();
  let f=0;const until=q?q.arrive+3:st.worldTick+20;while(st.worldTick<until){for(let k=0;k<4;k++){sc.phase=st.worldTick+k/4;sc.tick=st.worldTick;sc.tickAt=st.worldTick;sc.draw();fs.writeFileSync(dir+'/f'+String(f++).padStart(4,'0')+'.png',canvas.toBuffer('image/png'));}F.step(st);}}
 fs.writeFileSync(out+'/verification.json',JSON.stringify({renderer:'scene.js + @napi-rs/canvas (not Android WebView)',report},null,1));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});
