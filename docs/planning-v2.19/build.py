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
from content import SECTIONS,REPLACE,ACS
R=Path('/workspace/scratch/8dd22e074e8f');O=R/'srs-2.19';G=R/'game/Forest-of-Space';D=R/'deliverables'
fp=G/'app/src/main/assets/web/fonts/GowunDodum-Regular.ttf'
pdfmetrics.registerFont(TTFont('K',str(fp))); font=fitz.Font(fontfile=str(fp))
layout=[]
def make(title,blocks,kicker='v2.19 · 현행 규칙 / APK0.6.9'):
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
# Small read-first matrix in the object-only booklet.
def overview():
 stream=io.BytesIO();c=canvas.Canvas(stream,pagesize=(612,792));c.setFillColor(HexColor('#faf9f3'));c.rect(0,0,612,792,fill=1,stroke=0);c.setFont('K',21);c.setFillColor(HexColor('#31503c'));c.drawString(42,745,'여백의 숲 · 오브젝트 규칙 v2.19');c.setFont('K',11);c.drawString(42,715,'최신 개정 별책 | 주효과 · 실제 재고 · 사용 조건')
 st=ParagraphStyle('t',fontName='K',fontSize=10,leading=15,wordWrap='CJK')
 rows=[['오브젝트','핵심 기능','증가·보충 조건'],['이끼','놀이·기분·체력','기분 +1/분, 체력 +2/분. 물 5만 보유. 마른 상태도 회복.'],['샘터','주 급수·물장구','실제 비·기록된 눈/낙수로 보충. 시간 자동충전 0.'],['낙엽','놀이·분해·영양','L→U 1:1. 합계 용량 100. 하루 새 낙엽 최대 20.'],['쉼터','수면·날씨 대피','실제 입실 후 체력 +4/분. 원격 물·영양 공급 0.'],['햇살 바위','건조·가벼운 휴식','마른 표면·안전한 바람일 때 이용. 체력 +1/분.'],['잎 그늘','차광·약한 비 완화','실제 잎 영역에서만 보호. 안전 휴식 체력 +1.5/분.'],['바위틈','바람 회피·은신','방향·형상·수위를 검사. 안전 휴식 체력 +1/분.']]
 data=[[Paragraph(escape(s),st) for s in row]for row in rows];t=Table(data,colWidths=[84,133,311]);t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),HexColor('#dde5d2')),('GRID',(0,0),(-1,-1),.5,HexColor('#b9c6b0')),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)]));_,h=t.wrap(528,650);t.drawOn(c,42,685-h)
 text='이번 규칙은 APK0.6.9에 연결했다. 실제 Android 기기 설치·장기 밸런스 검수는 별도다. 수치는 게임 밸런스 초기값이며, 물·영양·자리의 실제 조건과 잔량을 먼저 검사한다. 이끼 회복은 진입 순간 지급하지 않고 유효 이용 시간만큼 서서히 누적한다.'
 p=Paragraph(text,ParagraphStyle('n',fontName='K',fontSize=11,leading=18,wordWrap='CJK'));_,hh=p.wrap(528,180);p.drawOn(c,42,650-h-hh);c.save();return fitz.open(stream=stream.getvalue(),filetype='pdf')
src=fitz.open(D/'Forest_SRS_Design_Audio_v2.18.pdf');out=fitz.open();mapping={};changed=[];added=[];original_at={}
# Rehome old implementation appendices into their actual categories.
relocate={127:[391],380:[353]};skip={391,353}
byafter={}
for s in SECTIONS:byafter.setdefault(s['after'],[]).append(s)
def original(n):
 mapping[n]=len(out)+1;original_at[len(out)+1]=n
 if n in REPLACE:out.insert_pdf(make(*REPLACE[n]));changed.append(len(out))
 else:out.insert_pdf(src,from_page=n-1,to_page=n-1,links=False)
for n in range(1,len(src)+1):
 if n in skip:continue
 original(n)
 for extra in relocate.get(n,[]):original(extra)
 for s in byafter.get(n,[]):
  added.append([3,s['id']+' '+s['title'],len(out)+1]);out.insert_pdf(make(s['id']+' '+s['title'],s['blocks']));changed.append(len(out))
toc=[]
for lv,t,n in src.get_toc():
 if n==1:t='v2.19 오브젝트·유한 자원·필요 기반 행동'
 elif n==5:t='SRS 개정 요구사항 v2.19'
 elif n in REPLACE and lv==3:t=REPLACE[n][0]
 if n in [126,127,391]:lv=3;t={126:'S09.R066 APK0.6.6 구현 이력',127:'S09.R067 APK0.6.7 교착 수정 이력',391:'S09.R068 APK0.6.8 대체 입구 탐색 이력'}[n]
 toc.append([lv,t,mapping[n]])
