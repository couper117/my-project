# REG SmartPower — Deployment Plan, CI/CD & Store Release Checklists

**Version:** 1.0

---

## 1. Environments
| Env | Purpose | Infra |
|---|---|---|
| dev | Feature work, mock REG APIs | AKS namespace, seeded DB |
| staging | Integration with REG sandbox APIs + PSP sandboxes | Prod-mirrored |
| prod | Live | Multi-AZ AKS, HA PostgreSQL, geo-redundant blob |

## 2. CI/CD Pipeline (GitHub Actions / Azure DevOps)

```
push → PR:
  lint (dart analyze / eslint) → unit tests → build → integration tests (testcontainers)
merge to main:
  backend: docker build → scan (Trivy) → push ACR → deploy staging (Helm) → smoke tests
  app: flutter build appbundle/ipa → Firebase App Distribution (internal testers)
release tag (v*):
  backend: blue/green deploy prod (approval gate) → post-deploy checks → auto-rollback on SLO breach
  app: Play Internal → Closed → Open → Production staged rollout (5%→20%→50%→100%)
       TestFlight → App Store phased release
db migrations: sqitch/typeorm migrations, backward-compatible, run pre-deploy
secrets: OIDC federation to Key Vault; no secrets in CI logs
```

Quality gates: coverage ≥ 80% domain logic, zero critical vulnerabilities, bundle size budget (APK ≤ 40 MB), lighthouse-ci for admin portal.

## 3. Backend Deployment
Helm charts per service; HPA on CPU + queue depth; PodDisruptionBudgets; readiness probes hitting dependency checks; config via ConfigMaps + Key Vault CSI. Observability: OpenTelemetry traces, Prometheus metrics, Grafana dashboards (vending success rate, PSP latency, OTP delivery rate), alerting to REG NOC (PagerDuty/Teams).

## 4. Google Play Release Checklist
- [ ] Play Console account (REG organization), app signing by Google enrolled
- [ ] Package `rw.reg.smartpower`, versionCode/semver automation
- [ ] Data safety form (payments, phone, location for outage map) accurate
- [ ] Target API level current (Android 15 / API 35+), 64-bit only
- [ ] Play Integrity API enabled; ProGuard/R8 mapping uploaded
- [ ] Store listing: title, short/full description in EN + RW + FR + SW
- [ ] Screenshots (phone + 7" + 10"), feature graphic, icon 512px
- [ ] Content rating questionnaire (Everyone), Finance app declarations
- [ ] Privacy policy URL (reg.rw/smartpower/privacy)
- [ ] Pre-launch report clean on 10+ devices, staged rollout plan 5→100%
- [ ] Crash/ANR monitoring wired (Crashlytics + Play vitals SLOs)

## 5. Apple App Store Release Checklist
- [ ] Apple Developer org account (D-U-N-S for REG), bundle `rw.reg.smartpower`
- [ ] App Store Connect: name "REG SmartPower", subtitle, keywords, 4-language localization
- [ ] Screenshots 6.9" + 6.5" + 5.5", app icon 1024px
- [ ] Sign in with… not required (no third-party social login used)
- [ ] Face ID usage string, location usage string (outage map), camera (QR) in Info.plist
- [ ] In-app purchases NOT used for electricity (physical service — exempt from IAP per 3.1.5(a)); document for review notes
- [ ] App Privacy nutrition labels accurate
- [ ] Demo account + demo meter for App Review; review notes explain OTP flow
- [ ] TestFlight external beta passed; phased release enabled
- [ ] Push certs/keys (APNs key) configured; background modes minimal

## 6. Installation & Deployment Guide (backend, summary)
```bash
# prerequisites: az cli, kubectl, helm, docker
git clone https://github.com/reg-rw/smartpower-backend
cd smartpower-backend
cp .env.example .env            # fill Key Vault refs, PSP sandbox keys
docker compose up -d postgres redis   # local dev
npm ci && npm run migration:run && npm run seed
npm run start:dev               # API on :3000, Swagger at /docs
# staging/prod
az aks get-credentials -n reg-smartpower-aks -g reg-smartpower-rg
helm upgrade --install smartpower ./deploy/helm -f deploy/values.staging.yaml
```
Flutter app:
```bash
git clone https://github.com/reg-rw/smartpower-app
cd smartpower-app
flutter pub get
flutter gen-l10n && dart run build_runner build -d
flutter run --dart-define=ENV=dev      # dev flavor hits mock API
flutter build appbundle --flavor prod --dart-define=ENV=prod
```

## 7. Launch Plan
Pilot: 5,000 users in Kigali (Gasabo) with USSD fallback comms → 4-week bake, vending success ≥ 99% gate → national rollout with radio/SMS campaign in Kinyarwanda → post-launch war room for 2 weeks.

## 8. Rollback & DR
Blue/green with instant traffic switch; DB PITR (5-min RPO); region pair failover runbook (RTO 4 h); vending outage playbook: queue purchases, notify users, auto-refund after 30 min timeout.
