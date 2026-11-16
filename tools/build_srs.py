from pathlib import Path
import io,json,re,fitz
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from PIL import Image
W,H=612,792; root=Path(__file__).resolve().parents[1]; font=root/'app/src/main/assets/web/fonts/GowunDodum-Regular.ttf';pdfmetrics.registerFont(TTFont('K',str(font)))
style=ParagraphStyle('p',fontName='K',fontSize=11,leading=17,textColor=HexColor('#28362b'),wordWrap='CJK',spaceAfter=9)
small=ParagraphStyle('s',parent=style,fontSize=9,leading=14)
source=fitz.open(root/'docs/spec-source/Forest_SRS_2.8_Rev3.pdf'); groups=json.loads((root/'docs/spec-source/srs_groups.json').read_text());doc=fitz.open();records=[];starts={};items=[]
def generated(title,blocks,image=None,subtitle=''):
 b=io.BytesIO();c=canvas.Canvas(b,pagesize=(W,H));c.setFillColor(HexColor('#435a43'));c.setFont('K',21);c.drawString(50,730,title);y=698
 if subtitle:
  p=Paragraph(subtitle,small);_,h=p.wrap(512,100);p.drawOn(c,50,y-h);y-=h+18
 for head,text in blocks:
  if head:c.setFont('K',13);c.setFillColor(HexColor('#435a43'));c.drawString(50,y-13,head);y-=26
  p=Paragraph(text,style);_,h=p.wrap(512,700);p.drawOn(c,50,y-h);y-=h+15
 if image:
  im=Image.open(image);iw=min(512,(y-58)*im.width/im.height);ih=iw*im.height/im.width
  assert y-ih>48,(title,y,ih)
  c.drawImage(str(image),50+(512-iw)/2,y-ih,width=iw,height=ih,mask='auto')
 c.save();d=fitz.open(stream=b.getvalue(),filetype='pdf');return d

def append_new(d,group,kind):
 ix=len(doc);doc.insert_pdf(d);records.append((ix,group,kind,None));return ix

def append_old(idx,g,base=None):
 ix=len(doc);doc.insert_pdf(source,from_page=idx,to_page=idx,links=False,annots=False,final=False);p=doc[-1]
 p.add_redact_annot(fitz.Rect(0,0,W,73 if idx<18 else 39),fill=(1,1,1));p.add_redact_annot(fitz.Rect(0,738,W,H),fill=(1,1,1));p.apply_redactions(images=0,graphics=0)
 for link in source[idx].get_links():
  if link['kind']==fitz.LINK_URI and link.get('uri'):
   p.insert_link({'kind':fitz.LINK_URI,'from':link['from'],'uri':link['uri']})
 records.append((ix,g,'source',idx));items.append((ix,g,base))

def revision_block(page,begin,end=None):
 text=source[page-1].get_text();text=text.split(begin,1)[1]
 if end:text=text.split(end,1)[0]
 lines=text.strip().splitlines()
 return begin+' '+lines[0].strip(),re.sub(r'\s+',' ',' '.join(lines[1:])).strip()

# Split mixed revision pages by the area that owns the rule.
fragments={
 'D04':('샘터 유입과 음수의 시각 접점',[revision_block(3,'REV28-05','REV28-06')]),
 'A04':('샘터·음수·휴식 음향 조건',[revision_block(3,'REV28-06')]),
 'D03':('캐릭터 외형과 공통 크기',[('CHR-01  승인된 분리형 몸통 구조','2026-11-15 사용자가 Ridley_Intact_Body_Draft.gif의 완전한 몸통과 독립 팔다리 구조를 승인했다. 기존 0.4.4 복원 지시는 이 최신 승인으로 대체한다. 현재 및 향후 모든 캐릭터의 외형은 이 공통 구조를 따른다.'),revision_block(13,'CHR-02','OBJ-01')]),
 'S07':('장애물 충돌과 저장 복구',[revision_block(13,'OBJ-01','OBJ-02'),revision_block(13,'OBJ-03')]),
 'D05':('오브젝트 진입과 통과 모션',[revision_block(13,'OBJ-02','OBJ-03')]),
 'S06':('월드 탐색·확장·입력 기준',[revision_block(15,'WORLD-01','WORLD-02'),revision_block(15,'WORLD-02','CAM 유지'),revision_block(15,'CAM 유지','ART 유지'),revision_block(15,'WORLD-AC')]),
 'D07':('들기·통과 모션의 제작 범위',[revision_block(15,'ART 유지','WORLD-AC')])
}

