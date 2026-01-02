import audioManager from '../utils/audioManager.js'

export class StroopTest {
    constructor(container, { difficulty, roundTier, onCorrect, onWrong }) {
        this.container = container
        this.config = { difficulty, roundTier, onCorrect, onWrong }

        // Basic 4 colors
        this.colors4 = [
            { name: '빨강', code: '#ff5252' },
            { name: '파랑', code: '#448aff' },
            { name: '초록', code: '#69f0ae' },
            { name: '노랑', code: '#ffd740' }
        ]

        // Extended 6 colors for Round 2+
        this.colors6 = [
            { name: '빨강', code: '#ff5252' },
            { name: '파랑', code: '#448aff' },
            { name: '초록', code: '#69f0ae' },
            { name: '노랑', code: '#ffd740' },
            { name: '보라', code: '#e040fb' },
            { name: '주황', code: '#ff9800' }
        ]

        // Extended 8 colors for Round 3
        this.colors8 = [
            { name: '빨강', code: '#ff5252' },
            { name: '파랑', code: '#448aff' },
            { name: '초록', code: '#69f0ae' },
            { name: '노랑', code: '#ffd740' },
            { name: '보라', code: '#e040fb' },
            { name: '주황', code: '#ff9800' },
            { name: '분홍', code: '#ff4081' },
            { name: '하늘', code: '#00bcd4' }
        ]
    }

    render() {
        const tier = this.config.roundTier || 1
        let colors, textItem, colorItem, matchColor, inverseQuestion, answer

        if (tier === 3) {
            // Round 3: 8 colors + always mismatch + inverse question
            colors = this.colors8
            matchColor = Math.random() > 0.5
            inverseQuestion = true // Inverse question mode

            // Always mismatch
            textItem = this.getRandomItem(colors)
            const otherColors = colors.filter(c => c.name !== textItem.name)
            colorItem = this.getRandomItem(otherColors)

            // Answer is the opposite of what's asked
            const correctAnswer = matchColor ? colorItem.name : textItem.name
            // Find what NOT to choose
            answer = correctAnswer

        } else if (tier === 2) {
            // Round 2: 6 colors + always mismatch
            colors = this.colors6
            matchColor = Math.random() > 0.5
            inverseQuestion = false

            // Always mismatch
            textItem = this.getRandomItem(colors)
            const otherColors = colors.filter(c => c.name !== textItem.name)
            colorItem = this.getRandomItem(otherColors)

            answer = matchColor ? colorItem.name : textItem.name

        } else {
            // Round 1: 4 colors + random match/mismatch (current behavior)
            colors = this.colors4
            matchColor = Math.random() > 0.5
            inverseQuestion = false

            textItem = this.getRandomItem(colors)
            colorItem = this.getRandomItem(colors)

            answer = matchColor ? colorItem.name : textItem.name
        }

        const gridCols = colors.length <= 4 ? '1fr 1fr' : colors.length <= 6 ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)'

        this.container.innerHTML = `
      <div class="game-instruction">
         ${inverseQuestion
            ? (matchColor ? '색상을 고르지 마세요' : '글자를 고르지 마세요')
            : (matchColor ? '색상을 고르세요' : '글자를 고르세요')
         }
      </div>
      <div style="font-size: 3rem; font-weight: bold; color: ${colorItem.code}; text-align: center; margin: 30px;">
          ${textItem.name}
      </div>
      <div class="game-options" style="display: grid; grid-template-columns: ${gridCols}; gap: 16px;">
         ${colors.map(c => `
            <button class="btn-primary option-btn stroop-btn" data-name="${c.name}" data-color="${c.code}" style="
               background: linear-gradient(135deg, ${c.code}15, ${c.code}25);
               border: 3px solid ${c.code};
               color: white;
               font-size: 1.5rem;
               padding: 28px 24px;
               font-weight: 600;
               text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
               border-radius: 12px;
               min-height: 80px;
               display: flex;
               align-items: center;
               justify-content: center;
            ">
               ${c.name}
            </button>
         `).join('')}
      </div>
    `

        // 🚀 이벤트 위임: 컨테이너에 하나의 리스너만 추가 (메모리 누수 방지)
        this.handleClick = (e) => {
            const btn = e.target.closest('.option-btn')
            if (!btn) return

            // 🔊 인게임 클릭음
            audioManager.playInGameClick()

            let isCorrect

            if (inverseQuestion) {
                // For inverse questions, any answer EXCEPT the correct one is right
                isCorrect = btn.dataset.name !== answer
            } else {
                // Normal mode
                isCorrect = btn.dataset.name === answer
            }

            if (isCorrect) {
                this.config.onCorrect()
            } else {
                this.config.onWrong()
                btn.classList.add('shake')
                setTimeout(() => btn.classList.remove('shake'), 500)
            }
        }

        // 이벤트 위임: 컨테이너에만 리스너 추가
        const optionsContainer = this.container.querySelector('.game-options')
        if (optionsContainer) {
            optionsContainer.addEventListener('click', this.handleClick)
        }
    }

    cleanup() {
        // 🔧 이벤트 리스너 제거 (메모리 누수 방지)
        const optionsContainer = this.container.querySelector('.game-options')
        if (optionsContainer && this.handleClick) {
            optionsContainer.removeEventListener('click', this.handleClick)
        }
    }

    getRandomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)]
    }
}
