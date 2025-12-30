
import { CONFIG, LEVELS } from '../config/gameConfig.js'
import { store } from './store.js'
import { dataService } from '../services/dataService.js'
import audioManager from '../utils/audioManager.js'
import musicManager from '../utils/musicManager.js'
import { getPerformanceLevel } from '../utils/deviceDetect.js'

// Import games (later dynamically or via map)
import { ShapeMatch } from '../games/ShapeMatch.js'
import { WordSearch } from '../games/WordSearch.js'
import { NumberOrder } from '../games/NumberOrder.js'
import { StroopTest } from '../games/StroopTest.js'
import { PatternMemory } from '../games/PatternMemory.js'
// ...

const GAMES = {
    'shape_match': ShapeMatch,
    'word_search': WordSearch,
    'number_order': NumberOrder,
    'stroop_test': StroopTest,
    'pattern_memory': PatternMemory
}

const GAME_KEYS = Object.keys(GAMES)

export class GameEngine {
    constructor(container, onGameOver) {
        this.container = container
        this.onGameOver = onGameOver

        this.state = {
            round: 1,
            score: 0,
            xp: 0,
            timeLimit: CONFIG.INITIAL_TIME_LIMIT,
            timeLeft: CONFIG.INITIAL_TIME_LIMIT,
            isPlaying: false,
            currentGameInstance: null,
            history: [], // Last N games to check constraints
            startTime: null, // Track game start time for focus duration
            totalFocusTime: 0, // Total time spent focusing
            combo: 0 // 콤보 카운터
        }

        // 🎮 RAF-based game loop
        this.animationId = null
        this.lastUpdateTime = 0
        this.lastTimerPercent = 100 // For batched UI updates

        // 📱 성능 레벨에 따른 설정
        this.performanceLevel = getPerformanceLevel()
        console.log(`📱 Performance Level: ${this.performanceLevel}`)

        // 🔍 Phase 1: 진단 카운터
        this.diagnostics = {
            confettiCreated: 0,
            confettiRemoved: 0,
            shockwaveCreated: 0,
            shockwaveRemoved: 0,
            rafShakeActive: false,
            handleCorrectCount: 0,
            intervalIds: new Set(),
            lastExecutionTime: 0,
            maxExecutionTime: 0,
            avgExecutionTime: 0
        }
        this.shakeRafId = null // screenShake RAF ID 추적
        this.diagnosticsOverlay = null // 화면 진단 오버레이
    }

    // 🔍 Phase 1: 화면 진단 오버레이 생성
    createDiagnosticsOverlay() {
        if (this.diagnosticsOverlay) return

        this.diagnosticsOverlay = document.createElement('div')
        this.diagnosticsOverlay.id = 'diagnostics-overlay'
        this.diagnosticsOverlay.style.cssText = `
            position: fixed;
            top: 60px;
            right: 10px;
            background: rgba(0, 0, 0, 0.85);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            padding: 8px;
            border-radius: 4px;
            z-index: 9999;
            pointer-events: none;
            min-width: 200px;
            line-height: 1.4;
            border: 1px solid #00ff00;
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        `
        document.body.appendChild(this.diagnosticsOverlay)
        this.updateDiagnosticsOverlay()
    }

    // 🔍 Phase 1: 화면 진단 정보 업데이트
    updateDiagnosticsOverlay() {
        if (!this.diagnosticsOverlay) return

        const confettiLeak = this.diagnostics.confettiCreated - this.diagnostics.confettiRemoved
        const shockwaveLeak = this.diagnostics.shockwaveCreated - this.diagnostics.shockwaveRemoved
        const totalLeaks = confettiLeak + shockwaveLeak

        // 누수 상태에 따른 색상
        let statusColor = '#00ff00' // 정상
        let statusText = 'OK'
        if (totalLeaks > 10) {
            statusColor = '#ff0000' // 심각
            statusText = 'LEAK!'
        } else if (totalLeaks > 5) {
            statusColor = '#ffaa00' // 경고
            statusText = 'WARN'
        }

        this.diagnosticsOverlay.innerHTML = `
            <div style="color: ${statusColor}; font-weight: bold; margin-bottom: 4px;">
                🔍 DIAGNOSTICS [${statusText}]
            </div>
            <div style="border-top: 1px solid #333; padding-top: 4px;">
                Round: <span style="color: #fff">${this.state.round}</span><br>
                Correct: <span style="color: #fff">${this.diagnostics.handleCorrectCount}</span><br>
                <br>
                <span style="color: #888">--- Performance ---</span><br>
                Last: <span style="color: ${this.diagnostics.lastExecutionTime > 15 ? '#ff0000' : '#fff'}">${this.diagnostics.lastExecutionTime.toFixed(1)}ms</span><br>
                Max: <span style="color: ${this.diagnostics.maxExecutionTime > 20 ? '#ff0000' : '#fff'}">${this.diagnostics.maxExecutionTime.toFixed(1)}ms</span><br>
                Avg: <span style="color: #fff">${this.diagnostics.avgExecutionTime.toFixed(1)}ms</span><br>
                <br>
                <span style="color: #888">--- Memory Leaks ---</span><br>
                Confetti: <span style="color: ${confettiLeak > 5 ? '#ff0000' : '#fff'}">${confettiLeak}</span><br>
                Shockwave: <span style="color: ${shockwaveLeak > 5 ? '#ff0000' : '#fff'}">${shockwaveLeak}</span><br>
                Intervals: <span style="color: ${this.diagnostics.intervalIds.size > 0 ? '#ffaa00' : '#fff'}">${this.diagnostics.intervalIds.size}</span><br>
                RAF Shake: <span style="color: ${this.diagnostics.rafShakeActive ? '#ffaa00' : '#fff'}">${this.diagnostics.rafShakeActive ? 'ACTIVE' : 'idle'}</span>
            </div>
        `
    }

