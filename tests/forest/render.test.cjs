const {test}=require('node:test'),a=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const F=require('../../app/src/main/assets/web/engine.js');
function scene(){const calls=[],ctx=new Proxy({},{get:(_,k)=>k==='getTransform'?()=>({a:1,b:0,c:0,d:1,e:0,f:0}):k.startsWith('create')?()=>({addColorStop(){}}):(...args)=>calls.push({k,args}),set:()=>true}),sandbox={Forest:F,ForestRig:require('../../app/src/main/assets/web/rig.js'),ForestSurfaces:require('../../app/src/main/assets/web/surfaces.js'),ForestCamera:require('../../app/src/main/assets/web/camera.js'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>({width:0,height:0,getContext:()=>new Proxy({},{get:(_,k)=>k==='getTransform'?()=>({a:1,b:0,c:0,d:1,e:0,f:0}):k.startsWith('create')?()=>({addColorStop(){}}):()=>{},set:()=>true})})},requestAnimationFrame:()=>{}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(__dirname+'/../../app/src/main/assets/web/scene.js','utf8')+'\nthis.Scene=ForestScene;',sandbox);const s=F.create(),canvas={getContext:()=>ctx,getBoundingClientRect:()=>({width:420,height:690}),addEventListener(){}};const scene=new sandbox.Scene(canvas,()=>s);scene.assets={...Object.fromEntries(Object.keys(require('../../app/src/main/assets/web/neolbi.js').files).map(k=>[k,{name:k,width:1280,height:1280}])),rigBody:{name:'body'},rigLeaves:{name:'leaves'},rigLegLeft:{name:'left-leg'},rigLegRight:{name:'right-leg'},rigPalm:{name:'palm'},ridley:{width:1254,height:1254},terrain:{width:1200,height:800}};return {scene,s,calls};}
test('sleep preserves body proportions',()=>{const {scene,s,calls}=sceneFixture();scene.pet(s.individuals[0],{x:.5,y:.5},'rest',2,false);for(const x of calls.filter(x=>x.k==='scale'&&Math.abs(x.args[0])===1))a.equal(x.args[1],1);});
function sceneFixture(){return scene();}
test('damp soil without standing water draws no oval pools',()=>{const {scene,s,calls}=sceneFixture();const p=s.patches.find(x=>x.id==='moss');p.S=p.cap;p.W=0;p.film=1;s.weather.kind='rain';scene.terrain(p);a.equal(calls.filter(x=>x.k==='ellipse').length,0);a.ok(calls.some(x=>x.k==='quadraticCurveTo'));});
test('sleep recovery gives no remote water or drink contact; actual spring drinking emits one',()=>{const {scene,s}=sceneFixture();s.started=true;const p=s.individuals[0];Object.assign(p,F.Shelter.seat(s,s.shelters.facilities[0],p));F.Shelter.rebuild(s);p.B=50;p.Q=0;p.action='rest';p.target='shelter';p.drinkCycle=false;p.actionSeconds=30;const start=p.B;F.step(s);a.ok(p.B<start);a.equal(p.motion.kind,'rest');a.equal(scene.drinkContact(p),false);F.Shelter.release(p,s.worldTick);Object.assign(p,F.Space.socket(s,'spring'));F.Objects.release(s,p);p.B=30;p.drinkCycle=true;F.step(s);a.equal(scene.drinkContact(p),true);});

test('species dispatch uses original species art, with no virtual arms on Elephan, Jureong or Ellisii',async()=>{const {loadImage}=require('@napi-rs/canvas');for(const species of ['ridley','bonbon','neolbi','bosong','jureong','duri','superbum']){const {scene,s,calls}=sceneFixture();for(const [key,file]of Object.entries(require('../../app/src/main/assets/web/rig.js').files))scene.assets[key]=await loadImage(require('path').resolve(__dirname,'../../app/src/main/assets/web',file));s.individuals[0].species=species;scene.pet(s.individuals[0],{x:.5,y:.5},'groom',1.4,false);const draws=calls.filter(x=>x.k==='drawImage');if(['neolbi','jureong'].includes(species)){a.equal(draws.filter(x=>x.args[0]===scene.assets.rigBody).length,0);a.equal(draws.filter(x=>x.args[0]===scene.assets.rigPalm).length,0);}if(['bosong','jureong'].includes(species))a.ok(draws.some(x=>x.args[0]===scene.assets['species_'+species]));if(species==='bonbon'){a.ok(draws.some(x=>x.args[0]===scene.assets.ellisiiBody));a.ok(draws.some(x=>[scene.assets.ellisiiFronds,scene.assets.ellisiiFrondLeft].includes(x.args[0])),'fronds (one layer, or the two frond layers while grooming)');a.equal(draws.filter(x=>x.args[0]===scene.assets.rigPalm).length,0);a.equal(draws.filter(x=>x.args[0]===scene.assets.species_bonbon).length,0,'Ellisii uses the approved target art, not the old Bonbon atlas');}if(species==='superbum'){for(const k of ['body','crown','foot-left','foot-right'])a.ok(draws.some(x=>x.args[0]===scene.assets['superbum_dry_'+k]),k);/* 1.1.6: a gently swaying side leaf is drawn from a bent copy baked from its layer */for(const k of ['skirt-left','skirt-right'])a.ok(draws.some(x=>x.args[0]===scene.assets['superbum_dry_'+k])||draws.some(x=>x.args[0]&&typeof x.args[0].getContext==='function'),k);a.equal(draws.filter(x=>x.args[0]===scene.assets.rigPalm).length,0,'no arms');a.equal(draws.filter(x=>x.args[0]===scene.assets.rigBody).length,0);}if(species==='ridley'){a.equal(draws.filter(x=>x.args[0]===scene.assets.rigBody).length,1);a.equal(draws.filter(x=>x.args[0]===scene.assets.rigPalm).length,2);}}});

