# ShortiGo — Design Spec (v1)

**Status:** Approved
**Date:** 2026-06-01
**Author:** opencode (via brainstorming skill, with user collaboration)
**Target stack:** Flutter 3.x (iOS + Android)

## 1. Goals & non-goals

**Goal.** Ship a Flutter (iOS + Android) short-drama streaming app that feels like TikTok — videos play instantly on swipe, content is series-based, and revenue flows from VIP subscriptions + rewarded ads.

**Non-goals (v1).** Offline downloads, watch history, multi-language, real recommendation algorithm, push notifications, casting, social features (likes/comments), tablet/web/desktop.

## 2. User stories

- As a **new user**, I see category previews without signing up; I can sign in with email or Google.
- As a **signed-in user**, I see a "For You" feed of series; tapping a series opens the episode list.
- As a **viewer**, I swipe up/down in the Shorts feed and each new video starts in < 350 ms.
- As a **free user**, I see ads; I earn bonus coins for watching them, and I can buy more coins.
- As a **VIP subscriber**, I see no ads, get 1080p, and unlock the VIP category.
- As an **admin**, I upload new series/episodes via a script; they appear in the app after I flip `isPublished`.

## 3. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Flutter 3.x | Single codebase, fast iteration |
| State | Riverpod 2 (codegen) | Compile-time safe, no provider-tree mistakes |
| Routing | go_router + auto_route | Typed routes, deep links |
| Auth | Firebase Auth + google_sign_in | Email + Google, official plugins |
| DB | Cloud Firestore | Real-time, offline, free tier |
| Storage | Firebase Storage (v1), Cloudflare Stream (v2) | Free now, swap later via `VideoSource` interface |
| Local cache | drift (SQLite) | Type-safe, fast |
| Video | better_player | Pre-buffering, ABR hooks |
| Ads | google_mobile_ads (AdMob) | Best Flutter support |
| IAP | purchases_flutter (RevenueCat) | Cross-platform, server receipt validation |
| Errors | sentry_flutter | Crash + breadcrumbs |
| Perf | firebase_performance | Free, integrates with Firebase |
| Build | `--flavor dev\|prod` + `--dart-define=ENV=…` | Two environments from day one |

## 4. Architecture

### Layered (Clean Architecture-lite)

```
Presentation (widgets, go_router)
    ↓ intents / state
Application (Riverpod Notifiers)
    ↓
Domain (entities, gateway interfaces)
    ↑ implements
Data (Firestore, Storage, AdMob, RevenueCat, drift)
```

**Why this matters for ShortiGo specifically:**
- The `VideoSource` interface means swapping Firebase Storage → Cloudflare Stream is one file.
- The `AdGateway` / `IAPGateway` interfaces let you swap providers without touching screens.
- Pure-Dart domain layer = unit-testable without mocking Firebase.

### Package layout

```
shortigo/
├── lib/
│   ├── main.dart
│   ├── app.dart                    # MaterialApp + go_router setup
│   ├── core/                       # Cross-cutting (theme, env, errors)
│   │   ├── theme/
│   │   ├── router/
│   │   ├── env/                    # Build-time config (flavor → env)
│   │   └── error/
│   ├── features/
│   │   ├── auth/                   # login, register, google sign-in
│   │   ├── discover/               # categories grid, For You, New, Hot
│   │   ├── shorts/                 # TikTok-style vertical feed
│   │   ├── series_detail/          # cover, description, episode list
│   │   ├── episode_player/         # full-screen player w/ pre-cache
│   │   ├── rewards/                # daily check-in, watch-ad-for-coins
│   │   ├── wallet/                 # coins, bonus, top-up
│   │   ├── subscription/           # VIP subscribe flow
│   │   └── profile/                # settings, signout
│   ├── domain/                     # shared entities, value objects
│   │   ├── entities/               # Series, Episode, User, Category
│   │   └── interfaces/             # abstract gateways
│   └── data/                       # implementations + caches
│       ├── firestore/              # series, episode, user, transactions
│       ├── storage/                # VideoSource impls
│       ├── ads/                    # AdMobAdGateway
│       ├── iap/                    # RevenueCatIAPGateway
│       └── local/                  # drift DB, secure storage
├── test/
│   ├── unit/                       # domain + application
│   ├── widget/                     # features
│   └── integration/                # full-app smoke
└── cloud_functions/                # Firebase Functions (Node/TS)
    ├── grantAdReward/              # server-side ad credit grant
    └── grantVipSubscription/       # server-side VIP grant (IAP webhook)
```

