'use strict';
class ForestScene {
 constructor(canvas,getState){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.state=getState;this.assets={};this.selected=null;this.editing=false;this.preview={};this.selectedPatch='moss';this.phase=0;this.display={};this.ready=false;this.onSelect=()=>{};this.onMove=()=>{};this.paused=false;this.drag=null;this.last=0;this.resize=new ResizeObserver(()=>this.measure());this.resize.observe(canvas);this.measure();
  canvas.addEventListener('pointerdown',e=>this.down(e));canvas.addEventListener('pointermove',e=>this.move(e));canvas.addEventListener('pointerup',e=>this.up(e));canvas.addEventListener('pointercancel',()=>this.drag=null);
 }
 async load(){await Promise.all(['garden','ridley','terrain'].map(n=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>{this.assets[n]=im;res();};im.onerror=()=>rej(Error('정원 그림을 불러오지 못했어요.'));im.src='assets/forest/'+n+'.png';})));this.ready=true;requestAnimationFrame(t=>this.frame(t));}
 measure(){const r=this.canvas.getBoundingClientRect();this.w=r.width;this.h=r.height;const d=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.max(1,r.width*d);this.canvas.height=Math.max(1,r.height*d);this.ctx.setTransform(d,0,0,d,0,0);}
 point(e){const r=this.canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};}
 down(e){if(e.defaultPrevented)return;const p=this.point(e),s=this.state();if(this.editing){const found=s.patches.filter(z=>z.id!=='shelter').map(z=>({...z,...this.preview[z.id]})).find(z=>Forest.dist(z,p)<.10);if(found){this.selectedPatch=found.id;this.drag=found.id;this.canvas.setPointerCapture(e.pointerId);this.onMove(found.id,null);}return;}const pet=s.individuals.filter(x=>x.active).find(x=>Forest.dist(x,p)<.09);if(pet)this.onSelect('pet',pet.id);else {const patch=s.patches.find(x=>Forest.dist(x,p)<.10);if(patch)this.onSelect('patch',patch.id);else if(Forest.dist(s.spring,p)<.12)this.onSelect('spring','spring');else this.onSelect(null,null);}}
 move(e){if(this.drag){this.preview[this.drag]=this.point(e);this.onMove(this.drag,this.preview[this.drag]);}}
 up(){this.drag=null;}
 frame(t){requestAnimationFrame(n=>this.frame(n));if(this.paused||!this.ready||!this.w||t-this.last<33)return;this.dt=Math.min(.1,(t-this.last)/1000||.033);this.last=t;this.phase=t/1000;this.draw();}
 landed(id){this.landing={id,until:this.phase+.8};const p=this.state().individuals.find(p=>p.id===id);this.display[id]={x:p.x,y:p.y};}
 terrain(p){const c=this.ctx,im=this.assets.terrain,ix={rock:0,moss:1,shade:2,crevice:3,litter:4}[p.id];if(ix===undefined)return;
  const s=this.state(),size={rock:.28,moss:.3,shade:.34,crevice:.25,litter:.23}[p.id]*this.w,sh=im.height/2,sw=im.width/3,x=p.x*this.w,y=p.y*this.h;
  const wet=Math.max((p.film||0)*.65,Math.max(0,Math.min(1,(Forest.moisture(p)-20)/60))),phase=s.settings.reducedMotion?0:this.phase;
  if(p.id==='shade'){c.fillStyle='#43593619';c.beginPath();c.ellipse(x,y+3,this.w*.16,this.h*.045,0,0,Math.PI*2);c.fill();}
  // Fixed surface marks are driven by saved moisture, never by simulation RNG.
  for(let i=0;i<7;i++){const threshold=i/9;if(wet<=threshold)continue;c.fillStyle=`rgba(73,94,78,${Math.min(.18,(wet-threshold)*.2)})`;c.beginPath();c.ellipse(x+Math.sin(i*4.3)*size*.20,y+Math.cos(i*3.1)*size*.035,size*(.12+i*.014),size*.035,i*.3,0,Math.PI*2);c.fill();}
  c.save();c.translate(x,y);if(p.id==='shade'){const max=s.weather.wind>=60?6:s.weather.wind>=40?4:2;c.rotate(Math.sin(phase*1.3+p.x)*max*Math.PI/180);}
  c.filter=`brightness(${1-.18*wet}) saturate(${1+.12*wet})`;c.drawImage(im,(ix%3)*sw,Math.floor(ix/3)*sh,sw,sh,-size/2,-size*.75,size,size);c.restore();
  if(p.W>.01){c.fillStyle=`rgba(126,170,177,${.08+Math.min(.25,p.W/p.pool*.25)})`;c.beginPath();c.ellipse(x,y+3,size*.22,size*.04,0,0,Math.PI*2);c.fill();this.ripples(p,p.W);}
 }
 ripples(p,water){const s=this.state();if(water<=0||s.settings.reducedMotion)return;const drinking=s.individuals.some(x=>x.motion?.water>0&&x.target==='spring'&&p===s.spring&&!this.carry);if(s.weather.kind!=='rain'&&!drinking)return;
  const c=this.ctx,w=this.w,h=this.h,phase=this.phase;for(let i=0;i<2;i++){const age=(phase+i*.5)%1,offset=Math.sin(Math.floor(phase+i*.5)*2.7+i)*.028;c.strokeStyle=`rgba(223,237,230,${(1-age)*.6})`;c.lineWidth=.9;c.beginPath();const radius=(.005+.03*age)*w;c.ellipse((p.x+offset)*w,(p.y+.008)*h,radius,radius*.3,0,0,Math.PI*2);c.stroke();}
 }
 pet(p,pos,kind,phase,night,held=false){const c=this.ctx,s=this.state(),level=Forest.level(p),growth=level>=9?1:level>=6?.9:level>=3?.78:.65,size=72*growth,x=pos.x*this.w,y=pos.y*this.h;
  const moving=['walk','slow','hurry','run'].includes(kind),reduced=s.settings.reducedMotion,beat=phase*(kind==='run'?16:kind==='hurry'?12:kind==='slow'?6:9),stride=moving&&!reduced?Math.sin(beat):0;
  if(!held){c.fillStyle='#484a3328';c.beginPath();c.ellipse(x,y,13*growth,3*growth,0,0,Math.PI*2);c.fill();}
  c.save();c.translate(x,y);c.scale(this.facing?.[p.id]||1,1);const drink=kind==='drink',rest=kind==='rest',groom=kind==='groom',land=kind==='land';
  const bob=reduced?0:moving?-Math.abs(stride)*(kind==='run'?3:1.5):rest?Math.sin(phase*2)*.4:0;
  c.translate(0,bob);if(!reduced)c.rotate(drink?.1+Math.sin(phase*5)*.06:kind==='run'?.13:stride*.035);
  c.scale(1,rest?.84:land?.94:1);if(night)c.filter='brightness(1.1)';
  const im=this.assets.ridley,draw=()=>c.drawImage(im,-size/2,-size*.85,size,size);
  // Runtime texture rig: original watercolor pixels, anchored feet, body and upper leaves.
  const part=(clip,dx=0,dy=0,angle=0,pivot=[0,0])=>{c.save();c.translate(pivot[0],pivot[1]);c.rotate(angle);c.translate(-pivot[0]+dx,-pivot[1]+dy);c.beginPath();clip();c.clip();draw();c.restore();};
  part(()=>c.rect(-size/2,-size*.46,size,size*.44));
  part(()=>c.rect(-size/2,-size*.85,size,size*.40),0,0,reduced?0:Math.sin(phase*2)*.025,[0,-size*.46]);
  part(()=>c.rect(-size*.18,-size*.02,size*.17,size*.2),stride*1.3,-Math.max(0,stride)*2);
  part(()=>c.rect(size*.05,-size*.02,size*.17,size*.2),-stride*1.3,-Math.max(0,-stride)*2);
  if(groom&&!reduced){c.save();c.translate(size*.25,-size*.25);c.rotate(-.8-Math.sin(phase*5)*.2);c.drawImage(im,925,847,85,110,-size*.035,-size*.10,size*.07,size*.09);c.restore();}
  if(drink){c.fillStyle='#a8ccd1';c.beginPath();c.arc(size*.04,-size*.17,1.2,0,Math.PI*2);c.fill();}
  if(rest){c.strokeStyle='#efe3c7';c.lineWidth=1.4;c.beginPath();c.moveTo(-size*.06,-size*.23);c.lineTo(-size*.015,-size*.23);c.moveTo(size*.07,-size*.23);c.lineTo(size*.115,-size*.23);c.stroke();}
  c.restore();
 }

 draw(){const s=this.state(),c=this.ctx,w=this.w,h=this.h,phase=s.settings.reducedMotion?0:this.phase;
  if(this.tick!==s.worldTick){this.tick=s.worldTick;this.tickAt=this.phase;}const fraction=Math.min(1,Math.max(0,this.phase-(this.tickAt||this.phase)));
  c.clearRect(0,0,w,h);c.drawImage(this.assets.garden,0,0,w,h);
  const patches=s.patches.map(p=>({...p,...this.preview[p.id]}));patches.sort((a,b)=>a.y-b.y).forEach(p=>this.terrain(p));
  const night=s.settings.theme==='night'||(s.settings.theme==='auto'&&Math.floor(s.worldTick/600)%2===1);
  this.dark=(this.dark||0)+((night?1:0)-(this.dark||0))*Math.min(1,(this.dt||.033)/2);if(this.dark>.01){c.fillStyle=`rgba(20,43,56,${this.dark*.4})`;c.fillRect(0,0,w,h);for(let i=0;i<6;i++){c.fillStyle=`rgba(234,234,163,${.2+.4*Math.abs(Math.sin(phase*.5+i))})`;c.beginPath();c.arc((i%2?.94:.05)*w,(.2+(i*.139)%.7)*h,1.3,0,Math.PI*2);c.fill();}}
  if(s.weather.kind==='rain'){c.fillStyle='#859ba20d';c.fillRect(0,0,w,h);c.strokeStyle=night?'#d4e5e747':'#8aabb25e';c.lineWidth=.8;const count=s.settings.reducedMotion?8:42;
   for(let i=0;i<count;i++){const x=((i*37.31+phase*12)%100)/100*w,y=((i*19.91+phase*37)%100)/100*h;c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y+12);c.stroke();}}
  this.ripples(s.spring,s.spring.water);
  if(s.neighbor.stage==='visiting'){const p=s.patches.find(x=>x.id==='crevice');const x=(p.x+.04)*w,y=(p.y+.02)*h;c.fillStyle='#777a69';c.beginPath();c.ellipse(x,y,5,3.6,-.2,0,Math.PI*2);c.fill();c.strokeStyle='#a8aa91';for(let i=-2;i<3;i++){c.beginPath();c.moveTo(x+i*1.5,y-2);c.lineTo(x+i*1.5+1,y+2);c.stroke();}}
  for(const p of s.individuals.filter(x=>x.active).sort((a,b)=>a.y-b.y)){
   const motion=p.motion,path=motion?.path||[p];let pos={x:p.x,y:p.y};
   if(motion?.tick===s.worldTick&&motion.distance>0){let remaining=motion.distance*Math.min(1,fraction/(motion.duration||1));pos={...path[0]};for(let i=1;i<path.length;i++){const d=Forest.Space.distance(path[i-1],path[i]),n=Math.min(d,remaining);if(d)pos={x:path[i-1].x+(path[i].x-path[i-1].x)*n/d,y:path[i-1].y+(path[i].y-path[i-1].y)*n/d};remaining-=n;if(remaining<=0)break;}}
   let kind=motion?.kind||'idle';if(motion?.distance>0&&fraction>=1&&['walk','slow','hurry','run'].includes(kind))kind='idle';if(s.mode!=='game')kind='idle';
   if(this.landing?.id===p.id&&this.landing.until>this.phase)kind='land';
   this.display[p.id]=pos;const carry=this.carry?.id===p.id&&this.carry.mode==='drag';
   if(this.selected===p.id&&!carry){c.strokeStyle=night?'#e5e7b5':'#7a8c50';c.lineWidth=1.5;c.fillStyle='#9cac611e';c.beginPath();c.ellipse(pos.x*w,pos.y*h,23,7,0,0,Math.PI*2);c.fill();c.stroke();}
   this.facing=this.facing||{};if(motion?.path?.length>1){const dx=motion.path.at(-1).x-motion.path[0].x;if(Math.abs(dx)>.001)this.facing[p.id]=dx<0?-1:1;}
   this.pet(p,carry?this.carry.hover:pos,carry?'held':kind,phase,night,carry);
   const b=document.querySelector('[data-pet="'+p.id+'"]');if(b){b.style.left=pos.x*100+'%';b.style.top=pos.y*100+'%';b.hidden=carry;}
   if(!carry&&s.mode==='game'&&motion?.tick===s.worldTick&&s.worldTick>(this.silentTick??-1)){const id=p.id+':'+s.worldTick;
    if(motion.water>0&&fraction>=Math.max(.55,motion.duration||0))this.onMarker?.(id+':water','drink',p.id);
    if(kind==='groom'&&fraction>=.5&&s.worldTick%3===0)this.onMarker?.(id+':groom','groom',p.id);
    if(motion.distance>0&&fraction<1){const step=Math.floor(fraction*(kind==='run'?4:2));const patch=s.patches.find(z=>Forest.dist(z,pos)<.10);const cue=['rock','crevice'].includes(patch?.id)?'stone':patch?.id==='shelter'?'wood':['litter','moss','shade'].includes(patch?.id)?'leaf':'soil';this.onMarker?.(id+':foot:'+step,cue,p.id);}
   }
  }
  if(this.carry){const q=this.carry.result||this.carry.origin,p=q.ok?q:this.carry.hover;c.strokeStyle=q.ok?'#638361':'#b56950';c.fillStyle=q.ok?'#91ab7926':'#b5695026';c.lineWidth=2;c.setLineDash([4,3]);c.beginPath();c.ellipse(p.x*w,p.y*h,22,8,0,0,Math.PI*2);c.fill();c.stroke();c.setLineDash([]);}
  if(this.editing){for(const p of patches){if(p.id==='shelter')continue;const selected=p.id===this.selectedPatch;c.strokeStyle=selected?'#526443':'#7c866e88';c.fillStyle=selected?'#aab78c28':'#ffffff15';c.lineWidth=selected?2:1;c.setLineDash(selected?[]:[3,4]);c.beginPath();c.ellipse(p.x*w,p.y*h,w*.08,h*.025,0,0,Math.PI*2);c.fill();c.stroke();c.setLineDash([]);c.fillStyle='#fffcf5ee';const textw=c.measureText(p.name).width+16;c.fillRect(p.x*w-textw/2,p.y*h+10,textw,20);c.fillStyle='#43513b';c.font='11px Pretendard';c.textAlign='center';c.fillText(p.name,p.x*w,p.y*h+24);}}
 }
}
