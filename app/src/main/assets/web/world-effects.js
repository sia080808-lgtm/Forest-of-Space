(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestEffects=api;})(globalThis,function(){
'use strict';
const masks=new WeakMap();
function canvas(w,h){const c=typeof document!=='undefined'?document.createElement('canvas'):require('@napi-rs/canvas').createCanvas(w,h);c.width=w;c.height=h;return c;}
// Once per immutable source image, never per animation frame. Only exposed upper edges.
function mask(image){if(masks.has(image))return masks.get(image);const c=canvas(image.width,image.height),ctx=c.getContext('2d');ctx.drawImage(image,0,0);const raw=ctx.getImageData(0,0,c.width,c.height),d=raw.data,depth=Math.max(2,Math.round(c.height*.014));for(let x=0;x<c.width;x++){let top=-1;for(let y=0;y<c.height;y++){const i=(y*c.width+x)*4,alpha=d[i+3];if(top<0&&alpha>100)top=y;const a=top>=0&&y-top<depth?alpha*(1-(y-top)/depth):0;d[i]=239;d[i+1]=242;d[i+2]=230;d[i+3]=a;}}ctx.putImageData(raw,0,0);masks.set(image,c);return c;}
function snow(c,im,amount,...args){if(amount<.005||!im)return;c.save();c.globalAlpha*=Math.min(.9,amount);c.drawImage(mask(im),...args);c.restore();}
// Rain uses viewport CSS pixels, before the shared world lighting pass.
function rainProfile(s){const E=typeof module==='object'?require('./environment.js'):globalThis.ForestEnvironment,r=Math.max(0,Math.min(1,E.precipitation(s,'rain')));return {intensity:r,count:Math.round(100*r*(s.settings.reducedMotion?.3:1)),length:9+13*r,width:.8+.8*r,alpha:.38+.24*r,speed:220+160*r};}
function rain(c,s,w,h,t){const p=rainProfile(s);if(!p.count||w<=0||h<=0)return;
 const time=s.settings.reducedMotion?0:t,dx=(3+s.weather.wind*.08)*Math.cos(s.weather.wind_dir||0),drift=(20+s.weather.wind*.6)*Math.cos(s.weather.wind_dir||0);
 c.save();c.lineCap='round';
 for(let i=0;i<p.count;i++){const depth=.78+(i%4)*.073333,x=((i*.61803398875*w+time*drift)%w+w)%w,y=((i*.38196601125*h+time*p.speed*depth)%(h+p.length)+h+p.length)%(h+p.length)-p.length;
  c.beginPath();c.moveTo(x,y);c.lineTo(x-dx*depth,y+p.length*depth);
  c.strokeStyle='#527b83';c.lineWidth=p.width*depth+.65;c.globalAlpha=p.alpha*depth*.32;c.stroke();
  c.strokeStyle='#e8f0eb';c.lineWidth=p.width*depth;c.globalAlpha=p.alpha*depth;c.stroke();
 }c.restore();
}
function particles(c,s,w,h,t,assets){const E=typeof module==='object'?require('./environment.js'):globalThis.ForestEnvironment,reduced=s.settings.reducedMotion,factor=reduced?.3:1,rain=E.precipitation(s,'rain'),snowfall=E.precipitation(s,'snow');const nr=Math.round(100*rain*factor),ns=Math.min(Math.round(70*snowfall*factor),120-nr);c.save();c.fillStyle='#f7f8ed';for(let i=0;i<ns;i++){const x=((i*79.3+Math.sin(t*.8+i)*8+t*s.weather.wind*.20)%w+w)%w,y=(i*117.7+t*(12+i%13))%h;c.globalAlpha=.5+(i%4)*.1;c.beginPath();c.arc(x,y,.9+(i%3)*.4,0,Math.PI*2);c.fill();}if(s.weather.wind>=40&&assets?.terrain){const count=Math.min(Math.round((s.weather.wind>=70?12:5)*factor),120-nr-ns);for(let i=0;i<count;i++){const x=((i*93.7+t*s.weather.wind*.6)%w+w)%w,y=(i*71.3+Math.sin(t+i)*14)%h;c.save();c.translate(x,y);c.rotate(t*(.5+i%3)+i);c.globalAlpha=.35;c.drawImage(assets.terrain,733,689,132,68,-4,-2,8,4);c.restore();}}if(s.weather.kind==='fog'){for(let i=0;i<3;i++){const y=h*(.25+i*.25)+Math.sin(t*.08+i)*12,g=c.createLinearGradient(0,y-50,0,y+50);g.addColorStop(0,'#d5dfd600');g.addColorStop(.5,'#d5dfd638');g.addColorStop(1,'#d5dfd600');c.globalAlpha=1;c.fillStyle=g;c.fillRect(0,y-50,w,100);}}c.restore();}
function grade(c,buffer,s,w,h){const E=typeof module==='object'?require('./environment.js'):globalThis.ForestEnvironment,p=E.lighting(s);c.save();c.filter=`brightness(${p.brightness}) saturate(${p.saturation})`;c.drawImage(buffer,0,0,w,h);c.filter='none';for(const t of p.tints){if(t.alpha<=0)continue;c.fillStyle=`rgba(${t.color.map(Math.round).join(',')},${t.alpha})`;c.fillRect(0,0,w,h);}c.restore();}
return {canvas,snow,mask,rainProfile,rain,particles,grade};
});
