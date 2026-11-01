// Простий in-memory rate limiter (у межах одного serverless-інстансу).
// Для серйозного навантаження варто замінити на Redis/Upstash.

const buckets = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    if (buckets.size > 10_000) {
      buckets.forEach((value, k) => { if (value.resetAt <= now) buckets.delete(k) })
    }
    return true
  }

  bucket.count += 1
  return bucket.count <= limit
}
