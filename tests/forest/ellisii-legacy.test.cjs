const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),F=require('../../app/src/main/assets/web/engine'),O=F.Objects;
test('ELL-SPC-03 Ellisii (legacy key bonbon) drinking at the spring no longer fills its private store V',()=>{
 const s=F.create(0,4);s.started=true;s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;Object.assign(s.weather,{kind:'cloud',wind:10,intensity:0,remaining:240,transition:0});
 const p=s.individuals[0];Object.assign(p,{species:'bonbon',B:30,V:10,energy:70,mood:80,nutrition:70});s.spring.water=40;
 p.objectTask=O.option(s,p,'spring','drink','water');a.ok(!p.objectTask.fail);p.nextObjectChoice=s.worldTick+500;
 const water=F.totalWater(s);let drank=false;for(let n=0;n<120;n++){F.step(s);if(p.B>31)drank=true;}
 a.ok(drank,'Ellisii still drinks');a.equal(p.V,10,'existing V preserved, not refilled');a.ok(F.totalWater(s)<=water+1e-6);});
test('Ellisii portrait grain filter is clipped to the body (no grey square)',()=>{const svg=fs.readFileSync(path.join(__dirname,'../../app/src/main/assets/web/assets/forest/species/ellisii-portrait.svg'),'utf8');a.match(svg,/<feComposite[^>]*in2="SourceGraphic"[^>]*operator="in"/);});
