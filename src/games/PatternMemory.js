export class PatternMemory {
    constructor(container, { difficulty, onCorrect, onWrong }) {
        this.container = container
        this.config = { difficulty, onCorrect, onWrong }
    }

    render() {
        // Upgrade to 4x4 as requested
        const gridSize = 4
        const totalCells = gridSize * gridSize

        // Scale targets with difficulty (Min 3, Max 8)
        // Difficulty 1~10: 3~4 targets
        // Difficulty 20+: 5~6 targets
        let targetCount = 3 + Math.floor(this.config.difficulty / 10)
        if (targetCount > 8) targetCount = 8
        if (targetCount < 4) targetCount = 4 // Minimum 4 for 4x4 feel

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
            items[idx].style.backgroundColor = 'var(--color-accent)'
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
                        el.style.backgroundColor = 'var(--color-accent)'
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
