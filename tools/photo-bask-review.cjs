// 1.0.3 review: 광합성 on the ground; on the sun rock 슈퍼 광합성 (warm day, big motes), both (cold day), 볕 쬐기 only (cold night). Real scene.js render.
// Output: docs/qa-1.0.3/runtime/photo-game.png. Usage: node tools/photo-bask-review.cjs

const fs=require('node:fs'),vm=require('node:vm');const R=require('node:path').resolve(__dirname,'..')+'/';const {createCanvas,loadImage,GlobalFonts}=require(R+'node_modules/@napi-rs/canvas');
const web=R+'app/src/main/assets/web',out=R+'docs/qa-1.0.3/runtime';const F=require(web+'/engine'),Rig=require(web+'/rig');for(const f of fs.readdirSync(web+'/fonts').filter(f=>/\.(ttf|otf)$/.test(f)))try{GlobalFonts.registerFromPath(web+'/fonts/'+f,'Forest');}catch{}
(async()=>{const canvas=createCanvas(393,690);canvas.getBoundingClientRect=()=>({width:393,height:690,left:0,top:0});
 const ctx={ForestVitals:require(web+'/vitals'),ForestNeolbi:require(web+'/neolbi'),ForestSuperbum:require(web+'/superbum'),Forest:F,ForestRig:Rig,ForestWorld:require(web+'/world'),ForestEnvironment:require(web+'/environment'),ForestCreatureArt:require(web+'/creature-art'),ForestEffects:require(web+'/world-effects'),ForestCamera:require(web+'/camera'),ForestSurfaces:require(web+'/surfaces'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},Image:class{},console};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);
 const A={};for(const n of ['garden','ridley','terrain','basin'])A[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');
 for(const [k,v] of Object.entries(ctx.Scene.seasonFiles()))try{A[k]=await loadImage(web+'/'+v);}catch{}
 for(const n of ['shadePlant','shadeGround'])A[n]=await loadImage(web+'/assets/forest/'+(n==='shadePlant'?'shade-plant':'shade-ground')+'.png');for(const [k,v]of Object.entries(Rig.files))A[k]=await loadImage(web+'/'+v);
 A.gardenWide=await loadImage(web+'/assets/forest/garden-wide.png');for(let i=1;i<=6;i++)A['fern'+i]=await loadImage(web+'/assets/forest/ferns/fern-'+i+'.png');
 const SP=['ridley','bonbon','neolbi','bosong','jureong','superbum'],T=[['ground',300,60,'땅 광합성'],['rock',300,60,'바위·따뜻한 낮: 슈퍼 광합성'],['rock',300,20,'바위·추운 낮: 둘 다'],['rock',900,20,'바위·추운 밤: 볕 쬐기만']],cw=200,ch=180;
 const sheet=createCanvas(cw*T.length+80,ch*SP.length+40),g=sheet.getContext('2d');g.fillStyle='#f6ece0';g.fillRect(0,0,sheet.width,sheet.height);g.fillStyle='#4a3c2e';g.font='14px Forest, sans-serif';
 T.forEach(([,,,l],i)=>{g.textAlign='center';g.fillText(l,80+i*cw+cw/2,26);});const kinds=[];
 for(const [r,sp] of SP.entries()){g.textAlign='left';g.fillStyle='#4a3c2e';g.fillText(F.SPECIES.find(x=>x[0]===sp)[1],8,40+r*ch+ch/2);
  for(const [i,[where,tick,temp]] of T.entries()){const s=F.create(0,4);s.started=true;s.environment.tutorialDone=true;s.weather.kind='sun';s.weather.intensity=0;s.climate.L=60;s.climate.T=temp;const p=s.individuals[0];
   const rock=s.patches.find(z=>z.id==='rock');rock.sun=80;const pos=where==='rock'?F.Space.rockTop(s):{x:rock.x-.18,y:rock.y+.02};
   Object.assign(p,{species:sp,xp:115,visualStage:3,B:50,nutrition:50,energy:80,mood:90,x:pos.x,y:pos.y,motion:{kind:where==='rock'?'rest':'idle',distance:0,tick:0}});
   if(where==='rock'){p.objectTask={object:'rock',kind:'rest',reason:'energy',since:0};p.objectArrived=true;}
   const sc=new ctx.Scene(canvas,()=>s);sc.assets=A;sc.prepareLitter();sc.ready=true;sc.inspector=null;sc.camera.z=sp==='superbum'||sp==='neolbi'?2:3;sc.camera.cx=p.x;sc.camera.cy=p.y-.03;sc.camera.clamp();
   s.worldTick=tick;const gr=ctx.ForestVitals.photoGrade(s,p,F.light(s,p),false);kinds.push(sp+' '+where+' '+tick+' '+gr);for(let k=0;k<3;k++){sc.phase=11.5+k*.02;sc.tick=s.worldTick;sc.tickAt=sc.phase;sc.draw();}
   const q=sc.camera.screen({x:p.x,y:p.y});g.drawImage(canvas,q.x-110,q.y-150,220,200,80+i*cw,34+r*ch,cw-8,ch-12);}}
 console.log(kinds.join('\n'));fs.writeFileSync(out+'/photo-game.png',sheet.toBuffer('image/png'));})().catch(e=>{console.error(e);process.exit(1);});
