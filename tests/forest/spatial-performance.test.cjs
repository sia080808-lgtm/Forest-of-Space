const {test}=require('node:test');
const assert=require('node:assert/strict');
const F=require('../../app/src/main/assets/web/engine');
const S=F.Space;

test('ellipse shortcut agrees with the established walk samples at a trunk edge',()=>{
 const s=F.create(0,18),id=s.individuals[0].id;
 const trunk={id:'cherry-1',type:'tree',x:.45,y:.325,rx:.035,ry:.022};
 const paddedY=trunk.y+trunk.ry+S.diameter(s.individuals[0])*.55*.2;
 for(let i=0;i<30;i++){
  const a={x:.151+i*.001,y:paddedY-.00013};
  const b={x:.72,y:paddedY+(i%3-1)*.00026};
  const count=Math.ceil(S.distance(a,b)/.012);
  let clear=true;
  for(let j=1;j<=count;j++){
   const q={x:a.x+(b.x-a.x)*j/count,y:a.y+(b.y-a.y)*j/count};
   if(!S.walkable(s,q,id,null,[trunk])){clear=false;break;}
  }
  assert.equal(S.segment(s,a,b,id,[trunk]),clear);
 }
});

test('a route carried over from an earlier tick is invalidated when the lake thaws',()=>{
 const s=F.create(0,18);
 F.World.openLake(s);
 s.worldTick=11000;
 const a={x:1.35,y:.55},b={x:3.16,y:.55},id=s.individuals[0].id;
 assert(F.World.frozen(s));
 assert.deepEqual(S.route(s,a,b,id),[b]);
 const next=S.copyForTick(s,F.clone(s));
 next.worldTick=14400;
 assert(!F.World.frozen(next));
 const route=S.route(next,a,b,id);
 assert(route?.length>1);
 let from=a;
 for(const point of route){assert(S.segment(next,from,point,id));from=point;}
});
