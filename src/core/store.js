// Simple centralized state management


class Store {
    constructor() {
        this.state = {
            user: null,
            coins: 0,
            totalXp: 0,
            level: 0,
            dailyCoins: 0,
            weeklyMaxRound: 0
        }
        this.listeners = []
    }

    getState() {
        return this.state
    }

    setState(newState) {
        this.state = { ...this.state, ...newState }
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
