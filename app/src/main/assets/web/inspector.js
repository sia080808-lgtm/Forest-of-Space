(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestInspector=api;})(globalThis,function(){
'use strict';
// Disposable preview. This module never writes storage or advances the real simulation.
const Motion=typeof module==='object'?require('./neolbi-motion.js'):globalThis.ForestNeolbiMotion;
const legacyMotions=['splash','moss','litter','idle','walk','slow','hurry','run','drink','rest','groom','held','land','duck','step','avoid','shade'];
const motions=[...new Set([...legacyMotions,...Motion.catalog.map(x=>x.id)])];
class Inspector {
 constructor(source,F){this.F=F;this.state=F.clone(source);this.state.started=true;this.state.mode='game';this.state.offline=null;this.time=0;this.speed=1;this.playing=true;this.motion='idle';this.expression='auto';this.water=60;this.flow=false;this.state.settings.theme='day';this.state.settings.reducedMotion=false;this.state.individuals=this.state.individuals.slice(0,1);this.state.individuals[0].active=true;this.state.individuals[0].mounted=false;this.update(0);}
 set(key,value){if(['a','c','e'].includes(key)){const n=Number(value);if([-1,0,1].includes(n))this.state.individuals[0].personality[key]=n;return;}if(['rainIntensity','wind','rootWet','burden','damage'].includes(key)){const n=Math.max(0,Math.min(100,Number(value)||0));if(key==='rainIntensity'){this.state.weather.kind=n?'rain':'sun';this.state.weather.intensity=n;}else if(key==='wind')this.state.weather.wind=n;else if(key==='rootWet')this.state.individuals[0].Q=n/5;else this.state.individuals[0][key]=n;return;}if(key==='species'){if(this.F.SPECIES.some(p=>p[0]===value)){this.scenario='none';this.state.individuals=this.state.individuals.slice(0,1);this.state.individuals[0].species=value;}this.update(0);return;}if(key==='scenario'){this.scenario=value;this.time=0;this.simAcc=0;if(value!=='none')this.state=ForestFixtures.make(value,true);return;}if(key==='expression'){if(['auto','neutral','happy','surprised','sad','sleepy','focused'].includes(value))this.expression=value;}else if(key==='motion'){if(!motions.includes(value))return;this.motion=value;this.time=0;}else if(key==='weather'){this.state.weather.kind=['storm','wind'].includes(value)?(value==='storm'?'rain':'sun'):value;this.state.weather.wind=value==='storm'?75:value==='wind'?45:20;this.state.weather.intensity=value==='storm'?85:75;this.state.weather.transition=0;delete this.state.environment.visualFrom;if(value==='storm')this.state.environment.storm={phase:'peak',remaining:60};else delete this.state.environment.storm;}else if(key==='theme'){this.state.settings.theme='auto';this.state.previewTime=value==='day'?'noon':value;this.state.worldTick=({morning:90,noon:360,dusk:570,night:750,deep:1020,dawn:1170})[this.state.previewTime]||360;}else if(key==='water')this.water=Math.max(0,Math.min(60,Number(value)||0));else if(key==='flow')this.flow=!!value;else if(key==='reduced')this.state.settings.reducedMotion=!!value;else if(key==='speed')this.speed=Math.max(.1,Math.min(2,Number(value)||1));else if(key==='growth'){this.state.individuals[0].xp=Number(value)||0;this.state.individuals[0].visualStage=this.F.Shelter.desiredStage(this.state.individuals[0]);}this.update(0);}
 stepFrame(){if(this.scenario&&this.scenario!=='none')this.F.step(this.state,{visible:true});this.time+=1/30;this.playing=false;this.update(0);}
 update(dt){if(this.playing)this.time+=Math.min(.1,Math.max(0,dt))*this.speed;if(this.scenario&&this.scenario!=='none'){this.simAcc=(this.simAcc||0)+(this.playing?dt*this.speed:0);while(this.simAcc>=1){this.F.step(this.state,{visible:true});this.simAcc--;}return;}const s=this.state,p=s.individuals[0],shade=s.patches.find(z=>z.id==='shade'),moss=s.patches.find(z=>z.id==='moss'),t=this.time;
 s.spring.water=this.water;s.spring.inflow=this.flow?10/60:0;p.target=null;p.x=.5;p.y=.55;
 if(['drink','splash'].includes(this.motion)){Object.assign(p,this.F.Space.socket(s,'spring'));p.target='spring';}
 else if(['moss','litter'].includes(this.motion)){Object.assign(p,this.F.Space.socket(s,this.motion));p.target=this.motion;}
 else if(this.motion==='rest'){this.F.Shelter.release(p,s.worldTick);const f=s.shelters.facilities[0],q=this.F.Shelter.seat(s,f,p);if(q)Object.assign(p,q);}
 else if(this.motion==='duck'){p.x=shade.x-.12+.24*((t%4)/4);p.y=shade.y+.07;}
 else if(this.motion==='step'){p.x=moss.x-.12+.24*((t%4)/4);p.y=moss.y+.04;}
 else if(this.motion==='avoid'){const a=(t%5)/5*Math.PI*2;p.x=shade.x+Math.cos(a)*.075;p.y=shade.y+.015+Math.sin(a)*.055;}
 else if(['walk','slow','hurry','run'].includes(this.motion))p.x=.37+.26*((t%4)/4);
 p.canopy=p.species==='neolbi'&&['shade','umbrella'].includes(this.motion)&&s.weather.wind<60;p.canopyProgress=p.canopy?Math.min(1,Math.max(0,t/.6)):0;
 p.motion={kind:this.motion,path:[{x:p.x,y:p.y}],distance:0,water:this.motion==='drink'&&this.water>0?.1:0,tick:s.worldTick};
 }
}
Inspector.motions=motions;return Inspector;
});
