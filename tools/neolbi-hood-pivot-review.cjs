const fs=require('fs'),path=require('path'),vm=require('vm'),{spawnSync}=require('child_process'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out='/workspace/scratch/8dd22e074e8f/hood-review';
const F=require(web+'/engine.js'),I=require(web+'/inspector.js'),R=require(web+'/rig.js'),N=require(web+'/neolbi.js');
(async()=>{
const sheet=await loadImage(out+'/source.png'),parts=[];
const defs=[
['rear',[45,70,420,312], 'M2 213 C14 169 90 130 137 124 C194 120 230 18 299 2 C377 -10 407 62 416 145 L416 277 Q408 318 350 308 L246 270 Q180 253 127 273 Q66 294 79 242 Q98 209 74 216 Q18 244 2 225 Z'],
['legs',[650,150,230,252],null],
['body',[1100,160,335,235],'M5 191 C13 139 50 119 76 87 C112 46 114 0 159 4 C208 3 226 39 252 74 C287 118 326 163 331 199 Q337 228 286 230 L55 230 Q0 229 5 191 Z'],
['eyes',[210,740,105,65],null],
['front',[530,620,440,215],'M8 170 C8 143 77 118 126 94 C184 46 211 15 284 12 C355 -4 425 37 432 112 C435 148 401 117 371 115 C320 104 300 129 245 147 C169 177 84 212 38 204 C15 201 5 190 8 170 Z']];
const {Path2D}=require('@napi-rs/canvas');
for(const [name,box,shape]of defs){const c=createCanvas(box[2],box[3]),x=c.getContext('2d');if(shape){x.clip(new Path2D(shape));x.drawImage(sheet,...box,0,0,c.width,c.height);}else if(name==='legs'){x.fillStyle='#776147';for(const xx of [4,181]){x.beginPath();x.roundRect(xx,5,43,243,21);x.fill();}x.globalCompositeOperation='source-atop';x.drawImage(sheet,...box,0,0,c.width,c.height);}else{x.strokeStyle='#fff3d7';x.lineWidth=14;x.lineCap='round';for(const xx of [16,86]){x.beginPath();x.moveTo(xx+7,15);x.lineTo(xx,49);x.stroke();}}
parts.push(c);fs.writeFileSync(out+'/'+name+'.png',c.toBuffer('image/png'));}
const eye=createCanvas(284,254),ec=eye.getContext('2d');ec.drawImage(parts[3],141,145,44,22);const ed=ec.getImageData(0,0,284,254).data;
const front=createCanvas(284,254),fc=front.getContext('2d');
function drawFront(c,p,amount){c.save();c.translate(p.x,p.y);c.rotate(p.a*amount);c.translate(-p.x,-p.y);c.drawImage(parts[4],37,52,236,113);c.restore();}
function visible(p,q){fc.clearRect(0,0,284,254);drawFront(fc,p,q);const d=fc.getImageData(0,0,284,254).data,sum=[0,0],vis=[0,0];for(let y=140;y<175;y++)for(let x=135;x<190;x++){const k=(y*284+x)*4,side=x<163?0:1;sum[side]+=ed[k+3];vis[side]+=ed[k+3]*(1-d[k+3]/255);}return vis.map((v,i)=>v/sum[i]);}
let best={score:Infinity};for(let px=50;px<=190;px+=5)for(let py=20;py<=100;py+=10)for(let a=.10;a<=.8;a+=.02){let p={x:px,y:py,a},v=visible(p,1),score=v.reduce((s,x)=>s+(x-.5)**2,0);if(score<best.score)best={...p,score,v};}
console.log('hinge and remaining eyes',best,'raised',visible(best,0));fs.writeFileSync(out+'/pose.json',JSON.stringify(best,null,2));
function pet(c,q){c.drawImage(parts[0],18,22,218,175);c.drawImage(parts[1],95,135,114,103);c.drawImage(parts[2],60,105,182,121);c.drawImage(parts[3],141,145,44,22);drawFront(c,best,q);}
const poses=createCanvas(852,254),pc=poses.getContext('2d');pc.fillStyle='#faf6eb';pc.fillRect(0,0,852,254);for(let j=0;j<3;j++){pc.save();pc.translate(j*284,0);pet(pc,j===1?1:0);pc.restore();}fs.writeFileSync(out+'/poses.png',poses.toBuffer('image/png'));
if(process.argv.includes('--poses'))return;
const assets={};for(const n of ['garden','ridley','terrain','basin'])assets[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');for(const[k,v]of Object.entries(R.files))assets[k]=await loadImage(web+'/'+v);assets.shadePlant=await loadImage(web+'/assets/forest/shade-plant.png');assets.shadeGround=await loadImage(web+'/assets/forest/shade-ground.png');
let drop=0;const previewRig={...R,draw(c,a,opt){if(opt.species!=='neolbi')return R.draw(c,a,opt);c.save();c.translate(627,1065.9);c.scale(1254/64*1.5*.2,1254/64*1.5*.2);c.translate(-142,-237);pet(c,drop);c.restore();}};
const state=F.create(1794744000000,88),ins=new I(state,F);ins.set('species','neolbi');ins.set('weather','sun');ins.set('motion','idle');ins.update(0);const owner=ins.state.individuals[0];Object.assign(owner,{x:.5,y:.55,B:60,canopy:false,canopyProgress:0});
const canvas=createCanvas(720,950);canvas.getBoundingClientRect=()=>({width:720,height:950,left:0,top:0});const ctx={ForestNeolbi:N,Forest:F,ForestRig:previewRig,ForestCamera:require(web+'/camera.js'),ForestSurfaces:require(web+'/surfaces.js'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);const scene=new ctx.Scene(canvas,()=>ins.state);scene.assets=assets;scene.prepareLitter();scene.ready=true;scene.dt=1/24;scene.camera.z=3;scene.camera.cx=.5;scene.camera.cy=.53;scene.camera.clamp();const crop=createCanvas(720,540),cx=crop.getContext('2d'),tmp=out+'/frames';fs.mkdirSync(tmp,{recursive:true});const smooth=x=>x*x*(3-2*x);
for(let i=0;i<168;i++){const t=i/24;drop=t<1?0:t<2.5?smooth((t-1)/1.5):t<4?1:t<5.5?1-smooth((t-4)/1.5):0;scene.phase=2;scene.draw();cx.drawImage(canvas,0,200,720,540,0,0,720,540);fs.writeFileSync(tmp+'/'+String(i).padStart(3,'0')+'.png',crop.toBuffer('image/png'));}
for(const args of [['-filter_complex','split[a][b];[a]palettegen[p];[b][p]paletteuse=dither=sierra2_4a','-loop','0',out+'/Neolbi-Hood-Pivot-Ingame.gif'],['-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',out+'/Neolbi-Hood-Pivot-Ingame.mp4']]){const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','24','-i',tmp+'/%03d.png',...args],{stdio:'inherit'});if(r.status)throw Error('ffmpeg failed');}
})();
