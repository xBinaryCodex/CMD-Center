import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { initSession, clearSession } from '../store/useStore'

const AuthContext = createContext(null)

// Never block the UI for more than this long waiting on Supabase
const INIT_TIMEOUT_MS = 5000

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ])
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let done = false

    const finish = () => {
      if (!done) { done = true; setLoading(false) }
    }

    // Hard safety net — never stay on spinner longer than INIT_TIMEOUT_MS
    const safetyTimer = setTimeout(finish, INIT_TIMEOUT_MS)

    // Check existing session on mount
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          // Set the user immediately so the app is unblocked, sync in background
          setUser(session.user)
          finish()
          // Background sync — won't block loading
          const firstName = session.user.user_metadata?.first_name || null
          initSession(session.user.id, firstName).catch(err =>
            console.warn('[Auth] Background sync failed, using local data:', err.message)
          )
        } else {
          finish()
        }
      })
      .catch(err => {
        console.warn('[Auth] getSession failed:', err.message)
        finish()
      })

    // Auth state changes (sign in / sign out events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        finish()
        // Sync in background — don't block the UI
        const firstName = session.user.user_metadata?.first_name || null
        initSession(session.user.id, firstName).catch(err =>
          console.warn('[Auth] Sync after sign-in failed:', err.message)
        )
      } else if (event === 'SIGNED_OUT') {
        clearSession()
        setUser(null)
        done = false // allow loading to reset if they sign in again
      }
    })

    return () => {
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [])

  const signIn  = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signUp  = (email, password, extraOpts) => supabase.auth.signUp({ email, password, ...extraOpts })
  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