### Build flavors

Two flavors from day one:
- `dev` — points to `shortigo-dev` Firebase project, debug AdMob unit IDs
- `prod` — points to `shortigo` Firebase project, real AdMob unit IDs

Driven by `--dart-define=ENV=dev|prod` and a singleton `Env` resolved at startup.

## 5. Data model

### Entities (freezed)

```dart
@freezed
class Series with _$Series {
  const factory Series({
    required String id,
    required String title,
    required String description,
    required String coverUrl,           // 9:16 cover image (Storage URL)
    required Category category,
    required bool isVip,
    required int episodeCount,
    required int totalDurationSec,
    required DateTime createdAt,
    required int popularity,            // cached view count, updated by CF
    @Default(true) bool isPublished,
  }) = _Series;
}

@freezed
class Episode with _$Episode {
  const factory Episode({
    required String id,
    required String seriesId,           // denormalized for fast feed queries
    required int order,                 // 1..N within series
    required String videoUrl,           // Firebase Storage download URL
    required String thumbnailUrl,
    required int durationSec,
    @Default(false) bool isVipLocked,   // overrides series.isVip
  }) = _Episode;
}

@freezed
class User with _$User {
  const factory User({
    required String id,
    required String email,
    String? displayName,
    String? photoUrl,
    @Default(false) bool isVip,
    DateTime? vipExpiresAt,
    @Default(0) int coins,              // paid currency
    @Default(0) int bonus,              // earned currency (non-purchasable)
    @Default([]) List<String> favoriteSeriesIds,
    DateTime? lastDailyCheckIn,
    required DateTime createdAt,
  }) = _User;
}

enum Category {
  forYou,    // virtual — driven by /admin/featured
  new,       // ordered by createdAt desc
  hot,       // ordered by popularity desc
  adventure,
  scary,
  anime,
  vip;       // filter: isVip == true

  String get displayName => switch (this) {
        Category.forYou => 'For You',
        Category.new => 'New',
        Category.hot => 'Hot',
        Category.adventure => 'Adventure',
        Category.scary => 'Scary',
        Category.anime => 'Anime',
        Category.vip => 'VIP',
      };
}

@freezed
class Transaction with _$Transaction {
  const factory Transaction({
    required String id,
    required String userId,
    required TxType type,               // adReward | purchase | spend | refund
    required int coinsDelta,
    required int bonusDelta,
    required String? reference,         // ad unit id, IAP receipt, episode id
    required DateTime at,
  }) = _Transaction;
}
```

### Firestore collection layout

```
/series/{seriesId}                  Series document
/episodes/{episodeId}               Episode document (flat, denormalized)
/users/{userId}                     User profile + wallet
/users/{userId}/transactions/{txId} Coin ledger (append-only)
/users/{userId}/favorites/{seriesId} Favorites
/users/{userId}/events/{eventId}    Telemetry (impressions, completions)
/categories/{categoryId}            Category metadata
/admin/featured                     Manual "For You" curation
/admin/config                       App config (ad cap, etc.)
```

### Composite indexes

- `episodes`: `seriesId ASC, order ASC` (episode list)
- `episodes`: `isVipLocked ASC, popularity DESC` (VIP carousel)
- `series`: `isPublished ASC, category ASC, popularity DESC` (Hot)
- `series`: `isPublished ASC, category ASC, createdAt DESC` (New)
- `series`: `isPublished ASC, isVip ASC, createdAt DESC` (VIP)

### Local cache (drift)

```sql
CREATE TABLE cached_series (
  id TEXT PRIMARY KEY,
  payload BLOB NOT NULL,           -- msgpack-serialized Series
  cached_at INTEGER NOT NULL,
  category TEXT NOT NULL           -- which list it came from (for TTL)
);

CREATE TABLE cached_episodes (
  series_id TEXT NOT NULL,
  order_idx INTEGER NOT NULL,
  payload BLOB NOT NULL,
  cached_at INTEGER NOT NULL,
  PRIMARY KEY (series_id, order_idx)
);
```

