const {test}=require('node:test'),a=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const web=__dirname+'/../../app/src/main/assets/web/',F=require(web+'engine.js');
function fixture(){const calls=[],ctx=new Proxy({},{get:(_,k)=>k.startsWith('create')?()=>({addColorStop(){}}):(...args)=>calls.push({k,args}),set:()=>true}),sandbox={Forest:F,ForestNeolbi:require(web+'neolbi.js'),ForestRig:require(web+'rig.js'),ForestSurfaces:require(web+'surfaces.js'),ForestCamera:require(web+'camera.js'),ResizeObserver:class{observe(){}},devicePixelRatio:1,document:{querySelector:()=>null},requestAnimationFrame:()=>{}};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(web+'scene.js','utf8')+'\nthis.Scene=ForestScene;',sandbox);const s=F.create(0,88);F.welcomeNeolbi(s);const canvas={getContext:()=>ctx,getBoundingClientRect:()=>({width:420,height:690}),addEventListener(){}};const scene=new sandbox.Scene(canvas,()=>s);return {scene,s,calls};}
const src=fs.readFileSync(web+'scene.js','utf8');
test('SEL222-01 selection ring is drawn in the world pass immediately before the selected body',()=>{
 const ring=src.indexOf('if(!carry&&!this.recording&&this.selected===p.id)this.selectionRing(p,pos,phase);');
 a.ok(ring>=0,'draw the ring for the selected friend');
 const bodyPass=src.slice(ring).split('\n').slice(1,2).join('');
 a.match(bodyPass,/if\(!carry&&.*this\.shelfBack\(p,pos,.*?\)\)\)this\.pet\(p,pos,/, 'draw the rear shelf sprite or the regular pet after the ring');
 a.ok(!/target\.ellipse\(q\.x,q\.y,23\*this\.camera\.scale/.test(src),'old post-lighting overlay ring removed');});
test('SEL222-02 ring is stroke-only, scales with body size, and render does not mutate state',()=>{const {scene,s,calls}=fixture();const r=s.individuals[0],n=s.individuals.find(p=>p.species==='neolbi');const before=JSON.stringify(s);
 scene.selectionRing(r,{x:.4,y:.5},1);const rr=scene.ringPass.rx;a.ok(!calls.some(c=>c.k==='fill'),'no filled disc');a.ok(calls.filter(c=>c.k==='stroke').length>=4);
 scene.selectionRing(n,{x:.6,y:.5},1);a.ok(Math.abs(scene.ringPass.rx/rr-scene.petSize(n)/scene.petSize(r))<1e-9);a.equal(JSON.stringify(s),before);});
test('SEL222-03 night adds near-half glow after lighting; daylight adds none; reduced motion is static',()=>{const {scene,s,calls}=fixture();const r=s.individuals[0];
 s.previewTime='noon';scene.selectionRing(r,{x:.4,y:.5},1);let n=calls.length;scene.ringGlow(scene.target||scene.ctx);a.equal(calls.length,n,'no extra day glow');
 s.previewTime='night';scene.selectionRing(r,{x:.4,y:.5},1);a.ok(scene.ringPass.light<.95);n=calls.length;scene.ringGlow(scene.ctx);const arcs=calls.slice(n).filter(c=>c.k==='ellipse');a.ok(arcs.length>=4);for(const e of arcs){a.ok(e.args[5]>0&&e.args[6]<Math.PI,'near half only');}
 s.settings.reducedMotion=true;scene.selectionRing(r,{x:.4,y:.5},1);const p1=scene.ringPass.pulse;scene.selectionRing(r,{x:.4,y:.5},7);a.equal(scene.ringPass.pulse,p1);});
