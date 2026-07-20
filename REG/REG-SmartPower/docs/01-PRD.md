# REG SmartPower — Product Requirements Document (PRD)

**Version:** 1.0 · **Date:** July 2026 · **Status:** Draft for REG review
**Product:** REG SmartPower — companion mobile app for Rwanda Energy Group Cash Power customers

---

## 1. Executive Summary

REG SmartPower is a mobile application (Android + iOS) that gives REG Cash Power prepaid customers real-time visibility into their electricity balance, consumption analytics, and in-app token purchasing — **without replacing or modifying any existing prepaid meter**. The app is a pure software companion that integrates with REG's existing backend systems (vending, CIS, MDM where available) through official APIs.

## 2. Problem Statement

Prepaid customers today discover a depleted balance only when power cuts off. Buying tokens requires USSD flows, agents, or third-party apps. Customers have no consumption insight, no alerts, and no self-service channel for outage reports or service requests.

## 3. Goals & Success Metrics

| Goal | Metric | Target (12 months) |
|---|---|---|
| Reduce unexpected power cutoffs | % users receiving low-balance alert before depletion | > 90% |
| Digital token sales | % purchases via app vs USSD/agent | 30% |
| Self-service adoption | Support tickets deflected to app | 25% reduction |
| Reliability | Crash-free sessions | > 99.5% |
| Adoption | MAU | 500,000 |

## 4. Users & Personas

- **Urban household customer** (Kigali, smartphone, MoMo user) — wants balance, quick buy, alerts.
- **Landlord / multi-property owner** — manages several meters (home, rentals, business).
- **Family member** — granted view-only or purchase access by the account owner.
- **SME owner** — monitors business consumption cost, downloads receipts for accounting.
- **REG staff (admin portal)** — support agents, analysts, outage managers, administrators.

## 5. Critical Constraint — Existing Meters

Existing STS-compliant prepaid meters **must not be replaced or modified**. Most deployed meters are offline STS keypad meters: they do not transmit live telemetry.

Therefore every feature is classified into three feasibility tiers:

| Tier | Data source | Features |
|---|---|---|
| **A — Feasible now** | REG vending/CIS APIs + purchase history | Login, meter info, buy electricity, payment history, token delivery, purchase-history-based balance *estimation*, low-balance *estimated* alerts, consumption simulator, notifications, support, service requests, outage map (from REG outage system), multi-meter, family sharing, offline cache, QR features |
| **B — Feasible where smart/AMI meters exist** | MDM/HES telemetry APIs | Live load (W, V, A), real-time balance, meter online/offline/tamper status, live graphs |
| **C — Future (requires new REG APIs)** | Future middleware | Appliance-level disaggregation, grid-signal-driven predictions, smart home, solar/EV integration |

The UI must clearly label estimated values ("Estimated from your purchase history") versus metered values, and degrade gracefully per meter type.

## 6. Core Features (functional requirements)

### F1. Secure Login
Identifiers: phone number, national ID, or email. OTP (SMS/email) verification; PIN; biometric unlock (fingerprint / Face ID). Session via OAuth2 + JWT refresh tokens.

### F2. Dashboard
Balance card: remaining kWh, remaining RWF equivalent, estimated days left. Usage: today / week / month. Where telemetry exists (Tier B): live power draw, voltage, current, power factor, meter status (online, offline, disconnected, tamper), last sync time. Tier A meters show estimated values with an "estimated" badge.

### F3. Live Consumption Tracking
Interactive charts (hourly, daily, weekly, monthly, yearly). Tier B: real load curve. Tier A: purchase-derived consumption curve. Appliance estimation from total consumption using typical Rwandan household load profiles (lights 150W, TV 80W, fridge 200W, iron 1000W, etc.).

### F4. Remaining Electricity Prediction
Model: exponentially weighted moving average of daily kWh consumption + seasonality (weekday/weekend), upgraded to a gradient-boosted model server-side. Shows estimated hours/days remaining, trend, predicted depletion date, confidence.

### F5. Low Balance Alerts
Push notifications at configurable thresholds (default 20, 10, 5, 2 kWh) plus critical warning ("may run out within 6 hours"). User-customizable thresholds and quiet hours.

### F6. Buy Electricity In-App
Payment methods: MTN MoMo, Airtel Money, Visa, Mastercard, bank transfer, QR. Flow: select meter → amount (RWF or kWh) → pay → receive 20-digit STS token → token stored + shown + sharable. Saved methods, quick purchase, favorite amounts, purchase history, PDF receipt.

### F7. Auto Top-Up (optional)
Rule: when estimated balance ≤ X kWh, buy Y RWF automatically. Requires PIN/biometric to enable, monthly cap, per-transaction confirmation notification.

