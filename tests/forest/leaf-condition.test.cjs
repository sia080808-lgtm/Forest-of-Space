const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../../app/src/main/assets/web');
const F=require(web+'/engine.js'),Leaf=require(web+'/leaf-state.js'),W=require(web+'/weather-care.js');
const R=require(web+'/rig.js'),S=require(web+'/skills.js'),A=require(web+'/admin.js'),T=require(web+'/traits.js');

test('leaf looks use independent thresholds, compose, and turn off with recovery',()=>{
 const s=F.create(0),p=s.individuals[0];
 Object.assign(p,{B:12,nutrition:12,damage:5});Leaf.update(p);
 assert.equal(Leaf.flags(p),Leaf.DRY|Leaf.PALE|Leaf.TORN);
 p.damage=4.1;Leaf.update(p);assert.ok(Leaf.flags(p)&Leaf.TORN);
 const save=F.migrate(JSON.parse(JSON.stringify(s)));
 assert.ok(Leaf.flags(save.individuals[0])&Leaf.TORN);
 Object.assign(p,{B:50,nutrition:50,damage:3.9});Leaf.update(p);
 assert.equal(Leaf.flags(p),0);
});

test('gale damage uses the ten-second grace period and a single species resistance',()=>{
 for(const [species,expected] of [['ridley',7.5],['maria',9],['neolbi',4.5]]){
  const s=F.create(0),p=s.individuals[0];
  s.worldTick=1000;s.weather.wind=75;p.species=species;
  for(let i=0;i<10;i++)assert.equal(W.physiology(s,p),0);
  for(let i=0;i<50;i++)W.physiology(s,p);
  assert.ok(Math.abs(p.damage-expected)<1e-8,species);
  assert.equal(!!(Leaf.flags(p)&Leaf.TORN),expected>=5,species);
  assert.equal(W.physiology(s,p,{safeCare:true}),0);
 }
});

test('Dico recruit is valid and the skill preview works for both ages',()=>{
 const lvl=T.HEX.dico;
 assert.equal(Object.values(lvl).reduce((a,b)=>a+b,0),18);
 const s=F.create(0);A.run(F,s,'welcome','dico');F.valid(s);
 const p=A.motionPreview(F,'mend','dico'),buddy=p.state.individuals[1],dico=p.state.individuals[0];
 p.update(3);assert.equal(buddy.damage,12);
 p.update(1);assert.equal(buddy.damage,0);assert.equal(dico.skill,undefined);
 assert.equal(dico.skillRest.mend,p.state.worldTick+2);
 assert.equal(S.today(p.state,dico),1);
 assert.match(p.nextLabel(),/어린/);
 p.next();p.update(4);
 assert.equal(dico.visualStage,0);assert.equal(buddy.damage,2);
 assert.equal(Leaf.flags(buddy)&Leaf.TORN,0);
 assert.match(p.status(),/88 → 98/);
});

