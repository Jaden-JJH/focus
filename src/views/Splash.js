import { authService } from '../services/authService.js'
import { store } from '../core/store.js'

export default class Splash {
    constructor(container) {
        this.container = container
        // Randomly select one of 3 GIFs
        this.randomGif = `/gif/${Math.floor(Math.random() * 3) + 1}..gif`
    }

    async render() {
        // Get last login provider
        const lastProvider = localStorage.getItem('last_login_provider')

        this.container.innerHTML = `
      <style>
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .login-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0 20px;
          position: relative;
          background-image: url('${this.randomGif}');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .login-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 0;
        }

        .login-container > * {
          position: relative;
          z-index: 1;
        }

        .login-buttons-wrapper {
          width: 100%;
          max-width: 400px;
          animation: slideUp 0.6s ease-out;
        }

        .social-login-btn {
          width: 100%;
          padding: 14px 20px;
          margin-bottom: 12px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          color: var(--color-text);
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          position: relative;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .social-login-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }

        .social-login-btn:active {
          transform: translateY(0);
        }

        .social-login-btn img {
          width: 20px;
          height: 20px;
          position: absolute;
          left: 20px;
        }

        .last-login-badge {
          position: absolute;
          right: 16px;
          font-size: 11px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.95);
          background: rgba(255, 255, 255, 0.18);
          padding: 3px 8px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.35);
        }

        .guest-btn {
          width: 100%;
          padding: 16px 20px;
          margin-top: 8px;
          border: none;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(10px);
          color: rgba(255, 255, 255, 0.9);
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .guest-btn:hover {
          background: rgba(0, 0, 0, 0.5);
          color: rgba(255, 255, 255, 1);
        }
      </style>

      <div class="login-container">
        <h1 class="fade-in" style="font-size: 3rem; margin-bottom: 0.25rem;">Focus</h1>
        <p class="fade-in" style="font-size: 1rem; color: rgba(255, 255, 255, 0.8); margin-bottom: 3rem; animation-delay: 0.2s; font-weight: 500;">집중력을 키우는 5분 두뇌 게임</p>

        <div class="login-buttons-wrapper">
          <button id="google-login-btn" class="social-login-btn">
            <img src="/google-logo.png" alt="Google">
            <span>Google로 시작하기</span>
            ${lastProvider === 'google' ? '<span class="last-login-badge">마지막 로그인</span>' : ''}
          </button>

          <button id="kakao-login-btn" class="social-login-btn">
            <img src="/kakao-logo.png" alt="Kakao">
            <span>Kakao로 시작하기</span>
            ${lastProvider === 'kakao' ? '<span class="last-login-badge">마지막 로그인</span>' : ''}
          </button>

          <button id="guest-btn" class="guest-btn">로그인 없이 체험하기</button>
        </div>
      </div>
    `

        // Event Listeners
        document.getElementById('google-login-btn').addEventListener('click', async () => {
            try {
                await authService.signInWithGoogle()
            } catch (error) {
                alert('Login failed: ' + error.message)
            }
        });

        document.getElementById('kakao-login-btn').addEventListener('click', async () => {
            try {
                await authService.signInWithKakao()
            } catch (error) {
                alert('Kakao login failed: ' + error.message)
            }
        });

        document.getElementById('guest-btn').addEventListener('click', () => {
            // Initialize Guest State
            store.setState({
                user: { id: 'guest', nickname: 'Guest', isGuest: true },
                coins: 999, // Unlimited (Temp)
                level: 0,
                totalXp: 0
            })
            import('../core/router.js').then(r => r.navigateTo('/onboarding'));
        });
    }
}
