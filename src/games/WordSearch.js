import audioManager from '../utils/audioManager.js'

export class WordSearch {
    constructor(container, { difficulty, roundTier, onCorrect, onWrong }) {
        this.container = container
        this.config = { difficulty, roundTier, onCorrect, onWrong }

        // Words DB by Round Tier
        // Round 1: 3글자 한글 단어 (쉬움)
        this.words3Korean = ['집중력', '기억력', '순발력', '도전자', '성장기', '발전소', '몰입감', '성공자', '희망찬', '열정적', '용기있', '지혜롭']

        // Round 2: 2글자 한글 단어 (중간)
        this.words2Korean = ['집중', '기억', '순간', '도전', '성장', '발전', '몰입', '성공', '희망', '열정', '용기', '지혜']

        // Round 3: 3글자 영어 단어 (어려움)
        this.words3English = ['add', 'run', 'set', 'get', 'put', 'pop', 'top', 'win', 'fix', 'try', 'new', 'old', 'hot', 'big']
    }

    render() {
        const tier = this.config.roundTier || 1

        // Select word list and grid size based on Round Tier
        let wordList, fillChars, gridSize
        if (tier === 3) {
            // Round 3: 3글자 영어 단어, 5x5
            wordList = this.words3English
            fillChars = 'abcdefghijklmnopqrstuvwxyz'
            gridSize = 5
        } else if (tier === 2) {
            // Round 2: 3글자 한글 단어, 5x5
            wordList = this.words3Korean
            fillChars = '가나다라마바사아자차카타파하강남동북민물불산들의지희망사랑우정행복'
            gridSize = 5
        } else {
            // Round 1: 2글자 한글 단어, 4x4
            wordList = this.words2Korean
            fillChars = '가나다라마바사아자차카타파하강남동북민물불산들의지희망사랑우정행복'
            gridSize = 4
        }

        const targetWord = this.getRandomItem(wordList)

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

        // Fill Randoms with appropriate characters
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (!grid[r][c]) {
                    grid[r][c] = fillChars[Math.floor(Math.random() * fillChars.length)]
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

                // 🔊 인게임 클릭음
                audioManager.playInGameClick()

                if (targetIndices.includes(idx)) {
                    // Check if it's the correct order? Or just any part?
                    // Let's require finding all parts.
                    el.classList.add('found')
                    el.style.backgroundColor = 'var(--theme-accent)'
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
