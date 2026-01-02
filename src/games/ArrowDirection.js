// ========================================
// Arrow Direction (화살표 방향)
// Hard Mode Only - 한번 실패하면 게임오버
// ========================================
import audioManager from '../utils/audioManager.js'

export class ArrowDirection {
    constructor(container, { difficulty, roundTier, onCorrect, onWrong }) {
        this.container = container
        this.config = { difficulty, roundTier, onCorrect, onWrong }

        this.arrows = ['up', 'down', 'left', 'right']
        this.symbols = {
            up: '↑',
            down: '↓',
            left: '←',
            right: '→'
        }
        this.opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        }

        // Phase별 설정
        this.phaseConfig = {
            1: { inverseMode: false, instruction: '화살표 방향을 클릭하세요' },
            2: { inverseMode: false, instruction: '화살표 방향을 클릭하세요' },
            3: { inverseMode: true, instruction: '반대 방향을 클릭하세요' }
        }

        this.targetDirection = null
        this.hasFailed = false
    }

    render() {
        const phase = this.phaseConfig[this.config.roundTier] || this.phaseConfig[1]

        // 무작위 화살표 선택
        this.targetDirection = this.arrows[Math.floor(Math.random() * 4)]

        this.container.innerHTML = `
            <div class="game-instruction">${phase.instruction}</div>

            <div style="
                text-align: center;
                margin: 40px 0;
                font-size: 4rem;
                color: #ef4444;
                text-shadow: 0 0 20px rgba(239, 68, 68, 0.8);
                font-weight: bold;
            ">
                ${this.symbols[this.targetDirection]}
            </div>

            <div class="arrow-buttons" style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                max-width: 400px;
                margin: 0 auto;
            ">
                <button class="arrow-btn" data-dir="up">${this.symbols.up}</button>
                <button class="arrow-btn" data-dir="down">${this.symbols.down}</button>
                <button class="arrow-btn" data-dir="left">${this.symbols.left}</button>
                <button class="arrow-btn" data-dir="right">${this.symbols.right}</button>
            </div>
        `

        // 클릭 이벤트 (이벤트 위임)
        this.handleClick = (e) => {
            const btn = e.target.closest('.arrow-btn')
            if (!btn || this.hasFailed) return

            const userDirection = btn.dataset.dir
            this.handleAnswer(userDirection, btn)
        }

        const buttonsContainer = this.container.querySelector('.arrow-buttons')
        if (buttonsContainer) {
            buttonsContainer.addEventListener('click', this.handleClick)
        }
    }

    handleAnswer(userDirection, btn) {
        if (this.hasFailed) return

        // 🔊 클릭 음
        audioManager.playInGameClick()

        const phase = this.phaseConfig[this.config.roundTier] || this.phaseConfig[1]
        let correctDirection = this.targetDirection

        // Phase 3: 역질문
        if (phase.inverseMode) {
            correctDirection = this.opposites[this.targetDirection]
        }

        if (userDirection === correctDirection) {
            // 정답!
            btn.style.transform = 'scale(0.95)'
            btn.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.6)'

            setTimeout(() => {
                btn.style.transform = 'scale(1)'
                btn.style.boxShadow = 'none'
            }, 200)

            setTimeout(() => {
                this.config.onCorrect()
            }, 300)
        } else {
            // 오답
            this.hasFailed = true

            const instruction = this.container.querySelector('.game-instruction')
            if (instruction) instruction.innerText = '틀렸어요!'

            btn.classList.add('shake')

            setTimeout(() => {
                this.config.onWrong()
            }, 500)
        }
    }

    cleanup() {
        // 이벤트 리스너 제거
        const buttonsContainer = this.container.querySelector('.arrow-buttons')
        if (buttonsContainer && this.handleClick) {
            buttonsContainer.removeEventListener('click', this.handleClick)
        }
    }
}
