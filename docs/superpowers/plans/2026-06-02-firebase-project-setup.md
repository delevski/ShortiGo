# Firebase Project Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up root-level Firebase configuration for the single no-cost ShortiGo Spark project.

**Architecture:** Keep Firebase CLI files at repo root. Deploy only Firestore rules and indexes so the project remains compatible with the Spark plan.

**Tech Stack:** Firebase CLI, Firestore rules, Firestore indexes, FlutterFire config placeholders.

---

### Task 1: Root Firebase CLI Config

**Files:**
- Create: `.firebaserc`
- Create: `firebase.json`
- Create: `firestore.indexes.json`
- Modify: `firebase.json`

- [ ] Create root `.firebaserc` mapping `default` and `prod` to `shortigo-prod`.
- [ ] Create root `firebase.json` with Firestore rules `firestore.rules` and Firestore indexes `firestore.indexes.json`.
- [ ] Remove duplicate Firebase config files from `cloud_functions/`.
- [ ] Run `firebase use prod` from repo root. Expected: active project alias is `prod`.

### Task 2: Spark Project Defaults

**Files:**
- Modify: `lib/bootstrap/firebase_options_dev.dart`
- Modify: `lib/bootstrap/firebase_options_prod.dart`
- Modify: `lib/core/env/env.dart`
- Modify: `tools/seed_firestore.dart`
- Modify: `tools/upload_episode.dart`

- [ ] Point dev and prod placeholders at `shortigo-prod`.
- [ ] Point CLI tool defaults at `shortigo-prod`.
- [ ] Keep Storage tooling as optional future upload support, but do not deploy Storage in Spark mode.

### Task 3: Docs And Function Script

**Files:**
- Modify: `README.md`
- Modify: `cloud_functions/functions/package.json`
- Modify: `docs/release-checklist-v1.md`

- [ ] Update README backend setup to use root Firebase config and one Spark project.
- [ ] Update release checklist to remove Blaze/billing requirements.

### Task 4: Verify And Commit

**Files:**
- All modified setup files.

- [ ] Run `firebase projects:list`.
- [ ] Select `shortigo-prod`.
- [ ] Run `firebase deploy --only firestore:rules,firestore:indexes`.
- [ ] Run `npm run build` in `cloud_functions/functions`.
- [ ] Commit all repo-side Firebase setup changes.