**TTL policy:**
- Trending lists (Hot, New): 30 min
- Episode list for an opened series: 24 h
- Single episode metadata (URL expires — revalidate on open)

**Storage URL caveat:** Firebase Storage download URLs include a token. They're valid for a long time but not forever. Episodes that fail to play re-fetch a fresh URL on next open.

### Wallet trust boundary (ledger pattern)

`User.coins` and `User.bonus` look like counters, but if the client increments them, a rooted device mints infinite coins. The pattern:

1. Client triggers an action (watched ad, completed IAP)
2. Cloud Function verifies the receipt / server-side event
3. Cloud Function appends a `Transaction` to the ledger
4. Cloud Function updates `User.coins` / `User.bonus` via `FieldValue.increment`
5. Client subscribes to the user doc and re-renders wallet

**Daily ad cap: 50 ads/user/day** (config in `/admin/config`).

### Security rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /series/{id}       { allow read: if true; allow write: if false; }
    match /episodes/{id}     { allow read: if true; allow write: if false; }
    match /categories/{id}   { allow read: if true; allow write: if false; }

    match /users/{uid} {
      allow read, update: if request.auth != null && request.auth.uid == uid;
      allow create: if request.auth != null
                    && request.auth.uid == uid
                    && request.resource.data.coins == 0
                    && request.resource.data.bonus == 0;
    }

    match /users/{uid}/transactions/{txId} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false;  // only Admin SDK
    }

    match /users/{uid}/favorites/{sid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /users/{uid}/events/{eid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /admin/{doc}       { allow read: if true; allow write: if false; }
  }
}
```

**Note:** The `coins/bonus` create-time rule blocks initial minting, but a determined attacker can update their doc after creation. The real protection is that **every cent that's spent goes through a Cloud Function that re-reads the ledger**. The client cannot make authoritative state changes.

## 6. Module internals

### Feature structure (the `shorts` example)

```
features/shorts/
├── presentation/
│   ├── shorts_page.dart              # PageView.builder
│   ├── video_card.dart               # Single full-screen video card
│   ├── video_pre_cache.dart          # Pre-cache controller
│   └── widgets/
│       ├── play_pause_overlay.dart
│       └── swipe_hint.dart
├── application/
│   ├── shorts_feed_notifier.dart     # AsyncNotifier<ShortsFeedState>
│   ├── shorts_feed_state.dart        # freezed state
│   └── video_pre_cache_manager.dart  # Owns N BetterPlayerControllers
└── providers.dart                    # Riverpod providers
```

### VideoPreCacheManager (the secret sauce)

```dart
class VideoPreCacheManager {
  static const _windowSize = 3;  // current ± 1, plus next

  final List<BetterPlayerController> _controllers;
  final Map<String, String> _urlByEpisodeId;

  Future<void> onPageChanged(int currentIndex, List<Episode> episodes) async {
    // Prune anything outside [_windowSize] of current
    // Init controllers for current ± 1 (reuse if already in window)
    // Kick off BetterPlayerController.setupDataSource() (loads but doesn't play)
    // Pre-render first frame as a still thumbnail for instant first paint
  }
}
```

**Why ±1 and not the whole feed?** Memory. Each `BetterPlayerController` is ~50–100 MB when initialized. Three is the sweet spot for 720p on mid-range Android. On low-RAM devices, auto-shrink to 2.

## 7. Key flows

### Flow 1: Cold start → first frame

```
App launch
  → main.dart initializes Firebase, RevenueCat, AdMob (parallel)
  → Router reads auth state
     ├─ unauthenticated → /onboarding (categories preview, no auth gate)
     └─ authenticated   → /discover (default tab)

User lands on /discover (For You)
  → ForYouNotifier:
     1. Read /admin/featured (cached, 30 min TTL)
     2. Read N series metadata (Firestore, 30 min TTL)
     3. Read first episode video URLs for top 3 series
     4. Pre-cache next-3 episode URLs in background (low priority)
  → UI shows cards as data lands (skeleton → thumbnails → videos)

User taps a series → /series/{id}
  → SeriesDetailNotifier:
     1. Read /series/{id} (24h cache)
     2. Read /episodes where seriesId == id, ordered (24h cache)
  → Tap "Watch EP.1" → /player/{seriesId}/{episodeId}
  → PlayerNotifier:
     1. Mints fresh Storage URL (token may have expired)
     2. Hands URL to VideoPreCacheManager
     3. Plays current, pre-caches next episode in player
