export class NumberOrder {
    constructor(container, { difficulty, onCorrect, onWrong }) {
        this.container = container
        this.config = { difficulty, onCorrect, onWrong }
    }

    render() {
        const count = 4 // Always 1 to 4 for speed? Or scale?
        // Plan says: 3x3 board, 1~4 numbers.
        const gridSize = 3
        const numbers = [1, 2, 3, 4]

        // Create 9 positions, pick 4
        const positions = Array(gridSize * gridSize).fill(null).map((_, i) => i)
        positions.sort(() => Math.random() - 0.5)

        const gridItems = Array(gridSize * gridSize).fill(null)

        numbers.forEach((num, i) => {
            const pos = positions[i]
            gridItems[pos] = num
        })

        this.container.innerHTML = `
      <div class="game-instruction">
         Touch 1 → 4
      </div>
      <div class="game-grid" style="grid-template-columns: repeat(${gridSize}, 1fr)">
         ${gridItems.map((val, idx) => `
            <div class="grid-item number-item ${val === null ? 'empty' : ''}" data-val="${val}">
               ${val !== null ? val : ''}
            </div>
         `).join('')}
      </div>
    `

        let currentTarget = 1

        this.container.querySelectorAll('.number-item').forEach(el => {
            if (el.classList.contains('empty')) return

            el.addEventListener('click', () => {
                const val = parseInt(el.dataset.val)
                if (val === currentTarget) {
                    el.classList.add('found')
                    el.style.opacity = '0.3'
                    currentTarget++
                    if (currentTarget > 4) {
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
