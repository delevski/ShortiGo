# ShortiGo Admin (Cloudinary + Firestore)

Upload videos to Cloudinary from the CRM, then publish episode metadata
into Firestore. No Firebase Storage and no Cloud Functions required.

## Setup

1. Copy `.env.example` to `.env` and fill Firebase web config values.
2. Enable **Google** sign-in in Firebase Auth for project `shortigo-prod`.
3. Sign in once, then copy your Firebase Auth UID from Firebase Console.
4. Create `adminUsers/{yourUid}` in Firestore (no `role` field = **super admin**) so rules allow publishing.
5. Deploy Firestore rules and indexes from the repo root: `firebase deploy --only firestore:rules,firestore:indexes`
6. Create an **unsigned upload preset** in Cloudinary Console.
7. Add Cloudinary values to `.env`:
   - `VITE_CLOUDINARY_CLOUD_NAME`
   - `VITE_CLOUDINARY_UPLOAD_PRESET`
8. Install and run:

```bash
npm install
npm run dev
```

Open: http://localhost:5173/

## Media library

Use the **Media library** tab to see all published episodes (thumbnail grid grouped by series).

Deleting an episode removes:

- the `episodes/{id}` document in Firestore
- the video (and thumbnail) assets in Cloudinary

Deleting a whole series removes all its episodes plus the `series/{id}` document.

For Cloudinary deletes, add to `admin/.env` (not `VITE_` — server-only):

- `CLOUDINARY_CLOUD_NAME` (or reuse `VITE_CLOUDINARY_CLOUD_NAME`)
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Restart `npm run dev` after adding keys. Deletes use a local API route (`/api/cloudinary/delete`) and work with `npm run dev` / `npm run preview`, not on a static-only host unless you add a backend.

**Delete auth:** the delete API requires a signed-in **super admin** Firebase ID token (`Authorization: Bearer …`). Provider accounts cannot delete in the UI or via rules.

## Roles: super admin vs provider

| Capability | Super admin | Provider |
|------------|-------------|----------|
| Upload & publish | Yes | Yes (own catalog only) |
| Edit / replace own episodes | Yes | Yes |
| Delete Firestore / Cloudinary | Yes | No |
| Add to For You (`admin/featured`) | Yes | No |
| Media library scope | All content | Own `providerId` only |
| Providers tab | Yes | No |
| Activity log | Yes | No |

### Onboard a provider (CRM)

1. Sign in as super admin → **Providers** tab.
2. **Create provider** (e.g. ID `acme_studios`, display name).
3. Ask the partner to sign in with Google once; they copy **UID** from the auth card (or Firebase Console).
4. **Link user** with that UID to the provider org.

Provider uploads use series IDs prefixed with `{providerId}_` (e.g. `acme_studios_my_show`) so catalogs stay separated.

### Manual Firestore (optional)

- `adminUsers/{uid}`: `{ "role": "provider", "providerId": "acme_studios", "active": true, "email": "…" }`
- Super admin: document with no `role` or `"role": "superAdmin"`

## Activity log

Super admins can open **Activity** to review append-only `auditEvents` (sign-in, uploads, publishes, deletes, provider admin). Events are written by the CRM and constrained by security rules.

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

## Verification checklist (RBAC)

1. Deploy rules/indexes; restart `npm run dev`.
2. Create provider + link a second Google account.
3. Provider publishes to `providerId_test_series` — only their library/upload lists show it.
4. Provider cannot delete; super admin can.
5. Activity tab shows `episode.publish` and `auth.sign_in` events.
6. Provider cannot toggle “Add to For You”.
