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
const cache=new WeakMap(),tearPoints=new WeakMap(),MAX_SIDE=256;
const make=(w,h)=>{
 const cv=typeof document==='undefined'?require('@napi-rs/canvas').createCanvas(w,h):document.createElement('canvas');
 cv.width=w;cv.height=h;return cv;
};
function layerPixels(canvas,full,recolor,split,topLeaf,fade,preserveWater){
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 const src=c.getImageData(0,0,w,h),leaf=split?make(w,h):canvas,lc=leaf.getContext('2d');
 const art=split?lc.createImageData(w,h):src;
 for(let y=0,i=0;y<h;y++)for(let x=0;x<w;x++,i+=4){
  const r=src.data[i],g=src.data[i+1],b=src.data[i+2],a=src.data[i+3];
  // Maria's olive leaves can overlap the face along a curve. Use the
  // source palette through that whole curve instead of rectangular exclusions.
  const isLeaf=a>0&&(!full||y/h<topLeaf||(g>=96&&2*g-r-b>=14));
  if(!isLeaf)continue;
  if(split){
   art.data[i]=r;art.data[i+1]=g;art.data[i+2]=b;art.data[i+3]=a;
   src.data[i+3]=0;
  }
  if(recolor){
   const light=Math.min(1,(r+g+b)/720),tone=206+Math.round(light*41);
   // The wet crown combines teal water and olive foliage in one image.
   // Leave the water and its highlights out of the bleach.
   const leafDye=preserveWater?smooth((g-b-47)/12):1;
   const amount=leafDye*(fade?smooth((1-(y+.5)/h)/fade):1);
   art.data[i]=r+(Math.min(255,tone+12)-r)*amount;art.data[i+1]=g+(tone+5-g)*amount;art.data[i+2]=b+(tone-17-b)*amount;
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
 return [[x-side*reach*.32,y-gap*.55],[x-side*reach*.25,y+gap*1.08]];
}
// Normalized coordinates in each source layer. The middle range stays on the
// head. Only free edges and the portion above a stem's hinge can bend.
const wiltShapes={
 ridley:{base:[.33,.59],tips:[.20,.80],drop:[.16,.25],stem:[.45,.24,.085]},
 neolbiFront:{base:[.45,.70],tips:[.12,.89],drop:[.18,.24]},
 neolbiRear:{base:[.40,.73],tips:[.06,.79],drop:[.21,.03],stem:[.32,.14,-.037]},
 neolbiOpen:{base:[.45,.69],tips:[.08,.91],drop:[.16,.18]},
 jureong:{base:[.34,.55],tips:[.03,.98],drop:[.27,.29],sag:[.44,.17,.12]},
 superbumCrown:{base:[.35,.65],tips:[.04,.95],drop:[.22,.24],stem:[.49,.23,.025]},
 'skirt-left':{base:[.25,.37],tips:[.08,.36],drop:[.24,0],sag:[.57,.13,.07]},
 'skirt-right':{base:[.63,.74],tips:[.63,.93],drop:[0,.24],sag:[.57,.13,.07]},
 bosong:{base:[.38,.57],tips:[.06,.95],drop:[.18,.20],stem:[.49,.24,-.125]},
 maria:{base:[.44,.59],tips:[.06,.96],drop:[.25,.20],stem:[.46,.20,.04],sag:[.45,.15,.15],topLeaf:.37},
 dico:{base:[.37,.62],tips:[.19,.89],drop:[.19,.23],stem:[.86,.18,.073],paleFade:.22},
 dicoYoung:{base:[.36,.62],tips:[.20,.79],drop:[.14,.18],stem:[.84,.20,.095],paleFade:.22}
};
const smooth=x=>{const u=Math.max(0,Math.min(1,x));return u*u*(3-2*u);};
function wilt(canvas,leaf,shape,points){
 const w=leaf.width,h=leaf.height,c=canvas.getContext('2d');
 const src=leaf.getContext('2d').getImageData(0,0,w,h).data,out=c.createImageData(w,h);
 const [hinge,fold,lean]=shape.stem||[0,0,0], [start,fall,pinch]=shape.sag||[1,0,0];
 const yAt=y=>y+(y<hinge?fold*(hinge-y)**2/hinge:0)+(y>start?fall*(y-start)*(1-y):0);
 const top=yAt(0);
 // Invert the stem and lower-leaf bend once per row. The sideways tip drop
 // samples between these rows, avoiding the gaps of separately drawn strips.
 const rows=Array.from({length:h+1},(_,i)=>{
  const target=i/h;let lo=0,hi=1;
  if(target<=top)return 0;
  if(!fold&&!fall)return target;
  for(let j=0;j<14;j++){const y=(lo+hi)/2;if(yAt(y)<target)lo=y;else hi=y;}
  return (lo+hi)/2;
 });
 const [left,right]=shape.base,[lTip,rTip]=shape.tips,[lDrop,rDrop]=shape.drop;
 const dropAt=u=>u<left?lDrop*smooth((left-u)/(left-lTip||1)):rDrop*smooth((u-right)/(rTip-right||1));
 for(let x=0;x<w;x++){
  const u=(x+.5)/w,drop=dropAt(u);
  for(let y=0;y<h;y++){
   const target=((y+.5)/h-drop)/(1-drop);
   if(target<top)continue;
   const row=target*h,inRow=Math.floor(row),blend=row-inRow;
   const sy=rows[inRow]*(1-blend)+rows[inRow+1]*blend;
   const shift=lean*smooth((hinge-sy)/(hinge||1)),inset=pinch*smooth((sy-start)/(1-start||1));
   const sx=(u-shift-inset)/(1-2*inset);
   interpolate(src,out.data,w,h,sx*w-.5,sy*h-.5,(y*w+x)*4);
  }
 }
 // The output is an independently warped leaf overlay. The original body
 // pixels of a flat sprite remain beneath it.
 const bent=make(w,h);bent.getContext('2d').putImageData(out,0,0);c.drawImage(bent,0,0);
 return points?.map(([x,y])=>{
  const v=y/h,inset=pinch*smooth((v-start)/(1-start||1));
  const u=x/w*(1-2*inset)+lean*smooth((hinge-v)/(hinge||1))+inset;
  const drop=dropAt(u);
  return [u*w,(yAt(v)*(1-drop)+drop)*h];
 });
}
function interpolate(src,dst,w,h,x,y,to){
 const x0=Math.floor(x),y0=Math.floor(y),rx=x-x0,ry=y-y0;
 let red=0,green=0,blue=0,alpha=0;
 for(let dy=0;dy<=1;dy++)for(let dx=0;dx<=1;dx++){
  const px=x0+dx,py=y0+dy;
  if(px<0||px>=w||py<0||py>=h)continue;
  const from=(py*w+px)*4,weight=(dx?rx:1-rx)*(dy?ry:1-ry)*src[from+3];
  alpha+=weight;red+=weight*src[from];green+=weight*src[from+1];blue+=weight*src[from+2];
 }
 if(alpha){dst[to]=red/alpha;dst[to+1]=green/alpha;dst[to+2]=blue/alpha;dst[to+3]=alpha;}
}
const options={
 ridley:[-1,.23,.30],maria:[1,.23,.34],dico:[1,.37,.20],dicoYoung:[-1,.34,.20],
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
 const w=canvas.width,h=canvas.height,wetCrown=key==='superbumWetCrown',leafKey=wetCrown?'superbumCrown':key;
 const shape=wiltShapes[leafKey],full=shape?.topLeaf!=null,dry=!!(state&DRY)&&!!shape;
 c.drawImage(src,...r,0,0,w,h);
 const apart=full||dry;
 const leaf=apart||state&PALE?layerPixels(canvas,full,!!(state&PALE),apart,dry?shape.topLeaf:0,shape?.paleFade,wetCrown):canvas;
 let points=state&TORN&&options[leafKey]?tear(leaf,...options[leafKey]):null;
 if(apart){
  if(dry)points=wilt(canvas,leaf,shape,points);
  else c.drawImage(leaf,0,0);
 }
 if(points)tearPoints.set(canvas,points.map(([x,y])=>[x/w,y/h]));
 entries.set(id,canvas);
 // Canopy sheets share an image across 21 frames; keep the small cache bounded even with all combinations.
 if(entries.size>48)entries.delete(entries.keys().next().value);
 return canvas;
}
function markTear(c,im,x,y,w,h){
 const points=c.onLeafTear&&tearPoints.get(im);
 if(points)c.onLeafTear(points.map(([u,v])=>[x+u*w,y+v*h]));
}
function draw(c,src,key,state,x,y,w=src?.width,h=src?.height){
 if(!src)return;
 const im=texture(src,key,state);c.drawImage(im,x,y,w,h);
 markTear(c,im,x,y,w,h);
}
return Object.freeze({DRY,PALE,TORN,DAMAGE_ON,DAMAGE_OFF,flags,update,texture,markTear,draw});
});
