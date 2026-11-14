# 여백의 숲 · Android 개발 빌드 0.3.1

작은 리들리가 스스로 물을 찾고 쉬는 오프라인 정원 게임의 첫 개발 빌드입니다. SRS 2.5와 디자인 1.2를 기준으로 기존 Android 0.2.0의 설치·파일 저장 구조를 이어받았습니다. **전체 명세 구현 완료 또는 1단계 전체 검수 통과를 뜻하지 않습니다.**

## 실행

- Android 10(API 29) 이상. 최신 Android System WebView 권장.
- `Forest-of-Space-0.3.1.apk`를 휴대폰에서 열어 설치합니다.
- 기존 RidleyDesk Android 0.2.0과 같은 패키지(`com.ridleydesk.mobile`) 및 서명 인증서, versionCode 4입니다. 기존 앱 위에 업데이트하는 빌드입니다.
- 인터넷·로그인·위치·오버레이 권한 없이 모든 포함 기능이 동작합니다.
- 기존 모바일 저장을 읽으면 생활 수치는 이어받고, 다크리·성장·업무 등 전체 이전 데이터를 원본 보관합니다. 구버전과 새 XP의 의미가 다르므로 구 XP를 임의로 환산하지 않습니다. 설정에서 이전 원본을 내보낼 수 있습니다.
- PC 파일에 접근하거나 기록을 바꾸는 경로는 없습니다.

## 이번에 사용할 수 있는 것

1. 리들리의 1초 단위 자율 이동·급수·개인 휴식·잎 정돈, 몸 수분과 뿌리 물량의 독립 계산.
2. C01 정원의 맑음·비, 게임 시간 10분 낮/10분 밤. 첫 2분 뒤 안전한 약한 비.
3. 여섯 지형과 보호된 샘터. 다섯 이동 가능 지형의 드래그·방향 버튼 배치, 중첩/샘터 접근 검사, 실제 빛과 물 변화.
4. 게임·조경 전환, 건강 조건에 따른 기본 성장, 최초 관찰 급수 보너스, 목부작 휴식.
5. 최대 8시간 안전 휴식: 먼저 회복한 뒤 적격 시간만 성장. 일반 날씨·생태·방문·발견은 오프라인 정지.
6. 돌돌이의 조건부 방문·잠깐 쉼·떠남, 초기 EC01 관찰 기록. 섭식과 나머지 생물은 미구현.
7. 월드·친구 상세·도감·꾸미기·설정, 낮/밤 대비·움직임 축소·표시 설정.
8. 최대 5초 자동 저장, 중요 결과는 표시 전 저장, 원자 파일 저장, 최근 10개 안전 백업, 수동 가져오기·내보내기.

## 검증 상태

- `node --test tests/forest/*.test.cjs`: 27개 통과. 12시간 물 수지, 8시간 종료 상한, 복귀 중복 방지, 5개체 공급 예산, 저장 실패 롤백, 이전 원본 보존 등을 포함합니다.
- 0.3.0에서 브라우저 화면 검수를 수행했습니다. 0.3.1 화면 재검수는 실행 환경의 Chromium 소켓 제한으로 수행하지 못했습니다.
- Android API 35 자원/Java/Dex 컴파일, APK 서명·정렬, 이전 APK와 인증서 일치를 검사했습니다.
- **Android 실기기 설치·업데이트·파일 선택기·강제 종료·발열·성능은 미검증입니다.** 브라우저 검수는 이를 대체하지 않습니다.
- **CodeQL을 실행했으나 결과 등록이 차단됐습니다.** GitHub가 `Code scanning is not enabled for this repository` 오류를 반환했습니다. JavaScript/Python 작업은 SARIF 생성 후 업로드 단계에서 실패한 것을 확인했습니다. 전체 검사 통과나 취약점 0건으로 표시하지 않습니다. 자세한 실행 근거는 `docs/SECURITY_REVIEW.md`에 있습니다.

## 개발 이어가기

- 런타임: `app/src/main/assets/web/engine.js`(순수 상태 계산), `scene.js`(그림), `forest-app.js`(UI·저장).
- Android: `app/src/main/java/com/ridleydesk/mobile/MainActivity.java`.
- 기준 문서: `docs/specs/`.
- 요구 추적·남은 범위: `docs/IMPLEMENTATION_STATUS.md`.
- 자동 검사: `.github/workflows/tests.yml`, `.github/workflows/codeql.yml`.
- 원격 저장소: https://github.com/sia080808-lgtm/Forest-of-Space
- 0.3.1 소스·이미지·폰트·기준 명세서·검사 설정 소스와 관련 파일을 이 저장소에서 관리합니다. GitHub Actions에서 기능 검사와 CodeQL 실행 상태를 각각 확인합니다.

## 빌드

Android SDK Build Tools 35, Android API 35 android.jar, Java 21, Eclipse ECJ가 필요합니다. 서명 키와 비밀번호는 저장소·ZIP에 포함하지 않습니다. 업데이트 APK는 기존 키로 서명해야 합니다.

```bash
node --test tests/forest/*.test.cjs
python3 tools/build_apk.py \
  --build-tools /path/to/android-sdk/build-tools/35.0.0 \
  --android-jar /path/to/android-sdk/platforms/android-35/android.jar \
  --ecj /path/to/ecj.jar \
  --keystore /private/ridleydesk-personal.jks \
  --password-file /private/password.txt \
  --output build/Forest-of-Space-0.3.1.apk
```

Gradle 설정도 포함하지만 이번 빌드는 위 직접 SDK 경로로 검증했습니다. Gradle wrapper는 포함하지 않습니다.

앱 자산에는 생성 이미지와 번들 폰트를 사용합니다. 원본·검수 상태 및 폰트 라이선스는 `docs/ASSETS.md`와 `app/src/main/assets/web/fonts/`에 있습니다.

## 0.3.1 명칭 수정

- 상단 제목을 여백의 숲으로 통일하고 기본 개체명을 리들리로 수정했습니다. 안내·급수 이벤트는 현재 별명을 사용합니다.
- 기존 기본명 새싹이는 진행 기록을 유지한 채 읽을 때 리들리로 전환합니다. 과거 사용자가 직접 새싹이로 지었는지는 구분할 데이터가 없어 같은 전환이 적용됩니다. 그 외 별명은 유지되며 이번 버전부터 직접 지정한 별명을 표시해 보존합니다.
- 행동별 전용 애니메이션은 이번 수정 범위에 포함하지 않았습니다.
