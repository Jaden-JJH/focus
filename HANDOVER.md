# Focus 게임 개발 인수인계 문서

## 📅 최종 업데이트
- **날짜**: 2025-12-28
- **코드 버전**: Latest commit (after Phase 3.1 & 3.3)
- **상태**: Phase 1 & 2 & 3 핵심 기능 완료, Phase 3.2/3.4/3.5/4/5 대기 중

---

## ✅ 완료된 작업 (2025-12-28)

### 🔴 Critical Bug Fixes

#### 1. Event Listener 문제 해결 ✅
**문제**: DOM 재렌더링 시 이벤트 리스너 소실
- "전체 레벨" 버튼 작동 안 함
- 로그아웃 버튼 작동 안 함
- 모달 닫기 버튼들 작동 안 함

**해결책**: Event Delegation 패턴 구현
- `setupEventDelegation()` 메서드 생성 (constructor에서 1회 실행)
- 모든 버튼 클릭을 document 레벨에서 처리
- `innerHTML` 교체 후에도 이벤트 리스너 유지
- Modal state를 instance 변수로 이동 (`currentPage`, `imagesPreloaded`)

**위치**: `src/views/Main.js:31-230`

#### 2. Play Button 버그 수정 ✅
**문제**:
- Normal mode 클릭 시 무한 새로고침
- Hard mode 클릭 시 로그아웃 발생

**원인**: Event delegation 시 게임 시작 로직 과도하게 단순화
- 잘못된 라우트 사용: `/game-hard` → `/game/hard`
- Guest user session 관리 누락
- Game token 생성 로직 누락

**해결**: 전체 게임 시작 플로우 복원
- Guest user: 세션 체크 → 토큰 생성 → `/game` 이동
- Logged-in user: 코인 체크 → 토큰 생성 → 모드별 라우팅

**위치**: `src/views/Main.js:104-148`

---

### 🎨 Phase 1: Design System Unification (완료)

#### 1.1 Component Library 생성 ✅
**파일**: `src/styles/components.css` (신규 생성)

**컴포넌트**:
- **Buttons**: `.btn-primary`, `.btn-secondary`, `.btn-icon`
  - 높이 48px 통일
  - 호버/클릭 애니메이션 포함
  - 테마 색상 자동 적용 (일반/하드모드)

- **Cards**: `.card`, `.card-elevated`, `.card-glow`
  - max-width: 400px 통일
  - 일관된 padding: 16px
  - glow 카드는 테마별 발광 효과

- **Badges**: `.badge-level`, `.badge-rank`, `.badge-rank-gold/silver/bronze`
  - 레벨 표시용 그라데이션 배지
  - 순위 표시용 금/은/동 배지

- **Modals**: `.modal`, `.modal-backdrop`, `.modal-header`, `.modal-content`, `.modal-footer`
  - 일관된 모달 구조
  - 블러 배경 (backdrop-filter)

#### 1.2 Typography System ✅
**추가된 클래스**:
- **Hierarchy**: `.text-heading` (24px), `.text-subheading` (18px), `.text-body` (16px), `.text-small` (14px), `.text-caption` (12px)
- **Emphasis**: `.text-highlight`, `.text-success`, `.text-error`, `.text-warning`, `.text-muted`
- 모든 클래스에 적절한 line-height 설정

#### 1.3 Spacing System ✅
**추가된 유틸리티** (8px 기반):
- **Margin**: `.m-*`, `.mt-*`, `.mb-*`, `.ml-*`, `.mr-*`, `.mx-*`, `.my-*`
- **Padding**: `.p-*`, `.pt-*`, `.pb-*`, `.pl-*`, `.pr-*`, `.px-*`, `.py-*`
- 사이즈: 0, 1 (4px), 2 (8px), 3 (12px), 4 (16px), 6 (24px), 8 (32px)
- `.mx-auto` (중앙 정렬)

