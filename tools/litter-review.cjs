// 0.6.20 review: v2.24 litter sectors step 1 — loose leaves, piles, old-save migration. Actual scene.js render via
// native Canvas (not Android WebView) and engine statistics over 3 game days.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.6.20/runtime');
const F=require(web+'/engine'),Rig=require(web+'/rig'),L=require(web+'/litter'),O=F.Objects;
const game=seed=>{const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;return s;};
function legacy(seed){const s=game(seed);for(let i=0;i<50;i++)F.step(s);delete s.objects.litter;delete s.rng.litter;const z=s.patches.find(p=>p.id==='litter');z.O=70;z.U=30;return F.migrate(JSON.parse(JSON.stringify(s)));}
(async()=>{fs.mkdirSync(out,{recursive:true});const assets={};
 for(const n of ['garden','ridley','terrain','basin'])assets[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])assets[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');
 for(const [k,v]of Object.entries(Rig.files))assets[k]=await loadImage(web+'/'+v);
 const report={newGame:[],oldSave:[]};
 for(let seed=1;seed<=Number(process.env.SEEDS||8);seed++){
  const s=game(seed),start=O.storedLeaf(s);let first=null;
  for(let t=0;t<3600;t++){F.step(s);if(first===null&&L.piles(s).length)first=s.worldTick;}
  const absorbed=s.objects.ledger.absorbed,soil=s.objects.ledger.soil||0,input=s.objects.ledger.leafInput;
  assert.ok(Math.abs(O.storedLeaf(s)+absorbed+soil-start-input)<1e-6,'conservation');F.valid(s);
  report.newGame.push({seed,fallen:s.objects.litter.fallen,missed:s.objects.litter.missed,firstPileTick:first,loose:L.leaves(s).length,piles:L.piles(s).length,floor:+L.floor(s).toFixed(2)});
  const m=legacy(seed),mstart=O.storedLeaf(m),ml=m.objects.ledger,base=ml.absorbed+(ml.soil||0)-ml.leafInput;let fall=null;for(let t=0;t<1200;t++){F.step(m);if(fall===null&&m.objects.litter.fallen)fall=t+1;}
  assert.equal(mstart,100);assert.ok(Math.abs(O.storedLeaf(m)+ml.absorbed+(ml.soil||0)-ml.leafInput-base-100)<1e-6,'migrated conservation');F.valid(m);
  report.oldSave.push({seed,migration:m.objects.litter.migration,firstFallSeconds:fall});
 }
 const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),Forest:F,ForestRig:Rig,ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const shot=(st,name,z=1,focus)=>{const sc=new ctx.Scene(canvas,()=>st);sc.assets=assets;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.dt=.1;sc.phase=3;sc.camera.z=z;if(focus){sc.camera.cx=focus.x;sc.camera.cy=focus.y;}sc.camera.clamp();const before=JSON.stringify(st);sc.draw();assert.equal(JSON.stringify(st),before,'render must not mutate state');fs.writeFileSync(out+'/'+name+'.png',canvas.toBuffer('image/png'));};
 const a=game(3);shot(a,'new-game-start');for(let t=0;t<2400;t++)F.step(a);shot(a,'new-game-day2');const p=L.piles(a)[0];if(p)shot(a,'new-game-day2-pile-zoom',2.6,p);
 // A friend playing with a leaf from a real pile (world, zoomed).
 const c=game(5);c.objects.litter.piles.push({id:'pile:80',sector:5,x:.42,y:.52,O:9,U:3,S:50,cap:100,W:0,playBoostUntil:0,born:0});const r=O.region(c,'pile:80','litterPlay'),pet=c.individuals[0];
 Object.assign(pet,{x:r.x+.03,y:r.y+.01,xp:120,target:'pile:80',carriedLeaf:{amount:.5,pile:'pile:80',key:'leaf:review'},motion:{kind:'litter',distance:0}});L.pile(c,'pile:80').O-=.5;F.valid(c);shot(c,'pile-play-zoom',2.6,{x:.44,y:.5});
 const b=legacy(3);shot(b,'old-save-migrated');for(let t=0;t<1200;t++)F.step(b);shot(b,'old-save-day1');
 report.renderPure=true;fs.writeFileSync(out+'/verification.json',JSON.stringify({renderer:'scene.js + @napi-rs/canvas (not Android WebView)',report},null,1));console.log(JSON.stringify(report,null,0).slice(0,1500));
})().catch(e=>{console.error(e);process.exit(1)});
