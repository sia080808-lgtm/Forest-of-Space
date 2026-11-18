(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestNeolbiMotion=api;})(globalThis,function(){
'use strict';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const catalog=[
['idle','기본 · 느린 숨',4,'RIG-F01'],['slow','천천히 걷기',4,'LOC-04'],['walk','걷기',4,'LOC-04'],['hurry','서두르기',4,'LOC-04'],['run','달리기',4,'LOC-04'],['stop','발 정리 · 멈춤',2,'LOC-04'],['duck','잎 아래 숙이기',4,'LOC-04'],['step','턱 넘기',4,'LOC-04'],['avoid','피해 걷기',4,'LOC-04'],['held','들림 · 버둥',4,'MOVE-01'],['land','착지 · 후드 정리',2,'MOVE-07'],['rest','잠자기 · 후드 내림',6,'RIG-11'],['wake','깨어나 챙 들기',3,'RIG-11'],['groom','자기 잎 정돈',8,'A02'],['drink','물 마시기',4,'S-INT-01'],['splash','발로 물장구',4,'S-INT-01'],['moss','이끼 속 포옥',5,'S-INT-02'],['litter','앞잎으로 낙엽 살피기',4,'A03'],['carry','잎으로 낙엽 받쳐 운반',4,'A11'],['escort','나란히 동행',4,'A07'],['receive','잎에 물방울 받기',5,'A04'],['rainlook','빗방울 살피기',5,'A01'],['shade','한 자리 그늘',6,'A09/A12/K02/K05'],['umbrella','우산 · 끝 낙수',6,'A09'],['fold','접고 대피 준비',3,'A13'],['look','실제 흔적 살피기',4,'A10/A15'],['greet','후드로 인사',3,'A14/M04'],['nightrest','밤의 조용한 쉼',6,'A16'],['passleaf','잎으로 낙엽 건네기',4,'A06'],
['hoodpeek','후드 아래 빼꼼',5,'PERS-05'],['hoodfit','앉기 전 고쳐 쓰기',4,'PERS-05'],['hoodnod','자리 잡은 친구에게 끄덕',3,'PERS-05'],['hooddoze','꾸벅 · 챙 다시 들기',6,'RIG-11'],
['PE01','함께 기웃',4,'A10'],['PE02','한 박자 따라',10,'A05'],['PE03','빈자리 살피고 끄덕',6,'A08/M02'],['PE04','고마운 후드 인사',2,'A04/K02'],['PE05','처진 챙 바로잡기',8,'A02'],['PE06','알아보고 챙 들기',3,'M04']
].map(([id,label,duration,srs])=>({id,label,duration,srs}));
const moving=new Set(['slow','walk','hurry','run','duck','step','avoid','carry','escort']);
function pose(kind='idle',time=0,opt={}){
 const entry=catalog.find(x=>x.id===kind)||catalog[0],t=opt.reduced?0:((time%entry.duration)+entry.duration)%entry.duration,baseQ=t/entry.duration;let q=baseQ;
 const a=clamp(Number(opt.personality?.a)||0,-1,1),c=clamp(Number(opt.personality?.c)||0,-1,1),e=clamp(Number(opt.personality?.e)||0,-1,1);
 if((kind.startsWith('PE')||['look','greet','hoodpeek'].includes(kind))&&!opt.urgent){const delay=(1-a)*.5;q=clamp((t-delay)/(entry.duration-delay));}
 const amp=(1+.2*e)*(opt.night?.8:1),pulse=(start,end)=>{const x=clamp((q-start)/(end-start));return Math.sin(Math.PI*x)**2;};
 const p={left:0,right:0,bob:0,body:0,front:0,rear:0,open:clamp(opt.canopy||0),rain:opt.rain?1:0,eyes:opt.expression||'neutral',look:0,sink:0,prop:false};
 if(moving.has(kind)){const speed={slow:4,walk:6,hurry:8,run:10}[kind]||5,w=Math.sin(t*speed);p.left=w*.20;p.right=-w*.20;p.bob=-Math.abs(w)*1.7;p.front=(1+w)*.022;p.rear=(1-w)*.012;if(kind==='duck')p.front=.18;if(kind==='step')p.bob-=Math.abs(w)*3;if(kind==='avoid')p.body=w*.012;if(kind==='carry'){p.prop=true;p.front=.04;}}
 if(kind==='stop'){p.left=Math.sin(t*8)*.12*(1-q);p.right=-p.left;p.front=.06*(1-q);}
 if(kind==='held'){const w=Math.sin(t*9);p.left=.32*w;p.right=-.32*w;p.body=.035*Math.sin(t*6);p.front=.10+.07*Math.sin(t*5);p.rear=p.front*.45;p.eyes='surprised';}
 if(kind==='land'){p.bob=3*pulse(0,.45);p.front=.14*pulse(.15,.8);p.rear=p.front*.48;}
 if(['rest','nightrest','moss'].includes(kind)){p.front=.26;p.rear=.13;p.eyes='sleepy';p.bob=2+Math.sin(t*1.5)*.4;if(kind==='moss')p.sink=9*smooth(q*4);}
 if(kind==='wake'){p.front=.26*(1-smooth(q));p.rear=p.front*.48;p.eyes=q<.45?'sleepy':'neutral';}
 if(kind==='groom'){const env=pulse(0,.8);p.front=env*(.05+.13*Math.max(0,Math.sin(t*10)));p.rear=p.front*.48;p.bob=-env*Math.max(0,Math.sin(t*10))*1.2;p.eyes='focused';}
 if(['PE05','hoodfit'].includes(kind)){p.front=.14*pulse(0,.7);p.rear=p.front*.48;if(kind==='PE05')p.front+=.15*pulse(.4,.72);p.eyes='focused';}
 if(['drink','splash','receive'].includes(kind)){p.front=.07+.035*Math.sin(t*3);p.rear=p.front*.48;p.eyes='focused';if(kind==='splash'){p.left=Math.sin(t*7)*.23;p.right=-p.left;p.bob=-Math.abs(Math.sin(t*7));}}
 if(['litter','passleaf'].includes(kind)){p.front=.12*pulse(0,1);p.rear=p.front*.48;p.prop=true;p.look=1;}
 if(kind==='rainlook'){p.front=.05*(1-pulse(.15,.8));p.look=-1;}
 if(['shade','umbrella'].includes(kind)){p.open=opt.canopy===undefined?smooth(q*3):clamp(opt.canopy);p.rain=kind==='umbrella'||opt.rain?1:0;}
 if(kind==='fold')p.open=1-smooth(q*2);
 if(['hoodpeek','look','PE01'].includes(kind)){p.front=.28*pulse(.05,.85);p.rear=p.front*.48;p.look=amp*Math.sin(Math.min(1,q/(.85+.15*c))*Math.PI*2);}
 if(['hoodnod','greet','PE04','PE06'].includes(kind)){p.front=.19*pulse(.1,.85);p.rear=p.front*.48;p.eyes=kind==='PE04'?'happy':'neutral';}
 if(kind==='PE03'){p.look=q<.4?1:0;p.front=.16*pulse(.4,.95);p.rear=p.front*.48;}
 if(kind==='PE02'){p.front=.20*pulse(.18,.7);p.rear=p.front*.48;}
 if(kind==='hooddoze'){p.front=.32*smooth(q/.65)*(1-smooth((q-.7)/.3));p.rear=p.front*.48;p.eyes=q<.7?'sleepy':'neutral';}
 if(!moving.has(kind)&&p.open===0){p.front*=amp;p.rear*=amp;}
 p.front=clamp(p.front,0,21*Math.PI/180);p.rear=clamp(p.rear,0,10*Math.PI/180);
 // Functional canopy and roots do not inherit personality amplitudes.
 if(p.open>0){p.front=0;p.rear=0;p.body=0;}
 if(opt.reduced){p.left=p.right=p.body=p.bob=p.look=0;p.front=['rest','nightrest','moss'].includes(kind)?.26:0;p.rear=p.front*.48;p.open=['shade','umbrella'].includes(kind)?1:clamp(opt.canopy||0);}
 return {...p,prepare:opt.urgent?0:(1-a)*.5,gaze:.7+.3*c};
}
const parents={PE01:['A10'],PE02:['A05'],PE03:['A08','M02'],PE04:['A04','K02'],PE05:['A02'],PE06:['M04']};
function eligible(id,ev){if(!parents[id]?.includes(ev.parent)||ev.urgent||!ev.valid||!ev.visible)return false;
 if(id==='PE01')return !!ev.trace&&ev.ids.length>=2;
 if(id==='PE02')return ev.ids.length===2;
 if(id==='PE03')return ev.seats===2&&(ev.parent!=='M02'||ev.relation>=5);
 if(id==='PE04')return ev.amount>0&&ev.ids.length>=2;
 if(id==='PE05')return !ev.carrying;
 if(id==='PE06')return ev.relation>=15&&ev.reunionReady===true;
 return false;
}
function start(s,id,ev){
 if(s.mode!=='game'||s.offline||s.weather.wind>=60||!eligible(id,ev))return false;
 const ps=ev.ids.map(id=>s.individuals.find(p=>p.id===id));if(!ps.length||ps.some(p=>!p||!p.active||p.mounted||p.B<35||p.energy<40||p.burden>=40||(p.next_personality_tick??0)>s.worldTick))return false;
 if(s.individuals.some(p=>p.personalityClip&&p.personalityClip.until>s.worldTick))return false;
 const duration=catalog.find(x=>x.id===id).duration;
 for(const p of ps){p.next_personality_tick=s.worldTick+300;p.personalityClip={id,parent:ev.parent,session:ev.session,start:s.worldTick,until:s.worldTick+duration};}return true;
}
function active(s,p){const v=p.personalityClip;if(!v||v.until<=s.worldTick||s.mode!=='game'||s.offline||s.weather.wind>=60||p.B<35||p.energy<40||p.burden>=40)return null;return v;}
return {catalog,pose,eligible,start,active};
});