### F8. Meter Information
Meter number, customer name, district/sector/cell, installation date, meter type, tariff & current rate, connection status.

### F9. Usage Analytics
Daily/weekly/monthly/yearly usage, peak vs off-peak hours, highest/lowest consumption day, average monthly cost, energy efficiency score (0–100 vs similar households).

### F10. Energy Saving Assistant
Rule + ML driven tips: evening-peak warnings, above-average appliance estimates, standby-loss savings estimates.

### F11. Consumption Simulator
User adds appliances (TV, fridge, computer, iron, microwave, water heater, AC, lights) with wattage & hours → daily/monthly kWh and monthly RWF cost at the user's tariff.

### F12. Payment History
Date, amount, kWh, method, transaction ID, token, PDF receipt download.

### F13. Notifications Center
Outages, maintenance, tariff changes, payment confirmations, balance alerts, tips, government announcements. Per-category opt-out.

### F14. Customer Support
Live chat, AI assistant (FAQ-grounded), call REG (2727), WhatsApp deep link, email, FAQs, report problem/outage/damaged meter, request callback.

### F15. Service Requests
Meter inspection, replacement, new connection, disconnection, reconnection, complaints — with status tracking (submitted → in review → scheduled → resolved).

### F16. Power Outage Map
Interactive Rwanda map (Google Maps): current outages, scheduled maintenance, affected areas, estimated restoration time.

### F17. Multi-Meter Support
Add unlimited meters (Home, Business, Rental, Farm…), each with its own dashboard; aggregate view.

### F18. Family Sharing
Invite by phone number. Roles: **Viewer** (read), **Purchaser** (read + buy), **Admin** (all + manage members).

### F19. Offline Mode
Cached: last balance/estimates, purchase history, meter info, graphs, settings. Clear "last synced" indicator; queued actions replay on reconnect.

### F20. QR Features
Scan meter QR → add meter instantly; share meter via QR; pay via QR.

## 7. Non-Functional Requirements

- **Performance:** cold start < 2.5 s; dashboard render < 1 s from cache; API p95 < 400 ms.
- **Scale:** 2M registered users, 200k concurrent during evening peak; vending burst 500 TPS.
- **Availability:** 99.9% app backend; vending path degradable to USSD fallback messaging.
- **Security:** OAuth2/OIDC, JWT (15 min access / 30 d rotating refresh), AES-256 at rest, TLS 1.3 + certificate pinning, biometric auth, 2FA, PCI DSS scope minimized via tokenized PSP, OWASP MASVS L2.
- **Accessibility:** WCAG 2.2 AA; TalkBack/VoiceOver; large text; high contrast; color-blind-safe palette.
- **Languages:** English, Kinyarwanda, French, Swahili (extensible via ARB files).
- **Compliance:** Rwanda Law No. 058/2021 (data protection); NCSA guidelines; RURA consumer rules.

## 8. User Flows (key)

**Onboarding:** Splash → Language → Phone/ID/Email → OTP → PIN setup → Biometric opt-in → Add meter (QR or manual + name) → Dashboard.

**Buy electricity:** Dashboard → Buy → amount (chips: 5k/10k/20k RWF or custom, kWh preview) → payment method → MoMo push / card 3-DS → poll status → token screen (copy, share, auto-SMS) → receipt.

**Low balance → top-up:** Push "Balance low: ~4.8 kWh (≈2 days)" → tap → prefilled quick-buy → PIN/biometric → done in <30 s.

**Report outage:** Support → Report outage → auto-location + meter → photo optional → ticket ID → track status; outage appears on map when confirmed.

**Family sharing:** Meter → Members → Invite (phone) → role → invitee accepts in-app → appears with role badge.

## 9. Release Plan

- **MVP (M1–M3):** F1, F2 (Tier A), F6, F12, F13, F5 (estimated), F8, multi-meter basics.
- **V1.1 (M4–M5):** F3/F4/F9 analytics, F11 simulator, F14/F15 support & service requests, F16 outage map.
- **V1.2 (M6):** F7 auto top-up, F18 family sharing, F20 QR, widgets.
- **V2:** Tier B live telemetry where AMI exists; future features (solar, EV, Wear OS/Apple Watch).

## 10. Risks

| Risk | Mitigation |
|---|---|
| REG APIs incomplete/unstable | Middleware adapter layer + mock-first contract testing |
| MoMo/PSP downtime | Multi-PSP failover, clear pending states, idempotent vending |
| Estimation perceived as inaccurate | Explicit "estimated" labeling, calibration from purchase cadence |
| Low-end devices | Flutter with low-RAM profile, <40 MB APK, offline-first |
| Fraud (token resale, account takeover) | Device binding, velocity limits, 2FA on sensitive ops |
