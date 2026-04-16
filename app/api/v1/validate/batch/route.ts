import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { checkVat, parseVatNumber, UnsupportedCountryError, ViesUnavailableError } from '@/lib/vies'
import { getCached, setCached } from '@/lib/cache'
import { checkRateLimit } from '@/lib/ratelimit'
import { badRequest, rateLimited } from '@/lib/errors'
import { checkRapidApiProxy } from '@/lib/auth'

export const maxDuration = 30

const MAX_BATCH = 100

export async function POST(req: NextRequest) {
  const forbidden = checkRapidApiProxy(req)
  if (forbidden) return forbidden

  const rl = await checkRateLimit(req)
  if (!rl.allowed) {
    return NextResponse.json(rateLimited(Math.ceil((rl.reset - Date.now()) / 1000)), {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) },
    })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(badRequest('Request body must be valid JSON'), { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(badRequest('Request body must be a JSON object'), { status: 400 })
  }

  const { vat_numbers } = body as Record<string, unknown>

  if (!Array.isArray(vat_numbers) || vat_numbers.length === 0) {
    return NextResponse.json(badRequest('vat_numbers must be a non-empty array'), { status: 400 })
  }

  if (vat_numbers.length > MAX_BATCH) {
    return NextResponse.json(badRequest(`Maximum ${MAX_BATCH} VAT numbers per batch`), { status: 400 })
  }

  const batchId = uuidv4()

  // Process all in parallel (VIES is IO-bound, parallel is fine up to ~10 req/s)
  const results = await Promise.all(
    vat_numbers.map(async (raw: unknown) => {
      if (typeof raw !== 'string' || !raw.trim()) {
        return {
          vat_number: String(raw),
          valid: false,
          error: 'Invalid input',
          code: 'BAD_REQUEST',
        }
      }

      let countryCode: string
      let number: string
      try {
        const parsed = parseVatNumber(raw.trim())
        countryCode = parsed.countryCode
        number = parsed.number
      } catch (err) {
        return {
          vat_number: raw,
          valid: false,
          error: err instanceof UnsupportedCountryError ? err.message : 'Invalid VAT number format',
          code: err instanceof UnsupportedCountryError ? 'UNSUPPORTED_COUNTRY' : 'BAD_REQUEST',
        }
      }

      const verificationId = uuidv4()

      const cached = await getCached(countryCode, number)
      if (cached) {
        return {
          vat_number: `${cached.countryCode}${cached.vatNumber}`,
          valid: cached.valid,
          country: cached.countryCode,
          company_name: cached.name,
          address: cached.address.raw
            ? { street: cached.address.street, city: cached.address.city, zip: cached.address.zip, raw: cached.address.raw }
            : null,
          source: 'VIES',
          verification_id: verificationId,
          validated_at: new Date().toISOString(),
          cache_hit: true,
        }
      }

      try {
        const result = await checkVat(countryCode, number)
        await setCached(result)
        return {
          vat_number: `${result.countryCode}${result.vatNumber}`,
          valid: result.valid,
          country: result.countryCode,
          company_name: result.name,
          address: result.address.raw
            ? { street: result.address.street, city: result.address.city, zip: result.address.zip, raw: result.address.raw }
            : null,
          source: 'VIES',
          verification_id: verificationId,
          validated_at: new Date().toISOString(),
          cache_hit: false,
        }
      } catch (err) {
        if (err instanceof ViesUnavailableError) {
          return { vat_number: raw, valid: false, error: `VIES unavailable: ${err.faultCode}`, code: err.faultCode }
        }
        return { vat_number: raw, valid: false, error: 'Internal error', code: 'INTERNAL_ERROR' }
      }
    })
  )

  return NextResponse.json(
    { batch_id: batchId, processed_at: new Date().toISOString(), results },
    { status: 200, headers: { 'X-RateLimit-Remaining': String(rl.remaining) } }
  )
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-RapidAPI-Key',
    },
  })
}