    // 🔍 Phase 1: 진단 오버레이 제거
    removeDiagnosticsOverlay() {
        if (this.diagnosticsOverlay) {
            this.diagnosticsOverlay.remove()
            this.diagnosticsOverlay = null
        }
    }

    async startGame() {
        console.log('🎮 GameEngine.startGame() called')

        this.state.round = 1
        this.state.score = 0
        this.state.history = []
        this.state.isPlaying = true
        this.state.startTime = Date.now()
        this.state.totalFocusTime = 0

        // Initialize audio on first user interaction
        audioManager.init()

        // 🎵 배경음악: 노말모드 음악 재생 시작
        musicManager.playNormalMusic()

        // Deduct Coin (optimistic update)
        const currentCoins = store.getState().coins
        const user = store.getState().user

        console.log('🔍 User check:', { isGuest: user?.isGuest, coins: currentCoins })

        if (!user.isGuest) {
            store.setState({ coins: currentCoins - 1 })

            // Sync with server
            const success = await dataService.deductCoins(user.id, 1)
            if (!success) {
                console.error('❌ Failed to deduct coins from server')
                // Rollback optimistic update
                store.setState({ coins: currentCoins })
                alert('코인 차감 실패 - 메인으로 돌아갑니다')
                return
            }
            console.log('✅ Coins deducted successfully')
        } else {
            console.log('👤 Guest user - skipping coin deduction')
        }

        // 🔍 Phase 1: 진단 오버레이 생성
        this.createDiagnosticsOverlay()

        console.log('🎮 Starting nextRound()')
        this.nextRound()
    }

    nextRound() {
        if (!this.state.isPlaying) return

        // 1. Calculate Difficulty
        const prevTimeLimit = this.state.timeLimit
        this.state.timeLimit = LEVELS.calcTimeLimit(this.state.round)
        this.state.timeLeft = this.state.timeLimit

        // Check for Difficulty Tier Change (Specific User Logic)
        // 5s~4s range: Round 1 (No intermission for 5->4)
        // < 4s: Round 2
        // < 3s: Round 3
        // 2s: Final Round

        let showIntermission = false
        let label = ''
        let subLabel = ''

        if (this.state.round === 1) {
            showIntermission = true
            label = 'Phase 1'
            subLabel = 'Start!'
        } else if (prevTimeLimit >= 4 && this.state.timeLimit < 4) {
            showIntermission = true
            label = 'Phase 2'
            subLabel = 'Speed Up!'
        } else if (prevTimeLimit >= 3 && this.state.timeLimit < 3) {
            showIntermission = true
            label = 'Phase 3'
            subLabel = 'Hurry Up!'
        } else if (prevTimeLimit > 2 && this.state.timeLimit <= 2) {
            showIntermission = true
            label = 'Final Phase'
            subLabel = 'Maximum Speed'
        }

        if (showIntermission) {
            this.showIntermission(label, subLabel, () => {
                this.proceedToRound()
            })
            // Update header while waiting
            if (this.onRoundUpdate) {
                this.onRoundUpdate({
                    round: this.state.round,
                    maxTime: this.state.timeLimit
                })
            }
        } else {
            this.proceedToRound()
        }
    }

    proceedToRound() {
        // 🔒 라운드 시작 전 게임 루프 확실히 정리
        if (this.animationId) {
            cancelAnimationFrame(this.animationId)
            this.animationId = null
        }

        // 타이머 퍼센트 초기화
        this.lastTimerPercent = 100

        // 2. Select Game
        const GameClass = this.selectGame()
        if (!GameClass) {
            console.error('No game available')
            return
        }

        // Calculate current Round Tier based on time limit
        let roundTier = 1
        if (this.state.timeLimit < 3) {
            roundTier = 3
        } else if (this.state.timeLimit < 4) {
            roundTier = 2
        }

        // 3. Setup Game UI with fade animation
        // 🎮 페이드아웃 (RAF로 최적화 - CSS transition과 동기화)
        this.container.style.transition = 'opacity 0.15s' // 200ms → 150ms
        this.container.style.opacity = '0'

        // 🎮 게임 전환을 RAF로 최적화 (setTimeout 대신)
        requestAnimationFrame(() => {
            setTimeout(() => {
                this.container.innerHTML = ''
                this.state.currentGameInstance = new GameClass(this.container, {
                    difficulty: this.state.round,
                    roundTier: roundTier, // Pass round tier to game
                    onCorrect: () => this.handleCorrect(),
                    onWrong: () => this.handleWrong()
                })

                // 4. Render & Start Timer
                this.state.currentGameInstance.render()

                // 🎮 페이드인 (즉시)
                requestAnimationFrame(() => {
                    this.container.style.opacity = '1'
                })

                this.startTimer()

                // Update View
                if (this.onRoundUpdate) {
                    this.onRoundUpdate({
                        round: this.state.round,
                        maxTime: this.state.timeLimit
                    })
                }
            }, 150) // 200ms → 150ms
        })
    }

