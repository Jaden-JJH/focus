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

  // Check for referral code in URL and store it
  const urlParams = new URLSearchParams(window.location.search)
  const refCode = urlParams.get('ref')
  if (refCode) {
    localStorage.setItem('referral_code', refCode)
    console.log('Referral code detected:', refCode)
  }

  // 1. Deterministic Session Check on Init
  try {
    const currentUser = await authService.getUser()
    if (currentUser) {
      let user = await dataService.fetchUserData(currentUser.id)
      if (!user) {
        // Get stored referral code for new user
        const storedRefCode = localStorage.getItem('referral_code')
        user = await dataService.createUser(currentUser.id, currentUser.user_metadata, storedRefCode)
        // Clear referral code after use
        localStorage.removeItem('referral_code')
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

  // 3. Page Visibility API - Auto recovery when page becomes visible
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      // Page became visible again (user returned to app)
      console.log('Page visible - checking session...')
      try {
        const currentUser = await authService.getUser()
        if (currentUser) {
          const user = await dataService.fetchUserData(currentUser.id)
          if (user) {
            console.log('Session still valid:', user.nickname)
            // Check and reset daily coins if needed
            await dataService.checkAndResetDailyCoins(currentUser.id)

            // If we're on an error page or splash, recover to main
            if (window.location.pathname === '/' ||
                app.innerHTML.includes('Error loading page') ||
                app.innerHTML.includes('새로고침')) {
              navigateTo('/main')
            }
          }
        }
      } catch (e) {
        console.error('Session recovery failed:', e)
      }
    }
  })
}

init().catch(console.error)
