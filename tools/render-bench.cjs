// 1.1.6 render benchmark in a real browser (Chromium, software raster, phone-sized canvas 393x690 at DPR 2.5):
// time per frame and per drawing part for a busy scene (6 friends, summer lake filled). Node canvas timings differ a lot
// from the browser's (filters and canvas-to-canvas draws), so drawing changes are measured here.
// Usage: node tools/render-bench.cjs [--flush]   (--flush forces the raster after each part, so parts get their own cost)
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawn}=require('node:child_process');const {chromium}=require('playwright');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'rb-'));
for(const f of fs.readdirSync(web))fs.symlinkSync(path.join(web,f),path.join(dir,f));
const scripts=[...fs.readFileSync(web+'/index.html','utf8').matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]).filter(f=>!/forest-app|carry|object-cards|audio/.test(f));
fs.writeFileSync(dir+'/bench.html',`<!doctype html><meta charset=utf-8><body style="margin:0"><canvas id=c style="width:393px;height:690px;display:block"></canvas>${scripts.map(f=>`<script src="${f}"></script>`).join('')}<script>
window.bench=async(flush)=>{const F=Forest,W=ForestWorld;const s=F.create(0,3);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;
 for(const sp of ['bonbon','neolbi','bosong','jureong','superbum']){const q=JSON.parse(JSON.stringify(s.individuals[0]));Object.assign(q,{id:'f-'+sp,species:sp,name:sp,x:.3+((sp.length*37)%10)/25,y:.3+((sp.length*53)%10)/25,xp:40});delete q.objectTask;delete q.stroll;s.individuals.push(q);}
 W.openLake(s);s.environment.calendar.start=s.worldTick-3600-300;W.fillLake(s);for(let i=0;i<200;i++)F.step(s);
 const cv=document.getElementById('c');const sc=new ForestScene(cv,()=>s);await sc.load();sc.ready=true;sc.paused=true;sc.inspector=null;
 const acc={},g=cv.getContext('2d'),fl=()=>{if(flush)g.getImageData(0,0,1,1);};
 const wrap=(o,k,lab)=>{const f=o[k];if(!f)return;o[k]=function(...a){fl();const t=performance.now();try{return f.apply(this,a);}finally{fl();const l=typeof lab==='function'?lab(a):lab;acc[l]=(acc[l]||0)+performance.now()-t;}};};
 for(const k of ['drawFloor','drawFrame','shelterArt','drawFallen','springFlow','canopy'])wrap(sc,k,k);wrap(sc,'terrain',a=>'terrain:'+a[0].id);wrap(sc,'pet',a=>'pet:'+a[0].species);if(ForestEffects.gradeOver)wrap(ForestEffects,'gradeOver','light');
 const run=N=>{for(const k in acc)delete acc[k];const t=performance.now();for(let k=0;k<N;k++){sc.phase=11+k*.033;sc.tick=s.worldTick;sc.tickAt=sc.phase;sc.draw();}g.getImageData(0,0,1,1);return {frame:+((performance.now()-t)/N).toFixed(2),parts:Object.fromEntries(Object.entries(acc).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,+(v/N).toFixed(2)]))};};
 run(20);const a=run(120);sc.camera.z=sc.camera.zMin||.4;sc.camera.clamp();run(10);return {canvas:cv.width+'x'+cv.height,default:a,overview:run(120)};};
</script>`);
(async()=>{const srv=spawn('python3',['-m','http.server','8766','--bind','127.0.0.1'],{cwd:dir,stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
 try{const b=await chromium.launch({args:['--no-sandbox']});const pg=await(await b.newContext({viewport:{width:393,height:690},deviceScaleFactor:2.5})).newPage();pg.on('pageerror',e=>console.error(e.message));
  await pg.goto('http://127.0.0.1:8766/bench.html');const r=await pg.evaluate(f=>bench(f),process.argv.includes('--flush'));console.log(JSON.stringify(r,null,1));await b.close();}
 finally{srv.kill();fs.rmSync(dir,{recursive:true,force:true});}})();
