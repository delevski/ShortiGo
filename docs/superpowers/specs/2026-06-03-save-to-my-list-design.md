# Save to My List Design

## Goal

Make the existing My List screen usable by letting signed-in users save and unsave series from the series detail page.

## Current State

`/my-list` already exists and reads `users/{uid}.favoriteSeriesIds`, but no UI writes to that field. As a result, the screen usually shows the empty state even though the route and page are implemented.

## Design

Add a Save/Unsave control to `SeriesDetailPage`. The control reads the current app user document and checks whether the current `seriesId` is in `favoriteSeriesIds`.

When signed in:
- Save adds the current series ID to `favoriteSeriesIds`.
- Unsave removes the current series ID from `favoriteSeriesIds`.
- My List updates from the existing `currentAppUserDocProvider`/Firestore stream.

When signed out:
- The Save button stays visible.
- Tapping it routes the user to `/login`.

## Data Model

Use the existing `users/{uid}.favoriteSeriesIds` array. Writes use Firestore `FieldValue.arrayUnion` and `FieldValue.arrayRemove` so repeated taps are idempotent and do not overwrite other user fields.

## Testing

Add unit coverage for the repository save/unsave methods using fake Firestore. Add widget coverage that verifies the series detail page shows Save, writes the ID, then changes to Saved/Unsave behavior when tapped again.

