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

## CodeQL: BLOCKED, NOT RUN

실제 GitHub 저장소 Security 페이지가 다음 상태를 표시함:
`Code scanning alerts • Disabled — Advanced Security is only available for Organizations`.

현재 대상은 `sia080808-lgtm/Forest-of-Space` 개인 비공개 저장소. `.github/workflows/codeql.yml`은 준비됨. JavaScript/TypeScript, Java/Kotlin(Java 코드), Python을 `security-and-quality`로 분석하도록 구성. GitHub가 허용하는 대상/라이선스로 전환한 뒤 실제 실행 결과를 확인해야 하며, 현재 통과/알림0으로 보고하지 않음.

공개 전환·조직 이전·유료 보안 기능 구매는 수행하지 않음.

## 원격 업로드 권한

2026-11-15 KST 재개 시 `sia080808-lgtm/Forest-of-Space`의 읽기·쓰기 접근이 정상임을 확인했습니다. 이전의 404 접근 차단은 해소됐습니다. 기존 다른 저장소의 접근 범위는 변경하지 않았습니다.

최초 이미지 blob 업로드는 자동 승인 심사에서 파일 전송의 명시적 승인 부족을 이유로 거절됐습니다. 사용자가 이어서 “소스와 에셋을 해당 저장소에 전송하도록 승인”하였고, 이를 근거로 소스·이미지·폰트·기준 명세서·검사 설정 43개 파일의 업로드를 진행했습니다. APK와 서명 비밀은 Git에 포함하지 않습니다.

검사 근거:
- https://developer.android.com/develop/ui/views/layout/webapps/load-local-content
- https://github.com/github/codeql-action/blob/main/README.md
- https://docs.github.com/en/code-security/reference/code-scanning/workflow-configuration-options
