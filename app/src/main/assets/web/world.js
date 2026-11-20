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
// 0.9.1 수련 (LK-04, user: "연꽃봉오리들이 서서히 피어나는 구조", "호수에서 랜덤으로 생성", "물 위에 피지 않음?"):
// from the last day of spring through summer a lily may appear every 90 s (30%, at most 7) on open water away from the
// shore and from other lilies; each one grows leaf -> bud -> half open -> full -> sinking -> withered by its own age, so
// lilies at every stage mix. In autumn the ones still flowering sink and wither (staggered); winter's ice clears them.
// Own RNG stream rng.lake; positions and ages are saved.
const LILY=Object.freeze({check:90,chance:.3,max:7,gap:.08,len:3600,stages:Object.freeze([['leaf',400],['bud',900],['half',1300],['full',2500],['sink',2900],['wither',3300]]),fall:Object.freeze([400,800])});
const ORDER=['leaf','bud','half','full','sink','wither'];
function lrnd(s){s.rng.lake??=((s.rng.weather^0x6a09e667)>>>0)||1;let x=s.rng.lake>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng.lake=x>>>0;return (x>>>0)/4294967296;}
function seasonAt(s){const el=Math.max(0,s.worldTick-(s.environment?.calendar?.start??0)),n=Math.floor(el/LILY.len);return {i:n%4,into:el-n*LILY.len};}
function lilyStage(s,l){const a=s.worldTick-l.born;let st=null;for(const [n,end] of LILY.stages)if(a<end){st=n;break;}if(!st)return null;
 if(l.fall!=null&&s.worldTick>=l.fall&&ORDER.indexOf(st)<4){const f=s.worldTick-l.fall;return f<LILY.fall[0]?'sink':f<LILY.fall[1]?'wither':null;}return st;}
function lilyStep(s){const st=s.world.lake??={ready:true,scents:LAKE.scents};st.lilies??=[];const c=seasonAt(s);
 if(c.i===3){if(st.lilies.length)st.lilies=[];return;}
 if(c.i===2)for(const l of st.lilies)if(l.fall==null)l.fall=s.worldTick+Math.floor(lrnd(s)*600);
 st.lilies=st.lilies.filter(l=>lilyStage(s,l));
 if(!(c.i===0&&c.into>=2400||c.i===1&&c.into<3000)||s.worldTick<(st.nextLily??0))return;st.nextLily=s.worldTick+LILY.check;
 if(st.lilies.length>=LILY.max||lrnd(s)>=LILY.chance)return;
 for(let k=0;k<10;k++){const x=1.3+lrnd(s)*.42,y=-.15+lrnd(s)*1.3,d=waterD(x,y);if(d<=.55||d>=.94||st.lilies.some(l=>Math.hypot(l.x-x,(l.y-y)*.62)<LILY.gap))continue;
  st.nextId=(st.nextId||0)+1;st.lilies.push({id:'lily'+st.nextId,x:Math.round(x*1e4)/1e4,y:Math.round(y*1e4)/1e4,born:s.worldTick});return;}}
