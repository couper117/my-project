# REG SmartPower — UI/UX Design & Design System

**Version:** 1.0 · Live mockups: `design/mockups.html` (light + dark, key screens)

---

## 1. Design Principles
Official-yet-modern government utility feel: trustworthy, clean, premium. Benchmarks: Monzo/Revolut (finance clarity), Tesla (live energy), Google/Apple (platform fidelity). Material Design 3 on Android, respecting Apple HIG on iOS (Cupertino adaptive widgets for pickers, dialogs, navigation transitions).

## 2. Brand & Color

| Token | Light | Dark | Usage |
|---|---|---|---|
| primary | #0B7A3B (REG green) | #4CC38A | Buttons, active states, brand |
| primary-container | #DCF5E7 | #0F3D26 | Cards, chips |
| secondary | #F5B301 (energy amber) | #FFC94D | Highlights, kWh accents |
| tertiary | #1565C0 | #7FB5F0 | Links, info |
| error | #BA1A1A | #FFB4AB | Errors, critical alerts |
| warning | #B45309 | #FBBF24 | Low balance |
| surface | #FAFDF9 | #101511 | Background |
| surface-container | #FFFFFF | #1A211C | Cards |
| on-surface | #171D19 | #E1E6E0 | Text |
| outline | #C3CCC3 | #3D453E | Dividers, borders |

Semantic energy colors: balance-healthy green, balance-low amber, balance-critical red — all pass 4.5:1 contrast; color-blind safe (never color-only meaning: icons + labels always accompany).

## 3. Typography
Family: **Inter** (Latin + Kinyarwanda diacritics) / platform fallback SF Pro, Roboto.

| Style | Size/Weight | Use |
|---|---|---|
| Display | 40/700 | Balance kWh hero |
| Headline | 28/600 | Screen titles |
| Title | 20/600 | Card titles |
| Body | 16/400 | Content |
| Label | 13/500 | Chips, captions, badges |
Supports Dynamic Type / font scaling to 200%.

## 4. Shape, Spacing, Motion
Corner radius: cards 20, buttons 14, sheets 28 top. Spacing grid 4 pt (screen padding 20). Elevation: soft shadows level 1–3 only. Motion: 200–300 ms emphasized-decelerate; hero balance count-up animation; chart draw-in; reduced-motion honored.

## 5. Iconography
Material Symbols Rounded, 24 pt, weight 500 — outline style, filled for active nav. Custom icons: meter, token, lightning-bolt-in-shield.

## 6. Component Library
Buttons (filled, tonal, outline, text; 52 pt height), balance hero card, usage chart card (fl_chart), amount chips (5k/10k/20k/custom), payment method row, token display (grouped 4-4-4-4-4 digits, copy + share), status pills (Estimated / Live / Offline / Tamper), meter switcher (top app bar dropdown), alert threshold slider, OTP input (6 boxes), bottom nav (Home, Usage, Buy [FAB], Alerts, More).

## 7. Screen Inventory (34 screens)

**Onboarding (6):** Splash · Language select · Auth (phone/ID/email tabs) · OTP · PIN setup · Biometric opt-in.
**Meter setup (3):** Add meter (QR scan) · Manual entry · Confirm + label.
**Home (4):** Dashboard (balance hero, days-left, quick actions, usage sparkline, tips) · Meter detail/info · Meter switcher · Multi-meter overview.
**Usage & insights (5):** Analytics (period tabs H/D/W/M/Y, interactive charts) · Appliance estimate breakdown · Prediction detail · Efficiency score · Simulator (appliance list + result).
**Buy (6):** Amount select · Payment method · MoMo push wait state · Card checkout (PSP) · Success + token · Receipt viewer.
**History (2):** Purchase history · Purchase detail.
**Alerts & notifications (3):** Notification center (categorized) · Alert preferences · Outage map (full-screen).
**Support (3):** Support hub · Live chat/AI assistant · New ticket / service request + tracker.
**Settings & sharing (2):** Settings (theme, language, security, accessibility) · Family sharing member management.

## 8. Key Screen Specs

### Dashboard
Top: meter switcher + notification bell (badge). Balance hero card: kWh huge display type, RWF + "≈ 5 days left" subtitle, source pill ("Estimated" amber / "Live" green), progress ring depleting. Quick actions row: Buy, Token history, Report, Simulate. Usage card: 7-day bar sparkline + today total. Tip card (dismissible). Tier B extra card: live W/V/A gauges.

### Buy Electricity
Amount chips + custom keypad, live kWh conversion at user tariff, payment method selector (saved methods first), single CTA. Pending state: animated MoMo push illustration + "Approve on your phone" + 120 s countdown + "It failed?" fallback. Success: confetti-lite, token in monospaced grouped digits, Copy / SMS / Share buttons, receipt link.

### Outage Map
Google Map with Rwanda bounds, red polygons (active), amber (scheduled maintenance), tap → bottom sheet: affected sectors, start time, est. restoration, "Affects my meter" banner if user meter inside polygon.

## 9. Themes
Light, Dark, System — automatic switching; all tokens defined per-mode (see §2). Both themes shipped in `app/lib/core/theme/`.

## 10. Localization
en, rw, fr, sw via Flutter ARB; locale-aware number/currency (RWF grouping), date formats; Kinyarwanda reviewed by native speaker; strings never concatenated (plural/gender-safe ICU).

## 11. Accessibility (WCAG 2.2 AA)
Contrast ≥ 4.5:1; touch targets ≥ 48 dp; full TalkBack/VoiceOver labels incl. chart summaries ("Usage this week: 32 kWh, highest Tuesday"); large-text mode reflows (no truncation); high-contrast mode variant; haptics for purchase success/failure; focus order and semantics annotations in code.

## 12. Wireframe → Hi-Fi Process
Lo-fi wireframes (grayscale, layout only) → clickable prototype → hi-fi mockups (see `design/mockups.html`) → design tokens exported to `app/lib/core/theme/tokens.dart` (single source of truth).
