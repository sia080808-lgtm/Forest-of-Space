// Review: where friends rest under the leaf-shade plant and under 엘레판's open leaf, from the real engine, drawn by the
// real scene.js (native Canvas, not Android WebView). Output: docs/qa-0.6.30/runtime/shade-*.png
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.6.30/runtime');fs.mkdirSync(out,{recursive:true});
const F=require(web+'/engine'),Rig=require(web+'/rig');
(async()=>{const A={};for(const n of ['garden','ridley','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),ForestSuperbum:require(web+'/superbum'),Forest:F,ForestRig:Rig,ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const shot=(s,name,cx,cy,z=2.6)=>{const sc=new ctx.Scene(canvas,()=>s);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.dt=.1;sc.phase=2;sc.camera.z=z;sc.camera.cx=cx;sc.camera.cy=cy;sc.camera.clamp();for(let i=0;i<30;i++){sc.phase=2+i*.1;sc.draw();}fs.writeFileSync(out+'/'+name+'.png',canvas.toBuffer('image/png'));};
 const report={};
 // 1) leaf-shade plant: a tired friend on a sunny day picks the shade and rests there
 {const s=F.create(0,5);s.started=true;s.mode='game';s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;const p=s.individuals[0];Object.assign(p,{xp:115,visualStage:3,energy:30,B:65,nutrition:70,mood:80});const z=s.patches.find(q=>q.id==='shade');
  // the real rest option the engine offers for the shade (route-checked), with the friend placed on it
  s.climate.L=80;s.weather.kind='sun';const o=F.Objects.option(s,p,'shade','rest','energy');let found=null;if(o&&!o.fail){p.x=o.x;p.y=o.y;p.motion={kind:'rest',distance:0};p.action='rest';found={x:o.x-z.x,y:o.y-z.y};}
  report.shadeRest=found&&{dx:+found.x.toFixed(3),dy:+found.y.toFixed(3)};shot(s,'shade-plant',z.x,z.y-.04);}
 // 2) 엘레판 shelters a friend from rain under its open leaf
 {const s=F.create(0,9);s.started=true;s.mode='game';s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;const base=s.individuals[0];Object.assign(base,{xp:115,visualStage:3});
  s.individuals.push({...F.clone(base),id:'n',species:'neolbi',name:'엘레판',x:.45,y:.6,active:true,sources:{rain:0,other:0,unknown:0}});base.x=.3;base.y=.6;
  let seen=null;for(let t=0;t<1800;t++){s.weather.kind='rain';s.weather.intensity=60;s.weather.remaining=200;s.weather.wind=10;F.step(s);const a=s.social.sessions.find(a=>a.type==='CANOPY'&&a.phase==='rest');if(a){const h=s.individuals.find(q=>q.id===a.ids[0]),r=s.individuals.find(q=>q.id===a.ids[1]);if((h.canopyProgress??0)>=1){seen={dx:+(r.x-h.x).toFixed(3),dy:+(r.y-h.y).toFixed(3),hx:h.x,hy:h.y};break;}}}
  report.canopyRest=seen;if(seen)shot(s,'neolbi-canopy',seen.hx+.05,seen.hy-.05);}
 fs.writeFileSync(out+'/shade-verification.json',JSON.stringify(report,null,1));console.log(JSON.stringify(report));})().catch(e=>{console.error(e);process.exit(1);});
