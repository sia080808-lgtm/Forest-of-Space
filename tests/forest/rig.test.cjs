const {test}=require('node:test'),a=require('node:assert/strict'),path=require('node:path'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../../app/src/main/assets/web'),R=require(web+'/rig.js');
async function assets(){const out={};for(const [k,v]of Object.entries(R.files))out[k]=await loadImage(web+'/'+v);return out;}
test('Dico keeps its base face and body position when starting to walk',async()=>{
 const images={};
 for(const key of ['dico','dicoYoung'])images[key]=await loadImage(web+'/'+R.files[key]);
 const size=260,canvas=createCanvas(size,size),c=canvas.getContext('2d');
 function frame(young,kind,reduced){
  c.resetTransform();c.clearRect(0,0,size,size);c.translate(130,255);
  c.scale(.20,.20);c.translate(-627,-1065.9);
  R.draw(c,images,{species:'dico',kind,young,phase:0,reduced});
  return Buffer.from(c.getImageData(0,0,size,size).data);
 }
 for(const young of [false,true])for(const reduced of [false,true]){
  const still=frame(young,'idle',reduced);
  a.ok(still.some((alpha,i)=>i%4===3&&alpha===255));
  a.deepEqual(frame(young,'walk',reduced),still);
 }
});
test('intact body remains opaque through all limb positions and both directions',async()=>{const images=await assets(),can=createCanvas(320,320),c=can.getContext('2d');
 for(const face of [-1,1]){c.resetTransform();c.clearRect(0,0,320,320);c.translate(160,278);c.scale(face*.25,.25);c.translate(-627,-1065.9);c.drawImage(images.rigBody,0,0);const base=c.getImageData(0,0,320,320).data;
 // 'groom' is left out of this in-place check since 0.6.33: it shakes the whole intact body (the next test still checks one body and both hands)
 for(const kind of ['idle','walk','slow','hurry','run','held','rest','drink','land','duck','step','avoid'])for(let i=0;i<24;i++){
 const t=i/6,p=R.pose(kind,t,false,kind==='held'?Math.sin(t)*.9:0);c.resetTransform();c.clearRect(0,0,320,320);c.translate(160,278);c.scale(face*.25,.25);c.translate(-627,-1065.9-p.bob);R.draw(c,images,{kind,phase:t,wiggle:kind==='held'?Math.sin(t)*.9:0});const actual=c.getImageData(0,0,320,320).data;
 for(let n=3;n<base.length;n+=4)if(base[n]>=250)a.ok(actual[n]>=249,`${kind}/${t} damaged body pixel ${n}`);
 }}
});
test('all motions draw one body and exactly two hands without cutting the torso',async()=>{const images=await assets();for(const kind of ['run','groom','held','rest','duck','step'])for(let t=0;t<4;t+=.2){const draws=[];const c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:k==='drawImage'?(im)=>draws.push(im):()=>{}});R.draw(c,images,{kind,phase:t});a.equal(draws.filter(x=>x===images.rigBody).length,1);a.equal(draws.filter(x=>x===images.rigPalm).length,2);a.equal(draws.filter(x=>x===images.rigLegLeft||x===images.rigLegRight).length,2);}});
test('reduced motion is static and render does not alter its inputs',async()=>{const images=await assets();for(const kind of ['run','groom','held','rest']){a.deepEqual(R.pose(kind,0,true),R.pose(kind,9,true));const options={kind,phase:2,reduced:true};const before={...options};R.draw(createCanvas(1254,1254).getContext('2d'),images,options);a.deepEqual(options,before);}});
test('0.6.34 every species shivers now and then while spider mites are on its leaves, and not while asleep; the render leaves its options unchanged',async()=>{const images=await assets(),can=createCanvas(320,320),c=can.getContext('2d');
 const shot=o=>{c.resetTransform();c.clearRect(0,0,320,320);c.translate(160,300);c.scale(.2,.2);c.translate(-627,-1065.9);R.draw(c,images,o);return Buffer.from(c.getImageData(0,0,320,320).data);};
 for(const species of ['ridley','bonbon','neolbi','bosong','jureong','superbum']){const o={species,kind:'idle',phase:.7,seed:0,itch:true},before=JSON.stringify(o);
  a.notDeepEqual(shot(o),shot({...o,itch:false}),species+' shivers');a.equal(JSON.stringify(o),before);
  a.deepEqual(shot({...o,phase:3}),shot({...o,phase:3,itch:false}),species+' only part of each '+R.ITCH+' s');
  a.deepEqual(shot({...o,kind:'sleep'}),shot({...o,kind:'sleep',itch:false}),species+' not while asleep');}
});
test('1.0.3 광합성 and 볕 쬐기 poses draw every species, bigger motes on the sun rock by day, and grade follows the photosynthesis rule',async()=>{const images=await assets(),can=createCanvas(200,200),c=can.getContext('2d'),V=require(web+'/vitals.js'),F=require(web+'/engine.js');
 const ink=()=>{let n=0;const d=c.getImageData(0,0,200,200).data;for(let i=3;i<d.length;i+=4)if(d[i]>8)n++;return n;};
 for(const species of ['ridley','bonbon','neolbi','bosong','jureong','superbum'])for(const kind of ['photo','bask']){const opt={species,kind,phase:1.5,seed:0};const before=JSON.stringify(opt);c.resetTransform();c.clearRect(0,0,200,200);c.translate(100,180);c.scale(.1,.1);c.translate(-627,-1066);R.draw(c,images,opt);a.ok(ink()>500,species+' '+kind);a.equal(JSON.stringify(opt),before);}
 const area=photo=>{c.resetTransform();c.clearRect(0,0,200,200);c.translate(100,180);c.scale(.1,.1);c.translate(-627,-1066);R.draw(c,images,{species:'ridley',kind:'bask',phase:1.5,photo,seed:0});return ink();};
 // the day bask (photo) adds the big light motes around the friend
 a.ok(area(true)>area(false));
 const s=F.create(0,4);s.weather.kind='sun';s.climate.L=60;const p=s.individuals[0];Object.assign(p,{B:50,nutrition:50});s.worldTick=300;a.ok(['good','near'].includes(V.photoGrade(s,p,F.light(s,p),false)));
 a.equal(V.photoGrade(s,p,F.light(s,p),true),null);s.worldTick=900;a.equal(V.photoGrade(s,p,F.light(s,p),false),null);});
