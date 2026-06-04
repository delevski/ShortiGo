# Account & Subscription Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add store-compliant purchase restoration and an in-app account deletion flow.

**Architecture:** Extend the existing IAP gateway and subscription notifier with restore behavior. Add a focused account-deletion notifier that removes the user's deletable Firestore profile data before deleting the Firebase Auth account; immutable transaction history remains protected and is disclosed in the confirmation UI.

**Tech Stack:** Flutter, Riverpod, Firebase Auth, Cloud Firestore, RevenueCat, Firebase Rules Unit Testing

---

### Task 1: Restore purchases

**Files:**
- Modify: `lib/domain/interfaces/iap_gateway.dart`
- Modify: `lib/data/iap/revenuecat_iap_gateway.dart`
- Modify: `lib/features/subscription/application/subscription_notifier.dart`
- Modify: `lib/features/subscription/presentation/subscribe_page.dart`
- Create: `test/unit/features/subscription_notifier_test.dart`
- Create: `test/widget/subscribe_page_test.dart`

- [ ] Write notifier and widget tests that require a restore API and visible Restore Purchases action.
- [ ] Run the focused tests and confirm they fail because restore behavior is missing.
- [ ] Implement `IapGateway.restorePurchases()`, RevenueCat restoration, notifier state, and the button.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Delete account data

**Files:**
- Modify: `lib/domain/interfaces/user_repository.dart`
- Modify: `lib/data/firestore/user_repository.dart`
- Modify: `firestore.rules`
- Modify: `admin/test/firestore.rules.test.mjs`
- Modify: `test/unit/data/firestore_repository_test.dart`

- [ ] Write repository and Firestore rules tests for deleting profile, favorites, and events while protecting transactions.
- [ ] Run the focused tests and confirm they fail because profile deletion is not allowed or implemented.
- [ ] Implement batched deletion for known personal-data collections and allow the owner to delete their user document.
- [ ] Run the focused tests and confirm they pass.

### Task 3: Account deletion UI

**Files:**
- Create: `lib/features/profile/application/account_deletion_notifier.dart`
- Modify: `lib/features/profile/presentation/profile_page.dart`
- Create: `test/widget/profile_page_test.dart`

- [ ] Write a widget test requiring an Account & Subscription section and destructive confirmation.
- [ ] Run the focused test and confirm it fails because the controls are missing.
- [ ] Implement the notifier, confirmation dialog, loading/error state, and account deletion action.
- [ ] Run the focused test and confirm it passes.

### Task 4: Verification and release follow-up

**Files:**
- Modify: `docs/release-checklist.md` if present

- [ ] Run `dart format`, `flutter analyze --no-pub`, and `flutter test --no-pub`.
- [ ] Run `npm run test:rules` from `admin`.
- [ ] Deploy Firestore rules to `shortigo-prod`.
- [ ] Build the Android release app bundle.
- [ ] Retry iOS build diagnostics and document any remaining local Xcode blocker.
- [ ] Retry Git push only if GitHub authentication is available.