# Reserve cover and three part contents pages; destinations are populated after arranging content.
for i in range(4):doc.new_page(width=W,height=H)
for g,part,title,pages,revs in groups:
 starts[g]=len(doc)
 if g=='S01':append_new(generated('기능 요구사항(SRS)',[
 ('문서 목적과 적용','여백의 숲의 기능 요구사항, 디자인 명세, 음향 명세를 세 영역으로 관리한다. 기능 영역은 상태·조건·전이·제약·수용 기준을 소유한다. 디자인은 화면·형태·모션·제작 규격을, 음향은 큐·접점·재생·믹스·파일을 소유한다.'),
 ('요구사항과 구현 상태','샘물 승인안과 새로 승인한 완전한 몸통·독립 팔다리 시안을 적용한다. 모든 현재·향후 캐릭터는 공통 모션 구조를 사용한다. 배포판 기준은 0.5.6이다. 이번 0.6.0-review는 2단계 대표 장면의 기능 검수 빌드다. 봉봉·넓이 시안은 승인 대기이며 실제 정원에 미승인 외형을 추가하지 않는다.'),
 ('참조와 변경 관리','본문 제목·상세 목차·책갈피를 S·D·A 영역별 번호로 통일한다. 요구사항 ID는 유지한다. 기존 문서의 참조 번호는 제목 아래의 참조 ID로만 남기며, 본문의 기존 D 계열 참조를 누르면 새 위치로 이동한다. 기존 개정 묶음은 해체해 각각 해당 카테고리에 배치했다.'),
 ('검수 원칙','사용자가 승인한 샘물과 Ridley_Intact_Body_Draft.gif의 구조를 적용한다. 이전 원화 복원 방식 및 몸통에서 팔다리를 잘라내는 방식은 최신 승인 구조로 대체한다. 잎 정리 동작을 멈추는 방식으로 팔 중복을 숨기지 않는다. Android 실기기 설치·터치·음향·장시간 성능은 별도 검수다.')]),g,'intro')
 if g=='S08':append_new(generated('현재 단계의 구현·회귀 검수',[
 ('STAGE-01  진행 단계와 판정','기준은 S08.04의 1~5단계다. 0.5.6의 1단계 기능 검수에서 2단계 대표 장면 구현으로 진입했다. 0.6.0-review는 기능 검수판이며 2단계 전체 완료·최종 외형 승인을 뜻하지 않는다.'),
 ('STAGE-02  구현한 기능','동일종을 포함한 최대5개체 편성, 대기 보존, 봉봉 빗물·기타·출처미상 V 분리, 실제 A04 급수, 넓이 차광·그늘 합집합·세 번째 친구20초 쉼을 구현한다. EC01은 같은 강수 회차·현재 돌돌이 쉼·연속20초 관찰을 검사한다.'),
 ('STAGE-03  검수 증거','기존77개와 신규14개를 합친91개 기능 검사를 통과했다. 기존 DOM 입력 및 별도 장면 검수 화면 검사도 수행한다. 신규 검사는 자원 보존·중복 전달 차단·중단/재시작·오염 백업 거부·최대5·대기 보존·EC01~03 실제 조건을 포함한다. 증거는 소스 docs/qa-0.6.0에 보관한다.'),
 ('STAGE-04  승인·제작 대기','봉봉·넓이 외형 시안을 제시했으며 승인 전이다. 새 종의 전용 파츠·A04/A12 최종 모션·접점 음향·5인 사용성·실기기 검수는 미완료다. 검수 화면의 도형은 판정 위치도이며 게임 에셋이 아니다. 공용 리들리 외형으로 종별 제작 완료를 대체하지 않는다.'),
 ('STAGE-05  배포와 보존','기존 정원·리들리 리그·승인한 샘물은 유지한다. 새 대표 장면은 설정의 별도 시험 정원에서 실행하고 실제 저장으로 합치지 않는다. 기존 V는 출처미상으로 이전한다. 방문·획득·정착은3단계, 전6종·4기후와 나머지 협동은4단계다.')]),g,'stage-audit')
 if g=='S07':append_new(generated('모든 캐릭터의 공통 모션 실행 계약',[
 ('RIG-F01  공통 실행 경로','현재 여섯 종과 향후 추가 종은 동일한 분리형 리그 렌더러를 사용한다. species에 따라 몸통을 잘라내는 별도 렌더 경로를 만들지 않는다. idle·walk·slow·hurry·run·groom·held·rest·drink·land·duck·step·avoid 상태가 공통 계약을 따른다.'),
 ('RIG-F02  독립된 상태','모션 계산은 표시 전용이다. 몸통·팔·다리의 위치나 회전이 생태 난수, 물량, 성장, 도감, 저장 데이터를 변경하지 않는다. 음향은 기존 실제 접점 사건으로만 발생한다.'),
 ('RIG-F03  수용 기준','모든 상태에서 몸통 1개·팔 2개·다리 2개이며 몸통의 불투명 내부가 보존되어야 한다. 최대 다리 회전에서도 뿌리가 몸통 내부에 남아야 한다. 좌우 반전과 성장 배율은 모든 부품에 함께 적용한다. 동작 줄이기는 정적 자세를 제공한다.'),
 ('RIG-F04  제작 경계','현재 코드는 공통 리들리 외형을 유지하며 전용 종별 그림을 완성했다고 표시하지 않는다. 종별 외형 추가는 D03의 불변 조건과 D07 제작 규격을 통과해야 한다.')]),g,'shared-motion-contract')
 if g=='D03':
  append_new(generated('모든 캐릭터의 공통 몸통·팔다리 규격',[
   ('REV28-02 / CHR-03 / RIG-01  완전한 몸통','몸통은 팔다리 그림과 구멍이 없는 하나의 완전한 레이어다. 어떤 팔다리 자세에서도 몸통 내부의 불투명 영역과 윤곽을 유지한다. 몸통에서 팔·다리를 도려내거나 움직일 때마다 빈자리를 메우는 구현을 금지한다. 승인한 시안이 현재 기준이며 이전 복원 지시보다 우선한다.'),
   ('CHR-04 / RIG-02  독립된 두 팔','팔은 몸통과 별도인 두 부품이다. 잎 정리는 기존 팔 하나가 이동해 들기 → 잎 접촉·정리 → 원위치 복귀한다. 몸통에 정적인 팔을 남기거나 손을 추가하지 않는다. 정리 동작은 4초 주기이며 동작 줄이기는 정적인 두 팔을 유지한다.'),
   ('CHR-05 / RIG-03  깊이 겹친 두 다리','다리는 몸통 안쪽까지 긴 캡슐형 부품으로 제작한다. 다리 → 완전한 몸통 → 잎·앞쪽 팔 순서로 합성한다. 다리 회전의 기준점은 몸통 내부에 고정하고 최대 동작에서도 뿌리가 몸통에 가려지게 한다. 걷기·달리기·들림·휴식·음수·착지·회피에도 동일 구조를 사용한다. 최종 승인된 Ridley_Shorter_Legs_Third_Draft.gif의 짧은 다리 비율을 적용한다.'),
   ('RIG-11  생활 모션·얼굴 회귀','몸통은 얼굴이 없는 완전 레이어로 유지하고 얼굴은 독립 레이어로 합성한다. CH-E01~06을 실제 상태에 연결한다. 잠자기는 rest의 감은 눈·입 생략·몸 호흡·낮은 자세·잎 내려앉음이며, 약0.8초 자세 전환 뒤 생활로 복귀한다. 움직임 줄이기에서도 감은 눈을 유지한다. 관리자 모드는 실제 기록을 바꾸지 않고6표정을 각각 확인한다.'),
   ('RIG-04  모든 종에 공통 적용','리들리·봉봉·넓이·보송·주렁·두리 및 향후 캐릭터가 공통 렌더러를 사용한다. 종별 그림·비율·모션 강도는 제작 규격 안에서 조절하되 완전한 몸통과 독립 팔다리 원칙을 바꾸지 않는다. 전용 그림이 없는 종은 현재 공용 그림을 사용하며 종별 에셋 제작 완료로 표시하지 않는다.')]),g,'new-rig-rules')
  append_new(generated('가림·접지와 크기 유지',[
   ('REV28-03  큰 잎 아래 휴식','INT-OB03 / D08.02 / AC-152·190과 연결한다. entry → rest → exit 접점을 사용하며 발 기준점은 실제 shade_mask 내부의 빈 rest 접점에 둔다. 바닥·접지 그림자 → 뒤 줄기·잎 → 캐릭터 → 앞 잎의 순서로 합성한다. 앞 잎은 머리 잎 일부를 가릴 수 있지만 얼굴은 읽혀야 한다.'),
   ('원근과 생태 제약','가림을 위해 몸을 임의 축소하거나 안전 접점을 벗어나게 하지 않는다. 공통 크기 2/3를 모든 성장 단계와 모션에 동일 적용한다. 줄기 충돌체와 안전 접점으로 관통을 막는다. 기능 차광 35%·중첩 70%와 자원 수치는 바꾸지 않는다. 낙수는 잎 끝으로 표현한다.'),
   ('접지·젖음·고임','VFX-01~08 / D08.02 / AC-161~170과 연결한다. 접지는 물체 하단의 부드러운 그림자, 젖음은 M·film 기반 흙빛 번짐으로 표현한다. 반복 단색 타원과 큰 잎 아래 원판을 금지한다. 고임은 W>0일 때만 불규칙 마스크 안에 표시하고 0이면 제거한다.'),
   ('RIG-05  모션 검수','좌우 방향과 13개 상태·24시점의 624개 렌더에서 몸통 불투명 픽셀의 보존을 확인한다. 모든 상태에서 몸통 1개·팔 2개·다리 2개를 그려야 한다. 성장 배율·들기·접점·동작 줄이기·저장 무변경을 함께 검사한다. 실기기 터치·장시간 성능은 별도 검수다.')]),g,'rig-occlusion')
  append_new(generated('승인 구조의 실제 게임 렌더',[
   ('RIG-06  시안과 적용 결과','Ridley_Intact_Body_Draft.gif의 구조를 승인 기준으로 사용한다. 아래는 0.5.6의 실제 게임 렌더다. 완전한 몸통, 승인된 짧은 다리, 잎 정리 중 팔 두 개, 복구한 잠자기와 표정을 함께 확인한다. 이전 잘라내기·부분 메우기 리그는 적용하지 않는다.')],root/'docs/spec-source/Ridley_0_5_6.png','사용자 승인: 완전한 몸통 + 독립 팔 2개 + 몸통 뒤의 긴 다리 2개.'),g,'motion-preview')
 if g=='D03':append_new(generated('봉봉·넓이 외형 승인 시안',[('ART-S2-01  승인 대기','2026-11-15 제작한 외형 검토 시안이다. SRS의 봉봉 3개 둥근 잎·둥근 저수엽, 넓이의 낮고 넓은 몸과 큰 코끼리귀 잎을 따른다. 사용자 승인 후 독립 파츠를 제작한다. 이 그림 자체를 잘라 움직이는 방식으로 적용하지 않는다.')],root/'docs/spec-source/Bonbon_Neolbi_Approval.png'),g,'stage2-art-pending')
 if g=='D04':
  append_new(generated('샘터 배치와 수면 규격',[
   ('SPR-01  독립 객체와 이동','돌·바닥·수면·유입·충돌·음수 접점을 하나의 월드 위치로 묶는다. 꾸미기에서 핸들 드래그 또는 방향 버튼으로 이동한다. 미리보기 → 검증 → 저장을 거치며 취소·저장 실패 시 원위치와 잔량을 유지한다.'),
   ('SPR-02  돌 안쪽 경계와 수위','원본 돌 안쪽을 따라 비대칭 폐곡선 마스크를 정의한다. 실제 수면은 이 마스크와 잔량별 수면의 교집합 안에서만 그린다. 돌 위 넘침·독립된 큰 타원·경계 불일치를 허용하지 않는다. 비움은 수면 제거, 절반은 낮고 작은 수면, 가득 참은 높은 수면으로 구분한다. 색과 투명도 변화만으로 잔량 차이를 대체하지 않는다. 유입 물줄기와 파문 접점도 현재 수면 높이를 따른다.'),
   ('SPR-03  상태 보존과 음향 연결','샘터 x .14~.86, y .18~.84, 다른 지형과 .15 이상 간격, 쉼터 접근 경로, 개체 점유를 검사한다. 이동은 물량·원장·도감·난수를 증가시키지 않는다. 실제 유입이 양수일 때 물줄기와 환경음을 연결한다. 음수 단발음은 실제 전달 접점에만 연결한다.'),
   ('시안 승인','왼쪽부터 비움·절반·가득 참. 사용자가 2026-11-15 이 시안을 승인했다. 0.5.6에 동일한 수면 마스크와 잔량 표현을 적용한다. 확대 및 이동 상태에서도 돌의 안쪽 경계와 수면이 함께 움직여야 한다.')],root/'docs/spec-source/Spring_Water_Review.png'),g,'spring-rules-preview')
 if g=='D05':append_new(generated('비와 객체 환경 반응',[
  ('RAIN-01  불규칙 강수','방울마다 시작 위치·낙하 속도·길이·굵기·투명도·바람 기울기·재진입 위치를 다르게 한다. 동일 간격·속도의 규칙 격자를 금지한다. 렌더 전용 결정적 해시를 사용하며 생태 난수와 물 원장은 변경하지 않는다.'),
  ('RAIN-02  밀도와 가림','기본 최대 밀도는 강도에 따라 28~78개, 동작 줄이기는 정적 8개다. 잎·쉼터 아래 구간의 비 관통을 막는다. 낮·밤·강풍·이동·확대를 함께 검수한다. 실제 Android 프레임 성능은 별도로 확인한다.'),
  ('영역 연결','날씨의 발생과 자원 계산은 S03, 화면 표현과 접점은 D05, 비·낙수·바람의 소리는 A02·A04에서 관리한다. 시각 효과가 실제 물을 생성하지 않는다.')]),g,'rain-rules')
 if g in fragments:
  title,blocks=fragments[g];append_new(generated(title,blocks),g,'categorized-revision')
 if g=='D07':append_new(generated('공통 캐릭터 에셋 제작 계약',[
 ('RIG-07  납품 레이어','body: 손·발·얼굴이 없는 완전한 몸통, face: 독립 얼굴, leaves: 독립 머리 잎, leg-left/leg-right: 몸통 내부까지 긴 다리, palm: 좌우 팔에 사용하는 손. 새 캐릭터도 동일 구조로 납품한다. 손 그림이 body에 남아 있거나 관절 자리가 투명하게 파인 에셋은 반려한다.'),
 ('RIG-08  공통 좌표','현재 정규화 캔버스는 1254×1254다. 다리 기준점은 (515,930), (795,930), 원본 다리 에셋은 98×220이며 표시 크기는 98×202.385다. 정지 시 몸통 밖 노출 길이는 최초 65px에서 47.385px로 줄였다(10%씩 세 차례, 누적 27.1% 축소). 위쪽 위치와 회전축은 유지하며 기준점 위로 45px를 겹친다. 몸통 하단은 약 y1040으로 다리 윗부분을 충분히 가린다. 새 외형도 같은 좌표 체계에 맞춰 모든 극한 포즈를 검사한다.'),
 ('RIG-09  제작과 실행 분리','승인 시안에서 body·face·leaves·좌우 다리·손을 독립 PNG로 미리 생성한다. 게임 프레임에서는 해당 레이어를 합성하며 원화에서 부위를 다시 잘라내거나 픽셀을 매번 복원하지 않는다. 공통 루틴을 캐릭터별로 복사해 분기하지 않는다.'),
 ('RIG-10  검수와 변경 관리','전체 몸통 마스크 보존, 뿌리 겹침, 팔 수, 좌우·성장·동작 줄이기를 검사한다. 승인된 시안과 실행 렌더를 함께 보관한다. 다른 종의 전용 그림이 준비되기 전에는 공용 에셋 사용 상태를 명시한다.')]),g,'rig-asset-contract')
 if g=='A01':
  append_new(generated('음향 명세 운영',[
   ('음향 영역의 범위','음악·환경음·효과음의 방향, 재생 조건, 믹스, 파일, 검수를 A01~A06에서 관리한다. 기존 사운드 기획서 v1.1의 고유 상세를 승계하며 이전 독립 음향 문서는 변경 이력으로 참조한다.'),
   ('공통 계약과 중복 방지','공통 사건·접점·중단·음량 계약은 AV-01~10, 환경 반응은 ODYN-01~08에서 정의한다. AQ-13~36은 AC-179~202의 이전 별칭이며 같은 검사를 중복 정의하지 않는다. 시각 모션의 규격은 디자인 영역을 참조한다.'),
   ('사운드 방향','작은 식물 친구들이 살아가는 숲의 거리감과 재질을 들려준다. 잎과 물의 움직임이 먼저 읽히고 짧은 선율이 만남과 발견을 기억하게 한다. 따뜻한 어쿠스틱 앰비언트를 기본으로 음악에 쉬는 구간을 둔다. 낮과 밤의 공기·약한 비·샘터·잎 스침을 따로 조절한다.'),
   ('사건의 일치','소리는 실제 행동과 자원 변화에 연결한다. 화면에 없는 생물이나 완료되지 않은 보상을 암시하지 않는다. 샘터 유입·음수·휴식 음향의 최신 조건은 A04에서 적용한다.'),
   ('읽는 순서','A01 방향·근거 → A02 음악·환경음·음색 → A03 상황별 효과음 → A04 사건·재생·믹스 → A05 큐·파일·제작 → A06 검수 순서로 읽는다.')]),g,'audio-intro')
 for rev in revs:
  if rev in [2,3,13,14,15]:continue
  append_old(rev-1,g)
 for p in pages:
  if p!=244:append_old(p+17,g,p)

 if g=='S03':append_new(generated('대표 장면의 출처·범위 검수',[
 ('S2-W01  물 출처와 실제 입력','V=rain+other+unknown을 항상 보존한다. 비는 지형별 실제 입력에서 차광 재분배를 먼저 한 뒤 남은 양의80% 이내, 개체당 분당6·V최대40으로 균등 분배하고 남는 몫을 재분배한다. 샘터는 분당4 이내의 실제 잔량을 차감하여 other로 기록한다.'),
 ('S2-W02  실제 전달과 발견','A04의 V→B는 초당2, 최대5초·총10, 제공 V예비10·수신 B65 이내다. 각 출처는 구성비대로 차감한다. session+step 거래를 한 번만 처리하며 상태와 함께 저장한다. rain 전달이 실제로 양수이고 관찰 중일 때만 EC02다.'),
 ('S2-E01  보습과 방문','같은 실제 강수 회차를 이끼와 바위 모두에 기록한다. 비가 그친 뒤600초 이내, 이끼M−바위M≥15, 돌돌이 현재 쉼과 유효 서식 조건·연속20초 관찰을 요구한다. 다른 탭·배치 회차 변경·휴면은 연속 관찰을 끊는다.'),
 ('S2-E03  넓어진 그늘','안전하고 정지한 넓이의 기능 범위는 반경0.13월드폭, 세로좌표 보정1.6이다. 차광은35%씩 곱셈 중첩·최대70%다. 둘의 합집합이 각각의 단일 면적보다 크고 세 번째 친구가 실제 범위 내 빈자리에서20초 쉬어야 EC03이다. 현재 합집합은0.0125격자 근사다. 최종 잎 파츠와 범위 정합은 외형 승인 뒤 검수한다.')]),g,'stage2-environment')
 if g=='S04':append_new(generated('복수 편성과 생활 상태 보존',[
 ('S2-PTY01  최대5와 개별 식별','리들리·봉봉·넓이, 동일종 복수를 고유 ID로 관리한다. 목부작도 활성5슬롯에 포함한다. 보유 친구만 정원/대기 전환하며 획득을 임의로 지급하지 않는다. 시험용 친구는 별도 검수 상태에만 생성한다.'),
 ('S2-PTY02  대기·교체·점유','대기는 수분·뿌리·저수·체력·영양·성장·성격을 보존하며 생태 갱신과 능력 효과에서 제외한다. 입장은 보행 가능·충돌 없는 빈자리에서만 허용한다. 샘터와 쉼터 접근점은 개체별 분산한다. 이동 중 다른 개체를 통과하지 않는다.'),
 ('S2-PTY03  중단 정산','대기·직접 이동·목부작·강풍·과습·배치 변경·종료·복원은 진행 중 교감을 해제한다. 이미 완료한 물 전달은 되돌리거나 재실행하지 않는다. 개인15초·같은 참가 조합120초 대기를 보존한다.')]),g,'stage2-roster')
 if g=='S05':append_new(generated('대표 협동의 실행과 중단',[
 ('S2-A04  물 나눔','봉봉의 여유와 수신자의 갈증을 확인하고 신호→접근→수락→전달→반응 순으로 실행한다. 접근은 경로/속도+5초의10~30초 제한을 둔다.3초 정체는 재탐색1회 뒤 다시 막히면 해제한다. 강풍·위험은 다음1초 처리에서 우선한다.'),
 ('S2-A12  그늘과 쉼','안전한 넓이 둘과 세 번째 쉬는 친구가 각자 한 세션에만 참여한다. 넓이는 제자리에서 펼치고 친구는 충돌 없는 실제 그늘 자리로 이동한다. 완전히 겹친 그늘·제3자 없음·숨긴 화면·중단된20초를 발견으로 처리하지 않는다.'),
 ('S2-OBS  검수 화면','설정→대표 장면 검수는 새 시험 상태를 만들고 실제 정원을 멈춘다. EC01/02/03 및 편성 시험,1초/10초 진행,1/5/10배,관찰 숨김,강풍,배치 회차 변경을 제공한다. EC02 시험의 시작 V는 실제160초 강수 계산으로 얻는다. 시험 도감/XP/개체는 실제 정원에 합치지 않는다.')]),g,'stage2-social')
 if g=='A04':append_new(generated('2단계 신규 접점의 음향 제작 상태',[
 ('S2-AUD01  현재 적용','기존17개 음원과 리들리의 음수·잎 정돈·잠자기/환경 재생을 유지한다. 별도 대표 장면 검수는 도형과 수치로 기능을 검사하며 새 음향을 재생하지 않는다.'),
 ('S2-AUD02  후속 연결','봉봉 물 전달은 실제 V→B가 확정된 session+step만 접점으로 사용한다. 넓이 펼침·접힘과 실제 쉼 진입은 최종 모션 이벤트에 연결한다. 승인 전 도형이나0전달량으로 효과음을 만들지 않는다. 외형·모션 승인 뒤 음량·중복·청취를 검수하며 아직 완료로 표기하지 않는다.')]),g,'stage2-audio')

