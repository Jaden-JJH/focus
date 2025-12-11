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

        // Save Record
        const user = store.getState().user
        if (user && round && !user.isGuest) {
            // Optimistic update for UI?
            const oldLevel = user.level

            // Note: We await here but listeners are already attached.
            // However, this still blocks the end of the method (confetti logic above seems fine as it is synchronous DOM manipulation)
            // But if we want confetti to NOT block, we should keep it above.

            // Wait, previous code had confetti logic in showLevelUp which is called AFTER await.
            // If save fails, no Level Up animation. That's actually OK.
            // But buttons MUST work.

            try {
                await dataService.saveGameRecord(user.id, round, xp)

                const newUser = store.getState().user
                const newLevel = newUser.level

                if (newLevel > oldLevel) {
                    this.showLevelUp(newLevel)
                }
            } catch (e) {
                console.error("Failed to save record", e)
            }
        } else if (user && user.isGuest) {
            // Guest Logic
        }
    }

    showLevelUp(level) {
        // Create Overlay
        const overlay = document.createElement('div')
        overlay.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 200;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            animation: fadeIn 0.5s;
        `
        overlay.innerHTML = `
            <h1 style="font-size: 3rem; color: var(--color-warning); text-shadow: 0 0 20px var(--color-warning); margin-bottom: 20px;">LEVEL UP!</h1>
            <div style="font-size: 5rem; font-weight: bold; color: white;">${level}</div>
            <div style="margin-top: 20px; color: #aaa;">Keep going!</div>
        `
        this.container.appendChild(overlay)

        // Confetti effect or simple delay
        setTimeout(() => {
            overlay.style.opacity = '0'
            overlay.style.transition = 'opacity 0.5s'
            setTimeout(() => overlay.remove(), 500)
        }, 2000)

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