```

### Flow 2: Swipe in /shorts (the performance-critical path)

```
User on episode 3 in /shorts
VideoPreCacheManager already has controllers for [2, 3, 4] initialized
  → 2 is paused, 3 is playing, 4 is buffered-not-playing
User swipes up
  → PageView animates from 3 → 4
  → VideoCard 3 fires onPageLeft: pauses controller 3, releases its texture
  → VideoCard 4 fires onPageEntered: starts playback (buffer warm → <100ms)
  → PreCacheManager shifts window to [3, 4, 5]:
       - Controller 3 stays alive (for swipe-back)
       - Controller 4 already exists, becomes current
       - New controller 5 is set up, starts buffering
```

**"Must run fast" is met** because by the time the user swipes, the next video is already buffered in memory. The user perceives zero loading.

### Flow 3: Watch-ad-for-coins

```
User on /rewards, taps "Watch Ad"
  → AdMob loads a rewarded ad (already pre-loaded at app start)
  → Ad plays full-screen
  → On completion, AdMob fires onUserEarnedReward with reward amount
  → Client calls Cloud Function grantAdReward({adUnitId, adId, rewardType})
  → Cloud Function:
     1. Verifies adId is real (anti-cheat: rate-limit per user, device fingerprint)
     2. Appends a Transaction(type: adReward, bonusDelta: +N)
     3. Increments User.bonus
  → Client subscribes to /users/{uid}, wallet updates automatically
```

**Why Cloud Function, not client-side increment?** Because if a user rewrites the AdMob SDK callback to fire without watching, they'd mint infinite coins. The Cloud Function re-validates via AdMob's server-side callback (v2 = S2S via AdMob Reporting API; v1 = client signal + rate limit + Installation ID fingerprint check).

### Flow 4: VIP subscription

```
User on /profile, taps "Subscribe"
  → RevenueCatIAPGateway.getOfferings() returns current packages
  → User picks a package, purchases via native store sheet
  → purchases_flutter receives the receipt, forwards to RevenueCat
  → RevenueCat webhook → Cloud Function grantVipSubscription({userId, rcCustomerId})
  → Cloud Function:
     1. Validates webhook signature (HMAC)
     2. Sets user.isVip = true, user.vipExpiresAt = expiration
     3. Appends Transaction(type: purchase, coinsDelta: +0) [audit only]
  → Client receives webhook via Firestore listener, gates unlock UI
```

### Flow 5: "For You" personalization (v1: curated, not algorithmic)

For v1, "For You" = manual list at `/admin/featured`:

```json
{
  "seriesIds": ["s_abc", "s_def", "s_ghi"],
  "updatedAt": "<timestamp>"
}
```

The admin updates this in Firestore console. We log impressions to `users/{uid}/events/{eventId}` (later, this becomes training data for a real recommender in v2).

## 8. Performance strategy

### Budgets

| Metric | Budget |
|---|---|
| Tap → playing | < 350 ms |
| Cold start → first /discover frame | < 1.5 s |
| Per-swipe network requests | 0 |
| Memory (typical) | ~350 MB |
| Memory (low-end) | auto-shrink window to 2 |
| Heap (Dart) | 200 MB |
| Video buffers | 3 × ~100 MB |
| Thumbnail cache | 50 MB |

### Pre-cache layers

```
Layer 1: BetterPlayerController in-memory buffer (~50MB × 3)
         ↑ instant, no network
Layer 2: HTTP disk cache from package (default 100MB)
         ↑ instant if pre-warmed, ~200ms cold
Layer 3: Firebase Storage origin
         ↑ 1-3s on first download, <100ms after