test('all eight active species draw three distinct leaf conditions and reuse cached layers',async()=>{
 const assets=Object.fromEntries(await Promise.all(Object.entries(R.files).map(async([k,v])=>[k,await loadImage(path.join(web,v))])));
 const canvas=createCanvas(152,160),ctx=canvas.getContext('2d');
 const render=(species,leafState,young=false)=>{
  ctx.resetTransform();ctx.clearRect(0,0,152,160);
  ctx.translate(76,141);ctx.scale(.076,.076);ctx.translate(-627,-1065.9);
  const cuts=[];
  ctx.onLeafTear=points=>cuts.push(points);
  R.draw(ctx,assets,{species,young,leafState,kind:'idle',phase:1,reduced:true});
  delete ctx.onLeafTear;
  assert.equal(cuts.length>0,Boolean(leafState&Leaf.TORN),species+' exposes the rendered cut for mending');
  assert.ok(cuts.every(points=>points.length===2&&points.flat().every(Number.isFinite)));
  return Buffer.from(ctx.getImageData(0,0,152,160).data);
 };
 for(const [species] of F.SPECIES.filter(([id])=>!F.Recruitment.retired.includes(id))){
  const normal=render(species,0);
  for(const state of [Leaf.DRY,Leaf.PALE,Leaf.TORN,7]){
   const pixels=render(species,state);
   assert.notDeepEqual(pixels,normal,species+' / '+state);
   assert.deepEqual(render(species,state),pixels,species+' / repeat '+state);
   if(state===Leaf.TORN){
    let cut=0;for(let i=3;i<normal.length;i+=4)if(normal[i]>230&&pixels[i]<100)cut++;
    if(species==='neolbi'){
     // The new notch opens onto the rear hood, so the complete silhouette stays intact.
     assert.equal(cut,0);
     const front=Leaf.texture(assets.neolbiFront,'neolbiFront',Leaf.TORN);
     const ctx=front.getContext('2d'),torn=ctx.getImageData(0,0,front.width,front.height).data;
     const source=createCanvas(front.width,front.height).getContext('2d');
     source.drawImage(assets.neolbiFront,0,0,front.width,front.height);
     const intact=source.getImageData(0,0,front.width,front.height).data;
     let opened=0;
     for(let i=3;i<torn.length;i+=4)if(intact[i]>230&&torn[i]<100)opened++;
     assert.ok(opened>25,'the notch opens in the front hood');
    }else assert.ok(cut>7,species+' retains a readable torn edge ('+cut+' pixels)');
   }
  }
 }
 assert.notDeepEqual(render('dico',0,true),render('dico',0));
 for(const young of [false,true]){
  const intact=render('dico',0,young),belowFronds=119*152*4;
  for(const state of [Leaf.DRY,Leaf.PALE,Leaf.TORN,7]){
   const altered=render('dico',state,young);
   assert.notDeepEqual(altered.subarray(0,belowFronds),intact.subarray(0,belowFronds));
   assert.deepEqual(altered.subarray(belowFronds),intact.subarray(belowFronds),'Dico body and feet · '+young+' / '+state);
  }
 }
 const leaf=assets.rigLeaves;
 assert.equal(Leaf.texture(leaf,'ridley',Leaf.TORN),Leaf.texture(leaf,'ridley',Leaf.TORN));
 assert.equal(Leaf.texture(leaf,'ridley',0),leaf);
});

test('drought keeps the crown and hood attached while both outer hood tips sag',async()=>{
 const alphaAt=(canvas,x,y)=>canvas.getContext('2d').getImageData(
  Math.round(x*(canvas.width-1)),Math.round(y*(canvas.height-1)),1,1).data[3];
 for(const [asset,key,points] of [
  ['rigLeaves','ridley',[[.50,.43],[.55,.48]]],
  ['neolbiFront','neolbiFront',[[.56,.27],[.60,.28],[.61,.35]]],
  ['neolbiRear','neolbiRear',[[.57,.17],[.61,.19],[.52,.23]]],
 ]){
  const im=await loadImage(path.join(web,R.files[asset]));
  const normal=Leaf.texture(im,key,Leaf.PALE),dry=Leaf.texture(im,key,Leaf.DRY);
  for(const [x,y] of points){
   assert.ok(alphaAt(normal,x,y)>240,key+' original attachment');
   assert.ok(alphaAt(dry,x,y)>240,key+' dry attachment');
  }
  if(key==='neolbiFront'){
   const edgeY=(canvas,x)=>{
    for(let row=canvas.height-1;row>=0;row--){
     const y=row/(canvas.height-1);
     if(alphaAt(canvas,x,y)>175)return y;
    }
    throw Error('no visible hood edge');
   };
   for(const x of [.18,.86])assert.ok(edgeY(dry,x)-edgeY(normal,x)>.035,key+' outer tip '+x);
  }
 }
});

function mendingWorld(damage=24,seed=123){
 const s=F.create(0,seed);s.worldTick=420;s.started=true;s.recruitment.nextAttempt=1e9;
 A.run(F,s,'welcome','dico');
 const [buddy,p]=s.individuals;
 Object.assign(p,{x:.35,y:.71,nutrition:60,B:58,energy:80,mood:80,moodSync:80,
  xp:0,visualStage:0,action:'wander',nextObjectChoice:40999});
 Object.assign(buddy,{species:'superbum',name:'슈퍼범',x:.45,y:.71,nutrition:65,B:60,
  damage,energy:65,mood:65,moodSync:65,action:'rest',restSelf:true,nextObjectChoice:40999});
 return {s,buddy,p};
}

