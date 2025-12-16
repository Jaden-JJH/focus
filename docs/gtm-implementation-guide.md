# GTM Implementation Guide - Focus 게임

**버전:** 2.0.0
**작성일:** 2025-12-16
**상태:** ✅ 전체 구현 완료

---

## 📋 목차

1. [시작하기](#시작하기)
2. [Priority 1 이벤트 구현](#priority-1-이벤트-구현)
3. [코드 구현 예시](#코드-구현-예시)
4. [테스트 및 디버깅](#테스트-및-디버깅)
5. [체크리스트](#체크리스트)

---

## 시작하기

### GTM 컨테이너 정보
- **Container ID:** `GTM-MV5PTG9B`
- **GA4 Measurement ID:** `G-2SR7G1MPKL`

### 구현할 이벤트 개수
- **총 10개 이벤트**
- **Priority 1:** 5개 (즉시 구현 권장)
- **Priority 2:** 3개
- **Priority 3:** 2개

### 사전 준비
1. ✅ GTM 스니펫 설치 완료 (`index.html`)
2. ✅ GA4 Configuration 태그 생성
3. ⬜ DataLayer 변수 생성
4. ⬜ 이벤트 트리거 및 태그 생성

---

## Priority 1 이벤트 구현

핵심 비즈니스 지표를 측정하는 **5개 이벤트**를 먼저 구현합니다.

---

### 1. `login` - 로그인 이벤트

#### GTM 설정

**1단계: DataLayer 변수 생성**

| 변수 이름 | 변수 유형 | Data Layer 변수 이름 |
|----------|----------|---------------------|
| DLV - method | 데이터 영역 변수 | method |

**2단계: 트리거 생성**

```
트리거 이름: CE - login
트리거 유형: 맞춤 이벤트
이벤트 이름: login
```

**3단계: 태그 생성**

```
태그 이름: GA4 - Login
태그 유형: Google 애널리틱스: GA4 이벤트
구성 태그: GA4 Configuration

이벤트 이름: login

이벤트 매개변수:
  - 매개변수 이름: method
  - 값: {{DLV - method}}

트리거: CE - login
```

#### 코드 구현

**파일:** `src/views/Splash.js`

**Google 로그인 (184번 라인):**
```javascript
document.getElementById('google-login-btn').addEventListener('click', async () => {
    // DataLayer 푸시
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        'event': 'login',
        'method': 'google'
    });

    try {
        await authService.signInWithGoogle()
    } catch (error) {
        alert('Login failed: ' + error.message)
    }
});
```

**Kakao 로그인 (192번 라인):**
```javascript
document.getElementById('kakao-login-btn').addEventListener('click', async () => {
    // DataLayer 푸시
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        'event': 'login',
        'method': 'kakao'
    });

    try {
        await authService.signInWithKakao()
    } catch (error) {
        alert('Kakao login failed: ' + error.message)
    }
});
```

**게스트 로그인 (200번 라인):**
```javascript
document.getElementById('guest-btn').addEventListener('click', () => {
    // DataLayer 푸시
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        'event': 'login',
        'method': 'guest'
    });

    // Initialize Guest State
    store.setState({
        user: { id: 'guest', nickname: 'Guest', isGuest: true },
        coins: 999,
        level: 0,
        totalXp: 0
    })
    import('../core/router.js').then(r => r.navigateTo('/onboarding'));
});
```

---

### 2. `sign_up` - 회원가입 이벤트

#### GTM 설정

**1단계: DataLayer 변수 생성**

| 변수 이름 | 변수 유형 | Data Layer 변수 이름 |
|----------|----------|---------------------|
| DLV - referral_code | 데이터 영역 변수 | referral_code |

**2단계: 트리거 생성**

```
트리거 이름: CE - sign_up
트리거 유형: 맞춤 이벤트
이벤트 이름: sign_up
```

**3단계: 태그 생성**

```
태그 이름: GA4 - Sign Up
태그 유형: Google 애널리틱스: GA4 이벤트
구성 태그: GA4 Configuration

이벤트 이름: sign_up

이벤트 매개변수:
  - 매개변수 이름: method
  - 값: {{DLV - method}}

  - 매개변수 이름: referral_code
  - 값: {{DLV - referral_code}}

트리거: CE - sign_up
```

#### 코드 구현

**파일:** `src/services/authService.js`

로그인 성공 후 신규 사용자 여부를 판별하여 `sign_up` 이벤트 발생.

**구현 위치:** `signInWithGoogle()`, `signInWithKakao()` 메서드 내부

```javascript
// 예시: Google 로그인 성공 후
const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

const isNewUser = !existingUser;

if (isNewUser) {
    // 신규 회원가입 이벤트
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        'event': 'sign_up',
        'method': 'google', // or 'kakao'
        'referral_code': referralCode || null
    });
}
```

---

### 3. `game_start` - 게임 시작 이벤트

#### GTM 설정

**1단계: DataLayer 변수 생성**

| 변수 이름 | 변수 유형 | Data Layer 변수 이름 |
|----------|----------|---------------------|
| DLV - mode | 데이터 영역 변수 | mode |
| DLV - user_type | 데이터 영역 변수 | user_type |
| DLV - level | 데이터 영역 변수 | level |
| DLV - coins | 데이터 영역 변수 | coins |

**2단계: 트리거 생성**

```
트리거 이름: CE - game_start
트리거 유형: 맞춤 이벤트
이벤트 이름: game_start
```

**3단계: 태그 생성**

```
태그 이름: GA4 - Game Start
태그 유형: Google 애널리틱스: GA4 이벤트
구성 태그: GA4 Configuration

이벤트 이름: game_start

이벤트 매개변수:
  - mode: {{DLV - mode}}
  - user_type: {{DLV - user_type}}
  - level: {{DLV - level}}
  - coins: {{DLV - coins}}

트리거: CE - game_start
```

#### 코드 구현

**파일:** `src/views/Main.js` (699번 라인)

```javascript
playBtn.addEventListener('click', async () => {
    const _state = store.getState()
    const user = _state.user

    // DataLayer 푸시
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        'event': 'game_start',
        'mode': _state.isHardMode ? 'hard' : 'normal',
        'user_type': user?.isGuest ? 'guest' : 'member',
        'level': _state.level,
        'coins': _state.coins
    });

    if (user?.isGuest) {
        const sessionData = localStorage.getItem('guest_session_used')
        const sessionUsed = sessionData ? JSON.parse(sessionData).used : false

        if (sessionUsed) {
            await authService.signInWithGoogle()
            return
        }

        localStorage.setItem('guest_session_used', JSON.stringify({
            used: true,
            timestamp: Date.now()
        }))
        import('../core/router.js').then(r => r.navigateTo('/game'))
    } else {
        if (_state.coins > 0) {
            const targetPath = _state.isHardMode ? '/game/hard' : '/game'
            import('../core/router.js').then(r => r.navigateTo(targetPath))
        }
    }
});
```

---

### 4. `game_over` - 게임 종료 이벤트

#### GTM 설정

**1단계: DataLayer 변수 생성**

| 변수 이름 | 변수 유형 | Data Layer 변수 이름 |
|----------|----------|---------------------|
| DLV - round | 데이터 영역 변수 | round |
| DLV - xp | 데이터 영역 변수 | xp |

**2단계: 트리거 생성**

```
트리거 이름: CE - game_over
트리거 유형: 맞춤 이벤트
이벤트 이름: game_over
```

**3단계: 태그 생성**

```
태그 이름: GA4 - Game Over
태그 유형: Google 애널리틱스: GA4 이벤트
구성 태그: GA4 Configuration

이벤트 이름: game_over

이벤트 매개변수:
  - round: {{DLV - round}}
  - xp: {{DLV - xp}}
  - mode: {{DLV - mode}}
  - level: {{DLV - level}}

트리거: CE - game_over
```

#### 코드 구현

**파일:** `src/views/Game.js` (34번 라인)

```javascript
const engine = new GameEngine(gameContainer, (result) => {
    // Game Over Callback
    console.log('Game Over Result:', result)

    // DataLayer 푸시
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        'event': 'game_over',
        'round': result.round,
        'xp': result.xp,
        'mode': 'normal',
        'level': store.getState().level
    });

    result.initialRank = initialRank
    navigateTo('/result', result)
})
```

**파일:** `src/views/GameHard.js` (동일한 위치에 적용, mode는 'hard'로 설정)

```javascript
const engine = new GameEngine(gameContainer, (result) => {
    // Game Over Callback
    console.log('Game Over Result:', result)

    // DataLayer 푸시
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        'event': 'game_over',
        'round': result.round,
        'xp': result.xp,
        'mode': 'hard',
        'level': store.getState().level
    });

    result.initialRank = initialRank
    navigateTo('/result', result)
})
```

---

### 5. `share` - 공유 이벤트

#### GTM 설정

**1단계: DataLayer 변수 생성**

| 변수 이름 | 변수 유형 | Data Layer 변수 이름 |
|----------|----------|---------------------|
| DLV - content_type | 데이터 영역 변수 | content_type |

**2단계: 트리거 생성**

```
트리거 이름: CE - share
트리거 유형: 맞춤 이벤트
이벤트 이름: share
```

**3단계: 태그 생성**

```
태그 이름: GA4 - Share
태그 유형: Google 애널리틱스: GA4 이벤트
구성 태그: GA4 Configuration

이벤트 이름: share

이벤트 매개변수:
  - method: {{DLV - method}}
  - content_type: {{DLV - content_type}}
  - round: {{DLV - round}}
  - user_type: {{DLV - user_type}}

트리거: CE - share
```

#### 코드 구현

**파일:** `src/views/Main.js` (856번 라인)

```javascript
shareBtn.addEventListener('click', async () => {
    const _state = store.getState()
    const user = _state.user

    const shareMethod = (navigator.share && navigator.canShare) ? 'native_share' : 'clipboard';

    // DataLayer 푸시
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        'event': 'share',
        'method': shareMethod,
        'content_type': 'referral',
        'user_type': user?.isGuest ? 'guest' : 'member'
    });

    if (user?.isGuest) {
        const shareUrl = window.location.origin
        const shareText = '집중력 게임 Focus에 도전해보세요!'
        copyToClipboard(shareText, shareUrl, true)
        return
    }

    // ... 나머지 코드
})
```

**파일:** `src/views/Result.js` (124번 라인)

```javascript
shareBtn.addEventListener('click', async () => {
    const user = store.getState().user
    const shareMethod = (navigator.share && navigator.canShare) ? 'native_share' : 'clipboard';

    // DataLayer 푸시
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        'event': 'share',
        'method': shareMethod,
        'content_type': 'game_result',
        'round': round,
        'user_type': user?.isGuest ? 'guest' : 'member'
    });

    // ... 나머지 코드
})
```

---

## 테스트 및 디버깅

### 1. GTM 미리보기 모드

1. GTM 대시보드에서 **"미리보기"** 버튼 클릭
2. 웹사이트 URL 입력
3. Tag Assistant 창에서 이벤트 발생 확인

### 2. 브라우저 개발자 도구

**Console에서 DataLayer 확인:**
```javascript
console.log(window.dataLayer)
```

**Network 탭에서 GA4 요청 확인:**
- `collect?` 요청 필터
- 페이로드에서 이벤트 파라미터 확인

### 3. GA4 DebugView

1. Chrome 확장 프로그램 "Google Analytics Debugger" 설치
2. 확장 프로그램 활성화
3. GA4 대시보드 → **구성** → **DebugView** 접속
4. 실시간으로 이벤트 발생 확인

---

## 체크리스트

### Priority 1 이벤트 구현 (핵심)
- [ ] `login` - DataLayer 푸시 코드 추가
- [ ] `login` - GTM 트리거 및 태그 생성
- [ ] `login` - 테스트 완료
- [ ] `sign_up` - DataLayer 푸시 코드 추가
- [ ] `sign_up` - GTM 트리거 및 태그 생성
- [ ] `sign_up` - 테스트 완료
- [ ] `game_start` - DataLayer 푸시 코드 추가
- [ ] `game_start` - GTM 트리거 및 태그 생성
- [ ] `game_start` - 테스트 완료
- [ ] `game_over` - DataLayer 푸시 코드 추가
- [ ] `game_over` - GTM 트리거 및 태그 생성
- [ ] `game_over` - 테스트 완료
- [ ] `share` - DataLayer 푸시 코드 추가
- [ ] `share` - GTM 트리거 및 태그 생성
- [ ] `share` - 테스트 완료

### Priority 2 이벤트 (Phase 2)
- [ ] `toggle_hard_mode` - 구현
- [ ] `retry_game` - 구현
- [ ] `view_all_levels` - 구현

### Priority 3 이벤트 (선택적)
- [ ] `click_coin_info` - 구현
- [ ] `screen_view` - 구현

### 배포 전 확인
- [ ] GTM 미리보기 모드로 모든 이벤트 확인
- [ ] GA4 DebugView에서 실시간 데이터 확인
- [ ] 프로덕션 환경에 GTM 버전 게시

---

## 변경 이력

### v1.1.0 (2025-12-16)
- 제외 이벤트 반영 (`level_up`, `view_ranking`, `view_weekly_activity`)
- Priority 1 이벤트만 상세 가이드 포함
- 총 구현 이벤트: 10개 (Priority 1: 5개, Priority 2: 3개, Priority 3: 2개)

### v1.0.0 (2025-12-16)
- 초기 GTM 구현 가이드 작성
- Priority 1 이벤트 5개 상세 구현 방법

---

## 다음 단계

Priority 1 이벤트 구현 완료 후:
1. Priority 2 이벤트 구현 (`toggle_hard_mode`, `retry_game`, `view_all_levels`)
2. Priority 3 이벤트 구현 (선택적)
3. GA4 커스텀 대시보드 구성
4. 주간/월간 분석 리포트 설정

---

## 문의 및 지원

- **이벤트 스펙 문서:** `/docs/analytics-events.md`
- **GTM Container:** https://tagmanager.google.com
- **GA4 Dashboard:** https://analytics.google.com
