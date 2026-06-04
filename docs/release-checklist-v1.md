# ShortiGo v1 Release Verification

Date: 2026-06-04
Branch: main
Version: 0.1.0+2

## Automated Checks

- Flutter analyze: passed on 2026-06-04 with no issues.
- Flutter unit/widget tests: all 39 passed on 2026-06-04.
- Admin Studio build: passed on 2026-06-04 with Vite's Firebase bundle-size warning.
- Firestore security rules tests: all 6 passed in the emulator on 2026-06-04.
- Cloud Functions TypeScript build: passed on 2026-06-04.
- Integration cold-start test: passed on Android emulator on 2026-06-01.
- Galaxy SM-S942B wireless ADB was repaired on 2026-06-04 using the stable
  `192.168.1.203:5555` endpoint. ShortiGo installed successfully and the
  physical-device cold-start integration test passed.
- iOS 17.2 runtime/platform registration was repaired on 2026-06-04. Xcode now
  lists the generic physical iOS destination and all iOS 17.2 simulator
  destinations. A fresh production no-codesign release build is compiling.
- Android release AAB: passed on 2026-06-04. `flutter build appbundle --release --dart-define=ENV=prod` produced `build/app/outputs/bundle/release/app-release.aab` (62.0MB).
- Android release AAB with `dart_defines.prod.json`: passed on 2026-06-04 and
  produced `build/app/outputs/bundle/release/app-release.aab` (62.0MB).
- Android release signing: local upload keystore and ignored `android/key.properties` are configured. Signed AAB build passed on 2026-06-02.
- Local iOS build environment uses Homebrew `ruby@3.1`, CocoaPods 1.16.2, Firebase Apple SDK 11.11.0, and Google Mobile Ads SDK 11.2.0 for Xcode 15.2 compatibility.

## Cloud Setup

- Firebase project `shortigo-prod` was created on 2026-06-02.
- Firebase project `shortigo-dev` was deleted/scheduled for deletion on 2026-06-02.
- Root Firebase config is committed at `.firebaserc` and `firebase.json`.
- Firestore rules file is committed at `firestore.rules`.
- Firestore indexes file is committed at `firestore.indexes.json`.
- Firestore rules and indexes are deployed to `shortigo-prod`.
- Firestore rules and all ten indexes were deployed to `shortigo-prod` on 2026-06-04.
- Firestore rules support super-admin and provider-scoped Studio access.
- Mobile users cannot self-grant VIP or coins. Spark-mode bonus changes are limited
  to a maximum +12 per update while My List remains writable.
- Mobile users can delete their profile, My List, and viewing activity in-app.
  Immutable transaction history remains protected from client deletion.
- Updated account-deletion Firestore rules were deployed to `shortigo-prod` on
  2026-06-04.
- Android Firebase app is registered for `com.shortigo.shortigo`.
- iOS Firebase app is registered for `com.shortigo.shortigo`.
- Android debug SHA-1/SHA-256 fingerprints are registered for Google Sign-In.
- Platform config files are written at `android/app/google-services.json` and `ios/Runner/GoogleService-Info.plist`.
- Storage CORS file remains in the repo for future paid media hosting, but Storage is not part of the Spark-only setup.
- Cloud Functions remain in the repo for a future paid backend, but the Flutter app no longer calls them in Spark mode.
- Demo episode videos use direct HTTPS URLs, so Spark mode does not require Firebase Storage media hosting.
- Admin Studio uploads videos to Cloudinary and publishes direct HTTPS episode URLs, so
  new uploads can stay on the Spark/free Firebase setup.
- Identity Toolkit/Auth API is enabled for `shortigo-prod`; Email/Password and Google providers are configured.
- Demo seed data was written to `shortigo-prod` on 2026-06-02.
- Firebase Hosting is configured and deployed on the Spark plan.
- Public privacy policy: `https://shortigo-prod.web.app/privacy`.
- Public account-deletion instructions:
  `https://shortigo-prod.web.app/account-deletion`.
- Sentry organization `ShortiGo` and Flutter project are configured in the EU
  data region. The DSN is configured in the ignored production defines file.