// A queued reservation must never paint the shelter source-paper over the pet.
test('shelter foreground does not paint outside, approaching or waiting characters',()=>{const {scene,s,calls}=sceneFixture(),p=s.individuals[0],f=s.shelters.facilities[0];scene.assets.garden={name:'garden'};for(const phase of ['moving','waitingOutside','outside','entering','exiting']){p.shelter={phase,facilityId:f.id};const n=calls.filter(x=>x.k==='drawImage').length;scene.shelterFront(p,require('../../app/src/main/assets/web/shelter.js').entry(f));a.equal(calls.filter(x=>x.k==='drawImage').length,n,phase);}p.shelter={phase:'restingInside',facilityId:f.id};const q=F.Shelter.seat(s,f,p);a.ok(q);scene.shelterFront(p,q);a.ok(calls.some(x=>x.k==='drawImage'));a.ok(calls.filter(x=>x.k==='clip').length>=2);});

test('lily motion uses every species rig through boarding, paddling, dew, shaking and landing',async()=>{
 const {createCanvas,loadImage}=require('@napi-rs/canvas');
 const {scene,s}=sceneFixture(),p=s.individuals[0];
 for(const [key,file] of Object.entries(require('../../app/src/main/assets/web/rig.js').files))
  scene.assets[key]=await loadImage(require('path').resolve(__dirname,'../../app/src/main/assets/web',file));
 const canvas=createCanvas(240,240);scene.ctx=canvas.getContext('2d');scene.w=240;scene.h=240;
 F.World.openLake(s);s.world.lake.boat={rider:p.id,start:100,duration:30};
 for(const species of ['ridley','bonbon','neolbi','bosong','jureong','duri','superbum']){
  p.species=species;
  for(const age of [.8,2,6,10.5,13.3,29.5]){
   s.worldTick=100+Math.floor(age);scene.tickAt=s.worldTick;scene.phase=100+age;
   const pose=scene.lilyRidePose(p);
   if(age===.8||age===29.5)a.ok(pose.hop>0);
   if(age===6)a.ok(pose.paddle>0);
   scene.ctx.clearRect(0,0,240,240);scene.pet(p,{x:.5,y:.6},'rest',scene.phase,false);
   a.ok(scene.ctx.getImageData(0,0,240,240).data.some((v,i)=>i%4===3&&v>200),species);
  }
 }
 s.settings.reducedMotion=true;a.equal(scene.lilyRidePose(p).hop,0);
 delete s.world.lake.boat.rider;p.species='duri';
 for(const kind of ['sniff','drink'])scene.pet(p,{x:.5,y:.6},kind,scene.phase,false);
});

