// 0.6.28 review: every small neighbour (helpers, pests, predators, 돌돌이 visits), in the real engine
// (arrival by climate, stages, predation, harm cap) and in the real scene.js render (native Canvas, not Android WebView).
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.6.28/runtime');
const F=require(web+'/engine'),Rig=require(web+'/rig'),C=F.Creatures,O=F.Objects;
const game=(seed,climate)=>{const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;s.environment.climate=climate;return s;};
const KINDS=['ant','springtail','mite','keeper','gnat','soilmite','rove','mealy','lady'];
(async()=>{fs.mkdirSync(out,{recursive:true});const report=[];
 for(const climate of (process.env.QUICK?[]:['C01','C02','C04']))for(let seed=1;seed<=8;seed++){const s=game(seed,climate),base=O.storedLeaf(s);const first={};let pill=0,pillWas=false,tend=0,maxLarvae=0,maxMealy=0,maxHoney=0,maxGroups=0;
  for(let t=0;t<3600;t++){F.step(s);for(const g of C.groups(s)){first[g.kind]??=s.worldTick;if(g.kind==='gnat')maxLarvae=Math.max(maxLarvae,g.larvae);if(g.kind==='mealy'){maxMealy=Math.max(maxMealy,g.density);maxHoney=Math.max(maxHoney,g.honey);}if(g.kind==='ant'&&g.tend)tend++;}
   maxGroups=Math.max(maxGroups,C.groups(s).length);const v=s.neighbor.stage==='visiting';if(v&&!pillWas)pill++;pillWas=v;assert.ok(C.pestKinds(s).size<=2);if(t%1200===0)F.valid(s);}
  const l=s.objects.ledger;assert.ok(Math.abs(O.storedLeaf(s)+l.absorbed+(l.soil||0)-l.leafInput-base)<1e-6,'leaf conservation');
  report.push({climate,seed,...Object.fromEntries(KINDS.map(k=>[k,first[k]??null])),maxLarvae:+maxLarvae.toFixed(1),maxMealy:+maxMealy.toFixed(1),maxHoney:+maxHoney.toFixed(1),tendSeconds:tend,pillbugVisits:pill,maxGroups,eaten:+s.objects.creatures.log.eaten.toFixed(1)});}
 const A={};for(const n of ['garden','ridley','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),Forest:F,ForestRig:Rig,ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const scene=(name,setup,z,focus)=>{const st=game(1,'C01');for(let t=0;t<20;t++)F.step(st);const p=st.individuals[0];p.motion=null;C.init(st);setup(st,p);
  const sc=new ctx.Scene(canvas,()=>st);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.dt=.1;sc.phase=3;sc.camera.z=z;const f=focus(st,p);sc.camera.cx=f.x;sc.camera.cy=f.y;sc.camera.clamp();const before=JSON.stringify(st);sc.draw();assert.equal(JSON.stringify(st),before,'render must not mutate state');
  fs.writeFileSync(out+'/'+name+'.png',canvas.toBuffer('image/png'));};
 const add=(st,g)=>st.objects.creatures.groups.push({id:'cr:'+st.objects.creatures.nextId++,since:0,bad:0,lastWork:0,carry:null,...g});
 const spot=st=>st.patches.find(z=>z.id==='litter');
 scene('root-gnats',st=>{add(st,{kind:'gnat',site:'litter',adults:24,eggs:10,larvae:24,low:0,fit:200});},4,st=>({x:spot(st).x,y:spot(st).y-.01}));
 scene('root-gnats-soilmite',st=>{add(st,{kind:'gnat',site:'litter',adults:8,eggs:4,larvae:16,low:0,fit:200});add(st,{kind:'soilmite',site:'litter',eaten:0});},4,st=>({x:spot(st).x,y:spot(st).y-.01}));
 scene('mealybugs',(st,p)=>{add(st,{kind:'mealy',host:p.id,density:60,honey:30,low:0});},4,(st,p)=>({x:p.x,y:p.y-.03}));
 scene('mealybugs-ladybird-ant',(st,p)=>{add(st,{kind:'mealy',host:p.id,density:45,honey:25,low:0});add(st,{kind:'lady',host:p.id,stage:'larva',eaten:0});add(st,{kind:'ant',nest:{x:.3,y:.7},tend:p.id});},4,(st,p)=>({x:p.x,y:p.y-.03}));
 scene('rove-beetle',st=>{const z=spot(st),cr=st.patches.find(q=>q.id==='crevice');add(st,{kind:'gnat',site:'litter',adults:6,eggs:4,larvae:20,low:0,fit:200});add(st,{kind:'rove',site:'litter',hide:cr.id,eaten:0});},4,st=>({x:spot(st).x,y:spot(st).y-.01}));
 scene('pillbug',st=>{st.neighbor.stage='visiting';for(const p of st.individuals){p.x=.9;p.y=.9;}},4,st=>{const c=st.patches.find(q=>q.id==='crevice');return {x:c.x+.04,y:c.y};});
 scene('pillbug-rolled',st=>{st.neighbor.stage='visiting';const c=st.patches.find(q=>q.id==='crevice');st.individuals[0].x=c.x+.06;st.individuals[0].y=c.y+.03;},4,st=>{const c=st.patches.find(q=>q.id==='crevice');return {x:c.x+.04,y:c.y};});
 if(!report.length)return;fs.writeFileSync(out+'/verification.json',JSON.stringify({renderer:'scene.js + @napi-rs/canvas (not Android WebView)',days:3,report},null,1));
 for(const c of ['C01','C02','C04']){const r=report.filter(x=>x.climate===c);console.log(c,KINDS.map(k=>k+' '+r.filter(x=>x[k]!=null).length+'/8').join(', '),'| pillbug visits',r.map(x=>x.pillbugVisits).join(' '),'| larvae',Math.max(...r.map(x=>x.maxLarvae)),'mealy',Math.max(...r.map(x=>x.maxMealy)),'honey',Math.max(...r.map(x=>x.maxHoney)),'tend',Math.max(...r.map(x=>x.tendSeconds)),'groups',Math.max(...r.map(x=>x.maxGroups)));}
})().catch(e=>{console.error(e);process.exit(1)});
