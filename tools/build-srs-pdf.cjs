// Build a PDF from a Markdown SRS chapter (tables, images) with the game's own Pretendard font, using the
// preinstalled Chromium (Playwright). The Markdown -> HTML step uses Python-Markdown (tables extension).
// usage: node tools/build-srs-pdf.cjs docs/Forest-SmallNeighbours-SRS-v2.25.md docs/Forest-SmallNeighbours-SRS-v2.25.pdf
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const [src,out]=process.argv.slice(2);const dir=path.dirname(path.resolve(src));
// a list right after a paragraph line needs a blank line for Python-Markdown; images are embedded as data URIs
const py='import sys,re,markdown\nt=open(sys.argv[1],encoding="utf-8").read()\nt=re.sub(r"(?m)^(?!\\s*[-*|#]|\\s*$)(.+)\\n(\\s*- )",r"\\1\\n\\n\\2",t)\nprint(markdown.markdown(t,extensions=["tables"]))';
let body=execFileSync('python3',['-c',py,src]).toString();
body=body.replace(/<img alt="([^"]*)" src="([^"]+)"/g,(m,alt,s)=>{const f=path.resolve(dir,s);return fs.existsSync(f)?`<img alt="${alt}" src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}"`:m;});
const font=path.resolve(__dirname,'../app/src/main/assets/web/fonts/PretendardVariable.woff2');
const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><base href="file://${dir}/"><style>
@font-face{font-family:P;src:url(file://${font}) format('woff2');font-weight:100 900}
@page{size:A4;margin:16mm 14mm 18mm}
body{font-family:P,sans-serif;color:#2f2a24;font-size:9.6pt;line-height:1.55}
h1{font-size:19pt;color:#3d5a3a;border-bottom:2px solid #9cb48a;padding-bottom:6px;margin-top:0}
h2{font-size:12.5pt;color:#3d5a3a;margin:18px 0 6px;break-after:avoid}
table{border-collapse:collapse;width:100%;margin:6px 0 10px;font-size:8.6pt;break-inside:auto}
th,td{border:1px solid #d8cdb9;padding:4px 6px;vertical-align:top;text-align:left}
th{background:#eef2e6}tr{break-inside:avoid}td:first-child{min-width:4.6em}
img{max-width:100%;display:block;margin:8px auto 4px}
code{font-size:8.4pt;background:#f3eee4;padding:0 3px;border-radius:3px}
li{margin:2px 0}
</style></head><body>${body}</body></html>`;
(async()=>{const b=await chromium.launch(),p=await b.newPage();await p.setContent(html,{waitUntil:'load'});await p.evaluate(()=>document.fonts.ready);
 await p.pdf({path:out,format:'A4',printBackground:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="width:100%;font-size:7pt;color:#8a7f70;text-align:center">여백의 숲 · SRS v2.25 작은 이웃 생태계 · <span class="pageNumber"></span>/<span class="totalPages"></span></div>',margin:{top:'16mm',bottom:'18mm',left:'14mm',right:'14mm'}});await b.close();console.log('pdf',out);})().catch(e=>{console.error(e);process.exit(1)});
