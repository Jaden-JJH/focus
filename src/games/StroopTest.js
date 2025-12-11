export class StroopTest {
    constructor(container, { difficulty, onCorrect, onWrong }) {
        this.container = container
        this.config = { difficulty, onCorrect, onWrong }

        this.colors = [
            { name: '빨강', code: '#ff5252' },
            { name: '파랑', code: '#448aff' },
            { name: '초록', code: '#69f0ae' },
            { name: '노랑', code: '#ffd740' }
        ]
    }

    render() {
        // Decision: Match Meaning or Match Color?
        // Randomize instruction
        const matchColor = Math.random() > 0.5

        const textItem = this.getRandomItem(this.colors) // The word text
        const colorItem = this.getRandomItem(this.colors) // The ink color

        // Conflict? Maybe.

        const answer = matchColor ? colorItem.name : textItem.name

        this.container.innerHTML = `
      <div class="game-instruction">
         ${matchColor ? '색상을 고르세요' : '글자를 고르세요'}
      </div>
      <div style="font-size: 3rem; font-weight: bold; color: ${colorItem.code}; text-align: center; margin: 30px;">
          ${textItem.name}
      </div>
      <div class="game-options" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
         ${this.colors.map(c => `
            <button class="btn-primary option-btn" data-name="${c.name}" style="background-color: #333; border: 2px solid ${c.code}; color: white;">
               ${c.name}
            </button>
         `).join('')}
      </div>
    `

        this.container.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.name === answer) {
                    this.config.onCorrect()
                } else {
                    this.config.onWrong()
                    btn.classList.add('shake')
                    setTimeout(() => btn.classList.remove('shake'), 500)
                }
            })
        })
    }

    getRandomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)]
    }
}
