import { GameEngine } from '../core/GameEngine.js'
import { navigateTo } from '../core/router.js'
import { dataService } from '../services/dataService.js'
import { store } from '../core/store.js'

export default class Game {
    constructor(container) {
        this.container = container
    }

    async render() {
        this.container.innerHTML = `
      <div class="game-area">
        <div class="game-header">
           <div class="timer-container">
             <div class="timer-bar"><div class="timer-fill" id="timer-fill"></div></div>
             <div class="round-label" id="round-disp">ROUND 1</div>
           </div>
        </div>
        <div id="game-container" style="flex: 1; display:flex; flex-direction:column; justify-content:center;"></div>
      </div>
    `

        // Get current rank before game starts (for rank movement tracking)
        const user = store.getState().user
        let initialRank = null
        if (user && !user.isGuest) {
            const rankData = await dataService.getMyRank(user.id)
            initialRank = rankData.rank
        }

        // Initialize Engine
        const gameContainer = document.getElementById('game-container')
        const engine = new GameEngine(gameContainer, (result) => {
            // Game Over Callback
            console.log('Game Over Result:', result)
            // Add initial rank to result for rank movement tracking
            result.initialRank = initialRank
            // Navigate to Result with state
            navigateTo('/result', result)
        })

        // Bind UI updates
        let hasVibrated = false
        engine.onTimerTick = (timeLeft, timeLimit) => {
            const fill = document.getElementById('timer-fill')
            if (fill) {
                const pct = (timeLeft / timeLimit) * 100
                fill.style.width = `${pct}%`
                if (pct < 30) {
                    document.body.style.backgroundColor = '#3e1a1a'; // Red tint
                    fill.classList.add('critical')

                    // 진동 효과 (모바일, 한 번만)
                    if (!hasVibrated && navigator.vibrate) {
                        navigator.vibrate([50, 100, 50])
                        hasVibrated = true
                    }
                } else {
                    document.body.style.backgroundColor = '';
                    fill.classList.remove('critical')
                }
            }
        }

        engine.onRoundUpdate = ({ round }) => {
            const el = document.getElementById('round-disp')
            if (el) el.innerText = `ROUND ${round}`
            document.body.style.backgroundColor = ''; // Reset tint
            hasVibrated = false // Reset vibration flag for next round
        }

        // Start
        engine.startGame()

        // Cleanup on view destroy (not implemented in router yet, but good practice)
        this.engine = engine
    }
}
