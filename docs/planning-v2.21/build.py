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
R=Path('/workspace/scratch/8dd22e074e8f');O=R/'srs-2.21';G=R/'game/Forest-of-Space';D=R/'deliverables'
fp=G/'app/src/main/assets/web/fonts/GowunDodum-Regular.ttf'
pdfmetrics.registerFont(TTFont('K',str(fp))); font=fitz.Font(fontfile=str(fp))
layout=[]
def make(title,blocks,kicker='v2.21 · 비 시인성 · 물장구 음수 / APK0.6.11'):
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
source=D/'Forest_SRS_Design_Audio_v2.20.pdf';src=fitz.open(source);out=fitz.open()
for pn in range(1,len(src)+1):
 if pn in REPLACE:out.insert_pdf(make(*REPLACE[pn]))
 else:out.insert_pdf(src,from_page=pn-1,to_page=pn-1,links=False)
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
  tw=fitz.TextWriter(p.rect);tw.append((35,p.rect.height-26),'여백의 숲 | '+('오브젝트 별책' if short else '통합 명세')+' v2.21 | APK0.6.11',font=font,fontsize=8)
  if note:tw.append((35,p.rect.height-12),note,font=font,fontsize=7)
  tw.append((p.rect.width-62,p.rect.height-22),str(i+1),font=font,fontsize=8);tw.write_text(p)
footer(out);out.set_metadata({'title':'여백의 숲 SRS · 디자인 · 음향 v2.21','author':'여백의 숲','subject':'비 강도·시인성·확대 독립 합성, 물장구 실제 음수 / APK0.6.11'})
dest=D/'Forest_SRS_Design_Audio_v2.21.pdf';out.save(dest,garbage=4,deflate=True)
prev=fitz.open(D/'Forest_Object_Rules_v2.20.pdf');short=fitz.open()
cover=('여백의 숲 · 오브젝트 규칙 v2.21',[
('이번 개정','샘터에서 물장구를 치며 실제 샘물을 최대6/분·수분65까지 마신다. 기분+2/분·체력-1/분과 안전·잔량20% 조건은 승계한다. 마신 양은 실제 샘터에서 차감하며 동시 이용은 공정 배분한다.'),
('비 시인성','실제 강도에 따라 수·길이·굵기·대비를 함께 높인다. viewport 크기로 합성해 전체보기에서도 작아지지 않는다. 동작 줄이기는 같은 대비의 정적30%. 비의 물 공급·과습 계산은 시각 파티클과 독립적이다.'),
('카테고리','SRS → 디자인 → 음향 순서. S03.29·D05.01·D05.09·S08.10·A04.13을 확인한다. 기존 유한 자원 규칙과7종 카드는 승계하되 이번 물장구 음수/비 시인성 개정이 우선한다.'),
('검수 범위','자동 회귀·DOM UI·실제 Canvas 시간/강도/확대/물장구 렌더를 확인했다. Android WebView 설치·성능·터치·청음·체감 가독성은 미검수다. docs/qa-0.6.11의 최종 원본 로그를 따른다.')])
short.insert_pdf(make(*cover));entries=[];matched=set()
for _,title,pn in prev.get_toc()[1:]:
 replacement=next((rp for rp in REPLACE if rp not in [1,5] and title.startswith(REPLACE[rp][0].split()[0]+' ')),None)
 if replacement is not None:entries.append((REPLACE[replacement][0],None,replacement));matched.add(replacement)
 else:entries.append((title,pn,None))
for rp in sorted(set(REPLACE)-matched-{1,5}):entries.append((REPLACE[rp][0],None,rp))
stoc=[[1,'오브젝트 규칙 v2.21',1]]
for title,pn,rp in sorted(entries,key=lambda x:(0 if x[0].startswith('S') else 1 if x[0].startswith('D') else 2,x[0])):
 if rp is not None:short.insert_pdf(make(*REPLACE[rp]))
 else:short.insert_pdf(prev,from_page=pn-1,to_page=pn-1,links=False)
 stoc.append([2,title,len(short)])
short.set_toc(stoc);footer(short,True);short.set_metadata({'title':'여백의 숲 오브젝트 규칙·비·물장구 v2.21','author':'여백의 숲'});short.save(D/'Forest_Object_Rules_v2.21.pdf',garbage=4,deflate=True)
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
(O/'Revision-v2.21.json').write_text(json.dumps({'spec':'2.21','runtime':'0.6.11','rules':'SRS-2.19-objects','sections':REPLACE,'scope':'rain visibility and actual splash hydration','device_review':'not_run','visual_review':'native_canvas; Android not reviewed'},ensure_ascii=False,indent=2))
with (O/'Acceptance-v2.21.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow(['ID','영역','수용 조건','검수 상태']);w.writerows(ACS)
summary={'pages':len(check),'short_pages':len(short),'replaced':sorted(REPLACE),'preserved_body_pages':len(src)-len(REPLACE),'bookmarks_and_links_valid':True,'issues':issues,'layout':layout,'device_review':'not_run','visual_review':'native Canvas; Android WebView not reviewed'}
(O/'Document-Validation-v2.21.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
for pn in REPLACE:check[pn-1].get_pixmap(matrix=fitz.Matrix(1.2,1.2),alpha=False).save(O/f'page-{pn}.png')
print(json.dumps(summary,ensure_ascii=False))
