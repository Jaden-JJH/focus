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
        const { round, xp, initialRank, isHardMode } = state
        const user = store.getState().user

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
      <div style="flex: 1; padding: 20px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <h2>Game Over</h2>

        <!-- Result Card with unified width -->
        <div class="result-card" style="width: 100%; max-width: 400px; margin: 20px 0;">
            <div class="result-row">
                <span>라운드</span>
                <span class="value">${round || 0}</span>
            </div>
            <div class="result-row">
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
        <div class="xp-progress-section" style="width: 100%; max-width: 400px; margin-bottom: 20px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <!-- Level Image with Badge -->
            <div class="level-image-container" style="
              position: relative;
              margin: 0 auto 16px;
              width: 120px;
              animation: floating 3s ease-in-out infinite;
            ">
              <img
                id="current-level-image"
                src="${LEVELS.getLevelImage(initialLevel)}"
                alt="Level ${initialLevel}"
                style="
                  width: 120px;
                  height: 120px;
                  border-radius: 12px;
                  object-fit: cover;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                "
              />
              <div id="level-badge" style="
                position: absolute;
                bottom: -12px;
                left: 50%;
                transform: translateX(-50%);
                background: ${this.getLevelBadgeGradient(initialLevel, isHardMode)};
                color: ${this.getLevelBadgeColor(initialLevel, isHardMode)};
                padding: 6px 16px;
                border-radius: 9999px;
                font-size: 0.875rem;
                font-weight: bold;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                animation: ${this.getLevelBadgeAnimation(initialLevel, isHardMode)};
                white-space: nowrap;
              ">
                Lv. ${initialLevel}
              </div>
            </div>

            <!-- Level Info -->
            <div style="text-align: center; margin-bottom: 12px;">
              <div id="level-name" style="
                font-size: 1.125rem;
                font-weight: bold;
                color: white;
              ">
                ${LEVELS.getLevelInfo(initialLevel).name}
              </div>
              <div id="level-category" style="
                font-size: 0.875rem;
                color: #aaa;
              ">
                ${LEVELS.getLevelInfo(initialLevel).category}
              </div>
            </div>

            <!-- XP Progress Bar (Enhanced) -->
            <div class="xp-bar-container" style="background: #333; height: 24px; border-radius: 12px; overflow: hidden; position: relative; border: 1px solid #555; margin-bottom: 8px;">
                <div id="xp-bar-fill" style="background: linear-gradient(90deg, var(--theme-accent) 0%, var(--color-warning) 100%); height: 100%; width: 0%; transition: width 1.5s ease-out, background 0.3s;"></div>
                <div id="xp-bar-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.8rem; font-weight: bold; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">
                    ${initialProgress.current} / ${initialProgress.max}
                </div>
            </div>

            <!-- XP Status -->
            <div style="text-align: center; font-size: 0.8rem; color: #888;" id="xp-status">
                Calculating...
            </div>

            <!-- Next Level Preview -->
            ${initialLevel < 61 ? `
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-top: 12px;
              padding: 8px 12px;
              background: rgba(255,255,255,0.03);
              border-radius: 8px;
            ">
              <img
                src="${LEVELS.getLevelImage(initialLevel + 1)}"
                style="
                  width: 40px;
                  height: 40px;
                  border-radius: 6px;
                  object-fit: cover;
                  ${LEVELS.getLevelInfo(initialLevel + 1).locked ? 'filter: brightness(0.3);' : ''}
                "
              />
              <div style="flex: 1;">
                <div style="font-size: 0.75rem; color: #888;">다음 레벨</div>
                <div style="font-size: 0.875rem; color: white; font-weight: 500;">
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
        <div id="rank-movement-section" style="width: 100%; max-width: 400px; margin-bottom: 20px; padding: 20px; background: rgba(76,175,80,0.1); border-radius: 12px; border: 1px solid rgba(76,175,80,0.3); display: none;">
            <div style="text-align: center;">
                <div id="rank-movement-text" style="font-size: 1rem; font-weight: bold; color: var(--color-success);"></div>
                <div id="rank-movement-detail" style="font-size: 0.85rem; color: #aaa; margin-top: 4px;"></div>
            </div>
        </div>
        ` : ''}

        <!-- Action Buttons with unified width -->
        <div class="action-area" style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 400px;">
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
      </div>
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
            const mode = isHardMode ? 'hard' : 'normal'

            try {
                // 🔒 Security: xp 값은 참고용이며, 실제로는 서버에서 재계산됩니다.
                // Supabase Trigger가 max_round 기반으로 정확한 XP를 계산합니다.
                await dataService.saveGameRecord(user.id, round, xp, mode)

                const newUser = store.getState().user
                const newLevel = newUser.level
                const newTotalXp = newUser.total_xp || 0

                // Animate XP Progress Bar
                this.animateXpProgress(oldTotalXp, newTotalXp, oldLevel, newLevel, xp)

                // Get new rank and show rank movement
                const newRankData = await dataService.getMyRank(user.id, mode)
                this.showRankMovement(initialRank, newRankData.rank, newRankData.maxRound)

                // Show Level Up if applicable
                if (newLevel > oldLevel) {
                    setTimeout(() => {
                        this.showLevelUp(newLevel)
                    }, 1800) // Show after XP animation completes
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

        // Calculate rank change
        let message = ''
        let detailMessage = ''
        let backgroundColor = 'rgba(76,175,80,0.1)'
        let borderColor = 'rgba(76,175,80,0.3)'
        let textColor = 'var(--color-success)'

        if (!oldRank && newRank) {
            // First time ranking
            message = '🎉 랭킹 진입!'
            detailMessage = `현재 순위: ${newRank}위 (최고 기록: ${maxRound}R)`
        } else if (oldRank && newRank) {
            const rankChange = oldRank - newRank // Positive means rank improved (went up)

            if (rankChange > 0) {
                // Rank improved
                message = `📈 ${rankChange}위 상승!`
                detailMessage = `${oldRank}위 → ${newRank}위 (최고 기록: ${maxRound}R)`
                backgroundColor = 'rgba(76,175,80,0.1)'
                borderColor = 'rgba(76,175,80,0.3)'
                textColor = 'var(--color-success)'
            } else if (rankChange < 0) {
                // Rank dropped
                message = `📉 ${Math.abs(rankChange)}위 하락`
                detailMessage = `${oldRank}위 → ${newRank}위 (최고 기록: ${maxRound}R)`
                backgroundColor = 'rgba(255,82,82,0.1)'
                borderColor = 'rgba(255,82,82,0.3)'
                textColor = 'var(--color-danger)'
            } else {
                // Rank stayed the same
                message = '순위 유지'
                detailMessage = `현재 순위: ${newRank}위 (최고 기록: ${maxRound}R)`
                backgroundColor = 'rgba(255,215,64,0.1)'
                borderColor = 'rgba(255,215,64,0.3)'
                textColor = 'var(--color-warning)'
            }

            // Special messages for top ranks
            if (newRank <= 3) {
                detailMessage += ' 🏆 TOP 3!'
            } else if (newRank <= 10) {
                detailMessage += ' ⭐ TOP 10!'
            }
        }

        // Apply styles and show
        if (message) {
            rankMovementSection.style.background = backgroundColor
            rankMovementSection.style.borderColor = borderColor
            rankMovementText.style.color = textColor
            rankMovementText.innerText = message
            rankMovementDetail.innerText = detailMessage

            setTimeout(() => {
                rankMovementSection.style.display = 'block'
                rankMovementSection.style.animation = 'fadeIn 0.5s ease-out'
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
        const overlay = document.createElement('div')
        overlay.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 200;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            animation: fadeIn 0.5s;
        `
        overlay.innerHTML = `
            <h1 style="font-size: 3rem; color: var(--color-warning); text-shadow: 0 0 20px var(--color-warning); margin-bottom: 20px;">LEVEL UP!</h1>
            <div style="font-size: 5rem; font-weight: bold; color: white;">${level}</div>
            <div style="margin-top: 20px; font-size: 1.5rem; color: var(--color-warning); font-weight: bold;">${levelInfo.name}</div>
            <div style="margin-top: 10px; color: #aaa;">${levelInfo.category}</div>
        `
        this.container.appendChild(overlay)

        // 🎉 컨페티 효과 (30개 파티클)
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                this.createConfetti()
            }, i * 30) // 약간의 시차를 두고 생성
        }

        setTimeout(() => {
            overlay.style.opacity = '0'
            overlay.style.transition = 'opacity 0.5s'
            setTimeout(() => overlay.remove(), 500)
        }, 2000)
    }

    createConfetti() {
        const confetti = document.createElement('div')
        const colors = ['#ffd740', '#69f0ae', '#7c4dff', '#ff5252', '#00bcd4']
        const color = colors[Math.floor(Math.random() * colors.length)]
        const size = Math.random() * 10 + 6 // 레벨업은 조금 더 크게
        const startX = Math.random() * window.innerWidth
        const startY = window.innerHeight / 2
        const endX = startX + (Math.random() - 0.5) * 400
        const endY = startY + Math.random() * 500

        confetti.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border-radius: 50%;
            z-index: 999;
            pointer-events: none;
        `
        document.body.appendChild(confetti)

        // Animate using Web Animations API
        confetti.animate([
            { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${endX - startX}px, ${endY - startY}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], {
            duration: 1000, // 레벨업은 조금 더 길게
            easing: 'ease-out'
        })

        setTimeout(() => confetti.remove(), 1000)
    }
}
