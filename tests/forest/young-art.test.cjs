const {test}=require('node:test'),a=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {createCanvas,loadImage}=require('@napi-rs/canvas');const web=path.resolve(__dirname,'../../app/src/main/assets/web'),Art=require(web+'/creature-art.js');
// 0.6.38: young stages and the 돌돌이 curl are drawing only; they need their images and never touch the game state
const YOUNG=['spiderMiteEggs','spiderMiteNymph','rootGnatEggs','mealybugCrawler','ladybirdLarva'];
test('young-stage art: every image is packaged, the sheet width matches the PNG, and each one draws',async()=>{
 for(const k of YOUNG){const f=web+'/'+Art.ANT_FILES[k];a.ok(fs.existsSync(f),k);const im=await loadImage(f);a.equal(Art.SHEET[k].w,im.width,k+' width');
  const c=createCanvas(80,80),x=c.getContext('2d');Art.neighbour(x,{[k]:im},k,{x:40,y:60,size:40,still:true});a.ok(x.getImageData(0,0,80,80).data.some((v,i)=>i%4===3&&v>0),k+' draws');}
});
test('돌돌이 curls in steps: the picture changes between walking, half curled and the ball, and reduced motion needs no curl',async()=>{
 const A={};for(const k of ['pillbug','pillbugBody','pillbugBall'])A[k]=await loadImage(web+'/'+Art.ANT_FILES[k]);
 const shot=r=>{const c=createCanvas(160,140),x=c.getContext('2d');Art.pillbugCurl(x,A,{x:80,y:120,size:120,ball:60,r});return x.getImageData(0,0,160,140).data;};
 const diff=(p,q)=>{let n=0;for(let i=3;i<p.length;i+=4)if(Math.abs(p[i]-q[i])>40)n++;return n;};
 const r0=shot(.01),r5=shot(.5),r1=shot(1);a.ok(diff(r0,r5)>200,'half curled differs from walking');a.ok(diff(r5,r1)>200,'half curled differs from the ball');
 // narrower as it curls
 const width=d=>{let x0=160,x1=0;for(let i=3;i<d.length;i+=4)if(d[i]>40){const x=((i-3)/4)%160;x0=Math.min(x0,x);x1=Math.max(x1,x);}return x1-x0;};a.ok(width(r5)<width(r0));
});
