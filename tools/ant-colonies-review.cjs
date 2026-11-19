// 0.7.1 짐꾼개미 군락 측정: 8 seeds x 3 game days, a new game with 1 ridley and with 3 ridleys (the extra two start at the
// west and east edges of the forest). Reports first colony, most colonies at once, colonies that left (and why), leaves
// carried, share of daytime the colonies worked, and the leaf balance error. Output: docs/qa-0.7.1/ant-colonies.json
const fs=require('node:fs'),path=require('node:path'),F=require('../app/src/main/assets/web/engine'),C=F.Creatures,O=F.Objects;
const out={};
for(const n of [1,3]){const rows=[];
 for(let seed=1;seed<=8;seed++){const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;
  const base=s.individuals.find(p=>p.species==='ridley');if(n===3)for(const [x,y,id] of [[-.05,.2,'ridley-w'],[1.05,.8,'ridley-e']]){const r=F.clone(base);r.id=id;r.name=id;r.x=x;r.y=y;s.individuals.push(r);}
  const b0=O.storedLeaf(s),left={absent:0,hungry:0};let first=null,most=0,active=0,day=0;const seen=new Set();
  for(let t=0;t<3600*3;t++){F.step(s);const cs=C.colonies(s);most=Math.max(most,cs.length);if(first==null&&cs.length)first=s.worldTick;if(cs.length&&Math.floor(s.worldTick/600)%2===0){day++;if(C.antActive(s))active++;}
   for(const e of s.events.slice(-3))if(e.tick===s.worldTick&&/짐꾼개미/.test(e.text)&&!seen.has(e.id)){seen.add(e.id);if(/보이지 않아/.test(e.text))left.absent++;else if(/떠났어요/.test(e.text))left.hungry++;}}
  const bal=O.storedLeaf(s)+s.objects.ledger.absorbed+(s.objects.ledger.soil||0)-s.objects.ledger.leafInput-b0;F.valid(s);
  rows.push({seed,first,most,now:C.colonies(s).length,arrived:s.objects.creatures.log.arrived,left,carried:s.objects.creatures.log.carried,workShareOfDay:day?+(active/day).toFixed(2):null,balance:+bal.toExponential(1)});}
 out[n+' ridley']=rows;console.log(n,JSON.stringify(rows.map(r=>[r.seed,r.first,r.most,r.carried,r.left])));}
fs.writeFileSync(path.join(__dirname,'../docs/qa-0.7.1/ant-colonies.json'),JSON.stringify(out,null,1));
