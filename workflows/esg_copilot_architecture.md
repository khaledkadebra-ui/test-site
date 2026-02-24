# ESG Copilot — System Architecture & Design
**Version:** 1.0 | **Date:** 2026-02-24 | **Status:** MVP Design

---

## Overview

ESG Copilot is an AI-powered SaaS platform that helps SMEs generate professional
ESG screening reports, CO2 emission estimates, and 12-month improvement roadmaps.

**Core Design Principle:** AI generates *narrative text only*. All CO2 figures and
ESG scores are calculated by deterministic Python engines using verified emission
factors. The LLM never invents numbers.

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INTERNET / CDN                               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                     FRONTEND  (Next.js / Vercel)                     │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Dashboard   │  │ Data Input   │  │   Report Viewer / PDF    │  │
│  │  (company    │  │ (forms +     │  │   Download               │  │
│  │   profile,   │  │  file upload)│  │                          │  │
│  │   scores)    │  │              │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS / REST API
┌──────────────────────────────▼──────────────────────────────────────┐
│                   BACKEND  (Python FastAPI)                          │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  API Layer  /api/v1/                                          │  │
│  │  auth │ companies │ submissions │ reports │ documents         │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
│                              │                                       │
│  ┌───────────────────────────▼───────────────────────────────────┐  │
│  │  Service Layer                                                │  │
│  │                                                               │  │
│  │  ┌─────────────────────┐   ┌─────────────────────────────┐   │  │
│  │  │   ESG ENGINE        │   │   AI SERVICE                │   │  │
│  │  │  (deterministic)    │   │  (narrative only)           │   │  │
│  │  │                     │   │                             │   │  │
│  │  │  calculator.py      │──▶│  report_writer.py           │   │  │
│  │  │  scorer.py          │   │  llm_client.py              │   │  │
│  │  │  gap_analyzer.py    │   │  (OpenAI GPT-4o)            │   │  │
│  │  └─────────────────────┘   └─────────────────────────────┘   │  │
│  │                                                               │  │
│  │  ┌─────────────────────┐   ┌─────────────────────────────┐   │  │
│  │  │  DOCUMENT PROCESSOR │   │  REPORT GENERATOR           │   │  │
│  │  │  pdf_parser.py      │   │  pdf_builder.py             │   │  │
│  │  │  excel_parser.py    │   │  (WeasyPrint)               │   │  │
│  │  └─────────────────────┘   └─────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Task Queue (Celery + Redis)                                 │   │
│  │  — async report generation                                   │   │
│  │  — PDF build jobs                                            │   │
│  │  — document parsing jobs                                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└───────────┬───────────────────────────────────────────┬─────────────┘
            │                                           │
┌───────────▼───────────┐               ┌──────────────▼──────────────┐
│  PostgreSQL Database  │               │  File Storage               │
│  (AWS RDS / Supabase) │               │  (S3 / Cloudflare R2)       │
│                       │               │  — uploaded docs             │
│  — users              │               │  — generated PDFs           │
│  — companies          │               │  — encrypted at rest        │
│  — submissions        │               └─────────────────────────────┘
│  — reports            │
│  — audit_logs         │               ┌─────────────────────────────┐
└───────────────────────┘               │  External APIs              │
                                        │  — OpenAI (GPT-4o)          │
                                        └─────────────────────────────┘
```

### Tech Stack Decisions

| Layer       | Choice          | Rationale                                                  |
|-------------|-----------------|-------------------------------------------------------------|
| Backend     | Python + FastAPI | Best ecosystem for data processing, AI, scientific computing |
| Frontend    | Next.js 14 (App Router) | SSR, fast builds, Vercel-native                  |
| Database    | PostgreSQL      | JSONB for flexible breakdowns, strong audit log support     |
| Task Queue  | Celery + Redis  | Async report generation without blocking API requests       |
| AI          | OpenAI GPT-4o   | Best instruction-following for constrained narrative tasks  |
| PDF         | WeasyPrint      | HTML/CSS → PDF, easy to template                           |
| File Parse  | PyPDF2 + openpyxl | Reliable PDF/Excel extraction                             |
| Auth        | JWT (HS256)     | Stateless, fits multi-tenant SaaS                          |
| Storage     | S3 / R2         | Scalable, encrypted, CDN-accessible                        |
| Deploy      | Docker + AWS ECS | Scalable, GDPR-friendly EU region                         |

---

## 2. Database Schema Design

Full DDL: `database/schema.sql`

### Entity Relationship (simplified)

```
users ──────────── companies
  │                    │
  │              data_submissions ──── energy_data
  │                    │           ──── travel_data
  │                    │           ──── procurement_data
  │                    │           ──── esg_policy_data
  │                    │
  │                 reports ────────── report_results
  │                    │           ──── uploaded_documents
  │
  └──────────────── audit_logs
