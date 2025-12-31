import { supabase } from '../lib/supabase.js'
import { store } from '../core/store.js'
import { LEVELS } from '../config/gameConfig.js'

// Helper function to generate unique referral code
function generateReferralCode(length = 6) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed ambiguous chars (0, O, I, 1)
    let code = ''
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}

export const dataService = {
    async fetchUserData(userId) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) {
            console.error('Error fetching user data:', error)
            return null
        }

        // Calculate total coins (daily + viral)
        const totalCoins = (data.daily_coins || 0) + (data.viral_coins || 0)

        store.setState({
            user: data,
            coins: totalCoins,
            level: data.level,
            totalXp: data.total_xp,
            maxCombo: data.max_combo || 0
        })

        return data
    },

    async createUser(userId, userMetaData, referrerCode = null) {
        // Generate unique referral code
        let referralCode = generateReferralCode()
        let attempts = 0
        const maxAttempts = 10

        // Check for uniqueness (retry if collision)
        while (attempts < maxAttempts) {
            const { data: existing } = await supabase
                .from('users')
                .select('id')
                .eq('referral_code', referralCode)
                .single()

            if (!existing) break // Code is unique
            referralCode = generateReferralCode()
            attempts++
        }

        // Find referrer's user_id if referrerCode is provided
        let referredBy = null
        if (referrerCode) {
            const { data: referrer } = await supabase
                .from('users')
                .select('id')
                .eq('referral_code', referrerCode)
                .single()

            if (referrer) {
                referredBy = referrer.id
            }
        }

        // Try manual insert in case Trigger failed
        const { data, error } = await supabase
            .from('users')
            .insert({
                id: userId,
                nickname: userMetaData?.full_name || userMetaData?.name || 'Player',
                daily_coins: 10, // Default
                viral_coins: 0, // Default
                total_xp: 0,
                level: 1,
                referral_code: referralCode,
                referred_by: referredBy
            })
            .select()
            .single()

        if (error) {
            console.warn('Manual user creation failed or already exists:', error)
            // Retry fetch, maybe it exists now
            return this.fetchUserData(userId)
        }

        // If user was referred, reward the referrer with +1 viral_coin
        if (referredBy) {
            await this.rewardReferrer(referredBy)
        }

        return data
    },

    async checkAndResetDailyCoins(userId) {
        // Fetch user's last_login_date
        const { data: user, error } = await supabase
            .from('users')
            .select('last_login_date, daily_coins, viral_coins')
            .eq('id', userId)
            .single()

        if (error || !user) {
            console.error('Error fetching user for daily reset:', error)
            return
        }

        const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
        const lastLogin = user.last_login_date

        // If last login is different from today, reset daily_coins
        if (lastLogin !== today) {
            const { data: updated, error: updateError } = await supabase
                .from('users')
                .update({
                    daily_coins: 10,
                    last_login_date: today
                })
                .eq('id', userId)
                .select()

            if (!updateError && updated) {
                // Update store with new total coins
                const totalCoins = 10 + (updated[0].viral_coins || 0)
                store.setState({
                    coins: totalCoins,
                    user: { ...store.getState().user, ...updated[0] }
                })
                console.log('Daily coins reset to 10')
            }
        }
    },

    async deductCoins(userId, amount = 1) {
        // Fetch current coins
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('daily_coins, viral_coins')
            .eq('id', userId)
            .single()

        if (fetchError || !user) {
            console.error('Error fetching user for coin deduction:', fetchError)
            return false
        }

        let dailyCoins = user.daily_coins || 0
        let viralCoins = user.viral_coins || 0

        // Deduct from daily_coins first
        if (dailyCoins >= amount) {
            dailyCoins -= amount
        } else {
            // Not enough daily_coins, use viral_coins
            const remaining = amount - dailyCoins
            dailyCoins = 0
            viralCoins -= remaining
        }

        // Update database
        const { data: updated, error: updateError } = await supabase
            .from('users')
            .update({
                daily_coins: dailyCoins,
                viral_coins: viralCoins
            })
            .eq('id', userId)
            .select()

        if (!updateError && updated) {
            // Update store
            const totalCoins = dailyCoins + viralCoins
            store.setState({
                coins: totalCoins,
                user: { ...store.getState().user, ...updated[0] }
            })
            return true
        }

        return false
    },

    async saveGameRecord(userId, round, xp, mode = 'normal', maxCombo = 0) {
        // 🔒 Security: xp_earned 값은 서버 Trigger에서 재계산됩니다.
        // 클라이언트에서 전달한 xp 값은 무시되고, calculate_xp_for_round() 함수로 재계산됩니다.
        // 이는 게임 결과 조작을 방지하기 위한 보안 조치입니다.

        // 1. Insert Record
        const { error } = await supabase
            .from('game_records')
            .insert({
                user_id: userId,
                max_round: round,
                xp_earned: xp,  // ← 이 값은 무시되고 서버에서 재계산됨
                mode: mode,
                max_combo: maxCombo
            })

        if (error) {
            console.error('Error saving game record:', error)
            return
        }

        // 2. Update User XP & Level
        // Fetch latest first to be safe
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('total_xp, level, max_combo')
            .eq('id', userId)
            .single()

        if (userError || !user) return

        const newTotalXp = (user.total_xp || 0) + xp
        let newLevel = user.level || 0

        // Loop to check level up (in case of massive XP)
        // Check if current total XP exceeds requirement for next level
        // calcRequiredXp(L) is usually "Total XP to reach Level L" or "XP for this level"?
        // Looking at gameConfig: calcRequiredXp(level) => 25 * level^1.5
        // This seems to be "XP needed to reach Level L"? Or "XP needed to pass Level L"?
        // Let's assume it's Cumulative XP for Level L.

        // If TotalXP >= Required(Level+1), then Level++
        while (true) {
            const neededForNext = LEVELS.calcRequiredXp(newLevel + 1)
            if (newTotalXp >= neededForNext) {
                newLevel++
            } else {
                break
            }
        }

        // Check if new max combo record
        const currentMaxCombo = user.max_combo || 0
        const needsComboUpdate = maxCombo > currentMaxCombo

        const updateData = {
            total_xp: newTotalXp,
            level: newLevel
        }

        if (needsComboUpdate) {
            updateData.max_combo = maxCombo
        }

        const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)

        if (!updateError) {
            // Update local store
            const storeUpdate = {
                totalXp: newTotalXp,
                level: newLevel
            }
            if (needsComboUpdate) {
                storeUpdate.maxCombo = maxCombo
            }
            store.setState(storeUpdate)
        }
    },

    async fetchWeeklyRanking(mode = 'normal') {
        // Fetch all records, then filter for max round per user
        const { data, error } = await supabase
            .from('game_records')
            .select(`
                user_id,
                max_round,
                mode,
                users (
                    nickname,
                    level
                )
            `)
            .eq('mode', mode)
            .order('max_round', { ascending: false })

        if (error) {
            console.error('Error fetching ranking:', error)
            return []
        }

        if (!data) return []

        // Group by user_id and keep only the highest max_round for each user
        const userMaxRounds = new Map()

        for (const record of data) {
            const userId = record.user_id
            const currentMax = userMaxRounds.get(userId)

            if (!currentMax || record.max_round > currentMax.max_round) {
                userMaxRounds.set(userId, record)
            }
        }

        // Convert Map to array and sort by max_round descending
        const uniqueRankings = Array.from(userMaxRounds.values())
            .sort((a, b) => b.max_round - a.max_round)
            .slice(0, 20) // Top 20

        return uniqueRankings
    },

    async getMyRank(userId, mode = 'normal') {
        // Fetch all records to calculate user's rank
        const { data, error } = await supabase
            .from('game_records')
            .select('user_id, max_round')
            .eq('mode', mode)
            .order('max_round', { ascending: false })

        if (error || !data) {
            console.error('Error fetching my rank:', error)
            return { rank: null, maxRound: 0 }
        }

        // Group by user and get max round per user
        const userMaxRounds = new Map()

        for (const record of data) {
            const uid = record.user_id
            const currentMax = userMaxRounds.get(uid)

            if (!currentMax || record.max_round > currentMax) {
                userMaxRounds.set(uid, record.max_round)
            }
        }

        // Convert to sorted array
        const sortedUsers = Array.from(userMaxRounds.entries())
            .sort((a, b) => b[1] - a[1]) // Sort by max_round descending

        // Find user's rank
        const userIndex = sortedUsers.findIndex(([uid]) => uid === userId)

        if (userIndex === -1) {
            return { rank: null, maxRound: 0, totalUsers: 0, percentile: 0 }
        }

        const rank = userIndex + 1
        const totalUsers = sortedUsers.length
        const percentile = Math.round((rank / totalUsers) * 100)

        return {
            rank,
            maxRound: sortedUsers[userIndex][1],
            totalUsers,
            percentile
        }
    },

    async rewardReferrer(referrerId) {
        // Give +1 viral_coin to the referrer
        const { data: referrer, error: fetchError } = await supabase
            .from('users')
            .select('viral_coins')
            .eq('id', referrerId)
            .single()

        if (fetchError || !referrer) {
            console.error('Error fetching referrer:', fetchError)
            return
        }

        const newViralCoins = (referrer.viral_coins || 0) + 1

        const { error: updateError } = await supabase
            .from('users')
            .update({ viral_coins: newViralCoins })
            .eq('id', referrerId)

        if (!updateError) {
            console.log(`Referrer ${referrerId} rewarded with +1 viral_coin (total: ${newViralCoins})`)
        }
    },

    async fetchWeeklyActivity(userId) {
        // Fetch last 7 days of game records
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6) // Include today
        sevenDaysAgo.setHours(0, 0, 0, 0)

        const { data, error } = await supabase
            .from('game_records')
            .select('played_at')
            .eq('user_id', userId)
            .gte('played_at', sevenDaysAgo.toISOString())

        if (error) {
            console.error('Error fetching weekly activity:', error)
            return []
        }

        return data || []
    },

    calculateStreak(weeklyActivity) {
        if (!weeklyActivity || weeklyActivity.length === 0) {
            return 0
        }

        // Get unique play dates (YYYY-MM-DD)
        const playDates = new Set(
            weeklyActivity.map(record => {
                const date = new Date(record.played_at)
                return date.toISOString().split('T')[0]
            })
        )

        const sortedDates = Array.from(playDates).sort().reverse() // Most recent first

        let streak = 0
        const today = new Date().toISOString().split('T')[0]
        let currentDate = new Date()

        // Check if user played today or yesterday
        if (sortedDates[0] !== today) {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayStr = yesterday.toISOString().split('T')[0]

            if (sortedDates[0] !== yesterdayStr) {
                return 0 // Streak broken
            }
            currentDate = yesterday
        }

        // Count consecutive days
        for (let i = 0; i < sortedDates.length; i++) {
            const expectedDate = new Date(currentDate)
            expectedDate.setDate(expectedDate.getDate() - i)
            const expectedDateStr = expectedDate.toISOString().split('T')[0]

            if (sortedDates[i] === expectedDateStr) {
                streak++
            } else {
                break
            }
        }

        return streak
    },

    getWeeklyActivityChart(weeklyActivity) {
        // Create array for last 7 days [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
        const chart = []
        const today = new Date()

        // Get unique play dates
        const playDates = new Set(
            (weeklyActivity || []).map(record => {
                const date = new Date(record.played_at)
                return date.toISOString().split('T')[0]
            })
        )

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]
            const dayName = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]

            chart.push({
                day: dayName,
                played: playDates.has(dateStr),
                isToday: i === 0
            })
        }

        return chart
    },

    async fetchUserStats(userId) {
        try {
            // 게임 기록 조회
            const { data: records, error: recordsError } = await supabase
                .from('game_records')
                .select('played_at')
                .eq('user_id', userId)

            if (recordsError) {
                console.error('Error fetching game records:', recordsError)
                return null
            }

            // 총 플레이 일수 계산 (중복 제거)
            const uniqueDays = new Set(
                records.map(r => new Date(r.played_at).toISOString().split('T')[0])
            )

            // 유저 정보 조회
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('nickname, level, max_combo, total_xp')
                .eq('id', userId)
                .single()

            if (userError) {
                console.error('Error fetching user data:', userError)
                return null
            }

            return {
                nickname: user.nickname,
                level: user.level,
                totalXp: user.total_xp || 0,
                maxCombo: user.max_combo || 0,
                totalPlayCount: records.length,
                totalPlayDays: uniqueDays.size
            }
        } catch (error) {
            console.error('Error in fetchUserStats:', error)
            return null
        }
    }
}