# Assign current taxonomy headings after all category content is assembled.
topics=[];legacy={};topic_for_page={};counters={}
for ix,g,kind,src in records:
 page=doc[ix]; candidates=[]
 if src is None:
  candidates=[b for b in page.get_text('blocks') if 38<b[1]<85]
 elif src<18:
  candidates=[b for b in page.get_text('blocks') if 75<b[1]<120]
 else:
  for b in page.get_text('dict')['blocks']:
   lines=b.get('lines',[])
   text=' '.join(''.join(s['text'] for s in l['spans']) for l in lines).strip()
   if not lines or not 40<b['bbox'][1]<730:continue
   sizes=[s['size'] for l in lines for s in l['spans'] if s['text'].strip()]
   if sizes and max(sizes)>=11.8 and re.match(r'^(?:D\d{2}(?:\.\d{2})?|\d{1,3})\s',text):
    candidates.append((*b['bbox'],text))
 # A title can have a continuation section lower on the same page.
 for b in sorted(candidates,key=lambda z:z[1]):
  text=re.sub(r'\s+',' ',b[4]).strip()
  match=re.match(r'^(D\d{2}(?:\.\d{2})?|\d{1,3})\s+(.+)$',text)
  old=match[1] if match else None
  title=match[2] if match else text
  counters[g]=counters.get(g,0)+1; code=f'{g}.{counters[g]:02d}'
  topics.append((ix,g,code,title,old,tuple(b[:4])))
  if old:legacy[old]=(ix,code)
  if kind=='audio-intro':legacy['D09']=(ix,code)
  topic_for_page[ix]=(code,title)
 # Continuation pages inherit their parent topic rather than becoming table-header bookmarks.
 if ix not in topic_for_page:
  prior=next((x for x in reversed(topics) if x[1]==g),None)
  if prior:topic_for_page[ix]=(prior[2],prior[3])

