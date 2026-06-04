# ShortiGo v1 Release Verification

Date: 2026-06-04
Branch: main
Version: 0.1.0+2

## Automated Checks

- Flutter analyze: passed on 2026-06-04 with no issues.
- Flutter unit/widget tests: all 31 passed on 2026-06-04.
- Admin Studio build: passed on 2026-06-04 with Vite's Firebase bundle-size warning.
- Firestore security rules tests: all 4 passed in the emulator on 2026-06-04.
- Cloud Functions TypeScript build: passed on 2026-06-04.
- Integration cold-start test: passed on Android emulator on 2026-06-01.
- iOS release build: passed on 2026-06-04. `flutter build ios --release --no-codesign --dart-define=ENV=prod` produced `build/ios/iphoneos/Runner.app` (94.6MB).
- Android release AAB: passed on 2026-06-04. `flutter build appbundle --release --dart-define=ENV=prod` produced `build/app/outputs/bundle/release/app-release.aab` (59.0MB).
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
- [ ] Tap a locked VIP episode and verify the subscribe CTA appears.
- [ ] Airplane mode: each error view shows "No connection".
- [ ] Background for 1 hour, return, and verify content loads.
- [ ] Sentry crash-free rate above 99.5%.

## Required Before Store Submission

- Create or switch `.firebaserc` to the single Firebase project ID. Completed for `shortigo-prod`.
- Keep Firebase on the Spark plan; do not enable billing.
- Delete the unused `shortigo-dev` Firebase project. Completed on 2026-06-02.
- Configure Firebase Auth providers in the console. Completed for Email/Password and Google on 2026-06-02.
- Provision AdMob, RevenueCat, Sentry, and Firebase Performance.
- Confirm a prod startup log has no `ShortiGo release blockers` entries.
- Keep the Homebrew Ruby/CocoaPods environment available for iOS builds, or install an equivalent Ruby/CocoaPods toolchain and rerun `pod --version`.
- Install Android command-line tools, accept Android licenses, reinstall a complete NDK, and rerun `flutter doctor -v`. Completed on 2026-06-02.
- Replace placeholder `--dart-define` values with production `SENTRY_DSN`,
  `ADMOB_APP_ID_IOS`, `ADMOB_APP_ID_ANDROID`, `ADMOB_REWARDED_IOS`,
  `ADMOB_REWARDED_ANDROID`, `RC_API_KEY_IOS`, and `RC_API_KEY_ANDROID`.
- Configure Android release signing before uploading to Play Console. Local upload signing is configured; back up `android/app/upload-keystore.jks` and `android/key.properties` before store submission.
- Archive the iOS app in Xcode with the production Apple team and upload to App Store Connect.
