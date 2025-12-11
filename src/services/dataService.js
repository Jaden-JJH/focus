import { supabase } from '../lib/supabase.js'
import { store } from '../core/store.js'

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
        // Trigger handles this, but we might need to verify or fetch
        // If trigger failed (rare), we might need manual insert? 
        // For now assume trigger works.
        // Just fetch.
        return this.fetchUserData(userId)
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
        const { error } = await supabase
            .from('game_records')
            .insert({
                user_id: userId,
                max_round: round,
                xp_earned: xp
            })

        if (error) console.error('Error saving game record:', error)
    },

    async fetchWeeklyRanking() {
        // Simplified Ranking Fetch
        const { data, error } = await supabase
            .from('game_records')
            .select('user_id, max_round, users(nickname)')
            .order('max_round', { ascending: false })
            .limit(15)

        if (!error) {
            // Process unique users for ranking if needed, or just raw
            return data
        }
        return []
    }
}
