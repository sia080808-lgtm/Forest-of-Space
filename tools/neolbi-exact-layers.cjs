const fs=require('fs'),{createCanvas,loadImage,Path2D}=require('@napi-rs/canvas');
const out='/workspace/scratch/8dd22e074e8f/hood-exact',W=255,H=208;
(async()=>{const source=await loadImage('/workspace/scratch/8dd22e074e8f/upload/image(20261116-060914).png'),under=await loadImage('/workspace/scratch/8dd22e074e8f/generated_images/exec-271156b3-98c0-4d19-a6bf-dc2cecae586a.png');const c=createCanvas(W,H),ctx=c.getContext('2d');ctx.drawImage(source,0,0);const sd=ctx.getImageData(0,0,W,H);ctx.clearRect(0,0,W,H);ctx.drawImage(under,0,0,W,H);const ud=ctx.getImageData(0,0,W,H);ctx.clearRect(0,0,W,H);
ctx.fill(new Path2D('M31 121 C38 109 49 102 61 95 C85 83 101 66 125 55 C145 45 173 44 191 52 C211 62 224 81 227 95 C231 105 224 115 215 110 C204 105 197 95 181 93 C161 89 145 98 130 109 C108 125 79 138 56 140 C43 142 29 134 31 121 Z'));const fm=ctx.getImageData(0,0,W,H).data;
const owner=new Int8Array(W*H).fill(-1);
const names=['01-rear-leaf','02-legs','03-body','04-eyes','05-front-leaf'],layers=names.map(()=>createCanvas(W,H)),data=layers.map(l=>l.getContext('2d').createImageData(W,H)),fg=ctx.createImageData(W,H),clamp=x=>Math.max(0,Math.min(1,x));
const eye=(x,y)=>x>=116&&x<=129&&y>=113&&y<=136||x>=143&&x<=159&&y>=110&&y<=136;
function put(l,k,d,a){for(let j=0;j<3;j++)data[l].data[k+j]=d[k+j];data[l].data[k+3]=a;}
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=(y*W+x)*4,r=sd.data[k],g=sd.data[k+1],b=sd.data[k+2],isEye=eye(x,y)&&r>170&&g>160;let alpha=y<195?Math.round(255*clamp((r-b-16)/16)*clamp((247-r)/10)):0;if(isEye)alpha=255;if(y>181&&(!((x>=79&&x<=97)||(x>=157&&x<=175))||r-g<13))alpha=0;if(y>135&&r-g>10)alpha=alpha>=190?255:0;if(y>183){const cx=x<127?88:166;if(((x-cx)/10)**2+((y-183)/10)**2>1)alpha=0;}if(!alpha)continue;for(let j=0;j<3;j++)fg.data[k+j]=sd.data[k+j];fg.data[k+3]=alpha;let front=fm[k+3]>0;if(!front)for(let yy=Math.max(0,y-2);yy<=Math.min(H-1,y+2)&&!front;yy++)for(let xx=Math.max(0,x-2);xx<=Math.min(W-1,x+2);xx++)if(fm[(yy*W+xx)*4+3]>128){front=true;break;}let layer=front?4:y>=180&&(x>76&&x<100||x>153&&x<176)?1:isEye?3:r-g>12?2:0;owner[y*W+x]=layer;put(layer,k,sd.data,alpha);
if(front&&alpha===255&&ud.data[k+3]>60){const ur=ud.data[k],ug=ud.data[k+1];if(ur-ug>12)put(2,k,ud.data,255);else put(0,k,ud.data,255);}
if(layer===3){let donor=k-20*4;put(2,k,sd.data,255);for(let j=0;j<3;j++)data[2].data[k+j]=sd.data[donor+j];}
}
// Hidden support surfaces are continuous. Visible pixels are restored below.
const support=createCanvas(W,H),sx=support.getContext('2d');
for(const [l,shape] of [[0,'M15 90 C25 62 47 45 78 40 C105 40 115 10 143 12 C175 10 192 35 197 66 C204 103 202 141 184 170 L73 170 C53 139 44 113 50 90 Q58 76 43 84 Q17 108 15 90 Z'],[2,'M50 158 C49 137 52 115 74 98 C99 79 115 66 141 64 C154 65 162 76 169 87 C184 108 195 135 204 155 Q212 182 171 183 L82 183 Q45 182 51 158 Z']]){
 sx.clearRect(0,0,W,H);sx.fill(new Path2D(shape));const mask=sx.getImageData(0,0,W,H).data;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=(y*W+x)*4;if(mask[k+3]>128&&fg.data[k+3]>0){const valid=l===2?ud.data[k]-ud.data[k+1]>12:ud.data[k+1]-ud.data[k+2]>35&&ud.data[k+1]>=ud.data[k]-5&&ud.data[k]<220;let donor=valid&&ud.data[k+3]>230?k:((l===2?155:35)*W+(l===2?125:135))*4;const donorData=valid&&ud.data[k+3]>230?ud.data:sd.data;for(let j=0;j<3;j++)data[l].data[k+j]=donorData[donor+j];data[l].data[k+3]=255;}}
}
// Stray original front-edge pixels belong to the moving leaf, not the rear.
for(const l of [0]){const seen=new Uint8Array(W*H),groups=[];for(let n=0;n<W*H;n++){if(seen[n]||!data[l].data[n*4+3])continue;const g=[n];seen[n]=1;for(let i=0;i<g.length;i++){const v=g[i],x=v%W,y=Math.floor(v/W);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){let nx=x+dx,ny=y+dy,nn=ny*W+nx;if(nx>=0&&nx<W&&ny>=0&&ny<H&&!seen[nn]&&data[l].data[nn*4+3]){seen[nn]=1;g.push(nn);}}}groups.push(g);}groups.sort((a,b)=>b.length-a.length);for(const group of groups.slice(1))for(const n of group){const k=n*4;if(fg.data[k+3]){put(4,k,sd.data,fg.data[k+3]);owner[n]=4;}data[l].data[k+3]=0;}}
// The original visible pixel always wins; reconstruction is confined behind it.
for(let n=0;n<W*H;n++){const k=n*4,l=owner[n];if(l<0){for(const d of data)d.data[k+3]=0;continue;}for(let j=l+1;j<5;j++)data[j].data[k+3]=0;put(l,k,sd.data,fg.data[k+3]);}
// Extend legs only inside the existing opaque torso: visible foot pixels stay untouched.
for(let y=145;y<183;y++)for(let x=78;x<176;x++){const leg=x<100?0:x>154?1:-1;if(leg<0)continue;const cx=leg?164:88,k=(y*W+x)*4;if((x-cx)**2+Math.max(0,155-y)**2<9**2&&data[2].data[k+3]===255){data[1].data.set([110,91,63,255],k);}}
for(let i=0;i<5;i++){layers[i].getContext('2d').putImageData(data[i],0,0);fs.writeFileSync(out+'/'+names[i]+'.png',layers[i].toBuffer('image/png'));}
ctx.clearRect(0,0,W,H);for(const l of layers)ctx.drawImage(l,0,0);fs.writeFileSync(out+'/assembled.png',c.toBuffer('image/png'));const assembled=ctx.getImageData(0,0,W,H).data;let mismatch=0,max=0;for(let k=0;k<fg.data.length;k+=4)if(fg.data[k+3]===255){for(let j=0;j<4;j++){const d=Math.abs(fg.data[k+j]-assembled[k+j]);max=Math.max(max,d);if(d)mismatch++;}}
console.log({opaqueOriginalPixelChannelMismatches:mismatch,maxDifference:max});fs.writeFileSync(out+'/pixel-check.json',JSON.stringify({opaqueOriginalPixelChannelMismatches:mismatch,maxDifference:max}));
const proof=createCanvas(510,208),p=proof.getContext('2d');p.fillStyle='#faf6ee';p.fillRect(0,0,510,208);p.drawImage(source,0,0);p.drawImage(c,255,0);fs.writeFileSync(out+'/comparison.png',proof.toBuffer('image/png'));
})();
