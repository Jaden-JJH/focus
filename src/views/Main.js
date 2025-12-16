import { authService } from '../services/authService.js'
import { store } from '../core/store.js'
import { dataService } from '../services/dataService.js'
import { LEVELS, LEVEL_DATA } from '../config/gameConfig.js'

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
      <style>
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes floating {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow: 0 2px 20px rgba(124, 77, 255, 0.6), 0 0 30px rgba(124, 77, 255, 0.3);
          }
        }

        @keyframes pulseHard {
          0%, 100% {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow: 0 2px 20px rgba(239, 68, 68, 0.6), 0 0 30px rgba(239, 68, 68, 0.3);
          }
        }

        @keyframes slideUpBar {
          from {
            height: 0;
          }
          to {
            height: 32px;
          }
        }

        @keyframes shimmer {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes imagePulse {
          0%, 100% {
            box-shadow: 0 0 0 rgba(124, 77, 255, 0);
          }
          50% {
            box-shadow: 0 0 30px rgba(124, 77, 255, 0.6), 0 0 60px rgba(124, 77, 255, 0.3);
          }
        }

        @keyframes imagePulseHard {
          0%, 100% {
            box-shadow: 0 0 0 rgba(239, 68, 68, 0);
          }
          50% {
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.3);
          }
        }

        @keyframes pulseGold {
          0%, 100% {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow: 0 2px 20px rgba(251, 191, 36, 0.6), 0 0 30px rgba(251, 191, 36, 0.3);
          }
        }

        @keyframes imagePulseGold {
          0%, 100% {
            box-shadow: 0 0 0 rgba(251, 191, 36, 0);
          }
          50% {
            box-shadow: 0 0 30px rgba(251, 191, 36, 0.6), 0 0 60px rgba(251, 191, 36, 0.3);
          }
        }

        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .main-container {
          animation: fadeInUp 0.5s cubic-bezier(0.19, 1, 0.22, 1) forwards;
          background: linear-gradient(180deg, #0a0a0a 0%, #121212 50%, #0a0a0a 100%);
          background-size: 100% 200%;
          animation: fadeInUp 0.5s cubic-bezier(0.19, 1, 0.22, 1) forwards, gradientShift 20s ease infinite;
        }

        .main-header-fixed {
          animation: fadeInUp 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards;
          animation-delay: 0.1s;
          opacity: 0;
        }

        .main-content-scroll {
          animation: fadeInUp 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards;
          animation-delay: 0.2s;
          opacity: 0;
        }

        .action-area-fixed {
          animation: fadeInUp 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }

        .level-image-container {
          animation: floating 3s ease-in-out infinite;
          transition: transform 0.3s ease;
        }

        .level-image-container:hover {
          transform: translateY(-8px) scale(1.05);
        }

        .activity-bar {
          animation: slideUpBar 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards;
        }

        .card-with-shimmer {
          position: relative;
          overflow: hidden;
        }

        .card-with-shimmer::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.05), transparent);
          animation: shimmer 3s ease-in-out infinite;
          pointer-events: none;
        }
      </style>
      <div class="main-container">
        <!-- Fixed Header -->
        <header class="main-header main-header-fixed">
           <div style="display: flex; align-items: center; gap: var(--space-2);">
             <div id="focus-logo" style="
               font-size: var(--text-lg);
               font-weight: var(--font-bold);
               background: ${state.isHardMode
                 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                 : 'linear-gradient(135deg, #7c4dff 0%, #6a3de8 100%)'};
               -webkit-background-clip: text;
               -webkit-text-fill-color: transparent;
               background-clip: text;
               transition: all 0.3s ease;
             ">Focus</div>
             <div class="user-info" id="user-info-area" style="cursor: pointer; display: flex; align-items: center;">
               <span class="nickname" style="line-height: 1;">${user.nickname || 'Unknown'}</span>
             </div>
           </div>
           ${!user.isGuest ? `
           <div id="coin-info" class="currency" style="display: flex; align-items: center; gap: var(--space-1); cursor: pointer;">
             <span style="font-size: 20px; line-height: 1;">🪙</span>
             <span style="font-size: var(--text-base); font-weight: var(--font-bold); color: var(--warning); line-height: 1;">${state.coins}</span>
           </div>
           ` : ''}
        </header>

        <!-- Scrollable Content Area -->
        <div class="main-content-scroll">

        <!-- XP Progress Card -->
        ${!user.isGuest ? `
        <div class="card-with-shimmer" style="
          background: var(--gray-800);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          margin-bottom: var(--space-4);
          flex-shrink: 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05);
        ">
          <!-- Header: Title & View All Button -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
            <div style="font-size: var(--text-base); font-weight: var(--font-bold); color: white;">
              내 집중력 레벨
            </div>
            <button id="view-all-levels-btn" style="
              background: none;
              border: none;
              color: var(--gray-300);
              font-size: var(--text-sm);
              cursor: pointer;
              padding: var(--space-1);
              transition: color 0.2s;
            " onmouseover="this.style.color='white'" onmouseout="this.style.color='var(--gray-300)'">
              전체 레벨 &gt;
            </button>
          </div>

          <!-- Level Image & Badge -->
          <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: var(--space-3);">
            <div class="level-image-container" style="position: relative; margin-bottom: var(--space-3);">
              <img src="${LEVELS.getLevelImage(state.level)}" alt="Level ${state.level}" style="
                width: 160px;
                height: 160px;
                border-radius: var(--radius-md);
                object-fit: cover;
                animation: ${(() => {
                  const lv = state.level;
                  const isHard = state.isHardMode;
                  if (lv < 10) return 'none';
                  if (lv < 40) return isHard ? 'imagePulseHard 3s ease-in-out infinite' : 'imagePulse 3s ease-in-out infinite';
                  if (lv < 61) return 'imagePulseGold 3s ease-in-out infinite';
                  return isHard ? 'imagePulseHard 3s ease-in-out infinite' : 'imagePulse 3s ease-in-out infinite';
                })()};
              " />
              <div style="
                position: absolute;
                bottom: -12px;
                left: 50%;
                transform: translateX(-50%);
                background: ${(() => {
                  const lv = state.level;
                  const isHard = state.isHardMode;
                  if (lv < 10) return isHard ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #7c4dff 0%, #6a3de8 100%)';
                  if (lv < 30) return isHard ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #7c4dff 0%, #6a3de8 100%)';
                  if (lv < 40) return isHard ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #9d6fff 0%, #7c4dff 50%, #6a3de8 100%)';
                  if (lv < 50) return isHard ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #7c4dff 0%, #6a3de8 100%)';
                  if (lv < 60) return 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
                  if (lv === 60) return 'linear-gradient(135deg, #1e1e1e 0%, #0a0a0a 100%)';
                  return 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)';
                })()};
                color: ${(() => {
                  const lv = state.level;
                  const isHard = state.isHardMode;
                  if (lv >= 50 && lv < 60) return '#1e1e1e';
                  if (lv === 61) return isHard ? '#ef4444' : '#7c4dff';
                  return 'white';
                })()};
                padding: var(--space-1) var(--space-3);
                border-radius: var(--radius-full);
                font-size: var(--text-sm);
                font-weight: var(--font-bold);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                animation: ${(() => {
                  const lv = state.level;
                  const isHard = state.isHardMode;
                  if (lv < 10) return 'none';
                  if (lv < 40) return isHard ? 'pulseHard 2s ease-in-out infinite' : 'pulse 2s ease-in-out infinite';
                  if (lv < 61) return 'pulseGold 2s ease-in-out infinite';
                  return isHard ? 'pulseHard 2s ease-in-out infinite' : 'pulse 2s ease-in-out infinite';
                })()};
              ">
                Lv ${state.level}
              </div>
            </div>
            <div style="font-size: var(--text-lg); color: white; font-weight: var(--font-bold); margin-top: var(--space-1);">
              ${state.level === 0 ? '주의력 결핍' : LEVELS.getLevelInfo(state.level).name}
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="xp-bar-container" style="background: var(--gray-700); height: 8px; border-radius: var(--radius-full); margin-bottom: var(--space-2); overflow: hidden;">
            <div class="xp-bar-fill" style="background: var(--theme-xp-bar); height: 100%; width: ${(() => {
              const { percent } = LEVELS.calcXpProgress(state.totalXp, state.level)
              return percent
            })()}%; transition: width var(--transition-base), background-color var(--theme-transition);"></div>
          </div>

          <!-- Progress Text (Symmetrical Layout) -->
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
        <div id="weekly-activity-card" class="card-with-shimmer" style="
          background: var(--gray-800);
          border-radius: var(--radius-md);
          padding: var(--space-3);
          margin-bottom: var(--space-4);
          flex-shrink: 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05);
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
            <div style="font-size: var(--text-base); color: var(--gray-100); font-weight: var(--font-bold);">주간 활동</div>
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
              padding: var(--space-1) 0;
              margin-bottom: var(--space-1);
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

            ${user.isGuest && state.coins <= 0 ? `<button id="login-redirect-btn" style="margin-top:16px; text-decoration:underline;">로그인하고 계속하기</button>` : ''}
        </div>
      </div>

      <!-- Hard Mode Tooltip Modal -->
      <div id="hard-mode-tooltip-backdrop" class="hidden" style="
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        z-index: 100;
        display: flex;
        justify-content: center;
        align-items: center;
      ">
        <div style="
          width: 90%;
          max-width: 320px;
          background: var(--gray-800);
          border: 1px solid var(--error);
          border-radius: var(--radius-md);
          padding: var(--space-6);
          text-align: center;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
          position: relative;
        ">
          <div style="font-size: 2rem; margin-bottom: var(--space-3);">⚠️</div>
          <h3 style="font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--error); margin-bottom: var(--space-3);">하드모드란?</h3>
          <p style="font-size: var(--text-base); color: var(--gray-100); line-height: 1.6; margin-bottom: var(--space-2);">
            하드모드는 <strong style="color: var(--error);">오답을 체크하면 바로 게임오버</strong>가 되는 모드입니다. 고난이도 게임이 추가됩니다.
          </p>
          <p style="font-size: var(--text-xs); color: var(--gray-500); margin-top: var(--space-3);">
            Lv 5부터 플레이 가능
          </p>
        </div>
      </div>

      <!-- Hard Mode Level Restriction Modal -->
      <div id="hard-mode-level-lock-backdrop" class="hidden" style="
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        z-index: 100;
        display: flex;
        justify-content: center;
        align-items: center;
      ">
        <div style="
          width: 90%;
          max-width: 300px;
          background: var(--gray-800);
          border: 1px solid var(--error);
          border-radius: var(--radius-md);
          padding: var(--space-6);
          text-align: center;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
          position: relative;
        ">
          <div style="font-size: 2rem; margin-bottom: var(--space-3);">🔒</div>
          <h3 style="font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--error); margin-bottom: var(--space-2);">하드모드 잠김</h3>
          <p style="font-size: var(--text-base); color: var(--gray-100);">
            Lv 5부터 플레이 가능합니다.
          </p>
        </div>
      </div>

      <!-- Coin Info Tooltip Modal -->
      <div id="coin-info-tooltip-backdrop" class="hidden" style="
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        z-index: 100;
        display: flex;
        justify-content: center;
        align-items: center;
      ">
        <div style="
          width: 90%;
          max-width: 320px;
          background: var(--gray-800);
          border: 1px solid var(--warning);
          border-radius: var(--radius-md);
          padding: var(--space-6);
          text-align: center;
          box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
          position: relative;
        ">
          <div style="font-size: 2rem; margin-bottom: var(--space-3);">🪙</div>
          <h3 style="font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--warning); margin-bottom: var(--space-3);">코인 획득 방법</h3>
          <p style="font-size: var(--text-base); color: var(--gray-100); line-height: 1.6; margin-bottom: var(--space-4);">
            친구 초대 시 <strong style="color: var(--warning);">+1 코인</strong> 지급
          </p>
          <button id="coin-share-btn" style="
            width: 100%;
            padding: var(--space-3);
            background: var(--warning);
            color: var(--gray-900);
            border: none;
            border-radius: var(--radius-md);
            font-size: var(--text-base);
            font-weight: var(--font-bold);
            cursor: pointer;
            transition: var(--transition-fast);
          " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
            공유하기
          </button>
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

      <!-- All Levels Modal -->
      <div id="all-levels-modal" class="hidden" style="
          position:absolute; top:0; left:0; width:100%; height:100%;
          background:rgba(0,0,0,0.9); z-index:100;
          display:flex; justify-content:center; align-items:center; overflow: hidden;">
          <div style="width:90%; max-width:500px; max-height:90%; background: var(--gray-800); border-radius: var(--radius-lg); position:relative; display: flex; flex-direction: column; overflow: hidden;">
              <button id="close-all-levels-modal" style="position:absolute; top: var(--space-3); right: var(--space-3); color: var(--gray-100); font-size: var(--text-xl); background: none; border: none; cursor: pointer; z-index: 10;">✕</button>

              <!-- Header -->
              <div style="padding: var(--space-4); border-bottom: 1px solid var(--gray-700);">
                <h3 style="font-size: var(--text-xl); font-weight: var(--font-bold); color: white; text-align: center;">전체 레벨</h3>
                <div style="text-align: center; margin-top: var(--space-2); font-size: var(--text-sm); color: var(--gray-400);">
                  현재 레벨: <span style="color: var(--warning); font-weight: var(--font-bold);">Lv ${state.level}</span>
                </div>
              </div>

              <!-- Level Grid Container -->
              <div id="level-grid-container" style="flex: 1; padding: var(--space-4); overflow-y: auto;">
                <!-- Content will be injected by JS -->
              </div>

              <!-- Navigation -->
              <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-4); border-top: 1px solid var(--gray-700);">
                <button id="prev-page-btn" style="
                  background: var(--gray-700);
                  border: 1px solid var(--gray-600);
                  color: white;
                  padding: var(--space-2) var(--space-4);
                  border-radius: var(--radius-md);
                  cursor: pointer;
                  font-size: var(--text-sm);
                  transition: 0.2s;
                " onmouseover="this.style.background='var(--gray-600)'" onmouseout="this.style.background='var(--gray-700)'">
                  &lt; 이전
                </button>
                <div id="page-indicator" style="font-size: var(--text-sm); color: var(--gray-300);"></div>
                <button id="next-page-btn" style="
                  background: var(--gray-700);
                  border: 1px solid var(--gray-600);
                  color: white;
                  padding: var(--space-2) var(--space-4);
                  border-radius: var(--radius-md);
                  cursor: pointer;
                  font-size: var(--text-sm);
                  transition: 0.2s;
                " onmouseover="this.style.background='var(--gray-600)'" onmouseout="this.style.background='var(--gray-700)'">
                  다음 &gt;
                </button>
              </div>
          </div>
      </div>
    `

    // Fetch Ranking
    this.loadRanking()

    // Fetch Weekly Activity (if not guest)
    if (!user.isGuest) {
      this.loadWeeklyActivity()
    }

    // Setup All Levels Modal
    if (!user.isGuest) {
      this.setupAllLevelsModal()
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

        // 📊 Analytics: game_start event
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          'event': 'game_start',
          'mode': _state.isHardMode ? 'hard' : 'normal',
          'user_type': user?.isGuest ? 'guest' : 'member',
          'level': _state.level,
          'coins': _state.coins
        });

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
        const _state = store.getState()

        // 레벨 5 미만이면 토글을 원래 상태로 되돌리고 경고 모달 표시
        if (_state.level < 5) {
          e.preventDefault()
          hardModeToggle.checked = false

          // 레벨 제한 모달 표시
          const levelLockBackdrop = document.getElementById('hard-mode-level-lock-backdrop')
          if (levelLockBackdrop) {
            levelLockBackdrop.classList.remove('hidden')
          }
          return
        }

        // 📊 Analytics: toggle_hard_mode event
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          'event': 'toggle_hard_mode',
          'enabled': e.target.checked,
          'level': _state.level
        });

        store.setState({ isHardMode: e.target.checked })
        this.loadRanking()
      })
    }

    // Hard Mode Tooltip Handler
    const tooltipIcon = document.getElementById('hard-mode-tooltip-icon')
    const tooltipBackdrop = document.getElementById('hard-mode-tooltip-backdrop')
    if (tooltipIcon && tooltipBackdrop) {
      tooltipIcon.addEventListener('click', (e) => {
        e.stopPropagation()
        tooltipBackdrop.classList.remove('hidden')
      })

      // Close on clicking backdrop
      tooltipBackdrop.addEventListener('click', (e) => {
        if (e.target === tooltipBackdrop) {
          tooltipBackdrop.classList.add('hidden')
        }
      })
    }

    // Hard Mode Level Lock Handler
    const levelLockBackdrop = document.getElementById('hard-mode-level-lock-backdrop')
    if (levelLockBackdrop) {
      levelLockBackdrop.addEventListener('click', (e) => {
        if (e.target === levelLockBackdrop) {
          levelLockBackdrop.classList.add('hidden')
        }
      })
    }

    // Coin Info Tooltip Handler
    const coinInfo = document.getElementById('coin-info')
    const coinTooltipBackdrop = document.getElementById('coin-info-tooltip-backdrop')
    const coinShareBtn = document.getElementById('coin-share-btn')

    if (coinInfo && coinTooltipBackdrop) {
      coinInfo.addEventListener('click', (e) => {
        e.stopPropagation()

        // 📊 Analytics: click_coin_info event
        const _state = store.getState()
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          'event': 'click_coin_info',
          'coins': _state.coins
        });

        coinTooltipBackdrop.classList.remove('hidden')
      })

      // Close on clicking backdrop (but not modal content)
      const closeCoinTooltip = () => {
        coinTooltipBackdrop.classList.add('hidden')
      }

      coinTooltipBackdrop.addEventListener('click', (e) => {
        if (e.target === coinTooltipBackdrop) {
          closeCoinTooltip()
        }
      })

      // Share button handler
      if (coinShareBtn) {
        coinShareBtn.addEventListener('click', async (e) => {
          e.stopPropagation()

          const _state = store.getState()
          const user = _state.user

          if (!user || user.isGuest) {
            return
          }

          const referralCode = user.referral_code
          const shareUrl = `${window.location.origin}/?ref=${referralCode}`
          const shareText = `집중력 게임 Focus에 도전해보세요! \n 추천 코드로 시작하면 보너스 코인을 드려요!`

          // Check if Web Share API is supported (mainly mobile)
          if (navigator.share && navigator.canShare) {
            try {
              await navigator.share({
                title: 'Focus - 집중력 게임',
                text: shareText,
                url: shareUrl
              })
              console.log('Successfully shared via native share')
              closeCoinTooltip()
            } catch (err) {
              if (err.name !== 'AbortError') {
                console.error('Error sharing:', err)
                // Fallback to clipboard
                copyToClipboard(shareText, shareUrl, false)
                closeCoinTooltip()
              }
            }
          } else {
            // Desktop: Copy to clipboard
            copyToClipboard(shareText, shareUrl, false)
            closeCoinTooltip()
          }
        })
      }
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

        const shareMethod = (navigator.share && navigator.canShare) ? 'native_share' : 'clipboard';

        // 📊 Analytics: share event
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          'event': 'share',
          'method': shareMethod,
          'content_type': 'referral',
          'user_type': user?.isGuest ? 'guest' : 'member'
        });

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
      listEl.innerHTML = rankings.map((r, idx) => {
        const lv = r.users?.level || 1;
        const isHard = currentMode === 'hard';

        // 레벨별 배경색
        let background;
        if (lv < 10) background = isHard ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #7c4dff 0%, #6a3de8 100%)';
        else if (lv < 30) background = isHard ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #7c4dff 0%, #6a3de8 100%)';
        else if (lv < 40) background = isHard ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #9d6fff 0%, #7c4dff 50%, #6a3de8 100%)';
        else if (lv < 50) background = isHard ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #7c4dff 0%, #6a3de8 100%)';
        else if (lv < 60) background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
        else if (lv === 60) background = 'linear-gradient(135deg, #1e1e1e 0%, #0a0a0a 100%)';
        else background = 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)';

        // 레벨별 텍스트 색상
        let color = 'white';
        if (lv >= 50 && lv < 60) color = '#1e1e1e';
        if (lv === 61) color = isHard ? '#ef4444' : '#7c4dff';

        // 레벨별 애니메이션
        let animation = 'none';
        if (lv >= 10 && lv < 40) animation = isHard ? 'pulseHard 2s ease-in-out infinite' : 'pulse 2s ease-in-out infinite';
        else if (lv >= 40 && lv < 61) animation = 'pulseGold 2s ease-in-out infinite';
        else if (lv === 61) animation = isHard ? 'pulseHard 2s ease-in-out infinite' : 'pulse 2s ease-in-out infinite';

        return `
              <div class="rank-item" style="display:flex; justify-content:space-between; align-items: center; padding: var(--space-2) 0; border-bottom:1px solid var(--gray-700);">
                  <div style="display: flex; align-items: center; gap: var(--space-2);">
                      <span style="font-size: var(--text-base); color: var(--gray-100);">${idx + 1}. ${r.users?.nickname || 'Anonymous'}</span>
                      <span style="
                        font-size: var(--text-xs);
                        padding: var(--space-1) var(--space-2);
                        background: ${background};
                        color: ${color};
                        border-radius: var(--radius-full);
                        font-weight: var(--font-bold);
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                        animation: ${animation};
                      ">Lv. ${lv}</span>
                  </div>
                  <span style="margin-right: var(--space-4); font-size: var(--text-base); font-weight: var(--font-medium); color: var(--gray-300);">${r.max_round}R</span>
              </div>
          `;
      }).join('')
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
      chartContainer.innerHTML = chartData.map((day, index) => `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: var(--space-1);">
          <div class="activity-bar" style="
            width: 100%;
            height: 32px;
            background: ${day.played ? 'var(--theme-primary)' : 'var(--gray-700)'};
            border-radius: var(--radius-sm);
            transition: background-color var(--theme-transition), border-color var(--theme-transition);
            ${day.isToday ? 'border: 1px solid var(--theme-primary);' : ''}
            animation-delay: ${index * 0.1}s;
          "></div>
          <span style="font-size: var(--text-xs); color: ${day.isToday ? 'var(--gray-100)' : 'var(--gray-500)'}; font-weight: ${day.isToday ? 'var(--font-bold)' : 'var(--font-normal)'};">${day.day}</span>
        </div>
      `).join('')
    }
  }

  setupAllLevelsModal() {
    const viewAllBtn = document.getElementById('view-all-levels-btn')
    const allLevelsModal = document.getElementById('all-levels-modal')
    const closeAllLevelsModal = document.getElementById('close-all-levels-modal')

    if (!viewAllBtn || !allLevelsModal || !closeAllLevelsModal) return

    let currentPage = 1
    const totalPages = 6
    let imagesPreloaded = false

    // Preload all level images
    const preloadAllImages = () => {
      if (imagesPreloaded) return
      imagesPreloaded = true

      // Preload images for all levels (1-61)
      for (let i = 1; i <= 61; i++) {
        const img = new Image()
        img.src = LEVELS.getLevelImage(i)
      }
    }

    // Open modal
    viewAllBtn.addEventListener('click', () => {
      const state = store.getState()
      const userLevel = state.level

      // Preload images on first modal open
      preloadAllImages()

      // Calculate which page the user's level is on
      if (userLevel <= 12) currentPage = 1
      else if (userLevel <= 24) currentPage = 2
      else if (userLevel <= 36) currentPage = 3
      else if (userLevel <= 48) currentPage = 4
      else if (userLevel <= 60) currentPage = 5
      else currentPage = 6

      // 📊 Analytics: view_all_levels event
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        'event': 'view_all_levels',
        'current_level': userLevel,
        'page': currentPage
      });

      this.renderLevelPage(currentPage, userLevel)
      allLevelsModal.classList.remove('hidden')
    })

    // Close modal
    closeAllLevelsModal.addEventListener('click', () => {
      allLevelsModal.classList.add('hidden')
    })

    // Pagination
    const prevBtn = document.getElementById('prev-page-btn')
    const nextBtn = document.getElementById('next-page-btn')

    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--
        const state = store.getState()
        this.renderLevelPage(currentPage, state.level)
      }
    })

    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++
        const state = store.getState()
        this.renderLevelPage(currentPage, state.level)
      }
    })
  }

  renderLevelPage(page, userLevel) {
    const container = document.getElementById('level-grid-container')
    const pageIndicator = document.getElementById('page-indicator')
    const prevBtn = document.getElementById('prev-page-btn')
    const nextBtn = document.getElementById('next-page-btn')

    if (!container || !pageIndicator) return

    // Update pagination state
    prevBtn.disabled = page === 1
    prevBtn.style.opacity = page === 1 ? '0.5' : '1'
    prevBtn.style.cursor = page === 1 ? 'not-allowed' : 'pointer'

    nextBtn.disabled = page === 6
    nextBtn.style.opacity = page === 6 ? '0.5' : '1'
    nextBtn.style.cursor = page === 6 ? 'not-allowed' : 'pointer'

    pageIndicator.innerText = `${page} / 6`

    // Determine level range for this page
    let startLevel, endLevel
    if (page === 1) { startLevel = 1; endLevel = 12 }
    else if (page === 2) { startLevel = 13; endLevel = 24 }
    else if (page === 3) { startLevel = 25; endLevel = 36 }
    else if (page === 4) { startLevel = 37; endLevel = 48 }
    else if (page === 5) { startLevel = 49; endLevel = 60 }
    else if (page === 6) { startLevel = 61; endLevel = 61 }

    // Special layout for page 6 (Level 61 only)
    if (page === 6) {
      const levelInfo = LEVELS.getLevelInfo(61)
      const isLocked = levelInfo.locked && userLevel < 61
      const isUnlocked = userLevel >= 61

      container.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
          <div style="text-align: center;">
            <div style="
              width: 200px;
              height: 200px;
              border-radius: var(--radius-lg);
              overflow: hidden;
              margin: 0 auto var(--space-3);
              ${userLevel === 61 ? 'box-shadow: 0 0 30px rgba(255, 215, 64, 0.6);' : ''}
              ${!isUnlocked ? 'filter: brightness(0.3);' : ''}
            ">
              ${isLocked
                ? `<div style="width: 100%; height: 100%; background: var(--gray-700); display: flex; align-items: center; justify-content: center; font-size: 4rem;">❓</div>`
                : `<img src="${LEVELS.getLevelImage(61)}" alt="Level 61" style="width: 100%; height: 100%; object-fit: cover;" />`
              }
            </div>
            <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: white; margin-bottom: var(--space-1);">
              Lv 61
            </div>
            <div style="font-size: var(--text-lg); color: ${isLocked ? 'var(--gray-500)' : 'var(--gray-300)'};">
              ${isLocked ? '???' : levelInfo.name}
            </div>
            <div style="font-size: var(--text-sm); color: ${isLocked ? 'var(--gray-600)' : 'var(--gray-400)'}; margin-top: var(--space-2);">
              ${isLocked ? '???' : levelInfo.category}
            </div>
          </div>
        </div>
      `
      return
    }

    // Regular grid layout (3 rows x 4 cols)
    let gridHTML = '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3);">'

    for (let level = startLevel; level <= endLevel; level++) {
      const levelInfo = LEVELS.getLevelInfo(level)
      const isCurrentLevel = level === userLevel
      const isLocked = levelInfo.locked && userLevel < level
      const isUnlocked = userLevel >= level

      gridHTML += `
        <div style="text-align: center;">
          <div style="
            width: 100%;
            aspect-ratio: 1;
            border-radius: var(--radius-md);
            overflow: hidden;
            margin-bottom: var(--space-1);
            position: relative;
            ${isCurrentLevel ? 'box-shadow: 0 0 15px rgba(255, 215, 64, 0.8);' : ''}
            ${!isUnlocked ? 'filter: brightness(0.3);' : ''}
          ">
            ${isLocked
              ? `<div style="width: 100%; height: 100%; background: var(--gray-700); display: flex; align-items: center; justify-content: center; font-size: 2rem;">❓</div>`
              : `<img src="${LEVELS.getLevelImage(level)}" alt="Level ${level}" style="width: 100%; height: 100%; object-fit: cover;" />`
            }
          </div>
          <div style="font-size: var(--text-xs); font-weight: var(--font-bold); color: ${isCurrentLevel ? 'var(--warning)' : 'white'}; margin-bottom: 2px;">
            Lv ${level}
          </div>
          <div style="font-size: 0.65rem; color: ${isLocked ? 'var(--gray-600)' : 'var(--gray-400)'}; line-height: 1.2;">
            ${isLocked ? '???' : levelInfo.name}
          </div>
        </div>
      `
    }

    gridHTML += '</div>'
    container.innerHTML = gridHTML
  }

  destroy() {
    // Cleanup subscription
    if (this.unsub) {
      this.unsub()
      this.unsub = null
    }
  }
}

