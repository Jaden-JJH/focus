
import { CONFIG, LEVELS } from '../config/gameConfig.js'
import { store } from './store.js'

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
            history: [] // Last N games to check constraints
        }

        this.timerId = null
    }

    async startGame() {
        this.state.round = 1
        this.state.score = 0
        this.state.history = []
        this.state.isPlaying = true

        // Deduct Coin
        store.setState({ coins: store.getState().coins - 1 })
        // In real app, sync with server here (optimistic UI)

        this.nextRound()
    }

    nextRound() {
        if (!this.state.isPlaying) return

        // 1. Calculate Difficulty
        this.state.timeLimit = LEVELS.calcTimeLimit(this.state.round)
        this.state.timeLeft = this.state.timeLimit

        // 2. Select Game
        const GameClass = this.selectGame()
        if (!GameClass) {
            console.error('No game available')
            return
        }

        // 3. Setup Game UI
        this.container.innerHTML = ''
        this.state.currentGameInstance = new GameClass(this.container, {
            difficulty: this.state.round,
            onCorrect: () => this.handleCorrect(),
            onWrong: () => this.handleWrong()
        })

        // 4. Render & Start Timer
        this.state.currentGameInstance.render()
        this.startTimer()

        // Update View (Call callback if provided to update header)
        if (this.onRoundUpdate) {
            this.onRoundUpdate({
                round: this.state.round,
                maxTime: this.state.timeLimit
            })
        }
    }

    selectGame() {
        // Constraint: No same game type within MIN_GAP_SAME_TYPE (3)
        // Constraint: No same specific game config (handled inside game?)

        // Simple random for now with history check
        let candidates = GAME_KEYS.filter(key => {
            const lastIdx = this.state.history.lastIndexOf(key)
            if (lastIdx === -1) return true
            const distance = this.state.history.length - lastIdx
            return distance > CONFIG.MIN_GAP_SAME_TYPE
        })

        if (candidates.length === 0) {
            // Relax constraint: 2
            candidates = GAME_KEYS.filter(key => {
                const lastIdx = this.state.history.lastIndexOf(key)
                if (lastIdx === -1) return true
                const distance = this.state.history.length - lastIdx
                return distance > 2
            })
        }

        if (candidates.length === 0) candidates = GAME_KEYS // Fallback

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

        // FX: Correct

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

    handleWrong() {
        // FX: Wrong (Shake?)
        // Time penalty or just retry? Plan says "Retry within time limit"
    }

    handleGameOver(reason) {
        this.state.isPlaying = false
        clearInterval(this.timerId)
        console.log('Game Over:', reason)

        // Calculate XP
        const earnedXp = LEVELS.calcXpForRound(this.state.round)

        this.onGameOver({
            round: this.state.round,
            xp: earnedXp
        })
    }

    cleanup() {
        clearInterval(this.timerId)
    }
}
