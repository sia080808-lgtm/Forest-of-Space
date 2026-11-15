# 검사 기록 · 2026-11-15 KST

## 완료한 검사

- Android manifest: 인터넷/위치/파일 전체 접근/오버레이 권한 없음.
- WebView: 앱에 포함된 `https://appassets.androidplatform.net/` 자산만 반환. 외부 탐색 거부, 파일 URL/콘텐츠 URL 접근 끔, mixed content 차단.
- HTML CSP: 스크립트/그림/폰트는 자기 출처, 임의 프레임·object·form 제출 없음.
- 가져온 별명과 기록은 HTML로 표시 전 escape. 개체 ID는 영숫자/대시/밑줄만 허용. 임의 평가 함수 없음.
- 백업: 16MiB 상한, 스키마/버전/수치/중복 ID/목적지 참조/용량/좌표 검증 후 적용. 임의 파일 경로 대신 Android SAF 선택 파일만 처리.
- 중요 변경: 성공한 원자 저장 이후 화면에 반영. 기존 상태는 저장 실패 시 유지.
- 서명 키/비밀번호·사용자 저장 데이터는 소스/검사 로그/배포 ZIP에 포함하지 않음.

위 항목은 구현 검토 및 테스트 범위이며 보안 취약점이 전혀 없음을 보증하지 않습니다.

## CodeQL: 실행됨, 결과 등록 차단 — 통과 아님

2026-11-15 KST 실제 GitHub Actions 실행:
- 소스 커밋: `ba15da807e57946210962a303e5ce54390b92d59`.
- 기능 검사(push): https://github.com/sia080808-lgtm/Forest-of-Space/actions/runs/43613913528 — 26개 및 JavaScript 문법 검사 통과.
- 기능 검사(PR #1): https://github.com/sia080808-lgtm/Forest-of-Space/actions/runs/43613928562 — 통과.
- CodeQL(push): https://github.com/sia080808-lgtm/Forest-of-Space/actions/runs/43613913499
- CodeQL(PR #1): https://github.com/sia080808-lgtm/Forest-of-Space/actions/runs/43613928567

JavaScript/TypeScript와 Python 작업 로그에서 분석 결과의 SARIF 생성을 확인했지만, GitHub 결과 등록 단계가 다음 오류로 실패했습니다: `Code scanning is not enabled for this repository`. 작업 상태는 `configuration error`였습니다. Java/Kotlin 작업도 구성·실행했으며 이 기록 시점에는 분석 중입니다. 전체 CodeQL 통과 또는 취약점 0건으로 간주하지 않습니다. 스캔 결과 등록과 전체 결과 확인은 아직 완료되지 않았습니다.

이전 저장소 Security 화면에는 `Code scanning alerts • Disabled — Advanced Security is only available for Organizations`가 표시됐습니다. 현재 개인 비공개 저장소의 기능/라이선스 문제를 해결한 뒤 전체 작업을 다시 실행하고 실제 결과를 확인해야 합니다. 공개 전환·조직 이전·유료 보안 기능 구매는 수행하지 않았습니다. 실패한 검사를 숨기거나 성공 처리하도록 workflow를 변경하지 않았습니다.

## 원격 업로드 권한

2026-11-15 KST 재개 시 `sia080808-lgtm/Forest-of-Space`의 읽기·쓰기 접근이 정상임을 확인했습니다. 이전의 404 접근 차단은 해소됐습니다. 기존 다른 저장소의 접근 범위는 변경하지 않았습니다.

최초 이미지 blob 업로드는 자동 승인 심사에서 파일 전송의 명시적 승인 부족을 이유로 거절됐습니다. 사용자가 이어서 “소스와 에셋을 해당 저장소에 전송하도록 승인”하였고, 이를 근거로 소스·이미지·폰트·기준 명세서·검사 설정 43개 파일의 업로드를 진행했습니다. APK와 서명 비밀은 Git에 포함하지 않습니다.

검사 근거:
- https://developer.android.com/develop/ui/views/layout/webapps/load-local-content
- https://github.com/github/codeql-action/blob/main/README.md
- https://docs.github.com/en/code-security/reference/code-scanning/workflow-configuration-options

## 0.4.0

로컬 기능 검사 40개, DOM 입력 하네스, Android 빌드/서명/정렬, 이전 인증서 일치와 APK 자산 일치 검사를 수행했다. 전체 브라우저와 Android 실기기 검수는 미수행이다. 사용자가 변경 파일 50개(음원 17개 포함)의 업로드와 검사 후 main 반영을 명시적으로 승인했다. 이번 커밋의 기능 CI/CodeQL 결과는 해당 PR 검사에서 각각 확인한다. 기존 main의 CodeQL 실행 43616879557은 failure이며 이를 새 버전 통과로 사용하지 않는다.

## 0.4.1
렌더링/급수음 회귀 검사 포함 로컬 44개와 DOM 하네스 통과. 새 커밋의 CodeQL은 GitHub Actions에서 별도 확인한다. Android 실기기/전체 브라우저 검사는 미수행.
