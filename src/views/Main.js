import { authService } from '../services/authService.js'
import { store } from '../core/store.js'
import { dataService } from '../services/dataService.js'
import { LEVELS } from '../config/gameConfig.js'

export default class Main {
  constructor(container) {
    this.container = container

    // Subscribe to store updates
    this.unsub = store.subscribe(() => {
      this.render()
    })
  }

  async render() {
    const state = store.getState()
    const user = state.user

    // 1. Loading State
    if (state.isLoading) {
      this.container.innerHTML = `
            <div style="flex:1; display:flex; justify-content:center; align-items:center; color:#888;">
                Loading session...
            </div>
        `
      return
    }

    // 2. If Loading Done but No User?
    // This happens if we refreshed on Main but had no session (and Main requires login usually, or Guest).
    // If we want to support Refreshed Guest, we need to persist Guest state (localStorage).
    // But currently Guest state is in-memory only.
    // So if !user, we probably should go to Splash.
    if (!user) {
      // Force redirect to splash if we are here without a user
      // Use a timeout to avoid render-loop if something is weird, but simplest is just:
      // window.location.href = '/' ? Or via router?
      // Router isn't imported here as instance.
      // Let's just show a "Session Expired" or button.
      this.container.innerHTML = `
            <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; color:#888;">
                <p>Session Expired or Invalid</p>
                <button id="home-redirect" style="margin-top:10px; text-decoration:underline;">Go Home</button>
            </div>
        `
      setTimeout(() => {
        const btn = document.getElementById('home-redirect')
        if (btn) btn.addEventListener('click', () => {
          import('../core/router.js').then(r => r.navigateTo('/'))
        })
        // Auto redirect?
        // import('../core/router.js').then(r => r.navigateTo('/'))
      }, 0)
      return
    }

    // 3. Render Main View
    this.container.innerHTML = `
      <div class="main-container">
        <header class="main-header">
           <div class="user-info" id="user-info-area" style="cursor: pointer;">
             <span class="level-badge">Lv. ${state.level}</span>
             <span class="nickname">${user.nickname || 'Unknown'}</span>
           </div>
           <div class="currency">
             <span class="coin-icon">©</span>
             <span class="coin-count">${state.coins}</span>
           </div>
        </header>

        <section class="rank-section">
           <h3>Weekly Ranking</h3>
           <div class="rank-list" id="rank-list">Loading...</div>
        </section>
        
        <div class="action-area">
            <button id="play-btn" class="btn-primary" ${state.coins <= 0 ? 'disabled' : ''}>
               ${user.isGuest ? '무제한 체험 중' : (state.coins > 0 ? '게임 시작 (-1©)' : '코인 부족 (00:00 초기화)')}
            </button>
            ${user.isGuest && state.coins <= 0 ? `<button id="login-redirect-btn" style="margin-top:10px; text-decoration:underline;">로그인하고 계속하기</button>` : ''}
        </div>
      </div>

      <!-- XP Modal -->
      <div id="xp-modal" class="hidden" style="
          position:absolute; top:0; left:0; width:100%; height:100%; 
          background:rgba(0,0,0,0.8); z-index:100;
          display:flex; justify-content:center; align-items:center;">
          <div class="card" style="width:80%; max-width:300px; text-align:center; position:relative;">
              <button id="close-modal" style="position:absolute; top:10px; right:10px; color:#fff;">X</button>
              <h3 style="margin-bottom:20px;">Level Progress</h3>
              <div style="font-size:3rem; font-weight:bold; color:var(--color-accent); margin-bottom:10px;">
                  ${state.level}
              </div>
              <div class="xp-bar-container" style="background:#444; height:10px; border-radius:5px; margin-bottom:10px; overflow:hidden;">
                 <div id="xp-bar-fill" style="background:var(--color-accent); height:100%; width:0%;"></div>
              </div>
              <div id="xp-text" style="color:#aaa; font-size:0.9rem; margin-bottom:20px;">0 / 0 (0%)</div>
              
              <button id="logout-btn" style="border:1px solid #555; padding:5px 10px; border-radius:4px; font-size:0.8rem; color:#aaa;">Logout</button>
          </div>
      </div>
    `

    // Fetch Ranking
    this.loadRanking()

    // Level Click Handler
    const userInfoArea = document.getElementById('user-info-area')
    const xpModal = document.getElementById('xp-modal')
    const closeModal = document.getElementById('close-modal')
    const xpBarFill = document.getElementById('xp-bar-fill')
    const xpText = document.getElementById('xp-text')
    const logoutBtn = document.getElementById('logout-btn')

    if (userInfoArea) {
      userInfoArea.addEventListener('click', () => {
        const _state = store.getState()
        const { current, max, percent } = LEVELS.calcXpProgress(_state.totalXp, _state.level)
        if (xpBarFill) xpBarFill.style.width = `${percent}%`
        if (xpText) xpText.innerText = `${current} / ${max} XP (${percent}%)`
        if (xpModal) xpModal.classList.remove('hidden')
      })
    }

    if (closeModal) {
      closeModal.addEventListener('click', () => {
        if (xpModal) xpModal.classList.add('hidden')
      })
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await authService.signOut()
        store.setState({ user: null, coins: 0, level: 0 })
        import('../core/router.js').then(r => r.navigateTo('/'))
      })
    }

    const playBtn = document.getElementById('play-btn')
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        const _state = store.getState()
        if (_state.coins > 0) {
          import('../core/router.js').then(r => r.navigateTo('/game'));
        }
      });
    }

    const loginBtn = document.getElementById('login-redirect-btn')
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        import('../core/router.js').then(r => r.navigateTo('/'));
      })
    }
  }

  async loadRanking() {
    const listEl = document.getElementById('rank-list')
    if (!listEl) return

    const rankings = await dataService.fetchWeeklyRanking()
    if (!rankings || rankings.length === 0) {
      listEl.innerHTML = '<div style="text-align:center; color:#888;">No records yet</div>'
      return
    }

    listEl.innerHTML = rankings.map((r, idx) => `
            <div class="rank-item" style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #333;">
                <span>${idx + 1}. ${r.users?.nickname || 'Anonymous'}</span>
                <span>${r.max_round}R</span>
            </div>
        `).join('')
  }

  destroy() {
    // Cleanup subscription
    if (this.unsub) {
      this.unsub()
      this.unsub = null
    }
  }
}

