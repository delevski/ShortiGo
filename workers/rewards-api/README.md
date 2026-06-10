# ShortiGo Rewards API

Trusted reward and permanent episode-unlock writes for Firebase Spark.

This project is designed for **Cloudflare Workers Free**. Do not enable Workers
Paid and do not enter a payment card for this setup.

## Local verification

```bash
npm install
npm test
```

## Required secrets

```bash
npx wrangler secret put FIREBASE_CLIENT_EMAIL
npx wrangler secret put FIREBASE_PRIVATE_KEY
```

Deploy with `npm run deploy`, then build the mobile app with
`REWARD_API_BASE_URL` set to the Worker URL.
