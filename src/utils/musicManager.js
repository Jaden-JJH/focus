// Background Music Manager for Focus Game
class MusicManager {
    constructor() {
        this.currentMusic = null
        this.currentMode = null // 'main', 'normal', 'hard'
        this.volume = 0.05 // 5% 볼륨
        this.targetState = 'stopped' // 'playing' | 'stopped' - 즉시 반영되는 상태

        // Web Audio API (iOS Safari 볼륨 조절을 위해)
        this.audioContext = null
        this.gainNode = null
        this.sourceNode = null

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
    async init() {
        // Web Audio API 초기화 (iOS Safari 볼륨 조절을 위해)
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
            this.gainNode = this.audioContext.createGain()
            this.gainNode.connect(this.audioContext.destination)
            this.gainNode.gain.value = this.volume
            console.log('🎵 musicManager initialized ✓')
        }

        // ⚠️ iOS Fix: AudioContext가 suspended 상태면 항상 resume 시도
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume()
                console.log('🎵 musicManager AudioContext resumed ✓')
            } catch (err) {
                console.warn('🎵 musicManager AudioContext resume failed:', err.message)
            }
        }
    }

    // ===== PUBLIC API =====

    // 현재 음악이 재생 중인지 확인 (targetState 기반으로 즉시 반영)
    isPlaying() {
        const result = this.targetState === 'playing'
        console.log('🎵 isPlaying() 호출 - targetState:', this.targetState, '→ 결과:', result)
        return result
    }

    // 메인 화면 음악 즉시 재생 (BGM 버튼용)
    async playMainMusic() {
        console.log('🎵 playMainMusic() 호출됨')

        // Web Audio API 초기화 및 resume 확인
        await this.init()

        // ⚠️ iOS Fix: AudioContext가 suspended 상태면 resume 시도
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume()
                console.log('🎵 AudioContext resumed in playMainMusic() ✓')
            } catch (err) {
                console.warn('🎵 AudioContext resume failed in playMainMusic():', err.message)
            }
        }

        // 기존 음악 즉시 정지 및 정리
        this._stopImmediate()

        // 사용자 의도 상태 업데이트 (재생 실패해도 유지)
        this.targetState = 'playing'
        console.log('🎵 targetState = playing (사용자 의도)')
        this.currentMode = 'main'

        const audio = new Audio(this.musicPaths.main)
        audio.loop = true

        // Web Audio API로 볼륨 조절 (iOS Safari 지원)
        try {
            this.sourceNode = this.audioContext.createMediaElementSource(audio)
            this.sourceNode.connect(this.gainNode)
        } catch (err) {
            console.warn('🎵 MediaElementSource 생성 실패:', err)
            // 재생 시도는 계속 진행 (Audio 객체만으로도 재생 가능)
        }

        audio.play()
            .then(() => {
                console.log('🎵 Main BGM 재생 성공 ✓')
                console.log('🎵 Volume:', this.gainNode ? this.gainNode.gain.value : audio.volume)
            })
            .catch(err => {
                console.warn('🎵 BGM autoplay 차단됨 (브라우저 정책):', err.message)
                console.log('🎵 사용자가 다시 인터랙션하면 재생 시도됩니다')
                // targetState는 'playing' 유지 - 사용자 의도 존중
            })

        this.currentMusic = audio
    }

    // 음악 즉시 정지 (BGM 버튼용)
    stopMusic() {
        console.log('🎵 stopMusic() 호출됨')
        this.targetState = 'stopped' // 즉시 상태 업데이트
        console.log('🎵 targetState = stopped')
        this._stopImmediate()
        console.log('🎵 BGM OFF - 정지 완료')
    }

    // 메인 화면 음악 재생 (페이드인)
    playMainMusicWithFade() {
        this.targetState = 'playing'
        this.currentMode = 'main'
        this._loadAndPlay(this.musicPaths.main, {
            loop: true,
            fadeIn: 2.0,
            startTime: 0
        })
    }

    // 노말모드 음악 재생 (랜덤 순서)
    async playNormalMusic() {
        console.log('🎵 playNormalMusic() 호출됨')

        // 사용자 BGM 설정 확인 (localStorage)
        const bgmEnabled = localStorage.getItem('bgm_enabled') === 'true'
        if (!bgmEnabled) {
            console.log('🎵 BGM OFF 상태 - 노말 음악 재생 건너뜀')
            this.targetState = 'stopped'
            return
        }

        // Web Audio API 초기화 및 resume 확인
        await this.init()

        this.targetState = 'playing'
        this.currentMode = 'normal'

        // 첫 재생이거나 플레이리스트가 끝난 경우 새로운 랜덤 순서 생성
        if (this.normalPlaylist.length === 0) {
            this._generateRandomPlaylist()
            this.normalCurrentIndex = 0
        }

        const currentTrack = this.normalPlaylist[this.normalCurrentIndex]

        await this._loadAndPlay(currentTrack, {
            loop: false,
            fadeIn: 2.0,
            startTime: 0,
            onEnded: () => this._playNextNormalTrack()
        })
    }

    // 하드모드 음악 재생 (3초부터 시작, 크로스페이드로 반복)
    async playHardMusic() {
        console.log('🎵 playHardMusic() 호출됨')

        // 사용자 BGM 설정 확인 (localStorage)
        const bgmEnabled = localStorage.getItem('bgm_enabled') === 'true'
        if (!bgmEnabled) {
            console.log('🎵 BGM OFF 상태 - 하드 음악 재생 건너뜀')
            this.targetState = 'stopped'
            return
        }

        // Web Audio API 초기화 및 resume 확인
        await this.init()

        this.targetState = 'playing'
        this.currentMode = 'hard'

        await this._loadAndPlay(this.musicPaths.hard, {
            loop: false,
            fadeIn: 2.0,
            startTime: this.hardModeStartTime,
            onEnded: () => this._loopHardMusic()
        })
    }

    // 음악 정지 (페이드아웃)
    stopWithFade(fadeOutDuration = 2.0) {
        this.targetState = 'stopped'

        if (this.currentMusic) {
            this._fadeOutGain(fadeOutDuration, () => {
                if (this.currentMusic) {
                    this.currentMusic.pause()
                    this.currentMusic.currentTime = 0
                    this.currentMusic = null
                }

                // Web Audio API sourceNode 정리
                if (this.sourceNode) {
                    try {
                        this.sourceNode.disconnect()
                    } catch (e) {}
                    this.sourceNode = null
                }
            })
        }

        this.currentMode = null
        this.normalPlaylist = []
        this.normalCurrentIndex = 0
    }

    // 볼륨 설정
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume))
        console.log(`🎵 Volume changed: ${this.volume}`)

        // Web Audio API의 GainNode로 볼륨 조절 (iOS Safari 지원)
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume
            console.log(`🎵 GainNode volume updated: ${this.gainNode.gain.value}`)
        }
    }

    // ===== PRIVATE METHODS =====

    // 즉시 정지 (내부용)
    _stopImmediate() {
        // 기존 Audio 객체 정리
        if (this.currentMusic) {
            try {
                this.currentMusic.pause()
                this.currentMusic.currentTime = 0
                this.currentMusic.src = '' // 리소스 해제
            } catch (e) {
                console.warn('🎵 Audio 정리 중 오류:', e)
            }
            this.currentMusic = null
        }

        // Web Audio API sourceNode 정리
        if (this.sourceNode) {
            try {
                this.sourceNode.disconnect()
            } catch (e) {
                // sourceNode가 이미 disconnect된 경우 무시
            }
            this.sourceNode = null
        }

        this.currentMode = null
        this.normalPlaylist = []
        this.normalCurrentIndex = 0
        // targetState는 호출한 곳에서 설정
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
    async _loadAndPlay(path, options = {}) {
        const {
            loop = false,
            fadeIn = 0,
            startTime = 0,
            onEnded = null
        } = options

        // Web Audio API 초기화 및 resume 확인
        await this.init()

        // ⚠️ iOS Fix: AudioContext가 suspended 상태면 resume 시도
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume()
                console.log('🎵 AudioContext resumed in _loadAndPlay() ✓')
            } catch (err) {
                console.warn('🎵 AudioContext resume failed in _loadAndPlay():', err.message)
            }
        }

        // 기존 음악 정리
        if (this.currentMusic) {
            this.currentMusic.pause()
            this.currentMusic.currentTime = 0
        }

        if (this.sourceNode) {
            try {
                this.sourceNode.disconnect()
            } catch (e) {}
        }

        // 새 음악 로드
        const audio = new Audio(path)
        audio.currentTime = startTime

        if (loop) {
            audio.loop = true
        }

        if (onEnded) {
            audio.addEventListener('ended', onEnded, { once: true })
        }

        // Web Audio API로 볼륨 조절 (iOS Safari 지원)
        try {
            this.sourceNode = this.audioContext.createMediaElementSource(audio)
            this.sourceNode.connect(this.gainNode)

            // 페이드인을 위해 초기 볼륨 0으로 설정
            if (fadeIn > 0) {
                this.gainNode.gain.value = 0
            } else {
                this.gainNode.gain.value = this.volume
            }
        } catch (err) {
            console.warn('🎵 MediaElementSource 생성 실패:', err)
            // Web Audio API 실패 시에도 기본 Audio 재생 시도
        }

        // 재생 시작
        const playPromise = audio.play()

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log(`🎵 재생 성공: ${path.split('/').pop()} ✓`)

                    // 페이드인
                    if (fadeIn > 0 && this.gainNode) {
                        this._fadeInGain(fadeIn)
                    } else if (this.gainNode) {
                        console.log(`🎵 Volume: ${this.gainNode.gain.value}`)
                    }
                })
                .catch(err => {
                    console.warn('🎵 음악 재생 차단됨 (브라우저 정책):', err.message)
                    console.log('🎵 다음 사용자 인터랙션 시 재시도됩니다')
                    // targetState는 유지 - 사용자 의도 존중
                })
        }

        this.currentMusic = audio
    }

    // 크로스페이드 (현재 음악 페이드아웃 + 새 음악 페이드인)
    // Web Audio API에서는 단일 GainNode를 사용하므로 _loadAndPlay로 대체
    _crossFade(newPath, duration, options = {}) {
        const {
            loop = false,
            startTime = 0,
            onEnded = null
        } = options

        // 기존 음악 정지
        if (this.currentMusic) {
            this.currentMusic.pause()
            this.currentMusic.currentTime = 0
        }

        // 새 음악을 페이드인으로 로드
        this._loadAndPlay(newPath, {
            loop: loop,
            fadeIn: duration,
            startTime: startTime,
            onEnded: onEnded
        })
    }

    // 페이드인 효과 (Web Audio API GainNode 사용)
    _fadeInGain(duration) {
        const startVolume = 0
        const endVolume = this.volume
        const steps = 60 // 60 steps for smooth fade
        const stepDuration = (duration * 1000) / steps
        const volumeIncrement = (endVolume - startVolume) / steps

        console.log(`🎵 Fade in started: 0 → ${endVolume}`)

        let currentStep = 0

        const fadeInterval = setInterval(() => {
            currentStep++
            const newVolume = Math.min(startVolume + (volumeIncrement * currentStep), endVolume)

            if (this.gainNode) {
                this.gainNode.gain.value = newVolume
            }

            if (currentStep >= steps) {
                clearInterval(fadeInterval)
                if (this.gainNode) {
                    this.gainNode.gain.value = endVolume
                }
                console.log(`🎵 Fade in completed: ${endVolume}`)
            }
        }, stepDuration)
    }

    // 페이드아웃 효과 (Web Audio API GainNode 사용)
    _fadeOutGain(duration, onComplete = null) {
        if (!this.gainNode) {
            if (onComplete) onComplete()
            return
        }

        const startVolume = this.gainNode.gain.value
        const endVolume = 0
        const steps = 60
        const stepDuration = (duration * 1000) / steps
        const volumeDecrement = (startVolume - endVolume) / steps

        let currentStep = 0

        const fadeInterval = setInterval(() => {
            currentStep++
            const newVolume = Math.max(startVolume - (volumeDecrement * currentStep), endVolume)

            if (this.gainNode) {
                this.gainNode.gain.value = newVolume
            }

            if (currentStep >= steps) {
                clearInterval(fadeInterval)
                if (this.gainNode) {
                    this.gainNode.gain.value = endVolume
                }
                if (onComplete) onComplete()
            }
        }, stepDuration)
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
