const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine'),W=F.World,L=F.Litter;
// 0.7.0 넓은 숲 (SRS v2.29): the garden keeps its 0..1 coordinates; the forest region is -0.25..1.25
const game=(seed=7)=>{const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;return s;};

test('MX-AC01 the world is the open regions: a new game has the forest, its bounds are -0.25..1.25, unknown regions are rejected',()=>{
 const s=game();a.deepEqual(s.world,{version:1,regions:['forest']});a.deepEqual(W.bounds(s),{x0:-.25,y0:-.25,x1:1.25,y1:1.25});F.valid(s);
 a.deepEqual(W.bounds({}),W.bounds(s),'a save from before 0.7.0 has the forest');
 const bad=F.clone(s);bad.world.regions=['moon'];a.throws(()=>F.valid(bad));
});

test('MX-AC02 a 0.6.x save opens unchanged: positions stay, the world record is added, litter is re-sectored, a day quota of 20 becomes 45',()=>{
 const s=game(3);for(let t=0;t<3000;t++)F.step(s);
 // make it look like a 0.6.38 save: no world record, 4x3 litter grid, old day quota
 const old=F.clone(s);delete old.world;delete old.objects.litter.grid;old.objects.dayQuota=20;
 const oc=(q)=>{const c=Math.max(0,Math.min(3,Math.floor((q.x-.08)/.84*4))),r=Math.max(0,Math.min(2,Math.floor((q.y-.15)/.76*3)));return r*4+c;};
 for(const l of old.objects.litter.leaves)l.sector=oc(l);old.objects.litter.piles.forEach((p,i)=>p.sector=i);
 const floor=L.floor(old),compost=L.compost(old),pos=old.individuals.map(p=>[p.id,p.x,p.y]),patches=old.patches.map(p=>[p.id,p.x,p.y]);
 const n=F.migrate(JSON.parse(JSON.stringify(old)));F.valid(n);
 a.deepEqual(n.world,{version:1,regions:['forest']});a.equal(n.objects.litter.grid,2);a.equal(n.objects.dayQuota,45);
 a.deepEqual(n.patches.map(p=>[p.id,p.x,p.y]),patches);
 for(const [id,x,y] of pos){const p=n.individuals.find(q=>q.id===id);if(F.Space.walkable(old,{x,y},id))a.deepEqual([p.x,p.y],[x,y]);}
 a.ok(Math.abs(L.floor(n)-floor)<1e-9&&Math.abs(L.compost(n)-compost)<1e-9,'leaves and compost conserved');
 for(const l of L.leaves(n))a.equal(l.sector,L.sectorOf(l));for(let i=0;i<L.COLS*L.ROWS;i++)a.ok(L.piles(n).filter(p=>p.sector===i).length<=1);
 for(let t=0;t<600;t++)F.step(n);F.valid(n);
});

test('MX-AC03 the new ground is walkable and can hold objects; beyond the forest edge it cannot',()=>{
 const s=game(),Sp=F.Space;
 a.ok(Sp.walkable(s,{x:-.1,y:.5}),'west ring');a.ok(Sp.walkable(s,{x:1.12,y:1.1}),'south-east ring');a.ok(!Sp.walkable(s,{x:-.2,y:.5}),'past the walkable margin');a.ok(!Sp.walkable(s,{x:.5,y:1.2}));
 F.layout(s,{moss:{x:-.08,y:.55}});F.valid(s);a.equal(s.patches.find(p=>p.id==='moss').x,-.08);
 a.throws(()=>F.layout(s,{rock:{x:-.3,y:.5}}),/가장자리/);
 // a friend finds a route from the garden to the moss on the new ground
 const p=s.individuals[0];a.ok(Sp.route(s,{x:p.x,y:p.y},Sp.socket(s,'moss'),p.id),'route to the moss on the new ground');
});

test('MX-AC04 leaves fall over the 6x5 sectors of the whole forest, up to 90 on the floor, 45 a day at level 1',()=>{
 a.equal(L.COLS*L.ROWS,30);a.equal(L.LCAP,90);const s=game(5);a.equal(s.objects.dayQuota,27);// 0.8.0: 45 a day at level 1, x0.6 in spring (a new game starts in spring)
 const seen=new Set();for(let t=0;t<3600;t++){F.step(s);for(const l of L.leaves(s))seen.add(l.sector);for(const p of L.piles(s))seen.add(p.sector);a.ok(L.floor(s)<=L.LCAP+1e-9);}
 a.ok([...seen].some(i=>{const b=L.bounds(i);return b.x0<0||b.x1>1||b.y0<0||b.y1>1;}),'leaves land on the new ground too');F.valid(s);
});

test('MX-AC05 the visitors\' entrance moves to the bottom middle of the forest',()=>{const s=game();const e=W.entrance(s);a.equal(e.x,.5);a.ok(e.y>1&&F.Space.walkable(s,e));});
