(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestWorld=api;})(globalThis,function(){
'use strict';
// 0.7.0 넓은 숲 (SRS v2.29). The world is the union of the open regions. The original garden keeps its 0..1 coordinates
// (one unit = 360 x 576 world px, as before), so no saved position and no distance rule changes; the forest region adds a
// ring of 0.25 around it (1.5x per side). Later regions (lake to the east, sea to the south, mountain to the west, snow
// field to the north) are added as more rectangles in s.world.regions when they are unlocked.
const REGIONS=Object.freeze({forest:Object.freeze({x0:-.25,y0:-.25,x1:1.25,y1:1.25})});
const GARDEN=Object.freeze({x0:0,y0:0,x1:1,y1:1});
function init(s){if(!s)return s;s.world??={version:1,regions:['forest']};if(!Array.isArray(s.world.regions)||!s.world.regions.length)s.world.regions=['forest'];return s;}
// bounding box of every open region (a missing world record means a save from before 0.7.0: the forest is open)
// cached per world record (not saved: a WeakMap); a changed region list rebuilds it
const cache=new WeakMap();
function bounds(s){const w=s?.world,c=w&&cache.get(w);if(c&&c.ids===w.regions&&c.n===w.regions.length)return c.b;const b=boundsSlow(s);if(w&&Array.isArray(w.regions))cache.set(w,{ids:w.regions,n:w.regions.length,b,walk:null});return b;}
function boundsSlow(s){const ids=s?.world?.regions?.length?s.world.regions:['forest'];let b=null;for(const id of ids){const r=REGIONS[id];if(!r)continue;b=b?{x0:Math.min(b.x0,r.x0),y0:Math.min(b.y0,r.y0),x1:Math.max(b.x1,r.x1),y1:Math.max(b.y1,r.y1)}:{...r};}return b||{...REGIONS.forest};}
// the world rectangle shrunk by the same margins the 0..1 garden used to have against its own edges (l, t, r, b)
function inner(s,l,t,r,bm){const b=bounds(s);return {x0:b.x0+l,y0:b.y0+t,x1:b.x1-r,y1:b.y1-bm};}
// walkable ground: 0.08 from the sides, 0.15 from the top and 0.09 from the bottom (the garden's old .08~.92 / .15~.91)
const walk=s=>{const c=s?.world&&cache.get(s.world);if(c&&c.ids===s.world.regions&&c.n===s.world.regions.length&&c.walk)return c.walk;const r=inner(s,.08,.15,.08,.09);const c2=s?.world&&cache.get(s.world);if(c2)c2.walk=r;return r;};
function inside(s,p,box=walk(s)){return Number.isFinite(p?.x)&&Number.isFinite(p?.y)&&p.x>=box.x0&&p.x<=box.x1&&p.y>=box.y0&&p.y<=box.y1;}
// the visitors' entrance: bottom middle of the world
function entrance(s){const b=bounds(s);return {x:(b.x0+b.x1)/2,y:b.y1-.10};}
function validate(s){if(s.world===undefined)return;if(!s.world||s.world.version!==1||!Array.isArray(s.world.regions)||!s.world.regions.length||s.world.regions.some(id=>!REGIONS[id])||new Set(s.world.regions).size!==s.world.regions.length)throw Error('숲 지역 기록을 확인해 주세요.');}
return Object.freeze({REGIONS,GARDEN,init,bounds,inner,walk,inside,entrance,validate});
});
