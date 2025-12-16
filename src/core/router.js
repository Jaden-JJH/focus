import { supabase } from '../lib/supabase.js'
import { store } from './store.js'

const routes = {
    '/': () => import('../views/Splash.js'),
    '/onboarding': () => import('../views/Onboarding.js'),
    '/main': () => import('../views/Main.js'),
    '/game': () => import('../views/Game.js'),
    '/game/hard': () => import('../views/GameHard.js'),
    '/result': () => import('../views/Result.js'),
}

let appContainer = null
let currentView = null // Track current view instance

export function initRouter(container) {
    appContainer = container

    // Handle Back/Forward buttons
    window.addEventListener('popstate', handleLocation)

    // Initial load
    handleLocation()
}

export async function navigateTo(path, state = {}) {
    window.history.pushState(state, '', path)
    await handleLocation()
}

export async function handleLocation() {
    const path = window.location.pathname
    const route = routes[path] || routes['/']

    // Cleanup previous view if it exists
    if (currentView && typeof currentView.destroy === 'function') {
        currentView.destroy()
    }

    // Clear container
    appContainer.innerHTML = ''

    try {
        // Dynamic import
        const module = await route()
        const View = module.default

        // Render view
        const viewInstance = new View(appContainer)
        currentView = viewInstance // Reference for next cleanup

        await viewInstance.render()

        // 📊 Analytics: screen_view event
        const screenNameMap = {
            '/': 'splash',
            '/onboarding': 'onboarding',
            '/main': 'main',
            '/game': 'game',
            '/game/hard': 'game_hard',
            '/result': 'result'
        }
        const screenName = screenNameMap[path] || 'unknown'

        const state = store.getState()
        const user = state.user
        let userType = 'anonymous'
        if (user) {
            userType = user.isGuest ? 'guest' : 'member'
        }

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'event': 'screen_view',
            'screen_name': screenName,
            'user_type': userType
        });

    } catch (err) {
        console.error('Failed to load view:', err)
        appContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center;">
                <div style="font-size: 64px; margin-bottom: 20px;">🔄</div>
                <h2 style="color: #FFD700; margin-bottom: 10px;">잠시 문제가 발생했어요</h2>
                <p style="color: #888; margin-bottom: 30px;">페이지를 다시 불러와주세요</p>
                <button
                    onclick="window.location.reload()"
                    style="
                        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                        color: #000;
                        border: none;
                        padding: 16px 32px;
                        font-size: 18px;
                        font-weight: 700;
                        border-radius: 12px;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
                        transition: all 0.2s;
                    "
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(255, 215, 0, 0.4)'"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(255, 215, 0, 0.3)'"
                >
                    새로고침
                </button>
            </div>
        `
    }
}
