(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestLeafState=api;})(globalThis,function(){
'use strict';
const V=()=>typeof module==='object'?require('./vitals.js'):globalThis.ForestVitals;
const DRY=1,PALE=2,TORN=4;
const DAMAGE_ON=5,DAMAGE_OFF=4;

function flags(p){
 const fit=V().band(p),damage=p.damage||0;
 return (p.B<fit.lo?DRY:0)|(p.nutrition<fit.lo?PALE:0)|
  (damage>=DAMAGE_ON||p.tornLeaves&&damage>=DAMAGE_OFF?TORN:0);
}
function update(p){
 if((p.damage||0)>=DAMAGE_ON)p.tornLeaves=true;
 else if((p.damage||0)<DAMAGE_OFF)delete p.tornLeaves;
}

// A small raster is painted once per leaf layer and condition, then reused by the animated rig.
const cache=new WeakMap(),MAX_SIDE=256;
const make=(w,h)=>{
 const cv=typeof document==='undefined'?require('@napi-rs/canvas').createCanvas(w,h):document.createElement('canvas');
 cv.width=w;cv.height=h;return cv;
};
function layerPixels(canvas,full,recolor,split){
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 const src=c.getImageData(0,0,w,h),leaf=split?make(w,h):canvas,lc=leaf.getContext('2d');
 const art=split?lc.createImageData(w,h):src;
 for(let y=0,i=0;y<h;y++)for(let x=0;x<w;x++,i+=4){
  const r=src.data[i],g=src.data[i+1],b=src.data[i+2],a=src.data[i+3];
  const isLeaf=a>0&&(!full||(g>=113&&g-b>=9&&r-g<48&&(y/h<.59||x/w<.32||x/w>.73)));
  if(!isLeaf)continue;
  if(split){
   art.data[i]=r;art.data[i+1]=g;art.data[i+2]=b;art.data[i+3]=a;
   src.data[i+3]=0;
  }
  if(recolor){
   const light=Math.min(1,(r+g+b)/720),tone=206+Math.round(light*41);
   art.data[i]=Math.min(255,tone+12);art.data[i+1]=tone+5;art.data[i+2]=tone-17;
  }
 }
 if(split)c.putImageData(src,0,0);
 lc.putImageData(art,0,0);
 return leaf;
}
function tear(canvas,side,at,depth){
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,d=c.getImageData(0,0,w,h).data;
 let x0=w,y0=h,x1=-1,y1=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>175){
  x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
 }
 if(x1<x0||y1<y0)return;
 const width=x1-x0+1,height=y1-y0+1,y=Math.round(y0+height*at);
 const from=side>0?x1:x0,to=side>0?x0:x1;
 let x=from;
 while(d[(y*w+x)*4+3]<175&&x!==to)x-=side;
 if(d[(y*w+x)*4+3]<175)return;
 // The cut starts beyond the entire outline and tapers toward the vein, so it
 // always opens at the leaf edge and can never become a hole in the head.
 const outer=from+side*5,reach=Math.min(width*depth,Math.abs(from-to)*.48),gap=Math.max(4,height*.115);
 c.save();c.globalCompositeOperation='destination-out';c.beginPath();
 c.moveTo(outer,y-gap*2);
 c.lineTo(x+side*gap,y-gap);
 c.quadraticCurveTo(x-side*reach*.28,y-gap*.75,x-side*reach,y+gap*.52);
 c.quadraticCurveTo(x-side*reach*.44,y+gap*.37,x-side*reach*.32,y+gap*.92);
 c.quadraticCurveTo(x+side*gap*.4,y+gap*1.22,outer,y+gap*2.3);
 c.closePath();c.fill();c.restore();
}
function wilt(canvas,leaf,full){
 const w=leaf.width,h=leaf.height,c=canvas.getContext('2d');
 const anchor=h*(full?.48:.65),step=Math.max(1,Math.ceil(h/48));
 for(let y=0;y<h;y+=step){
  const n=Math.min(step,h-y),top=y+Math.max(0,anchor-y)*.42,bottom=y+n+Math.max(0,anchor-y-n)*.42;
  c.drawImage(leaf,0,y,w,n,0,top,w,bottom-top+.16);
 }
}
const options={
 ridley:[-1,.23,.30],maria:[1,.23,.34],dico:[1,.26,.37],
 ellisiiFronds:[-1,.28,.36],ellisiiFrondLeft:[-1,.27,.39],ellisiiFrondRight:[1,.28,.34],
 neolbiRear:[-1,.49,.35],neolbiFront:[-1,.67,.22],neolbiOpen:[-1,.49,.26],
 superbumCrown:[1,.29,.35],bosong:[1,.22,.39],jureong:[1,.77,.31]
};
function texture(src,key,state,rect){
 if(!src||!state)return src;
 const id=key+'|'+state+(rect?'|'+rect.join(','):'');
 let entries=cache.get(src);if(!entries){entries=new Map();cache.set(src,entries);}
 if(entries.has(id))return entries.get(id);
 const r=rect||[0,0,src.width,src.height],k=Math.min(1,MAX_SIDE/Math.max(r[2],r[3]));
 const canvas=make(Math.max(1,Math.round(r[2]*k)),Math.max(1,Math.round(r[3]*k))),c=canvas.getContext('2d');
 const w=canvas.width,h=canvas.height,full=key==='maria'||key==='dico';
 c.drawImage(src,...r,0,0,w,h);
 const apart=full||!!(state&DRY);
 const leaf=apart||state&PALE?layerPixels(canvas,full,!!(state&PALE),apart):canvas;
 if(state&TORN&&options[key])tear(leaf,...options[key]);
 if(apart){
  if(state&DRY)wilt(canvas,leaf,full);
  else c.drawImage(leaf,0,0);
 }
 entries.set(id,canvas);
 // Canopy sheets share an image across 21 frames; keep the small cache bounded even with all combinations.
 if(entries.size>48)entries.delete(entries.keys().next().value);
 return canvas;
}
function draw(c,src,key,state,x,y,w=src?.width,h=src?.height){
 if(!src)return;
 c.drawImage(texture(src,key,state),x,y,w,h);
}
return Object.freeze({DRY,PALE,TORN,DAMAGE_ON,DAMAGE_OFF,flags,update,texture,draw});
});
