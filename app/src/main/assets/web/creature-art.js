(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestCreatureArt=api;})(globalThis,function(){
'use strict';
// v2.24 small creatures (draft art, render only): carrier ants and springtails. Drawn in local units where 1 = body
// length; callers scale to world size. Motion uses the render phase only — never RNG or state.
const INK='rgba(52,40,30,',ANT='#55402f',ANT_HI='#8a6c52';
function shadow(c,rx,ry,a=.16){c.save();c.fillStyle=`rgba(60,48,30,${a})`;c.beginPath();c.ellipse(0,0,rx,ry,0,0,Math.PI*2);c.fill();c.restore();}
// Carrier ant: gaster, petiole, thorax, head; six legs from the thorax in a tripod gait; elbowed antennae.
// Heading 0 = facing +x. Soft warm browns with a light back highlight to sit in the watercolor scene.
function leafPiece(c,len){c.save();c.fillStyle='#c39a5f';c.strokeStyle='rgba(120,88,50,.8)';c.lineWidth=len*.06;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(len*.5,-len*.42,len,0);c.quadraticCurveTo(len*.5,len*.36,0,0);c.fill();c.beginPath();c.moveTo(len*.05,0);c.lineTo(len*.92,0);c.stroke();c.restore();}
function ant(c,{x=0,y=0,size=10,heading=0,phase=0,carry=false,still=false}={}){
 const t=still?0:phase,g=Math.sin(t*16);c.save();c.translate(x,y);
 c.save();c.scale(1,.45);shadow(c,size*.5,size*.26);c.restore();
 c.rotate(heading);c.scale(size,size);c.lineCap='round';c.lineJoin='round';
 // legs from the thorax (x≈0.02): front reaches forward, middle sideways, hind backward. Tripod sets alternate.
 c.strokeStyle=ANT;c.lineWidth=.035;
 for(const [ax,kx,fx,side,set] of [[.06,.16,.24,1,0],[.02,.04,.02,1,1],[-.02,-.1,-.24,1,0],[.06,.16,.24,-1,1],[.02,.04,.02,-1,0],[-.02,-.1,-.24,-1,1]]){
  const sw=(set?g:-g)*.07;c.beginPath();c.moveTo(ax,side*.03);c.lineTo(kx+sw*.5,side*.15);c.lineTo(fx+sw,side*.27);c.stroke();}
 const seg=(cx,rx,ry)=>{const gr=c.createRadialGradient(cx-rx*.25,-ry*.35,ry*.1,cx,0,rx);gr.addColorStop(0,ANT_HI);gr.addColorStop(1,ANT);c.fillStyle=gr;c.beginPath();c.ellipse(cx,0,rx,ry,0,0,Math.PI*2);c.fill();};
 seg(-.28,.19,.13);c.fillStyle=ANT;c.beginPath();c.ellipse(-.08,0,.035,.03,0,0,Math.PI*2);c.fill();seg(.03,.12,.065);seg(.24,.095,.085);
 c.fillStyle='rgba(20,14,10,.8)';for(const s2 of [1,-1]){c.beginPath();c.arc(.27,s2*.05,.018,0,Math.PI*2);c.fill();}
 // antennae: up from the head, elbow, then forward
 const w=still?0:Math.sin(t*8)*.04;c.strokeStyle=ANT;c.lineWidth=.025;
 for(const s2 of [1,-1]){c.beginPath();c.moveTo(.3,s2*.03);c.quadraticCurveTo(.36,s2*.13,.38,s2*(.15+w));c.quadraticCurveTo(.47,s2*(.12+w),.55,s2*(.07-w*.5));c.stroke();}
 if(carry){c.save();c.translate(.36,0);c.rotate(-.35+(still?0:Math.sin(t*16)*.05));leafPiece(c,.55);c.restore();}
 c.restore();
}
// Springtail (Collembola): soft rounded body, short antennae, furcula folded under. Hops in short arcs.
function springtail(c,{x=0,y=0,size=6,phase=0,seed=0,still=false}={}){
 const cycle=1.6+(seed%5)*.17,t=still?0:((phase+seed*.37)%cycle)/cycle,hop=t<.22?Math.sin(t/.22*Math.PI):0,heading=seed*1.7+(still?0:Math.floor((phase+seed*.37)/cycle)*1.1);
 const dx=Math.cos(heading)*hop*size*.25,lift=hop*size*.9;c.save();c.translate(x+dx,y);
 c.save();c.scale(1,.5);shadow(c,size*.42*(1-hop*.4),size*.28*(1-hop*.4),.14);c.restore();
 c.translate(0,-lift);c.rotate(Math.cos(heading)>0?-.15:.15);c.scale(Math.cos(heading)>=0?size:-size,size);
 const body='#9c9aa6',hi='#c9c6cf';c.lineCap='round';
 if(hop>.05){c.strokeStyle=body;c.lineWidth=.07;c.beginPath();c.moveTo(-.3,.08);c.lineTo(-.55,.25);c.stroke();}
 c.fillStyle=body;c.beginPath();c.ellipse(-.06,0,.32,.15,0,0,Math.PI*2);c.fill();
 c.beginPath();c.ellipse(.29,-.03,.13,.11,0,0,Math.PI*2);c.fill();
 c.fillStyle=hi;c.beginPath();c.ellipse(-.1,-.06,.18,.05,0,0,Math.PI*2);c.fill();
 c.fillStyle=INK+'.75)';c.beginPath();c.arc(.34,-.06,.03,0,Math.PI*2);c.fill();
 c.strokeStyle=body;c.lineWidth=.035;for(const s of [1,-1]){c.beginPath();c.moveTo(.36,-.08);c.quadraticCurveTo(.46,-.16-s*.04,.55,-.1-s*.08);c.stroke();}
 c.lineWidth=.03;for(const lx of [.15,0,-.12]){c.beginPath();c.moveTo(lx,.1);c.lineTo(lx+.03,.2);c.stroke();}
 c.restore();
}
// Ant nest entrance: a small crumb mound with a dark hole.
function nest(c,{x=0,y=0,size=14}={}){c.save();c.translate(x,y);c.scale(size,size*.55);
 const crumbs=[[-.42,.05,.13],[-.25,-.12,.1],[.02,-.2,.12],[.28,-.1,.11],[.42,.06,.12],[.2,.18,.1],[-.15,.2,.11],[-.05,-.02,.09]];
 c.fillStyle='rgba(140,112,78,.55)';c.beginPath();c.ellipse(0,0,.55,.35,0,0,Math.PI*2);c.fill();
 for(const [cx,cy,r] of crumbs){c.fillStyle='rgba(122,96,66,.75)';c.beginPath();c.ellipse(cx,cy,r,r*.8,0,0,Math.PI*2);c.fill();}
 c.fillStyle='rgba(48,36,26,.85)';c.beginPath();c.ellipse(0,0,.13,.09,0,0,Math.PI*2);c.fill();c.restore();}
return {ant,springtail,nest};
});