```

**Pre-cache policy:**
- When user lands on /shorts episode[i], controllers exist for [i-1, i, i+1] with [i] playing
- When user swipes, controller for [i+2] is initialized (low priority, can be canceled)
- After 5 s of inactivity, controllers for [i-1] and [i+1] are released (memory reclaim)
- The episode about to leave the window is **not** released until the next one is fully buffered (handoff)

### Pre-cache failure modes

- **Out of memory** → release farthest-from-current first, log to telemetry
- **Network drops mid-buffer** → retry once, then leave as "tap to retry" with thumbnail
- **Storage URL expired** → re-mint URL on episode open

### Cold start optimizations

- **Defer** Firebase Analytics, Firebase Performance, RevenueCat init until first frame paints
- **Lazy-init** the AdMob SDK on the /rewards screen, not at launch
- **Pre-warm** the BetterPlayer native plugin in `main()` with a 1-frame black `BetterPlayerController` to avoid first-use jank
- **Skeleton UI** on /discover shows immediately, data lands async

### Network strategy

- **Firestore reads** are batched (`Future.wait`); listeners are scoped and torn down on screen exit
- **Firebase Storage** uses `cors.json` configured for `Range` headers; uploads include `Cache-Control: public, max-age=86400`
- **Per-route network budget:**

| Route | Max requests | Max payload |
|---|---|---|
| /discover (cold) | 4 | 200 KB |
| /discover (warm) | 0 | 0 |
| /shorts (per swipe) | 0 | 0 |
| /series/{id} (open) | 2 | 100 KB |
| /player (open) | 1 | 5 KB |
| /rewards | 1 | 10 KB |

### Frame budget

- 60 FPS = 16.6 ms/frame; we budget 8 ms for our code, 8 ms for the engine + GPU
- PageView's transition is GPU-accelerated — we just hand it widgets
- Video frame composition is hardware-decoded (MediaCodec / VideoToolbox)
- No `Opacity` widgets over video; use `ColorFiltered` if a tint is needed (cheaper)

### Profiling hooks

- `flutter run --profile` with the Performance overlay during dev
- Firebase Performance SDK traces: `cold_start`, `/discover` load, `/shorts` swipe, episode play
- Custom markers around `VideoPreCacheManager.onPageChanged`
- Memory pressure listener: when system memory warning fires, drop pre-cache window to 1

### What we explicitly do NOT do in v1

- Custom HLS / DASH shimming (better_player handles it)
- Pre-caching more than 3 episodes
- Server-side recommendation algorithm
- CDN integration (Firebase Storage's edge network is good enough for v1 traffic)
- WebP / AVIF image formats (JPEG is well-supported, no encoder issues)
- Background isolate for video decode (overkill, the platform handles it)

## 9. Error handling

### Three categories, three reactions

| Category | Example | UX reaction |
|---|---|---|
| Recoverable, user-facing | No internet, ad failed, video URL expired | Show inline retry button, never block UI |
| Recoverable, not user-facing | Cache miss, prefetch failed | Log, fall back to network, continue silently |
| Unrecoverable | Auth token revoked, app version too old | Force logout / force update screen |

**Rules of thumb:**
- Never show a raw `Exception` to the user
- Every async operation has a 10 s timeout; on timeout, treat as recoverable
- Every error path is logged with a correlation ID for support
- The app **never crashes** because of a video playback failure — `better_player` errors are caught and the card is replaced with a retry tile

### Error surfaces

```
main.dart
  └─ runZonedGuarded → Sentry.captureException (crash boundary)

Routes
  └─ AsyncValue.error state → FriendlyErrorScreen (per route)

VideoPreCacheManager
  └─ onError → emit ShortsFeedState.error(videoId, retry)

AdMobAdGateway
  └─ loadFailure → emit RewardAdState.unavailable

