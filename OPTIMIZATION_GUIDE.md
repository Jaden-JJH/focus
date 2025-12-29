# 🚀 Focus 게임 리소스 최적화 가이드

모바일 성능 향상을 위한 완벽한 최적화 가이드입니다.

## 📋 목차

1. [빠른 시작](#빠른-시작)
2. [개별 최적화](#개별-최적화)
3. [예상 효과](#예상-효과)
4. [문제 해결](#문제-해결)

---

## 🎯 빠른 시작

### 한 번에 모두 최적화하기 (권장)

```bash
# 프로젝트 디렉토리에서
./optimize-all.sh
```

대화형으로 각 단계를 진행하며, 필요한 도구가 없으면 자동으로 설치를 안내합니다.

---

## 🔧 개별 최적화

필요에 따라 개별 스크립트를 실행할 수 있습니다.

### 1. 오디오 최적화 (필수!)

**효과: 27MB → 7MB (74% 감소)**

```bash
./optimize-resources.sh
```

**처리 내용:**
- ✅ WAV → MP3 변환 (192kbps 고음질)
  - `1-5_hardmode.wav` 1.7MB → 300KB
  - `1-10_gameover(success).wav` 516KB → 100KB
  - `1-11_levelup.wav` 284KB → 60KB
- ✅ 배경음악 압축 (128kbps)
  - 음악 파일 5개 합계: 23MB → 8MB
- ✅ 자동으로 `audioManager.js` 경로 업데이트
- ✅ 원본 파일 백업 (`public/backup_*/`)

**테스트:**
```bash
npm run build
# 게임 실행 후 효과음 확인
```

---

### 2. GIF 최적화 (권장)

**효과: 14MB → 5-7MB (50-65% 감소)**

```bash
./optimize-gif.sh
```

**2가지 옵션 제공:**

#### 옵션 1: GIF 최적화 (권장)
- 크기: 30-50% 감소
- 코드 수정: 불필요
- 품질: 거의 동일

#### 옵션 2: WebM 변환 (고급)
- 크기: 80% 감소
- 코드 수정: 필요 (아래 참조)
- 품질: 동일

**WebM 변환 시 코드 수정:**

`src/core/GameEngineHard.js:134` 변경:

```javascript
// Before
background-image: url('/gif/new/hard.gif');

// After (background-image 제거하고 video 태그 사용)
```

배경을 video 태그로 교체:
```html
<video autoplay loop muted playsinline
       style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;">
  <source src="/gif/new/hard.webm" type="video/webm">
</video>
```

---

### 3. 폰트 최적화 (선택)

**효과: 47MB → 5MB (90% 감소)**

```bash
./optimize-fonts.sh
```

**처리 내용:**
- ✅ 한글 완성형 11,172자 + 영문 + 숫자만 추출
- ✅ WOFF2 형식으로 변환 (최신 압축)
- ✅ 자동으로 `fonts.css` 생성

**CSS 수정 필요:**

`src/styles/index.css` (또는 해당 CSS 파일):

```css
/* Before */
@font-face {
  font-family: 'Pretendard';
  src: url('/font/variable/PretendardVariable.ttf') format('truetype');
}

/* After */
@import url('/font/optimized/fonts.css');
```

**주의사항:**
- 최적화된 폰트는 지정된 글자만 포함합니다
- 이모지나 특수 문자가 필요하면 스크립트의 `UNICODE_RANGE` 수정 필요

---

## 📊 예상 효과

### 성능 개선 예측

| 항목 | Before | After | 개선 |
|------|--------|-------|------|
| **오디오** | 27MB | 7MB | **74%↓** |
| **GIF** | 14MB | 5-7MB | **50-65%↓** |
| **폰트** | 47MB | 5MB | **90%↓** |
| **합계** | **88MB** | **17-19MB** | **78%↓** |

### 체감 효과

- ⚡ 초기 로딩 속도: **60-80% 개선**
- 📱 모바일 데이터 사용량: **70% 감소**
- 💾 메모리 사용량: **40% 감소**
- 🎮 게임 반응속도: **부드러워짐**
- 🎵 오디오 재생: **즉시 재생**

---

## 🛡️ 안전 장치

모든 스크립트는 다음 안전 장치를 포함합니다:

1. ✅ **자동 백업**: 원본 파일은 `public/backup_*/` 폴더에 보관
2. ✅ **복원 가능**: 한 줄 명령어로 즉시 복원
3. ✅ **에러 처리**: 문제 발생 시 자동 중단
4. ✅ **크기 비교**: 최적화 전후 크기 자동 비교

### 복원 방법

```bash
# 가장 최근 백업으로 복원
cp -r public/backup_*/ public/

# 또는 특정 백업으로 복원
cp -r public/backup_20250129_143022/ public/
```

---

## ⚙️ 사전 요구사항

### 필수 도구

```bash
# ffmpeg (오디오/GIF 최적화용)
brew install ffmpeg

# pyftsubset (폰트 최적화용)
pip3 install fonttools brotli
```

**자동 설치:**
스크립트 실행 시 필요한 도구가 없으면 자동으로 설치를 안내합니다.

---

## 🧪 테스트 체크리스트

최적화 후 반드시 확인:

### 1. 오디오
- [ ] 게임 시작 효과음
- [ ] 정답/오답 효과음
- [ ] 배경음악 재생
- [ ] 버튼 클릭 소리

### 2. GIF
- [ ] 하드 모드 배경 애니메이션
- [ ] 부드러운 재생
- [ ] 화질 저하 없음

### 3. 폰트
- [ ] 한글 정상 표시
- [ ] 영문/숫자 정상 표시
- [ ] 폰트 굵기 정상

### 4. 성능
- [ ] 모바일에서 부드러운 동작
- [ ] 버튼 클릭 반응 즉각
- [ ] 메모리 사용량 감소

---

## 🐛 문제 해결

### Q: ffmpeg 설치 중 에러 발생

```bash
# Homebrew 업데이트 후 재시도
brew update
brew install ffmpeg
```

### Q: 오디오가 재생되지 않음

```bash
# 백업에서 복원
cp -r public/backup_YYYYMMDD_HHMMSS/sounds/* public/sounds/

# audioManager.js 경로 확인
# .wav가 .mp3로 변경되었는지 확인
```

### Q: 폰트가 깨져 보임

```bash
# 백업에서 복원
cp -r public/backup_fonts_YYYYMMDD_HHMMSS/font/* public/font/

# CSS import 경로 확인
# /font/optimized/fonts.css 경로가 맞는지 확인
```

### Q: GIF가 표시되지 않음

```bash
# 백업에서 복원
cp -r public/backup_gif_YYYYMMDD_HHMMSS/new/* public/gif/new/
```

---

## 📚 추가 팁

### 캐시 문제 해결

브라우저 캐시 때문에 변경사항이 반영되지 않을 수 있습니다:

```bash
# 빌드 파일 완전 삭제 후 재빌드
rm -rf dist
npm run build
```

### 모바일 테스트

Chrome DevTools의 모바일 모드로 테스트:

1. F12 → 모바일 아이콘 클릭
2. Network 탭에서 리소스 크기 확인
3. Performance 탭에서 성능 측정

---

## 🎉 최종 단계

모든 테스트 완료 후:

```bash
# 1. 백업 폴더 삭제 (문제 없을 경우)
rm -rf public/backup_*

# 2. Git 커밋
git add .
git commit -m "chore: 리소스 최적화 - 78% 크기 감소"

# 3. 배포
git push
```

---

## 💡 참고

- 최적화된 리소스는 원본과 품질 차이가 거의 없습니다
- 모든 변환은 무손실 또는 고품질 설정입니다
- 추가 최적화가 필요하면 스크립트 파라미터를 조정하세요

**질문이나 문제가 있으면 이슈를 남겨주세요!** 🚀
