// 0.9.5 review: the reorganised settings page and the admin tools in the real app (Chromium) -> docs/qa-1.0.0/runtime.
// Usage: node tools/admin-review.cjs
const {chromium}=require('playwright'),path=require('path'),http=require('http'),fs=require('fs');
const web=path.resolve('app/src/main/assets/web'),out=path.resolve('docs/qa-1.0.0/runtime');fs.mkdirSync(out,{recursive:true});
const F=require(web+'/engine');
const srv=http.createServer((q,r)=>{const f=path.join(web,decodeURIComponent(q.url.split('?')[0]));if(!f.startsWith(web)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg','.ogg':'audio/ogg'}[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);}).listen(8767);
(async()=>{const s=F.create(Date.now(),4);s.started=true;s.environment.tutorialDone=true;s.savedAt=Date.now();
 for(const [sp,x,y] of [['bonbon',.6,.55],['neolbi',.3,.78]])s.individuals.push({...F.clone(s.individuals[0]),id:'p-'+sp,species:sp,name:{bonbon:'엘리시',neolbi:'엘레판'}[sp],x,y,active:true,xp:sp==='neolbi'?60:3,B:sp==='neolbi'?78:44,nutrition:sp==='neolbi'?55:20,energy:sp==='neolbi'?90:35});
 const b=await chromium.launch(),pg=await b.newPage({viewport:{width:393,height:800},deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.addInitScript(t=>{localStorage.setItem('forest-of-space-v1',t);},JSON.stringify(s));
 await pg.goto('http://localhost:8767/index.html');await pg.waitForTimeout(2000);
 await pg.click('nav button:nth-child(2)');await pg.waitForTimeout(400);await pg.screenshot({path:out+'/friends.png'});
 for(const id of ['p-bonbon','p-neolbi']){await pg.evaluate(i=>{const b=document.querySelector('[data-action="detail"][data-id="'+i+'"]');b&&b.click();},id);await pg.waitForTimeout(400);await pg.screenshot({path:out+'/top-'+id+'.png'});await pg.evaluate(()=>document.querySelector('.hexstats')?.scrollIntoView());await pg.screenshot({path:out+'/detail-'+id+'.png'});await pg.evaluate(()=>window.scrollTo(0,0));await pg.evaluate(()=>{const b=document.querySelector('[data-action="detail-back"]');b&&b.click();});await pg.waitForTimeout(300);}
 console.log('errors',errs);await b.close();srv.close();})().catch(e=>{console.error(e);process.exit(1);});
