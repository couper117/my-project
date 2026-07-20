# REG SmartPower — System & Security Architecture

**Version:** 1.0 · **Date:** July 2026

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐   │
│  │ Flutter App  │  │ Flutter App  │  │  Admin Web Portal (React)    │   │
│  │  (Android)   │  │    (iOS)     │  │  REG staff, RBAC             │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┬───────────────┘   │
└─────────┼─────────────────┼─────────────────────────┼───────────────────┘
          │ HTTPS/TLS1.3 + cert pinning │ WSS (live)  │
┌─────────▼─────────────────▼─────────────────────────▼───────────────────┐
│                    API GATEWAY (Azure API Management)                    │
│        WAF · rate limiting · JWT validation · request logging           │
└─────────┬────────────────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────────────────┐
│                     BACKEND — NestJS microservices (AKS)                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌────────────────┐  │
│ │  Auth    │ │  Meters  │ │ Vending  │ │ Analytics │ │ Notifications  │  │
│ │ OAuth2   │ │ info,    │ │ purchase │ │ usage,    │ │ FCM / APNs,    │  │
│ │ OTP, JWT │ │ multi-   │ │ tokens,  │ │ prediction│ │ SMS gateway    │  │
│ │ biometric│ │ meter,   │ │ payments │ │ ML service│ │ topics         │  │
│ │ sessions │ │ sharing  │ │ receipts │ │ (Python)  │ │                │  │
│ └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘ └───────┬────────┘  │
│ ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐ ┌─────┴─────┐ ┌───────┴────────┐  │
│ │ Support  │ │ Outages  │ │ Payments │ │  Admin    │ │  WebSocket     │  │
│ │ tickets, │ │ map,     │ │ MoMo,    │ │  service  │ │  gateway       │  │
│ │ chat     │ │ schedule │ │ Airtel,  │ │  RBAC     │ │  (live updates)│  │
│ └──────────┘ └──────────┘ │ cards,QR │ └───────────┘ └────────────────┘  │
│                           └──────────┘                                   │
└─────────┬──────────────────────┬─────────────────────────┬───────────────┘
          │                      │                         │
