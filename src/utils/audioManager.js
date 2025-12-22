// Audio Manager for game sound effects
class AudioManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.activeSounds = []; // Track active sounds for cleanup
        this.defaultVolume = 0.5; // Default volume for new sounds

        // Sound file paths (lazy loaded)
        this.soundFiles = {
            // 기존 효과음 (호환성 유지)
            correct: '/sounds/1-15_correct.mp3',
            wrong: '/sounds/1-13_ incorrect.mp3',
            click: '/sounds/1-7_ingame_buttonclick.mp3',

            // 1. 화면 전환 및 UI
            mainEnter: '/sounds/1-1_main-refresh.mp3',
            toggleChange: '/sounds/1-2_toggle.mp3',
            popupOpen: '/sounds/1-3_popup_open.mp3',
            popupClose: '/sounds/1-4_popup_close.mp3',
            splash: '/sounds/2-a_splash.mp3',

            // 2. 게임 진행
            hardModeIntro: '/sounds/1-5_hardmode.wav',
            phaseEnter: '/sounds/1-6_phasethrough.mp3',

            // 3. 인게임 상호작용
            inGameClick: '/sounds/1-7_ingame_buttonclick.mp3',
            colorGuide: '/sounds/1-8_colorsequenceguide.mp3',
            incorrect: '/sounds/1-13_ incorrect.mp3',
            correctSound: '/sounds/1-15_correct.mp3',

            // 4. 일반 UI 버튼
            buttonClick: '/sounds/1-14_menu_button click.mp3',

            // 5. 게임 결과 및 보상
            gameOverFail: '/sounds/1-9_gameover(fail).mp3',
            gameOverSuccess: '/sounds/1-10_gameover(success).wav',
            levelUp: '/sounds/1-11_levelup.wav',
            hardModeUnlock: '/sounds/1-12_hardmodeopen.mp3',
        };
    }

    // Lazy load: Create Audio object only when first needed
    _getOrCreateSound(soundName) {
        if (!this.sounds[soundName]) {
            const path = this.soundFiles[soundName];
            if (!path) return null;

            const audio = new Audio(path);
            audio.preload = 'none';
            audio.volume = this.defaultVolume;
            this.sounds[soundName] = audio;
        }
        return this.sounds[soundName];
    }

    // Initialize audio (compatibility method - no longer needed with lazy loading)
    init() {
        // Audio objects are now created on-demand, so init is no-op
        return;
    }

    // Play a sound effect with optional duration limit
    play(soundName, options = {}) {
        if (!this.enabled) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            try {
                // Lazy load: Create audio only when needed
                const sound = this._getOrCreateSound(soundName);
                if (!sound) {
                    resolve();
                    return;
                }

                // Clone the audio to allow overlapping sounds
                const clone = sound.cloneNode();
                clone.volume = sound.volume;

                // Track active sound for cleanup
                this.activeSounds.push(clone);

                // Handle duration limit (재생 시간 제한)
                let timeoutId = null;
                if (options.maxDuration) {
                    timeoutId = setTimeout(() => {
                        clone.pause();
                        clone.currentTime = 0;
                        this._removeActiveSound(clone);
                        resolve();
                    }, options.maxDuration * 1000);
                }

                // Cleanup when sound ends naturally
                clone.addEventListener('ended', () => {
                    if (timeoutId) clearTimeout(timeoutId);
                    this._removeActiveSound(clone);
                    resolve();
                });

                clone.play().catch(err => {
                    // Silently fail if autoplay is blocked
                    console.warn('Audio play failed:', err);
                    if (timeoutId) clearTimeout(timeoutId);
                    this._removeActiveSound(clone);
                    resolve();
                });
            } catch (error) {
                console.warn('Error playing sound:', error);
                resolve();
            }
        });
    }

    // Remove sound from active sounds array
    _removeActiveSound(sound) {
        const index = this.activeSounds.indexOf(sound);
        if (index > -1) {
            this.activeSounds.splice(index, 1);
        }
    }

    // Play sounds in sequence (순차 재생)
    async playSequence(soundNames) {
        for (const item of soundNames) {
            if (typeof item === 'string') {
                await this.play(item);
            } else if (typeof item === 'object') {
                await this.play(item.name, item.options);
            }
        }
    }

    // Stop all active sounds
    stopAll() {
        this.activeSounds.forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
        this.activeSounds = [];
    }

    // ===== 기존 호환성 메서드 =====
    playCorrect() {
        return this.play('correct');
    }

    playWrong() {
        return this.play('wrong');
    }

    playClick() {
        return this.play('click');
    }

    // ===== 화면 전환 및 UI =====
    playMainEnter() {
        return this.play('mainEnter');
    }

    playToggleChange() {
        return this.play('toggleChange', { maxDuration: 0.5 }); // 0.5초만 재생
    }

    playPopupOpen() {
        return this.play('popupOpen');
    }

    playPopupClose() {
        return this.play('popupClose');
    }

    playSplash() {
        return this.play('splash');
    }

    // ===== 게임 진행 =====
    playHardModeIntro() {
        return this.play('hardModeIntro', { maxDuration: 3 }); // 3초만 재생
    }

    playPhaseEnter() {
        return this.play('phaseEnter', { maxDuration: 2 }); // 2초만 재생
    }

    // ===== 인게임 상호작용 =====
    playInGameClick() {
        return this.play('inGameClick');
    }

    playColorGuide() {
        return this.play('colorGuide');
    }

    playIncorrect() {
        return this.play('incorrect');
    }

    playCorrectSound() {
        return this.play('correctSound');
    }

    // ===== 일반 UI 버튼 =====
    playButtonClick() {
        return this.play('buttonClick');
    }

    // ===== 게임 결과 및 보상 =====
    playGameOverFail() {
        return this.play('gameOverFail');
    }

    playGameOverSuccess() {
        return this.play('gameOverSuccess');
    }

    playLevelUp() {
        return this.play('levelUp');
    }

    playHardModeUnlock() {
        return this.play('hardModeUnlock');
    }

    // ===== 게임 종료 시 순차 재생 (GameOver → LevelUp) =====
    async playGameEndSequence(isSuccess, didLevelUp) {
        // 1. GameOver 사운드 재생
        if (isSuccess) {
            await this.playGameOverSuccess();
        } else {
            await this.playGameOverFail();
        }

        // 2. 레벨업 했다면 레벨업 사운드 재생
        if (didLevelUp) {
            await this.playLevelUp();
        }
    }

    // Enable/disable sounds
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    // Check if sounds are enabled
    isEnabled() {
        return this.enabled;
    }

    // Set volume for all sounds (0.0 - 1.0)
    setVolume(volume) {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        // Set volume for already created sounds
        Object.values(this.sounds).forEach(sound => {
            sound.volume = clampedVolume;
        });
        // Store default volume for future sounds
        this.defaultVolume = clampedVolume;
    }
}

// Create singleton instance
const audioManager = new AudioManager();

export default audioManager;
