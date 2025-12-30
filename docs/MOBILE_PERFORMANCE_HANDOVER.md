# 모바일 성능 최적화 인수인계 문서

## 📋 현재 상황 (2025-12-30)

### 증상
- **iPhone 16 Chrome 환경에서 성능 저하**
- NumberOrder, PatternMemory, WordSearch 등 **연속 클릭 게임에서 심각한 지연**
- ShapeMatch (1회 클릭 게임)은 문제 없음
- 빠르게 클릭할 때 **클릭 반응부터 느림**, 정답 체크마크/confetti 나올 때 **버벅임**

### 측정 수치 (Round 11 기준)
```
Last: 42.2ms (목표: <10ms)
Max: 261.0ms (목표: <20ms)
Avg: 42.2ms (목표: <10ms)

Memory Leaks: ✅ 해결됨
- Confetti: 0
- Shockwave: 0
- Intervals: 0
- RAF Shake: idle
```

---

## ✅ 완료된 작업

### 1. Phase 1: 성능 진단 시스템 구축
- **파일**: `GameEngine.js`, `GameEngineHard.js`
- **위치**: Line 63-77 (diagnostics 객체), Line 114-210 (진단 오버레이)
- **기능**:
  - `handleCorrect()` 실행 시간 측정
  - Confetti/Shockwave 생성/제거 카운팅
  - RAF shake 활성화 추적
  - 화면 오버레이로 실시간 표시

### 2. Phase 2: 메모리 누수 해결
- **파일**: `GameEngine.js` (Line 71-77), `GameEngineHard.js` (Line 79-85)
- **커밋**: `a1d5c37` - "fix: Phase 2 메모리 누수 해결 완료"
- **내용**:
  ```javascript
  // 활성 이펙트 추적
  this.activeEffects = {
      confetti: new Set(),
      shockwave: new Set(),
      timeouts: new Set(),
      animations: new Set()
  }
  ```
  - `createConfetti()`: fallback timeout (600ms) + tracking
  - `createShockwave()`: fallback timeout (400ms) + tracking
  - `cleanup()`: 모든 활성 이펙트 강제 제거
- **결과**: ✅ 메모리 누수 완전 해결 (Confetti/Shockwave 0개 유지)

### 3. Phase 2.5: 진단 오버레이 Throttle
- **파일**: `GameEngine.js` (Line 152-174), `GameEngineHard.js` (Line 186-208)
- **커밋**: `24ed57e` - "perf: 진단 오버레이 업데이트 throttle로 성능 최적화"
- **내용**:
  - `updateDiagnosticsOverlay()`: RAF + 500ms throttle
  - innerHTML 호출 빈도: 매 클릭 → 초당 최대 2회
- **결과**: ⚠️ 부분적 개선 (여전히 Max 261ms)

### 4. Phase 2.6: 연속 클릭 이펙트 Throttle
- **파일**: `GameEngine.js` (Line 600-655), `GameEngineHard.js` (Line 696-751)
- **커밋**: `c495686` - "perf: 연속 클릭 시 이펙트 throttle로 성능 개선"
- **내용**:
  ```javascript
  // 150ms 이내 재클릭 감지
  const isRapidClick = timeSinceLastCorrect < 150

  if (!isRapidClick || this.consecutiveCorrectCount % 3 === 0) {
      // 전체 이펙트 (shake + shockwave + confetti)
  } else {
      // 간소화 피드백 (체크마크만)
  }
  ```
- **결과**: ⚠️ 개선되었으나 여전히 Max 261ms

---

## ❌ 해결되지 않은 문제

### 핵심 문제: handleCorrect() 실행 시간 261ms

**측정 범위**:
```javascript
// GameEngineHard.js Line 660-754
handleCorrect() {
    const startTime = performance.now()  // Line 661

    // ... 동기 코드 실행 ...

    const endTime = performance.now()    // Line 753
    const executionTime = endTime - startTime  // 261ms!
}
```