// 0.9.2 물가 이웃 (LK-05, user: "물가 이웃 ㄱㄱ", "게임에 넣어줘"): checked every 60 s on the open shore, own RNG rng.lake.
//  spring: frog eggs near the shore -> tadpoles (600 s) -> frogs (1,800 s) that sit on lily leaves or the shore;
//  late spring-autumn: water striders, pond snails (a snail eats a withered lily it reaches);
//  summer: medaka schools, a diving beetle (eats tadpoles now and then), dragonfly nymphs on the reeds -> dragonflies (900 s),
//  mosquito larvae (장구벌레, the pest) on calm warm water; medaka, dragonflies and frogs each eat larvae;
//  a friend standing near larvae is bothered (mood -0.5/min). Autumn thins them out; winter's ice clears everything.
const LIFE=Object.freeze({check:60,cap:Object.freeze({eggs:2,tadpole:2,frog:3,strider:3,snail:2,medaka:2,beetle:1,nymph:2,dragonfly:3,larva:4}),hatch:600,grow:1800,emerge:900,bother:.5/60,near:.12});
const LIFE_KINDS=Object.keys(LIFE.cap);
const REEDS=Object.freeze([[1.47,.37],[1.5,.29],[1.62,.11]]);
function waterSpot(s,lo,hi,away=.06){const L=s.world.lake.life;for(let k=0;k<20;k++){const x=1.3+lrnd(s)*.42,y=-.15+lrnd(s)*1.3,d=waterD(x,y);if(d>lo&&d<hi&&!L.some(o=>Math.hypot(o.x-x,(o.y-y)*.62)<away))return {x:Math.round(x*1e4)/1e4,y:Math.round(y*1e4)/1e4};}return null;}
function shoreSpot(s){for(let k=0;k<12;k++){const x=1.3+lrnd(s)*.4,y=-.1+lrnd(s)*1.2,d=waterD(x,y);if(d>1.06&&d<1.14&&x<1.68)return {x:Math.round(x*1e4)/1e4,y:Math.round(y*1e4)/1e4};}return null;}
function lifeStep(s,event){const st=s.world.lake;st.life??=[];const L=st.life,c=seasonAt(s),t=s.worldTick,count=k=>L.filter(o=>o.kind===k).length;
 // the pest bothers friends standing close to it, every tick
 const larvae=L.filter(o=>o.kind==='larva');if(larvae.length)for(const p of s.individuals)if(p.active&&!p.mounted&&larvae.some(o=>Math.hypot(o.x-p.x,(o.y-p.y)*.62)<LIFE.near))p.mood=Math.max(0,p.mood-LIFE.bother);
 if(t<(st.nextLife??0))return;st.nextLife=t+LIFE.check;
 if(c.i===3){if(L.length)st.life=[];return;}
 const add=(kind,q,extra={})=>{if(!q||count(kind)>=LIFE.cap[kind])return null;st.nextLifeId=(st.nextLifeId||0)+1;const o={id:'life'+st.nextLifeId,kind,x:q.x,y:q.y,born:t,...extra};L.push(o);return o;};
 // growth
 for(const o of [...L]){const a=t-o.born;
  if(o.kind==='eggs'&&a>=LIFE.hatch){o.kind='tadpole';o.born=t;o.n=4;}
  else if(o.kind==='tadpole'&&a>=LIFE.grow&&count('frog')<LIFE.cap.frog){const lily=(st.lilies||[]).find(l=>!L.some(f=>f.kind==='frog'&&Math.hypot(f.x-l.x,f.y-l.y)<.01));const q=lily?{x:lily.x,y:lily.y}:shoreSpot(s);if(q){o.kind='frog';o.born=t;o.x=q.x;o.y=q.y;delete o.n;event?.(s,'world','올챙이가 개구리가 되었어요.');}}
  else if(o.kind==='nymph'&&a>=LIFE.emerge){o.kind='dragonfly';o.born=t;event?.(s,'world','잠자리가 날개를 말리고 날아올랐어요.');}}
 // eating
 const lily=(st.lilies||[]);for(const sn of L.filter(o=>o.kind==='snail')){const w=lily.find(l=>lilyStage(s,l)==='wither');if(w){if(Math.hypot(sn.x-w.x,sn.y-w.y)<.02){st.lilies=lily.filter(l=>l!==w);}else{sn.x=w.x;sn.y=w.y;}}}
 for(const b of L.filter(o=>o.kind==='beetle')){const tp=L.find(o=>o.kind==='tadpole');if(tp&&lrnd(s)<.12){tp.n=(tp.n||4)-1;if(tp.n<=0)L.splice(L.indexOf(tp),1);}}
 for(const e of L.filter(o=>['medaka','dragonfly','frog'].includes(o.kind))){const lv=L.findIndex(o=>o.kind==='larva');if(lv>=0&&lrnd(s)<.4)L.splice(lv,1);}
 // leaving in autumn
 if(c.i===2&&c.into>=1200)st.life=L.filter(o=>!['medaka','dragonfly','larva','nymph','beetle','eggs','tadpole'].includes(o.kind)||lrnd(s)>=.3);
 // arrivals
 const calm=s.weather.wind<30&&!(s.weather.kind==='rain'&&s.weather.intensity>=.4);
 if(c.i===0&&c.into<2400&&lrnd(s)<.25)add('eggs',waterSpot(s,.86,.98));
 if((c.i===0&&c.into>=1200||c.i===1||c.i===2&&c.into<2400)&&lrnd(s)<.3)add('strider',waterSpot(s,.4,.95));
 if((c.i===0&&c.into>=1200||c.i===1||c.i===2)&&lrnd(s)<.15)add('snail',waterSpot(s,.9,1.0));
 if((c.i===0&&c.into>=2400||c.i===1)&&lrnd(s)<.2)add('medaka',waterSpot(s,.3,.92,.08));
 if(c.i===1){if(lrnd(s)<.08)add('beetle',waterSpot(s,.3,.8));
  if(c.into<2400&&lrnd(s)<.15){const r=REEDS[Math.floor(lrnd(s)*REEDS.length)];if(!L.some(o=>o.kind==='nymph'&&o.x===r[0]))add('nymph',{x:r[0],y:r[1]});}
  if(calm&&lrnd(s)<.35)add('larva',waterSpot(s,.8,.98,.04));}}
