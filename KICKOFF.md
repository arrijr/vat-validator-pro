# VAT Validation API — Kickoff

**Status:** Planning
**Erstellt:** 2026-04-15
**Owner:** Arthur

---

## Phase 1: Markt-Validierung ✅

| Kriterium | Antwort | Status |
|---|---|---|
| Direkte Konkurrenten auf RapidAPI | 9 echte VAT-APIs gefunden | ⚠️ |
| Popularity Score Top-Konkurrenten | Alle 0.0, alle 0 Subscribers | ✅ |
| Klare Differenzierung möglich? | Ja — siehe unten | ✅ |
| Zahlungsbereitschaft bewiesen? | Ja (vatsense $19–199/mo, vatlayer $10–75/mo, vatapi £15–99/mo) | ✅ |
| Rechtliche Risiken? | Niedrig — VIES ist öffentliche EU-API | ✅ |

**Fazit:** Markt ist **unversorgt**, nicht gesättigt. 9 Mitbewerber existieren aber keiner hat Adoption — klassisches Signal dass niemand es richtig gemacht hat.

### Differenzierungsstrategie
1. **Multi-Source Fallback** — VIES (EU) + UK HMRC + CH UID in einer API. Kein Konkurrent deckt alle drei ab.
2. **Smart Caching** — 24h Cache für `valid` Responses (rechtlich erlaubt für Audit-Trail). Kein Ausfall wenn VIES down.
3. **Strukturierte Firmendaten** — Name + Adresse geparst (Street, City, ZIP, Country) statt roher Text-Blob von VIES.
4. **Batch-Endpoint** — bis zu 100 VAT-Nummern in einem Request (großer Pain Point bei B2B-Buchhaltung).
5. **Audit-Trail** — jede Validation bekommt eine `verification_id` + Timestamp für Steuerprüfungs-Compliance.

---

## Phase 2: Technischer Ansatz

| Frage | Antwort |
|---|---|
| Was tut der Core-Endpoint? | VAT-Nummer → `{valid, company_name, address, country, verification_id, timestamp}` |
| Externe Datenquelle | VIES SOAP (EU), HMRC REST (UK), BFS UID REST (CH) |
| Puppeteer nötig? | **Nein** — nur HTTP/SOAP-Requests |
| Datenbank nötig? | **Ja** — Upstash Redis für Caching + Rate-Limiting + Audit-Trail |
| Async oder synchron? | Synchron (Single), Async/Batch (Multi bis 100) |
| Geschätzte Response-Zeit | 200–800ms (cached) / 1–3s (fresh VIES-Call) |
| Größtes technisches Risiko | **VIES-Instabilität** — Service ist bekannt für Downtime. Mitigation: Caching + klare 503-Response mit `retry_after` |

### Spike (1 Tag max)
- VIES SOAP-Call direkt aus Next.js API Route testen (mit `fast-xml-parser`, kein SOAP-Client nötig)
- Cold-Start Latency auf Vercel messen
- Rate-Limits von VIES austesten (offiziell keine, aber real ~10 req/s pro IP)

---

## Phase 3: API-Design (Endpoints)

**3 Endpoints für v1** (strikt limitiert):

1. `POST /api/validate` — Single VAT Number
2. `POST /api/validate/batch` — Multi VAT (bis zu 100)
3. `GET /api/health` — Health Check

Vollständiges Schema: siehe `openapi.yaml`.

### Core-Regeln
- Alle Error-Responses: `{ error: string, code: string, details?: object }`
- Header `X-RateLimit-Remaining` bei jedem Response
- Header `X-Verification-Id` bei jeder erfolgreichen Validation (für Audit-Trail)
- `verification_id` = UUID v4 + in Redis für 90 Tage gespeichert (Tax-Compliance)

---

## Phase 4: Pricing-Tiers

| Tier | Preis/Monat | Requests/Monat | Batch? | Zielgruppe |
|---|---|---|---|---|
| Free | $0 | 100 | ❌ | Testing, Hobby |
| Basic | $9 | 1.000 | ✅ (max 10/batch) | Indie-Entwickler, Einzelunternehmer |
| Pro | $29 | 10.000 | ✅ (max 100/batch) | Kleine Firmen, SaaS-Startups |
| Business | $99 | 100.000 | ✅ (max 100/batch) | Buchhaltungs-SaaS, Agenturen |

**Overage:** $5 pro 1.000 zusätzliche Requests
**Orientierung:** vatlayer nimmt $10/2.5k, $30/25k, $75/100k → wir bieten mehr Requests + Multi-Country zum gleichen Preis.

---

## Phase 5: RapidAPI Listing Vorbereitung

| Feld | Inhalt |
|---|---|
| API Name | **VAT Validator Pro** |
| Kategorie (RapidAPI) | Finance → Business / Data |
| Tagline (max 60 Zeichen) | "Real-time EU, UK & Swiss VAT validation with company data" (59) |
| Zielgruppe | Entwickler von Buchhaltungs-, Invoicing-, E-Commerce-SaaS |
| Hauptuse-Case | VAT-Nummer validieren + strukturierte Firmendaten (Name, Adresse) für Rechnungen / Compliance |
| 3 SEO-Keywords | `vat validation`, `vies api`, `eu vat check` |
| Differenzierung | Einzige API die EU + UK + CH in einem Endpoint vereint, mit strukturierter Adresse, Batch & Audit-Trail |

---

## Phase 6: Infrastruktur-Checkliste

- [ ] Neues GitHub-Repo `arrijr/vat-validation` anlegen
- [ ] Vercel-Projekt konnektieren (Region: `fra1` — näher an VIES-Servern)
- [ ] Upstash Redis erstellen (Free Tier reicht für Start)
- [ ] Environment Variables:
  - [ ] `UPSTASH_REDIS_REST_URL`
  - [ ] `UPSTASH_REDIS_REST_TOKEN`
  - [ ] `VIES_ENDPOINT` (default: `https://ec.europa.eu/taxation_customs/vies/services/checkVatService`)
  - [ ] `HMRC_ENDPOINT` + `HMRC_TOKEN` (UK)
  - [ ] `SENTRY_DSN`
- [ ] Rate-Limiting: Upstash `@upstash/ratelimit` (sliding window)
- [ ] Sentry Free Tier eingerichtet
- [ ] Health Check: `GET /api/health → { status: "ok", vies_reachable: bool, timestamp }`
- [ ] RapidAPI-Listing nach `/api-launch` Checkliste

---

## Open Questions

- [ ] UK HMRC in v1 oder v2? (HMRC braucht OAuth-Registration — ggf. erst v1.1)
- [ ] Cache-TTL: 24h für `valid`, 1h für `invalid`? (Standard in der Branche)
- [ ] Sollen wir auch CH UID in v1 liefern, oder EU-only zum Launch?

---

## Nächste Schritte

1. User reviewt KICKOFF.md + openapi.yaml
2. Open Questions beantworten
3. Spike: VIES-Call aus Vercel API Route prototypen
4. Next.js Projekt scaffolden
5. `/api-review` nach erstem funktionierenden Endpoint
6. `/rapidapi-listing` wenn MVP steht
7. `/api-launch` Checkliste vor Go-Live
