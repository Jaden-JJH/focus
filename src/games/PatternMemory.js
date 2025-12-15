export class PatternMemory {
    constructor(container, { difficulty, roundTier, onCorrect, onWrong }) {
        this.container = container
        this.config = { difficulty, roundTier, onCorrect, onWrong }
    }

    render() {
        // Calculate grid size based on Round Tier
        // Round 1 (timeLimit >= 4s): 4x4
        // Round 2 (timeLimit < 4s): 5x5
        // Round 3 (timeLimit < 3s): 6x6
        let gridSize = 4
        const tier = this.config.roundTier || 1

        if (tier === 3) {
            gridSize = 6
        } else if (tier === 2) {
            gridSize = 5
        }

        const totalCells = gridSize * gridSize

        // Scale targets with grid size
        // For 4x4 (16 cells): 4 targets
        // For 5x5 (25 cells): 5 targets
        // For 6x6 (36 cells): 6 targets
        let targetCount = gridSize
        if (targetCount > 8) targetCount = 8

        const indices = Array(totalCells).fill(0).map((_, i) => i)
        indices.sort(() => Math.random() - 0.5)

        const targets = indices.slice(0, targetCount)

        this.container.innerHTML = `
      <div class="game-instruction">기억하세요!</div>
      <div class="game-grid" style="grid-template-columns: repeat(${gridSize}, 1fr); pointer-events: none;">
         ${Array(totalCells).fill(0).map((_, idx) => `
            <div class="grid-item memory-item" data-idx="${idx}"></div>
         `).join('')}
      </div>
    `

        // Show Pattern
        const items = this.container.querySelectorAll('.memory-item')
        targets.forEach(idx => {
            items[idx].classList.add('active')
            items[idx].style.backgroundColor = 'var(--theme-accent)'
        })

        setTimeout(() => {
            // Hide
            targets.forEach(idx => {
                items[idx].classList.remove('active')
                items[idx].style.backgroundColor = ''
            })

            this.container.querySelector('.game-instruction').innerText = '패턴을 입력하세요'
            this.container.querySelector('.game-grid').style.pointerEvents = 'auto'

            // Input Phase
            let found = 0
            items.forEach((el, idx) => {
                el.addEventListener('click', () => {
                    if (el.classList.contains('found')) return

                    if (targets.includes(idx)) {
                        el.classList.add('found')
                        el.style.backgroundColor = 'var(--theme-accent)'
                        found++
                        if (found === targets.length) {
                            this.config.onCorrect()
                        }
                    } else {
                        this.config.onWrong()
                        el.classList.add('shake')
                        setTimeout(() => el.classList.remove('shake'), 500)
                    }
                })
            })
        }, 600) // 0.6s preview
    }
}
