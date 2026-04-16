# RapidAPI Listing — VAT Validator Pro

Copy-paste ready. Fields map 1:1 to RapidAPI Studio → General / Settings / Documentation.

---

## NAME
```
EU VAT Validator Pro
```

## CATEGORY
```
Business Software
```
(Secondary: Finance / Data)

## TAGLINE (59/60 chars)
```
Verify EU VAT numbers with company data in milliseconds
```

## SHORT DESCRIPTION (appears under API name in search)
```
Real-time EU VAT validation via VIES. Returns parsed company name, street, ZIP, and city — not just valid/invalid. Includes batch validation and audit-compliant verification IDs for tax-proof record keeping.
```

## TAGS (10)
```
vat, vies, eu-vat, vat-validation, vat-check, b2b, invoicing, tax-compliance, europe, vat-number
```

---

## LONG DESCRIPTION

```markdown
## What is EU VAT Validator Pro?

**EU VAT Validator Pro** is a fast, reliable API that validates VAT numbers for all 27 EU member states plus Northern Ireland — directly against the official VIES registry (European Commission). Unlike a plain "valid / invalid" check, this API returns **structured company data** (name, street, ZIP, city) and an **audit-compliant verification ID** you can store for tax compliance.

Built for B2B applications that need to prove they validated a customer's VAT before issuing a reverse-charge invoice — and that need it to still work when VIES has a hiccup.

## Use Cases

- **Invoicing & Accounting Software** — Auto-fill B2B customer details from a VAT number at checkout. Store the `verification_id` with each invoice for tax audit trail.
- **E-Commerce B2B Checkouts** — Apply the right VAT treatment (reverse-charge for intra-EU B2B, domestic rate otherwise) based on a validated VAT number.
- **CRM Enrichment** — Paste a VAT number, get the legal company name and registered address. Clean up lead lists automatically.
- **Compliance Monitoring** — Bulk-revalidate your existing customer base. Batch endpoint accepts up to 100 VAT numbers per request.

## Why EU VAT Validator Pro?

- ✅ **Structured addresses** — We parse `street`, `zip`, and `city` from the raw VIES response. No string gymnastics on your end.
- ✅ **Audit-compliant** — Every successful validation returns a UUID `verification_id` stored for 90 days. Your tax auditor will thank you.
- ✅ **Smart caching** — Validated results are cached 24h (configurable). Get sub-10ms response times on repeat lookups and stay operational when VIES is slow.
- ✅ **Transparent error codes** — We surface specific VIES fault codes (`MS_MAX_CONCURRENT_REQ`, `MS_UNAVAILABLE`, etc.) so you can build smart retry logic.
- ✅ **Batch endpoint** — Validate up to 100 VAT numbers per request, results returned in input order.
- ✅ **All 28 jurisdictions** — 27 EU member states + Northern Ireland (XI) covered out of the box.

## Getting Started

1. Subscribe to a plan (Free tier: 100 requests/month)
2. Copy your RapidAPI key
3. POST your first VAT number:

```javascript
const response = await fetch('https://eu-vat-validator-pro.p.rapidapi.com/api/v1/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY',
    'X-RapidAPI-Host': 'eu-vat-validator-pro.p.rapidapi.com'
  },
  body: JSON.stringify({ vat_number: 'LU26375245' })
});

