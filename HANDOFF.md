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
| 진행 중 제품 작업 | 연결 점검은 문서 작업이며, 제품 작업은 최신 작업 브랜치/별도 세션에서 확인 |

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

- 사용자 요청: 선택 링의 발광·시인성을 높이고 캐릭터 발 아래에 놓이도록 깊이/합성 순서 수정. 이번 설정에서는 구현·검증하지 않는다.
- 이전 대화에 CI 의존성 `buffer-image-size@0.6.6` 다운로드 실패가 보고되었다. 후속 실행 전 실제 Actions 결과를 재확인한다.

## 현재 작업 / 다음 순서

- 작업 ID: `COLLAB-VERIFY-20261117`
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

## 작업 이력

### COLLAB-SETUP-20261117 — 공유 규칙 준비

- 담당: ChatGPT.
- 코드 수정: 없음.
- 테스트: 문서 및 연결 구성 확인에 한정; 제품 회귀를 이번에 재실행했다고 주장하지 않음.
- 배포: 없음. 앱 버전 증가 없음.
- 남은 일: Claude 인증 및 실제 공유 문서 읽기 확인.

### COLLAB-VERIFY-20261117 — 실제 공유 문서 읽기 확인

- 담당: Claude 읽기 확인, ChatGPT 원문 대조 및 확인 기록 저장.
- 결과: 네 개인 저장소에서 동일한 main 커밋과 HANDOFF.md SHA-256을 확인했다. 저장소별 상세 값은 위 연결 점검 기록에 있다.
- 변경: 연결 상태 및 재개 절차 갱신. 이전 COLLAB-SETUP 기록의 남은 일은 당시 상태이며 인증/실제 읽기 확인은 이번 기록으로 완료했다.
- 제품 코드·앱 버전 변경 없음. 제품 회귀·실기기 검사·배포는 수행하지 않았다.
- 후속: 다음 작업에서 최신 원격과 작업 브랜치를 확인하고 승인된 제품 작업을 이어간다.

## 자동 인계 설정 준비 — 최신 추가 상태 (2026-11-17)

- 작업 ID: `FOREST-HANDOFF-SETUP-20261117`. 담당: ChatGPT.
- 요청 범위: 여백의 숲·스케쥴 허브·MKT에서 ChatGPT 기획/이미지를 Claude Code 구현 작업으로 전달하는 공통 경로 준비.
- 이 저장소 준비 기준: `main` / `e68cf0915674113ed473592e0ea09f0dec4a5d88`. 다음 실행은 실제 최신 원격과 작업 브랜치를 다시 확인한다.
- 상태: 비활성 초안. 프로젝트 지침·작업 이슈 양식·활성화 절차를 마련했다. OAuth 인증 등록, 실행 활성화, 실제 Claude 호출, 자동 작업 성공 및 운영 배포는 확인하지 않았다.
- [자동 인계 설정과 활성화 절차](.github/claude-handoff/README.md) 및 [프로젝트별 작업 기준](.github/claude-handoff/project.json)을 따른다. 기존 AGENTS.md·AI_COLLABORATION.md의 제품 보호와 승인 범위는 유지한다.
- 제목이 `[Claude task]`로 시작하는 새 작업 이슈에 실제 저장소/프로젝트, 기준 브랜치/전체 SHA, 작업 ID, 요청, 완료 기준을 넣는다. 오래된 SHA나 잘못된 저장소·형식은 실행하지 않는다.
- 저장소별 OAuth 비밀값과 정확한 작성자 변수 및 활성화 변수가 필요하다. 기본값은 미실행이며 이 문서 추가만으로 실행되지 않는다. worker는 읽기 권한, 최대 30턴·35분, 결과 게시 단계는 모델 인증 없는 별도 단계이며 초안 PR만 작성한다.
- 이미지 원본은 실제 접근 가능한 경로에 저장하고 커밋·경로·해시·크기와 적용 규칙을 전달해야 한다. 여기서 만든 시안이 자동으로 상대 AI에게 전송된 것으로 간주하지 않는다.
- 결과는 이슈/PR에 기록되며 ChatGPT가 다시 조회해야 검토할 수 있다. 완료 알림으로 이 대화가 자동 기동하는 기능은 준비하지 않았다.
- 이번 준비로 제품 코드·앱 버전·저장 데이터·배포 MANIFEST를 변경하지 않는다. 이전 제품 검사 기록은 당시 결과이며 자동화 검증으로 재사용하지 않는다.
- 기존 선택 링 발광·발 아래 깊이 순서 수정 및 CI 의존성 다운로드 확인은 후속 대기 상태를 유지한다.
- 후속 순서: 초안 변경 검토/반영 → 저장소별 비밀값·정확한 작성자 등록 → 활성화 → 별도 요청한 작은 작업으로 실제 실행/초안 PR 확인 → 결과를 이 문서에 추가.
- 검증 상태: 이 추가 기록은 설정 준비 범위를 설명한다. 실제 수행한 정적/자동화 검사와 원격 PR 반영 결과는 해당 작업 결과에서 별도 기록하며, Claude 연동 실동작 통과로 표시하지 않는다.


### 자동 인계 구성 검증 결과

- 실행 명령: `node --test .github/claude-handoff/bridge.test.cjs .github/claude-handoff/integration.test.cjs`. Node 24.22.1의 격리된 임시 Git 저장소/모의 GitHub 응답으로 25개 검사 통과.
- 확인 범위: 프로젝트·저장소·작성자·SHA·필수 입력 검증, 오래된/수정된/중복 요청과 인증 누락 거절, 로컬 커밋·미추적·바이너리·삭제 파일 수집, 변조된 artifact 거절, 새 작업 ref와 Draft PR만 생성하는 게시 절차. 실제 외부 API·Claude 모델·사용자 저장소로 테스트 요청을 보내지 않았다.
- 정적 확인: 새 이슈 이벤트만 수신, 명시적 활성화/정확한 actor, worker 읽기 권한과 publisher 별도 쓰기 권한, publisher에 모델 secret 미전달, action commit 고정, 이슈별 concurrency, 양식/프로젝트 JSON/YAML 및 기존 문서 보존.
- 실제 Claude 구독 인증·유료 실행·전체 GitHub Actions 연동, 제품 기능·APK/Windows·운영 배포 검증은 미수행이다. 원격 검토 PR의 반영 상태는 해당 PR에서 확인한다.
