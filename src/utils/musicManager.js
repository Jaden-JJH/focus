// Background Music Manager for Focus Game
class MusicManager {
    constructor() {
        this.enabled = true
        this.currentMusic = null
        this.nextMusic = null
        this.currentMode = null // 'main', 'normal', 'hard'
        this.volume = 0.15 // 15% 볼륨
        this.isFading = false

        // 노말모드 랜덤 재생 관련
        this.normalPlaylist = []
        this.normalCurrentIndex = 0

        // 음악 파일 경로
        this.musicPaths = {
            main: '/sounds/music/1.main.mp3',
            normal: [
                '/sounds/music/2.normal-random(1).mp3',
                '/sounds/music/3.normal-random(2).mp3',
                '/sounds/music/4.normal-random(3).mp3',
                '/sounds/music/5.normal-random(4).mp3'
            ],
            hard: '/sounds/music/6.hard.mp3'
        }

        // 하드모드 시작 시간 (3초)
        this.hardModeStartTime = 3.0
    }

    // 음악 초기화 (사용자 인터랙션 후 호출)
    init() {
        console.log('🎵 MusicManager initialized')
    }

    // 메인 화면 음악 재생
    playMainMusic() {
        if (!this.enabled) return

        this.currentMode = 'main'
        this._loadAndPlay(this.musicPaths.main, {
            loop: true,
            fadeIn: 2.0,
            startTime: 0
        })
    }

    // 노말모드 음악 재생 (랜덤 순서)
    playNormalMusic() {
        if (!this.enabled) return

        this.currentMode = 'normal'

        // 첫 재생이거나 플레이리스트가 끝난 경우 새로운 랜덤 순서 생성
        if (this.normalPlaylist.length === 0) {
            this._generateRandomPlaylist()
            this.normalCurrentIndex = 0
        }

        const currentTrack = this.normalPlaylist[this.normalCurrentIndex]

        this._loadAndPlay(currentTrack, {
            loop: false,
            fadeIn: 2.0,
            startTime: 0,
            onEnded: () => this._playNextNormalTrack()
        })
    }

    // 다음 노말모드 트랙 재생 (크로스페이드)
    _playNextNormalTrack() {
        if (this.currentMode !== 'normal') return

        this.normalCurrentIndex++

        // 플레이리스트 끝나면 새로운 랜덤 순서로 재시작
        if (this.normalCurrentIndex >= this.normalPlaylist.length) {
            this._generateRandomPlaylist()
            this.normalCurrentIndex = 0
        }

        const nextTrack = this.normalPlaylist[this.normalCurrentIndex]

        // 크로스페이드 (2.5초)
        this._crossFade(nextTrack, 2.5, {
            loop: false,
            startTime: 0,
            onEnded: () => this._playNextNormalTrack()
        })
    }

    // 랜덤 플레이리스트 생성 (Fisher-Yates Shuffle)
    _generateRandomPlaylist() {
        this.normalPlaylist = [...this.musicPaths.normal]

        for (let i = this.normalPlaylist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.normalPlaylist[i], this.normalPlaylist[j]] = [this.normalPlaylist[j], this.normalPlaylist[i]]
        }