    showIntermission(label, subLabel, callback) {
        // 🔊 1-6: Phase 진입 효과음 (2초만 재생)
        audioManager.playPhaseEnter();

        // Phase별 별 개수 결정
        let stars = '★☆☆'
        if (label === 'Phase 2') stars = '★★☆'
        else if (label === 'Phase 3') stars = '★★★'
        else if (label === 'Final Phase') stars = '★★★'

        // 애니메이션 스타일 추가 (한 번만)
        if (!document.getElementById('phase-splash-animations')) {
            const style = document.createElement('style')
            style.id = 'phase-splash-animations'
            style.textContent = `
                @keyframes phaseToastUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes phaseFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes starPop {
                    0% {
                        opacity: 0;
                        transform: scale(0) rotate(-180deg);
                    }
                    60% {
                        transform: scale(1.3) rotate(20deg);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) rotate(0deg);
                    }
                }

                .phase-text {
                    animation: phaseToastUp 0.8s ease-out forwards;
                    opacity: 0;
                }

                .star-container {
                    display: inline-flex;
                    gap: 8px;
                    font-size: 2rem;
                    margin-top: 16px;
                }

                .star {
                    display: inline-block;
                    animation: starPop 0.5s ease-out forwards;
                    opacity: 0;
                }

                .star:nth-child(1) { animation-delay: 0.8s; }
                .star:nth-child(2) { animation-delay: 1.0s; }
                .star:nth-child(3) { animation-delay: 1.2s; }

                .star.filled {
                    color: #ffd700;
                    text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
                }

                .star.empty {
                    color: rgba(255, 255, 255, 0.3);
                }
            `
            document.head.appendChild(style)
        }

        // 별 HTML 생성
        const starElements = stars.split('').map((star, idx) => {
            const isFilled = star === '★'
            return `<span class="star ${isFilled ? 'filled' : 'empty'}">${star}</span>`
        }).join('')

        this.container.innerHTML = `
            <div style="
                flex:1;
                display:flex;
                flex-direction:column;
                justify-content:center;
                align-items:center;
                background:rgba(0,0,0,0.8);
                color:#fff;
                animation: phaseFadeIn 1.5s ease-out;
            ">
                <h2 class="phase-text" style="
                    font-size:3rem;
                    margin-bottom:1rem;
                    color:var(--theme-accent);
                    transition: color var(--theme-transition);
                    animation-delay: 0.2s;
                ">${label}</h2>
                <div class="phase-text" style="
                    font-size:1.5rem;
                    color:#fff;
                    animation-delay: 0.4s;
                ">${subLabel}</div>
                <div class="star-container">
                    ${starElements}
                </div>
            </div>
        `
        setTimeout(callback, 2500)
    }

    selectGame() {
        // Constraint: No same game type within MIN_GAP_SAME_TYPE (3)
        // Constraint: No same specific game config (handled inside game?)

        // Simple random for now with history check
        let candidates = GAME_KEYS.filter(key => {
            const lastIdx = this.state.history.lastIndexOf(key)
            if (lastIdx === -1) return true
            const distance = this.state.history.length - lastIdx
            return distance >= CONFIG.MIN_GAP_SAME_TYPE
        })

        if (candidates.length === 0) {
            // Relax constraint: 2 (최소 2칸 간격)
            candidates = GAME_KEYS.filter(key => {
                const lastIdx = this.state.history.lastIndexOf(key)
                if (lastIdx === -1) return true
                const distance = this.state.history.length - lastIdx
                return distance >= 2
            })
        }

        if (candidates.length === 0) {
            // Final fallback: 최소 1칸 간격
            candidates = GAME_KEYS.filter(key => {
                const lastIdx = this.state.history.lastIndexOf(key)
                if (lastIdx === -1) return true
                const distance = this.state.history.length - lastIdx
                return distance >= 1
            })
        }

        if (candidates.length === 0) candidates = GAME_KEYS // Ultimate fallback

        const selectedKey = candidates[Math.floor(Math.random() * candidates.length)]
        this.state.history.push(selectedKey)

        return GAMES[selectedKey]
    }

    startTimer() {
        // 🔒 안전하게 기존 애니메이션 정리
        if (this.animationId) {
            cancelAnimationFrame(this.animationId)
            this.animationId = null
        }

        // 🎮 RAF 기반 게임 루프 시작
        this.lastUpdateTime = performance.now()
        this.gameLoop(this.lastUpdateTime)
    }

