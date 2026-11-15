# 여백의 숲 · Android 0.4.4

꾸미기 화면과 카메라 업데이트입니다.

- 꾸미기 패널을 열거나 접어도 월드와 오브젝트의 크기가 유지됩니다.
- 월드가 화면을 채우며 좌우 빈 테두리를 없앴습니다.
- 확대·축소·전체 버튼을 제거했습니다. 두 손가락으로 1~3배 확대·축소하고 빈 곳을 드래그해 탐색합니다.
- 최대 축소는 초기 설치 화면의 5:8 정원 비율을 기준으로 합니다. 다른 화면 비율에서는 가장자리를 조금 잘라 채우고, 드래그로 가려진 영역에 접근합니다.
- 꾸미기 패널에 가린 하단은 지도를 위로 밀어 편집할 수 있습니다.

기존 앱을 지우지 않고 APK를 업데이트 설치합니다. 패키지 com.ridleydesk.mobile / versionCode 9 / versionName 0.4.4, 0.4.3과 같은 인증서입니다. 실기기 설치는 아직 검증하지 않았습니다. 설치 후 내려받은 APK 파일은 삭제해도 됩니다.

## 검사와 명세

자동 검사 60개, DOM 입력 검사, 실제 Canvas 12장 렌더링 및 APK 빌드·서명·정렬·소스 일치를 확인했습니다. 결과는 docs/qa-0.4.4/, 범위는 docs/IMPLEMENTATION_STATUS.md입니다. 통합 명세 v2.8 개정 2의 변경 연결표는 docs/CAMERA_0_4_4.md에 있습니다. 전체 브라우저/Android 실기기/성능/CodeQL 통과를 뜻하지 않습니다.

```bash
npm ci --ignore-scripts
npm test
npm run test:ui
node tools/viewport-review.cjs
```

실행 앱은 오프라인이며 그림·글꼴·소리를 포함합니다. npm 의존성은 개발 검사 도구용입니다. Android 빌드는 tools/build_apk.py와 Android API 35/Build Tools 35.0.0/ECJ를 사용합니다. 서명 키·암호·사용자 저장은 소스 ZIP에 포함하지 않습니다.
