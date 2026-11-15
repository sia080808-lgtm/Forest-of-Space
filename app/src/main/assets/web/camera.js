(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestCamera=api;})(globalThis,function(){
'use strict';
class Camera {
 constructor(saved){this.width=360;this.height=576;this.vw=360;this.vh=576;this.bottom=0;this.z=1;this.cx=.5;this.cy=.5;if(saved&&[saved.z,saved.cx,saved.cy].every(Number.isFinite)){this.z=saved.z;this.cx=saved.cx;this.cy=saved.cy;}this.clamp();}
 // Uniform cover at minimum zoom: never letterbox or stretch the garden.
 get fit(){return Math.max(this.vw/this.width,this.vh/this.height);}
 get scale(){return this.fit*this.z;}
 get visibleHeight(){return Math.max(48,this.vh-this.bottom);}
 get tx(){return this.vw/2-this.cx*this.width*this.scale;}
 get ty(){return this.visibleHeight/2-this.cy*this.height*this.scale;}
 clamp(){this.z=Math.min(3,Math.max(1,this.z));const x=Math.min(.5,this.vw/(2*this.width*this.scale)),y=Math.min(.5,this.visibleHeight/(2*this.height*this.scale));this.cx=Math.max(x,Math.min(1-x,this.cx));this.cy=Math.max(y,Math.min(1-y,this.cy));}
 resize(w,h){if(!(w>0&&h>0))return;this.vw=w;this.vh=h;this.bottom=Math.min(this.bottom,Math.max(0,h-48));this.measured=true;this.clamp();}
 setBottomOcclusion(pixels){const oldTop=this.ty;this.bottom=Math.max(0,Math.min(Number.isFinite(pixels)?pixels:0,this.vh-48));this.cy=(this.visibleHeight/2-oldTop)/(this.height*this.scale);this.clamp();}
 world(x,y){return {x:(x-this.tx)/(this.width*this.scale),y:(y-this.ty)/(this.height*this.scale)};}
 screen(p){return {x:this.tx+p.x*this.width*this.scale,y:this.ty+p.y*this.height*this.scale};}
 zoom(z,x=this.vw/2,y=this.visibleHeight/2,anchor=this.world(x,y)){this.z=Math.min(3,Math.max(1,z));this.cx=anchor.x-(x-this.vw/2)/(this.width*this.scale);this.cy=anchor.y-(y-this.visibleHeight/2)/(this.height*this.scale);this.clamp();}
 pan(dx,dy){this.cx-=dx/(this.width*this.scale);this.cy-=dy/(this.height*this.scale);this.clamp();}
 reset(){this.z=1;this.cx=this.cy=.5;this.clamp();}
 snapshot(){const camera=new Camera({z:this.z,cx:this.cx,cy:this.cy});camera.resize(this.vw,this.vh);return {z:camera.z,cx:camera.cx,cy:camera.cy};}
}
return Camera;
});
