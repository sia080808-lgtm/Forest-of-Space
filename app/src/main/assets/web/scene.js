'use strict';
class ForestScene {
 constructor(canvas,getState){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.state=getState;this.assets={};this.selected=null;this.editing=false;this.preview={};this.selectedPatch='moss';this.phase=0;this.display={};this.ready=false;this.onSelect=()=>{};this.onMove=()=>{};this.paused=false;this.drag=null;this.last=0;this.resize=new ResizeObserver(()=>this.measure());this.resize.observe(canvas);this.measure();
  canvas.addEventListener('pointerdown',e=>this.down(e));canvas.addEventListener('pointermove',e=>this.move(e));canvas.addEventListener('pointerup',e=>this.up(e));canvas.addEventListener('pointercancel',()=>this.drag=null);
 }
 async load(){await Promise.all(['garden','ridley','terrain'].map(n=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>{this.assets[n]=im;res();};im.onerror=()=>rej(Error('정원 그림을 불러오지 못했어요.'));im.src='assets/forest/'+n+'.png';})));this.ready=true;requestAnimationFrame(t=>this.frame(t));}
 measure(){const r=this.canvas.getBoundingClientRect();this.w=r.width;this.h=r.height;const d=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.max(1,r.width*d);this.canvas.height=Math.max(1,r.height*d);this.ctx.setTransform(d,0,0,d,0,0);}
 point(e){const r=this.canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};}
 down(e){const p=this.point(e),s=this.state();if(this.editing){const found=s.patches.filter(z=>z.id!=='shelter').map(z=>({...z,...this.preview[z.id]})).find(z=>Forest.dist(z,p)<.10);if(found){this.selectedPatch=found.id;this.drag=found.id;this.canvas.setPointerCapture(e.pointerId);this.onMove(found.id,null);}return;}const pet=s.individuals.filter(x=>x.active).find(x=>Forest.dist(x,p)<.09);if(pet)this.onSelect('pet',pet.id);else {const patch=s.patches.find(x=>Forest.dist(x,p)<.10);if(patch)this.onSelect('patch',patch.id);else if(Forest.dist(s.spring,p)<.12)this.onSelect('spring','spring');else this.onSelect(null,null);}}
 move(e){if(this.drag){this.preview[this.drag]=this.point(e);this.onMove(this.drag,this.preview[this.drag]);}}
 up(){this.drag=null;}
 frame(t){requestAnimationFrame(n=>this.frame(n));if(this.paused||!this.ready||!this.w||t-this.last<33)return;this.last=t;this.phase=t/1000;this.draw();}
 terrain(p){const ctx=this.ctx,im=this.assets.terrain;const ix={rock:0,moss:1,shade:2,crevice:3,litter:4}[p.id];if(ix===undefined)return;const size={rock:.28,moss:.3,shade:.34,crevice:.25,litter:.23}[p.id]*this.w;
  const sh=im.height/2,sw=im.width/3;const x=p.x*this.w,y=p.y*this.h;
  if(p.id==='shade'){ctx.fillStyle='#43593615';ctx.beginPath();ctx.ellipse(x,y+3,this.w*.16,this.h*.045,0,0,Math.PI*2);ctx.fill();}
  if(p.id==='moss'&&Forest.moisture(p)>15){ctx.fillStyle=`rgba(70,123,99,${Math.min(.2,Forest.moisture(p)/400)})`;ctx.beginPath();ctx.ellipse(x,y,this.w*.11,this.h*.022,0,0,Math.PI*2);ctx.fill();}
  ctx.drawImage(im,(ix%3)*sw,Math.floor(ix/3)*sh,sw,sh,x-size/2,y-size*.75,size,size);
 }
 draw(){const s=this.state(),c=this.ctx,w=this.w,h=this.h,phase=s.settings.reducedMotion?0:this.phase;
  c.clearRect(0,0,w,h);c.drawImage(this.assets.garden,0,0,w,h);
  const patches=s.patches.map(p=>({...p,...this.preview[p.id]}));patches.sort((a,b)=>a.y-b.y).forEach(p=>this.terrain(p));
  const night=s.settings.theme==='night'||(s.settings.theme==='auto'&&Math.floor(s.worldTick/600)%2===1);
  if(night){c.fillStyle='#142b3866';c.fillRect(0,0,w,h);for(let i=0;i<12;i++){c.fillStyle=`rgba(234,234,163,${.2+.4*Math.abs(Math.sin(phase*.5+i))})`;c.beginPath();c.arc((.08+(i*.073)% .85)*w,(.2+(i*.139)%.7)*h,1.3,0,Math.PI*2);c.fill();}}
  if(s.mode==='game'&&s.weather.kind==='rain'){c.fillStyle='#859ba20d';c.fillRect(0,0,w,h);c.strokeStyle=night?'#d4e5e747':'#8aabb25e';c.lineWidth=.8;const count=s.settings.reducedMotion?8:42;
   for(let i=0;i<count;i++){const x=((i*37.31+phase*12)%100)/100*w,y=((i*19.91+phase*37)%100)/100*h;c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y+12);c.stroke();}}
  // Spring ripple is a visual cue only; supply is the engine's finite reservoir.
  c.strokeStyle='#b3d4dca0';c.lineWidth=1;for(let i=0;i<2;i++){const r=5+((phase*5+i*8)%18);c.beginPath();c.ellipse(.205*w,.733*h,r,r*.35,0,0,Math.PI*2);c.stroke();}
  if(s.neighbor.stage==='visiting'){const p=s.patches.find(x=>x.id==='crevice');const x=(p.x+.04)*w,y=(p.y+.02)*h;c.fillStyle='#777a69';c.beginPath();c.ellipse(x,y,5,3.6,-.2,0,Math.PI*2);c.fill();c.strokeStyle='#a8aa91';for(let i=-2;i<3;i++){c.beginPath();c.moveTo(x+i*1.5,y-2);c.lineTo(x+i*1.5+1,y+2);c.stroke();}}
  for(const p of s.individuals.filter(x=>x.active).sort((a,b)=>a.y-b.y)){const d=this.display[p.id]||(this.display[p.id]={x:p.x,y:p.y});const movement=Math.hypot(d.x-p.x,d.y-p.y);d.x+=(p.x-d.x)*.12;d.y+=(p.y-d.y)*.12;const x=d.x*w,y=d.y*h;const l=Forest.level(p),growth=l>=9?1:l>=6?.9:l>=3?.78:.65;
   const size=72*growth;const bob=s.settings.reducedMotion?0:movement>.001?Math.sin(phase*11)*1.3:Math.sin(phase*1.5)*.35;
   if(this.selected===p.id){c.strokeStyle=night?'#e5e7b5':'#7a8c50';c.lineWidth=1.5;c.fillStyle='#9cac611e';c.beginPath();c.ellipse(x,y-1,23,7,0,0,Math.PI*2);c.fill();c.stroke();}
   c.fillStyle='#484a3320';c.beginPath();c.ellipse(x,y,13*growth,3*growth,0,0,Math.PI*2);c.fill();
   c.save();c.translate(x,y+bob);c.rotate(s.settings.reducedMotion?0:Math.sin(phase*1.3)*.012);if(night)c.filter='brightness(1.2)';c.drawImage(this.assets.ridley,-size/2,-size*.85,size,size);c.restore();
   const b=document.querySelector('[data-pet="'+p.id+'"]');if(b){b.style.left=d.x*100+'%';b.style.top=d.y*100+'%';}
  }
  if(this.editing){for(const p of patches){if(p.id==='shelter')continue;const selected=p.id===this.selectedPatch;c.strokeStyle=selected?'#526443':'#7c866e88';c.fillStyle=selected?'#aab78c28':'#ffffff15';c.lineWidth=selected?2:1;c.setLineDash(selected?[]:[3,4]);c.beginPath();c.ellipse(p.x*w,p.y*h,w*.08,h*.025,0,0,Math.PI*2);c.fill();c.stroke();c.setLineDash([]);c.fillStyle='#fffcf5ee';const textw=c.measureText(p.name).width+16;c.fillRect(p.x*w-textw/2,p.y*h+10,textw,20);c.fillStyle='#43513b';c.font='11px Pretendard';c.textAlign='center';c.fillText(p.name,p.x*w,p.y*h+24);}}
 }
}
