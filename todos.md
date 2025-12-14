# 하드모드 개선 및 진입점 구현 - 작업 체크리스트

## 📋 개요
Focus 게임에 하드모드 토글 시스템, 모드별 랭킹 분리, UI 개선을 구현합니다.

---

## ✅ Phase 1: 기반 구조 (DB & Store)

### Task 1.1: DB 스키마 확장
- [x] Supabase에서 game_records 테이블에 mode 컬럼 추가 ✅
  ```sql
  ALTER TABLE game_records
  ADD COLUMN mode text DEFAULT 'normal' NOT NULL;
  ```

### Task 1.2: Store 상태 추가
- [x] `/src/core/store.js`에 `isHardMode: false` 상태 추가 ✅

### Task 1.3: Store setState 로직
- [x] setState에서 isHardMode 변경 시 body 클래스 토글 로직 추가 ✅

---

## 🎨 Phase 2: CSS 테마 시스템

### Task 2.1: 테마 변수 정의
- [x] `/src/styles/design-system.css`에 테마 변수 추가 ✅
  - :root에 --theme-primary, --theme-timer 등
  - body.hard-mode에 빨간색 오버라이드

### Task 2.2: game.css 색상 변경
- [x] `/src/styles/game.css`에서 `var(--color-accent)` → `var(--theme-accent)` 변경 ✅

### Task 2.3: views.css 트랜지션 추가
- [x] `/src/styles/views.css`에서 색상 요소에 `transition: var(--theme-transition)` 추가 ✅

### Task 2.4: 게임오버 애니메이션
- [x] shake 애니메이션 CSS 추가 (게임오버 이펙트용) ✅

---

## 🎮 Phase 3: 하드모드 토글 UI

### Task 3.1: 토글 HTML 추가
- [x] `/src/views/Main.js`에 토글 스위치 HTML 추가 (action-area 내부) ✅

### Task 3.2: 토글 CSS 스타일
- [x] `/src/styles/views.css`에 토글 스위치 스타일 추가 ✅

### Task 3.3: 토글 이벤트 핸들러
- [x] 토글 change 이벤트 → store 업데이트 + 랭킹 리로드 ✅

---

## 📱 Phase 4: 메인 화면 스크롤 개선

### Task 4.1: HTML 구조 변경
- [x] `/src/views/Main.js` HTML 구조 변경 ✅
  - header-fixed
  - main-content-scroll
  - action-area-fixed

### Task 4.2: 스크롤 CSS 추가
- [x] `/src/styles/views.css`에 스크롤 관련 CSS 추가 ✅

### Task 4.3: rank-list overflow 제거
- [x] rank-list에서 overflow-y: auto 제거 (상위에서 처리) ✅

---

## 🏆 Phase 5: 랭킹 시스템 모드 분리

### Task 5.1: fetchWeeklyRanking 수정
- [x] `/src/services/dataService.js` - fetchWeeklyRanking에 mode 파라미터 추가 ✅

### Task 5.2: getMyRank 수정
- [x] `/src/services/dataService.js` - getMyRank에 mode 파라미터 추가 ✅

### Task 5.3: saveGameRecord 수정
- [x] `/src/services/dataService.js` - saveGameRecord에 mode 파라미터 추가 ✅

### Task 5.4: loadRanking 모드별 조회
- [x] `/src/views/Main.js` - loadRanking()에서 모드별 조회 로직 추가 ✅

### Task 5.5: 랭킹 헤더 배지
- [x] 랭킹 헤더에 하드모드 배지 표시 추가 ✅

---

## 🚀 Phase 6: 게임 라우팅 및 XP 시스템

### Task 6.1: 모드별 라우팅
- [x] `/src/views/Main.js` - 게임 시작 버튼에서 모드별 라우팅 ✅
  - isHardMode ? '/game/hard' : '/game'

### Task 6.2: XP 3배 계산
- [x] `/src/core/GameEngineHard.js` - handleGameOver에서 XP 3배 계산 ✅

### Task 6.3: XP 보너스 표시
- [x] `/src/views/Result.js` - 하드모드 XP 보너스 표시 추가 ✅
  - "🔥 하드모드 보너스 (x3)"

