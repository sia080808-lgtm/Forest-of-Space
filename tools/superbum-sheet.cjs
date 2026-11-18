// Draft design sheet for 슈퍼범: dry / holding rain, layer breakdown, size next to 리들리·엘리시·엘레판 (scaled by their
// real-render heights: ridley 38.5, ellisii 33, elephan 53 world px; superbum proposed 1.25x ridley = 48).
const path=require('node:path'),fs=require('node:fs');const {chromium}=require('playwright');
const D=path.resolve(__dirname,'../app/src/main/assets/web/assets/forest/species'),font=path.resolve(__dirname,'../app/src/main/assets/web/fonts/PretendardVariable.woff2');
const u=f=>'data:image/png;base64,'+fs.readFileSync(path.join(D,f)).toString('base64');
const L=['nest','water','foot-left','foot-right','body','rim','antler-left','antler-right'];
const names={nest:'둥지잎(뒤)',water:'고인 빗물',  'foot-left':'왼발','foot-right':'오른발',body:'몸통',rim:'둥지잎 앞자락','antler-left':'왼쪽 사슴뿔잎','antler-right':'오른쪽 사슴뿔잎'};
const size=[['ridley-portrait.png',38.5,'리들리'],['ellisii-portrait.png',33,'엘리시'],['neolbi-portrait.png',53,'엘레판'],['superbum.png',48,'슈퍼범 (제안 1.25배)']];
const html=`<html><head><style>@font-face{font-family:P;src:url(file://${font})}body{margin:0;background:#f6ece0;font-family:P;color:#4a3b30;width:1400px}
h1{font-size:30px;margin:24px 32px 4px}p{margin:0 32px 12px;font-size:16px;color:#6d5a4b}.row{display:flex;gap:24px;padding:8px 32px;align-items:flex-end}
.c{text-align:center;font-size:15px}.c img{display:block;margin:0 auto 6px}.l{background:#efe2d2;border-radius:10px;padding:6px}</style></head><body>
<h1>슈퍼범 (Platycerium superbum) 시안</h1><p>둥지잎이 머리 뒤에서 바구니처럼 비를 받고, 아래로 늘어진 사슴뿔잎 두 장(왼쪽이 더 김). 팔 대신 사슴뿔잎, 발 2개, 몸통·세로 눈은 다른 친구들과 같은 화풍.</p>
<div class="row"><div class="c"><img src="${u('superbum.png')}" height="420">마른 둥지</div><div class="c"><img src="${u('superbum-full.png')}" height="420">빗물을 담은 둥지</div>
<div class="c" style="margin-left:30px"><div style="display:flex;gap:28px;align-items:flex-end">${size.map(([f,h,n])=>`<div class="c"><img src="${u(f)}" style="height:${h*6}px">${n}</div>`).join('')}</div><br>크기 비교 (실제 렌더 높이 기준)</div></div>
<p style="margin-top:14px">리그 레이어 (같은 520×640 좌표, 그리는 순서)</p><div class="row" style="flex-wrap:wrap">${L.map(k=>`<div class="c"><img class="l" src="${u('superbum-'+k+'.png')}" height="190">${names[k]}</div>`).join('')}</div><div style="height:20px"></div></body></html>`;
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1400,height:900},deviceScaleFactor:2});await p.setContent(html);await p.waitForTimeout(300);
 fs.mkdirSync('docs/qa-superbum-draft',{recursive:true});await p.screenshot({path:'docs/qa-superbum-draft/design-sheet.png',fullPage:true});await b.close();console.log('ok');})();
