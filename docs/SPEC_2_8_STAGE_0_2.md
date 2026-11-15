# 통합 명세 v2.8 → 앱 0.4.0 추적

기준: 여백의_숲_기능디자인음향_통합명세서_v2.8.docx, 읽은 저장 버전 10.
첨부 제작 기준: 여백의_숲_에셋ID연결_시안패키지_v2.8.zip (status: specification_and_keypose_drafts_not_runtime_delivery), 사운드 합성시안 v0.2.
원문 내용을 이번 구현 범위로 대체하지 않는다. 다음 작업은 통합 명세 최신본과 본 구현 상태를 함께 대조한다.

| 요구·참조 | 코드/에셋 | 검증 |
|---|---|---|
| SIM-01~03, DAT-02/05 | engine.js 1초 상태·마이그레이션·transaction, forest-app.js 안전 백업 | 결정적 재현, 장시간 물 수지, 이전 상태 보존, 실패 롤백 |
| WAT-01~05, PHY-01/02, HAB-02~06 | engine.js 구역 배수·빛·물 원장, spatial.js 이동/배치 | 경로, 생리·지형 물 보존, 배수 후 수지 |
| MOVE-01~08 | carry.js / spatial.js / 선택 카드 | 350ms 입력, 위치 미리보기, 물가 금지, 반경 1GU 보정, 5/30초 취소, 저장 실패 |
| LOC-01~05 / MOT-F01 | spatial.js gait/travel, scene.js pet | 상태별 속도, 뿌리 과습 이력, 실제 경로 보간, 성장 크기 독립 |
| INT-OB07, WAT-04 / OB-07 | 샘터 바깥 발 위치, drink 양수 전달 및 접점 | B65 정지, 실제 공급 차감, 허공 급수음 방지 |
| VFX-02~07 / ENV 시트 | scene.js terrain/ripples, engine.js film | 저장 M/W와 젖음, 별도 film, 물 없는 파문 금지, 비 종료 후 건조 |
| ODYN 기본 잎 흔들림 | scene.js terrain | 그늘 앵커 기준 회전; 물/경로/그늘 마스크는 변하지 않음 |
| AV 접점·116장 / 음향 v0.2 | audio.js, assets/audio/manifest.json | 중복 접점, 음소거/지연음 폐기, 동시 발음 제한, 파일 해시 |

## 실제 기본 음원 연결

| 파일 | 사용 조건 |
|---|---|
| BGM_DAY_FULL / BGM_NIGHT_FULL | 내부 게임 낮밤, 6초 전환 |
| AMB_FOREST_DAY / AMB_FOREST_NIGHT | 현재 낮밤 환경 |
| AMB_RAIN_LEAVES / AMB_WIND_LEAVES | 실제 비 / 바람 45 이상 |
| AMB_POST_RAIN_DROPS | 비가 그친 60초 이내, 젖은 지형 존재 |
| AMB_SPRING_WATER | 샘터 물 양수 |
| SFX_STEP_SOIL / LEAF / STONE / WOOD v01 | 실제 이동 중 현재 지형 발 접점 |
| SFX_WATER_DRINK_v01 | 실제 양수 급수 접점 |
| SFX_LEAF_BRUSH_v01 | 잎 정돈 중 3초 간격 접점 |
| SFX_LEAF_PICKUP / PUTDOWN v01 | 들기 시작 / 저장 성공한 착지 |
| SFX_UI_CLICK_v01 | 번들만 포함, 아직 미연결 |

단계 3 이후: 봉봉·넓이와 대표 협동/EC02·03 → 두리 정착·첫 경험 → 전체 종·기후·작은 생물 확장 → 실기기 품질 검증. 자동 테스트 수를 통합 명세의 전체 AC 완료 수로 환산하지 않는다.
