export type ApiError = {
  error: string
  code: string
  details?: Record<string, unknown>
  retry_after?: number
}

export function badRequest(message: string, code = 'BAD_REQUEST'): ApiError {
  return { error: message, code }
}

export function unsupported(message: string): ApiError {
  return { error: message, code: 'UNSUPPORTED_COUNTRY' }
}

export function rateLimited(retryAfter: number): ApiError {
  return { error: 'Rate limit exceeded', code: 'RATE_LIMITED', retry_after: retryAfter }
}

export function upstream(faultCode: string, transient: boolean): ApiError {
  const messages: Record<string, string> = {
    MS_MAX_CONCURRENT_REQ: 'The member state registry is rate-limiting requests. Please retry in a few seconds.',
    GLOBAL_MAX_CONCURRENT_REQ: 'VIES is currently overloaded. Please retry in a few seconds.',
    MS_UNAVAILABLE: 'The member state registry is temporarily unavailable.',
    SERVICE_UNAVAILABLE: 'VIES service is temporarily unavailable.',
    TIMEOUT: 'VIES request timed out. Please retry.',
    IP_BLOCKED: 'Request blocked by VIES. Please contact support.',
  }
  return {
    error: messages[faultCode] ?? 'VIES service temporarily unavailable.',
    code: faultCode,
    retry_after: transient ? 10 : 60,
  }
}
