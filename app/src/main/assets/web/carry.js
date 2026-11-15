'use strict';
class ForestCarry {
 constructor(world,scene,getState,commit,notice){Object.assign(this,{world,scene,getState,commit,notice});this.session=null;this.candidate=null;this.suppress=false;
  world.addEventListener('pointerdown',e=>this.down(e),true);world.addEventListener('pointermove',e=>this.move(e),true);world.addEventListener('pointerup',e=>this.up(e),true);world.addEventListener('pointercancel',()=>this.cancel());world.addEventListener('lostpointercapture',()=>{if(this.session?.mode==='drag')this.cancel();});
  world.addEventListener('click',e=>{if(this.suppress){e.preventDefault();e.stopImmediatePropagation();this.suppress=false;}},true);
  document.addEventListener('pointerdown',e=>{if(e.isPrimary===false)this.cancel();},true);document.addEventListener('keydown',e=>{if(e.key==='Escape')this.cancel();});
 }
 get held(){return this.session?.mode==='drag'?this.session.id:null;}
 clearCandidate(){if(this.candidate){clearTimeout(this.candidate.timer);clearTimeout(this.candidate.feedback);this.candidate.target.classList.remove('pressing');this.candidate=null;}}
 begin(id,mode='choose',pointer=null){this.cancel();const p=this.getState().individuals.find(p=>p.id===id);if(!p||p.mounted)return this.notice('목부작을 마친 뒤 옮길 수 있어요.');
  this.session={id,mode,pointer,origin:{x:p.x,y:p.y},hover:{x:p.x,y:p.y},result:null};this.scene.carry=this.session;this.scene.onCarry?.(true);this.world.classList.add('carrying');document.getElementById('carry-bar').hidden=false;document.getElementById('carry-message').textContent=mode==='drag'?'발밑 표시를 보며 내려놓아 주세요.':'친구를 놓을 자리를 눌러주세요.';
  this.timer=setTimeout(()=>{this.cancel();this.notice('원래 자리로 돌아왔어요.');},mode==='drag'?5000:30000);
 }
 down(e){if(e.isPrimary===false)return;const b=e.target.closest('[data-pet]');
  if(this.session){if(e.target===this.scene.canvas||b){e.preventDefault();e.stopPropagation();if(this.session.mode==='choose'){this.preview(e,false);this.finish();this.suppress=true;}}return;}
  if(!b||this.scene.editing)return;this.clearCandidate();const c=this.candidate={id:b.dataset.pet,x:e.clientX,y:e.clientY,target:b,pointer:e.pointerId};
  c.feedback=setTimeout(()=>b.classList.add('pressing'),100);c.timer=setTimeout(()=>{if(this.candidate!==c)return;this.clearCandidate();this.begin(c.id,'drag',c.pointer);this.world.setPointerCapture(c.pointer);this.preview(e,true);this.suppress=true;},350);
 }
 preview(e,offset){if(!this.session)return;const r=this.scene.canvas.getBoundingClientRect(),p={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top-(offset?44:0))/r.height};this.session.hover=p;this.session.result=Forest.Space.placement(this.getState(),this.session.id,p);const q=this.session.result;document.getElementById('carry-message').textContent=q.ok?(q.corrected?'가까운 빈자리로 내려놓아요.':'여기에 내려놓을 수 있어요.'):q.message;}
 move(e){if(this.candidate&&Math.hypot(e.clientX-this.candidate.x,e.clientY-this.candidate.y)>8)this.clearCandidate();if(this.session?.mode==='drag'&&e.pointerId===this.session.pointer){e.preventDefault();this.preview(e,true);}}
 up(e){this.clearCandidate();if(this.session?.mode==='drag'&&e.pointerId===this.session.pointer){e.preventDefault();this.preview(e,true);this.finish();this.suppress=true;}}
 finish(){const session=this.session;if(!session)return;const q=session.result;if(q?.ok){const success=this.commit(s=>Forest.relocate(s,session.id,q));if(success)this.scene.landed(session.id);}else this.notice('내려놓을 수 없어 원래 자리를 유지해요.');this.cancel();}
 cancel(){this.clearCandidate();clearTimeout(this.timer);const session=this.session;this.session=null;this.scene.carry=null;this.world.classList.remove('carrying');document.getElementById('carry-bar').hidden=true;if(session?.pointer!==null&&session?.pointer!==undefined&&this.world.hasPointerCapture(session.pointer))this.world.releasePointerCapture(session.pointer);if(session)this.scene.onCarry?.(false);}
}
