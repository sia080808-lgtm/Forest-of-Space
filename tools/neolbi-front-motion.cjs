// Review choreography uses production layers; positions are staged, not world AI.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process'),{createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const web=path.resolve(__dirname,'../app/src/main/assets/web'),R=require(web+'/rig.js'),N=require(web+'/neolbi.js'),out=path.resolve(__dirname,'../docs/qa-0.6.2/runtime'),tmp=path.join(out,'motion-tmp');
const ease=v=>{v=Math.max(0,Math.min(1,v));return v*v*v*(v*(v*6-15)+10);};
(async()=>{fs.mkdirSync(tmp,{recursive:true});GlobalFonts.registerFromPath(web+'/fonts/GowunDodum-Regular.ttf','Gowun');const a={};for(const[k,v]of Object.entries(R.files))a[k]=await loadImage(web+'/'+v);const c=createCanvas(800,640),x=c.getContext('2d');
function shadow(cx,cy,rx,ry,alpha){x.save();x.filter='blur(7px)';x.fillStyle=`rgba(58,65,42,${alpha})`;x.beginPath();x.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);x.fill();x.restore();}
for(let i=0;i<280;i++){
 const t=i/20,q=t<1.2?0:t<3.4?ease((t-1.2)/2.2):t<10.5?1:t<12.8?1-ease((t-10.5)/2.3):0;
 const entering=t>=3.5&&t<5.5,leaving=t>=8&&t<10.3,hasFriend=t>=3.5&&t<10.3;
 const gx=entering?825-355*ease((t-3.5)/2):leaving?470+355*ease((t-8)/2.3):470;
 x.fillStyle='#f7f4ec';x.fillRect(0,0,800,640);
 x.save();x.strokeStyle='rgba(113,147,150,.28)';x.lineWidth=1.3;
 for(let j=0;j<95;j++){const rx=(j*127)%820,ry=((j*97+t*190)%650)-30;const sheltered=q>.98&&rx>335&&rx<535&&ry>235&&ry<505;if(sheltered)continue;x.beginPath();x.moveTo(rx,ry);x.lineTo(rx-3,ry+13);x.stroke();}x.restore();
 shadow(220,355,100,11,.12);shadow(400,480,150*q,15*q,.09*q);
 if(hasFriend)shadow(gx,480,47,7,.12);
 let hood;
 x.save();x.translate(210,350);x.scale(.26,.26);x.translate(-627,-1065.9);R.draw(x,a,{species:'neolbi',kind:'idle',phase:t+2,canopy:q,deferFront:true,onHood:m=>{hood=[m.a,m.b,m.c,m.d,m.e,m.f];return true;}});x.restore();
 if(hasFriend){x.save();x.translate(gx,480);x.scale(.26,.26);x.translate(-627,-1065.9);if(!entering&&!leaving)x.filter='brightness(.94)';R.draw(x,a,{species:'ridley',kind:entering||leaving?'walk':'rest',phase:t+2});x.restore();}
 if(hood){x.save();x.setTransform(...hood);N.front(x,a.neolbiCanopy,q);x.restore();}
 x.fillStyle='#43513b';x.font='22px Gowun';x.fillText(t<1.2?'기본 후드':t<3.4?'바깥 챙만 펼치기':t<5.5?'한 명이 우산 아래로':t<8?'함께 비 피하기':t<10.5?'친구가 나간 뒤':t<12.8?'천천히 원래 후드로':'기본 후드',40,600);
 fs.writeFileSync(path.join(tmp,String(i).padStart(3,'0')+'.png'),c.toBuffer('image/png'));
 if(i===135)fs.writeFileSync(out+'/neolbi-shade-story.png',c.toBuffer('image/png'));
}
const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','20','-i',tmp+'/%03d.png','-filter_complex','split[a][b];[a]palettegen[p];[b][p]paletteuse','-loop','0',out+'/neolbi-single-front.gif'],{stdio:'inherit'});if(r.status!==0)throw Error('GIF encode failed');fs.rmSync(tmp,{recursive:true});})();
