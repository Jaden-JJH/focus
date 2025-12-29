# 🎵 Geometry Dash 스타일 효과음 가이드

## 개요

Focus 게임에 **Geometry Dash 스타일**의 리듬감 있는 콤보 이펙트가 추가되었습니다. 타격감을 극대화하기 위해 다음 효과음을 추가하시면 완벽한 경험을 제공할 수 있습니다.

---

## 🎮 필요한 효과음 목록

### 1. **기본 타격음** (combo_hit.mp3)
- **용도**: 정답 클릭 시 기본 효과음
- **특징**:
  - 짧고 경쾌한 "탁" 소리
  - 주파수: 2-4kHz (높은 음)
  - 길이: 50-100ms
- **참고 사운드**: OSU! 히트 사운드, Guitar Hero 노트 사운드
- **추천 소스**:
  - Freesound.org에서 "click", "tap", "tick" 검색
  - ZapSplat.com에서 "UI tap" 검색

### 2. **콤보 강화음** (combo_power.mp3)
- **용도**: 6-10 콤보 달성 시 추가 레이어
- **특징**:
  - 중간 "펑" 소리
  - 주파수: 500Hz-1kHz (중간 음)
  - 길이: 100-200ms
  - 약간의 reverb 효과
- **참고 사운드**: Geometry Dash 오브 파괴 사운드
- **추천 소스**:
  - "explosion small", "pop", "burst"

### 3. **콤보 하이** (combo_high.mp3)
- **용도**: 11-15 콤보 달성 시 추가 레이어
- **특징**:
  - 강렬한 "킥" + "우웅" 소리
  - 주파수: 60-200Hz (낮은 음, 베이스)
  - 길이: 200-300ms
  - 서브베이스 강조
- **참고 사운드**: EDM 킥 드럼, 808 베이스
- **추천 소스**:
  - "bass drop", "impact heavy", "thud"

### 4. **콤보 최고** (combo_max.mp3)
- **용도**: 16+ 콤보 달성 시 최고 레이어
- **특징**:
  - 풀 스펙트럼 사운드 (전체 주파수)
  - 주파수: 60Hz-8kHz
  - 길이: 300-400ms
  - 코러스 + 리버브 효과
- **참고 사운드**: Tetris 라인 제거, Candy Crush 특수 콤보
- **추천 소스**:
  - "power up max", "victory", "achievement"

### 5. **10콤보 마일스톤** (combo_milestone.mp3)
- **용도**: 10콤보 돌파 시 특별 효과음
- **특징**:
  - "짠!" 팡파르 느낌
  - 주파수: 전체 스펙트럼
  - 길이: 500-800ms
  - 상승하는 음계 (C-E-G)
- **참고 사운드**: 레벨업 사운드, 업적 해금 사운드
- **추천 소스**:
  - "fanfare short", "level up", "unlock"

---

## 🎨 콤보별 효과 매핑

### 콤보 단계

| 콤보 수 | 화면 진동 | 충격파 색상 | 배경 플래시 | 파티클 수 | 효과음 |
|---------|----------|------------|-------------|----------|--------|
| 1-5     | 3px, 80ms | 시안 | 초록 | 15-25 | 기본 타격음 |
| 6-10    | 5px, 100ms | 보라 | 파랑 | 25-35 | 타격 + 강화음 |
| 11-15   | 8px, 120ms | 마젠타 | 보라 | 35-40 | 타격 + 강화 + 하이 |
| 16+     | 12px, 150ms | 옐로우 | 금색 | 40 | 모든 레이어 |
| 10 (첫 진입) | - | - | - | - | 마일스톤 사운드 |

---

## 🔧 효과음 적용 방법

### 1. 파일 배치
```
/public/audio/
├── combo_hit.mp3
├── combo_power.mp3
├── combo_high.mp3
├── combo_max.mp3
└── combo_milestone.mp3
```

### 2. audioManager.js 수정

현재 위치: `/src/utils/audioManager.js`

```javascript
// 콤보 효과음 추가
class AudioManager {
  constructor() {
    // ... 기존 코드 ...

    this.comboSounds = {
      hit: new Audio('/audio/combo_hit.mp3'),
      power: new Audio('/audio/combo_power.mp3'),
      high: new Audio('/audio/combo_high.mp3'),
      max: new Audio('/audio/combo_max.mp3'),
      milestone: new Audio('/audio/combo_milestone.mp3')
    }

    // 볼륨 설정
    Object.values(this.comboSounds).forEach(audio => {
      audio.volume = 0.7
    })
  }

  playComboHit(comboLevel) {
    if (!this.enabled) return

    // 기본 타격음 (항상 재생)
    this.comboSounds.hit.currentTime = 0
    this.comboSounds.hit.play()

    // 콤보별 추가 레이어
    if (comboLevel >= 16) {
      // 16+ 콤보: 모든 레이어
      this.comboSounds.power.currentTime = 0
      this.comboSounds.power.play()
      this.comboSounds.high.currentTime = 0
      this.comboSounds.high.play()
      this.comboSounds.max.currentTime = 0
      this.comboSounds.max.play()
    } else if (comboLevel >= 11) {
      // 11-15 콤보: 타격 + 강화 + 하이
      this.comboSounds.power.currentTime = 0
      this.comboSounds.power.play()
      this.comboSounds.high.currentTime = 0
      this.comboSounds.high.play()
    } else if (comboLevel >= 6) {
      // 6-10 콤보: 타격 + 강화
      this.comboSounds.power.currentTime = 0
      this.comboSounds.power.play()
    }
  }

  playComboMilestone() {
    if (!this.enabled) return
    this.comboSounds.milestone.currentTime = 0
    this.comboSounds.milestone.play()
  }
}
```

