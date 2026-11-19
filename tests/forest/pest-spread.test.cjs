const {test}=require('node:test'),a=require('node:assert/strict'),F=require('../../app/src/main/assets/web/engine'),C=F.Creatures;
// 0.6.38 ECO-13: leaf pests pass between touching friends; root-fly adults fly to another wet-litter site.
// Unit level: friends are held in place and the chance is set to 1 or 0 so the timing is exact.
function game(seed=5){const s=F.create(0,seed);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;C.init(s);const st=s.objects.creatures;st.lastArrival=1e9;st.lastPest=1e9;
 const a0=s.individuals[0];Object.assign(a0,{x:.4,y:.6});const b={...F.clone(a0),id:'b',name:'엘레판',species:'neolbi',x:.46,y:.6,active:true,sources:{rain:0,other:0,unknown:0}};s.individuals.push(b);return {s,a:a0,b};}
const add=(s,g)=>{const st=s.objects.creatures;g={id:'cr:'+st.nextId++,since:s.worldTick,bad:0,lastWork:s.worldTick,carry:null,...g};st.groups.push(g);return g;};
const withChance=(obj,v,fn)=>{const old=obj.CHANCE;obj.CHANCE=v;try{return fn();}finally{obj.CHANCE=old;}};
const ev=[];const event=(s,type,text,detail)=>ev.push({type,text,detail});
const on=(s,kind,host)=>C.groups(s).find(g=>g.kind===kind&&g.host===host);

test('ECO-13 a leaf pest moves only after 30 s of touching leaves, then every 60 s; up to 2 is moved, nothing is created',()=>{
 withChance(C.TOUCH,1,()=>{const {s,a:p,b:q}=game();const src=add(s,{kind:'mite',host:p.id,density:30,low:0});
  for(let t=1;t<C.TOUCH.HOLD;t++){s.worldTick++;C.contactStep(s,event);}a.ok(!on(s,'mite',q.id),'not before 30 s');
  s.worldTick++;C.contactStep(s,event);const g=on(s,'mite',q.id);a.ok(g,'moves at 30 s');a.equal(g.density,2);a.equal(src.density,28);a.equal(src.density+g.density,30);a.equal(g.from,p.id);
  a.ok(ev.some(e=>e.text.includes('옮겨 붙었어요')));
  // the pair rests 120 s after a move; the friend already has mites so no second move of the same pest
  for(let t=0;t<300;t++){s.worldTick++;C.contactStep(s,event);}a.equal(C.groups(s).filter(g=>g.kind==='mite').length,2);a.equal(src.density+on(s,'mite',q.id).density,30);});
});

test('ECO-13 contact is broken by distance, by the shelter and by the 20% check (x the new host trait); a pause blocks it',()=>{
 withChance(C.TOUCH,1,()=>{{const {s,a:p,b:q}=game();add(s,{kind:'mealy',host:p.id,density:30,low:0,honey:0});
   for(let t=0;t<29;t++){s.worldTick++;C.contactStep(s,event);}q.x=.6;s.worldTick++;C.contactStep(s,event);q.x=.46;for(let t=0;t<29;t++){s.worldTick++;C.contactStep(s,event);}a.ok(!on(s,'mealy',q.id),'the 30 s must be in a row');}
  {const {s,a:p,b:q}=game();add(s,{kind:'mite',host:p.id,density:30,low:0});s.objects.creatures.pause[q.id]=1e9;for(let t=0;t<200;t++){s.worldTick++;C.contactStep(s,event);}a.ok(!on(s,'mite',q.id),'a friend that just recovered is paused');}
  {const {s,a:p,b:q}=game();add(s,{kind:'mite',host:p.id,density:30,low:0});const Sh=F.Shelter,old=Sh.inside;Sh.inside=(s,z)=>z.id===q.id;try{for(let t=0;t<200;t++){s.worldTick++;C.contactStep(s,event);}}finally{Sh.inside=old;}a.ok(!on(s,'mite',q.id),'not into or out of the shelter');}});
 withChance(C.TOUCH,0,()=>{const {s,a:p,b:q}=game();add(s,{kind:'mite',host:p.id,density:30,low:0});for(let t=0;t<600;t++){s.worldTick++;C.contactStep(s,event);}a.ok(!on(s,'mite',q.id));});
});