```

### Key Tables

| Table              | Purpose                                                |
|--------------------|--------------------------------------------------------|
| `users`            | Auth, roles (admin / company_admin / analyst / viewer) |
| `companies`        | Company profile, industry code, country, financials    |
| `data_submissions` | One per company per reporting year. Tracks status.     |
| `energy_data`      | Scope 1+2 inputs (fuel, electricity, fleet)            |
| `travel_data`      | Scope 3 Cat 6+7 (flights, commuting)                   |
| `procurement_data` | Scope 3 Cat 1 (purchased goods, spend-based)           |
| `esg_policy_data`  | Boolean/numeric policy answers for S+G scoring         |
| `reports`          | Report metadata, version, status, PDF URL              |
| `report_results`   | All calculated outputs — CO2, scores, narratives       |
| `emission_factors` | Reference table of verified emission factors           |
| `audit_logs`       | Immutable append-only compliance log                   |

### Critical Design Decisions

- `report_results.scope1_co2e_kg` etc. are set by the calculation engine only — never by AI
- `report_results.executive_summary` is the only field written by the LLM
- All monetary fields use `DECIMAL(20,2)` — no float precision errors
- `audit_logs` uses `BIGSERIAL` (not UUID) for ordered, tamper-evident logs
- Submissions use `UNIQUE(company_id, reporting_year)` — one submission per year

---

## 3. ESG Scoring Logic Design

File: `backend/app/services/esg_engine/scorer.py`

### Weights

```
Total ESG Score (0-100)
│
├── Environmental (E)  ×0.50  ─── 50% weight
├── Social (S)         ×0.30  ─── 30% weight
└── Governance (G)     ×0.20  ─── 20% weight
```

### Environmental Scoring (50 points → normalized to 100)

| Criterion              | Max pts | Scoring Logic                                             |
|------------------------|---------|-----------------------------------------------------------|
| GHG Intensity          | 30      | Tonnes CO2e per €M revenue vs. industry benchmark        |
| Renewable Energy %     | 20      | Linear scale: 0%=0, 25%=6, 50%=10, 75%=15, 100%=20      |
| Climate Targets        | 25      | Net-zero target=25, reduction target=12, none=0           |
| Waste & Env. Policies  | 15      | Waste policy(5) + recycling %(7) + water policy(3)       |

### Social Scoring (100 points)

| Criterion              | Max pts | Scoring Logic                                             |
|------------------------|---------|-----------------------------------------------------------|
| Health & Safety        | 35      | Policy(20) + LTIR rate(15)                               |
| Training & Development | 25      | Program(12) + avg hours/employee(13)                     |
| Diversity & Inclusion  | 25      | D&I policy(15) + female management %(10)                 |
| Fair Pay               | 15      | Living wage commitment                                    |

### Governance Scoring (100 points)

| Criterion              | Max pts | Scoring Logic                                             |
|------------------------|---------|-----------------------------------------------------------|
| ESG Framework          | 40      | ESG policy(15) + CoC(10) + anti-corruption(10) + board(5)|
| Data Privacy (GDPR)    | 30      | Privacy policy in place                                   |
| Transparency           | 20      | Previous ESG reporting history                            |
| Supply Chain           | 10      | Supplier code of conduct                                  |

### Rating Scale

| Score  | Rating | Meaning                                     |
|--------|--------|---------------------------------------------|
| 80-100 | A      | ESG Leader — strong across all categories   |
| 65-79  | B      | Above average — good practices, minor gaps  |
| 50-64  | C      | Average — material gaps to address          |
| 35-49  | D      | Below average — significant improvement needed |
| 0-34   | E      | Weak — foundational gaps across E, S, G     |

### Benchmarking

Each company's total score is converted to an industry percentile using the
industry benchmark's mean/stddev from `industry_benchmarks/benchmarks.json`.
Percentile is approximated from the standard normal distribution.

---

## 4. CO2 Calculation Framework

File: `backend/app/services/esg_engine/calculator.py`

### Emission Factor Sources

| Scope | Source                              | Year |
|-------|-------------------------------------|------|
| 1     | IPCC AR6 (2022), DEFRA 2023         | 2023 |
| 2     | IEA CO2 Emissions from Fuel 2023    | 2023 |
| 3     | DEFRA 2023, EPA EEIO 2.0, ICAO      | 2023 |

All factors stored in `backend/app/data/emission_factors/`.
AI never reads or modifies these files. Only `calculator.py` loads them.

### Scope 1 — Direct Emissions

```
Stationary Combustion:
  natural_gas (m³)    × 2.04 kg CO2e/m³
  diesel (L)          × 2.68 kg CO2e/L
  petrol (L)          × 2.31 kg CO2e/L
  LPG (L)             × 1.51 kg CO2e/L
  heating oil (L)     × 2.52 kg CO2e/L
  coal (kg)           × 2.42 kg CO2e/kg