    // 🎮 RAF 기반 게임 루프 (60fps)
    gameLoop(currentTime) {
        if (!this.state.isPlaying) {
            this.animationId = null
            return
        }

        // Delta time 계산 (초 단위)
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000
        this.lastUpdateTime = currentTime

        // 게임 상태 업데이트
        this.update(deltaTime)

        // UI 렌더링 (배치 처리)
        this.render()

        // 다음 프레임 스케줄
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time))
    }

    // 🔄 게임 상태 업데이트 (로직만)
    update(deltaTime) {
        // 시간 감소
        this.state.timeLeft -= deltaTime

        // 게임오버 체크
        if (this.state.timeLeft <= 0) {
            this.state.timeLeft = 0
            this.handleGameOver("Time's up")
        }
    }

    // 🎨 렌더링 (DOM 업데이트만)
    render() {
        // 타이머 UI 업데이트 (변화가 있을 때만)
        if (this.onTimerTick) {
            const pct = (this.state.timeLeft / this.state.timeLimit) * 100

            // 0.5% 이상 변화가 있을 때만 업데이트 (성능 최적화)
            if (Math.abs(pct - this.lastTimerPercent) > 0.5) {
                this.onTimerTick(this.state.timeLeft, this.state.timeLimit)
                this.lastTimerPercent = pct
            }
        }
    }

    handleCorrect() {
        // 🔍 Phase 1: 실행 시간 측정 시작
        const startTime = performance.now()
        this.diagnostics.handleCorrectCount++

        // 🔒 안전하게 게임 루프 정리
        if (this.animationId) {
            cancelAnimationFrame(this.animationId)
            this.animationId = null
        }

        // Play correct sound effect
        audioManager.playCorrect()

        // 콤보 체크: 단계별 기준 (쉬운 난이도로 조정)
        const timePercent = (this.state.timeLeft / this.state.timeLimit) * 100

        // 현재 콤보에 따른 필요 시간 계산
        let requiredPercent = 15  // 1-4 콤보: 15%
        if (this.state.combo >= 10) {
            requiredPercent = 35  // 10+ 콤보: 35%
        } else if (this.state.combo >= 5) {
            requiredPercent = 25  // 5-10 콤보: 25%
        }

        if (timePercent >= requiredPercent) {
            this.state.combo++  // 기준 달성: 콤보 증가
        } else {
            this.state.combo = 0  // 기준 미달: 콤보 리셋
            this.removeFocusGlow()  // 콤보 리셋 시 focus glow 제거
        }

        // 콤보가 10 미만으로 떨어지면 focus glow 제거
        if (this.state.combo < 10) {
            this.removeFocusGlow()
        }

        // 🎮 시각 효과를 RAF로 지연 (클릭 반응속도 최적화)
        // 브라우저가 클릭 이벤트를 먼저 처리하게 함
        requestAnimationFrame(() => {
            // 🎮 Geometry Dash Style: 화면 진동 (콤보별 강도)
            this.screenShake()

            // 🎮 Geometry Dash Style: 충격파 이펙트
            this.createShockwave()

            // FX: Correct - Show visual feedback
            this.showCorrectFeedback()

            // 콤보가 2 이상이면 콤보 표시 (체크마크와 겹치지 않게 약간 딜레이)
            if (this.state.combo >= 2) {
                setTimeout(() => {
                    this.showComboFeedback()
                }, 200)
            }
        })

        // 🔍 Phase 1: 실행 시간 측정 종료
        const endTime = performance.now()
        const executionTime = endTime - startTime

        // 통계 업데이트
        this.diagnostics.lastExecutionTime = executionTime
        if (executionTime > this.diagnostics.maxExecutionTime) {
            this.diagnostics.maxExecutionTime = executionTime
        }
        this.diagnostics.avgExecutionTime =
            (this.diagnostics.avgExecutionTime * (this.diagnostics.handleCorrectCount - 1) + executionTime) /
            this.diagnostics.handleCorrectCount

        console.log(`🔍 handleCorrect #${this.diagnostics.handleCorrectCount}: ${executionTime.toFixed(2)}ms | Confetti: ${this.diagnostics.confettiCreated - this.diagnostics.confettiRemoved} active | Shockwave: ${this.diagnostics.shockwaveCreated - this.diagnostics.shockwaveRemoved} active`)

        // 🔍 Phase 1: 화면 오버레이 업데이트
        this.updateDiagnosticsOverlay()

        setTimeout(() => {
            this.state.round++
            // Logic for max round?
            if (this.state.round > CONFIG.MAX_ROUND) {
                this.handleGameOver("Completed")
                return
            }
            this.nextRound()
        }, 500)
    }

    showCorrectFeedback() {
        // Create confetti/celebration overlay
        const feedback = document.createElement('div')
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 4rem;
            font-weight: bold;
            color: var(--color-success);
            text-shadow: 0 0 20px rgba(105, 240, 174, 0.8);
            z-index: 1000;
            animation: correctPulse 0.5s ease-out;
            pointer-events: none;
        `
        feedback.innerText = '✓'
        document.body.appendChild(feedback)

        // 🎮 Geometry Dash Style: 콤보별 파티클 개수 증가 (성능 레벨에 따라 조절)
        let maxParticles = 40
        if (this.performanceLevel === 'low') {
            maxParticles = 10 // 모바일: 75% 감소
        } else if (this.performanceLevel === 'medium') {
            maxParticles = 20 // 중간: 50% 감소
        }

        const particleCount = Math.min(15 + this.state.combo * 2, maxParticles)
        for (let i = 0; i < particleCount; i++) {
            this.createConfetti()
        }

        // 🎮 Geometry Dash Style: 콤보별 배경 플래시 색상 변화
        const originalBg = document.body.style.backgroundColor
        let flashColor = 'rgba(76, 175, 80, 0.3)' // 기본 초록 (1-5 콤보)

        if (this.state.combo >= 16) {
            flashColor = 'rgba(255, 215, 0, 0.4)' // 금색 (16+ 콤보)
        } else if (this.state.combo >= 11) {
            flashColor = 'rgba(156, 39, 176, 0.4)' // 보라 (11-15 콤보)
        } else if (this.state.combo >= 6) {
            flashColor = 'rgba(33, 150, 243, 0.3)' // 파랑 (6-10 콤보)
        }

        document.body.style.backgroundColor = flashColor

        setTimeout(() => {
            document.body.style.backgroundColor = originalBg
            feedback.remove()
        }, 500)
    }

    createConfetti() {
        // 🔍 Phase 1: 생성 카운팅
        this.diagnostics.confettiCreated++

        const confetti = document.createElement('div')

        // 🎮 Geometry Dash Style: 네온 색상 팔레트
        const colors = ['#00f5ff', '#ff00ff', '#ffff00', '#00ff88', '#ff1744', '#7c4dff']
        const color = colors[Math.floor(Math.random() * colors.length)]
        const size = Math.random() * 10 + 5 // 크기 증가 (4-12px → 5-15px)

        // 중앙에서 사방으로 폭발하는 방향성
        const startX = window.innerWidth / 2
        const startY = window.innerHeight / 2
        const angle = Math.random() * Math.PI * 2 // 360도 랜덤 각도
        const distance = 200 + Math.random() * 300 // 폭발 거리 증가
        const endX = startX + Math.cos(angle) * distance
        const endY = startY + Math.sin(angle) * distance

        // 📱 성능 최적화: 저사양 디바이스에서는 box-shadow 제거
        const boxShadow = this.performanceLevel === 'low' ? 'none' : `0 0 ${size * 2}px ${color}`

        confetti.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border-radius: 50%;
            box-shadow: ${boxShadow};
            z-index: 999;
            pointer-events: none;
            will-change: transform, opacity;
        `
        document.body.appendChild(confetti)

        // 🎮 Geometry Dash Style: 속도 증가 (800ms → 500ms)
        const animation = confetti.animate([
            { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
            { transform: `translate(${endX - startX}px, ${endY - startY}px) rotate(${Math.random() * 720}deg) scale(0)`, opacity: 0 }
        ], {
            duration: 500,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' // 더 자연스러운 easing
        })

        // 📱 애니메이션 완료 후 정리
        animation.onfinish = () => {
            // 🔍 Phase 1: 제거 카운팅
            this.diagnostics.confettiRemoved++
            confetti.remove()
        }
    }

    handleWrong() {
        // 🔊 1-13: 오답 효과음
        audioManager.playIncorrect();

        // FX: Wrong (Shake?)
        // Time penalty or just retry? Plan says "Retry within time limit"
    }

    showComboFeedback() {
        // 기존 콤보 텍스트가 있으면 즉시 제거 (새로운 콤보로 덮어씌우기)
        const existingCombo = document.getElementById('combo-text')
        if (existingCombo) {
            existingCombo.remove()
        }

        const comboText = document.createElement('div')
        comboText.id = 'combo-text'

        // 콤보 수치에 따른 색상, Scale, Glow
        let color = ''
        let glow = ''
        let baseScale = 1.0
        let rotation = 0

        if (this.state.combo >= 11) {
            // 11+ 콤보: 형광색 + Glow + 큰 크기 + 랜덤 각도
            color = '#00ff88' // 네온 그린
            glow = '0 0 20px rgba(0, 255, 136, 0.8), 0 0 40px rgba(0, 255, 136, 0.4)'
            baseScale = 1.4
            rotation = (Math.random() - 0.5) * 20 // -10도 ~ 10도
        } else if (this.state.combo >= 5) {
            // 5~10 콤보: 노란색 + 중간 크기
            color = '#ffeb3b' // 밝은 노란색
            glow = '0 0 10px rgba(255, 235, 59, 0.3)'
            baseScale = 1.2
        } else {
            // 1~4 콤보: 흰색 + 기본 크기
            color = '#ffffff'
            glow = 'none'
            baseScale = 1.0
        }

        comboText.style.cssText = `
            position: fixed;
            top: 15%;
            left: 50%;
            transform: translate(-50%, -50%) scale(${baseScale}) rotate(${rotation}deg);
            font-family: 'Electrical Safety', sans-serif;
            font-size: 1.6rem;
            font-weight: bold;
            color: ${color};
            text-shadow: ${glow};
            z-index: 1001;
            pointer-events: none;
            letter-spacing: 1px;
            opacity: 0;
        `
        comboText.innerText = `${this.state.combo} combo`
        document.body.appendChild(comboText)

        // 등장 애니메이션 (타격감)
        const entranceScale = baseScale * 1.3 // 오버슈트
        comboText.animate([
            {
                opacity: 0,
                transform: `translate(-50%, -50%) scale(${baseScale * 0.5}) rotate(${rotation}deg)`
            },
            {
                opacity: 1,
                transform: `translate(-50%, -50%) scale(${entranceScale}) rotate(${rotation}deg)`
            },
            {
                opacity: 1,
                transform: `translate(-50%, -50%) scale(${baseScale}) rotate(${rotation}deg)`
            }
        ], {
            duration: 150, // 0.15초
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' // Back Out
        })

        // 퇴장 애니메이션 (잔상 + Float)
        setTimeout(() => {
            comboText.animate([
                {
                    opacity: 1,
                    transform: `translate(-50%, -50%) scale(${baseScale}) rotate(${rotation}deg)`
                },
                {
                    opacity: 0,
                    transform: `translate(-50%, -80%) scale(${baseScale * 1.1}) rotate(${rotation}deg)`
                }
            ], {
                duration: 600, // 0.6초
                easing: 'ease-out',
                fill: 'forwards'
            })

            setTimeout(() => comboText.remove(), 600)
        }, 150) // 등장 애니메이션 후 바로 퇴장 시작

        // CSS 애니메이션 추가 (한 번만)
        if (!document.getElementById('combo-style')) {
            const style = document.createElement('style')
            style.id = 'combo-style'
            style.textContent = `
                @font-face {
                    font-family: 'Electrical Safety';
                    src: url('/font/전기안전체_ttf/Electrical Safety Bold.ttf') format('truetype');
                    font-weight: bold;
                    font-style: normal;
                }

                @font-face {
                    font-family: 'Electrical Safety';
                    src: url('/font/전기안전체_ttf/Electrical Safety Regular.ttf') format('truetype');
                    font-weight: normal;
                    font-style: normal;
                }

                @keyframes focusGlowNeon {
                    0%, 100% {
                        box-shadow: inset 0 0 40px var(--neon-color-1),
                                    inset 0 0 80px var(--neon-color-2),
                                    inset 0 0 120px var(--neon-color-3),
                                    0 0 20px var(--neon-color-1),
                                    0 0 40px var(--neon-color-2);
                    }
                    50% {
                        box-shadow: inset 0 0 60px var(--neon-color-1),
                                    inset 0 0 120px var(--neon-color-2),
                                    inset 0 0 180px var(--neon-color-3),
                                    0 0 40px var(--neon-color-1),
                                    0 0 80px var(--neon-color-2);
                    }
                }

                @keyframes gradientShift {
                    0%, 100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }

                @keyframes feverPulse {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1.05);
                        opacity: 0.9;
                    }
                }

                @keyframes feverTextGlow {
                    0%, 100% {
                        text-shadow: 0 0 10px rgba(255, 215, 0, 0.8),
                                     0 0 20px rgba(255, 215, 0, 0.6),
                                     0 0 30px rgba(255, 215, 0, 0.4);
                    }
                    50% {
                        text-shadow: 0 0 20px rgba(255, 215, 0, 1),
                                     0 0 40px rgba(255, 215, 0, 0.8),
                                     0 0 60px rgba(255, 215, 0, 0.6);
                    }
                }

                .focus-glow-border {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 999;
                    animation: focusGlowNeon 1s ease-in-out infinite;
                    transition: opacity 0.5s ease-out;
                }

                .focus-glow-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 998;
                    background: linear-gradient(45deg,
                        rgba(0, 217, 255, 0.05),
                        rgba(124, 77, 255, 0.05),
                        rgba(255, 215, 0, 0.05));
                    background-size: 400% 400%;
                    animation: gradientShift 8s ease infinite;
                    transition: opacity 0.5s ease-out;
                }

                .fever-text {
                    position: fixed;
                    top: 8%;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 1.8rem;
                    font-weight: bold;
                    color: #ffd700;
                    z-index: 1000;
                    pointer-events: none;
                    letter-spacing: 3px;
                    animation: feverPulse 1.5s ease-in-out infinite, feverTextGlow 2s ease-in-out infinite;
                    transition: opacity 0.5s ease-out;
                }
            `
            document.head.appendChild(style)
        }

        setTimeout(() => comboText.remove(), 500)
    }

    showFocusGlow() {
        // 이미 있으면 제거하고 새로 생성
        this.removeFocusGlow()

        // 🎮 Geometry Dash Style: 콤보별 네온 색상
        let color1, color2, color3
        if (this.state.combo >= 16) {
            // 16+ 콤보: 옐로우 네온
            color1 = 'rgba(255, 255, 0, 0.8)'
            color2 = 'rgba(255, 215, 0, 0.6)'
            color3 = 'rgba(255, 193, 7, 0.4)'
        } else if (this.state.combo >= 13) {
            // 13-15 콤보: 마젠타 네온
            color1 = 'rgba(255, 0, 255, 0.8)'
            color2 = 'rgba(236, 64, 122, 0.6)'
            color3 = 'rgba(156, 39, 176, 0.4)'
        } else {
            // 10-12 콤보: 시안 네온
            color1 = 'rgba(0, 245, 255, 0.8)'
            color2 = 'rgba(0, 217, 255, 0.6)'
            color3 = 'rgba(33, 150, 243, 0.4)'
        }

        // Glow Border (테두리만 유지, 오버레이 제거)
        const glowBorder = document.createElement('div')
        glowBorder.id = 'focus-glow-border'
        glowBorder.className = 'focus-glow-border'
        glowBorder.style.setProperty('--neon-color-1', color1)
        glowBorder.style.setProperty('--neon-color-2', color2)
        glowBorder.style.setProperty('--neon-color-3', color3)
        document.body.appendChild(glowBorder)

        // 📱 파티클 효과 (성능 레벨에 따라 조절)
        // 저사양 디바이스에서는 Fever 파티클 비활성화 또는 주기 늘리기
        let particleInterval = 200
        if (this.performanceLevel === 'low') {
            particleInterval = 0 // 모바일에서는 Fever 파티클 비활성화
        } else if (this.performanceLevel === 'medium') {
            particleInterval = 600 // 중간 디바이스: 느리게
        }

        if (particleInterval > 0) {
            // 🔍 Phase 1: interval 중복 방지
            if (this.feverParticleInterval) {
                console.warn('⚠️ feverParticleInterval 중복 생성 방지!')
                clearInterval(this.feverParticleInterval)
                this.feverParticleInterval = null
            }

            this.feverParticleInterval = setInterval(() => {
                if (this.state.combo >= 10) {
                    this.createFeverParticle()
                }
            }, particleInterval)

            // 🔍 Phase 1: interval 추적
            this.diagnostics.intervalIds.add(this.feverParticleInterval)
        }

        // 10콤보 미만으로 떨어지면 제거하기 위해 참조 저장
        this.focusGlowElements = [glowBorder]
    }

    removeFocusGlow() {
        // 파티클 생성 중지
        if (this.feverParticleInterval) {
            clearInterval(this.feverParticleInterval)
            // 🔍 Phase 1: interval 추적 제거
            this.diagnostics.intervalIds.delete(this.feverParticleInterval)
            this.feverParticleInterval = null
        }

        // 페이드아웃 효과
        if (this.focusGlowElements && this.focusGlowElements.length > 0) {
            this.focusGlowElements.forEach(element => {
                if (element && element.style) {
                    element.style.opacity = '0'
                    setTimeout(() => element.remove(), 500)
                }
            })
            this.focusGlowElements = null
        }

        // Legacy 호환성 (기존 코드)
        if (this.focusGlowElement) {
            this.focusGlowElement.style.opacity = '0'
            setTimeout(() => this.focusGlowElement.remove(), 500)
            this.focusGlowElement = null
        }
    }

    createFeverParticle() {
        const particle = document.createElement('div')
        const side = Math.floor(Math.random() * 4) // 0: top, 1: right, 2: bottom, 3: left
        let startX, startY, endX, endY

        const margin = 20
        const distance = 50 + Math.random() * 100

        switch (side) {
            case 0: // top
                startX = Math.random() * window.innerWidth
                startY = margin
                endX = startX + (Math.random() - 0.5) * 100
                endY = startY + distance
                break
            case 1: // right
                startX = window.innerWidth - margin
                startY = Math.random() * window.innerHeight
                endX = startX - distance
                endY = startY + (Math.random() - 0.5) * 100
                break
            case 2: // bottom
                startX = Math.random() * window.innerWidth
                startY = window.innerHeight - margin
                endX = startX + (Math.random() - 0.5) * 100
                endY = startY - distance
                break
            case 3: // left
                startX = margin
                startY = Math.random() * window.innerHeight
                endX = startX + distance
                endY = startY + (Math.random() - 0.5) * 100
                break
        }

        const colors = ['rgba(0, 217, 255, 0.6)', 'rgba(124, 77, 255, 0.6)', 'rgba(255, 215, 0, 0.6)']
        const color = colors[Math.floor(Math.random() * colors.length)]
        const size = 4 + Math.random() * 6

        // 📱 성능 최적화: box-shadow 제거 (GPU 부하 큼)
        particle.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            z-index: 997;
            pointer-events: none;
            will-change: transform, opacity;
        `
        document.body.appendChild(particle)

        // 📱 애니메이션 완료 후 확실히 정리
        const animation = particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0)`, opacity: 0 }
        ], {
            duration: 1500,
            easing: 'ease-out'
        })

        animation.onfinish = () => {
            particle.remove()
        }
    }

    createComboParticle(color) {
        const particle = document.createElement('div')
        const startX = window.innerWidth / 2
        const startY = window.innerHeight * 0.15
        const angle = Math.random() * Math.PI * 2
        const distance = 50 + Math.random() * 50
        const endX = startX + Math.cos(angle) * distance
        const endY = startY + Math.sin(angle) * distance

        particle.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            width: 6px;
            height: 6px;
            background-color: ${color};
            border-radius: 50%;
            z-index: 1000;
            pointer-events: none;
        `
        document.body.appendChild(particle)

        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0)`, opacity: 0 }
        ], {
            duration: 500,
            easing: 'ease-out'
        })

        setTimeout(() => particle.remove(), 500)
    }

    checkNewRecord() {
        const user = store.getState().user
        if (!user || user.isGuest) return

        const isHardMode = store.getState().isHardMode || false
        const currentRound = this.state.round

        // Get max round for current mode
        const maxRound = isHardMode
            ? (user.max_round_hard || 0)
            : (user.max_round_normal || 0)

        // Check if this is a new record
        if (currentRound > maxRound) {
            setTimeout(() => {
                this.showNewRecordBanner(currentRound)
            }, 700)
        }
    }

    showNewRecordBanner(round) {
        const banner = document.createElement('div')
        banner.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #1e1e1e;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 1.5rem;
            font-weight: bold;
            box-shadow: 0 8px 24px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.3);
            z-index: 1001;
            pointer-events: none;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        `
        banner.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 0.9rem; margin-bottom: 4px;">🏆 NEW RECORD 🏆</div>
                <div style="font-size: 1.8rem;">${round} 라운드</div>
            </div>
        `
        document.body.appendChild(banner)

        // Slide in animation
        requestAnimationFrame(() => {
            banner.style.opacity = '1'
            banner.style.transform = 'translateX(-50%) translateY(0)'
        })

        // Extra confetti for new record
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                this.createConfetti()
            }, i * 20)
        }

        // Slide out and remove
        setTimeout(() => {
            banner.style.transform = 'translateX(-50%) translateY(-100px)'
            banner.style.opacity = '0'
            setTimeout(() => banner.remove(), 400)
        }, 2000)
    }

    showMilestoneEffect(round, type) {
        const isMajor = type === 'major' // 10, 20, 30...
        const banner = document.createElement('div')

        if (isMajor) {
            // Major milestone: 화면 플래시 + 폭죽 효과
            banner.style.cssText = `
                position: fixed;
                top: 30%;
                left: 50%;
                transform: translateX(-50%) scale(0.5);
                background: linear-gradient(135deg, var(--theme-accent) 0%, var(--primary-900) 100%);
                color: white;
                padding: 24px 48px;
                border-radius: 16px;
                font-size: 2rem;
                font-weight: bold;
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), 0 0 60px rgba(124, 77, 255, 0.4);
                z-index: 1001;
                pointer-events: none;
                opacity: 0;
                transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            `
            banner.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 8px;">🎉</div>
                    <div style="font-size: 2.5rem; margin-bottom: 4px;">Round ${round}!</div>
                    <div style="font-size: 1.2rem; opacity: 0.9;">Amazing!</div>
                </div>
            `

            // Flash effect
            const flash = document.createElement('div')
            flash.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--theme-accent);
                opacity: 0;
                z-index: 1000;
                pointer-events: none;
                transition: opacity 0.3s;
            `
            document.body.appendChild(flash)

            requestAnimationFrame(() => {
                flash.style.opacity = '0.3'
                setTimeout(() => {
                    flash.style.opacity = '0'
                    setTimeout(() => flash.remove(), 300)
                }, 200)
            })

            // Firework confetti (80 particles)
            for (let i = 0; i < 80; i++) {
                setTimeout(() => {
                    this.createConfetti()
                }, i * 15)
            }
        } else {
            // Minor milestone: "Good Job!" 미니 팝업
            banner.style.cssText = `
                position: fixed;
                top: 35%;
                left: 50%;
                transform: translateX(-50%) translateY(30px);
                background: rgba(76, 175, 80, 0.95);
                color: white;
                padding: 16px 32px;
                border-radius: 12px;
                font-size: 1.5rem;
                font-weight: bold;
                box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4);
                z-index: 1001;
                pointer-events: none;
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            `
            banner.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 1rem; margin-bottom: 4px;">Round ${round}</div>
                    <div style="font-size: 1.8rem;">Good Job! 👍</div>
                </div>
            `

            // Small confetti burst
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    this.createConfetti()
                }, i * 25)
            }
        }

        document.body.appendChild(banner)

        // Slide in animation
        requestAnimationFrame(() => {
            banner.style.opacity = '1'
            banner.style.transform = 'translateX(-50%) scale(1)'
        })

        // Slide out and remove
        const displayDuration = isMajor ? 2000 : 1500
        setTimeout(() => {
            banner.style.opacity = '0'
            banner.style.transform = isMajor
                ? 'translateX(-50%) scale(1.2)'
                : 'translateX(-50%) translateY(-30px)'
            setTimeout(() => banner.remove(), 400)
        }, displayDuration)
    }

    // 🎮 Geometry Dash Style: 화면 진동 (Screen Shake) - RAF 기반
    screenShake() {
        // 🔍 Phase 1: RAF 중복 실행 체크
        if (this.diagnostics.rafShakeActive) {
            console.warn('⚠️ screenShake RAF 중복 실행 감지!')
        }
        this.diagnostics.rafShakeActive = true

        // 기존 shake가 있으면 취소
        if (this.shakeRafId) {
            cancelAnimationFrame(this.shakeRafId)
            this.shakeRafId = null
        }

        // 콤보별 진동 강도 계산
        let intensity = 3 // 기본 (1-5 콤보)
        let duration = 80

        if (this.state.combo >= 16) {
            intensity = 12
            duration = 150
        } else if (this.state.combo >= 11) {
            intensity = 8
            duration = 120
        } else if (this.state.combo >= 6) {
            intensity = 5
            duration = 100
        }

        const container = this.container
        const originalTransform = container.style.transform || ''
        const startTime = performance.now()

        // RAF 기반 shake 애니메이션
        const shake = (currentTime) => {
            const elapsed = currentTime - startTime

            if (elapsed >= duration) {
                // 애니메이션 완료 - 원상복구
                container.style.transform = originalTransform
                // 🔍 Phase 1: RAF 완료 플래그
                this.diagnostics.rafShakeActive = false
                this.shakeRafId = null
                return
            }

            // 시간에 따라 강도 감소 (자연스러운 효과)
            const progress = elapsed / duration
            const currentIntensity = intensity * (1 - progress * 0.5) // 50% 감소

            // 랜덤 방향으로 진동 (translate3d로 GPU 가속)
            const x = (Math.random() - 0.5) * currentIntensity * 2
            const y = (Math.random() - 0.5) * currentIntensity * 2
            container.style.transform = `translate3d(${x}px, ${y}px, 0)`

            // 🔍 Phase 1: RAF ID 저장
            this.shakeRafId = requestAnimationFrame(shake)
        }

        this.shakeRafId = requestAnimationFrame(shake)
    }

    // 🎮 Geometry Dash Style: 충격파 이펙트 (Shockwave)
    createShockwave() {
        // 🔍 Phase 1: 생성 카운팅
        this.diagnostics.shockwaveCreated++

        const shockwave = document.createElement('div')

        // 콤보별 색상
        let color = '#00f5ff' // 시안 (1-5 콤보)
        if (this.state.combo >= 16) {
            color = '#ffff00' // 옐로우 (16+ 콤보)
        } else if (this.state.combo >= 11) {
            color = '#ff00ff' // 마젠타 (11-15 콤보)
        } else if (this.state.combo >= 6) {
            color = '#7c4dff' // 보라 (6-10 콤보)
        }

        shockwave.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 50px;
            height: 50px;
            border: 3px solid ${color};
            border-radius: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 20px ${color}, inset 0 0 20px ${color};
            z-index: 998;
            pointer-events: none;
        `
        document.body.appendChild(shockwave)

        // 충격파 확장 애니메이션
        shockwave.animate([
            {
                transform: 'translate(-50%, -50%) scale(1)',
                opacity: 0.8
            },
            {
                transform: 'translate(-50%, -50%) scale(8)',
                opacity: 0
            }
        ], {
            duration: 300,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        })

        setTimeout(() => {
            // 🔍 Phase 1: 제거 카운팅
            this.diagnostics.shockwaveRemoved++
            shockwave.remove()
        }, 300)
    }

    handleGameOver(reason) {
        this.state.isPlaying = false

        // 🔒 안전하게 게임 루프 정리
        if (this.animationId) {
            cancelAnimationFrame(this.animationId)
            this.animationId = null
        }

        console.log('Game Over:', reason)

        // 게임오버 시 Fever 효과 제거
        this.removeFocusGlow()

        // 🎵 배경음악 정지 (페이드아웃 2초)
        musicManager.stopWithFade(2.0)

        // Calculate XP
        const earnedXp = LEVELS.calcXpForRound(this.state.round)

        this.onGameOver({
            round: this.state.round,
            xp: earnedXp
        })
    }

    cleanup() {
        // 🔒 안전하게 게임 루프 정리
        if (this.animationId) {
            cancelAnimationFrame(this.animationId)
            this.animationId = null
        }

        // Fever 파티클 interval 정리
        if (this.feverParticleInterval) {
            clearInterval(this.feverParticleInterval)
            this.feverParticleInterval = null
        }

        // 🔍 Phase 1: screenShake RAF 정리
        if (this.shakeRafId) {
            cancelAnimationFrame(this.shakeRafId)
            this.shakeRafId = null
            this.diagnostics.rafShakeActive = false
        }

        this.removeFocusGlow()

        // 🎵 배경음악 정지
        musicManager.stopWithFade(0.5)

        // 🔍 Phase 1: 최종 진단 리포트
        console.log('🔍 GameEngine Cleanup - 최종 진단:')
        console.log(`   Confetti 누수: ${this.diagnostics.confettiCreated - this.diagnostics.confettiRemoved}개`)
        console.log(`   Shockwave 누수: ${this.diagnostics.shockwaveCreated - this.diagnostics.shockwaveRemoved}개`)
        console.log(`   Active Intervals: ${this.diagnostics.intervalIds.size}개`)
        console.log(`   Total handleCorrect calls: ${this.diagnostics.handleCorrectCount}회`)
        console.log(`   Max Execution Time: ${this.diagnostics.maxExecutionTime.toFixed(2)}ms`)
        console.log(`   Avg Execution Time: ${this.diagnostics.avgExecutionTime.toFixed(2)}ms`)

        // 🔍 Phase 1: 진단 오버레이 제거
        this.removeDiagnosticsOverlay()
    }
}
