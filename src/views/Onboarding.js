export default class Onboarding {
    constructor(container) {
        this.container = container
    }

    async render() {
        this.container.innerHTML = `
      <div style="flex: 1; padding: 20px; display: flex; flex-direction: column; justify-content: center;">
        <h2>게임 규칙</h2>
        <p>게임 종류는 5개, 총 3단계, 50라운드</p>
        <button id="start-btn" class="btn-primary" style="margin-top: 20px;">시작하기</button>
      </div>
    `

        document.getElementById('start-btn').addEventListener('click', () => {
            import('../core/router.js').then(r => r.navigateTo('/main'));
        });
    }
}
