# Watch And Save Analytics Design

## Goal

ShortiGo should collect meaningful watch counts for every episode and series,
collect public save counts for series, and show compact TikTok-style labels next
to action icons in the mobile app.

## Decisions

- A watch counts once a viewer reaches meaningful playback: at least 3 seconds or
  25% of the episode duration, whichever happens first.
- A user should only increment an episode watch once per episode.
- Series watch counts should increase when an episode in that series receives a
  counted watch.
- Save counts should reflect unique saved series, increasing on save and
  decreasing on unsave.
- Public counters must be updated by the trusted Worker, not directly by mobile
  Firestore writes.
- Labels should use compact count formatting such as `1.2K`, `45K`, and `2.1M`.

## Architecture

Flutter will add analytics-facing fields to the `Episode` and `Series` domain
entities: `watchCount` and `saveCount`. A new analytics gateway will call the
Cloudflare Worker when a watch threshold is reached or a series save state
changes. The Worker will verify the Firebase ID token, dedupe per-user watch
events, and update aggregate counters on public Firestore documents.

This keeps trusted counters out of mobile write rules while still letting the app
display public counts from normal series and episode reads.

## Mobile Data Flow

Shorts playback and the full episode player will both use the same threshold
logic. For each visible episode, the app tracks playback progress and calls
`recordEpisodeWatch(episodeId, seriesId)` once when playback reaches 3 seconds
or 25% of duration. The gateway should ignore repeat calls during the same local
session for the same episode, and the Worker should dedupe across sessions.

Saving a series continues to update `users/{uid}.favoriteSeriesIds` through the
existing user repository. After the local save or unsave succeeds, the app calls
the analytics gateway so the Worker can update the public `series.saveCount`.
If the analytics call fails, the user-facing save action should still remain
complete; the error can be logged or traced without blocking the user.

## Worker API

The Worker will expose these authenticated endpoints:

- `POST /v1/analytics/episodes/{episodeId}/watch`
- `POST /v1/analytics/series/{seriesId}/save`
- `POST /v1/analytics/series/{seriesId}/unsave`

For watch events, the Worker will read the episode document, confirm the series
id, then create a dedupe event under `users/{uid}/events/watch:{episodeId}`.
If the event already exists, it returns success without incrementing counters.
If the event is new, it increments `episodes/{episodeId}.watchCount` and
`series/{seriesId}.watchCount`.

For save and unsave events, the Worker will update `series/{seriesId}.saveCount`.
The mobile app already controls unique saves through `favoriteSeriesIds`, so the
Worker only needs to clamp the public counter at zero for unsaves.

## UI

Shorts action buttons should show an icon with a compact label below it, matching
the current glass action style. The save button label should show the series save
count, not the word `SAVE`, while preserving the filled bookmark state for saved
series. Watch counts should be shown in the Shorts information panel and on
series detail where the user already sees series metadata.

The visual treatment should stay compact and readable on mobile. Counts should
never resize the action button or overlap neighboring controls.

## Firestore Rules

Mobile users should not receive direct update permission for public `series` or
`episodes` analytics counters. The existing server-side path remains the trust
boundary. User event documents may remain readable and writable by the owner as
currently configured, but public aggregate writes should happen through the
Worker service account.

## Testing

Tests should cover:

- The watch threshold helper counts after 3 seconds for longer episodes.
- The watch threshold helper counts after 25% for short episodes.
- The watch threshold helper does not count before the threshold.
- The analytics gateway builds authenticated Worker requests.
- Watch recording dedupes locally so one episode is not sent repeatedly in a
  single playback session.
- Count formatting returns compact labels.
- Save and unsave actions still update user state even if analytics reporting
  fails.
- Worker economy or analytics helpers dedupe watch events and clamp save counts.

## Out Of Scope

- A full creator analytics dashboard.
- Paid analytics products.
- Real-time charting.
- Per-device fraud scoring.
- Changing the definition of My List from saved series to saved episodes.
