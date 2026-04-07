'use client'

import { createClient, type AuthChangeEvent, type Session, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { Database } from '@/db/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

let browserClient: SupabaseClient<Database> | null = null

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

export function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
  }

  if (!browserClient) {
    browserClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  }

  return browserClient
}

export async function getSupabaseSessionUser() {
  const supabase = getSupabaseBrowserClient()
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    throw sessionError
  }

  return sessionData.session?.user ?? null
}

export async function requireSupabaseStorageAccount(): Promise<User> {
  const user = await getSupabaseSessionUser()

  if (!user || user.is_anonymous) {
    throw new Error('GOOGLE_STORAGE_ACCOUNT_REQUIRED')
  }

  return user
}

export async function signInWithGoogleStorageAccount() {
  const supabase = getSupabaseBrowserClient()
  const redirectTo = typeof window !== 'undefined' ? window.location.href : undefined

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      scopes: 'openid email profile',
    },
  })

  if (error) {
    throw error
  }
}

export async function signOutStorageAccount() {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

export function subscribeSupabaseAuth(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  const supabase = getSupabaseBrowserClient()
  return supabase.auth.onAuthStateChange(callback)
}
