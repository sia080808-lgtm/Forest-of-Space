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
- 병합·릴리스: PR #29(https://github.com/sia080808-lgtm/Forest-of-Space/pull/29) main 병합 `28f4173f4ae068695d3d64e8831fc3816a690f31`(사용자 "ㄱㄱ"; head `a21618a` 기준 simulation·CodeQL 성공). 프리릴리스 v0.6.29 `Forest-of-Space-0.6.29.apk` 40,623,323 bytes, SHA-256 `67ecfdeb524206527f03f201b0e2ac5ddcc4433e547df46852b98ee35f5fc108` — 내려받은 파일·`.sha256`·GitHub digest 일치, 인증서 `f807cfca…7e3d`, versionCode46/0.6.29, 슈퍼범 에셋 14개 포함.

### REST-SPOTS-0.6.30-20261118 — 잎 그늘·엘레판 잎 아래 자리, 바위 옆 관통, 첫 만남 샘터

- 담당: Claude Code. 기준 main `28f4173`(0.6.29 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 요청(0.6.29 실기기 화면 제보):
  - 잎 그늘·엘레판 밑에서 쉴 때 멀리 떨어져 쉼
  - 햇살 바위·바위틈 옆면을 관통함
  - 첫 만남 기다리는 장면 디자인
  - 캐릭터가 안 움직임
  - 도감에 벌레가 안 채워짐
- 변경:
  - `objects.js`: 잎 그늘 쉬는 자리를 줄기 오른쪽 잎 아래로 옮겼다.
  - `spatial.js`:
    - 잎 그늘 장애물을 줄기 밑동만으로 줄였다.
    - 돌(햇살 바위·바위틈) 판정을 친구 몸 너비의 절반만큼 넓혔다(`pad`/`solid`, 구간 검사와 탈출 규칙도 같은 판정을 쓴다).
  - `social.js`: 엘레판 잎 아래 자리를 깊은 자리부터 고른다.
  - `shelter.js`: 쉼터에서 나가다 막혔을 때 이미 밖에 있으면 밖으로 내보낸다.
  - `scene.js`: `springAt`(월드 샘터 그리기)를 분리했다. `forest-app.js`는 첫 만남 카드에서 그것을 쓰고, 정원 밖 친구 문구를 바꿨다.
  - 버전 0.6.30 / versionCode 47.
- 검증:
  - `npm test` 271/271(`rest-spots.test.cjs` 4개 추가, `inspection.test` 줄기 위치 수정), `npm run test:ui` PASS.
  - 렌더: `docs/qa-0.6.30/runtime`, `docs/qa-superbum/visit-cards.png`.
  - 돌과 겹친 시간 761→134 친구·초(2시드·1게임시간·4명).
- 조사 결과(코드 변경 없음):
  - 움직임: 0.6.28과 0.6.29의 1게임시간 정지 시간이 같다. 비 오는 날 엘레판의 잎 우산과 쉼터에 들어가 쉬는 행동 때문이다.
  - 첫 만남 손님은 보송(봉봉 아님)이고, 옆은 동행 친구 엘리시다.
  - 도감: `seen` 기록은 0.6.28부터 생겼고, 엔진에서는 저장까지 정상이다. 0.6.28 이전에 왔다 간 이웃은 기록이 없다. 사용자가 본 종을 확인 중이다.
- 추가 요청: "케릭들 기다리는 이미지 디자인만 바꿔줘", "보송 이름 베이치로 업데이트".
  - 첫 만남 장면을 새로 그렸다(`forest-app.js` `drawVisit`): 월드 바닥 그림과 고사리 테두리, 빈터, 오솔길, 햇살, 낙엽, 캐릭터 25% 확대.
  - 보송을 베이치로 바꿨다(`engine.js` 종 목록·불러오기 이름 이전, `recruitment.js`). `names-030.test.cjs`를 추가했다.
  - `npm test` 272/272, UI PASS.
- 남은 일: 도감 미기록 종 확인. Android 실기기 미검증.
- 병합·릴리스: PR #30(https://github.com/sia080808-lgtm/Forest-of-Space/pull/30) main 병합 `7403c893b67714d58db63e5e87468e7e1c7f9d51`(사용자 "ㄱㄱ"; head `fe7abc6` 기준 simulation·CodeQL 성공). 프리릴리스 v0.6.30 `Forest-of-Space-0.6.30.apk` 40,623,323 bytes, SHA-256 `6c7a4ce9d5fe5cebafad7998612f792aa25022eb8db03420ee940ac6036c7f14` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode47/0.6.30, APK 안 engine.js VERSION 0.6.30·베이치 이름·첫 만남 `springAt` 포함 확인.

### ROCK-RIDER-0.6.31-20261118 — 햇살 바위 위 친구가 바위에 가려지던 문제

- 담당: Claude Code. 기준 main `7403c89`(0.6.30 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 요청: 0.6.30 실기기 제보 "햇살바위에서 쉬고 있을 때 다른 케릭이 근처로 지나가면 햇살바위가 쉬고 있던 케릭터 위로 올라옴".
- 원인: 친구마다 앞쪽 돌을 다시 그려 가리는 과정에서, 바위 뒤를 지나는 친구 때문에 다시 그린 바위가 먼저 그려진 바위 위 친구까지 덮었다.
- 수정: `scene.js`에서 이번 화면의 바위 위 친구를 기억해 두고, 햇살 바위를 다시 그린 직후 그 친구들을 다시 그린다. 렌더 전용 변경. 버전 0.6.31 / versionCode 48.
- 검증: `npm test` 273/273(`rock-rider.test.cjs` 추가, 수정 전 코드에서 실패), `npm run test:ui` PASS. 비교 이미지 `docs/qa-0.6.31/runtime`. Android 실기기 미검증.
- 병합·릴리스: PR #31(https://github.com/sia080808-lgtm/Forest-of-Space/pull/31) main 병합 `c5ae66827cbd831f18e9e3976a8672ab868b6516`(사용자 "ㄱㄱ"; head `46dc9c4` 기준 simulation·CodeQL 성공). 프리릴리스 v0.6.31 `Forest-of-Space-0.6.31.apk` 40,623,323 bytes, SHA-256 `5ca34fb8b7f89dd57d48057d3ba627b94bf9a8f73557e34970fb3bb59adda652` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode48/0.6.31, APK 안 scene.js에 바위 위 친구 다시 그리기 포함 확인.

### GUIDE-0.6.32-20261118 — 작은 이웃 도감 그림, 주렁→코로나

- 담당: Claude Code. 기준 main `c5ae668`(0.6.31 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 요청: "곤충이 나와도 도감이 채워지지 않음", "주렁 이름은 코로나로 변경".
- 진단: `seen` 기록은 정상이었다(엔진·Chromium 앱 확인). '작은 이웃' 탭이 글뿐이라 만난 이웃과 못 만난 이웃의 차이가 작은 표시 하나뿐이었다.
- 변경:
  - `forest-app.js`·`forest.css`: 이웃마다 그림을 넣었다. 못 만난 이웃은 실루엣으로 보이고, 위에 만난 수를 보여 준다.
  - `engine.js`·`recruitment.js`: 주렁을 코로나로 바꾸고, 저장된 이름을 불러올 때 옮긴다(별명은 유지).
  - 버전 0.6.32 / versionCode 49.
- 검증: `npm test` 274/274(`names-030` 코로나 추가), `npm run test:ui` PASS(작은 이웃 도감 검사 추가). 화면 `docs/qa-0.6.32/runtime`. Android 실기기 미검증.
- 병합·릴리스: PR #32(https://github.com/sia080808-lgtm/Forest-of-Space/pull/32) main 병합 `8c1fcfbdc3fc85081a8b18c215bb8557e8e5e675`(사용자 "ㄱㄱ"; head `8efbfe0` 기준 simulation·CodeQL 성공). 프리릴리스 v0.6.32 `Forest-of-Space-0.6.32.apk` 40,623,323 bytes, SHA-256 `d0bcac2e14e03b431d2f2da4e2f5a0423583f2b533537ba13f5378c1d59e2290` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode49/0.6.32, APK 안 코로나 이름·작은 이웃 도감 그림 포함 확인.
- 사용자 질문 "개미가 솜깍지 쫓아줌?": 아니다, 개미는 감로 20 이상이면 솜깍지를 지켜 점박이 포식을 0.5배로 늦춘다(X04). 감로는 밀도 50 초과에서만 쌓여 현재 밸런스에서는 거의 안 나온다고 안내. 기준 조정은 사용자 결정 대기.

### MOTION-0.6.33-20261118 — 감로 기준, 잎 그늘 겹침, 친구 수 제한 풀기, 머리 정돈·낙엽 놀이 모션, 점박이 옮겨 가기

- 담당: Claude Code. 기준 main `8c1fcfb`(0.6.32 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 요청: "낮추자"(감로), "케릭별 머리 정돈 모션과 낙엽가지고 노는 모션 보여줘", "팔 없는 애들은 어케 머리 정돈 함? 낙엽은 머리 위로 뿌려서… 리들리 왼손 어색", 잎 그늘 잡초가 캐릭터 위로 올라옴, "맵에 케릭터 수 제한 풀자", "점박이가 … 근처 케릭터 머리에 솜깍지가 남아 있으면 그쪽으로 넘어가서 먹는 메커니즘".
- 변경:
  - `creatures.js`: 감로 `밀도/100×8−0.6`, 개미 지키기 10/5(엔진 측정 지키기 0/24 → 12/24, `tools/honeydew-review.cjs`). 점박이 유충은 솜깍지를 다 먹으면 0.2 안 가장 가까운 친구(솜깍지 남음·점박이 없음·쉼터 밖·목부작 아님)로 옮겨 간다(`LADY.HOP`, `g.hops`).
  - `scene.js`: 잎 그늘을 줄기·잡초(깊이 순서)와 잎(맨 위)으로 나눠 그림.
  - `engine.js`·`social.js`·`shelter.js`·`forest-app.js`: 정원 5명 제한 삭제(기록 50명 한도까지).
  - `rig.js`: `draw` 래퍼로 낙엽 놀이(웅크려 모으고 뛰며 머리 위로 뿌리기, 낙엽 5장)와 팔 없는 친구의 머리 정돈(부르르 털기). 엘레판·슈퍼범은 자기 정돈 동작 유지.
  - 버전 0.6.33 / versionCode 50.
- 검증: `npm test` 275/275, `npm run test:ui` PASS. 영상 `docs/qa-0.6.33/runtime/groom-litter.mp4`, 잎 그늘 `shade-layers.png`. Android 실기기 미검증.

### NOD-ARMS-0.6.34-20261118 — 엘레판 정돈 까닥까닥, 베이치 팔 올려 뿌리기

- 담당: Claude Code. 기준 main `24c92e8`(0.6.33 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 0.6.33 병합: PR #33(https://github.com/sia080808-lgtm/Forest-of-Space/pull/33) main `24c92e899907eb9f346529cb153f487b1a02db69`(사용자 "낙엽놀이 및 머리정돈 ㄱㄱ", 낙엽은 땅에서 모아 던지도록 수정 후; head `6fbbbd2` 기준 simulation·CodeQL 성공).
- 0.6.33 APK 검증: 프리릴리스 v0.6.33 `Forest-of-Space-0.6.33.apk` 40,627,419 bytes, SHA-256 `ca8ab6a24ee14ed5feab9413e9665a22f590f13df2eb09cddb6759821ab1b351` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode50/0.6.33, APK 안 engine.js VERSION 0.6.33·점박이 옮겨 가기(`LADY.HOP`) 포함 확인.
- 변경: `neolbi-motion.js` groom 후드 10rad/s 까닥임, 리들리·베이치 손으로 머리 정돈(`rig.js` OWN_GROOM, `species-rig.js` 베이치 오른손 머리 옆·정돈 중 오른팔 앞 그리기), `species-rig.js` litter 모드 팔(`litterUp`), `rig.js` 베이치도 litter 모드. 버전 0.6.34 / versionCode 51.
- 추가: 엘리시 두 갈래 생식엽·코로나 머리 잎 까닥임(`species-rig.js`), 잎응애(밀도 5 이상) 붙은 친구 공통 떨기(`rig.js` ITCH 7초, `scene.js` itch 전달).
- 추가 2: 베이치 팔 항상 몸 뒤·머리 뒤 긁적이기(손끝만 정수리 옆, 머리 기울임 .07)·팔 길이 제한 7.2, 엘리시 생식엽 누끼 다시 따기(`tools/refine-ellisii-fronds.py`, 500×659 좌우 레이어, `ELLI.frondRect`), 초상화 재굽기.
- 검증: `npm test` 276/276, `npm run test:ui` PASS, 영상 `docs/qa-0.6.33/runtime/groom-litter.mp4`. 실기기 미검증.
- 병합·릴리스: PR #34(https://github.com/sia080808-lgtm/Forest-of-Space/pull/34) main 병합 `222c0c05378d6f59b8a9eb4dc43c26f449231eb4`(사용자 "ㄱㄱ"; head `f47bd26` 기준 simulation·CodeQL 성공). 프리릴리스 v0.6.34 `Forest-of-Space-0.6.34.apk` 40,721,830 bytes, SHA-256 `73b58e977775a935ee1f4a20bdc6ec81156ca4e1bd29a13de5f514a0a0f70ca4` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode51/0.6.34, APK 안 engine.js VERSION 0.6.34·엘리시 좌우 생식엽 PNG 2개·잎응애 떨기(`NO_ITCH`) 포함 확인.

### SRS-2.27-20261118 — 0.6.30~0.6.34 변경을 SRS에 반영 (문서만)

- 담당: Claude Code. 요청: 사용자 "업데이트 한 것들 srs에 적용 ㄱㄱ". 기준 main `222c0c0`(0.6.34 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 새 문서: `docs/Forest-SmallNeighbours-SRS-v2.27.md`/`.pdf`(v2.25 대체), `docs/Forest-World-Motion-SRS-v2.27.md`/`.pdf`. PDF는 `tools/build-srs-pdf.cjs`로 만들고 쪽 그림을 확인했다.
- 감로 재측정: `tools/honeydew-review.cjs`(0.6.34 코드) C01 3/8·C02 3/8·C04 5/8 개미 지킴(합계 11/24).
- 코드·버전 변경 없음. 제품 테스트는 새로 돌리지 않았다(문서만, 직전 0.6.34 결과 276/276).
- 병합: PR #35(https://github.com/sia080808-lgtm/Forest-of-Space/pull/35) main 병합 `101f2b8f4d9e56354c260488a759f26c1abc0a37`(사용자 "ㄱㄱ"; head `93650d8` 기준 simulation·CodeQL 성공). 문서만이라 앱 버전·APK는 0.6.34 그대로.

### CREVICE-0.6.35-20261118 — 바위틈 쉬는 자리를 돌 바로 앞으로, 틈에 쏙 들어가 쉬기

- 담당: Claude Code. 기준 main `101f2b8`(SRS v2.27 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 요청: 사용자 실기기 화면 "바위틈에 있지 않은데 바위틈에 쉬고있다고 뜸"(코로나가 바위틈 아래 이끼 위에 있음).
- 원인: `objects.js` `region('crevice')`가 기준점 +0.07의 빈 바닥이었다(돌 그림은 기준점 위). 이끼가 그 아래에 있는 배치에서 이끼 위에서 '바위틈에서 쉬는 중'이 됨.
- 수정: 쉬는 자리를 돌 바로 앞(+0.003, +0.03, 0.07×0.015)으로. 버전 0.6.35 / versionCode 52. SRS `docs/Forest-World-Motion-SRS-v2.27.md` W27-02에 행 추가.
- 검증: `npm test` 277/277(`rest-spots` 바위틈 5종 검사), `npm run test:ui` PASS, 전후 비교 `docs/qa-0.6.35/runtime/crevice-rest.png`(`tools/crevice-review.cjs`). 다 자란 슈퍼범의 바위틈 용량 초과는 수정 전과 같음(확인). 실기기 미검증.
- 추가(사용자 "바위 틈에 쉬는 연출 저게 맞음?" → 선택 "틈에 쏙 들어가기"): `scene.js` `nookPos`·`creviceFront`·`creviceGeom` — 도착해 쉬는 친구를 틈 입구로 0.6초에 걸쳐 옮겨 그리고 앞 작은 돌(타원)을 다시 그림. 렌더 전용. `rock-rider.test.cjs`에 검사 추가. `npm test` 278/278.
- 추가 2: 작은 돌 다시 그리기를 실제 윤곽 다각형(`nookStone`)으로, 틈에 있는 친구는 작은 돌 영역·그 아래를 잘라 그림(`nookClip`) — 사용자 제보 "검정색 조각"(돌 아래 발 끝, 경계의 틈 그늘 줄).
- 추가 3: 슈퍼범 둥지 물 증발(샘물과 같은 식, 비·안개·눈·쉼터 안 제외, `ledger.evaporation`)과 몸 물 45 미만일 때 스스로 마시기(분당 3, 55까지) — `social.js` `nest`, 사용자 선택 "증발 + 스스로 마시기". SRS `Forest-Superbum-SRS-v2.26.md` SB-04a. `npm test` 279/279, UI PASS. 엔진 측정 2시드·6게임일: 기본 기후에서는 비가 다시 채워 마른 그림까지는 내려가지 않음.
- 병합·릴리스: PR #36(https://github.com/sia080808-lgtm/Forest-of-Space/pull/36) main 병합 `3267551f5190f99c97c64b22ddaf5cf7efda367f`(사용자 "ㄱㄱ"; head `0a0e911` 기준 simulation·CodeQL 성공). 프리릴리스 v0.6.35 `Forest-of-Space-0.6.35.apk` 40,721,830 bytes, SHA-256 `7946528de4d84971cee6e4dcdf0ab6f7a4fed6cd7ff443fd5c371471b80751e8` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode52/0.6.35, APK 안 engine.js VERSION 0.6.35·바위틈 `nookStone`·둥지 물 `NEST_EVAP` 포함 확인.

### TRAITS-DRAFT-20261118 — 친구별 종 특성표 초안 (문서만, 구현 전)

- 담당: Claude Code. 요청: 사용자 "엘리시의 경우 대가리에 누가 놀러옴?" → "ㅇㅇ 그리고 각 케릭터의 모티프 박쥐란의 특성에 맞게 … 특성표를 만들자". 브랜치 `claude/festive-curie-mjk5mw`(main `3267551` 이후).
- 문서: `docs/Forest-Species-Traits-SRS-v2.28-DRAFT.md`·`.pdf`(3쪽). 실제 박쥐란 7종 특징 근거, 배율 표(잎응애·솜깍지 붙음/늘어남, 물 흡수·보관·강한 햇빛, 잎 손상, 과습, 바람, 추위·비 기분, 맑은 날 체력), 카드 문구, 연결 위치, AC 계획.
- 코드 변경 없음. 사용자 확인(배율 값, 날씨 기분 새 규칙 여부, 카드 표시 위치) 뒤 구현.

### TRAITS-0.6.36-20261118 — 친구별 종 특성 구현 (SRS v2.28)

- 담당: Claude Code. 요청: 특성표 초안 → 사용자 "엘레판은 탱커 역할인데 너무 약골"(탱커로 수정) → "ㄱㄱ". 기준 main `3267551`(0.6.35 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 변경: 새 `traits.js`(배율표·문구, 저장 안 함), `creatures.js`(잎응애·솜깍지 출현 확률, 잎응애 증가, `harm` 잎 부담; `candidates`·`harm` 내보냄), `engine.js`(물 소모·강한 햇빛·흡수, 추위·비 기분, 맑은 날 체력, 엘레판 탱커 기분), `weather-care.js`(과습·바람), `forest-app.js`·`forest.css`(타고난 특성 칸·도감 대화 상자), `index.html`·`stage2-review.html`·`tools/ui-smoke.mjs`(스크립트). 버전 0.6.36 / versionCode 53. SRS 초안 → `docs/Forest-Species-Traits-SRS-v2.28.md`·`.pdf`(ST-07 측정 추가).
- 검증: `npm test` 286/286(`traits.test.cjs` 7, `weather-care` 2건 기대값을 리들리 배율로), `npm run test:ui` PASS. `tools/traits-review.cjs` 전후 비교(`docs/qa-0.6.36`). 실기기 미검증.
- 남은 일: 친구 여럿·거친 날씨 장기 측정, 날씨 기분 크기 체감 조정.

- 0.6.36 병합·릴리스: PR #37(https://github.com/sia080808-lgtm/Forest-of-Space/pull/37) main 병합 `b83a5f45b2a47145fd9f6de9b1a35b55fef02e5f`(사용자 "ㄱㄱ"; head `bf1a1d9` 기준 simulation·CodeQL 성공). 프리릴리스 v0.6.36 `Forest-of-Space-0.6.36.apk` 40,725,992 bytes, SHA-256 `cf7631ac1cc68f5c601e6f35daa719d60d5ef0bbfc894c76d183208ae301cc15` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode53/0.6.36, APK 안 `traits.js` 포함.

### CREVICE-ONE-0.6.37-20261119 — 바위틈 한 친구씩, 쓸 수 없게 된 자리 5초 제한

- 담당: Claude Code. 기준 main `b83a5f4`(0.6.36 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 요청: 사용자 제보 "베이치가 바위틈으로 향하고 있어요 상태로 가만히 있음(바위틈엔 코로나) … 코로나가 나오니 엘리시가 바위틈으로 감, 베이치는 그대로".
- 원인 판단(코드 경로): 0.6.35의 좁은 바위틈 자리에 두 친구가 동시에 배정되면 서로 몸으로 길을 막아 뒤 친구가 멈추고, 포기 후 다시 바위틈을 고르는 반복. 사용자 장면을 엔진에서 그대로 재현하지는 못함.
- 변경: `objects.js` `option()` 바위틈 한 친구씩(다른 친구의 바위틈 과제가 있으면 capacity), `move()` 도착했으나 쓸 수 없는 자리 5초 뒤 과제 내려놓기(`t.unfit`). 버전 0.6.37 / versionCode 54. SRS World-Motion W27-02 한 줄 추가.
- 검증: `npm test` 287/287(`rest-spots` 바위틈 한 친구 검사), `npm run test:ui` PASS. 엔진 스캔(친구 5명·이끼를 바위틈 아래에 둔 배치·10시드×3게임일, 최종 코드) "향하고" 15초 정지 0건. 실기기 미검증.

- 병합·릴리스: PR #38(https://github.com/sia080808-lgtm/Forest-of-Space/pull/38) main 병합 `4ea1ead6a326bb6519a9a3007b7d1f7a14a65ac3`(사용자 "ㄱㄱ"; head `5962ace` 기준 simulation·CodeQL 성공). 프리릴리스 v0.6.37 `Forest-of-Space-0.6.37.apk` 40,725,992 bytes, SHA-256 `28e930da4de9640baaf1803b744219da6992a82b768642096bbb265f5b1cda7e` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode54/0.6.37, APK 안 engine.js VERSION 0.6.37·objects.js `t.unfit` 포함 확인.

### TRAITS-GROUP-SRS-20261119 — 친구 6명 특성 측정·SRS 정리 (문서·도구만)

- 담당: Claude Code. 요청: 사용자 "ㄱㄱ"(남은 일: 친구 여럿 측정) → "관련내용 SRS도 정리해줘". 기준 `ee2ab1e`(0.6.37 병합 후), 브랜치 `claude/festive-curie-mjk5mw`.
- 측정: `tools/traits-group-review.cjs`(6종 한 정원, 기후 C01~C04 × 3시드 × 3게임일, 날씨 기분을 끈 비교) → `docs/qa-traits-group/*.json`. 지침 0, 엘레판은 서늘한 숲(C03)에서 기분 −15(최저 51), 추위는 C03에서만 발생, 마른 숲에서 물 보관 차이 뚜렷. 수치는 바꾸지 않음.
- SRS: `docs/Forest-Species-Traits-SRS-v2.28.md`·`.pdf` ST-07b 추가·ST-08 갱신. `docs/Forest-World-Motion-SRS-v2.27.md`·`.pdf` 0.6.37(바위틈 한 친구, 도착했지만 쓸 수 없는 자리 5초 제한)·머리 버전 갱신.
- 코드·앱 버전 변경 없음(APK 0.6.37 그대로). 제품 테스트는 새로 돌리지 않음(문서·도구만, 직전 0.6.37 결과 287/287).
- 0.6.37 APK는 사용자에게 파일로 전달.
- 병합: PR #39(https://github.com/sia080808-lgtm/Forest-of-Space/pull/39) main 병합 `c2e20c693de9e6086b44cfe2eaf929bf77f90db5`(사용자 "ㄱㄱ"; head `41be9ad` 기준 simulation·CodeQL 성공). 문서·도구만이라 앱 버전·APK는 0.6.37 그대로.
- 사용자 결정(2026-11-19): 서늘한 숲(C03)에서 엘레판 기분이 떨어지는 추위 약점은 그대로 둔다("약점 하나정도는 있어야지"). 추위 배율 −1.5 유지.

### NEIGHBOURS-SHELTER-0.6.38-20261119 — 슈퍼범 쉼터, ECO-13 옮겨 붙기·공중 전이, 어린 단계 그림, 돌돌이 말림

- 담당: Claude Code. 요청: 사용자 "1. 수퍼범도 쉼터 들어갈 수 있음. 자리차지는 엘레판이랑 같음. 2. 두리는 차차 하도록 하고 3. 3번부터 6번까지 하도록 하자". 기준 main `c2e20c6`(PR #39 병합) + 작업 브랜치 `fb94cc6`, 브랜치 `claude/festive-curie-mjk5mw`.
- 변경:
  - `shelter.js`: 슈퍼범 점유 4/5/6/8·예상치 8, 쉼터 윤곽은 `PROFILES.superbumHuddle`(웅크린 자세 실제 렌더에서 굽기, `tools/bake-superbum-profile.cjs --huddle`).
  - `superbum.js` `huddle`(둥지잎 0.85배·10px 내림, 옆잎 오므림, 옆잎 위 끝 잘라 그리기), `rig.js` 전달, `scene.js` 쉼터 단계(entering/restingInside/exiting)에서 0.6초 전환.
  - `creatures.js`: `contactStep`(ECO-13 잎응애·솜깍지, 30초 접촉→60초마다 20%×특성, 최대 2, 같은 짝 120초), `flyStep`(성충 16 이상·300초마다 20%·0.45 안·최대 2), 날아온 무리 270초 유예, 검증·저장(`touch`·`touchRest`·`from`·`flyAt`).
  - `creature-art.js`·`scene.js`: 어린 단계 그림 5종 표시, `pillbugCurl`(돌돌이 0.7초 말림). 그림 `tools/draw-immature.cjs`.
  - 버전 0.6.38 / versionCode 55. SRS: `Forest-Superbum-SRS-v2.26` SB-06·AC, `Forest-SmallNeighbours-SRS-v2.27` NB-11(·PDF).
- 판단: 공중 전이 처음 값(성충 8·120초)은 친구 1명 12시간에 6~13번 퍼져 리들리 평균 몸 물이 1~4 낮아져서 16·300초로 줄였다(0~2번, 몸 물 이전과 비슷). ECO-13 "같은 짝 120초 재판정 안 함"은 '성공 뒤 120초'로 해석.
- 한계: 웅크린 슈퍼범도 엘레판보다 넓어 기본 쉼터에서 다 자란 리들리와 함께 들어가지 못함(넓힌 쉼터부터). 기존 테스트 3건은 의도 유지 조정(superbum EC02·제자리 쉼, creatures 출현 간격에서 옮겨 붙은 무리 제외).
- 검증: `npm test` 295/295, `npm run test:ui` PASS. 렌더 `docs/qa-0.6.38/runtime`(상태 불변 확인), 측정 `docs/qa-0.6.38/pest-spread.json`. Android 실기기 미검증.
- 대기: 두리 전용 그림(사용자 "차차").
- 병합·릴리스: PR #40(https://github.com/sia080808-lgtm/Forest-of-Space/pull/40) main 병합 `dd21c137507722d4c82fe9f3e87e58aff1672ea4`(사용자 "ㄱㄱ"; head `a2572f8` 기준 simulation·CodeQL 성공). 프리릴리스 v0.6.38 `Forest-of-Space-0.6.38.apk` 40,849,372 bytes, SHA-256 `3251e8c1abc6ea81e009851b7ca976204cedbdd0fbc5e336ae4d228e2dfe8646` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode55/0.6.38, APK 안 engine.js VERSION 0.6.38·creatures.js `contactStep`/`flyStep`·어린 단계 PNG 5개 포함 확인. APK는 사용자에게 파일로 전달.

### MAP-WIDE-DRAFT-20261119 — 넓은 숲(맵 1.5배) 기획 초안 (문서만, 구현 전)

- 담당: Claude Code. 요청: 사용자 "친구 수십명일 때를 대비하여 난 맵을 넓힐 거임. 전체 크기를 넓히는 거지" → 선택(가로·세로 1.5배, 바닥 그림만 이어 그리기) → "기획해봐", "군데군데 고사리화풍들이 있었으면", "화면 기본 디폴트 배율은 지금 설정된 화면 크기가 디폴트고 거기서 줌인 줌 아웃 가능. 그리고 기본 디폴트 배율에서 화면 드래그로 보기 가능".
- 문서: `docs/Forest-Map-Expansion-SRS-v2.29-DRAFT.md`·`.pdf`. 핵심: 기존 정원 좌표(0~1)를 그대로 두고 세계를 −0.25~1.25로 넓힘(저장 이전·거리 상수 변경 없음), 경계 하드코딩 위치 목록(spatial·litter·engine·shelter·objects·camera·scene·recruitment), 카메라(기본 = 지금 크기, 줌인·줌아웃·기본에서 끌어 보기), 넓은 바닥 그림·고사리 덤불, 낙엽 6×5칸, 성능 측정 기준, 작업 순서.
- 코드 변경 없음. 결정 대기: 고사리 덤불 장식만/쉼 자리 겸용, 낙엽 양 면적 비례 여부, 버전 0.7.0/0.6.39.

### WIDE-FOREST-0.7.0-20261119 — 넓은 숲(맵 1.5배), 고사리 액자, 길찾기 성능

- 담당: Claude Code. 요청: 사용자 맵 넓히기 → 기획 → 결정("1. 장식만, 2 늘림, 3. 0.7 ㄱㄱ") → "시안 먼저" → 고사리 액자 의견 → 넓은 세계 구상(동 호수·남 바다·서 산·북 눈밭, 해금) → "ㄱㄱ". 1.5배 숲 둘레는 처음부터 열림(사용자가 이 질문에 답 없이 "ㄱㄱ", 친구 수 대비 목적에 맞춰 결정). 기준 main `dd21c13`(0.6.38), 브랜치 `claude/festive-curie-mjk5mw`.
- 변경:
  - 새 `world.js`(지역·범위·걷는 땅·입구, 캐시). `engine.js`(s.world, 좌표 검증·배치 범위), `spatial.js`(걷는 땅, 길찾기 타원·10명·A*), `shelter.js`(위치·대기 줄·모양 캐시), `objects.js`(넓힘 범위, 하루 낙하량 45/68/90·변환), `litter.js`(6×5칸·상한 90·`regrid`), `social.js`, `recruitment.js`.
  - `camera.js`(세계 범위, 기본 1, 줌아웃 `zMin`, 어디서나 끌기), `scene.js`(`drawFloor` 넓은 바닥·덤불 `FERNS`, `drawFrame` 화면 고정 고사리 액자, `shelterArt` 그림).
  - 그림 `tools/build-wide-garden.py` → `garden-wide.png`·`frame.png`·`ferns/fern-1~6.png`·`shelter-art.png`(원본 픽셀만).
  - `index.html`·`stage2-review.html`·`tools/ui-smoke.mjs`에 `world.js`.
  - 버전 0.7.0 / versionCode 56. SRS `docs/Forest-Map-Expansion-SRS-v2.29.md`·`.pdf`(초안에서 확정).
- 판단:
  - 친구는 사물 사이만 오가서 빈 새 땅 산책은 넣지 않았다(새 행동 규칙, 다음 과제).
  - 덤불은 바닥 층(깊이 가림 없음).
  - 길찾기 성능 문제는 0.6.33(친구 수 제한 해제)부터 있던 것을 함께 고쳤다(경로 결과 동일, 테스트 300 통과).
- 검증:
  - `npm test` 300/300(`wide-forest.test.cjs` 5 추가, 기존 6건 새 숫자로), `npm run test:ui` PASS.
  - 0.6.38 저장 6개 불러오기(낙엽·거름 보존, 좌표 그대로).
  - 렌더 `docs/qa-0.7.0/runtime`(상태 불변), 성능 `docs/qa-0.7.0/perf.md`(30명 평균 8.2ms, 50명 24.2ms).
  - Android 실기기 미검증.
- 남은 일: 빈 땅 산책, 덤불 흔들림, 지역 해금(v2.30), 실기기 메모리·성능.
- 병합·릴리스: PR #41(https://github.com/sia080808-lgtm/Forest-of-Space/pull/41) main 병합 `6f349ccd93d8ec403121ec8023a282189c128e16`(사용자 "rㄱ" = 한글 자판 "ㄱㄱ"; head `43cf663` 기준 simulation·CodeQL 성공). 프리릴리스 v0.7.0 `Forest-of-Space-0.7.0.apk` 47,182,627 bytes, SHA-256 `c5e300e2e67554f014b22e14625720dec4970b52c57bde4c0a6c1ea75a5f9e97` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode56/0.7.0, APK 안 engine.js VERSION 0.7.0·`world.js`·넓은 바닥·액자·덤불·쉼터 그림 포함, index.html에 world.js. APK는 사용자에게 파일로 전달.

### ANT-COLONIES-0.7.1-20261119 — 짐꾼개미 군락 (SRS v2.30)

- 담당: Claude Code. 기준 main `6f349cc`(0.7.0 병합) + 작업 브랜치 `471d4e5`, 브랜치 `claude/festive-curie-mjk5mw`.
- 요청: 사용자 "개미는 안 없어지나? 계속 있네" → 개선안 논의("2번은 좋은데", "리들리와의 연관성은 좋음", 리들리마다 군락·숲 3개) → "2번으로 ㄱㄱ"(둥지 간격 0.5).
- 변경:
  - `creatures.js`: `ANT` 상수, 군락(`host`·`away`·`hungry`), `antActive`(낮·비/눈 아님·바람 60 미만), `antSites`(건강한 리들리·자기 군락 없음·둥지 0.5 간격·떠난 자리 하루 제외·둘레 0.3 안 낱잎 3장), `antArrivals`(8무리 상한과 따로, 180초 20%, 600초에 하나), `colonyStay`(리들리 없음·먹이 없음 하루 뒤 떠남, `antPause`), 운반은 낮·둥지 0.3 안만, 감로는 가장 가까운 군락, 기존 저장 개미를 가까운 리들리에 연결, 검증.
  - `scene.js`(쉬는 동안 일개미 숨김), `object-cards.js`(둥지 안에서 쉬는 중·군락 수), `forest-app.js`(도감 설명). 버전 0.7.1 / versionCode 57.
- 판단: 준비 시간은 밤·비에 그대로 두고, 맞는 리들리가 없으면 10배 느리게 줄인다(처음 연속 120초 방식은 리들리가 걸어 다녀 8시드 중 4시드만 왔다). 리들리 건강 조건은 기존 코드대로 몸 물(B) 35·체력 40이다(이전 문서의 '기분 35'는 코드와 달랐음).
- 검증:
  - `npm test` 306/306(`ant-colonies.test.cjs` 6 추가, `creatures` 운반 시드 1·5·7과 7,200초·떠남 조건, `soil-and-mealy` X04 개미에 리들리 연결), `npm run test:ui` PASS.
  - `engine` 12시간 검사: '몸 물 30 미만 10%'를 세 시드 평균으로 바꿨다. 시드 12가 0.189로 실패했다. 14시드 비교 0.7.0 평균 3.2%·0.7.1 6.7%, 0.7.1에 운반 규칙을 이전처럼 되돌린 실험에서도 시드 23·24가 22~30%라 개미 규칙이 아닌 시드 편차로 판단했다. 물 보존·최저 10 초과는 시드마다 유지.
  - 측정 `docs/qa-0.7.1/ant-colonies.json`(8시드 × 3게임시간): 리들리 1명 첫 군락 1,620~8,460초·8/8, 리들리 3명은 둘째 군락 1/8시드. 낙엽 보존 오차 0.
  - 화면 `docs/qa-0.7.1/runtime/ant-day-night.png`(렌더 전후 상태 동일). Android 실기기 미검증.
- 문서: `docs/Forest-Ant-Colonies-SRS-v2.30.md`·`.pdf`(3쪽), `docs/Forest-0.7.1-Release.md`.
- 남은 일: 빈 새 땅 산책(군락이 가운데에 몰림), 지역 해금 뒤 지역별 3군락 판정, 실기기.
- 병합·릴리스: PR #42(https://github.com/sia080808-lgtm/Forest-of-Space/pull/42) main 병합 `76963db2fbdf73e77bc1a5b9817b3a9607a3b54a`(사용자 "ㄱㄱ"; head `46ac7b2` 기준 simulation·CodeQL 성공). 프리릴리스 v0.7.1 `Forest-of-Space-0.7.1.apk` 47,182,627 bytes, SHA-256 `47b2942b5b0731b142dfef213756d6da9affbde6abf5e43202fbae220ddc69c4` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode57/0.7.1, APK 안 engine.js VERSION 0.7.1·creatures.js `antArrivals`/`colonyStay` 포함 확인. APK는 사용자에게 파일로 전달.

### SEASONS-DRAFT-20261119 — 사계절 기획 초안 (문서만, 구현 전)

- 담당: Claude Code. 요청: 사용자 "굶지마 투게더 앎?" → "계절순환, 지역별 특색 이런 거 가져오고 싶음" → 선택(계절당 3일, 기후 위에 계절, 계절 먼저·지역은 다음). 장르의 시스템만 참고하고 다른 게임의 캐릭터·그림·이름은 쓰지 않는다.
- 문서: `docs/Forest-Seasons-SRS-v2.31-DRAFT.md`·`.pdf`(3쪽). 달력(3,600초 계절·14,400초 한 해, 기존 저장은 불러온 순간 봄), 기후 4종 × 계절 4종 기온·비·눈 표, 낙엽 계절 배율, 작은 이웃 겨울잠·겨울 톡토기·봄 깨어남, 친구 성장, 화면(계절 표시·계절 색), 지역으로 잇는 구조, 수락 기준.
- 코드 변경 없음. 결정 대기: 친구 성장 계절 차이, 계절 그림 깊이(색만/새 그림), 겨울 난이도.

### SEASONS-0.8.0-20261119 — 사계절 (SRS v2.31)

- 담당: Claude Code. 요청: 사계절 초안(`SEASONS-DRAFT-20261119`) → 사용자 "1 적용, 2 계절별 그림 따로, 3 표대로 ㄱㄱ". 기준 main `76963db`(0.7.1 병합) + 작업 브랜치 `9390ab2`, 브랜치 `claude/festive-curie-mjk5mw`.
- 변경:
  - `environment.js`: 달력 `calendar`·`seasonFx`(기후 × 계절 표, 120초 섞임)·`weights`·기온·바람·여름 폭풍·계절 기록·`seasonProfile`(계절 색). 숨은 철 대체. 저장 `environment.calendar.start`.
  - `objects.js`: 하루 낙엽 계절 배율(올림), 검증 값 확장. `engine.js`: 성장 봄 1.25·겨울 0.75.
  - `creatures.js`: 겨울 개미 겨울잠·떠남 멈춤, 해충·천적 새 출현 없음, 겨울 톡토기(T 20·45%), 봄 깨어남.
  - `scene.js`: `seasonFiles`·`seasonal`(액자·덤불·잎 그늘 계절 그림, 120초 교차), 가을 낙엽 색. `index.html`·`forest-app.js`·`forest.css`: 계절 표시·설명.
  - 그림 `tools/build-season-art.py` → `assets/forest/seasons/*.png` 24장(원본 픽셀에서 잎 색만 바꿈, 겨울 눈 가장자리).
  - 버전 0.8.0 / versionCode 58. SRS `docs/Forest-Seasons-SRS-v2.31.md`·`.pdf`(초안에서 확정), 릴리스 노트.
- 검증: `npm test` 314/314(`seasons.test.cjs` 8, 기존 6건 조정), `npm run test:ui` PASS. 화면 `docs/qa-0.8.0/runtime`(상태 불변). 한 해 측정 `docs/qa-0.8.0/seasons*.json`. Android 실기기 미검증.
- 판단: 서늘한 숲 겨울 기분 평균 20(사용자 "표대로"로 유지). 바닥·쉼터 등은 계절 색만.
- 남은 일: 지역 해금·지역별 계절(v2.32), 바닥 계절 그림, 실기기.
- 병합·릴리스: PR #43(https://github.com/sia080808-lgtm/Forest-of-Space/pull/43) main 병합 `1d29a358d34e6c61ac7b9680b551fe8ff03cac2d`(사용자 "ㄱㄱ"; head `7c0e9d8` 기준 simulation·CodeQL 성공). 프리릴리스 v0.8.0 `Forest-of-Space-0.8.0.apk` 57,945,135 bytes, SHA-256 `4b65e658dc2d0d50969da98a625e9a6ef209955715630a4e2251287b696e5c89` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode58/0.8.0, APK 안 engine.js VERSION 0.8.0·계절 그림 24장·index.html 계절 표시 포함 확인. APK는 사용자에게 파일로 전달.
- 사용자 후속 질문(병합 직후): "계절별 맵 풍경도 바뀌어야 하지 않음?" — 바닥·쉼터·이끼·바위·샘터는 아직 계절 색만 받음. 다음 작업 후보로 안내.

### SEASON-LANDSCAPE-0.8.1-20261119 — 계절 풍경·발자국·계절 소리 (SRS v2.31 SE-16)

- 담당: Claude Code. 기준 main `1d29a35`(0.8.0 병합), 브랜치 `claude/festive-curie-mjk5mw`(WIP 커밋 `e783225`·`1d22597`·`1d341f1`·`a9585df` 포함).
- 요청 흐름: "계절별 맵 풍경도 바뀌어야" → 수묵화 색감·전체가 하나의 풍경 → "디폴트 배경 색 유지, 계절 느낌 구성(눈·새싹·단풍·은행)" → "지저분하지 않고 고요한 수묵화 힐링" → 봄 정리·겨울 새하얗게·오려 붙인 테두리 개선 → 겨울 숲 바깥도 흰색(방법1) → 겨울 발자국 → 눈·낙엽 발소리 → 계절별 배경음 → "ㄱㄱ".
- 변경: `tools/build-season-art.py`(수묵 담채 팔레트, 물체 그림 전부, 종이색 유지·겨울 종이색→눈), `tools/draw-season-props.cjs`(새싹 3·매화·단풍 2·은행 2·눈 더미 2), `scene.js`(`sa`·`seasonProps`·`seasonFall`·`snowCover`·`springSeason`·`footprint`·`drawPrints`, 숲 바깥 겨울 흰색, 계절 발소리), `environment.js`(계절 색 0), `audio.js`(`musicFor`, 계절 곡 6개), `tools/synth-season-bgm.py`(곡 합성·음량 맞춤), `tools/season-review.cjs`. 버전 0.8.1 / versionCode 59.
- 검증: `npm test` 317/317(`season-landscape.test.cjs` 3 추가, `seasons`·`lifecycle` 조정), `npm run test:ui` PASS. 화면 `docs/qa-0.8.1/runtime`, 음악 미리듣기 `docs/qa-0.8.1/season-music-preview.mp3`. 소리는 사람이 듣지 않음(음량·길이만). Android 실기기 미검증.
- 봄 다듬기(사용자 "수묵화 벚꽃", "저 벚꽃나뭇가지 없애", "고사리 너무 형광색", "벚꽃잎이 너무 많아·너무 큰 것", "분홍 점을 응용해 꽃이 군데군데 핀 느낌", "쉘터 위 분홍 점 지우고 꽃더미가 핀 것처럼", "다른 오브젝트들도 퍼스펙티브 고려해서 벚꽃이 덮혔으면"): 화면 고정 벚꽃 가지 삭제, 봄 팔레트 쑥색(색상 80·채도 ≤0.2·밝기 0.95), 벚꽃잎을 윤곽선 없는 번진 담채로 다시 그림, 흩날리는 꽃잎 14→5장·바닥은 낙엽 자리 셋 중 하나·크기 축소, 고사리 액자처럼 분홍 점이 핀 풀포기(`bloom-1~3`)를 물체 밑동 둘레에(`bloomSpots`, 사용자 "잡초들은 오브젝트들 주위에 자연스럽게"), 물체 그림의 봄 꽃 점 대신 겨울 눈과 같은 원근 판정(`surface`)으로 하늘을 향한 면에 윤곽선 없는 벚꽃잎을 적당히 덮음(쉼터 지붕 테두리 꽃 덤불은 사용자 "테두리만 꽃 두름"으로 뺌).
- 가을 다듬기(사용자 "봄은 킾, 가을 보자" → 제안 1~4 "ㅇㅇ"): 물체 하늘 면에 원근 판정으로 가을 잎(`spring_growth(autumn=True)`, 봄보다 적게, 주홍·적갈·황토·은행 노랑), 바닥 흩뿌림 없애고 물체 밑동 둘레 타원(`leafRing`, 사용자 "오브젝트들 주위로")에 7~9장, 떨어지는 잎 7→4장, 단풍·은행잎을 윤곽선·잎맥 없는 담채로, 게임 낙엽 색조 낮춤, 쉼터 풀 황토·적갈(색상 39 이상 진한 풀), 액자 고사리 색상 24~42(분홍기 없음).
- 겨울 강수 모두 눈(`SEASON_FX` 겨울 snow 1, 마른 숲 rain 0; 사용자 "1번"), 겨울 몸 물 측정 이전과 같음(평균 44~55, 30 미만 0%). 봄·가을 비바람 잎 날림 `gust()`와 불규칙한 비(`world-effects.js` rain), 사용자 "정갈하게 떨어지지 말고". 영상 `docs/qa-0.8.1/runtime/rain-wind.mp4`. CodeQL 지적(안 쓰는 흩뿌리기 루프) 제거.
- 남은 일: 지역 해금·지역별 계절(v2.32), 실기기 성능·APK 용량, 곡 실제 청취 피드백.
- 병합·릴리스: PR #44(https://github.com/sia080808-lgtm/Forest-of-Space/pull/44) main 병합 `bbfc27578baf4ccb87cb66569a41e0a45b4ab296`(사용자 "좋네, 이대로 ㄱㄱ"; head `d1fbef0` 기준 simulation·CodeQL 성공. 기능 테스트가 5분 제한에 걸려 취소돼 `tests.yml` 제한을 10분으로 늘림). 프리릴리스 v0.8.1 `Forest-of-Space-0.8.1.apk` 68,278,580 bytes, SHA-256 `c304d4c852b0bee505c23b64b3ba1804e323899b4e59d6aaf9fb63b82a67b4f7` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode59/0.8.1, APK 안 engine.js VERSION 0.8.1·계절 그림·소품(`bloom-1` 등)·계절 곡 6개·`gust`/`leafRing` 포함, 벚꽃 가지 그림 없음 확인. APK는 사용자에게 파일로 전달.

### UI-0.8.2-20261119 — 화면 정리: 조경 모드 삭제, 보기 아이콘, 잠깐 뜨는 안내, 친구 수

- 담당: Claude Code. 기준 main `bbfc275`(0.8.1 병합) + 작업 브랜치 `f67fc5e`, 브랜치 `claude/festive-curie-mjk5mw`.
- 요청: 0.8.1 실기기 화면 제보 6건(계절 칩 안 보임, 조경 모드 삭제, 작은 투명 아이콘으로 전체 보기·기본 배율, '6/5', 함께 지낼 명단 필요성, 안내 문구 5초·하단 가운데).
- 변경: `index.html`(모드 버튼 삭제, `.view-buttons` 두 아이콘), `forest-app.js`(`viewButtons`, `home-view`, 불러올 때 조경→게임, 안내 `hintMsg`/`hintUntil` 5초, 'n명', 명단 칸·`plan-roster` 처리 삭제), `forest.css`(계절 칩 글자색, 아이콘, 안내 하단 가운데·사라짐), `shelter.js` `projectedNeed`(정원 친구 전원 + 예전 명단). 버전 0.8.2 / versionCode 60.
- 판단: 함께 지낼 예정 명단은 쉼터 확장 판단에만 쓰였다. 친구 수 제한이 없어진 뒤로는 정원 친구 전원을 다 자란 크기로 세는 쪽이 맞아 화면을 없앴다(저장 값은 그대로 두고 계산에 함께 넣음). 엔진의 조경 모드 처리(`s.mode==='landscape'`)는 저장 호환을 위해 남겨 두고, 앱에서 불러올 때 게임으로 바꾼다.
- 추가 요청("확대 축소 버튼은 한 개로", "봄 1일째는 타이틀 옆으로", "스크린샷 카메라 버튼 … 버튼들은 안 찍히게"): 보기 버튼 하나(전체 보기↔기본 배율, `viewButtons`), 계절 칩을 `.title-row`로, 사진 `takePhoto`(캔버스만 PNG, 찍는 순간 선택 링 제외, 셔터 번쩍임), Android `LocalBridge.savePhoto`(MediaStore `Pictures/여백의 숲`, 권한 없음, 실패 시 항목 삭제, 이름 검사).
- 검증: `npm test` 317/317, `npm run test:ui` PASS(`tools/ui-smoke.mjs` 보기 버튼 하나·사진이 상태와 선택을 바꾸지 않음·조경 버튼 없음·명단 칸 없음으로 갱신), `MainActivity.java` javac(Android 15 API) 컴파일 확인, Chromium 화면·실제 저장된 사진 `docs/qa-0.8.2/runtime`(`tools/ui-review-082.cjs`). Android 실기기(갤러리 저장 포함) 미검증.
- 병합·릴리스: PR #45(https://github.com/sia080808-lgtm/Forest-of-Space/pull/45) main 병합 `9c24cc50365ac9b208ce34c1d9847f0eb164ea7a`(사용자 "ㄱㄱ"; head `a6a1829` 기준 simulation·CodeQL 성공). 프리릴리스 v0.8.2 `Forest-of-Space-0.8.2.apk` 68,278,580 bytes, SHA-256 `7a5e6e6240ad811f0c3b07e31e30b4caf750c7c3fd7b7416db5785463eb8c0d9` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode60/0.8.2, APK 안 engine.js VERSION 0.8.2·index.html 사진 버튼(조경 버튼 없음)·classes.dex `savePhoto` 포함 확인. APK는 사용자에게 파일로 전달.

### SHELTER-SLEEP-0.8.3-20261119 — 밤 잠·비 피하기, 길을 못 찾고 멈추던 문제

- 담당: Claude Code. 기준 main `9c24cc5`(0.8.2 병합) + 작업 브랜치 `a1bbfc2`, 브랜치 `claude/festive-curie-mjk5mw`.
- 요청: "케릭들 쉼터에 쉬러 잘 안 가던데 이유가 있음?" → 측정(쉼터 안 17%, 밤 18%; 지쳐서 쉬는 경우 0, 강풍 23번, 나머지는 자유 방문) → 방안 1~3 "ㄱㄱ". 실기기 화면 "애들 길 못 찾아서 멍하게 있음" → "분석 끝나고 디버깅해".
- 변경: `objects.js`(`sleepTime`·`rainy`, 선택 분기 sleep/shelterRain·쉼터 +40·종 특성 rain>0은 큰비만·슈퍼범/엘레판 곁 제외, 꽉 찬 쉼터 8초 뒤 포기·`restCooldown` 120, 자유 방문 쉼터 절반, `objectDebug` 빈 점수 제외, `dep` traits), `spatial.js`(모든 장애물 안에서 걸어 나오기, 쉼터 벽 안에서 걸어 나오기 `walkable(...,walls)`), `shelter.js`(자고 있어요·비를 피하고 있어요 문구). 버전 0.8.3 / versionCode 61.
- 판단: 샘터 돌 테두리·쉼터 벽 판정·엘레판 잎 둘레 안에 선 친구는 출발점이 막혀 모든 길이 실패했다(바위·바위틈·잎 그늘 줄기만 탈출 규칙이 있었음). 사용자 화면(엘리시, 잎 그늘 옆)과 똑같은 저장은 재현하지 못했고, 같은 상태 문구가 나오는 경로를 시뮬레이션으로 찾아 고쳤다. 비를 좋아하는 종이 비마다 쉼터에 들어가면 리들리 곁 개미 군락이 줄어서(8시드 중 5) 종 특성으로 보슬비는 맞게 했다(6/8, 변경 전과 같음).
- 검증: `npm test` 321/321(`shelter-sleep.test.cjs` 4 추가, `creatures` 시드·개미 간격 분리, `shelter` SH-AC05 낮 시간), `npm run test:ui` PASS. 측정 `tools/shelter-sleep-review.cjs`(쉼터 안 17→31%, 밤 18→53%), `tools/blocked-path-review.cjs`(멈춤 2~3%→0.04%, 최대 850→21초). Android 실기기 미검증.
- 병합·릴리스: PR #46(https://github.com/sia080808-lgtm/Forest-of-Space/pull/46) main 병합 `8d2e98643ad17222ecaf6903c338bda37226b1f4`(사용자 "ㄱㄱ"; head `05c0ab1` 기준 simulation·CodeQL 성공). 프리릴리스 v0.8.3 `Forest-of-Space-0.8.3.apk` 68,282,676 bytes, SHA-256 `9af533e6d712a0fea9a232ddd032c96e273c359747bb04c1d58ce6e775f8ecb4` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode61/0.8.3, APK 안 engine.js VERSION 0.8.3·objects.js `sleepTime`·쉼터 잠 문구 포함 확인. APK는 사용자에게 파일로 전달.

### WINTER-RESCUE-0.8.4-20261120 — 겨울에 비가 오던 문제

- 담당: Claude Code. 기준 main `8d2e986`(0.8.3 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 요청: 사용자 "날씨가 바뀌는 로직은 어케 됨. 아까부터 계속 흐림이라서" → 설명(120~240초마다, 같은 날씨 최대 2번 연속, 흐림 최장 약 8분, 앱을 연 동안에만 진행) + 찾은 버그(마른 숲 비 내려 주기가 겨울에도 비) → "1번만 ㄱㄱ"(흐림 줄이기는 하지 않음).
- 변경: `environment.js` `rescueKind`(겨울 눈, 비·눈 없는 계절은 없음), 눈도 물 타이머에 셈, 차례가 맞지 않는 계절이면 취소. 버전 0.8.4 / versionCode 62.
- 검증: `npm test` 322/322(`seasons` SE-0.8.4 추가), `npm run test:ui` PASS. 측정: 겨울 비는 가을에서 이어진 처음 최대 265초만, 겨울 몸 물 C01 46.2→45.1·C04 48.0→44.5(최저 24.8). Android 실기기 미검증.
- 병합·릴리스: PR #47(https://github.com/sia080808-lgtm/Forest-of-Space/pull/47) main 병합 `fe398798f292b95e1effb8b8c2a85e69daf7ecbb`(사용자 "ㄱㄱ"; head `917489f` 기준 simulation·CodeQL 성공). 프리릴리스 v0.8.4 `Forest-of-Space-0.8.4.apk` 68,282,676 bytes, SHA-256 `8b1472a8cb02777ae1bc05bfe952c6c565179d6c10d7e45fca07a22427d06ab6` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode62/0.8.4, APK 안 engine.js VERSION 0.8.4·environment.js `rescueKind` 포함 확인. APK는 사용자에게 파일로 전달.

### STROLL-0.8.5-20261120 — 빈 땅 산책, 숲 전체 눈·바람 잎, 고사리 액자 켜기/끄기

- 담당: Claude Code. 기준 main `fe39879`(0.8.4 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 요청: 다음 업데이트 후보 중 "1번 ㄱㄱ"(빈 땅 산책). 작업 중 추가: "나뭇잎 떨어지는 것도 전체 맵만큼", "맵 전체에 곤충들 뜰 수 있는 가능성 영역확장", "고사리 프레임 적용 온 오프".
- 변경: `objects.js`(`STROLL` 30%·0.25·15~30초, `strollTarget`·`stroll`·카드 문구, 끝난 자유 행동 뒤 정돈·산책, 같은 자리 이유 바꾸기, `p.stroll` 검증), `engine.js`(이동에 `Obj.stroll`, `settings.showFrame` 기본·검증), `world-effects.js` `particles(area)`, `scene.js`(눈·바람 잎·안개를 숲 전체에, 가을 잎 넓이 비례, `drawFrame` 설정), `forest-app.js`(설정 스위치). 버전 0.8.5 / versionCode 63.
- 판단: 곤충 출현 규칙에는 정원 범위 제한이 없다(숙주를 따름). 친구 잎 이웃이 가운데에 몰린 이유는 친구가 가운데에만 있어서였고, 산책으로 넓어졌다(바깥 22.1→24.8%). 별도 규칙은 바꾸지 않았다.
- 검증: `npm test` 326/326(`stroll.test.cjs` 4 추가, `creatures` 개미 시드 [5,7,9]), `npm run test:ui` PASS. 측정: 바깥 땅 시간 1.4→5.9%(낮 1.8→10.6%), 개미 군락 한 해 6/8→8/8. 화면 `docs/qa-0.8.5/runtime`. Android 실기기 미검증.
- 병합·릴리스: PR #48(https://github.com/sia080808-lgtm/Forest-of-Space/pull/48) main 병합 `d5cc0519d4dae9fa8e0b76a542a1abe791a3a12f`(사용자 "ㄱㄱ"; head `c5545b4` 기준 simulation·CodeQL 성공). 프리릴리스 v0.8.5 `Forest-of-Space-0.8.5.apk` 68,282,676 bytes, SHA-256 `c45cf50a6e491afdf4ca13b5f5040da8289b8aa2a1f61d75df9dbd014467e450` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode63/0.8.5, APK 안 engine.js VERSION 0.8.5·objects.js `strollTarget` 포함 확인. APK는 사용자에게 파일로 전달.

### CREVICE-ENTRY-0.8.6-20261120 — 바위틈에 걸어 들어가기, 네모 잘림

- 담당: Claude Code. 기준 main `d5cc051`(0.8.5 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 요청: "바위틈으로 들어갈 때 … 휘리릭 달려가면서 … 네모 이미지가 생성 … 다른 케릭터 들어갈 때도 그런가" → 분석·수정 → "ㄱㄱ".
- 원인: `scene.js` 0.6.35 틈 연출 — 0.6초 미끄러짐(쉬는 자세), 나올 때 순간 복귀, 돌 아래 바닥 띠 잘라내기(`nookClip`)와 작은 돌 덮기(`creviceFront`)가 들어가기 시작부터 적용돼 돌 앞 친구가 직사각형으로 잘림. 모든 종 공통.
- 변경: `this.nookS`(진행 0~1, 느린 걸음 속도 `GU*.6`로 들어가고 나옴, 걷기 모션·방향), 작은 돌은 발이 돌 아랫단 뒤일 때만, 바닥 띠 잘라내기는 다 앉았을 때만. 렌더 전용. 버전 0.8.6 / versionCode 64.
- 검증: `npm test` 326/326(`rock-rider` 갱신), `npm run test:ui` PASS, 전후 화면 `docs/qa-0.8.6/runtime`(`tools/crevice-entry-review.cjs`). Android 실기기 미검증.
- 병합·릴리스: PR #49(https://github.com/sia080808-lgtm/Forest-of-Space/pull/49) main 병합 `90c6c172f7f70ca11686f060c34ea7062e2b2bd1`(사용자 "ㄱㄱ"; head `191f6d6` 기준 simulation·CodeQL 성공). 프리릴리스 v0.8.6 `Forest-of-Space-0.8.6.apk` 68,282,676 bytes, SHA-256 `8f8b3442ba065574aaecd26d69d58c7383a996596e619328e3ce053de38b4daa` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode64/0.8.6, APK 안 engine.js VERSION 0.8.6·scene.js `nookS` 포함 확인. APK는 사용자에게 파일로 전달.

### SRS-2.32-20261120 — 0.8.2~0.8.6 변경을 SRS에 반영 (문서만)

- 담당: Claude Code. 요청: 사용자 "문서 정리부터 하고, 산책 동작 업데이트 한 뒤, 지역해금으로 가자". 기준 main `90c6c17`(0.8.6 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 새 문서: `docs/Forest-Life-SRS-v2.32.md`·`.pdf`(11쪽, `tools/build-srs-pdf.cjs`로 만들고 쪽 그림 확인). L32-01~10(원칙, 화면 정리, 밤 잠·비 피하기, 겨울 날씨, 빈 땅 산책, 곤충 출현 범위, 숲 전체 효과·고사리 액자, 바위틈 걸어 들어가기, AC↔테스트 12개, 남은 일). 비를 좋아하는 종 목록은 `traits.js`에서 확인(rain>0: 리들리·엘리시·코로나·슈퍼범).
- 코드·버전 변경 없음. 제품 테스트는 새로 돌리지 않았다(문서만, 직전 0.8.6 결과 326/326).
- 다음: 산책 동작 시안(사용자가 시안을 먼저 보기로 함) → 구현 0.8.7 → 지역 해금(동쪽 호수) 기획 초안.

### STROLL-POSES-0.8.7-20261120 — 산책지 가벼운 동작, 엘레판 걷는 방향

- 담당: Claude Code. 기준 main `90c6c17`(0.8.6 병합) + SRS v2.32 문서 커밋, 브랜치 `claude/festive-curie-mjk5mw`.
- 요청: "산책할 때 가벼운 모션들 먼저 업데이트 하자", "왼쪽으로 갈 땐 왼쪽 보고 오른쪽으로 갈 땐 오른쪽". 중간 결정: 주워 오기는 꾸미기 전용·나뭇잎 바구니(1번)·확률 25%+빈손 4번 보장·하루 3개 추천안(구현 전), 영상 시안은 만들지 않음("영상시안 만들지마"), 검사는 꼭 필요한 것만("검사 너무 오래걸려").
- 변경: `objects.js` `strollPose`(두리번·냄새·앉기·일어서기, 순수 함수)·카드 문구, `scene.js` 자세 적용(냄새=drink 리그+앞으로 기울임, 앉기=rest), 엘레판 잎 우산 아닐 때 걷는 방향 보기. 버전 0.8.7 / versionCode 65.
- 검증: `npm test` 327/327(`stroll` ST-05), `npm run test:ui` PASS(한 번), 화면 `docs/qa-0.8.7/runtime/stroll-poses.png`. 이후 로컬 검사는 바뀐 부분 관련 테스트만 돌리고 전체는 CI에 맡긴다. Android 실기기 미검증.
- 다음: 주워 오기·바구니 구현(사용자 확인 후), 지역 해금(동쪽 호수) 기획.
- 앉는 모습 추가(사용자 "엘리시 앉는 모션이 좋다고", "다른 애들도 엘리시처럼 앉으라고"): 리그 옵션 `sit`로 발은 땅에 두고 몸만 내려앉음(`scene.js` `v.sit` 0.6초 전환, `rig.js`·`species-rig.js`·`neolbi.js`·`superbum.js`). 처음 시도(바닥 기준 잘라 내기·다리 눌러 그리기)는 친구가 사라지거나 파묻혀 보여 버렸다. 화면 `docs/qa-0.8.7/runtime/stroll-sit.png`.
- 베이치 앉기(사용자 그림 지정 "얘는 이 모션을 앉은 모션으로 해"): 완전히 앉은 모습(3번째)은 사용자 그림처럼 발끝이 조금 보이는 깊이(1.3), 앉는 중·일어나는 중(2·4번째)은 그 중간 다리 길이. 검수 시트는 전환 중간(0.3초)에서 찍는다. 처음에 그림을 잘못 읽고 두 번 바꿨다.
- 리들리 앉는 중(사용자 "두번째 다리가 사라졌네"): 검수 시트가 앉는 중을 전환 62%, 일어나는 중을 38%에서 찍어 서로 달라 보였다. 둘 다 50%에서 찍게 바꾸고, 리들리 내려앉는 깊이를 95→70(리그 px)로 줄여 중간 단계에서 발이 조금 보이게 했다(완전히 앉으면 발은 가려짐).
- 엘리시 앉는 중(사용자 "엘리시 두번째 모션도"): 엘리시는 자기 쉬기 자세(`rest`)를 바로 1로 써서 앉는 중부터 다 앉아 있었다. 산책 앉기 동안에는 전환 값 `sit`을 엘리시의 `rest`로 넘겨 다른 친구와 같이 0.6초에 걸쳐 내려앉는다. `ellisii-legacy`·`stroll` 10/10.
- 냄새 맡기 까닥임(사용자 "킁킁 할 때 살짝 까닥거리는 거 어떰?"): 1.1초마다 0.45초 동안 작게 세 번 까닥(킁킁킁) 뒤 쉼, 기울임은 보는 방향을 따름(`scene.js`). 조트로프는 저장소 밖(스크래치)에서만 확인.
- 병합·릴리스: PR #50(https://github.com/sia080808-lgtm/Forest-of-Space/pull/50) main 병합 `02fe5bc653ea6d7fff9d11128fbd6f38145ce324`(사용자 "ㄱㄱ"; head `956d873` 기준 simulation·CodeQL 성공). 프리릴리스 v0.8.7 `Forest-of-Space-0.8.7.apk` 68,596,148 bytes, SHA-256 `45cb6f39bae7f7525bdd25b54bf98e2dd83c741c98110b1989e4e91955d9bd18` — 내려받은 파일·`.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode65/0.8.7, APK 안 engine.js VERSION 0.8.7·`strollPose`·베이치 앉기 값 포함 확인. APK는 사용자에게 파일로 전달.
- 다음: 동쪽 호수 지역. 인게임 시안 2장(경계·호수, 스크래치에서만 만듦, 저장소 미포함) 사용자 확인 중. 결정 대기: 해금 방법, 처음부터 다 열지, 새 친구 종.
- 호수 시안 결정(사용자): 물가는 번지는 수묵 담채(또렷한 먹선 물가 시안은 버림), 연잎은 수채, 연꽃은 크게, 징검돌·가운데 섬은 없앰, 호수 동쪽은 지역 끝까지 물("이쪽까지 다 물로"). 이후 맵이 더 넓어지면 잘린 호수가 동쪽으로 이어져 전체가 보이게 한다(사용자 "이건 염두") — 호수 그림·물 판정은 동쪽 끝이 잘린 채 다음 지역으로 이어 그릴 수 있게 만든다. 시안은 스크래치에서만 만들었고 저장소에 넣지 않았다.

### LAKE-DRAFT-20261120 — 동쪽 호수 지역 기획 초안 (문서만, 구현 전)

- 담당: Claude Code. 요청: "이제 영역 넓히자. 일단 호수지역" → 인게임 시안(번지는 물가·수채 연잎·섬 없음·동쪽 끝까지 물) → 수련 생애주기(물 위에 피는 꽃, 호수에서 무작위 생성) → "호수가 생물들도 좀 추가하자" → 후보 7종 "넣어줘".
- 문서: `docs/Forest-Lake-SRS-v2.33-DRAFT.md`(LK-01~09: 위치·땅, 해금(결정 대기), 수련, 물가 이웃 7종(소금쟁이·물달팽이·올챙이→개구리·잠자리·물방개·송사리·장구벌레), 날씨·겨울 얼음, 친구 연결, 결정 대기, 작업 순서). 시안 그림은 스크래치에서만 만들었고 저장소에 넣지 않았다.
- 코드·버전 변경 없음(APK 0.8.7). 제품 테스트 실행 안 함(문서만).
- 다음: 물가 이웃 그림 시안(SRS 시트 화풍), 결정 대기(해금 방법·처음부터 다 열지·새 친구·가칭 이름).
- 호수 상호작용·이벤트 추가(사용자 "ㄱㄱ 4개 다 넣어줘"): LK-07에 기본 상호작용(물 마시기·발 담그기·수련 잎 그늘·바라보기·종별 반응·호수 주워 오기)과 이벤트 4개(개구리 깜짝·잠자리 날개돋이·여름밤 반딧불·겨울 얼음 놀이).
- 호수 해금 결정(사용자 "3번 ㄱ"): 숲 성장 조건을 채운 뒤 동쪽 끝 산책에서 발견(LK-03). 남은 결정: 처음부터 다 열지, 새 친구 종.

### LAKE-SHORE-0.9.0-20261120 — 동쪽 호수 물가 열기(1단계)

- 담당: Claude Code. 요청: 사용자 "일단 물가만 열고, 나중을 대비해서 연장 영역은 염두해서 제작. 물가를 좋아하는 새 친구는 추후에 ㄱㄱ". 기준 main `02fe5bc`(0.8.7 병합) + 작업 브랜치 문서 커밋, 브랜치 `claude/festive-curie-mjk5mw`.
- 변경: `world.js`(`lakeshore` 지역, `waterD`/`inWater`/`lakeOpen`/`lakeReady`/`lakeStep`, `world.lake` 검증), `spatial.js`(물 위 걷기 금지), `engine.js`(배치 검사, 틱마다 `lakeStep`), `objects.js`(준비되면 산책 35% 동쪽 끝, 카드 문구), `scene.js`(호수 바닥·겨울 얼음), `forest-app.js`(안내), 그림 `tools/build-lake-floor.py` → `assets/forest/lake/lake-floor.png`·`lake-ice.png`. 버전 0.9.0 / versionCode 66.
- 판단: 물 모양을 세계 좌표 식 하나로 두어 그림·판정이 같고, 더 동쪽 지역을 열면 그대로 이어진다. 그림은 처음부터 x 1.05~2.2를 덮는다.
- 검증: `lake.test.cjs` 3개, 관련 `wide-forest`·`stroll`·`package` 통과(전체는 CI). 측정: 친구 4명 시드 3개, 준비 3,600초 → 열림 3,813~4,032초. 화면 `docs/qa-0.9.0/runtime`(`tools/lake-review.cjs`). Android 실기기 미검증.
- 다음: 수련(무작위 생성·생애주기), 물가 이웃 7종, 상호작용·이벤트 4개, 물 마시기, 더 동쪽 호수 지역.
- 병합·릴리스: PR #51(https://github.com/sia080808-lgtm/Forest-of-Space/pull/51) main 병합 `1c4b770288509a4f6f1c3e856d546670f819b4ca`(사용자 "ㄱㄱ", 맵만; head `814913d` 기준 simulation·CodeQL 성공, CodeQL 안 쓰는 변수 9건 같은 PR에서 정리). 프리릴리스 v0.9.0 `Forest-of-Space-0.9.0.apk` 71,696,998 bytes, SHA-256 `c5ef9aac0260fefaf21ed83cf4524fa2cfdc794d4b6ed34171f5bb98232694ca` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode66/0.9.0. APK는 사용자에게 파일로 전달.
- 사용자 지시(2026-11-20): "진짜 필요한 테스트만해라" — 로컬은 바꾼 부분에 직접 닿는 테스트만, 전체는 CI, UI 검사는 화면 코드 변경 시만, APK 확인은 체크섬·인증서·버전만.

### WATERLILY-0.9.1-20261120 — 호수 수련

- 담당: Claude Code. 요청: 사용자 "수련부터 ㄱㄱ". 기준 main `1c4b770`(0.9.0 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 변경: `world.js`(`LILY`, `lilyStep`·`lilyStage`, `rng.lake`, `world.lake.lilies`·`nextLily`·`nextId` 검증), `scene.js`(`drawLilies`, 하루 리듬, 그림 6장 불러오기), 그림 `tools/draw-waterlily.py` → `assets/forest/lake/lily-*.png`. 버전 0.9.1 / versionCode 67.
- 검증: `lake.test.cjs` LK-04만 추가·실행(4/4), 전체는 CI. 화면 `docs/qa-0.9.0/runtime/lake-lilies*.png`. 실기기 미검증.
- 다음: 물가 이웃 7종, 상호작용·이벤트, 물 마시기.
- 관리자 해금(사용자 "일단 지금은 관리자 권한으로 해금 조건 푸는 설정 넣어줘"): 설정 > 개발 검수 '호수 물가 바로 열기'(확인 창, `World.openLake`). `lake.test` LK-05, UI PASS.
- 병합·릴리스: PR #52(https://github.com/sia080808-lgtm/Forest-of-Space/pull/52) main 병합 `7a139880d34c57fa8317a978e9fba4f6f6509c94`(사용자 "ㄱㄱ"; head `d79b33c` 기준 simulation·CodeQL 성공, 수련 그림 도구 CodeQL 지적 8건 같은 PR에서 정리). 프리릴리스 v0.9.1 `Forest-of-Space-0.9.1.apk` 71,840,893 bytes, SHA-256 `b5b60045bfdb53c1104111625fc4900ad5e07808af23a9af9dbc668375787cc2` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode67/0.9.1. APK는 사용자에게 파일로 전달.

### LAKE-LIFE-0.9.2-20261120 — 물가 이웃

- 담당: Claude Code. 요청: 사용자 "물가 이웃 ㄱㄱ" → 시안 조트로프(개구리 뛰기·장구벌레 꼬리·잠자리 애벌레 다리·물달팽이 몸 수정) → "ㄱㄱ게임에 넣어줘"(중간에 "동작 2개로 줄여줘" 뒤 "아니다 저대로 ㄱㄱ" — 6칸 유지). 기준 main `7a13988`(0.9.1 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 변경: `world.js`(`LIFE`, `lifeStep`, `world.lake.life`·`nextLife`·`nextLifeId` 검증), `scene.js`(`drawLakeLife`, 그림 10장 불러오기), 그림 `tools/draw-lake-life.py` → `assets/forest/lake/life-*.png`. 버전 0.9.2 / versionCode 68.
- 검증: `lake.test.cjs` LK-06 추가·실행(6/6), UI 검사(화면 코드 변경), 전체는 CI. 화면 `docs/qa-0.9.0/runtime/lake-life*.png`. 실기기 미검증.
- 다음: 물가 이웃 도감, 이벤트 4개, 물 마시기.
- 개구리 헤엄 추가(사용자 "개구리 모션 물에서 헤엄치는 것도 있어야 하지 않겠음?"): 헤엄 6칸 그림, 24초 주기로 앉기→뛰어들기→헤엄→돌아와 앉기(렌더 전용).
- 릴리스 빌드에서 전체 테스트 중복 실행 삭제(사용자 "웰케 오래걸려", "필요한 검사만 하라고"): `release-apk.yml`이 병합 뒤 PR에서 이미 통과한 전체 시뮬레이션·UI 테스트(약 7분)를 다시 돌리던 단계를 뺐다. main의 `tests.yml`과 CodeQL 확인은 그대로. 다음 병합부터 적용.
- 병합·릴리스: PR #53(https://github.com/sia080808-lgtm/Forest-of-Space/pull/53) main 병합 `8ccfd0caf92160cd88417b7090943a21ecd163d0`(사용자 "ㄱㄱ"; head `cd67bb2` 기준 simulation·CodeQL 성공, CodeQL 안 쓰는 반복 변수 2건 같은 PR에서 정리). 프리릴리스 v0.9.2 `Forest-of-Space-0.9.2.apk` 72,030,310 bytes, SHA-256 `f131739b7ec159fcfc9c9a805b64de1cb3a3cfa47e4b66dae87f6f4dc34e1d04` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode68/0.9.2. APK는 사용자에게 파일로 전달.
- 다음 패치에 함께(사용자 2026-11-20, "지금 수정하지 말고 다음 수정때"): 월드 화면 왼쪽 아래 가장자리에 걸친 노란 조각(잎 모양, 실기기 화면) 없애기. 원인 미확인 — 가을 잎·은행잎 소품이나 낙엽 그림이 화면 가장자리에 걸린 것으로 보임, 다음 패치 때 확인.
- 친구 표정(다음 패치): 베이치 얼굴을 몸 가운데로 내림(사용자 그림 지정, 둥근 눈·작은 입·털 눈썹, 표정 6가지 `faceExpr`). 코로나는 원래 얼굴 유지(사용자 "코로나는 기존을 유지해"). 놀람·미끄러짐 동작 초안(`startle`·`slip`: 베이치 손, 엘레판 후드)은 이벤트 작업 때 사용.

### LAKE-EVENTS-0.9.3-20261120 — 호수 이벤트 4개·친구별 반응·비 물결·베이치/코로나 얼굴

- 담당: Claude Code. 요청: "이벤트 4개 ㄱㄱ", 친구별 다른 반응, 얼굴 수정 여러 차례(베이치 사용자 그림·동그란 눈·웃을 때 입 없음·-_-·집중 작은 눈 / 코로나 사용자 지정 세로 눈 기본), "비 올 때 호수에도 빗방울 파형" → "ㄱㄱ". 기준 main `8ccfd0c`(0.9.2 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 변경: `world.js`(`FX`, `fxStep`: 개구리 깜짝·반딧불·얼음 기분·봄에 물가로, 날개돋이 아침·지켜보기·발견, `frozen`/`onIce`/`fireflies`/`reaction`, `world.lake.fx` 검증), `spatial.js`(언 호수 걷기), `objects.js`(겨울 산책 30% 얼음 위), `scene.js`(친구별 놀람·미끄러짐·바라보기, 개구리 퐁·물보라, 빗방울 물결, 반딧불 조명 뒤), `species-rig.js`(베이치·코로나 얼굴). 버전 0.9.3 / versionCode 69.
- 검증: `lake.test.cjs` LK-07 추가(7/7), `rig`·`stroll`(소스 검사 정규식 조정)·`render`·`package` 통과, UI PASS. 화면 `docs/qa-0.9.3/runtime`. 전체는 CI. 실기기 미검증.
- 미해결: 월드 왼쪽 아래 노란 조각 — 새 게임 봄 화면(액자 켜기/끄기)에서 재현 안 됨. 사용자에게 나타나는 상황(계절·확대·위치) 확인 필요.
- 다음: 물가 이웃 도감 칸, 물가에서 물 마시기, 주워 오기·바구니, 더 동쪽 호수, 물가를 좋아하는 새 친구.
- 병합·릴리스: PR #54(https://github.com/sia080808-lgtm/Forest-of-Space/pull/54) main 병합 `9008a9a4a2f209253cd81d496082dff4d858a8d6`(사용자 "ㄱㄱ"; head `431e0e7` 기준 simulation·CodeQL 성공. 첫 CI에서 `ellisii-legacy` 소스 검사가 엘리시 구간 주석의 "arms" 글자로 실패해 주석 문구만 고침). 프리릴리스 v0.9.3 `Forest-of-Space-0.9.3.apk` 72,038,502 bytes, SHA-256 `e81639dc9831d4ba34f3e280565503408ecb7ee864b66bd7546ed07adeee4001` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode69/0.9.3. APK는 사용자에게 파일로 전달.

### LAKE-GUIDE-DRINK-0.9.4-20261120 — 물가 이웃 도감, 물가에서 물 마시기

- 담당: Claude Code. 요청: 사용자 "1, 2 ㄱㄱ". 기준 main `9008a9a`(0.9.3 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 변경: `world.js`(`shorePoint`, `world.lake.seen` 기록·검증), `objects.js`(`lakeDrink`·`LAKE_DRINK`: 물가가 가깝거나 샘터가 비면 물가로 가는 산책 기록 `p.stroll.lake='drink'`, 도착하면 분당 10·65까지·최대 7분, `ledger.lake`; 카드 문구; 산책 자세 없음), `engine.js`(`ledger.lake` 검증), `forest-app.js`(도감 물가 이웃 7종, `lake-entry`), `tools/ui-smoke.mjs`(작은 이웃 10종 셈에서 물가 이웃 제외). 버전 0.9.4 / versionCode 70.
- 판단: 호수를 사물(patch)로 넣지 않고 산책 기록으로 물가까지 걸어가게 했다(배치·저장 구조를 바꾸지 않음). 호수 물은 무한이라 원장에 들어온 물로 기록.
- 검증: `lake.test.cjs` LK-08(8/8), 관련 테스트·UI PASS, 화면 `docs/qa-0.9.4/runtime/lake-dex.png`. 전체는 CI. 실기기 미검증.
- 다음: 주워 오기·바구니, 물가를 좋아하는 새 친구, 더 동쪽 호수. 노란 조각은 사용자 화면 정보 대기.
- 병합·릴리스: PR #55(https://github.com/sia080808-lgtm/Forest-of-Space/pull/55) main 병합 `0697735a9238f364cf80a17bc6bd7141de8b5358`(사용자 "ㄱㄱ"; head `54e5033` 기준 simulation·CodeQL 성공). 프리릴리스 v0.9.4 `Forest-of-Space-0.9.4.apk` 72,038,502 bytes, SHA-256 `901dbed48ef2b20a4ac6b8a475b2a7d39d877cf565ba7f05e33736903de4e23f` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode70/0.9.4. APK는 사용자에게 파일로 전달.

### STATS-DECISION-20261120 — 능력치 개편 결정 (문서만, 구현 전)

- 담당: Claude Code. 사용자 결정: "젖음은 수분이랑 능력치 합칠 수 있음", "기운으로 합치자", "수분, 영양, 기운으로 가고 … 잎 상태가 있었잖아. 그걸 기운이 깎이는 것으로 치자".
- 능력치는 **수분·영양·기운** 세 가지.
  - 수분: 몸 물과 뿌리 젖음(과습)을 막대 하나로. 0~30 목마름, 40~70 적정, 75 이상 과습(쉼터·그늘로 피해 말림), 90 이상 오래면 기운이 깎임. 비를 맞으면 과습에 약한 종(베이치·리들리)은 더 빨리, 강한 종(코로나)은 천천히 오름.
  - 기운: 체력+기분을 합침. 기존 저장은 두 값의 평균으로 옮김.
  - 잎 손상(해충·강풍)은 따로 쌓지 않고 기운을 깎는 원인으로 바꿈. 잎이 다친 친구는 기운이 낮아져 쉴 곳을 찾음.
- 코드 변경 없음. 남은 결정: 밤 잠 길이, 순서(제안: 0.9.5 동쪽 호수 확장 먼저, 0.9.6 능력치 개편).
- 2026-11-20 확정 기획: `docs/Forest-Stats-SRS-v2.34.md`·`.pdf`(5쪽, 초안 파일 삭제). 기존 능력치 규칙과 v2.28 종 특성표를 대체: 수분·영양 양쪽 스펙트럼(적정 35~65, 레벨 10에서 25~75), 기운(최대 60+5×(레벨−1)), 육각형 종족값 6칸(물·햇빛·잎·해충·추위·영양, 총합 18, 레벨 3·6·9에 가장 낮은 칸 +1), 선제 행동 순서, 오브젝트 역할(이끼=수태, 햇살 바위=볕 저장 패널, 바위틈=강풍, 낙엽=놀이·거름·과잉), 광합성(물 소모 → 기운·성장 경험), 밤 시간표, 저장 이전, AC 9개. 코드 변경 없음(사용자 "지금 업데이트 하지 말고"). 구현 순서는 사용자 결정 대기.

### LAKE-WIDE-ADMIN-0.9.5-20261120 — 동쪽 호수 확장, 노란 조각, 멈춤, 설정 정리, 관리자 도구

- 담당: Claude Code. 기준 main `0697735`(0.9.4 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 요청: "노란조각 수정하고, 호수는 확장시켜 놓자"(풀잎 배는 기획 미완이라 "없던 걸로"), 멈춰 있던 친구, "설정창 … 카테고라이징", "관리자 창 … 모든 경우의 수", "창조주 영역", "레벨 … 리셋", "다 관리자 기능으로".
- 변경: `world.js`(lakeshore x1 3.3, `lakeX`·`RING`·`nearShore`, 수련 최대 12, 갈대 3곳 추가), `scene.js`(호수 그림 폭 2.25, 반딧불 범위, 바탕 종이 조각), `tools/build-lake-floor.py`(x 3.3), `objects.js`·`engine.js`·`shelter.js`(제자리 잠·몸 낮추기·거닐기·문구, 커밋 `043b5fe`), 새 `admin.js`(관리자 기능, `ledger.admin`), `recruitment.js`(`arrive` 분리), `forest-app.js`(`settingsPage`·`adminPage`, 뒤로 가기), `forest.css`, `index.html`. 버전 0.9.5 / versionCode 71.
- 검증: `admin.test.cjs` 3개 추가, 관련 테스트 29/29, UI PASS(설정·관리자 흐름 추가, 검수 화면은 관리자 화면에서 열도록 갱신). 화면 `docs/qa-0.9.5/runtime`. 전체는 CI. 실기기 미검증.
- 다음: 사용자 확인 후 병합·APK. 그 뒤 SRS v2.34 능력치 개편(1.0, 단계 0~9 제안).
- 병합·릴리스: PR #56(https://github.com/sia080808-lgtm/Forest-of-Space/pull/56) main 병합 `a3d6ed11533e8bc3f367d88814babc72e79284a8`(사용자 "ㄱㄱ"; head `f15cfb5` 기준 simulation·CodeQL 성공. 첫 CI에서 `creatures` 개미 운반 테스트 2개가 시드 변화로 실패해 시드를 1·7·10으로 조정, CodeQL 안 쓰는 변수 1건 정리). 프리릴리스 v0.9.5 `Forest-of-Space-0.9.5.apk` 74,311,847 bytes, SHA-256 `510cdc8466137455c019117aec60d4884b4f86e387e02ec1d26c93333b205a1d` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode71/0.9.5. APK는 사용자에게 파일로 전달.

### STATS-1.0.0-20261120 — 능력치 개편 (SRS v2.34)

- 담당: Claude Code. 요청: 사용자 "ㄱㄱ"(SRS v2.34 능력치 개편). 기준 main `a3d6ed1`(0.9.5 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 변경: 새 `vitals.js`(수분·영양 띠·기운 피통, 기분·잎 손상을 기운으로, 광합성 성장, 말리기, 거름 곁 흡수, 햇살 바위 볕 저장, 밤 시간표, 저장 이전), `traits.js`(육각형 종족값·레벨 오름, 옛 배율은 칸에서 계산), `engine.js`(비가 몸 수분에, 기본 물 소모·뿌리 흡수 상한, `Vit.step`, 영양 소모 0.08/분, 제자리 쉼·그 자리 잠은 목마름·배고픔에 끝남, 햇살 바위 위 친구는 불러올 때 옮기지 않음), `objects.js`(필요 기준 경계선/가운데, 비 예측 피하기·말리기 'dry', 이끼 수분 3/분·물 약한 친구 이끼 우선, 쉼터 3/분, 큰 친구도 거름 먹기, 잠 시간), `weather-care.js`·`creatures.js`(레벨 종족값, 과습은 수분 포함, 영양 과잉 해충 1.5배), `forest-app.js`·`forest.css`(막대·육각형), `object-cards.js`(문구), `admin.js`(상태 바꾸기가 새 능력치와 맞게). 버전 1.0.0 / versionCode 72.
- 판단: 저장 필드 이름을 그대로 두고 기운은 피통 비율로 저장해 기존 규칙의 기준값을 살렸다. 영양이 기운에 영향을 주게 되면서 거름 공급(6시간 약 100)보다 소모가 커서 0.08/분으로 줄였다. 측정 중 실제 버그 2개(슈퍼범이 배고픈 채 제자리 쉼, 다 자란 슈퍼범이 거름 자리에 '맞지 않아' 영양을 못 먹음)와 저장 불러오기 버그 1개(햇살 바위 위 친구를 옮김)를 찾아 고쳤다.
- 검증: 로컬 전체 339/339, UI PASS. 테스트 조정: 물 목표 65→50, 쉼터 4→3, 이끼 물 3/분, 종족값·추위 테스트 다시 씀, 깊은 밤 시간, 개미 외 시드 무관. 측정 `tools/stats-balance.cjs`(6명 × 3게임시간: C01 수분 적정 99.9%·영양 92.8%, C04 99.7%·99.6%, 위험 0%, 물 오차 0). 화면 `docs/qa-1.0.0/runtime`(`tools/stats-review.cjs`). 실기기 미검증.
- 남은 일: 볕 쬐기·몸 말리기 전용 동작(지금은 쉬기 동작), 기운 낮을 때 걷는 속도, 리들리 비 맞기 기운 체감 확인.
- 병합·릴리스: PR #57(https://github.com/sia080808-lgtm/Forest-of-Space/pull/57) main 병합 `a2f3efeae119b685126b2dd9c1b253c54c9963f9`(사용자 "ㄱㄱ"; head `2c2aa7e` 기준 simulation·CodeQL 성공, CodeQL 안 쓰는 변수 1건 같은 PR에서 정리). 프리릴리스 v1.0.0 `Forest-of-Space-1.0.0.apk` 74,320,105 bytes, SHA-256 `3c41fa0e978a4ccfd08ebe609da96af7de48f97e35862bb68362cba7c9f9c8c9` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode72/1.0.0. APK는 사용자에게 파일로 전달.

### CLIMATE-WATER-1.0.1-20261121 — 계절마다 바뀌는 기후, 봄 뒤 물가 열림, 눈 먹기, 따뜻한 자리, 시작한 일 끝까지

- 담당: Claude Code. 기준 main `a2f3efe`(1.0.0 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 요청 흐름: "이론상 측정값은 맞음?" → "ㄱㄱ"(장시간 측정·수정) → 슈퍼범 물 나눔 → 물가 시원함 → 마른 숲 겨울 가뭄 원인(샘터가 10분 만에 비고 비·눈 없음) → 새벽 이슬(넣었다가 뺌) → "마른 숲에는 호수 안 얼게" → "봄 1시간 보낸 뒤 호수지역은 해금" → "계절마다 바뀌는 기후" → "눈 먹으면 되잖아" → 따뜻한 자리 → 혹독한 겨울 리들리 기운 0 원인 조사 → "ㄱㄱ".
- 변경: `environment.js`(계절별 기후 확률·연속 제한·안내 문구·`climateMode`·`rng.climate`), `world.js`(봄 뒤 자동 해금, 추운 겨울에만 얼음), `vitals.js`(물가 시원함 `coolAt`, 눈 먹기, `isCold`·`chill`, 햇살 바위 볕으로 몸 녹이기), `engine.js`(물가 시원함 수분 절반, 추위에 `chill`), `objects.js`(시작한 일 끝까지, 생존 우선 띠 하한, 기한 지난 물가 산책 끝냄·쉼터 안에서 시작 안 함, 여름 물가 산책, 샘터 눈 먹기, 추운 날 쉼터 회복 5·쉼터/바위 우선), `social.js`(물 나눔 경계선→50), `scene.js`(마른 숲 겨울 호수는 물 그림), `forest-app.js`(기후 설정 '계절마다 바뀜', 계절 안내). 버전 1.0.1 / versionCode 73.
- 판단: 새벽 이슬은 물가가 첫 봄 뒤 열리면서 필요 없어져 뺐다(사용자 결정). 혹독한 겨울 리들리 기운 0은 추위가 아니라 행동 왕복 버그(수분·영양이 띠 하한 32에 걸려 5초마다 할 일을 바꿈)였다.
- 검증: `npm test` 339/339, `npm run test:ui` PASS. 물 보존 테스트 2곳(engine 12시간, superbum 물 나눔)에 `ledger.lake` 추가. 측정은 릴리스 노트. Android 실기기 미검증.
- 추가: 햇살 바위 충전 맑음 5/분·흐림 2/분(사용자 결정), 산책 범위 지금 자리 0.9 안(CI 시뮬레이션이 10분 제한에 걸린 원인: 호수 동쪽 끝까지 간 친구의 먼 길찾기). 로컬 339/339, PR #58 CI 통과.
- SRS: `docs/Forest-Climate-Water-SRS-v2.35.md`·`.pdf`(4쪽, CW-01~12), v2.34 머리에 대체 안내.
- 남은 일: 바위 볕이 남아도 쉼터를 먼저 골라 바위 사용 0~8%, 둘째 해 영양 적정 86~95%, 마른 숲 겨울 화면 확인.
- 병합·릴리스: PR #58(https://github.com/sia080808-lgtm/Forest-of-Space/pull/58) main 병합 `88ede76735d9975d145219286a0e5dc83f635494`(사용자 "ㄱㄱ"; head `888a67c` 기준 simulation·CodeQL 성공. 첫 CI가 10분 제한에 걸려 산책 범위 성능 문제를 고침). 프리릴리스 v1.0.1 `Forest-of-Space-1.0.1.apk` 74,324,201 bytes, SHA-256 `16f6b9ca64313ef821a53d950f33efb6270d88e5cf0e4aec0043a4910299079a` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode73/1.0.1. APK는 사용자에게 파일로 전달.

### SMALL-FIXES-1.0.2-20261121 — 햇살 바위 사용, 시작한 일 5분 제한, 마른 숲 겨울 호수 화면, 기후 설명

- 담당: Claude Code. 요청: "작은 수정들 검토 먼저 ㄱㄱ", 화면 "B로 하되 시안 줘" → "저걸로 가자". 기준 main `88ede76`(1.0.1 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 변경: `objects.js`(추운 날 바위 점수 30+볕×0.5, 시작한 일 최대 300초 `HOLD`), `scene.js`(`openWater`: 얼지 않은 겨울 호수는 얼음 그림 알파로 잘라 낸 물만), `forest-app.js`(기후 설명). 버전 1.0.2 / versionCode 74. SRS v2.35 CW-13·PDF 갱신.
- 판단: 마른 숲 겨울 영양 위험 7~9%는 1.0.1 '시작한 일 끝까지'가 원인(솜깍지 100이 영양을 분당 2 빼앗아 거름 먹기가 끝나지 않고 정돈 못 함). 5분 제한으로 해결(엘리시 최저 6.6 → 37.7).
- 검증: `npm test` 339/339, `npm run test:ui` PASS, 시안 렌더(스크래치, 저장소 미포함) 사용자 확인. 실기기 미검증.
- 추가(사용자 "겨울엔 벌레들도 안 나오지 않음?" → "ㅇㅇ ㄱㄱ"): `creatures.js` 겨울 해충 쉬기(`WINTER_REST` 2/분, 뿌리날파리 번식 멈춤, 접촉·공중 전이 멈춤). `seasons` SE-1.0.2 추가. 관련 테스트 49/49.
- 남은 일: 마른 숲 둘째 해 8시간 재측정(5분 제한 뒤), 실기기.
- 병합·릴리스: PR #59(https://github.com/sia080808-lgtm/Forest-of-Space/pull/59) main 병합 `7a3d78747f8cfa141ffe784721f109bf52773564`(사용자 "ㄱㄱ"; head `964ba02` 기준 simulation·CodeQL 성공, CodeQL 안 쓰는 변수 1건 같은 PR에서 정리). 프리릴리스 v1.0.2 `Forest-of-Space-1.0.2.apk` 74,324,201 bytes, SHA-256 `ed440001dc9f5bc21e45d6b207e8e5d478fd79948ee585877084593c29d09b4b` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode74/1.0.2. APK는 사용자에게 파일로 전달.

### PHOTO-BASK-1.0.3-20261121 — 광합성·볕 쬐기 동작 구분

- 담당: Claude Code. 요청: "광합성 동작과 볕쬐기 동작 구분시키자"(그 뒤 기운·수분·영양 상태별 동작·외형 순서) → 시안 → "햇살 바위 광합성은 빛 원을 더 크게" 반영. 기준 main `7a3d787`(1.0.2 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 변경: `rig.js`(`photo`·`bask` 렌더 동작, 빛 알갱이 `motes`(바위는 1.8배)·주황빛·아지랑이 `warmth`), `scene.js`(가만히 선 친구가 광합성 '좋음/조금 벗어남'이면 `photo`; 볕 남은 햇살 바위에서 쉬면 추운 날 `bask`, 아니면 광합성할 때 `photo`(큰 빛 알갱이); 표정), `vitals.js` 슈퍼 광합성 `ROCK_BOOST` 1.5(같은 수분, 기운·성장 1.5배; 사용자 "저 로직 넣을 거임?"), `vitals.js`(`photoGrade` 분리·내보냄, `restingAt` 내보냄). 버전 1.0.3 / versionCode 75.
- 측정(친구 6명 × 3시드 × 2게임시간): 성장 경험 11.94 → 12.29(+2.9%), 바위 시간 3.4% 그대로.
- 검증: `rig`(1.0.3 검사)·`render`·`package`·`traits`·`seasons` 통과, 전체는 CI. 화면 `docs/qa-1.0.3/runtime`. 실기기 미검증.
- 다음: 기운 높음/낮음 동작(1.0.4 예정), 과습/수분 부족, 영양 과잉/결핍.
- 병합·릴리스: PR #60(https://github.com/sia080808-lgtm/Forest-of-Space/pull/60) main 병합 `213a327ff6926a5ff156710fcbf6b4b327b2f980`(사용자 "ㄱㄱ"; head `e817bf2` 기준 simulation·CodeQL 성공). 프리릴리스 v1.0.3 `Forest-of-Space-1.0.3.apk` 74,324,201 bytes, SHA-256 `8e8ac292b0f892933d3bbf513c74dece94cf2aa80459cf468aed2a67127bd972` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode75/1.0.3. APK는 사용자에게 파일로 전달.

### SKILLS-1.1.0-20261121 — 친구 고유 스킬 (SRS v2.36)

- 담당: Claude Code. 요청: 고유 스킬 점검 → "일단 이거 먼저 하자" → 제안 → 베이치는 원래 물 찾기(v2.22 보송) → "ㅇㅇ괜찮네 ㄱㄱ". 기준 main `213a327`(1.0.3 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 변경: 새 `skills.js`(베이치 웅덩이·안내, 코로나 낙엽 긁어모으기, 리들리 잎 털기, 엘리시 습도·천적 보조, 횟수·처음 기록·카드 문구·검증), `engine.js`(prepare/act 연결, 물 합계에 웅덩이, 검증, 환영 복제 키), `objects.js`(웅덩이 마시기 `puddleDrink`, 안내 받은 친구는 그 물만, `lakeDrink` forced), `creatures.js`(`brush`, 잎 습도, 천적 준비 2배 `assistStep`/`due` — 엘리시 없으면 기존과 같은 판정), `litter.js`(들고 가는 잎 바닥 낙엽에 셈), `scene.js`(웅덩이·물안개·낙엽), `rig.js`(`brush` 손), `forest-app.js`(카드 문구·고유 스킬 칸·도감), `index.html`·`stage2-review.html`·`tools/ui-smoke.mjs`(스크립트). 버전 1.1.0 / versionCode 76. SRS `docs/Forest-Skills-SRS-v2.36.md`·`.pdf`.
- 검증: `skills.test.cjs` 9개 추가, 관련 19개 파일 142/142, UI PASS, 전체는 CI. 측정·화면은 릴리스 노트. 실기기 미검증.
- 코로나 스킬 변경(사용자 "1번 ㄱㄱ"): 한 장씩 나르기 → 한 칸 낱잎을 그 자리에서 긁어모아 더미로(`litter.gather`, `rig.js` `rake`). 들고 다니는 잎 없음.
- 다음: 상태별 동작(기운 → 수분 → 영양), 레벨에 따른 스킬 강화(미정).
- 병합·릴리스: PR #61(https://github.com/sia080808-lgtm/Forest-of-Space/pull/61) main 병합 `006ac9b124a30a12b4cb3c470678f46d39dd2457`(사용자 "괜찮다면 업데이트 ㄱㄱ", 하루 횟수 제한은 넣지 않음; head `86e942b` 기준 simulation·CodeQL 성공, CodeQL 안 쓰는 변수 1건 같은 PR에서 정리). 프리릴리스 v1.1.0 `Forest-of-Space-1.1.0.apk` 74,336,555 bytes, SHA-256 `050f8565c53911f879bc7c93fca31b5847096de7fae8ed5225408d1106f778b7` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode76/1.1.0, `skills.js` 포함. APK는 사용자에게 파일로 전달.

### LAKE-FIXES-1.1.1-20261121 — 호숫가 잠, 관리자 호수 채우기, 반딧불, 목마름 안내

- 담당: Claude Code. 사용자 제보(1.0.3, 관리자로 여름 전환): "쉼터가 비워져 있는데 호숫가에서 쉴 곳이 없어 그대로 잠들어버렸다 … 몇몇은 자고 있지도 않아", 연꽃·호수 생명체 안 보임, 반딧불 0.5초.
- 재현·원인(엔진): (1) 할 일 기한이 최대 30초(+재계획 15초)라 먼 호숫가(x 2.2~3.1, 쉼터까지 60~90초)에서 걷다가 포기·다시 고르기 반복, (2) 쉼터 자리는 아직 걸어오는 친구가 미리 잡아 화면엔 비어 보이고, 큰비면 이끼·바위틈은 못 써서 남은 친구는 그 자리에서 잠듦, (3) 한 번 그 자리에서 잠들면 밤새 다시 찾지 않음.
- 수정: `objects.js` 할 일 기한 상한 30→240초(이동 시간+10초), `engine.js` 그 자리에서 잠든 친구가 20초마다 다시 자리를 찾음. 사용자 화면과 똑같은 장면은 재현 못 함.
- 추가(사용자 "2번"): 관리자 '호수 생명 채우기' 버튼(`world.js` `fillLake`, `admin.js`, `forest-app.js` 관리자 '호수' 묶음) — 계절 바꾸기는 그대로, 버튼으로만 지금 계절의 연꽃·물가 이웃을 채움. 반딧불은 한 번 뜨면 비·눈·바람 60 이상 전까지 그 밤 유지(`fireflies`). 버전 1.1.1 / versionCode 77, 릴리스 노트 `docs/Forest-1.1.1-Release.md`.
- 검증: `lake.test.cjs` 1.1.1 검사, 관련 68/68, UI PASS, 전체는 CI. 실기기 미검증.
- 추가(사용자 "엘리시 목이 말라서 물을 찾아가요 … 그냥 잎 그늘 밑에서 쉬고 있음" → "그런 생리적인 안내보고는 안 해도 될 듯"): `forest-app.js` 월드 하단 안내에서 목마름 안내를 뺐다(옛 기준 수분 35 미만 고정이라 실제 행동과 달랐음). 목마름은 친구 카드 문구로만 보인다. UI PASS.
- 확인: 관리자 여름 전환 뒤 엔진에서 연꽃 5분 2개→35분 10개, 호수 생명체 5~11마리 정상 생성. 반딧불은 맑고 바람 30 미만일 때만(측정 340초 중 약 120초 켜짐) — 비·바람이 오면 꺼짐.
- 병합·릴리스: PR #62(https://github.com/sia080808-lgtm/Forest-of-Space/pull/62) main 병합 `b13ac58e896f20b3909ab355657306a61e02bee8`(사용자 "ㄱㄱ"; head `7af7bca` 기준 simulation·CodeQL 성공). 프리릴리스 v1.1.1 `Forest-of-Space-1.1.1.apk` 74,336,555 bytes, SHA-256 `c66d77cd285aacb9b2cc171f7511f8a50e7a9827056033f67978fd551814374f` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode77/1.1.1. APK는 사용자에게 파일로 전달.

### LAKE-SWIM-1.1.2-20261121 — 호수 생물이 호수를 돌아다님

- 담당: Claude Code. 요청: 사용자 "현재 호수 생물들 이동 반경 어케댐" → "2번 ㄱㄱ"(엔진에서 실제 이동). 기준 main `b13ac58`(1.1.1 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 변경: `world.js`(`SWIM`·`swim`·`swimTarget`·`swimOk`·`hrnd`, 물달팽이 0.3 안 시든 수련으로 기어감, 잠자리 날개돋이 상한, 검증 `tx/ty/rest/mv`), `scene.js`(위치 따라 그리기·방향·개구리 헤엄). 버전 1.1.2 / versionCode 78.
- 판단: 이동 목적지는 해시로 골라 `rng.lake` 흐름(찾아오는 생물)은 그대로.
- 검증: `lake.test.cjs` 1.1.2 검사, `lake`·`admin`·`render`·`package` 통과, 전체는 CI. 실기기 미검증.
- 병합·릴리스: PR #63(https://github.com/sia080808-lgtm/Forest-of-Space/pull/63) main 병합 `aabbcf716d863212b1fda053c940006182ffd6b5`(사용자 "ㄱㄱ 1.1.3, 끝나면 1.1.2도 머지"; head `7db38d6` 기준 simulation·CodeQL 성공, 같은 브랜치라 1.1.3 작업 전에 먼저 병합). 프리릴리스 v1.1.2 `Forest-of-Space-1.1.2.apk` 74,336,555 bytes, SHA-256 `645c3f6069bef45262073da126603a8e66400a3616c53b7358984aa5ecadd832` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode78/1.1.2. APK는 사용자에게 파일로 전달.

### SKILL-LEVELS-1.1.3-20261121 — 고유 스킬 레벨 수치표 (SRS v2.37)

- 담당: Claude Code. 요청: "레벨별로 … 스킬의 수치값 변하는 메커니즘 있음?" → 수치표 → 엘레판 막는 %, 코로나 1~5장, 리들리 Lv10 전부 → "ㄱㄱ 1.1.3". 기준 main `aabbcf7`(1.1.2 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 변경: `skills.js`(`LEVEL`·`lv`·`levelOf`·`tier`·`umbrella`·`share`·`levelLines`, 코로나 새 방식 `rakeFor`·act), `weather-care.js`(우산 비·바람·한계 `U`, `limit` 내보냄), `social.js`(둥지 최대·나눔 합계 `SH`, 우산 한계), `engine.js`(둥지 물 검증 50), `forest-app.js`(스킬 칸 문구). 버전 1.1.3 / versionCode 79. SRS `docs/Forest-Skill-Levels-SRS-v2.37.md`·`.pdf`.
- 검증: `skills.test` 10/10(SK-AC05 다시 씀, SK-LV 추가), 관련 테스트, 전체는 CI. 실기기 미검증.
- 병합·릴리스: PR #64(https://github.com/sia080808-lgtm/Forest-of-Space/pull/64) main 병합 `879a38a29defae111464139922f3f64e7802d3f7`(사용자 "ㄱㄱ"; head `9e2f288` 기준 simulation·CodeQL 성공. 첫 CI에서 슈퍼범 둥지 테스트가 고정 상한 40으로 실패해 레벨별 둥지 최대로 고침, CodeQL 안 쓰는 변수 1건 정리). 프리릴리스 v1.1.3 `Forest-of-Space-1.1.3.apk` 74,340,651 bytes, SHA-256 `62abf7cbc6ef3db44097b2c0552416355bb7b62569cc9cb481caedfe4e06d5a2` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode79/1.1.3. APK는 사용자에게 파일로 전달.

### PERF-1.1.4-20261121 — 렉 줄이기: 길찾기 다시 쓰기, 화면 조명 가볍게

- 담당: Claude Code. 요청: "용량이 많아지면서 렉이 조금씩 걸리는데 안걸리게 하는 법 없니" → 측정·제안 1~5 → "1,2번 ㄱㄱ". 기준 main `879a38a`(1.1.3 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 측정 방법: 친구 6명·여름 호수 채움 장면을 Node에서 엔진(`--cpu-prof`)과 실제 scene.js 렌더(@napi-rs/canvas)로 프로파일. 측정 스크립트는 스크래치에만 두고 저장소에 넣지 않음.
- 변경: `spatial.js`(`planFor`·`keptPlan` 걷는 길 저장·재사용 REPLAN 8초·실패 3초, `route` 친구 무시 경로 답 캐시 `routeMemo`/`layoutKey`), `objects.js`(`walkPlan` 검증), `world-effects.js`(`light`·`gradeOver`, 필터 대신 multiply/lighter/saturation 겹치기), `scene.js`(`draw` 세계를 화면에 바로 그리고 제자리 조명). 버전 1.1.4 / versionCode 80.
- 결과: 엔진 평균 13.0→5.5ms/틱, 50ms 넘는 틱 107→22(2,400틱), 화면 약 20→7.5ms/장. 조명 전후 그림 차이 최대 2/255.
- 검증: 관련 테스트 83/83, 전체는 CI. 실기기 미검증.
- 남은 일(사용자 결정 대기): 3 바닥·사물 미리 그려 두기, 4 슈퍼범 옆잎 미리 굽기, 5 배터리 절약(30fps) 설정. 남은 엔진 순간 멈춤은 길을 못 찾는 경우의 탐색.
- 병합·릴리스: PR #65(https://github.com/sia080808-lgtm/Forest-of-Space/pull/65) main 병합 `0795c71fc3915135440280ae771a76f7f2d67f4c`(사용자 "ㄱㄱ"; head `c310f29` 기준 simulation·CodeQL 성공. 첫 CI에서 슈퍼범 둥지 증발 테스트가 실패 — 길 재사용으로 시험 속 슈퍼범이 쉼터(지붕 아래는 증발 없음)에 더 오래 머묾, 테스트를 쉼터 밖 측정으로 고침). 프리릴리스 v1.1.4 `Forest-of-Space-1.1.4.apk` 74,340,651 bytes, SHA-256 `49e2b114ca436bd662dd544181acf0e892481e30256270253bf5e9f760f83668` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode80/1.1.4. APK는 사용자에게 파일로 전달.

### VIGOR-1.1.5-20261121 — 기운 높음·낮음 동작

- 담당: Claude Code. 요청: "1번 가자. 시안 그려줘" → 시안(몸 누르기) → "기분 낮음과 축 처짐이 좀 개선" → 부위별 처짐(`droop`) 시안 → 한숨 표시 후보 4개·사용자 스케치 → "너꺼 a번 가자". 기준 main `0795c71`(1.1.4 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 변경: `rig.js`(`droop` 옵션 전달·리들리 잎/손 처짐, `vigor` 높음·낮음·바닥 렌더, 반짝이·그늘선·입김·땀), `species-rig.js`(베이치·코로나 잎 처짐·팔 늘어짐, 엘리시 생식엽 벌어짐·가라앉음), `neolbi.js`(후드 숙임·가라앉음), `superbum.js`(둥지잎·옆잎 처짐), `scene.js`(기운 80/40/15로 `vigor` 고름, 들림·쉬기·반응 중 제외). 버전 1.1.5 / versionCode 81.
- 걷는 속도(사용자 "속도 넣어"): `spatial.js` `gait` 기운 80% 이상 걸음 1.15배, 15% 아래 0.45배(40% 아래 0.6배는 기존).
- 판단: 몸 전체를 누르는 첫 시안과 띠 왜곡 시안은 버림(찌그러짐·줄무늬).
- 검증: `rig.test` 7/7(1.1.5 검사 추가), `render`·`superbum`·`ellisii-legacy` 25/25, `package` 3/3, 전체는 CI. 화면 `docs/qa-1.1.5/runtime/vigor.png`. 실기기 미검증.
- 병합·릴리스: PR #66(https://github.com/sia080808-lgtm/Forest-of-Space/pull/66) main 병합 `530a3c2730a16b566359b57062443c9ea255641c`(사용자 "ㄱㄱ"; head `582223f` 기준 simulation·CodeQL 성공). 프리릴리스 v1.1.5 `Forest-of-Space-1.1.5.apk` 74,344,747 bytes, SHA-256 `f049617d0549f55679235f8a25ea0abb9b9721fcbdbce6cbead8523a1e9f5871` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode81/1.1.5. APK는 사용자에게 파일로 전달.

### RENDER-COST-1.1.6-20261121 — 렉 줄이기 2: 화면 한 장 그리는 비용

- 담당: Claude Code. 요청: "원래 이런 게임 돌리면 폰 자체가 좀 렉이 걸리나" → 그래픽 칩 질문 → 한 장 그리는 비용 줄이기 → 화질 질문 → "ㄱㄱ". 기준 main `530a3c2`(1.1.5 병합), 브랜치 `claude/festive-curie-mjk5mw`.
- 판단: Node 그림판 측정은 필터 비용을 거의 못 잡아서(1.1.4 방식), 크롬(소프트웨어 그리기)으로 다시 쟀다. 진짜 무거운 곳은 매 장 쓰는 필터(낙엽 그림자 blur, 사물 젖음, 그늘 아래 친구)와 임시 그림판이었다. 처음 계획한 '바닥 미리 그리기'는 바닥이 이미 가벼워 하지 않았고, 배터리 절약은 이미 초당 30장이라 의미 없었다(사용자에게 정정).
- 변경: `scene.js`(`bakeLeaf`·`leafQ`·`wetTile`·`dimmed`, 낙엽 자리 그림자 구움), `species-rig.js`(팔 임시 그림판 제거), `superbum.js`(옆잎 굽기 `bendCached`). 버전 1.1.6 / versionCode 82. 도구 `tools/render-bench.cjs`(크롬 장면 측정).
- 결과: 크롬 한 장 약 170→15ms(전체 보기 70→13ms). 전후 픽셀 비교 25장, 바뀐 픽셀 0~0.2%. 비교 그림 `docs/qa-1.1.6/runtime/before-after.png`.
- 고치며 찾은 것: 그늘 아래 친구 그림판 영역을 친구 리그 좌표가 아닌 세계 좌표로 잡아 친구가 사라짐, 납작하게 비튼 거름 조각의 해상도를 낮게 재 흐려짐, 젖은 바위를 원본 크기로 구워 조금 거칠어짐 — 모두 고치고 다시 비교.
- 검증: 렌더 관련 테스트 통과(`render.test` 가짜 그림판 보강·슈퍼범 옆잎 검사 조정), 전체는 CI. Android 실기기 미검증.
- 병합·릴리스: PR #67(https://github.com/sia080808-lgtm/Forest-of-Space/pull/67) main 병합 `78e0342e6e2595e166dbe815d9ecb70d6bf098b1`(사용자 "ㄱㄱ"; head `ebd36b8` 기준 simulation·CodeQL 성공). 프리릴리스 v1.1.6 `Forest-of-Space-1.1.6.apk` 74,344,747 bytes, SHA-256 `d3e26d4fdc8a5c1dee3a4ee801d53d895430403458f22c6081cbc3575f5d37bd` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode82/1.1.6. APK는 사용자에게 파일로 전달.

### WORLD-VIDEO-1.1.7-20261121 — 월드 영상 녹화 (최대 1분)

- 담당: Claude Code. 요청: "일정시간 월드를 비디오 녹화하는 기능 넣을 수 있나" → "최대 시간은 1분으로 지정해두고, 그 안에서 찍다가 정지". 기준 main `78e0342`(1.1.6 병합) + HANDOFF `e860464`, 브랜치 `claude/festive-curie-mjk5mw`.
- 변경: `forest-app.js`(`startRecording`·`stopRecording`·`recFormat`·`recButton`, canvas `captureStream(30)` + MediaRecorder 1초 조각, 60초 자동 정지, `pause()`에서 멈춤), `audio.js`(`stream()` 게임 소리 트랙), `scene.js`(녹화 중 선택 링 숨김 `recording`), `index.html`·`forest.css`(녹화 버튼·남은 시간), `MainActivity.java`(`videoBegin`/`videoChunk`/`videoEnd` → MediaStore `Movies/여백의 숲`, 람다 없음, 상한 320MB). 버전 1.1.7 / versionCode 83.
- 판단(사용자가 정하지 않은 것): 소리는 함께 녹음(소리 크기 설정 그대로), 버튼은 사진 아래 따로 둠.
- 검증: `package`·`android-shell-dex` 통과, UI PASS, javac 컴파일, 크롬 3초 녹화 MP4(H.264+Opus) 확인. 전체는 CI. Android 실기기(WebView MP4 지원·갤러리 저장·렉) 미검증.
- 아이콘: 사용자 "기본 버튼 아이콘은 위에 카메라 아이콘 처럼 비디오 캠코더 아이콘" → 사진 아이콘과 같은 각진 몸통·위 볼록·렌즈 원 + 옆 렌즈통.
- 아이콘 다시: 사용자 "엄청 심플하게" → 네모 몸통 + 렌즈 삼각형만.
- 아이콘 되돌림: 사용자 "이전께 낫다" → 사진 아이콘과 같은 모양의 캠코더로.
- 병합·릴리스: PR #68(https://github.com/sia080808-lgtm/Forest-of-Space/pull/68) main 병합 `20ee8d196575e8904ae937cae478ca94a275e97e`(사용자 "ㄱㄱ"; head `e0fde96` 기준 simulation·CodeQL 성공. 첫 CI에서 `selection-ring222` 소스 검사가 녹화 중 링 숨김 조건으로 실패해 테스트 정규식을 고침). 프리릴리스 v1.1.7 `Forest-of-Space-1.1.7.apk` 74,348,843 bytes, SHA-256 `e8572593e782c5d64d05c70da7cab0a1503f527f5162d6f85605e4d70f112d9b` — `.sha256` 일치, 인증서 `f807cfca…7e3d`, versionCode83/1.1.7. APK는 사용자에게 파일로 전달.
