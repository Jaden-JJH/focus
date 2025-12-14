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
        <!-- Fixed Header -->
        <header class="main-header main-header-fixed">
           <div class="user-info" id="user-info-area" style="cursor: pointer;">
             <span class="level-badge">Lv. ${state.level}</span>
             <span class="nickname">${user.nickname || 'Unknown'}</span>
           </div>
           ${!user.isGuest ? `
           <div class="currency" style="display: flex; align-items: center; gap: var(--space-1);">
             <span style="font-size: 20px;">🪙</span>
             <span style="font-size: var(--text-base); font-weight: var(--font-bold); color: var(--warning);">${state.coins}</span>
           </div>
           ` : ''}
        </header>

        <!-- Scrollable Content Area -->
        <div class="main-content-scroll">

        <!-- XP Progress Card -->
        ${!user.isGuest ? `
        <div style="
          background: var(--gray-800);
          border: 1px solid var(--theme-primary);
          border-radius: var(--radius-md);
          padding: var(--space-3);
          margin-bottom: var(--space-4);
          flex-shrink: 0;
          transition: border-color var(--theme-transition);
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2);">
            <div style="font-size: var(--text-sm); color: var(--gray-100); font-weight: var(--font-medium);">레벨 진행도</div>
            <div style="font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--theme-primary); transition: color var(--theme-transition);">Lv. ${state.level}</div>
          </div>
          <div class="xp-bar-container" style="background: var(--gray-700); height: 8px; border-radius: var(--radius-full); margin-bottom: var(--space-2); overflow: hidden;">
            <div class="xp-bar-fill" style="background: var(--theme-xp-bar); height: 100%; width: ${(() => {
              const { percent } = LEVELS.calcXpProgress(state.totalXp, state.level)
              return percent
            })()}%; transition: width var(--transition-base), background-color var(--theme-transition);"></div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: var(--text-xs); color: var(--gray-300);">${(() => {
              const { current, max } = LEVELS.calcXpProgress(state.totalXp, state.level)
              const remaining = max - current
              return `Lv.${state.level + 1}까지 ${remaining} XP`
            })()}</span>
            <span style="font-size: var(--text-xs); color: var(--warning); font-weight: var(--font-bold);">${(() => {
              const { percent } = LEVELS.calcXpProgress(state.totalXp, state.level)
              return `${percent}%`
            })()}</span>
          </div>
        </div>
        ` : ''}

        <!-- Weekly Activity Card -->
        ${!user.isGuest ? `
        <div id="weekly-activity-card" style="
          background: var(--gray-800);
          border: 1px solid var(--gray-600);
          border-radius: var(--radius-md);
          padding: var(--space-3);
          margin-bottom: var(--space-4);
          flex-shrink: 0;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
            <div style="font-size: var(--text-sm); color: var(--gray-100); font-weight: var(--font-bold);">주간 활동</div>
            <div id="streak-badge" style="display: flex; align-items: center; gap: var(--space-1);">
              <div class="skeleton" style="width: 60px; height: 16px;"></div>
            </div>
          </div>
          <div id="activity-chart" style="display: flex; justify-content: space-between; gap: var(--space-1);">
            ${Array(7).fill(0).map((_, i) => `
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: var(--space-1);">
                <div class="skeleton" style="width: 100%; height: 32px;"></div>
                <div class="skeleton" style="width: 12px; height: 12px;"></div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Ranking Section -->
        <section class="rank-section" style="flex: 1; display: flex; flex-direction: column; margin-bottom: var(--space-1); min-height: 0; overflow: hidden;">
           <div style="flex-shrink: 0; padding: var(--space-1) 0; display: flex; justify-content: space-between; align-items: center;">
             <h3 style="font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--gray-100);">Weekly Ranking</h3>
             ${state.isHardMode ? `
             <span style="background: var(--error); color: white; padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); font-size: var(--text-xs); font-weight: var(--font-bold);">하드모드</span>
             ` : ''}
           </div>

           <!-- My Rank Section (Fixed) -->
           ${!user.isGuest ? `
           <div id="my-rank-section" style="flex-shrink: 0; background: var(--gray-800); border: 1px solid var(--theme-primary); border-radius: var(--radius-md); padding: var(--space-3); margin-bottom: var(--space-2); transition: border-color var(--theme-transition);">
             <div style="display: flex; justify-content: space-between; align-items: center;">
               <span style="font-weight: var(--font-bold); font-size: var(--text-base); color: var(--gray-100);">내 랭킹</span>
               <div id="my-rank-info" style="text-align: right;">
                 <div style="font-size: var(--text-sm); color: var(--gray-400);">Loading...</div>
               </div>
             </div>
           </div>
           ` : ''}

           <!-- Scrollable Rank List -->
           <div class="rank-list" id="rank-list" style="flex: 1;">잠시만 기다려주세요...</div>
        </section>
        </div>
        <!-- End of Scrollable Content Area -->

        <!-- Fixed Action Area -->
        <div class="action-area action-area-fixed">
            <!-- Hard Mode Toggle -->
            ${!user.isGuest ? `
            <div class="hard-mode-toggle-container" style="
              display: flex;
              align-items: center;
              justify-content: center;
              gap: var(--space-2);
              padding: var(--space-3) 0;
              margin-bottom: var(--space-2);
              width: 100%;
            ">
              <button id="hard-mode-tooltip-icon" style="
                background: none;
                border: none;
                cursor: pointer;
                padding: 0;
                display: flex;
                align-items: center;
                opacity: 0.5;
                transition: opacity var(--transition-fast);
              " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.5'">
                <img src="/lucide_info.svg" alt="info" style="width: 18px; height: 18px; filter: brightness(0.7);" />
              </button>
              <span style="font-size: var(--text-base); color: var(--gray-100); font-weight: var(--font-medium);">하드모드</span>
              <label class="toggle-switch">
                <input type="checkbox" id="hard-mode-toggle" ${state.isHardMode ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
              <span style="font-size: var(--text-sm); color: ${state.isHardMode ? 'var(--error)' : 'var(--gray-400)'}; font-weight: var(--font-bold); min-width: 32px;">${state.isHardMode ? 'ON' : 'OFF'}</span>
            </div>
            ` : ''}

            <!-- Hard Mode Tooltip Modal -->
            <div id="hard-mode-tooltip" class="hidden" style="
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.7);
              z-index: 200;
              display: flex;
              justify-content: center;
              align-items: center;
              padding: var(--space-4);
            ">
              <div style="
                background: var(--gray-800);
                border: 1px solid var(--error);
                border-radius: var(--radius-md);
                padding: var(--space-6);
                max-width: 320px;
                text-align: center;
                box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
              ">
                <div style="font-size: 2rem; margin-bottom: var(--space-3);">⚠️</div>
                <h3 style="font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--error); margin-bottom: var(--space-3);">하드모드란?</h3>
                <p style="font-size: var(--text-base); color: var(--gray-100); line-height: 1.6;">
                  하드모드는 <strong style="color: var(--error);">오답을 체크하면 바로 게임오버</strong>가 되는 모드입니다. 고난이도 게임이 추가됩니다.
                </p>
              </div>
            </div>

            <div style="display: flex; gap: var(--space-2); width: 100%;">
              <button id="play-btn" class="btn-primary" style="flex: 4; min-height: 48px; font-size: var(--text-lg);" ${state.coins <= 0 && !user.isGuest ? 'disabled' : ''}>
                 ${user.isGuest
                    ? ((() => {
                        const sessionData = localStorage.getItem('guest_session_used')
                        const sessionUsed = sessionData ? JSON.parse(sessionData).used : false
                        return sessionUsed ? '로그인하고 시작하기' : '체험 플레이'
                      })())
                    : (state.coins > 0 ? '게임 시작' : '코인 부족')
                  }
              </button>
              <button id="share-btn" style="flex: 1; min-height: 48px; background: var(--gray-700); border: 1px solid var(--gray-600); border-radius: var(--radius-lg); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: var(--transition-fast);">
                <img src="/share.svg" alt="공유" class="icon icon-md" />
              </button>
            </div>

            ${!user.isGuest ? `
              <div style="width: 100%; display: flex; align-items: center; justify-content: center; gap: var(--space-1); font-size: var(--text-sm); color: var(--warning); margin-top: var(--space-2); padding-bottom: var(--space-1);">
                <span style="font-size: 16px;">💡</span>
                <span>친구 초대 시 +1 코인</span>
              </div>
            ` : ''}

            ${user.isGuest && state.coins <= 0 ? `<button id="login-redirect-btn" style="margin-top:16px; text-decoration:underline;">로그인하고 계속하기</button>` : ''}
        </div>
      </div>

      <!-- XP Modal -->
      <div id="xp-modal" class="hidden" style="
          position:absolute; top:0; left:0; width:100%; height:100%;
          background:rgba(0,0,0,0.85); z-index:100;
          display:flex; justify-content:center; align-items:center;">
          <div class="card" style="width:80%; max-width:300px; text-align:center; position:relative; background: var(--gray-800); padding: var(--space-6);">
              <button id="close-modal" style="position:absolute; top: var(--space-3); right: var(--space-3); color: var(--gray-100); font-size: var(--text-lg); background: none; border: none; cursor: pointer;">✕</button>
              <h3 style="margin-bottom: var(--space-4); font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--gray-100);">레벨 진행도</h3>
              <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--primary-500); margin-bottom: var(--space-3);">
                  Lv. ${state.level}
              </div>
              <div class="xp-bar-container" style="background: var(--gray-700); height: 10px; border-radius: var(--radius-full); margin-bottom: var(--space-3); overflow: hidden;">
                 <div id="xp-bar-fill" style="background: var(--primary-500); height:100%; width:0%; transition: var(--transition-base);"></div>
              </div>
              <div id="xp-text" style="color: var(--gray-400); font-size: var(--text-sm); margin-bottom: var(--space-6);">0 / 0 XP (0%)</div>

              <button id="logout-btn" style="border: 1px solid var(--gray-600); padding: var(--space-2) var(--space-4); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--gray-300); background: none; cursor: pointer;">로그아웃</button>
          </div>
      </div>
    `

    // Fetch Ranking
    this.loadRanking()

    // Fetch Weekly Activity (if not guest)
    if (!user.isGuest) {
      this.loadWeeklyActivity()
    }

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
      playBtn.addEventListener('click', async () => {
        const _state = store.getState()
        const user = _state.user

        if (user?.isGuest) {
          const sessionData = localStorage.getItem('guest_session_used')
          const sessionUsed = sessionData ? JSON.parse(sessionData).used : false

          if (sessionUsed) {
            // 세션 사용 완료 - 로그인 실행
            await authService.signInWithGoogle()
            return
          }

          // 세션 사용 표시 및 게임 시작
          localStorage.setItem('guest_session_used', JSON.stringify({
            used: true,
            timestamp: Date.now()
          }))
          import('../core/router.js').then(r => r.navigateTo('/game'))
        } else {
          // 로그인 사용자 플로우
          if (_state.coins > 0) {
            // 하드모드 여부에 따라 라우팅
            const targetPath = _state.isHardMode ? '/game/hard' : '/game'
            import('../core/router.js').then(r => r.navigateTo(targetPath))
          }
        }
      });
    }

    // Hard Mode Toggle Event Handler
    const hardModeToggle = document.getElementById('hard-mode-toggle')
    if (hardModeToggle) {
      hardModeToggle.addEventListener('change', (e) => {
        store.setState({ isHardMode: e.target.checked })
        this.loadRanking()
      })
    }

    // Hard Mode Tooltip Handler
    const tooltipIcon = document.getElementById('hard-mode-tooltip-icon')
    const tooltipModal = document.getElementById('hard-mode-tooltip')
    if (tooltipIcon && tooltipModal) {
      tooltipIcon.addEventListener('click', (e) => {
        e.stopPropagation()
        tooltipModal.classList.remove('hidden')
      })

      // Close on clicking anywhere
      tooltipModal.addEventListener('click', () => {
        tooltipModal.classList.add('hidden')
      })
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

        if (user?.isGuest) {
          // 비회원 공유 - 추천 코드 없음
          const shareUrl = window.location.origin
          const shareText = '집중력 게임 Focus에 도전해보세요!'
          copyToClipboard(shareText, shareUrl, true)
          return
        }

        if (!user) {
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
              copyToClipboard(shareText, shareUrl, false)
            }
          }
        } else {
          // Desktop: Copy to clipboard
          copyToClipboard(shareText, shareUrl, false)
        }
      })
    }

    function copyToClipboard(text, url, isGuest = false) {
      const fullText = `${text}\n${url}`

      // Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(fullText).then(() => {
          if (isGuest) {
            alert('클립보드에 복사되었습니다. 공유해보세요!')
          } else {
            alert('공유 링크가 클립보드에 복사되었습니다!\n\n친구가 이 링크로 가입하면 +1 코인을 받아요!')
          }
        }).catch(err => {
          console.error('Clipboard write failed:', err)
          fallbackCopyToClipboard(fullText, isGuest)
        })
      } else {
        // Fallback for older browsers or non-secure contexts
        fallbackCopyToClipboard(fullText, isGuest)
      }
    }

    function fallbackCopyToClipboard(text, isGuest = false) {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        if (isGuest) {
          alert('클립보드에 복사되었습니다. 공유해보세요!')
        } else {
          alert('공유 링크가 복사되었습니다!')
        }
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
    const currentMode = state.isHardMode ? 'hard' : 'normal'

    // Fetch weekly ranking (모드별)
    const rankings = await dataService.fetchWeeklyRanking(currentMode)
    if (!rankings || rankings.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; color: var(--gray-500); font-size: var(--text-sm);">아직 기록이 없습니다</div>`
    } else {
      listEl.innerHTML = rankings.map((r, idx) => `
              <div class="rank-item" style="display:flex; justify-content:space-between; align-items: center; padding: var(--space-2) 0; border-bottom:1px solid var(--gray-700);">
                  <div style="display: flex; align-items: center; gap: var(--space-2);">
                      <span style="font-size: var(--text-base); color: var(--gray-100);">${idx + 1}. ${r.users?.nickname || 'Anonymous'}</span>
                      <span class="level-badge" style="font-size: var(--text-xs); padding: var(--space-1) var(--space-2);">Lv. ${r.users?.level || 1}</span>
                  </div>
                  <span style="margin-right: var(--space-4); font-size: var(--text-base); font-weight: var(--font-medium); color: var(--gray-300);">${r.max_round}R</span>
              </div>
          `).join('')
    }

    // Fetch my rank (if not guest) (모드별)
    if (user && !user.isGuest) {
      const myRankInfo = document.getElementById('my-rank-info')
      if (myRankInfo) {
        const { rank, maxRound } = await dataService.getMyRank(user.id, currentMode)

        if (rank) {
          myRankInfo.innerHTML = `
            <div style="font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--theme-primary); transition: color var(--theme-transition);">#${rank}</div>
            <div style="font-size: var(--text-sm); color: var(--gray-400);">최고 기록: ${maxRound}R</div>
          `
        } else {
          myRankInfo.innerHTML = `
            <div style="font-size: var(--text-sm); color: var(--gray-400);">아직 기록이 없습니다</div>
          `
        }
      }
    }
  }

  async loadWeeklyActivity() {
    const state = store.getState()
    const user = state.user

    if (!user || user.isGuest) return

    console.log('📊 Loading weekly activity for user:', user.id)

    // Fetch weekly activity data
    const weeklyActivity = await dataService.fetchWeeklyActivity(user.id)
    console.log('📊 Fetched records:', weeklyActivity.length)
    console.log('📊 Records:', weeklyActivity)

    // Calculate streak
    const streak = dataService.calculateStreak(weeklyActivity)
    console.log('🔥 Calculated streak:', streak)

    // Get chart data
    const chartData = dataService.getWeeklyActivityChart(weeklyActivity)
    console.log('📈 Chart data:', chartData)

    // Update streak badge
    const streakBadge = document.getElementById('streak-badge')
    if (streakBadge && streak > 0) {
      streakBadge.innerHTML = `
        <span style="font-size: 16px;">🔥</span>
        <span style="font-size: var(--text-sm); font-weight: var(--font-bold); color: var(--warning);">${streak}일 연속</span>
      `
    } else if (streakBadge) {
      streakBadge.innerHTML = `
        <span style="font-size: var(--text-xs); color: var(--gray-500);">연속 플레이 없음</span>
      `
    }

    // Render activity chart
    const chartContainer = document.getElementById('activity-chart')
    if (chartContainer) {
      chartContainer.innerHTML = chartData.map(day => `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: var(--space-1);">
          <div style="
            width: 100%;
            height: 32px;
            background: ${day.played ? 'var(--theme-primary)' : 'var(--gray-700)'};
            border-radius: var(--radius-sm);
            transition: background-color var(--theme-transition), border-color var(--theme-transition);
            ${day.isToday ? 'border: 1px solid var(--theme-primary);' : ''}
          "></div>
          <span style="font-size: var(--text-xs); color: ${day.isToday ? 'var(--gray-100)' : 'var(--gray-500)'}; font-weight: ${day.isToday ? 'var(--font-bold)' : 'var(--font-normal)'};">${day.day}</span>
        </div>
      `).join('')
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

