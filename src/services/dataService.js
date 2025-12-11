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

        store.setState({
            user: data,
            coins: data.daily_coins,
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

    async updateCoins(userId, amount) {
        const { data, error } = await supabase
            .from('users')
            .update({ daily_coins: amount })
            .eq('id', userId)
            .select()

        if (!error && data) {
            store.setState({ coins: data[0].daily_coins })
        }
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
        // Simplified Ranking Fetch
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
            .limit(20)

        if (!error) {
            // Process unique users for ranking if needed, or just raw
            return data
        }
        return []
    }
}