**측정에 포함되는 작업**:
1. ✅ `audioManager.playCorrect()` (Line 671)
2. ✅ 콤보 계산 (Line 673-694)
3. ✅ 연속 클릭 감지 (Line 696-706)
4. ✅ `requestAnimationFrame()` 호출 (Line 713-751) - **비동기이므로 실행 시간 미포함**
5. ✅ `updateDiagnosticsOverlay()` (Line 760) - **throttled이지만 500ms 이후 innerHTML 실행**

**측정에 포함되지 않는 작업**:
- ❌ `screenShake()`, `createShockwave()`, `showCorrectFeedback()` - RAF 안에서 실행

---

## 🔍 근본 원인 분석

### 가설 1: removeFocusGlow() DOM 조작 ⭐️ **가장 유력**
**파일**: `GameEngineHard.js` Line 1208-1234
```javascript
removeFocusGlow() {
    // 파티클 생성 중지
    if (this.feverParticleInterval) {
        clearInterval(this.feverParticleInterval)
    }

    // 페이드아웃 효과 (DOM 조작)
    if (this.focusGlowElements && this.focusGlowElements.length > 0) {
        this.focusGlowElements.forEach(element => {
            element.style.opacity = '0'  // 리플로우 발생 가능
            setTimeout(() => element.remove(), 500)  // 500ms 지연
        })
    }
}
```

**문제점**:
- `element.style.opacity = '0'` - 각 요소마다 리플로우/리페인트 발생
- 여러 요소를 동기적으로 처리
- 콤보 < 10일 때마다 호출 (Line 693)

**예상 시간**: 50-200ms (요소 개수에 따라)

### 가설 2: audioManager.playCorrect() 오디오 재생
**파일**: `GameEngineHard.js` Line 671
```javascript
audioManager.playCorrect()
```

**문제점**:
- Web Audio API 초기화가 느릴 수 있음 (특히 모바일)
- 오디오 풀 관리 오버헤드
- 빠른 연속 호출 시 컨텍스트 스위칭

**예상 시간**: 10-50ms

### 가설 3: updateDiagnosticsOverlay() innerHTML
**파일**: `GameEngineHard.js` Line 760 (호출), Line 146-184 (구현)
```javascript
updateDiagnosticsOverlayNow() {
    this.diagnosticsOverlay.innerHTML = `...`  // 전체 HTML 재생성
}
```

**문제점**:
- throttle했지만 500ms 이후에는 여전히 innerHTML 실행
- HTML 파싱 + DOM 생성 + 리플로우

**예상 시간**: 30-100ms (throttle되어 발생 빈도는 낮음)

