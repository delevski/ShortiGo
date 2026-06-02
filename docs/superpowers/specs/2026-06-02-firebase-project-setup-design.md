# Firebase Project Setup Design

## Goal

Configure the ShortiGo repo for one no-cost Firebase Spark project: `shortigo-prod`.

## Architecture

Firebase CLI configuration lives at the repo root so deploy commands run from `/Users/corphd/Desktop/Or codes projects/ShortiGo`. Root `firebase.json` deploys only Firestore rules and indexes, which keeps the project compatible with the Spark plan.

## Project Aliases

- `default`: `shortigo-prod`
- `prod`: `shortigo-prod`

## Firebase Resources

- Firestore rules are deployed from `firestore.rules`.
- Storage rules and CORS are not deployed in Spark mode.
- Cloud Functions are kept in the repository for a future paid production backend, but the app does not call them in Spark mode.
- Reward and VIP flows are demo-only client-side behavior in Spark mode.

## Scripts And Documentation

The repo should include a backend setup guide with exact commands for selecting the project, deploying Firestore rules/indexes, and seeding content.

## Known External Requirements

Firebase project creation, OAuth/Auth provider setup, AdMob, RevenueCat, and Sentry still require authenticated account access and console-side configuration. Billing is intentionally out of scope for this Spark-only setup.
