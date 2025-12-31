import { GameEngineHard } from '../core/GameEngineHard.js'
import { navigateTo } from '../core/router.js'
import { dataService } from '../services/dataService.js'
import { store } from '../core/store.js'

export default class GameHard {
    constructor(container) {
        this.container = container
    }

    async render() {
        // 🔒 Token Verification: 정상 플로우(Main → Game)로만 진입 가능
        const token = sessionStorage.getItem('game_token')
        const tokenTime = sessionStorage.getItem('game_token_time')

        if (!token || !tokenTime) {
            // 토큰 없음 → Main으로 리다이렉트
            console.log('⚠️ Game token missing - redirecting to /main')
            navigateTo('/main')
            return
        }

        // 토큰 만료 체크 (60초 이내 생성된 토큰만 유효) - 모바일 환경 고려
        const tokenAge = Date.now() - parseInt(tokenTime)
        if (tokenAge > 60000) {
            // 토큰 만료 → Main으로 리다이렉트
            console.log('⚠️ Game token expired - redirecting to /main')
            sessionStorage.removeItem('game_token')
            sessionStorage.removeItem('game_token_time')
            navigateTo('/main')
            return
        }

        // 토큰 일회성 삭제
        sessionStorage.removeItem('game_token')
        sessionStorage.removeItem('game_token_time')
        console.log('✅ Hard mode game token verified - starting game')

        // 🎨 하드모드 테마 적용 (body에 hard-mode 클래스 추가)
        document.body.classList.add('hard-mode')

        this.container.innerHTML = `
      <div class="game-area">
        <div class="game-header">
           <div class="timer-container">
             <div class="timer-bar"><div class="timer-fill" id="timer-fill" style="background: linear-gradient(90deg, #ef4444, #dc2626);"></div></div>
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
        const engine = new GameEngineHard(gameContainer, (result) => {
            // Game Over Callback
            console.log('Hard Mode Game Over Result:', result)

            // 📊 Analytics: game_over event
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                'event': 'game_over',
                'round': result.round,
                'xp': result.xp,
                'mode': 'hard',
                'level': store.getState().level
            });

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
            if (el) {
                el.innerText = `ROUND ${round}`
            }
            document.body.style.backgroundColor = ''; // Reset tint
            hasVibrated = false // Reset vibration flag for next round
        }

        // Start
        engine.startGame()

        // Cleanup on view destroy
        this.engine = engine
    }

    destroy() {
        // 🎨 하드모드 테마는 Result 화면에서 관리 (여기서는 제거하지 않음)

        if (this.engine) {
            this.engine.cleanup()
        }
    }
}
