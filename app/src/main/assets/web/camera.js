(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestCamera=api;})(globalThis,function(){
'use strict';
// 0.7.0 넓은 숲: positions stay in garden units (the 0..1 garden is 360 x 576 world px). The world can be bigger than the
// garden (bounds in garden units, -0.25..1.25 for the forest). Zoom 1 is today's default view (the garden covers the
// screen); the camera can zoom out until the whole world fits (zMin) and in to 3. At every zoom the view can be dragged
// across the world, never past its edge; a world smaller than the screen is centred.
const FOREST={x0:-.25,y0:-.25,x1:1.25,y1:1.25};
class Camera {
 constructor(saved,bounds=FOREST){this.width=360;this.height=576;this.vw=360;this.vh=576;this.bottom=0;this.z=1;this.cx=.5;this.cy=.5;this.bounds={...bounds};if(saved&&[saved.z,saved.cx,saved.cy].every(Number.isFinite)){this.z=saved.z;this.cx=saved.cx;this.cy=saved.cy;}this.clamp();}
 // zoom 1 = the garden (one unit) covers the screen, as before 0.7.0
 get fit(){return Math.max(this.vw/this.width,this.vh/this.height);}
 get scale(){return this.fit*this.z;}
 get visibleHeight(){return Math.max(48,this.vh-this.bottom);}
 get tx(){return this.vw/2-this.cx*this.width*this.scale;}
 get ty(){return this.visibleHeight/2-this.cy*this.height*this.scale;}
 // the smallest zoom: the whole world fits the visible screen
 get zMin(){const b=this.bounds,w=(b.x1-b.x0)*this.width,h=(b.y1-b.y0)*this.height;return Math.min(1,Math.min(this.vw/w,this.visibleHeight/h)/this.fit);}
 clamp(){this.z=Math.min(3,Math.max(this.zMin,this.z));const b=this.bounds,hx=this.vw/(2*this.width*this.scale),hy=this.visibleHeight/(2*this.height*this.scale);
  this.cx=b.x1-b.x0<=2*hx?(b.x0+b.x1)/2:Math.max(b.x0+hx,Math.min(b.x1-hx,this.cx));this.cy=b.y1-b.y0<=2*hy?(b.y0+b.y1)/2:Math.max(b.y0+hy,Math.min(b.y1-hy,this.cy));}
 // overview: the whole world at the smallest zoom
 setOverview(on){on=!!on;if(on===!!this.overview)return;if(on)this.previous={z:this.z,cx:this.cx,cy:this.cy};this.overview=on;if(on){this.z=0;this.cx=(this.bounds.x0+this.bounds.x1)/2;this.cy=(this.bounds.y0+this.bounds.y1)/2;}else if(this.previous){Object.assign(this,this.previous);delete this.previous;}this.clamp();}
 setBounds(width,height){if(!(width>0&&height>0))throw Error('Invalid world bounds');this.width=width;this.height=height;this.clamp();}
 setWorld(b){if(!b||![b.x0,b.y0,b.x1,b.y1].every(Number.isFinite)||!(b.x1>b.x0&&b.y1>b.y0))throw Error('Invalid world bounds');this.bounds={x0:b.x0,y0:b.y0,x1:b.x1,y1:b.y1};this.clamp();}
 resize(w,h){if(!(w>0&&h>0))return;this.vw=w;this.vh=h;this.bottom=Math.min(this.bottom,Math.max(0,h-48));this.measured=true;this.clamp();}
 setBottomOcclusion(pixels){const oldTop=this.ty;this.bottom=Math.max(0,Math.min(Number.isFinite(pixels)?pixels:0,this.vh-48));this.cy=(this.visibleHeight/2-oldTop)/(this.height*this.scale);this.clamp();}
 world(x,y){return {x:(x-this.tx)/(this.width*this.scale),y:(y-this.ty)/(this.height*this.scale)};}
 screen(p){return {x:this.tx+p.x*this.width*this.scale,y:this.ty+p.y*this.height*this.scale};}
 zoom(z,x=this.vw/2,y=this.visibleHeight/2,anchor=this.world(x,y)){if(this.overview)this.setOverview(false);this.z=Math.min(3,Math.max(this.zMin,z));this.cx=anchor.x-(x-this.vw/2)/(this.width*this.scale);this.cy=anchor.y-(y-this.visibleHeight/2)/(this.height*this.scale);this.clamp();}
 pan(dx,dy){this.cx-=dx/(this.width*this.scale);this.cy-=dy/(this.height*this.scale);this.clamp();}
 // the default view: today's size, centred on the garden
 reset(){this.z=1;this.cx=this.cy=.5;this.clamp();}
 snapshot(){const view=this.overview&&this.previous?this.previous:this;const camera=new Camera({z:view.z,cx:view.cx,cy:view.cy},this.bounds);camera.resize(this.vw,this.vh);return {z:camera.z,cx:camera.cx,cy:camera.cy};}
}
return Camera;
});
