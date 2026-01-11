import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'

const envUrl = import.meta.env.VITE_SUPABASE_URL
const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const isValidUrl = typeof envUrl === 'string' && envUrl.length > 0
const isValidKey = typeof envKey === 'string' && envKey.length > 0

export const isSupabaseConfigured = isValidUrl && isValidKey

const supabaseUrl = isSupabaseConfigured ? (envUrl as string) : 'https://example.com'
const supabaseAnonKey = isSupabaseConfigured ? (envKey as string) : 'public-anon-key'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
