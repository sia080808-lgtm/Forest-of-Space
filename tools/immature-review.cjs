// 0.6.38 review: the young stages in the real scene (native Canvas, not Android WebView): spider-mite eggs and young mites,
// mealybug crawlers, the 점박이 larva on a friend's leaves, and root-fly eggs on the litter. Render must not change state.
// Output: docs/qa-0.6.38/runtime/young-stages.png
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.6.38/runtime');fs.mkdirSync(out,{recursive:true});
const F=require(web+'/engine'),Rig=require(web+'/rig'),C=F.Creatures;
(async()=>{const A={};for(const n of ['garden','ridley','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),ForestSuperbum:require(web+'/superbum'),Forest:F,ForestRig:Rig,ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const s=F.create(0,5);s.started=true;s.mode='game';s.environment.tutorialDone=true;C.init(s);const p=s.individuals[0],lit=s.patches.find(z=>z.id==='litter');
 Object.assign(p,{xp:115,visualStage:3,x:lit.x+.08,y:lit.y+.02,action:'idle',motion:{kind:'idle',distance:0}});
 const st=s.objects.creatures,add=g=>st.groups.push({id:'cr:'+st.nextId++,since:0,bad:0,lastWork:0,carry:null,...g});
 add({kind:'mite',host:p.id,density:60,low:0});add({kind:'mealy',host:p.id,density:45,low:0,honey:0});add({kind:'lady',host:p.id,stage:'larva'});
 add({kind:'gnat',site:'litter',adults:10,eggs:12,larvae:20,low:0,fit:200});
 const before=JSON.stringify(s);
 const sc=new ctx.Scene(canvas,()=>s);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.dt=.1;sc.phase=2;sc.camera.z=5;sc.camera.cx=p.x-.03;sc.camera.cy=p.y-.06;sc.camera.clamp();
 for(let i=0;i<5;i++){sc.phase=2+i*.1;sc.draw();}
 if(JSON.stringify(s)!==before)throw Error('render changed state');
 fs.writeFileSync(out+'/young-stages.png',canvas.toBuffer('image/png'));console.log('ok, state unchanged');})().catch(e=>{console.error(e);process.exit(1);});
