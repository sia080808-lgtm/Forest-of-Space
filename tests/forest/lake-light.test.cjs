const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const path=require('node:path');
const web=path.resolve(__dirname,'../../app/src/main/assets/web');
const F=require(web+'/engine.js');
const FX=require(web+'/world-effects.js');

function state(t){
 const s=F.create(0,4);
 s.worldTick=t;
 s.environment.calendar.start=0;
 Object.assign(s.weather,{kind:'sun',wind:0,intensity:0,transition:0});
 return s;
}

test('lake illumination fades around the existing morning, dusk and night clock boundaries',()=>{
 const light=t=>FX.lakeLightProfile(state(t));
 assert.equal(light(0).morning,0);assert.equal(light(90).morning,1);
 assert.ok(light(178).morning>light(182).morning);
 assert.equal(light(360).morning,0);assert.equal(light(360).wash,0);assert.equal(light(360).moon,0);
 assert.ok(light(538).wash<light(542).wash);
 assert.equal(light(570).wash,1);assert.equal(light(570).dusk,1);
 assert.ok(light(597).wash>light(602).wash);
 assert.ok(light(620).moon<light(670).moon);
 assert.ok(light(1138).moon>light(1142).moon);
 assert.equal(light(1150).moon,0);
});

test('one moon per night, eight-night cycle, and saves keep the same phase with a shifted calendar',()=>{
 assert.deepEqual(Array.from({length:9},(_,i)=>FX.lakeLightProfile(state(750+1200*i)).phase),[1,2,3,4,5,6,7,0,1]);
 assert.equal(FX.lakeLightProfile(state(9150)).moon,0);
 const s=state(2000);s.environment.calendar.start=1000;
 const first=FX.lakeLightProfile(s).phase;
 s.worldTick=2280;
 assert.equal(FX.lakeLightProfile(s).phase,first);
 assert.equal(FX.lakeLightProfile(F.migrate(JSON.parse(JSON.stringify(s)))).phase,first);
 s.worldTick+=1200;
 assert.equal(FX.lakeLightProfile(s).phase,(first+1)%8);
});

test('visual weather transitions suppress glints, reduced motion is still, and the sunset image preserves shore colors',async()=>{
 const s=state(570),quiet=FX.lakeLightProfile(s);
 s.weather.kind='cloud';
 const cloud=FX.lakeLightProfile(s);
 assert.ok(cloud.dusk>0&&cloud.dusk<quiet.dusk);
 s.weather.kind='rain';s.weather.intensity=100;
 assert.ok(FX.lakeLightProfile(s).wash<cloud.wash);assert.equal(FX.lakeLightProfile(s).dusk,0);
 Object.assign(s.weather,{kind:'sun',wind:60,intensity:0});
 assert.ok(FX.lakeLightProfile(s).dusk<quiet.dusk);
 const lake=F.World.LAKE,assets=await Promise.all(['lake-floor.png','lake-dusk.webp'].map(f=>loadImage(web+'/assets/forest/lake/'+f)));
 const view=createCanvas(405,432),c=view.getContext('2d');
 s.weather.wind=0;s.settings.reducedMotion=true;
 function render(t){
  c.clearRect(0,0,405,432);c.save();c.translate(-189,72);
  FX.lakeLight(c,s,lake,180,288,t,...assets);c.restore();
  return c.getImageData(0,0,405,432).data;
 }
 const before=JSON.stringify(s),still=render(0);
 const unlit=createCanvas(405,432),base=unlit.getContext('2d');
 base.drawImage(assets[0],0,0,405,432);
 for(const offset of [(32*405+83)*4,(32*405+323)*4]){
  const reference=base.getImageData(0,0,405,432).data;
  assert.ok(still.slice(offset,offset+3).every((v,i)=>Math.abs(v-reference[offset+i])<13));
 }
 assert.ok(still[((233*405+216)*4)+3]>0);
 assert.deepEqual(still,render(3.2));
 assert.equal(JSON.stringify(s),before);
 s.settings.reducedMotion=false;
 assert.notDeepEqual(render(0),render(3.2));
});

test('moon ripples keep the disk continuous and reuse animation frames',()=>{
 const s=state(4350),view=createCanvas(360,576),c=view.getContext('2d'),lake=F.World.LAKE;
 let reflection,draws;
 const draw=c.drawImage.bind(c);
 c.drawImage=(art,...args)=>{draws++;reflection=art;draw(art,...args);};
 const render=t=>{
  draws=0;c.clearRect(0,0,360,576);c.save();c.translate(-540,0);
  FX.lakeLight(c,s,lake,360,576,t,view);c.restore();
  assert.equal(draws,1);
  return reflection;
 };
 const first=render(0),next=render(1);
 assert.notEqual(next,first);
 assert.equal(render(5),first);
 const center=first.getContext('2d').getImageData(48,30,1,36).data;
 for(let i=3;i<center.length;i+=4)assert.ok(center[i]>90);
 s.settings.reducedMotion=true;
 assert.equal(render(3),first);
});
