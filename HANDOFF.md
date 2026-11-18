# APK0.6.14 · 엘리시, 기존 봉봉 대체 (SRS v2.23 변경안)

- 기존 봉봉의 몸통과 세로 눈을 보존하며, 생식엽 두 장+둥근 영양엽 한 장을 별도 렌더 에셋으로 적용.
- 사용자가 보는 이름은 '엘리시' / *Platycerium ellisii*. 과거 저장 호환 때문에 내부 `bonbon` ID, 개체 ID, 별명, 성장/도감 기록은 보존.
- 물 나눔(A04)과 빗물 저장은 새 엘리시에서 비활성. 기존 자원 보존. 슈퍼범은 추후 별도 종으로 개발.
- '잎틈 정원'은 현실 조건 기반의 환경 보조: 건강한 엘리시+습윤 이끼+마른 바위틈+적당한 습도/거리일 때만 돌돌이 후속 재방문 확률이 30→45%. 신규 생물 소환 없음.
- 기존 범위·물 원장·5개체 제한·쉼터 규칙 유지. SRS 초안 `docs/Forest-Ellisii-SRS-v2.23-DRAFT.md`. 422쪽 통합 PDF는 아직 v2.22.
- 브랜치 자동 검사: 기능/DOM UI 205/205 및 CodeQL 성공 (변경 전, 후속 버전 메타데이터는 재검증 필요).
- 실제 Android APK 서명, 업데이트 설치, WebView 시각/성능은 아직 미검증. 자동 Actions 파이프라인에서 후속 처리.
- QA: 원본 봉봉 몸체와 새로운 세 잎의 위치/표정 겹침, 편성/초상/세이브 이전, 특수 스킬 조건 검수.

---

# 여백의 숲 — 공통 인수인계

기록일: 2026-11-17 (Asia/Seoul). 작성: ChatGPT.

## 연결 상태

| 항목 | 상태 |
|---|---|
| 공유 저장소 | `sia080808-lgtm/Forest-of-Space` (비공개) |
| 공유 파일 | `AGENTS.md`, `CLAUDE.md`, `AI_COLLABORATION.md`, `HANDOFF.md` |
| ChatGPT GitHub 연결 | 저장소 읽기 및 push 권한 확인 |
| Claude 계정/저장소 접근 | 로그인 및 Git 경로로 이 저장소의 원격 main 읽기 확인 |
| 공통 기록 대조 | 완료 — 아래 확인 스냅샷의 전체 커밋과 HANDOFF.md 해시 일치 |
| 진행 중 제품 작업 | `ELLISII-0.6.18-20261117` (Claude Code) — 엘리시를 승인 원화 그대로 |

## 점검한 제품 기준선

- 저장소: `sia080808-lgtm/Forest-of-Space`
- 점검 브랜치: `main`
- 연결 문서 추가 전 제품 기준 커밋: `6592fd8e6500865b834523ea9a8c1fa6f82cee3b`
- 확인한 버전: APK 0.6.11 / SRS 2.21 / Android versionCode 28
- 다음 세션은 실제 최신 원격 HEAD 및 진행 중 브랜치를 다시 확인한다. 이 스냅샷을 무조건 최신 버전으로 간주하지 않는다.

### 근거와 주의 사항

- `package.json`, `docs/Forest-0.6.11-Release.md`, `docs/IMPLEMENTATION_STATUS.md`, `docs/qa-0.6.11`, `docs/planning-v2.21`을 확인한다.
- 비 시인성 및 물장구 급수 0.6.11 검증은 기존 기록이다. 이번 설정에서 다시 실행하지 않았다.
- Android 실기기 설치·프레임 성능·터치·큰 글자·청음·실제 WebView 화면은 기존 기록에서도 미검수다. native Canvas/DOM 결과와 구분한다.
- Android 패키지·업데이트 서명·저장 데이터 호환성과 캐릭터 몸통/팔다리 레이어 기준을 유지한다.
- 기존 AGENTS.md의 과거 GitHub 중단 문구는 이력으로 보존한다. 현재 사용자는 이 개인 저장소를 통한 공통 작업 기록 구성을 요청했다. 이번 작업은 해당 문서 설정 범위이며 추가 권한·공개 범위·배포 변경을 승인하는 문서가 아니다.
- `docs/SECURITY_REVIEW.md`의 보안 검사 제한을 유지한다. workflow 존재만으로 CodeQL 통과를 주장하지 않는다.

### 미완료 / 후속 확인

- 선택 링 발광·발 아래 깊이: APK0.6.12/SRS v2.22로 main 병합 완료. 기존 키 서명 APK 빌드 완료(`APK-0.6.12-20261117`). GitHub Releases 업로드·실기기 확인은 미완료.
- CI 의존성 `buffer-image-size@0.6.6`: npm 레지스트리에서 삭제(404, 현재 최신 0.6.4) 확인. `SEL-RING-20261117`에서 lock을 0.6.4로 고침. PR #7의 GitHub Actions `simulation` 통과로 확인.

## 현재 작업 / 다음 순서

- 최신 작업: `ELLISII-0.6.18-20261117` — 사용자 제공 원화로 엘리시 레이어 제작, 팔 없음(결정 변경). 다음: 패치 5(낙엽 섹터·바닥 L 게이트), 6(생물).
- 최신 작업: `SHELTER3-0.6.17-20261117` — 기본 쉼터 3명(12포인트+인원 상한), 엘레판 좌석 배정. 다음: 패치 4(엘리시 리깅·에셋, 팔 유지 결정), 5(낙엽 섹터·바닥 L 게이트), 6(생물).
- 최신 작업: `PATCH-0.6.16-20261117` — 이슈 #15 검토의 패치 1(엘리시 V 잔재·초상화)·2(0.6.15 길찾기 성능 회귀). 패치 3~6(쉼터 3명, 엘리시 리깅, 낙엽 섹터, 생물)은 사용자 결정 3건 후 진행.
- 최신 작업: `STONE-0.6.15-20261117` — 0.6.14(엘리시) 위에 햇살 바위 위 휴식·바위/바위틈 관통 수정, 0.6.15/versionCode32. 서명 APK·실기기 미완료.
- 최신 작업: `HOTFIX-0.6.13-20261117` — 0.6.12 APK 실행 직후 종료(대체 dx 빌드의 람다 미변환) 수정, 0.6.13/versionCode30. 서명은 기존 키 필요. 0.6.12 APK는 배포 중지 권장.
- 이전 작업: `REL-0.6.12-20261117` (Claude Code) — 선택 링 발광·발 아래, APK0.6.12/versionCode29, SRS v2.22. PR #7로 main 병합 완료, 기존 키 서명 APK 빌드 완료. 남은 일: GitHub Releases v0.6.12 업로드, 실기기 업데이트 설치 확인. 상세는 작업 이력의 해당 항목.

- 이전 작업 ID: `COLLAB-VERIFY-20261117`
- 요청: ChatGPT와 Claude가 같은 GitHub 코드와 인수인계 기록을 읽고 이어서 작업하도록 설정.
- 이번 변경: 공통 지침과 Claude import 구성 후 실제 공유 문서 읽기를 확인하고 결과를 기록. 기존 제품 코드와 과거 검증 기록은 보존.
- 이번 검증 범위: Claude의 실제 원격 main 조회, 공통 파일 읽기, 전체 커밋과 HANDOFF.md 원문 해시 대조. 제품 기능 테스트·실기기·운영 배포는 수행하지 않음.
- 다음 작업 시작 시: 최신 원격 main과 진행 중 브랜치를 다시 조회하고 `CLAUDE.md`·`AGENTS.md`·`AI_COLLABORATION.md`·이 파일을 읽는다. 작업 종료 시 브랜치·전체 커밋·수정 내용·실제 검증·남은 일을 기록한다.
- 공통 저장소와 저장한 인수인계 기록을 통해 이어서 작업한다. 전체 채팅 자동 동기화나 상호 자동 실행은 설정하지 않았다. 제품 코드 수정은 해당 후속 요청 범위에서 진행한다.

## 연결 점검 기록

