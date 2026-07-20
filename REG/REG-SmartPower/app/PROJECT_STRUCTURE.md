# Flutter Project Structure — REG SmartPower

Feature-first clean architecture. Riverpod for state/DI, Dio for HTTP, Drift for offline cache.

```
app/
├── pubspec.yaml
├── l10n.yaml                        # gen-l10n config (en, rw, fr, sw)
├── lib/
│   ├── main.dart                    # entry: flavors, Firebase, ProviderScope
│   ├── app.dart                     # MaterialApp.router, themes, locale
│   ├── core/
│   │   ├── theme/
│   │   │   ├── tokens.dart          # design tokens (colors, radii, spacing)
│   │   │   └── app_theme.dart       # light + dark ThemeData (Material 3)
│   │   ├── network/
│   │   │   ├── api_client.dart      # Dio + JWT interceptor + cert pinning
│   │   │   └── ws_client.dart       # WebSocket live updates
│   │   ├── storage/
│   │   │   ├── secure_store.dart    # tokens, PIN state
│   │   │   └── local_db.dart        # Drift offline cache
│   │   ├── router/app_router.dart
│   │   └── utils/ (formatters, validators, result type)
│   ├── features/
│   │   ├── auth/        (data/ domain/ presentation/)  # OTP, PIN, biometric
│   │   ├── meters/                                     # list, add via QR, info, sharing
│   │   ├── dashboard/                                  # balance hero, usage, tips
│   │   ├── consumption/                                # charts, analytics, prediction
│   │   ├── purchase/                                   # buy flow, methods, tokens, history
│   │   ├── simulator/                                  # appliance estimator
│   │   ├── alerts/                                     # thresholds, notification center
│   │   ├── outages/                                    # map
│   │   ├── support/                                    # tickets, chat, service requests
│   │   └── settings/                                   # theme, language, accessibility
│   └── l10n/ (app_en.arb, app_rw.arb, app_fr.arb, app_sw.arb)
├── test/            # unit + widget + golden tests
├── integration_test/
├── android/         # flavors: dev, staging, prod; Play Integrity
└── ios/             # schemes; App Attest; Face ID entitlement
```

Each feature folder follows:
- `data/` — DTOs, repository implementations (API + local cache)
- `domain/` — entities, repository interfaces, use cases
- `presentation/` — screens, widgets, Riverpod providers/notifiers

Included sample source files:
- `lib/main.dart`, `lib/app.dart`
- `lib/core/theme/app_theme.dart` (full light/dark themes)
- `lib/core/network/api_client.dart`
- `lib/features/dashboard/presentation/dashboard_screen.dart`
- `lib/features/purchase/presentation/buy_screen.dart`
- `lib/features/purchase/domain/purchase.dart`