test('Lv1 Dico approaches and mends a torn leaf once through the engine',()=>{
 const {s,buddy,p}=mendingWorld();
 F.step(s);
 assert.equal(p.skill.target,buddy.id);
 assert.ok(p.x>.35);
 while(p.skill?.phase==='go'&&s.worldTick<430)F.step(s);
 assert.equal(p.skill?.phase,'do');
 const at=p.skill.at;
 F.advance(s,2);assert.ok(buddy.damage>23);
 F.step(s);
 assert.ok(buddy.damage>13&&buddy.damage<=14);
 assert.equal(buddy.mendedAt,at+3);
 assert.equal(buddy.skillHold,undefined);
 assert.equal(p.skillRest.mend,at+5);
 assert.equal(S.today(s,p),1);
 F.valid(s);
 const saved=F.migrate(JSON.parse(JSON.stringify(s)));
 assert.equal(saved.individuals.find(o=>o.id===buddy.id).mendedAt,at+3);
});

test('A nearby torn leaf takes priority over a free visit, even if Dico has reserved a shelter seat',()=>{
 for(const [seed,openedRequest] of [[1,false],[2,true]]){
  const {s,p,buddy}=mendingWorld(8,seed);
  p.nextObjectChoice=s.worldTick;
  F.step(s);
  assert.equal(s.shelters.nextRequest>1,openedRequest);
  assert.equal(p.shelter.phase,'outside');
  assert.equal(p.shelterRequest,undefined);
  assert.equal(p.objectTask,undefined);
  assert.equal(p.skill?.target,buddy.id);
  F.advance(s,5);
  assert.equal(buddy.damage,0);
  F.valid(s);
 }
 const {s,p}=mendingWorld(0,2);
 p.nextObjectChoice=s.worldTick;
 F.step(s);
 assert.equal(p.objectTask?.object,'shelter','no injured friend: keep the ordinary visit');
 assert.equal(p.shelter.phase,'moving');
});

test('An ordinary object choice cannot cancel Dico on the way or during the three-second stitch',()=>{
 const {s,p,buddy}=mendingWorld(8,1);
 p.x=.25;p.nextObjectChoice=s.worldTick+2;
 F.step(s);
 assert.equal(p.skill?.phase,'go');
 while(p.skill?.phase==='go'&&s.worldTick<443)F.step(s);
 assert.equal(p.skill?.phase,'do');
 const {at}=p.skill;
 p.nextObjectChoice=s.worldTick+1;
 buddy.nextObjectChoice=s.worldTick+1;
 F.advance(s,2);
 assert.equal(p.skill?.phase,'do');
 assert.equal(buddy.skillHold,p.id);
 assert.equal(buddy.damage,8);
 F.step(s);
 assert.equal(buddy.damage,0);
 assert.equal(buddy.mendedAt,at+3);
 assert.equal(buddy.skillHold,undefined);
});

test('An urgent need or strong wind interrupts mending and leaves the friend free',()=>{
 for(const emergency of ['water','wind']){
  const {s,p,buddy}=mendingWorld(8,1);
  F.step(s);
  assert.equal(p.skill?.phase,'do');
  if(emergency==='water')p.B=15;
  else s.weather.wind=76;
  p.nextObjectChoice=s.worldTick;
  F.step(s);
  assert.equal(p.skill,undefined,emergency);
  assert.equal(buddy.skillHold,undefined,emergency);
  assert.equal(buddy.damage,8,emergency);
  assert.equal(buddy.mendedAt,undefined,emergency);
  assert.equal(p.skillRest.mend,s.worldTick+5,emergency);
 }
});

