import { store } from '../core/store.js'
import { dataService } from '../services/dataService.js'

export default class Main {
  constructor(container) {
    this.container = container
  }

  async render() {
    const state = store.getState()
    const user = state.user || { nickname: 'Guest' }

    this.container.innerHTML = `
      <div class="main-container">
        <header class="main-header">
           <div class="user-info">
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
    `

    // Fetch Ranking
    this.loadRanking()

    document.getElementById('play-btn').addEventListener('click', () => {
      if (state.coins > 0) {
        import('../core/router.js').then(r => r.navigateTo('/game'));
      }
    });

    const loginBtn = document.getElementById('login-redirect-btn')
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        import('../core/router.js').then(r => r.navigateTo('/'));
      })
    }

    // Subscribe to store updates
    this.unsub = store.subscribe((newState) => {
      // Simple re-render or partial update (for now re-render logic if needed, but for MVP just init)
      // Ideally we update DOM elements here
    })
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
}

