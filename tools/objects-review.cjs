const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.6.9/runtime');
const F=require(web+'/engine'),Rig=require(web+'/rig'),V=require(web+'/surfaces'),Effects=require(web+'/world-effects'),Q=require(web+'/stage2-fixtures');
(async()=>{
 fs.mkdirSync(out,{recursive:true});GlobalFonts.registerFromPath(web+'/fonts/GowunDodum-Regular.ttf','K');
 const assets={};for(const n of ['garden','ridley','terrain','basin'])assets[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])assets[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');
 for(const [k,v]of Object.entries(Rig.files))assets[k]=await loadImage(web+'/'+v);
 let state=F.create();const canvas=createCanvas(720,1152);canvas.getBoundingClientRect=()=>({width:720,height:1152,left:0,top:0});
 const context={ForestNeolbi:require(web+'/neolbi'),Forest:F,ForestRig:Rig,ForestEffects:Effects,ForestCamera:require(web+'/camera'),ForestSurfaces:V,ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',context);
 const scene=new context.Scene(canvas,()=>state);scene.assets=assets;scene.prepareLitter();scene.ready=true;scene.dt=.1;
 const board=createCanvas(1440,1440),bc=board.getContext('2d');bc.fillStyle='#f8f4eb';bc.fillRect(0,0,1440,1440);const report=[];
 let index=0;for(const [scenario,title]of [['OBJ-MOSS','마른 이끼에서도 · 천천히 회복'],['OBJ-LEAF','낙엽 놀이 · 밑에 붙는 그림자'],['OBJ-FOOD','거름을 흡수해 · 영양 보충'],['OBJ-RAIN','빈 샘터는 · 비로 채우기']]){
  state=Q.make(scenario);F.advance(state,scenario==='OBJ-RAIN'?45:4);F.valid(state);const p=state.individuals[0];scene.camera.z=2.2;scene.camera.cx=p.x;scene.camera.cy=p.y-.06;scene.camera.clamp();scene.phase=state.worldTick+1;scene.tick=state.worldTick;scene.tickAt=scene.phase-1;scene.display={};const before=JSON.stringify(state);scene.draw();assert.equal(JSON.stringify(state),before);fs.writeFileSync(out+'/'+scenario+'.png',canvas.toBuffer('image/png'));
  const x=index%2*720,y=Math.floor(index/2)*720;bc.fillStyle='#354532';bc.font='26px K';bc.fillText(title,x+24,y+36);bc.drawImage(await loadImage(canvas.toBuffer('image/png')),0,150,720,700,x+14,y+54,692,650);report.push({scenario,task:p.objectTask,water:state.spring.water,energy:p.energy,mood:p.mood,nutrition:p.nutrition,leaf:state.patches.find(z=>z.id==='litter'),renderPure:true});index++;
 }
 fs.writeFileSync(out+'/objects-0.6.9.png',board.toBuffer('image/png'));fs.writeFileSync(out+'/review.json',JSON.stringify(report,null,2));console.log('PASS actual runtime rendering: four scenes, simulation and render isolation');
})();