for ix,g,code,title,old,box in topics:
 page=doc[ix]; rect=fitz.Rect(box)
 # Only redraw the title, preserving the source's tables, images and requirement rows.
 page.add_redact_annot(rect+(-.3,-.3,.3,.3),fill=(1,1,1));page.apply_redactions(images=0,graphics=0)
 page.insert_font(fontname='K',fontfile=str(font));f=fitz.Font(fontfile=str(font))
 label=f'{code}  {title}';size=min(18,(562-rect.x0)/max(1,f.text_length(label,fontsize=1)))
 baseline=rect.y0+size
 page.insert_text((rect.x0,baseline),label,fontname='K',fontsize=size,color=(.20,.29,.21))
 if old:
  # Compatibility label fits in the title's old lower margin.
  page.insert_text((rect.x0,baseline+11),f'기존 참조 ID: {old}',fontname='K',fontsize=6.5,color=(.43,.47,.42))

# Replace stale copied local links and attach old reference IDs to the new locations.
legacy_links=0
for ix,g,kind,src in records:
 page=doc[ix]
 for link in page.get_links():
  if link['kind']==fitz.LINK_GOTO:page.delete_link(link)
 words=page.get_text('words')
 for word in words:
  for match in re.finditer(r'D\d{2}(?:\.\d{2})?',word[4]):
   key=match[0]
   if key not in legacy:continue
   target,_=legacy[key]
   page.insert_link({'kind':fitz.LINK_GOTO,'from':fitz.Rect(word[:4]),'page':target})
   legacy_links+=1

