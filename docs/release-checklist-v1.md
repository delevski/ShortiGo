# ShortiGo v1 Release Verification

Date: 2026-06-02
Branch: main
Version: 0.1.0+2

## Automated Checks

- Flutter analyze: passed on 2026-06-01.
- Flutter unit/widget tests: passed on 2026-06-01.
- Integration cold-start test: passed on Android emulator on 2026-06-01.
- iOS release build: blocked locally. `flutter build ios --release --no-codesign` stops because CocoaPods is installed with a broken Ruby shebang at `/usr/local/bin/pod`.
- Android release AAB: blocked locally. `flutter build appbundle --release` reaches native packaging, then fails because the installed Android NDK does not include `llvm-strip`. `flutter doctor -v` also reports missing Android command-line tools and unknown license status.

## Cloud Setup

- Firebase projects `shortigo-dev` and `shortigo-prod` were created on 2026-06-02.
- Root Firebase config is committed at `.firebaserc` and `firebase.json`.
- Firestore rules file is committed at `firestore.rules`.
- Firestore indexes file is committed at `firestore.indexes.json`.
- Firestore rules and indexes are deployed to `shortigo-dev` and `shortigo-prod`.
- Storage CORS file is committed at `storage-cors.json`.
- Storage rules file is committed at `storage.rules`.
- Storage rules and CORS are blocked until billing is enabled and default buckets are created.
- Cloud Functions deploy is blocked until the projects are upgraded to Blaze; Cloud Build cannot be enabled on the free plan.
- Identity Toolkit/Auth API is enabled for `shortigo-dev` and `shortigo-prod`; Auth providers still need Firebase Console configuration.
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

- Create or switch `.firebaserc` to real dev/prod Firebase project IDs. Completed for `shortigo-dev` and `shortigo-prod`.
- Enable billing on both Firebase projects.
- Initialize default Storage buckets for both Firebase projects.
- Enable and deploy Cloud Functions after Blaze upgrade.
- Configure Firebase Auth providers in the console.
- Provision AdMob, RevenueCat, Sentry, and Firebase Performance.
- Reinstall CocoaPods with the active macOS Ruby, or install via Homebrew/rbenv and rerun `pod --version`.
- Install Android command-line tools, accept Android licenses, reinstall a complete NDK, and rerun `flutter doctor -v`.
- Replace placeholder `--dart-define` values with production AdMob and RevenueCat keys.
- Configure Android release signing before uploading to Play Console.
- Archive the iOS app in Xcode with the production Apple team and upload to App Store Connect.