const data = await response.json();
console.log(data);
```

## Response Format

```json
{
  "valid": true,
  "vat_number": "LU26375245",
  "country": "LU",
  "company_name": "AMAZON EUROPE CORE S.A R.L.",
  "address": {
    "street": "38, AVENUE JOHN F. KENNEDY",
    "city": "LUXEMBOURG",
    "zip": "L-1855",
    "country": "LU",
    "raw": "38, AVENUE JOHN F. KENNEDY\nL-1855  LUXEMBOURG"
  },
  "source": "VIES",
  "verification_id": "44e1b8cf-4914-4fc5-b8be-53a4155514d1",
  "validated_at": "2026-04-15T19:38:09.166Z",
  "cache_hit": false
}
```

## Batch Validation

Validate up to 100 VAT numbers in a single request:

```javascript
await fetch('https://eu-vat-validator-pro.p.rapidapi.com/api/v1/validate/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY',
    'X-RapidAPI-Host': 'eu-vat-validator-pro.p.rapidapi.com'
  },
  body: JSON.stringify({
    vat_numbers: ['LU26375245', 'FR40303265045', 'DE811363057']
  })
});
```

## Supported Countries

AT, BE, BG, CY, CZ, DE, DK, EE, EL (Greece), ES, FI, FR, HR, HU, IE, IT, LT, LU, LV, MT, NL, PL, PT, RO, SE, SI, SK, XI (Northern Ireland)

## Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `UNSUPPORTED_COUNTRY` | 422 | Country code is outside the EU |
| `INVALID_VAT_FORMAT` | 422 | VAT number does not match the expected format |
| `MS_MAX_CONCURRENT_REQ` | 503 | Member state registry is rate-limiting (retry in ~10s) |
| `GLOBAL_MAX_CONCURRENT_REQ` | 503 | VIES is overloaded (retry shortly) |
| `MS_UNAVAILABLE` | 503 | Member state registry is temporarily offline |
| `SERVICE_UNAVAILABLE` | 503 | VIES itself is down |
| `TIMEOUT` | 503 | Upstream request timed out |
| `RATE_LIMITED` | 429 | Too many requests — respect the `Retry-After` header |

## Rate Limits

Each paid tier has a monthly request quota. Soft per-minute limit: **60 requests/minute** per API key (sliding window). Contact us via RapidAPI for higher limits.

## About the Data

VAT validation happens live against the official **VIES** (VAT Information Exchange System) operated by the European Commission. VIES is the legally authoritative source — a successful lookup is admissible as proof of VAT verification in EU tax proceedings. The `verification_id` returned with each successful validation is stored for 90 days and can be referenced in audits.
```

---

## CODE EXAMPLE (JavaScript / Node.js)

```javascript
// Single VAT validation
const response = await fetch('https://eu-vat-validator-pro.p.rapidapi.com/api/v1/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY',
    'X-RapidAPI-Host': 'eu-vat-validator-pro.p.rapidapi.com'
  },
  body: JSON.stringify({ vat_number: 'LU26375245' })
});

const data = await response.json();

if (data.valid) {
  console.log(`Valid: ${data.company_name}`);
  console.log(`Address: ${data.address.street}, ${data.address.zip} ${data.address.city}`);
  console.log(`Audit ID: ${data.verification_id}`);
} else {
  console.log('VAT number is not valid');
}
```

## CODE EXAMPLE (Python)

```python
import requests

response = requests.post(
    'https://eu-vat-validator-pro.p.rapidapi.com/api/v1/validate',
    headers={
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY',
        'X-RapidAPI-Host': 'eu-vat-validator-pro.p.rapidapi.com',
    },
    json={'vat_number': 'LU26375245'}
)

data = response.json()
print(data)
```

## CODE EXAMPLE (curl)

```bash
curl -X POST https://eu-vat-validator-pro.p.rapidapi.com/api/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-RapidAPI-Key: YOUR_RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: eu-vat-validator-pro.p.rapidapi.com" \
  -d '{"vat_number": "LU26375245"}'
```

---

## PRICING TIERS (to enter in RapidAPI Studio → Plans)

| Tier | Price | Quota | Hard cap? | Batch limit |
|---|---|---|---|---|
| **BASIC (Free)** | $0/mo | 100 req/mo | Yes | no batch |
| **PRO** | $9/mo | 1,000 req/mo | soft, overage $5 / 1k | 10 per batch |
| **ULTRA** | $29/mo | 10,000 req/mo | soft, overage $5 / 1k | 100 per batch |
| **MEGA** | $99/mo | 100,000 req/mo | soft, overage $3 / 1k | 100 per batch |

**Rate limit on all tiers:** 60 req/min (sliding window)

---

## SEO KEYWORDS (for RapidAPI search ranking)

Primary: `vat validation`, `eu vat`, `vies api`
Secondary: `vat number check`, `vat validator`, `european vat`, `tax id verification`
Long-tail: `validate eu vat number api`, `vies vat check with company name`, `batch vat validation`
