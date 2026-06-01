# ShortiGo v1 Release Verification

Date: 2026-06-01
Branch: feat/v1-mvp
Version: 0.1.0+2

## Automated Checks

- Flutter analyze: pending final run after release docs.
- Flutter unit/widget tests: pending final run after release docs.
- Integration cold-start test: previously passed with `flutter test integration_test/app_test.dart`.
- iOS release build: blocked locally. `flutter build ios --release --no-codesign` stops because CocoaPods is installed with a broken Ruby shebang at `/usr/local/bin/pod`.
- Android release AAB: blocked locally. `flutter build appbundle --release` reaches native packaging, then fails because the installed Android NDK does not include `llvm-strip`. `flutter doctor -v` also reports missing Android command-line tools and unknown license status.

## Cloud Setup

- Firestore rules file is committed at `firestore.rules`.
- Firestore rules deploy is blocked because the configured Firebase project `shortigo-dev` is not found or not accessible.
- Storage CORS file is committed at `storage-cors.json`.
- Storage CORS apply is blocked because buckets `gs://shortigo-dev.appspot.com` and `gs://shortigo.appspot.com` do not exist or are not accessible.
- Cloud Functions deploy is blocked by the same Firebase/GCP project setup issue.
- Dev seed script exists, but Firestore writes require a real project and credentials.

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

- Create or switch `.firebaserc` to real dev/prod Firebase project IDs.
- Provision Firestore, Storage buckets, Cloud Functions, Auth, AdMob, RevenueCat, Sentry, and Firebase Performance.
- Reinstall CocoaPods with the active macOS Ruby, or install via Homebrew/rbenv and rerun `pod --version`.
- Install Android command-line tools, accept Android licenses, reinstall a complete NDK, and rerun `flutter doctor -v`.
- Replace placeholder `--dart-define` values with production AdMob and RevenueCat keys.
- Configure Android release signing before uploading to Play Console.
- Archive the iOS app in Xcode with the production Apple team and upload to App Store Connect.