### 3. GameEngine.js 적용

`handleCorrect()` 함수 내에서:

```javascript
handleCorrect() {
  // ... 기존 코드 ...

  // 🔊 콤보별 효과음 재생
  audioManager.playComboHit(this.state.combo)

  // 10콤보 첫 진입 시 마일스톤 사운드
  if (this.state.combo === 10) {
    audioManager.playComboMilestone()
  }

  // ... 나머지 코드 ...
}
```

---

## 📁 추천 무료 효과음 사이트

### 1. **Freesound.org** (가장 추천!)
- 무료, 크리에이티브 커먼즈 라이선스
- 고품질 사운드 다수
- 검색어: "game hit", "ui tap", "impact"

### 2. **ZapSplat.com**
- 무료 (회원가입 필요)
- 게임 UI 사운드 섹션 풍부
- 검색어: "game button", "power up"

### 3. **Mixkit.co**
- 완전 무료, 상업적 사용 가능
- 간단하고 깔끔한 사운드
- 검색어: "click", "notification"

### 4. **OpenGameArt.org**
- 게임 전용 사운드
- 커뮤니티 제작 리소스
- 다양한 8bit/16bit 사운드

---

## 🎧 사운드 제작 가이드 (직접 제작 시)

### 도구
- **Audacity** (무료): 기본 편집
- **LMMS** (무료): 리듬 사운드 제작
- **Vital** (무료): 신스 사운드
- **FL Studio Mobile** (유료): 프로페셔널 제작

### 제작 팁

#### 1. 타격음 (Hit)
```
- 신스 웨이브: Sine wave (2-4kHz)
- ADSR: Attack 1ms, Decay 30ms, Sustain 0, Release 20ms
- 노이즈 레이어 추가 (짧게, 5ms)
- EQ: High-pass filter 1kHz
```

#### 2. 강화음 (Power)
```
- 베이스 레이어: Sawtooth wave (200-500Hz)
- ADSR: Attack 5ms, Decay 100ms, Sustain 0.2, Release 50ms
- 약간의 distortion (5-10%)
- Reverb: Room size 20%, Wet 30%
```

#### 3. 하이 (High)
```
- 서브베이스: Sine wave (60-120Hz)
- 킥 드럼 샘플 레이어
- ADSR: Attack 0ms, Decay 200ms, Sustain 0, Release 100ms
- Compression (ratio 4:1)
```

#### 4. 최고 (Max)
```
- 멀티 레이어:
  - Sub bass (60-80Hz)
  - Mid bass (200-400Hz)
  - Lead (1-2kHz)
  - High sparkle (4-8kHz)
- 코러스 효과 (rate 2Hz, depth 30%)
- 리버브 (Room size 50%, Wet 40%)
```

---

## ⚠️ 주의사항

1. **파일 크기**: 각 효과음 100KB 이하 권장 (로딩 속도)
2. **포맷**: MP3 (128kbps) 또는 OGG (브라우저 호환성)
3. **정규화**: 모든 사운드를 -3dB로 정규화 (클리핑 방지)
4. **피크 제거**: Limiter 적용 (Threshold -1dB)
5. **테스트**: 모바일 스피커에서도 잘 들리는지 확인

---

## 🚀 빠른 시작 (임시 효과음)

효과음 파일이 없다면, Web Audio API로 임시 사운드 생성:

```javascript
// audioManager.js에 추가
generateComboSound(frequency, duration) {
  if (!this.audioContext) {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }

  const oscillator = this.audioContext.createOscillator()
  const gainNode = this.audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(this.audioContext.destination)

  oscillator.frequency.value = frequency
  oscillator.type = 'sine'

  gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

  oscillator.start(this.audioContext.currentTime)
  oscillator.stop(this.audioContext.currentTime + duration)
}

// 사용 예시
playComboHit(comboLevel) {
  const baseFreq = 800
  const freq = baseFreq + (comboLevel * 50) // 콤보 증가 시 음높이 상승
  this.generateComboSound(freq, 0.1)

  if (comboLevel >= 6) {
    this.generateComboSound(300, 0.15) // 중간 음 추가
  }
  if (comboLevel >= 11) {
    this.generateComboSound(100, 0.2) // 베이스 추가
  }
}
```

---

## 📝 효과음 라이선스

사용하는 효과음의 라이선스를 반드시 확인하세요:

- **CC0** (퍼블릭 도메인): 자유롭게 사용 가능
- **CC BY** (저작자 표시): 크레딧 명시 필요
- **CC BY-SA** (동일 조건 변경 허락): 수정 시 같은 라이선스 적용
- **상업적 사용 가능** 여부 확인

---

## 🎉 완성!

효과음까지 추가하면 **완벽한 Geometry Dash 스타일** 콤보 시스템이 완성됩니다!

**주요 기능**:
- ✅ 화면 진동 (콤보별 강도)
- ✅ 충격파 이펙트 (네온 색상)
- ✅ 배경 플래시 (콤보별 색상)
- ✅ 파티클 폭발 (속도 + 밀도)
- ✅ 네온 테두리 펄스 (10+ 콤보)
- 🔊 효과음 (직접 추가)

**타격감 극대화!** 🎮⚡
