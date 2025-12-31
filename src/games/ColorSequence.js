// ========================================
// Color Sequence (색상 순서 기억)
// Hard Mode Only - 한번 실패하면 게임오버
// ========================================
import audioManager from '../utils/audioManager.js'

export class ColorSequence {
    constructor(container, { difficulty, roundTier, onCorrect, onWrong, onReady }) {
        this.container = container
        this.config = { difficulty, roundTier, onCorrect, onWrong, onReady }

        // 9가지 색상 정의
        this.colors = [
            { bg: 'linear-gradient(135deg, #ef4444, #dc2626)', name: '빨강' },      // Red
            { bg: 'linear-gradient(135deg, #3b82f6, #2563eb)', name: '파랑' },      // Blue
            { bg: 'linear-gradient(135deg, #22c55e, #16a34a)', name: '초록' },      // Green
            { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', name: '주황' },      // Orange
            { bg: 'linear-gradient(135deg, #a855f7, #9333ea)', name: '보라' },      // Purple
            { bg: 'linear-gradient(135deg, #ec4899, #db2777)', name: '핑크' },      // Pink
            { bg: 'linear-gradient(135deg, #06b6d4, #0891b2)', name: '청록' },      // Cyan
            { bg: 'linear-gradient(135deg, #eab308, #ca8a04)', name: '노랑' },      // Yellow
            { bg: 'linear-gradient(135deg, #84cc16, #65a30d)', name: '연두' }       // Lime
        ]

        // Phase별 설정
        // Phase 1: 2x2 (4개 타일), 4가지 순서 (중복 없음)
        // Phase 2: 2x2 (4개 타일), 6가지 순서 (중복 허용)
        // Phase 3: 3x3 (9개 타일), 6가지 순서 (중복 허용)
        // 안내 속도 1.25배 빠르게 (시간 / 1.25)
        this.phaseConfig = {
            1: { gridSize: 2, sequenceLength: 4, showDelay: 450, allowDuplicate: false },
            2: { gridSize: 2, sequenceLength: 6, showDelay: 385, allowDuplicate: true },
            3: { gridSize: 3, sequenceLength: 6, showDelay: 320, allowDuplicate: true }
        }

        const config = this.phaseConfig[this.config.roundTier] || this.phaseConfig[1]
        this.gridSize = config.gridSize
        this.sequenceLength = config.sequenceLength
        this.showDelay = config.showDelay
        this.allowDuplicate = config.allowDuplicate

        this.sequence = []
        this.userSequence = []
        this.isShowing = true
        this.hasFailed = false
    }

    render() {
        const totalTiles = this.gridSize * this.gridSize

        // 순서 생성
        this.generateSequence(totalTiles)

        // 타일 생성 (기본 회색)
        const tiles = Array(totalTiles).fill(0).map((_, idx) => `
            <div class="grid-item color-tile" data-index="${idx}" style="
                background: #2c2c2c;
                cursor: not-allowed;
                transition: all 0.3s;
                border: 2px solid rgba(255, 255, 255, 0.1);
            "></div>
        `).join('')

        this.container.innerHTML = `
            <div class="game-instruction" id="sequence-instruction">순서를 기억하세요</div>
            <div class="game-grid" style="
                display: grid;
                grid-template-columns: repeat(${this.gridSize}, 1fr);
                grid-template-rows: repeat(${this.gridSize}, 1fr);
                gap: ${this.gridSize === 3 ? '8px' : '12px'};
                width: 100%;
                max-width: ${this.gridSize === 3 ? '360px' : '300px'};
                margin: 0 auto;
                aspect-ratio: 1;
            ">
                ${tiles}
            </div>
        `

        // 순서 보여주기
        this.showSequence()
    }

    generateSequence(totalTiles) {
        if (!this.allowDuplicate) {
            // Phase 1: 중복 없이 서로 다른 타일
            const available = Array.from({ length: totalTiles }, (_, i) => i)
            for (let i = 0; i < this.sequenceLength; i++) {
                const randomIndex = Math.floor(Math.random() * available.length)
                this.sequence.push(available[randomIndex])
                available.splice(randomIndex, 1)
            }
        } else {
            // Phase 2, 3: 중복 허용
            for (let i = 0; i < this.sequenceLength; i++) {
                this.sequence.push(Math.floor(Math.random() * totalTiles))
            }
        }
    }

    async showSequence() {
        const tiles = this.container.querySelectorAll('.color-tile')

        // 각 순서를 차례로 보여줌
        for (let i = 0; i < this.sequence.length; i++) {
            await this.wait(this.showDelay)
            await this.flashTile(tiles[this.sequence[i]])
        }

        // 보여주기 끝 - 이제 사용자 입력 단계
        await this.wait(500)
        this.isShowing = false

        const instruction = document.getElementById('sequence-instruction')
        if (instruction) instruction.innerText = '따라 누르세요'

        // 타이머 시작 신호
        if (this.config.onReady) {
            this.config.onReady()
        }

        this.enableInput()
    }

    async flashTile(tile) {
        // 🔊 1-8: 칼라시퀀스 가이드음
        audioManager.playColorGuide();

        // 하드모드 전용 색상으로 밝게 표시
        tile.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)'
        tile.style.transform = 'scale(0.95)'
        tile.style.boxShadow = '0 0 30px rgba(239, 68, 68, 0.8)'
        tile.style.border = '2px solid #ef4444'

        await this.wait(350)

        // 원래대로 (회색)
        tile.style.background = '#2c2c2c'
        tile.style.transform = 'scale(1)'
        tile.style.boxShadow = 'none'
        tile.style.border = '2px solid rgba(255, 255, 255, 0.1)'
    }

    enableInput() {
        const tiles = this.container.querySelectorAll('.color-tile')

        if (!tiles || tiles.length === 0) {
            console.error('ColorSequence: 타일을 찾을 수 없습니다!')
            return
        }

        tiles.forEach((tile, idx) => {
            tile.style.cursor = 'pointer'
            tile.style.background = '#3a3a3a' // 입력 가능 상태는 약간 밝은 회색

            const clickHandler = () => {
                if (this.isShowing || this.hasFailed) return

                // 🔊 인게임 클릭음
                audioManager.playInGameClick()

                const index = parseInt(tile.dataset.index)
                this.userSequence.push(index)

                // 타일 피드백 (하드모드 색상)
                tile.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)'
                tile.style.transform = 'scale(0.95)'
                tile.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.6)'
                setTimeout(() => {
                    tile.style.background = '#3a3a3a'
                    tile.style.transform = 'scale(1)'
                    tile.style.boxShadow = 'none'
                }, 200)

                // 정답 체크
                const currentStep = this.userSequence.length - 1
                if (this.userSequence[currentStep] !== this.sequence[currentStep]) {
                    // 틀림 - 하드모드에서는 즉시 게임오버
                    this.hasFailed = true
                    this.handleFailure(tile)
                } else if (this.userSequence.length === this.sequence.length) {
                    // 전부 맞음!
                    setTimeout(() => {
                        this.config.onCorrect()
                    }, 300)
                }
            }

            tile.addEventListener('click', clickHandler)
        })
    }

    handleFailure(tile) {
        const instruction = document.getElementById('sequence-instruction')
        if (instruction) instruction.innerText = '틀렸어요!'

        tile.classList.add('shake')

        setTimeout(() => {
            this.config.onWrong()
        }, 500)
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    cleanup() {
        // 타이머 정리 (필요시)
    }
}
