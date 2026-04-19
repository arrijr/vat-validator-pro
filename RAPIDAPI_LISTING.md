# RapidAPI Listing — VAT Validator Pro

Copy-paste ready. Paste into RapidAPI Studio → General / Settings / Documentation / Security / Tests.

---

## Core fields (Studio → Settings)

| Field | Value |
|---|---|
| **API Name** | `VAT Validator Pro` |
| **Category** | `Business Software` (secondary: `Finance`, `Data`) |
| **Base URL** | `https://vat-validator-pro.vercel.app` |
| **Health Check URL** | `https://vat-validator-pro.vercel.app/api/health` |
| **RapidAPI Host** | `vat-validator-pro.p.rapidapi.com` |
| **Privacy URL** | `https://raw.githubusercontent.com/arrijr/vat-validator-pro/main/PRIVACY.md` |
| **Terms URL** | `https://raw.githubusercontent.com/arrijr/vat-validator-pro/main/TERMS.md` |

## Secret Headers & Parameters (Studio → Security)

Add ONE row in the **Secret Headers & Parameters** table (NOT Transformations):

| Name | Value | Type |
|---|---|---|
| `X-RapidAPI-Proxy-Secret` | `33bc73d0-3963-11f1-a6d7-41c19d094688` | `Header` |

⚠️ Do NOT paste this into **Transformations** — that dialog needs a `request.header.name` dotted path and rejects plain header names with "Invalid format".

---

## TAGLINE (≤60 chars)

```
Real-time EU/UK/CH VAT number validation with audit ID
```

## SHORT DESCRIPTION (≤160 chars)

```
Real-time VAT validation for EU (VIES), UK (HMRC) & Switzerland. Returns company name, address & audit-compliant verification ID. Batch up to 100.
```

---

## LONG DESCRIPTION

```markdown
# VAT Validator Pro — Real-time VAT Number Validation (EU, UK, Switzerland)

Production-grade REST API for validating **VAT numbers** against the official registries: **VIES** (EU), **HMRC** (United Kingdom), and **BFS UID** (Switzerland). Every successful check returns the registered **company name**, **parsed address**, and an **audit-compliant verification ID** retained for 90 days — proof you checked before invoicing.

Built for **B2B invoicing, e-commerce checkouts, accounting software, and compliance tooling** that needs real VIES results, not regex-only heuristics.

## Why developers choose this API

- ✅ **Official sources** — VIES (EU 27), HMRC (UK), BFS UID (Switzerland). No scraping, no third-party aggregators
- ✅ **Audit-compliant verification ID** — stored 90 days, retrievable for tax proof
- ✅ **Structured company data** — name + parsed address (street, city, zip, country) — not just a boolean
- ✅ **Batch endpoint** — validate up to 100 VAT numbers in one request
- ✅ **Smart caching** — reduces VIES round-trips, survives VIES outages
- ✅ **Deterministic error codes** — `MS_UNAVAILABLE`, `INVALID_VAT_FORMAT`, `UNSUPPORTED_COUNTRY`, etc. Build real retry logic
- ✅ **Requester cross-check (VIES)** — pass your own VAT to receive a legally binding VIES `request_id`

## Common use cases

- **B2B invoicing** — verify customer VAT before applying the reverse-charge rule; store the verification ID with the invoice
- **E-commerce B2B checkouts** — validate on checkout, show the company name for confirmation
- **Accounting & ERP** — enrich supplier records with registered names/addresses
- **Reverse-charge compliance** — satisfy tax-authority evidence requirements
- **Lead qualification** — confirm B2B leads are real registered businesses
- **Marketplace onboarding** — verify seller tax IDs before KYC

## Endpoints

### POST /api/validate
Validate a single VAT number. Body: `{ "vat_number": "DE123456789" }` (prefix optional if `country` is provided). Optional `requester_vat` triggers the VIES cross-check and returns a legally binding `request_id`.

### POST /api/validate/batch
Validate up to 100 VAT numbers in one call. Body: `{ "vat_numbers": ["DE123456789", "FR12345678901", ...] }`. Individual failures do not fail the whole batch — each result carries its own status.

### GET /api/health
Unguarded health check. Pings VIES + HMRC reachability. Returns `{ status: "ok", vies_reachable: true, hmrc_reachable: true, timestamp: ... }`.

## Response format (example — `/api/validate`)

```json
{
  "valid": true,
  "vat_number": "DE123456789",
  "country": "DE",
  "company_name": "Acme GmbH",
  "address": {
    "street": "Hauptstr. 42",
    "city": "Berlin",
    "zip": "10115",
    "country": "DE",
    "raw": "Hauptstr. 42, 10115 Berlin, DE"
  },
  "source": "VIES",
  "verification_id": "9e4f...-uuid",
  "validated_at": "2026-04-19T12:34:56Z",
  "cache_hit": false
}
```

## Supported countries (29)

**European Union (27) — via VIES:** Austria (AT), Belgium (BE), Bulgaria (BG), Croatia (HR), Cyprus (CY), Czech Republic (CZ), Denmark (DK), Estonia (EE), Finland (FI), France (FR), Germany (DE), Greece (EL), Hungary (HU), Ireland (IE), Italy (IT), Latvia (LV), Lithuania (LT), Luxembourg (LU), Malta (MT), Netherlands (NL), Poland (PL), Portugal (PT), Romania (RO), Slovakia (SK), Slovenia (SI), Spain (ES), Sweden (SE).

**United Kingdom (GB) — via HMRC.**

**Switzerland (CH) — via BFS UID register.**

## FAQ

**Is this API free?** A BASIC plan with a limited monthly quota is available. Paid tiers start at $19/month.

**Where does the data come from?** Directly from VIES (European Commission), HMRC (UK tax authority), and BFS UID (Swiss Federal Statistical Office). No scraping, no third-party data.

**Is the verification ID legally accepted?** When a `requester_vat` is provided, VIES returns its own `request_id` which is legally binding proof of a cross-check. The API also emits its own `verification_id` for audit trails.

**How long is the verification ID stored?** 90 days, retrievable on request for tax audits.

**What happens when VIES is down?** The API returns a 503 with a deterministic error code (`MS_UNAVAILABLE`, `GLOBAL_MAX_CONCURRENT_REQ`, `SERVICE_UNAVAILABLE`, `TIMEOUT`, etc.) plus `retry_after`. Cached results continue to serve with `X-Cache: HIT`.

**Can I validate a list of VAT numbers in one call?** Yes — `POST /api/validate/batch` accepts up to 100 numbers per request.

**Does this give me tax or legal advice?** No. It returns a data service querying official registries. Use it as evidence, not as advice.

## Keywords

vat validation api, vies api, vat number validator, eu vat lookup, hmrc vat, swiss uid, bfs uid, vat check api, b2b invoicing api, reverse charge vat, vat cross-check, vies request id, company name from vat, vat audit, vat compliance api, bulk vat validation.

## Disclaimer

VAT Validator Pro queries official registries operated by third-party authorities (EU Commission, HMRC, BFS). Availability depends on those registries; see 503 error codes for upstream status. Results are provided as-is and do not constitute tax, legal, or financial advice. See TERMS.md for liability limits and data retention policy (verification IDs retained 90 days per audit-compliance requirements).
```

