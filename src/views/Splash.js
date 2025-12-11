import { authService } from '../services/authService.js'
import { store } from '../core/store.js'

export default class Splash {
    constructor(container) {
        this.container = container
    }

    async render() {
        this.container.innerHTML = `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <h1 class="fade-in" style="font-size: 3rem; margin-bottom: 2rem;">Focus</h1>
        <button id="login-btn" class="btn-primary fade-in" style="animation-delay: 0.5s;">구글로 시작하기</button>
        <button id="guest-btn" class="fade-in" style="margin-top: 1rem; color: var(--color-text-secondary); animation-delay: 0.8s;">로그인 없이 체험하기</button>
      </div>
    `

        // Event Listeners (Placeholder)
        document.getElementById('login-btn').addEventListener('click', async () => {
            try {
                await authService.signInWithGoogle()
            } catch (error) {
                alert('Login failed: ' + error.message)
            }
        });

        document.getElementById('guest-btn').addEventListener('click', () => {
            // Initialize Guest State
            store.setState({
                user: { id: 'guest', nickname: 'Guest', isGuest: true },
                coins: 999, // Unlimited (Temp)
                level: 0,
                totalXp: 0
            })
            import('../core/router.js').then(r => r.navigateTo('/onboarding'));
        });
    }
}
