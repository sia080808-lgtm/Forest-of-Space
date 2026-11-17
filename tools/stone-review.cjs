// 0.6.15 review: sun-rock resting on the rock top and stone footprints matching the drawn rock/crevice.
// Actual scene.js render via native Canvas (not Android WebView) + route statistics from the real path finder.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.6.15/runtime');
const F=require(web+'/engine'),Rig=require(web+'/rig'),S=F.Space,O=F.Objects;
(async()=>{fs.mkdirSync(out,{recursive:true});const assets={};
 for(const n of ['garden','ridley','terrain','basin'])assets[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])assets[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');
 for(const [k,v]of Object.entries(Rig.files))assets[k]=await loadImage(web+'/'+v);
 const report={};
 // 1) engine: a tired Ridley/Elephan assigned to the sun rock climbs onto its top and can leave again
 for(const sp of ['ridley','neolbi']){const s=F.create(0,9);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;Object.assign(s.weather,{kind:'sun',wind:10,intensity:0,remaining:240,transition:0});Object.assign(s.patches.find(z=>z.id==='rock'),{W:0,film:0,S:0});let p=s.individuals[0];if(sp==='neolbi'){F.welcomeNeolbi(s);s.individuals[0].active=false;p=s.individuals[1];p.active=true;}
  Object.assign(p,{x:.45,y:.62,energy:30,mood:80,B:60,nutrition:70,xp:120,visualStage:3});p.objectTask=O.option(s,p,'rock','rest','energy');p.nextObjectChoice=s.worldTick+500;assert.ok(!p.objectTask.fail);
  let on=-1;for(let n=0;n<120;n++){F.step(s);if(on<0&&S.onRock(s,p))on=n;}assert.ok(S.onRock(s,p));const e=p.energy;
  p.energy=80;p.B=30;delete p.objectTask;p.nextObjectChoice=0;let off=-1;for(let n=0;n<160;n++){F.step(s);if(off<0&&!S.onRock(s,p))off=n;}assert.ok(off>=0);F.valid(s);report[sp]={reachedTopTick:on,energyAfter120:+e.toFixed(1),leftRockTick:off};}
 // 2) routes crossing each stone: samples inside the stone core (fern edges excluded)
 let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(const id of ['crevice','rock']){const s=F.create(0,5),c=s.patches.find(p=>p.id===id),core={x:c.x+.005,y:c.y-.035,rx:.08,ry:.022},inCore=q=>((q.x-core.x)/core.rx)**2+((q.y-core.y)/core.ry)**2<1;let bad=0,routes=0;
  for(let i=0;i<600;i++){const a={x:c.x-.2+rnd()*.4,y:c.y-.17+rnd()*.07},b={x:c.x-.2+rnd()*.4,y:c.y+.06+rnd()*.08};if(!S.walkable(s,a)||!S.walkable(s,b)||S.onRock(s,a)||S.onRock(s,b))continue;const r=S.route(s,a,b);if(!r)continue;routes++;let p=a,hit=false;for(const q of r){for(let k=1;k<=60&&!hit;k++){const z={x:p.x+(q.x-p.x)*k/60,y:p.y+(q.y-p.y)*k/60};if(inCore(z))hit=true;}p=q;}if(hit)bad++;}
  report[id+'Routes']={routes,throughStoneCore:bad};assert.equal(bad,0);}
 // 3) render: two friends resting on the rock top (day)
 const st=F.create(0,88);st.started=true;st.environment.tutorialDone=true;st.recruitment.nextAttempt=1e9;F.welcomeNeolbi(st);const T=S.rockTop(st),rock=st.patches.find(p=>p.id==='rock');
 Object.assign(st.individuals[0],{x:T.x-.035,y:T.y,xp:120,target:'rock',motion:{kind:'rest',distance:0}});Object.assign(st.individuals[1],{active:true,x:T.x+.04,y:T.y,xp:120,target:'rock',canopy:false,canopyProgress:0,motion:{kind:'rest',distance:0}});
 const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),Forest:F,ForestRig:Rig,ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const sc=new ctx.Scene(canvas,()=>st);sc.assets=assets;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.dt=.1;sc.phase=3;sc.camera.z=2.4;sc.camera.cx=rock.x;sc.camera.cy=rock.y+.02;sc.camera.clamp();
 const before=JSON.stringify(st);sc.draw();assert.equal(JSON.stringify(st),before,'render must not mutate state');fs.writeFileSync(out+'/rock-top-rest.png',canvas.toBuffer('image/png'));report.renderPure=true;
 fs.writeFileSync(out+'/verification.json',JSON.stringify({renderer:'scene.js + @napi-rs/canvas (not Android WebView)',report},null,1));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});
