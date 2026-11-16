// Registered painted inner/outer hood. No procedural forehead fill or seam.
const {createCanvas,loadImage}=require('@napi-rs/canvas'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../app/src/main/assets/web/assets/forest/neolbi');
function bounds(im){const c=createCanvas(im.width,im.height),x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,im.width,im.height).data;let l=im.width,t=im.height,r=0,b=0;for(let y=0;y<im.height;y++)for(let xx=0;xx<im.width;xx++)if(d[(y*im.width+xx)*4+3]>128){l=Math.min(l,xx);r=Math.max(r,xx);t=Math.min(t,y);b=Math.max(b,y);}return [l,t,r-l+1,b-t+1];}
function surface(im,crop,w){const c=createCanvas(w,272),x=c.getContext('2d');x.drawImage(im,...crop,0,0,w,272);const pixels=x.getImageData(0,0,w,272);for(let i=3;i<pixels.data.length;i+=4)if(pixels.data[i]<190)pixels.data[i]=0;x.putImageData(pixels,0,0);const data=pixels.data,cols=[];for(let xx=0;xx<w;xx++){let top=272,bottom=-1;for(let y=0;y<272;y++)if(data[(y*w+xx)*4+3]>80){top=Math.min(top,y);bottom=y;}cols.push({top,bottom});}return {canvas:c,data,w,cols};}
function sample(s,x,y,k){if(y<0||y>271)return 0;x=Math.max(0,Math.min(s.w-1.001,x));y=Math.max(0,Math.min(270.999,y));const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,value=(xx,yy)=>{const n=(yy*s.w+xx)*4;return k===3?s.data[n+3]:s.data[n+k]*s.data[n+3]/255;};return value(ix,iy)*(1-fx)*(1-fy)+value(ix+1,iy)*fx*(1-fy)+value(ix,iy+1)*(1-fx)*fy+value(ix+1,iy+1)*fx*fy;}

(async()=>{
const full=await loadImage(dir+'/hood-full-v6.png'),front=await loadImage(dir+'/hood-front-v6.png');
// Keep the paired foreground registered to the complete painted hood canvas.
const registered=createCanvas(full.width,full.height);registered.getContext('2d').drawImage(front,0,0,full.width,full.height);
const crop=bounds(full),C=surface(registered,crop,460),L=surface(full,crop,460),W=768,H=384;
const atlas=createCanvas(W*7,H*3),ac=atlas.getContext('2d'),innerAtlas=createCanvas(W*7,H*3),ic=innerAtlas.getContext('2d');
function base(s){const c=createCanvas(W,H),x=c.getContext('2d');x.drawImage(s.canvas,0,23/58.5*H,46/106*W,27.2/58.5*H);return x.getImageData(0,0,W,H);}
// Remove the old pale front tip, then restore a full overlapping green leaf
// underneath it. Foreground contours must not define the rear leaf contour.
const lc=L.canvas.getContext('2d');lc.save();lc.beginPath();lc.rect(310,0,150,272);lc.clip();lc.globalCompositeOperation='destination-out';lc.drawImage(C.canvas,0,0);lc.restore();
const middleLeaf=createCanvas(460,272),mc=middleLeaf.getContext('2d');
mc.save();mc.beginPath();mc.moveTo(290,16);mc.bezierCurveTo(335,18,365,43,379,79);mc.bezierCurveTo(389,102,391,128,378,153);mc.lineTo(285,161);mc.closePath();mc.clip();
mc.drawImage(L.canvas,230,48,65,52,270,6,130,165);mc.restore();mc.drawImage(L.canvas,0,0);
lc.putImageData(mc.getImageData(0,0,460,272),0,0);
// Extend the inner rear leaf into the torso occlusion area, using its own
// painted texture. The exterior right contour remains the original layer.
const rearOverlap=createCanvas(460,272),rc=rearOverlap.getContext('2d');
rc.save();rc.beginPath();rc.moveTo(274,154);rc.lineTo(344,165);rc.lineTo(374,225);rc.lineTo(330,240);rc.lineTo(270,202);rc.closePath();rc.clip();
rc.drawImage(L.canvas,330,175,28,34,260,145,120,100);rc.restore();
rc.drawImage(L.canvas,0,0);const rearPixels=rc.getImageData(0,0,460,272);lc.putImageData(rearPixels,0,0);
const baseF=base(C),baseL=base(L);
// Extend the rounded front and its painted underside together. Rear hood stays anchored.
for(let frame=0;frame<21;frame++){
 const q=frame/20,shift=20*q,c=createCanvas(W,H),ctx=c.getContext('2d'),out=ctx.createImageData(W,H),inner=ctx.createImageData(W,H);
 inner.data.set(baseL.data);
 if(!frame)out.data.set(baseF.data);
 else for(let x=0;x<W;x++){
  const wx=-23+(x+.5)*106/W;
  if(wx<=8){for(let y=0;y<H;y++){const n=(y*W+x)*4;for(let k=0;k<4;k++)out.data[n+k]=baseF.data[n+k];}continue;}
  const sx=wx>=18+shift?wx-shift:8+(wx-8)*10/(10+shift);
  if(sx>23)continue;
  const cx=(sx+23)*10,u=Math.max(0,Math.min(1,(sx-8)/10)),sway=u*u*(3-2*u),lift=0;
  for(let y=0;y<H;y++){
   const py=(-58.5+(y+.5)*58.5/H+35.5+lift)*10,n=(y*W+x)*4,alpha=sample(C,cx,py,3);
   for(let k=0;k<3;k++)out.data[n+k]=alpha?sample(C,cx,py,k)*255/alpha:0;
   out.data[n+3]=alpha;

  }
 }
 ctx.putImageData(out,0,0);ac.drawImage(c,frame%7*W,Math.floor(frame/7)*H);ctx.putImageData(inner,0,0);ic.drawImage(c,frame%7*W,Math.floor(frame/7)*H);
}
fs.writeFileSync(dir+'/canopy.png',atlas.toBuffer('image/png'));fs.writeFileSync(dir+'/lining.png',innerAtlas.toBuffer('image/png'));
})();
