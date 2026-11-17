(function(root,factory){const api=factory(typeof module==='object'?require('./engine.js'):root.Forest);if(typeof module==='object')module.exports=api;else root.ForestFixtures=api;})(globalThis,function(F){
'use strict';
// Developer fixtures only. Never merge these individuals/resources with the player's state.
function pet(s,id,species,x,y,B=60){return {...F.clone(s.individuals[0]),id,species,name:F.SPECIES.find(x=>x[0]===species)[1],x,y,B,Q:0,V:0,energy:75,nutrition:75,active:true,mounted:false,xp:0,visualStage:0,shelter:{phase:'outside',since:s.worldTick},growthSeconds:0,first:{},action:'groom',actionSeconds:240,target:null,drinkCycle:false,personality:F.personality(id),sources:{rain:0,other:0,unknown:0}};}
function make(kind,preload=false){const s=F.create(0,404);s.started=true;s.settings.theme='day';s.weather.remaining=240;const p=s.individuals[0];Object.assign(p,{B:60,Q:0,x:.53,y:.53,action:'groom',actionSeconds:240,target:null});
 if(kind.startsWith('SH')){s.worldTick=601;s.shelters.unlocked=true;Object.assign(p,{species:'neolbi',name:'엘레판',xp:115,visualStage:3,x:.40,y:.40,B:60,Q:0,energy:20,action:'rest',target:'shelter'});if(kind!=='SH01'&&kind!=='SH04'){const q=pet(s,'shelter-friend','ridley',.55,.42);Object.assign(q,{energy:25,action:'rest',target:'shelter',xp:115,visualStage:3});s.individuals.push(q);}if(kind==='SH02'){const r=pet(s,'shelter-friend-2','ridley',.62,.46);Object.assign(r,{energy:25,action:'rest',target:'shelter',xp:115,visualStage:3});s.individuals.push(r);}if(kind==='SH03'||kind==='SH06')s.shelters.facilities[0].level=2;if(kind==='SH05'){p.xp=114;p.visualStage=2;p.growthSeconds=359;p.energy=65;}}
 else if(kind.startsWith('WX')){s.worldTick=601;Object.assign(p,{id:'weather-guest',x:.56,y:.47,B:60,Q:0,action:'groom',actionSeconds:240});s.individuals.push(pet(s,'weather-elephan','neolbi',.43,.39));Object.assign(s.weather,{kind:'rain',intensity:60,wind:20,wind_dir:0,remaining:240});s.climate.L=30;
  if(kind==='WX02'){s.individuals=s.individuals.slice(0,1);Object.assign(p,{x:.64,y:.52,Q:18,burden:39.9,wetSeconds:70,wet85Seconds:25});}
  if(kind==='WX03'){s.weather.kind='sun';s.weather.wind=75;Object.assign(p,{gustExposure:10,damage:10});}
 }else if(kind==='EC01'){
  F.layout(s,{shade:{x:.43,y:.35},rock:{x:.80,y:.18}});s.patches.find(p=>p.id==='moss').S=2;s.patches.find(p=>p.id==='rock').S=0;
  Object.assign(s.weather,{kind:'rain',remaining:140,streak:2,intensity:35,wind:20});Object.assign(s.climate,{L:30,H:90,T:55});
 }else if(kind==='ELL01'){
  s.individuals.push(pet(s,'ellisii-a','bonbon',.46,.48));s.neighbor.visits=1;s.neighbor.validSeconds=118;
  Object.assign(s.weather,{kind:'sun',remaining:220,intensity:0,wind:20});Object.assign(s.climate,{H:65,L:70,T:55});
 }else if(kind==='EC02'){
  Object.assign(p,{B:30,x:.52,y:.57});s.individuals.push(pet(s,'bonbon-a','bonbon',.64,.52));
  Object.assign(s.weather,{kind:'rain',remaining:220,intensity:60,wind:20});
  if(preload){const recipient=s.individuals.shift();F.advance(s,160,{visible:false});s.individuals.unshift(recipient);}
 }else if(kind==='EC03'){
  s.individuals.push(pet(s,'neolbi-a','neolbi',.46,.40),pet(s,'neolbi-b','neolbi',.60,.40));p.x=.53;p.y=.45;
 }else if(kind==='roster'){
  for(const [i,species]of ['ridley','bonbon','neolbi','neolbi','bonbon'].entries())s.individuals.push(pet(s,'friend-'+i,species,.18+i*.15,.60));s.individuals.at(-1).active=false;
 }else if(kind.startsWith('OBJ-')){
  Object.assign(p,{B:60,Q:0,energy:65,mood:65,nutrition:65,damage:0,burden:0,xp:115,visualStage:3});s.environment.tutorialDone=true;s.recruitment.nextAttempt=1e9;
  Object.assign(s.weather,{kind:'cloud',remaining:240,intensity:0,wind:20,transition:0});delete s.environment.visualFrom;s.climate.L=40;
  if(kind==='OBJ-MOSS'){s.patches.find(z=>z.id==='moss').S=0;p.energy=35;p.mood=30;Object.assign(p,F.Objects.region(s,'moss'));}
  else if(kind==='OBJ-LEAF'){p.mood=30;Object.assign(p,F.Objects.region(s,'litter'));}
  else if(kind==='OBJ-FOOD'){p.nutrition=25;Object.assign(p,F.Objects.region(s,'litter'));}
  else if(kind==='OBJ-RAIN'){s.spring.water=0;Object.assign(s.weather,{kind:'rain',intensity:60});Object.assign(p,{B:25,x:.2,y:.78});}
 }else throw Error('알 수 없는 검수 장면');
 if(kind==='SH04'){const e=F.Shelter.entry(s.shelters.facilities[0]);const blocker=pet(s,'door-visitor','ridley',e.x,e.y);blocker.mounted=true;s.individuals.push(blocker);}
 if(kind==='SH05'){const f=s.shelters.facilities[0],q=F.Shelter.seat(s,f,p);Object.assign(p,q);p.shelter={phase:'restingInside',facilityId:f.id,...q,units:6,since:s.worldTick,revision:0};const r=s.individuals[1];r.xp=0;r.visualStage=0;const z=F.Shelter.seat(s,f,r);if(z){Object.assign(r,z);r.shelter={phase:'restingInside',facilityId:f.id,...z,units:2,since:s.worldTick,revision:0};}}
 F.Shelter.init(s);F.valid(s);return s;
}
return {make,pet};
});
