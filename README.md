> 현재 앱: 0.4.1. 렌더링·음향 수정 사항과 이전 설명을 대체하는 범위는 [FIXES_0_4_1.md](docs/FIXES_0_4_1.md)를 참고하세요. 자동 검사 44개 통과.

# 여백의 숲 · Android 0.4.0

통합 명세 v2.8의 0~2단계 첫 적용분입니다. 기존 리들리와 생활 기록을 이어서, 직접 옮기기·환경 변화·기본 모션과 소리를 추가했습니다.

- 리들리를 길게 누르면 들어 옮길 수 있습니다. 선택 카드의 **옮기기**를 눌러 원하는 자리를 선택해도 됩니다. 취소하거나 저장이 실패하면 원래 자리를 유지합니다.
- 물가·바위를 피해 이동하며 갈증/피로/강풍에 따라 속도가 달라집니다. 급수·휴식·잎 정돈의 기본 동작을 구분합니다.
- 비가 오면 표면 물기와 지형 젖음이 늘고, 그친 뒤 배수·증발에 따라 서서히 마릅니다. 물이 있는 곳에서만 파문이 생깁니다.
- 낮/밤 음악·비·바람·샘물 및 기본 행동 효과음이 들어 있습니다. 설정에서 전체/음악/환경/효과음의 음량을 조절합니다.
- 기본 리들리, 지형 배치, 성장, 돌돌이 방문, 오프라인 안전 휴식, 백업 기능은 유지합니다. 새 종·협동·전체 기후는 후속 단계입니다.

## 업데이트 설치

패키지는 `com.ridleydesk.mobile`, versionCode는 5이며 기존 0.3.1과 같은 인증서로 서명합니다. 기존 앱을 지우지 않고 APK로 업데이트하는 방식입니다. 설치 전 설정에서 백업을 내보내 두면 기록을 별도로 보관할 수 있습니다. 실제 Android 기기에서의 업데이트 설치는 미검증입니다.

## 기준과 구현 범위

- 현재 기준: `여백의_숲_기능디자인음향_통합명세서_v2.8.docx`.
- 요구/소리 연결: [SPEC_2_8_STAGE_0_2.md](docs/SPEC_2_8_STAGE_0_2.md).
- 구현/부분 구현/후속 범위: [IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md).
- `docs/specs/`의 SRS 2.5/디자인 1.2는 이전 참고본입니다. 최신 통합 명세보다 우선하지 않습니다.
- 전체 2.8 기능, 완성 리그, 34개 전체 음향 큐의 적용을 완료한 버전은 아닙니다.

## 검사

```bash
npm ci --ignore-scripts
npm test
npm run test:ui
```

40개 기능 검사와 DOM 이벤트 연결 검사를 수행했습니다. Canvas 렌더 코드의 이미지도 확인했습니다. Chromium 실행 환경 오류로 전체 브라우저 화면 검수는 수행하지 못했습니다. Android 실기기·기기 음향 청취·성능 검사는 별도입니다. CodeQL의 기존 결과 등록 제한과 이번 실행 상태는 기능 검사와 구분합니다.

## 코드와 빌드

- `engine.js`: 1초 생태/자원 계산, 상태 이관·검증.
- `spatial.js`: 경로·배치 검사와 이동 속도.
- `scene.js`: 렌더링·모션·젖음·파문.
- `carry.js`: 길게 누르기·끌기·위치 선택·취소.
- `audio.js`: 음원·접점·믹싱·음량.
- `forest-app.js`: 화면·저장·Android 연결.

Java 21, Android Build Tools 35.0.0, API 35, Eclipse ECJ 3.39.0으로 직접 빌드합니다. 서명 키·비밀번호는 저장소 및 소스 ZIP에 포함하지 않습니다.

```bash
python3 tools/build_apk.py \
  --build-tools /path/to/android-sdk/build-tools/35.0.0 \
  --android-jar /path/to/android-sdk/platforms/android-35/android.jar \
  --ecj /path/to/ecj.jar \
  --keystore /private/ridleydesk-personal.jks \
  --password-file /private/password.txt \
  --output build/Forest-of-Space-0.4.0.apk
```

앱은 인터넷 권한 없이 모든 그림·글꼴·음원을 내부에서 읽습니다. 에셋 제작 상태와 라이선스는 [ASSETS.md](docs/ASSETS.md)를 참고하세요.
