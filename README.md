# EU VAT Validator Pro

Real-time EU VAT number validation via the official VIES registry.

- 🇪🇺 All 27 EU member states + Northern Ireland
- 🏢 Structured company data (name, street, ZIP, city)
- 🧾 Audit-compliant `verification_id` (stored 90 days)
- ⚡ Smart caching (24h for valid results)
- 📦 Batch validation (up to 100 VAT numbers per request)

Published on [RapidAPI](https://rapidapi.com).

---

## Stack

- Next.js 16 (App Router)
- Vercel (serverless, region `fra1`)
- Upstash Redis (cache + rate limiting)
- VIES SOAP endpoint (parsed with `fast-xml-parser`)

## Development

```bash
npm install
cp .env.example .env.local
# fill in Upstash credentials
npm run dev
```

Test with a known-valid VAT:

```bash
curl -X POST http://localhost:3000/api/v1/validate \
  -H "Content-Type: application/json" \
  -d '{"vat_number": "LU26375245"}'
```

## Endpoints

- `POST /api/v1/validate` — single VAT validation
- `POST /api/v1/validate/batch` — batch (up to 100)
- `GET /api/health` — service health

Full spec: [openapi.yaml](./openapi.yaml)

## Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | Yes in prod | In-memory fallback locally |
| `UPSTASH_REDIS_REST_TOKEN` | Yes in prod | |
| `RAPIDAPI_PROXY_SECRET` | Yes in prod | Rejects direct calls with 403 |

## Deploy

```bash
vercel --prod
```

Set env vars via `vercel env add` or the Vercel dashboard.
