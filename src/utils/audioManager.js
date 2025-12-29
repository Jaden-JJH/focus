// Optimized Audio Manager for game sound effects with Audio Pool
class AudioManager {
    constructor() {
        this.sounds = {};
        this.audioPools = {}; // Pool of pre-created audio instances
        this.enabled = true;
        this.initialized = false;
        this.defaultVolume = 0.5;

        // 📱 모바일 감지 및 성능 최적화
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        this.isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)

        // 모바일에서는 풀 크기를 줄여 메모리 절약
        this.poolSize = this.isMobile ? 2 : 3 // Number of instances per high-priority sound

        // Sound file paths with preload priority
        this.soundFiles = {
            // High priority - preload immediately (frequently used)
            inGameClick: { path: '/sounds/1-7_ingame_buttonclick.mp3', preload: 'auto', pooled: true },
            buttonClick: { path: '/sounds/1-14_menu_button click.mp3', preload: 'auto', pooled: true },
            popupOpen: { path: '/sounds/1-3_popup_open.mp3', preload: 'auto', pooled: true },
            popupClose: { path: '/sounds/1-4_popup_close.mp3', preload: 'auto', pooled: true },
            correctSound: { path: '/sounds/1-15_correct.mp3', preload: 'auto', pooled: true },
            incorrect: { path: '/sounds/1-13_ incorrect.mp3', preload: 'auto', pooled: true },

            // Medium priority - preload metadata (sometimes used)
            toggleChange: { path: '/sounds/1-2_toggle.mp3', preload: 'metadata', pooled: false },
            mainEnter: { path: '/sounds/1-1_main-refresh.mp3', preload: 'metadata', pooled: false },
            phaseEnter: { path: '/sounds/1-6_phasethrough.mp3', preload: 'metadata', pooled: false },
            colorGuide: { path: '/sounds/1-8_colorsequenceguide.mp3', preload: 'metadata', pooled: false },

            // Low priority - lazy load (rarely used)
            splash: { path: '/sounds/2-a_splash.mp3', preload: 'none', pooled: false },
            hardModeIntro: { path: '/sounds/1-5_hardmode.wav', preload: 'none', pooled: false },
            gameOverFail: { path: '/sounds/1-9_gameover(fail).mp3', preload: 'none', pooled: false },
            gameOverSuccess: { path: '/sounds/1-10_gameover(success).wav', preload: 'none', pooled: false },
            levelUp: { path: '/sounds/1-11_levelup.wav', preload: 'none', pooled: false },
            hardModeUnlock: { path: '/sounds/1-12_hardmodeopen.mp3', preload: 'none', pooled: false },

            // Legacy aliases
            correct: { path: '/sounds/1-15_correct.mp3', preload: 'auto', pooled: true },
            wrong: { path: '/sounds/1-13_ incorrect.mp3', preload: 'auto', pooled: true },
            click: { path: '/sounds/1-7_ingame_buttonclick.mp3', preload: 'auto', pooled: true },
        };
    }

    // Initialize audio on first user interaction (for mobile compatibility)
    async init() {
        if (this.initialized) return;

        console.log('🔊 Initializing AudioManager with Audio Pool...');

        // Create pools for high-priority sounds
        const pooledSounds = Object.entries(this.soundFiles)
            .filter(([_, config]) => config.pooled);

        for (const [name, config] of pooledSounds) {
            this._createAudioPool(name, config);
        }

        // Create single instances for non-pooled high-priority sounds
        const nonPooledHighPriority = Object.entries(this.soundFiles)
            .filter(([_, config]) => config.preload === 'auto' && !config.pooled);

        for (const [name, config] of nonPooledHighPriority) {
            this._createSound(name, config);
        }

        this.initialized = true;
        console.log(`🔊 AudioManager initialized: ${pooledSounds.length} pooled sounds (${this.poolSize} instances each), ${nonPooledHighPriority.length} non-pooled`);
    }

    // Create audio pool for frequently used sounds
    _createAudioPool(soundName, config) {
        if (this.audioPools[soundName]) return;

        const pool = [];
        for (let i = 0; i < this.poolSize; i++) {
            const audio = new Audio(config.path);
            audio.preload = 'auto';
            audio.volume = this.defaultVolume;
            audio.load(); // Force immediate loading
            pool.push(audio);
        }

        this.audioPools[soundName] = {
            instances: pool,
            nextIndex: 0
        };

        console.log(`🔊 Created audio pool for "${soundName}" with ${this.poolSize} instances`);
    }

    // Get next available instance from pool
    _getPooledInstance(soundName) {
        const pool = this.audioPools[soundName];
        if (!pool) return null;

        const instance = pool.instances[pool.nextIndex];
        pool.nextIndex = (pool.nextIndex + 1) % pool.instances.length;

        // Reset instance for reuse
        if (instance.currentTime > 0) {
            instance.currentTime = 0;
        }

        return instance;
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

    // Optimized play method with instant response using audio pool
    play(soundName, options = {}) {
        if (!this.enabled) {
            return Promise.resolve();
        }

        // Try to get from pool first for instant playback
        let audioInstance = this._getPooledInstance(soundName);

        // Fallback to traditional method for non-pooled sounds
        if (!audioInstance) {
            const sound = this._getOrCreateSound(soundName);
            if (!sound) {
                return Promise.resolve();
            }

            // For non-pooled sounds, still need to clone
            audioInstance = sound.cloneNode();
            audioInstance.volume = sound.volume;
        }

        // 📱 iOS 최적화: 즉시 재생 시도 (사용자 상호작용 컨텍스트에서만 동작)
        const playPromise = audioInstance.play();

        // Handle errors silently
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                // iOS에서 autoplay 차단은 정상적인 동작
                if (!this.isIOS) {
                    console.warn('Audio play blocked:', soundName);
                }
            });
        }

        // Return promise for backwards compatibility
        return new Promise((resolve) => {
            let timeoutId = null;

            // Handle duration limit
            if (options.maxDuration) {
                timeoutId = setTimeout(() => {
                    audioInstance.pause();
                    audioInstance.currentTime = 0;
                    resolve();
                }, options.maxDuration * 1000);
            }

            // Cleanup when sound ends
            audioInstance.addEventListener('ended', () => {
                if (timeoutId) clearTimeout(timeoutId);
                resolve();
            }, { once: true });
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

    // Set volume for all sounds (including pooled instances)
    setVolume(volume) {
        const clampedVolume = Math.max(0, Math.min(1, volume));

        // Update non-pooled sounds
        Object.values(this.sounds).forEach(sound => {
            sound.volume = clampedVolume;
        });

        // Update all pooled instances
        Object.values(this.audioPools).forEach(pool => {
            pool.instances.forEach(instance => {
                instance.volume = clampedVolume;
            });
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
