# Onboarding Category Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/onboarding` as the logged-out public category preview screen.

**Architecture:** Add a focused Riverpod notifier for public category previews, add an onboarding page outside `AppShell`, and update router redirects so logged-out protected routes go to `/onboarding` while `/login` remains accessible.

**Tech Stack:** Flutter, Riverpod `AsyncNotifier`, GoRouter, existing `SeriesRepository`, Flutter tests, Mocktail.

---

## Tasks

- [ ] Add `OnboardingPreviewNotifier` and unit tests for initial load and category switching.
- [ ] Add `OnboardingPage` and wire `/onboarding` route outside the shell.
- [ ] Update auth redirect logic to allow `/onboarding` and `/login`, redirect logged-out protected routes to `/onboarding`, and redirect logged-in users away from onboarding/login.
- [ ] Add widget/router coverage for logged-out onboarding behavior.
- [ ] Run `dart format`, `flutter analyze`, and `flutter test`.
- [ ] Commit only onboarding files, leaving unrelated admin/upload changes untouched.
