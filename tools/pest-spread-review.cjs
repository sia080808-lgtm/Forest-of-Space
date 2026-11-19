// 0.6.38 review: how often leaf pests pass between touching friends (ECO-13) and root-fly adults fly to another wet-litter
// site, with six friends together (one of each species), 4 climates x 3 seeds x 3 game days. Counts come from the real
// engine log (groups marked 'from'). Usage: node tools/pest-spread-review.cjs C01 (one climate per run; the 0.6.38 runs were
// merged into docs/qa-0.6.38/pest-spread.json). Prints a table.
const path=require('path'),fs=require('fs'),web=path.resolve(__dirname,'../app/src/main/assets/web'),F=require(web+'/engine.js');
const SP=['ridley','bonbon','neolbi','bosong','jureong','superbum'],POS=[[.3,.55],[.45,.62],[.55,.5],[.65,.66],[.38,.72],[.6,.4]],CL=(process.argv[2]||'C01,C02,C03,C04').split(','),SEEDS=[1,2,3],DAYS=3;
const out={};
for(const cl of CL){const r={mite:0,mealy:0,gnat:0,stuck:0,arrivals:0,seeds:SEEDS.length,days:DAYS};
 for(const seed of SEEDS){const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;s.environment.climate=cl;const base=s.individuals[0];Object.assign(base,{x:POS[0][0],y:POS[0][1]});
  SP.slice(1).forEach((sp,i)=>s.individuals.push({...F.clone(base),id:'f'+i,species:sp,name:sp,x:POS[i+1][0],y:POS[i+1][1],active:true,sources:{rain:0,other:0,unknown:0}}));
  const seen=new Set(),moved=[];for(let t=0;t<1200*DAYS;t++){F.step(s);for(const g of s.objects.creatures.groups)if(!seen.has(g.id)){seen.add(g.id);if(g.from){r[g.kind]++;moved.push(g);}else if(['mite','mealy','gnat'].includes(g.kind))r.arrivals++;}
   for(const g of moved)if(!g.checked&&s.worldTick-g.since>=300){g.checked=1;if(s.objects.creatures.groups.includes(g))r.stuck++;}}
  F.valid(s);}
 out[cl]=r;}

console.log('climate | new pest arrivals | mite moved | mealybug moved | root fly flew | still there after 300 s');for(const [k,v] of Object.entries(out))console.log(k,'|',v.arrivals,'|',v.mite,'|',v.mealy,'|',v.gnat,'|',v.stuck);
