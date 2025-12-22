// Optimized Audio Manager for game sound effects
class AudioManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.initialized = false;
        this.defaultVolume = 0.5;

        // Sound file paths with preload priority
        this.soundFiles = {
            // High priority - preload immediately (frequently used)
            inGameClick: { path: '/sounds/1-7_ingame_buttonclick.mp3', preload: 'auto' },
            buttonClick: { path: '/sounds/1-14_menu_button click.mp3', preload: 'auto' },
            popupOpen: { path: '/sounds/1-3_popup_open.mp3', preload: 'auto' },
            popupClose: { path: '/sounds/1-4_popup_close.mp3', preload: 'auto' },
            correctSound: { path: '/sounds/1-15_correct.mp3', preload: 'auto' },
            incorrect: { path: '/sounds/1-13_ incorrect.mp3', preload: 'auto' },

            // Medium priority - preload metadata (sometimes used)
            toggleChange: { path: '/sounds/1-2_toggle.mp3', preload: 'metadata' },
            mainEnter: { path: '/sounds/1-1_main-refresh.mp3', preload: 'metadata' },
            phaseEnter: { path: '/sounds/1-6_phasethrough.mp3', preload: 'metadata' },
            colorGuide: { path: '/sounds/1-8_colorsequenceguide.mp3', preload: 'metadata' },

            // Low priority - lazy load (rarely used)
            splash: { path: '/sounds/2-a_splash.mp3', preload: 'none' },
            hardModeIntro: { path: '/sounds/1-5_hardmode.wav', preload: 'none' },
            gameOverFail: { path: '/sounds/1-9_gameover(fail).mp3', preload: 'none' },
            gameOverSuccess: { path: '/sounds/1-10_gameover(success).wav', preload: 'none' },
            levelUp: { path: '/sounds/1-11_levelup.wav', preload: 'none' },
            hardModeUnlock: { path: '/sounds/1-12_hardmodeopen.mp3', preload: 'none' },

            // Legacy aliases
            correct: { path: '/sounds/1-15_correct.mp3', preload: 'auto' },
            wrong: { path: '/sounds/1-13_ incorrect.mp3', preload: 'auto' },
            click: { path: '/sounds/1-7_ingame_buttonclick.mp3', preload: 'auto' },
        };
    }

    // Initialize audio on first user interaction (for mobile compatibility)
    async init() {
        if (this.initialized) return;

        console.log('🔊 Initializing AudioManager...');

        // Create and preload high-priority sounds
        const highPrioritySounds = Object.entries(this.soundFiles)
            .filter(([_, config]) => config.preload === 'auto');

        for (const [name, config] of highPrioritySounds) {
            this._createSound(name, config);
        }

        this.initialized = true;
        console.log(`🔊 AudioManager initialized with ${highPrioritySounds.length} high-priority sounds`);
    }

    // Create Audio object with specified preload strategy
    _createSound(soundName, config) {
        if (this.sounds[soundName]) return this.sounds[soundName];

        const audio = new Audio(config.path);
        audio.preload = config.preload;
        audio.volume = this.defaultVolume;

        // For auto-preload sounds, trigger loading immediately
        if (config.preload === 'auto') {
            audio.load();
        }

        this.sounds[soundName] = audio;
        return audio;
    }

    // Get or create sound on-demand
    _getOrCreateSound(soundName) {
        if (this.sounds[soundName]) {
            return this.sounds[soundName];
        }

        const config = this.soundFiles[soundName];
        if (!config) {
            console.warn(`Sound not found: ${soundName}`);
            return null;
        }

        return this._createSound(soundName, config);
    }

    // Optimized play method with instant response
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

                // Clone for overlapping sounds
                const clone = sound.cloneNode();
                clone.volume = sound.volume;

                // Handle duration limit
                let timeoutId = null;
                if (options.maxDuration) {
                    timeoutId = setTimeout(() => {
                        clone.pause();
                        clone.currentTime = 0;
                        resolve();
                    }, options.maxDuration * 1000);
                }

                // Cleanup when sound ends
                clone.addEventListener('ended', () => {
                    if (timeoutId) clearTimeout(timeoutId);
                    resolve();
                }, { once: true });

                // Play immediately - catch errors silently for mobile autoplay restrictions
                const playPromise = clone.play();
                if (playPromise !== undefined) {
                    playPromise.catch(err => {
                        console.warn('Audio play blocked (expected on mobile):', soundName);
                        if (timeoutId) clearTimeout(timeoutId);
                        resolve();
                    });
                }
            } catch (error) {
                console.warn('Error playing sound:', error);
                resolve();
            }
        });
    }

    // Play sounds in sequence
    async playSequence(soundNames) {
        for (const item of soundNames) {
            if (typeof item === 'string') {
                await this.play(item);
            } else if (typeof item === 'object') {
                await this.play(item.name, item.options);
            }
        }
    }

    // Preload all sounds (call on splash screen or first interaction)
    preloadAll() {
        console.log('🔊 Preloading all sounds...');
        Object.entries(this.soundFiles).forEach(([name, config]) => {
            this._createSound(name, config);
        });
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

    // Set volume for all sounds
    setVolume(volume) {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            sound.volume = clampedVolume;
        });
        this.defaultVolume = clampedVolume;
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
