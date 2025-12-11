import { supabase } from '../lib/supabase.js'

const routes = {
    '/': () => import('../views/Splash.js'),
    '/onboarding': () => import('../views/Onboarding.js'),
    '/main': () => import('../views/Main.js'),
    '/game': () => import('../views/Game.js'),
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

    } catch (err) {
        console.error('Failed to load view:', err)
        appContainer.innerHTML = '<h1>Error loading page</h1>'
    }
}
