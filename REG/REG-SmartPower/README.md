# REG SmartPower — Deliverables Index

Companion app for Rwanda Energy Group Cash Power customers. Works with existing prepaid meters (no replacement/modification) via REG backend APIs.

| Folder | Contents |
|---|---|
| `docs/` | PDFs (+ editable .md sources): 01 PRD & user flows · 02 System/backend/security architecture & admin dashboard · 03 Database schema · 04 REST API design · 05 UI/UX design system, themes, wireframe→hi-fi spec · 06 Deployment plan, CI/CD, Play Store & App Store checklists, install guide · 07 Testing strategy |
| `design/mockups.html` | High-fidelity UI mockups — open in a browser (dashboard light/dark, buy flow, token success, analytics) |
| `api/openapi.yaml` | OpenAPI 3.1 specification (Swagger-ready) |
| `database/` | PostgreSQL scripts: 001_schema.sql, 002_seed.sql |
| `app/` | **Complete runnable Flutter app** (mock data — login/OTP, dashboard, buy flow with tokens, analytics, alerts, simulator, outages, 4 languages, light/dark). See `app/RUN_GUIDE.md` |
| `backend/` | NestJS: structure guide, vending state machine, REG vending adapter, OTP service |

**Key design decision:** every feature is tiered — Tier A works today from purchase history + REG vending APIs (estimates clearly labeled), Tier B activates live telemetry where AMI meters exist, Tier C awaits future REG APIs. See PRD §5.
