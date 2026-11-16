from pathlib import Path
from html import escape
import io,json,csv,shutil,hashlib
import fitz
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph,Table,TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from content import REPLACE,ACS
R=Path('/workspace/scratch/8dd22e074e8f');O=R/'srs-2.20';G=R/'game/Forest-of-Space';D=R/'deliverables'
fp=G/'app/src/main/assets/web/fonts/GowunDodum-Regular.ttf'
pdfmetrics.registerFont(TTFont('K',str(fp))); font=fitz.Font(fontfile=str(fp))
layout=[]
def make(title,blocks,kicker='v2.20 · 객체별 정보 카드 / APK0.6.10'):
 titlep=Paragraph(escape(title),ParagraphStyle('title',fontName='K',fontSize=18,leading=26,textColor=HexColor('#31503c'),wordWrap='CJK'))
 th=titlep.wrap(528,100)[1]
 for size in (11.5,11,10.5):
  heading=ParagraphStyle('h',fontName='K',fontSize=size+1,leading=(size+1)*1.45,textColor=HexColor('#31503c'),wordWrap='CJK')
  body=ParagraphStyle('b',fontName='K',fontSize=size,leading=size*1.55,textColor=HexColor('#2b332f'),wordWrap='CJK')
  parts=[]
  for h,b in blocks:
   a=Paragraph(escape(h),heading);z=Paragraph(escape(b).replace('\n','<br/>'),body)
   parts.append((a,a.wrap(528,700)[1],z,z.wrap(528,700)[1]))
  need=sum(x[1]+x[3]+18 for x in parts)
  if need<680-th:break
 else:raise ValueError((title,need,th))
 stream=io.BytesIO();c=canvas.Canvas(stream,pagesize=(612,792));c.setFillColor(HexColor('#faf9f3'));c.rect(0,0,612,792,fill=1,stroke=0)
 c.setFillColor(HexColor('#748371'));c.setFont('K',8.5);c.drawString(42,761,kicker)
 titlep.drawOn(c,42,739-th);y=722-th;c.setStrokeColor(HexColor('#b6c2ac'));c.line(42,y+6,570,y+6)
 for a,ah,z,zh in parts:a.drawOn(c,42,y-ah);y-=ah+3;z.drawOn(c,42,y-zh);y-=zh+15
 c.save();layout.append({'title':title,'font':size,'bottom':y});return fitz.open(stream=stream.getvalue(),filetype='pdf')
source=D/'Forest_SRS_Design_Audio_v2.19.pdf';src=fitz.open(source);out=fitz.open();out.insert_pdf(src)
for pn,(title,blocks) in REPLACE.items():
 out.delete_page(pn-1);out.insert_pdf(make(title,blocks),start_at=pn-1)
toc=src.get_toc()
for item in toc:
 if item[2] in REPLACE:item[1]=REPLACE[item[2]][0]
# Restore source page links after replacing pages; page removal can discard incoming links.
for i,p in enumerate(out):
 for link in p.get_links():p.delete_link(link)
 for link in src[i].get_links():
  item={'kind':link['kind'],'from':link['from']}
  if link['kind']==fitz.LINK_GOTO:item.update(page=link['page'],to=link.get('to',fitz.Point(0,0)))
  elif link['kind']==fitz.LINK_URI:item['uri']=link['uri']
  else:continue
  p.insert_link(item)
out.set_toc(toc)
def footer(doc,short=False):
 for i,p in enumerate(doc):
  oldtext=p.get_text();note=''
  for line in oldtext.splitlines():
   if line.startswith('자원·회복의 상충 구규칙') or line.startswith('이전 APK 구현 이력'):note=line
  p.add_redact_annot(fitz.Rect(0,p.rect.height-43,p.rect.width,p.rect.height),fill=(1,1,1));p.apply_redactions(images=0,graphics=0)
  tw=fitz.TextWriter(p.rect);tw.append((35,p.rect.height-26),'여백의 숲 | '+('오브젝트 별책' if short else '통합 명세')+' v2.20 | APK0.6.10',font=font,fontsize=8)
  if note:tw.append((35,p.rect.height-12),note,font=font,fontsize=7)
  tw.append((p.rect.width-62,p.rect.height-22),str(i+1),font=font,fontsize=8);tw.write_text(p)
