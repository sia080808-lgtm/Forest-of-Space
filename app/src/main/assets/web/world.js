(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestWorld=api;})(globalThis,function(){
'use strict';
// 0.7.0 넓은 숲 (SRS v2.29). The world is the union of the open regions. The original garden keeps its 0..1 coordinates
// (one unit = 360 x 576 world px, as before), so no saved position and no distance rule changes; the forest region adds a
// ring of 0.25 around it (1.5x per side). Later regions (lake to the east, sea to the south, mountain to the west, snow
// field to the north) are added as more rectangles in s.world.regions when they are unlocked.
// 0.9.0 동쪽 호수 물가 (SRS v2.33, user: "일단 물가만 열고, 나중을 대비해서 연장 영역은 염두"): the lake shore opens east of
// the forest; the water itself runs on past its east edge (one lake in world coordinates, waterD below) so a later region
// further east only widens the world and the same lake continues.
const REGIONS=Object.freeze({forest:Object.freeze({x0:-.25,y0:-.25,x1:1.25,y1:1.25}),lakeshore:Object.freeze({x0:1.25,y0:-.25,x1:1.75,y1:1.25})});
// the lake's shape (tools/build-lake-floor.py draws the same formula): water where waterD < 1; walking stops a little
// short of the soft painted edge
const LAKE=Object.freeze({cx:2.25,cy:.56,ru:.74,rv:.46,edge:1.04,east:1.08,scents:3,friends:3,season:3600});
function waterD(x,y){return Math.hypot((x-LAKE.cx)/LAKE.ru,(y-LAKE.cy)/LAKE.rv)+.045*Math.sin(y*11+1.3)+.03*Math.sin(y*23+.4)+.02*Math.sin(x*19+2.1);}
const lakeOpen=s=>!!s?.world?.regions?.includes('lakeshore');
function inWater(s,p){return lakeOpen(s)&&p.x>1.25&&waterD(p.x,p.y)<LAKE.edge;}
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
// 호수 해금 (user: "3번"): once the forest has grown (3 friends in the garden, a whole season since the calendar began)
// the east edge 'smells of water'; each walk that ends near the east edge (x >= 1.08) counts a scent, and after 3 the
// shore opens. The record lives in s.world.lake (absent in older saves: nothing ready yet).
function lakeReady(s){const st=s?.world?.lake;return !!st?.ready&&!lakeOpen(s);}
function lakeStep(s,event){if(!s.world||lakeOpen(s))return;const st=s.world.lake??={ready:false,scents:0};
 if(!st.ready&&s.individuals.filter(p=>p.active).length>=LAKE.friends&&s.worldTick-(s.environment?.calendar?.start??0)>=LAKE.season){st.ready=true;event?.(s,'world','숲 동쪽 끝에서 바람이 촉촉해졌어요.');}
 if(!st.ready)return;
 for(const p of s.individuals){const t=p.stroll;if(!p.active||!t||t.arrivedAt!==s.worldTick||t.scent||t.x<LAKE.east)continue;t.scent=true;st.scents++;event?.(s,'world',p.name+' · 동쪽에서 물 냄새가 나요.');
  if(st.scents>=LAKE.scents){s.world.regions=[...s.world.regions,'lakeshore'];st.openedAt=s.worldTick;event?.(s,'world','숲 동쪽에 물가가 열렸어요.');break;}}}
function validate(s){if(s.world===undefined)return;{const l=s.world?.lake;if(l!==undefined&&(!l||typeof l.ready!=='boolean'||!Number.isSafeInteger(l.scents)||l.scents<0||l.scents>99||l.openedAt!=null&&!Number.isSafeInteger(l.openedAt)))throw Error('호수 기록을 확인해 주세요.');}if(!s.world||s.world.version!==1||!Array.isArray(s.world.regions)||!s.world.regions.length||s.world.regions.some(id=>!REGIONS[id])||new Set(s.world.regions).size!==s.world.regions.length)throw Error('숲 지역 기록을 확인해 주세요.');}
return Object.freeze({REGIONS,GARDEN,LAKE,init,bounds,inner,walk,inside,entrance,validate,waterD,inWater,lakeOpen,lakeReady,lakeStep});
});