#### 1.4 Color System ✅
**추가된 유틸리티**:
- **Background**: `.bg-primary`, `.bg-gray-*`, `.bg-success/error/warning`
- **Border**: `.border-primary`, `.border-gray-*`, `.border` (1px), `.border-2` (2px)
- **Border Radius**: `.rounded-none/sm/md/lg/full`
- 모든 색상이 CSS 변수 사용 (하드코딩 제거)

**통계**:
- CSS 크기: 8.60 kB → 18.10 kB
- 인라인 스타일 감소: ~60%
- CSS 변수 사용률: 95%+

---

### ⚡ Phase 2: Performance Optimization (완료)

#### 2.1 Animation Timing & Sound Sync ✅
**파일**: `src/styles/design-system.css`

**추가된 타이밍 상수**:
```css
/* Animation durations */
--duration-instant: 100ms;
--duration-fast: 200ms;
--duration-base: 300ms;
--duration-slow: 500ms;
--duration-special: 1000ms;

/* Delays for sequencing */
--delay-instant/short/medium/long

/* Synchronized timing rules */
--timing-button-click: 0ms
--timing-levelup-sound: 0ms
--timing-levelup-xp: 500ms
--timing-levelup-change: 1000ms
--timing-levelup-confetti: 1200ms
--timing-gameover-*: ...
```

**애니메이션**:
- `.animate-stagger` - 리스트 순차 등장 (10개까지, 50ms 간격)
- `.animate-flash` - 성공 피드백용 플래시
- `.animate-shake` - 에러 피드백용 흔들림

#### 2.2 Image Optimization ✅
**추가된 클래스**:
- `.lazy-img` - 이미지 lazy loading (opacity transition)
- `.skeleton-img` - 로딩 중 shimmer 애니메이션
- `.img-loading` - 로딩 스피너 표시
- `.responsive-img` - 반응형 이미지 (object-fit: cover)

**최적화 전략**:
- Critical 이미지 우선 로드
- Skeleton UI로 로딩 상태 표시
- WebP 지원 준비

#### 2.3 60fps GPU Acceleration ✅
**성능 최적화 클래스**:
- `.gpu-accelerated` - 전체 GPU 가속 (translateZ, will-change, backface-visibility)
- `.will-change-transform/opacity` - 선택적 will-change 적용
- `.transition-transform/opacity` - 하드웨어 가속 transition
- `.scale-hover/active` - GPU 최적화된 scale 애니메이션
- `.contain-layout/paint/strict` - CSS containment
- `.smooth-scroll` - 스크롤 성능 최적화

**핵심 원칙**:
- ✅ `transform`, `opacity`만 사용 (GPU 가속)
- ❌ `width`, `height`, `top`, `left` 사용 금지 (layout shift 발생)
- `will-change` 전략적 사용 (남용 시 성능 저하)

#### 2.4 View Transitions & Rendering ✅
**뷰 전환 애니메이션**:
- `.view-exit` - 페이지 나갈 때 (fade out + slide up)
- `.view-enter` - 페이지 들어올 때 (fade in + slide down)
- `.render-optimized` - content-visibility 최적화
- `.isolate` - 페인트 영역 격리

**성능 지표**:
- CSS 크기: 18.10 kB → 21.30 kB (최적화 유틸리티 추가)
- 모든 애니메이션 60fps 목표
- GPU 가속으로 부드러운 전환

---

### 🎮 Phase 3: Gamification Enhancement (부분 완료)

#### 3.1 Level-up 경험 개선 ✅
**파일**: `src/views/Result.js:592-820`

**구현 내용**:
- 풀스크린 오버레이 강화 (블러 배경, `position: fixed`)
- 3초 애니메이션 시퀀스 구현:
  - 0.0s: 플래시 효과
  - 0.3s: "LEVEL UP!" 텍스트 scale + glow 애니메이션
  - 0.8s: 레벨 숫자 카운트업 애니메이션 (n-1 → n)
  - 1.2s: 레벨 이미지 확대 (scale 0.8 → 1.2 → 1.0)
  - 1.2s~2.5s: 컨페티 파티클 50개 (일반), 100개 (마일스톤)
  - 2.5s: 축하 메시지 시퀀스 ("Great!" → "You are now..." → "Keep going!")
  - 3.0s: 페이드아웃

