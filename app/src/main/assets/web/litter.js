(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestLitter=api;})(globalThis,function(){
'use strict';
const World=typeof module==='object'?require('./world.js'):globalThis.ForestWorld;
// ECO24-L01~L06 / N01~N05 step 1 (0.6.20): natural leaf fall into 12 fixed world sectors, loose leaves, piles,
// pile decomposition, and the one-time move of an old save's raw leaves into real piles. No creatures yet.
const dep=n=>typeof module==='object'?require('./'+n+'.js'):globalThis[{spatial:'ForestSpace',environment:'ForestEnvironment',objects:'ForestObjects',creatures:'ForestCreatures',skills:'ForestSkills'}[n]];
// 0.7.0 넓은 숲: 6x5 sectors over the forest's walkable ground (cells about as big as the old 4x3 garden cells); the floor
// leaf cap grows with the area (40 -> 90). Old saves are re-sectored once on load (grid 2), see regrid().
const WB=World.walk(null),COLS=6,ROWS=5,X0=WB.x0,X1=WB.x1,Y0=WB.y0,Y1=WB.y1,LCAP=90,SECTOR=12,PILE=5,eps=1e-8,GRID=2;
const MIGRATE_PILES=3;
function rnd(s){let x=s.rng.litter>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng.litter=x>>>0;return (x>>>0)/4294967296;}
function sectorOf(q){const c=Math.max(0,Math.min(COLS-1,Math.floor((q.x-X0)/(X1-X0)*COLS))),r=Math.max(0,Math.min(ROWS-1,Math.floor((q.y-Y0)/(Y1-Y0)*ROWS)));return r*COLS+c;}
function bounds(i){const c=i%COLS,r=Math.floor(i/COLS),w=(X1-X0)/COLS,h=(Y1-Y0)/ROWS;return {x0:X0+c*w,x1:X0+(c+1)*w,y0:Y0+r*h,y1:Y0+(r+1)*h,cx:X0+(c+.5)*w,cy:Y0+(r+.5)*h};}
const state=s=>s.objects.litter;
const piles=s=>state(s)?.piles||[];
const leaves=s=>state(s)?.leaves||[];
function pile(s,id){return piles(s).find(p=>p.id===id)||null;}
function carried(s,from){return s.individuals.reduce((v,p)=>v+(p.carriedLeaf&&(from?p.carriedLeaf.pile===from:p.carriedLeaf.pile!=='litter')?p.carriedLeaf.amount:0),0);}
// Floor leaves that gate the natural fall: loose leaves, piles and pieces carried from them. The old litter spot is the
// legacy compost heap and does not gate the fall; withSpot adds its raw leaves for "any leaves at all" checks.
function floor(s,withSpot=false){const z=s.patches.find(p=>p.id==='litter');return leaves(s).length+piles(s).reduce((v,p)=>v+p.O,0)+carried(s)+antCarry(s)+(withSpot?z?.O||0:0);}
// leaves an ant is carrying right now (each L=1, between two sectors)
function antCarry(s){return (s.objects?.creatures?dep('creatures').carried(s):0)+(dep('skills')?.carried?.(s)||0);}   // + leaves 코로나 is carrying (SRS v2.36 SK-04)
function compost(s){const z=s.patches.find(p=>p.id==='litter');return piles(s).reduce((v,p)=>v+p.U,0)+(z?.U||0);}
function sectorRaw(s,i){const p=piles(s).find(p=>p.sector===i);return leaves(s).filter(l=>l.sector===i).length+(p?p.O+carried(s,p.id):0);}
function ucap(s){const O=dep('objects');return O.capacity(s,'litter');}
function blocked(s,q,pad=.035){
 const Space=dep('spatial');if(!Space.walkable(s,q))return true;
 if(Math.hypot(q.x-s.spring.x,(q.y-s.spring.y)*1.6)<.16)return true;
 if(s.patches.some(z=>z.id!=='shelter'&&Math.hypot(q.x-z.x,(q.y-z.y)*1.6)<.11))return true;
 return piles(s).some(p=>Math.hypot(q.x-p.x,(q.y-p.y)*1.6)<pad*2);
}
function spot(s,i,tries=8){const b=bounds(i);for(let k=0;k<tries;k++){const q={x:b.x0+.02+(b.x1-b.x0-.04)*rnd(s),y:b.y0+.02+(b.y1-b.y0-.04)*rnd(s)};if(!blocked(s,q))return q;}return null;}
// Wind blows toward (cos, sin) of wind_dir (same convention as rain drift). The three sectors furthest downwind weigh 2.
function downwind(s){const a=s.weather.wind_dir||0,dx=Math.cos(a),dy=Math.sin(a);return [...Array(COLS*ROWS).keys()].map(i=>{const b=bounds(i);return {i,d:(b.cx-.5)*dx+(b.cy-.53)*dy};}).sort((p,q)=>q.d-p.d||p.i-q.i).slice(0,3).map(x=>x.i);}
function factor(s){
 const E=dep('environment'),w=s.weather,rain=E.precipitation(s,'rain'),snow=E.precipitation(s,'snow');
 const sky=snow>.05?.6:rain>=.6?1.2:rain>.05?1.1:w.kind==='fog'?.85:1,wind=w.wind>=60?2:w.wind>=45?1.5:1;
 return Math.min(2,Math.max(sky,wind));
}
function newPile(s,i,O,at){const st=state(s),p={id:'pile:'+st.nextPile++,sector:i,x:at.x,y:at.y,O,U:0,S:50,cap:100,W:0,playBoostUntil:0,born:s.worldTick};st.piles.push(p);return p;}
// Lay one raw leaf (L=1) in sector i at point q. Five loose leaves in a sector become a pile on the fifth landing.
function land(s,i,q){
 const st=state(s),p=piles(s).find(p=>p.sector===i);
 if(p){p.O+=1;return 'pile';}
 st.leaves.push({id:st.nextLeaf++,sector:i,x:q.x,y:q.y,rot:Math.round(rnd(s)*628)/100,moved:0});
 const here=st.leaves.filter(l=>l.sector===i);
 if(here.length>=PILE){const c={x:here.reduce((v,l)=>v+l.x,0)/here.length,y:here.reduce((v,l)=>v+l.y,0)/here.length};const at=blocked(s,c,.0)?{x:here.at(-1).x,y:here.at(-1).y}:c;st.leaves=st.leaves.filter(l=>l.sector!==i);newPile(s,i,here.length,at);return 'formed';}
 return 'loose';
}
// SRS v2.36 SK-04 코로나 긁어모으기: these loose leaves of one sector become one pile at `at` (or join the sector's pile)
function gather(s,i,ids,at){const st=state(s),take=st.leaves.filter(l=>l.sector===i&&ids.includes(l.id));if(!take.length)return 0;st.leaves=st.leaves.filter(l=>!take.includes(l));
 const p=piles(s).find(p=>p.sector===i);if(p)p.O+=take.length;else{const q=blocked(s,at,.0)?{x:take[0].x,y:take[0].y}:at;newPile(s,i,take.length,q);}return take.length;}
function pick(s){
 const down=new Set(downwind(s)),open=[...Array(COLS*ROWS).keys()].filter(i=>sectorRaw(s,i)+1<=SECTOR+eps);if(!open.length)return null;
 const w=open.map(i=>down.has(i)?2:1),total=w.reduce((a,b)=>a+b,0);let r=rnd(s)*total;for(let k=0;k<open.length;k++){r-=w[k];if(r<0)return open[k];}return open.at(-1);
}
function fall(s){
 const o=s.objects,st=state(s);if(o.arrivedToday+1>o.dayQuota+eps||floor(s)+1>LCAP+eps)return;
 const chance=1-Math.exp(-o.dayQuota*factor(s)/1200);if(rnd(s)>=chance)return;
 const i=pick(s);const q=i===null?null:(piles(s).find(p=>p.sector===i)||spot(s,i));
 if(!q){st.missed++;return;}
 land(s,i,q);o.arrivedToday+=1;o.ledger.leafInput+=1;st.fallen++;
}
// L06: strong wind (>=60) moves loose leaves, at most once per leaf per 10 s with a 30 s cooldown. Piles stay.
// Edge sectors only move inward (no loss off the map).
function blow(s){
 const st=state(s),w=s.weather.wind;if(w<60||s.worldTick%10)return;
 const a=s.weather.wind_dir||0,dc=Math.abs(Math.cos(a))>=Math.abs(Math.sin(a))?Math.sign(Math.cos(a)):0,dr=dc?0:Math.sign(Math.sin(a)),chance=w>=70?.3:.18;
 for(const l of [...st.leaves].sort((p,q)=>p.id-q.id)){
  if(!st.leaves.includes(l)||s.worldTick-l.moved<30)continue;if(rnd(s)>=chance)continue;
  const c=l.sector%COLS+dc,r=Math.floor(l.sector/COLS)+dr;if(c<0||c>=COLS||r<0||r>=ROWS)continue;
  const i=r*COLS+c;if(sectorRaw(s,i)+1>SECTOR+eps)continue;const q=piles(s).find(p=>p.sector===i)||spot(s,i,4);if(!q)continue;
  st.leaves=st.leaves.filter(x=>x!==l);const kind=land(s,i,q);const moved=kind==='loose'?st.leaves.at(-1):null;if(moved){moved.id=l.id;moved.rot=l.rot;moved.moved=s.worldTick;}st.moves++;
 }
}
// Pile moisture follows the forest-floor litter soil (the old litter spot's M and standing water W). 0.6.25: the nearest
// terrain patch (rock, shade, crevice…) gave only 0% or 100% and starved decomposition; the litter soil moves with rain.
function soak(s,p){const z=s.patches.find(q=>q.id==='litter')||s.patches.filter(z=>z.id!=='shelter').sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)||a.id.localeCompare(b.id))[0];if(!z)return;p.S=z.cap?100*z.S/z.cap:0;p.cap=100;p.W=z.W;}
function rates(s,z){const M=z.cap?100*z.S/z.cap:0,factor=z.W>1||M>85?.2:M<20?.2:M<35?.5:M<=70?1:.5,until=z.id==='litter'?s.objects.playBoostUntil:z.playBoostUntil,boost=until>0&&until>=s.worldTick?3:1;const spring=s.objects?.creatures?dep('creatures').decomposeBoost(s,z.id):1,mult=Math.min(3.75,boost*spring);return {factor,boost,spring,perMinute:.5*factor*mult};}
function decompose(s){
 // N01/P0-1: only piles and the old litter spot decompose; loose leaves do not. Compost above the level's capacity
 // soaks into the soil (recorded outflow), so a full compost store never stops leaves from breaking down and falling.
 const o=s.objects,z=s.patches.find(p=>p.id==='litter');let room=Math.max(0,ucap(s)-compost(s));
 const go=q=>{const n=Math.min(q.O,rates(s,q).perMinute/60);if(n<=0)return;const keep=Math.min(n,room);q.O-=n;q.U+=keep;room-=keep;o.decomposedTotal+=n;o.ledger.soil=(o.ledger.soil||0)+n-keep;};
 for(const p of [...piles(s)].sort((a,b)=>a.id.localeCompare(b.id))){soak(s,p);go(p);}
 if(z)go(z);
}
function tidy(s){const st=state(s);st.piles=st.piles.filter(p=>p.O>eps||p.U>eps||s.individuals.some(q=>q.objectTask?.object===p.id||q.carriedLeaf?.pile===p.id));}
function step(s){fall(s);blow(s);decompose(s);tidy(s);}
// Layout changes may cover a leaf or pile with a stone or the spring: move it to the nearest open spot in its sector.
function relocate(s){
 for(const l of leaves(s))if(blocked(s,l,0)){const q=spot(s,l.sector,12);if(q){l.x=q.x;l.y=q.y;}}
 for(const p of piles(s)){const others=piles(s).filter(x=>x!==p);const stuck=!dep('spatial').walkable(s,p)||Math.hypot(p.x-s.spring.x,(p.y-s.spring.y)*1.6)<.16||s.patches.some(z=>z.id!=='shelter'&&Math.hypot(p.x-z.x,(p.y-z.y)*1.6)<.11);if(stuck){const st=state(s);st.piles=others;const q=spot(s,p.sector,12);st.piles.push(p);if(q){p.x=q.x;p.y=q.y;}}}
}
// 0.7.0: an old save's leaves and piles get their sector numbers on the new 6x5 grid from where they lie. Two piles that
// fall into one new sector: the second keeps its place and takes the nearest free sector number (a pile's sector is its
// bookkeeping cell). A sector left with 5+ loose leaves and no pile forms a pile, as a fifth landing would. Nothing is
// created, lost or moved on the ground.
function regrid(s){const st=state(s);
 for(const l of st.leaves)l.sector=sectorOf(l);
 const used=new Set();for(const p of [...st.piles].sort((a,b)=>b.O-a.O||a.id.localeCompare(b.id))){let i=sectorOf(p);
  if(used.has(i)){const free=[...Array(COLS*ROWS).keys()].filter(k=>!used.has(k)).sort((a,b)=>{const A=bounds(a),B=bounds(b);return Math.hypot(A.cx-p.x,A.cy-p.y)-Math.hypot(B.cx-p.x,B.cy-p.y)||a-b;});i=free[0];}
  p.sector=i;used.add(i);}
 for(let i=0;i<COLS*ROWS;i++){const here=st.leaves.filter(l=>l.sector===i);if(here.length>=PILE&&!used.has(i)){const c={x:here.reduce((v,l)=>v+l.x,0)/here.length,y:here.reduce((v,l)=>v+l.y,0)/here.length};st.leaves=st.leaves.filter(l=>l.sector!==i);newPile(s,i,here.length,c);used.add(i);}}
 for(const g of s.objects?.creatures?.groups||[])if(g.carry?.to)g.carry.to.sector=sectorOf(g.carry.to);
 st.grid=GRID;}