- 대조 기록 시각: 2026-11-17 14:01 KST (Asia/Seoul).
- Claude 확인 세션: [저장소 연결 확인](https://claude.ai/code/session_01AkSeboG7im99yEedhsTyx9).
- Claude가 읽은 저장소: `sia080808-lgtm/Forest-of-Space`.
- Claude 세션 작업 브랜치: `claude/affectionate-faraday-sg1wlb`. 읽은 원격 기준: `origin/main`.
- 확인 시점의 로컬 HEAD / 원격 main 전체 커밋: `011e83d08e3c0ce778efc419737630b9c2918d9d`.
- Claude가 읽은 공유 파일: `AGENTS.md`, `CLAUDE.md`, `AI_COLLABORATION.md`, `HANDOFF.md`.
- `CLAUDE.md`에서 `@AGENTS.md`, `@AI_COLLABORATION.md`, `@HANDOFF.md` 참조를 확인했다.
- 확인 스냅샷의 HANDOFF.md SHA-256: `328eff8f768923cf378adb44dbf79bf020140632a7a3a79a095d0879d81dd95b`.
- Claude는 `git fetch origin main`, `git rev-parse origin/main`, `git ls-remote origin refs/heads/main`의 일치를 보고하고, `git show origin/main:HANDOFF.md | sha256sum`으로 원문 해시를 산출했다.
- ChatGPT는 GitHub에서 읽은 같은 커밋의 원문으로 계산한 해시와 위 값을 대조했고 일치를 확인했다.
- 이 커밋과 해시는 본 확인 기록을 추가하기 전 스냅샷이다. 기록 추가 후 새 커밋/파일 해시가 생성되므로 다음 작업에서는 최신 원격을 다시 읽는다.
- 범위: Claude Git 경로의 실제 읽기를 확인했다. Claude의 별도 GitHub MCP 서버 한 곳은 proxy 403으로 실패해 이번 점검에 사용하지 않았다. 해당 MCP 경로나 Claude push 권한까지 검증한 결과는 아니다.
- 읽기 확인 세션에서는 파일 수정·commit·push·PR·제품 검사·배포를 수행하지 않았다. 이 확인 기록은 ChatGPT가 별도로 저장한다.
- 별도 Claude 세션(`claude/festive-curie-mjk5mw`)의 같은 날 확인 기록:
  - Claude 확인 시각: 2026-11-17 (Asia/Seoul), Claude Code 원격 세션
  - Claude가 읽은 저장소 / 브랜치 / 전체 커밋: `sia080808-lgtm/Forest-of-Space` / 작업 브랜치 `claude/festive-curie-mjk5mw` / `011e83d08e3c0ce778efc419737630b9c2918d9d` (확인 시점 `origin/main`과 동일)
  - Claude가 읽은 공유 파일: `CLAUDE.md`, `AGENTS.md`, `AI_COLLABORATION.md`, `HANDOFF.md` (CLAUDE.md import로 로드). `package.json` 버전 0.6.11 확인

## 작업 이력

### COLLAB-SETUP-20261117 — 공유 규칙 준비

- 담당: ChatGPT.
- 코드 수정: 없음.
- 테스트: 문서 및 연결 구성 확인에 한정; 제품 회귀를 이번에 재실행했다고 주장하지 않음.
- 배포: 없음. 앱 버전 증가 없음.
- 남은 일: Claude 인증 및 실제 공유 문서 읽기 확인.

### COLLAB-CHECK-CLAUDE-20261117 — Claude 연결 확인

- 담당: Claude Code. 요청: 작업공간 연결 확인. 제품 코드 수정 없음.
- 기준 커밋: `011e83d08e3c0ce778efc419737630b9c2918d9d` (main). 브랜치 `claude/festive-curie-mjk5mw`에 이 기록만 추가.
- 검증: git fetch/rev-parse로 원격 상태 확인, 공유 문서 4종 읽기. 제품 테스트·실기기·배포는 수행하지 않음.
- 참고: 이 세션의 GitHub 플러그인 MCP 한 곳은 프록시 403으로 연결 실패했으나 git fetch/push 경로는 별도.
- 다음: ChatGPT 세션이 이 기록을 재조회해 양방향 확인 완료로 표시. 대기 목록(선택 링 발광·발 아래 깊이, CI `buffer-image-size` 실패 확인)은 별도 요청 시 진행.

### SEL-RING-20261117 — 선택 링 발광·발 아래 배치

- 담당: Claude Code. 요청: 사용자 "진행"(대기 목록의 선택 링 작업). 기준 커밋 `fcc95f06818b5d5bcf86f57fd3382edd68e83e40`, 브랜치 `claude/festive-curie-mjk5mw`.
- `app/src/main/assets/web/scene.js`: 조명 합성 뒤 화면 맨 위에 그리던 링(1.5px 단색)을 제거. `selectionRing()`을 월드 패스에서 선택 캐릭터 몸통 직전에 그려 발 아래에 놓이고 몸에 가려지며 공통 월드 조명을 받음. (사용자 요청으로 면 채움 제거, 선 굵기 1/3) 3겹 금빛 광채+밝은 중심선+옅은 어두운 외곽선. 크기는 `petSize` 비례(엘레판1.5배). 밤 밝기 하한0.58 보정(최대1.6배). 동작 줄이기 시 맥동 정지. 드래그 중(carry)에는 표시 안 함. 상태·난수·저장 변경 없음.
- `package-lock.json`: 레지스트리에서 사라진 `buffer-image-size@0.6.6` → `0.6.4`(happy-dom 21.0.4 요구 `^0.6.4`). `npm ci` 성공.
- `tools/selection-ring-review.cjs` + `docs/qa-selection-ring/`(낮/밤·리들리/엘레판·비선택 비교·보드·verification.json).
- 검증(로컬 Linux, Node): `npm test` 206/206 통과, `npm run test:ui` PASS, 검수 스크립트에서 렌더 전후 state 동일·동작 줄이기 정적 프레임 동일. 실제 렌더는 scene.js + @napi-rs/canvas이며 Android WebView·실기기·터치·성능은 미검수.
- 미완료: APK 버전(0.6.12/versionCode29)·릴리스 문서·SRS 연결·APK 빌드, GitHub Actions 재실행 확인, 쉼터 내부 등 가림 상황의 추가 화면 검수.
- 다음: 사용자 실화면 확인 후 버전 증가·APK 빌드 여부 결정.

### REL-0.6.12-20261117 — APK0.6.12 · SRS v2.22 선택 링

- 담당: Claude Code. 요청: 사용자 "버전 올리고 진행, SRS도 해당 내용 업데이트". 중간 요청: 면 제거, 선 굵기1/3, 밤에는 더 빛나게.
- 브랜치 `claude/festive-curie-mjk5mw` (main 미병합, PR 없음).
- 코드: `scene.js` 면 채움 제거·선 굵기1/3, `ringGlow()`로 조명 뒤 밤 앞쪽 반원 발광 추가. 버전 0.6.12/versionCode29(`build.gradle`·`AndroidManifest.xml`·`engine.js` VERSION·`package.json`·`tests/forest/package.test.cjs`). 저장 스키마·RULES 불변.
- 테스트: `tests/forest/selection-ring222.test.cjs`(3) 추가. `npm test` 209/209, `npm run test:ui` PASS, `tools/selection-ring-review.cjs` → `docs/qa-0.6.12/runtime`. 로그 `docs/qa-0.6.12/*.log`.
- SRS: `docs/Forest_SRS_Design_Audio_v2.22.pdf`(v2.21 기반, 1·5·130·280·332·344쪽 교체, 나머지416쪽 본문 동일·링크/북마크 검증), 원본 `docs/planning-v2.22/`(content.py·build.py·Revision/Acceptance/Validation·교체 페이지 PNG). 오브젝트 규칙 별책은 변경 없어 v2.21 유지.
- 문서: `docs/Forest-0.6.12-Release.md`, `docs/release.json`, README/AGENTS/IMPLEMENTATION_STATUS 상단 항목.
- 미완료/차단: 서명 APK 빌드 안 함 — 이 환경에 Android SDK와 기존 업데이트 키가 없음(키는 Git 금지). 키 보관 환경에서 `tools/build_apk.py`로 빌드 후 SHA256·인증서 일치 기록 필요. Android 실기기·WebView·터치·야간 가독성·성능 미검수. GitHub Actions 재실행 미확인. main 병합/PR 미정.
- 다음: (1) 키 보관 환경에서 APK0.6.12 빌드·서명 검증, (2) 실기기 확인, (3) 사용자 결정 시 PR/main 병합.
### COLLAB-VERIFY-20261117 — 실제 공유 문서 읽기 확인

- 담당: Claude 읽기 확인, ChatGPT 원문 대조 및 확인 기록 저장.
- 결과: 네 개인 저장소에서 동일한 main 커밋과 HANDOFF.md SHA-256을 확인했다. 저장소별 상세 값은 위 연결 점검 기록에 있다.
- 변경: 연결 상태 및 재개 절차 갱신. 이전 COLLAB-SETUP 기록의 남은 일은 당시 상태이며 인증/실제 읽기 확인은 이번 기록으로 완료했다.
- 제품 코드·앱 버전 변경 없음. 제품 회귀·실기기 검사·배포는 수행하지 않았다.
- 후속: 다음 작업에서 최신 원격과 작업 브랜치를 확인하고 승인된 제품 작업을 이어간다.

### MERGE-0.6.12-20261117 — PR #7 main 병합

- 담당: Claude Code. 사용자 승인("올리고 메인 병합 승인").
- PR: https://github.com/sia080808-lgtm/Forest-of-Space/pull/7 — head `9e18a682a52590b1949d2f9ad765c75ada219eae`, merge 커밋 `97709d6ec06b1dd50c10e8a9e379712728035a37`.
- CI(head 기준): `simulation` success, CodeQL `Analyze` javascript-typescript/python/java-kotlin success, `CodeQL` success. 사용자가 저장소를 공개로 전환한 뒤 코드 스캐닝 등록이 작동. CodeQL 신규 경고2건(미사용 import)은 같은 PR에서 수정. 기록: `docs/SECURITY_REVIEW.md`.
- 공개 전환 전 점검: Git 파일·전체 이력에 키/인증서/`.env` 없음.
- 미완료: 서명 APK0.6.12 빌드(키 보관 환경), Android 실기기 확인.

### APK-0.6.12-20261117 — 기존 키 서명 APK 빌드

- 담당: Claude Code. 요청: 사용자가 첨부한 서명 키 백업으로 최신 main 기준 v0.6.12 APK 빌드·인증서 검증·Releases 업로드.
- 기준: main `8136734b9ade6fe7a70972930213dc5d7bec9012`. 결과 `Forest-of-Space-0.6.12.apk` 38,487,784 bytes, SHA-256 `c11bebfb98256621e476bc8959ff6314626580121d19655b06fee6bb1b52f47c`.
- 서명: alias `ridleydesk-personal`, APK Signature Scheme v3. 인증서 SHA-256 `f807cfca20e7af73b37ebd6deaabbf1b8c96975828baa4b5906b493280587e3d` — Releases v0.6.11 APK에서 직접 읽은 값과 일치. `apksigner verify`·`zipalign -c -p 4` 통과. 패키지 `com.ridleydesk.mobile`, versionCode29/0.6.12, min29/target35.
- v0.6.11 APK와 비교: 엔트리 116개 동일, 에셋 바이트 동일. 차이는 `assets/web/scene.js`·`engine.js`·`AndroidManifest.xml`·재생성된 `classes.dex`·`resources.arsc`.
- 빌드 도구: dl.google.com 차단으로 공식 build-tools35/d8 대신 Ubuntu `aapt2`(framework-res API33/34)·`dalvik-exchange`(dx)·`zipalign`·`apksigner`, Maven Central ECJ 3.46.100·Robolectric android-all 15를 사용. compileSdk 표기33. `tools/build_apk.py`는 수정하지 않음.
- 비밀 관리: 키·비밀번호는 저장소 밖 임시 폴더에서만 사용, 비밀번호는 파일로만 전달. 사용 후 압축 해제본과 업로드 ZIP 사본을 shred 삭제. 저장소·커밋·PR·Actions·APK에 포함하지 않음.
- 미완료: GitHub Releases v0.6.12 업로드(이 세션에 릴리스 생성 API 없음 — APK는 사용자에게 파일로 전달), Android 실기기 설치·v0.6.11 위 업데이트·저장 유지·화면/성능 미검증.
- 다음: Releases에 APK 업로드 후 서버 SHA-256 대조, 실기기에서 업데이트 설치 확인.

### HOTFIX-0.6.13-20261117 — 0.6.12 실행 직후 종료 수정

- 담당: Claude Code. 요청: 사용자 "v0.6.12 앱이 계속 꺼짐, 원인 분석 및 해결".
- 원인: `APK-0.6.12-20261117` 빌드에 쓴 Ubuntu dx가 람다를 디슈가링하지 않아 `classes.dex`에 `LambdaMetafactory` invokedynamic이 남음(0.6.11 d8 빌드는 `ExternalSyntheticLambda`). `MainActivity.onCreate`의 창 여백 람다가 시작 직후 실행 → ART 부트스트랩 실패로 종료. 기기 로그 미확인, dex 비교로 판정. 빌드 담당(Claude)의 도구 선택 오류.
- 수정: `MainActivity.java` 람다/메서드 참조10곳 → 익명 클래스(동작 동일). 버전0.6.13/versionCode30. `tests/forest/android-shell-dex.test.cjs`, `tools/build_apk_alt.sh`(dex에 LambdaMetafactory 있으면 실패) 추가. 문서 README/AGENTS/IMPLEMENTATION_STATUS/`docs/Forest-0.6.13-Release.md`/`docs/release.json`.
- 검증: `npm test` 210/210, `npm run test:ui` PASS. `tools/build_apk_alt.sh`로 서명 전 정렬 APK 빌드: dex `java/lang/invoke` 0, 익명 클래스 확인, versionCode30. 실기기 미검증.
- 서명: 사용자가 키 백업을 재제공. `tools/build_apk_alt.sh`로 d9c6123 기준 빌드·서명. `Forest-of-Space-0.6.13.apk` 38,487,784 bytes, SHA-256 `2906c9cccb84d613864bed2586ed6888e2d82d782ff7ac492d4d4b96be0dad45`, 인증서 SHA-256 `f807cfca…7e3d`(0.6.11과 동일), v3, `apksigner verify`·`zipalign -c` 통과, dex `java/lang/invoke` 0. 키 사본 shred 삭제.
- 미완료: Releases v0.6.13 수동 업로드(사용자), 실기기 실행/업데이트/저장 유지 확인. Releases에 0.6.12 APK를 올렸다면 내리거나 결함 표시 필요.

### STONE-0.6.15-20261117 — 햇살 바위 위 휴식·바위/바위틈 관통 수정

- 담당: Claude Code. 요청: 사용자 "햇살바위에서 쉴 때 바위 위가 아니라 근처에서 쉼", "바위틈 근처를 지날 때 관통".
- 기준: main `b7cd475`(ChatGPT 0.6.14 엘리시) 위. 버전 0.6.15/versionCode32(ChatGPT가 0.6.14를 먼저 사용).
- 원인: 돌 그림은 기준점 위(y −0.066~0), 충돌 타원은 기준점 ±0.042 → 그림 윗부분 통과·빈 바닥 차단. 햇살 바위 휴식 영역은 바위 아래 바닥(y+0.074).
- 수정: `spatial.js` STONE 발자국(그림 기준)·`rockTop`/`onRock`·바위 윗면 오르내림 예외·돌 안 시작점 탈출(재진입 금지)·정확 경로 실패 시 0.6.14까지의 발자국으로 재탐색(저장 배치·쉼터 입구 검증 호환). `objects.js` 햇살 바위 region → 바위 윗면. `scene.js` 바위 위 친구는 바위 가림 재그리기 제외.
- 테스트: `tests/forest/stone-footprint.test.cjs`(5) 추가. 기존 2건 조정 — `shelter-alternate-entry`(차단 배치 바위 y .36→.376, 새 발자국 기준 같은 의도), `update218` 큐(대기 엘레판 `nextObjectChoice`로 문 앞 대기 명시. 기존·수정 코드 모두 통과. 원래는 자유행동 RNG/거리 우연에 의존).
- 검증: `npm test` 210/210, `npm run test:ui` PASS, `tools/stone-review.cjs` → `docs/qa-0.6.15/runtime`(돌 핵심부 통과 경로 0, 바위 위 휴식 렌더, 상태 불변). 실기기·WebView 미검증. SRS PDF 미갱신(규칙 수치 불변, 영역 위치만 변경) — 필요 시 v2.23에 반영.
- 미완료: 서명 APK(공식 CI 또는 `tools/build_apk_alt.sh` + 원래 키), 실기기 확인, PR 병합.

### REVIEW-ISSUE15-20261117 — 생태계 v2.24·엘리시·쉼터 3명 검토

- 담당: Claude Code. 검토 전용(코드 변경 없음). 보고서·증거는 사용자에게 파일 전달, 요약은 이슈 #15 댓글(https://github.com/sia080808-lgtm/Forest-of-Space/issues/15#issuecomment-6961435210).
- 판정: 수정 필요. P0 = 낱잎 분해 범위 미정의, L+U 포화로 자연 낙하 정지(기존 저장·현 신규 게임 O70/U30), 섹터 습도 미정의.
- 사용자 결정(2026-11-17): (1) 엘리시 팔: 처음 '팔 유지'였으나 사용자가 원화 고해상도본을 주며 "이거랑 똑같이"를 요청해 **팔 없음 종별 예외로 변경**(0.6.18) → 엘리시 리깅 패치는 영양엽 감싸기·잎 질감·감은 눈 패치 중심. (2) 자연 낙하 판정 **바닥 낙엽 L만**(U 별도, 기존 L70은 섹터 더미로 이전, 자원 생성 없음). (3) 잎응애·잎지기 **기본 기후에서도 국소 건조 조건으로 가끔** 출현.

### PATCH-0.6.16-20261117 — 길찾기 성능 회복, 엘리시 레거시 정리

- 담당: Claude Code. 요청: 사용자 승인("ㄱㄱ") 후 검토 패치 1·2.
- `spatial.js`: 장애물 목록을 경로/구간당 1회 생성(walkable `obs` 인자). `objects.js`: 엘리시 샘물→V 분기 삭제. `ellisii-portrait.svg`: feComposite로 필터 클립. 테스트 `ellisii-legacy.test.cjs`(2). 버전 0.6.16/versionCode33.
- 검증: `npm test` 212/212, `npm run test:ui` PASS, 성능 Node 60틱(쉼터 3명 42→19ms, 자유 5명 58→26ms), 돌 검수 동일, 초상화 Chromium 렌더. 실기기 미검증.
- 다음: PR 병합 시 release-apk.yml이 0.6.16 서명 APK 프리릴리스 생성. 결정 3건 반영 완료 → 다음은 패치 3(쉼터 3명) 승인 후 진행.

### SHELTER3-0.6.17-20261117 — 기본 쉼터 3명

- 담당: Claude Code. 요청: 사용자 승인("ㄱㄱ") 후 이슈 #15 패치 3.
- `shelter.js`: capacity 12/16/24, seats 3/4/5, `room()`(포인트+인원 동시), ledger에 friends/seats, 대기 사유 capacity/crowd, 확장 해금에 인원 조건, 엘레판 기본 쉼터 중앙 우선 정렬 제거. `objects.js` 쉼터 후보 필터를 `room()`으로. `object-cards.js` '함께 쉬는 친구 N명까지'. `stage2-fixtures.js` SH02(가득 찬 쉼터)에 리들리 1명 추가.
- 테스트: `shelter-three.test.cjs`(5, 수정 전 전부 실패). 기존 6건 갱신(object-cards, shelter-traffic 066→SH24, shelter SH-AC03/06 ledger 형태, update218 확장 해금, ui-smoke '전체 3공간'). `npm test` 217/217, UI PASS.
- 문서: `docs/Forest-Shelter-SRS-v2.24-SH24.md`(통합 PDF 반영 위치 명시), 릴리스 노트, 렌더 `docs/qa-0.6.17/runtime`. 버전 0.6.17/versionCode34.
- 미검증: Android 실기기.

### ELLISII-0.6.18-20261117 — 엘리시를 승인 원화 그대로

- 담당: Claude Code. 요청: 사용자 "캐릭터 이거랑 똑같이 만들어 주면 안 됨?"(원화 스크린샷 제공). 이전 SVG 초안(`91270e4`)은 이번 커밋으로 대체.
- 원화(사용자 업로드 스크린샷)를 배경 제거·윤곽 분리해 `ellisii-fronds.png`/`ellisii-body.png`로 저장(원화 파일 자체는 저장소에 넣지 않음). `species-rig.js` `ellisiiActor`(팔 없음; 생식엽·몸통·영양엽·발 2개 레이어; 걷기 시 발 교대·영양엽 들썩임, 집기 시 발 대롱·잎 팔랑, 감은 눈 덮기). 사용자 추가 요청 "발이랑 영양엽 움직이게" 반영. 옛 잎 SVG 3장·SVG 초상화 삭제, 초상화는 리그에서 구운 PNG.
- 테스트: `ellisii-legacy`(발/영양엽 움직임·동작 줄이기 포함)·`render.test` 갱신. `npm test` 219/219, UI PASS. 렌더·영상 `docs/qa-0.6.18/runtime`.
- 한계: 엘리시에 눈 쌓임 오버레이 미적용, Android 실기기 미검증. 버전 0.6.18/versionCode35.
- 병합·릴리스: PR #18(https://github.com/sia080808-lgtm/Forest-of-Space/pull/18) main 병합 `1d1c1450d03da2da9cd9c48618238aec37d825e7`(사용자 승인 "괜찮네 ㄱㄱ"; head `20cc78e` 기준 simulation·CodeQL 성공). release-apk.yml이 프리릴리스 v0.6.18 생성. `Forest-of-Space-0.6.18.apk` 38,799,870 bytes, SHA-256 `8c5b97fa399a50a0fc5133cfe3614fb9ca638a3b957a00088aa2157281c1522c` — 내려받은 파일·`.sha256` 자산·GitHub digest 일치. `apksigner verify` 인증서 SHA-256 `f807cfca…7e3d`(기존과 동일), `com.ridleydesk.mobile` versionCode35/0.6.18, 엘리시 PNG 에셋 포함.
- 남은 일: 들어 올림 시 영양엽 왼쪽 가장자리의 가는 어두운 선(잎 추출 가장자리 픽셀) 정리, 엘리시 눈 쌓임 오버레이, Android 실기기 설치·업데이트 확인. 다음 패치: 5(낙엽 섹터·바닥 L 게이트), 6(생물) — 사용자 승인 후.

### ELLISII-EDGE-0.6.19-20261117 — 엘리시 잎 가장자리 선 제거, 눈 쌓임

- 담당: Claude Code. 요청: 사용자 "ㄱㄱ"(0.6.18 남은 일 진행). 기준 main `1d1c145`, 브랜치 `claude/festive-curie-mjk5mw`.
- 원인: 영양엽이 들릴 때 (1) 잎 밑에 숨어 있던 몸통 테두리가 가는 어두운 선으로, (2) 원화 크림색 배경이 남은 반투명 가장자리가 흰 테두리로 보임.
- 수정: `tools/defringe-ellisii.py`(크림색 가장자리 제거·작은 조각 제거·가장자리 재채색, 몸통 위쪽 테두리 10px를 영양엽 안쪽으로; 잎 끝 아래 y≥410은 유지) 실행 결과로 레이어 5장 갱신, 초상화 재굽기. `species-rig.js` 엘리시 생식엽·영양엽에 `ForestEffects.snow` 적용. 버전 0.6.19/versionCode36.
- 검증: `npm test` 220/220(새 검사는 수정 전 레이어에서 실패), `npm run test:ui` PASS, 렌더 `docs/qa-0.6.19/runtime`. 실기기 미검증.
- 다음: 패치 5(낙엽 섹터·바닥 L 게이트·기존 L70 이전), 패치 6(생물).
- 병합·릴리스: PR #19(https://github.com/sia080808-lgtm/Forest-of-Space/pull/19) main 병합 `0318a446bb198018d7f7cd349fd4ec93e151646f`(사용자 "ㄱㄱ"). 프리릴리스 v0.6.19 `Forest-of-Space-0.6.19.apk` SHA-256 `c7fd3bf0369df254a75d06537f75eba9702fb86f590154ae7dbe5ca45d300da1` — 내려받은 파일·`.sha256`·GitHub digest 일치, 인증서 `f807cfca…7e3d`, versionCode36/0.6.19.

### LITTER-L1-0.6.20-20261118 — 생태계 v2.24 1단계: 낙엽 구역 (이슈 #15 패치 5)

- 담당: Claude Code. 요청: 사용자 "ㄱㄱ"(설계안 7항목 승인). 기준 main `0318a44`, 브랜치 `claude/festive-curie-mjk5mw`.
- 새 모듈 `litter.js`(12섹터 낙하·낱잎·더미·분해·바람 이동·기존 저장 이전·검증, 독립 난수 `rng.litter`). `objects.js`: 더미를 이용 대상(`pile:N`, 가까운 2곳)으로, 자연 유입을 `litter.step`으로, 낙하 판정은 바닥 L 40만, U 상한 초과분은 `ledger.soil` 유출. `engine.js`: 새 게임 기존 자리 O0/U10, 불러올 때 `litterInit`, 조경 후 `relocate`, 이동 목적지에 더미 허용. `recruitment.js` 낙엽 조건은 전체 원료. `scene.js` 낱잎·더미 그리기, 더미 선택. `object-cards.js` 낙엽 자리·더미 카드. `index.html`·`tools/ui-smoke.mjs` 스크립트 추가.
- 규칙 문서 `docs/Forest-Ecosystem-SRS-v2.24-L1.md`(초안 대비 변경: 이전 더미 3개, 기존 자리는 낙하 판정 제외, U 초과분 흙 유출).
- 테스트: `litter-sectors.test.cjs`(7) 추가. 갱신: `objects219`(classic 도우미·14/15 재작성·27 하루 전환 ≤1장), `object-cards`(더미 카드·바닥 낙엽 여유), `update218`(서식 차단 시 섹터 낙엽도 비움). `npm test` 227/227, `npm run test:ui` PASS.
- 검수: `tools/litter-review.cjs` → `docs/qa-0.6.20/runtime`(보존식·새 게임/기존 저장 통계·렌더). 성능 Node 1명 1.77→2.18ms/틱.
- 미검증: Android 실기기, 장기 영양 밸런스(1명 기준 영양 58 유지 확인뿐). 다음: 패치 6(생물: 개미·톡토기 → 잎응애·잎지기(기본 기후 국소 건조) → 뿌리파리·흙지기·P03).
- 병합·릴리스: PR #20(https://github.com/sia080808-lgtm/Forest-of-Space/pull/20) main 병합 `d7e197c94e15ce4b0efa8b7bf746b877a5b2a4c7`(사용자 "ㄱㄱ"; head `8d010c1` 기준 simulation·CodeQL 성공). 프리릴리스 v0.6.20 `Forest-of-Space-0.6.20.apk` 38,746,688 bytes, SHA-256 `974ec80a80b44929a730ec17b28f75dc745cf842f7952ec50c1cba5a07063972` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode37/0.6.20, `litter.js` 포함.

### CREATURES-DRAFT-20261118 — 패치 6 생물 시안 (게임 미연결)

- 담당: Claude Code. 요청: 사용자 "ㄱㄱ"(패치 6) 후 "일단 캐릭터 디자인 움직이는 것부터 보여줘".
- `creature-art.js`(짐꾼개미: 3마디·삼각 보행 다리 6개·꺾인 더듬이·낙엽 조각 운반·둔덕 둥지 / 톡토기: 회보라 둥근 몸·도약기 펴는 점프). 렌더 위상만 사용, 난수·상태 불변. 아직 index.html·scene.js에 연결하지 않음.
- 시안 `docs/qa-creatures-draft/design-sheet.png`, `creatures-world.mp4`(실제 scene 확대 위 합성), 생성 스크립트 `tools/creatures-preview.cjs`. 커밋 `ede98b3`(작업 브랜치, PR 없음).
- 다음: 사용자 시안 피드백 → 6a 구현(공통 유입 600초 보호·180초 20%·600초당 1집단, 개미 90초/장 실제 운반, 톡토기 더미별 Fspring 1.25·120초 적합/이탈, 엘리시 근처 톡토기 30→40%).

### UI-0.6.21-20261118 — 거름 표시, 엘리시 영입 안내, 조사

- 담당: Claude Code. 요청: 사용자 제보(스크린샷) "이 좁쌀들은 뭐임" → 개선안에 "ㅇㅇ 그렇게 고쳐주고", "엘리시는 어디 있음? 데려오려니 정보가 없던데", 중간 의견 "불에 탄 것 같다".
- `scene.js`: 거름 점 43개 → `compostStain` 옅은 흙빛 얼룩, 거름 자리에 낙엽이 없으면 색 바랜 잎 3장, 더미 둘레도 얼룩. `recruitment.js`: `josa`(이/가·을/를), 엘리시 조건 4개 `checks`(이끼 촉촉함·바위틈 고인 물·거리·길). `forest-app.js`: 친구들 화면 조건 목록·180초/35%/3회 보장 안내·손님 대기 중 준비 시간 정지 안내, 조사 적용. `social.js` 보호 기록 조사. `forest.css` 목록 스타일. 영입 규칙 불변.
- 원인 설명: 엘리시는 아직 숲에 없음(미영입). 두리가 입구에서 기다리는 동안 `Recruitment.tick`이 다른 후보 진행을 멈춤(기존 규칙). 사용자 화면 '준비된 시간 1/180'은 그 때문 + 비로 이끼 촉촉함이 75%를 넘었을 가능성(미확인).
- 테스트 `recruit-info.test.cjs`(2). `npm test` 229/229, `npm run test:ui` PASS. 렌더 `docs/qa-0.6.21/runtime/compost-stain.png`. 버전 0.6.21/versionCode38.
- 포함: 작업 브랜치의 생물 시안 `creature-art.js`(게임 미연결).
- 병합·릴리스: PR #21(https://github.com/sia080808-lgtm/Forest-of-Space/pull/21) main 병합 `de1063d895758602386b506f64e05236346dbc84`(사용자 "ㄱㄱ"; head `c49eb04` 기준 simulation·CodeQL 성공, CodeQL 미사용 변수 3건은 `tools/creatures-preview.cjs`에서 수정). 프리릴리스 v0.6.21 `Forest-of-Space-0.6.21.apk` 38,750,856 bytes, SHA-256 `746d071099e12b5456776689a35f4a4769ff254c7da9326dc5c4604b149a52c1` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode38/0.6.21.

### CREATURES-SRS-ART-20261118 — 짐꾼개미를 SRS 승인 시트 그림으로

- 담당: Claude Code. 요청: 사용자 "시안은 SRS에 있음".
- 출처: `docs/Forest_SRS_Design_Audio_v2.22.pdf` 249~253쪽 D04.20~24 '작은 이웃 형태 시안'(1536×1024 시트 1장, 9종: 돌돌이·짐꾼개미·점박이·흙지기·쏙쏙이·잎지기·뿌리날파리·잎응애·솜깍지). **톡토기는 시트에 없음**(v2.24 신규).
- 짐꾼개미(시트 02)를 배경·풀·흙 제거 후 `assets/forest/creatures/ant-body.png`·`ant-leaf.png`로 분리. `creature-art.js` `antSprite`(걸음 들썩임·흔들림, 잎 줄기 축 흔들림, 좌우 반전). 시안 영상·시트 갱신 `docs/qa-creatures-draft`. 커밋 `05e9271`(작업 브랜치). 게임 미연결.
- 대기: 톡토기 그림 출처 결정(지피티 생성 추천 / 임시 그림 사용). 그 뒤 6a 구현.

### ELLISII-ARRIVAL-0.6.22-20261118 — 엘리시가 실제로 찾아올 수 있게

- 담당: Claude Code. 요청: 사용자 "이거 엘리시 들어올 수 있는 거 맞음?"(두리 방문 화면 스크린샷) → 원인·수정안 설명 후 "ㄱㄱ".
- 확인: 화면의 손님은 두리(월드 안내와 동일). 실제 엔진 8시드×3게임일 시뮬레이션에서 이끼 촉촉함이 거의 항상 100%(용량 5, 비에 금방 참)라 엘리시 조건 40~75% 충족 1~3%, 방문 1/8.
- 수정: `recruitment.js` 엘리시 조건 = 이끼 40% 이상 + 큰비(강수 0.6 이상) 아님 + 바위틈 고인 물 5 미만 + 거리·길(조건 목록 5항목). `social.js` 잎틈 정원 같은 기준. 상한 75% 삭제. 버전 0.6.22/versionCode39.
- 결과: 같은 시뮬레이션 8시드 중 7시드 3~12분, 1시드 약 71분에 방문.
- 테스트: `recruit-info` 갱신·추가(수정 전 코드 0/4로 실패). `npm test` 230/230, `npm run test:ui` PASS. 실기기 미검증.
- 병합·릴리스: PR #22(https://github.com/sia080808-lgtm/Forest-of-Space/pull/22) main 병합 `f43c09e6c30739a55e56c5b788f48b8d537e56c1`(사용자 "ㄱㄱ"; head `2810928` 기준 simulation·CodeQL 성공). 프리릴리스 v0.6.22 `Forest-of-Space-0.6.22.apk` 38,968,130 bytes, SHA-256 `413a7e800079185fc6f43cb43a7555142e42307c86fda4a1012ec60d61b4ad56` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode39/0.6.22.
- 다음: 톡토기 그림 출처 결정(지피티 생성 / 임시 그림) 후 패치 6a(개미·톡토기) 구현.

### RETIRE-DURI-0.6.23-20261118 — 두리 방문 제외, 첫 손님을 엘리시로

- 담당: Claude Code. 요청: 사용자 "두리 없지 않음? 시안도 없는데" → 확인(SRS v2.22에 첫 손님으로 정의, 전용 승인 시안 없음, 0.6.11 원본부터 코드에 있음) → "두리 빼자. 그 자리를 엘리시로 대체."
- `recruitment.js`: `retired=['duri']`(후보 제외), 첫 방문 전에는 엘리시만 후보(1,200초 뒤 다른 친구 허용), 240초 첫 방문 규칙을 엘리시로, `init`에서 기다리는/대기열 두리 → 엘리시 방문, '먼저 기다리기' 두리 해제. 함께 사는 두리는 보존. `forest-app.js`: 영입 목록에서 제외, 도감은 보유 시에만. 버전 0.6.23/versionCode40.
- 테스트: `recruit-info`에 제외 검사 추가(새 게임 첫 손님, 저장 이전, 보유 두리 보존, 이후 두리 방문 없음). `npm test` 231/231, `npm run test:ui` PASS. 실기기 미검증.
- 남은 일: SRS PDF 본문(첫 10분 흐름의 두리)을 엘리시로 개정하는 문서 작업.
- 병합: PR #23(https://github.com/sia080808-lgtm/Forest-of-Space/pull/23) main 병합 `4109e81b89a22bfa905691540a1d8b94b23b5fc6`(사용자 "ㄱㄱ"; head `c2a6f58` 기준 simulation·CodeQL 성공).
- 릴리스: 프리릴리스 v0.6.23 `Forest-of-Space-0.6.23.apk` 38,968,130 bytes, SHA-256 `70dfc7c066b4f3be7625425d06ec4fe720f32fad2d3cbc0afa2119502a0efb3c` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode40/0.6.23.
- SRS 개정안: `docs/Forest-Recruit-SRS-v2.25-ELL1.md`(두리 은퇴·첫 손님 엘리시·엘리시 서식 조건, v2.22 PDF 8·9·14·15·88·98·111·124쪽 대체 서술). PDF 재조판은 안 함. 작업 브랜치에만 있음(다음 PR에 포함).

### CREATURES-SPRINGTAIL-20261118 — 톡토기 그림 (SRS 화풍)

- 담당: Claude Code. 요청: 사용자 "니가 SRS 기준으로 톡토기 만들어줘".
- `tools/draw-springtail.cjs`(SRS D04.20 작은 이웃 시트 화풍: 따뜻한 갈색 윤곽, 수채 음영 마디 몸통, 마디 더듬이·다리 6개, 흰 반사점 눈, 도약기 접힘/펴짐) → `assets/forest/creatures/springtail-rest.png`·`springtail-jump.png`. `creature-art.js` `springtailSprite`(쉬다가 톡 튀어 오르기, 착지 후 방향 전환). 시안 `docs/qa-creatures-draft`(디자인 시트·월드 영상·SRS 개미와 나란히 비교). 게임 미연결.
- 다음: 사용자 확인 후 6a 구현(개미·톡토기 출현·운반·분해 보정).

### VISIT-CARD-0.6.24-20261118 — 첫 만남 카드 진행 표시·손님별 장면, 개미굴 그림

- 담당: Claude Code. 요청: 사용자 스크린샷 "맞이하는 카드의 캐릭터 창이 왜 이럼?", 조건·동작 질문 → 설명·개선안 후 "ㄱㄱ". 중간 의견 "개미굴 비스킷처럼 이질적".
- `recruitment.js` `steps()`(읽기 전용 단계·값·남은 시간·필요 버튼). `forest-app.js` 카드에 단계 목록·떠나기 안내, 손님별 버튼만 표시, `drawVisit` 손님별 소품·종이 바탕·캐릭터 약 2배·접지 그림자, 제목 조사. 버전 0.6.24/versionCode41.
- 생물 시안: `tools/draw-antnest.cjs` → `ant-nest.png`(흙 알갱이 둔덕·그늘진 입구·조약돌·새싹), `creature-art.js` `nestSprite`. 게임 미연결.
- 확인: 엘리시 카드 '함께 살기'는 카드 연 지 149초에 활성화(시뮬레이션). 테스트 `npm test` 232/232, `npm run test:ui` PASS. 렌더 `docs/qa-0.6.24/runtime/visit-cards.png`. 실기기 미검증.
- 수정(사용자 "짐꾼 개미 왜 뒷통수가 파여 있냐"): SRS 시트에서 개미가 문 잎 줄기를 지울 때 머리 뒤쪽까지 지워져 홈이 생겼다. `ant-body.png`의 머리 타원 안 홈(103~124, 99~125)을 머리 안쪽 색으로 확산 채움+옅은 결+가장자리 음영으로 메움. 전후 비교 `docs/qa-creatures-draft/ant-head-fix.png`.
- 수정(사용자 "개미굴 땅이랑 연장된 느낌의 작은 흙더미가 있고 그 봉오리에 개미 구멍이 있어야"): `tools/draw-antnest.cjs`를 땅에서 솟은 흙 돔(가장자리 번짐, 왼쪽 밝고 오른쪽 그늘)과 꼭대기 분화구·입구로 다시 그림. `nestSprite` 기준점은 흙더미 바닥 중심(180,150). 비교 `docs/qa-creatures-draft/nest-and-ant-fix.png`.
- 수정 2(사용자 "흙더미 색은 여백의 숲 땅 색이랑 같고 명암만", "통수 여전히 파여 있잖아. 둥글게"): 개미굴 색을 바탕 종이(`garden-open.png` 약 #fceedf)와 같은 톤으로 바꾸고 밝음·그늘만 둠. 개미 머리는 윤곽 타원 맞춤(중심 85.8,118.1·반지름 38.2×31.1, 3차: 첫 맞춤이 좁아 y≈114 계단이 남아 다시 맞춤, 4배 표본 안티에일리어싱 테두리)으로 뒤통수 계단까지 둥글게 다시 칠하고 목 쪽 잔여 조각 제거. 개미굴 새싹은 오른쪽 하나만 남김(사용자 "오른쪽만 적용해").
- 병합·릴리스: PR #24(https://github.com/sia080808-lgtm/Forest-of-Space/pull/24) main 병합 `9644d543c872be3e3970e6d96bc68d148c667c47`. 프리릴리스 v0.6.24 `Forest-of-Space-0.6.24.apk` 39,119,975 bytes, SHA-256 `1f6a255db08ae4c035d1b72a0016de981b011adc5bc445b17e9799a2dfc2a78c` — 내려받은 파일·`.sha256`·GitHub digest 일치, 인증서 `f807cfca…7e3d`, versionCode41/0.6.24.

### CREATURES-0.6.25-20261118 — 생태계 v2.24 패치 6a: 짐꾼개미·톡토기 게임 연결

- 담당: Claude Code. 요청: 사용자 "ㄱㄱ"(개미·톡토기를 실제 게임에). 기준 main `9644d54`, 브랜치 `claude/festive-curie-mjk5mw`.
- 새 모듈 `creatures.js`(출현 600초 보호·180초 확인·600초당 1무리·최대 8, 개미 90초마다 실제 낱잎 1장 운반·이탈 시 반환, 톡토기 자기 더미 ×1.25, 독립 난수 `rng.creatures`, 저장 `objects.creatures`). `litter.js`: 운반 중 잎을 바닥 L에 포함, 분해 배율에 톡토기, 더미 촉촉함을 낙엽 자리 흙 기준으로. `objects.js`/`engine.js` 연결, `scene.js` 둥지·운반·톡토기 그리기, `object-cards.js` '작은 이웃' 행, `index.html`·`ui-smoke.mjs`·`rig.js` 스크립트/에셋 연결. 버전 0.6.25/versionCode42.
- 검증: `npm test` 238/238(`creatures.test.cjs` 6), `npm run test:ui` PASS. `tools/creatures-review.cjs` 8시드 3게임일 보존식 오차 0, 렌더·영상 `docs/qa-0.6.25/runtime`. Android 실기기 미검증.
- 다음: PR 병합 후 v0.6.25 APK 확인. 패치 6b(잎응애·잎지기), 6c(뿌리날파리·흙지기·솜깍지).
- 병합·릴리스: PR #25(https://github.com/sia080808-lgtm/Forest-of-Space/pull/25) main 병합 `b9a822a6bf8244db2ed4b7fd0c7c1261308557c1`(사용자 "ㄱㄱ"; head `93fa8df` 기준 simulation·CodeQL 성공). 프리릴리스 v0.6.25 `Forest-of-Space-0.6.25.apk` 39,124,140 bytes, SHA-256 `953c162b5ecc016350b33f9240d37f0894217d821a658be702df23c0e61a9097` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode42/0.6.25, `creatures.js` 포함.

### MITES-0.6.26-20261118 — 생태계 v2.24 패치 6b: 잎응애·잎지기

- 담당: Claude Code. 요청: 사용자 "6b 잎응애 잎지기도 진행". 기준 main `b9a822a`(0.6.25 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- `creatures.js`: 잎 국소 기후 `leaf()`(햇살 바위·맑음·목마름·물가·쉼터), 잎응애 P02(마른 잎 시간 누적·10분 감쇠, 공통 출현 20%, 밀도 12/+4/정지/−6/정돈·쉼터 −4, 잎 부담 2×밀도/100, 5 미만 60초 회복·300초 대기), 잎지기(ECO-07 120초·60초 30%·300초 보장, 분당 8 포식, 먹이·서식 없으면 120초 뒤 이탈), 검증·`onLeaf`. `scene.js` `leafNeighbours`, `creature-art.js` `leafMite`·`silk`, `forest-app.js` 카드 상태 한 줄 `leafNote`. 에셋 `predatory-mite.png`(SRS 시트 06), `spidermite.png`(시트 08 색으로 다시 칠함, `tools/recolor-spidermite.py`). 버전 0.6.26/versionCode43.
- 검증: `npm test` 246/246(`leaf-mites.test.cjs` 8), `npm run test:ui` PASS, `tools/leaf-mites-review.cjs` → `docs/qa-0.6.26/runtime`(C01 7일 4/8 잎응애·잎지기 0, C02 2/8, C04 8/8·잎지기 3/8, 최대 잎 부담 17.5). 실기기 미검증.
- 초안 대비: 마른 잎 시간 누적(연속 120초 대신), 잎응애 정지 구간 35~55, 잎지기는 공통 600초 간격과 별도. 미구현: 잎 해충 전이(ECO-13), 알·미성숙 단계 표시.
- 다음: PR 병합 후 v0.6.26 APK 확인. 6c(뿌리날파리·흙지기·솜깍지·점박이).
- 병합·릴리스: PR #26(https://github.com/sia080808-lgtm/Forest-of-Space/pull/26) main 병합 `c23c050f3bb85ed3fdbed21b2c645e60f5551d59`(사용자 "ㄱㄱ"; head `2d523c7` 기준 simulation·CodeQL 성공). 프리릴리스 v0.6.26 `Forest-of-Space-0.6.26.apk` 39,251,310 bytes, SHA-256 `070340388ab90f380e75f287454b24084f72d4e57dabb93fd68cafc088c24e90` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode43/0.6.26, `spidermite.png`·`predatory-mite.png` 포함.

### SOIL-MEALY-0.6.27-20261118 — 생태계 v2.24 패치 6c: 뿌리날파리·흙지기·솜깍지·점박이

- 담당: Claude Code. 요청: 사용자 "6c도 진행". 기준 main `c23c050`(0.6.26 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- `creatures.js`:
  - 뿌리날파리 P01: 젖은 낙엽 자리·더미, 알·유충·성충 단계, 최대 2곳.
  - 흙지기: 물 빠진 촉촉한 흙, 유충→알 포식, 남은 U 섭취는 흙 원장으로.
  - 솜깍지 P03: 잎 사이 자리, 감로, 알주머니.
  - 개미 감로 지키기(X04)와 점박이(성충 120초 살핌 → 유충 포식, 지켜질 때 0.5배).
  - 공통: 해충 부담 합계 2/분 `harm()`, 해충 2종 제한, 도움 이웃·해충 출현 간격 분리, 검증 확장.
- 화면·카드·에셋: `scene.js` 흙·잎 위 그리기, `creature-art.js` `neighbour`·`honeydew`, `forest-app.js`·`object-cards.js` 상태 문구. SRS 시트에서 잘라낸 에셋 6개(`tools/cut-srs-neighbour.py`). 버전 0.6.27/versionCode44.
- 검증:
  - `npm test` 254/254(`soil-and-mealy.test.cjs` 8, `creatures.test.cjs` 출현 검사 갱신), `npm run test:ui` PASS.
  - `tools/soil-mealy-review.cjs` → `docs/qa-0.6.27/runtime`(기후별 출현 표, 보존식 0, 감로·개미 지키기는 3일 동안 자연 발생 없음).
  - 12게임시간 장기 실행에서 무리 9개 초과 버그를 찾아 고침(가족별 출현이 같은 틱에 2개 추가되던 문제).
  - 실기기 미검증.
- 초안 대비:
  - 뿌리날파리 자리를 친구 근권 R 대신 젖은 낙엽으로(Q가 거의 0).
  - 흙지기 촉촉함 상한 65 제거.
  - 솜깍지 증가 조건 분리(붙는 자리 / 늘어나는 조건).
  - 성충 수명 600초.
- 미구현: ECO-13 전이, 알 원화, 점박이 유충 원화, 쏙쏙이.
- 다음: PR 병합 후 v0.6.27 APK 확인.
- 병합·릴리스: PR #27(https://github.com/sia080808-lgtm/Forest-of-Space/pull/27) main 병합 `96085869de39d8390c60d77f404e64c78b96a9ae`(사용자 "ㄱㄱ"; head `cec195b` 기준 simulation·CodeQL 성공). 프리릴리스 v0.6.27 `Forest-of-Space-0.6.27.apk` 39,814,310 bytes, SHA-256 `2861d23f9aef8254512daef090fd74d7b6f55f06f26ccdb284cd2ae9a4ce6e03` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode44/0.6.27, `creature-rig.js`·부위 PNG 포함.
- 다리·날개 분리(사용자 "곤충들 별 움직이는 시안 왜 안보여줘" → 영상 → "다리랑 날개랑 따로 움직이게 해줘" → "ㄱㄱ"): `tools/rig-neighbours.py`가 SRS 시트 그림 6종을 몸통 + 부위 아틀라스(다리·날개·더듬이, 부위마다 따로 칸·회전축)로 나누고 `creature-rig.js`를 만든다. `creature-art.js` `drawRig`: 다리는 두 무리가 번갈아 딛고, 뿌리날파리 날개는 빠르게 날갯짓, 더듬이 흔들림. 유충은 `wriggle`(띠 물결). 솜깍지 왁스 돌기는 몸통에 둔다(SRS D04.24). 진드기류는 더듬이 없음(앞다리로 분류). 처음 시안에서 이웃 다리 조각이 같이 돌던 문제는 아틀라스 칸 분리로 고침. 영상 `docs/qa-0.6.27/runtime/neighbours-motion-closeup.mp4`(크게)·`neighbours-motion.mp4`(게임 화면), 위상 비교 `rig-phases.png`. `npm test` 254/254, UI PASS.
- 누끼 다시 따기(사용자 "얜 왜 다리가 짤렸냐", "솜깍지 누끼 제대로 안 따져 있고", "뿌리파리 다리 밑 누끼", "입도 짤림", "원본이 버젓이 이렇게 있는데 왜 그렇게 하냐"):
  - 처음에는 흙 높이에서 가로로 잘라 흙지기 턱·다리 끝이 잘렸고, 이를 다시 그려 메우려 했다(잘못된 방향, 도구 삭제).
  - 흙지기·솜깍지는 OpenCV GrabCut으로 원본을 다시 땄다(`tools/cut-soilmite-grabcut.py`, `tools/cut-mealybug-grabcut.py`). 흙은 줄이 아니라 색(LAB 노란기)으로만 구분한다. 몸·다리·턱은 원본 픽셀 그대로이고 다시 그린 부분은 없다.
  - 솜깍지 등 왁스 돌기는 종이와 색이 같아 색·경계로 구분되지 않았다. 몸 윗선을 따라 약 12px마다 돌기 모양 마스크를 두고 원본 픽셀을 쓴다. 앞다리는 흙 제거 단계가 다리 가장자리를 지워 떨어져 나가던 문제를 고쳤다.
  - 뿌리파리 발밑 흙 점·가슴 홈, 유충 밑 흙 띠는 `tools/clean-root-gnat.py`로 정리했다.
  - 원본 대 결과 비교 `docs/qa-0.6.27/runtime/cutout-fixes.png`. `npm test` 254/254, UI PASS.

### NEIGHBOURS-0.6.28-20261118 — 쏙쏙이·돌돌이, 식물과의 관계, SRS v2.25 작은 이웃

- 담당: Claude Code. 요청: 사용자 "다 넣고, 얘네들 생태계 로직 같은 것도 설정 다 하고 식물들과의 메커니즘도 다 넣고 SRS에 정리하고 업데이트하자". 기준 main `9608586`(0.6.27 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- `creatures.js`:
  - 쏙쏙이: 은신처 바위틈·햇살 바위 0.3 안, ECO-07, 8/분, 흙지기와 한 자리 합계 12/분 `zoneBite`, 대체 먹이 없음, 최대 2.
  - 돌돌이 분해 ×1.1 `pillNear`(litter.js가 기존 낙엽 자리에도 배율 적용).
  - 엘레판 펼친 잎 그늘 `canopy`, 친구가 느끼는 해충 `pressure`, 도감 관찰 기록 `seen`.
- 그 밖의 코드:
  - `objects.js`: 해충 반응(정돈 25→55%, 잎응애 시 그늘·샘터 우선, 뿌리날파리 낙엽 놀이 제외·영양은 마지막).
  - `scene.js`: 돌돌이 시트 그림·말림, 쏙쏙이 숨기.
  - `forest-app.js`: 도감 10종, 카드 문구. `object-cards.js`: 쏙쏙이·돌돌이 문구.
- 그림·리그: `tools/cut-neighbour-grabcut.py`(돌돌이·말린 공·쏙쏙이; 돌돌이 다리는 흙과 같은 색이라 손으로 짚은 마스크), `tools/rig-neighbours.py`에 두 종 추가.
- SRS: `docs/Forest-SmallNeighbours-SRS-v2.25.md`와 PDF(6쪽, `tools/build-srs-pdf.cjs`). 원칙·출현 공통·환경 판정·종별 표·먹이 관계·식물 관계·그림·초안 대비 변경·AC↔테스트·검증 결과·남은 일을 정리했다. 422쪽 통합 PDF는 v2.22 그대로다.
- 검증: `npm test` 260/260(`neighbours-plants.test.cjs` 6, `creatures.test.cjs` 천적 목록에 쏙쏙이), `npm run test:ui` PASS. `tools/ecosystem-review.cjs` → `docs/qa-0.6.28/runtime`(기후별 표, 보존식 0). 움직임 영상 8종. 실기기 미검증.
- 버전 0.6.28/versionCode45.
- 다음: PR 병합 후 v0.6.28 APK 확인. 남은 일은 SRS NB-10(ECO-13 전이, 알·유충 원화, 감로 밸런스).
- 병합·릴리스: PR #28(https://github.com/sia080808-lgtm/Forest-of-Space/pull/28) main 병합 `64329f6e72a86435a25bfef502124761ca31058e`(사용자 "ㄱㄱ"; head `f846968` 기준 simulation·CodeQL 성공). 프리릴리스 v0.6.28 `Forest-of-Space-0.6.28.apk` 40,146,769 bytes, SHA-256 `9f2b09e4c2f1ea4816fa483b2decde912d6637c49252076d56ee3562f1c970c1` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode45/0.6.28, 돌돌이·쏙쏙이 그림 포함.

### SUPERBUM-0.6.29-20261118 — 슈퍼범: 빗물 모으기와 물 나눔, SRS v2.26

- 담당: Claude Code. 기준 main `64329f6`(0.6.28 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 요청 흐름:
  - "자 이제 수퍼붐 만들자". 선택은 그림 "제가 SRS 화풍으로 그림", 능력 "물 모으기 + 물 나눔"이었다.
  - 러프 시안 뒤 사용자가 회종안을 제공하며 "이거랑 똑같이 그려줘", 크기는 "리들리의 1.7배".
  - "레이어 순서: 얼굴이 가장 밑, 그 다음이 다리와 눈, 그 다음 레이어가 양 옆 잎, 맨 위가 머리 잎".
  - 하단부 흰 얼룩 정리 요청 뒤 "좋네 ㄱㄱ".
- 그림:
  - `tools/cut-superbum.py`(회종안 누끼)와 `tools/rig-superbum.py`(마른/물 고인 두 벌, 레이어 6장씩)로 만들었다. 원화 파일 자체는 저장소에 넣지 않았다(엘리시와 같음).
  - 초상화는 `tools/bake-superbum-portrait.cjs`, 쉼터 윤곽은 `tools/bake-superbum-profile.cjs`로 구웠다.
  - 시안 단계의 그림 도구(draw-superbum·superbum-sheet)는 지웠다. 러프·콘셉트(`docs/qa-superbum-draft`)는 이력으로 남겼다.
- 코드:
  - `superbum.js`: 렌더러·모션 10종·물 상태 전환·옆잎 휘기.
  - `rig.js`: 렌더러 연결. `scene.js`: 1.7배, 둥지 물과 '빗물 모으기' 모션 전달.
  - `spatial.js`: 충돌 1.7배. `environment.js`: 머리 면적 2.89. `shelter.js`: 쉼터 점유 5/6/8/10과 윤곽.
  - `social.js`:
    - `collect`: 둥지잎에 내린 비를 모은다. 1초 0.1·최대 40이고 `ledger.rain`에 기록한다.
    - A04 물 나눔: 기증자를 슈퍼범으로 바꿨다. 엘리시가 주던 옛 기록은 계속 은퇴로 끝난다.
    - `supported`에 슈퍼범을 넣었다.
  - `engine.js`: 종 목록, 매 틱 `collect` 호출, 제자리 쉼(`restSelf`, 맞는 휴식 자리가 없는 성체가 체력 40 미만일 때).
  - `recruitment.js`: 조건(샘터 물 30%·길), 첫 만남 단계 샘터→하늘→쉬기.
  - `forest-app.js`: 초상화·첫 만남 카드·상태 문구.
  - `index.html`·`stage2-review.html`·`tools/ui-smoke.mjs`: 스크립트 추가.
  - 저장 스키마 버전 불변. 버전 0.6.29 / versionCode 46.
- 테스트: `superbum.test.cjs`(7개)를 새로 넣었다. `render.test` 종 분기와 `update218` 종별 조건 검사를 갱신했다. `npm test` 267/267, `npm run test:ui` PASS. 게임 화면 렌더 `docs/qa-superbum/world-*.png`(렌더 전후 상태 동일). Android 실기기 미검증.
- 문서:
  - SRS: `docs/Forest-Superbum-SRS-v2.26.md`·`.pdf`(4쪽).
  - 릴리스 노트: `docs/Forest-0.6.29-Release.md`.
  - 검수 자료: `docs/qa-superbum`(레이어 시트·모션 영상·하단부 확대).
  - `tools/build-srs-pdf.cjs`: 꼬리말을 문서 제목에서 가져오게 고쳤다.
- 남은 일:
  - 다 자란 슈퍼범은 기본 쉼터에 들어가지 못한다(넓힌 쉼터 필요, 그 전에는 제자리 쉼). 사용자 결정 대기.
  - Android 실기기 성능 미확인(옆잎을 띠로 휘게 그려 친구 한 명당 drawImage 약 80회).
