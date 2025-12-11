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

        <!-- Announcement Banner -->
        <div style="
          background: linear-gradient(135deg, rgba(255,193,7,0.15) 0%, rgba(255,152,0,0.15) 100%);
          border: 2px solid rgba(255,193,7,0.4);
          border-radius: 12px;
          padding: 14px 16px;
          margin: 16px 0 20px 0;
          text-align: center;
          box-shadow: 0 4px 12px rgba(255,193,7,0.2);
          animation: pulse 2s ease-in-out infinite;
        ">
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span style="font-size: 1.3rem;">🏆</span>
            <div>
              <div style="font-weight: bold; color: var(--color-accent); font-size: 1rem; margin-bottom: 2px;">
                주간 1위 보상
              </div>
              <div style="color: #ddd; font-size: 0.85rem;">
                매주 월요일 초기화 · 스타벅스 아메리카노 쿠폰 증정
              </div>
            </div>
            <span style="font-size: 1.3rem;">☕</span>
          </div>
        </div>

        <section class="rank-section">
           <h3>Weekly Ranking</h3>

           <!-- My Rank Section -->
           ${!user.isGuest ? `
           <div id="my-rank-section" style="background: rgba(255,193,7,0.1); border: 1px solid rgba(255,193,7,0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
             <div style="display: flex; justify-content: space-between; align-items: center;">
               <span style="font-weight: bold; color: var(--color-accent);">내 랭킹</span>
               <div id="my-rank-info" style="text-align: right;">
                 <div style="font-size: 0.9rem; color: #aaa;">Loading...</div>
               </div>
             </div>
           </div>
           ` : ''}

           <div class="rank-list" id="rank-list">Loading...</div>
        </section>
        
        <div class="action-area" style="display: flex; flex-direction: column; align-items: center; width: 100%;">
            <div style="display: flex; gap: 10px; width: 100%;">
              <button id="play-btn" class="btn-primary" style="flex: 4; min-height: 48px;" ${state.coins <= 0 ? 'disabled' : ''}>
                 ${user.isGuest ? '무제한 체험 중' : (state.coins > 0 ? '게임 시작' : '코인 부족')}
              </button>
              ${!user.isGuest ? `
                <button id="share-btn" style="flex: 1; min-height: 48px; background: #2a2a2a; border: 1px solid #ffc107; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">
                  <img src="/share.svg" alt="공유" style="width: 20px; height: 20px; filter: brightness(0) saturate(100%) invert(82%) sepia(58%) saturate(497%) hue-rotate(359deg) brightness(103%) contrast(101%);">
                </button>
              ` : ''}
            </div>

            ${!user.isGuest ? `
              <div style="width: 100%; text-align: center; font-size: 0.8rem; color: #ffc107; margin-top: 10px; padding: 8px 0;">
                💡 친구 초대 시 +1 코인
              </div>
            ` : ''}

            ${user.isGuest && state.coins <= 0 ? `<button id="login-redirect-btn" style="margin-top:16px; text-decoration:underline;">로그인하고 계속하기</button>` : ''}
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

    // Share Button
    const shareBtn = document.getElementById('share-btn')
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        const _state = store.getState()
        const user = _state.user

        if (!user || user.isGuest) {
          alert('로그인 후 공유할 수 있습니다!')
          return
        }

        const referralCode = user.referral_code
        const shareUrl = `${window.location.origin}/?ref=${referralCode}`
        const shareText = `집중력 게임 Focus에 도전해보세요! 나의 추천 코드로 시작하면 보너스 코인을 드려요!`

        // Check if Web Share API is supported (mainly mobile)
        if (navigator.share && navigator.canShare) {
          try {
            await navigator.share({
              title: 'Focus - 집중력 게임',
              text: shareText,
              url: shareUrl
            })
            console.log('Successfully shared via native share')
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.error('Error sharing:', err)
              // Fallback to clipboard
              copyToClipboard(shareText, shareUrl)
            }
          }
        } else {
          // Desktop: Copy to clipboard
          copyToClipboard(shareText, shareUrl)
        }
      })
    }

    function copyToClipboard(text, url) {
      const fullText = `${text}\n${url}`

      // Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(fullText).then(() => {
          alert('공유 링크가 클립보드에 복사되었습니다!\n\n친구가 이 링크로 가입하면 +1 코인을 받아요!')
        }).catch(err => {
          console.error('Clipboard write failed:', err)
          fallbackCopyToClipboard(fullText)
        })
      } else {
        // Fallback for older browsers or non-secure contexts
        fallbackCopyToClipboard(fullText)
      }
    }

    function fallbackCopyToClipboard(text) {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        alert('공유 링크가 복사되었습니다!')
      } catch (err) {
        console.error('Fallback copy failed:', err)
        prompt('공유 링크를 복사하세요:', text)
      }
      document.body.removeChild(textArea)
    }
  }

  async loadRanking() {
    const listEl = document.getElementById('rank-list')
    if (!listEl) return

    const state = store.getState()
    const user = state.user

    // Fetch weekly ranking
    const rankings = await dataService.fetchWeeklyRanking()
    if (!rankings || rankings.length === 0) {
      listEl.innerHTML = '<div style="text-align:center; color:#888;">No records yet</div>'
    } else {
      listEl.innerHTML = rankings.map((r, idx) => `
              <div class="rank-item" style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #333;">
                  <span>${idx + 1}. ${r.users?.nickname || 'Anonymous'}</span>
                  <span>${r.max_round}R</span>
              </div>
          `).join('')
    }

    // Fetch my rank (if not guest)
    if (user && !user.isGuest) {
      const myRankInfo = document.getElementById('my-rank-info')
      if (myRankInfo) {
        const { rank, maxRound } = await dataService.getMyRank(user.id)

        if (rank) {
          myRankInfo.innerHTML = `
            <div style="font-size: 1.1rem; font-weight: bold; color: var(--color-accent);">#${rank}</div>
            <div style="font-size: 0.9rem; color: #aaa;">최고 기록: ${maxRound}R</div>
          `
        } else {
          myRankInfo.innerHTML = `
            <div style="font-size: 0.9rem; color: #aaa;">아직 기록이 없습니다</div>
          `
        }
      }
    }
  }

  destroy() {
    // Cleanup subscription
    if (this.unsub) {
      this.unsub()
      this.unsub = null
    }
  }
}

