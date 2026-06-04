# SR-PTD - Provider RBAC and audit trail (ShortiGo CRM)

## Quick capture

- **Date**: 2026-06-02
- **Type**: Feature
- **Trigger**: Multi-tenant provider uploads with isolation, no provider delete, super-admin provider onboarding, activity trace.

## Workflow

1. Extended `firestore.rules` with `isSuperAdmin` / `isProvider`, ownership on `series`/`episodes`, `providers` + `adminUsers` super-admin writes, `auditEvents` append-only.
2. Added `studioAccess.ts`, scoped queries, provider-prefixed series IDs, ownership stamping on publish.
3. CRM tabs: Providers (create/link/deactivate), Activity (auditEvents).
4. Cloudinary delete API: Bearer Firebase token + JWT verify + Firestore role check (super admin only).

## Key files

- `firestore.rules`, `firestore.indexes.json`
- `admin/src/lib/studioAccess.ts`, `auditLog.ts`, `providersFirestore.ts`
- `admin/src/components/ProvidersAdmin.tsx`, `ActivityLog.tsx`
- `admin/vite-verify-studio-token.ts`, `admin/vite-plugin-cloudinary-admin.ts`

## Verify

Deploy rules/indexes; run checklist in `admin/README.md`.
