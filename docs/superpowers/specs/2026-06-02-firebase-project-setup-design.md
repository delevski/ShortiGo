# Firebase Project Setup Design

## Goal

Configure the ShortiGo repo for two new Firebase projects: `shortigo-dev` for development and `shortigo-prod` for production.

## Architecture

Firebase CLI configuration will live at the repo root so deploy commands run from `/Users/corphd/Desktop/Or codes projects/ShortiGo`. Cloud Functions source stays in `cloud_functions/functions`, and root `firebase.json` points to that source directory.

## Project Aliases

- `default`: `shortigo-dev`
- `dev`: `shortigo-dev`
- `prod`: `shortigo-prod`

## Firebase Resources

- Firestore rules are deployed from `firestore.rules`.
- Storage rules are deployed from `storage.rules`.
- Cloud Functions are deployed from `cloud_functions/functions` on Node.js 20.
- Storage CORS is applied with `storage-cors.json`.

## Scripts And Documentation

The repo should include a backend setup guide with exact commands for creating projects, selecting aliases, enabling services, deploying rules/functions, applying CORS, and seeding content.

## Known External Requirements

Firebase project creation, service enablement, OAuth/Auth provider setup, billing, AdMob, RevenueCat, and Sentry still require authenticated account access and console-side configuration.
