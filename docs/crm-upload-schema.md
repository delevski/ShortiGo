# CRM Upload Schema Contract

This document locks the Firestore contract for CRM uploads.
Any dashboard or backend writer must follow this format exactly.

## Firestore Collection: `episodes`

Document ID:
- `{seriesId}_e{order}`

Required fields and types:
- `id` (string) - same value as document ID
- `seriesId` (string)
- `order` (number/integer, `>= 1`)
- `videoUrl` (string) - direct `https://` URL or Firebase Storage path
- `thumbnailUrl` (string) - public image URL
- `durationSec` (number/integer, `> 0`)
- `isVipLocked` (boolean)

Optional (CRM provider ownership — mobile app ignores extra fields):

- `providerId` (string) — set on create; immutable
- `createdByUid` (string) — Firebase Auth UID; immutable
- `cloudinaryVideoPublicId` (string) — Cloudinary public id for indexed duplicate checks; immutable after create
- `cloudinaryThumbPublicId` (string) — optional thumbnail public id; immutable after create

Example:

```json
{
  "id": "s_seed_0_e1",
  "seriesId": "s_seed_0",
  "order": 1,
  "videoUrl": "https://res.cloudinary.com/example/video/upload/c_fill,ar_9:16/sample",
  "thumbnailUrl": "https://res.cloudinary.com/example/image/upload/sample.jpg",
  "durationSec": 60,
  "isVipLocked": false
}
```

## Firestore Collection: `series`

Document ID:
- `{seriesId}`

Required fields for mobile discovery:
- `id` (string) - same value as document ID
- `title` (string)
- `description` (string)
- `coverUrl` (string)
- `category` (string) - one of `new`, `hot`, `adventure`, `scary`, `anime`, `vip`
- `isVip` (boolean)
- `episodeCount` (number/integer)
- `totalDurationSec` (number/integer)
- `createdAt` (timestamp or ISO string)
- `popularity` (number/integer)
- `isPublished` (boolean)

Optional (CRM provider ownership):

- `providerId` (string)
- `createdByUid` (string)

## Firestore: `adminUsers/{uid}`

Studio access for the CRM:

- No `role` or `role: "superAdmin"` — full catalog, delete, featured, provider management
- `role: "provider"` + `providerId` + `active: true` — scoped upload/edit; no delete

## Firestore: `providers/{providerId}`

- `id`, `name`, `active`, optional `notes`, `createdAt`

## Firestore: `auditEvents/{autoId}`

Append-only trace (super admin read; studio users create):

- `action` — e.g. `episode.publish`, `media.delete`, `auth.sign_in`, `provider.link_user`
- `actorUid`, `actorEmail`, `role`, `providerId`
- `targetType`, `targetId`, `seriesId`, `metadata`, `createdAt`

## Firestore Document: `admin/featured`

Required fields:
- `seriesIds` (array of string IDs)

## Compatibility Notes

- Mobile reads episodes by `seriesId` and orders by `order`.
- Playback accepts either:
  - direct URL (`http://` or `https://`), or
  - Firebase Storage path resolved at runtime.
- Keep all field names unchanged to avoid runtime parse failures.

## Spark/Free Publishing

Firebase Storage and Cloud Functions are not required. Publish with direct URLs:

- `videoUrl`: public `https://...` link to an `.mp4` file
- `thumbnailUrl`: public `https://...` link to an image

Use the admin app at `admin/` to upload media to Cloudinary, write `episodes`,
create/update `series`, and optionally add the series to `admin/featured`.