- RevenueCat project `ShortiGo` is configured on the free plan with the `vip`
  entitlement, a default offering, and monthly, yearly, and lifetime Test Store
  products. Sandbox API keys are configured in the ignored production defines
  file.

## Manual Device Matrix

- [ ] Cold start to first `/discover` frame under 1.5 seconds on mid-range Android.
- [ ] Swipe 50 shorts in a row without jank on iPhone 12.
- [ ] Sign in with Google on iOS.
- [ ] Sign in with Google on Android.
- [ ] Sign in with email/password on iOS.
- [ ] Sign in with email/password on Android.
- [ ] Watch a rewarded ad and verify +12 bonus in `/profile`.
- [ ] Daily check-in once, wait 20 hours, check in again.
- [ ] Subscribe to VIP and verify `isVip: true` in `/profile` within 30 seconds.
- [ ] Restore a previous VIP purchase and verify VIP access is refreshed.
- [ ] Delete a test account and verify profile, My List, viewing activity, and
  Firebase Auth account are removed while transaction history is retained.
- [ ] Tap a locked VIP episode and verify the subscribe CTA appears.
- [ ] Airplane mode: each error view shows "No connection".
- [ ] Background for 1 hour, return, and verify content loads.
- [ ] Sentry crash-free rate above 99.5%.

## Required Before Store Submission

- Create or switch `.firebaserc` to the single Firebase project ID. Completed for `shortigo-prod`.
- Keep Firebase on the Spark plan; do not enable billing.
- Delete the unused `shortigo-dev` Firebase project. Completed on 2026-06-02.
- Configure Firebase Auth providers in the console. Completed for Email/Password and Google on 2026-06-02.
- AdMob production app and rewarded-ad IDs are configured locally in the
  ignored `dart_defines.prod.json`.
- Provision RevenueCat and Sentry. Completed for Sentry and the RevenueCat Test
  Store sandbox; Firebase Performance is already enabled.
- Publish a public privacy policy and account-deletion request page. Completed
  on Firebase Hosting; add their URLs to Play Console and App Store Connect.
- Play Console URL entry is blocked because the developer profile was removed
  on 2026-06-04 after identity and contact-phone verification failures. Appeals
  are pending and console changes cannot be published until Google restores the
  profile.
- App Store Connect URL entry requires signing in to App Store Connect and
  creating or opening the ShortiGo app record.
- Review the disclosed transaction-history retention language with qualified
  legal/privacy counsel before store submission.
- Configure RevenueCat products, entitlement `vip`, and App Store/Play Store
  product mappings; verify purchase and restore flows in both store sandboxes.
  The `vip` entitlement, default offering, and three Test Store products are
  complete. Real App Store and Play Store app mappings and production keys
  remain blocked until the store app records are available.
- Confirm a prod startup log has no `ShortiGo release blockers` entries.
- Keep the Homebrew Ruby/CocoaPods environment available for iOS builds, or install an equivalent Ruby/CocoaPods toolchain and rerun `pod --version`.
- Install Android command-line tools, accept Android licenses, reinstall a complete NDK, and rerun `flutter doctor -v`. Completed on 2026-06-02.
- Replace placeholder `--dart-define` values with production `SENTRY_DSN`,
  `ADMOB_APP_ID_IOS`, `ADMOB_APP_ID_ANDROID`, `ADMOB_REWARDED_IOS`,
  `ADMOB_REWARDED_ANDROID`, `RC_API_KEY_IOS`, and `RC_API_KEY_ANDROID`.
  Sentry and AdMob values are configured locally. RevenueCat currently uses
  Test Store sandbox keys until the real store app mappings can be created.
- Configure Android release signing before uploading to Play Console. Local upload signing is configured; back up `android/app/upload-keystore.jks` and `android/key.properties` before store submission.
- Archive the iOS app in Xcode with the production Apple team and upload to App Store Connect.
- Repair the local macOS/Xcode runtime state before the next iOS archive.
  Completed on 2026-06-04: generated caches were cleared, available disk space
  increased, the stale runtime registration was replaced, and iOS 17.2 now
  appears as an eligible build and simulator platform.
