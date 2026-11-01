import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Серверний клієнт Supabase.
 *
 * Використовує SUPABASE_SERVICE_ROLE_KEY (обходить RLS), тому імпортувати
 * цей модуль можна ЛИШЕ на сервері (route handlers). Браузер ніколи не
 * звертається до бази напряму — тільки через наші API з перевіркою сесії.
 */

const PLACEHOLDER_VALUES = new Set([
  '',
  'https://placeholder.supabase.co',
  'https://your-project-id.supabase.co',
  'placeholder-key',
  'your-anon-key-here',
])

function readEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return { url, serviceKey, anonKey }
}

export function isSupabaseConfigured(): boolean {
  const { url, serviceKey, anonKey } = readEnv()
  return !PLACEHOLDER_VALUES.has(url) && (!PLACEHOLDER_VALUES.has(serviceKey) || !PLACEHOLDER_VALUES.has(anonKey))
}

let cached: SupabaseClient | null = null
let warned = false

export function getSupabase(): SupabaseClient {
  if (cached) return cached
  const { url, serviceKey, anonKey } = readEnv()

  if (PLACEHOLDER_VALUES.has(url)) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL не налаштовано')
  }

  let key = serviceKey
  if (PLACEHOLDER_VALUES.has(key)) {
    if (!warned) {
      console.warn(
        'SUPABASE_SERVICE_ROLE_KEY не налаштовано — використовується anon key. ' +
        'Після ввімкнення RLS (database/migrations/001_security_hardening.sql) запис у базу не працюватиме.'
      )
      warned = true
    }
    key = anonKey
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}
