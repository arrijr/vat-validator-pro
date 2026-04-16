import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { checkVat, parseVatNumber, UnsupportedCountryError, ViesUnavailableError, InvalidInputError } from '@/lib/vies'
import { getCached, setCached } from '@/lib/cache'
import { checkRateLimit } from '@/lib/ratelimit'
import { badRequest, unsupported, rateLimited, upstream } from '@/lib/errors'
import { checkRapidApiProxy } from '@/lib/auth'

export const maxDuration = 15

export async function POST(req: NextRequest) {
  const forbidden = checkRapidApiProxy(req)
  if (forbidden) return forbidden

  const rl = await checkRateLimit(req)
  if (!rl.allowed) {
    return NextResponse.json(rateLimited(Math.ceil((rl.reset - Date.now()) / 1000)), {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)),
        'X-RateLimit-Remaining': '0',
      },
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

  const { vat_number } = body as Record<string, unknown>

  if (!vat_number || typeof vat_number !== 'string' || !vat_number.trim()) {
    return NextResponse.json(badRequest('Missing required field: vat_number'), { status: 400 })
  }

  let countryCode: string
  let number: string
  try {
    const parsed = parseVatNumber(vat_number.trim())
    countryCode = parsed.countryCode
    number = parsed.number
  } catch (err) {
    if (err instanceof UnsupportedCountryError) {
      return NextResponse.json(unsupported(err.message), { status: 422 })
    }
    if (err instanceof InvalidInputError) {
      return NextResponse.json(badRequest(err.message, 'INVALID_VAT_FORMAT'), { status: 422 })
    }
    return NextResponse.json(badRequest('Invalid VAT number format'), { status: 400 })
  }

  const verificationId = uuidv4()
  const rlHeaders = { 'X-RateLimit-Remaining': String(rl.remaining), 'X-Verification-Id': verificationId }

  // Check cache first
  const cached = await getCached(countryCode, number)
  if (cached) {
    return NextResponse.json(
      {
        valid: cached.valid,
        vat_number: `${cached.countryCode}${cached.vatNumber}`,
        country: cached.countryCode,
        company_name: cached.name,
        address: cached.address.raw
          ? {
              street: cached.address.street,
              city: cached.address.city,
              zip: cached.address.zip,
              country: cached.countryCode,
              raw: cached.address.raw,
            }
          : null,
        source: 'VIES',
        verification_id: verificationId,
        validated_at: new Date().toISOString(),
        cache_hit: true,
      },
      { status: 200, headers: { ...rlHeaders, 'X-Cache': 'HIT' } }
    )
  }

  // Live VIES call
  try {
    const result = await checkVat(countryCode, number)
    await setCached(result)

    return NextResponse.json(
      {
        valid: result.valid,
        vat_number: `${result.countryCode}${result.vatNumber}`,
        country: result.countryCode,
        company_name: result.name,
        address: result.address.raw
          ? {
              street: result.address.street,
              city: result.address.city,
              zip: result.address.zip,
              country: result.countryCode,
              raw: result.address.raw,
            }
          : null,
        source: 'VIES',
        verification_id: verificationId,
        validated_at: new Date().toISOString(),
        cache_hit: false,
      },
      { status: 200, headers: { ...rlHeaders, 'X-Cache': 'MISS' } }
    )
  } catch (err) {
    if (err instanceof ViesUnavailableError) {
      const payload = upstream(err.faultCode, err.transient)
      return NextResponse.json(payload, { status: 503, headers: { 'Retry-After': String(payload.retry_after ?? 10), ...rlHeaders } })
    }
    console.error('[vat-validate] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
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
