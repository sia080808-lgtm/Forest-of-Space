(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestRig=api;})(globalThis,function(){
'use strict';
const Neolbi=typeof module==='object'?require('./neolbi.js'):globalThis.ForestNeolbi;
const Superbum=typeof module==='object'?require('./superbum.js'):globalThis.ForestSuperbum;
const Species=typeof module==='object'?require('./species-rig.js'):globalThis.ForestSpeciesRig;
const Art=typeof module==='object'?require('./creature-art.js'):globalThis.ForestCreatureArt;
const files=Object.freeze({...Species.files,...Neolbi.files,...Superbum.files,...(Art?.ANT_FILES||{}),rigBody:'assets/forest/rig/body.png',rigLeaves:'assets/forest/rig/leaves.png',rigLegLeft:'assets/forest/rig/leg-left.png',rigLegRight:'assets/forest/rig/leg-right.png',rigPalm:'assets/forest/rig/palm.png',rigFace:'assets/forest/rig/face.png'});
// Species share the intact-body invariant; armless Neolbi uses its dedicated leaf/foot rig.
// Species-specific art may replace these independent layers without replacing the motion renderer.
const definition=Object.freeze({width:1254,height:1254,body:'rigBody',leaves:'rigLeaves',legs:Object.freeze(['rigLegLeft','rigLegRight']),palm:'rigPalm'});
function pose(kind,t,reduced=false,wiggle=0){
 if(reduced)return {left:0,right:0,bob:0,reach:0,stroke:0,swing:0};
 const moving=['walk','slow','hurry','run','duck','step','avoid'].includes(kind),speed=kind==='run'?12:kind==='hurry'?10:kind==='slow'?6:8,wave=moving?Math.sin(t*speed):0;
 const cycle=((t%4)+4)%4,reach=kind==='groom'?(cycle<.8?Math.sin(cycle/.8*Math.PI/2):cycle<2.8?1:cycle<3.6?Math.cos((cycle-2.8)/.8*Math.PI/2):0):0;
 return {left:wave*.32+wiggle*.12,right:-wave*.32-wiggle*.12,bob:-Math.abs(wave)*13,reach,stroke:reach===1?Math.sin(cycle*9)*8:0,swing:wave*.08};
}
function draw(c,assets,{kind='idle',phase=0,reduced=false,wiggle=0,bodyAlpha=1,expression,species='ridley',personality,clip,hasProp=false,canopy=0,wind=0,rain=false,deferFront=false,onHood,seed=0,snow=0,restBlend=kind==='rest'?1:0,water=0,side=1}={}){
 if(species==='superbum')return Superbum.draw(c,assets,{kind,phase,reduced,expression,seed,snow,restBlend,water,side});
 if(species==='neolbi')return Neolbi.draw(c,assets,{kind,phase,reduced,wiggle,expression,canopy,wind,rain,deferFront,onHood,personality,clip,hasProp,snow});
 if(Species.draw(c,assets,{kind,phase,reduced,wiggle,expression,species,snow}))return;
 const p=pose(kind,phase,reduced,wiggle);c.save();c.translate(0,p.bob);
 for(const [i,x]of [515,795].entries()){c.save();c.translate(x,930);c.rotate(i?p.right:p.left);c.drawImage(assets[definition.legs[i]],-49,-45,98,202.385);c.restore();}
 c.save();c.globalAlpha*=bodyAlpha;c.drawImage(assets[definition.body],0,0);c.restore();
 if(bodyAlpha===1){
  const e=expression|| (kind==='rest'?'sleepy':kind==='groom'||kind==='drink'?'focused':kind==='held'?'surprised':'neutral');
  const blink=!reduced&&((phase+seed)%4.7)<.16;
  if(e==='neutral'&&!blink&&assets.rigFace)c.drawImage(assets.rigFace,0,0);
  else {c.save();c.strokeStyle='#efe4c7';c.fillStyle='#efe4c7';c.lineWidth=9;c.lineCap='round';
   for(const x of [592,762]){c.beginPath();if(e==='sleepy'||blink){c.moveTo(x-17,793);c.quadraticCurveTo(x,809,x+17,793);}else if(e==='happy'){c.moveTo(x-16,796);c.quadraticCurveTo(x,775,x+16,796);}else if(e==='sad'){c.moveTo(x-15,796);c.lineTo(x+15,803);}else {c.moveTo(x,775);c.lineTo(x,812);}c.stroke();}
   if(e==='surprised'){c.beginPath();c.ellipse(678,849,13,17,0,0,Math.PI*2);c.fill();}else if(e!=='sleepy'){c.beginPath();c.moveTo(664,849);c.lineTo(690,849);c.stroke();}c.restore();}
  c.save();c.translate(640,690);c.rotate(restBlend*.04+(reduced?0:Math.sin(phase*1.4+seed)*.008));c.translate(-640,-690);c.drawImage(assets[definition.leaves],0,restBlend*12);if(snow>0)(typeof module==='object'?require('./world-effects.js'):globalThis.ForestEffects).snow(c,assets[definition.leaves],snow,0,restBlend*12);c.restore();
 }
 const hands=kind==='splash'?[[420,935+Math.sin(phase*7)*16,.2],[930,935-Math.sin(phase*7)*16,-.2]]:kind==='drink'?[[500,870,.2],[930,935,-.2]]:kind==='litter'?[[500,720+Math.sin(phase*5)*20,.2],[930,920,-.2]]:null;
 for(const [x,y,angle]of (hands||[[391,906+restBlend*10,['walk','slow','hurry','run','duck','step','avoid'].includes(kind)?p.swing:.2],[968-210*p.reach,898-232*p.reach+p.stroke,-.2-.5*p.reach]])){c.save();c.translate(x,y);c.rotate(angle);c.drawImage(assets[definition.palm],-43,-52,86,104);c.restore();}
 if(kind==='litter'){c.save();c.translate(500,710);c.rotate(Math.sin(phase*5)*.4);c.drawImage(assets.terrain,733,689,132,68,-35,-20,95,49);c.restore();}
 c.restore();
}
return Object.freeze({files,definition,pose,draw});
});
