import { XMLParser } from 'fast-xml-parser'

const VIES_ENDPOINT = 'https://ec.europa.eu/taxation_customs/vies/services/checkVatService'

const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES',
  'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT',
  'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'XI',
])

export type ViesResult = {
  valid: boolean
  countryCode: string
  vatNumber: string
  name: string | null
  address: {
    raw: string | null
    street: string | null
    city: string | null
    zip: string | null
  }
  requestDate: string | null
}

export type ViesFaultCode =
  | 'SERVICE_UNAVAILABLE'
  | 'MS_UNAVAILABLE'
  | 'MS_MAX_CONCURRENT_REQ'
  | 'TIMEOUT'
  | 'INVALID_REQUESTER_INFO'
  | 'IP_BLOCKED'
  | 'GLOBAL_MAX_CONCURRENT_REQ'
  | 'UNKNOWN'

export class ViesUnavailableError extends Error {
  constructor(public readonly faultCode: ViesFaultCode, public readonly transient: boolean) {
    super(`VIES unavailable: ${faultCode}`)
    this.name = 'ViesUnavailableError'
  }
}

export class UnsupportedCountryError extends Error {
  constructor(country: string) {
    super(`Country '${country}' is not supported. Only EU member states are supported.`)
    this.name = 'UnsupportedCountryError'
  }
}

export class InvalidInputError extends Error {
  constructor() {
    super('Invalid VAT number format')
    this.name = 'InvalidInputError'
  }
}

export function parseVatNumber(vatNumber: string): { countryCode: string; number: string } {
  const cleaned = vatNumber.replace(/[\s-]/g, '').toUpperCase()

  if (cleaned.length < 4) throw new InvalidInputError()

  const countryPrefix = cleaned.slice(0, 2)
  if (!EU_COUNTRIES.has(countryPrefix)) throw new UnsupportedCountryError(countryPrefix)

  const number = cleaned.slice(2)
  if (!/^[A-Z0-9]{2,12}$/.test(number)) throw new InvalidInputError()

  return { countryCode: countryPrefix, number }
}

function parseAddress(raw: string | null): { street: string | null; city: string | null; zip: string | null } {
  if (!raw || raw === '---') return { street: null, city: null, zip: null }

  const lines = raw.split(/\n|\\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return { street: null, city: null, zip: null }

  const street = lines[0] || null
  const lastLine = lines[lines.length - 1] ?? ''

  // Match ZIP formats across EU:
  //   DE:    "10115 Berlin"            → 10115
  //   AT:    "1010 Wien"               → 1010
  //   LU:    "L-1855 Luxembourg"       → L-1855
  //   NL:    "1012 AB Amsterdam"       → 1012 AB
  //   IE:    "Dublin 4"                → null (IE has no classic ZIP in VIES)
  //   PL:    "00-001 Warszawa"         → 00-001
  //   MT:    "VLT 1117 Valletta"       → VLT 1117
  const zipCityPatterns = [
    /^([A-Z]{1,3}-?\d{3,5})\s+(.+)$/,              // LU, MT letter-prefix
    /^(\d{2}-\d{3})\s+(.+)$/,                      // PL dash format
    /^(\d{4,5})\s+([A-Z]{2})\s+(.+)$/,             // NL "1012 AB Amsterdam"
    /^(\d{4,5})\s+(.+)$/,                          // DE, AT, FR, etc.
  ]

  for (const pattern of zipCityPatterns) {
    const match = lastLine.match(pattern)
    if (match) {
      if (pattern.source.includes('[A-Z]{2}')) {
        return { street, zip: `${match[1]} ${match[2]}`, city: match[3]?.trim() ?? null }
      }
      return { street, zip: match[1].trim(), city: match[2].trim() }
    }
  }

  return {
    street,
    zip: null,
    city: lines.length > 1 ? lastLine : null,
  }
}

function detectFault(xml: string): ViesFaultCode | null {
  if (!xml.includes('faultstring') && !xml.includes('UNAVAILABLE')) return null

  const faultMatch = xml.match(/<faultstring>([^<]+)<\/faultstring>/)
  const faultText = faultMatch?.[1] ?? ''

  if (faultText.includes('MS_MAX_CONCURRENT_REQ')) return 'MS_MAX_CONCURRENT_REQ'
  if (faultText.includes('GLOBAL_MAX_CONCURRENT_REQ')) return 'GLOBAL_MAX_CONCURRENT_REQ'
  if (faultText.includes('MS_UNAVAILABLE')) return 'MS_UNAVAILABLE'
  if (faultText.includes('SERVICE_UNAVAILABLE')) return 'SERVICE_UNAVAILABLE'
  if (faultText.includes('TIMEOUT')) return 'TIMEOUT'
  if (faultText.includes('INVALID_REQUESTER_INFO')) return 'INVALID_REQUESTER_INFO'
  if (faultText.includes('IP_BLOCKED')) return 'IP_BLOCKED'
  return 'UNKNOWN'
}

function isTransient(code: ViesFaultCode): boolean {
  return code === 'MS_MAX_CONCURRENT_REQ' || code === 'GLOBAL_MAX_CONCURRENT_REQ' || code === 'TIMEOUT'
}

async function singleViesCall(countryCode: string, vatNumber: string): Promise<ViesResult> {
  const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
  <Body>
    <checkVat xmlns="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
      <countryCode>${countryCode}</countryCode>
      <vatNumber>${vatNumber}</vatNumber>
    </checkVat>
  </Body>
</Envelope>`

  let response: Response
  try {
    response = await fetch(VIES_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml;charset=UTF-8', 'SOAPAction': '' },
      body: soapBody,
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new ViesUnavailableError('TIMEOUT', true)
  }

  if (!response.ok) {
    throw new ViesUnavailableError('SERVICE_UNAVAILABLE', false)
  }

  const xml = await response.text()

  const fault = detectFault(xml)
  if (fault) {
    if (fault === 'INVALID_REQUESTER_INFO') throw new InvalidInputError()
    throw new ViesUnavailableError(fault, isTransient(fault))
  }

  const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true })
  const parsed = parser.parse(xml)

  const vatResponse = parsed?.Envelope?.Body?.checkVatResponse
  if (!vatResponse) throw new ViesUnavailableError('UNKNOWN', false)

  const rawName = vatResponse.name as string | undefined
  const rawAddress = vatResponse.address as string | undefined
  const parsedAddress = parseAddress(rawAddress ?? null)

  return {
    valid: vatResponse.valid === true || vatResponse.valid === 'true',
    countryCode: vatResponse.countryCode as string,
    vatNumber: vatResponse.vatNumber as string,
    name: rawName && rawName !== '---' ? rawName : null,
    address: {
      raw: rawAddress && rawAddress !== '---' ? rawAddress : null,
      ...parsedAddress,
    },
    requestDate: (vatResponse.requestDate as string) ?? null,
  }
}

export async function checkVat(countryCode: string, vatNumber: string): Promise<ViesResult> {
  try {
    return await singleViesCall(countryCode, vatNumber)
  } catch (err) {
    if (err instanceof ViesUnavailableError && err.transient) {
      await new Promise((r) => setTimeout(r, 800))
      return await singleViesCall(countryCode, vatNumber)
    }
    throw err
  }
}