┌─────────▼──────────┐ ┌─────────▼───────────┐ ┌───────────▼───────────────┐
│   DATA LAYER       │ │  INTEGRATION LAYER  │ │  EXTERNAL SERVICES        │
│ PostgreSQL (HA)    │ │  (Anti-corruption   │ │  MTN MoMo API             │
│ Redis (cache,      │ │   adapters)         │ │  Airtel Money API         │
│  sessions, queues) │ │ ├─ REG Vending/STS  │ │  Card PSP (3-DS, PCI)     │
│ Blob storage       │ │ ├─ REG CIS/Billing  │ │  SMS gateway              │
│  (receipts, docs)  │ │ ├─ REG MDM/HES*     │ │  FCM / APNs               │
│ TimescaleDB        │ │ └─ REG Outage sys   │ │  Google Maps              │
│  (telemetry*)      │ │  *where AMI exists  │ │                           │
└────────────────────┘ └─────────────────────┘ └───────────────────────────┘
```

**Key principle:** the app never talks to meters. All meter data flows through REG's official backend systems via the integration layer. STS keypad meters receive credit only via the 20-digit token typed by the customer.

## 2. Backend Architecture (NestJS)

- **Style:** modular monolith at MVP → split into microservices at scale. Each domain = NestJS module with controller/service/repository layers.
- **Communication:** REST (external), Redis pub/sub + BullMQ queues (internal async: token vending, notifications, receipt generation), WebSocket gateway for live dashboard pushes.
- **Vending flow (critical path):**
  1. `POST /purchases` → validate → create `PENDING` purchase (idempotency key).
  2. Payment service initiates MoMo push / card 3-DS → webhook or poll confirms.
  3. On `PAID`, vending adapter calls REG vending API → STS token returned.
  4. Purchase → `COMPLETED`; token persisted (encrypted), pushed via FCM + SMS fallback; receipt PDF generated to blob storage.
  5. Any failure → compensating refund flow + support ticket auto-draft.
- **Prediction service:** Python FastAPI sidecar; nightly batch computes per-meter EWMA daily-usage + depletion forecasts into PostgreSQL; on-demand re-score after each purchase.
- **Resilience:** circuit breakers on REG/PSP adapters, retry with exponential backoff + jitter, idempotency keys on all mutating endpoints, outbox pattern for events.

## 3. Data Architecture

- **PostgreSQL:** system of record (users, meters, purchases, tokens, tickets, notifications). Partition `purchases` and `consumption_daily` by month.
- **Redis:** OTP codes (TTL 5 min), sessions/refresh-token denylist, hot dashboard cache (TTL 60 s), rate-limit counters, queues.
- **TimescaleDB extension:** telemetry hypertables for AMI meters (Tier B) — `meter_readings(meter_id, ts, kw, v, a, pf, balance_kwh)`.
- **Blob storage:** receipts (PDF), attachments, app assets.

## 4. Security Architecture

### Identity & Access
- OAuth 2.0 + OIDC (Authorization Code + PKCE for app). Access JWT 15 min (RS256, JWKS rotation), refresh 30 days, rotating + reuse detection.
- OTP via SMS/email for registration and step-up; 2FA on sensitive actions (auto top-up enable, member management, payment method add).
- Biometric = local unlock gating a device-bound key (Android Keystore / iOS Secure Enclave); never replaces server auth.
- Device binding: refresh tokens tied to device ID + attestation (Play Integrity / App Attest).

### Data protection
- TLS 1.3 everywhere; certificate pinning in app (backup pins + remote pin-rotation config).
- AES-256-GCM at rest (DB TDE + column-level encryption for tokens, national ID).
- Secrets in Azure Key Vault; no secrets in code or app binary.
- PII minimization; national ID hashed (Argon2id) for lookup, encrypted for display.

### Payments (PCI DSS)
- App/backend never touch PANs: card entry via PSP SDK/hosted fields (SAQ-A scope). MoMo/Airtel via server-to-server APIs with signed callbacks (HMAC verification, replay protection).

### App hardening
- OWASP MASVS L2: root/jailbreak detection (warn + restrict payments), obfuscation (R8/ProGuard), no sensitive data in logs/screenshots (FLAG_SECURE on token/payment screens), secure storage (flutter_secure_storage).

### Platform security
- WAF + rate limiting at gateway; per-user and per-device velocity limits on vending.
- Audit log (append-only) for all admin actions and all purchases.
- Pen-test before launch; bug bounty post-launch; RBAC in admin portal (support / analyst / outage-manager / admin / super-admin).

## 5. Admin Dashboard (web)

React + TypeScript SPA behind same gateway. Features: customer management, live meter view (Tier B), analytics & revenue dashboards, notification composer (topic/geo targeted), tariff management with approval workflow, support ticket queue, outage management (create/update outages → feeds app map), user & role management, full audit log viewer.

## 6. Cloud & Infrastructure (Azure reference)

| Concern | Service |
|---|---|
| Containers | AKS (multi-AZ) + ACR |
| Gateway | Azure API Management + Front Door (WAF/CDN) |
| DB | Azure Database for PostgreSQL Flexible (HA, PITR) |
| Cache/queue | Azure Cache for Redis |
| Storage | Azure Blob (receipts) |
| Secrets | Key Vault |
| Observability | Azure Monitor + Prometheus/Grafana, Sentry (app + backend) |
| Push | Firebase Cloud Messaging + APNs |

AWS equivalent: EKS, API Gateway + CloudFront/WAF, RDS PostgreSQL, ElastiCache, S3, Secrets Manager, CloudWatch.

## 7. Sync Strategy

- REST for all CRUD; ETag/If-None-Match for cheap polling.
- WebSocket channel per user for: balance updates, purchase status, outage alerts (fallback: FCM data messages).
- Offline-first client: Drift (SQLite) local cache, background sync with conflict rule "server wins, client queues mutations".
