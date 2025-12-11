import './styles/index.css'
import { initRouter, navigateTo } from './core/router.js'
import { authService } from './services/authService.js'
import { dataService } from './services/dataService.js'
import { store } from './core/store.js'

async function init() {
  const app = document.querySelector('#app')
  if (!app) {
    console.error('#app element not found')
    return
  }

  // Initialize Router
  initRouter(app)

  // 1. Deterministic Session Check on Init
  try {
    const currentUser = await authService.getUser()
    if (currentUser) {
      let user = await dataService.fetchUserData(currentUser.id)
      if (!user) {
        user = await dataService.createUser(currentUser.id, currentUser.user_metadata)
      }
      if (user) {
        console.log('Session restored:', user.nickname)

        // Check and reset daily coins if needed
        await dataService.checkAndResetDailyCoins(currentUser.id)

        if (window.location.pathname === '/' || window.location.pathname === '/onboarding') {
          navigateTo('/main')
        }
      }
    } else {
      // No active session
      // If on protected route, redirect?
      // For now, just finish loading. Main view will handle guest/redirect.
    }
  } catch (e) {
    console.error('Session check failed:', e)
  } finally {
    // Always finish loading
    store.setState({ isLoading: false })
  }

  // 2. Auth Listener for Logout only (mostly)
  authService.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      navigateTo('/')
    }
  })
}

init().catch(console.error)
