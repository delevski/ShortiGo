import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { appendLedgerAndApply } from './lib/ledger';

const CHECK_IN_COOLDOWN_MS = 20 * 60 * 60 * 1000;
const CHECK_IN_BONUS = 5;

export const grantDailyCheckIn = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required');
  }

  const userId = request.auth.uid;
  const userRef = admin.firestore().collection('users').doc(userId);
  const snap = await userRef.get();
  const lastCheckIn = snap.get('lastDailyCheckIn') as
    | admin.firestore.Timestamp
    | undefined;
  const now = admin.firestore.Timestamp.now();

  if (
    lastCheckIn &&
    now.toMillis() - lastCheckIn.toMillis() < CHECK_IN_COOLDOWN_MS
  ) {
    throw new HttpsError('failed-precondition', 'Already claimed today');
  }

  await userRef.update({ lastDailyCheckIn: now });
  await appendLedgerAndApply({
    userId,
    type: 'dailyCheckIn',
    coinsDelta: 0,
    bonusDelta: CHECK_IN_BONUS,
    reference: 'dailyCheckIn',
  });

  return { ok: true, bonusDelta: CHECK_IN_BONUS };
});
