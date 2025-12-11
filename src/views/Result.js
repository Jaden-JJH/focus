import { dataService } from '../services/dataService.js'
import { store } from '../core/store.js'

export default class Result {
    constructor(container) {
        this.container = container
    }

    async render() {
        const state = history.state || {} // Router pushState data
        const { round, xp } = state

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

        // Save Record
        const user = store.getState().user
        if (user && round && !user.isGuest) {
            const oldLevel = user.level

            try {
                await dataService.saveGameRecord(user.id, round, xp)

                const newUser = store.getState().user
                const newLevel = newUser.level

                if (newLevel > oldLevel) {
                    this.showLevelUp(newLevel)
                }
            } catch (e) {
                console.error("Failed to save record", e)
            }
        }
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
