'use strict';
// World gestures have a single owner; camera inputs never change simulation coordinates.
class ForestCarry {
 constructor(world,scene,getState,commit,notice){Object.assign(this,{world,scene,getState,commit,notice});this.pointers=new Map();this.session=null;this.candidate=null;this.blocked=false;this.suppressUntil=0;
  for(const [event,method]of [['pointerdown','down'],['pointermove','move'],['pointerup','up'],['pointercancel','abort']])world.addEventListener(event,e=>this[method](e),true);
  world.addEventListener('lostpointercapture',e=>{if(this.pointers.has(e.pointerId))this.abort(e);});
  /* 1.2.15: a tap on a friend near the bottom opens its card under the finger on pointerup; the click that follows (some WebViews send it to whatever is under the finger, not the captured world) then pressed the card's 자세히 보기 — swallow it on the card too (and the hint that sits in the same spot) */world.addEventListener('click',e=>{if(performance.now()<this.suppressUntil&&(e.target===scene.canvas||e.target.closest('[data-pet],#select-card,#hint'))){e.preventDefault();e.stopImmediatePropagation();}},true);
  document.addEventListener('pointerdown',e=>{if(e.isPrimary===false&&this.pointers.size&&e.target!==scene.canvas&&!e.target.closest('[data-pet]')){this.cancel(false);this.blocked=true;this.start=null;this.pinch=null;this.scene.drag=null;this.suppressUntil=performance.now()+700;}},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')this.cancel();});
 }
 get held(){return this.session?.mode==='drag'?this.session.id:null;}
 clearCandidate(){if(this.candidate){clearTimeout(this.candidate.timer);clearTimeout(this.candidate.feedback);this.candidate.target?.classList.remove('pressing');this.candidate=null;}}
 consume(e){e.preventDefault();e.stopPropagation();this.suppressUntil=performance.now()+700;}
 begin(id,mode='choose',pointer=null){if(this.scene.inputLocked)return;this.cancel(false);const p=this.getState().individuals.find(p=>p.id===id);if(!p||p.mounted)return this.notice('목부작을 마친 뒤 옮길 수 있어요.');
  this.session={id,mode,pointer,origin:{x:p.x,y:p.y},hover:{x:p.x,y:p.y},result:null,started:performance.now(),phaseStart:this.scene.phase};this.scene.carry=this.session;this.scene.onCarry?.(true);this.world.classList.add('carrying');document.getElementById('carry-bar').hidden=false;document.getElementById('carry-message').textContent=mode==='drag'?'발밑 표시를 보며 내려놓아 주세요.':'지도를 살핀 뒤 놓을 자리를 눌러주세요.';
  this.timer=setTimeout(()=>{this.cancel(false);this.blocked=this.pointers.size>0;this.start=null;this.pinch=null;this.suppressUntil=performance.now()+700;this.notice('원래 자리로 돌아왔어요.');},mode==='drag'?5000:30000);
 }
 down(e){const b=e.target.closest('[data-pet]');if(e.target!==this.scene.canvas&&!b)return;
  this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});this.world.setPointerCapture?.(e.pointerId);
  if(this.blocked){this.consume(e);return;}
  if(this.pointers.size>1){this.clearCandidate();if(this.held||this.scene.drag){this.cancel(false);this.scene.drag=null;this.blocked=true;this.consume(e);return;}this.startPinch();this.consume(e);return;}
  this.start={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};
  if(this.held)return;const point=this.scene.point(e);
  if(this.scene.placementGrab?.(point)){this.scene.drag='placement';return;}   /* The placement preview follows the finger. */
  if(this.scene.editing){const p=this.scene.patchAt(point);if(p?.id===this.scene.selectedPatch&&this.scene.handleHit(point,p))this.scene.drag=p.id;return;}
  if(this.session?.mode==='choose')return;
  if(this.scene.inputLocked)return;const pet=b?this.getState().individuals.find(p=>p.id===b.dataset.pet):this.scene.petAt(point);if(!pet)return;
  const c=this.candidate={id:pet.id,target:b};c.feedback=setTimeout(()=>b?.classList.add('pressing'),100);c.timer=setTimeout(()=>{if(this.candidate!==c||this.pointers.size!==1)return;this.clearCandidate();this.begin(c.id,'drag',e.pointerId);this.preview(e);this.suppressUntil=performance.now()+700;},350);
 }
 startPinch(){const pts=[...this.pointers.values()];if(pts.length!==2)return;const r=this.scene.canvas.getBoundingClientRect(),x=(pts[0].x+pts[1].x)/2-r.left,y=(pts[0].y+pts[1].y)/2-r.top;this.pinch={distance:Math.max(1,Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y)),z:this.scene.camera.z,anchor:this.scene.camera.world(x,y)};this.start=null;}
 preview(e){if(!this.session)return;const point=this.scene.point(e),r=this.scene.canvas.getBoundingClientRect();this.session.result=Forest.Space.placement(this.getState(),this.session.id,point);this.session.pointerPoint=point;
  const p=this.getState().individuals.find(p=>p.id===this.session.id),height=this.scene.petSize(p)*this.scene.camera.scale,offset=Math.max(48,height/2+16),x=Math.max(height/2,Math.min(r.width-height/2,e.clientX-r.left)),y=Math.max(height,e.clientY-r.top-offset);
  this.session.hover=this.scene.camera.world(x,y);const q=this.session.result;document.getElementById('carry-message').textContent=q.ok?(q.corrected?'가까운 빈자리로 내려놓아요.':'여기에 내려놓을 수 있어요.'):q.message;
 }
 move(e){if(!this.pointers.has(e.pointerId))return;this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(this.blocked){this.consume(e);return;}
  if(this.held){if(e.pointerId===this.session.pointer)this.preview(e);this.consume(e);return;}
  if(this.pinch){const pts=[...this.pointers.values()];if(pts.length===2){const r=this.scene.canvas.getBoundingClientRect(),dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);this.scene.camera.zoom(this.pinch.z*dist/this.pinch.distance,(pts[0].x+pts[1].x)/2-r.left,(pts[0].y+pts[1].y)/2-r.top,this.pinch.anchor);this.scene.cameraChanged();}this.consume(e);return;}
  const start=this.start;if(!start||start.id!==e.pointerId)return;if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>8){start.moved=true;this.clearCandidate();}
  if(start.moved){if(this.scene.drag==='placement')this.scene.placementDrag(this.scene.point(e));else if(this.scene.drag){this.scene.preview[this.scene.drag]={...this.scene.preview[this.scene.drag],...this.scene.point(e)};this.scene.onMove(this.scene.drag);}else {this.scene.camera.pan(e.clientX-start.lastX,e.clientY-start.lastY);this.scene.cameraChanged();}this.consume(e);}start.lastX=e.clientX;start.lastY=e.clientY;
 }
 up(e){if(!this.pointers.has(e.pointerId))return;this.clearCandidate();const held=this.held,pinch=this.pinch,start=this.start;this.pointers.delete(e.pointerId);
  if(this.blocked||pinch){this.blocked=this.pointers.size>0;this.pinch=null;this.start=null;this.consume(e);}
  else if(held&&this.session.pointer===e.pointerId){this.preview(e);this.finish();this.consume(e);}
  else if(start&&!start.moved&&this.scene.drag!=='placement'){const p=this.scene.point(e);if(this.session?.mode==='choose'){this.preview(e);this.finish();}else if(this.scene.editing)this.scene.selectLayoutAt(p);else if(!this.scene.inputLocked)this.scene.selectAt(p);this.consume(e);}else this.consume(e);
  this.scene.drag=null;this.start=null;this.scene.saveCamera();if(this.world.hasPointerCapture?.(e.pointerId))this.world.releasePointerCapture(e.pointerId);
 }
 finish(){const session=this.session;if(!session)return;const q=session.result;if(q?.ok){const success=this.commit(s=>Forest.relocate(s,session.id,q));if(success)this.scene.landed(session.id);}else this.notice('내려놓을 수 없어 원래 자리를 유지해요.');this.cancel();}
 abort(e){if(this.pointers.has(e.pointerId)){this.pointers.delete(e.pointerId);this.cancel(false);this.blocked=this.pointers.size>0;this.pinch=null;this.start=null;this.scene.drag=null;this.consume(e);}}
 cancel(clearPointers=true){this.clearCandidate();clearTimeout(this.timer);const session=this.session;this.session=null;this.scene.carry=null;this.world.classList.remove('carrying');document.getElementById('carry-bar').hidden=true;if(clearPointers){const ids=[...this.pointers.keys()];this.pointers.clear();this.pinch=null;this.start=null;this.blocked=false;this.scene.drag=null;for(const id of ids)if(this.world.hasPointerCapture?.(id))this.world.releasePointerCapture(id);}if(session)this.scene.onCarry?.(false);}
}