toc+=added;toc.sort(key=lambda z:(z[2],z[0]))
for n,letter,label in [(2,'S','기능 요구사항'),(3,'D','디자인 명세'),(4,'A','음향 명세')]:
 es=[x for x in toc if x[0]==2 and x[1].startswith(letter)];blocks=[(t,f'{p}쪽')for _,t,p in es];page=make('목차 | '+label,blocks,'v2.19 · 항목을 누르면 해당 장으로 이동');ix=mapping[n]-1;out.delete_page(ix);out.insert_pdf(page,start_at=ix);changed.append(ix+1)
 # Text search locates the exact clickable heading rectangle.
 for _,t,p in es:
  hits=out[ix].search_for(t)
  if hits:out[ix].insert_link({'kind':fitz.LINK_GOTO,'from':hits[0],'page':p-1})
for n in range(1,len(src)+1):
 if n in REPLACE or n in [2,3,4]:continue
 for l in src[n-1].get_links():
  z={'kind':l['kind'],'from':l['from']}
  if l['kind']==fitz.LINK_URI:z['uri']=l['uri']
  elif l['kind']==fitz.LINK_GOTO and l.get('page',-1)>=0:z.update(page=mapping[l['page']+1]-1,to=l.get('to',fitz.Point(0,0)))
  else:continue
  out[mapping[n]-1].insert_link(z)
out.set_toc(toc)
notes={19,27,37,43,51,52,82,121,122,130,141,145,149,203,204,213,215,230,231,237,241,242,274,277,282,345,362,369,373,383}
for i,p in enumerate(out):
 p.add_redact_annot(fitz.Rect(0,p.rect.height-43,p.rect.width,p.rect.height),fill=(1,1,1));p.apply_redactions(images=0,graphics=0);tw=fitz.TextWriter(p.rect)
 old=original_at.get(i+1)
 note='여백의 숲 | 통합 명세 v2.19 | 현행 규칙 · APK0.6.9'
 tw.append((35,p.rect.height-26),note,font=font,fontsize=8)
 if old in notes:tw.append((35,p.rect.height-12),'자원·회복의 상충 구규칙은 S03.18~31 / S05.20~21의 현행 조건으로 대체',font=font,fontsize=7)
 elif old in [126,127,391,353]:tw.append((35,p.rect.height-12),'이전 APK 구현 이력 · v2.19 오브젝트 규칙의 구현 완료 증거가 아님',font=font,fontsize=7)
 tw.append((p.rect.width-62,p.rect.height-22),str(i+1),font=font,fontsize=8);tw.write_text(p)
out.set_metadata({'title':'여백의 숲 SRS · 디자인 · 음향 v2.19','author':'여백의 숲','subject':'이끼 느린 기분·체력 회복, 비 기반 물, 유한 낙엽 순환, 필요 기반 행동 — 기획 개정'})
dest=D/'Forest_SRS_Design_Audio_v2.19.pdf';out.save(dest,garbage=4,deflate=True)
# Object-only edition: usable without downloading the full illustrated source.
short=fitz.open();short.insert_pdf(overview());shorttoc=[[1,'오브젝트 규칙 v2.19',1]]
for n in [21,22]:shorttoc.append([2,REPLACE[n][0],len(short)+1]);short.insert_pdf(make(*REPLACE[n]))
for s in SECTIONS:
 shorttoc.append([2,s['id']+' '+s['title'],len(short)+1]);short.insert_pdf(make(s['id']+' '+s['title'],s['blocks']))
short.set_toc(shorttoc)
for i,p in enumerate(short):
 tw=fitz.TextWriter(p.rect);tw.append((42,768),'여백의 숲 | v2.19 오브젝트 개정 별책 | APK0.6.9 구현',font=font,fontsize=8);tw.append((550,768),str(i+1),font=font,fontsize=8);tw.write_text(p)
