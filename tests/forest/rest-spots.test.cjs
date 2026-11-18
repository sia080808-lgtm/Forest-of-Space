const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine'),O=F.Objects,S=F.Space,Sh=F.Shelter,N=require('../../app/src/main/assets/web/neolbi');
const game=(seed=5)=>{const s=F.create(0,seed);s.started=true;s.mode='game';s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;Object.assign(s.individuals[0],{xp:115,visualStage:3});return s;};

test('0.6.30 leaf shade: the rest spot is under the leaves beside the stem, and the plant blocks only its stem base',()=>{
 const s=game(),p=s.individuals[0],z=s.patches.find(q=>q.id==='shade');Object.assign(p,{energy:30});s.climate.L=80;s.weather.kind='sun';
 const o=O.option(s,p,'shade','rest','energy');a.ok(o&&!o.fail,JSON.stringify(o));
 // drawn leaves span about -.15..+.13 of the anchor; the spot is in front of the stem base, under the right leaf
 a.ok(o.x-z.x>0&&o.x-z.x<.11&&o.y-z.y>0&&o.y-z.y<.04,JSON.stringify({dx:o.x-z.x,dy:o.y-z.y}));
 const ob=S.obstacles(s).find(q=>q.id==='shade');a.ok(ob.rx<=.03&&ob.ry<=.015);a.equal(S.walkable(s,{x:o.x,y:o.y},p.id),true);
});

test('0.6.30 엘레판 canopy: the friend is seated under the open leaf, close to 엘레판, not in front of its tip',()=>{
 const s=game(9),base=s.individuals[0];s.individuals.push({...F.clone(base),id:'n',species:'neolbi',name:'엘레판',x:.45,y:.6,active:true,sources:{rain:0,other:0,unknown:0}});base.x=.3;base.y=.6;
 let seat=null;for(let t=0;t<1800&&!seat;t++){s.weather.kind='rain';s.weather.intensity=60;s.weather.remaining=200;s.weather.wind=10;F.step(s);const c=s.social.sessions.find(x=>x.type==='CANOPY'&&x.seat);if(c){const h=s.individuals.find(q=>q.id===c.ids[0]);seat={dx:c.seat.x-h.x,dy:c.seat.y-h.y,ok:N.canFit(h,c.seat,s.individuals.find(q=>q.id===c.ids[1]))};}}
 a.ok(seat,'a canopy session started');a.ok(seat.ok);a.ok(seat.dx<=.085&&seat.dy<=.02,JSON.stringify(seat));
});

test('0.6.30 stones: a friend body never stands half inside the side of the sun rock or the crevice stones',()=>{
 const s=game(),p=s.individuals[0],rock=S.obstacles(s).find(z=>z.id==='rock');
 const edge={x:rock.x+rock.rx+.02,y:rock.y};a.equal(S.walkable(s,edge),true,'a bare point there is outside the art');a.equal(S.walkable(s,edge,p.id),false,'but a friend body there would overlap it');
 a.equal(S.walkable(s,{x:rock.x+rock.rx+.07,y:rock.y},p.id),true);
});

test('0.6.30 shelter: a friend that gives up a stalled exit while already outside is released outside, never "resting inside" out on the ground',()=>{
 const s=F.create(1000,218);s.started=true;const f=s.shelters.facilities[0];s.worldTick=1000;s.weather.remaining=240;const base=s.individuals[0];Object.assign(base,{B:55,energy:75,nutrition:70,xp:115,visualStage:3,action:'rest',target:'shelter',actionSeconds:60,recoveredSeconds:10});s.individuals=[];
 for(let i=0;i<2;i++){const p={...F.clone(base),id:'occupant-'+i};s.individuals.push(p);const q=Sh.seat(s,f,p);Object.assign(p,q);p.shelter={phase:'restingInside',facilityId:f.id,...q,units:4,since:900,entered:900,revision:0};}
 s.individuals.push({...F.clone(base),id:'large-waiter',species:'neolbi',x:.55,y:.65,shelter:{phase:'outside',since:900},shelterRequest:{id:1,start:900,waited:100,absent:0},nextObjectChoice:1060});
 Sh.prepare(s,null,F.Space);Sh.prepare(s,null,F.Space);for(let n=0;n<200;n++){F.step(s);for(const p of s.individuals)if(p.shelter?.phase==='restingInside')a.ok(Sh.intersects(f,p),p.id+' resting inside must be in the shelter');}
});
