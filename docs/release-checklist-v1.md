# ShortiGo v1 Release Verification

Date: 2026-06-02
Branch: main
Version: 0.1.0+2

## Automated Checks

- Flutter analyze: passed on 2026-06-01.
- Flutter unit/widget tests: passed on 2026-06-01.
- Integration cold-start test: passed on Android emulator on 2026-06-01.
- iOS release build: blocked locally. `flutter build ios --release --no-codesign` stops because CocoaPods is installed with a broken Ruby shebang at `/usr/local/bin/pod`.
- Android release AAB: passed on 2026-06-02. `flutter build appbundle --release --dart-define=ENV=prod ...` produced `build/app/outputs/bundle/release/app-release.aab` (59.5MB).

## Cloud Setup

- Firebase project `shortigo-prod` was created on 2026-06-02.
- Firebase project `shortigo-dev` was deleted/scheduled for deletion on 2026-06-02.
- Root Firebase config is committed at `.firebaserc` and `firebase.json`.
- Firestore rules file is committed at `firestore.rules`.
- Firestore indexes file is committed at `firestore.indexes.json`.
- Firestore rules and indexes are deployed to `shortigo-prod`.
- Android Firebase app is registered for `com.shortigo.shortigo`.
- iOS Firebase app is registered for `com.shortigo.shortigo`.
- Android debug SHA-1/SHA-256 fingerprints are registered for Google Sign-In.
- Platform config files are written at `android/app/google-services.json` and `ios/Runner/GoogleService-Info.plist`.
- Storage CORS file remains in the repo for future paid media hosting, but Storage is not part of the Spark-only setup.
- Cloud Functions remain in the repo for a future paid backend, but the Flutter app no longer calls them in Spark mode.
- Identity Toolkit/Auth API is enabled for `shortigo-prod`; Auth providers still need Firebase Console configuration.
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
- Reinstall CocoaPods with the active macOS Ruby, or install via Homebrew/rbenv and rerun `pod --version`.
- Install Android command-line tools, accept Android licenses, reinstall a complete NDK, and rerun `flutter doctor -v`. Completed on 2026-06-02.
- Replace placeholder `--dart-define` values with production AdMob and RevenueCat keys.
- Configure Android release signing before uploading to Play Console.
- Archive the iOS app in Xcode with the production Apple team and upload to App Store Connect.
