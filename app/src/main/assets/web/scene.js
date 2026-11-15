'use strict';
class ForestScene {
 constructor(canvas,getState){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.state=getState;this.assets={};this.selected=null;this.editing=false;this.preview={};this.selectedPatch='moss';this.phase=0;this.display={};this.ready=false;this.onSelect=()=>{};this.onMove=()=>{};this.paused=false;this.drag=null;this.last=0;this.resize=new ResizeObserver(()=>this.measure());this.resize.observe(canvas);this.measure();
  let saved;try{saved=JSON.parse(localStorage.getItem('forest-camera-v2'));}catch{}this.camera=new ForestCamera(saved);this.measure();
 }
 async load(){await Promise.all(['garden','ridley','terrain'].map(n=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>{this.assets[n]=im;res();};im.onerror=()=>rej(Error('정원 그림을 불러오지 못했어요.'));im.src='assets/forest/'+(n==='garden'?'garden-dry':n)+'.png';})));this.ready=true;requestAnimationFrame(t=>this.frame(t));}
 measure(){const r=this.canvas.getBoundingClientRect();if(!r.width||!r.height)return;this.vw=r.width;this.vh=r.height;this.w=360;this.h=576;this.camera?.resize(r.width,r.height);const d=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.max(1,r.width*d);this.canvas.height=Math.max(1,r.height*d);this.ctx.setTransform(d,0,0,d,0,0);this.cameraChanged();}
 point(e){const r=this.canvas.getBoundingClientRect();return this.camera.world(e.clientX-r.left,e.clientY-r.top);}
 cameraChanged(){this.onCamera?.(this.camera);}
 saveCamera(){try{localStorage.setItem('forest-camera-v2',JSON.stringify(this.camera.snapshot()));}catch{}}
 petSize(p){const level=Forest.level(p);return 72*(level>=9?1:level>=6?.9:level>=3?.78:.65);}
 petAt(point){return this.state().individuals.filter(p=>p.active).find(p=>Forest.Space.distance(this.display[p.id]||p,point)<.09);}
 patchAt(point){return this.state().patches.filter(p=>p.id!=='shelter').map(p=>({...p,...this.preview[p.id]})).find(p=>Forest.dist(p,point)<.10);}
 handleHit(point,p){const a=this.camera.screen(point),b=this.camera.screen(p);return Math.hypot(a.x-b.x,a.y-b.y)<=24;}
 selectAt(point){const s=this.state(),pet=this.petAt(point);if(pet)return this.onSelect('pet',pet.id);const p=s.patches.find(p=>Forest.dist(p,point)<.1);if(p)this.onSelect('patch',p.id);else if(Forest.dist(s.spring,point)<.12)this.onSelect('spring','spring');else this.onSelect(null,null);}
 springVisible(){const p=this.camera.screen(this.state().spring);return p.x>-30&&p.x<this.vw+30&&p.y>-30&&p.y<this.vh+30;}

 frame(t){requestAnimationFrame(n=>this.frame(n));if(this.paused||!this.ready||!this.w||t-this.last<33)return;this.dt=Math.min(.1,(t-this.last)/1000||.033);this.last=t;this.phase=t/1000;this.draw();}
 landed(id){this.landing={id,until:this.phase+.8};const p=this.state().individuals.find(p=>p.id===id);this.display[id]={x:p.x,y:p.y};}
 terrain(p){const c=this.ctx,im=this.assets.terrain,ix={rock:0,moss:1,shade:2,crevice:3,litter:4}[p.id];if(ix===undefined)return;
  const s=this.state(),size={rock:.28,moss:.3,shade:.34,crevice:.25,litter:.23}[p.id]*this.w,sh=im.height/2,sw=im.width/3,x=p.x*this.w,y=p.y*this.h;
  const wet=Math.max((p.film||0)*.65,Math.max(0,Math.min(1,(Forest.moisture(p)-20)/60))),phase=s.settings.reducedMotion?0:this.phase;
  ForestSurfaces.ground(c,p,x,y,size,wet);
  ForestSurfaces.puddle(c,p,x,y-size*.025,size,phase,s.settings.reducedMotion,s.weather.kind==='rain');
  c.save();c.translate(x,y);if(p.id==='shade'){const max=s.weather.wind>=60?6:s.weather.wind>=40?4:2;c.rotate(Math.sin(phase*1.3+p.x)*max*Math.PI/180);}
  c.filter=`brightness(${1-.18*wet}) saturate(${1+.12*wet})`;c.drawImage(im,(ix%3)*sw,Math.floor(ix/3)*sh,sw,sh,-size/2,-size*.75,size,size);c.restore();

 }
 canopy(p){const c=this.ctx,im=this.assets.terrain,size=.34*this.w,x=p.x*this.w,y=p.y*this.h,s=this.state(),phase=s.settings.reducedMotion?0:this.phase,max=s.weather.wind>=60?6:s.weather.wind>=40?4:2;
  c.save();c.translate(x,y);c.rotate(Math.sin(phase*1.3+p.x)*max*Math.PI/180);c.beginPath();c.rect(-size/2,-size*.75,size,size*.64);c.clip();const wet=Math.max((p.film||0)*.65,Math.max(0,Math.min(1,(Forest.moisture(p)-20)/60)));c.filter=`brightness(${(1-.18*wet)*(1-.32*(this.dark||0))}) saturate(${1+.12*wet})`;c.drawImage(im,im.width*2/3,0,im.width/3,im.height/2,-size/2,-size*.75,size,size);c.restore();
 }
 springFlow(){const s=this.state();ForestSurfaces.spring(this.ctx,s,s.spring.x*this.w+4,s.spring.y*this.h+5,this.phase);}

 drinkContact(p){return p.motion?.kind==='drink'&&p.target==='spring'&&p.motion.water>0;}
 ripples(p,water){const s=this.state();if(water<=0||s.settings.reducedMotion)return;const drinking=s.individuals.some(x=>x.motion?.water>0&&x.target==='spring'&&p===s.spring&&!this.carry);if(s.weather.kind!=='rain'&&!drinking)return;
  const c=this.ctx,w=this.w,h=this.h,phase=this.phase;for(let i=0;i<2;i++){const age=(phase+i*.5)%1,offset=Math.sin(Math.floor(phase+i*.5)*2.7+i)*.028;c.strokeStyle=`rgba(223,237,230,${(1-age)*.6})`;c.lineWidth=.9;c.beginPath();const radius=(.005+.03*age)*w;c.ellipse((p.x+offset)*w,(p.y+.008)*h,radius,radius*.3,0,0,Math.PI*2);c.stroke();}
 }
 pet(p,pos,kind,phase,night,held=false){const c=this.ctx,s=this.state(),level=Forest.level(p),growth=level>=9?1:level>=6?.9:level>=3?.78:.65,size=72*growth,x=pos.x*this.w,y=pos.y*this.h;
  const moving=['walk','slow','hurry','run'].includes(kind),reduced=s.settings.reducedMotion,beat=phase*(kind==='run'?16:kind==='hurry'?12:kind==='slow'?6:9),stride=moving&&!reduced?Math.sin(beat):0;
  if(!held)ForestSurfaces.wash(c,x,y,13*growth,3*growth,'68,61,42',.20,1);
  c.save();c.translate(x,y);c.scale(this.facing?.[p.id]||1,1);const drink=kind==='drink',rest=kind==='rest',groom=kind==='groom',land=kind==='land';
  const heldAge=held?Math.max(0,phase-(this.carry?.phaseStart??phase)):0,wriggleAge=heldAge-.2,wiggle=held&&!reduced&&wriggleAge>=0&&wriggleAge<.8?Math.sin(wriggleAge*Math.PI*5)*Math.sin(wriggleAge*Math.PI/.8):0;
  const bob=reduced?0:moving?-Math.abs(stride)*(kind==='run'?3:1.5):rest?Math.sin(phase*2)*.4:0;
  c.translate(0,bob);if(!reduced)c.rotate(held?wiggle*.08:drink?.1+Math.sin(phase*5)*.06:kind==='run'?.13:groom?Math.sin(phase*3)*.035:stride*.035);
  c.scale(1,land?.97:1);const shade=s.patches.find(z=>z.id==='shade');if(shade&&!held&&Math.abs(pos.x-shade.x)<.09&&Math.abs(pos.y-shade.y)<.04)c.filter='brightness(.86)';else if(night)c.filter='brightness(1.1)';
  const im=this.assets.ridley,draw=()=>c.drawImage(im,-size/2,-size*.85,size,size);
  // Runtime texture rig: original watercolor pixels, anchored feet, body and upper leaves.
  const part=(clip,dx=0,dy=0,angle=0,pivot=[0,0])=>{c.save();c.translate(pivot[0],pivot[1]);c.rotate(angle);c.translate(-pivot[0]+dx,-pivot[1]+dy);c.beginPath();clip();c.clip('evenodd');draw();c.restore();};
  const arm=(right)=>{const ax=(right?.255:-.19)*size,ay=-size*.14;c.moveTo(ax+size*.034,ay);c.ellipse(ax,ay,size*.034,size*.043,right?-.25:.25,0,Math.PI*2);};
  part(()=>{c.rect(-size/2,-size*.46,size,size*.44);if(held){arm(false);arm(true);}});
  if(held){part(()=>arm(false),-Math.abs(wiggle)*size*.012,wiggle*size*.018,-wiggle*.18,[-size*.16,-size*.13]);part(()=>arm(true),Math.abs(wiggle)*size*.012,-wiggle*size*.018,wiggle*.18,[size*.225,-size*.13]);}
  part(()=>c.rect(-size/2,-size*.85,size,size*.40),0,0,reduced?0:Math.sin(phase*2)*.025,[0,-size*.46]);
  part(()=>c.rect(-size*.18,-size*.02,size*.17,size*.2),(stride+wiggle)*1.3,-Math.max(0,stride+wiggle)*2);
  part(()=>c.rect(size*.05,-size*.02,size*.17,size*.2),-(stride+wiggle)*1.3,-Math.max(0,-stride-wiggle)*2);
  if(drink){c.fillStyle='#a8ccd1';c.beginPath();c.arc(size*.04,-size*.17,1.2,0,Math.PI*2);c.fill();}
  c.restore();
 }

 draw(){const s=this.state(),c=this.ctx,w=this.w,h=this.h,phase=s.settings.reducedMotion?0:this.phase;
  if(this.tick!==s.worldTick){this.tick=s.worldTick;this.tickAt=this.phase;}const fraction=Math.min(1,Math.max(0,this.phase-(this.tickAt||this.phase)));
  c.clearRect(0,0,this.vw,this.vh);c.fillStyle='#eee9db';c.fillRect(0,0,this.vw,this.vh);c.save();c.translate(this.camera.tx,this.camera.ty);c.scale(this.camera.scale,this.camera.scale);c.beginPath();c.rect(0,0,w,h);c.clip();c.drawImage(this.assets.garden,0,0,w,h);
  const patches=s.patches.map(p=>({...p,...this.preview[p.id]}));patches.sort((a,b)=>a.y-b.y).forEach(p=>this.terrain(p));
  this.springFlow();
  const night=s.settings.theme==='night'||(s.settings.theme==='auto'&&Math.floor(s.worldTick/600)%2===1);
  this.dark=(this.dark||0)+((night?1:0)-(this.dark||0))*Math.min(1,(this.dt||.033)/2);if(this.dark>.01){c.fillStyle=`rgba(20,43,56,${this.dark*.4})`;c.fillRect(0,0,w,h);for(let i=0;i<6;i++){c.fillStyle=`rgba(234,234,163,${.2+.4*Math.abs(Math.sin(phase*.5+i))})`;c.beginPath();c.arc((i%2?.94:.05)*w,(.2+(i*.139)%.7)*h,1.3,0,Math.PI*2);c.fill();}}
  if(s.weather.kind==='rain'){c.fillStyle='#859ba20d';c.fillRect(0,0,w,h);c.strokeStyle=night?'#d4e5e747':'#8aabb25e';c.lineWidth=.8;const count=s.settings.reducedMotion?8:42;
   for(let i=0;i<count;i++){const x=((i*37.31+phase*12)%100)/100*w,y=((i*19.91+phase*37)%100)/100*h;c.beginPath();c.moveTo(x,y);const covered=s.patches.some(p=>['shade','shelter'].includes(p.id)&&Math.abs(x/w-p.x)<.09&&y/h>p.y-.05&&y/h<p.y+.015);if(!covered){c.lineTo(x-3,y+12);c.stroke();}}}

  if(s.neighbor.stage==='visiting'){const p=s.patches.find(x=>x.id==='crevice');const x=(p.x+.04)*w,y=(p.y+.02)*h;c.fillStyle='#777a69';c.beginPath();c.ellipse(x,y,5,3.6,-.2,0,Math.PI*2);c.fill();c.strokeStyle='#a8aa91';for(let i=-2;i<3;i++){c.beginPath();c.moveTo(x+i*1.5,y-2);c.lineTo(x+i*1.5+1,y+2);c.stroke();}}
  for(const p of s.individuals.filter(x=>x.active).sort((a,b)=>a.y-b.y)){
   const motion=p.motion,path=motion?.path||[p];let pos={x:p.x,y:p.y};
   if(motion?.tick===s.worldTick&&motion.distance>0){let remaining=motion.distance*Math.min(1,fraction/(motion.duration||1));pos={...path[0]};for(let i=1;i<path.length;i++){const d=Forest.Space.distance(path[i-1],path[i]),n=Math.min(d,remaining);if(d)pos={x:path[i-1].x+(path[i].x-path[i-1].x)*n/d,y:path[i-1].y+(path[i].y-path[i-1].y)*n/d};remaining-=n;if(remaining<=0)break;}}
   let kind=motion?.kind||'idle';if(motion?.distance>0&&fraction>=1&&['walk','slow','hurry','run'].includes(kind))kind='idle';if(s.mode!=='game')kind='idle';
   if(this.landing?.id===p.id&&this.landing.until>this.phase)kind='land';
   this.display[p.id]=pos;const carry=this.carry?.id===p.id&&this.carry.mode==='drag';
   if(this.selected===p.id&&!carry){c.strokeStyle=night?'#e5e7b5':'#7a8c50';c.lineWidth=1.5;c.fillStyle='#9cac611e';c.beginPath();c.ellipse(pos.x*w,pos.y*h,23,7,0,0,Math.PI*2);c.fill();c.stroke();}
   this.facing=this.facing||{};if(motion?.path?.length>1){const dx=motion.path.at(-1).x-motion.path[0].x;if(Math.abs(dx)>.001)this.facing[p.id]=dx<0?-1:1;}
   if(!carry)this.pet(p,pos,kind,phase,night,false);
   const b=document.querySelector('[data-pet="'+p.id+'"]');if(b){const point=this.camera.screen(pos),size=this.petSize(p)*this.camera.scale;b.style.left=point.x+'px';b.style.top=point.y+'px';b.style.width=Math.max(48,size*.8)+'px';b.style.height=Math.max(48,size*.9)+'px';b.hidden=carry||point.x<0||point.x>this.vw||point.y<0||point.y>this.vh;}
   if(!carry&&s.mode==='game'&&motion?.tick===s.worldTick&&s.worldTick>(this.silentTick??-1)){const id=p.id+':'+s.worldTick;
    if(this.drinkContact(p)&&fraction>=Math.max(.55,motion.duration||0))this.onMarker?.(id+':water','drink',p.id);
    if(kind==='groom'&&fraction>=.5&&s.worldTick%3===0)this.onMarker?.(id+':groom','groom',p.id);
    if(motion.distance>0&&fraction<1){const step=Math.floor(fraction*(kind==='run'?4:2));const patch=s.patches.find(z=>Forest.dist(z,pos)<.10);const cue=['rock','crevice'].includes(patch?.id)?'stone':patch?.id==='shelter'?'wood':['litter','moss','shade'].includes(patch?.id)?'leaf':'soil';this.onMarker?.(id+':foot:'+step,cue,p.id);}
   }
  }
  for(const p of patches.filter(p=>p.id==='shade'))this.canopy(p);
  if(this.carry){const q=this.carry.result||this.carry.origin,p=q.ok?q:(this.carry.pointerPoint||this.carry.origin);c.strokeStyle=q.ok?'#638361':'#b56950';c.fillStyle=q.ok?'#91ab7926':'#b5695026';c.lineWidth=2;c.setLineDash([4,3]);c.beginPath();c.ellipse(p.x*w,p.y*h,22,8,0,0,Math.PI*2);c.fill();c.stroke();c.setLineDash([]);}
  if(this.carry?.mode==='drag'){const pet=s.individuals.find(p=>p.id===this.carry.id);if(pet)this.pet(pet,this.carry.hover,'held',phase,night,true);}
  if(this.editing){for(const p of patches){if(p.id==='shelter')continue;const selected=p.id===this.selectedPatch;c.strokeStyle=selected?'#526443':'#7c866e88';c.fillStyle=selected?'#aab78c28':'#ffffff15';c.lineWidth=selected?2:1;c.setLineDash(selected?[]:[3,4]);c.beginPath();c.ellipse(p.x*w,p.y*h,w*.08,h*.025,0,0,Math.PI*2);c.fill();c.stroke();c.setLineDash([]);c.fillStyle='#fffcf5ee';const textw=c.measureText(p.name).width+16;c.fillRect(p.x*w-textw/2,p.y*h+10,textw,20);c.fillStyle='#43513b';c.font=(11/this.camera.scale)+'px Pretendard';c.textAlign='center';c.fillText(p.name,p.x*w,p.y*h+24);if(selected){c.fillStyle='#526443';c.beginPath();c.arc(p.x*w,p.y*h,6/this.camera.scale,0,Math.PI*2);c.fill();}}}
  c.restore();
 }
}
