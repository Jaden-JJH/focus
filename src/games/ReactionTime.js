// ========================================
// Reaction Time (반응속도 테스트)
// Hard Mode Only - 한번 실패하면 게임오버
// ========================================
export class ReactionTime {
    constructor(container, { difficulty, roundTier, onCorrect, onWrong }) {
        this.container = container
        this.config = { difficulty, roundTier, onCorrect, onWrong }
        this.startTime = null
        this.greenTimer = null
        this.timeoutTimer = null
        this.hasClicked = false
        this.isGreen = false

        // Phase별 클릭 허용 시간 (초록색으로 바뀐 후)
        // 더 짧게 조정: 0.6초 → 0.4초 → 0.3초
        this.clickWindowByPhase = {
            1: 600,  // Phase 1: 600ms
            2: 400,  // Phase 2: 400ms
            3: 300   // Phase 3: 300ms
        }
    }

    render() {
        const timeLimit = this.getTimeLimit()
        const clickWindow = this.clickWindowByPhase[this.config.roundTier] || 600

        // 여백 시간 계산 (제한시간 - 클릭윈도우 - 안전여백)
        const safetyMargin = 500 // 0.5초 안전 여백
        const availableTime = (timeLimit * 1000) - clickWindow - safetyMargin

        // 버튼 활성화 타이밍 (1초 ~ 남은시간 범위)
        const minDelay = 1000
        const maxDelay = Math.max(minDelay + 500, availableTime)
        const greenDelay = minDelay + Math.random() * (maxDelay - minDelay)

        this.container.innerHTML = `
            <div class="game-instruction" id="reaction-instruction">준비하세요...</div>
            <div class="reaction-area" style="
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 300px;
            ">
                <button id="reaction-button" class="reaction-button" style="
                    width: 150px;
                    height: 150px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    border: none;
                    font-size: 3rem;
                    cursor: pointer;
                    box-shadow: 0 10px 30px rgba(239, 68, 68, 0.5);
                    transition: all 0.2s;
                    opacity: 0.7;
                ">
                    ⏱️
                </button>
            </div>
            <div style="
                text-align: center;
                margin-top: 20px;
                font-size: 0.9rem;
                color: rgba(255,255,255,0.5);
            ">
                초록색으로 바뀌면 즉시 클릭하세요!<br/>
                <span style="color: #ef4444; font-weight: bold;">빨간색일 때 클릭하면 게임오버!</span>
            </div>
        `

        const button = document.getElementById('reaction-button')
        const instruction = document.getElementById('reaction-instruction')

        // 랜덤한 시간 후에 버튼 색상 변경 (빨강 -> 초록)
        this.greenTimer = setTimeout(() => {
            if (this.hasClicked) return

            this.isGreen = true
            button.style.background = 'linear-gradient(135deg, #4ade80, #22c55e)'
            button.style.boxShadow = '0 10px 30px rgba(74, 222, 128, 0.8)'
            button.style.opacity = '1'
            button.innerText = '👆'
            instruction.innerText = '지금!'

            this.startTime = Date.now()

            // 클릭 윈도우 타임아웃
            this.timeoutTimer = setTimeout(() => {
                if (!this.hasClicked) {
                    // 시간 내에 클릭하지 못함 - 실패
                    this.handleFailure('늦었어요!')
                }
            }, clickWindow)
        }, greenDelay)

        // 버튼 클릭 핸들러
        button.addEventListener('click', () => {
            if (this.hasClicked) return
            this.hasClicked = true

            if (!this.isGreen) {
                // 빨간색일 때 클릭 - 즉시 게임오버
                clearTimeout(this.greenTimer)
                this.handleFailure('빨간색 클릭! 게임오버!')
                return
            }

            // 성공!
            const reactionTime = Date.now() - this.startTime
            instruction.innerText = `${reactionTime}ms!`
            button.style.transform = 'scale(0.9)'

            clearTimeout(this.timeoutTimer)
            setTimeout(() => {
                this.config.onCorrect()
            }, 300)
        })
    }

    handleFailure(message) {
        const instruction = document.getElementById('reaction-instruction')
        const button = document.getElementById('reaction-button')

        if (instruction) instruction.innerText = message
        if (button) {
            button.disabled = true
            button.style.cursor = 'not-allowed'
            button.style.opacity = '0.5'
            button.classList.add('shake')
        }

        setTimeout(() => {
            this.config.onWrong() // 하드모드에서는 즉시 게임오버
        }, 500)
    }

    getTimeLimit() {
        // GameEngine의 timeLimit 계산 로직 참고
        // roundTier 1: ~5초, roundTier 2: ~4초, roundTier 3: ~3초
        if (this.config.roundTier === 3) return 3
        if (this.config.roundTier === 2) return 4
        return 5
    }

    cleanup() {
        if (this.greenTimer) clearTimeout(this.greenTimer)
        if (this.timeoutTimer) clearTimeout(this.timeoutTimer)
    }
}