---

## Code examples

**JavaScript**
```javascript
const res = await fetch('https://vat-validator-pro.p.rapidapi.com/api/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY',
    'X-RapidAPI-Host': 'vat-validator-pro.p.rapidapi.com'
  },
  body: JSON.stringify({ vat_number: 'DE123456789' })
});
const data = await res.json();
console.log(data.valid, data.company_name, data.verification_id);
```

**Python**
```python
import requests
res = requests.post(
    'https://vat-validator-pro.p.rapidapi.com/api/validate',
    json={'vat_number': 'DE123456789'},
    headers={
        'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY',
        'X-RapidAPI-Host': 'vat-validator-pro.p.rapidapi.com',
    },
)
data = res.json()
print(data['valid'], data.get('company_name'), data['verification_id'])
```

**cURL**
```bash
curl -X POST "https://vat-validator-pro.p.rapidapi.com/api/validate" \
  -H "Content-Type: application/json" \
  -H "X-RapidAPI-Key: YOUR_RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: vat-validator-pro.p.rapidapi.com" \
  -d '{"vat_number":"DE123456789"}'
```

---

## Pricing (Studio → Plans)

| Tier | Price | Quota | Hard cap |
|---|---|---|---|
| **BASIC (Free)** | $0/mo | 100 req/mo | Yes |
| **PRO** | $19/mo | 5,000 req/mo | Soft — overage $5 / 1k |
| **ULTRA** | $49/mo | 25,000 req/mo | Soft — overage $3 / 1k |
| **MEGA** | $149/mo | 150,000 req/mo | Soft — overage $1.50 / 1k |

All plans: 60 req/min sliding-window rate limit (VIES has upstream concurrency limits, so the batch endpoint is preferred for high volumes).

---

## Studio Tests (free plan = 2 tests max — default to 1)

### Test 1 — Health check (MANDATORY)

- **Location:** Frankfurt
- **Schedule:** every 15 min
- **Step 1 — HTTP GET**
  - URL: `https://vat-validator-pro.vercel.app/api/health`
  - No headers needed (`/api/health` is unguarded)
  - Variable name: `health`
- **Step 2 — Assert Equals**
  - Expression: `health.data.status` *(no `{{ }}` braces, use Studio's variable picker)*
  - Value: `ok`

### Test 2 — optional (only if adding a second test)

Prefer a deterministic **format-rejection** test (POST `/api/validate` with `{"vat_number":"BAD"}` → assert `fmt.data.code == INVALID_VAT_FORMAT`) over a live VIES happy-path — VIES downtime would falsely fail a happy-path test.

---

## Pre-Go-Live checklist

1. ✅ Base URL set to `https://vat-validator-pro.vercel.app`
2. ✅ Secret Header `X-RapidAPI-Proxy-Secret` configured
3. ✅ Privacy + Terms URLs pasted
4. ✅ Health test green
5. ✅ Playground smoketest: subscribe to own API, call `/api/validate` via Try-It with a real Consumer key → expect 200 (verifies Gateway → Secret Injection → Origin chain)
