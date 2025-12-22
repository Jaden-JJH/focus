
import { CONFIG, LEVELS } from '../config/gameConfig.js'
import { store } from './store.js'
import { dataService } from '../services/dataService.js'
import audioManager from '../utils/audioManager.js'

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

        this.timerId = null
    }

    async startGame() {
        this.state.round = 1
        this.state.score = 0
        this.state.history = []
        this.state.isPlaying = true
        this.state.startTime = Date.now()
        this.state.totalFocusTime = 0

        // Initialize audio on first user interaction
        audioManager.init()

        // Deduct Coin (optimistic update)
        const currentCoins = store.getState().coins
        store.setState({ coins: currentCoins - 1 })

        // Sync with server
        const user = store.getState().user
        if (user && !user.isGuest) {
            const success = await dataService.deductCoins(user.id, 1)
            if (!success) {
                console.error('Failed to deduct coins')
                // Rollback optimistic update
                store.setState({ coins: currentCoins })
                return
            }
        }

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
        // 페이드아웃
        this.container.style.transition = 'opacity 0.2s'
        this.container.style.opacity = '0'

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

            // 페이드인
            setTimeout(() => {
                this.container.style.opacity = '1'
            }, 50)

            this.startTimer()

            // Update View
            if (this.onRoundUpdate) {
                this.onRoundUpdate({
                    round: this.state.round,
                    maxTime: this.state.timeLimit
                })
            }
        }, 200)
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
        if (this.timerId) clearInterval(this.timerId)

        const tickRate = 100 // ms

        this.timerId = setInterval(() => {
            if (!this.state.isPlaying) {
                clearInterval(this.timerId)
                return
            }

            this.state.timeLeft -= (tickRate / 1000)

            // Update UI Timer Bar (via callback)
            if (this.onTimerTick) {
                this.onTimerTick(this.state.timeLeft, this.state.timeLimit)
            }

            if (this.state.timeLeft <= 0) {
                this.handleGameOver("Time's up")
            }
        }, tickRate)
    }

    handleCorrect() {
        clearInterval(this.timerId)

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

        // FX: Correct - Show visual feedback
        this.showCorrectFeedback()

        // 콤보가 2 이상이면 콤보 표시 (체크마크와 겹치지 않게 약간 딜레이)
        if (this.state.combo >= 2) {
            setTimeout(() => {
                this.showComboFeedback()
            }, 200)
        }

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

        // Create confetti particles
        for (let i = 0; i < 15; i++) {
            this.createConfetti()
        }

        // Flash background green
        const originalBg = document.body.style.backgroundColor
        document.body.style.backgroundColor = 'rgba(76, 175, 80, 0.2)'

        setTimeout(() => {
            document.body.style.backgroundColor = originalBg
            feedback.remove()
        }, 500)
    }

    createConfetti() {
        const confetti = document.createElement('div')
        const colors = ['#ffd740', '#69f0ae', '#7c4dff', '#ff5252', '#00bcd4']
        const color = colors[Math.floor(Math.random() * colors.length)]
        const size = Math.random() * 8 + 4
        const startX = Math.random() * window.innerWidth
        const startY = window.innerHeight / 2
        const endX = startX + (Math.random() - 0.5) * 300
        const endY = startY + Math.random() * 400

        confetti.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border-radius: 50%;
            z-index: 999;
            pointer-events: none;
            animation: confettiFall 0.8s ease-out forwards;
            --end-x: ${endX}px;
            --end-y: ${endY}px;
        `
        document.body.appendChild(confetti)

        // Animate using transform
        confetti.animate([
            { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${endX - startX}px, ${endY - startY}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], {
            duration: 800,
            easing: 'ease-out'
        })

        setTimeout(() => confetti.remove(), 800)
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

                @keyframes focusGlow {
                    0%, 100% {
                        box-shadow: inset 0 0 30px rgba(0, 217, 255, 0.4),
                                    inset 0 0 60px rgba(0, 217, 255, 0.2),
                                    inset 0 0 100px rgba(0, 217, 255, 0.1);
                    }
                    50% {
                        box-shadow: inset 0 0 50px rgba(0, 217, 255, 0.6),
                                    inset 0 0 100px rgba(0, 217, 255, 0.3),
                                    inset 0 0 150px rgba(0, 217, 255, 0.15);
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
                    animation: focusGlow 2s ease-in-out infinite;
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

        // 10콤보 이상: 집중력의 경지 효과 (은은한 푸른 테두리)
        if (this.state.combo >= 10) {
            this.showFocusGlow()
        }

        setTimeout(() => comboText.remove(), 500)
    }

    showFocusGlow() {
        // 이미 있으면 제거하고 새로 생성
        this.removeFocusGlow()

        // Glow Border
        const glowBorder = document.createElement('div')
        glowBorder.id = 'focus-glow-border'
        glowBorder.className = 'focus-glow-border'
        document.body.appendChild(glowBorder)

        // Gradient Overlay
        const glowOverlay = document.createElement('div')
        glowOverlay.id = 'focus-glow-overlay'
        glowOverlay.className = 'focus-glow-overlay'
        document.body.appendChild(glowOverlay)

        // FEVER TIME! Text (제거됨 - 파티클과 Glow 효과만 유지)

        // 파티클 효과 (주기적으로 생성)
        this.feverParticleInterval = setInterval(() => {
            if (this.state.combo >= 10) {
                this.createFeverParticle()
            }
        }, 300)

        // 10콤보 미만으로 떨어지면 제거하기 위해 참조 저장
        this.focusGlowElements = [glowBorder, glowOverlay]
    }

    removeFocusGlow() {
        // 파티클 생성 중지
        if (this.feverParticleInterval) {
            clearInterval(this.feverParticleInterval)
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
            box-shadow: 0 0 10px ${color};
        `
        document.body.appendChild(particle)

        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0)`, opacity: 0 }
        ], {
            duration: 1500,
            easing: 'ease-out'
        })

        setTimeout(() => particle.remove(), 1500)
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

    handleGameOver(reason) {
        this.state.isPlaying = false
        clearInterval(this.timerId)
        console.log('Game Over:', reason)

        // 게임오버 시 Fever 효과 제거
        this.removeFocusGlow()

        // Calculate XP
        const earnedXp = LEVELS.calcXpForRound(this.state.round)

        this.onGameOver({
            round: this.state.round,
            xp: earnedXp
        })
    }

    cleanup() {
        clearInterval(this.timerId)
        this.removeFocusGlow()
    }
}