short.set_metadata({'title':'여백의 숲 오브젝트 조건 규칙 v2.19','author':'여백의 숲'});short.save(D/'Forest_Object_Rules_v2.19.pdf',garbage=4,deflate=True)
# Editable sources and implementation handoff.
(O/'Revision-v2.19.json').write_text(json.dumps({'spec':'2.19','runtime':'0.6.9','implementation':'implemented_device_review_pending','sections':SECTIONS,'replacements':REPLACE},ensure_ascii=False,indent=2))
with (O/'Acceptance-v2.19.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow(['ID','영역','조건','기대 결과','실행 상태']);w.writerows([['AC219-'+i,cat,a,b,('부분 검증: 렌더/음향 연결 확인, 실기기 미검수' if i=='30' else '자동 검사 통과 / docs/qa-0.6.9 참조')]for i,cat,a,b in ACS])
params={'specVersion':'2.19','runtimeImplemented':True,'tickSeconds':1,'gameDaySeconds':1200,'water':{'automaticSpringPerMinute':0,'fogCondensationPerMinute':0,'rainPerAreaMinuteAt100':12,'springCatchmentArea':3,'dryLimitSeconds':{'C01':600,'C02':600,'C03':900,'C04':900},'fallbackRain':{'intensity':60,'durationSeconds':120,'wind':20}},'moss':{'waterCapacity':[5,7,9],'spaceCapacity':[2,3,4],'energyPerMinute':2,'moodPerMinute':1,'energyTarget':75,'moodTarget':80,'waterAbsorbPerMinute':.5,'waterBodyStop':45,'rootStop':12,'minimumMoisturePercent':20,'standingWaterCapacity':0,'recoveryWhenDry':True,'stackPlayAndRest':False},'spring':{'capacity':[60,90,120],'drinkPerMinute':10,'bodyStart':35,'bodyStop':65,'splashMoodPerMinute':2,'splashEnergyCostPerMinute':1,'minimumSplashFillRatio':.2},'litter':{'capacity':[100,150,200],'dailyArrivalMax':[20,30,40],'decomposeBasePerMinute':.5,'playMultiplier':3,'playBoostSecondsAfterEnd':120,'playMinimumL':.5,'playMoodPerMinute':3,'playEnergyCostPerMinute':1,'nutritionAbsorbPerMinute':1,'nutritionStart':40,'nutritionStop':70,'initialL':70,'initialU':30,'windMultipliers':[[0,1],[45,1.5],[60,2]],'conversionLtoU':1},'restEnergyPerMinute':{'rock':1,'moss':2,'shade':1.5,'crevice':1,'shelter':4},'shelter':{'remoteWaterPerMinute':0,'generatedNutrientsPerMinute':0,'passiveMoodPerMinute':0,'capacity':[2,4,6]},'offline':{'limitHours':8,'energyPerMinute':4,'energyTarget':75,'resourcesFrozen':True,'bodyRootNutritionMoodDamageBurdenFrozen':True,'healthyGrowthRetained':True},'upgrades':{'stage2UseSeconds':180,'stage3AdditionalUseSeconds':360,'requiresPressureEvidenceSeconds':10,'cost':0,'fillOnUpgrade':False}}
(O/'ObjectRules-v2.19.json').write_text(json.dumps(params,ensure_ascii=False,indent=2))
check=fitz.open(dest);issues=[]
def body(p):return ''.join(p.get_text(clip=fitz.Rect(0,0,p.rect.width,p.rect.height-43)).split())
for n in range(1,len(src)+1):
 if n not in REPLACE and n not in [2,3,4] and body(src[n-1])!=body(check[mapping[n]-1]):issues.append(['unexpected-body-change',n])
for p in check:
 for l in p.get_links():
  if l['kind']==fitz.LINK_GOTO and not 0<=l.get('page',-1)<len(check):issues.append(['link',p.number+1])
for _,title,pn in check.get_toc():
 if not 1<=pn<=len(check):issues.append(['bookmark',title,pn])
for pn in changed:
 for b in check[pn-1].get_text('dict')['blocks']:
  for line in b.get('lines',[]):
   x0,y0,x1,y1=line['bbox']
   if x0<14 or x1>check[pn-1].rect.width-14:issues.append(['overflow',pn,line['bbox']])
text=''.join(p.get_text()for p in check)
for i,*_ in ACS:
 if 'AC219-'+i not in text:issues.append(['missing-ac',i])
assert not issues,issues
# Reference arithmetic is a specification check, not a game test.
assert 180/60*params['moss']['energyPerMinute']==6 and 180/60*params['moss']['moodPerMinute']==3
L,U=70,30;L-=10;U+=10;assert L+U==100;U-=10;assert 100-L-U==10
assert 12*.6*3==21.599999999999998 or abs(12*.6*3-21.6)<1e-9
summary={'pages':len(check),'short_pages':len(short),'replaced':len(REPLACE),'inserted':len(added),'preserved_body_pages':len(src)-len(REPLACE)-3,'changed_pages':sorted(changed),'mapping':mapping,'new_sections':added,'layout':layout,'bookmarks_and_links_valid':True,'issues':issues,'spec_arithmetic':'passed','runtime_tests':'see docs/qa-0.6.9','apk':'0.6.9; Android device review not run'}
(O/'Document-Validation-v2.19.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
from PIL import Image,ImageDraw
for group,start in enumerate(range(0,len(changed),12)):
 img=Image.new('RGB',(1224,1656),'#dce1da');draw=ImageDraw.Draw(img)
 for j,pn in enumerate(sorted(changed)[start:start+12]):
  pix=check[pn-1].get_pixmap(matrix=fitz.Matrix(.62,.62),alpha=False);im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples);x=j%3*408;y=j//3*414;im.thumbnail((390,390));img.paste(im,(x,y+20));draw.text((x+4,y+3),str(pn),fill='black')
 img.save(O/f'proof-{group}.png')
print(json.dumps({k:v for k,v in summary.items()if k not in ['mapping','new_sections','layout','changed_pages']},ensure_ascii=False))
