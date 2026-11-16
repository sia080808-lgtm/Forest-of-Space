const {test}=require('node:test'),a=require('node:assert/strict'),path=require('node:path'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../../app/src/main/assets/web'),N=require(web+'/neolbi.js');
test('all 21 front-leaf frames keep the forehead attachment pixel-identical',async()=>{const im=await loadImage(web+'/assets/forest/neolbi/canopy.png'),c=createCanvas(im.width,im.height),x=c.getContext('2d');x.drawImage(im,0,0);const base=x.getImageData(0,0,224,384).data;for(let i=1;i<21;i++)a.deepEqual(x.getImageData(i%7*768,Math.floor(i/7)*384,224,384).data,base,'attachment moved at '+i);});
test('extended brim bridge has a single continuous surface per column',async()=>{const im=await loadImage(web+'/assets/forest/neolbi/canopy.png'),c=createCanvas(768,384),x=c.getContext('2d');x.drawImage(im,6*768,2*384,768,384,0,0,768,384);const d=x.getImageData(0,0,768,384).data;for(let xx=230;xx<450;xx+=7){let bands=0,on=false;for(let y=0;y<384;y++){const solid=d[(y*768+xx)*4+3]>100;if(solid&&!on)bands++;on=solid;}a.equal(bands,1,'split leaf at '+xx);}});
test('renderer never overlays an extra closed front on the animated front',()=>{const draws=[],assets=Object.fromEntries(Object.keys(N.files).map(k=>[k,{name:k}]));const c=new Proxy({},{get:(o,k)=>k==='drawImage'?(...args)=>draws.push(args[0]):()=>{},set:()=>true});N.draw(c,assets,{canopy:1,phase:2});a.equal(draws.filter(im=>im===assets.neolbiCanopy).length,1);a.equal(draws.filter(im=>im===assets.neolbiFront).length,0);});

test('final rear leaf, deep legs, intact body and hood render in approved depth order',()=>{
 const calls=[],assets=Object.fromEntries(Object.keys(N.files).map(k=>[k,{name:k}]));
 const c=new Proxy({},{get:(o,k)=>k==='drawImage'?(...args)=>calls.push(args[0]):()=>{},set:()=>true});
 N.draw(c,assets,{canopy:1,phase:2});
 const order=['neolbiRear','neolbiLegs','neolbiBody','neolbiCanopy'].map(k=>calls.indexOf(assets[k]));
 a.ok(order.every((value,index)=>value>=0&&(index===0||value>order[index-1])),order.join(','));
});
test('all cavity frames remain solid surfaces without torso-shaped cuts',async()=>{
 const im=await loadImage(web+'/assets/forest/neolbi/lining.png'),c=createCanvas(768,384),x=c.getContext('2d');
 for(let i=0;i<=20;i++){
  x.clearRect(0,0,768,384);x.drawImage(im,i%7*768,Math.floor(i/7)*384,768,384,0,0,768,384);
  const d=x.getImageData(0,0,768,384).data;
  for(let xx=85;xx<300;xx+=5){let bands=0,on=false;for(let y=0;y<384;y++){const solid=d[(y*768+xx)*4+3]>128;if(solid&&!on)bands++;on=solid;}a.equal(bands,1,'cavity cut at frame '+i+', column '+xx);}
 }
});