        console.log('🎵 New Normal Playlist:', this.normalPlaylist.map(p => p.split('/').pop()))
    }

    // 하드모드 음악 재생 (3초부터 시작, 크로스페이드로 반복)
    playHardMusic() {
        if (!this.enabled) return

        this.currentMode = 'hard'

        this._loadAndPlay(this.musicPaths.hard, {
            loop: false,
            fadeIn: 2.0,
            startTime: this.hardModeStartTime,
            onEnded: () => this._loopHardMusic()
        })
    }

    // 하드모드 음악 반복 (크로스페이드 1.5초)
    _loopHardMusic() {
        if (this.currentMode !== 'hard') return

        this._crossFade(this.musicPaths.hard, 1.5, {
            loop: false,
            startTime: this.hardModeStartTime,
            onEnded: () => this._loopHardMusic()
        })
    }

    // 음악 로드 및 재생
    _loadAndPlay(path, options = {}) {
        const {
            loop = false,
            fadeIn = 0,
            startTime = 0,
            onEnded = null
        } = options

        // 기존 음악 정지 (페이드아웃 없이)
        if (this.currentMusic) {
            this.currentMusic.pause()
            this.currentMusic.currentTime = 0
        }

        // 새 음악 로드
        const audio = new Audio(path)
        audio.volume = 0
        audio.currentTime = startTime

        if (loop) {
            audio.loop = true
        }

        if (onEnded) {
            audio.addEventListener('ended', onEnded, { once: true })
        }

        // 재생 시작
        const playPromise = audio.play()

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log(`🎵 Playing: ${path.split('/').pop()}`)

                    // 페이드인
                    if (fadeIn > 0) {
                        this._fadeIn(audio, fadeIn)
                    } else {
                        audio.volume = this.volume
                    }
                })
                .catch(err => {
                    console.warn('🎵 Music play blocked:', err)
                })
        }

        this.currentMusic = audio
    }

    // 크로스페이드 (현재 음악 페이드아웃 + 새 음악 페이드인)
    _crossFade(newPath, duration, options = {}) {
        const {
            loop = false,
            startTime = 0,
            onEnded = null
        } = options

        const oldMusic = this.currentMusic

        // 새 음악 로드
        const newMusic = new Audio(newPath)
        newMusic.volume = 0
        newMusic.currentTime = startTime

        if (loop) {
            newMusic.loop = true
        }

        if (onEnded) {
            newMusic.addEventListener('ended', onEnded, { once: true })
        }

        // 새 음악 재생 시작
        const playPromise = newMusic.play()

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log(`🎵 Crossfading to: ${newPath.split('/').pop()}`)

                    // 동시에 페이드아웃/인
                    if (oldMusic) {
                        this._fadeOut(oldMusic, duration, () => {
                            oldMusic.pause()
                            oldMusic.currentTime = 0
                        })
                    }

                    this._fadeIn(newMusic, duration)
                })
                .catch(err => {
                    console.warn('🎵 Crossfade blocked:', err)
                })
        }

        this.currentMusic = newMusic
    }

    // 페이드인 효과
    _fadeIn(audio, duration) {
        if (this.isFading) return

        this.isFading = true
        const startVolume = 0
        const endVolume = this.volume
        const steps = 60 // 60 steps for smooth fade
        const stepDuration = (duration * 1000) / steps
        const volumeIncrement = (endVolume - startVolume) / steps

        let currentStep = 0

        const fadeInterval = setInterval(() => {
            currentStep++
            const newVolume = Math.min(startVolume + (volumeIncrement * currentStep), endVolume)
            audio.volume = newVolume

            if (currentStep >= steps) {
                clearInterval(fadeInterval)
                audio.volume = endVolume
                this.isFading = false
            }
        }, stepDuration)
    }

    // 페이드아웃 효과
    _fadeOut(audio, duration, onComplete = null) {
        const startVolume = audio.volume
        const endVolume = 0
        const steps = 60
        const stepDuration = (duration * 1000) / steps
        const volumeDecrement = (startVolume - endVolume) / steps

        let currentStep = 0

        const fadeInterval = setInterval(() => {
            currentStep++
            const newVolume = Math.max(startVolume - (volumeDecrement * currentStep), endVolume)
            audio.volume = newVolume

            if (currentStep >= steps) {
                clearInterval(fadeInterval)
                audio.volume = endVolume
                if (onComplete) onComplete()
            }
        }, stepDuration)
    }

    // 음악 정지 (페이드아웃)
    stop(fadeOutDuration = 2.0) {
        if (this.currentMusic) {
            this._fadeOut(this.currentMusic, fadeOutDuration, () => {
                if (this.currentMusic) {
                    this.currentMusic.pause()
                    this.currentMusic.currentTime = 0
                    this.currentMusic = null
                }
            })
        }

        this.currentMode = null
        this.normalPlaylist = []
        this.normalCurrentIndex = 0
    }

    // 음악 일시정지 (즉시)
    pause() {
        if (this.currentMusic) {
            this.currentMusic.pause()
        }
    }

    // 음악 재개
    resume() {
        if (this.currentMusic) {
            this.currentMusic.play().catch(err => {
                console.warn('🎵 Resume blocked:', err)
            })
        }
    }

    // 음악 활성화/비활성화
    setEnabled(enabled) {
        this.enabled = enabled

        if (!enabled) {
            this.stop(0.5)
        }
    }

    // 음악 활성화 상태 확인
    isEnabled() {
        return this.enabled
    }

    // 볼륨 설정
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume))

        if (this.currentMusic) {
            this.currentMusic.volume = this.volume
        }
    }
}

// Create singleton instance
const musicManager = new MusicManager()

// Auto-initialize on first user interaction
const autoInit = () => {
    musicManager.init()
    // Remove listeners after first interaction
    document.removeEventListener('click', autoInit, true)
    document.removeEventListener('touchstart', autoInit, true)
    document.removeEventListener('keydown', autoInit, true)
}

// Listen for first user interaction
document.addEventListener('click', autoInit, true)
document.addEventListener('touchstart', autoInit, true)
document.addEventListener('keydown', autoInit, true)

export default musicManager
