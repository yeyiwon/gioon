# GIOON

**서비스 주소: https://gioon.vercel.app**

사주·오행으로 오늘의 운세, 필요한 기운, 행운 컬러(메인·보조·포인트), 추천 양말을 보여 주는 모바일 우선 웹앱.

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
npx vitest run     # 사주 계산·운세 일관성 테스트
npm run build
```

## 구조

| 경로 | 역할 |
| --- | --- |
| `src/lib/saju/` | 만세력 계산(lunar-javascript), 표준시·서머타임·경도 보정, 오행 분석 |
| `src/lib/fortune/` | 일진 기반 하루 운세, 점수 근거, 행운 컬러·아이템 (날짜+프로필로 결정적) |
| `src/lib/store.ts` | localStorage 저장 (프로필·기록·설정) |
| `src/three/` | 단일 WebGL 캔버스(drei View 공유), 오행 마스코트, 양말·선물 상자 |
| `src/components/` | 화면(오늘·사주·달력·수집함·설정), 온보딩, 바텀시트 |

## 알려진 한계

- 음력은 중국 기준 음력표로 변환 (한국 음력과 드물게 하루 차이)
- 1948–51·1955–60년 서머타임, 해외 현지 서머타임, 균시차 미반영
- 대운·세운 미구현

운세는 전통 명리학에 따른 상징적 해석이며 확률적 예측이 아닙니다.
