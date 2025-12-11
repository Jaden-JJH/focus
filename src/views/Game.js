import { GameEngine } from '../core/GameEngine.js'
import { navigateTo } from '../core/router.js'
import { dataService } from '../services/dataService.js'

export default class Game {
    constructor(container) {
        this.container = container
    }

    async render() {
        this.container.innerHTML = `
      <div class="game-area">
        <div class="game-header">
           <div class="timer-bar"><div class="timer-fill" id="timer-fill"></div></div>
           <div class="round-info">Round: <span id="round-disp">1</span></div>
        </div>
        <div id="game-container" style="flex: 1; display:flex; flex-direction:column; justify-content:center;"></div>
      </div>
    `

        // Initialize Engine
        const gameContainer = document.getElementById('game-container')
        const engine = new GameEngine(gameContainer, (result) => {
            // Game Over Callback
            console.log('Game Over Result:', result)
            // Navigate to Result with state
            navigateTo('/result', result)
        })

        // Bind UI updates
        engine.onTimerTick = (timeLeft, timeLimit) => {
            const fill = document.getElementById('timer-fill')
            if (fill) {
                const pct = (timeLeft / timeLimit) * 100
                fill.style.width = `${pct}%`
                if (pct < 30) {
                    document.body.style.backgroundColor = '#3e1a1a'; // Red tint
                } else {
                    document.body.style.backgroundColor = '';
                }
            }
        }

        engine.onRoundUpdate = ({ round }) => {
            const el = document.getElementById('round-disp')
            if (el) el.innerText = round
            document.body.style.backgroundColor = ''; // Reset tint
        }

        // Start
        engine.startGame()

        // Cleanup on view destroy (not implemented in router yet, but good practice)
        this.engine = engine
    }
}
