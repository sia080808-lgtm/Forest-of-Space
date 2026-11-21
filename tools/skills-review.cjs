// 1.1.0 review (SRS v2.36 고유 스킬): stills from the real scene.js — 베이치 물 찾기(웅덩이), 코로나 낙엽 모으기,
// 리들리 잎 털어 주기, 엘리시 촉촉한 잎 곁. Output: docs/qa-1.1.0/runtime/skills.png. Usage: node tools/skills-review.cjs
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const R=path.resolve(__dirname,'..')+'/';const {createCanvas,loadImage,GlobalFonts}=require(R+'node_modules/@napi-rs/canvas');
const web=R+'app/src/main/assets/web',out=R+'docs/qa-1.1.0/runtime';fs.mkdirSync(out,{recursive:true});const F=require(web+'/engine'),Rig=require(web+'/rig'),K=require(web+'/skills');
for(const f of fs.readdirSync(web+'/fonts').filter(f=>/\.(ttf|otf)$/.test(f)))try{GlobalFonts.registerFromPath(web+'/fonts/'+f,'Forest');}catch{}
(async()=>{const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestSkills:K,ForestVitals:require(web+'/vitals'),ForestNeolbi:require(web+'/neolbi'),ForestSuperbum:require(web+'/superbum'),Forest:F,ForestRig:Rig,ForestWorld:require(web+'/world'),ForestEnvironment:require(web+'/environment'),ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},Image:class{},console};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const A={};for(const n of ['garden','ridley','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const [k,v] of Object.entries(ctx.Scene.seasonFiles()))try{A[k]=await loadImage(web+'/'+v);}catch{}
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 for(const [k,v] of Object.entries(require(web+'/creature-art').FILES||{}))try{A[k]=await loadImage(web+'/'+v);}catch{}
 A.gardenWide=await loadImage(web+'/assets/forest/garden-wide.png');for(let i=1;i<=6;i++)A['fern'+i]=await loadImage(web+'/assets/forest/ferns/fern-'+i+'.png');
 const pet=(s,species,name,x,y,more={})=>{const q=JSON.parse(JSON.stringify(s.individuals[0]));Object.assign(q,{id:'k-'+species+s.individuals.length,species,name,x,y,B:55,energy:80,nutrition:60,xp:115,visualStage:3,active:true,mounted:false,motion:{kind:'idle',distance:0,tick:0}},more);s.individuals.push(q);return q;};
 const scenes=[
  ['베이치 · 물 찾기 (숨은 물 웅덩이)',s=>{const m=s.patches.find(z=>z.id==='moss');const b=pet(s,'bosong','베이치',m.x+.07,m.y+.07);b.motion.kind='sniff';b.skill={k:'dig',phase:'sniff',start:0,at:0,from:'moss',x:b.x,y:b.y};
   s.skills={puddles:[{id:'pd:1',x:m.x+.12,y:m.y+.09,W:6,from:'moss',born:0,by:b.id}],nextId:2,seen:{}};const r=pet(s,'ridley','리들리',m.x+.2,m.y+.1,{B:25});r.guideTo={kind:'puddle',id:'pd:1',x:m.x+.12,y:m.y+.09,until:999,by:b.id};return b;}],
  ['코로나 · 낙엽 긁어모으기',s=>{const L=require(web+'/litter'),st=s.objects.litter;st.leaves=[];st.piles=[];const c=pet(s,'jureong','코로나',.42,.62);const sec=L.sectorOf({x:.42,y:.6});
   for(const [dx,dy,r] of [[-.12,.015,.4],[.12,.006,2.1],[.085,.035,1.2]])st.leaves.push({id:st.nextLeaf++,sector:sec,x:.42+dx,y:.6+dy,rot:r,moved:0});c.motion.kind='rake';c.skill={k:'rake',phase:'rake',start:0,at:0,sector:sec,ids:st.leaves.map(l=>l.id),cx:.42,cy:.63,x:c.x,y:c.y};return c;}],
  ['리들리 · 잎 털어 주기',s=>{const e=pet(s,'neolbi','엘레판',.5,.6);const st=s.objects.creatures;st.groups.push({id:'cr:'+st.nextId++,kind:'mite',host:e.id,since:0,bad:0,lastWork:0,carry:null,density:40,low:0});
   const r=pet(s,'ridley','리들리',.43,.604);r.motion.kind='brush';r.skill={k:'brush',target:e.id,phase:'do',start:0,at:0};e.skillHold=r.id;return r;}],
  ['엘리시 · 촉촉한 잎 곁',s=>{const m=s.patches.find(z=>z.id==='moss');const e=pet(s,'bonbon','엘리시',m.x+.04,m.y+.03);pet(s,'bosong','베이치',e.x+.08,e.y+.02);return e;}]];
 const cw=330,ch=290,sheet=createCanvas(cw*2+20,(ch+30)*2+10),g=sheet.getContext('2d');g.fillStyle='#f6ece0';g.fillRect(0,0,sheet.width,sheet.height);g.font='15px Forest, sans-serif';g.fillStyle='#4a3c2e';
 for(const [i,[label,make]] of scenes.entries()){const s=F.create(0,4);s.started=true;s.environment.tutorialDone=true;s.weather.kind='sun';s.weather.intensity=0;s.individuals[0].active=false;s.worldTick=300;const focus=make(s);
  const sc=new ctx.Scene(canvas,()=>s);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.camera.z=3.2;sc.camera.cx=focus.x+.05;sc.camera.cy=focus.y-.02;sc.camera.clamp();
  for(let k=0;k<3;k++){sc.phase=11.3+k*.02;sc.tick=s.worldTick;sc.tickAt=sc.phase;sc.draw();}
  const q=sc.camera.screen({x:focus.x+.05,y:focus.y}),x=10+(i%2)*(cw+0),y=10+Math.floor(i/2)*(ch+30);g.fillText(label,x+6,y+18);g.drawImage(canvas,q.x-165,q.y-190,330,260,x,y+26,cw-8,ch-30);}
 fs.writeFileSync(out+'/skills.png',sheet.toBuffer('image/png'));console.log('ok');})().catch(e=>{console.error(e);process.exit(1);});