function init(s){
 const o=s.objects;if(o.litter){if(o.litter.grid!==GRID)regrid(s);return s;}
 s.rng.litter??=((s.rng.weather^0x6c8e9cf5)>>>0)||1;
 o.litter={version:1,grid:GRID,nextLeaf:1,nextPile:1,leaves:[],piles:[],fallen:0,missed:0,moves:0,migration:null};
 const z=s.patches.find(p=>p.id==='litter');
 if(z&&z.O>eps){
  // An old save's raw leaves become real piles (max 5 x 12) in the sectors nearest the old litter spot. The rest
  // stays on the old spot with its compost. Nothing is created or discarded.
  const order=[...Array(COLS*ROWS).keys()].sort((a,b)=>{const p=bounds(a),q=bounds(b);return Math.hypot(p.cx-z.x,p.cy-z.y)-Math.hypot(q.cx-z.x,q.cy-z.y)||a-b;});
  let moved=0;const from=z.O;
  for(const i of order){if(o.litter.piles.length>=MIGRATE_PILES||z.O<PILE-eps)break;const q=spot(s,i,16);if(!q)continue;const n=Math.min(SECTOR,Math.floor(z.O));z.O-=n;moved+=n;newPile(s,i,n,q);}
  o.litter.migration={tick:s.worldTick,from,moved,kept:z.O,piles:o.litter.piles.length};
 }else if(s.worldTick===0&&z){
  // New game: three real loose leaves (two in a downwind sector, one elsewhere) and compost on the old spot.
  const [a]=downwind(s);for(const i of [a,a]){const q=spot(s,i,16);if(q)land(s,i,q);}
  const other=[...Array(COLS*ROWS).keys()].find(i=>i!==a&&spot(s,i,1));if(other!==undefined){const q=spot(s,other,16);if(q)land(s,other,q);}
 }
 return s;
}
function validate(s){
 const st=state(s),f=(v,max=1e15)=>Number.isFinite(v)&&v>=-eps&&v<=max;if(!st)return;
 if(st.version!==1||(st.grid!==undefined&&st.grid!==GRID)||!Array.isArray(st.leaves)||!Array.isArray(st.piles)||!Number.isSafeInteger(st.nextLeaf)||!Number.isSafeInteger(st.nextPile)||!Number.isInteger(s.rng.litter))throw Error('낙엽 구역 기록을 확인해 주세요.');
 const seen=new Set();
 for(const l of st.leaves){if(!Number.isInteger(l.sector)||l.sector<0||l.sector>=COLS*ROWS||!World.inside(s,l,World.bounds(s))||!Number.isFinite(l.rot)||seen.has('l'+l.id))throw Error('낙엽 구역 기록을 확인해 주세요.');seen.add('l'+l.id);}
 for(const p of st.piles){if(typeof p.id!=='string'||!p.id.startsWith('pile:')||seen.has(p.id)||!Number.isInteger(p.sector)||p.sector<0||p.sector>=COLS*ROWS||!World.inside(s,p,World.bounds(s))||!f(p.O,SECTOR)||!f(p.U)||!f(p.S,100)||!f(p.W)||!f(p.playBoostUntil))throw Error('낙엽더미 기록을 확인해 주세요.');seen.add(p.id);}
 for(let i=0;i<COLS*ROWS;i++){if(st.piles.filter(p=>p.sector===i).length>1||(!st.piles.some(p=>p.sector===i)&&st.leaves.filter(l=>l.sector===i).length>=PILE))throw Error('낙엽더미 기록을 확인해 주세요.');}
 const legacy=st.migration?st.migration.moved:0;
 if(floor(s)>Math.max(LCAP,legacy)+1e-6)throw Error('바닥 낙엽이 상한을 넘었어요.');
 if(compost(s)>ucap(s)+(s.objects.overflow||0)+1e-6)throw Error('부식층 영양이 상한을 넘었어요.');
}
return {gather,land,spot,antCarry,COLS,ROWS,LCAP,SECTOR,PILE,init,step,relocate,validate,floor,compost,sectorOf,bounds,downwind,factor,rates,pile,piles,leaves,sectorRaw};
});
