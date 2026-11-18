// 0.6.26 review: spider mites (P02) and 잎지기 on friends' leaves in the real engine (arrival by climate, density, burden,
// predation) and in the real scene.js render (native Canvas, not Android WebView).
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.6.26/runtime');
const F=require(web+'/engine'),Rig=require(web+'/rig'),C=F.Creatures;
const game=(seed,climate)=>{const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;s.environment.climate=climate;return s;};
(async()=>{fs.mkdirSync(out,{recursive:true});const report=[];const days={C01:7,C02:3,C04:3};
 for(const climate of (process.env.QUICK?[]:["C01","C02","C04"]))for(let seed=1;seed<=8;seed++){const s=game(seed,climate);let firstMite=null,firstKeeper=null,maxD=0,maxDmg=0,mites=0,keepers=0;const seen=new Set();
  for(let t=0;t<1200*days[climate];t++){F.step(s);for(const g of C.groups(s)){if(g.kind==='mite'){maxD=Math.max(maxD,g.density);firstMite??=s.worldTick;if(!seen.has(g.id)){seen.add(g.id);mites++;}}if(g.kind==='keeper'){firstKeeper??=s.worldTick;if(!seen.has(g.id)){seen.add(g.id);keepers++;}}}
   for(const p of s.individuals)maxDmg=Math.max(maxDmg,p.damage);if(t%1200===0)F.valid(s);}
  report.push({climate,days:days[climate],seed,firstMite,mites,firstKeeper,keepers,maxDensity:+maxD.toFixed(1),maxLeafDamage:+maxDmg.toFixed(1),eaten:+s.objects.creatures.log.eaten.toFixed(1),cleared:s.objects.creatures.log.cleared});}
 const A={};for(const n of ['garden','ridley','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),Forest:F,ForestRig:Rig,ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 // staged scenes from the real engine state: mites at three densities, then 잎지기 among them
 const scene=(name,density,keeper,z,phase=3)=>{const st=game(1,'C01');for(let t=0;t<20;t++)F.step(st);const p=st.individuals[0];p.motion=null;C.init(st);
  if(density)st.objects.creatures.groups.push({id:'cr:1',kind:'mite',host:p.id,density,low:0,since:0,bad:0,lastWork:0,carry:null});if(keeper)st.objects.creatures.groups.push({id:'cr:2',kind:'keeper',host:p.id,since:0,bad:0,eaten:0,lastWork:0,carry:null});
  const sc=new ctx.Scene(canvas,()=>st);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.dt=.1;sc.phase=phase;sc.camera.z=z;sc.camera.cx=p.x;sc.camera.cy=p.y-.03;sc.camera.clamp();const before=JSON.stringify(st);sc.draw();assert.equal(JSON.stringify(st),before,'render must not mutate state');
  fs.writeFileSync(out+'/'+name+'.png',canvas.toBuffer('image/png'));};
 scene('mites-low',12,false,4);scene('mites-high',80,false,4);scene('mites-keeper',40,true,4);scene('mites-world',60,true,1.4);
 if(!report.length)return;fs.writeFileSync(out+'/verification.json',JSON.stringify({renderer:'scene.js + @napi-rs/canvas (not Android WebView)',report},null,1));
 for(const c of ['C01','C02','C04']){const r=report.filter(x=>x.climate===c);console.log(c,r[0].days+'d','mite',r.filter(x=>x.firstMite!=null).length+'/8',r.map(x=>x.firstMite),'keeper',r.filter(x=>x.firstKeeper!=null).length+'/8','maxD',Math.max(...r.map(x=>x.maxDensity)),'dmg',Math.max(...r.map(x=>x.maxLeafDamage)),'eaten',r.map(x=>x.eaten));}
})().catch(e=>{console.error(e);process.exit(1)});