test('ECO-13 in the real engine: a moved group of 2 sticks on a warm leaf and fades on a cold one; the save stays valid',()=>{
 withChance(C.TOUCH,1,()=>{for(const [T,sticks] of [[65,true],[30,false]]){const {s,a:p,b:q}=game(9);add(s,{kind:'mealy',host:p.id,density:40,low:0,honey:0});
  for(let t=0;t<200;t++){s.climate.T=T;s.weather.kind='cloud';p.x=.4;p.y=.6;q.x=.46;q.y=.6;p.objectTask=q.objectTask=null;s.worldTick++;C.step(s,event);}
  a.equal(!!on(s,'mealy',q.id),sticks,'T '+T);F.valid(JSON.parse(JSON.stringify(s)));}});
});

function flyGame(){const {s}=game(3);s.objects.litter.piles.push({id:'pile:90',sector:6,x:.55,y:.62,O:12,U:4,S:95,cap:100,W:0,playBoostUntil:0,born:0});const st=s.objects.creatures;st.gnatReady['pile:90']=200;return {s,st};}
test('ECO-13 air: only root-fly adults fly, at most 2, to a ready wet-litter site nearby, one check every 300 s; no flight from a small group',()=>{
 withChance(C.FLY,1,()=>{{const {s,st}=flyGame();const g=add(s,{kind:'gnat',site:'litter',adults:20,eggs:10,larvae:10,low:0,fit:200});
   for(let t=0;t<C.FLY.EVERY-1;t++){s.worldTick++;C.flyStep(s,event);}a.ok(!C.groups(s).some(x=>x.kind==='gnat'&&x.site==='pile:90'),'not before the first check');
   s.worldTick++;C.flyStep(s,event);const n=C.groups(s).find(x=>x.kind==='gnat'&&x.site==='pile:90');a.ok(n);a.equal(n.adults,2);a.equal(n.eggs+n.larvae,0,'eggs and larvae never fly');
   a.equal(g.adults,18);a.equal(g.eggs,10);a.equal(g.larvae,10);for(let t=0;t<1200;t++){s.worldTick++;C.flyStep(s,event);}a.equal(C.groups(s).filter(x=>x.kind==='gnat').length,2,'still at most 2 root-fly sites');F.valid(s);}
  {const {s}=flyGame();add(s,{kind:'gnat',site:'litter',adults:C.FLY.MIN_ADULTS-1,eggs:0,larvae:0,low:0,fit:200});for(let t=0;t<900;t++){s.worldTick++;C.flyStep(s,event);}a.equal(C.groups(s).filter(x=>x.kind==='gnat').length,1,'a small group stays');}
  {const {s,st}=flyGame();st.gnatReady['pile:90']=50;add(s,{kind:'gnat',site:'litter',adults:20,eggs:0,larvae:0,low:0,fit:200});for(let t=0;t<900;t++){s.worldTick++;C.flyStep(s,event);}a.equal(C.groups(s).filter(x=>x.kind==='gnat').length,1,'the new site must have suited them for 120 s');}});
});

test('ECO-13 air: a group that flew in lives through one egg-to-adult cycle on a wet site and breeds',()=>{
 withChance(C.FLY,1,()=>{const {s}=flyGame();add(s,{kind:'gnat',site:'litter',adults:20,eggs:0,larvae:0,low:0,fit:200});
  for(let t=0;t<C.FLY.EVERY;t++){s.worldTick++;C.flyStep(s,event);}const n=C.groups(s).find(x=>x.site==='pile:90');a.ok(n);
  const pile=s.objects.litter.piles.find(p=>p.id==='pile:90');for(let t=0;t<200;t++){s.climate.T=60;s.weather.kind='cloud';pile.S=95;pile.W=0;s.worldTick++;C.step(s,event);}
  a.ok(C.groups(s).includes(n),'still there after 200 s');a.ok(n.eggs+n.larvae>0,'breeding');});
});
