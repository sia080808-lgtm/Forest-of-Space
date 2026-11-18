(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestCreatures=api;})(globalThis,function(){
'use strict';
// v2.24 patch 6a (0.6.25): carrier ants and springtails. Small neighbours, not characters: they use no roster slot.
// ECO24-B01 common arrival limit, B03 conditions, A01 real leaf carrying (one leaf, conserved), A02/N01 springtail
// decomposition help (x1.25 on its pile only, never stacked). Own RNG stream `rng.creatures`; render reads state only.
const dep=n=>typeof module==='object'?require('./'+n+'.js'):globalThis[{litter:'ForestLitter',spatial:'ForestSpace'}[n]];
const PROTECT=600,CHECK=180,COOLDOWN=600,STABLE=120,LEAVE=120,MAXG=8,ANT_EVERY=90,CARRY_SECONDS=25,SPRING=1.25;
function rnd(s){let x=s.rng.creatures>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng.creatures=x>>>0;return (x>>>0)/4294967296;}
const state=s=>s.objects.creatures;
const groups=s=>state(s)?.groups||[];
function init(s){if(!s.objects)return s;s.rng.creatures??=((s.rng.weather^0x2b7e1516)>>>0)||1;
 s.objects.creatures??={version:1,nextId:1,groups:[],lastArrival:-1e9,ready:{ant:0},pileReady:{},log:{arrived:0,left:0,carried:0}};return s;}
// ----- conditions -------------------------------------------------------------------------------------------------
function antHost(s){return s.individuals.find(p=>p.active&&!p.mounted&&p.species==='ridley'&&p.B>=35&&p.energy>=40)||null;}
function antOk(s){return !!antHost(s)&&dep('litter').leaves(s).length>=1&&s.weather.wind<60;}
function pileM(p){return p.cap?100*p.S/p.cap:0;}
function springOk(s,p){const T=s.climate.T,M=pileM(p);return p.O>=3&&s.worldTick-p.born>=60&&M>=35&&M<=75&&p.W<=1&&T>=40&&T<=75;}
function ellisiiNear(s,p){return s.individuals.some(q=>q.active&&!q.mounted&&q.species==='bonbon'&&q.B>=35&&q.energy>=40&&Math.hypot(q.x-p.x,q.y-p.y)<.2);}
const springOn=(s,pileId)=>groups(s).some(g=>g.kind==='springtail'&&g.pile===pileId);
// ----- arrival (B01: 600 s protection, a check every 180 s, at most one new group per 600 s, 8 groups max) ----------
function candidates(s){const st=state(s),out=[];
 if(!groups(s).some(g=>g.kind==='ant')&&st.ready.ant>=STABLE)out.push({kind:'ant',chance:.2});
 if(groups(s).filter(g=>g.kind==='springtail').length<2)for(const p of [...dep('litter').piles(s)].sort((a,b)=>a.id.localeCompare(b.id)))if(!springOn(s,p.id)&&(st.pileReady[p.id]||0)>=STABLE)out.push({kind:'springtail',pile:p.id,chance:ellisiiNear(s,p)?.4:.3});
 return out;}
function nestSpot(s,host){const L=dep('litter'),i=L.sectorOf(host);for(const k of [i,...[...Array(L.COLS*L.ROWS).keys()].filter(x=>x!==i)]){const q=L.spot(s,k,10);if(q)return q;}return null;}
function arrive(s,c,event){const st=state(s),g={id:'cr:'+st.nextId++,kind:c.kind,since:s.worldTick,bad:0,lastWork:s.worldTick,carry:null};
 if(c.kind==='ant'){const q=nestSpot(s,antHost(s));if(!q)return false;g.nest=q;event?.(s,'creature','짐꾼개미가 리들리 곁에 둥지를 틀었어요.');}
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
function drop(s,g){if(!g.carry)return;const L=dep('litter');L.land(s,g.carry.fromSector,{x:g.carry.fromX,y:g.carry.fromY});g.carry=null;}
// ----- step -------------------------------------------------------------------------------------------------------
function step(s,event){if(!s.objects)return;init(s);const st=state(s),L=dep('litter');
 st.ready.ant=antOk(s)?st.ready.ant+1:0;
 const ids=new Set(L.piles(s).map(p=>p.id));for(const id of Object.keys(st.pileReady))if(!ids.has(id))delete st.pileReady[id];
 for(const p of L.piles(s))st.pileReady[p.id]=springOk(s,p)?(st.pileReady[p.id]||0)+1:0;
 // stay or leave (no deletion on weather change alone: a group leaves after 120 s without its food or habitat)
 for(const g of [...st.groups]){const ok=g.kind==='ant'?antOk(s):!!L.pile(s,g.pile)&&springOk(s,L.pile(s,g.pile));g.bad=ok?0:g.bad+1;
  if(g.kind==='springtail'&&!L.pile(s,g.pile))g.bad=LEAVE;
  if(g.bad>=LEAVE){drop(s,g);st.groups=st.groups.filter(x=>x!==g);st.log.left++;event?.(s,'creature',g.kind==='ant'?'짐꾼개미가 먹이를 찾아 떠났어요.':'톡토기가 더 촉촉한 곳을 찾아 떠났어요.');}}
 for(const g of st.groups)if(g.kind==='ant')antStep(s,g);
 if(s.worldTick<PROTECT||s.worldTick%CHECK||st.groups.length>=MAXG||s.worldTick-st.lastArrival<COOLDOWN)return;
 for(const c of candidates(s)){if(rnd(s)<c.chance&&arrive(s,c,event))break;}
}
function carried(s){return groups(s).filter(g=>g.carry).length;}
function decomposeBoost(s,pileId){return springOn(s,pileId)?SPRING:1;}
function relocate(s){const L=dep('litter');for(const g of groups(s))if(g.nest&&!dep('spatial').walkable(s,g.nest)){const q=L.spot(s,L.sectorOf(g.nest),12);if(q)g.nest=q;}}
function validate(s){const st=state(s);if(!st)return;const f=v=>Number.isFinite(v);
 if(st.version!==1||!Array.isArray(st.groups)||st.groups.length>MAXG||!Number.isSafeInteger(st.nextId)||!Number.isInteger(s.rng.creatures))throw Error('작은 이웃 기록을 확인해 주세요.');
 if(st.groups.filter(g=>g.kind==='ant').length>1||st.groups.filter(g=>g.kind==='springtail').length>2)throw Error('작은 이웃 기록을 확인해 주세요.');
 for(const g of st.groups){if(!['ant','springtail'].includes(g.kind)||typeof g.id!=='string'||!f(g.since)||!f(g.bad))throw Error('작은 이웃 기록을 확인해 주세요.');
  if(g.kind==='ant'&&(!g.nest||!f(g.nest.x)||!f(g.nest.y)))throw Error('개미 둥지 기록을 확인해 주세요.');
  if(g.carry&&(!f(g.carry.fromX)||!f(g.carry.to?.x)||!Number.isInteger(g.carry.to?.sector)))throw Error('개미가 옮기는 낙엽 기록을 확인해 주세요.');
  if(g.kind==='springtail'&&typeof g.pile!=='string')throw Error('톡토기 기록을 확인해 주세요.');}}
function info(s,pileId){const g=groups(s);return {ant:g.find(x=>x.kind==='ant')||null,springtail:pileId?g.find(x=>x.kind==='springtail'&&x.pile===pileId)||null:null,count:g.length};}
return {PROTECT,CHECK,COOLDOWN,STABLE,LEAVE,ANT_EVERY,CARRY_SECONDS,SPRING,init,step,carried,decomposeBoost,relocate,validate,info,groups,antOk,springOk};
});
