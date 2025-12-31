// 🎮 Web Audio API based Audio Manager for ultra-low latency game sounds
class AudioManager {
    constructor() {
        this.enabled = true;
        this.initialized = false;
        this.defaultVolume = 0.3;

        // 📱 모바일 감지
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        this.isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)

        // 🎵 Web Audio API
        this.audioContext = null;
        this.audioBuffers = {}; // { soundName: AudioBuffer }
        this.gainNode = null; // Master volume control

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

    // Initialize Web Audio API on first user interaction
    async init() {
        if (this.initialized) return;

        try {
            console.log('🎵 Initializing Web Audio API...');

            // Create AudioContext
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();

            // Create master gain node for volume control
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = this.defaultVolume;
            this.gainNode.connect(this.audioContext.destination);

            // Preload high-priority sounds
            const preloadSounds = Object.entries(this.soundFiles)
                .filter(([_, config]) => config.preload);

            console.log(`🎵 Preloading ${preloadSounds.length} sounds...`);

            await Promise.all(
                preloadSounds.map(([name, config]) => this._loadSound(name, config.path))
            );

            this.initialized = true;
            console.log('🎵 Web Audio API initialized successfully');
        } catch (err) {
            console.error('Failed to initialize Web Audio API:', err);
        }
    }

    // Load and decode audio file into AudioBuffer
    async _loadSound(soundName, path) {
        try {
            const response = await fetch(path);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.audioBuffers[soundName] = audioBuffer;
            console.log(`✓ Loaded: ${soundName}`);
        } catch (err) {
            console.warn(`Failed to load sound: ${soundName}`, err);
        }
    }

    // 🎮 FAST PATH: Ultra-low latency playback using Web Audio API
    playFast(soundName) {
        if (!this.enabled || !this.initialized) return;

        const buffer = this.audioBuffers[soundName];
        if (!buffer) {
            // Lazy load if not preloaded
            const config = this.soundFiles[soundName];
            if (config && !this.audioBuffers[soundName]) {
                this._loadSound(soundName, config.path);
            }
            return;
        }

        // 🎵 Create AudioBufferSourceNode for instant playback
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.gainNode);
        source.start(0); // Start immediately, non-blocking!

        // Auto-cleanup after playback
        source.onended = () => {
            source.disconnect();
        };
    }

    // Play with options (for longer sounds)
    play(soundName, options = {}) {
        if (!this.enabled || !this.initialized) {
            return Promise.resolve();
        }

        const buffer = this.audioBuffers[soundName];
        if (!buffer) {
            // Lazy load
            const config = this.soundFiles[soundName];
            if (config) {
                return this._loadSound(soundName, config.path).then(() => {
                    return this.play(soundName, options);
                });
            }
            return Promise.resolve();
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.gainNode);

        // Apply maxDuration if specified
        if (options.maxDuration) {
            source.start(0, 0, options.maxDuration);
        } else {
            source.start(0);
        }

        // Return promise that resolves when sound ends
        return new Promise((resolve) => {
            source.onended = () => {
                source.disconnect();
                resolve();
            };
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

    // Preload all sounds
    async preloadAll() {
        console.log('🎵 Preloading all sounds...');
        const promises = Object.entries(this.soundFiles).map(([name, config]) =>
            this._loadSound(name, config.path)
        );
        await Promise.all(promises);
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

    // Set volume (0.0 to 1.0)
    setVolume(volume) {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        this.defaultVolume = clampedVolume;
        if (this.gainNode) {
            this.gainNode.gain.value = clampedVolume;
        }
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
