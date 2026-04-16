import { Redis } from '@upstash/redis'
import type { ViesResult } from './vies'

const TTL_VALID = 60 * 60 * 24
const TTL_INVALID = 60 * 60

let _redis: Redis | null | undefined
function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) {
    _redis = null
    return null
  }
  try {
    _redis = new Redis({ url, token })
  } catch {
    _redis = null
  }
  return _redis
}

// In-memory fallback for local dev without Upstash
const memCache = new Map<string, { result: ViesResult; expiresAt: number }>()

function cacheKey(countryCode: string, vatNumber: string) {
  return `vat:${countryCode}:${vatNumber}`
}

export async function getCached(countryCode: string, vatNumber: string): Promise<ViesResult | null> {
  const key = cacheKey(countryCode, vatNumber)
  const redis = getRedis()

  if (redis) {
    try {
      return (await redis.get<ViesResult>(key)) ?? null
    } catch {
      return null
    }
  }

  const entry = memCache.get(key)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    memCache.delete(key)
    return null
  }
  return entry.result
}

export async function setCached(result: ViesResult): Promise<void> {
  const key = cacheKey(result.countryCode, result.vatNumber)
  const ttl = result.valid ? TTL_VALID : TTL_INVALID
  const redis = getRedis()

  if (redis) {
    try {
      await redis.set(key, result, { ex: ttl })
    } catch {
      // non-fatal
    }
    return
  }

  memCache.set(key, { result, expiresAt: Date.now() + ttl * 1000 })
}
