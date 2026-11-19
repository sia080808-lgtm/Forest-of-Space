(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestCreatures=api;})(globalThis,function(){
'use strict';
// v2.24 patch 6a (0.6.25): carrier ants and springtails. Small neighbours, not characters: they use no roster slot.
// ECO24-B01 common arrival limit, B03 conditions, A01 real leaf carrying (one leaf, conserved), A02/N01 springtail
// decomposition help (x1.25 on its pile only, never stacked). Own RNG stream `rng.creatures`; render reads state only.
const dep=n=>typeof module==='object'?require('./'+n+'.js'):globalThis[{litter:'ForestLitter',spatial:'ForestSpace',shelter:'ForestShelter',neolbi:'ForestNeolbi',traits:'ForestTraits'}[n]];
const trait=p=>dep('traits').of(p?.species);
const PROTECT=600,CHECK=180,COOLDOWN=600,STABLE=120,LEAVE=120,MAXG=8,ANT_EVERY=90,CARRY_SECONDS=25,SPRING=1.25;
// 0.6.26 patch 6b: spider mite P02 (pest on a friend's leaves) and its predator 잎지기 (Phytoseiulus). SRS v2.22 S05.05·S05.09
// ECO-05/07/08/11/12/14 with the v2.24 user decision: they can also appear in the default climate on locally dry leaves.
const MITE={START:12,MAX:100,GROW:4,DECLINE:6,CLEAN:4,GONE:5,GONE_SECONDS:60,PAUSE:300,HURT:2,FIT_T:65,FIT_H:35,HOLD_H:55,DRY_FADE:600,DRY_MAX:240},
 KEEPER={MIN_PREY:8,H_MIN:45,H_MAX:80,EAT:8,READY:120,EVERY:60,CHANCE:.3,SURE:300};
// 0.6.27 patch 6c: root fly P01 (뿌리날파리) in wet decaying litter, its soil predator 흙지기 (Stratiolaelaps), mealybug P03
// (솜깍지) between leaves with honeydew, the conditional ant relation (X04) and its predator 점박이 (Cryptolaemus).
// SRS v2.22 S05.05·S05.06·S05.09 (ECO-05/07/08/11/12/14/15). A friend's pest harm is capped at 2/min in total.
const GNAT={START:12,MAX:100,BREED:4,DECLINE:6,EGG:90,LARVA:180,ADULT_LIFE:600,FIT_M:70,HOLD_M:50,ORGANIC:4,T_MIN:45,T_MAX:80,HURT:2,NEAR:.12,GONE:5,GONE_SECONDS:60,PAUSE:300},
 SOIL={MIN_PREY:5,M_MIN:35,M_MAX:65,W_MAX:10,EAT:8,U:1},
 MEALY={START:12,MAX:100,GROW:4,DECLINE:6,CLEAN:4,T_MIN:50,T_MAX:80,SAC:20,HONEY:8,HONEY_DECAY:.6,HONEY_MAX:100,HURT:2,GONE:5,GONE_SECONDS:60,PAUSE:300,GAP_FADE:600,GAP_MAX:240},
 LADY={MIN_PREY:20,NOTICE:120,EAT:8,TENDED:.5,HOP:.2},TEND={ON:10,ON_SECONDS:30,OFF:5,OFF_SECONDS:60},HARM_MAX=2,PEST_TYPES=2;
const PESTS=['mite','gnat','mealy'];
// 0.6.28: 쏙쏙이 (Dalotia coriaria, rove beetle) — a second root-zone predator. Needs real root-fly larvae/eggs (>= 5) at a
// site whose soil is moist but drained AND a hideout (바위틈 or 햇살 바위 within 0.3) for 120 s; ECO-07 arrival. Eats up to
// 8/min; at one site 흙지기 + 쏙쏙이 share 12/min (ECO-08 zone total). No substitute food (ECO-12): leaves after 120 s
// without prey. 돌돌이 (pillbug, a detritivore) helps decompose the litter near the crevice x1.1 while it visits.
const ROVE={MIN_PREY:5,EAT:8,HIDE:.3},ZONE_EAT=12,PILL={NEAR:.25,BOOST:1.1};
function rnd(s){let x=s.rng.creatures>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng.creatures=x>>>0;return (x>>>0)/4294967296;}
const state=s=>s.objects.creatures;
const groups=s=>state(s)?.groups||[];
function init(s){if(!s.objects)return s;s.rng.creatures??=((s.rng.weather^0x2b7e1516)>>>0)||1;
 s.objects.creatures??={version:1,nextId:1,groups:[],lastArrival:-1e9,ready:{ant:0},pileReady:{},log:{arrived:0,left:0,carried:0}};const st=s.objects.creatures;st.miteReady??={};st.keeperReady??={};st.pause??={};st.log.eaten??=0;st.log.cleared??=0;st.gnatReady??={};st.soilReady??={};st.mealyReady??={};st.ladyReady??={};st.honeyHigh??=0;st.honeyLow??=0;st.roveReady??={};st.seen??={};return s;}
// ----- conditions -------------------------------------------------------------------------------------------------
function antHost(s){return s.individuals.find(p=>p.active&&!p.mounted&&p.species==='ridley'&&p.B>=35&&p.energy>=40)||null;}
function antOk(s){return !!antHost(s)&&dep('litter').leaves(s).length>=1&&s.weather.wind<60;}
function pileM(p){return p.cap?100*p.S/p.cap:0;}
function springOk(s,p){const T=s.climate.T,M=pileM(p);return p.O>=3&&s.worldTick-p.born>=60&&M>=35&&M<=75&&p.W<=1&&T>=40&&T<=75;}
function ellisiiNear(s,p){return s.individuals.some(q=>q.active&&!q.mounted&&q.species==='bonbon'&&q.B>=35&&q.energy>=40&&Math.hypot(q.x-p.x,q.y-p.y)<.2);}
// 엘레판's spread leaf is a real shade for the friends under it (same as the shade plant for leaf drying)
function canopy(s,p){const N=dep('neolbi');return s.individuals.some(q=>q!==p&&q.active&&!q.mounted&&q.species==='neolbi'&&q.canopyProgress>0&&(()=>{const g=N.geometry(q);return ((p.x-g.cx)/g.rx)**2+((p.y-g.cy)/g.ry)**2<=1;})());}
// leaf micro-climate of one friend: sun on bare ground and a hot sun rock dry the leaves; water, moss, shade and the
// shelter keep them moist. Wet weather never dries them. (Game model; not a pest-control prescription.)
function leaf(s,p){const Space=dep('spatial'),T=s.climate.T,H=s.climate.H,kind=s.weather.kind,wet=['rain','fog','snow'].includes(kind)||(s.weather.precipitation||0)>0;
 const near=(id,r)=>s.patches.some(z=>z.id===id&&Math.hypot(z.x-p.x,z.y-p.y)<r)||(id==='shade'&&canopy(s,p)),inside=!!dep('shelter').inside?.(s,p),rock=Space.onRock(s,p);
 const ds=Math.hypot(s.spring.x-p.x,s.spring.y-p.y),dm=Math.min(...s.patches.filter(z=>z.id==='moss').map(z=>Math.hypot(z.x-p.x,z.y-p.y)),9);
 let h=H,t=T;if(!wet&&kind==='sun'&&!near('shade',.145)&&!inside){h-=10;if(rock){h-=25;t+=6;}}if(!wet&&p.B<35)h-=10;
 if(ds<.2||dm<.13)h+=10;else if(!wet&&ds>.35&&dm>.3)h-=5;if(inside)h+=10;
 return {T:t,H:Math.max(0,Math.min(100,h)),wet,inside,rock};}
const live=p=>p&&p.active&&!p.mounted;
function miteFit(s,p){const l=leaf(s,p);return live(p)&&!l.inside&&!l.wet&&l.T>=MITE.FIT_T&&l.H<=MITE.FIT_H;}
function keeperFit(s,p){const l=leaf(s,p);return live(p)&&l.H>=KEEPER.H_MIN&&l.H<=KEEPER.H_MAX;}
const miteOn=(s,host)=>groups(s).find(g=>g.kind==='mite'&&g.host===host)||null;
const springOn=(s,pileId)=>groups(s).some(g=>g.kind==='springtail'&&g.pile===pileId);
// one shared pest-harm budget per friend per second (ECO-05: extra burden from pests at most 2/min in total)
function harm(s,p,key,amount){if(key==='damage')amount*=trait(p).leaf;const st=state(s),used=st._harm?.[p.id]||0,room=Math.max(0,HARM_MAX/60-used),a=Math.min(room,Math.max(0,amount));if(!a)return 0;(st._harm??={})[p.id]=used+a;p[key]=Math.min(100,Math.max(0,p[key]+(key==='nutrition'?-a:a)));return a;}
const pestKinds=s=>new Set(groups(s).filter(g=>PESTS.includes(g.kind)).map(g=>g.kind));
const pestRoom=(s,kind)=>{const k=pestKinds(s);return k.has(kind)||k.size<PEST_TYPES;};
// root-fly sites: the old litter spot and leaf piles (wet decaying leaves). Moisture is the litter soil M/W (0.6.25).
function sites(s){const L=dep('litter'),z=s.patches.find(q=>q.id==='litter');return [...(z?[z]:[]),...L.piles(s)];}
const site=(s,id)=>sites(s).find(z=>z.id===id)||null;
const siteM=z=>z.cap?100*z.S/z.cap:0;
function gnatFit(s,z){const T=s.climate.T;return siteM(z)>=GNAT.FIT_M&&(z.O||0)+(z.U||0)>=GNAT.ORGANIC&&T>=GNAT.T_MIN&&T<=GNAT.T_MAX&&s.weather.kind!=='snow';}
// SRS M 35~65: the litter soil saturates at 100 easily (like the moss fix in 0.6.22), so 'moist but drained' = M>=35, W<10
function soilFit(s,z){const M=siteM(z);return M>=SOIL.M_MIN&&z.W<SOIL.W_MAX;}
const gnatAt=(s,id)=>groups(s).find(g=>g.kind==='gnat'&&g.site===id)||null;
function hideout(s,z){return s.patches.filter(q=>['crevice','rock'].includes(q.id)).sort((a,b)=>Math.hypot(a.x-z.x,a.y-z.y)-Math.hypot(b.x-z.x,b.y-z.y)).find(q=>Math.hypot(q.x-z.x,q.y-z.y)<ROVE.HIDE)||null;}
function roveFit(s,z){return soilFit(s,z)&&!!hideout(s,z);}
// ECO-08: predators at one site share one budget per second
function zoneBite(s,siteId,want){const st=state(s),used=(st._zone??={})[siteId]||0,a=Math.max(0,Math.min(want,ZONE_EAT/60-used));st._zone[siteId]=used+a;return a;}
const gnatTotal=g=>g.eggs+g.larvae+g.adults;
// mealybug: warm (T 50~80) and a 'between leaves' place — in a leaf shade or with leaves touching another friend
function leafGap(s,p){return s.patches.some(z=>z.id==='shade'&&Math.hypot(z.x-p.x,z.y-p.y)<.145)||s.individuals.some(q=>q!==p&&live(q)&&Math.hypot(q.x-p.x,q.y-p.y)<.08);}
function mealyFit(s,p){const T=s.climate.T;return live(p)&&!dep('shelter').inside?.(s,p)&&T>=MEALY.T_MIN&&T<=MEALY.T_MAX&&leafGap(s,p);}
const mealyOn=(s,host)=>groups(s).find(g=>g.kind==='mealy'&&g.host===host)||null;
// ----- arrival (B01: 600 s protection, a check every 180 s, at most one new group per 600 s, 8 groups max) ----------
function candidates(s){const st=state(s),out=[];
 if(!groups(s).some(g=>g.kind==='ant')&&st.ready.ant>=STABLE)out.push({kind:'ant',chance:.2});
 if(groups(s).filter(g=>g.kind==='springtail').length<2)for(const p of [...dep('litter').piles(s)].sort((a,b)=>a.id.localeCompare(b.id)))if(!springOn(s,p.id)&&(st.pileReady[p.id]||0)>=STABLE)out.push({kind:'springtail',pile:p.id,chance:ellisiiNear(s,p)?.4:.3});
 for(const p of [...s.individuals].sort((a,b)=>a.id.localeCompare(b.id)))if(live(p)&&!miteOn(s,p.id)&&!(st.pause[p.id]>s.worldTick)&&(st.miteReady[p.id]||0)>=STABLE&&pestRoom(s,'mite'))out.push({kind:'mite',host:p.id,chance:.2*trait(p).mite});
 if(groups(s).filter(g=>g.kind==='gnat').length<2)for(const z of sites(s))if(!gnatAt(s,z.id)&&!(st.pause['site:'+z.id]>s.worldTick)&&(st.gnatReady[z.id]||0)>=STABLE&&pestRoom(s,'gnat'))out.push({kind:'gnat',site:z.id,chance:.2});
 for(const p of [...s.individuals].sort((a,b)=>a.id.localeCompare(b.id)))if(live(p)&&!mealyOn(s,p.id)&&!(st.pause['mealy:'+p.id]>s.worldTick)&&(st.mealyReady[p.id]||0)>=STABLE&&pestRoom(s,'mealy'))out.push({kind:'mealy',host:p.id,chance:.2*trait(p).mealy});
 return out;}
function nestSpot(s,host){const L=dep('litter'),i=L.sectorOf(host);for(const k of [i,...[...Array(L.COLS*L.ROWS).keys()].filter(x=>x!==i)]){const q=L.spot(s,k,10);if(q)return q;}return null;}
function arrive(s,c,event){const st=state(s),g={id:'cr:'+st.nextId++,kind:c.kind,since:s.worldTick,bad:0,lastWork:s.worldTick,carry:null};
 if(c.kind==='ant'){const q=nestSpot(s,antHost(s));if(!q)return false;g.nest=q;event?.(s,'creature','짐꾼개미가 리들리 곁에 둥지를 틀었어요.');}
 else if(c.kind==='gnat'){g.site=c.site;g.adults=GNAT.START;g.eggs=0;g.larvae=0;g.low=0;g.fit=0;event?.(s,'creature',c.site==='litter'?'젖은 거름 자리에 뿌리날파리가 날아들었어요.':'젖은 낙엽더미에 뿌리날파리가 날아들었어요.');}
 else if(c.kind==='mealy'){const p=s.individuals.find(q=>q.id===c.host);g.host=c.host;g.density=MEALY.START;g.honey=0;g.low=0;event?.(s,'creature',`${p.name}의 잎 사이에 솜깍지가 붙었어요.`);}
 else if(c.kind==='mite'){const p=s.individuals.find(q=>q.id===c.host);g.host=c.host;g.density=MITE.START;g.low=0;event?.(s,'creature',`${p.name}의 마른 잎에 잎응애가 자리를 잡았어요.`);}
 else{g.pile=c.pile;event?.(s,'creature','톡토기가 촉촉한 낙엽더미에 찾아왔어요.');}
 st.groups.push(g);st.seen[c.kind]=1;if(PESTS.includes(c.kind))st.lastPest=s.worldTick;else st.lastArrival=s.worldTick;st.log.arrived++;return true;}
// ----- ant work (A01): one real loose leaf per 90 s, toward a pile with room or a gathering of loose leaves -----------
function antTarget(s,leaf){const L=dep('litter'),from=leaf.sector,cols=L.COLS,dist=i=>Math.abs(i%cols-from%cols)+Math.abs(Math.floor(i/cols)-Math.floor(from/cols));
 const opts=[];for(let i=0;i<cols*L.ROWS;i++){if(i===from||dist(i)>1)continue;const p=L.piles(s).find(z=>z.sector===i),loose=L.leaves(s).filter(l=>l.sector===i).length;if(L.sectorRaw(s,i)+1>L.SECTOR)continue;
  if(p)opts.push({i,score:3,q:{x:p.x,y:p.y}});else if(loose>=2)opts.push({i,score:loose,q:{...L.leaves(s).find(l=>l.sector===i)}});}
 opts.sort((a,b)=>b.score-a.score||a.i-b.i);return opts[0]||null;}
function antStep(s,g){const L=dep('litter'),st=state(s);
 if(g.carry){if(s.worldTick>=g.carry.arrive){const to=g.carry.to,room=L.sectorRaw(s,to.sector)+1<=L.SECTOR;const sec=room?to.sector:g.carry.fromSector;const q=room?to:{x:g.carry.fromX,y:g.carry.fromY};
   g.carry=null;L.land(s,sec,{x:q.x+(rnd(s)-.5)*.02,y:q.y+(rnd(s)-.5)*.012});st.log.carried++;g.lastWork=s.worldTick;}return;}
 if(g.tend||s.worldTick-g.lastWork<ANT_EVERY)return;
 // the loosest leaf: in a sector with the fewest loose leaves and no pile, nearest to the nest
 const cands=L.leaves(s).filter(l=>!L.piles(s).some(p=>p.sector===l.sector)).map(l=>({l,t:antTarget(s,l)})).filter(x=>x.t).sort((a,b)=>Math.hypot(a.l.x-g.nest.x,a.l.y-g.nest.y)-Math.hypot(b.l.x-g.nest.x,b.l.y-g.nest.y)||a.l.id-b.l.id);
 const pick=cands[0];if(!pick){g.lastWork=s.worldTick;return;}
 s.objects.litter.leaves=s.objects.litter.leaves.filter(l=>l!==pick.l);
 g.carry={leafId:pick.l.id,rot:pick.l.rot,fromSector:pick.l.sector,fromX:pick.l.x,fromY:pick.l.y,to:{sector:pick.t.i,x:pick.t.q.x,y:pick.t.q.y},start:s.worldTick,arrive:s.worldTick+Math.max(CARRY_SECONDS,Math.round((Math.hypot(pick.l.x-g.nest.x,pick.l.y-g.nest.y)+Math.hypot(pick.t.q.x-pick.l.x,pick.t.q.y-pick.l.y))/.012))};}
// ----- spider mite (P02): density 12 on arrival, +4/min on dry hot leaves, steady on mildly dry leaves, -6/min when the
// leaf is moist again; -4/min while the friend tidies its leaves or rests in the shelter (no growth there). Leaf burden
// 2/min x density/100 (ECO-14). Under 5 for 60 s = recovered; that friend gets 300 s before a new arrival.
function miteStep(s,g,event){const st=state(s),p=s.individuals.find(q=>q.id===g.host);if(!p||!live(p))return;const l=leaf(s,p);
 let d=g.density;if(l.inside)d-=MITE.CLEAN/60;else if(!l.wet&&l.T>=MITE.FIT_T&&l.H<=MITE.FIT_H)d+=MITE.GROW/60*trait(p).miteGrow;else if(l.wet||l.H>MITE.HOLD_H)d-=MITE.DECLINE/60;
 if(p.action==='groom')d-=MITE.CLEAN/60;g.density=Math.max(0,Math.min(MITE.MAX,d));
 harm(s,p,'damage',Math.min(MITE.HURT,MITE.HURT*g.density/100)/60);
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
// ----- 뿌리날파리 P01 (ECO-11): adults arrive (12); after 120 s on a fitting site they lay eggs at +4/min (full rate from 4
// adults), eggs hatch over 90 s, larvae become adults over 180 s (density moves between stages, never copied), adults live ~600 s.
// Site moisture 50~70 = steady, under 50 or snow = -6/min across stages. Larvae burden the roots of friends at the site.
function gnatStep(s,g,event){const st=state(s),z=site(s,g.site);if(!z){st.groups=st.groups.filter(x=>x!==g);return;}
 const fit=gnatFit(s,z),M=siteM(z),down=!fit&&(M<GNAT.HOLD_M||s.weather.kind==='snow'||s.climate.T<GNAT.T_MIN||s.climate.T>GNAT.T_MAX);g.fit=fit?g.fit+1:0;
 if(fit&&g.fit>=STABLE){const room=Math.max(0,GNAT.MAX-gnatTotal(g));g.eggs+=Math.min(room,GNAT.BREED/60*Math.min(1,g.adults/4));}
 const e2l=g.eggs/GNAT.EGG,l2a=g.larvae/GNAT.LARVA;g.eggs-=e2l;g.larvae+=e2l-l2a;g.adults+=l2a-g.adults/GNAT.ADULT_LIFE;
 if(down){const tot=gnatTotal(g);if(tot>0){const k=Math.max(0,1-GNAT.DECLINE/60/tot);g.eggs*=k;g.larvae*=k;g.adults*=k;}}
 for(const p of s.individuals)if(live(p)&&Math.hypot(p.x-z.x,p.y-z.y)<GNAT.NEAR)harm(s,p,'burden',Math.min(GNAT.HURT,GNAT.HURT*g.larvae/100)/60);
 g.low=gnatTotal(g)<GNAT.GONE?g.low+1:0;if(g.low>=GNAT.GONE_SECONDS){st.groups=st.groups.filter(x=>x!==g);st.pause['site:'+g.site]=s.worldTick+GNAT.PAUSE;st.log.cleared++;event?.(s,'creature','낙엽 자리가 말라 뿌리날파리가 거의 사라졌어요.');}}
// ----- 흙지기 (ECO-07/08/12): root-fly larvae (or eggs) >= 5 at a site whose soil is moist but drained (M 35~65, W<10)
// for 120 s; 30% every 60 s, sure at 300 s. Eats up to 8/min of real larvae then eggs while the soil is drained; with no
// prey it may stay on leftover nutrient U (up to 1/min, moved to the soil ledger). Leaves after 120 s without either.
function soilStep(s,g,event){const st=state(s),z=site(s,g.site),f=z&&gnatAt(s,g.site);if(!z){st.groups=st.groups.filter(x=>x!==g);return;}
 let food=false;if(z.W<SOIL.W_MAX&&siteM(z)>=SOIL.M_MIN){let bite=f?zoneBite(s,g.site,SOIL.EAT/60):0;const prey=f&&f.larvae+f.eggs>0;if(f){const a=Math.min(f.larvae,bite);f.larvae-=a;bite-=a;const b=Math.min(f.eggs,bite);f.eggs-=b;const ate=a+b;if(ate>0){food=true;g.eaten=(g.eaten||0)+ate;st.log.eaten+=ate;}}
  if(!food&&!prey&&(z.U||0)>=SOIL.U/60){const u=SOIL.U/60;z.U-=u;s.objects.ledger.soil=(s.objects.ledger.soil||0)+u;food=true;}}
 g.bad=food?0:g.bad+1;if(g.bad>=LEAVE){st.groups=st.groups.filter(x=>x!==g);st.log.left++;event?.(s,'creature','흙지기가 먹이를 찾아 다른 흙으로 떠났어요.');}}
// ----- 솜깍지 P03: settles in a warm leaf gap (arrival); once settled +4/min while warm (50~80) and not wet, steady in wet
// weather, -6/min outside 50~80; tidying or the shelter -4/min and no
// growth there. Nutrition burden 2/min x density/100 (shared cap). Honeydew density/100 x 4/min, -2/min, max 100 (ECO-15).
// Egg sacs (density >= 20) let 점박이 come. Under 5 for 60 s = recovered, 300 s before a new arrival on that friend.
function mealyStep(s,g,event){const st=state(s),p=s.individuals.find(q=>q.id===g.host);if(!p||!live(p))return;const T=s.climate.T,inside=!!dep('shelter').inside?.(s,p);
 const wet=['rain','fog','snow'].includes(s.weather.kind);let d=g.density;if(inside)d-=MEALY.CLEAN/60;else if(T<MEALY.T_MIN||T>MEALY.T_MAX)d-=MEALY.DECLINE/60;else if(!wet)d+=MEALY.GROW/60;
 if(p.action==='groom')d-=MEALY.CLEAN/60;g.density=Math.max(0,Math.min(MEALY.MAX,d));
 g.honey=Math.max(0,Math.min(MEALY.HONEY_MAX,g.honey+(MEALY.HONEY*g.density/100-MEALY.HONEY_DECAY)/60));
 harm(s,p,'nutrition',Math.min(MEALY.HURT,MEALY.HURT*g.density/100)/60);
 g.low=g.density<MEALY.GONE?g.low+1:0;if(g.low>=MEALY.GONE_SECONDS){st.groups=st.groups.filter(x=>x!==g);st.pause['mealy:'+p.id]=s.worldTick+MEALY.PAUSE;st.log.cleared++;event?.(s,'creature',`${p.name}의 잎 사이가 깨끗해졌어요. 솜깍지가 거의 사라졌어요.`);}}
// ----- 점박이 (Cryptolaemus): egg sacs (mealybug >= 20) on a reachable friend for 120 s, then 30%/60 s, sure at 300 s.
// The adult looks around for 120 s (notice), then the larval stage eats up to 8/min (x0.5 while ants tend the honeydew).
function ladyStep(s,g,event){const st=state(s),p=s.individuals.find(q=>q.id===g.host),m=mealyOn(s,g.host);if(!p){st.groups=st.groups.filter(x=>x!==g);return;}if(!live(p))return;
 if(g.stage==='adult'&&s.worldTick-g.since>=LADY.NOTICE){g.stage='larva';event?.(s,'creature','점박이 유충이 솜깍지를 먹기 시작했어요.');}
 if(g.stage==='larva'&&m&&m.density>0){const k=tendedBy(s,g.host)?LADY.TENDED:1,bite=Math.min(m.density,LADY.EAT*k/60);m.density-=bite;g.eaten=(g.eaten||0)+bite;st.log.eaten+=bite;}
 // 0.6.33: a larva that has eaten its friend's mealybugs crawls over to the nearest friend close by (HOP) whose leaves
 // still carry mealybugs and no 점박이 of its own, and keeps eating there; it leaves only when no such friend is near.
 if(g.stage==='larva'&&!(m&&m.density>=1)){const Sp=dep('spatial'),Sh=dep('shelter'),next=s.individuals.filter(q=>q.id!==g.host&&live(q)&&!Sh.inside?.(s,q)&&Sp.distance(p,q)<LADY.HOP&&(mealyOn(s,q.id)?.density||0)>=MEALY.GONE&&!groups(s).some(x=>x.kind==='lady'&&x.host===q.id)).sort((a,b)=>Sp.distance(p,a)-Sp.distance(p,b)||a.id.localeCompare(b.id))[0];
  if(next){event?.(s,'creature',`점박이 유충이 ${p.name}에게서 ${next.name}의 잎으로 옮겨 갔어요.`);g.host=next.id;g.hops=(g.hops||0)+1;g.bad=0;return;}}
 g.bad=m&&m.density>=1?0:g.bad+1;if(g.bad>=LEAVE){st.groups=st.groups.filter(x=>x!==g);st.log.left++;event?.(s,'creature','점박이가 먹이를 다 찾아 먹고 떠났어요.');}}
function predatorArrivals(s,event,kind,readyKey,prey,fit,make,msg){const st=state(s);
 for(const p of [...s.individuals].sort((a,b)=>a.id.localeCompare(b.id))){const has=groups(s).some(g=>g.kind===kind&&g.host===p.id);if(has||!prey(p)||!fit(p)){if(!has)st[readyKey][p.id]=0;continue;}
  const r=st[readyKey][p.id]=(st[readyKey][p.id]||0)+1;if(st.groups.length>=MAXG||r<KEEPER.READY)continue;
  if(r>=KEEPER.SURE||((r-KEEPER.READY)%KEEPER.EVERY===0&&rnd(s)<KEEPER.CHANCE)){st.groups.push({id:'cr:'+st.nextId++,kind,host:p.id,since:s.worldTick,bad:0,eaten:0,lastWork:s.worldTick,carry:null,...make()});st[readyKey][p.id]=0;st.log.arrived++;event?.(s,'creature',msg(p));}}}
function soilArrivals(s,event){const st=state(s);
 for(const z of sites(s)){const has=groups(s).some(g=>g.kind==='soilmite'&&g.site===z.id),f=gnatAt(s,z.id);if(has||!f||f.larvae+f.eggs<SOIL.MIN_PREY||!soilFit(s,z)){if(!has)st.soilReady[z.id]=0;continue;}
  const r=st.soilReady[z.id]=(st.soilReady[z.id]||0)+1;if(st.groups.length>=MAXG||r<KEEPER.READY)continue;
  if(r>=KEEPER.SURE||((r-KEEPER.READY)%KEEPER.EVERY===0&&rnd(s)<KEEPER.CHANCE)){st.groups.push({id:'cr:'+st.nextId++,kind:'soilmite',site:z.id,since:s.worldTick,bad:0,eaten:0,lastWork:s.worldTick,carry:null});st.soilReady[z.id]=0;st.log.arrived++;event?.(s,'creature','흙지기가 젖은 흙 속 뿌리날파리 유충을 찾기 시작했어요.');}}}
function roveStep(s,g,event){const st=state(s),z=site(s,g.site),f=z&&gnatAt(s,g.site);if(!z){st.groups=st.groups.filter(x=>x!==g);return;}
 let ate=0;if(f&&soilFit(s,z)){let bite=zoneBite(s,g.site,ROVE.EAT/60);const a=Math.min(f.larvae,bite);f.larvae-=a;bite-=a;const b=Math.min(f.eggs,bite);f.eggs-=b;ate=a+b;}
 if(ate>0){g.eaten=(g.eaten||0)+ate;st.log.eaten+=ate;}
 g.bad=ate>0||(f&&f.larvae+f.eggs>=1&&soilFit(s,z))?0:g.bad+1;if(g.bad>=LEAVE){st.groups=st.groups.filter(x=>x!==g);st.log.left++;event?.(s,'creature','쏙쏙이가 바위 뒤로 쏙 숨더니 다른 틈으로 떠났어요.');}}
function roveArrivals(s,event){const st=state(s);
 for(const z of sites(s)){const has=groups(s).some(g=>g.kind==='rove'&&g.site===z.id),f=gnatAt(s,z.id);if(has||!f||f.larvae+f.eggs<ROVE.MIN_PREY||!roveFit(s,z)||groups(s).filter(g=>g.kind==='rove').length>=2){if(!has)st.roveReady[z.id]=0;continue;}
  const r=st.roveReady[z.id]=(st.roveReady[z.id]||0)+1;if(st.groups.length>=MAXG||r<KEEPER.READY)continue;
  if(r>=KEEPER.SURE||((r-KEEPER.READY)%KEEPER.EVERY===0&&rnd(s)<KEEPER.CHANCE)){const h=hideout(s,z);st.groups.push({id:'cr:'+st.nextId++,kind:'rove',site:z.id,hide:h.id,since:s.worldTick,bad:0,eaten:0,lastWork:s.worldTick,carry:null});st.roveReady[z.id]=0;st.log.arrived++;event?.(s,'creature',(h.id==='crevice'?'바위틈':'햇살 바위')+' 뒤에서 쏙쏙이가 나와 뿌리날파리 유충을 찾기 시작했어요.');}}}
// X04: ants tend mealybug honeydew (>= 20 for 30 s) and stop carrying; back to carrying after < 10 for 60 s or no mealybug.
function tendedBy(s,host){return groups(s).some(g=>g.kind==='ant'&&g.tend===host);}
function tendStep(s,event){const st=state(s),ant=groups(s).find(g=>g.kind==='ant');if(!ant)return;const best=groups(s).filter(g=>g.kind==='mealy').sort((a,b)=>b.honey-a.honey||a.id.localeCompare(b.id))[0];
 if(!ant.tend){st.honeyHigh=best&&best.honey>=TEND.ON?st.honeyHigh+1:0;if(st.honeyHigh>=TEND.ON_SECONDS&&!ant.carry){ant.tend=best.host;st.honeyLow=0;event?.(s,'creature','짐꾼개미가 솜깍지의 달콤한 감로 곁에 머물러요. 낙엽 운반을 잠시 쉬어요.');}}
 else{const m=mealyOn(s,ant.tend);st.honeyLow=!m||m.honey<TEND.OFF?st.honeyLow+1:0;if(st.honeyLow>=TEND.OFF_SECONDS){ant.tend=null;st.honeyHigh=0;ant.lastWork=s.worldTick;event?.(s,'creature','감로가 줄어 짐꾼개미가 다시 낙엽을 나르기 시작했어요.');}}}
function drop(s,g){if(!g.carry)return;const L=dep('litter');L.land(s,g.carry.fromSector,{x:g.carry.fromX,y:g.carry.fromY});g.carry=null;}
// ----- step -------------------------------------------------------------------------------------------------------
function step(s,event){if(!s.objects)return;init(s);const st=state(s),L=dep('litter');
 st.ready.ant=antOk(s)?st.ready.ant+1:0;
 const ids=new Set(L.piles(s).map(p=>p.id));for(const id of Object.keys(st.pileReady))if(!ids.has(id))delete st.pileReady[id];
 for(const p of L.piles(s))st.pileReady[p.id]=springOk(s,p)?(st.pileReady[p.id]||0)+1:0;
 for(const id of Object.keys(st.miteReady))if(!s.individuals.some(p=>p.id===id))delete st.miteReady[id];
 for(const p of s.individuals)if(live(p))st.miteReady[p.id]=miteFit(s,p)?Math.min(MITE.DRY_MAX,(st.miteReady[p.id]||0)+1):Math.max(0,(st.miteReady[p.id]||0)-1/MITE.DRY_FADE);
 st.groups=st.groups.filter(g=>!['mite','keeper','mealy','lady'].includes(g.kind)||s.individuals.some(p=>p.id===g.host));
 st._harm={};st._zone={};
 for(const id of Object.keys(st.roveReady))if(!sites(s).some(z=>z.id===id))delete st.roveReady[id];
 const siteIds=new Set(sites(s).map(z=>z.id));for(const k of ['gnatReady','soilReady'])for(const id of Object.keys(st[k]))if(!siteIds.has(id))delete st[k][id];
 for(const z of sites(s))st.gnatReady[z.id]=gnatFit(s,z)?Math.min(600,(st.gnatReady[z.id]||0)+1):0;
 for(const id of Object.keys(st.mealyReady))if(!s.individuals.some(p=>p.id===id))delete st.mealyReady[id];
 for(const p of s.individuals)if(live(p))st.mealyReady[p.id]=mealyFit(s,p)?Math.min(MEALY.GAP_MAX,(st.mealyReady[p.id]||0)+1):Math.max(0,(st.mealyReady[p.id]||0)-1/MEALY.GAP_FADE);
 // stay or leave (no deletion on weather change alone: a group leaves after 120 s without its food or habitat)
 for(const g of [...st.groups]){if(g.kind==='mite'){miteStep(s,g,event);continue;}if(g.kind==='keeper'){keeperStep(s,g,event);continue;}if(g.kind==='gnat'){gnatStep(s,g,event);continue;}if(g.kind==='soilmite'){soilStep(s,g,event);continue;}if(g.kind==='rove'){roveStep(s,g,event);continue;}if(g.kind==='mealy'){mealyStep(s,g,event);continue;}if(g.kind==='lady'){ladyStep(s,g,event);continue;}const ok=g.kind==='ant'?antOk(s):!!L.pile(s,g.pile)&&springOk(s,L.pile(s,g.pile));g.bad=ok?0:g.bad+1;
  if(g.kind==='springtail'&&!L.pile(s,g.pile))g.bad=LEAVE;
  if(g.bad>=LEAVE){drop(s,g);st.groups=st.groups.filter(x=>x!==g);st.log.left++;event?.(s,'creature',g.kind==='ant'?'짐꾼개미가 먹이를 찾아 떠났어요.':'톡토기가 더 촉촉한 곳을 찾아 떠났어요.');}}
 for(const g of st.groups)if(g.kind==='ant')antStep(s,g);
 keeperArrivals(s,event);soilArrivals(s,event);roveArrivals(s,event);tendStep(s,event);
 predatorArrivals(s,event,'lady','ladyReady',p=>(mealyOn(s,p.id)?.density||0)>=LADY.MIN_PREY,p=>live(p)&&!dep('shelter').inside?.(s,p),()=>({stage:'adult'}),p=>`점박이가 ${p.name}의 솜깍지 알주머니를 찾아왔어요.`);
 delete st._harm;delete st._zone;for(const g of st.groups)st.seen[g.kind]=1;
 if(s.worldTick<PROTECT||s.worldTick%CHECK||st.groups.length>=MAXG)return;
 // helpers (ant, springtail) and pests (mite, root fly, mealybug) each get one new group per 600 s, so pests never use up
 // the helpers' arrival slot (0.6.27; one shared slot before). Order and chances are unchanged inside each family.
 const pest=c=>PESTS.includes(c.kind),last=k=>k?st.lastPest??-1e9:st.lastArrival;
 for(const fam of [false,true]){if(st.groups.length>=MAXG||s.worldTick-last(fam)<COOLDOWN)continue;for(const c of candidates(s).filter(c=>pest(c)===fam)){if(rnd(s)<c.chance&&arrive(s,c,event)){break;}}}
}
function carried(s){return groups(s).filter(g=>g.carry).length;}
function pillNear(s,z){if(s.neighbor?.stage!=='visiting')return false;const c=s.patches.find(q=>q.id==='crevice');return !!c&&!!z&&Math.hypot(c.x-z.x,c.y-z.y)<PILL.NEAR;}
function decomposeBoost(s,pileId){const z=site(s,pileId);return (springOn(s,pileId)?SPRING:1)*(pillNear(s,z)?PILL.BOOST:1);}
function relocate(s){const L=dep('litter');for(const g of groups(s))if(g.nest&&!dep('spatial').walkable(s,g.nest)){const q=L.spot(s,L.sectorOf(g.nest),12);if(q)g.nest=q;}}
function validate(s){const st=state(s);if(!st)return;const f=v=>Number.isFinite(v);
 if(st.version!==1||!Array.isArray(st.groups)||st.groups.length>MAXG||!Number.isSafeInteger(st.nextId)||!Number.isInteger(s.rng.creatures))throw Error('작은 이웃 기록을 확인해 주세요.');
 if(st.groups.filter(g=>g.kind==='ant').length>1||st.groups.filter(g=>g.kind==='springtail').length>2||['mite','keeper','mealy','lady'].some(k=>{const h=st.groups.filter(g=>g.kind===k).map(g=>g.host);return new Set(h).size!==h.length;})||['gnat','soilmite','rove'].some(k=>{const h=st.groups.filter(g=>g.kind===k).map(g=>g.site);return new Set(h).size!==h.length;})||st.groups.filter(g=>g.kind==='rove').length>2||pestKinds(s).size>PEST_TYPES||st.groups.filter(g=>g.kind==='gnat').length>2)throw Error('작은 이웃 기록을 확인해 주세요.');
 for(const g of st.groups){if(!['ant','springtail','mite','keeper','gnat','soilmite','mealy','lady','rove'].includes(g.kind)||typeof g.id!=='string'||!f(g.since)||!f(g.bad))throw Error('작은 이웃 기록을 확인해 주세요.');
  if(g.kind==='ant'&&(!g.nest||!f(g.nest.x)||!f(g.nest.y)))throw Error('개미 둥지 기록을 확인해 주세요.');
  if(g.carry&&(!f(g.carry.fromX)||!f(g.carry.to?.x)||!Number.isInteger(g.carry.to?.sector)))throw Error('개미가 옮기는 낙엽 기록을 확인해 주세요.');
  if(g.kind==='springtail'&&typeof g.pile!=='string')throw Error('톡토기 기록을 확인해 주세요.');
  if(['mite','keeper','mealy','lady'].includes(g.kind)&&typeof g.host!=='string')throw Error('잎 위 작은 이웃 기록을 확인해 주세요.');
  if(g.kind==='mite'&&(!f(g.density)||g.density<0||g.density>MITE.MAX||!f(g.low)))throw Error('잎응애 기록을 확인해 주세요.');
  if(['gnat','soilmite','rove'].includes(g.kind)&&typeof g.site!=='string')throw Error('흙 속 작은 이웃 기록을 확인해 주세요.');
  if(g.kind==='gnat'&&(['eggs','larvae','adults','low','fit'].some(k=>!f(g[k])||g[k]<0)||gnatTotal(g)>GNAT.MAX+1e-6))throw Error('뿌리날파리 기록을 확인해 주세요.');
  if(g.kind==='mealy'&&(!f(g.density)||g.density<0||g.density>MEALY.MAX||!f(g.honey)||g.honey<0||g.honey>MEALY.HONEY_MAX||!f(g.low)))throw Error('솜깍지 기록을 확인해 주세요.');
  if(g.kind==='lady'&&!['adult','larva'].includes(g.stage))throw Error('점박이 기록을 확인해 주세요.');
  if(g.kind==='ant'&&g.tend!=null&&typeof g.tend!=='string')throw Error('개미 기록을 확인해 주세요.');}}
function info(s,pileId){const g=groups(s);return {ant:g.find(x=>x.kind==='ant')||null,springtail:pileId?g.find(x=>x.kind==='springtail'&&x.pile===pileId)||null:null,count:g.length};}
// what pests a friend feels right now (for its own choices): leaf pests on it, root-fly larvae at sites it might use
function pressure(s,p){const g=groups(s);return {leaf:g.some(x=>(x.kind==='mite'||x.kind==='mealy')&&x.host===p.id&&x.density>=5),mite:g.some(x=>x.kind==='mite'&&x.host===p.id&&x.density>=5),gnatSites:g.filter(x=>x.kind==='gnat'&&x.larvae>=3).map(x=>x.site)};}
function onLeaf(s,host){const g=groups(s);return {mite:miteOn(s,host),keeper:g.find(x=>x.kind==='keeper'&&x.host===host)||null,mealy:mealyOn(s,host),lady:g.find(x=>x.kind==='lady'&&x.host===host)||null,ant:g.find(x=>x.kind==='ant'&&x.tend===host)||null};}
function inSoil(s,siteId){const g=groups(s);return {gnat:gnatAt(s,siteId),soilmite:g.find(x=>x.kind==='soilmite'&&x.site===siteId)||null,rove:g.find(x=>x.kind==='rove'&&x.site===siteId)||null};}
function rootsNear(s,p){return sites(s).map(z=>({z,g:gnatAt(s,z.id)})).find(o=>o.g&&Math.hypot(p.x-o.z.x,p.y-o.z.y)<GNAT.NEAR)||null;}
return {candidates,harm,PROTECT,CHECK,COOLDOWN,STABLE,LEAVE,ANT_EVERY,CARRY_SECONDS,SPRING,MITE,KEEPER,GNAT,SOIL,MEALY,LADY,TEND,HARM_MAX,PEST_TYPES,ROVE,ZONE_EAT,PILL,hideout,roveFit,pillNear,canopy,pressure,init,step,carried,decomposeBoost,relocate,validate,info,onLeaf,inSoil,rootsNear,groups,antOk,springOk,leaf,miteFit,keeperFit,gnatFit,soilFit,mealyFit,leafGap,sites,site,pestKinds,tendedBy};
});