# Consistent current navigation, with legacy item IDs retained inside the content.
lookup={g:(part,title) for g,part,title,_,_ in groups}
for i,g,kind,src in records:
 page=doc[i];page.insert_font(fontname='K',fontfile=str(font));part,title=lookup[g]
 page.insert_text((50,24),f'여백의 숲  v2.10  |  {part}  |  {g} {title}',fontname='K',fontsize=8,color=(.25,.34,.26))
 page.draw_line((50,33),(562,33),color=(.75,.79,.71),width=.5)
 section=topic_for_page.get(i,(g,''))[0]
 page.insert_text((50,760),f'RD-MOB-SRS-001  |  2026-11-15  |  {section}',fontname='K',fontsize=8,color=(.35,.40,.35));page.insert_text((535,760),str(i+1),fontname='K',fontsize=9,color=(.25,.34,.26))
cover=generated('여백의 숲',[
 ('기능 요구사항 · 디자인 · 음향 명세서','버전 2.10 / 2026-11-15<br/>문서번호 RD-MOB-SRS-001'),
 ('01  기능 요구사항(SRS)','S01~S09 · 플레이·상태·생태·입력·저장·검수'),
 ('02  디자인 명세','D01~D08 · BI·캐릭터·월드·모션·GUI·에셋'),
 ('03  음향 명세','A01~A06 · 음악·환경음·효과음·접점·믹스·QA'),
 ('이번 문서의 정리','세 영역의 목차 순서에 따라 본문을 재배치했다. 기존 기능·디자인·음향 본문 291쪽은 각 한 번만 배치하고, 앞쪽 개정 묶음의 고유 항목은 해당 카테고리로 옮겼다. 이전 표지·목차와 대체된 시각 시트는 제거했다.'),
 ('구현과 승인','안정판 0.5.6 · 기능 검수판 0.6.0-review / 샘터: 승인<br/>리들리 분리형 몸통 시안: 승인 / 모든 캐릭터 공통 모션 구조 적용<br/>봉봉·넓이 외형: 승인 대기 / Android 실기기 검수: 미완료')])
