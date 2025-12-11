import { dataService } from '../services/dataService.js'
import { store } from '../core/store.js'

export default class Result {
    constructor(container) {
        this.container = container
    }

    async render() {
        const state = history.state || {} // Router pushState data
        const { round, xp } = state

        this.container.innerHTML = `
      <div style="flex: 1; padding: 20px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <h2>Game Over</h2>
        <div class="result-card">
            <div class="result-row">
                <span>Round Reached</span>
                <span class="value">${round || 0}</span>
            </div>
            <div class="result-row">
                <span>XP Earned</span>
                <span class="value link-color">+${xp || 0} XP</span>
            </div>
        </div>
        
        <div class="action-area" style="margin-top: 30px;">
           <button id="retry-btn" class="btn-primary">다시 시도 (-1©)</button>
           <button id="home-btn" style="margin-top: 10px; color: #888;">메인으로</button>
        </div>
      </div>
    `

        // Save Record (Fire and forget or await?)
        // Need user ID
        const user = store.getState().user
        if (user && round && !user.isGuest) {
            dataService.saveGameRecord(user.id, round, xp)
            // Also update local User XP/Level manually or refetch?
            // Ideally refetch to get triggers/updates
            dataService.fetchUserData(user.id)
        } else if (user && user.isGuest) {
            // Guest Logic: Coin is consumed on start, so 1 -> 0.
            // Prevent further play in Main view.
            // Maybe show alert "Sign in to save progress!"
        }

        document.getElementById('retry-btn').addEventListener('click', () => {
            const currentCoins = store.getState().coins
            if (currentCoins > 0) {
                import('../core/router.js').then(r => r.navigateTo('/game'));
            } else {
                alert('코인이 부족합니다.')
            }
        });

        document.getElementById('home-btn').addEventListener('click', () => {
            import('../core/router.js').then(r => r.navigateTo('/main'));
        });
    }
}
