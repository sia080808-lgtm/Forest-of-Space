// Motion preview of the 0.6.26~0.6.27 small neighbours in the real scene.js render (native Canvas, not Android WebView):
// one labelled panel per creature, the render phase advancing while the game state stays fixed (render never changes state).
// Output: docs/qa-0.6.28/runtime/neighbours-motion.mp4 (frames are written to a temp folder and removed after encoding).
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out=path.resolve(__dirname,'../docs/qa-0.6.28/runtime');
const F=require(web+'/engine'),Rig=require(web+'/rig'),C=F.Creatures;
for(const f of fs.readdirSync(web+'/fonts').filter(f=>/\.(ttf|otf)$/.test(f)))GlobalFonts.registerFromPath(web+'/fonts/'+f,'Forest');
(async()=>{
 const A={};for(const n of ['garden','ridley','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestNeolbi:require(web+'/neolbi'),Forest:F,ForestRig:Rig,ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const base=()=>{const st=F.create(0,1);st.started=true;st.environment.tutorialDone=true;st.recruitment.nextAttempt=1e9;for(let t=0;t<20;t++)F.step(st);st.individuals[0].motion=null;C.init(st);return st;};
 const add=(st,g)=>st.objects.creatures.groups.push({id:'cr:'+st.objects.creatures.nextId++,since:0,bad:0,lastWork:0,carry:null,...g});
 const spot=st=>st.patches.find(z=>z.id==='litter');
 const panels=[
  ['잎응애 (밀도 높음, 실)',st=>{const p=st.individuals[0];add(st,{kind:'mite',host:p.id,density:80,low:0});return {x:p.x,y:p.y-.025};}],
  ['잎지기가 잎응애를 찾는 중',st=>{const p=st.individuals[0];add(st,{kind:'mite',host:p.id,density:30,low:0});add(st,{kind:'keeper',host:p.id,eaten:0});return {x:p.x,y:p.y-.025};}],
  ['뿌리날파리 성충·유충 (젖은 낙엽)',st=>{add(st,{kind:'gnat',site:'litter',adults:24,eggs:6,larvae:24,low:0,fit:200});return {x:spot(st).x,y:spot(st).y-.035};}],
  ['흙지기가 유충을 찾는 중',st=>{add(st,{kind:'gnat',site:'litter',adults:6,eggs:4,larvae:16,low:0,fit:200});add(st,{kind:'soilmite',site:'litter',eaten:0});return {x:spot(st).x,y:spot(st).y-.025};}],
  ['솜깍지·알주머니·감로',st=>{const p=st.individuals[0];add(st,{kind:'mealy',host:p.id,density:60,honey:30,low:0});return {x:p.x,y:p.y-.025};}],
  ['점박이 + 감로를 지키는 개미',st=>{const p=st.individuals[0];add(st,{kind:'mealy',host:p.id,density:45,honey:25,low:0});add(st,{kind:'lady',host:p.id,stage:'larva',eaten:0});add(st,{kind:'ant',nest:{x:.3,y:.7},tend:p.id});return {x:p.x,y:p.y-.025};}]];
 const scenes=panels.map(([label,setup])=>{const st=base(),focus=setup(st);const sc=new ctx.Scene(canvas,()=>st);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.dt=.1;sc.camera.z=4;sc.camera.cx=focus.x;sc.camera.cy=focus.y;sc.camera.clamp();return {label,st,sc,before:JSON.stringify(st)};});
 const PW=300,PH=300,COLS=3,ROWS=2,frame=createCanvas(PW*COLS,PH*ROWS+0),g=frame.getContext('2d'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'nb-'));
 const FPS=24,SECONDS=8;
 for(let f=0;f<FPS*SECONDS;f++){g.fillStyle='#fff';g.fillRect(0,0,frame.width,frame.height);
  scenes.forEach((s,i)=>{s.sc.phase=3+f/FPS;s.sc.draw();const x=(i%COLS)*PW,y=Math.floor(i/COLS)*PH;g.drawImage(canvas,196-75,345-75,150,150,x,y,PW,PH);
   g.fillStyle='rgba(255,252,246,.85)';g.fillRect(x,y+PH-30,PW,30);g.fillStyle='#3d3226';g.font='15px Forest, sans-serif';g.fillText(s.label,x+10,y+PH-10);g.strokeStyle='#fff';g.lineWidth=2;g.strokeRect(x,y,PW,PH);});
  fs.writeFileSync(path.join(tmp,'f'+String(f).padStart(4,'0')+'.png'),frame.toBuffer('image/png'));}
 for(const s of scenes)if(JSON.stringify(s.st)!==s.before)throw Error('render changed state: '+s.label);
 fs.mkdirSync(out,{recursive:true});execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',String(FPS),'-i',path.join(tmp,'f%04d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-crf','22',out+'/neighbours-motion.mp4']);
 fs.copyFileSync(path.join(tmp,'f0048.png'),out+'/neighbours-motion-frame.png');fs.rmSync(tmp,{recursive:true,force:true});console.log('ok');
})().catch(e=>{console.error(e);process.exit(1)});