doc[0].show_pdf_page(doc[0].rect,cover,0)
partnames=['기능 요구사항(SRS)','디자인 명세','음향 명세']
for pi,part in enumerate(partnames,1):
 page=doc[pi];page.insert_font(fontname='K',fontfile=str(font));page.insert_text((50,64),f'목차 {pi:02d}  |  {part}',fontname='K',fontsize=23,color=(.25,.34,.26));y=112
 for g,pa,title,_,_ in groups:
  if pa!=part:continue
  target=starts[g];page.insert_text((54,y),f'{g}  {title}',fontname='K',fontsize=13,color=(.15,.22,.17));page.insert_text((525,y),str(target+1),fontname='K',fontsize=12,color=(.25,.34,.26));page.draw_line((54,y+13),(558,y+13),color=(.84,.86,.81),width=.4);page.insert_link({'kind':fitz.LINK_GOTO,'from':fitz.Rect(50,y-20,562,y+15),'page':target});y+=57
 page.insert_text((50,730),'항목을 누르면 해당 본문으로 이동합니다. 상세 항목은 PDF 책갈피에서 확인합니다.',fontname='K',fontsize=10,color=(.35,.4,.35))
# Bookmarks: three domains, categories, original topic headings.
toc=[[1,'문서 안내',1]]
for part in partnames:
 first=next(g for g,pa,*_ in groups if pa==part);toc.append([1,part,starts[first]+1])
 for g,pa,title,pages,revs in groups:
  if pa!=part:continue
  toc.append([2,f'{g} {title}',starts[g]+1])
  for ix,gg,code,title,old,box in topics:
   if gg==g:toc.append([3,f'{code} {title}',ix+1])