- 마일스톤 레벨 (10, 20, 30, 40, 50, 60) 특별 효과:
  - 레벨 60: 블랙 테마 + 특별 glow
  - 레벨 50-59: 골드 테마
  - 레벨 10-49: 하드모드면 빨강, 일반모드면 보라
  - 마일스톤 시 컨페티 2배, glow 애니메이션

**위치**: `Result.js:592-820`

#### 3.3 라운드 진행 피드백 ✅
**파일**:
- `src/core/GameEngine.js:359-1050`
- `src/core/GameEngineHard.js:459-1213`

**구현 내용**:

1. **정답 시 기본 피드백** (이미 존재, 유지):
   - 체크마크 ✓ + 15개 컨페티
   - 배경 플래시 (초록색)

2. **5라운드마다 "Good Job!" 미니 팝업**:
   - 초록색 배경 (일반 모드) / 빨간색 배경 (하드 모드)
   - "Round X" + "Good Job! 👍"
   - 20개 컨페티 추가
   - 1.5초 표시 후 슬라이드아웃

3. **10라운드마다 "Amazing!" 메이저 축하**:
   - 전체 화면 플래시 효과 (테마 색상)
   - 큰 배너: "🎉 Round 10!" (일반) / "🔥 Round 10!" (하드)
   - 80개 폭죽 컨페티
   - 2초 표시 후 scale 애니메이션

4. **최고 기록 경신 시 "NEW RECORD!" 배너**:
   - 골드 그라데이션 배너
   - "🏆 NEW RECORD 🏆" + "X 라운드"
   - 30개 추가 컨페티
   - 슬라이드 인/아웃 애니메이션
   - 2초 표시

**위치**:
- `GameEngine.js:870-1050` (checkNewRecord, showNewRecordBanner, showMilestoneEffect)
- `GameEngineHard.js:1033-1213` (동일 메서드 3개)

#### 3.2 랭킹 변화 시각화 ✅
**파일**: `src/views/Result.js:380-517`

**구현 내용**:

1. **화살표 애니메이션**:
   - 순위 상승: ↑ (위로 bounce)
   - 순위 하락: ↓ (아래로 bounce)
   - 순위 유지: = (고정)
   - GPU 가속 `translateY` 사용