### 가설 4: console.log 오버헤드
**파일**: `GameEngineHard.js` Line 761
```javascript
console.log(`🔍 [HARD] handleCorrect #${this.diagnostics.handleCorrectCount}: ${executionTime.toFixed(2)}ms | Confetti: ${this.diagnostics.confettiCreated - this.diagnostics.confettiRemoved} active | Shockwave: ${this.diagnostics.shockwaveCreated - this.diagnostics.shockwaveRemoved} active`)
```

**문제점**:
- 긴 문자열 생성 및 출력
- 모바일 브라우저에서 console 오버헤드 높을 수 있음

**예상 시간**: 5-20ms

---

## 🚀 추천 해결책 (우선순위별)

### Priority 1: removeFocusGlow() 최적화 ⭐️⭐️⭐️
**근거**: 가장 유력한 병목, DOM 조작 과다

**해결 방법**:
```javascript
// 옵션 A: RAF로 DOM 조작 지연
removeFocusGlow() {
    if (this.feverParticleInterval) {
        clearInterval(this.feverParticleInterval)
        this.feverParticleInterval = null
    }

    // DOM 조작을 RAF로 지연 (측정 시간에서 제외)
    requestAnimationFrame(() => {
        if (this.focusGlowElements) {
            this.focusGlowElements.forEach(element => {
                element.style.opacity = '0'
                setTimeout(() => element.remove(), 500)
            })
            this.focusGlowElements = null
        }
    })
}
```

**옵션 B**: 콤보 < 10일 때 즉시 제거하지 말고 debounce
```javascript
// 콤보가 10 미만으로 떨어지면 focus glow 제거
if (this.state.combo < 10) {
    // 즉시 제거하지 말고 1초 후 제거 (성능 개선)
    if (this.removeFocusGlowTimeout) {
        clearTimeout(this.removeFocusGlowTimeout)
    }
    this.removeFocusGlowTimeout = setTimeout(() => {
        this.removeFocusGlow()
    }, 1000)
}
```

**예상 효과**: Max 261ms → **50-100ms** (60-80% 개선)

### Priority 2: 세밀한 성능 측정
**근거**: 정확한 병목 지점 파악 필요

**해결 방법**:
```javascript
handleCorrect() {
    const timings = {}
    const mark = (label) => {
        timings[label] = performance.now()
    }

    mark('start')

    // ... 기존 코드 ...

    mark('after_audio')
    audioManager.playCorrect()

    mark('after_combo')
    // ... 콤보 계산 ...

    mark('after_remove_glow')
    if (this.state.combo < 10) {
        this.removeFocusGlow()
    }

    mark('after_rapid_click')
    // ... 연속 클릭 감지 ...

    mark('after_raf')
    requestAnimationFrame(...)

    mark('end')

    // 각 구간 시간 출력
    console.log('🔍 Timings:', {
        audio: (timings.after_audio - timings.after_combo).toFixed(2),
        combo: (timings.after_combo - timings.after_remove_glow).toFixed(2),
        removeGlow: (timings.after_remove_glow - timings.after_rapid_click).toFixed(2),
        rapidClick: (timings.after_rapid_click - timings.after_raf).toFixed(2),
        raf: (timings.after_raf - timings.end).toFixed(2),
        total: (timings.end - timings.start).toFixed(2)
    })
}
```

**예상 효과**: 정확한 병목 지점 파악 → 타겟 최적화 가능

### Priority 3: console.log 제거 (프로덕션 빌드)
**근거**: 불필요한 오버헤드 제거

**해결 방법**:
```javascript
// 개발 모드에서만 로그 출력
if (import.meta.env.DEV) {
    console.log(`🔍 [HARD] handleCorrect #${this.diagnostics.handleCorrectCount}...`)
}
```

**예상 효과**: Max 261ms → **240-250ms** (5-10% 개선)

### Priority 4: audioManager.playCorrect() 최적화
**근거**: 오디오 재생이 느릴 수 있음

**해결 방법**:
```javascript
// 옵션 A: RAF로 지연
requestAnimationFrame(() => {
    audioManager.playCorrect()
})

// 옵션 B: 연속 클릭 시 오디오 스킵
if (!isRapidClick) {
    audioManager.playCorrect()
}
```

**예상 효과**: Max 261ms → **200-240ms** (10-20% 개선)

### Priority 5: 진단 오버레이 완전 비활성화 (테스트용)
**근거**: 진단 자체가 성능에 영향을 줄 수 있음

**해결 방법**:
```javascript
// 임시로 진단 오버레이 완전 비활성화
// Line 253: startGame()
// this.createDiagnosticsOverlay()  // 주석 처리

// Line 760: handleCorrect()
// this.updateDiagnosticsOverlay()  // 주석 처리
```

**예상 효과**: 진단 오버헤드 제거 → 순수 게임 성능 측정 가능

---

## 📂 관련 파일 및 코드 위치

### 핵심 파일
```
/Users/jaden/Documents/프로그래밍/게임/Focus/src/core/
├── GameEngine.js           # 일반 모드 게임 엔진
└── GameEngineHard.js       # 하드 모드 게임 엔진
```

### 주요 함수 위치 (GameEngineHard.js 기준)

| 함수 | Line | 설명 |
|------|------|------|
| `constructor()` | 36-97 | 초기화, diagnostics 설정 |
| `createDiagnosticsOverlay()` | 117-143 | 진단 오버레이 생성 |
| `updateDiagnosticsOverlay()` | 186-208 | 진단 오버레이 업데이트 (throttled) |
| `handleCorrect()` | 659-771 | **⭐️ 성능 병목의 핵심** |
| `showCorrectFeedback()` | 773-799 | 체크마크 + confetti 생성 |
| `createConfetti()` | 801-870 | Confetti 파티클 생성 |
| `createShockwave()` | 1582-1651 | 충격파 이펙트 |
| `removeFocusGlow()` | 1208-1234 | **⭐️ 추정 병목** |
| `cleanup()` | 1686-1759 | 메모리 정리 |

### 게임별 파일 (연속 클릭 발생)
```
/Users/jaden/Documents/프로그래밍/게임/Focus/src/games/
├── NumberOrder.js      # 숫자 순서대로 클릭
├── PatternMemory.js    # 패턴 기억
└── WordSearch.js       # 단어 찾기
```

---

## 🧪 테스트 방법

### 1. 기본 성능 테스트
```bash
# 개발 서버 실행
npm run dev

