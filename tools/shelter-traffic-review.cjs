const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.6.7/runtime');
const F=require(web+'/engine'),Rig=require(web+'/rig'),V=require(web+'/surfaces'),Effects=require(web+'/world-effects');
(async()=>{
 fs.mkdirSync(out,{recursive:true});GlobalFonts.registerFromPath(web+'/fonts/GowunDodum-Regular.ttf','K');
 const assets={};for(const n of ['garden','ridley','terrain','basin'])assets[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])assets[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');
 for(const [k,v] of Object.entries(Rig.files))assets[k]=await loadImage(web+'/'+v);
 let state=F.migrate(require('../tests/forest/fixtures/shelter-traffic-066.json'));
 const canvas=createCanvas(720,1152);canvas.getBoundingClientRect=()=>({width:720,height:1152,left:0,top:0});
 const context={ForestNeolbi:require(web+'/neolbi'),Forest:F,ForestRig:Rig,ForestEffects:Effects,ForestCamera:require(web+'/camera'),ForestSurfaces:V,
  ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',context);
 const scene=new context.Scene(canvas,()=>state);scene.assets=assets;scene.prepareLitter();scene.ready=true;scene.dt=.1;scene.phase=12.3;
 scene.camera.z=1.65;scene.camera.cx=.32;scene.camera.cy=.34;scene.camera.clamp();
 const board=createCanvas(1440,2400),bc=board.getContext('2d');bc.fillStyle='#f8f4eb';bc.fillRect(0,0,1440,2400);
 let count=0;const report=[];
 for(let tick=0;tick<=12;tick++){
  if(tick)F.step(state);F.valid(state);
  if(![0,4,8,12].includes(tick))continue;
  scene.phase=tick+12.3;scene.tick=state.worldTick;scene.tickAt=scene.phase-1;scene.visual={};const before=JSON.stringify(state);scene.draw();assert.equal(JSON.stringify(state),before);
  for(const p of state.individuals)assert.ok(F.Space.distance(scene.display[p.id],p)<1e-8);
  fs.writeFileSync(out+'/entry-'+tick+'.png',canvas.toBuffer('image/png'));
  const x=count%2*720,y=Math.floor(count/2)*1200;bc.drawImage(canvas,x+14,y+45,692,1107.2);
  bc.fillStyle='#354532';bc.font='24px K';bc.fillText(tick===0?'0.6.6에서 멈춘 위치':tick+'초 후 · '+state.individuals.filter(p=>F.Shelter.inside(state,p)).length+'명 실제 입실',x+24,y+32);
  report.push({seconds:tick,ledger:F.Shelter.ledger(state,state.shelters.facilities[0]),friends:state.individuals.map(p=>({name:p.name,phase:p.shelter.phase,inside:F.Shelter.inside(state,p),x:p.x,y:p.y,energy:p.energy,label:F.Shelter.label(state,p)}))});count++;
 }
 assert.ok(state.individuals.every(p=>F.Shelter.inside(state,p)));
 fs.writeFileSync(out+'/shelter-recovery.png',board.toBuffer('image/png'));
 fs.writeFileSync(out+'/result.json',JSON.stringify({source:'0.6.6 deterministic deadlock fixture',result:'both actually inside in 12 simulation seconds',frames:report,renderPure:true},null,2));
 console.log('PASS: actual renderer, four frames, both fully inside at 12s, state unchanged by drawing');
})();
