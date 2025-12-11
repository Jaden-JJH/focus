import { supabase } from '../lib/supabase.js'
import { store } from '../core/store.js'
import { LEVELS } from '../config/gameConfig.js'

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
            totalXp: data.total_xp
        })

        return data
    },

    async createUser(userId, userMetaData) {
        // Try manual insert in case Trigger failed
        const { data, error } = await supabase
            .from('users')
            .insert({
                id: userId,
                nickname: userMetaData?.full_name || userMetaData?.name || 'Player',
                daily_coins: 3, // Default
                viral_coins: 0, // Default
                total_xp: 0,
                level: 1
            })
            .select()
            .single()

        if (error) {
            console.warn('Manual user creation failed or already exists:', error)
            // Retry fetch, maybe it exists now
            return this.fetchUserData(userId)
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
                    daily_coins: 3,
                    last_login_date: today
                })
                .eq('id', userId)
                .select()

            if (!updateError && updated) {
                // Update store with new total coins
                const totalCoins = 3 + (updated[0].viral_coins || 0)
                store.setState({
                    coins: totalCoins,
                    user: { ...store.getState().user, ...updated[0] }
                })
                console.log('Daily coins reset to 3')
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

    async saveGameRecord(userId, round, xp) {
        // 1. Insert Record
        const { error } = await supabase
            .from('game_records')
            .insert({
                user_id: userId,
                max_round: round,
                xp_earned: xp
            })

        if (error) {
            console.error('Error saving game record:', error)
            return
        }

        // 2. Update User XP & Level
        // Fetch latest first to be safe
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('total_xp, level')
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

        const { error: updateError } = await supabase
            .from('users')
            .update({
                total_xp: newTotalXp,
                level: newLevel
            })
            .eq('id', userId)

        if (!updateError) {
            // Update local store
            store.setState({
                totalXp: newTotalXp,
                level: newLevel
            })
        }
    },

    async fetchWeeklyRanking() {
        // Fetch all records, then filter for max round per user
        const { data, error } = await supabase
            .from('game_records')
            .select(`
                user_id,
                max_round,
                users (
                    nickname
                )
            `)
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

    async getMyRank(userId) {
        // Fetch all records to calculate user's rank
        const { data, error } = await supabase
            .from('game_records')
            .select('user_id, max_round')
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
            return { rank: null, maxRound: 0 }
        }

        return {
            rank: userIndex + 1,
            maxRound: sortedUsers[userIndex][1]
        }
    }
}
