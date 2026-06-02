# Firebase Project Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up root-level Firebase configuration for new ShortiGo dev/prod projects.

**Architecture:** Keep Firebase CLI files at repo root. Point Functions to `cloud_functions/functions`, Firestore to `firestore.rules`, and Storage to `storage.rules`.

**Tech Stack:** Firebase CLI, Firestore rules, Firebase Storage rules, Cloud Functions Node.js 20, FlutterFire config placeholders.

---

### Task 1: Root Firebase CLI Config

**Files:**
- Create: `.firebaserc`
- Create: `firebase.json`
- Create: `firestore.indexes.json`
- Delete: `cloud_functions/.firebaserc`
- Delete: `cloud_functions/firebase.json`

- [ ] Create root `.firebaserc` mapping `default` and `dev` to `shortigo-dev`, and `prod` to `shortigo-prod`.
- [ ] Create root `firebase.json` with Functions source `cloud_functions/functions`, Firestore rules `firestore.rules`, Firestore indexes `firestore.indexes.json`, and Storage rules `storage.rules`.
- [ ] Remove duplicate Firebase config files from `cloud_functions/`.
- [ ] Run `firebase use dev` from repo root. Expected: active project alias is `dev`.

### Task 2: Storage Rules And Project Defaults

**Files:**
- Create: `storage.rules`
- Modify: `lib/bootstrap/firebase_options_prod.dart`

- [ ] Add read-only public Storage rules for published media under `series/**`; deny client writes.
- [ ] Update prod placeholder Firebase project ID/storage bucket to `shortigo-prod`.

### Task 3: Docs And Function Script

**Files:**
- Modify: `README.md`
- Modify: `cloud_functions/functions/package.json`
- Modify: `docs/release-checklist-v1.md`

- [ ] Update README backend setup to use root Firebase config and new project IDs.
- [ ] Update Functions deploy script so `npm run deploy` runs Firebase deploy from repo root.
- [ ] Update release checklist to reflect root config and `shortigo-prod`.

### Task 4: Verify And Commit

**Files:**
- All modified setup files.

- [ ] Run `firebase projects:list`.
- [ ] Attempt to create or select `shortigo-dev` and `shortigo-prod`.
- [ ] Run `firebase deploy --only firestore:rules,storage`.
- [ ] Run `npm run build` in `cloud_functions/functions`.
- [ ] Commit all repo-side Firebase setup changes.