test('1.0.3 슈퍼 광합성: on the sun rock the same water gives 1.5x the 기운 and growth of good light on the ground',()=>{const V=require(web+'/vitals.js'),F=require(web+'/engine.js');
 const run=onRock=>{const s=F.create(0,4);s.weather.kind='sun';s.climate.T=60;s.worldTick=300;const r=s.patches.find(z=>z.id==='rock');r.sun=80;const p=s.individuals[0];Object.assign(p,{B:50,nutrition:50,energy:50,xp:20,growthSeconds:0});
  const [a,c]=require(web+'/traits.js').ofPet(p).light;s.climate.L=(a+c)/2;if(onRock){Object.assign(p,F.Space.rockTop(s));p.objectTask={object:'rock',kind:'rest',reason:'energy',since:0};p.objectArrived=true;}
  const e0=p.energy,led={physiology:0,evaporation:0};const out=V.step(s,p,{light:F.light(s,p),inside:false,moving:false,held:false,ledger:led});return {out,de:p.energy-e0};};
 const g=run(false),k=run(true);a.equal(g.out.grade,'good');a.equal(k.out.grade,'good');a.ok(Math.abs(k.out.water-g.out.water)<1e-9);a.ok(Math.abs(k.out.xp-g.out.xp*V.ROCK_BOOST)<1e-9);a.ok(k.de>g.de);});
test('1.1.5 기운 높음·낮음·바닥 change every species drawing (droop, hop, sigh), only for idle/walk, reduced is static, options unchanged',async()=>{const images=await assets(),can=createCanvas(320,320),c=can.getContext('2d');
 const shot=o=>{c.resetTransform();c.clearRect(0,0,320,320);c.translate(160,300);c.scale(.2,.2);c.translate(-627,-1065.9);R.draw(c,images,o);return Buffer.from(c.getImageData(0,0,320,320).data);};
 for(const species of ['ridley','bonbon','neolbi','bosong','jureong','superbum']){const base=shot({species,kind:'idle',phase:3});
  for(const vigor of ['high','low','faint']){const o={species,kind:'idle',phase:vigor==='high'?.35:3,vigor};const before=JSON.stringify(o);a.notDeepEqual(shot(o),shot({species,kind:'idle',phase:o.phase}),species+' '+vigor);a.equal(JSON.stringify(o),before);}
  a.notDeepEqual(shot({species,kind:'idle',phase:3,droop:1}),base,species+' droop');
  a.deepEqual(shot({species,kind:'rest',phase:3,vigor:'low'}),shot({species,kind:'rest',phase:3}),species+' rest ignores vigor');
  a.deepEqual(shot({species,kind:'idle',phase:1,vigor:'faint',reduced:true}),shot({species,kind:'idle',phase:7,vigor:'faint',reduced:true}),species+' reduced static');}
});
