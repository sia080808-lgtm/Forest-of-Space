import {Window} from 'happy-dom';
import {createRequire} from 'node:module';import fs from 'node:fs';import assert from 'node:assert/strict';const require=createRequire(import.meta.url),F=require('../app/src/main/assets/web/engine.js');
const web=new URL('../app/src/main/assets/web/',import.meta.url).pathname,win=new Window({url:'https://app.test',settings:{disableJavaScriptFileLoading:true,enableJavaScriptEvaluation:true,suppressInsecureJavaScriptEnvironmentWarning:true}});
let saved=F.create(Date.now(),88);saved.started=true;let failed=false,now=0;
win.RidleyNative={read:()=>JSON.stringify(saved),save:text=>{if(failed)return false;saved=JSON.parse(text);return true;},archive:()=>true,theme:()=>{}};
win.performance.now=()=>now;win.requestAnimationFrame=()=>1;
win.HTMLCanvasElement.prototype.getBoundingClientRect=()=>({width:420,height:690,left:0,top:72,right:420,bottom:762});
win.HTMLElement.prototype.setPointerCapture=function(id){this.capture=id;};win.HTMLElement.prototype.hasPointerCapture=function(id){return this.capture===id;};win.HTMLElement.prototype.releasePointerCapture=function(){this.capture=null;};
win.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(o,k)=>k==='measureText'?()=>({width:80}):k.startsWith('create')?()=>({addColorStop(){}}):()=>{},set:()=>true});};
win.Image=class {set src(src){this.width=1280;this.height=1280;setTimeout(()=>this.onload?.(),0);}};
win.document.write(fs.readFileSync(web+'index.html','utf8').replace(/<script[^>]*><\/script>/g,''));
for(const f of ['spatial.js','engine.js','camera.js','surfaces.js','scene.js','audio.js','carry.js','forest-app.js']){let code=fs.readFileSync(web+f,'utf8');if(f==='forest-app.js')code=code.replace('boot();','window.__qa={scene,carry,getState:()=>state};boot();');win.eval(code+(f==='scene.js'?'\nglobalThis.ForestScene=ForestScene;':f==='carry.js'?'\nglobalThis.ForestCarry=ForestCarry;':''));}
await new Promise(r=>setTimeout(r,50));
const {scene,carry,getState}=win.__qa;
assert.ok(win.RidleyApp,'boot');assert.equal(win.document.getElementById('world').hidden,false);
const click=sel=>{const b=win.document.querySelector(sel);assert.ok(b,sel);b.click();};
const canvas=win.document.getElementById('garden');
const pointer=(target,type,x,y,id=1,primary=true)=>target.dispatchEvent(new win.PointerEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,pointerId:id,isPrimary:primary}));
const wp=(type,p,id=1)=>{const q=scene.camera.screen(p);pointer(canvas,type,q.x,q.y+72,id,id===1);};
const original=JSON.parse(JSON.stringify(getState()));
click('[data-pet]');assert.match(win.document.getElementById('select-card').textContent,/리들리/);click('[data-action="move-pet"]');
wp('pointerdown',{x:.5,y:.65});assert.equal(saved.individuals[0].x,original.individuals[0].x,'commit on release only');wp('pointerup',{x:.5,y:.65});assert.equal(saved.individuals[0].x,.5);assert.ok(Math.abs(saved.individuals[0].y-.65)<1e-9);assert.equal(saved.individuals[0].B,original.individuals[0].B);
click('[data-pet]');click('[data-action="move-pet"]');failed=true;wp('pointerdown',{x:.6,y:.65});wp('pointerup',{x:.6,y:.65});assert.equal(saved.individuals[0].x,.5,'failed write rollback');failed=false;
assert.equal(win.document.querySelector('#camera-controls'),null);scene.camera.zoom(99);assert.equal(scene.camera.z,3);scene.camera.zoom(.1);assert.equal(scene.camera.z,1);
scene.camera.zoom(2);const biology=JSON.stringify(getState());pointer(canvas,'pointerdown',200,400);pointer(canvas,'pointermove',260,440);pointer(canvas,'pointerup',260,440);assert.equal(scene.camera.z,2);assert.equal(JSON.stringify(getState()),biology,'pan never changes game state');assert.ok(scene.camera.cx<.5);
// Two fingers own the gesture until both have lifted, including after pinch ends.
pointer(canvas,'pointerdown',140,350);pointer(canvas,'pointerdown',260,350,2,false);pointer(canvas,'pointermove',300,350,2,false);assert.ok(scene.camera.z>2);pointer(canvas,'pointerup',300,350,2,false);pointer(canvas,'pointermove',140,400);assert.equal(carry.session,null);pointer(canvas,'pointerup',140,400);assert.equal(carry.blocked,false);scene.camera.reset();
let pet=win.document.querySelector('[data-pet]');pointer(pet,'pointerdown',210,500);await new Promise(r=>setTimeout(r,380));assert.equal(carry.held,saved.individuals[0].id);wp('pointerdown',{x:.7,y:.65},2);assert.equal(carry.session,null,'second finger cancels held plant');wp('pointerup',{x:.7,y:.65},2);pointer(canvas,'pointerup',210,500);assert.equal(saved.individuals[0].x,.5);
// Actual held release uses inverse camera transform and commits once.
pet=win.document.querySelector('[data-pet]');pointer(pet,'pointerdown',210,500);await new Promise(r=>setTimeout(r,380));assert.ok(carry.held);wp('pointermove',{x:.6,y:.65});const target={...carry.session.result};wp('pointerup',{x:.6,y:.65});assert.ok(target.ok);assert.equal(saved.individuals[0].x,target.x);assert.equal(saved.individuals[0].y,target.y);assert.equal(carry.session,null);
click('#settings');assert.equal(win.document.querySelectorAll('[data-volume]').length,4);const range=win.document.querySelector('[data-volume="music"]');range.value='12';range.dispatchEvent(new win.Event('change',{bubbles:true}));assert.equal(saved.settings.audio.music,.12);
click('[data-tab="world"]');const originalScale=scene.camera.scale,originalCanvas={width:canvas.width,height:canvas.height};click('[data-tab="decorate"]');assert.equal(scene.camera.scale,originalScale);assert.equal(canvas.width,originalCanvas.width);assert.equal(canvas.height,originalCanvas.height);assert.equal(win.document.getElementById('editor').hidden,false);click('[data-action="fold-editor"]');assert.ok(win.document.getElementById('editor').classList.contains('folded'));click('[data-action="cancel-layout"]');
win.RidleyApp.nativePause();assert.ok(saved.offline);win.RidleyApp.nativeResume();assert.equal(saved.offline,null);
console.log('PASS: boot, card release, biology preservation, write rollback, zoom bounds/reset, pan state isolation, pinch ownership, 350ms pickup, second-finger cancel, held drop coordinates, audio sliders, folded layout cancel, pause/resume');await win.happyDOM.abort();win.close();
