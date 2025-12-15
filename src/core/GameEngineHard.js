
import { CONFIG, LEVELS } from '../config/gameConfig.js'
import { store } from './store.js'
import { dataService } from '../services/dataService.js'

// Import games
// 기존 5개 게임
import { ShapeMatch } from '../games/ShapeMatch.js'
import { WordSearch } from '../games/WordSearch.js'
import { NumberOrder } from '../games/NumberOrder.js'
import { StroopTest } from '../games/StroopTest.js'
import { PatternMemory } from '../games/PatternMemory.js'

// 하드모드 전용 게임 2개
import { ReactionTime } from '../games/ReactionTime.js'
import { ColorSequence } from '../games/ColorSequence.js'

// 하드모드: 새로운 2개는 무조건 포함 + 기존 5개 중 랜덤 4개 = 총 6개
const BASE_GAMES = {
    'shape_match': ShapeMatch,
    'word_search': WordSearch,
    'number_order': NumberOrder,
    'stroop_test': StroopTest,
    'pattern_memory': PatternMemory
}

const HARD_EXCLUSIVE_GAMES = {
    'reaction_time': ReactionTime,
    'color_sequence': ColorSequence
}

export class GameEngineHard {
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
            history: [],
            startTime: null,
            totalFocusTime: 0,
            combo: 0 // 콤보 카운터
        }

        this.timerId = null

        // 하드모드: 기존 5개 중 랜덤 4개 선택
        this.selectedBaseGames = this.selectRandomBaseGames()

        // 최종 게임 풀: 선택된 4개 + 하드모드 전용 2개
        this.GAMES = {
            ...this.selectedBaseGames,
            ...HARD_EXCLUSIVE_GAMES
        }

        this.GAME_KEYS = Object.keys(this.GAMES)

        console.log('🎮 Hard Mode Game Pool:', this.GAME_KEYS)
    }

    selectRandomBaseGames() {
        const baseKeys = Object.keys(BASE_GAMES)
        const shuffled = baseKeys.sort(() => Math.random() - 0.5)
        const selected = shuffled.slice(0, 4) // 4개만 선택

        const result = {}
        selected.forEach(key => {
            result[key] = BASE_GAMES[key]
        })

        return result
    }

    async startGame() {
        this.state.round = 1
        this.state.score = 0
        this.state.history = []
        this.state.isPlaying = true
        this.state.startTime = Date.now()
        this.state.totalFocusTime = 0

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

        // 하드모드 스플래시 먼저 보여주기
        this.showHardModeSplash(() => {
            this.nextRound()
        })
    }

    showHardModeSplash(callback) {
        this.container.innerHTML = `
            <div style="
                flex:1;
                display:flex;
                flex-direction:column;
                justify-content:center;
                align-items:center;
                background-image: url('/gif/new/hard.gif');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                position: relative;
                color:#fff;
                animation: fadeIn 0.3s;
            ">
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 0;
                "></div>
                <div style="
                    position: relative;
                    z-index: 1;
                    text-align: center;
                ">
                    <h1 style="
                        font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
                        font-size: 4rem;
                        font-weight: 900;
                        letter-spacing: 0.1em;
                        margin-bottom: 1.5rem;
                        color: #fff;
                    ">HARD MODE</h1>
                    <div style="
                        font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
                        font-size: 1.5rem;
                        color: #ff6b6b;
                        font-weight: 500;
                    ">실패하면 게임오버</div>
                </div>
            </div>
        `
        setTimeout(callback, 2500)
    }

    nextRound() {
        if (!this.state.isPlaying) return

        // 1. Calculate Difficulty
        const prevTimeLimit = this.state.timeLimit
        this.state.timeLimit = LEVELS.calcTimeLimit(this.state.round)
        this.state.timeLeft = this.state.timeLimit

        // Phase 분기
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

        // ColorSequence 게임인지 확인 (방금 선택된 게임 키 확인)
        const selectedKey = this.state.history[this.state.history.length - 1]
        const isColorSequence = selectedKey === 'color_sequence'

        // 3. Setup Game UI with fade animation
        // 페이드아웃
        this.container.style.transition = 'opacity 0.2s'
        this.container.style.opacity = '0'

        setTimeout(() => {
            this.container.innerHTML = ''

            const gameConfig = {
                difficulty: this.state.round,
                roundTier: roundTier,
                onCorrect: () => this.handleCorrect(),
                onWrong: () => this.handleWrong() // 하드모드: 한번 틀리면 끝
            }

            // ColorSequence의 경우 onReady 콜백 추가
            if (isColorSequence) {
                gameConfig.onReady = () => {
                    // 안내가 끝나면 타이머 시작
                    this.startTimer()
                }
            }

            this.state.currentGameInstance = new GameClass(this.container, gameConfig)

            // 4. Render
            this.state.currentGameInstance.render()

            // 페이드인
            setTimeout(() => {
                this.container.style.opacity = '1'
            }, 50)

            // ColorSequence가 아닌 경우에만 바로 타이머 시작
            if (!isColorSequence) {
                this.startTimer()
            }

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
        let candidates = this.GAME_KEYS.filter(key => {
            const lastIdx = this.state.history.lastIndexOf(key)
            if (lastIdx === -1) return true
            const distance = this.state.history.length - lastIdx
            return distance >= CONFIG.MIN_GAP_SAME_TYPE
        })

        if (candidates.length === 0) {
            // Relax constraint: 2 (최소 2칸 간격)
            candidates = this.GAME_KEYS.filter(key => {
                const lastIdx = this.state.history.lastIndexOf(key)
                if (lastIdx === -1) return true
                const distance = this.state.history.length - lastIdx
                return distance >= 2
            })
        }

        if (candidates.length === 0) {
            // Final fallback: 최소 1칸 간격
            candidates = this.GAME_KEYS.filter(key => {
                const lastIdx = this.state.history.lastIndexOf(key)
                if (lastIdx === -1) return true
                const distance = this.state.history.length - lastIdx
                return distance >= 1
            })
        }

        if (candidates.length === 0) candidates = this.GAME_KEYS // Ultimate fallback

        const selectedKey = candidates[Math.floor(Math.random() * candidates.length)]
        this.state.history.push(selectedKey)

        return this.GAMES[selectedKey]
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

        // 콤보 체크: 시간의 70% 이상 남았으면 콤보 증가
        const timePercent = (this.state.timeLeft / this.state.timeLimit) * 100
        if (timePercent >= 70) {
            this.state.combo++
        } else {
            this.state.combo = 0 // 느리면 콤보 리셋
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

        // Flash background with fiery effect (하드모드 전용)
        const originalBg = document.body.style.backgroundColor
        const originalBgImage = document.body.style.backgroundImage

        // 불꽃 느낌의 주황-붉은 그라디언트 효과
        document.body.style.backgroundImage = 'radial-gradient(circle at center, rgba(255, 119, 0, 0.4), rgba(239, 68, 68, 0.2))'
        document.body.style.backgroundColor = 'rgba(255, 87, 34, 0.15)'

        setTimeout(() => {
            document.body.style.backgroundImage = originalBgImage
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
        // 하드모드: 한번 틀리면 즉시 게임오버 + 특수 이펙트

        // 1. 화면 진동 효과
        document.body.style.animation = 'shake 0.5s'

        // 2. 붉은 화면 플래시 효과 (GTA 스타일)
        this.createRedFlashEffect()

        // 3. 페이드아웃 효과
        setTimeout(() => {
            this.container.style.transition = 'opacity 0.5s'
            this.container.style.opacity = '0'

            setTimeout(() => {
                this.handleGameOver("One Mistake")
            }, 500)
        }, 800)
    }

    createRedFlashEffect() {
        // 붉은 플래시 오버레이 생성
        const flash = document.createElement('div')
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at center, rgba(239, 68, 68, 0.7), rgba(139, 0, 0, 0.5));
            z-index: 9999;
            pointer-events: none;
            animation: redFlash 0.8s ease-out;
        `
        document.body.appendChild(flash)

        // CSS 애니메이션 추가 (한 번만)
        if (!document.getElementById('red-flash-style')) {
            const style = document.createElement('style')
            style.id = 'red-flash-style'
            style.textContent = `
                @keyframes redFlash {
                    0% { opacity: 0; }
                    10% { opacity: 1; }
                    20% { opacity: 0.3; }
                    30% { opacity: 1; }
                    40% { opacity: 0.4; }
                    50% { opacity: 0.9; }
                    70% { opacity: 0.6; }
                    100% { opacity: 0; }
                }
            `
            document.head.appendChild(style)
        }

        // 진동 효과 (모바일)
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 200])
        }

        setTimeout(() => flash.remove(), 800)
    }

    showComboFeedback() {
        // 콤보 표시 생성 (체크마크와 다른 위치: 상단 중앙)
        const comboText = document.createElement('div')

        // 콤보 레벨에 따른 메시지와 색상
        let message = ''
        let color = ''
        let glow = ''

        if (this.state.combo >= 5) {
            message = `🔥 ${this.state.combo} COMBO! 🔥`
            color = '#ff6b35' // 오렌지-레드 (불꽃)
            glow = 'rgba(255, 107, 53, 0.8)'
        } else if (this.state.combo >= 3) {
            message = `⚡ ${this.state.combo} COMBO! ⚡`
            color = '#ffd700' // 골드
            glow = 'rgba(255, 215, 0, 0.8)'
        } else {
            message = `✨ ${this.state.combo} COMBO ✨`
            color = '#69f0ae' // 라이트 그린
            glow = 'rgba(105, 240, 174, 0.8)'
        }

        comboText.style.cssText = `
            position: fixed;
            top: 15%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 2.5rem;
            font-weight: bold;
            color: ${color};
            text-shadow: 0 0 20px ${glow}, 0 0 40px ${glow};
            z-index: 1001;
            animation: comboSlideDown 0.6s ease-out;
            pointer-events: none;
        `
        comboText.innerText = message
        document.body.appendChild(comboText)

        // CSS 애니메이션 추가 (한 번만)
        if (!document.getElementById('combo-style')) {
            const style = document.createElement('style')
            style.id = 'combo-style'
            style.textContent = `
                @keyframes comboSlideDown {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, -100%) scale(0.5);
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.2);
                    }
                    100% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
            `
            document.head.appendChild(style)
        }

        // 콤보 이펙트: 파티클 효과 (적게, 게임에 방해되지 않게)
        if (this.state.combo >= 3) {
            for (let i = 0; i < 5; i++) {
                this.createComboParticle(color)
            }
        }

        setTimeout(() => comboText.remove(), 600)
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

        // Cleanup current game instance
        if (this.state.currentGameInstance && this.state.currentGameInstance.cleanup) {
            this.state.currentGameInstance.cleanup()
        }

        // Calculate XP (하드모드는 3배)
        const baseXp = LEVELS.calcXpForRound(this.state.round)
        const earnedXp = baseXp * 3  // 3배 적용

        this.onGameOver({
            round: this.state.round,
            xp: earnedXp,
            isHardMode: true // 하드모드 표시
        })
    }

    cleanup() {
        clearInterval(this.timerId)
        if (this.state.currentGameInstance && this.state.currentGameInstance.cleanup) {
            this.state.currentGameInstance.cleanup()
        }
    }
}
