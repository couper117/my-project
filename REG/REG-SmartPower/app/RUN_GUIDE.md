# How to Run REG SmartPower (demo build)

The app in this folder is complete and runnable with **mock data** — no backend, accounts, or API keys needed. Payments/OTP are simulated; buying tokens actually updates the balance and history in the app.

## 1. Install Flutter (once)

Windows: download from https://docs.flutter.dev/get-started/install/windows, extract, add `flutter\bin` to PATH.
Then verify:
```
flutter doctor
```
Install Android Studio (for the Android SDK + emulator) if `flutter doctor` asks for it.

## 2. Generate platform folders (once)

From this `app` folder:
```
cd REG-SmartPower\app
flutter create . --org rw.reg --project-name reg_smartpower
```
This adds the `android/`, `ios/`, `windows/`, `web/` scaffolding around the existing `lib/` code (it will not overwrite lib/ or pubspec.yaml — if asked, keep existing files).

## 3. Run

```
flutter pub get
flutter run
```
Pick a device when prompted:
- **Android emulator / USB phone** — full experience
- **Chrome** (`flutter run -d chrome`) — quickest way to see it, no emulator needed
- **Windows desktop** (`flutter run -d windows`) — needs Visual Studio C++ workload

## 4. Demo walkthrough

1. Splash → phone number → OTP: enter any 6 digits (e.g. `123456`).
2. Dashboard: Home meter shows an **Estimated** balance (STS keypad meter). Switch to the Business meter (top dropdown) to see the **Live** AMI variant with real-time W/V/A.
3. Buy tab: pick 10,000 RWF → Pay → simulated MoMo wait → 20-digit token appears, balance goes up, history and notifications update.
4. Usage tab: charts, efficiency score, appliance estimates.
5. More tab: switch Light/Dark theme and language (English / Kinyarwanda / Français / Kiswahili), add meters, simulator, outages.

## Troubleshooting

- `flutter: command not found` → PATH not set; reopen the terminal.
- Version solving errors → run `flutter upgrade` (needs Flutter 3.22+ / Dart 3.4+).
- No devices found → start an emulator in Android Studio, or use `-d chrome`.

## What's mocked vs real

| Mocked in demo | Production wiring (already designed) |
|---|---|
| OTP, login | REG auth + SMS gateway (backend/auth) |
| Payment + token | MoMo/PSP + REG vending API (backend/purchases) |
| Balance & usage data | /meters API + estimates service (api/openapi.yaml) |
| Outage list | Google Maps + /outages GeoJSON |

Production integration code lives in `backend/` and `reference/api_client_production_reference.dart.txt`.
