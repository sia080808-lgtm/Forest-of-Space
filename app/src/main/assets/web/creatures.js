(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestCreatures=api;})(globalThis,function(){
'use strict';
// v2.24 patch 6a (0.6.25): carrier ants and springtails. Small neighbours, not characters: they use no roster slot.
// ECO24-B01 common arrival limit, B03 conditions, A01 real leaf carrying (one leaf, conserved), A02/N01 springtail
// decomposition help (x1.25 on its pile only, never stacked). Own RNG stream `rng.creatures`; render reads state only.
const dep=n=>typeof module==='object'?require('./'+n+'.js'):globalThis[{litter:'ForestLitter',spatial:'ForestSpace',shelter:'ForestShelter'}[n]];
const PROTECT=600,CHECK=180,COOLDOWN=600,STABLE=120,LEAVE=120,MAXG=8,ANT_EVERY=90,CARRY_SECONDS=25,SPRING=1.25;
// 0.6.26 patch 6b: spider mite P02 (pest on a friend's leaves) and its predator 잎지기 (Phytoseiulus). SRS v2.22 S05.05·S05.09
// ECO-05/07/08/11/12/14 with the v2.24 user decision: they can also appear in the default climate on locally dry leaves.
const MITE={START:12,MAX:100,GROW:4,DECLINE:6,CLEAN:4,GONE:5,GONE_SECONDS:60,PAUSE:300,HURT:2,FIT_T:65,FIT_H:35,HOLD_H:55,DRY_FADE:600,DRY_MAX:240},
 KEEPER={MIN_PREY:8,H_MIN:45,H_MAX:80,EAT:8,READY:120,EVERY:60,CHANCE:.3,SURE:300};
function rnd(s){let x=s.rng.creatures>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng.creatures=x>>>0;return (x>>>0)/4294967296;}
const state=s=>s.objects.creatures;
const groups=s=>state(s)?.groups||[];
function init(s){if(!s.objects)return s;s.rng.creatures??=((s.rng.weather^0x2b7e1516)>>>0)||1;
 s.objects.creatures??={version:1,nextId:1,groups:[],lastArrival:-1e9,ready:{ant:0},pileReady:{},log:{arrived:0,left:0,carried:0}};const st=s.objects.creatures;st.miteReady??={};st.keeperReady??={};st.pause??={};st.log.eaten??=0;st.log.cleared??=0;return s;}
// ----- conditions -------------------------------------------------------------------------------------------------
function antHost(s){return s.individuals.find(p=>p.active&&!p.mounted&&p.species==='ridley'&&p.B>=35&&p.energy>=40)||null;}
function antOk(s){return !!antHost(s)&&dep('litter').leaves(s).length>=1&&s.weather.wind<60;}
function pileM(p){return p.cap?100*p.S/p.cap:0;}
function springOk(s,p){const T=s.climate.T,M=pileM(p);return p.O>=3&&s.worldTick-p.born>=60&&M>=35&&M<=75&&p.W<=1&&T>=40&&T<=75;}
function ellisiiNear(s,p){return s.individuals.some(q=>q.active&&!q.mounted&&q.species==='bonbon'&&q.B>=35&&q.energy>=40&&Math.hypot(q.x-p.x,q.y-p.y)<.2);}
// leaf micro-climate of one friend: sun on bare ground and a hot sun rock dry the leaves; water, moss, shade and the
// shelter keep them moist. Wet weather never dries them. (Game model; not a pest-control prescription.)
function leaf(s,p){const Space=dep('spatial'),T=s.climate.T,H=s.climate.H,kind=s.weather.kind,wet=['rain','fog','snow'].includes(kind)||(s.weather.precipitation||0)>0;
 const near=(id,r)=>s.patches.some(z=>z.id===id&&Math.hypot(z.x-p.x,z.y-p.y)<r),inside=!!dep('shelter').inside?.(s,p),rock=Space.onRock(s,p);
 const ds=Math.hypot(s.spring.x-p.x,s.spring.y-p.y),dm=Math.min(...s.patches.filter(z=>z.id==='moss').map(z=>Math.hypot(z.x-p.x,z.y-p.y)),9);
 let h=H,t=T;if(!wet&&kind==='sun'&&!near('shade',.145)&&!inside){h-=10;if(rock){h-=25;t+=6;}}if(!wet&&p.B<35)h-=10;
 if(ds<.2||dm<.13)h+=10;else if(!wet&&ds>.35&&dm>.3)h-=5;if(inside)h+=10;
 return {T:t,H:Math.max(0,Math.min(100,h)),wet,inside,rock};}
const live=p=>p&&p.active&&!p.mounted;
function miteFit(s,p){const l=leaf(s,p);return live(p)&&!l.inside&&!l.wet&&l.T>=MITE.FIT_T&&l.H<=MITE.FIT_H;}
function keeperFit(s,p){const l=leaf(s,p);return live(p)&&l.H>=KEEPER.H_MIN&&l.H<=KEEPER.H_MAX;}
const miteOn=(s,host)=>groups(s).find(g=>g.kind==='mite'&&g.host===host)||null;
const springOn=(s,pileId)=>groups(s).some(g=>g.kind==='springtail'&&g.pile===pileId);
// ----- arrival (B01: 600 s protection, a check every 180 s, at most one new group per 600 s, 8 groups max) ----------
function candidates(s){const st=state(s),out=[];
 if(!groups(s).some(g=>g.kind==='ant')&&st.ready.ant>=STABLE)out.push({kind:'ant',chance:.2});
 if(groups(s).filter(g=>g.kind==='springtail').length<2)for(const p of [...dep('litter').piles(s)].sort((a,b)=>a.id.localeCompare(b.id)))if(!springOn(s,p.id)&&(st.pileReady[p.id]||0)>=STABLE)out.push({kind:'springtail',pile:p.id,chance:ellisiiNear(s,p)?.4:.3});
 for(const p of [...s.individuals].sort((a,b)=>a.id.localeCompare(b.id)))if(live(p)&&!miteOn(s,p.id)&&!(st.pause[p.id]>s.worldTick)&&(st.miteReady[p.id]||0)>=STABLE)out.push({kind:'mite',host:p.id,chance:.2});
 return out;}
function nestSpot(s,host){const L=dep('litter'),i=L.sectorOf(host);for(const k of [i,...[...Array(L.COLS*L.ROWS).keys()].filter(x=>x!==i)]){const q=L.spot(s,k,10);if(q)return q;}return null;}
function arrive(s,c,event){const st=state(s),g={id:'cr:'+st.nextId++,kind:c.kind,since:s.worldTick,bad:0,lastWork:s.worldTick,carry:null};
 if(c.kind==='ant'){const q=nestSpot(s,antHost(s));if(!q)return false;g.nest=q;event?.(s,'creature','짐꾼개미가 리들리 곁에 둥지를 틀었어요.');}
 else if(c.kind==='mite'){const p=s.individuals.find(q=>q.id===c.host);g.host=c.host;g.density=MITE.START;g.low=0;event?.(s,'creature',`${p.name}의 마른 잎에 잎응애가 자리를 잡았어요.`);}
 else{g.pile=c.pile;event?.(s,'creature','톡토기가 촉촉한 낙엽더미에 찾아왔어요.');}
 st.groups.push(g);st.lastArrival=s.worldTick;st.log.arrived++;return true;}
// ----- ant work (A01): one real loose leaf per 90 s, toward a pile with room or a gathering of loose leaves -----------
function antTarget(s,leaf){const L=dep('litter'),from=leaf.sector,cols=L.COLS,dist=i=>Math.abs(i%cols-from%cols)+Math.abs(Math.floor(i/cols)-Math.floor(from/cols));
 const opts=[];for(let i=0;i<cols*L.ROWS;i++){if(i===from||dist(i)>1)continue;const p=L.piles(s).find(z=>z.sector===i),loose=L.leaves(s).filter(l=>l.sector===i).length;if(L.sectorRaw(s,i)+1>L.SECTOR)continue;
  if(p)opts.push({i,score:3,q:{x:p.x,y:p.y}});else if(loose>=2)opts.push({i,score:loose,q:{...L.leaves(s).find(l=>l.sector===i)}});}
 opts.sort((a,b)=>b.score-a.score||a.i-b.i);return opts[0]||null;}
function antStep(s,g){const L=dep('litter'),st=state(s);
 if(g.carry){if(s.worldTick>=g.carry.arrive){const to=g.carry.to,room=L.sectorRaw(s,to.sector)+1<=L.SECTOR;const sec=room?to.sector:g.carry.fromSector;const q=room?to:{x:g.carry.fromX,y:g.carry.fromY};
   g.carry=null;L.land(s,sec,{x:q.x+(rnd(s)-.5)*.02,y:q.y+(rnd(s)-.5)*.012});st.log.carried++;g.lastWork=s.worldTick;}return;}
 if(s.worldTick-g.lastWork<ANT_EVERY)return;
 // the loosest leaf: in a sector with the fewest loose leaves and no pile, nearest to the nest
 const cands=L.leaves(s).filter(l=>!L.piles(s).some(p=>p.sector===l.sector)).map(l=>({l,t:antTarget(s,l)})).filter(x=>x.t).sort((a,b)=>Math.hypot(a.l.x-g.nest.x,a.l.y-g.nest.y)-Math.hypot(b.l.x-g.nest.x,b.l.y-g.nest.y)||a.l.id-b.l.id);
 const pick=cands[0];if(!pick){g.lastWork=s.worldTick;return;}
 s.objects.litter.leaves=s.objects.litter.leaves.filter(l=>l!==pick.l);
 g.carry={leafId:pick.l.id,rot:pick.l.rot,fromSector:pick.l.sector,fromX:pick.l.x,fromY:pick.l.y,to:{sector:pick.t.i,x:pick.t.q.x,y:pick.t.q.y},start:s.worldTick,arrive:s.worldTick+Math.max(CARRY_SECONDS,Math.round((Math.hypot(pick.l.x-g.nest.x,pick.l.y-g.nest.y)+Math.hypot(pick.t.q.x-pick.l.x,pick.t.q.y-pick.l.y))/.012))};}
// ----- spider mite (P02): density 12 on arrival, +4/min on dry hot leaves, steady on mildly dry leaves, -6/min when the
// leaf is moist again; -4/min while the friend tidies its leaves or rests in the shelter (no growth there). Leaf burden
// 2/min x density/100 (ECO-14). Under 5 for 60 s = recovered; that friend gets 300 s before a new arrival.
function miteStep(s,g,event){const st=state(s),p=s.individuals.find(q=>q.id===g.host);if(!p||!live(p))return;const l=leaf(s,p);
 let d=g.density;if(l.inside)d-=MITE.CLEAN/60;else if(!l.wet&&l.T>=MITE.FIT_T&&l.H<=MITE.FIT_H)d+=MITE.GROW/60;else if(l.wet||l.H>MITE.HOLD_H)d-=MITE.DECLINE/60;
 if(p.action==='groom')d-=MITE.CLEAN/60;g.density=Math.max(0,Math.min(MITE.MAX,d));
 p.damage=Math.min(100,p.damage+Math.min(MITE.HURT,MITE.HURT*g.density/100)/60);
 g.low=g.density<MITE.GONE?g.low+1:0;if(g.low>=MITE.GONE_SECONDS){st.groups=st.groups.filter(x=>x!==g);st.pause[p.id]=s.worldTick+MITE.PAUSE;st.log.cleared++;event?.(s,'creature',`${p.name}의 잎이 다시 건강해졌어요. 잎응애가 거의 사라졌어요.`);}}
// ----- 잎지기 (ECO-07/08/12): needs real prey (mite density >= 8) on a reachable leaf with leaf humidity 45~80 for 120 s,
// then 30% every valid 60 s, sure at 300 s. Eats up to 8 density/min of the prey actually present (never below 0) and
// leaves after 120 s without prey or habitat. No substitute food is created.
function keeperStep(s,g,event){const st=state(s),p=s.individuals.find(q=>q.id===g.host),m=miteOn(s,g.host);
 if(!p){st.groups=st.groups.filter(x=>x!==g);return;}if(!live(p))return;const ok=keeperFit(s,p);
 if(ok&&m&&m.density>0){const bite=Math.min(m.density,KEEPER.EAT/60);m.density-=bite;g.eaten=(g.eaten||0)+bite;st.log.eaten+=bite;}
 g.bad=ok&&m&&m.density>=1?0:g.bad+1;if(g.bad>=LEAVE){st.groups=st.groups.filter(x=>x!==g);st.log.left++;event?.(s,'creature',m?'잎지기가 더 알맞은 잎을 찾아 떠났어요.':'잎지기가 먹이를 다 찾아 먹고 떠났어요.');}}
function keeperArrivals(s,event){const st=state(s);
 for(const p of [...s.individuals].sort((a,b)=>a.id.localeCompare(b.id))){const m=miteOn(s,p.id),has=groups(s).some(g=>g.kind==='keeper'&&g.host===p.id);
  if(has||!m||m.density<KEEPER.MIN_PREY||!keeperFit(s,p)){if(!has)st.keeperReady[p.id]=0;continue;}
  const r=st.keeperReady[p.id]=(st.keeperReady[p.id]||0)+1;if(st.groups.length>=MAXG||r<KEEPER.READY)continue;
  if(r>=KEEPER.SURE||((r-KEEPER.READY)%KEEPER.EVERY===0&&rnd(s)<KEEPER.CHANCE)){st.groups.push({id:'cr:'+st.nextId++,kind:'keeper',host:p.id,since:s.worldTick,bad:0,eaten:0,lastWork:s.worldTick,carry:null});st.keeperReady[p.id]=0;st.log.arrived++;event?.(s,'creature',`잎지기가 ${p.name}의 잎에서 잎응애를 찾기 시작했어요.`);}}}
function drop(s,g){if(!g.carry)return;const L=dep('litter');L.land(s,g.carry.fromSector,{x:g.carry.fromX,y:g.carry.fromY});g.carry=null;}
// ----- step -------------------------------------------------------------------------------------------------------
function step(s,event){if(!s.objects)return;init(s);const st=state(s),L=dep('litter');
 st.ready.ant=antOk(s)?st.ready.ant+1:0;
 const ids=new Set(L.piles(s).map(p=>p.id));for(const id of Object.keys(st.pileReady))if(!ids.has(id))delete st.pileReady[id];
 for(const p of L.piles(s))st.pileReady[p.id]=springOk(s,p)?(st.pileReady[p.id]||0)+1:0;
 for(const id of Object.keys(st.miteReady))if(!s.individuals.some(p=>p.id===id))delete st.miteReady[id];
 for(const p of s.individuals)if(live(p))st.miteReady[p.id]=miteFit(s,p)?Math.min(MITE.DRY_MAX,(st.miteReady[p.id]||0)+1):Math.max(0,(st.miteReady[p.id]||0)-1/MITE.DRY_FADE);
 st.groups=st.groups.filter(g=>!['mite','keeper'].includes(g.kind)||s.individuals.some(p=>p.id===g.host));
 // stay or leave (no deletion on weather change alone: a group leaves after 120 s without its food or habitat)
 for(const g of [...st.groups]){if(g.kind==='mite'){miteStep(s,g,event);continue;}if(g.kind==='keeper'){keeperStep(s,g,event);continue;}const ok=g.kind==='ant'?antOk(s):!!L.pile(s,g.pile)&&springOk(s,L.pile(s,g.pile));g.bad=ok?0:g.bad+1;
  if(g.kind==='springtail'&&!L.pile(s,g.pile))g.bad=LEAVE;
  if(g.bad>=LEAVE){drop(s,g);st.groups=st.groups.filter(x=>x!==g);st.log.left++;event?.(s,'creature',g.kind==='ant'?'짐꾼개미가 먹이를 찾아 떠났어요.':'톡토기가 더 촉촉한 곳을 찾아 떠났어요.');}}
 for(const g of st.groups)if(g.kind==='ant')antStep(s,g);
 keeperArrivals(s,event);
 if(s.worldTick<PROTECT||s.worldTick%CHECK||st.groups.length>=MAXG||s.worldTick-st.lastArrival<COOLDOWN)return;
 for(const c of candidates(s)){if(rnd(s)<c.chance&&arrive(s,c,event))break;}
}
function carried(s){return groups(s).filter(g=>g.carry).length;}
function decomposeBoost(s,pileId){return springOn(s,pileId)?SPRING:1;}
function relocate(s){const L=dep('litter');for(const g of groups(s))if(g.nest&&!dep('spatial').walkable(s,g.nest)){const q=L.spot(s,L.sectorOf(g.nest),12);if(q)g.nest=q;}}
function validate(s){const st=state(s);if(!st)return;const f=v=>Number.isFinite(v);
 if(st.version!==1||!Array.isArray(st.groups)||st.groups.length>MAXG||!Number.isSafeInteger(st.nextId)||!Number.isInteger(s.rng.creatures))throw Error('작은 이웃 기록을 확인해 주세요.');
 if(st.groups.filter(g=>g.kind==='ant').length>1||st.groups.filter(g=>g.kind==='springtail').length>2||['mite','keeper'].some(k=>{const h=st.groups.filter(g=>g.kind===k).map(g=>g.host);return new Set(h).size!==h.length;}))throw Error('작은 이웃 기록을 확인해 주세요.');
 for(const g of st.groups){if(!['ant','springtail','mite','keeper'].includes(g.kind)||typeof g.id!=='string'||!f(g.since)||!f(g.bad))throw Error('작은 이웃 기록을 확인해 주세요.');
  if(g.kind==='ant'&&(!g.nest||!f(g.nest.x)||!f(g.nest.y)))throw Error('개미 둥지 기록을 확인해 주세요.');
  if(g.carry&&(!f(g.carry.fromX)||!f(g.carry.to?.x)||!Number.isInteger(g.carry.to?.sector)))throw Error('개미가 옮기는 낙엽 기록을 확인해 주세요.');
  if(g.kind==='springtail'&&typeof g.pile!=='string')throw Error('톡토기 기록을 확인해 주세요.');
  if(['mite','keeper'].includes(g.kind)&&typeof g.host!=='string')throw Error('잎 위 작은 이웃 기록을 확인해 주세요.');
  if(g.kind==='mite'&&(!f(g.density)||g.density<0||g.density>MITE.MAX||!f(g.low)))throw Error('잎응애 기록을 확인해 주세요.');}}
function info(s,pileId){const g=groups(s);return {ant:g.find(x=>x.kind==='ant')||null,springtail:pileId?g.find(x=>x.kind==='springtail'&&x.pile===pileId)||null:null,count:g.length};}
function onLeaf(s,host){return {mite:miteOn(s,host),keeper:groups(s).find(g=>g.kind==='keeper'&&g.host===host)||null};}
return {PROTECT,CHECK,COOLDOWN,STABLE,LEAVE,ANT_EVERY,CARRY_SECONDS,SPRING,MITE,KEEPER,init,step,carried,decomposeBoost,relocate,validate,info,onLeaf,groups,antOk,springOk,leaf,miteFit,keeperFit};
});
