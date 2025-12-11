export const CONFIG = {
    MIN_TIME_LIMIT: 2.0,    // seconds (Configurable: 1.5 ~ 3.0)
    INITIAL_TIME_LIMIT: 5.0, // seconds
    DAILY_COINS: 3,
    INVITE_COIN: 1,
    INVITE_MILESTONE: 5,
    INVITE_BONUS: 3,
    INVITE_LINK_EXPIRY: 24, // hours
    TOP_RANKING_COUNT: 15,
    MAX_ROUND: 50,
    MIN_GAP_SAME_TYPE: 3,
    WARNING_THRESHOLD: 0.3, // 30% remaining time
};

export const LEVELS = {
    // Use formulas instead of hardcoded maps when possible
    // XP = floor(round + 5 * ln(round))
    calcXpForRound: (round) => Math.floor(round + 5 * Math.log(round)),

    // Required XP = 25 * level^1.5
    calcRequiredXp: (level) => Math.floor(25 * Math.pow(level, 1.5)),

    // Time = 5.0 * e^(-0.02457 * (r-1))
    calcTimeLimit: (round) => {
        const time = 5.0 * Math.exp(-0.0245708736 * (round - 1));
        return Math.max(time, CONFIG.MIN_TIME_LIMIT);
    },

    calcXpProgress: (totalXp, currentLevel) => {
        // Simple calculation: Get XP required for current level vs next level
        // Total XP is cumulative.
        // We need XpForNextLevel (Level+1) and XpForCurrentLevel (Level)
        // Actually, formulas usually work on "XP required to reach Level L".
        // calcRequiredXp(L) = Total XP needed for Level L.

        const xpForCurrentLevel = LEVELS.calcRequiredXp(currentLevel)
        const xpForNextLevel = LEVELS.calcRequiredXp(currentLevel + 1)

        const progressXp = totalXp - xpForCurrentLevel
        const levelSpan = xpForNextLevel - xpForCurrentLevel

        // Safety for level 0
        if (levelSpan <= 0) return { current: 0, max: 100, percent: 0 }

        const percent = Math.min(100, Math.floor((progressXp / levelSpan) * 100))
        return { current: progressXp, max: levelSpan, percent }
    }
};