### Task 6.4: 게임 결과 저장
- [x] `/src/views/Result.js` - saveGameRecord 호출 시 mode 전달 ✅

---

## 💥 Phase 7: 하드모드 게임오버 이펙트

### Task 7.1: 화면 진동 효과
- [x] `/src/core/GameEngineHard.js` - handleWrong에 shake 애니메이션 추가 ✅

### Task 7.2: 페이드아웃 효과
- [x] `/src/core/GameEngineHard.js` - handleWrong에 페이드아웃 효과 추가 ✅

### Task 7.3: 이펙트 타이밍 조정
- [x] 진동 0.5초 → 페이드아웃 0.5초 → 게임오버 순서 조정 ✅

---

## 🎯 Phase 8: ColorSequence UI 개선

### Task 8.1: HTML 구조 변경
- [ ] `/src/games/ColorSequence.js` - button → div로 변경

### Task 8.2: CSS 클래스 추가
- [ ] `/src/styles/game.css`에 color-tile 클래스 추가

### Task 8.3: flashButton 클래스 기반
- [ ] flashButton 메서드를 인라인 스타일 → 클래스 기반으로 변경

### Task 8.4: enableInput 클래스 기반
- [ ] enableInput 클릭 피드백을 클래스 기반으로 변경

---

## 🧪 Phase 9: 통합 테스트

### Task 9.1: DB 확인
- [x] mode 컬럼이 정상적으로 추가되었는지 확인 ✅

### Task 9.2: 토글 및 색상 전환
- [x] 토글 ON/OFF 동작 확인 (테스트 중)
- [x] 색상 전환 애니메이션 (0.3초) 확인 (테스트 중)

### Task 9.3: 하드모드 진입 및 XP
- [ ] /game/hard 라우팅 확인
- [ ] XP 3배 적용 확인
- [ ] 결과 화면에 보너스 표시 확인

### Task 9.4: 게임오버 이펙트
- [ ] 화면 진동 효과 확인
- [ ] 페이드아웃 효과 확인

### Task 9.5: 랭킹 분리
- [ ] 일반모드/하드모드 랭킹이 분리되어 표시되는지 확인

### Task 9.6: ColorSequence UI
- [ ] PatternMemory 스타일로 변경되었는지 확인

### Task 9.7: 메인 화면 스크롤
- [x] 헤더/버튼 고정, 중간만 스크롤 확인 ✅

### Task 9.8: 모바일 테스트
- [ ] iOS/Android 환경에서 정상 동작 확인

---

## 🔧 추가 수정 사항 (2025-12-14)

### 버그 수정 및 개선
- [x] 버튼 위치 문제 수정 (max-width: 100vw, box-sizing 추가) ✅
- [x] 하드모드 색상 전체 적용 ✅
  - XP Progress Card 테두리 및 텍스트
  - XP Progress Bar
  - Weekly Activity 바
  - My Rank 테두리 및 순위 텍스트
  - 게임시작 버튼 (btn-primary)
- [x] 게임 로직 수정 (최소 2칸 간격) ✅
  - `>` → `>=` 연산자 변경
  - Final fallback: 최소 1칸 간격 추가
  - GameEngine.js와 GameEngineHard.js 모두 적용

---

## 📌 주의사항

1. **DB 작업**: Supabase에서 mode 컬럼 추가는 로컬/개발 환경에서 먼저 테스트
2. **CSS 변수**: 점진적으로 적용, 한 번에 모두 바꾸지 말 것
3. **body 클래스**: store.setState에서 일괄 관리
4. **스크롤 영역**: 고정 영역 배경색 명확히 지정
5. **iOS 최적화**: -webkit-overflow-scrolling: touch 적용

---

## 📁 핵심 파일 목록

- `/src/core/store.js`
- `/src/views/Main.js`
- `/src/services/dataService.js`
- `/src/styles/design-system.css`
- `/src/styles/views.css`
- `/src/styles/game.css`
- `/src/games/ColorSequence.js`
- `/src/core/GameEngineHard.js`
- `/src/views/Result.js`

---

**작업 시작일**: 2025-12-14
**총 작업**: 9 Phases, 37 Tasks
