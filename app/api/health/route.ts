import { NextResponse } from 'next/server'

export const maxDuration = 10

export async function GET() {
  const viesCheck = fetch(
    'https://ec.europa.eu/taxation_customs/vies/services/checkVatService',
    {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
      body: '<?xml version="1.0"?><Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/"><Body></Body></Envelope>',
      signal: AbortSignal.timeout(5_000),
    }
  )
    .then((r) => r.status < 500)
    .catch(() => false)

  const [viesReachable] = await Promise.all([viesCheck])

  return NextResponse.json({
    status: 'ok',
    vies_reachable: viesReachable,
    timestamp: new Date().toISOString(),
  })
}
