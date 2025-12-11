export class ShapeMatch {
    constructor(container, { difficulty, onCorrect, onWrong }) {
        this.container = container
        this.config = { difficulty, onCorrect, onWrong }
        // Shapes: Use unicode or simple CSS shapes for now
        this.shapes = ['●', '■', '▲', '◆', '★', '✚']
        this.colors = ['#FF5252', '#448AFF', '#69F0AE', '#FFD740', '#E040FB']
    }

    render() {
        // Difficulty scales grid size?
        // Lv 1-10: 3x3, Lv 11+: 4x4
        const gridSize = this.config.difficulty > 10 ? 4 : 3

        // Generate Items
        const totalItems = gridSize * gridSize
        const targetShape = this.getRandomItem(this.shapes)
        const targetColor = this.getRandomItem(this.colors)

        // Create correct item
        const correctItem = { shape: targetShape, color: targetColor, isTarget: true }

        // Create distractors
        const items = [correctItem]
        while (items.length < totalItems) {
            const s = this.getRandomItem(this.shapes)
            const c = this.getRandomItem(this.colors)
            // Ensure unique if possible or at least not identical to target
            if (s === targetShape && c === targetColor) continue;

            items.push({ shape: s, color: c, isTarget: false })
        }

        // Shuffle
        items.sort(() => Math.random() - 0.5)

        // Render UI
        this.container.innerHTML = `
      <div class="game-instruction">
         Find: <span style="color:${targetColor}">${targetShape}</span>
      </div>
      <div class="game-grid" style="grid-template-columns: repeat(${gridSize}, 1fr)">
         ${items.map((item, idx) => `
            <div class="grid-item" data-idx="${idx}" style="color:${item.color}">
               ${item.shape}
            </div>
         `).join('')}
      </div>
    `

        // Attach Events
        const gridItems = this.container.querySelectorAll('.grid-item');
        gridItems.forEach((el, idx) => {
            el.addEventListener('click', () => {
                const item = items[idx]
                if (item.isTarget) {
                    this.config.onCorrect()
                } else {
                    this.config.onWrong()
                    el.classList.add('shake')
                    setTimeout(() => el.classList.remove('shake'), 500)
                }
            })
        })
    }

    getRandomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)]
    }
}
