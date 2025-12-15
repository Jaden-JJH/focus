export const CONFIG = {
    MIN_TIME_LIMIT: 2.0,    // seconds (Configurable: 1.5 ~ 3.0)
    INITIAL_TIME_LIMIT: 5.0, // seconds
    DAILY_COINS: 10,
    INVITE_COIN: 1,
    INVITE_MILESTONE: 5,
    INVITE_BONUS: 3,
    INVITE_LINK_EXPIRY: 24, // hours
    TOP_RANKING_COUNT: 15,
    MAX_ROUND: 50,
    MIN_GAP_SAME_TYPE: 3,
    WARNING_THRESHOLD: 0.3, // 30% remaining time
};

// Level information data (1-61)
export const LEVEL_DATA = [
    // 🟣 Lv 1-3: 쇼츠 집중
    { level: 1, name: '쇼츠 1편', category: '쇼츠 집중', color: '#9333ea', range: [1, 3] },
    { level: 2, name: '쇼츠 5편', category: '쇼츠 집중', color: '#9333ea', range: [1, 3] },
    { level: 3, name: '쇼츠 무한 스크롤', category: '쇼츠 집중', color: '#9333ea', range: [1, 3] },
    // 🟢 Lv 4-7: 음악 집중
    { level: 4, name: '음악 1곡', category: '음악 집중', color: '#22c55e', range: [4, 7] },
    { level: 5, name: '음악 3곡', category: '음악 집중', color: '#22c55e', range: [4, 7] },
    { level: 6, name: '플레이리스트 1개', category: '음악 집중', color: '#22c55e', range: [4, 7] },
    { level: 7, name: '앨범 1장', category: '음악 집중', color: '#22c55e', range: [4, 7] },
    // 🔵 Lv 8-11: 드라마 집중
    { level: 8, name: '드라마 예고편', category: '드라마 집중', color: '#3b82f6', range: [8, 11] },
    { level: 9, name: '드라마 클립', category: '드라마 집중', color: '#3b82f6', range: [8, 11] },
    { level: 10, name: '웹드라마', category: '드라마 집중', color: '#3b82f6', range: [8, 11] },
    { level: 11, name: '드라마', category: '드라마 집중', color: '#3b82f6', range: [8, 11] },
    // 🟡 Lv 12-15: 뉴스/다큐 집중
    { level: 12, name: '일기예보', category: '뉴스/다큐 집중', color: '#eab308', range: [12, 15] },
    { level: 13, name: '스포츠 뉴스', category: '뉴스/다큐 집중', color: '#eab308', range: [12, 15] },
    { level: 14, name: '시사 뉴스', category: '뉴스/다큐 집중', color: '#eab308', range: [12, 15] },
    { level: 15, name: '다큐멘터리', category: '뉴스/다큐 집중', color: '#eab308', range: [12, 15] },
    // 🟠 Lv 16-18: 영화 집중
    { level: 16, name: '영화 1편', category: '영화 집중', color: '#f97316', range: [16, 18] },
    { level: 17, name: '감독판 + 쿠키', category: '영화 집중', color: '#f97316', range: [16, 18] },
    { level: 18, name: '시리즈 영화', category: '영화 집중', color: '#f97316', range: [16, 18] },
    // 🔴 Lv 19-21: 팟캐스트 집중
    { level: 19, name: '경제 팟캐스트 클립', category: '팟캐스트 집중', color: '#ef4444', range: [19, 21] },
    { level: 20, name: '경제 팟캐스트 1편', category: '팟캐스트 집중', color: '#ef4444', range: [19, 21] },
    { level: 21, name: '경제 팟캐스트 연속', category: '팟캐스트 집중', color: '#ef4444', range: [19, 21] },
    // 🟤 Lv 22-24: 공부 집중
    { level: 22, name: '강의 30분', category: '공부 집중', color: '#a16207', range: [22, 24] },
    { level: 23, name: '강의 1시간', category: '공부 집중', color: '#a16207', range: [22, 24] },
    { level: 24, name: '전공 2과목 연강', category: '공부 집중', color: '#a16207', range: [22, 24] },
    // ⚫ Lv 25-29: 러닝 집중
    { level: 25, name: '5km 러닝', category: '러닝 집중', color: '#1f2937', range: [25, 29] },
    { level: 26, name: '10km 러닝', category: '러닝 집중', color: '#1f2937', range: [25, 29] },
    { level: 27, name: '하프 마라톤', category: '러닝 집중', color: '#1f2937', range: [25, 29] },
    { level: 28, name: 'LSD 30km', category: '러닝 집중', color: '#1f2937', range: [25, 29] },
    { level: 29, name: '풀 마라톤', category: '러닝 집중', color: '#1f2937', range: [25, 29] },
    // 🟧 Lv 30-32: 시험 집중
    { level: 30, name: 'TOEIC 120분', category: '시험 집중', color: '#fb923c', range: [30, 32] },
    { level: 31, name: '모의고사 풀세트', category: '시험 집중', color: '#fb923c', range: [30, 32] },
    { level: 32, name: '대학수능', category: '시험 집중', color: '#fb923c', range: [30, 32] },
    // 🟨 Lv 33-36: 경기 집중
    { level: 33, name: '탁구 풀매치', category: '경기 집중', color: '#fbbf24', range: [33, 36] },
    { level: 34, name: '축구 풀타임 90분', category: '경기 집중', color: '#fbbf24', range: [33, 36] },
    { level: 35, name: 'UFC 5라운드', category: '경기 집중', color: '#fbbf24', range: [33, 36] },
    { level: 36, name: '복싱 12라운드', category: '경기 집중', color: '#fbbf24', range: [33, 36] },
    // 🟦 Lv 37-39: 레이싱 집중
    { level: 37, name: '나스카', category: '레이싱 집중', color: '#60a5fa', range: [37, 39] },
    { level: 38, name: 'F1 그랑프리', category: '레이싱 집중', color: '#60a5fa', range: [37, 39] },
    { level: 39, name: '르망 24시', category: '레이싱 집중', color: '#60a5fa', range: [37, 39] },
    // 🟥 Lv 40-42: 인간 병기
    { level: 40, name: '파일럿', category: '인간 병기', color: '#dc2626', range: [40, 42] },
    { level: 41, name: '항공모함 함장', category: '인간 병기', color: '#dc2626', range: [40, 42] },
    { level: 42, name: '탑건', category: '인간 병기', color: '#dc2626', range: [40, 42] },
    // 🟪 Lv 43-46: 극한 직업
    { level: 43, name: '스나이퍼', category: '극한 직업', color: '#a855f7', range: [43, 46] },
    { level: 44, name: '우주 비행사', category: '극한 직업', color: '#a855f7', range: [43, 46] },
    { level: 45, name: '핵 원자로 제어', category: '극한 직업', color: '#a855f7', range: [43, 46] },
    { level: 46, name: '심장 수술', category: '극한 직업', color: '#a855f7', range: [43, 46] },
    // 🟫 Lv 47-51: 천재 (물음표 구간 시작)
    { level: 47, name: '알파고', category: '천재', color: '#92400e', range: [47, 51], locked: true },
    { level: 48, name: '일론 머스크', category: '천재', color: '#92400e', range: [47, 51], locked: true },
    { level: 49, name: '베토벤', category: '천재', color: '#92400e', range: [47, 51], locked: true },
    { level: 50, name: '레오나르도 다빈치', category: '천재', color: '#92400e', range: [47, 51], locked: true },
    { level: 51, name: '아인슈타인', category: '천재', color: '#92400e', range: [47, 51], locked: true },
    // ⚪ Lv 52-55: 사상가
    { level: 52, name: '데카르트', category: '사상가', color: '#e5e7eb', range: [52, 55], locked: true },
    { level: 53, name: '공자', category: '사상가', color: '#e5e7eb', range: [52, 55], locked: true },
    { level: 54, name: '칸트', category: '사상가', color: '#e5e7eb', range: [52, 55], locked: true },
    { level: 55, name: '소크라테스', category: '사상가', color: '#e5e7eb', range: [52, 55], locked: true },
    // 🟡 Lv 56-58: 해탈
    { level: 56, name: '석가모니', category: '해탈', color: '#fde047', range: [56, 58], locked: true },
    { level: 57, name: '달라이 라마', category: '해탈', color: '#fde047', range: [56, 58], locked: true },
    { level: 58, name: '부처', category: '해탈', color: '#fde047', range: [56, 58], locked: true },
    // 🌌 Lv 59-60: 초월
    { level: 59, name: '유체이탈', category: '초월', color: '#818cf8', range: [59, 60], locked: true },
    { level: 60, name: '시공간 초월', category: '초월', color: '#818cf8', range: [59, 60], locked: true },
    // 🌌 Lv 61: ???
    { level: 61, name: '신', category: '???', color: '#6366f1', range: [61, 61], locked: true },
];

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
    },

    // Get level info by level number
    getLevelInfo: (level) => {
        return LEVEL_DATA[level - 1] || LEVEL_DATA[0];
    },

    // Get level image path
    getLevelImage: (level) => {
        return `/Lv/${level}.jpeg`;
    }
};
