// 🎮 HTML5 Audio based Audio Manager with Lazy Loading
// iOS-compatible, stable, and performant
class AudioManager {
    constructor() {
        this.enabled = true;
        this.initialized = false;
        this.defaultVolume = 0.3;

        // 📱 모바일 감지
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

        // 🎵 HTML5 Audio objects (Lazy loaded)
        this.sounds = {}; // { soundName: Audio }
        this.activeSounds = []; // Track active sounds for cleanup

        // Sound file paths
        this.soundFiles = {
            // High priority - preload immediately (frequently used)
            inGameClick: { path: '/sounds/1-7_ingame_buttonclick.mp3', preload: true },
            buttonClick: { path: '/sounds/1-14_menu_button click.mp3', preload: true },
            popupOpen: { path: '/sounds/1-3_popup_open.mp3', preload: true },
            popupClose: { path: '/sounds/1-4_popup_close.mp3', preload: true },
            correctSound: { path: '/sounds/1-15_correct.mp3', preload: true },
            incorrect: { path: '/sounds/1-13_ incorrect.mp3', preload: true },

            // Medium priority
            toggleChange: { path: '/sounds/1-2_toggle.mp3', preload: false },
            mainEnter: { path: '/sounds/1-1_main-refresh.mp3', preload: false },
            phaseEnter: { path: '/sounds/1-6_phasethrough.mp3', preload: false },
            colorGuide: { path: '/sounds/1-8_colorsequenceguide.mp3', preload: false },

            // Low priority - lazy load
            splash: { path: '/sounds/2-a_splash.mp3', preload: false },
            hardModeIntro: { path: '/sounds/1-5_hardmode.mp3', preload: false },
            gameOverFail: { path: '/sounds/1-9_gameover(fail).mp3', preload: false },
            gameOverSuccess: { path: '/sounds/1-10_gameover(success).mp3', preload: false },
            levelUp: { path: '/sounds/1-11_levelup.mp3', preload: false },
            hardModeUnlock: { path: '/sounds/1-12_hardmodeopen.mp3', preload: false },

            // Legacy aliases
            correct: { path: '/sounds/1-15_correct.mp3', preload: true },
            wrong: { path: '/sounds/1-13_ incorrect.mp3', preload: true },
            click: { path: '/sounds/1-7_ingame_buttonclick.mp3', preload: true },
        };
    }

    // Initialize audio manager on first user interaction
    init() {
        if (this.initialized) {
            return;
        }

        console.log('🎵 Initializing audioManager (HTML5 Audio + Lazy Loading)...');

        // Preload high-priority sounds
        const preloadSounds = Object.entries(this.soundFiles)
            .filter(([_, config]) => config.preload);

        console.log(`🎵 Preloading ${preloadSounds.length} sounds...`);

        preloadSounds.forEach(([name, config]) => {
            this._getOrCreateSound(name);
        });

        this.initialized = true;
        console.log('🎵 audioManager initialized ✓');
    }

    // Lazy load: Create Audio object only when first needed
    _getOrCreateSound(soundName) {
        if (!this.sounds[soundName]) {
            const config = this.soundFiles[soundName];
            if (!config) {
                console.warn(`Sound not found: ${soundName}`);
                return null;
            }

            const audio = new Audio(config.path);
            audio.preload = 'auto';
            audio.volume = this.defaultVolume;
            this.sounds[soundName] = audio;
            console.log(`✓ Loaded: ${soundName}`);
        }
        return this.sounds[soundName];
    }

    // 🎮 FAST PATH: Instant playback for game sounds (non-blocking)
    playFast(soundName) {
        if (!this.enabled) return;

        try {
            const sound = this._getOrCreateSound(soundName);
            if (!sound) return;

            // Clone the audio to allow overlapping sounds
            const clone = sound.cloneNode();
            clone.volume = this.defaultVolume;

            // Track active sound for cleanup
            this.activeSounds.push(clone);

            clone.play().catch(err => {
                console.warn('Audio play failed:', err.message);
            });

            // Auto-cleanup after playback
            clone.addEventListener('ended', () => {
                this._removeActiveSound(clone);
            }, { once: true });
        } catch (error) {
            console.warn('Error playing sound:', error);
        }
    }

    // Play with options (for longer sounds)
    play(soundName, options = {}) {
        if (!this.enabled) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            try {
                const sound = this._getOrCreateSound(soundName);
                if (!sound) {
                    resolve();
                    return;
                }

                // Clone the audio to allow overlapping sounds
                const clone = sound.cloneNode();
                clone.volume = this.defaultVolume;

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
                }, { once: true });

                clone.play().catch(err => {
                    console.warn('Audio play failed:', err.message);
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

    // Preload all sounds
    async preloadAll() {
        console.log('🎵 Preloading all sounds...');
        Object.keys(this.soundFiles).forEach(name => {
            this._getOrCreateSound(name);
        });
    }

    // ===== 기존 호환성 메서드 (Fast Path로 최적화) =====
    playCorrect() {
        this.playFast('correct');
    }

    playWrong() {
        this.playFast('wrong');
    }

    playClick() {
        this.playFast('click');
    }

    // ===== 화면 전환 및 UI =====
    playMainEnter() {
        return this.play('mainEnter');
    }

    playToggleChange() {
        return this.play('toggleChange', { maxDuration: 0.5 });
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
        return this.play('hardModeIntro', { maxDuration: 3 });
    }

    playPhaseEnter() {
        return this.play('phaseEnter', { maxDuration: 2 });
    }

    // ===== 인게임 상호작용 (Fast Path로 최적화) =====
    playInGameClick() {
        this.playFast('inGameClick');
    }

    playColorGuide() {
        return this.play('colorGuide');
    }

    playIncorrect() {
        this.playFast('incorrect');
    }

    playCorrectSound() {
        this.playFast('correctSound');
    }

    // ===== 일반 UI 버튼 (Fast Path로 최적화) =====
    playButtonClick() {
        this.playFast('buttonClick');
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

    // ===== 게임 종료 시 순차 재생 =====
    async playGameEndSequence(isSuccess, didLevelUp) {
        if (isSuccess) {
            await this.playGameOverSuccess();
        } else {
            await this.playGameOverFail();
        }

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
        this.defaultVolume = clampedVolume;

        // Update volume for already created sounds
        Object.values(this.sounds).forEach(sound => {
            sound.volume = clampedVolume;
        });
    }
}

// Create singleton instance
const audioManager = new AudioManager();

// Auto-initialize on first user interaction (for mobile)
const autoInit = () => {
    audioManager.init();
    // Remove listeners after first interaction
    document.removeEventListener('click', autoInit, true);
    document.removeEventListener('touchstart', autoInit, true);
    document.removeEventListener('keydown', autoInit, true);
};

// Listen for first user interaction
document.addEventListener('click', autoInit, true);
document.addEventListener('touchstart', autoInit, true);
document.addEventListener('keydown', autoInit, true);

export default audioManager;
