// 0.8.2 UI review: the real app in Chromium (rain night save in landscape mode) -> docs/qa-0.8.2/runtime. Usage: node tools/ui-review-082.cjs
const {chromium}=require('playwright'),path=require('path'),http=require('http'),fs=require('fs');
const web=path.resolve('app/src/main/assets/web'),out=path.resolve('docs/qa-0.8.2/runtime');fs.mkdirSync(out,{recursive:true});
const F=require(web+'/engine');
const srv=http.createServer((q,r)=>{const f=path.join(web,decodeURIComponent(q.url.split('?')[0]));if(!f.startsWith(web)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return;}const ext=path.extname(f);r.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json','.ogg':'audio/ogg','.woff2':'font/woff2'}[ext]||'application/octet-stream'});fs.createReadStream(f).pipe(r);}).listen(8765);
(async()=>{const s=F.create(Date.now(),4);s.started=true;s.environment.tutorialDone=true;s.mode='landscape';s.weather.kind='rain';s.weather.intensity=70;s.savedAt=Date.now();
 for(const [sp,x,y] of [['bonbon',.6,.55],['neolbi',.3,.78],['bosong',.7,.4],['jureong',.52,.42],['superbum',.25,.7]])s.individuals.push({...F.clone(s.individuals[0]),id:'p-'+sp,species:sp,name:sp,x,y,active:true});
 const b=await chromium.launch(),pg=await b.newPage({viewport:{width:393,height:800},deviceScaleFactor:2});
 await pg.addInitScript(t=>{localStorage.setItem('forest-of-space-v1',t);},JSON.stringify(s));
 await pg.goto('http://localhost:8765/index.html');await pg.waitForTimeout(2500);await pg.click('#garden',{position:{x:200,y:300}}).catch(()=>{});
 await pg.screenshot({path:out+'/world-hint.png'});await pg.waitForTimeout(6000);await pg.screenshot({path:out+'/world-after-5s.png'});
 await pg.click('#overview');await pg.waitForTimeout(600);await pg.screenshot({path:out+'/world-overview.png'});
 {const [dl]=await Promise.all([pg.waitForEvent('download'),pg.click('#photo')]);await dl.saveAs(out+'/photo-overview.png');}await pg.waitForTimeout(200);await pg.screenshot({path:out+'/photo-flash.png'});
 await pg.click('#overview');await pg.waitForTimeout(400);{const [dl]=await Promise.all([pg.waitForEvent('download'),pg.click('#photo')]);await dl.saveAs(out+'/photo-default.png');}await pg.waitForTimeout(600);await pg.screenshot({path:out+'/world-default.png'});
 await pg.click('nav button:nth-child(2)');await pg.waitForTimeout(600);await pg.screenshot({path:out+'/friends.png',fullPage:false});
 await pg.evaluate(()=>{const p=document.getElementById('page');p.scrollTop=p.scrollHeight;window.scrollTo(0,1e5);});await pg.waitForTimeout(300);await pg.screenshot({path:out+'/friends-bottom.png'});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));console.log('mode button:',await pg.$('#mode'),'errors',errs);
 await b.close();srv.close();})().catch(e=>{console.error(e);process.exit(1);});
