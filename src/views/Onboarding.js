export default class Onboarding {
    constructor(container) {
        this.container = container
    }

    async render() {
        this.container.innerHTML = `
      <div style="flex: 1; padding: 20px; display: flex; flex-direction: column; justify-content: center;">
        <h2>게임 규칙</h2>
        <p>빠르게 정답을 맞추고 집중력을 증명하세요.</p>
        <button id="start-btn" class="btn-primary" style="margin-top: 20px;">시작하기</button>
      </div>
    `

        document.getElementById('start-btn').addEventListener('click', () => {
            import('../core/router.js').then(r => r.navigateTo('/main'));
        });
    }
}
