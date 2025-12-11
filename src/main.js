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

  // Auth State Listener
  authService.onAuthStateChange(async (event, session) => {
    console.log('Auth state change:', event, session?.user?.id)

    if (session?.user) {
      const user = await dataService.fetchUserData(session.user.id)
      if (user) {
        if (window.location.pathname === '/' || window.location.pathname === '/onboarding') {
          navigateTo('/main')
        }
      }
    } else {
      // navigateTo('/') // Optional: force logout redirect
    }
  })
}

init().catch(console.error)
