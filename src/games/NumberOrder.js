export class NumberOrder {
    constructor(container, { difficulty, onCorrect, onWrong }) {
        this.container = container
        this.config = { difficulty, onCorrect, onWrong }
    }

    render() {
        const gridSize = 3
        const numbers = [1, 2, 3, 4]

        // Randomize Board Positions
        const positions = Array(gridSize * gridSize).fill(null).map((_, i) => i)
        positions.sort(() => Math.random() - 0.5)

        const gridItems = Array(gridSize * gridSize).fill(null)
        numbers.forEach((num, i) => {
            const pos = positions[i]
            gridItems[pos] = num
        })

        // Randomize Target Sequence (e.g., 2, 4, 1, 3)
        const targetSequence = [...numbers].sort(() => Math.random() - 0.5)

        this.container.innerHTML = `
      <div class="game-instruction">
         Touch: <span style="color:var(--color-accent-light)">${targetSequence.join(' → ')}</span>
      </div>
      <div class="game-grid" style="grid-template-columns: repeat(${gridSize}, 1fr)">
         ${gridItems.map((val, idx) => `
            <div class="grid-item number-item ${val === null ? 'empty' : ''}" data-val="${val}">
               ${val !== null ? val : ''}
            </div>
         `).join('')}
      </div>
    `

        let currentStep = 0

        this.container.querySelectorAll('.number-item').forEach(el => {
            if (el.classList.contains('empty')) return

            el.addEventListener('click', () => {
                const val = parseInt(el.dataset.val)
                const currentTarget = targetSequence[currentStep]

                if (val === currentTarget) {
                    el.classList.add('found')
                    el.style.opacity = '0.3'
                    currentStep++
                    if (currentStep >= targetSequence.length) {
                        this.config.onCorrect()
                    }
                } else {
                    this.config.onWrong()
                    el.classList.add('shake')
                    setTimeout(() => el.classList.remove('shake'), 500)
                }
            })
        })
    }
}
