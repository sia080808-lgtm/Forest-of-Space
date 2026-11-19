// 0.7.0 review: engine tick time with many friends (10/20/30/50) in the wide forest (Node, one core; not an Android device).
// Friends start spread over the whole forest. Usage: node tools/wide-forest-perf.cjs [engine dir] [10,20,30,50] [ticks]
const path=require('path'),dir=path.resolve(process.argv[2]||path.resolve(__dirname,'../app/src/main/assets/web')),F=require(dir+'/engine.js');
const SP=['ridley','bonbon','neolbi','bosong','jureong','superbum'];
for(const N of (process.argv[3]||'10,20,30,50').split(',').map(Number)){const s=F.create(0,11);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;const b=s.individuals[0];
 const W=F.World?F.World.walk(s):{x0:.08,y0:.15,x1:.92,y1:.91};let k=0;
 for(let i=1;i<N;i++){let q;for(let t=0;t<200;t++){k++;q={x:W.x0+((k*0.6180339)%1)*(W.x1-W.x0),y:W.y0+((k*0.4142135)%1)*(W.y1-W.y0)};if(F.Space.walkable(s,q))break;}
  s.individuals.push({...F.clone(b),id:'f'+i,species:SP[i%6],name:'f'+i,x:q.x,y:q.y,active:true,sources:{rain:0,other:0,unknown:0},V:0});}
 for(let t=0;t<60;t++)F.step(s);const T=+(process.argv[4]||600),d=[];for(let t=0;t<T;t++){const t0=process.hrtime.bigint();F.step(s);d.push(Number(process.hrtime.bigint()-t0)/1e6);}
 d.sort((a,b)=>a-b);const mean=d.reduce((a,b)=>a+b,0)/T,q=f=>d[Math.min(T-1,Math.floor(f*T))];
 console.log(N,'friends: mean',mean.toFixed(1),'ms, median',q(.5).toFixed(1),', p95',q(.95).toFixed(1),', max',d[T-1].toFixed(0),'ms per tick');}