function lakeStep(s,event){if(!s.world)return;if(lakeOpen(s)){lilyStep(s);lifeStep(s,event);return;}const st=s.world.lake??={ready:false,scents:0};
 if(!st.ready&&s.individuals.filter(p=>p.active).length>=LAKE.friends&&s.worldTick-(s.environment?.calendar?.start??0)>=LAKE.season){st.ready=true;event?.(s,'world','숲 동쪽 끝에서 바람이 촉촉해졌어요.');}
 if(!st.ready)return;
 for(const p of s.individuals){const t=p.stroll;if(!p.active||!t||t.arrivedAt!==s.worldTick||t.scent||t.x<LAKE.east)continue;t.scent=true;st.scents++;event?.(s,'world',p.name+' · 동쪽에서 물 냄새가 나요.');
  if(st.scents>=LAKE.scents){s.world.regions=[...s.world.regions,'lakeshore'];st.openedAt=s.worldTick;event?.(s,'world','숲 동쪽에 물가가 열렸어요.');break;}}}
// 관리자: open the shore at once, skipping the growth conditions and the three walks (settings > 개발 검수; user: "관리자 권한으로 해금 조건 푸는 설정")
function openLake(s){if(!s.world||lakeOpen(s))return false;const st=s.world.lake??={ready:false,scents:0};st.ready=true;st.scents=Math.max(st.scents,LAKE.scents);st.openedAt=s.worldTick;s.world.regions=[...s.world.regions,'lakeshore'];return true;}
function validate(s){if(s.world===undefined)return;{const l=s.world?.lake;if(l!==undefined&&(!l||typeof l.ready!=='boolean'||!Number.isSafeInteger(l.scents)||l.scents<0||l.scents>99||l.openedAt!=null&&!Number.isSafeInteger(l.openedAt)||l.nextLily!=null&&!Number.isSafeInteger(l.nextLily)||l.nextId!=null&&!Number.isSafeInteger(l.nextId)||l.nextLife!=null&&!Number.isSafeInteger(l.nextLife)||l.nextLifeId!=null&&!Number.isSafeInteger(l.nextLifeId)||l.life!=null&&(!Array.isArray(l.life)||l.life.length>30||l.life.some(q=>!q||typeof q.id!=='string'||!LIFE_KINDS.includes(q.kind)||!Number.isFinite(q.x)||!Number.isFinite(q.y)||!Number.isSafeInteger(q.born)||q.n!=null&&!Number.isSafeInteger(q.n)))||l.lilies!=null&&(!Array.isArray(l.lilies)||l.lilies.length>LILY.max||l.lilies.some(q=>!q||typeof q.id!=='string'||!Number.isFinite(q.x)||!Number.isFinite(q.y)||!Number.isSafeInteger(q.born)||q.fall!=null&&!Number.isSafeInteger(q.fall)))))throw Error('호수 기록을 확인해 주세요.');}if(!s.world||s.world.version!==1||!Array.isArray(s.world.regions)||!s.world.regions.length||s.world.regions.some(id=>!REGIONS[id])||new Set(s.world.regions).size!==s.world.regions.length)throw Error('숲 지역 기록을 확인해 주세요.');}
return Object.freeze({REGIONS,GARDEN,LAKE,init,bounds,inner,walk,inside,entrance,validate,waterD,inWater,lakeOpen,lakeReady,lakeStep,lilyStage,LILY,openLake,LIFE});
});
