# Focus 디자인 시스템 리팩토링 체크리스트

## Phase 1: 준비 단계 ✅
- [x] SVG 아이콘 생성 및 저장
  - [x] /public/icons/ 폴더 생성
  - [x] trophy.svg (주간 1위)
  - [x] coffee.svg (스타벅스)
  - [x] coin.svg (코인)
  - [x] flame.svg (연속 플레이)
  - [x] star.svg (레벨)
  - [x] lightbulb.svg (팁)
  - [x] chart-bar.svg (통계)
  - [x] user.svg (프로필)
  - [x] chevron-right.svg (화살표)
  - [x] check.svg (정답)
  - [x] x.svg (오답)

## Phase 2: 디자인 시스템 구축 ✅
- [x] CSS 디자인 토큰 정의 (/src/styles/design-system.css)
  - [x] 컬러 시스템 (Primary, Gray, Functional)
  - [x] 타이포그래피 (Font size, weight)
  - [x] Spacing (8px 기반)
  - [x] Border Radius
  - [x] Shadow
  - [x] Transition
- [x] index.css에 design-system.css import
- [x] Pretendard 폰트 적용 확인

## Phase 3: Main.js 리팩토링 ✅
- [x] 이모지 제거 및 SVG 아이콘 교체
  - [x] 헤더 코인 아이콘
  - [x] 배너 트로피/커피 아이콘
  - [x] 공유 버튼 아이콘
  - [x] 팁 전구 아이콘
- [x] 폰트 크기 통일 (CSS 변수 사용)
- [x] 색상 통일 (Primary/Gray만 사용)
- [x] 배너 심플화 (pulse 애니메이션 제거, 그림자 축소)
- [x] Spacing 통일 (8px 배수)
- [x] 랭킹 리스트 스타일 통일
- [x] XP 모달 스타일 통일

## Phase 4: 진척도 시각화 추가 ✅
- [x] XP 진행 바를 메인 화면에 노출
  - [x] 모달에서 메인으로 이동
  - [x] 레벨 + 진행도 카드 컴포넌트
  - [x] "다음 레벨까지 X XP" 메시지 추가
- [x] 연속 플레이 스트릭 표시
  - [x] dataService에 fetchWeeklyActivity() 추가
  - [x] calculateStreak() 로직 구현
  - [x] 불꽃 아이콘 + "X일 연속" 표시
- [x] 주간 활동 차트
  - [x] getWeeklyActivityChart() 구현
  - [x] 7일 바 차트 UI (월~일)
  - [x] 플레이한 날 보라색, 안한 날 회색

## Phase 5: 테스트 및 정리
- [ ] 브라우저 테스트 (모바일 뷰)
- [ ] 색상 일관성 확인
- [ ] 폰트 크기 일관성 확인
- [ ] 반응형 확인
- [ ] 최종 커밋

---

## 현재 진행 상태
- 시작일: 2025-12-14
- 현재 단계: Phase 1 진행 중
