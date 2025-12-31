// Simple centralized state management


class Store {
    constructor() {
        this.state = {
            user: null,
            coins: 0,
            totalXp: 0,
            level: 0,
            dailyCoins: 0,
            weeklyMaxRound: 0,
            maxCombo: 0, // 최대 콤보 기록
            isLoading: true, // Start loading immediately
            isHardMode: false // 하드모드 토글 상태
        }
        this.listeners = []
    }

    getState() {
        return this.state
    }

    setState(newState) {
        this.state = { ...this.state, ...newState }

        // 하드모드 토글 시 body 클래스 관리
        if ('isHardMode' in newState) {
            if (newState.isHardMode) {
                document.body.classList.add('hard-mode')
            } else {
                document.body.classList.remove('hard-mode')
            }
        }

        this.notify()
    }

    subscribe(listener) {
        this.listeners.push(listener)
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener)
        }
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state))
    }
}

export const store = new Store()
