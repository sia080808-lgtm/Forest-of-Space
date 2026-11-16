from pathlib import Path
import sys,io,json,re,shutil,csv
import fitz
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from content import REPLACE,INSERT,ACS
R=Path('/workspace/scratch/8dd22e074e8f');O=R/'srs-2.18';G=R/'game/Forest-of-Space'
fp=G/'app/src/main/assets/web/fonts/GowunDodum-Regular.ttf';pdfmetrics.registerFont(TTFont('K',str(fp)))
layout=[]
def make(title,blocks):
 for sz in [11,10.5,10]:
  style=ParagraphStyle('p',fontName='K',fontSize=sz,leading=sz*1.52,wordWrap='CJK',textColor=HexColor('#293a30'))
  ps=[Paragraph(h+'<br/>'+b,style) for h,b in blocks];hs=[p.wrap(528,680)[1] for p in ps]
  if sum(hs)+14*len(hs)<654:break
 else:raise ValueError((title,sum(hs)))
 b=io.BytesIO();c=canvas.Canvas(b,pagesize=(612,792));c.setFillColor(HexColor('#f9f8f2'));c.rect(0,0,612,792,fill=1,stroke=0);c.setFillColor(HexColor('#3b5840'));c.setFont('K',18);c.drawString(42,747,title);y=711
 for p,h in zip(ps,hs):p.drawOn(c,42,y-h);y-=h+14
 c.save();layout.append({'title':title,'bottom':y,'font':sz});return fitz.open(stream=b.getvalue(),filetype='pdf')
def sheetpage(title,filename,desc):
 b=io.BytesIO();c=canvas.Canvas(b,pagesize=(612,792));c.setFont('K',17);c.setFillColor(HexColor('#3b5840'));c.drawString(35,758,title);c.setFont('K',9);c.drawString(35,738,desc);c.drawImage(str(O/filename),158,54,width=296,height=665,preserveAspectRatio=True,anchor='c');c.save();return fitz.open(stream=b.getvalue(),filetype='pdf')
src=fitz.open(G/'docs/Forest_SRS_Design_Audio_v2.17.pdf');out=fitz.open();mapping={};added=[];changed=[]
for n in range(1,len(src)+1):
 mapping[n]=len(out)+1
 if n in REPLACE:out.insert_pdf(make(*REPLACE[n]));changed.append(len(out))
 else:out.insert_pdf(src,from_page=n-1,to_page=n-1,links=False)
 for title,blocks in INSERT.get(n,[]):added.append([3,title,len(out)+1]);out.insert_pdf(make(title,blocks));changed.append(len(out))
 if n==273:
  for title,f,desc in [('D05.61 ENV218-A 시간대 색감 시안','Forest218-Time.png','승인한 색감 기준 · APK0.6.6 실제 반영'),('D05.62 ENV218-B 날씨 색감 시안','Forest218-Weather.png','승인한 조명 기준 · 제품 렌더 검수는 D05.63 참조')]:
   added.append([3,title,len(out)+1]);out.insert_pdf(sheetpage(title,f,desc));changed.append(len(out))
toc=[]
for lv,t,n in src.get_toc():
 if n==1:t='v2.18 영입·확장·순서·전체 날씨·공통 조명'
 elif lv==3 and n in REPLACE:t=REPLACE[n][0]
 toc.append([lv,t,mapping[n]])
toc+=added;toc.sort(key=lambda a:(a[2],a[0]))
for n,part in [(2,'S'),(3,'D'),(4,'A')]:
 es=[a for a in toc if a[0]==2 and a[1].startswith(part)];blocks=[(t,'본문 '+str(p)+'쪽') for _,t,p in es];d=make('목차 | '+{'S':'기능 요구사항','D':'디자인 명세','A':'음향 명세'}[part],blocks);ix=mapping[n]-1;out.delete_page(ix);out.insert_pdf(d,start_at=ix);changed.append(ix+1)
 # Anchors follow the exact paragraph heights used by make.
 y=711;sty=ParagraphStyle('toc',fontName='K',fontSize=11,leading=16.72,wordWrap='CJK')
 for h,b in blocks:
  q=Paragraph(h+'<br/>'+b,sty);_,hh=q.wrap(528,680);dest=next(p for _,t,p in es if t==h);out[ix].insert_link({'kind':fitz.LINK_GOTO,'from':fitz.Rect(42,792-y,570,792-y+hh),'page':dest-1});y-=hh+14
for n in range(1,len(src)+1):
 if n in REPLACE or n in [2,3,4]:continue
 for l in src[n-1].get_links():
  z={'kind':l['kind'],'from':l['from']}
  if l['kind']==fitz.LINK_URI:z['uri']=l['uri']
  elif l['kind']==fitz.LINK_GOTO and l.get('page',-1)>=0:z.update(page=mapping[l['page']+1]-1,to=l.get('to',fitz.Point(0,0)))
  else:continue
  out[mapping[n]-1].insert_link(z)
