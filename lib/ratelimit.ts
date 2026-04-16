import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest } from 'next/server'

let _ratelimit: Ratelimit | null | undefined
function getRatelimit(): Ratelimit | null {
  if (_ratelimit !== undefined) return _ratelimit
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) {
    _ratelimit = null
    return null
  }
  try {
    _ratelimit = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      prefix: 'vat:rl',
    })
  } catch {
    _ratelimit = null
  }
  return _ratelimit
}

// In-memory sliding window fallback for local dev
type Bucket = { count: number; windowStart: number }
const memBuckets = new Map<string, Bucket>()
const WINDOW_MS = 60_000
const LIMIT = 60

function memLimit(identifier: string) {
  const now = Date.now()
  const bucket = memBuckets.get(identifier)

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    memBuckets.set(identifier, { count: 1, windowStart: now })
    return { allowed: true, remaining: LIMIT - 1, reset: now + WINDOW_MS }
  }

  bucket.count += 1
  return {
    allowed: bucket.count <= LIMIT,
    remaining: Math.max(0, LIMIT - bucket.count),
    reset: bucket.windowStart + WINDOW_MS,
  }
}

export async function checkRateLimit(req: NextRequest): Promise<{
  allowed: boolean
  remaining: number
  reset: number
}> {
  const identifier =
    req.headers.get('x-rapidapi-user') ??
    req.headers.get('x-forwarded-for') ??
    'anonymous'

  const ratelimit = getRatelimit()
  if (!ratelimit) return memLimit(identifier)

  const { success, remaining, reset } = await ratelimit.limit(identifier)
  return { allowed: success, remaining, reset }
}
