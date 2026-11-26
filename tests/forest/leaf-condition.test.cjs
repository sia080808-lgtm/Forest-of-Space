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

test('Dico recruit is a valid friend, and its isolated skill restores 20 points after exactly twenty seconds',()=>{
 const lvl=T.HEX.dico;
 assert.equal(Object.values(lvl).reduce((a,b)=>a+b,0),18);
 const s=F.create(0);A.run(F,s,'welcome','dico');F.valid(s);
 const p=A.motionPreview(F,'repose','dico'),buddy=p.state.individuals[1],dico=p.state.individuals[0];
 assert.equal(buddy.energy,35);p.update(19);assert.equal(buddy.energy,35);
 p.update(1);
 assert.equal(buddy.energy,55);assert.equal(dico.skill,undefined);
 assert.equal(dico.skillRest.repose,p.state.worldTick+300);
 assert.equal(S.today(p.state,dico),1);
 p.update(15);assert.equal(buddy.energy,55);
});

test('all eight active species draw three distinct leaf conditions and reuse cached layers',async()=>{
 const assets=Object.fromEntries(await Promise.all(Object.entries(R.files).map(async([k,v])=>[k,await loadImage(path.join(web,v))])));
 const canvas=createCanvas(152,160),ctx=canvas.getContext('2d');
 const render=(species,leafState,young=false)=>{
  ctx.resetTransform();ctx.clearRect(0,0,152,160);
  ctx.translate(76,141);ctx.scale(.076,.076);ctx.translate(-627,-1065.9);
  R.draw(ctx,assets,{species,young,leafState,kind:'idle',phase:1,reduced:true});
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
    assert.ok(cut>7,species+' retains a readable torn edge ('+cut+' pixels)');
   }
  }
 }
 assert.notDeepEqual(render('dico',0,true),render('dico',0));
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

test('Dico approaches a resting friend in normal play, grants energy once and observes cooldown',()=>{
 const s=F.create(0,123);s.worldTick=420;s.started=true;s.recruitment.nextAttempt=1e9;
 A.run(F,s,'welcome','dico');
 const [buddy,p]=s.individuals;
 Object.assign(p,{x:.35,y:.71,nutrition:60,B:58,energy:80,mood:80,moodSync:80,
  action:'wander',nextObjectChoice:40999});
 Object.assign(buddy,{species:'superbum',name:'슈퍼범',x:.45,y:.71,nutrition:65,B:60,
  energy:26,mood:26,moodSync:26,action:'rest',restSelf:true,nextObjectChoice:40999});
 F.step(s);
 assert.equal(p.skill.target,buddy.id);
 assert.ok(p.x>.35);
 F.advance(s,19);
 assert.ok(buddy.energy<30);
 F.step(s);
 assert.ok(buddy.energy>46&&buddy.energy<48);
 assert.equal(p.skillRest.repose,s.worldTick+300);
 assert.equal(S.today(s,p),1);
 F.valid(s);
});