test('Mending upgrades recovery only and locks the same target for 30 seconds',()=>{
 for(const [xp,amount] of [[0,10],[3,10],[8,14],[25,14],[40,18],[85,18],[115,22],[150,26]]){
  const {s,p,buddy}=mendingWorld(34);
  p.xp=xp;assert.ok(S.force(s,p));S.act(s,p);
  assert.equal(p.skill?.phase,'do');
  s.worldTick+=3;S.act(s,p);
  assert.equal(buddy.damage,34-amount);
  assert.equal(p.skillRest.mend,s.worldTick+2);
  const other={...F.clone(buddy),id:'other',x:.55,mendedAt:undefined,damage:12};
  s.individuals.push(other);
  const completed=s.worldTick;
  s.worldTick=completed+1;S.prepare(s);assert.equal(p.skill,undefined);
  s.worldTick=completed+2;S.prepare(s);assert.equal(p.skill?.target,other.id);
  S.stop(s,p);other.damage=0;Leaf.update(other);
  s.worldTick=completed+29;S.prepare(s);assert.equal(p.skill,undefined);
  s.worldTick=completed+30;S.prepare(s);assert.equal(p.skill?.target,buddy.id);
 }
});

test('Mending reserves the most damaged nearby friend and releases them if Dico is picked up',()=>{
 const {s,p,buddy}=mendingWorld();
 const mild={...F.clone(buddy),id:'mild',x:.51,damage:12};
 const other={...F.clone(p),id:'other-dico',x:.62,y:.76};
 s.individuals.push(mild,other);
 assert.ok(S.force(s,p));assert.equal(p.skill.target,buddy.id);
 assert.ok(S.force(s,other));assert.equal(other.skill.target,mild.id);
 S.act(s,p);assert.equal(buddy.skillHold,p.id);
 s.worldTick++;S.prepare(s,{held:p.id});
 assert.equal(buddy.skillHold,undefined);assert.equal(p.skill,undefined);
 assert.equal(buddy.damage,24);assert.equal(buddy.mendedAt,undefined);
 assert.equal(p.skillRest.mend,s.worldTick+5);
});

test('Migration clears the old Dico skill and lets existing saves keep playing',()=>{
 const {s,p,buddy}=mendingWorld();
 p.skill={k:'repose',target:buddy.id,start:s.worldTick,phase:'rest'};
 p.skillRest={repose:s.worldTick+300};
 const saved=F.migrate(JSON.parse(JSON.stringify(s)));
 const dico=saved.individuals.find(o=>o.id===p.id);
 assert.equal(dico.skill,undefined);assert.equal(dico.skillRest?.repose,undefined);
 F.valid(saved);
});

test('Dico swaps the open face for two closed lids and keeps the body joined during both steps',async()=>{
 const dico=await loadImage(path.join(web,R.files.dico)),dicoYoung=await loadImage(path.join(web,R.files.dicoYoung));
 for(const [young,image] of [[false,dico],[true,dicoYoung]]){
  const {width:w,height:h}=image;
  const canvas=createCanvas(w,h),c=canvas.getContext('2d');
  const draw=opt=>{
   c.resetTransform();c.clearRect(0,0,w,h);
   c.translate(w/2,h*.96);c.scale(h/(1.79*520),h/(1.79*520));c.translate(-627,-1065.9);
   R.draw(c,{dico,dicoYoung},{species:'dico',young,kind:'idle',phase:0,reduced:true,...opt});
  };
  const countMarks=()=>{
   const x0=Math.round(w*.23),y0=Math.round(h*.64),width=Math.round(w*.49),height=Math.round(h*.18);
   const {data}=c.getImageData(x0,y0,width,height);
   const light=Uint8Array.from({length:width*height},(_,i)=>{
    const k=i*4;return data[k]>222&&data[k+1]>207&&data[k+2]>170&&data[k+3]>220?1:0;
   });
   let marks=0;
   for(let i=0;i<light.length;i++){
    if(!light[i])continue;
    const pending=[i];light[i]=0;let area=0;
    while(pending.length){
     const j=pending.pop();area++;
     for(const next of [j%width?j-1:-1,j%width<width-1?j+1:-1,j-width,j+width]){
      if(light[next]){light[next]=0;pending.push(next);}
     }
    }
    if(area>5)marks++;
   }
   return marks;
  };
  draw({});assert.equal(countMarks(),3);
  for(const kind of ['rest','repose','sleep']){
   draw({kind});assert.equal(countMarks(),2,kind+' / young '+young);
  }
  draw({phase:4.75,reduced:false});assert.equal(countMarks(),2,'blink replaces the open eyes');
  const baseline=Buffer.from(c.getImageData(0,Math.floor(h*.91),w,h-Math.floor(h*.91)).data);
  for(const phase of [.2,.6]){
   draw({kind:'walk',phase,reduced:false});
   const left=Math.round(w*.47),top=Math.round(h*.911),width=Math.round(w*.06),height=Math.round(h*.027);
   const {data}=c.getImageData(left,top,width,height);
   for(let i=3;i<data.length;i+=4)assert.ok(data[i]>230,'the torso lower centre stays joined');
   assert.notDeepEqual(Buffer.from(c.getImageData(0,Math.floor(h*.91),w,h-Math.floor(h*.91)).data),baseline);
  }
 }
});

