// Bakes 슈퍼범's shelter outline (--huddle: the folded pose used inside a shelter, 0.6.38) (convex hull of the real render, idle + walk, dry and wet) into shelter.js PROFILES,
// in the same world-px units the other species use (size 48 frame).  Usage: node tools/bake-superbum-profile.cjs
const fs=require('fs'),path=require('path'),{createCanvas,loadImage}=require('@napi-rs/canvas'),web=path.resolve(__dirname,'../app/src/main/assets/web'),R=require(web+'/rig');
function hull(points){points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);let lower=[],upper=[];for(const p of points){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}for(const p of points.slice().reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}return lower.slice(0,-1).concat(upper.slice(0,-1));}
const HUDDLE=process.argv.includes('--huddle'),KEY=HUDDLE?'superbumHuddle':'superbum';
(async()=>{const assets={};for(const[k,v]of Object.entries(R.files))if(k.startsWith('superbum'))assets[k]=await loadImage(web+'/'+v);
 const c=createCanvas(800,600),ctx=c.getContext('2d');for(const water of [0,1])for(const kind of HUDDLE?['idle','rest','sleep']:['idle','walk'])for(const phase of [0,.2,.4,.6,.8,1]){ctx.save();ctx.translate(400,500);ctx.scale(4*48/1254,4*48/1254);ctx.translate(-627,-1065.9);R.draw(ctx,assets,{species:'superbum',kind,phase,water,huddle:HUDDLE?1:0});ctx.restore();}
 const data=ctx.getImageData(0,0,800,600).data,points=[];for(let y=0;y<600;y+=2)for(let x=0;x<800;x+=2)if(data[(y*800+x)*4+3]>100)points.push([(x-400)/4,(y-500)/4]);
 const h=hull(points).map(([x,y])=>[Math.round(x*4)/4,Math.round(y*4)/4]);
 const file=web+'/shelter.js';let s=fs.readFileSync(file,'utf8');s=s.replace(new RegExp('\\nObject\\.assign\\(PROFILES,\\{"'+KEY+'":.*\\}\\);'),'');s=s.replace(/\nconst PHASES=/,'\nObject.assign(PROFILES,{"'+KEY+'":'+JSON.stringify(h)+'});\nconst PHASES=');fs.writeFileSync(file,s);
 const xs=h.map(p=>p[0]),ys=h.map(p=>p[1]);console.log(KEY+' profile',h.length,'points, x',Math.min(...xs),Math.max(...xs),'y',Math.min(...ys),Math.max(...ys));})();
