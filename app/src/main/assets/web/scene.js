'use strict';
class ForestScene {
 // fern clumps on the new ground (world units; the garden is 0..1): x, y, sprite, size, mirrored. Decoration only.
 // 0.8.0 사계절: seasonal pictures of the fern frame, the fern clumps and the leaf-shade plant (tools/build-season-art.py,
 // from the original pixels). Summer uses the original picture. The first 120 s of a season cross-fade from the last one.
 // 0.8.1: the same seasonal palette also on the object atlas (moss, rocks, crevice, litter), the shelter, the leaf-shade
 // ground and the spring's stone basin; the paper background never changes. Season props (sprouts, fallen maple and ginkgo
 // leaves, snow drifts, plum petals) are drawn by seasonProps / seasonFall below.
 static PROPS=['sprout-1','sprout-2','sprout-3','blossom','cherry-1','cherry-2','cherry-pile','bloom-1','bloom-2','bloom-3','maple-1','maple-2','ginkgo-1','ginkgo-2','snow-1','snow-2'];
 static seasonFiles(){const o={},file={frame:'frame',shadePlant:'shade-plant',terrain:'terrain',shelterArt:'shelter-art',shadeGround:'shade-ground'};for(let i=1;i<=6;i++)file['fern'+i]='fern-'+i;for(const [k,f] of Object.entries(file))for(const se of ['spring','autumn','winter'])o[k+'_'+se]='assets/forest/seasons/'+f+'-'+se+'.png';
  for(const se of ['spring','autumn','winter'])o['basin_'+se]='assets/forest/seasons/garden-dry-'+se+'.jpg';for(const n of ForestScene.PROPS)o['prop_'+n]='assets/forest/seasons/props/'+n+'.png';return o;}
 cal(){const E=typeof ForestEnvironment!=='undefined'?ForestEnvironment:null,s=this.state();return E&&s?.environment?E.calendar(s):null;}
 // whole-picture swap for pictures drawn many times a frame (no cross-fade): the new season's picture from halfway through the blend
 sa(name){const A=this.assets,c=this.cal();if(!c)return A[name];const id=c.blend<.5?c.prev:c.id;return id==='summer'?A[name]:A[name+'_'+id]||A[name];}
 seasonal(base,draw){const A=this.assets,E=typeof ForestEnvironment!=='undefined'?ForestEnvironment:null,s=this.state(),c=E&&s?.environment?E.calendar(s):null,pick=id=>id==='summer'?A[base]:A[base+'_'+id]||A[base];
  if(!c){if(A[base])draw(A[base]);return;}const cur=pick(c.id);if(c.blend<1){const prev=pick(c.prev);if(prev)draw(prev);const g=this.ctx;g.save();g.globalAlpha*=c.blend;if(cur)draw(cur);g.restore();}else if(cur)draw(cur);}
 // 0.8.1 봄: flowering tufts grow against the foot of each object (user: "잡초들은 오브젝트들 주위에 좀 자연스럽게"):
 // one or two at the sides of its base, sometimes a small one in front; the stone or leaf covers their back. Open ground stays empty.
 bloomSpots(s){const FOOT={rock:[.075,.012],crevice:[.072,.014],moss:[.07,.03],shade:[.04,.02],spring:[.085,.04]},o=[];
  for(const [j,p] of [...(s.patches||[]),...(s.spring?[{id:'spring',kind:'spring',x:s.spring.x,y:s.spring.y}]:[])].entries()){const f=FOOT[p.kind||p.id];if(!f)continue;const [hw,dy]=f,h=(j*7+3)%5;
   o.push({x:p.x-hw*(.85+.1*(h%2)),y:p.y+dy,size:.062+.01*(h%3),v:1+h%3,flip:h%2});
   if(h!==2)o.push({x:p.x+hw*(.8+.12*((h+1)%2)),y:p.y+dy+.004,size:.052+.01*((h+1)%3),v:1+(h+1)%3,flip:!(h%2)});
   if(h%2===0)o.push({x:p.x-hw*.4,y:p.y+dy+.012,size:.04,v:2,flip:true});}
  return o.sort((a,b)=>a.y-b.y);}
 // 0.8.1 가을: fallen leaves lie around each object (user: "떨어진 단풍잎 … 오브젝트들 주위로"): scattered on an ellipse round
 // its foot, a little uneven, the ones at the back half hidden by the object; open ground stays empty.
 leafRing(s){const RING={rock:[.07,.006,.016],crevice:[.068,.008,.016],moss:[.072,.02,.018],shade:[.045,.014,.014],spring:[.085,.034,.02]},o=[];
  for(const [j,p] of [...(s.patches||[]),...(s.spring?[{id:'spring',kind:'spring',x:s.spring.x,y:s.spring.y}]:[])].entries()){const f=RING[p.kind||p.id];if(!f)continue;const [rx,dy,ry]=f,n=7+j%3;
   for(let k=0;k<n;k++){const r=(j*37+k*53)%97/97,a=(k+r*.7)/n*Math.PI*2+j,d=.8+.35*((j*13+k*29)%11)/11;o.push({x:p.x+Math.cos(a)*rx*d,y:p.y+dy+Math.sin(a)*ry*d,size:.026+.008*((j+k)%3),v:(j*3+k)%4,rot:a*1.7+k});}}
  return o.sort((a,b)=>a.y-b.y);}
 seasonProps(c,w,h){const cal=this.cal();if(!cal)return;const s=this.state(),A=this.assets,sets=cal.blend<1?[[cal.prev,1-cal.blend],[cal.id,cal.blend]]:[[cal.id,1]];
  for(const [se,al] of sets){if(se==='summer'||al<=0)continue;c.save();c.globalAlpha*=al;if(se==='winter'){this.snowCover(c,w,h,s);this.drawPrints(c,w,h);}if(se==='spring'){for(const p of [...(s.patches||[]),...(s.spring?[{x:s.spring.x,y:s.spring.y}]:[])]){const x=p.x*w,y=(p.y+.012)*h,r=.1*w,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(170,198,132,.13)');g.addColorStop(1,'rgba(170,198,132,0)');c.save();c.translate(x,y);c.scale(1,.42);c.translate(-x,-y);c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.restore();}for(const q of this.bloomSpots(s)){const im=A['prop_bloom-'+q.v];if(!im)continue;const dw=q.size*w,dh=dw*im.height/im.width;c.save();c.translate(q.x*w,q.y*h);if(q.flip)c.scale(-1,1);c.drawImage(im,-dw/2,-dh,dw,dh);c.restore();}}
   if(se==='autumn'){const L=['maple-1','ginkgo-1','maple-2','ginkgo-2'];for(const q of this.leafRing(s)){const im=A['prop_'+L[q.v]];if(!im)continue;const sz=q.size*w,kk=sz/Math.max(im.width,im.height);c.save();c.translate(q.x*w,q.y*h);c.scale(1,.6);c.rotate(q.rot);c.drawImage(im,-im.width*kk/2,-im.height*kk/2,im.width*kk,im.height*kk);c.restore();}}
   c.restore();}}
 // winter: one continuous snow cover over most of the ground (cached), the paper showing through in thawing patches;
 // paper-white with a faint cool grey wash along its edges, like snow left blank in an ink painting
 // 1.0.2 (user: B): in a winter whose lake stays open (마른 숲 건기) the snow still covers the shore; only the open water of
 // the lake picture shows, cut out with the ice picture's shape (render only, built once)
 openWater(){if(this._openWater!==undefined)return this._openWater;const f=this.assets.lakeFloor,i=this.assets.lakeIce;if(!f||!i||typeof document==='undefined'||!document.createElement)return this._openWater=f||null;
  const cv=document.createElement('canvas');cv.width=f.width;cv.height=f.height;const q=cv.getContext('2d');q.drawImage(f,0,0);q.globalCompositeOperation='destination-in';q.drawImage(i,0,0,f.width,f.height);return this._openWater=cv;}
 // winter: the whole ground lies under snow (paper-white); the objects' winter pictures have snow-white edges
 snowCover(c,w,h,s){const W=(typeof ForestWorld!=='undefined'?ForestWorld:Forest.World)?.bounds?.(s)||{x0:0,y0:0,x1:1,y1:1};c.save();c.fillStyle='rgb(250,250,247)';c.fillRect(W.x0*w,W.y0*h,(W.x1-W.x0)*w,(W.y1-W.y0)*h);{const LW=typeof ForestWorld!=='undefined'?ForestWorld:Forest.World;if(LW?.lakeOpen?.(s)){const img=LW.frozen?.(s)===false?this.openWater():this.assets.lakeIce;if(img)c.drawImage(img,1.05*w,-.25*h,2.25*w,1.5*h);}}   /* 0.9.0: the lake freezes under the snow */
  // a few very faint, broad grey washes: the gentle rise and fall of the snow (barely visible, no clutter)
  for(let i=0;i<9;i++){const x=(W.x0+((i*.618034+.21)%1)*(W.x1-W.x0))*w,y=(W.y0+((i*.381966+.13)%1)*(W.y1-W.y0))*h,r=(.18+.08*(i%3))*w,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(170,178,184,.07)');g.addColorStop(1,'rgba(170,178,184,0)');c.save();c.translate(x,y);c.scale(1,.38);c.translate(-x,-y);c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.restore();}
  c.restore();}
 // winter footprints (render only, not saved): a pair of soft grey ink dabs per step, fading over 30 s
 footprint(key,pos,p){this._prints??=[];this._printKeys??=new Set();if(this._printKeys.has(key))return;this._printKeys.add(key);if(this._printKeys.size>600)this._printKeys.delete(this._printKeys.values().next().value);
  const big=['neolbi','superbum'].includes(p.species)?1.4:1,side=this._prints.length%2?1:-1;this._prints.push({x:pos.x,y:pos.y,side,big,at:performance.now()/1000});if(this._prints.length>240)this._prints.shift();}
 drawPrints(c,w,h){const ps=this._prints;if(!ps?.length)return;const now=performance.now()/1000,LIFE=30;this._prints=ps.filter(q=>now-q.at<LIFE);c.save();for(const q of this._prints){const a=1-(now-q.at)/LIFE;c.globalAlpha=.4*a*a;c.fillStyle='rgb(140,147,152)';const x=q.x*w+q.side*2.6*q.big,y=q.y*h+1;c.beginPath();c.ellipse(x,y,2.1*q.big,1.3*q.big,0,0,Math.PI*2);c.fill();}c.restore();}
 // a soft patch of lying snow on open ground: paper-white wash with a faint cool grey ink edge (irregular, 3 lobes)
 snowPatch(c,x,y,r,i){c.save();for(let k=0;k<3;k++){const ox=Math.cos(i*1.7+k*2.1)*r*.45,oy=Math.sin(i*2.3+k*1.3)*r*.12,rr=r*(.55+.25*((i+k)%3)/2),g=c.createRadialGradient(x+ox,y+oy,0,x+ox,y+oy,rr);g.addColorStop(0,'rgba(251,251,248,.92)');g.addColorStop(.72,'rgba(246,247,245,.78)');g.addColorStop(.9,'rgba(200,206,210,.22)');g.addColorStop(1,'rgba(200,206,210,0)');c.save();c.translate(x+ox,y+oy);c.scale(1,.34);c.translate(-x-ox,-y-oy);c.fillStyle=g;c.beginPath();c.arc(x+ox,y+oy,rr,0,Math.PI*2);c.fill();c.restore();}c.restore();}
 petalsFromBranch(c,base){const s=this.state(),sp=this.springAmt(),A=this.assets;if(s.settings.reducedMotion||sp<=0)return;const t=this.phase||0,W=this.vw,H=this.camera.visibleHeight;c.save();c.setTransform(base);c.globalAlpha*=sp*.9;
  const hs=q=>{const x=Math.sin(q*127.1+311.7)*43758.5453;return x-Math.floor(x);};for(let i=0;i<5;i++){const im=A['prop_'+(i%2?'cherry-1':'cherry-2')];if(!im)continue;const life=8+hs(i+1)*6,ph=t/life+hs(i+4),cyc=Math.floor(ph),u=ph-cyc,x0=W*hs(i*3.3+cyc*7.1)*.9,y0=-12-hs(i+cyc*2.3)*40,x=x0+u*W*(.35+.25*((i*.29)%1))+Math.sin(t*.9+i)*14,y=y0+u*u*H*.95+u*H*.15,size=6+(i%3)*1.5,k=size/Math.max(im.width,im.height);
   c.save();c.globalAlpha*=Math.min(1,u*6)*(1-Math.max(0,u-.85)/.15);c.translate(x,y);c.rotate(t*(.6+i%3*.3)+i);c.scale(1,.45+.55*Math.abs(Math.cos(t*1.5+i)));c.drawImage(im,-im.width*k/2,-im.height*k/2,im.width*k,im.height*k);c.restore();}
  c.restore();}
 // falling maple/ginkgo leaves in autumn and plum petals in spring (render only; still when motion is reduced)
 // 0.8.1 봄·가을 비바람 (user: "봄이랑 가을엔 비, 바람 불 때 벚꽃이랑 단풍잎 같이 떨어졌으면 … 이펙트로"): while it rains or the
 // wind is up, extra cherry petals (spring) or maple / ginkgo leaves (autumn) are swept across the screen with the wind,
 // falling faster in the rain. Render only (reads the weather, changes nothing); none with reduced motion.
 gust(c,base){const s=this.state(),cal=this.cal();if(!cal||s.settings.reducedMotion)return;const E=typeof ForestEnvironment!=='undefined'?ForestEnvironment:null;if(!E)return;
  const sp=this.springAmt(),au=cal.id==='autumn'?cal.blend:cal.prev==='autumn'&&cal.blend<1?1-cal.blend:0,amt=Math.max(sp,au);if(amt<=0)return;
  const rain=E.precipitation(s,'rain')||0,wind=s.weather?.wind||0,n=Math.min(22,Math.round(rain*12+Math.max(0,wind-25)/45*16));if(n<=0)return;
  const A=this.assets,t=this.phase||0,W=this.vw,H=this.camera.visibleHeight,L=sp>=au?['cherry-1','cherry-2']:['maple-1','ginkgo-1','maple-2','ginkgo-2'],vx=20+wind*2.2,vy=35+rain*90+wind*.4;c.save();c.setTransform(base);c.globalAlpha*=amt*.9;
  const hs=q=>{const x=Math.sin(q*127.1+311.7)*43758.5453;return x-Math.floor(x);},g=.7+.3*Math.sin(t*.45)+.25*Math.sin(t*1.3+2);   /* not tidy: each one its own pace, start and flutter, in gusts */
  for(let i=0;i<n;i++){const r=hs(i+1),life=(W+H)/(vx+vy)*(1.1+r*1.3),ph=t/life+hs(i+9),cyc=Math.floor(ph),u=ph-cyc;if(hs(i*9.3+cyc*3.1)<.2)continue;const im=A['prop_'+L[Math.floor(hs(i+cyc*5.1)*L.length)]];if(!im)continue;
   const a=hs(i*3.1+cyc*17.3),top=hs(i*5.7+cyc*11.9)<.6,x0=top?a*W*1.2-W*.25:-24,y0=top?-24:a*H*.75,x=((x0+u*life*vx*(.7+.6*hs(i+3))*g+Math.sin(t*(.7+r*1.6)+i)*(10+r*16)+30)%(W+60)+W+60)%(W+60)-30,y=((y0+u*life*vy*(.65+.7*hs(i+5))+Math.sin(t*(1.1+r*1.4)+i*2)*(5+r*8)+30)%(H+60)+H+60)%(H+60)-30,size=((sp>=au?8:10)+hs(i+cyc)*5),k=size/Math.max(im.width,im.height);c.save();c.translate(x,y);c.rotate(t*(.8+r*2.2)*(i%2?1:-1)+i);c.scale(1,.3+.7*Math.abs(Math.cos(t*(1.4+r*1.8)+i)));c.drawImage(im,-im.width*k/2,-im.height*k/2,im.width*k,im.height*k);c.restore();}
  c.restore();}
 seasonFall(c,w,h,base){if(base&&this.springAmt()>0)this.petalsFromBranch(c,base);if(base)this.gust(c,base);const cal=this.cal(),s=this.state();if(!cal||s.settings.reducedMotion)return;const al=cal.id==='autumn'||cal.id==='spring'?cal.blend:cal.prev==='autumn'||cal.prev==='spring'?1-cal.blend:0,se=cal.blend<.5?cal.prev:cal.id;if(al<=0||se!=='autumn')return;
  const A=this.assets,t=this.phase||0,W=(typeof ForestWorld!=='undefined'?ForestWorld:Forest.World)?.bounds?.(s)||{x0:0,y0:0,x1:1,y1:1},n=Math.round((se==='autumn'?4:14)*(W.x1-W.x0)*(W.y1-W.y0));c.save();c.globalAlpha*=al*.8;
  for(let i=0;i<n;i++){const name=se==='autumn'?['maple-1','ginkgo-1','maple-2','ginkgo-2'][i%4]:i%2?'cherry-1':'cherry-2',im=A['prop_'+name];if(!im)continue;const span=(W.y1-W.y0)*h,fall=((t*(7+i%4*2)+i*211)%span),x=(W.x0+((i*.618034+.1)%1)*(W.x1-W.x0))*w+Math.sin(t*.6+i)*w*.03,y=W.y0*h+fall,size=(se==='autumn'?.03:.02)*w,k=size/Math.max(im.width,im.height);
   c.save();c.translate(x,y);c.rotate(Math.sin(t*1.3+i)*1.2+i);c.scale(1,.5+.5*Math.abs(Math.cos(t*1.7+i)));c.drawImage(im,-im.width*k/2,-im.height*k/2,im.width*k,im.height*k);c.restore();}
  c.restore();}
 static FERNS=[[-.17,.06,1,.5,0],[1.15,.22,2,.55,1],[-.15,.55,3,.6,0],[1.17,.62,6,.7,1],[.18,-.13,5,.5,0],[.78,-.15,4,.55,1],[.25,1.17,2,.5,1],[.88,1.15,3,.55,0],[-.12,1.05,6,.6,1],[1.12,1.02,1,.45,0],[.5,-.17,6,.55,0]];
 constructor(canvas,getState){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.state=getState;this.assets={};this.selected=null;this.editing=false;this.preview={};this.selectedPatch='moss';this.phase=0;this.display={};this.ready=false;this.onSelect=()=>{};this.onMove=()=>{};this.paused=false;this.drag=null;this.last=0;this.resize=new ResizeObserver(()=>this.measure());this.resize.observe(canvas);this.measure();
  let saved;try{saved=JSON.parse(localStorage.getItem('forest-camera-v2'));}catch{}this.camera=new ForestCamera(saved);this.measure();
 }
 async load(){await Promise.all([...Object.keys(ForestScene.seasonFiles()),'shadePlant','shadeGround','garden','gardenWide','frame','shelterArt','fern1','fern2','fern3','fern4','fern5','fern6','ridley','terrain','basin','lakeFloor','lakeIce','lily_leaf','lily_bud','lily_half','lily_full','lily_sink','lily_wither',...['strider','snail','eggs','tadpole','frog','frogswim','nymph','dragonfly','beetle','medaka','larva'].map(n=>'life_'+n),...Object.keys(ForestRig.files)].map(n=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>{this.assets[n]=im;res();};im.onerror=()=>rej(Error('정원 그림을 불러오지 못했어요.'));im.src=({...ForestScene.seasonFiles(),shadePlant:'assets/forest/shade-plant.png',shadeGround:'assets/forest/shade-ground.png',gardenWide:'assets/forest/garden-wide.png',frame:'assets/forest/frame.png',shelterArt:'assets/forest/shelter-art.png',lakeFloor:'assets/forest/lake/lake-floor.png',lakeIce:'assets/forest/lake/lake-ice.png',...Object.fromEntries(['leaf','bud','half','full','sink','wither'].map(n=>['lily_'+n,'assets/forest/lake/lily-'+n+'.png'])),...Object.fromEntries(['strider','snail','eggs','tadpole','frog','frogswim','nymph','dragonfly','beetle','medaka','larva'].map(n=>['life_'+n,'assets/forest/lake/life-'+n+'.png'])),...Object.fromEntries([1,2,3,4,5,6].map(i=>['fern'+i,'assets/forest/ferns/fern-'+i+'.png']))})[n]||ForestRig.files[n]||'assets/forest/'+(n==='garden'?'garden-open':n==='basin'?'garden-dry':n)+'.png';})));this.prepareLitter();this.ready=true;requestAnimationFrame(t=>this.frame(t));}

 prepareLitter(){const im=this.assets.terrain,c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.drawImage(im,512,512,512,512,0,0,512,512);const silhouette=document.createElement('canvas');silhouette.width=silhouette.height=512;const q=silhouette.getContext('2d');q.drawImage(c,0,0);q.globalCompositeOperation='source-in';q.fillStyle='rgba(62,53,30,.19)';q.fillRect(0,0,512,512);this.litterShadow=silhouette;{/* 1.1.6: the litter shadow's soft edge is baked once (it was a blur filter every frame) */const soft=document.createElement('canvas');soft.width=soft.height=512;const sx=soft.getContext('2d');sx.filter='blur(.6px)';sx.drawImage(silhouette,0,0);this.litterShadowSoft=soft;}this.litterPicked=document.createElement('canvas');this.litterPicked.width=im.width;this.litterPicked.height=im.height;const v=this.litterPicked.getContext('2d');v.drawImage(im,0,0);v.save();v.globalCompositeOperation='destination-out';v.beginPath();v.ellipse(803,714,62,29,-.12,0,Math.PI*2);v.fill();v.restore();}
 measure(){const r=this.canvas.getBoundingClientRect();if(!r.width||!r.height)return;this.vw=r.width;this.vh=r.height;this.w=360;this.h=576;this.camera?.resize(r.width,r.height);const d=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.max(1,r.width*d);this.canvas.height=Math.max(1,r.height*d);this.ctx.setTransform(d,0,0,d,0,0);this.cameraChanged();}
 point(e){const r=this.canvas.getBoundingClientRect();return this.camera.world(e.clientX-r.left,e.clientY-r.top);}
 cameraChanged(){this.onCamera?.(this.camera);}
 saveCamera(){if(this.inspector)return;try{localStorage.setItem('forest-camera-v2',JSON.stringify(this.camera.snapshot()));}catch{}}
 petSize(p){return 48*Forest.Shelter.growth(p)*(p.species==='neolbi'?ForestNeolbi.SIZE:p.species==='superbum'?ForestSuperbum.SIZE:1);}
 petAt(point){return this.state().individuals.filter(p=>p.active).find(p=>Forest.Space.distance(this.display[p.id]||p,point)<.09*(p.species==='neolbi'?ForestNeolbi.SIZE:p.species==='superbum'?ForestSuperbum.SIZE:1));}
 patchAt(point){return [...this.state().patches,{...this.state().spring,id:'spring',name:'샘터'}].filter(p=>p.id!=='shelter').map(p=>({...p,...this.preview[p.id]})).find(p=>Forest.dist(p,point)<.10);}
 handleHit(point,p){const a=this.camera.screen(point),b=this.camera.screen(p);return Math.hypot(a.x-b.x,a.y-b.y)<=24;}
 selectAt(point){const s=this.state(),pet=this.petAt(point);if(pet)return this.onSelect('pet',pet.id);const f=s.shelters?.facilities.find(f=>{const t=Forest.Shelter.transform(f);return point.x*360>t.x&&point.x*360<t.x+220+t.extra&&point.y*576>t.y&&point.y*576<t.y+170;});if(f)return this.onSelect('facility',f.id);const p=s.patches.find(p=>Forest.dist(p,point)<.1)||(s.objects?.litter?.piles||[]).find(p=>Forest.dist(p,point)<.05);if(p)this.onSelect('patch',p.id);else if(Forest.dist(s.spring,point)<.12)this.onSelect('spring','spring');else this.onSelect(null,null);}
 springVisible(){const p=this.camera.screen(this.state().spring);return p.x>-30&&p.x<this.vw+30&&p.y>-30&&p.y<this.vh+30;}

 frame(t){requestAnimationFrame(n=>this.frame(n));if(this.paused||!this.ready||!this.w||t-this.last<33)return;this.dt=Math.min(.1,(t-this.last)/1000||.033);this.last=t;if(this.inspector){this.inspector.update(this.dt);this.phase=this.inspector.time;}else this.phase=t/1000;this.draw();}
 landed(id){this.landing={id,until:this.phase+.8};const p=this.state().individuals.find(p=>p.id===id);this.display[id]={x:p.x,y:p.y};}
 // A friend standing on (or climbing) the sun rock is drawn over it, not hidden by the rock's occlusion pass.
 onRock(pos){const t=Forest.Space.obstacles(this.state()).find(z=>z.id==='rock');return !!t&&((pos.x-t.x)/t.rx)**2+((pos.y-t.y)/t.ry)**2<1;}
 terrain(p){const c=this.ctx,im=this.sa('terrain'),ix={rock:0,moss:1,shade:2,crevice:3,litter:4}[p.id];if(ix===undefined)return;
  const s=this.state(),size={rock:.28,moss:.3,shade:.34,crevice:.25,litter:.23}[p.id]*this.w*(this.objectExpansionPreview?.id===p.id?this.objectExpansionPreview.scale:Forest.Objects.scale(s,p.id)),sh=im.height/2,sw=im.width/3,x=p.x*this.w,y=p.y*this.h;
  const wet=Math.max((p.film||0)*.65,Math.max(0,Math.min(1,(Forest.moisture(p)-20)/60))),phase=s.settings.reducedMotion?0:this.phase;
  ForestSurfaces.ground(c,p,x,y,size,wet);
  ForestSurfaces.puddle(c,p,x,y-size*.025,size,phase,s.settings.reducedMotion,s.weather.kind==='rain');
  if(p.id==='shade'){if(this.assets.shadePlant)this.canopy(p,'base');return;}
  c.save();c.translate(x,y);if(p.id==='shade'){c.beginPath();c.rect(-size/2,-size*.11,size,size*.36);c.clip();}
  if(p.id==='litter'&&s.objects){this.drawLitter(p,size,wet);c.restore();return;}
  if(p.id==='litter'&&this.litterShadow){c.save();c.drawImage(this.litterShadowSoft||this.litterShadow,-size/2,-size*.75+size*.009,size,size);c.restore();}
  {/* 1.1.6: the damp look (brightness/saturate by wetness) is baked into the object's tile once per wetness step instead of a filter pass every frame */const src=p.id==='litter'&&this.litterPicked&&s.individuals.some(q=>q.target==='litter'&&q.motion?.kind==='litter')?this.litterPicked:im,T=c.getTransform(),t=this.wetTile(src,ix,wet,size*Math.max(Math.hypot(T.a,T.b),Math.hypot(T.c,T.d)));if(t)c.drawImage(t,0,0,t.width,t.height,-size/2,-size*.75,size,size);else c.drawImage(src,(ix%3)*sw,Math.floor(ix/3)*sh,sw,sh,-size/2,-size*.75,size,size);}c.restore();
  if((p.snowWater||0)>.01){this.snowTiles??={};if(!this.snowTiles[p.id]){const tile=ForestEffects.canvas(sw,sh);tile.getContext('2d').drawImage(im,(ix%3)*sw,Math.floor(ix/3)*sh,sw,sh,0,0,sw,sh);this.snowTiles[p.id]=tile;}ForestEffects.snow(c,this.snowTiles[p.id],p.snowWater/(12*p.exposure),x-size/2,y-size*.75,size,size);}
 }
 drawLitter(p,size,wet,quantity,compost){const c=this.ctx,s=this.state(),cap=Forest.Objects.capacity(s,'litter');quantity??=Math.min(5,p.O/cap*5);compost??=p.U>.01?Math.min(1,.35+p.U/40):0;
  if(compost>0){this.compostStain(0,-size*.24,size*.34,size*.085,compost,7);
   // A few rotted, darkened leaf fragments show this is where leaves broke down (only when no raw leaves remain).
   if(quantity<.5){const shapes=this.leafShapes;for(let k=0;k<3;k++){const a=k*2.1+.4,pts=shapes[(k*2+1)%shapes.length],cx=pts.reduce((v,q)=>v+q[0],0)/pts.length,cy=pts.reduce((v,q)=>v+q[1],0)/pts.length,ls=size*.95;c.save();c.globalAlpha=.85*Math.min(1,compost+.3);c.translate(Math.cos(a)*size*.16,-size*.24+Math.sin(a)*size*.035);c.scale(1,.55);c.rotate(a*1.7);c.scale(ls/512,ls/512);c.translate(-cx,-cy);{const sp=this.bakeLeaf((k*2+1)%shapes.length,this.leafQ(c,1),{filter:'saturate(.8) brightness(.97)'});c.drawImage(sp.cv,sp.x0,sp.y0,sp.w,sp.h);}c.restore();}}}
  const leaves=this.leafShapes;
  leaves.forEach((pts,i)=>{const alpha=Math.max(0,Math.min(1,quantity-i));if(!alpha)return;c.save();c.scale(size/512,size/512);c.translate(-768,-896);c.globalAlpha=alpha;const wq=Math.round(wet*20)/20,sp=this.bakeLeaf(i,this.leafQ(c,1),{dy:3,sa:.23,filter:wq>0?`brightness(${1-.18*wq}) saturate(${1+.12*wq})`:''});c.drawImage(sp.cv,sp.x0,sp.y0,sp.w,sp.h);c.restore();});   /* 1.1.6: baked leaf sprites (no blur/filter per frame) */
 }
 // Compost soaked into the ground: a soft, uneven brown stain (no dots), stronger with more compost.
 compostStain(x,y,rx,ry,amount,seed){const c=this.ctx,a=Math.max(0,Math.min(1,amount));if(a<=0)return;c.save();
  for(let k=0;k<4;k++){const ox=Math.cos(seed+k*1.9)*rx*.28,oy=Math.sin(seed*1.3+k*2.4)*ry*.3,r=rx*(.55+.18*((k+seed)%3)/2),g=c.createRadialGradient(x+ox,y+oy,0,x+ox,y+oy,r);g.addColorStop(0,`rgba(146,112,70,${.24*a})`);g.addColorStop(.6,`rgba(158,132,94,${.1*a})`);g.addColorStop(1,'rgba(160,134,96,0)');c.fillStyle=g;c.beginPath();c.ellipse(x+ox,y+oy,r,r*ry/rx,0,0,Math.PI*2);c.fill();}
  c.restore();}
 get leafShapes(){return ForestScene.LEAVES??=[[[594,713],[626,710],[669,704],[706,711],[738,731],[764,742],[755,763],[708,780],[662,774],[632,757],[610,731]],[[746,695],[778,677],[806,678],[835,688],[852,703],[867,704],[848,725],[811,742],[786,739],[765,725]],[[782,773],[826,750],[864,732],[900,734],[934,744],[955,738],[947,754],[919,780],[882,803],[845,806],[817,794]],[[565,820],[598,792],[631,790],[657,788],[679,782],[669,808],[653,828],[621,838],[591,834]],[[692,799],[730,786],[766,785],[796,803],[825,823],[840,829],[815,846],[775,863],[745,858],[717,841]]];}
 // v2.24 sectors: loose leaves (one each, no compost) and piles (5~12 raw leaves + compost) on the ground.
 drawFallenLeaf(x,y,rot,size,idx,alpha=1){const sp=this.springAmt();if(sp>0){const im=idx%3?null:this.assets[idx%2?'prop_cherry-1':'prop_cherry-2'];if(im){const c=this.ctx,k=size*.36/Math.max(im.width,im.height);c.save();c.globalAlpha*=alpha*sp;c.translate(x,y);c.scale(1,.7);c.rotate(rot);c.drawImage(im,-im.width*k/2,-im.height*k/2,im.width*k,im.height*k);c.restore();}if(sp>=1)return;alpha*=1-sp;}const c=this.ctx,shapes=this.leafShapes,si=idx%shapes.length,pts=shapes[si],cx=pts.reduce((v,q)=>v+q[0],0)/pts.length,cy=pts.reduce((v,q)=>v+q[1],0)/pts.length;
  // 1.1.6: every fallen leaf used to run a blur filter for its shadow plus a clipped texture draw each frame (in the browser
  // that was over half a frame with a few dozen leaves). Each leaf shape is now baked once into a small sprite (texture,
  // blurred shadow, winter/autumn tint) at the screen's resolution and drawn with the same transform.
  const au=Math.round(this.autumnLeaf()*40)/40,sp2=this.bakeLeaf(si,this.leafQ(c,size/512),{dy:4,sa:.2,wi:Math.round(this.winterAmt()*20)/20,au,tint:au>0?idx%4:0});
  c.save();c.globalAlpha*=alpha;c.translate(x,y);c.scale(1,.62);c.rotate(rot);c.scale(size/512,size/512);c.translate(-cx,-cy);c.drawImage(sp2.cv,sp2.x0,sp2.y0,sp2.w,sp2.h);c.restore();}
 // 1.1.6: a leaf shape baked once into a sprite in leaf (512) space at scale q: optional blurred shadow, the terrain
 // texture clipped to the shape (with a one-time filter), winter white and autumn tint. Drawn later with the leaf's transform.
 // 1.1.6: one terrain tile with the damp filter baked in, per source image, tile and wetness step (1/20); null when dry
 wetTile(im,ix,wet,dev){const wq=Math.round(Math.max(0,Math.min(1,wet))*20)/20;if(wq<=0||!im)return null;this.wetTiles??=new WeakMap();let bank=this.wetTiles.get(im);if(!bank)this.wetTiles.set(im,bank=new Map());const sw=im.width/3,sh=im.height/2,px=Math.min(sw,Math.max(16,Math.ceil((dev||sw)/8)*8)),key=ix+'|'+wq+'|'+px;let t=bank.get(key);
  if(!t){/* baked at the size it is drawn on screen (like the old filtered draw, which filtered after scaling down) */t=document.createElement('canvas');t.width=px;t.height=Math.round(px*sh/sw);const g=t.getContext('2d');g.filter=`brightness(${1-.18*wq}) saturate(${1+.12*wq})`;g.drawImage(im,(ix%3)*sw,Math.floor(ix/3)*sh,sw,sh,0,0,t.width,t.height);bank.set(key,t);if(bank.size>24)bank.delete(bank.keys().next().value);}return t;}
 bakeLeaf(si,q,o={}){const terr=this.sa('terrain'),pts=this.leafShapes[si],key=si+'|'+q.toFixed(4)+'|'+(o.dy??'')+'|'+(o.sa??'')+'|'+(o.filter||'')+'|'+(o.wi||0)+'|'+(o.au||0)+'|'+(o.tint||0);
  this.leafSprites??=new WeakMap();let bank=this.leafSprites.get(terr);if(!bank)this.leafSprites.set(terr,bank=new Map());let sp=bank.get(key);if(sp)return sp;
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const [px,py] of pts){x0=Math.min(x0,px);y0=Math.min(y0,py);x1=Math.max(x1,px);y1=Math.max(y1,py);}const m=4+8/q;x0-=m;y0-=m;x1+=m;y1+=m+(o.dy||0);
  const cv=document.createElement('canvas');cv.width=Math.max(1,Math.ceil((x1-x0)*q));cv.height=Math.max(1,Math.ceil((y1-y0)*q));const g=cv.getContext('2d');g.scale(q,q);g.translate(-x0,-y0);
  const shape=()=>{g.beginPath();pts.forEach(([px,py],j)=>j?g.lineTo(px,py):g.moveTo(px,py));g.closePath();};
  if(o.sa){g.save();g.translate(0,o.dy||0);g.filter='blur(3px)';shape();g.fillStyle=`rgba(62,48,27,${o.sa})`;g.fill();g.restore();}
  g.save();shape();g.clip();if(o.filter)g.filter=o.filter;g.drawImage(terr,0,0);g.filter='none';if(o.wi>0){g.save();g.globalAlpha=.6*o.wi;g.fillStyle='rgb(248,248,245)';g.fillRect(-64,-64,640,640);g.restore();}if(o.au>0){g.globalCompositeOperation='multiply';g.globalAlpha=o.au;g.fillStyle=['#C98C66','#B8735A','#D2AC72','#A87A5C'][o.tint||0];g.fillRect(-64,-64,640,640);}g.restore();
  sp={cv,x0,y0,w:x1-x0,h:y1-y0};bank.set(key,sp);if(bank.size>400)bank.delete(bank.keys().next().value);return sp;}
 leafQ(c,scale){const T=c.getTransform(),dev=Math.max(Math.hypot(T.a,T.b),Math.hypot(T.c,T.d))*scale;return Math.pow(1.25,Math.ceil(Math.log(Math.max(.05,dev))/Math.log(1.25)));}
 // 0.8.0: in autumn the fallen leaves turn orange, rust and amber (render only); fades in and out with the season
 springAmt(){const c=this.cal();return !c?0:c.id==='spring'?c.blend:c.prev==='spring'?1-c.blend:0;}
 winterAmt(){const c=this.cal();return !c?0:c.id==='winter'?c.blend:c.prev==='winter'?1-c.blend:0;}
 autumnLeaf(){const E=typeof ForestEnvironment!=='undefined'?ForestEnvironment:null,s=this.state();if(!E||!s?.environment)return 0;const c=E.calendar(s);return c.id==='autumn'?.45*c.blend:c.prev==='autumn'&&c.blend<1?.45*(1-c.blend):0;}
 // v2.24 sectors: loose leaves (one each, no compost) and piles (5~12 raw leaves heaped in a low mound, compost beneath).
 drawFallen(){const s=this.state(),L=s.objects?.litter;if(!L)return;const c=this.ctx,w=this.w,h=this.h,size=.23*w*.62;
  for(const l of L.leaves)this.drawFallenLeaf(l.x*w,l.y*h,l.rot,size,l.id);
  for(const p of L.piles){const x=p.x*w,y=p.y*h,seed=+p.id.slice(5)||1,n=Math.ceil(p.O-1e-6),R=w*(.03+.02*Math.min(1,(p.O+p.U)/12));
   if(p.U>.01)this.compostStain(x,y+R*.1,R*1.6,R*.6,.45+.55*Math.min(1,p.U/8),seed);
   for(let k=n-1;k>=0;k--){const a=k*2.399+seed*1.7,rad=Math.sqrt((k+.5)/Math.max(n,1))*R,alpha=Math.min(1,p.O-k);this.drawFallenLeaf(x+Math.cos(a)*rad,y+Math.sin(a)*rad*.45-(n-k)/Math.max(n,1)*R*.5,a*1.3,size*(1.1+.12*((k*7+seed)%3)/2),k+seed,Math.max(.25,alpha));}}
  this.drawCreatures();
 }
 // v2.24 6a small neighbours (state is only read here): ant nest + workers, a carrier with its real leaf, springtails on a pile.
 // spider mites and 잎지기 on a friend's leaves: a few tiny mites in the upper leaf area (count follows real density), fine
 // silk at higher density, 잎지기 crawling between them. Render only; positions are a fixed pattern per friend.
 leafNeighbours(p,pos,phase){const s=this.state(),Art=typeof ForestCreatureArt!=='undefined'?ForestCreatureArt:null,on=Forest.Creatures?.onLeaf?.(s,p.id);if(!Art||!on||(!on.mite&&!on.keeper&&!on.mealy&&!on.lady&&!on.ant))return;
  const c=this.ctx,k=this.petSize(p)/48,cx=pos.x*this.w,cy=pos.y*this.h,still=s.settings.reducedMotion,t=still?0:phase,seed=[...p.id].reduce((a,ch)=>a*31+ch.charCodeAt(0)>>>0,7);
  const LEAF=[[-6,-24],[0,-27],[5,-25],[-7,-18],[-1,-21],[5,-19],[-3,-15],[2,-14]],spot=i=>{const b=LEAF[(i+seed)%LEAF.length],j=((seed>>(i*3))%5-2)*.6;return {x:cx+(b[0]+j)*k,y:cy+(b[1]+j*.5)*k};};
  if(on.mite){const n=Math.max(1,Math.min(6,Math.ceil(on.mite.density/16))),pts=[];for(let i=0;i<n;i++){const q=spot(i),dx=still?0:Math.sin(t*.7+i*2.1)*1.2*k;pts.push({x:q.x+dx,y:q.y});}
   if(on.mite.density>=30)for(let i=1;i<pts.length;i++)if(Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y)<9*k)Art.silk(c,[pts[i-1],pts[i]],Math.min(.45,.15+on.mite.density/250));if(on.mite.density>=20){const q=spot(n+1);Art.neighbour(c,this.assets,'spiderMiteEggs',{x:q.x,y:q.y+1*k,size:2.4*k,still:true});}
   // 0.6.38: every third mite drawn is a young one (paler, rounder), and eggs show from density 20
   pts.forEach((q,i)=>i%3===2?Art.neighbour(c,this.assets,'spiderMiteNymph',{x:q.x,y:q.y+1.2*k,size:2.4*k,dir:i%2?1:-1,phase:t+i,still}):Art.leafMite(c,this.assets,{x:q.x,y:q.y,size:3.2*k,kind:'spider',dir:i%2?1:-1,phase:t+i,still}));}
  if(on.keeper){for(let i=0;i<(on.mite&&on.mite.density>=20?2:1);i++){const a=t*.5+i*Math.PI,x=cx+(-1+Math.cos(a)*6)*k,y=cy+(-20+Math.sin(a)*4)*k;Art.leafMite(c,this.assets,{x,y,size:4*k,kind:'keeper',dir:-Math.sin(a)>=0?1:-1,phase:t+i*.5,still});}}
  // 솜깍지 at the leaf base (white waxy bodies), egg sacs from density 20, honeydew drops when real honeydew is there
  if(on.mealy){const d=on.mealy.density,n=Math.max(1,Math.min(4,Math.ceil(d/15))),B=[[-9,-15],[5,-17],[-2,-14],[9,-19]];for(let i=0;i<n;i++){const b=B[(i+seed)%B.length];Art.neighbour(c,this.assets,'mealybug',{x:cx+b[0]*k,y:cy+b[1]*k,size:5*k,dir:i%2?1:-1,phase:t*.2+i,still});}
   // 0.6.38: young crawlers wander a little from density 10
   if(d>=10)for(let i=0;i<(d>=40?2:1);i++){const a=t*.25+i*2.4,b=B[(i+seed+2)%B.length];Art.neighbour(c,this.assets,'mealybugCrawler',{x:cx+(b[0]+Math.cos(a)*3)*k,y:cy+(b[1]+3)*k,size:3*k,dir:Math.sin(a)>=0?1:-1,phase:t*.3+i,still});}
   if(d>=20)for(let i=0;i<(d>=50?2:1);i++)Art.neighbour(c,this.assets,'mealybugSac',{x:cx+(i?11:-12)*k,y:cy+(i?-16:-13)*k,size:3.4*k,still:true});
   if(on.mealy.honey>=10)Art.honeydew(c,cx-2*k,cy-11*k,2.6*k,on.mealy.honey);}
  if(on.lady){const a=t*.4,x=cx+Math.cos(a)*8*k,y=cy+(-12+Math.sin(a)*3)*k;Art.neighbour(c,this.assets,on.lady.stage==='larva'?'ladybirdLarva':'ladybird',{x,y,size:(on.lady.stage==='larva'?6:6)*k,dir:-Math.sin(a)>=0?1:-1,phase:t,still});}
  if(on.ant){const a=t*.6;Art.antSprite(c,this.assets,{x:cx+(14+Math.cos(a)*3)*k,y:cy-1*k,size:9*k,dir:Math.cos(a)>0?-1:1,phase:t,still});}}
 drawCreatures(){const s=this.state(),C=s.objects?.creatures,Art=typeof ForestCreatureArt!=='undefined'?ForestCreatureArt:null;if(!C||!Art||!C.groups.length)return;
  const c=this.ctx,w=this.w,h=this.h,A=this.assets,t=s.settings.reducedMotion?0:this.phase,frac=Math.min(1,Math.max(0,this.phase-(this.tickAt||this.phase)));
  for(const g of C.groups){
   // 뿌리날파리 (adults hover low over the wet litter, larvae show at its edge) and 흙지기 crawling in the soil
   if(g.kind==='gnat'||g.kind==='soilmite'||g.kind==='rove'){const z=Forest.Creatures.site(s,g.site);if(!z)continue;const zx=z.x*w,zy=(z.y-(g.site==='litter'?.03:0))*h,still=s.settings.reducedMotion;
    if(g.kind==='gnat'){if(g.eggs>=2)Art.neighbour(c,A,'rootGnatEggs',{x:zx-w*.016,y:zy+w*.016,size:w*.006,still:true});const nl=Math.min(3,Math.ceil(g.larvae/8));for(let i=0;i<nl;i++)Art.neighbour(c,A,'rootGnatLarva',{x:zx+(i-1)*w*.012,y:zy+w*.012+(i%2)*w*.004,size:w*.008,dir:i%2?1:-1,phase:t*.3+i,still});
     const na=Math.min(4,Math.ceil(g.adults/6));for(let i=0;i<na;i++){const a=t*(1.3+i*.2)+i*1.7,x=zx+Math.cos(a)*w*.03,y=zy-w*.012+Math.sin(a*1.7)*w*.006;Art.neighbour(c,A,'rootGnat',{x,y,size:w*.012,dir:-Math.sin(a)>=0?1:-1,phase:t*3+i,still,lift:w*.01});}}
    else if(g.kind==='soilmite'){const a=t*.3,x=zx+Math.cos(a)*w*.02,y=zy+w*.008+Math.sin(a)*w*.005;Art.neighbour(c,A,'soilMite',{x,y,size:w*.011,dir:-Math.sin(a)>=0?1:-1,phase:t,still});}
    else{// 쏙쏙이: hunts around the wet litter, slips behind its rock/crevice now and then and comes back out
     const hd=s.patches.find(q=>q.id===g.hide)||z,cyc=still?0:(t%14),hx=hd.x*w,hy=(hd.y+.02)*h;let x,y,dir;
     if(cyc<6){const a=t*.45;x=zx+Math.cos(a)*w*.025;y=zy+w*.01+Math.sin(a)*w*.006;dir=-Math.sin(a)>=0?1:-1;}
     else if(cyc<8){const u=(cyc-6)/2;x=zx+(hx-zx)*u;y=zy+w*.01+(hy-zy-w*.01)*u;dir=hx>=zx?1:-1;}
     else if(cyc<11){x=null;}
     else{const u=(cyc-11)/3;x=hx+(zx-hx)*u;y=hy+(zy+w*.01-hy)*u;dir=zx>=hx?1:-1;}
     if(x!=null)Art.neighbour(c,A,'roveBeetle',{x,y,size:w*.028,dir,phase:t,still});}
    continue;}
   if(g.kind==='ant'){const n=g.nest;Art.nestSprite(c,A,{x:n.x*w,y:n.y*h,size:w*.11});
    // two workers patrol around the nest by day in dry, calm weather; at night, in rain, snow or strong wind they stay inside (0.7.1)
    if(Forest.Creatures?.antActive?.(s)!==false)for(let k=0;k<2;k++){const a=t*.35+k*Math.PI,x=n.x*w+Math.cos(a)*w*.06,y=n.y*h+w*.006+Math.sin(a)*w*.02,dir=-Math.sin(a)>=0?1:-1;Art.antSprite(c,A,{x,y,size:w*.03,dir,phase:t+k*.4,still:s.settings.reducedMotion});}
    if(g.carry){// walk out from the nest to the leaf (the leaf still lies there), then carry it to the destination
     const q=g.carry,u=Math.min(1,Math.max(0,(s.worldTick-q.start+frac)/Math.max(1,q.arrive-q.start))),d1=Math.hypot(q.fromX-n.x,q.fromY-n.y),d2=Math.hypot(q.to.x-q.fromX,q.to.y-q.fromY),split=d1/Math.max(1e-6,d1+d2);
     if(u<split){const v=u/split,x=(n.x+(q.fromX-n.x)*v)*w,y=(n.y+(q.fromY-n.y)*v)*h;this.drawFallenLeaf(q.fromX*w,q.fromY*h,q.rot,.23*w*.62,q.leafId);Art.antSprite(c,A,{x,y,size:w*.03,dir:q.fromX>=n.x?1:-1,phase:t,still:s.settings.reducedMotion});}
     else{const v=(u-split)/Math.max(1e-6,1-split),x=(q.fromX+(q.to.x-q.fromX)*v)*w,y=(q.fromY+(q.to.y-q.fromY)*v)*h;Art.antSprite(c,A,{x,y,size:w*.03,dir:q.to.x>=q.fromX?1:-1,phase:t,carry:true,still:s.settings.reducedMotion});}}}
   else{const p=(s.objects.litter.piles||[]).find(z=>z.id===g.pile);if(!p)continue;for(let k=0;k<4;k++){const a=k*1.6+((+g.id.slice(3))||0),r=w*(.022+.008*(k%2));Art.springtailSprite(c,A,{x:p.x*w+Math.cos(a)*r,y:p.y*h+Math.sin(a)*r*.4,size:w*.016,phase:t,seed:k+1,still:s.settings.reducedMotion});}}}
 }
 // 0.6.33: the leaf-shade plant is drawn in two parts. The stems and the grass tuft around their base ('base', below
 // the leaves' undersides: image row 262 left of the stems, 300 to the right) stand on the ground and take part in the normal depth order like the stones; the leaves ('leaves', above
 // it) are overhead and are drawn after every friend, so friends walk under the leaves but in front of / behind the tuft.
 canopy(p,part='leaves'){const c=this.ctx,size=.34*this.w,x=p.x*this.w,y=p.y*this.h,s=this.state(),t=s.settings.reducedMotion?0:this.phase;
 const leaves=()=>{c.moveTo(-64,-64);c.lineTo(640,-64);c.lineTo(640,300);c.lineTo(236,300);c.lineTo(228,262);c.lineTo(-64,262);c.closePath();};
 const a=Math.sin(t*2.25)*(s.weather.wind>=60?13:s.weather.wind>=40?7:2)*Math.PI/180;
 c.save();c.translate(x-size/2,y-size*.75);c.scale(size/512,size/512);
 if(part==='base'){c.save();c.translate(204,395);c.rotate(a);c.translate(-204,-395);c.beginPath();c.rect(-64,-64,704,704);leaves();c.clip('evenodd');this.seasonal('shadePlant',f=>c.drawImage(f,0,0));c.restore();c.drawImage(this.sa('shadeGround'),0,0);c.restore();return;}
 c.save();c.translate(204,395);c.rotate(a);c.translate(-204,-395);c.beginPath();leaves();c.clip();this.seasonal('shadePlant',f=>c.drawImage(f,0,0));ForestEffects.snow(c,this.assets.shadePlant,(p.roofSnow||0)/(12*p.exposure),0,0);
 const wet=Math.max(0,Math.min(1,p.film||0)),rain=s.weather.kind==='rain';
 if(wet>.01){for(const [i,q]of [[42,303],[430,340]].entries()){const cycle=(t*.9+i*.4)%1;c.fillStyle='rgba(143,185,184,'+wet+')';c.beginPath();c.ellipse(q[0],q[1]+3,1.5+cycle*2,2+cycle*3,0,0,Math.PI*2);c.fill();if(rain&&cycle>.7){c.strokeStyle='#a9c9c3';c.lineWidth=1.5;c.beginPath();c.moveTo(q[0],q[1]+5);c.lineTo(q[0],q[1]+8+(cycle-.7)*60);c.stroke();}}}
 c.restore();c.restore();
 }
 springFlow(){const real=this.state(),s={...real,spring:{...real.spring,...this.preview.spring}},x=s.spring.x*this.w,y=s.spring.y*this.h;const g=this.objectExpansionPreview?.id==='spring'?this.objectExpansionPreview.scale:Forest.Objects.scale(s,'spring');this.springAt(this.ctx,s,x,y,g,this.phase);}
 // The spring as it looks in the world: the stone basin cut from the garden art, then the water surface. Also used by
 // the first-meeting card so its spring is the same object (0.6.29).
 springAt(c,s,x,y,g,phase){c.save();c.translate(x,y);c.scale(g,g);c.translate(-x,-y);const im=this.sa('basin');if(im){c.save();c.translate(x,y);c.beginPath();c.moveTo(-69,6);c.bezierCurveTo(-73,-21,-47,-43,-18,-43);c.bezierCurveTo(6,-51,45,-31,62,-5);c.bezierCurveTo(78,30,37,42,-6,40);c.bezierCurveTo(-46,39,-75,25,-69,6);c.closePath();c.clip();c.drawImage(im,0,980,420,270,-72,-47.22,147.65625,101.25);c.restore();}ForestSurfaces.spring(c,s,x+4,y+5,phase);this.springSeason(c,s,x+4,y+5,phase);c.restore();}
 // 0.8.1: winter ice over the water (a pale paper-white sheet with fine ink cracks); autumn: a few maple/ginkgo leaves float
 springSeason(c,s,x,y,phase){const cal=this.cal();if(!cal||!(s.spring?.water>0))return;const A=this.assets,amt=se=>cal.id===se?cal.blend:cal.prev===se?1-cal.blend:0,ice=amt('winter'),fall=amt('autumn'),lvl=Math.max(.15,Math.min(1,s.spring.water/(s.spring.capacity||60)));
  if(ice>0){c.save();c.globalAlpha*=ice;ForestSurfaces.basin(c,x,y,1);c.clip();ForestSurfaces.basin(c,x,y,lvl);c.clip();const g=c.createLinearGradient(x-30,y-14,x+20,y+16);g.addColorStop(0,'rgba(248,248,244,.78)');g.addColorStop(1,'rgba(214,222,224,.62)');c.fillStyle=g;c.fillRect(x-42,y-20,84,42);c.strokeStyle='rgba(96,104,108,.4)';c.lineWidth=.6;for(const [a,b,d,e] of [[-18,-4,2,3],[2,3,14,-6],[2,3,6,12],[-8,6,-20,9]]){c.beginPath();c.moveTo(x+a,y+b);c.lineTo(x+d,y+e);c.stroke();}c.restore();}
  if(fall>0){c.save();c.globalAlpha*=fall;const t=s.settings.reducedMotion?0:phase;for(const [i,dx,dy] of [[0,-16,0],[1,8,-4],[2,18,6]]){const im=A['prop_'+['maple-1','ginkgo-1','maple-2'][i]];if(!im)continue;const k=11/Math.max(im.width,im.height);c.save();c.translate(x+dx+Math.sin(t*.3+i)*2,y+dy);c.scale(1,.55);c.rotate(i*2.1+Math.sin(t*.2+i)*.3);c.drawImage(im,-im.width*k/2,-im.height*k/2,im.width*k,im.height*k);c.restore();}c.restore();}}

 drinkContact(p){return ['drink','splash'].includes(p.motion?.kind)&&p.target==='spring'&&(p.motion.water>0||p.motion.kind==='splash'&&this.state().spring.water>=this.state().spring.capacity*.2);}
 ripples(p,water){const s=this.state();if(water<=0||s.settings.reducedMotion)return;const drinking=s.individuals.some(x=>x.motion?.water>0&&x.target==='spring'&&p===s.spring&&!this.carry);if(s.weather.kind!=='rain'&&!drinking)return;
  const c=this.ctx,w=this.w,h=this.h,phase=this.phase;for(let i=0;i<2;i++){const age=(phase+i*.5)%1,offset=Math.sin(Math.floor(phase+i*.5)*2.7+i)*.028;c.strokeStyle=`rgba(223,237,230,${(1-age)*.6})`;c.lineWidth=.9;c.beginPath();const radius=(.005+.03*age)*w;c.ellipse((p.x+offset)*w,(p.y+.008)*h,radius,radius*.3,0,0,Math.PI*2);c.stroke();}
 }
 // Selection ring: drawn in the world pass before the body so it sits under the feet and shares world lighting.
 // 0.6.35 crevice nook: where a resting friend sits in the crevice art (terrain tile 3, 512 px drawn at size x size from
 // (-size/2, -.75 size)): the gap floor under the big stone is at about tile (246, 345); the small front stone is traced by nookStone()
 creviceGeom(){const s=this.state(),z=s.patches.find(q=>q.id==='crevice');if(!z)return null;const size=.25*this.w*Forest.Objects.scale(s,'crevice');return {z,size,x:z.x*this.w,y:z.y*this.h,px:(u,v)=>({x:z.x*this.w+(u-256)/512*size,y:z.y*this.h+(v-384)/512*size})};}
 nookPos(p){const t=p.objectTask;if(!(p.active&&!p.mounted&&t&&t.object==='crevice'&&t.kind==='rest'&&t.arrived&&Forest.Space.distance(p,t)<.002))return null;const g=this.creviceGeom();if(!g)return null;const q=g.px(246,345);return {x:q.x/this.w,y:q.y/this.h};}
 // the small front stone's outline in the crevice tile, measured from the art: its left edge is where the dark gap shading
 // ends (tile x 304 at y 258 down to 277 at y 340), then over its top and round its right side to the bottom
 nookStone(below){const g=this.creviceGeom();if(!g)return null;const left=[[304,258],[298,266],[295,272],[291,278],[289,284],[285,290],[283,296],[283,308],[280,314],[279,320],[278,332],[277,340],[280,350]],
  rest=below?[[280,440],[472,440],[468,300]]:[[300,354],[452,352],[464,332],[468,310]];return [...left,...rest,[460,288],[440,268],[410,254],[370,247],[330,249]].map(([u,v])=>g.px(u,v));}
 nookClip(){const c=this.ctx,pts=this.nookStone(true);c.save();if(!pts)return;c.beginPath();c.rect(-1e4,-1e4,3e4,3e4);pts.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));c.closePath();c.clip('evenodd');}
 creviceFront(){const g=this.creviceGeom(),im=this.sa('terrain'),pts=this.nookStone(false);if(!g||!im||!pts)return;const c=this.ctx,sw=im.width/3,sh=im.height/2,wet=Math.max((g.z.film||0)*.65,Math.max(0,Math.min(1,(Forest.moisture(g.z)-20)/60)));
  c.save();c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));c.closePath();c.clip();{const T=c.getTransform(),t=this.wetTile(im,3,wet,g.size*Math.max(Math.hypot(T.a,T.b),Math.hypot(T.c,T.d)));if(t)c.drawImage(t,0,0,t.width,t.height,g.x-g.size/2,g.y-g.size*.75,g.size,g.size);else c.drawImage(im,0,sh,sw,sh,g.x-g.size/2,g.y-g.size*.75,g.size,g.size);}c.restore();}
 // 1.1.6: draw fn into a buffer covering the friend (its box in the 1254 px rig frame, feet at 627,1066, tall enough for 슈퍼범), darken it by ×0.86
 // (= the old brightness(.86) filter) and put it back; the main canvas's clip and alpha still apply
 dimmed(c,fn){const T=c.getTransform(),pts=[[-450,-1000],[1700,-1000],[-450,1350],[1700,1350]].map(([u,v])=>[T.a*u+T.c*v+T.e,T.b*u+T.d*v+T.f]);
  const W=this.canvas.width,H=this.canvas.height,bx=Math.max(0,Math.floor(Math.min(...pts.map(q=>q[0])))),by=Math.max(0,Math.floor(Math.min(...pts.map(q=>q[1])))),bw=Math.min(W,Math.ceil(Math.max(...pts.map(q=>q[0]))))-bx,bh=Math.min(H,Math.ceil(Math.max(...pts.map(q=>q[1]))))-by;if(bw<=0||bh<=0)return;
  const buf=this.dimBuf??=document.createElement('canvas');if(buf.width<bw||buf.height<bh){buf.width=Math.max(buf.width,bw);buf.height=Math.max(buf.height,bh);}const o=buf.getContext('2d');o.setTransform(1,0,0,1,0,0);o.globalCompositeOperation='source-over';o.globalAlpha=1;o.clearRect(0,0,bw,bh);
  o.setTransform(T.a,T.b,T.c,T.d,T.e-bx,T.f-by);fn(o);o.setTransform(1,0,0,1,0,0);o.globalCompositeOperation='source-atop';o.globalAlpha=1;o.fillStyle='rgba(0,0,0,.14)';o.fillRect(0,0,bw,bh);o.globalCompositeOperation='source-over';
  c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(buf,0,0,bw,bh,bx,by,bw,bh);c.restore();}
 selectionRing(p,pos,phase){const c=this.ctx,s=this.state(),k=this.petSize(p)/48,x=pos.x*this.w,y=pos.y*this.h+1.5*k,rx=21*k,ry=6.6*k,light=Forest.Environment.lighting?.(s)?.brightness||1,boost=Math.min(1.6,1/Math.max(.58,light)),pulse=s.settings.reducedMotion?.5:.5+.5*Math.sin(phase*2.4),a=v=>Math.min(1,v*boost);this.ringPass={x,y,rx,ry,lw:Math.max(1,k*.8),pulse,light};
  c.save();
  c.lineCap='round';const lw=Math.max(1,k*.8);c.strokeStyle=`rgba(64,52,20,${a(.26)})`;c.lineWidth=.4*lw;c.beginPath();c.ellipse(x,y,rx+1.4*lw,ry+1*lw,0,0,Math.PI*2);c.stroke();
  for(const [wd,al] of [[3.3,.2],[2.2,.32],[1.3,.6]]){c.strokeStyle=`rgba(255,206,84,${a(al*(.8+.4*pulse))})`;c.lineWidth=wd*lw;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.stroke();}
  c.strokeStyle=`rgba(255,253,236,${a(1)})`;c.lineWidth=.65*lw;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.stroke();c.restore();}
 pet(p,pos,kind,phase,night,held=false){const c=this.ctx,s=this.state(),level=Forest.level(p),growth=Forest.Shelter.growth(p),size=48*growth,x=pos.x*this.w,y=pos.y*this.h;
  const moving=['walk','slow','hurry','run','duck','step','avoid'].includes(kind),reduced=s.settings.reducedMotion,beat=phase*(kind==='run'?16:kind==='hurry'?12:kind==='slow'?6:9),stride=moving&&!reduced?Math.sin(beat):0;
  if(!held)ForestSurfaces.wash(c,x,y,9*growth,2*growth,'68,61,42',.20,1);
  c.save();c.translate(x,y);if(kind==='moss'&&!s.settings.reducedMotion)c.rotate(Math.sin(this.phase*1.4)*.025);if(kind==='sniff'&&!s.settings.reducedMotion){const u=((phase%1.1)+1.1)%1.1,nod=u<.45?Math.abs(Math.sin(u/.15*Math.PI))*.09:0;c.rotate(((p.species==='neolbi'||p.species==='superbum'?.07:.14)+nod)*(this.facing?.[p.id]||1));}   /* 0.8.7: smelling the grass, leaning forward; (user "킁킁 할 때 살짝 까닥") every 1.1 s three quick little nods (킁킁킁), then a pause */c.scale(p.species==='neolbi'&&(p.canopy||(p.canopyProgress||0)>0||p.canopyClosing)?1:this.facing?.[p.id]||1,1);   /* 0.8.7 (user: "왼쪽으로 갈 땐 왼쪽 보고 오른쪽으로 갈 땐 오른쪽"): 엘레판 also faces where it walks, except while its leaf umbrella is open or closing (the friends' seats under it are on its right) */const drink=kind==='drink'||kind==='splash'&&p.motion?.water>0&&Math.sin(phase*3)>.35,rest=kind==='rest'||kind==='moss',groom=kind==='groom',land=kind==='land';
  const heldAge=held?Math.max(0,this.inspector?phase%3:phase-(this.carry?.phaseStart??phase)):0,wriggleAge=heldAge-.2,wiggle=held&&!reduced&&wriggleAge>=0&&wriggleAge<.8?Math.sin(wriggleAge*Math.PI*5)*Math.sin(wriggleAge*Math.PI/.8):0;
  const context=held?null:Forest.Space.context(s,pos);if(moving&&!reduced){if(context==='duck'||kind==='duck'){c.translate(0,1.5*growth);c.rotate(-.10);}if(context==='step'||kind==='step')c.translate(0,-Math.abs(stride)*2*growth);if(context==='avoid'||kind==='avoid')c.rotate(stride*.045);}
  const visual=this.visual||(this.visual={}),v=visual[p.id]||(visual[p.id]={rest:rest?1:0,phase:phase});
  const elapsed=Math.min(.1,Math.max(0,phase-v.phase));v.phase=phase;v.rest+=Math.sign((rest?1:0)-v.rest)*Math.min(Math.abs((rest?1:0)-v.rest),elapsed/0.8);if(reduced)v.rest=rest?1:0;
  // 0.6.38: a 슈퍼범 entering, resting in or leaving a shelter folds its nest leaf (render only; the shelter outline is this pose)
  const huddleTo=p.species==='superbum'&&p.shelter?.facilityId&&['entering','restingInside','exiting'].includes(p.shelter.phase)?1:0;v.huddle??=huddleTo;v.huddle+=Math.sign(huddleTo-v.huddle)*Math.min(Math.abs(huddleTo-v.huddle),elapsed/0.6);if(reduced)v.huddle=huddleTo;
  const targetCanopy=p.species==='neolbi'&&!held?(p.canopyProgress??(p.canopy?1:0)):0;v.canopy??=0;v.canopy+=Math.sign(targetCanopy-v.canopy)*Math.min(Math.abs(targetCanopy-v.canopy),elapsed/.6);if(reduced)v.canopy=targetCanopy;
  // 0.8.7 (user: "앉아 있는 모션 좀 성의가 없는데, 엘리시처럼 다리가 짧아졌다가 일어날 때 원래 길이로"): sitting down at a walk's
  // end, the legs shorten over 0.6 s and grow back when it stands up: the part above the legs moves down, the leg band is
  // kept on the ground while the body settles over them, like 엘리시 (rig option sit). Render only.
  const sitTo=kind==='rest'&&p.stroll?.arrivedAt!=null?1:0;v.sit??=sitTo;v.sit+=Math.sign(sitTo-v.sit)*Math.min(Math.abs(sitTo-v.sit),elapsed/.6);if(reduced)v.sit=sitTo;
  v.sitK=v.sit>0?v.sit*v.sit*(3-2*v.sit):0;   // 엘리시 uses it as its own rest amount (its sit used to snap in at once)
  const seed=[...p.id].reduce((n,x)=>n+x.charCodeAt(0),0)%47/10;
  const bob=v.rest*1.4*growth+(reduced?0:Math.sin(phase*(rest?1.6:1.5)+seed)*(rest?.4:.14));
  c.translate(0,bob);if(!reduced)c.rotate(held?wiggle*.08:drink?.1+Math.sin(phase*5)*.06:0);
  c.scale(1,land?.97:1);const shade=s.patches.find(z=>z.id==='shade');if(!held&&((shade&&Math.abs(pos.x-shade.x)<.09&&Math.abs(pos.y-shade.y)<.04)||s.individuals.some(n=>n.id!==p.id&&n.active&&n.species==='neolbi'&&n.canopyProgress>=1&&ForestNeolbi.canFit(n,pos,p)))){if(p.species==='neolbi')c.filter='brightness(.86)';else this.dimNext=true;}   /* 1.1.6: under the shade a friend is dimmed by drawing it once into a small buffer and darkening that (source-atop, the same ×0.86), not with a filter on every one of its draws; 엘레판 keeps the filter (its canopy is drawn in a later pass from its matrix) */
  // 0.9.3 호수 이벤트 반응 (user: friends react differently): startle (frog plops in), slip (on the winter ice), watch
  // (dragonfly, fireflies). Each species moves its own way; render only, from World.reaction and the ice.
  let RX=null;if(!held&&!reduced){const W=Forest.World,R=W?.reaction?.(s,p);if(R){const key=R.kind+(s.worldTick-R.age);if(v.rxKey!==key){v.rxKey=key;v.rxT=phase;}const el=phase-v.rxT,dur=R.kind==='startle'?1.6:5;if(el<dur)RX={k:R.kind,u:el/dur};}
   if(!RX&&moving&&W?.onIce?.(s,p)){const u=(phase+seed*1.7)%8;if(u<1.4)RX={k:'slip',u:u/1.4};}}
  if(RX){const u=RX.u,e=Math.sin(Math.PI*Math.min(1,u)),sp=p.species;
   if(RX.k==='watch')c.rotate(-.05*e);
   else if(RX.k==='startle'){if(sp==='ridley'){c.translate(-size*.14*e,-size*.16*e);c.rotate(-.3*e);}
    else if(sp==='bonbon'){c.translate(-size*.05*e,0);c.scale(1+.12*e,1-.22*e);}
    else if(sp==='neolbi'){c.translate(0,size*.05*e);c.scale(1+.05*e,1-.08*e);}
    else if(sp==='bosong')c.translate(0,-size*.14*e);
    else if(sp==='jureong'){const w=Math.sin(u*Math.PI*5)*(1-u);c.scale(1-.1*w,1+.2*w);}
    else c.translate(0,-size*.1*e);}
   else{if(sp==='ridley'){c.translate(size*.06*e,0);c.rotate(Math.sin(u*Math.PI*3)*.35*(1-u*.4));}
    else if(sp==='bonbon'){const j=Math.sin(u*Math.PI*8);c.translate(j*size*.03,0);c.rotate(.05*j);}
    else if(sp==='neolbi')c.rotate(.05*e);
    else if(sp==='bosong'){c.translate(size*.1*e,0);c.rotate(-.12*e);}
    else if(sp==='jureong'){c.translate(size*.1*e,0);c.scale(1+.08*e,1-.18*e);}
    else c.rotate(Math.sin(u*Math.PI*2)*.16);}}
  // Common intact-body renderer for every current and future character.
  c.save();c.scale(size/1254,size/1254);c.translate(-627,-1065.9);
  const expression=this.inspector?.expression!=='auto'&&this.inspector?.expression|| (RX?.k==='watch'?'happy':RX?'surprised':kind==='photo'?'happy':kind==='bask'?'sleepy':rest?'sleepy':held?'surprised':p.B<35||p.energy<40||p.burden>=40?'sad':groom||drink||kind==='sniff'?'focused':this.selected===p.id?'happy':'neutral');const rigOpt={kind:p.species==='superbum'&&kind==='idle'&&p.harvestTick>0?'collect':kind==='sniff'?'drink':RX&&RX.k!=='watch'&&['bosong','neolbi'].includes(p.species)?RX.k:kind,water:p.species==='superbum'?(p.V||0)/Forest.Social.NEST:0,phase:(typeof ForestNeolbi!=='undefined'&&p.species==='neolbi'?ForestNeolbi.Motion.active(s,p):null)?s.worldTick-(typeof ForestNeolbi!=='undefined'&&p.species==='neolbi'?ForestNeolbi.Motion.active(s,p):null).start+(phase%1):phase,reduced,wiggle,seed,restBlend:v.rest,huddle:v.huddle||0,vigor:held||RX||rest?null:p.energy>=80?'high':p.energy<15?'faint':p.energy<40?'low':null,photo:['bask','photo'].includes(kind)&&this.photoOnRock?.[p.id],expression,species:p.species,itch:(Forest.Creatures?.onLeaf?.(s,p.id)?.mite?.density||0)>=5,personality:p.personality,clip:(typeof ForestNeolbi!=='undefined'&&p.species==='neolbi'?ForestNeolbi.Motion.active(s,p):null)?.id,snow:Math.min(1,(p.snowWater||0)/(12*Forest.Environment.area(p))),wetFilm:p.wetFilm||0,damage:p.damage||0,burden:p.burden||0,canopy:v.canopy,wind:s.weather.wind,rain:s.weather.kind==='rain',deferFront:p.species==='neolbi'&&!held&&v.canopy>.001,onHood:m=>{if(!m||![m.a,m.b,m.c,m.d,m.e,m.f].every(Number.isFinite))return false;(this.hoodPasses??=[]).push({matrix:[m.a,m.b,m.c,m.d,m.e,m.f],open:v.canopy,snow:Math.min(1,(p.snowWater||0)/(12*Forest.Environment.area(p))),wet:p.wetFilm||0,time:phase,reduced,filter:c.filter,alpha:c.globalAlpha,rain:s.weather.kind==='rain'});return true;}};{const dim=this.dimNext;this.dimNext=false;const go=cx=>ForestRig.draw(cx,this.assets,{...rigOpt,sit:v.sit>0||sitTo?v.sitK:undefined});if(dim)this.dimmed(c,go);else go(c);}c.restore();
  if(RX&&RX.k!=='watch'&&p.species==='superbum'&&(p.V||0)>2){c.save();c.fillStyle='#a8ccd1';c.globalAlpha=.8*(1-RX.u);for(let j=0;j<4;j++){const a=j*1.3+.4,r=size*(.25+RX.u*.35);c.beginPath();c.ellipse(Math.cos(a)*r*.8,-size*.75+RX.u*RX.u*size*.5-Math.sin(a)*r*.3,1.1,1.6,0,0,Math.PI*2);c.fill();}c.restore();}   /* 슈퍼범: the nest water slops over */
  if(p.wetFilm>.1&&p.species!=='neolbi'){c.save();c.globalAlpha=p.wetFilm*.5;c.fillStyle='#bdd6cc';for(let j=0;j<3;j++){c.beginPath();c.ellipse((j-1)*size*.15,-size*(.55+Math.abs(j-1)*.12),.7,1.2,0,0,Math.PI*2);c.fill();}c.restore();}if(p.burden>=20||p.damage>=10){c.save();c.fillStyle=p.burden>=20?'#8da7a2':'#b49e74';c.globalAlpha=.7;c.beginPath();c.ellipse(size*.34,-size*.40,1.7,2.2,0,0,Math.PI*2);c.fill();c.restore();}if(drink){c.fillStyle='#a8ccd1';c.beginPath();c.arc(size*.04,-size*.17,1.2,0,Math.PI*2);c.fill();}
  c.restore();
 }

 interaction(p,pos,kind,t){const c=this.ctx,z=this.state().patches.find(z=>z.id===p.target),x=pos.x*this.w,y=pos.y*this.h;
 if(z?.id==='moss'&&['moss','rest'].includes(kind)){const width=48*Forest.Shelter.growth(p)*(p.species==='neolbi'?1.5:p.species==='superbum'?1.7:1),size=.3*this.w*Forest.Objects.scale(this.state(),'moss');c.save();c.beginPath();c.moveTo(x-width*.55,y+9);c.lineTo(x-width*.55,y-2);for(let i=0;i<8;i++){const xx=x-width*.55+i*width*.14;c.quadraticCurveTo(xx+width*.04,y-8-(i%3)*1.2,xx+width*.14,y-4);}c.lineTo(x+width*.57,y+9);c.closePath();c.clip();c.drawImage(this.sa('terrain'),512,0,512,512,z.x*this.w-size/2,z.y*this.h-size*.75,size,size);c.restore();}
 if(kind==='splash'||kind==='drink'){c.save();c.strokeStyle='#e6eee1';c.globalAlpha=.6;c.lineWidth=.5;for(let i=0;i<2;i++){const q=(t+i*.5)%1;c.beginPath();c.ellipse(x,y,2+q*9,.5+q*2,0,0,Math.PI*2);c.stroke();}c.restore();}
 }

 prepareShelter(){if(this.shelterPaper)return;const im=this.assets.garden;this.shelterPaper=document.createElement('canvas');const can=this.shelterPaper;can.width=im.width;can.height=im.height;const c=can.getContext('2d');c.drawImage(im,0,0);const patch=document.createElement('canvas');patch.width=530;patch.height=370;const q=patch.getContext('2d');q.drawImage(im,500,540,520,370,0,0,530,370);q.globalCompositeOperation='destination-in';const v=q.createLinearGradient(0,0,0,370);v.addColorStop(0,'transparent');v.addColorStop(.10,'black');v.addColorStop(.90,'black');v.addColorStop(1,'transparent');q.fillStyle=v;q.fillRect(0,0,530,370);q.globalCompositeOperation='destination-in';const h=q.createLinearGradient(0,0,530,0);h.addColorStop(0,'black');h.addColorStop(.86,'black');h.addColorStop(1,'transparent');q.fillStyle=h;q.fillRect(0,0,530,370);c.drawImage(patch,0,180);}
 shelterArt(f,front=false){const Sh=Forest.Shelter,t=Sh.transform(f),c=this.ctx,im=this.assets.garden;c.save();
 if(front){const outer=[[35,470],[25,380],[70,315],[150,257],[240,238],[340,255],[415,310],[455,405],[445,425]];c.beginPath();for(const [i,[x,y]]of outer.entries()){const px=t.x+Sh.sourceX(x,f),py=t.y+(y-190)*t.sy;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();const poly=Sh.polygon(f);for(const[i,q]of poly.entries())i?c.lineTo(q.x*360,q.y*576):c.moveTo(q.x*360,q.y*576);c.closePath();c.clip('evenodd');}
 /* 1.2.0 mirrored shelter: only the picture is flipped here; the clip paths above already use the mirrored outline */c.save();if(f.flip){c.translate(2*t.x+220+t.extra,0);c.scale(-1,1);}if(this.sa('shelterArt'))c.drawImage(this.sa('shelterArt'),0,0,500,330,t.x,t.y,220+t.extra,330*t.sy);else c.drawImage(im,0,190,500,330,t.x,t.y,220+t.extra,330*t.sy);c.restore();const snow=(this.state().patches.find(p=>p.id==='shelter')?.roofSnow||0)/1.2;if(snow>.01){c.save();c.globalAlpha=Math.min(.85,snow);c.strokeStyle='#f1f1e2';c.lineWidth=2.2;c.lineCap='round';c.beginPath();[[70,315],[150,257],[240,238],[340,255],[415,310]].forEach(([x,y],i)=>{const xx=t.x+Sh.sourceX(x,f),yy=t.y+(y-190)*t.sy;i?c.lineTo(xx,yy):c.moveTo(xx,yy);});c.stroke();c.restore();}
  c.restore();}
 shelterFront(p,pos){const Sh=Forest.Shelter,s=this.state(),f=Sh.facility(s,p.shelter?.facilityId);if(!f||!['entering','restingInside','exiting'].includes(p.shelter.phase)||!Sh.inPoly(pos,Sh.polygon(f)))return;
  // Only the physical wooden arch may cover an admitted character. The entrance
  // ground and the rectangular source-image paper always stay below every pet.
  const c=this.ctx,t=Sh.transform(f),poly=Sh.polygon(f),b=Sh.bounds(p,pos);c.save();
  c.beginPath();c.rect(b.left*360-2,b.top*576-2,(b.right-b.left)*360+4,(b.bottom-b.top)*576+4);c.clip();
  c.beginPath();const arch=[[35,470],[25,380],[70,315],[150,257],[240,238],[340,255],[415,310],[455,405],[410,398],[400,364],[372,328],[326,300],[276,292],[218,307],[171,345],[143,396],[149,447]];
  arch.forEach(([x,y],i)=>{const px=t.x+Sh.sourceX(x,f),py=t.y+(y-190)*t.sy;i?c.lineTo(px,py):c.moveTo(px,py);});c.closePath();c.clip();this.shelterArt(f);c.restore();
 }
 shelterDebug(){if(!this.inspector?.scenario?.startsWith('SH'))return;const c=this.ctx,s=this.state(),Sh=Forest.Shelter;c.save();c.font='8px sans-serif';for(const f of s.shelters.facilities){const poly=Sh.polygon(f),a=Sh.ledger(s,f);c.strokeStyle='#4b8169';c.beginPath();poly.forEach((q,i)=>i?c.lineTo(q.x*360,q.y*576):c.moveTo(q.x*360,q.y*576));c.closePath();c.stroke();const t=Sh.transform(f);c.fillStyle='#334d40';c.fillText((a.used/4)+' used / '+(a.reserved/4)+' reserved / '+a.total/4,t.x+25,t.y+184);}for(const p of s.individuals){const b=Sh.bounds(p);c.strokeStyle=Sh.inside(s,p)?'#538661':'#b37a4d';c.strokeRect(b.left*360,b.top*576,(b.right-b.left)*360,(b.bottom-b.top)*576);}c.restore();}

 draw(){const target=this.ctx,d=this.canvas.width/this.vw;   /* 1.1.4: the world is drawn straight onto the screen and lit in place (no world buffer and no whole-frame filter each frame) */target.save();target.setTransform(d,0,0,d,0,0);target.clearRect(0,0,this.vw,this.vh);target.restore();target.save();target.setTransform(d,0,0,d,0,0);this.ringPass=null;try{this.drawWorld();}finally{this.ctx=target;target.restore();}target.save();target.setTransform(d,0,0,d,0,0);ForestEffects.gradeOver?ForestEffects.gradeOver(target,this.state(),this.vw,this.vh):ForestEffects.grade(target,target.canvas,this.state(),this.vw,this.vh);const s=this.state(),night=['night','deep','dawn'].includes(Forest.Environment.timeKey(s));if(night){for(let i=0;i<(s.settings.reducedMotion?2:6);i++){target.fillStyle=`rgba(234,234,163,${.2+.4*Math.abs(Math.sin(this.phase*.5+i))})`;target.beginPath();const q=this.camera.screen({x:i%2?.94:.05,y:.2+(i*.139)%.7});target.arc(q.x,q.y,1.3*this.camera.scale,0,Math.PI*2);target.fill();}}this.fireflies(target);this.ringGlow(target);target.restore();}
// 0.9.3 여름밤 반딧불: soft lights drifting over the lake shore, drawn after grading so they glow at night. Render only.
fireflies(c){const s=this.state();if(!Forest.World?.fireflies?.(s))return;const t=s.settings.reducedMotion?0:this.phase||0,hs=q=>{const x=Math.sin(q*127.1+311.7)*43758.5453;return x-Math.floor(x);};c.save();
 for(let i=0;i<30;i++){const x=1.2+hs(i+1)*1.9+Math.sin(t*.13+i)*.025,y=-.05+hs(i+7)*1.1+Math.sin(t*.17+i*2)*.03,q=this.camera.screen({x,y}),b=Math.max(0,Math.sin(t*(.6+hs(i+3)*.7)+i*1.9)),r=(2.4+b*2.2)*this.camera.scale;if(b<.05)continue;
  const g=c.createRadialGradient(q.x,q.y,0,q.x,q.y,r*2.4);g.addColorStop(0,`rgba(246,240,170,${.9*b})`);g.addColorStop(.3,`rgba(226,232,140,${.35*b})`);g.addColorStop(1,'rgba(220,230,140,0)');c.fillStyle=g;c.beginPath();c.arc(q.x,q.y,r*2.4,0,Math.PI*2);c.fill();}
 c.restore();}
ringGlow(t){const r=this.ringPass,n=r?Math.min(1,Math.max(0,(.95-r.light)/(.95-.58))):0;if(!n)return;// Night: add light after grading, only on the near half of the ring so the body still covers the back half.
  t.save();t.translate(this.camera.tx,this.camera.ty);t.scale(this.camera.scale,this.camera.scale);t.globalCompositeOperation='lighter';t.lineCap='round';
  for(const [wd,al] of [[5,.10],[3,.18],[1.6,.32],[.7,.5]]){t.strokeStyle=`rgba(255,${wd<1?236:196},${wd<1?170:80},${al*n*(.8+.4*r.pulse)})`;t.lineWidth=wd*r.lw;t.beginPath();t.ellipse(r.x,r.y,r.rx,r.ry,0,.05,Math.PI-.05);t.stroke();}t.restore();}
 // 0.7.0 넓은 숲: the world rectangle follows the open regions; the camera is told when it changes
 syncWorld(b){const k=[b.x0,b.y0,b.x1,b.y1].join();if(this.worldKey!==k){this.worldKey=k;this.camera.setWorld(b);}}
 // the floor: the wide forest floor (garden-wide.png, baked shelter already erased) over the forest region, plus the fern
 // clumps on the new ground. Without the wide floor (old asset set) the garden floor is drawn as before.
 // 0.9.1 수련: flat on the water (drawn with the floor, under every friend). Day rhythm is render only: open flowers close
 // to a bud at night and in heavy rain, half open at dusk and dawn. A slow bob unless motion is reduced.
 // 0.9.2 물가 이웃: each creature plays its 6-frame strip (tools/draw-lake-life.py) and moves a little on its own (render
 // only: positions are the saved ones; the drift below never changes state). Striders and dragonflies hide in heavy rain,
 // dragonflies rest at night; motion stops when motion is reduced.
 drawLakeLife(c,w,h){const s=this.state(),A=this.assets,tk=Forest.Environment?.timeKey?.(s),red=s.settings.reducedMotion,t=red?0:this.phase||0,night=tk==='night'||tk==='deep',storm=s.weather.kind==='rain'&&s.weather.intensity>=.4||s.weather.wind>=60;
  const SZ={strider:24,snail:13,eggs:18,tadpole:9,frog:18,nymph:16,dragonfly:26,beetle:13,medaka:11,larva:8},FPS={strider:4,snail:2,tadpole:6,nymph:3,dragonfly:14,beetle:3,medaka:6,larva:3};
  const sprite=(kind,x,y,frame,face=1,size=SZ[kind],alpha=1)=>{const im=A['life_'+kind];if(!im)return;const n=Math.max(1,Math.round(im.width/im.height)),fw=im.width/n,f=((frame%n)+n)%n,d=size*1.6;c.save();c.globalAlpha*=alpha;c.translate(x,y);if(face<0)c.scale(-1,1);c.drawImage(im,f*fw,0,fw,im.height,-d/2,-d/2,d,d);c.restore();};
  // 0.9.3 (user "비 올 때 호수에도 빗방울 파형 적용"): raindrop rings on open water while it rains (not on the ice). Render only.
  {const W=Forest.World,rain=Forest.Environment?.precipitation?.(s,'rain')||0;if(rain>0&&!W.frozen?.(s)){const hs=q=>{const x=Math.sin(q*127.1+311.7)*43758.5453;return x-Math.floor(x);},n=Math.round(40+rain*120);c.save();c.strokeStyle='rgba(244,249,247,.9)';c.lineWidth=.8;
   for(let i=0;i<n;i++){const per=.9+hs(i+.5)*.8,ph2=t/per+hs(i+2),cyc=Math.floor(ph2),uu=ph2-cyc,x=1.36+hs(i*7.1+cyc*1.3)*.5,y=-.22+hs(i*3.7+cyc*2.9)*1.44;if(W.waterD(x,y)>=.99)continue;const r=1.5+uu*(5+rain*5);c.globalAlpha=(1-uu)*.85;c.beginPath();c.ellipse(x*w,y*h,r,r*.38,0,0,Math.PI*2);c.stroke();if(uu>.3){c.globalAlpha=(1-uu)*.35;c.beginPath();c.ellipse(x*w,y*h,r*.55,r*.2,0,0,Math.PI*2);c.stroke();}}
   c.restore();}}
  const LP=this._lifePos??={},now=this.phase||0;   // 1.1.2: the engine moves them once a second — ease the drawn spot after it
  for(const o of s.world?.lake?.life||[]){let hsh=0;for(const ch of o.id)hsh=(hsh*31+ch.charCodeAt(0))>>>0;let q=LP[o.id];if(!q||red||Math.hypot(o.x-q.x,o.y-q.y)>.1)q=LP[o.id]={x:o.x,y:o.y,t:now};else{const k=Math.min(1,Math.max(0,now-q.t)*2.5);q.x+=(o.x-q.x)*k;q.y+=(o.y-q.y)*k;q.t=now;}
   const moving=o.tx!=null,mdir=moving?(o.tx>=o.x?1:-1):0;
   const ph=(hsh%100)/100*6.283,X=q.x*w,Y=q.y*h,fr=k=>Math.floor(t*(FPS[k]||4)+hsh);
   if(o.kind==='strider'){if(storm)continue;const a=t*.35+ph,r=7;sprite('strider',X+Math.cos(a)*r,Y+Math.sin(a)*r*.5,fr('strider'),moving?-mdir:Math.sin(a)>0?-1:1);}
   else if(o.kind==='snail'){const dx=Math.sin(t*.05+ph)*4;sprite('snail',moving?X:X+dx,Y,fr('snail'),moving?mdir:Math.cos(t*.05+ph)>0?1:-1);}
   else if(o.kind==='eggs')sprite('eggs',X,Y+Math.sin(t*.8+ph)*.4,0);
   else if(o.kind==='tadpole'){for(let i=0;i<(o.n||4);i++){const a=t*.9+ph+i*1.57,r=5+i;sprite('tadpole',X+Math.cos(a)*r,Y+Math.sin(a)*r*.6,fr('tadpole')+i,moving?-mdir:Math.sin(a)>0?-1:1);}}
   else if(o.kind==='frog'){   // a 24 s round: sit, leap into the water, swim a slow loop, swim back and climb out, sit again
    if(moving&&o.dive==null){sprite('frogswim',X,Y,Math.floor(t*5+hsh),mdir,18,.9);continue;}   // 1.1.2 swimming to another pad
    let u=(t+ph*4)%24;const face=hsh&1?1:-1;
    if(o.dive!=null&&!red){const D=this._dive??={};if(D[o.id]?.at!==o.dive)D[o.id]={at:o.dive,t0:t};const el=t-D[o.id].t0;if(el<12.5){u=8+el;if(el>1&&el<3.2){const q=(el-1)/2.2;c.save();c.strokeStyle='rgba(236,244,240,.8)';c.lineWidth=.6;for(let r=0;r<2;r++){const k=Math.max(0,q-r*.25);c.globalAlpha=(1-k)*.9;c.beginPath();c.ellipse(X+face*10,Y+1,2+k*10,.8+k*3.5,0,0,Math.PI*2);c.stroke();}c.restore();}}}   // 0.9.3 개구리 깜짝: it plops straight in, with a splash
    if(u<8)sprite('frog',X,Y,0,face);
    else if(u<9.2)sprite('frog',X+face*(u-8)*8,Y,Math.floor((u-8)/1.2*5),face);
    else if(u<20.5){const v=(u-9.2)/11.3,a=v*6.283,rx=16,ry=7,sx=X+face*10+Math.sin(a)*rx*face,sy=Y+(1-Math.cos(a))*ry,dirx=Math.cos(a)*face;sprite('frogswim',sx,sy,Math.floor(t*5+hsh),dirx>=0?1:-1,18,.9);}
    else sprite('frog',X+face*(1-(u-20.5)/3.5)*10,Y,u<21.7?Math.floor((u-20.5)/1.2*5):0,face);}
   else if(o.kind==='nymph')sprite('nymph',X,Y-6,fr('nymph'));
   else if(o.kind==='dragonfly'){if(storm||night)continue;const a=t*.5+ph;sprite('dragonfly',X+Math.sin(a)*22,Y-18+Math.sin(a*2)*7,fr('dragonfly'));}
   else if(o.kind==='beetle'){const a=t*.2+ph;sprite('beetle',X+Math.cos(a)*6,Y+Math.sin(a)*3,fr('beetle'),moving?mdir:1,SZ.beetle,.85);}
   else if(o.kind==='medaka'){for(let i=0;i<5;i++){const a=t*.6+ph+i*.5,r=9+i*1.5;sprite('medaka',X+Math.cos(a)*r*(moving?.4:1)-mdir*i*4,Y+Math.sin(a)*r*.5*(moving?.4:1),fr('medaka')+i,moving?-mdir:Math.sin(a)>0?-1:1,SZ.medaka,.85);}}
   else if(o.kind==='larva'){for(let i=0;i<3;i++)sprite('larva',X+(i-1)*5,Y+(i%2)*3,fr('larva')+i*2);}}}
 drawLilies(c,w,h){const s=this.state(),W=Forest.World,A=this.assets,tk=Forest.Environment?.timeKey?.(s),t=s.settings.reducedMotion?0:this.phase||0;
  for(const l of s.world?.lake?.lilies||[]){let st=W.lilyStage(s,l);if(!st)continue;
   if(st==='full'||st==='half'){if(tk==='night'||tk==='deep'||s.weather.kind==='rain'&&s.weather.intensity>=.6)st='bud';else if(st==='full'&&(tk==='dusk'||tk==='dawn'))st='half';}
   const im=A['lily_'+st];if(!im)continue;let hsh=0;for(const ch of l.id)hsh=(hsh*31+ch.charCodeAt(0))>>>0;const k=.85+(hsh%31)/100,dw=64*k,dh=dw*im.height/im.width,flip=hsh&1;
   c.save();c.translate(l.x*w,l.y*h+Math.sin(t*.8+hsh)*.35);if(flip)c.scale(-1,1);c.drawImage(im,-dw*160/320,-dh*130/220,dw,dh);c.restore();}}
 drawFloor(c,w,h){const A=this.assets,f=Forest.World?.REGIONS.forest;
  if(A.gardenWide&&f){c.drawImage(A.gardenWide,f.x0*w,f.y0*h,(f.x1-f.x0)*w,(f.y1-f.y0)*h);
   // 0.9.0 동쪽 호수 물가 (0.9.5: the whole lake, art x 1.05..3.3) (fading in over the forest's east edge); only the open part shows (world clip)
   if(A.lakeFloor&&Forest.World?.lakeOpen?.(this.state()))c.drawImage(A.lakeFloor,1.05*w,-.25*h,2.25*w,1.5*h);
   if(Forest.World?.lakeOpen?.(this.state())){this.drawLilies(c,w,h);this.drawLakeLife(c,w,h);}
   for(const [x,y,i,sz,flip] of ForestScene.FERNS){const im=A['fern'+i];if(!im)continue;const k=sz*.55,dw=im.width*k,dh=im.height*k;c.save();c.translate(x*w,y*h);if(flip)c.scale(-1,1);this.seasonal('fern'+i,f=>c.drawImage(f,-dw/2,-dh,dw,dh));c.restore();}}
  else{this.prepareShelter();c.drawImage(this.shelterPaper,0,0,w,h);}}
 // the fern frame: fixed to the screen edges at today's size (where the garden's edge ferns sat in the default view),
 // drawn over the floor and under every object and friend. It does not move or scale with the camera.
 drawFrame(c,base){const im=this.assets.frame;if(!im||this.state().settings?.showFrame===false)return;   /* 0.8.5: the fern frame can be turned off in the settings (user: "고사리 프레임 적용 온 오프 기능") */const cam=this.camera,fw=360*cam.fit,fh=576*cam.fit;c.save();c.setTransform(base);this.seasonal('frame',f=>c.drawImage(f,(this.vw-fw)/2,(cam.visibleHeight-fh)/2,fw,fh));c.restore();}
 // SRS v2.36 고유 스킬 (render only): 베이치's puddles (wash ellipse, smaller as the water goes) and the faint mist round
 // a 엘리시 keeping the leaves near it moist
 drawSkillGround(c,w,h,t){const s=this.state(),K=typeof ForestSkills!=='undefined'?ForestSkills:null;if(!K)return;
  for(const d of K.puddles(s)){const k=Math.sqrt(Math.max(0,d.W)/K.SK.dig.amount),rx=.05*w*(.45+.55*k),ry=rx*.42,x=d.x*w,y=d.y*h;c.save();
   const g=c.createRadialGradient(x,y,0,x,y,rx);g.addColorStop(0,'rgba(150,186,190,.62)');g.addColorStop(.7,'rgba(160,192,192,.42)');g.addColorStop(1,'rgba(170,196,190,0)');c.fillStyle=g;c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();
   c.strokeStyle='rgba(236,244,240,.55)';c.lineWidth=.6;c.beginPath();c.ellipse(x-rx*.15,y-ry*.2,rx*.45,ry*.3,0,Math.PI*1.1,Math.PI*1.8);c.stroke();
   if(!s.settings.reducedMotion){const u=(t*.4)%1;c.globalAlpha=.4*(1-u);c.beginPath();c.ellipse(x,y,rx*(.3+.5*u),ry*(.3+.5*u),0,0,7);c.stroke();}c.restore();}
  for(const e of K.misters(s)){const x=e.x*w,y=e.y*h,r=K.SK.mist.range*w;c.save();const b=s.settings.reducedMotion?0:Math.sin(t*.8)*.05;
   const g=c.createRadialGradient(x,y-r*.1,r*.1,x,y-r*.1,r);g.addColorStop(0,'rgba(214,232,226,'+(.30+b)+')');g.addColorStop(1,'rgba(214,232,226,0)');c.fillStyle=g;c.beginPath();c.ellipse(x,y-r*.1,r,r*.55,0,0,7);c.fill();c.restore();}}
 drawWorld(){this.hoodPasses=[];const s=this.state(),c=this.ctx,w=this.w,h=this.h,phase=s.settings.reducedMotion?0:this.phase;
  if(this.tick!==s.worldTick){this.tick=s.worldTick;this.tickAt=this.phase;}const fraction=Math.min(1,Math.max(0,this.phase-(this.tickAt||this.phase)));
  c.clearRect(0,0,this.vw,this.vh);const paper=this.assets.garden;c.drawImage(paper,paper.width*.44,paper.height*.02,paper.width*.16,paper.height*.1,0,0,this.vw,this.vh);/* 0.9.5: the screen backdrop is a plain patch of paper (the old crop held a bit of fern leaf that showed, stretched, at the bottom left: user "노란 조각") */{const cal=this.cal(),snow=!cal?0:cal.id==='winter'?cal.blend:cal.prev==='winter'?1-cal.blend:0;if(snow>0){c.save();c.globalAlpha=snow;c.fillStyle='rgb(250,250,247)';c.fillRect(0,0,this.vw,this.vh);c.restore();}}/* 0.8.1: in winter the area outside the forest is snow too */const wb=Forest.World?Forest.World.bounds(s):{x0:0,y0:0,x1:1,y1:1};this.syncWorld(wb);const base=c.getTransform();
  const enter=()=>{c.save();c.translate(this.camera.tx,this.camera.ty);c.scale(this.camera.scale,this.camera.scale);c.beginPath();c.rect(wb.x0*w,wb.y0*h,(wb.x1-wb.x0)*w,(wb.y1-wb.y0)*h);c.clip();};
  enter();this.drawFloor(c,w,h);this.seasonProps(c,w,h);c.restore();this.drawFrame(c,base);enter();for(const f of s.shelters?.facilities||[])this.shelterArt(this.facilityPreview?.id===f.id?this.facilityPreview:f);if(this.facilityPreview&&!s.shelters.facilities.some(f=>f.id===this.facilityPreview.id)){c.save();c.globalAlpha=.65;this.shelterArt(this.facilityPreview);c.restore();}
  const patches=s.patches.map(p=>({...p,...this.preview[p.id]}));patches.sort((a,b)=>a.y-b.y).forEach(p=>this.terrain(p));this.drawFallen();this.drawSkillGround(c,w,h,phase);
  this.springFlow();
  for(const p of s.individuals.filter(p=>p.active&&p.species==='neolbi'&&p.canopyProgress>0)){const g=ForestNeolbi.geometry(p);ForestSurfaces.wash(c,g.cx*w,g.cy*h,g.rx*w,g.ry*h,'71,82,60',.14*p.canopyProgress,1.5);}
  const night=s.settings.theme==='night'||(s.settings.theme==='auto'&&Math.floor(s.worldTick/600)%2===1);

  // 돌돌이 (SRS sheet 01): walks slowly in front of the crevice; curls into a ball when a friend comes close or the wind is
  // strong (render only — the visit itself is the engine's neighbour rule)
  if(s.neighbor.stage==='visiting'){const p=s.patches.find(x=>x.id==='crevice'),Art=typeof ForestCreatureArt!=='undefined'?ForestCreatureArt:null;const bx=p.x+.04,by=p.y+.02;
   const rolled=s.weather.wind>=60||s.individuals.some(q=>q.active&&!q.mounted&&Math.hypot(q.x-bx,q.y-by)<.08),still=s.settings.reducedMotion,tt=still?0:this.phase;
   // 0.6.38: it curls up (and opens again) over 0.7 s instead of switching pictures; reduced motion snaps
   const want=rolled?1:0,dtp=Math.max(0,Math.min(.1,this.phase-(this.pillPhase??this.phase)));this.pillPhase=this.phase;this.pillRoll??=want;this.pillRoll+=Math.sign(want-this.pillRoll)*Math.min(Math.abs(want-this.pillRoll),dtp/.7);if(still)this.pillRoll=want;
   if(Art&&this.assets.pillbug){const r=this.pillRoll,walk=r<.001,sw=walk?Math.sin(tt*.25):(this.pillSway??0),x=(bx+sw*.012)*w,dir=walk?(Math.cos(tt*.25)>=0?1:-1):(this.pillDir??1);if(walk){this.pillSway=sw;this.pillDir=dir;}
    if(r>=.999)Art.neighbour(c,this.assets,'pillbugBall',{x,y:by*h,size:w*.02,still:true});else if(walk)Art.neighbour(c,this.assets,'pillbug',{x,y:by*h,size:w*.04,dir,phase:tt,still});else Art.pillbugCurl(c,this.assets,{x,y:by*h,size:w*.04,ball:w*.02,dir,r});}
   else{const x=bx*w,y=by*h;c.fillStyle='#777a69';c.beginPath();c.ellipse(x,y,5,3.6,-.2,0,Math.PI*2);c.fill();}}
  const riders=[];// friends drawn on top of the sun rock this frame (0.6.31)
  for(const p of s.individuals.filter(x=>x.active).sort((a,b)=>a.y-b.y)){
   const motion=p.motion,path=motion?.path||[p];let pos={x:p.x,y:p.y};
   if(motion?.tick===s.worldTick&&motion.distance>0){let remaining=motion.distance*Math.min(1,fraction/(motion.duration||1));pos={...path[0]};for(let i=1;i<path.length;i++){const d=Forest.Space.distance(path[i-1],path[i]),n=Math.min(d,remaining);if(d)pos={x:path[i-1].x+(path[i].x-path[i-1].x)*n/d,y:path[i-1].y+(path[i].y-path[i-1].y)*n/d};remaining-=n;if(remaining<=0)break;}}
   let kind=motion?.kind||'idle';if(kind==='drink'&&p.objectTask?.kind!=='edgeDrink'&&s.worldTick%8<5)kind='splash';if(motion?.distance>0&&fraction>=1&&['walk','slow','hurry','run'].includes(kind))kind='idle';if(s.mode!=='game')kind='idle';
   if(this.landing?.id===p.id&&this.landing.until>this.phase)kind='land';
   {const sp=kind==='idle'&&s.mode==='game'?Forest.Objects.strollPose?.(s,p,s.worldTick+fraction):null;if(sp){kind=sp.pose==='sniff'?'sniff':sp.pose==='sit'?'rest':'idle';if(sp.face&&!s.settings.reducedMotion){this.facing=this.facing||{};this.facing[p.id]=sp.face;}}}   // 0.8.7 stroll poses (render only)
   // 1.0.3 광합성 / 볕 쬐기 (render only): a friend standing still by day where it photosynthesises well shows the 광합성
   // pose; one resting on the sun rock while it holds sun shows 볕 쬐기 (with the bigger light motes when it also photosynthesises)
   let photoOnRock=false;{const V=typeof ForestVitals!=='undefined'?ForestVitals:null;if(V&&s.mode==='game'){const g=V.photoGrade(s,p,Forest.light(s,p),Forest.Shelter.inside(s,p));
    // on the rock: 볕 쬐기 only when the rock warms it (a cold day), 슈퍼 광합성 (big motes) whenever it photosynthesises there
    if(kind==='rest'&&V.restingAt(p,'rock')&&V.rockSun(s)>0){photoOnRock=!!g&&g!=='dark';kind=V.isCold(s)?'bask':photoOnRock?'photo':'rest';}
    else if(kind==='idle'&&(g==='good'||g==='near')&&!(p.species==='superbum'&&p.harvestTick>0)&&!(motion?.distance>0&&fraction<1))kind='photo';}(this.photoOnRock??={})[p.id]=photoOnRock;}
   // 0.6.35: a friend resting at the crevice tucks itself into the gap under the big stone (render only: the engine
   // keeps it on its rest spot just in front); it eases in over 0.6 s and the small front stone covers part of it
   // 0.8.6 (user: "바위틈으로 들어갈 때 … 휘리릭 달려가면서 … 네모 이미지가 생성"): it walks in and out at its slow resting pace
   // (it used to glide the 0.04 in 0.6 s in its resting pose and pop straight back out), and the small front stone covers it only
   // once its feet are behind the stone's lower edge; the band under the stone is cut away only when it sits in the gap (that
   // cut used to slice the friend into a rectangle while it still stood in front of the stone)
   const target=!(this.carry?.id===p.id)?this.nookPos(p):null;this.nookS??={};let ns=this.nookS[p.id],nook=null,seated=false,behind=false;
   if(target||ns){if(!ns)ns=this.nookS[p.id]={e:0,last:this.phase,to:target};const dt=Math.max(0,Math.min(.25,this.phase-ns.last));ns.last=this.phase;if(target)ns.to=target;
    const d=Forest.Space.distance(pos,ns.to),dur=s.settings.reducedMotion?0:Math.max(.6,d/(Forest.Space.GU*.6)),stp=dur?dt/dur:1,was=ns.e;ns.e=target?Math.min(1,ns.e+stp):Math.max(0,ns.e-stp);
    if(ns.e<=0&&!target)delete this.nookS[p.id];else{const k=ns.e*ns.e*(3-2*ns.e);pos={x:pos.x+(ns.to.x-pos.x)*k,y:pos.y+(ns.to.y-pos.y)*k};nook=ns.to;seated=ns.e>=1;
     if(ns.e!==was||(ns.e>0&&ns.e<1)){kind='slow';this.facing=this.facing||{};const dx=(ns.to.x-p.x)*(target?1:-1);if(Math.abs(dx)>.0005)this.facing[p.id]=dx<0?-1:1;}
     const g=this.creviceGeom();behind=seated||!!g&&pos.y*this.h<g.px(0,352).y;}}
   this.display[p.id]=pos;const carry=this.carry?.id===p.id&&this.carry.mode==='drag';

   this.facing=this.facing||{};if(motion?.path?.length>1){const dx=motion.path.at(-1).x-motion.path[0].x;if(Math.abs(dx)>.001)this.facing[p.id]=dx<0?-1:1;}
   // 0.6.35: a friend tucked into the crevice is not drawn where the small front stone stands or below it (its feet and
   // hand used to peek out as dark bits under the stone's lower edge)
   if(!carry&&seated)this.nookClip();
   if(!carry&&!this.recording&&this.selected===p.id)this.selectionRing(p,pos,phase);
   if(!carry)this.pet(p,pos,kind,phase,night,kind==='held');if(!carry&&seated)this.ctx.restore();if(!carry)this.leafNeighbours(p,pos,phase);if(!carry)this.interaction(p,pos,kind,phase);if(!carry)this.shelterFront(p,pos);
   if(!carry&&this.onRock(pos))riders.push([p,pos,kind,phase]);
   // stones in front of this friend are drawn again over it; when that redraws the sun rock (a friend passing behind
   // it), friends already resting on the rock are drawn again on top, so the rock never covers them (0.6.31)
   if(behind&&!carry)this.creviceFront();
   if(!carry)for(const z of patches.filter(z=>['rock','crevice','shade'].includes(z.id)&&z.y>pos.y&&Math.abs(z.x-pos.x)<.22&&!(z.id==='rock'&&this.onRock(pos))&&!(nook&&z.id==='crevice'))){this.terrain(z);if(z.id==='rock')for(const [q,qpos,qkind,qphase] of riders)if(q!==p){this.pet(q,qpos,qkind,qphase,night,qkind==='held');this.leafNeighbours(q,qpos,qphase);}}
   const b=document.querySelector('[data-pet="'+p.id+'"]');if(b){const point=this.camera.screen(pos),size=this.petSize(p)*this.camera.scale;b.style.left=point.x+'px';b.style.top=point.y+'px';b.style.width=Math.max(48,size*.8)+'px';b.style.height=Math.max(48,size*.9)+'px';b.hidden=carry||point.x<0||point.x>this.vw||point.y<0||point.y>this.vh;}
   if(!carry&&s.mode==='game'&&motion?.tick===s.worldTick&&s.worldTick>(this.silentTick??-1)){const id=p.id+':'+s.worldTick;
    if(p.objectContact?.tick===s.worldTick&&!this.inspector)this.onMarker?.(p.objectContact.id,p.objectContact.cue,p.id);
    if(this.drinkContact(p)&&motion.water>0&&fraction>=Math.max(.55,motion.duration||0))this.onMarker?.(motion.contact||id+':water','drink',p.id);
    if(p.species==='neolbi'&&fraction>=.55&&(p.motion?.kind==='umbrella'||p.motion?.kind==='shade')&&s.events.some(e=>e.type==='protect'&&e.individual===p.id&&s.worldTick-e.tick===1))this.onMarker?.('protect:'+p.id+':'+s.worldTick,'groom',p.id);
    if(p.snowShedTick===s.worldTick&&fraction>=.5)this.onMarker?.(id+':snow','snowShake'+(1+s.worldTick%3),p.id);
    if(kind==='groom'&&ForestRig.pose(kind,phase).reach>.7&&fraction>=.5&&s.worldTick%3===0)this.onMarker?.(id+':groom','groom',p.id);
    if(motion.distance>0&&fraction<1){const step=Math.floor(fraction*(kind==='run'?4:2));const patch=s.patches.find(z=>Forest.dist(z,pos)<.10);const cal=this.cal(),se=cal?(cal.blend<.5?cal.prev:cal.id):null,indoor=!!Forest.Shelter?.inside?.(s,p),hard=['rock','crevice'].includes(patch?.id)||patch?.id==='shelter'||indoor;
     // 0.8.1: in winter every step outdoors crunches snow and leaves a footprint that fades; in autumn steps rustle fallen leaves
     const cue=(se==='winter'&&!hard)||(patch?.snowWater||0)>.01?'snowStep'+(1+(s.worldTick+step)%3):['rock','crevice'].includes(patch?.id)?'stone':patch?.id==='shelter'?'wood':(se==='autumn'&&!hard)||['litter','moss','shade'].includes(patch?.id)?'leaf':'soil';this.onMarker?.(id+':foot:'+step,cue,p.id);
     if(se==='winter'&&!hard)this.footprint(id+':foot:'+step,pos,p);}
   }
  }
  // Foreground leaf pass: visitors render under the continuous canopy.
  for(const pass of this.hoodPasses){c.save();c.setTransform(...pass.matrix);c.filter=pass.filter;c.globalAlpha=pass.alpha;ForestNeolbi.front(c,pass.rain?this.assets.neolbiRainCanopy:this.assets.neolbiCanopy,pass.open);ForestNeolbi.frontSnow(c,this.assets.neolbiCanopy,pass.open,pass.snow);ForestNeolbi.surface(c,pass.open,pass.wet,pass.time,pass.rain,pass.reduced);c.restore();}
  for(const p of patches.filter(p=>p.id==='shade'))this.canopy(p);
  if(this.carry){const q=this.carry.result||this.carry.origin,p=q.ok?q:(this.carry.pointerPoint||this.carry.origin);c.strokeStyle=q.ok?'#638361':'#b56950';c.fillStyle=q.ok?'#91ab7926':'#b5695026';c.lineWidth=2;c.setLineDash([4,3]);c.beginPath();c.ellipse(p.x*w,p.y*h,22,8,0,0,Math.PI*2);c.fill();c.stroke();c.setLineDash([]);}
  if(this.carry?.mode==='drag'){const pet=s.individuals.find(p=>p.id===this.carry.id);if(pet)this.pet(pet,this.carry.hover,'held',phase,night,true);}
  if(this.editing){for(const p of [...patches,{...s.spring,...this.preview.spring,id:'spring',name:'샘터'}]){if(p.id==='shelter')continue;const selected=p.id===this.selectedPatch;c.strokeStyle=selected?'#526443':'#7c866e88';c.fillStyle=selected?'#aab78c28':'#ffffff15';c.lineWidth=selected?2:1;c.setLineDash(selected?[]:[3,4]);c.beginPath();c.ellipse(p.x*w,p.y*h,w*.08,h*.025,0,0,Math.PI*2);c.fill();c.stroke();c.setLineDash([]);c.fillStyle='#fffcf5ee';const textw=c.measureText(p.name).width+16;c.fillRect(p.x*w-textw/2,p.y*h+10,textw,20);c.fillStyle='#43513b';c.font=(11/this.camera.scale)+'px Pretendard';c.textAlign='center';c.fillText(p.name,p.x*w,p.y*h+24);if(selected){c.fillStyle='#526443';c.beginPath();c.arc(p.x*w,p.y*h,6/this.camera.scale,0,Math.PI*2);c.fill();}}}
  this.seasonFall(c,w,h,base);{/* 0.8.5: snow, wind-blown leaves and fog cover the whole wide forest (they were drawn only over the old 0..1 garden) */const B=(typeof ForestWorld!=='undefined'?ForestWorld:null)?.bounds?.(s)||{x0:0,y0:0,x1:1,y1:1},bw=B.x1-B.x0,bh=B.y1-B.y0;c.save();c.translate(B.x0*w,B.y0*h);ForestEffects.particles(c,s,bw*w,bh*h,phase,this.assets,bw*bh);c.restore();}this.shelterDebug();c.restore();ForestEffects.rain(c,s,this.vw,this.vh,phase);
 }
}
