# ShortiGo Admin (Cloudinary + Firestore)

Upload videos to Cloudinary from the CRM, then publish episode metadata
into Firestore. No Firebase Storage and no Cloud Functions required.

## Setup

1. Copy `.env.example` to `.env` and fill Firebase web config values.
2. Enable **Google** sign-in in Firebase Auth for project `shortigo-prod`.
3. Sign in once, then copy your Firebase Auth UID from Firebase Console.
4. Create `adminUsers/{yourUid}` in Firestore so rules allow publishing.
5. Create an **unsigned upload preset** in Cloudinary Console.
6. Add Cloudinary values to `.env`:
   - `VITE_CLOUDINARY_CLOUD_NAME`
   - `VITE_CLOUDINARY_UPLOAD_PRESET`
7. Install and run:

```bash
npm install
npm run dev
```

Open: http://localhost:5173/

## How to publish

1. Sign in with Google.
2. Choose an existing series or create a new one.
3. Select video file (and optional thumbnail file).
4. Click **Upload media to Cloudinary** (URLs are filled automatically).
5. Click **Publish episode**.

The app writes `episodes/{seriesId}_e{order}` with fields:
`id`, `seriesId`, `order`, `videoUrl`, `thumbnailUrl`, `durationSec`, `isVipLocked`.
It also creates/updates `series/{seriesId}` and can add the series to
`admin/featured.seriesIds`, which makes new uploads discoverable in the mobile app.

See `docs/crm-upload-schema.md` for the full schema.

## Notes

- `videoUrl` must be a direct playable URL (the mobile app uses it as-is when it starts with `http://` or `https://`).
- Firebase Storage and Cloud Functions are intentionally not required for this Spark/free setup.

## Cloudinary CORS (localhost)

`npm run dev` proxies uploads through Vite so localhost is not blocked by CORS.

If you host the admin app on a real domain later, add that origin in Cloudinary Console:

**Settings → Security → Allowed fetch domains** (e.g. `http://localhost:5173`, your production URL).

## Upload errors & 413 (file too large)

- Toasts and `[ShortiGo Studio]` console logs explain failures (CORS, 413, preset/auth, Firestore).
- **HTTP 413** means Cloudinary rejected the file size. Compress the video or raise **max file size** on your upload preset in Cloudinary Console → Upload presets.
- Optional env limits (checked before upload): `VITE_CLOUDINARY_MAX_VIDEO_MB` (default 100), `VITE_CLOUDINARY_MAX_IMAGE_MB` (default 10).
