
import { CONFIG, LEVELS } from '../config/gameConfig.js'
import { store } from './store.js'
import { dataService } from '../services/dataService.js'

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
            label = 'Round 1'
            subLabel = 'Start!'
        } else if (prevTimeLimit >= 4 && this.state.timeLimit < 4) {
            showIntermission = true
            label = 'Round 2'
            subLabel = 'Speed Up!'
        } else if (prevTimeLimit >= 3 && this.state.timeLimit < 3) {
            showIntermission = true
            label = 'Round 3'
            subLabel = 'Hurry Up!'
        } else if (prevTimeLimit > 2 && this.state.timeLimit <= 2) {
            showIntermission = true
            label = 'Final Round'
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

        // Update View
        if (this.onRoundUpdate) {
            this.onRoundUpdate({
                round: this.state.round,
                maxTime: this.state.timeLimit
            })
        }
    }

    showIntermission(label, subLabel, callback) {
        this.container.innerHTML = `
            <div style="
                flex:1; 
                display:flex; 
                flex-direction:column; 
                justify-content:center; 
                align-items:center; 
                background:rgba(0,0,0,0.8);
                color:#fff;
                animation: fadeIn 0.2s;
            ">
                <h2 style="font-size:3rem; margin-bottom:1rem; color:var(--color-accent);">${label}</h2>
                <div style="font-size:1.5rem; color:#fff;">${subLabel}</div>
                <div style="margin-top:20px; font-size:1rem; color:#888;">Current Score: ${this.state.score}</div>
            </div>
        `
        setTimeout(callback, 1500) // 1.5s delay (User asked for ~1s, giving a bit more)
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
