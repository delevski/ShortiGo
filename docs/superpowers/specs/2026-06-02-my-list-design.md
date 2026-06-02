# My List Saved Series Design

Date: 2026-06-02
Status: approved for implementation

## Goal

Replace the `/my-list` placeholder with a real saved-series screen for v1. The screen shows the current user's saved series from `AppUser.favoriteSeriesIds` and lets the user open a saved series detail page.

## Scope

Build saved series only. Do not add saved episodes, folders, sorting controls, or a new Firestore schema in this pass.

## User Experience

`/my-list` keeps the existing bottom-navigation destination and app bar title. When the user has saved series, the page shows them in the same three-column poster grid used by Discover, using the existing `SeriesCard` component. Tapping a card navigates to `/series/:id`.

When no user is signed in or the user's saved-series list is empty, the page shows a simple empty state with a clear title and short message. It should not show the old placeholder page.

Errors from loading user or series data use the existing `ErrorView` and `friendlyErrorFor` pattern. Loading uses the existing `LoadingView`.

## Data Flow

The screen reads `currentAppUserDocProvider` for the current `AppUser`.

If `favoriteSeriesIds` is empty, return an empty list immediately.

If IDs exist, resolve each ID through `seriesRepositoryProvider.byId(id)`. Preserve the user's saved order from `favoriteSeriesIds`. Filter out unpublished or missing series only if the repository call returns unusable data or throws for that individual item; a complete Firestore failure should still surface through `ErrorView`.

## Components

- `MyListPage`: route target for `/my-list`.
- `MyListNotifier`: Riverpod async notifier that loads the current user's saved series.
- `MyListState`: small immutable state object with `series`.

## Testing

Add unit coverage for the notifier:

- empty user or empty `favoriteSeriesIds` returns an empty list;
- saved IDs resolve to series in saved order.

Update widget/navigation coverage so tapping the bottom-nav `My List` item no longer lands on `PlaceholderPage` and shows the new empty state.

## Non-Goals

- No favorite/unfavorite button in this pass.
- No saved episodes.
- No admin or upload workflow changes.
- No billing, Firebase Storage, or Cloud Functions changes.