doc.set_toc(toc);doc.set_metadata({'title':'여백의 숲 - 기능 요구사항·디자인·음향 명세서 v2.10','author':'BTB','subject':'승인한 완전한 몸통·독립 팔다리를 모든 캐릭터의 공통 모션 기준으로 적용','keywords':'SRS, 디자인, 음향, 2.10, stage2-review'})
output=root/'docs/Forest_SRS_Design_Audio_v2.10.pdf';doc.save(output,garbage=4,deflate=True)
(root/'docs/qa-0.6.0/srs_restructure_audit.json').write_text(json.dumps({'pages':len(doc),'categories':{p:sum(g[1]==p for g in groups) for p in partnames},'source_pages_retained':291,'source_page_duplicates':0,'starts':{g:starts[g]+1 for g in starts},'bookmarks':len(toc),'legacy_reference_links':legacy_links,'asset_approval':{'spring':'approved','ridley_0_5_1':'rejected','ridley_intact_body':'approved','all_characters':'shared_intact_body_rig','bonbon_neolbi':'pending_user_approval'}},ensure_ascii=False,indent=2))
print(output,len(doc),'pages',len(toc),'bookmarks')
for n in [0,1,2,3,starts['D03'],starts['D03']+2,starts['D04'],starts['A01']]:doc[n].get_pixmap(matrix=fitz.Matrix(1.2,1.2)).save(root/f'docs/qa-0.6.0/srs_review_{n+1}.png')
