# Save to My List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a working Save/Unsave series flow so the existing My List page can populate from user favorites.

**Architecture:** Extend `UserRepository` with `saveSeries` and `unsaveSeries`, implemented by Firestore array updates. Add a Riverpod-backed button to `SeriesDetailPage` that reads the current app user, routes signed-out users to login, and toggles the current series ID.

**Tech Stack:** Flutter, Riverpod, GoRouter, Cloud Firestore, fake_cloud_firestore, flutter_test.

---

### Task 1: Repository Favorites API

**Files:**
- Modify: `lib/domain/interfaces/user_repository.dart`
- Modify: `lib/data/firestore/user_repository.dart`
- Test: `test/unit/data/firestore_repository_test.dart`

- [ ] Add `saveSeries` and `unsaveSeries` to `UserRepository`.
- [ ] Implement both methods in `FirestoreUserRepository` using `FieldValue.arrayUnion([seriesId])` and `FieldValue.arrayRemove([seriesId])`.
- [ ] Add tests proving save appends one favorite and unsave removes it.
- [ ] Run `flutter test test/unit/data/firestore_repository_test.dart`.

### Task 2: Series Detail Save Button

**Files:**
- Modify: `lib/features/series_detail/presentation/series_detail_page.dart`
- Test: `test/widget/series_detail_page_test.dart`

- [ ] Add a Save/Saved button below the series description.
- [ ] Read `currentAppUserDocProvider` to compute saved state.
- [ ] On signed-out tap, route to `/login`.
- [ ] On signed-in tap, call `saveSeries` or `unsaveSeries`.
- [ ] Invalidate/read user state only through the existing stream provider.
- [ ] Add widget tests for signed-in save and unsave behavior.
- [ ] Run `flutter test test/widget/series_detail_page_test.dart`.

### Task 3: Verification

**Files:**
- Modify as needed based on formatter/analyzer output.

- [ ] Run `dart format` on touched Dart files.
- [ ] Run `flutter analyze`.
- [ ] Run `flutter test`.
- [ ] Run `git diff --check`.
- [ ] Commit and push the finished feature.

