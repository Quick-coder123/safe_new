/**
 * Підписана сесія адміністратора (HMAC-SHA256, Web Crypto).
 *
 * Працює і в Node.js (route handlers), і в Edge runtime (middleware).
 * Формат токена: base64url(JSON payload) + "." + base64url(HMAC підпис).
 */

export const SESSION_COOKIE = 'admin_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8 // 8 годин

export type AdminRole = 'admin' | 'super_admin'

export interface SessionPayload {
  adminId: number
  login: string
  role: AdminRole
  isTempPassword: boolean
  /** Unix-час (секунди) закінчення сесії */
  exp: number
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (secret && secret.length >= 32) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET не налаштовано (мінімум 32 символи)')
  }
  // Лише для локальної розробки
  return 'dev-only-insecure-session-secret-change-me!!'
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach(b => { binary += String.fromCharCode(b) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function createSessionToken(
  data: Omit<SessionPayload, 'exp'>,
  maxAgeSeconds: number = SESSION_MAX_AGE_SECONDS
): Promise<string> {
  const payload: SessionPayload = { ...data, exp: Math.floor(Date.now() / 1000) + maxAgeSeconds }
  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)))
  const signature = await crypto.subtle.sign('HMAC', await getKey(), encoder.encode(body))
  return `${body}.${base64UrlEncode(new Uint8Array(signature))}`
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, signature] = parts

  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await getKey(),
      base64UrlDecode(signature),
      encoder.encode(body)
    )
    if (!valid) return null

    const payload = JSON.parse(decoder.decode(base64UrlDecode(body))) as SessionPayload
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null
    if (typeof payload.adminId !== 'number' || typeof payload.login !== 'string') return null
    if (payload.role !== 'admin' && payload.role !== 'super_admin') return null
    return payload
  } catch {
    return null
  }
}

export function sessionCookieOptions(maxAgeSeconds: number = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  }
}