test('the rock shelter uses the same dimensions for all seasonal art and blends between seasons',async()=>{
 const {loadImage}=require('@napi-rs/canvas');
 const {scene,calls}=sceneFixture();
 const path=require('node:path');
 const file=path.resolve(__dirname,'../../app/src/main/assets/web/assets/forest/seasons/rock-shelter-seasons.webp');
 const art=scene.assets.rockShelterSeasons=await loadImage(file);
 a.deepEqual([art.width,art.height],[1200,760]);
 const shelter={kind:'stone',x:.73,y:1.62,level:1};
 const t=F.Shelter.transform(shelter);
 const positions={spring:[0,0],summer:[600,0],autumn:[0,380],winter:[600,380]};
 for(const [id,[x,y]] of Object.entries(positions)){
  calls.length=0;
  scene.cal=()=>({id,blend:1});
  scene.shelterArt(shelter);
  const draws=calls.filter(call=>call.k==='drawImage');
  a.equal(draws.length,1);
  a.deepEqual(draws[0].args.slice(0,5),[art,x,y,600,380]);
  a.deepEqual(draws[0].args.slice(5),[t.x-22,t.y-11,264,380*t.sy]);
 }
 calls.length=0;
 scene.cal=()=>({id:'winter',prev:'autumn',blend:.5});
 scene.shelterArt({...shelter,flip:true,level:2});
 a.deepEqual(calls.filter(call=>call.k==='drawImage').map(call=>call.args.slice(1,3)),[[0,380],[600,380]]);
 a.ok(calls.some(call=>call.k==='scale'&&call.args[0]===-1));
});

test('each of the seven friends uses its own rear sprite on the south shelf',async()=>{
 const {loadImage}=require('@napi-rs/canvas'),path=require('node:path');
 const {scene,s,calls}=sceneFixture();
 const art=scene.assets.shelfBacks=await loadImage(path.resolve(__dirname,'../../app/src/main/assets/web/assets/forest/shelf-backs.webp'));
 a.deepEqual([art.width,art.height],[640,320]);
 for(const [slot,species] of ['ridley','bonbon','neolbi','bosong','jureong','duri','superbum'].entries()){
  calls.length=0;
  const p={...s.individuals[0],species};
  a.equal(scene.shelfBack(p,{x:2.63,y:1.43}),true);
  const draw=calls.find(call=>call.k==='drawImage');
  a.deepEqual(draw.args.slice(0,5),[art,slot%4*160,Math.floor(slot/4)*160,160,160]);
 }
});

test('stone shelf uses four seasonal tiles at a shared seat position and falls back to its base art',async()=>{
 const {loadImage}=require('@napi-rs/canvas'),path=require('node:path');
 const {scene,s,calls}=sceneFixture();
 F.World.openLake(s);
 s.started=true;s.worldTick=7199;F.step(s);
 const shelf=F.World.stoneShelf(s);
 a.ok(shelf);
 const file=path.resolve(__dirname,'../../app/src/main/assets/web/assets/forest/seasons/stone-shelf-seasons.webp');
 const atlas=scene.assets.stoneShelfSeasons=await loadImage(file);
 a.deepEqual([atlas.width,atlas.height],[1500,590]);
 const positions={spring:[0,0],summer:[750,0],autumn:[0,295],winter:[750,295]};
 let destination;
 for(const [id,[x,y]] of Object.entries(positions)){
  calls.length=0;scene.cal=()=>({id,blend:1});
  scene.drawStoneShelf(scene.ctx,s,360,576);
  const draws=calls.filter(call=>call.k==='drawImage');
  a.equal(draws.length,1);
  a.deepEqual(draws[0].args.slice(0,5),[atlas,x,y,750,295]);
  destination??=draws[0].args.slice(5);
  a.deepEqual(draws[0].args.slice(5),destination);
 }
 calls.length=0;scene.cal=()=>({id:'winter',prev:'autumn',blend:.4});
 scene.drawStoneShelf(scene.ctx,s,360,576);
 a.deepEqual(calls.filter(call=>call.k==='drawImage').map(call=>call.args.slice(1,3)),[[0,295],[750,295]]);
 const base=scene.assets.stoneShelf={name:'base'};
 calls.length=0;delete scene.assets.stoneShelfSeasons;
 scene.drawStoneShelf(scene.ctx,s,360,576);
 a.deepEqual(calls.find(call=>call.k==='drawImage').args,[base,shelf.x*360-105,shelf.y*576-27,180,63]);
});

test('the flipped shelf preview mirrors around its moved seat anchor',()=>{
 const {scene,s,calls}=sceneFixture();
 F.World.openLake(s);
 s.started=true;s.worldTick=7199;F.step(s);
 const before=F.World.stoneShelf(s),art=scene.assets.stoneShelf={name:'base'};
 scene.preview['stone-shelf']={x:before.x-.2,y:before.y+.04,flip:true};
 const {x,y}=scene.preview['stone-shelf'];
 scene.drawStoneShelf(scene.ctx,s,360,576);
 a.deepEqual(calls.find(call=>call.k==='translate').args,[2*x*360,0]);
 a.deepEqual(calls.find(call=>call.k==='scale').args,[-1,1]);
 a.deepEqual(calls.find(call=>call.k==='drawImage').args,[art,x*360-105,y*576-27,180,63]);
 a.equal(F.World.stoneShelf(s),before);
});
