'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  forceSignOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 初期セッションを取得
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    return { error }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      // エラーが発生しても、ローカル状態をクリア
      if (error) {
        console.warn('ログアウトエラー:', error)
        // エラーが発生しても状態をリセット
        setSession(null)
        setUser(null)
      }
      return { error }
    } catch (err) {
      console.error('ログアウト例外:', err)
      // 例外が発生しても状態をリセット
      setSession(null)
      setUser(null)
      return { error: err }
    }
  }

  // 強制ログアウト: エラーが発生しても認証状態を完全にリセット
  const forceSignOut = async () => {
    try {
      // Supabaseのログアウトを試行
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('強制ログアウト: Supabaseログアウトエラー（無視）:', err)
    }

    // ローカルストレージとセッションストレージをクリア
    try {
      // Supabase関連のストレージをクリア
      if (typeof window !== 'undefined') {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))

        // セッションストレージもクリア
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            sessionStorage.removeItem(key)
          }
        }
      }
    } catch (err) {
      console.warn('強制ログアウト: ストレージクリアエラー（無視）:', err)
    }

    // 状態を強制的にリセット
    setSession(null)
    setUser(null)
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    forceSignOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
