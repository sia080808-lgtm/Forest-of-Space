// 0.9.5 review: the reorganised settings page and the admin tools in the real app (Chromium) -> docs/qa-0.9.5/runtime.
// Usage: node tools/admin-review.cjs
const {chromium}=require('playwright'),path=require('path'),http=require('http'),fs=require('fs');
const web=path.resolve('app/src/main/assets/web'),out=path.resolve('docs/qa-0.9.5/runtime');fs.mkdirSync(out,{recursive:true});
const F=require(web+'/engine');
const srv=http.createServer((q,r)=>{const f=path.join(web,decodeURIComponent(q.url.split('?')[0]));if(!f.startsWith(web)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg','.ogg':'audio/ogg'}[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);}).listen(8766);
(async()=>{const s=F.create(Date.now(),4);s.started=true;s.environment.tutorialDone=true;s.savedAt=Date.now();
 for(const [sp,x,y] of [['bonbon',.6,.55],['neolbi',.3,.78]])s.individuals.push({...F.clone(s.individuals[0]),id:'p-'+sp,species:sp,name:{bonbon:'엘리시',neolbi:'엘레판'}[sp],x,y,active:true,xp:150});s.individuals[0].xp=150;
 const b=await chromium.launch(),pg=await b.newPage({viewport:{width:393,height:800},deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.addInitScript(t=>{localStorage.setItem('forest-of-space-v1',t);},JSON.stringify(s));
 await pg.goto('http://localhost:8766/index.html');await pg.waitForTimeout(2000);
 await pg.click('#settings');await pg.waitForTimeout(400);await pg.screenshot({path:out+'/settings.png',fullPage:true});
 await pg.click('[data-action="admin"]');await pg.waitForTimeout(400);await pg.screenshot({path:out+'/admin.png',fullPage:true});
 await pg.evaluate(()=>document.querySelectorAll('.admin-sec').forEach(d=>d.open=true));await pg.waitForTimeout(200);await pg.screenshot({path:out+'/admin-open.png',fullPage:true});
 console.log('errors',errs);await b.close();srv.close();})().catch(e=>{console.error(e);process.exit(1);});
