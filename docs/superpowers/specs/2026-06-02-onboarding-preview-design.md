# Onboarding Category Preview Design

Date: 2026-06-02
Status: approved for implementation

## Goal

Replace the hard logged-out redirect to `/login` with a public onboarding preview that lets new users browse categories before signing in.

## Scope

Build a single `/onboarding` page outside the bottom-nav shell. It previews public series only. Do not add profile completion, email verification, new Firestore schema, or marketing landing-page sections.

## User Experience

Logged-out users who launch the production app land on `/onboarding`. The page has a compact brand header, sign-in/create-account actions, category chips, and a three-column preview grid using the existing `SeriesCard`.

Selecting a category loads public series for that category. Tapping a series while logged out navigates to `/login`. After a successful login, existing auth behavior sends the user to `/discover`.

Logged-in users who visit `/onboarding` or `/login` are redirected to `/discover`.

## Data Flow

`OnboardingPreviewNotifier` uses `seriesRepositoryProvider.byCategory(Category.forYou)` initially and `byCategory(category)` for chip changes. It uses the same public `series` reads as Discover, so no new Firebase rules are needed.

## Components

- `OnboardingPreviewNotifier`: async state for selected category and preview series.
- `OnboardingPage`: route target for `/onboarding`, outside `AppShell`.
- Router auth gate: `/onboarding` and `/login` are public; protected app routes redirect logged-out users to `/onboarding`.

## Testing

Add notifier unit tests for initial For You load and category switching. Add router/widget coverage to verify logged-out protected routes land on onboarding and that the page shows the preview empty state.
