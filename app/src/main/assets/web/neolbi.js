(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestNeolbi=api;})(globalThis,function(){
'use strict';
const SIZE=1.5;
const Motion=typeof module==='object'?require('./neolbi-motion.js'):globalThis.ForestNeolbiMotion;
const files={neolbiRear:'assets/forest/neolbi/final/01-rear-leaf.png',neolbiLegs:'assets/forest/neolbi/final/02-legs.png',neolbiBody:'assets/forest/neolbi/final/03-body.png',neolbiEyes:'assets/forest/neolbi/final/04-eyes.png',neolbiFront:'assets/forest/neolbi/final/05-front-leaf.png',neolbiCanopy:'assets/forest/neolbi/final/canopy-shade.png',neolbiRainCanopy:'assets/forest/neolbi/final/canopy-rain.png'};
const growth=p=>([.65,.78,.9,1][p.visualStage??(p.xp>=115?3:p.xp>=40?2:p.xp>=8?1:0)])*(p.species==='neolbi'?SIZE:1);
// Final approved 255x208 art is rendered at .24 of the former 64-unit scale.
function geometry(p){const unit=48*growth(p)/64/360,k=unit*.24;return {unit,k,cx:p.x+122*k,cy:p.y+70*k/1.6,rx:54*k,ry:45*k/1.6};}
function covers(p,q){const g=geometry(p);return ((q.x-g.cx)/g.rx)**2+((q.y-g.cy)/g.ry)**2<=1;}
const roof=[[175,84],[200,78],[225,79],[250,87],[275,102],[300,117],[308,126]];
function roofY(x){for(let i=1;i<roof.length;i++)if(x<=roof[i][0]){const a=roof[i-1],b=roof[i];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}return 126;}
function canFit(p,q,guest){const g=geometry(p),half=12*growth(guest)/360,height=36*growth(guest)/576;if(!covers(p,q))return false;for(const t of [-1,-.5,0,.5,1]){const x=127+(q.x+t*half-p.x)/g.k;if(x<175||x>306)return false;const top=q.y-height*(.65+.35*Math.sqrt(1-t*t));if(top<p.y+(roofY(x)-192)*g.k/1.6+.002)return false;}return true;}
function barrier(p){const g=geometry(p);return {id:'canopy:'+p.id,x:g.cx,y:p.y-100*g.k/1.6,rx:60*g.k,ry:24*g.k/1.6};}

function front(c,im,open){const i=Math.round(Math.max(0,Math.min(1,open))*20);c.drawImage(im,i%7*670,Math.floor(i/7)*450,670,450,0,0,335,225);}
const snowFrames=new WeakMap();function frontSnow(c,im,open,amount){if(!amount)return;const E=typeof module==='object'?require('./world-effects.js'):globalThis.ForestEffects,i=Math.round(Math.max(0,Math.min(1,open))*20);let tiles=snowFrames.get(im);if(!tiles){tiles=[];snowFrames.set(im,tiles);}if(!tiles[i]){const tile=E.canvas(670,450);tile.getContext('2d').drawImage(im,i%7*670,Math.floor(i/7)*450,670,450,0,0,670,450);tiles[i]=tile;}E.snow(c,tiles[i],amount,0,0,335,225);}

function surface(c,open,wet,t,rain,reduced){if(!(wet>.02))return;c.save();c.fillStyle='#b8d3c4';c.globalAlpha=.55*wet;for(let i=0;i<3;i++){const x=183+i*18+(i/2)*72*open,y=74+i*10+16*open;c.beginPath();c.ellipse(x,y,1.1,1.8,0,0,Math.PI*2);c.fill();}if(!reduced){const f=(t*.7)%1,x=229+74*open,y=132-7*open;c.globalAlpha=wet*(1-f)*.7;c.beginPath();c.ellipse(x,y+f*(rain?45:18),1.2,2.2,0,0,Math.PI*2);c.fill();}c.restore();}
function turn(c,im,x,y,angle,snow=0){c.save();c.translate(x,y);c.rotate(angle);c.translate(-x,-y);c.drawImage(im,0,0,255,208);if(snow>0)(typeof module==='object'?require('./world-effects.js'):globalThis.ForestEffects).snow(c,im,snow,0,0,255,208);c.restore();}
function drawLocal(c,a,opt={}){
 const raw=opt.clip||opt.kind;const kind=raw==='idle'&&!(opt.canopy>0)&&((opt.phase||0)%18)<5?'hoodpeek':raw;
 const p=Motion.pose(kind,opt.phase||0,opt),t=opt.reduced?0:opt.phase||0;
 c.save();c.translate(0,p.bob+p.sink);c.translate(127,164);c.rotate(p.body);c.translate(-127,-164);
 const leafFilter=!(opt.wetFilm||opt.damage)?c.filter:(c.filter&&c.filter!=='none'?c.filter+' ':'')+'brightness('+(1-.10*(opt.wetFilm||0))+') saturate('+(1-.22*Math.min(1,(opt.damage||0)/30))+')';p.front=Math.min(21*Math.PI/180,p.front+(!p.open?.06*Math.min(1,(opt.burden||0)/40):0));c.save();c.filter=leafFilter;turn(c,a.neolbiRear,140,73,p.rear,opt.snow||0);c.restore();
 for(let j=0;j<2;j++){const x=j?181:89;c.save();c.translate(x,177);c.rotate(j?p.right:p.left);c.translate(-x,-177);c.drawImage(a.neolbiLegs,j?510:0,0,510,832,j?127.5:0,0,127.5,208);c.restore();}
 c.drawImage(a.neolbiBody,0,0,255,208);
 const blink=!opt.reduced&&t%4.7<.12;
 if(p.eyes==='neutral'&&!blink&&p.look===0)c.drawImage(a.neolbiEyes,0,0,255,208);
 else {c.save();c.strokeStyle='#f5ecd6';c.lineWidth=4;c.lineCap='round';
 for(const x of [124,157]){c.beginPath();if(p.eyes==='sleepy'||blink){c.moveTo(x-4,124);c.quadraticCurveTo(x,128,x+4,124);}else if(p.eyes==='happy'){c.moveTo(x-4,125);c.quadraticCurveTo(x,119,x+4,125);}else if(p.eyes==='sad'){c.moveTo(x-4,125);c.lineTo(x+3,126);}else {c.moveTo(x+2+p.look,p.eyes==='focused'?121:p.eyes==='surprised'?115:117);c.lineTo(x-1+p.look,p.eyes==='surprised'?132:130);}c.stroke();}c.restore();}
 c.save();c.filter=leafFilter;c.translate(90,85);c.rotate(p.front);c.translate(-90,-85);
 const deferred=p.open>0&&opt.deferFront&&typeof opt.onHood==='function'&&opt.onHood(c.getTransform());
 if(!deferred){if(p.open>0){front(c,p.rain?a.neolbiRainCanopy:a.neolbiCanopy,p.open);frontSnow(c,a.neolbiCanopy,p.open,opt.snow||0);}else {c.drawImage(a.neolbiFront,0,0,255,208);if(opt.snow>0)(typeof module==='object'?require('./world-effects.js'):globalThis.ForestEffects).snow(c,a.neolbiFront,opt.snow,0,0,255,208);}surface(c,p.open,opt.wetFilm||0,t,opt.rain,opt.reduced);}
 if(p.prop&&opt.hasProp&&a.terrain)c.drawImage(a.terrain,733,689,132,68,40,122,35,18);
 c.restore();c.restore();return p;
}
function draw(c,a,opt={}){c.save();c.translate(627,1065.9);c.scale(1254/64*SIZE*.24,1254/64*SIZE*.24);c.translate(-127,-192);drawLocal(c,a,opt);c.restore();}
return {SIZE,files,growth,geometry,covers,canFit,barrier,draw,drawLocal,frontSnow,front,surface,Motion};
});
