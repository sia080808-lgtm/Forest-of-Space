# APK0.6.13 · 0.6.12 실행 직후 종료 핫픽스

2026-11-17. 사용자 제보: v0.6.12 앱이 계속 꺼짐.

- 원인: 0.6.12 APK는 공식 build-tools/d8 대신 Ubuntu dx(dalvik-exchange)로 dex를 만들었다. dx는 Java 람다를 디슈가링하지 않아 `classes.dex`에 invokedynamic/`LambdaMetafactory` 호출이 남았고, ART는 이를 부트스트랩하지 못한다. `MainActivity.onCreate`의 창 여백 리스너(람다)가 시작 직후 실행되어 앱이 종료된다. v0.6.11(d8)은 `ExternalSyntheticLambda` 클래스로 변환돼 정상. 기기 로그 확인은 미실시이며 dex 비교로 판정.
- 수정: `MainActivity.java`의 람다·메서드 참조 10곳을 같은 동작의 익명 클래스(Runnable·ValueCallback·OnApplyWindowInsetsListener·FilenameFilter·Comparator)로 교체. 웹 게임·에셋·저장 형식·저장 경로 불변. 시작 단계에서 종료되어 저장 데이터는 손상되지 않았을 것으로 판단.
- 재발 방지: `tests/forest/android-shell-dex.test.cjs`(셸 소스에 람다/메서드 참조 금지), `tools/build_apk_alt.sh`(대체 빌드 도구 사용 시 dex에 `LambdaMetafactory`가 있으면 빌드 실패).
- 버전 0.6.13 / versionCode 30. 0.6.12(29)를 설치한 기기와 0.6.11(28) 기기 모두 위에 업데이트 가능(같은 키 서명 시).

검증: 자동 210/210, DOM UI PASS. 서명 전 APK(정렬)에서 dex의 `java/lang/invoke` 참조 0개, 익명 클래스 생성 확인, 0.6.12 dex는 검사에 걸림. Android 실기기 실행·업데이트·화면은 미검증. 서명은 기존 키가 필요하며 이 저장소에 포함하지 않는다. SRS 명세 변경 없음(v2.22 유지).