footer(out);out.set_metadata({'title':'여백의 숲 SRS · 디자인 · 음향 v2.20','author':'여백의 숲','subject':'7종 오브젝트별 실제 수치·잔량·공간·회복 조건 카드 / APK0.6.10'})
dest=D/'Forest_SRS_Design_Audio_v2.20.pdf';out.save(dest,garbage=4,deflate=True)
prev=fitz.open(D/'Forest_Object_Rules_v2.19.pdf');short=fitz.open();short.insert_pdf(prev)
cover=('여백의 숲 · 오브젝트 규칙 v2.20',[
('핵심 규칙 승계','이끼: 놀이·느린 기분/체력 회복, 저장수5/7/9. 샘터: 실제 비/저장된 눈으로만 보충. 낙엽: 놀이용 낙엽→거름→영양 흡수, 공동 용량100/150/200. 쉼터: 실제 입실 후 체력 회복. 다른 조건은 v2.19 본문을 승계한다.'),
('이번 UI 개정','7종 오브젝트를 누르면 각 기능에 맞는 4개 핵심 수치와 자세한 이용·보충·확장 조건을 보여준다. 낙엽/거름을 따로 표시하고 실제 용량을 읽는다. 쉼터는 입실 인원과 사용 공간을 구분한다. S06.14·D06.15·S08.10을 먼저 확인한다.'),
('검수 범위','APK0.6.10 적용 및 자동32개/DOM UI 검사 완료. 실제 브라우저 화면과 Android 실기기 설치·터치·성능은 미검수. 소스의 docs/qa-0.6.10 및 Acceptance-v2.20.csv를 참조한다.'),
('문서 구조','SRS → 디자인 → 음향 순서의 기존 별책 구성을 보존했다. 이번 개정은 정보 카드이며 원화·캐릭터 리그·음향 자산 변경은 없다.')])
short.delete_page(0);short.insert_pdf(make(*cover),start_at=0)
stoc=prev.get_toc();stoc[0][1]='오브젝트 규칙 v2.20';changedShort=[1]
for item in stoc:
 for pn in [115,130,339]:
  prefix=REPLACE[pn][0].split()[0]
  if item[1].startswith(prefix):
   ix=item[2]-1;short.delete_page(ix);short.insert_pdf(make(*REPLACE[pn]),start_at=ix);item[1]=REPLACE[pn][0];changedShort.append(ix+1)
short.set_toc(stoc);footer(short,True);short.set_metadata({'title':'여백의 숲 오브젝트 규칙·카드 v2.20','author':'여백의 숲'});short.save(D/'Forest_Object_Rules_v2.20.pdf',garbage=4,deflate=True)
check=fitz.open(dest)
def body(p):return ''.join(p.get_text(clip=fitz.Rect(0,0,p.rect.width,p.rect.height-43)).split())
issues=[]
for i,p in enumerate(check):
 if i+1 not in REPLACE and body(p)!=body(src[i]):issues.append(['body',i+1])
 for link in p.get_links():
  if link['kind']==fitz.LINK_GOTO and not 0<=link.get('page',-1)<len(check):issues.append(['link',i+1])
for _,title,pn in check.get_toc():
 if not 1<=pn<=len(check):issues.append(['bookmark',title])
for pn in REPLACE:
 for block in check[pn-1].get_text('dict')['blocks']:
  for line in block.get('lines',[]):
   x0,y0,x1,y1=line['bbox']
   if x0<14 or x1>check[pn-1].rect.width-14:issues.append(['overflow',pn,line['bbox']])
assert not issues,issues
(O/'Revision-v2.20.json').write_text(json.dumps({'spec':'2.20','runtime':'0.6.10','rules':'SRS-2.19-objects','sections':REPLACE,'scope':'object information cards only','device_review':'not_run','visual_review':'blocked_environment'},ensure_ascii=False,indent=2))
with (O/'Acceptance-v2.20.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow(['ID','영역','수용 조건','검수 상태']);w.writerows(ACS)
summary={'pages':len(check),'short_pages':len(short),'replaced':sorted(REPLACE),'preserved_body_pages':len(src)-len(REPLACE),'bookmarks_and_links_valid':True,'issues':issues,'layout':layout,'device_review':'not_run','browser_review':'environment blocked'}
(O/'Document-Validation-v2.20.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
for pn in REPLACE:check[pn-1].get_pixmap(matrix=fitz.Matrix(1.2,1.2),alpha=False).save(O/f'page-{pn}.png')
print(json.dumps(summary,ensure_ascii=False))