Mobile Combustion (company fleet):
  company car (km)    × 0.171 kg CO2e/km
  company van (km)    × 0.240 kg CO2e/km
  HGV truck (km)      × 0.913 kg CO2e/km
```

### Scope 2 — Purchased Energy (Location-Based)

```
electricity (kWh)       × grid_factor[country_code]  kg CO2e/kWh
district heating (kWh)  × heat_factor[country_code]  kg CO2e/kWh

Country factors (examples):
  DK: 0.154 | SE: 0.013 | DE: 0.366 | GB: 0.233
  FR: 0.052 | PL: 0.773 | US: 0.386 | EU avg: 0.296
```

### Scope 3 — Value Chain (Simplified)

```
Category 1: Purchased Goods & Services (spend-based EEIO)
  spend (EUR)  × industry_factor  kg CO2e/EUR
  (e.g. manufacturing: 0.61, technology: 0.22, food: 0.89)

Category 6: Business Travel
  short-haul flight (pkm)  × 0.255 kg CO2e/pkm
  long-haul flight (pkm)   × 0.195 kg CO2e/pkm
  rail (pkm)               × 0.035 kg CO2e/pkm
  rental car (km)          × 0.171 kg CO2e/km

Category 7: Employee Commuting
  employees × avg_commute_km × 2 × commute_days × 0.145 kg CO2e/km
  (0.145 = mixed mode: 60% car, 25% transit, 15% active)
```

### Output Structure

```python
CalculationReport:
  scope1_total_kg     # Always stored as kg, displayed as tonnes
  scope2_total_kg
  scope3_total_kg
  total_kg
  scope1_breakdown    # Dict: source → {kg_co2e, factor_used, source_citation}
  scope2_breakdown    # Same structure — full audit trail
  scope3_breakdown
