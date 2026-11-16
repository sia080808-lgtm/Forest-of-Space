const fs=require('fs'),path=require('path'),vm=require('vm'),{spawnSync}=require('child_process'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),out='/workspace/scratch/8dd22e074e8f/hood-canopy';
const F=require(web+'/engine.js'),I=require(web+'/inspector.js'),R=require(web+'/rig.js'),N=require(web+'/neolbi.js');
(async()=>{
const names=['01-rear-leaf','02-legs','03-body','04-eyes','05-front-leaf'],parts=[];for(const n of names)parts.push(await loadImage('/workspace/scratch/8dd22e074e8f/hood-clean/'+n+'.png'));
const W=255,H=208;let mode='base';
const sc=createCanvas(1020,832),sx=sc.getContext('2d');sx.drawImage(parts[4],0,0);const tex=sx.getImageData(0,0,1020,832).data,canopies={};
for(const name of ['shade','rain']){const can=createCanvas(1340,900),cx=can.getContext('2d'),d=cx.createImageData(1340,900);for(let xx=0;xx<1340;xx++){const target=(xx+.5)/4;let lo=0,hi=255;for(let j=0;j<22;j++){const x=(lo+hi)/2,t=Math.max(0,Math.min(1,(x-125)/103)),u=t*t*(3-2*t);if(x+80*u<target)lo=x;else hi=x;}const x=(lo+hi)/2,t=Math.max(0,Math.min(1,(x-125)/103)),u=t*t*(3-2*t),scaleY=1+.16*u,dy=-16*Math.sin(Math.PI*u)+(name==='rain'?9:2)*u*u-85*(scaleY-1),px=x*4-.5,ix=Math.floor(px),fx=px-ix;for(let yy=0;yy<900;yy++){const py=(((yy+.5)/4-dy)/scaleY)*4-.5,iy=Math.floor(py),fy=py-iy;if(ix<0||ix>=1019||iy<0||iy>=831)continue;let alpha=0,rgb=[0,0,0];for(let ry=0;ry<2;ry++)for(let rx=0;rx<2;rx++){const k=((iy+ry)*1020+ix+rx)*4,w=(rx?fx:1-fx)*(ry?fy:1-fy),a=tex[k+3]*w;alpha+=a;for(let j=0;j<3;j++)rgb[j]+=tex[k+j]*a;}const k=(yy*1340+xx)*4;if(alpha)for(let j=0;j<3;j++)d.data[k+j]=rgb[j]/alpha;d.data[k+3]=alpha;}}cx.putImageData(d,0,0);canopies[name]=can;}

function pet(c){
 if(mode!=='base'){c.save();c.translate(204,193);c.scale(1,.2);const g=c.createRadialGradient(0,0,2,0,0,98);g.addColorStop(0,'rgba(62,74,43,.18)');g.addColorStop(1,'rgba(62,74,43,0)');c.fillStyle=g;c.fillRect(-100,-100,200,200);c.restore();}
 for(let j=0;j<4;j++)c.drawImage(parts[j],0,0,W,H);
 if(mode==='base'){c.drawImage(parts[4],0,0,W,H);return;}
 c.drawImage(canopies[mode],0,0,335,225);
 if(mode==='rain'){c.fillStyle='rgba(222,237,224,.8)';for(const [x,y,rx]of [[176,55,4],[224,59,3],[269,72,4]]){c.beginPath();c.ellipse(x,y,rx,rx*.45,0,0,Math.PI*2);c.fill();}c.fillStyle='rgba(148,181,177,.8)';for(const y of [132,150]){c.beginPath();c.ellipse(306,y,1.5,2.6,0,0,Math.PI*2);c.fill();}}
}
const assets={};for(const n of ['garden','ridley','terrain','basin'])assets[n]=await loadImage(web+'/assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png');for(const[k,v]of Object.entries(R.files))assets[k]=await loadImage(web+'/'+v);assets.shadePlant=await loadImage(web+'/assets/forest/shade-plant.png');assets.shadeGround=await loadImage(web+'/assets/forest/shade-ground.png');
let drop=0;const previewRig={...R,draw(c,a,opt){if(opt.species!=='neolbi')return R.draw(c,a,opt);c.save();c.translate(627,1065.9);c.scale(1254/64*1.5*.24,1254/64*1.5*.24);c.translate(-127,-192);pet(c,drop);c.restore();}};
const state=F.create(1794744000000,88),ins=new I(state,F);ins.set('species','neolbi');ins.set('weather','sun');ins.set('motion','idle');ins.update(0);const owner=ins.state.individuals[0];Object.assign(owner,{x:.5,y:.55,B:60,canopy:false,canopyProgress:0});
const canvas=createCanvas(720,950);canvas.getBoundingClientRect=()=>({width:720,height:950,left:0,top:0});const ctx={ForestNeolbi:N,Forest:F,ForestRig:previewRig,ForestCamera:require(web+'/camera.js'),ForestSurfaces:require(web+'/surfaces.js'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null,createElement:()=>createCanvas(512,512)},requestAnimationFrame:()=>{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(web+'/scene.js','utf8')+'\nthis.Scene=ForestScene;',ctx);const scene=new ctx.Scene(canvas,()=>ins.state);scene.assets=assets;scene.prepareLitter();scene.ready=true;scene.dt=1/24;scene.camera.z=3;scene.camera.cx=.5;scene.camera.cy=.53;scene.camera.clamp();const crop=createCanvas(720,540),cx=crop.getContext('2d'),tmp=out+'/frames';fs.mkdirSync(tmp,{recursive:true});const smooth=x=>x*x*(3-2*x);
for(const m of ['base','shade','rain']){mode=m;scene.phase=2;scene.draw();cx.drawImage(canvas,0,200,720,540,0,0,720,540);fs.writeFileSync(out+'/Neolbi-Canopy-'+m+'.png',crop.toBuffer('image/png'));}
})();
