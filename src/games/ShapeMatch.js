import audioManager from '../utils/audioManager.js'

export class ShapeMatch {
    constructor(container, { difficulty, onCorrect, onWrong }) {
        this.container = container
        this.config = { difficulty, onCorrect, onWrong }
        // Shapes: Use unicode or simple CSS shapes for now
        this.shapes = ['●', '■', '▲', '◆', '★', '✚']
        this.colors = ['#FF5252', '#448AFF', '#69F0AE', '#FFD740', '#E040FB']
    }

    render() {
        // Use 4x4 grid for better difficulty
        const gridSize = 4

        // Generate Items
        const totalItems = gridSize * gridSize
        const targetShape = this.getRandomItem(this.shapes)
        const targetColor = this.getRandomItem(this.colors)

        // Create correct item
        const correctItem = { shape: targetShape, color: targetColor, isTarget: true }

        // Calculate distractor ratio based on difficulty (1-10)
        // Easy (1-3): 10-30%, Medium (4-7): 35-60%, Hard (8-10): 65-85%
        const distractorRatio = Math.min(0.85, 0.1 + (this.config.difficulty - 1) * 0.075)
        const numDistractors = Math.floor((totalItems - 1) * distractorRatio)

        // Create distractors with same shape or same color
        const items = [correctItem]
        let distractorsAdded = 0

        while (distractorsAdded < numDistractors && items.length < totalItems) {
            // 50% chance: same shape, different color
            // 50% chance: same color, different shape
            const useSameShape = Math.random() < 0.5

            let s, c
            if (useSameShape) {
                s = targetShape
                c = this.getRandomItem(this.colors.filter(color => color !== targetColor))
            } else {
                s = this.getRandomItem(this.shapes.filter(shape => shape !== targetShape))
                c = targetColor
            }

            items.push({ shape: s, color: c, isTarget: false })
            distractorsAdded++
        }

        // Fill remaining slots with completely different items
        while (items.length < totalItems) {
            const s = this.getRandomItem(this.shapes.filter(shape => shape !== targetShape))
            const c = this.getRandomItem(this.colors.filter(color => color !== targetColor))

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
                // 🔊 인게임 클릭음
                audioManager.playInGameClick()

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