```

Every breakdown entry includes `source_citation` (e.g. "DEFRA 2023") so the
PDF report can show which emission factor was applied to each line item.

---

## 5. API Structure

Base URL: `/api/v1`

### Auth
```
POST   /auth/register        Register new user
POST   /auth/login           Login, returns JWT
POST   /auth/refresh         Refresh access token
POST   /auth/logout          Invalidate token
```

### Companies
```
POST   /companies                      Create company profile
GET    /companies/{id}                 Get company details
PATCH  /companies/{id}                 Update company profile
GET    /companies/{id}/submissions     List all submissions
```

### Submissions (Data Input)
```
POST   /submissions                    Create submission (company_id + year)
GET    /submissions/{id}               Get submission + all input data
PATCH  /submissions/{id}/energy        Save energy & fuel data
PATCH  /submissions/{id}/travel        Save travel & commuting data
PATCH  /submissions/{id}/procurement   Save procurement data
PATCH  /submissions/{id}/policies      Save ESG policy answers
POST   /submissions/{id}/submit        Mark as ready for processing
GET    /submissions/{id}/completeness  Check what data is missing
```

### Documents
```
POST   /documents/upload               Upload PDF/Excel document
GET    /documents/{id}                 Get document + extracted data
DELETE /documents/{id}                 Delete uploaded document
```

### Reports
```
POST   /reports/generate               Trigger report generation
GET    /reports/{id}                   Get full report results
GET    /reports/{id}/status            Poll generation status
GET    /reports/{id}/pdf               Download PDF report
GET    /reports/{company_id}/history   List all reports for company
POST   /reports/{id}/regenerate        Regenerate with updated data
```

### Admin
```
GET    /admin/companies                List all companies (admin only)
GET    /admin/audit-logs               Query audit logs
GET    /admin/emission-factors         List/update emission factors
```

### Error Responses
All errors return: `{ "error": "CODE", "message": "...", "request_id": "..." }`

---

## 6. Folder Structure

```
esg-copilot/
│
├── backend/
│   ├── app/
│   │   ├── main.py                        # FastAPI app entry point
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── router.py              # Combines all route modules
│   │   │       └── routes/
│   │   │           ├── auth.py
│   │   │           ├── companies.py
│   │   │           ├── submissions.py
│   │   │           ├── documents.py
│   │   │           └── reports.py
│   │   ├── core/
│   │   │   ├── config.py                  # Pydantic Settings (from .env)
│   │   │   ├── security.py                # JWT, password hashing
│   │   │   └── database.py                # SQLAlchemy session
│   │   ├── models/                        # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── company.py
│   │   │   ├── submission.py
│   │   │   ├── report.py
│   │   │   └── audit_log.py
│   │   ├── schemas/                       # Pydantic request/response schemas
│   │   │   ├── company.py
│   │   │   ├── submission.py
│   │   │   └── report.py
│   │   ├── services/
│   │   │   ├── esg_engine/                # DETERMINISTIC — no AI here
│   │   │   │   ├── calculator.py          # CO2 calculation engine
│   │   │   │   ├── scorer.py              # ESG scoring model
│   │   │   │   └── gap_analyzer.py        # Gap identification + roadmap
│   │   │   ├── ai/                        # AI — narrative text ONLY
│   │   │   │   ├── llm_client.py          # OpenAI API wrapper
│   │   │   │   └── report_writer.py       # Structured prompts for sections
│   │   │   ├── report_generator/
│   │   │   │   ├── pdf_builder.py         # WeasyPrint PDF assembler
│   │   │   │   └── templates/
│   │   │   │       └── report.html        # Jinja2 PDF template
│   │   │   └── document_processor/
│   │   │       ├── pdf_parser.py          # Extract data from uploaded PDFs
│   │   │       └── excel_parser.py        # Extract data from Excel
│   │   ├── tasks/
│   │   │   ├── celery_app.py              # Celery configuration
│   │   │   └── report_tasks.py            # Async report generation task
│   │   └── data/
│   │       ├── emission_factors/
│   │       │   ├── scope1_factors.json    # IPCC/DEFRA Scope 1 factors
│   │       │   ├── scope2_factors.json    # IEA grid emission factors
│   │       │   └── scope3_factors.json    # DEFRA/EPA Scope 3 factors
│   │       └── industry_benchmarks/
│   │           └── benchmarks.json        # Industry avg scores + CO2 intensity
│   ├── tests/
│   │   ├── test_calculator.py
│   │   ├── test_scorer.py
│   │   └── test_api.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx                   # Company overview + scores
│   │   ├── input/
│   │   │   ├── company/page.tsx           # Company profile form
│   │   │   ├── energy/page.tsx            # Energy & fuel inputs
│   │   │   ├── travel/page.tsx            # Travel & commuting inputs
│   │   │   ├── procurement/page.tsx       # Procurement inputs
│   │   │   └── policies/page.tsx          # ESG policy checklist
│   │   └── reports/
│   │       ├── page.tsx                   # Report list
│   │       └── [id]/page.tsx              # Report viewer
│   ├── components/
│   │   ├── ScoreCard.tsx
│   │   ├── CO2Breakdown.tsx
│   │   ├── GapList.tsx
│   │   └── RoadmapTimeline.tsx
│   ├── lib/
│   │   └── api.ts                         # API client
│   └── package.json
│
├── database/
│   ├── schema.sql                         # Full PostgreSQL DDL
│   └── seed_emission_factors.sql          # Seed emission factor reference table
│
├── docker-compose.yml                     # Local dev: API + DB + Redis
└── .env.example
```

---

## 7. Eight-Week Development Roadmap

### Week 1 — Infrastructure & Auth
**Goal:** Working local dev environment with auth and company creation

- [ ] Initialize Git repo, Docker Compose (PostgreSQL + Redis + API)
- [ ] Run `schema.sql` — create all tables
- [ ] Implement JWT auth (register, login, refresh, logout)
- [ ] User + Company CRUD endpoints
- [ ] Audit log middleware
- [ ] Basic Next.js app with login/register screens

**Milestone:** Can create a company and log in

---

### Week 2 — Data Input Module
**Goal:** Full data collection pipeline

- [ ] Data submission endpoints (energy, travel, procurement, policies)
- [ ] File upload endpoint + S3 integration
- [ ] PDF parser (PyPDF2 + LLM-assisted field extraction)
- [ ] Excel parser (openpyxl)
- [ ] Completeness check endpoint (flags missing data)
- [ ] Frontend: all input forms with validation

**Milestone:** User can submit a complete data package

---

### Week 3 — CO2 Calculation Engine
**Goal:** Deterministic, auditable CO2 calculations

- [ ] Load all emission factor JSON files
- [ ] Implement `calculator.py` (Scope 1, 2, 3)
- [ ] Unit tests for every emission category (verify against DEFRA examples)
- [ ] Calculation API endpoint (triggered on submission)
- [ ] Store results with full breakdown in `report_results`

**Milestone:** Given input data, get correct CO2 figures with citations

---

### Week 4 — ESG Scoring Engine
**Goal:** Automated ESG scoring and gap analysis

- [ ] Implement `scorer.py` (E, S, G categories)
- [ ] Load industry benchmarks, implement percentile calc
- [ ] Implement `gap_analyzer.py` (12-month action roadmap)
- [ ] Unit tests for all scoring scenarios
- [ ] Score results stored in `report_results`

**Milestone:** Given submission, get ESG score, rating, and prioritized gaps

---

### Week 5 — AI Integration
**Goal:** AI-generated narrative sections added to reports

- [ ] OpenAI client with error handling + retries
- [ ] `report_writer.py` — executive summary, CO2 narrative, roadmap narrative
- [ ] Celery task: async report generation pipeline
  - calculate → score → analyze → write narratives → mark complete
- [ ] Report status polling endpoint

**Milestone:** Full report data (numbers + narrative) generated end-to-end

---

### Week 6 — PDF Report Generator
**Goal:** Downloadable professional PDF report

- [ ] Jinja2 HTML template for ESG report
- [ ] WeasyPrint PDF builder
- [ ] Report sections: cover, exec summary, CO2 breakdown table, score cards,
      gap analysis, 12-month roadmap, methodology appendix, disclaimer
- [ ] PDF upload to S3 + download endpoint
- [ ] Report versioning (v1, v2 etc. when regenerated)

**Milestone:** Download a branded, professional PDF report

---

### Week 7 — Frontend Dashboard
**Goal:** Full working frontend connected to API

- [ ] Company dashboard (score cards, CO2 charts)
- [ ] Data input wizard (multi-step form with progress)
- [ ] Report viewer (inline + PDF download)
- [ ] Score breakdown visualizations (Chart.js / Recharts)
- [ ] Report history list
- [ ] Mobile-responsive layout

**Milestone:** End-to-end user journey in the browser

---

### Week 8 — Security, Compliance & Deploy
**Goal:** Production-ready, GDPR-compliant deployment

- [ ] Security audit (OWASP Top 10 checklist)
- [ ] Rate limiting on all API endpoints (slowapi)
- [ ] Input validation hardening
- [ ] GDPR: data deletion endpoint, privacy policy page, consent flows
- [ ] Disclaimer on all reports (AI-generated, not CSRD certified)
- [ ] Sentry error monitoring
- [ ] AWS ECS deployment (EU region for GDPR)
- [ ] Load testing (Locust)
- [ ] Penetration test on file upload endpoint

**Milestone:** Live production deployment, GDPR-ready

---

## Legal & Compliance Notes

1. **Disclaimer (mandatory on every report):**
   > "This report is an AI-generated draft based on data provided by the user.
   > CO2 calculations use published emission factors (IPCC, DEFRA, IEA) but
   > have not been independently verified. This report does not constitute
   > CSRD compliance certification or assurance."

2. **GDPR:**
   - All PII encrypted at rest (AES-256)
   - Data retention policy: 3 years default, configurable
   - Right to erasure endpoint
   - EU region storage mandatory

3. **CSRD Expansion Path (post-MVP):**
   - Add ESRS (European Sustainability Reporting Standards) mapping
   - Integrate external data sources (Eurostat, CDP)
   - Add limited assurance workflow
   - Add double materiality assessment module

---

*Architecture document maintained in `workflows/esg_copilot_architecture.md`*
*Update this document when the implementation diverges from the design.*
