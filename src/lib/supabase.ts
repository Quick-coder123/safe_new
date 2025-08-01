import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Перевірка наявності реальних змінних середовища в runtime
if (typeof window !== 'undefined' && supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('⚠️ Supabase environment variables not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      safe_categories: {
        Row: {
          id: string
          name: string
          rate_up_to_30: number
          rate_31_to_90: number
          rate_91_to_180: number
          rate_181_to_365: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          rate_up_to_30: number
          rate_31_to_90: number
          rate_91_to_180: number
          rate_181_to_365: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          rate_up_to_30?: number
          rate_31_to_90?: number
          rate_91_to_180?: number
          rate_181_to_365?: number
          created_at?: string
          updated_at?: string
        }
      }
      insurance_rates: {
        Row: {
          id: number
          min_days: number
          max_days: number
          price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          min_days: number
          max_days: number
          price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          min_days?: number
          max_days?: number
          price?: number
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          id: number
          key: string
          value: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          key: string
          value: string
          description?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          key?: string
          value?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      change_logs: {
        Row: {
          id: number
          table_name: string
          action: string
          old_values: any
          new_values: any
          user_id: string
          created_at: string
        }
        Insert: {
          id?: number
          table_name: string
          action: string
          old_values?: any
          new_values?: any
          user_id: string
          created_at?: string
        }
        Update: {
          id?: number
          table_name?: string
          action?: string
          old_values?: any
          new_values?: any
          user_id?: string
          created_at?: string
        }
      }
    }
  }
}
