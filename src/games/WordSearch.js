export class WordSearch {
    constructor(container, { difficulty, onCorrect, onWrong }) {
        this.container = container
        this.config = { difficulty, onCorrect, onWrong }

        // Words DB (Simple for now)
        this.words = ['집중', '기억', '순간', '도전', '성장', '발전', '몰입', '성공', '희망', '열정', '용기', '지혜']
    }

    render() {
        const gridSize = 5
        const targetWord = this.getRandomItem(this.words)

        // Create Grid
        const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''))

        // Place Target Word (Horizontal or Vertical)
        const isVertical = Math.random() > 0.5
        const row = Math.floor(Math.random() * (gridSize - (isVertical ? targetWord.length : 0)))
        const col = Math.floor(Math.random() * (gridSize - (isVertical ? 0 : targetWord.length)))

        for (let i = 0; i < targetWord.length; i++) {
            if (isVertical) grid[row + i][col] = targetWord[i]
            else grid[row][col + i] = targetWord[i]
        }

        // Fill Randoms with random syllables
        const syllables = '가나다라마바사아자차카타파하강남동북민물불산들의지희망사랑우정행복'
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (!grid[r][c]) {
                    grid[r][c] = syllables[Math.floor(Math.random() * syllables.length)]
                }
            }
        }

        // Render
        this.container.innerHTML = `
      <div class="game-instruction">
         Find: <span style="color:var(--color-accent-light)">${targetWord}</span>
      </div>
      <div class="game-grid" style="grid-template-columns: repeat(${gridSize}, 1fr)">
         ${grid.flat().map((char, idx) => `
            <div class="grid-item word-search-item" data-idx="${idx}">
               ${char}
            </div>
         `).join('')}
      </div>
    `

        // Interaction Logic (Clicking range? Or just clicking first char?)
        // Simplified: Click all characters or just the word?
        // Let's make it simpler: drag or select?
        // For MVP/Mobile: Tap each letter of the word in order? Or just start/end?
        // Let's try: Select the full word by tapping start and end? Or just tap the cells.

        // Alternative: Just find the word and text input? No.
        // Let's implement: Tap the cells containing the word.

        const targetIndices = []
        for (let i = 0; i < targetWord.length; i++) {
            if (isVertical) targetIndices.push((row + i) * gridSize + col)
            else targetIndices.push(row * gridSize + (col + i))
        }

        let foundCount = 0
        const items = this.container.querySelectorAll('.grid-item')

        items.forEach((el, idx) => {
            el.addEventListener('click', () => {
                if (el.classList.contains('found')) return

                if (targetIndices.includes(idx)) {
                    // Check if it's the correct order? Or just any part?
                    // Let's require finding all parts.
                    el.classList.add('found')
                    el.style.backgroundColor = 'var(--color-accent)'
                    foundCount++

                    if (foundCount === targetWord.length) {
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

    getRandomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)]
    }
}
