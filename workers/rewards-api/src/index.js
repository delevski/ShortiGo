import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from "jose";

import { checkUnlock } from "./economy.js";

const firebaseKeys = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

let cachedGoogleToken;

export default {
  async fetch(request, env) {
    try {
      if (request.method === "GET" && new URL(request.url).pathname === "/health") {
        return json({ ok: true, service: "shortigo-rewards-api" });
      }

      const uid = await requireFirebaseUser(request, env);
      const url = new URL(request.url);

      if (
        request.method === "POST" &&
        /^\/v1\/episodes\/[^/]+\/unlock$/.test(url.pathname)
      ) {
        const episodeId = decodeURIComponent(url.pathname.split("/")[3]);
        return unlockEpisode(uid, episodeId, env);
      }

      if (
        request.method === "GET" &&
        ["/v1/rewards/dashboard", "/v1/profile/dashboard"].includes(url.pathname)
      ) {
        const accessToken = await googleAccessToken(env);
        const user = await getDocument(`users/${uid}`, accessToken, env);
        return json({ user: fieldsToJson(user.fields ?? {}) });
      }

      return json({ error: "not_found" }, 404);
    } catch (error) {
      const status = error.status ?? 500;
      return json({ error: error.message ?? "internal_error" }, status);
    }
  },
};

async function requireFirebaseUser(request, env) {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) {
    throw httpError(401, "sign_in_required");
  }
  const token = header.slice(7);
  const issuer = `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`;
  const { payload } = await jwtVerify(token, firebaseKeys, {
    audience: env.FIREBASE_PROJECT_ID,
    issuer,
  });
  if (!payload.sub) {
    throw httpError(401, "invalid_token");
  }
  return payload.sub;
}

async function unlockEpisode(uid, episodeId, env) {
  const accessToken = await googleAccessToken(env);
  const transaction = await beginTransaction(accessToken, env);
  const [userDoc, episodeDoc] = await Promise.all([
    getDocument(`users/${uid}`, accessToken, env, transaction),
    getDocument(`episodes/${episodeId}`, accessToken, env, transaction),
  ]);
  const user = fieldsToJson(userDoc.fields ?? {});
  const episode = fieldsToJson(episodeDoc.fields ?? {});
  const unlocked = Array.isArray(user.unlockedEpisodeIds)
    ? user.unlockedEpisodeIds
    : [];
  if (unlocked.includes(episodeId)) {
    return json({ ok: true, alreadyUnlocked: true });
  }

  const decision = checkUnlock(episode, Number(user.bonus ?? 0));
  if (!decision.ok) {
    throw httpError(409, decision.reason);
  }

  const now = new Date().toISOString();
  const txId = crypto.randomUUID();
  const base = firestoreBase(env);
  const writes = [
    {
      update: {
        name: `${base}/users/${uid}`,
        fields: {
          bonus: { integerValue: String(Number(user.bonus) - decision.cost) },
          unlockedEpisodeIds: {
            arrayValue: {
              values: [...unlocked, episodeId].map((id) => ({ stringValue: id })),
            },
          },
        },
      },
      updateMask: { fieldPaths: ["bonus", "unlockedEpisodeIds"] },
      currentDocument: { updateTime: userDoc.updateTime },
    },
    {
      update: {
        name: `${base}/users/${uid}/transactions/${txId}`,
        fields: jsonToFields({
          id: txId,
          userId: uid,
          type: "spend",
          coinsDelta: 0,
          bonusDelta: -decision.cost,
          reference: `episodeUnlock:${episodeId}`,
          at: now,
        }),
      },
    },
  ];
  await firestoreFetch(":commit", accessToken, env, {
    method: "POST",
    body: JSON.stringify({ transaction, writes }),
  });
  return json({ ok: true, cost: decision.cost, balance: Number(user.bonus) - decision.cost });
}

async function beginTransaction(accessToken, env) {
  const result = await firestoreFetch(":beginTransaction", accessToken, env, {
    method: "POST",
    body: "{}",
  });
  return result.transaction;
}

function getDocument(path, accessToken, env, transaction) {
  const suffix = transaction
    ? `?transaction=${encodeURIComponent(transaction)}`
    : "";
  return firestoreFetch(`/${path}${suffix}`, accessToken, env);
}

async function googleAccessToken(env) {
  if (cachedGoogleToken && cachedGoogleToken.expiresAt > Date.now() + 60_000) {
    return cachedGoogleToken.value;
  }
  const key = await importPKCS8(
    env.FIREBASE_PRIVATE_KEY.replaceAll("\\n", "\n"),
    "RS256",
  );
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({
    scope: "https://www.googleapis.com/auth/datastore",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(env.FIREBASE_CLIENT_EMAIL)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw httpError(500, "service_account_auth_failed");
  }
  cachedGoogleToken = {
    value: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  };
  return cachedGoogleToken.value;
}

function firestoreBase(env) {
  return `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
}

async function firestoreFetch(path, accessToken, env, init = {}) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/${firestoreBase(env)}${path}`,
    {
      ...init,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
        ...init.headers,
      },
    },
  );
  const body = await response.json();
  if (!response.ok) {
    throw httpError(response.status, body.error?.message ?? "firestore_error");
  }
  return body;
}

function fieldsToJson(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, valueToJson(value)]),
  );
}

function valueToJson(value) {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) return (value.arrayValue.values ?? []).map(valueToJson);
  if ("mapValue" in value) return fieldsToJson(value.mapValue.fields ?? {});
  return null;
}

function jsonToFields(value) {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      typeof item === "number"
        ? { integerValue: String(item) }
        : { stringValue: String(item) },
    ]),
  );
}

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function json(value, status = 200) {
  return Response.json(value, { status });
}
