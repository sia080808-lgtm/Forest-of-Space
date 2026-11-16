const fs=require('node:fs'),path=require('node:path'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const dir=path.resolve(__dirname,'../app/src/main/assets/web/assets/forest/neolbi');
(async()=>{const im=await loadImage(dir+'/layer-source-v7.png'),c=createCanvas(im.width,im.height),x=c.getContext('2d');x.drawImage(im,0,0);const data=x.getImageData(0,0,im.width,im.height).data,parts=[];
for(let k=0;k<3;k++){let l=im.width,t=im.height,r=0,b=0;for(let yy=0;yy<im.height;yy++)for(let xx=Math.floor(k*im.width/3);xx<Math.floor((k+1)*im.width/3);xx++)if(data[(yy*im.width+xx)*4+3]>128){l=Math.min(l,xx);r=Math.max(r,xx);t=Math.min(t,yy);b=Math.max(b,yy);}let p=createCanvas(r-l+1,b-t+1);p.getContext('2d').drawImage(im,l,t,p.width,p.height,0,0,p.width,p.height);parts.push(p);fs.writeFileSync(dir+'/'+['rear-v7','inner-v7','outer-v7'][k]+'.png',p.toBuffer('image/png'));}
const W=768,H=384,outer=createCanvas(W*7,H*3),inner=createCanvas(W*7,H*3),rear=createCanvas(W,H);
function rig(ctx){ctx.scale(W/106,H/58.5);ctx.translate(23,58.5);}
let rx=rear.getContext('2d');rig(rx);rx.drawImage(parts[0],-23,-37,40,25);fs.writeFileSync(dir+'/rear-frame-v7.png',rear.toBuffer('image/png'));
for(let f=0;f<=20;f++){let q=f/20;for(let kind=0;kind<2;kind++){let cc=createCanvas(W,H),ctx=cc.getContext('2d');rig(ctx);
if(kind===0){ctx.drawImage(parts[1],-13,-23+1.5*q,36+16*q,18+q);}else{const p=parts[2],steps=180;for(let i=0;i<steps;i++){let u=i/steps,v=(i+1)/steps;const shape=t=>{let z=Math.max(0,(t-.67)/.33);return z*z*(3-2*z);};let a=shape(u),b=shape(v);let dx=-23+47*u+20*q*a,dw=47*(v-u)+20*q*(b-a);ctx.drawImage(p,u*p.width,0,p.width/steps+.1,p.height,dx,-26+q*a*(-2*Math.sin(u*Math.PI)+4*a),dw+.05,21+q*2*a);}}
(kind===0?inner:outer).getContext('2d').drawImage(cc,f%7*W,Math.floor(f/7)*H);}}
fs.writeFileSync(dir+'/lining.png',inner.toBuffer('image/png'));fs.writeFileSync(dir+'/canopy.png',outer.toBuffer('image/png'));})();
