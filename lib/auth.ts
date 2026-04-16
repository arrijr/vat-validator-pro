import { NextRequest, NextResponse } from 'next/server'

const PROXY_SECRET = process.env.RAPIDAPI_PROXY_SECRET

export function checkRapidApiProxy(req: NextRequest): NextResponse | null {
  if (!PROXY_SECRET) return null

  const received = req.headers.get('x-rapidapi-proxy-secret')
  if (received !== PROXY_SECRET) {
    return NextResponse.json(
      {
        error: 'This API is only accessible through RapidAPI. Subscribe at https://rapidapi.com',
        code: 'FORBIDDEN',
      },
      { status: 403 }
    )
  }

  return null
}
