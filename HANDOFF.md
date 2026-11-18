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
