# REG SmartPower — Testing Strategy

**Version:** 1.0

---

## 1. Test Pyramid

| Layer | Tooling | Coverage target |
|---|---|---|
| Unit (Flutter) | flutter_test, mocktail | 85% of blocs/services/utils |
| Unit (NestJS) | jest | 85% of services/guards |
| Widget tests | flutter_test golden tests (light+dark, en+rw) | All shared components + key screens |
| Integration (backend) | jest + testcontainers (PostgreSQL, Redis), mocked REG/PSP adapters | All API endpoints, vending state machine |
| Contract tests | Pact between app ↔ backend, backend ↔ REG adapters | All consumer contracts |
| E2E (app) | Patrol/integration_test on Firebase Test Lab (20 device matrix incl. low-RAM Android Go) | 12 critical journeys |
| Load | k6 — vending 500 TPS burst, dashboard 5k RPS | p95 < 400 ms, error < 0.1% |
| Security | OWASP ZAP, MobSF, dependency scanning, annual pen-test | Zero high findings at release |
| Accessibility | axe DevTools (admin), Accessibility Scanner + manual TalkBack/VoiceOver scripts | WCAG 2.2 AA |

## 2. Critical E2E Journeys
1. Register (phone → OTP → PIN → biometric) and add meter via QR.
2. Buy 10,000 RWF via MoMo (sandbox) → token received → receipt PDF opens.
3. Payment declined → clear error → retry with card → success.
4. Payment succeeds but vending fails → auto-refund + notification.
5. Duplicate tap on Buy → single purchase (idempotency).
6. Low-balance push received at configured threshold; deep-links to quick buy.
7. Offline: airplane mode → dashboard shows cached data + "last synced"; purchase queued action blocked with clear message.
8. Family sharing: invite viewer → viewer sees dashboard, cannot buy; purchaser can buy.
9. Auto top-up triggers at threshold with monthly cap enforced.
10. Outage polygon covering user's meter → banner + notification.
11. Language switch to Kinyarwanda → full UI translated, currency/date formats correct.
12. Token screen blocks screenshots; root-detected device restricts payments.

## 3. Vending State Machine Tests (highest risk)
Property-based tests over transitions pending→paid→vending→completed with injected failures at each edge: PSP webhook replay, double webhook, webhook before poll, vending timeout, partial refund. Invariant: **money captured ⇔ exactly one valid token delivered, or refund issued**.

## 4. Prediction Accuracy Validation
Backtest EWMA model on synthetic + pilot purchase histories; MAPE target < 20% for 3-day depletion forecasts; UI copy adjusts confidence wording ("about 5 days" vs "4–6 days") based on model confidence.

## 5. Non-Functional
- Chaos drills quarterly (kill vending adapter pod, Redis failover).
- Battery/network profiling: dashboard poll ≤ 1 req/min foreground, push-driven otherwise; app works on 2G/EDGE (payload budgets < 30 KB per dashboard load).
- Upgrade tests: migrate from each released version, local DB schema migrations verified.

## 6. UAT & Pilot
Structured UAT with REG customer-service staff (2 weeks, scripted scenarios in Kinyarwanda); pilot cohort feedback in-app survey; exit criteria: vending success ≥ 99%, crash-free ≥ 99.5%, CSAT ≥ 4.2/5.
