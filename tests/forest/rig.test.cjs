const {test}=require('node:test'),a=require('node:assert/strict'),path=require('node:path'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../../app/src/main/assets/web'),R=require(web+'/rig.js');
async function assets(){const out={};for(const [k,v]of Object.entries(R.files))out[k]=await loadImage(web+'/'+v);return out;}
test('intact body remains opaque through all limb positions and both directions',async()=>{const images=await assets(),can=createCanvas(320,320),c=can.getContext('2d');
 for(const face of [-1,1]){c.resetTransform();c.clearRect(0,0,320,320);c.translate(160,278);c.scale(face*.25,.25);c.translate(-627,-1065.9);c.drawImage(images.rigBody,0,0);const base=c.getImageData(0,0,320,320).data;
 for(const kind of ['idle','walk','slow','hurry','run','groom','held','rest','drink','land','duck','step','avoid'])for(let i=0;i<24;i++){
 const t=i/6,p=R.pose(kind,t,false,kind==='held'?Math.sin(t)*.9:0);c.resetTransform();c.clearRect(0,0,320,320);c.translate(160,278);c.scale(face*.25,.25);c.translate(-627,-1065.9-p.bob);R.draw(c,images,{kind,phase:t,wiggle:kind==='held'?Math.sin(t)*.9:0});const actual=c.getImageData(0,0,320,320).data;
 for(let n=3;n<base.length;n+=4)if(base[n]>=250)a.ok(actual[n]>=249,`${kind}/${t} damaged body pixel ${n}`);
 }}
});
test('all motions draw one body and exactly two hands without cutting the torso',async()=>{const images=await assets();for(const kind of ['run','groom','held','rest','duck','step'])for(let t=0;t<4;t+=.2){const draws=[];const c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:k==='drawImage'?(im)=>draws.push(im):()=>{}});R.draw(c,images,{kind,phase:t});a.equal(draws.filter(x=>x===images.rigBody).length,1);a.equal(draws.filter(x=>x===images.rigPalm).length,2);a.equal(draws.filter(x=>x===images.rigLegLeft||x===images.rigLegRight).length,2);}});
test('reduced motion is static and render does not alter its inputs',async()=>{const images=await assets();for(const kind of ['run','groom','held','rest']){a.deepEqual(R.pose(kind,0,true),R.pose(kind,9,true));const options={kind,phase:2,reduced:true};const before={...options};R.draw(createCanvas(1254,1254).getContext('2d'),images,options);a.deepEqual(options,before);}});
