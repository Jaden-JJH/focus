import { dataService } from '../services/dataService.js'
import { store } from '../core/store.js'
import { LEVELS } from '../config/gameConfig.js'

export default class Result {
    constructor(container) {
        this.container = container
    }

    async render() {
        const state = history.state || {} // Router pushState data
        const { round, xp, initialRank } = state
        const user = store.getState().user

        // Store initial level and XP before saving record
        const initialLevel = user ? user.level : 1
        const initialTotalXp = user ? (user.total_xp || 0) : 0
        const initialProgress = LEVELS.calcXpProgress(initialTotalXp, initialLevel)

        this.container.innerHTML = `
      <div style="flex: 1; padding: 20px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <h2>Game Over</h2>
        <div class="result-card">
            <div class="result-row">
                <span>Round Reached</span>
                <span class="value">${round || 0}</span>
            </div>
            <div class="result-row">
                <span>XP Earned</span>
                <span class="value link-color">+${xp || 0} XP</span>
            </div>
        </div>

        <!-- XP Progress Section -->
        ${user && !user.isGuest ? `
        <div class="xp-progress-section" style="width: 100%; max-width: 400px; margin: 20px 0; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="font-size: 0.9rem; color: #aaa;">Level Progress</span>
                <span id="level-display" style="font-weight: bold; color: var(--color-accent);">Lv. ${initialLevel}</span>
            </div>

            <div class="xp-bar-container" style="background: #333; height: 24px; border-radius: 12px; overflow: hidden; position: relative; border: 1px solid #555;">
                <div id="xp-bar-fill" style="background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-warning) 100%); height: 100%; width: ${initialProgress.percent}%; transition: width 1.5s ease-out, background 0.3s;"></div>
                <div id="xp-bar-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.8rem; font-weight: bold; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">
                    ${initialProgress.current} / ${initialProgress.max}
                </div>
            </div>

            <div style="text-align: center; margin-top: 8px; font-size: 0.8rem; color: #888;" id="xp-status">
                Calculating...
            </div>
        </div>
        ` : ''}

        <!-- Rank Movement Section -->
        ${user && !user.isGuest ? `
        <div id="rank-movement-section" style="width: 100%; max-width: 400px; margin-bottom: 20px; padding: 16px; background: rgba(76,175,80,0.1); border-radius: 12px; border: 1px solid rgba(76,175,80,0.3); display: none;">
            <div style="text-align: center;">
                <div id="rank-movement-text" style="font-size: 1rem; font-weight: bold; color: var(--color-success);"></div>
                <div id="rank-movement-detail" style="font-size: 0.85rem; color: #aaa; margin-top: 4px;"></div>
            </div>
        </div>
        ` : ''}
        </div>

        <div class="action-area" style="margin-top: 30px; display: flex; flex-direction: column; align-items: center; width: 100%;">
           <div style="display: flex; gap: 10px; width: 100%;">
             <button id="retry-btn" class="btn-primary" style="flex: 4; min-height: 48px;">다시 시도</button>
             <button id="share-btn" style="flex: 1; min-height: 48px; background: #2a2a2a; border: 1px solid #ffc107; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">
               <img src="/share.svg" alt="공유" style="width: 20px; height: 20px; filter: brightness(0) saturate(100%) invert(82%) sepia(58%) saturate(497%) hue-rotate(359deg) brightness(103%) contrast(101%);">
             </button>
           </div>

           <div style="width: 100%; text-align: center; font-size: 0.8rem; color: #ffc107; margin-top: 10px; padding: 8px 0;">
             💡 친구 초대 시 +1 코인
           </div>

           <button id="home-btn" style="margin-top: 8px; color: #888; background: transparent; border: none; cursor: pointer; padding: 8px;">메인으로</button>
        </div>
      </div>
    `

        document.getElementById('retry-btn').addEventListener('click', () => {
            const currentCoins = store.getState().coins
            if (currentCoins > 0) {
                import('../core/router.js').then(r => r.navigateTo('/game'));
            } else {
                alert('코인이 부족합니다.')
            }
        });

        document.getElementById('home-btn').addEventListener('click', () => {
            import('../core/router.js').then(r => r.navigateTo('/main'));
        });

        // Share Button
        const shareBtn = document.getElementById('share-btn')
        if (shareBtn) {
            shareBtn.addEventListener('click', async () => {
                const user = store.getState().user
                if (!user || user.isGuest) {
                    alert('로그인 후 공유할 수 있습니다!')
                    return
                }

                const referralCode = user.referral_code
                const shareUrl = `${window.location.origin}/?ref=${referralCode}`
                const shareText = `나는 ${round}라운드까지 갔어! 당신은 몇 라운드까지 갈 수 있나요?`

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
                            this.copyToClipboard(shareText, shareUrl)
                        }
                    }
                } else {
                    // Desktop: Copy to clipboard
                    this.copyToClipboard(shareText, shareUrl)
                }
            })
        }

        // Save Record and Animate XP Progress
        if (user && round && !user.isGuest) {
            const oldLevel = user.level
            const oldTotalXp = user.total_xp || 0

            try {
                await dataService.saveGameRecord(user.id, round, xp)

                const newUser = store.getState().user
                const newLevel = newUser.level
                const newTotalXp = newUser.total_xp || 0

                // Animate XP Progress Bar
                this.animateXpProgress(oldTotalXp, newTotalXp, oldLevel, newLevel, xp)

                // Get new rank and show rank movement
                const newRankData = await dataService.getMyRank(user.id)
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
                message = '📊 순위 유지'
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

    animateXpProgress(oldTotalXp, newTotalXp, oldLevel, newLevel, earnedXp) {
        const xpBarFill = document.getElementById('xp-bar-fill')
        const xpBarText = document.getElementById('xp-bar-text')
        const xpStatus = document.getElementById('xp-status')
        const levelDisplay = document.getElementById('level-display')

        if (!xpBarFill || !xpBarText || !xpStatus || !levelDisplay) return

        // Calculate new progress
        const newProgress = LEVELS.calcXpProgress(newTotalXp, newLevel)

        // Animate the progress bar
        setTimeout(() => {
            xpBarFill.style.width = `${newProgress.percent}%`
            xpBarText.innerText = `${newProgress.current} / ${newProgress.max}`

            // Update status text
            if (newLevel > oldLevel) {
                xpStatus.innerHTML = `🎉 <span style="color: var(--color-warning);">LEVEL UP!</span> Lv. ${oldLevel} → Lv. ${newLevel}`
                levelDisplay.innerText = `Lv. ${newLevel}`

                // Add celebration effect to the bar
                xpBarFill.style.background = 'linear-gradient(90deg, var(--color-warning) 0%, var(--color-accent) 100%)'
            } else {
                xpStatus.innerHTML = `<span style="color: var(--color-accent);">+${earnedXp} XP</span> 획득!`
            }
        }, 300)
    }

    copyToClipboard(text, url) {
        const fullText = `${text}\n${url}`

        // Modern clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(fullText).then(() => {
                alert('공유 링크가 클립보드에 복사되었습니다!\n\n친구가 이 링크로 가입하면 +1 코인을 받아요!')
            }).catch(err => {
                console.error('Clipboard write failed:', err)
                this.fallbackCopyToClipboard(fullText)
            })
        } else {
            this.fallbackCopyToClipboard(fullText)
        }
    }

    fallbackCopyToClipboard(text) {
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

    showLevelUp(level) {
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
            <div style="margin-top: 20px; color: #aaa;">Keep going!</div>
        `
        this.container.appendChild(overlay)

        setTimeout(() => {
            overlay.style.opacity = '0'
            overlay.style.transition = 'opacity 0.5s'
            setTimeout(() => overlay.remove(), 500)
        }, 2000)
    }
}
