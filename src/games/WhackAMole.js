// ========================================
// Whack-a-Mole (두더지 잡기)
// Hard Mode Only - 한번 실패하면 게임오버
// ========================================
import audioManager from '../utils/audioManager.js'

export class WhackAMole {
    constructor(container, { difficulty, roundTier, onCorrect, onWrong }) {
        this.container = container
        this.config = { difficulty, roundTier, onCorrect, onWrong }

        // Phase별 설정
        this.phaseConfig = {
            1: { targetCount: 4, spawnDelay: 100 },  // 4마리, 0.1초 대기 (빠르게)
            2: { targetCount: 5, spawnDelay: 80 },   // 5마리, 0.08초 대기
            3: { targetCount: 6, spawnDelay: 60 }    // 6마리, 0.06초 대기 (매우 빠름)
        }

        this.timers = []
        this.currentTarget = null
        this.clickCount = 0
        this.hasFailed = false
    }

    render() {
        const phase = this.phaseConfig[this.config.roundTier] || this.phaseConfig[1]

        // 3x3 그리드 생성
        const cells = Array(9).fill(0).map((_, i) => `
            <div class="grid-item whack-cell" data-index="${i}"></div>
        `).join('')

        this.container.innerHTML = `
            <div class="game-instruction" id="whack-instruction">타겟 클릭: 0 / ${phase.targetCount}</div>
            <div class="game-grid" style="
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                grid-template-rows: repeat(3, 1fr);
                gap: 8px;
                width: 100%;
                max-width: 360px;
                margin: 0 auto;
                aspect-ratio: 1;
            ">
                ${cells}
            </div>
        `

        // 첫 타겟 생성
        this.spawnTarget()
    }

    spawnTarget() {
        if (this.hasFailed) return

        const phase = this.phaseConfig[this.config.roundTier] || this.phaseConfig[1]
        const cells = this.container.querySelectorAll('.whack-cell')

        if (!cells || cells.length === 0) {
            console.error('WhackAMole: 셀을 찾을 수 없습니다!')
            return
        }

        // 이전 타겟 제거
        cells.forEach(cell => {
            cell.classList.remove('active', 'target')
            cell.style.background = ''
            cell.style.boxShadow = ''
            cell.style.border = ''
            cell.style.animation = ''
        })

        // 무작위 위치 선택
        const randomIndex = Math.floor(Math.random() * 9)
        this.currentTarget = randomIndex
        const targetCell = cells[randomIndex]

        // 타겟 스타일 적용 (하드모드 색상)
        targetCell.classList.add('active', 'target')
        targetCell.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)'
        targetCell.style.boxShadow = '0 0 30px rgba(239, 68, 68, 0.8)'
        targetCell.style.border = '2px solid #ef4444'

        // 나타나는 애니메이션 (미묘하게)
        targetCell.style.transform = 'scale(0.95)'
        targetCell.style.opacity = '0'

        // 즉시 나타나기 (빠르게)
        requestAnimationFrame(() => {
            targetCell.style.transition = 'transform 0.12s ease-out, opacity 0.12s ease-out'
            targetCell.style.transform = 'scale(1)'
            targetCell.style.opacity = '1'

            // 미묘한 글로우 펄스 애니메이션 (천천히)
            setTimeout(() => {
                targetCell.style.transition = ''
                targetCell.style.animation = 'whackGlowPulse 2s ease-in-out infinite'
            }, 120)
        })

        // 클릭 이벤트 (이벤트 위임)
        const clickHandler = (e) => {
            const clickedCell = e.target.closest('.whack-cell')
            if (!clickedCell || this.hasFailed) return

            const index = parseInt(clickedCell.dataset.index)

            // 🔊 클릭 음
            audioManager.playInGameClick()

            if (index === this.currentTarget) {
                // 정답!
                this.handleCorrect(clickedCell)
            } else {
                // 빈 칸 클릭 = 실패
                this.handleFailure(clickedCell, '틀렸어요!')
            }
        }

        // 컨테이너에 이벤트 리스너 추가 (한 번만)
        const grid = this.container.querySelector('.game-grid')
        if (grid) {
            grid.addEventListener('click', clickHandler, { once: true })
        }
    }

    handleCorrect(cell) {
        if (this.hasFailed) return

        const phase = this.phaseConfig[this.config.roundTier] || this.phaseConfig[1]

        // 클릭 카운트 증가
        this.clickCount++

        // 진행 상황 업데이트
        const instruction = document.getElementById('whack-instruction')
        if (instruction) {
            instruction.innerText = `타겟 클릭: ${this.clickCount} / ${phase.targetCount}`
        }

        // 클릭 피드백 (간단한 효과)
        cell.style.animation = 'none'
        cell.style.transform = 'scale(0.95)'
        cell.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.6)'

        setTimeout(() => {
            cell.style.transform = 'scale(1)'
            cell.style.boxShadow = 'none'
        }, 100)

        // 목표 개수 달성 체크
        if (this.clickCount >= phase.targetCount) {
            // 목표 달성! 라운드 클리어
            setTimeout(() => {
                this.config.onCorrect()
            }, 300)
        } else {
            // 다음 타겟 생성
            const spawnTimer = setTimeout(() => {
                if (!this.hasFailed) {
                    this.spawnTarget()
                }
            }, phase.spawnDelay)

            this.timers.push(spawnTimer)
        }
    }

    handleFailure(cell, message = '틀렸어요!') {
        this.hasFailed = true

        const instruction = this.container.querySelector('.game-instruction')
        if (instruction) instruction.innerText = message

        cell.classList.add('shake')

        setTimeout(() => {
            this.config.onWrong()
        }, 500)
    }

    cleanup() {
        // 모든 타이머 정리
        this.timers.forEach(t => clearTimeout(t))
        this.timers = []
    }
}