test('Ellisii curls both free fronds without exposing the dark crown',async()=>{
 const files=Object.entries(R.files).filter(([k])=>k.startsWith('ellisii'));
 const assets=Object.fromEntries(await Promise.all(files.map(async([k,v])=>[k,await loadImage(path.join(web,v))])));
 const c=createCanvas(270,300).getContext('2d');
 const draw=leafState=>{
  c.resetTransform();c.clearRect(0,0,270,300);
  c.translate(132,287);c.scale(.228,.228);c.translate(-627,-1065.9);
  R.draw(c,assets,{species:'bonbon',kind:'idle',phase:0,reduced:true,leafState});
  return [Buffer.from(c.getImageData(0,65,270,85).data),Buffer.from(c.getImageData(100,163,8,10).data)];
 };
 const [normalFronds,normalCap]=draw(0),[dryFronds,dryCap]=draw(Leaf.DRY);
 assert.notDeepEqual(dryFronds,normalFronds);
 assert.deepEqual(dryCap,normalCap);
});

test('nutrition fades Superbum foliage but keeps its water and fades both sides of Maria’s face opening',async()=>{
 const [wet,maria]=await Promise.all(['superbum_wet_crown','maria'].map(k=>loadImage(path.join(web,R.files[k]))));
 const pale=Leaf.texture(wet,'superbumWetCrown',Leaf.PALE);
 const damaged=Leaf.texture(wet,'superbumWetCrown',Leaf.TORN);
 const base=createCanvas(pale.width,pale.height),c=base.getContext('2d');
 c.drawImage(wet,0,0,pale.width,pale.height);
 const sample=(im,src,x,y)=>Array.from(im.getContext('2d').getImageData(
  Math.round(x*im.width/src.width),Math.round(y*im.height/src.height),1,1).data);
 assert.deepEqual(sample(pale,wet,240,163),sample(base,wet,240,163),'wet crown keeps its water colour');
 assert.notDeepEqual(sample(pale,wet,160,80),sample(base,wet,160,80),'the leaf itself fades');
 const waterBand=im=>im.getContext('2d').getImageData(80,82,93,22).data;
 assert.deepEqual(waterBand(damaged),waterBand(base),'tears and bandage stay clear of the water');

 const c2=createCanvas(656,600).getContext('2d'),scale=594/309;
 for(const cover of [undefined,()=>{}]){
  c2.resetTransform();c2.clearRect(0,0,656,600);
  c2.translate(345.5,581);c2.scale(1/scale,1/scale);c2.translate(-627,-1065.9);
  R.draw(c2,{maria},{species:'maria',kind:'idle',phase:1,reduced:true,expression:'neutral',leafState:Leaf.PALE,bodyCover:cover});
  for(const [x,y] of [[242,371],[255,376],[470,366],[474,367]]){
   const [r,g]=c2.getImageData(x,y,1,1).data;
   assert.ok(r>200&&g>195,'leaf next to the face fades completely at '+x+','+y);
  }
  const [r,g,b]=c2.getImageData(365,400,1,1).data;
  assert.ok(r<150&&r>g&&g>b,'skin stays brown');
 }
});
