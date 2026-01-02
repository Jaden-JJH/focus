import { dataService } from '../services/dataService.js'
import { store } from '../core/store.js'
import { LEVELS, LEVEL_DATA } from '../config/gameConfig.js'
import audioManager from '../utils/audioManager.js'

export default class Result {
    constructor(container) {
        this.container = container
    }

    // Helper functions for level badge styling (from Main.js pattern)
    getLevelBadgeGradient(level, isHardMode) {
        if (level < 10) return isHardMode ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #7c4dff 0%, #6a3de8 100%)';
        if (level < 30) return isHardMode ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #7c4dff 0%, #6a3de8 100%)';
        if (level < 40) return isHardMode ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #9d6fff 0%, #7c4dff 50%, #6a3de8 100%)';
        if (level < 50) return isHardMode ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #7c4dff 0%, #6a3de8 100%)';
        if (level < 60) return 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
        if (level === 60) return 'linear-gradient(135deg, #1e1e1e 0%, #0a0a0a 100%)';
        return 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)';
    }

    getLevelBadgeColor(level, isHardMode) {
        if (level >= 50 && level < 60) return '#1e1e1e';
        if (level === 61) return isHardMode ? '#ef4444' : '#7c4dff';
        return 'white';
    }

    getLevelBadgeAnimation(level, isHardMode) {
        if (level < 10) return 'none';
        if (level < 40) return isHardMode ? 'pulseHard 2s ease-in-out infinite' : 'pulse 2s ease-in-out infinite';
        if (level < 61) return 'pulseGold 2s ease-in-out infinite';
        return isHardMode ? 'pulseHard 2s ease-in-out infinite' : 'pulse 2s ease-in-out infinite';
    }

    async render() {
        const state = history.state || {} // Router pushState data
        const { round, xp, initialRank, initialMaxRound, isHardMode, maxCombo } = state
        const user = store.getState().user

        // 🎨 하드모드 테마 유지 (결과 화면에서도 빨간색 유지)
        if (isHardMode) {
            document.body.classList.add('hard-mode')
        } else {
            document.body.classList.remove('hard-mode')
        }

        // 🔊 1-9/1-10: GameOver 성공/실패 효과음
        if (user && round && !user.isGuest) {
            const mode = isHardMode ? 'hard' : 'normal';
            const userMaxRound = mode === 'hard' ? (user.max_round_hard || 0) : (user.max_round_normal || 0);
            const isSuccess = round >= userMaxRound;

            // GameOver 효과음 재생
            if (isSuccess) {
                audioManager.playGameOverSuccess();
            } else {
                audioManager.playGameOverFail();
            }
        }

        // Store initial level and XP before saving record
        const initialLevel = user ? user.level : 1
        const initialTotalXp = user ? (user.total_xp || 0) : 0
        const initialProgress = LEVELS.calcXpProgress(initialTotalXp, initialLevel)

        this.container.innerHTML = `
      <div class="main-container">
        <!-- Fixed Header -->
        <header class="main-header main-header-fixed" style="display: flex; justify-content: center; align-items: center; padding: 12px 16px;">
          <h2 style="font-size: 1.25rem; font-weight: var(--font-bold); color: var(--gray-100); margin: 0;">Game Over</h2>
        </header>

        <!-- Scrollable Content Area -->
        <div class="main-content-scroll">
        <!-- Result Card with unified width -->
        <div class="result-card" style="width: 100%; max-width: 400px; margin: 8px auto 16px; padding: 12px 16px; box-sizing: border-box;">
            <!-- 2열 레이아웃: 라운드 & 최대 콤보 -->
            <div style="display: flex; gap: 16px; margin-bottom: 6px;">
                <div class="result-row" style="flex: 1; margin: 0; font-size: 0.95rem;">
                    <span>라운드</span>
                    <span class="value">${round || 0}</span>
                </div>
                <div class="result-row" style="flex: 1; margin: 0; font-size: 0.95rem;">
                    <span>최대 콤보</span>
                    <span class="value" style="color: ${(maxCombo || 0) >= 10 ? '#fbbf24' : 'inherit'}">
                        ${maxCombo || 0}
                    </span>
                </div>
            </div>
            <!-- 경험치 (한 줄) -->
            <div class="result-row" style="margin-bottom: 6px; font-size: 0.95rem;">
                <span>경험치</span>
                <span class="value">+${xp || 0} XP</span>
            </div>
            ${isHardMode ? `
            <div style="margin-top: var(--space-2); text-align: center; font-size: var(--text-sm); color: var(--error); font-weight: var(--font-bold);">
                🔥 하드모드 보너스 (x3)
            </div>
            ` : ''}
        </div>

        <!-- XP Progress Section (Enhanced) -->
        ${user && !user.isGuest ? `
        <style>
          @keyframes floating {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          @keyframes pulse {
            0%, 100% { box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
            50% { box-shadow: 0 2px 20px rgba(124,77,255,0.6), 0 0 30px rgba(124,77,255,0.3); }
          }
          @keyframes pulseHard {
            0%, 100% { box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
            50% { box-shadow: 0 2px 20px rgba(239,68,68,0.6), 0 0 30px rgba(239,68,68,0.3); }
          }
          @keyframes pulseGold {
            0%, 100% { box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
            50% { box-shadow: 0 2px 20px rgba(251,191,36,0.6), 0 0 30px rgba(251,191,36,0.3); }
          }
        </style>
        <div class="xp-progress-section" style="width: 100%; max-width: 400px; margin: 0 auto 12px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); box-sizing: border-box;">
            <!-- Level Image with Badge -->
            <div class="level-image-container" style="
              position: relative;
              margin: 0 auto 12px;
              width: 100px;
              animation: floating 3s ease-in-out infinite;
            ">
              <img
                id="current-level-image"
                src="${LEVELS.getLevelImage(initialLevel)}"
                alt="Level ${initialLevel}"
                style="
                  width: 100px;
                  height: 100px;
                  border-radius: 12px;
                  object-fit: cover;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                "
              />
              <div id="level-badge" style="
                position: absolute;
                bottom: -10px;
                left: 50%;
                transform: translateX(-50%);
                background: ${this.getLevelBadgeGradient(initialLevel, isHardMode)};
                color: ${this.getLevelBadgeColor(initialLevel, isHardMode)};
                padding: 4px 12px;
                border-radius: 9999px;
                font-size: 0.8rem;
                font-weight: bold;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                animation: ${this.getLevelBadgeAnimation(initialLevel, isHardMode)};
                white-space: nowrap;
              ">
                Lv. ${initialLevel}
              </div>
            </div>

            <!-- Level Info -->
            <div style="text-align: center; margin-bottom: 10px;">
              <div id="level-name" style="
                font-size: 1rem;
                font-weight: bold;
                color: white;
              ">
                ${LEVELS.getLevelInfo(initialLevel).name}
              </div>
              <div id="level-category" style="
                font-size: 0.8rem;
                color: #aaa;
              ">
                ${LEVELS.getLevelInfo(initialLevel).category}
              </div>
            </div>

            <!-- XP Progress Bar (Enhanced) -->
            <div class="xp-bar-container" style="background: #333; height: 20px; border-radius: 10px; overflow: hidden; position: relative; border: 1px solid #555; margin-bottom: 6px;">
                <div id="xp-bar-fill" style="background: linear-gradient(90deg, var(--theme-accent) 0%, var(--color-warning) 100%); height: 100%; width: 0%; transition: width 1.5s ease-out, background 0.3s;"></div>
                <div id="xp-bar-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.75rem; font-weight: bold; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">
                    ${initialProgress.current} / ${initialProgress.max}
                </div>
            </div>

            <!-- XP Status -->
            <div style="text-align: center; font-size: 0.75rem; color: #888;" id="xp-status">
                Calculating...
            </div>

            <!-- Next Level Preview -->
            ${initialLevel < 61 ? `
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-top: 8px;
              padding: 6px 10px;
              background: rgba(255,255,255,0.03);
              border-radius: 8px;
            ">
              <img
                src="${LEVELS.getLevelImage(initialLevel + 1)}"
                style="
                  width: 36px;
                  height: 36px;
                  border-radius: 6px;
                  object-fit: cover;
                  ${LEVELS.getLevelInfo(initialLevel + 1).locked ? 'filter: brightness(0.3);' : ''}
                "
              />
              <div style="flex: 1;">
                <div style="font-size: 0.7rem; color: #888;">다음 레벨</div>
                <div style="font-size: 0.8rem; color: white; font-weight: 500;">
                  ${LEVELS.getLevelInfo(initialLevel + 1).locked
                    ? '???'
                    : LEVELS.getLevelInfo(initialLevel + 1).name}
                </div>
              </div>
            </div>
            ` : ''}
        </div>
        ` : ''}

        <!-- Rank Movement Section -->
        ${user && !user.isGuest ? `
        <div id="rank-movement-section" style="width: 100%; max-width: 400px; margin: 0 auto 12px; padding: 12px 16px; background: rgba(76,175,80,0.1); border-radius: 12px; border: 1px solid rgba(76,175,80,0.3); display: none; box-sizing: border-box;">
            <div style="text-align: center;">
                <div id="rank-movement-text" style="font-size: 0.95rem; font-weight: bold; color: var(--color-success);"></div>
                <div id="rank-movement-detail" style="font-size: 0.8rem; color: #aaa; margin-top: 4px;"></div>
            </div>
        </div>
        ` : ''}
        </div>
        <!-- End of Scrollable Content Area -->

        <!-- Fixed Action Area -->
        <div class="action-area action-area-fixed" style="max-width: 400px; margin: 0 auto;">
           ${user && user.isGuest ? `
           <div style="width: 100%; padding: 16px; background: rgba(255,193,7,0.1); border: 1px solid rgba(255,193,7,0.3); border-radius: 8px; margin-bottom: 16px; text-align: center;">
             <div style="font-size: 0.95rem; color: #ffc107; margin-bottom: 8px;">🎮 체험 플레이 완료!</div>
             <div style="font-size: 0.85rem; color: #aaa;">로그인하고 무제한으로 플레이하세요</div>
           </div>
           ` : ''}

           <div style="display: flex; gap: 10px; width: 100%;">
             <button id="retry-btn" class="btn-primary" style="flex: 4; min-height: 48px;">다시 시도</button>
             <button id="share-btn" style="flex: 1; min-height: 48px; background: #2a2a2a; border: 1px solid #ffc107; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">
               <img src="/share.svg" alt="공유" style="width: 20px; height: 20px; filter: brightness(0) saturate(100%) invert(82%) sepia(58%) saturate(497%) hue-rotate(359deg) brightness(103%) contrast(101%);">
             </button>
           </div>

           ${!user?.isGuest ? `
           <div style="width: 100%; text-align: center; font-size: 0.8rem; color: #ffc107; margin-top: 10px; padding: 8px 0;">
             💡 친구 초대 시 +1 코인
           </div>
           ` : ''}

           <button id="home-btn" style="margin-top: 8px; color: #888; background: transparent; border: none; cursor: pointer; padding: 8px;">메인으로</button>
        </div>
        <!-- End of Fixed Action Area -->
      </div>
      <!-- End of Main Container -->
    `

        document.getElementById('retry-btn').addEventListener('click', async () => {
            // 🔊 1-14: 버튼 클릭음
            audioManager.playButtonClick();

            const _state = store.getState()
            const user = _state.user

            if (user?.isGuest) {
                alert('로그인하고 계속 플레이하세요!')
                import('../core/router.js').then(r => r.navigateTo('/'))
                return
            }

            const currentCoins = _state.coins
            if (currentCoins > 0) {
                // 📊 Analytics: retry_game event
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                    'event': 'retry_game',
                    'previous_round': round || 0,
                    'coins': currentCoins,
                    'mode': isHardMode ? 'hard' : 'normal'
                });

                // Generate game token
                const gameToken = crypto.randomUUID()
                sessionStorage.setItem('game_token', gameToken)
                sessionStorage.setItem('game_token_time', Date.now().toString())

                // 하드모드 여부에 따라 라우팅
                const targetPath = isHardMode ? '/game/hard' : '/game'
                import('../core/router.js').then(r => r.navigateTo(targetPath))
            } else {
                alert('코인이 부족합니다.')
            }
        });

        document.getElementById('home-btn').addEventListener('click', () => {
            // 🔊 1-14: 버튼 클릭음
            audioManager.playButtonClick();
            import('../core/router.js').then(r => r.navigateTo('/main'));
        });

        // Share Button
        const shareBtn = document.getElementById('share-btn')
        if (shareBtn) {
            shareBtn.addEventListener('click', async () => {
                // 🔊 1-14: 버튼 클릭음
                audioManager.playButtonClick();

                const user = store.getState().user

                const shareMethod = (navigator.share && navigator.canShare) ? 'native_share' : 'clipboard';

                // 📊 Analytics: share event
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                    'event': 'share',
                    'method': shareMethod,
                    'content_type': 'game_result',
                    'round': round,
                    'user_type': user?.isGuest ? 'guest' : 'member'
                });

                if (user?.isGuest) {
                    const shareUrl = window.location.origin
                    const shareText = '집중력 게임 Focus에 도전해보세요!'
                    this.copyToClipboard(shareText, shareUrl, true)
                    return
                }

                if (!user) {
                    alert('로그인 후 공유할 수 있습니다!')
                    return
                }

                const referralCode = user.referral_code
                const shareUrl = `${window.location.origin}/?ref=${referralCode}`
                const shareText = `나는 ${round}라운드까지 도달했어! 당신은 몇 라운드까지 갈 수 있나요?`

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
                            this.copyToClipboard(shareText, shareUrl, false)
                        }
                    }
                } else {
                    // Desktop: Copy to clipboard
                    this.copyToClipboard(shareText, shareUrl, false)
                }
            })
        }

        // Save Record and Animate XP Progress
        if (user && round && !user.isGuest) {
            const oldLevel = user.level
            const oldTotalXp = user.total_xp || 0
            const oldMaxCombo = user.max_combo || 0
            const mode = isHardMode ? 'hard' : 'normal'
            // 🎯 Use initialMaxRound from game_records (fetched before game started)
            const oldMaxRound = initialMaxRound || 0

            try {
                // 🔒 Security: xp 값은 참고용이며, 실제로는 서버에서 재계산됩니다.
                // Supabase Trigger가 max_round 기반으로 정확한 XP를 계산합니다.
                await dataService.saveGameRecord(user.id, round, xp, mode, maxCombo || 0)

                const newUser = store.getState().user
                const newLevel = newUser.level
                const newTotalXp = newUser.total_xp || 0
                const newMaxCombo = newUser.max_combo || 0

                // Animate XP Progress Bar
                this.animateXpProgress(oldTotalXp, newTotalXp, oldLevel, newLevel, xp)

                // Get new rank and show rank movement
                const newRankData = await dataService.getMyRank(user.id, mode)
                this.showRankMovement(initialRank, newRankData.rank, newRankData.maxRound)

                // 신기록 체크
                const didLevelUp = newLevel > oldLevel
                const didBreakRoundRecord = round > oldMaxRound
                const didBreakComboRecord = (maxCombo || 0) > oldMaxCombo && (maxCombo || 0) > 0

                // 순차 팝업 타이밍 (레벨업 → 라운드 신기록 → 콤보 신기록)
                let delay = 1800  // XP 애니메이션 후

                if (didLevelUp) {
                    setTimeout(() => this.showLevelUp(newLevel), delay)
                    delay += 3500  // 레벨업 팝업 3초 + 여유 0.5초
                }

                if (didBreakRoundRecord) {
                    setTimeout(() => this.showMaxRoundRecord(round, mode), delay)
                    delay += 3500
                }

                if (didBreakComboRecord) {
                    setTimeout(() => this.showMaxComboRecord(maxCombo), delay)
                }
            } catch (e) {
                console.error("Failed to save record", e)
            }
        }
    }

    showRankMovement(oldRank, newRank, maxRound) {
        const rankMovementSection = document.getElementById('rank-movement-section')
        const rankMovementText = document.getElementById('rank-movement-text')
        const rankMovementDetail = document.getElementById('rank-movement-detail')

        if (!rankMovementSection || !rankMovementText || !rankMovementDetail) return

        // Add arrow animation keyframes (once)
        if (!document.getElementById('rank-arrow-animations')) {
            const style = document.createElement('style')
            style.id = 'rank-arrow-animations'
            style.textContent = `
                @keyframes arrowUp {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                @keyframes arrowDown {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(4px); }
                }
                @keyframes badgePulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
                    50% { transform: scale(1.05); box-shadow: 0 4px 16px rgba(251,191,36,0.4); }
                }
                @keyframes slideUpFadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `
            document.head.appendChild(style)
        }

        // Calculate rank change
        let message = ''
        let detailMessage = ''
        let backgroundColor = 'rgba(76,175,80,0.1)'
        let borderColor = 'rgba(76,175,80,0.3)'
        let textColor = 'var(--color-success)'
        let arrow = ''
        let arrowAnimation = ''

        if (!oldRank && newRank) {
            // First time ranking
            message = '🎉 랭킹 진입!'
            detailMessage = `현재 순위: ${newRank}위 (최고 기록: ${maxRound}R)`
        } else if (oldRank && newRank) {
            const rankChange = oldRank - newRank // Positive means rank improved (went up)

            if (rankChange > 0) {
                // Rank improved
                message = `${rankChange}위 상승!`
                detailMessage = `${oldRank}위 → ${newRank}위 (최고 기록: ${maxRound}R)`
                backgroundColor = 'rgba(76,175,80,0.1)'
                borderColor = 'rgba(76,175,80,0.3)'
                textColor = 'var(--color-success)'
                arrow = '↑'
                arrowAnimation = 'arrowUp 1s ease-in-out infinite'
            } else if (rankChange < 0) {
                // Rank dropped
                message = `${Math.abs(rankChange)}위 하락`
                detailMessage = `${oldRank}위 → ${newRank}위 (최고 기록: ${maxRound}R)`
                backgroundColor = 'rgba(255,82,82,0.1)'
                borderColor = 'rgba(255,82,82,0.3)'
                textColor = 'var(--color-danger)'
                arrow = '↓'
                arrowAnimation = 'arrowDown 1s ease-in-out infinite'
            } else {
                // Rank stayed the same
                message = '순위 유지'
                detailMessage = `현재 순위: ${newRank}위 (최고 기록: ${maxRound}R)`
                backgroundColor = 'rgba(255,215,64,0.1)'
                borderColor = 'rgba(255,215,64,0.3)'
                textColor = 'var(--color-warning)'
                arrow = ''
                arrowAnimation = 'none'
            }
        }

        // Create TOP badge if applicable
        let badgeHTML = ''
        if (newRank <= 3) {
            badgeHTML = `
                <div style="
                    display: inline-block;
                    margin-left: 8px;
                    padding: 4px 12px;
                    border-radius: 9999px;
                    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                    color: #1e1e1e;
                    font-size: 0.75rem;
                    font-weight: bold;
                    animation: badgePulse 2s ease-in-out infinite;
                    box-shadow: 0 2px 8px rgba(251,191,36,0.3);
                ">🏆 TOP 3</div>
            `
        } else if (newRank <= 10) {
            badgeHTML = `
                <div style="
                    display: inline-block;
                    margin-left: 8px;
                    padding: 4px 12px;
                    border-radius: 9999px;
                    background: linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%);
                    color: #1e1e1e;
                    font-size: 0.75rem;
                    font-weight: bold;
                    animation: badgePulse 2s ease-in-out infinite;
                    box-shadow: 0 2px 8px rgba(224,224,224,0.3);
                ">⭐ TOP 10</div>
            `
        }

        // Apply styles and show
        if (message) {
            rankMovementSection.style.background = backgroundColor
            rankMovementSection.style.borderColor = borderColor
            rankMovementSection.style.animation = 'slideUpFadeIn 0.3s ease-out'

            // Update content with arrow and badge
            rankMovementText.style.color = textColor
            rankMovementText.innerHTML = `
                <span style="
                    display: inline-block;
                    font-size: 1.5rem;
                    margin-right: 8px;
                    animation: ${arrowAnimation};
                    vertical-align: middle;
                ">${arrow}</span>
                <span style="vertical-align: middle;">${message}</span>
                ${badgeHTML}
            `
            rankMovementDetail.innerText = detailMessage

            setTimeout(() => {
                rankMovementSection.style.display = 'block'
            }, 1000) // Show after a short delay
        }
    }

    // Helper function for async delays
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    // Animate normal XP gain (no level up)
    _animateNormalXp(newProgress, earnedXp, elements) {
        const { xpBarFill, xpBarText, xpStatus } = elements

        // Step 1: Force bar to 0% instantly (remove transition)
        xpBarFill.style.transition = 'none'
        xpBarFill.style.width = '0%'

        // Step 2: Force browser reflow
        void xpBarFill.offsetWidth

        // Step 3: Re-enable transition and animate to target
        xpBarFill.style.transition = 'width 1.5s ease-out'
        xpBarFill.style.width = `${newProgress.percent}%`

        // Step 4: Update text
        xpBarText.innerText = `${newProgress.current} / ${newProgress.max}`
        xpStatus.innerHTML = `<span style="color: var(--theme-accent);">+${earnedXp} XP</span> 획득!`
    }

    // Animate level up sequence (4 stages, 2.3 seconds total)
    async _animateLevelUp(oldLevel, newLevel, oldProgress, newProgress, earnedXp, elements, isHardMode) {
        const { xpBarFill, xpBarText, xpStatus, levelBadge, levelImage, levelName, levelCategory } = elements

        // Stage 1: Fill current level to 100% (1.0s)
        xpBarFill.style.transition = 'width 1.0s ease-out'
        xpBarFill.style.width = '100%'
        xpBarText.innerText = `${oldProgress.max} / ${oldProgress.max}`
        await this._sleep(1000)

        // Stage 2: Celebration effect (0.3s)
        xpBarFill.style.background = 'linear-gradient(90deg, var(--color-warning) 0%, var(--theme-accent) 100%)'
        xpBarFill.style.boxShadow = '0 0 20px rgba(255, 215, 64, 0.6)'
        xpStatus.innerHTML = `🎉 <span style="color: var(--color-warning);">LEVEL UP!</span>`
        await this._sleep(300)

        // Stage 3: Level transition (0.2s)
        if (levelBadge) {
            levelBadge.innerText = `Lv. ${newLevel}`
            levelBadge.style.background = this.getLevelBadgeGradient(newLevel, isHardMode)
            levelBadge.style.color = this.getLevelBadgeColor(newLevel, isHardMode)
            levelBadge.style.animation = this.getLevelBadgeAnimation(newLevel, isHardMode)
        }
        if (levelImage) levelImage.src = LEVELS.getLevelImage(newLevel)
        if (levelName) levelName.innerText = LEVELS.getLevelInfo(newLevel).name
        if (levelCategory) levelCategory.innerText = LEVELS.getLevelInfo(newLevel).category

        // Reset bar instantly to 0%
        xpBarFill.style.transition = 'none'
        xpBarFill.style.width = '0%'
        xpBarFill.style.background = 'linear-gradient(90deg, var(--theme-accent) 0%, var(--color-warning) 100%)'
        xpBarFill.style.boxShadow = 'none'
        await this._sleep(200)

        // Stage 4: Fill new level progress (0.8s)
        void xpBarFill.offsetWidth // Force reflow
        xpBarFill.style.transition = 'width 0.8s ease-out'
        xpBarFill.style.width = `${newProgress.percent}%`
        xpBarText.innerText = `${newProgress.current} / ${newProgress.max}`
        xpStatus.innerHTML = `Lv. ${oldLevel} → Lv. ${newLevel}`
    }

    animateXpProgress(oldTotalXp, newTotalXp, oldLevel, newLevel, earnedXp) {
        // Get current state for isHardMode
        const state = store.getState()
        const isHardMode = state.isHardMode || false

        // DOM element references
        const elements = {
            xpBarFill: document.getElementById('xp-bar-fill'),
            xpBarText: document.getElementById('xp-bar-text'),
            xpStatus: document.getElementById('xp-status'),
            levelBadge: document.getElementById('level-badge'),
            levelImage: document.getElementById('current-level-image'),
            levelName: document.getElementById('level-name'),
            levelCategory: document.getElementById('level-category')
        }

        // Check element existence
        if (!elements.xpBarFill || !elements.xpBarText || !elements.xpStatus) {
            console.warn('XP progress elements not found')
            return
        }

        // Calculate progress for both levels
        const oldProgress = LEVELS.calcXpProgress(oldTotalXp, oldLevel)
        const newProgress = LEVELS.calcXpProgress(newTotalXp, newLevel)

        console.log(`📊 Animating XP: ${oldTotalXp} → ${newTotalXp} (Level ${oldLevel} → ${newLevel})`)

        // Branch based on whether level up occurred
        if (newLevel > oldLevel) {
            console.log(`🎉 LEVEL UP! ${oldLevel} → ${newLevel}`)
            this._animateLevelUp(oldLevel, newLevel, oldProgress, newProgress, earnedXp, elements, isHardMode)
        } else {
            this._animateNormalXp(newProgress, earnedXp, elements)
        }
    }

    copyToClipboard(text, url, isGuest = false) {
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
                this.fallbackCopyToClipboard(fullText, isGuest)
            })
        } else {
            this.fallbackCopyToClipboard(fullText, isGuest)
        }
    }

    fallbackCopyToClipboard(text, isGuest = false) {
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

    showLevelUp(level) {
        // 🔊 1-11: 레벨업 효과음
        audioManager.playLevelUp();

        const levelInfo = LEVELS.getLevelInfo(level)
        const isMilestone = level % 10 === 0 // 10, 20, 30, 40, 50, 60 특별 효과
        const state = store.getState()
        const isHardMode = state.isHardMode || false

        // Milestone 컬러 테마
        let primaryColor = 'var(--color-warning)' // 기본 금색
        let glowColor = 'rgba(255, 215, 64, 0.6)'
        if (isMilestone) {
            if (level === 60) {
                primaryColor = '#000' // 블랙
                glowColor = 'rgba(0, 0, 0, 0.9)'
            } else if (level >= 50) {
                primaryColor = '#fbbf24' // 골드
                glowColor = 'rgba(251, 191, 36, 0.6)'
            } else {
                primaryColor = isHardMode ? '#ef4444' : '#7c4dff' // 테마색
                glowColor = isHardMode ? 'rgba(239, 68, 68, 0.6)' : 'rgba(124, 77, 255, 0.6)'
            }
        }

        const overlay = document.createElement('div')
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.95);
            backdrop-filter: blur(10px);
            z-index: 200;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease-out;
        `
        overlay.innerHTML = `
            <style>
                @keyframes levelUpTitle {
                    0% { transform: scale(0.5); opacity: 0; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes levelUpNumber {
                    0% { transform: scale(0.8); opacity: 0; }
                    60% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes messageSlide {
                    0% { transform: translateY(20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                @keyframes glow {
                    0%, 100% { filter: drop-shadow(0 0 10px ${glowColor}); }
                    50% { filter: drop-shadow(0 0 30px ${glowColor}); }
                }
            </style>

            <!-- Flash Effect -->
            <div id="flash-effect" style="
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: white;
                opacity: 0;
                pointer-events: none;
            "></div>

            <!-- LEVEL UP Title (0.3s) -->
            <h1 id="level-up-title" style="
                font-size: 3rem;
                color: ${primaryColor};
                text-shadow: 0 0 20px ${glowColor};
                margin-bottom: 20px;
                opacity: 0;
                animation: levelUpTitle 0.5s ease-out 0.3s forwards;
                ${isMilestone ? 'animation: levelUpTitle 0.5s ease-out 0.3s forwards, glow 2s ease-in-out infinite;' : ''}
            ">
                ${isMilestone ? '🎉 LEVEL UP! 🎉' : 'LEVEL UP!'}
            </h1>

            <!-- Level Image (1.2s) -->
            <div style="position: relative; margin-bottom: 20px;">
                <img id="level-image" src="${LEVELS.getLevelImage(level)}" alt="Level ${level}" style="
                    width: 120px;
                    height: 120px;
                    border-radius: 16px;
                    object-fit: cover;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                    opacity: 0;
                    transform: scale(0.8);
                "/>
            </div>

            <!-- Level Number (0.8s) -->
            <div id="level-number" style="
                font-size: 5rem;
                font-weight: bold;
                color: white;
                opacity: 0;
            ">1</div>

            <!-- Level Info -->
            <div id="level-name" style="
                margin-top: 20px;
                font-size: 1.5rem;
                color: ${primaryColor};
                font-weight: bold;
                opacity: 0;
            ">${levelInfo.name}</div>
            <div id="level-category" style="
                margin-top: 10px;
                color: #aaa;
                opacity: 0;
            ">${levelInfo.category}</div>

            <!-- Message Sequence (2.5s) -->
            <div id="message-container" style="
                margin-top: 30px;
                font-size: 1.2rem;
                color: white;
                text-align: center;
                opacity: 0;
            "></div>
        `
        this.container.appendChild(overlay)

        // Force reflow and fade in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1'
        })

        // Animation Sequence (3 seconds total)
        const timeline = [
            // 0.0s: Flash effect
            { time: 0, fn: () => {
                const flash = overlay.querySelector('#flash-effect')
                flash.style.transition = 'opacity 0.2s'
                flash.style.opacity = '0.3'
                setTimeout(() => {
                    flash.style.opacity = '0'
                }, 200)
            }},

            // 0.8s: Level number count-up animation
            { time: 800, fn: () => {
                const numberEl = overlay.querySelector('#level-number')
                const startLevel = Math.max(1, level - 1)
                let current = startLevel
                numberEl.style.animation = 'levelUpNumber 0.4s ease-out forwards'
                numberEl.style.opacity = '1'

                // Count up animation
                const interval = setInterval(() => {
                    current++
                    numberEl.innerText = current
                    if (current >= level) {
                        clearInterval(interval)
                    }
                }, 100)
            }},

            // 1.2s: Level image scale animation + confetti burst
            { time: 1200, fn: () => {
                const imgEl = overlay.querySelector('#level-image')
                imgEl.style.transition = 'transform 0.6s ease-out, opacity 0.3s'
                imgEl.style.opacity = '1'
                imgEl.style.transform = 'scale(1.2)'

                setTimeout(() => {
                    imgEl.style.transform = 'scale(1)'
                }, 300)

                // Level name and category fade in
                const nameEl = overlay.querySelector('#level-name')
                const catEl = overlay.querySelector('#level-category')
                nameEl.style.transition = 'opacity 0.3s'
                catEl.style.transition = 'opacity 0.3s'
                nameEl.style.opacity = '1'
                catEl.style.opacity = '1'

                // 🎉 Confetti burst (50 particles for milestone, 30 otherwise)
                const confettiCount = isMilestone ? 100 : 50
                for (let i = 0; i < confettiCount; i++) {
                    setTimeout(() => {
                        this.createConfetti(isMilestone)
                    }, i * 20)
                }
            }},

            // 2.5s: Congratulation message
            { time: 2500, fn: () => {
                const msgEl = overlay.querySelector('#message-container')
                const messages = [
                    "Great!",
                    isMilestone ? "🌟 Milestone Achieved! 🌟" : `You are now ${levelInfo.name}`,
                    "Keep going!"
                ]

                let msgIndex = 0
                msgEl.style.animation = 'messageSlide 0.3s ease-out forwards'
                msgEl.style.opacity = '1'
                msgEl.innerText = messages[0]

                // Cycle through messages
                const msgInterval = setInterval(() => {
                    msgIndex++
                    if (msgIndex >= messages.length) {
                        clearInterval(msgInterval)
                        return
                    }
                    msgEl.style.animation = 'none'
                    requestAnimationFrame(() => {
                        msgEl.style.animation = 'messageSlide 0.3s ease-out forwards'
                        msgEl.innerText = messages[msgIndex]
                    })
                }, 800)
            }},

            // 3.0s: Fade out
            { time: 3000, fn: () => {
                overlay.style.opacity = '0'
                overlay.style.transition = 'opacity 0.5s'
                setTimeout(() => overlay.remove(), 500)
            }}
        ]

        // Execute timeline
        timeline.forEach(step => {
            setTimeout(step.fn, step.time)
        })
    }

    createConfetti(isMilestone = false) {
        const confetti = document.createElement('div')

        // Milestone: 특별한 금색/은색 파티클, 더 크고 반짝임
        const colors = isMilestone
            ? ['#ffd740', '#fbbf24', '#f59e0b', '#ffffff', '#e0e0e0', '#ffeb3b']
            : ['#ffd740', '#69f0ae', '#7c4dff', '#ff5252', '#00bcd4']

        const color = colors[Math.floor(Math.random() * colors.length)]
        const size = isMilestone
            ? Math.random() * 14 + 8  // 8-22px (larger for milestone)
            : Math.random() * 10 + 6   // 6-16px (normal)

        const startX = Math.random() * window.innerWidth
        const startY = window.innerHeight / 2
        const endX = startX + (Math.random() - 0.5) * 600  // Wider spread
        const endY = startY + Math.random() * 600

        // Random shapes for milestone
        const shapes = ['50%', '0%'] // circle or square
        const shape = isMilestone && Math.random() > 0.5 ? shapes[1] : shapes[0]

        confetti.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border-radius: ${shape};
            z-index: 999;
            pointer-events: none;
            ${isMilestone ? 'box-shadow: 0 0 10px ' + color + ';' : ''}
        `
        document.body.appendChild(confetti)

        // Animate using Web Animations API
        const duration = isMilestone ? 1500 : 1000  // Longer for milestone
        confetti.animate([
            { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${endX - startX}px, ${endY - startY}px) rotate(${Math.random() * 1080}deg)`, opacity: 0 }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'  // Smoother easing
        })

        setTimeout(() => confetti.remove(), duration)
    }

    showMaxRoundRecord(round, mode) {
        // 🔊 라운드 신기록 효과음
        audioManager.playLevelUp();

        const state = store.getState()
        const isHardMode = state.isHardMode || false
        const primaryColor = '#fbbf24' // 금색
        const glowColor = 'rgba(251, 191, 36, 0.6)'

        const overlay = document.createElement('div')
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.95);
            backdrop-filter: blur(10px);
            z-index: 200;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease-out;
        `
        overlay.innerHTML = `
            <style>
                @keyframes recordPulse {
                    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px ${glowColor}); }
                    50% { transform: scale(1.05); filter: drop-shadow(0 0 30px ${glowColor}); }
                }
                @keyframes slideUp {
                    0% { transform: translateY(20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
            </style>

            <div id="flash-effect" style="
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: white; opacity: 0; pointer-events: none;
            "></div>

            <div style="
                padding: 0 20px;
                display: flex; flex-direction: column; align-items: center;
                max-width: 90vw;
            ">
                <div style="
                    font-size: clamp(3rem, 10vw, 5rem);
                    opacity: 0;
                    animation: slideUp 0.5s ease-out 0.3s forwards;
                ">🏆</div>

                <h1 style="
                    font-size: clamp(1.5rem, 6vw, 2.5rem);
                    color: ${primaryColor};
                    text-shadow: 0 0 20px ${glowColor};
                    margin: 20px 0;
                    opacity: 0;
                    animation: slideUp 0.5s ease-out 0.5s forwards, recordPulse 2s ease-in-out infinite;
                    text-align: center;
                    word-break: keep-all;
                ">NEW ROUND RECORD!</h1>

                <div style="
                    font-size: clamp(2.5rem, 8vw, 4rem);
                    font-weight: bold;
                    color: white;
                    opacity: 0;
                    animation: slideUp 0.5s ease-out 0.8s forwards;
                ">Round ${round}</div>

                <div id="record-message" style="
                    margin-top: 30px;
                    font-size: clamp(1rem, 4vw, 1.5rem);
                    color: ${primaryColor};
                    text-align: center;
                    opacity: 0;
                "></div>
            </div>
        `
        this.container.appendChild(overlay)

        requestAnimationFrame(() => {
            overlay.style.opacity = '1'
        })

        const timeline = [
            { time: 0, fn: () => {
                const flash = overlay.querySelector('#flash-effect')
                flash.style.transition = 'opacity 0.2s'
                flash.style.opacity = '0.3'
                setTimeout(() => flash.style.opacity = '0', 200)
            }},
            { time: 1200, fn: () => {
                for (let i = 0; i < 100; i++) {
                    setTimeout(() => this.createConfetti(true), i * 20)
                }
            }},
            { time: 2000, fn: () => {
                const msgEl = overlay.querySelector('#record-message')
                msgEl.style.animation = 'slideUp 0.3s ease-out forwards'
                msgEl.style.opacity = '1'
                msgEl.innerText = '축하합니다! 🎉'
            }},
            { time: 3000, fn: () => {
                overlay.style.opacity = '0'
                overlay.style.transition = 'opacity 0.5s'
                setTimeout(() => overlay.remove(), 500)
            }}
        ]

        timeline.forEach(step => setTimeout(step.fn, step.time))
    }

    showMaxComboRecord(combo) {
        // 🔊 콤보 신기록 효과음
        audioManager.playLevelUp();

        const state = store.getState()
        const isHardMode = state.isHardMode || false
        const primaryColor = isHardMode ? '#ef4444' : '#7c4dff'
        const glowColor = isHardMode ? 'rgba(239, 68, 68, 0.6)' : 'rgba(124, 77, 255, 0.6)'

        const overlay = document.createElement('div')
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.95);
            backdrop-filter: blur(10px);
            z-index: 200;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease-out;
        `
        overlay.innerHTML = `
            <style>
                @keyframes comboPulse {
                    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px ${glowColor}); }
                    50% { transform: scale(1.05); filter: drop-shadow(0 0 30px ${glowColor}); }
                }
                @keyframes slideUp {
                    0% { transform: translateY(20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
            </style>

            <div id="flash-effect" style="
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: white; opacity: 0; pointer-events: none;
            "></div>

            <div style="
                padding: 0 20px;
                display: flex; flex-direction: column; align-items: center;
                max-width: 90vw;
            ">
                <div style="
                    font-size: clamp(3rem, 10vw, 5rem);
                    opacity: 0;
                    animation: slideUp 0.5s ease-out 0.3s forwards;
                ">🔥</div>

                <h1 style="
                    font-size: clamp(1.5rem, 6vw, 2.5rem);
                    color: ${primaryColor};
                    text-shadow: 0 0 20px ${glowColor};
                    margin: 20px 0;
                    opacity: 0;
                    animation: slideUp 0.5s ease-out 0.5s forwards, comboPulse 2s ease-in-out infinite;
                    text-align: center;
                    word-break: keep-all;
                ">MAX COMBO RECORD!</h1>

                <div style="
                    font-size: clamp(2.5rem, 8vw, 4rem);
                    font-weight: bold;
                    color: white;
                    opacity: 0;
                    animation: slideUp 0.5s ease-out 0.8s forwards;
                ">${combo} Combo</div>

                <div id="combo-message" style="
                    margin-top: 30px;
                    font-size: clamp(1rem, 4vw, 1.5rem);
                    color: ${primaryColor};
                    text-align: center;
                    opacity: 0;
                "></div>
            </div>
        `
        this.container.appendChild(overlay)

        requestAnimationFrame(() => {
            overlay.style.opacity = '1'
        })

        const timeline = [
            { time: 0, fn: () => {
                const flash = overlay.querySelector('#flash-effect')
                flash.style.transition = 'opacity 0.2s'
                flash.style.opacity = '0.3'
                setTimeout(() => flash.style.opacity = '0', 200)
            }},
            { time: 1200, fn: () => {
                for (let i = 0; i < 100; i++) {
                    setTimeout(() => this.createConfetti(false), i * 20)
                }
            }},
            { time: 2000, fn: () => {
                const msgEl = overlay.querySelector('#combo-message')
                msgEl.style.animation = 'slideUp 0.3s ease-out forwards'
                msgEl.style.opacity = '1'
                msgEl.innerText = '완벽합니다! 🎊'
            }},
            { time: 3000, fn: () => {
                overlay.style.opacity = '0'
                overlay.style.transition = 'opacity 0.5s'
                setTimeout(() => overlay.remove(), 500)
            }}
        ]

        timeline.forEach(step => setTimeout(step.fn, step.time))
    }
}