RevenueCatIAPGateway
  └─ purchaseFailure → emit PurchaseState.error (show toast, don't navigate)
```

## 10. Testing

### Unit tests (≥ 80% coverage on domain + application)
- All `Repository` methods (with mocked data sources)
- All `Notifier` state transitions
- All `Gateway` interface contracts
- Wallet math (coin/bonus arithmetic)

### Widget tests
- Each page renders empty / loading / error / success states
- Each `VideoCard` state machine (paused, playing, buffering, failed)
- Each branch of `AuthGate` (logged-out, logged-in, profile-completed)

### Integration tests (Flutter `integration_test` package)
- Cold start → land on /discover
- Tap series → /series/{id} → tap episode → /player → video plays
- Watch ad → coins increment in /profile
- Sign out → return to /onboarding
- **Performance test:** swipe in /shorts, assert no network request fires

### Manual QA matrix (per release)

| Test | iOS | Android |
|---|---|---|
| First launch + sign up with email |  |  |
| First launch + sign in with Google |  |  |
| Swipe 50 videos in a row without jank |  |  |
| Background for 1h, return, content still works |  |  |
| Airplane mode → graceful error states |  |  |
| Low memory device (2GB RAM) → window auto-shrinks |  |  |
| Ad blocker active → no crash, ads just don't show |  |  |

## 11. Observability

### Crash & exception reporting — Sentry
- `sentry_flutter` initialized in main, with PII scrubbing on
- Breadcrumbs: route changes, auth state changes, ad events
- Tags: `app_flavor`, `app_version`, `os`, `device_class` (low/mid/high)
- User context: uid only (no email/name)

### Performance — Firebase Performance
- Traces: `cold_start`, `discover_load`, `shorts_swipe`, `episode_play`
- Custom metrics: `pre_cache_buffer_ms`, `first_frame_ms`

### Custom telemetry (cheap, written to Firestore)
- `users/{uid}/events/{eventId}` — append-only, low cardinality
  - `video_impression`, `video_completion`, `ad_watched`, `iap_initiated`, `iap_completed`
  - Used for: v2 recommendation, retention analysis, ad LTV

### Logging
- `logger` package, levels: `t` (trace, dev-only), `d`, `i`, `w`, `e`
- Dev: verbose to console
- Prod: `i` and above to Sentry breadcrumbs, `w`/`e` to Sentry events

## 12. Security & abuse mitigation

- **Auth:** Firebase Auth tokens; Google Sign-In via official plugin; email verification required before first IAP
- **Wallet integrity:** `User.coins` / `User.bonus` are server-authoritative; every change goes through a Cloud Function; client never writes them
- **Daily ad cap:** 50 ads/user/day (config in `/admin/config`)
- **Content moderation:** Series are `isPublished: false` by default; admin flips to `true` after review; no user-generated content in v1
- **IAP receipt validation:** RevenueCat handles receipt validation server-side; webhook on `EXPIRED` / `REFUND` flips `isVip` to false
- **Storage CORS:** `cors.json` configured for `Range` requests (essential for `better_player` seeking)
- **Cache-Control:** `public, max-age=86400` on all video uploads (set via `gsutil setmeta` or upload script)
- **Device fingerprint:** `Installation ID` from `firebase_app_installations` SDK used as anti-cheat signal

## 13. Rollout (7-week plan)

| Week | Milestone | Deliverable |
|---|---|---|
| 1 | Foundations | Firebase projects (dev/prod), AdMob accounts, RevenueCat setup, app shell, go_router, theme, env, build flavors, auth (email + Google), stubbed bottom nav |
| 2 | Discover | Firestore data model, admin upload script, `/discover` with categories + For You + New + Hot, series card component, `/series/{id}` with episode list |
| 3–4 | Player + Shorts | `/player` single-episode screen, `/shorts` vertical feed, pre-cache manager, performance budget enforced via dev-mode assertions |
| 5 | Rewards + Wallet | `/rewards` (daily check-in, watch-ad-for-coins), `/profile` (wallet, transaction history, sign out), Cloud Functions (`grantAdReward`, `grantPurchaseCoins`), receipt validation flow |
| 6 | Subscriptions | RevenueCat IAP integration, `/profile` → subscribe flow, `grantVipSubscription` CF, VIP category gate (server-side check on each episode play) |
| 7 | Hardening | Integration test suite, performance pass on low-end devices, crash-free rate target > 99.5%, App Store + Play Store submission prep |

## 14. Out of scope (v2 candidates)

- Offline downloads
- Watch History / Collection screens
- Language picker (i18n beyond English)
- Push notifications
- Push-to-device casting (Chromecast, AirPlay)
- Real recommendation algorithm
- Multi-region (geo-blocked content)
- Web/desktop clients
- Tablet-optimized layouts
- Comments / likes / shares (per-video social)

## 15. Open / future items

- `tools/upload_episode.dart` — admin script for uploading episodes + thumbnails + setting Cache-Control headers
- `cors.json` — one-time Firebase Storage CORS configuration
- AdMob S2S impression verification in v2 (currently client signal + rate limit + Installation ID)
- Real recommender in v2 trained on `/users/{uid}/events`

---

**Approval:** approved 2026-06-01 by user via brainstorming skill workflow.
