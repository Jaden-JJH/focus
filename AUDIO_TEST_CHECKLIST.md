# 🎵 Audio Manager 테스트 체크리스트

## 변경 사항
- Web Audio API → HTML5 Audio API
- Lazy Loading 유지 (성능 개선 효과 유지)
- iOS 호환성 확보

## 📱 iOS Chrome 테스트 (iPhone 16)

### 1. 메인 화면
- [ ] 로그인 후 메인 화면 BGM 재생
- [ ] 버튼 클릭 효과음 (buttonClick)
- [ ] 토글 변경 효과음 (toggleChange)
- [ ] 팝업 열기/닫기 효과음 (popupOpen, popupClose)

### 2. 게임 시작
- [ ] 게임 시작 버튼 클릭 효과음
- [ ] Phase 1 진입 효과음 (phaseEnter)
- [ ] 배경음악 시작 (노말/하드 모드)

### 3. 게임 중
- [ ] 인게임 클릭 효과음 (inGameClick)
- [ ] 정답 효과음 (correct, correctSound)
- [ ] 오답 효과음 (incorrect)
- [ ] Phase 전환 효과음 (phaseEnter)
- [ ] 컬러 가이드 효과음 (colorGuide)

### 4. 게임 종료
- [ ] 게임오버 성공 효과음 (gameOverSuccess)
- [ ] 게임오버 실패 효과음 (gameOverFail)
- [ ] 레벨업 효과음 (levelUp)
- [ ] 배경음악 페이드아웃

### 5. 메인 복귀
- [ ] 메인 화면으로 복귀 후 BGM 재생
- [ ] 버튼 클릭 효과음 정상 작동

## 💻 Desktop Chrome 테스트

### 1. 기본 기능
- [ ] 메인 화면 BGM
- [ ] 모든 효과음 정상 재생
- [ ] 게임 중 효과음 정상 재생

### 2. 성능 확인
- [ ] 사운드 로딩 시간 (콘솔 확인)
- [ ] Lazy Loading 작동 확인 (첫 재생 시 로드 메시지)
- [ ] 메모리 누수 없음

## 🔍 콘솔 로그 확인

정상 작동 시 예상 로그:
```
🎵 Initializing audioManager (HTML5 Audio + Lazy Loading)...
🎵 Preloading 9 sounds...
✓ Loaded: inGameClick
✓ Loaded: buttonClick
✓ Loaded: popupOpen
✓ Loaded: popupClose
✓ Loaded: correctSound
✓ Loaded: incorrect
✓ Loaded: correct
✓ Loaded: wrong
✓ Loaded: click
🎵 audioManager initialized ✓
```

## 🚨 문제 발생 시 롤백

```bash
# 1. 백업 버전으로 복원
cp src/utils/audioManager_webaudio_backup.js src/utils/audioManager.js

# 2. 커밋
git add src/utils/audioManager.js
git commit -m "Revert: HTML5 Audio 롤백 - Web Audio API로 복원"
git push
```

## ✅ 테스트 완료 후

모든 체크리스트 통과 시:
- [ ] iOS Chrome 모든 항목 통과
- [ ] Desktop Chrome 모든 항목 통과
- [ ] 성능 문제 없음
- [ ] 콘솔 에러 없음

→ **배포 승인**