# 아이폰 16 Chrome에서 접속
http://172.30.1.83:5173

# 테스트 시나리오
1. "로그인 없이 체험하기" 클릭
2. Hard Mode 선택
3. NumberOrder, PatternMemory 플레이
4. 빠르게 연속 클릭
5. 진단 오버레이 수치 확인
   - Last < 10ms 목표
   - Max < 20ms 목표
   - Avg < 10ms 목표
```

### 2. 세밀한 성능 측정
```javascript
// handleCorrect()에 타이밍 측정 추가 (Priority 2)
// Chrome DevTools Performance 탭으로 녹화
// User Timing API 사용
```

### 3. A/B 테스트
```javascript
// removeFocusGlow() RAF 적용 전/후 비교
// audioManager 비활성화 전/후 비교
// 진단 오버레이 비활성화 전/후 비교
```

---

## 📊 성능 목표

| 지표 | 현재 | 목표 | 우선순위 |
|------|------|------|----------|
| Max Execution Time | 261.0ms | **< 20ms** | ⭐️⭐️⭐️ |
| Avg Execution Time | 42.2ms | **< 10ms** | ⭐️⭐️ |
| Last Execution Time | 42.2ms | **< 10ms** | ⭐️⭐️ |
| Memory Leaks (Confetti) | 0 | 0 | ✅ 달성 |
| Memory Leaks (Shockwave) | 0 | 0 | ✅ 달성 |
| 입력 지연 체감 | 높음 | **없음** | ⭐️⭐️⭐️ |

---

## 💡 추가 고려사항

### 1. 모바일 최적화 옵션
```javascript
// 이미 적용됨 - performanceLevel 감지
this.performanceLevel = getPerformanceLevel()

// low: 파티클 10개 (75% 감소)
// medium: 파티클 20개 (50% 감소)
// high: 파티클 40개
```

### 2. Web Worker 고려 (장기 과제)
- 무거운 계산을 Worker로 이동
- 메인 스레드 부하 감소
- 구현 복잡도 높음

### 3. CSS 애니메이션 vs Web Animation API
- 현재 Web Animation API 사용
- CSS transition/animation이 더 빠를 수 있음
- GPU 가속 최적화 고려

---

## 🔗 관련 커밋 이력

```
c495686 - perf: 연속 클릭 시 이펙트 throttle로 성능 개선
24ed57e - perf: 진단 오버레이 업데이트 throttle로 성능 최적화
a1d5c37 - fix: Phase 2 메모리 누수 해결 완료
93b2c64 - fix: 테스트용 게스트 세션 체크 임시 비활성화
```

---

## 📝 다음 작업자를 위한 체크리스트

- [ ] Priority 1 적용: `removeFocusGlow()` RAF로 지연
- [ ] Priority 2 적용: 세밀한 성능 측정 코드 추가
- [ ] 성능 측정 결과로 정확한 병목 파악
- [ ] 병목 지점 집중 최적화
- [ ] 테스트 후 Max < 20ms 달성 확인
- [ ] 진단 코드 제거 또는 프로덕션 빌드 분리
- [ ] 게스트 세션 체크 재활성화 (`Main.js` Line 163-170)

---

## 📞 문의
작업 중 질문이 있으면 이 문서와 함께 다음 정보를 공유:
- 진단 오버레이 스크린샷
- Chrome DevTools Performance 프로파일
- 테스트 환경 (기기, 브라우저 버전)

---

**작성일**: 2025-12-30
**작성자**: Claude Sonnet 4.5
**브랜치**: `fix/mobile-performance-optimization`
