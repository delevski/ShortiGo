# AdMob setup (ShortiGo)

ShortiGo uses **Google AdMob** via `google_mobile_ads` for **rewarded ads** only (Rewards tab → “Watch an ad” → +12 bonus).

## 1. Create AdMob resources

1. Open [AdMob](https://admob.google.com/) and create/link your app.
2. Register:
   - **Android** — package `com.shortigo.shortigo`
   - **iOS** — same bundle ID as in Xcode / Firebase
3. Create one **Rewarded** ad unit per platform.

You need four IDs:

| Define | Example shape |
|--------|----------------|
| `ADMOB_APP_ID_ANDROID` | `ca-app-pub-XXXX~YYYY` |
| `ADMOB_REWARDED_ANDROID` | `ca-app-pub-XXXX/ZZZZ` |
| `ADMOB_APP_ID_IOS` | `ca-app-pub-XXXX~YYYY` |
| `ADMOB_REWARDED_IOS` | `ca-app-pub-XXXX/ZZZZ` |

## 2. Pass IDs into Flutter

Copy `dart_defines.example.json`, replace test IDs with production values, then:

```bash
flutter run --dart-define-from-file=dart_defines.prod.json
```

Or pass defines individually:

```bash
flutter run --dart-define=ENV=prod \
  --dart-define=ADMOB_APP_ID_ANDROID=ca-app-pub-... \
  --dart-define=ADMOB_REWARDED_ANDROID=ca-app-pub-.../... \
  --dart-define=ADMOB_APP_ID_IOS=ca-app-pub-...~... \
  --dart-define=ADMOB_REWARDED_IOS=ca-app-pub-.../...
```

Release builds use the same defines:

```bash
flutter build appbundle --release --dart-define-from-file=dart_defines.prod.json
flutter build ios --release --dart-define-from-file=dart_defines.prod.json
```

With `ENV=prod`, the app logs **release blockers** at startup if AdMob IDs are still Google’s test IDs (`lib/core/env/env.dart`).

## 3. Native wiring (automatic)

| Platform | How the app ID is applied |
|----------|---------------------------|
| **Android** | `android/app/build.gradle.kts` reads `ADMOB_APP_ID_ANDROID` from `--dart-define` and sets `AndroidManifest` `APPLICATION_ID`. |
| **iOS** | `ios/Podfile` syncs `ADMOB_APP_ID_IOS` into `ios/Flutter/AdMob.xcconfig` → `Info.plist` `GADApplicationIdentifier`. Run `pod install` in `ios/` after changing defines (or let `flutter build ios` do it). |

Rewarded **unit** IDs are read only in Dart (`lib/data/ads/admob_ad_gateway.dart`).

## 4. Verify

1. Sign in → **Rewards** → **Watch**.
2. A rewarded ad should show (test ads until production IDs are set).
3. After completion, **Profile** should show **+12 bonus**.

## 5. Production note (Spark MVP)

Rewards are credited with **client-side** `grantDemoBonus` in Firestore. For tamper-resistant ad rewards, enable Firebase Blaze and deploy `grantAdReward` in `cloud_functions/`.