out.set_toc(toc);font=fitz.Font(fontfile=str(fp))
for i,p in enumerate(out):
 p.add_redact_annot(fitz.Rect(0,p.rect.height-43,p.rect.width,p.rect.height),fill=(1,1,1));p.apply_redactions(images=0,graphics=0);tw=fitz.TextWriter(p.rect);tw.append((35,p.rect.height-22),'여백의 숲 | 통합 명세 v2.18 | 2026-11-16',font=font,fontsize=8);tw.append((p.rect.width-62,p.rect.height-22),str(i+1),font=font,fontsize=8);tw.write_text(p)
out.set_metadata({'title':'여백의 숲 SRS · 디자인 · 음향 v2.18','author':'여백의 숲','subject':'영입·선제확장·안전순번·전체날씨·공통조명 설계'});dest=O/'Forest_SRS_Design_Audio_v2.18.pdf';out.save(dest,garbage=4,deflate=True)
check=fitz.open(dest);issues=[]
def body(p):return ''.join(p.get_text(clip=fitz.Rect(0,0,p.rect.width,p.rect.height-43)).split())
for n in range(1,len(src)+1):
 if n not in REPLACE and n not in [2,3,4] and body(src[n-1])!=body(check[mapping[n]-1]):issues.append(['unexpected-body-change',n])
for p in check:
 for l in p.get_links():
  if l['kind']==fitz.LINK_GOTO and not 0<=l.get('page',-1)<len(check):issues.append(['link',p.number+1])
for _,t,n in check.get_toc():
 if not 1<=n<=len(check):issues.append(['bookmark',t,n])
for n in changed:
 for b in check[n-1].get_text('dict')['blocks']:
  for line in b.get('lines',[]):
   if line['bbox'][0]<15 or line['bbox'][2]>check[n-1].rect.width-15:issues.append(['overflow',n,line['bbox']])
text=''.join(p.get_text() for p in check)
for i in range(1,21):
 if 'AC218-'+str(i).zfill(2) not in text:issues.append(['missing-ac',i])
assert not issues,issues
records=[]
for n in range(1,len(src)+1):
 if n in REPLACE:records.append(REPLACE[n])
 records.extend(INSERT.get(n,[]))
md='# 여백의 숲 통합 명세 v2.18 개정 원문\n\n2026-11-16. 이 파일은 이번 개정의 편집 원문이다. 전체 현행 명세는 통합 PDF이며 기존 본문·시안을 보존했다. 배포 APK0.6.7, ENV218 시각 값은 사용자 승인 완료. 구현 및 검수 경계는 S09.13~14, D05.63, A04.12 참조.\n\n'
for title,bs in records:md+='## '+title+'\n\n'+'\n\n'.join('### '+h+'\n\n'+b.replace('<br/>','\n') for h,b in bs)+'\n\n'
(O/'Forest-SRS-v2.18-Revision.md').write_text(md)
with (O/'Acceptance-218.csv').open('w') as f:
 w=csv.writer(f);w.writerow(['ID','영역','입력','기대결과','상태']);w.writerows([['AC218-'+a,b,c,d,'미실행'] for a,b,c,d in ACS])
with (O/'Weather-Time-42.csv').open('w') as f:
 w=csv.writer(f);w.writerow(['날씨','시간대','색감','파츠일치','효과/보호','음향','성능']);w.writerows([[a,b]+['미실행']*5 for a in ['맑음','흐림','비','안개','눈','강풍','태풍'] for b in ['새벽','아침','한낮','노을','밤','깊은밤']])
audit={'pages':len(check),'replaced':len(REPLACE),'inserted':len(added),'preserved_body_pages':len(src)-len(REPLACE)-3,'changed_pages':changed,'new_sections':added,'mapping':mapping,'layout':layout,'links_valid':True,'bookmarks_valid':True,'issues':issues,'runtime_tests':'165-unique-automated-plus-ui-and-entrance-render','apk':'0.6.7-device-test-pending'};(O/'validation.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2))
# Render all changed pages into a multi-sheet contact proof for visual QA.
from PIL import Image,ImageDraw
for group,start in enumerate(range(0,len(changed),16)):
 img=Image.new('RGB',(1224,1656),'#dddddd');draw=ImageDraw.Draw(img)
 for j,n in enumerate(changed[start:start+16]):
  p=check[n-1].get_pixmap(matrix=fitz.Matrix(.48,.48),alpha=False);im=Image.frombytes('RGB',[p.width,p.height],p.samples);x=(j%4)*306;y=(j//4)*414;img.paste(im,(x,y+20));draw.text((x+5,y+4),str(n),fill='black')
 img.save(O/f'proof-{group}.png')
print(json.dumps({k:v for k,v in audit.items() if k not in ['mapping','layout','new_sections','changed_pages']},ensure_ascii=False))
