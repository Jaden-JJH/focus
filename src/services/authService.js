import { supabase } from '../lib/supabase.js'

export const authService = {
    async signInWithGoogle() {
        // Save last login provider before OAuth redirect
        localStorage.setItem('last_login_provider', 'google')

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        })

        if (error) {
            console.error('Error logging in:', error)
            throw error
        }

        return data
    },

    async signInWithKakao() {
        // Save last login provider before OAuth redirect
        localStorage.setItem('last_login_provider', 'kakao')

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'kakao',
            options: {
                redirectTo: window.location.origin
            }
        })

        if (error) {
            console.error('Error logging in with Kakao:', error)
            throw error
        }

        return data
    },

    async signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    },

    async getUser() {
        const { data: { user } } = await supabase.auth.getUser()
        return user
    },

    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback)
    }
}
