# 에셋 출처 및 제작 상태

- 기준 이미지: 사용자가 제공한 `Forest_Design_v1.2_Fixed(1).pdf`의 8·13·23쪽 및 내장 원형 보드.
- `assets/forest/garden.png`: 생성 도구로 제작한 C01 정원 배경. 고정 쉼터/샘터 포함. 초기 앱 적용본, 최종 레이어별 배경 납품은 아님.
- `assets/forest/ridley.png`: 같은 도구로 참조 외형을 보존해 제작한 투명 리들리 스프라이트. 정면 기본자세, 최종 분리 리그/시점/표정 6종은 미완성.
- `assets/forest/terrain.png`: 3×2 투명 지형 아틀라스. 바위/이끼/그늘/틈/낙엽/쉼터. 앱은 첫 5개를 분리 렌더링하며 배경 고정 쉼터와 중복 표시하지 않음.
- 리들리 PNG는 Android 아이콘 해상도별로 변환했습니다. 원화는 유지합니다. 최종 adaptive mask 실기기 검수는 대기입니다.
- 시작 화면 게임명은 고운돋움으로 표시한 개발용 제목입니다. BI-02 최종 레터링 벡터 마스터를 제작 완료했다고 주장하지 않습니다.
- Pretendard: Kil Hyung-jin 및 라이선스 파일에 기재된 원저작자. 원본 woff2, SIL OFL 1.1.
- Gowun Dodum: Gowun Dodum Project Authors. 원본 ttf, SIL OFL 1.1.
- 각 폰트의 전체 배포 라이선스는 `app/src/main/assets/web/fonts/`에 포함합니다.
- 내비게이션 아이콘은 앱 전용 SVG 경로이며 그림체/크기/터치 영역은 UI에서 관리합니다.

폰트 기준 출처:
https://github.com/orioncactus/pretendard
https://github.com/yangheeryu/Gowun-Dodum

## 0.4.0 기본 모션·음원

- MOT-F01 등 v2.8 키포즈 시트는 타이밍/접점 참고다. 승인된 기존 PNG를 유지하면서 Canvas에서 영역을 나눠 기본 움직임을 추가했다. 시안 시트 전체를 완성 스프라이트로 바꾼 것은 아니다.
- 음원은 사용자 제공 `여백의숲_사운드에셋_합성시안_v0.2.zip`에서 17개를 바이트 변경 없이 가져왔다. 합성 시안이며 최종 음향 마스터 청취 검수는 미완료다.
- 음원별 파일/해시는 `app/src/main/assets/web/assets/audio/manifest.json`, 상황 연결은 `docs/SPEC_2_8_STAGE_0_2.md`에 있다. BED/MELODY를 FULL과 중복 재생하지 않는다.
- 표면 물기/수면/반사/파문은 코드 렌더링이며 원본 PNG를 날씨별 그림으로 교체하지 않는다.