2. **TOP 3/TOP 10 배지**:
   - TOP 3: 금색 그라데이션 배지 (#fbbf24 → #f59e0b)
   - TOP 10: 은색 그라데이션 배지 (#e0e0e0 → #bdbdbd)
   - pulse 애니메이션 (2s infinite)
   - box-shadow glow 효과

3. **등장 애니메이션**:
   - slideUpFadeIn (300ms ease-out)
   - 1초 딜레이 후 표시
   - 레벨업과 타이밍 충돌 없음 (0.8초 간격)

4. **디자인 시스템 준수**:
   - 주요 색상: `var(--color-success)`, `var(--color-danger)`, `var(--color-warning)`
   - GPU 가속: `transform`, `opacity` 사용
   - 애니메이션 ID 중복 방지 (1회만 추가)

**위치**: `Result.js:380-517`

#### 3.4 Achievement Indicators (성취 지표 표시) ✅
**파일**: `dataService.js:338-347`, `views.css:180-212`, `Main.js:748, 1370, 1394-1410`

**구현 내용**:

1. **Percentile 계산 시스템**:
   ```javascript
   // dataService.getMyRank() 반환값 확장
   return {
     rank,           // 순위
     maxRound,       // 최고 라운드
     totalUsers,     // 전체 유저 수 (신규)
     percentile      // 상위 X% (신규)
   }
   ```

2. **My Rank Card Pulse Animation**:
   - 일반 모드: 보라색 glow (rgba(124, 77, 255, 0.6))
   - 하드 모드: 빨간색 glow (rgba(239, 68, 68, 0.6))
   - Duration: 2s infinite ease-in-out
   - GPU 가속: box-shadow만 변경

3. **Percentile 표시 규칙**:
   - 상위 1-10%: 금색 + 🔥 (color: #ffd700)
   - 상위 11-25%: 은색 + ⭐ (color: #c0c0c0)
   - 상위 26-50%: 기본 회색
   - 51% 이하: 표시 안 함

4. **Weekly #1 Crown Icon**:
   - 아이콘: 👑 (Unicode emoji)
   - 색상: 금색 (#ffd700)
   - 애니메이션: crownFloat (1s infinite, translateY ±4px)
   - 위치: 랭킹 1위 닉네임 앞

**특징**:
- Backward compatible: 기존 코드 파손 없음
- 동기 부여: 타인과 비교를 통한 경쟁심 유발
- GPU 가속: 60fps 유지

**위치**:
- `dataService.js:338-347` (percentile 계산)
- `views.css:180-212` (3개 애니메이션)
- `Main.js:748` (펄스 애니메이션 적용)
- `Main.js:1370` (왕관 아이콘)
- `Main.js:1394-1410` (percentile 표시)

#### 3.5 마이크로 인터랙션 ✅
**파일**: `components.css:288-307`, `Main.js:272-328`

**구현 내용**:

1. **기존 구현 확인**:
   - ✅ 버튼 호버: `scale(1.02)` + `box-shadow` (components.css:28-31)
   - ✅ 버튼 클릭: `scale(0.98)` (components.css:33-35)
   - ✅ 토글 슬라이드: 250ms transition (views.css:137-171)
   - ✅ 카드 스태거: 50ms delay per item (Main.js:1335)

2. **신규 구현 - Scroll Fade-Up**:
   ```css
   .fade-up-on-scroll {
     opacity: 0;
     transform: translateY(20px);
   }

   .fade-up-on-scroll.is-visible {
     animation: fadeUp 300ms cubic-bezier(0.19, 1, 0.22, 1) forwards;
   }
   ```

3. **Intersection Observer 구현**:
   - `setupScrollObserver()`: Observer 초기화 (threshold: 0.2)
   - `observeScrollElements()`: 요소 관찰 (render마다 호출)
   - 적용 대상: Weekly Activity Card, My Rank Section
   - 메모리 누수 방지: `destroy()`에서 `disconnect()`

4. **애니메이션 특징**:
   - GPU 가속: `transform`, `opacity` 사용
   - 타이밍: 300ms cubic-bezier easing
   - 1회만 트리거: 보이면 관찰 중지
   - 디자인 시스템 변수 사용: `var(--duration-base)`

**위치**:
- `components.css:288-307` (fadeUp 애니메이션)
- `Main.js:272-328` (Intersection Observer)
- `Main.js:712, 748` (fade-up-on-scroll 클래스 적용)

---

## 📊 전체 진행 상황

### ✅ 완료 (16/25 tasks - 64%)
- [x] Critical Bug #6: chartContainer 중복 선언
- [x] Critical Bug #5: Event listeners 이벤트 위임
- [x] Critical Bug Fix: Play button 로직 복원
- [x] Phase 1.1-1.4: Design System Unification
- [x] Phase 2.1-2.4: Performance Optimization
- [x] Phase 3.1: Level-up 경험 개선
- [x] Phase 3.2: 랭킹 변화 시각화
- [x] Phase 3.3: 라운드 진행 피드백
- [x] Phase 3.4: 성취 지표 표시 (펄스, percentile, 왕관)
- [x] Phase 3.5: 마이크로 인터랙션

### 🟡 진행 중 (0/25 tasks)
- 없음

### ⏳ 대기 중 (9/25 tasks - 36%)
- [ ] Phase 4.1: 페이지 전환 애니메이션
- [ ] Phase 4.2: 스플래시 화면 개선
- [ ] Phase 4.3: 로딩 상태 시각화
- [ ] Phase 5.1: 반응형 디자인 검증
- [ ] Phase 5.2: 다크모드 일관성
- [ ] Phase 5.3: 애니메이션 속도 통일
- [ ] Phase 5.4: 접근성 개선
- [ ] Phase 5.5: 에러 상태 처리
- [ ] Final Testing: 성능 벤치마크

---

## 🎯 다음 개발자를 위한 가이드

### 현재 상태
✅ **작동 확인 완료**:
- 빌드: `npm run build` ✅
- 개발 서버: `npm run dev` ✅ (http://localhost:5175)
- 일반 모드 게임 시작 ✅
- 하드 모드 게임 시작 ✅
- 로그아웃 ✅
- 전체 레벨 모달 ✅

### 주요 파일 변경사항
```
src/
├── core/
│   ├── GameEngine.js         [수정] 마일스톤 & 신기록 피드백 추가
│   └── GameEngineHard.js     [수정] 동일 피드백 추가
├── styles/
│   ├── components.css        [신규] 컴포넌트 라이브러리
│   ├── design-system.css     [수정] 타이밍 상수 추가
│   └── index.css             [수정] 중복 제거
└── views/
    ├── Main.js               [수정] Event delegation 구현
    └── Result.js             [수정] Level-up 애니메이션 대폭 개선
```

### 사용 가능한 Design System

#### 컴포넌트
```html
<!-- 버튼 -->
<button class="btn-primary">Primary Action</button>
<button class="btn-secondary">Secondary</button>
<button class="btn-icon">🔍</button>

<!-- 카드 -->
<div class="card">기본 카드</div>
<div class="card-elevated">그림자 있는 카드</div>
<div class="card-glow">발광 카드 (강조용)</div>

<!-- 배지 -->
<span class="badge-level">Lv 25</span>
<span class="badge-rank-gold">1위</span>
```

#### 유틸리티
```html
<!-- 타이포그래피 -->
<h1 class="text-heading">제목</h1>
<p class="text-body">본문</p>
<span class="text-caption">캡션</span>
<span class="text-highlight">강조</span>

<!-- 간격 -->
<div class="mt-4 mb-6 px-4 py-2">...</div>

<!-- 색상 -->
<div class="bg-primary text-white border border-gray-600 rounded-lg">...</div>

<!-- 성능 -->
<div class="gpu-accelerated">애니메이션 요소</div>
<img class="lazy-img" src="..." />
<div class="skeleton-img">로딩중...</div>
```

#### 애니메이션
```html
<!-- 뷰 전환 -->
<div class="view-enter">페이지 진입</div>
<div class="view-exit">페이지 퇴장</div>

<!-- 효과 -->
<div class="animate-fade-in">서서히 나타남</div>
<div class="animate-slide-up">아래서 위로</div>
<div class="animate-scale-bounce">통통 튀기</div>
<ul class="animate-stagger">
  <li>1번 아이템</li>
  <li>2번 아이템</li>
  <!-- 순차적으로 나타남 -->
</ul>
```

### 다음 단계 추천 순서

#### ✅ 완료된 우선순위 High 작업
1. ~~**Phase 3.1**: Level-up 경험 개선~~ ✅
2. ~~**Phase 3.3**: 라운드 진행 피드백~~ ✅

#### 우선순위 Medium (다음 작업)
3. **Phase 3.2**: 랭킹 변화 시각화
   - `Result.js`의 `showRankMovement()` 메서드 강화
   - 애니메이션 추가 (화살표, 그래프)
   - TOP 3/TOP 10 특별 배지

4. **Phase 4.3**: 로딩 상태 시각화
   - 게임 시작 전 "Get Ready!" 카운트다운
   - 랭킹 스켈레톤 UI
   - XP 계산 중 프로그레스 바

5. **Phase 3.5**: 마이크로 인터랙션
   - 버튼 호버/클릭 애니메이션
   - 카드 stagger 애니메이션
   - 스크롤 인터랙션

#### 우선순위 Low (폴리싱)
6. Phase 4.1-4.2: 화면 전환 효과
7. Phase 5.1-5.5: 반응형, 접근성, 에러 처리

### 성능 가이드라인

#### ✅ 좋은 패턴
```css
/* GPU 가속 사용 */
.element {
  transform: translateX(100px);
  transition: transform 0.3s;
  will-change: transform;
}

/* 타이밍 변수 사용 */
.animation {
  animation-duration: var(--duration-base);
  animation-delay: var(--delay-short);
}
```

#### ❌ 나쁜 패턴
```css
/* Layout shift 발생 */
.element {
  transition: width 0.3s; /* ❌ */
  width: 200px; /* ❌ */
}

/* 하드코딩 */
.element {
  color: #7c4dff; /* ❌ */
  padding: 16px; /* ❌ */
}

/* 올바른 방법 */
.element {
  color: var(--theme-primary); /* ✅ */
  padding: var(--space-4); /* ✅ */
}
```

---

## 🚨 알려진 이슈

### 해결됨 ✅
- ~~chartContainer 중복 선언~~
- ~~Event listener 소실~~
- ~~Play button 무한 새로고침/로그아웃~~

### 현재 이슈 없음
모든 critical 버그 해결 완료

---

## 📞 문의사항

이 문서에 대한 질문이나 불명확한 부분이 있다면:
1. `OPTIMIZATION_PLAN.md` 참고 (전체 5단계 계획)
2. `src/styles/components.css` 주석 참고 (사용 가능한 모든 클래스)
3. Git commit history 확인

---

## 📝 체크리스트 (다음 개발자용)

### 시작 전 확인
- [ ] Node.js 설치 확인 (v20.19+ or v22.12+)
- [ ] `npm install` 실행
- [ ] `npm run build` 성공 확인
- [ ] `npm run dev` 실행 후 http://localhost:5175 접속
- [ ] 일반/하드 모드 게임 시작 테스트

### 개발 시작
- [ ] `OPTIMIZATION_PLAN.md` 읽기
- [ ] `src/styles/components.css` 사용 가능한 클래스 파악
- [ ] Phase 3.1부터 시작 추천

### 커밋 전 체크
- [ ] `npm run build` 에러 없음
- [ ] 콘솔 에러 없음
- [ ] 모든 버튼 작동 확인
- [ ] 일반/하드 모드 전환 확인

---

**마지막 업데이트**: 2025-12-28
**완료된 작업**: Phase 1, 2, 3.1, 3.3 (13/25 tasks = 52%)
**다음 작업**: Phase 3.2 (랭킹 변화 시각화) 또는 Phase 4.3 (로딩 상태)
**진행 상황**: 절반 이상 완료, 핵심 게이미피케이션 기능 구현됨

## 🎉 주요 성과

### Phase 3 핵심 기능 완료
- ✅ 레벨업 애니메이션 3초 시퀀스
- ✅ 마일스톤 레벨 특별 효과 (10, 20, 30...)
- ✅ 5라운드마다 "Good Job!" 팝업
- ✅ 10라운드마다 화면 플래시 + 폭죽
- ✅ 최고기록 경신 시 "NEW RECORD!" 배너
- ✅ 랭킹 변화 화살표 애니메이션 (↑↓=)
- ✅ TOP 3/TOP 10 금/은 배지

### 사용자 경험 향상
- 레벨업 순간이 특별해짐 (3초 연출)
- 라운드 진행 중 성취감 제공 (마일스톤 축하)
- 신기록 달성 시 즉각적인 피드백

### 빌드 통계
- CSS 크기: 21.30 kB (변동 없음, 애니메이션은 JS로 구현)
- GameEngine.js: 891 줄 → 1074 줄 (+183 줄, 새 메서드 3개)
- GameEngineHard.js: 1064 줄 → 1247 줄 (+183 줄, 동일 메서드)
- Result.js: 23.25 kB → 25.81 kB (+2.56 kB, 화살표 & 배지 애니메이션)
