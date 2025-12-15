// Audio Manager for game sound effects
class AudioManager {
    constructor() {
        this.sounds = {};
        this.initialized = false;
        this.enabled = true;
    }

    // Preload all sound effects
    preloadSounds() {
        const soundFiles = {
            correct: '/sounds/correct.mp3',
            wrong: '/sounds/wrong.mp3',
            click: '/sounds/click.mp3',
        };

        Object.keys(soundFiles).forEach(key => {
            const audio = new Audio(soundFiles[key]);
            audio.preload = 'auto';
            // Set volume
            audio.volume = 0.5;
            this.sounds[key] = audio;
        });

        this.initialized = true;
    }

    // Initialize audio context on first user interaction
    init() {
        if (!this.initialized) {
            this.preloadSounds();
        }
    }

    // Play a sound effect
    play(soundName) {
        if (!this.enabled || !this.sounds[soundName]) {
            return;
        }

        try {
            const sound = this.sounds[soundName];
            // Clone the audio to allow overlapping sounds
            const clone = sound.cloneNode();
            clone.volume = sound.volume;
            clone.play().catch(err => {
                // Silently fail if autoplay is blocked
                console.warn('Audio play failed:', err);
            });
        } catch (error) {
            console.warn('Error playing sound:', error);
        }
    }

    // Play correct answer sound
    playCorrect() {
        this.play('correct');
    }

    // Play wrong answer sound
    playWrong() {
        this.play('wrong');
    }

    // Play click/tap sound
    playClick() {
        this.play('click');
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
        Object.values(this.sounds).forEach(sound => {
            sound.volume = clampedVolume;
        });
    }
}

// Create singleton instance
const audioManager = new AudioManager();

export default audioManager;
