// 0.8.5 review: the real app in Chromium -> docs/qa-0.8.5/runtime. Friends out on the open ground (overview), winter snow over the
// whole wide forest (overview), the fern frame on and off (default view). Usage: node tools/stroll-review-085.cjs
const {chromium}=require('playwright'),path=require('path'),http=require('http'),fs=require('fs');
const web=path.resolve('app/src/main/assets/web'),out=path.resolve('docs/qa-0.8.5/runtime');fs.mkdirSync(out,{recursive:true});
const F=require(web+'/engine');
const srv=http.createServer((q,r)=>{const f=path.join(web,decodeURIComponent(q.url.split('?')[0]));if(!f.startsWith(web)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return;}const ext=path.extname(f);r.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg','.json':'application/json'}[ext]||'application/octet-stream'});fs.createReadStream(f).pipe(r);}).listen(8766);
const save=(o={})=>{const s=F.create(Date.now(),4);s.started=true;s.environment.tutorialDone=true;s.savedAt=Date.now();s.worldTick=300;s.environment.calendar.start=s.worldTick-(o.season||0)*3600-600;
 s.weather.kind=o.weather||'sun';s.weather.intensity=o.weather==='snow'?80:0;s.weather.wind=10;s.weather.remaining=200;
 const spots=[['bonbon',-.12,.3],['neolbi',1.1,.62],['bosong',.4,1.12],['jureong',1.08,.05],['superbum',.62,.6]];
 for(const [sp,x,y] of spots)s.individuals.push({...F.clone(s.individuals[0]),id:'p-'+sp,species:sp,name:sp,x,y,active:true,first:{drink:true}});
 for(const p of s.individuals){Object.assign(p,{B:60,energy:80,nutrition:70,mood:90});if(o.stroll&&(p.x<0||p.x>1||p.y<0||p.y>1))p.stroll={x:p.x,y:p.y,since:280,deadline:370,linger:30,arrivedAt:290};}
 if(o.frame===false)s.settings.showFrame=false;F.valid(s);return s;};
(async()=>{const b=await chromium.launch();const errs=[];
 const shot=async(name,s,overview)=>{const pg=await b.newPage({viewport:{width:393,height:800},deviceScaleFactor:2});pg.on('pageerror',e=>errs.push(e.message));
  await pg.addInitScript(t=>{localStorage.setItem('forest-of-space-v1',t);},JSON.stringify(s));await pg.goto('http://localhost:8766/index.html');await pg.waitForTimeout(2500);
  if(overview){await pg.click('#overview');await pg.waitForTimeout(700);}await pg.screenshot({path:out+'/'+name+'.png'});await pg.close();};
 await shot('stroll-overview',save({stroll:true}),true);
 await shot('winter-snow-overview',save({season:3,weather:'snow'}),true);
 await shot('frame-on',save({}),false);
 await shot('frame-off',save({frame:false}),false);
 console.log('errors',errs);await b.close();srv.close();})().catch(e=>{console.error(e);process.exit(1);});
